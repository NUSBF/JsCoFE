##!/usr/bin/python

#
# ============================================================================
#
#    19.05.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BASIC TASK WRAPPER
#
#  Command-line:  N/A
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2017-2024
#
# ============================================================================
#
#   Function list:
#
#   TaskDriver::
#      report_page_id    ()
#      setReportWidget   ( widgetId )
#      resetReportPage   ()
#      log_page_id       ()
#      err_page_id       ()
#      file_stdout_path  ()
#      file_stderr_path  ()
#      file_stdin_path   ()
#      reportDir         ()
#      outputDir         ()
#      inputDir          ()
#      reportDocumentName()
#      refmac_section    ()
#      refmac_report     ()
#      importDir         ()
#      import_summary_id ()

# not needed
#from future import *

#  python native imports
import os
import sys
import shutil
import traceback
try:
    import http.client
except:
    import http.client as httplib
import datetime

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers
from pycofe.parsers import refmac_parser, edstats_parser, baver_parser
from pycofe.parsers import modelcraft_parser

# pycofe imports
from pycofe.dtypes import dtype_template, dtype_xyz,   dtype_structure, databox
from pycofe.dtypes import dtype_ensemble, dtype_ligand
from pycofe.dtypes import dtype_sequence, dtype_model, dtype_library
from pycofe.proc   import edmap,  import_filetype, import_merged, mergeone
from pycofe.varut  import signal, jsonut, command, zutils, mmcif_utils
from pycofe.etc    import citations


# ============================================================================
# driver class

