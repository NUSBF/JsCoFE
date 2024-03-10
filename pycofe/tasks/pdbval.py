##!/usr/bin/python

#
# ============================================================================
#
#    10.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB VALIDATION REPORT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pdbval jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Maria Fando 2017-2024
#
# ============================================================================
#

#  python native imports
import os
# import sys
import uuid
# import json
import time
#from   xml.etree import ElementTree as ET
import shutil

#  ccp4 imports
import gemmi
import pyrvapi
#from   gemmi import cif
from   adding_stats_to_mmcif import run_process

#  application imports
from . import basic
from   pycofe.dtypes import dtype_template, dtype_sequence
from   pycofe.proc   import valrep
from   pycofe.etc    import citations
from   pycofe.auto   import auto

# ============================================================================
# Make PDBVal driver

class PDBVal(basic.TaskDriver):

    def dep_grid  (self):  return "dep_grid"
    # def report_id (self):  return "report_id"

    # redefine name of input script file
    def file_stdin_path(self):  return "deposition.script"

    # ------------------------------------------------------------------------

    def remove_hydr_zero_occ ( self,mmcif_in,mmcif_out ):
        doc   = gemmi.cif.read ( mmcif_in )
        ids   = set()
        table = doc[0].find('_atom_site.', ['type_symbol', 'occupancy', 'id'])
        ndel  = 0
        for i in range(len(table)-1, -1, -1):
            if table[i][0] == 'H' and float(table[i][1]) <= 0.0001:
                ids.add(table[i][2])
                table.remove_row(i)
                ndel += 1
        if ids:
            table = doc[0].find(['_atom_site_anisotrop.id'])
            for i in range(len(table)-1, -1, -1):
                if table[i][0] in ids:
                    table.remove_row(i)
        doc.write_file ( mmcif_out )
        if ndel>0:
            self.putMessage ( str(ndel) +\
                " hydrogens with zero occupancy have been removed from the " +\
                "structure.<br>&nbsp;" )
        else:
            self.putMessage ( 
                "No hydrogens with zero occupancy were found to delete." +\
                "<br>&nbsp;" )
        return
    

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

        del0hydr = self.getParameter(self.task.parameters.DEL0HYDR_CBX)=="True"

        xyzout_cif = istruct.getMMCIFFilePath ( self.inputDir() )

        if not xyzout_cif:
            #  Use zero cycles of Refmac just to produce the final CIF file
            #  this branch is deprecated

            # self.putMessage ( "<h3><i>" + str(header_cnt) +\
            #     ". Prepare Coordinate Deposition File in mmCIF Format</i></h3>" )
            self.putMessage ( "<h3><i>Prepare Coordinate Deposition File in mmCIF Format</i></h3>" )    
            # header_cnt = header_cnt + 1

            self.open_stdin()
            self.write_stdin ( "pdbout format mmcif\n" +\
                               "make hydrogen YES hout YES\n" +\
                               "ncyc 0\n"   +\
                               "labin  FP=" + hkl.dataset.Fmean.value +\
                               " SIGFP="    + hkl.dataset.Fmean.sigma +\
                               " FREE="     + hkl.dataset.FREE + "\n" +\
                               "PNAME Deposition\n" +\
                               "DNAME\n"            +\
                               "Pdbout keep true\n" +\
                               "end\n" )
            self.close_stdin()

            # make command-line parameters for refmac
            xyzin  = istruct.getPDBFilePath ( self.inputDir() )
            xyzout = self.getXYZOFName()   # refmac output cif (refmac wants ".pdb" anyway)
            mtzout = self.getMTZOFName()   # refmac output mtz (used only for map visualisation)
            cmd = [ "hklin" ,hkl.getFilePath(self.inputDir(),dtype_template.file_key["mtz"]),
                    "xyzin" ,xyzin,
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
            self.runApp ( "refmac5",cmd,logType="Main" )

            xyzout_cif = self.getOFName ( ".mmcif" )

            #  This replaces Refmac output with the original ".pdb". Because Refmac
            # was run with zero cycles, all coordinates remain the same, but ".pdb"
            # is currently needed for the visualisation widget
            shutil.copyfile ( xyzin,xyzout  )

            libout = None
            if libin:
                libout = self.getOFName ( ".lib.cif" )
                shutil.copyfile ( libin,libout )

            # create output structure and visualisation widget
            structure = self.registerStructure ( 
                                None,
                                xyzout,
                                None,
                                mtzout,
                                libPath = libout,
                                leadKey = istruct.leadKey,
                                refiner = "refmac" 
                            )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations ( istruct )
                structure.copyLabels       ( istruct )
                structure.copySubtype      ( istruct )
                self.putMessage ( "&nbsp;" )
                self.putStructureWidget   ( "structure_btn_",
                                            "Structure and electron density",
                                            structure )
            self.putMessage ( "&nbsp;" )

        if del0hydr:
            xyzout_cif_1 = self.getOFName ( "_0hydr.mmcif" )
            self.remove_hydr_zero_occ ( xyzout_cif,xyzout_cif_1 )
            xyzout_cif = xyzout_cif_1
            self.success ( True, hidden_results=True )
            return

        # 2. Prepare CIF with structure factors

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

        self.dataSerialNo = 1
        sfCIF = os.path.join ( self.outputDir(), self.task.project + "_" +\
                    dtype_template.makeFileName ( self.job_id,self.dataSerialNo,
                                                  self.getOFName("_sf.cif")) )

        # cmd   = [ "HKLIN",hkl.getFilePath(self.inputDir(),dtype_template.file_key["mtz"]),
        #           "HKLOUT",sfCIF]
        #
        # # Start mtz2various
        # self.runApp ( "mtz2various",cmd,logType="Main" )
        self.unsetLogParser()

        hkl_path = hkl.getHKLFilePath ( self.inputDir() )
        cmd = [ "mtz2cif","--no-comments",hkl_path,sfCIF ]
                # hkl.getFilePath(self.inputDir(),dtype_template.file_key["mtz"]),
        gemmi_path = os.path.join ( os.environ["CCP4"],"bin","gemmi" )
        self.runApp ( gemmi_path,cmd,logType="Main" )


        # 3. Prepare the combined coordinate-sequence CIF

        aimless_xml = None
        aimless_unm = None
        sfCIF_unm   = None
        if hasattr(hkl.aimless_meta,"file_xml") and hkl.aimless_meta.file_xml:
            aimless_xml = os.path.join ( self.inputDir(),hkl.aimless_meta.file_xml )
            aimless_unm = os.path.join ( self.inputDir(),hkl.aimless_meta.file_unm )

            sfCIF_unm = os.path.join (
                    self.outputDir(),
                    self.task.project + "_" +\
                    dtype_template.makeFileName (
                            self.job_id,
                            self.dataSerialNo,
                            self.getOFName("_unmerged_sf.cif")
                    )
                )

            cmd = [ "mtz2cif","--depo","--no-comments",
                    hkl_path,aimless_unm,sfCIF_unm ]
            rc = self.runApp ( gemmi_path,cmd,logType="Main",quitOnError=False )
            if rc.msg:
                self.putMessage (
                    "<hr/><h3>Note:</h3><i>" +\
                    "Inclusion of unmerged scaled data into deposition package "   +\
                    "was not done due to technical issues; see log files for "     +\
                    "details. Depositing unmerged reflection data is recommended " +\
                    "but not mandatory.</i><hr/>" )
                sfCIF_unm = None

        elif hasattr(hkl.aimless_meta,"file") and hkl.aimless_meta.file:
            aimless_xml = os.path.join ( self.inputDir(),hkl.aimless_meta.file )
        else:
            self.file_stdout.write ( "aimless meta NOT found\n" )

        deposition_cif = os.path.join ( self.outputDir(),self.task.project + "_" +\
                    dtype_template.makeFileName ( self.job_id,self.dataSerialNo,
                                                  self.getOFName("_xyz.cif") ) )

        deposition_fasta = self.getOFName ( ".fasta" )
        if len(seq)>0:
            dtype_sequence.writeMultiSeqFile1 ( deposition_fasta,seq,self.inputDir() )
        elif hasattr(self.task.parameters,"SEQUENCE_TA"):
            s = self.getParameter(self.task.parameters.SEQUENCE_TA).strip()
            if s:
                with open(deposition_fasta,"w") as f:
                    f.write ( s )
            else:
                deposition_fasta = None
        else:
            deposition_fasta = None

        worked = False
        if (not hasattr(istruct,"refiner") or istruct.refiner!="buster") and deposition_fasta:
            try:

                self.file_stdout.write ( "\n" +\
                    " =============================================================\n" +\
                    " RUNNING DATA PREPARATION SCRIPT FROM EBI\n" +\
                    "    input_mmcif  = " + xyzout_cif + "\n" +\
                    "    output_mmcif = " + deposition_cif + "\n" +\
                    "    fasta_file   = " + deposition_fasta + "\n" +\
                    "    sf_file      = " + sfCIF + "\n" +\
                    "    xml_file     = " + str(aimless_xml) + "\n"
                )

                self.flush()
                # save this just in case for post-mortem examination
                shutil.copy2 ( xyzout_cif      ,"xyzout.mmcif.sav"     )
                shutil.copy2 ( sfCIF           ,"sfCIF.cif.sav"        )
                shutil.copy2 ( deposition_fasta,"deposition.fasta.sav" )

                worked = run_process ( input_mmcif  = xyzout_cif,
                                       output_mmcif = deposition_cif,
                                       fasta_file   = deposition_fasta,
                                       #sf_file      = sfCIF,
                                       xml_file     = aimless_xml )
            except:
                worked = False

        if not worked:
            if deposition_fasta:
                self.putMessage (
                    "<hr/><h3>Note:</h3>" +\
                    "<i>Coordinate data was not added with sequence data due to "    +\
                    "a technical issue.</i><p>Unmodified coordinate data will be "   +\
                    "used for deposition; provide target sequence(s) at deposition " +\
                    "when asked.<hr/>" )
            else:
                self.putMessage (
                    "<hr/><h3>Note:</h3>" +\
                    "<i>Coordinate data was not added with sequence data because " +\
                    "the latter was not found in project and was not given on "    +\
                    "task's input.</i><p>Provide target sequence(s) at depositon " +\
                    "when asked.<hr/>" )
            self.stderr ( " *** EBI deposition script failed" )
            shutil.copy2 ( xyzout_cif,deposition_cif )
            # self.fail ( "<b><i>Failed to create coordinate model file for deposition</i></b>",
            #             "Failed to create coordinate model file for deposition" )
        #     return

        # check on experimental method category, which may be missed for
        # unclear reasons, then PDB systems are confused
        doc = gemmi.cif.read ( deposition_cif )
        block = doc[0]
        if not block.find_mmcif_category('_exptl.'):
            block.set_mmcif_category ( '_exptl.',
                    dict(entry_id=['XXXX'], method=['X-RAY DIFFRACTION']) )
            self.stdoutln ( " .... experimental method record added" )
            doc.write_file ( deposition_cif )


        self.file_stdout.write (
            " =============================================================\n\n" )

        # 4. Make PDB-formatted file for special use

        deposition_pdb = os.path.join ( self.outputDir(),self.task.project + "_" +\
                    dtype_template.makeFileName ( self.job_id,self.dataSerialNo,
                                                  self.getOFName("_xyz.pdb") ) )
        try:
            doc = gemmi.cif.read ( deposition_cif )
            st  = gemmi.make_structure_from_block ( doc[0] )
            xyzout_pdb = istruct.getPDBFilePath ( self.inputDir() )
            with open(xyzout_pdb,"r") as f:
                lines = f.readlines()
                for i in range(len(lines)):
                    if lines[i].startswith("REMARK"):
                        st.raw_remarks += [lines[i]]
            st.setup_entities()
            st.write_pdb ( deposition_pdb )
        except:
            deposition_pdb = None
            self.file_stdout.write ( " ... conversion to PDB failed" )
            self.file_stderr.write ( " ... conversion to PDB failed" )


        revision.deposition_cif = deposition_cif
        revision.sfCIF          = sfCIF
        revision.sfCIF_unm      = sfCIF_unm
        revision.deposition_pdb = deposition_pdb
        revision.valJobId       = self.job_id

        self.flush()

        line_summary = "pdb report obtained"

        rvrow0 = self.rvrow
        self.rvrow += 2

        error_msg = None

        if not self.have_internet():
            error_msg = "no internet connection"
        elif self.task.private_data:
            error_msg = "private data"
        else:

            try:

                repFilePath = os.path.splitext(self.getXYZOFName())[0] + ".pdf"

                self.file_stdout.write ( "modelFilePath=" + deposition_cif + "\n" )
                self.file_stdout.write ( "sfCIF=" + sfCIF + "\n" )
                self.file_stdout.write ( "repFilePath=" + repFilePath + "\n" )

                self.putWaitMessageLF ( "Validation Report is being acquired from wwPDB, please wait ..." )

                msg  = "."
                ntry = 0
                nattempts = 1
                # while msg and (ntry<25):
                while msg and (ntry<nattempts):
                    self.file_stdout.write ( "\n -- attempt " + str(ntry+1) + "\n" )
                    self.file_stdout.flush ()
                    msg = valrep.getValidationReport ( deposition_cif,sfCIF,repFilePath,
                                                       self.file_stdout,self.jobEndFName )
                    if msg=="22222":
                        msg = "ended by user"
                        break
                    if msg and (ntry<nattempts):
                        if msg=="11111":
                            msg = "exception thrown (job killed?)"
                            self.file_stdout.write ( "\n -- server replied: exception thrown (job killed?)\n" )
                        else:
                            self.file_stdout.write ( "\n -- server replied: " + str(msg) + "\n" )
                        ntry += 1
                        time.sleep ( 10 )

                # remove wait message
                self.putMessage1 ( self.report_page_id(),"",self.rvrow,0,1,1 )

                if msg:
                    error_msg = str(msg)
                elif not os.path.isfile(repFilePath):
                    error_msg = "failed to download"
                else:

                    repFilePath1 = os.path.join ( self.reportDir(),repFilePath )
                    os.rename ( repFilePath,repFilePath1 )

                    self.putMessage (
                        "<object data=\"" + repFilePath +\
                        "\" type=\"application/pdf\" " +\
                        "style=\"border:none;width:100%;height:1000px;\"></object>",
                    )

                    grid_id1 = self.getWidgetId ( self.dep_grid() )
                    self.putMessage  ( "&nbsp;<p><hr/>" )
                    self.putGrid     ( grid_id1 )
                    self.putMessage1 ( grid_id1,"<i>PDB Validation Report in PDF format</i>&nbsp;",0,0 )
                    self.putDownloadButton ( repFilePath1,"download",grid_id1,0,1 )
                    self.putMessage  ( "<hr/>" )

            except:
                # remove wait message
                error_msg = "code exception"

        # self.registerRevision ( revision )

        revision.makeRevDName ( self.job_id,1,self.outputFName )
        revision.register     ( self.outputDataBox )

        pyrvapi.rvapi_add_button ( self.getWidgetId("depfiles"),
                "Prepare deposition files","{function}",
                "window.parent.rvapi_runHotButtonJob(" + self.job_id +\
                ",'TaskPDBDepFiles',{})",
                False,self.report_page_id(),rvrow0,0,1,1 )
        self.putMessage1 ( self.report_page_id(),
                            "<div style='height:6px;'>&nbsp;</div>",rvrow0+1 )
        

        if error_msg:
            self.putMessage1 ( self.report_page_id(),"",self.rvrow,0,1,1 )
            if self.task.private_data:
                self.putMessage  ( 
                    "<b><i>PDB Validation Report was not requested.</i></b><br>" +\
                    "Reason: \"data and results are treated confidential on this server\"<p>" +\
                    "<i><b>Note:</b> despite not obtaining the PDB Validation Report, " +\
                    "you can still prepare deposition files in mmCIF format if needed " +\
                    "for any purposes.</i>"
                )
                line_summary = "pdb report not requested due to data confidentiality"
            else:
                self.putMessage  ( 
                    "<b><i>PDB Validation Report not obtained.</i></b><br>" +\
                    "Reason: \"" + error_msg + "\"<p>" +\
                    "<i><b>Note:</b> despite the failure, you can prepare deposition "   +\
                    "files and use them in PDB deposition session, but be advised that " +\
                    "the analysis of the validation report is an important part of the " +\
                    "PDB deposition process.</i>"
                )
                line_summary = "pdb report not obtained (" + error_msg + ")"

        self.addCitation ( 'pdbval' )

        auto.makeNextTask ( self,{}, self.file_stderr )

        # this will go in the project tree line
        self.generic_parser_summary["deposition"] = {
          "summary_line" : line_summary
        }

        # close execution logs and quit
        self.success ( True, hidden_results=True )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PDBVal ( "",os.path.basename(__file__) )
    drv.start()
