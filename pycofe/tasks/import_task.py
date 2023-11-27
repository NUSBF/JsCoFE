##!/usr/bin/python

#
# ============================================================================
#
#    27.11.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DATA IMPORT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python import.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/uploads : directory containing all uploaded files
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from proc import (import_xrayimages, import_unmerged, import_merged,
                  import_xyz, import_ligand, import_sequence, import_doc,
                  import_alignment,import_borges)
from proc import import_pdb, import_seqcp

importers = [import_xrayimages, import_unmerged, import_merged,
             import_xyz, import_sequence, import_doc,
             import_alignment,import_borges]

#
# LEFTOVER CODE FROM CCPEM SCOPE. LEAVE IT IN FOR NOW
# import_map can fail if the mrcfile package is not available. Once mrcfile is
# properly included in CCP4 builds, this can be changed to a normal import.
# try:
#     from proc import import_map
#     importers.append(import_map)
# except Exception:
#     pass
#

# ============================================================================
# Make Import driver

class Import(basic.TaskDriver):

    # ========================================================================
    # import driver

    # definition used in import_pdb
    def getXMLFName (self):  return "matthews.xml"

    def run_importers ( self,ligand_libraries=[] ):
        for importer in importers:
            importer.run ( self )
        import_ligand.run ( self,ligand_libraries=ligand_libraries )
        return

    def make_summary_table ( self,summaryTitle ):
        pyrvapi.rvapi_add_table ( self.import_summary_id(),
                                  "<font size='+1'>" + summaryTitle + "</font>",
                                  self.report_page_id(),self.rvrow+1,0,1,1, 0 )
        pyrvapi.rvapi_set_table_style ( self.import_summary_id(),"table-blue","text-align:left;" )
        pyrvapi.rvapi_set_text ( "&nbsp;",self.report_page_id(),self.rvrow+2,0,1,1 )
        self.rvrow += 3

        pyrvapi.rvapi_put_horz_theader ( self.import_summary_id(),"Imported file",
                                                          "Name of imported file",0 )
        pyrvapi.rvapi_put_horz_theader ( self.import_summary_id(),"Type","Dataset type",1 )
        pyrvapi.rvapi_put_horz_theader ( self.import_summary_id(),"Generated dataset(s)",
                                                          "List of generated datasets",2 )
        return


    def import_all ( self,summaryTitle="Import Summary",ligand_libraries=[] ):
        # ligand_libraries force library type for listed file names.

        # ====================================================================
        # start page construction: summary table

        self.make_summary_table ( summaryTitle )

        # ====================================================================
        # get list of uploaded files

        #self.files_all = [f for f in os.listdir(self.importDir()) if os.path.isfile(os.path.join(self.importDir(),f))]

        self.resetFileImport()
        for dirName, subdirList, fileList in os.walk(self.importDir(),topdown=False):
            dName = dirName[len(self.importDir())+1:]
            for fname in fileList:
                self.addFileImport ( os.path.join(dName,fname),baseDirPath=self.importDir() )

        # ====================================================================
        # do individual data type imports

        self.nImportedDocs = 0
        self.run_importers ( ligand_libraries=ligand_libraries )

        #for importer in importers:
        #    if importer is import_merged:
        #        importer.run ( self,importPhases=importPhases )
        #    else:
        #        importer.run ( self )

        # ====================================================================
        # do PDB imports

        # save unrecognised file list
        unrecognised_files = self.files_all

        pdb_import_coordinates = True
        pdb_import_sequences   = True
        pdb_import_reflections = True
        pdb_make_revisions     = True

        pdb_list = []

        if hasattr(self.task.parameters,"CODES"):
            pdb_list = [x.strip() for x in self.getParameter(self.task.parameters.CODES).split(",")]
            pdb_import_coordinates = self.getCheckbox ( self.task.parameters.COORDINATES_CBX )
            pdb_import_sequences   = self.getCheckbox ( self.task.parameters.SEQUENCES_CBX   )
            pdb_import_reflections = self.getCheckbox ( self.task.parameters.REFLECTIONS_CBX )
            pdb_make_revisions     = self.getCheckbox ( self.task.parameters.REVISION_CBX    )
        else:
            for f in self.task.upload_files:
                if f.startswith('PDB::'):
                    pdb_list.append ( f[5:] )

        if len(pdb_list)>0:
            import_pdb.run ( self,pdb_list,
                                  import_coordinates = pdb_import_coordinates,
                                  import_sequences   = pdb_import_sequences,
                                  import_reflections = pdb_import_reflections,
                                  import_revisions   = pdb_make_revisions
                           )
        #self.file_stdout.write ( str(pdb_list) + "\n" )

        # ====================================================================
        # do sequence copy-paste imports

        # save unrecognised file list
        unrecognised_files = self.files_all

        if hasattr(self.task.parameters,"SEQUENCE_TA"):
            import_seqcp.run ( self,
                self.getParameter(self.task.parameters.SEQTYPE_SEL),
                self.outputFName,
                self.getParameter(self.task.parameters.SEQUENCE_TA) )


        # ====================================================================
        # finish import

        if len(unrecognised_files)>0:
            self.file_stdout.write ( "\n\n" + "="*80 + \
               "\n*** The following files are not recognised and will be ignored:\n" )
            for f in unrecognised_files:
                self.file_stdout.write ( "     " + f + "\n" )
            self.file_stdout.write ( "\n" )

            for f in unrecognised_files:
                self.putSummaryLine_red ( self.get_cloud_import_path(f),"UNKNOWN",
                                          "Failed to recognise, ignored" )

        return

    def run(self):

        self.cloud_import_path = {}
        if hasattr(self.task,"selected_items"):
            for i in range(len(self.task.selected_items)):
                cpath = self.task.selected_items[i].name
                self.cloud_import_path[cpath.split('/')[-1]] = cpath

        # copy pre-existing revisions into output first
        nrevisions0 = 0
        if hasattr(self.input_data.data,"void1"):
            revision    = self.input_data.data.void1
            nrevisions0 = len(revision)
            for i in range(len(revision)):
                revision[i] = self.makeClass ( revision[i] )
                revision[i].register ( self.outputDataBox )

        self.import_all()

        if self.summary_row<=0 and self.nImportedDocs>0:
            self.removeTab ( self.report_page_id() )
            self.removeTab ( self.log_page_id   () )
            self.removeTab ( self.log_page_1_id () )
            self.removeTab ( self.err_page_id   () )
            #self.task.nImportedDocs = self.nImportedDocs  #  signal to convert to Remark-Doc
            self.task.state = "remdoc"  # signal to convert to Remark-doc
            if self.task.uname:
                self.task.uname = "<i><b>" + self.task.uname + "</b></i>"
            else:
                self.task.uname = "<i><b>READ ME</b></i>"
        else:
            #self.task.nImportedDocs = 0  #  signal not to convert to Remark-Doc
            # modify job name to display in job tree
            ilist = ""
            for key in self.outputDataBox.data:
                nimported = len(self.outputDataBox.data[key])
                if key=="DataRevision":
                    nimported -= nrevisions0
                if nimported>0:
                    ilist += key[4:] + " (" + str(nimported) + ") "
            if ilist:
                self.generic_parser_summary["import_task"] = {
                  "summary_line" : "imported: " + ilist
                }

                # if self.task.uname:
                #     self.task.uname += " / "
                # self.task.uname += "imported: <i><b>" + ilist + "</b></i>"


        # self.generic_parser_summary["import_task"] = {
        #   "summary_line" : "*none*"
        # }

        # close execution logs and quit
        have_results = (self.outputDataBox.nDTypes()>0)
        if not have_results:
            self.generic_parser_summary["import_task"] = {
              "summary_line" : "no data imported"
            }
        self.success ( have_results or self.task.state=="remdoc" )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Import ( "",os.path.basename(__file__) )
    drv.start()
