##!/usr/bin/python

#
# ============================================================================
#
#    09.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebede, Maria Fando 2021-2023
#
# ============================================================================
#

#import json
#from   pycofe.varut  import jsonut

from   pycofe.auto   import template_autoMR
from   pycofe.auto   import template_autoEP
from   pycofe.auto   import template_autoREL
from   pycofe.auto   import template_autoDPL
from   pycofe.auto   import template_autoDPLMR
from   pycofe.auto   import template_simpleMR
from   pycofe.auto   import template_afMR

from   pycofe.auto   import auto_api
import traceback
from   pycofe.etc    import citations


# ============================================================================
# Main function

def makeNextTask ( body,data,log=None ):
# for 'log',  self.file_stderr would normally do (debug option)

    try:

        if body.task.autoRunId:

            # prepare citation lists for passing down the project tree; this
            # must be done here because in general framework, citations are
            # put in place when task finishes

            body._add_citations ( citations.citation_list )
            for key in data:
                if hasattr(data[key],"citations"):
                    data[key].citations = body.citation_list

            auto_api.setLog ( body.file_stdout ) # auto_api.setLog ( log )
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
            elif body.task.autoRunId=="auto-DPLMR":
                template_autoDPLMR.makeNextTask ( body.task,data )
            elif body.task.autoRunId=="simple-MR":
                template_simpleMR.makeNextTask ( body.task,data )
            elif body.task.autoRunId=="af-MR":
                template_afMR.makeNextTask ( body.task,data )
            elif body.task.autoRunId=="auto-XDS":
                auto_api.addTask      ( "XDS3","TaskXDS3",body.task.autoRunName )
                auto_api.addTaskField ( "XDS3","xds_inp" ,data["xds_inp"] )

            else:
                return False
                # raise ValueError('From auto.py:makeNextTask got unknown crTask.autoRunId: %s .' \
                #                   % body.task.autoRunId)

            auto_api.writeAutoMeta()
            return True


    except Exception as inst:
        body.stderrln ( str(type(inst)))  # the exception instance
        body.stderrln ( str(inst.args))  # arguments stored in .args
        body.stderrln ( str(inst))  # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.stderrln ( str(tb))
        body.putMessage ( "<h3><i>automatic workflow excepted</i></h3>" )

    return False
