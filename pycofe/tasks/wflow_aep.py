##!/usr/bin/python

#
# ============================================================================
#
#    18.12.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC EP WORKFLOW EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.autowf_mr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL, SGE or SCRIPT
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev, 
#                Maria Fando 2021-2023
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from   pycofe.tasks  import import_task
from   pycofe.auto   import auto

# ============================================================================
# Make WFlowAEP driver

# simulates ligand data structure that is normally coming from JS part
# class ligandCarrier():
#     def __init__(self, source, smiles, code):
#         self.source = source
#         self.smiles = smiles
#         self.code = code

class WFlowAEP(import_task.Import):

    # ------------------------------------------------------------------------

    def importData(self):
        #  works with uploaded data from the top of the project

        super ( WFlowAEP,self ).import_all()

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
        
        if "DataLigand" in self.outputDataBox.data:
            self.lig = self.outputDataBox.data["DataLigand"]

        self.ligdesc = []
        ldesc = getattr ( self.task,"input_ligands",[] )
        for i in range(len(ldesc)):
            if ldesc[i].source=='S' or ldesc[i].source=='M':
                self.ligdesc.append ( ldesc[i] )

        # checking whether ligand codes were provided
        # for i in range(len(self.ligdesc)):
        #     code = self.ligdesc[i].code.strip().upper()
        #     if (not code) or (code in self.ligand_exclude_list):
        #         self.ligdesc[i].code = self.get_ligand_code([])

        return


    def prepareData(self):
        #  works with imported data from the project

        if self.input_data.data.hkldata[0]._type=="DataUnmerged":
            self.unm = self.input_data.data.hkldata
        else:
            self.hkl = self.input_data.data.hkldata
            for i in range(len(self.hkl)):
                self.hkl[i] = self.makeClass ( self.hkl[i] )

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            self.seq = self.input_data.data.seq
            # for i in range(len(self.input_data.data.seq)):
            #     self.seq.append ( self.makeClass(self.input_data.data.seq[i]) )
        
        # ligMessage = ''

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            self.lig = self.input_data.data.ligand

            # ligMessage = 'Workflow will use previously generated ligand ' + str(self.lig[0].code)

            # for i in range(len(self.input_data.data.ligand)):
            #     self.ligands.append ( self.makeClass(self.input_data.data.ligand[i]) )

        return

    # ------------------------------------------------------------------------

    def run(self):

        self.unm = []  # unmerged dataset
        self.hkl = []  # selected merged dataset
        self.seq = []  # list of sequence objects
        # self.xyz = []  # coordinates (model/apo)
        self.lig = []  # not used in this function but must be initialised
        self.ligdesc = []
        # self.lib = None

        # ligand library CIF has been provided
        # if self.lib:
        #     ligand = self.makeClass(self.lib)
        #     self.lig.append(ligand)

        summary_line = ""
        ilist = []

        if hasattr(self.input_data.data,"hkldata"):
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
        nligs = len(self.lig) + len(self.ligdesc)
        if nligs>0:
            ilist.append ( "Ligands (" + str(nligs) + ")" )
        if len(ilist)>0:
            summary_line += ", ".join(ilist) + "; "

        ha_type = self.getParameter ( self.task.parameters.HATOM )

        have_results = False
        self.flush()

        if ((len(self.unm)>0) or (len(self.hkl)>0)) and (len(self.seq)>0):

            suitable = (len(self.unm)>0)
            if not suitable:
                n = -1
                for i in range(len(self.hkl)):
                    if self.hkl[i].isAnomalous() and (not suitable or "peak" in self.hkl[i].dname.lower()):
                        n = i
                        suitable = True
                if n>0:
                    hkl0 = self.hkl[0]
                    self.hkl[0] = self.hkl[n]
                    self.hkl[n] = hkl0

            if suitable:

                self.task.autoRunName = "_root"
                if auto.makeNextTask ( self,{
                    "unm"       : self.unm,
                    "hkl"       : self.hkl,
                    "seq"       : self.seq,
                    "lig"       : self.lig,
                    "ligdesc"   : self.ligdesc,
                    "hatom"     : ha_type
                  }):
                    summary_line += "workflow started"
                    have_results  = True
                    self.putMessage ( "<h3>Automatic Experimental Phasing (SAD) workflow started</h3>" )
                    if len(self.lig)>0:
                        self.putMessage ( "<i>" + str(len(self.lig)) +\
                                          " ligand(s) supplied. Workflow will calculate experimental " +\
                                          "phases, build structure, fit ligand, find and " +\
                                          "fit water molecules</i>" )
                    elif len(self.ligdesc)>0:
                        self.putMessage ( "<i>" + str(len(self.ligdesc)) +\
                                          " ligand description(s) supplied. Workflow will " +\
                                          "calculate experimental phases, build structure, make and " +\
                                          "fit ligand, find and fit water molecules</i>" )
                    else:
                        self.putMessage ( "<i>No ligands supplied. Workflow will only calculate " +\
                                          "experimental phases, build structure, find and fit " +\
                                          "water molecules</i>" )

                else:
                    summary_line += "workflow start failed"

            else:
                summary_line += "no anomalous signal"
                self.putMessage ( "<h3>No anomalous signal found</h3>" )
                self.putMessage ( "<i>Experimental Phasing cannot be performed.</i>" )

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

    drv = WFlowAEP ( "",os.path.basename(__file__),{} )
    drv.start()
