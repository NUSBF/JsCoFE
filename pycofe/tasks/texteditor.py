##!/usr/bin/python

#
# ============================================================================
#
#    09.03.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template, dtype_revision
from  pycofe.dtypes import dtype_xyz, dtype_model, dtype_ensemble
from  pycofe.dtypes import dtype_sequence, dtype_ligand
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

        summary_line = ""
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
                summary_line = str(nseq) + " sequence(s) edited"
            else:
                self.putMessage ( "<h3>No sequence(s) could be imported after editing</h3>" +
                                  "<i>Check that sequence data was edited correctly.</i>" )
                summary_line = "sequence editing failed"
            have_results = (nseq>0)

        elif object._type==dtype_xyz.dtype():
            self.putMessage ( "<b>Edited data:</b> atomic coordinates (XYZ)" )
            self.putTitle   ( "Edited coordinates" )
            oxyz = self.registerXYZ ( None,ufname,checkout=True )
            if oxyz:
                # oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                self.putMessage (
                    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                    oxyz.dname )
                self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Edited coordinates",oxyz )
                summary_line = "atomic coordinates edited"
                have_results = True
            else:
                # close execution logs and quit
                summary_line = "atomic coordinates editing failed"
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
                self.putModelWidget ( self.getWidgetId("model_btn"),"Coordinates:&nbsp;",oxyz )
                summary_line = "MR model coordinates edited"
                have_results = True
            else:
                # close execution logs and quit
                summary_line = "MR model editing failed"
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
                summary_line = "MR ensemble coordinates edited"
                have_results = True
            else:
                # close execution logs and quit
                summary_line = "MR ensemble editing failed"
                self.putMessage ( "<h3>MR Ensemble was not formed after edited</h3>" +
                                  "<i>Check that coordinate data was edited correctly.</i>" )

        elif object._type==dtype_ligand.dtype():
            self.putMessage ( "<b>Edited data:</b> ligand descriptions" )
            olig = self.finaliseLigand ( object.code,object.getPDBFilePath(self.inputDir()),
                                         ufname,title="Ligand Structure" )
            if olig:
                summary_line = "ligand descriptions edited"
                have_results = True
            else:
                # close execution logs and quit
                summary_line = "ligand descriptions editing failed"
                self.putMessage ( "<h3>Ligand Data was not formed after edited</h3>" +
                                  "<i>Check that ligand data was edited correctly.</i>" )

        elif object._type==dtype_revision.dtype():

            self.stdoutln ( " stype  = " + self.task.upload.fspec.stype )

            if self.task.upload.fspec.stype=='sequence':
                seq  = object.ASU.seq
                seqN = -1
                file_key_seq = dtype_template.file_key["seq"]
                for i in range(len(seq)):
                    if (getattr(seq[i].files,file_key_seq,None)==self.task.upload.fspec.name):
                        seqN = i
                        break
                if seqN>=0:
                    self.putMessage ( "<b>Edited data:</b> sequence(s) in structure revision" )
                    self.putTitle   ( "Edited sequence(s)" )
                    seq[seqN] = self.makeClass ( seq[seqN] )
                    import_seqcp.run ( self,
                        seq[seqN].getType(),
                        self.outputFName,
                        self.task.upload.data )
                    nseq = self.outputDataBox.nData ( seq[seqN]._type )
                    if nseq>0:
                        summary_line = str(nseq) + " sequence(s) edited and updated in revision"
                        seq[seqN]    = self.outputDataBox.data[seq[seqN]._type][0]
                        self.registerRevision ( object )
                        have_results = True
                    else:
                        self.putMessage ( "<h3>Sequence(s) could be imported after editing</h3>" +
                                          "<i>Check that sequence data was edited correctly.</i>" )
                        summary_line = "sequence editing failed"
                else:
                    summary_line = "errors"
                    self.putMessage ( "<h3>Sequence not found in ASU</h3>" +
                                      "<i>This is a program bug, please report.</i>" )

            elif self.task.upload.fspec.stype=='ligand(s)':
                self.putMessage ( "<b>Edited data:</b> ligand descriptions" )
                self.dataSerialNo += 1
                cifout = dtype_template.makeFileName (
                                        self.job_id,self.dataSerialNo,self.getOFName(ifext) )
                os.rename ( ufname, os.path.join(self.outputDir(),cifout) )
                self.putMessage ( "<b>New ligand file replaced:</b> " + cifout )
                setattr ( object.Structure.files,dtype_template.file_key["lib"],cifout )   
                self.registerRevision ( object )
                summary_line = "ligand descriptions edited in revision"
                have_results = True

            elif ifext=='.mmcif':
                self.putMessage ( "<b>Edited data:</b> atomic coordinates in mmCIF format" )
                self.dataSerialNo += 1
                mmcifout = dtype_template.makeFileName (
                                        self.job_id,self.dataSerialNo,self.getMMCIFOFName() )
                os.rename ( ufname, os.path.join(self.outputDir(),mmcifout) )
                self.putMessage ( "<b>New mmCIF file replaced:</b> " + mmcifout )
                setattr ( object.Structure.files,dtype_template.file_key["mmcif"],mmcifout )   
                self.registerRevision ( object )
                summary_line = "structure coordinates (mmcif) edited"
                have_results = True

            elif self.task.upload.fspec.stype=='structure' or self.task.upload.fspec.stype=='substructure':

                ixyz   = self.makeClass ( self.input_data.data.ixyz[0] )
                xyzout = ixyz.getPDBFilePath ( self.inputDir() )
                subout = ixyz.getSubFilePath ( self.inputDir() )
                if self.task.upload.fspec.stype=='structure':
                    self.putMessage ( "<b>Edited data:</b> atomic coordinates in structure revision" )
                    xyzout = ufname
                    summary_line = "structure coordinates edited"
                    title  = "Output Structure" +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure")
                else:
                    self.putMessage ( "<b>Edited data:</b> heavy-atom substructure in structure revision" )
                    subout = ufname
                    summary_line = "substructure coordinates edited"
                    title  = "Output Substructure"
                oxyz = self.registerStructure ( 
                            None,
                            xyzout,
                            subout,
                            ixyz.getMTZFilePath(self.inputDir()),
                            libPath    = ixyz.getLibFilePath(self.inputDir()),
                            mapPath    = ixyz.getMapFilePath(self.inputDir()),
                            dmapPath   = ixyz.getDMapFilePath(self.inputDir()),
                            leadKey    = ixyz.leadKey,
                            copy_files = False,
                            map_labels = ixyz.mapLabels,
                            refiner    = ixyz.refiner 
                        )
                if oxyz:
                    oxyz.copy_refkeys_parameters ( ixyz )
                    oxyz.copyAssociations   ( ixyz )
                    oxyz.addDataAssociation ( ixyz.dataId )  # ???
                    oxyz.copySubtype        ( ixyz )
                    oxyz.copyLigands        ( ixyz )
                    if not xyzout:
                        oxyz.removeSubtype ( dtype_template.subtypeXYZ() )
                    if not subout:
                        oxyz.removeSubtype ( dtype_template.subtypeSubstructure() )
                    self.putTitle ( title )
                    self.putStructureWidget ( self.getWidgetId("structure_btn"),
                                                "Structure and electron density",
                                                oxyz )
                    # update structure revision
                    revision = self.makeClass ( object  )
                    revision.setStructureData ( oxyz     )
                    self.registerRevision     ( revision )
                    have_results = True
                else:
                    self.putTitle   ( "Output Structure could not be formed" )
                    self.putMessage ( "<i>Check that structure data was edited correctly.</i>" )
                    summary_line = "errors"

                # elif self.task.upload.fspec.stype=='substructure':
                #     self.putMessage ( "<b>Edited data:</b> heavy-atom substructure in structure revision" )
                #     ixyz = self.makeClass ( self.input_data.data.ixyz[0] )


        # retain a copy of edited file for displaying in Job Dialog's Input Panel
        self.task.upload.fspec.name = dtype_template.makeFileName (
                                                self.job_id,99,self.getOFName(ifext) )

        with open(os.path.join(self.outputDir(),self.task.upload.fspec.name),"w") as file:
            file.write ( self.task.upload.data )

        self.task.upload.data = None

        # this will go in the project tree line
        self.generic_parser_summary["TextEditor"] = {
            "summary_line" : summary_line
        }

        self.addCitation ( "default" )

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = TextEditor ( "",os.path.basename(__file__) )
    drv.start()
