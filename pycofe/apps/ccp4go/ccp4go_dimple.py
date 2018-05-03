##!/usr/bin/python

#
# ============================================================================
#
#    06.02.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver Dimple module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os

#  ccp4-python imports
#import pyrvapi

import edmap

import ccp4go_mtz

# ============================================================================

class Dimple(ccp4go_mtz.PrepareMTZ):

    # ----------------------------------------------------------------------

    def dimple ( self,datadir,resultdir,mode,parent_branch_id ):

        if mode=="mr" and not self.xyzpath:
            return ""

        if datadir and datadir.startswith("dimple"):
            self.file_stdout.write ( " *** repeat run of Dimple skipped\n" )
            return ""

        self.file_stdout.write ( " ... run dimple in " + mode + " mode\n" )
        self.file_stdout.write ( " ... datadir = " + str(datadir) + "\n" )

        #self.putMessage       ( "&nbsp;" )

        if mode=="mr":
            title = "Homologue MR"
        else:
            title = "Refinement"
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". " + title + " (Dimple)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( title,
                        "CCP4go Automated Structure Solver: " + title + " with Dimple",
                        resultdir,parent_branch_id )

        self.flush()
        self.storeReportDocument ( "" )

        # make command-line parameters for dimple
        spg_info = None
        if datadir:
            meta     = self.output_meta["results"][datadir]
            columns  = meta["columns"]
            spg      = meta["spg"]
            cmd      = [ meta["mtz"],meta["pdb"],resultdir,
                        "--fcolumn",columns["F"],"--sigfcolumn",columns["SIGF"],
                        "--free-r-flags","-","--freecolumn",columns["FREE"] ]
            if "lib" in meta:
                cmd += [ "--libin",meta["lib"] ]
        else:
            columns = {
              "F"       : self.hkl.Fmean.value,
              "SIGF"    : self.hkl.Fmean.sigma,
              "FREE"    : self.hkl.FREE,
              "PHI"     : "PHIC_ALL_LS",
              "FOM"     : "FOM",
              "DELFWT"  : "DELFWT",
              "PHDELWT" : "PHDELWT"
            }
            spg = self.hkl.HM
            cmd = [ self.mtzpath,self.xyzpath,resultdir,"--free-r-flags","-",
                    "--freecolumn",self.hkl.FREE ]
        cmd += [ "--slow","--slow" ]
        #cmd += [ "--free-r-flags","-" ]

        # run dimple
        self.runApp ( "dimple",cmd )

        self.restoreReportDocument()

        # check for solution
        nResults    = 0
        rfree       = 1.0
        rfactor     = 1.0
        dimple_xyz  = os.path.join ( resultdir,"final.pdb" )
        dimple_mtz  = os.path.join ( resultdir,"final.mtz" )
        dimple_map  = os.path.join ( resultdir,"final.map" )
        dimple_dmap = os.path.join ( resultdir,"final.diff.map" )
        spg_info    = None
        if os.path.isfile(dimple_xyz):

            spg_info = self.checkSpaceGroup ( spg,dimple_xyz )

            edmap.calcCCP4Maps ( dimple_mtz,os.path.join(resultdir,"final"),
                   "./",self.file_stdout,self.file_stderr,"refmac",None )

            nResults = 1
            self.mk_std_streams ( None )
            refmac_pattern = "refmac5 restr"
            with open(os.path.join(resultdir,self.file_stdout_path()),'r') as logf:
                for line in logf:
                    if line.find(refmac_pattern)>=0:
                        list    = filter ( None,line.replace("/"," ").split(" ") )
                        rfree   = float(list[len(list)-1])
                        rfactor = float(list[len(list)-2])

            self.putMessage ( "<h2><i>Solution found (<i>R<sub>free</sub>=" +
                              str(rfree) +"</i>)</h2>" )
            if spg_info:
                self.putMessage ( "<h3>Space group changed to " +
                                  spg_info["spg"] + "</h3>" )
            dfpath = os.path.join ( "..",self.outputdir,resultdir,"dimple" )
            self.putStructureWidget ( "Structure and density map",
                                    [ dfpath+".pdb",dfpath+".mtz",dfpath+".map",
                                      dfpath+"_dmap.map" ],-1 )

        else: # no solution
            spg_info   = { "spg":spg, "hkl":"" }
            dimple_xyz = ""

        quit_message = self.saveResults ( "Dimple",resultdir,nResults,
                rfree,rfactor,"dimple", dimple_xyz,dimple_mtz,dimple_map,dimple_dmap,
                None,None,columns,spg_info )

        if mode!="mr":
            quit_message = "refined to <i>R<sub>free</sub>=" + str(rfree) + "</i>"

        self.quit_branch ( branch_data,resultdir,
                           title + " (Dimple): " + quit_message )

        return  branch_data["pageId"]
