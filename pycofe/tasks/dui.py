#!/usr/bin/python

#
# ============================================================================
#
#    04.04.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT MODEL BUILDING EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.dui.py jobManager jobDir jobId
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
# import sys
import shutil

#  application imports
from . import basic
from   pycofe.proc    import import_filetype, import_unmerged
from   pycofe.varut   import signal
try:
    from pycofe.varut import messagebox
except:
    messagebox = None


# ============================================================================
# Make DUI driver

class DUI(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        self.putMessage (
            "<h3><i>DUI is starting on your device, please wait ...</h3>"+\
            "<i>if you do not see it for a long time, check behind this window...</i>"
        )
        self.rvrow -= 1
        self.flush()

        # Prepare dui job

        # Run dui
        #if sys.platform.startswith("win"):
        #    rc = self.runApp ( "dui.bat",[],logType="Main",quitOnError=False )
        #else:
        #    rc = self.runApp ( "dui",[],logType="Main",quitOnError=False )
        rc = self.runApp ( "dui",[],logType="Main",quitOnError=False )
        self.addCitation ( "dials" )

        # Check for MTZ files left by DUI and import them as Unmerged

        have_results = False

        if os.path.isdir("dui_files"):

            files = os.listdir ( "dui_files" )
            fname = []
            for f in files:
                if f.lower().endswith(".mtz"):
                    fname.append ( os.path.join("dui_files",f) )

            if len(fname)>0:
                if len(fname)<2:
                    self.putTitle ( "Unmerged Reflection Dataset" )
                else:
                    self.putTitle ( "Unmerged Reflection Datasets" )
                #newHKLFPath = os.path.join ( resDir,self.getOFName("_unmerged_scaled.mtz",-1) )
                #os.rename ( os.path.join(resDir,mtzUnmergedName),newHKLFPath )
                for filename in fname:
                    self.resetFileImport()
                    self.addFileImport ( filename,import_filetype.ftype_MTZIntegrated() )
                    unmerged_imported = import_unmerged.run ( self,"Unmerged Reflection Dataset" )
                    self.putMessage ( "<b>Assigned name:</b>&nbsp;" + unmerged_imported[0].dname )
                    have_results = True

                # modify job name to display in job tree
                ilist = ""
                for key in self.outputDataBox.data:
                    ilist += key[4:] + " (" + str(len(self.outputDataBox.data[key])) + ") "

                if not ilist:
                    self.putTitle   ( "Image Processing Failed" )
                    self.putMessage ( "No output files were produced" )
                    ilist = "None"

                if self.task.uname:
                    if self.task.uname.startswith("created datasets:"):
                        self.task.uname = ""
                    else:
                        self.task.uname += " / "
                self.task.uname += "created datasets: <i><b>" + ilist + "</b></i>"
                with open('job.meta','w') as file_:
                    file_.write ( self.task.to_JSON() )

            else:
                self.putTitle ( "No Output Data Generated" )

            # clean directories
            shutil.rmtree ( "dui_files" )

        else:
            self.putTitle ( "No DUI Data Found" )

        # ============================================================================
        # close execution logs and quit

        if rc.msg == "":
            self.success ( have_results )
        else:
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                  "<b>Failed to launch DUI: <i>" + rc.msg + "</i></b>"
                  "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )

        return



# ============================================================================

if __name__ == "__main__":

    drv = DUI ( "",os.path.basename(__file__) )
    drv.start()
