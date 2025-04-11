##!/usr/bin/python

#
# ============================================================================
#
#    11.04.25   <--  Date of Last Modification.
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
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022-2025
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_revision
from  pycofe.varut  import signal,mmcif_utils


# ============================================================================
# Make XUZ Utilities driver

class Rabdam(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        use_mmcif = True  # assign False to force using PDB. When set True,
                          # PDB will be still used as a fallback if available

        # fetch input data
        ixyz  = self.makeClass ( self.input_data.data.ixyz[0] )
        xyzin = None
        if ixyz._type==dtype_revision.dtype():
            istruct = self.makeClass ( self.input_data.data.istruct[0] )
            if use_mmcif:
                xyzin = istruct.getXYZFilePath ( self.inputDir() )
            else:
                xyzin = istruct.getPDBFilePath ( self.inputDir() )
        elif use_mmcif:
            xyzin = ixyz.getXYZFilePath ( self.inputDir() )
        else:
            xyzin = ixyz.getPDBFilePath ( self.inputDir() )

        # the rest is PDB/mmCIF agnostic

        fbasepath, fext = os.path.splitext ( xyzin )

        # rabdam does not like dots in file names – improper handling of file names
        xyzin1 = os.path.basename ( fbasepath )
        if "." in xyzin1:
            xyzin1 = xyzin1.replace ( ".","_" ) + fext
            shutil.copyfile ( xyzin,xyzin1 )
            xyzin  = xyzin1

        if fext.upper()!=".PDB":
            fext   = ".cif"  # another rabdam's "feature" – it checks extension 
                             # rather than content, so renaming is the only
                             # way to cope with alternatives
            xyzin1 = os.path.basename(fbasepath) + fext
            # shutil.copyfile ( xyzin,xyzin1 )
            mmcif_utils.clean_mmcif ( xyzin,xyzin1 )  # just in case
            xyzin  = xyzin1

        # sometimes rabdam asks for user's "yes" -- just give it for all cases1
        self.write_stdin_all ( "yes\n" )

        rc = self.runApp ( "rabdam",[
            "-f",os.path.abspath ( xyzin )
        ],logType="Main" )

        # check that Rabdam did not fail on mmCIF format (weak parser)
        if fext.upper()!=".PDB":

            self.flush()
            self.file_stdout.close()
            suspect_format = False
            with (open(self.file_stdout_path(),'r')) as fstd:
                for line in fstd:
                    if "ERROR: " in line and "mmCIF" in line:
                        suspect_format = True
                        break
            self.file_stdout  = open ( self.file_stdout_path(),'a' )

            if suspect_format:
                self.stdoutln ( "\n ========= SWITCHING TO PDB FILE\n" )
                if ixyz._type==dtype_revision.dtype():
                    xyzin = istruct.getPDBFilePath ( self.inputDir() )
                else:
                    xyzin = ixyz.getPDBFilePath ( self.inputDir() )
                if xyzin:  # check because PDB may be unavailable
                    fbasepath, fext = os.path.splitext ( xyzin )
                    # need to be repeated
                    self.write_stdin_all ( "yes\n" )
                    rc = self.runApp ( "rabdam",[
                        "-f",os.path.abspath ( xyzin )
                    ],logType="Main" )
                else:
                    self.stdoutln ( "\n ========= PDB FILE NOT AVAILABLE\n" )
                    self.putMessage ( "<h3>Could not parse mmCIF file while PDB file not available -- stop</h3>" )

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
                    xyzout = self.getOFName ( fext )
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
