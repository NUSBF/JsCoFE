##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
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
from   pycofe.dtypes import dtype_revision
from   pycofe.proc   import xyzmeta, import_filetype, import_merged


# ============================================================================
# Make Zanuda driver

class Zanuda(basic.TaskDriver):

    # the following is for importing the generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    datasets = []
    hkl      = None
    xyz      = None
    message  = []  # to appear in Job Tree line

    def make_revision ( self,subgroup,revisionNo ):

        dsNo = subgroup["ds_ind"]
        hkl0 = self.datasets[dsNo]["data"]
        revision = None

        if hkl0:
            if hkl0.dataId!=self.hkl.dataId:
                self.putMessage ( "<b>New reflection dataset:</b> " + hkl0.dname )
        else:
            self.resetFileImport()
            self.addFileImport ( self.datasets[dsNo]["mtzin"],import_filetype.ftype_MTZMerged() )
            hkli = import_merged.run ( self,"Reflection dataset details",importPhases="" )
            if len(hkli)>0:
                hkl0 = hkli[0]
                hkl0.dataStats    = self.hkl.dataStats
                hkl0.aimless_meta = self.hkl.aimless_meta
                self.putMessage ( "<b>New reflection dataset created:</b> " +\
                                  hkl0.dname )
                self.datasets[dsNo]["data"] = hkl0
            else:
                self.putMessage ( "<h3>Failed to create Reflection Dataset</h3>" +\
                                  "This is likely to be a program bug, please " +\
                                  "report to developer or maintainer" )

        if hkl0:

            if revisionNo==0:
                revisionNo = 1
                solSpg     = hkl0.getSpaceGroup()
                if solSpg.replace(" ", "")!=self.hkl.getSpaceGroup().replace(" ", ""):
                    self.putMessage ( "<font style='font-size:120%;'><b>Space Group changed to " +\
                              solSpg + "</b></font>" )
                    # self.generic_parser_summary["z01"] = {'SpaceGroup':sol_spg}
                    self.message.append ( "<u>SG changed to " + solSpg  + "</u>" )
                else:
                    self.putMessage ( "<font size='+1'><b>Space Group confirmed as " +\
                                      solSpg + "</b></font>" )
                    self.message.append ( "<u>SG confirmed as " + solSpg  + "</u>" )

            structure = self.registerStructure (
                                None,subgroup["pdbout"],None,subgroup["mtzout"],
                                None,None,None,leadKey=1,refiner="refmac" )
            if structure:
                structure.setRefmacLabels ( hkl0     )
                structure.copySubtype     ( self.xyz )
                self.putMessage ( "<h3>Structure" +\
                    self.hotHelpLink ( "Structure","jscofe_qna.structure" ) +\
                    "</h3>" )
                self.putStructureWidget   (
                        "structure_btn","Structure and electron density",
                        structure,legend="Assigned name" )

                self.putMessage ( "<h3>Structure Revision" +\
                    self.hotHelpLink ( "Structure Revision",
                                       "jscofe_qna.structure_revision") +\
                    "</h3>" )
                revision = dtype_revision.DType ( -1 )
                revision.copy ( self.input_data.data.revision[0] )
                revision.setReflectionData ( hkl0      )
                revision.setStructureData  ( structure )
                revision.makeRevDName  ( self.job_id,revisionNo,
                    self.outputFName + subgroup["sg_ref"] )

                sequences = revision.ASU.seq
                mult = float(subgroup["asu_coef"][0])/float(subgroup["asu_coef"][1])
                for j in range(len(sequences)):
                    sequences[j].ncopies = int ( round ( mult*sequences[j].ncopies ) )

                gridId = self.getWidgetId ( "_revision" )
                pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),
                                         self.rvrow,0,1,1 )
                self.rvrow += 1

                self.putRevisionWidget ( gridId,0,"Name:",revision )
                revision.register ( self.outputDataBox )

            else:
                self.putMessage ( "<h3>Failed to create Structure</h3>" +\
                                  "This is likely to be a program bug, please " +\
                                  "report to developer or maintainer" )

        return revision


    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When zanuda
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare zanuda input
        # fetch input data
        self.hkl = self.makeClass ( self.input_data.data.hkl[0] )
        self.xyz = self.makeClass ( self.input_data.data.struct[0] )

        # prepare mtz with needed columns -- this is necessary because BALBES
        # does not have specification of mtz columns on input (labin)

        labels  = ( self.hkl.dataset.Fmean.value,self.hkl.dataset.Fmean.sigma )
        cad_mtz = os.path.join ( self.inputDir(),"cad.mtz" )

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",self.hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd,logType="Service" )

        zanuda_dir = "zanuda_out"
        mode       = self.task.parameters.sec1.contains.MODE.value

        # make command-line parameters for bare morda run on a SHELL-type node
        cmd = [ os.path.join(os.environ["CCP4"],"bin","zanuda"),
                "hklin"    ,cad_mtz,
                "xyzin"    ,self.xyz.getXYZFilePath(self.inputDir()),
                "clouddir" ,zanuda_dir,
                "cloudmode",mode
              ]
                # "v"
                # "hklout"  ,self.getMTZOFName(),
                # "xyzout"  ,self.getXYZOFName(),
                # "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        if self.task.parameters.sec2.contains.AVER_CBX.value:
            cmd.append ( "aver" )

        if self.task.parameters.sec2.contains.NOTWIN_CBX.value:
            cmd.append ( "notwin" )

        # run zanuda
        #self.runApp ( "zanuda",cmd,logType="Main" )
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )

        # check solution and register data

        json_file = os.path.join ( zanuda_dir,"zanuda.json" )
        try:
            with open(json_file,"r") as f:
                results = json.loads ( f.read() )
        except:
            results = None

        revisionNo = 0

        if results:

            self.datasets = results["datasets"]
            for i in range(len(self.datasets)):
                if not self.datasets[i]["mtzin"]:
                    self.datasets[i]["data"] = self.hkl
                else:
                    self.datasets[i]["data"] = None

            if results["final"]:
                self.putTitle ( "Best model" )
                if self.make_revision(results["final"],revisionNo):
                    revisionNo = 2
                else:
                    self.putMessage (
                        "<h3>output data could not be formed</h3>" +\
                        "<i>This is likely to be a program bug, please contact " +\
                        "developers</i>"
                    )

            if mode!="refine_clear":
                if results["subgroups"]:
                    self.putTitle ( "Models in possible space groups" )
                    if revisionNo==0:
                        revisionNo = 1
                    for i in range(len(results["subgroups"])):
                        subgroupSecId = self.getWidgetId ( "_subgroup_sec_" )
                        pyrvapi.rvapi_add_section (
                                    subgroupSecId,
                                    results["subgroups"][i]["title"],
                                    self.report_page_id(),self.rvrow,0,1,1,False )
                        self.rvrow += 1
                        self.setReportWidget ( subgroupSecId )
                        if self.make_revision(results["subgroups"][i],revisionNo):
                            revisionNo += 1
                        self.resetReportPage()
                    if len(results["subgroups"])>0:
                        if mode=="transform":
                            self.message.append ( "transformed to " +\
                                str(len(results["subgroups"])) + " possible SG" )
                        else:
                            self.message.append ( "transformed to " +\
                                str(len(results["subgroups"])) + " possible SGs " +\
                                " and refined" )
                else:
                    self.putTitle ( "No results in acceptable space groups were produced" )

        else:
            self.putTitle ( "No results were produced" )


        # close execution logs and quit

        if len(self.message)>0:
            self.generic_parser_summary["zanuda"] = {
              "summary_line" : ", ".join(self.message)
            }

        self.success ( revisionNo>1 )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Zanuda ( "",os.path.basename(__file__) )
    drv.start()
