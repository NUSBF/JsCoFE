##!/usr/bin/python

#
# ============================================================================
#
#    29.06.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  WSCRTIPT (WORKFLOW SCRIPT) IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2023-2024
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from   pycofe.proc   import import_filetype


# ============================================================================
# import workflow script files function


def run ( body ):  # body is reference to the main Import class

    files_wscript = []
    for f in body.files_all:
        #if f.lower().endswith(('.pdb', '.cif', '.mmcif', '.ent')):
        if body.checkFileImport ( f,import_filetype.ftype_WScript() ):
            files_wscript.append ( f )

    if len(files_wscript) <= 0:
        return

    for f in files_wscript:
        body.files_all.remove ( f )

    files_wscript = body.despaceFileNames ( files_wscript,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF WORKFLOW SCRIPT\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    if len(files_wscript)>1:
        body.putMessage ( "<h3>Too many scripts</h3>" +\
            "Total " + str(len(files_wscript)) + " workflow scripts have been " +\
            "uploaded, while only one can be executed.<p>Please clone import task " +\
            "and upload a single workflow script file (.wscript)." )
        body.file_stdout.write ( "TOO MANY SCRIPTS\n\n" +\
            "Total " + str(len(files_wscript)) + " workflow scripts have been " +\
            "uploaded,\nwhile only one can be executed.\n\nPlease clone import task " +\
            "and upload a single\nworkflow script file (.wscript)." )
        for i in range(len(files_wscript)):
            body.putSummaryLine_red ( body.get_cloud_import_path(files_wscript[i]),
                                      "WSCRIPT",
                                      "IGNORED: more than a single workflow script" )
        return

    repfname = body.get_cloud_import_path ( files_wscript[0] )
    script   = None
    with open(os.path.join(body.importDir(),files_wscript[0]),"r") as f:
        script = f.read().splitlines()
    if not script or len(script)<=0:
        body.putMessage ( "<h3>Empty workflow script</h3>" +\
            "Workflow script file " + files_wscript[0] + " is empty.<p>" +\
            "Workflow will not be run." )
        body.file_stdout.write ( "EMPTY WORKFLOW SCRIPT\n\n" +\
            "Workflow script file " + files_wscript[0] + " is empty.\n" +\
            "Workflow will not be run." )
        body.putSummaryLine_red ( repfname,"WSCRIPT",
                                  "UNUSABLE: empty workflow script file" )
        return

    wscriptSecId = body.getWidgetId ( "_xyz_sec_" )
    pyrvapi.rvapi_add_section ( wscriptSecId,"Workflow script",body.report_page_id(),
                                body.rvrow,0,1,1,False )
    workflowId  = "imported"
    parseCode   = 0

    for i in range(len(script)):
        words = script[i].strip().split("#")[0].strip().split()
        if len(words)>0:
            w0 = words[0].upper()
            if len(words)>1 and w0=="WID":
                 workflowId = words[1]
            if w0.startswith("PAR_"):
                parseCode = 1

    body.putMessage1 ( wscriptSecId,"<h3>Workflow [" + workflowId + "]</h3>",0 )
    row = 1
    if parseCode==0:
        body.task.autoRunId = workflowId
        body.task.script    = script
    else:
        body.putMessage1 ( wscriptSecId,
            "Workflow contains paramaters, which is not allowed in the \"import\" mode.<br>" +\
            "<span style=\"color:maroon\">Workflow will not be run.</span>",row )
        body.file_stdout.write ( "WORKFLOW PARAMETERS FOUND\n\n" +\
            "Workflow contains paramaters, which is not allowed in the \"import\" mode.\n" +\
            "Workflow will not be run." )
        body.putSummaryLine_red ( repfname,"WSCRIPT","ERROR: workflow contains parameters" )
        row = 2

    body.putMessage1 ( wscriptSecId,
                        "<pre style=\"border:1px solid #488090; padding:12px; " +\
                            "height: 400px; width: 660px; overflow: auto; " +\
                            "font-family : 'Courier'; font-size: 1em; " +\
                            "box-shadow : 5px 5px 6px #888888;\">" +\
                            "\n".join(script) +\
                        "</pre>",row+1 )

    body.putSummaryLine ( repfname,"WSCRIPT","Workflow <b>[" + workflowId + "]</b>" )

    body.file_stdout.write ( "... processed: " + body.get_cloud_import_path(files_wscript[0]) +\
                             "\n" )

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return
