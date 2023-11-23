##!/usr/bin/python

#
# ============================================================================
#
#    22.11.23   <--  Date of Last Modification.
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

from   pycofe.auto   import  auto_api2
from   pycofe.auto   import  auto_tasks2
import traceback
from   pycofe.etc    import  citations
from   pycofe.etc.py_expression_eval import Parser
# from   pycofe.varut  import  jsonut


# ============================================================================

def scrollToRunName ( script,runName ):
    lno = 0
    nextRunName = None
    while lno<len(script) and not nextRunName:
        words = script[lno].split()
        if len(words)>0 and \
                ( not runName and (words[0].startswith("@") or \
                     words[0].upper() in ["LET","REPEAT","PRINT_VAR","END","STOP"] ) or \
                  runName==words[0]
                ):
            nextRunName = words[0]
        else:
            lno = lno + 1
    return (lno,nextRunName)


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
                auto_api2.setLog ( log )
            else:
                auto_api2.setLog ( body.file_stdout )
            auto_api2.initAutoMeta()

            # auto_api.log ( " --- " + str(data["data"]["ligdesc"]) )

            # initialize workflow variables
            w = {}

            # get workflow data from context
            wdata = auto_api2.getContext ( "input_data" )
            if not wdata:
                wdata = {
                    "variables" : w
                }
            else:
                w = wdata["variables"]

            if "variables" in data:
                for v in data["variables"]:
                    w[v] = data["variables"][v]

            if "data" in data:
                ddata = data["data"]
                for d in ddata:
                    # auto_api2.log ( " --- 1. " + d )
                    if len(ddata[d])>0:  # and d!="revision":
                        # auto_api2.log ( " --- 2. " + d )
                        if not d in wdata:
                            wdata[d] = []
                        for obj in ddata[d]:
                            if obj:
                                if type(obj) == dict:
                                    wdata[d].append ( obj )
                                else:
                                    wdata[d].append ( json.loads ( obj.to_JSON() ) )

            # update scores and put them in variables 
            scores = auto_api2.getContext ( "scores" )
            if not scores:
                scores = {}
            if "scores" in data:
                for key in data["scores"]:
                    scores[key] = data["scores"][key]
                auto_api2.addContext ( "scores",scores )
            for key in scores:
                w[key] = scores[key]

            # update suggestions
            suggestedParameters = auto_api2.getContext ( "suggestedParameters" )
            w["suggested"] = 0
            if not suggestedParameters:
                suggestedParameters = {}
            if "suggestedParameters" in data:
                for key in data["suggestedParameters"]:
                    suggestedParameters[key] = data["suggestedParameters"][key]
                    w["suggested"] = w["suggested"] + len(data["suggestedParameters"][key])
                auto_api2.addContext ( "suggestedParameters",suggestedParameters )

            rev_list = [] 
            revision = None
            if "data" in data:
                cdata = data["data"]
                if "revision" in cdata and len(cdata["revision"])>0:
                    rev_list = cdata["revision"]
                    for i in range(len(rev_list)):
                        rev_list[i] = rev_list[i].to_dict()
                    revision = rev_list[0]
                    wdata["revision.hkl"] = [revision["HKL"]]

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
            repeat_mode   = ""  # no task repeat mode (default)
            parse_error   = ""

            # auto_api2.log ( " --- " + str(crTask.script_pointer) )

            # identify runs where project loops or branches
            branch_points = []
            for line in script:
                words = line.split()
                if len(words)>2 and words[0].upper() in ["REPEAT","BRANCH"]:
                    branch_points.append ( words[1] )
            auto_api2.log ( " --- branch_points=" + str(branch_points) )

            if lno<=0:
                # scroll script to the first RUN NAME
                lno,nextRunName = scrollToRunName ( script,"" )
                if nextRunName and len(nextRunName)<2:
                    parse_error = " *** LINE " + str(lno) + ": empty RUN NAMES are not allowed"

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
                        if w0u in ["IFDATA","IFNOTDATA","IF"]:
                            #  run is conditional to data availability
                            if len(words)<2:
                                parse_error = perr
                            else:
                                j  = 1
                                ok = True
                                if w0u=="IFDATA":
                                    while j<len(words) and ok:
                                        ok = words[j].lower() in wdata
                                        j  = j + 1
                                elif w0u=="IFNOTDATA":
                                    while j<len(words) and ok:
                                        ok = words[j].lower() not in wdata
                                        j  = j + 1
                                else:
                                    try:
                                        p  = " ".join(words[1:]).strip()
                                        ok = eval_parser.parse(p).evaluate(w)
                                    except:
                                        parse_error = perr + " (value)"
                                        ok = True
                                if not ok:
                                    # some data is not available, scroll script to the next RUN
                                    lno = lno + 1
                                    ok  = True
                                    while lno<len(script) and ok:
                                        if script[lno].strip().upper().startswith("RUN "):
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

                        elif w0u=="PARAMETER":  # task parameter
                            if nwords<3:
                                parse_error = perr
                            elif words[2].startswith("$"):
                                vname = words[2][1:]
                                if vname in w:
                                    parameters[words[1]] = w[vname]
                                else:
                                    parse_error = perr + " (variable " + vname + " not found)"
                            else:
                                p = " ".join(words[2:]).strip()
                                if (p.startswith('"') and p.endswith('"')) or\
                                   (p.startswith("'") and p.endswith("'")):
                                    parameters[words[1]] = p[1:len(p)-1]
                                else:
                                    try:
                                        parameters[words[1]] = eval_parser.parse(p).evaluate(w)
                                    except:
                                        parse_error = perr + " (value does not compute)"

                        elif w0u=="PROPERTY":  # data property
                            if nwords<4:
                                parse_error = perr
                            else:
                                dtype = words[1].lower()
                                if dtype not in wdata:
                                    parse_error = " *** LINE " + str(lno) + \
                                                  ": data type " + words[1] + \
                                                  " not found"
                                else:
                                    p = " ".join(words[3:]).strip()
                                    if (p.startswith('"') and p.endswith('"')) or\
                                       (p.startswith("'") and p.endswith("'")):
                                        wdata[dtype][0][words[2]] = p[1:len(p)-1]
                                    else:
                                        try:
                                            wdata[dtype][0][words[2]] = eval_parser.parse(p).evaluate(w)
                                        except:
                                            parse_error = perr + " (value does not compute)"

                        elif w0u=="ALIAS":   #  data alias if "inputId" is non-standard
                            if nwords<3:
                                parse_error = perr
                            else:
                                aliases[words[1]] = words[2]

                        elif w0u=="DATA":
                            if nwords<3:
                                parse_error = perr
                            else:
                                tdata[words[1]] = words[2]

                        elif w0u=="USE":  # choose from multiple data
                            if nwords<3 or words[1].upper()!="REVISION":
                                parse_error = perr
                            else:
                                # try:
                                if True:
                                    revno = eval_parser.parse("".join(words[2:])).evaluate(w)
                                    auto_api2.log ( "USE REVISION '" + str(revno) + "'" )
                                    if rev_list and revno<len(rev_list):
                                        revision = rev_list[revno]
                                        wdata["revision.hkl"] = [revision["HKL"]]
                                    else:
                                        auto_api2.log ( 
                                            "requested revision no. (" + str(revno)   + \
                                            ") does not exist (" + str(len(rev_list)) + \
                                            " total)" 
                                        )
                                        parse_error = perr + " (revision " + str(revno) +\
                                                             " not found)"
                                # except:
                                #     parse_error = perr + " (revision number not parsed)"

                        elif w0u=="USE_SUGGESTED_PARAMETERS":
                            use_suggested_parameters = True

                        elif w0u=="LET":
                            #  Examples:
                            #  let x = a+1
                            #  let x = a*2; y = b+c; z = 10+d etc
                            #  let x = x0;  y = y0 if x0<y0
                            if nwords<2:
                                parse_error = perr
                            else:
                                try:
                                    line      = script[lno].strip()[3:].strip() # remove 'let'
                                    condition = True
                                    k         = line.upper().find(" IF ")
                                    if k>0:  # condition is present
                                        condition  = eval_parser.parse(line[k+4:]).evaluate(w)
                                        line       = line[:k]  # remove "IF ...."
                                    if condition:
                                        line       = "".join(line.split())  # remove spaces
                                        statements = line.split(";")
                                        for i in range(len(statements)):
                                            vname,expr = statements[i].split('=')
                                            value      = eval_parser.parse(expr).evaluate(w)
                                            w[vname]   = value
                                            auto_api2.log ( "LET " + vname + " = '" + \
                                                            expr + "' (== " + \
                                                            str(value) + ")" )
                                except:
                                    parse_error = perr + " (evaluation errors)"

                                # expression = "".join(words[1:])
                                # eqi = expression.index('=')
                                # if eqi<=0:
                                #     parse_error = perr
                                # else:
                                #     vname = expression[:eqi]
                                #     try:
                                #         value    = eval_parser.parse(expression[eqi+1:]).evaluate(w)
                                #         w[vname] = value
                                #         auto_api2.log ( "LET " + vname + " = '" + \
                                #                        expression[eqi+1:] + "' (== " + \
                                #                        str(value) + ")" )
                                #     except:
                                #         parse_error = perr

                        elif w0u=="REPEAT" or w0u=="CONTINUE":
                            if nwords<4 or not words[1].startswith("@") or words[2].upper()!="WHILE":
                                parse_error = perr
                            else:
                                repeat_mode = ""  # end repeat task mode
                                try:
                                    expr = " ".join(words[3:]);
                                    if eval_parser.parse(expr).evaluate(w):
                                        repeat_mode = w0u
                                    auto_api2.log ( "repeat evaluated: '" + expr + "' as [" + \
                                                    str(repeat_mode) + "]" )
                                except:
                                    parse_error = perr
                                if repeat_mode:
                                    # scroll script up
                                    lno,nextRunName = scrollToRunName ( script,words[1] )
                                    auto_api2.log ( " --- repeat pointer: " + str(lno) )
                                    # restore initial branch data
                                    rundata  = auto_api2.getContext ( nextRunName + "_rundata" )
                                    rev_list = rundata["rev_list"]
                                    if len(rev_list)>0:
                                        # take 0th revision by default; if this need to be 
                                        # changed, instructions will be read in due course 
                                        # from RUN description
                                        revision = rev_list[0]
                                        wdata["revision.hkl"] = [revision["HKL"]]
                                    # restore wdata such as not to change variables
                                    for key in rundata["wdata"]:
                                        if key!="variables":
                                            wdata[key] = rundata["wdata"][key]
                                    tdata = rundata["tdata"]
                                else:
                                    auto_api2.removeContext ( words[1] + "_rno" )

                        elif w0u=="RUN":
                            if nwords<2:
                                parse_error = perr
                            else:
                                nextTaskType = words[1] if words[1].startswith("Task") else "Task"+words[1]
                        elif w0u=="PRINT_VAR":
                            if nwords>1:
                                expr = " ".join(words[1:])
                                auto_api2.log ( " PRINT: " + expr + " = " + str(eval_parser.parse(expr).evaluate(w)) )
                        elif w0u=="END" or w0u=="STOP":
                            parse_error = "end"  # just sinal end of play
                            
                lno = lno + 1

            crTask.script_end_pointer = lno

            # auto_api2.log ( " --- end pointer: " + str(crTask.script_end_pointer) )
            # auto_api2.log ( " --- " + str(w) )

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
                runName = nextRunName
                if repeat_mode=="REPEAT":
                    # clone specified task
                    repeat_no = auto_api2.getContext ( nextRunName + "_rno" )
                    if not repeat_no:
                        repeat_no = 1
                    else:
                        repeat_no = repeat_no + 1
                    auto_api2.addContext ( nextRunName + "_rno",repeat_no )
                    runName  = nextRunName + "[" + str(repeat_no) + "]"
                    runName0 = nextRunName
                    if repeat_no>1:
                        runName0 = nextRunName + "[" + str(repeat_no-1) + "]"
                    auto_api2.cloneTask ( runName,runName0 )
                    if revision:
                        auto_api2.addTaskData ( runName,
                            aliases["revision"] if "revision" in aliases else "revision",
                            revision,append=False )

                else:
                    
                    if nextTaskType=="TaskMakeLigand":
                        auto_tasks2.make_ligand ( runName, wdata["ligdesc"][0], 
                                                  revision,crTask.autoRunName )
                    else:
                        auto_api2.addTask ( runName,nextTaskType,crTask.autoRunName )

                        # add task data, revision from the previous task only
                        dtypes = ["xyz","model","ligand","lib"]
                        if revision:
                            auto_api2.addTaskData ( runName,
                                aliases["revision"] if "revision" in aliases else "revision",
                                revision )
                        else:
                            dtypes += ["unmerged","hkl","seq"]

                        for dtype in wdata:
                            if dtype in dtypes and len(wdata[dtype])>0:
                                auto_api2.addTaskData ( runName,
                                    aliases[dtype] if dtype in aliases else dtype,
                                    wdata[dtype] )

                        for dtype in tdata:
                            auto_api2.addTaskData ( runName,dtype,wdata[tdata[dtype]] )
                    
                    # if runName in branch_points:
                    #     auto_api2.noteTask ( runName )

                    if runName in branch_points:
                        auto_api2.addContext ( nextRunName + "_rundata",{
                            "rev_list" : rev_list,
                            "wdata"    : wdata,
                            "tdata"    : tdata
                        })

                # add suggested task parameters
                if nextTaskType in suggestedParameters and use_suggested_parameters:
                    for key in suggestedParameters[nextTaskType]:
                        auto_api2.addTaskParameter ( runName,key,suggestedParameters[nextTaskType][key] )

                # add specified task parameters
                for p in parameters:
                    auto_api2.addTaskParameter ( runName,p,parameters[p] )

                wdata["variables"] = w
                auto_api2.addContext ( "input_data",wdata )

                auto_api2.noteTask ( runName )
                auto_api2.writeAutoMeta()
                return True

            return False

    except Exception as inst:
        body.stderrln ( str(type(inst)))  # the exception instance
        body.stderrln ( str(inst.args))   # arguments stored in .args
        body.stderrln ( str(inst))        # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.stderrln ( str(tb))
        body.putMessage ( "<h3><i>automatic workflow excepted</i></h3>" )

    return False
