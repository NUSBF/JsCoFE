##!/usr/bin/python

#
# ============================================================================
#
#    29.12.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.csymmatch exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
#import sys
import pyrvapi

#  application imports
import basic


# ============================================================================
# Make SymMatch driver

class SymMatch(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare csymmatch input
        # fetch input data
        #ref_revision = None
        #ref_hkl      = None
        ref_struct   = None
        if hasattr(self.input_data.data,"refstruct_struct"):
            # reference is revision
            #ref_revision = self.makeClass ( self.input_data.data.refstruct[0] )
            #ref_hkl      = self.makeClass ( self.input_data.data.refstruct_hkl[0] )
            ref_struct   = self.makeClass ( self.input_data.data.refstruct_struct[0] )
        else:
            #  reference is structure or xyz
            ref_struct   = self.makeClass ( self.input_data.data.refstruct[0] )

        cmd_params = []
        st_radius  = self.getParameter ( self.task.parameters.sec1.contains.RADIUS )
        if st_radius:
            cmd_params += [ "-connectivity-radius",st_radius ]
        if self.getParameter(self.task.parameters.sec1.contains.ORIGINS_CBX)=="True":
            cmd_params += [ "-origin-hand" ]

        ref_file_path = ref_struct.getXYZFilePath ( self.inputDir() )

        wdata = self.input_data.data.workstruct

        #  Run csymmatch in loop on work structures, and make output widgets
        #  in the same loop

        #self.putTitle ( "Symmetry Match Output" )

        tableId = self.getWidgetId ( "symmatch_out_table" )
        self.putTable ( tableId,"",self.report_page_id(),self.rvrow,mode=100 )
        #pyrvapi.rvapi_add_table ( tableId,"",self.report_page_id(),self.rvrow,0,1,1,100 )
        #pyrvapi.rvapi_set_table_style ( tableId,"table-common","text-align:left;" )
        self.setTableHorzHeaders ( tableId,["Work structure","Symmetry Match copy"],
                            [ "Original work structure name",
                              "Symmetry match copy structure name" ] )
        self.rvrow += 1

        fsuffix = "_" + self.outputFName

        revNo = 0  # output revision counter
        for i in range(len(wdata)):

            wdata[i] = self.makeClass ( wdata[i] )
            pyrvapi.rvapi_put_vert_theader ( tableId,str(i+1),"",i )
            pyrvapi.rvapi_put_table_string ( tableId,wdata[i].dname,i,0 )
            #pyrvapi.rvapi_shape_table_cell ( tableId,i,0,"",
            #        "text-align:left;width:auto;white-space:nowrap;","",1,1 );

            if wdata[i]._type=="DataRevision":
                work_hkl    = self.makeClass ( self.input_data.data.workstruct_hkl[revNo] )
                work_struct = self.makeClass ( self.input_data.data.workstruct_struct[revNo] )
                revNo += 1
            else:
                work_hkl    = None
                work_struct = wdata[i]

            file_out = work_struct.lessDataId ( work_struct.getXYZFileName() )
            fsplit   = os.path.splitext ( file_out )
            if not fsplit[0].endswith(fsuffix):
                file_out = fsplit[0] + fsuffix + fsplit[1]

            cmd = [ "-pdbin-ref", ref_file_path,
                    "-pdbin"    , work_struct.getXYZFilePath(self.inputDir()),
                    "-pdbout"   , file_out ] + cmd_params

            # start csymmatch
            self.runApp ( "csymmatch",cmd,logType="Main" )

            # check solution and register data
            if os.path.isfile(file_out):

                panelId = self.getWidgetId ( "symmatch_out_structure" )
                #pyrvapi.rvapi_set_table_style ( panelId,"grid-layout-compact","text-align:left;" )
                pyrvapi.rvapi_add_panel ( panelId,tableId,i+1,2,1,1 )

                self.setReportWidget ( panelId )

                if wdata[i]._type=="DataXYZ":

                    xyz = self.registerXYZ ( file_out,checkout=True )
                    xyz.putXYZMeta  ( self.outputDir(),self.file_stdout1,self.file_stderr,None )
                    self.putMessage ( "<b>Assigned name:</b>&nbsp;" + xyz.dname  )
                    self.putXYZWidget ( "xyz_widget","XYZ Coordinates",xyz,openState=-1 )

                elif wdata[i]._type in ["DataStructure","DataRevision"]:

                    structure = self.registerStructure ( file_out,
                                    work_struct.getSubFilePath (self.inputDir()),
                                    work_struct.getMTZFilePath (self.inputDir()),
                                    work_struct.getMapFilePath (self.inputDir()),
                                    work_struct.getDMapFilePath(self.inputDir()),
                                    work_struct.getLibFilePath (self.inputDir()),
                                    leadKey=work_struct.leadKey )
                    self.putStructureWidget ( "struct_widget","Structure and electron density",
                                              structure,openState=-1 )

                    if wdata[i]._type=="DataRevision":
                        wdata[i].setStructureData ( structure )
                        self.registerRevision     ( wdata[i],revNo,"" )
                        self.putMessage ( " " )

                else:
                    pyrvapi.rvapi_put_table_string ( tableId,"<i>UNRECOGNISED DATA TYPE</i>",i,1 )
                    pyrvapi.rvapi_shape_table_cell ( tableId,i,1,
                        "Data type of work structure was not assumed for symmetry " +\
                        "matching (most probably a bug, please report)",
                        "text-align:left;white-space:nowrap;color:maroon;" + \
                        "font-family:\"Courier\";text-decoration:none;" + \
                        "font-weight:normal;font-style:normal;width:auto;",
                        "",1,1 );

                self.resetReportPage()
                pyrvapi.rvapi_shape_table_cell ( tableId,i,1,"",
                    "text-align:left;width:auto;white-space:nowrap;","",1,1 );

            else:
                pyrvapi.rvapi_put_table_string ( tableId,"<i>MATCHING FAILED</i>",i,1 )
                pyrvapi.rvapi_shape_table_cell ( tableId,i,1,"",
                    "text-align:left;width:100%;white-space:nowrap;color:maroon;" + \
                    "font-family:\"Courier\";text-decoration:none;" + \
                    "font-weight:normal;font-style:normal;width:auto;",
                    "",1,1 );


        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = SymMatch ( "",os.path.basename(__file__) )
    drv.start()
