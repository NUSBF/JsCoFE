##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    23.04.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Task templates for automatic workflows
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev 2021
#
# ============================================================================
#

from   pycofe.auto   import auto_api


# ============================================================================

def store ( unm,hkl,seq,lig,ligdesc ):
    if len(unm)>0:
        auto_api.addContext  ( "unm",unm[0] )
    if len(hkl)>0:
        auto_api.addContext  ( "hkl",hkl[0] )
    if len(seq)>0:
        auto_api.addContext  ( "seq",seq[0] )
    if len(lig)>0:
        auto_api.addContext  ( "lig",lig[0] )
    if len(ligdesc)>0:
        auto_api.addContext  ( "ligdesc",ligdesc[0] )
    return

def aimless ( name,parentName ):
    unm = auto_api.getContext("unm")
    if unm:
        auto_api.addTask     ( name,"TaskAimless",parentName )
        auto_api.addTaskData ( name,"unmerged"   ,unm )
        auto_api.addTaskData ( name,"ds0"        ,unm )
#        auto_api.addContext  ( "hkl_node",name )
    return unm

def simbad ( name,searchType,parentNode ): # branchName
    hkl = auto_api.getContext("hkl")
    if hkl:
        auto_api.addTask          ( name,"TaskSimbad",parentNode )
        auto_api.addTaskData      ( name,"hkl",hkl )
        auto_api.addTaskParameter ( name,"SEARCH_SEL",searchType )
        # auto_api.addContext       ( "branch"  ,branchName )
        # auto_api.addContext       ( "hkl_node",parentNode )
    return

def asu ( name,parentName ):
    hkl = auto_api.getContext("hkl")
    seq = auto_api.getContext("seq")
    if hkl and seq:
        auto_api.addTask     ( name,"TaskASUDef",parentName )
        auto_api.addTaskData ( name,"hkl",hkl )
        auto_api.addTaskData ( name,"seq",seq )
        ha_type = auto_api.getContext("hatom")
        if ha_type:
            auto_api.addTaskParameter ( name,"HATOM",ha_type )
        # auto_api.addContext  ( "branch",branchName )
    return

def build ( name,revision,parentName ):
    if auto_api.getContext("mb_engine")=="ccp4build":
        auto_api.addTask ( name,"TaskCCP4Build",parentName  )
    else:
        auto_api.addTask ( name,"TaskBuccaneer",parentName  )
    auto_api.addTaskData ( name,"revision",revision )
    return

def make_ligand ( name, ligdesc, revision, parentName ):
    auto_api.addTask          ( name,"TaskMakeLigand",parentName )
    auto_api.addTaskData      ( name, "revision", revision)
    auto_api.addTaskParameter ( name,"SOURCE_SEL",ligdesc.source )
    auto_api.addTaskParameter ( name,"SMILES"    ,ligdesc.smiles )
    auto_api.addTaskParameter ( name,"CODE"      ,ligdesc.code   )
    auto_api.addTaskParameter ( name,"CODE3"     ,ligdesc.code   )
    return

def refmac_jelly ( name,revision,parentName ):
    auto_api.addTask          ( name,"TaskRefmac",parentName )
    auto_api.addTaskData      ( name,"revision",revision )
    auto_api.addTaskParameter ( name,"NCYC" ,"50"  )
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
    auto_api.addTask     ( name,"TaskRefmac",parentName )
    auto_api.addTaskData ( name,"revision",revision )
    return

def fit_waters ( name,revision,parentName ):
    auto_api.addTask     ( name,"TaskFitWaters",parentName )
    auto_api.addTaskData ( name,"revision",revision )
    auto_api.addTaskParameter(name, 'SIGMA', '3.0')
    return

def deposition ( name,revision,parentName ):
    auto_api.addTask     ( name,"TaskDeposition",parentName )
    auto_api.addTaskData ( name,"revision",revision )
    return

def remark ( name,text,themeNo,description,parentName ):
    auto_api.addTask          ( name,"TaskRemark" ,parentName  )
    auto_api.addTaskField     ( name,"name"       ,text        )
    auto_api.addTaskField     ( name,"theme_no"   ,themeNo     )
    auto_api.addTaskParameter ( name,"DESCRIPTION",description )
    return


def refligWF ( name,revision,parentName ):
    newNRun = '0'
    auto_api.addContext("refmacClonedRun", newNRun)
    actualName = str(name + newNRun)
    auto_api.addTask     ( actualName,"TaskRefmac",parentName )
    auto_api.addTaskData ( actualName,"revision",revision )
    auto_api.noteTask    ( actualName,"refmac_noted" )  # cloning current task
    return


def refmacSuggested ( name, revision, suggested ):
    nRun = auto_api.getContext("refmacClonedRun")
    newNRun = str(int(nRun) + 1)
    auto_api.addContext("refmacClonedRun", newNRun)
    actualName = str(name + newNRun)

    auto_api.cloneTask   ( actualName, "refmac_noted" )
    # seems to be critical not to add task data for cloned tasks
    # auto_api.addTaskData ( actualName,"revision",revision )
    for k in suggested.keys():
        auto_api.addTaskParameter(actualName, k, suggested[k])
    auto_api.noteTask    ( actualName,"refmac_noted" )  # for the next run cloning current task

    return

def lorestr ( name,revision,parentName ):
    auto_api.addTask     ( name,"TaskLorestr",parentName )
    auto_api.addTaskData ( name,"revision",revision )
    auto_api.addTaskParameter(name, "PDB_CBX", "True") # auto search for homologues
    return
