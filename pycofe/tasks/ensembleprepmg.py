##!/usr/bin/python

#
# ============================================================================
#
#    11.07.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLEPREPMG EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembleprepmg jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
import sys
#import time

#  ccp4-python imports
#import pyrvapi

#  application imports
import basic
#from   pycofe.proc   import analyse_ensemble


# ============================================================================
# Make MrBump driver

class EnsemblePrepMG(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return "mrbump.script"

    # make task-specific definitions
    #def outdir_name    (self):  return "a"
    #def mrbump_report  (self):  return "mrbump_report"
    #def gesamt_report  (self):  return "gesamt_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Check avalability of PDB archive
        pdbLocal = ""
        if "PDB_DIR" in os.environ:
            pdbLocal = "PDBLOCAL " + os.environ["PDB_DIR"] + "\n"
        elif not self.have_internet():
            self.fail ( "<h3>No internet connection.</h3>" +\
                    "This task requires access to PDB archive, which is not " +\
                    "installed locally, and remote access to wwPDB is not " +\
                    "possible due to missing internet connection.",
                    "No internet connection" )
            return

        sec1 = self.task.parameters.sec1.contains

        # Prepare ccp4mg input
        # fetch input data
        seq = self.makeClass ( self.input_data.data.seq[0] )

        # make command-line parameters for ccp4mg run on a SHELL-type node
        cmd = [
            "-scr",
            os.path.join ( os.environ["CCP4"],"share","ccp4i2","wrappers",
                           "ccp4mg_edit_model","script","ccp4i2CCP4MGInterface.py" ),
            seq.getSeqFilePath ( self.inputDir() ),
            "-scriptArg","mrBumpCutoff=" + str(self.getParameter(sec1.CUTOFF,False)),
            "-scriptArg","mrBumpSim="    + self.getParameter(sec1.RLEVEL_SEL,False)
        ]

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4mg.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4mg",cmd,logType="Main" )

        models_dir = "./"

        """
        if os.path.isdir(models_dir):

            #models_found    = False;
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
                                            ensemble.seqId = ensemble.meta["seqId"]
                                            ensemble.rmsd  = ensemble.meta["rmsd" ]

                                            self.putEnsembleWidget1 ( secId,
                                                "ensemble_"  + str(ensembleSerNo) + "_btn",
                                                "Coordinates",ensemble,-1,secrow+5,1 )
                                        else:
                                            self.putMessage1 ( secId,
                                                    "<h3>Structural alignment failed, ensemble is not useable.</h3>",0 )

                                        secrow += 7

                    domainNo += 1
                    dirName   = "domain_" + str(domainNo)

            os.rename ( seq.getSeqFilePath(self.inputDir()),
                        seq.getSeqFilePath(self.outputDir()) )

            # ----------------------------------------------------------------
            if not ensembles_found:
                self.putTitle ( "No models found" )
        """
        #time.sleep(1)

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepMG ( "",os.path.basename(__file__) )
    drv.start()
