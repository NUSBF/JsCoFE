##!/usr/bin/python

#
# ============================================================================
#
#    23.06.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver Dimple module
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

import os
from   xml.dom import minidom
import math

#  ccp4-python imports
#import pyrvapi

import asucomp
import rvapi_utils

import ccp4go_mtz

# ============================================================================

class PrepareASU(ccp4go_mtz.PrepareMTZ):

    # ----------------------------------------------------------------------

    def matthews_report(self):  return "refmac_report"
    def getXMLFName    (self):  return "matthews.xml"
    def seq_table_id   (self):  return "seq_table"
    def res_table_id   (self):  return "res_table"
    def asu_dir        (self):  return "asu"

    # ----------------------------------------------------------------------

    def prepare_asu ( self,parent_branch_id ):

        if not self.seqpath:
            self.stdout ( " ... no sequence(s) are given, the composition of " +
                          "ASU is set unknown\n" )
            #self.output_meta["retcode"] = "[03-001] no sequences are given"
            #self.write_meta()
            return ""

        meta = {}
        meta["asu"]  = True
        self.output_meta["results"][self.asu_dir()] = meta

        if not os.path.isfile(self.seqpath):
            self.stderr ( " *** sequence file does not exist -- stop.\n" )
            self.output_meta["retcode"] = "[03-001] sequence file not found"
            meta["nResults"] = -1
            self.write_meta()
            return ""

        self.file_stdout.write ( " ... suggest the composition of ASU\n" )
        #self.file_stdout.write ( " ... datadir = " + str(datadir) + "\n" )

        #self.putMessage       ( "&nbsp;" )

        title = "Composition of ASU"
        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". " + title + "</b>" )
        self.page_cursor[1] -= 1

        branch_data = self.start_branch ( title,
                        "CCP4go Automated Structure Solver: " + title,
                        self.asu_dir(),parent_branch_id )

        self.asu = asucomp.suggestASUComp1 ( self.hkl,self.seqpath )

        quit_message = ""

        if self.asu["rc"]!=0:
            #  errors in ASU composition calculations
            self.stderr ( " *** asu definition error: " + self.asu["msg"] + " -- stop.\n" )
            self.output_meta["retcode"] = "[03-002] Error in ASU calculations: " +\
                                          self.asu["msg"]
            self.putMessage ( "<h3><i>ASU cannot be defined</i></h3>" )
            self.putMessage ( "Composition of Asymmetric Unit could not be " +\
                              "defined because of the following error:<p><b><i>" +\
                              self.asu["msg"] + "</i></b>" )
            #self.flush()
            meta["nResults"] = 0
            #self.write_meta()
            quit_message = "Definition of ASU contents failed: " + self.asu["msg"]

        else:
            #   --------------------------------------------------------------
            #  run matthews

            spaceGroup = self.hkl.HM
            cell       = self.hkl.DCELL
            asudesc     = self.asu["asu"]

            self.open_script  ( "matthews" )
            self.write_script (
                "CELL " + str(cell[0]) + " " + str(cell[1]) + " " + str(cell[2]) +\
                    " " + str(cell[3]) + " " + str(cell[4]) + " " + str(cell[5]) +\
                "\nSYMM \""    + spaceGroup + "\"" +\
                "\nMOLWEIGHT " + str(self.asu["weight"]) +\
                "\nNMOL 1"     +\
                "\nAUTO"       +\
                "\nXMLO"       +\
                "\nMODE "      + self.asu["asuType"] + "\n"
            )
            self.close_script ()

            molWeight = self.asu["weight"]
            nRes      = self.asu["nres"]

            tdict1 = {
                "title": "<b>Content unit:</b> " + str(self.asu["nmol"]) +\
                         " molecule(s) with the following sequence(s)",
                "state": 0, "class": "table-blue", "css": "text-align:right;",
                "horzHeaders" :  [
                    { "label": "Structural unit components", "tooltip": "Sequence data" },
                    { "label": "Type"  , "tooltip": "Sequence type" },
                    { "label": "Size"  , "tooltip": "Number of residues" },
                    { "label": "Weight", "tooltip": "Weight in Daltons" }
                ],
                "rows" : []
            }

            for i in range(len(asudesc)):
                seq = ""
                k   = 0
                for j in range(len(asudesc[i][0])):
                    if k>40:
                        seq += "<br>"
                        k = 0
                    seq += asudesc[i][0][j]
                    k += 1
                while k<40:
                    seq += "&nbsp;"
                    k += 1
                trow = { "header":{ "label": str(i+1), "tooltip": ""}, "data": [
                        str(asudesc[i][3]) + "x&nbsp;" + seq + "&nbsp;",
                        asudesc[i][2].upper() + "&nbsp;",
                        str(len(asudesc[i][0])) + "&nbsp;",
                        str(asudesc[i][1]) + "&nbsp;"
                ]}
                tdict1["rows"].append ( trow )

            tdict1["rows"].append ({
              "data" : ["<i><b>Total residues/weight:</b></i>","",
                        "<i><b>" + str(nRes) + "</b></i>&nbsp;",
                        "<i><b>" + str(molWeight) + "</b></i>&nbsp;"]
            })

            rvapi_utils.makeTable ( tdict1, self.seq_table_id(),
                                    self.page_cursor[0],self.page_cursor[1],
                                    0,1,1 )
            self.page_cursor[1] += 1

            self.flush()
            #self.storeReportDocument ( "" )

            # Run matthews
            self.runApp ( "matthews_coef",["XMLFILE",self.getXMLFName()] )

            if not os.path.isfile(self.getXMLFName()):
                self.putMessage ( "<h2>Failure</h2>" )
                meta["nResults"] = 0

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

                else:

                    tdict2 = {
                        "title": "Molecule fitting statistics",
                        "state": 0, "class": "table-blue", "css": "text-align:right;",
                        "horzHeaders" :  [
                            { "label": "N<sub>units</sub>"  , "tooltip":
                               "Number of given content units placed in asymmetric unit" },
                            { "label": "Matthews"            , "tooltip": "Matthews coefficient" },
                            { "label": "% solvent"           , "tooltip": "Solvent percent" },
                            { "label": "P<sub>matthews</sub>", "tooltip": "Probability" }
                        ],
                        "rows" : []
                    }

                    mc1   = -1
                    sol1  = -1
                    prb1  = -1
                    dsol0 = 100.0
                    i0    = -1

                    for i in range(len(items)):
                        nc  = items[i].attributes["nmol_in_asu"].value.strip()
                        mc  = float(items[i].attributes["matth_coef"].value.strip())
                        sol = float(items[i].attributes["percent_solvent"].value.strip())
                        prb = float(items[i].attributes["prob_matth"].value.strip())
                        tdict2["rows"].append ({
                          "data" : [ str(nc)+"&nbsp;",
                                     "%.2f&nbsp;" % mc,
                                     "%.2f&nbsp;" % sol,
                                     "%.3f&nbsp;" % prb]
                        })
                        if int(nc) == 1:
                            mc1  = mc
                            sol1 = sol
                            prb1 = prb
                        dsol = abs ( sol - 50.0 );
                        if dsol < dsol0:
                            nc0   = int(nc)
                            sol0  = sol
                            dsol0 = dsol
                            i0    = i

                    if nc0 > 0:
                        tdict2["rows"][i0]["data"][0] = "* " + str(nc0) + "&nbsp;"

                    rvapi_utils.makeTable ( tdict2, self.res_table_id(),
                                            self.page_cursor[0],self.page_cursor[1],
                                            0,1,1 )
                    self.page_cursor[1] += 1

                    fitMessage = ""
                    if nc0==1 and sol0>35.0:
                        fitMessage = "<h3 class='header-green'>The suggested " +\
                                     "composition of ASU appears to be the optimal " +\
                                     "one.</h3>"
                    elif nc0 > 1:
                        fitMessage = "<h3 class='header-red'>WARNING: the suggested " +\
                                     "composition of ASU has higher, than usual, " +\
                                     "solvent fraction.<br>" +\
                                     "Try to increase the scattering mass by a " +\
                                     "factor of " + str(nc0) + "</h3>"
                    elif nc0 > 0:
                        fitMessage = "<h3 class='header-red'>WARNING: the suggested " +\
                                     "composition of ASU has lower, than usual, " +\
                                     "solvent fraction.<br>" +\
                                     "Try to decrease the scattering mass by a " +\
                                     "factor of " + str(math.ceil(350.0/sol0)/10.0) +\
                                     "</h3>"
                    if fitMessage:
                        self.putMessage ( fitMessage )


                    meta["nResults"]   = 1
                    meta["table1"]     = tdict1
                    meta["table2"]     = tdict2
                    meta["fitMessage"] = fitMessage
                    meta["cellVolume"] = cellv[0].attributes["volume"].value.strip()
                    meta["nmol"]       = self.asu["nmol"]
                    meta["nres"]       = self.asu["nres"]
                    meta["weight"]     = self.asu["weight"]
                    meta["solvent"]    = sol0
                    meta["matthews"]   = mc1
                    meta["mprob"]      = prb1
                    quit_message = "Composition of ASU prepared: " +\
                                   str(meta["nmol"]) + " molecules, " +\
                                   "%.2f&#37; solvent" % sol0

        self.output_meta["results"][self.asu_dir()] = meta
        self.quit_branch ( branch_data,self.asu_dir(),quit_message )

        return  branch_data["pageId"]
