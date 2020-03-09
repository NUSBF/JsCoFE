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
            self.version  = 3
            self.sequence = None    # associated sequence class;
                                    #   self.files[file_key["xyz"]]  - ensemble file
                                    #   self.files[file_key["seq"]]  - sequence file
            self.ncopies  = 1       # number of copies in ASU to look for in MR
            self.nModels  = 1       # number of MR models in ensemble
            self.simtype  = "seqid" # target similarity type 'seqid' or 'rmsd'
            self.rmsd     = ""      # estimate of ensemble dispersion
            self.seqId    = "";     # estimate of ensemble homology
            self.seqrem   = False   # True if phaser sequence remark is in xyz file
            self.xyzmeta  = {}
            self.meta     = None  # Gesamt alignment results
        return

    def ensembleName ( self ):  # for using in phaser interface
        return "ensemble_" + self.dataId

    def putXYZMeta ( self,fdir,file_stdout,file_stderr,log_parser=None ):
        dtype_xyz.setXYZMeta ( self,xyzmeta.getXYZMeta (
                    os.path.join(fdir,self.files[dtype_template.file_key["xyz"]]),
                    file_stdout,file_stderr,log_parser ) )
        return

    def putSequence ( self,sequence ):
        self.sequence = sequence
        self.setFile ( sequence.getSeqFileName(),dtype_template.file_key["seq"] )
        self.addSubtypes ( sequence.subtype )
        return

    def setXYZFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["xyz"] )
        return

    def setSeqFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["seq"] )
        return

    def getXYZFileName(self):
        return self.getFileName ( dtype_template.file_key["xyz"] )

    def getSeqFileName(self):
        return self.getFileName ( dtype_template.file_key["seq"] )

    def getXYZFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def getSeqFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["seq"] )


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
