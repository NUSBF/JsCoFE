##!/usr/bin/python

#
# ============================================================================
#
#    08.06.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  **** Module  :  pycofe/proc/import_seqcp.py
#      ~~~~~~~~~
#  **** Project :  jsCoFE - javascript-based Cloud Front End
#      ~~~~~~~~~
#  **** Content :  SEQUENCE COPY-PASTE IMPORT FUNCTION
#      ~~~~~~~~~
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
import json

#  application imports
from pycofe.proc   import import_sequence, import_filetype

# ============================================================================
# import sequnce copy-paste function

def run ( body,seqType,fnTemplate,seqData ):  # body is reference to the main Import class

    if not os.path.exists(body.importDir()):
        os.makedirs ( body.importDir() )

    body.resetFileImport()
    annotation = {"rename":{}, "annotation":[] }

    seq_lst = seqData.strip().split(">")
    for i in range(1,len(seq_lst)):

        fname = fnTemplate + "_" + str(i).zfill(2) + ".seq"
        fpath = os.path.join ( body.importDir(),fname )
        with open(fpath,"w") as file:
            file.write ( ">" + seq_lst[i] )

        #  prepare separate sequence files annotation json for sequence import
        body.addFileImport ( fname,import_filetype.ftype_Sequence() )
        annot = { "file":fname, "rename":fname, "items":[
          { "rename"   : fname,
            "contents" : ">" + seq_lst[i],
            "type"     : seqType
          }
        ]}
        annotation["annotation"].append ( annot )

    with open("annotation.json","w") as file:
        file.write ( json.dumps(annotation) )

    seq = []
    if len(body.files_all)>0:
        seq = import_sequence.run ( body,openSection=True )

    body.generic_parser_summary = {}  # depress showing R-factors from refmac

    return len(seq)
