##!/usr/bin/python

#
# ============================================================================
#
#    01.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PARROT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python parrot.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

from future import *

#  python native imports
import os
import shutil

#  application imports
from . import basic
from   pycofe.dtypes import dtype_sequence


# ============================================================================
# Make Molrep driver

class Parrot(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "parrot.script"

    # make task-specific definitions
    def parrot_seq      (self):  return "parrot.seq"

    # ------------------------------------------------------------------------

    """
    /Applications/ccp4-7.0/bin/cparrot -stdin
    title [No title given]
    pdbin-ref /Applications/ccp4-7.0/lib/data/reference_structures/reference-1tqw.pdb
    mtzin-ref /Applications/ccp4-7.0/lib/data/reference_structures/reference-1tqw.mtz
    colin-ref-fo /*/*/[FP.F_sigF.F,FP.F_sigF.sigF]
    colin-ref-hl /*/*/[FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D]
    seqin-wrk /Users/eugene/Projects/jsCoFE/tmp/parrot/rnase.fasta
    mtzin-wrk /Users/eugene/Projects/jsCoFE/tmp/parrot/0206-01_rnase_model_1_B_map.mtz
    colin-wrk-fo /*/*/[FNAT,SIGFNAT]
    colin-wrk-phifom /*/*/[PHIC,FOM]
    colin-wrk-fc /*/*/[FWT,PHIC]
    colin-wrk-free /*/*/[FreeR_flag]
    pdbin-wrk-mr /Users/eugene/Projects/jsCoFE/tmp/parrot/0206-01_rnase_model_1_B_xyz.pdb
    mtzout /Users/eugene/Projects/QtCoFE/data/MR-REF_BUC/0206-01_rnase_model_1_B_map_parrot1.mtz
    colout parrot
    solvent-flatten
    histogram-match
    ncs-average
    anisotropy-correction
    cycles 3
    resolution 1.0
    ncs-mask-filter-radius 6.0
    """

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When parrot
        # succeeds, this file is created.
        #if os.path.isfile(self.parrot_xyz()):
        #    os.remove(self.parrot_xyz())

        # Prepare parrot input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        sec1     = self.task.parameters.sec1.contains

        seq = None
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq = self.input_data.data.seq
            self.makeFullASUSequenceFile ( seq,"prepared_for_parrot",self.parrot_seq() )
            #combseq = ""
            #for s in seq:
            #    seqstring = self.makeClass(s).getSequence ( self.inputDir() )
            #    for i in range(s.ncopies):
            #        combseq += seqstring
            #dtype_sequence.writeSeqFile ( self.parrot_seq(),"prepared_for_parrot",
            #                              combseq )

        ncs_struct = None
        if hasattr(self.input_data.data,"ncs_struct"):  # optional data parameter
            ncs_struct = self.makeClass ( self.input_data.data.ncs_struct[0] )

        refname = os.path.join ( os.environ["CCP4"],"lib","data",
            "reference_structures",
            "reference-" + sec1.REFMDL_SEL.value )

        self.open_stdin()
        self.write_stdin (
            "title Job "   + self.job_id.zfill(4) + \
            "\npdbin-ref " + refname + ".pdb" + \
            "\nmtzin-ref " + refname + ".mtz" + \
            "\ncolin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF" + \
            "\ncolin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D"
        )

        if seq:
            self.write_stdin ( "\nseqin-wrk " + self.parrot_seq() )

        self.write_stdin (
            "\nmtzin-wrk " + istruct.getMTZFilePath(self.inputDir()) + \
            "\ncolin-wrk-fo /*/*/["     + istruct.FP  + "," + istruct.SigFP + "]"
        )

        if istruct.HLA!="":
            self.write_stdin (
                "\ncolin-wrk-hl /*/*/[" + istruct.HLA + "," + istruct.HLB + \
                                    "," + istruct.HLC + "," + istruct.HLD + "]" +\
                "\ncolin-wrk-fc /*/*/["     + istruct.FWT + "," + istruct.PHWT + "]"
            )
        else:
            self.write_stdin (
                "\ncolin-wrk-phifom /*/*/[" + istruct.PHI + "," + istruct.FOM  + "]" + \
                "\ncolin-wrk-fc /*/*/["     + istruct.FWT + "," + istruct.PHWT + "]"
            )

        if istruct.FreeR_flag!="":
            self.write_stdin (
                "\ncolin-wrk-free /*/*/["   + istruct.FreeR_flag + "]"
            )

        ncs_xyz = None
        ncs_kwd = None
        ncycles = "3"
        if ncs_struct:
            if ncs_struct.hasSubSubtype():
                ncs_xyz = ncs_struct.getSubFilePath ( self.inputDir() )
                ncs_kwd = "pdbin-wrk-ha"
            elif ncs_struct.hasXYZSubtype():
                ncs_xyz = ncs_struct.getXYZFilePath ( self.inputDir() )
                ncs_kwd = "pdbin-wrk-mr"
            ncycles = "10"
        if ncs_kwd:
            self.write_stdin( "\n" + ncs_kwd + " " + ncs_xyz )
        if sec1.NCYCLES.value:
            ncycles = str(sec1.NCYCLES.value)

        solcont = float( revision.ASU.solvent )
        if solcont > 1.0:
            solcont /= 100.0

        output_file = self.getMTZOFName()
        self.write_stdin (
            "\nmtzout " + output_file + \
            "\ncolout parrot"  +\
            "\nncs-average"  +\
            "\nsolvent-content " + str( solcont ) + "\n"  +\
            "\ncycles " + ncycles + "\n" +
            self.putKWParameter ( sec1.SOLVENT_CBX   ) + \
            self.putKWParameter ( sec1.HISTOGRAM_CBX ) + \
            #self.putKWParameter ( sec1.NCSAVER_CBX   ) + \
            self.putKWParameter ( sec1.ANISO_CBX     ) + \
            #self.putKWParameter ( sec1.NCYCLES       ) + \
            self.putKWParameter ( sec1.RESMIN        ) + \
            self.putKWParameter ( sec1.NCSRAD        )
            #self.putKWParameter ( sec1.contains.SOLVCONT      )
        )

        self.close_stdin()

        # make command-line parameters
        cmd = [ "-stdin" ]

        # prepare report parser
        self.setGenericLogParser ( "parrot_report",True )

        # start parrot
        self.runApp ( "cparrot",cmd,logType="Main" )

        # close report parser
        self.unsetLogParser()

        # check solution and register data
        have_results = False
        if os.path.isfile(output_file):

            self.runApp ( "chltofom",[
                "-mtzin" ,output_file,
                "-mtzout","__tmp.mtz",
                "-colin-hl","/*/*/[parrot.ABCD.A,parrot.ABCD.B,parrot.ABCD.C,parrot.ABCD.D]",
                "-colout"  ,"parrot"
            ],logType="Service" )

            os.rename ( "__tmp.mtz",output_file )

            self.putTitle ( "Results" )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( output_file,self.outputFName,"parrot" )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            parrot_xyz = None
            parrot_sub = None
            if istruct.getXYZFileName():
                parrot_xyz = self.getXYZOFName()
                shutil.copyfile ( istruct.getXYZFilePath(self.inputDir()),parrot_xyz )
            if istruct.getSubFileName():
                parrot_sub = self.getOFName ( ".ha.pdb" )
                shutil.copyfile ( istruct.getSubFilePath(self.inputDir()),parrot_sub )
            #if istruct.getDMapFileName():
            #    shutil.copyfile ( istruct.getDMapFilePath(self.inputDir()),
            #                      fnames[1] )

            structure = self.registerStructure (
                    #parrot_xyz,parrot_sub,output_file,fnames[0],None,None,leadKey=2,
                    parrot_xyz,parrot_sub,output_file,None,None,None,leadKey=2,
                    map_labels="parrot.F_phi.F,parrot.F_phi.phi" )

            if structure:
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.setParrotLabels  ()
                self.putStructureWidget    ( "structure_btn",
                                             "Structure and electron density",
                                             structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setStructureData  ( structure )
                self.registerRevision      ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Parrot ( "",os.path.basename(__file__) )
    drv.start()
