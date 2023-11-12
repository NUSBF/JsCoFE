##!/usr/bin/python

#
# ============================================================================
#
#    11.11.23   <--  Date of Last Modification.
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

# class Variables(jsonut.jObject):
#     def __init__(self):
#         return
#     def from_dict ( self,dict ):
#         for key in dict:
#             self.key = dict[key]
#         return


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
            w = {}

            # put data in context
            wdata = auto_api.getContext_dict ( "input_data" )
            if not wdata:
                wdata = {
                    "variables" : w
                }
            elif "variables" in wdata:
                if type(wdata["variables"])==dict:
                    w = wdata["variables"]
                else:
                    w = wdata["variables"].to_dict()

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
            scores = auto_api.getContext_dict ( "scores" )
            if not scores:
                scores = {}
            if "scores" in data:
                for key in data["scores"]:
                    scores[key] = data["scores"][key]
                auto_api.addContext ( "scores",scores )
            for key in scores:
                w[key] = scores[key]

            # update suggestions
            suggestedParameters = auto_api.getContext_dict ( "suggestedParameters" )
            w["suggested"] = 0
            if not suggestedParameters:
                suggestedParameters = {}
            if "suggestedParameters" in data:
                for key in data["suggestedParameters"]:
                    suggestedParameters[key] = data["suggestedParameters"][key]
                    w["suggested"] = w["suggested"] + 1
                auto_api.addContext ( "suggestedParameters",suggestedParameters )

            # make comment-less copy of the script
            script = []
            for line in crTask.script:
                if "#" in line:
                    script.append ( line[:line.index("#")].strip() )
                else:
                    script.append ( line.strip() )

            # parse the script

            eval_parser   = Parser()  # algebraic parser

            nextTaskType  = None
            nextRunName   = None
            lno           = crTask.script_pointer
            parameters    = {}  # task parameters
            aliases       = {}  # data aliasess
            tdata         = {}  # specific task data from context
            use_suggested_parameters = False
            repeat_task   = False
            parse_error   = ""

            auto_api.log ( " --- " + str(crTask.script_pointer) )

            if lno<=0:
                # scroll script to the first RUN NAME
                while lno<len(script) and not nextRunName:
                    words = script[lno].split()
                    if len(words)>0:
                        if words[0].startswith("@"):
                            nextRunName = words[0]
                            if len(nextRunName)<2:
                                parse_error = " *** LINE " + str(lno) + ": empty RUN NAMES are not allowed"
                    lno = lno + 1

            while lno<len(script) and not nextTaskType and not parse_error:
                words  = script[lno].split()
                nwords = len(words)
                if nwords>0:
                    if words[0].startswith("@"):
                        nextRunName = words[0]
                        if len(nextRunName)<2:
                            parse_error = " *** LINE " + str(lno) + ": empty RUN NAMES are not allowed"
                    else:
                        w0u  = words[0].upper()
                        perr = " *** LINE " + str(lno) + ": " + w0u + " declared but not correctly defined"
                        if w0u=="IFDATA":
                            #  run is conditional to data availability
                            if len(words)<2:
                                parse_error = perr
                            else:
                                j  = 1
                                ok = True
                                while j<len(words) and ok:
                                    ok = words[j] in wdata
                                    j  = j + 1
                                if not ok:
                                    # some data is not available, scroll script to the next RUN
                                    lno = lno + 1
                                    ok  = True
                                    while lno<len(script) and ok:
                                        w0 = script[lno].split()[0].upper()
                                        if w0=="RUN":
                                            ok = False
                                        else:
                                            lno   = lno + 1
                                    # reset parser
                                    nextTaskType  = None
                                    nextRunName   = None
                                    parameters    = {}  # task parameters
                                    aliases       = {}  # data aliasess
                                    tdata         = {}  # specific task data from context
                                    use_suggested_parameters = False
                        elif w0u=="PARAMETER":
                            if nwords<3:
                                parse_error = perr
                            else:
                                parameters[words[1]] = words[2]
                        elif w0u=="ALIAS": 
                            if nwords<3:
                                parse_error = perr
                            else:
                                aliases[words[1]] = words[2]
                        elif w0u=="IDATA":
                            if nwords<3:
                                parse_error = perr
                            else:
                                tdata[words[1]] = words[2]
                        elif w0u=="USE_SUGGESTED_PARAMETERS":
                            use_suggested_parameters = True
                        elif w0u=="LET":
                            if nwords<2:
                                parse_error = perr
                            else:
                                expression = "".join(words[1:])
                                eqi = expression.index('=')
                                if eqi<=0:
                                    parse_error = perr
                                else:
                                    vname = expression[:eqi]
                                    try:
                                        value    = eval_parser.parse(expression[eqi+1:]).evaluate(w)
                                        w[vname] = value
                                    except:
                                        parse_error = perr
                        elif w0u=="REPEAT":
                            if nwords<4 or not words[1].startswith("@") or words[2].upper()!="WHILE":
                                parse_error = perr
                            else:
                                repeat_task = False
                                try:
                                    repeat_task = eval_parser.parse(" ".join(words[3:])).evaluate(w)
                                except:
                                    parse_error = perr
                                if repeat_task:
                                    lno = 0
                                    nextRunName = None
                                    while lno<len(script) and not nextRunName:
                                        ws = script[lno].split()
                                        if len(ws)>0 and ws[0]==words[1]:
                                            nextRunName = words[1]
                                        else:
                                            lno = lno + 1
                        elif w0u=="RUN":
                            if nwords<2:
                                parse_error = perr
                            else:
                                nextTaskType = words[1]
                        elif w0u=="END" or w0u=="STOP":
                            parse_error = "end"  # just sinal end of play
                lno = lno + 1

            crTask.script_end_pointer = lno

            auto_api.log ( " --- " + str(crTask.script_end_pointer) )
            auto_api.log ( " --- " + str(w) )

            if parse_error=="end":
                body.putMessage ( "<h3>Workflow finished</h3>" )
                return False

            if parse_error:
                body.stderrln   ( " *** WORKFLOW SCRIPT ERROR:" )
                body.stderrln   ( parse_error )
                body.putMessage ( "<h3>Workflow script error</h3>" + parse_error )
                return False

            if nextTaskType:

                if not nextRunName:
                    body.stderrln   ( " *** WORKFLOW SCRIPT ERROR:" )
                    body.stderrln   ( " RUN NAME is not defined"    )
                    body.putMessage ( "<h3>Workflow script error</h3>RUN NAME is not defined" )
                    return False

                # form new task
                if nextTaskType=="TaskMakeLigand":
                    auto_tasks.make_ligand ( nextRunName, wdata["ligdesc"][0], 
                                             wdata["revision"] if "revision" in wdata else None,
                                             crTask.autoRunName )
                else:
                    auto_api.addTask ( nextRunName,nextTaskType,crTask.autoRunName )

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

                # add suggested task parameters
                if nextTaskType in suggestedParameters and use_suggested_parameters:
                    for key in suggestedParameters[nextTaskType]:
                        auto_api.addTaskParameter ( nextRunName,key,suggestedParameters[nextTaskType][key] )

                # add specified task parameters
                for p in parameters:
                    auto_api.addTaskParameter ( nextRunName,p,parameters[p] )

                wdata["variables"] = w
                auto_api.addContext ( "input_data",wdata )

                auto_api.writeAutoMeta()
                return True

            return False


            """  ===========================================

            l1          = -1
            l2          = len(script)-1
            while lno<len(script):
                words = script[lno].split()
                if len(words)>0 and words[0].startswith("@") and words[0]!=crAutoRunName:
                    if not nextRunName:
                        nextRunName = words[0]
                        l1 = lno 
                    else:
                        l2 = lno - 1
                        break
                if nextRunName and len(words)>1:
                    w1u = words[0].upper()
                    if w1u=="IFDATA":
                        j  = 1
                        ok = True
                        while j<len(words) and ok:
                            ok = words[j] in wdata
                            j  = j + 1
                        if not ok:
                            crAutoRunName = nextRunName
                            nextRunName   = None
                            nextTaskType  = None
                            l1 = -1
                    elif w1u=="RUN":
                        nextTaskType = words[2]
                lno = lno +1

            if not nextRunName:  # no next step in the script
                return
            
            lend = lstart + 1
            n2   = nextRunName
            while lend<len(script) and n2==nextRunName:
                words = script[lend].split()
                if len(words)>0 and words[0].startswith("@"):
                    n2 = words[0]
                else:
                    lend = lend + 1









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
            """

    except Exception as inst:
        body.stderrln ( str(type(inst)))  # the exception instance
        body.stderrln ( str(inst.args))   # arguments stored in .args
        body.stderrln ( str(inst))        # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.stderrln ( str(tb))
        body.putMessage ( "<h3><i>automatic workflow excepted</i></h3>" )

    return False


