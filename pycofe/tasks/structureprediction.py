##!/usr/bin/python

#
# ============================================================================
#
#    22.03.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SRF EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.srf jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

from fileinput import filename
import os
import uuid
# import glob

from pycofe.tasks  import basic

# ============================================================================
# StructurePrediction driver

class StructurePrediction(basic.TaskDriver):

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
        lst = fcnt.split ( "\n" )
        for s in lst:
            if "REMARK PHASER ENSEMBLE MODEL" not in s:
                file.write ( s + "\n" )
        # file.write  ( fcnt )
        file.close  ()
        model.seqrem  = True
        model.simtype = "cardon"
        if len(seqid_lst)==1:
            model.meta["seqId"] = seqid_lst[0]
        return

    def run(self):

        # put message
        # self.putMessage ( "Hi!" )

        # print in standard output and standard error streams
        # self.file_stdout.write ( "Some Stucture Prediction?\n" )
        # self.file_stderr.write ( "Hmmm?\n" )

        # close execution logs and quit

        seq = self.makeClass ( self.input_data.data.seq[0] )

        sec1 = self.task.parameters.sec1.contains

        filename=seq.getSeqFilePath(self.inputDir())

        dirName=uuid.uuid4().hex


        program = self.getParameter ( sec1.PROGRAM )

        cmd=['-m', program,
            '-p', dirName,
            '-f', filename
        ]


        appName=os.environ['AF2_script']

        self.runApp ( appName,cmd,logType="Main",quitOnError=False )

        # if os.path.isdir(dirName):

        #     xyzfile = "output_" + self.outdir_name() + ".pdb"

        fpaths=[]
        for file in os.listdir(dirName):
            if file.lower().endswith(".pdb"):
                fpaths.append(os.path.join(dirName, file))

        if len(fpaths) <=0:
            self.putMessage ( "<i><b>No models are found " )
        else:

            self.putTitle ( "Results" )
            self.putMessage ( "<i><b>Prepared models are associated " +\
                                                "with sequence:&nbsp;" + seq.dname + "</b></i>" )

            for fpath_out in fpaths:


                model = self.registerModel ( seq,fpath_out,checkout=True )
                if model:
                    #if ensNo<1:


                    #ensNo += 1
                    ensOk  = True
                    self.putMessage ( "<h3>Model #" + model.dname + "</h3>" )
                    model.addDataAssociation ( seq.dataId )
                    sid='100.0'
                    model.meta  = { "rmsd" : "", "seqId" : sid, "eLLG" : "" }
                    model.seqId = model.meta["seqId"]
                    model.rmsd  = model.meta["rmsd" ]

                    self.add_seqid_remark ( model,[sid] )

                    self.putModelWidget ( self.getWidgetId("model_btn"),
                                            "Coordinates",model )
                    #models.append ( model )

        self.success( True )
        return


# ============================================================================

if __name__ == "__main__":

    drv = StructurePrediction ( "",os.path.basename(__file__) )
    drv.start()
