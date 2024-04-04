##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    04.11.20   <--  Date of Last Modification.
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

import pyrvapi

#  application imports
from . import basic
from   pycofe.varut  import rvapi_utils


# ============================================================================
# Make Refmac driver

class CrosSec(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "crossec.script"

    # make task-specific definitions
    def crossec_report  (self):  return "crossec_report"
    def crossec_graph_id(self):  return "crossec_graph_id"

    # ------------------------------------------------------------------------

    def KeV2A ( self,kev ):
        if kev:
            return 12.39841662513396/float(kev)
        return kev

    def A2KeV ( self,A ):
        if A:
            return 12.39841662513396/float(A)
        return A

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare crossec input
        # fetch input data

        units     = self.getParameter ( self.task.parameters.UNITS_SEL )
        atom_type = self.getParameter ( self.task.parameters.ATOM )

        if units=="W":
            wlen_n   = int   ( self.getParameter ( self.task.parameters.NPOINTS_W   ) )
            wlen_min = float ( self.getParameter ( self.task.parameters.WLENGTH_MIN ) )
            wlen_max = float ( self.getParameter ( self.task.parameters.WLENGTH_MAX ) )
            wlens    = [
                self.getParameter ( self.task.parameters.WAVELENGTH_01 ),
                self.getParameter ( self.task.parameters.WAVELENGTH_02 ),
                self.getParameter ( self.task.parameters.WAVELENGTH_03 ),
                self.getParameter ( self.task.parameters.WAVELENGTH_04 ),
                self.getParameter ( self.task.parameters.WAVELENGTH_05 ),
                self.getParameter ( self.task.parameters.WAVELENGTH_06 )
            ]
            unit_name = "Wavelength, Angstrom"
        else:
            wlen_n     = int ( self.getParameter ( self.task.parameters.NPOINTS_E ) )
            energy_min = self.getParameter ( self.task.parameters.ENERGY_MIN )
            energy_max = self.getParameter ( self.task.parameters.ENERGY_MAX )
            energies   = [
                self.getParameter ( self.task.parameters.ENERGY_01 ),
                self.getParameter ( self.task.parameters.ENERGY_02 ),
                self.getParameter ( self.task.parameters.ENERGY_03 ),
                self.getParameter ( self.task.parameters.ENERGY_04 ),
                self.getParameter ( self.task.parameters.ENERGY_05 ),
                self.getParameter ( self.task.parameters.ENERGY_06 )
            ]
            wlen_min = self.KeV2A ( energy_min )
            wlen_max = self.KeV2A ( energy_max )
            wlens = []
            for i in range(len(energies)):
                wlens.append ( self.KeV2A(energies[i]) )
            unit_name = "Photon energy, KeV"

        #  PART A

        wlen_cntr = (wlen_min + wlen_max)/2
        wlen_n    = int(wlen_n/2)
        wlen_n    = 2*wlen_n+1
        wlen_step = (wlen_max-wlen_min)/(wlen_n-1)

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

        ds_name = unit_name.lower().replace(" ","_")
        pyrvapi.rvapi_set_text  ( "<h3>A. Anomalous scattering factors plot for atom type " + atom_type + "</h3>",
                                  self.report_page_id(),self.rvrow,0,1,1 )
        pyrvapi.rvapi_add_graph ( self.crossec_graph_id(),self.report_page_id(),
                                  self.rvrow+1,0,1,1 )
        pyrvapi.rvapi_set_graph_size ( self.crossec_graph_id(),700,400 )
        pyrvapi.rvapi_add_graph_data ( "data",self.crossec_graph_id(),"Factors" )
        pyrvapi.rvapi_add_graph_dataset ( ds_name.lower(),"data",self.crossec_graph_id(),
                                          unit_name,unit_name )
        pyrvapi.rvapi_add_graph_dataset ( "fp","data",self.crossec_graph_id(),
                                          "Dispersive term (f')","Dispersive term (f')" )
        pyrvapi.rvapi_add_graph_dataset ( "fpp","data",self.crossec_graph_id(),
                                          "Anomalous term (f'')","Anomalous term (f'')" )

        self.file_stdout.close()
        pattern = atom_type.upper() + "         "
        nla     = 0
        data    = []
        with open(self.file_stdout_path(),'r') as f:
            for line in f:
                nla += 1
                if line.startswith(pattern):
                    lst = line.split()
                    val = float(lst[1])
                    if units=="E":
                        val = self.A2KeV ( val )
                    data.append ( [val,float(lst[2]),float(lst[3])] )
        self.file_stdout = open ( self.file_stdout_path(),'a' )

        for i in range(len(data)):
            pyrvapi.rvapi_add_graph_real ( ds_name,"data",
                            self.crossec_graph_id(),data[i][0],"%g" )
            pyrvapi.rvapi_add_graph_real ( "fp","data",
                            self.crossec_graph_id(),data[i][1],"%g" )
            pyrvapi.rvapi_add_graph_real ( "fpp","data",
                            self.crossec_graph_id(),data[i][2],"%g" )

        pyrvapi.rvapi_add_graph_plot   ( "plot",self.crossec_graph_id(),
                                         "Anomalous factors",unit_name,
                                         "Anomalous Scattering Factors" )
        pyrvapi.rvapi_add_plot_line    ( "plot","data",self.crossec_graph_id(),
                                         ds_name,"fp" )
        pyrvapi.rvapi_set_line_options ( "fp","plot","data",self.crossec_graph_id(),
                                         "#00008B","solid","off",2.5,True )
        pyrvapi.rvapi_add_plot_line    ( "plot","data",self.crossec_graph_id(),
                                         ds_name,"fpp" )
        pyrvapi.rvapi_set_line_options ( "fpp","plot","data",self.crossec_graph_id(),
                                         "#8B8B00","solid","off",2.5,True )
        pyrvapi.rvapi_set_plot_legend  ( "plot",self.crossec_graph_id(),"sw","" )

        self.rvrow += 2


        #  PART B

        nwav = []
        for i in range(len(wlens)):
            if wlens[i]:
                nwav.append ( str(wlens[i]) )

        self.stderrln ( str(nwav) )

        if len(nwav)>0:

            self.open_stdin()
            self.write_stdin ([
                "ATOM " + atom_type,
                "NWAV " + str(len(nwav)) + " " + " ".join(nwav),
                "VERB ",
                "END"
            ])
            self.close_stdin()

            self.runApp ( "crossec",[],logType="Main" )

            self.file_stdout.close()

            tdict = {
                #"title": "Scattering Factors",
                "state": 0, "class": "table-blue", "css": "text-align:right;",
                "horzHeaders" :  [
                    { "label": "Photon Energy (KeV)" , "tooltip": "Photon Energy"   },
                    { "label": "Wavelength (&Aring;)", "tooltip": "Wavelength"      },
                    { "label": "Dispersive term (f')", "tooltip": "Dispersive term" },
                    { "label": "Anomalous term (f'')", "tooltip": "Anomalous term"  }
                ],
                "rows" : []
            }

            nlb = 0
            with open(self.file_stdout_path(),'r') as f:
                for line in f:
                    nlb += 1
                    if nlb>nla and line.startswith(pattern):
                        lst = line.split()
                        tdict["rows"].append ({
                            "data" : [str(round(self.A2KeV(lst[1]),4)),lst[1],lst[2],lst[3]]
                        })
            self.file_stdout = open ( self.file_stdout_path(),'a' )

            pyrvapi.rvapi_set_text (
                "&nbsp;<p><h3>B. Selected anomalous scattering factors for atom type " +\
                atom_type + "</h3>",
                self.report_page_id(),self.rvrow+1,0,1,1 )

            rvapi_utils.makeTable ( tdict,self.getWidgetId("scatf_table"),
                                    self.report_page_id(),self.rvrow+2,0,1,1 )
            self.rvrow += 3


        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = CrosSec ( "",os.path.basename(__file__) )
    drv.start()
