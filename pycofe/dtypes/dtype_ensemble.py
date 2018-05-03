##!/usr/bin/python

#
# ============================================================================
#
#    01.12.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from pycofe.dtypes import dtype_template, dtype_xyz
from pycofe.proc   import xyzmeta

# ============================================================================

def dtype(): return "DataEnsemble"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "ensemble"
            self.version  = 1
            self.sequence = None  # associated sequence class;
                                  #   self.files[0]  - ensemble file
                                  #   self.files[1]  - sequence file
            self.ncopies  = 1     # number of copies in ASU to look for in MR
            self.nModels  = 1     # number of MR models in ensemble
            self.rmsd     = 1.0   # estimate of ensemble dispersion
            self.xyzmeta  = {}
            self.meta     = None  # Gesamt alignment results
        return

    def putXYZMeta ( self,fdir,file_stdout,file_stderr,log_parser=None ):
        dtype_xyz.setXYZMeta ( self,xyzmeta.getXYZMeta (
                                        os.path.join(fdir,self.files[0]),
                                            file_stdout,file_stderr,log_parser ) )
        return

    def putSequence ( self,sequence ):
        self.sequence = sequence
        self.files   += [sequence.files[0]]
        self.addSubtypes ( sequence.subtype )
        return


def register ( sequence,ensembleFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(ensembleFilePath):
        ensemble = DType ( job_id )
        fname    = os.path.basename(ensembleFilePath)
        ensemble.setFile ( fname  )
        if type(sequence) == list:
            ensemble.addSubtypes ( sequence )
        elif type(sequence) == str:
            ensemble.setSubtype  ( sequence )
        else:
            ensemble.putSequence ( sequence )
        ensemble.makeDName ( dataSerialNo )
        if not fname.startswith(ensemble.dataId):
            newFileName = ensemble.dataId + "_" + fname
            ensemble.setFile   ( newFileName  )
        else:
            newFileName = fname
        if outDataBox:
            outDataBox.add_data ( ensemble )
        os.rename ( ensembleFilePath, os.path.join(outputDir,newFileName) )
        return ensemble
    else:
        return None;
