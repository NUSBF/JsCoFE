##!/usr/bin/python

#
# ============================================================================
#
#    04.10.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ UTILITIES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python texteditor.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2022
#
# ============================================================================
#

#  python native imports
import os
import json

import gemmi

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_model,dtype_ensemble
# from  pycofe.dtypes import dtype_structure,dtype_revision
from  pycofe.dtypes import dtype_sequence
# from  pycofe.proc   import import_sequence,import_filetype
from  pycofe.proc   import import_seqcp


# ============================================================================
# Make Text Editor driver

class TextEditor(basic.TaskDriver):

    def importDir(self): return "." # in current directory ( job_dir )

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        object = self.makeClass ( self.input_data.data.object[0] )

        # --------------------------------------------------------------------

        have_results = False

        # write out uploaded file
        ifname, ifext = os.path.splitext ( self.task.upload.fspec.name )
        ufname = self.getOFName ( ifext )
        with open(ufname,"w") as file:
            file.write ( self.task.upload.data )

        if object._type==dtype_sequence.dtype():
            # import modified sequence
            self.putMessage ( "<b>Edited data:</b> sequence(s)" )
            self.putTitle ( "Edited sequence(s)" )
            import_seqcp.run ( self,
                object.getType(),
                self.outputFName,
                self.task.upload.data )
            nseq = self.outputDataBox.nData ( object._type )
            if nseq>0:
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : str(nseq) + " sequence(s) edited"
                }
            else:
                self.putMessage ( "<h3>No sequence(s) could be imported after editing</h3>" +
                                  "<i>Check that sequence data was edited correctly.</i>" )
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "sequence editing failed"
                }
            have_results = (nseq>0)

        elif object._type==dtype_xyz.dtype():
            self.putMessage ( "<b>Edited data:</b> atomic coordinates (XYZ)" )
            self.putTitle   ( "Edited coordinates" )
            oxyz = self.registerXYZ ( ufname,checkout=True )
            if oxyz:
                oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                self.putMessage (
                    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                    oxyz.dname )
                self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Edited coordinates",oxyz )
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "atomic coordinates edited"
                }
                have_results = True
            else:
                # close execution logs and quit
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "atomic coordinates editing failed"
                }
                self.putMessage ( "<h3>XYZ Data was not formed after edited</h3>" +
                                  "<i>Check that coordinate data was edited correctly.</i>" )
            
        elif object._type==dtype_model.dtype():
            self.putMessage ( "<b>Edited data:</b> MR Model" )
            self.putTitle   ( "Edited MR Model" )
            seq = object.getSubtypes()
            if object.sequence:
                seq = self.makeClass ( object.sequence )
            oxyz = self.registerModel ( seq,ufname,checkout=True )
            if oxyz:
                self.putModelWidget ( self.getWidgetId("model_btn"),"Coordinates",oxyz )
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "MR model coordinates edited"
                }
                have_results = True
            else:
                # close execution logs and quit
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "MR model editing failed"
                }
                self.putMessage ( "<h3>MR Model was not formed after edited</h3>" +
                                  "<i>Check that coordinate data was edited correctly.</i>" )

        elif object._type==dtype_ensemble.dtype():
            self.putMessage ( "<b>Edited data:</b> MR Ensemble" )
            self.putTitle   ( "Edited MR Ensemble" )
            seq = object.getSubtypes()
            if object.sequence:
                seq = self.makeClass ( object.sequence )
            oxyz = self.registerEnsemble ( seq,ufname,checkout=True )
            if oxyz:
                self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),"Coordinates",oxyz )
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "MR ensemble coordinates edited"
                }
                have_results = True
            else:
                # close execution logs and quit
                self.generic_parser_summary["TextEditor"] = {
                  "summary_line" : "MR ensemble editing failed"
                }
                self.putMessage ( "<h3>MR Ensemble was not formed after edited</h3>" +
                                  "<i>Check that coordinate data was edited correctly.</i>" )


        # retain a copy of edited file for displaying in Job Dialog's Input Panel
        self.task.upload.fspec.name = dtype_template.makeFileName (
                                                self.job_id,99,self.getOFName(ifext) )

        with open(os.path.join(self.outputDir(),self.task.upload.fspec.name),"w") as file:
            file.write ( self.task.upload.data )

        self.task.upload.data = None


        # this will go in the project tree line
        # if len(log)>0:
        #     self.generic_parser_summary["TextEditor"] = {
        #       "summary_line" : ", ".join(log)
        #     }

        self.addCitation ( "default" )

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = TextEditor ( "",os.path.basename(__file__) )
    drv.start()
