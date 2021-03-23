##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    22.03.21   <--  Date of Last Modification.
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

#import json
from   pycofe.varut  import jsonut
from   pycofe.auto   import auto_api


# ============================================================================
# Main function

def makeNextTask ( taskType,data ):

    if taskType=="TaskCCP4go2":
        auto_api.addTask     ( "asu","TaskASUDef" )
        auto_api.addTaskData ( "asu","hkl",data["hkl"] )
        for i in range(len(data["seq"])):
            auto_api.addTaskData ( "asu","seq",data["seq"][i] )

    elif taskType=="TaskASUDef":
        auto_api.addTask          ( "morda","TaskMorda" )
        auto_api.addTaskData      ( "morda","revision",data["revision"] )
        auto_api.addTaskParameter ( "morda","ALTGROUPS_CBX",True )

    return
