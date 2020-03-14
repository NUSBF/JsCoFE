##!/usr/bin/python

#
# ============================================================================
#
#    08.03.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from pycofe.dtypes import dtype_model
from pycofe.proc   import xyzmeta

# ============================================================================

def dtype(): return "DataEnsemble"  # must coincide with data definitions in JS

class DType(dtype_model.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type = dtype()
            self.dname = "ensemble"
        return

    def ensembleName ( self ):  # for using in phaser interface
        return "ensemble_" + self.dataId


def register ( sequence,ensembleFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(ensembleFilePath):
        ensemble = DType ( job_id )
        fname    = ensemble.lessDataId ( os.path.basename(ensembleFilePath) )
        ensemble.setXYZFile ( fname )
        if type(sequence) == list:
            ensemble.addSubtypes ( sequence )
        elif type(sequence) == str:
            ensemble.setSubtype  ( sequence )
        else:
            ensemble.putSequence ( sequence )
        ensemble.makeDName ( dataSerialNo )
        newFileName = ensemble.dataId + "_" + fname
        ensemble.setXYZFile ( newFileName )
        if outDataBox:
            outDataBox.add_data ( ensemble )
        os.rename ( ensembleFilePath, os.path.join(outputDir,newFileName) )
        return ensemble
    else:
        return None;
