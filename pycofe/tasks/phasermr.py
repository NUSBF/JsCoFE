##!/usr/bin/python

#
# ============================================================================
#
#    04.09.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PHASERMR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.phasermr.py exeType jobDir jobId
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

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
#from   pycofe.proc import import_merged


# ============================================================================
# Make PhaserMR driver

class PhaserMR(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path  (self):  return "phaser.script"

    # make task-specific definitions
    def phaser_report    (self):  return "phaser_report"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare phaser input
        # fetch input data

        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl[0] )
        seq      = self.input_data.data.seq
        ens      = self.input_data.data.model

        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )

        for i in range(len(ens)):
            ens[i] = self.makeClass ( ens[i] )

        try:
            hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
            hkl_labin  =  "\nLABIN  I=" + hkl_labels[0] + " SIGI=" + hkl_labels[1]
        except:
            hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
            hkl_labin  =  "\nLABIN  F=" + hkl_labels[0] + " SIGF=" + hkl_labels[1]

        hklfile = hkl.getHKLFilePath ( self.inputDir() )
        xstruct = None
        if "xyz" in revision.subtype:  # optional data parameter
            xstruct = self.makeClass ( revision.Structure )
            cad_mtz = 'cad.mtz'
            xstruct_labels = ( xstruct.FWT, xstruct.PHWT )
            self.open_stdin()
            self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\n" %hkl_labels     )
            self.write_stdin ( "LABIN FILE 2 E1=%s E2=%s\n" %xstruct_labels )
            self.write_stdin ( "END\n" )
            self.close_stdin()
            cmd = [ "HKLIN1", hklfile,
                    "HKLIN2", xstruct.getMTZFilePath(self.inputDir()),
                    "HKLOUT", cad_mtz ]
            self.runApp ( "cad", cmd )
            hklfile    = cad_mtz
            hkl_labin += "\nLABIN FWT=" + xstruct_labels[0] + " PHWT=" + xstruct_labels[1]


        # make a file with input script
        self.open_stdin()

        self.write_stdin (
            "TITLE Phaser-MR" +\
            "\nMODE MR_AUTO"  +\
            "\nROOT \""       + self.outputFName + "\"" +\
            "\nHKLIN \""      + hklfile + "\"" +\
            hkl_labin
        )

        if hkl.spg_alt=='ALL':
            self.write_stdin ( "\nSGALTERNATIVE SELECT ALL" )
        else:
            splist = hkl.spg_alt.split ( ";" )
            if len(splist)<=1:
                self.write_stdin ( "\nSGALTERNATIVE SELECT NONE" )
            elif splist[0].startswith("I"):
                self.write_stdin ( "\nSGALTERNATIVE SELECT LIST" )
                self.write_stdin ( "\nSGALTERNATIVE TEST " + splist[0] )
                self.write_stdin ( "\nSGALTERNATIVE TEST " + splist[1] )
            else:
                self.write_stdin ( "\nSGALTERNATIVE SELECT HAND" )

        for i in range(len(ens)):
            ename = "ensemble" + str(i+1)
            self.write_stdin (
                "\nENSEMBLE " + ename + " &" +\
                "\n    PDB \"" + ens[i].getXYZFilePath(self.inputDir()) +\
                "\" RMS " + str(ens[i].rmsd) +\
                "\nENSEMBLE " + ename + " HETATM ON"
            )

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

        for i in range(len(ens)):
            self.write_stdin (
                "\nSEARCH ENSEMBLE ensemble" + str(i+1) +\
                " NUMBER " + str(ens[i].ncopies)
            )

        if xstruct:  # optional data parameter
            self.write_stdin (
                "\nENSEMBLE ensemble0" + " &" +\
                "\n    PDB \"" + xstruct.getXYZFilePath(self.inputDir()) +\
                "\" IDENT 0.9" +\
                "\nTARGET TRA PHASED" +\
                "\nSOLUTION ORIGIN ENSEMBLE ensemble0"
            )
            inp_sol_file = xstruct.getSolFilePath ( self.inputDir() )
            if inp_sol_file:
                self.write_stdin ( "\n@"+inp_sol_file )


        # add options

        if hkl.res_high:
            self.write_stdin ( "\nRESOLUTION HIGH " + str(hkl.res_high) )
        if hkl.res_low:
            self.write_stdin ( "\nRESOLUTION LOW " + str(hkl.res_low) )
        if hkl.res_ref:
            self.write_stdin ( "\nRESOLUTION AUTO HIGH " + str(hkl.res_ref) )

        self.write_stdin ( "\n" )

        sec0 = self.task.parameters.sec0.contains
        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains
        sec3 = self.task.parameters.sec3.contains

        if sec0.RF_TARGET_SEL.value != "FAST":
            self.writeKWParameter ( sec0.RF_TARGET_SEL )
        if sec0.RF_ANGLE_SEL.visible:
            self.write_stdin ( "ROTATE VOLUME " + sec0.RF_ANGLE_SEL.value )
            if sec0.RF_ALPHA.visible:
                self.write_stdin ( self.getKWParameter("EULER",sec0.RF_ALPHA) +\
                                   self.getKWParameter(""     ,sec0.RF_BETA)  +\
                                   self.getKWParameter(""     ,sec0.RF_GAMMA) +\
                                   self.getKWParameter("RANGE",sec0.RF_RANGE) )
            self.write_stdin ( "\n" )

        if sec0.TF_TARGET_SEL.value != "FAST":
            self.writeKWParameter ( sec0.TF_TARGET_SEL )
        if sec0.TF_POINT_SEL.visible:
            self.write_stdin ( "TRANSLATE VOLUME " + sec0.TF_POINT_SEL.value )
            if sec0.TF_X.visible:
                self.write_stdin ( self.getKWParameter("POINT",sec0.TF_X) +\
                                   self.getKWParameter(""     ,sec0.TF_Y)  +\
                                   self.getKWParameter(""     ,sec0.TF_Z) +\
                                   self.getKWParameter("RANGE",sec0.TF_RANGE) )
                self.write_stdin ( "\n" )
                self.writeKWParameter ( sec0.TF_SPACE_SEL )
            else:
                self.write_stdin ( "\n" )


        self.writeKWParameter ( sec1.TNCS_SEL            )
        self.writeKWParameter ( sec1.TNCS_NA             )

        self.writeKWParameter ( sec1.PACK_SEL            )
        self.writeKWParameter ( sec1.PACK_CUTOFF         )

        self.writeKWParameter ( sec1.RS_PEAKS_SEL        )
        self.writeKWParameter ( sec1.RS_PEAKS_P_CUTOFF   )
        self.writeKWParameter ( sec1.RS_PEAKS_S_CUTOFF   )
        self.writeKWParameter ( sec1.RS_PEAKS_N_CUTOFF   )
        if sec0.RF_TARGET_SEL.value == "FAST":
            self.writeKWParameter ( sec0.RF_CLUSTER_SEL )
        else:
            self.write_stdin ( "PEAKS ROT CLUSTER OFF\n" )

        self.writeKWParameter ( sec1.TS_PEAKS_SEL        )
        self.writeKWParameter ( sec1.TS_PEAKS_P_CUTOFF   )
        self.writeKWParameter ( sec1.TS_PEAKS_S_CUTOFF   )
        self.writeKWParameter ( sec1.TS_PEAKS_N_CUTOFF   )

        self.writeKWParameter ( sec1.DR_SEARCH_DOWN      )

        self.writeKWParameter ( sec1.PURGE_ROT_SEL       )
        self.writeKWParameter ( sec1.PURGE_ROT_CUTOFF    )
        self.writeKWParameter ( sec1.PURGE_ROT_NUMBER    )

        self.writeKWParameter ( sec1.PURGE_TRA_SEL       )
        self.writeKWParameter ( sec1.PURGE_TRA_CUTOFF    )
        self.writeKWParameter ( sec1.PURGE_TRA_NUMBER    )

        self.writeKWParameter ( sec1.PURGE_RNP_SEL       )
        self.writeKWParameter ( sec1.PURGE_RNP_CUTOFF    )
        self.writeKWParameter ( sec1.PURGE_RNP_NUMBER    )

        self.writeKWParameter ( sec2.TOPFILES            )

        self.writeKWParameter ( sec3.SEARCH_METHOD_SEL   )
        self.writeKWParameter ( sec3.PERMUTE_SEL         )

        self.writeKWParameter ( sec3.SEARCH_PRUNE_SEL    )

        self.writeKWParameter ( sec3.TRA_PACKING_SEL     )
        self.writeKWParameter ( sec3.TRA_PACKING_OVERLAP )

        self.writeKWParameter ( sec3.FORMFACTORS_SEL     )

        self.close_stdin()

        # make command-line parameters for phaser
        cmd = []

        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )

        # Start mrbump
        self.runApp ( "phaser",cmd )
        self.unsetLogParser()

        # check solution and register data
        sol_hkl  = hkl
        sol_file = self.outputFName + ".sol"
        if os.path.isfile(sol_file):

            solf = open ( sol_file,"r" )
            soll = solf.readlines()
            solf.close()
            sol_spg = None
            for line in soll:
                if line.startswith("SOLU SPAC "):
                    sol_spg = line.replace("SOLU SPAC ","").strip()

            mtzfile = self.outputFName + ".1.mtz"

            self.putMessage ( "&nbsp;" );
            spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
            if spg_change:
                mtzfile = spg_change[0]
                sol_hkl = spg_change[1]
                revision.setReflectionData ( sol_hkl )

        #self.putMessage ( "&nbsp;" );
        structure = self.finaliseStructure ( self.outputFName+".1.pdb",
                                    self.outputFName,sol_hkl,None,seq,1,False )

        if structure:
            # set sol file
            structure.add_file ( sol_file,self.outputDir(),"sol" )
            # update structure revision
            revision.setStructureData ( structure )
            self.registerRevision     ( revision  )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = PhaserMR ( "",os.path.basename(__file__) )
    drv.start()
