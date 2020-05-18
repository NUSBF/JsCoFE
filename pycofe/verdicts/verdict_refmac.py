#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    18.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR REFMAC
#
#  Copyright (C) Oleg Kovalevskyi, Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import os

from pycofe.proc import verdict



"""
#  1. Verdict score function

import math, sys

def calcVerdictScore (data,score_type ):

    def score_direct ( x,d ):
        n = len(d)-1
        for j in range(n):
            if d[j]<=x and x<=d[j+1]:
                return (j+(x-d[j])/(d[j+1]-d[j]))/n
        return 1.0

    def score_reverse ( x,d ):
        n = len(d)-1
        for j in range(n):
            if d[j+1]<=x and x<=d[j]:
                return (j+(x-d[j])/(d[j+1]-d[j]))/n
        return 1.0

    score  = 0.0
    weight = 0.0
    for key in data:
        v  = data[key]["value"]
        g  = data[key]["good"]
        b  = data[key]["bad"]
        w  = data[key]["weight"]
        ds = -1.0
        if g[-1]>b[-1]:  # direct order
            if v>=g[0]:
                ds = 1.0 + score_direct(v,g)
            else:
                ds = 1.0 - score_reverse(v,b)
        else:   # reverese order
            if v<=g[0]:
                ds = 1.0 + score_reverse(v,g)
            else:
                ds = 1.0 - score_direct(v,b)

        if score_type==1:
            if ds<1.0e-12:
                return 0.0
            score += w*math.log(ds/2.0)
        else:
            score += w*ds
        weight += w

    if score_type==1:
        return 100.0*math.exp ( score/weight )
    else:
        return 50.0*score/weight
"""

def parseRefmacLog ( logpath ):

    meta = {
        "rfactor"      : [0.0,0.0],
        "rfree"        : [0.0,0.0],
        "bond_length"  : [0.0,0.0],
        "bond_angle"   : [0.0,0.0],
        "chir_volume"  : [0.0,0.0],
        "rfree_cycles" : []
    }

    if os.path.isfile(logpath):

        with open(logpath,"r") as f:
            key = 0
            for line in f:
                if key>0:
                    lst = line.split()
                    if "R factor" in line:
                        meta["rfactor"] = [float(lst[2]),float(lst[3])]
                    elif "R free" in line:
                        meta["rfree"]   = [float(lst[2]),float(lst[3])]
                    elif "Rms BondLength" in line:
                        meta["bond_length"] = [float(lst[2]),float(lst[3])]
                    elif "Rms BondAngle" in line:
                        meta["bond_angle"]  = [float(lst[2]),float(lst[3])]
                    elif "Rms ChirVolume" in line:
                        meta["chir_volume"] = [float(lst[2]),float(lst[3])]
                        break;
                elif line.startswith("Free R factor                        ="):
                    lst = line.split()
                    meta["rfree_cycles"].append ( float(lst[-1]) )
                elif "$TEXT:Result: $$ Final results $$" in line:
                    key = 1

    return meta


#  2. Verdict message generation (not framed as a function, but ideally
#     it should be, feel free to suggest)

