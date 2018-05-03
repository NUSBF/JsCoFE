##!/usr/bin/python

#
# ============================================================================
#
#    23.01.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHELX-SUBSTRUCTURE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.shelxsubstr.py exeType jobDir jobId
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
import shutil

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers

#  application imports
from pycofe.dtypes import dtype_revision
from pycofe.tasks  import crank2


# ============================================================================
# Make ShelxSubstr driver

class ShelxSubstr(crank2.Crank2):

    # ------------------------------------------------------------------------

    def configure ( self ):

        # --------------------------------------------------------------------
        # Make crank-2 configuration

        # Identify the type of experiment

        self.expType = "SAD"
        if len(self.hkl) > 1:
            self.expType = "MAD"
        elif self.native != None:
            if self.native.useForPhasing:
                self.expType = "SIRAS"

        # Put input datasets and experiment type

        for hkli in self.hkl:
            self.add_anomset ( hkli )

        self.pmodel = None

        self.config.append ( "target::" + self.expType )

        # configure the pipeline

        self.add_nativeset ()
        self.add_model     ()
        self.add_createfree()
        self.add_faest     ()
        self.add_substrdet ()
        #self.add_phas      ()

        """
        if self.expType == "MAD":
            self.add_phas()

        elif self.expType == "SIRAS":
            self.add_phas()

        else:
            self.add_refatompick
        """

        return



    # ------------------------------------------------------------------------

    def finalise(self):

        """
        # add FreeR_flag to the resulting mtz
        cad_mtz = "cad.mtz"

        self.open_stdin  ()
        self.write_stdin ( "LABIN FILE 1 E1=FreeR_flag\n" )
        self.write_stdin ( "LABIN FILE 2 allin\n" )
        self.close_stdin ()

        cmd = [ "HKLIN1",os.path.join(self.inputDir(),self.hkl[0].files[0]),
                "HKLIN2",self.hklout_fpath,
                "HKLOUT",cad_mtz ]
        self.runApp ( "cad",cmd )
        os.rename ( cad_mtz,self.hklout_fpath )

        mappath = os.path.join ( self.reportDir(),"3-phas","convert","fft.map" )
        if os.path.isfile(mappath):
            shutil.copy2 ( mappath,self.hklout_fpath+".map" )
        """


        hkls = None
        for hkli in self.hkl:
            if not hkls:
                hkls = hkli
            elif hkli.wtype=="peak":
                hkls = hkli
                break
            elif hkli.wtype=="inflection":
                hkls = hkli

        self.rvrow += 20
        rvrow0 = self.rvrow
        self.putTitle ( "Substructure Found" )
        structure = self.finaliseStructure ( self.xyzout_fpath,self.outputFName,
                                             hkls,None,[],0,False,"" )
        if structure:

            self.putMessage ( "&nbsp;" )

            anom_structure = self.finaliseAnomSubstructure ( self.xyzout_fpath,
                                        "anom_substructure",hkls,[],"",False )
            if anom_structure:
                anom_structure.setAnomSubstrSubtype() # substructure
                anom_structure.setHLLabels()
            else:
                self.putMessage ( "Anomalous substructure calculations failed." )

            # finalise output revision(s)
            super ( ShelxSubstr,self ).finalise ( structure )

            """
            if self.structure:

                self.putTitle ( "Substructure Found" )

                self.putStructureWidget ( "structure_btn",
                            "Structure and electron density",self.structure,-1 )
                self.putMessage ( "&nbsp;" )

                hkls = None
                for hkli in self.hkl:
                    if not hkls:
                        hkls = hkli
                    elif hkli.wtype=="peak":
                        hkls = hkli
                        break
                    elif hkli.wtype=="inflection":
                        hkls = hkli

                structure = self.finaliseAnomSubstructure (
                            os.path.join(self.outputDir(),self.structure.files[0]),
                            "anom_substructure",hkls,[],"",False )
                if structure:
                    structure.setAnomSubstrSubtype() # substructure
                    structure.setHLLabels()

            else:
                self.putTitle ( "No Substructure Found" )
            """


        else:
            self.rvrow = rvrow0
            self.putTitle ( "No Substructure Found" )
            for i in range(10):
                self.putTitle ( "&nbsp;" )

        """
        structure = self.finaliseAnomSubstructure (
                    self.xyzout_fpath,
                    "anom_substructure",hkls,[],"",False )
        if structure:
            structure.setAnomSubstrSubtype() # substructure
            structure.setHLLabels()


        # finalise output structure
        super ( ShelxSubstr,self ).finalise()

        if self.structure:

            self.putTitle ( "Substructure Found" )

            self.putStructureWidget ( "structure_btn",
                        "Structure and electron density",self.structure,-1 )
            self.putMessage ( "&nbsp;" )

            hkls = None
            for hkli in self.hkl:
                if not hkls:
                    hkls = hkli
                elif hkli.wtype=="peak":
                    hkls = hkli
                    break
                elif hkli.wtype=="inflection":
                    hkls = hkli

            structure = self.finaliseAnomSubstructure (
                        os.path.join(self.outputDir(),self.structure.files[0]),
                        "anom_substructure",hkls,[],"",False )
            if structure:
                structure.setAnomSubstrSubtype() # substructure
                structure.setHLLabels()

        else:
            self.putTitle ( "No Substructure Found" )
        """

        self.flush()

        return


# ============================================================================

if __name__ == "__main__":

    drv = ShelxSubstr ( "",os.path.basename(__file__) )
    drv.start()
