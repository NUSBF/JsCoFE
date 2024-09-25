##!/usr/bin/python

#
# ============================================================================
#
#    24.09.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
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
# import pyrvapi

#  application imports
from . import basic
from   pycofe.proc     import xyzmeta
from   pycofe.verdicts import verdict_mrbump
from   pycofe.auto     import auto, auto_workflow

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

        # Check availability of PDB archive
        pdbLine   = ""
        checkLine = "CHECK True"
        if self.checkPDB(False):
            #pdbLine   = "PDBLOCAL " + os.environ["PDB_DIR"] + "\n"
            checkLine = "CHECK False"
        elif self.task.private_data:
            self.fail ( "<h3>Data confidentiality conflict.</h3>" +\
                    "This task requires access to PDB archive, which is not " +\
                    "installed locally while transmission of sequence data to " +\
                    "external servers is blocked by CCP4 Cloud configuration.",
                    "No local PDB archive" )
            return
        elif not self.have_internet():
            self.fail ( "<h3>No internet connection.</h3>" +\
                    "This task requires access to PDB archive, which is not " +\
                    "installed locally while wwPDB is not accessible due to " +\
                    "missing internet connection.",
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

        sec1    = self.task.parameters.sec1.contains

        sgmode  = self.getCheckbox ( sec1.ALTGROUPS_CBX,checkVisible=True )

        rlevel  = "RLEVEL "
        rlevel += self.getParameter ( sec1.RLEVEL_SEL,False )

        if self.getParameter(sec1.AFDB_CBX)=="True" and not self.task.private_data:
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
            self.runApp ( "mrbump.bat",cmd,logType="Main",quitOnError=False )
        else:
            self.runApp ( "mrbump",cmd,logType="Main",quitOnError=False )
        self.unsetLogParser()

        # check solution and register data

        have_results = False

        search_dir   = "search_" + self.outdir_name()

        if os.path.isdir(search_dir):

            citations_json = os.path.join ( search_dir,"logs","programs.json" )
            if os.path.isfile(citations_json):
                with open(citations_json) as json_file:
                    self.addCitations ( json.loads(json_file.read()) )

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

                row0 = self.rvrow + 1

                structure = self.finaliseStructure ( xyzfile,self.outputFName,
                                                     sol_hkl,None,seq,0,
                                                     leadKey=1,reserveRows=3 ) # ,openState="closed" )
                if structure:
                    # update structure revision
                    revision = self.makeClass  ( self.input_data.data.revision[0] )
                    revision.setReflectionData ( sol_hkl   )
                    revision.setStructureData  ( structure )
                    self.registerRevision      ( revision  )
                    have_results = True

                    llg = 0.0
                    tfz = 0.0
                    key = 0
                    self.flush()
                    self.file_stdout.close()
                    with (open(self.file_stdout_path(),'r')) as fstd:
                        for line in fstd:
                            if key==2:
                                words = line.split()
                                llg = float ( words[len(words)-5] )
                                tfz = float ( words[len(words)-6] )
                                key = 3
                            elif (key==1) and ("RFZ   TFZ     LLG" in line):
                                key = 2
                            elif "Final MR solution from Phaser..." in line:
                                key = 1
      
                    self.file_stdout = open ( self.file_stdout_path(),'a' )
    
                    rfactor = float ( self.generic_parser_summary["refmac"]["R_factor"] )
                    rfree   = float ( self.generic_parser_summary["refmac"]["R_free"]   )

                    # Verdict section

                    verdict_meta = {
                        "nfitted"  : structure.getNofPolymers(),
                        "nasu"     : revision.getNofASUMonomers(),
                        "fllg"     : llg,
                        "ftfz"     : tfz,
                        "rfree"    : rfree,
                        "rfactor"  : rfactor,
                    }
                    verdict_mrbump.putVerdictWidget ( self,verdict_meta,row0 )

                    if self.task.autoRunName.startswith("@"):
                        # scripted workflow framework
                        auto_workflow.nextTask ( self,{
                                "data" : {
                                    "revision" : [revision],
                                    "hkl"      : [sol_hkl]
                                },
                                "scores" :  {
                                    "Rfactor"  : rfactor,
                                    "Rfree"    : rfree
                                }
                        })
                        # self.putMessage ( "<h3>Workflow started</hr>" )
                    else:
                        auto.makeNextTask ( self,{
                            "revision" : revision,
                            "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                            "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                        })

                else:
                    self.putMessage ( "<h3>Structure cannot be formed</h3>" )

            else:
                self.putTitle ( "No solution found" )

        else:
            self.putTitle ( "No resuts produced" )

        # this will go in the project tree job's line
        if not have_results:

            self.generic_parser_summary["mrbump"] = {
              "summary_line" : "solution not found"
            }
            
            if self.task.autoRunName.startswith("@"):
                # scripted workflow framework
                auto_workflow.nextTask ( self,{
                        "data" : {
                            "revision" : [None]
                        },
                        "scores" :  {
                            "Rfactor"  : 1.0,
                            "Rfree"    : 1.0
                        }
                })
                # self.putMessage ( "<h3>Workflow started</hr>" )

            else:
                auto.makeNextTask ( self,{
                    "revision" : None,
                    "Rfactor"  :"1",
                    "Rfree"    :"1"
                })

        # apparently log parser completes action when stdout is closed. this
        # may happen after STOP_POLL is issued, in which case parser's report
        # is not seen until the whole page is reloaded.
        #  is there a way to flush generic parser at some moment?
        time.sleep(1)

        # unless deleted, symbolic links inside this directory will not let
        # it to be sent back to FE.
        try:
            shutil.rmtree ( search_dir )
        except:
            self.stderrln ( "\n ***** could not delete residual directory at " +\
                            search_dir + "\n" )
            pass

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrBump ( "",os.path.basename(__file__) )
    drv.start()
