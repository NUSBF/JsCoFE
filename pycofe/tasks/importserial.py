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

    def run(self):

        self.putMessage ( "<b>This is FIRST TRY. HELLO!!!</b>" )

        hklin1 = os.path.join ( self.importDir(),self.task.file_select[0].path )
        hklin2 = os.path.join ( self.importDir(),self.task.file_select[1].path )
        hklin3 = os.path.join ( self.importDir(),self.task.file_select[2].path )

        self.putMessage ( str(hklin1) + " : " + (" exsists" if os.path.isfile(hklin1) else " does not exist") )
        self.putMessage ( str(hklin2) + " : " + (" exsists" if os.path.isfile(hklin2) else " does not exist") )
        self.putMessage ( str(hklin3) + " : " + (" exsists" if os.path.isfile(hklin3) else " does not exist") )


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

    drv = ImportSerial ( "",os.path.basename(__file__),{} )
    drv.start()
