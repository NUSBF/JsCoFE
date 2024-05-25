##!/usr/bin/python

#
#   RETIRED, TO BE DELETED.  25.05.2024
#

#
# ============================================================================
#
#    10.04.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ICAT UPDATE MODULE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import sys
import json
from   suds.client import Client
import requests
import time
#import StringIO
import shutil

# ============================================================================

logf = None

def initLog ( jobDir ):
    global logf
    logf = open ( os.path.join(jobDir,"icat.log"),"w" )

def writeLog ( S ):
    global logf
    if logf:
        logf.write ( S )
        logf.flush()

def closeLog():
    global logf
    if logf:
        logf.close()

# ============================================================================

def getSessionId ( fdata,wdsl ):

    # Get the WSDL file for SOAP. Currently uses the ICAT instance for public Diamond data
    try:
        client = Client ( wdsl )
    except:
        return "No SOAP Client"
    icat    = client.service
    factory = client.factory

    # Get a session ID:
    credentials = factory.create ( "login.credentials" )
    entry       = factory.create ( "login.credentials.entry" )
    entry.key   = "username"
    entry.value = fdata["uid"]
    credentials.entry.append ( entry )
    entry       = factory.create ( "login.credentials.entry" )
    entry.key   = "password"
    entry.value = fdata["pwd"]
    credentials.entry.append ( entry )
    try:
        sessionId = icat.login ( "ldap", credentials )
        return (icat,sessionId)
    except:
        return "Wrong Name or Password"

# ----------------------------------------------------------------------------

def getVisits ( fdata,wdsl ):
    result = {}
    session = getSessionId ( fdata,wdsl )
    if len(session) != 2:
        result["status"] = session
    else:
        icat      = session[0]
        sessionId = session[1]
        # query for all visit IDs, names and dates, sorting by date
        vid   = icat.search ( sessionId,"SELECT i.visitId   FROM Investigation i ORDER BY i.startDate DESC" )
        vname = icat.search ( sessionId,"SELECT i.name      FROM Investigation i ORDER BY i.startDate DESC" )
        vdate = icat.search ( sessionId,"SELECT i.startDate FROM Investigation i ORDER BY i.startDate DESC" )
        result["vid"]   = []
        result["vname"] = []
        result["vdate"] = []
        for i in range(len(vid)):
            result["vid"  ].append ( str(vid  [i]) )
            result["vname"].append ( str(vname[i]) )
            result["vdate"].append ( str(vdate[i]) )
        result["status"] = "ok"
    return result

# ----------------------------------------------------------------------------

def getDatasets ( fdata,wdsl ):

    result = {}
    session = getSessionId ( fdata,wdsl )
    if len(session) != 2:
        result["status"] = session
    else:
        icat         = session[0]
        sessionId    = session[1]
        vid          = fdata["visit"]["id"]
        query_spec   = "FROM Dataset ds WHERE ds.investigation.visitId='" +\
                       vid + "' ORDER BY ds.id"
        datasetIDs   = []
        datasetNames = []

        try:
            writeLog ( " --- getting list of datasets\n" )
            datasetIDs   = icat.search ( sessionId,"SELECT ds.id   " + query_spec )
            writeLog ( "     success on list of ids.\n" )
            datasetNames = icat.search ( sessionId,"SELECT ds.name " + query_spec )
            writeLog ( "     success on list of names.\n" )
        except:
            writeLog ( "     failed.\n" )
            datasetIDs   = []
            datasetNames = []
            result["status"] = "failed to acquire the list of datasets"

        try:
            writeLog ( " --- getting datasets\n" )
            datasets = []
            for j in range(len(datasetIDs)):

                did = datasetIDs[j]

                dataset = {}
                dataset["id"]   = str(did)
                dataset["path"] = str(datasetNames[j])
                writeLog ( "     id=" + str(did) + "  name=" + str(datasetNames[j]) + "\n" )

                query_spec  = "FROM Datafile df WHERE df.dataset.id='" + str(did) + "'"
                query_spec += " AND df.name LIKE '%.mtz'"
                query_spec += " ORDER BY df.name"

                datafileIDs   = icat.search ( sessionId,"SELECT df.id         " + query_spec )
                writeLog ( "     file ids fetched\n" )
                datafileNames = icat.search ( sessionId,"SELECT df.name       " + query_spec )
                writeLog ( "     file names fetched.\n" )
                datafileSizes = icat.search ( sessionId,"SELECT df.fileSize   " + query_spec )
                writeLog ( "     file sizes fetched.\n" )
                datafileDates = icat.search ( sessionId,"SELECT df.createTime " + query_spec )
                writeLog ( "     create times fetched.\n" )
                # can select description

                files = []
                for k in range(len(datafileIDs)):
                    file = {}
                    file["id"]   = str(datafileIDs  [k])
                    file["name"] = str(datafileNames[k])
                    file["size"] = int(datafileSizes[k])
                    file["date"] = str(datafileDates[k])
                    files.append ( file )
                dataset["files"] = files

                if len(files)>0:
                    datasets.append ( dataset )

            result["datasets"] = datasets
            result["status"]   = "ok"

        except:
            writeLog ( "     failed.\n" )
            result["status"] = "failed to acquire a dataset"

    return result


# ----------------------------------------------------------------------------

def cacheCheckout ( f,cacheDir,outputPath ):
    cachePath = os.path.join ( cacheDir,f["dirpath"],os.path.basename(f["name"]) )
    if os.path.exists(cachePath):
        shutil.copyfile ( cachePath,outputPath )
        return True
    return False

def cacheCheckin ( f,cacheDir,outputPath ):
    cachePath = os.path.join ( cacheDir,f["dirpath"] )
    if not os.path.exists(cachePath):
        os.makedirs ( cachePath )
    shutil.copyfile ( outputPath,os.path.join(cachePath,os.path.basename(f["name"])) )
    return


