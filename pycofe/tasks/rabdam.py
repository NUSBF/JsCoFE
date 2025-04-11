##!/usr/bin/python

#
# ============================================================================
#
#    11.04.24   <--  Date of Last Modification.
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
import shutil


#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence
from  pycofe.dtypes import dtype_revision
from  varut import signal


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
            
            xyzin = istruct.getPDBFilePath ( self.inputDir() )
        else:
            xyzin = ixyz.getPDBFilePath ( self.inputDir() )

        fbasepath, fext = os.path.splitext ( xyzin )

        if fext.upper()!=".PDB":
            fext   = ".cif"
            xyzin1 = os.path.basename(fbasepath) + fext
            shutil.copyfile ( xyzin,xyzin1 )
            xyzin  = xyzin1

        self.open_stdin()
        self.write_stdin ( "yes\n" )
        self.close_stdin()

        rc = self.runApp ( "rabdam",[
            "-f",os.path.abspath ( xyzin )
        ],logType="Main" )
        have_results = False
        self.addCitations ( ['rabdam'] )

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>Rabdam failure</h3>" )
            raise signal.JobFailure ( rc.msg )
        
        else:
            final_pdb  = None
            name = os.path.basename(xyzin)
            rabdam_dir = os.path.join("Logfiles", name.replace(fext, ""))


            try:
                final_pdb = os.path.join(rabdam_dir, f"{name.replace(fext, '')}_BDamage" + fext)
                if os.path.exists ( final_pdb ):
                    xyzout = self.getXYZOFName()
                    shutil.copyfile ( final_pdb,xyzout )

            except:
                pass


            html_path = None
            html_path = rabdam_dir
            log_file = os.path.join ( "_stdout.log" )
            if os.path.exists(log_file):
                with open(log_file, "r") as log:
                    for line in log:
                        if "ERROR: More than one model present in input PDB file." in line:
                            self.putMessage("<h3>Error: More than one model present in input PDB file. Please use a PDB file containing a single model.</h3>")
                            return
            
            

            html_report = os.path.join ( html_path, f"{name.replace(fext, '')}_BDamage.html")
            if os.path.exists(html_report):
                with open(html_report, "r") as file:
                    lines = file.readlines()
                with open(html_report, "w") as file:
                    for line in lines:  
                        if "<h1>" in line and "</h1>" in line:
                            file.write("<h1>Rabdam Report</h1>\n")
                        elif "<p id=\"file_info\">" in line:
                            file.write("<p id=\"file_info\"></p>\n")
                        else:
                            file.write(line)
            if os.path.exists(html_report):
                
                self.insertTab   ( "html_report","Rabdam Report",None,True )
                self.putMessage1 (
                    "html_report",
                    "<iframe src=\"../" + html_report + "\" " + \
                    "style=\"display:block;border:none;position:absolute;top:50px;left:0;width:100vw;height:90%;overflow-x:auto;\"></iframe>",
                    0 )
                self.success ( have_results )

        
        return


# ============================================================================

if __name__ == "__main__":

    drv = Rabdam ( "",os.path.basename(__file__),
                  { "report_page" : { "show" : True, "name" : "Summary" } }  )
    drv.start()
