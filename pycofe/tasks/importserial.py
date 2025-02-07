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

        self.putMessage ( "<b>This is FIRST TRY. HELLO!!!</b>" ) #Display message to the user in the output

        hklin1 = os.path.join ( self.importDir(),self.task.file_select[0].path ) # Creates the import button functionality
        hklin2 = os.path.join ( self.importDir(),self.task.file_select[1].path ) # this calls the object with id hklin2 in importserial.js
        hklin3 = os.path.join ( self.importDir(),self.task.file_select[2].path )
        cellfile = os.path.join ( self.importDir(),self.task.file_select[3].path ) 
        referencefile = os.path.join ( self.importDir(),self.task.file_select[4].path )   

        self.putMessage (str(hklin1) + " : " + (" exists" if os.path.isfile(hklin1) else " does not exist") )
        self.putMessage ( "\n" + str(hklin2) + " : " + (" exists" if os.path.isfile(hklin2) else " does not exist") )
        self.putMessage ( "\n" + str(hklin3) + " : " + (" exists" if os.path.isfile(hklin3) else " does not exist") )
        self.putMessage ( "\n" + str(cellfile) + " : " + (" exists" if os.path.isfile(hklin4) else " does not exist") )
        self.putMessage ( "\n" + str(referencefile) + " : " + (" exists" if os.path.isfile(hklin4) else " does not exist") )

        # Prepare makeligand input
        # fetch input data

        sec1 = (self.task.parameters.sec1.contains) #Call section 1 containing all the parameters
        sec2 = self.task.parameters.sec2.contains #Call section 2


        self.flush()

        have_results = True
        summary_line = "first try"

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
