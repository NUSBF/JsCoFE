##!/usr/bin/python

#
# ============================================================================
#
#    30.03.23   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

import sys
import os
os.environ['PATH'] = os.environ['PATH'].replace('WinCoot', '___Coot')
from   PyQt5 import QtWidgets
from   PyQt5 import QtCore


def select ( title,filters,startDir=None,saveSettings=True ):

    settings  = None
    start_dir = startDir
    if not start_dir:
        settings  = QtCore.QSettings ( "CCP4","SelectFile" )
        start_dir = str ( settings.value ( "last_path ") )

    if not start_dir and "HOME" in os.environ:
        start_dir = os.environ["HOME"]
    if not start_dir:
        start_dir = "."

    app = QtWidgets.QApplication([])

    if sys.platform.startswith("win"):
        dialog = QtWidgets.QFileDialog()
        dialog.setWindowTitle ( title )
        dialog.setDirectory ( start_dir )
    else:
        dialog = QtWidgets.QFileDialog ( None,title,start_dir )
    #dialog.setFileMode ( QtWidgets.QFileDialog.Directory)
    dialog.setNameFilters ( filters )
    dialog.setOption      ( QtWidgets.QFileDialog.DontUseNativeDialog,True )
    #dialog.setOption(QtWidgets.QFileDialog.ShowDirsOnly, True)
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

    # file = str ( QtWidgets.QFileDialog.getExistingDirectory(None,title,start_dir) )
    # return file

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
