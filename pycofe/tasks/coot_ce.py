#!/usr/bin/python

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT EDIT COORDINATES EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.coot_ce.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from . import basic
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

        #self.putMessage ( "<h3><i>Make sure that you save your work from Coot " +\
        #                  "<u>without changing directory and file name offered</u></i></h3>" )
        #self.flush()

        # fetch input data
        """
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
        """

        # make command line arguments
        args = []
        ixyz = self.input_data.data.ixyz
        for i in range(len(ixyz)):
            ixyz[i] = self.makeClass ( ixyz[i] )
            if ixyz[i].getXYZFileName():
                args += ["--pdb",ixyz[i].getXYZFilePath(self.inputDir())]

        coot_scr = "coot_jscofe.py"
        coot_scr = os.path.join ( os.path.dirname ( os.path.abspath(__file__)),"..","proc",coot_scr )
        #args += ["--python",coot_scr,"--no-guano"]
        args += ["--python",coot_scr]

        # Run coot
        if sys.platform.startswith("win"):
            coot_bat = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
            rc = self.runApp ( coot_bat,args,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "coot",args,logType="Main",quitOnError=False )

        # Check for PDB files left by Coot and convert them to type structure

        files = os.listdir ( "./" )
        fdic  = {}
        mlist = []
        for f in files:
            if f.lower().endswith(".pdb") or f.lower().endswith(".cif"):
                mt = os.path.getmtime(f)
                fdic[mt] = f
                mlist.append ( mt )

        have_results = False

        if len(mlist)>0:

            self.putTitle ( "Output coordinate data" )

            f = ixyz[0].getXYZFileName()
            if not f:
                f = istruct.getSubFileName()
            fnprefix = f[:f.find("_")]

            mlist = sorted(mlist)
            for i in range(len(mlist)):

                fname = fdic[mlist[i]]
                """
                fcnt  = str(i+1)
                if len(mlist)<=1:
                    fcnt = ""
                elif len(mlist)<9:
                    fcnt = "_" + fcnt
                elif len(mlist)<99:
                    fcnt = "_" + fcnt.zfill(2)
                elif len(mlist)<999:
                    fcnt = "_" + fcnt.zfill(3)

                if fname.startswith(fnprefix):
                    fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )
                else:
                    fn,fext = os.path.splitext ( f )

                coot_xyz = fn + fcnt + "_xyz" + fext;
                """

                # register output data from temporary location (files will be moved
                # to output directory by the registration procedure)

                #xyz = self.registerXYZ ( coot_xyz )
                xyz = self.registerXYZ ( fname )
                if xyz:
                    xyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                    self.putMessage (
                        "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                        xyz.dname )
                    self.putXYZWidget ( "xyz_btn","Edited coordinates",xyz,-1 )
                    if i<len(mlist)-1:
                        self.putMessage ( "&nbsp;" )
                    have_results = True

        else:
            self.putTitle ( "No output data produced" )

        """
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

        """

        # ============================================================================
        # close execution logs and quit

        if rc.msg == "":
            self.success ( have_results )
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
