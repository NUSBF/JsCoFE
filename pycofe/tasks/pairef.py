##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Maria Fando, Andrey Lebedev 2023-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from . import basic
from   pycofe.dtypes import dtype_template
from   pycofe.proc   import import_filetype, import_merged

# ============================================================================
# Make PaiRef driver

class PaiRef(basic.TaskDriver):

    # redefine name of input script file
    # def file_stdin_path(self):  return "pairef.script"

    def pairefProject(self):
        return "project"

    def pairefDir(self):
        return "pairef_" + self.pairefProject()

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    def cutResolution ( self,hkl,cutoff_res ):

        # make new file name
        outputMTZFName = self.getOFName ( "_" + hkl.new_spg.replace(" ","") +\
                      "_" + hkl.getFileName(dtype_template.file_key["mtz"]),-1 )

        # Just in case (of repeated run) remove the output mtz file. When zanuda
        # succeeds, this file is created.
        if os.path.isfile(outputMTZFName):
            os.remove(outputMTZFName)

        # make command-line parameters
        cmd = [ "hklin1",hkl.getHKLFilePath(self.inputDir()),
                "hklout",outputMTZFName ]

        # prepare stdin
        self.open_stdin  ()
        self.write_stdin ([
          "LABIN FILE_NUMBER 1 ALL",
          "RESOLUTION FILE_NUMBER 1 " + cutoff_res + " " + hkl.getLowResolution(raw=False)
        ])
        self.close_stdin ()

        # Prepare report parser
        self.setGenericLogParser ( "chres_report",False )

        # run reindex
        self.runApp ( "cad",cmd,logType="Main" )
        self.unsetLogParser()

        self.removeCitation ( "cad" )
        self.addCitation    ( "cad-primary" )

        new_hkl = []

        if os.path.isfile(outputMTZFName):

            # make list of files to import
            self.resetFileImport()
            self.addFileImport ( outputMTZFName,import_filetype.ftype_MTZMerged() )

            new_hkl = import_merged.run ( self,"Reflection dataset",importPhases="" )

            if len(new_hkl)>0:

                for i in range(len(new_hkl)):
                    new_hkl[i].new_spg      = hkl.new_spg.replace(" ","")
                    # Do not overwrite dataStats; they should be correct!
                    # new_hkl[i].dataStats    = hkl.dataStats
                    new_hkl[i].aimless_meta = hkl.aimless_meta

        return new_hkl


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

        xyzin   = istruct.getPDBFilePath ( self.inputDir() )
        libin   = istruct.getLibFilePath ( self.inputDir() )
        hklin   = hkl    .getHKLFilePath ( self.inputDir() )

        # xyzin1  = "__input.pdb"
        # fout    = open (xyzin1,"w" )
        # with open(xyzin,"r") as fin:
        #     for line in fin:
        #         if not line.startswith("REMARK"):
        #             fout.write ( line )
        # fout.close()
        # xyzin = xyzin1

        hklin_unmerged = None
        fname_unmerged = None
        if hasattr(hkl.aimless_meta,"file_unm") and hkl.aimless_meta.file_unm:
            fname_unmerged = hkl.aimless_meta.file_unm
            hklin_unmerged = os.path.join ( self.inputDir(),hkl.aimless_meta.file_unm )

        sec1    = self.task.parameters.sec1.contains
        sec2    = self.task.parameters.sec2.contains


        hires   = round ( hkl.getHighResolution(raw=True),2 )
        resList = []
        mode    = self.getParameter ( sec1.MODE_SEL )
        if mode=="eqd":
            nshells = self.getParameter ( sec1.NSHELLS )
            if nshells:
                nshells = int(nshells)
            else:
                nshells = 20
            rstep = self.getParameter ( sec1.RSTEP )
            if rstep:
                rstep = float(rstep)
            else:
                rstep = 0.05
            for i in range(nshells+1):
                resList.append ( str(round(hires+i*rstep,2)) )
            resList.sort ( reverse=True )
            resList[len(resList)-1] = hkl.getHighResolution(raw=False)
        else:
            s       = self.getParameter ( sec1.RLIST )
            resList = [float(x.strip()) for x in s.split(',')]
            hires0  = hkl.getHighResolution(raw=True)
            found   = False
            for r in resList:
                if abs(r-hires0)<0.01:
                    found = True
            if not found:
                resList.append ( hires0 )
            resList.sort ( reverse=True )
            for i in range(len(resList)):
                resList[i] = str(resList[i])
        

        cmd = [
            "-m"         , "pairef",
            "--ccp4cloud",
            "--project"  , self.pairefProject(),
            "--XYZIN"    , xyzin,
            "--HKLIN"    , hklin,
            "-r"         , ",".join(resList[1:]),
            "-i"         , str(resList[0])
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

        if str(sec2.KEYWORDS.value) != '':
           keywords_Pairef= sec2.KEYWORDS.value.split()
           for keyword in keywords_Pairef:
            # cmd += [ str(sec2.KEYWORDS.value) ]
            cmd += [ str(keyword) ]
        

        if hklin_unmerged:
            cmd += [ "-u",hklin_unmerged ]

        if libin:
            cmd += [ "--LIBIN",libin ]


        if str(sec2.WAUTO_YES.value) == 'yes':
            pass
        else:
            cmd += [ '--weight', str(sec2.WAUTO_VAL.value) ]

        
        if self.task.parameters.sec2.contains.CMP_CBX.value:
            cmd += ["--complete"]

        prencyc = self.getParameter ( sec1.PRENCYC ).strip()
        if prencyc:
            prencyc = int(prencyc)
        else:
            prencyc = 0
        if prencyc>0:
            cmd += [ "--prerefinement-ncyc", str(prencyc) ]
        
        ncyc = self.getParameter ( sec1.NCYC ).strip()
        if ncyc:
            ncyc = int(ncyc)
        else:
            ncyc = 20
        if ncyc>0:
            cmd += [ "--ncyc",str(ncyc) ]

        cmd += ["--refmac"]

        reuse_refmac_parameters = False

        if reuse_refmac_parameters:
            ref_params = ""
            refkeys    = istruct.get_refkeys_parameters ( "TaskRefmac" )
            if refkeys:
                self.putMessage ( "<i>Using refinement parameters from job " +\
                                str(refkeys.id) + "</i><br>&nbsp;" )
                params = refkeys.keywords
                if len(params)>0:
                    ref_params = "\n".join(params)

            if str(sec2.KEYWORDS_REF.value) != "":
                ref_params += "\n#----  parameters from pairef interface ----\n" +\
                            str(sec2.KEYWORDS_REF.value)
                
            if ref_params:
                with open('keywords.txt', 'w') as f:
                    f.write ( ref_params )
                    f.close
                if os.path.isfile('keywords.txt') == True:
                    # os.path.join(str(self.inputDir))
                    cmd += ["--comfile", "keywords.txt"]
                    self.stdoutln ( 
                        "\n" +\
                        "\n----------------------------------------------------------\n" +\
                        "  Refmac parameters to be used:" +\
                        "\n----------------------------------------------------------\n" +\
                        ref_params +\
                        "\n----------------------------------------------------------"
                    )
                else:
                    self.rvrow = rvrow0
                    self.putMessage ( '<i style="color:red"> Refmac kaywords were ' +\
                                      'NOT passed due to errors.</i>' )
                    self.stderrln ( "\n ***** Refmac parameters were not written in file\n" ) 
        else:
            if str(sec2.KEYWORDS_REF.value) != '':
                with open('keywords.txt', 'w') as f:
                    f.write(str(sec2.KEYWORDS_REF.value))
                    f.close
                if os.path.isfile('keywords.txt') == True:
                    # os.path.join(str(self.inputDir))
                    cmd += ["--comfile", "keywords.txt"]
                else:
                    self.rvrow = rvrow0
                    self.putMessage ( '<i style="color:red"> Refmac kaywords were NOT passed due to errors.</i>' )


        htmlReport = "PAIREF_" + self.pairefProject() + ".html"

        tabId = self.getWidgetId ( "pairef_report" )
        self.insertTab ( tabId, "PaiRef Report", None, True )
 
        frameId  = self.getWidgetId ( "pairef_report_frame" )
        frameURL = '../' + self.pairefDir() + '/' + htmlReport
        frameCSS = "border:none;position:absolute;top:50px;left:0;width:100%;height:90%;"
        self.putMessage1 (
            tabId,
            '<iframe id="' + frameId + '" src="' + frameURL + '" style="' + frameCSS + '"></iframe>' +\
            '<script>' +\
                'var iframe    = document.getElementById("' + frameId + '");' +\
                'var is_loaded = false;' +\
                'iframe.src    = "data:text/html;charset=utf-8,<h2>Please wait &mldr;</h2>";' +\
                '$("#' + frameId + '").on("load",function(){' +\
                    'var response = $("#' + frameId + '").contents().find("body").html();' +\
                    'if (response) is_loaded  = (response.indexOf("FILE NOT FOUND")<0);' +\
                '});' +\
                'function _check_load()  {' +\
                    'window.setTimeout(function(){' +\
                        'if (!is_loaded)  {' +\
                            'iframe.src = "' + frameURL + '";' +\
                            '_check_load();' +\
                        '}' +\
                    '},2000);' +\
                '}' +\
                '_check_load();' +\
            '</script>',
            0,
        )

        self.flush()

        # if str(os.name) == "nt":
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )
        self.addCitations ( ["refmac5"] )

        # check solution and register data
        have_results = False

        # PAIREF_cutoff.txt
        # 1.90
        # -rw-r--r--  1 eugene  staff     639 26 Jan 09:02 project_R00_1-90A.csv
        # -rw-r--r--  1 eugene  staff   42976 26 Jan 09:02 project_R00_1-90A.log
        # -rw-r--r--  1 eugene  staff  213755 26 Jan 09:02 project_R00_1-90A.mmcif
        # -rw-r--r--  1 eugene  staff  889712 26 Jan 09:02 project_R00_1-90A.mtz
        # -rw-r--r--  1 eugene  staff   61957 26 Jan 09:02 project_R00_1-90A.pdb
        #
        #  PAIREF_out.log

        with open(os.path.join(self.pairefDir(),"PAIREF_out.log"),"r") as f:
            self.stdoutln ( f.read() )

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

            self.putMessage ( "<h3>Suggested resolution cut-off: " + cutoff_res + "&Aring;</h3>" )

            hkl0  = hkl
            hires = hkl.getHighResolution(raw=True)
            summary_line = "Res<sub>cutoff</sub>=" + cutoff_res
            if (float(cutoff_res)-hires)<0.01:
                self.putMessage ( "<i>The recommended cut-off is equal to the current high " +\
                                  "resolution limit. Full-resolution dataset will be used in " +\
                                  "subsequent tasks.</i>" )
            else:
                # cut resolution in the data set and replace it in the revision later
                rvrow0  = self.rvrow
                self.putMessage ( "<i>Reflection dataset is cut to resolution of " + cutoff_res +\
                                    "&Aring; and will be used in subsequent tasks.</i>" )
                new_hkl = self.cutResolution ( hkl,cutoff_res )
                if len(new_hkl)>0:
                    hkl0 = new_hkl[0]
                else:
                    self.rvrow = rvrow0
                    self.putMessage ( '<i style="color:maroon">Reflection data set was not cut ' +\
                                      'to the recommended resolution due to errors.</i>' )
                    summary_line += " (not cut)"
                    self.rvrow += 2

            self.generic_parser_summary["pairef"] = {
                "summary_line" : summary_line
            }

            self.putMessage ( "<h3>Refinement at " + cutoff_res + "&Aring; resolution cutoff</h3>" )

            panel_id = self.getWidgetId ( self.refmac_report() )
            self.setRefmacLogParser ( panel_id,False,graphTables=False,makePanel=True )
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
                None,
                pdbout,
                istruct.getSubFilePath(self.inputDir()),
                mtzout,
                libPath    = libin,
                leadKey    = 1,
                map_labels = "FWT,PHWT,DELFWT,PHDELWT",
                copy_files = False,
                refiner    = "refmac"
            )

            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations   ( istruct        )
                structure.addDataAssociation ( hkl0.dataId    )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( None if str(hkl0.useHKLSet) in ["Fpm","TI"] else hkl0 )
                structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                structure.addPhasesSubtype   ()
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setStructureData  ( structure )
                revision.setReflectionData ( hkl0      )
                self.registerRevision      ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Output Generated" )
            self.generic_parser_summary["pairef"] = {
                "summary_line" : "failed"
            }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PaiRef ( "",os.path.basename(__file__) )
    drv.start()
