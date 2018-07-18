##!/usr/bin/python

#
# ============================================================================
#
#    17.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PHASEREP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.phaserep.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#


#   replace " SUB "  in phaser's output for " UNK " or " atom_type " for
#   anomalous map calculations!!!

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
from   pycofe.proc import import_merged


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

        namepattern   = self.outputFName + suffix
        pdbfile       = namepattern + ".pdb"
        solfile       = namepattern + ".sol"
        mtzfile       = namepattern + ".mtz"
        anompdbfile   = namepattern + ".anom.pdb"

        structure     = None
        anomstructure = None

        if not self.xmodel:
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
                if line.startswith("SCATTERING TYPE"):
                    list = line.replace("="," ").split()
                    anom_form += "anom form "  + list[2] + " " +\
                                 list[4] + " " + list[6] + "\n"

            spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
            if spg_change:
                mtzfile = spg_change[0]
                sol_hkl = spg_change[1]

            # make a copy of pdb file, because it will be moved by registration
            shutil.copy2 ( pdbfile,anompdbfile )

            fnames    = self.calcCCP4Maps ( mtzfile,namepattern,"refmac" )
            structure = self.registerStructure1 (
                            pdbfile,mtzfile,fnames[0],fnames[1],None,
                            self.outputFName )
            if structure:
                #structure.addDataAssociation ( sol_hkl.dataId )
                if seq:
                    for i in range(len(seq)):
                        if seq[i]:
                            structure.addDataAssociation ( seq[i].dataId )
                structure.setRefmacLabels ( sol_hkl )
                structure.setHLLabels     ()
                structure.setSubstrSubtype() # substructure
                structure.addEPSubtype    ()
                self.putStructureWidget   ( "structure_btn",
                                            "Structure and electron density",
                                            structure )
                self.putMessage ( "&nbsp;" )

                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision,revisionNo,"" )
                self.putMessage ( "&nbsp;" )

                anomstructure = self.finaliseAnomSubstructure (
                        anompdbfile,"anom_substructure"+suffix,sol_hkl,[],
                        anom_form,False,"" )
                if anomstructure:
                    anomstructure.setHLLabels()

            else:
                self.putMessage (
                        "<h3><i>Failed to created output data object</i></h3>" )

        else:
            self.putMessage (
                "<h3><i>No solution has been achieved.</i></h3>" )

        if not self.xmodel:
            self.resetReportPage()

        return  (structure,anomstructure)


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare phaser input
        # fetch input data
        hkl    = self.makeClass ( self.input_data.data.hkl[0] )
        seq    = self.input_data.data.seq
        substr = None
        if hasattr(self.input_data.data,'substructure'):
            substr = self.input_data.data.substructure[0]

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

        hklfile = os.path.join ( self.inputDir(),hkl.files[0] )

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
                        os.path.join(self.inputDir(),substr.files[0]) + "\""
            )

        self.write_stdin (
            "\nCRYSTAL crystal1 DATASET dataset1 LABIN &" +\
            "\n    "          + hkl_labin                 +\
            "\nWAVELENGTH "   + str(hkl.wavelength)       +\
            "\nRESOLUTION "   + str(hkl.res_low) + " " + str(hkl.res_high)
        )

        self.write_stdin ( "\nCOMPOSITION BY ASU" )
        for i in range(len(seq)):
            self.write_stdin (
                "\nCOMPOSITION PROTEIN SEQ \"" +\
                os.path.join(self.inputDir(),seq[i].files[0]) +\
                "\" NUMBER " + str(seq[i].ncopies)
            )

        if hkl.f_use_mode!="NO":
            self.write_stdin (
                "\nSCATTERING TYPE " + hkl.anomAtomType +\
                            " FP = " + str(hkl.f1) + " FDP = " + str(hkl.f11) +\
                            " FIX "  + hkl.f_use_mode
            )

        self.xmodel = None
        if hasattr(self.input_data.data,"xmodel"):  # optional data parameter
            self.xmodel = self.input_data.data.xmodel[0]
            if "substructure" in self.xmodel.subtype:
                self.write_stdin (
                    "\nPARTIAL HKLIN \"" +\
                        os.path.join(self.inputDir(),self.xmodel.files[1]) +\
                        "\" RMS " + str(self.xmodel.rmsd)
                )
            else:
                self.write_stdin (
                    "\nPARTIAL PDB \"" +\
                        os.path.join(self.inputDir(),self.xmodel.files[0]) +\
                        "\" RMS " + str(self.xmodel.rmsd)
                )

        # Main options

        LLG_SEL = self.getParameter ( sec1.LLG_SEL )
        if LLG_SEL=="SEL":
            if self.getParameter(sec1.LLG_REAL_CBX)=="True":
                self.write_stdin ( "\nLLGCOMPLETE SCATTERER RX" )
            if self.getParameter(sec1.LLG_ANOM_CBX)=="True":
                self.write_stdin ( "\nLLGCOMPLETE SCATTERER AX" )
            alist = filter ( None,self.getParameter(sec1.LLG_ATYPE).split(",") )
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

        self.write_stdin ( "\n" )
        self.close_stdin()

        # make command-line parameters for phaser
        cmd = []

        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )

        # Start mrbump
        self.runApp ( "phaser",cmd )
        self.unsetLogParser()

        # check solution and register data

        self.putTitle         ( "Results"   )
        self.process_solution ( ".1","<h3><i>Original Hand</i></h3>",hkl,seq,1 )
        self.putMessage       ( "&nbsp;"    )
        if not self.xmodel:
            self.process_solution ( ".1.hand","<h3><i>Inverted Hand</i></h3>",hkl,seq,2 )
            self.putMessage       ( "&nbsp;<p>" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = PhaserEP ( "",os.path.basename(__file__) )
    drv.start()
