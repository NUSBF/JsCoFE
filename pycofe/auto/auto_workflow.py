##!/usr/bin/python

#
# ============================================================================
#
#    06.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC CUSTOM WORKFLOW FRAMEWORK
#
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2023
#
# ============================================================================
#

import json
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

            if log:
                auto_api.setLog ( log )
            else:
                auto_api.setLog ( body.file_stdout )
            auto_api.initAutoMeta()

            # auto_api.log ( " --- " + str(data) )

            # put data in context
            # auto_api.addContext  ( crTask.autoRunName,data )

            # update scores
            scores = auto_api.getContext ( "scores" )
            if not scores:
                scores = {}
            if "scores" in data:
                for key in data["scores"]:
                    scores[key] = data["scores"][key]
                auto_api.addContext ( "scores",scores )

            # update suggestions
            suggestedParameters = auto_api.getContext ( "suggestedParameters" )
            if not suggestedParameters:
                suggestedParameters = {}
            if "suggestedParameters" in data:
                for key in data["suggestedParameters"]:
                    suggestedParameters[key] = data["suggestedParameters"][key]
                auto_api.addContext ( "suggestedParameters",suggestedParameters )

            nextRunName  = crTask.autoRunName
            nextTaskType = None
            # auto_api.log ( " >>>>>1 " + str(crTask.script_pointer ) )
            crTask.script_end_pointer = crTask.script_pointer
            while (crTask.script_end_pointer<len(crTask.script)) and (nextRunName==crTask.autoRunName):
                words = crTask.script[crTask.script_end_pointer].split()
                if len(words)>2 and words[0].startswith("@") and words[1]=="RUN":
                    nextRunName  = words[0]
                    nextTaskType = words[2]
                crTask.script_end_pointer = crTask.script_end_pointer + 1
            # auto_api.log ( " >>>>>2 " + str(crTask.script_end_pointer ) )

            if nextTaskType:

                # form new task
                auto_api.addTask ( nextRunName,nextTaskType,crTask.autoRunName )

                # add task data
                for dtype in data["data"]:
                    if dtype in ["unm","hkl","xyz","seq","lig","lib","revision"]:
                        auto_api.addTaskData ( nextRunName,dtype,data["data"][dtype] )

                # add task parameters (can be anywhere in script)

                if nextTaskType in suggestedParameters:
                    for line in crTask.script:
                        words = line.split()
                        if len(words)>1 and words[0]==nextRunName and words[1]=="USE_SUGGESTED_PARAMETERS":
                            for key in suggestedParameters[nextTaskType]:
                                auto_api.addTaskParameter ( nextRunName,key,suggestedParameters[nextTaskType][key] )

                for line in crTask.script:
                    words = line.split()
                    if len(words)>3 and words[0]==nextRunName and words[1]=="PARAMETER":
                         auto_api.addTaskParameter ( nextRunName,words[2],words[3] )

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
