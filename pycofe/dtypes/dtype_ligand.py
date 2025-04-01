##!/usr/bin/python

#
# ============================================================================
#
#    02.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LIGAND DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
#
# ============================================================================
#

#  python native imports
import os
# import sys
import shutil

#  application imports
from . import dtype_template
#from   pycofe.proc import xyzmeta


# ============================================================================

def dtype(): return "DataLigand"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "ligand"
            self.code     = "DRG"
            self.version += 0      # versioning increments from parent to children
        return

    def getPDBFileName(self):
        return self.getFileName ( dtype_template.file_key["xyz"] )

    def getMMCIFFileName(self):
        return self.getFileName ( dtype_template.file_key["mmcif"] )

    def getLibFileName(self):
        return self.getFileName ( dtype_template.file_key["lib"] )

    def getPDBFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def getMMCIFFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["mmcif"] )

    def getLibFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["lib"] )


def register ( xyzFilePath,mmcifPath,cifFilePath,dataSerialNo,job_id,outDataBox,
               outputDir,copy=False ):

    if os.path.isfile(xyzFilePath):
        ligand = DType   ( job_id )
        ligand.setFile   ( os.path.basename(xyzFilePath),dtype_template.file_key["xyz"] )
        ligand.makeDName ( dataSerialNo )
        ligand.removeFiles()
        # this order of files IS FIXED and is relied upon in other parts
        # of jsCoFE
        for f in [xyzFilePath,mmcifPath,cifFilePath]:
            if f and os.path.isfile(f):
                # fname = ligand.dataId + "_" + os.path.basename(f)
                fname = os.path.basename(f)
                if not dtype_template.hasDataId(fname):
                    fname = ligand.dataId + "_" + fname
                if f==xyzFilePath:
                    ligand.setFile ( fname,dtype_template.file_key["xyz"] )
                elif f==mmcifPath:
                    ligand.setFile ( fname,dtype_template.file_key["mmcif"] )
                else:
                    ligand.setFile ( fname,dtype_template.file_key["lib"] )
                if copy:
                    shutil.copy2 ( f, os.path.join(outputDir,fname) )
                else:
                    os.rename ( f, os.path.join(outputDir,fname) )
        outDataBox.add_data ( ligand )
        return ligand

    else:
        return None;
