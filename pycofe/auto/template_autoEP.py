##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    28.03.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Auto-EP workflow template
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
#
# ============================================================================
#

import os

from   pycofe.varut  import  jsonut
from   pycofe.auto   import  auto_tasks
from   pycofe.auto   import  auto_api


# ============================================================================
# Main function

def makeNextTask ( crTask,data ):

    if crTask._type=="TaskCCP4goAutoEP":
        auto_api.addContext ( "hatom",data["hatom"] )
        hkl = data["hkl"]
        for i in range(len(hkl)):
            hkl[i].wtype   = "peak"
            hkl[i].ha_type = data["hatom"]
        auto_tasks.store ( data["unm"],hkl,data["seq"],data["lig"],data["ligdesc"] )
        if not auto_tasks.make_ligand ( "mkligand",crTask.autoRunName ):
            if not auto_tasks.aimless ( "aimless",crTask.autoRunName ):
                auto_tasks.simbad ( "simbad","L",crTask.autoRunName,"simbad" )

    elif crTask._type=="TaskMakeLigand":
        if data["ligand"]:
            auto_api.addContext ( "lig",data["ligand"] )
            if not auto_tasks.aimless("aimless",crTask.autoRunName):
                auto_tasks.simbad ( "simbad","L",crTask.autoRunName,"simbad" )
        elif not auto_tasks.aimless("aimless","_root"):
            auto_tasks.simbad ( "simbad","L","_root","simbad" )

    elif crTask._type=="TaskAimless":
        if len(data["hkl"])>0:
            data["hkl"][0].wtype   = "peak"
            data["hkl"][0].ha_type = data["hatom"]
            auto_api.addContext ( "hkl",data["hkl"][0] )
            auto_tasks.simbad ( "simbad","L",crTask.autoRunName,"simbad" )

    elif crTask._type=="TaskSimbad":
        if not data["revision"] or (float(data["Rfree"])>0.45):
            auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"),"autoEP" )
        else:
            auto_tasks.build ( "simbad_mb",data["revision"],crTask.autoRunName )

    elif crTask._type=="TaskASUDef":
        auto_api.addTask     ( "crank2","TaskCrank2",crTask.autoRunName )
        auto_api.addTaskData ( "crank2","revision",data["revision"] )

    elif crTask._type in ["TaskCCP4Build","TaskBuccaneer"]:
        if (auto_api.getContext("branch")=="simbad") and\
           (not data["revision"] or (float(data["Rfree"])>0.3)):
            auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"),"autoEP" )
        if data["revision"] and (float(data["Rfree"])<0.4):
            if not auto_tasks.fit_ligand("fitligand",data["revision"],crTask.autoRunName):
                auto_tasks.refmac_jelly ( "refmac-jelly",data["revision"],crTask.autoRunName )

    elif crTask._type=="TaskFitLigand":
        auto_tasks.refmac_jelly ( "refmac-jelly",data["revision"],crTask.autoRunName )

    elif crTask._type=="TaskFitWaters":
        auto_tasks.refmac ( "refmac2",data["revision"],crTask.autoRunName )

    elif crTask._type=="TaskRefmac":
        if crTask.autoRunName=="refmac-jelly":
            if float(data["Rfree"])<0.4:
                auto_tasks.fit_waters ( "fitwaters",data["revision"],crTask.autoRunName )
        else:
            auto_tasks.deposition ( "deposition",data["revision"],crTask.autoRunName )

    return
