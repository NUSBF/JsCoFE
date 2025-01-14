#!/usr/bin/python

#
# ============================================================================
#
#    26.10.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR REFMAC
#
#  Copyright (C) Oleg Kovalevskiy, Eugene Krissinel, Andrey Lebedev 2020-2023
#
# ============================================================================
#

import os, math, json

from pycofe.proc import verdict

# #  1. Verdict score function
#
# import math, sys
#
# def calcVerdictScore (data,score_type ):
#
#     def score_direct ( x,d ):
#         n = len(d)-1
#         for j in range(n):
#             if d[j]<=x and x<=d[j+1]:
#                 return (j+(x-d[j])/(d[j+1]-d[j]))/n
#         return 1.0
#
#     def score_reverse ( x,d ):
#         n = len(d)-1
#         for j in range(n):
#             if d[j+1]<=x and x<=d[j]:
#                 return (j+(x-d[j])/(d[j+1]-d[j]))/n
#         return 1.0
#
#     score  = 0.0
#     weight = 0.0
#     for key in data:
#         v  = data[key]["value"]
#         g  = data[key]["good"]
#         b  = data[key]["bad"]
#         w  = data[key]["weight"]
#         ds = -1.0
#         if g[-1]>b[-1]:  # direct order
#             if v>=g[0]:
#                 ds = 1.0 + score_direct(v,g)
#             else:
#                 ds = 1.0 - score_reverse(v,b)
#         else:   # reverese order
#             if v<=g[0]:
#                 ds = 1.0 + score_reverse(v,g)
#             else:
#                 ds = 1.0 - score_direct(v,b)
#
#         if score_type==1:
#             if ds<1.0e-12:
#                 return 0.0
#             score += w*math.log(ds/2.0)
#         else:
#             score += w*ds
#         weight += w
#
#     if score_type==1:
#         return 100.0*math.exp ( score/weight )
#     else:
#         return 50.0*score/weight


def parseRefmacLog ( logpath ):

    meta = {
        "weight"       : 0.0,
        "rfactor"      : [0.0,0.0],
        "rfree"        : [0.0,0.0],
        "bond_length"  : [0.0,0.0],
        "bond_angle"   : [0.0,0.0],
        "chir_volume"  : [0.0,0.0],
        "rfree_cycles" : [],
        "params" : {
            "refmac" : {
                "ncycles"    : 10,
                "twinning"   : False,
                "jellyBody"  : False,
                "ncsRestr"   : False,
                "tls"        : False,
                "anisoBfact" : False,
                "hydrogens"  : False,
                "vdw_val"    : ''
            }
        }
    }

    if os.path.isfile(logpath):

        with open(logpath,"r") as f:
            key = 0
            for line in f:
                if "Weight matrix" in line:
                    lst = line.split()
                    meta["weight"] = float(lst[2])
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
                        break
                elif "Data line---" in line:
                    uline = line.upper()
                    lst   = uline.split()
                    if "NCYC" in uline:
                        meta["params"]["refmac"]["ncycles"] = int(lst[-1])
                    elif "TWIN" in uline:
                        meta["params"]["refmac"]["twinning"] = True
                    elif "RIDG" in uline:
                        meta["params"]["refmac"]["jellyBody"] = True
                    elif "NCSR" in uline:
                        meta["params"]["refmac"]["ncsRestr"] = True
                    elif "TLSC" in uline:
                        meta["params"]["refmac"]["tls"] = True
                    elif "BREF" in uline:
                        meta["params"]["refmac"]["anisoBfact"] = (lst[-1]=="ANIS")
                    elif "HYDR" in uline:
                        meta["params"]["refmac"]["hydrogens"] = (lst[-1]=="YES")
                    elif "VDWRESTRAINTS" in uline:
                        meta["params"]["refmac"]["vdw_val"] = lst[-1]
                elif line.startswith("Free R factor                        ="):
                    lst = line.split()
                    meta["rfree_cycles"].append ( float(lst[-1]) )
                elif "$TEXT:Result: $$ Final results $$" in line:
                    key = 1

                # "twinning"   : False,
                # "jellyBody"  : False,
                # "ncsRestr"   : False,
                # "tls"        : False,
                #
                # "anisoBfact" : False,
                # "hydrogens"  : False
                #
                # Data line--- LABIN FP=F SIGFP=SIGF FREE=FreeR_flag
                #   Data line--- NCYC 40
                #   Data line--- WEIGHT AUTO
                #   Data line--- MAKE HYDR NO
                #   Data line--- REFI BREF ISOT
                #   Data line--- SCALE TYPE SIMPLE
                #   Data line--- SOLVENT YES
                #   Data line--- NCSR LOCAL
                #   Data line--- REFI RESO 61.93 1.25
                #   Data line--- MAKE NEWLIGAND EXIT
                #   Data line--- Pdbout keep true
                #   Data line--- END

    return meta


