##!/usr/bin/python

#
# ============================================================================
#
#    30.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CRANK2 EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.crank2.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
from   pycofe.proc   import edmap, xyzmeta
from   pycofe.dtypes import dtype_revision, dtype_sequence


# ============================================================================
# Make Crank2 driver

class Crank2(basic.TaskDriver):

    # ------------------------------------------------------------------------
    # class variables

    hkl     = None  # anomalous HKL dataset(s)
    seq     = None  # sequence class
    native  = None  # HKL dataset used as "Native"
    pmodel  = None  # structure class used as "Partial model"
    expType = ""    # principal experimet type: "SAD","SIRAS","MAD"

    sec1    = None  # input parameters from section No.1
    sec3    = None  # input parameters from section No.2
    sec2    = None  # input parameters from section No.3
    sec4    = None  # input parameters from section No.4
    sec5    = None  # input parameters from section No.5
    sec6    = None  # input parameters from section No.6
    sec7    = None  # input parameters from section No.7

    config = []  # lines of crank configuration script

    # redefine id for the report tab, making it the same as one used in
    # Crank2's RVAPI output
    _report_widget_id = "results_tab"

    # redefine name of input script file
    def file_seq_path   (self):  return "crank2.seq"
    def file_stdin_path (self):  return "crank2.script"

    # make definitions for import of mtz files with changed SpG
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    # ------------------------------------------------------------------------
    # script-generating functions

    def add_anomset ( self,dataset ):
        cols = dataset.getAnomalousColumns()
        if cols[4]!="X":
            df   = " f="
            ds   = " sigf="
            if cols[4]=="I":
                df = " i="
                ds = " sigi="
            self.config.append ( "fsigf plus dname=" + dataset.wtype + \
                " file=" + os.path.join(self.inputDir(),dataset.files[0]) + \
                df + cols[0] + ds + cols[1] )
            self.config.append ( "fsigf minus dname=" + dataset.wtype + df + \
                cols[2] + ds + cols[3] )
        return


    def add_nativeset ( self ):
        if self.native:
            cols = self.native.getMeanColumns()
            if cols[2]!="X":
                S = "fsigf average dname=native xname=native file=" + \
                    os.path.join(self.inputDir(),self.native.files[0])
                if cols[2]=="I":
                    S += " i=" + cols[0] + " sigi=" + cols[1]
                else:
                    S += " f=" + cols[0] + " sigf=" + cols[1]
                self.config.append ( S )
        return


    def add_model ( self ):

        if self.pmodel:
            S  = "model "
            if self.getParameter(self.sec6.COMB_PHDMMB_NCS_DET_MR)=="True":
                S += "custom=ncs "
            S += "unknown \"file=" +\
                os.path.join(self.inputDir(),self.pmodel.files[0]) + "\""
        else:
            S = "model substr"

        S += self.getKWItem ( self.sec1.HATOM  ) +\
             self.getKWItem ( self.sec1.NATOMS )

        for hkli in self.hkl:
            S += " d_name=" + hkli.wtype
            if hkli.f1:
                S += " fp=" + hkli.f1
            if hkli.f11:
                S += " fpp=" + hkli.f11

        self.config.append ( S )

        return


    def add_sequence ( self ):
        if len(self.seq)>0:
            #seqNo = self.revision.Options.seqNo
            #s     = self.makeClass ( self.seq[seqNo] )
            #self.config.append ( "sequence" +\
            #    " monomers_asym=" + str(s.nfind) +\
            #    " solvent_content=" + str(self.revision.ASU.solvent/100.0) +\
            #    " file=" + s.getFilePath(self.inputDir()) )
            name     = []
            sequence = []
            ncopies  = []
            for i in range(len(self.seq)):
                name.append ( 'seq' + str(i+1) )
                s = self.makeClass ( self.seq[i] )
                sequence.append ( s.getSequence(self.inputDir()) )
                ncopies.append ( s.ncopies )
            dtype_sequence.writeMultiSeqFile ( self.file_seq_path(),
                                               name,sequence,ncopies )
            self.config.append ( "sequence" +\
                " monomers_asym=1" +\
                " solvent_content=" + str(self.revision.ASU.solvent/100.0) +\
                " file=" + self.file_seq_path() )

        else:
            self.config.append ( "sequence" +\
                " monomers_asym=1" +\
                " solvent_content=" + str(self.revision.ASU.solvent/100.0) +\
                " residues_mon=" + self.revision.ASU.nRes )

        #if self.seq:
        #    self.config.append ( "sequence" +\
        #        self.getKWItem ( self.sec1.MONOMERS_ASYM   ) +\
        #        " solvent_content=" + str(self.revision.ASU.solvent/100.0) +\
        #        " file=" + self.crank2_sequence() )
        #else:
        #    self.config.append ( "sequence" +\
        #        self.getKWItem ( self.sec1.MONOMERS_ASYM   ) +\
        #        " solvent_content=" + str(self.revision.ASU.solvent/100.0) +\
        #        self.getKWItem ( self.sec1.NRES ) )
        return


    def add_createfree ( self ):
        S = "createfree"
        if not self.pmodel:
            S += " no_output_to_next_step::True"
        self.config.append ( S )
        return


    def add_refatompick ( self ):
        self.config.append (
            "refatompick" +\
            self.getKWItem ( self.sec3.REFATOMPICK_NUM_ITER ) +\
            self.getKWItem ( self.sec3.REFATOMPICK_REFCYC   ) +\
            self.getKWItem ( self.sec3.REFATOMPICK_RMS_THRESHOLD )
        )
        return


    def add_sepsubstrprot ( self ):
        self.config.append ( "sepsubstrprot" )
        return


    def add_substrdet ( self ):
        substrdet_pgm = self.getParameter ( self.sec2.SUBSTRDET_PROGRAM )
        if substrdet_pgm=="_blank_":
            substrdet_pgm = ""
        self.config.append (
            "substrdet " +\
            self.getKWItem ( self.sec2.SUBSTRDET_HIGH_RES_CUTOFF_SHELXD ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_HIGH_RES_CUTOFF        ) +\
            self.getKWItem ( self.sec1.NDSULF                           ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_NUM_TRIALS             ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_THRESHOLD_STOP_SHELXD  ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_THRESHOLD_STOP         ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_HIGH_RES_CUTOFF_RADIUS ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_HIGH_RES_CUTOFF_STEP   ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_MIN_DIST_SYMM_ATOMS    ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_MIN_DIST_ATOMS         ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_NUM_ATOMS              ) +\
            " " + substrdet_pgm
        )
        return


    def add_phas ( self ):
        self.config.append ( "phas" )
        return


    def add_faest ( self ):
        substrdet_pgm = self.getParameter ( self.sec2.SUBSTRDET_PROGRAM )
        if substrdet_pgm == "shelxd":
            self.config.append ( "faest shelxc" )
        else:
            faest_pgm = self.getParameter ( self.sec2.FAEST_PROGRAM )
            if faest_pgm=="_blank_":
                self.config.append ( "faest" )
            elif faest_pgm:
                self.config.append ( "faest " + faest_pgm )
            else:
                self.config.append ( "faest shelxc" )
        return


    def add_handdet ( self ):
        if self.pmodel:
            if self.getParameter ( self.sec4.HANDDET_DO ):
                self.config.append ( "handdet" )
        else:
            self.config.append ( "handdet" )
        return


    def add_dmfull ( self ):
        self.config.append ( "dmfull" +\
            self.getKWItem ( self.sec5.DMFULL_DMCYC          ) +\
            self.getKWItem ( self.sec5.DMFULL_THRESHOLD_STOP ) +\
            self.getKWItem ( self.sec5.DMFULL_DM_PROGRAM     ) +\
            self.getKWItem ( self.sec5.DMFULL_PHCOMB_PROGRAM )
        )
        return


    def add_mbref ( self ):
        if self.getParameter(self.sec6.MBREF_EXCLUDE_FREE)=="True" or \
           self.getParameter(self.sec6.MBREF_EXCLUDE_FREE)=="_blank":
            reflections = "exclude obj_from=0,typ=freeR"
        else:
            reflections = ""
        pgm = self.getParameter ( self.sec6.MBREF_MB_PROGRAM )
        if pgm=="_blank_":
            pgm = ""
        elif pgm!="arpwarp":
            pgm = "mb " + pgm
        self.config.append ( "mbref " + reflections +\
            self.getKWItem ( self.sec6.MBREF_BIGCYC ) + " " + pgm
        )
        return


    def add_comb_phdmmb ( self ):
        if self.getParameter(self.sec6.COMB_PHDMMB_DO)!="True":
            self.add_mbref()
        else:
            always_exclude = self.getKWItem(self.sec6.COMB_PHDMMB_ALWAYS_EXCLUDE_FREE)
            if always_exclude.endswith("never"):
                always_exclude = ""
            else:
                always_exclude += " exclude obj_from=0,typ=freeR"
            self.config.append ( "comb_phdmmb" + always_exclude +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_START_SHELXE       ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_SKIP_INITIAL_BUILD ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_REBUILD_ONLY       ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_MINBIGCYC          ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_MAXBIGCYC          ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_NCS_DET            ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_NCS_DET_MR         ) +\
                " mb buccaneer" +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_DMFULL_DM_PROGRAM  )
            )
        return


    def add_ref ( self ):
        self.config.append ( "ref target::MLHL exclude obj_from=0,typ=freeR" )
        return


    # ------------------------------------------------------------------------

    def configure ( self ):

        # --------------------------------------------------------------------
        # Make crank-2 configuration

        # Identify the type of experiment

        self.expType = "SAD"
        if len(self.hkl) > 1:
            self.expType = "MAD"
        elif self.native != None:
            if self.native.useForPhasing:
                self.expType = "SIRAS"

        # Put input datasets and experiment type

        for hkli in self.hkl:
            self.add_anomset ( hkli )

        self.add_nativeset ()

        self.config.append ( "target::" + self.expType )

        self.add_model     ()
        self.add_sequence  ()

        # configure the pipeline

        if self.pmodel:

            self.add_createfree ()
            self.add_refatompick()
            if self.getParameter(self.sec1.PARTIAL_AS_SUBSTR):
                self.add_sepsubstrprot()
                self.add_phas         ()
                self.add_dmfull       ()
            self.add_comb_phdmmb()

        else:

            self.add_createfree()
            self.add_faest     ()
            self.add_substrdet ()

            if self.expType == "MAD":

                self.add_phas   ()
                self.add_handdet()
                self.add_dmfull ()
                self.add_mbref  ()
                self.add_ref    ()

            elif self.expType == "SIRAS":

                self.add_phas   ()
                self.add_handdet()
                self.add_dmfull ()
                self.add_mbref  ()
                self.add_ref    ()

            else:

                self.add_refatompick()
                self.add_handdet    ()
                self.add_dmfull     ()
                self.add_comb_phdmmb()
                self.add_ref        ()

        return

    # ------------------------------------------------------------------------

    def finalise ( self,structure=None ):
        # ========================================================================
        # check solution and register data

        self.structure = structure
        #if not structure:
        self.rvrow += 20

        if os.path.isfile(self.xyzout_fpath):

            # get xyz metadata for checking on changed space group below
            meta = xyzmeta.getXYZMeta ( self.xyzout_fpath,self.file_stdout,
                                        self.file_stderr )

            # register output data
            if not structure:
                self.structure = self.registerStructure1 (
                                self.xyzout_fpath,self.hklout_fpath,
                                self.hklout_fpath + ".map",
                                self.hklout_fpath + "_diff.map",
                                None,
                                self.outputFName )

            if self.structure:

                if self.native:
                    hkl_all = []
                    hkl_all += self.hkl
                    self.native.wtype = "native"
                    hkl_all.append ( self.native )
                else:
                    hkl_all = self.hkl

                if self.seq:
                    for s in self.seq:
                        self.structure.addDataAssociation ( s.dataId )
                if self.task._type=="TaskShelxSubstr":
                    self.structure.setSubstrSubtype() # substructure
                    #self.structure.setBP3Labels()
                else:
                    self.structure.addXYZSubtype()
                    self.structure.setCrank2Labels()
                    #self.structure.setRefmacLabels ( hkl_all[0] )
                    #self.structure.FP         = "REFM_F"
                    #self.structure.SigFP      = "REFM_SIGF"
                    #self.structure.FreeR_flag = "FREER"
                self.structure.addEPSubtype()

                if len(hkl_all)==1:
                    self.putTitle ( "Structure Revision" )
                else:
                    self.putTitle ( "Structure Revisions" )

                # fetch r-factors for display in job tree
                fileref = os.path.join ( self.reportDir(),"7-ref","ref.log" )
                rfree_pattern   = "R-free factor after refinement is "
                rfactor_pattern = "R factor after refinement is "
                rfree   = 0.0
                rfactor = 0.0
                if os.path.isfile(fileref):
                    with open(fileref,'r') as f:
                        for line in f:
                            if line.startswith(rfree_pattern):
                                rfree   = float(line.replace(rfree_pattern,""))
                            if line.startswith(rfactor_pattern):
                                rfactor = float(line.replace(rfactor_pattern,""))
                if rfree>0.0 and rfactor>0.0:
                    self.generic_parser_summary["refmac"] = {
                        'R_factor' : rfactor,
                        'R_free'   : rfree
                    }

                # check if space group has changed
                hkl_sol = None
                if "cryst" in meta:
                    sol_spg = meta["cryst"]["spaceGroup"]
                    hkl_sol = self.checkSpaceGroupChanged1 ( sol_spg,hkl_all )

                if not hkl_sol:
                    hkl_sol = hkl_all

                self.putMessage ( "&nbsp;" )
                if len(hkl_all)>1:
                    self.putMessage (
                        "<b><i>New structure revision name for:<br>&nbsp;</i></b>" )

                gridId = "revision_" + str(self.widget_no)
                self.widget_no += 1
                pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),
                                         self.rvrow,0,1,1 )
                self.rvrow += 1

                for i in range(len(hkl_all)):

                    # make structure revision
                    revision = dtype_revision.DType ( -1 )
                    revision.copy ( self.revision )
                    revision.setReflectionData ( hkl_sol[i]    )
                    revision.setStructureData  ( self.structure )

                    if len(hkl_all)==1:
                        revision.makeRevDName  ( self.job_id,i+1,self.outputFName )
                        self.putRevisionWidget ( gridId,i,
                            "<b><i>New structure revision name:</i></b>",revision )
                    else:
                        revision.makeRevDName ( self.job_id,i+1,
                            self.outputFName + " (" + hkl_all[i].wtype + ")" )
                        self.putRevisionWidget ( gridId,i,"<b><i>" +\
                            hkl_all[i].wtype + " dataset:</i></b>",revision )

                    revision.register ( self.outputDataBox )

            else:
                self.putTitle ( "Failed to created output data object" )

        else:
            self.putTitle ( "Output file(s) not created" )

        self.putMessage ( "&nbsp;" )
        self.flush()

        return


    # ------------------------------------------------------------------------

    def run(self):

        # --------------------------------------------------------------------
        # Prepare crank2 input
        # fetch input data
        self.revision = self.makeClass ( self.input_data.data.revision[0] )
        self.hkl      = self.input_data.data.hkl

        # convert dictionaries into real classes; this is necessary because we want
        # to use class's functions and not just access class's data fields
        for i in range(len(self.hkl)):
            self.hkl[i] = self.makeClass ( self.hkl[i] )

        if hasattr(self.input_data.data,"seq"):  # optional data parameter?
            #self.seq = self.input_data.data.seq
            #self.makeFullASUSequenceFile ( self.seq,"prepared_for_crank2",self.crank2_sequence() )
            self.seq = self.input_data.data.seq
            #with open(self.crank2_sequence(),'wb') as newf:
            #    for s in self.seq:
            #        s1 = self.makeClass ( s )
            #        with open(s1.getFilePath(self.inputDir()),'rb') as hf:
            #            newf.write(hf.read())
            #        newf.write ( '\n' );

        if hasattr(self.input_data.data,"native"):  # optional data parameter
            self.native = self.makeClass ( self.input_data.data.native[0] )

        if hasattr(self.input_data.data,"pmodel"):  # optional data parameter
            if hasattr(self.input_data.data.pmodel[0],"visible"):
                if self.input_data.data.pmodel[0].visible:
                    self.pmodel = self.makeClass ( self.input_data.data.pmodel[0] )

        # --------------------------------------------------------------------
        # make shortcuts to folders with input parameters

        self.sec1 = self.task.parameters.sec1.contains
        self.sec2 = self.task.parameters.sec2.contains
        self.sec3 = self.task.parameters.sec3.contains
        self.sec4 = self.task.parameters.sec4.contains
        self.sec5 = self.task.parameters.sec5.contains
        self.sec6 = self.task.parameters.sec6.contains
        self.sec7 = self.task.parameters.sec7.contains

        # --------------------------------------------------------------------
        # Make crank-2 configuration

        self.configure()

        # write configuration in stdin file

        self.open_stdin()
        for line in self.config:
            self.write_stdin ( line + "\n" )
        self.close_stdin()

        # --------------------------------------------------------------------
        # Prepare output page

        self.flush()
        self.storeReportDocument ( "" )

        self.xyzout_fpath = os.path.join ( os.getcwd(),self.outputDir(),self.stampFileName(1,self.getXYZOFName()) )
        self.hklout_fpath = os.path.join ( os.getcwd(),self.outputDir(),self.stampFileName(1,self.getMTZOFName()) )

        # make command-line parameters
        cmd = [
            os.path.join(os.environ["CCP4"],"share","ccp4i","crank2","crank2.py"),
            "--xyzout"          ,self.xyzout_fpath,
            "--hklout"          ,self.hklout_fpath,
            "--dirout"          ,"report",
            "--rvapi-viewer"    ,"0",
            "--rvapi-uri-prefix","./",
            "--rvapi-document"  ,os.path.join ( os.getcwd(),self.reportDocumentName() ),
            "--rvapi-no-tree"
        ]

        # run crank-2

        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd )
        else:
            self.runApp ( "ccp4-python",cmd )

        self.restoreReportDocument()
        #pyrvapi.rvapi_reset_task()

        self.finalise()

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Crank2 ( "",os.path.basename(__file__),{} )
    drv.start()
