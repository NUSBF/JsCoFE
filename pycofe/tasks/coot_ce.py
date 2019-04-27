#!/usr/bin/python

#
# ============================================================================
#
#    16.04.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT EDIT COORDINATES EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.coot_ce.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
import basic
from   pycofe.dtypes  import  dtype_xyz, dtype_ensemble
from   pycofe.varut   import  signal
try:
    from pycofe.varut import messagebox
except:
    messagebox = None


# ============================================================================
# Make Coot driver

class Coot(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare coot job

        self.putMessage ( "<h3><i>Make sure that you save your work from Coot " +\
                          "<u>without changing directory and file name offered</u></i></h3>" )
        self.flush()

        # fetch input data
        data_list = [self.input_data.data.ixyz[0]]
        if hasattr(self.input_data.data,"aux_struct"):
            data_list += self.input_data.data.aux_struct
        for i in range(len(data_list)):
            data_list[i] = self.makeClass ( data_list[i] )
        ixyz = data_list[0]

        # make command line arguments
        args = []
        for s in data_list:
            if s.getXYZFileName():
                args += ["--pdb",s.getXYZFilePath(self.inputDir())]
        args += ["--no-guano"]

        # Run coot
        if sys.platform.startswith("win"):
            rc = self.runApp ( "coot.bat",args,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "coot",args,logType="Main",quitOnError=False )

        # Check for PDB files left by Coot and convert them to type structure

        files = os.listdir ( "./" )
        mtime = 0;
        fname = None
        for f in files:
            if f.lower().endswith(".pdb") or f.lower().endswith(".cif"):
                mt = os.path.getmtime(f)
                if mt > mtime:
                    mtime = mt
                    fname = f

        if fname:

            f = ixyz.getXYZFileName()
            if not f:
                f = istruct.getSubFileName()
            fnprefix = f[:f.find("_")]

            if fname.startswith(fnprefix):
                fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )
            else:
                fn,fext = os.path.splitext ( f )

            coot_xyz = fn + "_xyz" + fext;
            shutil.copy2 ( fname,coot_xyz )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            xyz = self.registerXYZ ( coot_xyz )
            if xyz:
                xyz.putXYZMeta ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                self.putXYZWidget ( "xyz_btn","Edited coordinates",xyz,-1 )

        # ============================================================================
        # close execution logs and quit

        if rc.msg == "":
            self.success()
        else:
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                  "<b>Failed to launch Coot: <i>" + rc.msg + "</i></b>"
                  "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )

# ============================================================================

if __name__ == "__main__":

    drv = Coot ( "",os.path.basename(__file__) )
    drv.start()
