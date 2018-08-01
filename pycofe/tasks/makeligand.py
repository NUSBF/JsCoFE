##!/usr/bin/python

#
# ============================================================================
#
#    30.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ACEDRG EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.makeligand exeType jobDir jobId
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

#  application imports
import basic


# ============================================================================
# Make Refmac driver

class MakeLigand(basic.TaskDriver):

    def smiles_file_path(self): return "smiles.smi"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare makeligand input
        # fetch input data

        sourceKey = self.getParameter ( self.task.parameters.SOURCE_SEL )

        if sourceKey == "S":
            smiles = self.getParameter ( self.task.parameters.SMILES )
            code   = self.getParameter ( self.task.parameters.CODE   ).upper()

            f = open ( self.smiles_file_path(),'w' )
            f.write  ( smiles + '\n' )
            f.close  ()

            # make command-line parameters
            cmd = [ "-i",self.smiles_file_path(),
                    "-r",code,"-o",code ]

        else:
            code = self.getParameter ( self.task.parameters.CODE3 ).upper()
            cmd = [ "-c",os.path.join(os.environ["CCP4"],"lib","data","monomers",
                                      code[0].lower(),code + ".cif" ),
                    "-r",code,"-o",code ]

        if self.outputFName == "":
            self.outputFName = code.upper()

        # Start makeligand
        if sys.platform.startswith("win"):
            self.runApp ( "acedrg.bat",cmd )
        else:
            self.runApp ( "acedrg",cmd )

        xyzPath = code + ".pdb"
        cifPath = code + ".cif"

        self.finaliseLigand ( code,xyzPath,cifPath )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = MakeLigand ( "",os.path.basename(__file__) )
    drv.start()
