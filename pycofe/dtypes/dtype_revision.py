##!/usr/bin/python

#
# ============================================================================
#
#    26.04.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  REVISION DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
#import sys

#  application imports
from   pycofe.dtypes import dtype_template
from   pycofe.varut  import jsonut


# ============================================================================

def dtype(): return "DataRevision"  # must coincide with data definitions in JS

class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type     = dtype()
            self.dname     = "revision"
            self.version   = 1
            self.HKL       = None
            self.ASU       = jsonut.jObject()  # asymetric unit data
            self.Structure = None              # structure metadata
            self.Ligands   = []                # ligands metadata
            self.Options   = jsonut.jObject()  # input options used in interfaces
            self.Options.seqNo = 0   # selected sequence number
        return

    def copy ( self,prevRevision ):
        if prevRevision:
            self.subtype   = prevRevision.subtype
            self.HKL       = prevRevision.HKL
            self.ASU       = prevRevision.ASU
            self.Structure = prevRevision.Structure
            self.Ligands   = prevRevision.Ligands
            self.Options   = prevRevision.Options
        return

    def makeDataId ( self,serialNo ):
        self.dataId = str(self.jobId).zfill(4) + "." + str(serialNo).zfill(2)
        return

    def makeRevDName(self,jobId,serialNo,title):
        self.jobId = jobId
        self.makeDataId ( serialNo )
        self.dname = "R" + self.dataId + ": " + title + " "
        f = False
        if dtype_template.subtypeHKL() in self.subtype:
            if self.HKL.new_spg:
                self.dname += self.HKL.new_spg + " "
            self.dname += "hkl"
            f = True
            if dtype_template.subtypeAnomalous() in self.subtype:
                self.dname += "(anomalous)"
        incl = [dtype_template.subtypeProtein(),dtype_template.subtypeDNA(),
                dtype_template.subtypeRNA()]
        asutype = ""
        for st in self.subtype:
            if st in incl:
                if asutype:  asutype += ","
                asutype += st
        excl = [dtype_template.subtypeHKL(),dtype_template.subtypeAnomalous(),
                dtype_template.subtypeSequence()] + incl
        for st in self.subtype:
            if not st in excl:
                if f:  self.dname += ","
                self.dname += st
                if st==dtype_template.subtypeASU():
                    self.dname += "(" + asutype + ")"
                f = True
        return

    #  ------------------------------------------------------------------------

    def setReflectionData ( self,hkl ):
        self.HKL = hkl     # single HKL dataset (mandatory)
        self.addSubtype ( dtype_template.subtypeHKL() )
        if hkl.isAnomalous():
            self.addSubtype ( dtype_template.subtypeAnomalous() )
        return

    def setASUData ( self,seq,nRes,molWeight,dataKey,mc1,sol1,prb1 ):
        self.ASU.seq        = seq     # list of sequences, may be empty []?
        self.addSubtype ( dtype_template.subtypeASU() )
        if len(seq)>0:
            self.addSubtype ( dtype_template.subtypeSequence() )
        for i in range(len(self.ASU.seq)):
            self.ASU.seq[i].nfind = self.ASU.seq[i].ncopies
            self.addSubtypes ( seq[i].subtype )
        self.ASU.nRes       = nRes    # total number of residues
        self.ASU.molWeight  = molWeight  # total molecular weight
        self.ASU.dataKey    = dataKey # >0: seq given, -1: defined by nRes
                                      # -2: defined by molWeight
        self.ASU.matthews   = mc1     # Matthews coefficient for 1 copy in ASU
        self.ASU.solvent    = sol1    # solvent percent (0-100) for 1 copy in ASU
        self.ASU.prob_matth = prb1    # Matthews probability for 1 copy in ASU
        return

    def setStructureData ( self,structure ):
        self.Structure = structure
        self.addSubtypes ( structure.subtype )
        return

    def addLigandData ( self,ligand ):
        self.Ligands.append ( ligand )
        self.addSubtype ( dtype_template.subtypeLigands() )
        return

    #  ------------------------------------------------------------------------

    def register ( self,outDataBox ):
        outDataBox.add_data ( self )
        return
