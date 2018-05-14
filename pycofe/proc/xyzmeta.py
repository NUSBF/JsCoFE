##!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ HANDLING UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
#import pyrvapi

#  application imports
from pycofe.varut import command


# ============================================================================

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
