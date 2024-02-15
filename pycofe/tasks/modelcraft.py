##!/usr/bin/python

#
# ============================================================================
#
#    15.02.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MODELCRAFT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python modelcraft.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir      is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2022-2024
#
# ============================================================================
#

#  python native imports
import os
# import sys
import json

import gemmi

#  application imports
from . import basic
from   pycofe.dtypes   import dtype_template
from   varut           import mmcif_utils
from   pycofe.proc     import qualrep
from   pycofe.verdicts import verdict_modelcraft
from   pycofe.auto     import auto, auto_workflow


# ============================================================================
# Make ModelCraft driver

# modelcraft_pipeline/modelcraft.cif
# modelcraft_pipeline/modelcraft.mtz

class ModelCraft(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "modelcraft.script"

    # make task-specific definitions
    def modelcraft_seq   (self):  return "modelcraft.seq"
    def modelcraft_pdb   (self):  return "modelcraft.pdb"
    def modelcraft_mmcif (self):  return "modelcraft.cif"
    def modelcraft_mtz   (self):  return "modelcraft.mtz"
    def contents_json    (self):  return "contents.json"
    def modelcraft_json  (self):  return "modelcraft.json"
    def modelcraft_tmp   (self):  return "modelcraft_pipeline"

    # ------------------------------------------------------------------------

    def addCmdLine ( self,keyword,line ):
        self.write_stdin ( keyword + " " + line + "\n" )
        return

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When modelcraft
        # succeeds, this file is created.
        if os.path.isfile(self.modelcraft_mmcif()):
            os.remove(self.modelcraft_mmcif())

        # if not os.path.exists(self.modelcraft_tmp()):
        #     os.makedirs(self.modelcraft_tmp())

        # Prepare modelcraft input
        # fetch input data

        idata    = self.input_data.data
        revision = self.makeClass ( idata.revision[0] )
        hkl      = self.makeClass ( idata.hkl[0]      )
        istruct  = self.makeClass ( idata.istruct[0]  )
        seq      = idata.seq
        sec1     = self.task.parameters.sec1.contains

        if hasattr(idata,"isubstruct"):
            isubstruct = self.makeClass ( idata.isubstruct[0] )
        else:
            isubstruct = istruct

        build_sel = "all"
        if hasattr(revision.Options,"build_sel"):
            build_sel = revision.Options.build_sel

        # If starting from experimental phases:
        #
        # modelcraft --contents sequences.fasta --data data.mtz --unbiased
        #
        # The sequences.fasta should contain the protein/RNA/DNA sequences that
        # you want to build and data.mtz should contain observations, free-R flag
        # and un-modified experimental phases (Parrot will be used internally).
        #
        # If starting after MR:
        #
        # modelcraft --contents sequences.fasta --data data.mtz --model model.cif

        # prepare input MTZ file by putting original reflection data into
        # phases MTZ

        labin_fo = hkl.getMeanF()
        if labin_fo[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        labin_fo[2] = hkl.getFreeRColumn()
        input_mtz   = "_input.mtz"
        labin_ph    = []
        if istruct.leadKey==2:  # experimental phases
            if istruct.HLA:
                labin_ph = [istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD]
            else:
                labin_ph = [istruct.PHI,istruct.FOM]
            self.makePhasesMTZ (
                    hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
                    istruct.getMTZFilePath(self.inputDir()),labin_ph,
                    input_mtz )
        else:
            self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),labin_fo,
                            input_mtz )

        # with open(self.modelcraft_seq(),'w') as newf:
        #     if len(seq)>0:
        #         for s in seq:
        #             s1 = self.makeClass ( s )
        #             with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
        #                 newf.write(hf.read())
        #             newf.write ( '\n' );
        #     else:
        #         newf.write ( ">polyUNK\nU\n" );
        #
        # # make command-line parameters
        # cmd = [ "xray","--contents",self.modelcraft_seq(),"--data",input_mtz ]

        # prepare contents json file
        contents = {
            "copies"  : 1,
            "proteins": [],
            "rnas"    : [],
            "dnas"    : [],
            "carbs"   : [],
            "ligands" : [],
            "buffers" : []
        }
        mres = 0
        for s in seq:
            s1     = self.makeClass ( s )
            seqstr = s1.getSequence(self.inputDir())
            mres  += s1.ncopies* len(seqstr)
            item   = {
                "sequence"      : seqstr,
                "stoichiometry" : s1.ncopies
            }
            if s1.isProtein() and build_sel in ["all","protein"]:
                contents["proteins"].append(item)
            elif s1.isDNA() and build_sel in ["all","dna"]:
                contents["dnas"].append(item)
            elif s1.isRNA() and build_sel in ["all","rna"]:
                contents["rnas"].append(item)

        with open(self.contents_json(),"w") as contfile:
            json.dump ( contents,contfile )

        self.stdoutln ( "CONTENTS FILE:\n\n" +\
                        json.dumps(contents,sort_keys=True,indent=4) )

        # make command-line parameters
        cmd = [ "xray","--contents",self.contents_json(),"--data",input_mtz ]

        xyz_model_path = istruct.getXYZFilePath ( self.inputDir() )
        if istruct.leadKey==2:  #  experimental phases
            if revision.Substructure and revision.Options.useSubstruct:
                cmd += [
                    "--model" , isubstruct.getSubFilePath(self.inputDir()),
                    "--phases", ",".join(labin_ph)
                ]
            elif xyz_model_path:
                cmd += [
                    "--model" , xyz_model_path,
                    "--phases", ",".join(labin_ph),
                    "--unbiased"
                ]
            else: 
                cmd += [
                    "--phases", ",".join(labin_ph),
                    "--unbiased"
                ]

        else:  #  molecular replacement
            cmd += [ "--model",xyz_model_path ]

        # else:  #  molecular replacement
        #     if istruct.getXYZFilePath(self.inputDir()) != None:
        #         cmd += [ "--model", istruct.getXYZFilePath(self.inputDir()) ]
        #     else: 

        #         labin_ph = [istruct.PHI,istruct.FOM]
        #         self.makePhasesMTZ (
        #                 hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
        #                 istruct.getMTZFilePath(self.inputDir()),labin_ph,
        #                 input_mtz )
        #         cmd += [
        #             "--phases", ",".join(labin_ph)
        #         ]
        cmd += [
            "--cycles"          ,self.getParameter(sec1.NCYCLES_MAX),
            "--auto-stop-cycles",self.getParameter(sec1.NOIMPROVE_CYCLES),
            "--directory"       ,self.modelcraft_tmp()
        ]
        if hkl.detwin:
            cmd += [ "--twinned" ]
        if self.getParameter(sec1.MODE_SEL)=='basic':
            cmd += [ "--basic" ]

        rvrow0 = self.rvrow
        gridId = self.putWaitMessageLF ( "Building in progress ...",
                                         message2="&nbsp;&nbsp;&nbsp;" )
        
        webcoot_options = {
            "project"      : self.task.project,
            "id"           : self.job_id,
            "no_data_msg"  : "<b>Waiting for first build...</b>",
            "FWT"          : "FWT",
            "PHWT"         : "PHWT", 
            "FP"           : "FP",
            "SigFP"        : "SIGFP",
            "FreeR_flag"   : "FreeR_flag",
            "DELFWT"       : "DELFWT",
            "PHDELWT"      : "PHDELWT"
        }

        self.putWebCootButton (
            self.modelcraft_tmp() + "/modelcraft.cif",
            self.modelcraft_tmp() + "/modelcraft.mtz",
            "",  # placeholder for legend file
            "view-update",
            5000,  # milliseconds update interval
            json.dumps(webcoot_options),
            "[" + str(self.job_id).zfill(4) + "] Modelcraft current structure",
            "Build in progress",
            gridId,0,3
        )
        # self.rvrow -= 1
        self.rvrow += 1

        self.flush()

        job_params = dict(
            max_init_residues = int(mres/10 + 1)* 10,
            max_init_r_factor = 0.4,
            max_cycles = self.getParameter(sec1.NCYCLES_MAX)
        )
        self.setModelCraftLogParser ( "report",job_params )

        rc = self.runApp ( "modelcraft",cmd,logType="Main",quitOnError=False )

        self.unsetLogParser()

        self.addCitations ([
            'modelcraft','refmacat','cbuccaneer','cparrot','coot'
        ])

        # remove progress spinner
        self.putMessage1 ( self.report_page_id()," ",rvrow0 )

        have_results = False

        # self.rvrow -= 1

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>Failed to build structure</h3>" )

        # check solution and register data
        else:
            mmcifout = os.path.join ( self.modelcraft_tmp(),self.modelcraft_mmcif() )
            mtzout   = os.path.join ( self.modelcraft_tmp(),self.modelcraft_mtz  () )
            jsonout  = os.path.join ( self.modelcraft_tmp(),self.modelcraft_json () )

            asuNres  = revision.ASU.nRes
            final    = None
            Compl    = 0.0
            Nres     = "??"
            Nwat     = "??"
            Rwork    = "??"
            Rfree    = "??"
            verdict_rvrow = self.rvrow
            if os.path.isfile(jsonout):
                with open(jsonout) as json_file:
                    data = json.load ( json_file )
                    if "final" in data:
                        final  = data["final"]
                        Nbuilt = str(final["residues"])
                        Nwat   = str(final["waters"])
                        Rwork  = str(final["r_work"])
                        Rfree  = str(final["r_free"])
                        Compl  = 100.0*int(Nbuilt)/asuNres
                        self.putMessage ( "<h3>Completion status: <i>" +\
                                          data["termination_reason"] + "</i></h3>" )
                        verdict_rvrow = self.rvrow

            if os.path.isfile(mmcifout) and os.path.isfile(mtzout) and final:

                self.rvrow = verdict_rvrow + 5

                pdbout = os.path.join ( self.modelcraft_tmp(),self.modelcraft_pdb() )
                st = gemmi.read_structure ( mmcifout )
                if mmcif_utils.translate_to_pdb(st,pdbout):
                    st.make_mmcif_document().write_file ( mmcifout )
                    # self.stderrln ( " >>>>>>> p1" )
                    # st.setup_entities()
                    # st.shorten_chain_names()
                    # st.write_pdb ( pdbout )
                    # st.make_mmcif_document().write_file ( mmcifout )
                else:
                    pdbout = None

                self.putTitle ( "Built Structure" +\
                                self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )

                structure = self.registerStructure (
                                    mmcifout,
                                    pdbout,
                                    None,
                                    mtzout,
                                    leadKey = 1,
                                    refiner = "refmac" 
                                )
                if structure:
                    structure.copy_refkeys_parameters ( istruct )
                    structure.copyAssociations ( istruct )
                    structure.addSubtypes      ( istruct.subtype )
                    structure.removeSubtype    ( dtype_template.subtypeSubstructure() )
                    structure.setXYZSubtype    ()
                    structure.addPhasesSubtype ()
                    structure.copyLabels       ( istruct )
                    structure.setRefmacLabels  ( None    )
                    structure.copyLigands      ( istruct )
                    #structure.FP         = istruct.FP
                    #structure.SigFP      = istruct.SigFP
                    #structure.FreeR_flag = istruct.FreeR_flag
                    # structure.HLA = "HLACOMB"
                    # structure.HLB = "HLBCOMB"
                    # structure.HLC = "HLCCOMB"
                    # structure.HLD = "HLDCOMB"
                    # structure.FOM = ''
                    structure.FP         = labin_fo[0]
                    structure.SigFP      = labin_fo[1]
                    structure.FreeR_flag = labin_fo[2]

                    # mmmmcifout = self.getMMCIFOFName()
                    # os.rename ( mmcifout,mmmmcifout )
                    # structure.add_file ( mmmmcifout,self.outputDir(),"mmcif",copy_bool=False )

                    self.putStructureWidget    ( "structure_btn",
                                                 "Structure and electron density",
                                                 structure )
                    # update structure revision
                    revision.setStructureData  ( structure )
                    #revision.removeSubtype     ( dtype_template.subtypeSubstructure() )
                    self.registerRevision      ( revision  )
                    have_results = True

                    metrics = {
                        "N_built"  : int(Nbuilt),
                        "N_wat"    : int(Nwat),
                        "compl"    : float(Compl),
                        "R_factor" : float(Rwork),
                        "R_free"   : float(Rfree)
                    }

                    rvrow0 = self.rvrow
                    if pdbout:
                        try:
                            qrmeta = qualrep.quality_report ( self,revision )
                            metrics["clashscore"] = qrmeta["clashscore"]
                            if "EDCC" in qrmeta:
                                metrics["EDCC"] = qrmeta["EDCC"]
                            self.stderrln ( str(qrmeta) )
                        except:
                            self.stderr ( " *** molprobity failure" )
                            self.rvrow = rvrow0

                    rvrow0     = self.rvrow
                    self.rvrow = verdict_rvrow
                    verdict_modelcraft.putVerdictWidget ( self,metrics )
                    self.rvrow = rvrow0

                    self.generic_parser_summary["modelcraft"] = {
                        "summary_line" : "Compl={0:.1f}%".format(Compl) +\
                                         ", R=" + Rwork +\
                                         " R<sub>free</sub>="  + Rfree,
                        "R_factor"     : Rwork,
                        "R_free"       : Rfree
                    }
                        
                    if self.task.autoRunName.startswith("@"):
                        # scripted workflow framework
                        auto_workflow.nextTask ( self,{
                                "data" : {
                                    "revision" : [revision]
                                },
                                "scores" :  {
                                    "Rfactor"  : float(Rwork),
                                    "Rfree"    : float(Rfree)
                                }
                        })
                        # self.putMessage ( "<h3>Workflow started</hr>" )

                    else:  # pre-coded workflow framework
                        auto.makeNextTask ( self,{
                            "revision"     : revision,
                            "summary_line" : "Compl={0:.1f}%".format(Compl) +\
                                             ", R=" + Rwork +\
                                             " R<sub>free</sub>="  + Rfree,
                            "Rfactor"      : Rwork,
                            "Rfree"        : Rfree
                        }, log=self.file_stderr)

            else:
                self.putTitle ( "No Output Generated" )


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ModelCraft ( "",os.path.basename(__file__) )
    drv.start()
