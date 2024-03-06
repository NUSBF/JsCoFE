#!/usr/bin/python

#
# ============================================================================
#
#    25.02.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4 Browser for embedded CCP4 Cloud desktop
#
#  Command-line:
#     ccp4-python browser.py [url]
#
#  where:
#    url        is CCP4 Cloud URL
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2024
#
# ============================================================================
#

#  python native imports
# import os
import sys
import argparse

from   PySide2.QtCore             import *
from   PySide2.QtWidgets          import *
from   PySide2.QtGui              import *
from   PySide2.QtWebEngineWidgets import *
from   PySide2.QtPrintSupport     import *


# class CustomWebEngineView(QWebEngineView):
#     def createWindow ( self,type ):
#         if type == QWebEnginePage.WebBrowserTab:
#             print ( " >> create window in view ",type )
#         return super().createWindow(type)


# class CustomWebEnginePage(QWebEnginePage):
#     """ Custom WebEnginePage to customize how we handle link navigation """
#     # Store external windows.
#     external_windows = []

#     def acceptNavigationRequest(self, url,  _type, isMainFrame):
#         if (_type == QWebEnginePage.NavigationTypeLinkClicked and
#             url.host() != 'www.mfitzp.com'):
#             # Send the URL to the system default URL handler.
#             QDesktopServices.openUrl(url)
#             return False
#         return super().acceptNavigationRequest(url,  _type, isMainFrame)


class CustomWebEnginePage(QWebEnginePage):
    # Store second window.
    # external_window = None

    def acceptNavigationRequest ( self, url, _type, isMainFrame ):
        # print( " >>>>> ",url, _type, isMainFrame, QWebEnginePage.NavigationTypeLinkClicked)
        if _type == QWebEnginePage.NavigationTypeLinkClicked:
            QDesktopServices.openUrl(url)
            # if not self.external_window:
            #     self.external_window = QWebEngineView()
            # self.external_window.setUrl(url)
            # self.external_window.show()
            return False
        return super().acceptNavigationRequest ( url, _type, isMainFrame )

    def javaScriptConsoleMessage ( self,level,message,lineNumber,sourceID ):
        print ( " % ",sourceID,":",lineNumber )
        print ( " >> ",message )
        return
		
    def createWindow ( self,type ):
        # print ( " >> create window in page ",type )
        if type == QWebEnginePage.WebBrowserTab:
            page = CustomWebEnginePage(self)
            # settings = QSettings ("CCP4","CCP4 Browser")
            # geometry = settings.value('geometry','')
            # if geometry: 
            #     self.restoreGeometry ( geometry )
            # else:
            #     self.setGeometry ( 100,100,1200,800 )
            return page
        return super().createWindow(type)


# creating main window class
class MainWindow(QMainWindow):

    # constructor
    def __init__ ( self,args ):
        super(MainWindow, self).__init__()

        self.urlbar = None
        self.args   = args

        # creating a QWebEngineView
        # self.browser = CustomWebEngineView(self)
        self.browser = QWebEngineView()
        page = CustomWebEnginePage(self)
        self.browser.setPage(page)

        self.settings = QSettings ("CCP4","CCP4 Browser")

        geometry = self.settings.value('geometry','')
        if geometry: 
            self.restoreGeometry ( geometry )
        else:
            self.setGeometry ( 100,100,1200,800 )

        # setting default browser url as google
        self.browser.setUrl ( QUrl(self.args.url) )

        # adding action when url get changed
        self.browser.urlChanged.connect(self.update_urlbar)

        # adding action when loading is finished
        self.browser.loadFinished.connect(self.update_title)

        # set this browser as central widget or main window
        self.setCentralWidget ( self.browser )

        # '''
              # # creating a status bar object
        # self.status = QStatusBar()

        # # adding status bar to the main window
        # self.setStatusBar(self.status)

        # # creating QToolBar for navigation
        # navtb = QToolBar("Navigation")

              # # adding this tool bar tot he main window
        # self.addToolBar(navtb)

        # # adding actions to the tool bar
        # # creating a action for back
        # back_btn = QAction("Back", self)

        # # setting status tip
        # back_btn.setStatusTip("Back to previous page")

        # # adding action to the back button
        # # making browser go back
        # back_btn.triggered.connect(self.browser.back)

        # adding this action to tool bar
        # navtb.addAction(back_btn)

        # # similarly for forward action
        # next_btn = QAction("Forward", self)
        # next_btn.setStatusTip("Forward to next page")

        # # adding action to the next button
        # # making browser go forward
        # next_btn.triggered.connect(self.browser.forward)
        # navtb.addAction(next_btn)

        # # similarly for reload action
        # reload_btn = QAction("Reload", self)
        # reload_btn.setStatusTip("Reload page")

        # # adding action to the reload button
        # # making browser to reload
        # reload_btn.triggered.connect(self.browser.reload)
        # navtb.addAction(reload_btn)

        # # similarly for home action
        # home_btn = QAction("Home", self)
        # home_btn.setStatusTip("Go home")
        # home_btn.triggered.connect(self.navigate_home)
        # navtb.addAction(home_btn)

        # # adding a separator in the tool bar
        # navtb.addSeparator()

        # # creating a line edit for the url
        # self.urlbar = QLineEdit()

        # # adding action when return key is pressed
        # self.urlbar.returnPressed.connect(self.navigate_to_url)

        # # adding this to the tool bar
        # navtb.addWidget(self.urlbar)

        # # adding stop action to the tool bar
        # stop_btn = QAction("Stop", self)
        # stop_btn.setStatusTip("Stop loading current page")

        # # adding action to the stop button
        # # making browser to stop
        # stop_btn.triggered.connect(self.browser.stop)
        # navtb.addAction(stop_btn)
        # '''

        # showing all the components
        self.show()


    # method for updating the title of the window
    def update_title(self):
        title = self.browser.page().title()
        self.setWindowTitle ( title )
        return

    # method called by the home action
    def navigate_home(self):
        self.browser.setUrl ( QUrl(self.args.url) )
        return

    # method called by the line edit when return key is pressed
    def navigate_to_url(self):
        if self.urlbar:
            # getting url and converting it to QUrl object
            q = QUrl ( self.urlbar.text() )
            # if url is scheme is blank
            if q.scheme() == "":
              # set url scheme to html
              q.setScheme("http")
            # set the url to the browser
            self.browser.setUrl(q)
        return

    # method for updating url
    # this method is called by the QWebEngineView object
    def update_urlbar(self, q):
        if self.urlbar:
          # setting text to the url bar
          self.urlbar.setText(q.toString())
          # setting cursor position of the url bar
          self.urlbar.setCursorPosition(0)
        return

    def closeEvent(self, event):
        geometry = self.saveGeometry()
        self.settings.setValue('geometry', geometry)
        super(MainWindow, self).closeEvent(event)
        return


#  ====== main

argParser = argparse.ArgumentParser()
argParser.add_argument ( "-u", "--url", 
			              help="CCP4 Cloud's URL address; default: https://cloud.ccp4.ac.uk",
										# default="http://localhost:8085" )
										default="http://localhost:54862" )
                    # default="https://cloud.ccp4.ac.uk" )
args = argParser.parse_args()

# creating a pyQt5 application
app = QApplication(sys.argv)

# setting name to the application
app.setApplicationName ( "CCP4 Browser" )

# creating a main window object
window = MainWindow ( args )

# loop
app.exec_()
