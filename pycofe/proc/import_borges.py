##!/usr/bin/python

#
# ============================================================================
#
#    04.10.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ALIGNMENT DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from dtypes import dtype_borges
from proc   import import_filetype
from varut  import jsonut


# ============================================================================
# Alignment import function

def run ( body,sectionTitle="Borges library" ):  # body is reference to the main Import class

    borges_imported = []

    files_borges = []
    for f in body.files_all:
        if body.checkFileImport ( f,import_filetype.ftype_Borges() ):
            files_borges.append ( f )

    if len(files_borges) <= 0:
        return  borges_imported

    files_borges.sort()

    for f in files_borges:
        body.files_all.remove ( f )
    files_borges = body.despaceFileNames ( files_borges,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF BORGES LIBRARIES\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    borgesSecId = body.getWidgetId ( "borges_sec_" )

    pyrvapi.rvapi_add_section ( borgesSecId,sectionTitle,
                                body.report_page_id(),body.rvrow,0,1,1,False )
    k = 0
    for f in files_borges:

        subSecId = borgesSecId
        if len(files_borges)>1:
            subSecId = borgesSecId + str(k)
            pyrvapi.rvapi_add_section ( subSecId,"Import "+f,borgesSecId,
                                        k,0,1,1,False )

        fpath  = os.path.join ( body.importDir(),f )
        borges = dtype_borges.DType ( body.job_id )
        borges.setBorgesFile ( f )
        body.dataSerialNo += 1
        borges.makeDName  ( body.dataSerialNo )
        shutil.copy ( fpath,body.outputDir() )

        body.outputDataBox.add_data ( borges )
        borges_imported.append ( borges )

        borgesTableId = body.getWidgetId ( "borges_"+str(k)+"_table" )
        body.putTable     ( borgesTableId,"",subSecId,0,mode=0 )
        body.putTableLine ( borgesTableId,"File name","Imported file name",f,0 )
        body.putTableLine ( borgesTableId,"Assigned name",
                                          "Assigned data name",borges.dname,1 )

        body.putSummaryLine ( body.get_cloud_import_path(f),"BORGES_LIBRARY",borges.dname )

        # body.putMessage1 ( subSecId,"&nbsp;<p><h3>Alignment file content</h3>",1 )
        #
        # with (open(fpath,"r")) as f1:
        #     content = f1.read().strip()
        #     with (open(os.path.join(body.reportDir(),f),"w")) as f2:
        #         f2.write ( "<pre style=\"border:1px solid #488090; padding:12px; " +\
        #                             "height: 400px; width: 1000px; overflow: auto; " +\
        #                             "font-family : 'Courier'; font-size: 1em; " +\
        #                             "box-shadow : 5px 5px 6px #888888;\">" + content +\
        #                    "</pre>" )
        #
        # panelId = body.getWidgetId ( "borges_panel" )
        # body.putPanel1 ( subSecId,panelId,2 )
        # body.appendContent ( panelId,f,watch=False )

        body.file_stdout.write ( "\n... processed: " + f + "\n    " )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return  borges_imported
