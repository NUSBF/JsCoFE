##!/usr/bin/python

#
# ============================================================================
#
#    08.09.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  STRUCTURE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from   pycofe.dtypes import dtype_template, dtype_xyz
from   pycofe.proc   import xyzmeta


# ============================================================================

# This data type is made of two data files: coordinates (files[0]) and
# ED Map (files[1]).

def dtype(): return "DataStructure"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:

            self._type   = dtype()
            self.dname   = "structure"
            self.version = 1

            #  Refmac labels
            self.FP      = ""  # used in Buccaneer-MR and Parrot-MR
            self.SigFP   = ""  # used in Buccaneer-MR and Parrot-MR
            self.PHI     = ""
            self.FOM     = ""
            self.FWT     = ""
            self.PHWT    = ""
            self.DELFWT  = ""
            self.PHDELWT = ""

            #  Hendrickson-Lattman Coefficients
            self.HLA     = ""
            self.HLB     = ""
            self.HLC     = ""
            self.HLD     = ""

            #  Free R-flag
            self.FreeR_flag = ""

            self.useCoordinates = True  # flag for using in Phaser-EP
            self.rmsd           = 0.3   # used in Phaser-EP
            #self.useForNCS      = True  # for use in Parrot
            self.useModelSel    = "N"   # for use in Buccaneer
            self.BFthresh       = 3.0
            self.chains         = []

            self.ligands        = []    # list of ligands fitted

        return

    def setRefmacLabels ( self,hkl_class ):
        self.FP    = "FP"
        self.SigFP = "SIGFP"
        if hkl_class:
            if hasattr(hkl_class.dataset,"Fmean"):
                self.FP    = hkl_class.dataset.Fmean.value
                self.SigFP = hkl_class.dataset.Fmean.sigma
        self.PHI        = "PHIC_ALL_LS"
        self.FOM        = "FOM"
        self.FWT        = "FWT"
        self.PHWT       = "PHWT"
        self.DELFWT     = "DELFWT"
        self.PHDELWT    = "PHDELWT"
        self.FreeR_flag = "FreeR_flag"
        return

    def setShelxELabels ( self ):
        self.FP      = "ShelxE.F"
        self.SigFP   = "ShelxE.SIGF"
        self.PHI     = "ShelxE.PHI"
        self.FOM     = "ShelxE.FOM"
        self.FWT     = "FWT"
        self.PHWT    = "PHWT"
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.FreeR_flag = "FreeR_flag"
        return

    def setPhaserEPLabels ( self ):
        self.FP      = "F"
        self.SigFP   = "SIGF"
        self.PHI     = "PHIB"
        self.FOM     = "FOM"
        self.FWT     = "FWT"
        self.PHWT    = "PHWT"
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.HLA     = "HLA"
        self.HLB     = "HLB"
        self.HLC     = "HLC"
        self.HLD     = "HLD"
        self.FreeR_flag = "FreeR_flag"
        return;


    def setBP3Labels ( self ):
        self.FP      = "BP3_FB"
        self.SigFP   = ""
        self.PHI     = "BP3_PHIB"
        self.FOM     = "BP3_FOM"
        self.FWT     = ""
        self.PHWT    = ""
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.HLA     = "BP3_HLA"
        self.HLB     = "BP3_HLB"
        self.HLC     = "BP3_HLC"
        self.HLD     = "BP3_HLD"
        self.FreeR_flag = "FreeR_flag"
        return

    def setHLLabels ( self ):
        self.HLA = "HLA"
        self.HLB = "HLB"
        self.HLC = "HLC"
        self.HLD = "HLD"
        return

    def setParrotLabels ( self ):
        self.HLA = "parrot.ABCD.A"
        self.HLB = "parrot.ABCD.B"
        self.HLC = "parrot.ABCD.C"
        self.HLD = "parrot.ABCD.D"
        return

    def setCrank2Labels ( self ):
        self.FP         = "REFM_F"
        self.SigFP      = "REFM_SIGF"
        self.PHI        = "REFM_PHCOMB"
        self.FOM        = "REFM_FOMCOMB"
        self.FWT        = "REFM_FWT"
        self.PHWT       = "REFM_PHWT"
        self.DELFWT     = "REFM_DELFWT"
        self.PHDELWT    = "REFM_PHDELWT"
        self.FreeR_flag = "FREER"
        return


    def copyLabels ( self,struct_class ):
        self.FP      = struct_class.FP
        self.SigFP   = struct_class.SigFP
        self.PHI     = struct_class.PHI
        self.FWT     = struct_class.FWT
        self.PHWT    = struct_class.PHWT
        self.DELFWT  = struct_class.DELFWT
        self.PHDELWT = struct_class.PHDELWT
        self.FOM     = struct_class.FOM
        self.HLA     = struct_class.HLA
        self.HLB     = struct_class.HLB
        self.HLC     = struct_class.HLC
        self.HLD     = struct_class.HLD
        self.FreeR_flag = struct_class.FreeR_flag
        return

    def addMRSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeMR()     )
        self.addSubtype ( dtype_template.subtypePhases() )
        return

    def hasMRSubtype ( self ):
        return dtype_template.subtypeMR() in self.subtype

    def addEPSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeEP()     )
        return

    def hasEPSubtype ( self ):
        return dtype_template.subtypeEP() in self.subtype

    def setXYZSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeXYZ() )
        return

    def makeXYZSubtype ( self ):
        self.removeSubtype ( dtype_template.subtypeSubstructure() )
        self.addSubtype    ( dtype_template.subtypeXYZ() )
        return

    def addPhasesSubtype ( self ):
        self.addSubtype    ( dtype_template.subtypePhases() )
        return

    def hasXYZSubtype ( self ):
        return dtype_template.subtypeXYZ() in self.subtype

    def hasSubSubtype ( self ):
        return dtype_template.subtypeSubstructure() in self.subtype

    def addLigandSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeLigands() )
        return

    def hasLigandSubtype ( self ):
        return dtype_template.subtypeLigands() in self.subtype

    def addWaterSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeWaters() )
        return

    def hasWaterSubtype ( self ):
        return dtype_template.subtypeWaters() in self.subtype

    def addEMSubtype ( self ):
        if not "EM" in self.subtype:
            self.subtype += ["EM"]
        return

    def hasEMSubtype ( self ):
        return "EM" in self.subtype

    def setSubstrSubtype ( self ):
        self.subtype = [dtype_template.subtypeSubstructure()]
        return

    def setAnomSubstrSubtype ( self ):
        self.subtype = [dtype_template.subtypeAnomSubstr()]
        return

    def copySubtype ( self,struct_class ):
        self.subtype = struct_class.subtype
        return

    def putXYZMeta ( self,fdir,file_stdout,file_stderr,log_parser=None ):
        fpath = self.getXYZFilePath ( fdir )
        if not fpath:
            fpath = self.getSubFilePath ( fdir )
        if fpath:
            dtype_xyz.setXYZMeta ( self,xyzmeta.getXYZMeta (
                                   fpath,file_stdout,file_stderr,log_parser ) )
        return

    def getSpaceGroup ( self ):
        if type(self.xyzmeta) == dict:
            if "cryst" in self.xyzmeta:
                return self.xyzmeta["cryst"]["spaceGroup"]
        elif hasattr(self.xyzmeta,"cryst"):
            return self.xyzmeta.cryst.spaceGroup
        return None

    def setXYZFile ( self,fname ):
        if fname:
            self.addSubtype ( dtype_template.subtypeXYZ() )
            self.setFile    ( fname,dtype_template.file_key["xyz"] )
        return

    def setSubFile ( self,fname ):
        if fname:
            self.addSubtype ( dtype_template.subtypeSubstructure() )
            self.setFile    ( fname,dtype_template.file_key["sub"] )
        return

    def setMTZFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["mtz"] )
        return

    def setSolFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["sol"] )
        return

    def getXYZFileName(self):
        return self.getFileName ( dtype_template.file_key["xyz"] )

    def getSolFileName(self):
        return self.getFileName ( dtype_template.file_key["sol"] )

    def getSubFileName(self):
        return self.getFileName ( dtype_template.file_key["sub"] )

    def getSubFileName(self):
        return self.getFileName ( dtype_template.file_key["sub"] )

    def getMTZFileName(self):
        return self.getFileName ( dtype_template.file_key["mtz"] )

    def getMapFileName(self):
        return self.getFileName ( dtype_template.file_key["map"] )

    def getDMapFileName(self):
        return self.getFileName ( dtype_template.file_key["dmap"] )

    def getLibFileName(self):
        return self.getFileName ( dtype_template.file_key["lib"] )

    def getSolFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["sol"] )

    def getXYZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def getSubFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["sub"] )

    def getMTZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["mtz"] )

    def getMapFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["map"] )

    def getDMapFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["dmap"] )

    def getLibFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["lib"] )

    def copyLigands ( self,struct_class ):
        if hasattr(struct_class,'ligands'):
            self.ligands = struct_class.ligands
        if struct_class.hasLigandSubtype():
            self.addLigandSubtype()
        return

    def addLigands ( self,ligCode ):
        if not ligCode in self.ligands:
            self.ligands += [ligCode]
        self.addLigandSubtype()
        return

    def add_file ( self,fn,outputDir,fileKeyName,copy_bool=False ):
        if fn and os.path.isfile(fn):
            fname = os.path.basename(fn)
            if (not fname[0:4].isdigit()) or (not fname[5:7].isdigit()) or fname[4]!="-" or fname[7]!="_":
                fname = self.dataId + "_" + fname
            self.setFile ( fname,dtype_template.file_key[fileKeyName] )
            fpath = os.path.join ( outputDir,fname )
            if fn!=fpath:
                if os.path.isfile(fpath):
                    os.remove ( fpath )  # required on Windows
                if copy_bool:
                    shutil.copy2 ( fn,fpath )
                else:
                    os.rename ( fn,fpath )
        return

    def adjust_dname ( self ):
        if not self.getXYZFileName() and self.getSubFileName():
            self.dname = self.dname.replace ( "/structure/","/substructure/" )
        return



