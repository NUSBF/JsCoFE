##!/usr/bin/python

#
# ============================================================================
#
#    15.10.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MOLGRAPH IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2024
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from dtypes import dtype_molgraph
from proc   import import_filetype


# ============================================================================
# MolGraph library import function

def run ( body,sectionTitle="Molecular Graph" ):  # body is reference to the main Import class

    molgraph_imported = []

    files_molgraph = []
    for f in body.files_all:
        if body.checkFileImport ( f,import_filetype.ftype_MolGraph() ):
            files_molgraph.append ( f )

    if len(files_molgraph) <= 0:
        return  molgraph_imported

    files_molgraph.sort()

    for f in files_molgraph:
        body.files_all.remove ( f )
    files_molgraph = body.despaceFileNames ( files_molgraph,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF MOLGRAPHS\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    molgraphSecId = body.getWidgetId ( "molgraph_sec_" )

    pyrvapi.rvapi_add_section ( molgraphSecId,sectionTitle,
                                body.report_page_id(),body.rvrow,0,1,1,False )
    k = 0
    for f in files_molgraph:

        subSecId = molgraphSecId
        if len(files_molgraph)>1:
            subSecId = molgraphSecId + str(k)
            pyrvapi.rvapi_add_section ( subSecId,"Import "+f,molgraphSecId,
                                        k,0,1,1,False )

        fpath  = os.path.join ( body.importDir(),f )
        molgraph = dtype_molgraph.DType ( body.job_id )
        molgraph.setMolGraphFile ( f )
        body.dataSerialNo += 1
        molgraph.makeDName  ( body.dataSerialNo )
        shutil.copy ( fpath,body.outputDir() )

        body.outputDataBox.add_data ( molgraph )
        molgraph_imported.append ( molgraph )

        molgraphTableId = body.getWidgetId ( "molgraph_"+str(k)+"_table" )
        body.putTable     ( molgraphTableId,"",subSecId,0,mode=0 )
        body.putTableLine ( molgraphTableId,"File name","Imported file name",f,0 )
        body.putTableLine ( molgraphTableId,"Assigned name",
                                          "Assigned data name",molgraph.dname,1 )

        body.putSummaryLine ( body.get_cloud_import_path(f),"MOLGRAPH",molgraph.dname )

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
        # panelId = body.getWidgetId ( "molgraph_panel" )
        # body.putPanel1 ( subSecId,panelId,2 )
        # body.appendContent ( panelId,f,watch=False )

        body.file_stdout.write ( "\n... processed: " + f + "\n    " )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return  molgraph_imported
