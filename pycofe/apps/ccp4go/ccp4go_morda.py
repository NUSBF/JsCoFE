##!/usr/bin/python

#
# ============================================================================
#
#    30.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver MoRDa module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import sys

#  ccp4-python imports
#import pyrvapi

import ccp4go_simbad12


# ============================================================================

class MoRDa(ccp4go_simbad12.Simbad12):

    def morda_dir(self):  return "morda_results"

    # ----------------------------------------------------------------------

    def morda ( self,parent_branch_id ):

        if not self.tryMoRDa:
            return ""

        if not self.seqpath:
            return ""

        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Automated Molecular Replacement (MoRDa)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Auto-MR",
                        "CCP4go Automated Structure Solver: Auto-MR with MoRDa",
                        self.morda_dir(),parent_branch_id )

        morda_xyz  = os.path.join ( self.morda_dir(),self.outputname + ".pdb" )
        morda_mtz  = os.path.join ( self.morda_dir(),self.outputname + ".mtz" )
        morda_map  = os.path.join ( self.morda_dir(),self.outputname + ".map" )
        morda_dmap = os.path.join ( self.morda_dir(),self.outputname + "_dmap.pdb" )

        self.flush()
        self.storeReportDocument (
            '{ "jobId"      : "' + self.jobId              + '",' +
            '  "reportTabId": "' + branch_data["pageId"]   + '",' +
            '  "logTabId"   : "' + branch_data["logTabId"] + '",' +
            '  "name_xyz"   : "' + morda_xyz               + '",' +
            '  "name_mtz"   : "' + morda_mtz               + '",' +
            '  "name_map"   : "' + morda_map               + '",' +
            '  "name_dmap"  : "' + morda_dmap              + '",' +
            '  "sge_q"      : "' + self.queueName          + '",' +
            '  "sge_tc"     : "' + str(self.nSubJobs)      + '",' +
            '  "subjobs"    : "subjobs" ' +
            '}'
        )

        # make command-line parameters for morda_sge.py
        cmd = [ "-m","morda",
                self.exeType,
                "-f",self.mtzpath,
                "-s",self.seqpath,
                "-d",self.rvapi_doc_path,
                "-a",
                "-n","1"
              ]

        #if self.task.parameters.sec1.contains.NMODELS.value:
        #    cmd = cmd + [ "-n",str(self.task.parameters.sec1.contains.NMODELS.value) ]

        # run morda

        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd )
        else:
            self.runApp ( "ccp4-python",cmd )

        self.restoreReportDocument()
        self.addCitations ( ['morda','molrep','refmac5'] )

        #  MoRDa puts final files in "output" directory, so update our paths
        morda_xyz  = os.path.join ( self.outputdir,morda_xyz )
        morda_mtz  = os.path.join ( self.outputdir,morda_mtz )
        morda_map  = os.path.join ( self.outputdir,morda_map )
        morda_dmap = os.path.join ( self.outputdir,morda_dmap )

        # check for solution
        nResults = 0
        rfree    = 1.0
        rfactor  = 1.0
        spg_info = None
        if os.path.isfile(morda_xyz):
            spg_info = self.checkSpaceGroup ( self.hkl.HM,morda_xyz )
            nResults = 1
            f = open ( os.path.join(self.outputdir,"morda.res") )
            flines = f.readlines()
            f.close()
            self.file_stdout.write ( " --------- morda\n" )
            for i in range(len(flines)):
                self.file_stdout.write ( flines[i]+"\n" )
            rfree   = float(flines[1])
            rfactor = float(flines[0])
        else:
            spg_info  = { "spg":self.hkl.HM, "hkl":"" }
            morda_xyz = ""

        columns = {
          "F"       : "FP",
          "SIGF"    : "SIGFP",
          "FREE"    : "FREE",
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        quit_message = self.saveResults ( "MoRDa",self.morda_dir(),nResults,
                rfree,rfactor,"morda", morda_xyz,morda_mtz,morda_map,morda_dmap,
                None,None,columns,spg_info )

        self.quit_branch ( branch_data,self.morda_dir(),
                           "Automated Molecular Replacement (MoRDa): " +
                           quit_message )

        return  branch_data["pageId"]
