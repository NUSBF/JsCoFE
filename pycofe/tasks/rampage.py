##!/usr/bin/python

#
# ============================================================================
#
#    26.12.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  RAMPAGE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python rampage.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2022
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

class Rampage(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        ixyz  = self.makeClass ( self.input_data.data.ixyz[0] )
        xyzin = None
        if ixyz._type==dtype_revision.dtype():
            istruct = self.makeClass ( self.input_data.data.istruct[0] )
            xyzin = istruct.getPDBFilePath ( self.inputDir() )
        else:
            xyzin = ixyz.getPDBFilePath ( self.inputDir() )

        rapperDir = os.path.join ( os.environ["CCP4"],"share","rapper" )
        out_ps    = "_out.ps"

        rc = self.runApp ( "rapper",[
            os.path.join(rapperDir,"params.xml"), "rampage",
            "--pdb",                xyzin,
            "--rampage-postscript", out_ps,
            "--rapper-dir",         rapperDir
        ],logType="Main" )

        have_results = False
        if rc.msg:
            self.putMessage ( "Terminated with message: " + rc.msg )
        else:
            self.putMessage ( "Normal termination" )

        if os.path.isfile(out_ps):

            out_pdf = self.getOFName(".pdf")

            self.runApp ( "ps2pdf",[out_ps,out_pdf],logType="Service" )

            if os.path.isfile(out_pdf):

                os.rename ( out_pdf,os.path.join(self.reportDir(),out_pdf) )
                os.remove ( out_ps )   # just to clean up

                have_results = True
        
                self.putTitle ( "Ramachandran Plots" )

                self.putMessage ( "<object data=\"" + out_pdf +\
                        "\" type=\"application/pdf\" " +\
                        "style=\"border:none;width:100%;height:1000px;\"></object>",
                    0 )

                # srfsecId = self.getWidgetId ( "srf_report" )
                # self.putSection  ( srfsecId,"Self-Rotation Function",openState_bool=False )
                # self.putMessage1 ( srfsecId,"<object data=\"" + pdfpath +\
                #         "\" type=\"application/pdf\" " +\
                #         "style=\"border:none;width:100%;height:1000px;\"></object>",
                #     0 )

            else:
                self.putMessage ( "<h3>Error: PDF document was not generated</h3>" )

        else:
            self.putTitle ( "Ramachandran analysis failed" )


        # this will go in the project tree line
        if have_results:
            self.generic_parser_summary["rampage"] = {
                "summary_line" : "ramachandran plots generated"
            }
        else:
            self.generic_parser_summary["rampage"] = {
                "summary_line" : "failed to produce ramachandran plots"
            }

        # close execution logs and quit
        self.success ( False )

        return


# ============================================================================

if __name__ == "__main__":

    drv = Rampage ( "",os.path.basename(__file__) )
    drv.start()
