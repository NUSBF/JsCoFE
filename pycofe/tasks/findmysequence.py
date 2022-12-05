##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    23.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.lorestr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import json

#  application imports
from . import basic
from   pycofe.proc   import qualrep
from   varut          import signal
from   pycofe.verdicts  import verdict_lorestr
from   pycofe.auto   import auto

from proc import import_seqcp



# ============================================================================
# Make FindMySequence driver

class FindMySequence(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "findmysequence.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When lorestr
        # succeeds, this file is created.
        # if os.path.isfile(self.getXYZOFName()):
        #     os.remove(self.getXYZOFName())

        # Prepare lorestr input
        # fetch input data
        # hkl     = self.makeClass ( self.input_data.data.hkl[0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        # Prepare report parser
        #self.setGenericLogParser ( self.lorestr_report(),False )

        mtzin = istruct.getMTZFilePath ( self.inputDir() )
        codes = self.getParameter(self.task.parameters.sec1.contains.TAXONOMIC_ID)
        labin_ph = [istruct.PHI,istruct.FOM,istruct.FWT,istruct.PHWT]

        cmd = [ "-p1",mtzin,"-f" ,hkl.getHKLFilePath(self.inputDir()) ]

        rc = self.runApp ( "findmysequence",cmd,logType="Main" )

        # self.addCitations ( ['buccaneer','refmac5'] )

        have_results = False

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>Buccaneer failure</h3>" )
            raise signal.JobFailure ( rc.msg )

        # fetch sequence as a string

        # sequence = myfunction() 

        # self.stdoutln ( "\n Found sequence = " + sequence )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = FindMySequence ( "",os.path.basename(__file__) )
    drv.start()
