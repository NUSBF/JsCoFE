##!/usr/bin/python

#
# ============================================================================
#
#    04.10.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  X-RAY IMAGES DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from dtypes import dtype_xrayimages


# ============================================================================
# X-Ray Images import function

def run ( body ):  # body is reference to the main Import class

    files_xray = []
    for f in body.files_all:
        fl = f.lower();
        if fl.endswith('.xray.link'):
            files_xray.append ( f )

    if len(files_xray) <= 0:
        return

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT X-RAY DIFFRACTION IMAGES\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    k = 0
    for f in files_xray:

        body.files_all.remove ( f )

        fpath   = os.path.join ( body.importDir(),f )
        file    = open ( fpath,'r' )
        dirpath = file.read()
        file.close()

        fname = os.path.basename ( dirpath )

        if os.path.isdir(dirpath):

            if k == 0:
                xraySecId = "xray_sec_" + str(body.widget_no)
                body.widget_no += 1
                pyrvapi.rvapi_add_section ( xraySecId,"X-Ray Diffraction Images",
                                            body.report_page_id(),body.rvrow,
                                            0,1,1,False )

            subSecId = xraySecId
            if len(files_xray)>1:
                subSecId = xraySecId + str(k)
                pyrvapi.rvapi_add_section ( subSecId,"Import "+fname,
                                            xraySecId,k,0,1,1,False )

            xray = dtype_xrayimages.DType ( body.job_id )
            xray.setFile   ( f,"img" )  # store link
            body.dataSerialNo += 1
            xray.makeDName ( body.dataSerialNo )
            body.outputDataBox.add_data ( xray )

            xrayTableId = "xray_" + str(k) + "_table"
            body.putTable ( xrayTableId,"",subSecId,0 )
            jrow = 0;
            if len(files_xray)<=1:
                body.putTableLine ( xrayTableId,"File name","Imported file name",fname,jrow )
                jrow += 1

            body.putTableLine ( xrayTableId,"Assigned name","Assigned data name",xray.dname,jrow )
            body.putTableLine ( xrayTableId,"Contents","File contents","---",jrow+1 )

            os.rename ( fpath,os.path.join(body.outputDir(),f) )

            body.putSummaryLine ( body.get_cloud_import_path(fname),"X-Ray Images",xray.dname )
            k += 1

        else:
            body.putSummaryLine_red ( body.get_cloud_import_path(fname),"X-Ray Images",
                                      "Directory not found -- ignored" )

        body.file_stdout.write ( "... processed: " + body.get_cloud_import_path(fname) + "\n" )

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return
