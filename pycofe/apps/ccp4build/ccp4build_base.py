##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    14.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2026
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
import json

import pyrvapi
import pyrvapi_ext.parsers
# import refmac_parser

import mtz
import command
import citations
#import xyzmeta

# ============================================================================

class Base(object):

    appVersion     = "1.0.4 [23.03.23]"

    stdout_path    = None  #  main log
    stderr_path    = None  #  error log
    srvout_path    = None  #  service log
    file_stdout    = sys.stdout
    file_stderr    = sys.stderr
    file_srvout    = None

    script_path    = ""
    script_file    = None

    current_pdb    = None
    current_mtz    = None
    legend_html    = None
    wc_grid        = ""
    wc_row         = 0
    wc_col         = 0


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

    jobId          = "1"    # jobId (comes from jsCoFE)
    project        = ""     # project Id (comes form jsCoFE)
    job_title      = "CCP4Build"

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
        "ref_level"        : 2,    # refinement level 1-2-3
        "dm_mode"          : "auto",  # [auto|always|never]
        "fill_mode"        : "never", # [auto|always|never]
        "fit_mode"         : "auto",  # [auto|always|never]
        "rsr_mode"         : "never", # [auto|always|never]
        "trim_mode"        : "never", # for mainchains/sidechains; [never|auto|restricted|fixed]
        "model_waters"     : False, # whether to trim waters or not
        "trim_mode_w"      : "restricted", # for waters; [never|auto|restricted|fixed]
        "trim_wat_resol"   : 2.5,   # maximal resolution for trimming waters
        "trim_wat_rfree"   : 0.33,  # maximal Rfree for trimming waters
        "trimmin_zdm"      : 1.8,   # minimum restricted ZD for trimming mainchains
        "trimmax_zdm"      : 3.2,   # maximum restricted ZD for trimming mainchains
        "trimmin_zds"      : 1.8,   # minimum restricted ZD for trimming sidechains
        "trimmax_zds"      : 3.2,   # maximum restricted ZD for trimming sidechains
        "trimmin_zdw"      : 1.5,   # minimum restricted ZD for trimming waters
        "trimmax_zdw"      : 2.0,   # maximum restricted ZD for trimming waters
        "trim_zdm"         : 2.5,   # fixed ZD for trimming mainchains
        "trim_zds"         : 2.5,   # fixed ZD for trimming sidechains
        "trim_zdw"         : 2.0,   # fixed ZD for trimming waters
        "pdb_ref_code"     : "1tqw",
        "cycles_min"       : 3,     # minimal number of outer cycles to do
        "cycles_max"       : 20,    # maximal number of outer cycles to do
        "noimprove_cycles" : 15,    # stop if results do not improve after set
                                    #   number of consequitive cycles
        "stop_file"        : None,  # signal file to end gracefully
        "rfree_threshold"  : 0.000, # threshold for rfree comparisons in workflow
        "experiment_type"  : "xray",
        "form_factor"      : "default"
    }

    workflow   = ""            # workflow tracker line

    build_meta = []            # meta structures of results for individual iterations
    best_rfree_build_no  = -1  # index of best-rfree result in build_meta
    best_edcc_build_no   = -1  # index of best-edcc result in build_meta
    best_nbuilt_build_no = -1  # index of best-nbuilt result in build_meta
    best_nfrag_build_no  = -1  # index of best-nfragments result in build_meta

    output_prefix_rfree  = ""
    output_prefix_edcc   = ""
    output_prefix_nbuilt = ""
    output_prefix_nfrag  = ""

    output_name_rfree    = None
    output_name_edcc     = None
    output_name_nbuilt   = None
    output_name_nfrag    = None

    rvrow_results = 0  # rvapi report row number for results section
    rvrow_rfree   = 0  # rvapi report row number for rfree output
    rvrow_edcc    = 0  # rvapi report row number for rfree output
    rvrow_nbuilt  = 0  # rvapi report row number for rfree output
    rvrow_nfrag   = 0  # rvapi report row number for rfree output

    resTableId = {}

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
                elif key == "--srvlog"         : self.srvout_path    = value
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

        if self.srvout_path:
            self.file_srvout = open ( self.srvout_path,'a' )

        # read data from standard input

        self.keyword_list = sys.stdin.read().splitlines()

        # initialise work directory structure

        self.scriptsdir = os.path.join ( self.workdir,"scripts" )
        if not os.path.isdir(self.scriptsdir):
            os.makedirs ( self.scriptsdir )

        self.current_pdb = os.path.join ( self.workdir,"current.pdb" )
        self.current_mtz = os.path.join ( self.workdir,"current.mtz" )
        self.legend_html = os.path.join ( self.workdir,"legend.html" )

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

            #self.putMessage ( "<h2>Pabucor Combined Model Builder</h2>" )

        else:  # continue rvapi document given
            pyrvapi.rvapi_restore_document2 ( self.rvapi_doc_path )
            meta = pyrvapi.rvapi_get_meta();
            if meta:
                d = json.loads(meta)
                self.report_page_id = d["page_id"]
                self.rvrow          = d["rvrow"]
                self.input_data["nameout"] = d["nameout"]
                self.jobId          = d["jobId"]
                self.project        = d["project"]

                if d["prefix_rfree" ]:
                    self.output_prefix_rfree  = d["prefix_rfree" ] + "_"
                if d["prefix_edcc"  ]:
                    self.output_prefix_edcc   = d["prefix_edcc"  ] + "_"
                if d["prefix_nbuilt"]:
                    self.output_prefix_nbuilt = d["prefix_nbuilt"] + "_"
                if d["prefix_nfrag" ]:
                    self.output_prefix_nfrag  = d["prefix_nfrag" ] + "_"

        #self.file_stdout.write ( "FLUSH\n" )
        pyrvapi.rvapi_flush()

        return

    # ----------------------------------------------------------------------

    def storeReportDocument ( self ):

        if self.rvapi_doc_path:  # store rvapi report document

            meta = {}

            meta["outnames"] = [
                self.output_name_rfree,
                self.output_name_edcc,
                self.output_name_nbuilt,
                self.output_name_nfrag
            ]

            meta["titles"] = [
                "min R<sub>free</sub>",
                "max EDCC",
                "max N<sub>res</sub>",
                "min N<sub>frag</sub>"
            ]

            meta["build_no"] = [
                self.best_rfree_build_no,
                self.best_edcc_build_no,
                self.best_nbuilt_build_no,
                self.best_nfrag_build_no
            ]

            meta["page"] = [
                self.rvrow_rfree,   # rvapi report row number for rfree output
                self.rvrow_edcc,    # rvapi report row number for rfree output
                self.rvrow_nbuilt,  # rvapi report row number for rfree output
                self.rvrow_nfrag,   # rvapi report row number for rfree output
                self.rvrow_results  # rvapi report row number for results section
            ]

            if len(self.build_meta)>0:

                meta["metrics"] = [
                    {
                      "R_factor"    : self.build_meta[self.best_rfree_build_no]["refmac"]["rfactor"][1],
                      "R_free"      : self.build_meta[self.best_rfree_build_no]["refmac"]["rfree"][1],
                      "res_compl"   : self.build_meta[self.best_rfree_build_no]["cbuccaneer"]["res_complete"],
                      "chain_compl" : self.build_meta[self.best_rfree_build_no]["cbuccaneer"]["chain_complete"],
                      "EDCC"        : self.build_meta[self.best_rfree_build_no]["edstats"]["EDCC"]
                    },{
                      "R_factor"    : self.build_meta[self.best_edcc_build_no]["refmac"]["rfactor"][1],
                      "R_free"      : self.build_meta[self.best_edcc_build_no]["refmac"]["rfree"][1],
                      "res_compl"   : self.build_meta[self.best_edcc_build_no]["cbuccaneer"]["res_complete"],
                      "chain_compl" : self.build_meta[self.best_edcc_build_no]["cbuccaneer"]["chain_complete"],
                      "EDCC"        : self.build_meta[self.best_edcc_build_no]["edstats"]["EDCC"]
                    },{
                      "R_factor"    : self.build_meta[self.best_nbuilt_build_no]["refmac"]["rfactor"][1],
                      "R_free"      : self.build_meta[self.best_nbuilt_build_no]["refmac"]["rfree"][1],
                      "res_compl"   : self.build_meta[self.best_nbuilt_build_no]["cbuccaneer"]["res_complete"],
                      "chain_compl" : self.build_meta[self.best_nbuilt_build_no]["cbuccaneer"]["chain_complete"],
                      "EDCC"        : self.build_meta[self.best_nbuilt_build_no]["edstats"]["EDCC"]
                    },{
                      "R_factor"    : self.build_meta[self.best_nfrag_build_no]["refmac"]["rfactor"][1],
                      "R_free"      : self.build_meta[self.best_nfrag_build_no]["refmac"]["rfree"][1],
                      "res_compl"   : self.build_meta[self.best_nfrag_build_no]["cbuccaneer"]["res_complete"],
                      "chain_compl" : self.build_meta[self.best_nfrag_build_no]["cbuccaneer"]["chain_complete"],
                      "EDCC"        : self.build_meta[self.best_nfrag_build_no]["edstats"]["EDCC"]
                    }
                ]

            else:

                meta["metrics"] = [
                    {
                      "R_factor"   : 0.0,
                      "R_free"     : 0.0,
                      "res_complete" : 0.0
                    },{
                      "R_factor"   : 0.0,
                      "R_free"     : 0.0,
                      "res_complete" : 0.0
                    },{
                      "R_factor"   : 0.0,
                      "R_free"     : 0.0,
                      "res_complete" : 0.0
                    },{
                      "R_factor"   : 0.0,
                      "R_free"     : 0.0,
                      "res_complete" : 0.0
                    }
                ]

            meta["programs_used"] = citations.citation_list

            pyrvapi.rvapi_put_meta ( json.dumps(meta) )
            pyrvapi.rvapi_store_document2 ( self.rvapi_doc_path )

        return

    # ----------------------------------------------------------------------


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
                    lst = [_f for _f in self.keyword_list[i].split() if _f]
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

        self.output_name_rfree  = self.output_prefix_rfree  + self.input_data["nameout"] + "_rfree"
        self.output_name_edcc   = self.output_prefix_edcc   + self.input_data["nameout"] + "_edcc"
        self.output_name_nbuilt = self.output_prefix_nbuilt + self.input_data["nameout"] + "_nbuilt"
        self.output_name_nfrag  = self.output_prefix_nfrag  + self.input_data["nameout"] + "_nfrag"

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

        #if len(fpath_list)>2:
        #    pyrvapi.rvapi_append_to_data ( wId,fpath_list[2],"hkl:ccp4_map" )
        #if len(fpath_list)>3:
        #    pyrvapi.rvapi_append_to_data ( wId,fpath_list[3],"hkl:ccp4_dmap" )

        self.addCitations ( ['uglymol','ccp4mg','viewhkl'] )

        return


    def putWebCootButton ( self,xyzFilePath,mtzFilePath,legendFilePath,gridId,row,col ):
        
        if not self.wc_grid:
            
            self.wc_grid = gridId
            self.wc_row  = row
            self.wc_col  = col

            if self.project:
            
                webcoot_options = {
                    "project"      : self.project,
                    "id"           : self.jobId,
                    "no_data_msg"  : "<b>Waiting for first build...</b>",
                    # "no_data_msg"  : "",
                    "FWT"          : "FWT",
                    "PHWT"         : "PHWT", 
                    "FP"           : "FP",
                    "SigFP"        : "SIGFP",
                    "FreeR_flag"   : "FreeR_flag",
                    "DELFWT"       : "DELFWT",
                    "PHDELWT"      : "PHDELWT"
                }

                buttonId = self.getWidgetId ( "webcoot" )
                pyrvapi.rvapi_add_button ( buttonId,"View build in progress","{function}",
                            "window.parent.rvapi_wcviewer("  +\
                            str(self.jobId)          + ",'[" +\
                            str(self.jobId).zfill(4) +\
                            "] CCP4Build current structure','" +\
                            xyzFilePath              + "','"   +\
                            mtzFilePath              + "','"   +\
                            legendFilePath           +\
                            "','view-update',5000,"  +\
                            "'".join(json.dumps(webcoot_options).split('"')) +\
                            ")",
                            False,gridId, row,col,1,1 )
                
                self.addCitations ( ['webcoot'] )
        
        return

    def removeWebCootButton ( self ):
        if self.wc_grid:
            pyrvapi.rvapi_set_text ( " ",self.wc_grid,self.wc_row,self.wc_col,1,1 )
            self.wc_grid = ""
        return

    def writeWebCootLegend ( self,meta ):
        with (open(self.legend_html,"w")) as f:
            legend = []
            if "cbuccaneer" in meta:
                legend += ["N<sub>res</sub>=<i>" +\
                           str(meta["cbuccaneer"]["n_res_built"]) + "&nbsp;(" +\
                           str(meta["cbuccaneer"]["res_complete"]) + "%)</i>" ]
            if "refmac" in meta:
                legend += ["R/R<sub>free</sub>=<i>" +\
                           str(meta["refmac"]["rfactor"][1]) + "/" +\
                           str(meta["refmac"]["rfree"][1]) + "</i>"]
            msg = "<b>Build in progress, please wait ...</b>"
            if len(legend)>0:
                msg = ", ".join(legend)
                if "iteration" in meta:
                    msg = "Cycle&nbsp;<i>" + str(meta["iteration"]+1) + "</i>:&nbsp;" + msg
            f.write ( msg )

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

    def getLabels ( self,labin ):
        labels    = labin.replace("[","").replace("]","").split(",")
        labels[0] = labels[0].split("/")[-1]
        return labels


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

    def _log ( self,S,file_out ):
        if type(S) is list:
            for line in S:
                file_out.write ( line + "\n" )
        else:
            file_out.write ( S )
        return

    def log ( self,S ):
        self._log ( S,self.file_stdout )
        return

    def srvlog ( self,S ):
        if self.file_srvout:
            self._log ( S,self.file_srvout )
        return


    # ----------------------------------------------------------------------

    def mergeHKL ( self,meta_phases,meta_hkl,nameout,fpath_stdout=None,fpath_stderr=None ):
        #  Merges phases from meta_phases and reflection data from meta_hkl,
        #  and returns meta_phases object with updated MTZ file. Should be
        #  used in order to avoid feeding Refmac's output reflection columns
        #  as observation data for downstream tasks.

        hklout = nameout + ".cad.mtz"
        cmd    = [ "HKLIN1",meta_hkl   ["mtzpath"],
                   "HKLIN2",meta_phases["mtzpath"],
                   "HKLOUT",hklout ]

        labin_fo   = self.getLabels ( meta_hkl["labin_fo"] )
        labin_free = self.getLabel  ( meta_hkl["labin_free"],0 )

        self.open_script ( nameout + ".script" )
        self.write_script ([
            "LABIN  FILE 1 E1=" + labin_fo[0] + " E2=" + labin_fo[1] + " E3=" + labin_free
        ])
        labin2 = "E1=PHDELWT E2=DELFWT"
        cn     = 3
        if meta_phases["labin_phifom"]:
            labin_phifom = self.getLabels ( meta_phases["labin_phifom"] )
            labin2 += " E%d=%s E%d=%s" % (cn,labin_phifom[0],cn+1,labin_phifom[1])
            cn += 2
        if meta_phases["labin_fc"]:
            labin_fc = self.getLabels ( meta_phases["labin_fc"] )
            labin2  += " E%d=%s E%d=%s" % (cn,labin_fc[0],cn+1,labin_fc[1])
            cn += 2
        if meta_phases["labin_hl"]:
            labin_hl = self.getLabels ( meta_phases["labin_hl"] )
            labin2  += " E%d=%s E%d=%s E%d=%s E%d=%s" %\
                       (cn,labin_hl[0],cn+1,labin_hl[1],cn+2,labin_hl[2],cn+3,labin_hl[3])
        if labin2:
            self.write_script ([
                "LABIN  FILE 2 " + labin2
            ])
        self.close_script()

        self.runApp ( "cad",cmd,fpath_stdout=fpath_stdout,fpath_stderr=fpath_stderr )

        return dict ( meta_phases,
                      mtzpath    = hklout,
                      labin_fo   = meta_hkl["labin_fo"],
                      labin_free = meta_hkl["labin_free"]
                    )


    # ----------------------------------------------------------------------

    def flush ( self ):
        self.file_stdout.flush()
        self.file_stderr.flush()
        pyrvapi.rvapi_flush()
        return

    def unsetLogParser ( self ):
        if self.log_parser:
            self.flush()
            self.log_parser = None
        return

    def setGenericLogParser ( self,split_sections_bool,graphTables=False ):
        self.unsetLogParser()
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

    def setRefmacLogParser ( self,split_sections_bool,graphTables=False ):
        self.unsetLogParser()
        panel_id = self.getWidgetId ( "refmaclogparser" )
        self.putPanel ( panel_id )
        self.generic_parser_summary = {}
        #self.log_parser = refmac_parser.refmac_parser (
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

        self.srvlog ([
            "",
            "------------------------------------------------------------------",
            appName + " " + " ".join(cmd)
        ])
        if input_script:
            with open(input_script,'r') as sfile:
                self.srvlog ( sfile.read() )
        if self.file_srvout:
            self.file_srvout.flush()

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
