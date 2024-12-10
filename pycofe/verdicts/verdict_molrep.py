#!/usr/bin/python

#
# ============================================================================
#
#    25.09.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR MOLREP TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2024
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
        if options["nfitted"]==options["nasu"]:
            verdict_message += "The structure is likely to be solved."
        else:
            verdict_message += "Monomeric unit(s) are likely to have " +\
                               "been placed successfully."
    elif options["score"]>=34:
        if options["nfitted"]==options["nasu"]:
            verdict_message += "The structure may be solved, yet with " +\
                               "a chance for wrong solution."
        else:
            verdict_message += "Monomeric unit(s) were   placed, with " +\
                               "a chance for wrong solution."
        if options["score"]<50.0:
            verdict_message += " This case may be difficult."
    else:
        if options["nfitted"]==options["nasu"]:
            verdict_message += "It is unlikely that the structure is solved."
        else:
            verdict_message += "It is unlikely that monomeric unit(s) " +\
                               "were placed correctly."
    verdict_message += "</b>"

    notes = []
    if options["Packing_Coef"]<0.97:
        notes.append ( "<i>Packing Coefficient</i> is critically low" )
    if options["TF_sig"]<4.0:
        notes.append ( "<i>TF/sig</i> is critically low" )
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
    if options["Packing_Coef"]<0.97:
        bottomline += "Packing coefficient below 0.97 suggests that solution " +\
                      "is not found. "
    else:
      if options["TF_sig"]<4.0:
          bottomline += "TF/sig ratio below 4.0 suggests that results are " +\
                        "doubtful. "
      elif options["TF_sig"]<7.0:
          bottomline += "TF/sig ratio between 4.0-7.0 indicates that solution " +\
                        " is not very certain. "
      if options["nfitted"]<options["nasu"]:
          if options["score"]<66.0:
              bottomline += "Please consider that phasing scores are lower " +\
                            "if, as in this case, not all copies of " +\
                            "monomeric units are found. "
          else:
              bottomline += "Scores look good, however, not all copies of " +\
                            "monomeric units are found. "
          if options["nfitted"]>options["nfitted0"]:
              bottomline += "Try to fit the remaining copies in subsequent " +\
                            "phasing attempts."
      if options["nfitted"]==options["nfitted0"]:
          bottomline += "<i>No new copies could be found in this run, " +\
                        "therefore, you may need to proceed to model " +\
                        "building.</i>"
      elif options["nfitted"]==options["nasu"]:
          bottomline += "<i>Assumed total number of monomeric units in ASU " +\
                        "has been reached, you may proceed to the next step  " +\
                        "(model building, ligand fitting and refinement)."
          if options["score"]<34.0:
              bottomline += " Bear in mind that phasing quality looks " +\
                            "doubtful. Model building may be difficult or " +\
                            "not successful at all."
          bottomline += "</i>"

    return  bottomline +\
        "<p>In general, correctness of phasing solution may be ultimately " +\
        "judged only by the ability to (auto-)build in the resulting " +\
        "electron density. As a practical hint, <i>R<sub>free</sub></i> " +\
        "should decrease in subsequent refinement.</i><br>&nbsp;"


# ------------------------------------------------------------------------

def putVerdictWidget ( base,verdict_meta,verdict_row ):

    verdict_meta["score"] = verdict.calcVerdictScore ({
        "Packing_Coef" : { "value"  : verdict_meta["Packing_Coef"],
                           "weight" : 1.0,
                           "map"    : [(0.9699,0),(0.9701,100)]
                         },
        "TF_sig" :       { "value"  : verdict_meta["TF_sig"],
                           "weight" : 1.0,
                           "good"   : [5.5,7.0,12.0,50.0],
                           "bad"    : [5.5,4.0,2.0,0.0]
                         },
        "Rfree" :        { "value"  : verdict_meta["rfree"],
                           "weight" : 1.0,
                           "good"   : [0.5,0.46,0.4,0.1],
                           "bad"    : [0.5,0.54,0.56,0.66]
                         }
    }, 1 )

    tdict = {
        "title": "Phasing summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
            { "header": { "label": "TF/sig", "tooltip": "TF/sig ratio"},
              "data"  : [ str(verdict_meta["TF_sig"]) ]},
            { "header": { "label": "Final CC", "tooltip": "Final Correlation Coefficient"},
              "data"  : [ str(verdict_meta["Final_CC"]) ]},
            { "header": { "label": "Packing Coef", "tooltip": "Packing Coefficient"},
              "data"  : [ str(verdict_meta["Packing_Coef"]) ]},
            { "header": { "label": "R<sub>free</sub>", "tooltip": "Free R-factor"},
              "data"  : [ str(verdict_meta["rfree"]) ]},
            { "header": { "label": "R<sub>factor</sub>", "tooltip": "R-factor"},
              "data"  : [ str(verdict_meta["rfactor"]) ]},
            { "header": { "label"  : "Found copies",
                          "tooltip": "Number of found copies / total copies in ASU" },
              "data"  : [ str(verdict_meta["nfitted"]) + "/" + str(verdict_meta["nasu"]) ]},
        ]
    }

    base.putMessage1 ( base.report_page_id(),"&nbsp;",verdict_row )

    verdict.makeVerdictSection ( base,tdict,verdict_meta["score"],
                                 makeVerdictMessage    ( verdict_meta ),
                                 makeVerdictBottomLine ( verdict_meta ),
                                 row=verdict_row+1 )

    return
