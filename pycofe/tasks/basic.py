##!/usr/bin/python

#
# ============================================================================
#
#    29.06.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BASIC TASK WRAPPER
#
#  Command-line:  N/A
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
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


#  python native imports
import os
import sys
import shutil
import traceback

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers

# pycofe imports
from pycofe.dtypes import dtype_template, dtype_xyz, dtype_structure, databox
from pycofe.dtypes import dtype_ensemble, dtype_hkl, dtype_ligand
from pycofe.dtypes import dtype_sequence
from pycofe.proc   import edmap, import_merged
from pycofe.varut  import signal, jsonut, command


# ============================================================================
# driver class

class TaskDriver(object):

    # ========================================================================
    # common definitions

    rvrow             = 0  # current report row
    _rvrow_bak        = 0  # saved report row
    _report_widget_id = "report_page"
    _scriptNo         = 0  # input script counter

    def report_page_id  (self): return self._report_widget_id

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
    def err_page_id       (self): return "err_page"
    def traceback_page_id (self): return "python_exception"

    def file_stdout_path  (self): return "_stdout.log" # reserved name, used in NC
    def file_stderr_path  (self): return "_stderr.log"
    def file_stdin_path   (self): return "_stdin." + str(self._scriptNo) + ".script"

    def reportDir         (self): return "report"  # in current directory ( job_dir )
    def outputDir         (self): return "output"  # in current directory ( job_dir )
    def inputDir          (self): return "input"   # in current directory ( job_dir )

    def reportDocumentName(self): return "rvapi_document"

    def refmac_section    (self): return "refmac_section"
    def refmac_report     (self): return "refmac_report"

    def importDir         (self): return "uploads" # in current directory ( job_dir )
    def import_summary_id (self): return "import_summary_id"  # summary table id


    # ========================================================================
    # class variables

    exeType       = None
    job_dir       = None
    job_id        = None

    # create output data list structure
    outputDataBox = databox.DataBox()

    # standard output file handlers
    file_stdout   = None
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

    summary_row   = 0  # current row in import summary table
    summary_row_0 = 0  # reference row in import summary table

    widget_no     = 0  # widget Id unificator
    navTreeId     = "" # navigation tree Id

    # ========================================================================
    # cofe config

