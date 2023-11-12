##!/usr/bin/python

#
# ============================================================================
#
#    06.11.23   <--  Date of Last Modification.
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

auto_meta  = None
log_stream = None

def setLog ( log ):
    global log_stream
    log_stream = log
    return

def log ( message ):
    global log_stream
    if log_stream:
        log_stream.write ( " >>> auto-workflow: " + message + "\n" )
    return

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
    log('calling getContext: "%s"' % (contextName))
    if contextName in auto_meta["context"]["custom"]:
        return auto_meta["context"]["custom"][contextName]
    return None

def addContext ( contextName,context ):
    global auto_meta
    log('calling addContext: "%s", "%s"' % (contextName, context))
    # auto_meta.context.custom.set_field ( contextName,json.dumps(context) )
    auto_meta["context"]["custom"][contextName] = context
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
    log('calling addTask: "%s", "%s", "%s"' % (taskName,taskClassName,parentName))
    return task

def addTaskData ( taskName,inputId,dataClass ):
    global auto_meta
    if taskName in auto_meta:
        task = auto_meta[taskName]
        if not inputId in task["data"]:
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
        log('calling addTaskData: "%s", "%s", "%s"' % (taskName, inputId, dataClass))
    return

def addTaskParameter ( taskName,parameterName,parameterValue ):
    global auto_meta
    if taskName in auto_meta:
        task = auto_meta[taskName]
        task["parameters"][parameterName] = parameterValue
        log('calling addTaskParameter: "%s", "%s", "%s"' % (taskName, parameterName, parameterValue))
    return


"""



# ----------------------------------------------------------------------------

def noteTask ( taskName,notedName ):
    task = auto_meta.get_field ( taskName )
    if task:
        auto_meta.context.tasks.set_field ( notedName,task )
        log('calling noteTask: "%s", "%s"' % (taskName, notedName))
        return True
    return False

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