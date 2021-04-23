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
from   pycofe.auto   import  template_autoREL

# ============================================================================
# Main function

def makeNextTask ( crTask,data ):

    if crTask._type=="TaskWFlowAMR":
        auto_api.addContext ( "mr_engine",data["mr_engine"] )
        auto_api.addContext ( "mb_engine",data["mb_engine"] )
        auto_tasks.store ( data["unm"],data["hkl"],data["seq"],data["lig"],data["ligdesc"] )
        # if data["ligdesc"]:
        #     auto_tasks.make_ligand ( "mkligand",data["ligdesc"], crTask.autoRunName )
        #     return
        if not auto_tasks.aimless ( "aimless",crTask.autoRunName ):
            auto_tasks.simbad ( "simbad","L",crTask.autoRunName)


    elif crTask._type=="TaskAimless":
        if len(data["hkl"])>0:
            auto_api.addContext ( "hkl",data["hkl"][0] )
            auto_tasks.simbad ( "simbad","L",crTask.autoRunName )

    elif crTask._type=="TaskSimbad":
        if not data["revision"] or (float(data["Rfree"])>0.45):
            auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"))
        else:
            auto_tasks.build ( "simbad_mb",data["revision"],crTask.autoRunName )

    elif crTask._type=="TaskASUDef":  # could be elif crTask.autoRunName.startsWith("asu")
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
        auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)

    else:
        template_autoREL.makeNextTask(crTask, data)


    return
