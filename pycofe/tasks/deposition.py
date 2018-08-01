##!/usr/bin/python

#
# ============================================================================
#
#    30.07.18   <--  Date of Last Modification.
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
import json
import time
from   xml.etree import ElementTree as ET
import shutil

#  ccp4 imports
import gemmi
from   gemmi import cif

from ccp4mg import mmdb2


#  application imports
import basic
from   proc import valrep,asucomp


# ============================================================================
# Make Deposition driver

class Deposition(basic.TaskDriver):

    def xml_input (self):  return "inp.xml"
    def dep_grid  (self):  return "dep_grid"
    def report_id (self):  return "report_id"

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
        xyzout = self.getXYZOFName()
        mtzout = self.getMTZOFName()
        cmd = [ "hklin" ,hkl.getFilePath(self.inputDir()),
                "xyzin" ,istruct.getXYZFilePath(self.inputDir()),
                "hklout",mtzout,
                "xyzout",xyzout,
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

        xyzout_cif = self.getOFName ( ".cif" )
        shutil.copyfile ( xyzout,xyzout_cif  )

        mapout  = self.getMapOFName()
        dmapout = self.getDMapOFName()

        shutil.copyfile ( istruct.getXYZFilePath (self.inputDir()), xyzout  )
        #shutil.copyfile ( istruct.getMTZFilePath (self.inputDir()), mtzout  )
        shutil.copyfile ( istruct.getMapFilePath (self.inputDir()), mapout  )
        shutil.copyfile ( istruct.getDMapFilePath(self.inputDir()), dmapout )

        libout = None
        if libin:
            libout = self.getOFName ( ".lib.cif" )
            shutil.copyfile ( libin,libout )

        structure = self.registerStructure ( xyzout,mtzout,mapout,dmapout,libout )
        if structure:
            structure.copyAssociations ( istruct )
            structure.copyLabels       ( istruct )
            structure.copySubtype      ( istruct )
            self.putMessage ( "&nbsp;" )
            self.putStructureWidget   ( "structure_btn_",
                                        "Structure and electron density",
                                        structure )

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
        e2.text = xyzout_cif
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

        if sys.platform.startswith("win"):
            self.runApp ( "pdbdeposition.bat",["-x",self.xml_input()] )
        else:
            self.runApp ( "pdbdeposition",["-x",self.xml_input()] )

        #corrFilePath = os.path.splitext(self.getXYZOFName())[0] + "_corr.cif"
        #os.rename ( os.path.splitext(self.getXYZOFName())[0] + "_out.cif",
        #            corrFilePath )


        # 3. Correct CIF file after Refmac

        corrFilePath  = os.path.splitext(self.getXYZOFName())[0] + "_out.cif"
        modelFilePath = os.path.splitext(self.getXYZOFName())[0] + ".cif"
        fin  = open ( corrFilePath ,"r" )
        fout = open ( modelFilePath,"wt" )
        """
        for line in fin:
            fout.write ( line )
        """

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
            """
            elif line.startswith("_entity_poly.entity_id"):
                fout.write ( "loop_\n" +\
                             "_entity_poly.entity_id\n" +\
                             "_entity_poly.pdbx_seq_one_letter_code_can\n" +\
                             "_entity_poly.pdbx_seq_one_letter_code\n" )
                for i in range(len(seqlist)):
                    fout.write ( str(i+1) + " " + seqids[i] + " " )
            """
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

        self.putWaitMessageLF ( "Validation Report is being acquired from wwPDB, please wait ..." )

        msg  = "."
        ntry = 0
        while msg and (ntry<25):
            self.file_stdout.write ( "\n -- attempt " + str(ntry+1) + "\n" )
            self.file_stdout.flush ()
            msg = valrep.getValidationReport ( modelFilePath,sfCIF,repFilePath,self.file_stdout )
            if msg and (ntry<25):
                self.file_stdout.write ( "\n -- server replied: " + msg + "\n" )
                ntry += 1
                time.sleep ( 10 )

        # remove wait message
        self.putMessage1 ( self.report_page_id(),"",self.rvrow,0,1,1 )

        if msg:
            self.putMessage ( "Failed: <b><i>" + str(msg) + "</i></b>" )

        elif os.path.isfile(repFilePath):

            repFilePath1 = os.path.join ( self.reportDir(),repFilePath )
            os.rename ( repFilePath,repFilePath1 )

            self.putSection ( self.report_id(),"wwPDB Validation Report",False )
            self.putMessage1 ( self.report_id(),
                    "<object data=\"" + repFilePath +\
                    "\" type=\"application/pdf\" " +\
                    "style=\"border:none;width:100%;height:1000px;\"></object>",
                    0,0,1,1 )

            grid_id1 = self.getWidgetId ( self.dep_grid() )
            self.putMessage ( "&nbsp;<p><hr/>" )
            self.putGrid ( grid_id1 )
            self.putMessage1 ( grid_id1,"<i>PDB Validation Report in PDF format</i>&nbsp;",0,0 )
            self.putDownloadButton ( repFilePath1,"download",grid_id1,0,1 )
            self.putMessage ( "<hr/>" )

        else:
            self.putMessage ( "&nbsp;<p><b><i> -- failed to download</i></b>" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Deposition ( "",os.path.basename(__file__) )
    drv.start()
