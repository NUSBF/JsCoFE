##!/usr/bin/python

#
# ============================================================================
#
#    23.03.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Coot class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2023
#
# ============================================================================
#
#

import os
import sys

import shutil

import ccp4build_refmac

# ============================================================================

class Coot(ccp4build_refmac.Refmac):

    is_coot   = False
    coot_path = None

    # ----------------------------------------------------------------------

    def checkCoot ( self ):
        if sys.platform.startswith("win"):
            self.coot_path = os.path.join(os.environ["CCP4"],"bin","coot.bat")
            self.is_coot   = os.path.isfile ( self.coot_path )
            # if not self.is_coot:
            #     self.coot_path = os.path.join(os.environ["CCP4"],"libexec","coot.bat")
            #     self.is_coot   = os.path.isfile ( self.coot_path )
        else:
            self.coot_path = os.path.join(os.environ["CCP4"],"bin","coot")
            self.is_coot   = os.path.isfile ( self.coot_path )
            # if not self.is_coot:
            #     self.coot_path = os.path.join(os.environ["CCP4"],"libexec","coot-bin")
            #     self.is_coot   = os.path.isfile ( self.coot_path )
        return self.is_coot

    def _escape_path ( self,path ):
        if sys.platform.startswith("win"):
            return path.replace ( "\\","\\\\" )
        return path

    # ----------------------------------------------------------------------

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

        cmd = [ "--no-state-script", "--no-graphics", "--no-guano",
                "--pdb",meta["xyzpath"], "--script",script_path ]

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        # if sys.platform.startswith("win"):
        #     coot_bat = os.path.join(os.environ["CCP4"], "libexec", "coot.bat")
        #     rc = self.runApp ( coot_bat,cmd,
        #                   fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )
        # else:
        #     rc = self.runApp ( "coot",cmd,
        #                   fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        rc = self.runApp ( self.coot_path,cmd,
                           fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        out_meta = meta.copy()
        if rc.msg:
            self.file_stdout.write (
                "\n\n *** error running coot:\n" +\
                    "    " +  rc.msg +\
                  "\n    check that all libraries are installed\n\n"
            )
            self.is_coot = False
        else:
            out_meta["xyzpath"] = xyzout
            shutil.copyfile ( xyzout,self.current_pdb )

        return out_meta
