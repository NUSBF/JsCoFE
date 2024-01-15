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

#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence

# ============================================================================
# Make FetchData Utilities driver

class FetchData(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        pdb_code = self.getParameter ( self.task.parameters.PDB_CODE )

        self.putMessage ( "<b>PDB code:</b>&nbsp" + pdb_code );

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