"""
========== OLD SCRIPT SAMPLE


#
# -----------------------------------------------------
# Simple Dimple-with-ligand workflow example
# -----------------------------------------------------
#

# General workflow descriptors
NAME     dimple workflow
ONAME    dimple_wflow 
TITLE    Dimple MR Workflow with ligand fitting
DESC     custom DIMPLE workflow for high-homology cases 
KEYWORDS dimple workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED TYPES anomalous
!DATA XYZ          TYPES protein dna rna
DATA SEQ           TYPES protein dna rna
DATA LIGAND

# Workflow itself

@AIMLESS       IFDATA    unmerged
@AIMLESS       DATA      ds0        unmerged
@AIMLESS       RUN       TaskAimless

@DIMPLE        RUN       TaskDimpleMR

@MAKE_LIGAND   IFDATA    ligdesc  # can be a list of required data types
@MAKE_LIGAND   RUN       TaskMakeLigand

@REMOVE_WATERS IFDATA    ligand
@REMOVE_WATERS ALIAS     revision   istruct
@REMOVE_WATERS PARAMETER SOLLIG_SEL W
@REMOVE_WATERS RUN       TaskXyzUtils

@FIT_LIGAND    IFDATA    ligand
@FIT_LIGAND    PARAMETER SAMPLES 500
@FIT_LIGAND    RUN       TaskFitLigand

@FIT_WATERS    PARAMETER SIGMA 2.0
@FIT_WATERS    RUN       TaskFitWaters

@REFINE        USE_SUGGESTED_PARAMETERS
@REFINE        RUN       TaskRefmac

@VALIDATION    RUN       TaskPDBVal


========================================================================================================

#
# -----------------------------------------------------
# Simple Dimple-with-ligand workflow example
# -----------------------------------------------------
#

# General workflow descriptors
NAME     dimple workflow
ONAME    dimple_wflow 
TITLE    Dimple MR Workflow with ligand fitting
DESC     custom DIMPLE workflow for high-homology cases 
KEYWORDS dimple workflow  # for using in A-Z keyword search

ALLOW_UPLOAD  # create file upload widgets if started from project root

# List all data required, "!" specifies mandatory items
!DATA HKL UNMERGED TYPES anomalous
!DATA XYZ          TYPES protein dna rna
DATA SEQ           TYPES protein dna rna
DATA LIGAND

# Workflow itself

@AIMLESS       
    IFDATA    unmerged
    IDATA     ds0  unmerged
    RUN       TaskAimless

@DIMPLE        
    RUN       TaskDimpleMR

@MAKE_LIGAND   
    IFDATA    ligdesc  # can be a list of required data types
    RUN       TaskMakeLigand

@REMOVE_WATERS 
    IFDATA    ligand
    ALIAS     revision   istruct
    PARAMETER SOLLIG_SEL W
    RUN       TaskXyzUtils

@FIT_LIGAND    
    IFDATA    ligand
    PARAMETER SAMPLES 500
    RUN       TaskFitLigand

@FIT_WATERS
    PARAMETER SIGMA 2.0
    RUN       TaskFitWaters
    
@REFINE
    USE_SUGGESTED_PARAMETERS
    OPTIMIZE  TaskRefmac

let cnt = 1

@REFINE
    USE_SUGGESTED_PARAMETERS
    RUN       TaskRefmac

let cnt = cnt + 1
#jumpto @VALIDATION if cnt>4
repeat @REFINE while suggested>0 and cnt<5

# let cnt = cnt + 1
# repeat @REFINE if cnt<3

@VALIDATION
    RUN       TaskPDBVal

#

#

"""