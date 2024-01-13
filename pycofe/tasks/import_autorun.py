##!/usr/bin/python

#  !!!!!   DRAFT DRFAT DRAFT TO BE REMOVED  !!!!!

#
# ============================================================================
#
#    18.08.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ccp4go2 jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021-2022
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from   pycofe.tasks  import import_task
from   pycofe.auto   import auto

# ============================================================================
# Make CCP4go driver

class ImportAutoRun(import_task.Import):

    # ------------------------------------------------------------------------

    def importData(self):
        #  works with uploaded data from the top of the project

        super ( ImportAutoRun,self ).import_all()

        # -------------------------------------------------------------------
        # fetch data for CCP4go pipeline

        self.unm     = None   # unmerged dataset
        self.hkl     = None   # selected merged dataset
        self.seq     = []     # list of sequence objects
        self.xyz     = None   # coordinates (model/apo)
        self.ligands = []     # not used in this function but must be initialised
        self.hkl_alt = {}     # alternative-space group merged datasets
        self.ha_type = self.getParameter ( self.task.parameters.HATOM ).upper()

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

        return


    def prepareData(self):
        #  works with imported data from the project

        self.unm     = None   # unmerged dataset
        self.hkl     = None   # selected merged dataset
        self.seq     = []     # list of sequence objects
        self.xyz     = None   # coordinates (model/apo)
        self.ligands = []     # list of ligands
        self.hkl_alt = {}     # alternative-space group merged datasets
        self.ha_type = self.getParameter ( self.task.parameters.HATOM ).upper()

        hkldata = self.makeClass ( self.input_data.data.hkldata[0] )
        if hkldata._type=="DataUnmerged":
            self.unm = hkldata
        else:
            self.hkl = hkldata

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            for i in range(len(self.input_data.data.seq)):
                self.seq.append ( self.makeClass(self.input_data.data.seq[i]) )

        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            self.xyz = self.makeClass ( self.input_data.data.xyz[0] )

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            for i in range(len(self.input_data.data.ligand)):
                self.ligands.append ( self.makeClass(self.input_data.data.ligand[i]) )

        return

    # ------------------------------------------------------------------------

    def run(self):

        fileDir = self.outputDir()
        stageNo = 1
        if hasattr(self.input_data.data,"hkldata"):
            fileDir = self.inputDir()
            stageNo = 0
            self.prepareData()  #  pre-imported data provided
        else:
            self.importData()   #  data was uploaded
        #self.putMessage ( "&nbsp;" )
        self.flush()

        have_results = True

        # run ccp4go pipeline

        if self.hkl and len(self.seq)>0:
            # prepare data for ASU definition task

            self.task.autoRunId = "autoMR"  #  this is only for demonstration
            self.task.autoRunId = "MR"      #  this is only for demonstration

            auto.makeNextTask ( self,{
                "hkl" : self.hkl,
                "seq" : self.seq,
                "xyz" : self.xyz
            })

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ImportAutoRun ( "",os.path.basename(__file__),{} )
    drv.start()



    # have_results = False
    #
    # if self.unm or self.hkl:
    #
    #     # write input file
    #     self.open_stdin()
    #     if self.unm:
    #         self.write_stdin ( "HKLIN " + self.unm.getUnmergedFilePath(fileDir) )
    #     elif self.hkl:
    #         self.write_stdin ( "HKLIN " + self.hkl.getHKLFilePath(fileDir) )
    #     if self.seq:  # takes just a single sequence for now -- to be changed
    #         dtype_sequence.writeMultiSeqFile1 ( self.file_seq_path(),self.seq,fileDir )
    #         self.write_stdin ( "\nSEQIN " + self.file_seq_path() )
    #     if self.xyz:
    #         self.write_stdin ( "\nXYZIN " + self.xyz.getPDBFilePath(fileDir) )
    #     #if self.task.ha_type:
    #     #    self.write_stdin ( "\nHATOMS " + self.task.ha_type )
    #     if self.ha_type:
    #         self.write_stdin ( "\nHATOMS " + self.ha_type )
    #     for i in range(len(self.task.ligands)):
    #         if self.task.ligands[i].source!='none':
    #             self.write_stdin ( "\nLIGAND " + self.task.ligands[i].code )
    #             if self.task.ligands[i].source=='smiles':
    #                 self.write_stdin ( " " + self.task.ligands[i].smiles )
    #     for i in range(len(self.ligands)):
    #         self.write_stdin ( "\nLIGIN " + self.ligands[i].code + ";" +\
    #                            self.ligands[i].getLibFilePath(fileDir) + ";" +\
    #                            self.ligands[i].getPDBFilePath(fileDir) )
    #
    #     self.write_stdin ( "\n" )
    #     self.close_stdin()
    #
    #     queueName = self.getCommandLineParameter("queue")
    #     #if len(sys.argv)>4:
    #     #    if sys.argv[4]!="-":
    #     #        queueName = sys.argv[4]
    #
    #     if self.jobManager == "SGE":
    #         nSubJobs = self.getCommandLineParameter("nproc");
    #         if not nSubJobs:
    #             nSubJobs = "0"
    #         #if len(sys.argv)>5:
    #         #    nSubJobs = sys.argv[5]
    #     else:
    #         nSubJobs = "4";
    #
    #     meta = {}
    #     meta["jobId"]         = self.job_id
    #     meta["stageNo"]       = stageNo
    #     meta["sge_q"]         = queueName
    #     meta["sge_tc"]        = nSubJobs
    #     meta["summaryTabId"]  = self.report_page_id()
    #     meta["summaryTabRow"] = self.rvrow
    #     meta["navTreeId"]     = self.navTreeId
    #     meta["outputDir"]     = self.outputDir()
    #     meta["outputName"]    = "ccp4go"
    #
    #     self.storeReportDocument ( json.dumps(meta) )
    #
    #     ccp4go_path = os.path.normpath ( os.path.join (
    #                         os.path.dirname(os.path.abspath(__file__)),
    #                         "../apps/ccp4go2/ccp4go.py" ) )
    #     cmd = [ ccp4go_path,
    #             "--job-manager"   ,self.jobManager,
    #             "--rdir","report" ,
    #             "--rvapi-document",self.reportDocumentName()
    #           ]
    #
    #     sec1 = self.task.parameters.sec1.contains
    #     if self.getParameter(sec1.SIMBAD12_CBX)=="False":
    #         cmd += ["--no-simbad12"]
    #     if self.getParameter(sec1.MORDA_CBX)=="False":
    #         cmd += ["--no-morda"]
    #     if self.getParameter(sec1.CRANK2_CBX)=="False":
    #         cmd += ["--no-crank2"]
    #     if self.getParameter(sec1.FITLIGANDS_CBX)=="False":
    #         cmd += ["--no-fitligands"]
    #
    #     pyrvapi.rvapi_keep_polling ( True )
    #     if sys.platform.startswith("win"):
    #         self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
    #     else:
    #         self.runApp ( "ccp4-python",cmd,logType="Main" )
    #     pyrvapi.rvapi_keep_polling ( False )
    #     self.restoreReportDocument()
    #     self.addCitations ( ['ccp4go'] )
    #     self.rvrow += 100
    #
    #     # check on resulting metadata file
    #     ccp4go_meta_file = "ccp4go.meta.json"
    #     ccp4go_meta = None
    #     try:
    #         with open(ccp4go_meta_file) as json_data:
    #             ccp4go_meta = json.load(json_data)
    #     except:
    #         pass
    #
    #     if ccp4go_meta:
    #
    #         self.rvrow = ccp4go_meta["report_row"]
    #
    #         resorder   = ccp4go_meta["resorder"]
    #         results    = ccp4go_meta["results"]
    #         for i in range(len(resorder)):
    #             d = resorder[i]  # stage's result directory
    #             if d in results:
    #                 self.makeOutputData ( d,results[d] )
    #                 have_results = True
    #                 self.flush()
    #
    #         if "programs_used" in ccp4go_meta:
    #             self.addCitations ( ccp4go_meta["programs_used"] )
    #
    #     else:
    #         self.putTitle ( "Results not found (structure not solved)" )
