##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    03.11.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ENSEMBLER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ensembler jobManager jobDir jobId
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

#  ccp4-python imports
import gemmi

#  application imports
from . import basic
from   pycofe.proc   import analyse_ensemble
from   pycofe.proc   import make_ensemble


# ============================================================================
# Make Ensembler driver

class Ensembler(basic.TaskDriver):

    # redefine name of input script file
    def gesamt_report(self):  return "gesamt_report"

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data

        models = self.input_data.data.models
        seq    = self.makeClass ( self.input_data.data.seq[0] )
        sec1   = self.task.parameters.sec1.contains

        fpath_seq = seq.getSeqFilePath ( self.inputDir() )

        outputFile = self.getXYZOFName()
        if os.path.isfile(outputFile):
            os.remove ( outputFile )

        fmodels = []
        for i in range(len(models)):
            models[i] = self.makeClass ( models[i] )
            fmodels.append ( models[i].getXYZFilePath(self.inputDir()) )

        trim_levels = self.getParameter ( sec1.TRIM_LEVELS )
        if not trim_levels:
            trim_levels = [100,80,60,40]
        else:
            trim_levels = [int(x) for x in trim_levels.split(",")]

        panelId   = ""
        fout_list = make_ensemble.run ( self,panelId,fmodels,outputFile,
                                        trims=trim_levels,
                                        logType="Service" )

        have_results = False

        if len(fout_list)<=0:

            self.putMessage ( "<h3>Models are too dissimilar, " +
                              "no ensemble could be made</h3>" )

        for i in range(len(fout_list)):

            fpath = fout_list[i][0]

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

                    if not ensemble.meta:
                        ensemble.meta = { "rmsd" : "", "seqId" : "" }

                    if align_meta["status"]=="ok":
                        ensemble.meta["seqId"] = align_meta["id_avg"]
                    ensemble.seqId = ensemble.meta["seqId"]
                    ensemble.rmsd  = ensemble.meta["rmsd" ]

                    self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),
                                             "Coordinates",ensemble )
                    have_results = True

                    ens_path = ensemble.getXYZFilePath ( self.outputDir() )
                    file = open ( ens_path,"r" )
                    fcnt = file.read()
                    file.close  ()
                    file = open ( ens_path,"w" )
                    ensemble.meta["seqId_ens"] = []
                    for i in range(len(models)):
                        seqId = models[i].meta.seqId
                        file.write  ( "REMARK PHASER ENSEMBLE MODEL " +\
                                      str(i+1) + " ID " + seqId + "\n" )
                        ensemble.meta["seqId_ens"].append ( seqId )
                    file.write  ( fcnt )
                    file.close  ()
                    ensemble.seqrem  = True
                    ensemble.simtype = "cardon";

                self.putMessage ( "&nbsp;" )

        self.success ( have_results )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Ensembler ( "",os.path.basename(__file__) )
    drv.start()
