#!/usr/bin/python

#
# ============================================================================
#
#    20.10.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
import gzip
import time

import gemmi

#  application imports
from . import basic

# from   pycofe.varut   import  signal
# try:
#     from pycofe.varut import messagebox
# except:
#     messagebox = None


# ============================================================================
# Make Coot driver

class CootCE(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def makeBackupDirectory ( self ):

        #  remove expired backup directories

        coot_backups_dir = os.path.abspath ( os.path.join("..","..","backups") )
        if os.path.exists(coot_backups_dir):
            expire = self.getCommandLineParameter ( "expire" )
            if not expire:
                expire = "30"  # days
            expire = 86400*int(expire)  # in seconds
            files  = os.listdir ( coot_backups_dir )
            mtime  = time.time()
            for f in files:
                fp = os.path.join ( coot_backups_dir,f )
                mt = os.path.getmtime(fp)
                if mtime-mt > expire:
                    if os.path.isfile(fp):
                        os.remove ( fp )
                    else:
                        shutil.rmtree ( fp, ignore_errors=True, onerror=None )

        #  make new backup directory
        coot_backup_dir = os.path.join ( coot_backups_dir,
                                  self.task.project + "_" + str(self.task.id) )
        if not os.path.exists(coot_backup_dir):
            os.makedirs ( coot_backup_dir )
        os.environ["COOT_BACKUP_DIR"] = str(coot_backup_dir)

        return coot_backup_dir


    # ------------------------------------------------------------------------

    def getLastBackupFile ( self,backup_dir ):
        files = os.listdir ( backup_dir )
        # mtime = 0
        fpath = None
        fname = None
        for f in files:
            if f.lower().endswith(".pdb.gz") or f.lower().endswith(".cif.gz"):
                fp = os.path.join ( backup_dir,f )
                # mt = os.path.getmtime(fp)
                # if mt > mtime:
                #     # mtime = mt
                if (not fpath) or (fp>fpath):
                    fpath = fp
        if fpath:
            fname = os.path.basename(fpath)[:-3].replace(":","-")
            with open(fname,'wb') as f_out, gzip.open(fpath,'rb') as f_in:
                shutil.copyfileobj ( f_in,f_out )
            self.putMessage (
                "<span style=\"font-size:112%;color:maroon;\"><b>" +\
                "Coordinates are restored from last Coot backup.</b></span>" +\
                "<span style=\"font-size:100%;color:maroon;\"><p>" +\
                "Next time, save coordinates before ending Coot session, " +\
                "using Coot's <i>\"File/Save coordinates ...\"</i> menu " +\
                "item, without changing the file name and output directory " +
                "offered.</span>"
            )
        return fname

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare coot job

        #self.putMessage ( "<h3><i>Make sure that you save your work from Coot " +\
        #                  "<u>without changing directory and file name offered</u></i></h3>" )
        #self.flush()

        # fetch input data

        coot_backup_dir = self.makeBackupDirectory()

        # make command line arguments
        args = []
        ixyz = self.input_data.data.ixyz
        for i in range(len(ixyz)):
            ixyz[i] = self.makeClass ( ixyz[i] )
            xyzpath = ixyz[i].getXYZFilePath(self.inputDir())
            if xyzpath and (xyzpath not in args):
                args += ["--pdb",xyzpath]

        coot_scr = "coot_jscofe.py"
        coot_scr = os.path.join ( os.path.dirname ( os.path.abspath(__file__)),"..","proc",coot_scr )
        #args += ["--python",coot_scr,"--no-guano"]
        args    += ["--script",coot_scr]

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

        # Check for PDB files left by Coot and convert them to type structure

        files = os.listdir ( "./" )
        fdic  = {}
        mlist = []
        for f in files:
            if f.lower().endswith(".pdb") or f.lower().endswith(".cif") or\
               f.lower().endswith(".mmcif"):
                mt = os.path.getmtime(f)
                fdic[mt] = f
                mlist.append ( mt )

        have_results = False
        summary      = ""

        restored = False
        if len(mlist)<=0:  # try to get the latest backup file
            fname = self.getLastBackupFile ( coot_backup_dir )
            if fname:
                restored = True
                mt       = os.path.getmtime(fname)
                fdic[mt] = fname
                mlist.append ( mt )

        if len(mlist)>0:

            self.putTitle ( "Output coordinate data" )

            # f = ixyz[0].getPDBFileName()
            # if not f and (ixyz[0]._type=="DataStructure"):
            #     f = ixyz[0].getSubFileName()
            # fnprefix = f[:f.find("_")]

            mlist = sorted(mlist)
            for i in range(len(mlist)):

                fname     = fdic[mlist[i]]
                xyz_pdb   = None
                xyz_mmcif = None
                st        = None
                try:
                    st = gemmi.read_pdb(fname)
                    xyz_pdb = self.getXYZOFName() #  .pdb
                    shutil.copy2 ( fname,xyz_pdb )
                except:
                    pass
                if not st:
                  try:
                      st = gemmi.read_structure(fname,True,gemmi.CoorFormat.Detect)
                      xyz_mmcif = self.getMMCIFOFName()
                      shutil.copy2 ( fname,xyz_mmcif )
                  except:
                      pass

                if st:

                    # register output data from temporary location (files will be moved
                    # to output directory by the registration procedure)

                    xyz = self.registerXYZ ( xyz_mmcif,xyz_pdb )
                    if xyz:
                        # xyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                        self.putMessage (
                            "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                            xyz.dname )
                        self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Edited coordinates",xyz )
                        if i<len(mlist)-1:
                            self.putMessage ( "&nbsp;" )
                        have_results = True

                else:
                    self.stderrln ( " +++++ cannot identify format for " + str(fname) )

            summary = "model saved"
            if restored:
                summary += " from backup copy"

        else:
            self.putTitle ( "No output data produced" )
            summary = "no results"


        # this will go in the project tree line
        self.generic_parser_summary["anomap"] = {
            "summary_line" : summary
        }

        # ============================================================================
        # close execution logs and quit

        self.success ( have_results )

        # if rc.msg == "":
        #     self.success ( have_results )
        # else:
        #     self.file_stdout.close()
        #     self.file_stderr.close()
        #     if messagebox:
        #         messagebox.displayMessage ( "Failed to launch",
        #           "<b>Failed to launch Coot: <i>" + rc.msg + "</i></b>"
        #           "<p>This may indicate a problem with software setup." )

        #     raise signal.JobFailure ( rc.msg )

# ============================================================================

if __name__ == "__main__":

    drv = CootCE ( "",os.path.basename(__file__) )
    drv.start()
