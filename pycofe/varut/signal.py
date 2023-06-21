##!/usr/bin/python

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  JOB PROGRESS SIGNALS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

import os, sys

class CofeSignal( Exception ):
    signal_file_name = "signal"
    signal_prefix = None
    returncode = None

    @classmethod
    def clear(cls):
        if os.path.isfile( cls.signal_file_name ):
            os.remove ( cls.signal_file_name )

    def __init__( self, msg="" ):
        self.msg = msg

    def send_signal( self ):
        message = self.signal_prefix + self.msg + '\n' + str( self.returncode )
        with open ( self.signal_file_name, 'w' ) as f:
            f.write ( message )
        return

    def quitApp( self ):
        self.send_signal()
        #sys.exit()
        sys.exit(self.returncode)


def clear():
    CofeSignal.clear()


class Success( CofeSignal ):
    returncode    = 0
    signal_prefix = "success"


class NoResults( CofeSignal ):
    returncode    = 204
    signal_prefix = "noresults"


class HiddenResults( CofeSignal ):
    returncode    = 205
    signal_prefix = "hiddenresults"


class ImportFailure( CofeSignal ):
    returncode    = 200
    signal_prefix = "fail_import"


class TaskReadFailure( CofeSignal ):
    returncode    = 201
    signal_prefix = "fail_task_read"


class JobFailure( CofeSignal ):
    returncode    = 203
    signal_prefix = "fail_job "
