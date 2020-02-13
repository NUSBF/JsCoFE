##!/usr/bin/python

#
# ============================================================================
#
#    25.08.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2019
#
# ============================================================================
#

#  python native imports
import os
#import sys
import json
import requests

#  ccp4-python imports
#import pyrvapi

#  application imports
from pycofe.tasks  import asudef
from pycofe.dtypes import dtype_sequence
from pycofe.proc   import import_filetype, asucomp
from pycofe.proc   import import_xyz, import_sequence, import_merged



#from   pycofe.varut  import command
#from   pycofe.proc   import import_filetype, xyzmeta, coor


# ============================================================================
# import pdb files function

def download_file ( url,fpath ):
    rc = 0  # return code
    try:
        r = requests.get ( url,stream=True )
        with open(fpath,'wb') as f:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk: # filter out keep-alive new chunks
                    f.write ( chunk )
        with open(fpath,'r') as f:
            line = f.readline()
            while line:
                l = line.strip()
                if len(l)>0:
                    if l.startswith("<!DOCTYPE"):
                        rc = -1
                    break;
                line = f.readline()
    except:
      rc = -2
    return rc


def run ( body,pdb_list,
               import_coordinates = True,
               import_sequences   = True,
               import_reflections = True,
               import_revisions   = True
        ):  # body is reference to the main Import class


    if not os.path.exists(body.importDir()):
        os.makedirs ( body.importDir() )

    revisionNo = 1

    for code in pdb_list:

        lcode     = code.lower()
        ucode     = code.upper()
        fname_xyz = lcode + ".pdb"
        fname_seq = lcode + ".fasta"
        fname_sf  = lcode + "-sf.cif"
        fpath_xyz = os.path.join ( body.importDir(),fname_xyz )
        fpath_seq = os.path.join ( body.importDir(),fname_seq )
        rc_xyz    = -1
        rc_seq    = -1
        rc_sf     = -1
        if import_coordinates:
            rc_xyz = download_file ( "https://files.rcsb.org/download/" + ucode + ".pdb",
                                     fpath_xyz )
        if import_sequences:
            rc_seq = download_file ( "https://www.rcsb.org/pdb/download/downloadFastaFiles.do?structureIdList=" +
                                    ucode + "&compressionType=uncompressed",
                                    fpath_seq )
        if import_reflections:
            rc_sf  = download_file ( "https://files.rcsb.org/download/" + ucode + "-sf.cif",
                                    os.path.join(body.importDir(),fname_sf) )

        body.resetFileImport()
        asuComp = None
        asu     = None
        nAA     = 0
        nNA     = 0

        if not rc_xyz:

            body.addFileImport ( "",fname_xyz,import_filetype.ftype_XYZ() )

            if not rc_seq and import_sequences:

                # infer non-redundant sequence composition of ASU
                asuComp = asucomp.getASUComp1 ( fpath_xyz,fpath_seq,0.9999 )

                #  prepare separate sequence files annotation json for sequence import
                annotation = {"rename":{}, "annotation":[] }
                seqdesc = asuComp["asucomp"]
                for i in range(len(seqdesc)):
                    fname = lcode + "_" + seqdesc[i]["chain_id"] + ".fasta"
                    dtype_sequence.writeSeqFile ( os.path.join(body.importDir(),fname),
                                                  seqdesc[i]["name"],seqdesc[i]["seq"] )
                    body.addFileImport ( "",fname,import_filetype.ftype_Sequence() )
                    annot = { "file":fname, "rename":fname, "items":[
                      { "rename"   : fname,
                        "contents" : seqdesc[i]["name"] + "\n" + seqdesc[i]["seq"],
                        "type"     : seqdesc[i]["type"]
                      }
                    ]}
                    annotation["annotation"].append ( annot )
                    if seqdesc[i]["type"]=="protein":  nAA += 1
                    if seqdesc[i]["type"]=="dna"    :  nNA += 1

                f = open ( "annotation.json","w" )
                f.write ( json.dumps(annotation) )
                f.close ()
                #body.file_stdout.write ( str(asuComp) + "\n" )

        if not rc_sf:
            body.addFileImport ( "",fname_sf,import_filetype.ftype_CIFMerged() )

        if len(body.files_all)>0:

            subSecId = body.getWidgetId ( "_pdb_sec_"+code )
            body.putSection ( subSecId,"PDB Entry " + ucode,False )
            body.setReportWidget ( subSecId )

            xyz = import_xyz     .run ( body )
            seq = import_sequence.run ( body )
            hkl = import_merged  .run ( body,importPhases=False )

            if len(hkl)>0 and import_revisions:  # compose structure and revision

                seqdesc = asuComp["asucomp"]
                if len(seq)>0 and len(seq)==len(seqdesc):

                    body.putMessage ( "<h3>" + ucode + " Unit Cell</h3>" )

                    for i in range(len(seq)):
                        seq[i].ncopies      = seqdesc[i]["n"]
                        seq[i].ncopies_auto = False  # do not adjust
                    composition = "D"  # AA-NA comples
                    if nAA<=0:  composition = "D"  # NA only
                    if nNA<=0:  composition = "P"  # AA only
                    revision = asudef.makeRevision ( body,hkl[0],seq,
                                        composition,"MW",0,0.0,None,
                                        None,None )

                if len(xyz)>0:
                    body.putMessage ( "<h3>" + ucode + " Structure</h3>" )
                    structure = body.finaliseStructure (
                                    xyz[0].getXYZFilePath(body.outputDir()),
                                    lcode,hkl[0],None,[],0, # "0" means "XYZ"
                                    leadKey=1,openState_bool=False,
                                    title=None,inpDir=body.outputDir() )

                if revision[0]:
                    body.putMessage ( "<h3>" + ucode + " Revision</h3>" )
                    if structure:
                        revision[0].setStructureData ( structure )
                    body.outputFName = lcode
                    body.registerRevision ( revision[0],revisionNo,None,
                        "<b><i>" + ucode + " structure revision name:</i></b>","" )
                    revisionNo += 1
                    body.outputFName = "*"


            body.resetReportPage()

        body.generic_parser_summary = {}  # depress showing R-factors from refmac

    return
