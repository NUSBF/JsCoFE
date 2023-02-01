##!/usr/bin/python

#
# ============================================================================
#
#    21.01.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Coot class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2022
#
# ============================================================================
#
#

import sys
import os

import gemmi

import ccp4build_coot

# ============================================================================

class FindWaters(ccp4build_coot.Coot):

    # ----------------------------------------------------------------------

    # parrot options
    findwaters_options = {
        "sigma"              : 2.0,
        "flood"              : False,
        "flood_atom_radius"  : 1.4
    }

    # ----------------------------------------------------------------------

    def readFindWatersOptions ( self ):
        self.findwaters_options = self.readPGMOptions ( "findwaters",self.findwaters_options )
        return

    # ----------------------------------------------------------------------

    def mergeLigands ( self, mmFile, ligFiles, chainId, outFile ):
        st    = gemmi.read_structure ( mmFile )
        nligs = 0
        chain = st[0].find_last_chain(chainId) or st[0].add_chain(chainId)
        for lf in ligFiles:
            lig = gemmi.read_structure ( lf )
            lig.setup_entities()
            for lig_chain in lig[0]:
                residues = list ( lig_chain )
                chain.append_residues ( residues, min_sep=1 )
                nligs += len(residues)
        st.write_pdb ( outFile )
        return nligs

    # ----------------------------------------------------------------------

    def findwaters (  self,
                      meta,   # meta dictionary
                      nameout = "findwaters"
                   ):

        labin_dfc = self.getLabels ( meta["labin_dfc"] )
        watout    = os.path.join  ( self.workdir,nameout+"_waters.pdb" )

        cmd = [ "--pdbin" , meta["xyzpath"],
                "--hklin" , meta["mtzpath"],
                "--pdbout", watout,
                "--f"     , labin_dfc[0],
                "--phi"   , labin_dfc[1],
                "--sigma" , str(self.findwaters_options["sigma"])
              ]

        if self.findwaters_options["flood"]:
            cmd += [ "--flood","--flood-atom-radius",
                     str(self.findwaters_options["flood_atom_radius"]) ]

        # Start findwaters
        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        if sys.platform.startswith("win"):
            self.runApp ( "findwaters.bat",cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stdout_fpath )
        else:
            findwaters_path = os.path.join ( os.environ["CCP4"],"bin","findwaters" )
            if not os.path.isfile(findwaters_path):
                findwaters_path = os.path.join ( os.environ["CCP4"],"libexec","findwaters-bin" )
            self.runApp ( findwaters_path,
                          cmd,fpath_stdout=stdout_fpath,fpath_stderr=stdout_fpath )

        xyzout   = os.path.join  ( self.workdir,nameout+".pdb" )
        nwaters  = self.mergeLigands ( meta["xyzpath"],[watout],"W",xyzout )

        out_meta = meta.copy()
        out_meta["xyzpath"] = xyzout

        return out_meta
