##!/usr/bin/python

#
# ============================================================================
#
#    14.08.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC CUSTOM WORKFLOW FRAMEWORK
#
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2023-2024
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


def scrollToWorkflowDesc ( script ):
    lno = 0
    key = None
    while lno<len(script) and not key:
        words = script[lno].split()
        if len(words)>0 and ( \
                    words[0].startswith("@") or \
                    words[0].upper() in ["LET","REPEAT","PRINT_VAR","END","STOP"]
                ):
            key = words[0]
        else:
            lno = lno + 1
    return (lno,key)

def makeRunName ( word ):
    runName = word.split("[")
    if len(runName)<2:
        runName.append ( "" )
    elif runName[1].endswith("]"):
        runName[1] = runName[1][:-1]
    return runName    

def scrollToRunName ( script,runName ):
    lno         = 0
    nextRunName = None
    scope       = None
    while lno<len(script) and not scope:
        words = script[lno].split()
        if len(words)>0 and runName==words[0].split("[")[0]:
            nextRunName = makeRunName ( words[0] )
            scope = "run"
        elif len(words)>1 and words[0].upper()=="POINT" and runName==words[1]:
            scope = "flow"
        else:
            lno = lno + 1
    return (lno,nextRunName,scope)

def report ( body, title, message, log_message ):
    body.putMessage ( "&nbsp;" )
    body.putTitle ( title )
    if message:
        body.putMessage ( message )
    if log_message:
        auto_api2.log_message ( log_message )
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

        if not crTask.autoRunId: # else workflow does not run
          report ( body,"Workflow finished","<i>Current task could not be identified. " +\
                        "Script may be incomplete or suspect a bug.</i>",
                        "workflow finishes here (no instructions in the script?)." )
          return "no current task"

        if log:
            auto_api2.setLog ( log )
        else:
            auto_api2.setLog ( body.file_stdout1 )
        auto_api2.initAutoMeta()

        # make comment-less copy of the script
        version = "1.0"
        script  = []
        for i in range(len(crTask.script)):
            line = crTask.script[i].strip()
            if "#" in line:
                line = line[:line.index("#")].strip()
            script.append ( line )
            words = line.split()
            if len(words)>=2:
                if words[0].upper()=="VERSION":
                    version = words[1]
                    auto_api2.log_line ( i+1,crTask.script[i] )
                elif words[0].upper()=="DEBUG":
                    auto_api2.setDebugOutput ( words[1].upper()=="ON" )
                    auto_api2.log_line ( i+1,crTask.script[i] )
                elif words[0].upper()=="COMMENTS":
                    auto_api2.setCommentsOutput ( words[1].upper()=="ON" )
                    auto_api2.log_line ( i+1,crTask.script[i] )
        auto_api2.log_message ( " " )

        # prepare citation lists for passing down the project tree; this
        # must be done here because in general framework, citations are
        # put in place when task finishes

        body._add_citations ( citations.citation_list )
        for key in data:
            if hasattr(data[key],"citations"):
                data[key].citations = body.citation_list

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

        # add variables from task output
        if "variables" in data:
            for v in data["variables"]:
                w[v] = data["variables"][v]

        if "data" in data:
            ddata = data["data"]
            for d in ddata:
                if len(ddata[d])>0:  # and d!="revision":
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

        # take revision from data passed by task that just finished and
        # requests formation of next task in the workflow
        if "data" in data:
            cdata = data["data"]
            if "revision" in cdata and len(cdata["revision"])>0:
                rev_list = cdata["revision"]
                for i in range(len(rev_list)):
                    rev_list[i] = rev_list[i].to_dict()
                revision = rev_list[0]
                wdata["revision.hkl"] = [revision["HKL"]]

        # if revision was not produced by taks that just finished, try
        # finding revision in upstream data
        if not revision and "revision" in wdata  and len(wdata["revision"])>0:
            revision = wdata["revision"][0]
            wdata["revision.hkl"] = [revision["HKL"]]

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

        # identify runs where project loops or branches
        branch_points = []
        for line in script:
            words = line.split()
            if len(words)>=2 and words[0].upper() in ["REPEAT","CONTINUE","BRANCH"]:
                branch_points.append ( words[1].split("[")[0] )
        auto_api2.log_debug ( "branch_points=" + str(branch_points) )

        parentRunName = crTask.autoRunName
        if parentRunName.split("[")[0] in branch_points:
            auto_api2.addContext ( parentRunName + "_outdata",{
                "rev_list" : rev_list,
                "wdata"    : wdata
            })

        if lno<=0:
            # scroll script to the first workflow key
            lno,key = scrollToWorkflowDesc ( script )
            # if key and len(key)<2:
            #     parse_error = " *** LINE " + str(lno) + ": empty RUN NAMES are not allowed"

        parallel = 0       # >0 for tasks running in parallel, controlled in "flow"
        scope    = "flow"  # "run" for in-run statememts

        while parallel!=1 and lno<len(script):

            nextTaskType  = None
            nextRunName   = None
            scope         = "flow"

            while lno<len(script) and not nextTaskType and not parse_error:

                auto_api2.log_line ( lno+1,crTask.script[lno] )

                words  = script[lno].split()
                nwords = len(words)
                
                if (nwords>0) and (not words[0].upper().startswith("CHECKTASK")):

                    w0u  = words[0].upper()
                    perr = w0u + " declared but not correctly defined"

                    if scope=="flow":
                        
                        if words[0].startswith("@"):
                            nextRunName = makeRunName ( words[0] )
                            scope = "run"
                            if len(nextRunName[0])<2:
                                parse_error = "empty RUN NAMES are not allowed"

                        elif w0u=="LET":
                            #  Examples:
                            #  let x = a+1
                            #  let x = a*2; y = b+c; z = 10+d etc
                            #  let x = x0;  y = y0 if x0<y0
                            if nwords<2:
                                parse_error = perr
                            else:
                                line      = script[lno].strip()[3:].strip() # remove 'let'
                                condition = True
                                k         = line.upper().find(" IF ")
                                if k>0:  # condition is present
                                    try:
                                        condition = eval_parser.parse(line[k+4:]).evaluate(w)
                                        auto_api2.log_comment ( "condition : " + str(condition) )
                                        line      = line[:k]  # remove "IF ...."
                                    except:
                                        condition   = False
                                        parse_error = "incomputable expression \"" + \
                                                      line[k+4:] + "\""
                                if condition:
                                    line       = "".join(line.split())  # remove spaces
                                    statements = line.split(";")
                                    for i in range(len(statements)):
                                        if statements[i]:
                                            (vname,expr) = statements[i].split('=')
                                            try:
                                                value    = eval_parser.parse(expr).evaluate(w)
                                                w[vname] = value
                                                auto_api2.log_comment (
                                                    vname + " = " + str(value)
                                                )
                                            except:
                                                parse_error = "incomputable expression \"" +\
                                                                expr + "\""
                                                break
                                            # auto_api2.log_debug ( 
                                            #     "LET " + vname + " = '" + \
                                            #     expr + "' (== " + \
                                            #     str(value) + ")" 
                                            # )

                        elif w0u in ["REPEAT","CONTINUE","BRANCH"]:
                            if nwords<2 or not words[1].startswith("@"):
                                parse_error = perr
                            else:
                                repeat_mode = w0u
                                
                                pass_error = nwords>=3 and words[2].upper()=="PASS"
                                k = 3 if pass_error else 2

                                if nwords>=k+2:
                                    if words[k].upper() in ["WHILE","IF"]:
                                        expr = " ".join(words[k+1:])
                                        try:
                                            condition = eval_parser.parse(expr).evaluate(w)
                                            if not condition:
                                                repeat_mode = ""
                                            auto_api2.log_comment ( "condition : " + str(condition) )
                                        except:
                                            repeat_mode = ""
                                            parse_error = "incomputable expression \"" +\
                                                          expr + "\""
                                    else:
                                        repeat_mode = ""
                                        parse_error = "unparseable statement"
                                
                                if repeat_mode:
                                    # scroll script up
                                    if repeat_mode=="REPEAT":
                                        # restore initial branch data
                                        rdata = auto_api2.getContext ( words[1] + "_rundata" )
                                        if rdata:
                                            (lno,nextRunName,scope) = scrollToRunName ( script,words[1] )
                                            tdata = rdata["tdata"]
                                            # scope = "run"
                                        elif pass_error:
                                            auto_api2.log_comment ( "PASS executed" )
                                        else:
                                            parse_error = "run name " + words[1] + " is not defined (1)"
                                    else:
                                        parRunName0   = parentRunName
                                        pRunName      = makeRunName ( words[1] )
                                        parentRunName = pRunName[0]
                                        if pRunName[1]:
                                            repeatNo = int(w[pRunName[1]])
                                            if repeat_mode=="CONTINUE":
                                                repeatNo = repeatNo - 1
                                            parentRunName += "[" + str(repeatNo) + "]"
                                        rdata = auto_api2.getContext ( parentRunName + "_outdata" )
                                        # if rdata or repeat_mode=="CONTINUE":
                                        if repeat_mode=="CONTINUE":
                                            (lno,nextRunName,scope) = scrollToRunName ( script,pRunName[0] )
                                            # scope = "run"
                                        elif not rdata:
                                            if pass_error:
                                                parentRunName = parRunName0
                                                auto_api2.log_comment ( "PASS executed" )
                                            else:
                                                parse_error = "run name " + parentRunName + " is not defined (2)"
                                        tdata = {}
                                    if rdata:
                                        rev_list = rdata["rev_list"]
                                        if len(rev_list)>0:
                                            # take 0th revision by default; if this need to be 
                                            # changed, instructions will be read in due course 
                                            # from RUN description
                                            revision = rev_list[0]
                                            wdata["revision.hkl"] = [revision["HKL"]]
                                        # restore wdata such as not to change variables
                                        for key in rdata["wdata"]:
                                            if key!="variables":
                                                wdata[key] = rdata["wdata"][key]

                        elif w0u=="PRINT_VAR":
                            if nwords>1:
                                expr = " ".join(words[1:])
                                auto_api2.log_message ( 
                                    expr + " = " + str(eval_parser.parse(expr).evaluate(w))
                                )

                        elif w0u=="STOP":
                            if nwords>=2:
                                if words[1].upper()=="IF" and nwords>2:
                                    expr = " ".join(words[2:]);
                                    try:
                                        condition = eval_parser.parse(expr).evaluate(w)
                                        if condition:
                                            parse_error = "stop"  # just sinal end of play
                                        auto_api2.log_comment ( "condition : " + str(condition) )
                                    except:
                                        parse_error = "incomputable expression \"" +\
                                                      expr + "\""
                                else:
                                    parse_error = "unparseable statement"
                            else:
                                parse_error = "stop"  # just sinal end of play

                        elif w0u=="END":
                            parse_error = "end"  # just sinal end of play

                        elif w0u=="PARALLEL":  # used for specifying destination in "continue"
                            if nwords>=2:
                                if words[1].upper()=="ON":
                                    parallel = max ( 1,parallel )
                                elif words[1].upper()=="OFF":
                                    if parallel>1:  # some tasks have been formed
                                        auto_api2.writeAutoMeta()
                                        return "ok"
                                    parallel = 0  # no tasks formed, just reset
                                else:
                                    parse_error = "invalid key in \"parallel\""
                            else:
                                parse_error = "no key in \"parallel\""

                        elif w0u!="POINT":  # used for specifying destination in "continue"
                            parse_error = "statement " + w0u + " out of scope " + str(scope)


                    elif scope=="run":

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
                                    p = " ".join(words[1:]).strip()
                                    try:
                                        ok = eval_parser.parse(p).evaluate(w)
                                    except:
                                        parse_error = "incomputable expression \"" + p + "\""
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
                                    scope         = "flow"

                        elif w0u=="PARAMETER":  # task parameter
                            if nwords<3:
                                parse_error = perr
                            elif words[2].startswith("$"):
                                vname = words[2][1:]
                                if vname in w:
                                    parameters[words[1]] = w[vname]
                                else:
                                    parse_error = "variable \"" + vname + "\" not found"
                            else:
                                p = " ".join(words[2:]).strip()
                                if (p.startswith('"') and p.endswith('"')) or\
                                  (p.startswith("'") and p.endswith("'")):
                                    parameters[words[1]] = p[1:len(p)-1]
                                else:
                                    try:
                                        parameters[words[1]] = eval_parser.parse(p).evaluate(w)
                                    except:
                                        parse_error = "incomputable expression \"" + p + "\""

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
                                            parse_error = "incomputable expression \"" + p + "\""

                        elif w0u=="ALIAS":   #  data alias if "inputId" is non-standard
                            if nwords<3:
                                parse_error = perr
                            else:
                                aliases[words[1]] = words[2]

                        elif w0u=="DATA":
                            if nwords<3:
                                parse_error = perr
                            elif words[1] not in tdata:
                                tdata[words[1]] = words[2]
                            elif isinstance(tdata[words[1]],list):
                                tdata[words[1]].append ( words[2] )
                            else:
                                tdata[words[1]] = [tdata[words[1]],words[2]]

                        elif w0u=="USE":  # choose from multiple data
                            if nwords<3 or words[1].upper()!="REVISION":
                                parse_error = perr
                            else:
                                p = "".join ( words[2:] )
                                try:
                                    revno = eval_parser.parse(p).evaluate(w)
                                    auto_api2.log_comment ( "use revision '" + str(revno) + "' now" )
                                    if rev_list and revno<len(rev_list):
                                        revision = rev_list[revno]
                                        wdata["revision.hkl"] = [revision["HKL"]]
                                    else:
                                        # auto_api2.log_error ( 
                                        #     "requested revision no. (" + str(revno)   + \
                                        #     ") does not exist (" + str(len(rev_list)) + \
                                        #     " total)" 
                                        # )
                                        parse_error = "revision " + str(revno) +\
                                                        " not found (total " + str(len(rev_list)) + \
                                                        " revisions available)"
                                except:
                                    parse_error = "incomputable revision number \"" + p + "\""

                        elif w0u=="USE_SUGGESTED_PARAMETERS":
                            use_suggested_parameters = True

                        elif w0u=="RUN":
                            if nwords<2:
                                parse_error = perr
                            else:
                                nextTaskType = words[1] if words[1].startswith("Task") else "Task"+words[1]
                            scope = "flow"

                        else:
                            # parse_error = "statement out of scope " + str(scope)
                            parse_error = "statement " + w0u + " out of scope " + str(scope)

                lno = lno + 1

            crTask.script_end_pointer = lno

            if parse_error=="end":
                report ( body, "Workflow finished","<i>Ended normally.</i>",
                              "workflow finishes here." )
                return "finished"

            if parse_error=="stop":
                report ( body, "Workflow finished","<i>Stopped by instruction",
                              "workflow stopped by instruction." )
                return "finished"

            if parse_error:
                auto_api2.log_error ( parse_error )
                body.putMessage ( "&nbsp;<p><h3>Workflow script error</h3><i>" + \
                                  parse_error + "</i><p>&nbsp;" )
                return "errors (1)"

            if nextTaskType:

                if not nextRunName:
                    auto_api2.log_error ( " RUN NAME is not defined" )
                    body.putMessage ( "&nbsp;<p><h3>Workflow script error</h3><i>" +\
                                      "RUN NAME is not defined</i><p>&nbsp;" )
                    return "errors (2)"

                # form new task
                runName = nextRunName[0]
                if nextRunName[1]:
                    if not nextRunName[1] in w:
                        auto_api2.log_error ( " RUN NAME repeat counter is not defined" )
                        body.putMessage ( "&nbsp;<p><h3>Workflow script error</h3><i>RUN NAME " +\
                                          "repeat counter is not defined</i><p>&nbsp;" )
                        return "errors (3)"
                    else:
                        runName += "[" + str(w[nextRunName[1]]) + "]"

                if repeat_mode=="REPEAT":  
                    # clone task
                    if not nextRunName[1] or nextRunName[1] not in w:
                        auto_api2.log_error ( "RUN NAME repeat counter is not defined" )
                        body.putMessage ( "&nbsp;<p><h3>Workflow script error</h3><i>RUN NAME " +\
                                          "repeat counter is not defined</i><p>&nbsp;" )
                        return "errors (4)"

                    repeat_no = int(w[nextRunName[1]])
                    if repeat_no<1:
                        auto_api2.log_error ( "RUN NAME repeat counter does not advance" )
                        body.putMessage ( "&nbsp;<p><h3>Workflow script error</h3><i>RUN NAME " +\
                                          "repeat counter does not advance</i><p>&nbsp;" )
                        return "errors (5)"
                        
                    # runName   = nextRunName[0] + "[" + str(repeat_no)   + "]"
                    runName0  = nextRunName[0] + "[" + str(repeat_no-1) + "]"
                    auto_api2.cloneTask ( runName,runName0 )
                    if revision:
                        auto_api2.addTaskData ( runName,
                            aliases["revision"] if "revision" in aliases else "revision",
                            revision,append=False )

                else:

                    if nextTaskType=="TaskMakeLigand":
                        auto_tasks2.make_ligand ( runName, wdata["ligdesc"][0], 
                                                  revision,parentRunName )
                    else:
                        auto_api2.addTask ( runName,nextTaskType,parentRunName )

                        # add task data, revision from the previous task only
                        dtypes = ["xyz","model","ligand","lib"]
                        if revision:
                            auto_api2.addTaskData ( runName,
                                aliases["revision"] if "revision" in aliases else "revision",
                                revision )
                        else:
                            dtypes += ["unmerged","hkl","seq"]

                        # dtypes = ["xyz","model","ligand","lib","unmerged","hkl","seq"]

                        for dtype in wdata:
                            if dtype in dtypes and len(wdata[dtype])>0:
                                auto_api2.addTaskData ( runName,
                                    aliases[dtype] if dtype in aliases else dtype,
                                    wdata[dtype] )

                        for dtype in tdata:
                            if isinstance(tdata[dtype],list):
                                for d in tdata[dtype]:
                                    auto_api2.addTaskData ( runName,dtype,wdata[d] )
                            else:
                                auto_api2.addTaskData ( runName,dtype,wdata[tdata[dtype]] )
                    
                    # if runName in branch_points:
                    #     auto_api2.noteTask ( runName )

                    if nextRunName[0] in branch_points:
                        auto_api2.addContext ( nextRunName[0] + "_rundata",{
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
                if parallel>0:
                    parallel += 1
                else:
                    auto_api2.writeAutoMeta()
                    return "ok"

        report ( body, "Workflow finished","<i>End of script</i>",
                      "workflow finishes here (end of script)." )
        return "no task"
        

    except Exception as inst:
        body.stderrln ( str(type(inst)) )  # the exception instance
        body.stderrln ( str(inst.args)  )  # arguments stored in .args
        body.stderrln ( str(inst)       )  # __str__ allows args to be printed directly,
        tb = traceback.format_exc()
        body.stderrln ( str(tb))
        body.putMessage ( "&nbsp;<p><h3><i>Automatic workflow excepted</i></h3>" )
        return "errors (excepted)"
