##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    28.10.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHELX-AUTO EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.shelxauto.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
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

#  application imports
from . import crank2


# ============================================================================
# Make ShelxAuto driver

class ShelxAuto(crank2.Crank2):

    # redefine id for report tab, making it the same as used in Crank2 RVAPI output
    def report_page_id    (self):  return "results_tab"

    # redefine name of input script file
    def file_stdin_path   (self):  return "crank2.script"

    # make task-specific definitions
    def crank2_xyz        (self):  return "shelx.pdb"
    def crank2_mtz        (self):  return "shelx.mtz"
    def output_file_prefix(self):  return "shelx"

    # ------------------------------------------------------------------------

    def add_phdmmb ( self ):
        self.config.append ( "phdmmb " + self.get_exclude() +\
            self.getKWItem ( self.sec7.PHDMMB_BIGCYC              ) +\
            self.getKWItem ( self.sec7.PHDMMB_DMCYC               ) +\
            self.getKWItem ( self.sec7.PHDMMB_THRESHOLD_STOP      ) +\
            self.getKWItem ( self.sec7.PHDMMB_THRESHOLD_HAND_STOP ) +\
            self.getKWItem ( self.sec7.PHDMMB_PROGRAM_KEYWORDS    )
        )
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

        self.add_createfree()
        self.add_faest     ()
        self.add_substrdet ()

        if self.expType == "MAD":

            self.add_phdmmb ()
            self.add_mbref  ()
            self.add_ref    ()

        elif self.expType == "SIRAS":

            self.add_phdmmb ()
            self.add_mbref  ()
            self.add_ref    ()

        else:

            self.add_phdmmb ()
            self.add_mbref  ()
            self.add_ref    ()

        return


# ============================================================================

if __name__ == "__main__":

    drv = ShelxAuto ( "Automated Experimental Phasing with SHELX (via Crank-2)",
                      os.path.basename(__file__) )
    drv.start()
