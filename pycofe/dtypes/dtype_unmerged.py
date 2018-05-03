##!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  UNMERGED REFLECTIONS DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os

#  application imports
import dtype_template

# ============================================================================

def dtype(): return "DataUnmerged"  # must coincide with data definitions in JS

class dict2obj(object):
        def __init__(self, **entries):
            self.__dict__.update(entries)

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type   = dtype()
            self.dname   = "unmerged"
            self.version = 0
        return


    def importUnmergedData ( self,mtzf,dataset ):

        mtzf.MTZ = os.path.basename(mtzf.MTZ)
        self.setFile ( mtzf.MTZ )

        self.HM      = mtzf.HM
        self.CELL    = mtzf.CELL
        self.BRNG    = mtzf.BRNG
        self.dataset = dict2obj(**dataset)

        return


    def makeDName ( self,serialNo ):
        if serialNo > 0:
            self.makeDataId ( serialNo )
        if len(self.files) > 0:
            fname,fext = os.path.splitext(self.files[0])
            fname += " /" + self.dataset.name + " /" + self._type[4:].lower() + "/"
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = fname
        return


    """
    def makeDName ( self,serialNo ):
        if serialNo > 0:
            self.makeDataId ( serialNo )
        if len(self.files) > 0:
            fname,fext = os.path.splitext(self.files[0])
            fname = self.dataset.name + " /" + fname + " /" + self._type[4:].lower() + "/"
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = fname
        return
    """
