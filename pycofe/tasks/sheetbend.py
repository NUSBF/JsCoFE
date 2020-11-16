##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    14.11.20   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Robert Nicholls,
#                Oleg Kovalevskyi 2017-2020
#
# ============================================================================
#

#  python native imports
import os
#import sys
#import uuid
#import shutil

#  application imports
from . import basic
#from   pycofe.dtypes    import dtype_template
#from   pycofe.proc      import qualrep
#from   pycofe.verdicts  import verdict_sheetbend

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
            "pdbin  " + istruct.getXYZFilePath(self.inputDir()),
            "pdbout " + xyzout,
            "colin-fo   /*/*/[" + istruct.FP + "," + istruct.SigFP + "]",
            "colin-free /*/*/[" + istruct.FreeR_flag + "]",
            "coord",
            "cycles " + str(sec1.NCYCLES.value),
            "refine-regularize-cycles 1",
            "resolution-by-cycle 6.0, 6.0, 3.0",
            "radius-scale 4.0"
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
                xyzout,
                istruct.getSubFilePath(self.inputDir()),
                istruct.getMTZFilePath(self.inputDir()),
                None,None,
                istruct.getLibFilePath(self.inputDir()),
                leadKey=istruct.leadKey,
                map_labels=istruct.mapLabels
            )
            if structure:

                #mmcifout = self.getMMCIFOFName()
                #if os.path.isfile(mmcifout):
                #    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )

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

                """
                rvrow0 = self.rvrow
                try:
                    meta = qualrep.quality_report ( self,revision )
                except:
                    meta = None
                    self.stderr ( " *** molprobity failure" )
                    self.rvrow = rvrow0 + 4

                if meta:
                    verdict_meta = {
                        "data"   : { "resolution" : hkl.getHighResolution(raw=True) },
                        "params" : {
                            "sheetbend" : {
                                "ncycles"    : sec1.NCYC.value,
                                "twinning"   : isTwinning,
                                "jellyBody"  : str(sec3.JELLY.value) == 'yes',
                                "ncsRestr"   : str(sec3.NCSR.value) == 'yes',
                                "tls"        : str(sec2.TLS.value) != 'none',
                                "anisoBfact" : str(sec2.BFAC.value) == "ANIS",
                                "hydrogens"  : str(sec1.MKHYDR.value) == "YES"
                            }
                        },
                        "molprobity" : meta,
                        "xyzmeta" : structure.xyzmeta
                    }
                    verdict_sheetbend.putVerdictWidget ( self,verdict_meta,verdict_row )
                """

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Sheetbend ( "",os.path.basename(__file__) )
    drv.start()
