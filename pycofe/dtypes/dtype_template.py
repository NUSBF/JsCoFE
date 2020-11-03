##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    20.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BASE (TEMPLATE) DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from pycofe.varut import jsonut

# ============================================================================

def dtype(): return "DataTemplate"  # must coincide with data definitions in JS

def subtypeHKL         (): return "hkl"
def subtypeRegular     (): return "regular"
def subtypeAnomalous   (): return "anomalous"
def subtypeASU         (): return "asu"
def subtypeSequence    (): return "seq"
def subtypeXYZ         (): return "xyz"
def subtypeSubstructure(): return "substructure"
def subtypeAnomSubstr  (): return "substructure-am"
def subtypePhases      (): return "phases"
def subtypeLigands     (): return "ligands"
def subtypeWaters      (): return "waters"

def subtypeProtein     (): return "protein"
def subtypeDNA         (): return "dna"
def subtypeRNA         (): return "rna"

# ============================================================================

file_key = {
    'xyz'   : 'xyz',   # atomic coordinates
    'mmcif' : 'mmcif', # atomic coordinates in mmcif format
    'sol'   : 'sol',   # phaser's sol file
    'sub'   : 'sub',   # heavy atom (substructure) coordinates
    'seq'   : 'seq',   # sequence file
    'mtz'   : 'mtz',   # .mtz file with hkl and/or phases
    'map'   : 'map',   # map file
    'dmap'  : 'dmap',  # difference map file
    'lib'   : 'lib',   # ligand dictionary
    'coot'  : 'coot',  # Coot python script
    'molp'  : 'molp',  # molprobity_probe.txt file
    'hhr'   : 'hhr'    # hhpred alignment file
}


# ============================================================================


def makeDataId ( jobId,serialNo ):
    return str(jobId).zfill(4) + "-" + str(serialNo).zfill(2)

def makeFileName ( jobId,serialNo,name ):
    return makeDataId(jobId,serialNo) + "_" + name

class DType(jsonut.jObject):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(json_str)
        if not json_str:
            self._type      = dtype()     # base data type
            self.version    = 2
            self.subtype    = []          # default 'basic' subtype
            self.dname      = "template"  # data name to display
            self.jobId      = job_id;
            self.dataId     = "0-0"
            self.files      = {}  # may be a multiple-file data type
            self.associated = []  # optional list of associated data Ids
            self.citations  = []  # list of program citations
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

    def addCitation ( self,reference ):
        if hasattr(self,"citations"):
            if reference not in self.citations:
                self.citations.append ( reference )
        else:
            self.citations = [reference]
        return

    def addCitations ( self,reflist ):
        if not hasattr(self,"citations"):
            self.citations = []
        for reference in reflist:
            if reference not in self.citations:
                self.citations.append ( reference )
        return

    def setFile ( self,fname,fileKey ): # fname is file name as a string
        if fname:
            self.files[fileKey] = fname
        return

    def removeFiles ( self ):
        self.files = {}
        return

    #def addFile ( self,fname ): # fname is file name as a string
    #    self.files.append ( fname )
    #    return

    #def setFiles ( self,files ):
    #    self.files = files
    #    return

    def makeDName ( self,serialNo ):
        if serialNo > 0:
            self.makeDataId ( serialNo )
        for fileKey in self.files:
            fname,fext = os.path.splitext(self.files[fileKey])
            if fext == ".link":
                fname = os.path.splitext(fname)[0]
            fname += " /" + self._type[4:].lower() + "/"
            for st in self.subtype:
                if st!=subtypeRegular():
                    fname += st + "/"
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = fname
            break
        return

    def makeUniqueFNames ( self,dirPath ):
        for fileKey in self.files:
            fname = self.files[fileKey]
            if not fname.startswith(self.dataId):
                newFName = self.dataId + "_" + fname
                os.rename ( os.path.join(dirPath,fname),
                            os.path.join(dirPath,newFName) )
                self.files[fileKey] = newFName
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

    def removeSubtypes ( self,type_list ):
        st = []
        for type in self.subtype:
            if not type in type_list:
                st += [type]
        self.subtype = st
        return

    def copySubtype ( self,data_object ):
        self.subtype = []
        for st in data_object.subtype:
            self.subtype.append ( st )
        return

    def getSubtypes ( self ):
        return self.subtype


    def add_file ( self,fn,outputDir,fileKeyName,copy_bool=False ):
        if fn and os.path.isfile(fn):
            fname = os.path.basename(fn)
            if (not fname[0:4].isdigit()) or (not fname[5:7].isdigit()) or fname[4]!="-" or fname[7]!="_":
                fname = self.dataId + "_" + fname
            self.setFile ( fname,file_key[fileKeyName] )
            fpath = os.path.join ( outputDir,fname )
            if fn!=fpath:
                if os.path.isfile(fpath):
                    os.remove ( fpath )  # required on Windows
                if copy_bool:
                    shutil.copy2 ( fn,fpath )
                else:
                    os.rename ( fn,fpath )
        return


    def getFileName ( self,fileKey ):
        if isinstance(self.files,dict):
            if fileKey in self.files:
                return str ( self.files[fileKey] )
        elif hasattr(self.files,fileKey):
            return str ( getattr ( self.files,fileKey ) )
        return None

    def getFilePath ( self,dirPath,fileKey ):
        if not dirPath:
            return self.getFileName ( fileKey )
        if isinstance(self.files,dict):
            if fileKey in self.files:
                return str ( os.path.join ( dirPath,self.files[fileKey] ) )
        elif hasattr(self.files,fileKey):
            return str ( os.path.join ( dirPath,getattr(self.files,fileKey) ) )
        return None
