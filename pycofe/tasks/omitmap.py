##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  OMITMAP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python omitmap.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template



# ============================================================================
# Make OmitMap driver

class OmitMap(basic.TaskDriver):

    def run(self):

        # fetch input data

        # revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        sec1     = self.task.parameters.sec1.contains

        # --------------------------------------------------------------------

        labin_fo = hkl.getMeanF()
        if labin_fo[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        labin_fo[2] = hkl.getFreeRColumn()
        input_mtz   = "_input.mtz"

        if hasattr(istruct,"FC"):
            labin_fc = [istruct.FC,istruct.PHI]
        elif istruct.refiner=="refmac":
            labin_fc = ["FC_ALL_LS",istruct.PHI]
        elif istruct.refiner=="buster":
            labin_fc = ["FC",istruct.PHI]
        else:
            self.fail ( "<h3>No calculated amplitude data.</h3>" +\
                    "This task requires calculated Fc columns in reflection data, " +\
                    "which were not found.",
                    "No calculated amplitude data." )
            return

        self.makePhasesMTZ (
                hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
                istruct.getMTZFilePath(self.inputDir()),labin_fc,
                input_mtz )
        
        # mapout = self.getMapOFName()
        mapout = dtype_template.makeDataId(self.job_id,1) + "_" + self.getMapOFName()
        mapout_fpath = os.path.join ( self.outputDir(),mapout )

        scale_fobs = self.getParameter ( sec1.SCALE_FOBS )
        scale_fc   = self.getParameter ( sec1.SCALE_FC   )
        if not scale_fobs or not scale_fc:
            scale_fobs = "2"
            scale_fc   = "-1"

        keywords = [
            "LABIN FP=" + labin_fo[0] + " FC=" + labin_fc[0] + " PHI=" + labin_fc[1],
            "SCALE " + str(scale_fobs) + " " + str(scale_fc)
        ]

        res_min = self.getParameter ( sec1.RES_MIN )
        res_max = self.getParameter ( sec1.RES_MAX )
        if res_min and res_max:
            keywords.append ( "RESOLUTION " + str(res_min) + " " + str(res_max) )

        if self.getParameter ( sec1.TRUNCATE_SEL )=="1":
            keywords.append ( "TRUNCATE " )
        if self.getParameter(sec1.HISTOGRAM_SEL)=="1":
            keywords.append ( "HISTOGRAM" )

        dlimit = self.getParameter ( sec1.DST_LIM )
        if dlimit:
            keywords.append ( "DLIMIT " + str(dlimit) )

        grid = self.getParameter (sec1.GRID )
        if grid:
            keywords.append ( "GRID " + str(grid) )

        format = self.getParameter (sec1.FORMAT_SEL )
        if format=="MFF":
            self.putMessage ( "<i>Groningen Master Fourier File format is requested " +\
                              "-- map will not be visualisable</i>" )
            keywords.append ( "MFFOUTPUT" )

        keywords.append ( "END" )

        self.open_stdin  ()
        self.write_stdin ( keywords )
        self.close_stdin ()

        # Prepare report parser
        self.runApp (
            "omit",["HKLIN" ,input_mtz,
                    "MAPOUT",mapout_fpath],
            logType="Main"
        )

        summary = "failed to calculate"
        if os.path.isfile(mapout_fpath):
            grid_id = self.getWidgetId ( "grid" )
            self.putGrid ( grid_id )
            self.putMessage1 ( grid_id,"<b>Omit map:</b>&nbsp;",0,0 )
            if format=="CCP4":
                self.putUglyMolButton_map ( "","",mapout_fpath, # structure.getDMapFilePath(self.outputDir()),
                                            mapout,"View",grid_id,0,1 )
            self.putDownloadButton ( mapout_fpath,"Export",grid_id,0,2 )
            sfo = float(scale_fobs)
            sfc = float(scale_fc)
            summary = ""
            if sfo!=0.0:
                if sfo==-1.0:
                    summary = "-"
                elif sfo!=1.0:
                    summary = str(scale_fobs) + "*"
                summary += "F<sub>o</sub>"
            if sfc!=0.0:
                if sfc==-1.0:
                    summary += "-"
                elif sfc==1.0:
                    summary += "+"
                else:
                    if sfc>0.0:
                        summary += "+"
                    summary += str(scale_fobs) + "*"
                summary += "F<sub>c</sub>"
            summary += " map calculated"

        # this will go in the project tree line
        self.generic_parser_summary["omitmap"] = {
            "summary_line" : summary
        }

        # close execution logs and quit; "False" because no data passed on follow-up jobs
        self.success ( False )

        return


# ============================================================================

if __name__ == "__main__":

    drv = OmitMap ( "",os.path.basename(__file__) )
    drv.start()
