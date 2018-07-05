##!/usr/bin/python

#
# ============================================================================
#
#    01.12.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ (COORDINATES) DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
import dtype_template
from   pycofe.proc import xyzmeta


# ============================================================================

def dtype(): return "DataXYZ"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "xyz"
            self.xyzmeta  = {}
            self.exclLigs = ['(agents)']  # list of excluded ligands for PISA
            self.selChain = '(all)'       # selected chains for comparison
            self.version  = 1  # from 01.12.2017
        return

    def getXYZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,0 )

    def putXYZMeta ( self,fdir,file_stdout,file_stderr,log_parser=None ):
        setXYZMeta ( self,xyzmeta.getXYZMeta ( os.path.join(fdir,self.files[0]),
                                        file_stdout,file_stderr,log_parser ) )
        return


def setXYZMeta ( data_class,xyz_meta ):
    data_class.xyzmeta = xyz_meta
    if type(data_class.xyzmeta) == dict:
        xyz = data_class.xyzmeta["xyz"]
        for i in range(len(xyz)):
            chains = xyz[i]["chains"]
            for j in range(len(chains)):
                t = chains[j]["type"]
                if t=="Protein":
                    data_class.addSubtype ( dtype_template.subtypeProtein() )
                elif t=="DNA":
                    data_class.addSubtype ( dtype_template.subtypeDNA() )
                elif t=="RNA":
                    data_class.addSubtype ( dtype_template.subtypeRNA() )
    else:
        xyz = data_class.xyzmeta.xyz
        for i in range(len(xyz)):
            chains = xyz[i].chains
            for j in range(len(chains)):
                t = chains[j].type
                if t=="Protein":
                    data_class.addSubtype ( dtype_template.subtypeProtein() )
                elif t=="DNA":
                    data_class.addSubtype ( dtype_template.subtypeDNA() )
                elif t=="RNA":
                    data_class.addSubtype ( dtype_template.subtypeRNA() )

    return


def register ( xyzFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(xyzFilePath):
        xyz   = DType   ( job_id )
        fname = os.path.basename(xyzFilePath)
        xyz.setFile   ( fname  )
        xyz.makeDName ( dataSerialNo )
        newFileName = xyz.dataId + "_" + fname
        xyz.setFile   ( newFileName )
        if outDataBox:
            outDataBox.add_data ( xyz )
        os.rename ( xyzFilePath, os.path.join(outputDir,newFileName) )
        return xyz
    else:
        return None
