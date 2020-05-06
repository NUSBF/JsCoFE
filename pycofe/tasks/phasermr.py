##!/usr/bin/python

#
# ============================================================================
#
#    01.05.20   <--  Date of Last Modification.
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

from future import *

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
#from   pycofe.proc import import_merged
from   pycofe.dtypes import dtype_template
from   pycofe.proc   import verdict

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

    def makeVerdictMessage ( self,options ):
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
        if options["fllg"]<60.0:
            notes.append ( "<i>LLG</i> is critically low" )
        elif options["fllg"]<120.0:
            notes.append ( "<i>LLG</i> is lower than optimal" )
        if options["ftfz"]<8.0:
            notes.append ( "<i>TFZ</i> is critically low" )
        elif options["ftfz"]<9.0:
            notes.append ( "<i>TFZ</i> is lower than optimal" )
        if options["rfree"]>0.48:
            notes.append ( "<i>R<sub>free</sub></i> is higher than optimal" )
        elif options["rfree"]>0.55:
            notes.append ( "<i>R<sub>free</sub></i> is critically high" )

        if len(notes)<=0:
            notes.append ( "all scores are optimal" )

        if len(notes)>0:
            verdict_message += "<ul><li>" + "</li><li>".join(notes) +\
                               ".</li></ul>"

        return verdict_message


    def makeVerdictBottomLine ( self,options ):
        bottomline = "&nbsp;<br>"
        if options["nfitted"]<options["nasu"]:
            if options["score"]<66.0:
                bottomline += "Please consider that phasing scores are lower " +\
                              "if, as in this case, not all copies of " +\
                              "monomeric units are found. "
            else:
                bottomline += "Scores look good, however not all copies of " +\
                              "monomeric units are found. "
            if options["nfitted"]>options["nfitted0"]:
                bottomline += "Try to fit the remaining copies in subsequent " +\
                              "phasing attempts.<p>"
        if options["nfitted"]==options["nfitted0"]:
            bottomline += "<i>No new copies could be found in this run, " +\
                          "therefore, you may need to proceed to model " +\
                          "building.</i><p>"
        elif options["nfitted"]==options["nasu"]:
            bottomline += "<i>Assumed total number of monomeric units in ASU " +\
                          "has been reached, you may need to proceed to  " +\
                          "model building."
            if options["score"]<34.0:
                bottomline += " Bear in mind that phasing quality look " +\
                              "doubtful. Model building may be difficult or " +\
                              "not successful at all."
            bottomline += "</i><p>"

        return  bottomline +\
            "In general, correctness of phasing solution may be ultimately " +\
            "judged only by the ability to (auto-)build in the resulting " +\
            "electron density. As a practical hint, <i>R<sub>free</sub></i> " +\
            "should decrease in subsequent refinement.</i><br>&nbsp;"


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
                                    reserveRows=3 )
        if structure:
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

            fllg    = float ( llg )
            ftfz    = float ( tfz )
            rfree   = float ( self.generic_parser_summary["refmac"]["R_free"] )

            nfitted = structure.getNofPolymers()
            nasu    = revision.getNofASUMonomers()

            options = {
                "score"    : verdict.calcVerdictScore ({
                                "TFZ" :   { "value"  : ftfz,
                                            "weight" : 2.0,
                                            "good"   : [8.0,10.0,12.0,50.0],
                                            "bad"    : [8.0,7.0,6.0,0.0]
                                          },
                                "LLG" :   { "value"  : fllg,
                                            "weight" : 2.0,
                                            "good"   : [90.0,120.0,240.0,5000.0],
                                            "bad"    : [90.0,60.0,40.0,0.0]
                                          },
                                "Rfree" : { "value"  : rfree,
                                            "weight" : 1.0,
                                            "good"   : [0.5,0.46,0.4,0.1],
                                            "bad"    : [0.5,0.54,0.56,0.66]
                                          }
                             }, 1 ),
                "nfitted0" : nfitted0,
                "nfitted"  : nfitted,
                "nasu"     : nasu,
                "fllg"     : fllg,
                "ftfz"     : ftfz,
                "rfree"    : rfree
            }

            tdict = {
                "title": "Phasing summary",
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

            self.putMessage1 ( self.report_page_id(),"&nbsp;" ,row0 )
            row0 += 1

            verdict.makeVerdictSection ( self,tdict,options["score"],
                                         self.makeVerdictMessage    ( options ),
                                         self.makeVerdictBottomLine ( options ),
                                         row=row0 )


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PhaserMR ( "",os.path.basename(__file__) )
    drv.start()
