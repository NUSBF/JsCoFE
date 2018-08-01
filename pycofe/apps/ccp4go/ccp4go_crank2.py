##!/usr/bin/python

#
# ============================================================================
#
#    30.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver Crank-2 module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import sys

#  ccp4-python imports
#import pyrvapi

import ccp4go_morda

# ============================================================================

class Crank2(ccp4go_morda.MoRDa):

    def crank2_dir(self):  return "crank2_results"

    # ------------------------------------------------------------------------

    def crank2 ( self,parent_branch_id ):

        if not self.tryCrank2:
            return ""

        # check data availability

        if not self.hkl.Fpm and not self.hkl.Ipm or not self.seqpath:
            return

        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                            ". Automated Experimental Phasing (Crank-2)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Auto-EP (Crank-2)",
                        "CCP4go Automated Structure Solver: Auto-EP " +
                        "with Crank-2", self.crank2_dir(),parent_branch_id,
                        "results_tab" )

        # make report tab

        cursor2 = self.insertTab ( "results_tab","Report",
                                   branch_data["logTabId"],True )
        self.putMessage ( "<h2>Automated Experimental Phasing with Crank-2</h2>" )

        # write input script

        self.open_script ( "crank2" )

        if self.hkl.Ipm:
            self.write_script ( "fsigf plus dname=peak file=" + self.mtzpath +
                                      " i=" + self.hkl.Ipm.plus.value  +
                                   " sigi=" + self.hkl.Ipm.plus.sigma  + "\n"
                "fsigf minus dname=peak i=" + self.hkl.Ipm.minus.value +
                                   " sigi=" + self.hkl.Ipm.minus.sigma + "\n" )
        else:
            self.write_script ( "fsigf plus dname=peak file=" + self.mtzpath +
                                      " f=" + self.hkl.Fpm.plus.value  +
                                   " sigf=" + self.hkl.Fpm.plus.sigma  + "\n"
                "fsigf minus dname=peak f=" + self.hkl.Fpm.minus.value +
                                   " sigf=" + self.hkl.Fpm.minus.sigma + "\n" )

        exp_num_atoms = ""
        #if self.ha_number>0:
        #    exp_num_atoms = " exp_num_atoms=" + str(self.ha_number)

        self.write_script (
            "target::SAD\n"
            "model substr atomtype=" + self.ha_type + exp_num_atoms + " d_name=peak\n"
            "sequence solvent_content=0.5 file=" + self.seqpath + "\n"
            "createfree no_output_to_next_step::True\n"
            "faest\n"
            "substrdet\n"
            "refatompick\n"
            "handdet\n"
            "dmfull\n"
            "comb_phdmmb exclude obj_from=0,typ=freeR mb buccaneer\n"
            "ref target::MLHL exclude obj_from=0,typ=freeR\n"
        )

        self.close_script()


        # save rvapi document
        self.storeReportDocument ( "" )

        # make command-line parameters

        crank2_xyz  = os.path.join ( self.crank2_dir(),self.outputname + ".pdb" )
        crank2_mtz  = os.path.join ( self.crank2_dir(),self.outputname + ".mtz" )
        crank2_map  = os.path.join ( self.crank2_dir(),self.outputname + ".mtz.map" )
        crank2_dmap = os.path.join ( self.crank2_dir(),self.outputname + ".mtz_diff.map" )

        cmd = [
            os.path.join(os.environ["CCP4"],"share","ccp4i","crank2","crank2.py"),
            "--xyzout"          ,crank2_xyz,
            "--hklout"          ,crank2_mtz,
            "--dirout"          ,"report",
            "--rvapi-viewer"    ,"0",
            "--rvapi-uri-prefix","./",
            "--rvapi-document"  ,os.path.join(self.workdir,self.rvapi_doc_path),
            "--rvapi-no-tree"
        ]

        # run crank-2

        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd )
        else:
            self.runApp ( "ccp4-python",cmd )

        self.restoreReportDocument()

        # check for solution
        nResults = 0
        rfree    = 1.0
        rfactor  = 1.0
        spg_info = None
        if os.path.isfile(crank2_xyz):
            spg_info = self.checkSpaceGroup ( self.hkl.HM,crank2_xyz )
            nResults = 1
            self.mk_std_streams ( None )
            rfree_pattern   = "R-free factor after refinement is "
            rfactor_pattern = "R factor after refinement is "
            with open(os.path.join(self.crank2_dir(),self.file_stdout_path()),'r') as logf:
                for line in logf:
                    if line.startswith(rfree_pattern):
                        rfree   = float(line.replace(rfree_pattern,""))
                    if line.startswith(rfactor_pattern):
                        rfactor = float(line.replace(rfactor_pattern,""))
        else:
            spg_info   = { "spg":self.hkl.HM, "hkl":"" }
            crank2_xyz = ""

        columns = {
          "F"    : "REFM_" + self.hkl.Fmean.value,
          "SIGF" : "REFM_" + self.hkl.Fmean.sigma,
          "FREE" : "FREER",
          "PHI"  : "REFM_PHCOMB",
          "FOM"  : "REFM_FOMCOMB"
        }

        quit_message = self.saveResults ( "Crank-2",self.crank2_dir(),nResults,
                rfree,rfactor,"crank2", crank2_xyz,crank2_mtz,crank2_map,crank2_dmap,
                None,None,columns,spg_info )

        self.quit_branch ( branch_data,self.crank2_dir(),
                           "Automated Experimental Phasing (Crank-2): " +
                           quit_message )

        return  branch_data["pageId"]