def calculate (  meta ) :

    # function to assign resolution bin basing on the bins available in the statistics table
    def assignResolutionBin(res, statInResolutionBins):
        maxRes = min(statInResolutionBins.keys())
        minRes = max(statInResolutionBins.keys())

        if res <= maxRes:
            return maxRes
        elif res >= minRes:
            return minRes
        else:
            resBin = round(res,1)
            if resBin in statInResolutionBins.keys():
                return resBin
            else:
                return None

    # Statistics calculated over PDB for resolution bins
    statInResolutionBins = {
        0.7: {"numberOfRecords": 429, "meanRwork": 0.117, "sigRwork": 0.029, "meanRfree": 0.134, "sigRfree": 0.031,
              "meanRdiff": 0.016, "medianClash": 5.6},
        0.8: {"numberOfRecords": 1211, "meanRwork": 0.128, "sigRwork": 0.029, "meanRfree": 0.148, "sigRfree": 0.030,
              "meanRdiff": 0.019, "medianClash": 4.9},
        0.9: {"numberOfRecords": 2510, "meanRwork": 0.134, "sigRwork": 0.028, "meanRfree": 0.156, "sigRfree": 0.029,
              "meanRdiff": 0.022, "medianClash": 4.5},
        1.0: {"numberOfRecords": 4322, "meanRwork": 0.140, "sigRwork": 0.028, "meanRfree": 0.164, "sigRfree": 0.030,
              "meanRdiff": 0.024, "medianClash": 4.3},
        1.1: {"numberOfRecords": 6651, "meanRwork": 0.146, "sigRwork": 0.028, "meanRfree": 0.172, "sigRfree": 0.030,
              "meanRdiff": 0.025, "medianClash": 4.1},
        1.2: {"numberOfRecords": 10120, "meanRwork": 0.154, "sigRwork": 0.029, "meanRfree": 0.181, "sigRfree": 0.030,
              "meanRdiff": 0.027, "medianClash": 4.0},
        1.3: {"numberOfRecords": 15051, "meanRwork": 0.161, "sigRwork": 0.029, "meanRfree": 0.190, "sigRfree": 0.030,
              "meanRdiff": 0.029, "medianClash": 4.0},
        1.4: {"numberOfRecords": 20456, "meanRwork": 0.168, "sigRwork": 0.028, "meanRfree": 0.198, "sigRfree": 0.030,
              "meanRdiff": 0.030, "medianClash": 4.0},
        1.5: {"numberOfRecords": 26828, "meanRwork": 0.173, "sigRwork": 0.027, "meanRfree": 0.205, "sigRfree": 0.029,
              "meanRdiff": 0.032, "medianClash": 4.1},
        1.6: {"numberOfRecords": 35238, "meanRwork": 0.178, "sigRwork": 0.025, "meanRfree": 0.212, "sigRfree": 0.028,
              "meanRdiff": 0.034, "medianClash": 4.3},
        1.7: {"numberOfRecords": 42651, "meanRwork": 0.181, "sigRwork": 0.025, "meanRfree": 0.217, "sigRfree": 0.028,
              "meanRdiff": 0.036, "medianClash": 4.5},
        1.8: {"numberOfRecords": 49028, "meanRwork": 0.185, "sigRwork": 0.024, "meanRfree": 0.224, "sigRfree": 0.028,
              "meanRdiff": 0.038, "medianClash": 4.8},
        1.9: {"numberOfRecords": 50625, "meanRwork": 0.188, "sigRwork": 0.024, "meanRfree": 0.228, "sigRfree": 0.028,
              "meanRdiff": 0.040, "medianClash": 5.0},
        2.0: {"numberOfRecords": 50342, "meanRwork": 0.190, "sigRwork": 0.024, "meanRfree": 0.233, "sigRfree": 0.028,
              "meanRdiff": 0.042, "medianClash": 5.4},
        2.1: {"numberOfRecords": 47326, "meanRwork": 0.194, "sigRwork": 0.025, "meanRfree": 0.238, "sigRfree": 0.028,
              "meanRdiff": 0.044, "medianClash": 5.9},
        2.2: {"numberOfRecords": 42117, "meanRwork": 0.197, "sigRwork": 0.025, "meanRfree": 0.243, "sigRfree": 0.028,
              "meanRdiff": 0.046, "medianClash": 6.3},
        2.3: {"numberOfRecords": 36516, "meanRwork": 0.200, "sigRwork": 0.025, "meanRfree": 0.248, "sigRfree": 0.028,
              "meanRdiff": 0.048, "medianClash": 7.0},
        2.4: {"numberOfRecords": 33089, "meanRwork": 0.203, "sigRwork": 0.025, "meanRfree": 0.252, "sigRfree": 0.028,
              "meanRdiff": 0.049, "medianClash": 7.6},
        2.5: {"numberOfRecords": 29453, "meanRwork": 0.206, "sigRwork": 0.025, "meanRfree": 0.255, "sigRfree": 0.028,
              "meanRdiff": 0.049, "medianClash": 8.1},
        2.6: {"numberOfRecords": 26127, "meanRwork": 0.209, "sigRwork": 0.026, "meanRfree": 0.259, "sigRfree": 0.028,
              "meanRdiff": 0.050, "medianClash": 9.0},
        2.7: {"numberOfRecords": 23083, "meanRwork": 0.212, "sigRwork": 0.027, "meanRfree": 0.262, "sigRfree": 0.028,
              "meanRdiff": 0.050, "medianClash": 9.7},
        2.8: {"numberOfRecords": 19521, "meanRwork": 0.215, "sigRwork": 0.027, "meanRfree": 0.264, "sigRfree": 0.029,
              "meanRdiff": 0.050, "medianClash": 10.6},
        2.9: {"numberOfRecords": 16236, "meanRwork": 0.217, "sigRwork": 0.029, "meanRfree": 0.266, "sigRfree": 0.030,
              "meanRdiff": 0.049, "medianClash": 11.4},
        # From this resolution and down sigRfree is artificial to keep valuation in the reasonable range
        3.0: {"numberOfRecords": 13566, "meanRwork": 0.220, "sigRwork": 0.030, "meanRfree": 0.269, "sigRfree": 0.03,
              "meanRdiff": 0.049, "medianClash": 12.3},
        3.1: {"numberOfRecords": 10088, "meanRwork": 0.223, "sigRwork": 0.032, "meanRfree": 0.271, "sigRfree": 0.03,
              "meanRdiff": 0.048, "medianClash": 12.9},
        3.2: {"numberOfRecords": 7819, "meanRwork": 0.226, "sigRwork": 0.034, "meanRfree": 0.273, "sigRfree": 0.03,
              "meanRdiff": 0.047, "medianClash": 13.4},
        3.3: {"numberOfRecords": 5633, "meanRwork": 0.232, "sigRwork": 0.037, "meanRfree": 0.277, "sigRfree": 0.03,
              "meanRdiff": 0.045, "medianClash": 13.4},
        3.4: {"numberOfRecords": 4437, "meanRwork": 0.236, "sigRwork": 0.039, "meanRfree": 0.280, "sigRfree": 0.03,
              "meanRdiff": 0.044, "medianClash": 13.6},
        3.5: {"numberOfRecords": 3037, "meanRwork": 0.242, "sigRwork": 0.045, "meanRfree": 0.283, "sigRfree": 0.03,
              "meanRdiff": 0.042, "medianClash": 13.6},
        3.6: {"numberOfRecords": 2276, "meanRwork": 0.249, "sigRwork": 0.048, "meanRfree": 0.288, "sigRfree": 0.03,
              "meanRdiff": 0.040, "medianClash": 13.9},
        3.7: {"numberOfRecords": 1800, "meanRwork": 0.255, "sigRwork": 0.051, "meanRfree": 0.293, "sigRfree": 0.03,
              "meanRdiff": 0.038, "medianClash": 13.7},
        3.8: {"numberOfRecords": 1259, "meanRwork": 0.262, "sigRwork": 0.054, "meanRfree": 0.298, "sigRfree": 0.03,
              "meanRdiff": 0.036, "medianClash": 13.5},
        3.9: {"numberOfRecords": 944, "meanRwork": 0.270, "sigRwork": 0.064, "meanRfree": 0.303, "sigRfree": 0.03,
              "meanRdiff": 0.033, "medianClash": 13.3},
        4.0: {"numberOfRecords": 826, "meanRwork": 0.273, "sigRwork": 0.059, "meanRfree": 0.307, "sigRfree": 0.03,
              "meanRdiff": 0.034, "medianClash": 13.2},
        4.1: {"numberOfRecords": 638, "meanRwork": 0.277, "sigRwork": 0.063, "meanRfree": 0.310, "sigRfree": 0.03,
              "meanRdiff": 0.033, "medianClash": 12.9},
        4.2: {"numberOfRecords": 484, "meanRwork": 0.281, "sigRwork": 0.066, "meanRfree": 0.313, "sigRfree": 0.03,
              "meanRdiff": 0.032, "medianClash": 13.0}
    }
    # Clashscore: very worst structures in the PDB: 433.01 434.85 486.04 509.76 583.89 1044.3 so I would put realistic maximum as 500
    # Minimum starts with -1, then many 0, then range starting from 0. I would put minimum as 0 then.
    # Calculated sigmas for clashscore make no sense due to huge deviation, will use some fixed empirical values


    # Eugene, please put here initialisation with real values from the refinement job
    # Initialisation of all values used in verdict
    #

    """
    # Values from the data
    res = 2.284  # Resolution

    # Values from current refinement run
    rFree = 0.25  # Rfree after refinement
    rWork = 0.15  # Rwork after refinement
    rFreeBefore = 0.3  #  Rfree before refinement (starting value)
    rWorkBefore = 0.25  # Rwork before refinement (starting value)
    clashScore = 10.0  # clash score from MolProbity report after refinement
    rmsBondDistance = 0.02  # rms Bond Distance (length) from Refmac, after refinement
    allCyclesRfree = (0.4, 0.3, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2)  # List of Rfree values after each cycle of refinement (length chould be equal to ncyc)

    # Input values for this refinement run
    ncyc = 10 # number of cycles in this refinement run
    twinning = False # I don't see twinning parameter in the Cloud REFMAC interface at the moment (15% of low resolution structures are twins)
    jellyBody = False # whether jelly-body was used or not
    ncsRestraints = False # whether NCS restraints were used or not
    tls = False # whether TLS refinement was used or not
    anisotropicBfact = False # Whether anisotropic B-factors were used
    hydrogens = False # Whether hydrogens were used for refinement
    """

    res              = meta["data"]["resolution"] # Resolution

    # ------- Values from current refinement run

    rFree            = meta["refmac"]["rfree"  ][1]      # Rfree after refinement
    rWork            = meta["refmac"]["rfactor"][1]      # Rwork after refinement
    rFreeBefore      = meta["refmac"]["rfree"  ][0]      # Rfree before refinement (starting value)
    rWorkBefore      = meta["refmac"]["rfactor"][0]      # Rwork before refinement (starting value)
    clashScore       = meta["molprobity"]["clashscore"]  # clash score from MolProbity report after refinement
    rmsBondDistance  = meta["refmac"]["bond_length"][1]  # rms Bond Distance (length) from Refmac, after refinement
    allCyclesRfree   = meta["refmac"]["rfree_cycles"]    # List of Rfree values after each cycle of refinement
                                                         # (length chould be equal to ncyc)

    # ------- Input values for this refinement run

    ncyc             = meta["params"]["refmac"]["ncycles"   ]  # number of cycles in this refinement run
    twinning         = meta["params"]["refmac"]["twinning"  ]  # I don't see twinning parameter in the Cloud REFMAC interface at the moment (15% of low resolution structures are twins)
    jellyBody        = meta["params"]["refmac"]["jellyBody" ]  # whether jelly-body was used or not
    ncsRestraints    = meta["params"]["refmac"]["ncsRestr"  ]  # whether NCS restraints were used or not
    tls              = meta["params"]["refmac"]["tls"       ]  # whether TLS refinement was used or not
    anisotropicBfact = meta["params"]["refmac"]["anisoBfact"]  # Whether anisotropic B-factors were used
    hydrogens        = meta["params"]["refmac"]["hydrogens" ]  # Whether hydrogens were used for refinement

    #
    # End of initialisation. Below operating with these values only

    resBin = assignResolutionBin ( res,statInResolutionBins )
    if resBin is None:
        return ( -1.0,"resolution bin calculation failed, resolution=" + str(res),"" )

    meanRfree = statInResolutionBins[resBin]['meanRfree'] # Mean Rfree for the given resolution
    sigRfree = statInResolutionBins[resBin]['sigRfree'] # sigma (standard deviation) of Rfree for the given resolution
    medianClash = statInResolutionBins[resBin]['medianClash'] # median MolProbity clash score for the given resolution
    deviationFromIdealRMSbondDistance = abs(0.015 - rmsBondDistance) # ideal range is [0.01 - 0.02]

    verdict_score = verdict.calcVerdictScore ({
        "Rfree" : { "value"  : rFree,
                    "weight" : 2.0,
                    "good"   : [meanRfree + (3.5*sigRfree), meanRfree + (2.0*sigRfree),  meanRfree, meanRfree - (2.0*sigRfree)],
                    "bad"    : [meanRfree + (3.5*sigRfree), meanRfree + (5.0*sigRfree),  0.5,       0.6]
                  },
        "clashScore": {"value" : clashScore,
                  "weight"     : 1.0,
                  "good"       : [medianClash + 5.0, medianClash + 3.0,  medianClash,  0],
                  "bad"        : [medianClash + 5.0, medianClash + 10.0, 25, 500]
                  },
        "deviationFromIdealRMSbondDistance": {"value" : deviationFromIdealRMSbondDistance,
                       "weight"     : 1.0,
                       "good"       : [0.008, 0.005, 0.0025, 0],
                       "bad"        : [0.008, 0.012, 0.015, 0.02]
                       },

    }, 1)

    verdict_message = "<b style='font-size:18px;'>"
    if verdict_score>=83:
        verdict_message += "Well done! Overall quality of the structure is comparable " +\
                           "to the quality of structures deposited to the PDB at this resolution"
    elif verdict_score>=67:
        verdict_message += "Good job! Overall quality of the structure is very reasonable " +\
                           "and could be further improved"
    elif verdict_score>=34:
        verdict_message += "Fair enough. Overall quality of the structure could be better, "+\
                            "some bits are probably missing"
    else:
        verdict_message += "Not acceptable. Overall quality of the structure is critically low, " \
                           "most likely significant parts of the structure are missing"
    verdict_message += "</b>"


    notes = []
    if rFree >= (meanRfree + (5.0*sigRfree)):
        notes.append ( "<i>Rfree</i> is critically high; is your model complete?" )
    elif rFree >= (meanRfree + (2.0 * sigRfree)):
        notes.append("<i>Rfree</i> is high; are bits of the structure missing?")
    elif rFree > (meanRfree + (0.5 * sigRfree)):
        notes.append("<i>Rfree</i> is a bit higher than optimal")
    if clashScore >= (medianClash + 10.0):
        notes.append ( "<i>ClashScore</i> is critically high; model contains severe clashes" )
    elif clashScore >= (medianClash + 5.0):
        notes.append ( "<i>ClashScore</i> is high; model contains some clashes" )
    if rmsBondDistance >= 0.02:
        notes.append ( "<i>RMS Bond Length</i> is high; consider decreasing geometry weight to tighten geometry" )
    if rmsBondDistance <= 0.01:
        notes.append ( "<i>RMS Bond Length</i> is low; consider increasing geometry weight to loose geometry" )

    if len(notes)<=0:
        notes.append ( "all scores are fairly reasonable" )

    if len(notes)>0:
        verdict_message += "<ul><li>" + "</li><li>".join(notes) +\
                           ".</li></ul>"


    #  3. Bottom line generation (not framed as a function, but ideally
    #     it should be, feel free to suggest)
    bottomline = "&nbsp;<br>"

    # Interpretation of the results and advice to user. Not sure about the best way of making HTML code for these messages.
    # I am trying to arrange advices from more general to more specific, so that their order makes sense.
    #
    # 1. Checking for number of cycles. If structure is not ideal, suggest running at least 10 cycles
    if verdict_score < 83.0: # on the latest stages of refinement we allow 1-2 cycles to recalculate map
        if ncyc < 10:
            bottomline += "While overall quality of the structure is below deposition quality, " +\
                            "we recommend running at least 10 refinement cycles"
            if res >= 3.0:
                bottomline += ". At low resolution: up to 20 cycles; if you are using restraints from homologues, " +\
                              "up to 40 cycles"
            bottomline += ".<p>"

    # 2. Checking that Rfree reached plateau
    if verdict_score < 83.0: # on the latest stages of refinement we allow users 1-2 cycles to recalculate map
        if len(allCyclesRfree) >= 5:
            # a bit arbitrary - if Rfree for the last 4 cycles changes more than 0.3%
            if abs(allCyclesRfree[-4] - allCyclesRfree[-1]) > 0.003:
                bottomline += "It looks like <i>R<sub>free</sub></i> did not reach the plateau. " +\
                              "We recommend running more refinement cycles.<p>"

    # 3. Twinning. We need to discuss with Andrey best way of handling twinning across whole system (puit in metadata?)
    # PROPER IMPLEMENTATION LEFT FOR LATER
    if twinning:
        if rFree > 0.4:
            bottomline += "It is not advised to use twinning parameter if <i>R<sub>free</sub></i> is higher than 40%. " +\
                          "Please re-refine with twinning off. You can switch twinning on later, " +\
                          "once your <i>R<sub>free</sub></i> is below 40%.<p>"

    # 4. Completness of the structure. If we have theoretical number of residues/chains in ASU and actual content of the model,
    # we can suggest user to build more residues or add more subunits.
    # PROPER IMPLEMENTATION LEFT FOR LATER
    if rFree > 0.4:
        bottomline += "High <i>R<sub>free</sub></i> means that either your model is incomplete or poorly fitted. " +\
                      "In the first case please try adding more subunits via molecular replacement " +\
                      "or building missing parts of the model. In the second case, if your model is " +\
                      "straight after molecular replacement, please try running 100-200 refinement cycles"
        if res > 3.0:
            bottomline += " with jelly-body restraints on"
        bottomline += ".<p>"

    # 5. High clash score. Normally resolved by increasing weight of VDW repulsion and adding hydrogens
    if clashScore > (medianClash + 5.0):
        bottomline += "MolProbity clash score for the structure seems high. You can try to switch on option for" +\
                      "generation of hydrogen atoms during refinement. Also, you can try to increase weight for VDW " +\
                      "repulsion by putting following command into 'Additional keywords' of the " +\
                      "'Advaced' parameters section: <i>vdwrestraints 2.0</i> . Value for restraints weight" +\
                      "is subject to optimisation.<p>"

    # 6. Bond lengths (distances) deviation (regardless of resolution)
    if rmsBondDistance >= 0.02:
        bottomline += "RMS deviation of bond lengths for the structure is too high. We recommend to tighten up " +\
                      "geometry by reducing 'Overall data-geometry weight' parameter.<p>"
    if rmsBondDistance <= 0.01:
        bottomline += "RMS deviation of bond lengths for the structure is too low. We recommend to loose " +\
                      "geometry by increasing 'Overall data-geometry weight' parameter.<p>"

    # 7. Overfitting detection.
    # Ask Garib about possible effects of TLS, NCS and B-factors modelling on overfitting (I am not sure)
    rDiff = rFree - rWork
    rDiffBefore = rFreeBefore - rWorkBefore
    meanRdiff = statInResolutionBins[resBin]['meanRdiff']
    if rDiff < 0.0:
        bottomline += "The difference between <i>R<sub>free</sub></i> and <i>R<sub>work</sub></i> is negative; " +\
                      "something is really wrong with assignment of the free R set.<p>"
    elif rDiff <= (meanRdiff - 0.01):
        bottomline += "The difference between <i>R<sub>free</sub></i> and <i>R<sub>work</sub></i> " +\
                      "is smaller than expected. " +\
                      "Something is wrong with assignment of free R set or try to run more refinement cycles.<p>"
    elif (rDiff > (meanRdiff + 0.01)) and (rDiffBefore < rDiff):
        bottomline += "The difference between <i>R<sub>free</sub></i> and <i>R<sub>work</sub></i> " +\
                      "is larger than expected indicating overfitting. "
        if res >= 3.0:
            bottomline += "Please consider jelly-body refinement (Restraints -> Use jelly-body restraints). " +\
                           "You can also reduce overfitting by tightening up " +\
                           "geometry via decreasing 'Overall data-geometry weight' parameter.<p>"
        else:
            bottomline += "You can reduce overfitting by tightening up " +\
                      "geometry via decreasing 'Overall data-geometry weight' parameter.<p>"

    # 8. Problems specific to low resolution. Advices for higher Rfree.
    if res >= 3.0:
        if (rFree > meanRfree) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected. " +\
                          "Try building more residues/ligands. "
            if not ncsRestraints:
                bottomline += "Try introducing NCS restraints if you have several identical subunits in the asymmetric" +\
                          "unt. " # It is better to check number of subunits in ASU before this advice
            else:
                bottomline += "Try changing type of NCS restraints (between local and global). "
            if not jellyBody:
                bottomline += "Try jelly-body refinement. "
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected. " +\
                          "Try building more residues/ligands. Check your data for twinning. "
            if not ncsRestraints:
                bottomline += "Try introducing NCS restraints if you have several identical subunits in the asymmetric" +\
                          "unt. " # It is better to check number of subunits in ASU before this advice
            else:
                bottomline += "Try changing type of NCS restraints (between local and global). "
            if not jellyBody:
                bottomline += "Try 20-50 cycles of jelly-body refinement. "
            bottomline += "Try LORESTR for automated refinement with restraints from homologous structures. <p>"


    # 9. Problems specific to medium resolution. Advices for higher Rfree
    elif res >= 2.0:
        if (rFree > meanRfree) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected. " +\
                          "Try building more residues/ligands/waters/metals. "
            if not ncsRestraints:
                bottomline += "Try introducing local NCS restraints if you have several identical subunits in " \
                              "the asymmetric unit. "  # It is better to check number of subunits in ASU before this advice
            else:
                bottomline += "If NCS restraints don't positively contribute to your refinement, try switching them off. "

            if not tls:
                bottomline += "Try TLS refinement. "
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected. " +\
                          "Try building more residues/ligands/waters/metals. Check your data for twinning."
            if not ncsRestraints:
                bottomline += "Try introducing local NCS restraints if you have several identical subunits in the asymmetric" +\
                          "unt. " # It is better to check number of subunits in ASU before this advice

    # 10. Problems specific to higher resolution. Advices for higher Rfree
    elif res >= 1.6:
        if (rFree > meanRfree) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected. " +\
                          "Try building more residues/ligands/waters/metals. "
            if not tls:
                bottomline += "Try TLS refinement. "
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected. " +\
                          "Try building more residues/ligands/waters/metals. Check your data for twinning."

    # 12. Problems specific to subatomic and atomic resolution. Advices for higher Rfree
    else:
        if (rFree > meanRfree) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected. " +\
                          "Try building more residues/ligands/waters/metals/alternative conformations. "
            if not anisotropicBfact:
                bottomline += "Try anisotropic B-factors. "
            if not hydrogens:
                bottomline += "Try adding hydrogens. "
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected. " +\
                          "Try building more residues/ligands/waters/metals. Check your data for twinning."

    return (verdict_score,verdict_message,bottomline)


