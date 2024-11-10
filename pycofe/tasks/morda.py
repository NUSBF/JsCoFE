#!/usr/bin/python

#
# ============================================================================
#
#    24.09.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MOLREP-REFMAC EXECUTABLE MODULE
#
#  MORDA EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python morda.py jobManager jobDir jobId [queueName [nSubJobs]]
#
#  where:
#    jobManager    is either SHELL or SGE
#    jobDir     is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    jobId      is job id assigned by jsCoFE (normally an integer but should
#               be treated as a string with no assumptions)
#    queueName  optional parameter giving queue name for SGE. This parameter
#               may be missing even if job is run by SGE, so it should be
#               checked upon using command line length. queueName=='-' means
#               the same as "no name", but should be given if nSubJobs need
#               to be specified.
#    nSubJobs   optional parameter giving the maximum number of subjobs that
#               can be launched by the task. This parameter may be missing
#               even if job is run by SGE, so it should be checked upon using
#               comman line length
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
import tempfile

#  application imports
from . import basic
from   pycofe.proc     import xyzmeta
from   pycofe.verdicts import verdict_morda
from   pycofe.auto     import auto,auto_workflow

# ============================================================================
# Make Morda driver

class Morda(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # make task-specific definitions
    # tab ids for running MORDA on a SHELL-type node
    def prep_page_id   (self):  return "prep_page"
    def search_page_id (self):  return "search_page"
    def solve_page_id  (self):  return "solve_page"

    # make task-specific definitions
    def morda_seq      (self):  return "morda.seq"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    # ------------------------------------------------------------------------

    def run(self):

        # get "extra" command line arguments

        # temporary fix:

        queueName = self.getCommandLineParameter ( "queue" )
        #queueName = "";
        #if len(sys.argv)>4:
        #    if sys.argv[4]!="-":
        #        queueName = sys.argv[4]

        if self.jobManager == "SGE":
            nSubJobs = self.getCommandLineParameter ( "nproc" )
            if not nSubJobs:
                nSubJobs = "0"
            #if len(sys.argv)>5:
            #    nSubJobs = sys.argv[5]
        else:
            nSubJobs = "4"

        # end temporary fix

        # Prepare morda job
        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        seq = self.input_data.data.seq

        with open(self.morda_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );

        # prepare mtz with needed columns -- this is necessary because MoRDa does
        # not have specification of mtz columns on input (labin)

        labels  = ( hkl.dataset.Fmean.value,hkl.dataset.Fmean.sigma,hkl.dataset.FREE )
        cad_mtz = "cad.mtz"

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s E3=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd,logType="Service" )

        # create local temporary directory for morda
        tmp_dir = tempfile.mkdtemp(dir = os.environ["CCP4_SCR"])

        # MORDA is running on a cluster, all output is done by morda_sge.py module;
        # pass RVAPI document for morda_sge.py script

        # make command-line parameters for morda_sge.py
        cmd = [ "-m","morda",
                "--sge" if self.jobManager == "SGE" else "--mp",
                "--tmpdir",tmp_dir,
                "-f",cad_mtz,
                "-s",self.morda_seq(),
                "-d",self.reportDocumentName() ]

        if self.task.parameters.sec1.contains.ALTGROUPS_CBX.value:
            cmd.append ( "-a" )

        if hasattr(self.input_data.data,"model"):
            model_cls = self.makeClass ( self.input_data.data.model[0] )
            cmd = cmd + [ "-p",model_cls.getPDBFilePath(self.inputDir()) ]

        elif self.task.parameters.sec1.contains.NMODELS.value:
            cmd = cmd + [ "-n",str(self.task.parameters.sec1.contains.NMODELS.value) ]

        morda_out_pdb  = self.getXYZOFName()
        morda_out_mtz  = self.getMTZOFName()
        morda_out_map  = self.getMapOFName()
        morda_out_dmap = self.getDMapOFName()

        self.storeReportDocument(
            '{ "jobId"     : "' + self.job_id        + '",' +
            '  "logTabId"  : "' + self.log_page_id() + '",' +
            '  "name_xyz"  : "' + morda_out_pdb      + '",' +
            '  "name_mtz"  : "' + morda_out_mtz      + '",' +
            '  "name_map"  : "' + morda_out_map      + '",' +
            '  "name_dmap" : "' + morda_out_dmap     + '",' +
            '  "sge_q"     : "' + queueName          + '",' +
            '  "sge_tc"    : "' + nSubJobs           + '",' +
            '  "subjobs"   : "subjobs" ' +
            '}'
        )

        # run morda

        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )

        self.addCitations ( ['morda','molrep','refmac5'] )

        self.restoreReportDocument()

        final_pdb = os.path.join ( self.outputDir(),morda_out_pdb )

        have_results = False

        if os.path.isfile(final_pdb):

            # solution found; firstly, check whether the space group has changed

            mtzfile = os.path.join ( self.outputDir(),morda_out_mtz )
            sol_hkl = hkl

            meta = xyzmeta.getXYZMeta ( final_pdb,self.file_stdout,
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

            structure = self.finaliseStructure ( final_pdb,self.outputFName,
                                                 sol_hkl,None,seq,0,
                                                 leadKey=1,reserveRows=3 ) #,openState="closed" )
            if structure:
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setReflectionData ( sol_hkl   )
                revision.setStructureData  ( structure )
                self.registerRevision      ( revision  )
                have_results = True

                rfactor = float ( self.generic_parser_summary["refmac"]["R_factor"] )
                rfree   = float ( self.generic_parser_summary["refmac"]["R_free"]   )

                # Verdict section

                verdict_meta = {
                    # "nfitted0" : nfitted0,
                    "nfitted"  : structure.getNofPolymers(),
                    "nasu"     : revision.getNofASUMonomers(),
                    "rfree"    : rfree,
                    "rfactor"  : rfactor
                }
                verdict_morda.putVerdictWidget ( self,verdict_meta,row0 )

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision" : [revision]
                            },
                            "scores" :  {
                                "Rfactor"  : rfactor,
                                "Rfree"    : rfree
                            }
                    })

                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                        "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                    }, log=self.file_stderr)

            else:
                self.putMessage ( "<h3>Structure cannot be formed</h3>" )

        if os.path.exists("morda"):
            shutil.rmtree ( "morda",ignore_errors=True )

        if os.path.exists(tmp_dir):
            shutil.rmtree ( tmp_dir,ignore_errors=True )

        # this will go in the project tree job's line
        if not have_results:
            self.generic_parser_summary["morda"] = {
              "summary_line" : "solution not found"
            }
            auto.makeNextTask ( self,{
                "revision" : None,
                "Rfactor"  :"1",
                "Rfree"    :"1"
            })

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Morda ( "",os.path.basename(__file__),
                  { "report_page" : { "show" : True, "name" : "Summary" } }  )
    drv.start()
