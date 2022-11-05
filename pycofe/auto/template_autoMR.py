##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    05.11.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Auto-MR workflow template
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev, Maria Fando 2021-2022
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

# parent task for ASU
# auto_api.addContext("asu_parent", crTask.autoRunName)

# Rfree after MRBUMP
# auto_api.addContext("mrbump_rfree", data["Rfree"])

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

    if crTask._type=="TaskWFlowAMR":
        # auto_api.addContext ( "mr_engine",data["mr_engine"] )
        # auto_api.addContext ( "mb_engine",data["mb_engine"] )
        # if data["ligdesc"]:
        #     auto_tasks.make_ligand ( "mkligand",data["ligdesc"], crTask.autoRunName )
        #     return

        auto_tasks.store ( data["unm"],data["hkl"],data["seq"],data["lig"],data["ligdesc"] )
        # unmerged data present -> aimless, otherwise Simbad lattice
        if len(data["unm"]) > 0:
            auto_tasks.aimless ( "aimless", crTask.autoRunName )
        else:
            # auto_tasks.simbad ( "simbad","L", crTask.autoRunName)
            auto_tasks.asu("asu", crTask.autoRunName)
            return
        return


    elif crTask._type=="TaskAimless":
        if len(data["hkl"])>0:
            # auto_api.addContext("asu_parent", crTask.autoRunName)
            # auto_tasks.simbad ( "simbad","L",crTask.autoRunName )
            auto_api.addContext ( "hkl",data["hkl"][0] )
            auto_tasks.asu("asu", crTask.autoRunName)
            return
        else:
            strTree = 'Sorry, automated merging seems to fail (click remark for more comments)'
            strText = 'Please re-run merging manually with adjusted parameters; you can tick "Keep auto" box to keep automatic Workflow running.\n'
            auto_tasks.remark("rem_sorry33", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
            return



    elif crTask._type=="TaskSimbad":
        if crTask.autoRunName == 'simbadFull':
            # Full search SIMBAD at the very end
            if float(data["Rfree"])>0.5:
                strTree = 'Sorry, automated MR seems to fail (click remark for more comments)'
                strText = 'Although automated MR seems to fail on your structure, there is chance you can solve the structure manually.\n' + \
                          'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                          'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                auto_tasks.remark("rem_sorry3", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                return
            elif float(data["Rfree"])<0.4:
                strTree = 'Please carefully check SIMBAD results; it could be a contaminant rather than your target protein! (click for more details)'
                strText = 'SIMBAD has found a solution of your structure and this is definitely good news.\n' + \
                          'However, SIMBAD has performed full database search, including contaminants database (those are proteins which are ' + \
                          'relatively often purified by mistake instead of protein of interest).\n' + \
                          'Please carefully examine SIMBAD report to make sure you are currently not solving structure of some contaminant protein.\n'
                auto_tasks.remark("rem_sorry4", strTree, 7, strText, crTask.autoRunName)  # 7 - Gold - yellow
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.modelcraft("modelcraftAfterSimbad", data["revision"], crTask.autoRunName)
                return
            else:
                # 0.4 < Rfree < 0.5
                resHi = float(data["revision"].HKL.dataset.RESO[1])
                if resHi < 3.0:
                    strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                        data["Rfree"])
                    strText = 'Although automated MR seems to perform not very well on your structure, we will try to build into the available density.\n' + \
                              'Probability of success is not high though. \n' + \
                              'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                              'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                    auto_tasks.remark("rem_sorry5", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                    auto_api.addContext("build_parent", crTask.autoRunName)
                    auto_api.addContext("build_revision", data["revision"])
                    auto_tasks.modelcraft("modelcraftAfterSimbad", data["revision"], crTask.autoRunName)
                    return
                else:
                    strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                        data["Rfree"])
                    strText = 'Automated MR seems to perform not very well on your structure, we will not try to build into ' + \
                              'the available density as the resolution of your data seems to be lower than 3.0 A.\n' + \
                              'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                              'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                    auto_tasks.remark("rem_sorry5", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                    return
        else:
            # first SIMBAD, lattice search only
            if not data["revision"] or (float(data["Rfree"])>0.4):
                # auto_tasks.asu ( "asu", auto_api.getContext("asu_parent"))
                # running MRBUMP from ASU task
                revision = auto_api.getContext("starting_asu_revision")
                parent = auto_api.getContext("asu_task_name")
                auto_tasks.mrbump('mrbump', revision, parent, 5)
                return
            else:
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.modelcraft( "modelcraftAfterSimbad",data["revision"],crTask.autoRunName )
                return

    elif crTask._type=="TaskModelCraft":
        # save rfree, completness
        auto_api.addContext("modelcraft_rfree", data["Rfree"])
        auto_api.addContext("modelcraft_taskName", crTask.autoRunName)
        auto_api.addContext("modelcraft_revision", data["revision"])
        resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
        # excludedTasks = auto_api.getContext('excludedTasks')

        if float(data["Rfree"]) < 0.4 : # No other rebuilding if Modelcraft performed well
            if resHi > 3.0:
                auto_tasks.lorestr("lorestr", data["revision"], crTask.autoRunName)
            else:
                auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)
        else:
            # # Modelcraft performed not very well, Rfree > 0.3
            # # First choice in now ARP/wARP (if resolution permits and if installed), then CCP4Build
            # if ("warpbin" in os.environ) and (resHi <= 2.5) and ('TaskArpWarp' not in excludedTasks):
            #     auto_tasks.arpwarp("arpwarp", auto_api.getContext("build_revision"),auto_api.getContext("build_parent"))
            # else:
            #     auto_tasks.ccp4build ( "ccp4Build",auto_api.getContext("build_revision"),auto_api.getContext("build_parent") )
            auto_tasks.ccp4build ( "ccp4Build", auto_api.getContext("build_revision"), auto_api.getContext("build_parent") )
        
        return


    # elif crTask._type=="TaskBuccaneer":
    #     # save rfree, completness
    #     auto_api.addContext("buccaneer_rfree", data["Rfree"])
    #     auto_api.addContext("buccaneer_taskName", crTask.autoRunName)
    #     auto_api.addContext("buccaneer_revision", data["revision"])
    #     resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
    #     excludedTasks = auto_api.getContext('excludedTasks')

    #     if float(data["Rfree"]) < 0.3 : # No other rebuilding if Buccaneer performed well
    #         if resHi > 3.0:
    #             auto_tasks.lorestr("lorestr", data["revision"], crTask.autoRunName)
    #         else:
    #             auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)
    #     else:
    #         # Buccaneer performed not very well, Rfree > 0.3
    #         # First choice in now ARP/wARP (if resolution permits and if installed), then CCP4Build
    #         if ("warpbin" in os.environ) and (resHi <= 2.5) and ('TaskArpWarp' not in excludedTasks):
    #             auto_tasks.arpwarp("arpwarp", auto_api.getContext("build_revision"),auto_api.getContext("build_parent"))
    #         else:
    #             auto_tasks.ccp4build ( "ccp4Build",auto_api.getContext("build_revision"),auto_api.getContext("build_parent") )
    #     return


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
        if float(data["Rfree"]) > float(auto_api.getContext("modelcraft_rfree")):
            parentTask = auto_api.getContext("modelcraft_taskName")
            revision = auto_api.getContext("modelcraft_revision")
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


    elif crTask._type=="TaskASUDef":  # could be elif crTask.autoRunName.startsWith("asu")
        strTree = 'Quick MrBump run (click for details)'
        strText = 'In this MRBUMP run (to make it quick) we will do MR search with only 5 top models (basing on sequence alignment). \n' + \
                  'If results are suboptimal, please clone and re-run this task with 10-20 or even more search models. \n' + \
                  'Number of models is specified by "Maximum no. of models to test" parameter.\n' + \
                  'Please be patient as such run may take many hours and even couple of days, ' + \
                  'but then it may provide a good solution of your structure.\n'
        # auto_tasks.remark("rem_mrbComment", strTree, 5, strText, crTask.autoRunName)  # 5 - Cyan

        # auto_tasks.mrbump('mrbump', data['revision'], crTask.autoRunName, 5)
        auto_api.addContext("starting_asu_revision", data["revision"])
        auto_api.addContext("asu_task_name", crTask.autoRunName)
        auto_tasks.simbad("simbad", "L", data['revision'], crTask.autoRunName)
        return


    elif crTask._type=="TaskMrBump":
        auto_api.addContext("mrbump_rfree", data["Rfree"])
        auto_tasks.refmac_jelly("jellyAfterMRBUMP", data["revision"], crTask.autoRunName)
        return


    elif crTask._type=="TaskMorda":
        if not data["revision"]:
            if (os.path.isfile(os.path.join(os.environ["CCP4"], "share", "mrd_data", "VERSION")) or \
                    os.path.isfile(os.path.join(os.environ["CCP4"], "lib", "py2", "morda", "LINKED"))):
                revision = auto_api.getContext("starting_asu_revision")
                parent = auto_api.getContext("asu_task_name")
                auto_api.addTask("morda", "TaskMorda", parent)
                auto_api.addTaskData("morda", "revision", revision)
                auto_api.addTaskParameter("morda", "ALTGROUPS_CBX", True)
                return
            else:
                strTree = 'Sorry, automated MR seems to fail (click remark for more comments)'
                strText = 'Although automated MR seems to fail on your structure, there is chance you can solve the structure manually.\n' + \
                          'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                          'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                auto_tasks.remark("rem_sorry13", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
        else:
            auto_tasks.refmac_jelly ( "jellyAfterMorda",data["revision"],crTask.autoRunName )
        return


    elif crTask._type=="TaskRefmac":

        if crTask.autoRunName == 'refAfterArpwarpHOHremoval':
            if float(data["Rfree"]) > float(auto_api.getContext("modelcraft_rfree")):
                parentTask = auto_api.getContext("modelcraft_taskName")
                revision = auto_api.getContext("modelcraft_revision")
            else:
                parentTask = crTask.autoRunName
                revision = data["revision"]
            resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
            if resHi > 3.0:
                auto_tasks.lorestr("lorestr", revision, parentTask)
            else:
                auto_tasks.refligWF("refligWF_", revision, parentTask)
            return


        elif crTask.autoRunName == 'jellyAfterMRBUMP':
            if float(data["Rfree"])>0.4:
                # not solved; trying Morda if installed
                if (os.path.isfile(os.path.join(os.environ["CCP4"],"share","mrd_data","VERSION")) or \
                    os.path.isfile(os.path.join(os.environ["CCP4"],"lib","py2","morda","LINKED"))):
                    auto_api.addTask          ( "morda","TaskMorda",crTask.autoRunName )
                    auto_api.addTaskData      ( "morda","revision",data["revision"] )
                    auto_api.addTaskParameter ( "morda","ALTGROUPS_CBX",True )
                    return
                else:
                    # Morda not installed
                    if float(data["Rfree"])<0.5:
                        resHi = float(data["revision"].HKL.dataset.RESO[1])
                        if resHi < 3.0:
                            strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(data["Rfree"])
                            strText = 'Although automated MR seems to perform not very well on your structure, we will try to build into the available density.\n' + \
                                      'Probability of success is not high though. \n' + \
                                      'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                                      'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                            auto_tasks.remark("rem_sorry1", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                            auto_api.addContext("build_parent", crTask.autoRunName)
                            auto_api.addContext("build_revision", data["revision"])
                            auto_tasks.modelcraft("modelcraftAfterMRBUMP_noMorda", data["revision"], crTask.autoRunName)
                            return
                        else:
                            strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                                data["Rfree"])
                            strText = 'Automated MR seems to perform not very well on your structure, we will not try to build into ' + \
                                      'the available density as the resolution of your data seems to be lower than 3.0 A.\n' + \
                                      'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                                      'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                            auto_tasks.remark("rem_sorry1", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                            return
                    else:
                        # last attempt to solve - full SIMBAD
                        auto_tasks.simbad("simbadFull", "LCS", data['revision'], crTask.autoRunName)

                        # strTree = 'Sorry, automated MR seems to fail (click remark for more comments)'
                        # strText = 'Although automated MR seems to fail on your structure, there is chance you can solve the structure manually.\n' + \
                        #           'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                        #           'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                        # auto_tasks.remark("rem_sorry23", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                        return
            else:
                # solved nicely by MRBUMP - goes to rebuilding
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.modelcraft("modelcraftAfterMrbump", data["revision"], crTask.autoRunName)
                return


        elif crTask.autoRunName == 'jellyAfterMorda':
            if float(data["Rfree"])<0.4:
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.modelcraft("modelcraftAfterMorda", data["revision"], crTask.autoRunName)
                return
            elif float(data["Rfree"]) > 0.5:
                # last attempt to solve - full SIMBAD
                auto_tasks.simbad("simbadFull", "LCS", data['revision'], crTask.autoRunName)
                # strTree = 'Sorry, automated MR seems to fail (click remark for more comments)'
                # strText = 'Although automated MR seems to fail on your structure, there is chance you can solve the structure manually.\n' + \
                #           'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                #           'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                # auto_tasks.remark("rem_sorry3", strTree, 9, strText, crTask.autoRunName)  # 9 - Red

                return
            else:
                # 0.4 < rFree < 0.5
                resHi = float(data["revision"].HKL.dataset.RESO[1])
                if resHi < 3.0:
                    strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                        data["Rfree"])
                    strText = 'Although automated MR seems to perform not very well on your structure, we will try to build into the available density.\n' + \
                              'Probability of success is not high though. \n' + \
                              'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                              'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                    auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                    auto_api.addContext("build_parent", crTask.autoRunName)
                    auto_api.addContext("build_revision", data["revision"])
                    auto_tasks.modelcraft("modelcraftAfterMorda", data["revision"], crTask.autoRunName)
                    return
                else:
                    # resolution > 3.0
                    strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                        data["Rfree"])
                    strText = 'Automated MR seems to perform not very well on your structure, we will not try to build into ' + \
                              'the available density as the resolution of your data seems to be lower than 3.0 A.\n' + \
                              'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                              'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models.\n'
                    auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                    return

        # likely REFMAC from RefLig part
        else:
            template_autoREL.makeNextTask(crTask, data)


    else:
        template_autoREL.makeNextTask(crTask, data)


    return
