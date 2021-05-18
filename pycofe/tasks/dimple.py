##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    23.07.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DIMPLE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.dimple jobManager jobDir jobId
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
import sys
import uuid
import io

#  application imports
from . import basic
from   pycofe.dtypes    import dtype_structure
from   pycofe.proc      import qualrep
from   pycofe.verdicts  import verdict_refmac
from   pycofe.auto      import auto


# ============================================================================
# Make Dimple driver

class Dimple(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "dimple.script"

    # ------------------------------------------------------------------------

    def runDimple ( self,hkl,istruct ):

        sec1 = self.task.parameters.sec1.contains

        if not hkl.hasMeanIntensities():
            self.putTitle   ( "Unsuitable Data" )
            self.putMessage ( "Dimple requires reflection data with mean intensities, " +\
                              "which is not found in this case." )
            # this will go in the project tree line
            self.generic_parser_summary["editrevision_asu"] = {
              "summary_line" : "no mean intensity data, therefore stop"
            }
            # close execution logs and quit
            self.success ( False )
            return

        # make command-line parameters for dimple
        cmd = [
            hkl.getHKLFilePath(self.inputDir()),
            istruct.getXYZFilePath(self.inputDir()),
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
        if istruct._type==dtype_structure.dtype():
            libin = istruct.getLibFilePath ( self.inputDir() )
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

        if os.path.isfile(self.getXYZOFName()) and os.path.isfile(self.getMTZOFName()):

            files = [f for f in os.listdir(".") if f.lower().endswith("refmac5_restr.log")]
            if len(files)>0:
                panel_id = self.getWidgetId ( self.refmac_report() )
                self.setRefmacLogParser ( panel_id,False,
                                          graphTables=False,makePanel=True )
                file_refmaclog  = open ( files[0],"r" )
                self.log_parser.parse_stream ( file_refmaclog )
                file_refmaclog.close()

                #  data for verdict
                self.refmac_log = files[0]
                self.verdict_row = self.rvrow
                self.rvrow += 4

            # Register output data. This moves needful files into output directory
            # and puts the corresponding metadata into output databox

            structure = self.registerStructure ( self.getXYZOFName(),None,
                                                 self.getMTZOFName(),None,
                                                 None,libin, leadKey=1 )

            if structure:
                structure.addDataAssociation ( hkl.dataId )
                structure.setRefmacLabels    ( hkl )
                structure.addPhasesSubtype   ()
                self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
                self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                          "Structure and electron density",
                                          structure )
            return structure

        else:
            self.putTitle ( "No Solution Found" )
            return None


    def run(self):

        # Prepare dimple input -- script file

        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        hkl      = self.makeClass ( revision.HKL )   # note that 'hkl' was added
                                  # to input databox by TaskDimple.makeInputData(),
                                  # therefore, hkl=self.input_data.data.hkl[0]
                                  # would also work

        self.refmac_log = None  # calculated in runDimple()

        structure = self.runDimple ( hkl,istruct )

        have_results = False

        if structure:
            # update structure revision
            revision = self.makeClass  ( self.input_data.data.revision[0] )
            revision.setReflectionData ( hkl       )
            revision.setStructureData  ( structure )
            self.registerRevision      ( revision  )
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
                suggestedParameters = verdict_refmac.putVerdictWidget ( self,verdict_meta,self.verdict_row,
                                                  refmac_log=self.refmac_log )

                auto.makeNextTask(self, {
                    "revision": revision,
                    "Rfactor": self.generic_parser_summary["refmac"]["R_factor"],
                    "Rfree": self.generic_parser_summary["refmac"]["R_free"],
                    "suggestedParameters": suggestedParameters
                }, log=self.file_stderr)

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Dimple ( "Refinement and optional MR with Dimple",os.path.basename(__file__) )
    drv.start()
