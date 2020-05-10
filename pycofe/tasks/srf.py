##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    01.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SRF EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.srf jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
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
import uuid

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic


# ============================================================================
# Make Molrep driver

class SRF(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "molrep.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare srf input
        # fetch input data

        hkl  = self.makeClass ( self.input_data.data.hkl[0] )
        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains

        # prepare input file with cad (needed because SRF does not take column
        # labels on input)

        """
        molrep -po /tmp/eugene/ShelxE_34_molrep_ -ps /tmp/eugene/ShelxE_34_molrep_ -i
        labin F=F SIGF=SIGF
        file_f /Users/eugene/tmp/ShelxEi1/ShelxE_14.1.mtz
        rad 30.0   molsize
        chi 60.0   chi
        scale 6.0  top iso level

        resmax 2.0  hires cut-off
        sim 1.0     similarity   /  badd 5.0
        resmin 5.0  dw low
        aniso Y     aniso
              C     aniso RF
              S     aniso TF
              N     anisotropic
              K     overall
        """

        fpath = hkl.getHKLFilePath ( self.inputDir() )
        Fmean = hkl.getMeta ( "Fmean.value","" )
        sigF  = hkl.getMeta ( "Fmean.sigma","" )

        if Fmean == ""  or  sigF == "":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires amplitude data in the reflection " +\
                    "dataset, which are not found. SRF cannot be calculated.",
                    "No amplitude data" )
            return

        self.open_stdin()
        self.write_stdin ([
            "file_f " + fpath,
            "labin F=" + Fmean + " SIGF=" + sigF
        ])
        self.writeKWParameter ( sec1.MOLSIZE )
        self.writeKWParameter ( sec1.CHISEC  )
        self.writeKWParameter ( sec1.TOPISO  )
        self.writeKWParameter ( sec2.HIRES   )
        self.writeKWParameter ( sec2.DWSIM   )
        self.writeKWParameter ( sec2.DWBADD  )
        self.writeKWParameter ( sec2.DWBLOW  )
        scaling = self.getParameter ( sec2.SCALING_SEL )
        if scaling!="none":
            self.write_stdin ( "aniso " + scaling )
        self.close_stdin()

        # Run molrep
        self.runApp (
            "molrep",
            ["-i","-ps",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex)],
            logType="Main"
        )

        if os.path.isfile("molrep_rf.ps"):

            self.runApp ( "ps2pdf",["molrep_rf.ps"],logType="Service" )

            if os.path.isfile("molrep_rf.pdf"):

                pdfpath = os.path.splitext(hkl.getHKLFileName())[0] + ".pdf"
                os.rename ( "molrep_rf.pdf",os.path.join(self.reportDir(),pdfpath) )

                docpath = "molrep.doc"
                with open(os.path.join(self.reportDir(),docpath),'w') as outf:
                    with open(docpath,'r') as inf:
                        outf.write ( "<span style='font-size:1.125em'><pre>" + inf.read() + "</pre></span>" )

                docsecId = self.getWidgetId ( "molrep_doc" )
                self.putSection  ( docsecId,"Peaks and Stats",openState_bool=False )
                pyrvapi.rvapi_append_content ( docpath,False,docsecId )

                srfsecId = self.getWidgetId ( "srf_report" )
                self.putSection  ( srfsecId,"Self-Rotation Function",openState_bool=False )
                self.putMessage1 ( srfsecId,"<object data=\"" + pdfpath +\
                        "\" type=\"application/pdf\" " +\
                        "style=\"border:none;width:100%;height:1000px;\"></object>",
                    0 )

            else:
                self.putMessage ( "<h3>SRF pdf was not generated</h3>" )

        else:
            self.putMessage ( "<h3>SRF postscript was not generated</h3>" )

        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = SRF ( "",os.path.basename(__file__) )
    drv.start()
