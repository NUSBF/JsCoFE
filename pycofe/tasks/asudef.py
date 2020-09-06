##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    06.09.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ASUDEF EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python asudef.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
from   xml.dom import minidom
import json
import math

#  ccp4-python imports
#import pyrvapi

#  application imports
from   pycofe.tasks    import basic
from   pycofe.dtypes   import dtype_revision, dtype_sequence
from   pycofe.proc     import import_filetype, import_sequence, asucomp
from   pycofe.varut    import rvapi_utils
from   pycofe.verdicts import verdict_asudef


# ============================================================================
# Revision-making function

"""
def makeAsuFitMessage ( base,nc0,sol0 ):
    if nc0==1 and sol0>35.0:
        base.putMessage ( "<h3 class='header-green'>The suggested " +\
                          "composition of ASU appears suitable</h3>" )
    elif nc0 > 1:
        base.putMessage ( "<h3 class='header-red'>WARNING: the suggested " +\
                          "composition of ASU has higher, than usual, " +\
                          "solvent fraction.<br>" +\
                          "Try to increase the number of copies by a " +\
                          "factor of " + str(nc0) + "</h3>"  )
    elif nc0 > 0:
        base.putMessage ( "<h3 class='header-red'>WARNING: the suggested " +\
                          "composition of ASU has lower, than usual, " +\
                          "solvent fraction.<br>" +\
                          "Try to decrease the number of copies by a " +\
                          "factor of " + str(math.ceil(350.0/sol0)/10.0) +\
                          "</h3>" )
    return
"""


