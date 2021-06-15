##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    08.06.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PRIVATEER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.privateer jobManager jobDir jobId
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

#  python native imports
import os
import sys

#  application imports
from . import basic
# from   pycofe.dtypes    import dtype_structure
# from   pycofe.proc      import qualrep
# from   pycofe.verdicts  import verdict_refmac
# from   pycofe.auto      import auto


# ============================================================================
# Make Privateer driver

class Privateer(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "privateer.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare privateer input -- script file

        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        hkl      = self.makeClass ( revision.HKL )   # note that 'hkl' was added
                                  # to input databox by TaskPrivateer.makeInputData(),
                                  # therefore, hkl=self.input_data.data.hkl[0]
                                  # would also work

        cols = hkl.getMeanF()
        if cols[2]=="X":
            self.putTitle   ( "Unsuitable Data" )
            self.putMessage ( "No mean amplitudes found in the reflection dataset." )
            # this will go in the project tree line
            self.generic_parser_summary["privateer"] = {
              "summary_line" : "no mean amplitude data, therefore stop"
            }
            # close execution logs and quit
            self.success ( False )
            return

        reflections_mtz = "__reflections.mtz"
        FreeRColumn = hkl.getFreeRColumn()
        self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),
                        [cols[0],cols[1],FreeRColumn],
                        reflections_mtz,
                        ["F","SIGF",FreeRColumn] )

        # make command-line parameters for privateer
        cmd = [
            "-pdbin",istruct.getXYZFilePath(self.inputDir()),
            "-mtzin",reflections_mtz,
            "-mode" ,"ccp4i2"
        ]

        # run privateer
        if sys.platform.startswith("win"):
            self.runApp ( "privateer.bat",cmd,logType="Main" )
        else:
            self.runApp ( "privateer",cmd,logType="Main" )

        have_results = False

        # structure = self.runPrivateer ( hkl,istruct )
        #
        # have_results = False
        #
        # if structure:
        #     # update structure revision
        #     revision = self.makeClass  ( self.input_data.data.revision[0] )
        #     revision.setReflectionData ( hkl       )
        #     revision.setStructureData  ( structure )
        #     self.registerRevision      ( revision  )
        #     have_results = True
        #
        #     rvrow0 = self.rvrow
        #     try:
        #         meta = qualrep.quality_report ( self,revision )
        #     except:
        #         meta = None
        #         self.stderr ( " *** molprobity failure" )
        #         self.rvrow = rvrow0
        #
        #     if meta:
        #         verdict_meta = {
        #             "data"       : { "resolution" : hkl.getHighResolution(raw=True) },
        #             "params"     : None, # will be read from log file
        #             "molprobity" : meta,
        #             "xyzmeta"    : structure.xyzmeta
        #         }
        #         suggestedParameters = verdict_refmac.putVerdictWidget ( self,verdict_meta,self.verdict_row,
        #                                           refmac_log=self.refmac_log )
        #
        #         auto.makeNextTask(self, {
        #             "revision": revision,
        #             "Rfactor": self.generic_parser_summary["refmac"]["R_factor"],
        #             "Rfree": self.generic_parser_summary["refmac"]["R_free"],
        #             "suggestedParameters": suggestedParameters
        #         }, log=self.file_stderr)

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Privateer ( "Validation of carbohydrate structures with Privateer",
                      os.path.basename(__file__) )
    drv.start()
