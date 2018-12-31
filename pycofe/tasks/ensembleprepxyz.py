##!/usr/bin/python

#
# ============================================================================
#
#    23.12.18   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
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


# ============================================================================
# Make Ensembler driver

class EnsemblePrepXYZ(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "ensembler.script"

    # make task-specific definitions
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

        if len(xyz)>1:

            # make a file with input script
            self.open_stdin()

            self.write_stdin (
                "input" +\
                "\n{"
            )

            for i in range(len(xyz)):
                fpath  = xyz[i].getXYZFilePath ( self.inputDir() )
                if xyz[i].chainSel != "(all)":
                    base, ext = os.path.splitext ( xyz[i].getXYZFileName() )
                    fpath_sel = base + "_" + xyz[i].chainSel + ext
                    coor.fetchChains ( fpath,-1,[xyz[i].chainSel],True,True,fpath_sel )
                    self.write_stdin ( "\nmodel = " + fpath_sel )
                else:
                    self.write_stdin ( "\nmodel = " + fpath )
                #xyz[i].chainSel

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
                "\nmethod = "      + self.getParameter(self.task.parameters.sec1.contains.SUPERPOSITION_SEL,False) +\
                "\nconvergence = " + self.getParameter(self.task.parameters.sec2.contains.SUPCONV,False) +\
                "\n}"              +\
                "\nmapping = "     + self.getParameter(self.task.parameters.sec1.contains.MAPPING_SEL,False) +\
                "\natoms = "       + self.getParameter(self.task.parameters.sec2.contains.ATOMNAMES,False) +\
                "\nclustering = "  + self.getParameter(self.task.parameters.sec2.contains.CLUSTDIST,False) +\
                "\nweighting"      +\
                "\n{"              +\
                "\nscheme = "      + self.getParameter(self.task.parameters.sec1.contains.WEIGHTING_SEL,False) +\
                "\nconvergence = " + self.getParameter(self.task.parameters.sec2.contains.WEIGHTCONV,False) +\
                "\nincremental_damping_factor = " + self.getParameter(self.task.parameters.sec2.contains.WEIGHTDFACTOR,False) +\
                "\nmax_damping_factor = " + self.getParameter(self.task.parameters.sec2.contains.WEIGHTMAXDFACTOR,False) +\
                "\n"               + self.getParameter(self.task.parameters.sec1.contains.WEIGHTING_SEL,False) +\
                "\n{\n"            +\
                "\ncritical = "    + self.getParameter(self.task.parameters.sec1.contains.RRCRITICAL,False) +\
                "\n}"              +\
                "\n}"              +\
                "\ntrim = "        + self.getParameter(self.task.parameters.sec1.contains.TRIM_SEL,False) +\
                "\ntrimming"       +\
                "\n{"              +\
                "\nthreshold = "   + self.getParameter(self.task.parameters.sec1.contains.TTHRESH,False) +\
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
            xyz0  = self.makeClass ( xyz[0] )
            fpath = xyz0.getXYZFilePath ( self.inputDir() )
            coor.fetchChains ( fpath,-1,[xyz0.chainSel],True,True,outputFile )
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
