#!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    18.03.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  EXECUTABLE MODULE FOR RVAPI HELPER APPLICATIONS
#
#  Command-line:
#     ccp4-python pycofe.tasks.rvapiapp.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  This task launches local applications in response to pressing the
#  corresponding button in RVAPI report pages. Although this is processed as
#  a usual NC-side job, no results are sent back to FE server.
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from pycofe.varut import jsonut, command, signal
try:
    from pycofe.varut import messagebox
except:
    messagebox = None

# ============================================================================
# clear signal file; this is mostly for command-line debugging, the signal
# should be cleared in JS layer before this script is invoked

signal.clear()


# ============================================================================
# get command line arguments and change to job directory; keep all file names
# relative to job directory, this is a must

jobManager = sys.argv[1]
job_dir = sys.argv[2]
job_id  = sys.argv[3]

# set scratch area if necessary
if jobManager=="SGE" and "TMP" in os.environ:
    os.environ["CCP4_SCR"] = os.environ["TMP"]

if "CCP4_SCR" in os.environ:
    os.environ["TMPDIR"] = os.environ["CCP4_SCR"]

# always make job directory current
os.chdir ( job_dir )

# ============================================================================
# initialise execution logs

file_stdout_path = "_stdout.log"
file_stderr_path = "_stderr.log"
file_stdout = open ( file_stdout_path,'w' )
file_stderr = open ( file_stderr_path,'w' )

# ============================================================================
# Read task metadata

task = jsonut.readjObject ( 'job.meta' )
if task is None:
    print(" task read failed in 'pycofe.tasks.rvapiapp'")
    file_stdout.write ( " task read failed in 'pycofe.tasks.rvapiapp'" )
    signal.TaskReadFailure().quitApp()

app  = None;
args = None;

if sys.platform.startswith("win"):
    if task.rvapi_command == "{coot}":
        app  = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
        args = task.rvapi_args
    elif task.rvapi_command == "{ccp4mg}":
        app  = "ccp4mg.bat"
        args = task.rvapi_args
    elif task.rvapi_command == "{viewhkl}":
        app = "viewhkl"
        args = task.rvapi_args

else:
    if task.rvapi_command == "{coot}":
        app  = "/bin/bash"
        args = ["-c"," ".join(["coot"] + task.rvapi_args)]
    elif task.rvapi_command == "{ccp4mg}":
        app  = "/bin/bash"
        args = ["-c"," ".join(["ccp4mg"] + task.rvapi_args)]
    elif task.rvapi_command == "{viewhkl}":
        if sys.platform.startswith("darwin"):
            app  = "open"
            args = [os.path.join(os.environ["CCP4"],"ViewHKL.app"),
                    "--args",os.path.abspath(task.rvapi_args[0])]
        else:
            app = "viewhkl"
            args = task.rvapi_args

if app is None:
    print(" wrong command specification 'pycofe.tasks.rvapiapp' (" + task.rvapi_command + ")")
    file_stdout.write ( " wrong command specification 'pycofe.tasks.rvapiapp' (" + task.rvapi_command + ")" )
    signal.TaskReadFailure().quitApp()


# ============================================================================
# Run job

file_stdout.write ( "[" + job_id.zfill(4) + "] RVAPI Application " + app.upper() + "\n\n" )
file_stderr.write ( " " )

rc = command.call ( app,args,"./",None,file_stdout,
                    file_stderr,log_parser=None )

# ============================================================================
# close execution logs and quit

file_stdout.close()
file_stderr.close()

if rc.msg == "":
    signal.Success().quitApp()
elif messagebox:
    messagebox.displayMessage ( "Failed to launch",
      "<b>Failed to launch " + task.rvapi_command +
      ".</b><p>This may indicate a problem with software setup." )
    signal.JobFailure( rc.msg ).quitApp()
