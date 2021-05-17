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
from   pycofe.auto   import template_autoDPL
from   pycofe.auto   import auto_api
import traceback



# ============================================================================
# Main function

def makeNextTask ( body,data,log=None ):
# for 'log',  self.file_stderr would normally do (debug option)

    try:

        if body.task.autoRunId:

            auto_api.setLog ( log )
            auto_api.initAutoMeta()

            # auto_api.log ( " --- " + str(data) )

            if body.task.autoRunId=="auto-MR":
                template_autoMR.makeNextTask ( body.task,data )
            elif body.task.autoRunId=="auto-EP":
                template_autoEP.makeNextTask ( body.task,data )
            elif body.task.autoRunId=="auto-REL":
                template_autoREL.makeNextTask ( body.task,data )
            elif body.task.autoRunId=="auto-DPL":
                template_autoDPL.makeNextTask ( body.task,data )

            else:
                raise ValueError('From auto.py:makeNextTask got unknown crTask.autoRunId: %s .' \
                                  % body.task.autoRunId)

            auto_api.writeAutoMeta()
            return True

    # except:
    #     body.putMessage("<i>automatic workflow excepted</i>")


    except Exception as inst:
        body.putMessage(str(type(inst)))  # the exception instance
        body.putMessage(str(inst.args))  # arguments stored in .args
        body.putMessage(str(inst))  # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.putMessage(str(tb))
        body.putMessage ( "<i>automatic workflow excepted</i>" )

    return False
