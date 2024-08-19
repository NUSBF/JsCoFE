#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    01.01.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR CCP4BUILD TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

import os
import math

from pycofe.proc import verdict


# ------------------------------------------------------------------------

def makeVerdict ( metrics ):

    verdict_score   = 0
    verdict_message = " "
    bottom_line     = " "

    vdata = {
        "Rfree" :  { "value"  : metrics["R_free"],
                     "weight" : 1.0,
                     "map"    : [(0.65,0),(0.45,33),(0.37,67),(0.2,100)]
                   },
        "Compl" :  { "value"  : metrics["compl"],
                     "weight" : 1.0,
                     "map"    : [(0.0,0),(0.60,33),(0.85,67),(100.0,100)]
                   }
    }

    if "EDCC" in metrics:
        vdata["EDCC"] = {
            "value"  : metrics["EDCC"],
            "weight" : 2.0,
            "map"    : [(0.0,0),(0.6,33),(0.75,67),(0.9,100)]
        }

    if "clashscore" in metrics:
        vdata["Clash"] = {
            "value"  : metrics["clashscore"],
            "weight" : 1.0,
            "map"    : [(40.0,0),(20.0,33),(10.0,67),(2.0,100)]
        }

    verdict_score = verdict.calcVerdictScore ( vdata, 1 )

    verdict_message = "<b style='font-size:18px;'>"
    if verdict_score<33.0:
        verdict_message += "Overall build quality is rather poor."
    elif verdict_score<67.0:
        verdict_message += "Overall build quality is mediocre."
    elif verdict_score<85.0:
        verdict_message += "Overall build quality is acceptable."
    else:
        verdict_message += "Overall build quality is good."
    verdict_message += "</b>"

    notes = []
    if metrics["R_free"]>0.45:
        notes.append ( "R<sub>free</sub> is far too high" )
    elif metrics["R_free"]>0.38:
        notes.append ( "R<sub>free</sub> is rather high" )

    if metrics["compl"]<40.0:
        notes.append ( "Completeness is far too low" )
    elif metrics["compl"]<60.0:
        notes.append ( "Completeness is rather low" )
    elif metrics["compl"]<80.0:
        notes.append ( "Completeness is mediocre" )

    if len(notes)<=0:
        notes.append ( "all scores are optimal for auto-build procedure" )

    verdict_message += "<ul><li>" + "</li><li>".join(notes) + ".</li></ul>"

    return (verdict_score, verdict_message, bottom_line)


# ------------------------------------------------------------------------

def putVerdictWidget ( base,metrics ):

    base.putMessage ( "&nbsp;" )

    verdict_score, verdict_message, bottom_line = makeVerdict ( metrics )

    tdata = {
        "title": "Build summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
            { "header": { "label"  : "N<sub>residues</sub>",
                          "tooltip": "Number of built residues"},
              "data"  : [ str(metrics["N_built"]) ]},
            { "header": { "label"  : "N<sub>waters</sub>",
                          "tooltip": "Number of placed water molecules"},
              "data"  : [ str(metrics["N_wat"]) ]},
            { "header": { "label"  : "R-factor",
                          "tooltip": "R-factor for working set"},
              "data"   : [ str(metrics["R_factor"]) ]
            },
            { "header": { "label"  : "R<sub>free</sub>",
                          "tooltip": "Free R-factor"},
              "data"  : [ str(metrics["R_free"]) ]
            },
            { "header": { "label"  : "Completeness",
                          "tooltip": "Fraction of residues built"},
              "data"  : [ "{0:.1f}%".format(metrics["compl"]) ]
            }
        ]
    }

    if "EDCC" in metrics:
        tdata["rows"].append ({
            "header": { "label"  : "EDCC",
                        "tooltip": "Electron Density Correlation Coefficient"},
            "data"  : [ str(metrics["EDCC"]) ]
        })

    if "clashscore" in metrics:
        tdata["rows"].append ({
            "header": { "label"  : "Clash score",
                        "tooltip": "Molprobity clash score" },
            "data"  : [ str(metrics["clashscore"]) ]
        })

    verdict.makeVerdictSection ( base,tdata,verdict_score,verdict_message,
                                 bottom_line )
    base.rvrow += 3

    return
