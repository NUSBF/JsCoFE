##!/usr/bin/python

#
# ============================================================================
#
#    09.04.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB-REDO EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pdbredo jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
# import uuid
import shutil
import json
import time
# import requests
import subprocess
from   zipfile import ZipFile

# from typing_extensions import Self

# import gemmi

#  application imports
from .               import basic
from pycofe.proc     import qualrep
from  pycofe.auto    import auto,auto_workflow

# ============================================================================
# Make PDB-REDO driver


class Pdbredo(basic.TaskDriver):

    # redefine name of input script file

    # def file_stdin_path(self):  return "pdbredo.script"

    pdbredoJobId = None
    token_id     = None
    token_secret = None

    row0         = 0
    resultDir    = "pdbredo_results"

    start_time   = time.time()

    # ------------------------------------------------------------------------

    def getElapsedTime(self):
        elapsed = time.time() - self.start_time
        hours   = elapsed//3600
        elapsed = elapsed - 3600*hours
        minutes = elapsed//60
        seconds = elapsed - 60*minutes
        return "{:0>2}h:{:0>2}m:{:0>2}s".format(int(hours),int(minutes),int(seconds))

    # ------------------------------------------------------------------------

    def getPDBREDOPageHTML ( self ):
        
        return '''<!DOCTYPE html SYSTEM "about:legacy-compat">
<html xmlns="http://www.w3.org/1999/xhtml" lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>PDB-REDO Result Page</title>
  <link href="js-lib/pdb-redo/bootstrap.min.css" 
        rel="stylesheet"
        integrity="sha384-GLhlTQ8iRABdZLl6O3oVMWSktQOp6b7In1Zl3/Jr59b6EGGoI1aFkw7cmDA6j6gD" 
        crossorigin="anonymous">
</head>
<body>
  <script>
    let data_url = window.location.href.split("/");
    data_url.pop();
    data_url = data_url.join("/");
    window.document.write ( 
      "<pdb-redo-result data-url='" + data_url + "'>" +
      "<!-- Placeholders to improve time to first paint -->" +
      "<h3>PDB-REDO results</h3>" +
      "<!-- Check for JavaScript -->" +
      "<p id='jsyes'>Loading ...</p>" +
      "<noscript>" +
      "Could not render the results. Check that JavaScript is enabled." +
      "</noscript>" +
      "</pdb-redo-result>"
    );
  </script>
  <script src="https://pdb-redo.eu/scripts/pdb-redo-result-loader.js" 
          type="text/javascript" 
          crossorigin="anonymous"></script>
  <script src="js-lib/pdb-redo/bootstrap.bundle.min.js"
          integrity="sha384-w76AqPfDkMBDXo30jS1Sgez6pr3x5MlQ1ZAGC+nuZB+EYdgRZgiwxhTBTkF7CXvN"
          crossorigin="anonymous"></script>
</body>
</html>'''


    # ------------------------------------------------------------------------

    def formStructure(
        self, xyzout, subfile, mtzout, libin, hkl, istruct, maplabels, copyfiles
    ):
        structure = self.registerStructure (
                        None,
                        xyzout,
                        subfile,
                        mtzout,
                        libPath    = libin,
                        leadKey    = 1,
                        map_labels = maplabels,
                        copy_files = copyfiles,
                        refiner    = "pdbredo",
                    )
        if structure:
            structure.copy_refkeys_parameters ( istruct )
            structure.copyAssociations(istruct)
            structure.addDataAssociation(hkl.dataId)
            structure.addDataAssociation(istruct.dataId)  # ???
            structure.setRefmacLabels(
                None if str(hkl.useHKLSet) in ["Fpm", "TI"] else hkl
            )
            if not subfile:
                mmcifout = self.getMMCIFOFName()
                if os.path.isfile(mmcifout):
                    structure.add_file(
                        mmcifout, self.outputDir(), "mmcif", copy_bool=False
                    )
                structure.copySubtype(istruct)
                structure.copyLigands(istruct)
            structure.addPhasesSubtype()
        return structure


    # ------------------------------------------------------------------------

    def run_pdbredo ( self,action,cmd ):

        result = ""

        python_exe = "ccp4-python"   
        if sys.platform.startswith("win"):
            python_exe = "ccp4-python.bat"

        pdbredo_py = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "..","apps","pdbredo","pdb-redo.py" ) )

        cmd1 = [python_exe,pdbredo_py,action] + cmd
        if self.pdbredoJobId:
               cmd1 += [ "--job-id",self.pdbredoJobId ]
        cmd1 += ["--token-id",self.token_id,"--token-secret",self.token_secret]

        self.stdoutln ( "... executing " + " ".join(cmd1) )

        fout = open ( "_pdb_redo.log","w" )
        p = subprocess.Popen ( cmd1,
                        shell=False,stdout=fout,
                        stderr=self.file_stderr )
        if sys.platform.startswith("win"):
            rc = p.wait()
        else:
            rc = os.wait4(p.pid,0)
        fout.close()
        if rc and rc[1]:
            result = "Error running pdb-redo\n" +\
                     "Return code: " + str(rc[1])
            self.stdoutln ( result )
            self.stderrln ( result )
        else:
            fout = open ( "_pdb_redo.log","r" )
            result = fout.read().strip()
            fout.close()
            if not result:
                result = "void"
            self.stdoutln ( "... returned: " + result )

        return result
    

    def do_submit ( self,cmd ):

        self.rvrow = self.row0
        self.putWaitMessageLF ( "submitting to PDB REDO server " )

        result = self.run_pdbredo ( "submit",cmd )

        if result.startswith("Job submitted with id"):
            self.pdbredoJobId = result.split()[-1]

        if not self.pdbredoJobId:
            self.rvrow = self.row0
            self.putMessage ( "<h3>Job submission errors</h3>" +\
                "Job submission to PDB-REDO server was not successful, server replied:<p>" +\
                "<b>" + result + "</b><p>Stop here."
            )
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "job submission to PDB-REDO failed"
            }
            return False
        
        self.flush()
        
        return True


    def do_wait ( self ):

        self.rvrow = self.row0
        gridId     = self.putWaitMessageLF ( "starting on PDB REDO server " )

        result     = "***"
        status     = "starting"
        status0    = status
        errcount   = 0

        while status in ["starting","queued","running","errors"] and (errcount<100):
            result = self.run_pdbredo ( "status",[] )
            if result.startswith("Job status is"):
                status   = result.split()[-1]
                errcount = 0
                if status!=status0:
                    self.rvrow = self.row0
                    gridId  = self.putWaitMessageLF ( status + " on PDB REDO server " )
                    status0 = status
            else:
                errcount += 1
                self.stdoutln ( " ... possible PDB-REDO server connection issues" )
                self.stderrln ( " ... possible PDB-REDO server connection issues" )
                status = "errors"
                if status!=status0:
                    self.rvrow = self.row0
                    gridId  = self.putWaitMessageLF ( "running on PDB REDO server, possible errors " )
                    status0 = status
            self.putMessage1 ( gridId,"&nbsp;&nbsp;(" + self.getElapsedTime() + ")",0,2 )
            self.flush()
            if status!="ended":
                time.sleep(120)

        if status!="ended":
            self.rvrow = self.row0
            self.putMessage ( "<h3>Job errors</h3>" +\
                "Job status checks suggested errors on PDB-REDO server side, server replied:<p>" +\
                "<b>" + result + "</b><p>Stop here."
            )
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "job errors on PDB-REDO server"
            }
            return False
        
        return True



    def do_fetch ( self ):

        self.run_pdbredo ( "fetch",[] )

        zipfname = "pdb-redo-result-" + self.pdbredoJobId + ".zip"

        if not os.path.isfile(zipfname):
            self.putMessage ( "<h3>No results obtained from PDB-REDO server</h3>" +\
                "The PDB-REDO server has not returned any results. Stop here."
            )
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "no results obtained from PDB-REDO server"
            }
            return False

        with ZipFile(zipfname,"r") as zipObj:
            # Extract all the contents of zip file in different directory
            zipObj.extractall ( "./" )
            self.stdoutln ( " ... results unzipped" )

        unzipfname = self.pdbredoJobId.zfill(10)
        if not os.path.isdir(unzipfname):
            self.putMessage ( "<h3>Corrupt result data from PDB-REDO</h3>" +\
                "The PDB-REDO server returned seemingly corrupt results. Stop here."
            )
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "corrupt data from PDB-REDO server"
            }
            return False
        
        os.rename ( unzipfname,self.resultDir )
        os.remove ( zipfname )

        return True


    def run(self):

        if not self.have_internet():
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "no internet connection"
            }
            self.fail ( "<h3>No internet connection.</h3>" +\
                    "This task requires access to PDB REDO server, which is not " +\
                    "possible due to missing internet connection.",
                    "No internet connection" )
            return

        # Just in case (of repeated run) remove the output xyz file.
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare input
        # fetch input data
        revision = self.makeClass(self.input_data.data.revision[0])
        hkl      = self.makeClass(self.input_data.data.hkl[0])
        seq      = self.input_data.data.seq
        istruct  = self.makeClass(self.input_data.data.istruct[0])

        xyzin = istruct.getPDBFilePath(self.inputDir())
        hklin = hkl.getHKLFilePath(self.inputDir())
        libin = istruct.getLibFilePath(self.inputDir())

        pdbredo_seq = None
        if len(seq)>0:
            pdbredo_seq = "__pdbredo.seq"
            with open(pdbredo_seq,'w') as newf:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );
            with open(pdbredo_seq,'r') as newf:
                self.stdoutln ( "... composing sequence file " + pdbredo_seq +\
                                ":\n\n" + newf.read() )

        auth_fpath = os.path.join ( self.inputDir(),"authorisation.json" )
        if not os.path.isfile(auth_fpath):
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "no authorisation data"
            }
            self.fail ( "<h3>No authorisation data.</h3>" +\
                "This task requires authorisation with PDB-REDO software provider, " +\
                "which was not found. Check CCP4 Cloud configuration.",
                "No authorisation data." )
            return
        
        try:
            with open(auth_fpath) as f:
                auth_meta = json.loads ( f.read() )
                if auth_meta["status"]=="ok":
                    self.token_id     = str(auth_meta["auth_data"]["user_id"])
                    self.token_secret = str(auth_meta["auth_data"]["user_token"])
                elif auth_meta["status"]=="expired":
                    # self.putMessage ( "<h2>PDB-REDO authorisation expired</h2>" +\
                    #     "Please authorise with PDB-REDO service in \"My Account\"." )
                    self.generic_parser_summary["pdbredo"] = {
                        "summary_line" : "authorisation expired"
                    }
                    self.fail ( "<h3>Authorisation expired.</h3>" +\
                        "This task requires authorisation with PDB-REDO software provider, " +\
                        "which has expired. Please authorise with PDB-REDO service in \"My Account\".",
                        "Authorisation expired." )
                    return
                else:
                    self.generic_parser_summary["pdbredo"] = {
                        "summary_line" : "no authorisation data"
                    }
                    self.fail ( "<h3>Authorisation data not passed.</h3>" +\
                        "This task requires authorisation with PDB-REDO software provider, " +\
                        "which data was not passed to the task. Reported status: " + auth_meta["status"],
                        "No authorisation data." )
                    return
        except:
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "corrupt authorisation data"
            }
            self.fail ( "<h3>Corrupt authorisation data.</h3>" +\
                "This task requires authorisation with PDB-REDO software provider, " +\
                "which is corrupt. Check CCP4 Cloud configuration.",
                "Corrupt authorisation data." )
            return
        
        if not self.token_id or not self.token_secret:
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : "no authorisation acquired"
            }
            self.fail ( "<h3>No authorisation data.</h3>" +\
                "This task requires authorisation with PDB-REDO software provider, " +\
                "which was not acquired. Please authorise with PDB-REDO in your " +\
                "CCP4 Cloud account settings.",
                "No authorisation data." )
            return
  
        self.stdoutln ( "... submitting to PDB-REDO using id " + str(self.token_id) +\
                        " and secret " + str(self.token_secret) )

        self.row0 = self.rvrow

        # submit job to PDB-REDO

        cmd = [ "--xyzin",xyzin, "--hklin",hklin ]
        if libin:
            cmd += [ "--restraints",libin ]
        if pdbredo_seq:
            cmd += [ "--sequence",pdbredo_seq ]

        #  add other keyword-parameter pairs here from task's Input tab

        if not self.do_submit(cmd):
            self.success ( False )
            return

        if not self.do_wait():
            self.success ( False )
            return

        if not self.do_fetch():
            self.success ( False )
            return


        # form PDBREDO html report page and load it in 'PDBREDO Report' tab

        with open(os.path.join(self.resultDir,"PDBREDO_report.html"),"w") as f:
            f.write ( self.getPDBREDOPageHTML() )

        reportTabId = self.getWidgetId ( "pdbredo_report" )
        self.insertTab ( reportTabId,"PDB-REDO Report",None,False )

        self.putMessage1(
            reportTabId,
            '<iframe src="../'
            + self.resultDir
            + '/PDBREDO_report.html" '
            + 'style="border:none;position:absolute;top:50px;left:0;width:100%;height:90%;"></iframe>',
            0,
        )
        # self.flush()

        # load PDBREDO log in 'PDBREDO log' tab

        self.insertTab ( self.getWidgetId("pdbredo_log"),"PDB-REDO Log",
                         "../" + self.resultDir + "/process.log", False )
        
        # form output structure and revision

        final_pdb  = None
        final_mtz  = None
        refmac_log = None
        refmac_kwd = None
        # final_lig = None

        files = os.listdir ( self.resultDir )
        for fname in files:
            for fname in files:
                if fname.endswith("_final.pdb"):
                    final_pdb = os.path.join(self.resultDir,fname)
                elif fname.endswith("_final.mtz"):
                    final_mtz = os.path.join(self.resultDir,fname)
                elif fname.endswith("_final.log"):
                    refmac_log = os.path.join(self.resultDir,fname)
                elif fname.endswith(".refmac") or fname.endswith(".rest"):
                    refmac_kwd = os.path.join(self.resultDir,fname)

        xyzout = self.getXYZOFName()
        mtzout = self.getMTZOFName()
        shutil.copyfile ( final_pdb,xyzout )
        shutil.copyfile ( final_mtz,mtzout )

        self.stdoutln(" final_pdb = " + str(xyzout))
        self.stdoutln(" final_mtz = " + str(mtzout))

        self.rvrow = self.row0
        self.putMessage("")
        self.rvrow = self.row0

        if refmac_log:
            panel_id = self.getWidgetId ( "refmac_report" )
            self.setRefmacLogParser ( panel_id,False,graphTables=False,makePanel=True )
            file_refmaclog = open ( refmac_log,"r" )
            self.log_parser.parse_stream ( file_refmaclog )
            file_refmaclog.close()

        self.addCitations ( ['pdbredo'] )

        # check solution and register data
        have_results = False
        summary_line = "no output generated"
        if xyzout:
            # if os.path.isfile(final_pdb):

            # verdict_row = self.rvrow

            self.rvrow += 5

            self.putTitle(
                "Output Structure"
                + self.hotHelpLink("Structure", "jscofe_qna.structure")
            )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.formStructure(
                xyzout,
                None,
                mtzout,
                libin,
                hkl,
                istruct,
                "FWT,PHWT,DELFWT,PHDELWT",
                True,
            )

            if structure:

                refmac_keywords = None
                try:
                    with open(refmac_kwd,"r") as f:
                        refmac_keywords = f.read().splitlines()
                except:
                    self.stdoutln ( "\n ****** refmac parameters not found at " +\
                                    refmac_kwd + "\n " )
                if refmac_keywords:
                    structure.store_refkeys_parameters ( "TaskRefmac",self.task.id,
                                                         refmac_keywords )

                self.putStructureWidget(
                    "structure_btn", "Structure and electron density", structure
                )

                # update structure revision
                revision.setStructureData(structure)
                self.registerRevision(revision)
                have_results = True
                
                # rfactor = 1.0
                # rfree   = 1.0
                # with open(refmac_log,"r") as f:
                #     lines = f.readlines()
                #     for line in lines:
                #         if line.startswith("    :"):
                #             rfactor = line.split(":")[1].strip()
                #         elif line.startswith("Resulting R-free  :"):
                #             rfree   = line.split(":")[1].strip()

                # self.generic_parser_summary["refmac"] = {
                #     "R_factor"   : rfactor,
                #     "R_free"     : rfree
                # }

                summary_line = ""

                rvrow0 = self.rvrow
                # meta = qualrep.quality_report ( self,revision )
                try:
                    # meta = qualrep.quality_report ( self,revision, refmacXML = xmlOutRefmac )
                    meta = qualrep.quality_report(self, revision)
                    self.stdoutln ( str(meta) )
                    if "molp_score" in meta:
                        self.generic_parser_summary["refmac"]["molp_score"] = meta["molp_score"]

                except:
                    meta = None
                    self.stderr(" *** validation tools or molprobity failure")
                    self.rvrow = rvrow0 + 4

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision" : [revision]
                            },
                            "scores" :  {
                                "Rfactor"  : float(self.generic_parser_summary["refmac"]["R_factor"]),
                                "Rfree"    : float(self.generic_parser_summary["refmac"]["R_free"])
                            }
                    })
                    # self.putMessage ( "<h3>Workflow started</hr>" )

                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                        "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                    }, log=self.file_stderr)

                # if meta:
                #     verdict_meta = {
                #         "data": {"resolution": hkl.getHighResolution(raw=True)},
                #         "params": {},
                #         "molprobity": meta,
                #         "xyzmeta": structure.xyzmeta,
                #     }
                #     suggestedParameters = verdict_refmac.putVerdictWidget(
                #         self, verdict_meta, verdict_row
                #     )

        else:
            self.putTitle ( "No Output Generated" )

        # shutil.rmtree(self.resultDir)
        # os.remove("result.zip")

        if summary_line:
            self.generic_parser_summary["pdbredo"] = {
                "summary_line" : summary_line
            }

        # close execution logs and quit
        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Pdbredo("", os.path.basename(__file__))
    drv.start()
