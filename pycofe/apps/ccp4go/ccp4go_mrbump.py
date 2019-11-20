##!/usr/bin/python

#
# ============================================================================
#
#    30.12.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver MrBUMP module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import sys
import shutil

#  ccp4-python imports
#import pyrvapi

import edmap
import ccp4go_morda


# ============================================================================

class MrBUMP(ccp4go_morda.MoRDa):

    def mrbump_dir(self):  return "mrbump_results"

    # ----------------------------------------------------------------------

    def mrbump ( self,parent_branch_id ):

        if not self.tryMrBUMP:
            return ""

        if not self.seqpath:
            return ""

        pdbLine = ""
        if "PDB_DIR" in os.environ:
            pdbLine = "PDBLOCAL " + os.environ["PDB_DIR"] + "\n"
        elif not self.have_internet():
            self.putMessage ( "<h3>No internet connection.</h3>" +\
                    "MrBUMP requires either access to PDB archive " +\
                    "installed locally or internet connection for " +\
                    "remote access to wwPDB. Neither is available, " +\
                    "therefore, MrBUMP cannot be executed." )
            return

        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Automated Molecular Replacement (MrBUMP)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Auto-MR",
                        "CCP4go Automated Structure Solver: Auto-MR with MrBUMP",
                        self.mrbump_dir(),parent_branch_id )

        """
        mrbump_xyz  = os.path.join ( self.mrbump_dir(),self.outputname + ".pdb" )
        mrbump_mtz  = os.path.join ( self.mrbump_dir(),self.outputname + ".mtz" )
        mrbump_map  = os.path.join ( self.mrbump_dir(),self.outputname + ".map" )
        mrbump_dmap = os.path.join ( self.mrbump_dir(),self.outputname + "_dmap.pdb" )
        """

        self.flush()

        self.open_script ( "mrbump" )
        self.write_script (
            "JOBID " + self.mrbump_dir() + "\n" + \
            "MDLS False\n" + \
            "MDLC True\n" + \
            "MDLD False\n" + \
            "MDLP False\n" + \
            "MDLM False\n" + \
            "MDLU False\n" + \
            "MRPROG molrep phaser\n" + \
            "SHELX False\n" + \
            "BUCC True\n" + \
            "BCYC 5\n" + \
            "ARPW False\n" + \
            "CHECK False\n" + \
            "UPDATE False\n" + \
            "PICKLE False\n" + \
            "MRNUM 10\n" + \
            "USEE True\n" + \
            "SCOP False\n" + \
            "DEBUG True\n" + \
            "RLEVEL 95\n" + \
            "GESE False\n" + \
            "GEST False\n" + \
            "AMPT False\n" + \
            pdbLine + \
            "LABIN F=" + self.hkl.Fmean.value + \
              " SIGF=" + self.hkl.Fmean.sigma + \
              " FreeR_flag=" + self.hkl.FREE + "\n" + \
            "LITE False\n" + \
            "END\n"
        )
        self.close_script()

        # save rvapi document
        self.storeReportDocument ( "" )

        # make command-line parameters for mrbump run on a SHELL-type node
        cmd = [ "hklin",self.mtzpath, "seqin",self.seqpath ]

        # Start mrbump
        self.setGenericLogParser ( True )
        if sys.platform.startswith("win"):
            self.runApp ( "mrbump.bat",cmd )
        else:
            self.runApp ( "mrbump",cmd )
        self.unsetLogParser()

        self.restoreReportDocument()
        self.addCitations ( ['mrbump','molrep','refmac5'] )

        # check solution and register data

        nResults = 0
        rfree    = 1.0
        rfactor  = 1.0
        spg_info = None

        mrbump_xyz  = ""
        mrbump_mtz  = ""
        mrbump_map  = ""
        mrbump_dmap = ""

        search_dir = "search_" + self.mrbump_dir()

        if os.path.isdir(search_dir):

            f = open ( os.path.join(search_dir,"results","results.txt") )
            lines = f.readlines()
            f.close()
            for i in range(len(lines)):
                if lines[i].startswith("Refmac PDBOUT:"):
                    mrbump_xyz = os.path.join ( self.mrbump_dir(),"mrbump.pdb" )
                    shutil.copy2 ( lines[i+1].strip(),mrbump_xyz )
                if lines[i].startswith("Refmac MTZOUT:"):
                    mrbump_mtz = os.path.join ( self.mrbump_dir(),"mrbump.mtz" )
                    shutil.copy2 ( lines[i+1].strip(),mrbump_mtz )
                if "Model_Name  MR_Program  Solution_Type" in lines[i]:
                    lst     = lines[i+1].split()
                    rfactor = float(lst[5])
                    rfree   = float(lst[6])

        if mrbump_xyz and os.path.isfile(mrbump_xyz):
            spg_info     = self.checkSpaceGroup ( self.hkl.HM,mrbump_xyz )
            nResults     = 1
            quit_message = "refined to <i>R<sub>free</sub>=" + str(rfree) + "</i>"
        else:
            spg_info     = { "spg":self.hkl.HM, "hkl":"" }
            mrbump_xyz   = ""
            quit_message = "FAILED."

        if mrbump_mtz:

            #edmap.calcCCP4Maps ( mrbump_mtz,os.path.join(self.mrbump_dir(),"mrbump"),
            #            "./",self.file_stdout,self.file_stderr,"refmac",None )
            mrbump_map  = os.path.join ( self.mrbump_dir(),"mrbump.map" )
            mrbump_dmap = os.path.join ( self.mrbump_dir(),"mrbump.diff.map" )

            self.putMessage ( "<h2><i>Refined solution</i></h2>" )
            dfpath = "/".join ( ["..",self.mrbump_dir(),"mrbump"] )
            self.putStructureWidget ( "Structure and density map",
                                    [ dfpath+".pdb",dfpath+".mtz",dfpath+".map",
                                      dfpath+".diff.map" ],-1 )

        columns = {
          "F"       : self.hkl.Fmean.value,
          "SIGF"    : self.hkl.Fmean.sigma,
          "FREE"    : self.hkl.FREE,
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        quit_message = self.saveResults ( "MrBUMP",self.mrbump_dir(),nResults,
                rfree,rfactor,"mrbump", mrbump_xyz,mrbump_mtz,mrbump_map,mrbump_dmap,
                None,None,columns,spg_info )

        self.quit_branch ( branch_data,self.mrbump_dir(),
                           "Automated Molecular Replacement (MrBUMP): " +
                           quit_message )

        return  branch_data["pageId"]
