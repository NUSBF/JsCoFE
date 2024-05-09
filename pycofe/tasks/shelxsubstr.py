##!/usr/bin/python

#
# ============================================================================
#
#    15.07.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHELX-SUBSTRUCTURE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.shelxsubstr.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2022
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  application imports
from pycofe.dtypes import dtype_template
from pycofe.tasks  import crank2


"""

mtz2various HKLIN ../../../input/0001-03.mtz HKLOUT 0001-03_MTZ2V.hkl << END
OUTP shelx
LABI F(+)=F(+) SIGF(+)=SIGF(+) F(-)=F(-) SIGF(-)=SIGF(-)
END

shelxc SHELX << END
NTRY 2000
FIND 12
SHEL 999.0 3.23
MIND -3.0 3
CELL 107.589 61.399 71.203 90.0 97.761 90.0
SPAG C 1 2 1
SFAC SE
SAD -f convert/0001-03_MTZ2V.hkl
END

shelxd ../0-faest/SHELX_fa << END
NTRY 2000
FIND 12
SHEL 999.0 3.23
MIND -3.0 3
END


"""

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

        self.rvrow += 20

        hkls = self.pickHKL()
        if not hkls:
            self.putMessage ( "<b><i>Error: cannot select dataset</i></b><p>" +\
                              "<i>Please contact developer</i>" )
            self.flush()
            return

        rvrow0 = self.rvrow
        self.putTitle ( "Substructure Found" )
        structure = self.finaliseStructure ( self.xyzout_fpath,self.outputFName,
                                             hkls,None,[],1,
                                             leadKey=1, # openState="closed",
                                             title="" )
        revisions = []

        if structure:

            self.putMessage ( "&nbsp;" )

            anom_structure = self.finaliseAnomSubstructure ( self.xyzout_fpath,
                                        "anom_substructure",hkls,[],"" )
                                        # openState="hidden" )
            if anom_structure:
                anom_structure.setAnomSubstrSubtype() # substructure
                anom_structure.setHLLabels()
            else:
                self.putMessage ( "Anomalous substructure calculations failed." )

            # finalise output revision(s)
            # remove Refmac results from structure:
            shutil.copy2 ( hkls.getHKLFilePath(self.inputDir()),self.outputDir() )
            xyz_file = structure.getSubFileName()
            structure.removeFiles()
            structure.setSubFile ( xyz_file )
            #structure.setMTZFile ( hkls.getHKLFileName() )  -- no maps, substructure is not phased
            structure.removeSubtype ( dtype_template.subtypePhases() )
            revisions = super ( ShelxSubstr,self ).finalise ( structure )

        else:
            self.rvrow = rvrow0
            self.putTitle ( "No Substructure Found" )
            for i in range(10):
                self.putTitle ( "&nbsp;" )

        self.flush()

        return revisions


# ============================================================================

if __name__ == "__main__":

    drv = ShelxSubstr ( "",os.path.basename(__file__) )
    drv.start()
