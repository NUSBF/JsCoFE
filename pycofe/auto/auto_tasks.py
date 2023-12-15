##!/usr/bin/python

#
# ============================================================================
#
#    31.08.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Task templates for automatic workflows
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev, Maria Fando 2021-2023
#
# ============================================================================
#

from pycofe.auto import auto_api


# ============================================================================

def store ( unm,hkl,seq,lig,ligdesc ):
    if len(unm)>0:
        auto_api.addContext  ( "unm",unm[0] )
    if len(hkl)>0:
        auto_api.addContext  ( "hkl",hkl[0] )
    if len(seq)>0:
        auto_api.addContext  ( "seq",seq    )
    if len(lig)>0:
        auto_api.addContext  ( "lig",lig[0] )
    if ligdesc!=None and len(ligdesc)>0:
        auto_api.addContext  ( "ligdesc",ligdesc[0] )
    return

def store_dpl ( unm,hkl,lig,ligdesc ):
    if len(unm)>0:
        auto_api.addContext  ( "unm",unm[0] )
    if len(hkl)>0:
        auto_api.addContext  ( "hkl",hkl[0] )
    if len(lig)>0:
        auto_api.addContext  ( "lig",lig[0] )
    if ligdesc!=None and len(ligdesc)>0:
        auto_api.addContext  ( "ligdesc",ligdesc[0] )
    return

def store_dplmr ( unm,hkl,xyz,lib,ligdesc,lig,seq ):
    if len(unm)>0:
        auto_api.addContext  ( "unm",unm[0] )
    if len(hkl)>0:
        auto_api.addContext  ( "hkl",hkl[0] )
    if len(xyz)>0:
        auto_api.addContext  ( "xyz",xyz[0] )
    if len(lib)>0:
        auto_api.addContext  ( "lib",lib[0] )
    if ligdesc!=None and len(ligdesc)>0:
        auto_api.addContext  ( "ligdesc",ligdesc[0] )
    if len(lig)>0:
        auto_api.addContext  ( "lig",lig[0] )
    if len(seq)>0:
        auto_api.addContext  ( "seq",seq )
    return

def aimless ( name,parentName ):
    unm = auto_api.getContext ( "unm" )
    if unm:
        auto_api.addTask     ( name,"TaskAimless",parentName )
        auto_api.addTaskData ( name,"unmerged"   ,unm        )
        auto_api.addTaskData ( name,"ds0"        ,unm        )
#        auto_api.addContext  ( "hkl_node",name )
    return unm

def simbad ( name,searchType,revision, parentNode ): # branchName
    if revision:
        auto_api.addTask          ( name, "TaskSimbad",parentNode )
        auto_api.addTaskData      ( name, "idata"     ,revision   )
        auto_api.addTaskParameter ( name, "SEARCH_SEL",searchType )
    else:
        hkl = auto_api.getContext ( "hkl" )
        if hkl:
            auto_api.addTask          ( name, "TaskSimbad",parentNode )
            auto_api.addTaskData      ( name, "idata"     ,hkl        )
            auto_api.addTaskParameter ( name, "SEARCH_SEL",searchType )
    return

def asu ( name,parentName ):
    hkl = auto_api.getContext ( "hkl" )
    seq = auto_api.getContext ( "seq" )
    if hkl and seq:
        auto_api.addTask     ( name,"TaskASUDef",parentName )
        auto_api.addTaskData ( name,"hkl",hkl )
        auto_api.addTaskData ( name,"seq",seq )
        ha_type = auto_api.getContext ( "hatom" )
        if ha_type:
            auto_api.addTaskParameter ( name,"HATOM",ha_type )
        # auto_api.addContext  ( "branch",branchName )
    return

def editrevision ( name, revision, parentName ):
    seq = auto_api.getContext("seq")
    if seq:
        auto_api.addTask     ( name,"TaskEditRevision",parentName )
        auto_api.addTaskData ( name, "seq", seq)
        auto_api.addTaskData(name, "revision", revision)
    return

def dimple ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskDimple"  ,parentName )
    auto_api.addTaskData      ( name,"revision"    ,revision   )
    auto_api.addTaskParameter ( name, "NJELLY"     , "0"       )
    auto_api.addTaskParameter ( name, "NRESTR"     , "20"      )
    auto_api.addTaskParameter ( name, "MRTHRESHOLD", "0.4"     )
    auto_api.addTaskParameter ( name, "MRRESO"     , "3.25"    )
    auto_api.addTaskParameter ( name, "MRPROG"     , "phaser"  )
    return

