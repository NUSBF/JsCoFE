##!/usr/bin/python

#
# ============================================================================
#
#    03.02.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  REVISION DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
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
    [dtype_template.subtypeAnomalous(),"anom"    ],
    [dtype_template.subtypeProtein  (),"protein" ],
    [dtype_template.subtypeDNA      (),"dna"     ],
    [dtype_template.subtypeRNA      (),"rna"     ]
]

spec21_list = [
    [dtype_template.subtypeXYZ         (),"xyz"          ],
    [dtype_template.subtypeSubstructure(),"substructure" ],
    [dtype_template.subtypePhases      (),"phases"       ]
]

spec22_list = [
    [dtype_template.subtypeSubstructure(),"substructure" ],
    [dtype_template.subtypeXYZ         (),"xyz"          ],
    [dtype_template.subtypePhases      (),"phases"       ]
]

spec3_list = [
    [dtype_template.subtypePhases      (),"phases"       ],
    [dtype_template.subtypeSubstructure(),"substructure" ],
    [dtype_template.subtypeXYZ         (),"xyz"          ]
]


class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type          = dtype()
            self.leadKey        = 0;  # data lead key: 0: undefined, 1: coordinates, 2: phases
            self.dname          = "revision"
            self.version       += 5   # versioning increments from parent to children
            self.HKL            = None
            self.ASU            = jsonut.jObject()  # asymetric unit data
            self.ASU.jobNo      = 0                 # producing job number
            self.ASU.seq        = []
            self.ASU.ha_type    = ""                # heavy atom type
            self.ASU.ndisulph   = ""                # number of disulphides
            self.ASU.nRes       = 0;
            self.ASU.molWeight  = 0.0;
            self.ASU.solvent    = 0.0;
            self.ASU.matthews   = 0.0;
            self.ASU.prob_matth = 0.0;
            self.Structure      = None              # structure metadata
            self.Substructure   = None              # substructure metadata
            self.Ligands        = []                # ligands metadata
            self.Options        = jsonut.jObject()  # input options used in interfaces
            self.Options.seqNo             = 0              # selected sequence number
            self.Options.leading_structure = ""             # substructure or structure
            self.Options.mr_type           = "refl",        # {refl|sph|subsph} mr type for molrep/phaser-mr
            self.Options.ds_protocol       = "N",           # density search protocol for molrep
            self.Options.phasing_sel       = "substructure" # for phaser-ep
            self.Options.structure_sel     = "fixed-model"  # for mr-phases -- to delete
            self.Options.ncsmodel_sel      = "do-not-use"   # for parrot
            self.Options.load_all          = False          # for Coot-MB
            self.Options.useSubstruct      = False          # for Modelcraft
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
            if prevRevision.Substructure:
                self.Substructure = jsonut.jObject ( prevRevision.Substructure.to_JSON() )
            else:
                self.Substructure = None
            self.Ligands = []
            for l in prevRevision.Ligands:
                self.Ligands.append ( l )
            self.Options = jsonut.jObject ( prevRevision.Options.to_JSON() )
        return

    def makeDataId ( self,serialNo ):
        self.dataId = str(self.jobId).zfill(4) + "." + str(serialNo).zfill(2)
        return

    def makeRevDName ( self,jobId,serialNo,title ):

        self.jobId = jobId
        self.makeDataId ( serialNo )
        self.dname = "R" + self.dataId + ": <i>" + title + "</i> "
        if self.HKL and self.HKL.new_spg:
            self.dname += self.HKL.new_spg + " "

        spec1 = ""
        for item in spec1_list:
            if item[0] in self.subtype:
                if item[1]!=dtype_template.subtypeRegular():
                    spec1 += item[1] + ","

        spec2  = ""
        slist2 = spec21_list
        if self.leadKey==2:
            slist2 = spec3_list
            #slist2.insert ( 0,slist2.pop() )
        elif getattr(self.Options,"leading_structure","*")=="substructure":
            slist2 = spec22_list

        first = True
        for item in slist2:
            if item[0] in self.subtype:
                if item[1]!=dtype_template.subtypeRegular():
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
        else:
            self.removeSubtype ( dtype_template.subtypeAnomalous() )
        return

    def setASUData ( self,jobId,seq,nRes,molWeight,dataKey,mc1,sol1,prb1 ):
        self.ASU.jobNo = jobId
        self.ASU.seq   = seq     # list of sequences, may be empty []?
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

    def isASUData ( self ):
        return (len(self.ASU.seq)>0) or (self.ASU.nRes>0) or (self.ASU.molWeight>0.0)

    def addProteinType ( self ):
        self.addSubtype ( dtype_template.subtypeProtein() )
        return

    def addDNAType ( self ):
        self.addSubtype ( dtype_template.subtypeDNA() )
        return

    def addRNAType ( self ):
        self.addSubtype ( dtype_template.subtypeRNA() )
        return

    def hasProteinType ( self ):
        return dtype_template.subtypeProtein() in self.subtype

    def hasDNAType ( self ):
        return dtype_template.subtypeDNA() in self.subtype

    def hasRNAType ( self ):
        return dtype_template.subtypeRNA() in self.subtype


    def getNofASUMonomers ( self ):
        n = 0
        if self.ASU:
            for i in range(len(self.ASU.seq)):
                n += self.ASU.seq[i].ncopies
            n = max(1,n)
        return n


    def getResComposition ( self ):

        composition = {
            "nchains" : 0,
            "total"   : 0,
            "protein" : 0,
            "rna"     : 0,
            "dna"     : 0,
            "ligands" : 0,
            "waters"  : 0
        }

        if self.ASU:
            composition["nchains"] = len(self.ASU.seq)
            if len(self.ASU.seq)>0:
                for i in range(len(self.ASU.seq)):
                    nr = self.ASU.seq[i].ncopies*self.ASU.seq[i].size
                    composition["total"] += nr
                    if dtype_template.subtypeProtein() in self.ASU.seq[i].subtype:
                        composition["protein"] += nr
                    elif dtype_template.subtypeRNA() in self.ASU.seq[i].subtype:
                        composition["rna"] += nr
                    elif dtype_template.subtypeDNA() in self.ASU.seq[i].subtype:
                        composition["dna"] += nr
                    elif dtype_template.subtypeLigands() in self.ASU.seq[i].subtype:
                        composition["ligands"] += nr
                    elif dtype_template.subtypeWaters() in self.ASU.seq[i].subtype:
                        composition["waters"] += nr
            else:
                composition["total"] = self.ASU.nRes
            
        return composition


    def setStructureData ( self,structure ):
        if structure:
            if structure.hasSubSubtype():
                self.Substructure = structure
                self.Options.leading_structure = "substructure"
            else:
                self.Structure = structure
                self.Options.leading_structure = "structure"
            self.removeSubtypes ([
                dtype_template.subtypeXYZ(),
                dtype_template.subtypeSubstructure(),
                dtype_template.subtypePhases()
            ])
            if self.Structure:
                self.addSubtypes ( self.Structure.subtype )
            if self.Substructure:
                self.addSubtypes ( self.Substructure.subtype )
            if hasattr(self,"phaser_meta"):
                delattr ( self,"phaser_meta" )
            self.leadKey = structure.leadKey
        return


    def removeStructure ( self ):
        if self.Structure:
            self.Structure = None
            self.removeSubtypes ([
                dtype_template.subtypeXYZ(),
                dtype_template.subtypePhases()
            ])
            if self.Substructure:
                self.leadKey = self.Substructure.leadKey
                self.Options.leading_structure = "substructure"
            else:
                self.leadKey = 0;  # data lead key: 0: undefined, 1: coordinates, 2: phases
                self.Options.leading_structure = ""
        return

    def getNofPolymers ( self ):
        if self.Structure:
            return self.Structure.getNofPolymers()
        return 0


    def addLigandData ( self,ligand ):
        self.Ligands.append ( ligand )
        self.addSubtype ( dtype_template.subtypeLigands() )
        return

    #  ------------------------------------------------------------------------

    def register ( self,outDataBox ):
        outDataBox.add_data ( self )
        return
