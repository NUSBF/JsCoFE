##!/usr/bin/python

#
# ============================================================================
#
#    22.09.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  REFMAC EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.refmac exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
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
# Make Refmac driver

class Refmac(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "refmac.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When refmac
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare refmac input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        with open(self.file_stdin_path(),'w') as scr_file:
            print >>scr_file, 'make hydr', str(self.task.parameters.sec1.contains.MKHYDR.value)
            print >>scr_file, 'ncyc'     , str(self.task.parameters.sec1.contains.NCYC.value)
            ncsrv = str(self.task.parameters.sec1.contains.NCSR.value)
            if ncsrv in ('local', 'global'):
                 print >>scr_file, 'ncsr', ncsrv

            if str(self.task.parameters.sec1.contains.RIDGE_YES.value) == 'yes':
                print >>scr_file, 'ridg dist sigm', self.task.parameters.sec1.contains.RIDGE_VAL.value

            if str(self.task.parameters.sec1.contains.WAUTO_YES.value) == 'yes':
                print >>scr_file, 'weight auto'

            else:
                print >>scr_file, 'weight matrix', self.task.parameters.sec1.contains.WAUTO_VAL.value

            if str(self.task.parameters.sec1.contains.TWIN.value) == 'yes':
                print >>scr_file, 'twin'

            print >>scr_file, "labin  FP=" + hkl.dataset.Fmean.value, \
                              " SIGFP=" + hkl.dataset.Fmean.sigma, \
                              " FREE=" + hkl.dataset.FREE

            print >>scr_file, 'end'

        #self.file_stdout.write ( "keywords=" + self.task.parameters.sec1.contains.KEYWORDS.value )

        self.file_stdin = 1 # a trick necessary because of using 'print' above

        # make command-line parameters for bare morda run on a SHELL-type node
        cmd = [ "hklin" ,hkl.getFilePath(self.inputDir()),
                "xyzin" ,istruct.getXYZFilePath(self.inputDir()),
                "hklout",self.getMTZOFName(),
                "xyzout",self.getXYZOFName(),
                "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += ["libin",libin]

        # Prepare report parser
        self.setGenericLogParser ( self.refmac_report(),False )

        # Start molrep
        self.runApp ( "refmac5",cmd )

        # check solution and register data
        if os.path.isfile(self.getXYZOFName()):

            self.putTitle ( "Refmac Output" )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            fnames = self.calcCCP4Maps ( self.getMTZOFName(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),self.getMTZOFName(),
                                                 fnames[0],fnames[1],libin )
            if structure:
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setRefmacLabels    ( hkl     )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
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

    drv = Refmac ( "",os.path.basename(__file__) )
    drv.start()
