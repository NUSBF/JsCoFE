##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    27.11.21   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from . import basic
from   pycofe.dtypes  import dtype_template
from   varut          import signal
from   pycofe.proc    import qualrep
from   pycofe.auto    import auto

# ============================================================================
# Make ModelCraft driver

class ModelCraft(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "modelcraft.script"

    # make task-specific definitions
    def modelcraft_seq  (self):  return "modelcraft.seq"
    def modelcraft_xyz  (self):  return "modelcraft.pdb"
    def modelcraft_mtz  (self):  return "modelcraft.mtz"
    def modelcraft_tmp  (self):  return "modelcraft_pipeline"

    # ------------------------------------------------------------------------

    def addCmdLine ( self,keyword,line ):
        self.write_stdin ( keyword + " " + line + "\n" )
        return

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When modelcraft
        # succeeds, this file is created.
        if os.path.isfile(self.modelcraft_xyz()):
            os.remove(self.modelcraft_xyz())

        if not os.path.exists(self.modelcraft_tmp()):
            os.makedirs(self.modelcraft_tmp())

        # Prepare modelcraft input
        # fetch input data

        idata   = self.input_data.data
        # sec1    = self.task.parameters.sec1.contains
        # sec2    = self.task.parameters.sec2.contains
        # sec3    = self.task.parameters.sec3.contains

        hkl     = self.makeClass ( idata.hkl[0]     )
        istruct = self.makeClass ( idata.istruct[0] )
        seq     = idata.seq

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
        cmd = [ "--contents",self.modelcraft_seq(),"--data",input_mtz ]
        if istruct.HLA:  #  experimental phases
            cmd += [ "--unbiased" ]
        else:  #  molecular replacement
            cmd += [ "--model", istruct.getXYZFilePath(self.inputDir()) ]

        # prepare report parser
        self.setGenericLogParser ( "modelcraft_report",True )

        # start modelcraft
        if sys.platform.startswith("win"):
            rc = self.runApp ( "modelcraft.bat",cmd,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "modelcraft",cmd,logType="Main",quitOnError=False )

        # self.addCitations ( ['modelcraft','refmac5'] )

        have_results = False

        # if rc.msg:
        #     self.flush()
        #     self.file_stdout.close()
        #     nobuild = False
        #     with (open(self.file_stdout_path(),'r')) as fstd:
        #         for line in fstd:
        #             if "0 residues were built in   0 fragments, the longest having    0 residues." in line:
        #                 nobuild = True
        #                 break
        #     self.file_stdout  = open ( self.file_stdout_path(),'a' )
        #     self.putTitle ( "Results" )
        #     if nobuild:
        #         self.putMessage ( "<h3>Failed to build structure</h3>" )
        #     else:
        #         self.putMessage ( "<h3>ModelCraft failure</h3>" )
        #         raise signal.JobFailure ( rc.msg )
        #
        # # check solution and register data
        # elif os.path.isfile(self.modelcraft_xyz()):
        #
        #     shutil.copyfile ( os.path.join(self.modelcraft_tmp(),"refine.mtz"),
        #                                    self.modelcraft_mtz() )
        #
        #     self.putTitle ( "Built Structure" +\
        #                 self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
        #     self.unsetLogParser()
        #
        #     # calculate maps for UglyMol using final mtz from temporary location
        #     #fnames = self.calcCCP4Maps ( self.modelcraft_mtz(),self.outputFName )
        #
        #     # register output data from temporary location (files will be moved
        #     # to output directory by the registration procedure)
        #
        #     structure = self.registerStructure (
        #                             self.modelcraft_xyz(),None,self.modelcraft_mtz(),
        #                             None,None,None,
        #                             #fnames[0],fnames[1],None,  -- not needed for new UglyMol
        #                             leadKey=1,refiner="refmac" )
        #     if structure:
        #         structure.copyAssociations ( istruct )
        #         structure.addSubtypes      ( istruct.subtype )
        #         structure.removeSubtype    ( dtype_template.subtypeSubstructure() )
        #         structure.setXYZSubtype    ()
        #         structure.copyLabels       ( istruct )
        #         structure.setRefmacLabels  ( None    )
        #         structure.copyLigands      ( istruct )
        #         #structure.FP         = istruct.FP
        #         #structure.SigFP      = istruct.SigFP
        #         #structure.FreeR_flag = istruct.FreeR_flag
        #         structure.FP         = labin_fo[0]
        #         structure.SigFP      = labin_fo[1]
        #         structure.FreeR_flag = labin_fo[2]
        #         self.putStructureWidget    ( "structure_btn",
        #                                      "Structure and electron density",
        #                                      structure )
        #         # update structure revision
        #         revision = self.makeClass  ( self.input_data.data.revision[0] )
        #         revision.setStructureData  ( structure )
        #         #revision.removeSubtype     ( dtype_template.subtypeSubstructure() )
        #         self.registerRevision      ( revision  )
        #         have_results = True
        #
        #         #self.copyTaskMetrics ( "refmac","R_factor","rfactor" )
        #         #self.copyTaskMetrics ( "refmac","R_free"  ,"rfree"   )
        #         #self.copyTaskMetrics ( "cmodelcraft","percentage","model_completeness" )
        #
        #         rvrow0 = self.rvrow
        #         try:
        #             qualrep.quality_report ( self,revision )
        #         except:
        #             self.stderr ( " *** molprobity failure" )
        #             self.rvrow = rvrow0
        #
        #         auto.makeNextTask ( self,{
        #             "revision" : revision,
        #             "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
        #             "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
        #         })
        #
        # else:
        #     self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ModelCraft ( "",os.path.basename(__file__) )
    drv.start()
