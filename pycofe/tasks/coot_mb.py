#!/usr/bin/python

#
# ============================================================================
#
#    24.04.20   <--  Date of Last Modification.
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
from . import basic
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

    #def get_ligand_code ( self,exclude_list ):
    #    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    #    for L1 in alphabet:
    #        dirpath = os.path.join ( os.environ["CCP4"],"lib","data","monomers",L1.lower() )
    #        dirSet  = set ( os.listdir(dirpath) )
    #        for L2 in alphabet:
    #            for L3 in alphabet:
    #                code = L1 + L2 + L3
    #                if code+".cif" not in dirSet and code not in exclude_list:
    #                    return code
    #    return None

    def replace_ligand_code ( self,fpath,oldCode,newCode,rename=False ):
        f = open(fpath,"r")
        data = f.read()
        f.close()
        os.remove ( fpath )
        if rename:
            if oldCode in fpath:
                fwpath   = fpath.replace ( oldCode,newCode )
            else:
                fn, fext = os.path.splitext ( fpath )
                fwpath   = fn + "-" + newCode + fext
        else:
            fwpath = fpath
        f = open(fwpath,"w")
        f.write ( data.replace(oldCode,newCode) )
        f.close()
        return fwpath


    # ------------------------------------------------------------------------

    def addLigandToLibrary ( self,libPath,ligCode,ligPath,ligList ):
        # returns path to ligand library whith new ligand included

        if not ligPath:  # nothing to include
            return (libPath,ligList)

        if not libPath:  # nowhere to include
            return (ligPath,ligList+[ligCode])

        if ligCode in ligList:  # no need to include
            return (libPath,ligList)

        self.open_stdin()
        self.write_stdin (
            "_Y"          +\
            "\n_FILE_L  " + libPath +\
            "\n_FILE_L2 " + ligPath +\
            "\n_FILE_O  " + self.outputFName +\
            "\n_END\n" )
        self.close_stdin()

        self.runApp ( "libcheck",[],logType="Service" )

        return (self.outputFName+".lib",ligList+[ligCode])

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
        ligCode = None
        ligPath = None
        if hasattr(self.input_data.data,"ligand"):
            ligand  = self.makeClass ( self.input_data.data.ligand[0] )
            ligCode = ligand.code
            ligPath = ligand.getLibFilePath ( self.inputDir() )

        libPath, ligList = self.addLigandToLibrary (
                                    istruct.getLibFilePath(self.inputDir()),
                                    ligCode,ligPath,istruct.ligands )

        # make command line arguments
        args = []
        for s in data_list:
            if s.getXYZFileName():
                args += ["--pdb",s.getXYZFilePath(self.inputDir())]
            if s._type=="DataStructure":
                if s.getSubFileName():
                    args += ["--pdb",s.getSubFilePath(self.inputDir())]
                args += ["--auto",s.getMTZFilePath(self.inputDir())]

        if libPath:
            args += ["--dictionary",libPath]

        #if ligand:
        #    args += ["--python","-c","get_monomer('" + ligand.code + "')"]

        coot_mod = os.path.join ( os.path.dirname(os.path.abspath(__file__)),
                                  "..","proc","coot_modifier.py" )
        coot_scr = istruct.getCootFilePath ( self.inputDir() )
        if coot_scr or ligand:
            f = open ( coot_mod,"r" )
            coot_mod_content = f.read()
            f.close()
            if not coot_scr:
                coot_scr = "__coot_script.py"
            f = open ( coot_scr,"a" )
            f.write  ( coot_mod_content )
            if ligand:
                f.write ( "\n    get_monomer(\"" + ligand.code + "\")\n" )
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

        #   Remove Coot backup directory only because it uses file naming that
        # is not cross-platform compatible (includes colons on Linux which are
        # illegal in Windows)
        #   This also prevents creating 'backup_dir' item in coot_meta dictionary
        # below in putCootMeta call. Note that backup_dir if functonally disabled
        # in TaskCootMB.makeInputData().
        shutil.rmtree ( "coot-backup", ignore_errors=True, onerror=None )

        # Check for PDB files left by Coot and convert them to type structure

        files       = os.listdir ( "./" )
        mtime       = 0
        fname       = None
        newLigCode  = None
        ligand_coot = None

        for f in files:
            if f.startswith("acedrg-LIG"):

                if f.endswith(".cif"):

                    exclude_list = []
                    if hasattr(self.input_data.data,"void1"):
                        ligands = self.input_data.data.void1
                        for i in range(len(ligands)):
                            exclude_list.append ( ligands[i].code )

                    newLigCode = self.get_ligand_code ( ligList+exclude_list )
                    if newLigCode:
                        self.putMessage (
                            "<b>New ligand was generated with generic " +\
                            "name \"LIG\", and subsequently renamed as \"" +\
                            newLigCode + "\"</b><ul><li>" +\
                            "<span style=\"font-size:85%;\">" +\
                            "<i>The new name is not found in Monomer Library and " +\
                            "is not used in current structure revision.<br>" +\
                            "</i></span></li></ul>"
                        )
                        ligCIF = self.replace_ligand_code (
                                            f,"LIG",newLigCode,rename=True )
                        ligPDB = self.replace_ligand_code (
                                            "acedrg-LIG.pdb","LIG",newLigCode,
                                            rename=True )
                        libPath, ligList = self.addLigandToLibrary (
                                            libPath,newLigCode,ligCIF,ligList )
                        if libPath==ligCIF:
                            shutil.copy2 ( libPath,"ligands.lib" )
                            libPath = "ligands.lib"
                        ligand_coot = self.finaliseLigand ( newLigCode,ligPDB,ligCIF )
                    else:
                        self.putMessage (
                            "<b>New ligand was generated with generic " +\
                            "name \"LIG\", but replace name was not found</b><ul><li>" +\
                            "<span style=\"font-size:85%;color:maroon;\">" +\
                            "<i>Using generic ligand name will likely cause " +\
                            "problems at repeat use in Coot.</i></span></li></ul>"
                        )
                        libPath, ligList = self.addLigandToLibrary (
                                                    libPath,"LIG",f,ligList )
                        if libPath==f:
                            shutil.copy2 ( libPath,"ligands.lib" )
                            libPath = "ligands.lib"
                        ligand_coot = self.finaliseLigand ( "LIG","acedrg-LIG.pdb",f )

            elif f.lower().endswith(".pdb") or f.lower().endswith(".cif"):
                mt = os.path.getmtime(f)
                if mt > mtime:
                    mtime = mt
                    fname = f

        summary_line = "model not saved"
        have_results = ligand_coot is not None

        if fname:

            if newLigCode:
                self.replace_ligand_code ( fname,"LIG",newLigCode,rename=False )

            f = istruct.getXYZFileName()
            if not f:
                f = istruct.getSubFileName()
            fnprefix = f[:f.find("_")]

            if fname.startswith(fnprefix):
                fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )
            else:
                fn,fext = os.path.splitext ( f )
            coot_xyz = self.getOFName ( fext )
            coot_mtz = istruct.getMTZFileName()
            shutil.copy2 ( fname  ,coot_xyz )
            shutil.copy2 ( mtzfile,coot_mtz )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( coot_mtz,fn )

            # add covalent links from coot to restraint dictionary, modify output pdb-file
            links  = None
            libout = "links.lib"
            pdbout = "links.pdb"
            try:
                exe_obj = self, [], dict(logType='Service')
                links = LinkLists(coot_xyz)
                links.add_coot_links ( exe_obj, '.', libPath, coot_xyz, libout,
                                       pdbout, using_libcheck=True )
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
                    if not libPath:
                        libPath = self.outputFName + ".lib"
                    if os.path.isfile(libPath):    # fix for windows
                        os.remove(libPath)
                    os.rename ( libout,libPath )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            struct = self.registerStructure ( coot_xyz,None,coot_mtz,
                                              None,None,libPath=libPath,
                                              leadKey=lead_key )

            #                                  istruct.getLibFilePath(self.inputDir()) )
            if struct:
                struct.copyAssociations ( istruct )
                struct.copySubtype      ( istruct )
                struct.putCootMeta      ( self.job_id )
                struct.makeXYZSubtype   ()
                struct.copyLabels       ( istruct )
                struct.copyLigands      ( istruct )
                #if ligand:
                #    struct.addLigand ( ligand.code )
                struct.setLigands       ( ligList )

                # add link formulas and counts to struct metadata
                if links:
                    struct.links = links.count_links(['LINK', 'SYMLINK'])
                    struct.refmacLinks = links.count_links(['LINKR'])

                # create output data widget in the report page
                self.putTitle ( "Output Structure" )
                self.putStructureWidget ( "structure_btn","Output Structure",struct )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( struct   )
                if ligand:
                    revision.addLigandData ( ligand      )
                if ligand_coot:
                    revision.addLigandData ( ligand_coot )
                self.registerRevision     ( revision )
                have_results = True
                summary_line = "model saved"

        else:
            self.putTitle ( "No Output Structure Generated" )


        # ============================================================================
        # close execution logs and quit

        if ligand_coot:
            summary_line = "ligand \"" + ligand_coot.code + "\" built, " + summary_line

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

        return


# ============================================================================

if __name__ == "__main__":

    drv = Coot ( "",os.path.basename(__file__) )
    drv.start()
