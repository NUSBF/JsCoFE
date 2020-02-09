##!/usr/bin/python

#  LEGACY CODE TO BE REMOVED.  20.11.19  v.1.4.003

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MATTHEWS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python editrevision.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.dtypes  import dtype_structure
from  pycofe.tasks   import asudef
from  pycofe.proc    import makelib


# ============================================================================
# Make EditRevision driver

class EditRevision(asudef.ASUDef):

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the TEMPORARY XML file.
        if os.path.isfile(self.getXMLFName()):
            os.remove(self.getXMLFName())

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )
        struct0   = None
        if hasattr(self.input_data.data,"struct0"):  # optional data parameter
            struct0 = self.makeClass ( self.input_data.data.struct0 [0] )

        associated_data_list = []
        change_list          = []  # receives a list of changes required

        hkl = None
        if hasattr(self.input_data.data,"hkl"):  # optional data parameter
            hkl = self.makeClass ( self.input_data.data.hkl[0] )
            associated_data_list.append ( hkl )
            change_list.append ( 'hkl' )
        else:
            hkl = self.makeClass ( self.input_data.data.hkl0[0] )

        seq = []
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            for s in self.input_data.data.seq:
                seq.append ( self.makeClass(s) )
                associated_data_list.append ( seq[-1] )
            change_list.append ( 'seq' )
        else:
            for s in self.input_data.data.seq0:
                seq.append ( self.makeClass(s) )

        xyz = struct0  # this is leading Structure/Substructure or None
        if hasattr(self.input_data.data,"xyz"):  # optional data parameter
            xyz = self.makeClass ( self.input_data.data.xyz[0] )
            #  note this may be XYZ, Structure or Substructure
            associated_data_list.append ( xyz )
            change_list.append ( 'xyz' )

        phases = struct0  # ground default
        if xyz._type==dtype_structure.dtype():
            phases = xyz  # need to be in sync with xyz by default
        if hasattr(self.input_data.data,"phases"):  # optional data parameter
            phases = self.makeClass ( self.input_data.data.phases[0] )
            #  note this may be either Structure or Substructure, but not XYZ
            associated_data_list.append ( phases )
            change_list.append ( 'phases' )

        ligands = []
        if hasattr(self.input_data.data,"ligand"):  # optional data parameter
            for lig in self.input_data.data.ligand:
                ligands.append ( self.makeClass(lig) )
                associated_data_list.append ( ligands[-1] )
            change_list.append ( 'lig' )


        # --------------------------------------------------------------------

        revision = None

        if 'hkl' in change_list or 'seq' in change_list:
            #  redefine HKL and ASU
            self.putMessage  ( "<h2>Compose new Asummetric Unit</h2>" )
            rev = asudef.makeRevision ( self,hkl,seq, "P","NR",1,1.0,"",
                                        revision0=revision0 )
            if rev:
                revision = rev[0]
        else:
            revision = revision0

        have_results = False

        if revision:  # should be always True

            if 'xyz' in change_list or 'phases' in change_list or 'lig' in change_list:
                # redefine structure
                self.putMessage  ( "<h2>Compose new Structure</h2>" )
                xyz_fpath  = None
                sub_fpath  = None
                mtz_fpath  = None
                map_fpath  = None
                dmap_fpath = None
                lib_fpath  = None
                lig_codes  = None
                if xyz:
                    xyz_fpath = xyz.getXYZFilePath ( self.inputDir() )
                    if xyz._type==dtype_structure.dtype():
                        sub_fpath = xyz.getSubFilePath ( self.inputDir() )
                        lib_fpath = xyz.getLibFilePath ( self.inputDir() )
                    # Either xyz_path or sub_path get defined here, which will
                    # replace Structure or Substructure, respectively

                if phases:
                    mtz_fpath  = phases.getMTZFilePath ( self.inputDir() )
                    map_fpath  = phases.getMapFilePath ( self.inputDir() )
                    dmap_fpath = phases.getDMapFilePath( self.inputDir() )
                    if 'phases' in change_list:
                        meanF_labels    = hkl.getMeanF()
                        meanF_labels[2] = hkl.getFreeRColumn()
                        phases_labels   = phases.getPhaseLabels()
                        mtz_fname       = phases.lessDataId ( phases.getMTZFileName() )
                        self.makePhasesMTZ (
                            hkl.getHKLFilePath(self.inputDir()),meanF_labels,
                            mtz_fpath,phases_labels,mtz_fname )
                        mtz_fpath = mtz_fname
                        struct_labels = meanF_labels + phases_labels
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

                structure = self.registerStructure1 (
                                xyz_fpath ,
                                sub_fpath ,
                                mtz_fpath ,
                                map_fpath ,
                                dmap_fpath,
                                lib_fpath ,
                                self.outputFName,
                                leadKey=2 if 'phases' in change_list else 1,
                                copy_files=False )
                if structure:
                    if lig_codes:
                        structure.setLigands  ( lig_codes )
                    if xyz:
                        structure.addSubtypes ( xyz.getSubtypes() )
                    if phases:
                        structure.addSubtypes ( phases.getSubtypes() )
                        structure.copyLabels  ( phases )
                        if 'phases' in change_list:
                            structure.setHKLLabels ( hkl )
                    self.putStructureWidget ( self.getWidgetId("structure_btn_"),
                                              "Structure and electron density",
                                              structure )
                    revision.setStructureData ( structure )
                else:
                    self.putMessage  ( "<b><i>Structure was not replaced (error)</i></b>" )

            revision.addSubtypes  ( revision0.getSubtypes() )
            self.registerRevision ( revision  )
            have_results = True

        else:
            self.putTitle   ( "Revision was not produced" )
            self.putMessage ( "This is likely to be a program bug, please " +\
                              "report to the maintainer" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = EditRevision ( "",os.path.basename(__file__) )
    drv.start()
