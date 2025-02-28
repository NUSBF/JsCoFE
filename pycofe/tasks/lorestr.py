##!/usr/bin/python

#
# ============================================================================
#
#    25.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.lorestr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev 2017-2025
#
# ============================================================================
#

#  python native imports
import os
import sys
import json
import shutil

#  application imports
from . import basic
from   pycofe.proc   import qualrep
from   pycofe.verdicts  import verdict_lorestr
from   pycofe.auto   import auto


# ============================================================================
# Make Lorestr driver

class Lorestr(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "lorestr.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When lorestr
        # succeeds, this file is created.
        pdbout = self.getXYZOFName()
        if os.path.isfile(pdbout):
            os.remove(pdbout)

        # Prepare lorestr input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl[0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        if hasattr(self.input_data.data,"rstruct"):  # optional data parameter
            rstruct = self.input_data.data.rstruct
        else:
            rstruct = []

        # Prepare report parser
        #self.setGenericLogParser ( self.lorestr_report(),False )

        cmd = [ "-xyzin",istruct.getXYZFilePath(self.inputDir()),
                "-f"    ,hkl.getHKLFilePath(self.inputDir()) ]

        if len(rstruct)>0:
            cmd += ["-p2"]
            for s in rstruct:
                cs = self.makeClass ( s )
                cmd += [cs.getXYZFilePath(self.inputDir())]

        cmd += [ "-save_space",
                 "-xyzout",pdbout,
                 "-hklout",self.getMTZOFName(),
                 "-labin" ,"FP="     + hkl.dataset.Fmean.value +
                           " SIGFP=" + hkl.dataset.Fmean.sigma +
                           " FREE="  + hkl.dataset.FREE
                 #"-rvapi" ,self.reportDir()
                ]
        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += ["-libin",libin]

        autoParam = self.getParameter(self.task.parameters.sec1.contains.AUTO)
        if autoParam == "all":
            cmd += [ "-auto"]
        elif autoParam == "pdb":
            cmd += ["-auto", "pdb"]
        elif autoParam == "af":
            cmd += ["-auto", "af"]

        minres = self.getParameter(self.task.parameters.sec1.contains.MINRES)
        if minres:
            cmd += [ "-minres", minres ]

        if self.getParameter(self.task.parameters.sec1.contains.DNA_CBX)=="True":
            cmd += [ "-dna" ]

        if self.getParameter(self.task.parameters.sec1.contains.OVB_CBX)=="True":
            cmd += [ "-overalb" ]

        if self.getParameter(self.task.parameters.sec1.contains.MR_CBX)=="True":
            cmd += [ "-mr" ]

        meta = {}
        meta["page_id"]  = self.report_page_id()
        meta["jobId"]    = self.job_id
        meta["nameout" ] = self.outputFName

        self.storeReportDocument ( json.dumps(meta) )

        cmd += [ "-xml"  ,"lorestr.xml",
                 "-rvapi",self.reportDir(),
                 "-rvapi-document",self.reportDocumentName()
               ]

        # Start lorestr
        if sys.platform.startswith("win"):
            self.runApp ( "lorestr.bat",cmd,logType="Main" )
        else:
            self.runApp ( "lorestr",cmd,logType="Main" )

        self.restoreReportDocument()
        self.rvrow += 100

        # check solution and register data
        have_results = False
        if os.path.isfile(pdbout):

            verdict_row = self.rvrow
            self.rvrow += 4

            self.putTitle ( "Lorestr Output" )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( 
                                None,
                                pdbout,
                                None,
                                self.getMTZOFName(),
                                libPath = libin,
                                leadKey = 1,
                                refiner = "refmac" 
                            )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( hkl     )
                structure.copySubtype        ( istruct )
#               structure.copyLigands        ( istruct )
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True

                rvrow0 = self.rvrow
                try:
                    meta = qualrep.quality_report ( self,revision,
                                      istruct.getXYZFilePath(self.inputDir()) )
                except:
                    meta = None
                    self.stderr ( " *** validation tools failure" )
                    self.rvrow = rvrow0 + 6

                if meta:
                    verdict_meta = {
                        "data"   : { "resolution" : hkl.getHighResolution(raw=True) },
                        "params" : { "homologs"   : self.getParameter(self.task.parameters.sec1.contains.AUTO),
                                     "mr"         : self.getParameter(self.task.parameters.sec1.contains.MR_CBX) },
                        "xyzmeta" : structure.xyzmeta
                    }
                    verdict_lorestr.putVerdictWidget ( self,verdict_meta,verdict_row )
                    self.generic_parser_summary["lorestr"] = {
                        "R_factor" : str(verdict_meta['lorestr']["rfact"][1]),
                        "R_free"   : str(verdict_meta['lorestr']["rfree"][1])
                    }
                    #self.copyTaskMetrics ( "lorestr","R_factor","rfactor" )
                    #self.copyTaskMetrics ( "lorestr","R_free"  ,"rfree"   )

                    auto.makeNextTask ( self, {
                        "revision" : revision,
                        "R_factor" : str(verdict_meta['lorestr']["rfact"][1]),
                        "R_free"   : str(verdict_meta['lorestr']["rfree"][1])
                    }, self.file_stderr)

        else:
            self.putTitle ( "No Output Generated" )


        try:
            shutil.rmtree ( "lorestr_Output" )
        except:
            self.stderrln ( "\n ***** could not delete residual directory " +\
                            os.path.join(self.job_dir,"lorestr_Output") + "\n" )
            pass

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Lorestr ( "",os.path.basename(__file__) )
    drv.start()
