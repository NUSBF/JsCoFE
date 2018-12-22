##!/usr/bin/python

#
# ============================================================================
#
#    20.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ccp4go exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
import sys
import json
import shutil

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers

#  application imports
from   pycofe.dtypes import dtype_revision, dtype_template
from   pycofe.tasks  import asudef, import_task
from   pycofe.proc   import import_filetype, import_merged
from   pycofe.varut  import rvapi_utils
from   pycofe.etc    import citations

# ============================================================================
# Make CCP4go driver

#class CCP4go(asudef.ASUDef):

class CCP4go(import_task.Import):

    def import_page_id    (self):  return "ccp4go_import_page_id"
    def import_log_page_id(self):  return "ccp4go_import_log_page_id"
    def import_err_page_id(self):  return "ccp4go_import_err_page_id"
    def import_stdout_path(self):  return "_import_stdout.log"
    def import_stderr_path(self):  return "_import_stderr.log"

    # redefine name of input script file
    def file_stdin_path   (self):  return "ccp4go.script"

    # the following will provide for import of generated sequences

    import_dir      = "uploads"
    import_table_id = "import_summary_id"
    id_modifier     = 1

    def importDir        (self):  return self.import_dir       # import directory
    def import_summary_id(self):  return self.import_table_id  # import summary table id
    def getXMLFName      (self):  return os.path.join(self.importDir(),"matthews.xml")
    def seq_table_id     (self):  return "seq_table_" + str(self.id_modifier)
    def res_table_id     (self):  return "res_table_" + str(self.id_modifier)

    # ------------------------------------------------------------------------

    revisionSerialNo = 1
    revision_asu     = None

    # ------------------------------------------------------------------------

    def importData(self):

        self.putWaitMessageLF ( "<b>1. Input Data Import</b>" )
        #self.rvrow -= 1

        # -------------------------------------------------------------------
        # import uploaded data
        # make import tab and redirect output to it
        pyrvapi.rvapi_add_tab ( self.import_page_id(),"1. Input Data Import",False )
        self.setReportWidget  ( self.import_page_id() )

        fstdout = self.file_stdout
        fstderr = self.file_stderr
        self.file_stdout = open ( self.import_stdout_path(),'w' )
        self.file_stderr = open ( self.import_stderr_path(),'w' )

        # create tabs for import standard outputs

        if self.navTreeId:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,self.import_page_id() )
        pyrvapi.rvapi_add_tab ( self.import_log_page_id(),"Log file",False )
        pyrvapi.rvapi_append_content (
                    "/".join(["..",self.import_stdout_path()+"?capsize"]),
                                                True,self.import_log_page_id() )
        pyrvapi.rvapi_add_tab ( self.import_err_page_id(),"Errors",False )
        pyrvapi.rvapi_append_content (
                    "/".join(["..",self.import_stderr_path()+"?capsize"]),
                                                True,self.import_err_page_id() )

        self.putTitle ( "CCP4go Automated Structure Solver: Data Import" )
        super ( CCP4go,self ).import_all()

        # redirect everything back to report page and original standard streams
        self.file_stdout.close()
        self.file_stderr.close()
        self.file_stdout = fstdout
        self.file_stderr = fstderr
        self.resetReportPage()
        if self.navTreeId:
            pyrvapi.rvapi_set_tab_proxy ( self.navTreeId,"" )

        # -------------------------------------------------------------------
        # fetch data for CCP4go pipeline

        self.unm     = None   # unmerged dataset
        self.hkl     = None   # selected merged dataset
        self.seq     = None   # list of sequence objects
        self.xyz     = None   # coordinates (model/apo)
        self.hkl_alt = {}     # alternative-space group merged datasets

        if "DataUnmerged" in self.outputDataBox.data:
            self.unm = self.outputDataBox.data["DataUnmerged"][0]

        if "DataHKL" in self.outputDataBox.data:
            maxres = 10000.0
            for i in range(len(self.outputDataBox.data["DataHKL"])):
                res = self.outputDataBox.data["DataHKL"][i].getHighResolution(True)
                if res<maxres:
                    maxres   = res
                    self.hkl = self.outputDataBox.data["DataHKL"][i]

        if "DataSequence" in self.outputDataBox.data:
            self.seq = self.outputDataBox.data["DataSequence"]

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"][0]


        # -------------------------------------------------------------------
        # make data summary table

        panelId = "summary_section"
        pyrvapi.rvapi_set_text ( "",self.report_page_id(),self.rvrow,0,1,1 )
        self.putSection ( panelId,"<b>1. Input summary</b>" )

        tableId = "ccp4go_summary_table"
        #self.putTable ( tableId,"<font style='font-style:normal;font-size:125%;'>" +
        #                        "1. Input Data</font>",self.report_page_id(),
        #                        self.rvrow,0 )
        #self.rvrow += 1
        self.putTable ( tableId,"Input data",panelId,0,0 )
        self.setTableHorzHeaders ( tableId,["Assigned Name","View"],
                ["Name of the assocuated data object","Data view and export"] )

        def addDataLine ( name,tooltip,object,nrow ):
            if object:
                self.putTableLine ( tableId,name,tooltip,object.dname,nrow[0] )
                self.putInspectButton ( object,"View",tableId,nrow[0]+1,2 )
                nrow[0] +=1
            return

        nrow = [0]
        addDataLine ( "Unmerged Reflections","Reflection data",self.unm,nrow )
        addDataLine ( "Merged Reflections"  ,"Reflection data",self.hkl,nrow )
        if self.seq:
            if len(self.seq)<2:
                addDataLine ( "Sequence","Sequence data",self.seq[0],nrow )
            else:
                for i in range(len(self.seq)):
                    addDataLine ( "Sequence #"+str(i+1),"Sequence data",self.seq[i],nrow )
        addDataLine ( "Structure"           ,"Homologue structure",self.xyz,nrow )

        if self.task.ha_type:
            self.putTableLine ( tableId,"Anomalous scatterers",
                "Chemical type of anomalous scatterers",self.task.ha_type,
                nrow[0] )
            nrow[0] += 1

        for i in range(len(self.task.ligands)):
            ligand = self.task.ligands[i]
            if ligand.source!="none":
                dline = "[" + ligand.code + "] "
                if ligand.source=="smiles":
                    m = 0
                    for j in range(len(ligand.smiles)):
                        if m>40:
                            dline += "<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
                            m = 0
                        dline += ligand.smiles[j]
                        m += 1
                self.putTableLine ( tableId,"Ligand #" + str(i+1),
                                    "Ligand description",dline,nrow[0] )
                nrow[0] += 1

        return

    #def revisionFromMeta ( self,asuComp,hkl,structure,name ):
    #    return

    # ------------------------------------------------------------------------

    def makeOutputData ( self,resdir,meta ):

        if not "row" in meta or not "nResults" in meta:
            return

        #if meta["nResults"]<1:
        #    return

        row      = meta["row"]
        panel_id = "output_panel_" + str(row)
        title    = "Details"
        if "title" in meta:
            row -= 1
            pyrvapi.rvapi_set_text ( "",self.report_page_id(),row,0,1,1 )
            title = meta["title"]

        if "merged" in meta:  # output from the data reduction part
            # import reflection data and place HKL widgets
            pyrvapi.rvapi_add_section ( panel_id,"<b>" + str(meta["stage_no"]) +
                                        ". Data processing results (<i>Spg=" +
                                        meta["spg"] + "</i>)</b>",
                                        self.report_page_id(),row,0,1,1,False )
            self.setReportWidget ( panel_id )
            self.import_dir      = "./"
            self.import_table_id = None
            # clean upload directory
            #shutil.rmtree(dirpath)
            #os.mkdir(dirpath)
            self.resetFileImport()
            self.addFileImport ( "",meta["mtz"],import_filetype.ftype_MTZMerged() )
            #self.files_all = [meta["mtz"]]
            import_merged.run ( self,"Import merged HKL" )
            # get reference to imported structure
            self.hkl = self.outputDataBox.data["DataHKL"][0]

        elif "asu" in meta:  # output from the asu definition module
            if meta["nResults"]<0:
                pyrvapi.rvapi_add_section ( panel_id,"<b>" + str(meta["stage_no"]) +
                                            ". Composition of ASU -- failed</i></b>",
                                            self.report_page_id(),row,0,1,1,False )
                self.setReportWidget ( panel_id )
                self.putMessage ( "Sequence file was not found. This is a bug." )

            elif meta["nResults"]==0:
                pyrvapi.rvapi_add_section ( panel_id,"<b>" + str(meta["stage_no"]) +
                                            ". Composition of ASU -- not computed</i></b>",
                                            self.report_page_id(),row,0,1,1,False )
                self.setReportWidget ( panel_id )
                self.putMessage ( "<h3>Given sequence(s) do not fit the asymmetric unit.</h3>" )

            else:
                pyrvapi.rvapi_add_section ( panel_id,"<b>" + str(meta["stage_no"]) +
                                            ". Composition of ASU: " + str(meta["nmol"]) +\
                                            " molecules, " + str(round(meta["solvent"],2)) +\
                                            "% solvent</i></b>",
                                            self.report_page_id(),row,0,1,1,False )
                self.setReportWidget ( panel_id )
                self.putMessage ( "<h2>Composition of ASU</h2>" )
                rvapi_utils.makeTable ( meta["table1"],"seq_table_report",
                                        self.report_page_id(),self.rvrow,0,1,1 )
                self.rvrow += 1
                self.putMessage ( "&nbsp;<p><b>Cell volume:</b>&nbsp;" +\
                                  meta["cellVolume"] + "&nbsp;&Aring;<sup>3</sup>" )
                rvapi_utils.makeTable ( meta["table2"],"matthew_table_report",
                                        self.report_page_id(),self.rvrow,0,1,1 )
                self.rvrow += 1
                self.putMessage ( meta["fitMessage"] )

                outFName = self.outputFName
                self.outputFName += "-asu"
                self.revision_asu = dtype_revision.DType ( -1 )
                self.revision_asu.makeDataId ( self.revisionSerialNo )
                self.revision_asu.setReflectionData ( self.hkl )
                self.revision_asu.setASUData ( self.seq,meta["nres"],
                                      meta["weight"],len(self.seq),
                                      meta["matthews"],meta["solvent"],
                                      meta["mprob"] )
                self.registerRevision ( self.revision_asu,self.revisionSerialNo )
                self.outputFName = outFName
                self.revisionSerialNo += 1

        elif "ligands" in meta:
            # check in generated ligands
            pyrvapi.rvapi_add_section ( panel_id,title,self.report_page_id(),
                                        row,0,1,1,False )
            self.setReportWidget ( panel_id )

            if meta["nResults"]>0:
                #self.putMessage ( "<h3>Generated ligand structure(s)</h3>" )
                for code in meta["ligands"]:
                    self.putMessage   ( "&nbsp;" )
                    self.putMessageLF ( "<b>Code: " + code + "</b>")
                    self.finaliseLigand ( code,meta["ligands"][code]["xyz"],
                                               meta["ligands"][code]["cif"],
                                               False,"" )
            else:
                self.putMessage ( "<h3>No ligand structure(s) generated</h3>" )
                self.putMessage ( "<i>This is likely to be a program error, " +
                                  "please report</i>" )

        else:  # look for structure

            pyrvapi.rvapi_add_section ( panel_id,title,self.report_page_id(),
                                        row,0,1,1,False )
            self.setReportWidget ( panel_id )

            if meta["nResults"]>0:

                hkl_sol = self.hkl

                # check if space group changed
                if "spg" in meta:   # possibly redundant check
                    spgkey = meta["spg"].replace(" ","")
                    if spgkey in self.hkl_alt:
                        hkl_sol = self.hkl_alt[spgkey]
                    elif meta["hkl"]:
                        self.putMessage ( "<h3>Space group changed to " +
                                          meta["spg"] + "</h3>" )
                        self.import_dir      = "./"
                        self.import_table_id = None
                        hkl0 = self.outputDataBox.data["DataHKL"]
                        id0  = []
                        for i in range(len(hkl0)):
                            id0 += [hkl0[i].dataId]
                        self.resetFileImport()
                        self.addFileImport ( "",meta["hkl"],import_filetype.ftype_MTZMerged() )
                        #self.files_all = [meta["hkl"]]
                        import_merged.run ( self,"Import merged HKL reindexed in " +
                                                 meta["spg"] )
                        self.rvrow += 10
                        # get reference to imported structure
                        hkl0 = self.outputDataBox.data["DataHKL"]
                        hkl_sol = None
                        for i in range(len(hkl0)):
                            if not hkl0[i].dataId in id0:
                                hkl_sol = hkl0[i]
                        self.hkl_alt[spgkey] = hkl_sol

                # register structure data
                libPath = None
                if "lib" in meta:
                    libPath = meta["lib"]
                structure = self.registerStructure ( meta["pdb"],None,meta["mtz"],
                                                     meta["map"],meta["dmap"],
                                                     libPath,True )
                if structure:

                    structure.addDataAssociation ( hkl_sol.dataId )
                    structure.setRefmacLabels ( hkl_sol )
                    if meta["phasing"]=="MR":
                        structure.addMRSubtype()
                    else:
                        structure.addEPSubtype()
                    structure.setXYZSubtype()

                    if "libindex" in meta:
                        structure.addLigands ( meta["libindex"] )

                    self.putMessage ( "&nbsp;" ) # just vertical spacer
                    self.putStructureWidget ( "structure_btn_" + str(row),
                              meta["name"] + " structure and electron density",
                              structure )

                    """
                    if resdir.lower().startswith("simbad"):
                        self.import_dir      = resdir
                        self.import_table_id = None
                        asudef.revisionFromStructure ( self,hkl_sol,structure,
                                    "simbad_"+meta["pdbcode"],useSequences=self.seq,
                                    make_revision=(self.seq==None) )
                        self.id_modifier += 1
                        if not self.seq:  # sequence was imported in asudef
                            self.seq = self.outputDataBox.data["DataSequence"]

                    else:
                    """
                    outFName = self.outputFName
                    if resdir == "dimple_mr":
                        self.outputFName += "-dimple-MR"
                    elif resdir == "dimple_refine":
                        self.outputFName += "-dimple-refine"
                    elif resdir == "morda_results":
                        self.outputFName += "-morda"
                    elif resdir == "crank2_results":
                        self.outputFName += "-crank2"
                    else:
                        self.outputFName += "-" + resdir
                    revision = dtype_revision.DType ( -1 )
                    revision.copy ( self.revision_asu )
                    revision.setReflectionData ( hkl_sol   )
                    revision.setStructureData  ( structure )
                    self.registerRevision ( revision,self.revisionSerialNo )
                    self.outputFName = outFName
                    self.revisionSerialNo += 1


                    """
                    self.import_dir      = resdir
                    self.import_table_id = None
                    asudef.revisionFromStructure ( self,hkl_sol,structure,
                                "dimple",useSequences=self.seq,
                                make_revision=(self.seq==None) )
                    self.id_modifier += 1
                    if not self.seq:  # sequence was imported in asudef
                        self.seq = self.outputDataBox.data["DataSequence"]
                    """

                else:
                    self.putMessage ( "Structure Data cannot be formed " +
                                      "(probably a bug)" )
            else:
                self.putMessageLF ( "No solution found." )

        self.putMessage ( "&nbsp;" ) # just vertical spacer

        """
        {"results":
           { "simbad12_results":
              {"mtz": "output/simbad12_results/simbad.mtz",
               "map": "output/simbad12_results/simbad.map",
               "name": "Simbad-LC",
               "nResults": 1,
               "rfree": 0.347,
               "dmap": "output/simbad12_results/simbad_dmap.map",
               "rfactor": 0.3792,
               "pdb": "output/simbad12_results/simbad.pdb",
               "columns": {"PHI": "PHIC_ALL_LS", "SIGF": "SIGF", "DELFWT": "DELFWT", "F": "F", "FREE": "FreeR_flag", "FOM": "FOM", "PHDELWT": "PHDELWT"}, "row": 5}, "buccaneer": {"mtz": "output/buccaneer/buccaneer.mtz", "map": "output/buccaneer/buccaneer.map", "name": "Buccanneer", "nResults": 1, "rfree": 0.3671, "dmap": "output/buccaneer/buccaneer_dmap.map", "rfactor": 0.3151, "pdb": "output/buccaneer/buccaneer.pdb", "columns": {"PHI": "PHIC_ALL_LS", "SIGF": "SIGF", "DELFWT": "DELFWT", "F": "F", "FREE": "FreeR_flag", "FOM": "FOM", "PHDELWT": "PHDELWT"},
               "row": 8
              }
            },
          "retcode": "solved",
          "report_row": 9
        }
        """

        self.resetReportPage()
        return


    # ------------------------------------------------------------------------

    def run(self):

        self.importData()
        #self.putMessage ( "&nbsp;" )
        self.flush()

        # run ccp4go pipeline
        if self.unm or self.hkl:

            # write input file
            self.open_stdin()
            if self.unm:
                self.write_stdin ( "HKLIN " + self.unm.getFilePath(self.outputDir(),dtype_template.file_key["mtz"]) )
            elif self.hkl:
                self.write_stdin ( "HKLIN " + self.hkl.getFilePath(self.outputDir(),dtype_template.file_key["mtz"]) )
            if self.seq:  # takes just a single sequence for now -- to be changed
                self.write_stdin ( "\nSEQIN " + self.seq[0].getFilePath(self.outputDir(),dtype_template.file_key["seq"]) )
            if self.xyz:
                self.write_stdin ( "\nXYZIN " + self.xyz.getFilePath(self.outputDir(),dtype_template.file_key["xyz"]) )
            if self.task.ha_type:
                self.write_stdin ( "\nHATOMS " + self.task.ha_type )
            for i in range(len(self.task.ligands)):
                if self.task.ligands[i].source!='none':
                    self.write_stdin ( "\nLIGAND " + self.task.ligands[i].code )
                    if self.task.ligands[i].source=='smiles':
                        self.write_stdin ( " " + self.task.ligands[i].smiles )
            self.write_stdin ( "\n" )
            self.close_stdin()

            queueName = "";
            if len(sys.argv)>4:
                if sys.argv[4]!="-":
                    queueName = sys.argv[4]

            if self.exeType == "SGE":
                nSubJobs = "0";
                if len(sys.argv)>5:
                    nSubJobs = sys.argv[5]
            else:
                nSubJobs = "4";

            meta = {}
            meta["jobId"]         = self.job_id
            meta["stageNo"]       = 1
            meta["sge_q"]         = queueName
            meta["sge_tc"]        = nSubJobs
            meta["summaryTabId"]  = self.report_page_id()
            meta["summaryTabRow"] = self.rvrow
            meta["navTreeId"]     = self.navTreeId
            meta["outputDir"]     = self.outputDir()
            meta["outputName"]    = "ccp4go"

            self.storeReportDocument ( json.dumps(meta) )

            ccp4go_path = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "../apps/ccp4go/ccp4go.py" ) )
            cmd = [ ccp4go_path,
                    "--sge" if self.exeType == "SGE" else "--mp",
                    "--rdir","report",
                    "--rvapi-document",self.reportDocumentName()
                  ]

            sec1 = self.task.parameters.sec1.contains
            if self.getParameter(sec1.SIMBAD12_CBX)=="False":
                cmd += ["--no-simbad12"]
            if self.getParameter(sec1.MORDA_CBX)=="False":
                cmd += ["--no-morda"]
            if self.getParameter(sec1.CRANK2_CBX)=="False":
                cmd += ["--no-crank2"]
            if self.getParameter(sec1.FITLIGANDS_CBX)=="False":
                cmd += ["--no-fitligands"]

            pyrvapi.rvapi_keep_polling ( True )
            if sys.platform.startswith("win"):
                self.runApp ( "ccp4-python.bat",cmd )
            else:
                self.runApp ( "ccp4-python",cmd )
            pyrvapi.rvapi_keep_polling ( False )
            self.restoreReportDocument()
            self.addCitations ( ['ccp4go'] )
            self.rvrow += 100

            # check on resulting metadata file
            ccp4go_meta_file = "ccp4go.meta.json"
            ccp4go_meta = None
            try:
                with open(ccp4go_meta_file) as json_data:
                    ccp4go_meta = json.load(json_data)
            except:
                pass

            if ccp4go_meta:

                self.rvrow = ccp4go_meta["report_row"]

                resorder   = ccp4go_meta["resorder"]
                results    = ccp4go_meta["results"]
                for i in range(len(resorder)):
                    d = resorder[i]  # stage's result directory
                    if d in results:
                        self.makeOutputData ( d,results[d] )
                        self.flush()

                #self.putMessage ( "<hr/><i><b>Note:</b> In order to further " +
                #            "process the results, define ASU Content using " +
                #            "structures generated by CCP4go." )

                if "programs_used" in ccp4go_meta:
                    self.addCitations ( ccp4go_meta["programs_used"] )

            else:
                self.putTitle ( "Results not found (structure not solved)" )


        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = CCP4go ( "CCP4go Automated Structure Solver",os.path.basename(__file__),
                  { "report_page" : { "show" : True, "name" : "Report" },
                    "nav_tree"    : { "id"   : "nav_tree_id", "name" : "Workflow" }
                  })

    drv.start()
