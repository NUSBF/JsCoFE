##!/usr/bin/python

#
# ============================================================================
#
#    15.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  RVAPI Utility Functions
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2024
#
# ============================================================================
#

import os
import gemmi

# ============================================================================

def can_convert_to_pdb ( mmcif_file_path ):
#  Returns True if mmCIF file is convertable to PDB
    if not os.path.isfile ( mmcif_file_path ):
        return False
    # cif_block = gemmi.cif.read(mmcif_file_path)[0]
    # st        = gemmi.make_structure_from_block ( cif_block )
    st = gemmi.read_structure ( mmcif_file_path )
    for model in st:
        for chain in model:
            if len(chain.name)>1 or len(chain)>9999:
                return False
            for res in chain:
                if len(res.name)>3:
                    return False
    return True


def convert_to_pdb ( mmcif_file_path ):
#  Returns path to the produced PDB file (obtained from given path by replacing
#  the file extension) if mmCIF file is convertable, and returns None if
#  conversion is not possible
    pdb_file_path = None
    pdb_nogood    = None
    if os.path.isfile(mmcif_file_path):
        # cif_block = gemmi.cif.read(mmcif_file_path)[0]
        # st        = gemmi.make_structure_from_block ( cif_block )
        st = gemmi.read_structure ( mmcif_file_path )
        for model in st:
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
            st.write_pdb ( pdb_file_path )
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
