##!/usr/bin/python

#
# ============================================================================
#
#    31.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT SELECT DIRCTORY DIALOG FOR CLIENT-SIDE WRAPPERS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

import sys
import os
from PyQt4 import QtGui

#from PyQt4 import QtCore

def select ( title ):

    if "HOME" in os.environ:
        startDir = os.environ["HOME"]
    else:
        startDir = None

    app  = QtGui.QApplication([])

    if sys.platform.startswith("win"):
        dialog = QtGui.QFileDialog()
        dialog.setWindowTitle ( title )
        if startDir:
            dialog.setDirectory ( startDir )
    else:
        dialog = QtGui.QFileDialog ( None,title,startDir )
    dialog.setFileMode    ( QtGui.QFileDialog.Directory)
    dialog.setOption      ( QtGui.QFileDialog.DontUseNativeDialog,True )
    #dialog.setOption(QtGui.QFileDialog.ShowDirsOnly, True)
    dialog.show  ()
    dialog.raise_()

    if dialog.exec_():
        if len(dialog.selectedFiles()) > 0:
            return dialog.selectedFiles()[0]

    return ""

    """
    file = str ( QtGui.QFileDialog.getExistingDirectory(None,title,startDir) )
    return file
    """

if __name__ == '__main__':
    if len(sys.argv) > 1:
        title = sys.argv[1]
    else:
        title = 'Select Directory'
    file = select ( title )
    print file
