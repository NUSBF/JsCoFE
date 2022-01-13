##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    22.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FITWATERS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.fitwaters jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from . import basic
from   pycofe.proc   import coor
from   pycofe.dtypes import dtype_revision
from   pycofe.auto   import auto

# ============================================================================
# Make Refmac driver

class FitWaters(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare findwaters input
        # fetch input data

        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        sec1    = self.task.parameters.sec1.contains

        # make command-line parameters
        pdbin   = istruct.getXYZFilePath ( self.inputDir() )
        mtzin   = istruct.getMTZFilePath ( self.inputDir() )
        watout  = "waters.pdb"
        cmd = [ "--pdbin" ,pdbin,
                "--hklin" ,mtzin,
                "--pdbout",watout,
                "--sigma" ,self.getParameter(sec1.SIGMA)
              ]

        if istruct.mapSel=="diffmap":
            cmd += [
                "--f"     ,istruct.DELFWT,
                "--phi"   ,istruct.PHDELWT,
            ]
        else:
            cmd += [
                "--f"     ,istruct.FWT,
                "--phi"   ,istruct.PHI,
            ]

        #    self.PHI      = ""
        #    self.FOM      = ""


        if self.getParameter(sec1.FLOOD_CBX)=="True":
            cmd += [ "--flood","--flood-atom-radius",
                     self.getParameter(sec1.FLOOD_RADIUS) ]
        #else:
        #    cmd += [ "--min-dist"    ,self.getParameter(sec1.MIN_DIST),
        #             "--max-dist"    ,self.getParameter(sec1.MAX_DIST) ]

        # Start findwaters
        if sys.platform.startswith("win"):
            self.runApp ( "findwaters.bat",cmd,logType="Main" )
        else:
            self.runApp ( "findwaters",
                          cmd,logType="Main" )

        pdbout  = self.outputFName + ".pdb"
        nwaters = coor.mergeLigands ( pdbin,[watout],"W",pdbout )
        have_results = False
        if nwaters>0:
            structure = self.registerStructure ( pdbout,None,mtzin,
                            istruct.getMapFilePath (self.inputDir()),
                            istruct.getDMapFilePath(self.inputDir()),
                            istruct.getLibFilePath (self.inputDir()),
                            leadKey=istruct.leadKey,
                            refiner=istruct.refiner )
            if structure:
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.addWaterSubtype  ()
                self.putTitle   ( "Results" )
                self.putMessage ( "<b>Total " + str(nwaters) +\
                                  " water molecules were fitted</b><br>&nbsp;" )
                self.putStructureWidget ( "structure_btn_",
                                          "Structure and electron density",
                                          structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True
                auto.makeNextTask ( self,{
                    "revision" : revision,
                    "nwaters"  : str(nwaters)
                })


        else:
            self.putTitle ( "No water molecules were found and fitted." )

        # this will go in the project tree job's line
        self.generic_parser_summary["fitwaters"] = {
          "summary_line" : "N<sub>waters</sub>=" + str(nwaters)
        }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = FitWaters ( "",os.path.basename(__file__) )
    drv.start()
