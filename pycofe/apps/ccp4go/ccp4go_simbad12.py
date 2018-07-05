##!/usr/bin/python

#
# ============================================================================
#
#    10.02.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver Simbad stages 1 (L) and 2 (C) class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import json
#import shutil

#  ccp4-python imports
#import pyrvapi

import ccp4go_dimple
import asucomp

# ============================================================================

class Simbad12(ccp4go_dimple.Dimple):

    def simbad12_dir(self): return "simbad12_results"

    # ----------------------------------------------------------------------

    def get_rfactors ( self,dirpath,filename ):
        if os.path.isdir(dirpath):
            filepath = os.path.join ( dirpath,filename )
            if os.path.isfile(filepath):
                f = open ( filepath,"r" )
                lines = f.readlines()
                f.close()
                if len(lines)>=2:
                    return [float(lines[1].strip().split(",")[3]),
                            float(lines[1].strip().split(",")[4])]
        return [10.0,10.0]

    # ----------------------------------------------------------------------

    def simbad12 ( self,parent_branch_id ):

        if not self.trySimbad12:
            self.file_stdout.write ( "\n *** use of Simbad-LC is switched off\n" )
            return ""

        self.file_stdout.write ( "\n ... run Simbad-LC\n" )
        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Lattice and Contaminant Searches</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "DB Searches",
                        "CCP4go Automated Structure Solver: Lattice and " +
                        "Contaminant Searches",
                        self.simbad12_dir(),parent_branch_id,"summary_tab" )

        # store document before making command line, because document name
        # can be changed by the framework
        self.storeReportDocument ( branch_data["logTabId"] )
        self.flush()

        # Prepare simbad input -- script file

        cmd = []
        if "TMPDIR" in os.environ:
            cmd  = [ "-tmp_dir",os.environ["TMPDIR"] ]
        if "PDB_DIR" in os.environ:
            cmd += [ "-pdb_db",os.environ["PDB_DIR"] ]

        cmd += [ "-nproc"              ,str(int(self.nSubJobs) + 1),
                 "-max_lattice_results","5",
                 "-max_penalty_score"  ,"4",
                 "-F"                  ,self.hkl.Fmean.value,
                 "-SIGF"               ,self.hkl.Fmean.sigma,
                 "-FREE"               ,self.hkl.FREE,
                 "--display_gui"       ,
                 "--cleanup"           ,
                 "-webserver_uri"      ,"jsrview",
                 "-work_dir"           ,"./",
                 "-rvapi_document"     ,self.rvapi_doc_path,
                 self.mtzpath
               ]

        # run simbad
        self.runApp ( "simbad",cmd )
        self.setOutputPage ( branch_data["cursor1"] )
        rvapi_meta = self.restoreReportDocument()

        """
        { "nResults": 1,
          "results": [
            { "mtz": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refinement_output.mtz",
              "source": "latt",
              "dmap": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refmac_fofcwt.map",
              "best": true,
              "map": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refmac_2fofcwt.map",
              "pdb": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refinement_output.pdb",
              "rank": 1,
              "name": "1DTX"
             }
          ]
        }
        """

        simbad_meta = None
        if rvapi_meta:
            try:
                simbad_meta = json.loads ( rvapi_meta )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from Simbad</i>" +
                                  "<p>'" + rvapi_meta + "'" )
                self.page_cursor[1] -= 1
        else:
            self.putMessage ( "<b>Program error:</b> <i>no metadata from Simbad</i>" )
            self.page_cursor[1] -= 1

        r1 = self.get_rfactors ( "latt","lattice_mr.csv" )
        r2 = self.get_rfactors ( "cont","cont_mr.csv" )
        rfree   = r1[1]
        rfactor = r1[0]
        if r2[1]<rfree:
            rfree   = r2[1]
            rfactor = r2[0]

        fpath_xyz  = ""
        fpath_mtz  = ""
        fpath_map  = ""
        fpath_dmap = ""
        asuComp    = {}
        spg_info   = { "spg":self.hkl.HM, "hkl":"" }
        if simbad_meta:
            nResults   = simbad_meta["nResults"]
            meta       = simbad_meta["results"][0]
            if nResults>0:
                fpath_xyz  = os.path.join(self.reportdir,meta["pdb"])
                fpath_mtz  = os.path.join(self.reportdir,meta["mtz"])
                fpath_map  = os.path.join(self.reportdir,meta["map"])
                fpath_dmap = os.path.join(self.reportdir,meta["dmap"])
                asuComp    = asucomp.getASUComp1 ( fpath_xyz,self.seqpath )
                self.file_stdout.write ( json.dumps ( asuComp,indent=2 ))
                spg_info   = self.checkSpaceGroup ( self.hkl.HM,fpath_xyz )
        else:
            nResults = -1  # indication of an error

        columns = {
          "F"       : self.hkl.Fmean.value,
          "SIGF"    : self.hkl.Fmean.sigma,
          "FREE"    : self.hkl.FREE,
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        quit_message = self.saveResults ( "Simbad-LC ["+meta["name"]+"]",
                self.simbad12_dir(),nResults,rfree,rfactor,
                "simbad_"+meta["name"],fpath_xyz,fpath_mtz,fpath_map,fpath_dmap,
                None,None,columns,spg_info )

        self.output_meta["results"][self.simbad12_dir()]["pdbcode"] = meta["name"]
        self.output_meta["results"][self.simbad12_dir()]["asucomp"] = asuComp
        """
        if self.output_meta["retcode"] != "not solved" and self.seqpath:
            if asuComp["retcode"] == 1:
                self.output_meta["retcode"] = "sequence problem"
            elif asuComp["minseqid"]<0.7:
                self.output_meta["retcode"] = "sequence mismatch"
        """

        self.quit_branch ( branch_data,self.simbad12_dir(),
                           "Lattice and Contaminant Searches (Simbad): " +
                           quit_message )

        return  branch_data["pageId"]
