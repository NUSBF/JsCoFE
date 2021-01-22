##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    22.01.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MIGRATE TO CLOUD TASK EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.migrate jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2021
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from   pycofe.dtypes import dtype_template, dtype_revision
from   pycofe.tasks  import import_task
from   proc          import import_merged, import_xyz, import_ligand


# ============================================================================
# Make Migrate driver

class Migrate(import_task.Import):

    # ------------------------------------------------------------------------

    import_dir = "uploads"
    def importDir(self):  return self.import_dir       # import directory

    # ------------------------------------------------------------------------

    def importData(self):

        # -------------------------------------------------------------------
        # import uploaded data

        self.make_summary_table ( "Import Summary" )

        # in prder not to confuse reflection datasets with reflections coming
        # together with maps and phases, importe them separately

        self.resetFileImport()
        #if self.task.file_hkl and (self.task.file_hkl!=self.task.file_mtz):
        if self.task.file_hkl:
            self.addFileImport ( self.task.file_hkl,baseDirPath=self.importDir() )
        self.hkl_imported = import_merged.run ( self,importPhases="" )

        self.resetFileImport()
        if self.task.file_mtz:
            self.addFileImport ( self.task.file_mtz,baseDirPath=self.importDir() )
        if self.task.file_xyz:
            self.addFileImport ( self.task.file_xyz,baseDirPath=self.importDir() )
        if self.task.file_lib:
            self.addFileImport ( self.task.file_lib,baseDirPath=self.importDir() )
        self.mtz_imported = import_merged.run ( self,importPhases="phases-ds only" )
        self.xyz_imported = import_xyz   .run ( self )
        self.lib_imported = import_ligand.run ( self )

        # -------------------------------------------------------------------
        # fetch data for the Migrate pipeline

        self.hkl = []    # all reflections dataset (given and in map mtzs)
        self.xyz = None  # coordinates
        self.map = []    # maps/phases
        self.lib = None  # ligand descriptions

        if "DataHKL" in self.outputDataBox.data:
            self.hkl = self.outputDataBox.data["DataHKL"]

        if "DataStructure" in self.outputDataBox.data:
            self.map = self.outputDataBox.data["DataStructure"]

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"][0]

        if "DataLibrary" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLibrary"]
        elif "DataLigand" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLigand"]

        return

    # ------------------------------------------------------------------------

    def run(self):

        have_results = False
        self.importData()
        self.flush()

        # -------------------------------------------------------------------
        # check uploaded data

        msg = []
        if len(self.hkl)<=0:
            msg.append ( "reflection dataset(s)" )
        if not self.xyz and (len(self.map)<=0):
            msg.append ( "coordinates or map/phases" )

        if len(msg)>0:
            self.putTitle ( "Hop on " + self.appName() + " not possible" )
            self.putMessage (
                "Missing data:<ul><li>" + "</li><li>".join(msg)   + "</li></ul>"
            )
            # close execution logs and quit
            self.generic_parser_summary["migrate"] = {
                "summary_line" : "insufficient data"
            }
            self.success ( have_results )
            return

        hkls = self.hkl_imported
        if len(self.hkl_imported)<=0:
            self.putMessage (
                "&nbsp;<p><span style=\"font-size:100%;color:maroon;\">" +\
                "<b>WARNING:</b> original reflection dataset(s) not provided; " +\
                "Structure factor moduli will be used instead</span>"
            )
            hkls = self.hkl

        #  check cell compatibility

        compatible = True
        sp0  = self.hkl[0].getCellParameters()  #  reference cell parameters
        cset = self.hkl + self.map
        if self.xyz:
            cset += [self.xyz]
        for i in range(1,len(cset)):
            spi = cset[i].getCellParameters()
            for j in range(3):
                if (abs(sp0[j]-spi[j])/sp0[j]>0.01) or (abs(sp0[j+3]-spi[j+3])>2.0):
                    compatible = False
                    break
            if not compatible:
                break
        if not compatible:
            self.putTitle ( "Hop on " + self.appName() + " not possible" )
            self.putMessage ( "Too distant cell parameters found." )
            # close execution logs and quit
            self.generic_parser_summary["migrate"] = {
                "summary_line" : "too distant cell parameters"
            }
            self.success ( have_results )
            return

        # -------------------------------------------------------------------
        # form output data

        xyzPath = None
        subPath = None
        leadKey = 1
        if self.xyz:
            if self.xyz.getNofPolymers()>0:
                xyzPath = self.xyz.getXYZFilePath ( self.outputDir() )
            else:
                subPath = self.xyz.getXYZFilePath ( self.outputDir() )
                leadKey = 2

        xyzid = ""  # used in revision naming
        if self.task.file_xyz:
            xyzid = " " + os.path.splitext(self.task.file_xyz)[0]

        libPath = None
        if self.lib:
            libPath = self.lib.getLibFilePath ( self.outputDir() )

        # -------------------------------------------------------------------
        # form structure(s)

        structures = []
        nstruct    = 0
        if len(self.map)>0:
            for i in range(len(self.map)):
                s = self.registerStructure1 ( xyzPath,subPath,
                                    self.map[i].getMTZFilePath(self.outputDir()),
                                    None,None,libPath,self.outputFName,
                                    leadKey=leadKey )
                if s:
                    s.copyAssociations ( self.map[i] )
                    s.addSubtypes      ( self.map[i].subtype )
                    #s.removeSubtype    ( dtype_template.subtypeSubstructure() )
                    #s.setXYZSubtype    ()
                    s.copyLabels       ( self.map[i] )
                    #structure.setRefmacLabels  ( None )
                    nstruct += 1
                structures.append ( s )   # indentation is correct
        else:
            s = self.registerStructure1 ( xyzPath,subPath,None,
                                          None,None,libPath,self.outputFName,
                                          leadKey=leadKey )
            if s:
                #s.setXYZSubtype   ()
                structures.append ( s )
                nstruct = 1

        if nstruct>0:
            sec_title = "Created Structure"
            if nstruct>1:
                sec_title += "s"
            self.putTitle ( sec_title +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure") )
        else:
            self.putTitle   ( "Hop on " + self.appName() + " failed" )
            self.putMessage ( "No structure could be formed.<br>" +
                              "<i>Check your data</i>" )
            # close execution logs and quit
            self.success ( have_results )
            return


        for i in range(len(structures)):
            if structures[i]:
                self.putStructureWidget ( "structure_btn",
                                          "Structure and electron density",
                                          structures[i] )

        sec_title = "Structure Revision"
        if (nstruct>1) or (len(self.hkl_imported)>1):
            sec_title += "s"

        self.putTitle ( sec_title +\
                self.hotHelpLink ( "Structure Revision",
                                   "jscofe_qna.structure_revision") )

        outFName = self.outputFName
        revisionSerialNo = 1
        if len(hkls)>0:
            for i in range(len(hkls)):
                for j in range(len(structures)):
                    if structures[j]:
                        self.outputFName = outFName + " " +\
                                            hkls[i].getDataSetName() + xyzid
                        r = dtype_revision.DType ( -1 )
                        r.makeDataId ( revisionSerialNo )
                        r.setReflectionData ( hkls[i] )
                        r.setASUData ( [],0,0.0,0,1.0,50.0,0.0 )
                        r.setStructureData ( structures[j] )
                        self.registerRevision ( r,serialNo=revisionSerialNo,
                                                  title=None,message="" )
                        revisionSerialNo += 1
                        have_results = True
        else:
            for j in range(len(structures)):
                if structures[j]:
                    self.outputFName = outFName + " " +\
                                        self.hkl[j].getDataSetName() + xyzid
                    r = dtype_revision.DType ( -1 )
                    r.makeDataId ( revisionSerialNo )
                    r.setReflectionData ( self.hkl[j] )
                    r.setASUData ( [],0,0.0,0,1.0,50.0,0.0 )
                    r.setStructureData ( structures[j] )
                    self.registerRevision ( r,serialNo=revisionSerialNo,
                                              title=None,message="" )
                    revisionSerialNo += 1
                    have_results = True

        self.outputFName = outFName

        if revisionSerialNo>1:
            if revisionSerialNo==2:
                summary_line = "structure revision created"
            else:
                summary_line = str(revisionSerialNo-1) + " structure revisions created"
            self.generic_parser_summary["migrate"] = {
                "summary_line" : summary_line
            }

        # close execution logs and quit
        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Migrate ( "",os.path.basename(__file__) )
    drv.start()
