##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    25.03.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Auto-MR workflow template
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
#
# ============================================================================
#

import os

from   pycofe.varut  import jsonut
from   pycofe.auto   import auto_api


# ============================================================================

def start_simbad ( searchType ):
    auto_api.addTask          ( "simbad","TaskSimbad","" )
    auto_api.addTaskData      ( "simbad","hkl",auto_api.getContext("hkl") )
    auto_api.addTaskParameter ( "simbad","SEARCH_SEL",searchType )
    auto_api.addContext       ( "branch","simbad" )
    return

def start_asu ( parentName ):
    auto_api.addTask     ( "asu","TaskASUDef",parentName )
    auto_api.addTaskData ( "asu","hkl",auto_api.getContext("hkl") )
    auto_api.addTaskData ( "asu","seq",auto_api.getContext("seq") )
    auto_api.addContext  ( "branch","autoMR" )
    return;

def start_mb ( name,revision ):
    if auto_api.getContext("mb_engine")=="ccp4build":
        auto_api.addTask     ( name,"TaskCCP4Build",""  )
        auto_api.addTaskData ( name,"revision",revision )
    else:
        auto_api.addTask     ( name,"TaskBuccaneer",""  )
        auto_api.addTaskData ( name,"revision",revision )
    return

def start_mkligand ( name,ligdesc ):
    auto_api.addTask          ( name,"TaskMakeLigand","" )
    auto_api.addTaskParameter ( name,"SOURCE_SEL",ligdesc.source )
    auto_api.addTaskParameter ( name,"SMILES"    ,ligdesc.smiles )
    auto_api.addTaskParameter ( name,"CODE"      ,ligdesc.code   )
    auto_api.addTaskParameter ( name,"CODE3"     ,ligdesc.code   )
    return

def start_refmac_jelly ( name,revision ):
    auto_api.addTask          ( name,"TaskRefmac","" )
    auto_api.addTaskData      ( name,"revision",revision )
    auto_api.addTaskParameter ( name,"NCYC" ,"50"  )
    auto_api.addTaskParameter ( name,"JELLY","yes" )
    return


# ----------------------------------------------------------------------------
# Main function

def makeNextTask ( crTask,data ):

    if crTask._type=="TaskCCP4goAutoMR":
        auto_api.addContext  ( "seq"      ,data["seq"][0]    )
        auto_api.addContext  ( "lig"      ,data["lig"]       )
        auto_api.addContext  ( "ligdesc"  ,data["ligdesc"]   )
        auto_api.addContext  ( "mr_engine",data["mr_engine"] )
        auto_api.addContext  ( "mb_engine",data["mb_engine"] )
        if len(data["unm"])>0:
            auto_api.addTask     ( "aimless","TaskAimless","" )
            auto_api.addTaskData ( "aimless","unmerged",data["unm"][0] )
            auto_api.addTaskData ( "aimless","ds0"     ,data["unm"][0] )
            auto_api.addContext  ( "hkl_node","aimless" )
        else:
            auto_api.addContext  ( "hkl",data["hkl"][0] )
            auto_api.addContext  ( "hkl_node","_root" )
            start_simbad ( "L" )

    elif crTask._type=="TaskAimless":
        auto_api.addContext  ( "hkl",data["hkl"][0] )
        start_simbad ( "L" )

    elif crTask._type=="TaskSimbad":
        if not data["revision"] or (float(data["Rfree"])>0.45):
            start_asu ( auto_api.getContext("hkl_node") )
        else:
            start_mb ( "simbad_mb",data["revision"] )

    elif crTask._type=="TaskASUDef":
        if (auto_api.getContext("mr_engine")=="morda") and \
           (os.path.isfile(os.path.join(os.environ["CCP4"],"share","mrd_data","VERSION")) or\
            os.path.isfile(os.path.join(os.environ["CCP4"],"lib","py2","morda","LINKED"))):
            auto_api.addTask          ( "morda","TaskMorda","" )
            auto_api.addTaskData      ( "morda","revision",data["revision"] )
            auto_api.addTaskParameter ( "morda","ALTGROUPS_CBX",True )
        else:
            auto_api.addTask          ( "mrbump","TaskMrBump","" )
            auto_api.addTaskData      ( "mrbump","revision",data["revision"] )
            auto_api.addTaskParameter ( "mrbump","ALTGROUPS_CBX",True )

    elif crTask._type=="TaskMorda":
        start_mb ( "morda_mb",data["revision"] )

    elif crTask._type in ["TaskCCP4Build","TaskBuccaneer","TaskMrBump"]:
        if (auto_api.getContext("branch")=="simbad") and\
           (not data["revision"] or (float(data["Rfree"])>0.3)):
            start_asu ( auto_api.getContext("hkl_node") )
        if data["revision"] and (float(data["Rfree"])<0.4):
            ligdesc = auto_api.getContext ( "ligdesc" )
            if len(ligdesc)>0:
                start_mkligand ( "mkligand",ligdesc[0] )
                auto_api.addContext ( "revision",data["revision"] )
            else:
                start_refmac_jelly ( "refmac-jelly",data["revision"] )

    elif crTask._type=="TaskMakeLigand":
        if data["ligand"]:
            auto_api.addTask          ( "fitligand","TaskFitLigand","" )
            auto_api.addTaskData      ( "fitligand","revision",auto_api.getContext("revision") )
            auto_api.addTaskData      ( "fitligand","ligand"  ,data["ligand"] )
            auto_api.addTaskParameter ( "fitligand","SAMPLES" ,"750" )

    elif crTask._type=="TaskFitLigand":
        start_refmac_jelly ( "refmac-jelly",data["revision"] )

    elif crTask._type=="TaskFitWaters":
        auto_api.addTask     ( "refmac2","TaskRefmac","" )
        auto_api.addTaskData ( "refmac2","revision",data["revision"] )

    elif crTask._type=="TaskRefmac":
        if crTask.autoRunName=="refmac-jelly":
            if float(data["Rfree"])<0.4:
                auto_api.addTask     ( "fitwaters","TaskFitWaters","" )
                auto_api.addTaskData ( "fitwaters","revision",data["revision"] )
        else:
            auto_api.addTask     ( "deposition","TaskDeposition","" )
            auto_api.addTaskData ( "deposition","revision",data["revision"] )

    return
