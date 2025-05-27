#!/usr/bin/python

#
# ============================================================================
#
#    25.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XIA2 SSX EXECUTABLE MODULE (OPTIONAL CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python pycofe.tasks.xia2_ssx.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Earl Talavera, Maria Fando, Eugene Krissinel, Andrey Lebedev 2025 
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

#  application imports
from pycofe.tasks  import import_task
try:
    from pycofe.varut import messagebox
except:
    messagebox = None


# ============================================================================
# Make Xia2 SSX driver

class Xia2_SSX(basic.TaskDriver):
    import_dir = "uploads"
    def importDir        (self):  return self.import_dir   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table
    
    def run(self):
        # Prepare xia2_ssx job
        nSubJobs = "4"
        if self.jobManager in ["SGE","SCRIPT","SLURM"]:
            nSubJobs = self.getCommandLineParameter ( "ncores" )
            if not nSubJobs:
                nSubJobs = "1"

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


        
        projectName = "xia2_ssx_job"

        

        # =============================== cmd option keywords ========================================
        cmd = []
        

        # ============================= Retrieve Parameters and Input Data===========================
        
        sec1         = self.task.parameters.sec1.contains #Call section 1 parameters
        sec2         = self.task.parameters.sec2.contains #Call section 2 parameters

        
        space_group  = self.getParameter ( sec1.SPACE_GROUP ).strip()
        space_group  = "".join(space_group.split())
        if space_group:  cmd.append ( "space_group=" + space_group ) # If there is wavelength user input


        unit_cell    = self.getParameter ( sec1.UNIT_CELL ).strip()
        unit_cell    = ",".join(unit_cell.replace(",", " ").split())
        if unit_cell  :  cmd.append ( "unit_cell=" + unit_cell ) # If there is unit cell parameters user input
        

        d_min        = self.getParameter ( sec1.D_MIN ).strip()
        if d_min      :  cmd.append ( "d_min=" + d_min ) # If there is High-resolution cutoff user input


        max_lattices = self.getParameter ( sec1.MAX_LATTICES ).strip()
        if int(max_lattices) > 0: cmd.append ("max_lattices=" + max_lattices) # If there is a number of lattices to search for on each image in indexing

        
       
       
        nproc = self.getParameter ( sec1.NPROC ).strip()
        if sys.platform.startswith("darwin") or sys.platform.startswith("linux"): # If the platform starts with macOS or Linux
            if int(nproc) > 0 and int(nproc) <= int(nSubJobs) : cmd.append ( "nproc=" + nproc  ) # If there is a number of available processes provided
            else: cmd.append ( "nproc=" + nSubJobs  )

    
            


        # ================================ Retrieve File Select Input ================================
        
        # Check if reference file was imported
        reference = os.path.join (self.importDir(),self.task.file_select[0].path )
        if os.path.isfile(reference):
            cmd.append ( "reference_geometry="+ str(reference)) # If there reference_geometry file is uploaded

        # Check if reference model file was imported
        referencemodel = os.path.join ( self.importDir(),self.task.file_select[1].path)
        if os.path.isfile(referencemodel):
            cmd.append ( "reference="+ str(referencemodel)) # If there reference model file is uploaded

        # # Check if starting reference geometry file was imported
        # if os.path.isfile(starting_geometry):
        #     cmd.append ( "starting_geometry=", str(starting_geometry))
        # else:
        #     pass #The geometry is read from the image files and a single round of refinement geometry is ran
        
        
       
        # Check if there is an import statement in the .phil file ("like import python module")
        suspicious_keywords = ["import","exec", "eval", "subprocess", "compile", "open", "os.system"] #Don't allow these keywords in the .txt file
        
        #Check if a mask file was imported (should be a plain txt file with file extension .phil)
        mask = os.path.join (self.importDir(),self.task.file_select[2].path )
        if os.path.isfile(mask):
            try:
                with open(mask,"r") as file:
                    contents = file.read()
                    content_lowercase = contents.lower() #case-sensitive comparison
                    #Check for suspicious keywords
                    found_keywords = [keyword for keyword in suspicious_keywords if keyword.lower() in content_lowercase ]
                    if found_keywords:
                        for keyword in found_keywords:
                            self.putMessage(f"--Mask file not uploaded: {keyword} statement found in mask file ")
                    else:
                        cmd.append ("mask=" + str(mask))
            except:
                self.stderrln ( " *** cannot read mask file" )
                pass

        
        # Check if a geometry refinement file is uploaded and user input is not provided from ace_editor
        refinement_geometry = os.path.join (self.importDir(),self.task.file_select[3].path )
        if os.path.isfile(refinement_geometry) and str(sec2.GEOMETRY_REFINEMENT.value) == '':
            try:
                with open(refinement_geometry,"r") as file:
                    contents = file.read()
                    content_lowercase = contents.lower() #case-sensitive comparison
                    #Check for suspicious keywords
                    found_keywords = [keyword for keyword in suspicious_keywords if keyword.lower() in content_lowercase ]
                    if found_keywords:
                        for keyword in found_keywords:
                            self.putMessage(f"--Refinement geometry file not uploaded: {keyword} statement found in refinement geometry file ")
                    else:
                        cmd += ["dials_import.phil=" + refinement_geometry]
            except:
                self.stderrln ( " *** cannot read refinement geometry file" )
                pass
        
        # Check if user input is provided from ace_editor and a geometry refinement file is not uploaded
        elif str(sec2.GEOMETRY_REFINEMENT.value) != '' and os.path.isfile(refinement_geometry)==False:

            # Add validation for "import statements"
            geometry_refinement_options = re.split(r"\n+", sec2.GEOMETRY_REFINEMENT.value) # Split according to new line
            cleaned_string =[char.replace(" ","") for char in geometry_refinement_options]
            cleaned_lowercase = [line.lower() for line in cleaned_string]
            found_keywords = []
            for line in cleaned_lowercase:
                for keyword in suspicious_keywords: 
                    if keyword.lower() in line:
                        found_keywords.append((keyword))
            if found_keywords:
                for keyword in found_keywords:
                    self.putMessage(f"--Refinement Geometry input skipped: {keyword} statement found in refinement geometry input ")     
            #write to the .phil file the geometry refinement options ( no imports detected -> .phil file accepted)
            else:
                geometry_refinement_path = os.path.join ( self.importDir(),"geometry_refinement.phil" )
                try:
                    with open (geometry_refinement_path,"w") as file:
                        options ="\n".join(cleaned_lowercase)
                        file.write(options)
                        file.close() 
                        cmd += ["dials_import.phil=" + "geometry_refinement.phil"] 
                except:
                    self.stderrln ( " *** cannot write to refinement geometry file" )
                    pass
        #If both refinement geometry file is uploaded and user input is provided from ace_editor 
        elif os.path.isfile(refinement_geometry) and str(sec2.GEOMETRY_REFINEMENT.value) != '':
            
            ref_file_safe = False
            ref_user_input = False

            #Check Refinement Geometry File
            try:
                with open(refinement_geometry,"r") as file:
                    contents = file.read()
                    content_lowercase = contents.lower() #case-sensitive comparison
                    #Check for suspicious keywords
                    found_keywords = [keyword for keyword in suspicious_keywords if keyword.lower() in content_lowercase ]
                    if found_keywords:
                        for keyword in found_keywords:
                            self.putMessage(f"--Refinement geometry file not uploaded: {keyword} statement found in refinement geometry file ")
                    else:
                        ref_file_safe = True
                        cmd += ["dials_import.phil=" + refinement_geometry]
            except:
                self.stderrln ( " *** cannot read refinement geometry file" )
                pass
            
            #Check User input Refinement Geometry
            geometry_refinement_options = re.split(r"\n+", sec2.GEOMETRY_REFINEMENT.value) # Split according to new line
            cleaned_string =[char.replace(" ","") for char in geometry_refinement_options]
            cleaned_lowercase = [line.lower() for line in cleaned_string]
            found_keywords = []
            for line in cleaned_lowercase:
                for keyword in suspicious_keywords: 
                    if keyword.lower() in line:
                        found_keywords.append((keyword))
            if found_keywords:
                for keyword in found_keywords:
                    self.putMessage(f"--Refinement Geometry input skipped: {keyword} statement found in refinement geometry input ")   

            #write to the .phil file the geometry refinement options ( no imports detected -> .phil file accepted)
            else:
                ref_user_input = True
                if ref_file_safe==True:
                    try:
                        with open (refinement_geometry,"a") as file:
                            options ="\n".join(cleaned_lowercase)
                            file.write("\n" + options + "\n")
                            file.close() 
                    except:
                        self.stderrln ( " *** cannot write to uploaded refinement geometry file" )
                        pass
                elif ref_file_safe ==False:
                    geometry_refinement_path = os.path.join ( self.importDir(),"geometry_refinement.phil" )
                    try:
                        with open (geometry_refinement_path,"w") as file:
                            options ="\n".join(cleaned_lowercase)
                            file.write(options)
                            file.close() 
                            cmd += ["dials_import.phil=" + "geometry_refinement.phil"] 
                    except:
                        self.stderrln ( " *** cannot write to refinement geometry file" )
                        pass

        # ================================ Retrieve Diffraction Images  ================================
     
        # Pass images to xia2.ssx as  template=../hewl_#####.cbf  
 
        #.cbf is the image type (only for X-ray images dropdown)
        # "###" is the range of the image files i/e image_1_001 to image_1_999
        if self.task.datatype=="images":
            for i in range(len(imageDirMeta)):
                if imageDirMeta[i]["path"]:
                    sectors = imageDirMeta[i]["sectors"]
                    for j in range(len(sectors)):
                        ranges_sel = sectors[j]["ranges_sel"]                       
                        image_universal_path = imageDirMeta[i]["path"] #normal full path 
                        dirpath    = os.path.join ( imageDirMeta[i]["path"],sectors[j]["name"] ) #imageDirMeta is taking path in as Mac OS/Linux = "/" and os.path.join "\" for windows 
                    
                        for k in range(len(ranges_sel)):
                            starting_index=(len(str(ranges_sel[k][0]))) # return starting index 
                            ending_index=(len(str(ranges_sel[k][1]))) # return ending index 
                            
                        index=""#declare empty string to hold # for range index
                        for l in range(ending_index+1):
                            index=index +"#"
                        if sys.platform.startswith("win"):
                            windows_path = image_universal_path.replace("/", "\\")
                            new_image_dir_path_p1=(imageDirMeta[i]["path"])
                            new_image_dir_path_p2=(sectors[j]["name"])
    
                            separator="_"
                            split_after_underscore = new_image_dir_path_p2.split(separator, 1)[0]
                            # Search for the first occurence of \ from end to start
                            # replace the characters from the \ going forwards
                            img_dir_hashtag=("\\"+split_after_underscore + "_"+ str(index) + ".cbf")#replace this with extension file after (split string after .)
                            cmd.append ( "template=" + windows_path + img_dir_hashtag)
                            #image directory path should be ../hewl_0#### on windows
                        else: 
                            new_image_dir_path_p2=(sectors[j]["name"])
                            separator="_"
                            split_after_underscore = new_image_dir_path_p2.split(separator, 1)[0]
                            img_dir_hashtag=("/"+split_after_underscore + "_"+ str(index) + ".cbf")#replace this with extension file after (split string after .)
                            for k in range(len(ranges_sel)):
                                cmd.append (  "template="  + image_universal_path + img_dir_hashtag )



        # ============================== Running Xia2_SSX Task =========================================
        
        environ = os.environ.copy()

        # put progress spinner
        rvrow0 = self.rvrow
        self.putWaitMessageLF ( "Image processing in progress ..." )


        #run xia2.ssx.exe if on windows else xia2.ssx
        if sys.platform.startswith("win"):
            rc = self.runApp ( "xia2.ssx.exe",cmd,logType="Main",quitOnError=False, env=environ )
        else:
            rc = self.runApp ( "xia2.ssx",cmd,logType="Main",quitOnError=False, env=environ )

        # remove progress spinner
        self.putMessage1 ( self.report_page_id()," ",rvrow0 )


        # ======================================== Retrieve Job Output and Display .MTZ Report ===================================================
        
        # self.putMessage("The command keywords are " + str(cmd))

        
        #Check output files
        resDir     = "DataFiles"
        outputMergedMTZFName = "merged.mtz"
        outputScaledMTZFName = "scaled.mtz"

        
        newMergedPath = os.path.join ( resDir,outputMergedMTZFName )
        newScaledPath = os.path.join ( resDir,outputScaledMTZFName )

        have_results = False
        summary_line = ""

        self.resetFileImport()

        if os.path.isfile(newMergedPath) or os.path.isfile(newScaledPath):
            have_results = True
            self.putTitle ( "Merged Reflection Dataset" )

            if os.path.isfile(newMergedPath):
                # make list of files to import
                self.addFileImport ( newMergedPath,import_filetype.ftype_MTZMerged() )
                self.import_dir = "./"
                hkl_imported_1 = import_merged.run ( self,"Merged Reflection dataset",importPhases="" )
                
            
            if os.path.isfile(newScaledPath):
                # make list of files to import
                self.addFileImport ( newScaledPath,import_filetype.ftype_MTZMerged() )
                self.import_dir = "./"
                hkl_imported_2 = import_merged.run ( self,"Merged Reflection dataset",importPhases="" )
            
            summary_line = "imported and merged: MTZ "  # line inside the cloud next to the job tree --imported and merged: MTZ 

        else:
            self.putTitle   ( "Image Processing Failed" )
            self.putMessage ( "No output files were produced" )


      
        
        with open('job.meta','w') as file_:
            file_.write ( self.task.to_JSON() )

        

        self.generic_parser_summary["xia2_ssx"] = {
          "summary_line" : summary_line 
        }


        #=========================================== Xia2_ssx Dials HTML report ==============================================
        # configure the dials.merge.html for internal libraries
        dials_merge_html = None
        
        try:
            with open ("Logfiles/dials.merge.html","r") as file:
                dials_merge_html = file.read()
        except:
            self.stderrln ( " *** cannot read dials.merge.html" )
            pass

        if dials_merge_html:
            dials_merge_html = dials_merge_html.replace ( "https://code.jquery.com/jquery-1.12.0.min.js",
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
            with open ("Logfiles/dials.merge.html","w") as file:
                file.write ( dials_merge_html )
    
            #Dials Merge HTML Report
            self.insertTab   ( "xia2_ssx_dials_merge_report","Dials Merge Report",None,True )
            self.putMessage1 ( "xia2_ssx_dials_merge_report","<iframe src=\"../LogFiles/dials.merge.html\" " +\
                "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
                0 )

        
        #=========================================== Clean Directories ==============================================

        if os.path.isdir("data_reduction"):
            shutil.rmtree ( "data_reduction" )
        
        batch_dir_pattern = re.compile(r'^batch_\d+$')#Match folders beginning with batch_# where # is digits
        base_dir = "./"

        # remove batch_# directories
        for file in os.listdir(base_dir):
            file_path = os.path.join(base_dir,file)
            if os.path.isdir(file_path) and batch_dir_pattern.match(file):
                shutil.rmtree(file_path)

        # ============================== Error Logs ==============================================
        
        # close execution logs and quit

        if rc.msg == "": #If empty no errors
            self.success ( have_results)
        else:
            self.putMessage ( "<i>Finished with error:<p><b>" + rc.msg + "</b></i>" )
            self.stdoutln ( "xia-2 ssx finished with error '" + rc.msg + "'" )
            self.stderrln ( "xia-2 ssx finished with error '" + rc.msg + "'" )
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                  "<b>Failed to launch Xia2 SSX: <i>" + rc.msg + "</i></b>"
                  "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )


# ============================================================================

if __name__ == "__main__":

    drv = Xia2_SSX ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                })
    drv.start()
