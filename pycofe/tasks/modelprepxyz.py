##!/usr/bin/python

#
# ============================================================================
#
#    14.03.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MODELPREPXYZ EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.modelprepxyz jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  ccp4-python imports
import gemmi

#  application imports
import basic
from   pycofe.proc   import seqal

# ============================================================================
# Make Ensemble preparation driver

class ModelPrepXYZ(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def fetch_chain ( self, chainSel,fpath_in,resrange=None ):
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
        model = st[0]
        # delete all other models
        while len(st)>1:
            del st[st[-1].name]
        for name in [ch.name for ch in model if ch.name!=cid]:
            model.remove_chain ( name )
        st.remove_empty_chains()
        if resrange:
            for chain in model:
                while len(chain)>resrange[1]:
                    del chain[-1]
                if len(chain)>resrange[0]:
                    for i in range(resrange[0]-1):
                        del chain[0]
            st.remove_empty_chains()
        tmpname = "__tmp.pdb"
        st.write_pdb ( tmpname )
        return tmpname

    def prepare_clip ( self, fpath_in,fpath_out ):
        st = gemmi.read_structure   ( fpath_in )
        st.remove_hydrogens         ()
        st.remove_ligands_and_waters()
        st.remove_empty_chains      ()
        st.write_pdb                ( fpath_out )
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

    def add_seqid_remark ( self,model,seqid_lst ):
        ens_path = model.getXYZFilePath ( self.outputDir() )
        file = open ( ens_path,"r" )
        fcnt = file.read()
        file.close  ()
        file = open ( ens_path,"w" )
        model.meta["seqId_ens"] = []
        for i in range(len(seqid_lst)):
            file.write  ( "REMARK PHASER ENSEMBLE MODEL " +\
                          str(i+1) + " ID " + seqid_lst[i] + "\n" )
            model.meta["seqId_ens"].append ( seqid_lst[i] )
        file.write  ( fcnt )
        file.close  ()
        model.seqrem  = True
        model.simtype = "cardon";
        return


    def make_models ( self,seq,xyz,modSel ):

        fpath_seq = seq.getSeqFilePath ( self.inputDir() )
        ensNo     = 0

        for i in range(len(xyz)):

            xyz[i]   = self.makeClass   ( xyz[i] )
            fpath_in = self.fetch_chain ( xyz[i].chainSel,
                                          xyz[i].getXYZFilePath(self.inputDir()) )
            rc = seqal.run ( self,[seq,xyz[i]],"__align_"+str(i)+".xfasta" )
            if rc["code"]==0:
                sid = str(round(100.0*rc["stat"]["seq_id"],1))
            else:
                sid = "0"

            fpath_out = xyz[i].getXYZFileName()
            if xyz[i].chainSel!="(all)":
                fname, fext = os.path.splitext(fpath_out)
                if not fname.endswith("_"+xyz[i].chainSel):
                    fpath_out   = fname + "_" + xyz[i].chainSel + fext

            if modSel=="U":
                shutil.copyfile ( fpath_in,fpath_out )
            else:
                fname, fext = os.path.splitext(fpath_out)
                if modSel=="D":
                    fpath_out = fname + ".clip" + fext
                    self.prepare_clip ( fpath_in,fpath_out )
                elif modSel=="M":
                    fpath_out = fname + ".mrep" + fext
                    self.prepare_molrep ( fpath_in,fpath_seq,fpath_out )
                elif modSel=="P":
                    fpath_out = fname + ".pala" + fext
                    self.prepare_polyalanine ( fpath_in,fpath_out )

            model = self.registerModel ( seq,fpath_out,checkout=True )
            if model:
                if ensNo<1:
                    self.putMessage ( "<i><b>Prepared models are associated " +\
                                      "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                    self.putTitle ( "Results" )
                else:
                    self.putMessage ( "&nbsp;" )
                ensNo += 1
                self.putMessage ( "<h3>Model #" + str(ensNo) + ": " + model.dname + "</h3>" )
                model.addDataAssociation ( seq.dataId )
                model.meta  = { "rmsd" : "", "seqId" : sid }
                model.seqId = model.meta["seqId"]
                model.rmsd  = model.meta["rmsd" ]
                self.add_seqid_remark ( model,[sid] )

                self.putModelWidget ( self.getWidgetId("model_btn"),
                                      "Coordinates",model )

            else:
                self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                  xyz[i].dname + "</h3>" )

        if modSel=="M": self.addCitations ( ['molrep'] )
        #if modSel=="C": self.addCitations ( ['chainsaw'] )
        #if modSel=="S": self.addCitations ( ['sculptor'] )
        #if modSel=="P": self.addCitations ( ['chainsaw'] )

        return ensNo


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        seq    = self.makeClass ( self.input_data.data.seq[0] )
        xyz    = self.input_data.data.xyz
        sec1   = self.task.parameters.sec1.contains
        modSel = self.getParameter ( sec1.MODIFICATION_SEL )

        ensNo  = self.make_models ( seq,xyz,modSel )

        # this will go in the project tree job's line
        if ensNo>0:
            self.generic_parser_summary["modelprepxyz"] = {
              "summary_line" : str(ensNo) + " model(s) generated"
            }

        self.success ( (ensNo>0) )
        return



# ============================================================================

if __name__ == "__main__":

    drv = ModelPrepXYZ ( "",os.path.basename(__file__) )
    drv.start()
