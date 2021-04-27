##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    27.04.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.wflow_amr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev 2021
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

class WFlowAMR(import_task.Import):

    import_dir = "uploads"
    def importDir(self):  return self.import_dir       # import directory

    # ------------------------------------------------------------------------

    def importData(self):
        #  works with uploaded data from the top of the project

        super ( WFlowAMR,self ).import_all()

        # -------------------------------------------------------------------
        # fetch data for CCP4go pipeline

        if "DataUnmerged" in self.outputDataBox.data:
            self.unm = self.outputDataBox.data["DataUnmerged"]

        if "DataHKL" in self.outputDataBox.data:
            self.hkl = self.outputDataBox.data["DataHKL"]
            # maxres = 10000.0
            # for i in range(len(self.outputDataBox.data["DataHKL"])):
            #     res = self.outputDataBox.data["DataHKL"][i].getHighResolution(True)
            #     if res<maxres:
            #         maxres   = res
            #         self.hkl = self.outputDataBox.data["DataHKL"][i]

        if "DataSequence" in self.outputDataBox.data:
            self.seq = self.outputDataBox.data["DataSequence"]

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"]

        self.ligdesc = []
        ldesc = getattr ( self.task,"input_ligands",[] )
        for i in range(len(ldesc)):
            if ldesc[i].source!='none':
                self.ligdesc.append ( ldesc[i] )

        return


    def prepareData(self):
        #  works with imported data from the project

        if self.input_data.data.hkldata[0]._type=="DataUnmerged":
            self.unm = self.input_data.data.hkldata
        else:
            self.hkl = self.input_data.data.hkldata

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            self.seq = self.input_data.data.seq
            # for i in range(len(self.input_data.data.seq)):
            #     self.seq.append ( self.makeClass(self.input_data.data.seq[i]) )

        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            self.xyz = self.input_data.data.xyz

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            self.lig = self.input_data.data.ligand

            # for i in range(len(self.input_data.data.ligand)):
            #     self.ligands.append ( self.makeClass(self.input_data.data.ligand[i]) )

        return

    # ------------------------------------------------------------------------

    def run(self):

        self.unm = []  # unmerged dataset
        self.hkl = []  # selected merged dataset
        self.seq = []  # list of sequence objects
        self.xyz = []  # coordinates (model/apo)
        self.lig = []  # not used in this function but must be initialised
        self.ligdesc = []

        summary_line = ""
        ilist = []

        fileDir = self.outputDir()
        if hasattr(self.input_data.data,"hkldata"):
            fileDir = self.inputDir()
            self.prepareData()  #  pre-imported data provided
            summary_line = "received "
        else:
            self.importData()   #  data was uploaded
            summary_line = "imported "
            self.putMessage ( "&nbsp;" )

        if self.unm:
            ilist.append ( "Unmerged" )
        if len(self.hkl)>0:
            ilist.append ( "HKL (" + str(len(self.hkl)) + ")" )
        if len(self.seq)>0:
            ilist.append ( "Sequences (" + str(len(self.seq)) + ")" )
        if len(self.xyz)>0:
            ilist.append ( "XYZ (" + str(len(self.xyz)) + ")" )
        nligs = len(self.lig) + len(self.ligdesc)
        if nligs>0:
            ilist.append ( "Ligands (" + str(nligs) + ")" )
        if len(ilist)>0:
            summary_line += ", ".join(ilist) + "; "

        # less parameters - less headache user have
        # mr_engine = self.getParameter ( self.task.parameters.MR_ENGINE )
        # mb_engine = self.getParameter ( self.task.parameters.MB_ENGINE )
        #
        # if mr_engine=="mrbump":
        #     self.putMessage ( "Automatic MR solver: <b>MrBump</b>" )
        # else:
        #     self.putMessage ( "Automatic MR solver: <b>MoRDa</b>" )
        #
        # if mb_engine=="ccp4build":
        #     self.putMessage ( "Automatic model builder: <b>CCP4Build</b>" )
        # else:
        #     self.putMessage ( "Automatic model builder: <b>Buccaneer</b>" )

        self.flush()

        have_results = True

        if ((len(self.unm)>0) or (len(self.hkl)>0)) and (len(self.seq)>0):
            self.task.autoRunName = "_root"
            if auto.makeNextTask ( self,{
                    "unm"       : self.unm,
                    "hkl"       : self.hkl,
                    "seq"       : self.seq,
                    "lig"       : self.lig,
                    "ligdesc"   : self.ligdesc
                    # "mr_engine" : mr_engine,
                    # "mb_engine" : mb_engine
               },self.file_stderr):
                summary_line += "workflow started"
                self.putMessage ( "<h3>Automatic Molecular Replacement workflow started</hr>" )
            else:
                summary_line += "workflow start failed"
        else:
            summary_line += "insufficient input"

        self.generic_parser_summary["import_autorun"] = {
          "summary_line" : summary_line
        }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = WFlowAMR ( "",os.path.basename(__file__),{} )
    drv.start()
