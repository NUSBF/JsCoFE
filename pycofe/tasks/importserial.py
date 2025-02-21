##!/usr/bin/python

#
# ============================================================================
#
#    21.02.25   <--  Date of Last Modification.
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

import json

#from   pycofe.etc  import pyrama
from   pycofe.varut  import rvapi_utils


#  application imports
from   pycofe.tasks  import import_task
from   pycofe.proc    import import_filetype, import_merged
# from   pycofe.auto   import auto
# from pycofe.tasks import mtz


# ============================================================================
# Make ImportSerial driver

class ImportSerial(import_task.Import):
    
    import_dir = "uploads"
    
    def importDir(self):  return self.import_dir  # import directory

    #Retrieve Json Data set inside job task folder
    def import_serial_json  (self):  return "project_dataset.json" 


    def run(self): #This is how the apps are ran

        #Retrieve file imports
        hklin = os.path.join ( self.importDir(),self.task.file_select[0].path ) # Creates the import button functionality
        halfdataset1 = os.path.join ( self.importDir(),self.task.file_select[1].path )  #can't have a "-" in the name
        halfdataset2 = os.path.join ( self.importDir(),self.task.file_select[2].path )  
        cellfile = os.path.join ( self.importDir(),self.task.file_select[3].path ) 
        reference = os.path.join ( self.importDir(),self.task.file_select[4].path )   

        #=============================== cmd option keywords ========================================
        outputMTZFName = "project_dataset.mtz"

        cmd = [
            # "-m"         , "import_serial",
            "--hklin"    , hklin,
        ]

        
        # ========================== Retrieving input data and json =====================================

        

        # Prepare import serial input
        # fetch input data from js file using inputID

        sec1 = self.task.parameters.sec1.contains #Call section 1 containing all the parameters
        sec2 = self.task.parameters.sec2.contains #Call section 2
        jsonout  = os.path.join (self.import_serial_json ())

        #Conflicting data message and list of data conflict
        conflict_data = False
        conflict_list = []
        
        # Retrieve the keywords from file input 
        # If .hkl1 or .hkl2 file was provided
        if os.path.isfile(halfdataset1) and os.path.isfile(halfdataset2) : 
            cmd += [ "--half-dataset", str(halfdataset1), str(halfdataset2)]
        
        #Display a message to the user if the user input unit cell parameters and reference file provided as both contain spacegroup
        if ((os.path.isfile(halfdataset1) and os.path.isfile(halfdataset2)==False) or (os.path.isfile(halfdataset1)==False and os.path.isfile(halfdataset2)) ):
            conflict_data=True
            conflict_list.append("Only one half data set was uploaded. Half-set correlation CC(1/2), CC* and Rsplit weren't calculated. Please upload two half-datasets if required ")
        
                   
        #If cell file was provided
        if os.path.isfile(cellfile):
            cmd += [ "--cellfile", str(cellfile) ]
          
        #If reference file was provided
        if os.path.isfile(reference):
            cmd += [ "--reference", str(reference) ]
           
        wavelength = self.getParameter ( sec1.WAVELENGTH ).strip()
        if wavelength: # If there is wavelength user input
            wavelength = str(wavelength)
            cmd += [ "--wavelength", str(wavelength) ]
         

        spacegroup = self.getParameter ( sec1.SPACEGROUP ).strip()
        if spacegroup: # If there is spacegroup user input
            spacegroup = str(spacegroup)
            cmd += [ "--spacegroup", str(spacegroup) ]

        #Display a message to the user if the user input spacegroup and reference file provided as both contain spacegroup
        if spacegroup and os.path.isfile(reference):
            conflict_data=True
            conflict_list.append("Two sets of Spacegroups are present from your input and another from the reference file. Please check the output ")
            
        
        cell = self.getParameter ( sec1.UNITCELLPARAMETERS ).strip()
        if cell: # If there is cell user input, split each input into a string for 6 args
            cell = str(cell)
            splitcell = cell.split()
            cmd += [ "--cell"]
            cmd.extend(splitcell)

        #Display a message to the user if the user input unit cell parameters and reference file provided as both contain spacegroup
        if cell and os.path.isfile(cellfile):
            conflict_data=True
            conflict_list.append("Two sets of Unit Cell Parameters are present from your input and another from the cell file. Please check the output ")
        
        #Display a message to the user if the user input unit cell parameters and reference file provided as both contain spacegroup
        if cell and os.path.isfile(reference):
            conflict_data=True
            conflict_list.append("Two sets of Unit Cell Parameters are present from your input and another from the reference file. Please check the output ")
            

        dmin = self.getParameter ( sec2.DMIN ).strip()
        if dmin: # If there is High-resolution cutoff user input
            dmin = str(dmin)
            cmd += [ "--dmin", str(dmin) ]
            

        dmax = self.getParameter ( sec2.DMAX ).strip()
        if dmax: # If there is Low-resolution cutoff user input
            dmax = str(dmax)
            cmd += [ "--dmax", str(dmax) ]
        
        # Display to the report a message of multiple conflicting data instances of parameters
        if conflict_data == True:
            self.putMessage("<h3><b> Conflict of input data </h3></b>")
            for conflict in conflict_list:
                self.putMessage(str(conflict))
            

        # ============================== Run the import_serial task =========================================

        self.runApp ( "import_serial",cmd,logType="Main" )

        # =============================== Report Log Tables ==========================================
      
        _report_widget_id = "report_page" #import report widget for table
        def report_page_id(self): return self._report_widget_id


        # ================================== Read and format Json File =======================================

        if os.path.isfile(jsonout): #Check if json file is present
                with open(jsonout) as json_file: #Open the JSON file
                    data = json.load ( json_file )
                    overall_table = data.get("overall")
                    binned_table = data.get("binned")
        

        # ======================================= Create Table Dictionaries ======================================

        reportPanelId = self.getWidgetId ( "tableOne_report" )
        pyrvapi.rvapi_add_panel  ( reportPanelId,self._report_widget_id,0,0,1,1 )
        table_id = self.getWidgetId ( "tableOne_table" )

        tableDict =  { 
            'title'       : "Table 1. Statistics Overall values.",
            'state'       : 0,                    # -1,0,1, -100,100
            'class'       : "table-blue",         # "table-blue" by default
            'css'         : "text-align:left;",  # "text-align:right;" by default
            'alt_row_css' : "background:#EAF2D3;text-align:left;",
            'horzHeaders' :  [],
            'rows'        : []
        }

        indent = "&nbsp;&nbsp;&nbsp;&nbsp;"

       #=========================== Rows======================
        
        tableDict['rows'].append({'header':{'label': indent + 'Low Resolution Limit', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("d_max"))]})

        tableDict['rows'].append({'header':{'label': indent + 'High Resolution Limit', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("d_min"))]})

        tableDict['rows'].append({'header':{'label': indent + 'Number observed reflections', 'tooltip': ''},
                                  'data': ['%0.3f' % int(overall_table.get("n_unique"))]})

        tableDict['rows'].append({'header':{'label': indent + 'Number unique reflections', 'tooltip': ''},
                                  'data': ['%0.3f' % int(overall_table.get("n_obs"))]})

        tableDict['rows'].append({'header':{'label': indent + 'Completeness %', 'tooltip': ''},
                                  'data': ['%0.3f' %  float(overall_table.get("completeness"))]})

        tableDict['rows'].append({'header':{'label': indent + 'Multiplicity', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("multiplicity"))]})

        tableDict['rows'].append({'header':{'label': indent + 'Mean(I)', 'tooltip': ''},
                                  'data': ['%0.3f' %  float(overall_table.get("I"))]})
                                  
        tableDict['rows'].append({'header':{'label': indent + 'Mean((I)/sd(I))', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("IsigI"))]})
       

        #If hkl1 and hkl2 arent provided then project_dataset.json wont have "cc", "CCstar", "rsplit"
        if os.path.isfile(halfdataset1) and os.path.isfile(halfdataset2) :
            tableDict['rows'].append({'header':{'label': indent + 'Half-set correlation CC(1/2)', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("cc"))]})

            tableDict['rows'].append({'header':{'label': indent + 'CC*', 'tooltip': ''},
                                    'data': ['%0.3f' % float(overall_table.get("CCstar"))]})
                                    
            tableDict['rows'].append({'header':{'label': indent + 'Rsplit', 'tooltip': ''},
                                    'data': ['%0.3f' % float(overall_table.get("rsplit"))]})#
    

        rvapi_utils.makeTable ( tableDict, table_id, reportPanelId, 0,0,1,1 ) #Create the first table


        #======================================== Running Import_Serial Task===================================================


        self.flush()

        
        summary_line = "imported and merged: MTZ "  # line inside the cloud next to the job tree --imported and merged: MTZ 

        self.addCitation ( "import_serial" )

        # check solution and register data
        have_results = False
        summary_line = ""
        if os.path.isfile(outputMTZFName):
            have_results = True

            self.putTitle ( "Output Data" )

            # make list of files to import
            self.resetFileImport()
            self.addFileImport ( outputMTZFName,import_filetype.ftype_MTZMerged() )

            self.import_dir = "./"
            hkl = import_merged.run ( self,"Reflection dataset",importPhases="" )

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




