##!/usr/bin/python

#
# ============================================================================
#
#    07.06.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT MESSAGE BOX FOR CLIENT-SIDE WRAPPERS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#import sys
from PyQt5 import QtWidgets
from PyQt5 import QtCore

class MBDialog(QtGui.QDialog):

    def __init__(self,title,message):
        super(MBDialog,self).__init__()

        self.initUI ( title,message )

    def initUI(self,title,message):

        gbox = QtWidgets.QGridLayout()
        self.setLayout ( gbox )

        label = QtWidgets.QLabel ( message )
        gbox.addWidget ( label,0,0,1,3 )

        hline = QtWidgets.QFrame()
        hline.setFrameShape  ( QtWidgets.QFrame.HLine  )
        hline.setFrameShadow ( QtWidgets.QFrame.Raised )
        hline.setLineWidth   ( 2 )
        gbox.addWidget ( hline,1,0,1,3 )

        btn = QtWidgets.QPushButton ( 'Ok' )
        gbox.addWidget ( btn,2,2 )

        btn.clicked.connect ( self.cancel )

        self.setWindowTitle ( title )
        self.show()
        self.raise_()

    def cancel(self):
        self.reject()

def displayMessage ( title,message ):

    app   = QtCore.QApplication([])
    pwdlg = MBDialog ( title,message )
    pwdlg.exec_()

# def main():
#
#     rc = checkPwd()
#     print " rc = " + str(rc)
#
# if __name__ == '__main__':
#     main()
