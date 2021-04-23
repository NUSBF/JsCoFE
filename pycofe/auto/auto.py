##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    23.04.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev 2021
#
# ============================================================================
#

#import json
#from   pycofe.varut  import jsonut

from   pycofe.auto   import template_autoMR
from   pycofe.auto   import template_autoEP
from   pycofe.auto   import template_autoREL
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
    elif crTask.autoRunId=="auto-REL":
        template_autoREL.makeNextTask ( crTask,data )

    else:
        raise ValueError('From auto.py:makeNextTask got unknown crTask.autoRunId: %s .' % crTask.autoRunId)

    auto_api.writeAutoMeta()

    return
