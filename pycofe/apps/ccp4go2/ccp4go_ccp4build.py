##!/usr/bin/python

#
# ============================================================================
#
#    17.03.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go Combined Auto-Solver CCP4Build module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2017-2021
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

import ccp4go_base


# ============================================================================

class CCP4Build(ccp4go_base.Base):
    parent_branch_id = None

    def ccp4build_dir(self): return os.path.join(self.currentData.startingParameters.workdir, "ccp4build_results")

    def set_parent_branch_id(self, parent_branch_id):
        self.parent_branch_id = parent_branch_id


    # ----------------------------------------------------------------------

    def run ( self ):
        self.stdout ( "Automated Model Building (CCP4Build)... " )
        self.flush()

        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Automated Model Building (CCP4Build)</b>" )
        self.page_cursor[1] -= 1

        self.branch_data = self.start_branch ( "Auto-Build",
                        "CCP4go Automated Structure Solver: Model " +
                        "Building with CCP4Build", self.ccp4build_dir(), self.parent_branch_id )

        self.flush()

        # Create working directory for easy job clean-up
        self.tempdir = "ccp4build_workdir"
        if not os.path.exists(self.tempdir):
            os.makedirs ( self.tempdir )

        ccp4build_meta = self.runCCP4build()
        quit_message = self.collectRunStatistics(ccp4build_meta)

        self.stdout (self.cleanhtml(quit_message) + '\n', mainLog=True)
        self.flush()

        self.quit_branch ( self.branch_data,self.ccp4build_dir(),
                           "Automated Model Building (CCP4Build): " + quit_message )

        # cleanup
        if os.path.isdir(self.tempdir):
            shutil.rmtree ( self.tempdir )

        # return  self.branch_data["pageId"]
        return


    def runCCP4build(self):
        (datadir, meta)     = self.getResultsWithMinimalRfree()
        spg_info = { "spg" : meta["spg"], "hkl" : "" }
        columns  = meta["columns"]

        self.open_script  ( "ccp4build" )

        self.write_script ([
            "[input_data]",
            "seqpath          " + self.currentData.startingParameters.seqpath,
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
                str(self.output_meta["results"][self.currentData.asu_dir]["solvent"]/100.0),
            "cycles                3",
            " ",
            "[cbuccaneer]",
            "anisotropy-correction True",
            "build-semet           False"
        ])

        self.close_script()


        ccp4build_path = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "../ccp4build/ccp4build.py" ) )

        self.flush()
        self.storeReportDocument (self.ccp4build_dir(),
            '{ "jobId"         : "' +  'self.jobId'              + '",' +\
            #'  "page_id"       : "' + self.branch_data["pageId"]    + '",' +\
            '  "page_id"       : "' + self.branch_data["cursor1"][0]      + '",' +\
            '  "rvrow"         : '  + str(self.branch_data["cursor1"][1]) + ','  +\
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
            "--wkdir"         , self.tempdir,
            "--outdir"        , self.ccp4build_dir(),
            "--srvlog"        , "_srv.log",
            "--rvapi-document", self.currentData.startingParameters.rvapi_doc_path
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
    
        return meta


    def collectRunStatistics(self, meta):

        ccp4build_xyz = ""   #  task failed if not filled with the actual file name from meta
        ccp4build_mtz = ""
        ccp4build_map = ""
        ccp4build_dmap = ""

        (d, m) = self.getResultsWithMinimalRfree()
        spg_info = {"spg": m["spg"], "hkl": ""}
        columns = m["columns"]
        ccp4build_columns = {
            "F": columns["F"],
            "SIGF": columns["SIGF"],
            "FREE": columns["FREE"],
            "PHI": "PHIC_ALL_LS",
            "FOM": "FOM",
            "DELFWT": "DELFWT",
            "PHDELWT": "PHDELWT"
        }

        quit_message  = "FAILED."
        nResults      = 0
        rfree         = 1.0
        rfactor       = 1.0

        #meta={u'programs_used': [u'refmac5', u'cad', u'cbuccaneer', u'cparrot', u'fft', u'edstats', u'coot', u'uglymol', u'ccp4mg', u'viewhkl'],
        #      u'build_no': [2, 0, 3, 2],
        #      u'metrics': [{u'EDCC': 0.913, u'R_factor': 0.3227, u'R_free': 0.341, u'chain_compl': 96.9, u'res_compl': 100.0}, {u'EDCC': 0.916, u'R_factor': 0.3342, u'R_free': 0.3542, u'chain_compl': 86.6, u'res_compl': 92.3}, {u'EDCC': 0.899, u'R_factor': 0.3137, u'R_free': 0.3407, u'chain_compl': 97.9, u'res_compl': 94.1}, {u'EDCC': 0.913, u'R_factor': 0.3227, u'R_free': 0.341, u'chain_compl': 96.9, u'res_compl': 100.0}],
        #      u'titles': [u'min R<sub>free</sub>', u'max EDCC', u'max N<sub>res</sub>', u'min N<sub>frag</sub>'],
        #      u'outnames': [u'ccp4build_rfree', u'ccp4build_edcc', u'ccp4build_nbuilt', u'ccp4build_nfrag'],
        #      u'page': [8, 15, 22, 29, 4]}

        if meta:  # check for solution
            fname = meta["outnames"][1]  # best edcc
            ccp4build_xyz  = os.path.join ( self.ccp4build_dir(),fname + ".pdb" )
            ccp4build_mtz  = os.path.join ( self.ccp4build_dir(),fname + ".mtz" )
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
                dfpath = "/".join ( ["..",self.currentData.startingParameters.outputdir,self.ccp4build_dir(),"ccp4build"] )
                self.putStructureWidget ( "Structure and density map",
                                        [ dfpath+".pdb",dfpath+".mtz",dfpath+".map",
                                          dfpath+"_dmap.map" ],-1 )

                quit_message = "built with <i>R<sub>free</sub>=" + str(rfree) + "</i>"

            else:
                ccp4build_xyz = ""   #  failed



        quit_message = self.saveResults ( "CCP4Build",
                                          self.ccp4build_dir(),
                                          nResults,
                                          rfree,
                                          rfactor,
                                          "ccp4build",
                                          ccp4build_xyz,
                                          ccp4build_mtz,
                                          ccp4build_map,
                                          ccp4build_dmap,
                                          None,
                                          None,
                                          ccp4build_columns,
                                          spg_info )  # space group does not change after ccp4build

        return quit_message