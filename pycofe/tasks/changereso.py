##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    18.12.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CHANGE RESOLUTION EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python changereso.py jobManager jobDir jobId
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
from . import basic
from   pycofe.dtypes import dtype_template
from   pycofe.proc   import datred_utils, import_filetype, import_merged


# ============================================================================
# Make ChangeReso driver

class ChangeReso(basic.TaskDriver):

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

        res_high = hkl.res_high
        res_low  = hkl.res_low
        if (len(res_high)<=0):
            res_high = hkl.getHighResolution()
        if (len(res_low)<=0):
            res_low  = hkl.getLowResolution()

        self.putMessage ( "<b>New resolution limits: " + str(res_high) + " &mdash; " +\
                          str(res_low) + " &Aring;" )

        # make new file name
        outputMTZFName = self.getOFName ( "_" + hkl.new_spg.replace(" ","") +\
                      "_" + hkl.getFileName(dtype_template.file_key["mtz"]),-1 )

        # Just in case (of repeated run) remove the output xyz file. When zanuda
        # succeeds, this file is created.
        if os.path.isfile(outputMTZFName):
            os.remove(outputMTZFName)

        # make command-line parameters
        cmd = [ "hklin1",hkl.getHKLFilePath(self.inputDir()),
                "hklout",outputMTZFName ]

        # prepare stdin
        self.open_stdin  ()
        self.write_stdin ([
          "LABIN FILE_NUMBER 1 ALL",
          "RESOLUTION FILE_NUMBER 1 " + str(res_high) + " " + str(res_low)
        ])
        self.close_stdin ()

        # Prepare report parser
        self.setGenericLogParser ( self.refmac_report(),False )

        # run reindex
        self.runApp ( "cad",cmd,logType="Main" )
        self.unsetLogParser()

        self.removeCitation ( "cad" )
        self.addCitation    ( "cad-primary" )

        # check solution and register data
        have_results = False
        summary_line = ""
        if os.path.isfile(outputMTZFName):

            self.putTitle ( "Output Data" )

            # make list of files to import
            self.resetFileImport()
            self.addFileImport ( outputMTZFName,import_filetype.ftype_MTZMerged() )
            #self.files_all = [ outputMTZFName ]
            import_merged.run ( self,"Reflection dataset",importPhases="" )

            # update structure revision
            if revision:
                #revision = self.makeClass  ( self.input_data.data.revision[0] )
                new_hkl  = self.outputDataBox.data[hkl._type][0]
                new_hkl.new_spg      = hkl.new_spg.replace(" ","")
                new_hkl.aimless_meta = hkl.aimless_meta
                revision.setReflectionData ( new_hkl  )
                self.registerRevision      ( revision )

            have_results = True
            summary_line = "new resolution limits: Res=" + res_high +\
                           "&mdash;" + res_low + " &Aring;"
        else:
            self.putTitle ( "No Output Generated" )
            summary_line = "resolution cut failed"

        # this will go in the project tree job's line
        self.generic_parser_summary["change_reso"] = {
          "summary_line" : summary_line
        }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ChangeReso ( "",os.path.basename(__file__) )
    drv.start()
