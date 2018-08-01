#!/usr/bin/python

#
# ============================================================================
#
#    31.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XIA2 EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.xia2.py exeType jobDir jobId
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
import shutil

#  ccp4 imports
import pyrvapi

#  application imports
import basic
from pycofe.varut import signal
from pycofe.proc  import import_filetype, import_merged, import_unmerged
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
        # Prepare coot job

        # fetch input data
        imageDirPath = self.task.imageDirPath
        sec1         = self.task.parameters.sec1.contains
        sec2         = self.task.parameters.sec2.contains

        projectName  = self.getParameter ( sec1.PROJECT     )
        crystalName  = self.getParameter ( sec1.CRYSTAL     )
        pipeline     = self.getParameter ( sec2.PIPELINE    )
        hatom        = self.getParameter ( sec2.HATOM       )
        small_mol    = self.getParameter ( sec2.SMALL_MOLECULE ).lower()
        space_group  = self.getParameter ( sec2.SPACE_GROUP )
        unit_cell    = self.getParameter ( sec2.UNIT_CELL   )
        d_min        = self.getParameter ( sec2.D_MIN       )
        cc_half      = self.getParameter ( sec2.CC_HALF     )
        misigma      = self.getParameter ( sec2.MISIGMA     )
        isigma       = self.getParameter ( sec2.ISIGMA      )

        space_group = "".join(space_group.split())
        unit_cell = ",".join(unit_cell.replace(",", " ").split())

        cmd = [ "project="  + projectName,
                "crystal="  + crystalName,
                "pipeline=" + pipeline,
                "small_molecule=" + small_mol ]
        if hatom      :  cmd.append ( "atom="          + hatom   )
        if space_group:  cmd.append ( "space_group=\"" + space_group + "\"" )
        if unit_cell  :  cmd.append ( "unit_cell=\""   + unit_cell   + "\"" )
        if d_min      :  cmd.append ( "d_min="         + d_min   )
        if cc_half    :  cmd.append ( "cc_half="       + cc_half )
        if misigma    :  cmd.append ( "misigma="       + misigma )
        if isigma     :  cmd.append ( "isigma="        + isigma  )

        cmd.append ( imageDirPath )

        # Run xia2
        if sys.platform.startswith("win"):
            rc = self.runApp ( "xia2.bat",cmd )
        else:
            rc = self.runApp ( "xia2",cmd )

        # Check for PDB files left by Xia2 and convert them to type structure
        resDir = "DataFiles"
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
            self.putTitle   ( "Merged Reflection Dataset" )
            newHKLFPath = os.path.join ( resDir,self.getOFName("_merged.mtz",-1) )
            os.rename ( os.path.join(resDir,mtzMergedName),newHKLFPath )
            self.addFileImport ( "",newHKLFPath,import_filetype.ftype_MTZMerged() )
            #self.files_all = [ newHKLFPath ]
            import_merged.run ( self,"Merged Reflection Dataset" )
            nsweeps -= 1
        if mtzUnmergedName in file_names:
            self.putTitle   ( "Unmerged Scaled Reflection Dataset" )
            newHKLFPath = os.path.join ( resDir,self.getOFName("_unmerged_scaled.mtz",-1) )
            os.rename ( os.path.join(resDir,mtzUnmergedName),newHKLFPath )
            self.addFileImport ( "",newHKLFPath,import_filetype.ftype_MTZIntegrated() )
            #self.files_all = [ newHKLFPath ]
            import_unmerged.run ( self,"Unmerged Scaled Reflection Dataset" )
            nsweeps -= 1

        if nsweeps>0:

            title_made = False
            for n in range(nsweeps):
                sweepId = "SWEEP" + str(n+1)
                #mtzSweepName = fnPrefix +"_"+ datasetName +"_"+ sweepId + "_INTEGRATE.mtz"
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
                    refDir = os.path.join ( crystalName,datasetName,sweepId,"refine" )
                    ref_names = [fn for fn in os.listdir(refDir)
                        if any(fn.endswith(ext) for ext in ["_refined_experiments.json","_refined.pickle"])]
                    rlp_json   = ""
                    rlp_pickle = ""
                    for fname in ref_names:
                        if fname.endswith(".pickle") and fname > rlp_pickle:
                            rlp_pickle = fname
                        elif fname.endswith(".json") and fname > rlp_json:
                            rlp_json = fname

                    rlp_pickle = os.path.join ( refDir,rlp_pickle )
                    rlp_json   = os.path.join ( refDir,rlp_json   )
                    self.open_stdin  ()
                    self.write_stdin ( rlp_json   + "\n" )
                    self.write_stdin ( rlp_pickle + "\n" )
                    self.close_stdin ()
                    self.runApp ( "dials.export",[
                        "format=json"
                    ])

                    outFileName = "rlp.json"
                    rlpFileName = os.path.join ( self.outputDir(),sweepId +"_"+ outFileName )
                    if os.path.isfile(outFileName):
                        os.rename ( outFileName,rlpFileName )
                    else:
                        rlpFileName = None

                    # ===== For new version of rs_mapper =======
                    indexDir  = os.path.join ( crystalName,datasetName,sweepId,"refine" )
                    ind_names = [fn for fn in os.listdir(indexDir)
                        if any(fn.endswith(ext) for ext in ["_refined_experiments.json"])]
                    ind_json = ""
                    for fname in ind_names:
                        if not ind_json or fname > ind_json:
                            ind_json = fname
                    ind_json   = os.path.join ( indexDir,ind_json )

                    self.open_stdin  ()
                    self.write_stdin ( ind_json + "\n" )
                    self.close_stdin ()

                    #  grid size and resolution are chosen such as to keep file
                    #  size under 10MB, or else it does not download with XHR
                    rc1 = self.runApp ( "dials.rs_mapper",["grid_size=128","max_resolution=8"],
                         quitOnError=False )

                    # ===== For old version of rs_mapper =======
                    if rc1.msg:
                        indexDir  = os.path.join ( crystalName,datasetName,sweepId,"index" )
                        ind_names = [fn for fn in os.listdir(indexDir)
                            if any(fn.endswith(ext) for ext in ["_datablock.json"])]
                        ind_json = ""
                        for fname in ind_names:
                            if not ind_json or fname < ind_json:
                                ind_json = fname
                        ind_json   = os.path.join ( indexDir,ind_json )

                        self.open_stdin  ()
                        self.write_stdin ( ind_json + "\n" )
                        self.close_stdin ()

                        #  grid size and resolution are chosen such as to keep file
                        #  size under 10MB, or else it does not download with XHR
                        self.runApp ( "dials.rs_mapper",["grid_size=128","max_resolution=8"] )

                    outFileName = "rs_mapper_output.ccp4"
                    mapFilePath = os.path.join ( self.outputDir(),sweepId +"_"+ outFileName + ".map" )
                    if os.path.isfile(outFileName):
                        os.rename ( outFileName,mapFilePath )
                    else:
                        mapFilePath = None

                    # import unmerged mtz file for the sweep:
                    newHKLFPath = os.path.join ( resDir,self.getOFName("_"+sweepId.lower()+"_unmerged.mtz",-1) )
                    os.rename ( os.path.join(resDir,mtzSweepName),newHKLFPath )
                    self.resetFileImport()
                    self.addFileImport ( "",newHKLFPath,import_filetype.ftype_MTZIntegrated() )
                    #self.files_all = [ newHKLFPath ]
                    imported_data = import_unmerged.run ( self,
                        "Unmerged Reflection Dataset (Sweep " + str(n+1) + ")" )

                    if len(imported_data)>0 and rlpFileName and mapFilePath:
                        grid_id = "grid_" + str(self.rvrow)
                        pyrvapi.rvapi_add_grid ( grid_id,False,self.report_page_id(),
                                                 self.rvrow,0,1,1 )
                        pyrvapi.rvapi_set_text ( "<b>Assigned name:</b>&nbsp;" +\
                                                 imported_data[0].dname +\
                                                 "&nbsp;&nbsp;",
                                                 grid_id,0,0,1,1 )
                        self.putRSViewerButton (
                                    rlpFileName,mapFilePath,
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

        if self.task.uname:
            self.task.uname += " / "
        self.task.uname += "created datasets: <i><b>" + ilist + "</b></i>"
        with open('job.meta','w') as file_:
            file_.write ( self.task.to_JSON() )


        # Add Xia-2 own html report
        self.insertTab   ( "xia2_report","Xia-2 Report",None,True )
        self.putMessage1 ( "xia2_report","<iframe src=\"../xia2.html\" " +\
            "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
            0 )

        # clean directory
        if os.path.isdir(crystalName):
            shutil.rmtree ( crystalName )

        # ============================================================================
        # close execution logs and quit

        if rc.msg == "":
            self.success()
        else:
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                  "<b>Failed to launch Xia2: <i>" + rc.msg + "</i></b>"
                  "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )


# ============================================================================

if __name__ == "__main__":

    drv = Xia2 ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                })
    drv.start()
