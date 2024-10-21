#!/usr/bin/python

#
# ============================================================================
#
#    21.10.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COOT MODEL BUILDING EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.coot_mb.py jobManager jobDir jobId expire=timeout_in_days
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir      is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    expire      is timeout for removing coot backup directories
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

import gemmi

#  application imports
from . import coot_ce
from   pycofe.proc    import  covlinks, concorr
from   pycofe.varut   import  mmcif_utils # messagebox, selectfile

# from   pycofe.varut   import  signal
# try:
#     if sys.platform.startswith("win"):
#         os.environ['PATH'] += ';' + os.path.join(os.environ["CCP4"], "bin")
#     from pycofe.varut import messagebox
# except:
#     messagebox = None

# ============================================================================
# Make Coot driver

class Coot(coot_ce.CootCE):

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

    # def addLigandToLibrary ( self,libPath,ligCode,ligPath,ligList ):
    #     # returns path to ligand library whith new ligand included

    #     if not ligPath:  # nothing to include
    #         return (libPath,ligList)

    #     if not libPath:  # nowhere to include
    #         return (ligPath,ligList+[ligCode])

    #     if ligCode in ligList:  # no need to include
    #         return (libPath,ligList)

    #     """
    #     self.open_stdin()
    #     self.write_stdin (
    #         "_Y"          +\
    #         "\n_FILE_L  " + libPath +\
    #         "\n_FILE_L2 " + ligPath +\
    #         "\n_FILE_O  " + self.outputFName +\
    #         "\n_END\n" )
    #     self.close_stdin()

    #     self.runApp ( "libcheck",[],logType="Service" )
    #     """
    #     mergeone.add_one_comp(ligPath, libPath, self.outputFName + ".lib")

    #     return (self.outputFName+".lib",ligList+[ligCode])

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare coot job

        #self.putMessage ( "<h3><i>Make sure that you save your work from Coot " +\
        #                  "<u>without changing directory and file name offered</u></i></h3>" )
        #self.flush

        coot_backup_dir = self.makeBackupDirectory()
        recover_fpath   = self.fetchRecoveryFile  ( coot_backup_dir )

        # fetch input data
        revision  = self.makeClass ( self.input_data.data.revision[0] )
        istruct   = self.makeClass ( self.input_data.data.istruct [0] )
        mtzfile   = istruct.getMTZFilePath ( self.inputDir() )
        lead_key  = istruct.leadKey

        istruct2 = None
        if hasattr(self.input_data.data,"istruct2"):
            istruct2 = self.makeClass ( self.input_data.data.istruct2[0] )

        data_list = []
        if hasattr(self.input_data.data,"aux_struct"):
            data_list += self.input_data.data.aux_struct
        for i in range(len(data_list)):
            data_list[i] = self.makeClass ( data_list[i] )

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
        libin = libPath

        # make command line arguments
        args = []
        xyz_data_list = []
        xyzpath = istruct.getXYZFilePath ( self.inputDir() )
        if recover_fpath:
            xyzpath = recover_fpath
            self.putMessage (
                "<span style=\"font-size:112%;color:maroon;\"><b>" +\
                "Input structure was restored from last backup in job " +\
                str(self.task.recover_from) + ".</b></span><br>&nbsp;" 
            )
            self.flush()

        # if not xyzpath:
        #     xyzpath = istruct.getPDBFilePath ( self.inputDir() )    
        if not xyzpath:
            xyzpath = istruct.getSubFilePath ( self.inputDir() )
        if xyzpath:
            args += ["--pdb",xyzpath]
            xyz_data_list.append(xyzpath)
        mtzpath = istruct.getMTZFilePath ( self.inputDir() )
        if mtzpath:
            args += ["--auto",mtzpath]

        if istruct2:
            xyzpath = istruct2.getXYZFilePath ( self.inputDir() )
            if not xyzpath:
                xyzpath = istruct2.getSubFilePath ( self.inputDir() )
            if xyzpath and xyzpath not in args:
                args += ["--pdb",xyzpath]
                xyz_data_list.append(xyzpath)
            mtzpath = istruct2.getMTZFilePath ( self.inputDir() )
            if mtzpath and mtzpath not in args:
                args += ["--auto",mtzpath]

        for s in data_list:
            xyzpath = s.getXYZFilePath ( self.inputDir() )
            if xyzpath and xyzpath not in args:
                args += ["--pdb",xyzpath]
                xyz_data_list.append(xyzpath)
            if s._type=="DataStructure":
                xyzpath = s.getSubFilePath ( self.inputDir() )
                if xyzpath and xyzpath not in args:
                    args += ["--pdb",xyzpath]
                    xyz_data_list.append(xyzpath)
                mtzpath = s.getMTZFilePath ( self.inputDir() )
                if mtzpath and mtzpath not in args:
                    args += ["--auto",mtzpath]

        """
        for s in data_list:
            if s.getPDBFileName():
                xyzpath = s.getPDBFilePath(self.inputDir())
                if xyzpath not in args:
                    args += ["--pdb",xyzpath]
                    xyz_data_list.append(xyzpath)
            if s._type=="DataStructure":
                if s.getSubFileName():
                    xyzpath = s.getSubFilePath(self.inputDir())
                    if xyzpath not in args:
                        args += ["--pdb",xyzpath]
                        xyz_data_list.append(xyzpath)
                mtzpath = s.getMTZFilePath(self.inputDir())
                if mtzpath not in args:
                    args += ["--auto",mtzpath]
        """

        if libPath:
            args += ["--dictionary",libPath]

        #if ligand:
        #    args += ["--python","-c","get_monomer('" + ligand.code + "')"]

        coot_mod = os.path.join ( os.path.dirname(os.path.abspath(__file__)),
                                  "..","proc","coot_modifier.py" )
        coot_scr = istruct.getCootFilePath ( self.inputDir() )
        """
        if coot_scr or ligand:
            f = open ( coot_mod,"r" )
            coot_mod_content = f.read()
            f.close()
            if not coot_scr:
                coot_scr = "__coot_script.py"
            f = open ( coot_scr,"a" )
            f.write  ( coot_mod_content )
            #f.write  ( "\n    set_nomenclature_errors_on_read(\"ignore\")\n" )
            if ligand:
                f.write ( "\n    get_monomer(\"" + ligand.code + "\")\n" )
            f.close()
        else:
            coot_scr = coot_mod
        """

        f = open ( coot_mod,"r" )
        coot_mod_content = f.read() \
            .replace ( "$selfile.py",os.path.join (
                            os.path.dirname(os.path.abspath(__file__)),
                            "..","varut","selectfile.py"
                       ).replace("\\","\\\\")
                     ) \
            .replace ( "$backup_dir",os.path.join(
                            coot_backup_dir,".."
                       ).replace("\\","\\\\")
                     )
        f.close()
        if not coot_scr:
            coot_scr = "__coot_script.py"
        f = open ( coot_scr,"a" )
        f.write  ( coot_mod_content )
        if ligand:
            f.write ( "\n    get_monomer(\"" + ligand.code + "\")\n" )
        f.close()

        molp_path = istruct.getMolProbityFilePath ( self.inputDir() )
        if molp_path:
            shutil.copy2 ( molp_path,"molprobity_probe.txt" )

        #args += ["--python",coot_scr,"--no-guano"]
        args += ["--script",coot_scr]

        try:
            concorr.conn_script(xyz_data_list[0], coot_scr)
        except:
            self.file_stderr.write("# concorr.conn_script failed")

        # Run coot
        if sys.platform.startswith("win"):
            coot_bat = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
            rc = self.runApp ( coot_bat,args,logType="Main",quitOnError=False )
            try:
                if os.path.isdir("coot-backup"):
                    shutil.rmtree ( coot_backup_dir, ignore_errors=True, onerror=None )
                    shutil.move   ( "coot-backup"  , coot_backup_dir )
            except:
                self.stderrln ( " *** backup copy failed " + coot_backup_dir )
        else:
            rc = self.runApp ( "coot",args,logType="Main",quitOnError=False )

        self.putMessage (
            "<i>Just in case: learn about recovering results from crashed Coot jobs " +\
                self.hotDocLink ( "here","jscofe_tips.coot_crash",
                                  "Recover Coot results" ) + "</i>" )

        if os.path.isfile("task_chain.cmd"):
            file = open ( "task_chain.cmd","r" )
            self.task.task_chain = file.read().strip().split(",")
            file.close()

        #   Remove Coot backup directory only because it uses file naming that
        # is not cross-platform compatible (includes colons on Linux which are
        # illegal in Windows)
        #   This also prevents creating 'backup_dir' item in coot_meta dictionary
        # below in putCootMeta call. Note that backup_dir is functonally disabled
        # in TaskCootMB.makeInputData().
        #shutil.rmtree ( "coot-backup", ignore_errors=True, onerror=None )

        # Check for PDB files left by Coot and convert them to type structure

        files       = os.listdir ( "./" )
        mtime       = 0
        fname       = None
        newLigCode  = None
        ligand_coot = None

        for f in files:
            fu = f.upper()
            if fu.startswith("ACEDRG-LIG"):

                if fu.endswith(".CIF"):

                    exclude_list = []
                    '''
                    if hasattr(self.input_data.data,"void1"):
                        ligands = self.input_data.data.void1
                        for i in range(len(ligands)):
                            exclude_list.append ( ligands[i].code )
                    '''
                    if istruct.ligands:
                        sep = '('
                        exclude_list = [(tt + sep).split(sep)[0] for tt in istruct.ligands]

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

            elif fu.endswith(".PDB") or fu.endswith(".CIF"):
                mt = os.path.getmtime(f)
                if mt > mtime:
                    mtime = mt
                    fname = f

        summary_line = "model not saved"
        have_results = ligand_coot is not None

        restored = False
        if not fname:  # try to get the latest backup file
            fname = self.getLastBackupFile ( coot_backup_dir )
            restored = fname is not None

        if fname:

            # convert to CIF if necessary            
            # fn,fext = os.path.splitext ( fname )
            # if fext.lower()==".pdb":
            #     fname = mmcif_utils.convert_to_mmcif ( fname )

            # check format because Coot is buggy!
            # fname1  = fname
            # fn,fext = os.path.splitext ( fname )
            # try:
            #     cif = gemmi.cif.read ( fname )
            #     if fext.lower()==".pdb":
            #         fname1 = fn + ".cif"
            #     self.stdoutln ( " >>>>>1 " + fname1 )
            # except:
            #     #  assume PDB
            #     if fext.lower()!=".pdb":
            #         fname1 = fn + ".pdb"
            #     self.stdoutln ( " >>>>>2 " + fname1 )
            # if fname1!=fname:
            #     os.rename ( fname,fname1 )
            #     fname = fname1

            if newLigCode:
                self.replace_ligand_code ( fname,"LIG",newLigCode,rename=False )

            # f = istruct.getMMCIFFileName()
            # if not f:
            #     f = istruct.getPDBFileName()
            # if not f:
            #     f = istruct.getSubFileName()
            # fnprefix = f[:f.find("_")]

            # if fname.startswith(fnprefix):
            #     fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )
            # else:
            #     fn,fext = os.path.splitext ( f )

            fn,fext = os.path.splitext ( fname[fname.find("_")+1:] )

            # shutil.copy2 ( fname,"inspect.txt" )


            # coot_xyz = self.getOFName ( fext )
            # coot_xyz   = None
            # coot_pdb   = None
            # coot_mmcif = None
            # if fext.upper()!=".PDB":
            #     coot_mmcif = self.getMMCIFOFName()
            #     shutil.copy2 ( fname,coot_mmcif )
            #     coot_xyz   = coot_mmcif
            # else:
            #     coot_pdb = self.getXYZOFName() #  .pdb
            #     shutil.copy2 ( fname,coot_pdb )
            #     coot_xyz = coot_pdb

            # coot_pdb   = None
            coot_mmcif = self.getMMCIFOFName()
            # coot_xyz   = coot_mmcif
            if fext.upper()!=".PDB":
                # coot_mmcif = self.getMMCIFOFName()
                shutil.copy2 ( fname,coot_mmcif )
            else:
                # coot_pdb = self.getXYZOFName() #  .pdb
                shutil.copy2 ( mmcif_utils.convert_to_mmcif(fname),coot_mmcif )

            coot_mtz = istruct.getMTZFileName()
            shutil.copy2 ( mtzfile,coot_mtz )

            try:
                # concorr.conn_correct(xyz_data_list[0], coot_xyz, '_tmp_coot.cif')
                # os.rename('_tmp_coot.cif', coot_xyz)
                concorr.conn_correct(xyz_data_list[0], coot_mmcif, '_tmp_coot.cif')
                os.rename('_tmp_coot.cif', coot_mmcif )
            except:
                self.file_stderr.write("# concorr.conn_correct failed")

            try:
                mode = 1
                # cvl = covlinks.CovLinks(libPath, coot_xyz)
                cvl = covlinks.CovLinks(libPath, coot_mmcif )
                msg_llist = cvl.suggest_changes()
                # combined mode would be better:
                # - the same chain: 3
                # - different chains: 2
                # cvl.update(mode = mode, xyzout = coot_xyz, stdo = self.file_stdout)
                cvl.update(mode = mode, xyzout = coot_mmcif, stdo = self.file_stdout)
                self.file_stdout.write(str(msg_llist))
                lines = []
                vspace = "<font size='+2'><sub>&nbsp;</sub></font>"
                msg_len = len(msg_llist[0])
                if msg_len and (mode & 1):
                    lines.append("<b>Replaced LINK record" +
                       ("s" if msg_len > 1 else "") + " with LINKR:</b>")
                    lines.extend(msg_llist[0])
                msg_len = len(msg_llist[1])
                if msg_len and (mode & 2):
                    lines.append("<b>Added new LINKR record" +
                       ("s" if msg_len > 1 else "") + ":</b>")
                    lines.extend(msg_llist[1])
                if lines:
                    self.putMessage1(
                        self.report_page_id(),
                        '<br>'.join(lines) + vspace,
                        self.rvrow)
                    self.rvrow += 1
                cvl.prep_lists()
                link_counts = dict(cvl.counts(self.file_stdout))
                del mode, cvl, msg_llist, lines, vspace, msg_len
            except:
                link_counts = None

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            libContents0 = ""
            if libin and os.path.isfile(libin):
                with open(libin) as f:
                    libContents0 = f.read()
            libContents1 = ""
            if libin and os.path.isfile(libPath):
                with open(libin) as f:
                    libContents1 = f.read()
            library = None
            if libContents0 != libContents1:
                library = self.registerLibrary ( libPath,copy_files=False )
            if library:
                libPath = library.getLibFilePath(self.outputDir())

            struct = self.registerStructure ( 
                            coot_mmcif,
                            None, # coot_pdb,
                            None,
                            coot_mtz,
                            libPath = libPath,
                            leadKey = lead_key,
                            refiner = istruct.refiner 
                        )

            if struct and library:
                assert libPath == struct.getLibFilePath(self.outputDir())

            if struct:
                struct.copy_refkeys_parameters ( istruct )
                struct.copyAssociations ( istruct )
                struct.copySubtype      ( istruct )
                struct.putCootMeta      ( self.job_id )
                struct.makeXYZSubtype   ()
                struct.copyLabels       ( istruct )
                struct.copyLigands      ( istruct )
                #if ligand:
                #    struct.addLigand ( ligand.code )
                struct.setLigands       ( ligList )

                # struct.add_file ( "mol0.mmcif",self.outputDir(),"mmcif",copy_bool=False )
                if coot_mmcif:
                    struct.add_file ( coot_mmcif,self.outputDir(),"mmcif",copy_bool=False )

                # add link formulas and counts to struct metadata
                if link_counts:
                    struct.ligands     = link_counts['comps_usr']
                    struct.refmacLinks = link_counts['links_usr']
                    struct.links       = link_counts['links_std']
                    struct.links      += link_counts['links_unk']

                # create output data widget in the report page
                self.putTitle ( "Output Structure" )
                self.putStructureWidget ( "structure_btn","Output Structure",struct )

                # update structure revision
                revision.setStructureData ( struct   )
                if ligand:
                    revision.addLigandData ( ligand      )
                if ligand_coot:
                    revision.addLigandData ( ligand_coot )
                self.registerRevision ( revision )

                have_results = True
                summary_line = "model saved"
                if restored:
                    summary_line += " from backup copy"

        else:
            self.putTitle ( "No Output Structure Produced" )


        # ============================================================================
        # close execution logs and quit

        if ligand_coot:
            summary_line = "ligand \"" + ligand_coot.code + "\" built, " + summary_line

        self.generic_parser_summary["coot"] = {
            "summary_line" : summary_line
        }

        if (rc.msg == "") and (not have_results) and hasattr(self.task,"hot_launch") and self.task.hot_launch:
            self.task.task_chain = ["delete_job"]
        self.success ( have_results )

        # if rc.msg == "":
        #     if not have_results and hasattr(self.task,"hot_launch") and self.task.hot_launch:
        #         self.task.task_chain = ["delete_job"]
        #     self.success ( have_results )
        # else:
        #     self.file_stdout.close()
        #     self.file_stderr.close()
        #     if messagebox:
        #         messagebox.displayMessage ( "Failed to launch",
        #           "<b>Failed to launch Coot: <i>" + rc.msg + "</i></b>"
        #           "<p>This may indicate a problem with software setup." )

        #     raise signal.JobFailure ( rc.msg )

        return


# ============================================================================

if __name__ == "__main__":

    drv = Coot ( "",os.path.basename(__file__) )
    drv.start()
