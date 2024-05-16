##!/usr/bin/python

#
# ============================================================================
#
#    29.06.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SRF (Self-Rotation Function) UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
import pyrvapi

#  application imports
from pycofe.varut   import command


# ============================================================================

def putPattersonMap ( body,            # reference on Basic class
                      hkl,             # hkl data object
                      dirPath,         # directory with hkl object files (outputDir)
                      reportDir,       # directory with html report (reportDir)
                      holderId,        # rvapi holder of Patterson Map widget
                      row,col,         # rvapi coordinates for SRF widget
                      rowSpan,colSpan, # coordinate spans for STF widget
                      file_stdout,     # standard output stream
                      file_stderr,     # standard error stream
                      log_parser=None  # log file parser
                    ):

    fpath = hkl.getHKLFilePath ( dirPath )
    fname = hkl.getHKLFileName ()
    Fmean = hkl.getMeta ( "Fmean.value","" )
    sigF  = hkl.getMeta ( "Fmean.sigma","" )

    if Fmean == ""  or  sigF == "":
        file_stderr.write ( "Fmean and sigFmean columns not found in " +\
                            hkl.getHKLFileName() +\
                            " -- Patterson map not calculated\n" )
        return [-1,"Fmean and sigFmean columns not found"]

    scr_file = open ( "patterson_map.script","w" )
    scr_file.write (
        "xyzlim asu\n" +\
        "PATTERSON\n"  +\
        "rholim 1.0\n" +\
        "labin F1=" + Fmean + " SIG1=" + sigF + "\n" +\
        "end\n"
    )
    scr_file.close ()

    mapfname = os.path.splitext(fname)[0]+"_patterson.map"

    # Start fft
    rc = command.call ( "fft",["hklin",fpath,"mapout",mapfname],"./",
                        "patterson_map.script",file_stdout,file_stderr,
                        log_parser=log_parser,citation_ref="fft" )

    if not os.path.isfile(mapfname):
        file_stderr.write ( "\nPatterson map was not generated for " +\
                            hkl.getHKLFileName() + "\n" )
        return [-2,rc.msg]

    mapfpath = os.path.join ( dirPath,mapfname )
    os.rename ( mapfname,mapfpath )

    body.putUglyMolButton_map ( "",mapfpath,"",
                                "Patterson map for " + hkl.dname,
                                "View Patterson map",
                                holderId,row,col )

    pyrvapi.rvapi_flush()

    return [0,"Ok"]
