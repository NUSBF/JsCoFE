##!/usr/bin/python

#
# ============================================================================
#
#    24.09.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MOLREP-REFMAC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.molrep jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import uuid

#  application imports
from . import basic
from   pycofe.auto     import auto, auto_workflow
from   pycofe.verdicts import verdict_molrep
# from   pycofe.dtypes import dtype_template


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
                                  # will also work
        istruct  = revision.Structure
        if istruct:
            istruct = self.makeClass ( istruct )

        ligands  = None
        if hasattr(self.input_data.data,"ligands"):
            ligands = self.makeClass ( self.input_data.data.ligands[0] )

        #seq      = None
        #if model.sequence:
        #    seq = self.makeClass ( model.sequence )  # may work for DataEnsemble
        #    if (not seq.getSeqFileName()) or (model.nModels>1) or \
        #       (self.getParameter(self.task.parameters.sec3.contains.SEQ_CBX)!="True"):
        #        seq = None

        self.open_stdin()
        self.write_stdin (
            "file_m "  + model.getPDBFilePath(self.inputDir()) + "\n"
        )

        #if seq:
        #    self.write_stdin (
        #        "file_s "  + seq.getSeqFilePath(self.inputDir()) + "\n"
        #    )

        model_2 = None
        #if revision.hasSubtype(dtype_template.subtypeXYZ()):  # optional data parameter
        #    xstruct = self.makeClass ( revision.Structure )
        #    model_2 = xstruct.getPDBFilePath(self.inputDir())

        if hasattr(self.input_data.data,"xmodel"):
            xmodel  = self.makeClass ( self.input_data.data.xmodel[0] )
            model_2 = xmodel.getPDBFilePath(self.inputDir())

        if hasattr(self.input_data.data, "phases"):
            phases = self.makeClass ( self.input_data.data.phases[0] )
            # prf    = self.getParameter ( self.task.parameters.sec1.contains.PRF )
            prf    = revision.Options.ds_protocol
            self.write_stdin (
                "file_f "  + phases.getMTZFilePath(self.inputDir()) + "\n" + \
                "labin F=" + phases.FWT + " PH=" + phases.PHWT + \
                "\n" + \
                "prf " + prf + "\n" + \
                "sim -1\n"
            )
            self.write_stdin (
                "nref 0\n"
            )

            #if str(self.getParameter(self.task.parameters.sec4.contains.DISCARD_CBX)) == "True":
            #    model_2 = None

            if model_2:
                self.write_stdin (
                    "diff M\n"
                )

        else:
            self.write_stdin (
                "file_f " + hkl.getHKLFilePath(self.inputDir()) + "\n" + \
                "labin F=" + hkl.dataset.Fmean.value + " SIGF=" + hkl.dataset.Fmean.sigma + "\n"
            )

        if model_2:
            self.write_stdin (
                "model_2 " + model_2 + "\n"
            )

#?      Separate interface for search in the density.
#?      Add "FD" and "SIGFD" to labin (run of cad will be needed).
#!      Remove "nref 0" when "nref auto" will become available.

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
        self.setMolrepLogParser ( self.getWidgetId(self.molrep_report()) )

        # Run molrep
        self.runApp (
            "molrep",
            ["-i","-ps",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex)],
            logType="Main"
        )

        have_results = False

        row0 = self.rvrow + 1

        self.putMessage ( '&nbsp;' )

        libPath = None
        if ligands:
            libPath = ligands.getLibFilePath ( self.inputDir() )

        structure = self.finaliseStructure ( self.molrep_pdb(),self.outputFName,
                                hkl,libPath,[],0,leadKey=1, # openState="hidden",
                                title="Positioned Structure",reserveRows=3 )

        if structure:
            # update structure revision
            revision.setStructureData ( structure )
            self.registerRevision     ( revision  )
            have_results = True

            nfitted0 = 0
            if istruct:
                nfitted0 = istruct.getNofPolymers()

            rfactor = float ( self.generic_parser_summary["refmac"]["R_factor"] )
            rfree   = float ( self.generic_parser_summary["refmac"]["R_free"]   )

            # Verdict section

            verdict_meta = {
                "nfitted0" : nfitted0,
                "nfitted"  : structure.getNofPolymers(),
                "nasu"     : revision.getNofASUMonomers(),
                # "fllg"     : float ( llg ),
                # "ftfz"     : float ( tfz ),
                "rfree"    : rfree,
                "rfactor"  : rfactor
            }
            verdict_molrep.putVerdictWidget ( self,verdict_meta,row0 )

            if self.task.autoRunName.startswith("@"):
                # scripted workflow framework
                auto_workflow.nextTask ( self,{
                    "data" : {
                        "revision"  : [revision]
                    },
                    "scores" :  {
                        "Rfactor"  : rfactor,
                        "Rfree"    : rfree,
                        "nfitted0" : nfitted0,                  # number of polymers before run
                        "nfitted"  : structure.getNofPolymers() # number of polymers after run
                    }
                })

            else:  # pre-coded workflow framework
                auto.makeNextTask(self, {
                    "revision" : revision,
                    "Rfree"    : rfree,
                    "nfitted0" : nfitted0,                    # number of polymers before run
                    "nfitted"  : structure.getNofPolymers(),  # number of polymers after run
                    "nasu"     : revision.getNofASUMonomers() # number of predicted subunits
                }, log=self.file_stderr)

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Molrep ( "Molecular Replacement with Molrep",os.path.basename(__file__) )
    drv.start()
