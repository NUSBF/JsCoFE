#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    13.07.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR SIMBAD TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2021
#
# ============================================================================
#

import os
import math

from pycofe.proc     import verdict
from pycofe.verdicts import verdict_asudef

# ------------------------------------------------------------------------

def makeVerdictMessage ( options ):

    verdict_message = "<b style='font-size:18px;'>"
    if options["score"]>=67:
        verdict_message += "The solution is likely to be found."
    elif options["score"]>=34:
        verdict_message += "The solution is probably found, yet with " +\
                           "a chance that it is wrong."
        if options["score"]<50.0:
            verdict_message += " This case may be difficult."
    else:
        verdict_message += "It is unlikely that the solution is found."
    verdict_message += "</b>"

    notes = []
    if options["fllg"]<60.0:
        notes.append ( "<i>LLG</i> is critically low" )
    elif options["fllg"]<120.0:
        notes.append ( "<i>LLG</i> is lower than optimal" )
    if options["ftfz"]<8.0:
        notes.append ( "<i>TFZ</i> is critically low" )
    elif options["ftfz"]<9.0:
        notes.append ( "<i>TFZ</i> is lower than optimal" )
    if options["rfree"]>0.48:
        notes.append ( "<i>R<sub>free</sub></i> is higher than optimal" )
    elif options["rfree"]>0.55:
        notes.append ( "<i>R<sub>free</sub></i> is critically high" )

    if len(notes)<=0:
        notes.append ( "all scores are optimal" )

    verdict_message += "<ul><li>" + "</li><li>".join(notes) + ".</li></ul>"

    return verdict_message


# ------------------------------------------------------------------------

def makeVerdictBottomLine ( options ):
    bottomline = "&nbsp;<br>"
    if options["score"]<34.0:
        bottomline += "Phasing quality looks " +\
                      "doubtful. Model building may be difficult or " +\
                      "not successful at all."
    else:
        bottomline += "<i>You may need to perform model building and refinement."
    bottomline += "</i><p>"

    return  bottomline +\
        "In general, correctness of phasing solution may be ultimately " +\
        "judged only by the ability to (auto-)build in the resulting " +\
        "electron density. As a practical hint, <i>R<sub>free</sub></i> " +\
        "should decrease in subsequent rounds of model building and " +\
        "refinement.</i><br>&nbsp;"


# ------------------------------------------------------------------------

def putVerdictWidget ( base,verdict_meta,verdict_row,secId="" ):

    verdict_meta["score"] = verdict.calcVerdictScore ({
        "TFZ" :   { "value"  : verdict_meta["ftfz"],
                    "weight" : 1.0,
                    "good"   : [8.0,10.0,12.0,50.0],
                    "bad"    : [8.0,7.0,6.0,0.0]
                  },
        "LLG" :   { "value"  : verdict_meta["fllg"],
                    "weight" : 1.0,
                    "good"   : [90.0,120.0,240.0,5000.0],
                    "bad"    : [90.0,60.0,40.0,0.0]
                  },
        "Rfree" : { "value"  : verdict_meta["rfree"],
                    "weight" : 3.0,
                    "good"   : [0.5,0.46,0.4,0.1],
                    "bad"    : [0.5,0.54,0.56,0.66]
                  }
    }, 1 )

    tdict = {
        "title": "Phasing summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
            { "header": { "label": "Solvent %%", "tooltip": "Solvent percent"},
              "data"  : [ str(verdict_meta["sol"]) ]},
            { "header": { "label": "LLG", "tooltip": "Log-Likelihood Gain score"},
              "data"  : [ str(verdict_meta["fllg"]) ]},
            { "header": { "label": "TFZ", "tooltip": "Translation Function Z-score"},
              "data"  : [ str(verdict_meta["ftfz"]) ]},
            { "header": { "label": "R<sub>free</sub>", "tooltip": "Free R-factor"},
              "data"  : [ str(verdict_meta["rfree"]) ]},
            { "header": { "label"  : "N<sub>monomers</sub>",
                          "tooltip": "Number of monomers in ASU" },
              "data"  : [ str(verdict_meta["nasu"]) ]},
        ]
    }
    if tdict["rows"][0]["data"][0]=="0.0":
        tdict["rows"].pop(0)

    base.putMessage1 ( base.report_page_id(),"&nbsp;",verdict_row )

    verdict_meta["ncopies"] = 1
    verdict_meta["nc"]      = 1

    asu_score, asu_message, asu_bottomline = verdict_asudef.makeVerdict ( verdict_meta )

    verdict.makeVerdictSection ( base,tdict,verdict_meta["score"],
                                 makeVerdictMessage    ( verdict_meta ) +\
                                 "<br>" + asu_message,
                                 makeVerdictBottomLine ( verdict_meta ) +\
                                 "<br>" + asu_bottomline,
                                 row=verdict_row+1,secId=secId )

    return
