##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PAIREF EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pairef jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2023-2024
#
# ============================================================================
#

#  python native imports
import os

import gemmi

#  application imports
from . import basic

# ============================================================================
# Make PhaserRB driver

class PhaserRB(basic.TaskDriver):

    # make task-specific definitions
    def phaser_report    (self):  return "phaser_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When pairef
        # succeeds, this file is created.
        xyzout = self.getXYZOFName()
        if os.path.isfile(xyzout):
            os.remove(xyzout)

        # Prepare pairef input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl[0] )
        seq      = self.input_data.data.seq
        xyz      = self.makeClass ( self.input_data.data.xyz[0] )

        try:
            hkl_labels = ( hkl.dataset.Imean.value, hkl.dataset.Imean.sigma )
            hkl_labin  =  "LABIN  I=" + hkl_labels[0] + " SIGI=" + hkl_labels[1]
        except:
            hkl_labels = ( hkl.dataset.Fmean.value, hkl.dataset.Fmean.sigma )
            hkl_labin  =  "LABIN  F=" + hkl_labels[0] + " SIGF=" + hkl_labels[1]
        hklfile = hkl.getHKLFilePath ( self.inputDir() )


        self.open_stdin()
        self.write_stdin ([
            "TITLE Phaser-RB",
            "MODE MR_RNP",
            "ROOT  \"" + self.outputFName + "\"",
            "HKLIN \"" + hklfile          + "\"",
            hkl_labin,
            "COMPOSITION BY ASU"
        ])

        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )
            if (seq[i].isNucleotide()):
                self.write_stdin ( "COMPOSITION NUCLEIC SEQ" )
            else:
                self.write_stdin ( "COMPOSITION PROTEIN SEQ" )
            self.write_stdin ( " \"" +\
                seq[i].getSeqFilePath(self.inputDir()) +\
                "\" NUMBER " + str(seq[i].ncopies) + "\n"
            )

        xyzin = xyz.getPDBFilePath ( self.inputDir() )

        solu  = []
        st    = gemmi.read_structure ( xyzin )
        st.setup_entities()
        for chain in st[0]:
            st1 = gemmi.Structure()
            md1 = gemmi.Model ( "1" )
            md1.add_chain ( chain )
            st1.add_model ( md1   )
            chainout = "_ens_" + chain.name + ".pdb"
            st1.write_pdb ( chainout )
            ensname  = "ens" + chain.name
            self.write_stdin ( "ENSEMBLE " + ensname + " PDB " + chainout + " RMS 0.1\n" )
            solu.append ( "SOLU 6DIM ENSE " + ensname + " EULER 0 0 0 FRAC 0 0 0 BFAC 0" )

        self.write_stdin ( solu )

        self.close_stdin ()


        # MODE MR_RNP
        # ROOT dir_x/_tmp2
        # HKLIN input/hklin.mtz
        # LABIN F=FMEAN SIGF=SIGFMEAN
        # COMPOSITION BY ASU
        # COMPOSITION PROTEIN SEQ input/seqin.fasta NUMBER 6
        # ENSEMBLE eA PDB dir_x/_tmp1_01_A.pdb RMS 0.1
        # ENSEMBLE eB PDB dir_x/_tmp1_02_B.pdb RMS 0.1
        # ENSEMBLE eC PDB dir_x/_tmp1_03_C.pdb RMS 0.1
        # ENSEMBLE eD PDB dir_x/_tmp1_04_D.pdb RMS 0.1
        # ENSEMBLE eE PDB dir_x/_tmp1_05_E.pdb RMS 0.1
        # SOLU 6DIM ENSE eA EULER 0 0 0 FRAC 0 0 0 BFAC 0
        # SOLU 6DIM ENSE eB EULER 0 0 0 FRAC 0 0 0 BFAC 0
        # SOLU 6DIM ENSE eC EULER 0 0 0 FRAC 0 0 0 BFAC 0
        # SOLU 6DIM ENSE eD EULER 0 0 0 FRAC 0 0 0 BFAC 0
        # SOLU 6DIM ENSE eE EULER 0 0 0 FRAC 0 0 0 BFAC 0


        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )
        # Start phaser
        self.runApp ( "phaser",[],logType="Main",quitOnError=False )
        self.unsetLogParser()

        # check solution and register data
        have_results = False
        sol_file     = self.outputFName + ".sol"
        mtzfile      = self.outputFName + ".1.mtz"
        pdbfile      = self.outputFName + ".1.pdb"

        if os.path.isfile(sol_file) and os.path.isfile(mtzfile) and os.path.isfile(pdbfile):

            #verdict_row = self.rvrow
            self.rvrow += 4

            # self.putTitle ( "Output Structure" +\
            #             self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            row0 = self.rvrow + 1
            structure = self.finaliseStructure ( pdbfile,
                                        self.outputFName,hkl,None,seq,0,
                                        leadKey=1, # openState="closed",
                                        reserveRows=3 )
            if structure:
                # update structure revision
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True
                # if phaser_meta:
                #     # set sol file
                #     solData = dtype_template.DType ( self.job_id )
                #     self.dataSerialNo += 1
                #     solData.makeDName ( self.dataSerialNo )
                #     solData.add_file ( sol_file,self.outputDir(),"sol" )
                #     phaser_meta["sol"] = solData
                #     for i in range(len(ens0)):
                #         ensname = ens0[i].ensembleName()
                #         if ensname in ens_meta:
                #             ens_meta[ensname]["data"] = ens0[i]
                #     revision.phaser_meta = phaser_meta

                # Verdict section

                # verdict_meta = {
                #     "nfitted0" : nfitted0,
                #     "nfitted"  : structure.getNofPolymers(),
                #     "nasu"     : revision.getNofASUMonomers(),
                #     "fllg"     : float ( llg ),
                #     "ftfz"     : float ( tfz ),
                #     "rfree"    : float ( self.generic_parser_summary["refmac"]["R_free"] )
                # }
                # verdict_phasermr.putVerdictWidget ( self,verdict_meta,row0 )

                # auto.makeNextTask(self, {
                #     "revision" : revision,
                #     "Rfree"    : float ( self.generic_parser_summary["refmac"]["R_free"] ),
                #     "nfitted0" : nfitted0, # number of polymers before run
                #     "nfitted"  : structure.getNofPolymers(), # number of polymers after run
                #     "nasu"     : revision.getNofASUMonomers(), # number of predicted subunits
                # }, log=self.file_stderr)

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

    drv = PhaserRB ( "",os.path.basename(__file__) )
    drv.start()
