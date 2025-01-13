#!/usr/bin/python

#
# ============================================================================
#
#    12.01.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR ASU DEFINITION TASK
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2025
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
    sol_pred   = verdict_meta["sol_pred"]
    resolution = verdict_meta["resolution"]

    verdict_message = "<b style='font-size:18px;'>"
    bottom_line     = ""

    center = sol_pred
    res    = resolution
    if not res:
        res = 2.2
    if sol_pred<=0.00001:
        center = 29.0 + 10.0*res
    bwidth = 2.2  + 3.0*res

    verdict_scor = verdict.calcVerdictScore ({
                        "SOL1" :  { "value"  : sol,
                                    "weight" : 1.0,
                                    "center" : center,
                                    "bwidth" : bwidth
                                }
                    },0 )
    verdict_score = verdict.calcVerdictScore ({
                        "SOL1" :  { "value"  : verdict_scor,
                                    "weight" : 1.0,
                                    "good"   : [30.0,50.0,75.0,100.0],
                                    "bad"    : [30.0,20.0,10.0,0.0]
                                  }
                    },0 )


    predexp = "predicted"
    if sol_pred<=0.00001:
        predexp = "expected"

    #     if verdict_score>66.0:
    #         verdict_message += "The estimated solvent fraction is within"
    #         bottom_line      = "The suggested composition of ASU corresponds to "  +\
    #                         "usual values of solvent fraction and, therefore, " +\
    #                         "<b><i>represents an acceptable assumption</i></b>."
    #     else:
    #         solest = "above"
    #         if sol<center:
    #             solest = "below"
    #         if nc0==1 and verdict_score>50.0:
    #             verdict_message += "The estimated solvent fraction is "
    #             bottom_line      = "Although the suggested composition of ASU "  +\
    #                                "corresponds to an unusual value of solvent " +\
    #                                "fraction, it " +\
    #                                "<b><i>may</i></b> be an acceptable assumption."
    #         elif verdict_score>33.0:
    #             verdict_message += "The estimated solvent fraction is noticeably "
    #             bottom_line      = "The suggested composition of ASU corresponds to " +\
    #                                "rather unusual value of solvent fraction. Yet, "  +\
    #                                "it <b><i>could</i></b> be an acceptable "         +\
    #                                "assumption</i></b>."
    #         else:
    #             verdict_message += "The estimated solvent fraction is substantially "
    #             if nc0 > 1:
    #                 bottom_line  = "The suggested composition of ASU corresponds to " +\
    #                                "a rather unusual solvent fraction, and unlikely " +\
    #                                "to be correct. <i>Try to increase the number of " +\
    #                                "copies by a factor of " + str(nc0) + " (" +\
    #                                str(int(ncopies1*nc0)) + " in total)</i>."
    #             else:
    #                 ratio    = math.ceil ( math.sqrt(abs(sol-50.0))/0.35 ) / 10.0
    #                 ncopies2 = int ( round ( ncopies1/ratio ) )
    #                 if ncopies2<ncopies1 and ncopies1>1:
    #                     bottom_line = "The suggested composition of ASU corresponds to " +\
    #                                   "a rather unusual solvent fraction, and unlikely " +\
    #                                   "to be correct. <i>Try to decrease the number of " +\
    #                                   "copies by a factor of " + str(ratio) + " (" +\
    #                                   str(ncopies2) + " in total)</i>."
    #                 else:
    #                     bottom_line = "The proposed composition of the ASU shows a "  +\
    #                                   "significant deviation from the expected "      +\
    #                                   "solvent fraction and is <b><i>unlikely to be " +\
    #                                   "accurate</i></b>. However, in this <b><i>"     +\
    #                                   "specific case</i?</b>, it <b><i>might be"      +\
    #                                   "</i></b> considered an acceptable assumption."
                       

    #         verdict_message += solest

    #     verdict_message += " the usual range for macromolecular " +\
    #                        "crystals, diffracting at similar resolution</b>"
        
    # else:

    if verdict_score>66.0:
        verdict_message += "The estimated solvent fraction is within "
        bottom_line      = "The suggested composition of ASU aligns with " +\
                            "the " + predexp + " solvent fraction and is " +\
                            "<b><i>likely a reasonable assumption</i></b>."
        
    else:
        solest = "above"
        if sol<center:
            solest = "below"
        if nc0==1 and verdict_score>50.0:
            verdict_message += "The estimated solvent fraction is "
            bottom_line      = "Although the suggested composition of ASU "    +\
                               "corresponds to solvent fraction that differs " +\
                               "from the " + predexp + " value, it <b><i>may " +\
                               "still represent a reasonable assumption</i></b>."


        elif verdict_score>33.0:
            verdict_message += "The estimated solvent fraction is noticeably "
            bottom_line      = "The suggested composition of ASU corresponds "   +\
                                "to a noticeable deviation from the " + predexp  +\
                                " value of solvent fraction. However, it <b><i>" +\
                                "could still be considered an acceptable "       +\
                                "assumption</i></b>."

        else:
            verdict_message += "The estimated solvent fraction is substantially "
            if nc0 > 1:
                bottom_line  = "The suggested composition of the ASU exhibits " +\
                               "a significant deviation from the " + predexp    +\
                               " solvent fraction and is <b><i>unlikely to be " +\
                               "accurate</i></b>. <i>Consider increasing the "  +\
                               "number of chains by a factor of " + str(nc0)    +\
                               " (resulting in a total of " +\
                               str(int(ncopies1*nc0)) + " chains)</i>."
            else:
                ratio    = math.ceil ( math.sqrt(abs(sol-50.0))/0.35 ) / 10.0
                ncopies2 = int ( round ( ncopies1/ratio ) )
                if ncopies2<ncopies1 and ncopies1>1:
                    bottom_line  = "The suggested composition of the ASU shows "   +\
                                   "a significant deviation from the " + predexp   +\
                                   "solvent fraction and is <b><i>unlikely to be " +\
                                   "accurate</i></b>. <i>Consider decreasing the " +\
                                   "number of chains by a factor of " + str(ratio) +\
                                   " (resulting in a total of " + str(ncopies2)    +\
                                   " chains)</i>."
                else:
                    bottom_line = "The proposed composition of the ASU shows a "  +\
                                  "significant deviation from the " + predexp     +\
                                  "solvent fraction and is <b><i>unlikely to be " +\
                                  "accurate</i></b>. However, in this <b><i>"     +\
                                  "specific case</i></b>, it <b><i>might be"      +\
                                  "</i></b> considered an acceptable assumption."
        verdict_message += solest

    verdict_message += " the " + predexp + " range</b>"

    bottom_line += "<p>In general, the composition of the ASU remains a hypothesis " +\
                   "until the structure is solved. Solvent content serves more as "  +\
                   "a guideline than a definitive indicator of the accuracy of the " +\
                   "chosen ASU composition. However, inaccurate estimations of "     +\
                   "solvent content can negatively impact phasing and density "      +\
                   "modification procedures, particularly in challenging cases."

    return  (   verdict_score,
                verdict_message,
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
