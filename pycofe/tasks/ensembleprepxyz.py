#!/usr/bin/python

#
# ============================================================================
#
#    16.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLEPREPXYZ EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembleprepxyz jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
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
import pyrvapi
import gemmi
#from   mrbump.output import modelout

#  application imports
from   pycofe.tasks  import basic
from   pycofe.proc   import analyse_ensemble
from   pycofe.dtypes import dtype_template, dtype_sequence

"""
Unmodified: does not fetch chains
PDBClip: does not remove HOH
RNA/DNA: only "Unmodified and PDBCLip" with above defects
"""


"""
JOBID 21
ROOTDIR /Users/eugene/tmp/ShelxEi1
RLEVEL 95
RESHTML /Users/eugene/tmp/ShelxEi1/results_21.html
MRNUM 50
ENSNUM 1
ENSMODNUM 1
MAPROGRAM MAFFT
DEBUG 0
SCOPSEARCH 0
SSMSEARCH 0
PQSSEARCH 0
MDLU 0
MDLD 0
MDLM 1
MDLC 1
MDLS 1
MDLP 0
FASTALOCAL 0
UPDATE 0
DOFASTA 0
DOPHMMER 0
EVALUE 0.02
NMASU 1
IGNORE
INCLUDE
HTMLOUT 0
CHECK 1
CLUSTER 0
DOHHPRED 0
HHSCORE 1
GEST 1
GESE 1
USEENSEM 1
LOCALFILE /Users/eugene/Projects/jsCoFE/data/4GOS/4i0k_homolog_035.pdb CHAIN A
LOCALFILE /Users/eugene/Projects/jsCoFE/data/4GOS/1py9_homolog_025.pdb CHAIN A
END
"""

# ============================================================================
# Make Ensembler driver

