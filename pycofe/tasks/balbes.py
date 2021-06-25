#!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    25.06.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BALBES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python balbes.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  application imports
from . import basic


# ============================================================================
# Make Balbes driver

class Balbes(basic.TaskDriver):

    # make task-specific definitions
    def balbes_seq (self):  return "balbes.seq"

    # ------------------------------------------------------------------------

    def run(self):

        # check that balbes is installed (since it is not part of CCP4 distribution)
        if "BALBES_ROOT" not in os.environ:
            self.fail ( "<p>&nbsp; *** BALBES is not installed, or is not configured",
                       "balbes is not found")

        # Prepare balbes job

        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        seq = self.input_data.data.seq

        with open(self.balbes_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );

        # prepare mtz with needed columns -- this is necessary because BALBES
        # does not have specification of mtz columns on input (labin)

        labels  = ( hkl.dataset.Fmean.value,hkl.dataset.Fmean.sigma )
        cad_mtz = os.path.join ( self.inputDir(),"cad.mtz" )

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd,logType="Service" )

        # make command-line parameters for bare balbes run on a SHELL-type node

        workDir = "balbes"
        cmd     = [ "-o",workDir,
                    "-f",cad_mtz,
                    "-s",self.balbes_seq() ]
        #if task.parameters.sec1.contains.ALTGROUPS_CBX.value:
        #    cmd.append ( "-alt" )

        # run balbes
        self.runApp ( "balbes",cmd,logType="Main" )

        have_results = False

        pdb_path = os.path.join ( workDir,"results","refmac_final_result.pdb" )

        structure = self.finaliseStructure ( pdb_path,self.outputFName,hkl,None,
                                             seq,0,leadKey=1,openState_bool=False )
        if structure:
            # update structure revision
            revision = self.makeClass ( self.input_data.data.revision[0] )
            revision.setStructureData ( structure )
            self.registerRevision     ( revision  )
            have_results = True

        # this will go in the project tree job's line
        if not have_results:
            self.generic_parser_summary["balbes"] = {
              "summary_line" : "solution not found"
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Balbes ( "",os.path.basename(__file__) )
    drv.start()
