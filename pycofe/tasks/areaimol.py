##!/usr/bin/python

#
# ============================================================================
#
#    25.12.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AREAIMOL EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python areaimol.py jobManager jobDir jobId
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
# Make Areaimol driver

class Areaimol(basic.TaskDriver):

    def run(self):

        # fetch input data
        ixyz = self.makeClass ( self.input_data.data.ixyz[0] )
        if ixyz._type==dtype_revision.dtype():
            ixyz = self.makeClass ( self.input_data.data.istruct[0] )

        # --------------------------------------------------------------------

        xyzin = ixyz.getPDBFilePath ( self.inputDir() )

        # Prepare report parser
        self.setGenericLogParser ( "areaimol_report",False )

        keywords = self.getParameter(self.task.parameters.AREAIMOL_INPUT).strip()
        if keywords=="":
            keywords = "END"

        self.open_stdin  ()
        self.write_stdin ( keywords )
        self.close_stdin ()

        # run AREAIMOL
        self.runApp (
            "areaimol",["XYZIN",xyzin],
            logType="Main"
        )

        self.unsetLogParser()
        self.putMessage ( "&nbsp;" )

        grid_id = self.getWidgetId ( "grid" )
        self.putGrid ( grid_id )
        self.putMessage1 ( grid_id,"See full report in <i>Main Log</i><sup>&nbsp;&nbsp;</sup>",0,0 )
        self.putDownloadButton ( self.file_stdout_path(),"download",grid_id,0,1 )

        # this will go in the project tree line
        self.generic_parser_summary["areaimol"] = {
            "summary_line" : "SAS areas calculated"
        }

        # close execution logs and quit
        self.success ( False )

        return


# ============================================================================

if __name__ == "__main__":

    drv = Areaimol ( "",os.path.basename(__file__) )
    drv.start()
