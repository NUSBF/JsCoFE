##!/usr/bin/python

#
# ============================================================================
#
#    18.03.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT SELECT DIRCTORY DIALOG FOR CLIENT-SIDE WRAPPERS
#
#  Invocation:
#
#  ccp4-python selectfile.py title [fileFilters] [--start-dir startDir] [--no-settings]
#
#
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

import sys
import os
from PyQt4 import QtGui, QtCore

#from PyQt4 import QtCore

def select ( title,filters,startDir=None,saveSettings=True ):

    settings  = None
    start_dir = startDir
    if not start_dir:
        settings  = QtCore.QSettings ( "CCP4","SelectFile" )
        start_dir = settings.value ( "last_path" ).toString()

    if not start_dir and "HOME" in os.environ:
        start_dir = os.environ["HOME"]
    if not start_dir:
        start_dir = "."

    app = QtGui.QApplication([])

    if sys.platform.startswith("win"):
        dialog = QtGui.QFileDialog()
        dialog.setWindowTitle ( title )
        dialog.setDirectory ( start_dir )
    else:
        dialog = QtGui.QFileDialog ( None,title,start_dir )
    #dialog.setFileMode ( QtGui.QFileDialog.Directory)
    dialog.setNameFilters ( filters )
    dialog.setOption      ( QtGui.QFileDialog.DontUseNativeDialog,True )
    #dialog.setOption(QtGui.QFileDialog.ShowDirsOnly, True)
    dialog.show  ()
    dialog.raise_()

    if dialog.exec_():
        if len(dialog.selectedFiles()) > 0:
            if dialog.selectedFiles()[0] and saveSettings:
                if not settings:
                    settings = QtCore.QSettings ( "CCP4","SelectFile" )
                settings.setValue ( "last_path",dialog.selectedFiles()[0] )
            return dialog.selectedFiles()[0]

    return ""

    """
    file = str ( QtGui.QFileDialog.getExistingDirectory(None,title,start_dir) )
    return file
    """

if __name__ == '__main__':

    if len(sys.argv) > 1:
        title = sys.argv[1]
    else:
        title = 'Select Directory'
    if len(sys.argv) > 2:
        filters = sys.argv[2].split(";")
    else:
        filters = ["All files (*)"]

    start_dir     = None
    save_settings = True

    for i in range(len(sys.argv)):
        if sys.argv[i]=="--start-dir":
            start_dir = sys.argv[i+1]
        if sys.argv[i]=="--no-settings":
            save_settings = False


    print ( select ( title,filters,startDir=start_dir,saveSettings=save_settings ) )
