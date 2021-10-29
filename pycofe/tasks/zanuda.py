##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    28.10.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ZANUDA EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python zanuda.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid
import json

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.proc   import xyzmeta, import_filetype, import_merged


# ============================================================================
# Make Zanuda driver

class Zanuda(basic.TaskDriver):

    # the following is for importing the generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When zanuda
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare zanuda input
        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        xyz = self.makeClass ( self.input_data.data.struct[0] )

        # prepare mtz with needed columns -- this is necessary because BALBES
        # does not have specification of mtz columns on input (labin)

        labels  = ( hkl.dataset.Fmean.value,hkl.dataset.Fmean.sigma )
        cad_mtz = os.path.join ( self.inputDir(),"cad.mtz" )

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd,logType="Service" )

        zanuda_dir = "zanuda_out"

        # make command-line parameters for bare morda run on a SHELL-type node
        cmd = [ os.path.join(os.environ["CCP4"],"bin","zanuda"),
                "hklin"   ,cad_mtz,
                "xyzin"   ,xyz.getXYZFilePath(self.inputDir()),
                "hklout"  ,self.getMTZOFName(),
                "xyzout"  ,self.getXYZOFName(),
                "clouddir",zanuda_dir,
                "v" ]
                # "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        if self.task.parameters.sec1.contains.AVER_CBX.value:
            cmd.append ( "aver" )

        if self.task.parameters.sec1.contains.NOTWIN_CBX.value:
            cmd.append ( "notwin" )

        # run zanuda
        #self.runApp ( "zanuda",cmd,logType="Main" )
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )

        # check solution and register data

        self.putTitle ( "Results" )

        have_results = False

        json_file = os.path.join ( zanuda_dir,"zanuda.json" )
        try:
            with open(json_file,"r") as f:
                models = json.loads ( f.read() )
        except:
            models = None

        if os.path.isfile(self.getXYZOFName()):

            self.unsetLogParser()

            mtzfile = self.getMTZOFName()
            sol_hkl = hkl

            meta = xyzmeta.getXYZMeta ( self.getXYZOFName(),self.file_stdout,
                                        self.file_stderr )
            if "cryst" in meta:
                sol_spg    = meta["cryst"]["spaceGroup"]
                spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                if spg_change:
                    mtzfile = spg_change[0]
                    sol_hkl = spg_change[1]
                else:
                    self.putMessage ( "<font size='+1'><b>Space Group confirmed as " +\
                                      sol_spg + "</b></font>" )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( mtzfile,self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),None,mtzfile,
                                                 None,None,None,
                                                 #fnames[0],fnames[1],None,  -- not needed for new UglyMol
                                                 leadKey=1,refiner="refmac" )
            if structure:

                self.putMessage ( "<h3>Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") +\
                        "</h3>" )


                #structure.addDataAssociations ( [hkl,xyz] )
                structure.setRefmacLabels ( sol_hkl )
                structure.copySubtype     ( xyz )

                self.putStructureWidget   ( "structure_btn",
                                            "Structure and electron density",
                                            structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setReflectionData ( sol_hkl   )
                revision.setStructureData  ( structure )

                self.putMessage ( "<h3>Structure Revision" +\
                    self.hotHelpLink ( "Structure Revision",
                                       "jscofe_qna.structure_revision") + "</h3>" )
                self.registerRevision ( revision,title="" )
                have_results = True

            else:
                self.putMessage ( "<h3>Failed to create Structure</h3>" +\
                                  "This is likely to be a program bug, please " +\
                                  "report to developer or maintainer" )

        else:
            self.putMessage ( "<h3>No Output Structure Generated</h3>" )

        # Make revisions for acceptable space groups

        if models:

            self.putMessage ( "&nbsp;<br>&nbsp;" )

            # self.putTitle ( "Models for Acceptable Space Groups" )
            modelsSecId = self.getWidgetId ( "_models_sec_" )
            pyrvapi.rvapi_add_section (
                        modelsSecId,"Solutions in Possible Space Groups",
                        self.report_page_id(),self.rvrow,0,1,1,False )
            self.rvrow += 1
            self.setReportWidget ( modelsSecId )

            for i in range(len(models)):
                self.putMessage ( "<h3>" + models[i]["title"] + "</h3>" )
                self.resetFileImport()
                self.addFileImport ( models[i]["mtzin"],import_filetype.ftype_MTZMerged() )
                hkli = import_merged.run ( self,"Reflection dataset details",importPhases="" )
                if len(hkli)>0:
                    hkli[0].dataStats    = hkl.dataStats
                    hkli[0].aimless_meta = hkl.aimless_meta
                    self.putMessage ( "<b>New reflection dataset created:</b> " +\
                                      hkli[0].dname )
                    structure = self.registerStructure (
                                models[i]["pdbout"],None,models[i]["mtzout"],
                                None,None,None,leadKey=1,refiner="refmac" )
                    if structure:
                        structure.setRefmacLabels ( hkli[0] )
                        structure.copySubtype     ( xyz )
                        self.putStructureWidget   (
                                "structure_btn","Structure and electron density",
                                structure,legend="Assigned structure name" )

                else:
                    self.putMessage (
                        "Data registration error -- report to developers." )

            self.resetReportPage()

        else:
            self.putTitle ( "No Models for Acceptable Space Groups Generated" )


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Zanuda ( "",os.path.basename(__file__) )
    drv.start()
