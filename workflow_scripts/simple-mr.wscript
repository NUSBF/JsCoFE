#
# -----------------------------------------------------
# Simple MR with given model including ligand fitting
# -----------------------------------------------------
#

VERSION 1.0  # script version for backward compatibility

# ==========================================================================
# Workflow header and input

# General workflow descriptors
NAME     SMR workflow
ONAME    smr_wflow 
TITLE    Simple MR Workflow with ligand fitting
DESC     simple MR with given templatem water/ligand fitting and refinement 
KEYWORDS simple MR workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED TYPES anomalous
!DATA XYZ          TYPES protein dna rna
!DATA SEQ          TYPES protein dna rna
DATA LIGAND


# List all parameters required, "!" specifies mandatory items
#PAR_REAL resHigh
#    LABEL     High resolution cut-off (Å) 
#    TOOLTIP   High resolution cut-off, angstrom
#    DEFAULT   1.5
#    RANGE     0.1 5.0

# ==========================================================================
# Workflow itself

@SCALE_AND_MERGE       
    IFDATA    unmerged
    DATA      ds0  unmerged
    #PARAMETER RESO_HIGH resHigh+0.01
    RUN       TaskAimless

@PREPARE_MR_MODEL
    RUN       TaskModelPrepXYZ

@DEFINE_ASU
    RUN       TaskASUDef

@MOLECULAR_REPLACEMENT
    RUN       TaskPhaserMR

PRINT_VAR nfitted
continue @MOLECULAR_REPLACEMENT  while  nfitted0<nfitted and nfitted<nasu

@REBUILD
    RUN       TaskModelCraft

@MAKE_LIGAND   
    IFDATA    ligdesc  # can be a list of required data types
    RUN       TaskMakeLigand

@REMOVE_WATERS 
    #IFDATA    ligand
    ALIAS     revision   istruct
    PARAMETER SOLLIG_SEL "W"
    RUN       TaskXyzUtils

@FIT_LIGAND    
    IFDATA    ligand
    PARAMETER SAMPLES 750
    RUN       TaskFitLigand

@REFINE-1
    #IFDATA    ligand
    PARAMETER VDW_VAL  2.0
    PARAMETER MKHYDR   "ALL"
    RUN       TaskRefmac

@FIT_WATERS
    #IFDATA    ligand
    #PARAMETER SIGMA 3.0
    RUN       TaskFitWaters

let cnt = 1

@REFINE-2
    USE_SUGGESTED_PARAMETERS
    RUN       TaskRefmac

let cnt = cnt + 1
repeat @REFINE-2 while suggested>0 and cnt<5

@VALIDATION
    RUN       TaskPDBVal

#