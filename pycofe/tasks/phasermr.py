##!/usr/bin/python

#
# ============================================================================
#
#    19.04.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PHASERMR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.phasermr.py jobManager jobDir jobId
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
import sys
import shutil
import math

#  ccp4-python imports
import pyrvapi

#  application imports
import basic
#from   pycofe.proc import import_merged
from   pycofe.dtypes import dtype_template
from   pycofe.varut  import rvapi_utils

# ============================================================================
# Make PhaserMR driver

class PhaserMR(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path  (self):  return "phaser.script"

    # make task-specific definitions
    def phaser_report    (self):  return "phaser_report"

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    def cad_mtz(self): return "cad.mtz"


    # ------------------------------------------------------------------------

    def calcVerdictScore ( self,data,score_type ):

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


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare phaser input
        # fetch input data

        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl[0] )
        seq      = self.input_data.data.seq
        ens      = self.input_data.data.model

        nfitted0 = 0
        if revision.Structure:
            revision.Structure = self.makeClass ( revision.Structure )
            nfitted0 = revision.getNofPolymers()

        phaser_meta = None
        ens0        = []
        solFile     = None
        if hasattr(revision,"phaser_meta") and hasattr(self.input_data.data,"sol"):
            phaser_meta     = revision.phaser_meta
            phaser_meta.sol = self.makeClass  ( phaser_meta.sol )
            solFile         = phaser_meta.sol.getFilePath (
                                   self.inputDir(),dtype_template.file_key["sol"] )
            ens_dict = vars(phaser_meta.ensembles)
            for ensname in ens_dict:
                if ensname.startswith("ensemble"):
                    ens_dict[ensname].data = self.makeClass ( ens_dict[ensname].data )
                    ens0.append ( ens_dict[ensname].data )

        #for x in os.listdir(self.inputDir()):
        #    self.file_stdout.write(x + '\n')

        phases = None
        if hasattr(self.input_data.data,"phases"):
            phases = self.makeClass ( self.input_data.data.phases[0] )

        xstruct = None
        #if revision.hasSubtype(dtype_template.subtypeXYZ()):
        #    xstruct = self.makeClass ( revision.Structure )

        if hasattr(self.input_data.data,"xmodel"):
            xstruct = self.makeClass ( self.input_data.data.xmodel[0] )

        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )

        for i in range(len(ens)):
            ens[i] = self.makeClass ( ens[i] )
            if not phaser_meta or ens[i].ensembleName() not in ens_dict:
                ens0.append ( ens[i] )

        if phases:
            phases_mtz = phases.getMTZFilePath(self.inputDir())
            phases_labels = ( phases.FWT, phases.PHWT )
            """
            self.open_stdin()
            self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\n" %hkl_labels     )
            self.write_stdin ( "LABIN FILE 2 E1=%s E2=%s\n" %phases_labels )
            self.write_stdin ( "END\n" )
            self.close_stdin()
            cmd = [ "HKLIN1", hklfile,
                    "HKLIN2", phases.getMTZFilePath(self.inputDir()),
                    "HKLOUT", self.cad_mtz() ]
            """
            self.open_stdin()
            self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\n" %phases_labels )
            self.write_stdin ( "END\n" )
            self.close_stdin()
            cmd = [ "HKLIN1", phases.getMTZFilePath(self.inputDir()),
                    "HKLOUT", self.cad_mtz() ]
            self.runApp ( "cad",cmd,logType="Service" )
            hklfile   = self.cad_mtz()
            hkl_labin = "\nLABIN FWT=" + phases_labels[0] + " PHWT=" + phases_labels[1]

        else:
            try:
                hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
                hkl_labin  =  "\nLABIN  I=" + hkl_labels[0] + " SIGI=" + hkl_labels[1]
            except:
                hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
                hkl_labin  =  "\nLABIN  F=" + hkl_labels[0] + " SIGF=" + hkl_labels[1]
            hklfile = hkl.getHKLFilePath ( self.inputDir() )


        # make a file with input script
        self.open_stdin()
        self.write_stdin (
            "TITLE Phaser-MR" +\
            "\nMODE MR_AUTO"  +\
            "\nROOT \""       + self.outputFName + "\"" +\
            "\nHKLIN \""      + hklfile + "\"" +\
            hkl_labin
        )

        if phases:
            self.write_stdin ( "\nSGALTERNATIVE SELECT NONE" )
        elif hkl.spg_alt=='ALL':
            self.write_stdin ( "\nSGALTERNATIVE SELECT ALL" )
        else:
            splist = hkl.spg_alt.split ( ";" )
            if len(splist)<=1:
                self.write_stdin ( "\nSGALTERNATIVE SELECT NONE" )
            elif splist[0].startswith("I"):
                self.write_stdin ( "\nSGALTERNATIVE SELECT LIST" )
                self.write_stdin ( "\nSGALTERNATIVE TEST " + splist[0] )
                self.write_stdin ( "\nSGALTERNATIVE TEST " + splist[1] )
            else:
                self.write_stdin ( "\nSGALTERNATIVE SELECT HAND" )

        for i in range(len(ens0)):
            ename = ens0[i].ensembleName()
            if ens0[i].simtype=="seqid":
                self.write_stdin (
                        "\nENSEMBLE " + ename + " &" +\
                        "\n    PDB \"" + ens0[i].getXYZFilePath(self.inputDir()) +\
                        "\" IDENT " + str(ens0[i].seqId) +\
                        "\nENSEMBLE " + ename + " HETATM ON"
                    )
            elif ens0[i].simtype=="rmsd":
                self.write_stdin (
                        "\nENSEMBLE " + ename + " &" +\
                        "\n    PDB \"" + ens0[i].getXYZFilePath(self.inputDir()) +\
                        "\" RMS " + str(ens0[i].rmsd) +\
                        "\nENSEMBLE " + ename + " HETATM ON"
                    )
            else:  # "cardon"
                self.write_stdin (
                        "\nENSEMBLE " + ename + " &" +\
                        "\n    PDB \"" + ens0[i].getXYZFilePath(self.inputDir()) +\
                        "\" CARD ON" +\
                        "\nENSEMBLE " + ename + " HETATM ON"
                    )

        self.write_stdin ( "\nCOMPOSITION BY ASU" )
        for i in range(len(seq)):
            if (seq[i].isNucleotide()):
                self.write_stdin ( "\nCOMPOSITION NUCLEIC SEQ" )
            else:
                self.write_stdin ( "\nCOMPOSITION PROTEIN SEQ" )
            self.write_stdin ( " \"" +\
                seq[i].getSeqFilePath(self.inputDir()) +\
                "\" NUMBER " + str(seq[i].ncopies)
            )

        for i in range(len(ens)):
            self.write_stdin (
                "\nSEARCH ENSEMBLE " + ens[i].ensembleName() +\
                " NUMBER " + str(ens[i].ncopies)
            )

        if solFile:
            self.write_stdin ( "\n@" + solFile )

        elif xstruct:  # optional data parameter
            self.write_stdin (
                "\nENSEMBLE " + xstruct.ensembleName() + " &" +\
                "\n    PDB \"" + xstruct.getXYZFilePath(self.inputDir()) +\
                "\" IDENT 0.9" +\
                "\nSOLUTION ORIGIN ENSEMBLE " + xstruct.ensembleName()
            )
            ens0.append ( xstruct )
            #inp_sol_file = xstruct.getSolFilePath ( self.inputDir() )
            #if inp_sol_file:
            #    self.write_stdin ( "\n@"+inp_sol_file )


        # add options

        if hkl.res_high:
            self.write_stdin ( "\nRESOLUTION HIGH " + str(hkl.res_high) )
        if hkl.res_low:
            self.write_stdin ( "\nRESOLUTION LOW " + str(hkl.res_low) )
        if hkl.res_ref:
            self.write_stdin ( "\nRESOLUTION AUTO HIGH " + str(hkl.res_ref) )

        self.write_stdin ( "\n" )

        sec0 = self.task.parameters.sec0.contains
        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains
        sec3 = self.task.parameters.sec3.contains

        if sec0.RF_TARGET_SEL.value != "FAST":
            self.writeKWParameter ( sec0.RF_TARGET_SEL )
        if sec0.RF_ANGLE_SEL.visible:
            self.write_stdin ( "ROTATE VOLUME " + sec0.RF_ANGLE_SEL.value )
            if sec0.RF_ALPHA.visible:
                self.write_stdin ( self.getKWParameter("EULER",sec0.RF_ALPHA) +\
                                   self.getKWParameter(""     ,sec0.RF_BETA)  +\
                                   self.getKWParameter(""     ,sec0.RF_GAMMA) +\
                                   self.getKWParameter("RANGE",sec0.RF_RANGE) )
            self.write_stdin ( "\n" )


        if phases:
            self.write_stdin ( "HKLOUT OFF\n" )                          # bypassing a bug in phaser 2.8.2(ccp4)
            self.write_stdin ( "TARGET TRA PHASED\n" )

        elif sec0.TF_TARGET_SEL.value != "FAST":
            self.writeKWParameter ( sec0.TF_TARGET_SEL )

        if sec0.TF_POINT_SEL.visible:
            self.write_stdin ( "TRANSLATE VOLUME " + sec0.TF_POINT_SEL.value )
            if sec0.TF_X.visible:
                self.write_stdin ( self.getKWParameter("POINT",sec0.TF_X) +\
                                   self.getKWParameter(""     ,sec0.TF_Y)  +\
                                   self.getKWParameter(""     ,sec0.TF_Z) +\
                                   self.getKWParameter("RANGE",sec0.TF_RANGE) )
                self.write_stdin ( "\n" )
                self.writeKWParameter ( sec0.TF_SPACE_SEL )
            else:
                self.write_stdin ( "\n" )


        self.writeKWParameter ( sec1.TNCS_SEL            )
        self.writeKWParameter ( sec1.TNCS_NA             )

        self.writeKWParameter ( sec1.PACK_SEL            )
        self.writeKWParameter ( sec1.PACK_CUTOFF         )

        self.writeKWParameter ( sec1.RS_PEAKS_SEL        )
        self.writeKWParameter ( sec1.RS_PEAKS_P_CUTOFF   )
        self.writeKWParameter ( sec1.RS_PEAKS_S_CUTOFF   )
        self.writeKWParameter ( sec1.RS_PEAKS_N_CUTOFF   )
        if sec0.RF_TARGET_SEL.value == "FAST":
            self.writeKWParameter ( sec0.RF_CLUSTER_SEL )
        else:
            self.write_stdin ( "PEAKS ROT CLUSTER OFF\n" )

        self.writeKWParameter ( sec1.TS_PEAKS_SEL        )
        self.writeKWParameter ( sec1.TS_PEAKS_P_CUTOFF   )
        self.writeKWParameter ( sec1.TS_PEAKS_S_CUTOFF   )
        self.writeKWParameter ( sec1.TS_PEAKS_N_CUTOFF   )

        self.writeKWParameter ( sec1.DR_SEARCH_DOWN      )

        self.writeKWParameter ( sec1.PURGE_ROT_SEL       )
        self.writeKWParameter ( sec1.PURGE_ROT_CUTOFF    )
        self.writeKWParameter ( sec1.PURGE_ROT_NUMBER    )

        self.writeKWParameter ( sec1.PURGE_TRA_SEL       )
        self.writeKWParameter ( sec1.PURGE_TRA_CUTOFF    )
        self.writeKWParameter ( sec1.PURGE_TRA_NUMBER    )

        self.writeKWParameter ( sec1.PURGE_RNP_SEL       )
        self.writeKWParameter ( sec1.PURGE_RNP_CUTOFF    )
        self.writeKWParameter ( sec1.PURGE_RNP_NUMBER    )

        self.writeKWParameter ( sec2.TOPFILES            )

        self.writeKWParameter ( sec3.SEARCH_METHOD_SEL   )
        self.writeKWParameter ( sec3.PERMUTE_SEL         )

        self.writeKWParameter ( sec3.SEARCH_PRUNE_SEL    )

        self.writeKWParameter ( sec3.TRA_PACKING_SEL     )
        self.writeKWParameter ( sec3.TRA_PACKING_OVERLAP )

        self.writeKWParameter ( sec3.FORMFACTORS_SEL     )

        self.close_stdin()

        # make command-line parameters for phaser
        cmd = []

        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )

        # Start phaser
        self.runApp ( "phaser",cmd,logType="Main" )
        self.unsetLogParser()

        # check solution and register data
        phaser_meta  = None
        have_results = False
        sol_hkl      = hkl
        sol_file     = self.outputFName + ".sol"
        if os.path.isfile(sol_file):

            phaser_meta = { "ensembles" : {} }
            ens_meta    = phaser_meta["ensembles"]

            solf = open ( sol_file,"r" )
            soll = solf.readlines()
            solf.close()
            sol_spg = None
            nsol    = 0
            llg     = None
            tfz     = None
            for line in soll:
                if line.startswith("SOLU 6DIM ENSE"):
                    if nsol<=1:
                        lnsplit = line.split()
                        if len(lnsplit)>3:
                            ensname = line.split()[3]
                            if ensname in ens_meta:
                                ens_meta[ensname]["ncopies"] += 1
                            else:
                                ens_meta[ensname] = { "ncopies" : 1 }
                elif line.startswith("SOLU SPAC "):
                    sol_spg = line.replace("SOLU SPAC ","").strip()
                elif line.startswith("SOLU SET "):
                    nsol += 1
                    pos   = line.rfind("LLG=")
                    if pos>=0 and not llg:
                        llg = line[pos:].split()[0][4:]
                    pos = line.rfind("TFZ==")
                    if pos>=0 and not tfz:
                        tfz = line[pos:].split()[0][5:]

            mtzfile = self.outputFName + ".1.mtz"

            if "phaser" not in self.generic_parser_summary:
                self.generic_parser_summary["phaser"] = {}
            self.generic_parser_summary["phaser"]["count"] = nsol
            self.generic_parser_summary["phaser"]["llg"]   = llg
            self.generic_parser_summary["phaser"]["tfz"]   = tfz

            self.putMessage ( "&nbsp;" );
            spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
            if spg_change:
                mtzfile = spg_change[0]
                sol_hkl = spg_change[1]
                revision.setReflectionData ( sol_hkl )

        row0 = self.rvrow + 1
        structure = self.finaliseStructure ( self.outputFName+".1.pdb",
                                    self.outputFName,sol_hkl,None,seq,0,
                                    leadKey=1,openState_bool=False,
                                    reserveRows=2 )
        if structure:
            self.stderrln ( str(structure.xyzmeta) )
            # update structure revision
            revision.setStructureData ( structure )
            self.registerRevision     ( revision  )
            have_results = True
            if phaser_meta:
                # set sol file
                solData = dtype_template.DType ( self.job_id )
                self.dataSerialNo += 1
                solData.makeDName ( self.dataSerialNo )
                solData.add_file ( sol_file,self.outputDir(),"sol" )
                phaser_meta["sol"] = solData
                for i in range(len(ens0)):
                    ensname = ens0[i].ensembleName()
                    if ensname in ens_meta:
                        ens_meta[ensname]["data"] = ens0[i]
                revision.phaser_meta = phaser_meta

            # Verdict section

            fllg  = float ( llg )
            ftfz  = float ( tfz )
            rfree = float ( self.generic_parser_summary["refmac"]["R_free"] )

            nfitted = structure.getNofPolymers()
            nasu    = revision.getNofASUMonomers()

            verdict_score = self.calcVerdictScore ({
                "TFZ" :   { "value"  : ftfz,
                            "weight" : 2.0,
                            "good"   : [8.0,10.0,12.0,50.0],
                            "bad"    : [8.0,7.0,6.0,0.0]
                          },
                "LLG" :   {   "value"  : fllg,
                            "weight" : 2.0,
                            "good"   : [90.0,120.0,240.0,5000.0],
                            "bad"    : [90.0,60.0,40.0,0.0]
                          },
                "Rfree" : { "value"  : rfree,
                            "weight" : 1.0,
                            "good"   : [0.5,0.46,0.4,0.1],
                            "bad"    : [0.5,0.54,0.56,0.66]
                          }
            }, 1 )

            self.putTitle1 ( self.report_page_id(),"Verdict",row0 )

            tdict = {
                "title": "Summary scores",
                "state": 0, "class": "table-blue", "css": "text-align:right;",
                "rows" : [
                    { "header": { "label": "LLG", "tooltip": "Log-Likelihood Gain score"},
                      "data"  : [ llg ]},
                    { "header": { "label": "TFZ", "tooltip": "Translation Function Z-score"},
                      "data"  : [ tfz ]},
                    { "header": { "label": "R<sub>free</sub>", "tooltip": "Free R-factor"},
                      "data"  : [ self.generic_parser_summary["refmac"]["R_free"] ]},
                    { "header": { "label"  : "Found copies",
                                  "tooltip": "Number of found copies / total copies in ASU" },
                      "data"  : [ str(nfitted) + "/" + str(nasu) ]},
                ]
            }

            gridId = self.getWidgetId ( "verdict_grid" )
            self.putGrid1 ( gridId,self.report_page_id(),False,row0+1 )
            rvapi_utils.makeTable ( tdict, self.getWidgetId("summary_table"),
                                    gridId,0,0,2,1 )

            verdict_message = "<b style='font-size:18px;'>"
            if verdict_score>=67:
                verdict_message += "The structure is likely to be solved."
            elif verdict_score>=34:
                verdict_message += "There are chances that structure is solved, " +\
                                   "however, this is not certain. This case may " +\
                                   "be difficult."
            else:
                verdict_message += "It is unlikely that the structure is solved."
            verdict_message += "</b>"

            notes = []
            if fllg<60.0:
                notes.append ( "<i>LLG</i> is critically low" )
            elif fllg<120.0:
                notes.append ( "<i>LLG</i> is lower than optimal" )
            if ftfz<8.0:
                notes.append ( "<i>TFZ</i> is critically low" )
            elif ftfz<9.0:
                notes.append ( "<i>TFZ</i> is lower than optimal" )
            if rfree>0.48:
                notes.append ( "<i>R<sub>free</sub></i> is higher than optimal" )
            elif rfree>0.55:
                notes.append ( "<i>R<sub>free</sub></i> is critically high" )

            if len(notes)<=0:
                notes.append ( "all scores are optimal" )

            if len(notes)>0:
                verdict_message += "<ul><li>" + "</li><li>".join(notes) +\
                                   ".</li></ul>"

            self.putMessage1 ( gridId,"&nbsp;&nbsp;&nbsp;",1,1 )
            self.putMessage1 ( gridId,"<span style='font-size:10px;'>&nbsp;</span>",0,2 )
            self.putVerdict1 ( gridId,verdict_score,verdict_message,1,col=2 )

            bottomline = "&nbsp;<br>"
            if nfitted<nasu:
                if verdict_score<66.0:
                    bottomline += "Please consider that solution scores are lower " +\
                                  "if, as in this case, not all copies of " +\
                                  "monomeric units are found. "
                else:
                    bottomline += "Scores look good, however not all copies of " +\
                                  "monomeric units are found. "
                if nfitted>nfitted0:
                    bottomline += "Try to fit the remaining copies in subsequent " +\
                                  "phasing attempts.<p>"
            if nfitted==nfitted0:
                bottomline += "<i>No new copies were found in this run, " +\
                              "therefore, you may need to proceed to model " +\
                              "building.</i><p>"
            self.putMessage1 ( self.report_page_id(), bottomline +\
                "Correctness of phasing solution may be ultimately " +\
                "judged only by the ability to (auto-)build in the " +\
                "resulting electron density. As a practical hint, " +\
                "<i>R<sub>free</sub></i> should decrease in subsequent " +\
                "refinement.</i>",row0+2 )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PhaserMR ( "",os.path.basename(__file__) )
    drv.start()
