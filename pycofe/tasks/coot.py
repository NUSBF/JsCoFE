#!/usr/bin/python

#
# ============================================================================
#
#    12.09.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.balbes.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
import basic
from pycofe.varut import signal
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

        # fetch input data
        structure = self.makeClass ( self.input_data.data.istruct[0] )
        mtzfile   = structure.getMTZFilePath ( self.inputDir() )

        # make command line arguments
        args = ["--pdb",structure.getXYZFilePath(self.inputDir()),
                "--auto",mtzfile]
        if len(structure.files)>4 and structure.files[4]:
            args += ["--dictionary",structure.getLibFilePath(self.inputDir())]

        # Run coot
        rc = self.runApp ( "coot",args,False )

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

            f = structure.files[0]
            fnprefix = f[:f.find("_")]

            if fname.startswith(fnprefix):
                fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )
            else:
                fn,fext = os.path.splitext ( f )
            coot_xyz = fn + "_xyz" + fext;
            coot_mtz = fn + "_map.mtz"
            shutil.copy2 ( fname  ,coot_xyz )
            shutil.copy2 ( mtzfile,coot_mtz )

            # calculate maps for UglyMol using final mtz from temporary location
            fnames = self.calcCCP4Maps ( coot_mtz,fn )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            struct = self.registerStructure ( coot_xyz,coot_mtz,
                                              fnames[0],fnames[1],
                                              structure.getLibFilePath(self.inputDir()) )
            if struct:
                struct.copyAssociations ( structure )
                struct.copySubtype      ( structure )
                struct.copyLabels       ( structure )
                struct.copyLigands      ( structure )
                # create output data widget in the report page
                self.putTitle ( "Output Structure" )
                self.putStructureWidget ( "structure_btn","Output Structure",struct )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( struct   )
                self.registerRevision     ( revision )

        else:
            self.putTitle ( "No Output Structure Generated" )


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
