##!/usr/bin/python

#
# ============================================================================
#
#    10.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  mmCIF Utility Functions
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Paul Bond 2024-2025
#
# ============================================================================
#

import os
import gemmi

# ============================================================================


def can_make_pdb ( st ):
#  Returns True if structure in st can be expressed in PDB format
    for model in st:
        if len(model)>62:
            return False
        for chain in model:
            if len(chain.name)>1 or len(chain)>9999:
                return False
            for res in chain:
                if len(res.name)>3:
                    return False
    return True


def can_convert_to_pdb ( mmcif_file_path ):
#  Returns True if mmCIF file is convertable to PDB
    if os.path.isfile ( mmcif_file_path ):
        return can_make_pdb ( gemmi.read_structure(mmcif_file_path) )
    return False


def convert_to_pdb ( mmcif_file_path,gemmi_st=None ):
#  Returns path to the produced PDB file (obtained from given path by replacing
#  the file extension) if mmCIF file is convertable, and returns None if
#  conversion is not possible
    pdb_file_path = None
    pdb_nogood    = None
    st            = gemmi_st
    if not st:
        if os.path.isfile(mmcif_file_path):
            st = gemmi.read_structure ( mmcif_file_path )
    if st:
        for model in st:
            if len(model)>62:
                pdb_nogood = "more than 62 models found"
                break
            for chain in model:
                if len(chain.name)>1:
                    pdb_nogood = "multiple character chain IDs found"
                elif len(chain)>9999:
                    pdb_nogood = "chain length over 9999 residues found"
                else:
                    for res in chain:
                        if len(res.name)>3:
                            pdb_nogood = "Residues with long names found"
                            break
                if pdb_nogood:
                    break
            if pdb_nogood:
                break
        if pdb_nogood:
            return (None,pdb_nogood)
        else:
            pdb_file_path = os.path.splitext(mmcif_file_path)[0] + ".pdb"
            pwo = gemmi.PdbWriteOptions()
            pwo.link_records = True
            pwo.use_linkr = True
            st.write_pdb ( pdb_file_path,pwo )
    return (pdb_file_path,"")


def convert_to_mmcif ( pdb_file_path ):
#  Returns path to the produced mmCIF file, which is obtained from given path
#  by replacing the file extension
    mmcif_file_path = None
    if os.path.isfile(pdb_file_path):
        mmcif_file_path = os.path.splitext(pdb_file_path)[0] + ".mmcif"
        st = gemmi.read_structure ( pdb_file_path )
        st.make_mmcif_document().write_file ( mmcif_file_path )
    return mmcif_file_path


def clean_mmcif ( mmcif_infile_path,mmcif_outfile_path ):
#  Removes artefacts such as atoms with empty names and empty chains.
#  Should be used if mmcif was produced by MMDB
    if os.path.isfile(mmcif_infile_path):
        st = gemmi.read_structure ( mmcif_infile_path )
        for model in st:
            for chain in model:
                for res in chain:
                    k = len(res)
                    for i in range(len(res)):
                        k -= 1
                        if not res[k].name:
                            del res[k]
        st.remove_empty_chains()
        st.make_mmcif_document().write_file ( mmcif_outfile_path )
        return st
    return None

def check_xyz_format ( file_path ):
    try:
        # Attempt to read the file as a structure
        st = gemmi.read_structure ( file_path )        
        # Check if format is 'pdb'
        if st.format == gemmi.Format.Pdb:
            return 'pdb'
        elif st.format == gemmi.Format.Mmcif:
            return 'mmcif'
        else:
            return False
    except:
        return 'misformatted'



# """  IN DEVELOPMENT


def translate_to_pdb ( st,pdb_outfile_path=None,ligands=None ):
    
    cids     = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    trans_meta = {
        "chains_old"   : {},  # maps old and new
        "chains_new"   : {},  # maps new and old (reverse)
        "residues_old" : {},
        "residues_new" : {}
    }

    chains   = []
    residues = []
    
    for model in st:        
        for chain in model:
            if chain.name not in chains:
                chains.append ( chain.name )
            for res in chain:
                if res.name not in residues:
                    residues.append ( res.name )

    if len(chains)>len(cids):
        return None   #  not translatable

    # check for multicharacter chain Ids and replace them such that 
    # single-character ones do not change
    ncid = 0
    for i in range(len(chains)):
        if len(chains[i])>1:  
            # replace with a free 1-letter code
            while ncid<len(cids):
                if cids[ncid] not in chains:  # then it is free
                    break
                ncid += 1
            if ncid>=len(cids):
                return None  # not translatable
            trans_meta["chains_old"][chains[i]]  = cids[ncid]
            trans_meta["chains_new"][cids[ncid]] = chains[i] 
            ncid += 1

    # now recode residues; 3-letter codes will not be changed
    for i in range(len(residues)):
        if len(residues[i])>3:  # needs recoding
            # try truncating first for easier identification by user 
            # make up new name such that truncation to three letters
            # comes as first option
            new_rname = None
            for L1 in residues[i][0] + alphabet:
                for L2 in residues[i][1] + alphabet:
                    for L3 in residues[i][2] + alphabet:
                        new_rname = L1 + L2 + L3
                        if new_rname not in residues:
                            break
                        else:
                            new_rname = None
                    if new_rname:
                        break
                if new_rname:
                    break
            if not new_rname:
                return None  # not translatable
            trans_meta["residues_old"][residues[i]] = new_rname
            trans_meta["residues_new"][new_rname]   = residues[i] 

    if (not ligands) and trans_meta["residues_old"]:
        return None  # ligand descriptions not given for renaming

    # replace residue names now using direct translation
    for model in st:
        for chain in model:
            for res in chain:
                if res.name in trans_meta["residues_old"]:
                    res.name = trans_meta["residues_old"][res.name]
            if chain.name in trans_meta["chains_old"]:
                chain.name = trans_meta["chains_old"][chain.name]
    
    if pdb_outfile_path:
        st.write_pdb ( pdb_outfile_path )

    return trans_meta

"""
def translate_to_pdb ( st,pdb_outfile_path=None ):
# this is a temporary placeholder
    st.setup_entities()
    st.shorten_chain_names()
    if pdb_outfile_path:
        st.write_pdb ( pdb_outfile_path )
    return True
"""

def translate_file_to_pdb ( mmcif_infile_path,pdb_outfile_path ):
    if os.path.isfile(mmcif_infile_path):
        st = gemmi.read_structure ( mmcif_infile_path )
        return translate_to_pdb ( st,pdb_outfile_path )
    else:
        return None
