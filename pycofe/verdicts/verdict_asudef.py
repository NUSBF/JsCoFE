#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    13.07.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR ASU DEFINITION TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2021
#
# ============================================================================
#

import os
import math

from pycofe.proc import verdict


# ------------------------------------------------------------------------

def makeVerdict ( verdict_meta ):

    ncopies1   = verdict_meta["ncopies"]
    nc0        = verdict_meta["nc"]
    sol        = verdict_meta["sol"]
    resolution = verdict_meta["resolution"]

    verdict_message = "<b style='font-size:18px;'>"
    bottom_line     = ""

    res = resolution
    if not res:
        res = 2.2
    center = 29.0 + 10.0*res
    verdict_scor = verdict.calcVerdictScore ({
                        "SOL1" :  { "value"  : sol,
                                    "weight" : 1.0,
                                    "center" : center,
                                    "bwidth" : 2.2  + 3.0*res
                                  }
                    },0 )
    verdict_score = verdict.calcVerdictScore ({
                        "SOL1" :  { "value"  : verdict_scor,
                                    "weight" : 1.0,
                                    "good"   : [30.0,50.0,75.0,100.0],
                                    "bad"    : [30.0,20.0,10.0,0.0]
                                  }
                    },0 )

    if verdict_score>66.0:
        verdict_message += "The estimated solvent fraction is within"
        bottom_line      = "The suggested composition of ASU corresponds to "  +\
                           "usual values of solvent fraction and, therefore, " +\
                           "<b><i>represents an acceptable assumption</i></b>."
    else:
        solest = "above"
        if sol<center:
            solest = "below"
        if nc0==1 and verdict_score>50.0:
            verdict_message += "The estimated solvent fraction is "
            bottom_line      = "Although the suggested composition of ASU "  +\
                               "corresponds to an unusual value of solvent " +\
                               "fraction, it " +\
                               "<b><i>may</i></b> be an acceptable assumption."
        elif verdict_score>33.0:
            verdict_message += "The estimated solvent fraction is noticeably "
            bottom_line      = "The suggested composition of ASU corresponds to " +\
                               "rather unusual value of solvent fraction. Yet, "  +\
                               "it <b><i>could</i></b> be an acceptable "         +\
                               "assumption</i></b>."
        else:
            verdict_message += "The estimated solvent fraction is substantially "
            if nc0 > 1:
                bottom_line  = "The suggested composition of ASU corresponds to " +\
                               "a rather unusual solvent fraction, and unlikely " +\
                               "to be correct. <i>Try to increase the number of " +\
                               "copies by a factor of " + str(nc0) + " (" +\
                               str(int(ncopies1*nc0)) + " in total)</i>."
            else:
                ratio    = math.ceil ( math.sqrt(abs(sol-50.0))/0.35 ) / 10.0
                ncopies2 = int ( round ( ncopies1/ratio ) )
                if ncopies2<ncopies1 and ncopies1>1:
                    bottom_line = "The suggested composition of ASU corresponds to " +\
                                  "a rather unusual solvent fraction, and unlikely " +\
                                  "to be correct. <i>Try to decrease the number of " +\
                                  "copies by a factor of " + str(ratio) + " (" +\
                                  str(ncopies2) + " in total)</i>."
                else:
                    bottom_line = "The suggested composition of ASU corresponds to " +\
                                  "a rather unusual solvent fraction. However, in "  +\
                                  "this particular case, it " +\
                                  "<b><i>could</i></b> be an acceptable assumption."
        verdict_message += solest

    bottom_line += "<p>In general, composition of ASU remains a hypothesis until " +\
                   "structure is solved. The solvent content is more a guidance, " +\
                   "rather than a definite indicator, of the correctness of the "  +\
                   "choice. Inaccurate estimations of solvent content may have "   +\
                   "a negative impact on phasing and density modification procedures, " +\
                   "especially in difficult cases."

    return  (   verdict_score,
                verdict_message + " the usual range for macromolecular " +\
                                  "crystals, diffracting at similar resolution</b>",
                bottom_line # + "<p>  " + str(verdict_scor)+ "  " + str(verdict_score) + " " + str(ncopies1)
            )


# ------------------------------------------------------------------------

def putVerdictWidget ( base,verdict_meta,pageId=None,secId="",title="Verdict" ):

    base.putMessage ( "&nbsp;" )

    verdict_score, verdict_message, bottom_line = makeVerdict ( verdict_meta )

    verdict.makeVerdictSection ( base,None,verdict_score,
                                 verdict_message,bottom_line,
                                 pageId=pageId,secId=secId,
                                 title=title )
    base.rvrow += 3

    return
