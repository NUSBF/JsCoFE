##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    28.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2021
#
# ============================================================================
#

#  python native imports
import os
import json
import requests

#  ccp4-python imports
#import pyrvapi

#  application imports
from pycofe.tasks  import asudef
from pycofe.dtypes import dtype_sequence
from pycofe.proc   import import_filetype, asucomp
from pycofe.proc   import import_xyz, import_sequence, import_merged


# ============================================================================
# import pdb files function


#https://files.rcsb.org/download/4GOS.pdb
#https://files.rcsb.org/download/4GOS.cif
#https://files.rcsb.org/download/4GOS-sf.cif
#https://www.rcsb.org/fasta/entry/4GOS

def get_pdb_file_url ( ucode ):
    return "https://files.rcsb.org/download/" + ucode + ".pdb"

def get_cif_file_url ( ucode ):
    return "https://files.rcsb.org/download/" + ucode + ".cif"

def get_hkl_file_url ( ucode ):
    return "https://files.rcsb.org/download/" + ucode + "-sf.cif"

def get_seq_file_url ( ucode ):
    return "https://www.rcsb.org/fasta/entry/" + ucode

def download_file ( url,fpath,body=None ):
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
                if body:
                    body.stdout ( line )
                l = line.strip()
                if len(l)>0:
                    if l.startswith("<!DOCTYPE"):
                        rc = -1
                        break;
                line = f.readline()
    except:
        if body:
            body.stdoutln ( " *** failed to get " + url )
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
        fname_seq = "rcsb_pdb_" + ucode + ".fasta"
        fname_seq = lcode + ".fasta"
        fname_sf  = lcode + "-sf.cif"
        fpath_xyz = os.path.join ( body.importDir(),fname_xyz )
        fpath_seq = os.path.join ( body.importDir(),fname_seq )
        rc_xyz    = -1
        rc_seq    = -1
        rc_sf     = -1
        if import_coordinates or import_sequences:
            # coordiinates are used for sequence annotation
            rc_xyz = download_file ( get_pdb_file_url(ucode),fpath_xyz )
            if rc_xyz:
                fname_xyz = lcode + ".cif"
                fpath_xyz = os.path.join ( body.importDir(),fname_xyz )
                rc_xyz = download_file ( get_cif_file_url(ucode),fpath_xyz )

        if import_sequences:
            # these will be the "expected" sequences
            rc_seq = download_file ( get_seq_file_url(ucode),fpath_seq,body=None )

        if import_reflections:
            rc_sf  = download_file ( "https://files.rcsb.org/download/" + ucode + "-sf.cif",
                                    os.path.join(body.importDir(),fname_sf) )

        body.resetFileImport()
        asuComp = None
        asu     = None
        nAA     = 0
        nNA     = 0

        if not rc_xyz:

            if import_coordinates:
                body.addFileImport ( fname_xyz,import_filetype.ftype_XYZ() )

            if import_sequences:

                # infer non-redundant sequence composition of ASU
                asuComp = asucomp.getASUComp1 ( fpath_xyz,fpath_seq,0.9999,body=None )

                #  prepare separate sequence files annotation json for sequence import

                annotation = {"rename":{}, "annotation":[] }

                seqdesc = asuComp["asucomp"]
                #body.stdoutln ( str(seqdesc) )
                for i in range(len(seqdesc)):
                    fname = lcode + "_" + seqdesc[i]["chain_id"] + ".fasta"
                    dtype_sequence.writeSeqFile ( os.path.join(body.importDir(),fname),
                                                  seqdesc[i]["name"],seqdesc[i]["seq"] )
                    body.addFileImport ( fname,import_filetype.ftype_Sequence() )
                    annot = { "file":fname, "rename":fname, "items":[
                      { "rename"   : fname,
                        "contents" : seqdesc[i]["name"] + "\n" + seqdesc[i]["seq"],
                        "type"     : seqdesc[i]["type"]
                      }
                    ]}
                    annotation["annotation"].append ( annot )
                    if seqdesc[i]["type"]=="protein":  nAA += 1
                    if seqdesc[i]["type"]=="dna"    :  nNA += 1

                seqlist = asuComp["seqlist"]  # sequences from PDB header
                #body.stdoutln ( str(seqdesc) )
                for i in range(len(seqlist)):
                    name  = str(i+1)
                    stype = "protein"  # ugly fallback
                    lst   = seqlist[i][0].split("|")
                    if len(lst)>1:
                        if lst[1].startswith("Chain"):
                            chains = lst[1].split(" ")[1].split(",")
                            name   = "_".join(chains)
                            for j in range(len(seqdesc)):
                                if chains[0]==seqdesc[j]["chain_id"]:
                                    stype = seqdesc[j]["type"]
                                    break
                    fname = lcode + "_expected_" + name + ".fasta"
                    dtype_sequence.writeSeqFile ( os.path.join(body.importDir(),fname),
                                                  seqlist[i][0],seqlist[i][1] )
                    body.addFileImport ( fname,import_filetype.ftype_Sequence() )
                    annot = { "file":fname, "rename":fname, "items":[
                      { "rename"   : fname,
                        "contents" : seqlist[i][0] + "\n" + seqlist[i][1],
                        "type"     : stype
                      }
                    ]}
                    annotation["annotation"].append ( annot )
                    # if seqdesc[i]["type"]=="protein":  nAA += 1
                    # if seqdesc[i]["type"]=="dna"    :  nNA += 1

                #body.stdoutln ( str(annotation) )
                f = open ( "annotation.json","w" )
                f.write ( json.dumps(annotation) )
                f.close ()
                #body.file_stdout.write ( str(asuComp) + "\n" )

        if not rc_sf:
            body.addFileImport ( fname_sf,import_filetype.ftype_CIFMerged() )

        if len(body.files_all)>0:

            subSecId = body.getWidgetId ( "_pdb_sec_"+code )
            body.putSection ( subSecId,"PDB Entry " + ucode,False )
            body.setReportWidget ( subSecId )  # retain section id for signalling to gauge widget here

            xyz = import_xyz     .run ( body )
            seq = import_sequence.run ( body )
            hkl = import_merged  .run ( body,importPhases="" )

            if len(hkl)>0 and import_revisions:  # compose structure and revision

                revision = [None]  # for formal logic below
                seqdesc  = asuComp["asucomp"]
                seqlist  = asuComp["seqlist"]  # sequences from PDB header
                if len(seqdesc)>0 and len(seq)==len(seqdesc)+len(seqlist): # import ok

                    body.putMessage ( "<h3>" + ucode + " Unit Cell</h3>" )

                    seq_coor = []
                    for i in range(len(seqdesc)):
                        seq[i].ncopies      = seqdesc[i]["n"]
                        seq[i].ncopies_auto = False  # do not adjust
                        seq_coor.append ( seq[i] )
                    composition = "D"  # AA-NA comples
                    if nAA<=0:  composition = "D"  # NA only
                    if nNA<=0:  composition = "P"  # AA only
                    revision = asudef.makeRevision ( body,hkl[0],seq_coor,
                                                     composition,"MW",0,0.0,None,
                                                     None,None,secId=subSecId )

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

        else:
            body.stdoutln ( " ***** PDB entry " + code + " does not exist" )
            body.putSummaryLine_red ( code,"PDB Code","Wrong code, ignored" )

        body.generic_parser_summary = {}  # depress showing R-factors from refmac

    return
