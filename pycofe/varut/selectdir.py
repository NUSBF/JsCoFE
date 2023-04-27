##!/usr/bin/python

#
# ============================================================================
#
#    07.06.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT SELECT DIRCTORY DIALOG FOR CLIENT-SIDE WRAPPERS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

import sys
import os
from   PyQt5 import QtWidgets
from   PyQt5 import QtCore

def select ( title ):

    settings = QtCore.QSettings ( "CCP4","SelectDir" )
    startDir = str ( settings.value ( "last_path" ) )

    if not startDir and "HOME" in os.environ:
        startDir = os.environ["HOME"]

    app  = QtWidgets.QApplication([])

    if sys.platform.startswith("win"):
        dialog = QtWidgets.QFileDialog()
        dialog.setWindowTitle ( title )
        if startDir:
            dialog.setDirectory ( startDir )
    else:
        dialog = QtWidgets.QFileDialog ( None,title,startDir )
    dialog.setFileMode ( QtWidgets.QFileDialog.Directory)
    dialog.setOption   ( QtWidgets.QFileDialog.DontUseNativeDialog,True )
    #dialog.setOption(QtWidgets.QFileDialog.ShowDirsOnly, True)
    dialog.show  ()
    dialog.raise_()

    if dialog.exec_():
        if len(dialog.selectedFiles()) > 0:
            if dialog.selectedFiles()[0]:
                settings.setValue ( "last_path",dialog.selectedFiles()[0] )
            return dialog.selectedFiles()[0]

    return ""

    # file = str ( QtWidgets.QFileDialog.getExistingDirectory(None,title,startDir) )
    # return file

if __name__ == '__main__':
    if len(sys.argv) > 1:
        title = sys.argv[1]
    else:
        title = 'Select Directory'
    file = select ( title )
    print(file)