def makeRevision ( base,hkl,seq,composition,altEstimateKey,altNRes,
                        altMolWeight,resLimit,
                        revision0=None,resultTitle="Results",secId="" ):

    revision   = None

    spaceGroup = hkl.getSpaceGroup()
    cell       = hkl.getCellParameters()

    if spaceGroup == "Unspecified":
        base.putTitle ( "Failure" )
        base.fail ( "Space Group unspecified in Reflection Dataset",
                    "No Space Group" )

    if cell[0] == 0.0:
        base.putTitle ( "Failure" )
        base.fail ( "Call parameters not found in Reflection Dataset",
                    "No Cell Parameters" )

    base.open_stdin()
    base.write_stdin (
        "CELL " + str(cell[0]) + " " + str(cell[1]) + " " + str(cell[2]) +\
            " " + str(cell[3]) + " " + str(cell[4]) + " " + str(cell[5]) +\
        "\nSYMM \"" + spaceGroup + "\"\n"
    )

    nRes      = 0
    molWeight = 0.0
    dataKey   = 0

    nc0       = -1
    sol0      = -1
    ncopies1  = 0   # number of copies in the suggested ASU

    if len(seq)>0:  # optional data parameter

        isProtein = False;
        isRNA     = False;
        isDNA     = False;
        asu       = []
        for i in range(len(seq)):
            seq[i]  = base.makeClass ( seq[i] )
            seqType = 'dna'
            if seq[i].isProtein():
                isProtein = True
                seqType = "protein"
            if seq[i].isRNA():
                isRNA = True
            if seq[i].isDNA():
                isDNA = True
            ncopies = seq[i].ncopies
            if seq[i].ncopies_auto:
                ncopies = 0
            asu.append ( ["",seq[i].weight,seqType,ncopies] );

        asucomp.suggestASUComp ( hkl.dataset,asu )

        for i in range(len(seq)):
            seq[i].ncopies = asu[i][3]
            nRes      += seq[i].ncopies*seq[i].size
            molWeight += seq[i].ncopies*seq[i].weight
            dataKey   += seq[i].ncopies
            ncopies1  += seq[i].ncopies

        comp = ""
        c    = 0;
        if isProtein:
            comp = "protein"
            c += 1
        if isRNA:
            if comp:
                comp += " and "
            comp += "RNA"
            c += 1
        if isDNA:
            if comp:
                comp += "/"
            comp += "DNA"
            c += 1
        if c>1:
            comp += " complex"

        base.write_stdin ( "MOLWEIGHT " + str(molWeight) + "\n" )

        tdict1 = {
            #"title": "<b>Content unit:</b> " + comp +\
            #         " molecule(s) with the following sequence(s)",
            "title": "Suggested ASU contents",
            "state": 0, "class": "table-blue", "css": "text-align:right;",
            "horzHeaders" :  [
                { "label": "Structural unit components", "tooltip": "Sequence data" },
                { "label": "Type"  , "tooltip": "Sequence type" },
                { "label": "Size"  , "tooltip": "Number of residues" },
                { "label": "Weight", "tooltip": "Weight in Daltons" }
            ],
            "rows" : []
        }

        for i in range(len(seq)):
            trow = { "header":{ "label": str(i+1), "tooltip": ""}, "data": [
                    str(seq[i].ncopies) + "x&nbsp;" + seq[i].dname + "&nbsp;",
                    seq[i].subtype[0].upper() + "&nbsp;",
                    str(seq[i].size) + "&nbsp;",
                    str(seq[i].weight) + "&nbsp;"
            ]}
            tdict1["rows"].append ( trow )

        tdict1["rows"].append ({
          "data" : ["<i><b>Total residues/weight:</b></i>","",
                    "<i><b>" + str(nRes) + "</b></i>&nbsp;",
                    "<i><b>" + str(molWeight) + "</b></i>&nbsp;"]
        })

        rvapi_utils.makeTable ( tdict1, base.getWidgetId("seq_table"),
                                base.report_page_id(),
                                base.rvrow,0,1,1 )
        base.rvrow += 1

    elif altEstimateKey == "NR":
        nRes = altNRes
        base.write_stdin ( "NRES " + str(nRes) + "\n" )
        dataKey = -1
        if composition == "P":
            cnt = " aminoacid residues"
        elif composition == "C":
            cnt = " aminoacid and nucleic acid residues"
        else:
            cnt = " nucleis acid residues"
        base.putMessage ( "<b>Content unit:</b> one or several molecules " +\
                          "having " + str(nRes) + cnt + " in total" )

    else:
        molWeight = altMolWeight
        base.write_stdin ( "MOLWEIGHT " + str(molWeight) + "\n" )
        datakey = -2
        if composition == "P":
            cnt = " protein"
        elif composition == "C":
            cnt = " protein and polynucletide"
        else:
            cnt = " polynucletide"
        base.putMessage ( "<b>Content unit:</b> one or several " + cnt +\
                          " molecules with the combined molecular weight of " +\
                          str(molWeight) + " Daltons" )

    base.write_stdin (
        "NMOL 1\n" +\
        "AUTO\n"   +\
        "XMLO\n"
    )
    if resLimit:
        base.write_stdin ( "RESO " + str(resLimit) + "\n" )
    base.write_stdin ( "MODE " + composition )

    base.close_stdin()

    # Run matthews
    base.runApp ( "matthews_coef",["XMLFILE",base.getXMLFName()],logType="Main" )

    if not os.path.isfile(base.getXMLFName()):
        base.putTitle ( "Failure" )
        base.fail ( "Output XML file was not created",
                    "No XML output file" )

    if resultTitle:
        base.putTitle ( resultTitle )
    else:
        base.putMessage ( "&nbsp;" )

    xmldoc = minidom.parse ( base.getXMLFName() )
    cellv  = xmldoc.getElementsByTagName("cell")
    if len(cellv)>0:
        base.putMessage ( "<b>Cell volume:</b>&nbsp;" +\
                          cellv[0].attributes["volume"].value.strip() +\
                          "&nbsp;&Aring;<sup>3</sup>" )

    if molWeight>0.0 or nRes>0:
        items = xmldoc.getElementsByTagName ( "result" )
    else:
        items = []

    if len(items)<=0:
        if dataKey==-2:
            base.putMessage ( "<h3 class='header-red'>No molecule with " +\
                              "given weight (" + str(molWeight) +\
                              " Daltons) can be fit " + "in asymmetric " +\
                              "unit.<br>No structure revision created.</h3>" )
        elif dataKey==-1:
            base.putMessage ( "<h3 class='header-red'>No molecule with " +\
                              "given size (" + str(nRes) + " residues) " +\
                              "can be fit in asymmetric unit.<br> No " +\
                              "structure revision created.</h3>" )
        elif dataKey==0:
            if molWeight<=0.0:
                base.putMessage ( "<h3 class='header-red'>No molecules with " +\
                                  "given sequences can be fit in asymmetric " +\
                                  "unit.<br>No structure revision created.</h3>" )
            else:
                base.putMessage ( "<h3 class='header-red'>Error: default data " +\
                                  "key, please report to developer or " +\
                                  "maintainer.</h3>" )
        elif dataKey==1:
            base.putMessage ( "<h3 class='header-red'>No molecule with " +\
                              "given sequence (" + str(nRes) + " residues) " +\
                              "can be fit in asymmetric unit.<br>No " +\
                              "structure revision created.</h3>" )
        else:
            base.putMessage ( "<h3 class='header-red'>Given sequences " +\
                              "(total " + str(nRes) + " residues) cannot " +\
                              "be fit in asymmetric unit.<br>No structure " +\
                              "revision created.<h3>" )

    else:

        tdict2 = {
            "title": "Molecule fitting statistics",
            "state": 0, "class": "table-blue", "css": "text-align:right;",
            "horzHeaders" :  [
                #{ "label": "N<sub>units</sub>"   , "tooltip":
                #   "Number of given content units placed in asymmetric unit" },
                { "label": "N<sub>asu</sub>"   , "tooltip":
                   "Number of suggested ASUs placed in asymmetric unit for trial" },
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
            for i in range(4):
                tdict2["rows"][0]["data"][i] = "<b>" + tdict2["rows"][0]["data"][i] + "</b>"

        rvapi_utils.makeTable ( tdict2, base.getWidgetId("res_table"),
                                base.report_page_id(),
                                base.rvrow,0,1,1 )
        base.rvrow += 1

        #  create initial structure revision
        revision = revision0
        if not revision:
            revision = dtype_revision.DType ( -1 )
        revision.setReflectionData ( hkl )
        revision.setASUData ( seq,nRes,molWeight,dataKey,mc1,sol1,prb1 )

        #makeAsuFitMessage ( base,nc0,sol0 )

        title = "Verdict"
        if not resultTitle:
            title = "*Verdict"
        verdict_asudef.putVerdictWidget ( base,{
            "ncopies"    : ncopies1,
            "nc"         : nc0,
            "sol"        : sol1,
            "resolution" : hkl.getHighResolution(raw=True)
        },secId=secId,title=title )

        if revision:
            base.generic_parser_summary["z02"] = {
                "SolventPercent" : int(10*sol1)/10.0
            }

    return (revision,nc0,sol0)


# ------------------------------------------------------------------------

def revisionFromStructure ( base,hkl,structure,name,useSequences=None,
                                 make_revision=True ):

    chains  = structure.xyzmeta["xyz"][0]["chains"]
    seq     = []
    nocc    = []
    id      = []
    stype   = []
    type_aa = 0
    type_nr = 0
    for i in range(len(chains)):
        s = chains[i]["seq"]
        if chains[i]["type"] not in ["UNK","LIG"]:
            n = 1
            for j in range(len(seq)):
                if s==seq[j]:
                    n += 1
                    nocc[j] += 1
            if n==1:
                seq  .append ( s )
                nocc .append ( 1 )
                id   .append ( chains[i]["id"] )
                stype.append ( chains[i]["type"].lower() )
                if chains[i]["type"]=="Protein":
                    type_aa += 1
                else:
                    type_nr += 1

    annotation = {"rename":{}, "annotation":[] }
    base.resetFileImport()
    for i in range(len(seq)):
        fname = ""
        if base.outputFName and base.outputFName!="*":
            fname = base.outputFName +  "_"
        fname += name + "_" + id[i] + ".fasta"
        dtype_sequence.writeSeqFile ( os.path.join(base.importDir(),fname),
                                      name + "_" + id[i],seq[i] )
        base.addFileImport ( fname,import_filetype.ftype_Sequence() )
        annot = { "file":fname, "rename":fname, "items":[
          { "rename":fname, "contents": seq[i], "type": stype[i] }
        ]}
        annotation["annotation"].append ( annot )

    f = open ( "annotation.json","w" )
    f.write ( json.dumps(annotation) )
    f.close ()

    # prepare sequence data

    seqs = []

    if not useSequences:   #  import sequence data

        # take a list of already imported sequences
        if dtype_sequence.dtype() in base.outputDataBox.data:
            seqs = base.outputDataBox.data[dtype_sequence.dtype()]
        seqid0 = []
        for i in range(len(seqs)):
            seqid0.append ( seqs[i].dataId )

        # import new sequences
        import_sequence.run ( base,"Sequences imported from " + name )
        base.rvrow += 1

        # subtract previously imported sequences
        seqs = []
        if dtype_sequence.dtype() in base.outputDataBox.data:
            seqs1 = base.outputDataBox.data[dtype_sequence.dtype()]
            for i in range(len(seqs1)):
                if seqs1[i].dataId not in seqid0:
                    seqs.append ( seqs1[i] )

    else:
        seqs = useSequences

    # check sequence numbers
    if len(seqs)!=len(nocc):
        return None

    for i in range(len(seqs)):
        seqs[i].ncopies = nocc[i]

    #  finally, create structure revision

    if make_revision:

        if base.outputFName and base.outputFName=="*":
            base.outputFName = name

        composition = "P"
        if type_aa<1:
            composition = "D"
        elif type_nr>0:
            composition = "C"

        base.putMessage ( "&nbsp;<br><h3>Asymmetric Unit Analysis</h3>" )

        revision = makeRevision ( base,hkl,seqs,composition,"NR","1","1",
                                                            "",None,"" )
        if revision[0]:
            revision[0].setStructureData ( structure   )
            base.registerRevision        ( revision[0] )

        return revision[0]

    return None



# ============================================================================
# Make ASUDef driver

class ASUDef(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # make task-specific definitions
    def matthews_report(self):  return "matthews_report"
    def getXMLFName    (self):  return "matthews.xml"

    # the following will provide for import of generated sequences
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the TEMPORARY XML file.
        if os.path.isfile(self.getXMLFName()):
            os.remove(self.getXMLFName())

        # Prepare matthews input

        # fetch input data
        istruct = None
        if hasattr(self.input_data.data,"istruct"):
            istruct = self.makeClass ( self.input_data.data.istruct[0] )

        hkl  = self.makeClass ( self.input_data.data.hkl[0] )
        sec1 = self.task.parameters.sec1.contains
        seq  = []
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq = self.input_data.data.seq

        #self.putVerdict ( 50,"message" )

        revision = makeRevision ( self,hkl,seq,
                                  self.getParameter(sec1.COMPOSITION_SEL),
                                  self.getParameter(sec1.ESTIMATE_SEL),
                                  self.getParameter(sec1.NRES),
                                  self.getParameter(sec1.MOLWEIGHT),"" )
        #                          self.getParameter(sec1.RESLIMIT) )

        have_results = False

        if revision[0]:
            if istruct:
                revision[0].setStructureData ( istruct )
            revision[0].ASU.ha_type = self.getParameter ( self.task.parameters.HATOM )
            revName = None
            if self.outputFName in ["*",""]:
                revName = "asu [" + hkl.getDataSetName() + "]"
            revision[0].addSubtypes ( hkl.subtype )
            self.registerRevision ( revision[0],revisionName=revName )
            have_results = True

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ASUDef ( "",os.path.basename(__file__) )
    drv.start()
