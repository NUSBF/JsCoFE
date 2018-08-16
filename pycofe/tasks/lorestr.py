##!/usr/bin/python

#
# ============================================================================
#
#    09.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.lorestr exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid

#  application imports
import basic


# ============================================================================
# Make Lorestr driver

class Lorestr(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "lorestr.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When lorestr
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare lorestr input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl[0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        if hasattr(self.input_data.data,"rstruct"):  # optional data parameter
            rstruct = self.input_data.data.rstruct
        else:
            rstruct = []

        # Prepare report parser
        #self.setGenericLogParser ( self.lorestr_report(),False )

        cmd = [ "-p1",istruct.getXYZFilePath(self.inputDir()),
                "-f" ,hkl.getHKLFilePath(self.inputDir()) ]

        if len(rstruct)>0:
            cmd += ["-p2"]
            for s in rstruct:
                cs = self.makeClass ( s )
                cmd += [cs.getXYZFilePath(self.inputDir())]

        cmd += [ "-save_space",
                 "-xyzout",self.getXYZOFName(),
                 "-hklout",self.getMTZOFName(),
                 "-labin" ,"FP="     + hkl.dataset.Fmean.value +
                           " SIGFP=" + hkl.dataset.Fmean.sigma +
                           " FREE="  + hkl.dataset.FREE
                ]

        if self.getParameter(self.task.parameters.sec1.contains.PDB_CBX)=="True":
            cmd += [ "-auto" ]

        minres = self.getParameter(self.task.parameters.sec1.contains.MINRES)
        if minres:
            cmd += [ "-minres",minres ]

        if self.getParameter(self.task.parameters.sec1.contains.DNA_CBX)=="True":
            cmd += [ "-dna" ]

        if self.getParameter(self.task.parameters.sec1.contains.MR_CBX)=="True":
            cmd += [ "-mr" ]

        cmd += ["-xml","lorestr.xml"]

        # Start lorestr
        if sys.platform.startswith("win"):
            self.runApp ( "lorestr.bat",cmd )
        else:
            self.runApp ( "lorestr",cmd )

        # check solution and register data
        if os.path.isfile(self.getXYZOFName()):

            self.putTitle ( "Lorestr Output" )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),None,self.getMTZOFName(),
                                                 fnames[0],fnames[1],None )
            if structure:
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( hkl     )
                structure.copySubtype        ( istruct )
#               structure.copyLigands        ( istruct )
                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Lorestr ( "",os.path.basename(__file__) )
    drv.start()
