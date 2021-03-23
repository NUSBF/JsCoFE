##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    22.03.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC WORKFLOW FRAMEWORK API
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
#
# ============================================================================
#

#import json
from   pycofe.varut  import jsonut

# ============================================================================
# Service functions

def auto_meta_fname():  return "auto.meta"

auto_meta = None

def addTask ( taskName,taskClassName ):
    global auto_meta
    task = jsonut.jObject()
    task._type      = taskClassName
    task.data       = jsonut.jObject()
    task.parameters = jsonut.jObject()
    auto_meta = jsonut.jObject()
    auto_meta.set_field ( taskName,task )
    return

def addTaskParameter ( taskName,parameterName,parameterValue ):
    global auto_meta
    task = auto_meta.get_field ( taskName )
    if task:
        task.parameters.set_field ( parameterName,parameterValue )
    return

def addTaskData ( taskName,inputId,dataClass ):
    global auto_meta
    task = auto_meta.get_field ( taskName )
    if task:
        if not hasattr(task.data,inputId):
            task.data.set_field ( inputId,[] )
        task.data.get_field(inputId).append ( dataClass )
    return

def writeAutoMeta():
    global auto_meta
    if auto_meta:
        with open(auto_meta_fname(),"w") as f:
            f.write ( auto_meta.to_JSON() )
    return
