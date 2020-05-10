##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    04.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CHANGE SPACEGROUP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python changespg.py jobManager jobDir jobId
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

# not needed
#from future import *

#  python native imports
import os

#  application imports
from . import basic
from   pycofe.dtypes import dtype_template
from   pycofe.proc   import datred_utils, import_filetype, import_merged


# ============================================================================
# Make ChangeSpG driver

class ChangeSpG(basic.TaskDriver):

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        revision = None
        hkl      = None
        idata    = self.makeClass ( self.input_data.data.idata[0] )
        if idata._type=="DataRevision":
            revision = idata
            hkl = self.makeClass ( self.input_data.data.hkl[0] )
        else:
            hkl = idata

        # make new file name
        outputMTZFName = self.getOFName ( "_" + hkl.new_spg.replace(" ","") +\
                      "_" + hkl.getFileName(dtype_template.file_key["mtz"]),-1 )

        # Just in case (of repeated run) remove the output xyz file. When zanuda
        # succeeds, this file is created.
        if os.path.isfile(outputMTZFName):
            os.remove(outputMTZFName)

        # make command-line parameters
        cmd = [ "hklin" ,hkl.getFilePath(self.inputDir(),dtype_template.file_key["mtz"]),
                "hklout",outputMTZFName ]

        # prepare stdin
        self.open_stdin  ()
        self.write_stdin ( "SYMM \"" + hkl.new_spg + "\"\n" )
        self.close_stdin ()

        # Prepare report parser
        self.setGenericLogParser ( self.refmac_report(),False )

        # run reindex
        self.runApp ( "reindex",cmd,logType="Main" )
        self.unsetLogParser()

        have_results = False

        # check solution and register data
        if os.path.isfile(outputMTZFName):

            self.putTitle ( "Output Data" )

            # make list of files to import
            self.resetFileImport()
            self.addFileImport ( outputMTZFName,import_filetype.ftype_MTZMerged() )
            import_merged.run ( self,"Reflection dataset",importPhases=False )
            have_results = True

            # update structure revision
            if revision:
                #revision = self.makeClass  ( self.input_data.data.revision[0] )
                new_hkl  = self.outputDataBox.data[hkl._type][0]
                new_hkl.new_spg      = hkl.new_spg.replace(" ","")
                new_hkl.aimless_meta = hkl.aimless_meta
                revision.setReflectionData ( new_hkl  )
                self.registerRevision      ( revision )
            self.generic_parser_summary["z01"] = {'SpaceGroup':hkl.new_spg}

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ChangeSpG ( "",os.path.basename(__file__) )
    drv.start()
