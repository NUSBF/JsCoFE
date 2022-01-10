##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    30.06.21   <--  Date of Last Modification.
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
# Information exchange


# Parent task and revision for the build tasks
# auto_api.addContext("build_parent", crTask.autoRunName)
# auto_api.addContext("build_revision"


# After Buccaneer
# auto_api.addContext("buccaneer_rfree", data["Rfree"])
# auto_api.addContext("buccaneer_taskName", crTask.autoRunName)
# auto_api.addContext("buccaneer_revision", data["revision"])


# ============================================================================
# Main function

def makeNextTask ( crTask,data ):

    if crTask._type=="TaskWFlowSMR":
        auto_tasks.store ( data["unm"],data["hkl"],data["seq"],data["lig"],data["ligdesc"] )
        auto_api.addContext("xyz", data["xyz"])
        # unmerged data present -> aimless, otherwise make asu for MR
        if len(data["unm"]) > 0:
            auto_tasks.aimless ( "aimless", crTask.autoRunName )
        else:
            auto_tasks.asu("asu", crTask.autoRunName)
        return


    elif crTask._type=="TaskAimless":
        if len(data["hkl"])>0:
            auto_api.addContext ( "hkl",data["hkl"][0] )
            auto_tasks.asu("asu", crTask.autoRunName)
        return


    elif crTask._type=="TaskASUDef":  # could be elif crTask.autoRunName.startsWith("asu")
        auto_tasks.modelprepXYZ('modelprepxyz', data['revision'], crTask.autoRunName)
        return


    elif crTask._type=="TaskModelPrepXYZ":
        auto_tasks.phaserFirst('phaser', data['model'], crTask.autoRunName)
        return

    elif crTask._type=="TaskPhaserMR":

        if data['Rfree'] < 0.35:
            auto_api.addContext("build_parent", crTask.autoRunName)
            auto_api.addContext("build_revision", data["revision"])
            auto_tasks.buccaneer("buccAfterPhaser", data["revision"], crTask.autoRunName)
            return

        # "Rfree"
        # "nfitted0" # number of polymers before run
        # "nfitted" # number of polymers after run
        # "nasu"  # number of predicted subunits
        if data['nfitted'] > data['nfitted0']: # trying to fit more subunits
            if data['nfitted'] < data['nasu']: # if number of subunits is not exceeding predicted
                auto_tasks.phaserNext('phaser' + str(data['nfitted']), data['revision'], crTask.autoRunName)
                return

        # no subunits to fit, but high Rfree
        # go into refinement and see what's happened?
        auto_tasks.refmac_jelly("jellyAfterPhaser", data["revision"], crTask.autoRunName)
        return


    elif crTask._type=="TaskBuccaneer":
        # save rfree, completness
        auto_api.addContext("buccaneer_rfree", data["Rfree"])
        auto_api.addContext("buccaneer_taskName", crTask.autoRunName)
        auto_api.addContext("buccaneer_revision", data["revision"])
        resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
        excludedTasks = auto_api.getContext('excludedTasks')

        if float(data["Rfree"]) < 0.3 : # No other rebuilding if Buccaneer performed well
            if resHi > 3.0:
                auto_tasks.lorestr("lorestr", data["revision"], crTask.autoRunName)
            else:
                auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)
        else:
            # Buccaneer performed not very well, Rfree > 0.3
            # First choice in now ARP/wARP (if resolution permits and if installed), then CCP4Build
            if ("warpbin" in os.environ) and (resHi <= 2.5) and ('TaskArpWarp' not in excludedTasks):
                auto_tasks.arpwarp("arpwarp", auto_api.getContext("build_revision"),auto_api.getContext("build_parent"))
            else:
                auto_tasks.ccp4build ( "ccp4Build",auto_api.getContext("build_revision"),auto_api.getContext("build_parent") )
        return


    elif crTask._type == "TaskArpWarp":
        auto_api.addContext("arpWarp_rfree", data["Rfree"])
        auto_tasks.xyzWaters('xyzWatersRemoval', data["revision"], crTask.autoRunName)
        return


    elif crTask._type == "TaskXyzUtils":
        parentTask = crTask.autoRunName
        revision = data["revision"]
        resHi = float(data["revision"].HKL.dataset.RESO[1]) # RESO[0] is low res limit
        if resHi > 3.0:
            auto_tasks.refmac_jelly("refAfterArpwarpHOHremoval", revision, parentTask, ncyc=10)
        else:
            auto_tasks.refmac("refAfterArpwarpHOHremoval", revision, parentTask)
        return


    elif crTask._type == "TaskCCP4Build":
        if float(data["Rfree"]) > float(auto_api.getContext("buccaneer_rfree")):
            parentTask = auto_api.getContext("buccaneer_taskName")
            revision = auto_api.getContext("buccaneer_revision")
        else:
            parentTask = crTask.autoRunName
            revision = data["revision"]

        resHi = float(data["revision"].HKL.dataset.RESO[1]) # RESO[0] is low res limit
        if resHi > 3.0:
            auto_tasks.lorestr("lorestr", revision, parentTask)
        else:
            auto_tasks.refligWF("refligWF_", revision, parentTask)
        return


    elif crTask._type=="TaskLorestr":
        auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)
        return


    elif crTask._type=="TaskRefmac":

        if crTask.autoRunName == 'refAfterArpwarpHOHremoval':
            if float(data["Rfree"]) > float(auto_api.getContext("buccaneer_rfree")):
                parentTask = auto_api.getContext("buccaneer_taskName")
                revision = auto_api.getContext("buccaneer_revision")
            else:
                parentTask = crTask.autoRunName
                revision = data["revision"]
            resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
            if resHi > 3.0:
                auto_tasks.lorestr("lorestr", revision, parentTask)
            else:
                auto_tasks.refligWF("refligWF_", revision, parentTask)
            return

        elif crTask.autoRunName == 'jellyAfterPhaser':
            if float(data["Rfree"])<0.4:
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.buccaneer("buccAfterMorda", data["revision"], crTask.autoRunName)
                return
            elif float(data["Rfree"]) > 0.5:
                strTree = 'Sorry, simple MR seems to fail (click remark for more comments)'
                strText = 'Although simple MR seems to fail on your structure, there is chance you can solve the structure with another search model.\n' + \
                          'You may give a try to the Auto-MR Workflow that shall generate search models automatically basing on the homologues.\n' + \
                          'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                          'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                auto_tasks.remark("rem_sorry3", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                return
            else:
                # 0.4 < rFree < 0.5
                resHi = float(data["revision"].HKL.dataset.RESO[1])
                if resHi < 3.0:
                    strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                        data["Rfree"])
                    strText = 'Although simple MR seems to perform not very well on your structure, we will try to build into the available density.\n' + \
                              'Probability of success is not high though. \n' + \
                              'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                              'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models ' + \
                              'or try automated Auto-MR Workflow that will search the homologues for you.\n'
                    auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                    auto_api.addContext("build_parent", crTask.autoRunName)
                    auto_api.addContext("build_revision", data["revision"])
                    auto_tasks.buccaneer("buccAfterMorda", data["revision"], crTask.autoRunName)
                    return
                else:
                    # resolution > 3.0
                    strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                        data["Rfree"])
                    strText = 'Simple MR seems to perform not very well on your structure, we will not try to build into ' + \
                              'the available density as the resolution of your data seems to be lower than 3.0 A.\n' + \
                              'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                              'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models ' + \
                              'or try automated Auto-MR Workflow that will search the homologues for you.\n'
                    auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                    return

        # likely REFMAC from RefLig part
        else:
            template_autoREL.makeNextTask(crTask, data)


    else:
        template_autoREL.makeNextTask(crTask, data)


    return
