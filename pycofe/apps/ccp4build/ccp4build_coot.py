##!/usr/bin/python

#
# ============================================================================
#
#    31.01.19   <--  Date of Last Modification.
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

import sys
import os

import ccp4build_refmac

# ============================================================================

class Coot(ccp4build_refmac.Refmac):

    # ----------------------------------------------------------------------

    def coot (  self,
                meta,   # meta dictionary
                script       = "stepped_refine_protein",
                nameout      = "coot"
              ):

        self.open_script ( "coot" )

        #lab_f   = self.getLabel ( meta["labin_fo"    ],0 )
        #lab_phi = self.getLabel ( meta["labin_phifom"],0 )
        lab_f   = self.getLabel ( meta["labin_fc"],0 )
        lab_phi = self.getLabel ( meta["labin_fc"],1 )
        xyzout  = os.path.join  ( self.workdir,nameout+".pdb" )

        self.write_script ([
            "make_and_draw_map('" + meta["mtzpath"]  +\
                                    "', '" + lab_f   +\
                                    "', '" + lab_phi +\
                                    "', '', 0, 0)",
            script + "(0)",
            "write_pdb_file(0,'" + xyzout + "')",
            "coot_real_exit(0)"
        ])

        self.close_script()

        script_path = self.script_path + ".py"
        os.rename ( self.script_path,script_path )
        self.script_path = None

        cmd = [ "--no-state-script", "--no-graphics", "--no-guano", "--python",
                "--pdb",meta["xyzpath"], "--script",script_path ]

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        if sys.platform.startswith("win"):
            self.runApp ( "coot.bat",cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )
        else:
            self.runApp ( "coot",cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        out_meta = meta.copy()
        out_meta["xyzpath"  ] = xyzout

        return out_meta
