##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    23.04.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MRBUMP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.mrbump.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import json
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.proc    import xyzmeta
from   pycofe.auto    import auto

# ============================================================================
# Make MrBump driver

class MrBump(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "mrbump.script"

    # make task-specific definitions
    def outdir_name    (self):  return "a"
    def mrbump_report  (self):  return "mrbump_report"
    def refmac_report  (self):  return "refmac_report"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Check the existence of PDB archive
        pdbLine   = ""
        checkLine = "CHECK True"
        if self.checkPDB(False):
            pdbLine   = "PDBLOCAL " + os.environ["PDB_DIR"] + "\n"
            checkLine = "CHECK False"
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
        hkl = None
        if hasattr(self.input_data.data,'hkl'):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )

        # make a file with input script
        self.open_stdin()

        sgmode  = self.getCheckbox ( self.task.parameters.ALTGROUPS_CBX,
                                     checkVisible=True )
        devmode = self.getCheckbox ( self.task.parameters.DEVMODE_CBX,
                                     checkVisible=True )

        if hkl:
            if devmode:
                self.write_stdin ([
                    "JOBID " + self.outdir_name(),
                    "rlevel 100",
                    "mrnum 100",
                    "sgall " + str(sgmode),
                    "mdlc true",
                    "mdls false",
                    "mdlm false",
                    "mdlu false",
                    "mdlp false",
                    "mdld false",
                    "phaq true",
                    "mrprog phaser",
                    "pjobs 10",
                    "debug true",
                    pdbLine +\
                    #"pdblocal /data1/opt/db/pdb",
                    "end",
                ])

            else:
                self.write_stdin ([
                    "JOBID " + self.outdir_name(),
                    "MDLS False",
                    "MDLC True",
                    "MDLD False",
                    "MDLP False",
                    "MDLM False",
                    "MDLU False",
                    "MRPROG molrep phaser",
                    "SHELX False",
                    "BUCC True",
                    "BCYC 5",
                    "ARPW False",
                    checkLine,
                    "UPDATE False",
                    "PICKLE False",
                    "MRNUM 10",
                    "SGALL " + str(sgmode),
                    "USEE True",
                    "SCOP False",
                    "DEBUG True",
                    "RLEVEL 100",
                    "GESE True",
                    "GEST False",
                    "AMPT False",
                    pdbLine + \
                    "LABIN F=" + hkl.dataset.Fmean.value + \
                      " SIGF=" + hkl.dataset.Fmean.sigma + \
                      " FreeR_flag=" + hkl.dataset.FREE,
                    "LITE True",
                    "END"
                ])

        else:
            self.write_stdin ([
                "JOBID " + self.outdir_name(),
                "MDLS False",
                "MDLC True",
                "MDLD False",
                "MDLP False",
                "MDLM False",
                "MDLU False",
                checkLine,
                "UPDATE False",
                "PICKLE False",
                "MRNUM 5",
                "SGALL " + str(sgmode),
                "USEE True",
                "SCOP False",
                "DEBUG False",
                "RLEVEL 100",
                "GESE True",
                "GEST True",
                "AMPT False",
                "IGNORE 5tha",
                "DOPHMMER True",
                pdbLine +\
                "DOHHPRED False",
                "LITE True",
                "END"
            ])

        self.close_stdin()

        # make command-line parameters for mrbump run on a SHELL-type node
        cmd = [ "seqin",seq.getSeqFilePath(self.inputDir()) ]

        if hkl:
            cmd += [ "hklin",hkl.getHKLFilePath(self.inputDir()) ]
            # prepare report parser
            self.setGenericLogParser ( self.mrbump_report(),True )

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "mrbump.bat",cmd,logType="Main" )
        else:
            self.runApp ( "mrbump",cmd,logType="Main" )
        self.unsetLogParser()

        # check solution and register data

        search_dir = "search_" + self.outdir_name()

        with open(os.path.join(search_dir,"logs","programs.json")) as json_file:
            self.addCitations ( json.loads(json_file.read()) )

        if os.path.isdir(search_dir):

            if hkl:

                xyzfile = "output_" + self.outdir_name() + ".pdb"
                mtzfile = "output_" + self.outdir_name() + ".mtz"

                if os.path.isfile(xyzfile) and os.path.isfile(mtzfile):

                    # solution found; firstly, check whether the space group has changed

                    self.putMessage ( "&nbsp;" )

                    sol_hkl = hkl

                    meta = xyzmeta.getXYZMeta ( xyzfile,self.file_stdout,
                                                self.file_stderr )

                    if "cryst" in meta:
                        sol_spg    = meta["cryst"]["spaceGroup"]
                        spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                        if spg_change:
                            mtzfile = spg_change[0]
                            sol_hkl = spg_change[1]

                    # ================================================================
                    # make output structure and register it

                    structure = self.finaliseStructure ( xyzfile,self.outputFName,
                                                         sol_hkl,None,[seq],0,
                                                         leadKey=1,openState_bool=False )
                    if structure:
                        # update structure revision
                        revision = self.makeClass  ( self.input_data.data.revision[0] )
                        revision.setReflectionData ( sol_hkl   )
                        revision.setStructureData  ( structure )
                        self.registerRevision      ( revision  )
                        have_results = True
                        auto.makeNextTask ( self,{
                            "revision" : revision,
                            "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                            "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                        })
                    else:
                        self.putMessage ( "<h3>Structure cannot be formed</h3>" )

                else:
                    self.putTitle ( "No solution found" )


                """
                xyzfile = None
                mtzfile = None

                result_file = os.path.join ( search_dir,"results","data","results.txt" )
                if not os.path.isfile(result_file):
                    result_file = os.path.join ( search_dir,"results","results.txt" )
                if os.path.isfile(result_file):
                    lines = [line.strip() for line in open(result_file)]
                    for i in range(len(lines)):
                        self.stderrln ( " >>> " + lines[i] )
                        if lines[i].startswith("Refmac PDBOUT:"):
                            xyzfile = lines[i+1]
                        elif lines[i].startswith("Buccaneer PDBOUT:"):
                            xyzfile = lines[i+1]
                        if lines[i].startswith("Refmac MTZOUT:"):
                            mtzfile = lines[i+1]
                        elif lines[i].startswith("Buccaneer MTZOUT:"):
                            mtzfile = lines[i+1]

                    if xyzfile:

                        self.stderrln ( " >>> xyzfile " + xyzfile )
                        self.stderrln ( " >>> mtzfile " + mtzfile )

                        # solution found; firstly, check whether the space group has changed

                        #mtzfile = os.path.join ( self.outputDir(),out_mtz )
                        sol_hkl = hkl

                        meta = xyzmeta.getXYZMeta ( xyzfile,self.file_stdout,
                                                    self.file_stderr )
                        if "cryst" in meta:
                            sol_spg    = meta["cryst"]["spaceGroup"]
                            spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                            if spg_change:
                                mtzfile = spg_change[0]
                                sol_hkl = spg_change[1]

                        # ================================================================
                        # make output structure and register it

                        structure = self.finaliseStructure ( xyzfile,self.outputFName,
                                                             sol_hkl,None,seq,0,
                                                             leadKey=1,openState_bool=False )
                        if structure:
                            # update structure revision
                            revision = self.makeClass  ( self.input_data.data.revision[0] )
                            revision.setReflectionData ( sol_hkl   )
                            revision.setStructureData  ( structure )
                            self.registerRevision      ( revision  )
                            have_results = True
                        else:
                            self.putMessage ( "<h3>Structure cannot be formed</h3>" )

                        structure = self.finaliseStructure ( xyzfile,"mrbump",hkl,
                                                             None,[seq],0,
                                                             leadKey=1,
                                                             openState_bool=False )
                        if structure:
                            # update structure revision
                            revision = self.makeClass ( self.input_data.data.revision[0] )
                            revision.setStructureData ( structure )
                            self.registerRevision     ( revision  )
                        else:
                            self.putMessage ( "<h3>Structure cannot be formed</h3>" )

                if not xyzfile:
                    self.putTitle ( "No solution found" )
                """

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
                                    xyz.putXYZMeta ( self.outputDir(),self.file_stdout1,
                                                     self.file_stderr,None )
                                    xyz.addDataAssociation  ( seq.dataId )
                                    pyrvapi.rvapi_add_data (
                                                    "model_" + str(self.dataSerialNo) + "_btn",
                                                    "Model #" + str(self.dataSerialNo).zfill(2),
                                                    # always relative to job_dir from job_dir/html
                                                    "/".join([ "..",self.outputDir(),
                                                               xyz.getXYZFileName()]),
                                                    "xyz",secId,secrow,0,1,1,-1 )
                                    self.addCitations ( ['uglymol','ccp4mg'] )
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

        # unless deleted, symbolic links inside this directory will not let
        # it to be sent back to FE.
        shutil.rmtree ( search_dir )

        # close execution logs and quit
        self.success ( (self.outputDataBox.nDTypes()>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrBump ( "",os.path.basename(__file__) )
    drv.start()
