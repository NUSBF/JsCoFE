##!/usr/bin/python

#
# ============================================================================
#
#    18.12.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SIMPLE MR WORKFLOW EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.wflow_dplmr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Maria Fando, Eugene Krissinel, Andrey Lebedev  2023
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

# simulates ligand data structure that is normally coming from JS part

# class ligandCarrier():
#     def __init__(self, source, smiles, code):
#         self.source = source
#         self.smiles = smiles
#         self.code = code

class WFlowDPLMR(import_task.Import):

    import_dir = "uploads"
    def importDir(self):  return self.import_dir       # import directory

    # ------------------------------------------------------------------------

    def importData(self):
        #  works with uploaded data from the top of the project

        library_files = []
        for i in range(len(self.task.file_select)):
            if self.task.file_select[i].inputId=="flibrary":
                # this gives only file name but not the full path on client
                if self.task.file_select[i].path:
                    library_files = self.task.file_select[i].path

        super ( WFlowDPLMR,self ).import_all(ligand_libraries=library_files)

        # -------------------------------------------------------------------
        # fetch data for Custom Workflow pipeline

        if "DataUnmerged" in self.outputDataBox.data:
            self.unm = self.outputDataBox.data["DataUnmerged"]

        if "DataHKL" in self.outputDataBox.data:
            self.hkl = self.outputDataBox.data["DataHKL"]

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"]

        if "DataLibrary" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLibrary"]

        if "DataSequence" in self.outputDataBox.data:
            self.seq = self.outputDataBox.data["DataSequence"]

        if "DataLigand" in self.outputDataBox.data:
            self.lig = self.outputDataBox.data["DataLigand"]

        self.ligdesc = []
        ldesc = getattr ( self.task,"input_ligands",[] )
        for i in range(len(ldesc)):
            if ldesc[i].source=='S' or ldesc[i].source=='M':
                self.ligdesc.append ( ldesc[i] )

        return

    def prepareData(self):
        #  works with imported data from the project

        if self.input_data.data.hkldata[0]._type=="DataUnmerged":
            self.unm = self.input_data.data.hkldata
        else:
            self.hkl = self.input_data.data.hkldata

        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            self.xyz = self.input_data.data.xyz

        if hasattr(self.input_data.data,"library"):  # optional data parameter
            self.lib = self.input_data.data.library

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            self.seq = self.input_data.data.seq

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            self.lig = self.input_data.data.ligand

        return


    # ------------------------------------------------------------------------

    def run(self):

        self.unm = []  # unmerged dataset
        self.hkl = []  # selected merged dataset
        self.seq = []  # list of sequence objects
        self.xyz = []  # coordinates (model/apo)
        self.lig = []  # not used in this function but must be initialised
        self.ligdesc = []
        self.lib = []


        summary_line = ""
        ilist = []

        # ligand library CIF has been provided
        # if self.lib:
        #     ligand = self.makeClass(self.lib)
        #     self.lig.append(ligand)

        # fileDir = self.outputDir()
        if hasattr(self.input_data.data,"hkldata"):
            # fileDir = self.inputDir()
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
        if len(self.xyz)>0:
            ilist.append ( "XYZ (" + str(len(self.xyz)) + ")" )
        if len(self.lib)>0:
            ilist.append ( "Library (" + str(len(self.lib)) + ")" )
        if len(self.seq)>0:
            ilist.append ( "Sequences (" + str(len(self.seq)) + ")" )
        if len(self.lig)>0:
            self.ligdesc = []
        nligs = len(self.lig) + len(self.ligdesc)
        if nligs>0:
            ilist.append ( "Ligands (" + str(nligs) + ")" )
        if len(ilist)>0:
            summary_line += ", ".join(ilist) + "; "

        self.putMessage ( "<h3>Starting DIMPLE Molecuar Replacement Workflow</h3>" )
        if len(self.lig)>0:
            self.putMessage ( "<i>" + str(len(self.lig)) +\
                              " ligand(s) supplied. Workflow will fit structure " +\
                              "in reflection data, refine, fit ligand, find and " +\
                              "fit water molecules</i>" )
        elif len(self.ligdesc)>0:
            self.putMessage ( "<i>" + str(len(self.ligdesc)) +\
                              " ligand description(s) supplied. Workflow will " +\
                              "fit structure in reflection data, refine, make and " +\
                              "fit ligand, find and fit water molecules</i>" )
        else:
            self.putMessage ( "<i>No ligands supplied. Workflow will only fit " +\
                              "structure in reflection data, refine, find and fit " +\
                              "water molecules</i>" )

        self.task.autoRunName = "_root"
        self.have_results = False
        if auto.makeNextTask ( self, {
             "unm"     : self.unm,
             "hkl"     : self.hkl,
             "seq"     : self.seq,
             "xyz"     : self.xyz,
             "lig"     : self.lig,
             "lib"     : self.lib,
             "ligdesc" : self.ligdesc,
           }):
            summary_line += "workflow started"
            self.have_results = True
        else:
            summary_line += "workflow start failed"

        self.generic_parser_summary["import_autorun"] = {
            "summary_line": summary_line
        }
        self.success ( self.have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = WFlowDPLMR ( "",os.path.basename(__file__),{} )
    drv.start()
