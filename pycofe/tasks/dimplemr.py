##!/usr/bin/python

#
# ============================================================================
#
#    13.08.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DIMPLE-MR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.dimplemr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2023-2024
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
# from . import basic
from   pycofe.tasks     import basic, asudef
from   pycofe.dtypes    import dtype_structure
from   pycofe.proc      import qualrep
from   pycofe.verdicts  import verdict_refmac
from   pycofe.auto      import auto,auto_workflow


# ============================================================================
# Make DimpleMR driver

class DimpleMR(basic.TaskDriver):

    # the following will provide for import of generated sequences
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # redefine name of input script file
    def file_stdin_path(self):  return "dimplemr.script"

    # definition used in import_pdb
    def getXMLFName (self):  return "matthews.xml"

    # ------------------------------------------------------------------------

    def runDimpleMR ( self,hkl,xyz,lib ):

        sec1 = self.task.parameters.sec1.contains

        # if not hkl.hasMeanIntensities():
        #     self.putTitle   ( "Unsuitable Data" )
        #     self.putMessage ( "Dimple requires reflection data with mean intensities, " +\
        #                       "which is not found in the provided reflection dataset." )
        #     # this will go in the project tree line
        #     self.generic_parser_summary["dimplemr"] = {
        #       "summary_line" : "no mean intensity data, therefore stop"
        #     }
        #     # close execution logs and quit
        #     self.success ( False )
        #     return (None,None)

        cols = hkl.getMeanColumns()
        if cols[2]=="X":
            self.putTitle   ( "Unsuitable Data" )
            self.putMessage ( "No mean intensities or amplitudes found in " +\
                              "the reflection dataset." )
            # this will go in the project tree line
            self.generic_parser_summary["dimple"] = {
              "summary_line" : "no reflection data, therefore stop"
            }
            # close execution logs and quit
            self.success ( False )
            return (None,None)

        reflections_mtz = "__reflections.mtz"
        if cols[2]=="F":
            # self.open_stdin()
            # self.write_stdin ([
            #     "LABIN  FILE 1 E1=" + cols[0] + " E2=" + cols[1] + " E3=" + hkl.getFreeRColumn()
            # ])
            # self.write_stdin ([
            #     "LABOUT FILE 1 E1=FP E2=SIGFP E3=" + hkl.getFreeRColumn()
            # ])
            # self.close_stdin()
            #
            # self.runApp ( "cad",[
            #         "HKLIN1",hkl.getHKLFilePath(self.inputDir()),
            #         "HKLOUT",reflections_mtz
            #     ],logType="Service" )
            FreeRColumn = hkl.getFreeRColumn()
            self.sliceMTZ ( hkl.getHKLFilePath(self.inputDir()),
                            [cols[0],cols[1],FreeRColumn],
                            reflections_mtz,
                            ["FP","SIGFP",FreeRColumn] )

        else:
            reflections_mtz = hkl.getHKLFilePath ( self.inputDir() )

        # make command-line parameters for dimple
        cmd = [
            # hkl.getHKLFilePath(self.inputDir()),
            reflections_mtz,
            xyz.getPDBFilePath(self.inputDir()),
            "./",
            "--free-r-flags","-",
            "--freecolumn",hkl.getMeta("FREE","")
        ]

        reflevel = self.getParameter ( sec1.REFLEVEL )
        if reflevel=="1":    cmd += [ "--slow" ]
        elif reflevel=="2":  cmd += [ "--slow","--slow" ]

        cmd += [
            "--hklout",self.getMTZOFName(),
            "--xyzout",self.getXYZOFName()
        ]

        #  make this check because function can be used also with DataXYZ
        libin = None
        if xyz._type==dtype_structure.dtype():
            libin = xyz.getLibFilePath ( self.inputDir() )
        elif lib:
            libin = lib.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += [ "--libin",libin ]

        mr_prog = self.getParameter ( sec1.MRPROG )

        cmd += [
            "--jelly"       ,self.getParameter ( sec1.NJELLY      ),
            "--restr-cycles",self.getParameter ( sec1.NRESTR      ),
            "--mr-when-r"   ,self.getParameter ( sec1.MRTHRESHOLD ),
            "--mr-reso"     ,self.getParameter ( sec1.MRRESO      ),
            "--mr-prog"     ,mr_prog
        ]

        reslimit = self.getParameter ( sec1.RESLIMIT )
        if reslimit:
            cmd += [ "--reso",reslimit ]

        weight = self.getParameter ( sec1.WEIGHT )
        if weight:
            cmd += [ "--weight",weight ]

        mrnum = self.getParameter ( sec1.MRNUM )
        if mrnum:
            cmd += [ "--mr-num",mrnum ]

        # run dimple
        if sys.platform.startswith("win"):
            self.runApp ( "dimple.bat",cmd,logType="Main" )
        else:
            self.runApp ( "dimple",cmd,logType="Main" )

        # os.rename ( reflections_mtz,os.path.join(self.outputDir(),reflections_mtz) )

        self.file_stdout.close()
        self.file_stdout = open ( self.file_stdout_path(),'r' )
        dimple_log = self.file_stdout.read()
        self.file_stdout.close()
        self.file_stdout = open ( self.file_stdout_path(),'a' )

        if "pointless" in dimple_log:
            self.addCitations ( ["pointless"] )
        if mr_prog in dimple_log:
            self.addCitations ( [mr_prog] )
        self.addCitations ( ["rwcontents","refmac5"] )
        if "find-blobs" in dimple_log:
            self.addCitations ( ["find-blobs"] )

        # ================================================================
        # make output structure and register it

        sol_hkl = hkl

        if os.path.isfile(self.getXYZOFName()) and os.path.isfile(self.getMTZOFName()):

            files = [f for f in os.listdir(".") if f.lower().endswith("refmac5_restr.log")]
            if len(files)>0:
                panel_id = self.getWidgetId ( self.refmac_report() )
                self.setRefmacLogParser ( panel_id,False,
                                          graphTables=False,makePanel=True )
                file_refmaclog = open ( files[0],"r" )
                self.log_parser.parse_stream ( file_refmaclog )
                file_refmaclog.close()

                #  data for verdict
                self.refmac_log  = files[0]
                self.verdict_row = self.rvrow
                self.rvrow += 4


            if os.path.exists("reindexed.mtz"):
                spg_change = self.checkSpaceGroupChanged ( xyz.getSpaceGroup(),
                                hkl,"reindexed.mtz",title="Space Group Change",
                                force=True )  # force because it may be reindexing
                if spg_change:
                    # mtzfile = spg_change[0]
                    sol_hkl = spg_change[1]
                    # revision.setReflectionData ( sol_hkl )

            # Register output data. This moves needful files into output directory
            # and puts the corresponding metadata into output databox

            structure = self.registerStructure ( 
                                None,
                                self.getXYZOFName(),
                                None,
                                self.getMTZOFName(),
                                libPath = libin, 
                                leadKey = 1,
                                refiner = "refmac" 
                            )

            if structure:
                structure.addDataAssociation ( hkl.dataId )
                structure.setRefmacLabels    ( hkl )
                structure.addPhasesSubtype   ()
                self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
                self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                          "Structure and electron density",
                                          structure )
            return (structure,sol_hkl)

        else:
            self.putTitle ( "No Solution Found" )
            return (None,None)


    def run(self):

        # Prepare dimple input -- script file

        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        xyz = self.makeClass ( self.input_data.data.xyz[0] )
        lib = None
        if hasattr(self.input_data.data,"lib"):  # optional data parameter
            lib = self.makeClass ( self.input_data.data.lib[0] )


        self.refmac_log = None  # calculated in runDimpleМР()

        structure, sol_hkl = self.runDimpleMR ( hkl,xyz,lib )

        have_results = False

        if structure:
            # make structure revision

            self.putMessage ( "&nbsp;" )
            revision = asudef.revisionFromStructure ( self,sol_hkl,structure,
                                self.outputFName,secId="0",make_verdict=False )

            if lib:
                revision.addLigandData ( lib )

            # revision = self.makeClass  ( self.input_data.data.revision[0] )
            # revision.setReflectionData ( hkl       )
            # revision.setStructureData  ( structure )
            # self.registerRevision      ( revision  )
            have_results = True

            rvrow0 = self.rvrow
            try:
                meta = qualrep.quality_report ( self,revision )
            except:
                meta = None
                self.stderr ( " *** molprobity failure" )
                self.rvrow = rvrow0

            if meta:
                verdict_meta = {
                    "data"       : { "resolution" : hkl.getHighResolution(raw=True) },
                    "params"     : None, # will be read from log file
                    "molprobity" : meta,
                    "xyzmeta"    : structure.xyzmeta
                }
                suggestedParameters = verdict_refmac.putVerdictWidget ( 
                                            self,verdict_meta,self.verdict_row,
                                            refmac_log=self.refmac_log )

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision"  : [revision]
                            },
                            "scores" :  {
                                "Rfactor" : float(self.generic_parser_summary["refmac"]["R_factor"]),
                                "Rfree"   : float(self.generic_parser_summary["refmac"]["R_free"])
                            },
                            "suggestedParameters" : {
                                "TaskRefmac" : suggestedParameters
                            }
                    })
                        # summary_line += "workflow started"
                        # self.putMessage ( "<h3>Workflow started</hr>" )

                else:  # pre-coded workflow framework
                    auto.makeNextTask(self, {
                        "revision" : revision,
                        "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                        "Rfree"    : self.generic_parser_summary["refmac"]["R_free"],
                        "suggestedParameters": suggestedParameters
                    }, log=self.file_stderr)

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = DimpleMR ( "Molecular Replacement with Dimple",os.path.basename(__file__) )
    drv.start()
