##!/usr/bin/python

# python-3 ready

#  !!! OBSOLETE AND DYSFUNCTIONAL MUST BE REWRITTEN OR DELETED  !!!

#
# ============================================================================
#
#    24.03.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  MR workflow template
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
#
# ============================================================================
#

#import json
from   pycofe.varut  import jsonut
from   pycofe.auto   import auto_api


# ============================================================================
# Main function

def makeNextTask ( taskType,data ):

    if taskType=="TaskCCP4go2":
        if "xyz" in data and data["xyz"]:
            auto_api.addTask     ( "modelprepxyz","TaskModelPrepXYZ" )
            auto_api.addTaskData ( "modelprepxyz","xyz",data["xyz"]  )
            auto_api.addTaskData ( "modelprepxyz","seq",data["seq"][0] )
            auto_api.addContext  ( "hkl",data["hkl"]    )
            auto_api.addContext  ( "seq",data["seq"][0] )
            auto_api.addContext  ( "xyz",data["xyz"]    )
        else:
            auto_api.addTask     ( "ensprepxyz","TaskEnsemblePrepSeq" )
            auto_api.addTaskData ( "ensprepxyz","seq",data["seq"][0] )
            auto_api.addContext  ( "hkl",data["hkl"]    )
            auto_api.addContext  ( "seq",data["seq"][0] )
            #auto_api.addTaskParameter ( "ensprepxyz","RLEVEL_SEL","95" )
            #auto_api.addTaskParameter ( "ensprepxyz","MRNUM","1" )

    elif taskType=="TaskModelPrepXYZ" or taskType=="TaskEnsemblePrepSeq":
        auto_api.addTask     ( "asu","TaskASUDef" )
        auto_api.addTaskData ( "asu","hkl",auto_api.getContext("hkl") )
        auto_api.addTaskData ( "asu","seq",auto_api.getContext("seq") )
        auto_api.addContext  ( "model",data["model"] )
        auto_api.addContext  ( "model-1",data["model"] )

    elif taskType=="TaskASUDef":
        auto_api.addTask     ( "phaser-mr","TaskPhaserMR" )
        auto_api.addTaskData ( "phaser-mr","revision",data["revision"] )
        auto_api.addTaskData ( "phaser-mr","model"   ,auto_api.getContext("model") )
        auto_api.addTask     ( "phaser-mr-1","TaskPhaserMR" )
        auto_api.addTaskData ( "phaser-mr-1","revision",data["revision"] )
        auto_api.addTaskData ( "phaser-mr-1","model"   ,auto_api.getContext("model-1") )

    return
