#!/usr/bin/python

#
# ============================================================================
#
#    28.01.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT MODEL BUILDING EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.xdsgui.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
import basic
from   pycofe.proc    import import_filetype, import_unmerged
from   pycofe.varut   import signal
try:
    from pycofe.varut import messagebox
except:
    messagebox = None


# ============================================================================
# Make XDSGUI driver

class XDSGUI(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):
        # Prepare xdsgui job

        # check that XDS(GUI) is installed (since it is not part of CCP4 distribution)
        if "XDS_home" not in os.environ or "XDSGUI_home" not in os.environ:
            self.fail ( "<p>&nbsp; *** XDS or/and XDS GUI is not installed, " +\
                        "or is not configured", "xds is not found" )

        # Run xdsgui
        #if sys.platform.startswith("win"):
        #    rc = self.runApp ( "xdsgui.bat",[],logType="Main",quitOnError=False )
        #else:
        #    rc = self.runApp ( "xdsgui",[],logType="Main",quitOnError=False )

        environ = os.environ.copy()
        environ["HOME"] = os.path.abspath ( os.getcwd() )
        environ["PATH"] = os.environ["XDSGUI_home"] + ":" +\
                          os.environ["XDS_home"] + ":" +\
                          os.environ["PATH"]

        rc = self.runApp ( "xdsgui",[],logType="Main",quitOnError=False,env=environ )

        # Check for HKL files left by XDSGUI and import them as Unmerged

        xdshkl_path = "XDS_ASCII.HKL"
        if os.path.isfile(xdshkl_path):

            self.putTitle ( "Unmerged Reflection Dataset" )

            self.resetFileImport()
            self.addFileImport ( "",xdshkl_path,import_filetype.ftype_XDSIntegrated() )
            unmerged_imported = import_unmerged.run ( self,"Unmerged Reflection Dataset" )

            self.putMessage ( "<b>Assigned name:</b>&nbsp;" + unmerged_imported[0].dname )

            ilist = ""
            for key in self.outputDataBox.data:
                ilist += key[4:] + " (" + str(len(self.outputDataBox.data[key])) + ") "

            if not ilist:
                self.putTitle   ( "Image Processing Failed" )
                self.putMessage ( "No output files were produced" )
                ilist = "None"

            if self.task.uname:
                self.task.uname += " / "
            self.task.uname += "created datasets: <i><b>" + ilist + "</b></i>"
            with open('job.meta','w') as file_:
                file_.write ( self.task.to_JSON() )

        else:
            self.putTitle ( "No Output Data Generated" )

        """
        if os.path.isdir("xdsgui_files"):

            files = os.listdir ( "xdsgui_files" )
            fname = []
            for f in files:
                if f.lower().endswith(".mtz"):
                    fname.append ( os.path.join("xdsgui_files",f) )

            if len(fname)>0:
                if len(fname)<2:
                    self.putTitle ( "Unmerged Reflection Dataset" )
                else:
                    self.putTitle ( "Unmerged Reflection Datasets" )
                #newHKLFPath = os.path.join ( resDir,self.getOFName("_unmerged_scaled.mtz",-1) )
                #os.rename ( os.path.join(resDir,mtzUnmergedName),newHKLFPath )
                for filename in fname:
                    self.resetFileImport()
                    self.addFileImport ( "",filename,import_filetype.ftype_MTZIntegrated() )
                    unmerged_imported = import_unmerged.run ( self,"Unmerged Reflection Dataset" )
                    self.putMessage ( "<b>Assigned name:</b>&nbsp;" + unmerged_imported[0].dname  )

                # modify job name to display in job tree
                ilist = ""
                for key in self.outputDataBox.data:
                    ilist += key[4:] + " (" + str(len(self.outputDataBox.data[key])) + ") "

                if not ilist:
                    self.putTitle   ( "Image Processing Failed" )
                    self.putMessage ( "No output files were produced" )
                    ilist = "None"

                if self.task.uname:
                    self.task.uname += " / "
                self.task.uname += "created datasets: <i><b>" + ilist + "</b></i>"
                with open('job.meta','w') as file_:
                    file_.write ( self.task.to_JSON() )

            else:
                self.putTitle ( "No Output Data Generated" )

            # clean directories
            shutil.rmtree ( "xdsgui_files" )

        else:
            self.putTitle ( "No XDSGUI Data Found" )

        """

        # ============================================================================
        # close execution logs and quit

        if rc.msg == "":
            self.success()
        else:
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                  "<b>Failed to launch XDSGUI: <i>" + rc.msg + "</i></b>"
                  "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )

        return



# ============================================================================

if __name__ == "__main__":

    drv = XDSGUI ( "",os.path.basename(__file__) )
    drv.start()
