##!/usr/bin/python

#
# ============================================================================
#
#    09.04.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go Combined Auto-Solver Buccaneer module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

import os
import sys

#  ccp4-python imports
#import pyrvapi

import edmap

import ccp4go_crank2

# ============================================================================

class Buccaneer(ccp4go_crank2.Crank2):

    # ----------------------------------------------------------------------

    def buccaneer ( self,datadir,resultdir,parent_branch_id ):

        if datadir.endswith(self.crank2_dir()) or not self.seqpath:
            return ""

        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Automated Model Building (Buccaneer)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Auto-Build",
                        "CCP4go Automated Structure Solver: Model " +
                        "Building with Buccaneer", resultdir,parent_branch_id )

        self.flush()

        ccp4     = os.environ["CCP4"]
        meta     = self.output_meta["results"][datadir]
        spg_info = { "spg" : meta["spg"], "hkl" : "" }
        columns  = meta["columns"]
        refpath  = os.path.join(ccp4,"lib","data","reference_structures","reference-1tqw")

        self.open_script  ( "buccaneer" )
        self.write_script (
            "title Job "    + self.jobId.zfill(4) + "-"   +
                              str(self.stage_no).zfill(2) + "\n" +
            "pdbin-ref "    + refpath  + ".pdb\n" +
            "mtzin-ref "    + refpath  + ".mtz\n" +
            "colin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF\n" +
            "colin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D\n" +
            "seqin "        + self.seqpath    + "\n" +
            "mtzin "        + meta["mtz"]     + "\n" +
            "colin-fo "     + columns["F"]    + ","  + columns["SIGF"] + "\n" +
            "colin-free "   + columns["FREE"] + "\n" +
            "colin-phifom " + columns["PHI"]  + ","  + columns["FOM"]  + "\n" +
            "pdbout " + os.path.join(resultdir,"buccaneer.pdb") + "\n" +
            "cycles 10\n" +
            "buccaneer-anisotropy-correction\n" +
            "buccaneer-build-semet\n" +
            "buccaneer-fast\n" +
            "buccaneer-1st-cycles 3\n" +
            "buccaneer-1st-sequence-reliability 0.95\n" +
            "buccaneer-nth-cycles 2\n" +
            "buccaneer-nth-sequence-reliability 0.95\n" +
            "buccaneer-nth-correlation-mode\n" +
            "buccaneer-resolution 2\n" +
            "buccaneer-new-residue-name UNK\n" +
            "buccaneer-keyword mr-model-filter-sigma 3\n" +
            "jobs 2\n"  +
            "pdbin-mr " + meta["pdb"] + "\n" +
            "prefix ./" + resultdir + "/\n"
        )
        self.close_script()

        # make command-line parameters for buccaneer_sge.py
        cmd = [ "-u",os.path.join(ccp4,"bin","buccaneer_pipeline"),"-stdin" ]

        # run buccaneer
        self.setGenericLogParser ( True )
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd )
        else:
            self.runApp ( "ccp4-python",cmd )
        self.unsetLogParser()
        self.addCitations ( ['buccaneer','refmac5'] )

        # check for solution
        nResults       = 0
        rfree          = 1.0
        rfactor        = 1.0
        quit_message   = ""
        buccaneer_xyz  = os.path.join ( resultdir,"refine.pdb" )
        buccaneer_mtz  = os.path.join ( resultdir,"refine.mtz" )
        buccaneer_map  = None  #os.path.join ( resultdir,"refine.map" )
        buccaneer_dmap = None  #os.path.join ( resultdir,"refine.diff.map" )
        if os.path.isfile(buccaneer_xyz):

            #edmap.calcCCP4Maps ( buccaneer_mtz,os.path.join(resultdir,"refine"),
            #            "./",self.file_stdout,self.file_stderr,"refmac",None )

            nResults = 1
            self.mk_std_streams ( None )
            rfree_pattern   = "             R free"
            rfactor_pattern = "           R factor"
            with open(os.path.join(resultdir,self.file_stdout_path()),'r') as logf:
                for line in logf:
                    if line.find(rfree_pattern)>=0:
                        list    = filter ( None,line.split() )
                        rfree   = float(list[len(list)-1])
                    elif line.find(rfactor_pattern)>=0:
                        list    = filter ( None,line.split() )
                        rfactor = float(list[len(list)-1])

            self.putMessage ( "<h2><i>Structure built with <i>R<sub>free</sub>=" +
                              str(rfree) +"</i></h2>" )
            dfpath = "/".join ( ["..",self.outputdir,resultdir,"buccaneer"] )
            self.putStructureWidget ( "Structure and density map",
                                    [ dfpath+".pdb",dfpath+".mtz",dfpath+".map",
                                      dfpath+"_dmap.map" ],-1 )

            quit_message = "built with <i>R<sub>free</sub>=" + str(rfree) + "</i>"

        else:
            buccaneer_xyz = ""
            quit_message  = "FAILED."

        buccaneer_columns = {
          "F"       : columns["F"],
          "SIGF"    : columns["SIGF"],
          "FREE"    : columns["FREE"],
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        self.saveResults ( "Buccanneer",resultdir,
            nResults,rfree,rfactor,"buccaneer", buccaneer_xyz,buccaneer_mtz,
            buccaneer_map,buccaneer_dmap,None,None,buccaneer_columns,
            spg_info )  # space group does not change after buccaneer

        self.quit_branch ( branch_data,resultdir,
                           "Automated Model Building (Buccaneer): " + quit_message )

        return  branch_data["pageId"]
