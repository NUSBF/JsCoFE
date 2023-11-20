##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    30.06.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Auto-MR workflow template
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
        auto_api.addContext('na', data['na'])

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
        auto_api.addContext("revisionForPhaser", data['revision'])
        auto_tasks.modelprepXYZ('modelprepxyz', crTask.autoRunName)
        return


    elif crTask._type=="TaskModelPrepXYZ":
        auto_api.addContext("modelForPhaser", data['model'])
        auto_tasks.phaserFirst('phaser', crTask.autoRunName)
        return

    elif crTask._type=="TaskPhaserMR":

        if data['Rfree'] < 0.35:
            auto_api.addContext("build_parent", crTask.autoRunName)
            auto_api.addContext("build_revision", data["revision"])
            auto_api.addContext("phaser_rfree", data["Rfree"])
            hasNA = auto_api.getContext("na")
            if hasNA:
                auto_tasks.refmac_jelly("jellyAfterNA", data["revision"], crTask.autoRunName)
            else:
                auto_tasks.modelcraft("modelcraftAfterPhaser", data["revision"], crTask.autoRunName)
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
        hasNA = auto_api.getContext("na")
        if hasNA:
            auto_tasks.refmac_jelly("jellyAfterNA", data["revision"], crTask.autoRunName)
        else:
            auto_tasks.refmac_jelly("jellyAfterPhaser", data["revision"], crTask.autoRunName)
        return
    
    elif crTask._type=="TaskModelCraft":
        # save rfree, completness
        prevRfree = auto_api.getContext("phaser_rfree")
        auto_api.addContext("modelcraft_rfree", data["Rfree"])
        auto_api.addContext("modelcraft_taskName", crTask.autoRunName)
        auto_api.addContext("modelcraft_revision", data["revision"])
        resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
        # excludedTasks = auto_api.getContext('excludedTasks')
        if float(data["Rfree"]) < 0.4 : # No other rebuilding if Modelcraft performed well

            auto_tasks.xyzWaters('xyzWatersRemoval', data["revision"], crTask.autoRunName)
        else:
       
            auto_tasks.ccp4build ( "ccp4Build", auto_api.getContext("build_revision"), auto_api.getContext("build_parent") )

        return

    # elif crTask._type == "TaskArpWarp":
    #     auto_api.addContext("arpWarp_rfree", data["Rfree"])
    #     auto_tasks.xyzWaters('xyzWatersRemoval', data["revision"], crTask.autoRunName)
    #     return

    elif crTask._type=="TaskMakeLigand":
        if data["ligand"]:
            auto_api.addContext ( "lig", data["ligand"] )
            ligand = data["ligand"]
            auto_tasks.fit_ligand("fitligand2", ligand, data["revision"], crTask.autoRunName)
        else:
            strTree = 'Sorry, ligand generation has failed - please check input parameters'
            strText = 'Please carefully check all the input parameters; you can re-run the task for making ' + \
                      'ligands by cloning and then enetering correct parameters.\n'
            auto_tasks.remark("rem_sorry3", strTree, 9, strText, crTask.autoRunName) # 9 - Red


    elif crTask._type=="TaskFitLigand":
        if crTask.autoRunName == "fitligand1":

            ligdesc = auto_api.getContext("ligdesc")
            if ligdesc:
                auto_tasks.make_ligand('makeLigand1', ligdesc, data["revision"], crTask.autoRunName)
                auto_api.addContext("makeLigand1_revision", data["revision"])
                auto_api.addContext("makeLigand1", crTask.autoRunName)
                return
        


        if crTask.autoRunName == "fitligand2":
        #     auto_tasks.refmac_vdw("refmacAfterLigand", data["revision"], crTask.autoRunName)
        # else:        
            
            if int(data["nfitted"]) > 0:

                auto_tasks.refmac_vdw("refmacAfterLigand", data["revision"], crTask.autoRunName)
                return
            
            elif int(data["nfitted"]) == 0:

            
                strTree = 'Sorry, could not fit a ligand (look inside for comments)'
                strText = 'Please carefully check all the input parameters and whether ligand has been generated correctly; ' + \
                        'you can re-run the task for fitting ligand by cloning and then enetering correct parameters.\n'
                # auto_tasks.remark("rem_sorry_FL", strTree, 9, strText, crTask.autoRunName) # 9 - Red
                # auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
                parentTask = auto_api.getContext("xyz_taskName")
                revision = auto_api.getContext("xyz_revision")
                auto_tasks.refmac_vdw("refmacAfterLigand", revision, parentTask)

                # auto_tasks.refmac_vdw("refmacAfterLigand",auto_api.getContext("makeLigand1_revision"), auto_api.getContext("makeLigand1"))
                return
            else:
                strTree = 'Sorry, could not fit a ligand (look inside for comments)'
                strText = 'Please carefully check all the input parameters and whether ligand has been generated correctly; ' + \
                        'you can re-run the task for fitting ligand by cloning and then enetering correct parameters.\n'


        if int(data["nfitted"]) > 0:
            auto_tasks.refmac_vdw("refmacAfterLigand", data["revision"], crTask.autoRunName)
        else:
            strTree = 'Sorry, could not fit a ligand (look inside for comments)'
            strText = 'Please carefully check all the input parameters and whether ligand has been generated correctly; ' + \
                      'you can re-run the task for fitting ligand by cloning and then enetering correct parameters.\n'
            auto_tasks.remark("rem_sorry_FL", strTree, 9, strText, crTask.autoRunName) # 9 - Red
            # auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
            auto_tasks.refmac_vdw("refmacAfterLigand", data["revision"], crTask.autoRunName)


    elif crTask._type=="TaskFitWaters":
        auto_tasks.refligWF("ref_afterLig_", data["revision"], crTask.autoRunName)


    # elif crTask._type=="TaskDeposition":
    elif crTask._type=="TaskPDBVal":
        strTree = 'Automated Workflow has finished succesfully (look inside for comments)'
        strText = 'Please carefully examine the report to get an idea about quality of automatically built structure..\n' + \
                  'Please do not deposit even if report looks reasonable, as nothing can substitute careful examination ' + \
                  'of the structure by a human expert. Please run COOT and use the report and COOT validation tools ' + \
                  'as guidance for further improvement of your structure.\n'
        auto_tasks.remark("rem_Last", strTree, 4, strText, crTask.autoRunName)  # 4 - Green
        return


    elif crTask._type == "TaskXyzUtils":
        auto_api.addContext("xyz_taskName", crTask.autoRunName)
        auto_api.addContext("xyz_revision", data["revision"])
        resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
        # excludedTasks = auto_api.getContext('excludedTasks')
        ligand = auto_api.getContext("lig")
        if ligand:
            auto_tasks.fit_ligand("fitligand1", ligand, data["revision"], crTask.autoRunName)
            return
        # ligand description present? we shall make a ligand

        ligdesc = auto_api.getContext("ligdesc")
        if ligdesc:
            auto_tasks.make_ligand('makeLigand1', ligdesc,data["revision"], crTask.autoRunName)
            return
            
        auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)

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

        elif crTask.autoRunName == 'jellyAfterNA':
            if float(data["Rfree"])<0.4:
                auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)
                return
            else:
                strTree = 'Large parts of the structure are likely missing as Rfree is only %0.3f (click for more comments)' % float(
                    data["Rfree"])
                strText = 'Simple MR seems to perform not very well on your structure, we will not try to build into ' + \
                          'the available density as the resolution of your data seems to be lower than 3.0 A.\n' + \
                          'Please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                          'You can also try to solve the structure manually using MOLREP or Phaser via carefully crafted search model or ensemle of models ' + \
                          'or try automated Auto-MR Workflow that will search the homologues for you.\n'
                auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
                return


        elif crTask.autoRunName == 'jellyAfterPhaser':
            if float(data["Rfree"])<0.4:
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.modelcraft("modelcraftAfterMorda", data["revision"], crTask.autoRunName)
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
                    auto_tasks.modelcraft("modelcraftAfterMorda", data["revision"], crTask.autoRunName)
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
