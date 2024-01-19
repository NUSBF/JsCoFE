#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    18.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  VERDICT FUNCTION FOR LORESTR
#
#  Copyright (C) Oleg Kovalevskyi, Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import os

from pycofe.proc import verdict




def parseLORESTRLog (logpath):

    meta = {
        "bestProtocol" : '',
        "rfact"        : [1.0, 1.0],
        "rfree"        : [1.0, 1.0],
        "ramaOut"      : [0.0, 0.0],
        "ramaFav"      : [0.0, 0.0],
        "clash"        : [0.0, 0.0],
        "molprob"      : [0.0, 0.0],
    }

    if os.path.isfile(logpath):

        with open(logpath,"r") as f:
            results = False
            for line in f:
                if results:
                    lst = line.split()
                    if line[0] == ' ':
                        meta["bestProtocol"] = line
                    elif "Rfact (before/after)" in line:
                        meta["rfact"]   = [float(lst[2]),float(lst[4])]
                    elif "Rfree (before/after)" in line:
                        meta["rfree"]   = [float(lst[2]),float(lst[4])]

                    elif "Ramachandran outliers" in line:
                        meta["ramaOut"] = [float(lst[3][:-1]), float(lst[5][:-1])]
                    elif "Ramachandran favoured" in line:
                        meta["ramaFav"] = [float(lst[3][:-1]), float(lst[5][:-1])]

                    elif "Clashscore percentile" in line:
                        meta["clash"] = [float(lst[3]), float(lst[5])]
                    elif "Molprobity percentile" in line:
                        meta["molprob"] = [float(lst[3]), float(lst[5])]

                        break
                elif "Best performing protocol" in line:
                    results = True

    return meta


#  2. Verdict message generation (not framed as a function, but ideally
#     it should be, feel free to suggest)

