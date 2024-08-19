##!/usr/bin/python

# LEGACY CODE, ONLY USED IN OLD PROJECTS   05.09.20  v.1.4.014

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  EDIT STRUCTURE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python editrevision_struct.py jobManager jobDir jobId
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

#  application imports
from  pycofe.dtypes  import dtype_template, dtype_structure
from  pycofe.tasks   import basic
from  pycofe.proc    import makelib


# ============================================================================
# Make EditRevision driver

class EditRevisionStruct(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )
        hkl0      = self.makeClass ( self.input_data.data.hkl0[0] )

        struct0   = None
        if hasattr(self.input_data.data,"struct0"):  # optional data parameter
            struct0 = self.makeClass ( self.input_data.data.struct0 [0] )

        #xyz = struct0  # this is current Structure or None
        xyz = None  # this is current Structure or None
        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            #  note this may be XYZ or Structure
            xyz = self.makeClass ( self.input_data.data.xyz[0] )

        phases = struct0  # ground default
        #if xyz._type==dtype_structure.dtype():
        #    phases = xyz  # need to be in sync with xyz by default
        if hasattr(self.input_data.data,"phases"):  # optional data parameter
            #  note this may be either Structure or Substructure, but not XYZ
            phases = self.makeClass ( self.input_data.data.phases[0] )

        ligands = []
        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            for lig in self.input_data.data.ligand:
                ligands.append ( self.makeClass(lig) )


        # --------------------------------------------------------------------

        # redefine structure
        self.putMessage  ( "<h2>Compose new Structure</h2>" )
        xyz_fpath  = None
        sub_fpath  = None   #  will stay None as we edit only Structure in this task
        mtz_fpath  = None
        map_fpath  = None
        dmap_fpath = None
        lib_fpath  = None
        lig_codes  = None
        replaced   = []
        deleted    = []
        if xyz:
            xyz_fpath = xyz.getPDBFilePath ( self.inputDir() )
            if xyz._type==dtype_structure.dtype():
                lib_fpath = xyz.getLibFilePath ( self.inputDir() )
            if not struct0 or xyz.dataId!=struct0.dataId:
                replaced.append ( "xyz" )
        else:
            deleted.append ( "xyz" )

        if phases:
            mtz_fpath  = phases.getMTZFilePath ( self.inputDir() )
            map_fpath  = phases.getMapFilePath ( self.inputDir() )
            dmap_fpath = phases.getDMapFilePath( self.inputDir() )
            if phases is not struct0:
                meanF_labels    = hkl0.getMeanF()
                meanF_labels[2] = hkl0.getFreeRColumn()
                phases_labels   = phases.getPhaseLabels()
                mtz_fname       = phases.lessDataId ( phases.getMTZFileName() )
                self.makePhasesMTZ (
                    hkl0.getHKLFilePath ( self.inputDir() ),
                    meanF_labels,mtz_fpath,phases_labels,mtz_fname
                )
                mtz_fpath = mtz_fname
                struct_labels = meanF_labels + phases_labels
            if not struct0 or phases.dataId!=struct0.dataId:
                replaced.append ( "phases" )
            # else phases are taken from leading Structure/Substructure

        if len(ligands)>0:
            if len(ligands)>1:
                lib_fpath = self.stampFileName ( self.dataSerialNo,self.getOFName(".dict.cif") )
                self.dataSerialNo += 1
                lig_codes = makelib.makeLibrary ( self,ligands,lib_fpath )
            else:
                lib_fpath = ligands[0].getLibFilePath ( self.inputDir() )
                if ligands[0]._type=="DataLigand":
                    lig_codes = [ligands[0].code]
                else:
                    lig_codes = ligands[0].codes
            replaced.append ( "ligands" )

        if xyz:
            self.putMessage ( "<b>Macromolecular model to be taken from:&nbsp;</b> " + xyz.dname )
        if lig_codes:
            self.putMessage ( "<b>Ligands replaced:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</b> " +
                              ", ".join(lig_codes) )
        elif lib_fpath:
            self.putMessage ( "<b>Ligands to be taken from:&nbsp;&nbsp;&nbsp;&nbsp;</b> " + xyz.dname )
        if phases:
            self.putMessage ( "<b>Phases to be taken from:&nbsp;&nbsp;&nbsp;&nbsp;</b> " + phases.dname  )

        refiner = ""
        if struct0:
            refiner = struct0.refiner
        structure = self.registerStructure1 (  ###
                        self.outputFName,
                        None,
                        xyz_fpath,
                        sub_fpath,
                        mtz_fpath,
                        libPath    = lib_fpath,
                        mapPath    = map_fpath ,
                        dmapPath   = dmap_fpath,
                        leadKey    = 1 if phases is struct0 else 2,
                        copy_files = False,
                        refiner    = refiner 
                    )
        if structure:
            if lig_codes:
                structure.setLigands  ( lig_codes )
            if xyz_fpath:
                structure.addSubtypes ( xyz.getSubtypes() )
            if phases:
                structure.addSubtypes ( phases.getSubtypes() )
                structure.copyLabels  ( phases )
                if phases is not struct0:
                    structure.setHKLLabels ( hkl0 )
            if not xyz_fpath:
                structure.removeSubtype ( dtype_template.subtypeXYZ() )
                if phases:
                    structure.copyCrystData ( phases )
            self.putMessage  ( "<h2>New Structure Composed</h2>" )
            self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                      "Structure and electron density",
                                      structure )
            revision0.setStructureData ( structure )
            #revision.addSubtypes  ( revision0.getSubtypes() )
            self.registerRevision ( revision0 )

            # this will go in the project tree line
            summary_line = ""
            if len(replaced)>0:
                summary_line = ", ".join(replaced) + " replaced"
            if len(deleted)>0:
                if summary_line:
                    summary_line += "; "
                summary_line += ", ".join(deleted) + " deleted"
            self.generic_parser_summary["editrevision_struct"] = {
              "summary_line" : summary_line
            }

            # close execution logs and quit
            self.success ( True )

        else:
            #self.putMessage  ( "<b><i>Structure was not replaced (error)</i></b>" )
            # close execution logs and quit
            self.fail ( "<h3>Structure was not replaced (error)</h3>",
                        "Structure was not replaced" )

        return


# ============================================================================

if __name__ == "__main__":

    drv = EditRevisionStruct ( "",os.path.basename(__file__) )
    drv.start()
