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
#  Auto-EP workflow template
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

    if crTask._type=="TaskWFlowDPL":
        auto_tasks.store(data["unm"], data["hkl"], data["seq"], data["lig"], data["ligdesc"])
        auto_tasks.dimple("dimple", data["revision"], crTask.autoRunName)
        return
        # if len(data["unm"]) > 0:
        #     auto_tasks.aimless ( "aimless", crTask.autoRunName )
        #     return
        # else:
        #     auto_tasks.dimple("dimple", data["revision"], crTask.autoRunName)
        #     return

    # elif crTask._type=="TaskAimless":
    #     auto_api.addContext ( "hkl",data["hkl"][0] )
    #     auto_tasks.asu("asu", crTask.autoRunName)  # auto_api.getContext("hkl_node"),"autoEP" )
    #     return
    #
    #
    # elif crTask._type=="TaskASUDef":
    #     auto_tasks.editrevision('editrevision', data["revision"], crTask.autoRunName)
    #     return
    #
    #
    # elif crTask._type=="TaskEditRevision":
    #     auto_tasks.dimple("dimple", data["revision"], crTask.autoRunName)
    #     return


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

    # debugging: send 3rd parameter of makeNextTask as in pycofe/tasks/crank2.py, after that auto_api.log("text") will print into Error tab.

    # Old code archive

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
