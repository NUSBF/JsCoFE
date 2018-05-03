##!/usr/bin/python

#
# ============================================================================
#
#    06.03.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  DEPOSITION EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.deposition exeType jobDir jobId
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
from proc import valrep


# ============================================================================
# Make Deposition driver

class Deposition(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "deposition.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When deposition
        # succeeds, this file is created.
        if os.path.isfile(self.getCIFOFName()):
            os.remove(self.getCIFOFName())

        # Prepare deposition input
        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        seq     = self.input_data.data.seq
        for i in range(len(seq)):
            seq[i] = self.makeClass ( seq[i] )

        self.open_stdin()
        self.write_stdin ( "pdbout format mmcif\n" +
                           "make hydrogen YES hout YES\n" +
                           "ncyc 0\n"   +
                           "labin  FP=" + hkl.dataset.Fmean.value +
                           " SIGFP="    + hkl.dataset.Fmean.sigma +
                           " FREE="     + hkl.dataset.FREE + "\n" +
                           "end\n" )
        self.close_stdin()

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

        # Start refmac
        self.runApp ( "refmac5",cmd )

        modelFilePath = os.path.splitext(self.getXYZOFName())[0] + ".cif"
        fin  = open ( self.getXYZOFName(),"r" )
        fout = open ( modelFilePath,"wt" )
        for line in fin:
            if line.startswith("_symmetry.entry_id"):
                fout.write ( "_exptl.entry_id          XXXX\n" +
                             "_exptl.method            'X-RAY DIFFRACTION'\n" +
                             "_exptl.crystals_number   ?\n" +
                             "#\n" +
                             "_exptl_crystal.id                    1\n" +
                             "_exptl_crystal.density_meas          ?\n" +
                             "_exptl_crystal.density_Matthews      2.33\n" +
                             "_exptl_crystal.density_percent_sol   47.15\n" +
                             "_exptl_crystal.description           ?\n" +
                             "#\n"
                            )
            fout.write ( line )
        fin .close()
        fout.close()

        #os.rename ( self.getXYZOFName(),modelFilePath )

        # Prepare CIF with structure factors

        anomcols  = hkl.getAnomalousColumns()
        anomlabin = ""
        if anomcols[4]=="I":
            anomlabin = " I(+)=" + anomcols[0] + " SIGI(+)=" + anomcols[1] +\
                        " I(-)=" + anomcols[2] + " SIGI(-)=" + anomcols[3]
        elif anomcols[4]=="F":
            anomlabin = " F(+)=" + anomcols[0] + " SIGF(+)=" + anomcols[1] +\
                        " F(-)=" + anomcols[2] + " SIGF(-)=" + anomcols[3]

        self.open_stdin()
        self.write_stdin ( "OUTPUT CIF -\n"  +
                           "    data_ccp4\n" +
                           "labin  FP=" + hkl.dataset.Fmean.value +
                           " SIGFP="    + hkl.dataset.Fmean.sigma +
                           anomlabin    +
                           " FREE="     + hkl.dataset.FREE + "\n" +
                           "end\n" )
        self.close_stdin()

        sfCIF = self.getOFName ( "_sf.cif" )
        cmd   = ["HKLIN",hkl.getFilePath(self.inputDir()), "HKLOUT",sfCIF]

        # Start mtz2various
        self.runApp ( "mtz2various",cmd )
        self.unsetLogParser()

        repFilePath = os.path.splitext(self.getXYZOFName())[0] + ".pdf"

        self.file_stdout.write ( "modelFilePath=" + modelFilePath + "\n" )
        self.file_stdout.write ( "sfCIF=" + sfCIF + "\n" )
        self.file_stdout.write ( "repFilePath=" + repFilePath + "\n" )

        modelFilePath = "/Users/eugene/Projects/jsCoFE/tmp/valrep/1sar.cif"
        sfCIF = "/Users/eugene/Projects/jsCoFE/tmp/valrep/1sar-sf.cif"

        valrep.getValidationReport ( modelFilePath,sfCIF,repFilePath,self.file_stdout )

        """
        # check solution and register data
        if os.path.isfile(self.getCIFOFName()):

            self.putTitle ( "Deposition Output" )
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
        """

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Deposition ( "",os.path.basename(__file__) )
    drv.start()
