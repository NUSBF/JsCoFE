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

#  application imports
from   pycofe.tasks  import import_task
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

        cmd = [
            "-m"         , "import_serial",
            "--hklin"    , hklin,
        ]

        
        # --------------------------- Retrieving input data-------------------------------

        # Prepare import serial input
        # fetch input data from js file using inputID

        # hklin               = self.makeClass ( self.input_data.data.hklin             [0] )
        # half-dataset1       = self.makeClass ( self.input_data.data. half-dataset1    [0] )
        # half-dataset2       = self.makeClass ( self.input_data.data. half-dataset1    [0] )
        # reference           = self.makeClass ( self.input_data.data.reference         [0] )
        # cellfile            = self.makeClass ( self.input_data.data.cellfile          [0] )
        # cell                = self.makeClass ( self.input_data.data.cell              [0] )
        # wavelength          = self.makeClass ( self.input_data.data.wavelength        [0] )
        # spacegroup          = self.makeClass ( self.input_data.data.spacegroup        [0] )
        # dmin                = self.makeClass ( self.input_data.data.dmin              [0] ) 
        # dmax                = self.makeClass ( self.input_data.data.dmax              [0] )


        sec1 = self.task.parameters.sec1.contains #Call section 1 containing all the parameters
        sec2 = self.task.parameters.sec2.contains #Call section 2

        self.putMessage(" ") #Spacing , remove later
        self.putMessage("<b><h3> Cmd Parameter Keywords and Value </h3></b> ") #Heading , remove later
        self.putMessage(" ") #Spacing , remove later

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
        if cell: # If there is cell user input
            cell = str(cell)
            cmd += [ "--cell", str(cell) ]
            self.putMessage(str(cmd)) 

        dmin = self.getParameter ( sec2.DMIN ).strip()
        if cell: # If there is High-resolution cutoff user input
            cell = str(dmin)
            cmd += [ "--dmin", str(dmin) ]
            self.putMessage(str(cmd)) 

        dmax = self.getParameter ( sec2.DMAX ).strip()
        if cell: # If there is Low-resolution cutoff user input
            cell = str(dmax)
            cmd += [ "--dmax", str(dmax) ]
            self.putMessage(str(cmd)) 

         #retrieve the keywords from file input 

        #If .hkl1 file was provided
        if os.path.isfile(halfdataset1) != '':
            cmd += [ "--hkl1", str(halfdataset1) ]
            self.putMessage(str(cmd)) 

        #If .hkl2 file was provided
        if os.path.isfile(halfdataset2) != '':
            cmd += [ "--hkl2",str(halfdataset2) ]
            self.putMessage(str(cmd))        

        #If cell file was provided
        if os.path.isfile(cellfile) != '':
            cmd += [ "--cellfile", str(cellfile) ]
            self.putMessage(str(cmd))

        #If reference file was provided
        if os.path.isfile(reference) != '':
            cmd += [ "--reference", str(reference) ]
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
        

       



        #------------------------------------------------------------------------------
      


        self.flush()

        have_results = True
        summary_line = "imported and merged: MTZ "  # line inside the cloud next to the job tree --imported and merged: MTZ 

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
