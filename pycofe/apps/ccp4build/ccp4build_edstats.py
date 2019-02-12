##!/usr/bin/python

#
# ============================================================================
#
#    08.02.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Coot class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#
#

import os
import sys
import uuid

import ccp4build_coot

# ============================================================================

class EDStats(ccp4build_coot.Coot):

    # ----------------------------------------------------------------------

    def edstats (  self,
                   meta,   # meta dictionary
                   nameout="edstats"
                ):

        stdout_fpath = self.getStdOutPath ( nameout+"_prep" )
        stderr_fpath = self.getStdErrPath ( nameout+"_prep" )

        #  fix mtz (possibly redundant but recommended)

        labin_f   = self.getLabel ( meta["labin_fo"],0 )
        fixed_mtz = os.path.join ( self.workdir,"_fixed.mtz" )
        self.runApp ( "mtzfix",[
                            "FLABEL",labin_f,
                            "HKLIN" ,meta["mtzpath"],
                            "HKLOUT",fixed_mtz
                      ],fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )


        # calculate 2mfo-dfc map assuming refmac's mtz on input

        fo_map = os.path.join ( self.workdir,"fo.map" )

        self.open_script ( "fft_fo" )
        self.write_script ([
            "TITLE Sigmaa style 2mfo-dfc map calculated with refmac coefficients",
            "LABI  F1=FWT PHI=PHWT",
            "RESO  " + self.input_data["res_high"] + " " + self.input_data["res_low"],
            "XYZL  ASU",
            "GRID  SAMP 4.5",
            "END"
        ])
        self.close_script()

        #stdout_fpath = self.getStdOutPath ( nameout+"_fft_fo" )
        #stderr_fpath = self.getStdErrPath ( nameout+"_fft_fo" )

        self.runApp ( "fft",[
                            "HKLIN" ,fixed_mtz,
                            "MAPOUT",fo_map
                      ],fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        # calculate mfo-dfc difference map assuming refmac's mtz on input

        df_map = os.path.join ( self.workdir,"df.map" )

        self.open_script ( "fft_df" )
        self.write_script ([
            "TITLE Sigmaa style mfo-dfc map calculated with refmac coefficients",
            "LABI  F1=DELFWT PHI=PHDELWT",
            "RESO  " + self.input_data["res_high"] + " " + self.input_data["res_low"],
            "XYZL  ASU",
            "GRID  SAMP 4.5",
            "END"
        ])
        self.close_script()

        #stdout_fpath = self.getStdOutPath ( nameout+"_fft_df" )
        #stderr_fpath = self.getStdErrPath ( nameout+"_fft_df" )

        self.runApp ( "fft",[
                            "HKLIN" ,fixed_mtz,
                            "MAPOUT",df_map
                      ],fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )


        #  run edstats

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )

        self.open_script ( "edstats" )
        self.write_script ([
            "resl=" + self.input_data["res_low"],
            "resh=" + self.input_data["res_high"],
            "main=resi",
            "side=resi",
        ])
        self.close_script()

        edstats_pdb = os.path.join ( self.workdir,nameout + ".pdb" )
        edstats_out = os.path.join ( self.workdir,nameout + ".out" )

        self.runApp ( "edstats",[
                            "XYZIN" ,meta["xyzpath"],
                            "MAPIN1",fo_map,
                            "MAPIN2",df_map,
                            "XYZOUT",edstats_pdb,
                            "OUT"   ,edstats_out
                      ],fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        out_meta = meta.copy()

        return out_meta