class EnsemblePrepXYZ(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return "mrbump.script"

    # make task-specific definitions
    def outdir_name    (self):  return "a"
    def mrbump_report  (self):  return "mrbump_report"
    def gesamt_report  (self):  return "gesamt_report"

    # ------------------------------------------------------------------------

    def delete_ligands_and_waters ( self,modSel,fpath_in,fpath_out ):
        self.stdoutln ( str(dir(gemmi)) )
        st = gemmi.read_structure ( fpath_in )
        st.setup_entities()
        if modSel=="U":
            st.remove_waters()
        else:
            st.remove_ligands_and_waters()
        st.remove_empty_chains()
        st.write_pdb ( fpath_out )
        return

    def read_models ( self ):
        model_xyz = []
        with open(os.path.join("search_"+self.outdir_name(),"logs","models.json")) as json_file:
            model_dictionary = json.load ( json_file )
            for model in model_dictionary.keys():
                model_xyz.append ( model_dictionary[model][15] )
        return model_xyz

    def run(self):

        # Prepare ensembler input
        # fetch input data

        self.stdoutln ( " ***** " + str(dir(gemmi)) )

        seq = None
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq = self.makeClass ( self.input_data.data.seq[0] )

        xyz = self.input_data.data.xyz
        nmodels = 0
        BF_correction = "none"
        for i in range(len(xyz)):
            xyz[i]  = self.makeClass ( xyz[i] )
            nmodels = max ( nmodels,len(xyz[i].xyzmeta.xyz) )
            if (xyz[i].BF_correction!="none") and (xyz[i].BF_correction!="pdb"):
                BF_correction = xyz[i].BF_correction

        self.fixBFactors ( xyz )

        if nmodels>1:
            self.putTitle   ( "Unsuitable coordinate data" )
            self.putMessage ( "<i>One or more coordinate objects contains "   +\
                              "several models, which is not suitable. Split " +\
                              "objects into individual chains, using the <b>" +\
                              "Coordinate Utilities<b> task), and repeat "    +\
                              "ensemble making.</i>" )
            self.generic_parser_summary["ensembleprepxyz"] = {
              "summary_line" : "no ensembles generated"
            }
            self.fail ( "","Unsuitable coordinate data" )
            return

        # Just in case (of repeated run) remove ensemble output xyz file. When
        # ensembler succeeds, this file is created.

        if not self.outputFName:
            if seq:
                self.outputFName = os.path.splitext(seq.getSeqFileName())[0]
            else:
                self.outputFName = os.path.splitext(xyz[0].getPDBFileName())[0]

        outputFile = self.getXYZOFName()

        if os.path.isfile(outputFile):
            os.remove ( outputFile )

        sec1 = self.task.parameters.sec1.contains
        #sec2 = self.task.parameters.sec2.contains
        #sec3 = self.task.parameters.sec3.contains

        modSel = ""
        csMode = None
        if seq:
            modSel = self.getParameter ( sec1.MODIFICATION_SEL )
            csMode = self.getParameter ( sec1.CHAINSAW_MODE_SEL     )
            # if len(xyz)==1:
            #     modSel = self.getParameter ( sec1.MODIFICATION_SEL )
            # else:
            #     modSel = self.getParameter ( sec1.MODIFICATION_SEQ_MXYZ_SEL )
        else:
            modSel = self.getParameter ( sec1.MODNOSEQ_SEL )

        #  Use MrBump for ensemble preparation
        #  Make a file with input script for mrbump
        self.open_stdin()
        self.write_stdin (
            "JOBID "  + self.outdir_name() +\
            "\nMDLU " + str(modSel=="U")   +\
            "\nMDLD " + str(modSel=="D")   +\
            "\nMDLM " + str(modSel=="M")   +\
            "\nMDLC " + str(modSel=="C")   +\
            "\nMDLS " + str(modSel=="S")   +\
            "\nMDLP " + str(modSel=="P")   +\
            "\nENSNUM 1"        +\
            "\nENSMODNUM 1"     +\
            "\nSCOPSEARCH 0"    +\
            "\nSSMSEARCH 0"     +\
            "\nPQSSEARCH 0"     +\
            "\nFASTALOCAL 0"    +\
            "\nUPDATE 0"        +\
            "\nDOFASTA 0"       +\
            "\nEVALUE 0.02"     +\
            "\nNMASU 1"         +\
            "\nIGNORE"          +\
            "\nINCLUDE"         +\
            "\nHTMLOUT 0"       +\
            "\nCHECK 1"         +\
            "\nCLUSTER 0"       +\
            "\nHHSCORE 1"       +\
            "\nCHECK False"     +\
            "\nUPDATE False"    +\
            "\nPICKLE False"    +\
            "\nMRNUM " + str(len(xyz)) +\
            "\nUSEE True"       +\
            "\nSCOP False"      +\
            "\nDEBUG False"     +\
            #"RLEVEL " + self.getParameter(self.task.parameters.sec1.contains.RLEVEL_SEL,False) + "\n" + \
            "\nGESE True"       +\
            "\nGEST True"       +\
            "\nAMPT False"      +\
            "\nLITE True"       + \
            "\nMAPROGRAM MAFFT" +\
            "\nDOPHMMER False"  +\
            "\nDOHHPRED False"
        )

        """
        ROOTDIR /Users/eugene/tmp/ShelxEi1
        RLEVEL 95
        RESHTML /Users/eugene/tmp/ShelxEi1/results_21.html
        """

        for i in range(len(xyz)):
            self.write_stdin ( "\nLOCALFILE " + xyz[i].getPDBFilePath(self.inputDir()) )
            if xyz[i].chainSel!="(all)" and xyz[i].chainSel.strip():
                self.write_stdin ( " CHAIN " + xyz[i].chainSel )

        self.write_stdin ( "\nEND\n" )
        self.close_stdin()

        # make command-line parameters for mrbump run on a SHELL-type node
        seqPath = None
        cmd     = []
        if seq:
            seqPath = seq.getSeqFilePath ( self.inputDir() )
            cmd     = [ "seqin",seqPath ]
        else:
            fake_seq_fpath = "__fake.seq"
            seqf = open(fake_seq_fpath,"w")
            seqf.write ( ">fake_sequence\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n" )
            seqf.close()
            cmd = [ "seqin",fake_seq_fpath ]

        # Prepare report parser
        self.setGenericLogParser ( self.mrbump_report(),True )

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "mrbump.bat",cmd,logType="Main" )
        else:
            self.runApp ( "mrbump",cmd,logType="Main" )

        # check solution and register data
        self.unsetLogParser()

        #if modSel=="M": self.addCitations ( ['molrep'] )
        #if modSel=="C": self.addCitations ( ['chainsaw'] )
        #if modSel=="S": self.addCitations ( ['sculptor'] )
        #if modSel=="P": self.addCitations ( ['chainsaw'] )

        search_dir = "search_" + self.outdir_name()

        with open(os.path.join(search_dir,"logs","programs.json")) as json_file:
            self.addCitations ( json.loads(json_file.read()) )

        have_results = False
        ensNo        = 0

        if len(xyz)<=1:
            #  single file output

            model_xyz = self.read_models()

            if len(model_xyz)<=0:
                self.putTitle ( "No output files created" )
                self.fail ( "","No output files created" )
                return

            else:

                outputFile = self.getXYZOFName()
                #self.delete_ligands_and_waters ( modSel,
                #            os.path.join(models_dir,model_xyz[0]),outputFile )
                self.delete_ligands_and_waters ( modSel,model_xyz[0],outputFile )

                if not os.path.isfile(outputFile):
                    self.putTitle ( "No output files found" )
                    self.fail ( "","No output files found" )
                    return

                else:

                    temp = dtype_template.DType ( self.job_id )
                    for c in xyz:
                        temp.addSubtypes ( c.subtype )
                    temp.removeSubtypes ([
                        dtype_template.subtypeHKL         (),
                        dtype_template.subtypeAnomalous   (),
                        dtype_template.subtypeASU         (),
                        dtype_template.subtypeSequence    (),
                        dtype_template.subtypeXYZ         (),
                        dtype_template.subtypeSubstructure(),
                        dtype_template.subtypeAnomSubstr  (),
                        dtype_template.subtypePhases      (),
                        dtype_template.subtypeLigands     (),
                        dtype_template.subtypeWaters      ()
                    ])

                    align_meta = analyse_ensemble.align_seq_xyz ( self,
                                        seqPath,outputFile,seqtype="protein" )

                    ensemble = self.registerEnsemble ( temp.subtype,outputFile,checkout=True )
                    if ensemble:
                        ensemble.BF_correction = BF_correction
                        self.stdoutln ( str(ensemble.xyzmeta) )
                        if seq:
                            ensemble.putSequence ( seq )
                        self.putTitle ( "Results" )
                        if len(xyz)>1:
                            self.putSection ( self.gesamt_report(),"Structural alignment" )
                            analyse_ensemble.run ( self,self.gesamt_report(),ensemble )
                        else:
                            ensemble.meta = { "rmsd" : "", "seqId" : "", "eLLG" : "" }
                            self.putMessage (
                                "<h3>Generated single-model ensemble (" +\
                                str(ensemble.xyzmeta["xyz"][0]["chains"][0]["size"]) +\
                                " residues)</h3>" )

                        if not seq:
                            ensemble.meta["seqId"] = ""
                            self.dataSerialNo += 1
                            seq = dtype_sequence.DType ( self.job_id )
                            seq.setSeqFile   ( "(unknown)" )
                            seq.makeDName ( self.dataSerialNo )
                            seq.removeFiles()  # no files associated with unknown sequence
                            seq.setSubtype  ( "unknown" )
                            self.outputDataBox.add_data ( seq )
                            self.putMessage ( "<b>Associated with auto-generated " +\
                                              "unknown sequence:</b>&nbsp;" +\
                                              seq.dname + "<br>&nbsp;" )
                        else:
                            self.putMessage ( "<b>Associated with sequence:</b>&nbsp;" +\
                                              seq.dname + "<br>&nbsp;" )
                            if align_meta["status"]=="ok":
                                ensemble.meta["seqId"] = align_meta["id_avg"]

                        ensemble.seqId = ensemble.meta["seqId"]
                        ensemble.rmsd  = ensemble.meta["rmsd" ]

                        self.putEnsembleWidget ( "ensemble_btn","Coordinates",ensemble )
                        ensemble.addDataAssociation ( seq.dataId )
                        ensemble.sequence = seq
                        seq_file_name = seq.getSeqFileName()
                        if seq_file_name:
                            ensemble.setSeqFile ( seq_file_name )
                            os.rename ( seq.getSeqFilePath(self.inputDir()),
                                        seq.getSeqFilePath(self.outputDir()) )
                        else:
                            ensemble.setSubtype ( "sequnk" )
                        have_results = True
                        ensNo += 1

        else:
            #  ensemble output

            # ensembles_found = False;
            ensembleSerNo   = 0
            file_order      = ["BaseAlignment","100.0","75.0","50.0","25.0"]

            model_xyz  = []
            models_dir = os.path.join ( search_dir,"models","domain_1","ensembles" )
            if os.path.isdir(models_dir):
                model_xyz = [fn for fn in os.listdir(models_dir)
                             if any(fn.endswith(ext) for ext in [".pdb"])]

            if len(model_xyz)<=0:
                self.putTitle ( "No output files created" )
                self.fail ( "","No output files created" )
                return

            self.file_stdout.write ( " ****** " + str(model_xyz) )

            for fo in file_order:
                for filename in model_xyz:
                    if fo in filename:

                        if ensembleSerNo==0:
                            # ensembles_found = True
                            self.putTitle ( "Ensembles generated" )
                            if not seq:
                                self.putMessage (
                                    "&nbsp;<br><span style=\"font-size:100%;color:maroon;\">" +\
                                    "<b>NOTE:</b> template sequence is not given; 100% "+\
                                    "sequence identity assumed.</span>"
                                )

                        ensembleSerNo += 1
                        if fo=="BaseAlignment":
                            fout_name = self.outputFName + "_base.pdb"
                        else:
                            fout_name = self.outputFName + "_" + fo + ".pdb"

                        self.delete_ligands_and_waters ( modSel,
                                    os.path.join(models_dir,filename),fout_name )

                        align_meta = analyse_ensemble.align_seq_xyz ( self,
                                            seqPath,fout_name,seqtype="protein" )

                        if seq:
                            ensemble = self.registerEnsemble ( seq,fout_name,checkout=True )
                        else:
                            ensemble = self.registerEnsemble ( xyz[0].getSubtypes(),fout_name,checkout=True )

                        if ensemble:

                            ensemble.BF_correction = BF_correction

                            self.putMessage ( "<h3>Ensemble #" + str(ensembleSerNo) + "</h3>" )

                            alignSecId = self.getWidgetId ( self.gesamt_report() )
                            pyrvapi.rvapi_add_section ( alignSecId,
                                        "Structural alignment",self.report_page_id(),
                                        self.rvrow,0,1,1,False )

                            self.rvrow += 1
                            if analyse_ensemble.run(self,alignSecId,ensemble):

                                if seq:
                                    ensemble.addDataAssociation ( seq.dataId )
                                    self.putMessage ( "&nbsp;<br><b>Associated with sequence:</b>&nbsp;" +\
                                                      seq.dname + "<br>&nbsp;" )

                                if seq:
                                    if align_meta["status"]=="ok":
                                        ensemble.meta["seqId"] = str(100.0*float(align_meta["id_avg"]))
                                else:
                                    ensemble.meta["seqId"] = "100.0"
                                ensemble.seqId = ensemble.meta["seqId"]
                                ensemble.rmsd  = ensemble.meta["rmsd" ]

                                self.putEnsembleWidget ( "ensemble_"  + str(ensembleSerNo) + "_btn",
                                                         "Coordinates",ensemble )
                                have_results = True
                                ensNo += 1

                            else:
                                self.putMessage1 ( alignSecId,
                                    "<h3>Structural alignment failed, ensemble is not useable.</h3>",0 )
                            self.putMessage ( "&nbsp;" )

        # close execution logs and quit

        # apparently log parser completes action when stdout is closed. this
        # may happen after STOP_POLL is issued, in which case parser's report
        # is not seen until the whole page is reloaded.
        #  is there a way to flush generic parser at some moment?
        time.sleep(1)

        # this will go in the project tree job's line
        if ensNo>0:

            protocol = "(unmodified)"
            if modSel=="D":
                protocol = "(clipped)"
            elif modSel=="M":
                protocol = "(molrep protocol)"
            elif modSel=="S":
                protocol = "(sculptor protocol #" + sclpSel + ")"
            elif modSel=="C":
                protocol = "(chainsaw "
                if   csMode=="MIXS":  protocol += "to gamma atoms)"
                elif csMode=="MIXA":  protocol += "to beta atoms)"
                elif csMode=="MAXI":  protocol += "to last common atoms)"
            elif modSel=="P":
                protocol = "(reduced to polyalanine)"

            self.generic_parser_summary["ensembleprepxyz"] = {
              "summary_line" : str(ensNo) + " ensemble(s) generated " + protocol
            }

        # unless deleted, symbolic links inside this directory will not let
        # it to be sent back to FE.
        shutil.rmtree ( search_dir )

        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepXYZ ( "",os.path.basename(__file__) )
    drv.start()
