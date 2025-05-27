##!/usr/bin/python

#
# ============================================================================
#
#    23.05.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2018-2025
#
# ============================================================================
#

#  python native imports
import os
import json
import requests

#  ccp4-python imports
#import pyrvapi
import gemmi

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

def get_afdb_file_url ( ucode ):
    return "https://alphafold.ebi.ac.uk/files/AF-" + ucode + "-F1-model_v3.pdb"


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
                    body.stdout ( " >>>> downloaded: " + line )
                l = line.strip()
                if len(l)>0:
                    if l.startswith("<!DOCTYPE") or "<Error>" in l or\
                       "No fasta files were found." in l:
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

    imported_codes = []
    rejected_codes = []

    code_list = list ( dict.fromkeys(pdb_list) )  # eliminate duplicates

    for code in code_list:

        rc_xyz    = -1
        rc_seq    = -1
        rc_sf     = -1

        lcode     = code.lower()
        ucode     = code.upper()
        fname_xyz = lcode + ".pdb"
        fpath_xyz = os.path.join ( body.importDir(),fname_xyz )

        if len(code)==4:
            fname_seq = "rcsb_pdb_" + ucode + ".fasta"
            fname_seq = lcode + ".fasta"
            fname_sf  = lcode + "-sf.cif"
            fpath_seq = os.path.join ( body.importDir(),fname_seq )
            if import_coordinates or import_sequences:
                # coordiinates are used for sequence annotation, so must be obtained
                rc_xyz = download_file ( get_pdb_file_url(ucode),fpath_xyz )
                if rc_xyz:
                    fname_xyz = lcode + ".cif"
                    fpath_xyz = os.path.join ( body.importDir(),fname_xyz )
                    rc_xyz    = download_file ( get_cif_file_url(ucode),fpath_xyz )
                if rc_xyz:
                    body.stdoutln ( " ***** PDB entry " + code + " coordinate file not obtained" )
                    body.putSummaryLine_red ( fname_xyz,"XYZ","not obtained" )

            if import_sequences:
                # these will be the "expected" sequences
                rc_seq = download_file ( get_seq_file_url(ucode),fpath_seq,body=None )
                # body.stdoutln ( " .... rc_seq=" + str(rc_seq) )
                if rc_seq:
                    body.stdoutln ( " ***** PDB entry " + code + " sequence file not obtained" )
                    body.putSummaryLine_red ( fname_seq,"SEQ","expected sequence(s) not obtained" )
                    if not rc_xyz:
                        # fetch sequences from coordinates
                        st = gemmi.read_structure ( fpath_xyz )
                        st.setup_entities()
                        model   = st[0]  # use first model
                        content = ""     # contrent of sequence file
                        for chain in model:
                            polymer = chain.get_polymer()
                            t       = polymer.check_polymer_type()
                            stype   = None
                            if t in (gemmi.PolymerType.PeptideL, gemmi.PolymerType.PeptideD):
                                stype = "protein"
                            elif t==gemmi.PolymerType.Dna:
                                stype = "dna"
                            elif t==gemmi.PolymerType.Rna:
                                stype = "rna"
                            elif t==gemmi.PolymerType.DnaRnaHybrid:
                                stype = "na"
                            # disqualify too short protein and na chains
                            if ((stype=="protein") and (len(polymer)<=20)) or (len(polymer)<=6):
                                stype = None
                            if stype:
                                seqline = str(polymer.make_one_letter_sequence())
                                content += ">chain_" + chain.name + "\n" + seqline + "\n\n"
                        if content:
                            with open(fpath_seq,"w") as f:
                                f.write ( content )
                            rc_seq = 1

            if import_reflections:
                rc_sf = download_file ( get_hkl_file_url(ucode),
                                        os.path.join(body.importDir(),fname_sf) )
                if rc_sf:
                    body.stdoutln ( " ***** PDB entry " + code + " reflection file not obtained" )
                    body.putSummaryLine_red ( fname_sf,"HKL","not obtained" )

        elif (len(code)>4) and (import_coordinates or import_sequences):
            # coordiinates are used for sequence annotation
            rc_xyz    = download_file ( get_afdb_file_url(ucode),fpath_xyz )
            if import_sequences:
                fname_seq = "afdb_" + ucode + ".fasta"
                fpath_seq = os.path.join ( body.importDir(),fname_seq )
                # note: assume that alphafold models contain single chains
                st = gemmi.read_structure ( fpath_xyz )
                st.setup_entities()
                for model in st:
                    for chain in model:
                        polymer = chain.get_polymer()
                        seqline = str(polymer.make_one_letter_sequence())
                        dtype_sequence.writeSeqFile ( fpath_seq,ucode,seqline )
                        rc_seq = 0
                        body.putNote ( "sequence(s) restored from atomic coordinates" )

        body.resetFileImport()
        asuComp = None
        asu     = None
        nAA     = 0
        nNA     = 0

        if not rc_xyz:

            imported_codes.append ( lcode )

            if import_coordinates:
                body.addFileImport ( fname_xyz,import_filetype.ftype_XYZ() )

            if import_sequences and (rc_seq>=0):

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

                if (len(code)==4) and not rc_seq:
                    seqlist = asuComp["seqlist"]  # sequences from PDB header
                    #body.stdoutln ( str(seqdesc) )
                    for i in range(len(seqlist)):
                        name  = str(i+1)
                        # stype = "protein"  # ugly fallback
                        stype = dtype_sequence.identify_sequence_type ( seqlist[i][1] )
                        lst   = seqlist[i][0].split("|")
                        if len(lst)>1:
                            if lst[1].startswith("Chain"):
                                chains = lst[1].split(" ")[1].split(",")
                                for j in range(len(chains)):
                                    chains[j] = chains[j].split("[")[0]
                                name   = "_".join(chains)
                                # for j in range(len(seqdesc)):
                                #     if chains[0]==seqdesc[j]["chain_id"]:
                                #         stype = seqdesc[j]["type"]
                                #         break
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

        else:
            rejected_codes.append ( code )

        if not rc_sf:
            body.addFileImport ( fname_sf,import_filetype.ftype_CIFMerged() )

        if len(body.files_all)>0:

            subSecId = body.getWidgetId ( "_pdb_sec_"+code )
            body.putSection ( subSecId,"PDB Entry " + ucode,False )
            body.setReportWidget ( subSecId )  # retain section id for signalling to gauge widget here

            xyz = import_xyz     .run ( body )
            seq = import_sequence.run ( body )
            hkl = import_merged  .run ( body,importPhases="" )

            if len(hkl)>0 and len(seq)>0 and import_revisions:  # compose structure and revision

                revision = [None]  # for formal logic below
                seqdesc  = asuComp["asucomp"]
                seqlist  = asuComp["seqlist"]  # sequences from PDB header
                body.stdoutln ( " *** rc_seq=" + str(rc_seq) )
                body.stdoutln ( " *** len(seq)=" + str(len(seq)) )
                body.stdoutln ( " *** len(seqdesc)=" + str(len(seqdesc)) )
                body.stdoutln ( " *** len(seqlist)=" + str(len(seqlist)) )
                # if len(seqdesc)>0 and len(seq)==len(seqdesc)+len(seqlist): # import ok
                if (rc_seq==0 and len(seq)==len(seqdesc)+len(seqlist)) or \
                   (rc_seq==1 and len(seq)==len(seqdesc) and len(seq)==len(seqlist)): # import ok

                    body.putMessage ( "&nbsp;<br><h3>" + ucode + " Unit Cell</h3>" )

                    if rc_seq:
                        body.putNote("sequence(s) restored from atomic coordinates")

                    seq_coor = []
                    for i in range(len(seqdesc)):
                        seq[i].ncopies      = seqdesc[i]["n"]
                        seq[i].ncopies_auto = False  # do not adjust
                        seq_coor.append ( seq[i] )
                    composition = "D"  # AA-NA comples
                    if nAA<=0:  composition = "D"  # NA only
                    if nNA<=0:  composition = "P"  # AA only
                    revision = asudef.makeRevision ( body,hkl[0],seq_coor,None,
                                                     composition,"MW",0,0.0,None,
                                                     None,None,secId=subSecId )

                if len(xyz)>0:
                    body.putMessage ( "<h3>" + ucode + " Structure</h3>" )
                    structure = body.finaliseStructure (
                                    xyz[0].getPDBFilePath(body.outputDir()),
                                    lcode,hkl[0],None,[],0, # "0" means "XYZ"
                                    leadKey=1, # openState="closed",
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

            elif import_revisions:
                if len(hkl)<=0 and len(seq)<=0:
                    body.putMessage ( "<h3>No structure revision was formed because " +\
                                      "neither reflection nor sequence data are available</h3>" )
                elif len(hkl)<=0:
                    body.putMessage ( "<h3>No structure revision was formed because " +\
                                      "reflection data are not available</h3>" )
                elif len(seq)<=0:
                    body.putMessage ( "<h3>No structure revision was formed because " +\
                                      "sequence data are not available</h3>" )

            body.resetReportPage()

        elif len(code)==4:
            body.stdoutln ( " ***** PDB entry " + code + " does not exist" )
            body.putSummaryLine_red ( code,"PDB Code","Wrong code, ignored" )

        elif len(code)>4:
            body.stdoutln ( " ***** UniProt entry " + code + " does not exist" )
            body.putSummaryLine_red ( code,"UniProt Code","Wrong code, ignored" )

        else:
            body.stdoutln ( " ***** Invalid " + code )
            body.putSummaryLine_red ( code,"Invalid code","Wrong code, ignored" )

        body.generic_parser_summary = {}  # depress showing R-factors from refmac

        os.rename   ( body.importDir(),"download_" + ucode )
        os.makedirs ( body.importDir() )



    return [imported_codes,rejected_codes]
