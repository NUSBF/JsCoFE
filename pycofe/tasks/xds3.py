#!/usr/bin/python

#
# ============================================================================
#
#    10.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XDS PROCESSING EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.xds3.py jobManager jobDir jobId
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
# import json

#  application imports
from . import basic
from pycofe.proc   import import_unmerged

# ============================================================================
# Make DUI driver

class XDS3(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        if "XDS_home" not in os.environ:
            self.fail ( "<h3>XDS Software is not installed</h3>" +\
                    "This task requires XDS Software, " +\
                    "installation of which was not found.",
                    "XDS Software is not installed." )
            return

        # imageMetadata = None
        # with open(os.path.join(self.inputDir(),"__imageDirMeta.json")) as f:
        #     imageMetadata = json.load(f)

        # if not imageMetadata:
        #     self.fail ( "<h3>Image Metadata Errors.</h3>" +\
        #             "Image metadata could not be passed to the task.",
        #             "Image metadata errors." )
        #     return

        # ipath = None
        # imageDirMeta = imageMetadata["imageDirMeta"]
        # if self.task.datatype=="images":
        #     for i in range(len(imageDirMeta)):
        #         if imageDirMeta[i]["path"]:
        #             sectors = imageDirMeta[i]["sectors"]
        #             for j in range(len(sectors)):
        #                 ipath = os.path.join ( imageDirMeta[i]["path"],sectors[j]["name"] )
        # else:
        #     ipath = imageDirMeta[0]["path"]

        # if not ipath:
        #     self.fail ( "<h3>Image Path not Found.</h3>" +\
        #             "Image path not found in task metadata (this is a bug).",
        #             "Image path not found in task metadata." )
        #     return

        # Prepare path for the script

        with open("XDS.INP","w") as fout:
            fout.write ( self.task.parameters.XDS_INP.label )

        environ = os.environ.copy()
        environ["PATH"] = os.environ["XDS_home"] + ":" + os.environ["PATH"]
 
        rc = self.runApp ( "xds",["XDS.INP"],logType="Main",env=environ )
        self.addCitation ( "xds" )

        # Check for output files file

        have_results = False
        xds_ascii    = "XDS_ASCII.HKL"
        summary_line = "no datasets created"
        if os.path.isfile(xds_ascii):
            self.putTitle ( "Results" )
            newHKLFPath = self.getOFName("_unmerged_scaled.HKL",-1)
            os.rename ( xds_ascii,newHKLFPath )
            self.addFileImport ( newHKLFPath ) #,import_filetype.ftype_MTZIntegrated() )
            unmerged_imported = import_unmerged.run ( self,"Unmerged Scaled Reflection Dataset" )
            for i in range(len(unmerged_imported)):
                # unmerged_imported[i].ha_type = hatom
                self.putMessage ( "<b>Assigned name:</b>&nbsp;" + unmerged_imported[i].dname  )
            summary_line = str(len(unmerged_imported)) + " unmerged scaled dataset(s) created"
            have_results = True

        self.generic_parser_summary["parrot"] = {
            "summary_line" : summary_line
        }

        self.success ( have_results )

        return



# ============================================================================

if __name__ == "__main__":

    drv = XDS3 ( "",os.path.basename(__file__) )
    drv.start()
