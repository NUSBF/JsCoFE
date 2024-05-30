##!/usr/bin/python

#
# ============================================================================
#
#    24.11.23   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

# from future import *

#  python native imports
import os
import re

#  application imports
from . import basic
from   pycofe.dtypes   import dtype_template
from   pycofe.verdicts import verdict_phasermr
from   pycofe.auto     import auto, auto_workflow


# ============================================================================
# Make PhaserMR driver

class PhaserMR(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path  (self):  return "phaser.script"

    # make task-specific definitions
    def phaser_report    (self):  return "phaser_report"

    # the following is for importing the generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    def cad_mtz(self): return "cad.mtz"

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
            # phases_mtz = phases.getMTZFilePath(self.inputDir())
            phases_labels = ( phases.FWT, phases.PHWT )
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


        # try:
        #     hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
        #     hkl_labin  =  "\nLABIN  I=" + hkl_labels[0] + " SIGI=" + hkl_labels[1]
        # except:
        #     hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
        #     hkl_labin  =  "\nLABIN  F=" + hkl_labels[0] + " SIGF=" + hkl_labels[1]
        # if phases:
        #     phases_mtz = phases.getMTZFilePath(self.inputDir())
        #     phases_labels = ( phases.FWT, phases.PHWT )
        #     self.open_stdin()
        #     self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\n" %hkl_labels    )
        #     self.write_stdin ( "LABIN FILE 2 E1=%s E2=%s\n" %phases_labels )
        #     self.write_stdin ( "END\n" )
        #     self.close_stdin()
        #     cmd = [ "HKLIN1", hkl   .getHKLFilePath(self.inputDir()),
        #             "HKLIN2", phases.getMTZFilePath(self.inputDir()),
        #             "HKLOUT", self  .cad_mtz() ]
        #     self.runApp ( "cad",cmd,logType="Service" )
        #     hklfile   = self.cad_mtz()
        #     hkl_labin = hkl_labin + " FWT=" + phases_labels[0] + " PHWT=" + phases_labels[1]
        # else:
        #     hklfile = hkl.getHKLFilePath ( self.inputDir() )



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
                        "\n    PDB \"" + ens0[i].getPDBFilePath(self.inputDir()) +\
                        "\" IDENT " + str(ens0[i].seqId) +\
                        "\nENSEMBLE " + ename + " HETATM ON"
                    )
            elif ens0[i].simtype=="rmsd":
                self.write_stdin (
                        "\nENSEMBLE " + ename + " &" +\
                        "\n    PDB \"" + ens0[i].getPDBFilePath(self.inputDir()) +\
                        "\" RMS " + str(ens0[i].rmsd) +\
                        "\nENSEMBLE " + ename + " HETATM ON"
                    )
            else:  # "cardon"
                self.write_stdin (
                        "\nENSEMBLE " + ename + " &" +\
                        "\n    PDB \"" + ens0[i].getPDBFilePath(self.inputDir()) +\
                        "\" CARD ON" +\
                        "\nENSEMBLE " + ename + " HETATM ON"
                    )

        self.write_stdin ( "\nCOMPOSITION BY ASU" )
        for i in range(len(seq)):
            seqfpath = seq[i].getSeqFilePath ( self.inputDir() )
            with open(seqfpath,"r") as seqfile:
                seqcont = seqfile.read().upper().replace("-","").replace("*","")
            if (seq[i].isNucleotide()):
                self.write_stdin ( "\nCOMPOSITION NUCLEIC SEQ" )
                # do this because phaser is lazy
                seqcont = seqcont.replace("B","C").replace("D","A") \
                                 .replace("H","A").replace("K","G") \
                                 .replace("M","A").replace("N","A") \
                                 .replace("R","A").replace("S","C") \
                                 .replace("V","A").replace("W","A") \
                                 .replace("Y","C").replace("U","T")
            else:
                self.write_stdin ( "\nCOMPOSITION PROTEIN SEQ" )
            seqfpath, fext = os.path.splitext ( seqfpath )
            seqfpath       = seqfpath + ".m" + fext
            self.stdoutln ( seqcont )
            with open(seqfpath,"w") as seqfile:
                seqfile.write ( seqcont )
            self.write_stdin ( " \"" + seqfpath + "\" NUMBER " + str(seq[i].ncopies) )

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
                "\n    PDB \"" + xstruct.getPDBFilePath(self.inputDir()) +\
                "\" IDENT 0.9" +\
                "\nSOLUTION ORIGIN ENSEMBLE " + str(xstruct.ensembleName())
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

        # if sec0.RF_TARGET_SEL.value != "FAST":
        #     self.writeKWParameter ( sec0.RF_TARGET_SEL )
        # if sec0.RF_ANGLE_SEL.visible:
        #     self.write_stdin ( "ROTATE VOLUME " + sec0.RF_ANGLE_SEL.value )
        #     if sec0.RF_ALPHA.visible:
        #         self.write_stdin ( self.getKWParameter("EULER",sec0.RF_ALPHA) +\
        #                            self.getKWParameter(""     ,sec0.RF_BETA)  +\
        #                            self.getKWParameter(""     ,sec0.RF_GAMMA) +\
        #                            self.getKWParameter("RANGE",sec0.RF_RANGE) )
        #     self.write_stdin ( "\n" )

        # if sec0.RF_TARGET_SEL.value != "FAST":
        #     self.writeKWParameter ( sec0.RF_TARGET_SEL )
        #     self.write_stdin ( "ROTATE VOLUME " + sec0.RF_ANGLE_SEL.value )
        #     if sec0.RF_ANGLE_SEL.value=="AROUND":
        #         self.write_stdin ( self.getKWParameter("EULER",sec0.RF_ALPHA) +\
        #                            self.getKWParameter(""     ,sec0.RF_BETA)  +\
        #                            self.getKWParameter(""     ,sec0.RF_GAMMA) +\
        #                            self.getKWParameter("RANGE",sec0.RF_RANGE) )
        #     self.write_stdin ( "\n" )

        if self.getParameter(sec0.RF_TARGET_SEL)=="BRUTE":
            self.writeKWParameter ( sec0.RF_TARGET_SEL )
            if str(self.writeKWParameter(sec0.RF_ANGLE_SEL))=="AROUND":
                self.write_stdin ( self.getKWParameter("EULER",sec0.RF_ALPHA) +\
                                   self.getKWParameter(""     ,sec0.RF_BETA)  +\
                                   self.getKWParameter(""     ,sec0.RF_GAMMA) +\
                                   self.getKWParameter("RANGE",sec0.RF_RANGE) +\
                                   "\n" )

        if phases:
            # self.write_stdin ( "HKLOUT OFF\n" )  # bypassing a bug in phaser 2.8.2(ccp4)
            self.write_stdin ( "TARGET TRA PHASED\n" )

        elif sec0.TF_TARGET_SEL.value != "FAST":
            self.writeKWParameter ( sec0.TF_TARGET_SEL )
            self.write_stdin ( "TRANSLATE VOLUME " + sec0.TF_POINT_SEL.value )
            if sec0.TF_POINT_SEL.value=="AROUND":
                self.write_stdin ( self.getKWParameter("POINT",sec0.TF_X) +\
                                   self.getKWParameter(""     ,sec0.TF_Y)  +\
                                   self.getKWParameter(""     ,sec0.TF_Z) +\
                                   self.getKWParameter("RANGE",sec0.TF_RANGE) )
                self.write_stdin ( "\n" )
                self.writeKWParameter ( sec0.TF_SPACE_SEL )
            else:
                self.write_stdin ( "\n" )


        # if sec0.TF_POINT_SEL.visible:
        #     self.write_stdin ( "TRANSLATE VOLUME " + sec0.TF_POINT_SEL.value )
        #     if sec0.TF_X.visible:
        #         self.write_stdin ( self.getKWParameter("POINT",sec0.TF_X) +\
        #                            self.getKWParameter(""     ,sec0.TF_Y)  +\
        #                            self.getKWParameter(""     ,sec0.TF_Z) +\
        #                            self.getKWParameter("RANGE",sec0.TF_RANGE) )
        #         self.write_stdin ( "\n" )
        #         self.writeKWParameter ( sec0.TF_SPACE_SEL )
        #     else:
        #         self.write_stdin ( "\n" )


        if str(self.writeKWParameter(sec1.TNCS_SEL))=="ON":
            self.writeKWParameter ( sec1.TNCS_NA )

        if str(self.writeKWParameter(sec1.PACK_SEL))=="PERCENT":
            self.writeKWParameter ( sec1.PACK_CUTOFF         )

        peaks_sel = str ( self.writeKWParameter(sec1.RS_PEAKS_SEL) )
        # we cannot rely on the "visibility" attribute here because of
        # workflows, which run non-graphically
        if peaks_sel=="PERCENT":
            self.writeKWParameter ( sec1.RS_PEAKS_P_CUTOFF )
        elif peaks_sel=="SIGMA":
            self.writeKWParameter ( sec1.RS_PEAKS_S_CUTOFF )
        elif peaks_sel=="NUMBER":
            self.writeKWParameter ( sec1.RS_PEAKS_N_CUTOFF )
        if sec0.RF_TARGET_SEL.value == "FAST":
            self.writeKWParameter ( sec0.RF_CLUSTER_SEL )
        else:
            self.write_stdin ( "PEAKS ROT CLUSTER OFF\n" )

        peaks_sel = str ( self.writeKWParameter(sec1.TS_PEAKS_SEL) )
        if peaks_sel=="PERCENT":
            self.writeKWParameter ( sec1.TS_PEAKS_P_CUTOFF )
        elif peaks_sel=="SIGMA":
            self.writeKWParameter ( sec1.TS_PEAKS_S_CUTOFF )
        elif peaks_sel=="NUMBER":
            self.writeKWParameter ( sec1.TS_PEAKS_N_CUTOFF )

        if str(self.getParameter(sec1.DR_SEARCH_SEL))=="ON":
            self.writeKWParameter ( sec1.DR_SEARCH_DOWN )

        if str(self.writeKWParameter(sec1.PURGE_ROT_SEL))=="ON":
            self.writeKWParameter ( sec1.PURGE_ROT_CUTOFF )
            self.writeKWParameter ( sec1.PURGE_ROT_NUMBER )

        if str(self.writeKWParameter(sec1.PURGE_TRA_SEL))=="ON":
            self.writeKWParameter ( sec1.PURGE_TRA_CUTOFF )
            self.writeKWParameter ( sec1.PURGE_TRA_NUMBER )

        if str(self.writeKWParameter(sec1.PURGE_RNP_SEL))=="ON":
            self.writeKWParameter ( sec1.PURGE_RNP_CUTOFF )
            self.writeKWParameter ( sec1.PURGE_RNP_NUMBER )

        self.writeKWParameter ( sec2.TOPFILES )

        if str(self.writeKWParameter(sec3.SEARCH_METHOD_SEL))=="FULL":
            self.writeKWParameter ( sec3.PERMUTE_SEL )

        self.writeKWParameter ( sec3.SEARCH_PRUNE_SEL    )

        if str(self.writeKWParameter(sec3.TRA_PACKING_SEL))=="ON":
            self.writeKWParameter ( sec3.TRA_PACKING_OVERLAP )

        self.writeKWParameter ( sec3.FORMFACTORS_SEL )

        self.close_stdin()

        # make command-line parameters for phaser
        cmd = []

        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )

        # Start phaser
        self.runApp ( "phaser",cmd,logType="Main",quitOnError=False )
        self.unsetLogParser()

        # check solution and register data

        phaser_meta  = None
        have_results = False
        sol_hkl      = hkl
        sol_file     = self.outputFName + ".sol"
        mtzfile      = self.outputFName + ".1.mtz"
        pdbfile      = self.outputFName + ".1.pdb"

        if os.path.isfile(sol_file) and os.path.isfile(mtzfile) and os.path.isfile(pdbfile):

            phaser_meta = { "ensembles" : {} }
            ens_meta    = phaser_meta["ensembles"]

            with open(sol_file,"r") as solf:
                sol = solf.read()

            sol1 = re.sub ( "[\[].*?[\]]", "",sol )
            if sol1 != sol:
                with open(sol_file,"w") as solf:
                    solf.write ( sol1 )

            soll = sol1.splitlines(False)

            # solf = open ( sol_file,"r" )
            # soll = solf.readlines()
            # solf.close()

            sol_spg = None
            nsol    = 0
            llg     = None
            tfz     = None
            for line in soll:
                if line.startswith("SOLU 6DIM ENSE"):
                    if nsol<=1:
                        lnsplit = line.split()
                        if len(lnsplit)>3:
                            # ensname = line.split()[3].split("[")[0]
                            ensname = line.split()[3]
                            if ensname in ens_meta:
                                ens_meta[ensname]["ncopies"] += 1
                            else:
                                ens_meta[ensname] = { "ncopies" : 1 }
                elif line.startswith("SOLU SPAC ") and not sol_spg:
                    sol_spg = line.replace("SOLU SPAC ","").strip()
                elif line.startswith("SOLU SET "):
                    nsol += 1
                    if not llg:
                        pos = line.rfind("LLG=")
                        if pos>=0:
                            llg = line[pos:].split()[0].split("=")[-1]
                    if not tfz:
                        pos = line.rfind("TFZ=")
                        if pos>=0:
                            tfz = line[pos:].split()[0].split("=")[-1]
                            if tfz=="*":
                                tfz = None

            if not llg: llg = "0"
            if not tfz: tfz = "0"

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
            structure = self.finaliseStructure ( pdbfile,
                                        self.outputFName,sol_hkl,None,seq,0,
                                        leadKey=1, # openState="closed",
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

                verdict_meta = {
                    "nfitted0" : nfitted0,
                    "nfitted"  : structure.getNofPolymers(),
                    "nasu"     : revision.getNofASUMonomers(),
                    "fllg"     : float ( llg ),
                    "ftfz"     : float ( tfz ),
                    "rfree"    : float ( self.generic_parser_summary["refmac"]["R_free"] )
                }
                verdict_phasermr.putVerdictWidget ( self,verdict_meta,row0 )

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision"  : [revision]
                            },
                            "scores" :  {
                                "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                                "Rfree"    : self.generic_parser_summary["refmac"]["R_free"],
                                "nfitted0" : nfitted0,         # number of polymers before run
                                "nfitted"  : structure.getNofPolymers()  # number of polymers after run
                            }
                    })

                else:  # pre-coded workflow framework
                    auto.makeNextTask(self, {
                        "revision" : revision,
                        "Rfree"    : float ( self.generic_parser_summary["refmac"]["R_free"] ),
                        "nfitted0" : nfitted0,    # number of polymers before run
                        "nfitted"  : structure.getNofPolymers(),  # number of polymers after run
                        "nasu"     : revision.getNofASUMonomers() # number of predicted subunits
                    }, log=self.file_stderr)

        else:
            self.putTitle ( "No solution was obtained" )
            self.putMessage ( 
                "No suitable results have been produced. Inspect Main Log for possible problems, " +\
                "errors, warnings and hints. In particular, check whether packing criteria should " +\
                "be relaxed or translational NCS switched off."
            )
            self.generic_parser_summary["phaser"] = {
                "summary_line" : "solution not found"
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PhaserMR ( "",os.path.basename(__file__) )
    drv.start()
