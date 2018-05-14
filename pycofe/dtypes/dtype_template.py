##!/usr/bin/python

#
# ============================================================================
#
#    18.10.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BASE (TEMPLATE) DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from pycofe.varut import jsonut

# ============================================================================

def dtype(): return "DataTemplate"  # must coincide with data definitions in JS

def subtypeHKL         (): return "hkl"
def subtypeAnomalous   (): return "anomalous"
def subtypeASU         (): return "asu"
def subtypeSequence    (): return "seq"
def subtypeXYZ         (): return "xyz"
def subtypeSubstructure(): return "substructure"
def subtypeAnomSubstr  (): return "substructure-am"
def subtypePhases      (): return "phases"
def subtypeLigands     (): return "ligands"
def subtypeWaters      (): return "waters"

def subtypeMR          (): return "MR"
def subtypeEP          (): return "EP"

def subtypeProtein     (): return "protein"
def subtypeDNA         (): return "dna"
def subtypeRNA         (): return "rna"

# ============================================================================


def makeDataId ( jobId,serialNo ):
    return str(jobId).zfill(4) + "-" + str(serialNo).zfill(2)

def makeFileName ( jobId,serialNo,name ):
    return makeDataId(jobId,serialNo) + "_" + name

class DType(jsonut.jObject):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(json_str)
        if not json_str:
            self._type      = dtype()      # base data type
            self.version    = 0
            self.subtype    = []          # default 'basic' subtype
            self.dname      = "template"  # data name to display
            self.jobId      = job_id;
            self.dataId     = "0-0"
            self.files      = []  # may be a multiple-file data type
            self.associated = []  # optional list of associated data Ids
        return

    def makeDataId ( self,serialNo ):
        self.dataId = makeDataId ( self.jobId,serialNo )
        return

    def lessDataId ( self,fname ):
        # returns fname without dataId prefix if there is any
        if len(fname)<9:
            return fname
        if fname[0:4].isdigit() and fname[5:7].isdigit() and fname[4]=="-" and fname[7]=="_":
            return fname[8:]
        return fname

    def setFile ( self,fname ): # fname is file name as a string
        self.files = [fname]
        return

    def removeFiles ( self ):
        self.files = []
        return

    def addFile ( self,fname ): # fname is file name as a string
        self.files.append ( fname )
        return

    def setFiles ( self,fnames ): # fnames must be an array of file names
        self.files = fnames
        return

    def makeDName ( self,serialNo ):
        if serialNo > 0:
            self.makeDataId ( serialNo )
        if len(self.files) > 0:
            fname,fext = os.path.splitext(self.files[0])
            if fext == ".link":
                fname = os.path.splitext(fname)[0]
            fname += " /" + self._type[4:].lower() + "/"
            for st in self.subtype:
                fname += st + "/"
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = fname
        return

    def makeUniqueFNames ( self,dirPath ):
        for i in range(len(self.files)):
            if self.files[i]:
                if not self.files[i].startswith(self.dataId):
                    newFName = self.dataId + "_" + self.files[i]
                    os.rename ( os.path.join(dirPath,self.files[i]),
                                os.path.join(dirPath,newFName) )
                    self.files[i] = newFName
        return


    def addDataAssociation ( self,dataId ):
        if not dataId in self.associated:
            self.associated.append ( dataId )
        return

    def removeDataAssociation ( self,dataId ):
        associated = []
        for did in self.associated:
            if did != dataId:
                associated.append ( did )
        self.associated = associated
        return

    def addDataAssociations ( self,dataList ):
        for d in dataList:
            if d:
                self.addDataAssociation ( d.dataId )
        return

    def copyAssociations ( self,data ):
        self.associated = data.associated
        return

    def setSubtype ( self,subtype ):
        self.subtype = [subtype]
        return

    def addSubtype ( self,stype ):
        if not stype in self.subtype:
            self.subtype += [stype]
        return

    def addSubtypes ( self,stypes ):
        for i in range(len(stypes)):
            if not stypes[i] in self.subtype:
                self.subtype += [stypes[i]]
        return

    def hasSubtype ( self,type ):
        return type in self.subtype

    def removeSubtype ( self,type ):
        if type in self.subtype:
            st = []
            for i in range(len(self.subtype)):
                if self.subtype[i] != type:
                    st += [self.subtype[i]]
            self.subtype = st
        return

    def copySubtype ( self,data ):
        self.subtype = data.subtype
        return

    def getFileName ( self,fileNo=0 ):
        if len(self.files)>fileNo:
            return self.files[fileNo]
        return None

    def getFilePath ( self,dirPath,fileNo=0 ):
        if len(self.files)>fileNo:
            if self.files[fileNo]:
                return os.path.join ( dirPath,self.files[fileNo] )
        return None
