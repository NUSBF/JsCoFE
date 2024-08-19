##!/usr/bin/python

#
# ============================================================================
#
#    16.05.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  EXPORTMAPS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python exportmaps.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2024
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template


# ============================================================================
# Make ExportMaps driver

class ExportMaps(basic.TaskDriver):
    
    mapcount = 0
    
    def makeMapExport ( self,serNo,mtzfile,FWT,PHWT,fsuffix,title,grid_id,row,
                             diff=False ):
        
        if FWT and PHWT:
            try:
                mapfile = self.calcCCP4Maps ( mtzfile,"tmp",
                                              "labels:" + FWT + "," + PHWT )
                fname   = dtype_template.makeDataId(self.job_id,serNo) +\
                                              "_" + self.outputFName + fsuffix
                fpath = os.path.join ( self.outputDir(),fname )
                os.rename ( mapfile[0],fpath )
                self.putMessage1 ( grid_id,title,row,0,colSpan=5 )
                row1 = row + 1
                self.putMessage1 ( grid_id,"&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
                                          row1,0 )
                self.putMessage1 ( grid_id,fname + "<sup>&nbsp;</sup>",row1,1 )
                if diff:
                    self.putUglyMolButton_map ( "","",fpath,fname,"View",grid_id,row1,3 )
                else:
                    self.putUglyMolButton_map ( "",fpath,"",fname,"View",grid_id,row1,3 )
                self.putDownloadButton    ( fpath,"Export",grid_id,row1,3 )
                self.putMessage1 ( grid_id,"&nbsp;",row1+1,0 )
                self.mapcount = self.mapcount + 1
                return row1 + 2
            except:
                pass
        return row


    def run(self):

        # fetch input data
        if hasattr(self.input_data.data,"istruct"):
            istruct = self.makeClass ( self.input_data.data.istruct[0] )
        elif hasattr(self.input_data.data,"isubstruct"):
            istruct = self.makeClass ( self.input_data.data.isubstruct[0] )

        # --------------------------------------------------------------------

        mtzfile = istruct.getMTZFilePath ( self.inputDir() )

        grid_id = self.getWidgetId ( "outgrid" )
        self.putGrid ( grid_id )

        row = self.makeMapExport ( 1,mtzfile,istruct.FWT,istruct.PHWT,".map",
                              "<b><i>Electron density map (2Fo-Fc):</i></b>",
                              grid_id,0 )

        row = self.makeMapExport ( 2,mtzfile,istruct.DELFWT,istruct.PHDELWT,
                              ".diff.map",
                              "<b><i>Difference map (Fo-Fc):</i></b>",
                              grid_id,row,diff=True )

        row = self.makeMapExport ( 3,mtzfile,istruct.FAN,istruct.PHAN,".ano.map",
                              "<b><i>Anomalous map:</i></b>",
                              grid_id,row )

        row = self.makeMapExport ( 4,mtzfile,istruct.DELFAN,istruct.PHDELAN,
                              ".adiff.map",
                              "<b><i>Anomalous difference map:</i></b>",
                              grid_id,row,diff=True )


        # this will go in the project tree line
        summary = "no map generated"
        if self.mapcount==1:
            summary = "1 map generated"
        elif self.mapcount>1:
            summary = str(self.mapcount) + " maps generated"
        self.generic_parser_summary["exportmaps"] = {
            "summary_line" : summary
        }

        # close execution logs and quit; "False" because no data passed on follow-up jobs
        self.success ( False )

        return


# ============================================================================

if __name__ == "__main__":

    drv = ExportMaps ( "",os.path.basename(__file__) )
    drv.start()
