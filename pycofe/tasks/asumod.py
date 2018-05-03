##!/usr/bin/python

#
# ============================================================================
#
#    06.02.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MATTHEWS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python matthews.py exeType jobDir jobId
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

#  application imports
from  pycofe.tasks  import asudef


# ============================================================================
# Make ASUMod driver

class ASUMod(asudef.ASUDef):

    # make task-specific definitions
    def matthews_report(self):  return "refmac_report"
    def getXMLFName    (self):  return "matthews.xml"
    def seq_table_id   (self):  return "seq_table"
    def res_table_id   (self):  return "res_table"

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

        revision = asudef.makeRevision ( self,hkl,seq,
                                       self.getParameter(sec1.COMPOSITION_SEL),
                                       altEstimateKey,nRes,molWeight,
                                       self.getParameter(sec1.RESLIMIT),
                                       revision0 )

        if revision:

            if hasattr(self.input_data.data,"hkl") and revision0.Structure:

                self.putMessage ( "<p>&nbsp;" )

                istruct = self.makeClass ( self.input_data.data.istruct[0] )
                structure = self.finaliseStructure (
                            os.path.join(self.inputDir(),istruct.files[0]),
                            os.path.splitext(istruct.files[0])[0],hkl,None,
                            [],1,False ) # "1" means "after MR"

                if not structure:
                    self.putMessage ( "<h3>Conversion failed, no output</h3>" )
                    revision = None
                else:
                    structure.copySubtype     ( istruct   )
                    revision[0].setStructureData ( structure )

            if revision[0]:
                revision[0].copySubtype  ( revision0 )
                self.registerRevision ( revision[0]  )

        else:
            self.putTitle   ( "Revision was not produced" )
            self.putMessage ( "This is likely to be a program bug, please " +\
                              "report to the maintainer" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = ASUMod ( "",os.path.basename(__file__) )
    drv.start()