def dimplemr ( name,parentName ):
    hkl = auto_api.getContext ( "hkl" )
    xyz = auto_api.getContext ( "xyz" )
    lib = auto_api.getContext ( "lib" )
    # try:
    #     lib = auto_api.getContext ( "lib" )
    # except:
    #     lib = None
    #     pass

    if hkl and xyz:
        auto_api.addTask     ( name,"TaskDimpleMR",parentName )
        auto_api.addTaskData ( name, "hkl", hkl)
        auto_api.addTaskData ( name, "xyz", xyz)
        if lib:
            auto_api.addTaskData ( name, "lib", lib)
   
    return



def buccaneer ( name,revision,parentName ):
    auto_api.addTask     ( name,"TaskBuccaneer",parentName )
    auto_api.addTaskData ( name,"revision"     ,revision   )
    return

def modelcraft ( name,revision,parentName ):
    auto_api.addTask     ( name,"TaskModelCraft",parentName )
    auto_api.addTaskData ( name,"revision"      ,revision   )
    return


def ccp4build ( name,revision,parentName ):
    auto_api.addTask     ( name,"TaskCCP4Build",parentName )
    auto_api.addTaskData ( name,"revision"     ,revision   )
    return


def arpwarp ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskArpWarp"   ,parentName )
    auto_api.addTaskData      ( name,"revision"      ,revision   )
    auto_api.addTaskParameter ( name,"AWA_BIG_CYCLES","2"        )
    return


def xyzWaters ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskXyzUtils",parentName )
    auto_api.addTaskData      ( name,"istruct"     ,revision   )
    # remove waters
    auto_api.addTaskParameter ( name, "SOLLIG_SEL" , "W"       )
    return


def make_ligand ( name, ligdesc, revision, parentName ):
    auto_api.addTask          ( name,"TaskMakeLigand",parentName )
    auto_api.addTaskData      ( name, "void1", revision)
    auto_api.addTaskParameter ( name,"SOURCE_SEL",ligdesc.source )
    auto_api.addTaskParameter ( name,"SMILES"    ,ligdesc.smiles )
    auto_api.addTaskParameter ( name,"CODE"      ,ligdesc.code   )
    auto_api.addTaskParameter ( name,"CODE3"     ,ligdesc.code   )
    return


def refmac_jelly ( name,revision,parentName, ncyc=50 ):
    auto_api.addTask          ( name,"TaskRefmac",parentName )
    auto_api.addTaskData      ( name,"revision",revision )
    auto_api.addTaskParameter ( name,"NCYC" , str(ncyc) )
    auto_api.addTaskParameter ( name,"JELLY","yes" )
    return


def refmac_vdw ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskRefmac",parentName )
    auto_api.addTaskData      ( name,"revision",revision )
    auto_api.addTaskParameter ( name,"VDW_VAL" ,"2.0"  )
    auto_api.addTaskParameter ( name,"MKHYDR","ALL" )
    return


def fit_ligand ( name, ligand, revision,parentName ):
    auto_api.addTask          ( name,"TaskFitLigand",parentName )
    auto_api.addTaskData      ( name,"revision",revision )
    auto_api.addTaskData      ( name,"ligand"  ,ligand )
    auto_api.addTaskParameter ( name,"SAMPLES" ,"750"  )
    return


def refmac ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskRefmac",parentName )
    auto_api.addTaskData      ( name,"revision",revision )
    return


def fit_waters ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskFitWaters",parentName )
    auto_api.addTaskData      ( name,"revision",revision )
    auto_api.addTaskParameter ( name,"SIGMA","3.0" )
    return


def deposition ( name,revision,parentName ):
    # auto_api.addTask     ( name,"TaskDeposition",parentName )
    auto_api.addTask          ( name,"TaskPDBVal",parentName )
    auto_api.addTaskData      ( name,"revision"  ,revision )
    return


def remark ( name,text,themeNo,description,parentName ):
    auto_api.addTask          ( name,"TaskRemark" ,parentName  )
    auto_api.addTaskField     ( name,"name"       ,text        )
    auto_api.addTaskField     ( name,"theme_no"   ,themeNo     )
    auto_api.addTaskParameter ( name,"DESCRIPTION",description )
    return


