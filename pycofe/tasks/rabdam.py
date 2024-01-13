##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ UTILITIES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python rabdam.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2022-2024
#
# ============================================================================
#

#  python native imports
# import sys
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
from  pycofe.dtypes import dtype_structure,dtype_revision
from  pycofe.dtypes import dtype_sequence

# ============================================================================
# Make XUZ Utilities driver

class Rabdam(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        ixyz  = self.makeClass ( self.input_data.data.ixyz[0] )
        xyzin = None
        if ixyz._type==dtype_revision.dtype():
            istruct = self.makeClass ( self.input_data.data.istruct[0] )
            xyzin   = istruct.getMMCIFFilePath ( self.inputDir() )
            if not xyzin:
                xyzin = istruct.getPDBFilePath ( self.inputDir() )
        else:
            xyzin = ixyz.getMMCIFFilePath ( self.inputDir() )
            if not xyzin:
                xyzin = ixyz.getPDBFilePath ( self.inputDir() )

        self.runApp ( "rabdam",[
            "-f",os.path.abspath ( xyzin )
        ],logType="Main" )

        have_results = False

        # this will go in the project tree line
        # if have_results:
        #     self.generic_parser_summary["rabdam"] = {
        #         "summary_line" : "results saved"
        #     }

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = Rabdam ( "",os.path.basename(__file__) )
    drv.start()
