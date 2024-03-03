##!/usr/bin/python

#
# ============================================================================
#
#    03.02.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MODELPREPMC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.modelprepmc jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021-2023
#
# ============================================================================
#

#  python native imports
import os
# import sys
# import shutil

#  ccp4-python imports
import gemmi

#  application imports
from . import modelprepxyz
# from   pycofe.proc   import seqal
from   pycofe.auto   import auto

# ============================================================================
# Model preparation driver

class ModelPrepMC(modelprepxyz.ModelPrepXYZ):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        xyz     = self.makeClass ( self.input_data.data.xyz[0] )
        seq     = self.input_data.data.seq

        sec1    = self.task.parameters.sec1.contains
        modSel  = self.getParameter ( sec1.MODIFICATION_SEL )

        sclpSel = self.getParameter ( sec1.SCULPTOR_PROTOCOL_SEL )
        csMode  = self.getParameter ( sec1.CHAINSAW_MODE_SEL     )

        self.fixBFactors ( [xyz] )
        # if xyz.BF_correction=="alphafold-suggested":
        #    xyz.fixBFactors ( self.inputDir(),"alphafold" )
        # elif xyz.BF_correction=="rosetta-suggested":
        #    xyz.fixBFactors ( self.inputDir(),"rosetta" )

        # molWeight = 0.0
        nRes   = 0

        st0    = None
        sidm   = 0.0
        stypes = []

        nAA    = 0
        nDNA   = 0
        nRNA   = 0

        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )
            chains = []
            if seq[i].chain_list!="*":
                chains = seq[i].chain_list.split(",")
            else:
                chains = xyz.getChainList()
            # molWeight += len(chains)*seq[i].weight
            for chainId in chains:
                xyz.chainSel  = chainId
                if seq[i].isProtein():
                    fpath_out,sid = self.trim_chain ( xyz,chainId,seq[i],modSel,sclpSel,csMode )
                else:
                    self.putMessage ( "<b>*** chain " + chainId + " is not protein, " +\
                                      "\"clipped\" protocol will be used</b>" )
                    fpath_out,sid = self.trim_chain ( xyz,chainId,seq[i],"D",sclpSel,csMode )
                if not fpath_out:
                    self.putMessage ( "<h3>*** Failed to trim chain " + chainId + " (1)</h3>" )
                else:
                    st = gemmi.read_structure ( fpath_out )
                    st.setup_entities()
                    if len(st)>0 and len(st[0])>0:
                        st[0][0].name = chainId  # may be changed at trimming
                        if not st0:
                            st0 = st
                        else:
                            st0[0].add_chain ( st[0][0] )
                        if seq[i].isProtein():  nAA  += 1
                        if seq[i].isDNA():      nDNA += 1
                        if seq[i].isRNA():      nRNA += 1
                        sidm += float(sid)*seq[i].size
                        nRes += seq[i].size
                        for stype in seq[i].subtype:
                            if stype not in stypes:
                                stypes.append ( stype )
                    else:
                        self.putMessage ( "<h3>*** Failed to trim chain " + chainId + " (2)</h3>" )

        model = None
        if st0:
            sidm = str(round(sidm/nRes,1))
            model_path = xyz.getPDBFileName()
            st0.write_pdb ( model_path )
            model = self.registerModel ( stypes,model_path,checkout=True )
            if model:
                self.putTitle ( "Results" )
                self.putMessage ( "<h3>Model " + model.dname + "</h3>" )
                model.meta  = {
                    "rmsd"       : "",
                    "seqId"      : sidm,
                    "eLLG"       : "",
                    "multichain" : True
                }
                model.seqId = model.meta["seqId"]
                model.rmsd  = model.meta["rmsd" ]

                # if modSel!="S":
                self.add_seqid_remark ( model,[sidm] )

                self.putModelWidget ( self.getWidgetId("model_btn"),
                                      "Coordinates:&nbsp;",model )

            else:
                self.putMessage ( "<h3>*** Failed to form Model object</h3>" )
        else:
            self.putMessage ( "<h3>*** No suitable chains found</h3>" )

        # this will go in the project tree job's line
        if model:

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

            chains_desc = []
            if nAA:  chains_desc.append ( str(nAA)  + " protein" )
            if nDNA: chains_desc.append ( str(nDNA) + " dna"     )
            if nRNA: chains_desc.append ( str(nRNA) + " rna"     )
            self.generic_parser_summary["modelprepmc"] = {
              "summary_line" : "complex model with " + ",".join(chains_desc) +\
                               " chains generated " + protocol
            }

            auto.makeNextTask ( self,{
                "model" : model
            })

        self.success ( model )
        return



# ============================================================================

if __name__ == "__main__":

    drv = ModelPrepMC ( "",os.path.basename(__file__) )
    drv.start()
