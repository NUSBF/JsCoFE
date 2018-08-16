#!/usr/bin/python

#
# ============================================================================
#
#    16.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.coot.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
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
        data_list = [self.input_data.data.istruct[0]]
        if hasattr(self.input_data.data,"aux_struct"):
            data_list += self.input_data.data.aux_struct
        for i in range(len(data_list)):
            data_list[i] = self.makeClass ( data_list[i] )
        istruct = data_list[0]
        mtzfile = istruct.getMTZFilePath ( self.inputDir() )

        ligand  = None
        liblig  = None
        if hasattr(self.input_data.data,"ligand"):
            ligand = self.makeClass ( self.input_data.data.ligand[0] )
            liblig = ligand.getLibFilePath ( self.inputDir() )

        # prepare dictionary file for input structure
        libnew = liblig
        libin  = istruct.getLibFilePath ( self.inputDir() ) # local ligand library
        if libin:
            # there are other ligands in the structure, needs to be preserved
            if ligand and (not ligand.code in istruct.ligands):
                # new ligand is not the list of existing ligands, so append it
                # to local ligand library with libcheck

                libnew = self.outputFName + ".dict.cif"

                self.open_stdin()
                self.write_stdin (
                    "_Y"          +\
                    "\n_FILE_L  " + libin  +\
                    "\n_FILE_L2 " + liblig +\
                    "\n_FILE_O  " + libnew +\
                    "\n_END\n" )
                self.close_stdin()

                self.runApp ( "libcheck",[] )

                libnew += ".lib"

            else:
                # all ligands should be taken from local ligand library
                libnew = libin

        # make command line arguments
        args = []
        for s in data_list:
            if s.getXYZFileName():
                args += ["--pdb",s.getXYZFilePath(self.inputDir())]
            if s._type=="DataStructure":
                if s.getSubFileName():
                    args += ["--pdb",s.getSubFilePath(self.inputDir())]
                args += ["--auto",s.getMTZFilePath(self.inputDir())]

        if libnew:
            args += ["--dictionary",libnew]

        if ligand:
            args += ["-c","(get-monomer \"" + ligand.code + "\")"]

        args += ["--no-guano"]

        # Run coot
        if sys.platform.startswith("win"):
            rc = self.runApp ( "coot.bat",args,False )
        else:
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

            f = istruct.getXYZFileName()
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

            struct = self.registerStructure ( coot_xyz,None,coot_mtz,
                                              fnames[0],fnames[1],
                                              libnew )
            #                                  istruct.getLibFilePath(self.inputDir()) )
            if struct:
                struct.copyAssociations ( istruct )
                struct.copySubtype      ( istruct )
                struct.copyLabels       ( istruct )
                struct.copyLigands      ( istruct )
                if ligand:
                    struct.addLigands ( ligand.code )
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
