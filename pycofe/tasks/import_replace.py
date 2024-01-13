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
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from   .             import migrate
from   pycofe.dtypes import dtype_template


# ============================================================================
# Make ImportReplace driver

class ImportReplace(migrate.Migrate):

    def checkCell ( self,ref,cset ):
        compatible   = []
        incompatible = []
        for i in range(len(cset)):
            spi = cset[i].getCellParameters()
            cmp = True
            for j in range(3):
                if (abs(ref[j]-spi[j])/ref[j]>0.01) or (abs(ref[j+3]-spi[j+3])>2.0):
                    cmp = False
                    break
            if cmp:
                compatible.append ( cset[i] )
            else:
                incompatible.append ( cset[i] )
        return (compatible,incompatible)


    # ------------------------------------------------------------------------

    def run(self):

        have_results = False
        self.importData()
        self.flush()

        #revision = self.makeClass ( self.input_data.data.revision[0] )
        ihkl = self.makeClass ( self.input_data.data.ihkl[0] )

        istruct = None
        isub    = None
        if hasattr(self.input_data.data,"istruct"):
            istruct = self.makeClass ( self.input_data.data.istruct[0] )
        if hasattr(self.input_data.data,"isub"):
            isub = self.makeClass ( self.input_data.data.isub[0] )

        # -------------------------------------------------------------------
        #  check cell compatibility

        compatible = True
        sp0 = ihkl.getCellParameters()  #  reference cell parameters

        msg_err = []
        msg_wrn = []
        if len(self.hkl_imported)>0:
            hkl_passed,hkl_failed = self.checkCell ( sp0,self.hkl_imported )
            if len(hkl_passed)<=0:
                msg_err.append ( "reflection dataset(s)" )
            self.hkl_imported = hkl_passed
            for hkl in hkl_failed:
                msg_wrn.append ( hkl.dname )

        if len(self.map)>0:
            map_passed,map_failed = self.checkCell ( sp0,[self.map[0]] )
            if len(map_passed)<=0:
                msg_err.append ( "phases" )

        if self.xyz:
            xyz_passed,xyz_failed = self.checkCell ( sp0,[self.xyz] )
            if len(xyz_passed)<=0:
                msg_err.append ( "atomic coordinates" )

        if len(msg_err)>0:
            self.putTitle ( "Import & Replace not possible" )
            msg = "Incompatible cell parameters found in " + ",".join(msg_err)
            self.putMessage ( " and".join(msg.rsplit(",",1)) )
            # close execution logs and quit
            self.generic_parser_summary["import_replace"] = {
                "summary_line" : "incompatible cell parameters"
            }
            self.success ( have_results )
            return

        if len(msg_wrn)>0:
            self.putMessage ( "<span style=\"color:maroon;\">&nbsp;<br>" +\
                              "Warning: the following datasets have " +\
                              "incompatible cell parameters and are ignored:" +\
                              "<ul><li>" + "</li><li>".join(msg_wrn) +\
                              "</li></ul></span>" )

        # -------------------------------------------------------------------
        # form output data

        xyzPath = None
        subPath = None
        leadKey = 1
        if self.xyz:
            if self.xyz.getNofPolymers()>0:
                xyzPath = self.xyz.getPDBFilePath ( self.outputDir() )
            else:
                subPath = self.xyz.getPDBFilePath ( self.outputDir() )
                leadKey = 2

        xyzid = ""  # used in revision naming
        if self.task.file_xyz:
            xyzid = " " + os.path.splitext(self.task.file_xyz)[0]

        libPath = None
        if self.lib:
            libPath = self.lib.getLibFilePath ( self.outputDir() )

        # -------------------------------------------------------------------
        # form structure(s) to set or replace

        sxyz = None   #  Structure to replace if not None
        sub  = None   #  Substructure to replace if not None

        mtzPath = None
        if len(self.map)>0:
            mtzPath = self.map[0].getMTZFilePath(self.outputDir())

        implist = []

        if xyzPath or mtzPath or istruct:   # replace Structure
            if xyzPath:  implist.append ( "XYZ"    )
            if mtzPath:  implist.append ( "Phases" )
            if libPath:  implist.append ( "Ligand(s)" )
            xyz_path = xyzPath
            mtz_path = mtzPath
            lib_path = libPath
            doc_link = self.hotHelpLink ( "Structure","jscofe_qna.structure" )
            if xyz_path or mtz_path or lib_path:
                if istruct:
                    if not xyz_path:
                        xyz_path = istruct.getPDBFilePath ( self.inputDir() )
                    if not mtz_path:
                        mtz_path = istruct.getMTZFilePath ( self.inputDir() )
                    if not lib_path:
                        lib_path = istruct.getLibFilePath ( self.inputDir() )
                leadKey = 1
                if not xyzPath:
                    leadKey = 2

                if (not xyz_path) and (not mtz_path) and lib_path:
                    self.putTitle ( "Import & Replace not possible" )
                    self.putMessage ( "<i>No Structure" + doc_link +\
                                      " was found or could be formed from data " +\
                                      "provided to place the ligand library in</i>" )
                    # close execution logs and quit
                    self.generic_parser_summary["import_replace"] = {
                        "summary_line" : "inconsistent import request"
                    }
                    self.success ( have_results )
                    return

                refiner = ""
                if istruct:
                    refiner = istruct.refiner
                elif isub:
                    refiner = isub.refiner

                sxyz = self.registerStructure1 ( 
                            self.outputFName,
                            None,
                            xyz_path,
                            None,
                            mtz_path,  ###
                            libPath = lib_path,
                            leadKey = leadKey,
                            refiner = refiner 
                        )
                if sxyz:
                    if mtzPath:
                        sxyz.copyAssociations ( self.map[0] )
                        sxyz.addSubtypes      ( self.map[0].subtype )
                        sxyz.copyLabels       ( self.map[0] )
                    elif istruct:
                        sxyz.copy_refkeys_parameters ( istruct )
                        sxyz.copyAssociations ( istruct )
                        sxyz.addSubtypes      ( istruct.subtype )
                        sxyz.copyLabels       ( istruct )
                    if xyzPath:
                        sxyz.addSubtype ( dtype_template.subtypeXYZ() )
                    self.putTitle   ( "Created Structure" + doc_link )
                    self.putStructureWidget ( "structure_btn",
                                              "Structure and electron density",
                                              sxyz )
                else:
                    self.putTitle   ( "Import & Replace failed" )
                    self.putMessage ( "No Structure" + doc_link +\
                                      " could be formed.<br><i>Check your data</i>" )
                    # close execution logs and quit
                    self.generic_parser_summary["import_replace"] = {
                        "summary_line" : "failed"
                    }
                    self.success ( have_results )
                    return

            else:
                self.putTitle   ( "Import & Replace failed" )
                self.putMessage ( "No data for replacement in Structure" +\
                                  doc_link +\
                                  " were provided.<br><i>Check your data</i>" )
                # close execution logs and quit
                self.generic_parser_summary["import_replace"] = {
                    "summary_line" : "malformed import request"
                }
                self.success ( have_results )
                return

            mtzPath = None

        if subPath or isub:   # replace Substructure

            if (not xyz_path) and (not mtz_path) and lib_path:
                self.putTitle ( "Import & Replace not possible" )
                self.putMessage ( "<i>Ligand library cannot be placed in " +\
                                  "Substructure" + doc_link + "</i>" )
                # close execution logs and quit
                self.generic_parser_summary["import_replace"] = {
                    "summary_line" : "inconsistent import request"
                }
                self.success ( have_results )
                return

            if subPath:  implist.append ( "HA-Sub" )
            if mtzPath:  implist.append ( "Phases" )

            sub_path = subPath
            mtz_path = mtzPath
            doc_link = self.hotHelpLink ( "Substructure","jscofe_qna.structure" )
            if sub_path or mtz_path:
                refiner = ""
                if isub:
                    if not sub_path:
                        sub_path = isub.getSubFilePath ( self.inputDir() )
                    if not mtz_path:
                        mtz_path = isub.getMTZFilePath ( self.inputDir() )
                    refiner = isub.refiner
                sub = self.registerStructure1 ( 
                            self.outputFName,
                            None,
                            None,
                            sub_path,
                            mtz_path,  ###
                            leadKey = 2,
                            refiner = refiner 
                        )
                if sub:
                    if mtzPath:
                        sub.copyAssociations ( self.map[0] )
                        sub.addSubtypes      ( self.map[0].subtype )
                        sub.copyLabels       ( self.map[0] )
                    elif isub:
                        sub.copy_refkeys_parameters ( isub )
                        sub.copyAssociations ( isub )
                        sub.addSubtypes      ( isub.subtype )
                        sub.copyLabels       ( isub )
                    sub.addSubtype ( dtype_template.subtypeSubstructure() )
                    self.putTitle  ( "Created Substructure" + doc_link )
                    self.putStructureWidget ( "structure_btn",
                                              "Substructure and electron density",
                                              sub )
                else:
                    self.putTitle   ( "Import & Replace failed" )
                    self.putMessage ( "No Substructure" + doc_link +\
                                      " could be formed.<br><i>Check your data</i>" )
                    # close execution logs and quit
                    self.generic_parser_summary["import_replace"] = {
                        "summary_line" : "failed"
                    }
                    self.success ( have_results )
                    return


        # -------------------------------------------------------------------
        # replace HKL datasets

        if sub or sxyz or (len(self.hkl_imported)>0):

            sec_title = "Structure Revision"
            if len(self.hkl_imported)>1:
                sec_title += "s"

            self.putTitle ( sec_title +\
                    self.hotHelpLink ( "Structure Revision",
                                       "jscofe_qna.structure_revision") )

            outFName = self.outputFName
            if len(self.hkl_imported)<=0:
                #implist = ["HKL"] + implist
                r = self.makeClass ( self.input_data.data.revision[0] )
                r.setStructureData ( sub  )
                r.setStructureData ( sxyz )
                self.registerRevision ( r,serialNo=1,title=None,message="" )
            else:
                if len(self.hkl_imported)==1:
                    implist = ["HKL"] + implist
                else:
                    implist = ["HKL("+str(len(self.hkl_imported)) + ")"] + implist
                for i in range(len(self.hkl_imported)):
                    self.outputFName = outFName + " " + self.hkl_imported[i].getDataSetName()
                    r = self.makeClass ( self.input_data.data.revision[0] )
                    r.makeDataId ( i+1 )
                    r.setReflectionData ( self.hkl_imported[i] )
                    r.setStructureData ( sub  )
                    r.setStructureData ( sxyz )
                    self.registerRevision ( r,serialNo=i+1,title=None,message="" )
            self.outputFName = outFName

            have_results = True

            """
            if len(self.hkl_imported)<=1:
                summary_line += implist.join(", ")
            else:
                summary_line += str(len(self.hkl_imported)) + " structure revisions created"
            """

            if self.task.uname:
                self.task.uname += " / "
            self.task.uname += "imported and set/replaced: <i><b>" + ", ".join(implist) + "</b></i>"

            self.generic_parser_summary["import_replace"] = {
              "summary_line" : "*none*"
            }

            #self.generic_parser_summary["import_replace"] = {
            #    "summary_line" : "imported: <i><b>" + ", ".join(implist) + "</b></i>"
            #}

        else:
            self.putTitle ( "Structure Revision(s)" +\
                    self.hotHelpLink ( "Structure Revision",
                            "jscofe_qna.structure_revision") + " not created" )
            self.putMessage ( "<i>Import & Replace not possible due to insufficient data</i>")
            self.generic_parser_summary["import_replace"] = {
                "summary_line" : "insufficient data"
            }

        # close execution logs and quit
        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = ImportReplace ( "",os.path.basename(__file__) )
    drv.start()
