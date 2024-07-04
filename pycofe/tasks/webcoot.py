#!/usr/bin/python

#
# ============================================================================
#
#    14.06.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  WEB-COOT MODEL BUILDING EXECUTABLE MODULE (WEBAPP-FINISH TASK)
#
#  Command-line:
#     ccp4-python python.tasks.webcoot.py jobManager jobDir jobId expire=timeout_in_days
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir      is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    expire      is timeout for removing coot backup directories
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2023-2024
#
# ============================================================================
#

#  python native imports
import os
import json
# import sys
# import shutil

#  application imports
from   pycofe.tasks   import basic
from   pycofe.varut   import mmcif_utils
from   pycofe.dtypes  import dtype_model, dtype_template
# try:
#     from pycofe.varut import messagebox
# except:
#     messagebox = None

# from   pycofe.proc    import  covlinks

# ============================================================================
# Make WebCoot driver

class WebCoot(basic.TaskDriver):

    # ------------------------------------------------------------------------

    #def get_ligand_code ( self,exclude_list ):
    #    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    #    for L1 in alphabet:
    #        dirpath = os.path.join ( os.environ["CCP4"],"lib","data","monomers",L1.lower() )
    #        dirSet  = set ( os.listdir(dirpath) )
    #        for L2 in alphabet:
    #            for L3 in alphabet:
    #                code = L1 + L2 + L3
    #                if code+".cif" not in dirSet and code not in exclude_list:
    #                    return code
    #    return None

    # def replace_ligand_code ( self,fpath,oldCode,newCode,rename=False ):
    #     f = open(fpath,"r")
    #     data = f.read()
    #     f.close()
    #     os.remove ( fpath )
    #     if rename:
    #         if oldCode in fpath:
    #             fwpath   = fpath.replace ( oldCode,newCode )
    #         else:
    #             fn, fext = os.path.splitext ( fpath )
    #             fwpath   = fn + "-" + newCode + fext
    #     else:
    #         fwpath = fpath
    #     f = open(fwpath,"w")
    #     f.write ( data.replace(oldCode,newCode) )
    #     f.close()
    #     return fwpath


    # ------------------------------------------------------------------------

    # def addLigandToLibrary ( self,libPath,ligCode,ligPath,ligList ):
    #     # returns path to ligand library whith new ligand included

    #     if not ligPath:  # nothing to include
    #         return (libPath,ligList)

    #     if not libPath:  # nowhere to include
    #         return (ligPath,ligList+[ligCode])

    #     if ligCode in ligList:  # no need to include
    #         return (libPath,ligList)

    #     self.open_stdin()
    #     self.write_stdin (
    #         "_Y"          +\
    #         "\n_FILE_L  " + libPath +\
    #         "\n_FILE_L2 " + ligPath +\
    #         "\n_FILE_O  " + self.outputFName +\
    #         "\n_END\n" )
    #     self.close_stdin()

    #     self.runApp ( "libcheck",[],logType="Service" )

    #     return ( self.outputFName+".lib",ligList+[ligCode] )

    # ------------------------------------------------------------------------

    def run(self):

        iobject = self.makeClass ( self.input_data.data.revision[0] )
        istruct = self.makeClass ( self.input_data.data.istruct [0] )
        # mtzfile   = istruct.getMTZFilePath ( self.inputDir() )
        # lead_key  = istruct.leadKey

        ligand  = None
        ligCode = None
        ligPath = None
        libPath = None
        if iobject._type=="DataRevision":
          if hasattr(self.input_data.data,"ligand"):
              ligand  = self.makeClass ( self.input_data.data.ligand[0] )
              ligCode = ligand.code
              ligPath = ligand.getLibFilePath ( self.inputDir() )
              # self.stderrln ( " >>>> ligand " + str(ligand.code) + " found" )

          libPath, ligList = self.addLigandToLibrary (
                                      istruct.getLibFilePath(self.inputDir()),
                                      ligCode,ligPath,istruct.ligands )

        # Check for output files left by Moorhen and make the corresponding
        # output data objects

        mmcifout   = [f for f in os.listdir('./') if f.lower().endswith(".mmcif")]
        hasResults = False

        if len(mmcifout)<=0:
            self.putTitle   ( "No Output Structure Produced" )
            self.putMessage ( "<i style=\"color:maroon\">" +\
                              "Have you saved your results in CCP4 Cloud?</i>" )

        refkeys = None
        try:
            with open("view_settings.json") as file:
                refkeys = json.load(file)
        except:
            pass

        outputSerialNo = 0
        make_title     = True
        for mmcif_f in mmcifout:

            outputSerialNo += 1

            mmcif_fname = self.getMMCIFOFName (
                                    -1 if len(mmcifout)<=1 else outputSerialNo )
            if mmcif_utils.clean_mmcif(mmcif_f,mmcif_fname):

                molName   = os.path.splitext ( os.path.basename(mmcif_fname) )[0]
                pdb_fname = None
                if mmcif_utils.convert_to_pdb(mmcif_fname):
                    pdb_fname = os.path.splitext(mmcif_fname)[0] + ".pdb"
                    if not os.path.isfile(pdb_fname):
                        self.stderrln ( " >>>> converted output PDB " + pdb_fname +\
                                        " not found" )
                        pdb_fname = None
                else:
                    self.stderrln ( " >>>> cannot convert output mmCIF to PDB" )

                iobject_type = iobject._type

                if os.path.exists(mmcif_f+".MRSearchModel"):
                    # moorhen output must be converted into MR model
                    iobject_type = dtype_model.dtype()

                if iobject_type in ["DataRevision","DataStructure"]:

                    if make_title:
                        self.putTitle ( "Results" )
                        make_title = False

                    self.putMessage ( "<h3>Output Structure" +\
                            self.hotHelpLink ( "Structure","jscofe_qna.structure") +\
                            " #" + str(outputSerialNo) + " \"" + molName + "\"</h3>" )
                    
                    ostruct = self.registerStructure ( 
                                    mmcif_fname,
                                    pdb_fname,
                                    istruct.getSubFilePath(self.inputDir()),
                                    istruct.getMTZFilePath(self.inputDir()),
                                    libPath    = libPath,
                                    mapPath    = istruct.getMapFilePath(self.inputDir()),
                                    dmapPath   = istruct.getDMapFilePath(self.inputDir()),
                                    leadKey    = istruct.leadKey,
                                    copy_files = False,
                                    map_labels = istruct.mapLabels,
                                    refiner    = istruct.refiner 
                                )
                    if ostruct:
                        ostruct.copy_refkeys_parameters  ( istruct )
                        ostruct.store_refkeys_parameters ( self.task._type,self.task.id,refkeys )
                        ostruct.copyAssociations   ( istruct )
                        ostruct.addDataAssociation ( istruct.dataId )  # ???
                        ostruct.mergeSubtypes      ( istruct )
                        ostruct.copyLigands        ( istruct )
                        ostruct.copyLabels         ( istruct )
                        # if not xyzout:
                        #     oxyz.removeSubtype ( dtype_template.subtypeXYZ() )
                        #self.putMessage (
                        #    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                        #    oxyz.dname )
                        self.putStructureWidget ( self.getWidgetId("structure_btn"),
                                                    "Structure and electron density",
                                                    ostruct )

                        if iobject_type=="DataRevision":
                            # update structure revision
                            iobject.setStructureData ( ostruct  )
                            self.putMessage ( "<h3>Structure Revision" +\
                                self.hotHelpLink ( "Structure Revision",
                                                   "jscofe_qna.structure_revision" ) +\
                                                   "</h3>" )
                            self.registerRevision ( iobject,serialNo=outputSerialNo,
                                                    title="" )
                        hasResults = True

                    else:
                        self.stderrln ( "\n ***** output structure was not formed" )

                elif iobject_type=="DataEnsemble":
                    if make_title:
                        self.putTitle ( "Results" )
                        make_title = False
                    self.putMessage ( "<b>Edited MR ensemble:</b> " + iobject.dname )
                    if iobject.sequence:
                        iobject.sequence = self.makeClass ( iobject.sequence )
                    ensemble = self.registerEnsemble ( iobject.sequence,pdb_fname,checkout=True )
                    if ensemble:
                        self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),
                                                 "Coordinates:&nbsp;",ensemble )
                        hasResults = True
                    else:
                        self.putMessage ( "<b>Error: MR ensemble could not be formed</b>" )
                        self.stderrln   ( " ***** Error: MR ensemble could not be formed" )
                        
                elif iobject_type=="DataModel":
                    if make_title:
                        self.putTitle ( "Results" )
                        make_title = False
                    # if outputSerialNo>1:
                    #     self.putMessage ( "&nbsp;" )
                    if len(mmcifout)>1:
                        self.putMessage ( "<h3>Output #" + str(outputSerialNo) + "</h3>" )
                    model = None
                    if iobject_type==iobject._type:
                        self.putMessage ( "<b>Edited MR model:</b> " + iobject.dname )
                        if iobject.sequence:
                            iobject.sequence = self.makeClass ( iobject.sequence )
                        model = self.registerModel ( iobject.sequence,pdb_fname,checkout=True )
                    else:
                        self.putMessage ( "<b>MR model prepared from:</b> " + iobject.dname )
                        subtype = []
                        if dtype_template.subtypeProtein() in iobject.subtype:
                            subtype.append ( dtype_template.subtypeProtein() )
                        if dtype_template.subtypeRNA() in iobject.subtype:
                            subtype.append ( dtype_template.subtypeRNA() )
                        if dtype_template.subtypeDNA() in iobject.subtype:
                            subtype.append ( dtype_template.subtypeDNA() )
                        model = self.registerModel ( subtype,pdb_fname,checkout=True )
                        if model:
                            model.meta  = {
                                "rmsd"    : "1.2",
                                "seqId"   : "100.0"
                            }
                            model.seqId = "100.0"
                            model.rmsd  = "1.2"
                            self.add_seqid_remark ( model,["100.0"] )

                    if model:
                        self.putModelWidget ( self.getWidgetId("model_btn"),
                                              "Coordinates:&nbsp;",model )
                        hasResults = True
                    else:
                        self.putMessage ( "<b>Error: MR model could not be formed</b>" )
                        self.stderrln   ( " ***** Error: MR model could not be formed" )

                elif iobject_type=="DataXYZ":
                    if make_title:
                        self.putTitle ( "Results" )
                        make_title = False
                    self.putMessage ( "<b>Edited structure model:</b> " + iobject.dname )
                    xyz = self.registerXYZ ( mmcif_fname,pdb_fname,checkout=True )
                    if xyz:
                        # xyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                        self.putMessage (
                            "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                            xyz.dname )
                        self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                            "Coordinates:&nbsp;",xyz )
                        hasResults = True
                    else:
                        self.putMessage ( "<b>Error: structure model could not be formed</b>" )
                        self.stderrln   ( " ***** Error: structure model could not be formed" )

                else:
                    self.putMessage ( "<b>Unsupported data type (this is a bug)</b> " )
                    self.stderrln   ( " ***** Error: unsupported data type " + iobject._type )
                    self.putTitle   ( "No Output Produced" )

            else:
                self.stderrln ( "\n ***** " + mmcif_f + " output file not found" )

        summaryLine = "no models saved"
        if hasResults:
            summaryLine = str(outputSerialNo)
            if outputSerialNo==1:
                summaryLine += " model saved"
            else:
                summaryLine += " models saved"
        elif len(mmcifout)<=0:
            self.stderrln ( "\n ***** no output .mmcif files found" )
        else:
            self.stderrln ( "\n ***** " + str(len(mmcifout))   +\
                            " output .mmcif files found, but " +\
                            "none is found suitable" )

        self.generic_parser_summary["web_coot"] = {
            "summary_line" : summaryLine
        }

        self.task.nc_type = "browser"
        self.success ( hasResults )
        return


# ============================================================================

if __name__ == "__main__":

    drv = WebCoot ( "",os.path.basename(__file__) )
    drv.start()
