#!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  APPLICATION CALL ROUTINES
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

import sys
import os
import time
import subprocess
import traceback

class comrc():
   def __init__(self):
       self.msg   = ""
       self.utime = 0
       self.stime = 0
       self.umem  = 0
       return


def call ( executable,command_line,job_dir,stdin_fname,file_stdout,
           file_stderr,log_parser=None ):

    file_stdout.write ( "\n" + "="*80 + "\n" )
    file_stdout.write ( time.strftime("## Run %Y-%m-%d at %H:%M:%S on ") + os.uname()[1] );
    file_stdout.write ( "\n" + "="*80 + "\n" )
    file_stdout.write ( "## EXECUTING COMMAND:\n\n" )

    file_stdout.write ( " " + executable + " \\\n" )
    indent = "      "
    msg    = indent
    for c in command_line:
        if len(msg)+len(c) > 78:
            file_stdout.write ( msg + " "*max(0,78-len(msg)) + " \\\n" )
            msg = indent
        msg = msg + "'" + c + "' "
    file_stdout.write ( msg + "\n" )

    file_stdin = None
    if stdin_fname:
        file_stdout.write ( "\n" + "-"*80 + "\n## KEYWORD INPUT:\n\n" )
        file_stdin = open ( stdin_fname,"r" )
        file_stdout.write ( file_stdin.read() )
        file_stdin.close  ()
        file_stdin = open ( stdin_fname,"r" )

    file_stdout.write ( "\n" + "="*80 + "\n\n" )
    file_stdout.flush()

    rc = comrc()
    try:
        p = subprocess.Popen ( [executable] + command_line,
                              shell=False,
                              stdin=file_stdin,
                              stdout=subprocess.PIPE if log_parser else file_stdout,
                              stderr=file_stderr )
        if log_parser:
            log_parser.parse_stream ( p.stdout,file_stdout )
        #p.wait()
        retcode  = os.wait4 ( p.pid,0 )
        rc.utime = retcode[2].ru_utime
        rc.stime = retcode[2].ru_stime
        rc.umem  = retcode[2].ru_maxrss/104448.0
        file_stdout.write ( "\n" + "-"*80 + "\n" )
        file_stdout.write ( "   user time  : " + str(rc.utime) + " (sec)\n" )
        file_stdout.write ( "   sys time   : " + str(rc.stime) + " (sec)\n" )
        file_stdout.write ( "   memory used: " + str(rc.umem ) + " (MB)\n" )
        file_stdout.write ( "-"*80 + "\n" )

    except Exception:
        rc.msg = "Error in command.call\n"+ traceback.format_exc()

    if file_stdin:
        file_stdin.close()

    if len(rc.msg)>0:
        msg = ' *** error running {0}: {1}'.format(executable, rc.msg)
        file_stdout.write(msg)
        file_stderr.write(msg)

    file_stdout.flush()
    file_stderr.flush()

    return rc
