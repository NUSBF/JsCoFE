##!/usr/bin/python

#
# ============================================================================
#
#    07.10.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import gemmi

#  application imports
from . import basic
from  pycofe.auto   import auto,auto_workflow

# ============================================================================
# Make Refmac driver

class MakeLigand(basic.TaskDriver):

    def smiles_file_path(self): return "smiles.smi"

    # ------------------------------------------------------------------------

    def run(self):

        # copy pre-existing revisions into output first
        # nrevisions0 = 0
        revisions = []
        if hasattr(self.input_data.data,"void1"):
            revisions = self.input_data.data.void1
            # nrevisions0 = len(revisions)
            for i in range(len(revisions)):
                revisions[i] = self.makeClass ( revisions[i] )
                revisions[i].register ( self.outputDataBox )

        iligand = None
        if hasattr(self.input_data.data, "ligand"):
            iligand = self.makeClass ( self.input_data.data.ligand[0] )

        # Prepare makeligand input
        # fetch input data

        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains

        sourceKey = self.getParameter ( sec1.SOURCE_SEL )
        cmd       = []
        cif       = None
        mmcifPath = None
        cifPath   = None
        lig_path  = None
        code0     = None
        code      = None
        
        if sourceKey=="M" or iligand:

            lig_path = ""
            if iligand:
                code     = iligand.code
                lig_path = iligand.getLibFilePath ( self.inputDir() )
            else:
                code     = self.getParameter ( sec1.CODE3 ).upper()
                lig_path = os.path.join ( os.environ["CCP4"],"lib","data","monomers",
                                          code[0].lower(),code + ".cif" )
            xyzPath  = code + ".pdb"

            if os.path.isfile(lig_path):
                # make AceDrg command line
                cmd = [ "-c",lig_path,"-r",code,"-o",code ]
                # check if we need to run AceDrg at all: is AceDrg forced and
                # are XYZ coordinates found in Monomer Library Entry?
                if self.getParameter(sec1.FORCE_ACEDRG_CBX)=="False":
                    # AceDrg is not forced by user
                    block = gemmi.cif.read(lig_path)[-1]
                    if block.find_values('_chem_comp_atom.x'):
                        # XYZ coordinates are found in dictionary, just copy
                        # them over
                        st = gemmi.make_structure_from_chemcomp_block ( block )
                        # st[0][0][0].seqid = gemmi.SeqId('1')
                        st.write_pdb ( xyzPath )
                        cmd = []  # do not use AceDrg
                
            else:
                self.putMessage ( "<h3>Ligand \"" + code +\
                                  "\" is not found in CCP4 Monomer Library.</h3>" )
                code = None  # signal not to continue with making ligand

        else:  # generate from SMILES string

            smiles  = self.getParameter ( sec1.SMILES )
            code    = self.getParameter ( sec1.CODE ).strip().upper()

            if not code:
                exclude_list = []
                for i in range(len(revisions)):
                    ligands = revisions[i].Ligands
                    for j in range(len(ligands)):
                        if ligands[j]._type=="DataLigand":
                            exclude_list.append ( ligands[j].code )
                        else:  # it's a library
                            for code in ligands[j].codes:
                                exclude_list.append ( code )
                code = self.get_ligand_code ( exclude_list )

            if code:
                
                if len(code)>3:
                    code0 = code
                    code  = "LIG"

                xyzPath = code + ".pdb"

                f = open ( self.smiles_file_path(),'w' )
                f.write  ( smiles + '\n' )
                f.close  ()

                # make command-line parameters
                cmd = [ "-i",self.smiles_file_path(),
                        "-r",code,"-o",code ]

            else:
                self.putMessage ( "<h3>Failed to generate ligand code.</h3>" )

        if self.getParameter(sec2.NOPROT)=="True":
            cmd += ["-K"]

        if self.getParameter (sec2.NUMINITCONFORMERS)!="":
            cmd += ["-j",self.getParameter(sec2.NUMINITCONFORMERS)]

        summary_line = "no ligand created (errors)"

        if code:  # can continue

            if self.outputFName == "":
                self.outputFName = code.upper()

            if len(cmd)>0:
                # Start makeligand
                if sys.platform.startswith("win"):
                    self.runApp ( "acedrg.bat",cmd,logType="Main" )
                else:
                    self.runApp ( "acedrg",cmd,logType="Main" )
                if not os.path.exists(xyzPath):
                    cifPath  = code + ".cif"
                    if not os.path.exists(cifPath):
                        cifPath = code + "_final.cif"
                    cif = gemmi.cif.read_file ( cifPath )
                    st  = gemmi.make_structure_from_chemcomp_block ( cif["comp_" + code] )
                    while len(st)>1:  # because of gemmi bug
                        del st[1]
                    st.write_pdb ( xyzPath )
            else:
                # copy ORIGINAL restraints in place
                shutil.copyfile ( lig_path,cifPath )

            if code0: # long ligand code, hack output
                with open(cifPath,"r") as fin:
                    cifdata = fin.read().replace ( code,code0 )
                    cifPath = code0 + ".cif"
                    with open (cifPath,"w") as fout:
                        fout.write ( cifdata )
                with open(xyzPath,"r") as fin:
                    xyzdata = fin.read().replace ( code,code0[:3] )
                    xyzPath = code0 + ".pdb"
                    with open (xyzPath,"w") as fout:
                        fout.write ( xyzdata )
                block = gemmi.cif.read(cifPath)[-1]
                if block.find_values('_chem_comp_atom.x'):
                    mmcifPath = code0 + ".mmcif"
                    # XYZ coordinates are found in dictionary, just copy
                    # them over
                    st = gemmi.make_structure_from_chemcomp_block ( block )
                    st[0][0][0].seqid = gemmi.SeqId('1')
                    st.make_mmcif_document().write_file ( mmcifPath )
                    # shutil.copy ( mmcifPath,xyzPath )
                code = code0
    
            ligand = self.finaliseLigand ( code,xyzPath,cifPath )
            # if mmcifPath:
            #     fname = os.path.splitext(ligand.getLibFileName())[0] + ".mmcif"
            #     ligand.setFile ( fname,dtype_template.file_key["mmcif"] )
            #     os.rename ( mmcifPath, os.path.join(self.outputDir(),fname) )

            if ligand:
                revNext = None
                if len(revisions) > 0:
                    revNext = revisions[0]
                elif hasattr(self.input_data.data,"void1"):
                    revNext = self.makeClass(self.input_data.data.void1[0])
                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    rdata = { "ligand" : [ligand] }
                    if revNext:
                        rdata["revision"] = [revNext]
                    auto_workflow.nextTask ( self,{
                        "data"      : rdata,
                        "variables" : {
                            "N_lig" : 1
                        }
                    })
                    # self.putMessage ( "<h3>Workflow started</hr>" )
                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "ligand"   : ligand,
                        "revision" : revNext
                    })

                summary_line = "ligand \"" + code + "\" "
                if sourceKey=="M" or iligand:
                    summary_line += "reprocessed"
                else:
                    summary_line += "prepared"

        else:
            self.putTitle ( "No Ligand Structure Created" )

        self.generic_parser_summary["makeligand"] = {
            "summary_line" : summary_line
        }

        # close execution logs and quit
        self.success ( code is not None )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MakeLigand ( "",os.path.basename(__file__) )
    drv.start()
