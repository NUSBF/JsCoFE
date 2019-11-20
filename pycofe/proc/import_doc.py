##!/usr/bin/python

#
# ============================================================================
#
#    30.04.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SEQUENCE DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from proc   import import_filetype
#from varut  import jsonut


# ============================================================================
# Sequence import function

def run ( body,sectionTitle="" ):  # body is reference to the main Import class,
                                   # sectionTitle is not used

    doctypes = [
        import_filetype.ftype_HTML(),
        import_filetype.ftype_PDF (),
        import_filetype.ftype_TEXT()
    ]

    imgtypes = [
        import_filetype.ftype_JPG (),
        import_filetype.ftype_JPEG(),
        import_filetype.ftype_PNG (),
        import_filetype.ftype_GIF ()
    ]

    body.nImportedDocs = 0

    processed = []
    for f in sorted(body.files_all):
        isDoc = body.checkFileImportL ( f,doctypes )
        isImg = False
        if not isDoc:
            isImg = body.checkFileImportL ( f,imgtypes )
        if isDoc or isImg:
            processed.append ( f )
            fout = os.path.join ( body.outputDir(),f )
            os.rename ( os.path.join(body.importDir(),f),fout )
            if isDoc:
                body.nImportedDocs += 1
                fname,fext = os.path.splitext(f)
                tabId = body.getWidgetId ( "doc_tab" )
                body.insertTab ( tabId,fname,None,focus=False )
                body.putMessage1 ( tabId,"<iframe src=\"../" + fout + "\" " +\
                    "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:92%;\"></iframe>",
                    0 )

                popId = body.getWidgetId ( "popId" )
                pyrvapi.rvapi_append_panel ( popId,tabId )
                pyrvapi.rvapi_append_text  ( "<div class=\"cap-div\">" +\
                    "<b><i>Open in <a href=\"../" + fout + "\" " +\
                    "onclick=\"window.open('../" + fout + "','newwindow','width=auto,height=auto,location=no,menubar=no,status=no,toolbar=no'); return false;\">" +\
                    #"target=\"_blank\">" +\
                    "new window</a></span></i></b></div>",
                    popId )

                #  $( '<div class="cap-div"><b><i>File is too large and shown ' +
                #     'without middle part.</i></b><br>Click <a href="' +
                #     uri.substring(0,uri.indexOf('?capsize')) +
                #     '"><i>here</i></a> to download full version to your device.</div>' )
                #    .appendTo ( $(div) );



    for f in processed:
        body.files_all.remove ( f )

    return  []
