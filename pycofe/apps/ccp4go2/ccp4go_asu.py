##!/usr/bin/python

#
# ============================================================================
#
#    22.02.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4GO Combined Auto-Solver ASU module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2017-2021
#
# ============================================================================
#

import os
from   xml.dom import minidom
import math

#  ccp4-python imports
# import pyrvapi

import asucomp
#import rvapi_utils

import ccp4go_base

# ============================================================================

class PrepareASU(ccp4go_base.Base):

    # ----------------------------------------------------------------------

    def matthews_report(self):  return "refmac_report"
    def getXMLFName    (self):  return "matthews.xml"
    def seq_table_id   (self):  return "seq_table"
    def res_table_id   (self):  return "res_table"

    parent_branch_id = None

    def set_parent_branch_id(self, parent_branch_id):
        self.parent_branch_id = parent_branch_id

    # ----------------------------------------------------------------------

    def prepare_asu ( self ):

        if not self.currentData.startingParameters.seqpath:
            self.stdout ( " ... no sequence(s) are given, the composition of " +
                          "ASU is set unknown\n" )
            self.output_meta["error"] = "[03-001] no sequences are given"
            self.write_meta()
            return

        self.currentData.asu_dir = os.path.join(self.currentData.startingParameters.workdir, "asu_results")

        meta = {}
        meta["asu"]  = True
        self.output_meta["results"][self.currentData.asu_dir] = meta

        if not os.path.isfile(self.currentData.startingParameters.seqpath):
            self.stderr ( " *** sequence file does not exist -- stop.\n" )
            self.output_meta["error"] = "[03-001] sequence file not found"
            self.output_meta["nResults"] = -1
            self.write_meta()
            return ""

        self.file_stdout.write ( " ... suggest the composition of ASU\n" )
        #self.putMessage       ( "&nbsp;" )

        title = "Composition of ASU"
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". " + title + "</b>" )
        self.page_cursor[1] -= 1

        self.branch_data = self.start_branch ( title,
                        "CCP4go Automated Structure Solver: " + title,
                        self.currentData.asu_dir, self.parent_branch_id )

        (self.output_meta["results"][self.currentData.asu_dir], quit_message) = self.runASUanalysis(meta)

        self.stdout (self.cleanhtml(quit_message) + '\n', mainLog=True)
        self.flush()

        self.quit_branch (self.branch_data, self.currentData.asu_dir, quit_message)

        #self.branch_data["pageId"]
        return



    def runASUanalysis(self, meta):

        self.currentData.asu = asucomp.suggestASUComp1 ( self.currentData.hkl, self.currentData.startingParameters.seqpath, True )

        quit_message = ""
        if self.currentData.asu["rc"]!=0:
            #  errors in ASU composition calculations
            self.stderr ( " *** asu definition error: " + self.currentData.asu["msg"] + " -- stop.\n" )
            self.output_meta["error"] = "[03-002] Error in ASU calculations: " +\
                                          self.currentData.asu["msg"]
            self.putMessage ( "<h3><i>ASU cannot be defined</i></h3>" )
            self.putMessage ( "Composition of Asymmetric Unit could not be " +\
                              "defined because of the following error:<p><b><i>" +\
                              self.currentData.asu["msg"] + "</i></b>" )
            #self.flush()
            meta["nResults"] = 0
            self.write_meta()
            quit_message = "Definition of ASU contents failed: " + self.currentData.asu["msg"]
        else:
            spaceGroup = self.currentData.hkl.HM
            cell       = self.currentData.hkl.DCELL
            asudesc    = self.currentData.asu["asu"]

            molWeight = self.currentData.asu["weight"]
            nRes      = self.currentData.asu["nres"]

            tdict1 = self.analyseASUsuggestion(asudesc, nRes, molWeight)

            self.runMattews(cell, spaceGroup)

            if not os.path.isfile(self.getXMLFName()):
                self.putMessage ( "<h2>Failure</h2>" )
                meta["nResults"] = 0
                self.output_meta["error"] = "[03-003] Error in Mattews coef. calculations."
            else:
                self.putMessage ( "<h2>Matthew analysis</h2>" )
                xmldoc = minidom.parse ( self.getXMLFName() )
                cellv  = xmldoc.getElementsByTagName("cell")
                if len(cellv)>0:
                    self.putMessage ( "<b>Cell volume:</b>&nbsp;" +\
                                      cellv[0].attributes["volume"].value.strip() +\
                                      "&nbsp;&Aring;<sup>3</sup>" )

                items = xmldoc.getElementsByTagName ( "result" )

                if len(items)<=0:
                    self.putMessage ( "<h3 class='header-red'>Given sequence(s) " +\
                                      "(total " + str(nRes) + " residues) cannot " +\
                                      "be fit in asymmetric unit.<br>No structure " +\
                                      "revision created.<h3>" )
                    meta["nResults"] = 0
                    self.output_meta["error"] = "[03-004] Given sequence(s) cannot be fit in asymmetric unit."

                else:
                    (tdict2, fitMessage, sol0, mc1, prb1) = self.analyse_Matthews(items)

                    meta["nResults"]   = 1
                    meta["table1"]     = tdict1
                    meta["table2"]     = tdict2
                    meta["fitMessage"] = fitMessage
                    meta["cellVolume"] = cellv[0].attributes["volume"].value.strip()
                    meta["nmol"]       = self.currentData.asu["nmol"]
                    meta["nres"]       = self.currentData.asu["nres"]
                    meta["weight"]     = self.currentData.asu["weight"]
                    meta["solvent"]    = sol0
                    meta["matthews"]   = mc1
                    meta["mprob"]      = prb1
                    quit_message = "Composition of ASU prepared: " + \
                                   str(meta["nmol"]) + " molecule(s), " + \
                                   "%.2f&#37; solvent" % meta["solvent"]

        return (meta, quit_message)


    def runMattews(self, cell, spaceGroup):
        self.open_script("matthews")
        self.write_script(
            "CELL " + str(cell[0]) + " " + str(cell[1]) + " " + str(cell[2]) + \
            " " + str(cell[3]) + " " + str(cell[4]) + " " + str(cell[5]) + \
            "\nSYMM \"" + spaceGroup + "\"" + \
            "\nMOLWEIGHT " + str(self.currentData.asu["weight"]) + \
            "\nNMOL 1" + \
            "\nAUTO" + \
            "\nXMLO" + \
            "\nMODE " + self.currentData.asu["asuType"] + "\n"
        )
        self.close_script()
        # Run matthews
        self.runApp("matthews_coef", ["XMLFILE", self.getXMLFName()])
        return


    def analyseASUsuggestion(self, asudesc, nRes, molWeight):
        tdict1 = {
            "title": "<b>Content unit:</b> " + str(self.currentData.asu["nmol"]) + \
                     " molecule(s) with the following sequence(s)",
            "state": 0, "class": "table-blue", "css": "text-align:right;",
            "horzHeaders": [
                {"label": "N<sub>copies</sub>",
                 "tooltip": "Number of copies"},
                {"label": "Structural unit components",
                 "tooltip": "Sequence data"},
                {"label": "Type", "tooltip": "Sequence type"},
                {"label": "Size", "tooltip": "Number of residues"},
                {"label": "Weight", "tooltip": "Weight in Daltons"}
            ],
            "rows": []
        }

        for i in range(len(asudesc)):
            seq = ""
            k = 0
            for j in range(len(asudesc[i][0])):
                if k > 40:
                    seq += "<br>"
                    k = 0
                seq += asudesc[i][0][j]
                k += 1
            while k < 40:
                seq += "&nbsp;"
                k += 1
            trow = {"header": {"label": str(i + 1), "tooltip": ""}, "data": [
                str(asudesc[i][3]) + "x&nbsp;" + seq + "&nbsp;",
                asudesc[i][2].upper() + "&nbsp;",
                str(len(asudesc[i][0])) + "&nbsp;",
                str(asudesc[i][1]) + "&nbsp;"
            ]}
            tdict1["rows"].append(trow)

        tdict1["rows"].append({
            "data": [" ", "<i><b>Total residues/weight:</b></i>", "",
                     "<i><b>" + str(nRes) + "</b></i>&nbsp;",
                     "<i><b>" + str(molWeight) + "</b></i>&nbsp;"]
        })

        # rvapi_utils.makeTable ( tdict1, self.seq_table_id(),
        #                         self.page_cursor[0],self.page_cursor[1],
        #                         0,1,1 )
        self.page_cursor[1] += 1

        self.flush()
        # self.storeReportDocument ( "" )

        return tdict1



    def analyse_Matthews(self, items):
        tdict2 = {
            "title": "Molecule fitting statistics",
            "state": 0, "class": "table-blue", "css": "text-align:right;",
            "horzHeaders": [
                {"label": "N<sub>trial</sub>",
                 "tooltip": "Trial number of asymmetric units"},
                {"label": "Matthews",
                 "tooltip": "Matthews coefficient"},
                {"label": "% solvent",
                 "tooltip": "Solvent percent"},
                {"label": "P<sub>matthews</sub>",
                 "tooltip": "Probability"}
            ],
            "rows": []
        }

        mc1 = -1
        sol1 = -1
        prb1 = -1
        dsol0 = 100.0
        i0 = -1

        for i in range(len(items)):
            nc = items[i].attributes["nmol_in_asu"].value.strip()
            mc = float(items[i].attributes["matth_coef"].value.strip())
            sol = float(items[i].attributes["percent_solvent"].value.strip())
            prb = float(items[i].attributes["prob_matth"].value.strip())
            tdict2["rows"].append({
                "data": [str(nc) + "&nbsp;",
                         "%.2f&nbsp;" % mc,
                         "%.2f&nbsp;" % sol,
                         "%.3f&nbsp;" % prb]
            })
            if int(nc) == 1:
                mc1 = mc
                sol1 = sol
                prb1 = prb
            dsol = abs(sol - 50.0)
            if dsol < dsol0:
                nc0 = int(nc)
                sol0 = sol
                dsol0 = dsol
                i0 = i

        if nc0 > 0:
            tdict2["rows"][i0]["data"][0] = "* " + str(nc0) + "&nbsp;"

        # rvapi_utils.makeTable ( tdict2, self.res_table_id(),
        #                         self.page_cursor[0],self.page_cursor[1],
        #                         0,1,1 )
        self.page_cursor[1] += 1

        fitMessage = ""
        if nc0 == 1 and sol0 > 35.0:
            fitMessage = "<h3 class='header-green'>The suggested " + \
                         "composition of ASU appears suitable</h3>"
        elif nc0 > 1:
            fitMessage = "<h3 class='header-red'>WARNING: the suggested " + \
                         "composition of ASU has higher, than usual, " + \
                         "solvent fraction.<br>" + \
                         "Try to increase the number of copies by a " + \
                         "factor of " + str(nc0) + "</h3>"
        elif nc0 > 0:
            fitMessage = "<h3 class='header-red'>WARNING: the suggested " + \
                         "composition of ASU has lower, than usual, " + \
                         "solvent fraction.<br>" + \
                         "Try to decrease the number of copies by a " + \
                         "factor of " + str(math.ceil(350.0 / sol0) / 10.0) + \
                         "</h3>"
        if fitMessage:
            self.putMessage(fitMessage)

        return (tdict2, fitMessage, sol0, mc1, prb1)
