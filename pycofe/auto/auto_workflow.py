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

from   pycofe.auto   import  auto_api
from   pycofe.auto   import  auto_tasks
import traceback
from   pycofe.etc    import  citations


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

            # auto_api.log ( " --- " + str(data["data"]["ligdesc"]) )

            # put data in context
            idata = auto_api.getContext ( "input_data" )
            if not idata:
                idata = {}
            if "data" in data:
                is_data = False
                for d in data["data"]:
                    auto_api.log ( " --- 1. " + d )
                    if len(data["data"][d])>0 and d!="revision":
                        auto_api.log ( " --- 2. " + d )
                        is_data  = True
                        if not d in idata:
                            idata[d] = []
                        for obj in data["data"][d]:
                            if type(obj) == dict:
                                idata[d].append ( obj )
                            else:
                                idata[d].append ( json.loads ( obj.to_JSON() ) )
                if is_data:
                    auto_api.addContext  ( "input_data",idata )

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

            nextRunName   = crTask.autoRunName
            crAutoRunName = nextRunName
            nextTaskType  = None
            # auto_api.log ( " >>>>>1 " + str(crTask.script_pointer ) )
            crTask.script_end_pointer = crTask.script_pointer
            while crTask.script_end_pointer<len(crTask.script) and nextRunName==crAutoRunName:
                # auto_api.log ( " # line " + str(crTask.script_end_pointer) + " " + crTask.script[crTask.script_end_pointer] )
                words = crTask.script[crTask.script_end_pointer].split()
                if len(words)>2 and words[0].startswith("@") and words[1]=="RUN":
                    nextRunName  = words[0]
                    nextTaskType = words[2]
                    # check that the setap is not conditional to availabilitgy of data
                    i = 0
                    while i<len(crTask.script) and nextTaskType:
                        w = crTask.script[i].split()
                        if len(w)>2 and w[0]==nextRunName and w[1]=="IFDATA":
                            j  = 2
                            ok = True
                            while j<len(w) and ok:
                                ok = w[j] in idata
                                j  = j + 1
                            if not ok:
                                crAutoRunName = nextRunName
                                nextTaskType  = None
                        i = i + 1
                # auto_api.log ( "       " + crAutoRunName + " " + nextRunName + " " + str(nextTaskType) )
                crTask.script_end_pointer = crTask.script_end_pointer + 1
                
            # auto_api.log ( " >>>>>2 " + str(crTask.script_end_pointer) + " " + str(nextTaskType) )

            if nextTaskType:

                # form new task
                if nextTaskType=="TaskMakeLigand":
                    auto_tasks.make_ligand ( nextRunName, idata["ligdesc"][0], 
                                             idata["revision"] if "revision" in idata else None,
                                             crTask.autoRunName )
                else:
                    auto_api.addTask ( nextRunName,nextTaskType,crTask.autoRunName )

                # add task data, revision from the previous task only
                if "data" in data:
                    cdata = data["data"]
                    if "revision" in cdata and len(cdata["revision"])>0:
                        auto_api.addTaskData ( nextRunName,"revision",cdata["revision"][0] )

                for dtype in idata:
                    if dtype in ["unmerged","hkl","xyz","seq","ligand","lib"] and\
                                len(idata[dtype])>0:
                        auto_api.addTaskData ( nextRunName,dtype,idata[dtype][0] )

                # add suggested task parameters (can be anywhere in script)
                if nextTaskType in suggestedParameters:
                    for line in crTask.script:
                        words = line.split()
                        if len(words)>1 and words[0]==nextRunName and words[1]=="USE_SUGGESTED_PARAMETERS":
                            for key in suggestedParameters[nextTaskType]:
                                auto_api.addTaskParameter ( nextRunName,key,suggestedParameters[nextTaskType][key] )

                # add specified task parameters (can be anywhere in script)
                for line in crTask.script:
                    words = line.split()
                    if len(words)>3 and words[0]==nextRunName and words[1]=="PARAMETER":
                         auto_api.addTaskParameter ( nextRunName,words[2],words[3] )


            else:
                auto_api.log ( " ***** WORKFLOW ERROR: next task type not identified" )

            # raise ValueError('From auto.py:makeNextTask got unknown crTask.autoRunId: %s .' \
            #                     % body.task.autoRunId)

            auto_api.writeAutoMeta()
            auto_api.log ( " >>>>>10 written" )
            return True


    except Exception as inst:
        body.putMessage(str(type(inst)))  # the exception instance
        body.putMessage(str(inst.args))  # arguments stored in .args
        body.putMessage(str(inst))  # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.putMessage(str(tb))
        body.putMessage ( "<i>automatic workflow excepted</i>" )

    return False
