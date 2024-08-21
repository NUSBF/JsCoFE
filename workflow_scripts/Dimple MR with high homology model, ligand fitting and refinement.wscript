#
# -----------------------------------------------------
# Simple Dimple-with-ligand workflow
# -----------------------------------------------------
# 25.11.2023
#

VERSION  1.0  # script version for backward compatibility
DEBUG    OFF  # ON/OFF
COMMENTS ON   # ON/OFF

# ==========================================================================
# Workflow header and input

# General workflow descriptors
NAME     dimple workflow
ONAME    dimple_wflow 
TITLE    Dimple MR Workflow with ligand fitting
DESC     custom DIMPLE workflow for high-homology cases 
KEYWORDS dimple workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED TYPES anomalous
!DATA XYZ          TYPES protein dna rna
DATA LIBRARY
DATA SEQ           TYPES protein dna rna
DATA LIGAND

# List all parameters required, "!" specifies mandatory items
PAR_REAL resHigh
    LABEL     High resolution cut-off (&Aring;) 
    TOOLTIP   High resolution cut-off, angstrom
    RANGE     0.1 5.0
    DEFAULT   1.5

PAR_CHECK reqValReport
    LABEL     Request PDB Validation Report
    TOOLTIP   Check if deposition files should be prepared and PDB validation report obtained
    DEFAULT   Unchecked


# ==========================================================================
# Workflow itself

@AIMLESS       
    IFDATA    unmerged
    DATA      ds0  unmerged
    PARAMETER RESO_HIGH resHigh+0.01
    RUN       Aimless
    
@CHANGERESO
    IFNOTDATA unmerged
    PROPERTY  HKL res_high resHigh+0.1
    RUN       ChangeReso

@DIMPLE        
    RUN       DimpleMR

@MAKE_LIGAND   
    IFDATA    ligdesc  # can be a list of required data types
    RUN       MakeLigand

@REMOVE_WATERS 
    IFDATA    ligand
    ALIAS     revision   istruct
    PARAMETER SOLLIG_SEL "W"
    RUN       TaskXyzUtils

@FIT_LIGAND    
    IFDATA    ligand
    PARAMETER SAMPLES 750
    RUN       FitLigand

@REFINE1
    PARAMETER VDW_VAL  2.0
    PARAMETER MKHYDR   "ALL"
    RUN       Refmac

@FIT_WATERS
    PARAMETER SIGMA 3.0
    RUN       FitWaters


let cnt    = 1
let cnt0   = 0
let Rfree0 = 1.0

@REFINE2[cnt]
    USE_SUGGESTED_PARAMETERS
    RUN       Refmac

let cnt0 = cnt; Rfree0 = Rfree  if  Rfree<Rfree0
let cnt  = cnt + 1
repeat @REFINE2 while suggested>0 and cnt<5

branch @REFINE2[cnt0]

@VALIDATION
    IF        reqValReport
    RUN       PDBVal

#
