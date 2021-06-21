##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    17.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
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
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev 2021
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import migrate
from   pycofe.auto   import auto


# ============================================================================
# Make CCP4go driver

# simulates ligand data structure that is normally coming from JS part
class ligandCarrier():
    def __init__(self, source, smiles, code):
        self.source = source
        self.smiles = smiles
        self.code = code


class WFlowDPL(migrate.Migrate):

    # ------------------------------------------------------------------------

    def smiles_file_path(self): return "smiles.smi"

    # ------------------------------------------------------------------------

    def importData(self):
        # import uploaded data - DPL method, overriding parent
        super ( WFlowDPL,self ).import_all()

        # -------------------------------------------------------------------
        # fetch data for the Migrate pipeline

        self.hkl = []    # all reflections dataset (given and in map mtzs)
        self.xyz = None  # coordinates
        self.map = []    # maps/phases
        self.lib = None  # ligand descriptions
        self.unm = []

        if "DataUnmerged" in self.outputDataBox.data:
            self.unm = self.outputDataBox.data["DataUnmerged"]

        if "DataSequence" in self.outputDataBox.data:
            self.seq = self.outputDataBox.data["DataSequence"]

        if "DataHKL" in self.outputDataBox.data:
            self.hkl = self.outputDataBox.data["DataHKL"]

        # if len(self.unm)<1:
        #     hasI = False
        #     ids = None
        #     for dd in self.hkl:
        #         if dd.hasIntensities():
        #             hasI = True
        #             ids = dd
        #     if hasI:
        #         self.hkl = [ids]
        #     else:
        #         self.putMessage("<h3>Dimple Workflow requires intensities present in the diffraction data; terminating</h3>")
        #         self.generic_parser_summary["wflowdpl"] = {
        #             "summary_line" : "no intensities in the data"
        #         }
        #         self.have_results = False
        #         self.success ( self.have_results )
        #         return False
        # else:
        #     self.putMessage(
        #         "<h3>Dimple Workflow requires merged diffraction data; terminating</h3>")
        #     self.generic_parser_summary["wflowdpl"] = {
        #         "summary_line": "merged data required"
        #     }
        #     self.have_results = False
        #     self.success(self.have_results)
        #     return False

        if len(self.unm):
            self.putMessage(
                "<h3>Dimple Workflow requires merged diffraction data; terminating</h3>")
            self.generic_parser_summary["wflowdpl"] = {
                "summary_line": "merged data required"
            }
            self.have_results = False
            self.success(self.have_results)
            return False

        if "DataXYZ" in self.outputDataBox.data:
            self.xyz = self.outputDataBox.data["DataXYZ"][0]

        if "DataLibrary" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLibrary"][0]
        elif "DataLigand" in self.outputDataBox.data:
            self.lib = self.outputDataBox.data["DataLigand"][0]

        self.ligdesc = []
        ldesc = getattr ( self.task,"input_ligands",[] )
        for i in range(len(ldesc)):
            if ldesc[i].source!='none':
                self.ligdesc.append ( ldesc[i] )

        return True


    def run(self):

        self.ligdesc = []
        self.lig = []
        self.lib = None
        self.have_results = False

        importSuccess = self.importData()
        if not importSuccess:
            return # all output and registrations already done in the upstream code

        # successfullDataCheck =  self.checkData()
        # if not successfullDataCheck:
        #     return # all preparations already done in the upstream code

        (revisionSerialNo, revision) = self.makeStructures()

        summary_line = ""
        ilist = []

        # ligand library CIF has been provided
        if self.lib:
            ligand = self.makeClass(self.lib)
            self.lig.append(ligand)

        # checking whether ligand codes were provided
        for i in range(len(self.ligdesc)):
            code = self.ligdesc[i].code.strip().upper()
            if (not code) or (code in self.ligand_exclude_list):
                exclude_list = []
                ligands = revision.Ligands
                for j in range(len(ligands)):
                    exclude_list.append(ligands[j]["code"])
                self.ligdesc[i].code = self.get_ligand_code(exclude_list)

        if self.unm:
            ilist.append ( "Unmerged" )
        if len(self.hkl)>0:
            ilist.append ( "HKL (" + str(len(self.hkl)) + ")" )
        if len(self.seq)>0:
            ilist.append ( "Sequences (" + str(len(self.seq)) + ")" )
        if self.xyz:
            ilist.append ( "XYZ (1)" )
        nligs = len(self.lig) + len(self.ligdesc)
        if nligs>0:
            ilist.append ( "Ligands (" + str(nligs) + ")" )
        if len(ilist)>0:
            summary_line += ", ".join(ilist) + "; "

        self.putMessage("<h3>Starting Automatic Refinement and Ligand Fitting Workflow</h3>")
        if nligs>0:
            self.putMessage("<i>%d ligand(s) supplied, Workflow will try to fit it</i>" % nligs)
        else:
            self.putMessage("<i>No ligands supplied, Workflow will just refine the structure and fit waters</i>")

        self.task.autoRunName = "_root"
        self.have_results = False
        if auto.makeNextTask ( self, {
            "unm": self.unm,
            "revision" : revision,
             "hkl": self.hkl,
             "seq": self.seq,
             "lig": self.lig,
             "ligdesc": self.ligdesc,
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

    drv = WFlowDPL ( "",os.path.basename(__file__),{} )
    drv.start()
