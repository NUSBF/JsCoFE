##!/usr/bin/python

#
# ============================================================================
#
#    06.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  GESAMT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.lsqkab.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2024
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
import pyrvapi
import gemmi

#  application imports
from . import basic
#from   pycofe.varut  import jsonut
from   pycofe.dtypes import dtype_template


# ============================================================================
# Make LsqKab driver

class LsqKab(basic.TaskDriver):

    # make task-specific definitions
    def lsqkab_xyz      (self):  return "lsqkab.pdb"
    def lsqkab_ens      (self):  return "lsqkab_ens.pdb"
    def dist_graph_id   (self):  return "dist_graph_id"
    def deltas_table_id (self):  return "deltas_table_id"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare lsqkab job

        # Just in case (of repeated run) remove the output xyz file. When lsqkab
        # succeeds, this file is created.
        if os.path.isfile(self.lsqkab_xyz()):
            os.remove(self.lsqkab_xyz())

        # Prepare lsqkab input
        sec1 = self.task.parameters.sec1.contains

        # fetch input data
        moving_xyz = self.makeClass ( self.input_data.data.moving_xyz[0] )
        fixed_xyz  = self.makeClass ( self.input_data.data.fixed_xyz[0]  )

        self.open_stdin()
        for i in range(self.task.maxFitParamRows):
            asel = self.getParameterN(sec1,"FIT_"+str(i)+"_SEL")
            if asel=="NO":
                break
            else:
                key = "FIT "
                if asel=="AA":
                    key += "ATOM "
                else:
                    key += "RESIDUE " + asel + " "
                self.write_stdin ([
                    key + self.getParameterN(sec1,"FITFROM"+str(i)) + " TO "    +\
                          self.getParameterN(sec1,"FITTO"+str(i))   + " CHAIN " +\
                          self.getParameterN(sec1,"FITCHAIN"+str(i)+"_SEL"),
                    "MATCH " +
                          self.getParameterN(sec1,"FROM"+str(i)) + " TO "    +\
                          self.getParameterN(sec1,"TO"+str(i))   + " CHAIN " +\
                          self.getParameterN(sec1,"CHAIN"+str(i)+"_SEL"),
                ])
        sec_sphere = sec1.SPHERE_SEC.contains
        if self.getParameter(sec_sphere.SPHERE_CBX)=="True":
            self.write_stdin ( "RADIUS " + self.getParameter(sec_sphere.RADIUS) )
            if self.getParameter(sec_sphere.CENTER_SEL)=="C":
                self.write_stdin ( " " + self.getParameter(sec_sphere.CENTER_X) +\
                                   " " + self.getParameter(sec_sphere.CENTER_Y) +\
                                   " " + self.getParameter(sec_sphere.CENTER_Z) )
            self.write_stdin ( "\n" )
        self.write_stdin ([
            "OUTPUT XYZ RMS DELTAS",
            "END"
        ])
        self.close_stdin()

        fixed_path = fixed_xyz.getPDBFilePath ( self.inputDir() )
        cmd = [
            "xyzinf", fixed_path,
            "xyzinm", moving_xyz.getPDBFilePath(self.inputDir()),
            "xyzout", self.lsqkab_xyz()
        ]

        # run lsqkab
        self.runApp ( "lsqkab",cmd,logType="Main" )

        title_cnt = 1
        if os.path.isfile("DELTAS"):

            pyrvapi.rvapi_set_text  ( "<h3>" + str(title_cnt) + ". Interatomic distances</h3>",
                                      self.report_page_id(),self.rvrow,0,1,1 )
            title_cnt += 1
            pyrvapi.rvapi_add_graph ( self.dist_graph_id(),self.report_page_id(),
                                      self.rvrow+1,0,1,1 )
            pyrvapi.rvapi_set_graph_size ( self.dist_graph_id(),700,400 )
            pyrvapi.rvapi_add_graph_data ( "data",self.dist_graph_id(),"Distances" )
            pyrvapi.rvapi_add_graph_dataset ( "pairNo","data",self.dist_graph_id(),
                                              "Atom pair number","Atom pair number" )
            pyrvapi.rvapi_add_graph_dataset ( "dist","data",self.dist_graph_id(),
                                              "Interatomic distance","Interatomic distance" )
            self.rvrow += 2

            pyrvapi.rvapi_add_table ( self.deltas_table_id(),"Match details",
                                      self.report_page_id(),self.rvrow,0,1,1, -1 )
            pyrvapi.rvapi_put_horz_theader ( self.deltas_table_id(),
                                "##","Serial number",0 )
            pyrvapi.rvapi_put_horz_theader ( self.deltas_table_id(),
                                "Fixed<br>Structure","Fixed structure atoms",1 )
            pyrvapi.rvapi_put_horz_theader ( self.deltas_table_id(),
                                "Distance","Distance between atoms, &Aring;",2 )
            pyrvapi.rvapi_put_horz_theader ( self.deltas_table_id(),
                                "Moving<br>Structure","Moving structure atoms",3 )
            row = 0
            with open("DELTAS") as f:
                for line in f:
                    lst = line.strip().split()
                    if len(lst)>=5:
                        pyrvapi.rvapi_put_table_string ( self.deltas_table_id(),
                                                         str(row+1),row,0 )
                        pyrvapi.rvapi_put_table_string ( self.deltas_table_id(),
                                                         lst[1].ljust(5," ")+lst[2],row,1 )
                        pyrvapi.rvapi_put_table_string ( self.deltas_table_id(),lst[0],row,2 )
                        pyrvapi.rvapi_put_table_string ( self.deltas_table_id(),
                                                         lst[3].ljust(5," ")+lst[4],row,3 )
                        row += 1
                        pyrvapi.rvapi_add_graph_real ( "pairNo","data",self.dist_graph_id(),float(row),"%g" )
                        pyrvapi.rvapi_add_graph_real ( "dist","data",self.dist_graph_id(),float(lst[0]),"%g" )

            pyrvapi.rvapi_add_graph_plot ( "plot",self.dist_graph_id(),
                    "Score profiles","Atom pair number","Interatomic distance" )
            pyrvapi.rvapi_add_plot_line ( "plot","data",self.dist_graph_id(),"pairNo","dist" )
            pyrvapi.rvapi_set_line_options ( "dist","plot","data",self.dist_graph_id(),
                                             "#00008B","solid","filledCircle",2.5,True )

            self.rvrow += 1
            self.putMessage ( "&nbsp;" )


        have_results = False

        if os.path.isfile(self.lsqkab_xyz()):

            # compose a superposed ensemble
            stf = gemmi.read_structure ( fixed_path )
            stf.setup_entities()
            stm = gemmi.read_structure ( self.lsqkab_xyz() )
            stm.setup_entities()
            stf.add_model ( stm[0] )
            stf.renumber_models()
            stf.write_pdb ( self.lsqkab_ens() )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            self.putMessage ( "<h3>" + str(title_cnt) + ". Moved structure</h3>" )
            title_cnt += 1
            xyz = self.registerXYZ ( None,self.lsqkab_xyz() )
            if xyz:
                # xyz.putXYZMeta    ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                self.putMessage   ( "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +\
                                    xyz.dname + "&nbsp;" )
                self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                    "Moved structure&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
                                    xyz )

            # register the superposed ensemble

            self.putMessage ( "<h3>" + str(title_cnt) + ". Superposition</h3>" )
            ensemble = self.registerEnsemble ( dtype_template.subtypeProtein(),
                                               self.lsqkab_ens() )
            if ensemble:
                self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),
                                         "Superposed ensemble&nbsp;&nbsp;",
                                         ensemble )
                have_results = True

        else:
            self.putTitle ( "No Output Files Generated" )


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = LsqKab ( "",os.path.basename(__file__) )
    drv.start()
