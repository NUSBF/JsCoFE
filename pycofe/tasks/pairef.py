##!/usr/bin/python

#
# ============================================================================
#
#    28.01.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PAIREF EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pairef jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2023
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  application imports
from . import basic

# ============================================================================
# Make PaiRef driver

class PaiRef(basic.TaskDriver):

    # redefine name of input script file
    # def file_stdin_path(self):  return "pairef.script"

    def pairefProject(self):
        return "project"

    def pairefDir(self):
        return "pairef_" + self.pairefProject()


    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When pairef
        # succeeds, this file is created.
        xyzout = self.getXYZOFName()
        if os.path.isfile(xyzout):
            os.remove(xyzout)

        # Prepare pairef input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        # sec1 = self.task.parameters.sec1.contains

        # self.open_stdin  ()
        # self.write_stdin ([
        #     "mtzin  " + hkl.getHKLFilePath(self.inputDir()),
        #     "pdbin  " + istruct.getXYZFilePath(self.inputDir()),
        #     "pdbout " + xyzout,
        #     "colin-fo   /*/*/[" + istruct.FP + "," + istruct.SigFP + "]",
        #     "colin-free /*/*/[" + istruct.FreeR_flag + "]",
        #     "coord",
        #     "cycles " + str(sec1.NCYCLES.value),
        #     "postrefine-u-iso",
        #     "pseudo-regularize",
        #     "refine-regularize-cycles 3",
        #     #"resolution-by-cycle 6.0, 6.0, 3.0",
        #     "resolution-by-cycle 6.0, 3.0",
        #     "radius-scale 4.0"
        #     # "radius-scale 2.5"
        # ])
        # self.close_stdin ()

        xyzin = istruct.getXYZFilePath ( self.inputDir() )
        libin = istruct.getLibFilePath ( self.inputDir() )
        hklin = hkl    .getHKLFilePath ( self.inputDir() )

        hklin_unmerged = None
        fname_unmerged = None
        if hasattr(hkl.aimless_meta,"file_unm") and hkl.aimless_meta.file_unm:
            fname_unmerged = hkl.aimless_meta.file_unm
            hklin_unmerged = os.path.join ( self.inputDir(),hkl.aimless_meta.file_unm )

        cmd = [
            #"-m"     , "pairef",
            "--project",self.pairefProject(),
            "--XYZIN"  , xyzin,
            "--HKLIN"  , hklin,
            "-i"       , str(hkl.getHighResolution(raw=True)+0.15),
            "--refmac"
        ]

        # -r RES_SHELLS         explicit definition of high resolution shells - values
        #                         must be divided using commas without any spaces and
        #                         written in decreasing order, e.g. 2.1,2.0,1.9
        # -n N_SHELLS           number of high resolution shells to be added step by
        #                         step. Using this argument, setting of argument -s is
        #                         required.
        # -s STEP, --step STEP  width of the added high resolution shells (in
        #                         angstrom). Using this argument, setting of argument -n
        #                         is required.
        # -i RES_INIT           initial high-resolution diffraction limit (in
        #                         angstrom) - if it is not necessary, do not use this
        #                         option, the script should find resolution
        #                         automatically in PDB or mmCIF file
        # -f FLAG, --flag FLAG  definition which FreeRflag set will be excluded during
        #                         refinement (set 0 default)
        # -w WEIGHT, --weight WEIGHT
        #                         manual definition of weighting term (only for REFMAC5)
        # --ncyc NCYC           number of refinement cycles that will be performed in
        #                         every resolution step

        if hklin_unmerged:
            cmd += [ "-u",hklin_unmerged ]

        if libin:
            cmd += [ "--LIBIN",libin ]


        htmlReport = "PAIREF_" + self.pairefProject() + ".html"

        # if not os.path.isdir(self.pairefDir()):
        #     os.mkdir ( self.pairefDir() )
        # with (open(os.path.join(self.pairefDir(),htmlReport),"w")) as f:
        #     f.write(
        #         "<!DOCTYPE html>\n<html><head><title>Report is being generated</title>"
        #         + '<meta http-equiv="refresh" content="90" /></head>'
        #         + '<body class="main-page">'
        #         + "<h2><i>Report is being generated ....</i></h2>"
        #         + "</body></html>"
        #     )
        # shutil.rmtree ( self.pairefDir() )

        self.insertTab ( "pairef_report", "PaiRef Report", None, True )
 
        frameId  = self.getWidgetId ( "pairef_report_frame" )
        frameURL = '../' + self.pairefDir() + '/' + htmlReport
        frameCSS = "border:none;position:absolute;top:50px;left:0;width:100%;height:90%;"
        self.putMessage1 (
            "pairef_report",
            '<iframe id="' + frameId + '" src="' + frameURL + '" style="' + frameCSS + '"></iframe>' +\
            '<script>' +\
                'var is_loaded = false;' +\
                '$("#' + frameId + '").on("load",function(){' +\
                    'is_loaded = true;' +\
                '});' +\
                'window.setTimeout(function(){' +\
                    'if (!is_loaded)  {' +\
                        'var iframe = document.getElementById("' + frameId + '");' +\
                        'iframe.src = "' + frameURL + '";' +\
                    '}' +\
                '},2000);' +\
            '</script>',
            0,
        )

        self.flush()

        self.runApp ( "pairef",cmd,logType="Main" )

        # self.putMessage1 (
        #     "pairef_report",
        #     '<iframe id="' + frameId + '" src="' + frameURL + '" style="' + frameCSS + '"></iframe>',
        #     0,
        # )

        # check solution and register data
        have_results = False

        # PAIREF_cutoff.txt
        # 1.90
        # -rw-r--r--  1 eugene  staff     639 26 Jan 09:02 project_R00_1-90A.csv
        # -rw-r--r--  1 eugene  staff   42976 26 Jan 09:02 project_R00_1-90A.log
        # -rw-r--r--  1 eugene  staff  213755 26 Jan 09:02 project_R00_1-90A.mmcif
        # -rw-r--r--  1 eugene  staff  889712 26 Jan 09:02 project_R00_1-90A.mtz
        # -rw-r--r--  1 eugene  staff   61957 26 Jan 09:02 project_R00_1-90A.pdb


        # PAIREF_project.html in pairef_project

        cutoff_res = ""
        with open(os.path.join(self.pairefDir(),"PAIREF_cutoff.txt"),"r") as f:
            lines = f.readlines()
            if len(lines)>0:
                cutoff_res = lines[0].strip()

        fpend = cutoff_res.replace(".","-") + "A.mmcif"

        mmcif_out = None
        for fn in os.listdir(self.pairefDir()):
            fpath = os.path.join ( self.pairefDir(),fn )
            if fn==fname_unmerged:
                os.remove ( fpath )
            else:
                if fn.endswith(fpend):
                    mmcif_out = fpath
                if os.path.islink(fpath):
                    fp1 = os.path.join ( self.pairefDir(),os.readlink(fpath) )
                    os.unlink ( fpath )
                    if os.path.isfile(fp1):
                        shutil.copyfile ( fp1,fpath )

        if mmcif_out:

            panel_id = self.getWidgetId ( self.refmac_report() )
            self.setRefmacLogParser ( panel_id,False,
                                        graphTables=False,makePanel=True )
            file_refmaclog = open ( mmcif_out.replace(".mmcif",".log"),"r" )
            self.log_parser.parse_stream ( file_refmaclog )
            file_refmaclog.close()

            mmcifout = self.getMMCIFOFName()
            pdbout   = self.getXYZOFName  ()
            mtzout   = self.getMTZOFName  ()

            shutil.copyfile ( mmcif_out,mmcifout )
            shutil.copyfile ( mmcif_out.replace(".mmcif",".pdb"),pdbout )
            shutil.copyfile ( mmcif_out.replace(".mmcif",".mtz"),mtzout )

            #verdict_row = self.rvrows
            self.rvrow += 4

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure (
                pdbout,
                istruct.getSubFilePath(self.inputDir()),
                mtzout,
                None,None,
                libin,
                leadKey=1,
                map_labels="FWT,PHWT,DELFWT,PHDELWT",
                copy_files=False,
                refiner="refmac"
            )

            if structure:
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
                structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                structure.addPhasesSubtype   ()
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PaiRef ( "",os.path.basename(__file__) )
    drv.start()
