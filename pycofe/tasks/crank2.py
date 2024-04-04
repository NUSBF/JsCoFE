##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CRANK2 EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.crank2.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  report/2-substrdet/fixsubstrpdb/heavy.pdb

#  python native imports
import os
import sys
import shutil
import json

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.proc    import edmap, xyzmeta, verdict
from   pycofe.dtypes  import dtype_template, dtype_revision, dtype_sequence
from   pycofe.auto    import auto,auto_workflow

# ============================================================================
# Make Crank2 driver

class Crank2(basic.TaskDriver):

    # ------------------------------------------------------------------------
    # class variables

    hkl          = None  # anomalous HKL dataset(s)
    seq          = None  # sequence class
    native       = None  # HKL dataset used as "Native"
    pmodel       = None  # structure class used as "Partial model"
    substructure = None  # structure class with input substructure
    expType      = ""    # principal experimet type: "SAD","SIRAS","MAD"

    sec1   = None  # input parameters from section No.1
    sec3   = None  # input parameters from section No.2
    sec2   = None  # input parameters from section No.3
    sec4   = None  # input parameters from section No.4
    sec5   = None  # input parameters from section No.5
    sec6   = None  # input parameters from section No.6
    sec7   = None  # input parameters from section No.7

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
                " file=" + dataset.getHKLFilePath(self.inputDir()) + \
                df + cols[0] + ds + cols[1] )
            self.config.append ( "fsigf minus dname=" + dataset.wtype + df + \
                cols[2] + ds + cols[3] )
        return


    def add_nativeset ( self ):
        if self.native:
            cols = self.native.getMeanColumns()
            if cols[2]!="X":
                S = "fsigf average dname=native xname=native file=" + \
                    self.native.getHKLFilePath(self.inputDir())
                if cols[2]=="I":
                    S += " i=" + cols[0] + " sigi=" + cols[1]
                else:
                    S += " f=" + cols[0] + " sigf=" + cols[1]
                self.config.append ( S )
        return


    def add_model ( self ):

        ha_type = self.revision.ASU.ha_type.upper()

        substr_spec = ""
        for hkli in self.hkl:
            substr_spec += " d_name=" + hkli.wtype
            if hkli.f1:
                substr_spec += " fp=" + hkli.f1
            if hkli.f11:
                substr_spec += " fpp=" + hkli.f11

        if self.substructure:
            S  = "model substr atomtype=" + ha_type + substr_spec +\
                 " \"file=" + self.substructure.getSubFilePath(self.inputDir()) +\
                 "\""
        else:
            S = "model substr atomtype=" + ha_type  +\
                self.getKWItem ( self.sec1.NATOMS ) + substr_spec
        self.config.append ( S )

        if self.pmodel:
            S  = "model "
            if self.getParameter(self.sec6.COMB_PHDMMB_NCS_DET_MR)=="True":
                S += "custom=ncs "
            S += "unknown \"file=" + self.pmodel.getPDBFilePath(self.inputDir()) +\
                 "\" atomtype=" + ha_type
            self.config.append ( S )

        return


    def add_sequence ( self ):
        solvent_content = self.getParameter ( self.sec1.SOLVENT_CONTENT )
        if not solvent_content:
            solvent_content = self.revision.ASU.solvent/100.0
        if len(self.seq)>0:
            name     = []
            sequence = []
            ncopies  = []
            #monomers_asym = 0
            for i in range(len(self.seq)):
                name.append ( 'seq' + str(i+1) )
                s = self.makeClass ( self.seq[i] )
                sequence.append ( s.getSequence(self.inputDir()) )
                ncopies.append ( s.ncopies )
                #monomers_asym += s.ncopies
            dtype_sequence.writeMultiSeqFile ( self.file_seq_path(),
                                               name,sequence,ncopies )
            self.config.append ( "sequence" +\
            #    " monomers_asym=" + str(monomers_asym) +\
                " monomers_asym=1"  +\
                " solvent_content=" + str(solvent_content) +\
                " file=" + self.file_seq_path()
            )

        else:
            self.config.append ( "sequence" +\
                " monomers_asym=1"  +\
                " solvent_content=" + str(solvent_content) +\
                " residues_mon="    + str(self.revision.ASU.nRes)
            )

        return


    def add_createfree ( self ):
        return
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
        if not substrdet_pgm or substrdet_pgm=="_blank_":
            if self.task._type=="TaskShelxAuto":
                substrdet_pgm = "shelxd"
            else:
                substrdet_pgm = ""
        ndisulph = self.revision.ASU.ndisulph
        if ndisulph or ndisulph==0:
            ndisulph = " num_dsul::" + str(ndisulph)
        self.config.append (
            "substrdet " +\
            self.getKWItem ( self.sec2.SUBSTRDET_HIGH_RES_CUTOFF_SHELXD ) +\
            self.getKWItem ( self.sec2.SUBSTRDET_HIGH_RES_CUTOFF        ) +\
            ndisulph +\
            #self.getKWItem ( self.sec1.NDSULF                           ) +\
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
        if not self.pmodel:
            if self.getParameter(self.sec4.HANDDET_DO)=="True":
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


    def get_exclude ( self ):
        return "exclude free=" + self.hkl[0].getFreeRColumn() +\
                    " \"file=" + self.hkl[0].getHKLFilePath(self.inputDir()) + "\""

    def add_mbref ( self ):
        exclude_free = self.getParameter ( self.sec6.MBREF_EXCLUDE_FREE )
        reflections  = ""
        if exclude_free=="True" or exclude_free=="_blank_":
            #reflections = "exclude obj_from=0,typ=freeR"
            reflections = self.get_exclude()
        pgm = self.getParameter ( self.sec6.MBREF_MB_PROGRAM )
        if pgm=="_blank_":
            pgm = ""
        elif pgm!="arpwarp":
            pgm = "mb " + pgm
            #if pgm=="buccaneer" and self.getParameter(self.sec1.SELEN_CBX)=="True":
            #    pgm += " -build-semet"
        self.config.append ( "mbref " + reflections +\
            self.getKWItem ( self.sec6.MBREF_BIGCYC ) + " " + pgm
        )
        return


    # PHDMMB_BIGCYC,PHDMMB_DMCYC

    def add_comb_phdmmb ( self ):
        if self.getParameter(self.sec6.COMB_PHDMMB_DO)!="True":
            self.add_mbref()
        else:
            always_exclude = self.getKWItem(self.sec6.COMB_PHDMMB_ALWAYS_EXCLUDE_FREE)
            if always_exclude.endswith("never"):
                always_exclude = ""
            else:
                #always_exclude += " exclude obj_from=0,typ=freeR"
                always_exclude += " " + self.get_exclude()
            #semet = ""
            #if self.getParameter(self.sec1.SELEN_CBX)=="True":
            #    semet = " -build-semet"
            self.config.append ( "comb_phdmmb" + always_exclude +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_START_SHELXE       ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_SKIP_INITIAL_BUILD ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_REBUILD_ONLY       ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_MINBIGCYC          ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_MAXBIGCYC          ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_NCS_DET            ) +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_NCS_DET_MR         ) +\
                self.getKWItem ( self.sec6.BUILD_LEVEL                    ) +\
                " mb buccaneer" +\
                self.getKWItem ( self.sec6.COMB_PHDMMB_DMFULL_DM_PROGRAM  )
            )
            #                " num_parallel::" + " mb buccaneer" +\
        return


    def add_ref ( self ):
        #self.config.append ( "ref target::MLHL exclude obj_from=0,typ=freeR" )
        self.config.append ( "ref target::MLHL " + self.get_exclude() )
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
            if self.revision.Structure.removeNonAnom:
                self.add_sepsubstrprot()
                self.add_phas         ()
                self.add_dmfull       ()
            self.add_comb_phdmmb()
            self.add_ref        ()

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

    def pickHKL ( self ):
        hkls = None
        for hkli in self.hkl:
            if not hkls:
                hkls = hkli
            elif hkli.wtype=="peak":
                hkls = hkli
                break
            elif hkli.wtype=="inflection":
                hkls = hkli
        return hkls

    # ------------------------------------------------------------------------

    def finalise ( self,structure=None ):
        # ========================================================================
        # check solution and register data

        self.structure = structure
        #if not structure:
        self.rvrow += 20

        revisions = []

        xyzout = None
        subout = None
        if self.task._type=="TaskShelxSubstr":
            #subout = self.xyzout_fpath
            subout = self.subout_fpath
        else:
            xyzout = self.xyzout_fpath

        if os.path.isfile(self.xyzout_fpath):

            vrow = self.rvrow

            self.rvrow += 4

            # get xyz metadata for checking on changed space group below
            meta = xyzmeta.getXYZMeta ( self.xyzout_fpath,self.file_stdout,
                                        self.file_stderr )

            # register output data
            if not structure:
                self.structure = self.registerStructure1 (  ###
                                        self.outputFName,
                                        None,
                                        xyzout,
                                        subout,
                                        self.hklout_fpath,
                                        leadKey = 1,
                                        refiner = "refmac" 
                                    )

            if self.structure:

                #  make a list of all used datasets, each one will be used
                #  for making an individual revision; sort the list such that
                #  the most probable revision for taking downstream is on
                #  top of the list
                hkl_all_0  = []
                hkl_all_0 += self.hkl
                sort_order = ["peak","inflection","native","low-remote","high-remote"]
                if self.native:
                    self.native.wtype = "native"
                    hkl_all_0.append ( self.native )
                    if self.native.useForPhasing:
                        sort_order = ["native","peak","inflection","low-remote","high-remote"]
                hkl_all = []
                for wtype in sort_order:
                    for i in range(len(hkl_all_0)):
                        if hkl_all_0[i].wtype==wtype:
                            hkl_all.append ( hkl_all_0[i] )
                            break

                if self.seq:
                    for s in self.seq:
                        self.structure.addDataAssociation ( s.dataId )

                if self.task._type!="TaskShelxSubstr":
                    hkls = self.pickHKL()
                    self.structure.addPhasesSubtype()
                    self.structure.setCrank2Labels ( hkls )
                    ### sub_path = os.path.join ( self.reportDir(),"2-substrdet","fixsubstrpdb","heavy.pdb" )
                    substrdir = [f for f in os.listdir(self.reportDir()) if f.endswith("-substrdet")]
                    if len(substrdir)>0:
                        #sub_path = os.path.join ( self.reportDir(),substrdir[0],"fixsubstrpdb","heavy.pdb" )
                        sub_path = self.subout_fpath
                        if os.path.isfile(sub_path):
                            #self.rvrow += 20
                            self.putTitle ( "Heavy Atom Substructure" )
                            substructure = self.finaliseStructure ( sub_path,
                                        self.outputFName,hkls,None,[],1,
                                        leadKey=1, # openState="closed",
                                        title="" )
                            if not substructure:
                                self.putMessage ( "<b><i>Failed to form heavy atom substructure object</i></b>" )
                            else:
                                # finalise output revision(s)
                                # remove Refmac results from substructure:
                                shutil.copy2 ( hkls.getHKLFilePath(self.inputDir()),self.outputDir() )
                                xyz_file = substructure.getSubFileName()
                                substructure.removeFiles()
                                substructure.setSubFile ( xyz_file )
                                substructure.setMTZFile ( hkls.getHKLFileName() )
                                substructure.removeRefmacLabels()
                                substructure.removeSubtype ( dtype_template.subtypePhases() )
                        else:
                            self.putTitle ( "No heavy atom substructure found" )

                title = "Structure Revision"
                if len(hkl_all)>1:
                    title += "s"
                self.putTitle ( title + self.hotHelpLink ( "Structure Revision",
                                                    "jscofe_qna.structure_revision") )

                # fetch r-factors for display in job tree
                refdir = [f for f in os.listdir(self.reportDir()) if f.endswith("-ref")]
                if len(refdir)>0:
                    rfree_pattern   = "R-free factor after refinement is "
                    rfactor_pattern = "R factor after refinement is "
                    rfree   = 0.0
                    rfactor = 0.0
                    fileref = os.path.join ( self.reportDir(),refdir[0],"ref.log" )
                    if os.path.isfile(fileref):
                        with open(fileref,'r') as f:
                            for line in f:
                                if line.startswith(rfree_pattern):
                                    rfree   = float(line.replace(rfree_pattern,""))
                                if line.startswith(rfactor_pattern):
                                    rfactor = float(line.replace(rfactor_pattern,""))
                    tdict = None
                    if rfree>0.0 and rfactor>0.0:
                        self.generic_parser_summary["refmac"] = {
                            'R_factor' : rfactor,
                            'R_free'   : rfree
                        }
                        tdict = {
                            "title": "Summary",
                            "state": 0, "class": "table-blue", "css": "text-align:right;",
                            "rows" : [
                                { "header": { "label": "R-factor", "tooltip": "Work R-factor"},
                                  "data"  : [ str(rfactor) ]},
                                { "header": { "label": "R<sub>free</sub>", "tooltip": "Free R-factor"},
                                  "data"  : [ str(rfree) ]}
                            ]
                        }

                    try:
                        with open(os.path.join(self.reportDir(),"verdict1"),"r") as f:
                            vscore   = int(100.0*float(f.read()))
                        with open(os.path.join(self.reportDir(),"verdict2"),"r") as f:
                            vmessage = f.read()
                        with open(os.path.join(self.reportDir(),"verdict3"),"r") as f:
                            vbottomline = f.read()
                        self.putMessage1 ( self.report_page_id(),"&nbsp;",vrow )
                        verdict.makeVerdictSection ( self,tdict,vscore,vmessage,
                                                     vbottomline,row=vrow+1 )
                    except:
                        pass


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

                gridId = self.getWidgetId ( "revision" )
                pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),
                                         self.rvrow,0,1,1 )
                self.rvrow += 1

                for i in range(len(hkl_all)):

                    # make structure revision
                    revision = dtype_revision.DType ( -1 )
                    revision.copy ( self.revision )
                    revision.setReflectionData ( hkl_sol[i]     )
                    revision.setStructureData  ( self.structure )

                    if len(hkl_all)==1:
                        revision.makeRevDName  ( self.job_id,i+1,self.outputFName )
                        self.putRevisionWidget ( gridId,i,
                            "New structure revision name:",revision )
                    else:
                        revision.makeRevDName ( self.job_id,i+1,
                            self.outputFName + " (" + hkl_all[i].wtype + ")" )
                        self.putRevisionWidget ( gridId,i,hkl_all[i].wtype +\
                            " dataset:",revision )

                    revision.register ( self.outputDataBox )
                    revisions.append ( revision )

            else:
                self.putTitle ( "Failed to create output data object" )

        else:
            self.putTitle ( "Output file(s) not created" )

        self.putMessage ( "&nbsp;" )
        self.flush()

        return revisions


    # ------------------------------------------------------------------------

    def run(self):

        # --------------------------------------------------------------------
        # Prepare crank2 input
        # fetch input data
        self.revision = self.makeClass ( self.input_data.data.revision[0] )
        self.hkl      = self.input_data.data.hklrev

        if hasattr(self.input_data.data,"hkl"):  # optional data parameter?
            self.hkl += self.input_data.data.hkl

        # convert dictionaries into real classes; this is necessary because we want
        # to use class's functions and not just access class's data fields
        for i in range(len(self.hkl)):
            self.hkl[i] = self.makeClass ( self.hkl[i] )

        if hasattr(self.input_data.data,"seq"):  # optional data parameter?
            self.seq = self.input_data.data.seq

        if hasattr(self.input_data.data,"native"):  # optional data parameter
            self.native = self.makeClass ( self.input_data.data.native[0] )

        if hasattr(self.input_data.data,"pmodel"):  # optional data parameter
            self.pmodel = self.makeClass ( self.input_data.data.pmodel[0] )
            #if hasattr(self.input_data.data.pmodel[0],"visible"):
            #    if self.input_data.data.pmodel[0].visible:
            #        self.pmodel = self.makeClass ( self.input_data.data.pmodel[0] )

        if hasattr(self.input_data.data,"substructure"):  # optional data parameter
            self.substructure = self.makeClass ( self.input_data.data.substructure[0] )

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
        crank2_meta = {
            "help_btn_template" : self.hotHelpLink ( "Crank-2 Glossary",
                                                    "doc.task.Crank2",
                                                    tooltip="what is this?",
                                                    chapter="html-taskref" ),
            "stop_file"         : self.jobEndFName
        }
        self.storeReportDocument ( json.dumps(crank2_meta) )

        self.xyzout_fpath = os.path.join ( os.getcwd(),self.outputDir(),self.stampFileName(1,self.getXYZOFName()) )
        self.subout_fpath = os.path.join ( os.getcwd(),self.outputDir(),self.stampFileName(1,self.getSubOFName()) )
        self.hklout_fpath = os.path.join ( os.getcwd(),self.outputDir(),self.stampFileName(1,self.getMTZOFName()) )

        # make command-line parameters
        cmd = [
            os.path.join(os.environ["CCP4"],"share","ccp4i","crank2","crank2.py"),
            "--xyzout"          ,self.xyzout_fpath,
            "--hklout"          ,self.hklout_fpath,
            "--dirout"          ,"report",
            "--rvapi-viewer"    ,"0"     ,
            "--graceful-preliminary-stop",
            "--rvapi-uri-prefix","./",
            "--rvapi-document"  ,os.path.join ( os.getcwd(),self.reportDocumentName() ),
            "--rvapi-no-tree"   ,
            "--xyzsubout"       ,self.subout_fpath
        ]

        # run crank-2

        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )

        self.stdoutln ( " >>>>>  path=" + self.subout_fpath )
        try:
            with open(self.subout_fpath,"r") as ff:
                self.stdoutln ( "\n\n" + ff.read() + "\n\n" )
        except:
            self.stdoutln ( " >>>>>  -- does not exist" )

        """
        cad hklin1 x.mtz hklin2 x.mtz  hklout y.mtz <<eof
        LABIN file 1 e1=REFM_FWT e2=REFM_PHWT ...
        LABOUT file 1 e1=FWT e2=PHWT ....
        LABIN file 2 allin
        END
        eof
        """

        if self.task._type=="TaskCrank2":
            self.addCitations ( ['crank2'] )
            if os.path.isfile(self.hklout_fpath):
                # provide copy of phase columns for using in Coot
                self.open_stdin()
                self.write_stdin ([
                    "LABIN  FILE 1 ALLIN",
                    "LABIN  FILE 2 E1=REFM_DELFWT E2=REFM_PHDELWT",
                    "LABOUT FILE 2 E1=DELFWT E2=PHDELWT"
                ])
                # self.write_stdin ([
                #     "LABIN  FILE 1 ALLIN",
                #     "LABIN  FILE 2 E1=REFM_FWT E2=REFM_PHWT E3=REFM_DELFWT E4=REFM_PHDELWT",
                #     "LABOUT FILE 2 E1=FWT E2=PHWT E3=DELFWT E4=PHDELWT"
                # ])
                tmp_mtz = "__tmp.mtz"
                os.rename ( self.hklout_fpath,tmp_mtz )
                cmd = [ "HKLIN1",tmp_mtz,
                        "HKLIN2",tmp_mtz,
                        "HKLOUT",self.hklout_fpath
                      ]
                self.close_stdin()
                self.runApp ( "cad",cmd,logType="Service" )

        meta_str = self.restoreReportDocument()
        if not meta_str:
            self.file_stderr.write ( "\n\n ***** crank-2 returned no meta\n\n" )
        else:
            try:
                meta = json.loads ( meta_str )
                #self.file_stdout.write ( "\n\n ***** crank-2 meta: " + meta_str + "\n\n" )
                if "programs_used" in meta:
                    self.addCitations ( meta["programs_used"] )
                else:
                    self.putMessage ( "<b>Program error:</b> <i>no program list in meta</i>" +\
                                      "<p>'" + meta_str + "'" )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from Crank-2</i>" +\
                                  "<p>'" + meta_str + "'" )
        if self.task._type!="TaskCrank2":
            self.addCitations ( ['crank2'] )

        #pyrvapi.rvapi_reset_task()

        revisions = self.finalise()

        if len(revisions)>0:

            Rfactor = self.generic_parser_summary["refmac"]["R_factor"]
            Rfree   = self.generic_parser_summary["refmac"]["R_free"]
            self.generic_parser_summary.pop ( "refmac",None )

            if self.task._type!="TaskShelxSubstr":
                self.generic_parser_summary["crank2"] = {
                  "summary_line" : "R=" + str(Rfactor) +\
                                   " R<sub>free</sub>=" + str(Rfree)
                }
            else:
                self.generic_parser_summary["crank2"] = {
                    "summary_line" : revisions[0].ASU.ha_type + "<sub>" +\
                                     str(revisions[0].Substructure.getNofAtoms()) +\
                                     "</sub> substructure found"
                }

            # auto.makeNextTask ( self,{
            #     "revision" : revisions[0],
            #     "Rfactor"  : Rfactor,
            #     "Rfree"    : Rfree
            # }, self.file_stderr )
 
            if self.task.autoRunName.startswith("@"):
                # scripted workflow framework
                auto_workflow.nextTask ( self,{
                        "data" : {
                            "revision" : revisions
                        },
                        "scores" :  {
                            "Rfactor"  : float(Rfactor),
                            "Rfree"    : float(Rfree)
                        }
                })

            else:  # pre-coded workflow framework
                auto.makeNextTask ( self,{
                    "revision" : revisions[0],
                    "Rfactor"  : Rfactor,
                    "Rfree"    : Rfree
                }, log=self.file_stderr )

        # close execution logs and quit
        self.success ( (len(revisions)>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Crank2 ( "",os.path.basename(__file__),{} )
    drv.start()
