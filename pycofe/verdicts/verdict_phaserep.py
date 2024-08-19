#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    02.12.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR PHASER EP TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import os
import math

from pycofe.proc import verdict

# ------------------------------------------------------------------------

"""
The Figure of Merit (FOM) is an estimate of phase quality, ranging from 0 to 1.
For SAD, above 0.45 is very good, and between 0.25 and 0.45 is marginal.
For MAD, these thresholds increase to 0.45 and 0.65.
"""


def makeVerdictMessage ( options ):

    verdict_message = "<b style='font-size:18px;'>"
    if options["score"]>=67:
        verdict_message += "The phases are likely to be of a good quality."
    elif options["score"]>=34:
        verdict_message += "The phase problem may be solved, yet with " +\
                           "a chance for wrong solution."
    else:
        verdict_message += "It is unlikely that calculated phases are correct."
    verdict_message += "</b>"

    notes = []
    if options["fllg"]<60.0:
        notes.append ( "<i>LLG</i> is critically low" )
    elif options["fllg"]<120.0:
        notes.append ( "<i>LLG</i> is lower than optimal" )

    if options["ffom"]<0.25:
        notes.append ( "<i>FOM</i> is critically low" )
    elif options["ffom"]<0.45:
        notes.append ( "<i>FOM</i> is lower than optimal" )

    if len(notes)<=0:
        notes.append ( "all scores are optimal" )

    verdict_message += "<ul><li>" + "</li><li>".join(notes) + ".</li></ul>"

    return verdict_message


# ------------------------------------------------------------------------

def makeVerdictBottomLine ( options ):
    bottomline = "&nbsp;<br>"
    if options["score"]>=66.0:
        bottomline += "Calculated phases appear to be of a sound quality. "
    elif options["score"]>=34.0:
        bottomline += "Calculated phases appear to be of a marginal quality; " +\
                      "model building may be difficult. "
    else:
        bottomline += "Calculated phases are poor; model building may be " +\
                      "difficult or not successful at all. "

    return  bottomline +\
        "In general, correctness of phasing solution may be ultimately " +\
        "judged only by the ability to (auto-)build in the resulting " +\
        "electron density. Attempt automatic model building after density " +\
        "modification in both (original and inverted) hands.</i><br>&nbsp;"


# ------------------------------------------------------------------------

def putVerdictWidget ( base,verdict_meta,verdict_row ):

    verdict_meta["score"] = verdict.calcVerdictScore ({
        "LLG" : { "value"  : verdict_meta["fllg"],
                  "weight" : 2.0,
                  "good"   : [90.0,120.0,240.0,5000.0],
                  "bad"    : [90.0,60.0,40.0,0.0]
                },
        "FOM" : { "value"  : verdict_meta["ffom"],
                  "weight" : 1.0,
                  "good"   : [0.35,0.45,0.65,0.9],
                  "bad"    : [0.35,0.25,0.2,0.1]
                }
    }, 1 )

    tdict = {
        "title": "Phasing summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
            { "header": { "label": "LLG", "tooltip": "Log-Likelihood Gain score"},
              "data"  : [ str(verdict_meta["fllg"]) ]},
            { "header": { "label": "FOM", "tooltip": "Figure Of Merit"},
              "data"  : [ str(verdict_meta["ffom"]) ]}
        ]
    }

    base.putMessage1 ( base.report_page_id(),"&nbsp;",verdict_row )

    verdict.makeVerdictSection ( base,tdict,verdict_meta["score"],
                                 makeVerdictMessage    ( verdict_meta ),
                                 makeVerdictBottomLine ( verdict_meta ),
                                 row=verdict_row+1 )

    return
