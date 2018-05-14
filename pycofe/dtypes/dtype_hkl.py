##!/usr/bin/python

#
# ============================================================================
#
#    10.11.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  HKL DATA TYPE
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

def dtype(): return "DataHKL"  # must coincide with data definitions in JS
def subtypeRegular  (): return "regular"
def subtypeAnomalous(): return "anomalous"

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type         = dtype()
            self.dname         = "hkl"
            self.version       = 2
            self.wtype         = "peak" # 'low-remote', 'peak', 'native', 'high-remote'
            self.f_use_mode    = "NO"   # 'NO','EDGE','ON','OFF' (Phaser-EP)
            self.f1            = ""     # amplitude shift  (Crank-2, Phaser-EP)
            self.f11           = ""     # phase shift      (Crank-2, Phaser-EP)
            self.res_low       = ""     # low  resolution limit
            self.res_high      = ""     # high resolution limit
            self.res_ref       = ""     # high resolution for refinement (Phaser-MR)
            self.wavelength    = ""     # wavelength (Phaser-EP)
            self.anomAtomType  = ""     # anomalous scattering type
            self.useForPhasing = False  # flag for native dataset in SAD/MAD (Crank-2)
            self.new_spg       = ""     # new space group for reindexing
            self.spg_alt       = ""     # alternative space groups for Phaser
            self.freeRds       = None   # reference to freeR dataset
            #self.useHKLSet     = "auto" # if given, forces use of F,I,Fpm,Ipm (Refmac)
            self.useHKLSet     = 'F';   # if given, forces use of F,Fpm,TI,TF (Refmac)
        return


    def importMTZDataset ( self,mtzDataset ):

        mtzDataset.MTZ = os.path.basename(mtzDataset.MTZ)
        self.setFile ( mtzDataset.MTZ )
        self.dataset = mtzDataset

        if self.dataset.Ipm is None and self.dataset.Fpm is None:
            self.subtype = [subtypeRegular()]
        else:
            self.subtype = [subtypeAnomalous()]

        return

    def isAnomalous(self):
        return subtypeAnomalous() in self.subtype

    def getMeta ( self,field,defvalue ):
        p   = field.split(".")
        obj = self.dataset
        for i in range(len(p)):
            obj = getattr ( obj,p[i],defvalue )
            if obj == defvalue or obj == None:
                return defvalue
        return obj


    def getSpaceGroup ( self ):
        return self.getMeta ( "HM","Unspecified" )

    def getWavelength ( self ):
        return self.getMeta ( "DWAVEL","0.0" )


    def getCellParameters ( self ):
        if hasattr(self.dataset,"DCELL"):
            return self.dataset.DCELL
        return [0.0,0.0,0.0,0.0,0.0,0.0]


    def getDataSetName ( self ):
        return self.getMeta ( "PROJECT","unk" ) + "/" + \
               self.getMeta ( "CRYSTAL","unk" ) + "/" + \
               self.getMeta ( "DATASET","unk" )


    def getLowResolution ( self, raw=False ):
        if hasattr(self.dataset,"RESO"):
            if raw:
                return self.dataset.RESO[0]
            else:
                return "{0:.2f}".format(self.dataset.RESO[0])
        elif raw:
            return None
        else:
            return "not given"


    def getHighResolution ( self, raw=False ):
        if hasattr(self.dataset,"RESO"):
            if raw:
                return self.dataset.RESO[1]
            else:
                return "{0:.2f}".format(self.dataset.RESO[1])
        elif raw:
            return None
        else:
            return "not given"


    def getColumnNames ( self ):
        return self.getMeta ( "Imean.value"    ,"" ) + " " + \
               self.getMeta ( "Imean.sigma"    ,"" ) + " " + \
               self.getMeta ( "Fmean.value"    ,"" ) + " " + \
               self.getMeta ( "Fmean.sigma"    ,"" ) + " " + \
               self.getMeta ( "Ipm.plus.value" ,"" ) + " " + \
               self.getMeta ( "Ipm.plus.sigma" ,"" ) + " " + \
               self.getMeta ( "Ipm.minus.value","" ) + " " + \
               self.getMeta ( "Ipm.minus.sigma","" ) + " " + \
               self.getMeta ( "Fpm.plus.value" ,"" ) + " " + \
               self.getMeta ( "Fpm.plus.sigma" ,"" ) + " " + \
               self.getMeta ( "Fpm.minus.value","" ) + " " + \
               self.getMeta ( "Fpm.minus.sigma","" ) + " " + \
               self.getMeta ( "FREE"           ,"" )


    def getMeanColumns ( self ):
        #  returns column names as either
        #       [Imean,sigImean,"I"]   or
        #       [Fmean,sigFmean,"F"]   or
        #       [None,None,"X"]
        if hasattr(self.dataset,"Imean"):
            if self.dataset.Imean is not None:
                return [self.dataset.Imean.value,self.dataset.Imean.sigma,"I"]
        if hasattr(self.dataset,"Fmean"):
            if self.dataset.Fmean is not None:
                return [self.dataset.Fmean.value,self.dataset.Fmean.sigma,"F"]
        return [None,None,"X"]


    def getAnomalousColumns ( self ):
        #  returns column names as either
        #       [I+,sigI+,I-,sigI-,"I"]   or
        #       [F+,sigF+,F-,sigF-,"F"]   or
        #       [None,None,None,None,"X"]
        cols = None
        if hasattr(self.dataset,"Ipm"):
            if self.dataset.Ipm is not None:
                if self.dataset.Ipm.plus is not None and self.dataset.Ipm.minus is not None:
                    cols = [self.dataset.Ipm.plus.value ,self.dataset.Ipm.plus.sigma,
                            self.dataset.Ipm.minus.value,self.dataset.Ipm.minus.sigma,
                            "I"]

        if cols is None and hasattr(self.dataset,"Fpm"):
            if self.dataset.Fpm is not None:
                if self.dataset.Fpm.plus is not None and self.dataset.Fpm.minus is not None:
                    cols = [self.dataset.Fpm.plus.value ,self.dataset.Fpm.plus.sigma,
                            self.dataset.Fpm.minus.value,self.dataset.Fpm.minus.sigma,
                            "F"]

        if cols is None:
            cols = [None,None,None,None,"X"]

        return cols


    def makeDName ( self,serialNo ):

        if serialNo > 0:
            self.makeDataId ( serialNo )

        if len(self.files) > 0:
            fname = os.path.splitext(self.files[0])[0]
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = self.files[0]
            self.dname += " [" + self.getDataSetName() + "] /hkl/"

        if subtypeAnomalous() in self.subtype:
            self.dname += "anom/"
            if not hasattr(self.dataset,"Ipm"):
                self.dname += "ampl/"
        else:
            if not hasattr(self.dataset,"Imean"):
                self.dname += "ampl/"

        return


def register ( mtzFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(mtzFilePath):
        hkl = DType(job_id)
        fname = os.path.basename(mtzFilePath)
        hkl.setFile(fname)
        hkl.makeDName ( dataSerialNo )
        newFileName = hkl.dataId + "_" + fname
        hkl.setFile   ( newFileName )
        outDataBox.add_data ( hkl )
        os.rename ( mtzFilePath, os.path.join(outputDir,newFileName) )
        return hkl
    else:
        return None;
