#
# ---------------------------------------------------------------
# Demo: running automatic solvers in parallel, choose best result
# ---------------------------------------------------------------
# 18.08.2024
#

VERSION  1.0  # script version for backward compatibility
DEBUG    OFF  # ON/OFF
COMMENTS ON   # ON/OFF

# ==========================================================================
# Workflow header and input

# General workflow descriptors
NAME     Parallel automation
ONAME    pauto_wflow 
TITLE    Parallel automatic solvers
DESC     running automatic solvers in parallel, choose best result 
ICON     Teal  # added automatically
KEYWORDS parallel workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED
!DATA SEQ TYPES protein

# List all parameters required, "!" specifies mandatory items
PAR_STRING anomScatterer
    LABEL     Anomalous scatterer 
    TOOLTIP   Specify atom type of dominant anomalous scatterer (e.g., S, SE etc.).
    MAXLENGTH 2
    IWIDTH    40

PAR_CHECK reqValReport
    LABEL     Request PDB Validation Report
    TOOLTIP   Check if deposition files should be prepared and PDB validation report obtained
    DEFAULT   Unchecked

# ==========================================================================
# Workflow body

@SCALE_AND_MERGE       
    IFDATA    unmerged
    DATA      ds0  unmerged
    RUN       Aimless

@DEFINE_ASU
    #PROPERTY  HKL wtype "peak"
    PARAMETER HATOM  $anomScatterer  #  '$' means string value, do not compute
    RUN       ASUDef


PARALLEL ON

@MRBUMP
    RUN MrBump
#

@MORDA
    RUN Morda
#

@CRANK2
    IF  anomScatterer!="" and N_hkl_anom<=0  # do only if anomalous signal was detected
    PROPERTY REVISION.HKL wtype "peak"
    RUN Crank2
#

PARALLEL OFF


# The following instructions will be repeated after each auto-solver

# Find and fit waters
@FIT_WATERS
    IFDATA     ligand
    #PARAMETER  SIGMA 3.0   # will optiise SIGMA if this parameter is not given
    RUN        FitWaters

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
#
