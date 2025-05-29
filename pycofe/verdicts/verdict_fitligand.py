#!/usr/bin/python

#
# ============================================================================
#
#    12.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR MOLREP TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2025
#
# ============================================================================
#

# import os
# import math

from pycofe.proc import verdict

# ------------------------------------------------------------------------

def makeVerdictMessage ( options ):
    verdict_message = "<b style='font-size:18px;'>"
    if options["score"]>=67:
        verdict_message += "The quality of the ligand fit is likely to be good."
    elif options["score"]>=34:
        verdict_message += "The ligand is likely to be correctly positioned, but not ideally."
    else:
        verdict_message += "Ligand placement in the density is potentially incorrect."
    verdict_message += "</b>"
    return verdict_message


# ------------------------------------------------------------------------

def makeVerdictBottomLine ( options ):
    bottomline = "&nbsp;<br>"
    if options["score"]>=67:
        bottomline += "The ligand appears positioned correctly and fit " +\
                      "the electron density satisfactory to well."
    elif options["score"]>=34:
        bottomline += "The ligand is likely positioned correctly, but " +\
                      "may adopt a suboptimal conformation and/or exhibit " +\
                      "a mediocre to satisfactory fit to the electron " +\
                      "density."
    else:
        bottomline += "The ligand may be found in a wrong position and " +\
                           "exhibit a poor fit to the electron density."

    return bottomline +\
        "<p>Regardless of the fit score, manual adjustment of " +\
        "the ligand using Coot or Moorhen (web-Coot) is typically " +\
        "necessary. Consider performing jelly-body refinement " +\
        "with a sufficient number of cycles (50 or more) after " +\
        "manual editing. If the ligand is correctly positioned, " +\
        "this generally enhances the visual quality of the fit and " +\
        "reduces R-factors."


# ------------------------------------------------------------------------

def putVerdictWidget ( base,verdict_meta,verdict_row ):

    verdict_meta["score"] = verdict.calcVerdictScore ({
        "fit_score" : { "value"  : verdict_meta["fit_score"],
                        "weight" : 1.0,
                        "good"   : [0.3,0.4,0.6,1.0],
                        "bad"    : [0.3,0.24,0.2,0.1]
                      }
    }, 1 )

    tdict = {
        "title": "Fit summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
            { "header": { "label": "Fit score", "tooltip": "Fit score"},
              "data"  : [ str(round(verdict_meta["fit_score"],3)) ]}
        ]
    }

    base.putMessage1 ( base.report_page_id(),"&nbsp;",verdict_row )

    verdict.makeVerdictSection ( base,tdict,verdict_meta["score"],
                                 makeVerdictMessage    ( verdict_meta ),
                                 makeVerdictBottomLine ( verdict_meta ),
                                 row=verdict_row+1 )

    return
