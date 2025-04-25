##!/usr/bin/python

#
# ============================================================================
#
#    26.07.22   <--  Date of Last Modification.
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
#                       all successful import
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2022
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
from . import basic
from   pycofe.proc   import analyse_ensemble


# ============================================================================
# Make MrBump driver

class EnsemblePrepMG(basic.TaskDriver):

    # make task-specific definitions
    def mrbump_dir   (self):  return "mrbump_dir"
    def gesamt_report(self):  return "gesamt_report"

    # ------------------------------------------------------------------------

    def run(self):

        rvrow0 = self.rvrow
        self.putMessage ( "<h3>This task will launch CCP4 MG now</h3>" +\
                          "Make sure that you save each ensemble prepared in CCP4 MG " +\
                          "using menu item \"<i>File / Save all visible to " +\
                          self.appName() + " CCP4 Cloud</i>\"" )
        self.flush()

        # Check avalability of PDB archive
        pdbLocal = ""
        if "PDB_DIR" in os.environ:
            pdbLocal = os.environ["PDB_DIR"]
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
        workdir = os.path.join ( self.job_dir,self.mrbump_dir() )
        #if not os.path.isdir(self.mrbump_dir()):
        #    os.mkdir ( self.mrbump_dir() )
        if not os.path.isdir(workdir):
            os.mkdir ( self.mrbump_dir() )
        seqPath    = seq.getSeqFilePath ( self.inputDir() )
        ccp4mg_scr = "CLOUDCCP4MGInterface.py"
        shutil.copy2 ( os.path.join(os.path.dirname(os.path.abspath(__file__)),"..","proc",ccp4mg_scr),"." )
        cmd = [
            "-norestore",
            os.path.abspath(seqPath),
            "-scr",os.path.abspath(ccp4mg_scr),
            "-scriptArg","mrBumpMRNUM="   + str(self.getParameter(sec1.MRNUM,False)),
            "-scriptArg","mrBumpJOBID=F_" + ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(40)),
            "-scriptArg","mrBumpWorkDir=" + os.path.abspath(self.mrbump_dir()),
            "-scriptArg","mrBumpCutoff=20", #+ str(self.getParameter(sec1.CUTOFF,False)),
            "-scriptArg","mrBumpSim="     + self.getParameter(sec1.RLEVEL_SEL,False),
        ]
        if pdbLocal:
            cmd += [ "-scriptArg","mrBumpUsePDBLocal=" + pdbLocal ]

        if self.getParameter(sec1.AFDB_CBX)=="True":
            cmd += [ "-scriptArg","mrBumpAFLEVEL=%d" % int(self.getParameter(sec1.AFLEVEL_SEL,False)) ]

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4mg.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4mg",cmd,logType="Main" )

        self.addCitations ( ["mrbump","ccp4mg-primary"] )

        # Pick ensembles produced

        ensembleSerNo = 0
        filelist = [fn for fn in os.listdir(".")
                       if any(fn.endswith(ext) for ext in [".pdb"]) and
                          any(fn.startswith(pref) for pref in ["output"]) ]

        have_results = False
        ensNo        = 0

        self.rvrow = rvrow0
        if len(filelist)<=0:
            self.putTitle ( "No ensembles were created" )
        else:
            self.putTitle ( "Created ensembles" )
            for filename in sorted(filelist):
                self.stdoutln  (  " >>>>>> 02" + filename )
                ensembleSerNo += 1
                fout_name = self.outputFName + "_" + str(ensembleSerNo) + ".pdb"
                os.rename ( filename,fout_name )
                align_meta = analyse_ensemble.align_seq_xyz ( self,
                                        seqPath,fout_name,seqtype="protein" )
                ensemble = self.registerEnsemble ( seq,fout_name,checkout=True )

                if ensemble:

                    ensemble.putSequence ( seq )

                    if ensembleSerNo==1:
                        self.putMessage ( "<h3>Ensemble #" + str(ensembleSerNo) + "</h3>" )
                    else:
                        self.putMessage ( "&nbsp;<br><h3><hr/>Ensemble #" + str(ensembleSerNo) + "</h3>" )

                    if len(ensemble.xyzmeta["xyz"])>1:
                        alignSecId = self.getWidgetId ( self.gesamt_report() )
                        self.putSection ( alignSecId,"Structural alignment",openState_bool=False )
                        if not analyse_ensemble.run(self,alignSecId,ensemble):
                            self.putMessage ( "<h3>Structural alignment failed, ensemble is not useable.</h3>" )
                    else:
                        ensemble.meta = { "rmsd" : "", "seqId" : "", "eLLG" : "" }
                        self.putMessage (
                            "<b>Generated single-model ensemble</b> (" +\
                            str(ensemble.xyzmeta["xyz"][0]["chains"][0]["size"]) +\
                            " residues)" )

                    self.rvrow += 20
                    ensemble.addDataAssociation ( seq.dataId )
                    self.putMessage ( "&nbsp;<br><b>Associated with sequence:</b>&nbsp;" +\
                                                      seq.dname + "<br>&nbsp;" )
                    if align_meta["status"]=="ok":
                        ensemble.meta["seqId"] = align_meta["id_avg"]
                    ensemble.seqId = ensemble.meta["seqId"]
                    ensemble.rmsd  = ensemble.meta["rmsd" ]
                    self.putEnsembleWidget ( self.getWidgetId("ensemble"),"Coordinates",
                                             ensemble )
                    have_results = True
                    ensNo += 1

                else:
                    self.putMessage ( "<h3>Error</h3><i>Ensemble object could not be formed</i><p>" +\
                                      "Please report this to server maintainer." )

        shutil.rmtree ( self.mrbump_dir() )

        self.removeCitation ( "ccp4mg" )

        # this will go in the project tree job's line
        if ensNo>0:
            self.generic_parser_summary["ensembleprepmg"] = {
              "summary_line" : str(ensNo) + " ensemble(s) generated "
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepMG ( "",os.path.basename(__file__) )
    drv.start()
