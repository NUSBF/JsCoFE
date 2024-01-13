##!/usr/bin/python

#
# ============================================================================
#
#   26.12.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  Rotamer EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.rotamer jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_revision




# ============================================================================
# Model preparation driver

class Rotamer (basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        ixyz     = self.makeClass ( self.input_data.data.ixyz[0] )
        if ixyz._type == dtype_revision.dtype():
            ixyz = self.makeClass ( self.input_data.data.istruct[0] )
        sec1    = self.task.parameters.sec1.contains
        delt = self.getParameter ( sec1.DELT)

        cmd = [
            "XYZIN", ixyz.getPDBFilePath(self.inputDir())
        ]
        self.open_stdin()
        self.write_stdin ( ["DELT " + delt] )
        self.close_stdin()

        rc = self.runApp ( "rotamer",cmd,logType="Main")


        if rc.msg:
            self.putTitle ( "Failure" )
            self.putMessage ( "<i>Program failure, please report</i>" )
        else:
            grid_id = self.getWidgetId ( "grid" )
            self.putGrid ( grid_id )
            self.putMessage1 ( grid_id,"See results in <i>Main Log</i><sup>&nbsp;&nbsp;</sup>",0,0 )
            self.putDownloadButton ( self.file_stdout_path(),"download",grid_id,0,1 )
            
            # this will go in the project tree line
            self.generic_parser_summary["Rotamer"] = {
                "summary_line" : "rotamer analysis done"
            }

        # close execution logs and quit
        self.success ( False )

        return



# ============================================================================

if __name__ == "__main__":

    drv = Rotamer ( "",os.path.basename(__file__) )
    drv.start()
