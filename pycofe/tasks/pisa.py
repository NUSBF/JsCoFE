##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    20.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PISA EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pisa jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid
import shutil

#  application imports
from . import basic


# ============================================================================
# Make Refmac driver

class PISA(basic.TaskDriver):

    def log_page_id(self):  return "@log_tab"

    # ------------------------------------------------------------------------

    def run(self):

        #self.checkCCP4AppExists ( "jspisa" )
        #
        #if "JSPISA_CFG" not in os.environ:
        #    pyrvapi.rvapi_set_text (
        #        "<b>Error: " + self.appName() + " is not configured to work " +\
        #        "with jsPISA.</b><p>Please look for support.",
        #        self.report_page_id(),self.rvrow,0,1,1 )
        #
        #    self.fail ( "<p>&nbsp; *** Error: " + self.appName() + " is not " +\
        #                "configured to work with jsPISA.\n" + \
        #                "     Please look for support\n",
        #                "jsPISA is not configured" )

        # Prepare pisa input
        # fetch input data
        xyz = self.makeClass ( self.input_data.data.xyz[0] )

        xyzPath   = xyz.getXYZFilePath ( self.inputDir() )
        reportDir = os.path.join ( os.getcwd(),self.reportDir() )
        shutil.copy ( xyzPath,reportDir )

        cmd = [ "-process-all",xyzPath,reportDir,
                "--rvapi-doc",self.reportDocumentName() ]
        if len(xyz.exclLigs)>0:
            cmd.append ( "--lig-exclude='" + ",".join(xyz.exclLigs) + "'" )

        cmd += [ "--lig=" + self.getParameter(self.task.parameters.sec1.contains.LIGANDKEY_SEL),
                 os.path.join(os.environ["CCP4"],"share","pisa","jspisa.cfg") ]
        #        os.environ["JSPISA_CFG"] ]

        self.storeReportDocument ( self.outputDir() )

        # Start pisa
        self.runApp ( "jspisa",cmd,logType="Main" )

        self.restoreReportDocument()

        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PISA ( "",os.path.basename(__file__),
                 { "report_page" : { "show" : True, "name" : "Report" } } )
    drv.start()
