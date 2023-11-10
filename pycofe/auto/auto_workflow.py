##!/usr/bin/python

#
# ============================================================================
#
#    08.11.23   <--  Date of Last Modification.
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

from   pycofe.auto   import  auto_api
from   pycofe.auto   import  auto_tasks
import traceback
from   pycofe.etc    import  citations
from   pycofe.etc.py_expression_eval import Parser
from   pycofe.varut  import  jsonut


# ============================================================================

# Workflow context variables

# class Variables:
#     def __init__(self):
#         return
#     def from_dict ( self,dict ):
#         for key in dict:
#             self.key = dict[key]
#         return
#     def to_dict ( self ):
#         return self.__dict__
#     def set_value ( self,vname,value ):

class Variables(jsonut.jObject):
    def __init__(self):
        return


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

            # initialize workflow variables
            w = Variables()

            # put data in context
            wdata = auto_api.getContext ( "input_data" )
            if not wdata:
                wdata = {
                    "variables" : w.to_dict()
                }
            else:
                wdata = wdata.to_dict()
                if "variables" in wdata:
                    w.from_dict ( wdata["variables"] )

            if "data" in data:
                ddata = data["data"]
                for d in ddata:
                    # auto_api.log ( " --- 1. " + d )
                    if len(ddata[d])>0 and d!="revision":
                        # auto_api.log ( " --- 2. " + d )
                        if not d in wdata:
                            wdata[d] = []
                        for obj in ddata[d]:
                            if type(obj) == dict:
                                wdata[d].append ( obj )
                            else:
                                wdata[d].append ( json.loads ( obj.to_JSON() ) )

            # update scores and put them in variables 
            scores = auto_api.getContext ( "scores" )
            if not scores:
                scores = {}
            if "scores" in data:
                for key in data["scores"]:
                    scores[key] = data["scores"][key]
                auto_api.addContext ( "scores",scores )
            for key in scores:
                w.set_field ( key,scores[key] )

            # update suggestions
            suggestedParameters = auto_api.getContext ( "suggestedParameters" )
            if not suggestedParameters:
                suggestedParameters = {}
            if "suggestedParameters" in data:
                for key in data["suggestedParameters"]:
                    suggestedParameters[key] = data["suggestedParameters"][key]
                auto_api.addContext ( "suggestedParameters",suggestedParameters )

            # make comment-less copy of the script
            script = []
            for line in crTask.script:
                if "#" in line:
                    script.append ( line[:line.index("#")].strip() )
                else:
                    script.append ( line.strip() )

            nextRunName   = crTask.autoRunName
            crAutoRunName = nextRunName
            nextTaskType  = None
            # auto_api.log ( " >>>>>1 " + str(crTask.script_pointer ) )
            lno = crTask.script_pointer
            while lno<len(script) and nextRunName==crAutoRunName:
                # auto_api.log ( " # line " + str(crTask.lno) + " " + crTask.script[crTask.lno] )
                words = script[lno].split()
                if len(words)>2 and words[0].startswith("@") and words[1].upper()=="RUN":
                    nextRunName  = words[0]
                    nextTaskType = words[2]
                    # check that the setap is not conditional to availabilitgy of data
                    i = 0
                    while i<len(script) and nextTaskType:
                        w1 = script[i].split()
                        if len(w1)>2 and w1[0]==nextRunName and w1[1].upper()=="IFDATA":
                            j  = 2
                            ok = True
                            while j<len(w1) and ok:
                                ok = w1[j] in wdata
                                j  = j + 1
                            if not ok:
                                crAutoRunName = nextRunName
                                nextTaskType  = None
                        i = i + 1
                # elif words[0].lower()
                # auto_api.log ( "       " + crAutoRunName + " " + nextRunName + " " + str(nextTaskType) )
                lno = lno + 1

            crTask.script_end_pointer = lno

            # auto_api.log ( " >>>>>2 " + str(crTask.script_end_pointer) + " " + str(nextTaskType) )

            if nextTaskType:

                # form new task
                if nextTaskType=="TaskMakeLigand":
                    auto_tasks.make_ligand ( nextRunName, wdata["ligdesc"][0], 
                                             wdata["revision"] if "revision" in wdata else None,
                                             crTask.autoRunName )
                else:
                    auto_api.addTask ( nextRunName,nextTaskType,crTask.autoRunName )

                # hover script for all step-related instructions
                parameters = {}
                aliases    = {}
                tdata      = {}  # specific task data from context
                use_suggested_parameters = False
                for lno in range(len(script)):
                    line   = script[lno]
                    words  = line.split()
                    nwords = len(words)
                    if nwords>0 and words[0]==nextRunName:
                        w0u = words[0].upper()
                        w1u = words[1].upper()
                        if nwords==4:
                            if w1u=="PARAMETER":
                                parameters[words[2]] = words[3]
                            elif w1u=="ALIAS": 
                                aliases[words[2]] = words[3]
                            elif w1u=="DATA": 
                                tdata[words[2]] = words[3]
                        elif nwords==2 and w1u=="USE_SUGGESTED_PARAMETERS":
                            use_suggested_parameters = True
                        elif nwords>1 and w0u=="LET":
                            expression = "".join(words[1:])
                            eqi = expression.index('=')
                            if eqi<=0:
                                body.stderrln   ( " *** error in LET statement in workflow line " + str(lno) )
                                body.putMessage ( "<h3><i>Workflow error</i></h3><i>See error log</i>"       )
                                return
                            vname = expression[:eqi]
                            value = eval.parser.parse(expression[eqi+1:]).evaluate(w.to_dict())
                            w.set_field ( vname,value )

                # auto_api.log ( " >>> parameters " + str(parameters) )
                # auto_api.log ( " >>> aliases    " + str(aliases)    )

                # add task data, revision from the previous task only
                if "data" in data:
                    cdata = data["data"]
                    if "revision" in cdata and len(cdata["revision"])>0:
                        auto_api.addTaskData ( nextRunName,
                            aliases["revision"] if "revision" in aliases else "revision",
                            cdata["revision"] )

                for dtype in wdata:
                    if dtype in ["unmerged","hkl","xyz","seq","ligand","lib"] and\
                                len(wdata[dtype])>0:
                        auto_api.addTaskData ( nextRunName,
                            aliases[dtype] if dtype in aliases else dtype,
                            wdata[dtype] )

                for dtype in tdata:
                    auto_api.addTaskData ( nextRunName,dtype,wdata[tdata[dtype]] )

                # add suggested task parameters (can be anywhere in script)
                if nextTaskType in suggestedParameters and use_suggested_parameters:
                    for key in suggestedParameters[nextTaskType]:
                        auto_api.addTaskParameter ( nextRunName,key,suggestedParameters[nextTaskType][key] )

                # add specified task parameters (can be anywhere in script)
                for p in parameters:
                    auto_api.addTaskParameter ( nextRunName,p,parameters[p] )

            else:
                auto_api.log ( " ***** WORKFLOW ERROR: next task type not identified" )

            # raise ValueError('From auto.py:makeNextTask got unknown crTask.autoRunId: %s .' \
            #                     % body.task.autoRunId)

            wdata["variables"] = w.to_dict()
            auto_api.addContext ( "input_data",wdata )

            auto_api.writeAutoMeta()
            return True


    except Exception as inst:
        body.stderrln ( str(type(inst)))  # the exception instance
        body.stderrln ( str(inst.args))   # arguments stored in .args
        body.stderrln ( str(inst))        # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.stderrln ( str(tb))
        body.putMessage ( "<h3><i>automatic workflow excepted</i></h3>" )

    return False
