##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    30.09.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  UNMERGED REFLECTIONS DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import dtype_template

# ============================================================================

def dtype(): return "DataUnmerged"  # must coincide with data definitions in JS

class dict2obj(object):
        def __init__(self, **entries):
            self.__dict__.update(entries)

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "unmerged"
            self.ha_type  = ""   # heavy atom type
            self.version += 0    # versioning increments from parent to children
        return


    def importUnmergedData ( self,mtzf,dataset ):

        mtzf.MTZ = os.path.basename(mtzf.MTZ)
        self.setFile ( mtzf.MTZ,dtype_template.file_key["mtz"] )

        self.HM      = mtzf.HM
        self.CELL    = mtzf.CELL
        self.BRNG    = mtzf.BRNG
        self.dataset = dict2obj(**dataset)

        return


    def makeDName ( self,serialNo ):
        if serialNo > 0:
            self.makeDataId ( serialNo )
        for fileKey in self.files:
            fname,fext = os.path.splitext(self.files[fileKey])
            fname += " /" + self.dataset.name + " /" + self._type[4:].lower() + "/"
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = fname
            break
        return

    def setUnmergedFileName ( self,fname ):
        self.files[dtype_template.file_key["mtz"]] = fname
        return

    def getUnmergedFileName(self):
        return self.getFileName ( dtype_template.file_key["mtz"] )

    def getUnmergedFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["mtz"] )
