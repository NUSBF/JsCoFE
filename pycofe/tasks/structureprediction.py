##!/usr/bin/python

#
# ============================================================================
#
#    26.07.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ALPHAFOLD EXECUTABLE MODULE
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
import json
# import uuid

from pycofe.tasks  import basic
from pycofe.auto   import auto

# ============================================================================
# StructurePrediction driver

class StructurePrediction(basic.TaskDriver):

    # def add_seqid_remark ( self,model,seqid_lst ):
    #     ens_path = model.getXYZFilePath ( self.outputDir() )
    #     file = open ( ens_path,"r" )
    #     fcnt = file.read()
    #     file.close  ()
    #     file = open ( ens_path,"w" )
    #     model.meta["seqId_ens"] = []
    #     for i in range(len(seqid_lst)):
    #         file.write  ( "REMARK PHASER ENSEMBLE MODEL " +\
    #                       str(i+1) + " ID " + seqid_lst[i] + "\n" )
    #         model.meta["seqId_ens"].append ( seqid_lst[i] )
    #     lst = fcnt.split ( "\n" )
    #     for s in lst:
    #         if "REMARK PHASER ENSEMBLE MODEL" not in s:
    #             file.write ( s + "\n" )
    #     # file.write  ( fcnt )
    #     file.close  ()
    #     model.seqrem  = True
    #     model.simtype = "cardon"
    #     if len(seqid_lst)==1:
    #         model.meta["seqId"] = seqid_lst[0]
    #     return

    def run(self):

        scriptf = "process.sh"
        dirName = "af2_output"

        # close execution logs and quit

        seq  = self.makeClass ( self.input_data.data.seq[0] )
        sec1 = self.task.parameters.sec1.contains

        seqfilename = seq.getSeqFilePath(self.inputDir())

        # os.path.join ( os.environ["CCP4"],"bin","af2start" )

        engine = ""

        try:
            with open(os.environ["ALPHAFOLD_CFG"],"r") as f:
                configuration = json.load ( f )
                engine = configuration["engine"]
        except:
            self.putTitle   ( "Invalid or corrupt configuration" )
            self.putMessage ( "Task configuration file is either missing or " +\
                "misformatted. Report this to your " + self.appName() +\
                " maintainer." )
            self.generic_parser_summary["structureprediction"] = {
                "summary_line" : "error: task software misconfigured"
            }
            self.success ( False )
            return

        if engine not in ["colabfold","openfold"]:
            self.putTitle   ( "Invalid or corrupt configuration" )
            self.putMessage ( "Task engine not specified in the configuration " +\
                "file or misspelled. Report this to your " + self.appName() +\
                " maintainer." )
            self.generic_parser_summary["structureprediction"] = {
                "summary_line" : "error: task software misconfigured"
            }
            self.success ( False )
            return

        script = "#!/bin/bash\n" +\
                 "af2start"  +\
                 " --seqin " + seqfilename

        if hasattr(sec1,"MINSCORE"):
            script += " --stop-at-score " + self.getParameter(sec1.MINSCORE)

        if hasattr(sec1,"NSTRUCTS"):
            script += " --num_models " + self.getParameter(sec1.NSTRUCTS)

        script += " --out " + dirName + " --" + engine + "\n"

        self.stdout (
            "--------------------------------------------------------------------------------\n" +\
            "   Processing script:\n\n" +\
            script +\
            "--------------------------------------------------------------------------------\n"
        )

        f = open ( scriptf,"w" )
        f.write ( script )
        f.close()

        os.chmod ( scriptf, os.stat(scriptf).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH )

        self.putWaitMessageLF ( "Prediction in progress ..." )
        # self.rvrow -= 1

        rc = self.runApp ( "env",[
                                "-i",
                                "HOME=" + os.environ["HOME"],
                                "PATH=" + os.environ["PATH"],
                                "ALPHAFOLD_CFG=" + os.environ["ALPHAFOLD_CFG"],
                                "/bin/bash","-l","-c","./" + scriptf
                            ],logType="Main",quitOnError=False )

        # import shutil
        # shutil.copytree ( "/Users/eugene.krissinel/Downloads/af2-job_20/af2_output", dirName )

        nModels = 0

        if rc.msg:
            self.putTitle ( "Failed to make models" )
            self.putMessage ( "<b>Execution errors</b>" )
        else:

            fpaths = []   #  create a empty object list
            xyzs   = []   #  output data objects

            coverage_png = []
            PAE_png      = []
            plddt_png    = []

            for file in os.listdir(dirName):
                if file.lower().endswith(".pdb"): # find all pdb files in folder
                    fpaths.append(os.path.join(dirName,file))
                elif file.endswith("coverage.png"):
                    coverage_png.append ( "../" + dirName + "/" + file )
                elif file.endswith("PAE.png"):
                    PAE_png.append ( "../" + dirName + "/" + file )
                elif file.endswith("plddt.png"):
                    plddt_png.append ( "../" + dirName + "/" + file )


            if len(fpaths)<=0: # Result page in case of no models are found
                self.putTitle ( "No models generated" )
            else: # if models are found

                fpaths      .sort()
                coverage_png.sort()
                PAE_png     .sort()
                plddt_png   .sort()

                self.addCitations ( ["alphafold","colabfold"] )

                if len(PAE_png)>0:
                    self.putMessage ( "<h3>PAE matrices</h3>" )
                    gallery = ""
                    if len(PAE_png)<=1:
                        gallery = "<img src=\"" + PAE_png[0] +\
                                  "\" height=\"200px\" style=\"position:relative; left:" +\
                                  str(35*(1-len(fpaths))) + "px;\"/>"
                    else:
                        for i in range(len(PAE_png)):
                            gallery += "<img src=\"" + PAE_png[i] + "\" height=\"200px\"/>"
                    self.putMessage1 ( self.report_page_id(),gallery,
                                       self.rvrow,col=0,rowSpan=1,colSpan=1 )
                    self.rvrow += 1

                if len(plddt_png)>0:
                    self.putMessage ( "<h3>PLLDT scores</h3>" )
                    gallery = ""
                    for i in range(len(plddt_png)):
                        gallery += "<img src=\"" + plddt_png[i] +\
                                   "\" height=\"500px\" style=\"vertical-align: middle;\"/>"
                    self.putMessage1 ( self.report_page_id(),gallery,
                                       self.rvrow,col=0,rowSpan=1 )
                    self.rvrow += 1

                if len(coverage_png)>0:
                    self.putMessage ( "<h3>Sequence coverages</h3>" )
                    self.putMessage1 ( self.report_page_id(),"<img src=\"" + coverage_png[0] +\
                                "\" height=\"500px\" style=\"vertical-align: middle;\"/>",
                                self.rvrow,col=0,rowSpan=1 )
                    self.rvrow += 1

                self.putTitle ( "Generated models" )

                self.putMessage ( "<i><b>Prepared models are associated " +\
                                  "with sequence:&nbsp;" + seq.dname +\
                                  "</b></i>&nbsp;<br>&nbsp;" )

                for fpath_out in fpaths:

                    if len(fpaths)<=1:
                        outFName = self.getXYZOFName ( )
                    else:
                        outFName = self.getXYZOFName ( modifier=nModels+1 )

                    os.rename ( fpath_out,outFName )

                    # model = self.registerModel ( seq,outFName,checkout=True )
                    xyz = self.registerXYZ ( outFName )

                    if xyz:

                        nModels = nModels +1

                        xyz.fixBFactors ( self.outputDir() )
                        xyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )

                        if len(fpaths)>1:
                            self.putMessage ( "<h3>Prediction #" + str(nModels) + "</h3>" )

                        self.putMessage ( "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" + xyz.dname )
                        xyz.addDataAssociation ( seq.dataId )
                        # sid='100.0'
                        # model.meta  = { "rmsd" : "", "seqId" : sid, "eLLG" : "" }
                        # model.seqId = model.meta["seqId"]
                        # model.rmsd  = model.meta["rmsd" ]

                        # self.add_seqid_remark ( model,[sid] )

                        self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Atomic coordinates",xyz )

                        xyzs.append ( xyz )

                        #models.append ( model )

            if nModels == 1:
                self.generic_parser_summary["structureprediction"] = {
                    "summary_line" : str(nModels) + " structure predicted"
                }
            else:
                self.generic_parser_summary["structureprediction"] = {
                    "summary_line" : str(nModels) + " structures predicted"
                }

            auto.makeNextTask ( self,{
                "xyz" : xyzs,
            }, log=self.file_stderr)


        self.success ( (nModels>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = StructurePrediction ( "",os.path.basename(__file__) )
    drv.start()
