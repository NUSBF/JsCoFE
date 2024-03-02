##!/usr/bin/python

#
# ============================================================================
#
#    15.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MR MODEL DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from pycofe.dtypes import dtype_template, dtype_xyz
from pycofe.proc   import xyzmeta

# ============================================================================

def dtype(): return "DataModel"  # must coincide with data definitions in JS

class DType(dtype_xyz.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "model"
            self.version  = 3
            self.sequence = None    # associated sequence class;
                                    #   self.files[file_key["xyz"]]  - model file
                                    #   self.files[file_key["seq"]]  - sequence file
            self.ncopies  = 1       # number of copies in ASU to look for in MR
            self.nModels  = 1       # number of MR models in model
            self.simtype  = "seqid" # target similarity type 'seqid' or 'rmsd'
            self.rmsd     = ""      # estimate of model dispersion
            self.seqId    = "";     # estimate of model homology
            self.seqrem   = False   # True if phaser sequence remark is in xyz file
            self.xyzmeta  = {}
            self.meta     = None    # Gesamt alignment results
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

    # def setXYZFile ( self,fname ):
    #     if fname:
    #         if fname.upper().endswith(".PDB"):
    #             self.setFile ( fname,dtype_template.file_key["xyz"] )
    #         else:
    #             self.setFile ( fname,dtype_template.file_key["mmcif"] )
    #     return

    def setSeqFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["seq"] )
        return

    def getPDBFileName(self):
        return self.getFileName ( dtype_template.file_key["xyz"] )

    def getSeqFileName(self):
        return self.getFileName ( dtype_template.file_key["seq"] )

    def getPDBFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["xyz"] )

    def getSeqFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["seq"] )

    def register ( self,modelFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
        self.jobId = job_id
        self.files = vars(self.files)  # convert to dictionary
        fname = self.lessDataId ( os.path.basename(modelFilePath) )
        self.setXYZFile ( fname )
        self.makeDName ( dataSerialNo )
        newFileName = self.dataId + "_" + fname
        self.setXYZFile ( newFileName )
        if outDataBox:
            outDataBox.add_data ( self )
        os.rename ( modelFilePath, os.path.join(outputDir,newFileName) )
        if self.meta:
            self.meta = vars(self.meta)
        return



def register ( sequence,modelFilePath,dataSerialNo,job_id,outDataBox,outputDir ):
    if os.path.isfile(modelFilePath):
        model = DType ( job_id )
        fname = model.lessDataId ( os.path.basename(modelFilePath) )
        model.setXYZFile ( fname )
        if sequence:
            if type(sequence) == list:
                model.addSubtypes ( sequence )
            elif type(sequence) == str:
                model.setSubtype  ( sequence )
            else:
                model.putSequence ( sequence )
        model.makeDName ( dataSerialNo )
        newFileName = model.dataId + "_" + fname
        model.setXYZFile ( newFileName )
        if outDataBox:
            outDataBox.add_data ( model )
        os.rename ( modelFilePath, os.path.join(outputDir,newFileName) )
        return model
    else:
        return None
