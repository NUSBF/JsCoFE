##!/usr/bin/python

#
# ============================================================================
#
#    07.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Coot class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2020
#
# ============================================================================
#
#

# python-3 ready

import os
import sys

import shutil

import ccp4build_refmac

# ============================================================================

class Coot(ccp4build_refmac.Refmac):

    # ----------------------------------------------------------------------

    def _escape_path ( self,path ):
        if sys.platform.startswith("win"):
            return path.replace ( "\\","\\\\" )
        return path

    def coot (  self,
                meta,   # meta dictionary
                script_lst,
                nameout = "coot"
              ):

        self.open_script ( "coot" )

        #lab_f   = self.getLabel ( meta["labin_fo"    ],0 )
        #lab_phi = self.getLabel ( meta["labin_phifom"],0 )
        lab_f   = self.getLabel ( meta["labin_fc"],0 )
        lab_phi = self.getLabel ( meta["labin_fc"],1 )
        xyzout  = os.path.join  ( self.workdir,nameout+".pdb" )

        script = [
            "make_and_draw_map('" + meta["mtzpath"]  +\
                                    "', '" + lab_f   +\
                                    "', '" + lab_phi +\
                                    "', '', 0, 0)"
        ]

        for i in range(len(script_lst)):
            script.append ( script_lst[i] + "(0)" )

        script = script + [
            "write_pdb_file(0,'" + self._escape_path(xyzout) + "')",
            "coot_real_exit(0)"
        ]

        self.write_script ( script )
        self.close_script()

        script_path = self.script_path + ".py"
        shutil.move ( self.script_path,script_path )
        self.script_path = None

        cmd = [ "--no-state-script", "--no-graphics", "--no-guano", "--python",
                "--pdb",meta["xyzpath"], "--script",script_path ]

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        if sys.platform.startswith("win"):
            coot_bat = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
            rc = self.runApp ( coot_bat,cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )
        else:
            rc = self.runApp ( "coot",cmd,
                          fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        if rc.msg:
            self.file_stdout.write (
                "\n\n *** error running coot:\n" +\
                    "    " +  rc.msg +\
                  "\n    check that all libraries are installed\n\n"
            )
            xyzout = None

        out_meta = meta.copy()
        out_meta["xyzpath"] = xyzout

        return out_meta
