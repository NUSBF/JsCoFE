##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    24.03.21   <--  Date of Last Modification.
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

from   pycofe.auto   import template_autoMR
#from   pycofe.auto   import template_MR
from   pycofe.auto   import auto_api


# ============================================================================
# Main function

def makeNextTask ( crTask,data ):

    auto_api.initAutoMeta()

    if crTask.autoRunId=="autoMR":
        template_autoMR.makeNextTask ( crTask,data )

    # elif crTask.autoRunId=="MR":
    #     template_MR.makeNextTask ( crTask._type,data )

    # elif crTask.autoRunId=="autoEP":
    #    etc etc

    auto_api.writeAutoMeta()

    return
