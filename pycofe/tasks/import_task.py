##!/usr/bin/python

#
# ============================================================================
#
#    30.04.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DATA IMPORT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python import.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/uploads : directory containing all uploaded files
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

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
from proc import (import_xrayimages, import_unmerged, import_merged,
                  import_xyz, import_ligand, import_sequence, import_doc)
from proc import import_pdb

importers = [import_xrayimages, import_unmerged, import_merged,
             import_xyz, import_ligand, import_sequence, import_doc]

# import_map can fail if the mrcfile package is not available. Once mrcfile is
# properly included in CCP4 builds, this can be changed to a normal import.
try:
    from proc import import_map
    importers.append(import_map)
except Exception:
    pass

# ============================================================================
# Make Import driver

class Import(basic.TaskDriver):

    # ============================================================================
    # import driver

    # definition used in import_pdb
    def getXMLFName  (self):  return "matthews.xml"

    def import_all(self):

        # ============================================================================
        # start page construction: summary table

        pyrvapi.rvapi_add_table ( self.import_summary_id(),"<font size='+1'>Import Summary</font>",
                                  self.report_page_id(),self.rvrow+1,0,1,1, 0 )
        pyrvapi.rvapi_set_table_style ( self.import_summary_id(),"table-blue","text-align:left;" )
        pyrvapi.rvapi_set_text ( "&nbsp;",self.report_page_id(),self.rvrow+2,0,1,1 )
        self.rvrow += 3

        pyrvapi.rvapi_put_horz_theader ( self.import_summary_id(),"Imported file",
                                                          "Name of imported file",0 )
        pyrvapi.rvapi_put_horz_theader ( self.import_summary_id(),"Type","Dataset type",1 )
        pyrvapi.rvapi_put_horz_theader ( self.import_summary_id(),"Generated dataset(s)",
                                                          "List of generated datasets",2 )

        # ============================================================================
        # get list of uploaded files

        #self.files_all = [f for f in os.listdir(self.importDir()) if os.path.isfile(os.path.join(self.importDir(),f))]

        self.resetFileImport()
        for dirName, subdirList, fileList in os.walk(self.importDir(),topdown=False):
            dName = dirName[len(self.importDir())+1:]
            for fname in fileList:
                self.addFileImport ( dName,fname )


        # ============================================================================
        # do individual data type imports

        for importer in importers:
            importer.run(self)


        # ============================================================================
        # do PDB imports

        # save unrecognised file list
        unrecognised_files = self.files_all

        pdb_list = []
        for f in self.task.upload_files:
            if f.startswith('PDB::'):
                pdb_list.append ( f[5:] )
        if len(pdb_list)>0:
            import_pdb.run ( self,pdb_list )
        #self.file_stdout.write ( str(pdb_list) + "\n" )


        # ============================================================================
        # finish import

        if len(unrecognised_files)>0:
            self.file_stdout.write ( "\n\n" + "="*80 + \
               "\n*** The following files are not recognised and will be ignored:\n" )
            for f in unrecognised_files:
                self.file_stdout.write ( "     " + f + "\n" )
            self.file_stdout.write ( "\n" )

            for f in unrecognised_files:
                self.putSummaryLine_red ( f,"UNKNOWN","Failed to recognise, ignored" )

        return



    def run(self):

        # copy pre-existing revisions into output first
        if hasattr(self.input_data.data,"void1"):
            revision = self.input_data.data.void1
            for i in range(len(revision)):
                revision[i] = self.makeClass ( revision[i] )
                revision[i].register ( self.outputDataBox )

        self.import_all()

        # modify job name to display in job tree
        ilist = ""
        for key in self.outputDataBox.data:
            ilist += key[4:] + " (" + str(len(self.outputDataBox.data[key])) + ") "
        if ilist:
            if self.task.uname:
                self.task.uname += " / "
            self.task.uname += "imported: <i><b>" + ilist + "</b></i>"
            with open('job.meta','w') as file_:
                file_.write ( self.task.to_JSON() )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Import ( "",os.path.basename(__file__) )
    drv.start()
