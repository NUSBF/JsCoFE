##!/usr/bin/python

#
# ============================================================================
#
#    18.09.19   <--  Date of Last Modification.
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
import random
import string
import shutil

#  ccp4-python imports
#import pyrvapi

#  application imports
import basic
from   pycofe.proc   import analyse_ensemble


# ============================================================================
# Make MrBump driver

class EnsemblePrepMG(basic.TaskDriver):

    # make task-specific definitions
    def mrbump_dir   (self):  return "mrbump_dir"
    def gesamt_report(self):  return "gesamt_report"

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
        if not os.path.isdir(self.mrbump_dir()):
            os.mkdir ( self.mrbump_dir() )
        seqPath    = seq.getSeqFilePath ( self.inputDir() )
        ccp4mg_scr = "CLOUDCCP4MGInterface.py"
        shutil.copy2 ( os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","proc",ccp4mg_scr),"." )
        cmd = [
            "-norestore",
            seqPath,
            "-scr",ccp4mg_scr,
            "-scriptArg","mrBumpMRNUM="   + str(self.getParameter(sec1.MRNUM,False)),
            "-scriptArg","mrBumpJOBID=F_" + ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(40)),
            "-scriptArg","mrBumpWorkDir=" + self.mrbump_dir(),
            "-scriptArg","mrBumpCutoff="  + str(self.getParameter(sec1.CUTOFF,False)),
            "-scriptArg","mrBumpSim="     + self.getParameter(sec1.RLEVEL_SEL,False)
        ]

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4mg.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4mg",cmd,logType="Main" )

        self.addCitations ( ["mrbump","ccp4mg-primary"] )

        # Pick ensembles produced

        ensembleSerNo   = 0
        filelist = [fn for fn in os.listdir(".")
                       if any(fn.endswith(ext) for ext in [".pdb"]) and
                          any(fn.startswith(pref) for pref in ["output"]) ]

        if len(filelist)<=0:
            self.putTitle ( "No ensembles were created" )
        else:
            self.putTitle ( "Created ensembles" )
            for filename in sorted(filelist):
                ensembleSerNo += 1
                fout_name = self.outputFName + "_" + str(ensembleSerNo) + ".pdb"
                os.rename ( filename,fout_name )
                align_meta = analyse_ensemble.align_seq_xyz ( self,
                                        seqPath,fout_name,seqtype="protein" )
                ensemble = self.registerEnsemble ( seq,fout_name,checkout=True )
                if ensemble:
                    if ensembleSerNo==1:
                        self.putMessage ( "<h3>Ensemble #" + str(ensembleSerNo) + "</h3>" )
                    else:
                        self.putMessage ( "&nbsp;<br><h3><hr/>Ensemble #" + str(ensembleSerNo) + "</h3>" )
                    alignSecId = self.getWidgetId ( self.gesamt_report() )
                    self.putSection ( alignSecId,"Structural alignment",openState_bool=False )
                    if analyse_ensemble.run(self,alignSecId,ensemble):
                        ensemble.addDataAssociation ( seq.dataId )
                        self.putMessage ( "&nbsp;<br><b>Associated with sequence:</b>&nbsp;" +\
                                                          seq.dname + "<br>&nbsp;" )
                        if align_meta["status"]=="ok":
                            ensemble.meta["seqId"] = align_meta["id_avg"]
                        ensemble.seqId = ensemble.meta["seqId"]
                        ensemble.rmsd  = ensemble.meta["rmsd" ]
                        self.putEnsembleWidget ( self.getWidgetId("ensemble"),"Coordinates",
                                                 ensemble,openState=-1 )
                    else:
                        self.putMessage ( "<h3>Structural alignment failed, ensemble is not useable.</h3>" )
                else:
                    self.putMessage ( "<h3>Error</h3><i>Ensemble object could not be formed</i><p>" +\
                                      "Please report this to server maintainer." )

        self.removeCitation ( "ccp4mg" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepMG ( "",os.path.basename(__file__) )
    drv.start()
