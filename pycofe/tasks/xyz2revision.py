##!/usr/bin/python

#
# ============================================================================
#
#    15.07.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  Xyz2Revision EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.Xyz2Revision.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from   pycofe.tasks  import dimple,asudef

# ============================================================================
# Make Xyz2Revision driver

class Xyz2Revision(dimple.Dimple,asudef.ASUDef):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare refmac input
        # fetch input data
        hkl  = self.makeClass ( self.input_data.data.hkl[0] )
        xyz  = self.makeClass ( self.input_data.data.xyz[0] )
        sec1 = self.task.parameters.sec1.contains

        self.outputFName = xyz.lessDataId ( os.path.splitext(xyz.getXYZFileName())[0] )
        if self.getParameter(sec1.USEDIMPLE_CBX)=="False":
            structure = self.finaliseStructure (
                                xyz.getXYZFilePath(self.inputDir()),
                                self.outputFName,hkl,None,
                                [],0,leadKey=1 ) # ,openState="closed" ) # "0" means "XYZ"

        else:
            structure = self.runDimple ( hkl,xyz )

        have_results = False

        if not structure:
            self.putMessage ( "<h3>Conversion failed, no output</h3>" )
        else:
            asudef.revisionFromStructure ( self,hkl,structure,
                                           os.path.splitext(xyz.getXYZFileName())[0] )
            have_results = True

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Xyz2Revision ( "",os.path.basename(__file__) )
    drv.start()
