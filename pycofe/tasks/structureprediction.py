##!/usr/bin/python

#
# ============================================================================
#
#    14.04.22   <--  Date of Last Modification.
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

from pycofe.tasks  import basic
from pycofe.auto   import auto

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

        self.putWaitMessageLF ( "Prediction in progress ..." )
        self.rvrow -= 1

        appName=os.environ['AF2_script']

        self.runApp ( appName,cmd,logType="Main",quitOnError=False )

        # if os.path.isdir(dirName):

        self.putTitle ( "Results" )

        modelsNumber = 0

        fpaths=[] #  create a empty object list

        for file in os.listdir(dirName):
            if file.lower().endswith(".pdb"): # find all pdb files in folder
                fpaths.append(os.path.join(dirName, file))

        if len(fpaths) <=0: # Result page in case of no models are found
            self.putMessage ( "<i><b>No models are found " )
        else: # if models are found
        
            self.putMessage ( "<i><b>Prepared models are associated " +\
                                                "with sequence:&nbsp;" + seq.dname + "</b></i>&nbsp;<br>&nbsp;" )

            for fpath_out in fpaths:
                
                if len(fpaths) <=1:
                    outFName = self.getXYZOFName ( )
                else:
                    outFName = self.getXYZOFName ( modifier=modelsNumber+1 )

                os.rename(fpath_out, outFName)
            
                # model = self.registerModel ( seq,outFName,checkout=True )
                xyz = self.registerXYZ ( outFName )
                    
                if xyz:

                    modelsNumber = modelsNumber +1

                    if len(fpaths)>1:
                        self.putMessage ( "<h3>Prediction #" + str(modelsNumber) + "</h3>" )

                    self.putMessage ( "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" + xyz.dname )                    
                    xyz.addDataAssociation ( seq.dataId )
                    # sid='100.0'
                    # model.meta  = { "rmsd" : "", "seqId" : sid, "eLLG" : "" }
                    # model.seqId = model.meta["seqId"]
                    # model.rmsd  = model.meta["rmsd" ]

                    # self.add_seqid_remark ( model,[sid] ) 

                    self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Atomic coordinates",xyz,-1 )

                    auto.makeNextTask ( self,{
                        "xyz" : xyz,
                    }, log=self.file_stderr)

                    #models.append ( model )
        if modelsNumber == 1:
            self.generic_parser_summary["structureprediction"] = {

                    "summary_line" : str(modelsNumber) + " structure predicted"
            }    
        else:
            self.generic_parser_summary["structureprediction"] = {
            
                    "summary_line" : str(modelsNumber) + " structures predicted"

            }

        
        self.success( (modelsNumber>0) )
        return
    

# ============================================================================

if __name__ == "__main__":

    drv = StructurePrediction ( "",os.path.basename(__file__) )
    drv.start()
