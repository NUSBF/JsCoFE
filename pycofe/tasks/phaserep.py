##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PHASEREP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.phaserep.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#


#   replace " SUB "  in phaser's output for " UNK " or " atom_type " for
#   anomalous map calculations!!!  -- replaced with atom type

#  python native imports
import os
# import sys
#import shutil

#  ccp4-python imports
# import pyrvapi
import gemmi

#  application imports
from . import basic
from   pycofe.dtypes   import dtype_template
from   pycofe.verdicts import verdict_phaserep
from   pycofe.auto     import auto_workflow


# ============================================================================
# Make PhaserEP driver

class PhaserEP(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path  (self):  return "phaser.script"

    # make task-specific definitions
    def phaser_report    (self):  return "phaser_report"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table


    # ------------------------------------------------------------------------

    def process_solution ( self,suffix,title,hkl,seq,revisionNo ):

        namepattern = self.outputFName + suffix
        pdbfile     = namepattern + ".pdb"
        solfile     = namepattern + ".sol"
        mtzfile     = namepattern + ".mtz"
        llgmapsfile = namepattern + ".llgmaps.mtz"

        # get rid of 'SUB' residue
        scattering_type = []
        if os.path.isfile(pdbfile):
            st = gemmi.read_structure(pdbfile)
            st.setup_entities()
            for model in st:
                for chain in model:
                    for residue in chain:
                        if residue.name == 'SUB' and len(residue) == 1:
                            residue.name = residue[0].name
                            if not residue.name in scattering_type:
                                scattering_type.append ( residue.name )
            st.write_pdb(pdbfile)

        structure     = None
        anomstructure = None
        revision      = None

        if len(scattering_type)>0:

            if not self.xmodel or True:
                fsetId = "fset_" + str(self.rvrow)
                self.putFieldset     ( fsetId,title )
                self.setReportWidget ( fsetId )

            if os.path.isfile(solfile):

                solf = open ( solfile,"r" )
                soll = solf.readlines()
                solf.close()

                sol_spg   = None
                sol_hkl   = hkl
                anom_form = ""

                for line in soll:
                    if line.startswith("SOLU SPAC "):
                        sol_spg = line.replace("SOLU SPAC ","").strip()
                    if line.startswith("SPACEGROUP "):
                        sol_spg = line.replace("SPACEGROUP ","").strip()

                spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                if spg_change:
                    mtzfile = spg_change[0]
                    sol_hkl = spg_change[1]

                #fnames      = self.calcCCP4Maps ( mtzfile,namepattern,"phaser-ep" )
                #protein_map = fnames[0]

                ofname = self.outputFName
                if revisionNo==1:
                    self.outputFName += "-original_hand"
                else:
                    self.outputFName += "-inverted_hand"
                structure = self.registerStructure (
                                None,
                                None,
                                pdbfile,
                                mtzfile,
                                leadKey    = 2,
                                copy_files = True,
                                map_labels = "FWT,PHWT",
                                refiner    = "" 
                            )

                if structure:
                    if seq:
                        for i in range(len(seq)):
                            if seq[i]:
                                structure.addDataAssociation ( seq[i].dataId )
                    structure.setPhaserEPLabels ( sol_hkl,self.MRSAD )
                    structure.addPhasesSubtype()

                    outputDataBox = self.outputDataBox
                    self.outputDataBox = None

                    self.makePhasesMTZ ( mtzfile,["FWT","PHWT"],
                                         llgmapsfile,[],llgmapsfile )

                    for stype in scattering_type:
                        self.putMessage ( "<b style='font-size:120%'>" + stype + " scatterers</b>" )
                        #fnames = self.calcCCP4Maps (
                        #        llgmapsfile,namepattern+".llgmap_"+stype,"phaser-ep:"+stype )
                        anom_struct = self.registerStructure (
                                            None,
                                            None,
                                            pdbfile,
                                            llgmapsfile,
                                            leadKey    = 2,
                                            copy_files = True,
                                            map_labels = "FWT,PHWT,FLLG_"+stype+",PHLLG_"+stype,
                                            refiner    = "" 
                                        )
                        if anom_struct:
                            self.putStructureWidget ( "structure_btn_"+stype,
                                                      "Substructure and electron density",
                                                      anom_struct )
                        self.putMessage ( "&nbsp;" )

                    self.outputDataBox = outputDataBox

                    self.putMessage ( "&nbsp;<br><hr><h3>Structure Revision</h3>" )
                    revision = self.makeClass  ( self.input_data.data.revision[0] )
                    revision.setReflectionData ( sol_hkl   )
                    revision.setStructureData  ( structure )
                    revision.removeSubtype     ( dtype_template.subtypeXYZ() )
                    self.registerRevision      ( revision,revisionNo,"" )
                    #self.registerRevision     ( revision,revisionNo,"",
                    #                            revisionName=sname )
                    self.putMessage ( "&nbsp;" )

                else:
                    self.putMessage (
                            "<h3><i>Failed to created output data object</i></h3>" )

                self.outputFName = ofname

            else:
                self.putMessage (
                    "<h3><i>No solution has been achieved.</i></h3>" )

            if not self.xmodel or True:
                self.resetReportPage()

        else:
            self.putMessage (
                "<h3><i>Heavy Atom Substructure Not Found.</i></h3>" )

        return  (structure,anomstructure,revision)


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare phaser input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl[0] )
        seq      = self.input_data.data.seq
        substr   = None
        if hasattr(self.input_data.data,'substructure'):
            substr = self.makeClass ( self.input_data.data.substructure[0] )

        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )

        sec1   = self.task.parameters.sec1.contains
        sec2   = self.task.parameters.sec2.contains
        sec3   = self.task.parameters.sec3.contains

        #  use CAD for making input HKL file for Phaser
        try:
            hkl_labels = ( hkl.dataset.Ipm.plus .value, hkl.dataset.Ipm.plus .sigma,
                           hkl.dataset.Ipm.minus.value, hkl.dataset.Ipm.minus.sigma )
            hkl_labin  =  "    I+=" + hkl_labels[0] + " SIGI+=" + hkl_labels[1] +\
                             " I-=" + hkl_labels[2] + " SIGI-=" + hkl_labels[3]
        except:
            hkl_labels = ( hkl.dataset.Fpm.plus .value, hkl.dataset.Fpm.plus .sigma,
                           hkl.dataset.Fpm.minus.value, hkl.dataset.Fpm.minus.sigma )
            hkl_labin  =  "    F+=" + hkl_labels[0] + " SIGF+=" + hkl_labels[1] +\
                             " F-=" + hkl_labels[2] + " SIGF-=" + hkl_labels[3]

        hklfile = hkl.getHKLFilePath ( self.inputDir() )

        # make a file with input script for Phaser
        self.open_stdin()

        self.write_stdin (
            "TITLE Phaser-EP" +\
            "\nMODE EP_AUTO"  +\
            "\nROOT \""       + self.outputFName + "\""   +\
            "\nHKLIN "        + hklfile
        )

        if substr:
            self.write_stdin (
                "\nATOM CRYSTAL crystal1 PDB \""              +\
                        substr.getSubFilePath(self.inputDir()) + "\""
            )

        wavelength = hkl.wavelength
        if not wavelength:
            wavelength = hkl.getWavelength()
        # self.stderrln ( " >>>> wlen = " + str(wavelength) )

        self.write_stdin (
            "\nCRYSTAL crystal1 DATASET dataset1 LABIN &" +\
            "\n    "          + hkl_labin                 +\
            "\nWAVELENGTH "   + str(wavelength)
            #"\nRESOLUTION "   + str(hkl.res_low) + " " + str(hkl.res_high)
        )

        if hkl.res_high:
            self.write_stdin ( "\nRESOLUTION HIGH " + str(hkl.res_high) )
        if hkl.res_low:
            self.write_stdin ( "\nRESOLUTION LOW "  + str(hkl.res_low) )

        # self.write_stdin ( "\nCOMPOSITION BY ASU" )
        # for i in range(len(seq)):
        #     seq[i] = self.makeClass ( seq[i] )
        #     self.write_stdin (
        #         "\nCOMPOSITION PROTEIN SEQ \"" +\
        #         seq[i].getSeqFilePath ( self.inputDir() ) +\
        #         "\" NUMBER " + str(seq[i].ncopies)
        #     )

        self.write_stdin ( "\nCOMPOSITION BY ASU" )
        for i in range(len(seq)):
            if (seq[i].isNucleotide()):
                self.write_stdin ( "\nCOMPOSITION NUCLEIC SEQ" )
            else:
                self.write_stdin ( "\nCOMPOSITION PROTEIN SEQ" )
            self.write_stdin ( " \"" +\
                seq[i].getSeqFilePath(self.inputDir()) +\
                "\" NUMBER " + str(seq[i].ncopies)
            )

        if hkl.f_use_mode!="NO":
            self.write_stdin (
                "\nSCATTERING TYPE " + revision.ASU.ha_type.upper() +\
                            " FP = " + str(hkl.f1) + " FDP = " + str(hkl.f11) +\
                            " FIX "  + hkl.f_use_mode
            )

        self.xmodel = None
        self.MRSAD  = False
        if hasattr(self.input_data.data,"xmodel"):  # optional data parameter
            self.xmodel = self.makeClass ( self.input_data.data.xmodel[0] )
            if "substructure" in self.xmodel.subtype:
                self.write_stdin (
                    "\nPARTIAL HKLIN \"" +\
                        self.xmodel.getMTZFilePath(self.inputDir()) +\
                        "\" RMS " + str(self.xmodel.rmsd)
                )
            else:
                self.MRSAD = True
                self.write_stdin (
                    "\nPARTIAL PDB \"" +\
                        self.xmodel.getPDBFilePath(self.inputDir()) +\
                        "\" RMS " + str(self.xmodel.rmsd)
                )

        # Main options

        LLG_SEL = self.getParameter ( sec1.LLG_SEL )
        if LLG_SEL=="SEL":
            if self.getParameter(sec1.LLG_REAL_CBX)=="True":
                self.write_stdin ( "\nLLGCOMPLETE SCATTERER RX" )
            if self.getParameter(sec1.LLG_ANOM_CBX)=="True":
                self.write_stdin ( "\nLLGCOMPLETE SCATTERER AX" )
            alist = [_f for _f in self.getParameter(sec1.LLG_ATYPE).split(",") if _f]
            for a in alist:
                self.write_stdin ( "\nLLGCOMPLETE SCATTERER " + a )
        else:
            self.write_stdin ( "\nLLGCOMPLETE COMPLETE " + LLG_SEL )


        #  Accessory parameters

        RESTRAIN_F11_SEL = self.getParameter ( sec2.RESTRAIN_F11_SEL )
        self.write_stdin ( "\nSCATTERING RESTRAIN " + RESTRAIN_F11_SEL )
        if RESTRAIN_F11_SEL=="ON":
            self.write_stdin ( " SIGMA " + str(self.getParameter(sec2.RESTRAIN_F11_SIGMA)) )

        self.write_stdin ( "\nLLGCOMPLETE SIGMA " + str(self.getParameter(sec2.LLG_MAP_SIGMA)) )

        if self.getParameter(sec2.LLG_MAP_DIST_SEL)=="OFF":
            self.write_stdin ( "\nLLGCOMPLETE CLASH " + str(self.getParameter(sec2.LLG_MAP_DIST)) )

        self.write_stdin ( "\nLLGCOMPLETE NCYC " + str(self.getParameter(sec2.LLG_NCYCLES)) )
        self.write_stdin ( "\nLLGCOMPLETE METHOD " + str(self.getParameter(sec2.LLG_MAP_PEAKS_SEL)) )

        # Expert parameters

        self.write_stdin ( "\nATOM CHANGE BFACTOR WILSON " + str(self.getParameter(sec3.WILSON_BFACTOR_SEL)) )

        self.write_stdin ( "\nLLGMAPS ON\n" )
        self.close_stdin()

        # make command-line parameters for phaser
        cmd = []

        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )

        # Start phaser
        self.runApp ( "phaser",cmd,logType="Main" )
        self.unsetLogParser()

        # check solution and register data

        FOM = -1.0
        LLG = -1.0
        self.flush()
        self.file_stdout.close()
        f   = open ( self.file_stdout_path(),"r" )
        key = 1
        for line in f:
            if key==0:
                words = line.split()
                if len(words)>5 and words[0]=="#":
                    try:
                        words = line[len("   #  1 *  P 21 21 21"):].split()
                        FOM1  = float(words[0])
                        LLG1  = float(words[1])
                        if LLG1>LLG:
                            FOM = FOM1
                            LLG = LLG1
                    except:
                        pass
                elif line.strip()=="$$":
                    break
            elif "SAD Refinement Table" in line:
                key = 0
        f.close()
        # continue writing to stdout
        self.file_stdout = open ( self.file_stdout_path(),"a" )

        self.putTitle ( "Results" )
        revout = []
        sol    = self.process_solution ( ".1","<h3><i>Original Hand</i></h3>",hkl,seq,1 )
        if sol[2]:
            revout = [sol[2]]
        have_results = sol[2] is not None
        self.putMessage ( "&nbsp;"  )
        if not self.xmodel:
            sol = self.process_solution ( ".1.hand","<h3><i>Inverted Hand</i></h3>",hkl,seq,2 )
            if sol[2]:
                revout.append ( sol[2] )
            have_results = have_results or (sol[2] is not None)
            self.putMessage ( "&nbsp;<p>" )

        if have_results:
            # Verdict section
            verdict_meta = {
                "fllg" : LLG,
                "ffom" : FOM
            }
            verdict_phaserep.putVerdictWidget ( self,verdict_meta,self.rvrow-1 )
            self.rvrow += 3

        if self.task.autoRunName.startswith("@") and len(revout)>0:
            # scripted workflow framework
            auto_workflow.nextTask ( self,{
                    "data" : {
                        "revision" : revout
                    },
                    "scores" :  {
                        "LLG" : LLG,
                        "FOM" : FOM
                    }
            })
            # self.putMessage ( "<h3>Workflow started</hr>" )

        if have_results and FOM>=0.0:
            self.generic_parser_summary["phasewr-ep"] = {
                "summary_line" : "LLG=" + str(LLG) + " FOM=" + str(FOM)
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PhaserEP ( "",os.path.basename(__file__) )
    drv.start()