def calculate ( meta ) :

    # Eugene, please put here initialisation with real values from the refinement job
    # Initialisation of all values used in verdict
    #

    res              = meta["data"]["resolution"] # Resolution

    # ------- Values from current refinement run

    rFree            = meta['lorestr']["rfree"][1]      # Rfree after refinement
    rWork            = meta['lorestr']["rfact"][1]      # Rwork after refinement
    clashScore       = meta['lorestr']["clash"][1]      # clash score percentile from MolProbity report after refinement
    molprob          = meta['lorestr']["molprob"][1]    # molprobity percentile score from MolProbity report after refinement
    ramaOut          = meta['lorestr']["ramaOut"][1]             # % of Rama outliers after refinement
    ramaFav          = meta['lorestr']["ramaFav"][1]   # % of Rama favourite after refinement

    rFreeBefore      = meta['lorestr']["rfree"][0]      # Rfree before refinement (starting value)
    rWorkBefore      = meta['lorestr']["rfact"][0]      # Rwork before refinement (starting value)
    clashScoreBefore = meta['lorestr']["clash"][0]  # clash score from MolProbity report before refinement
    molprobBefore    = meta['lorestr']["molprob"][0]  # molprobity percentile score from MolProbity report before refinement
    ramaFavBefore    = meta['lorestr']["ramaFav"][0]  # % of Rama favourite after refinement

    bestProtocol     = meta['lorestr']["bestProtocol"]

    if 'External' in bestProtocol:
        externalBest = True
    else:
        externalBest = False

    if meta['params']['homologs'] != 'none':
        homologsUsed = True
    else:
        homologsUsed = False
    if meta['params']['mr'] == 'True':
        mrOption = True
    else:
        mrOption = False

    #
    # End of initialisation. Below operating with these values only


    # Figuring out statistical values for evaluation of the current case

    verdict_score = verdict.calcVerdictScore ({
        "Rfree" : { "value"  : rFree,
                    "weight" : 2.0,
                    "good"   : [0.35, 0.325, 0.3, 0.25],
                    "bad"    : [0.35, 0.4, 0.5, 0.6]
                  },
        "clashScorePercentile": {"value" : clashScore,
                  "weight"     : 1.0,
                  "good"       : [33.0, 50.0, 75.0, 100.0],
                  "bad"        : [33.0, 22.0, 11.0, 0.0]
                  },
        "molProbPercentile": {"value" : molprob,
                   "weight"     : 1.0,
                  "good"       : [33.0, 50.0, 75.0, 100.0],
                  "bad"        : [33.0, 22.0, 11.0, 0.0]
                  },

    }, 1)

    verdict_message = "<b style='font-size:18px;'>"

    if verdict_score>=83:
        verdict_message += "Well done! Overall quality of the structure is excellent."
    elif verdict_score>=67:
        verdict_message += "Good job! Overall quality of the structure is very reasonable " +\
                           "and could be further improved"
    elif verdict_score>=34:
        verdict_message += "Fair enough. Overall quality of the structure could be better, "+\
                            "some bits are probably missing"
    else:
        verdict_message += "Not good enough. Overall quality of the structure is low, " \
                           "most likely significant parts of the structure are missing"
    verdict_message += "</b>"

    notes = []
    if rFree >= 0.4:
        notes.append ( "<i>Rfree</i> is critically high; is your model complete?" )
    elif rFree >= 0.35:
        notes.append("<i>Rfree</i> is high; are bits of the structure missing?")
    elif rFree > 0.32:
        notes.append("<i>Rfree</i> is a bit higher than optimal")
    if clashScore <= 12.5:
        notes.append ( "<i>ClashScore percentile</i> is critically low; model contains severe clashes" )
    elif clashScore <= 33.0:
        notes.append ( "<i>ClashScore percentile</i> is low; model contains some clashes" )
    if molprob <= 12.5:
        notes.append ( "<i>MolProbity score percentile</i> is critically low; model shall be carefully examined and improved" )
    elif molprob  <= 33.0:
        notes.append ( "<i>MolProbity score percentile</i> is low; please check Molprobity analysis report below" )
    if homologsUsed and (not externalBest):
        notes.append("Sadly, use of external homologues did not improve refinement for this case")

    if len(notes)<=0:
        notes.append ( "All scores are fairly reasonable" )

    if len(notes)>0:
        verdict_message += "<ul><li>" + "</li><li>".join(notes) +\
                           ".</li></ul>"

    bottomline = "&nbsp;<br>"

    if not homologsUsed:
        bottomline += "Apparently you did not use automatically selected external homologues, which is main feature of LORESTR. Please re-run " + \
                      "LORESTR with <i>Add structural homologues from the PDB</i> option activated.<p>"

    if rFreeBefore < rFree:
        bottomline += "LORESTR was unable to improve fit of the model into electron density as <i>R<sub>free</sub></i> " +\
                      "after refinement is higher. "
        if molprob > molprobBefore:
            bottomline += "Nevertheless overall geometrical quality of the structure was improved. "
        if not homologsUsed:
            bottomline += "Please re-run LORESTR with <i>Add structural homologues from the PDB</i> option activated."
        else:
            bottomline +=  "Please use manual refinement via REFMAC."
        bottomline += "<p>"

    if rFree > 0.4:
        if not mrOption:
            bottomline += "High <i>R<sub>free</sub></i> means that either your model is either incomplete or poorly fitted. " +\
                      "In the first case please try adding more subunits via molecular replacement " +\
                      "or building missing parts of the model. In the second case, if your model is " +\
                      "straight after molecular replacement, please re-run LORESTR with <i>Run pre-refinement</i> " +\
                      "option on.<p>"
        else:
            bottomline += "High <i>R<sub>free</sub></i> means that either your model is either incomplete or poorly fitted. " +\
                      "In the first case please try adding more subunits via molecular replacement " +\
                      "or building missing parts of the model. In the second case, try manual model rebuilding as " +\
                      "automated procedures seems to be inefficient for this case.<p>"

    if rFree > 0.35:
        bottomline += "<i>R<sub>free</sub></i> seems a bit higher than normal. Please check whether model is " +\
                      "complete (try to build more residues/ligands and add waters/metals if possible)<p>"

    if clashScore < 25.0:
        bottomline += "MolProbity clash score percentile of %0.1f for the structure seems low. " % clashScore +\
                      "During subsequent REFMAC refinement you can try to switch on option for " +\
                      "generation of hydrogen atoms during refinement. Also, you can try to increase weight for VDW " +\
                      "repulsion by putting following command into 'Additional keywords' of the " +\
                      "'Advanced' parameters section: <i>vdwrestraints 2.0</i>. Value for restraints weight " +\
                      "is subject to optimisation.<p>"

    if molprob < 25.0:
        bottomline += "Overall MolProbity score percentile of %0.1f for the structure seems low. " % molprob +\
                      "Please carefully examine quality reports and do manual rebuilding.<p>"

    if ramaOut > 0.0:
        bottomline += "According to MolProbity analysis, the structure seems to have Ramachandran outliers (%0.1f %%); " % ramaOut +\
                      "please examine those carefully.<p>"


    return (verdict_score,verdict_message,bottomline)


def putVerdictWidget (base, verdict_meta, verdict_row, lorestr_log=None):

    if lorestr_log:
        verdict_meta["lorestr"] = parseLORESTRLog (lorestr_log)
    else:
        base.flush()
        base.file_stdout.close()
        verdict_meta["lorestr"] = parseLORESTRLog (base.file_stdout_path())
        # continue writing to stdout
        base.file_stdout = open ( base.file_stdout_path(),"a" )

    verdict_score, verdict_message, bottomline = calculate ( verdict_meta )

    base.putMessage1 ( base.report_page_id(),"&nbsp;",verdict_row )  # just a spacer

    verdict.makeVerdictSection ( base, None ,verdict_score,verdict_message,bottomline,row=verdict_row+1 )

    return



def main():
    verdict_meta = {
        "data": {"resolution": 3.0 },
        "xyzmeta": None
    }
    verdict_meta["lorestr"] = parseLORESTRLog('/Users/urp21839/Personal_Private_from_previous_job/okovalev_Linux/LRSR/lorestr_Output/Pipeline.log')

    verdict_score,verdict_message,bottomline = calculate(verdict_meta)

    if verdict_score<0.0:  # error
        print ( verdict_message )
    else:
        print ( verdict_score   )
        print ( verdict_message )
        print ( bottomline      )


if __name__ == '__main__':
    main()
