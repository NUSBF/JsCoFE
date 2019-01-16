##!/usr/bin/python

#
# ============================================================================
#
#    04.01.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  REVISION DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
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

spec1_list = [
    [dtype_template.subtypeAnomalous(),"anomalous"],
    [dtype_template.subtypeProtein  (),"protein"  ],
    [dtype_template.subtypeDNA      (),"dna"      ],
    [dtype_template.subtypeRNA      (),"rna"      ]
]

spec2_list = [
    [dtype_template.subtypeSubstructure(),"substructure"],
    [dtype_template.subtypeXYZ         (),"xyz"         ],
    [dtype_template.subtypePhases      (),"phases"      ]
]


class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type          = dtype()
            self.leadKey        = 0;  # data lead key: 0: undefined, 1: coordinates, 2: phases
            self.dname          = "revision"
            self.version       += 3   # versioning increments from parent to children
            self.HKL            = None
            self.ASU            = jsonut.jObject()  # asymetric unit data
            self.ASU.seq        = [];
            self.ASU.nRes       = 0;
            self.ASU.molWeight  = 0.0;
            self.ASU.solvent    = 0.0;
            self.ASU.matthews   = 0.0;
            self.ASU.prob_matth = 0.0;
            self.Structure      = None              # structure metadata
            self.Ligands        = []                # ligands metadata
            self.Options        = jsonut.jObject()  # input options used in interfaces
            self.Options.seqNo  = 0   # selected sequence number
        return

    def setLeadXYZ ( self ):
        self.leadKey = 1
        return

    def setLeadPhases ( self ):
        self.leadKey = 2
        return

    def copy ( self,prevRevision ):
        if prevRevision:
            self.subtype = []
            for t in prevRevision.subtype:
                self.subtype.append ( t )
            if prevRevision.HKL:
                self.HKL = jsonut.jObject ( prevRevision.HKL.to_JSON() )
            else:
                self.HKL = None
            self.ASU = jsonut.jObject ( prevRevision.ASU.to_JSON() )
            if prevRevision.Structure:
                self.Structure = jsonut.jObject ( prevRevision.Structure.to_JSON() )
            else:
                self.Structure = None
            self.Ligands = []
            for l in prevRevision.Ligands:
                self.Ligands.append ( l )
            self.Options = jsonut.jObject ( prevRevision.Options.to_JSON() )
        return

    def makeDataId ( self,serialNo ):
        self.dataId = str(self.jobId).zfill(4) + "." + str(serialNo).zfill(2)
        return

    """
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
    """

    def makeRevDName(self,jobId,serialNo,title):

        self.jobId = jobId
        self.makeDataId ( serialNo )
        self.dname = "R" + self.dataId + ": <i>" + title + "</i> "
        if self.HKL and self.HKL.new_spg:
            self.dname += self.HKL.new_spg + " "

        spec1 = ""
        for item in spec1_list:
            if item[0] in self.subtype:
                spec1 += item[1] + ","

        spec2  = ""
        slist2 = spec2_list;
        if self.leadKey==2:
            slist2.insert ( 0,slist2.pop() )
        first = True
        for item in slist2:
            if item[0] in self.subtype:
                if first:
                    spec2 += "<b>" + item[1] + "</b>,"
                    first  = False
                else:
                    spec2 += item[1] + ","

        if spec1:
            self.dname += "(" + spec1[:-1] + ")"
        if spec2:
            self.dname += "/" + spec2[:-1]

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
        self.removeSubtypes ([
            dtype_template.subtypeXYZ(),
            dtype_template.subtypeSubstructure(),
            dtype_template.subtypePhases()
        ])
        self.addSubtypes ( structure.subtype )
        if hasattr(self,"phaser_meta"):
            delattr ( self,"phaser_meta" )
        self.leadKey = structure.leadKey
        return

    def addLigandData ( self,ligand ):
        self.Ligands.append ( ligand )
        self.addSubtype ( dtype_template.subtypeLigands() )
        return

    #  ------------------------------------------------------------------------

    def register ( self,outDataBox ):
        outDataBox.add_data ( self )
        return
