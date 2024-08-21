#
# -----------------------------------------------------
# Simple MR with given model including ligand fitting
# -----------------------------------------------------
# 25.11.2023
#

VERSION  1.0  # script version for backward compatibility
DEBUG    OFF  # ON/OFF
COMMENTS ON   # ON/OFF

# ==========================================================================
# Workflow header and input

# General workflow descriptors
NAME     SMR workflow
ONAME    smr_wflow 
TITLE    Phaser MR Workflow with ligand fitting
DESC     phaser-MR with given model, water/ligand fitting and refinement 
ICON Maraschino  # added automatically
KEYWORDS simple MR workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED TYPES anomalous
!DATA XYZ          TYPES protein dna rna
!DATA SEQ          TYPES protein dna rna
DATA LIGAND


# List all parameters required, "!" specifies mandatory items
PAR_REAL resHigh
    LABEL     High resolution cut-off (&Aring;) 
    TOOLTIP   High resolution cut-off, angstrom
    DEFAULT   1.5
    RANGE     0.1 5.0

PAR_CHECK reqValReport
    LABEL     Request PDB Validation Report
    TOOLTIP   Check if deposition files should be prepared and PDB validation report obtained
    DEFAULT   Unchecked

# ==========================================================================
# Workflow itself

PRINT_VAR reso_high

@SCALE_AND_MERGE       
    IFDATA    unmerged
    DATA      ds0  unmerged
    PARAMETER RESO_HIGH resHigh
    RUN       Aimless

# If unmerged file was not provided, cut resolution of merged dataset
@CHANGERESO
    IFNOTDATA unmerged
    IF        reso_high < resHigh
    PROPERTY  HKL res_high resHigh
    RUN       ChangeReso

@PREPARE_MR_MODEL
    RUN       ModelPrepXYZ

@DEFINE_ASU
    RUN       ASUDef

let cnt = 1
@MOLECULAR_REPLACEMENT[cnt]
    RUN       PhaserMR
let cnt = cnt + 1
#PRINT_VAR nfitted
continue @MOLECULAR_REPLACEMENT[cnt]  while  nfitted0<nfitted and nfitted<nasu and cnt<=nasu

@REBUILD
    RUN       ModelCraft

# Make ligand if ligand description was provided
@MAKE_LIGAND   
    IFDATA    ligdesc  # can be a list of required data types
    ALIAS     revision   void1
    RUN       MakeLigand

# If ligand is given or generated, remove waters after Modelcraft and 
# refine again so that water density residuals are not found in ligand
# blobs
@REMOVE_WATERS 
    IFDATA    ligand
    ALIAS     revision   istruct
    PARAMETER SOLLIG_SEL "W"
    RUN       XyzUtils

@REFINE-1
    IFDATA    ligand
    PARAMETER VDW_VAL  2.0
    PARAMETER MKHYDR   "ALL"
    RUN       Refmac

# Fit ligand and refine
@FIT_LIGAND    
    IFDATA    ligand
    PARAMETER SAMPLES 750
    RUN       FitLigand


# give it refinement with parameter optiimsation now

let suggested = 0    # need in case if ligand was not given
let cnt       = 1
let cnt0      = 0
let Rfree0    = 1.0

@REFINE-2[cnt]
    IFDATA    ligand
    USE_SUGGESTED_PARAMETERS
    RUN       Refmac

let cnt0 = cnt; Rfree0 = Rfree  if  Rfree<Rfree0
let cnt  = cnt + 1
repeat @REFINE-2 while suggested>0 and cnt<5

branch @REFINE-2[cnt0]  pass   # pass works when @REFINE-2 was not run


# If ligand was given or generated, waters were removed after Modelcraft.
# Therefore, find and fit waters again
@FIT_WATERS
    IFDATA     ligand
    #PARAMETER  SIGMA 3.0   # will optiise SIGMA if this parameter is not given
    RUN        FitWaters


let cnt    = 1
let cnt0   = 0
let Rfree0 = 1.0

@REFINE-3[cnt]
    USE_SUGGESTED_PARAMETERS
    RUN       Refmac

let cnt0 = cnt; Rfree0 = Rfree  if  Rfree<Rfree0
let cnt  = cnt + 1
repeat @REFINE-3 while suggested>0 and cnt<5

branch @REFINE-3[cnt0]

@VALIDATION
    IF         reqValReport
    RUN        PDBVal

#
