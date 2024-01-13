##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

#  python native imports
import os, copy

#  ccp4-python imports
# import pyrvapi

#  application imports
from   pycofe.dtypes import dtype_template, dtype_revision
from   pycofe.tasks  import import_task
from   proc          import import_merged, import_xyz, import_ligand
from   pycofe.auto   import auto


# ============================================================================
# Make Migrate driver

class Migrate(import_task.Import):

    # ------------------------------------------------------------------------

    import_dir = "uploads"
    def importDir(self):  return self.import_dir       # import directory

    # ------------------------------------------------------------------------

    def _addFileImport ( self,fname ):
        if fname.startswith("cloudstorage::"):
            self.addFileImport ( fname.split("/")[-1],baseDirPath=self.importDir() )
        else:
            self.addFileImport ( fname,baseDirPath=self.importDir() )
        return


    def importData(self):
        # -------------------------------------------------------------------
        # import uploaded data

        self.make_summary_table ( "Import Summary" )

        # in prder not to confuse reflection datasets with reflections coming
        # together with maps and phases, importe them separately

        self.resetFileImport()
        #if self.task.file_hkl and (self.task.file_hkl!=self.task.file_mtz):
        if self.task.file_hkl:
            self._addFileImport ( self.task.file_hkl )
        self.hkl_imported = import_merged.run ( self,importPhases="" )

        self.resetFileImport()
        if self.task.file_mtz:
            self._addFileImport ( self.task.file_mtz )
        if self.task.file_xyz:
            self._addFileImport ( self.task.file_xyz )
        ligand_library = []
        if self.task.file_lib:
            self._addFileImport ( self.task.file_lib )
            ligand_library.append ( self.task.file_lib.split("/")[-1] )
        self.mtz_imported = import_merged.run ( self,importPhases="phases-ds only" )
        self.xyz_imported = import_xyz   .run ( self )
        self.lib_imported = import_ligand.run ( self,ligand_libraries=ligand_library )

        # -------------------------------------------------------------------
        # fetch data for the Migrate pipeline

        self.hkl = []    # all reflections dataset (given and in map mtzs)
        self.xyz = None  # coordinates
        self.map = []    # maps/phases
        self.lib = None  # ligand descriptions
        self.seq = []

        if "DataHKL" in self.outputDataBox.data:
            self.hkl = self.outputDataBox.data["DataHKL"]

        if "DataStructure" in self.outputDataBox.data:
            self.map = self.outputDataBox.data["DataStructure"]

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"][0]
        if "DataSequence" in self.outputDataBox.data:
            self.seq = self.outputDataBox.data["DataSequence"]

        if "DataLibrary" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLibrary"][0]
        elif "DataLigand" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLigand"][0]

        return


    def checkData(self):
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
            self.success ( self.have_results )
            return False


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
            self.success ( self.have_results )
            return False


        return True


    def makeStructures(self):

        if hasattr(self, 'hkl_imported'):
            hkls = self.hkl_imported
            if len(self.hkl_imported)<=0:
                self.putMessage (
                    "&nbsp;<p><span style=\"font-size:100%;color:maroon;\">" +\
                    "<b>WARNING:</b> original reflection dataset(s) not provided; " +\
                    "Structure factor moduli will be used instead</span>"
                )
                hkls = self.hkl
        else:
            hkls = self.hkl
        # -------------------------------------------------------------------
        # form output data

        xyzPath = None
        subPath = None
        leadKey = 0
        if self.xyz:
            if self.xyz.getNofPolymers()>0:
                xyzPath = self.xyz.getPDBFilePath ( self.outputDir() )
                leadKey = 1  # assume that phases derived from polymers' coordinates, i.e. MR!
            else:
                subPath = self.xyz.getPDBFilePath ( self.outputDir() )
                leadKey = 2  # only substructure in PDB, assume experimental phases!
        else:
            leadKey = 2  # no coordinates, phases to be treated as experimental!

        xyzid = ""  # used in revision naming
        if hasattr(self, 'task'):
            if hasattr(self.task, 'file_xyz'):
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
                s = self.registerStructure1 ( 
                        self.outputFName,
                        None,
                        xyzPath,
                        subPath, ###
                        self.map[i].getMTZFilePath(self.outputDir()),
                        libPath = libPath,
                        leadKey = leadKey,
                        refiner = "" 
                    )
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
            s = self.registerStructure1 ( 
                    self.outputFName,
                    None,
                    xyzPath,
                    subPath,
                    None,  ###
                    libPath = libPath,
                    leadKey = leadKey,
                    refiner = "" 
                )
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
            self.putMessage ( "No structure could be formed.<br>" +\
                              "<i>Check your data</i>" )
            # close execution logs and quit
            self.success ( self.have_results )
            return


        for i in range(len(structures)):
            if structures[i]:
                self.putStructureWidget ( "structure_btn",
                                          "Structure and electron density",
                                          structures[i] )

        sec_title = "Structure Revision"
        if hasattr(self, 'hkl_imported'):
            if (nstruct>1) or (len(self.hkl_imported)>1):
                sec_title += "s"

        self.putTitle ( sec_title +\
                self.hotHelpLink ( "Structure Revision",
                                   "jscofe_qna.structure_revision") )

        outFName         = self.outputFName
        revisionSerialNo = 1
        revision         = None
        try: 
            singleMTZ    = (self.task.file_hkl == self.task.file_mtz)
        except:
            pass
        
        # what is this?
        try: singleMTZ = self.hkl
        except: pass

        if len(hkls)>0:
            for i in range(len(hkls)):
                for j in range(len(structures)):
                    if structures[j]:
                        if singleMTZ:
                            structures[j].setHKLLabels ( hkls[i] )
                        self.outputFName = outFName + " " +\
                                           hkls[i].getDataSetName() + xyzid
                        r = dtype_revision.DType ( -1 )
                        r.makeDataId          ( revisionSerialNo )
                        r.setReflectionData   ( hkls[i]          )
                        r.setASUData          ( self.job_id,[],0,0.0,0,1.0,50.0,0.0 )
                        r.setStructureData    ( structures[j]    )
                        self.registerRevision ( r,serialNo=revisionSerialNo,
                                                  title=None,message="" )
                        if self.lib:
                            r.addLigandData   ( self.lib )
                        revisionSerialNo += 1
                        self.have_results = True
                        if not revision:
                            revision = copy.deepcopy(r)

        else:
            for j in range(len(structures)):
                if structures[j]:
                    if singleMTZ:
                        structures[j].setHKLLabels ( self.hkl[j] )
                    self.outputFName = outFName + " " +\
                                        self.hkl[j].getDataSetName() + xyzid
                    r = dtype_revision.DType ( -1 )
                    r.makeDataId          ( revisionSerialNo )
                    r.setReflectionData   ( self.hkl[j]      )
                    r.setASUData          ( self.job_id,[],0,0.0,0,1.0,50.0,0.0 )
                    r.setStructureData    ( structures[j]    )
                    if self.lib:
                        r.addLigandData   ( self.lib )
                    self.registerRevision ( r,serialNo=revisionSerialNo,
                                              title=None,message="" )
                    revisionSerialNo += 1
                    self.have_results = True
                    if not revision:
                        revision = copy.deepcopy(r)

        self.outputFName = outFName
        return (revisionSerialNo, revision)


    def run(self):

        self.have_results = False
        self.importData()
        self.flush()

        successfullDataCheck =  self.checkData()
        if not successfullDataCheck:
            return # all preparations already done in the upstream code

        (revisionSerialNo, revision) = self.makeStructures()

        if revisionSerialNo>1:

            if revisionSerialNo==2:
                summary_line = "structure revision created"
            else:
                summary_line = str(revisionSerialNo-1) + " structure revisions created"

            #  this works only if autoRunId was set in cloudrun.js before sending
            #  hop-on data to the server
            if revision and self.task.autoRunId=="auto-REL" and revisionSerialNo>1:
                self.task.autoRunName = "_root"
                if auto.makeNextTask ( self, {
                     "revision" : revision,
                     "lig"      : [], #self.lib],
                     "ligdesc"  : []
                   }):
                    summary_line += ", refinement workflow started"
                else:
                    summary_line += ", workflow start failed"

            self.generic_parser_summary["migrate"] = {
                "summary_line" : summary_line
            }

        # close execution logs and quit
        self.success ( self.have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Migrate ( "",os.path.basename(__file__) )
    drv.start()
