##!/usr/bin/python

#
# ============================================================================
#
#    09.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  STRUCTURE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
#
# ============================================================================
#

#  python native imports
import os
# import sys

#  application imports
from   pycofe.dtypes import dtype_template, dtype_xyz
from   pycofe.proc   import xyzmeta


# ============================================================================

# This data type is made of two data files: coordinates (files[0]) and
# ED Map (files[1]).

def dtype(): return "DataStructure"  # must coincide with data definitions in JS

class DType(dtype_xyz.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:

            self._type    = dtype()
            self.dname    = "structure"
            self.version += 3   # versioning increments from parent to children

            #  Refmac labels
            self.FP       = ""  # used in Buccaneer-MR and Parrot-MR
            self.FC       = ""  # used in Omit map
            self.SigFP    = ""  # used in Buccaneer-MR and Parrot-MR
            self.PHI      = ""
            self.FOM      = ""
            self.FWT      = ""
            self.PHWT     = ""
            self.DELFWT   = ""
            self.PHDELWT  = ""

            self.FAN      = ""
            self.PHAN     = ""
            self.DELFAN   = ""
            self.PHDELAN  = ""

            #  Hendrickson-Lattman Coefficients
            self.HLA      = ""
            self.HLB      = ""
            self.HLC      = ""
            self.HLD      = ""

            #  Free R-flag label
            self.FreeR_flag = ""

            self.leadKey  = 0;   # data lead key: 0: undefined, 1: coordinates, 2: phases

            self.useCoordinates = True   # flag for using in Phaser-EP
            self.rmsd           = 0.3    # used in Phaser-EP

            self.removeNonAnom  = False; # for use in Crank-2

            #self.useForNCS      = True  # for use in Parrot
            self.useModelSel    = "N"    # for use in Buccaneer and Nautilus
            self.BFthresh       = 3.0
            self.phaseBlur      = 1.0    # used in arpwarp
            self.mapSel         = "map"  # map selection ('diffmap','map') for coot tasks

            self.chains         = []
            self.ligands        = []     # list of ligands fitted
            self.refmacLinks    = []     # List of links with description
            self.links          = []     # List of links without description

            self.mapLabels      = None;  # used in UglyMol widgets

            self.refiner        = ""     # refinement program used
            # self.refiner_params = None

        return

    def ensembleName ( self ):  # for using in phaser interface
        return "ensemble_" + self.dataId

    def setLeadXYZ ( self ):
        self.leadKey = 1
        return

    def setLeadPhases ( self ):
        self.leadKey = 2
        return

    def getMeanF ( self ):
        if self.FP is not None and self.SigFP is not None:
            return [self.FP,self.SigFP,"F"]
        return [None,None,"X"]

    def setImportMergedData ( self,dataset ):

        #if dataset.Fmean:
        #    self.FP    = dataset.Fmean.value
        #    self.SigFP = dataset.Fmean.sigma
        #if dataset.FREE:
        #    self.FreeR_flag = dataset.FREE

        if dataset.PhiFOM and len(dataset.PhiFOM) > 0:
            self.PHI, self.FOM = dataset.PhiFOM[-1]

        if dataset.ABCD and len(dataset.ABCD) > 0:
            self.HLA, self.HLB, self.HLC, self.HLD = dataset.ABCD[-1]

        if dataset.FwPhi and len(dataset.FwPhi) > 0:
            for i in range(len(dataset.FwPhi)):
                f,p = dataset.FwPhi[i]
                if f in ["FWT","2FOFCWT","parrot.F_phi.F","acorn.FWT","REFM_FWT"]:
                    self.FWT  = f
                    self.PHWT = p
                elif f in ["DELFWT","FOFCWT","REFM_DELFWT"]:
                    self.DELFWT  = f
                    self.PHDELWT = p
            #self.FWT, self.PHWT = dataset.FwPhi[-1]
            #if len(dataset.FwPhi) > 1:
            #    self.DELFWT, self.PHDELWT = dataset.FwPhi[-2]

        a, b, c, al, be, ga = dataset.DCELL
        self.xyzmeta = dict(
            cryst = dict(
                a = a,
                b = b,
                c = c,
                alpha = al,
                beta = be,
                gamma = ga,
                spaceGroup = dataset.HM
            )
        )

    def setHKLLabels ( self,hkl_class ):
        if hasattr(hkl_class.dataset,"Fmean"):
            self.FP    = hkl_class.dataset.Fmean.value
            self.SigFP = hkl_class.dataset.Fmean.sigma
        if hasattr(hkl_class.dataset,"FREE"):
            self.FreeR_flag = hkl_class.dataset.FREE
        return

    def setRefmacLabels ( self,hkl_class ):
        self.FP         = "FP"
        self.FC         = "FC_ALL_LS"
        self.SigFP      = "SIGFP"
        self.FreeR_flag = "FreeR_flag"
        if hkl_class:
            self.setHKLLabels ( hkl_class )
        self.PHI     = "PHIC_ALL_LS"
        self.FOM     = "FOM"
        self.FWT     = "FWT"
        self.PHWT    = "PHWT"
        self.DELFWT  = "DELFWT"
        self.PHDELWT = "PHDELWT"
        self.HLA     = ""
        self.HLB     = ""
        self.HLC     = ""
        self.HLD     = ""
        self.refiner = "refmac"
        return

    def removeRefmacLabels ( self ):
        self.FC      = ""
        self.PHI     = ""
        self.FOM     = ""
        self.FWT     = ""
        self.PHWT    = ""
        self.DELFWT  = ""
        self.PHDELWT = ""
        return;

    def setBusterLabels ( self,hkl_class ):
        self.FP         = "FP"
        self.FC         = "FC"
        self.SigFP      = "SIGFP"
        self.FreeR_flag = "FreeR_flag"
        if hkl_class:
            self.setHKLLabels ( hkl_class )
        self.PHI     = "PHICTR"
        self.FOM     = "FOM"
        self.FWT     = "2FOFCWT"
        self.PHWT    = "PH2FOFCWT"
        self.DELFWT  = "FOFCWT"
        self.PHDELWT = "PHFOFCWT"
        self.HLA     = ""
        self.HLB     = ""
        self.HLC     = ""
        self.HLD     = ""
        return

    def setShelxELabels ( self,struct_class ):
        self.FP      = "ShelxE.F"
        self.FC      = ""
        self.SigFP   = "ShelxE.SIGF"
        self.PHI     = "ShelxE.PHI"
        self.FOM     = "ShelxE.FOM"
        self.FWT     = "FWT"
        self.PHWT    = "PHWT"
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.HLA     = ""
        self.HLB     = ""
        self.HLC     = ""
        self.HLD     = ""
        if struct_class:
            self.FreeR_flag = struct_class.FreeR_flag
        else:
            self.FreeR_flag = "FreeR_flag"
        return

    def setPhaserEPLabels ( self,hkl_class,afterMRSAD ):
        self.FP      = "F"
        self.SigFP   = "SIGF"
        self.FreeR_flag = "FreeR_flag"
        if hkl_class:
            if hasattr(hkl_class.dataset,"Fmean"):
                self.FP    = hkl_class.dataset.Fmean.value
                self.SigFP = hkl_class.dataset.Fmean.sigma
            if hasattr(hkl_class.dataset,"FREE"):
                 self.FreeR_flag = hkl_class.dataset.FREE
        self.PHI     = "PHIB"
        self.FOM     = "FOM"
        self.FWT     = "FWT"
        self.PHWT    = "PHWT"
        self.DELFWT  = ""
        self.PHDELWT = ""
        if afterMRSAD:
            self.HLA = "HLanomA"
            self.HLB = "HLanomB"
            self.HLC = "HLanomC"
            self.HLD = "HLanomD"
        else:
            self.HLA = "HLA"
            self.HLB = "HLB"
            self.HLC = "HLC"
            self.HLD = "HLD"
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

    def setAnomMapLabels ( self,FAN,PHAN,DELFAN=None,PHDELAN=None ):
        self.FAN     = FAN
        self.PHAN    = PHAN
        self.DELFAN  = DELFAN
        self.PHDELAN = PHDELAN
        return

    def setHLLabels ( self ):
        self.HLA = "HLA"
        self.HLB = "HLB"
        self.HLC = "HLC"
        self.HLD = "HLD"
        return

    def setParrotLabels ( self ):
        self.FWT     = "parrot.F_phi.F"
        self.PHWT    = "parrot.F_phi.phi"
        self.PHI     = "parrot.Phi_fom.phi"
        self.FOM     = "parrot.Phi_fom.fom"
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.HLA     = "parrot.ABCD.A"
        self.HLB     = "parrot.ABCD.B"
        self.HLC     = "parrot.ABCD.C"
        self.HLD     = "parrot.ABCD.D"
        return

    def setAcornLabels ( self ):
        self.FWT     = "acorn.FWT"
        self.PHWT    = "acorn.PHI"
        self.PHI     = "acorn.PHI"
        self.FOM     = "acorn.FOM"
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.HLA     = ""
        self.HLB     = ""
        self.HLC     = ""
        self.HLD     = ""
        return

    def setFragonLabels ( self ):
        self.FWT     = "FWT"
        self.PHWT    = "PHIC"
        self.PHI     = "PHIC"
        self.FOM     = "FOM"
        self.DELFWT  = ""
        self.PHDELWT = ""
        self.HLA     = ""
        self.HLB     = ""
        self.HLC     = ""
        self.HLD     = ""
        return

    def setCrank2Labels ( self,hkl_class ):
        self.FP      = "REFM_F"
        self.FC      = "FC_ALL_LS"
        self.SigFP   = "REFM_SIGF"
        self.PHI     = "REFM_PHCOMB"
        self.FOM     = "REFM_FOMCOMB"
        self.FWT     = "REFM_FWT"
        self.PHWT    = "REFM_PHWT"
        self.DELFWT  = "REFM_DELFWT"
        self.PHDELWT = "REFM_PHDELWT"
        self.HLA     = "REFM_HLACOMB"
        self.HLB     = "REFM_HLBCOMB"
        self.HLC     = "REFM_HLCCOMB"
        self.HLD     = "REFM_HLDCOMB"
        self.FreeR_flag = "FREER"
        if hkl_class:
            if hasattr(hkl_class.dataset,"FREE"):
                self.FreeR_flag = hkl_class.dataset.FREE
        return

    # def setRefinerParameters ( self,params ):
    #     self.refiner_params = params
    #     return

    # def getRefinerParameters ( self ):
    #     if hasattr(self,"refiner_params"):
    #         return self.refiner_params
    #     return None

    def copyLabels ( self,struct_class ):
        self.FP      = struct_class.FP
        if hasattr(struct_class,"FC"):
            self.FC  = struct_class.FC
        else:
            self.FC  = ""
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
        self.FAN     = struct_class.FAN
        self.PHAN    = struct_class.PHAN
        self.DELFAN  = struct_class.DELFAN
        self.PHDELAN = struct_class.PHDELAN

        self.FreeR_flag = struct_class.FreeR_flag
        return

    # def copyRefinerParameters ( self,struct_class ):
    #     self.refiner_params = struct_class.getRefinerParameters()
    #     return

    def getAllLabels ( self ):
        lbl = [ self.FP    ,self.SigFP  ,self.PHI,self.FOM,self.FWT,self.PHWT,
                self.DELFWT,self.PHDELWT,self.HLA,self.HLB,self.HLC,self.HLD,
                self.FreeR_flag ]
        labels = []
        for l in lbl:
            if len(l)>0:
                labels.append ( l )
        return labels

    def getPhaseLabels ( self ):
        lbl = [ self.PHI,self.FOM,self.FWT,self.PHWT,
                self.DELFWT,self.PHDELWT,self.HLA,self.HLB,self.HLC,self.HLD ]
        labels = []
        for l in lbl:
            if (len(l)>0) and (l not in labels):
                labels.append ( l )
        return labels

    def setXYZSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeXYZ() )
        return

    def makeXYZSubtype ( self ):
        self.removeSubtype ( dtype_template.subtypeSubstructure() )
        self.addSubtype    ( dtype_template.subtypeXYZ() )
        return

    def addPhasesSubtype ( self ):
        self.addSubtype ( dtype_template.subtypePhases() )
        return

    def removePhasesSubtype ( self ):
        self.removeSubtype ( dtype_template.subtypePhases() )
        return

    def hasXYZSubtype ( self ):
        return dtype_template.subtypeXYZ() in self.subtype

    def hasPhasesSubtype ( self ):
        return dtype_template.subtypePhases() in self.subtype

    def hasSubSubtype ( self ):
        return dtype_template.subtypeSubstructure() in self.subtype

    def addLigandSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeLigands() )
        return

    def removeLigandSubtype ( self ):
        self.removeSubtype ( dtype_template.subtypeLigands() )
        return

    def hasLigandSubtype ( self ):
        return dtype_template.subtypeLigands() in self.subtype

    def addWaterSubtype ( self ):
        self.addSubtype ( dtype_template.subtypeWaters() )
        return

    def addDNASubtype ( self ):
        self.addSubtype ( dtype_template.subtypeDNA() )
        return

    def addRNASubtype ( self ):
        self.addSubtype ( dtype_template.subtypeRNA() )
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

    def isSubstructure ( self ):
        return dtype_template.subtypeSubstructure() in self.subtype
        return

    def setAnomSubstrSubtype ( self ):
        self.subtype = [dtype_template.subtypeAnomSubstr()]
        return

    def copySubtype ( self,struct_class ):
        self.subtype = struct_class.subtype
        return

    def mergeSubtypes ( self,struct_class,exclude_types=[] ):
        for t in struct_class.subtype:
            if t not in exclude_types and t not in self.subtype:
                self.subtype += [t]
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


    def getCellParameters ( self ):
        if type(self.xyzmeta) == dict:
            if "cryst" in self.xyzmeta:
                return [ self.xyzmeta["cryst"]["a"],
                         self.xyzmeta["cryst"]["b"],
                         self.xyzmeta["cryst"]["c"],
                         self.xyzmeta["cryst"]["alpha"],
                         self.xyzmeta["cryst"]["beta"],
                         self.xyzmeta["cryst"]["gamma"]
                       ]
        elif hasattr(self.xyzmeta,"cryst"):
            return [ self.xyzmeta.cryst.a,
                     self.xyzmeta.cryst.b,
                     self.xyzmeta.cryst.c,
                     self.xyzmeta.cryst.alpha,
                     self.xyzmeta.cryst.beta,
                     self.xyzmeta.cryst.gamma
                    ]
        return [0.0,0.0,0.0,0.0,0.0,0.0]


    def setXYZFile ( self,fname ):
        if fname:
            self.addSubtype ( dtype_template.subtypeXYZ() )
            if fname.upper().endswith(".PDB"):
                self.setFile ( fname,dtype_template.file_key["xyz"] )
            else:
                self.setFile ( fname,dtype_template.file_key["mmcif"] )
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

    def setCootFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["coot"] )
        return

    def setMolProbityFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["molp"] )
        return

    def getPDBFileName(self):
        return self.getFileName ( dtype_template.file_key["xyz"] )

    def getMMCIFFileName(self):
        return self.getFileName ( dtype_template.file_key["mmcif"] )

    def getReflMMCIFFileName(self):
        return self.getFileName ( dtype_template.file_key["refl-mmcif"] )

    def getSolFileName(self):
        return self.getFileName ( dtype_template.file_key["sol"] )

    def getCootFileName(self):
        return self.getFileName ( dtype_template.file_key["coot"] )

    def getMolProbityFileName(self):
        return self.getFileName ( dtype_template.file_key["molp"] )

    #def getSubFileName(self):
    #    return self.getFileName ( dtype_template.file_key["sub"] )

    def getSubFileName(self):
        return self.getFileName ( dtype_template.file_key["sub"] )

    def getMTZFileName(self):
        return self.getFileName ( dtype_template.file_key["mtz"] )

    def getHKLFileName(self):
        return self.getMTZFileName()

    def getMapFileName(self):
        return self.getFileName ( dtype_template.file_key["map"] )

    def getDMapFileName(self):
        return self.getFileName ( dtype_template.file_key["dmap"] )

    def getLibFileName(self):
        return self.getFileName ( dtype_template.file_key["lib"] )

    def getSolFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["sol"] )

    def getCootFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["coot"] )

    def getMolProbityFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["molp"] )

    def getXYZFilePath ( self,dirPath ):
        if self.getFileName(dtype_template.file_key["mmcif"]):
            return self.getFilePath ( dirPath,dtype_template.file_key["mmcif"] )
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def getPDBFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def getMMCIFFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["mmcif"] )

    def getReflMMCIFFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["refl-mmcif"] )

    def getSubFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["sub"] )

    def getMTZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["mtz"] )

    def getHKLFilePath ( self,dirPath ):
        return self.getMTZFilePath ( dirPath )

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
        self.links = getattr(struct_class,'links',[])
        self.refmacLinks = getattr(struct_class,'refmacLinks',[])
        return

    def addLigand ( self,ligCode ):
        if not ligCode in self.ligands:
            self.ligands += [ligCode]
        self.addLigandSubtype()
        return

    def setLigands ( self,ligCodes ):
        self.ligands = ligCodes
        if len(ligCodes)>0:
            self.addLigandSubtype()
        else:
            self.removeLigandSubtype()
        return

    def adjust_dname ( self ):
        if not self.getPDBFileName() and self.getSubFileName() or self.hasSubSubtype():
            self.dname = self.dname.replace ( "/structure/","/substructure/" )
        return


