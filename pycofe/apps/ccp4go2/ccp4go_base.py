#!/usr/bin/env ccp4-python

#
# ============================================================================
#
#    02.02.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go v2.0 Auto-Solver Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2021
#
# ============================================================================
#

import os
import sys
import json
import shutil
import re, copy
from collections import namedtuple
try:
    import http.client
except:
    import http.client as httplib

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers

import command
try:
    from pycofe.etc import citations
except:
    import citations

import gemmi


# ============================================================================

class Base(object):
    def tree_id         (self): return "workflow_tree_id"
    def file_stdout_path(self): return "_stdout.log" # reserved name
    def file_stderr_path(self): return "_stderr.log"
    def datared_dir(self)     : return os.path.join(self.currentData.startingParameters.workdir, "datared")

    # ----------------------------------------------------------------------
    def __init__(self, currentData=None):

        self.currentData = currentData
        self.rvapiManager = None

        self.stage_no = 0  # stage number for headers
        self.summaryTabId = "ccp4go_summary_page"  # summary tab Id
        # strow          = 0          # summary tab output row number
        self.navTreeId = "ccp4go_navigation_tree"  # navigation tree Id

        self.output_meta = {}  # output meta json file written in current directory on
        # termination

        self.stdout_path = None
        self.stderr_path = None
        self.file_stdout = sys.stdout
        self.file_stderr = sys.stderr

        self.script_path = ""
        self.script_file = None

        self.page_cursor = ["", 0]

        self.log_parser = None
        self.log_parser_cnt = 0  # for generating parser's panel ids
        self.generic_parser_summary = {}

        self.rvapi_version = [1, 0, 15]  # for tree layout, put [1,0,15]
        self.layout = 4  # tabbed layout (for debugging)

        # old retcodes - all of them:
        # "[01-001] unknown command line parameter"
        # "[01-003] unrecognised input line"
        # "[02-001] hkl file not given"
        # "[02-002] hkl file not found"
        # "[02-003] hkl file empty"
        # "[02-004] pointless failure"
        # "[02-005] aimless failure"
        # "[02-006] failed to add free R-flag to merged hkl"
        # "[02-007] failed to truncate hkl"
        # "[02-008] truncated hkl file empty"
        # "[03-001] sequence file not found"
        # "[03-002] Error in ASU calculations: "
        # "sequence problem":
        # "sequence mismatch":
        # "solved":
        # "candidate"
        # "not solved"
        # "errors"

        self.output_meta["retcode"]    = "" # shall be 'solved', 'candidate', 'not solved'
        self.output_meta["error"] = "" # all errors go to this error message.
        # If no retcode and no error means run okay for the step that does not result in structure solution (e.g. data reduction).
        self.output_meta["report_row"] = 0
        self.output_meta["results"]    = {}
        self.output_meta["resorder"]   = []

        self.file_stdout = sys.stdout
        self.file_stderr = sys.stderr

        self.previousDirectory = ''
        self.startingDirectory = os.getcwd()
        os.chdir(self.currentData.startingParameters.workdir)

        return

    # ----------------------------------------------------------------------

    def getResultsWithMinimalRfree(self):
        resultToReturn = {'rfree' : 1.0}
        resultDirectory = ''

        for result in self.output_meta['results'].keys():
            if 'rfree' in self.output_meta['results'][result]:
                if self.output_meta['results'][result]['rfree'] < resultToReturn['rfree']:
                    resultToReturn = copy.deepcopy(self.output_meta['results'][result])
                    resultDirectory = result

        return (resultDirectory, resultToReturn)


    def initRVAPI(self):
        if self.currentData.startingParameters is not None:
            self.layout = 4
            if self.compare_rvapi_version([1, 0, 15]) <= 0:
                self.layout = 0

            self.page_cursor = [self.summaryTabId, 0]
            if not self.currentData.startingParameters.rvapi_doc_path:  # initialise rvapi report document

                report_type = 1  # report with tabs
                if not self.currentData.startingParameters.rvapi_prefix or not self.currentData.startingParameters.reportdir:
                    report_type = 0x00100000  # report will not be created

                rdir = self.currentData.startingParameters.reportdir
                if not rdir:
                    rdir = "report"
                rdir = os.path.join(self.currentData.startingParameters.workdir, rdir)  # has to be full path because of Crank-2
                self.currentData.startingParameters.reportdir = rdir

                if not os.path.isdir(rdir):
                    os.mkdir(rdir)

                # initialise HTML report document; note that we use absolute path for
                # the report directory, which is necessary for passing RVAPI document
                # to applications via creation of the rvapi_document file with
                # pyrvapi.rvapi_store_document2(..)

                pyrvapi.rvapi_init_document(
                    "jscofe_report",  # document Id
                    rdir,  # report directory
                    "Title",  # title (immaterial)
                    report_type,  # HTML report to be produced
                    self.layout,  # Report will start with plain page
                    self.currentData.startingParameters.rvapi_prefix,  # where to look for js support
                    None, None,
                    "task.tsk",
                    "i2.xml")

                if self.layout == 0:
                    # Add tree widget
                    pyrvapi.rvapi_add_tree_widget(
                        self.navTreeId,  # tree widget reference (Id)
                        "Workflow",  # tree widget title
                        "body",  # reference to widget holder (grid)
                        0,  # holder row
                        0,  # holder column
                        1,  # row span
                        1  # column span
                    )
                    pyrvapi.rvapi_set_tab_proxy(self.navTreeId, "")

                self.page_cursor = self.addTab(self.summaryTabId, "Summary", True)
                self.putMessage("<h2>CCP4go (Combined Automated Structure Solution)</h2>")

            else:  # continue rvapi document given
                pyrvapi.rvapi_restore_document2(self.currentData.startingParameters.rvapi_doc_path)
                meta = pyrvapi.rvapi_get_meta()
                # self.stdout ( "\n META = " + meta )
                if meta:
                    d = json.loads(meta)
                    if "jobId" in d:  self.jobId = d["jobId"]
                    if "stageNo" in d:  self.stage_no = d["stageNo"]
                    if "sge_q" in d:  self.SGE = True
                    if "sge_tc" in d:  self.nSubJobs = d["sge_tc"]
                    if "summaryTabId" in d:
                        self.summaryTabId = d["summaryTabId"]
                        self.page_cursor[0] = self.summaryTabId
                    if "summaryTabRow" in d:
                        self.summaryTabRow = d["summaryTabRow"]
                        self.page_cursor[1] = self.summaryTabRow
                    if "navTreeId" in d:
                        self.navTreeId = d["navTreeId"]
                        pyrvapi.rvapi_set_tab_proxy(self.navTreeId, "")
                    if "outputDir" in d:  self.outputdir = d["outputDir"]
                    if "outputName" in d:  self.outputname = d["outputName"]

        return

    def cleanhtml(self, raw_html):
        cleanr = re.compile('<.*?>')
        cleantext = re.sub(cleanr, '', raw_html)
        return cleantext

    def mk_std_streams (self, subdir_name, mode="w"):

        if not self.file_stdout is sys.stdout:
            self.file_stdout.close()
        if not self.file_stderr is sys.stderr:
            self.file_stderr.close()

        if subdir_name:
            self.stdout_path = os.path.join ( subdir_name,self.file_stdout_path() )
            self.stderr_path = os.path.join ( subdir_name,self.file_stderr_path() )
            self.file_stdout = open ( self.stdout_path,mode )
            self.file_stderr = open ( self.stderr_path,mode )
        else:
            self.file_stdout = sys.stdout
            self.file_stderr = sys.stderr
            self.stdout_path = None
            self.stderr_path = None
        return


    def stdout (self, message, mainLog = False):
        self.file_stdout.write(message)
        if mainLog:
            if self.file_stdout != sys.stdout:
                sys.stdout.write(message)
        return


    def stderr (self,message, mainLog = False):
        self.file_stderr.write (message)
        if mainLog:
            if self.file_stderr != sys.stderr:
                sys.stderr.write(message)
        return

    # ----------------------------------------------------------------------

    def compare_rvapi_version ( self,v ):
        if   v[0]<self.rvapi_version[0]:  return -1
        elif v[0]>self.rvapi_version[0]:  return  1
        elif v[1]<self.rvapi_version[1]:  return -1
        elif v[1]>self.rvapi_version[1]:  return  1
        elif v[2]<self.rvapi_version[2]:  return -1
        elif v[2]>self.rvapi_version[2]:  return  1
        else:
            return 0

    # ----------------------------------------------------------------------

    def start_branch ( self,branch_title,page_title,subdir,branch_id,
                            headTabId=None ):

        tree_header_id = headTabId
        if not headTabId:
            tree_header_id = subdir + "_header_id"
        logtab_id      = subdir + "_logtab_id"
        errtab_id      = subdir + "_errtab_id"

        # make work directory
        sdir = os.path.join ( self.currentData.startingParameters.workdir, subdir )
        if not os.path.isdir(sdir):
            os.mkdir ( sdir )
        sodir = os.path.join ( self.currentData.startingParameters.workdir,self.currentData.startingParameters.outputdir,subdir )
        if not os.path.isdir(sodir):
            os.mkdir ( sodir )

        self.previousDirectory = os.getcwd()
        os.chdir(sdir)

        self.mk_std_streams ( sodir )

        self.stage_no += 1
        if self.layout == 0:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,branch_id )

        # cursor0 remembers point of output in parent page
        cursor0 = self.addTab ( tree_header_id,
                                str(self.stage_no) + ". " + branch_title,False )
        if page_title:
            if self.currentData.startingParameters.jobId:
                title = "["+self.currentData.startingParameters.jobId.zfill(4)+"] " + page_title
            else:
                title = str(self.stage_no) + ". " + page_title
            self.putMessage ( "<h2>" + title + "</h2>" )
            #self.putMessage ( "<h3>" + title + ": <i>in progress</i></h3>" )

        if self.layout == 0:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,tree_header_id )

        # cursor1 is set to the begining of new tab page
        cursor1 = self.addTab ( logtab_id,"Log file",True )
        self.addTab ( errtab_id,"Errors",True )
        pyrvapi.rvapi_append_content (
            "/".join(["..",subdir,self.file_stdout_path()+"?capsize"]),
            True,logtab_id )
        pyrvapi.rvapi_append_content (
            "/".join(["..",subdir,self.file_stderr_path()]),
            True,errtab_id )

        # back to the beginning of head tab
        self.setOutputPage ( cursor1 )

        return { "title"    : title,     "pageId"  : tree_header_id,
                 "logTabId" : logtab_id, "cursor0" : cursor0,
                 "cursor1"  : cursor1 }


    def quit_branch ( self,branch_data,dirname,message=None ):
        if branch_data:
            self.setOutputPage ( branch_data["cursor0"] )
            if message:
                title = "<b>" + str(self.stage_no) + ". " + message + "</b>"
                self.putMessageLF ( "<br>" + title )
                self.output_meta["results"][dirname]["title"] = title
            if dirname in self.output_meta["results"]:
                self.output_meta["results"][dirname]["row"] = self.page_cursor[1]
                self.output_meta["results"][dirname]["stage_no"] = self.stage_no
            self.page_cursor[1] += 1  # leave one row for setting widgets in main thread
        self.mk_std_streams ( None )
        if self.layout == 0:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,"" )
        pyrvapi.rvapi_flush()

        os.chdir(self.previousDirectory)

        self.output_meta["resorder"] += [dirname]
        self.write_meta()
        return


    def end_branch ( self,branch_data,dirname,message,detail_message=None ):
        if branch_data:
            if not (dirname in self.output_meta["results"].keys()):
                self.output_meta["results"][dirname] = {}
            self.setOutputPage ( branch_data["cursor1"] )
            self.putMessage ( "<h3>" + message + "<h3>" )
            self.output_meta["results"][dirname]["title"] = "<b>" + message + "</b>"
            if detail_message:
                self.putMessage ( "<i>" + detail_message + "</i>" )
            self.setOutputPage ( branch_data["cursor0"] )
            self.putMessageLF ( "<i>" + message + "</i>" )
            if detail_message:
                self.putMessage ( "<i>" + detail_message + "</i>" )
            self.page_cursor[1] +=1  # leave one row for setting widgets in main thread
            if dirname in self.output_meta["results"]:
                self.output_meta["results"][dirname]["row"] = self.page_cursor[1]
                self.output_meta["results"][dirname]["stage_no"] = self.stage_no
        self.mk_std_streams ( None )
        if self.layout == 0:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,"" )

        os.chdir(self.previousDirectory)

        self.output_meta["resorder"] += [dirname]
        self.write_meta()
        return


    # ----------------------------------------------------------------------

    def addCitation ( self,appName ):
        citations.addCitation ( appName )
        return


    def addCitations ( self,appName_list ):
        citations.addCitations ( appName_list )
        return


    def write_meta ( self ):
        self.output_meta["report_row"] = self.page_cursor[1]
        self.output_meta["programs_used"] = citations.citation_list
        meta = json.dumps ( self.output_meta,indent=2 )
        with open(os.path.join(self.currentData.startingParameters.workdir,"ccp4go.meta.json"),"w") as f:
            f.write ( meta )
        if self.currentData.startingParameters.rvapi_doc_path:
            pyrvapi.rvapi_put_meta ( meta )
            pyrvapi.rvapi_store_document2 ( self.currentData.startingParameters.rvapi_doc_path )
        return


    # ----------------------------------------------------------------------

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

    # ----------------------------------------------------------------------

    def setOutputPage ( self,cursor ):
        cursor1 = [self.page_cursor[0],self.page_cursor[1]]
        if cursor:
            self.page_cursor[0] = cursor[0]
            self.page_cursor[1] = cursor[1]
        return cursor1


    def addTab ( self,tabId,tabName,opened ):
        pyrvapi.rvapi_add_tab  ( tabId,tabName,opened )
        return self.setOutputPage ( [tabId,0] )


    def insertTab ( self,tabId,tabName,beforeTabId,opened ):
        pyrvapi.rvapi_insert_tab ( tabId,tabName,beforeTabId,opened )
        return self.setOutputPage ( [tabId,0] )


    def putMessage ( self,message_str ):
        pyrvapi.rvapi_set_text ( message_str,self.page_cursor[0],
                                 self.page_cursor[1],0,1,1 )
        self.page_cursor[1] += 1
        return


    def putMessageLF ( self,message_str ):
        pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>" + message_str +
                        "</font>",self.page_cursor[0],self.page_cursor[1],0,1,1 )
        self.page_cursor[1] += 1
        return


    def putPanel ( self,panel_id ):
        pyrvapi.rvapi_add_panel ( panel_id,self.page_cursor[0],
                                  self.page_cursor[1],0,1,1 )
        self.page_cursor[1] += 1
        return


    def putSection ( self,sec_id,sectionName,openState_bool=False ):
        pyrvapi.rvapi_add_section ( sec_id,sectionName,self.page_cursor[0],
                                    self.page_cursor[1],0,1,1,openState_bool )
        self.page_cursor[1] += 1
        return


    def putWaitMessageLF ( self,message_str,foregap=1 ):
        gridId = self.page_cursor[0] + str(self.page_cursor[1])
        pyrvapi.rvapi_add_grid ( gridId,False,self.page_cursor[0],
                                              self.page_cursor[1],0,1,1 )
        for i in range(foregap):
            pyrvapi.rvapi_set_text ( "&nbsp;",gridId,i,0,1,1 )
        pyrvapi.rvapi_set_text ( "<font style='font-size:120%;'>" + message_str +
                                 "</font>",gridId,foregap,0,1,1 )
        pyrvapi.rvapi_set_text ( "<div class='activity_bar'/>",gridId,foregap,1,1,1 )
        self.page_cursor[1] += 1
        return


    def flush(self):
        pyrvapi.rvapi_flush()
        sys.stdout.flush()
        return


    # ----------------------------------------------------------------------

    def putStructureWidget ( self,title_str,fpath_list,openState ):

        wId = self.page_cursor[0] + "_" + "structure" + str(self.page_cursor[1])
        pyrvapi.rvapi_add_data ( wId,title_str,fpath_list[0],
                "xyz",self.page_cursor[0],self.page_cursor[1],0,1,1,openState )
        if len(fpath_list)>1:
            pyrvapi.rvapi_append_to_data ( wId,fpath_list[1],"hkl:map" )

        #if len(fpath_list)>2:
        #    pyrvapi.rvapi_append_to_data ( wId,fpath_list[2],"hkl:ccp4_map" )
        #if len(fpath_list)>3:
        #    pyrvapi.rvapi_append_to_data ( wId,fpath_list[3],"hkl:ccp4_dmap" )

        self.page_cursor[1] +=1
        self.addCitations ( ['uglymol','ccp4mg','viewhkl'] )
        return


    # ----------------------------------------------------------------------

    def open_script ( self,scriptname ):
        self.script_path = os.path.join ( self.currentData.startingParameters.scriptsdir,scriptname+".script" )
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

    def unsetLogParser ( self ):
        self.file_stdout.flush()
        self.log_parser = None
        pyrvapi.rvapi_flush()
        return


    def setGenericLogParser ( self,split_sections_bool,graphTables=False ):
        self.log_parser_cnt += 1
        panel_id = "genlogparser_" + str(self.log_parser_cnt)
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

    def storeReportDocument(self, dir,  meta_str):
        if not self.currentData.startingParameters.rvapi_doc_path:
            self.currentData.startingParameters.rvapi_doc_path = os.path.join(self.currentData.startingParameters.workdir, "rvapi_document")
        if meta_str:
            pyrvapi.rvapi_put_meta ( meta_str )
        pyrvapi.rvapi_store_document2 ( self.currentData.startingParameters.rvapi_doc_path )
        return


    def restoreReportDocument(self):
        #if not os.path.isfile(self.currentData.startingParameters.rvapi_doc_path):
        #    print " *** NO PATH TO RVAPI DOCUMENT"
        pyrvapi.rvapi_restore_document2 ( self.currentData.startingParameters.rvapi_doc_path )
        return pyrvapi.rvapi_get_meta()


    # ----------------------------------------------------------------------

    def runApp ( self,appName,cmd,fpath_stdout=None,fpath_stderr=None ):

        input_script = None
        if self.script_file:
            input_script = self.script_path

        fstdout = self.file_stdout
        fstderr = self.file_stderr

        if fpath_stdout:
            fstdout = open ( fpath_stdout,'w' )
        if fpath_stderr:
            fstderr = open ( fpath_stderr,'w' )

        rc = command.call ( appName,cmd,self.currentData.startingParameters.workdir,input_script,
                            fstdout,fstderr,self.log_parser )
        #os.chdir ( self.currentData.startingParameters.workdir )
        self.script_file = None

        if fpath_stdout:
            fstdout.close()
        if fpath_stderr:
            fstderr.close()

        return rc

    # ----------------------------------------------------------------------

    def saveResults ( self, name = '',
                      dirname = '',
                      nResults = 0,
                      rfree = 1.0,
                      rfactor = 1.0,
                      resfname = '',
                      fpath_xyz = '',
                      fpath_mtz = '',
                      fpath_map = '',
                      fpath_dmap = '',
                      fpath_lib = '',
                      libIndex = '',
                      columns = '',
                      spg_info = None):

        meta = {}
        meta["name"]     = name
        meta["rfree"]    = rfree
        meta["rfactor"]  = rfactor
        meta["nResults"] = nResults
        quit_message     = ""

        if nResults>0:
            # store results in dedicated subdirectory of "output" directory
            resdir = os.path.join ( self.currentData.startingParameters.outputdir,dirname )
            if not os.path.isdir(resdir):
                os.mkdir ( resdir )

            # make new file names in dedicated result directory
            f_xyz  = os.path.join ( resdir, resfname + ".pdb" )
            f_mtz  = os.path.join ( resdir, resfname + ".mtz" )
            #f_map  = os.path.join ( resdir, resfname + ".map" )
            #f_dmap = os.path.join ( resdir, resfname + "_dmap.map" )
            f_lib  = os.path.join ( resdir, resfname + ".lib" )

            #self.stdout ( fpath_xyz + "  :  " + f_xyz + "\n" )
            #self.stdout ( fpath_mtz + "  :  " + f_mtz + "\n" )
            #self.stdout ( fpath_map + "  :  " + f_map + "\n" )
            #self.stdout ( fpath_dmap + "  :  " + f_dmap + "\n" )

            # copy result files with new names
            if fpath_xyz!=f_xyz:
                shutil.copy2 ( fpath_xyz ,f_xyz  )
                shutil.copy2 ( fpath_mtz ,f_mtz  )
                #shutil.copy2 ( fpath_map ,f_map  )
                #shutil.copy2 ( fpath_dmap,f_dmap )
                if fpath_lib:
                    shutil.copy2 ( fpath_lib,f_lib )

            # store new file names in meta structure
            meta["pdb"]  = f_xyz
            meta["mtz"]  = f_mtz
            #meta["map"]  = f_map
            #meta["dmap"] = f_dmap
            if fpath_lib:
                meta["lib"] = f_lib
            if libIndex:
                meta["libindex"] = libIndex

            # calculate return code and quit message
            metrics = " (<i>R<sub>free</sub>=" + str(rfree)
            if spg_info["hkl"]:
                metrics += ", SpG=" + spg_info["spg"]
            metrics += "</i>)"
            if rfree < 0.4:
                self.output_meta["retcode"] = "solved"     # solution
                quit_message = "solution found" + metrics
            elif rfree < 0.45:
                self.output_meta["retcode"] = "candidate"  # possible solution
                quit_message = "possible solution found" + metrics
            else:
                self.output_meta["retcode"] = "not solved" # no solution
                quit_message = "no solution found" + metrics

        elif nResults==0:
            self.output_meta["retcode"] = "not solved" # no solution
            quit_message = "no solution found"

        else:
            if not self.output_meta["error"]:
                self.output_meta["error"] = "errors encountered in " + name
            quit_message = "errors encountered"

        # put columns in meta
        meta["columns"] = columns

        # put space group info in meta
        #if spg_info["changed"]:
        meta["spg"] = spg_info["spg"]  # resulting space group
        #if spg_info["hkl"]:
        meta["hkl"] = spg_info["hkl"]  # reindexed hkl if space group changed

        self.output_meta["results"][dirname] = meta

        return quit_message

    # ----------------------------------------------------------------------


    def reindexHKLifSpaceGroupChanged (self, hkl_spg, fpath_xyz):

        spg      = gemmi.read_structure(str(fpath_xyz)).spacegroup_hm
        spg_key  = spg.replace(" ","")
        spg_info = { "spg" : spg, "hkl" : "" }

        if spg_key != hkl_spg.replace(" ",""):
            self.stdout ( " space group changed to " + spg + ", reindexing... ", mainLog=True)
            if not spg_key in self.currentData.altSG:
                # reindex first time
                self.open_script  ( "reindex_" + spg_key )
                self.write_script ( "SYMM \"" + spg + "\"\n" )
                self.close_script ()
                # new hkl file path
                hklout = os.path.join ( self.datared_dir(),spg_key+".mtz" )
                cmd = [ "hklin" ,self.currentData.mtzpath,
                        "hklout",hklout ]
                # run reindex
                self.runApp ( "reindex",cmd )
                if os.path.isfile(hklout):
                    spg_info["hkl"]       = hklout
                    self.currentData.altSG[spg_key] = hklout
                else:
                    self.stdout ( " cannot reindex\n", mainLog=True )
                    self.stdout ( " cannot reindex\n", mainLog=True )
            else:
                spg_info["hkl"] = self.currentData.altSG[spg_key]

        return spg_info
