##!/usr/bin/python

#
# ============================================================================
#
#    30.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  GESAMT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.gesamt.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import json

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.varut  import jsonut, mmcif_utils
from   pycofe.dtypes import dtype_template


# ============================================================================
# Make Gesamt driver

class Gesamt(basic.TaskDriver):

    # make task-specific definitions
    def gesamt_xyz       (self):  return "gesamt.pdb"
    def gesamt_json      (self):  return "gesamt.json"

    def gesamt_report_id (self):  return "gesamt_report"
    def progress_grid_id (self):  return "progress_grid"
    def progress_bar_id  (self):  return "progress_bar"
    def etr_label_id     (self):  return "etr_label"
    def query_table_id   (self):  return "query_table"
    def hits_table_sec_id(self):  return "hits_table_sec"
    def hits_graph_sec_id(self):  return "hits_graph_sec"
    def hits_table_id    (self):  return "hits_table"
    def hits_graph_id    (self):  return "hits_graph"
    def corr_graph_id    (self):  return "corr_graph"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare gesamt job

        # Just in case (of repeated run) remove the output xyz file. When gesamt
        # succeeds, this file is created.
        if os.path.isfile(self.gesamt_xyz()):
            os.remove(self.gesamt_xyz())

        if os.path.isfile(self.gesamt_json()):
            os.remove(self.gesamt_json())

        # Prepare gesamt input

        # fetch input data
        xyz  = self.input_data.data.xyz
        nXYZ = len(xyz)

        # make command-line parameters
        cmd = []
        for i in range(nXYZ):
            xyz[i] = self.makeClass ( xyz[i] )
            cmd += [ xyz[i].getXYZFilePath(self.inputDir()),
                    "-s",xyz[i].chainSel]

        if nXYZ<2:
            if not "GESAMT_ARCHIVE" in os.environ:
                self.fail ( "<p>&nbsp;<b> *** Error: " + self.appName() +\
                            " is not configured to work " + \
                            "with GESAMT Archive</b><br>" + \
                            "<i>     Please look for support</i><br>",
                            "No GESAMT Archive configured" )

            cmd += [ "-archive",os.environ["GESAMT_ARCHIVE"],"-nthreads=auto",
                     "-min1="+self.getParameter(self.task.parameters.sec1.contains.MIN1),
                     "-min2="+self.getParameter(self.task.parameters.sec1.contains.MIN2),
                     "-trim-size=1",
                     "-trim-Q="+self.getParameter(self.task.parameters.sec1.contains.QSCORE),
                     "--json",self.gesamt_json() ]

            self.rvrow += 1
            pyrvapi.rvapi_add_grid ( self.progress_grid_id(),False,
                                     self.report_page_id(),self.rvrow,0,1,1 )

            pyrvapi.rvapi_add_progress_bar ( self.progress_bar_id(),
                                             self.progress_grid_id(), 0,0,1,1 )
            pyrvapi.rvapi_set_text  ( "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ETR:&nbsp;",
                                      self.progress_grid_id(), 0,1,1,1 )
            pyrvapi.rvapi_add_label ( self.etr_label_id(),
                                      self.progress_grid_id(),"--:--:--",0,2,1,1 );

            self.storeReportDocument ( self.progress_bar_id()+";"+self.etr_label_id() )

        else:
            cmd += [ "-o",self.gesamt_xyz(),"-o-cs",
                     self.task.parameters.sec1.contains.MODE.value ]
            if nXYZ==2:
                cmd += ["-domains"]

            self.putPanel ( self.gesamt_report_id() )
            self.storeReportDocument ( self.gesamt_report_id() )  # self.job_id.zfill(4) )

        r0 = self.getParameter ( self.task.parameters.sec1.contains.R0 )
        if r0:
            cmd += ["-r0="+r0]
        sigma = self.getParameter ( self.task.parameters.sec1.contains.SIGMA )
        if sigma:
            cmd += ["-sigma="+sigma]

        cmd += [ "--rvapi-rdoc",self.reportDocumentName() ]

        # run gesamt
        self.runApp ( "gesamt",cmd,logType="Main" )

        have_results = False

        if nXYZ<2:  # PDB scan

            pyrvapi.rvapi_remove_widget ( self.progress_grid_id() )
            pyrvapi.rvapi_reset_task()
            pyrvapi.rvapi_flush()

            if os.path.isfile(self.gesamt_json()):

                hitlist  = jsonut.readjObject ( self.gesamt_json() )

                pyrvapi.rvapi_add_table ( self.query_table_id(),"Query structure",
                                    self.report_page_id(),self.rvrow,0,1,1, 0 )
                pyrvapi.rvapi_put_horz_theader ( self.query_table_id(),"Name",
                                                           "Structure name",0 )
                pyrvapi.rvapi_put_horz_theader ( self.query_table_id(),"Size",
                                     "Structure size in number of residues",1 )
                pyrvapi.rvapi_put_table_string ( self.query_table_id(),
                    hitlist.query.file + "&nbsp;(" + hitlist.query.selection + ")",
                    0,0 )
                pyrvapi.rvapi_put_table_string ( self.query_table_id(),
                    hitlist.query.size,0,1 )

                self.rvrow += 1
                self.putMessage ( "&nbsp;" )

                querySize = float(hitlist.query.size)

                nColumns = len(hitlist.columns)
                if nColumns<1 or not hasattr(hitlist.columns[0],"value"):
                    nHits = 0
                elif type(hitlist.columns[0].value) is list:
                    nHits = min ( len(hitlist.columns[0].value),
                                  self.task.parameters.sec1.contains.MAXHITS.value )
                else:
                    nHits = 1

                if nHits<1:
                    self.putTitle   ( "No PDB matches found" )
                    self.putMessage ( "<i>Hint:</i> try to reduce report thresholds " +
                        "(ultimately down to 0) in order to see any hits;<br>" +
                        "doing so will increase computation time and report " +
                        "lower-quality (less relevant) matches." )
                else:

                    self.putSection ( self.hits_table_sec_id(),"PDB Hits Table",False )

                    pyrvapi.rvapi_add_table ( self.hits_table_id(),
                        "PDB hits found",self.hits_table_sec_id(),0,0,1,1, 100 )
                    pyrvapi.rvapi_set_table_type  ( self.hits_table_id(),True,True )
                    pyrvapi.rvapi_set_table_style ( self.hits_table_id(),"",
                                                        "text-align:center;" )

                    for j in range(nHits):
                        pyrvapi.rvapi_put_vert_theader ( self.hits_table_id(),
                                                      str(j+1),"Hit number",j )
                        pyrvapi.rvapi_shape_vert_theader (
                            self.hits_table_id(),j,"text-align:right;","",1,1 )

                    for i in range(nColumns):
                        column = hitlist.columns[i]
                        pyrvapi.rvapi_put_horz_theader ( self.hits_table_id(),
                                                column.title,column.tooltip,i )
                        if i==0:
                            td_css = "font-family:courier;"
                        elif i==nColumns-1:
                            td_css = "text-align:left;font-size:80%;"
                            pyrvapi.rvapi_shape_horz_theader (
                                        self.hits_table_id(),i,td_css,"",1,1 )
                        else:
                            td_css = ""
                        for j in range(nHits):
                            if nHits==1:
                                pyrvapi.rvapi_put_table_string ( self.hits_table_id(),
                                                            column.value,j,i )
                            else:
                                pyrvapi.rvapi_put_table_string ( self.hits_table_id(),
                                                        column.value[j],j,i )
                            if td_css:
                                pyrvapi.rvapi_shape_table_cell (
                                    self.hits_table_id(),j,i,"",td_css,"",1,1 )

                    pyrvapi.rvapi_add_button ( "hits_dnl_btn","Export hit list","{function}",
                        "window.parent.downloadJobFile(" + self.job_id + ",'hits.txt')",
                        False,self.hits_table_sec_id(), 1,0,1,1 )

                    self.generic_parser_summary["gesamt"] = {
                        "summary_line" : str(nHits) + " structure hits found"
                    }


                    if nHits > 1:

                        self.putSection ( self.hits_graph_sec_id(),"Score Plots",False )

                        pyrvapi.rvapi_set_text  ( "<h3>Alignment scores</h3>",self.hits_graph_sec_id(),0,0,1,1 )
                        pyrvapi.rvapi_add_graph ( self.hits_graph_id(),self.hits_graph_sec_id(),1,0,1,1 )
                        pyrvapi.rvapi_set_graph_size ( self.hits_graph_id(),700,400 )

                        pyrvapi.rvapi_set_text ( "&nbsp;<p><hr/>",self.hits_graph_sec_id(),2,0,1,1 )
                        pyrvapi.rvapi_set_text ( "<h3>Correlation plots</h3>",self.hits_graph_sec_id(),3,0,1,1 )

                        pyrvapi.rvapi_add_loggraph ( self.corr_graph_id(),self.hits_graph_sec_id(),4,0,1,1 )

                        pyrvapi.rvapi_add_graph_data ( "data",self.hits_graph_id(),"Scores" )
                        pyrvapi.rvapi_add_graph_data ( "data",self.corr_graph_id(),"Score correlations" )

                        def addDatasets ( ref,name ):
                            pyrvapi.rvapi_add_graph_dataset ( ref,"data",
                                                self.hits_graph_id(),name,name )
                            pyrvapi.rvapi_add_graph_dataset ( ref,"data",
                                                self.corr_graph_id(),name,name )
                            return

                        addDatasets ( "hno"   ,"Hit number" )
                        addDatasets ( "qscore","Q-score"    )
                        addDatasets ( "rmsd"  ,"R.m.s.d."   )
                        addDatasets ( "nalign","Nalign/n0"  )
                        addDatasets ( "seqid" ,"Seq. Id."   )

                        def addData ( ref,value ):
                            pyrvapi.rvapi_add_graph_real ( ref,"data",self.hits_graph_id(),value,"%g" )
                            pyrvapi.rvapi_add_graph_real ( ref,"data",self.corr_graph_id(),value,"%g" )
                            return

                        for j in range(nHits):
                            pyrvapi.rvapi_add_graph_int  ( "hno","data",self.hits_graph_id(),j )
                            addData ( "qscore",float(hitlist.columns[2].value[j]) )
                            addData ( "rmsd"  ,float(hitlist.columns[3].value[j]) )
                            addData ( "nalign",float(hitlist.columns[4].value[j])/querySize )
                            addData ( "seqid" ,float(hitlist.columns[5].value[j]) )

                        pyrvapi.rvapi_add_graph_plot ( "plot",self.hits_graph_id(),
                                            "Score profiles","Hit number","Scores" )

                        def addLine ( xset,yset,color ):
                            pyrvapi.rvapi_add_plot_line ( "plot","data",self.hits_graph_id(),xset,yset )
                            pyrvapi.rvapi_set_line_options ( yset,"plot","data",self.hits_graph_id(),
                                                             color,"solid","off",2.5,True )
                            return

                        addLine ( "hno","qscore","#00008B" )
                        addLine ( "hno","rmsd"  ,"#8B0000" )
                        addLine ( "hno","nalign","#8B8B00" )
                        addLine ( "hno","seqid" ,"#008B00" )

                        pyrvapi.rvapi_set_plot_legend  ( "plot",self.hits_graph_id(),"e","" )

                        def addPlot ( plotId,name,xname,yname,xset,yset,color ):
                            pyrvapi.rvapi_add_graph_plot ( plotId,
                                            self.corr_graph_id(),name,xname,yname )
                            pyrvapi.rvapi_add_plot_line  ( plotId,"data",
                                            self.corr_graph_id(),xset,yset )
                            pyrvapi.rvapi_set_line_options ( yset,plotId,"data",
                                            self.corr_graph_id(),color,"off",
                                            "filledCircle",2.5,True )
                            return

                        addPlot ( "p1","R.m.s.d. vs Seq. Id","Seq. Id","R.m.s.d.","seqid","rmsd" ,"#8B0000" )
                        addPlot ( "p2","R.m.s.d. vs Q-score","Q-score","R.m.s.d.","qscore","rmsd","#8B0000" )
                        addPlot ( "p3","R.m.s.d. vs Nalign","Normalised alignment length","R.m.s.d.",
                                  "nalign","rmsd","#8B0000" )
                        addPlot ( "p4","Seq. Id. vs Q-score","Q-score","Seq. Id.","qscore","seqid","#008B00" )
                        addPlot ( "p5","Seq. Id. vs Nalign","Normalised alignment length","Seq. Id.",
                                  "nalign","seqid","#008B00" )
                        addPlot ( "p6","Nalign vs. Q-score" ,"Q-score","Normalised alignment length","qscore",
                                  "nalign","#8B8B00" )

            else:
                self.putTitle ( "No PDB matches found" )
                self.generic_parser_summary["gesamt"] = {
                    "summary_line" : "no structure hits found"
                }

        else: # pairwise or multiple alignment

            outFiles = []

            self.rvrow += 1
            try:
                meta = json.loads ( self.restoreReportDocument().replace("'",'"') )
                self.generic_parser_summary["gesamt"] = {
                    "summary_line" : "Q=" + str(round(meta["qscore"],2)) +\
                                    ", r.m.s.d.=" + str(round(meta["rmsd"],3)) + "&Aring;" +\
                                    ", N<sub>align</sub>=" + str(meta["nalign"])
                }
                if nXYZ==2:
                    self.generic_parser_summary["gesamt"]["summary_line"] += \
                                    ", seqId=" + str(int(meta["seqid"]*100)) + "%"
                    outFiles = sorted([f for f in os.listdir(".") if f.upper().endswith(".PDB") or f.upper().endswith(".MMCIF")])
                    outFiles.insert ( 0,outFiles.pop() )
                elif nXYZ>2:
                    outFiles = [self.gesamt_xyz()]
            except:
                outFiles = []

            #self.stderrln ( "outFiles=" + str(outFiles))

            if len(outFiles)>0 and os.path.isfile(outFiles[0]):

                self.putTitle ( "Gesamt Output" )

                for i in range(len(outFiles)):
                    if not outFiles[i].upper().endswith(".PDB"):
                        outFiles[i] = mmcif_utils.convert_to_pdb ( outFiles[i] )

                # register output data from temporary location (files will be moved
                # to output directory by the registration procedure)
                ensemble = self.registerEnsemble ( dtype_template.subtypeProtein(),
                                                   outFiles[0] )
                if ensemble:
                    self.putMessage ( "<h3>Overall Alignment</h3>" )
                    self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),
                                            "Superposed ensemble&nbsp;&nbsp;",
                                            ensemble )
                    have_results = True

                for i in range(1,len(outFiles)):
                    ensemble = self.registerEnsemble ( dtype_template.subtypeProtein(),
                                                       outFiles[i] )
                    if ensemble:
                        self.putMessage ( "&nbsp;" )
                        self.putMessage ( "<h3>Domain #" + str(i) + " Alignment</h3>" )
                        self.putEnsembleWidget ( self.getWidgetId("ensemble_"+str(i)+"_btn"),
                                                 "Superposed domain #" + str(i),
                                                 ensemble )
                        have_results = True

            else:
                self.putTitle ( "Structures are too dissimilar and can not be aligned" )
                self.generic_parser_summary["gesamt"] = {
                    "summary_line" : "structures are dissimilar"
                }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Gesamt ( "",os.path.basename(__file__) )
    drv.start()
