##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    30.07.21   <--  Date of Last Modification.
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
    def mrbump_seq     (self):  return "mrbump.seq"

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

        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        seq = self.input_data.data.seq

        if len(seq)>0:
            with open(self.mrbump_seq(),'w') as newf:
                for i in range(len(seq)):
                    seq[i] = self.makeClass ( seq[i] )
                    with open(seq[i].getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );

        # make a file with input script
        self.open_stdin()

        sec1 = self.task.parameters.sec1.contains

        sgmode  = self.getCheckbox ( sec1.ALTGROUPS_CBX,checkVisible=True )

        rlevel = "RLEVEL "
        rlevel += self.getParameter ( sec1.RLEVEL_SEL,False )

        if self.getParameter(sec1.AFDB_CBX)=="True":
            aflevel = "AFLEVEL "
            aflevel += self.getParameter ( sec1.AFLEVEL_SEL,False )
        else:
            aflevel = ""
            

        # devmode = self.getCheckbox ( self.task.parameters.DEVMODE_CBX,
        #                              checkVisible=True )
        devmode = False
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
                "BUCC False",
                "BCYC 5",
                "ARPW False",
                checkLine,
                "UPDATE False",
                "PICKLE False",
                "MRNUM " + self.getParameter ( sec1.MRNUM ),
                "SGALL " + str(sgmode),
                "USEE False",
                "SCOP False",
                "DEBUG False",
                rlevel,
                aflevel,
                "GESE False",
                "GEST False",
                "AMPT False",
                "CHECK False",
                "PHAQ True",
                "PJOBS 1",
                pdbLine + \
                "LABIN F=" + hkl.dataset.Fmean.value + \
                  " SIGF=" + hkl.dataset.Fmean.sigma + \
                  " FreeR_flag=" + hkl.dataset.FREE,
                "LITE True",
                "END"
            ])

        self.close_stdin()

        # make command-line parameters for mrbump run on a SHELL-type node
        # cmd = [ "seqin",seq.getSeqFilePath(self.inputDir()) ]
        cmd = [ "seqin",self.mrbump_seq() ]

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

        have_results   = False

        search_dir     = "search_" + self.outdir_name()
        citations_json = os.path.join ( search_dir,"logs","programs.json" )

        if os.path.isfile(citations_json):
            with open(citations_json) as json_file:
                self.addCitations ( json.loads(json_file.read()) )

        if os.path.isdir(search_dir):

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
                                                     sol_hkl,None,seq,0,
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
                    have_results = True
                else:
                    self.putMessage ( "<h3>Structure cannot be formed</h3>" )

            else:
                self.putTitle ( "No solution found" )

        else:
            self.putTitle ( "No resuts produced" )

        # unless deleted, symbolic links inside this directory will not let
        # it to be sent back to FE.
        shutil.rmtree ( search_dir )

        # this will go in the project tree job's line
        if not have_results:
            self.generic_parser_summary["mrbump"] = {
              "summary_line" : "solution not found"
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrBump ( "",os.path.basename(__file__) )
    drv.start()