def refligWF ( name,revision,parentName ):
    newNRun = '0'
    auto_api.addContext  ( "refmacClonedRun",newNRun )
    actualName = str(name + newNRun)
    auto_api.addTask     ( actualName,"TaskRefmac",parentName )
    auto_api.addTaskData ( actualName,"revision"  ,revision   )
    auto_api.noteTask    ( actualName,"refmac_noted" )  # cloning current task
    return


def refmacSuggested ( name, revision, suggested ):
    nRun = auto_api.getContext ( "refmacClonedRun" )
    newNRun = str(int(nRun) + 1)
    auto_api.addContext        ( "refmacClonedRun",newNRun )
    actualName = str(name + newNRun)
    auto_api.cloneTask         ( actualName,"refmac_noted" )
    # seems to be critical not to add task data for cloned tasks
    # auto_api.addTaskData ( actualName,"revision",revision )
    for k in suggested:
        auto_api.addTaskParameter ( actualName,k,suggested[k] )
    auto_api.noteTask    ( actualName,"refmac_noted" )  # for the next run cloning current task
    return


def lorestr ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskLorestr",parentName )
    auto_api.addTaskData      ( name,"revision"   ,revision   )
    auto_api.addTaskParameter ( name,"PDB_CBX"    ,"True"     ) # auto search for homologues
    return

def morda ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskMorda"    , parentName )
    auto_api.addTaskData      ( name,"revision"     , revision   )
    auto_api.addTaskParameter ( name,"ALTGROUPS_CBX",True        )
    # auto_api.addTaskParameter(name, "NMODELS", nModels)

    return

def mrbump ( name,revision,parentName, nModels ):
    auto_api.addTask          ( name,"TaskMrBump"   , parentName )
    auto_api.addTaskData      ( name,"revision"     , revision   )
    auto_api.addTaskParameter ( name,"ALTGROUPS_CBX", True       )
    auto_api.addTaskParameter ( name,"MRNUM"        , nModels    ) 
    return

def modelprepXYZ ( name, parentName ):
    xyz = auto_api.getContext ( "xyz" )
    seq = auto_api.getContext ( "seq" )
    if xyz and seq:
        auto_api.addTask     ( name,"TaskModelPrepXYZ", parentName )
        auto_api.addTaskData ( name,"seq", seq )
        auto_api.addTaskData ( name,"xyz", xyz )
        hasNA = auto_api.getContext ( "na" )
        if hasNA:
            auto_api.addTaskParameter ( name, "MODIFICATION_SEL", "U" )
    return

def phaserAllModels ( name,parentName ):
    revision = auto_api.getContext ( "revisionForPhaser" )
    models   = auto_api.getContext ( "modelsForPhaser"   )
    auto_api.addTask     ( name, "TaskPhaserMR", parentName )
    auto_api.addTaskData ( name, "revision"    , revision   )
    auto_api.addTaskData ( name, "model"       , models     )
    return

def phaserFirst ( name,parentName ):
    revision = auto_api.getContext ( "revisionForPhaser" )
    model    = auto_api.getContext ( "modelForPhaser"    )
    auto_api.addTask     ( name, "TaskPhaserMR", parentName )
    auto_api.addTaskData ( name, "revision"    , revision   )
    auto_api.addTaskData ( name, "model"       , model      )
    return

def phaserNext ( name,revision,parentName ):
    model = auto_api.getContext ( "modelForPhaser" )
    auto_api.addTask     ( name, "TaskPhaserMR", parentName )
    auto_api.addTaskData ( name, "revision"    , revision   )
    auto_api.addTaskData ( name, "model"       , model      )
    return

def afStructurePrediction ( name,seq,parentName ):
    auto_api.addTask     ( name,"TaskStructurePrediction",parentName )
    auto_api.addTaskData ( name,"seq",seq )
    return

def slicendice ( name,parentName ):
    revision = auto_api.getContext ( "revisionForSliceNDice" )
    xyz      = auto_api.getContext ( "xyz" )
    auto_api.addTask     ( name, "TaskSliceNDice", parentName )
    auto_api.addTaskData ( name, "revision"      , revision   )
    auto_api.addTaskData ( name, "xyz"           , xyz        )
    return

def slice ( name,parentName ):
    xyz = auto_api.getContext ( "xyz" )
    seq = auto_api.getContext ( "seq" )
    if xyz and seq:
        auto_api.addTask     ( name, "TaskSlice", parentName )
        auto_api.addTaskData ( name, "seq"      , seq        )
        auto_api.addTaskData ( name, "xyz"      , xyz        )
    return
