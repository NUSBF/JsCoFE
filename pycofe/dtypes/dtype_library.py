##!/usr/bin/python

#
# ============================================================================
#
#    08.08.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LIGAND DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from . import dtype_template
#from   pycofe.proc import xyzmeta


# ============================================================================

def dtype(): return "DataLibrary"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "library"
            self.codes    = []
            self.version += 0      # versioning increments from parent to children
        return

    def getLibFileName(self):
        return self.getFileName ( dtype_template.file_key["lib"] )

    def getLibFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["lib"] )


def register ( libFilePath,dataSerialNo,job_id,outDataBox,outputDir,copy=False ):

    if os.path.isfile(libFilePath):
        library = DType   ( job_id )
        library.setFile   ( os.path.basename(libFilePath),dtype_template.file_key["lib"] )
        library.makeDName ( dataSerialNo )
        library.removeFiles()
        fname = library.dataId + "_" + os.path.basename(libFilePath);
        library.setFile ( fname,dtype_template.file_key["lib"] )
        if copy:
            shutil.copy2 ( libFilePath, os.path.join(outputDir,fname) )
        else:
            os.rename ( libFilePath, os.path.join(outputDir,fname) )
        outDataBox.add_data ( library )
        return library

    else:
        return None;
