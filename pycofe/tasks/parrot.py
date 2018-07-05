##!/usr/bin/python

#
# ============================================================================
#
#    10.09.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PARROT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python parrot.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  application imports
import basic
from   pycofe.dtypes import dtype_sequence


# ============================================================================
# Make Molrep driver

class Parrot(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "parrot.script"

    # make task-specific definitions
    def parrot_seq      (self):  return "parrot.seq"
    def parrot_xyz      (self):  return "parrot.pdb"
    def parrot_mtz      (self):  return "parrot.mtz"
    def parrot_prefix   (self):  return "parrot"

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
        if os.path.isfile(self.parrot_xyz()):
            os.remove(self.parrot_xyz())

        # Prepare parrot input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

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

        """
        refname = os.path.join ( os.environ["CCP4"],"lib","data",
            "reference_structures",
            "reference-" + self.task.parameters.sec1.contains.REFMDL_SEL.value )

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
            "\nmtzin-wrk " + os.path.join(self.inputDir(),istruct.files[1]) + \
            "\ncolin-wrk-fo /*/*/["     + istruct.FP  + "," + istruct.SigFP + "]"
        )

        if istruct.HLA!="":
            self.write_stdin (
                "\ncolin-wrk-hl /*/*/[" + istruct.HLA + "," + istruct.HLB + \
                                    "," + istruct.HLC + "," + istruct.HLD + "]"
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

        if istruct.useForNCS:
            if istruct.hasMRSubtype() or istruct.hasEPSubtype():
                self.write_stdin (
                    "\npdbin-wrk-mr " + os.path.join(self.inputDir(),istruct.files[0]) )
            else:
                self.write_stdin (
                    "\npdbin-wrk-ha " + os.path.join(self.inputDir(),istruct.files[0]) )

        if istruct.hasMRSubtype() or istruct.hasEPSubtype():
            if hasattr(self.input_data.data,"ncs_substr"):
                self.write_stdin (
                    "\npdbin-wrk-ha " +\
                    os.path.join ( self.inputDir(),
                                   self.input_data.data.ncs_substr[0].files[0])
                )
        else:
            if hasattr(self.input_data.data,"ncs_struct"):
                self.write_stdin (
                    "\npdbin-wrk-mr " +\
                    os.path.join ( self.inputDir(),
                                   self.input_data.data.ncs_struct[0].files[0])
                )
        """

        self.open_stdin()
        self.write_stdin (
            "title Job "   + self.job_id.zfill(4) + \
            "\nmtzin " + os.path.join(self.inputDir(),istruct.files[1]) + \
            "\ncolin-fo /*/*/["     + istruct.FP  + "," + istruct.SigFP + "]"
        )

        if istruct.HLA!="":
            self.write_stdin (
                "\ncolin-hl /*/*/[" + istruct.HLA + "," + istruct.HLB + \
                                "," + istruct.HLC + "," + istruct.HLD + "]"
            )
        else:
            self.write_stdin (
                "\ncolin-phifom /*/*/[" + istruct.PHI + "," + istruct.FOM  + "]" + \
                "\ncolin-fc /*/*/["     + istruct.FWT + "," + istruct.PHWT + "]"
            )

        if istruct.FreeR_flag!="":
            self.write_stdin (
                "\ncolin-free /*/*/["   + istruct.FreeR_flag + "]"
            )

        if seq:
            self.write_stdin ( "\nseqin " + self.parrot_seq() )

        if istruct.useForNCS:
            if istruct.hasMRSubtype() or istruct.hasEPSubtype():
                self.write_stdin (
                    "\npdbin-mr " + os.path.join(self.inputDir(),istruct.files[0]) )
            else:
                self.write_stdin (
                    "\npdbin-ha " + os.path.join(self.inputDir(),istruct.files[0]) )

        if istruct.hasMRSubtype() or istruct.hasEPSubtype():
            if hasattr(self.input_data.data,"ncs_substr"):
                self.write_stdin (
                    "\npdbin-ha " +\
                    os.path.join ( self.inputDir(),
                                   self.input_data.data.ncs_substr[0].files[0])
                )
        else:
            if hasattr(self.input_data.data,"ncs_struct"):
                self.write_stdin (
                    "\npdbin-mr " +\
                    os.path.join ( self.inputDir(),
                                   self.input_data.data.ncs_struct[0].files[0])
                )

        self.write_stdin (
            "\nmtzout " + self.parrot_mtz() + \
            "\ncolout parrot"  +\
            "\nncs-average\n"  +\
            "\nsolvent-content " + str(revision.ASU.solvent) +\
            self.putKWParameter ( self.task.parameters.sec1.contains.SOLVENT_CBX   ) + \
            self.putKWParameter ( self.task.parameters.sec1.contains.HISTOGRAM_CBX ) + \
            #self.putKWParameter ( self.task.parameters.sec1.contains.NCSAVER_CBX   ) + \
            self.putKWParameter ( self.task.parameters.sec1.contains.ANISO_CBX     ) + \
            self.putKWParameter ( self.task.parameters.sec1.contains.NCYCLES       ) + \
            self.putKWParameter ( self.task.parameters.sec1.contains.RESMIN        ) + \
            self.putKWParameter ( self.task.parameters.sec1.contains.NCSRAD        )
            #self.putKWParameter ( self.task.parameters.sec1.contains.SOLVCONT      )
        )

        self.close_stdin()

        # make command-line parameters
        cmd = [ "-stdin" ]

        # prepare report parser
        self.setGenericLogParser ( "parrot_report",True )

        # start parrot
        self.runApp ( "cparrot",cmd )

        # close report parser
        self.unsetLogParser()

        # check solution and register data
        if os.path.isfile(self.parrot_mtz()):

            self.putTitle ( "Results" )

            # calculate maps for UglyMol using final mtz from temporary location
            fnames = self.calcCCP4Maps ( self.parrot_mtz(),self.parrot_prefix(),
                                         "parrot" )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            shutil.copyfile ( os.path.join(self.inputDir(),istruct.files[0]),
                              self.parrot_xyz() )
            if len(istruct.files)>3 and istruct.files[3]:
                shutil.copyfile ( os.path.join(self.inputDir(),istruct.files[3]),
                                  fnames[1] )

            structure = self.registerStructure (
                    self.parrot_xyz(),self.parrot_mtz(),fnames[0],fnames[1],None )

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

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Parrot ( "",os.path.basename(__file__) )
    drv.start()
