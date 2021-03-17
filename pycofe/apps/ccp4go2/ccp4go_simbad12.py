#!/usr/bin/env ccp4-python

#
# ============================================================================
#
#    03.02.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go Combined Auto-Solver Simbad stages 1 (L) and 2 (C) class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2017-2021
#
# ============================================================================
#

import os
import sys
import json

#  ccp4-python imports
#import pyrvapi

import ccp4go_base
import asucomp

# ============================================================================

class Simbad12(ccp4go_base.Base):
    parent_branch_id = None

    def simbad12_dir(self): return os.path.join(self.currentData.startingParameters.workdir, "simbad12_results")

    def set_parent_branch_id(self, parent_branch_id):
        self.parent_branch_id = parent_branch_id

    # ----------------------------------------------------------------------

    def get_rfactors ( self,dirpath,filename ):
        if os.path.isdir(dirpath):
            filepath = os.path.join ( dirpath,filename )
            if os.path.isfile(filepath):
                f = open ( filepath,"r" )
                lines = f.readlines()
                f.close()
                if len(lines)>=2:
                    return [float(lines[1].strip().split(",")[4]),
                            float(lines[1].strip().split(",")[5])]
        return [1.0,1.0]

    # ----------------------------------------------------------------------

    def run (self):

        self.stdout ( "Simbad Lattice and Contaminants search... " )
        self.flush()
        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Lattice and Contaminant Searches</b>" )
        self.page_cursor[1] -= 1

        if not os.path.isdir(self.simbad12_dir()):
            os.mkdir ( self.simbad12_dir() )

        self.branch_data = self.start_branch ( "SIMBAD Database Searches",
                        "CCP4go Automated Structure Solver: Lattice and " +
                        "Contaminant Searches",
                        self.simbad12_dir(),self.parent_branch_id,"summary_tab" )


        simbad_meta = self.runSimbad()
        quit_message = self.collectRunStatistics(simbad_meta)

        self.stdout (self.cleanhtml(quit_message) + '\n', mainLog=True)
        self.flush()

        self.quit_branch ( self.branch_data, self.simbad12_dir(),
                           "Lattice and Contaminant Searches (Simbad): " +
                           quit_message )

        #return  self.branch_data["pageId"]
        return


    def runSimbad(self):

        # store document before making command line, because document name
        # can be changed by the framework
        self.storeReportDocument (self.simbad12_dir(), self.branch_data["logTabId"] )
        self.flush()

        # actually running simbad
        cmd = []
        if "TMPDIR" in os.environ:
            cmd = ["-tmp_dir", os.environ["TMPDIR"]]
        if "PDB_DIR" in os.environ:
            cmd += ["-pdb_db", os.environ["PDB_DIR"]]

        cmd += ["-nproc", str(int(self.currentData.startingParameters.nSubJobs) + 1),
                "-max_lattice_results", "5",
                "-max_penalty_score", "4",
                "-F", self.currentData.hkl.Fmean.value,
                "-SIGF", self.currentData.hkl.Fmean.sigma,
                "-FREE", self.currentData.hkl.FREE,
                "--display_gui",
                "--cleanup",
                "-webserver_uri", "jsrview",
                "-work_dir", '.'+ os.sep,
                "-rvapi_document", self.currentData.startingParameters.rvapi_doc_path,
                self.currentData.mtzpath
                ]

        if sys.platform.startswith("win"):
            self.runApp("simbad.bat", cmd)
        else:
            self.runApp("simbad", cmd)

        # after run, getiing info from the RVAPI meta data
        self.setOutputPage (self.branch_data["cursor1"])
        rvapi_meta = self.restoreReportDocument()
        simbad_meta = None

        if rvapi_meta:
            try:
                simbad_meta = json.loads ( rvapi_meta )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from Simbad</i>" +
                                  "<p>'" + rvapi_meta + "'" )
                self.page_cursor[1] -= 1
                self.stderr(" *** Program error: unparseable metadata from Simbad.\n", mainLog=True)
                self.output_meta["error"] = "[03-001] cant parse SIMBAD data"
                self.write_meta()
                self.end_branch(self.branch_data, self.simbad12_dir(),
                                "Program error: unparseable metadata from Simbad",
                                "cant parse SIMBAD data")

        else:
            self.putMessage ( "<b>Program error:</b> <i>no metadata from Simbad</i>" )
            self.page_cursor[1] -= 1
            self.stderr(" *** Program error: no metadata from Simbad.\n", mainLog=True)
            self.output_meta["error"] = "[03-002] no metadata from Simbad"
            self.write_meta()
            self.end_branch(self.branch_data, self.simbad12_dir(),
                            "Program error: no metadata from Simbad",
                            "no metadata from Simbad")

        return simbad_meta


    def collectRunStatistics(self, simbad_meta):
        (rWorkLattice, rFreeLattice) = self.get_rfactors ( os.path.join(self.simbad12_dir(), "latt"),"lattice_mr.csv" )
        (rWorkContaminant, rFreeContaminant) = self.get_rfactors ( os.path.join(self.simbad12_dir(), "cont"),"cont_mr.csv" )
        if rFreeLattice <= rFreeContaminant:
            rfree = rFreeLattice
            rfactor = rWorkLattice
        else:
            rfree = rFreeContaminant
            rfactor = rWorkContaminant

        nResults   = 0
        resultName = "xxxx"
        fpath_xyz  = ""
        fpath_mtz  = ""
        asuComp    = {}
        spg_info   = { "spg":self.currentData.hkl.HM, "hkl":"" }
        if simbad_meta:
            nResults = simbad_meta["nResults"]
            meta     = simbad_meta["results"][0]
            #self.file_stdout.write ( json.dumps ( meta,indent=2 ))
            resultName = meta["name"]
            if nResults>0:
                # IMPORTANT!!! HOT POINT!!!
                # Potential source of problems - relative path to the output PDB file
                # must be correct!

                # print (str(simbad_meta))
                # print self.currentData.startingParameters.rvapi_doc_path
                # print
                # print os.path.dirname(self.currentData.startingParameters.rvapi_doc_path)
                # print meta["pdb"][3:]

                fpath_xyz  = os.path.join(os.path.dirname(self.currentData.startingParameters.rvapi_doc_path), meta["pdb"][3:])
                if os.path.isfile(fpath_xyz):
                    # IMPORTANT!!! HOT POINT!!!
                    # Potential source of problems - relative path to the output MTZ file
                    # must be correct!
                    fpath_mtz  = os.path.join(os.path.dirname(self.currentData.startingParameters.rvapi_doc_path), meta["mtz"][3:])
                    asuComp    = asucomp.getASUComp1 ( fpath_xyz, self.currentData.startingParameters.seqpath )
                    spg_info   = self.reindexHKLifSpaceGroupChanged (self.currentData.hkl.HM, fpath_xyz)
                else:
                    nResults   = 0
                    fpath_xyz  = ""
        else:
            nResults = -1  # indication of an error

        columns = {
          "F"       : self.currentData.hkl.Fmean.value,
          "SIGF"    : self.currentData.hkl.Fmean.sigma,
          "FREE"    : self.currentData.hkl.FREE,
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        quit_message = self.saveResults ( name = "Simbad-LC [" + resultName + "]",
                                          dirname = self.simbad12_dir(),
                                          nResults = nResults,
                                          rfree = rfree,
                                          rfactor = rfactor,
                                          resfname = "simbad_"+resultName,
                                          fpath_xyz = fpath_xyz,
                                          fpath_mtz = fpath_mtz,
                                          columns = columns,
                                          spg_info = spg_info )

        self.output_meta["results"][self.simbad12_dir()]["pdbcode"] = resultName
        self.output_meta["results"][self.simbad12_dir()]["asucomp"] = asuComp

        # print (str(asuComp))
        # if self.output_meta["retcode"] != "not solved" and self.currentData.startingParameters.seqpath:
        #     if asuComp["retcode"] == 1:
        #         self.output_meta["error"] = "ASU checking: sequence problem"
        #         self.putMessage("<h3><i>---- Sequence data does not match " +
        #                         "solution (too many sequences given). SIMBAD could not find solution.</i></h3>")
        #         self.stderr('Sequence data does not match solution (too many sequences given). ' +
        #                     'SIMBAD could not find solution', mainLog=True)
        #     elif asuComp["minseqid"]<0.7:
        #         self.output_meta["error"] = "ASU checking: sequence mismatch"
        #         self.putMessage("<h3><i>---- Sequence data does not match " +
        #                         "solution (too low homology). SIMBAD could not find solution.</i></h3>")
        #         self.stderr('Sequence data does not match solution (too low homology). ' +
        #                     'SIMBAD could not find solution.', mainLog=True)

        return quit_message
