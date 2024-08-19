##!/usr/bin/python

#
# ============================================================================
#
#    08.07.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PUSHTOCLOUD DIFFRACTION IMAGES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python pushtocloud.py jobManager jobDir jobId
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
import os
# import time

import re
import json

# import pyrvapi
# import requests
# import urllib.parse
# import re

#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence
from  pycofe.varut import jsonut

# ============================================================================

class PushToData(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data

        imageMetadata = None
        with open(os.path.join(self.inputDir(),"__imageDirMeta.json")) as f:
            imageMetadata = json.load(f)

        if not imageMetadata:
            self.fail ( "<h3>Image Metadata Errors.</h3>" +\
                    "Image metadata could not be passed to the task.",
                    "Image metadata errors." )
            return

        imageDirMeta = imageMetadata["imageDirMeta"]

        for i in range(len(imageDirMeta)):
            if imageDirMeta[i]["path"]:
                self.putMessage ( "Upload image data from:<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>[" +\
                                  imageDirMeta[i]["path"] + "]</b>" )

        cloud_user  = None
        cloudrun_id = None
        api_url     = None
        mount_name  = None
        with open("__fetch_meta.json","r") as f:
            fetch_meta  = json.loads ( f.read() )
            cloud_user  = fetch_meta["login"]
            cloudrun_id = fetch_meta["cloudrun_id"]
            api_url     = fetch_meta["api_url"]
            mount_name  = fetch_meta["mount_name"]


        destFolder = self.getParameter ( self.task.parameters.sec1.contains.FOLDER )
        if destFolder:
            self.putMessage ( "<p>into CCP4 Cloud folder:<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>[" +\
                              str(mount_name) + "/push/" + destFolder + "]</b>" )
        else:  # this will never happen because of fuse in JS part
            self.putMessage ( "<p>Data will be placed at the <i>push</i> root of user's cloud storage" )

        self.stdoutln ( "cloud_user  = " + cloud_user      )
        self.stdoutln ( "cloudrun_id = " + cloudrun_id     )
        self.stdoutln ( "api_url     = " + str(api_url)    )
        self.stdoutln ( "mount_name  = " + str(mount_name) )

        # cloudrun_id = "rduk-is5p-0l5p-d40n"  # eugene main
        # cloudrun_id = "8c40-ic92-f9gs-0o4h"  # devel main

        cmd = [
            os.path.join ( self.jscofe_dir,"js-datalink","dl_client.js" ),
            "--url"        , str(api_url ),
            "--user"       , cloud_user,
            "--cloudrun_id", cloudrun_id,
            "--source"     , "push"
        ]
        if destFolder:
            cmd += ["--id",destFolder]
        cmd += ["upload","--"]

        for i in range(len(imageDirMeta)):
            if imageDirMeta[i]["path"]:
                cmd.append ( imageDirMeta[i]["path"] )

        self.flush()

        # self.stdoutln ( " >>>> " + str(cmd) )

        # start push here
        self.runApp ( "node",cmd,logType="Main" )

        self.putTitle ( "Results" )
        success = False        

        self.flush()
        self.file_stdout.close()
        f = open ( self.file_stdout_path(),"r" )
        std_lst = f.read().split("[K")
        f.close()
        # continue writing to stdout
        self.file_stdout = open ( self.file_stdout_path(),"a" )

        if len(std_lst)>0:
            results = jsonut.extract_json ( self,std_lst[len(std_lst)-1] )
            if results:
                success = results["success"]
                if success:
                    # self.putMessage ( "<b>Success.</b> " + results["msg"] )
                    self.putMessage ( "<b>Success.</b> Data was pushed in folder [" +\
                                      destFolder + "] in CCP4 Cloud Storage" )
                else:
                    self.putMessage ( "<b>Failure.</b> " + results["msg"] )

        self.success ( success )

        return


# ============================================================================

if __name__ == "__main__":

    drv = PushToData ( "",os.path.basename(__file__) )
    drv.start()