# ============================================================================

def getValidFileName ( mmcifFilePath,pdbFilePath,subFilePath,mtzFilePath,
                       mapFilePath,dmapFilePath,libFilePath ):
    if (mmcifFilePath):  return mmcifFilePath
    if (pdbFilePath):    return pdbFilePath
    if (subFilePath):    return subFilePath
    if (mtzFilePath):    return mtzFilePath
    if (mapFilePath):    return mapFilePath
    if (libFilePath):    return libFilePath
    return dmapFilePath


# ----------------------------------------------------------------------------

def register ( mmcifFilePath,pdbFilePath,subFilePath,mtzFilePath,mapFilePath,
               dmapFilePath,libFilePath,dataSerialNo,job_id,leadKey,outDataBox,
               outputDir,copy_files=False,map_labels=None,refiner="" ):
    fname0 = getValidFileName ( mmcifFilePath,pdbFilePath,subFilePath,mtzFilePath,
                                mapFilePath,dmapFilePath,libFilePath )
    if fname0 and os.path.isfile(fname0):
        structure = DType ( job_id )
        structure.leadKey = leadKey
        # note that, in the following line, file key may be any
        structure.setFile ( os.path.basename(fname0),dtype_template.file_key["xyz"] )
        structure.makeDName ( dataSerialNo )
        structure.removeFiles()
        structure.add_file ( mmcifFilePath,outputDir,dtype_template.file_key["mmcif"],copy_files )
        structure.add_file ( pdbFilePath  ,outputDir,dtype_template.file_key["xyz"  ],copy_files )
        structure.add_file ( subFilePath  ,outputDir,dtype_template.file_key["sub"  ],copy_files )
        structure.add_file ( mtzFilePath  ,outputDir,dtype_template.file_key["mtz"  ],copy_files )
        structure.add_file ( mapFilePath  ,outputDir,dtype_template.file_key["map"  ],copy_files )
        structure.add_file ( dmapFilePath ,outputDir,dtype_template.file_key["dmap" ],copy_files )
        structure.add_file ( libFilePath  ,outputDir,dtype_template.file_key["lib"  ],copy_files )
        if mmcifFilePath or pdbFilePath:
            structure.addSubtype ( dtype_template.subtypeXYZ() )
        if mmcifFilePath and not pdbFilePath:
            structure.addSubtype ( dtype_template.subtypeMMCIFOnly() )
        if subFilePath:
            structure.addSubtype ( dtype_template.subtypeSubstructure() )
        if outDataBox:
            outDataBox.add_data ( structure )
        structure.adjust_dname()
        structure.mapLabels = map_labels
        structure.refiner   = refiner
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
def register1 ( mmcifFilePath,pdbFilePath,subFilePath,mtzFilePath,mapFilePath,
                dmapFilePath,libFilePath,regName,dataSerialNo,job_id,leadKey,
                outDataBox,map_labels=None,refiner="" ):

    fname0 = getValidFileName ( mmcifFilePath,pdbFilePath,subFilePath,mtzFilePath,
                                mapFilePath,dmapFilePath,libFilePath )
    if fname0 and os.path.isfile(fname0):
        structure = DType   ( job_id )
        structure.leadKey = leadKey
        structure.setFile   ( regName,dtype_template.file_key["xyz"] )
        structure.makeDName ( dataSerialNo )
        structure.removeFiles()
        structure.setFile ( basename(mmcifFilePath),dtype_template.file_key["mmcif"] )
        structure.setFile ( basename(pdbFilePath  ),dtype_template.file_key["xyz"  ] )
        structure.setFile ( basename(subFilePath  ),dtype_template.file_key["sub"  ] )
        structure.setFile ( basename(mtzFilePath  ),dtype_template.file_key["mtz"  ] )
        structure.setFile ( basename(mapFilePath  ),dtype_template.file_key["map"  ] )
        structure.setFile ( basename(dmapFilePath ),dtype_template.file_key["dmap" ] )
        structure.setFile ( basename(libFilePath  ),dtype_template.file_key["lib"  ] )
        if mmcifFilePath or pdbFilePath:
            structure.addSubtype ( dtype_template.subtypeXYZ() )
        if mmcifFilePath and not pdbFilePath:
            structure.addSubtype ( dtype_template.subtypeMMCIFOnly() )
        if subFilePath:
            structure.addSubtype ( dtype_template.subtypeSubstructure() )
        if outDataBox:
            outDataBox.add_data ( structure )
        structure.adjust_dname()
        structure.mapLabels = map_labels
        structure.refiner   = refiner
        return structure

    else:
        return None;
