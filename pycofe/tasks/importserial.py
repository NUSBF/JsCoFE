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
from pycofe.varut  import signal
# from   pycofe.auto   import auto
# from pycofe.tasks import mtz


# ============================================================================
# Make ImportSerial driver

class ImportSerial(import_task.Import):
    
    import_dir = "uploads"
    
    def importDir(self):  return self.import_dir  # import directory

    #Retrieve Json Data set inside job task folder
    def import_serial_json  (self):  return "project_dataset.json" 

    def _addFileImport ( self,fname ):
        if fname.startswith("cloudstorage::"): #cloud upload
            return os.path.join( self.importDir(),fname.split("/")[-1] )
        else:
            return os.path.join( self.importDir(),fname )


    def run(self): #This is how the apps are ran
        
        #Retrieve file imports
        if self.task.file_select[0].path:
            hklin = self._addFileImport(self.task.file_select[0].path) # Creates the import button functionality
        if self.task.file_select[1].path:
            halfdataset1 = self._addFileImport(self.task.file_select[1].path) #can't have a "-" in the name
        if self.task.file_select[2].path:
            halfdataset2 = self._addFileImport(self.task.file_select[2].path)
        if self.task.file_select[3].path:
            cellfile = self._addFileImport(self.task.file_select[3].path)
        if self.task.file_select[4].path:
            reference = self._addFileImport(self.task.file_select[4].path)   

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

        nbins = self.getParameter ( sec2.N_BINS ).strip()
        if nbins: # If there is Number of Resolution bins user input
            nbins = str(nbins)
            cmd += [ "--nbins", str(nbins) ]
        
        
        # Display to the report a message of multiple conflicting data instances of parameters
        if conflict_data == True:
            self.putMessage("<h3><b> Conflict of input data </h3></b>")
            for conflict in conflict_list:
                self.putMessage(str(conflict))
            

        # ============================== Run the import_serial task =========================================

        rc = self.runApp ( "import_serial",cmd,logType="Main", quitOnError=False )

        # =============================== Report Log Tables ==========================================
        if rc.msg != "":
            self.putMessage ( "<b>Task finished with an error. Please check the erros tab.</b>" )
            raise signal.JobFailure ( rc.msg )
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
                                  'data': ['%0.3f' % int(overall_table.get("n_obs"))]})

        tableDict['rows'].append({'header':{'label': indent + 'Number unique reflections', 'tooltip': ''},
                                  'data': ['%0.3f' % int(overall_table.get("n_unique"))]})

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

        #=======================================  Plot of Statistics vs Resolution  =====================================

        #Convert dictionary into separate lists for the graph
        binned_d_min = binned_table.get("d_min",[])[::-1] #Reverse the list
        binned_completeness = binned_table.get("completeness",[])[::-1]
        binned_multiplicity = binned_table.get("multiplicity",[])[::-1]
        binned_IsigI = binned_table.get("IsigI",[])[::-1]


        plots =[
                        {
                          "name"   : "Completeness",
                          "xtitle" : "Resolution ",
                          "ytitle" : "Completeness (%%)",
                          "x"      : {  "name":"Resolution", "values": binned_d_min },
                          "y"      : [{ "name":"Completeness"       , "values":binned_completeness  }]
                        },{
                          "name"   : "Multiplicity",
                          "xtitle" : "Resolution",
                          "ytitle" : "Multiplicity",
                          "x"      : {  "name":"Resolution", "values": binned_d_min },
                          "y"      : [{ "name":"Multiplicity"     , "values":binned_multiplicity  }]
                        },{
                          "name"   : "<I/sI>",
                          "xtitle" : "Resolution",
                          "ytitle" : "<I/sI>",
                          "x"      : {  "name":"Resolution", "values":binned_d_min  },
                          "y"      : [{ "name":"<I/sI>"     , "values":binned_IsigI  }]
                        }
        ]

        #If hkl1 and hkl2 arent provided then project_dataset.json wont have "cc", "CCstar", "rsplit"
        if os.path.isfile(halfdataset1) and os.path.isfile(halfdataset2) :
            binned_cc = binned_table.get("cc",[])[::-1]
            binned_CCstar = binned_table.get("CCstar",[])[::-1]
            binned_rsplit = binned_table.get("rsplit",[])[::-1]
            
            new_plots = [
                {
                "name"   : "CC 1/2",
                "xtitle" : "Resolution",
                "ytitle" : "CC 1/2",
                "x"      : {  "name":"Resolution", "values":binned_d_min},
                "y"      : [{ "name":"CC 1/2"     , "values":binned_cc  }]
                },{
                "name"   : "CC*",
                "xtitle" : "Resolution",
                "ytitle" : "CC*",
                "x"      : {  "name":"Resolution", "values":binned_d_min},
                "y"      : [{ "name":"CC*"     , "values":binned_CCstar  }]
                },{
                "name"   : "R_split",
                "xtitle" : "Resolution",
                "ytitle" : "R_split",
                "x"      : {  "name":"Resolution", "values":binned_d_min},
                "y"      : [{ "name":"R_split"     , "values":binned_rsplit }]
                }
            ]
            plots.extend(new_plots)
            


        self.putLogGraphWidget ( self.getWidgetId("graph"),[
                    { "name"  : "Statistics vs Resolution ",
                        "plots" : plots
                    }
                ])
        
        
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
        if rc.msg == "":
            self.success ( have_results )
        else:
            self.putMessage ( "<b>Task finished with an error. Please check the erros tab.</b>" )
            raise signal.JobFailure ( rc.msg )
            
        return


# ============================================================================

if __name__ == "__main__":

    drv = ImportSerial ( "",os.path.basename(__file__),{} ) #Call the number cruncher driver
    drv.start()




