##!/usr/bin/python

#
# ============================================================================
#
#    18.02.25   <--  Date of Last Modification.
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
    
    def importDir(self):  return self.import_dir       # import directory

    #Retrieve Json Data set inside job task folder
    def import_serial_json  (self):  return "project_dataset.json" 


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


        # Retrieve the keywords from file input 

        # If .hkl1 or .hkl2 file was provided
        if os.path.isfile(halfdataset1) or os.path.isfile(halfdataset2) : 
            cmd += [ "--half-dataset"]

        #If .hkl1 file was provided
        if os.path.isfile(halfdataset1):
            cmd += [ str(halfdataset1) ]
            # self.putMessage(str(cmd)) 

        #If .hkl2 file was provided
        if os.path.isfile(halfdataset2):
            cmd += [ str(halfdataset2) ]
            # self.putMessage(str(cmd))        

        #If cell file was provided
        if os.path.isfile(cellfile):
            cmd += [ "--cellfile", str(cellfile) ]
            # self.putMessage(str(cmd))

        #If reference file was provided
        if os.path.isfile(reference):
            cmd += [ "--reference", str(reference) ]
            # self.putMessage(str(cmd))


        wavelength = self.getParameter ( sec1.WAVELENGTH ).strip()
        if wavelength: # If there is wavelength user input
            wavelength = str(wavelength)
            cmd += [ "--wavelength", str(wavelength) ]
            # self.putMessage(str(cmd)) 

        spacegroup = self.getParameter ( sec1.SPACEGROUP ).strip()
        if spacegroup: # If there is spacegroup user input
            spacegroup = str(spacegroup)
            cmd += [ "--spacegroup", str(spacegroup) ]
            # self.putMessage(str(cmd))  

        cell = self.getParameter ( sec1.UNITCELLPARAMETERS ).strip()
        if cell: # If there is cell user input, split each input into a string for 6 args
            cell = str(cell)
            splitcell = cell.split()
            cmd += [ "--cell"]
            cmd.extend(splitcell)
            # self.putMessage(str(cmd)) 

        dmin = self.getParameter ( sec2.DMIN ).strip()
        if dmin: # If there is High-resolution cutoff user input
            dmin = str(dmin)
            cmd += [ "--dmin", str(dmin) ]
            # self.putMessage(str(cmd)) 

        dmax = self.getParameter ( sec2.DMAX ).strip()
        if dmax: # If there is Low-resolution cutoff user input
            dmax = str(dmax)
            cmd += [ "--dmax", str(dmax) ]
            # self.putMessage(str(cmd)) 

        # ============================== Run the import_serial task =========================================
        self.runApp ( "import_serial",cmd,logType="Main" )

        # =============================== Report Log Tables ==========================================
      
        _report_widget_id = "report_page" #import report widget for table
        def report_page_id(self): return self._report_widget_id

        #file_stdout   = None   #  Main Log
        #reportPanelId = body.getWidgetId ( "log_panel" ) check if this is the service log panel

        # ================================== Read and format Json File =======================================

        if os.path.isfile(jsonout): #Check if json file is present
                with open(jsonout) as json_file: #Open the JSON file
                    data = json.load ( json_file )
                    overall_table = data.get("overall")
                    binned_table = data.get("binned")
        

        # def populate_table(table_dict,table_id,report_panel_id,json_data):
        #     counter = 0 # For adjusting row position in the report
        #     indent = "&nbsp;&nbsp;&nbsp;&nbsp;"

        #     #=========================== Rows======================

        #     self.putMessage(str(json_data.get("d_max")))
            
        #     table_dict['rows'].append({'header':{'label': indent + 'Low Resolution Limit', 'tooltip': ''},
        #                             'data': ['%0.3f' % float(json_data.get("d_max"))]})

        #     table_dict['rows'].append({'header':{'label': indent + 'High Resolution Limit', 'tooltip': ''},
        #                             'data': ['%0.3f' % float(json_data.get("d_min"))]})

        #     table_dict['rows'].append({'header':{'label': indent + 'Number observed reflections', 'tooltip': ''},
        #                             'data': ['%0.3f' % int(json_data.get("n_unique"))]})

        #     table_dict['rows'].append({'header':{'label': indent + 'Number unique reflections', 'tooltip': ''},
        #                             'data': ['%0.3f' % int(json_data.get("n_obs"))]})

        #     table_dict['rows'].append({'header':{'label': indent + 'Completeness %', 'tooltip': ''},
        #                             'data': ['%0.3f' %  float(json_data.get("completeness"))]})

        #     table_dict['rows'].append({'header':{'label': indent + 'Multiplicity', 'tooltip': ''},
        #                             'data': ['%0.3f' % float(json_data.get("multiplicity"))]})

        #     table_dict['rows'].append({'header':{'label': indent + 'Mean(I)', 'tooltip': ''},
        #                             'data': ['%0.3f' %  float(json_data.get("I"))]})
                                    
        #     table_dict['rows'].append({'header':{'label': indent + 'Mean((I)/sd(I))', 'tooltip': ''},
        #                             'data': ['%0.3f' % float(json_data.get("IsigI"))]})
        

        #     # #If hkl1 and hkl2 arent provided then project_dataset.json wont have "cc", "CCstar", "rsplit"
        #     if os.path.isfile(halfdataset1) or os.path.isfile(halfdataset2) :
        #         tableDict['rows'].append({'header':{'label': indent + 'Half-set correlation CC(1/2)', 'tooltip': ''},
        #                             'data': ['%0.3f' % float(json_data.get("cc"))]})

        #         tableDict['rows'].append({'header':{'label': indent + 'CC*', 'tooltip': ''},
        #                                 'data': ['%0.3f' % float(json_data.get("CCstar"))]})
                                        
        #         tableDict['rows'].append({'header':{'label': indent + 'Rsplit', 'tooltip': ''},
        #                                 'data': ['%0.3f' % float(json_data.get("rsplit"))]})


        #     rvapi_utils.makeTable ( table_dict, table_id, report_panel_id, counter,0,1,1 ) #Create the first table

        # counter+=1 #Increment position counter

        # ======================================= Create Table Dictionaries ======================================

        reportPanelId1 = self.getWidgetId ( "tableOne_report" )
        pyrvapi.rvapi_add_panel  ( reportPanelId1,self._report_widget_id,0,0,1,1 )
        table_id1 = self.getWidgetId ( "tableOne_table" )

        tableDict1 =  { 
            'title'       : "Table 1. Statistics Overall values.",
            'state'       : 0,                    # -1,0,1, -100,100
            'class'       : "table-blue",         # "table-blue" by default
            'css'         : "text-align:left;",  # "text-align:rigt;" by default
            'alt_row_css' : "background:#EAF2D3;text-align:left;",
            'horzHeaders' :  [],
            'rows'        : []
        }


        # reportPanelId2 = self.getWidgetId ( "tableTne_report" )
        # pyrvapi.rvapi_add_panel  ( reportPanelId2,self._report_widget_id,1,0,1,1 )
        # table_id2 = self.getWidgetId ( "tableTwo_table" )

        # tableDict2 =  { 
        #     'title'       : "Table 2. Statistics Binned values.",
        #     'state'       : 0,                    # -1,0,1, -100,100
        #     'class'       : "table-blue",         # "table-blue" by default
        #     'css'         : "text-align:left;",  # "text-align:rigt;" by default
        #     'alt_row_css' : "background:#EAF2D3;text-align:left;",
        #     'horzHeaders' :  [],
        #     'rows'        : []
        # }

        indent = "&nbsp;&nbsp;&nbsp;&nbsp;"

        
        # populate_table(tableDict1,table_id1,reportPanelId1,overall_table) # Populate the table with the static binned values
        # populate_table(tableDict2,table_id2,reportPanelId2,binned_table) # Populate the table with the static binned values


       #=========================== Rows======================
        
        tableDict1['rows'].append({'header':{'label': indent + 'Low Resolution Limit', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("d_max"))]})

        tableDict1['rows'].append({'header':{'label': indent + 'High Resolution Limit', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("d_min"))]})

        tableDict1['rows'].append({'header':{'label': indent + 'Number observed reflections', 'tooltip': ''},
                                  'data': ['%0.3f' % int(overall_table.get("n_unique"))]})

        tableDict1['rows'].append({'header':{'label': indent + 'Number unique reflections', 'tooltip': ''},
                                  'data': ['%0.3f' % int(overall_table.get("n_obs"))]})

        tableDict1['rows'].append({'header':{'label': indent + 'Completeness %', 'tooltip': ''},
                                  'data': ['%0.3f' %  float(overall_table.get("completeness"))]})

        tableDict1['rows'].append({'header':{'label': indent + 'Multiplicity', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("multiplicity"))]})

        tableDict1['rows'].append({'header':{'label': indent + 'Mean(I)', 'tooltip': ''},
                                  'data': ['%0.3f' %  float(overall_table.get("I"))]})
                                  
        tableDict1['rows'].append({'header':{'label': indent + 'Mean((I)/sd(I))', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("IsigI"))]})
       

        #If hkl1 and hkl2 arent provided then project_dataset.json wont have "cc", "CCstar", "rsplit"
        if os.path.isfile(halfdataset1) or os.path.isfile(halfdataset2) :
            tableDict1['rows'].append({'header':{'label': indent + 'Half-set correlation CC(1/2)', 'tooltip': ''},
                                  'data': ['%0.3f' % float(overall_table.get("cc"))]})

            tableDict1['rows'].append({'header':{'label': indent + 'CC*', 'tooltip': ''},
                                    'data': ['%0.3f' % float(overall_table.get("CCstar"))]})
                                    
            tableDict1['rows'].append({'header':{'label': indent + 'Rsplit', 'tooltip': ''},
                                    'data': ['%0.3f' % float(overall_table.get("rsplit"))]})#
    

        rvapi_utils.makeTable ( tableDict1, table_id1, reportPanelId1, 0,0,1,1 ) #Create the first table


        #======================================== Running Import_Serial Task===================================================


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

            # if len(hkl)>0:

            #     have_results = True

            #     for i in range(len(hkl)):
            #         new_hkl[i].new_spg      = hkl.new_spg.replace(" ","")
            #         # Do not overwrite dataStats; they should be correct!
            #         # new_hkl[i].dataStats    = hkl.dataStats
            #         new_hkl[i].aimless_meta = hkl.aimless_meta

            #     self.generic_parser_summary["change_reso"] = {'SpaceGroup':hkl.new_spg}

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




