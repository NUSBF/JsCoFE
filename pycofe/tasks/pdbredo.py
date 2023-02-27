##!/usr/bin/python

#
# ============================================================================
#
#    08.01.23   <--  Date of Last Modification.
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
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022-2023
#
# ============================================================================
#

#  python native imports
import os
import sys
# import uuid
# import shutil
import json
import time
# import requests
import subprocess
from   zipfile import ZipFile

# from typing_extensions import Self

# import gemmi

#  application imports
from .               import basic
# from pycofe.dtypes   import dtype_template
from pycofe.proc     import qualrep
# from pycofe.proc     import PDBRedoAPIAuth
# from pycofe.verdicts import verdict_refmac

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

    def getElapsedTime(self):
        elapsed = time.time() - self.start_time
        hours   = elapsed//3600
        elapsed = elapsed - 3600*hours
        minutes = elapsed//60
        seconds = elapsed - 60*minutes
        return "{:0>2}h:{:0>2}m:{:0>2}s".format(int(hours),int(minutes),int(seconds))

    # ------------------------------------------------------------------------

    def formStructure(
        self, xyzout, subfile, mtzout, libin, hkl, istruct, maplabels, copyfiles
    ):
        structure = self.registerStructure(
            xyzout,
            subfile,
            mtzout,
            None,
            None,
            libin,
            leadKey=1,
            map_labels=maplabels,
            copy_files=copyfiles,
            refiner="pdbredo",
        )
        if structure:
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

        pdbredo_path = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "..","apps","pdbredo","pdb-redo.py" ) )

        cmd1 = [python_exe,pdbredo_path,action] + cmd
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

        while status in ["starting","running","errors"] and (errcount<100):
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
        istruct  = self.makeClass(self.input_data.data.istruct[0])

        xyzin = istruct.getXYZFilePath(self.inputDir())
        hklin = hkl.getHKLFilePath(self.inputDir())
        libin = istruct.getLibFilePath(self.inputDir())

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
            cmd += [ "--libin",libin ]

        if not self.do_submit(cmd):
            self.success ( False )
            return

        if not self.do_wait():
            self.success ( False )
            return

        if not self.do_fetch():
            self.success ( False )
            return

        self.insertTab ( self.getWidgetId("pdbredo_log"),"PDB-REDO Log",
                         os.path.join("..",self.resultDir,"process.log"), False )

        final_pdb  = None
        final_mtz  = None
        refmac_log = None
        # final_lig = None

        files = os.listdir ( self.resultDir )
        for fname in files:
            for fname in files:
                if fname.endswith("_final.pdb"):
                    final_pdb = os.path.join(self.resultDir,fname)
                if fname.endswith("_final.mtz"):
                    final_mtz = os.path.join(self.resultDir,fname)
                if fname.endswith("_final.log"):
                    refmac_log = os.path.join(self.resultDir,fname)

        xyzout = self.getXYZOFName()
        mtzout = self.getMTZOFName()
        os.rename ( final_pdb,xyzout )
        os.rename ( final_mtz,mtzout )

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

            verdict_row = self.rvrow

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
        self.success(have_results)
        return



# ============================================================================

if __name__ == "__main__":

    drv = Pdbredo("", os.path.basename(__file__))
    drv.start()
