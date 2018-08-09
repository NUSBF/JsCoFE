#!/usr/bin/python

#
# ============================================================================
#
#    08.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BALBES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python balbes.py exeType jobDir jobId
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
import shutil

#  application imports
import basic
from pycofe.dtypes  import dtype_template


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
        hkl = self.input_data.data.hkl[0]
        seq = self.input_data.data.seq

        with open(self.balbes_seq(),'wb') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getFilePath(self.inputDir(),dtype_template.file_key["seq"]),'rb') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );

        # prepare mtz with needed columns -- this is necessary because BALBES
        # does not have specification of mtz columns on input (labin)

        labels  = ( hkl.dataset.Fmean.value,hkl.dataset.Fmean.sigma )
        cad_mtz = os.path.join ( self.inputDir(),"cad.mtz" )

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",os.path.join(self.inputDir(),hkl.files[0]),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd )

        # make command-line parameters for bare balbes run on a SHELL-type node

        workDir = "balbes"
        cmd     = [ "-o",workDir,
                    "-f",cad_mtz,
                    "-s",self.balbes_seq() ]
        #if task.parameters.sec1.contains.ALTGROUPS_CBX.value:
        #    cmd.append ( "-alt" )

        # run balbes
        self.runApp ( "balbes",cmd )

        pdb_path = os.path.join ( workDir,"results","refmac_final_result.pdb" )

        structure = self.finaliseStructure ( pdb_path,self.outputFName,hkl,None,
                                             seq,1,False )
        if structure:
            # update structure revision
            revision = self.makeClass ( self.input_data.data.revision[0] )
            revision.setStructureData ( structure )
            self.registerRevision     ( revision  )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Balbes ( "",os.path.basename(__file__) )
    drv.start()
