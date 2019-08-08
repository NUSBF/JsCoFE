##!/usr/bin/python

#
# ============================================================================
#
#    08.08.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MakeLib (Ligand Library Maker)
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
#import sys
import shutil

#  ccp4-python imports
#import pyrvapi

#  application imports
from pycofe.varut   import command


# ============================================================================

# should be rewritten using AceDrg accummulator
def makeLibrary ( body,ligands,library_path ):

    lib_path = library_path + ".tmp"
    codes    = []

    for ligand in ligands:
        process = True  # i.e. library is taken anyway, which is wrong
        if ligand._type=="DataLigand":
            process = not ligand.code in codes
        if process:
            ligpath = ligand.getLibFilePath ( body.inputDir() )
            if len(codes)>0:
                body.open_stdin()
                body.write_stdin (
                    "_Y"          +\
                    "\n_FILE_L  " + library_path +\
                    "\n_FILE_L2 " + ligpath      +\
                    "\n_FILE_O  " + lib_path     +\
                    "\n_END\n" )
                body.close_stdin()
                body.runApp ( "libcheck",[],logType="Service" )
                shutil.copy2 ( lib_path,library_path )
            else:
                shutil.copy2 ( ligpath,library_path )
            if ligand._type=="DataLigand":
                codes.append ( ligand.code )
            else:
                codes += ligand.codes

    if os.path.exists(lib_path):
        os.remove ( lib_path )

    return codes
