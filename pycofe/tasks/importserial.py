##!/usr/bin/python

#
# ============================================================================
#
#    04.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  IMPORTSERIAL ME WORKFLOW EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.importserial jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Earl Talavera, Maria Fando, Eugene Krissinel 2025
#
# ============================================================================
#

#  python native imports
import os


import pyrvapi

#from   pycofe.etc  import pyrama
from   pycofe.varut  import rvapi_utils


#  application imports
from   pycofe.tasks  import import_task
from   pycofe.proc    import import_filetype, import_merged
# from   pycofe.auto   import auto

# ============================================================================
# Make ImportSerial driver

class ImportSerial(import_task.Import):
    
    import_dir = "uploads"
    
    def importDir(self):  return self.import_dir       # import directory

    # ------------------------------------------------------------------------

    def run(self): #This is how the apps are ran

        self.putMessage("<b><h3> File Existance Check </h3></b> ") #Heading , remove later
        self.putMessage(" ") #Spacing , remove later

        hklin = os.path.join ( self.importDir(),self.task.file_select[0].path ) # Creates the import button functionality
        halfdataset1 = os.path.join ( self.importDir(),self.task.file_select[1].path )  #can't have a - in the name
        halfdataset2 = os.path.join ( self.importDir(),self.task.file_select[2].path )  
        cellfile = os.path.join ( self.importDir(),self.task.file_select[3].path ) 
        reference = os.path.join ( self.importDir(),self.task.file_select[4].path )   

        self.putMessage (str(hklin) + " : " + (" exists" if os.path.isfile(hklin) else " does not exist") )
        self.putMessage ( "\n" + str(halfdataset1) + " : " + (" exists" if os.path.isfile(halfdataset1) else " does not exist") )
        self.putMessage ( "\n" + str(halfdataset2) + " : " + (" exists" if os.path.isfile(halfdataset2) else " does not exist") )
        self.putMessage ( "\n" + str(cellfile) + " : " + (" exists" if os.path.isfile(cellfile) else " does not exist") )
        self.putMessage ( "\n" + str(reference) + " : " + (" exists" if os.path.isfile(reference) else " does not exist") )
        
        # --------------------------- cmd option keywords-------------------------------

        outputMTZFName = "project_dataset.mtz"

        cmd = [
            # "-m"         , "import_serial",
            "--hklin"    , hklin,
        ]

        
        # --------------------------- Retrieving input data-------------------------------

        # Prepare import serial input
        # fetch input data from js file using inputID

        sec1 = self.task.parameters.sec1.contains #Call section 1 containing all the parameters
        sec2 = self.task.parameters.sec2.contains #Call section 2

        self.putMessage(" ") #Spacing , remove later
        self.putMessage("<b><h3> Cmd Parameter Keywords and Value </h3></b> ") #Heading , remove later
        self.putMessage(" ") #Spacing , remove later


        # Retrieve the keywords from file input 

        # If .hkl1 or .hkl2 file was provided
        if os.path.isfile(halfdataset1) or os.path.isfile(halfdataset2) : 
            cmd += [ "--half-dataset"]

        #If .hkl1 file was provided
        if os.path.isfile(halfdataset1):
            cmd += [ str(halfdataset1) ]
            self.putMessage(str(cmd)) 

        #If .hkl2 file was provided
        if os.path.isfile(halfdataset2):
            cmd += [ str(halfdataset2) ]
            self.putMessage(str(cmd))        

        #If cell file was provided
        if os.path.isfile(cellfile):
            cmd += [ "--cellfile", str(cellfile) ]
            self.putMessage(str(cmd))

        #If reference file was provided
        if os.path.isfile(reference):
            cmd += [ "--reference", str(reference) ]
            self.putMessage(str(cmd))


        wavelength = self.getParameter ( sec1.WAVELENGTH ).strip()
        if wavelength: # If there is wavelength user input
            wavelength = str(wavelength)
            cmd += [ "--wavelength", str(wavelength) ]
            self.putMessage(str(cmd)) 

        spacegroup = self.getParameter ( sec1.SPACEGROUP ).strip()
        if spacegroup: # If there is spacegroup user input
            spacegroup = str(spacegroup)
            cmd += [ "--spacegroup", str(spacegroup) ]
            self.putMessage(str(cmd))  

        cell = self.getParameter ( sec1.UNITCELLPARAMETERS ).strip()
        if cell: # If there is cell user input, split each input into a string for 6 args
            cell = str(cell)
            splitcell = cell.split()
            cmd += [ "--cell"]
            cmd.extend(splitcell)
            self.putMessage(str(cmd)) 

        dmin = self.getParameter ( sec2.DMIN ).strip()
        if dmin: # If there is High-resolution cutoff user input
            dmin = str(dmin)
            cmd += [ "--dmin", str(dmin) ]
            self.putMessage(str(cmd)) 

        dmax = self.getParameter ( sec2.DMAX ).strip()
        if dmax: # If there is Low-resolution cutoff user input
            dmax = str(dmax)
            cmd += [ "--dmax", str(dmax) ]
            self.putMessage(str(cmd)) 


        self.putMessage("<b>Import Serial cmd command :</b>" + " ".join(cmd))

        self.putMessage(" ") #Spacing , remove later


         # ------------------------------- Display the value of the data to the output -----------------------

        self.putMessage("<b><h3> Parameters Input Value </h3></b> ") #Heading , remove later
        self.putMessage(" ") #Spacing , remove later

        self.putMessage( "\n" + " <b>Wavelength is </b>"+ str(wavelength) )
        self.putMessage( "\n" + " <b>Spacegroup is </b>"+ str(spacegroup) )
        self.putMessage( "\n" + " <b>Unit cell parameters are </b>"+ str(cell) )
        self.putMessage( "\n" + " <b>High Resolution Cutoff is </b>"+ str(dmin) )
        self.putMessage( "\n" + " <b>Low Resolution Cutoff is </b>"+ str(dmax) )
        

       #-----------------------------------Run the import_serial task--------------------------------
        self.runApp ( "import_serial",cmd,logType="Main" )

        #------------------------------------------------------------------------------
      

        # reportPanelId = self.getWidgetId ( "tableOne_report" )
        # pyrvapi.rvapi_add_panel  ( reportPanelId,self.report_page,0,0,1,1 )
        # table_id = self.getWidgetId ( "tableOne_table" )

        # tableDict =  { 
        #     'title'       : "Table 1. Diffraction data collection and refinement statistics.",
        #     'state'       : 0,                    # -1,0,1, -100,100
        #     'class'       : "table-blue",         # "table-blue" by default
        #     'css'         : "text-align:left;",  # "text-align:rigt;" by default
        #     'alt_row_css' : "background:#EAF2D3;text-align:left;",
        #     'horzHeaders' :  [],
        #     'rows'        : []
        # }

        # indent = "&nbsp;&nbsp;&nbsp;&nbsp;"

        # tableDict['rows'].append({'header':{'label': 'DATA COLLECTION', 'tooltip': ''},
        #                           'data': ['']})
        
        # tableDict['rows'].append({'header':{'label': indent + 'Wavelength', 'tooltip': ''},
        #                           'data': ['%0.3f' % wavelength]})

        # rvapi_utils.makeTable ( tableDict, table_id, reportPanelId, 0,0,1,1 )


        self.flush()

        have_results = True
        summary_line = "imported and merged: MTZ "  # line inside the cloud next to the job tree --imported and merged: MTZ 

        self.addCitation ( "import_serial" )

        # check solution and register data
        have_results = False
        summary_line = ""
        if os.path.isfile(outputMTZFName):

            self.putTitle ( "Output Data" )

            # make list of files to import
            self.resetFileImport()
            self.addFileImport ( outputMTZFName,import_filetype.ftype_MTZMerged() )

            self.import_dir = "./"
            hkl = import_merged.run ( self,"Reflection dataset",importPhases="" )

            if len(hkl)>0:

                have_results = True

                # for i in range(len(hkl)):
                #     new_hkl[i].new_spg      = hkl.new_spg.replace(" ","")
                #     # Do not overwrite dataStats; they should be correct!
                #     # new_hkl[i].dataStats    = hkl.dataStats
                #     new_hkl[i].aimless_meta = hkl.aimless_meta

                # self.generic_parser_summary["change_reso"] = {'SpaceGroup':hkl.new_spg}

                # summary_line = "new resolution limits: Res=" + \
                #                new_hkl[0].getHighResolution()   + \
                #                "&mdash;" + str(res_low) + " &Aring;"

                summary_line = "imported"


        self.generic_parser_summary["import_autorun"] = {
          "summary_line" : summary_line
        }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ImportSerial ( "",os.path.basename(__file__),{} ) #Call the number cruncher driver
    drv.start()




