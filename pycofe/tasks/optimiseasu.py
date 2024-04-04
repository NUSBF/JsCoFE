##!/usr/bin/python

#
# mmCIF ready
#
# ============================================================================
#
#    06.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  OPTIMISE ASU EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python optimiseasu.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2023-2024
#
# ============================================================================
#

#  python native imports
import os

import gemmi

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_xyz
from  pycofe.proc   import optimize_xyz
from  pycofe.auto   import auto,auto_workflow
from  pycofe.varut  import rvapi_utils


# ============================================================================
# Make Optimise ASU driver

class OptimiseASU(basic.TaskDriver):

    def importDir(self): return "." # in current directory ( job_dir )

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        idata = self.makeClass ( self.input_data.data.idata[0] )
        if hasattr(self.input_data.data,"istruct"):
            istruct = self.makeClass ( self.input_data.data.istruct[0] )
        else:
            istruct = idata

        xyzin = istruct.getXYZFilePath ( self.inputDir() )

        # --------------------------------------------------------------------

        mmcifout = self.getMMCIFOFName()

        st  = gemmi.read_structure ( xyzin )
        st.setup_entities()
        log = optimize_xyz.optimizeXYZ ( st,body=self )

        summary_line = ""
        have_results = False

        if len(log)>0:

            st.make_mmcif_document().write_file ( mmcifout )

            tdict = {
                "title" : "Chain move summary",
                "state" : 0, 
                "class" : "table-blue",
                "css"   : "text-align:right;",
                "horzHeaders" :  [
                    { "label"   : "Type",
                      "tooltip" : "Chain type"
                    },{
                      "label"   : "Moved to",
                      "tooltip" : "Applied symmetry operator"
                    }
                ],
                "rows" : []
            }

            optimised  = False
            reconsider = False
            water      = False
            for i in range(len(log)):
                tdict["rows"].append ({
                    "header" : { "label"   : "Chain " + log[i]["name"],
                                 "tooltip" : "Chain Id"
                               },
                    "data"   : [ log[i]["type"],log[i]["op"] ]
                })
                if log[i]["op"]!="x,y,z":
                    optimised  = True
                if log[i]["type"].endswith("(*)"):
                    reconsider = True
                if log[i]["type"]=="Water":
                    water      = True

            if optimised:

                if idata._type==dtype_xyz.dtype():
                    self.putMessage ( "<h3>ASU in atomic coordinates (XYZ) was optimised</h3>" )
                else:
                    self.putMessage ( "<h3>ASU in Structure Revision was optimised</h3>" )

                rvapi_utils.makeTable ( tdict,self.getWidgetId("summary_table"),
                                        self.report_page_id(),
                                        self.rvrow,0,1,1 )
                self.rvrow += 1

                if water or reconsider:
                    self.putMessage ( "&nbsp;" )

                if water:
                    self.putMessage ( "Water molecules were moved individually; you may " +\
                                      "need to check whether it was done well." )
                if reconsider:
                    self.putMessage ( "(*) these chains may need manual correction, please check" )


                if idata._type==dtype_xyz.dtype():

                    self.putTitle   ( "Results" )
                    oxyz = self.registerXYZ ( mmcifout,None,checkout=True )
                    if oxyz:
                        # oxyz.putXYZMeta ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                        self.putMessage (
                            "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                            oxyz.dname )
                        self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Edited coordinates",oxyz )
                        summary_line = "ASU optimised"
                        have_results = True
                    else:
                        # close execution logs and quit
                        summary_line = "errors"
                        self.putMessage ( "<h3>XYZ Data was not formed after edited</h3>" +
                                        "<i>Check that coordinate data was edited correctly.</i>" )

                else:  # idata is revision, controlled in JS part

                    self.putTitle   ( "Results" )

                    oxyz = self.registerStructure ( 
                                mmcifout,
                                None,
                                istruct.getSubFilePath(self.inputDir()),
                                istruct.getMTZFilePath(self.inputDir()),
                                libPath    = istruct.getLibFilePath(self.inputDir()),
                                mapPath    = istruct.getMapFilePath(self.inputDir()),
                                dmapPath   = istruct.getDMapFilePath(self.inputDir()),
                                leadKey    = istruct.leadKey,copy_files=False,
                                map_labels = istruct.mapLabels,
                                refiner    = istruct.refiner 
                            )
                    if oxyz:
                        oxyz.copy_refkeys_parameters ( istruct )
                        oxyz.copyAssociations   ( istruct )
                        oxyz.addDataAssociation ( istruct.dataId )  # ???
                        oxyz.copySubtype        ( istruct )
                        oxyz.copyLigands        ( istruct )
                        self.putStructureWidget ( self.getWidgetId("structure_btn"),
                                                    "Structure and electron density",
                                                    oxyz )
                        # update structure revision
                        revision = self.makeClass ( idata    )
                        revision.setStructureData ( oxyz     )
                        self.registerRevision     ( revision )
                        summary_line = "ASU optimised"
                        have_results = True

                        if self.task.autoRunName.startswith("@"):
                            # scripted workflow framework
                            auto_workflow.nextTask ( self,{
                                    "data" : {
                                        "revision" : [revision]
                                    }
                            })
                            # self.putMessage ( "<h3>Workflow started</hr>" )

                        else:  # pre-coded workflow framework
                            auto.makeNextTask ( self,{
                                "revision" : revision
                            }, log=self.file_stderr)

                    else:
                        self.putTitle ( "No Output Structure Generated" )
                        summary_line = "errors"

            else:
                self.putMessage ( "<h3>ASU already in optimal state</h3>" )
                summary_line = "ASU already in optimal state"

        else:
            if not st.spacegroup_hm:
                self.putMessage ( "<h3>No symmetry information found in input</h3>" )
            self.putTitle ( "No transformations have been done" )
            summary_line = "ASU not optimised"

        # this will go in the project tree line
        self.generic_parser_summary["OptimiseASU"] = {
            "summary_line" : summary_line
        }

        self.addCitation ( "default" )

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = OptimiseASU ( "",os.path.basename(__file__) )
    drv.start()
