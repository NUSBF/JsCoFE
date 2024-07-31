#
# -----------------------------------------------------
# Experimental Phasing with SHELXCD and Phaser-EP
# -----------------------------------------------------
# 25.11.2023
#

VERSION  1.0  # script version for backward compatibility
DEBUG    OFF  # ON/OFF
COMMENTS ON   # ON/OFF

# ==========================================================================
# Workflow header and input

# General workflow descriptors
NAME     Phaser-EP workflow
ONAME    phep_wflow 
TITLE    Phaser EP workflow with model building
DESC     phaser EP followed by model building and refinement 
ICON     Teal  # added automatically
KEYWORDS phaser EP workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED TYPES anomalous
!DATA SEQ          TYPES protein dna rna

# List all parameters required, "!" specifies mandatory items
!PAR_STRING anomScatterer
    LABEL     Anomalous scatterer 
    TOOLTIP   Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.).
    MAXLENGTH 2
    IWIDTH    40

PAR_REAL resHigh
    LABEL     High resolution cut-off (&Aring;) 
    TOOLTIP   High resolution cut-off, angstrom
    DEFAULT   1.0  # will be ignored if resolution is lower
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


@DEFINE_ASU
    #PROPERTY  HKL wtype "peak"
    PARAMETER HATOM  $anomScatterer  #  '$' means string value, do not compute
    RUN       ASUDef

@SUBSTRUCTURE_SEARCH
    PROPERTY  REVISION.HKL wtype "peak"
    RUN       ShelxCD

@PHASING
    RUN       PhaserEP

let hand   = 0
let hand0  = -1
let FOM0   = -1
let Compl0 = -1

@DENSITY_MODIFICATION[hand]
    USE REVISION hand
    RUN       Parrot

@QUICK_BUILD_CHECK[hand]
    PARAMETER MODE_SEL "basic"  # Full or Fast pipeline modes
    PARAMETER NCYCLES_MAX_FAST 1  # Maximum number of pipeline cycles
    PARAMETER NOIMPROVE_CYCLES_FAST 1  # Stop if results do not improve during
    RUN       ModelCraft

let hand0 = hand; FOM0 = FOM; Compl0 = Compl if  Compl>Compl0

# let hand0 = hand; FOM0 = FOM; if  FOM>FOM0
let hand  = hand + 1
repeat @DENSITY_MODIFICATION while hand<2

PRINT_VAR  hand0
PRINT_VAR  FOM0
PRINT_VAR  Compl0

branch @DENSITY_MODIFICATION[hand0]

@MODEL_BUILDING
    RUN       ModelCraft


# give it more refinement with parameter optiimsation

let cnt    = 1
let cnt0   = 0
let Rfree0 = 1.0

@REFINE[cnt]
    USE_SUGGESTED_PARAMETERS
    RUN       Refmac

let cnt0 = cnt; Rfree0 = Rfree  if  Rfree<Rfree0
let cnt  = cnt + 1
repeat @REFINE while suggested>0 and cnt<5

branch @REFINE[cnt0]

@VALIDATION
    IF         reqValReport
    RUN        PDBVal


END


#PRINT_VAR nfitted
branch @MOLECULAR_REPLACEMENT  while  nfitted0<nfitted and nfitted<nasu

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
let cnt = 1
@REFINE-2
    IFDATA    ligand
    USE_SUGGESTED_PARAMETERS
    RUN       Refmac

let cnt = cnt + 1
repeat @REFINE-2 while suggested>0 and cnt<5


# If ligand was given or generated, waters were removed after Modelcraft.
# Therefore, find and fit waters again
@FIT_WATERS
    IFDATA     ligand
    #PARAMETER  SIGMA 3.0   # will optiise SIGMA if this parameter is not given
    RUN        FitWaters

let cnt = 1
@REFINE-3
    USE_SUGGESTED_PARAMETERS
    RUN        Refmac

let cnt = cnt + 1
repeat @REFINE-3 while suggested>0 and cnt<5


#@VALIDATION
#    RUN        PDBVal

#
