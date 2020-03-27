#!/usr/bin/python

#
# ============================================================================
#
#    21.03.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT MODEL BUILDING EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.coot_mb.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
import basic
from   pycofe.varut   import  signal
try:
    from pycofe.varut import messagebox
except:
    messagebox = None

from pycofe.proc.coot_link import LinkLists

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
        data_list = [self.input_data.data.istruct[0]]
        if hasattr(self.input_data.data,"aux_struct"):
            data_list += self.input_data.data.aux_struct
        for i in range(len(data_list)):
            data_list[i] = self.makeClass ( data_list[i] )
        istruct  = data_list[0]
        mtzfile  = istruct.getMTZFilePath ( self.inputDir() )
        lead_key = istruct.leadKey

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

                # libnew = self.outputFName + ".dict.cif"
                libnew = self.outputFName

                self.open_stdin()
                self.write_stdin (
                    "_Y"          +\
                    "\n_FILE_L  " + libin  +\
                    "\n_FILE_L2 " + liblig +\
                    "\n_FILE_O  " + libnew +\
                    "\n_END\n" )
                self.close_stdin()

                self.runApp ( "libcheck",[],logType="Service" )

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
            args += ["--python","-c","get_monomer('" + ligand.code + "')"]

        #coot_scr = "coot_jscofe.py"
        #coot_scr = os.path.join ( os.path.dirname ( os.path.abspath(__file__)),"..","proc",coot_scr )
        coot_mod = os.path.join ( os.path.dirname(os.path.abspath(__file__)),
                                  "..","proc","coot_modifier.py" )
        coot_scr = istruct.getCootFilePath ( self.inputDir() )
        if coot_scr:
            f = open ( coot_mod,"r" )
            coot_mod_content = f.read()
            f.close()
            f = open ( coot_scr,"a" )
            f.write  ( coot_mod_content )
            #f.write (
            #    "\n\n" +\
            #    "info_dialog ( \"" +\
            #        "In order to save the edited structure in your Project,\\n" +\
            #        "use 'Save coordinates' from Main Menu/Files\\n" +\
            #        "before closing Coot, without changing file name\\n" +\
            #        "and directory offered by default, and only then\\n" +\
            #        "end Coot session as usual.\"" +\
            #    " )"
            #)
            f.close()
        else:
            coot_scr = coot_mod

        molp_path = istruct.getMolProbityFilePath ( self.inputDir() )
        if molp_path:
            shutil.copy2 ( molp_path,"molprobity_probe.txt" )

        #args += ["--python",coot_scr,"--no-guano"]
        args += ["--python",coot_scr]

        # Run coot
        if sys.platform.startswith("win"):
            coot_bat = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
            rc = self.runApp ( coot_bat,args,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "coot",args,logType="Main",quitOnError=False )

        if os.path.isfile("task_chain.cmd"):
            file = open ( "task_chain.cmd","r" )
            self.task.task_chain = file.read().strip().split(",")
            file.close()

        # Check for PDB files left by Coot and convert them to type structure

        files = os.listdir ( "./" )
        mtime = 0
        fname = None
        for f in files:
            if f.lower().endswith(".pdb") or f.lower().endswith(".cif"):
                mt = os.path.getmtime(f)
                if mt > mtime:
                    mtime = mt
                    fname = f

        have_results = False
        summary_line = "model not saved"

        if fname:

            f = istruct.getXYZFileName()
            if not f:
                f = istruct.getSubFileName()
            fnprefix = f[:f.find("_")]

            if fname.startswith(fnprefix):
                fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )
            else:
                fn,fext = os.path.splitext ( f )
            #coot_xyz = fn + "_xyz" + fext
            #coot_mtz = fn + "_map.mtz"
            coot_xyz = self.getOFName ( fext )
            coot_mtz = istruct.getMTZFileName()
            shutil.copy2 ( fname  ,coot_xyz )
            shutil.copy2 ( mtzfile,coot_mtz )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( coot_mtz,fn )

            # add covalent links from coot to restraint dictionary, modify output pdb-file
            libout = "links.lib"
            pdbout = "links.pdb"
            try:
                exe_obj = self, [], dict(logType='Service')
                links = LinkLists(coot_xyz)
                links.add_coot_links(exe_obj, '.', libnew, coot_xyz, libout, pdbout, using_libcheck=True)
                links.prn(self.file_stdout)
            except:
                if os.path.isfile(pdbout):
                    os.remove(pdbout)
                if os.path.isfile(libout):
                    os.remove(libout)
            else:
                if os.path.isfile(pdbout):
                    if os.path.isfile(coot_xyz):  # fix for windows
                        os.remove(coot_xyz)
                    os.rename(pdbout, coot_xyz)
                if os.path.isfile(libout):
                    if not libnew:
                        libnew = self.outputFName + ".lib"
                    if os.path.isfile(libnew):    # fix for windows
                        os.remove(libnew)
                    os.rename(libout, libnew)

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            struct = self.registerStructure ( coot_xyz,None,coot_mtz,
                                              None,None,libnew,
                                              #fnames[0],fnames[1],libnew,  -- not needed for new UglyMol
                                              leadKey=lead_key )

            #                                  istruct.getLibFilePath(self.inputDir()) )
            if struct:
                struct.copyAssociations ( istruct )
                struct.copySubtype      ( istruct )
                struct.putCootMeta      ( self.job_id )
                struct.makeXYZSubtype   ()
                struct.copyLabels       ( istruct )
                struct.copyLigands      ( istruct )
                if ligand:
                    struct.addLigand ( ligand.code )

                # add link formulas and counts to struct metadata
                struct.links = links.count_links(['LINK', 'SYMLINK'])
                struct.refmacLinks = links.count_links(['LINKR'])

                # create output data widget in the report page
                self.putTitle ( "Output Structure" )
                self.putStructureWidget ( "structure_btn","Output Structure",struct )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( struct   )
                self.registerRevision     ( revision )
                have_results = True
                summary_line = "model saved"

        else:
            self.putTitle ( "No Output Structure Generated" )


        # ============================================================================
        # close execution logs and quit

        self.generic_parser_summary["coot"] = {
            "summary_line" : summary_line
        }

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
