##!/usr/bin/python

#
# ============================================================================
#
#    26.02.24   <--  Date of Last Modification.
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
import os
import time

import pyrvapi
import json
import requests
import urllib.parse

#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence
# from  pycofe.varut import rvapi_utils

# ============================================================================
# Make FetchData Utilities driver

# class to handle communication with the Data Link API
class DataLink:

    # initialise API url, user and cloudrun_id
    def __init__(self, url, user, cloudrun_id):
        self.url = url + '/'
        self.user = user
        self.cloudrun_id = cloudrun_id

    # send a request to the Data Link API
    def api(self, method, endpoint, use_auth = True):
        url = urllib.parse.urljoin(self.url, endpoint)
        auth_headers = {}

        if use_auth:
            auth_headers = { 'cloudrun_id': self.cloudrun_id }

        # set up request retries
        session = requests.Session()
        retries = requests.adapters.Retry(total = 10, backoff_factor = 0.1)
        session.mount('http://', requests.adapters.HTTPAdapter(max_retries = retries))
        session.mount('https://', requests.adapters.HTTPAdapter(max_retries = retries))

        try:
            res = session.request(method, url, headers = auth_headers)
        except requests.exceptions.RequestException as e:
            return False, e

        # parse JSON
        try:
            obj = json.loads(res.text)
        except:
            return False, 'Error communicating with DataLink API'

        # on error return false and the error message
        if 'error' in obj:
            return False, obj['msg']

        # return true and the data object
        return True, obj

    # search the API for data source entries matching the PDB Identifier
    def search(self, pdb):
        return self.api('GET', 'search/' + pdb, use_auth = False)

    # get information about a data source
    def source_info(self, source):
        return self.api('GET', 'sources/' + source)

    # fetch data for the user from a data source
    def fetch(self, source, id):
        endpoint = f'data/{self.user}/{source}/{id}'
        return self.api('PUT', endpoint)

    # get the status of an existing data fetch
    def status(self, source, id):
        endpoint = f'data/{self.user}/{source}/{id}'
        return self.api('GET', endpoint)

