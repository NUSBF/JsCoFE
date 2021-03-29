##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    29.03.21   <--  Date of Last Modification.
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
from   pycofe.auto   import template_autoEP
#from   pycofe.auto   import template_MR
from   pycofe.auto   import auto_api


# ============================================================================
# Main function

def makeNextTask ( crTask,data,log=None ):
# for 'log',  self.file_stderr would normally do (debug option)

    auto_api.setLog ( log )
    auto_api.initAutoMeta()

    # auto_api.log ( " --- " + str(data) )

    if crTask.autoRunId=="auto-MR":
        template_autoMR.makeNextTask ( crTask,data )
    elif crTask.autoRunId=="auto-EP":
        template_autoEP.makeNextTask ( crTask,data )

    auto_api.writeAutoMeta()

    return
