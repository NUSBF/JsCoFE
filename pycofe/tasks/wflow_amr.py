##!/usr/bin/python

#
# ============================================================================
#
#    18.12.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  AUTOMATIC MR WORKFLOW EXECUTABLE MODULE
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
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev, 
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

# simulates ligand data structure that is normally coming from JS part
# class ligandCarrier():
#     def __init__(self, source, smiles, code):
#         self.source = source
#         self.smiles = smiles
#         self.code = code

class WFlowAMR(import_task.Import):

    def smiles_file_path(self): return "smiles.smi"


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

        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            self.seq = self.input_data.data.seq
            # for i in range(len(self.input_data.data.seq)):
            #     self.seq.append ( self.makeClass(self.input_data.data.seq[i]) )

        # ligMessage = ''

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            self.lig = self.input_data.data.ligand

            # ligMessage = 'Workflow will use previously generated ligand ' + str(self.lig[0].code)

            # for i in range(len(self.input_data.data.lig)):
            #     self.lig.append ( self.makeClass(self.input_data.data.lig[i]) )


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

        seqHasNA      = False
        seqHasProtein = False
        # for s in self.seq:
        #     if s.isDNA() or s.isRNA():
        #         seqHasNA = True
        #     elif s.isProtein():
        #         seqHasProtein = True

        for i in range(len(self.seq)):
            s = self.makeClass ( self.seq[i] )
            if s.isDNA() or s.isRNA():
                seqHasNA = True
            elif s.isProtein():
                seqHasProtein = True

        if seqHasNA and not seqHasProtein:
            fmsg = "Sequence is provided for nucleic acid only; Automated MR " +\
                   "Workflow can deal only with proteins or complexes<br>"+ \
                   "<p>Please try Simple Molecular Replacement Workflow or " +\
                   "solve the structure manually in the Expert Mode."
            self.putMessage("<h3>%s</h3></hr>" % fmsg)
            self.fail('','SMR_WF')

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
                if len(self.lig)>0:
                    self.putMessage ( "<i>" + str(len(self.lig)) +\
                                      " ligand(s) supplied. Workflow will find and fit structure " +\
                                      "in reflection data, refine, fit ligand, find and " +\
                                      "fit water molecules</i>" )
                elif len(self.ligdesc)>0:
                    self.putMessage ( "<i>" + str(len(self.ligdesc)) +\
                                      " ligand description(s) supplied. Workflow will " +\
                                      "find and fit structure in reflection data, refine, make and " +\
                                      "fit ligand, find and fit water molecules</i>" )
                else:
                    self.putMessage ( "<i>No ligands supplied. Workflow will only find and fit " +\
                                      "structure in reflection data, refine, find and fit " +\
                                      "water molecules</i>" )
            else:
                summary_line += "workflow start failed"
        else:
            summary_line += "insufficient input"

        self.generic_parser_summary["import_autorun"] = {
          "summary_line" : summary_line
        }

        # import time
        # time.sleep ( 1 )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = WFlowAMR ( "",os.path.basename(__file__),{} )
    drv.start()