def calculateWeightRatio(distRatio):
    # this nice empirical equation was figured out by analysis of 600 REFMAC5 (5.8.0267 - 24/08/20) runs
    # at different resolutions, curve fitting in Excel (R^2 = 0.998) and praising the Lord
    return 0.99 * (distRatio ** 1.46)

def plateauReached(rFreeList):
    # returns True or False. Rule is a bit arbitrary - subject to optimisation in the future
    # if Rfree for the last 4 cycles changes more than 0.3% - no plateau
    if len(rFreeList) >=5:
        if abs(rFreeList[-4] - rFreeList[-1]) > 0.003:
            return False
        else:
            return True
    elif len(rFreeList) >= 2:
        if abs(rFreeList[0] - rFreeList[-1]) > 0.003:
            return False
        else:
            return True
    else:
        # You don't reach plateau in one cycle
        return False


def getNcyclesToPlateau(rFreeList):
    # returns number of cycles that required to reach plateau
    if not plateauReached(rFreeList):
        return len(rFreeList) + 5
    else:
        ncycsToPlateau = 0
        for i in range(len(rFreeList), 1, -1): # backwards with step of -1
            if not plateauReached(rFreeList[0:i]):
                ncycsToPlateau = i + 1
                break
        return ncycsToPlateau


#  2. Verdict message generation (not framed as a function, but ideally
#     it should be, feel free to suggest)

