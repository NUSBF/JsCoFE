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
#  Auto-MR workflow template
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

    if crTask._type=="TaskWFlowAMR":
        auto_api.addContext ( "mr_engine",data["mr_engine"] )
        auto_api.addContext ( "mb_engine",data["mb_engine"] )
        auto_tasks.store ( data["unm"],data["hkl"],data["seq"],data["lig"],data["ligdesc"] )
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
            auto_api.addContext ( "hkl",data["hkl"][0] )
            auto_tasks.simbad ( "simbad","L",crTask.autoRunName,"simbad" )

    elif crTask._type=="TaskSimbad":
        if not data["revision"] or (float(data["Rfree"])>0.45):
            auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"),"autoMR" )
            # auto_api.noteTask ( "asu","asu_noted" ) # to-be-cloned tasks should be noted with unique name
        else:
            auto_tasks.build ( "simbad_mb",data["revision"],crTask.autoRunName )

    elif crTask._type=="TaskASUDef":  # could be elif crTask.autoRunName.startsWith("asu")
        # if crTask.autoRunName=="asu":
        #     # only clone the noted ASU task into "asu2", do not start MR solver after task "asu"
        #     auto_api.cloneTask ( "asu2","asu_noted" )
        #     # now you can set parameters for task name "asu2"
        # else:
        #     # start MR solver from cloned ASU task "asu2"
        if (auto_api.getContext("mr_engine")=="morda") and \
           (os.path.isfile(os.path.join(os.environ["CCP4"],"share","mrd_data","VERSION")) or\
            os.path.isfile(os.path.join(os.environ["CCP4"],"lib","py2","morda","LINKED"))):
            auto_api.addTask          ( "morda","TaskMorda",crTask.autoRunName )
            auto_api.addTaskData      ( "morda","revision",data["revision"] )
            auto_api.addTaskParameter ( "morda","ALTGROUPS_CBX",True )
        else:
            auto_api.addTask          ( "mrbump","TaskMrBump",crTask.autoRunName )
            auto_api.addTaskData      ( "mrbump","revision",data["revision"] )
            auto_api.addTaskParameter ( "mrbump","ALTGROUPS_CBX",True )

    elif crTask._type=="TaskMorda":
        auto_tasks.build ( "morda_mb",data["revision"],crTask.autoRunName )

    elif crTask._type in ["TaskCCP4Build","TaskBuccaneer","TaskMrBump"]:
        if (auto_api.getContext("branch")=="simbad") and\
           (not data["revision"] or (float(data["Rfree"])>0.3)):
            auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"),"autoMR" )
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

    elif crTask._type=="TaskDeposition":
        auto_tasks.remark ( "rem_deposition","The End",6,"",crTask.autoRunName )

    return
