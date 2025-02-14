##!/usr/bin/python

#
# ============================================================================
#
#    14.02.25   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2022-2025
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
from   pycofe.proc      import qualrep, xyzmeta
from   pycofe.verdicts  import verdict_refmac

from   pycofe.auto   import auto

# ============================================================================
# Model preparation driver

class SliceNDice(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following is for importing the generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

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
        no_mols     =  self.getParameter ( sec1.NO_MOLS)
        plddt_threshold = self.getParameter ( sec1.PLDDT_THRESHOLD)
        mr_prog = self.getParameter ( sec1.MR_PROG)
       

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
            
        self.fixBFactors ( [xyz] )

        labin_fo[2] = hkl.getFreeRColumn()
        input_mtz   = "_input.mtz"
        # labin_ph    = []
        self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),labin_fo,input_mtz )

        # prepare sequence data

        input_seq = "_input.seq"
        self.makeFullASUSequenceFile ( seq,"full_asu",input_seq )

        cmd = [
            "--xyzin"     ,xyz.getPDBFilePath(self.inputDir()),
            "--hklin"     ,input_mtz,
            "--seqin"     ,input_seq,
            "--min_splits",min_nsplits,
            "--max_splits",max_nsplits,
            "--sgalternative","all",
            "--nproc"     ,str(min(6,int(max_nsplits))),
            "--mr_program", mr_prog
        ]

        if no_mols=="":
            cmd += ["-n",str(revision.getNofASUMonomers())]
        else:
            cmd += ["-n",no_mols]

        if xyz.BF_correction=="alphafold-suggested":
            cmd += ['--bfactor_column', 'plddt']
        elif xyz.BF_correction=="rosetta-suggested":
            cmd += ['--bfactor_column', 'rms']
        elif xyz.BF_correction=="alphafold":
           cmd += ['--bfactor_column', 'predicted_bfactor']
        # else:
        #     cmd += ['-xyz_source', 'alphafold_bfactor']

        if int(plddt_threshold)!=0:
            cmd += ["--plddt_threshold", plddt_threshold]

        self.putWaitMessageLF ( "Solution in progress ..." )

        rc = self.runApp ( "slicendice",cmd,logType="Main",quitOnError=False )

        self.addCitations ( ['phaser','refmac5'] )

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

            with open(os.path.join("slicendice_0","slicendice_results.json")) as json_file:
                results = json.load(json_file)

            if results:
                lowest_rfree=1.0
                best_split=None
                if 'dice' in results:
                    for split in results['dice'].keys():
                        if results['dice'][split]['final_r_free'] <= lowest_rfree:
                            lowest_rfree=results['dice'][split]['final_r_free']
                            best_split=split

                    r_free     = float(results["dice"][best_split]["final_r_free"])
                    r_fact     = float(results["dice"][best_split]["final_r_fact"])
                    llg        = float(results["dice"][best_split]["phaser_llg"])
                    tfz        = float(results["dice"][best_split]["phaser_tfz"])
                    splitId    = best_split.split()[-1]
                    refmac_pdb = results["dice"][best_split]["xyzout"]
                    refmac_mtz = results["dice"][best_split]["hklout"]
                else:
                    self.putTitle ( "No solution generated" )
                    self.putMessage ( "<i>No results found</i>" )


            if not refmac_pdb or not refmac_mtz:
                
                self.putTitle ( "No solution generated" )
                self.putMessage ( "<i>No solution was produced, although expected</i>" )

            else:

                # solution found; firstly, check whether the space group has changed

                self.putMessage ( "&nbsp;" )

                sol_hkl = hkl

                meta = xyzmeta.getXYZMeta ( refmac_pdb,self.file_stdout,
                                            self.file_stderr )

                if "cryst" in meta:
                    sol_spg    = meta["cryst"]["spaceGroup"]
                    spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,refmac_mtz )
                    if spg_change:
                        refmac_mtz = spg_change[0]
                        sol_hkl    = spg_change[1]
                        self.putMessage ( "&nbsp;" )

                # note place for verdict

                verdict_row = self.rvrow
                self.rvrow += 4

                shutil.copyfile ( refmac_pdb,self.getXYZOFName() )
                shutil.copyfile ( refmac_mtz,self.getMTZOFName() )
                structure = self.registerStructure ( 
                                None,
                                self.getXYZOFName(),
                                None,
                                self.getMTZOFName(),
                                leadKey = 1,
                                refiner = "refmac" 
                            )
                if structure:
                    structure.addDataAssociation ( sol_hkl.dataId )
                    structure.setRefmacLabels    ( sol_hkl    )
                    structure.addPhasesSubtype   ()
                    self.putTitle ( "Output Structure" +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
                    self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                              "Structure and electron density",
                                              structure )
                    # update structure revision
                    revision.setStructureData  ( structure )
                    revision.setReflectionData ( sol_hkl   )
                    self.registerRevision      ( revision  )
                    have_results = True

                    rvrow0 = self.rvrow
                    try:
                        meta = qualrep.quality_report ( self,revision )
                    except:
                        meta = None
                        self.stderr ( " *** validation tools failure" )
                        self.rvrow = rvrow0 + 6

                    if meta and splitId and meta["meta_complete"]:
                        verdict_meta = {
                            "data"       : { "resolution" : hkl.getHighResolution(raw=True) },
                            "params"     : None, # will be read from log file
                            "molprobity" : meta,
                            "xyzmeta"    : structure.xyzmeta
                        }
                        # suggestedParameters = \
                        verdict_refmac.putVerdictWidget (
                            self,verdict_meta,verdict_row,
                            refmac_log=os.path.join("slicendice_0",splitId,"refmac",splitId+"_refmac.log")
                        )
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

                    if meta and meta["meta_complete"]:
                        auto.makeNextTask ( self, {
                                "revision" : revision,
                                "Rfree"    : float ( self.generic_parser_summary["refmac"]["R_free"] ),
                            }, log=self.file_stderr )


        # self.generic_parser_summary["slicendice"] = {
        #   "summary_line" : str(nmodels) + " model(s) generated"
        # }

        #
        # auto.makeNextTask ( self,{
        #     "model" : models[0]
        # })


        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = SliceNDice ( "",os.path.basename(__file__) )
    drv.start()