def calculate ( meta ) :

    # calculating sequence identity
    def sequenceIdentity(sequence1, sequence2):
        from mmtbx.alignment import align
        align_obj = align(seq_a=sequence1, seq_b=sequence2)
        alignment = align_obj.extract_alignment()
        numberOfIdenticalResidues = len(''.join(alignment.matches().split()))
        seqIdentity = float(numberOfIdenticalResidues) / float(max([len(sequence1), len(sequence2)]))
        return seqIdentity

    def isNCSpresentInChains(chains):
        MinimalSequenceIdentityForNCS = 0.8
        i = 0
        for chain1 in chains:
            i += 1
            if chain1['type'] == 'Protein':
                for chain2 in chains[i:]:
                    if chain2['type'] == 'Protein':
                        if sequenceIdentity(chain1['seq'], chain2['seq']) > MinimalSequenceIdentityForNCS:
                            return True
        return False


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
    weight           = meta["refmac"]["weight"]          # geometry weight from last cycle

    # ------- Input values for this refinement run
    ncyc             = meta["params"]["refmac"]["ncycles"   ]  # number of cycles in this refinement run
    twinning         = meta["params"]["refmac"]["twinning"  ]  # I don't see twinning parameter in the Cloud REFMAC interface at the moment (15% of low resolution structures are twins)
    jellyBody        = meta["params"]["refmac"]["jellyBody" ]  # whether jelly-body was used or not
    ncsRestraints    = meta["params"]["refmac"]["ncsRestr"  ]  # whether NCS restraints were used or not
    tls              = meta["params"]["refmac"]["tls"       ]  # whether TLS refinement was used or not
    anisotropicBfact = meta["params"]["refmac"]["anisoBfact"]  # Whether anisotropic B-factors were used
    hydrogens        = meta["params"]["refmac"]["hydrogens" ]  # Whether hydrogens were used for refinement
    vdw_val          = meta["params"]["refmac"]["vdw_val" ]    # Whether vdw_val were used for refinement
    #
    # End of initialisation. Below operating with these values only

    # Some analysis for smart decision making
    listOfModels = meta['xyzmeta']['xyz']
    allChains = []
    for model in listOfModels:
        allChains += model['chains']
    isNCSpresent = isNCSpresentInChains(allChains)
    ramaOutliers = float(meta['molprobity']['rama_outliers'])
    suggestChangingGeomWeight = False
    suggestIncreasingGeomWeight = False
    suggestVDW = False
    # End of analysis

    # Suggested parameters for the next REFMAC run (structure matches actual REFMAC interface parameters tree)
    # actual parameters sit in the 'contains' dictionary in the different sections
    suggestedParameters = {}

    # Figuring out statistical values for evaluation of the current case
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
                           "to the quality of structures deposited to the PDB at given resolution"
    elif verdict_score>=67:
        verdict_message += "Good job! Overall quality of the structure is rather reasonable " +\
                           "but could be further improved"
    elif verdict_score>=34:
        verdict_message += "Fair. Overall quality of the structure could be better, "+\
                           "either part of structure is missing or geometrical quality is poor"
    else:
        verdict_message += "Not good enough. Overall quality of the structure is low. " \
                           "Most likely, significant parts of the structure are missing"
    verdict_message += "</b>"


    notes = []
    if rFree >= (meanRfree + (5.0*sigRfree)):
        notes.append ( "<i>Rfree</i> is critically high; is your model complete?" )
    elif rFree >= (meanRfree + (2.0 * sigRfree)):
        notes.append("<i>Rfree</i> is high; are bits of the structure missing?")
    elif rFree > (meanRfree + (0.5 * sigRfree)):
        notes.append("<i>Rfree</i> is a bit higher than optimal")
    if clashScore >= (medianClash + 10.0):
        notes.append ( "<i>Clash Score</i> is critically high; model contains severe clashes" )
    elif clashScore >= (medianClash + 5.0):
        notes.append ( "<i>Clash Score</i> is high; model contains some clashes" )
    if rmsBondDistance >= 0.02:
        notes.append ( "<i>RMS Bond Length</i> is high" )
    if rmsBondDistance <= 0.01:
        notes.append ( "<i>RMS Bond Length</i> is low" )

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
            bottomline += "While the overall quality of the structure is below " +\
                          "deposition standards, " +\
                          "we recommend running at least 10 refinement cycles"
            suggestedParameters['NCYC'] = '10'
            if res >= 3.0:
                bottomline += " at moderate and high resolution (higher than 3&Aring). " +\
                              "At lower resolution: up to 20 cycles; if you are using restraints from homologues, " +\
                              "up to 40 cycles"
                suggestedParameters['NCYC'] = '20'
            bottomline += ".<p>"

    # 2. Checking that Rfree reached plateau
    if verdict_score < 83.0: # on the latest stages of refinement we allow users 1-2 cycles to recalculate map
        if len(allCyclesRfree) >= 5:
            if not plateauReached(allCyclesRfree):
                bottomline += "It looks like <i>R<sub>free</sub></i> did not reach the plateau. " +\
                              "We recommend running more refinement cycles.<p>"
                if 'NCYC' in suggestedParameters :
                    # giving 50% more cycles
                    if int(math.ceil(ncyc * 1.5)) > int(suggestedParameters['NCYC']):
                        # giving 50% more cycles
                        suggestedParameters['NCYC'] = str(int(math.ceil(ncyc * 1.5)))
                else:
                    suggestedParameters['NCYC'] = str(int(math.ceil(ncyc * 1.5)))

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
                      "straight after molecular replacement, please try running 50-200 refinement cycles"
        # questionable, should check for MR job upstream (distinguish between incomplete solution and full badly fitted case)
        if ncyc < 50:
            suggestedParameters['NCYC'] = '50'
        if res > 3.0:
            bottomline += " with jelly-body restraints on"
            if not jellyBody:
                suggestedParameters['JELLY'      ] = 'yes'
                suggestedParameters['JELLY_SIGMA'] = '0.01'
                suggestedParameters['JELLY_DMAX' ] = '4.2'
        bottomline += ".<p>"

    # 5. High clash score. Normally resolved by increasing weight of VDW repulsion and adding hydrogens
    if clashScore > (medianClash + 10.0):
        if vdw_val:
            oldVdwVal = float(vdw_val)
            newVdwVal = '%0.1f' % (oldVdwVal * 2.0)
        else:
            newVdwVal = '2.0'
        bottomline += "MolProbity clash score of %0.1f for the structure seems quite high " % clashScore +\
                      "(median clash score for your resolution is %0.1f). "  % medianClash
        if not hydrogens:
            bottomline += "We recommend to switch on option for " +\
                      "generation of hydrogen atoms during refinement. "
            suggestedParameters['MKHYDR'] = 'ALL'

        bottomline += "Please increase " +\
                      "the weight for the VDW repulsion by setting up 2.0 or higher (we recommend %s) for the " % newVdwVal +\
                      "'VDW repulsion weight' parameter. Value for the " +\
                      "restraints weight is subject to optimisation.<p>"
        if float(newVdwVal) < 5.0:
            suggestVDW = True
            suggestedParameters['VDW_VAL'] = newVdwVal

    elif clashScore > (medianClash + (medianClash * 0.25)):
        if vdw_val:
            oldVdwVal = float(vdw_val)
            newVdwVal = '%0.1f' % (oldVdwVal * 1.5)
        else:
            newVdwVal = '2.0'
        bottomline += "MolProbity clash score of %0.1f for the structure seems a bit higher than optimal " % clashScore +\
                      "(median clash score for your resolution is %0.1f). "  % medianClash
        if not hydrogens:
            bottomline += "We recommend to switch on option for " + \
                          "generation of hydrogen atoms during refinement. "
            suggestedParameters['MKHYDR'] = 'ALL'

        bottomline += "Please increase the weight for the VDW repulsion by setting up 2.0 or higher (we recommend %s) " % newVdwVal +\
                      "for the 'VDW repulsion weight' parameter. Value for the " +\
                      "restraints weight is subject to optimisation.<p>"
        if float(newVdwVal) < 5.0:
            suggestVDW = True
            suggestedParameters['VDW_VAL'] = newVdwVal

    # 6. Bond lengths (distances) deviation (regardless of resolution)
    if rmsBondDistance > 0.02:
        suggestChangingGeomWeight = True
        suggestIncreasingGeomWeight = False
        if suggestVDW:
            distRatio = 0.01 / rmsBondDistance
        else:
            distRatio = 0.015 / rmsBondDistance
        if distRatio != 0.0:
            newWeight = weight * calculateWeightRatio(distRatio)
        else:
            newWeight = weight * 0.8
        bottomline += "RMS deviation of bond lengths for the structure is too high " +\
                      "(%0.4f, while optimal range is between 0.01 and 0.02). " % rmsBondDistance +\
                      "We recommend to tighten up the geometry by reducing the " +\
                      "'Overall data-geometry weight' parameter (for example, to %0.4f).<p>" % newWeight
        if newWeight != 0.0:
            suggestedParameters['WAUTO_YES'] = 'no'
            suggestedParameters['WAUTO_VAL'] = str(newWeight)

    if rmsBondDistance < 0.01:
        suggestChangingGeomWeight = True
        suggestIncreasingGeomWeight = True
        distRatio = 0.0
        if rmsBondDistance>0.0:
            if suggestVDW:
                distRatio = 0.01 / rmsBondDistance
            else:
                distRatio = 0.015 / rmsBondDistance
        if distRatio != 0.0:
            newWeight = weight * calculateWeightRatio(distRatio)
        else:
            newWeight = weight * 1.2
        bottomline += "RMS deviation of bond lengths for the structure is too low " +\
                      "(%0.4f, while optimal range is between 0.01 and 0.02). " % rmsBondDistance +\
                      "We recommend to loose the geometry by increasing the " +\
                      "'Overall data-geometry weight' parameter (for example, to %0.4f).<p>" % newWeight
        if newWeight != 0.0:
            suggestedParameters['WAUTO_YES'] = 'no'
            suggestedParameters['WAUTO_VAL'] = str(newWeight)


    # 7. Ramachandran and other geometry
    if ramaOutliers > 0.0:
        bottomline += "According to MolProbity analysis, the structure seems to have " +\
                      "Ramachandran outliers (%0.1f %%); " % ramaOutliers +\
                      "please examine those carefully.<p>"

    # 8. Overfitting detection.
    # Ask Garib about possible effects of TLS, NCS and B-factors modelling on overfitting (I am not sure)
    rDiff = rFree - rWork
    rDiffBefore = rFreeBefore - rWorkBefore
    meanRdiff = statInResolutionBins[resBin]['meanRdiff']
    if rDiff < 0.0:
        bottomline += "The difference between <i>R<sub>free</sub></i> and <i>R<sub>work</sub></i> is negative; " +\
                      "something is really wrong with the assignment of the free R set.<p>"
    elif rDiff <= (meanRdiff - 0.01):
        bottomline += "The difference between <i>R<sub>free</sub></i> and <i>R<sub>work</sub></i> " +\
                      "is smaller than expected (%0.3f). It could be something wrong with the assignment of free R set" % (rDiff) +\
                      "or not enough refinement cycles. Try to run more refinement cycles, rebuild the model and double check free R assignment.<p>"
    elif (rDiff > (meanRdiff + 0.01)) and (rDiffBefore < rDiff):
        bottomline += "The difference between <i>R<sub>free</sub></i> and <i>R<sub>work</sub></i> " +\
                      "is larger than expected (%0.3f), " % (rDiff) +\
                      "indicating potential overfitting. "
        if res >= 3.0:
            if not suggestChangingGeomWeight:
                bottomline += "Please consider jelly-body refinement (Restraints -> Use jelly-body restraints). " +\
                               "You can also reduce overfitting by tightening up " +\
                               "geometry via decreasing 'Overall data-geometry weight' parameter.<p>"
            else:
                if suggestIncreasingGeomWeight:
                    bottomline += "Please consider jelly-body refinement (Restraints -> Use jelly-body restraints).<p>"
                else:
                    bottomline += "Please consider jelly-body refinement (Restraints -> Use jelly-body restraints). " + \
                              "You can also reduce overfitting by tightening up " + \
                              "geometry via decreasing 'Overall data-geometry weight' parameter.<p>"
            if not jellyBody:
                suggestedParameters['JELLY'      ] = 'yes'
                suggestedParameters['JELLY_SIGMA'] = '0.01'
                suggestedParameters['JELLY_DMAX' ] = '4.2'
        else:
            if (not suggestChangingGeomWeight) or (not suggestIncreasingGeomWeight):
                bottomline += "You can reduce overfitting by tightening up " +\
                          "geometry via decreasing 'Overall data-geometry weight' parameter.<p>"

    # 9. Problems specific to low resolution. Advices for higher Rfree.
    if res >= 3.0:
        if (rFree > (meanRfree+0.002)) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands. "
            if not ncsRestraints:
                if isNCSpresent:
                    bottomline += "Try introducing NCS restraints as you seem to have several " +\
                                  "identical subunits in the asymmetric unit. "
                    suggestedParameters['NCSR'] = 'yes'
            else:
                bottomline += "Try changing type of NCS restraints (between local and global). "
            if not jellyBody:
                bottomline += "Try jelly-body refinement. "
                suggestedParameters['JELLY'      ] = 'yes'
                suggestedParameters['JELLY_SIGMA'] = '0.01'
                suggestedParameters['JELLY_DMAX' ] = '4.2'
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands. Check your data for twinning. "
            if not ncsRestraints:
                if isNCSpresent:
                    bottomline += "Try introducing NCS restraints as you seem to have several " +\
                                  "identical subunits in the asymmetric unit. "
                    suggestedParameters['NCSR'] = 'yes'
            else:
                bottomline += "Try changing type of NCS restraints (between local and global). "
            if not jellyBody:
                bottomline += "Try 20-50 cycles of jelly-body refinement. "
                suggestedParameters['NCYC'       ] = '50'
                suggestedParameters['JELLY'      ] = 'yes'
                suggestedParameters['JELLY_SIGMA'] = '0.01'
                suggestedParameters['JELLY_DMAX' ] = '4.2'
            bottomline += "Try LORESTR for automated refinement with restraints from homologous structures. <p>"


    # 10. Problems specific to medium resolution. Advices for higher Rfree
    elif res >= 2.0:
        if (rFree > meanRfree+0.002) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands/waters/metals. "

            if not ncsRestraints:
                if isNCSpresent:
                    bottomline += "Try introducing NCS restraints as you seem to have several " +\
                                  "identical subunits in the asymmetric unit. "
                    suggestedParameters['NCSR'] = 'yes'
            else:
                bottomline += "If NCS restraints don't positively contribute to your refinement, try switching them off. "
                # avoiding infinite loop - need proper non-Markov decision making here
                # suggestedParameters['NCSR'] = 'no'

            if not tls and not ('NCYC' in suggestedParameters ) and not suggestChangingGeomWeight:
                bottomline += "Try TLS refinement. "
                suggestedParameters['TLS'       ] = 'auto'
                suggestedParameters['TLS_CYCLES'] = '5'
                suggestedParameters['RESET_B'   ] = 'no'
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands/waters/metals. Check your data for twinning. "
            if not ncsRestraints:
                if isNCSpresent:
                    bottomline += "Try introducing NCS restraints as you seem to have several " +\
                                  "identical subunits in the asymmetric unit. "
                    suggestedParameters['NCSR'] = 'yes'
            bottomline += "<p>"

    # 11. Problems specific to higher resolution. Advices for higher Rfree
    elif res >= 1.6:
        if (rFree > meanRfree+0.002) and (rFree < (meanRfree + (2.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands/waters/metals. "
            if not tls and not ('NCYC' in suggestedParameters) and not suggestChangingGeomWeight:
                bottomline += "Try TLS refinement. "
                suggestedParameters['TLS'       ] = 'auto'
                suggestedParameters['TLS_CYCLES'] = '5'
                suggestedParameters['RESET_B'   ] = 'no'
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (2.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands/waters/metals. Check your data for twinning. <p>"

    # 12. Problems specific to subatomic and atomic resolution. Advices for higher Rfree
    else:
        if (rFree > meanRfree+0.002) and (rFree < (meanRfree + (3.0*sigRfree))):
            bottomline += "Your <i>R<sub>free</sub></i> is a bit higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands/waters/metals/alternative conformations. "
            if not anisotropicBfact:
                bottomline += "Try anisotropic B-factors. "
                suggestedParameters['BFAC'] = 'ANIS'
            if not hydrogens:
                bottomline += "Try adding hydrogens. "
                suggestedParameters['MKHYDR'] = 'ALL'
                # suggestedParameters['RIDING_HYDROGENS'] = 'YES' # Removed as requested by Arnaud
            # Apparently scaling parameters are not available in Cloud interface now
            bottomline += "Try optimising solvent and scaling parameters. <p>"
        elif (rFree >= (meanRfree + (3.0*sigRfree))) and (rFree <= 0.4):
            bottomline += "Your <i>R<sub>free</sub></i> is substantially higher than expected " +\
                          "(%0.3f, while mean value for this resolution is %0.3f). " % (rFree, meanRfree) +\
                          "Try building more residues/ligands/waters/metals. Check your data for twinning. <p>"

    # 13. Combing some parameters at the end

    # Do we need to drop down number of cycles for the next run ?
    if not ('NCYC' in suggestedParameters):
        if res < 3.0 :
            if ncyc > 10:
                suggestedNcyc = getNcyclesToPlateau(allCyclesRfree)
                if suggestedNcyc <= 8:
                    suggestedParameters['NCYC'] = '10'
                else:
                    suggestedParameters['NCYC'] = str(suggestedNcyc + 3)
        else:
            # resolution >= 3.0
            if ncyc > 20:
                suggestedNcyc = getNcyclesToPlateau(allCyclesRfree)
                if suggestedNcyc <= 18:
                    suggestedParameters['NCYC'] = '20'
                else:
                    suggestedParameters['NCYC'] = str(suggestedNcyc + 3)

    verdictInfo = {'score': verdict_score,
                   'message': verdict_message,
                   'bottomLine': bottomline,
                   'meanRfree': meanRfree,
                   'medianClash': medianClash,
                   'ramaOutliers': ramaOutliers,
                   'suggestedParameters': suggestedParameters
    }

    return verdictInfo


def putVerdictWidget ( base,verdict_meta,verdict_row,refmac_log=None ):

    if refmac_log:
        verdict_meta["refmac"] = parseRefmacLog ( refmac_log )
    else:
        base.flush()
        base.file_stdout.close()
        verdict_meta["refmac"] = parseRefmacLog ( base.file_stdout_path() )
        # continue writing to stdout
        base.file_stdout = open ( base.file_stdout_path(),"a" )

    if not verdict_meta["params"]:
        verdict_meta["params"] = verdict_meta["refmac"]["params"]

    verdictInfo = calculate ( verdict_meta )

    base.putMessage1 ( base.report_page_id(),"&nbsp;",verdict_row )  # just a spacer

    rfree_str = str(verdict_meta["refmac"]["rfree"][1])
    if verdict_meta["refmac"]["rfree"][1] > verdictInfo['meanRfree']:
        rfree_str = "<b>" + rfree_str + "</b>"

    rms_str = str(verdict_meta["refmac"]["bond_length"][1])
    if verdict_meta["refmac"]["bond_length"][1] < 0.01 or verdict_meta["refmac"]["bond_length"][1] > 0.02:
        rms_str = "<b>" + rms_str + "</b>"

    clash_str = str(verdict_meta["molprobity"]["clashscore"])
    if verdict_meta["molprobity"]["clashscore"] > verdictInfo['medianClash']:
        clash_str = "<b>" + clash_str + "</b>"

    verdict.makeVerdictSection ( base,{
        "title": "Refinement summary",
        "state": 0, "class": "table-blue", "css": "text-align:right;",
        "horzHeaders" :  [
            { "label"   : "Achieved",
              "tooltip" : "Achieved in this job"
            },{
              "label"   : "Expected",
              "tooltip" : "Expected mean value for this resolution from PDB statistics"
            }
        ],
        "rows" : [
            { "header": { "label"  : "R-factor",
                          "tooltip": "R-factor for working set"},
              "data"   : [ str(verdict_meta["refmac"]["rfactor"][1]),"" ]
            },
            { "header": { "label"  : "R<sub>free</sub>",
                          "tooltip": "Free R-factor"},
              "data"  : [ rfree_str,"< %0.3f" % verdictInfo['meanRfree'] ]
            },
            { "header": { "label"  : "Bond length rms",
                          "tooltip": "Bond length r.m.s.d."},
              "data"  : [ rms_str,"<span style=\"white-space:nowrap;\">0.01-0.02</span>" ]
            },
            { "header": { "label"  : "Clash score",
                          "tooltip": "MolProbity clash score" },
              "data"  : [ clash_str,"< %0.1f" % verdictInfo['medianClash'] ]
            },
            { "header": { "label"  : "Ramachandran<br>outliers",
                          "tooltip": "Ramachandran outliers" },
              "data"  : [ str(verdictInfo['ramaOutliers']),"" ]
            },
            { "header": { "label"  : "MolProbity<br>score",
                          "tooltip": "Combined MolProbity score" },
              "data"  : [ str(verdict_meta["molprobity"]["molp_score"]),"" ]
            }
        ]
    },verdictInfo['score'], verdictInfo['message'], verdictInfo['bottomLine'],row=verdict_row+1 )

    return verdictInfo['suggestedParameters']



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
