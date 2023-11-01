##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    01.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev, Maria Fando 2021-2023
#
# ============================================================================
#

import os

from   pycofe.varut  import  jsonut
from   pycofe.auto   import  auto_tasks
from   pycofe.auto   import  auto_api

# ============================================================================
# Meta parameters used for communication with different tasks
#
# heavy atom - also pick it up from non-auto tasks like shelx?
# auto_api.addContext ( "hatom",data["hatom"] )
#
# ligand
# auto_api.addContext("lig", lig[0])
# auto_api.addContext("ligdesc", ligdesc[0])


# ============================================================================
# Main function

def makeNextTask ( crTask,data ):

    # if crTask._type=="TaskWFlowDPL":
    #     auto_tasks.store_dpl(data["unm"], data["hkl"], data["lig"], data["ligdesc"])
    #     auto_api.addContext("xyz", data["xyz"])
    #     if len(data["seq"])>0:
    #         auto_api.addContext("seq", data["seq"])

    #         auto_tasks.editrevision ("TaskEditRevision", data["revision"], crTask.autoRunName )
    #     else:
    #         auto_api.getContext("revision")
    #         auto_tasks.dimple("dimple", data["revision"], crTask.autoRunName)
    #     return
    
    if crTask._type in ["TaskWFlowDPL","TaskMigrate"]:
        if len(data["lig"]) > 0:
            auto_api.addContext("lig", data["lig"][0])
        if len(data["ligdesc"]) > 0:
            auto_api.addContext("ligdesc", data["ligdesc"][0])
        auto_api.getContext("revision")
        auto_tasks.dimple("dimple", data["revision"], crTask.autoRunName)
        return
       
    elif crTask._type=="TaskEditRevision":
        auto_api.getContext("revision")

        auto_tasks.dimple("dimple", data["revision"], crTask.autoRunName)


    elif crTask._type=="TaskDimple":
        rFree = float(data["Rfree"])
        if rFree > 0.35:
            strTree = 'Sorry, Rfree is only %0.3f, could not proceed with ligand and waters (look inside for comments)' % rFree
            strText = 'Rfree is too high; most likely substantial parts of the structure are missing.\n' + \
                      'Please build as many aminoacid residues (and nucleic acid part, if present) as possible ' + \
                      'before proceeding with ligand fitting and adding waters.\n'
            auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName)  # 9 - Red
            return
        else:
            # ligand already made? Let us fit it!
            ligand = auto_api.getContext("lig")
            if ligand:
                auto_tasks.fit_ligand("fitligand1", ligand, data["revision"], crTask.autoRunName)
                return
            # ligand description present? we shall make a ligand
            else:
                ligdesc = auto_api.getContext("ligdesc")
                if ligdesc:
                    auto_tasks.make_ligand('makeLigand1', ligdesc, data["revision"], crTask.autoRunName)
                    return
                else:  # no ligand at all
                    auto_tasks.fit_waters("fitwaters", data["revision"], crTask.autoRunName)
                    return

    elif crTask._type=="TaskRefmac":
        # many different REFMACs. Difference by task name
        if crTask.autoRunName == 'refmacAfterLigand':
            auto_tasks.fit_waters("fitwaters", data["revision"], crTask.autoRunName)
            return

        # Refinements until convergence - second round after ligand
        if 'ref_afterLig' in crTask.autoRunName:
            nRun = int(auto_api.getContext("refmacClonedRun"))
            if nRun <= 4: # depth check, not more than 4 verdict attempts
                if data['suggestedParameters'] and isinstance(data['suggestedParameters'], dict):
                    if len(data['suggestedParameters'].keys()) > 0: # there are suggested parameters, so not converged yet
                        auto_tasks.refmacSuggested("ref_afterLig_", data["revision"], data['suggestedParameters'] )
                        return
            # If it comes down here, REFMAC second round after ligand seems to converge or maximal number of attempts is over.
            
            auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
            
            return

        # Refinements until convergence - first round
        if 'refligWF' in crTask.autoRunName:
            nRun = int(auto_api.getContext("refmacClonedRun"))
            if nRun <= 4: # depth check, not more than 4 verdict attempts
                if data['suggestedParameters'] and isinstance(data['suggestedParameters'], dict):
                    if len(data['suggestedParameters'].keys()) > 0: # there are suggested parameters, so not converged yet
                        auto_tasks.refmacSuggested("refligWF_", data["revision"], data['suggestedParameters'] )
                        return

            # If it comes down here, REFMAC first round seems to converge or maximal number of attempts is over.
            # Now it is time for ligand part
            # Fitting ligand if Rfree < 0.35
            rFree = float(data["Rfree"])
            if rFree > 0.35:
                strTree = 'Sorry, Rfree is only %0.3f, could not proceed with ligand and waters (look inside for comments)' % rFree
                strText = 'Rfree is too high; most likely substantial parts of the structure are missing.\n' + \
                          'Please build as many aminoacid residues (and nucleic acid part, if present) as possible ' + \
                          'before proceeding with ligand fitting and adding waters.\n'
                auto_tasks.remark("rem_sorry2", strTree, 9, strText, crTask.autoRunName) # 9 - Red
                return
            else:
                # ligand already made? Let us fit it!
                ligand = auto_api.getContext("lig")
                if ligand:
                    auto_tasks.fit_ligand("fitligand1", ligand, data["revision"], crTask.autoRunName)
                    return
                # ligand description present? we shall make a ligand
                else:
                    ligdesc = auto_api.getContext("ligdesc")
                    if ligdesc:
                        auto_tasks.make_ligand('makeLigand1', ligdesc, data["revision"], crTask.autoRunName)
                        return
                    else: # no ligand at all
                        auto_tasks.fit_waters("fitwaters", data["revision"], crTask.autoRunName)
                        return

    

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
            else:
                if int(data["nfitted"]) > 0:

                    auto_tasks.refmac_vdw("refmacAfterLigand", data["revision"], crTask.autoRunName)
                    return
            
                elif int(data["nfitted"]) == 0:

                
                    strTree = 'Sorry, could not fit a ligand (look inside for comments)'
                    strText = 'Please carefully check all the input parameters and whether ligand has been generated correctly; ' + \
                            'you can re-run the task for fitting ligand by cloning and then enetering correct parameters.\n'
                    auto_tasks.remark("rem_sorry_FL", strTree, 9, strText, crTask.autoRunName) # 9 - Red
                    # auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
                    # auto_tasks.refmac_vdw("refmacAfterLigand",auto_api.getContext("makeLigand1_revision"), auto_api.getContext("makeLigand1"))
                    return
                else:
                    strTree = 'Sorry, could not fit a ligand (look inside for comments)'
                    strText = 'Please carefully check all the input parameters and whether ligand has been generated correctly; ' + \
                            'you can re-run the task for fitting ligand by cloning and then enetering correct parameters.\n'
        


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
                auto_tasks.remark("rem_sorry_FL", strTree, 9, strText, crTask.autoRunName) # 9 - Red
                # auto_tasks.deposition("deposition", data["revision"], crTask.autoRunName)
                auto_tasks.refmac_vdw("refmacAfterLigand",auto_api.getContext("makeLigand1_revision"), auto_api.getContext("makeLigand1"))
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
            # auto_tasks.remark("rem_sorry_FL", strTree, 9, strText, crTask.autoRunName) # 9 - Red
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



    return

   