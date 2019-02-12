##!/usr/bin/python

#
# ============================================================================
#
#    04.02.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#
#
#  Invocation:
#     ccp4-python ccp4build.py
#                 [--rvapi-prefix   jsrview]             \
#                 [--rdir           reportdir]           \
#                 [--rvapi-document rvapi_document]      \
#                 [--wkdir          workdir]             \
#                 [--outdir         outputdir]
#
#

import sys
import os

import pyrvapi
import pyrvapi_ext.parsers

import mtz
import command
import citations
#import xyzmeta

# ============================================================================

class Base(object):

    stdout_path    = None
    stderr_path    = None
    file_stdout    = sys.stdout
    file_stderr    = sys.stderr

    script_path    = ""
    script_file    = None

    log_parser     = None
    generic_parser_summary = {}

    outputdir      = "output"  # output directory
    reportdir      = "report"  # report directory
    report_type    = 1
    report_layout  = -1     # no rvapi report by default
    rvapi_prefix   = None   # uri to jsrview JS support
    rvapi_doc_path = None   # path to rvapi document
    rvapi_wid0     = ""     # optional modifier for widget ids
    rvapi_widNo    = 0      # widget counter
    report_page_id = "body" # report grid
    rvrow          = 0

    jobId          = "1"    # jobId (coming from jsCoFE)
    job_title      = "Pabucor"

    keyword_list   = []     # keyword file read into a list of strings

    input_data = {
        "mtzpath"          : None, # must be given on input
        "xyzpath"          : None,
        "xyzpath_mr"       : None, # current MR model, may be given on input
        "xyzpath_ha"       : None, # heavy atom substructure, may be given on input
        "nameout"          : "ccp4build",
        "mode"             : "",   # "" (auto), "MR" or "EP"
        "seqpath"          : None, # must be given on input
        "labin_fo"         : None, # e.g. "/*/*/[F,SIGF]",
        "labin_phifom"     : None, # e.g. "/*/*/[PHIC_ALL_LS,FOM]", None if HL provided
        "labin_fc"         : None, # e.g. "/*/*/[FWT,PHWT]", None if HL provided
        "labin_hl"         : None, # e.g. "/*/*/[HLA,HLB,HLC,HLD]", None if phifom given
        "labin_free"       : None, # e.g. "/*/*/[FREE]"
        "res_low"          : None, # low resolution limit (None for auto)
        "res_high"         : None, # high resolution limit (None for auto)
        "pdb_ref_code"     : "1tqw",
        "outer_cycles_min" : 3,    # minimal number of outer cycles to do
        "outer_cycles_max" : 20,   # maximal number of outer cycles to do
        "noimprove_cycles" : 5,    # stop if results do not improve after set
                                   #   number of consequitive cycles
        "inner_cycles"     : 1     # possibly should be hard-wired
    }

    build_meta    = []  # meta structures of results for individual iterations
    best_build_no = -1  # index of best result in outmeta

    xyzout_path = None
    mtzout_path = None

    # ----------------------------------------------------------------------

    #def report_page_id(self):
    #    return "report_page_" + str(self.jobId)

    def getWidgetId ( self,wid ):
        self.rvapi_widNo += 1
        return self.rvapi_wid0 + "_" + str(self.rvapi_widNo) + "_" + wid

    # ----------------------------------------------------------------------

    def __init__ ( self,args=None ):
        #   args = optional replacement for sys.argv to allow this class to be
        #     called from within other Python programs (such as tests)

        self.file_stdout = sys.stdout
        self.file_stderr = sys.stderr

        # first parse command-line parameters

        if args is None:
            args = sys.argv[1:]

        narg = 0
        while narg<len(args):
            key   = args[narg]
            narg += 1
            if narg<len(args):
                value = args[narg]
                if   key == "--wkdir"          : self.workdir        = value
                elif key == "--rdir"           : self.reportdir      = value
                elif key == "--outdir"         : self.outputdir      = value
                elif key == "--rvapi-prefix"   : self.rvapi_prefix   = value
                elif key == "--rvapi-document" : self.rvapi_doc_path = value
                elif key == "--jobid"          : self.jobId          = value
                else:
                    self.output_meta["retcode"] = "[01-001] unknown command line parameter"
                    self.stderr ( " *** unrecognised command line parameter " + key )
                narg += 1

        #self.file_stdout.write ( "workdir      = " + self.workdir   + "\n" )
        #self.file_stdout.write ( "reportdir    = " + self.reportdir + "\n" )
        #self.file_stdout.write ( "outputdir    = " + self.outputdir + "\n" )
        #self.file_stdout.write ( "rvapi_prefix = " + self.rvapi_prefix + "\n\n" )

        # read data from standard input

        self.keyword_list = sys.stdin.read().splitlines()

        # initialise work directory structure

        self.scriptsdir = os.path.join ( self.workdir,"scripts" )
        if not os.path.isdir(self.scriptsdir):
            os.makedirs ( self.scriptsdir )

        """
        outdir = os.path.join ( self.workdir,self.outputdir )
        if not os.path.isdir(outdir):
            os.mkdir ( outdir )
        """
        if not os.path.isdir(self.outputdir):
            os.makedirs ( self.outputdir )

        # initialise RVAPI report

        if not self.rvapi_doc_path:  # initialise rvapi report document

            self.report_type = 1    # report with tabs
            if not self.rvapi_prefix or not self.reportdir:
                self.report_type = 0x00100000   # report will not be created

            self.report_layout = 0  # plain page

            """
            rdir = self.reportdir
            if not rdir:
                rdir = "report"
            rdir = os.path.join ( self.workdir,rdir ) # has to be full path because of Crank-2

            if not os.path.isdir(rdir):
                os.mkdir ( rdir )
            """
            if not os.path.isdir(self.reportdir):
                os.makedirs ( self.reportdir )

            # initialise HTML report document; note that we use absolute path for
            # the report directory, which is necessary for passing RVAPI document
            # to applications via creation of the rvapi_document file with
            # pyrvapi.rvapi_store_document2(..)

            #self.file_stdout.write ( "rdir          = " + rdir   + "\n" )
            #self.file_stdout.write ( "report_type   = " + str(self.report_type) + "\n" )
            #self.file_stdout.write ( "report_layout = " + str(self.report_layout) + "\n" )
            #self.file_stdout.write ( "rvapi_prefix  = " + self.rvapi_prefix + "\n\n" )

            pyrvapi.rvapi_init_document (
                        "ccp4build_report",   # document Id
                        #rdir,               # report directory
                        self.reportdir,     # report directory
                        "Title",            # title (immaterial)
                        self.report_type,   # HTML report to be produced
                        self.report_layout, # layout type
                        self.rvapi_prefix,  # where to look for js support
                        None,None,
                        "task.tsk",
                        None )

            self.putMessage ( "<h2>Pabucor Combined Model Builder</h2>" )


        else:  # continue rvapi document given
            pyrvapi.rvapi_restore_document2 ( self.rvapi_doc_path )
            """
            meta = pyrvapi.rvapi_get_meta();
            #self.stdout ( "\n META = " + meta )
            if meta:
                d = json.loads(meta)
                if "jobId"   in d:  self.jobId    = d["jobId"]
                if "stageNo" in d:  self.stage_no = d["stageNo"]
                if "sge_q"   in d:  self.SGE      = True
                if "sge_tc"  in d:  self.nSubJobs = d["sge_tc"]
                if "summaryTabId"  in d:
                        self.summaryTabId   = d["summaryTabId"]
                        self.page_cursor[0] = self.summaryTabId
                if "summaryTabRow" in d:
                        self.summaryTabRow  = d["summaryTabRow"]
                        self.page_cursor[1] = self.summaryTabRow
                if "navTreeId"     in d:
                        self.navTreeId = d["navTreeId"]
                        pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,"" )
                if "outputDir"  in d:  self.outputdir  = d["outputDir"]
                if "outputName" in d:  self.outputname = d["outputName"]
            """

        #self.file_stdout.write ( "FLUSH\n" )
        pyrvapi.rvapi_flush()

        return


    def readPGMOptions ( self,pgmName,options_dict ):

        options = options_dict
        pgmKey  = "[" + pgmName+ "]"
        keyon   = False
        for i in range(len(self.keyword_list)):
            if not self.keyword_list[i].startswith("#"):
                if self.keyword_list[i].startswith ( pgmKey ):
                    self.file_stdout.write ( "\n" + self.keyword_list[i] + "\n" )
                    keyon = True
                elif self.keyword_list[i].startswith("["):
                    keyon = False
                elif keyon:
                    lst = filter(None,self.keyword_list[i].split())
                    if len(lst)>0:
                        option = lst[0]
                        if option in options:
                            self.file_stdout.write ( self.keyword_list[i] + "\n" )
                            options[option] = self.keyword_list[i][len(option):].strip()
                            self.keyword_list[i] = "# " + self.keyword_list[i]

        return options


    # ----------------------------------------------------------------------

    def readInputData ( self ):

        self.input_data = self.readPGMOptions ( "input_data",self.input_data )

        if self.input_data["mode"]=="":
            if self.input_data["labin_hl"]:
                self.input_data["mode"] = "EP"
            else:
                self.input_data["mode"] = "MR"
            """
            xmeta = xyzmeta.getXYZMeta ( self.input_data["xyzpath"],
                                         self.file_stdout,self.file_stderr )
            self.input_data["mode"] = "NO"
            for xyz in xmeta["xyz"]:
                for chain in xyz["chains"]:
                    if chain["type"]!="LIG":
                        self.input_data["has_model"] = "YES"
            """

        if (not self.input_data["res_low"]) or (not self.input_data["res_high"]):
            mf = mtz.mtz_file ( self.input_data["mtzpath"],None )
            if not self.input_data["res_low"]:
                self.input_data["res_low"] = str(mf.RESO[0])
                self.file_stdout.write ( "res_low    " + self.input_data["res_low"] +\
                                         "   # found from input file\n" )
            if not self.input_data["res_high"]:
                self.input_data["res_high"] = str(mf.RESO[1])
                self.file_stdout.write ( "res_high   " + self.input_data["res_high"] +\
                                         "   # found from input file\n" )

        self.xyzout_path = os.path.join ( self.outputdir,self.input_data["nameout"]+".pdb" )
        self.mtzout_path = os.path.join ( self.outputdir,self.input_data["nameout"]+".mtz" )

        return

    def getRefPDB ( self ):
        return os.path.join ( os.environ["CCP4"],"lib","data",
                "reference_structures","reference-" + self.input_data["pdb_ref_code"] + ".pdb" )

    def getRefMTZ ( self ):
        return os.path.join ( os.environ["CCP4"],"lib","data",
                "reference_structures","reference-" + self.input_data["pdb_ref_code"] + ".mtz" )


    # ----------------------------------------------------------------------

    def putMessage ( self,message_str ):
        pyrvapi.rvapi_set_text ( message_str,self.report_page_id,self.rvrow,0,1,1 )
        self.rvrow += 1
        return

    def putPanel ( self,panel_id ):
        pyrvapi.rvapi_add_panel ( panel_id,self.report_page_id,self.rvrow,0,1,1 )
        self.rvrow += 1
        return


    def putStructureWidget ( self,title_str,fpath_list,openState ):

        wId = self.getWidgetId ( "structure" )
        pyrvapi.rvapi_add_data ( wId,title_str,fpath_list[0],
                "xyz",self.report_page_id,self.rvrow,0,1,1,openState )
        self.rvrow += 1

        if len(fpath_list)>1:
            pyrvapi.rvapi_append_to_data ( wId,fpath_list[1],"hkl:map" )
        if len(fpath_list)>2:
            pyrvapi.rvapi_append_to_data ( wId,fpath_list[2],"hkl:ccp4_map" )
        if len(fpath_list)>3:
            pyrvapi.rvapi_append_to_data ( wId,fpath_list[3],"hkl:ccp4_dmap" )

        self.addCitations ( ['uglymol','ccp4mg','viewhkl'] )

        return


    # ----------------------------------------------------------------------

    def splitLabin ( self,labin ):
        split1 = labin.replace("[","").replace("]","").split(",")
        split2 = split1[0].split("/")
        labin_list = [split1[0]]
        for i in range(1,len(split1)):
            labin_list.append ( split1[0].replace(split2[-1],split1[i]) )
        return labin_list

    def getLabel ( self,labin,labelNo ):
        split1 = labin.replace("[","").replace("]","").split(",")
        if labelNo>0:
            return split1[labelNo]
        return split1[0].split("/")[-1]


    # ----------------------------------------------------------------------

    def open_script ( self,scriptname ):
        self.script_path = os.path.join ( self.scriptsdir,scriptname+".script" )
        self.script_file = open ( self.script_path,"w" )
        return

    def write_script ( self,S ):

        if type(S) is list:
            for line in S:
                if line:
                    self.script_file.write ( line + "\n" )

        elif type(S) is dict:
            for opt in S:
                value = str(S[opt])
                if value!="False":
                    if value=="True":
                        value = ""
                    self.write_script ( opt.replace("+"," ") + " " + value + "\n" )

        else:
            self.script_file.write ( S )

        return

    def close_script ( self ):
        self.script_file.close()
        return


    # ----------------------------------------------------------------------

    def getStdOutPath ( self,nameout ):
        return os.path.join ( self.workdir, nameout + "_stdout.log" )

    def getStdErrPath ( self,nameout ):
        return os.path.join ( self.workdir, nameout + "_stderr.log" )

    def log ( self,S ):
        if type(S) is list:
            for line in S:
                self.file_stdout.write ( line + "\n" )
        else:
            self.file_stdout.write ( S )
        return


    # ----------------------------------------------------------------------

    def unsetLogParser ( self ):
        self.file_stdout.flush()
        self.log_parser = None
        pyrvapi.rvapi_flush()
        return

    def setGenericLogParser ( self,split_sections_bool,graphTables=False ):
        panel_id = self.getWidgetId ( "genlogparser" )
        self.putPanel ( panel_id )
        self.generic_parser_summary = {}
        self.log_parser = pyrvapi_ext.parsers.generic_parser (
                                         panel_id,split_sections_bool,
                                         summary=self.generic_parser_summary,
                                         graph_tables=graphTables,
                                         hide_refs=True )
        pyrvapi.rvapi_flush()
        return panel_id


    # ----------------------------------------------------------------------

    def runApp ( self,appName,cmd,fpath_stdout=None,fpath_stderr=None ):

        input_script = None
        if self.script_file:
            input_script = self.script_path

        fstdout = self.file_stdout
        fstderr = self.file_stderr

        if fpath_stdout:
            fstdout = open ( fpath_stdout,'a' )
        if fpath_stderr:
            fstderr = open ( fpath_stderr,'a' )

        rc = command.call ( appName,cmd,"./",input_script,
                            fstdout,fstderr,self.log_parser )
        self.script_file = None

        if fpath_stdout:
            fstdout.close()
        if fpath_stderr:
            fstderr.close()

        return rc

    # ----------------------------------------------------------------------

    def addCitation ( self,appName ):
        citations.addCitation ( appName )
        return

    def addCitations ( self,appName_list ):
        citations.addCitations ( appName_list )
        return
