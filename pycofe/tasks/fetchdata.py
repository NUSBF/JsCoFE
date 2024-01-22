##!/usr/bin/python

#
# ============================================================================
#
#    15.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FETCH DIFFRACTION IMAGES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python FetchData.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Jools Wills 2024
#
# ============================================================================
#

#  python native imports
# import sys
import os
import time

import pyrvapi

#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence
# from  pycofe.varut import rvapi_utils

# ============================================================================
# Make FetchData Utilities driver

class FetchData(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        pdb_code = self.getParameter ( self.task.parameters.PDB_CODE )

        self.putMessage ( "<b>PDB code:</b>&nbsp" + pdb_code );

        #   make a URL query using pdb_code

        #  data do not exist: issue a message and quit

        #  daya esists: poll service periodically and display some progress
        #  indicator. When finished, wrap up and quit

        # wait indicator:

        # row0   = self.rvrow

        # gridId = self.putWaitMessageLF ( "fetch is starting" )

        # time.sleep ( 10 )

        # self.rvrow = row0
        # gridId = self.putWaitMessageLF ( "fetch in progress" )
        # self.putMessage1 ( gridId,"&nbsp;&nbsp;0%",0,2 )
        # self.flush()
        # time.sleep ( 5 )
        # self.putMessage1 ( gridId,"&nbsp;&nbsp;40%",0,2 )
        # self.flush()
        # time.sleep ( 5 )
        # self.putMessage1 ( gridId,"&nbsp;&nbsp;80%",0,2 )
        # self.flush()
        # time.sleep ( 5 )
        # self.putMessage1 ( gridId,"&nbsp;&nbsp;100%",0,2 )
        # self.flush()
        # time.sleep ( 5 )

        # self.rvrow = row0
        # self.putMessage ( "<b>Fetch finsihed. Status: OK</b>" )


        self.putMessage ( "&nbsp;" )
        row0   = self.rvrow

        gridId = "pbgrid_" + str(self.widget_no)
        pbarId = "pbar_"   + str(self.widget_no)
        # pyrvapi.rvapi_set_text ( "&nbsp;",self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_set_text ( "<i>Fetch progress:</i><sup>&nbsp;</sup>" ,gridId,0,0,1,1 )
        pyrvapi.rvapi_add_progress_bar   ( pbarId,gridId,0,1,1,1 )
        pyrvapi.rvapi_set_progress_value ( pbarId,2,100 )  #  2: set range
        pyrvapi.rvapi_set_progress_value ( pbarId,3,0   )  #  3: set value
        pyrvapi.rvapi_set_progress_value ( pbarId,1,0   )  #  0/1: hide/show
        pyrvapi.rvapi_set_text  ( "ETA:</i><sup>&nbsp;</sup>",gridId,0,2,1,1 )
        pyrvapi.rvapi_flush ()

        time.sleep ( 5 )

        pyrvapi.rvapi_set_progress_value ( pbarId,3,20 );  #  3: set value
        pyrvapi.rvapi_set_text ( "ETA</i><sup>&nbsp;</sup>80",gridId,0,2,1,1 )
        self.flush()
        time.sleep ( 5 )
        pyrvapi.rvapi_set_progress_value ( pbarId,3,40 );  #  3: set value
        pyrvapi.rvapi_set_text ( "ETA:</i><sup>&nbsp;</sup>60",gridId,0,2,1,1 )
        self.flush()
        time.sleep ( 5 )
        pyrvapi.rvapi_set_progress_value ( pbarId,3,60 );  #  3: set value
        pyrvapi.rvapi_set_text ( "ETA:</i><sup>&nbsp;</sup>40",gridId,0,2,1,1 )
        self.flush()
        time.sleep ( 5 )
        pyrvapi.rvapi_set_progress_value ( pbarId,3,80 );  #  3: set value
        pyrvapi.rvapi_set_text ( "ETA:</i><sup>&nbsp;</sup>20",gridId,0,2,1,1 )
        self.flush()
        time.sleep ( 5 )
        pyrvapi.rvapi_set_progress_value ( pbarId,3,100 );  #  3: set value
        pyrvapi.rvapi_set_text ( "ETA:</i><sup>&nbsp;</sup>0",gridId,0,2,1,1 )
        self.flush()
        time.sleep ( 5 )

        self.rvrow = row0
        self.putMessage ( "<b>Fetch finsihed. Status: OK</b>" )

        have_results = False

        # this will go in the project tree line
        # if have_results:
        #     self.generic_parser_summary["FetchData"] = {
        #         "summary_line" : "results saved"
        #     }

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = FetchData ( "",os.path.basename(__file__) )
    drv.start()
