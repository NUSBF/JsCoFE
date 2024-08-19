##!/usr/bin/python

# LEGACY CODE, ONLY USED IN OLD PROJECTS   05.09.20  v.1.4.014

# not python-3 ready

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  EDIT ASU EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python editrevision_asu.py jobManager jobDir jobId
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

#  application imports
from  pycofe.dtypes  import dtype_structure
from  pycofe.tasks   import asudef
from  pycofe.proc    import makelib


# ============================================================================
# Make EditRevision driver

class EditRevisionASU(asudef.ASUDef):

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the TEMPORARY XML file.
        if os.path.isfile(self.getXMLFName()):
            os.remove(self.getXMLFName())

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )

        summary = []
        hkl     = None
        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )
            summary.append ( "hkl" )
        else:
            hkl = self.makeClass ( self.input_data.data.hkl0[0] )

        seq = []
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            for s in self.input_data.data.seq:
                seq.append ( self.makeClass(s) )
            summary.append ( "sequence" )
        else:
            for s in self.input_data.data.seq0:
                seq.append ( self.makeClass(s) )


        # --------------------------------------------------------------------

        #  redefine HKL and/or ASU
        self.putMessage  ( "<h2>Compose new Asummetric Unit</h2>" )
        rev = asudef.makeRevision ( self,hkl,seq, None,"P","NR",1,1.0,"",
                                    revision0=revision0 )
        if rev:
            revision = rev[0]
            revision.addSubtypes  ( revision0.getSubtypes() )
            self.registerRevision ( revision  )

            # this will go in the project tree line
            self.generic_parser_summary["editrevision_asu"] = {
              "summary_line" : ", ".join(summary) + " replaced, "
            }

            # close execution logs and quit
            self.success ( True )

        else:
            self.putTitle   ( "Revision was not produced" )
            #self.putMessage ( "This is likely to be a program bug, please " +\
            #                  "report to the maintainer" )

            # close execution logs and quit
            self.fail ( "This is likely to be a program bug, please " +\
                        "report to the maintainer","error" )

        return


# ============================================================================

if __name__ == "__main__":

    drv = EditRevisionASU ( "",os.path.basename(__file__) )
    drv.start()
