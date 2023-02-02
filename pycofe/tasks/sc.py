##!/usr/bin/python

#
# ============================================================================
#
#    16.01.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CONTACT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python sc.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2023
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from pycofe.tasks import basic
from pycofe.dtypes import dtype_revision


# ============================================================================
# Make SC driver


class SC(basic.TaskDriver):
    def run(self):

        # fetch input data
        xyz = self.makeClass(self.input_data.data.xyz[0])

        # make command-line parameters

        cmd = ['XYZIN', xyz.getXYZFilePath(self.inputDir())]

        self.open_stdin()
        self.write_stdin([
            "MOLECULE 1",
            "CHAIN    " + xyz.chainSel,
            "MOLECULE 2",
            "CHAIN    " + xyz.chainSel2,
            "END"
        ])
        self.close_stdin()


       
        # --------------------------------------------------------------------

        # xyzin = xyz.getXYZFilePath(self.inputDir())

        # keywords = self.getParameter(self.task.parameters.SC_INPUT).strip()
        
        # keywords += ["END"]
        # for molecule in molecules:
        #     num = 1
        #     keywords = ('MOLECULE', num, '\n', 'CHAIN', xyz[i].chainSel)
        #     num += 1


        # run CONTACT
        self.runApp("sc",cmd, logType="Main")

        grid_id = self.getWidgetId("grid")
        self.putGrid(grid_id)
        self.putMessage1(
            grid_id, "See results in <i>Main Log</i><sup>&nbsp;&nbsp;</sup>", 0, 0
        )
        self.putDownloadButton(self.file_stdout_path(), "download", grid_id, 0, 1)

        # this will go in the project tree line
        self.generic_parser_summary["SC"] = {"summary_line": "summary"}

        # close execution logs and quit
        self.success(False)

        return

# ============================================================================

if __name__ == "__main__":

    drv = SC("", os.path.basename(__file__))
    drv.start()
