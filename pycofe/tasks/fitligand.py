##!/usr/bin/python

#
# ============================================================================
#
#    30.07.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FITLIGAND EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.fitligand exeType jobDir jobId
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
from   proc  import coor


# ============================================================================
# Make Refmac driver

class FitLigand(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare makeligand input
        # fetch input data

        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        ligand  = self.makeClass ( self.input_data.data.ligand [0] )
        sec1    = self.task.parameters.sec1.contains

        # make command-line parameters
        pdbin   = istruct.getXYZFilePath ( self.inputDir() )
        mtzin   = istruct.getMTZFilePath ( self.inputDir() )
        libin   = ligand .getLibFilePath ( self.inputDir() )
        cmd = [ "--pdbin"       ,pdbin,
                "--hklin"       ,mtzin,
                "--dictionary"  ,libin,
                "--f"           ,istruct.DELFWT,
                "--phi"         ,istruct.PHDELWT,
                "--clusters"    ,self.getParameter(sec1.NCLUST),
                "--fit-fraction",self.getParameter(sec1.FIT_FRACTION)
              ]

        if self.getParameter(sec1.LEVEL_SEL)=="sigma":
            cmd +=["--sigma",self.getParameter(sec1.SIGMA)]
        else:
            cmd +=["--absolute",self.getParameter(sec1.ABSOLUTE)]

        if self.getParameter(sec1.FLEXIBLE_CBX)=="True":
            cmd +=["--flexible","--samples",self.getParameter(sec1.SAMPLES)]

        cmd += [ligand.getXYZFilePath(self.inputDir())]

        """
        --pdbin pdb-in-filename --hklin mtz-filename
        --f f_col_label --phi phi_col_label
        --clusters nclust
        --sigma sigma-level
        --absolute level
        --fit-fraction frac
        --flexible
        --samples nsamples
        --sampling-rate map-sampling-rate
        --dictionary cif-dictionary-name
        """

        # Start findligand
        if sys.platform.startswith("win"):
            self.runApp ( "findligand.bat",cmd )
        else:
            self.runApp ( os.path.join(os.environ["CCP4"],"libexec","findligand-bin"),cmd )

        ligands = [fn for fn in os.listdir("./") if fn.endswith(".pdb")]
        if len(ligands)>0:

            # prepare dictionary file for structure
            libadd = libin
            libstr = istruct.getLibFilePath ( self.inputDir() )
            if libstr and not ligand.code in istruct.ligands:
                # this is not the first ligand in structure, append it to
                # the previous one(s) with libcheck

                libadd = self.outputFName + ".dict.cif"

                self.open_stdin()
                self.write_stdin (
                    "_Y"          +\
                    "\n_FILE_L  " + libstr +\
                    "\n_FILE_L2 " + libin  +\
                    "\n_FILE_O  " + libadd +\
                    "\n_END\n" )
                self.close_stdin()

                self.runApp ( "libcheck",[] )

                libadd += ".lib"

            pdbout = self.outputFName + ".pdb"
            nligs  = coor.mergeLigands ( pdbin,ligands,"X",pdbout )
            structure = self.registerStructure ( pdbout,None,mtzin,
                                istruct.getMapFilePath (self.inputDir()),
                                istruct.getDMapFilePath(self.inputDir()),
                                libadd )
            if structure:
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.addLigands       ( ligand.code )
                self.putTitle ( "Results" )
                self.putMessage ( "<b>Total " + str(nligs) + " '" + ligand.code +\
                                  "' ligands were fitted</b><br>&nbsp;" )
                self.putStructureWidget ( "structure_btn_",
                                          "Structure and electron density",
                                          structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                revision.addLigandData    ( ligand    )
                self.registerRevision     ( revision  )

        else:
            self.putTitle ( "Ligand " + ligand.code + " could not be fit in density" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = FitLigand ( "",os.path.basename(__file__) )
    drv.start()
