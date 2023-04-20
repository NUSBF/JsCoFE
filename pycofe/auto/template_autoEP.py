##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    18.04.23   <--  Date of Last Modification.
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
                # auto_tasks.refligWF("refligWF_", data["revision"], crTask.autoRunName)
                auto_api.addContext("build_parent", crTask.autoRunName)
                auto_api.addContext("build_revision", data["revision"])
                auto_tasks.modelcraft( "modelcraftAfterSimbad",data["revision"],crTask.autoRunName )
        else: # Rfree > 0.4
            strTree = 'Sorry, automated phasing seems to fail as Rfree is only %0.3f (look inside for more comments)' % rFree
            strText = 'Although automated phasing seems to fail on your structure, there is chance you can solve the structure manually.\n' + \
                      'First of all, try to clone CRANK2 job and give it as much additional information as possible: exact wavelength, ' + \
                      'expected number of heavy atoms, etc.\n' + \
                      'Also, please double-check whether all input parameters were correct (including diffraction data and sequence).\n' + \
                      'Finally, you can try to solve the structure manually using SHELX, Phaser and other useful programs.\n'

            auto_tasks.remark("rem_sorry1", strTree, 9, strText, crTask.autoRunName) # 9 - Red

    elif crTask._type=="TaskModelCraft":
        # save rfree, completness
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
    
    elif crTask._type == "TaskXyzUtils":
        parentTask = crTask.autoRunName
        revision = data["revision"]
        resHi = float(data["revision"].HKL.dataset.RESO[1])  # RESO[0] is low res limit
        # excludedTasks = auto_api.getContext('excludedTasks')
        ligand = auto_api.getContext("lig")
        if ligand:
            auto_tasks.fit_ligand("fitligand1", ligand, data["revision"], crTask.autoRunName)
            return
        # ligand description present? we shall make a ligand

        ligdesc = auto_api.getContext("ligdesc")
        if ligdesc:
            auto_tasks.make_ligand('makeLigand1', ligdesc, data["revision"], crTask.autoRunName)
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
            if len(data["lig"]) > 0:
                    auto_api.addContext("lig", data["lig"][0])
            if len(data["ligdesc"]) > 0:
                auto_api.addContext("ligdesc", data["ligdesc"][0])
            auto_tasks.refligWF("refligWF_", revision, parentTask)
        return


    elif crTask._type=="TaskLorestr":
        auto_api.addContext("build_parent", crTask.autoRunName)
        auto_api.addContext("build_revision", data["revision"])
        auto_tasks.modelcraft( "modelcraftAfterSimbad",data["revision"],crTask.autoRunName )


    else:
        template_autoREL.makeNextTask(crTask, data)


    return




    # Old code archive


