##!/usr/bin/python

#
# ============================================================================
#
#    25.07.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.csymmatch jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2023
#
# ============================================================================
#

#  python native imports
import os
#import sys
import pyrvapi

#  application imports
from . import basic


# ============================================================================
# Make SymMatch driver

class SymMatch(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):


        # Prepare csymmatch input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl      [0] )
        istruct = self.makeClass ( self.input_data.data.istruct  [0] )
        rstruct = self.makeClass ( self.input_data.data.refstruct[0] )

        cmd_params = []
        st_radius  = self.getParameter ( self.task.parameters.sec1.contains.RADIUS )
        if st_radius:
            cmd_params += [ "-connectivity-radius",st_radius ]
        if self.getParameter(self.task.parameters.sec1.contains.ORIGINS_CBX)=="True":
            cmd_params += [ "-origin-hand" ]

        ref_file_path = rstruct.getPDBFilePath ( self.inputDir() )
        if not ref_file_path and rstruct._type=="DataStructure":
            ref_file_path = rstruct.getSubFilePath ( self.inputDir() )

        inp_file_path = istruct.getPDBFilePath ( self.inputDir() )
        structureType = 0
        if not inp_file_path:
            inp_file_path = istruct.getSubFilePath ( self.inputDir() )
            structureType = 1

        out_suffix    = "_" + self.outputFName
        out_file_path = istruct.lessDataId ( os.path.basename(inp_file_path) )
        basename,ext  = os.path.splitext ( out_file_path )
        if not basename.endswith(out_suffix):
            basename     += out_suffix
            out_file_path = basename + ext

        cmd = [ "-pdbin-ref", ref_file_path,
                "-pdbin"    , inp_file_path,
                "-pdbout"   , out_file_path ]

        st_radius  = self.getParameter ( self.task.parameters.sec1.contains.RADIUS )
        if st_radius:
            cmd += [ "-connectivity-radius",st_radius ]
        if self.getParameter(self.task.parameters.sec1.contains.ORIGINS_CBX)=="True":
            cmd += [ "-origin-hand" ]

        # start csymmatch
        self.runApp ( "csymmatch",cmd,logType="Main" )

        # check solution and register data
        have_results = False
        if os.path.isfile(out_file_path):

            self.putTitle ( "SymMatch Output" )
            self.unsetLogParser()

            structure = self.finaliseStructure ( out_file_path,basename,hkl,None,
                                                 [],structureType,leadKey=1,
                                                 # openState="closed",
                                                 title="",
                                                 stitle="Symmetry matched structure and<br>electron density" )

            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( None if str(hkl.useHKLSet) in ["Fpm","TI"] else hkl )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
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

    drv = SymMatch ( "",os.path.basename(__file__) )
    drv.start()
