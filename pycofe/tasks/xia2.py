#!/usr/bin/python

#
# ============================================================================
#
#    08.11.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XIA2 EXECUTABLE MODULE (OPTIONAL CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python pycofe.tasks.xia2.py jobManager jobDir jobId
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
import json
import re
import math

#  ccp4 imports
import pyrvapi

#  application imports
from . import basic
from pycofe.varut  import signal
from pycofe.dtypes import dtype_template
from pycofe.proc   import import_filetype, import_merged, import_unmerged
try:
    from pycofe.varut import messagebox
except:
    messagebox = None


# ============================================================================
# Make Xia2 driver

class Xia2(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    def run(self):
        # Prepare xia2 job

        nSubJobs = "4"
        if self.jobManager in ["SGE","SCRIPT","SLURM"]:
            nSubJobs = self.getCommandLineParameter ( "ncores" )
            if not nSubJobs:
                nSubJobs = "1"

        have_xds   = ("XDS_home"   in os.environ)
        have_durin = ("Xia2_durin" in os.environ)

        # fetch input data

        imageMetadata = None
        with open(os.path.join(self.inputDir(),"__imageDirMeta.json")) as f:
            imageMetadata = json.load(f)

        if not imageMetadata:
            self.fail ( "<h3>Image Metadata Errors.</h3>" +\
                    "Image metadata could not be passed to the task.",
                    "Image metadata errors." )
            return

        imageDirMeta = imageMetadata["imageDirMeta"]
        sec1         = self.task.parameters.sec1.contains
        sec2         = self.task.parameters.sec2.contains

        projectName  = self.getParameter ( sec1.PROJECT     ).replace(".","_").replace(" ","_");
        crystalName  = self.getParameter ( sec1.CRYSTAL     )
        hatom        = self.getParameter ( sec1.HATOM       )
        pipeline     = self.getParameter ( sec2.PIPELINE    )
        small_mol    = self.getParameter ( sec2.SMALL_MOLECULE ).lower()
        space_group  = self.getParameter ( sec2.SPACE_GROUP )
        unit_cell    = self.getParameter ( sec2.UNIT_CELL   )
        d_min        = self.getParameter ( sec2.D_MIN       )
        cc_half      = self.getParameter ( sec2.CC_HALF     )
        misigma      = self.getParameter ( sec2.MISIGMA     )
        isigma       = self.getParameter ( sec2.ISIGMA      )

        space_group  = "".join(space_group.split())
        unit_cell    = ",".join(unit_cell.replace(",", " ").split())

        cmd = [ "project="  + projectName,
                "crystal="  + crystalName,
                "pipeline=" + pipeline,
                "small_molecule=" + small_mol ]

        if (not have_xds) and pipeline.startswith("3d"):
            self.fail ( "<h3>XDS Software is not installed</h3>" +\
                    "Chosen pipeline protocol requires XDS Software, " +\
                    "installation of which was not found.",
                    "Image metadata errors." )
            return

        if sys.platform.startswith("win"):
            cmd.append ( "nproc=1" )
        else:
            cmd.append ( "nproc=" + nSubJobs )

        if have_durin and hasattr(sec2,"PLUGIN"):
            if self.getParameter(sec2.PLUGIN)!="none":
                cmd.append ( "plugin=" + os.environ["Xia2_durin"] )

        if hatom      :  cmd.append ( "atom="          + hatom.upper()      )
        if space_group:  cmd.append ( "space_group=\"" + space_group + "\"" )
        if unit_cell  :  cmd.append ( "unit_cell=\""   + unit_cell   + "\"" )
        if d_min      :  cmd.append ( "d_min="         + d_min   )
        if cc_half    :  cmd.append ( "cc_half="       + cc_half )
        if misigma    :  cmd.append ( "misigma="       + misigma )
        if isigma     :  cmd.append ( "isigma="        + isigma  )

        if self.task.datatype=="images":
            for i in range(len(imageDirMeta)):
                if imageDirMeta[i]["path"]:
                    sectors = imageDirMeta[i]["sectors"]
                    for j in range(len(sectors)):
                        ranges_sel = sectors[j]["ranges_sel"]
                        dirpath    = os.path.join ( imageDirMeta[i]["path"],sectors[j]["name"] )
                        for k in range(len(ranges_sel)):
                            cmd.append ( "image=" + dirpath + ":" + str(ranges_sel[k][0]) +\
                                                              ":" + str(ranges_sel[k][1]) )
        elif self.task.hdf5_range:
            cmd.append ( "image=" + imageDirMeta[0]["path"] + ":" + self.task.hdf5_range )
        else:
            cmd.append ( "image=" + imageDirMeta[0]["path"] )

        # Run xia2

        environ = os.environ.copy()
        if have_xds:
            #environ["HOME"] = os.path.join ( os.path.abspath(os.getcwd()),self.xds_dir() )
            environ["PATH"] = os.environ["XDS_home"] + ":" + os.environ["PATH"]

        # put progress spinner
        rvrow0 = self.rvrow
        self.putWaitMessageLF ( "Image processing in progress ..." )

        rc = self.runApp ( "xia2",cmd,logType="Main",quitOnError=False,env=environ )

        # remove progress spinner
        self.putMessage1 ( self.report_page_id()," ",rvrow0 )


        if pipeline=="2d":
            self.addCitations ( ["dials","mosflm","aimless"] )
        elif pipeline.startswith("3d"):
            self.addCitations ( ["xds"] )
        else:
            self.addCitations ( ["dials","aimless"] )

        # Check for MTZ files left by Xia2 and convert them to type structure
        resDir     = "DataFiles"
        file_names = []
        if os.path.isdir(resDir):
            file_names = [fn for fn in os.listdir(resDir)
                                if any(fn.endswith(ext) for ext in [".mtz"])]
        fnPrefix        = projectName + "_" + crystalName
        mtzMergedName   = fnPrefix + "_free.mtz"
        mtzUnmergedName = fnPrefix + "_scaled_unmerged.mtz"

        nsweeps = len(file_names)  # initial counter value

        datasetName = "NATIVE"
        if hatom:
            datasetName = "SAD"

        self.resetFileImport()

        if mtzMergedName in file_names:
            self.putTitle ( "Merged Reflection Dataset" )
            newHKLFPath = os.path.join ( resDir,self.getOFName("_merged.mtz",-1) )
            os.rename ( os.path.join(resDir,mtzMergedName),newHKLFPath )
            self.addFileImport ( newHKLFPath,import_filetype.ftype_MTZMerged() )
            #self.files_all = [ newHKLFPath ]
            hkl_imported = import_merged.run ( self,"Merged Reflection Dataset",
                                                    importPhases="" )

            scaleDir = os.path.join(crystalName,"scale")
            aimless_xml_names = [fn for fn in os.listdir(scaleDir)
                                if any(fn.endswith(ext) for ext in ["_aimless.xml"])]
            if len(hkl_imported)>0 and len(aimless_xml_names)>0:
                aimless_xml  = max(aimless_xml_names)
                aimless_meta = {
                    "jobId"    : self.job_id,
                    "file_xml" : dtype_template.makeFileName ( self.job_id,
                                                 self.dataSerialNo,aimless_xml ),
                    "file_unm" : None
                }
                os.rename ( os.path.join(scaleDir,aimless_xml),
                            os.path.join(self.outputDir(),aimless_meta["file_xml"]) )
                for i in range(len(hkl_imported)):
                    hkl_imported[i].aimless_meta = aimless_meta
                    hkl_imported[i].ha_type      = hatom
                    self.putMessage ( "<b>Assigned name:</b>&nbsp;" + hkl_imported[i].dname  )

            nsweeps -= 1

        if mtzUnmergedName in file_names:
            self.putTitle   ( "Unmerged Scaled Reflection Dataset" )
            newHKLFPath = os.path.join ( resDir,self.getOFName("_unmerged_scaled.mtz",-1) )
            os.rename ( os.path.join(resDir,mtzUnmergedName),newHKLFPath )
            self.addFileImport ( newHKLFPath,import_filetype.ftype_MTZIntegrated() )
            unmerged_imported = import_unmerged.run ( self,"Unmerged Scaled Reflection Dataset" )
            for i in range(len(unmerged_imported)):
                unmerged_imported[i].ha_type = hatom
                self.putMessage ( "<b>Assigned name:</b>&nbsp;" + unmerged_imported[i].dname  )
            nsweeps -= 1

        if nsweeps>0:

            title_made = False
            for n in range(nsweeps):
                sweepId = "SWEEP" + str(n+1)
                mtzSweepName = "_".join([fnPrefix,datasetName,sweepId,"INTEGRATE.mtz"])
                if mtzSweepName in file_names:

                    # make section title if nod done already:
                    if not title_made:
                        if nsweeps==1:
                            self.putTitle   ( "Unmerged Unscaled Reflection Dataset" )
                        else:
                            self.putTitle   ( "Unmerged Unscaled Reflection Datasets" )
                        title_made = True

                    # generate files for reciprocal space viewer

                    self.unsetLogParser()

                    rlp_json   = ""
                    rlp_pickle = ""
                    refDir = os.path.join ( crystalName,datasetName,sweepId,"refine" )
                    ind_list = sorted(set(["%3s" %f.split("_")[0] for f in os.listdir(refDir)]), reverse=True)
                    for ind in ind_list:
                        for e1, e2 in ("_refined.expt","_refined.refl"),("_refined_experiments.json","_refined.pickle"):
                            f1 = os.path.join(refDir, ind.strip() + e1)
                            f2 = os.path.join(refDir, ind.strip() + e2)
                            if os.path.isfile(f1) and os.path.isfile(f2):
                                rlp_json   = f1
                                rlp_pickle = f2
                                break

                    if rlp_json and rlp_pickle:

                        self.file_stdin = None
                        if sys.platform.startswith("win"):
                            self.runApp ( "dials.export.bat",["format=json","d_min=8",rlp_json,rlp_pickle],
                                          logType="Service" )
                        else:
                            self.runApp ( "dials.export",["format=json","d_min=8",rlp_json,rlp_pickle],
                                          logType="Service" )

                        rlpFileName = "rlp.json"
                        rlpFilePath = os.path.join ( self.outputDir(),sweepId +"_"+ rlpFileName )
                        if os.path.isfile(rlpFileName):
                            os.rename ( rlpFileName,rlpFilePath )
                        else:
                            rlpFilePath = None

                        ind_prefix = rlp_json.partition("_")[0] + "_"
                        d_min = d_min_for_rs_mapper(self, refDir, ind_prefix)

                        #  grid size and resolution are chosen such as to keep file
                        #  size under 10MB, or else it does not download with XHR
                        mapFileName = "rs_mapper_output.ccp4"
                        if sys.platform.startswith("win"):
                            rc1 = self.runApp ( "dials.rs_mapper.bat",
                                                ["grid_size=128","max_resolution="+d_min,
                                                 "map_file="+mapFileName,rlp_json],
                                                quitOnError=False,logType="Service" )
                        else:
                            rc1 = self.runApp ( "dials.rs_mapper",
                                                ["grid_size=128","max_resolution="+d_min,
                                                 "map_file="+mapFileName,rlp_json],
                                                quitOnError=False,logType="Service" )

                        mapFilePath = os.path.join ( self.outputDir(),sweepId +"_"+ mapFileName + ".map" )
                        if os.path.isfile(mapFileName):
                            os.rename ( mapFileName,mapFilePath )
                        else:
                            mapFilePath = None
                    else:
                        rlpFilePath = None
                        mapFilePath = None

                    # import unmerged mtz file for the sweep:
                    newHKLFPath = os.path.join ( resDir,self.getOFName("_"+sweepId.lower()+"_unmerged.mtz",-1) )
                    os.rename ( os.path.join(resDir,mtzSweepName),newHKLFPath )
                    self.resetFileImport()
                    self.addFileImport ( newHKLFPath,import_filetype.ftype_MTZIntegrated() )
                    #self.files_all = [ newHKLFPath ]
                    imported_data = import_unmerged.run ( self,
                        "Unmerged Reflection Dataset (Sweep " + str(n+1) + ")" )

                    if len(imported_data)>0 and rlpFilePath and mapFilePath:
                        imported_data[0].ha_type = hatom
                        grid_id = self.getWidgetId ( "grid" )  #"grid_" + str(self.rvrow)
                        pyrvapi.rvapi_add_grid ( grid_id,False,self.report_page_id(),
                                                 self.rvrow,0,1,1 )
                        pyrvapi.rvapi_set_text ( "<b>Assigned name:</b>&nbsp;" +\
                                                 imported_data[0].dname +\
                                                 "&nbsp;&nbsp;",
                                                 grid_id,0,0,1,1 )
                        self.putRSViewerButton (
                                    "/".join([self.outputDir(),sweepId +"_"+ rlpFileName]),
                                    "/".join([self.outputDir(),sweepId +"_"+ mapFileName + ".map"]),
                                    imported_data[0].dname,
                                    "View in reciprocal space",
                                    grid_id,0,1 )
                        self.rvrow += 1

                    self.putMessage ( "&nbsp;" )

        # modify job name to display in job tree
        ilist = ""
        for key in self.outputDataBox.data:
            ilist += key[4:] + " (" + str(len(self.outputDataBox.data[key])) + ") "

        if not ilist:
            self.putTitle   ( "Image Processing Failed" )
            self.putMessage ( "No output files were produced" )
            ilist = "None"

        # if self.task.uname:
        #     if self.task.uname.startswith("created datasets:"):
        #         self.task.uname = ""
        #     else:
        #         self.task.uname += " / "
        # self.task.uname += "created datasets: <i><b>" + ilist + "</b></i>"
        # with open('job.meta','w') as file_:
        #     file_.write ( self.task.to_JSON() )

        self.generic_parser_summary["xia2"] = {
          "summary_line" : "created datasets: " + ilist
        }

        # hack the bloody xia2.html
        xia2_html = None
        try:
            with open ("xia2.html","r") as file:
                xia2_html = file.read()
        except:
            self.stderrln ( " *** cannot read xia2.html" )
            pass

        if xia2_html:
            xia2_html = xia2_html.replace ( "https://code.jquery.com/jquery-1.12.0.min.js",
                                            "js-lib/xia-2/jquery-1.12.0.min.js" ) \
                                 .replace ( "https://cdn.plot.ly/plotly-latest.min.js",
                                            "js-lib/xia-2/plotly-latest.min.js" ) \
                                 .replace ( "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js",
                                            "js-lib/xia-2/bootstrap.min.js" ) \
                                 .replace ( "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.js",
                                            "js-lib/xia-2/katex.min.js" ) \
                                 .replace ( "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/contrib/auto-render.min.js",
                                            "js-lib/xia-2/auto-render.min.js" ) \
                                 .replace ( "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css",
                                            "js-lib/xia-2/bootstrap.min.css" ) \
                                 .replace ( "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css",
                                            "js-lib/xia-2/katex.min.css" )
            with open ("xia2.html","w") as file:
                file.write ( xia2_html )

        # <script src="https://code.jquery.com/jquery-1.12.0.min.js"></script>
        # <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        # <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
        # <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.js"></script>
        # <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/contrib/auto-render.min.js"></script>
        # <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css"/>
        # <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css"/>


        # Add Xia-2 own html report
        self.insertTab   ( "xia2_report","Xia-2 Report",None,True )
        self.putMessage1 ( "xia2_report","<iframe src=\"../xia2.html\" " +\
            "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
            0 )

        # clean directories
        if os.path.isdir(crystalName):
            shutil.rmtree ( crystalName )

        if os.path.isdir("DataFiles"):
            shutil.rmtree ( "DataFiles" )

        if os.path.isdir("LogFiles"):
            shutil.rmtree ( "LogFiles" )

        # ============================================================================
        # close execution logs and quit

        if rc.msg == "":
            self.success ( (self.outputDataBox.nDTypes()>0) )
        else:
            self.putMessage ( "<i>Finished with error:<p><b>" + rc.msg + "</b></i>" )
            self.stdoutln ( "xia-2 finished with error '" + rc.msg + "'" )
            self.stderrln ( "xia-2 finished with error '" + rc.msg + "'" )
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                  "<b>Failed to launch Xia2: <i>" + rc.msg + "</i></b>"
                  "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )


def d_min_for_rs_mapper(self, indexDir, ind_prefix):
    contents = ''
    for fname in os.listdir(indexDir):
        if fname.startswith(ind_prefix) and fname.endswith('.log'):
            ind_log = os.path.join(indexDir, fname)
            try:
                with open(ind_log) as istream:
                    contents = istream.read()

            except:
                pass

            break

    # to be adjusted to keep the size of json file for uglimol within limits
    coef = 0.07
    d_min = 8.0

    rec_re = '([0-9]+\.[0-9]+)(?:\([0-9]+\))?'
    fmt_uc = ' Unit cell: \(%s, +%s, +%s, +%s, +%s, +%s\)'
    match_uc = re.search(fmt_uc %((rec_re,)* 6), contents)
    if match_uc:
        uc6 = [float(s) for s in match_uc.groups()]
        al, bl, cl = uc6[:3]
        ac, bc, cc = [math.cos(angle* math.pi/ 180.0) for angle in uc6[3:]]
        det = al* bl* cl* (1 - ac* ac - bc* bc -cc* cc + 2* ac* bc* cc)
        d_min = coef* math.pow(det, 1.0/ 3.0)

    return ('%10.2f' %d_min).strip()

# ============================================================================

if __name__ == "__main__":

    drv = Xia2 ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                })
    drv.start()
