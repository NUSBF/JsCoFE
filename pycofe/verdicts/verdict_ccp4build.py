#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    18.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR CCP4BUILD TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import os
import math

from pycofe.proc import verdict


# ------------------------------------------------------------------------

def makeVerdict ( verdict_meta ):
    verdict_score   = 0
    verdict_message = ""
    bottom_line     = ""
    return (verdict_score, verdict_message, bottom_line)


# ------------------------------------------------------------------------

def putVerdictWidget ( base,verdict_meta ):

    verdict_meta = {
        "nresbuilt"  : 100,  # number of residues built
        "nresasu"    : 700,  # number of residues in ASU
        "nfragments" : 5,    # number of fragments
        "nasu"       : 6,    # number of chains in ASU
        "edcorr"     : 0.8,  # ED correlation coefficient
        "rfactor"    : 0.3,  # Rwork
        "rfree"      : 0.35, # Rfree
        "molprobity" : meta
    }

    base.putMessage ( "&nbsp;" )

    verdict_score, verdict_message, bottom_line = makeVerdict ( verdict_meta )

    verdict.makeVerdictSection ( base,None,verdict_score,
                                 verdict_message,bottom_line )
    base.rvrow += 3

    return
