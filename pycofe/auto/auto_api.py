##!/usr/bin/python

#
# ============================================================================
#
#    04.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
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
    auto_meta = jsonut.jObject()
    try:
        if os.path.isfile(auto_context_fname()):
            auto_meta.context = jsonut.readjObject ( auto_context_fname() )
        else:
            auto_meta.context = None
    except:
        auto_meta.context = None
    if not auto_meta.context:
        auto_meta.context = jsonut.jObject()
        auto_meta.context.custom = jsonut.jObject()
        auto_meta.context.tasks  = jsonut.jObject()
        auto_meta.context.job_register = jsonut.jObject()
    return


# ----------------------------------------------------------------------------

def addTask ( taskName,taskClassName,parentName ):
    global auto_meta
    task = jsonut.jObject()
    task._type      = taskClassName
    task.data       = jsonut.jObject()
    task.parameters = jsonut.jObject()
    task.fields     = jsonut.jObject()
    task.parentName = parentName
    auto_meta.set_field ( taskName,task )
    log('calling addTask: "%s", "%s", "%s"' % (taskName,taskClassName,parentName))
    return

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

def addTaskData ( taskName,inputId,dataClass ):
    global auto_meta
    task = auto_meta.get_field ( taskName )
    if task:
        if not hasattr(task.data,inputId):
            task.data.set_field ( inputId,[] )
        #dataClass.visible = True
        if type(dataClass) in [list,tuple]:
            for i in range(len(dataClass)):
                task.data.get_field(inputId).append ( dataClass[i] )
        else:
            task.data.get_field(inputId).append ( dataClass )
        log('calling addTaskData: "%s", "%s", "%s"' % (taskName, inputId, dataClass))
    return

def addTaskParameter ( taskName,parameterName,parameterValue ):
    global auto_meta
    task = auto_meta.get_field ( taskName )
    if task:
        task.parameters.set_field ( parameterName,parameterValue )
        log('calling addTaskParameter: "%s", "%s", "%s"' % (taskName, parameterName, parameterValue))
    return

def addTaskField ( taskName,fieldName,fieldValue ):
    global auto_meta
    task = auto_meta.get_field ( taskName )
    if task:
        task.fields.set_field ( fieldName,fieldValue )
        log('calling addTaskField: "%s", "%s", "%s"' % (taskName, fieldName, fieldValue))
    return

def addContext ( contextName,context ):
    global auto_meta
    auto_meta.context.custom.set_field ( contextName,context )
    log('calling addContext: "%s", "%s"' % (contextName, context))
    return

def getContext ( contextName ):
    global auto_meta
    log('calling getContext: "%s"' % (contextName))
    return auto_meta.context.custom.get_field ( contextName )

# def loadContext():
#     global auto_meta
#     try:
#         if os.path.isfile(auto_context_fname()):
#             auto_meta.context = jsonut.readjObject ( auto_context_fname() )
#         else:
#             auto_meta.context = None
#     except:
#         auto_meta.context = None
#     if not auto_meta.context:
#         auto_meta.context = jsonut.jObject()
#         auto_meta.context.custom = jsonut.jObject()
#         auto_meta.context.job_register = jsonut.jObject()
#     return

def writeAutoMeta():
    global auto_meta
    if auto_meta:
        f = open ( auto_meta_fname(),"w" )
        f.write ( auto_meta.to_JSON() )
        f.close()
    return
