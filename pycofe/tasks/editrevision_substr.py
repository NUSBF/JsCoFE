##!/usr/bin/python

# LEGACY CODE, ONLY USED IN OLD PROJECTS   05.09.20  v.1.4.014

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  EDIT SUBSTRUCTURE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python editrevision_substr.py jobManager jobDir jobId
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

class EditRevisionSubstr(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        revision0 = self.makeClass ( self.input_data.data.revision[0] )
        hkl0      = self.makeClass ( self.input_data.data.hkl0[0] )

        substr0   = None
        if hasattr(self.input_data.data,"substr0"):  # optional data parameter
            substr0 = self.makeClass ( self.input_data.data.substr0[0] )

        #sub = substr0  # this is current Substructure or None
        sub = None  # this is current Substructure or None
        if hasattr(self.input_data.data,"sub"):  # optional data parameter
            #  note this may be only Substructure
            sub = self.makeClass ( self.input_data.data.sub[0] )

        phases = substr0  # ground default
        #if sub._type==dtype_structure.dtype():
        #    phases = sub  # need to be in sync with sub by default
        if hasattr(self.input_data.data,"phases"):  # optional data parameter
            #  note this may be either Structure or Substructure, but not XYZ
            phases = self.makeClass ( self.input_data.data.phases[0] )


        # --------------------------------------------------------------------

        # redefine structure
        self.putMessage  ( "<h2>Compose new Substructure</h2>" )
        xyz_fpath  = None  #  will stay None as we edit only Substructure in this task
        sub_fpath  = None
        mtz_fpath  = None
        map_fpath  = None
        dmap_fpath = None
        lib_fpath  = None  #  will stay None as we edit only Substructure in this task
        replaced   = []
        deleted    = []

        if sub:
            sub_fpath = sub.getSubFilePath ( self.inputDir() )
            if not substr0 or sub.dataId!=substr0.dataId:
                replaced.append ( "substructure" )
        else:
            deleted.append ( "substructure" )

        if phases:
            mtz_fpath  = phases.getMTZFilePath ( self.inputDir() )
            map_fpath  = phases.getMapFilePath ( self.inputDir() )
            dmap_fpath = phases.getDMapFilePath( self.inputDir() )
            if phases is not substr0:
                meanF_labels    = hkl0.getMeanF()
                meanF_labels[2] = hkl0.getFreeRColumn()
                phases_labels   = phases.getPhaseLabels()
                mtz_fname       = phases.lessDataId ( phases.getMTZFileName() )
                self.makePhasesMTZ (
                    hkl0.getHKLFilePath ( self.inputDir() ),
                    meanF_labels,mtz_fpath,phases_labels,mtz_fname
                )
                mtz_fpath = mtz_fname
                substr_labels = meanF_labels + phases_labels
            if not substr0 or phases.dataId!=substr0.dataId:
                replaced.append ( "phases" )
            # else phases are taken from leading Structure/Substructure

        if sub:
            self.putMessage ( "<b>Heavy-atom substructure to be taken from:&nbsp;</b> "  + sub.dname     )
        if phases:
            self.putMessage ( "<b>Phases to be taken from:&nbsp;&nbsp;&nbsp;&nbsp;</b> " + phases.dname  )

        refiner = ""
        if substr0:
            refiner = substr0.refiner
        elif sub:
            refiner = sub.refiner
        substructure = self.registerStructure1 ( ###
                            self.outputFName,
                            None,
                            xyz_fpath ,
                            sub_fpath ,
                            mtz_fpath ,
                            libPath    = lib_fpath ,
                            mapPath    = map_fpath ,
                            dmapPath   = dmap_fpath,
                            leadKey    = 2,
                            copy_files = False,
                            refiner    = refiner 
                        )
        if substructure:
            if phases:
                substructure.addSubtypes ( phases.getSubtypes() )
                substructure.copyLabels  ( phases )
                if phases is not substr0:
                    substructure.setHKLLabels ( hkl0 )
            if not sub_fpath:
                if phases:
                    substructure.copyCrystData ( phases )
                # in case there was no substructure coordinates
                substructure.addSubtype ( dtype_template.subtypeSubstructure() )
                substructure.adjust_dname()

            self.putMessage  ( "<h2>New Substructure Composed</h2>" )
            self.putStructureWidget ( self.getWidgetId("substructure_btn_"),
                                      "Substructure and electron density",
                                      substructure )
            revision0.setStructureData ( substructure )
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
            self.generic_parser_summary["editrevision_substr"] = {
              "summary_line" : summary_line
            }

            # close execution logs and quit
            self.success ( True )

        else:
            #self.putMessage  ( "<b><i>Structure was not replaced (error)</i></b>" )
            # close execution logs and quit
            self.fail ( "<h3>Substructure was not replaced (error)</h3>",
                        "Substructure was not replaced" )

        return


# ============================================================================

if __name__ == "__main__":

    drv = EditRevisionSubstr ( "",os.path.basename(__file__) )
    drv.start()