class TaskDriver(object):

    # ========================================================================
    # common definitions

    rvrow             = 0  # current report row
    _rvrow_bak        = 0  # saved report row
    _report_widget_id = "report_page"
    _scriptNo         = 0  # input script counter

    def appName(self):  return "CCP4 Cloud"

    def report_page_id(self): return self._report_widget_id

    def setReportWidget ( self,widgetId,row=0 ):
        self._rvrow_bak        = self.rvrow
        self.rvrow             = row
        self._report_widget_id = widgetId
        return self._rvrow_bak

    def resetReportPage ( self,row=-1):
        rvrow = self.rvrow
        if row<0:
            self.rvrow = self._rvrow_bak
        else:
            self.rvrow = row
        self._report_widget_id = "report_page"
        return rvrow

    def log_page_id       (self): return "log_page"
    def log_page_1_id     (self): return "log_page_1"
    def err_page_id       (self): return "err_page"
    def traceback_page_id (self): return "python_exception"

    def file_stdout_path  (self): return "_stdout.log"  # reserved name, used in NC
    def file_stdout1_path (self): return "_stdout1.log" # reserved name, not used in NC
    def file_stderr_path  (self): return "_stderr.log"
    def file_stdin_path   (self): return "_stdin." + str(self._scriptNo) + ".script"

    def reportDir         (self): return "report"  # in current directory ( job_dir )
    def outputDir         (self): return "output"  # in current directory ( job_dir )
    def inputDir          (self): return "input"   # in current directory ( job_dir )

    def reportDocumentName(self): return "rvapi_document"  # used also in js layer

    def refmac_section    (self): return "refmac_section"
    def refmac_report     (self): return "refmac_report"

    def importDir         (self): return "uploads" # in current directory ( job_dir )
    def import_summary_id (self): return "import_summary_id"  # summary table id

    # ========================================================================
    # class variables

    jobManager    = None
    job_dir       = None
    job_id        = None
    jscofe_dir    = None

    # create output data list structure
    outputDataBox = databox.DataBox()

    # standard output file handlers
    file_stdout   = None   #  Main Log
    file_stdout1  = None   #  Service Log
    file_stderr   = None
    file_stdin    = None

    # task and input data
    task          = None
    input_data    = None
    outputFName   = ""

    # report parsers
    log_parser    = None
    generic_parser_summary = {}

    # data register counter
    dataSerialNo  = 0

    # cumulative list of citations
    citation_list = []

    # data import fields
    files_all     = []   # list of files to import
    file_type     = {}   # optional file type specificator
    summary_row   = 0    # current row in import summary table
    summary_row_0 = 0    # reference row in import summary table

    widget_no     = 0    # widget Id unificator
    navTreeId     = ""   # navigation tree Id
    title_grid_id = None # id of title grid

    appVersion    = "unknown"     # jsCoFE version for reporting
    start_date    = ""
    end_date      = ""

    jobEndFName   = "__end_job"   # signal file name to end job gracefully

    ligand_exclude_list = [
        "XXX", "LIG", "DRG", "INH", "LG0", "LG1", "LG2", "LG3", "LG4", "LG5", "LG6",
        "LG7", "LG8", "LG9"
    ]

    # ========================================================================
    # cofe config

    #   This needs to be obtained from the jscofe config-file.
    #maintainerEmail = None
    maintainerEmail = "ccp4@ccp4.ac.uk"

    # ========================================================================
    # initiaisation

    def getCommandLineParameter ( self,name ):
        for i in range(len(sys.argv)):
            if sys.argv[i].startswith(name+"="):
                return sys.argv[i].split("=")[1]
        return ""


    def __init__ ( self,title_str,module_name,options={}, args=None ):
        #
        #   options = { // all optional
        #     report_page : { show : True,   name : "Report"   },
        #     log_page    : { show : True,   name : "Log file" },
        #     err_page    : { show : True,   name : "Errors"   },
        #     nav_tree    : { id   : treeId, name : "Workflow" }
        #                         // will do nav tree instead of tabs if given
        #   }
        #   args = optional replacement for sys.argv to allow this class to be
        #     called from within other Python programs (such as tests)
        #

        def getOption(name1,name2,default):
            try:
                return options[name1][name2]
            except:
                return default


        # clear signal file; this is mostly for command-line debugging, the signal
        # should be cleared in JS layer before this script is invoked

        signal.CofeSignal.clear()

        # get command line arguments and change to job directory; keep all file names
        # relative to job directory, this is a must

        if args is None:
            args = sys.argv[1:]
        self.jobManager  = args[0]
        self.job_dir     = args[1]
        self.job_id      = args[2]
        self.jscofe_dir  = sys.argv[0][0:sys.argv[0].rfind("pycofe")]
        self.appVersion  = self.getCommandLineParameter("jscofe_version")
        self.jobEndFName = self.getCommandLineParameter("end_signal")
        if not self.appVersion:
            self.appVersion = "unknown"

        temp = None
        for tmp in 'CCP4_SCR', 'TMPDIR', 'TEMP', 'TMP':
            if tmp in os.environ and os.path.isdir(os.environ[tmp]):
                temp = tmp
                break

        if temp:
            for tmp in 'CCP4_SCR', 'TMPDIR', 'TEMP', 'TMP':
                os.environ[tmp] = os.environ[temp]

        # set scratch area if necessary
        #if self.jobManager=="SGE" and "TMP" in os.environ:
        #    os.environ["CCP4_SCR"] = os.environ["TMP"]
        #
        #if "CCP4_SCR" in os.environ:
        #    os.environ["TMPDIR"] = os.environ["CCP4_SCR"]

        # always make job directory current
        os.chdir ( self.job_dir )

        # initialise execution logs
        self.file_stdout  = open ( self.file_stdout_path (),'w' )
        self.file_stdout1 = open ( self.file_stdout1_path(),'w' )
        self.file_stderr  = open ( self.file_stderr_path (),'w' )

        sys.stderr = self.file_stderr

        # fetch task data
        self.task = jsonut.readjObject  ( "job.meta" )
        if self.task is None:
            self.file_stdout .write ( "\n\n *** task read failed in '" + module_name + "'\n\n" )
            self.file_stdout1.write ( "\n\n *** task read failed in '" + module_name + "'\n\n" )
            self.file_stderr .write ( "\n\n *** task read failed in '" + module_name + "'\n\n" )
            print(" task read failed in '" + module_name + "'")
            raise signal.TaskReadFailure()

        self.input_data = databox.readDataBox ( self.inputDir() )

        if self.task.uoname:
            self.outputFName = self.task.uoname
        else:
            self.outputFName = self.task.oname

        despatch_meta = jsonut.readjObject  ( "__despatch.meta" )
        head_msg      = ""
        if despatch_meta:
            head_msg += "## despatched by: " + despatch_meta.setup_id
            if despatch_meta.setup_id.startswith("<"):
                head_msg += " at " + despatch_meta.sender
            head_msg += "\n##  processed by: " + despatch_meta.nc_name
        else:
            head_msg += "## despatch data not available"

        # print title in standard logs
        if title_str:
            tstr = title_str
        else:
            tstr = self.task.title

            #"\n--------------------------------------------------------------------------------\n\n\n[" +\
        head_msg += \
            "\n\n\n[" + self.job_id.zfill(4) + "] " + tstr.upper() + "\n\n"

        self.file_stdout .write ( head_msg + "       MAIN LOG\n\n" )
        self.file_stdout1.write ( head_msg + "       SERVICE PROGRAMS LOG\n\n" )
        self.file_stderr .write ( " " )
        self.file_stdout .flush()
        self.file_stdout1.flush()
        self.file_stderr .flush()

        # initialise HTML report document; note that we use absolute path for
        # the report directory, which is necessary for passing RVAPI document
        # to applications via creation of the rvapi_document file with
        # pyrvapi.rvapi_store_document2(..)

        # pyrvapi.rvapi_set_time_quant ( 8000 )

        # Make a tree or tab layout
        winTitle = self.task.project + ":[" + str(self.task.id).zfill(4) + "] " + tstr
        if "nav_tree" in options:
            pyrvapi.rvapi_init_document (
                    "jscofe_report",  # document Id
                    os.path.join(os.getcwd(),self.reportDir()),  # report directory (reserved)
                    winTitle,  # title
                    1,         # HTML report to be produced
                    0,         # Report will have tabs
                    "jsrview", # where to look for js support (reserved)
                    None,None,
                    "task.tsk",
                    "i2.xml" )
            self.navTreeId = options["nav_tree"]["id"]
            pyrvapi.rvapi_add_tree_widget (
                    self.navTreeId,              # tree widget reference (Id)
                    options["nav_tree"]["name"], # tree widget title
                    "body",        # reference to widget holder (grid)
                    0,             # holder row
                    0,             # holder column
                    1,             # row span
                    1              # column span
            )
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,"" )

        else:
            pyrvapi.rvapi_init_document (
                    "jscofe_report",  # document Id
                    os.path.join(os.getcwd(),self.reportDir()),  # report directory (reserved)
                    winTitle,  # title
                    1,         # HTML report to be produced
                    4,         # Report will have tabs
                    "jsrview", # where to look for js support (reserved)
                    None,None,
                    "task.tsk",
                    "i2.xml" )

        self.rvrow = 0;
        focus      = True

        if getOption("report_page","show",True):
            pyrvapi.rvapi_add_tab ( self.report_page_id(),
                                    getOption("report_page","name","Report"),focus )
            self.title_grid_id = self.getWidgetId("title_grid")
            self.start_date    = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')
            self.putGrid ( self.title_grid_id,filling_bool=True )
            if tstr and getOption("report_page","showTitle",True):
                self.putTitle1 ( self.title_grid_id,tstr,0,col=0 )
                #self.putTitle ( tstr )
            self.putMessage1 ( self.title_grid_id,
                "<div style=\"text-align:right;font-size:12px;\">Started: " +\
                self.start_date + "</div>",0,col=1 )
            focus = False
        if getOption("log_page","show",True):
            if self.navTreeId:
                pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,self.report_page_id() )
            pyrvapi.rvapi_add_tab ( self.log_page_id(),
                                    getOption("log_page","name","Main Log"),focus )
            pyrvapi.rvapi_append_content ( "/".join(["..",self.file_stdout_path()+"?capsize"]),
                                           True,self.log_page_id() )
            focus = False
        if getOption("log_page_1","show",True):
            if self.navTreeId:
                pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,self.report_page_id() )
            pyrvapi.rvapi_add_tab ( self.log_page_1_id(),
                                    getOption("log_page","name","Service Log"),focus )
            pyrvapi.rvapi_append_content ( "/".join(["..",self.file_stdout1_path()+"?capsize"]),
                                           True,self.log_page_1_id() )
            focus = False
        if getOption("err_page","show",True):
            if self.navTreeId:
                pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,self.report_page_id() )
            pyrvapi.rvapi_add_tab ( self.err_page_id(),
                                    getOption("err_page","name","Errors"),focus )
            pyrvapi.rvapi_append_content ( "/".join(["..",self.file_stderr_path()]),
                                           True,self.err_page_id() )

        if self.navTreeId:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,"" )
        pyrvapi.rvapi_flush()

        return

    # ============================================================================


    def getOFName ( self,extention,modifier=-1 ):
        if modifier >= 0:
            return self.outputFName + "." + str(modifier).zfill(3) + extention
        else:
            return self.outputFName + extention

    def getCIFOFName ( self,modifier=-1 ):
        return self.getOFName ( ".cif",modifier )

    def getMMCIFOFName ( self,modifier=-1 ):
        return self.getOFName ( ".mmcif",modifier )

    def getReflMMCIFOFName ( self,modifier=-1 ):
        return self.getOFName ( ".refl.mmcif",modifier )

    def getXYZOFName ( self,modifier=-1 ):
        return self.getOFName ( ".pdb",modifier )

    def getSubOFName ( self,modifier=-1 ):
        return self.getOFName ( "_sub.pdb",modifier )

    def getMTZOFName ( self,modifier=-1 ):
        return self.getOFName ( ".mtz",modifier )

    def getMapOFName ( self,modifier=-1 ):
        return self.getOFName ( ".map",modifier )

    def getDMapOFName ( self,modifier=-1 ):
        return self.getOFName ( ".diff.map",modifier )

    def despaceFileNames ( self,flist,dirPath ):
        flist_out = []
        for f in flist:
            if " " in f:
                f1 = f.replace ( " ","_" )
                os.rename ( os.path.join(dirPath,f),os.path.join(dirPath,f1) )
                flist_out.append ( f1 )
            else:
                flist_out.append ( f )
        return flist_out


    # ============================================================================

    def getWidgetId ( self,wid ):
        widgetId = wid + "_" + str(self.widget_no)
        self.widget_no += 1
        return widgetId

    # ============================================================================

    def getCCP4Version(self):
        version = ""
        if "CCP4" in os.environ:
            try:
                f = open ( os.path.join(os.environ["CCP4"],"lib","ccp4","MAJOR_MINOR"), "r" )
                version = f.read().strip()
                f.close()
            except:
                version = "x.x.xxx"
        return version

    # ============================================================================

    def checkPDB ( self,stop=True ):
        if "PDB_DIR" not in os.environ or not os.path.isdir(os.environ["PDB_DIR"]):
            if stop:
                pyrvapi.rvapi_set_text (
                    "<b>Error: " + self.appName() + " is not configured to work with PDB archive.</b><p>" + \
                    "Please look for support.",
                    self.report_page_id(),self.rvrow,0,1,1 )

                self.fail ( "<p>&nbsp; *** Error: " + self.appName() + " is not configured to work with PDB archive \n" + \
                            "     Please look for support\n","No PDB configured" )
            return False
        return True

    def have_internet ( self,url_list=["www.pdb.org","www.google.com","pdbj.org","www.ebi.ac.uk"],time_out=5 ):
        haveit = False
        for url in  url_list:
            conn = http.client.HTTPConnection(url,timeout=time_out)
            try:
                conn.request("HEAD", "/")
                conn.close()
                haveit = True
                break
            except:
                conn.close()
                pass
        return haveit


    # ============================================================================

    def insertReportTab ( self,title_str,focus=True ):
        pyrvapi.rvapi_insert_tab ( self.report_page_id(),title_str,
                                   self.log_page_id(),focus  )
        self.rvrow = 0;
        self.putTitle ( title_str )
        pyrvapi.rvapi_flush ()
        return

    def putMessage ( self,message_str,col=0,colSpan=1 ):
        pyrvapi.rvapi_set_text ( message_str,self.report_page_id(),self.rvrow,col,1,colSpan )
        self.rvrow += 1
        return
    
    def putNote ( self,message_str,col=0,colSpan=1 ):
        pyrvapi.rvapi_set_text ( "<h3 style=\"color:#4682B4;\"> Note: " + message_str +  "</h3>", self.report_page_id(),self.rvrow,col,1,colSpan )
        self.rvrow += 1
        return

    def putMessage1 ( self,pageId,message_str,row,col=0,rowSpan=1,colSpan=1 ):
        pyrvapi.rvapi_set_text ( message_str,pageId,row,col,rowSpan,colSpan )

        # pyrvapi.rvapi_shape_table_cell ( pageId,row,col,"","\"text-align: right;\"","",
        #                                  rowSpan,colSpan )
        #   const char * tooltip,
        #   const char * cell_style,
        #   const char * cell_css,
        #   const int    rowSpan,
        #   const int    colSpan
        # );

        return

    def putMessageLF ( self,message_str ):
        pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>" + message_str +
                        "</font>",self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putWaitMessageLF ( self,message_str,message2="" ):
        gridId = "wait_message_" + str(self.widget_no)
        pyrvapi.rvapi_set_text ( "&nbsp;",self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),self.rvrow,0,1,1 )
        # pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>" + message_str +
        #                          "</font>",gridId,0,0,1,1 )
        pyrvapi.rvapi_set_text ( "<i>" + message_str + "</i>" ,gridId,0,0,1,1 )
        pyrvapi.rvapi_set_text ( "<div class='activity_bar'/>",gridId,0,1,1,1 )
        if message2:
            pyrvapi.rvapi_set_text ( message2,gridId,0,2,1,1 )
        self.widget_no += 1
        pyrvapi.rvapi_flush ()
        return gridId

    def putTitle ( self,title_str ):
        if self.rvrow>0:
            pyrvapi.rvapi_set_text ( "&nbsp;",self.report_page_id(),self.rvrow,0,1,1 )
            self.rvrow += 1
        self.putTitle1 ( self.report_page_id(),title_str,self.rvrow,colSpan=1 )
        self.rvrow += 1
        return

    def putSpacer ( self,height_px ):
        self.putSpacer1 ( self.report_page_id(),height_px,self.rvrow )
        self.rvrow += 1
        return

    def putSpacer1 ( self,pageId,height_px,row ):
        h = str(height_px) + "px;"
        pyrvapi.rvapi_set_text (
                "<div style='font-size:" + h + "height:" + h + "'></div>",
                pageId,row,0,1,1 )
        pyrvapi.rvapi_set_cell_stretch ( pageId,10,height_px,row,0 )
        return

    def insertTab ( self,tabId,tabName,content,focus=False ):
        pyrvapi.rvapi_insert_tab ( tabId,tabName,self.log_page_id(),focus )
        if content:
            pyrvapi.rvapi_append_content ( content,True,tabId )
        return

    def removeTab ( self,tabId ):
        pyrvapi.rvapi_remove_tab ( tabId )
        return

    def stdout ( self,message ):
        self.file_stdout.write ( message )
        return

    def stdoutln ( self,message ):
        self.file_stdout.write ( message + "\n" )
        return

    def stdout1 ( self,message ):
        self.file_stdout1.write ( message )
        return

    def stdout1ln ( self,message ):
        self.file_stdout1.write ( message + "\n" )
        return

    def stderr ( self,message ):
        self.file_stderr.write ( message )
        return

    def stderrln ( self,message ):
        self.file_stderr.write ( message + "\n" )
        return

    def flush(self):
        pyrvapi.rvapi_flush()
        self.file_stdout .flush()
        self.file_stdout1.flush()
        self.file_stderr .flush()
        return

    def putTitle1 ( self,pageId,title_str,row,colSpan=1,col=0 ):
        pyrvapi.rvapi_set_text (
                        "<h2>[" + self.job_id.zfill(4) + "] " + title_str + "</h2>",
                        pageId,row,col,1,colSpan )
        return

    def putHR ( self ):
        self.putMessage ( "<hr/>" )
        return

    def putHR1 ( self,pageId,row ):
        self.putMessage1 ( pageId,"<hr/>",row )
        return


    # ============================================================================

    def putPanel ( self,panel_id ):
        pyrvapi.rvapi_set_text  ( "",self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_add_panel ( panel_id,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putPanel1 ( self,pageId,panel_id,row,colSpan=1 ):
        pyrvapi.rvapi_set_text  ( "",self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_add_panel ( panel_id,pageId,row,0,1,colSpan )
        return

    def appendContent ( self,panel_id,fpath,watch=False ):
        pyrvapi.rvapi_append_content ( fpath,watch,panel_id )
        return

    def putFieldset ( self,fset_id,title ):
        pyrvapi.rvapi_add_fieldset ( fset_id,title,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putSection ( self,sec_id,sectionName,openState_bool=False ):
        pyrvapi.rvapi_add_section ( sec_id,sectionName,self.report_page_id(),
                                    self.rvrow,0,1,1,openState_bool )
        self.rvrow += 1
        return


    # ============================================================================
    # define basic HTML report functions

    def putSummaryLine ( self,line0,line1,line2 ):
        if self.import_summary_id():
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line0,self.summary_row,0 )
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line1,self.summary_row,1 )
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line2,self.summary_row,2 )
            self.summary_row_0 = self.summary_row
            self.summary_row  += 1
        return


    def addSummaryLine ( self,line1,line2 ):
        if self.import_summary_id():
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line1,self.summary_row,0 )
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line2,self.summary_row,1 )
            self.summary_row += 1
            pyrvapi.rvapi_shape_table_cell ( self.import_summary_id(),self.summary_row_0,0,"","","",
                                             self.summary_row-self.summary_row_0,1 );
        return


    def putSummaryLine_red ( self,line0,line1,line2 ):
        if self.import_summary_id():
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line0,self.summary_row,0 )
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line1,self.summary_row,1 )
            pyrvapi.rvapi_put_table_string ( self.import_summary_id(),line2,self.summary_row,2 )
            pyrvapi.rvapi_shape_table_cell ( self.import_summary_id(),self.summary_row,0,"",
                                                    "text-align:left;color:maroon;","",1,1 )
            pyrvapi.rvapi_shape_table_cell ( self.import_summary_id(),self.summary_row,1,"",
                                                    "text-align:left;color:maroon;","",1,1 )
            pyrvapi.rvapi_shape_table_cell ( self.import_summary_id(),self.summary_row,2,"",
                                                    "text-align:left;color:maroon;","",1,1 )
            self.summary_row += 1
        return

    def putTable ( self,tableId,title_str,holderId,row,
                        col=0,rowSpan=1,colSpan=1,mode=100 ):
        pyrvapi.rvapi_add_table ( tableId,title_str,holderId,row,col,
                                  rowSpan,colSpan, mode )
        pyrvapi.rvapi_set_table_style ( tableId,
                                        "table-blue","text-align:left;" )
        return

    def setTableHorzHeader ( self,tableId,col,header,tooltip ):
        pyrvapi.rvapi_put_horz_theader ( tableId,header,tooltip,col )
        return

    def setTableVertHeader ( self,tableId,row,header,tooltip ):
        pyrvapi.rvapi_put_vert_theader ( tableId,header,tooltip,row )
        return

    def setTableHorzHeaders ( self,tableId,header_list,tooltip_list ):
        for i in range(len(header_list)):
            pyrvapi.rvapi_put_horz_theader ( tableId,header_list[i],
                                             tooltip_list[i],i )
        return

    def putTableString ( self,tableId,S,tooltip,row,col,rowSpan=1,colSpan=1 ):
        pyrvapi.rvapi_put_table_string ( tableId,S,row,col )
        pyrvapi.rvapi_shape_table_cell ( tableId,row,col,tooltip,
            "text-align:left;width:100%;white-space:nowrap;" + \
            "font-family:\"Courier\";text-decoration:none;" + \
            "font-weight:normal;font-style:normal;width:auto;",
            "",rowSpan,colSpan )
        return

    def putTableLine ( self,tableId,header,tooltip,line,row ):
        pyrvapi.rvapi_put_vert_theader ( tableId,header,tooltip,row )
        if line:
            pyrvapi.rvapi_put_table_string ( tableId,line,row,0 )
            pyrvapi.rvapi_shape_table_cell ( tableId,row,0,tooltip,
                "text-align:left;width:100%;white-space:nowrap;" + \
                "font-family:\"Courier\";text-decoration:none;" + \
                "font-weight:normal;font-style:normal;width:auto;",
                "",1,1 )
        return row+1

    def putGrid ( self,gridId,filling_bool=False ):
        pyrvapi.rvapi_add_grid ( gridId,filling_bool,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putGrid1 ( self,gridId,holderId,filling_bool,row,col=0,rowSpan=1,colSpan=1 ):
        pyrvapi.rvapi_add_grid ( gridId,filling_bool,holderId,row,col,rowSpan,colSpan )
        return


    # ============================================================================

    def open_stdin ( self ):
        self.file_stdin = open ( self.file_stdin_path(),"w" )
        return

    def write_stdin ( self,S ):
        if type(S) is list:
            for line in S:
                if line:
                    self.file_stdin.write ( line + "\n" )
        else:
            self.file_stdin.write ( S )
        return

    def close_stdin ( self ):
        self.file_stdin.close()
        return


    # ============================================================================

    # for use in import reports
    cloud_import_path = {}
    def get_cloud_import_path ( self,fname ):
        if fname in self.cloud_import_path:
            return self.cloud_import_path[fname]
        return fname

    def resetFileImport ( self ):
        self.files_all = []
        self.file_type = {}
        return

    def addFileImport ( self,filePath,ftype=None,baseDirPath="" ):

        #if dirPath:
        #    fpath = os.path.join ( dirPath,fname )
        #else:
        #    fpath = fname

        fpath = filePath
        if fpath.lower().endswith(".gz"):   # ungzip files as necessary
            fpath = zutils.gunzip ( filePath,baseDirPath=baseDirPath )

        if fpath.lower().endswith(".sca"):  # convert to mtz
            scalepack = None;
            try:
                f = open ( 'annotation.json','r' )
                scalepack = jsonut.jObject ( f.read() ).scalepack
            except:
                pass
            if scalepack:
                self.stderrln ( fpath )
                self.stderrln ( scalepack.to_JSON() )
                fpath1 = os.path.splitext(fpath)[0] + ".mtz"
                self.open_stdin()
                self.write_stdin ( "WAVE " +\
                                   getattr(scalepack,fpath,None).wavelength +\
                                   "\nEND\n" )
                self.close_stdin()
                self.runApp ( "scalepack2mtz",[
                        "HKLIN" ,os.path.join(baseDirPath,fpath),
                        "HKLOUT",os.path.join(baseDirPath,fpath1)
                    ],logType="Service" )
                fpath = fpath1
            else:
                self.stderrln ( " *** scalepack annotation file not found at import" )

        self.files_all.append ( fpath )
        if ftype:
            self.file_type[fpath] = ftype
        else:
            self.file_type[fpath] = import_filetype.getFileType (
                                       fpath,self.importDir(),self.file_stdout )

        return

    def checkFileImport ( self,fpath,ftype ):
        if fpath in self.file_type:
            return (self.file_type[fpath]==ftype)
        return False

    def checkFileImportL ( self,fpath,ftype_list ):
        if fpath in self.file_type:
            return (self.file_type[fpath] in ftype_list)
        return False

    # ============================================================================

    def writeKWParameter ( self,item ):
        if getattr(item,"visible",True):
            if (item.type  == "integer" or item.type == "real"):
                self.file_stdin.write ( item.keyword + " " + str(item.value) + "\n" )
            elif (item.type == "integer_" or item.type == "real_") and (item.value != ""):
                self.file_stdin.write ( item.keyword + " " + str(item.value) + "\n" )
            elif (item.type  == "combobox"):
                self.file_stdin.write ( item.keyword + " " + item.value + "\n" )
            elif (item.type  == "checkbox"):
                if item.value:
                    self.file_stdin.write ( item.keyword + " " + item.translate[1] + "\n" )
                else:
                    self.file_stdin.write ( item.keyword + " " + item.translate[0] + "\n" )
        return item.value

    def putKWParameter ( self,item ):
        if getattr(item,"visible",True):
            if item.type=="checkbox":
                if item.value:
                    return item.keyword + "\n"
                else:
                    return ""
            else:
                return item.keyword + " " + str(item.value) + "\n"
        else:
            return ""


    def getKWParameter ( self,keyword,item ):
        if getattr(item,"visible",True):
            if item.type=="checkbox":
                if item.value:
                    return " " + keyword
                else:
                    return ""
            else:
                v = str(item.value)
                if v:
                    if keyword.endswith("=") or keyword.endswith("::"):
                        return " " + keyword + v
                    else:
                        return " " + keyword + " " + v
        else:
            return ""

    def getKWItem ( self,item ):
        if getattr(item,"visible",True):
            if item.type=="checkbox":
                if hasattr(item,"translate"):
                    if item.value:
                        return " " + item.keyword + str(item.translate[1])
                    else:
                        return " " + item.keyword + str(item.translate[0])
                elif item.value:
                    return " " + item.keyword
                else:
                    return ""
            else:
                v = str(item.value)
                if v and v!="_blank_":
                    if item.keyword.endswith("=") or item.keyword.endswith("::"):
                        return " " + item.keyword + v
                    else:
                        return " " + item.keyword + " " + v
        return ""


    def getParameter ( self,item,checkVisible=True ):
        if getattr(item,"visible",True) or not checkVisible or self.task.autoRunName:
            value = str(item.value)
            if not self.task.autoRunName:
                return value
            else:  # in workflow
                defval = getattr ( item,"default",False )
                if value=="" and defval:
                    return defval
                return value
        return ""
        """
            if (item.type == "integer" or item.type == "real"):
                return str(item.value)
            elif (item.type == "integer_" or item.type == "real_") and (item.value != ""):
                return str(item.value)
            else:
                return str(item.value)
        return ""
        """

    def getParameterN ( self,item,name,checkVisible=True ):
        return self.getParameter ( getattr(item,name),checkVisible )


    def getCheckbox ( self,item,checkVisible=True ):
        if item.type=="checkbox" and (getattr(item,"visible",True) or not checkVisible):
            if hasattr(item,"translate"):
                if item.value:
                    return str(item.translate[1])
                else:
                    return str(item.translate[0])
            else:
                return item.value
        return ""


    # ============================================================================

    def addCitation ( self,appName ):
        citations.addCitation ( appName )
        return

    def addCitations ( self,appName_list ):
        citations.addCitations ( appName_list )
        return

    def removeCitation ( self,appName ):
        citations.removeCitation ( appName )
        return

    def clearCitations ( self ):
        citations.clearCitations()
        return

    def _add_citations ( self,clist ):
        for c in clist:
            if c not in self.citation_list:
                self.citation_list.append ( c )
        return

    def makeClass ( self,data_obj ):
        if (type(data_obj)==dict) and ("citations" in data_obj):
            clist = data_obj["citations"]
        elif hasattr(data_obj,"citations"):
            clist = data_obj.citations
        else:
            clist = []
        self._add_citations ( clist )
        return databox.make_class ( data_obj )


    # ============================================================================

    def unsetLogParser ( self ):
        self.flush();
        #self.file_stdout.flush()
        self.log_parser = None
        #pyrvapi.rvapi_flush()
        return

    def setGenericLogParser ( self,panel_id,split_sections_bool,
                              graphTables=False,makePanel=True ):
        #return
        if makePanel:
            self.putPanel ( panel_id )
        self.log_parser = pyrvapi_ext.parsers.generic_parser (
                                         panel_id,split_sections_bool,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables,
                                         hide_refs=True )
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    def setModelCraftLogParser ( self,panel_id,job_params,
                             split_sections_bool=False,
                             graphTables=False,makePanel=True ):
        #return
        if makePanel:
            self.putPanel ( panel_id )
        self.log_parser = modelcraft_parser.modelcraft_parser (
                                         panel_id,split_sections_bool,
                                         job_params=job_params,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables,
                                         hide_refs=True )
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    def setRefmacLogParser ( self,panel_id,split_sections_bool,
                             graphTables=False,makePanel=True ):
        #return
        if makePanel:
            self.putPanel ( panel_id )
        self.log_parser = refmac_parser.refmac_parser (
                                         panel_id,split_sections_bool,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables,
                                         hide_refs=True )
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    def setBaverLogParser ( self,panel_id,split_sections_bool,
                              graphTables=False,makePanel=True ):
        #return
        if makePanel:
            self.putPanel ( panel_id )
        self.log_parser = baver_parser.baver_parser (
                                         panel_id,split_sections_bool,
                                         hide_refs=True,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables)
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    def setEdstatsLogParser ( self,panel_id,split_sections_bool,
                              graphTables=False,makePanel=True ):
        #return
        if makePanel:
            self.putPanel ( panel_id )
        self.log_parser = edstats_parser.edstats_parser (
                                         panel_id,split_sections_bool,
                                         hide_refs=True,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables)
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    def setMolrepLogParser ( self,panel_id ):
        #return
        self.putPanel ( panel_id )
        self.log_parser = pyrvapi_ext.parsers.molrep_parser ( panel_id )
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    def setArpWarpLogParser ( self,panel_id,job_params,wares_file ):
        #return
        self.putPanel ( panel_id )
        self.log_parser = pyrvapi_ext.parsers.arpwarp_parser ( panel_id,
                                    job_params=job_params,resfile=wares_file )
        self.flush()
        #pyrvapi.rvapi_flush()
        return


    # ============================================================================

    def putGraphWidget ( self,graphId,xData,yData,xTitle,yTitle, width=700,height=400 ):

        pyrvapi.rvapi_add_graph ( graphId,self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_set_graph_size    ( graphId,width,height )
        self.rvrow += 1

        pyrvapi.rvapi_add_graph_data    ( "data",graphId,"xydata" )
        pyrvapi.rvapi_add_graph_dataset ( "X","data",graphId,"Xcol","Xcol" )
        pyrvapi.rvapi_add_graph_plot    ( "plot",graphId,"---",xTitle,yTitle )

        for j in range(len(xData)):
            pyrvapi.rvapi_add_graph_real ( "X","data",graphId,xData[j],"%g" )
        for i in range(len(yData)):
            yId = "Y"+str(i)
            pyrvapi.rvapi_add_graph_dataset ( yId,"data",graphId,
                                              "Ycol"+str(i),"Ycol"+str(i) )
            for j in range(len(yData[i])):
                pyrvapi.rvapi_add_graph_real ( yId,"data",graphId,float(yData[i][j]),"%g" )
            pyrvapi.rvapi_add_plot_line ( "plot","data",graphId,"X",yId )

        #pyrvapi.rvapi_set_line_options ( "dist","plot","data",self.dist_graph_id(),
        #                                     "#00008B","solid","filledCircle",2.5,True )

        return

    def putLogGraphWidget ( self,graphId,data ):
    #  data is list of data blocks of the following structure:
    #    [{ name: "Block name",
    #       plots: [
    #           { name: "Plot name",
    #             xtitle : "X-title",
    #             ytitle : "Y-title",
    #             x   : {name:"X name", values:[x1,x2,x3,...]},
    #             y   : [{name:"Y1 name", values:[y11,y12,...]},
    #                    {name:"Y2 name", values:[y21,y22,...],
    #                    ...]
    #           },
    #           ....
    #        ]
    #      },
    #      .........
    #    ]


        pyrvapi.rvapi_add_loggraph ( graphId,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1

        for i in range(len(data)):
            dataId = "data" + str(i)
            pyrvapi.rvapi_add_graph_data ( dataId,graphId,data[i]["name"] )
            plots = data[i]["plots"]
            for j in range(len(plots)):
                plot = plots[j]
                plotId = "plot_" + str(i) + "_" + str(j)
                pyrvapi.rvapi_add_graph_plot ( plotId,graphId,plot["name"],
                                               plot["xtitle"],plot["ytitle"] )
                x   = plot["x"]
                y   = plot["y"]
                xId = "x_" + str(i) + "_" + str(j)
                pyrvapi.rvapi_add_graph_dataset ( xId,dataId,graphId,x["name"],x["name"] )
                values = x["values"]
                for k in range(len(values)):
                    pyrvapi.rvapi_add_graph_real ( xId,dataId,graphId,values[k],"%g" )
                for n in range(len(y)):
                    yId = "y_" + str(i) + "_" + str(j) + "_" + str(n)
                    pyrvapi.rvapi_add_graph_dataset ( yId,dataId,graphId,y[n]["name"],y[n]["name"] )
                    values = y[n]["values"]
                    for k in range(len(values)):
                        pyrvapi.rvapi_add_graph_real ( yId,dataId,graphId,values[k],"%g" )
                    pyrvapi.rvapi_add_plot_line ( plotId,dataId,graphId,xId,yId )
                    #pyrvapi.rvapi_set_line_options ( yset,"plot","data",self.hits_graph_id(),
                    #                                         color,"solid","off",2.5,True )

        return


    # ============================================================================

    def putVerdict ( self, score,message,secId="" ):
        gridId = self.putVerdict1 ( self.report_page_id(),score,message,self.rvrow,
                                    col=0,secId=secId )
        self.rvrow += 1
        return gridId

    def putVerdict1 ( self, pageId,score,message,row,col=0,secId="" ):
        gridId = self.getWidgetId ( "verdict" )
        self.putGrid1 ( gridId,pageId,False,row,col=col,rowSpan=1,colSpan=1 )
        gaugeId = self.getWidgetId ( "gauge" )
        self.putMessage1 ( gridId,
            "<div id='" + gaugeId + "'></div><script>" +\
            "GaugeWidget('" + gaugeId + "','" + secId + "','140px'," +\
                              str(score) + ",100,'scheme-3');</script>",0,col=0 )
        self.putMessage1 ( gridId,"<div>" + message + "</div>",0,col=1 )
        return gridId


    # ============================================================================

    def stampFileName ( self,serNo,fileName ):
        return dtype_template.makeFileName ( self.job_id,serNo,fileName )

    def makeDataId ( self,serNo ):
        return dtype_template.makeDataId ( self.job_id,serNo )

    # ============================================================================

    def storeReportDocument(self,meta_str):
        self.flush()
        if meta_str:
            pyrvapi.rvapi_put_meta ( meta_str )
        pyrvapi.rvapi_store_document2 ( self.reportDocumentName() )
        return

    def restoreReportDocument(self):
        pyrvapi.rvapi_restore_document2 ( self.reportDocumentName() )
        return pyrvapi.rvapi_get_meta()


    # ============================================================================

    def makeFullASUSequenceFile ( self,seq_list,title,fileName ):
        combseq = ""
        for s in seq_list:
            seqstring = self.makeClass(s).getSequence ( self.inputDir() )
            for i in range(s.ncopies):
                combseq += seqstring
        dtype_sequence.writeSeqFile ( fileName,title,combseq )
        return

    # ============================================================================

    def checkCCP4AppExists ( self,appName ):
        fpath = os.path.join ( os.environ["CCP4"],"bin",appName )
        if os.path.isfile(fpath):
            return True
        else:
            self.putMessage ( "<h3>Application <i>" + appName + "</i> not found</h3>" +\
                              "The task cannot be run because application <i>" +\
                              appName + "</i> not found in CCP4 setup. Apologies."
                            )
            self.fail ( "<p>&nbsp; *** Error: CCP4 setup does not contain " + appName + ".\n" + \
                        "     Please look for support\n",appName + " not found" )
            return False


    def runApp ( self,appName,cmd,logType="Main",quitOnError=True,env=None,work_dir="." ):

        input_script = None
        if self.file_stdin:
            input_script    = self.file_stdin_path()
            self._scriptNo += 1

        logfile     = self.file_stdout
        logfile_alt = None
        if logType=="Service":
            logfile     = self.file_stdout1
            logfile_alt = self.file_stdout

        rc = command.call ( appName,cmd,"./",input_script,
                            logfile,self.file_stderr,self.log_parser,
                            file_stdout_alt=logfile_alt,env=env,
                            work_dir=work_dir )
        self.file_stdin = None
        self.flush()

        if rc.msg and quitOnError:
            raise signal.JobFailure ( rc.msg )

        return rc


    def putCitations(self):
        if len(citations.citation_list)>0:
            self.putTitle ( "References" )
            self.putMessage ( citations.makeCitationsHTML(self,width="800px"),colSpan=1 )
        self._add_citations ( citations.citation_list )
        self.outputDataBox.putCitations ( self.citation_list )
        return


    # ============================================================================

    def parseRefmacLog ( self,filepath ):
        rfree_pattern   = "             R free"
        rfactor_pattern = "           R factor"
        rfree   = 0.0
        rfactor = 0.0
        with open(filepath,"r") as f:
            for line in f:
                if line.startswith(rfree_pattern):
                    rfree   = float(line.split()[3])
                elif line.startswith(rfactor_pattern):
                    rfactor = float(line.split()[3])
        if rfree>0.0 and rfactor>0.0:
            self.generic_parser_summary["refmac"] = {
                "R_factor" : rfactor,
                "R_free"   : rfree
            }
        return


    def calcEDMap ( self,xyzPath,hklData,libPath,filePrefix,inpDir=None ):
        
        idir = inpDir
        if not idir:
            idir = self.inputDir()
        rc = edmap.calcEDMap ( xyzPath,hklData.getHKLFilePath(idir),
                          libPath,hklData.dataset,filePrefix,self.job_dir,
                          self.file_stdout1,self.file_stderr,self.log_parser )
        xyzout = filePrefix
        if xyzPath.lower().endswith('.pdb'):
            xyzout += edmap.file_pdb()
        else:
            xyzout += edmap.file_mmcif()

        if not self.log_parser:
            self.file_stdout1.close()
            self.parseRefmacLog ( self.file_stdout1_path() )
            self.file_stdout1 = open ( self.file_stdout1_path(),"a" )

        return [ xyzout,filePrefix + edmap.file_mtz(),None,None,rc ]
 

    def calcAnomEDMap ( self,xyzPath,hklData,anom_form,filePrefix ):

        edmap.calcAnomEDMap ( xyzPath,hklData.getHKLFilePath(self.inputDir()),
                              hklData.dataset,anom_form,filePrefix,self.job_dir,
                              self.file_stdout1,self.file_stderr,self.log_parser )

        if not self.log_parser:
            self.file_stdout1.close()
            self.parseRefmacLog ( self.file_stdout1_path() )
            self.file_stdout1 = open ( self.file_stdout1_path(),"a" )

        return [ filePrefix + edmap.file_pdb (),
                 filePrefix + edmap.file_mtz () ]
                #  filePrefix + edmap.file_map (),
                #  filePrefix + edmap.file_dmap() ]


    def calcCCP4Maps ( self,mtzPath,filePrefix,source_key="refmac" ):
        edmap.calcCCP4Maps ( mtzPath,filePrefix,self.job_dir,
                             self.file_stdout1,self.file_stderr,
                             source_key,self.log_parser )
        return [ filePrefix + edmap.file_map(),
                 filePrefix + edmap.file_dmap() ]
    

    def fixBFactors ( self,xyzs ):
        for i in range(len(xyzs)):
            xyzs[i].convertToPDB ( self.inputDir() )
            if xyzs[i].BF_correction=="alphafold-suggested":
                xyzs[i].fixBFactors ( self.inputDir(),"alphafold" )
                self.stdoutln ( " ..... " + xyzs[i].getPDBFileName() +\
                                ": B-factors re-calculated assuming Alphafold model" )
                self.putMessage ( 
                    "<span style=\"font-size:85%\"><b>** " + xyzs[i].dname +\
                    "</b>: <i>B-factors re-calculated assuming Alphafold model</i></span>" )
            elif xyzs[i].BF_correction=="rosetta-suggested":
                xyzs[i].fixBFactors ( self.inputDir(),"rosetta" )
                self.stdoutln ( " ..... " + xyzs[i].getPDBFileName() +\
                                ": B-factors re-calculated assuming Rosetta model" )
                self.putMessage ( 
                    "<span style=\"font-size:85%\"><b>** " + xyzs[i].dname +\
                    "</b>: <i>B-factors re-calculated assuming Rosetta model</i></span>" )
        return


    # ----------------------------------------------------------------------

    def makePhasesMTZ ( self,mtzHKL,lblHKL,mtzPhases,lblPhases,mtzOut ):

        cmd = [ "HKLIN1",mtzHKL,
                "HKLIN2",mtzPhases,
                "HKLOUT",mtzOut ]

        self.open_stdin()

        self.write_stdin ( "LABIN  FILE 1" )
        if len(lblHKL)>0:
            for i in range(len(lblHKL)):
                self.write_stdin ( " E%d=%s" % (i+1,lblHKL[i]) )
        else:
            self.write_stdin ( " ALL" )

        self.write_stdin ( "\nLABIN  FILE 2" )
        if len(lblPhases)>0:
            for i in range(len(lblPhases)):
                self.write_stdin ( " E%d=%s" % (i+1,lblPhases[i]) )
        else:
            self.write_stdin ( " ALL" )
        self.write_stdin ( "\n" )

        self.close_stdin()

        self.runApp ( "cad",cmd,logType="Service" )

        return

    def makeMTZ ( self,mtzlbl,mtzOut ):
    # mtzlbl = [
    #     { "path"   : "/path/file.mtz",
    #       "labin"  : [l1,l2,...]
    #       "labout" : [l1,l2,...]
    #     }, {
    #       "path"   : "/path/file.mtz",
    #       "labin"  : [l1,l2,...]
    #       "labout" : [l1,l2,...]
    #     }
    # ]

        cmd = []
        self.open_stdin()
        for i in range(len(mtzlbl)):
            cmd.append ( "HKLIN"+str(i+1)  )
            cmd.append ( mtzlbl[i]["path"] )
            labin = mtzlbl[i]["labin"]
            self.write_stdin ( "LABIN  FILE " + str(i+1) )
            if len(labin)==1 and labin[0].lower()=="all":
                self.write_stdin ( " ALL" )
            else:
                for j in range(len(labin)):
                    self.write_stdin ( " E%d=%s" % (j+1,labin[j]) )
                labout = mtzlbl[i]["labout"]
                self.write_stdin ( "\nLABOUT FILE " + str(i+1) )
                for j in range(len(labout)):
                    self.write_stdin ( " E%d=%s" % (j+1,labout[j]) )
            self.write_stdin ( "\n" )

        self.close_stdin()
        cmd.append ( "HKLOUT" )
        cmd.append ( mtzOut   )

        self.runApp ( "cad",cmd,logType="Service" )

        return


    def sliceMTZ ( self,mtzInPath,label_list,mtzOutPath,labelout_list=[] ):

        self.open_stdin()
        self.write_stdin ( "LABIN  FILE 1" )
        for i in range(len(label_list)):
            self.write_stdin ( " E%d=%s" % (i+1,label_list[i]) )
        if len(labelout_list)==len(label_list):
            self.write_stdin ( "\nLABOUT FILE 1" )
            for i in range(len(labelout_list)):
                self.write_stdin ( " E%d=%s" % (i+1,labelout_list[i]) )
        self.write_stdin ( "\n" )
        self.close_stdin()

        self.runApp ( "cad",[ "HKLIN1",mtzInPath,"HKLOUT",mtzOutPath ],
                            logType="Service" )

        return


    def mtz2hkl ( self,mtzInPath,labels,hklOutPath ):
        # labels = [FP,SigFP,FreeR_flag]

        # use mtz2various to prepare the reflection file
        cmd = [ "HKLIN" ,mtzInPath,
                "HKLOUT",hklOutPath ]

        self.open_stdin  ()
        self.write_stdin (
            "LABIN   FP="    + labels[0] + " SIGFP=" + labels[1] +\
                                           " FREE="  + labels[2] +\
            "\nOUTPUT SHELX" +\
            #"\nFSQUARED"     +\
            "\nEND\n"
        )
        self.close_stdin()

        # run mtz-to-hkl converter
        self.runApp ( "mtz2various",cmd,logType="Service" )

        return


    # ------------------------------------------------------------------------

    def get_ligand_code ( self,exclude_list ):
        alphabet  = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        excl_list = exclude_list + self.ligand_exclude_list

        for L1 in alphabet:
            dirpath = os.path.join ( os.environ["CCP4"],"lib","data","monomers",L1.lower() )
            dirSet  = set ( os.listdir(dirpath) )
            for L2 in alphabet:
                for L3 in alphabet:
                    code = L1 + L2 + L3
                    if code+".cif" not in dirSet and code not in excl_list:
                        return code
        return None


    # ----------------------------------------------------------------------

    def add_seqid_remark ( self,model,seqid_lst ):
        ens_path = model.getPDBFilePath ( self.outputDir() )
        file = open ( ens_path,"r" )
        fcnt = file.read()
        file.close  ()
        file = open ( ens_path,"w" )
        model.meta["seqId_ens"] = []
        for i in range(len(seqid_lst)):
            if model.BF_correction=="alphafold":
                file.write  ( "REMARK PHASER ENSEMBLE MODEL " +\
                            str(i+1) + " RMS " + str(model.meta["rmsd"]) + "\n" )   
            else:
                file.write  ( "REMARK PHASER ENSEMBLE MODEL " +\
                            str(i+1) + " ID " + seqid_lst[i] + "\n" )
            model.meta["seqId_ens"].append ( seqid_lst[i] )
        lst = fcnt.split ( "\n" )
        for s in lst:
            if "REMARK PHASER ENSEMBLE MODEL" not in s:
                file.write ( s + "\n" )
        # file.write  ( fcnt )
        file.close  ()
        model.seqrem  = True
        model.simtype = "rmsd"
        
        # if len(seqid_lst)==1:
        #     model.meta["seqId"] = seqid_lst[0]
        return

    # ----------------------------------------------------------------------

    def finaliseStructure ( self,xyzPath,name_pattern,hkl,libPath,associated_data_list,
                                 structureType,
                                 leadKey=1,
                                 openState="hidden",
                                 title="Output Structure",
                                 inpDir=None,
                                 stitle="Structure and electron density",
                                 reserveRows=0 ):
        #  structureType = 0: macromolecular coordinates at xyzPath
        #                = 1: heavy atom substructure at xyzPath

        structure = None

        if os.path.isfile(xyzPath):

            if openState!="hidden":
                sec_id = self.getWidgetId ( self.refmac_section() )
                self.putSection ( sec_id,"Electron Density Calculations with Refmac",
                                  openState=="open" )

                panel_id = self.getWidgetId ( self.refmac_report() )
                pyrvapi.rvapi_add_panel ( panel_id,sec_id,0,0,1,1 )

                self.setRefmacLogParser ( panel_id,False,
                                          graphTables=False,makePanel=False )
            else:
                self.unsetLogParser()

            fnames = self.calcEDMap ( xyzPath,hkl,libPath,name_pattern,inpDir )

            # if openState_bool=="hidden":
            #     tdict = {
            #         "title": "Final R-factors",
            #         "state": 0, "class": "table-blue", "css": "text-align:right;",
            #         "rows" : [
            #             { "header": { "label": "R<sub>free</sub>", "tooltip": "R-free"},
            #               "data"  : [ str(self.generic_parser_summary["refmac"]["R_free"]) ]},
            #             { "header": { "label": "R<sub>factor</sub>", "tooltip": "R-factor"},
            #               "data"  : [ str(self.generic_parser_summary["refmac"]["R_factor"]) ]}
            #         ]
            #     }
            #     rvapi_utils.makeTable ( tdict, self.getWidgetId("ref_table"),
            #                             self.report_page_id(),
            #                             self.rvrow,0,1,1 )
            #     self.rvrow += 1

            self.rvrow += reserveRows

            # Register output data. This moves needful files into output directory
            # and puts the corresponding metadata into output databox

            if fnames[4].msg:
                structure = None

            elif structureType==1:
                structure = self.registerStructure (
                                None,
                                None,
                                fnames[0],
                                fnames[1],
                                libPath  = libPath,
                                mapPath  = fnames[2],
                                dmapPath = fnames[3],
                                leadKey  = leadKey,
                                refiner  = "refmac" 
                            )
            else:
                structure = self.registerStructure (
                                None,
                                fnames[0],
                                None,
                                fnames[1],
                                libPath  = libPath,
                                mapPath  = fnames[2],
                                dmapPath = fnames[3],
                                leadKey  = leadKey,
                                refiner  = "refmac" 
                            )
            if structure:
                structure.addDataAssociation ( hkl.dataId )
                structure.setRefmacLabels    ( hkl )
                for i in range(len(associated_data_list)):
                    if associated_data_list[i]:
                        structure.addDataAssociation ( associated_data_list[i].dataId )
                structure.addPhasesSubtype()
                if title:
                    self.putTitle ( title +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
                elif title is not None:
                    self.putMessage ( "&nbsp;" )
                self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                          "Structure and electron density",
                                          structure )
            else:
                self.putTitle   ( "Solution unavailable" )
                self.putMessage ( "It was not possible to finish formation of "   +\
                    "output structure. Check that your structure model does not " +\
                    "contain residues absent in the Monomer Library and wrongly " +\
                    "named residues or atoms. Check output logs for other possible " +\
                    "reasons." )

        else:
            self.putTitle ( "No Solution Found" )

        return structure


    def finaliseAnomSubstructure ( self,xyzPath,name_pattern,hkl,
                                        associated_data_list,
                                        anom_form,openState="closed",
                                        title="" ):

        anom_structure = self.finaliseAnomSubstructure1 ( xyzPath,name_pattern,
                                        hkl,associated_data_list,anom_form,
                                        self.report_page_id(),self.rvrow,
                                        openState,title )
        self.rvrow += 2
        if anom_structure:
            self.rvrow += 2
            if title:
                self.rvrow += 1

        return anom_structure


    def finaliseAnomSubstructure1 ( self,xyzPath,name_pattern,hkl,
                                         associated_data_list,anom_form,pageId,
                                         row,openState="closed",title="" ):

        row1 = row
        if openState!="hidden":
            sec_id = self.refmac_section() + "_" + str(self.widget_no)

            pyrvapi.rvapi_add_section ( sec_id,
                            "Anomalous Electron Density Calculations with Refmac",
                            pageId,row1,0,1,1,openState=="open" )
            row1 += 1

            panel_id = self.refmac_report() + "_" + str(self.widget_no)
            pyrvapi.rvapi_add_panel ( panel_id,sec_id,0,0,1,1 )

            self.setRefmacLogParser ( panel_id,False,graphTables=False,makePanel=False )
        else:
            self.unsetLogParser()

        fnames = self.calcAnomEDMap ( xyzPath,hkl,anom_form,name_pattern )

        anom_structure = self.registerStructure (
                            None,
                            None,
                            fnames[0],
                            fnames[1],
                            refiner="refmac" 
                        )
        if anom_structure:
            anom_structure.addDataAssociation ( hkl.dataId )
            anom_structure.setRefmacLabels    ( hkl )
            for i in range(len(associated_data_list)):
                if associated_data_list[i]:
                    anom_structure.addDataAssociation ( associated_data_list[i].dataId )
            anom_structure.setAnomSubstrSubtype() # anomalous maps
            self.putMessage1 ( pageId,"&nbsp;",row1 )
            row1 += 1
            if title!="":
                self.putTitle1 ( pageId,title,row1,1 )
                row1 += 1
            # open_state = -1
            # if openState=="open":
            #     open_state = 1
            self.putStructureWidget1 ( pageId,"anom_structure_btn_",
                                        "Anomalous scatterers and electron density",
                                        anom_structure,0,row1,1 )
            return anom_structure

        else:
            self.putTitle1 ( pageId,"No Anomalous Structure Found",row1,1 )
            return None


    def finaliseLigand ( self,code,xyzPath,cifPath,openState_bool=False,
                              title="Ligand Structure" ):

        ligand = None

        if os.path.isfile(xyzPath):

            # Register output data. This moves needful files into output directory
            # and puts the corresponding metadata into output databox

            ligand = self.registerLigand ( xyzPath,cifPath )
            if ligand:
                if title!="":
                    self.putTitle ( title )
                ligand.code = code
                self.putLigandWidget ( "ligand_btn_","Ligand structure",ligand )
        else:
            self.putTitle ( "No Ligand Formed" )

        self.widget_no += 1
        return ligand


    def addLigandToLibrary ( self,libPath,ligCode,ligPath,ligList ):
        # returns path to ligand library whith new ligand included

        if not ligPath:  # nothing to include
            return (libPath,ligList)

        if not libPath:  # nowhere to include
            return (ligPath,ligList+[ligCode])

        if ligCode in ligList:  # no need to include
            return (libPath,ligList)

        """
        self.open_stdin()
        self.write_stdin (
            "_Y"          +\
            "\n_FILE_L  " + libPath +\
            "\n_FILE_L2 " + ligPath +\
            "\n_FILE_O  " + self.outputFName +\
            "\n_END\n" )
        self.close_stdin()

        self.runApp ( "libcheck",[],logType="Service" )
        """

        mergeone.add_one_comp ( ligPath, libPath, self.outputFName + ".lib" )

        return (self.outputFName+".lib",ligList+[ligCode])

    # ============================================================================

    def putInspectButton ( self,dataObject,title,gridId,row,col ):
        buttonId = self.getWidgetId ( "inspect_data" )
        pyrvapi.rvapi_add_button ( buttonId,title,"{function}",
                "if (window.parent.rvapi_inspectData) " +\
                "window.parent.rvapi_inspectData(" + self.job_id + ",'" +\
                dataObject._type + "','" + dataObject.dataId + "'); else " +\
                "alert('This function is not supported in detached reports');",
                False,gridId, row,col,1,1 )
        return

    def putCloneJobButton ( self,title,gridId,row,col ):
        buttonId = self.getWidgetId ( "inspect_data" )
        pyrvapi.rvapi_add_button ( buttonId,title,"{function}",
                "if (window.parent.rvapi_cloneJob) " +\
                "window.parent.rvapi_cloneJob(" + self.job_id + "); else " +\
                "alert('This function is not supported in detached reports');",
                False,gridId, row,col,1,1 )
        pyrvapi.rvapi_add_text ( "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                                 "<font style=\"color:darkblue\"><i>" +\
                                 "suggested parameters will be shown in italic blue" +\
                                 "</i></font>",
                                 gridId,row,col,1,1 )
        return

    def putRSViewerButton ( self,rlpFilePath,mapFilePath,title,text_btn,gridId,row,col ):
        buttonId = self.getWidgetId ( "rsviewer" )
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.rvapi_rsviewer(" + self.job_id +\
                    ",'" + title + "','" + rlpFilePath + "','" + mapFilePath + "')",
                    False,gridId, row,col,1,1 )
        self.addCitations ( ['dials.rs_mapper','dials.export'] )
        return


    def putUglyMolButton ( self,xyzFilePath,mtzFilePath,mapLabels,title,
                                text_btn,gridId,row,col ):
        buttonId = self.getWidgetId ( "uglymol" )
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.rvapi_umviewer(" + self.job_id +\
                    ",'" + title + "','" + xyzFilePath + "','" +\
                    mtzFilePath  + "','" + mapLabels   + "')",
                    False,gridId, row,col,1,1 )
        self.addCitations ( ['uglymol'] )
        return


    def putUglyMolButton_map ( self,xyzFilePath,mapFilePath,dmapFilePath,title,
                                    text_btn,gridId,row,col ):
        buttonId = self.getWidgetId ( "uglymol" )
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.rvapi_umviewer_map(" + self.job_id +\
                    ",'" + title + "','" + xyzFilePath + "','" +\
                    mapFilePath + "','" + dmapFilePath + "')",
                    False,gridId, row,col,1,1 )
        self.addCitations ( ['uglymol'] )
        return


    def putWebCootButton ( self,xyzFilePath,mtzFilePath,legendFilePath,mode,
                                update_interval,options_str,title,text_btn,
                                gridId,row,col ):
        #  currently this function is used only with patterson plot, so mtz is
        #  not relevant
        buttonId = self.getWidgetId ( "webcoot" )
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.rvapi_wcviewer(" +\
                       self.job_id          + ",'"  +\
                       title                + "','" +\
                       xyzFilePath          + "','" +\
                       mtzFilePath          + "','" +\
                       legendFilePath       + "','" +\
                       str(mode)            + "',"  +\
                       str(update_interval) + ","   +\
                       "'".join(options_str.split('"')) +\
                    ")",
                    False,gridId, row,col,1,1 )
        self.addCitations ( ['webcoot'] )
        return


    def putDownloadButton ( self,dnlFilePath,text_btn,gridId,row,col,colSpan=1,job_id=None ):
        jobId = job_id
        if not jobId:
            jobId = self.job_id
        buttonId = self.getWidgetId ( "download" )
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.downloadJobFile(" + str(jobId) +\
                    ",'" + dnlFilePath + "')",False,gridId, row,col,1,colSpan )
        return


    # ============================================================================


    def putRevisionWidget ( self,gridId,row,message,revision ):
        buttonId = "inspect_" + str(self.widget_no)
        self.widget_no += 1
        pyrvapi.rvapi_add_button ( buttonId,"Inspect","{function}",
                "if (window.parent.rvapi_inspectData) " +\
                "window.parent.rvapi_inspectData(" + self.job_id +\
                ",'DataRevision','" + revision.dataId + "'); else " +\
                "alert('This function is not supported in detached reports');",
                False,gridId, row,0,1,1 )
        pyrvapi.rvapi_set_text ( "<div style='vertical-align:sub;font-size:16px;white-space:nowrap;'><b><i>" +\
                                 message + "</i></b><sup>&nbsp;</sup></div>",gridId, row,1,1,1 )
        pyrvapi.rvapi_set_text ( "<div style='vertical-align:sub;font-size:16px;white-space:nowrap;'>\"" +\
                                 revision.dname + "\"<sup>&nbsp;</sup></div>", gridId, row,2,1,1 )
        return

    def hotHelpLink ( self,title,helpFName,tooltip="what is this?",chapter="html-userguide" ):
        hflist = helpFName.split("#")
        if len(hflist)==2:
            hflist[1] = "#" + hflist[1]
        else:
            hflist.append ( "" )
        hothelp = "<sup><img src=\"xxJsCoFExx-fe/images_png/help.png\" "       +\
                          "title=\"" + tooltip + "\" "                         +\
                          "style=\"width:14px;height:14px;cursor:pointer;\" "  +\
                        "onclick=\"javascript:window.parent.launchHelpBox1('"  +\
                             title + "','manuals/" + chapter + "/" + hflist[0] +\
                             ".html" + hflist[1] + "',null,10)\"/>"            +\
                  "</sup>"
        return hothelp

    def hotDocLink ( self,text,helpFName,hboxTitle,chapter="html-userguide" ):
        hflist  = helpFName.split("#")
        if len(hflist)==2:
            hflist[1] = "#" + hflist[1]
        else:
            hflist.append ( "" )
        doclink = "<a href=\"javascript:window.parent.launchHelpBox1('" +\
                  hboxTitle + "','manuals/" + chapter + "/" + hflist[0] +\
                  ".html" + hflist[1] + "',null,10)\">" + text + "</a>"
        return doclink

    def registerRevision ( self,revision,serialNo=1,title="Structure Revision",
                           message="<b><i>Name:</i></b>",
                           gridId = "", revisionName=None ):

        revName = revisionName
        if not revName:
            revName = self.outputFName
        revision.makeRevDName ( self.job_id,serialNo,revName )
        revision.register     ( self.outputDataBox )
        if title:
            self.putTitle ( title +\
                self.hotHelpLink ( "Structure Revision",
                                   "jscofe_qna.structure_revision") )

        grid_id = gridId
        if len(gridId)<=0:
            grid_id = "revision_" + str(self.widget_no)
            self.widget_no += 1

        pyrvapi.rvapi_add_grid ( grid_id,False,self.report_page_id(),self.rvrow,0,1,1 )
        self.putRevisionWidget ( grid_id,0,message,revision )
        self.rvrow += 1

        return grid_id



    #def registerRevision1 ( self,revision,serialNo,pageId,row,title="Structure Revision" ):
    #    revision.makeRevDName ( self.job_id,serialNo,self.outputFName )
    #    revision.register     ( self.outputDataBox )
    #    self.putTitle1   ( pageId,title,row,1 )
    #    self.putMessage1 ( pageId,"<b><i>New structure revision name:</i></b> " +\
    #                      "<font size='+1'>\"" + revision.dname + "\"</font>",
    #                      row+1 )
    #    return


    def registerStructure ( self,mmcifPath,pdbPath,subPath,mtzPath,
                                 libPath=None,mapPath=None,dmapPath=None,leadKey=1,
                                 copy_files=False,map_labels=None,refiner="" ):
        self.dataSerialNo += 1

        mmcif_path = mmcifPath
        pdb_path   = pdbPath
        if mmcifPath and (not pdbPath):
            pdb_path, pdb_nogood = mmcif_utils.convert_to_pdb ( mmcifPath )
            if pdb_nogood:
                self.stderrln ( "\n *** mmCIF cannot be converted to PDB:\n" +\
                                "     " + pdb_nogood + "\n" )
        elif pdbPath and (not mmcifPath):
            mmcif_path = mmcif_utils.convert_to_mmcif ( pdbPath )

        structure = dtype_structure.register (
                                    mmcif_path,pdb_path,subPath,mtzPath,mapPath,
                                    dmapPath,libPath,
                                    self.dataSerialNo ,self.job_id,leadKey,
                                    self.outputDataBox,self.outputDir(),
                                    copy_files=copy_files,map_labels=map_labels,
                                    refiner=refiner )
        if not structure:
            self.file_stderr.write ( "  NONE STRUCTURE" )
            self.file_stderr.flush()
        else:
            structure.putXYZMeta ( self.outputDir(),self.file_stdout1,
                                   self.file_stderr,None )

        #self.stdoutln ( str(structure.files) )
        return structure


    def _move_file_to_output_dir ( self,fpath,fname_dest,copy_file ):
        if fpath and fname_dest and os.path.isfile(fpath):
            fpath_dest = os.path.join ( self.outputDir(),fname_dest )
            if not os.path.isfile(fpath_dest):
                if copy_file:
                    shutil.copy2 ( fpath,fpath_dest )
                else:
                    os.rename ( fpath,fpath_dest )
                return True
        return False


    def registerStructure1 ( self,regName,mmcifPath,pdbPath,subPath,mtzPath,
                                  libPath=None,mapPath=None,dmapPath=None,
                                  leadKey=1,copy_files=False,
                                  map_labels=None,refiner="" ):
        self.dataSerialNo += 1

        mmcif_path = mmcifPath
        pdb_path   = pdbPath
        if mmcifPath and (not pdbPath):
            pdb_path   = mmcif_utils.convert_to_pdb ( mmcifPath )
        elif pdbPath and (not mmcifPath):
            mmcif_path = mmcif_utils.convert_to_mmcif ( pdbPath )

        structure = dtype_structure.register1 (
                                mmcif_path,pdb_path,subPath,mtzPath,mapPath,
                                dmapPath,libPath,
                                regName,self.dataSerialNo,self.job_id,leadKey,
                                self.outputDataBox,map_labels=map_labels,
                                refiner=refiner )
        if not structure:
            self.file_stderr.write ( "  NONE STRUCTURE\n" )
            self.file_stderr.flush()
        else:
            self._move_file_to_output_dir ( mmcif_path,structure.getMMCIFFileName(),copy_files )
            self._move_file_to_output_dir ( pdb_path  ,structure.getPDBFileName  (),copy_files )
            self._move_file_to_output_dir ( subPath   ,structure.getSubFileName  (),copy_files )
            self._move_file_to_output_dir ( mtzPath   ,structure.getMTZFileName  (),copy_files )
            self._move_file_to_output_dir ( mapPath   ,structure.getMapFileName  (),copy_files )
            self._move_file_to_output_dir ( dmapPath  ,structure.getDMapFileName (),copy_files )
            self._move_file_to_output_dir ( libPath   ,structure.getLibFileName  (),copy_files )
            structure.putXYZMeta ( self.outputDir(),self.file_stdout1,
                                   self.file_stderr,None )
        return structure


    def registerLigand ( self,xyzPath,cifPath,copy_files=False ):
        self.dataSerialNo += 1
        ligand = dtype_ligand.register ( xyzPath,cifPath,
                                         self.dataSerialNo ,self.job_id,
                                         self.outputDataBox,self.outputDir(),
                                         copy=copy_files )
        if not ligand:
            self.file_stderr.write ( "  NONE LIGAND\n" )
            self.file_stderr.flush()
        return ligand


    def registerLibrary ( self,libPath,copy_files=False ):
        self.dataSerialNo += 1
        library = dtype_library.register ( libPath,self.dataSerialNo,self.job_id,
                                           self.outputDataBox,self.outputDir(),
                                           copy=copy_files )
        if not library:
            self.file_stderr.write ( "  NONE LIBRARY\n" )
            self.file_stderr.flush()
        return library


    # ----------------------------------------------------------------------------

    def putHKLWidget ( self,widgetId,title_str,hkl,openState=0 ):
        self.putHKLWidget1 ( self.report_page_id(),widgetId + str(self.widget_no),
                             title_str,hkl,openState,self.rvrow,1 )
        self.rvrow     += 2
        self.widget_no += 1
        return

    def putHKLWidget1 ( self,pageId,widgetId,title_str,hkl,openState,row,colSpan ):
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" + hkl.dname,row )
        pyrvapi.rvapi_add_data ( widgetId + str(self.widget_no),title_str,
                                 # always relative to job_dir from job_dir/html
                                 "/".join(["..",self.outputDir(),hkl.getHKLFileName()]),
                                 "hkl:hkl",pageId,row+1,0,1,colSpan,openState )
        self.widget_no += 1
        self.addCitation ( "viewhkl" )
        return row + 2

    def putStructureWidget ( self,widgetId,title_str,structure,openState=0, # -1
                                  legend="Assigned name" ):
        self.putStructureWidget1 ( self.report_page_id(),
                                   self.getWidgetId(widgetId),title_str,
                                   structure,openState,self.rvrow,1,legend=legend )
        self.rvrow += 2
        return


    def putStructureWidget1 ( self,pageId,widgetId,title_str,structure,openState,
                                   row,colSpan,legend="Assigned name" ):
        self.putMessage1 ( pageId,"<b>" + legend + ":</b>&nbsp;" +
                                  structure.dname +
                                  "<font size='+2'><sub>&nbsp;</sub></font>",row )
        wId     = self.getWidgetId ( widgetId )
        type    = [[dtype_template.file_key["mmcif"],"mmcif"        ],
                   [dtype_template.file_key["xyz"  ],"xyz"          ],
                   [dtype_template.file_key["sub"  ],"xyz"          ],
                   [dtype_template.file_key["mtz"  ],"hkl:map"      ],
                   [dtype_template.file_key["map"  ],"hkl:ccp4_map" ],
                   [dtype_template.file_key["dmap" ],"hkl:ccp4_dmap"],
                   [dtype_template.file_key["lib"  ],"LIB"          ]]
        created = False
        for i in range(len(type)):
            fname = structure.getFileName ( type[i][0] )
            #self.stderrln ( "  >>>>>> " + str(fname) )
            if fname:
                if type[i][0]=="mtz" and structure.mapLabels:
                    fname += "{{meta " + structure.mapLabels + "}}"
                if not created:
                    #self.stderrln ( "  +++++++ " + str(fname) + " " + str(type[i]) )
                    pyrvapi.rvapi_add_data ( wId,title_str,
                            # always relative to job_dir from job_dir/html
                            "/".join(["..",self.outputDir(),fname]),
                            type[i][1],pageId,row+1,0,1,colSpan,openState )
                    created = True
                else:
                    #self.stderrln ( "  ....... " + str(fname) + " " + str(type[i]) )
                    pyrvapi.rvapi_append_to_data ( wId,
                            # always relative to job_dir from job_dir/html
                            "/".join(["..",self.outputDir(),fname]),
                            type[i][1] )
        self.addCitations ( ["uglymol","ccp4mg","viewhkl"] )
        return row+2


    # ============================================================================


    def putLigandWidget ( self,widgetId,title_str,ligand,openState=0 ):
        self.putLigandWidget1 ( self.report_page_id(),
                                widgetId + str(self.widget_no),title_str,
                                ligand,openState,self.rvrow,1 )
        self.rvrow     += 2
        self.widget_no += 1
        return


    def putLigandWidget1 ( self,pageId,widgetId,title_str,ligand,openState,row,colSpan ):
        wId = self.getWidgetId ( widgetId )
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" + ligand.dname +
                                  "<font size='+2'><sub>&nbsp;</sub></font>",row )
        pyrvapi.rvapi_add_data ( wId,title_str,
                                 # always relative to job_dir from job_dir/html
                                 "/".join([ "..",self.outputDir(),
                                            ligand.getPDBFileName()]),
                                 "xyz",pageId,row+1,0,1,colSpan,openState )
        if ligand.getLibFileName():
            pyrvapi.rvapi_append_to_data ( wId,
                                 # always relative to job_dir from job_dir/html
                                 "/".join([ "..",self.outputDir(),
                                            ligand.getLibFileName()]),
                                 "LIB" )
        self.addCitations ( ["uglymol","ccp4mg"] )
        return row+2


    def putLibraryWidget1 ( self,pageId,title_str,library,links,row,colSpan ):
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" + library.dname +
                                  "<font size='+2'><sub>&nbsp;</sub></font>",row )
        codes = ""
        if len(library.codes):
            codes += "<b>Ligands:</b>&nbsp;"
            for i in range(len(library.codes)):
                if i>0:
                    codes += ", "
                codes += library.codes[i]
        if len(library.codes) and len(links):
            codes += "<br>"
        if len(links):
            codes += "<b>Links:</b>&nbsp;"
            for i in range(len(links)):
                if i>0:
                    codes += ", "
                codes += links[i]
        self.putMessage1 ( pageId,codes,row+1 )
        return row+2


    # ============================================================================

    def registerXYZ ( self,mmcifPath,pdbPath,checkout=True ):
        
        mmcif_path = mmcifPath
        pdb_path   = pdbPath
        if mmcifPath and (not pdbPath):
            pdb_path, pdb_nogood = mmcif_utils.convert_to_pdb ( mmcifPath )
            if pdb_nogood:
                self.stderrln ( "\n *** output mmCIF file cannot be converted to PDB:\n" +\
                                "     " + pdb_nogood + "\n" )
        elif pdbPath and (not mmcifPath):
            mmcif_path = mmcif_utils.convert_to_mmcif ( pdbPath )

        self.dataSerialNo += 1

        xyz = dtype_xyz.register ( mmcif_path,pdb_path,self.dataSerialNo,
                                   self.job_id,
                                   self.outputDataBox if checkout else None,
                                   self.outputDir() )
        # if checkout:
        #     xyz = dtype_xyz.register ( mmcifPath,xyzPath,self.dataSerialNo,
        #                                self.job_id,self.outputDataBox,
        #                                self.outputDir() )
        # else:
        #     xyz = dtype_xyz.register ( mmcifPath,xyzPath,self.dataSerialNo,
        #                                self.job_id,None,self.outputDir() )
        if xyz:
            xyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
        else:
            self.file_stderr.write ( "  NONE XYZ DATA\n" )
            self.file_stderr.flush()

        return xyz

    """
    def registerHKL ( self,mtzPath ):
        self.dataSerialNo += 1
        hkl = dtype_hkl.register ( mtzPath,self.dataSerialNo,self.job_id,
                                   self.outputDataBox,self.outputDir() )
        if not hkl:
            self.file_stderr.write ( "  NONE HKL DATA\n" )
            self.file_stderr.flush()
        return hkl
    """

    # ----------------------------------------------------------------------------

    def putXYZWidget ( self,widgetId,title_str,xyz,openState=0 ):
        self.putXYZWidget1 ( self.report_page_id(),widgetId,title_str,xyz,
                             self.rvrow,col=0,rowSpan=1,colSpan=1,
                             openState=openState )
        self.rvrow += 1
        return

    def putXYZWidget1 ( self,pageId,widgetId,title_str,xyz,row,col=0,
                             rowSpan=1,colSpan=1,openState=0 ):
        pyrvapi.rvapi_add_data ( self.getWidgetId(widgetId),title_str,
                    # always relative to job_dir from job_dir/html
                    "/".join(["..",self.outputDir(),xyz.getPDBFileName()]),
                    "xyz",pageId,row,col,rowSpan,colSpan,openState )
        self.addCitations ( ["uglymol","ccp4mg"] )
        return


    # ============================================================================

    def registerModel ( self,sequence,modelPath,checkout=True ):
        self.dataSerialNo += 1
        if checkout:
            model = dtype_model.register ( sequence,modelPath,
                                           self.dataSerialNo,self.job_id,
                                           self.outputDataBox,
                                           self.outputDir() )
        else:
            model = dtype_model.register ( sequence,modelPath,
                                           self.dataSerialNo,self.job_id,
                                           None,self.outputDir() )
        if not model:
            self.file_stderr.write ( "  NONE MODEL DATA\n" )
            self.file_stderr.flush()
        else:
            if sequence and type(sequence)!=str and type(sequence)!=list:
                shutil.copy ( sequence.getSeqFilePath(self.inputDir()),
                              self.outputDir() )
            model.putXYZMeta ( self.outputDir(),self.file_stdout1,
                                  self.file_stderr,None )
        return model

    def registerEnsemble ( self,sequence,ensemblePath,checkout=True ):
        self.dataSerialNo += 1
        if checkout:
            ensemble = dtype_ensemble.register ( sequence,ensemblePath,
                                                 self.dataSerialNo,self.job_id,
                                                 self.outputDataBox,
                                                 self.outputDir() )
        else:
            ensemble = dtype_ensemble.register ( sequence,ensemblePath,
                                                 self.dataSerialNo,self.job_id,
                                                 None,self.outputDir() )
        if not ensemble:
            self.file_stderr.write ( "  NONE ENSEMBLE DATA\n" )
            self.file_stderr.flush()
        else:
            if type(sequence)!=str and type(sequence)!=list:
                shutil.copy ( sequence.getSeqFilePath(self.inputDir()),
                              self.outputDir() )
            ensemble.putXYZMeta ( self.outputDir(),self.file_stdout1,
                                  self.file_stderr,None )

        return ensemble

    # ----------------------------------------------------------------------------

    def putModelWidget ( self,widgetId,title_str,model,openState=0 ):
        self.putModelWidget1 ( self.report_page_id(),widgetId,title_str,
                               model,openState,self.rvrow,1 )
        self.rvrow += 2
        return

    def putModelWidget1 ( self,pageId,widgetId,title_str,model,openState,row,colSpan ):

        msg = "<b>Assigned name&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" + model.dname
        if model.meta:
            msg += "<br><b>Estimated</b> "
            if "eLLG" in model.meta and model.meta["eLLG"]:
                msg += "<b>eLLG :</b> "  + str(model.meta["eLLG"]) + "&nbsp;&nbsp;&nbsp;&nbsp;"
            if model.meta["seqId"]:
                msg += "<b>seqId :</b> " + str(model.meta["seqId"]) + "%&nbsp;&nbsp;&nbsp;&nbsp;"
            if model.meta["rmsd"]:
                msg += "<b>RMSD :</b> "  + str(model.meta["rmsd"]) + "&Aring;"
            if "h_score" in model.meta and model.meta["h_score"]:
                msg += "<b>H-score :</b> " + str(model.meta["h_score"]) + "&nbsp;&nbsp;&nbsp;&nbsp;"

        self.putMessage1 ( pageId,msg + "&nbsp;",row )

        pyrvapi.rvapi_add_data ( widgetId,title_str,
                    # always relative to job_dir from job_dir/html
                    "/".join(["..",self.outputDir(),model.getPDBFileName()]),
                    "xyz",pageId,row+1,0,1,colSpan,openState )
        self.addCitations ( ["uglymol","ccp4mg"] )
        return row+2


    def putEnsembleWidget ( self,widgetId,title_str,ensemble,openState=0 ):
        self.putEnsembleWidget1 ( self.report_page_id(),widgetId,title_str,
                                  ensemble,openState,self.rvrow,1 )
        self.rvrow += 2
        return

    def putEnsembleWidget1 ( self,pageId,widgetId,title_str,ensemble,openState,row,colSpan ):

        msg = "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" + ensemble.dname
        if ensemble.seqId:
            msg += "<br><b>Estimated seqId :</b>&nbsp;&nbsp;&nbsp;" + str(ensemble.seqId) + "%"

        self.putMessage1 ( pageId,msg + "&nbsp;",row )

        pyrvapi.rvapi_add_data ( widgetId,title_str,
                    # always relative to job_dir from job_dir/html
                    "/".join(["..",self.outputDir(),ensemble.getPDBFileName()]),
                    "xyz",pageId,row+1,0,1,colSpan,openState )
        self.addCitations ( ["uglymol","ccp4mg"] )
        return row+2


    # ============================================================================

    def checkSpaceGroupChanged ( self,sol_spg,hkl,mtzfilepath,title=None,force=False ):
        # Parameters:
        #  sol_spg      a string with space group obtained from solution's XYZ file
        #  hkl          HKL class of reflection data used to produce the XYZ file
        #  mtzfilepath  path to solution's MTZ file (with possibly changed SpG)
        #
        # Returns:
        #  None                 if space group has not changed
        #  (newMTZPath,newHKL)  path to new HKL file and HKL class if SpG changed

        # the following will provide for import of generated HKL dataset(s)
        #    def importDir        (self):  return "./"   # import from working directory
        #    def import_summary_id(self):  return None   # don't make summary table

        solSpg = sol_spg.replace(" ", "")
        sp_changed = solSpg != hkl.getSpaceGroup().replace(" ", "")
        if solSpg and (sp_changed or force):

            if title:
                self.putTitle ( title )
            if sp_changed:
                self.putMessage ( "<font style='font-size:120%;'>" +\
                                  "<b>Space Group changed to " + sol_spg +\
                                  "</b></font>" )
            else:
                self.putMessage ( "<font style='font-size:120%;'><b>" +\
                                  "Reflection dataset reindexed</b></font>" )
            rvrow0      = self.rvrow
            self.rvrow += 1
            #if not self.generic_parser_summary:
            #    self.generic_parser_summary = {}
            if sp_changed:
                self.generic_parser_summary["z01"]  = {'SpaceGroup':sol_spg}
            else:
                self.generic_parser_summary["z011"] = {'SpaceGroup':sol_spg}
            newHKLFPath = self.getOFName ( "_" + solSpg + "_" + hkl.getHKLFileName(),-1 )
            os.rename ( mtzfilepath,newHKLFPath )
            self.resetFileImport()
            self.addFileImport ( newHKLFPath,import_filetype.ftype_MTZMerged() )
            sol_hkl = import_merged.run ( self,"New reflection dataset details",importPhases="" )

            # if dtype_hkl.dtype() in self.outputDataBox.data:
            if len(sol_hkl)>0:
                # sol_hkl = self.outputDataBox.data[dtype_hkl.dtype()][0]
                sol_hkl[0].dataStats    = hkl.dataStats
                sol_hkl[0].aimless_meta = hkl.aimless_meta
                pyrvapi.rvapi_set_text ( "<b>New reflection dataset created:</b> " +\
                        sol_hkl[0].dname,self.report_page_id(),rvrow0,0,1,1 )

                if sp_changed:
                    self.putMessage (
                        "<p><i>Consider re-merging your original dataset using " +\
                        "this new one as a reference</i>" )

                # Copy new reflection file to input directory in order to serve
                # Refmac job(s) (e.g. as part of self.finaliseStructure()). The
                # job needs reflection data for calculating Rfree, other stats
                # and density maps.
                shutil.copy2 ( sol_hkl[0].getHKLFilePath(self.outputDir()),
                               self.inputDir() )

                return (newHKLFPath,sol_hkl[0])

            else:
                self.putMessage (
                    "Data registration error -- report to developers." )

        else:
            return None


    def checkSpaceGroupChanged1 ( self,sol_spg,hkl_list ):
        # reindexing of array HKL dataset, returns None if space group does
        # not change

        solSpg = sol_spg.replace(" ", "")
        if solSpg and (solSpg!=hkl_list[0].getSpaceGroup().replace(" ", "")):

            self.putMessage ( "<font style='font-size:120%;'><b>Space Group changed to " +\
                              sol_spg + "</b></font>" )
            #rvrow0      = self.rvrow
            self.rvrow += 1

            self.generic_parser_summary["z01"] = {'SpaceGroup':sol_spg}

            # prepare script for reindexing
            self.open_stdin  ()
            self.write_stdin ( "SYMM \"" + sol_spg + "\"\n" )
            self.close_stdin ()
            f_stdin = self.file_stdin

            self.unsetLogParser()

            # make list of files to import
            self.resetFileImport()

            index = []
            for i in range(len(hkl_list)):

                # make new hkl file name
                newHKLFPath = self.getOFName ( "_" + solSpg + "_" + hkl_list[i].getHKLFileName(),-1 )

                # make command-line parameters for reindexing
                cmd = [ "hklin" ,hkl_list[i].getFilePath(self.inputDir(),dtype_template.file_key["mtz"]),
                        "hklout",newHKLFPath ]

                # run reindex
                self.file_stdin = f_stdin  # for repeat use of input script file
                self.runApp ( "reindex",cmd,logType="Service" )

                if os.path.isfile(newHKLFPath):
                    self.addFileImport ( newHKLFPath,import_filetype.ftype_MTZMerged() )
                    index.append ( i )
                else:
                    self.putMessage ( "Error: cannot reindex " + hkl_list[i].dname )

            hkls = import_merged.run ( self,"New reflection datasets",importPhases="" )
            for i in range(len(index)):
                hkls[i].dataStats    = hkl_list[index[i]].dataStats
                hkls[i].aimless_meta = hkl_list[index[i]].aimless_meta

            return self.outputDataBox.data[hkl_list[0]._type]

        else:
            return None

    #def putTaskMetrics ( self,name,value ):
    #    if self.task:
    #        if not hasattr(self.task,"metrics"):
    #            self.task.metrics = {}
    #        self.task.metrics[name] = str(value)
    #    return

    #def copyTaskMetrics ( self,pgm,name,metrics_name ):
    #    if pgm in self.generic_parser_summary:
    #        self.putTaskMetrics ( metrics_name,self.generic_parser_summary[pgm][name] )
    #    return


    # ============================================================================

    def success ( self,have_results,hidden_results=False ):
        self.putCitations()
        if self.task:
            self.task.cpu_time = command.getTimes()[1]
            if self.generic_parser_summary:
                self.task.scores = self.generic_parser_summary
            with open('job.meta','w') as file_:
                file_.write ( self.task.to_JSON() )
        self.rvrow += 1
        self.putMessage ( "<p>&nbsp;" )  # just to make extra space after report
        self.outputDataBox.save ( self.outputDir() )
        self.flush()
        if have_results:
            if hidden_results:
                raise signal.HiddenResults()
            else:
                raise signal.Success()
        else:
            raise signal.NoResults()

    def fail ( self,pageMessage,signalMessage ):
        self.putCitations()
        if self.task:
            self.task.cpu_time = command.getTimes()[1]
            if self.generic_parser_summary:
                self.task.scores = self.generic_parser_summary
            with open('job.meta','w') as file_:
                file_.write ( self.task.to_JSON() )
        pyrvapi.rvapi_set_text ( pageMessage,self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_flush    ()
        msg = pageMessage.replace("<b>","").replace("</b>","").replace("<i>","") \
                         .replace("</i>","").replace("<br>","\n").replace("<p>","\n")
        self.file_stdout .write ( msg + "\n" )
        self.file_stdout1.write ( msg + "\n" )
        self.file_stderr .write ( msg + "\n" )
        raise signal.JobFailure ( signalMessage )

    def python_fail_tab ( self ):
        trace = ''.join( traceback.format_exception( *sys.exc_info() ) )
        msg = '<h2><i>Job Driver Failure</i></h2>'
        msg += '<p>Catched error:<pre>' + trace + '</pre>'
        msg += """
        <p>This is an internal error, which may be caused by various
        sort of hardware and network malfunction, but most probably due
        to a bug or not anticipated properties of input data.
        """
        if self.maintainerEmail:
            msg += "<p>You may contribute to the improvement of " + self.appName() +\
                   " by sending this message <b>together with</b> input data <b>" +\
                   "and task description</b> to "
            msg += self.maintainerEmail

        page_id = self.traceback_page_id()
        pyrvapi.rvapi_add_tab ( page_id, "Error Trace", True )
        pyrvapi.rvapi_set_text ( msg, page_id, 0, 0, 1, 1 )

    def start(self):

        try:
            self.run()

        except signal.Success as s:
            signal_obj = s

        except signal.NoResults as s:
            signal_obj = s

        except signal.HiddenResults as s:
            signal_obj = s

        except signal.JobFailure as s:
            signal_obj = s

        except signal.CofeSignal as s:
            self.python_fail_tab()
            signal_obj = s

        except:
            self.python_fail_tab()
            signal_obj = signal.JobFailure()

        else:
            signal_obj = signal.Success()

        finally:
            pass

        self.end_date = datetime.datetime.today().strftime('%Y-%m-%d %H:%M:%S')
        cpu_time = ""
        if self.task and hasattr(self.task,"cpu_time"):
            # cpu_time = "<br>CPU: " + "{:.3f}s".format(self.task.cpu_time*3600)
            # cpu_time = "<br>CPU: " + str(datetime.timedelta(seconds=round(self.task.cpu_time*3600,3)))
            hours = int(self.task.cpu_time)
            mins  = int((self.task.cpu_time-hours)*60)
            secs  = int(((self.task.cpu_time-hours)*60-mins)*60)
            msecs = int((((self.task.cpu_time-hours)*60-mins)*60-secs)*1000)
            cpu_time = "<br>CPU: "
            if hours:
                cpu_time += "{:02d}:".format(hours)
            if mins:
                cpu_time += "{:02d}:".format(mins)
            cpu_time += "{:02d}.".format(secs) + "{:03d}".format(msecs)
        self.putMessage1 ( self.title_grid_id,
                "<div style=\"text-align:right;font-size:12px;white-space:nowrap;\">" +\
                "CCP4 v." + self.getCCP4Version() + "; " +\
                self.appName()   + " v." + self.appVersion.split()[0] +\
                "<br>Started: "  + self.start_date +\
                "<br>Finished: " + self.end_date   + cpu_time +\
                "</div>",
                0,col=1 )
        self.flush()

        signal_obj.quitApp()
