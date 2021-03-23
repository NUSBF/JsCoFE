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
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
#
# ============================================================================
#

#import json
#from   pycofe.varut  import jsonut
from   pycofe.auto   import template_autoMR, auto_api


# ============================================================================
# Main function

def makeNextTask ( crTask,data ):

    if crTask.autoRunId=="autoMR":
        template_autoMR.makeNextTask ( crTask._type,data )

    # elif crTask.autoRunId=="autoEP":
    #    etc etc

    auto_api.writeAutoMeta()

    return
