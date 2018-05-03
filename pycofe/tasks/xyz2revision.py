##!/usr/bin/python

#
# ============================================================================
#
#    13.10.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  Xyz2Revision EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.Xyz2Revision.py exeType jobDir jobId
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

#  application imports
from   pycofe.tasks  import asudef

# ============================================================================
# Make Xyz2Revision driver

class Xyz2Revision(asudef.ASUDef):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare refmac input
        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        xyz = self.input_data.data.xyz[0]

        structure = self.finaliseStructure (
                            os.path.join(self.inputDir(),xyz.files[0]),
                            os.path.splitext(xyz.files[0])[0],hkl,None,
                            [],1,False ) # "1" means "after MR"

        if not structure:
            self.putMessage ( "<h3>Conversion failed, no output</h3>" )
        else:
            asudef.revisionFromStructure ( self,hkl,structure,
                                           os.path.splitext(xyz.files[0])[0] )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Xyz2Revision ( "",os.path.basename(__file__) )
    drv.start()
