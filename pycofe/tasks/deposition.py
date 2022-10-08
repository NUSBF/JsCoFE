##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    29.03.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DEPOSITION EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.deposition jobManager jobDir jobId
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
import uuid
#import json
import time
#from   xml.etree import ElementTree as ET
import shutil
import json

#  ccp4 imports
import gemmi
#from   gemmi import cif
from  adding_stats_to_mmcif import run_process

#  application imports
from . import basic
from   pycofe.dtypes import dtype_template, dtype_sequence
from   pycofe.proc   import valrep
from   pycofe.etc    import citations
from   pycofe.auto   import auto

# ============================================================================
# Make Deposition driver

class Deposition(basic.TaskDriver):

    def xml_input (self):  return "inp.xml"
    def dep_grid  (self):  return "dep_grid"
    def report_id (self):  return "report_id"

    # redefine name of input script file
    def file_stdin_path(self):  return "deposition.script"

    # ------------------------------------------------------------------------

    # def remove_hydr_zero_occ ( self,mmcif_in,mmcif_out ):
    #     doc = gemmi.cif.read ( mmcif_in )
    #     table = doc[0].find('_atom_site.', ['type_symbol', 'occupancy'])
    #     for i in range(len(table)-1, -1, -1):
    #         if table[i][0] == 'H' and float(table[i][1]) == 0:
    #             table.remove_row(i)
    #     doc.write_file ( mmcif_out )
    #     return

    def remove_hydr_zero_occ ( self,mmcif_in,mmcif_out ):
        doc = gemmi.cif.read ( mmcif_in )
        ids = set()
        table = doc[0].find('_atom_site.', ['type_symbol', 'occupancy', 'id'])
        for i in range(len(table)-1, -1, -1):
            if table[i][0] == 'H' and float(table[i][1]) == 0:
                ids.add(table[i][2])
                table.remove_row(i)
        if ids:
            table = doc[0].find(['_atom_site_anisotrop.id'])
            for i in range(len(table)-1, -1, -1):
                if table[i][0] in ids:
                    table.remove_row(i)
        doc.write_file ( mmcif_out )
        return

        # cif_block = gemmi.cif.read(mmcif_in)[0]
        # st  = gemmi.make_structure_from_block(cif_block)
        # for model in st:
        #     for chain in model:
        #         for res in chain:
        #             for i in reversed(range(len(res))):
        #                 if res[i].is_hydrogen() and not res[i].occ:
        #                     del res[i]
        # st.make_mmcif_document().write_file ( mmcif_out )
        # return


    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When deposition
        # succeeds, this file is created.
        if os.path.isfile(self.getCIFOFName()):
            os.remove(self.getCIFOFName())

        # Prepare deposition input
        # fetch input data
        # revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        seq      = self.input_data.data.seq
        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )

        del0hydr = self.getParameter(self.task.parameters.DEL0HYDR_CBX)=="True"

        eol_dict  = None
        eol_tasks = []
        try:
            with open(os.path.join(self.inputDir(),"all_tasks.json"),"r") as f:
                eol_dict = json.load(f)
        except:
            pass
        if eol_dict:
            eol_tasks = eol_dict["list"]
            # for i in range(len(eol_tasks)):
            #     eol_tasks[i] = str(eol_tasks[i])


        header_cnt = 1
        xyzout_cif = istruct.getMMCIFFilePath ( self.inputDir() )

        if not xyzout_cif:
            #  Use zero cycles of Refmac just to produce the final CIF file
            #  this branch is deprecated

            self.putMessage ( "<h3><i>" + str(header_cnt) +\
                ". Prepare Coordinate Deposition File in mmCIF Format</i></h3>" )
            header_cnt = header_cnt + 1

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
            xyzin  = istruct.getXYZFilePath ( self.inputDir() )
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

            # make a copy of refmac output file with ".cif" extension
            #if os.path.isfile(xyzout) and os.path.getsize(xyzout)>10:
            #    xyzout_cif = self.getOFName ( "_tmp.cif" )
            #    shutil.copyfile ( xyzout,xyzout_cif )
            #else:
            #    xyzout_cif = self.getOFName ( ".mmcif" )

            xyzout_cif = self.getOFName ( ".mmcif" )

            # prepare files for the structure visualisation widget
            #mapout   = self.getMapOFName()
            #dmapout  = self.getDMapOFName()
            #mapout0  = istruct.getMapFilePath  ( self.inputDir() )
            #dmapout0 = istruct.getDMapFilePath ( self.inputDir() )

            #if not mapout0 or not dmapout0:
            #    # calculate maps for UglyMol using final mtz from temporary location
            #    fnames  = self.calcCCP4Maps ( mtzout,self.outputFName )
            #    mapout  = fnames[0]
            #    dmapout = fnames[1]

            #  This replaces Refmac output with the original ".pdb". Because Refmac
            # was run with zero cycles, all coordinates remain the same, but ".pdb"
            # is currently needed for the visualisation widget
            shutil.copyfile ( xyzin,xyzout  )
            #shutil.copyfile ( istruct.getMTZFilePath (self.inputDir()), mtzout  )
            #if mapout0:
            #    shutil.copyfile ( mapout0 ,mapout  )
            #if dmapout0:
            #    shutil.copyfile ( dmapout0,dmapout )

            libout = None
            if libin:
                libout = self.getOFName ( ".lib.cif" )
                shutil.copyfile ( libin,libout )

            # create output structure and visualisation widget
            structure = self.registerStructure ( xyzout,None,mtzout,None,None,libout,
                                                 leadKey=istruct.leadKey,
                                                 refiner="refmac" )
            if structure:
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

        #sfCIF = os.path.join ( self.outputDir(),self.getOFName("_sf.cif") )
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
                shutil.copy2 ( xyzout_cif,xyzout_cif + ".sav" )
                shutil.copy2 ( sfCIF,sfCIF + ".sav" )

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
                    "<i>Coordinate model was not added with sequence data due to " +\
                    "a technical issue.<br>Provide target sequence(s) at depositon "  +\
                    "when asked.</i>" +\
                    "<hr/>" )
            else:
                self.putMessage (
                    "<hr/><h3>Note:</h3>" +\
                    "<i>Coordinate model was not added with sequence data because " +\
                    "it was not found in project and was not given on input.<br>" +\
                    "Provide target sequence(s) at depositon when asked.</i>" +\
                    "<hr/>" )
            self.stderr ( " *** EBI deposition script failed" )
            shutil.copy2 ( xyzout_cif,deposition_cif )
            # self.fail ( "<b><i>Failed to create coordinate model file for deposition</i></b>",
            #             "Failed to create coordinate model file for deposition" )
        #     return

        self.file_stdout.write (
            " =============================================================\n\n" )

        # 4. Put download widgets

        self.putMessage ( "<h3><i>" + str(header_cnt) + ". PDB Deposition</i></h3>" )
        header_cnt = header_cnt + 1

        self.putMessage ( "<b>a) Download the following 2 files in mmCIF format:<br><hr/>" )

        grid_id = self.getWidgetId ( self.dep_grid() )
        self.putGrid ( grid_id )
        self.putMessage1 ( grid_id,
            "&nbsp;&nbsp;&nbsp;&nbsp;<i>1. Final atomic coordinates:</i>&nbsp;",0,0 )
        self.putDownloadButton ( deposition_cif,"download",grid_id,0,1 )
        if sfCIF_unm:
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;<i>2. Reflection data</i>" ,1,0 )
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "<b><u>either</u></b> <i>merged and unmerged:</i>",2,0 )
            self.putDownloadButton ( sfCIF_unm,"download",grid_id,2,1 )
            self.putMessage1 ( grid_id,
                "<i style=\"font-size:85%\">(recommended)</i>",2,2 )
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "<b><u>or</u></b> <i>merged only:</i>",3,0 )
            self.putDownloadButton ( sfCIF,"download",grid_id,3,1 )
            self.putMessage1 ( grid_id,
                "<i style=\"font-size:85%\">(only if merged+unmerged causes " +\
                "problems at deposition)</i>",
                3,2 )
        else:
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;<i>2. Reflection data:</i>" ,1,0 )
            self.putDownloadButton ( sfCIF,"download",grid_id,1,1 )

        self.putMessage ( "<hr/><br><b>" +\
            "b) Start new deposition session at " +\
            "<a href='https://deposit.wwpdb.org' style='color:blue;' target='_blank'>wwPDB " +\
            "Deposition Site</a></b> <i>(link opens in new tab/window)</i><p><b>" +\
            "c) Follow instructions in the wwPDB deposition site and upload " +\
            "the files downloaded when prompted.</b>"
        )

        line_summary = ["package prepared","pdb report not obtained"]


        # 5. Obtain validation report from the PDB

        self.putMessage ( "&nbsp;<p><h3><i>" + str(header_cnt) +
                          ". Validation Report</i></h3>" )
        self.flush()

        if not self.have_internet():
            self.putMessage ( "<b><i>No internet connection.</i></b>" )

        else:

            try:

                repFilePath = os.path.splitext(self.getXYZOFName())[0] + ".pdf"

                self.file_stdout.write ( "modelFilePath=" + deposition_cif + "\n" )
                self.file_stdout.write ( "sfCIF=" + sfCIF + "\n" )
                self.file_stdout.write ( "repFilePath=" + repFilePath + "\n" )

                #modelFilePath = "/Users/eugene/Projects/jsCoFE/tmp/valrep/1sar.cif"
                #sfCIF = "/Users/eugene/Projects/jsCoFE/tmp/valrep/1sar-sf.cif"

                self.putWaitMessageLF ( "Validation Report is being acquired from wwPDB, please wait ..." )

                msg  = "."
                ntry = 0
                nattempts = 1
                # while msg and (ntry<25):
                while msg and (ntry<nattempts):
                    self.file_stdout.write ( "\n -- attempt " + str(ntry+1) + "\n" )
                    self.file_stdout.flush ()
                    msg = valrep.getValidationReport ( deposition_cif,sfCIF,repFilePath,self.file_stdout )
                    if msg and (ntry<nattempts):
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

                    line_summary[1] = "pdb report obtained"

                else:
                    self.putMessage ( "&nbsp;<p><b><i> -- failed to download</i></b>" )

            except:
                self.putMessage ( "&nbsp;<p><b><i> -- errors in obtaining the PDB Validation Report</i></b>" )

        self._add_citations ( citations.citation_list )
        if self.citation_list:
            self.putTitle ( "References" )
            html = citations.makeSummaryCitationsHTML ( self.citation_list,eol_tasks )
            self.putMessage ( html )
        citations.citation_list = []

        auto.makeNextTask ( self,{}, self.file_stderr )

        # this will go in the project tree line
        self.generic_parser_summary["deposition"] = {
          "summary_line" : ", ".join(line_summary) + " "
        }

        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Deposition ( "",os.path.basename(__file__) )
    drv.start()
