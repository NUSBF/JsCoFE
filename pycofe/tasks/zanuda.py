##!/usr/bin/python

#
# ============================================================================
#
#    02.11.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ZANUDA EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python zanuda.py exeType jobDir jobId
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
import uuid

#  application imports
import basic
from   pycofe.proc   import xyzmeta


# ============================================================================
# Make Zanuda driver

class Zanuda(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated HKL dataset(s)
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When zanuda
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Prepare zanuda input
        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        xyz = self.input_data.data.struct[0]

        # prepare mtz with needed columns -- this is necessary because BALBES
        # does not have specification of mtz columns on input (labin)

        labels  = ( hkl.dataset.Fmean.value,hkl.dataset.Fmean.sigma )
        cad_mtz = os.path.join ( self.inputDir(),"cad.mtz" )

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",os.path.join(self.inputDir(),hkl.files[0]),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd )

        # make command-line parameters for bare morda run on a SHELL-type node
        cmd = [ "hklin" ,cad_mtz,
                "xyzin" ,os.path.join(self.inputDir(),xyz.files[0]),
                "hklout",self.getMTZOFName(),
                "xyzout",self.getXYZOFName(),
                "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        if self.task.parameters.sec1.contains.AVER_CBX.value:
            cmd.append ( "aver" )

        if self.task.parameters.sec1.contains.NOTWIN_CBX.value:
            cmd.append ( "notwin" )

        # run zanuda
        self.runApp ( "zanuda",cmd )

        # check solution and register data
        if os.path.isfile(self.getXYZOFName()):

            self.unsetLogParser()

            mtzfile = self.getMTZOFName()
            sol_hkl = hkl

            meta = xyzmeta.getXYZMeta ( self.getXYZOFName(),self.file_stdout,
                                        self.file_stderr )
            if "cryst" in meta:
                sol_spg    = meta["cryst"]["spaceGroup"]
                spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                if spg_change:
                    mtzfile = spg_change[0]
                    sol_hkl = spg_change[1]
                else:
                    self.putMessage ( "<font size='+1'><b>Space Group confirmed as " +\
                              sol_spg + "</b></font>" )

            # calculate maps for UglyMol using final mtz from temporary location
            fnames = self.calcCCP4Maps ( mtzfile,self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),mtzfile,
                                                 fnames[0],fnames[1],None )
            if structure:

                self.putTitle ( "Output Structure" )
                #structure.addDataAssociations ( [hkl,xyz] )
                structure.setRefmacLabels ( sol_hkl )
                structure.copySubtype     ( xyz )

                self.putStructureWidget   ( "structure_btn",
                                            "Structure and electron density",
                                            structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setReflectionData ( sol_hkl   )
                revision.setStructureData  ( structure )
                self.registerRevision      ( revision  )

            else:
                self.putTitle   ( "Failed to create Structure" )
                self.putMessage ( "This is likely to be a program bug, please " +\
                        "report to developer or maintainer" )

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Zanuda ( "",os.path.basename(__file__) )
    drv.start()
