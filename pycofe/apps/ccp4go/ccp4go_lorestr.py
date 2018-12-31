##!/usr/bin/python

#
# ============================================================================
#
#    04.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver Lorestr module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
import sys

#  ccp4-python imports
#import pyrvapi

import edmap
import ccp4go_buccaneer

# ============================================================================

class Lorestr(ccp4go_buccaneer.Buccaneer):

    # ----------------------------------------------------------------------

    def lorestr ( self,datadir,resultdir,parent_branch_id ):

        # do not refine after crank2?
        if datadir.endswith(self.crank2_dir()):
            return ""

        #self.putMessage       ( "&nbsp;" )
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Refinement (Lorestr)</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( "Refinement",
                        "CCP4go Automated Structure Solver: Refinement " +
                        "with Lorestr", resultdir,parent_branch_id )
        self.flush()

        # prepare data
        meta     = self.output_meta["results"][datadir]
        columns  = meta["columns"]
        spg_info = { "spg":meta["spg"], "hkl":"" }

        lorestr_xyz  = os.path.join ( resultdir,"lorestr.pdb" )
        lorestr_mtz  = os.path.join ( resultdir,"lorestr.mtz" )
        lorestr_map  = os.path.join ( resultdir,"lorestr.map" )
        lorestr_dmap = os.path.join ( resultdir,"lorestr.diff.map" )
        lorestr_xml  = os.path.join ( resultdir,"lorestr.xml" )

        lorestr_lib  = None
        libIndex     = None
        if "lib" in meta:
            lorestr_lib = meta["lib"]
        if "libindex" in meta:
            libIndex = meta["libindex"]

        cmd = [ "-p1",meta["pdb"],
                "-f" ,meta["mtz"],
                "-save_space",
                "-xyzout",lorestr_xyz,
                "-hklout",lorestr_mtz,
                "-labin" ,"FP="     + columns["F"]    +
                          " SIGFP=" + columns["SIGF"] +
                          " FREE="  + columns["FREE"],
                #"-auto"
                "-xml",lorestr_xml
              ]

        """
        if self.getParameter(self.task.parameters.sec1.contains.PDB_CBX)=="True":
            cmd += [ "-auto" ]

        minres = self.getParameter(self.task.parameters.sec1.contains.MINRES)
        if minres:
            cmd += [ "-minres",minres ]

        if self.getParameter(self.task.parameters.sec1.contains.DNA_CBX)=="True":
            cmd += [ "-dna" ]

        if self.getParameter(self.task.parameters.sec1.contains.MR_CBX)=="True":
            cmd += [ "-mr" ]
        """

        #cmd += ["-xml","lorestr.xml"]

        # Start lorestr
        self.setGenericLogParser ( True )
        if sys.platform.startswith("win"):
            self.runApp ( "lorestr.bat",cmd )
        else:
            self.runApp ( "lorestr",cmd )
        self.unsetLogParser()

        # check solution and register data
        nResults     = 0
        rfree        = 1.0
        rfactor      = 1.0
        quit_message = ""
        if os.path.isfile(lorestr_xyz):

            edmap.calcCCP4Maps ( lorestr_mtz,os.path.join(resultdir,"lorestr"),
                        "./",self.file_stdout,self.file_stderr,"refmac",None )

            nResults = 1
            self.mk_std_streams ( None )
            rfree_pattern   = "Rfree (before/after):"
            rfactor_pattern = "Rfact (before/after):"
            with open(os.path.join(resultdir,self.file_stdout_path()),'r') as logf:
                for line in logf:
                    if line.find(rfree_pattern)>=0:
                        list    = filter ( None,line.split() )
                        rfree   = float(list[len(list)-1])
                    elif line.find(rfactor_pattern)>=0:
                        list    = filter ( None,line.split() )
                        rfactor = float(list[len(list)-1])

            self.putMessage ( "<h2><i>Refined solution</i></h2>" )
            dfpath = "/".join ( ["..",self.outputdir,resultdir,"lorestr"] )
            self.putStructureWidget ( "Structure and density map",
                                    [ dfpath+".pdb",dfpath+".mtz",dfpath+".map",
                                      dfpath+"_dmap.map" ],-1 )

            quit_message = "refined to <i>R<sub>free</sub>=" + str(rfree) + "</i>"

        else:
            lorestr_xyz  = ""
            quit_message = "FAILED."

        lorestr_columns = {
          "F"       : columns["F"],
          "SIGF"    : columns["SIGF"],
          "FREE"    : columns["FREE"],
          "PHI"     : "PHIC_ALL_LS",
          "FOM"     : "FOM",
          "DELFWT"  : "DELFWT",
          "PHDELWT" : "PHDELWT"
        }

        self.saveResults ( "Lorestr",resultdir,nResults,
            rfree,rfactor,"lorestr", lorestr_xyz,lorestr_mtz,lorestr_map,lorestr_dmap,
            lorestr_lib,libIndex,lorestr_columns,spg_info ) # no space group change

        self.quit_branch ( branch_data,resultdir,
                           "Refinement (Lorestr): " + quit_message )

        return  branch_data["pageId"]
