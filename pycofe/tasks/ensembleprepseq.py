##!/usr/bin/python

#
# ============================================================================
#
#    05.07.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLEPREPSEQ EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembleprepseq exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
from   pycofe.proc import analyse_ensemble


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
        self.checkPDB()

        # Prepare mrbump input
        # fetch input data
        seq = self.makeClass ( self.input_data.data.seq[0] )

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
            "CHECK False\n" + \
            "UPDATE False\n" + \
            "PICKLE False\n" + \
            "MRNUM " + str(self.getParameter(self.task.parameters.sec1.contains.MRNUM,False)) + "\n" + \
            "USEE True\n" + \
            "SCOP False\n" + \
            "DEBUG False\n" + \
            "RLEVEL " + self.getParameter(self.task.parameters.sec1.contains.RLEVEL_SEL,False) + "\n" + \
            "GESE True\n" + \
            "GEST True\n" + \
            "AMPT False\n" + \
            #"IGNORE 5tha\n" + \
            "DOPHMMER True\n" + \
            "PDBLOCAL " + os.environ["PDB_DIR"] + "\n" + \
            "DOHHPRED False\n" + \
            "END\n"
        )

        # RLEVEL 100 95 90 70 50
        # MRNUM 5

        self.close_stdin()

        # make command-line parameters for mrbump run on a SHELL-type node
        cmd = [ "seqin",seq.getFilePath(self.inputDir()) ]

        # Prepare report parser
        self.setGenericLogParser ( self.mrbump_report(),True )

        # Start mrbump
        self.runApp ( "mrbump",cmd )

        # check solution and register data
        self.unsetLogParser()

        search_dir = "search_" + self.outdir_name();

        if os.path.isdir(search_dir):

            #models_found    = False;
            ensembles_found = False;
            ensembleSerNo   = 0
            domainNo        = 1
            models_dir      = os.path.join ( search_dir,"models" );
            seqName,fext    = os.path.splitext ( seq.files[0] )

            if os.path.isdir(models_dir):

                mdirlist = os.listdir(models_dir)
                dirName  = "domain_" + str(domainNo)

                while dirName in mdirlist:

                    secrow      = 0
                    domains_dir = os.path.join ( models_dir,dirName )

                    ensembles_dir = os.path.join ( domains_dir,"ensembles" );
                    if os.path.isdir(ensembles_dir):
                        for filename in os.listdir(ensembles_dir):
                            if filename.endswith(".pdb"):

                                if ensembleSerNo==0:
                                    ensembles_found = True
                                    self.putTitle ( "Results" )

                                if secrow == 0:
                                    secId = "domain_sec_"+str(domainNo)
                                    self.putSection ( secId,"Domain #" + str(domainNo) )
                                    secrow += 1

                                ensembleSerNo += 1
                                ensemble = self.registerEnsemble ( seq,
                                            os.path.join(ensembles_dir,filename),
                                            checkout=True )
                                if ensemble:

                                    self.putMessage1 ( secId,
                                        "<h3>Ensemble #" + str(ensembleSerNo) + "</h3>",
                                        secrow )

                                    alignSecId = self.gesamt_report() + "_" + str(ensembleSerNo)
                                    pyrvapi.rvapi_add_section ( alignSecId,
                                                "Structural alignment",secId,
                                                secrow+1,0,1,1,False )
                                    analyse_ensemble.run ( self,alignSecId,ensemble )

                                    #self.putMessage1 ( secId,
                                    #    "<br><b>Assigned name:</b>&nbsp;" + ensemble.dname,
                                    #    secrow+2 )

                                    ensemble.addDataAssociation ( seq.dataId )
                                    self.putEnsembleWidget1 ( secId,
                                        "ensemble_"  + str(ensembleSerNo) + "_btn",
                                        "Coordinates",ensemble,-1,secrow+3,1 )
                                    #ensemble.sequence = seq
                                    #ensemble.files   += [seq.files[0]]

                                    secrow += 5

                    domainNo += 1
                    dirName   = "domain_" + str(domainNo)

            os.rename ( os.path.join(self.inputDir(),seq.files[0]),
                        os.path.join(self.outputDir(),seq.files[0]) )

            # ----------------------------------------------------------------
            if not ensembles_found:
                self.putTitle ( "No models found" )

        # close execution logs and quit

        # apparently log parser completes action when stdout is closed. this
        # may happen after STOP_POLL is issued, in which case parser's report
        # is not seen until the whole page is reloaded.
        #  is there a way to flush generic parser at some moment?
        import time
        time.sleep(1)

        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepSeq ( "",os.path.basename(__file__) )
    drv.start()