def putVerdictWidget ( body,verdict_meta,verdict_row ):

    body.flush()
    body.file_stdout.close()
    verdict_meta["refmac"] = parseRefmacLog ( body.file_stdout_path() )
    # continue writing to stdout
    body.file_stdout = open ( body.file_stdout_path(),"a" )


    verdict_score, verdict_message, bottomline = calculate ( verdict_meta )

    body.putMessage1 ( body.report_page_id(),"&nbsp;",verdict_row )  # just a spacer

    verdict.makeVerdictSection ( body,{
        "title": "Refinement summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "rows" : [
            { "header": { "label"  : "R-factor",
                          "tooltip": "R-factor for working set"},
              "data"   : [ str(verdict_meta["refmac"]["rfactor"][1]) ]
            },
            { "header": { "label"  : "R<sub>free</sub>",
                          "tooltip": "Free R-factor"},
              "data"  : [ str(verdict_meta["refmac"]["rfree"][1]) ]
            },
            { "header": { "label"  : "Bond length rms",
                          "tooltip": "Bond length r.m.s.d."},
              "data"  : [ str(verdict_meta["refmac"]["bond_length"][1]) ]
            },
            { "header": { "label"  : "Clash score",
                          "tooltip": "Molprobity clash score" },
              "data"  : [ str(verdict_meta["molprobity"]["clashscore"]) ]
            }
        ]
    },verdict_score,verdict_message,bottomline,row=verdict_row+1 )

    return



def main():

    verdict_score,verdict_message,bottomline = calculate()

    if verdict_score<0.0:  # error
        print ( verdict_message )
    else:
        print ( verdict_score   )
        print ( verdict_message )
        print ( bottomline      )


if __name__ == '__main__':
    main()
