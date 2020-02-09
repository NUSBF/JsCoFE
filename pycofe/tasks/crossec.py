##!/usr/bin/python

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CROSSEC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.crossec jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE/SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2020
#
# ============================================================================
#

#  python native imports
import os
import sys

import pyrvapi

#  application imports
import basic


# ============================================================================
# Make Refmac driver

class CrosSec(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "crossec.script"

    # make task-specific definitions
    def crossec_report  (self):  return "crossec_report"
    def crossec_graph_id(self):  return "crossec_graph_id"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare crossec input
        # fetch input data

        atom_type = self.getParameter ( self.task.parameters.ATOM )
        wlen_n    = int   ( self.getParameter ( self.task.parameters.WLENGTH_N    ) )
        wlen_min  = float ( self.getParameter ( self.task.parameters.WLENGTH_MIN  ) )
        wlen_step = float ( self.getParameter ( self.task.parameters.WLENGTH_STEP ) )

        wlen_n    = int(wlen_n/2)
        wlen_cntr = wlen_min + wlen_n*wlen_step
        wlen_n    = 2*wlen_n+1

        self.open_stdin()
        self.write_stdin ([
            "ATOM " + atom_type,
            "CWAV " + str(wlen_n) + " " + str(wlen_cntr) + " " + str(wlen_step),
            "VERB ",
            "END"
        ])
        self.close_stdin()

        # Start crossec
        #self.setGenericLogParser ( self.crossec_report(),True )
        self.runApp ( "crossec",[],logType="Main" )
        #self.unsetLogParser()

        pyrvapi.rvapi_set_text  ( "<h3>Anomalous scattering factors for atom type " + atom_type + "</h3>",
                                  self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_add_graph ( self.crossec_graph_id(),self.report_page_id(),
                                  self.rvrow+1,0,1,1 )
        pyrvapi.rvapi_set_graph_size ( self.crossec_graph_id(),700,400 )
        pyrvapi.rvapi_add_graph_data ( "data",self.crossec_graph_id(),"Factors" )
        pyrvapi.rvapi_add_graph_dataset ( "wavelength","data",self.crossec_graph_id(),
                                          "Wavelength","Wavelength" )
        pyrvapi.rvapi_add_graph_dataset ( "fp","data",self.crossec_graph_id(),
                                          "Dispersive term (f')","Dispersive term (f')" )
        pyrvapi.rvapi_add_graph_dataset ( "fpp","data",self.crossec_graph_id(),
                                          "Anomalous term (f'')","Anomalous term (f'')" )

        self.file_stdout.close()
        pattern = atom_type.upper() + "         "
        with open(self.file_stdout_path(),'r') as f:
            for line in f:
                if line.startswith(pattern):
                    lst = line.split()
                    pyrvapi.rvapi_add_graph_real ( "wavelength","data",
                                    self.crossec_graph_id(),float(lst[1]),"%g" )
                    pyrvapi.rvapi_add_graph_real ( "fp","data",
                                    self.crossec_graph_id(),float(lst[2]),"%g" )
                    pyrvapi.rvapi_add_graph_real ( "fpp","data",
                                    self.crossec_graph_id(),float(lst[3]),"%g" )

        pyrvapi.rvapi_add_graph_plot   ( "plot",self.crossec_graph_id(),
                                         "Anomalous factors","Wavelength",
                                         "Anomalous Scattering Factors" )
        pyrvapi.rvapi_add_plot_line    ( "plot","data",self.crossec_graph_id(),
                                         "wavelength","fp" )
        pyrvapi.rvapi_set_line_options ( "fp","plot","data",self.crossec_graph_id(),
                                         "#00008B","solid","off",2.5,True )
        pyrvapi.rvapi_add_plot_line    ( "plot","data",self.crossec_graph_id(),
                                         "wavelength","fpp" )
        pyrvapi.rvapi_set_line_options ( "fpp","plot","data",self.crossec_graph_id(),
                                         "#8B8B00","solid","off",2.5,True )
        pyrvapi.rvapi_set_plot_legend  ( "plot",self.crossec_graph_id(),"sw","" )

        self.rvrow += 2

        self.file_stdout = open ( self.file_stdout_path(),'a' )

        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = CrosSec ( "",os.path.basename(__file__) )
    drv.start()
