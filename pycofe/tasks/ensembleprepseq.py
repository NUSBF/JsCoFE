##!/usr/bin/python

#
# ============================================================================
#
#    26.09.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLEPREPSEQ EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembleprepseq jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os
import sys
import json
import time
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.proc   import analyse_ensemble
from   pycofe.auto   import auto


# ============================================================================
# Make MrBump driver

class EnsemblePrepSeq(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "mrbump.script"

    # make task-specific definitions
    def outdir_name    (self):  return "a"
    def mrbump_report  (self):  return "mrbump_report"
    def gesamt_report  (self):  return "gesamt_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Check avalability of PDB archive
        pdbLocal  = ""
        checkLine = "CHECK True\n"
        if "PDB_DIR" in os.environ:
            #pdbLocal  = "PDBLOCAL " + os.environ["PDB_DIR"] + "\n"
            checkLine = "CHECK False\n"
        elif not self.have_internet():
            self.fail ( "<h3>No internet connection.</h3>" +\
                    "This task requires access to PDB archive, which is not " +\
                    "installed locally, and remote access to wwPDB is not " +\
                    "possible due to missing internet connection.",
                    "No internet connection" )
            return


        # Prepare mrbump input
        # fetch input data
        seq = self.makeClass ( self.input_data.data.seq[0] )

        sec1 = self.task.parameters.sec1.contains

        rlevel = "RLEVEL "
        rlevel += self.getParameter ( sec1.RLEVEL_SEL,False )

        if self.getParameter(sec1.AFDB_CBX)=="True":
            aflevel = "AFLEVEL "
            aflevel += self.getParameter ( sec1.AFLEVEL_SEL,False )
        else:
            aflevel = ""


        # make a file with input script
        self.open_stdin()
        self.write_stdin (
            "JOBID " + self.outdir_name() + "\n" + \
            "MDLS False\n" + \
            "MDLC True\n" + \
            "MDLD False\n" + \
            "MDLP False\n" + \
            "MDLM False\n" + \
            "MDLU False\n" + \
            checkLine + \
            "UPDATE False\n" + \
            "PICKLE False\n" + \
            "MRNUM " + str(self.getParameter(sec1.MRNUM,False)) + "\n" + \
            "USEE True\n" + \
            "SCOP False\n" + \
            "DEBUG False\n" + \
            rlevel + "\n" + \
            aflevel + "\n" + \
            "GESE True\n" + \
            "GEST True\n" + \
            "AMPT False\n" + \
            "CHECK False\n" + \
            #"IGNORE 5tha\n" + \
            "DOPHMMER True\n" + \
            pdbLocal +\
            "DOHHPRED False\n" + \
            "LITE True\n" + \
            "END\n"
        )

        # RLEVEL 100 95 90 70 50
        # MRNUM 5

        self.close_stdin()
        self.flush()

        # make command-line parameters for mrbump run on a SHELL-type node
        seqPath = seq.getSeqFilePath ( self.inputDir() )
        cmd = [ "seqin",seqPath ]

        # Prepare report parser
        self.setGenericLogParser ( self.mrbump_report(),True )

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "mrbump.bat",cmd,logType="Main" )
        else:
            self.runApp ( "mrbump",cmd,logType="Main" )

        # check solution and register data
        self.unsetLogParser()

        # apparently log parser completes action when stdout is closed. this
        # may happen after STOP_POLL is issued, in which case parser's report
        # is not seen until the whole page is reloaded.
        #  is there a way to flush generic parser at some moment?
        time.sleep(1)

        search_dir = "search_" + self.outdir_name()

        with open(os.path.join(search_dir,"logs","programs.json")) as json_file:
            self.addCitations ( json.loads(json_file.read()) )

        have_results = False
        ensNo        = 0

        if os.path.isdir(search_dir):

            ensembles_found = False;
            ensembleSerNo   = 0
            domainNo        = 1
            models_dir      = os.path.join ( search_dir,"models" );
            seqName,fext    = os.path.splitext ( seq.getSeqFileName() )
            file_order      = ["BaseAlignment","100.0","75.0","50.0","25.0"]

            if os.path.isdir(models_dir):

                mdirlist = os.listdir(models_dir)
                dirName  = "domain_" + str(domainNo)

                while dirName in mdirlist:

                    secrow      = 0
                    domains_dir = os.path.join ( models_dir,dirName )

                    ensembles_dir = os.path.join ( domains_dir,"ensembles" );
                    if os.path.isdir(ensembles_dir):
                        flist = [fn for fn in os.listdir(ensembles_dir)
                                  if any(fn.endswith(ext) for ext in [".pdb"])]

                        for fo in file_order:
                            for filename in flist:
                                if fo in filename:

                                    if ensembleSerNo==0:
                                        ensembles_found = True
                                        self.putTitle ( "Results" )

                                    if secrow == 0:
                                        secId = "domain_sec_"+str(domainNo)
                                        self.putSection ( secId,"Domain #" + str(domainNo) )
                                        secrow += 1

                                    ensembleSerNo += 1
                                    if fo=="BaseAlignment":
                                        fout_name = self.outputFName + "_base.pdb"
                                    else:
                                        fout_name = self.outputFName + "_" + fo + ".pdb"

                                    os.rename ( os.path.join(ensembles_dir,filename),fout_name )

                                    align_meta = analyse_ensemble.align_seq_xyz ( self,
                                                        seqPath,fout_name,seqtype="protein" )

                                    ensemble = self.registerEnsemble ( seq,
                                                        fout_name,checkout=True )
                                    if ensemble:

                                        if secrow < 5:
                                            self.putMessage1 ( secId,
                                                "<h3>Ensemble #" + str(ensembleSerNo) + "</h3>",
                                                secrow )
                                        else:
                                            self.putMessage1 ( secId,
                                                "&nbsp;<br><h3><hr/>Ensemble #" + str(ensembleSerNo) + "</h3>",
                                                secrow )

                                        alignSecId = self.getWidgetId ( self.gesamt_report() )
                                        pyrvapi.rvapi_add_section ( alignSecId,
                                                    "Structural alignment",secId,
                                                    secrow+1,0,1,1,False )

                                        if analyse_ensemble.run(self,alignSecId,ensemble):

                                            ensemble.addDataAssociation ( seq.dataId )

                                            self.putMessage1 ( secId,"&nbsp;<br><b>Associated with sequence:</b>&nbsp;" +\
                                                              seq.dname + "<br>&nbsp;",secrow+3 )

                                            if align_meta["status"]=="ok":
                                                ensemble.meta["seqId"] = align_meta["id_avg"]
                                            ensemble.seqId = float(ensemble.meta["seqId"]) *100
                                            ensemble.rmsd  = ensemble.meta["rmsd" ]

                                            self.putEnsembleWidget1 ( secId,
                                                "ensemble_"  + str(ensembleSerNo) + "_btn",
                                                "Coordinates",ensemble,0,secrow+5,1 )
                                            have_results = True
                                            ensNo += 1

                                            if ensNo==1:
                                                auto.makeNextTask ( self,{
                                                    "model" : ensemble
                                                })


                                        else:
                                            self.putMessage1 ( secId,
                                                    "<h3>Structural alignment failed, ensemble is not useable.</h3>",0 )

                                        secrow += 7

                    domainNo += 1
                    dirName   = "domain_" + str(domainNo)

            # ----------------------------------------------------------------
            if not ensembles_found:
                self.putTitle ( "No models found" )

        time.sleep(1)

        # unless deleted, symbolic links inside this directory will not let
        # it to be sent back to FE.
        shutil.rmtree ( search_dir )

        # this will go in the project tree job's line
        if ensNo>0:
            self.generic_parser_summary["ensembleprepseq"] = {
              "summary_line" : str(ensNo) + " ensemble(s) generated"
             }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepSeq ( "",os.path.basename(__file__) )
    drv.start()
