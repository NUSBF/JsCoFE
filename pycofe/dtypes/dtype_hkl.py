##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    11.06.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  HKL DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import xml.etree.ElementTree as ET
import traceback

#  application imports
from . import dtype_template

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
            self.version      += 1      # versioning increments from parent to children
            self.wtype         = "choose-one" # 'low-remote', 'peak', 'native', 'high-remote'
            self.ha_type       = ""     # heavy atom type
            self.f_use_mode    = "NO"   # 'NO','EDGE','ON','OFF' (Phaser-EP)
            self.f1            = ""     # amplitude shift  (Crank-2, Phaser-EP)
            self.f11           = ""     # phase shift      (Crank-2, Phaser-EP)
            self.res_low       = ""     # low  resolution limit
            self.res_high      = ""     # high resolution limit
            self.res_ref       = ""     # high resolution for refinement (Phaser-MR)
            self.wavelength    = ""     # wavelength (Phaser-EP)
            self.useForPhasing = False  # flag for native dataset in SAD/MAD (Crank-2)
            self.new_spg       = ""     # new space group for reindexing
            self.spg_alt       = "ALL"  # alternative space groups for Phaser
            self.freeRds       = None   # reference to freeR dataset
            self.useHKLSet     = "F"    # if given, forces use of F,Fpm,TI,TF (Refmac)
            self.infoTab1      = {}   # if not None, contains dictionary with info for Table 1
            self.aimless_meta  = {
                "jobId"    : 0,
                "file_xml" : None,   # reference to aimless xml file
                "file_unm" : None    # reference to aimless unmerged file
            }
        return


    def importMTZDataset ( self,mtzDataset ):

        mtzDataset.MTZ = os.path.basename(mtzDataset.MTZ)
        self.setFile ( mtzDataset.MTZ,dtype_template.file_key["mtz"] )
        self.dataset = mtzDataset

        if self.dataset.Ipm is None and self.dataset.Fpm is None:
            self.subtype = [subtypeRegular()]
        else:
            self.subtype = [subtypeAnomalous()]

        return

    def readAimlessStats ( self,aimless_xml ):
        tree = ET.parse ( aimless_xml )
        root = tree.getroot()
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

    def getCellParameters_str ( self ):
        if hasattr(self.dataset,"DCELL"):
            S = str(self.dataset.DCELL[0])
            for i in range(1,len(self.dataset.DCELL)):
                S += " " + str(self.dataset.DCELL[i])
            return S
        return ""


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


    def getFreeRColumn ( self ):
        return self.getMeta ( "FREE","" )


    def getColumnNames ( self,sep=" ",includeFreeR=True ):
        cols = self.getMeta ( "Imean.value"    ,"" ) + sep + \
               self.getMeta ( "Imean.sigma"    ,"" ) + sep + \
               self.getMeta ( "Fmean.value"    ,"" ) + sep + \
               self.getMeta ( "Fmean.sigma"    ,"" ) + sep + \
               self.getMeta ( "Ipm.plus.value" ,"" ) + sep + \
               self.getMeta ( "Ipm.plus.sigma" ,"" ) + sep + \
               self.getMeta ( "Ipm.minus.value","" ) + sep + \
               self.getMeta ( "Ipm.minus.sigma","" ) + sep + \
               self.getMeta ( "Fpm.plus.value" ,"" ) + sep + \
               self.getMeta ( "Fpm.plus.sigma" ,"" ) + sep + \
               self.getMeta ( "Fpm.minus.value","" ) + sep + \
               self.getMeta ( "Fpm.minus.sigma","" )
        if includeFreeR:
            cols += sep + self.getMeta ( "FREE","" )
        return cols


    def hasIntensities ( self ):
        if hasattr(self.dataset,"Imean") and self.dataset.Imean is not None:
            return True
        if hasattr(self.dataset,"Ipm") and self.dataset.Ipm is not None:
            return True
        return False

    def hasMeanIntensities ( self ):
        if hasattr(self.dataset,"Imean") and self.dataset.Imean is not None:
            return True
        return False


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


    def getMeanI ( self ):
        if hasattr(self.dataset,"Imean"):
            if self.dataset.Imean is not None:
                return [self.dataset.Imean.value,self.dataset.Imean.sigma,"I"]
        return [None,None,"X"]

    def getMeanF ( self ):
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

        if dtype_template.file_key["mtz"] in self.files:
            fname = os.path.splitext(self.files[dtype_template.file_key["mtz"]])[0]
            if serialNo > 0:
                self.dname = "[" + self.dataId + "] " + fname
            else:
                self.dname = self.files[dtype_template.file_key["mtz"]]
            self.dname += " [" + self.getDataSetName() + "] /hkl/"

        if subtypeAnomalous() in self.subtype:
            self.dname += "anom/"
            if not hasattr(self.dataset,"Ipm"):
                self.dname += "ampl/"
        else:
            if not hasattr(self.dataset,"Imean"):
                self.dname += "ampl/"

        return


    def getHKLFileName ( self ):
        return self.getFileName ( dtype_template.file_key["mtz"] )

    def getHKLFilePath ( self,dirPath ):
        return  self.getFilePath ( dirPath,dtype_template.file_key["mtz"] )


    def readAimlessInfoTab1(self, aimless_xml):
        # initialises self.infoTab1 with aimless data.
        # ctruncate initialisation will be run first during import of the merged dataset even from aimless task
        # WilsonB comes from ctruncate

        try:
            if not type(self.infoTab1) is dict:
                self.infoTab1 = {}
            xmlRoot = ET.parse(aimless_xml).getroot()
            dataset = xmlRoot.find('Result').find('Dataset')
            self.infoTab1['ResolutionLow'] = float(dataset.find('ResolutionLow').find('Overall').text.strip())
            self.infoTab1['ResolutionHigh'] = float(dataset.find('ResolutionHigh').find('Overall').text.strip())

            self.infoTab1['ResolutionLowO'] = float(dataset.find('ResolutionLow').find('Outer').text.strip())
            self.infoTab1['ResolutionHighO'] = float(dataset.find('ResolutionHigh').find('Outer').text.strip())

            self.infoTab1['TotalReflections'] = int(dataset.find('NumberObservations').find('Overall').text.strip())
            self.infoTab1['TotalReflectionsO'] = int(dataset.find('NumberObservations').find('Outer').text.strip())

            self.infoTab1['UniqueReflections'] = int(dataset.find('NumberReflections').find('Overall').text.strip())
            self.infoTab1['UniqueReflectionsO'] = int(dataset.find('NumberReflections').find('Outer').text.strip())

            self.infoTab1['Multiplicity'] = float(dataset.find('Multiplicity').find('Overall').text.strip())
            self.infoTab1['MultiplicityO'] = float(dataset.find('Multiplicity').find('Outer').text.strip())

            self.infoTab1['Completeness'] = float(dataset.find('Completeness').find('Overall').text.strip())
            self.infoTab1['CompletenessO'] = float(dataset.find('Completeness').find('Outer').text.strip())

            self.infoTab1['meanIsigI'] = float(dataset.find('MeanIoverSD').find('Overall').text.strip())
            self.infoTab1['meanIsigIO'] = float(dataset.find('MeanIoverSD').find('Outer').text.strip())

            self.infoTab1['Rmerge'] = float(dataset.find('RmergeOverall').find('Overall').text.strip())
            self.infoTab1['RmergeO'] = float(dataset.find('RmergeOverall').find('Outer').text.strip())

            self.infoTab1['Rmeas'] = float(dataset.find('RmeasOverall').find('Overall').text.strip())
            self.infoTab1['RmeasO'] = float(dataset.find('RmeasOverall').find('Outer').text.strip())

            self.infoTab1['Rpim'] = float(dataset.find('RpimOverall').find('Overall').text.strip())
            self.infoTab1['RpimO'] = float(dataset.find('RpimOverall').find('Outer').text.strip())

            self.infoTab1['CChalf'] = float(dataset.find('CChalf').find('Overall').text.strip())
            self.infoTab1['CChalfO'] = float(dataset.find('CChalf').find('Outer').text.strip())

            self.infoTab1['Wavelength'] = float(xmlRoot.find('ReflectionData').find('Dataset').find('Wavelength').text.strip())

        except Exception as inst:
            return
            # if not type(self.infoTab1) is dict:
            #     self.infoTab1 = {}
            # self.infoTab1['error'] = (str(type(inst))+ '\n')  # the exception instance
            # self.infoTab1['error'] += (str(inst.args)+ '\n')  # arguments stored in .args
            # self.infoTab1['error'] += (str(inst)+ '\n')  # __str__ allows args to be printed directly,
            # tb = traceback.format_exc()
            # self.infoTab1['error'] += tb + '\n\n'

        return

    def readCtruncateInfoTab1(self, ctruncate_xml):
        # initialises self.infoFig1
        # ctruncate initialisation will be run first during import of the merged dataset even from aimless task
        # WilsonB comes from ctruncate
        try:
            if not type(self.infoTab1) is dict:
                self.infoTab1 = {}
            xmlRoot = ET.parse(ctruncate_xml).getroot()

            if 'WilsonB' not in self.infoTab1.keys():
                self.infoTab1['WilsonB'] = float(xmlRoot.findall('DataStatistics')[2].find('WilsonB').text.strip())

            if 'ResolutionLow' not in self.infoTab1.keys():
                self.infoTab1['ResolutionLow'] = float(xmlRoot.find('ReflectionData').find('ResolutionLow').text.strip())
            if 'ResolutionHigh' not in self.infoTab1.keys():
                self.infoTab1['ResolutionHigh'] = float(xmlRoot.find('ReflectionData').find('ResolutionHigh').text.strip())

            if 'ResolutionLowO' not in self.infoTab1.keys():
                self.infoTab1['ResolutionLowO'] = 0.0
            if 'ResolutionHighO' not in self.infoTab1.keys():
                self.infoTab1['ResolutionHighO'] = 0.0

            if 'TotalReflections' not in self.infoTab1.keys():
                self.infoTab1['TotalReflections'] = int(xmlRoot.find('ReflectionData').find('NumberObservations').text.strip())
            if 'TotalReflectionsO' not in self.infoTab1.keys():
                self.infoTab1['TotalReflectionsO'] = 0

            if 'UniqueReflections' not in self.infoTab1.keys():
                self.infoTab1['UniqueReflections'] = int(xmlRoot.find('ReflectionData').find('NumberReflections').text.strip())
            if 'UniqueReflectionsO' not in self.infoTab1.keys():
                self.infoTab1['UniqueReflectionsO'] = 0

            if 'Multiplicity' not in self.infoTab1.keys():
                self.infoTab1['Multiplicity'] = 0.0
            if 'MultiplicityO' not in self.infoTab1.keys():
                self.infoTab1['MultiplicityO'] = 0.0

            if 'Completeness' not in self.infoTab1.keys():
                self.infoTab1['Completeness'] = 0.0
            if 'CompletenessO' not in self.infoTab1.keys():
                self.infoTab1['CompletenessO'] = 0.0

            if 'meanIsigI' not in self.infoTab1.keys():
                self.infoTab1['meanIsigI'] = 0.0
            if 'meanIsigIO' not in self.infoTab1.keys():
                self.infoTab1['meanIsigIO'] = 0.0

            if 'Rmerge' not in self.infoTab1.keys():
                self.infoTab1['Rmerge'] = 0.0
            if 'RmergeO' not in self.infoTab1.keys():
                self.infoTab1['RmergeO'] = 0.0

            if 'Rmeas' not in self.infoTab1.keys():
                self.infoTab1['Rmeas'] = 0.0
            if 'RmeasO' not in self.infoTab1.keys():
                self.infoTab1['RmeasO'] = 0.0

            if 'Rpim' not in self.infoTab1.keys():
                self.infoTab1['Rpim'] = 0.0
            if 'RpimO' not in self.infoTab1.keys():
                self.infoTab1['RpimO'] = 0.0

            if 'CChalf' not in self.infoTab1.keys():
                self.infoTab1['CChalf'] = 0.0
            if 'CChalfO' not in self.infoTab1.keys():
                self.infoTab1['CChalfO'] = 0.0

            if 'Wavelength' not in self.infoTab1.keys():
                self.infoTab1['Wavelength'] = 0.0

        except Exception as inst:
            if not type(self.infoTab1) is dict:
                self.infoTab1 = {}
            self.infoTab1['error'] = (str(type(inst))+ '\n')  # the exception instance
            self.infoTab1['error'] += (str(inst.args)+ '\n')  # arguments stored in .args
            self.infoTab1['error'] += (str(inst)+ '\n')  # __str__ allows args to be printed directly,
            tb = traceback.format_exc()
            self.infoTab1['error'] += tb + '\n\n'

        return



def register ( mtzFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(mtzFilePath):
        hkl = DType(job_id)
        fname = os.path.basename(mtzFilePath)
        hkl.setFile ( fname,dtype_template.file_key["mtz"] )
        hkl.makeDName ( dataSerialNo )
        newFileName = hkl.dataId + "_" + fname
        hkl.setFile   ( newFileName,dtype_template.file_key["mtz"] )
        outDataBox.add_data ( hkl )
        os.rename ( mtzFilePath, os.path.join(outputDir,newFileName) )
        return hkl
    else:
        return None;
