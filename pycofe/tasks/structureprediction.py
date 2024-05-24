##!/usr/bin/python

#
# ============================================================================
#
#    24.05.24   <--  Date of Last Modification.
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
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev 2022-2024
#
# ============================================================================
#

# from fileinput import filename
import os
import stat
import json
import shutil
# import uuid

from pycofe.tasks  import basic
from pycofe.dtypes import dtype_sequence
from pycofe.auto   import auto

# ============================================================================
# StructurePrediction driver

class StructurePrediction(basic.TaskDriver):

    # def add_seqid_remark ( self,model,seqid_lst ):
    #     ens_path = model.getPDBFilePath ( self.outputDir() )
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

    def file_seq_path (self):  return "structure_prediction.seq"

    def run(self):

        scriptf = "process.sh"
        dirName = "af2_output"
        dirPath = os.path.join ( self.job_dir,dirName )

        # close execution logs and quit

        seq  = self.input_data.data.seq
        sec1 = self.task.parameters.sec1.contains

        seqname  = []
        sequence = []
        ncopies  = []
        for i in range(len(seq)):
            seqname.append ( 'seq' + str(i+1) )
            seq[i] = self.makeClass ( seq[i] )
            sequence.append ( seq[i].getSequence(self.inputDir()).replace("-","").replace("X","") )
            if not hasattr(seq[i],"npred"):
                seq[i].npred = 1  # backward compatibility in existing setups
            ncopies.append ( seq[i].npred )
        dtype_sequence.writeMultiSeqFile ( self.file_seq_path(),
                                           seqname,sequence,ncopies )

        simulation = False

        engine  = ""
        flavour = ""
        if simulation:
            engine  = "alphafold"
            flavour = engine
        else:
            try:
                with open(os.environ["ALPHAFOLD_CFG"],"r") as f:
                    configuration = json.load ( f )
                    engine = configuration["engine"]
                    if "flavour" in configuration:
                        flavour = configuration["flavour"]
                    else:
                        flavour = engine
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

        nmodels_str = "1"
        if hasattr(sec1,"NSTRUCTS"):
            nmodels_str = self.getParameter ( sec1.NSTRUCTS )

        if engine=="script":
            
            self.putWaitMessageLF ( "Prediction in progress ..." )

            rc = self.runApp ( configuration["script_path"],
                               [self.file_seq_path(),nmodels_str,dirName],
                               logType="Main",quitOnError=False )

            self.removeCitation ( configuration["script_path"] )
            
        elif engine in ["colabfold","openfold","alphafold"]:

            script = "#!/bin/bash\n" +\
                    "af2start"  +\
                    " --seqin " + self.file_seq_path()

            if hasattr(sec1,"MINSCORE"):
                script += " --stop-at-score " + self.getParameter(sec1.MINSCORE)

            script += " --num_models " + nmodels_str

            script += " --out " + dirPath
            
            if engine=="alphafold":
                script += "\n"  # " -relax\n"
            else:
                script += " --" + engine + "\n"

            if flavour=="alphafold":
                self.putMessage ( "Using vanilla implementation of AlphaFold" )
            elif flavour=="colabfold":
                self.putMessage ( "Using ColabFold implementation of AlphaFold" )
            else:
                self.putMessage ( "Using OpenFold implementation of AlphaFold" )

            if nmodels_str=="1":
                self.putMessage ( "1 model will be generated<br>&nbsp;" )
            else:
                self.putMessage ( nmodels_str + " models will be generated<br>&nbsp;" )

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

            if simulation:
                # import shutil
                shutil.copytree ( "C:/Users/user_name/Projects/CCP4Cloud/AF2/af2_output",dirName )

            else:
                rc = self.runApp ( "env",[
                                        "-i",
                                        "HOME=" + os.environ["HOME"],
                                        "PATH=" + os.environ["PATH"],
                                        "ALPHAFOLD_CFG=" + os.environ["ALPHAFOLD_CFG"],
                                        "/bin/bash","-l","-c","./" + scriptf
                                    ],logType="Main",quitOnError=False )

                self.removeCitation ( "env" )


        else:
            self.putTitle   ( "Invalid or corrupt configuration" )
            self.putMessage ( "Task engine is not specified in the configuration " +\
                "file or is misspelled. Report this to your " + self.appName() +\
                " maintainer." )
            self.generic_parser_summary["structureprediction"] = {
                "summary_line" : "error: task software misconfigured"
            }
            self.success ( False )
            return


        nModels = 0

        if not simulation and rc.msg:
            self.putTitle ( "Failed to make models" )
            self.putMessage ( "<b>Execution errors</b>" )
        else:
            
            fpaths  = []   #  relaxed structures
            fpaths0 = []   #  unrelaxed structures
            xyzs    = []   #  output data objects

            coverage_png = []
            PAE_png      = []
            plddt_png    = []

            if engine=="alphafold":
                coverage_png.append ( "../" + dirName + "/report/media/plot_msa.png"   )
                PAE_png     .append ( "../" + dirName + "/report/media/plot_pae.png"   )
                plddt_png   .append ( "../" + dirName + "/report/media/plot_plddt.png" )
                try:
                    with open(os.path.join(dirName,"results.json"),"r") as f:
                        results = json.load ( f )
                        if results["status"].lower()=="ok":
                            fpaths = results["structures"]
                except:
                    self.putMessage ( "<i>Results not found</i>" )

            else:
                for file in os.listdir(dirName):
                    fnlow = file.lower()
                    if fnlow.endswith(".pdb") and (flavour=="colabfold" or\
                       fnlow.endswith("_relaxed.pdb") or ("_relaxed_" in fnlow)):
                        fpaths.append ( os.path.join(dirName,file) )
                    elif fnlow.endswith("_unrelaxed.pdb") or ("_unrelaxed_" in fnlow):
                        fpaths0.append ( os.path.join(dirName,file) )
                    elif fnlow.endswith("coverage.png"):
                        coverage_png.append ( "../" + dirName + "/" + file )
                    elif fnlow.endswith("pae.png"):
                        PAE_png.append ( "../" + dirName + "/" + file )
                    elif fnlow.endswith("plddt.png"):
                        plddt_png.append ( "../" + dirName + "/" + file )
                    elif fnlow.endswith(".pkl"):
                        os.remove ( os.path.join(dirName,file) )

            if len(fpaths)<=0:
                fpaths = fpaths0  # depends on alphafold configuration

            if len(fpaths)<=0: # Result page in case of no models are generated

                self.putTitle ( "No models generated" )

            else: # if models are generated

                fpaths      .sort()
                coverage_png.sort()
                PAE_png     .sort()
                plddt_png   .sort()

                self.addCitation ( "alphafold" )
                if flavour=="colabfold":
                    self.addCitation ( "colabfold" )
                else:
                    self.addCitation ( "openfold" )

                if flavour!="openfold":

                    if len(PAE_png)>0:
                        self.putMessage  ( "<h3>PAE matrices</h3>" )
                        shift = 35
                        if flavour=="alphafold":
                            shift = 0
                        self.putMessage1 (
                            self.report_page_id(),"<img src=\"" + PAE_png[0] +\
                            "\" height=\"200px\" style=\"position:relative; left:" +\
                            str(shift*(1-len(fpaths))) + "px;\"/>",
                            self.rvrow,col=0,rowSpan=1,colSpan=1 )
                        self.rvrow += 1

                    if len(plddt_png)>0:
                        self.putMessage  ( "<h3>PLLDT scores</h3>" )
                        self.putMessage1 (
                            self.report_page_id(),"<img src=\"" + plddt_png[0] +\
                            "\" style=\"vertical-align: middle;\" height=\"500px\"/>",
                            self.rvrow,col=0,rowSpan=1 )
                        self.rvrow += 1

                    if len(coverage_png)>0:
                        self.putMessage  ( "<h3>Sequence coverages</h3>" )
                        self.putMessage1 (
                            self.report_page_id(),"<img src=\"" + coverage_png[0] +\
                            "\" height=\"500px\" style=\"vertical-align: middle;\"/>",
                            self.rvrow,col=0,rowSpan=1 )
                        self.rvrow += 1


                # if len(PAE_png)>0:
                #     self.putMessage ( "<h3>PAE matrices</h3>" )
                #     gallery = ""
                #     if len(PAE_png)<=1:
                #         gallery = "<img src=\"" + PAE_png[0] +\
                #                   "\" height=\"200px\" style=\"position:relative; left:" +\
                #                   str(35*(1-len(fpaths))) + "px;\"/>"
                #     else:
                #         for i in range(len(PAE_png)):
                #             gallery += "<img src=\"" + PAE_png[i] + "\" height=\"200px\"/>"
                #     self.putMessage1 ( self.report_page_id(),gallery,
                #                        self.rvrow,col=0,rowSpan=1,colSpan=1 )
                #     self.rvrow += 1
                #
                # if len(plddt_png)>0:
                #     self.putMessage ( "<h3>PLLDT scores</h3>" )
                #     height  = 500
                #     if len(plddt_png)>1:
                #         height = 300
                #     gallery = ""
                #     for i in range(len(plddt_png)):
                #         gallery += "<img src=\"" + plddt_png[i] +\
                #                    "\" style=\"vertical-align: middle;\" height=\"" +\
                #                    str(height) + "px\"/>"
                #     self.putMessage1 ( self.report_page_id(),gallery,
                #                        self.rvrow,col=0,rowSpan=1 )
                #     self.rvrow += 1
                #
                # if len(coverage_png)>0:
                #     self.putMessage ( "<h3>Sequence coverages</h3>" )
                #     self.putMessage1 ( self.report_page_id(),"<img src=\"" + coverage_png[0] +\
                #                 "\" height=\"500px\" style=\"vertical-align: middle;\"/>",
                #                 self.rvrow,col=0,rowSpan=1 )
                #     self.rvrow += 1

                if nmodels_str=="1":
                  self.putTitle ( "Generated model" )
                else:
                  self.putTitle ( "Generated models" )

                if len(seq)<=1:
                    msg = "<b>Associated sequence:</b>"
                else:
                    msg = "<b>Associated sequences:</b>"
                    
                msg += "<ul>"
                for s in seq: 
                    msg += "<li>" + str(s.npred) + "&nbsp;x&nbsp;" + s.dname + "</li>"
                msg += "</ul>"

                self.putMessage ( msg )

                for i in range(len(fpaths)):

                    if simulation:
                        fpaths[i] = fpaths[i][fpaths[i].find(dirName):]
                        self.stdoutln ( fpaths[i] )

                    if len(fpaths)<=1:
                        outFName = self.getXYZOFName ( )
                    else:
                        outFName = self.getXYZOFName ( modifier=nModels+1 )

                    os.rename ( fpaths[i],outFName )

                    xyz = self.registerXYZ ( None,outFName )

                    if xyz:

                        nModels += 1

                        xyz.fixBFactors ( self.outputDir(),"alphafold",body=self )
                        for s in seq:
                            xyz.addDataAssociation ( s.dataId )

                        if len(fpaths)>1:
                            if i>0:
                                self.putMessage ( "&nbsp;<br>&nbsp;" )
                            self.putMessage ( "<h2>Prediction #" + str(nModels) + "</h2>" )

                        if flavour=="openfold" and len(PAE_png)==len(fpaths) and len(plddt_png)==len(fpaths):
                            gridId = self.getWidgetId ( "graphs_grid" )
                            self.putGrid     ( gridId )
                            self.putMessage1 ( gridId,
                                    "<h3>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                                    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PAE matrix</h3>",
                                    0,col=0 )
                            self.putMessage1 ( gridId,"<img src=\"" + PAE_png[i] +\
                                    "\" height=\"260px\"/>",1,col=0 )
                            self.putMessage1 ( gridId,"<h3>&nbsp;&nbsp;&nbsp;&nbsp;" +\
                                    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PLLDT scores</h3>",
                                    0,col=1 )
                            self.putMessage1 ( gridId,"<img src=\"" + plddt_png[i] +\
                                    "\" height=\"400px\"/>",1,col=1,rowSpan=3 )
                            self.putMessage1 ( gridId,
                                    "&nbsp;<br><b>Assigned name&nbsp;:</b>&nbsp;" +\
                                    xyz.dname,2,col=0 )
                            self.putXYZWidget1 ( gridId,self.getWidgetId("xyz_btn"),
                                                 "Model",xyz,3,col=0 )
                        else:
                            self.putMessage   (
                                    "<b>Assigned name&nbsp;:</b>&nbsp;" + xyz.dname )
                            self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Model",xyz )
                        # sid='100.0'
                        # model.meta  = { "rmsd" : "", "seqId" : sid, "eLLG" : "" }
                        # model.seqId = model.meta["seqId"]
                        # model.rmsd  = model.meta["rmsd" ]

                        # self.add_seqid_remark ( model,[sid] )

                        xyzs.append ( xyz )

                        #models.append ( model )

            # clean up
            try:
                shutil.rmtree ( os.path.join(dirName,"input") )
            except:
                pass

            if nModels == 1:
                self.generic_parser_summary["structureprediction"] = {
                    "summary_line" : str(nModels) + " structure predicted"
                }
            else:
                self.generic_parser_summary["structureprediction"] = {
                    "summary_line" : str(nModels) + " structures predicted"
                }

            auto.makeNextTask ( self,{
                "xyz" : xyzs
            }, log=self.file_stderr)

        self.success ( (nModels>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = StructurePrediction ( "",os.path.basename(__file__) )
    drv.start()


"""
================================================================================================================
ALPHAFOLD_CFG for openfold:

{
    "engine" : "openfold",
    "path_to_run_alphafold_py": "/home/ccp4/alphafold/run_alphafold.py",
    "path_to_run_docker": "/home/ccp4/alphafold/docker/run_docker.py",
    "path_to_colabfold_batch": "colabfold_batch",
    "path_to_run_openfold": "/home/ccp4/openfold/run_openfold.sh",
    "max_template_date": "2020-05-14",
    "data_dir": "/data/alphafold/db",
    "db_preset": "full_dbs",
    "pdb70_database_path": "/data/alphafold/db/pdb70/pdb70",
    "uniref90_database_path": "/data/alphafold/db/uniref90/uniref90.fasta",
    "mgnify_database_path": "/data/alphafold/db/mgnify/mgy_clusters_2018_12.fa",
    "template_mmcif_dir": "/data/alphafold/db/pdb_mmcif/mmcif_files/",
    "obsolete_pdbs_path": "/data/alphafold/db/pdb_mmcif/obsolete.dat",
    "bfd_database_path": "/data/alphafold/db/bfd/bfd_metaclust_clu_complete_id30_c90_final_seq.sorted_opt",
    "uniclust30_database_path": "/data/alphafold/db/uniclust30/uniclust30_2018_08/uniclust30_2018_08",
    "pdb_seqres_database_path": "/data/alphafold/db/pdb_seqres/pdb_seqres.txt",
    "uniprot_database_path": "/data/alphafold/db/uniprot/uniprot.fasta",
    "use_gpu_relax": "False",
    "colabfold_use_cpu": "1",
    "openfold_device": "cpu",
    "hhblits_binary_path": "hhblits",
    "hhsearch_binary_path": "hhsearch",
    "hmmbuild_binary_path": "hmmbuild",
    "hmmsearch_binary_path": "hmmsearch",
    "jackhmmer_binary_path": "jackhmmer",
    "kalign_binary_path": "kalign",
    "run_this_cmd_before_af2": "",
    "run_this_cmd_before_cf": "",
    "run_this_cmd_before_of": ""
}
=================================================================================================================

================================================================================================================
ALPHAFOLD_CFG for generic script:

{ "engine"       : "script"
  "script_path"  : "/path/to/script/template.sh"
}

where template.sh is invoked as below:

template.sh /path/to/seq.fasta Nmodels /path/to/output.dir

Example for template.sh:

-------------------------------------------------------------------------------------
#!/bin/bash
#
#SBATCH --job-name=test
#SBATCH --output=res.txt
#SBATCH --gres=gpu:1
#SBATCH --clusters=gpu4_cluster
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=8

apptainer exec --nv /cvmfs/unpacked.cern.ch/registry.hub.docker.com/ville761/af2:latest af2start --seqin $1 --output $3 --colabfold # --relax --num_models $2 --templates
-------------------------------------------------------------------------------------

=================================================================================================================
"""