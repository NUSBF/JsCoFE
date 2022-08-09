##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    21.06.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SLICE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.slicendice jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel,Maria Fando, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os
# import sys
import shutil
import json
#
# #  ccp4-python imports
# import gemmi

#  application imports
from . import basic
from   pycofe.proc      import qualrep
from   pycofe.verdicts  import verdict_refmac
from   pycofe.auto      import template_afMR

from   pycofe.auto   import auto

# ============================================================================
# Model preparation driver

class SliceNDice(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        revision    = self.makeClass ( self.input_data.data.revision[0] )
        xyz         = self.makeClass ( self.input_data.data.xyz[0] )
        hkl         = self.makeClass ( self.input_data.data.hkl[0] )
        seq         = self.input_data.data.seq
        sec1        = self.task.parameters.sec1.contains
        min_nsplits = self.getParameter ( sec1.MIN_NSPLITS )
        max_nsplits = self.getParameter ( sec1.MAX_NSPLITS )

        # prepare input MTZ file by selecting original reflection data

        labin_fo = hkl.getMeanI()
        if labin_fo[2]!="I":
            labin_fo = hkl.getMeanF()
            if labin_fo[2]!="F":
                self.fail ( "<h3>No intensity or amplitude data.</h3>" +\
                        "This task requires I/sigI or F/sigF columns in reflection data, " +\
                        "which were not found.",
                        "No reflection data." )
                return

        labin_fo[2] = hkl.getFreeRColumn()
        input_mtz   = "_input.mtz"
        labin_ph    = []
        self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),labin_fo,input_mtz )

        # prepare sequence data

        input_seq = "_input.seq"
        self.makeFullASUSequenceFile ( seq,"full_asu",input_seq )

        cmd = [
            "-xyzin"     ,xyz.getXYZFilePath(self.inputDir()),
            "-hklin"     ,input_mtz,
            "-seqin"     ,input_seq,
            "-no_mols"   ,str(revision.getNofASUMonomers()),
            "-min_splits",min_nsplits,
            "-max_splits",max_nsplits,
            "-xyz_source","alphafold_bfactor",
            "-sga"       ,"all",
            "-nproc"     ,str(min(6,int(max_nsplits)))
        ]

        self.putWaitMessageLF ( "Solution in progress ..." )

        rc = self.runApp ( "slicendice",cmd,logType="Main",quitOnError=False )

        have_results = False

        if rc.msg:
            self.putTitle ( "Failure" )
            self.putMessage ( "<i>Program failure, please report</i>" )
        else:

            refmac_pdb = None
            refmac_mtz = None
            splitId    = None
            llg        = None
            tfz        = None
            r_fact     = None
            r_free     = 2.0
            results    = None

            with open(os.path.join("slicendice_0","results.json")) as json_file:
                results = json.load(json_file)

            if results:
                for key in results["final_r_free"]:
                    rfree = float(results["final_r_free"][key])
                    if rfree<r_free:
                        r_free     = rfree
                        r_fact     = float(results["final_r_fact"][key])
                        llg        = float(results["phaser_llg"  ][key])
                        tfz        = float(results["phaser_tfz"  ][key])
                        splitId    = results["split_id"][key]
                        refmac_pdb = results["xyzout"  ][key]
                        refmac_mtz = results["hklout"  ][key]

            # dirName    = os.path.join ( "slicendice_0","output" )
            # outFiles   = [f for f in os.listdir(dirName)]
            # for fname in outFiles:
            #     fpath = os.path.join ( dirName,fname )
            #     if fname.endswith(".pdb"):
            #         refmac_pdb = fpath
            #     elif fname.endswith(".mtz"):
            #         refmac_mtz = fpath

            if not refmac_pdb or not refmac_mtz:
                self.putTitle ( "No solution generated" )
                self.putMessage ( "<i>No solution was produced, although expected</i>" )
            else:

                self.putMessage ( "&nbsp;" )

                verdict_row = self.rvrow
                self.rvrow += 4

                # splitId = None
                # llg     = None
                # tfz     = None
                # r_fact  = None
                # r_free  = None
                #
                # with (open(os.path.join("slicendice_0","slicendice.log"),'r')) as fstd:
                #     for line in fstd:
                #         words = line.split()
                #         if len(words)==5 and words[0].startswith("split_"):
                #             splitId = words[0]
                #             llg     = words[1]
                #             tfz     = words[2]
                #             r_fact  = words[3]
                #             r_free  = words[4]
                #             break

                shutil.copyfile ( refmac_pdb,self.getXYZOFName() )
                shutil.copyfile ( refmac_mtz,self.getMTZOFName() )
                structure = self.registerStructure ( self.getXYZOFName(),None,
                                                     self.getMTZOFName(),None,
                                                     None,None, leadKey=1,
                                                     refiner="refmac" )
                if structure:
                    structure.addDataAssociation ( hkl.dataId )
                    structure.setRefmacLabels    ( hkl )
                    structure.addPhasesSubtype   ()
                    self.putTitle ( "Output Structure" +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
                    self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                              "Structure and electron density",
                                              structure )
                    # update structure revision
                    revision.setStructureData  ( structure )
                    self.registerRevision      ( revision  )
                    have_results = True

                    rvrow0 = self.rvrow
                    try:
                        meta = qualrep.quality_report ( self,revision )
                    except:
                        meta = None
                        self.stderr ( " *** molprobity failure" )
                        self.rvrow = rvrow0

                    if meta and splitId:
                        verdict_meta = {
                            "data"       : { "resolution" : hkl.getHighResolution(raw=True) },
                            "params"     : None, # will be read from log file
                            "molprobity" : meta,
                            "xyzmeta"    : structure.xyzmeta
                        }
                        refmac_log = os.path.join
                        suggestedParameters = verdict_refmac.putVerdictWidget (
                            self,verdict_meta,verdict_row,
                            refmac_log=os.path.join("slicendice_0",splitId,"refmac",splitId+"_refmac.log") )
                        # if suggestedParameters:
                        #     self.task.suggestedParameters = suggestedParameters
                        #     self.putCloneJobButton ( "Clone job with suggested parameters",
                        #                              self.report_page_id(),verdict_row+3,0 )

                    if splitId:
                        self.generic_parser_summary["phaser"] = {
                            "llg" : str(llg),
                            "tfz" : str(tfz)
                        }
                        self.generic_parser_summary["refmac"] = {
                            "R_factor" : str(r_fact),
                            "R_free"   : str(r_free)
                        }

        # self.generic_parser_summary["slicendice"] = {
        #   "summary_line" : str(nmodels) + " model(s) generated"
        # }

        #
        # auto.makeNextTask ( self,{
        #     "model" : models[0]
        # })

        auto.makeNextTask(self, {
                "revision": revision,
                "Rfree": float ( self.generic_parser_summary["refmac"]["R_free"] ),
            }, log=self.file_stderr)


        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = SliceNDice ( "",os.path.basename(__file__) )
    drv.start()
