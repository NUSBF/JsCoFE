##!/usr/bin/python

#
# ============================================================================
#
#    04.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BORGES LIBRARY DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import dtype_template

# ============================================================================

def dtype(): return "DataBorges"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "borges-library"
            self.version += 0    # versioning increments from parent to children
        return

    def setBorgesFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["borges"] )
        return

    def getBorgesFileName ( self ):
        return self.getFileName ( dtype_template.file_key["borges"] )

    def getBorgesFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["borges"] )
