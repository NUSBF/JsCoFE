##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    25.08.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SLICE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.slice jobManager jobDir jobId
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
# import sys
# import shutil
#
# #  ccp4-python imports
# import gemmi

#  application imports
from . import basic
# from   pycofe.proc   import seqal
# from   pycofe.auto   import auto

# ============================================================================
# Model preparation driver

class Slice(basic.TaskDriver):


    def make_models ( self,seq,xyz,modSel,sclpSel,csMode ):

        # fpath_seq = seq.getSeqFilePath ( self.inputDir() )
        # ensNo     = 0
        ensOk     = False
        models    = []

        for i in range(len(xyz)):

            # chainSel = xyz[i].chainSel
            # if not chainSel:
            if not xyz[i].chainSel:
                chains = xyz[i].xyzmeta.xyz[0].chains
                for j in range(len(chains)):
                    if len(chains[j].seq)>0:
                        chainSel = chains[j].id
                        xyz[i].chainSel = chainSel
                        break

            fpath_out,sid = self.trim_chain ( xyz[i],xyz[i].chainSel,seq,modSel,sclpSel,csMode )

            # if os.stat(fpath_out).st_size<100:
            if not fpath_out:
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
                    model.meta  = { "rmsd" : "", "seqId" : sid, "eLLG" : "" }
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

        xyz     = self.makeClass ( self.input_data.data.xyz[0] )
        sec1    = self.task.parameters.sec1.contains
        nsplits = self.getParameter ( sec1.NSPLITS )

        cmd = [
            "-xyzin"     ,xyz.getXYZFilePath(self.inputDir()),
            "-min_splits",nsplits,
            "-max_splits",nsplits
        ]

        rc = self.runApp ( "slicendice",cmd,logType="Main",quitOnError=False )

        nmodels  = 0

        if rc.msg:
            self.putTitle ( "Failure" )
            self.putMessage ( "<i>Program failure, please report</i>" )
        else:
            dirName  = os.path.join ( "slicendice_0","split_"+str(nsplits) )
            outFiles = sorted([f for f in os.listdir(dirName) if f.endswith(".pdb")])
            if len(outFiles)<=0:
                self.putTitle ( "No models generated" )
                self.putMessage ( "<i>No models were generated, although expected</i>" )
            else:
                self.putTitle ( "Results" )
                for fname in outFiles:
                    fpath = os.path.join ( dirName,fname )
                    model = self.registerModel ( xyz.subtype,fpath,checkout=True )
                    if model:
                        nmodels += 1
                        self.putMessage ( "<h3>Model #" + str(nmodels) + ": " +\
                                          model.dname + "</h3>" )
                        # model.addDataAssociation ( seq.dataId )
                        # if not afmodels[i]["seq_ident"]:
                        #     afmodels[i]["seq_ident"] = "0.0"
                        model.meta  = {
                            "rmsd"    : "1.2",
                            "seqId"   : "100.0"
                        }
                        model.seqId = "100.0"
                        model.rmsd  = "1.2"
                        self.add_seqid_remark ( model,["100.0"] )
                        self.putModelWidget ( self.getWidgetId("model_btn"),
                                              "Coordinates",model )
                        have_results = True
                    else:
                        self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                          fname + "</h3>" )

        self.generic_parser_summary["slice"] = {
          "summary_line" : str(nmodels) + " model(s) generated"
        }

        #
        # auto.makeNextTask ( self,{
        #     "model" : models[0]
        # })


        self.success ( nmodels>0 )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Slice ( "",os.path.basename(__file__) )
    drv.start()
