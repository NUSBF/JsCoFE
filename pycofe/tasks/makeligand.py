##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    24.01.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ACEDRG EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.makeligand jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import gemmi
from   gemmi   import  cif

#  application imports
from . import basic
from  pycofe.auto  import auto

# ============================================================================
# Make Refmac driver

class MakeLigand(basic.TaskDriver):

    def smiles_file_path(self): return "smiles.smi"

    # ------------------------------------------------------------------------

    def run(self):

        # copy pre-existing revisions into output first
        nrevisions0 = 0
        revisions    = []
        if hasattr(self.input_data.data,"void1"):
            revisions    = self.input_data.data.void1
            nrevisions0 = len(revisions)
            for i in range(len(revisions)):
                revisions[i] = self.makeClass ( revisions[i] )
                revisions[i].register ( self.outputDataBox )

        # Prepare makeligand input
        # fetch input data

        sourceKey = self.getParameter ( self.task.parameters.SOURCE_SEL )
        cmd       = []
        xyzPath   = None
        cifPath   = None
        lig_path  = None

        if sourceKey == "S":
            smiles  = self.getParameter ( self.task.parameters.SMILES )
            code    = self.getParameter ( self.task.parameters.CODE ).strip().upper()

            if not code:
                exclude_list = []
                for i in range(len(revisions)):
                    ligands = revisions[i].Ligands
                    for j in range(len(ligands)):
                        exclude_list.append ( ligands[i].code )
                code = self.get_ligand_code ( exclude_list )

            if code:
                xyzPath = code + ".pdb"
                cifPath = code + ".cif"

                f = open ( self.smiles_file_path(),'w' )
                f.write  ( smiles + '\n' )
                f.close  ()

                # make command-line parameters
                cmd = [ "-i",self.smiles_file_path(),
                        "-r",code,"-o",code ]

            else:
                self.putMessage ( "<h3>Failed to generate ligand code.</h3>" )

        else:
            code     = self.getParameter ( self.task.parameters.CODE3 ).upper()
            xyzPath  = code + ".pdb"
            cifPath  = code + ".cif"
            lig_path = os.path.join(os.environ["CCP4"],"lib","data","monomers",
                                      code[0].lower(),code + ".cif" )
            if os.path.isfile(lig_path):
                # make AceDrg command line
                cmd = [ "-c",lig_path,"-r",code,"-o",code ]
                # check if we need to run AceDrg at all: is AceDrg forced and
                # are XYZ coordinates found in Monomer Library Entry?
                if self.getParameter(self.task.parameters.FORCE_ACEDRG_CBX)=="False":
                    # AceDrg is not forced by user
                    block = cif.read(lig_path)[-1]
                    if block.find_values('_chem_comp_atom.x'):
                        # XYZ coordinates are found in dictionary, just copy
                        # them over
                        st = gemmi.make_structure_from_chemcomp_block ( block )
                        st.write_pdb ( xyzPath )
                        cmd = []  # do not use AceDrg
            else:
                self.putMessage ( "<h3>Ligand \"" + code + "\" is not found in CCP4 Monomer Library.</h3>" )
                code = None  # signal not to continue with making ligand

        if code:  # can continue

            if self.outputFName == "":
                self.outputFName = code.upper()

            if len(cmd)>0:
                # Start makeligand
                if sys.platform.startswith("win"):
                    self.runApp ( "acedrg.bat",cmd,logType="Main" )
                else:
                    self.runApp ( "acedrg",cmd,logType="Main" )
            else:
                # copy ORIGINAL restraints in place
                shutil.copyfile ( lig_path,cifPath )

            ligand = self.finaliseLigand ( code,xyzPath,cifPath )

            revNext = None
            if len(revisions) > 0:
                revNext = revisions[0]
            elif hasattr(self.input_data.data,"revision"):
                revNext = self.makeClass(self.input_data.data.revision[0])

            auto.makeNextTask ( self,{
                "ligand" : ligand,
                'revision' : revNext
            })

            self.generic_parser_summary["makeligand"] = {
                "summary_line" : "ligand \"" + code + "\" prepared"
            }

        else:
            self.putTitle ( "No Ligand Structure Created" )


        # close execution logs and quit
        self.success ( code is not None )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MakeLigand ( "",os.path.basename(__file__) )
    drv.start()
