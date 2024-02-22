##!/usr/bin/python

#
# ============================================================================
#
#    25.01.24   <--  Date of Last Modification.
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
import time

import pyrvapi
import json
import requests

#  application imports
from  pycofe.tasks  import basic
# from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
# from  pycofe.dtypes import dtype_sequence
# from  pycofe.varut import rvapi_utils

# ============================================================================
# Make FetchData Utilities driver

# hardcoded to get the settings from the environment
DL_URL = os.environ['DL_URL']
CLOUD_USER = os.environ['CLOUD_USER']
CLOUDRUN_ID = os.environ['CLOUDRUN_ID']

# class to handle communication with the Data Link API
class DataLink:

    # initialise API url, user and cloudrun_id
    def __init__(self, url, user, cloudrun_id):
        self.url = url
        self.user = user
        self.cloudrun_id = cloudrun_id

    # send a request to the Data Link API
    def api(self, method, endpoint, use_auth = True):
        url = self.url + '/api/' + endpoint
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
        obj = json.loads(res.text)

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

    # acquire data for the user from a data source
    def acquire(self, source, id):
        endpoint = f'data/{self.user}/{source}/{id}'
        return self.api('PUT', endpoint)

    # get the status of an existing data acquire
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

    def run(self):

        # get the user entered PDB code
        pdb_code = self.getParameter ( self.task.parameters.PDB_CODE )

        self.putMessage (f'<p><b>PDB code:</b> {pdb_code}</p>')

        # create a DataLink class instance - DL_URL, CLOUD_USER and CLOUDRUN_ID are currently hardcoded
        # but I assume they can be passed in as a task parameter or similar?

        # cloud_user  = ''''''''
        # cloudrun_id = ''''''''
        dl = DataLink(DL_URL, CLOUD_USER, CLOUDRUN_ID)

        # search the API for data source entries that match the PDB code
        res, search_info = dl.search(pdb_code)
        if not res:
            self.fail(f'<b>Error:</b> {search_info}', 'Data Link Error')
            return

        results = search_info['results'];

        # if there are no results, return
        if len(results) == 0:
            self.putMessage( f'<b>Sorry - no results for {pdb_code}</b>' )
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
                self.fail(f'<b>Error:</b> {source_info}', 'Data Link Error')
                return

            # display information about the data source
            data_source_desc = source_info['description']
            data_source_url = source_info['url']
            self.putMessage(f'<b>Name:</b> {data_name}')
            self.putMessage(f'<b>Source:</b> {data_source_desc} (<a href="{data_source_url}" target="_new">{data_source_url}</a>)' )
            self.putMessage(f'<b>DOI:</b> <a href="https://www.doi.org/{data_doi}" target="_new">https://www.doi.org/{data_doi}</a><br /><br />')

            # send an acquire request in to the API
            res, acquire_info = dl.acquire(data_source, data_id)
            if not res:
                self.fail(f'<b>Error:</b> {acquire_info}','Data Link Error')
                return

        # initialise progress bar
        pbarMeta = self.putProgressBar('Data is being acquired', 100)

        status_c = 0
        # status_c is incremented when a data acquire status is "completed"
        # so when all data acquires are complete, the loop will end
        while status_c != len(results):
            time.sleep(10)
            status_c = 0
            size = 0
            size_s = 0
            # loop through the results and check the status of each acquire
            for result in results:
                res, data_info = dl.status(data['source'], data['id'])
                if not res:
                    self.fail(f'<b>Error:</b> {data_info}', 'Data Link Error')
                    return

                if data_info['status'] == 'failed':
                    self.fail('<p><b>Error: Acquire of {data_info["source"]}/{data_info["id"]} Failed</b>', 'Data Link Error')
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
        self.putMessage ('<p><b>Data Acquire Finished. Status: OK</b>')
        self.putMessage (f'<b>Data Size: {size}</b></p>')

        # loop through the results, and display data locations
        self.putMessage (f'<b>Data Location(s):</b>')
        for data in results:
            self.putMessage (f'<tt>{data["source"]}/{data["id"]}</tt>')

        self.success(True)

        return


# ============================================================================

if __name__ == "__main__":

    drv = FetchData ( "",os.path.basename(__file__) )
    drv.start()
