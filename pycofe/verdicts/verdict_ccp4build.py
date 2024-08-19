#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    10.11.20   <--  Date of Last Modification.
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

def makeVerdict ( task_meta,sol_no ):

    verdict_score   = 0
    verdict_message = " "
    bottom_line     = " "

    metrics = task_meta["metrics"][sol_no]

    vdata = {
        "Rfree" :  { "value"  : metrics["R_free"],
                     "weight" : 1.0,
                     "map"    : [(0.65,0),(0.45,33),(0.37,67),(0.2,100)]
                   },
        "Compl" :  { "value"  : metrics["chain_compl"],
                     "weight" : 1.0,
                     "map"    : [(0.0,0),(0.60,33),(0.85,67),(100.0,100)]
                   },
        "EDCC"  :  { "value"  : metrics["EDCC"],
                     "weight" : 2.0,
                     "map"    : [(0.0,0),(0.6,33),(0.75,67),(0.9,100)]
                   }
    }

    if "clashscore" in metrics:
        vdata["Clash"] = {
            "value"  : metrics["clashscore"],
            "weight" : 1.0,
            "map"    : [(40.0,0),(20.0,33),(10.0,67),(2.0,100)]
        }

    verdict_score = verdict.calcVerdictScore ( vdata, 1 )

    """
    verdict_score = verdict.calcVerdictScore ({
        "Rfree" :  { "value"  : metrics["R_free"],
                     "weight" : 1.0,
                     "map"    : [(0.65,0),(0.45,33),(0.37,67),(0.2,100)]
                   },
        "Compl" :  { "value"  : metrics["chain_compl"],
                     "weight" : 1.0,
                     "map"    : [(0.0,0),(0.60,33),(0.85,67),(100.0,100)]
                   },
        "EDCC"  :  { "value"  : metrics["EDCC"],
                     "weight" : 2.0,
                     "map"    : [(0.0,0),(0.6,33),(0.75,67),(0.9,100)]
                   },
        "Clash" :  { "value"  : metrics["clashscore"],
                     "weight" : 1.0,
                     "map"    : [(40.0,0),(20.0,33),(10.0,67),(2.0,100)]
                   }
    }, 1 )
    """

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

    if metrics["chain_compl"]<40.0:
        notes.append ( "Chain completeness is far too low" )
    elif metrics["chain_compl"]<60.0:
        notes.append ( "Chain completeness is rather low" )
    elif metrics["chain_compl"]<80.0:
        notes.append ( "Chain completeness is mediocre" )

    if len(notes)<=0:
        notes.append ( "all scores are optimal for auto-build procedure" )

    verdict_message += "<ul><li>" + "</li><li>".join(notes) + ".</li></ul>"

    """
    {
      "R_factor"    : self.build_meta[self.best_rfree_build_no]["refmac"]["rfactor"][1],
      "R_free"      : self.build_meta[self.best_rfree_build_no]["refmac"]["rfree"][1],
      "res_compl"   : self.build_meta[self.best_rfree_build_no]["cbuccaneer"]["res_complete"],
      "chain_compl" : self.build_meta[self.best_rfree_build_no]["cbuccaneer"]["chain_complete"],
      "EDCC"        : self.build_meta[self.best_rfree_build_no]["edstats"]["EDCC"]
    }
    """

    return (verdict_score, verdict_message, bottom_line)


# ------------------------------------------------------------------------

def putVerdictWidget ( base,task_meta ):

    base.putMessage ( "&nbsp;" )

    verdict_score   = -1
    verdict_message = ""
    bottom_line     = ""

    build_no = task_meta["build_no"]
    metrics  = task_meta["metrics"][0]
    scores   = []
    bno      = -1
    nsol     = 0
    for i in range(len(build_no)):
        if build_no[i]>=0:
            score, message, line = makeVerdict ( task_meta,i )
            scores.append ( score )
            if score>verdict_score:
                verdict_score   = score
                verdict_message = message
                bottom_line     = line
                metrics = task_meta["metrics"][i]
                bno     = build_no[i]
                nsol   += 1
        else:
            scores.append ( -1.0 )

    task_meta["scores"] = scores

    if nsol>0:
        verdict_message = "<b style='font-size:18px;'>Highest-scored build No. " +\
                          str(bno+1) + "</b><br>" + verdict_message

    tdata = {
        "title": "Build summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
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
              "data"  : [ str(metrics["chain_compl"])+"%" ]
            },
            { "header": { "label"  : "EDCC",
                          "tooltip": "Electron Density Correlation Coefficient"},
              "data"  : [ str(metrics["EDCC"]) ]
            }
        ]
    }

    if "clashscore" in metrics:
        tdata["rows"].append ({
            "header": { "label"  : "Clash score",
                        "tooltip": "Molprobity clash score" },
            "data"  : [ str(metrics["clashscore"]) ]
        })

    """
    verdict.makeVerdictSection ( base,{
        "title": "Build summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
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
              "data"  : [ str(metrics["chain_compl"])+"%" ]
            },
            { "header": { "label"  : "EDCC",
                          "tooltip": "Electron Density Correlation Coefficient"},
              "data"  : [ str(metrics["EDCC"]) ]
            },
            { "header": { "label"  : "Clash score",
                          "tooltip": "Molprobity clash score" },
              "data"  : [ str(metrics["clashscore"]) ]
            }
        ]
    },verdict_score,
      verdict_message,
      bottom_line )
    """

    verdict.makeVerdictSection ( base,tdata,verdict_score,verdict_message,
                                 bottom_line )
    base.rvrow += 3

    return
