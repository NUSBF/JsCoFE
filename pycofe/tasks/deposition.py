##!/usr/bin/python

#
# ============================================================================
#
#    29.03.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DEPOSITION EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.deposition exeType jobDir jobId
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
import uuid
from   xml.etree import ElementTree as ET

#  ccp4 imports
import gemmi
from   gemmi import cif

from ccp4mg import mmdb2


#  application imports
import basic
from   proc import valrep


# ============================================================================
# Make Deposition driver

class Deposition(basic.TaskDriver):

    def xml_input (self):  return "inp.xml"
    def dep_grid  (self):  return "dep_grid"

    # redefine name of input script file
    def file_stdin_path(self):  return "deposition.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When deposition
        # succeeds, this file is created.
        if os.path.isfile(self.getCIFOFName()):
            os.remove(self.getCIFOFName())

        # Prepare deposition input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        seq      = self.input_data.data.seq
        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )

        # 1. Use zero cycles of Refmac just to produce the final CIF file

        self.putMessage ( "<h3><i>1. Prepare Deposition Files</i></h3>" )

        self.open_stdin()
        self.write_stdin ( "pdbout format mmcif\n" +
                           "make hydrogen YES hout YES\n" +
                           "ncyc 0\n"   +
                           "labin  FP=" + hkl.dataset.Fmean.value +
                           " SIGFP="    + hkl.dataset.Fmean.sigma +
                           " FREE="     + hkl.dataset.FREE + "\n" +
                           "end\n" )
        self.close_stdin()

        # make command-line parameters for bare morda run on a SHELL-type node
        cmd = [ "hklin" ,hkl.getFilePath(self.inputDir()),
                "xyzin" ,istruct.getXYZFilePath(self.inputDir()),
                "hklout",self.getMTZOFName(),
                "xyzout",self.getXYZOFName(),
                "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += ["libin",libin]

        # Prepare report parser

        sec_id = self.getWidgetId ( self.refmac_section() )
        self.putSection ( sec_id,"Final Coordnates and Metadata from Refmac",
                          False )
        panel_id = self.getWidgetId ( self.refmac_report() )
        self.putPanel1 ( sec_id,panel_id,0,1 )
        self.setGenericLogParser ( panel_id,False,False,False )

        # Start refmac
        self.runApp ( "refmac5",cmd )


        # 2. Prepare the combined coordinate-sequence CIF

        seq_files = []
        for i in range(len(seq)):
            seq_files.append ( seq[i].getSeqFilePath(self.inputDir()) )
        seq_aliases = [os.path.basename(x).rpartition(".")[0] for x in seq_files]
        e0 = ET.Element("merging")
        e0.text = "\n"
        e0.tail = "\n"
        e1 = ET.SubElement ( e0,"refmac" )
        e1.text = "\n"
        e1.tail = "\n"
        e2 = ET.SubElement ( e1,"file" )
        #e2.text = 'refmac_xyz.pdb'
        e2.text = self.getXYZOFName()
        e2.tail = "\n"
        e1 = ET.SubElement ( e0,"sequences" )
        e1.text = "\n"
        e1.tail = "\n"
        for alias, file in zip(seq_aliases,seq_files):
          e2 = ET.SubElement ( e1,"sequence" )
          e2.text = "\n"
          e2.tail = "\n"
          e3 = ET.SubElement ( e2,"seq_alias" )
          e3.text = alias
          e3.tail = "\n"
          e3 = ET.SubElement ( e2,"file" )
          e3.text = file
          e3.tail = "\n"
          e3 = ET.SubElement ( e2,"format" )
          e3.text = "fasta"
          e3.tail = "\n"
        ET.ElementTree(e0).write(self.xml_input())

        self.runApp ( "pdbdeposition",["-x",self.xml_input()] )

        #corrFilePath = os.path.splitext(self.getXYZOFName())[0] + "_corr.cif"
        #os.rename ( os.path.splitext(self.getXYZOFName())[0] + "_out.cif",
        #            corrFilePath )




        # 3. Correct CIF file after Refmac

        """
        model       = gemmi.read_structure ( self.getXYZOFName() )[0]
        chain_names = [chain.name for chain in model]

        doc = cif.read ( self.getXYZOFName() )
        block = doc[0]
        block.set_mmcif_category ( "_exptl",{
            "entry_id"        : ["XXXX"],
            "method"          : ["X-RAY DIFFRACTION"],
            "crystals_number" : ["?"]
        })
        block.set_mmcif_category ( "_exptl_crystal",{
            "id"                  : [1],
            "density_meas"        : ["?"],
            "density_Matthews"    : [2.33],
            "density_percent_sol" : [47.15],
            "description"         : ["?"]
        })
        corrFilePath = os.path.splitext(self.getXYZOFName())[0] + "_corr.cif"
        doc.write_file ( corrFilePath,cif.Style.Pdbx )
        """


        mm  = mmdb2.Manager()
        mm.ReadCoorFile ( str(self.getXYZOFName()) )
        model   = mm.GetFirstDefinedModel()
        nchains = model.GetNumberOfChains()
        seqlist = ""
        for i in range(nchains):
            chain = model.GetChain ( i )
            if chain.isAminoacidChain() or chain.isNucleotideChain():
                if seqlist:
                    seqlist += ","
                seqlist += chain.GetChainID()

        corrFilePath  = os.path.splitext(self.getXYZOFName())[0] + "_out.cif"
        modelFilePath = os.path.splitext(self.getXYZOFName())[0] + ".cif"
        fin  = open ( corrFilePath ,"r" )
        fout = open ( modelFilePath,"wt" )
        skipNext = False
        for line in fin:
            if line.startswith("_symmetry.entry_id"):
                fout.write ( "_exptl.entry_id          XXXX\n" +
                             "_exptl.method            'X-RAY DIFFRACTION'\n" +
                             "_exptl.crystals_number   ?\n" +
                             "#\n" +
                             "_exptl_crystal.id                    1\n"    +
                             "_exptl_crystal.density_meas          ?\n"    +
                             "_exptl_crystal.density_Matthews      %.3f\n"
                             % revision.ASU.matthews +
                             "_exptl_crystal.density_percent_sol   %.2f\n"
                             % revision.ASU.solvent  +
                             "_exptl_crystal.description           ?\n"    +
                             "#\n"
                           )
            elif line.startswith("_entity_poly.entity_id"):
                fout.write ( "_entity_poly.pdbx_strand_id          " + seqlist + "\n" )
            if not skipNext:
                fout.write ( line )
            skipNext = line.startswith ( "_refine.aniso_B[2][3]" )
        fin .close()
        fout.close()

        # 4. Prepare CIF with structure factors

        anomcols  = hkl.getAnomalousColumns()
        anomlabin = ""
        if anomcols[4]=="I":
            anomlabin = " I(+)=" + anomcols[0] + " SIGI(+)=" + anomcols[1] +\
                        " I(-)=" + anomcols[2] + " SIGI(-)=" + anomcols[3]
        elif anomcols[4]=="F":
            anomlabin = " F(+)=" + anomcols[0] + " SIGF(+)=" + anomcols[1] +\
                        " F(-)=" + anomcols[2] + " SIGF(-)=" + anomcols[3]

        self.open_stdin()
        self.write_stdin ( "OUTPUT CIF -\n"  +
                           "    data_ccp4\n" +
                           "labin  FP=" + hkl.dataset.Fmean.value +
                           " SIGFP="    + hkl.dataset.Fmean.sigma +
                           anomlabin    +
                           " FREE="     + hkl.dataset.FREE + "\n" +
                           "end\n" )
        self.close_stdin()

        sfCIF = self.getOFName ( "_sf.cif" )
        cmd   = ["HKLIN",hkl.getFilePath(self.inputDir()), "HKLOUT",sfCIF]

        # Start mtz2various
        self.runApp ( "mtz2various",cmd )
        self.unsetLogParser()

        self.putMessage ( "&nbsp;<h3><i>Deposition files</i></h3>" +\
            "<b>Use download buttons below to download files for further upload to " +\
            "<a href='https://deposit-1.wwpdb.org' target='_blank'>" +\
            "wwPDB Deposition Site</a></b> <i>(link opens in new tab/window)</i>" +\
            "<br><hr/>"
        )

        grid_id = self.getWidgetId ( self.dep_grid() )
        self.putGrid ( grid_id )
        self.putMessage1 ( grid_id,"<i>Final coordinate file in mmCIF format</i>&nbsp;",0,0 )
        self.putMessage1 ( grid_id,"<i>Structure factors file in CIF format</i>" ,1,0 )
        self.putDownloadButton ( modelFilePath,"download",grid_id,0,1 )
        self.putDownloadButton ( sfCIF        ,"download",grid_id,1,1 )
        self.putMessage ( "<hr/>" )

        # 4. Obtain validation report from the PDB

        self.putMessage ( "&nbsp;<p><h3><i>2. Validation Report</i></h3>" )
        self.flush()

        repFilePath = os.path.splitext(self.getXYZOFName())[0] + ".pdf"

        self.file_stdout.write ( "modelFilePath=" + modelFilePath + "\n" )
        self.file_stdout.write ( "sfCIF=" + sfCIF + "\n" )
        self.file_stdout.write ( "repFilePath=" + repFilePath + "\n" )

        #modelFilePath = "/Users/eugene/Projects/jsCoFE/tmp/valrep/1sar.cif"
        #sfCIF = "/Users/eugene/Projects/jsCoFE/tmp/valrep/1sar-sf.cif"

        msg = valrep.getValidationReport ( modelFilePath,sfCIF,repFilePath,self.file_stdout )
        if msg:
            self.putMessage ( "Failed: <b><i>" + msg + "</i></b>" )

        """
        # check solution and register data
        if os.path.isfile(self.getCIFOFName()):

            self.putTitle ( "Deposition Output" )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),self.getMTZOFName(),
                                                 fnames[0],fnames[1],libin )
            if structure:
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( hkl    )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )

        else:
            self.putTitle ( "No Output Generated" )
        """

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Deposition ( "",os.path.basename(__file__) )
    drv.start()
