##!/usr/bin/python

#
# ============================================================================
#
#    06.07.18   <--  Date of Last Modification.
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
            self.version = 0

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
            self.useForNCS      = True  # for use in Parrot
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
        return;

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

    def addXYZSubtype ( self ):
        self.removeSubtype ( dtype_template.subtypeSubstructure() )
        self.addSubtype    ( dtype_template.subtypeXYZ() )
        return

    def hasXYZSubtype ( self ):
        return dtype_template.subtypeXYZ() in self.subtype

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
        if self.files[0]:
            dtype_xyz.setXYZMeta ( self,xyzmeta.getXYZMeta (
                                            os.path.join(fdir,self.files[0]),
                                                file_stdout,file_stderr,log_parser ) )
        return

    def getSpaceGroup ( self ):
        if type(self.xyzmeta) == dict:
            if "cryst" in self.xyzmeta:
                return self.xyzmeta["cryst"]["spaceGroup"]
        elif hasattr(self.xyzmeta,"cryst"):
            return self.xyzmeta.cryst.spaceGroup
        return None

    def getXYZFileName(self):
        return self.getFileName ( 0 )

    def getMTZFileName(self):
        return self.getFileName ( 1 )

    def getMapFileName(self):
        return self.getFileName ( 2 )

    def getDMapFileName(self):
        return self.getFileName ( 3 )

    def getLibFileName(self):
        return self.getFileName ( 4 )

    def getXYZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,0 )

    def getMTZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,1 )

    def getMapFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,2 )

    def getDMapFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,3 )

    def getLibFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,4 )

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


def getValidFileName ( xyzFilePath,mtzFilePath,mapFilePath ):
    if (xyzFilePath):  return xyzFilePath
    if (mtzFilePath):  return mtzFilePath
    return mapFilePath

def register ( xyzFilePath,mtzFilePath,mapFilePath,dmapFilePath,libFilePath,
               dataSerialNo,job_id,outDataBox,outputDir,copy=False ):

    fname0 = getValidFileName ( xyzFilePath,mtzFilePath,mapFilePath )
    if fname0 and os.path.isfile(fname0):
        structure = DType   ( job_id )
        structure.setFile ( os.path.basename(fname0) )
        structure.makeDName ( dataSerialNo )
        structure.removeFiles()
        # this order of files IS FIXED and is relied upon in other parts
        # of jsCoFE
        flist = [xyzFilePath,mtzFilePath,mapFilePath,dmapFilePath,libFilePath]
        for f in flist:
            if f and os.path.isfile(f):
                fname = os.path.basename(f)
                if (not fname[0:4].isdigit()) or (not fname[5:7].isdigit()) or fname[4]!="-" or fname[7]!="_":
                    fname = structure.dataId + "_" + fname
                structure.addFile ( fname )
                fpath = os.path.join ( outputDir,fname )
                if f!=fpath:
                    if os.path.isfile(fpath):
                        os.remove ( fpath )  # required on Windows
                    if copy:
                        shutil.copy2 ( f,fpath )
                    else:
                        os.rename ( f,fpath )
            else:
                structure.addFile ( None )
        outDataBox.add_data ( structure )
        return structure

    else:
        return None;


#  register1() assumes that all files are in output directory and named
#  properly -- so just checks them in
def register1 ( xyzFilePath,mtzFilePath,mapFilePath,dmapFilePath,libFilePath,
                regName,dataSerialNo,job_id,outDataBox ):

    fname0 = getValidFileName ( xyzFilePath,mtzFilePath,mapFilePath )
    if fname0 and os.path.isfile(fname0):
        structure = DType   ( job_id       )
        structure.setFile   ( regName      )
        structure.makeDName ( dataSerialNo )
        structure.removeFiles()
        # this order of files IS FIXED and is relied upon in other parts
        # of jsCoFE
        flist = [xyzFilePath,mtzFilePath,mapFilePath,dmapFilePath,libFilePath]
        for f in flist:
            if f and os.path.isfile(f):
                structure.addFile ( os.path.basename(f) )
            else:
                structure.addFile ( None )
        """
        structure.addFile ( os.path.basename(xyzFilePath) )
        structure.addFile ( os.path.basename(mtzFilePath) )
        if os.path.isfile(mapFilePath):
            structure.addFile ( os.path.basename(mapFilePath) )
        else:
            structure.addFile ( None )
        if os.path.isfile(dmapFilePath):
            structure.addFile ( os.path.basename(dmapFilePath) )
        else:
            structure.addFile ( None )
        if os.path.isfile(libFilePath):
            structure.addFile ( os.path.basename(libFilePath) )
        else:
            structure.addFile ( None )
        """
        outDataBox.add_data ( structure )
        return structure

    else:
        return None;
