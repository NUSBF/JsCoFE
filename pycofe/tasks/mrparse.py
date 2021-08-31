##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    27.08.21   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import json

#  application imports
from . import basic
# from   pycofe.proc    import qualrep
from   pycofe.varut   import rvapi_utils
# from   pycofe.dtypes    import dtype_structure
# from   pycofe.verdicts  import verdict_refmac
# from   pycofe.auto      import auto


# ============================================================================
# Make MrParse driver


class MrParse(basic.TaskDriver):

    #  redefine name of input script file
    # def file_stdin_path(self):  return "mrparse.script"

    def add_seqid_remark ( self,model ):
        fpath = model.getXYZFilePath ( self.outputDir() )
        file = open ( fpath,"r" )
        fcnt = file.read()
        file.close  ()
        file = open ( fpath,"w" )
        model.meta["seqId_ens"] = [model.meta["seqId"]]
        file.write  ( "REMARK PHASER ENSEMBLE MODEL 1 ID " + model.meta["seqId"] + "\n" )
        file.write  ( fcnt )
        file.close  ()
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

        # make command-line parameters for mrparse

        cmd = [ "--seqin",seq.getSeqFilePath(self.inputDir()) ]
        if hkl:
            cmd += [ "--hklin",reflections_mtz ]
        cmd += [ "--do_classify" ]

        # run mrparse
        if sys.platform.startswith("win"):
            self.runApp ( "mrparse.bat",cmd,logType="Main" )
        else:
            self.runApp ( "mrparse",cmd,logType="Main" )

        have_results = False

        mrparse_dir = "mrparse_0"

        html_report = os.path.join ( mrparse_dir,"mrparse.html" )
        if os.path.exists(html_report):
            f = open ( html_report,"r" )
            report = f.read()
            f.close()
            f = open ( html_report,"w" )
            f.write ( report.replace (
                "<script type=\"text/javascript\" src=\"pfam/static/javascripts/canvas.text.js?dontUseMoz=true&amp;reimplement=true\"></script>",
                "" )
            )
            f.close()
            self.insertTab   ( "mrparse_report","MrParse Report",None,True )
            self.putMessage1 (
                "mrparse_report",
                "<iframe src=\"../" + mrparse_dir + "/mrparse.html\" " +\
                "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
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

            if len(homologs)>0:

                nmodels = 0
                for i in range(len(homologs)):
                    fpath = os.path.join ( mrparse_dir,homologs[i]["pdb_file"] )
                    model = self.registerModel ( seq,fpath,checkout=True )
                    if model:
                        if nmodels<1:
                            self.putMessage ( "<i><b>Prepared models are associated " +\
                                              "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                            self.putTitle ( "Prepared MR models" )
                        else:
                            self.putMessage ( "&nbsp;" )
                        nmodels += 1
                        self.putMessage ( "<h3>Model #" + str(nmodels) + ": " + model.dname + "</h3>" )
                        model.addDataAssociation ( seq.dataId )
                        model.meta  = {
                            "rmsd"  : homologs[i]["rmsd"],
                            "seqId" : str(100.0*float(homologs[i]["seq_ident"])),
                            "eLLG"  : homologs[i]["ellg"]
                        }
                        model.seqId = model.meta["seqId"]
                        model.rmsd  = model.meta["rmsd" ]
                        self.add_seqid_remark ( model )
                        self.putModelWidget ( self.getWidgetId("model_btn"),
                                              "Coordinates",model )
                        have_results = True
                    else:
                        self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                          homologs[i]["path"] + "</h3>" )


                #     #ensNo += 1
                #     ensOk  = True
                #     self.putMessage ( "<h3>Model #" + str(len(models)+1) + ": " + model.dname + "</h3>" )
                #     model.addDataAssociation ( seq.dataId )
                #     model.meta  = { "rmsd" : "", "seqId" : sid }
                #     model.seqId = model.meta["seqId"]
                #     model.rmsd  = model.meta["rmsd" ]
                #
                #     if modSel!="S":
                #         self.add_seqid_remark ( model,[sid] )
                #
                #     self.putModelWidget ( self.getWidgetId("model_btn"),
                #                           "Coordinates",model )
                #     models.append ( model )
                #
                # else:
                #     if ensOk:
                #         self.putMessage ( "&nbsp;" )
                #     self.putMessage ( "<h3>*** Failed to form Model object for " +\
                #                       xyz[i].dname + "</h3>" )
                #     ensOk = False


                if nmodels>0:
                    self.generic_parser_summary["mrparse"] = {
                      "summary_line" : str(nmodels) + " MR model(s) prepared"
                    }
                else:
                    self.generic_parser_summary["mrparse"] = {
                      "summary_line" : "MR model preparation failed"
                    }

            else:
                self.putTitle ( "No MR models were prepared" )
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : " no suitable homologues found"
                }




            """
            homs  = {}
            key   = 0
            eLLg0 = -10000.0
            ens0  = None
            with open(os.path.join(mrparse_dir,"phaser1.log"),"r") as f:
                for line in f:
                    if key==1:
                        words = line.split()
                        if len(words)==4:
                            if words[-1] in homs:
                                homs[words[-1]]["eLLG"] = words[0]
                                homs[words[-1]]["rmsd"] = words[1]
                                if float(words[0])>eLLg0:
                                    eLLg0 = float(words[0])
                                    ens0  = words[-1]
                        else:
                            key = 0
                    elif line.startswith("ENSEMBLE "):
                        words = line.split()
                        homs[words[1]] = {
                            "path" : line.split('\"')[1],
                            "sid"  : words[-1]
                        }
                    elif "eLLG   RMSD frac-scat  Ensemble" in line:
                        key = 1
                    else:
                        key = 0

            homologs = []
            if ens0:
                homologs = [homs[ens0]]
                exclude  = [ens0]
                while ens0:
                    ens0  = None
                    eLLg0 = -10000.0
                    eLLG1 = float(homologs[-1]["eLLG"])
                    for ens in homs:
                        if ens not in exclude:
                            eLLG = float(homs[ens]["eLLG"])
                            if eLLg0<eLLG and eLLG<=eLLG1:
                                eLLg0 = eLLG
                                ens0  = ens
                    if ens0:
                        homologs.append ( homs[ens0] )
                        exclude .append ( ens0 )

            if len(homologs)>0:

                nmodels = 0
                for i in range(len(homologs)):
                    fpath = os.path.join ( mrparse_dir,homologs[i]["path"] )
                    model = self.registerModel ( seq,fpath,checkout=True )
                    if model:
                        if nmodels<1:
                            self.putMessage ( "<i><b>Prepared models are associated " +\
                                              "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                            self.putTitle ( "Prepared MR models" )
                        else:
                            self.putMessage ( "&nbsp;" )
                        nmodels += 1
                        self.putMessage ( "<h3>Model #" + str(nmodels) + ": " + model.dname + "</h3>" )
                        model.addDataAssociation ( seq.dataId )
                        model.meta  = {
                            "rmsd"  : homologs[i]["rmsd"],
                            "seqId" : str(100.0*float(homologs[i]["sid"])),
                            "eLLG"  : homologs[i]["eLLG"]
                        }
                        model.seqId = model.meta["seqId"]
                        model.rmsd  = model.meta["rmsd" ]
                        self.add_seqid_remark ( model )
                        self.putModelWidget ( self.getWidgetId("model_btn"),
                                              "Coordinates",model )
                        have_results = True
                    else:
                        self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                          homologs[i]["path"] + "</h3>" )

                if nmodels>0:
                    self.generic_parser_summary["mrparse"] = {
                      "summary_line" : str(nmodels) + " MR model(s) prepared"
                    }
                else:
                    self.generic_parser_summary["mrparse"] = {
                      "summary_line" : "MR model preparation failed"
                    }

            else:
                self.putTitle ( "No MR models were prepared" )
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : " no suitable homologues found"
                }
            """

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrParse ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                  })

    drv.start()
