##!/usr/bin/python

#
# ============================================================================
#
#    05.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC CUSTOM WORKFLOW FRAMEWORK
#
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2023
#
# ============================================================================
#

#import json
#from   pycofe.varut  import jsonut

# from   pycofe.auto   import template_autoMR
# from   pycofe.auto   import template_autoEP
# from   pycofe.auto   import template_autoREL
# from   pycofe.auto   import template_autoDPL
# from   pycofe.auto   import template_simpleMR
# from   pycofe.auto   import template_afMR

from   pycofe.auto   import auto_api
import traceback
from   pycofe.etc    import citations


# ============================================================================
# Main function

def nextTask ( body,data,log=None ):
# for 'log',  self.file_stderr would normally do (debug option)
#
#  data = {  # output data objects to put in context
#      hkl : hkl  
#    }    
#  }
#
    

    try:

        crTask = body.task

        if crTask.autoRunId: # else workflow does not run

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

            # put data in context
            auto_api.addContext  ( crTask.autoRunName,data )

            nextRunName  = crTask.autoRunName
            nextTaskType = None
            while (crTask.script_pointer<len(crTask.script)) and (nextRunName==crTask.autoRunName):
                words = crTask.script[crTask.script_pointer].split()
                if len(words)>1 and words[0].startswith("@"):
                    nextRunName  = words[0]
                    nextTaskType = words[1]
                crTask.script_pointer = crTask.script_pointer + 1

            if nextTaskType:
                auto_api.addTask ( nextRunName,nextTaskType,crTask.autoRunName )
                for dtype in data:
                    if dtype in ["unm","hkl","xyz","seq","lig","lib","revision"]:
                        auto_api.addTaskData ( nextRunName,dtype,data[dtype] )

            # raise ValueError('From auto.py:makeNextTask got unknown crTask.autoRunId: %s .' \
            #                     % body.task.autoRunId)

            auto_api.writeAutoMeta()
            return True


    except Exception as inst:
        body.putMessage(str(type(inst)))  # the exception instance
        body.putMessage(str(inst.args))  # arguments stored in .args
        body.putMessage(str(inst))  # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.putMessage(str(tb))
        body.putMessage ( "<i>automatic workflow excepted</i>" )

    return False
