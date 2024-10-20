#!/usr/bin/python

#
# ============================================================================
#
#    20.10.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  APPLICATION CALL ROUTINES
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

import sys
import os
import time
import subprocess
import traceback
import platform

try:
    from time import process_time
except ImportError:
    from time import clock as process_time

from pycofe.etc import citations

class comrc():
    def __init__(self,retcode=None,utime=None):
        self.msg   = ""
        self.utime = 0
        self.stime = 0
        self.umem  = 0
        self.returncode = "0"
        if retcode:
            self.returncode = retcode[1]
            if len(retcode)>2:
                self.utime = retcode[2].ru_utime
                self.stime = retcode[2].ru_stime
                self.umem  = retcode[2].ru_maxrss/104448.0
            elif utime:
                self.utime = utime
            if self.returncode:
                self.msg  = "Error in command.call\n"
                self.msg += "Return code: " + str(self.returncode) + "\n"
        return

sys_time  = 0
user_time = 0

def _add_times ( rc ):
    global sys_time,user_time
    sys_time  += rc.stime/3600.0
    user_time += rc.utime/3600.0
    return

def getTimes():
    return [sys_time,user_time]


def call ( executable,command_line,job_dir,stdin_fname,file_stdout,
           file_stderr,log_parser=None,citation_ref=None,file_stdout_alt=None,
           env=None,work_dir="." ):

    msg = "\n" + "="*80 + "\n" +\
          time.strftime("## Run %Y-%m-%d at %H:%M:%S on ") + platform.uname()[1] +\
          "\n" + "="*80 + "\n" +\
          "## EXECUTING COMMAND:\n\n" +\
          " " + executable + " \\\n"

    file_stdout.write ( msg )
    if file_stdout_alt:
        file_stdout_alt.write ( msg )

    indent = "      "
    msg    = indent
    for c in command_line:
        if len(msg)+len(str(c)) > 78:
            msg += " "*max(0,78-len(msg)) + " \\\n"
            file_stdout.write ( msg )
            if file_stdout_alt:
                file_stdout_alt.write ( msg )
            msg = indent
        msg += "'" + str(c) + "' "
    file_stdout.write ( msg + "\n" )
    if file_stdout_alt:
        file_stdout_alt.write ( msg + "\n" )

    file_stdin = None
    if stdin_fname:
        msg = "\n" + "-"*80 + "\n## KEYWORD INPUT:\n\n"
        file_stdout.write ( msg )
        if file_stdout_alt:
            file_stdout_alt.write ( msg )
        file_stdin = open ( stdin_fname,"r" )
        msg = file_stdin.read()
        file_stdout.write ( msg )
        if file_stdout_alt:
            file_stdout_alt.write ( msg )
        file_stdin.close  ()
        file_stdin = open ( stdin_fname,"r" )

    file_stdout.write ( "\n" + "="*80 + "\n\n" )
    file_stdout.flush()
    if file_stdout_alt:
        file_stdout_alt.write ( "\n" + "="*80 + "\n\n" )
        file_stdout_alt.flush()

    rc = comrc()
    try:
        iswindows = sys.platform.startswith("win")
        if iswindows:  t1 = process_time()

        environ = env
        if not env:
            environ = os.environ
        p = subprocess.Popen ( [executable] + command_line,
                          shell=False,
                          stdin=file_stdin,
                          stdout=subprocess.PIPE if log_parser else file_stdout,
                          stderr=file_stderr,env=environ,cwd=work_dir )

        if log_parser:
            log_parser.parse_stream ( p.stdout,ostream=file_stdout )

        if iswindows:
            rc = comrc ( [0,p.wait()],process_time()-t1 )
        else:
            rc = comrc ( os.wait4(p.pid,0) )

    except Exception as e:
        rc.msg = str(e)
        file_stderr.write ( " ***** " + rc.msg )

    if file_stdin:
        file_stdin.close()

    file_stdout.write ( "\n" + "-"*80 + "\n" )
    file_stdout.write ( "   user time  : " + str(rc.utime) + " (sec)\n" )
    file_stdout.write ( "   sys time   : " + str(rc.stime) + " (sec)\n" )
    file_stdout.write ( "   memory used: " + str(rc.umem ) + " (MB)\n" )
    file_stdout.write ( "-"*80 + "\n" )

    _add_times ( rc )

    # fetch citations
    if citation_ref:
        citations.addCitation ( citation_ref )
    else:
        citations.addCitation ( executable )

    if rc.msg:
        msg = ' *** error running {0}: {1}'.format(executable, rc.msg)
        file_stdout.write(msg)
        file_stderr.write(msg)

    file_stdout.flush()
    file_stderr.flush()

    return rc
