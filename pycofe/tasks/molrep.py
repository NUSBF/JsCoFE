##!/usr/bin/python

#
# ============================================================================
#
#    09.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MOLREP-REFMAC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.molrep exeType jobDir jobId
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
import uuid

#  application imports
import basic
from   pycofe.dtypes import dtype_template


# ============================================================================
# Make Molrep driver

class Molrep(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "molrep.script"

    # make task-specific definitions
    def molrep_pdb     (self):  return "molrep.pdb"
    def molrep_report  (self):  return "molrep_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove molrep output xyz file. When molrep
        # succeeds, this file is created.

        if os.path.isfile(self.molrep_pdb()):
            os.remove(self.molrep_pdb())

        # Prepare molrep input -- script file

        revision = self.makeClass ( self.input_data.data.revision[0] )
        model    = self.makeClass ( self.input_data.data.model[0] )  # ensemble

        hkl      = self.makeClass ( revision.HKL )   # note that 'hkl' was added
                                  # to input databox by TaskMolrep.makeInputData(),
                                  # therefore, hkl=self.input_data.data.hkl[0]
                                  # would also work
        seq      = None
        #if hasattr(self.input_data.data,"seq"):  # optional data parameter
        #    seq = self.input_data.data.seq[0]    # given explicitly, will be used
        #elif model.sequence:
        if model.sequence:
            seq = self.makeClass ( model.sequence )  # may work for DataEnsemble
            if (not seq.getSeqFileName()) or (model.nModels>1) or \
               (self.getParameter(self.task.parameters.sec3.contains.SEQ_CBX)!="True"):
                seq = None

        self.open_stdin()
        self.write_stdin (
            "labin F=" + hkl.dataset.Fmean.value + \
            " SIGF="   + hkl.dataset.Fmean.sigma + "\n" + \
            "file_f "  + hkl.getHKLFilePath(self.inputDir())   + "\n" + \
            "file_m "  + model.getXYZFilePath(self.inputDir()) + "\n"
        )

        if seq:
            self.write_stdin (
                "file_s "  + seq.getSeqFilePath(self.inputDir()) + "\n"
            )

        #if "xyz" in revision.subtype:  # optional data parameter
        if revision.hasSubtype(dtype_template.subtypeXYZ()):  # optional data parameter
            xstruct = self.makeClass ( revision.Structure )
            self.write_stdin (
                "model_2 "  + xstruct.getXYZFilePath(self.inputDir()) + "\n"
            )
            prf = self.getParameter ( self.task.parameters.sec1.contains.PRF )
            if prf=="P":
                self.write_stdin ( "prf N\n" )
            else:
                if self.getParameter(self.task.parameters.sec1.contains.DIFF_CBX):
                    self.write_stdin ( "diff M\n" )
                self.write_stdin (
                    "sim -1\n" +\
                    "prf " + prf + "\n"
                )

        self.writeKWParameter ( self.task.parameters.sec1.contains.NMON   )
        self.writeKWParameter ( self.task.parameters.sec1.contains.NP     )
        self.writeKWParameter ( self.task.parameters.sec1.contains.NPT    )
        self.writeKWParameter ( self.task.parameters.sec1.contains.LOCK   )
        self.writeKWParameter ( self.task.parameters.sec1.contains.NSRF   )
        self.writeKWParameter ( self.task.parameters.sec1.contains.PST    )

        self.writeKWParameter ( self.task.parameters.sec2.contains.RESMAX )
        self.writeKWParameter ( self.task.parameters.sec2.contains.RESMIN )
        self.writeKWParameter ( self.task.parameters.sec2.contains.SIM    )
        self.writeKWParameter ( self.task.parameters.sec2.contains.ANISO  )

        self.writeKWParameter ( self.task.parameters.sec3.contains.SURF   )
        self.writeKWParameter ( self.task.parameters.sec3.contains.NMR    )

        self.writeKWParameter ( self.task.parameters.sec4.contains.PACK   )
        self.writeKWParameter ( self.task.parameters.sec4.contains.SCORE  )

        self.close_stdin()

        # Prepare report parser
        self.setMolrepLogParser ( self.molrep_report() )

        # Run molrep
        self.runApp (
            "molrep",
            ["-i","-ps",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex)]
        )

        self.putMessage ( '&nbsp;' );
        structure = self.finaliseStructure ( self.molrep_pdb(),self.outputFName,
                                hkl,None,[seq],1,False,"Positioned Structure" )

        if structure:
            # update structure revision
            revision.setStructureData ( structure )
            self.registerRevision     ( revision  )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Molrep ( "Molecular Replacement with Molrep",os.path.basename(__file__) )
    drv.start()
