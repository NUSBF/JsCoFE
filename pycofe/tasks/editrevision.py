##!/usr/bin/python

#
# ============================================================================
#
#    01.07.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MATTHEWS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python editrevision.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import asudef


# ============================================================================
# Make EditRevision driver

class EditRevision(asudef.ASUDef):

    # make task-specific definitions
    #def matthews_report(self):  return "matthews_report"
    #def getXMLFName    (self):  return "matthews.xml"
    #def seq_table_id   (self):  return "seq_table"
    #def res_table_id   (self):  return "res_table"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the TEMPORARY XML file.
        if os.path.isfile(self.getXMLFName()):
            os.remove(self.getXMLFName())

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )
        struct0   = self.makeClass ( self.input_data.data.struct0 [0] )

        associated_data_list = []
        change_list          = []

        hkl = None
        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )
            associated_data_list.append ( hkl )
            change_list.append ( 'hkl' )
        else:
            hkl = self.makeClass ( self.input_data.data.hkl0[0] )

        seq = []
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            for s in self.input_data.data.seq:
                seq.append ( self.makeClass(s) )
                associated_data_list.append ( seq[-1] )
            change_list.append ( 'seq' )
        else:
            for s in self.input_data.data.seq0:
                seq.append ( self.makeClass(s) )

        xyz = None
        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            xyz = self.makeClass ( self.input_data.data.xyz[0] )
            associated_data_list.append ( xyz )
            change_list.append ( 'xyz' )
        else:
            xyz = struct0

        phases = None
        if hasattr(self.input_data.data,"phases"):  # optional data parameter
            phases = self.makeClass ( self.input_data.data.phases[0] )
            associated_data_list.append ( phases )
            change_list.append ( 'phases' )
        else:
            phases = struct0

        revision = None

        if 'hkl' in change_list or 'seq' in change_list:
            #  redefine HKL and ASU
            self.putMessage  ( "<h2>Compose new Asummetric Unit</h2>" )
            rev = asudef.makeRevision ( self,hkl,seq, "P","NR",1,1.0,"",
                                        revision0=revision0 )
            if rev:
                revision = rev[0]
        else:
            revision = revision0

        if revision:

            if 'xyz' in change_list or 'phases' in change_list:
                # redefine structure
                self.putMessage  ( "<h2>Compose new Structure</h2>" )
                structure = self.registerStructure1 (
                                xyz   .getXYZFilePath ( self.inputDir() ),
                                xyz   .getSubFilePath ( self.inputDir() ),
                                phases.getMTZFilePath ( self.inputDir() ),
                                phases.getMapFilePath ( self.inputDir() ),
                                phases.getDMapFilePath( self.inputDir() ),
                                xyz   .getLibFilePath ( self.inputDir() ),
                                self.outputFName,
                                leadKey=2 if 'phases' in change_list else 1,
                                copy_files=False )
                if structure:
                    self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                              "Structure and electron density",
                                               structure )
                    revision.setStructureData ( structure )
                else:
                    self.putMessage  ( "<b><i>Structure was not replaced (error)</i></b>" )

            revision.addSubtypes  ( revision0.subtype )
            self.registerRevision ( revision  )

        else:
            self.putTitle   ( "Revision was not produced" )
            self.putMessage ( "This is likely to be a program bug, please " +\
                              "report to the maintainer" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = EditRevision ( "",os.path.basename(__file__) )
    drv.start()
