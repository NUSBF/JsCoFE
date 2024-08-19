##!/usr/bin/python

#
# ============================================================================
#
#    18.12.23   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskyi, Andrey Lebedev, Maria Fando 2021-2023
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import basic
from   pycofe.auto   import auto

# ============================================================================
# Make WFlowDPL driver

# simulates ligand data structure that is normally coming from JS part
class ligandCarrier():
    def __init__(self, source, smiles, code):
        self.source = source
        self.smiles = smiles
        self.code = code

class WFlowDPL(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def smiles_file_path(self): return "smiles.smi"

    # ------------------------------------------------------------------------

    def run(self):

        self.lig = []  # not used in this function but must be initialised
        self.ligdesc = []

        revision = self.makeClass(self.input_data.data.revision[0])
        revision.register(self.outputDataBox)

        ligMessage = ''

        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            self.lig = self.input_data.data.ligand
            ligMessage = 'Workflow will use previously generated ligand ' + str(self.lig[0].code)

        ldesc = getattr ( self.task.parameters.sec1,"contains" )
        if ldesc.SMILES.value or ldesc.CODE3.value:
            if ldesc.SOURCE_SEL.value == 'S':
                code = ldesc.CODE.value.strip().upper()
                if (not code) or (code in self.ligand_exclude_list):
                    exclude_list = []
                    ligands = revision.Ligands
                    for j in range(len(ligands)):
                        exclude_list.append(ligands[j]["code"])
                    code = self.get_ligand_code(exclude_list)

                newLig =ligandCarrier(ldesc.SOURCE_SEL.value, ldesc.SMILES.value, code)
                if len(ligMessage) >1:
                    ligMessage = ligMessage + ' and ligand from SMILES string: ' + str(newLig.smiles)
                else:
                    ligMessage = 'Workflow will generate ligand from SMILES string: ' + str(newLig.smiles)
            elif ldesc.SOURCE_SEL.value == 'M':
                newLig =ligandCarrier(ldesc.SOURCE_SEL.value, ldesc.SMILES.value, ldesc.CODE3.value)
                if len(ligMessage) >1:
                    ligMessage = ligMessage + ' and ligand from monomer library: ' + str(newLig.code)
                else:
                    ligMessage = 'Workflow will use ligand from monomer library: ' + str(newLig.code)
            self.ligdesc.append ( newLig )


        summary_line = ""
        ilist = []

        nligs = len(self.lig) + len(self.ligdesc)
        if nligs>0:
            ilist.append ( "Ligands (" + str(nligs) + ")" )
        if len(ilist)>0:
            summary_line += ", ".join(ilist) + "; "

        self.task.autoRunName = "_root"
        have_results = False
        if auto.makeNextTask ( self, {
             "revision" : revision,
             "lig"      : self.lig,
             "ligdesc"  : self.ligdesc
           }):
            summary_line += "workflow started"
            have_results  = True
            self.putMessage ( "<h3>Starting Automatic Refinement and Ligand Fitting Workflow</h3>" )
            if ligMessage:
                self.putMessage ( "<i>" + ligMessage + "</i>")
            else:
                self.putMessage ( "<i>No ligands supplied, Workflow will just refine the structure and fit waters</i>")
        else:
            summary_line += "workflow start failed"

        self.generic_parser_summary["import_autorun"] = {
            "summary_line": summary_line
        }
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = WFlowDPL ( "",os.path.basename(__file__),{} )
    drv.start()
