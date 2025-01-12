##!/usr/bin/python

# *** TO BE RETIRED (19.10.19)

#
# ============================================================================
#
#    15.07.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MATTHEWS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python matthews.py jobManager jobDir jobId
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
from  pycofe.tasks  import asudef


# ============================================================================
# Make ASUMod driver

class ASUMod(asudef.ASUDef):

    # make task-specific definitions
    def matthews_report(self):  return "refmac_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the TEMPORARY XML file.
        if os.path.isfile(self.getXMLFName()):
            os.remove(self.getXMLFName())

        # Prepare matthews input

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )

        hkl = None
        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )
        else:
            hkl = self.makeClass ( self.input_data.data.hkl0[0] )

        sec1           = self.task.parameters.sec1.contains
        altEstimateKey = self.getParameter ( sec1.ESTIMATE_SEL )
        nRes           = self.getParameter ( sec1.NRES         )
        molWeight      = self.getParameter ( sec1.MOLWEIGHT    )
        seq            = []
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq       = self.input_data.data.seq
        elif altEstimateKey=='KE':
            seq       = self.input_data.data.seq0
            nRes      = revision0.ASU.nRes
            molWeight = revision0.ASU.molWeight

        revision = asudef.makeRevision ( self,hkl,seq,None,
                                         self.getParameter(sec1.COMPOSITION_SEL),
                                         altEstimateKey,nRes,molWeight,"",
                                         #self.getParameter(sec1.RESLIMIT),
                                         revision0=revision0 )

        have_results = False

        if revision:

            if hasattr(self.input_data.data,"hkl") and revision0.Structure:

                self.putMessage ( "<p>&nbsp;" )

                istruct   = self.makeClass ( self.input_data.data.istruct[0] )
                structure = self.finaliseStructure (
                            istruct.getPDBFilePath(self.inputDir()),
                            os.path.splitext(istruct.getPDBFileName())[0],hkl,
                            None,[],0,  # "0" means "XYZ"
                            leadKey=istruct.leadKey
                            # ,openState="closed"
                            )

                if not structure:
                    self.putMessage ( "<h3>Conversion failed, no output</h3>" )
                    revision = None
                else:
                    structure.copySubtype ( istruct   )
                    revision[0].setStructureData ( structure )

            if revision[0]:
                revision[0].addSubtypes ( revision0.subtype )
                self.registerRevision ( revision[0] )
                have_results = True

        else:
            self.putTitle   ( "Revision was not produced" )
            self.putMessage ( "This is likely to be a program bug, please " +\
                              "report to the maintainer" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ASUMod ( "",os.path.basename(__file__) )
    drv.start()
