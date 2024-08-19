##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    20.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Auto-EP workflow template
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev, Maria Fando 2021-2023
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

    if crTask._type=="TaskWFlowAEP":
        auto_api.addContext ( "hatom",data["hatom"] )
        hkl = data["hkl"]
        for i in range(len(hkl)):
            hkl[i].wtype   = "peak"
            hkl[i].ha_type = data["hatom"]
        # store will do addContext for all parameters
        auto_tasks.store ( data["unm"],hkl,data["seq"],data["lig"],data["ligdesc"] )
        # unmerged data present -> aimless, otherwise ASU
        if len(data["unm"]) > 0:
            auto_tasks.aimless ( "aimless", crTask.autoRunName )
        else:
            # def asu ( name,parentName ) # branchName
            auto_tasks.asu ( "asu", crTask.autoRunName ) # auto_api.getContext("hkl_node"), # "autoEP" ) # branchName


    elif crTask._type=="TaskAimless":
        data["hkl"][0].wtype   = "peak"
        data["hkl"][0].ha_type = auto_api.getContext("hatom")
        auto_api.addContext ( "hkl",data["hkl"][0] )
        auto_tasks.asu ( "asu", crTask.autoRunName) # auto_api.getContext("hkl_node"),"autoEP" )


    elif crTask._type=="TaskASUDef":
        auto_api.addTask     ( "crank2","TaskCrank2",crTask.autoRunName )
        auto_api.addTaskData ( "crank2","revision",data["revision"] )


    elif crTask._type=="TaskCrank2":
        if not data["revision"]:
            return
        resHi = float(data["revision"].HKL.dataset.RESO[1]) # RESO[0] is low res limit
        rFree = float(data["Rfree"])

        if rFree < 0.4:
            if resHi > 3.0:
                auto_tasks.lorestr("lorestr", data["revision"], crTask.autoRunName)
            else:
                auto_tasks.xyzWaters('xyzWatersRemoval', data["revision"], crTask.autoRunName)
                
        else: # Rfree > 0.4
            strTree = 'Sorry, automated phasing seems to fail as Rfree is only %0.3f (look inside for more comments)' % rFree
            strText = 'Although automated phasing seems to fail on your structure, there is chance you can solve the structure manually.\n' + \
                      'First of all, try to clone CRANK2 job and give it as much additional information as possible: exact wavelength, ' + \
                      'expected number of heavy atoms, etc.\n' + \
                      'Also, please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                      'Finally, you can try to solve the structure manually using SHELX, Phaser and other useful programs.\n'

            auto_tasks.remark("rem_sorry1", strTree, 9, strText, crTask.autoRunName) # 9 - Red


    elif crTask._type=="TaskLorestr":
        auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)

    elif crTask._type == "TaskXyzUtils":
        auto_api.addContext("xyz_taskName", crTask.autoRunName)
        auto_api.addContext("xyz_revision", data["revision"])
        resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
        # excludedTasks = auto_api.getContext('excludedTasks')
            
        auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)

        return
    


    else:
        template_autoREL.makeNextTask(crTask, data)


    return

   