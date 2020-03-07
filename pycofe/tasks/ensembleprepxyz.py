##!/usr/bin/python

#
# ============================================================================
#
#    07.03.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLEPREPXYZ EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembleprepxyz jobManager jobDir jobId
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
#import time
import uuid

#  ccp4-python imports
#import pyrvapi
import gemmi

#  application imports
import basic
from   pycofe.proc   import analyse_ensemble #, coor
from   pycofe.proc   import make_ensemble

#from   pycofe.dtypes import dtype_template, dtype_sequence


# ============================================================================
# Make Ensembler driver

class EnsemblePrepXYZ(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path(self):  return "mrbump.script"

    # make task-specific definitions
    #def outdir_name    (self):  return "a"
    #def mrbump_report  (self):  return "mrbump_report"
    def gesamt_report  (self):  return "gesamt_report"

    # ------------------------------------------------------------------------

    def fetch_chain ( self, chainSel,fpath_in ):
        if chainSel=="(all)":
            return fpath_in
        st = gemmi.read_structure ( fpath_in )
        if chainSel.startswith("/"):
            sel_lst = chainSel.split("/")
            cid     = sel_lst[2]
            for name in [m.name for m in st if m.name!=sel_lst[1]]:
                del st[name]
        else:
            cid = chainSel
        for model in st:
            for name in [ch.name for ch in model if ch.name!=cid]:
                model.remove_chain ( name )
        st.remove_empty_chains()
        tmpname = "__tmp.pdb"
        st.write_pdb ( tmpname )
        return tmpname

    def prepare_clip ( self, fpath_in,fpath_out ):
        st = gemmi.read_structure ( fpath_in )
        st.remove_ligands_and_waters()
        st.remove_empty_chains()
        st.write_pdb ( fpath_out )
        return

    def prepare_molrep ( self, fpath_in,fpath_seq,fpath_out ):
        self.runApp (
            "molrep",[
                "-m",fpath_in,
                "-s",fpath_seq
            ],
            logType="Service"
        )
        shutil.move ( "align.pdb",fpath_out )
        return

    def prepare_polyalanine ( self, fpath_in,fpath_out ):
        st = gemmi.read_structure ( fpath_in )
        st.remove_ligands_and_waters()
        for model in st:
            for chain in model:
                chain.trim_to_alanine()
        st.remove_empty_chains()
        st.write_pdb ( fpath_out )
        return


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare ensembler input
        # fetch input data

        seq = None
        fpath_seq = None
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq = self.makeClass ( self.input_data.data.seq[0] )
            fpath_seq = seq.getSeqFilePath ( self.inputDir() )

        xyz = self.input_data.data.xyz

        sec1 = self.task.parameters.sec1.contains

        modeSel = ""
        if seq:
            if len(xyz)==1:
                modSel = self.getParameter ( sec1.MODIFICATION_SEQ_SEL )
            else:
                modSel = self.getParameter ( sec1.MODIFICATION_SEQ_MXYZ_SEL )
        else:
            modSel = self.getParameter ( sec1.MODIFICATION_NOSEQ_SEL )

        if not self.outputFName:
            if seq:
                self.outputFName = os.path.splitext(seq.getSeqFileName())[0]
            else:
                self.outputFName = os.path.splitext(xyz[0].getXYZFileName())[0]

        outputFile = "output/" + self.getXYZOFName()
        if os.path.isfile(outputFile):
            os.remove ( outputFile )

        fprepared  = []
        #gesamt_cmd = []
        for i in range(len(xyz)):
            xyz[i]    = self.makeClass   ( xyz[i] )
            fpath_in  = self.fetch_chain ( xyz[i].chainSel,
                                           xyz[i].getXYZFilePath(self.inputDir()))
            if len(xyz)==1:
                fpath_out = outputFile
            else:
                fpath_out = xyz[i].getXYZFileName()

            if modSel=="U":
                shutil.copyfile ( fpath_in,fpath_out )
            else:
                fpath_out = os.path.splitext(fpath_out)[0] + ".mod.pdb"
                if modSel=="D":
                    self.prepare_clip ( fpath_in,fpath_out )
                elif modSel=="M":
                    self.prepare_molrep ( fpath_in,fpath_seq,fpath_out )
                elif modSel=="P":
                    self.prepare_polyalanine ( fpath_in,fpath_out )
                fprepared.append ( fpath_out )
                #gesamt_cmd.append ( fpath_out )

        if modSel=="M": self.addCitations ( ['molrep'] )
        #if modSel=="C": self.addCitations ( ['chainsaw'] )
        #if modSel=="S": self.addCitations ( ['sculptor'] )
        #if modSel=="P": self.addCitations ( ['chainsaw'] )

        panelId = ""
        fout_list = make_ensemble.run ( self,panelId,fprepared,outputFile,logType="Service" )

        have_results = False

        for i in range(len(fout_list)):

            self.putMessage ( str(fout_list[i]) )
            fpath = fout_list[i][0]
            self.putMessage ( fpath )

            align_meta = analyse_ensemble.align_seq_xyz ( self,
                                            fpath_seq,fpath,seqtype="protein" )

            ensemble = self.registerEnsemble ( seq,fpath,checkout=True )
            if ensemble:

                self.putMessage ( "<h3>" + fout_list[i][1] + "</h3>" )

                alignSecId = self.getWidgetId ( self.gesamt_report() )
                self.putSection ( alignSecId,"Structural alignment",openState_bool=False )

                if analyse_ensemble.run(self,alignSecId,ensemble):

                    ensemble.addDataAssociation ( seq.dataId )

                    self.putMessage ( "&nbsp;<br><b>Associated with sequence:</b>&nbsp;" +\
                                      seq.dname + "<br>&nbsp;" )

                    if align_meta["status"]=="ok":
                        ensemble.meta["seqId"] = align_meta["id_avg"]
                    ensemble.seqId = ensemble.meta["seqId"]
                    ensemble.rmsd  = ensemble.meta["rmsd" ]

                    self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),
                                             "Coordinates",ensemble )
                    have_results = True

                else:
                    self.putMessage1 ( alignSecId,
                        "<h3>Structural alignment failed, ensemble is not useable.</h3>",0 )
                self.putMessage ( "&nbsp;" )

        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = EnsemblePrepXYZ ( "",os.path.basename(__file__) )
    drv.start()