class FetchData(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def putProgressBar ( self,label,range,eta=None,holderId=None,row=-1,value=0 ):
        gridId = self.getWidgetId ( "pbgrid" )
        pbarId = self.getWidgetId ( "pbar"   )
        pyrvapi.rvapi_add_grid ( gridId,False,
                                holderId if holderId else self.report_page_id(),
                                row if row>=0 else self.rvrow,0,1,1 )
        vshift = "<span style=\"font-size:120%\"><sup>&nbsp;</sup></span>"
        pyrvapi.rvapi_set_text ( label + vshift,gridId,0,0,1,1 )
        pyrvapi.rvapi_add_progress_bar   ( pbarId,gridId,0,1,1,1 )
        pyrvapi.rvapi_set_progress_value ( pbarId,2,range )  #  2: set range
        pyrvapi.rvapi_set_progress_value ( pbarId,3,value )  #  3: set value
        pyrvapi.rvapi_set_progress_value ( pbarId,1,0     )  #  0/1: hide/show
        if eta:
            pyrvapi.rvapi_set_text ( vshift + eta, gridId,0,2,1,1 )
        pyrvapi.rvapi_flush()
        return { "gridId" : gridId, "pbarId" : pbarId }  # pbarMeta

    def setProgressBar ( self,pbarMeta,value,eta=None ):
        pyrvapi.rvapi_set_progress_value ( pbarMeta["pbarId"],3,value ); # 3: set value
        if eta:
            vshift = "<span style=\"font-size:120%\"><sup>&nbsp;</sup></span>"
            pyrvapi.rvapi_set_text ( vshift + eta, pbarMeta["gridId"],0,2,1,1 )
        pyrvapi.rvapi_flush()
        return

    def dlSummary(self, msg):
        self.generic_parser_summary["fetchdata"] = {
            "summary_line" : msg
        }
        return

    def dlError(self, msg):
        summary = msg
        if type(msg).__name__ == 'ConnectionError':
            summary = "connection error"
        self.dlSummary(f'datalink error {type(msg)}: {summary}')
        self.fail(f'<b>Data Link Error:</b> {msg}', str(msg))
        return

    def run(self):

        # get the user entered PDB code
        pdb_code = self.getParameter ( self.task.parameters.PDB_CODE )

        self.putMessage (f'<p><b>PDB code:</b> {pdb_code}</p>')

        # create a DataLink class instance - DL_URL, CLOUD_USER and CLOUDRUN_ID are currently hardcoded
        # but I assume they can be passed in as a task parameter or similar?

        cloud_user  = None
        cloudrun_id = None
        with open("__fetch_meta.json","r") as f:
            fetch_meta = json.loads ( f.read() )
            cloud_user  = fetch_meta["login"]
            cloudrun_id = fetch_meta["cloudrun_id"]
            api_url = fetch_meta["api_url"]
            mount_name = fetch_meta["mount_name"]

        dl = DataLink(api_url, cloud_user, cloudrun_id)

        # search the API for data source entries that match the PDB code
        res, search_info = dl.search(pdb_code)
        if not res:
            self.dlError(search_info);
            return

        results = search_info['results'];

        # if there are no results, return
        if len(results) == 0:
            msg = f'no results for {pdb_code}'
            self.dlSummary(msg)
            self.putMessage( f'<b>Sorry - {msg}' )
            self.success(False)
            return

        # loop through all results, querying the data
        for data in results:
            data_source = data['source']
            data_id = data['id']
            data_name = data['name']
            data_doi = data['doi']

            # get info about data source
            res, source_info = dl.source_info(data_source)
            if not res:
                self.dlError(source_info)
                return

            # display information about the data source
            data_source_desc = source_info['description']
            data_source_url = source_info['url']
            self.putMessage(f'<b>Name:</b> {data_name}')
            self.putMessage(f'<b>Source:</b> {data_source_desc} (<a href="{data_source_url}" target="_new">{data_source_url}</a>)' )
            self.putMessage(f'<b>DOI:</b> <a href="https://www.doi.org/{data_doi}" target="_new">https://www.doi.org/{data_doi}</a><br /><br />')

            # send a fetch request in to the API
            res, fetch_info = dl.fetch(data_source, data_id)
            if not res:
                self.dlError(fetch_info)
                return

        # initialise progress bar
        pbarMeta = self.putProgressBar('Fetching data:', 100)

        status_c = 0
        # status_c is incremented when a data fetch status is "completed"
        # so when all data fetchs are complete, the loop will end
        while status_c != len(results):
            time.sleep(10)
            status_c = 0
            size = 0
            size_s = 0
            # loop through the results and check the status of each fetch
            for result in results:
                res, data_info = dl.status(data['source'], data['id'])
                if not res:
                    self.dlError(data_info)
                    return

                if data_info['status'] == 'failed':
                    self.dlError(f'Fetch of {data_info["source"]}/{data_info["id"]} failed')
                    return

                if data_info['status'] == 'completed':
                    status_c += 1

                size += data_info['size']

                # data source size (size_s) may not be immediately available
                if 'size_s' in data_info:
                    size_s += data_info['size_s']

            if size_s > 0:
                note = ''
                percent = int(size / size_s * 100)
                # if percent is 100 (or more), then we are processing / unpacking
                if percent >= 100:
                    percent = 100
                    note = 'Unpacking/preparing data ...'

                # update the progress bar
                self.setProgressBar ( pbarMeta, percent, note )

        # display finish message and data size
        self.putMessage ('<p><b>Data fetch finished. Status: OK</b>')
        self.putMessage (f'<b>Data size: {size}</b></p>')

        # loop through the results, and display data locations
        self.putMessage (f'<b>For processing images with Xia-2 and importing data with "Cloud import" tasks, use the following location(s):</b>')
        msgs = []
        for data in results:
            msgs.append(data["source"] + '/' + data["id"])
            path = os.path.join(mount_name, data["source"], data["id"])
            self.putMessage (f'<tt>{path}</tt>')

        self.dlSummary(f'fetched data set(s) for {pdb_code}: {",".join(msgs)}')

        self.success(True)

        return


# ============================================================================

if __name__ == "__main__":

    drv = FetchData ( "",os.path.basename(__file__) )
    drv.start()
