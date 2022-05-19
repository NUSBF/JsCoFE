##!/usr/bin/python

#
# ============================================================================
#
#    19.05.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SRF EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.structureprediction.srf jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SLURM
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

# from fileinput import filename
import os
import stat
# import uuid

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

        scriptf = "process.sh"

        # close execution logs and quit

        seq  = self.makeClass ( self.input_data.data.seq[0] )
        sec1 = self.task.parameters.sec1.contains

        seqfilename = seq.getSeqFilePath(self.inputDir())

        # dirName=uuid.uuid4().hex
        # program = self.getParameter ( sec1.PROGRAM )
        #
        # cmd=['-m', program,
        #     '-p', dirName,
        #     '-f', filename
        # ]
        #
        # self.putWaitMessageLF ( "Prediction in progress ..." )
        # self.rvrow -= 1
        #
        # appName=os.environ['ALPHAFOLD_CFG']
        #
        # self.runApp ( appName,cmd,logType="Main",quitOnError=False )

        # if os.path.isdir(dirName):

        dirName = "af2_output"
        # os.mkdir ( dirName )

        # cmd = [
        #   os.path.join ( os.environ["CCP4"],"bin","af2start" ),
        #   "--seqin" , seqfilename,
        #   "--out"   , dirName,
        #   "--colabfold"
        # ]
        # self.putWaitMessageLF ( "Prediction in progress ..." )
        # self.rvrow -= 1
        # self.runApp ( "python",cmd,logType="Main",quitOnError=False )

        script = "#!/bin/bash\n" +\
                 os.path.join ( os.environ["CCP4"],"bin","af2start" ) +\
                 " --seqin " + seqfilename  +\
                 " --out " + dirName + " --colabfold\n"

        self.stdout (
            "-------------------------------------------------------------------------\n" +\
            "   Processing script:\n\n" +\
            script +\
            "-------------------------------------------------------------------------\n"
        )

        f = open ( scriptf,"w" )
        f.write ( script )
        f.close()

        os.chmod ( scriptf, stat.S_IRUSR  | stat.S_IXUSR )

        self.putWaitMessageLF ( "Prediction in progress ..." )
        # self.rvrow -= 1

        rc = self.runApp ( "env",[
                                "-i",
                                "HOME=" + os.environ["HOME"],
                                "PATH=" + os.environ["PATH"],
                                "ALPHAFOLD_CFG=" + os.environ["ALPHAFOLD_CFG"],
                                "/bin/bash","-l","-c","./"+scriptf
                            ],logType="Main",quitOnError=False )

        self.putTitle ( "Results" )

        modelsNumber = 0

        fpaths = []   #  create a empty object list
        xyzs   = []   #  output data objects

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

                    xyz.fixBFactors ( self.outputDir() )
                    xyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )

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

                    xyzs.append ( xyz )

                    #models.append ( model )

        if modelsNumber == 1:
            self.generic_parser_summary["structureprediction"] = {

                    "summary_line" : str(modelsNumber) + " structure predicted"
            }
        else:
            self.generic_parser_summary["structureprediction"] = {

                    "summary_line" : str(modelsNumber) + " structures predicted"

            }

        auto.makeNextTask ( self,{
            "xyz" : xyzs,
        }, log=self.file_stderr)

        self.success( (modelsNumber>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = StructurePrediction ( "",os.path.basename(__file__) )
    drv.start()
