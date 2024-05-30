##!/usr/bin/python

#
# ============================================================================
#
#    15.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ HANDLING UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
#import os
import sys

#  ccp4-python imports
import gemmi
#import pyrvapi

#  application imports
#from pycofe.varut import command


# ============================================================================

"""
def XYZMeta ( json_str ):
    xyz_meta = eval ( json_str )
    if "xyz" in xyz_meta:
        xyz = xyz_meta["xyz"]
        for m in range(len(xyz)):
            model = xyz[m]
            if "chains" in model:
                chains = model["chains"]
                for c in range(len(chains)):
                    if chains[c]["type"]=="AA":
                        chains[c]["type"] = "Protein"
    return xyz_meta
"""

def getXYZMeta ( fpath,file_stdout,file_stderr,log_parser=None ):
# returns chain information as the following disctionary:

    """
    {
      'cryst' : {
          'spaceGroup': 'P 21 21 21',
          'a'     : 64.897,
          'b'     : 78.323,
          'c'     : 38.792,
          'alpha' : 90.00,
          'beta'  : 90.00,
          'gamma' : 90.00
        },
      'xyz' : [
      { 'model':1,
        'chains': [
          { 'id':'A', 'file':'rnase_model_1_A.pdb', 'type':'AA',
            'seq':'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGEATQEDYYTGDHYATFSLIDQTC',
            'size':96, 'ligands':[] },
          { 'id':'B', 'file':'rnase_model_1_B.pdb', 'type':'AA',
            'seq':'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGEATQEDYYTGDHYATFSLIDQTC',
            'size':96, 'ligands':['35S'] }
                  ]
      }
    ],
      'ligands': ['35S']
    }
    """

    """
    scr_file = open ( "pdbcur.script","w" )
    scr_file.write  ( "PDB_META\nEND\n" )
    scr_file.close  ()

    # Start pdbcur
    rc = command.call ( "pdbcur",['XYZIN',fpath],"./",
                        "pdbcur.script",file_stdout,file_stderr,log_parser )

    # read pdbcur's json
    jsonpath = os.path.splitext(fpath)[0] + ".json"

    if not os.path.isfile(jsonpath):
        return None

    # read pdbcur's json
    with open(jsonpath,'r') as json_file:
        json_str = json_file.read()
    json_file.close()

    return XYZMeta ( json_str )
    """

    st = gemmi.read_structure ( fpath )
    st.setup_entities()
    st.assign_subchains()  # internally marks polymer, ligand and waters

    cryst = dict(spaceGroup=str(st.spacegroup_hm),
                 a=round(st.cell.a,6),
                 b=round(st.cell.b,6),
                 c=round(st.cell.c,6),
                 alpha=round(st.cell.alpha,6),
                 beta =round(st.cell.beta ,6),
                 gamma=round(st.cell.gamma,6))

    xyz    = []
    natoms = 0
    for model in st:
        chains = []
        for chain in model:
            polymer = chain.get_polymer()
            t       = polymer.check_polymer_type()
            psize   = len(polymer)
            if t in (gemmi.PolymerType.PeptideL, gemmi.PolymerType.PeptideD):
                abbr = 'Protein'
            #elif t in (gemmi.PolymerType.Dna, gemmi.PolymerType.Rna,
            #           gemmi.PolymerType.DnaRnaHybrid):
            #    abbr = 'NA'
            elif t==gemmi.PolymerType.Dna:
                abbr = 'DNA'
            elif t==gemmi.PolymerType.Rna:
                abbr = 'RNA'
            elif t==gemmi.PolymerType.DnaRnaHybrid:
                abbr = 'NA'
            else:
                abbr  = 'LIG'
                psize = 1
            nats = 0
            for res in chain:
                nats += len(res)
            natoms += nats
            chains.append(dict(id=str(chain.name),
                               type=abbr,
                               seq=str(polymer.make_one_letter_sequence()),
                               size=psize,
                               natoms=natoms))
        xyz.append(dict(model=int(model.name), chains=chains))

    return dict ( cryst=cryst, xyz=xyz, ligands=[], natoms=natoms )