#   This needs to be obtained from the jscofe config-file.
#   maintainerEmail = None
    maintainerEmail = "my.name@gmail.com"

    # ========================================================================
    # initiaisation

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
        self.exeType = args[0]
        self.job_dir = args[1]
        self.job_id  = args[2]

        # set scratch area if necessary
        if self.exeType=="SGE" and "TMP" in os.environ:
            os.environ["CCP4_SCR"] = os.environ["TMP"]

        if "CCP4_SCR" in os.environ:
            os.environ["TMPDIR"] = os.environ["CCP4_SCR"]

        # always make job directory current
        os.chdir ( self.job_dir )

        # initialise execution logs
        self.file_stdout = open ( self.file_stdout_path(),'w' )
        self.file_stderr = open ( self.file_stderr_path(),'w' )

        # fetch task data
        self.task = jsonut.readjObject  ( "job.meta" )
        if self.task is None:
            self.file_stdout.write ( "\n\n *** task read failed in '" + module_name + "'\n\n" )
            self.file_stderr.write ( "\n\n *** task read failed in '" + module_name + "'\n\n" )
            print " task read failed in '" + module_name + "'"
            raise signal.TaskReadFailure()

        self.input_data = databox.readDataBox ( self.inputDir() )

        if self.task.uoname:
            self.outputFName = self.task.uoname
        else:
            self.outputFName = self.task.oname

        # print title in standard logs
        if title_str:
            tstr = title_str
        else:
            tstr = self.task.title
        self.file_stdout.write ( "[" + self.job_id.zfill(4) + "] " + tstr.upper() + "\n\n" )
        self.file_stderr.write ( " " )

        # initialise HTML report document; note that we use absolute path for
        # the report directory, which is necessary for passing RVAPI document
        # to applications via creation of the rvapi_document file with
        # pyrvapi.rvapi_store_document2(..)

        # Make a tree or tab layout
        if "nav_tree" in options:
            pyrvapi.rvapi_init_document (
                    "jscofe_report",  # document Id
                    os.path.join(os.getcwd(),self.reportDir()),  # report directory (reserved)
                    "Title",   # title (immaterial)
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
                    "Title",   # title (immaterial)
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
            self.putTitle         ( tstr )
            focus = False
        if getOption("log_page","show",True):
            if self.navTreeId:
                pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,self.report_page_id() )
            pyrvapi.rvapi_add_tab ( self.log_page_id(),
                                    getOption("log_page","name","Log file"),focus )
            pyrvapi.rvapi_append_content ( os.path.join("..",self.file_stdout_path()+'?capsize'),
                                           True,self.log_page_id() )
            focus = False
        if getOption("err_page","show",True):
            if self.navTreeId:
                pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,self.report_page_id() )
            pyrvapi.rvapi_add_tab ( self.err_page_id(),
                                    getOption("err_page","name","Errors"),focus )
            pyrvapi.rvapi_append_content ( os.path.join("..",self.file_stderr_path()),
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

    def getXYZOFName ( self,modifier=-1 ):
        return self.getOFName ( ".pdb",modifier )

    def getMTZOFName ( self,modifier=-1 ):
        return self.getOFName ( ".mtz",modifier )

    def getMapOFName ( self,modifier=-1 ):
        return self.getOFName ( ".map",modifier )

    def getDMapOFName ( self,modifier=-1 ):
        return self.getOFName ( ".diff.map",modifier )

    # ============================================================================

    def getWidgetId ( self,wid ):
        widgetId = wid + "_" + str(self.widget_no)
        self.widget_no += 1
        return widgetId

    # ============================================================================

    def checkPDB(self):
        if "PDB_DIR" not in os.environ:
            pyrvapi.rvapi_set_text (
                "<b>Error: jsCoFE is not configured to work with PDB archive.</b><p>" + \
                "Please look for support.",
                self.report_page_id(),self.rvrow,0,1,1 )

            self.fail ( " *** Error: jsCofe is not configured to work with PDB archive \n" + \
                        "     Please look for support\n","No PDB configured" )
        return


    # ============================================================================

    def insertReportTab ( self,title_str,focus=True ):
        pyrvapi.rvapi_insert_tab ( self.report_page_id(),title_str,
                                   self.log_page_id(),focus  )
        self.rvrow = 0;
        self.putTitle ( title_str )
        pyrvapi.rvapi_flush ()
        return

    def putMessage ( self,message_str ):
        pyrvapi.rvapi_set_text ( message_str,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putMessage1 ( self,pageId,message_str,row,col=0,rowSpan=1,colSpan=1 ):
        pyrvapi.rvapi_set_text ( message_str,pageId,row,col,rowSpan,colSpan )
        return

    def putMessageLF ( self,message_str ):
        pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>" + message_str +
                        "</font>",self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putWaitMessageLF ( self,message_str ):
        gridId = "wait_message_" + str(self.widget_no)
        pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>" + message_str +
                                 "</font>",gridId,0,0,1,1 )
        pyrvapi.rvapi_set_text ( "<div class='activity_bar'/>",gridId,0,1,1,1 )
        self.widget_no += 1
        return

    def putTitle ( self,title_str ):
        if self.rvrow>0:
            pyrvapi.rvapi_set_text ( "&nbsp;",self.report_page_id(),self.rvrow,0,1,1 )
            self.rvrow += 1
        self.putTitle1 ( self.report_page_id(),title_str,self.rvrow,1 )
        self.rvrow += 1
        return

    def insertTab ( self,tabId,tabName,content,focus=False ):
        pyrvapi.rvapi_insert_tab ( tabId,tabName,self.log_page_id(),focus )
        if content:
            pyrvapi.rvapi_append_content ( content,True,tabId )
        return

    def flush(self):
        pyrvapi.rvapi_flush()
        return

    def putTitle1 ( self,pageId,title_str,row,colSpan=1 ):
        pyrvapi.rvapi_set_text (
                        "<h2>[" + self.job_id.zfill(4) + "] " + title_str + "</h2>",
                        pageId,row,0,1,colSpan )
        return


    # ============================================================================

    def putPanel ( self,panel_id ):
        pyrvapi.rvapi_add_panel ( panel_id,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putPanel1 ( self,pageId,panel_id,row,colSpan=1 ):
        pyrvapi.rvapi_add_panel ( panel_id,pageId,row,0,1,colSpan )
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


    def putTable ( self,tableId,title_str,holderId,row,mode=100 ):
        pyrvapi.rvapi_add_table ( tableId,title_str,holderId,row,0,1,1, mode )
        pyrvapi.rvapi_set_table_style ( tableId,
                                   "table-blue","text-align:left;" )
        return

    def setTableHorzHeaders ( self,tableId,header_list,tooltip_list ):
        for i in range(len(header_list)):
            pyrvapi.rvapi_put_horz_theader ( tableId,header_list[i],
                                             tooltip_list[i],i )
        return

    def putTableLine ( self,tableId,header,tooltip,line,row ):
        pyrvapi.rvapi_put_vert_theader ( tableId,header,tooltip,row )
        if line:
            pyrvapi.rvapi_put_table_string ( tableId,line,row,0 )
            pyrvapi.rvapi_shape_table_cell ( tableId,row,0,"",
                "text-align:left;width:100%;white-space:nowrap;" + \
                "font-family:\"Courier\";text-decoration:none;" + \
                "font-weight:normal;font-style:normal;width:auto;",
                "",1,1 );
        return row+1

    def putGrid ( self,gridId,filling_bool=False ):
        pyrvapi.rvapi_add_grid ( gridId,filling_bool,self.report_page_id(),self.rvrow,0,1,1 )
        self.rvrow += 1
        return


    # ============================================================================

    def open_stdin ( self ):
        self.file_stdin = open ( self.file_stdin_path(),"w" )
        return

    def write_stdin ( self,S ):
        self.file_stdin.write ( S )
        return

    def close_stdin ( self ):
        self.file_stdin.close()
        return


    # ============================================================================

    def writeKWParameter ( self,item ):
        if item.visible:
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
        return

    def putKWParameter ( self,item ):
        if item.visible:
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
        if item.visible:
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
        if item.visible:
            if item.type=="checkbox":
                if hasattr(item,'translate'):
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
        if item.visible or not checkVisible:
            return str(item.value)
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


    # ============================================================================

    def makeClass ( self,dict ):
        return databox.make_class ( dict )


    # ============================================================================

    def unsetLogParser ( self ):
        self.file_stdout.flush()
        self.log_parser = None
        pyrvapi.rvapi_flush()
        #self.file_stdout = open ( self.file_stdout_path(),'a' )
        return

    def setGenericLogParser ( self,panel_id,split_sections_bool,
                              graphTables=False,makePanel=True ):
        if makePanel:
            self.putPanel ( panel_id )
        #self.generic_parser_summary = {}
        self.log_parser = pyrvapi_ext.parsers.generic_parser (
                                         panel_id,split_sections_bool,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables )
        pyrvapi.rvapi_flush()
        return

    def setMolrepLogParser ( self,panel_id ):
        self.putPanel ( panel_id )
        self.log_parser = pyrvapi_ext.parsers.molrep_parser ( panel_id )
        pyrvapi.rvapi_flush()
        return


    # ============================================================================

    def stampFileName ( self,serNo,fileName ):
        return dtype_template.makeFileName ( self.job_id,serNo,fileName )

    def makeDataId ( self,serNo ):
        return dtype_template.makeDataId ( self.job_id,serNo )

    # ============================================================================

    def storeReportDocument(self,meta_str):
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
            self.fail ( " *** Error: CCP4 setup does not contain " + appName + ".\n" + \
                        "     Please look for support\n",appName + " not found" )
            return False


    def runApp ( self,appName,cmd,quitOnError=True ):

        input_script = None
        if self.file_stdin:
            input_script    = self.file_stdin_path()
            self._scriptNo += 1

        rc = command.call ( appName,cmd,"./",input_script,
                            self.file_stdout,self.file_stderr,self.log_parser )
        self.file_stdin = None

        if rc.msg and quitOnError:
            raise signal.JobFailure ( rc.msg )

        return rc


    # ============================================================================

    def calcEDMap ( self,xyzPath,hklData,libPath,filePrefix ):
        edmap.calcEDMap ( xyzPath,os.path.join(self.inputDir(),hklData.files[0]),
                          libPath,hklData.dataset,filePrefix,self.job_dir,
                          self.file_stdout,self.file_stderr,self.log_parser )
        return [ filePrefix + edmap.file_pdb (),
                 filePrefix + edmap.file_mtz (),
                 filePrefix + edmap.file_map (),
                 filePrefix + edmap.file_dmap() ]

    def calcAnomEDMap ( self,xyzPath,hklData,anom_form,filePrefix ):
        edmap.calcAnomEDMap ( xyzPath,os.path.join(self.inputDir(),hklData.files[0]),
                              hklData.dataset,anom_form,filePrefix,self.job_dir,
                              self.file_stdout,self.file_stderr,self.log_parser )
        return [ filePrefix + edmap.file_pdb(),
                 filePrefix + edmap.file_mtz(),
                 filePrefix + edmap.file_map(),
                 filePrefix + edmap.file_dmap() ]


    def calcCCP4Maps ( self,mtzPath,filePrefix,source_key="refmac" ):
        edmap.calcCCP4Maps ( mtzPath,filePrefix,self.job_dir,
                             self.file_stdout,self.file_stderr,
                             source_key,self.log_parser )
        return [ filePrefix + edmap.file_map(),
                 filePrefix + edmap.file_dmap() ]


    def finaliseStructure ( self,xyzPath,name_pattern,hkl,libPath,associated_data_list,
                                 subtype,openState_bool=False,
                                 title="Output Structure" ):
        #  subtype = 0: copy subtype from associated data
        #          = 1: set MR subtype
        #          = 2: set EP subtype

        self.file_stdout.write ( "name_pattern=" + name_pattern + "\n")

        structure = None

        if os.path.isfile(xyzPath):

            sec_id = self.refmac_section() + "_" + str(self.widget_no)
            self.putSection ( sec_id,"Electron Density Calculations with Refmac",
                              openState_bool )

            panel_id = self.refmac_report() + "_" + str(self.widget_no)
            pyrvapi.rvapi_add_panel ( panel_id,sec_id,0,0,1,1 )
            #self.log_parser = pyrvapi_ext.parsers.generic_parser ( panel_id,False )
            self.log_parser = pyrvapi_ext.parsers.generic_parser (
                                         panel_id,False,
                                         summary=self.generic_parser_summary,
                                         graph_tables=False )

            fnames = self.calcEDMap ( xyzPath,hkl,libPath,name_pattern )

            # Register output data. This moves needful files into output directory
            # and puts the corresponding metadata into output databox
            self.file_stdout.write ( "fnames=" + str(fnames) + "\n")

            structure = self.registerStructure (
                            fnames[0],fnames[1],fnames[2],fnames[3],libPath )
            if structure:
                structure.addDataAssociation ( hkl.dataId )
                structure.setRefmacLabels ( hkl )
                for i in range(len(associated_data_list)):
                    if associated_data_list[i]:
                        structure.addDataAssociation ( associated_data_list[i].dataId )
                if subtype==0:
                    for i in range(len(associated_data_list)):
                        if associated_data_list[i]:
                            structure.copySubtype ( associated_data_list[i] )
                elif subtype==1:
                    structure.addMRSubtype()
                else:
                    structure.addEPSubtype()
                structure.addXYZSubtype()
                if title!="":
                    self.putTitle ( title )
                self.putMessage ( "&nbsp;" )
                self.putStructureWidget   ( "structure_btn_",
                                            "Structure and electron density",
                                            structure )
        else:
            self.putTitle ( "No Solution Found" )

        self.widget_no += 1
        return structure


    def finaliseAnomSubstructure ( self,xyzPath,name_pattern,hkl,
                                        associated_data_list,
                                        anom_form,openState_bool=False,
                                        title="" ):

        anom_structure = self.finaliseAnomSubstructure1 ( xyzPath,name_pattern,
                                        hkl,associated_data_list,anom_form,
                                        self.report_page_id(),self.rvrow,
                                        openState_bool,title )
        self.rvrow += 2
        if anom_structure:
            self.rvrow += 1
            if title:
                self.rvrow += 1

        return anom_structure


    def finaliseAnomSubstructure1 ( self,xyzPath,name_pattern,hkl,
                                        associated_data_list,anom_form,pageId,
                                        row,openState_bool=False,title="" ):

        sec_id = self.refmac_section() + "_" + str(self.widget_no)
        row1   = row

        pyrvapi.rvapi_add_section ( sec_id,
                        "Anomalous Electron Density Calculations with Refmac",
                        pageId,row1,0,1,1,openState_bool )
        row1 += 1

        panel_id = self.refmac_report() + "_" + str(self.widget_no)
        pyrvapi.rvapi_add_panel ( panel_id,sec_id,0,0,1,1 )
        #self.log_parser = pyrvapi_ext.parsers.generic_parser ( panel_id,False )
        self.log_parser = pyrvapi_ext.parsers.generic_parser (
                                         panel_id,False,
                                         summary=self.generic_parser_summary,
                                         graph_tables=False )

        fnames = self.calcAnomEDMap ( xyzPath,hkl,anom_form,name_pattern )

        anom_structure = self.registerStructure (
                            fnames[0],fnames[1],fnames[2],fnames[3],None )
        if anom_structure:
            anom_structure.addDataAssociation ( hkl.dataId )
            anom_structure.setRefmacLabels    ( hkl )
            for i in range(len(associated_data_list)):
                if associated_data_list[i]:
                    structure.addDataAssociation ( associated_data_list[i].dataId )
            anom_structure.setAnomSubstrSubtype() # anomalous maps
            self.putMessage1 ( pageId,"&nbsp;",row1 )
            row1 += 1
            if title!="":
                self.putTitle1 ( pageId,title,row1,1 )
                row1 += 1
            openState = -1
            if openState_bool:
                openState = 1
            self.putStructureWidget1 ( pageId,"anom_structure_btn_",
                                        "Anomalous substructure and electron density",
                                        anom_structure,openState,row1,1 )
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
                self.putLigandWidget ( "ligand_btn_","Ligand structure",
                                       ligand )
        else:
            self.putTitle ( "No Ligand Formed" )

        self.widget_no += 1
        return ligand


    # ============================================================================

    def putInspectButton ( self,dataObject,title,gridId,row,col ):
        buttonId = "inspect_data_" + str(self.widget_no)
        self.widget_no += 1
        pyrvapi.rvapi_add_button ( buttonId,title,"{function}",
                    "window.parent.rvapi_inspectData(" + self.job_id +\
                    ",'" + dataObject._type + "','" + dataObject.dataId + "')",
                    False,gridId, row,col,1,1 )
        return


    def putRSViewerButton ( self,rlpFilePath,mapFilePath,title,text_btn,gridId,row,col ):
        buttonId = "rsviewer_" + str(self.widget_no)
        self.widget_no += 1
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.rvapi_rsviewer(" + self.job_id +\
                    ",'" + title + "','" + rlpFilePath + "','" + mapFilePath + "')",
                    False,gridId, row,col,1,1 )
        return


    def putDownloadButton ( self,dnlFilePath,text_btn,gridId,row,col ):
        buttonId = "download_" + str(self.widget_no)
        self.widget_no += 1
        pyrvapi.rvapi_add_button ( buttonId,text_btn,"{function}",
                    "window.parent.downloadJobFile(" + self.job_id +\
                    ",'" + dnlFilePath + "')",False,gridId, row,col,1,1 )
        return


    # ============================================================================


    def putRevisionWidget ( self,gridId,row,message,revision ):
        buttonId = "inspect_" + str(self.widget_no)
        self.widget_no += 1
        pyrvapi.rvapi_add_button ( buttonId,"Inspect","{function}",
                            "window.parent.rvapi_inspectData(" + self.job_id +\
                            ",'DataRevision','" + revision.dataId + "')",
                            False,gridId, row,0,1,1 )
        pyrvapi.rvapi_set_text ( message,gridId, row,1,1,1 )
        pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>\"" + revision.dname +
                                 "\"</font>", gridId, row,2,1,1 )
        return


    def registerRevision ( self,revision,serialNo=1,title="Structure Revision",
                           message="<b><i>New structure revision name:</i></b>",
                           gridId = "" ):

        revision.makeRevDName ( self.job_id,serialNo,self.outputFName )
        revision.register     ( self.outputDataBox )
        if title:
            self.putTitle ( title )

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


    def registerStructure ( self,xyzPath,mtzPath,mapPath,dmapPath,
                            libPath=None,copy=False ):
        self.dataSerialNo += 1
        structure = dtype_structure.register (
                                    xyzPath,mtzPath,mapPath,dmapPath,libPath,
                                    self.dataSerialNo ,self.job_id,
                                    self.outputDataBox,self.outputDir(),
                                    copy=copy )
        if not structure:
            self.file_stderr.write ( "  NONE STRUCTURE" )
            self.file_stderr.flush()
        else:
            structure.putXYZMeta ( self.outputDir(),self.file_stdout,
                                   self.file_stderr,None )
        return structure


    def _move_file_to_output_dir ( self,fpath,fname_dest ):
        if os.path.isfile(fpath):
            fpath_dest = os.path.join ( self.outputDir(),fname_dest )
            if not os.path.isfile(fpath_dest):
                os.rename ( fpath,fpath_dest )
                return True
        return False


    def registerStructure1 ( self,xyzPath,mtzPath,mapPath,dmapPath,libPath,regName ):
        self.dataSerialNo += 1
        structure = dtype_structure.register1 (
                                xyzPath,mtzPath,mapPath,dmapPath,libPath,
                                regName,self.dataSerialNo,self.job_id,
                                self.outputDataBox )
        if not structure:
            self.file_stderr.write ( "  NONE STRUCTURE\n" )
            self.file_stderr.flush()
        else:
            self._move_file_to_output_dir ( xyzPath ,structure.files[0] )
            self._move_file_to_output_dir ( mtzPath ,structure.files[1] )
            if (len(structure.files)>2) and structure.files[2]:
                self._move_file_to_output_dir ( mapPath ,structure.files[2] )
            if len(structure.files)>3 and structure.files[3]:
                self._move_file_to_output_dir ( dmapPath,structure.files[3] )
            if len(structure.files)>4 and structure.files[4]:
                self._move_file_to_output_dir ( libPath,structure.files[4] )
            structure.putXYZMeta ( self.outputDir(),self.file_stdout,
                                   self.file_stderr,None )
        return structure


    def registerLigand ( self,xyzPath,cifPath,copy=False ):
        self.dataSerialNo += 1
        ligand = dtype_ligand.register ( xyzPath,cifPath,
                                         self.dataSerialNo ,self.job_id,
                                         self.outputDataBox,self.outputDir(),
                                         copy=copy )
        if not ligand:
            self.file_stderr.write ( "  NONE LIGAND" )
            self.file_stderr.flush()
        return ligand


    # ----------------------------------------------------------------------------

    def putHKLWidget ( self,widgetId,title_str,hkl,openState=-1 ):
        self.putHKLWidget1 ( self.report_page_id(),widgetId + str(self.widget_no),
                            title_str,hkl,openState,self.rvrow,1 )
        self.rvrow     += 2
        self.widget_no += 1
        return

    def putHKLWidget1 ( self,pageId,widgetId,title_str,hkl,openState,row,colSpan ):
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" + hkl.dname,row )
        pyrvapi.rvapi_add_data ( widgetId + str(self.widget_no),title_str,
                                 # always relative to job_dir from job_dir/html
                                 os.path.join("..",self.outputDir(),hkl.files[0]),
                                 "hkl:hkl",pageId,row+1,0,1,colSpan,openState )
        self.widget_no += 1
        return row + 2

    def putStructureWidget ( self,widgetId,title_str,structure,openState=-1 ):
        self.putStructureWidget1 ( self.report_page_id(),
                                   widgetId + str(self.widget_no),title_str,
                                   structure,openState,self.rvrow,1 )
        self.rvrow     += 2
        self.widget_no += 1
        return


    def putStructureWidget1 ( self,pageId,widgetId,title_str,structure,openState,row,colSpan ):
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" +
                                  structure.dname +
                                  "<font size='+2'><sub>&nbsp;</sub></font>",row )
        wId     = widgetId + str(self.widget_no)
        self.widget_no += 1
        type    = ["xyz","hkl:map","hkl:ccp4_map","hkl:ccp4_dmap","LIB"]
        created = False
        for i in range(len(structure.files)):
            if structure.files[i]:
                if not created:
                    pyrvapi.rvapi_add_data ( wId,title_str,
                                    # always relative to job_dir from job_dir/html
                                    os.path.join("..",self.outputDir(),structure.files[i]),
                                    type[i],pageId,row+1,0,1,colSpan,openState )
                    created = True
                else:
                    pyrvapi.rvapi_append_to_data ( wId,
                                    # always relative to job_dir from job_dir/html
                                    os.path.join("..",self.outputDir(),structure.files[i]),
                                    type[i] )
        return row+2


    # ============================================================================


    def putLigandWidget ( self,widgetId,title_str,ligand,openState=-1 ):
        self.putLigandWidget1 ( self.report_page_id(),
                                widgetId + str(self.widget_no),title_str,
                                ligand,openState,self.rvrow,1 )
        self.rvrow     += 2
        self.widget_no += 1
        return

    def putLigandWidget1 ( self,pageId,widgetId,title_str,ligand,openState,row,colSpan ):
        wId = widgetId + str(self.widget_no)
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" + ligand.dname +
                                  "<font size='+2'><sub>&nbsp;</sub></font>",row )
        pyrvapi.rvapi_add_data ( wId,title_str,
                                 # always relative to job_dir from job_dir/html
                                 os.path.join("..",self.outputDir(),ligand.files[0]),
                                 "xyz",pageId,row+1,0,1,colSpan,openState )
        if len(ligand.files) > 1:
            pyrvapi.rvapi_append_to_data ( wId,
                                # always relative to job_dir from job_dir/html
                                os.path.join("..",self.outputDir(),ligand.files[1]),
                                "LIB" )
        self.widget_no += 1
        return row+2


    # ============================================================================

    def registerXYZ ( self,xyzPath,checkout=True ):
        self.dataSerialNo += 1
        if checkout:
            xyz = dtype_xyz.register ( xyzPath,self.dataSerialNo,self.job_id,
                                       self.outputDataBox,self.outputDir() )
        else:
            xyz = dtype_xyz.register ( xyzPath,self.dataSerialNo,self.job_id,
                                       None,self.outputDir() )
        if not xyz:
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

    def putXYZWidget ( self,widgetId,title_str,xyz,openState=-1 ):
        pyrvapi.rvapi_add_data ( widgetId,title_str,
                    # always relative to job_dir from job_dir/html
                    os.path.join("..",self.outputDir(),xyz.files[0]),
                    "xyz",secId,secrow,0,1,1,-1 )
        return


    # ============================================================================

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
            ensemble.putXYZMeta ( self.outputDir(),self.file_stdout,
                                  self.file_stderr,None )

        return ensemble

    # ----------------------------------------------------------------------------

    def putEnsembleWidget ( self,widgetId,title_str,ensemble,openState=-1 ):
        self.putEnsembleWidget1 ( self.report_page_id(),widgetId,title_str,
                                  ensemble,openState,self.rvrow,1 )
        self.rvrow += 2
        return

    def putEnsembleWidget1 ( self,pageId,widgetId,title_str,ensemble,openState,row,colSpan ):
        self.putMessage1 ( pageId,"<b>Assigned name:</b>&nbsp;" +\
                                  ensemble.dname + "<br>&nbsp;",row )
        pyrvapi.rvapi_add_data ( widgetId,title_str,
                    # always relative to job_dir from job_dir/html
                    os.path.join("..",self.outputDir(),ensemble.files[0]),
                    "xyz",pageId,row+1,0,1,colSpan,openState )
        return row+2


    # ============================================================================

    def checkSpaceGroupChanged ( self,sol_spg,hkl,mtzfilepath ):
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
        if solSpg and (solSpg!=hkl.getSpaceGroup().replace(" ", "")):

            self.putMessage ( "<font style='font-size:120%;'><b>Space Group changed to " +\
                              sol_spg + "</b></font>" )
            rvrow0      = self.rvrow
            self.rvrow += 1
            #if not self.generic_parser_summary:
            #    self.generic_parser_summary = {}
            self.generic_parser_summary["z01"] = {'SpaceGroup':sol_spg}
            newHKLFPath = self.getOFName ( "_" + solSpg + "_" + hkl.files[0],-1 )
            os.rename ( mtzfilepath,newHKLFPath )
            self.files_all = [ newHKLFPath ]
            import_merged.run ( self,"New reflection dataset details" )

            if dtype_hkl.dtype() in self.outputDataBox.data:
                sol_hkl = self.outputDataBox.data[dtype_hkl.dtype()][0]
                pyrvapi.rvapi_set_text ( "<b>New reflection dataset created:</b> " +\
                        sol_hkl.dname,self.report_page_id(),rvrow0,0,1,1 )

                self.putMessage (
                    "<p><i>Consider re-merging your original dataset using " +\
                    "this new one as a reference</i>" )

                # Copy new reflection file to input directory in order to serve
                # Refmac job(s) (e.g. as part of self.finaliseStructure()). The
                # job needs reflection data for calculating Rfree, other stats
                # and density maps.
                shutil.copy2 ( os.path.join(self.outputDir(),sol_hkl.files[0]),
                               self.inputDir() )

                return (newHKLFPath,sol_hkl)

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
            self.files_all = []

            for i in range(len(hkl_list)):

                # make new hkl file name
                newHKLFPath = self.getOFName ( "_" + solSpg + "_" + hkl_list[i].files[0],-1 )

                # make command-line parameters for reindexing
                cmd = [ "hklin" ,hkl_list[i].getFilePath(self.inputDir()),
                        "hklout",newHKLFPath ]

                # run reindex
                self.file_stdin = f_stdin  # for repeat use of input script file
                self.runApp ( "reindex",cmd )

                if os.path.isfile(newHKLFPath):
                    self.files_all.append ( newHKLFPath )
                else:
                    self.putMessage ( "Error: cannot reindex " + hkl_list[i].dname )

            import_merged.run ( self,"New reflection datasets" )

            return self.outputDataBox.data[hkl_list[0]._type]

        else:
            return None


    # ============================================================================


    def success(self):
        if self.task:
            self.task.cpu_time = command.getTimes()[1]
            if self.generic_parser_summary:
                self.task.scores = self.generic_parser_summary
            with open('job.meta','w') as file_:
                file_.write ( self.task.to_JSON() )
        self.rvrow += 1
        self.putMessage ( "<p>&nbsp;" )  # just to make extra space after report
        self.outputDataBox.save ( self.outputDir() )
        pyrvapi.rvapi_flush   ()
        self.file_stdout.close()
        self.file_stderr.close()
        raise signal.Success()

    def fail ( self,pageMessage,signalMessage ):
        if self.task:
            self.task.cpu_time = command.getTimes()[1]
            if self.generic_parser_summary:
                self.task.scores = self.generic_parser_summary
            with open('job.meta','w') as file_:
                file_.write ( self.task.to_JSON() )
        self.putMessage ( "<p>&nbsp;" )  # just to make extra space after report
        pyrvapi.rvapi_set_text ( pageMessage,self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_flush    ()
        msg = pageMessage.replace("<b>","").replace("</b>","").replace("<i>","") \
                         .replace("</i>","").replace("<br>","\n").replace("<p>","\n")
        self.file_stdout.write ( msg + "\n" )
        self.file_stderr.write ( msg + "\n" )
        self.file_stdout.close ()
        self.file_stderr.close ()
        raise signal.JobFailure ( signalMessage )

    def python_fail_tab ( self ):
        trace = ''.join( traceback.format_exception( *sys.exc_info() ) )
        msg = '<h2><i>Job Driver Failure</i></h2>'
        msg += '<p>Catched error:<pre>' + trace + '</pre>'
        msg += """
        <p>This is an internal error, which may be caused by different
        sort of hardware and network malfunction, but most probably due
        to a bug or not anticipated properties of input data.
        """
        if self.maintainerEmail:
            msg += """
            <p>You may contribute to the improvement of jsCoFE by sending this
            message <b>together with</b> input data <b>and task description</b> to
            """
            msg += self.maintainerEmail

        page_id = self.traceback_page_id()
        pyrvapi.rvapi_add_tab ( page_id, "Error Trace", True )
        pyrvapi.rvapi_set_text ( msg, page_id, 0, 0, 1, 1 )

    def start(self):
        try:
            self.run()

        except signal.Success, s:
            signal_obj = s

        except signal.CofeSignal, s:
            self.python_fail_tab()
            signal_obj = s

        except:
            self.python_fail_tab()
            signal_obj = signal.JobFailure()

        else:
            signal_obj = signal.Success()

        finally:
            pass

        signal_obj.quitApp()
