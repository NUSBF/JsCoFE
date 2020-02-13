##!/usr/bin/python

#
# ============================================================================
#
#    09.03.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

import sys
import os

import ccp4build_base

# ============================================================================

class Parrot(ccp4build_base.Base):

    # parrot options
    parrot_options = {
        "ncs-average"            : True,
        "solvent-flatten"        : True,
        "histogram-match"        : True,
        "anisotropy-correction"  : True,
        "cycles"                 : 3,
        "resolution"             : False,  # 1.0,
        "solvent-content"        : False,  # 0.5
        "ncs-mask-filter-radius" : 6.0
    }

    # ----------------------------------------------------------------------

    def readParrotOptions ( self ):
        self.parrot_options = self.readPGMOptions ( "parrot",self.parrot_options )
        return

    # ----------------------------------------------------------------------

    def parrot (  self,
                  meta,   # meta dictionary
                  nameout = "parrot",
                  colout  = "parrot",
                ):

        if int(self.parrot_options["cycles"])<=0:
            return meta.copy()

        self.open_script ( "parrot" )

        parrot_mtzout = os.path.join ( self.workdir,nameout+".mtz" )

        self.write_script ([
            "title "     + self.job_title + "_parrot",
            #"pdbin-ref " + self.getRefPDB(),
            #"mtzin-ref " + self.getRefMTZ(),
            #"colin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF",
            #"colin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D",
            "seqin "      + self.input_data["seqpath"],
            "mtzin "      + meta["mtzpath"],
            "mtzout "     + parrot_mtzout,
            "colout "     + colout,
            "colin-fo "   + meta["labin_fo"],
            "colin-free " + meta["labin_free"]
        ])

        if meta["labin_hl"]:
            self.write_script ([
                "colin-hl " + meta["labin_hl"],
            ])
        else:
            self.write_script ([
                "colin-phifom " + meta["labin_phifom"]
            ])

        if meta["labin_fc"]:
            self.write_script ([
                "colin-fc "     + meta["labin_fc"]
            ])

        #if self.input_data["mode"]=="MR":
        #    self.write_script ([
        #        "colin-phifom " + meta["labin_phifom"],
        #        "colin-fc "     + meta["labin_fc"]
        #    ])
        #else:
        #    self.write_script ([
        #        "colin-hl " + meta["labin_hl"],
        #    ])

        if meta["xyzpath"]:
            self.write_script ([ "pdbin-mr " + meta["xyzpath"] ])
        elif meta["xyzpath_ha"]:
            self.write_script ([ "pdbin-ha " + meta["xyzpath_ha"] ])

        self.write_script ( self.parrot_options )
        self.close_script()

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        self.runApp ( "cparrot",['-stdin'],
                      fpath_stdout=stdout_fpath,fpath_stderr=stdout_fpath )

        out_meta = meta.copy()
        out_meta["mtzpath" ] = parrot_mtzout
        out_meta["labin_fc"] = "/*/*/[FWT,PHWT]"
        out_meta["labin_hl"] = "/*/*/[" + colout + ".ABCD.A" + "," +\
                                          colout + ".ABCD.B" + "," +\
                                          colout + ".ABCD.C" + "," +\
                                          colout + ".ABCD.D" + "]"

        return out_meta
