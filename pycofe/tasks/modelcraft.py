##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    01.01.22   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os
import sys
import json

import gemmi

#  application imports
from . import basic
from   pycofe.dtypes   import dtype_template
from   varut           import signal, rvapi_utils
from   pycofe.proc     import qualrep
from   pycofe.verdicts import verdict_modelcraft
from   pycofe.auto     import auto


# ============================================================================
# Make ModelCraft driver

class ModelCraft(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "modelcraft.script"

    # make task-specific definitions
    def modelcraft_seq  (self):  return "modelcraft.seq"
    def modelcraft_pdb  (self):  return "modelcraft.pdb"
    def modelcraft_cif  (self):  return "modelcraft.cif"
    def modelcraft_mtz  (self):  return "modelcraft.mtz"
    def modelcraft_json (self):  return "modelcraft.json"
    def modelcraft_tmp  (self):  return "modelcraft_pipeline"

    # ------------------------------------------------------------------------

    def addCmdLine ( self,keyword,line ):
        self.write_stdin ( keyword + " " + line + "\n" )
        return

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When modelcraft
        # succeeds, this file is created.
        if os.path.isfile(self.modelcraft_cif()):
            os.remove(self.modelcraft_cif())

        if not os.path.exists(self.modelcraft_tmp()):
            os.makedirs(self.modelcraft_tmp())

        # Prepare modelcraft input
        # fetch input data

        idata    = self.input_data.data
        revision = self.makeClass ( idata.revision[0] )
        hkl      = self.makeClass ( idata.hkl[0]      )
        istruct  = self.makeClass ( idata.istruct[0]  )
        seq      = idata.seq
        sec1     = self.task.parameters.sec1.contains

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
        if istruct.HLA:  #  experimental phases
            labin_ph = [istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD]
            self.makePhasesMTZ (
                    hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
                    istruct.getMTZFilePath(self.inputDir()),labin_ph,
                    input_mtz )
            # else:  # MR phases
            #     labin_ph = [istruct.PHI,istruct.FOM]
        else:
            self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),labin_fo,
                            input_mtz )

        #self.makeFullASUSequenceFile ( seq,self.modelcraft_seq() )

        with open(self.modelcraft_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );
            else:
                newf.write ( ">polyUNK\nU\n" );

        # make command-line parameters
        cmd = [ "xray","--contents",self.modelcraft_seq(),"--data",input_mtz ]
        if istruct.HLA:  #  experimental phases
            cmd += [ "--unbiased" ]
        else:  #  molecular replacement
            cmd += [ "--model", istruct.getXYZFilePath(self.inputDir()) ]
        cmd += [
            "--cycles"          ,self.getParameter(sec1.NCYCLES_MAX),
            "--auto-stop-cycles",self.getParameter(sec1.NOIMPROVE_CYCLES),
            "--directory"       ,self.modelcraft_tmp()
        ]
        if hkl.detwin:
            cmd += [ "--twinned" ]
        if self.getParameter(sec1.MODE_SEL)=='basic':
            cmd += [ "--basic" ]

        self.putWaitMessageLF ( "Building in progress ..." )
        self.rvrow -= 1

        # prepare report parser
        self.setGenericLogParser ( "modelcraft_report",True )

        # start modelcraft
        if sys.platform.startswith("win"):
            rc = self.runApp ( "modelcraft.bat",cmd,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "modelcraft",cmd,logType="Main",quitOnError=False )

        self.unsetLogParser()

        self.addCitations ([
            'modelcraft','refmac5','cbuccaneer','cparrot','coot'
        ])

        have_results = False

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>Failed to build structure</h3>" )

        # check solution and register data
        else:
            cifout  = os.path.join ( self.modelcraft_tmp(),self.modelcraft_cif () )
            mtzout  = os.path.join ( self.modelcraft_tmp(),self.modelcraft_mtz () )
            jsonout = os.path.join ( self.modelcraft_tmp(),self.modelcraft_json() )

            asuNres = revision.ASU.nRes
            final   = None
            Compl   = 0.0
            Nres    = "??"
            Nwat    = "??"
            Rwork   = "??"
            Rfree   = "??"
            verdict_rvrow = self.rvrow
            if os.path.isfile(jsonout):
                with open(jsonout) as json_file:
                    data   = json.load ( json_file )
                    final  = data["final"]
                    Nbuilt = str(final["residues"])
                    Nwat   = str(final["waters"])
                    Rwork  = str(final["r_work"])
                    Rfree  = str(final["r_free"])
                    Compl  = 100.0*int(Nbuilt)/asuNres
                    self.putMessage ( "<h3>Completion status: <i>" +\
                                      data["termination_reason"] + "</i></h3>" )
                    verdict_rvrow = self.rvrow
                    # tdict = {
                    #     "title": "Build summary",
                    #     "state": 0, "class": "table-blue", "css": "text-align:right;",
                    #     "rows" : [
                    #         { "header": { "label"  : "No<sub>residues</sub>",
                    #                       "tooltip": "Number of built residues"},
                    #           "data"  : [ Nbuilt + " ({0:.1f}%)".format(Compl) ]},
                    #         { "header": { "label"  : "N<sub>waters</sub>",
                    #                       "tooltip": "Number of placed water molecules"},
                    #           "data"  : [ Nwat ]},
                    #         { "header": { "label"  : "R<sub>work</sub>",
                    #                       "tooltip": "R-factor"},
                    #           "data"  : [ Rwork ]},
                    #         { "header": { "label"  : "R<sub>free</sub>",
                    #                       "tooltip": "Free R-factor"},
                    #           "data"  : [ Rfree ]}
                    #     ]
                    # }
                    # rvapi_utils.makeTable ( tdict, self.getWidgetId("score_table"),
                    #             self.report_page_id(),
                    #             self.rvrow,0,1,1 )
                    # self.rvrow += 1

            self.rvrow = verdict_rvrow + 5

            if os.path.isfile(cifout) and os.path.isfile(mtzout) and final:


                pdbout = os.path.join ( self.modelcraft_tmp(),self.modelcraft_pdb() )
                st = gemmi.read_structure ( cifout )
                st.shorten_chain_names()
                st.write_pdb ( pdbout )

                self.putTitle ( "Built Structure" +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )

                structure = self.registerStructure (
                                        pdbout,None,mtzout,
                                        None,None,None,
                                        leadKey=1,refiner="refmac" )
                if structure:
                    structure.copyAssociations ( istruct )
                    structure.addSubtypes      ( istruct.subtype )
                    structure.removeSubtype    ( dtype_template.subtypeSubstructure() )
                    structure.setXYZSubtype    ()
                    structure.copyLabels       ( istruct )
                    structure.setRefmacLabels  ( None    )
                    structure.copyLigands      ( istruct )
                    #structure.FP         = istruct.FP
                    #structure.SigFP      = istruct.SigFP
                    #structure.FreeR_flag = istruct.FreeR_flag
                    structure.FP         = labin_fo[0]
                    structure.SigFP      = labin_fo[1]
                    structure.FreeR_flag = labin_fo[2]

                    mmcifout = self.getMMCIFOFName()
                    os.rename ( cifout,mmcifout )
                    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )

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

                    # auto.makeNextTask ( self,{
                    #     "revision" : revision,
                    #     "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                    #     "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                    # })

            else:
                self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ModelCraft ( "",os.path.basename(__file__) )
    drv.start()