# ============================================================================

def getValidFileName ( xyzFilePath,subFilePath,mtzFilePath,mapFilePath ):
    if (xyzFilePath):  return xyzFilePath
    if (subFilePath):  return subFilePath
    if (mtzFilePath):  return mtzFilePath
    return mapFilePath

# ----------------------------------------------------------------------------

def register ( xyzFilePath,subFilePath,mtzFilePath,mapFilePath,dmapFilePath,libFilePath,
               dataSerialNo,job_id,outDataBox,outputDir,copy_files=False ):
    fname0 = getValidFileName ( xyzFilePath,subFilePath,mtzFilePath,mapFilePath )
    if fname0 and os.path.isfile(fname0):
        structure = DType   ( job_id )
        # note that, in the following line, file key may be any
        structure.setFile ( os.path.basename(fname0),dtype_template.file_key["xyz"] )
        structure.makeDName ( dataSerialNo )
        structure.removeFiles()
        structure.add_file ( xyzFilePath ,outputDir,"xyz" ,copy_files )
        structure.add_file ( subFilePath ,outputDir,"sub" ,copy_files )
        structure.add_file ( mtzFilePath ,outputDir,"mtz" ,copy_files )
        structure.add_file ( mapFilePath ,outputDir,"map" ,copy_files )
        structure.add_file ( dmapFilePath,outputDir,"dmap",copy_files )
        structure.add_file ( libFilePath ,outputDir,"lib" ,copy_files )
        if xyzFilePath:
            structure.addSubtype ( dtype_template.subtypeXYZ() )
        if subFilePath:
            structure.addSubtype ( dtype_template.subtypeSubstructure() )
        if outDataBox:
            outDataBox.add_data ( structure )
        structure.adjust_dname()
        return structure

    else:
        return None;

