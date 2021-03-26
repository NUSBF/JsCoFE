##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    24.03.21   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import gemmi

#  application imports
from . import basic
from   pycofe.proc   import seqal
from   pycofe.auto   import auto

# ============================================================================
# Model preparation driver

class ModelPrepXYZ(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def fetch_chain ( self, chainSel,fpath_in,resrange=None ):
        if chainSel=="(all)" or not chainSel:
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
        # remove alternative conformations
        for chain in model:
            for res in chain:
                k = len(res)
                for i in range(len(res)):
                    k -= 1
                    if res[k].has_altloc() and res[k].altloc!="A":
                        del res[k]
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

    def prepare_sculptor ( self, protocolNo,fpath_in,fpath_algn,fpath_out ):
        root_name = "__sculptor"
        self.open_stdin()
        self.write_stdin ([
            "input",
            "{",
            "model",
            "{",
            "file_name = " + fpath_in,
            "}",
            "alignment",
            "{",
            "file_name = " + fpath_algn,
            "target_index = 1",
            "}",
            "}",
            "output",
            "{",
            "folder = ./",
            "root = " + root_name,
            "}",
            "macromolecule",
            "{",
            "protocols = " + str(protocolNo),
            "renumber",
            "{",
            "use = original",
            "}",
            "rename = 0",
            "}",
            "hetero = None"
        ])
        self.close_stdin()

        cmd = [ "--stdin","--mode=predefined" ]
        if sys.platform.startswith("win"):
            self.runApp ( "phaser.sculptor.bat",cmd,logType="Service" )
        else:
            self.runApp ( "phaser.sculptor",cmd, logType="Service" )

        files = [f for f in os.listdir("./") if f.startswith(root_name) and f.endswith(".pdb")]
        if len(files)>0:
            shutil.move ( files[0],fpath_out )
        for i in range(1,len(files)):
            os.remove ( files[i] )
        return

    def prepare_chainsaw ( self, mode,fpath_in,fpath_algn,fpath_out ):
        self.open_stdin()
        self.write_stdin ([
            "mode " + mode,
            "END"
        ])
        self.close_stdin()
        self.runApp (
            "chainsaw",[
                "XYZIN"  ,fpath_in,
                "ALIGNIN",fpath_algn,
                "XYZOUT" ,fpath_out
            ],
            logType="Service"
        )
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


    def make_models ( self,seq,xyz,modSel,sclpSel,csMode ):

        fpath_seq = seq.getSeqFilePath ( self.inputDir() )
        # ensNo     = 0
        ensOk     = False
        models    = []

        for i in range(len(xyz)):

            chainSel = xyz[i].chainSel
            if not chainSel:
                chains = xyz[i].xyzmeta.xyz[0].chains
                for j in range(len(chains)):
                    if len(chains[j].seq)>0:
                        chainSel = chains[j].id
                        xyz[i].chainSel = chainSel
                        break

            if chainSel.startswith("/"):
                chainSel = chainSel[1:].replace("/","_")  # split("/")[-1]
            fpath_in = self.fetch_chain ( xyz[i].chainSel, # this is correct
                                          xyz[i].getXYZFilePath(self.inputDir()) )

            if hasattr(xyz[i],"fpath_algn"):
                fpath_algn = xyz[i].fpath_algn
                sid        = str(xyz[i].seqid_algn)
            else:
                fpath_algn = "__align_" + str(i) + ".fasta"
                rc         = seqal.run ( self,[seq,xyz[i]],fpath_algn )
                self.stdoutln ( str(rc) )
                if rc["code"]==0:
                    sid = str(round(100.0*rc["stat"]["seq_id"],1))
                else:
                    sid = "0"

            fpath_out = xyz[i].getXYZFileName()
            if xyz[i].chainSel!="(all)":  # this is correct
                fname, fext = os.path.splitext(fpath_out)
                if not fname.endswith("_"+chainSel):
                    fpath_out   = fname + "_" + chainSel + fext
            #elif modSel=="S":
            #    fpath_tmp = "__input_sculptor_clipped.pdb"
            #    self.prepare_clip ( fpath_in,fpath_tmp )
            #    fpath_in  = fpath_tmp

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
                elif modSel=="S":
                    fpath_out = fname + ".sclp" + fext
                    self.prepare_sculptor ( sclpSel,fpath_in,fpath_algn,fpath_out )
                elif modSel=="C":
                    fpath_out = fname + ".chnw" + fext
                    self.prepare_chainsaw ( csMode,fpath_in,fpath_algn,fpath_out )
                elif modSel=="P":
                    fpath_out = fname + ".pala" + fext
                    self.prepare_polyalanine ( fpath_in,fpath_out )

            if os.stat(fpath_out).st_size<100:
                if ensOk:
                    self.putMessage ( "&nbsp;" )
                self.putMessage ( "<h3>*** Failed to prepare model for " +\
                                  xyz[i].dname + " (empty output)</h3>" )
                ensOk = False
            else:
                model = self.registerModel ( seq,fpath_out,checkout=True )
                if model:
                    #if ensNo<1:
                    if len(models)<1:
                        self.putMessage ( "<i><b>Prepared models are associated " +\
                                          "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                        self.putTitle ( "Results" )
                    else:
                        self.putMessage ( "&nbsp;" )
                    #ensNo += 1
                    ensOk  = True
                    self.putMessage ( "<h3>Model #" + str(len(models)+1) + ": " + model.dname + "</h3>" )
                    model.addDataAssociation ( seq.dataId )
                    model.meta  = { "rmsd" : "", "seqId" : sid }
                    model.seqId = model.meta["seqId"]
                    model.rmsd  = model.meta["rmsd" ]

                    if modSel!="S":
                        self.add_seqid_remark ( model,[sid] )

                    self.putModelWidget ( self.getWidgetId("model_btn"),
                                          "Coordinates",model )
                    models.append ( model )

                else:
                    if ensOk:
                        self.putMessage ( "&nbsp;" )
                    self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                      xyz[i].dname + "</h3>" )
                    ensOk = False

        return models


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        seq     = self.makeClass ( self.input_data.data.seq[0] )
        xyz     = self.input_data.data.xyz
        sec1    = self.task.parameters.sec1.contains
        modSel  = self.getParameter ( sec1.MODIFICATION_SEL )

        sclpSel = self.getParameter ( sec1.SCULPTOR_PROTOCOL_SEL )
        csMode  = self.getParameter ( sec1.CHAINSAW_MODE_SEL     )

        for i in range(len(xyz)):
            xyz[i] = self.makeClass ( xyz[i] )

        models = self.make_models ( seq,xyz,modSel,sclpSel,csMode )

        # this will go in the project tree job's line
        if len(models)>0:

            protocol = "(unmodified)"
            if modSel=="D":
                protocol = "(clipped)"
            elif modSel=="M":
                protocol = "(molrep protocol)"
            elif modSel=="S":
                protocol = "(sculptor protocol #" + sclpSel + ")"
            elif modSel=="C":
                protocol = "(chainsaw "
                if   csMode=="MIXS":  protocol += "to gamma atoms)"
                elif csMode=="MIXA":  protocol += "to beta atoms)"
                elif csMode=="MAXI":  protocol += "to last common atoms)"
            elif modSel=="P":
                protocol = "(reduced to polyalanine)"

            self.generic_parser_summary["modelprepxyz"] = {
              "summary_line" : str(len(models)) + " model(s) generated " + protocol
            }

            auto.makeNextTask ( self.task,{
                "model" : models[0]
            })


        self.success ( (len(models)>0) )
        return



# ============================================================================

if __name__ == "__main__":

    drv = ModelPrepXYZ ( "",os.path.basename(__file__) )
    drv.start()
