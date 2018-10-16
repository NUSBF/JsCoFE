##!/usr/bin/python

#
# ============================================================================
#
#    09.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SRF (Self-Rotation Function) UTILS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
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

def putSRFDiagram ( body,            # reference on Basic class
                    hkl,             # hkl data object
                    dirPath,         # directory with hkl object files (outputDir)
                    reportDir,       # directory with html report (reportDir)
                    holderId,        # rvapi holder of SRF widget
                    row,col,         # rvapi coordinates for SRF widget
                    rowSpan,colSpan, # coordinate spans for STF widget
                    file_stdout,     # standard output stream
                    file_stderr,     # standard error stream
                    log_parser=None  # log file parser
                  ):

    if sys.platform.startswith("win"):
        return [0,"Ok"]


    fpath = hkl.getHKLFilePath ( dirPath )
    Fmean = hkl.getMeta ( "Fmean.value","" )
    sigF  = hkl.getMeta ( "Fmean.sigma","" )

    if Fmean == ""  or  sigF == "":
        file_stderr.write ( "Fmean and sigFmean columns not found in " +\
                            hkl.getHKLFileName() + " -- SRF not calculated\n" )
        return [-1,"Fmean and sigFmean columns not found"]

    scr_file = open ( "molrep_srf.script","w" )
    scr_file.write ( "file_f " + fpath +\
                     "\nlabin F=" + Fmean + " SIGF=" + sigF + "\n" )
    scr_file.close ()

    # Start molrep
    rc = command.call ( "molrep",["-i"],"./",
                        "molrep_srf.script",file_stdout,file_stderr,
                        log_parser=log_parser,citation_ref="molrep-srf" )

    if not os.path.isfile("molrep_rf.ps"):
        file_stderr.write ( "\nSRF postscript was not generated for " +\
                            hkl.getHKLFileName() + "\n" )
        return [-2,rc.msg]

    rc = command.call ( "ps2pdf",["molrep_rf.ps"],"./",
                        None,file_stdout,file_stderr,log_parser )

    if not os.path.isfile("molrep_rf.pdf"):
        file_stderr.write ( "\nSRF pdf was not generated for " +\
                            hkl.getHKLFileName() + "\n" )
        return [-3,rc.msg]

    pdfpath = os.path.splitext(hkl.getHKLFileName())[0] + ".pdf"
    os.rename ( "molrep_rf.pdf",os.path.join(reportDir,pdfpath) )

    subsecId = body.getWidgetId ( holderId ) + "_srf"
    pyrvapi.rvapi_add_section ( subsecId,"Self-Rotation Function",
                                holderId,row,col,rowSpan,colSpan,False )

    pyrvapi.rvapi_set_text ( "<object data=\"" + pdfpath +\
            "\" type=\"application/pdf\" " +\
            "style=\"border:none;width:100%;height:1000px;\"></object>",
            subsecId,0,0,1,1 )
    pyrvapi.rvapi_flush()

    return [0,"Ok"]
