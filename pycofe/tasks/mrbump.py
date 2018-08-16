##!/usr/bin/python

#
# ============================================================================
#
#    09.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MRBUMP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.mrbump.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
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


# ============================================================================
# Make MrBump driver

class MrBump(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "mrbump.script"

    # make task-specific definitions
    def outdir_name    (self):  return "a"
    def mrbump_report  (self):  return "mrbump_report"
    def refmac_report  (self):  return "refmac_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Check the existence of PDB archive
        pdbLine = ""
        if self.checkPDB(False):
            pdbLine = "PDBLOCAL " + os.environ["PDB_DIR"] + "\n"


        # Prepare mrbump input
        # fetch input data
        seq = self.makeClass ( self.input_data.data.seq[0] )
        hkl = None
        if hasattr(self.input_data.data,'hkl'):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )

        # make a file with input script
        self.open_stdin()

        if hkl:
            self.write_stdin (
                "JOBID " + self.outdir_name() + "\n" + \
                "MDLS False\n" + \
                "MDLC True\n" + \
                "MDLD False\n" + \
                "MDLP False\n" + \
                "MDLM False\n" + \
                "MDLU False\n" + \
                "MRPROG molrep phaser\n" + \
                "SHELX False\n" + \
                "BUCC True\n" + \
                "BCYC 5\n" + \
                "ARPW False\n" + \
                "CHECK False\n" + \
                "UPDATE False\n" + \
                "PICKLE False\n" + \
                "MRNUM 10\n" + \
                "USEE True\n" + \
                "SCOP False\n" + \
                "DEBUG True\n" + \
                "RLEVEL 95\n" + \
                "GESE False\n" + \
                "GEST False\n" + \
                "AMPT False\n" + \
                pdbLine + \
                "LABIN F=" + hkl.dataset.Fmean.value + \
                  " SIGF=" + hkl.dataset.Fmean.sigma + \
                  " FreeR_flag=" + hkl.dataset.FREE + "\n" + \
                "LITE False\n" + \
                "END\n"
            )

        else:
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
                "MRNUM 5\n" + \
                "USEE True\n" + \
                "SCOP False\n" + \
                "DEBUG False\n" + \
                "RLEVEL 95\n" + \
                "GESE True\n" + \
                "GEST True\n" + \
                "AMPT False\n" + \
                "IGNORE 5tha\n" + \
                "DOPHMMER True\n" + \
                pdbLine + \
                "DOHHPRED False\n" + \
                "END\n"
            )

        self.close_stdin()

        # make command-line parameters for mrbump run on a SHELL-type node
        cmd = [ "seqin",seq.getSeqFilePath(self.inputDir()) ]

        if hkl:
            cmd += [ "hklin",hkl.getHKLFilePath(self.inputDir()) ]
            # prepare report parser
            self.setGenericLogParser ( self.mrbump_report(),True )

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "mrbump.bat",cmd )
        else:
            self.runApp ( "mrbump",cmd )
        self.unsetLogParser()

        # check solution and register data

        search_dir = "search_" + self.outdir_name();

        if os.path.isdir(search_dir):

            if hkl:
                molrep_dir = os.path.join ( search_dir,"results","solution",
                                                       "mr","molrep","refine" )

                if os.path.isdir(molrep_dir):
                    dirlist = os.listdir(molrep_dir)
                    xyzfile = None
                    #mtzfile = None
                    for filename in dirlist:
                        if filename.startswith("refmac"):
                            if filename.endswith(".pdb"):
                                xyzfile = os.path.join(molrep_dir,filename)
                            #if filename.endswith(".mtz"):
                                #mtzfile = os.path.join(molrep_dir,filename)

                    structure = self.finaliseStructure ( xyzfile,"mrbump",hkl,
                                                            None,[seq],1,False )
                    if structure:
                        # update structure revision
                        revision = self.makeClass ( self.input_data.data.revision[0] )
                        revision.setStructureData ( structure )
                        self.registerRevision     ( revision  )

                else:
                    self.putTitle ( "No solution found" )

            else:
                models_found    = False;
                ensembles_found = False;
                models_dir      = os.path.join ( search_dir,"models" );

                if os.path.isdir(models_dir):

                    mdirlist = os.listdir(models_dir)
                    domainNo = 1
                    dirName  = "domain_" + str(domainNo)

                    while dirName in mdirlist:

                        secrow      = 0
                        domains_dir = os.path.join ( models_dir,dirName )
                        dirlist     = os.listdir   ( domains_dir )

                        for filename in dirlist:
                            if filename.endswith(".pdb"):

                                if not models_found:
                                    models_found = True
                                    self.putTitle ( "Results" )

                                if secrow == 0:
                                    secId = "domain_sec_"+str(domainNo)
                                    self.putSection ( secId,"Domain "+str(domainNo) )
                                    pyrvapi.rvapi_set_text ( "<h2>Models found:</h2>",
                                                            secId,secrow,0,1,1 )
                                    secrow += 1

                                xyz = self.registerXYZ ( os.path.join(domains_dir,filename) )
                                if xyz:
                                    xyz.addDataAssociation  ( seq.dataId )
                                    pyrvapi.rvapi_add_data (
                                                    "model_" + str(self.dataSerialNo) + "_btn",
                                                    "Model #" + str(self.dataSerialNo).zfill(2),
                                                    # always relative to job_dir from job_dir/html
                                                    "/".join([ "..",self.outputDir(),
                                                               xyz.getXYZFileName()]),
                                                    "xyz",secId,secrow,0,1,1,-1 )
                                    secrow += 1

                        ensembles_dir = os.path.join ( domains_dir,"ensembles" );
                        ensembleSerNo = 0;
                        if os.path.isdir(ensembles_dir):
                            for filename in os.listdir(ensembles_dir):
                                if filename.endswith(".pdb"):
                                    if not ensembles_found:
                                        pyrvapi.rvapi_set_text ( "<h2>Ensembles made:</h2>",
                                                                 secId,secrow,0,1,1 )
                                        ensembles_found = True
                                        secrow += 1
                                    ensembleSerNo += 1
                                    ensemble = self.registerEnsemble ( seq,
                                                    os.path.join(ensembles_dir,filename) )
                                    if ensemble:
                                        ensemble.addDataAssociation ( seq.dataId )
                                        self.putEnsembleWidget1 ( secId,
                                                    "ensemble_"  + str(ensembleSerNo) + "_btn",
                                                    "Ensemble #" + str(ensembleSerNo).zfill(2),
                                                    ensemble,-1,secrow,1 )
                                        secrow += 1

                        domainNo += 1
                        dirName   = "domain_" + str(domainNo)

                # ----------------------------------------------------------------
                if not models_found:
                    self.putTitle ( "No models found" )

        else:
            self.putTitle ( "No resuts produced" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrBump ( "",os.path.basename(__file__) )
    drv.start()