# ----------------------------------------------------------------------------

def basename ( fpath ):
    if fpath:
        return os.path.basename ( fpath )
    return None

# ----------------------------------------------------------------------------

#  register1() assumes that all files are in output directory and named
#  properly -- so just checks them in
def register1 ( xyzFilePath,subFilePath,mtzFilePath,mapFilePath,dmapFilePath,libFilePath,
                regName,dataSerialNo,job_id,outDataBox ):

    fname0 = getValidFileName ( xyzFilePath,subFilePath,mtzFilePath,mapFilePath )
    if fname0 and os.path.isfile(fname0):
        structure = DType   ( job_id       )
        structure.setFile   ( regName,dtype_template.file_key["xyz"] )
        structure.makeDName ( dataSerialNo )
        structure.removeFiles()
        structure.setFile ( basename(xyzFilePath ),dtype_template.file_key["xyz" ] )
        structure.setFile ( basename(subFilePath ),dtype_template.file_key["sub" ] )
        structure.setFile ( basename(mtzFilePath ),dtype_template.file_key["mtz" ] )
        structure.setFile ( basename(mapFilePath ),dtype_template.file_key["map" ] )
        structure.setFile ( basename(dmapFilePath),dtype_template.file_key["dmap"] )
        structure.setFile ( basename(libFilePath ),dtype_template.file_key["lib" ] )
        if xyzFilePath:
            structure.addSubtype ( dtype_template.subtypeXYZ() )
        if subFilePath:
            structure.addSubtype ( dtype_template.subtypeSubstructure() )
        if outDataBox:
            outDataBox.add_data ( structure )
        structure.adjust_dname()
        return structure

    else:
        return None;
