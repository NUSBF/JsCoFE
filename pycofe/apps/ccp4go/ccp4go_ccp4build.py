##!/usr/bin/python

#
# ============================================================================
#
#    22.10.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver CCP4Build module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

import os
import sys
import json
import shutil

#  ccp4-python imports
#import pyrvapi

import edmap

import ccp4go_buccaneer

# ============================================================================

class CCP4Build(ccp4go_buccaneer.Buccaneer):

    # ----------------------------------------------------------------------

    def ccp4build ( self,datadir,resultdir,parent_branch_id ):

        #  Do not rebuild after EP with Crank-2 as Crank-2 does model building
        #  by itself
        if datadir.endswith(self.crank2_dir()) or not self.seqpath:
            return ""

        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Automated Model Building (CCP4Build)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Auto-Build",
                        "CCP4go Automated Structure Solver: Model " +
                        "Building with CCP4Build", resultdir,parent_branch_id )

        self.flush()

        #ccp4     = os.environ["CCP4"]
        meta     = self.output_meta["results"][datadir]
        spg_info = { "spg" : meta["spg"], "hkl" : "" }
        columns  = meta["columns"]
        #refpath  = os.path.join(ccp4,"lib","data","reference_structures","reference-1tqw")

        self.open_script  ( "ccp4build" )

        self.write_script ([
            "[input_data]",
            "seqpath          " + self.seqpath,
            "xyzpath_mr       " + meta["pdb"],
            "mtzpath          " + meta["mtz"],
            "labin_fo         /*/*/[" + columns["F"] + "," + columns["SIGF"] + "]",
            "labin_free       /*/*/[" + columns["FREE"] + "]",
            "cycles_min       2",
            "cycles_max       8",
            "noimprove_cycles 4",
            "dm_mode          auto",
            "fill_mode        auto",
            "fit_mode         auto",
            "rsr_mode         auto",
            "trim_mode        auto",
            " ",
            "[parrot]",
            "anisotropy-correction True",
            "solvent-content       " +\
                str(self.output_meta["results"][self.asu_dir()]["solvent"]/100.0),
            "cycles                3",
            " ",
            "[cbuccaneer]",
            "anisotropy-correction True",
            "build-semet           False"
        ])

        self.close_script()

        # Create working directory for easy job clean-up
        workdir = "ccp4build_workdir"
        if not os.path.exists(workdir):
            os.makedirs ( workdir )

        ccp4build_path = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "../ccp4build/ccp4build.py" ) )

        self.flush()
        self.storeReportDocument (
            '{ "jobId"         : "' + self.jobId              + '",' +\
            '  "page_id"       : "' + branch_data["pageId"]   + '",' +\
            '  "nameout"       : "ccp4build",' +\
            '  "prefix_rfree"  : "",' +\
            '  "prefix_edcc"   : "",' +\
            '  "prefix_nbuilt" : "",' +\
            '  "prefix_nfrag"  : ""'  +\
            '}'
        )

        # make command-line parameters for ccp4build.py
        cmd = [
            ccp4build_path    ,
            "--rdir"          , "report",  # should not matter as it comes from rvapi document
            "--wkdir"         , workdir,
            "--outdir"        , resultdir,
            "--srvlog"        , "_srv.log",
            "--rvapi-document", self.rvapi_doc_path
        ]

        # run ccp4build
        self.setGenericLogParser ( True )
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd )
        else:
            self.runApp ( "ccp4-python",cmd )
        self.unsetLogParser()

        meta_str = self.restoreReportDocument()
        if not meta_str:
            self.stdout ( "\n\n ***** ccp4build returned no meta\n\n" )
        else:
            try:
                meta = json.loads ( meta_str )
                if "programs_used" in meta:
                    self.addCitations ( meta["programs_used"] )
                else:
                    self.putMessage ( "<b>Program error:</b> <i>no program list in meta</i>" +
                                  "<p>'" + meta_str + "'" )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from CCP4Build</i>" +
                                  "<p>'" + meta_str + "'" )

        self.addCitations ( ['ccp4build'] )
        self.page_cursor[1] += 20

        ccp4build_xyz = ""   #  failed if remains like this
        quit_message  = "FAILED."
        nResults      = 0
        rfree         = 1.0
        rfactor       = 1.0

        self.stdout ( "meta=" + str(meta) )

        #meta={u'programs_used': [u'refmac5', u'cad', u'cbuccaneer', u'cparrot', u'fft', u'edstats', u'coot', u'uglymol', u'ccp4mg', u'viewhkl'],
        #      u'build_no': [2, 0, 3, 2],
        #      u'metrics': [{u'EDCC': 0.913, u'R_factor': 0.3227, u'R_free': 0.341, u'chain_compl': 96.9, u'res_compl': 100.0}, {u'EDCC': 0.916, u'R_factor': 0.3342, u'R_free': 0.3542, u'chain_compl': 86.6, u'res_compl': 92.3}, {u'EDCC': 0.899, u'R_factor': 0.3137, u'R_free': 0.3407, u'chain_compl': 97.9, u'res_compl': 94.1}, {u'EDCC': 0.913, u'R_factor': 0.3227, u'R_free': 0.341, u'chain_compl': 96.9, u'res_compl': 100.0}],
        #      u'titles': [u'min R<sub>free</sub>', u'max EDCC', u'max N<sub>res</sub>', u'min N<sub>frag</sub>'],
        #      u'outnames': [u'ccp4build_rfree', u'ccp4build_edcc', u'ccp4build_nbuilt', u'ccp4build_nfrag'],
        #      u'page': [8, 15, 22, 29, 4]}

        if meta:  # check for solution

            fname = meta["outnames"][1]  # best edcc
            ccp4build_xyz  = os.path.join ( resultdir,fname + ".pdb" )
            ccp4build_mtz  = os.path.join ( resultdir,fname + ".mtz" )
            ccp4build_map  = None #os.path.join ( resultdir,fname + ".map" )
            ccp4build_dmap = None #os.path.join ( resultdir,fname + ".diff.map" )

            if os.path.isfile(ccp4build_xyz):

                #edmap.calcCCP4Maps ( ccp4build_mtz,os.path.join(resultdir,"refine"),
                #            "./",self.file_stdout,self.file_stderr,"refmac",None )

                nResults = 1
                #rfree    = float(meta["refmac_edcc"]["R_free"])
                #rfactor  = float(meta["refmac_edcc"]["R_factor"])
                rfree    = float(meta["metrics"][1]["R_free"])
                rfactor  = float(meta["metrics"][1]["R_factor"])

                self.putMessage ( "<h2><i>Structure built with <i>R<sub>free</sub>=" +
                                  str(rfree) +"</i></h2>" )
                dfpath = "/".join ( ["..",self.outputdir,resultdir,"ccp4build"] )
                self.putStructureWidget ( "Structure and density map",
                                        [ dfpath+".pdb",dfpath+".mtz",dfpath+".map",
                                          dfpath+"_dmap.map" ],-1 )

                quit_message = "built with <i>R<sub>free</sub>=" + str(rfree) + "</i>"

            else:
                ccp4build_xyz = ""   #  failed


        ccp4build_columns = {
          "F"       : columns["F"],
          "SIGF"    : columns["SIGF"],
          "FREE"    : columns["FREE"],
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        self.saveResults ( "CCP4Build",resultdir,
            nResults,rfree,rfactor,"ccp4build", ccp4build_xyz,ccp4build_mtz,
            ccp4build_map,ccp4build_dmap,None,None,ccp4build_columns,
            spg_info )  # space group does not change after ccp4build

        self.quit_branch ( branch_data,resultdir,
                           "Automated Model Building (CCP4Build): " + quit_message )

        # cleanup
        shutil.rmtree ( workdir )

        return  branch_data["pageId"]
