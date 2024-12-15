##!/usr/bin/python

#
# ============================================================================
#
#    15.12.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MRPARSE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.mrparse jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import json

#  application imports
from . import basic


# ============================================================================
# Make MrParse driver

class MrParse(basic.TaskDriver):

    #  redefine name of input script file
    # def file_stdin_path(self):  return "mrparse.script"

    # old version; apparently MrParse does all remarking by itself now (02.10.2023)
    # def add_seqid_remark ( self,model ):
    #     fpath = model.getPDBFilePath ( self.outputDir() )
    #     file = open ( fpath,"r" )
    #     fcnt = file.read()
    #     file.close  ()
    #     file = open ( fpath,"w" )
    #     model.meta["seqId_ens"] = [model.meta["seqId"]]
    #     file.write  ( "REMARK PHASER ENSEMBLE MODEL 1 ID " + model.meta["seqId"] + "\n" )
    #     file.write  ( fcnt )
    #     file.close  ()
    #     model.seqrem  = True
    #     model.simtype = "cardon";
    #     return

    def add_seqid_remark ( self,model ):
        model.meta["seqId_ens"] = [model.meta["seqId"]]
        model.seqrem  = True
        model.simtype = "cardon";
        return


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare mrparse input -- script file

        seq = self.makeClass ( self.input_data.data.seq[0] )
        hkl = None
        if hasattr(self.input_data.data,"hkl"):
            hkl  = self.makeClass ( self.input_data.data.hkl[0] )
            cols = hkl.getMeanF()
            if cols[2]=="X":
                self.putTitle   ( "Unsuitable Data" )
                self.putMessage ( "No mean amplitudes found in the reflection dataset." )
                # this will go in the project tree line
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : "no mean amplitude data, therefore stop"
                }
                # close execution logs and quit
                self.success ( False )
                return

            reflections_mtz = "__reflections.mtz"
            FreeRColumn = hkl.getFreeRColumn()
            hklin = hkl.getHKLFilePath(self.inputDir())
            colin = [cols[0],cols[1],FreeRColumn]
            self.sliceMTZ ( hklin,colin,reflections_mtz,
                            ["F","SIGF",FreeRColumn] )

        # fetch input data

        sec1         = self.task.parameters.sec1.contains
        max_hits     = self.getParameter ( sec1.MAX_HITS )
        database     = self.getParameter ( sec1.DATABASE )
        plddt_cutoff = self.getParameter ( sec1.PLDDT_CUTOFF )


        # Check availability of PDB archive and the internet

        isLocalPDB   = self.checkPDB(False)

        if self.task.private_data:
            database = "pdb"
            if not isLocalPDB:
                self.fail ( "<h3>Data confidentiality conflict.</h3>" +\
                        "This task requires access to PDB archive, which is not " +\
                        "installed locally while transmission of sequence data to " +\
                        "external servers is blocked by CCP4 Cloud configuration.",
                        "No local PDB archive" )
                return

        # make command-line parameters for mrparse

        tmp_seq = "__sequence.fasta"  #  for mrparse likes .fasta
        f = open ( seq.getSeqFilePath(self.inputDir()),"r" )
        seq_content = f.read()
        f.close()
        f = open ( tmp_seq,"w" )
        f.write ( seq_content.replace("*","") )
        f.close()

        # shutil.copy2 ( seq.getSeqFilePath(self.inputDir()),tmp_seq )
        cmd = [ "--seqin",tmp_seq ]
        if hkl:
            cmd += [ "--hklin",reflections_mtz ]
        # cmd += [ "--do_classify","--ccp4cloud" ]
        cmd += [ "--ccp4cloud" ]

        if isLocalPDB:
            cmd += [ "--pdb_local",os.environ["PDB_DIR"] ]
        if "PDB_SEQDB" in os.environ:
            if os.path.isfile(os.environ["PDB_SEQDB"]):
                cmd += [ "--pdb_seqdb",os.environ["PDB_SEQDB"] ]
        if "AFDB_SEQDB" in os.environ:
            if os.path.isfile(os.environ["AFDB_SEQDB"]):
                cmd += [ "--afdb_seqdb",os.environ["AFDB_SEQDB"] ]

        cmd += [ "--max_hits", max_hits ]
        cmd += [ "--database", database ]
        cmd += [ "--plddt_cutoff", plddt_cutoff ]

        # run mrparse
        if sys.platform.startswith("win"):
            self.runApp ( "mrparse.bat",cmd,logType="Main",quitOnError=False )
        else:
            self.runApp ( "mrparse",cmd,logType="Main",quitOnError=False )

        have_results = False

        mrparse_dir = "mrparse_0"

        html_report = os.path.join ( mrparse_dir,"mrparse.html" )
        if os.path.exists(html_report):
            f = open ( html_report,"r" )
            report = f.read()
            f.close()
            f = open ( html_report,"w" )
            f.write (
                report.replace (
                    "<script type=\"text/javascript\" src=\"pfam/static/javascripts/canvas.text.js?dontUseMoz=true&amp;reimplement=true\"></script>",
                    ""
                ).replace(
                    os.environ["CCP4"],
                    "__CCP4__"
                )
            )
            f.close()
            self.insertTab   ( "mrparse_report","MrParse Report",None,True )
            self.putMessage1 (
                "mrparse_report",
                "<iframe src=\"../" + mrparse_dir + "/mrparse.html\" " +\
                "style=\"display:block;border:none;position:absolute;top:50px;left:0;width:100vw;height:90%;overflow-x:auto;\"></iframe>",
                0 )

            self.insertTab ( "mrparse_log","MrParse Log",
                             os.path.join("..",mrparse_dir,"mrparse.log"),False )
            self.insertTab ( "phaser_log","Phaser Log",
                             os.path.join("..",mrparse_dir,"phaser1.log"),False )

            self.flush()

            try:
                with open(os.path.join(mrparse_dir,"homologs.json"),"r") as json_file:
                    homologs = json.load ( json_file )
            except:
                homologs = []

            nhomologs = 0


            try:
                with open(os.path.join(mrparse_dir,"af_models.json"),"r") as json_file:
                    afmodels = json.load ( json_file )
            except:
                afmodels = []

            nafmodels = 0

            try:
                with open(os.path.join(mrparse_dir,"esm_models.json"),"r") as json_file:
                    esmmodels = json.load ( json_file )
            except:
                esmmodels = []

            nesmmodels = 0

            if len(homologs)>0:

                homologs = sorted ( homologs, 
                                    key=lambda obj: float(obj.get("seq_ident","0.0")), 
                                    reverse=True )

                for i in range(len(homologs)):
                    if homologs[i]["pdb_file"]:
                        fpath = os.path.join ( mrparse_dir,homologs[i]["pdb_file"] )
                        model = self.registerModel ( seq,fpath,checkout=True )
                        if model:
                            if nhomologs<1:
                                self.putMessage ( "<i><b>Prepared models are associated " +\
                                                  "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                                self.putTitle ( "MR models prepared from PDB structures" )
                            else:
                                self.putMessage ( "&nbsp;" )
                            nhomologs += 1
                            self.putMessage ( "<h3>Model #" + str(nhomologs) + ": " + model.dname + "</h3>" )
                            model.addDataAssociation ( seq.dataId )
                            if not homologs[i]["seq_ident"]:
                                homologs[i]["seq_ident"] = "0.0"
                            model.meta  = {
                                "rmsd"  : homologs[i]["rmsd"],
                                "seqId" : str(100.0*float(homologs[i]["seq_ident"])),
                                "eLLG"  : homologs[i]["ellg"]
                            }
                            model.seqId = model.meta["seqId"]
                            model.rmsd  = model.meta["rmsd" ]
                            self.add_seqid_remark ( model )
                            self.putModelWidget ( self.getWidgetId("model_btn"),
                                                  "Coordinates:&nbsp;",model )
                            have_results = True
                        else:
                            self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                              homologs[i]["path"] + "</h3>" )


            if len(afmodels)>0:

                afmodels = sorted ( afmodels, 
                                    key=lambda obj: float(obj.get("seq_ident","0.0")), 
                                    reverse=True )

                for i in range(len(afmodels)):
                    if afmodels[i]["pdb_file"]:
                        fpath = os.path.join ( mrparse_dir,afmodels[i]["pdb_file"] )
                        model = self.registerModel ( seq,fpath,checkout=True )
                        if model:
                            if nafmodels<1:
                                if nhomologs<1:
                                    self.putMessage ( "<i><b>Prepared models are associated " +\
                                                      "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                                self.putTitle ( "MR models prepared from AFDB structures" )
                            else:
                                self.putMessage ( "&nbsp;" )
                            nafmodels += 1
                            self.putMessage ( "<h3>Model #" + str(nhomologs+nafmodels) + ": " +\
                                              model.dname + "</h3>" )
                            model.addDataAssociation ( seq.dataId )
                            if not afmodels[i]["seq_ident"]:
                                afmodels[i]["seq_ident"] = "0.0"
                            model.meta  = {
                                "rmsd"    : afmodels[i]["rmsd"],
                                "seqId"   : str(100.0*float(afmodels[i]["seq_ident"])),
                                "h_score" : afmodels[i]["h_score"]
                            }
                            model.seqId = model.meta["seqId"]
                            model.rmsd  = model.meta["rmsd" ]
                            self.add_seqid_remark ( model )
                            self.putModelWidget ( self.getWidgetId("model_btn"),
                                                  "Coordinates:&nbsp;",model )
                            have_results = True
                        else:
                            self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                              afmodels[i]["path"] + "</h3>" )

            if len(esmmodels)>0:

                esmmodels = sorted ( esmmodels, 
                                     key=lambda obj: float(obj.get("seq_ident","0.0")), 
                                     reverse=True )

                for i in range(len(esmmodels)):
                    if esmmodels[i]["pdb_file"]:
                        fpath = os.path.join ( mrparse_dir,esmmodels[i]["pdb_file"] )
                        model = self.registerModel ( seq,fpath,checkout=True )
                        if model:
                            if nesmmodels<1:
                                if nhomologs<1:
                                    if nafmodels<1:
                                        self.putMessage ( "<i><b>Prepared models are associated " +\
                                                          "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                                self.putTitle ( "MR models prepared from ESMFold structures" )
                            else:
                                self.putMessage ( "&nbsp;" )
                            nesmmodels += 1
                            self.putMessage ( "<h3>Model #" + str(nhomologs+nafmodels+nesmmodels) + ": " +\
                                              model.dname + "</h3>" )
                            model.addDataAssociation ( seq.dataId )
                            if not esmmodels[i]["seq_ident"]:
                                esmmodels[i]["seq_ident"] = "0.0"
                            model.meta  = {
                                "rmsd"    : esmmodels[i]["rmsd"],
                                "seqId"   : str(100.0*float(esmmodels[i]["seq_ident"])),
                                "h_score" : esmmodels[i]["h_score"]
                            }
                            model.seqId = model.meta["seqId"]
                            model.rmsd  = model.meta["rmsd" ]
                            self.add_seqid_remark ( model )
                            self.putModelWidget ( self.getWidgetId("model_btn"),
                                                  "Coordinates:&nbsp;",model )
                            have_results = True
                        else:
                            self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                              esmmodels[i]["path"] + "</h3>" )

            if len(homologs)<1 and len(afmodels)<1 and len(esmmodels)<1:
                self.putTitle ( "No MR models were prepared" )
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : " no suitable PDB, AFDB or ESMFold homologs found"
                }

            if nhomologs+nafmodels+nesmmodels>0:
                summary_line = str(nhomologs+nafmodels+nesmmodels) + " MR model(s) prepared "
                if database=="pdb":
                    summary_line += "from PDB"
                elif database=="esmfold":
                    summary_line += "from ESMFold"
                elif database=="afdb":
                    summary_line += "from AFDB"
                else:
                    summary_line += "(PDB:" + str(nhomologs) +\
                                    ", AFDB:" + str(nafmodels) +\
                                    ", ESMFold:" + str(nesmmodels) + ")"
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : summary_line
                }
            else:
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : "MR model preparation failed"
                }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrParse ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                  })

    drv.start()