#     elif crTask._type=="TaskRefmac":
#
#         # many different REFMACs. Difference by task name
#         if crTask.autoRunName == 'refmacAfterLigand':
#             auto_tasks.fit_waters("fitwaters", data["revision"], crTask.autoRunName)
#             return
#
#         # Refinements until convergence - second round after ligand
#         if 'refWF_EPafterLig' in crTask.autoRunName:
#             nRun = int(auto_api.getContext("refmacClonedRun"))
#             if nRun <= 4: # depth check, not more than 4 verdict attempts
#                 if data['suggestedParameters'] and isinstance(data['suggestedParameters'], dict):
#                     if len(data['suggestedParameters'].keys()) > 0: # there are suggested parameters, so not converged yet
#                         auto_tasks.refmacSuggested("refWF_EPafterLig_", data["revision"], data['suggestedParameters'] )
#                         return
#             # If it comes down here, REFMAC second round after ligand seems to converge or maximal number of attempts is over.
#             auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
#
#         # Refinements until convergence - first round
#         if 'refWF_EP' in crTask.autoRunName:
#             nRun = int(auto_api.getContext("refmacClonedRun"))
#             if nRun <= 4: # depth check, not more than 4 verdict attempts
#                 if data['suggestedParameters'] and isinstance(data['suggestedParameters'], dict):
#                     if len(data['suggestedParameters'].keys()) > 0: # there are suggested parameters, so not converged yet
#                         auto_tasks.refmacSuggested("refWF_EP_", data["revision"], data['suggestedParameters'] )
#                         return
#
#             # If it comes down here, REFMAC first round seems to converge or maximal number of attempts is over.
#             # Now it is time for ligand part
#             # Fitting ligand if Rfree < 0.35
#             rFree = float(data["Rfree"])
#             if rFree > 0.35:
#                 strTree = 'Sorry, Rfree is only %0.3f, could not proceed with ligand and waters (look inside for comments)' % rFree
#                 strText = 'Rfree is too high; most likely substantial parts of the structure are missing.\n' + \
#                           'Please build as many aminoacid residues (and nucleic acid part, if present) as possible ' + \
#                           'before proceeding with ligand fitting and adding waters.\n'
#                 auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName) # 9 - Red
#             else:
#                 # ligand already made? Unlikely, but let us fit it!
#                 ligand = auto_api.getContext("lig")
#                 if ligand:
#                     auto_tasks.fit_ligand("fitligand1", ligand, data["revision"], crTask.autoRunName)
#                 # ligand description present? we shall make a ligand
#                 else:
#                     ligdesc = auto_api.getContext("ligdesc")
#                     if ligdesc:
#                         auto_tasks.make_ligand('makeLigand1', ligdesc, crTask.autoRunName)
#                     else: # no ligand at all
#                         auto_tasks.fit_waters("fitwaters", data["revision"], crTask.autoRunName)
#
#
#     elif crTask._type=="TaskMakeLigand":
#         if data["ligand"]:
#             auto_api.addContext ( "lig", data["ligand"] )
#             ligand = data["ligand"]
#             auto_tasks.fit_ligand("fitligand2", ligand, data["revision"], crTask.autoRunName)
#         else:
#             strTree = 'Sorry, ligand generation have failed - please check input parameters'
#             strText = 'Please carefully check all the input parameters; you can re-run the task for making ' + \
#                       'ligands by cloning and then enetering correct parameters.\n'
#             auto_tasks.remark("rem_sorry3", strTree, 9, strText, crTask.autoRunName) # 9 - Red
#
#
#     elif crTask._type=="TaskFitLigand":
#         if int(data["nfitted"]) > 0:
#             auto_tasks.refmac_vdw("refmacAfterLigand", data["revision"], crTask.autoRunName)
#         else:
#             # strTree = 'Sorry, could not fit a ligand (look inside for comments)'
#             # strText = 'Please carefully check all the input parameters and whether ligand has been generated correctly; ' + \
#             #           'you can re-run the task for fitting ligand by cloning and then enetering correct parameters.\n'
#             # auto_tasks.remark("rem_sorry4", strTree, 9, strText, crTask.autoRunName) # 9 - Red
#             auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
#
#     elif crTask._type=="TaskDeposition":
#         strTree = 'Automated Workflow have finished (look inside for comments)'
#         strText = 'Please carefully examine the report to get an idea about quality of automatically built structure..\n' + \
#                   'Please do not deposit even if report looks reasonable, nothing can substitute careful examination ' + \
#                   'of the structure by a human expert. Please run COOT and use its validation tools to guide you.\n'
#         auto_tasks.remark("rem_Last", strTree, 4, strText, crTask.autoRunName)  # 4 - Green
#
#
#     elif crTask._type=="TaskFitWaters":
#         auto_tasks.refligWF("refWF_EPafterLig_", data["revision"], crTask.autoRunName)
#
#
#
# #    elif crTask._type=="TaskRemark":
#
#
#     return
#
    # debugging: send 3rd parameter of makeNextTask as in pycofe/tasks/crank2.py, after that auto_api.log("text") will print into Error tab.


    # elif crTask._type=="TaskMakeLigand":
    #     if data["ligand"]:
    #         auto_api.addContext ( "lig",data["ligand"] )
    #         if not auto_tasks.aimless("aimless",crTask.autoRunName):
    #             auto_tasks.simbad ( "simbad","L",crTask.autoRunName,"simbad" )
    #     elif not auto_tasks.aimless("aimless","_root"):
    #         auto_tasks.simbad ( "simbad","L","_root","simbad" )

    # elif crTask._type in ["TaskCCP4Build","TaskBuccaneer"]:
    #     if (auto_api.getContext("branch")=="simbad") and\
    #        (not data["revision"] or (float(data["Rfree"])>0.3)):
    #         auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"),"autoEP" )
    #     if data["revision"] and (float(data["Rfree"])<0.4):
    #         if not auto_tasks.fit_ligand("fitligand",data["revision"],crTask.autoRunName):
    #             auto_tasks.refmac_jelly ( "refmac-jelly",data["revision"],crTask.autoRunName )

    #        auto_tasks.simbad ( "simbad","L",crTask.autoRunName,"simbad" )

    # elif crTask._type=="TaskSimbad":
    #     if not data["revision"] or (float(data["Rfree"])>0.45):
    #         auto_tasks.asu ( "asu",auto_api.getContext("hkl_node"),"autoEP" )
    #     else:
    #         auto_tasks.build ( "simbad_mb",data["revision"],crTask.autoRunName )

    # elif crTask._type=="TaskFitLigand":
    #     auto_tasks.refmac_jelly ( "refmac-jelly",data["revision"],crTask.autoRunName )

    # elif crTask._type=="TaskFitWaters":
    #     auto_tasks.refmac ( "refmac2",data["revision"],crTask.autoRunName )
    #
    # elif crTask._type=="TaskRefmac":
    #     if crTask.autoRunName=="refmac-jelly":
    #         if float(data["Rfree"])<0.4:
    #             auto_tasks.fit_waters ( "fitwaters",data["revision"],crTask.autoRunName )
    #     else:
    #         auto_tasks.deposition ( "deposition",data["revision"],crTask.autoRunName )


    # except Exception as inst:
    #     self.putMessage(str(type(inst)))  # the exception instance
    #     self.putMessage(str(inst.args))  # arguments stored in .args
    #     self.putMessage(str(inst))  # __str__ allows args to be printed directly,


# self.file_stderr.write(str(revision[0].__dict__))
# self.file_stderr.write(str(revision[0].HKL.dataset.RESO[1]))
# self.file_stderr.flush()