def checkDataCache ( fdata,cacheDir ):
# returns True if all required data is in cache
    inCache  = True
    fileList = fdata["selFiles"]
    for f in fileList:
        cachePath = os.path.join ( cacheDir,f["dirpath"],os.path.basename(f["name"]) )
        if not os.path.exists(cachePath):
            inCache = False
            break
    return inCache



def copyDataFromCache ( fdata, outputDirectory, cacheDir ):

    result = {}

    fileList = fdata["selFiles"]
    result["flist"] = []

    for f in fileList:
        dirpath = os.path.join ( outputDirectory,f["dirpath"] )
        if not os.path.exists(dirpath):
            os.makedirs ( dirpath )
        fbase = os.path.basename(f["name"])
        fname = os.path.join ( dirpath,fbase )
        cacheCheckout ( f,cacheDir,fname )
        result["flist"].append ( os.path.join(f["dirpath"],fbase) )

    result["status"] = "ok"

    return result


def fetchDataFromICAT ( idsBaseURL,wdsl, fdata, outputDirectory, cacheDir ):
# Given the information in the dictionary, download datafiles and datasets using IDS:

    result = {}

    session = getSessionId ( fdata,wdsl )
    if len(session) != 2:
        result["status"] = session
    else:
        icat      = session[0]
        sessionId = session[1]

        prepareDataURL = idsBaseURL + "/prepareData"
        isPreparedURL  = idsBaseURL + "/isPrepared"
        getDataURL     = idsBaseURL + "/getData"

        fileList = fdata["selFiles"]
        result["flist"] = []

        try:

            for f in fileList:

                dirpath = os.path.join ( outputDirectory,f["dirpath"] )
                if not os.path.exists(dirpath):
                    os.makedirs ( dirpath )

                fbase = os.path.basename(f["name"])
                fname = os.path.join ( dirpath,fbase )
                writeLog ( " -- p2  fname=" + fname + "\n" )

                if not cacheCheckout(f,cacheDir,fname):

                    # Use the IDS REST API to download the data; first, tell IDS
                    # to prepare data for download:
                    data            = { "sessionId"   : str(sessionId),
                                        "datafileIds" : f["id"] }
                    prepareDataResp = requests.post(prepareDataURL, data = data)
                    preparedId      = str(prepareDataResp.text)

                    # Ping isPrepared every 30 seconds until data is ready:
                    isPrepared       = "false"
                    isPreparedParams = { "preparedId" : str(preparedId) }
                    while isPrepared=="false":
                        isPrepared = requests.get(isPreparedURL, params=isPreparedParams).text
                        writeLog ( " -- p04 " + isPrepared + "  \n" )
                        time.sleep(30)
                        if icat.getRemainingMinutes(sessionId) < 5:
                            icat.refresh ( sessionId )

                        # Download the data to local directory:
                        getDataParams = {"preparedId": preparedId}
                        getDataResp = requests.get ( getDataURL, params=getDataParams, stream=True )
                        with open(fname,'wb') as ff:
                            shutil.copyfileobj ( getDataResp.raw,ff )
                        cacheCheckin ( f,cacheDir,fname )

                result["flist"].append ( os.path.join(f["dirpath"],fbase) )

            result["status"] = "ok"

        except:
            result["status"] = "fail"

    return result


# ============================================================================

def main():

    jobDir     = sys.argv[1]  # job directory
    updateFile = sys.argv[2]
    resultFile = sys.argv[3]
    wdsl       = sys.argv[4]
    idsBaseURL = sys.argv[5]
    uploadDir  = sys.argv[6]  # upload subdirectory in jpob directory
    facilitiesDir = sys.argv[7]  # facilities cache directory

    # always make job directory current
    #os.chdir ( jobDir )

    initLog  ( jobDir )

    writeLog ( "nargs      = " + str(len(sys.argv)) + "\n" )
    writeLog ( "jobDir     = " + jobDir + "\n" )
    writeLog ( "updateFile = " + updateFile  + "\n" )
    writeLog ( "resultFile = " + resultFile  + "\n" )
    writeLog ( "wdsl       = " + wdsl + "\n" )
    writeLog ( "idsBaseURL = " + idsBaseURL + "\n" )
    writeLog ( "uploadDir  = " + uploadDir  + "\n" )
    writeLog ( "facilitiesDir  = " + facilitiesDir  + "\n" )

    file  = open ( updateFile,"r" )
    fdata = json.loads ( file.read() )
    file.close()

    fdata["pwd"] = sys.stdin.readline().strip()

    writeLog ( "item = " + fdata["item"]["_type"] + "\n" )

    cacheDir = os.path.join ( facilitiesDir,"cache" )

    result = {}
    if fdata["item"]["_type"] in ("Facility","FacilityUser"):
        result = getVisits ( fdata,wdsl )
    elif fdata["item"]["_type"]=="FacilityVisit":
        result = getDatasets ( fdata,wdsl )
    elif fdata["item"]["_type"]=="StorageFile":
        outDir = os.path.join ( jobDir,uploadDir )
        if not os.path.exists(outDir):
            os.makedirs ( outDir )
        if not fdata["pwd"]:
            if checkDataCache(fdata,cacheDir):
                result = copyDataFromCache ( fdata,outDir,cacheDir )
            else:
                result["status"] = "askPassword"
        else:
            result = fetchDataFromICAT ( idsBaseURL,wdsl,fdata,outDir,cacheDir )
    else:
        result["status"] = "Unknown Facility Item"

    file  = open ( resultFile,"w" )
    file.write ( json.dumps(result) )
    file.close()

    closeLog()

    return

if __name__ == '__main__':
    main()
