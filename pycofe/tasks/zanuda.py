##!/usr/bin/python

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ZANUDA EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python zanuda.py jobManager jobDir jobId
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
import sys
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
        xyz = self.makeClass ( self.input_data.data.struct[0] )

        # prepare mtz with needed columns -- this is necessary because BALBES
        # does not have specification of mtz columns on input (labin)

        labels  = ( hkl.dataset.Fmean.value,hkl.dataset.Fmean.sigma )
        cad_mtz = os.path.join ( self.inputDir(),"cad.mtz" )

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\nEND\n" %labels )
        self.close_stdin ()
        cmd = [ "HKLIN1",hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd,logType="Service" )

        # make command-line parameters for bare morda run on a SHELL-type node
        cmd = [ os.path.join(os.environ["CCP4"],"bin","zanuda"),
                "hklin" ,cad_mtz,
                "xyzin" ,xyz.getXYZFilePath(self.inputDir()),
                "hklout",self.getMTZOFName(),
                "xyzout",self.getXYZOFName(),
                "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) ]

        if self.task.parameters.sec1.contains.AVER_CBX.value:
            cmd.append ( "aver" )

        if self.task.parameters.sec1.contains.NOTWIN_CBX.value:
            cmd.append ( "notwin" )

        # run zanuda
        #self.runApp ( "zanuda",cmd,logType="Main" )
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )

        # check solution and register data
        have_results = False
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
            #fnames = self.calcCCP4Maps ( mtzfile,self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure ( self.getXYZOFName(),None,mtzfile,
                                                 None,None,None,
                                                 #fnames[0],fnames[1],None,  -- not needed for new UglyMol
                                                 leadKey=1 )
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
                have_results = True

            else:
                self.putTitle   ( "Failed to create Structure" )
                self.putMessage ( "This is likely to be a program bug, please " +\
                        "report to developer or maintainer" )

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Zanuda ( "",os.path.basename(__file__) )
    drv.start()
