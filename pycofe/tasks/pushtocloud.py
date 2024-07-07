##!/usr/bin/python

#
# ============================================================================
#
#    07.07.24   <--  Date of Last Modification.
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
import time

import pyrvapi
import json
import requests
import urllib.parse
import re

#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence
# from  pycofe.varut import rvapi_utils

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
                self.putMessage ( "push data from " + imageDirMeta[i]["path"] )

        destFolder = self.getParameter ( self.task.parameters.sec1.contains.FOLDER )
        if destFolder:
            self.putMessage ( "<p>destination folder: " + destFolder )
        else:  # this will never happen because of fuse in JS part
            self.putMessage ( "<p>data will be placed at the root of user's cloud storage" )

        cloud_user  = None
        cloudrun_id = None
        api_url     = None
        mount_name  = None
        with open("__fetch_meta.json","r") as f:
            fetch_meta = json.loads ( f.read() )
            cloud_user  = fetch_meta["login"]
            cloudrun_id = fetch_meta["cloudrun_id"]
            api_url = fetch_meta["api_url"]
            mount_name = fetch_meta["mount_name"]

        self.putMessage ( "cloud_user = " + cloud_user )
        self.putMessage ( "cloudrun_id = " + cloudrun_id )
        self.putMessage ( "api_url = " + str(api_url) )
        self.putMessage ( "mount_name = " + str(mount_name) )

        # start push here
        # self.runApp ( "node",[
        #     "arg1",
        #     "arg2",
        #     "argN"
        # ],logType="Main" )

        """
        ./dl_client.js --url http://130.246.93.69:8100/api --user jools-dev --cloudrun_id nxvd-3uq5-ch23-u0n2 --source test --id data1 upload  -- PATH/TO/FILES
        """

        self.putMessage ( "Data was pushed in folder " +\
                          os.path.join(cloud_user,destFolder) +\
                          " in Cloud Storage" )

        self.success(True)

        return


# ============================================================================

if __name__ == "__main__":

    drv = PushToData ( "",os.path.basename(__file__) )
    drv.start()
