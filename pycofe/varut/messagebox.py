##!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  QT MESSAGE BOX FOR CLIENT-SIDE WRAPPERS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#import sys
from PyQt4 import QtGui
from PyQt4 import QtCore

class MBDialog(QtGui.QDialog):

    def __init__(self,title,message):
        super(MBDialog,self).__init__()

        self.initUI ( title,message )

    def initUI(self,title,message):

        gbox = QtGui.QGridLayout()
        self.setLayout ( gbox )

        label = QtGui.QLabel ( message )
        gbox.addWidget ( label,0,0,1,3 )

        hline = QtGui.QFrame()
        hline.setFrameShape  ( QtGui.QFrame.HLine  )
        hline.setFrameShadow ( QtGui.QFrame.Raised )
        hline.setLineWidth   ( 2 )
        gbox.addWidget ( hline,1,0,1,3 )

        btn = QtGui.QPushButton ( 'Ok' )
        gbox.addWidget ( btn,2,2 )

        btn.clicked.connect ( self.cancel )

        self.setWindowTitle ( title )
        self.show()
        self.raise_()

    def cancel(self):
        self.reject()

def displayMessage ( title,message ):

    app   = QtGui.QApplication([])
    pwdlg = MBDialog ( title,message )
    pwdlg.exec_()

"""
def main():

    rc = checkPwd()
    print " rc = " + str(rc)

if __name__ == '__main__':
    main()
"""
