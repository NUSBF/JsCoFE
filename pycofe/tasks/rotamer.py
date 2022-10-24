##!/usr/bin/python

#
# ============================================================================
#
#    24.10.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ROTAMER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python rotamer.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2020-2022
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_revision


# ============================================================================
# Make Rotamer driver

class Rotamer(basic.TaskDriver):

    def run(self):

        # fetch input data
        ixyz = self.makeClass ( self.input_data.data.ixyz[0] )
        if ixyz._type==dtype_revision.dtype():
            ixyz = self.makeClass ( self.input_data.data.istruct[0] )

        # --------------------------------------------------------------------

        xyzin = ixyz.getXYZFilePath ( self.inputDir() )

        self.open_stdin()
        self.write_stdin ( self.getParameter(self.task.parameters.ROTAMER_INPUT) )
        self.close_stdin()

        # run ROTAMER
        self.runApp (
            "rotamer",["XYZIN",xyzin],
            logType="Main"
        )

        grid_id = self.getWidgetId ( "grid" )
        self.putGrid ( grid_id )
        self.putMessage1 ( grid_id,"See results in <i>Main Log</i><sup>&nbsp;&nbsp;</sup>",0,0 )
        self.putDownloadButton ( self.file_stdout_path(),"download",grid_id,0,1 )

        # this will go in the project tree line
        self.generic_parser_summary["Rotamer"] = {
            "summary_line" : "Rotamer list was produced"
        }

        # close execution logs and quit
        self.success ( False )

        return


# ============================================================================

if __name__ == "__main__":

    drv = Rotamer ( "",os.path.basename(__file__) )
    drv.start()
