##!/usr/bin/python

#
# ============================================================================
#
#    12.09.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHELXE-MR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.shelxemr.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
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
from   pycofe.dtypes import dtype_sequence


# ============================================================================
# Make ShelxEMR driver

class ShelxEMR(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path  (self):  return "shelxe.script"

    # make task-specific definitions
    def shelxe_wrk_seq   (self):  return "shelxe_wrk.seq"
    def shelxe_wrk_mtz   (self):  return "shelxe_wrk.mtz"
    def shelxe_wrk_hkl   (self):  return "shelxe_wrk.hkl"
    def shelxe_wrk_pda   (self):  return "shelxe_wrk.pda"
    def shelxe_wrk_pdb   (self):  return "shelxe_wrk.pdb"
    def shelxe_wrk_pdo   (self):  return "shelxe_wrk.pdo"
    def shelxe_wrk_phs   (self):  return "shelxe_wrk.phs"
    def shelxe_tmp_mtz   (self):  return "shelxe_tmp.mtz"
    def shelxe_pdb       (self):  return "shelxe.pdb"
    def shelxe_mtz       (self):  return "shelxe.mtz"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove molrep output xyz file. When molrep
        # succeeds, this file is created.

        if os.path.isfile(self.shelxe_wrk_phs()):
            os.remove(self.shelxe_wrk_phs())

        # Prepare shelxe input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct[0] )

        # Prepare set of input files for shelxe
        # copy files according to Shelx notations
        shutil.copyfile ( istruct.getMTZFilePath(self.inputDir()),
                          self.shelxe_wrk_mtz() )
        shutil.copyfile ( istruct.getXYZFilePath(self.inputDir()),
                          self.shelxe_wrk_pda() )

        # use mtz2various to prepare the reflection file
        cmd = [ "HKLIN" ,self.shelxe_wrk_mtz(),
                "HKLOUT",self.shelxe_wrk_hkl() ]

        self.open_stdin  ()
        self.write_stdin (
            "LABIN   FP="    + istruct.FP + " SIGFP=" + istruct.SigFP      +\
                                            " FREE="  + istruct.FreeR_flag +\
            "\nOUTPUT SHELX" +\
            "\nFSQUARED"     +\
            "\nEND\n"
        )
        self.close_stdin()

        # run mtz-to-hkl converter
        self.runApp ( "mtz2various",cmd )


        # Prepare command line for shelxe

        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains

        cmd = [ self.shelxe_wrk_pda(),
                "-a" + self.getParameter(sec1.TRACING_CYCLES),
                "-m" + self.getParameter(sec1.DM_CYCLES),
                "-t" + self.getParameter(sec2.TIME_FACTOR),
                "-s" + str(revision.ASU.solvent/100.0)
              ]

        if self.getParameter(sec1.AH_SEARCH_CBX)=="True":
            cmd += ["-q"]
        if self.getParameter(sec1.OMIT_RES_CBX)=="True":
            cmd += ["-o"]
        if self.getParameter(sec1.NCS_CBX)=="True":
            cmd += ["-n"]

        self.runApp ( "shelxe",cmd )

        if os.path.isfile(self.shelxe_wrk_phs()):

            # Convert output to an mtz file
            cryst = istruct.xyzmeta.cryst
            self.open_stdin  ()
            self.write_stdin (
                "TITLE   shelxeOUT" +\
                "\ncell    " + str(cryst.a)     + " " +\
                               str(cryst.b)     + " " +\
                               str(cryst.c)     + " " +\
                               str(cryst.alpha) + " " +\
                               str(cryst.beta)  + " " +\
                               str(cryst.gamma) +\
                "\nsymm    \"" + cryst.spaceGroup + "\"" +\
                "\nlabout  H K L ShelxE.F ShelxE.FOM ShelxE.PHI ShelxE.SIGF" +\
                "\nCTYPOUT H H H F W P Q" +\
                "\npname   shelxeOUT" +\
                "\ndname   shelxeOUT" +\
                "\nEND\n"
            )
            self.close_stdin()

            cmd = [ "hklin" ,self.shelxe_wrk_phs(),
                    "hklout",self.shelxe_tmp_mtz()
                  ]
            self.runApp ( "f2mtz",cmd )

            # Calculate map coefficients
            self.open_stdin  ()
            self.write_stdin (
                "mode batch\n" +\
                "read " + self.shelxe_wrk_mtz() + " mtz\n" +\
                "read " + self.shelxe_tmp_mtz() + " mtz\n" +\
                "CALC F COL FWT  = COL ShelxE.F COL ShelxE.FOM *\n" +\
                "CALC P COL PHWT = COL ShelxE.PHI 0 +\n" +\
                "write " + self.shelxe_mtz() + " mtz\n" +\
                "EXIT\n" +\
                "YES\n"
            )
            self.close_stdin()

            self.runApp ( "sftools",[] )

            # copy pdb
            shutil.copyfile ( self.shelxe_wrk_pdb(),self.shelxe_pdb() )

            fnames    = self.calcCCP4Maps ( self.shelxe_mtz(),self.outputFName,
                                            "shelxe" )
            structure = self.registerStructure1 (
                        self.shelxe_pdb(),self.shelxe_mtz(),fnames[0],None,None,
                        self.outputFName )
            if structure:
                structure.copyAssociations ( istruct )
                structure.setShelxELabels  ()
                structure.copySubtype      ( istruct )
                self.putStructureWidget    ( "structure_btn",
                                             "Structure and electron density",
                                             structure )
                # update structure revision
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )

        else:
            self.putTitle ( "No Solution Found" )


        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = ShelxEMR ( "",os.path.basename(__file__) )
    drv.start()
