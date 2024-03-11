#!/usr/bin/python

#
# ============================================================================
#
#    09.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XDS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.xds.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2024
#
# ============================================================================
#

#  python native imports
import os
import json
import re

import pyrvapi

#  application imports
from . import basic
from   pycofe.auto   import auto

# ============================================================================
# Make DUI driver

class XDS(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated HKL dataset(s)
    # def importDir        (self):  return "./"   # import from working directory
    # def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        if "XDS_home" not in os.environ:
            self.fail ( "<h3>XDS Software is not installed</h3>" +\
                    "This task requires XDS Software, " +\
                    "installation of which was not found.",
                    "XDS Software is not installed." )
            return

        imageMetadata = None
        with open(os.path.join(self.inputDir(),"__imageDirMeta.json")) as f:
            imageMetadata = json.load(f)

        if not imageMetadata:
            self.fail ( "<h3>Image Metadata Errors.</h3>" +\
                    "Image metadata could not be passed to the task.",
                    "Image metadata errors." )
            return

        ipath = None
        imageDirMeta = imageMetadata["imageDirMeta"]
        if self.task.datatype=="images":
            for i in range(len(imageDirMeta)):
                if imageDirMeta[i]["path"]:
                    sectors = imageDirMeta[i]["sectors"]
                    for j in range(len(sectors)):
                        ipath = os.path.join ( imageDirMeta[i]["path"],sectors[j]["name"] )
        else:
            ipath = imageDirMeta[0]["path"]

        if not ipath:
            self.fail ( "<h3>Image Path not Found.</h3>" +\
                    "Image path not found in task metadata (this is a bug).",
                    "Image path not found in task metadata." )
            return

        sec1 = self.task.parameters.sec1.contains

        # Prepare path for the script
        matches = re.findall ( r'0+[1-9]\d*(?=[^0-9]|$)',ipath )
        if len(matches)<=0:
            self.fail ( "<h3>Image names do not match expected pattern.</h3>"   +\
                    "Image names must include fixed-length serial numbers, "    +\
                    "e.g., <pre>mydata_1_00001.img</pre> for 1st image. Such "  +\
                    "pattern was not identified. Consider renaming your image " +\
                    "files.",
                    "Image names do not match expected pattern." )
            return

        match0 = matches[0]
        for i in range(len(matches)):
            if len(matches[i])>len(match0):
                match0 = matches[i]
        ipath = ipath.replace ( match0,"?"*len(match0) )

        environ = os.environ.copy()
        environ["PATH"] = os.environ["XDS_home"] + ":" + os.environ["PATH"]
 
        rc = self.runApp ( "generate_XDS.INP",[ipath],logType="Main",env=environ )
        self.addCitation ( "xds" )

        # Check for XDS.INP file

        have_results = False
        summary_line = ""
        
        if os.path.isfile("XDS.INP"):
            
            xds_inp = ""
            with open("XDS.INP","r") as fin:
                xds_inp = fin.read()
            
            os.rename ( "XDS.INP",os.path.join(self.outputDir(),"XDS.INP") )
            self.putMessage ( "<b>Image files analysed and XDS input file " +\
                              "created.</b><br>&nbsp;" )

            xds_mode = self.getParameter ( sec1.MODE_SEL )

            task_options = { "prevent_autostart" : False }
            if xds_mode!="A":
                task_options["prevent_autostart"] = True
            task_options = "'".join(json.dumps(task_options).split('"'))

            pyrvapi.rvapi_add_button ( self.getWidgetId("xds_processing"),
                    "Run XDS processing","{function}",
                    "window.parent.rvapi_runHotButtonJob(" + self.job_id +\
                    ",'TaskXDS3'," + task_options + ")",
                    False,self.report_page_id(),self.rvrow,0,1,1 )

            self.rvrow  += 1
            have_results = True
            summary_line = "XDS processing prepared"

            # version relying on client code in browser -- better to avoid as
            # XDS task may see a use in workflows
            # if xds_mode!="M":
            #     self.task.task_chain = ["TaskXDS3"]     

            # version exploiting in-built automatic workflow framework
            if xds_mode!="M":
                self.task.autoRunName = "_root"
                self.task.autoRunId   = "auto-XDS"
                if auto.makeNextTask ( self,{
                    "xds_inp" : xds_inp
                },self.file_stderr):
                    summary_line += " and started"
                    self.putMessage ( "<h3>XDS processing started</hr>" )
                else:
                    summary_line += ", but XDS processing start failed"

        else:
            self.putMessage ( "<b>Image files analysis was not successful.<b>" )
            self.putMessage ( "<b>Return code:<b> " + rc.msg )
            summary_line = "failed to prepare XDS processing"

        self.generic_parser_summary["parrot"] = {
            "summary_line" : summary_line
        }

        self.success ( have_results )

        return



# ============================================================================

if __name__ == "__main__":

    drv = XDS ( "",os.path.basename(__file__) )
    drv.start()
