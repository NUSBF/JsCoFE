##!/usr/bin/python

#
# ============================================================================
#
#    16.10.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MOLGRAPH DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2024
#
# ============================================================================
#

#  python native imports
import os
# import sys
import shutil

#  application imports
from . import dtype_template


# ============================================================================

def dtype(): return "DataMolGraph"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "molgraph"
            self.code     = ""
            self.version += 0      # versioning increments from parent to children
        return

    def setMolGraphFile ( self,fname ):
        _, fext = os.path.splitext ( fname )
        fext  = fext.lower()
        ftype = None
        if   fext==".sdf" :  ftype = "sdf"
        elif fext==".mol2":  ftype = "mol2"
        elif fext==".sml" :  ftype = "sml"
        self.setFile ( fname,dtype_template.file_key[ftype] )
        return

    def getSDFFileName(self):
        if "sdf" in dtype_template.file_key:
            return self.getFileName ( dtype_template.file_key["sdf"] )

    def getMol2FileName(self):
        if "mol2" in dtype_template.file_key:
            return self.getFileName ( dtype_template.file_key["mol2"] )

    def getSMLFilePath ( self,dirPath ):
        if "sml" in dtype_template.file_key:
            return self.getFilePath ( dirPath,dtype_template.file_key["sml"] )


def register ( molgraphFilePath,dataSerialNo,job_id,outDataBox,
               outputDir,copy=False ):

    if os.path.isfile(molgraphFilePath):
        molgraph  = DType   ( job_id )
        data_type = None 
        _, file_extension = os.path.splitext ( molgraphFilePath )
        if file_extension.upper()==".SDF":
            data_type = dtype_template.file_key["sdf"]
        if file_extension.upper()==".MOL2":
            data_type = dtype_template.file_key["mol2"]
        if file_extension.upper()==".SML":
            data_type = dtype_template.file_key["sml"]
        if data_type:
            molgraph.setFile   ( os.path.basename(molgraphFilePath),data_type )
            molgraph.makeDName ( dataSerialNo )
            molgraph.removeFiles()
            fname = os.path.basename(molgraphFilePath)
            if not dtype_template.hasDataId(fname):
                fname = molgraph.dataId + "_" + fname
            molgraph.setFile ( fname,data_type )
            if copy:
                shutil.copy2 ( molgraphFilePath, os.path.join(outputDir,fname) )
            else:
                os.rename ( molgraphFilePath, os.path.join(outputDir,fname) )
            outDataBox.add_data ( molgraph )
            return molgraph

    else:
        return None;
