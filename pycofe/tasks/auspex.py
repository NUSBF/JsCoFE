##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUSPEX EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.auspex jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from . import basic


# ============================================================================
# Make Auspex driver

class Auspex(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare auspex input
        # fetch input data

        hkl = self.makeClass ( self.input_data.data.hkl[0] )

        #if sys.platform=="darwin" and not hkl.hasIntensities():
        #    self.putMessage ( "<h3>The task cannot be run</h3>" +\
        #        "<i>On Mac OSX, the task works only with intensity data, " +\
        #        "which is absent in the provided reflection dataset.</i>" )
        #    self.fail ( "","no intensity data" )
        #    return

        # prepare input file with cad (needed because Auspex does not take column
        # labels on input)

        sliceMTZPath = "_input.mtz"
        self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),
                        hkl.getColumnNames().split(),
                        sliceMTZPath )

        # Make command line
        sec1 = self.task.parameters.sec1.contains
        cmd  = [
            "--ylim",self.getParameter ( sec1.YRANGE_SEL ),
            "--no-filename-in-title"
        ]
        if self.getCheckbox ( sec1.PLOTS_CBX ):
            cmd.append ( "--single-figure" )
        if not self.getCheckbox ( sec1.REDFLAG_CBX ):
            cmd.append ( "--no-automatic" )
        dmin = self.getParameter ( sec1.DMIN )
        if dmin:
            cmd += ["--dmin",dmin]

        cmd.append ( sliceMTZPath )

        # Start auspex
        if sys.platform.startswith("win"):
            self.runApp ( "auspex.bat",cmd,logType="Main" )
        else:
            self.runApp ( "auspex",cmd,logType="Main" )

        dirlist = sorted(os.listdir("."))
        for filename in dirlist:
            if filename.lower().endswith(".png"):
                shutil.copy2 ( filename,os.path.join(self.reportDir(),filename) )
                self.putMessage ( "<img style='vertical-align:middle;' src='" +\
                                  filename + "' width='100%'/>" )

        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Auspex ( "",os.path.basename(__file__) )
    drv.start()
