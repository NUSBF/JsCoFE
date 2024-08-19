##!/usr/bin/python

#
# ============================================================================
#
#    24.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021-2023
#
# ============================================================================
#

import os
import json

from   pycofe.varut  import jsonut

# ============================================================================
# Service functions

def auto_meta_fname   ():  return "auto.meta"
def auto_context_fname():  return "auto.context"

auto_meta    = None
log_stream   = None
debug_out    = False
comments_out = False

# ----------------------------------------------------------------------------

def setLog ( log ):
    global log_stream
    log_stream = log
    if log_stream:
        log_stream.write (
            "\n" +\
            " **********************************\n" +\
            " ***   AUTOMATIC WORKFLOW LOG   ***\n" +\
            " **********************************\n" +\
            "\n"
        )
    return

def setDebugOutput ( print_debug ):
    global debug_out
    debug_out = print_debug
    return

def setCommentsOutput ( print_comments ):
    global comments_out
    comments_out = print_comments
    return

def log_line ( lineNo,line ):
    global log_stream
    if log_stream:
        log_stream.write ( " %03d| " % lineNo + line + "\n" )
    return

def log_error ( message ):
    global log_stream
    if log_stream:
        log_stream.write ( " *** Error: " + message + "\n" )
    return

def log_message ( message ):
    global log_stream
    if log_stream:
        log_stream.write ( " ... " + message + "\n" )
    return

def log_debug ( message ):
    global log_stream,debug_out
    if log_stream and debug_out:
        log_stream.write ( " >>> " + message + "\n" )
    return

def log_comment ( message ):
    global log_stream,comments_out
    if log_stream and comments_out:
        log_stream.write ( " ::: " + message + "\n" )
    return

# ----------------------------------------------------------------------------

def initAutoMeta():
    global auto_meta
    auto_meta = {
        "context" : {
            "custom"       : {},
            "tasks"        : {},
            "job_register" : {}
        }
    }
    try:
        if os.path.isfile(auto_context_fname()):
            with open(auto_context_fname()) as json_file:
                auto_meta["context"] = json.load(json_file)
    except:
        pass
    return

def writeAutoMeta():
    global auto_meta
    if auto_meta:
        with open(auto_meta_fname(),"w") as json_file:
            json.dump ( auto_meta,json_file )
    return

def getContext ( contextName ):
    global auto_meta
    log_debug ( 'getContext: "%s"' % (contextName) )
    if contextName in auto_meta["context"]["custom"]:
        return auto_meta["context"]["custom"][contextName]
    return None

def addContext ( contextName,context ):
    global auto_meta
    log_debug ( 'addContext: "%s", "%s"' % (contextName, context) )
    auto_meta["context"]["custom"][contextName] = context
    return

def removeContext ( contextName ):
    global auto_meta
    log_debug ( 'removeContext: "%s"' % (contextName) )
    try:
        del auto_meta["context"]["custom"][contextName]
    except:
        log_error ('removeContext excepted: "%s"' % (contextName) )
    return

def addTask ( taskName,taskClassName,parentName ):
    global auto_meta
    task = {
        "_type"      : taskClassName,
        "data"       : {},
        "parameters" : {},
        "fields"     : {},
        "parentName" : parentName
    }
    auto_meta[taskName] = task
    log_debug ( 'addTask: "%s", "%s", "%s"' % (taskName,taskClassName,parentName) )
    return task

def addTaskData ( taskName,inputId,dataClass,append=True ):
    global auto_meta
    if taskName in auto_meta:
        task = auto_meta[taskName]
        if not inputId in task["data"] or not append:
            task["data"][inputId] = []
        #dataClass.visible = True
        if type(dataClass) in [list,tuple]:
            for i in range(len(dataClass)):
                if type(dataClass[i])==dict:
                    task["data"][inputId].append ( dataClass[i] )
                else:
                    task["data"][inputId].append ( dataClass[i].to_dict() )
        elif type(dataClass)==dict:
            task["data"][inputId].append ( dataClass )
        else:
            task["data"][inputId].append ( dataClass.to_dict() )
        log_debug ( 'addTaskData: "%s", "%s", "%s"' % (taskName, inputId, dataClass) )
    else:
        log_error ( 'task name not found in addTaskData: "%s", "%s", "%s"' \
                    % (taskName, inputId, dataClass) )
    return

def addTaskParameter ( taskName,parameterName,parameterValue ):
    global auto_meta
    if taskName in auto_meta:
        task = auto_meta[taskName]
        task["parameters"][parameterName] = parameterValue
        log_debug ( 'addTaskParameter: "%s", "%s", "%s"' \
                    % (taskName, parameterName, parameterValue))
    else:
        log_error ( 'task name not found in addTaskParameter: "%s", "%s", "%s"' \
                    % (taskName, parameterName, parameterValue) )
    return

def noteTask ( taskName ):
    if taskName in auto_meta:
        auto_meta["context"]["tasks"][taskName] = auto_meta[taskName]
        log_debug ( 'noteTask: "%s"' % (taskName) )
        return True
    else:
        log_error ( ' noteTask failed: "%s"' % (taskName) )
    return False

def cloneTask ( clonedTaskName,taskName ):
    global auto_meta
    if taskName in auto_meta["context"]["tasks"]:
        task = auto_meta["context"]["tasks"][taskName]
        parameters = {}
        for key in task["parameters"]:
            parameters[key] = task["parameters"][key]
        fields     = {}
        for key in task["fields"]:
            fields[key] = task["fields"][key]
        auto_meta[clonedTaskName] = {
            "_type"      : task["_type"],
            "data"       : task["data"],  # data is not supposed to change in cloned task
            "parameters" : parameters,
            "fields"     : fields,
            "parentName" : task["parentName"]
        }
        log_debug ( 'cloneTask: "%s", "%s"' % (clonedTaskName, taskName) )
        return True
    else:
        log_error ( "task " + taskName + " not found for cloning" )
    return False


"""



# ----------------------------------------------------------------------------

def cloneTask ( clonedTaskName,notedName ):
    global auto_meta
    # originalTask = auto_meta.get_field ( originalTaskName )
    originalTask = auto_meta.context.tasks.get_field ( notedName )
    if originalTask:
        task = jsonut.jObject()
        task._type      = originalTask._type
        task.data       = originalTask.data  # data is not supposed to change in cloned task
        task.parameters = jsonut.jObject()
        for key in vars(originalTask.parameters):
            task.parameters.set_field ( key,originalTask.parameters.get_field(key) )
        task.fields     = jsonut.jObject()
        for key in vars(originalTask.fields):
            task.fields.set_field ( key,originalTask.fields.get_field(key) )
        task.parentName = originalTask.parentName
        auto_meta.set_field ( clonedTaskName,task )
        log('calling cloneTask: "%s", "%s"' % (clonedTaskName, notedName))
        return True
    return False

def addTaskField ( taskName,fieldName,fieldValue ):
    global auto_meta
    task = auto_meta.get_field ( taskName )
    if task:
        task.fields.set_field ( fieldName,fieldValue )
        log('calling addTaskField: "%s", "%s", "%s"' % (taskName, fieldName, fieldValue))
    return

def getContext ( contextName ):
    global auto_meta
    log('calling getContext: "%s"' % (contextName))
    field = auto_meta.context.custom.get_field ( contextName )
    # if field:
    #     field = json.loads(field)
    return field

"""