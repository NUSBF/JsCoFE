##!/usr/bin/python

#
# ============================================================================
#
#    14.01.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLEPREPXYZ EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembleprepxyz exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
from   pycofe.proc   import analyse_ensemble, coor
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

    def run(self):

        # Prepare ensembler input
        # fetch input data

        seq = None
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq = self.makeClass ( self.input_data.data.seq[0] )

        xyz = self.input_data.data.xyz
        for i in range(len(xyz)):
            xyz[i] = self.makeClass ( xyz[i] )

        # Just in case (of repeated run) remove ensemble output xyz file. When
        # ensembler succeeds, this file is created.

        if not self.outputFName:
            if seq:
                self.outputFName = os.path.splitext(seq.getSeqFileName())[0]
            else:
                self.outputFName = os.path.splitext(xyz[0].getXYZFileName())[0]

        outputFile = self.getXYZOFName()

        if os.path.isfile(outputFile):
            os.remove ( outputFile )

        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains
        sec3 = self.task.parameters.sec3.contains

        modeSel = ""
        if seq:
            modSel = self.getParameter ( sec1.MODIFICATION_SEQ_SEL )
        else:
            modSel = self.getParameter ( sec1.MODIFICATION_NOSEQ_SEL )

        # make a file with input script for mrbump
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
            self.write_stdin ( "\nLOCALFILE " + xyz[i].getXYZFilePath(self.inputDir()) )
            if xyz[i].chainSel!="(all)":
                self.write_stdin ( " CHAIN " + xyz[i].chainSel )

        self.write_stdin ( "\nEND\n" )
        self.close_stdin()

        # make command-line parameters for mrbump run on a SHELL-type node
        cmd = [ "seqin",seq.getSeqFilePath(self.inputDir()) ]

        # Prepare report parser
        self.setGenericLogParser ( self.mrbump_report(),True )

        # Start mrbump
        if sys.platform.startswith("win"):
            self.runApp ( "mrbump.bat",cmd,logType="Main" )
        else:
            self.runApp ( "mrbump",cmd,logType="Main" )

        # check solution and register data
        self.unsetLogParser()

        if modSel=="M": self.addCitations ( ['molrep'] )
        if modSel=="C": self.addCitations ( ['chainsaw'] )
        if modSel=="S": self.addCitations ( ['sculptor'] )
        if modSel=="P": self.addCitations ( ['chainsaw'] )

        models_dir = ""
        if modSel=="U":
            models_dir = os.path.join ( "search_" + self.outdir_name(),"PDB_files" )
        else:
            models_dir = os.path.join ( "search_" + self.outdir_name(),"models" )
        model_xyz  = []
        if os.path.isdir(models_dir):
            model_xyz = [fn for fn in os.listdir(models_dir)
                        if any(fn.endswith(ext) for ext in [".pdb"])]

        for i in range(len(model_xyz)):
            model_xyz[i] = os.path.join ( models_dir,model_xyz[i] )

        if len(model_xyz)>1:

            # make a file with input script
            self.open_stdin()

            self.write_stdin (
                "input" +\
                "\n{"
            )

            for i in range(len(model_xyz)):
                self.write_stdin ( "\nmodel = " + model_xyz[i] )
                """
                fpath  = xyz[i].getXYZFilePath ( self.inputDir() )
                if xyz[i].chainSel != "(all)":
                    base, ext = os.path.splitext ( xyz[i].getXYZFileName() )
                    fpath_sel = base + "_" + xyz[i].chainSel + ext
                    coor.fetchChains ( fpath,-1,[xyz[i].chainSel],True,True,fpath_sel )
                    self.write_stdin ( "\nmodel = " + fpath_sel )
                else:
                    self.write_stdin ( "\nmodel = " + fpath )
                """

            output_style = "merged"

            self.write_stdin (
                "\n}"              +\
                "\noutput"         +\
                "\n{"              +\
                #"\nlocation = " + "./" +\  -- not needed, will write to current directory
                "\nroot = ensemble"+\
                "\nstyle = "       + output_style +\
                "\nsort = input"   +\
                "\n}"              +\
                "\nconfiguration"  +\
                "\n{"              +\
                "\nsuperposition"  +\
                "\n{"              +\
                "\nmethod = "      + self.getParameter(sec2.SUPERPOSITION_SEL,False) +\
                "\nconvergence = " + self.getParameter(sec3.SUPCONV,False) +\
                "\n}"              +\
                "\nmapping = "     + self.getParameter(sec2.MAPPING_SEL,False) +\
                "\natoms = "       + self.getParameter(sec3.ATOMNAMES,False) +\
                "\nclustering = "  + self.getParameter(sec3.CLUSTDIST,False) +\
                "\nweighting"      +\
                "\n{"              +\
                "\nscheme = "      + self.getParameter(sec2.WEIGHTING_SEL,False) +\
                "\nconvergence = " + self.getParameter(sec3.WEIGHTCONV,False) +\
                "\nincremental_damping_factor = " + self.getParameter(sec3.WEIGHTDFACTOR,False) +\
                "\nmax_damping_factor = " + self.getParameter(sec3.WEIGHTMAXDFACTOR,False) +\
                "\n"               + self.getParameter(sec2.WEIGHTING_SEL,False) +\
                "\n{\n"            +\
                "\ncritical = "    + self.getParameter(sec2.RRCRITICAL,False) +\
                "\n}"              +\
                "\n}"              +\
                "\ntrim = "        + self.getParameter(sec2.TRIM_SEL,False) +\
                "\ntrimming"       +\
                "\n{"              +\
                "\nthreshold = "   + self.getParameter(sec2.TTHRESH,False) +\
                "\n}"              +\
                "\n}\n"
            )

            self.close_stdin()

            # Start ensembler
            self.runApp ( "phaser.ensembler",["--stdin"],logType="Main" )

            #if len(xyz)==1:
            #    for file in os.listdir("."):
            #        if file.startswith("ensemble_X_X_"):
            #            os.rename ( file,outputFile )
            #            break
            os.rename ( "ensemble_merged.pdb",outputFile )

        else:
            # single xyz dataset on input
            outputFile = model_xyz[0]
            """
            xyz0  = self.makeClass ( xyz[0] )
            fpath = xyz0.getXYZFilePath ( self.inputDir() )
            coor.fetchChains ( fpath,-1,[xyz0.chainSel],True,True,outputFile )
            """
            #if xyz0.chainSel != "(all)":
            #    coor.fetchChains ( fpath,-1,[xyz0.chainSel],True,True,outputFile )
            #else:
            #    coor.fetchChains ( fpath,-1,['(all)'],True,True,outputFile )
            #    os.rename ( fpath,outputFile )

        if os.path.isfile(outputFile):

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
            ensemble = self.registerEnsemble ( temp.subtype,outputFile,checkout=True )
            if ensemble:
                if seq:
                    ensemble.putSequence ( seq )
                self.putTitle ( "Results" )
                if len(xyz)>1:
                    self.putSection ( self.gesamt_report(),"Structural alignment" )
                    analyse_ensemble.run ( self,self.gesamt_report(),ensemble )
                else:
                    ensemble.meta = None
                    ensemble.rmsd = 1.0  # just to put in something
                    self.putMessage (
                        "<h3>Generated single-model ensemble (" +\
                        str(ensemble.xyzmeta["xyz"][0]["chains"][0]["size"]) +\
                        " residues)</h3>" )

                if not seq:
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

        else:
            self.putTitle ( "No ensembles were made" )
            self.fail ( "","No ensemblies made" )
            return

        # close execution logs and quit

        # apparently log parser completes action when stdout is closed. this
        # may happen after STOP_POLL is issued, in which case parser's report
        # is not seen until the whole page is reloaded.
        #  is there a way to flush generic parser at some moment?
        import time
        time.sleep(1)

        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepXYZ ( "",os.path.basename(__file__) )
    drv.start()
