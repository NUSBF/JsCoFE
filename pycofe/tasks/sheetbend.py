##!/usr/bin/python

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHEETBEND EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.sheetbend jobManager jobDir jobId
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
from . import basic

# ============================================================================
# Make Sheetbend driver

class Sheetbend(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "sheetbend.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When sheetbend
        # succeeds, this file is created.
        xyzout = self.getXYZOFName()
        if os.path.isfile(xyzout):
            os.remove(xyzout)

        # Prepare sheetbend input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        sec1 = self.task.parameters.sec1.contains

        self.open_stdin  ()
        self.write_stdin ([
            "mtzin  " + hkl.getHKLFilePath(self.inputDir()),
            "pdbin  " + istruct.getPDBFilePath(self.inputDir()),
            "pdbout " + xyzout,
            "colin-fo   /*/*/[" + istruct.FP + "," + istruct.SigFP + "]",
            "colin-free /*/*/[" + istruct.FreeR_flag + "]",
            "coord",
            "cycles " + str(sec1.NCYCLES.value),
            "postrefine-u-iso",
            "pseudo-regularize",
            "refine-regularize-cycles 3",
            #"resolution-by-cycle 6.0, 6.0, 3.0",
            "resolution-by-cycle 6.0, 3.0",
            "radius-scale 4.0"
            # "radius-scale 2.5"
        ])
        self.close_stdin ()

        self.runApp ( "csheetbend",['-stdin'],logType="Main" )

        # check solution and register data
        have_results = False
        if os.path.isfile(xyzout):

            #verdict_row = self.rvrow
            self.rvrow += 4

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure (
                            None,
                            xyzout,
                            istruct.getSubFilePath(self.inputDir()),
                            istruct.getMTZFilePath(self.inputDir()),
                            libPath    = istruct.getLibFilePath(self.inputDir()),
                            leadKey    = istruct.leadKey,
                            map_labels = istruct.mapLabels,
                            refiner    = istruct.refiner
                        )
            if structure:

                #mmcifout = self.getMMCIFOFName()
                #if os.path.isfile(mmcifout):
                #    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )

                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                structure.addPhasesSubtype   ()
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Sheetbend ( "",os.path.basename(__file__) )
    drv.start()
