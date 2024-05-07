##!/usr/bin/python

#
# ============================================================================
#
#    21.04.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ANOMAP EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python anomap.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2024
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template


# ============================================================================
# Make AnoMap driver

class AnoMap(basic.TaskDriver):

    # make task-specific definitions
    def phaser_report    (self):  return "phaser_report"

    def run(self):

        # fetch input data

        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        # --------------------------------------------------------------------

        labin = hkl.getAnomalousFColumns()
        if labin[4]!="F":
            self.fail ( "<h3>No anomalous amplitude data.</h3>" +\
                    "This task requires F(+/-)/sigF(+/-) columns in the " +\
                    "reflection data, which were not found.",
                    "No anomalous amplitude data." )
            return

        wavelength = hkl.wavelength
        if not wavelength:
            wavelength = hkl.getWavelength()

        keywords = [
            "MODE EP_SAD",
            "ROOT \""     + self.outputFName + "\"",
            "HKLIN "      + hkl.getHKLFilePath(self.inputDir()),
            "CELL "       + hkl.getCellParameters_str(),
            "SPACEGROUP " + hkl.getSpaceGroup(),
            "WAVELENGTH " + str(wavelength),
            "CRYSTAL Scatterers DATASET " + hkl.getDataSetName() +\
                      " LABIN  F(+) = "   + labin[0] +\
                            " SIGF(+) = " + labin[1] +\
                            " F(-) = "    + labin[2] +\
                            " SIGF(-) = " + labin[3],
            "LLGCOMPLETE SCATTERER AX",
            "LLGCOMPLETE NCYCLE 0",
            "LLGMAPS ON",
            "PARTIAL PDB " + istruct.getPDBFilePath(self.inputDir()) +\
                             " RMS 0.8",
            "OUTPUT LEVEL SUMMARY",
            "END"
        ]    

        self.open_stdin  ()
        self.write_stdin ( keywords )
        self.close_stdin ()

        # prepare report parser
        self.setGenericLogParser ( self.phaser_report(),True )
        # Start phaser
        self.runApp ( "phaser",[],logType="Main" )
        self.unsetLogParser()

        flist = [fname for fname in os.listdir() if fname.startswith(self.outputFName)]

        have_results = False

        summary    = "failed to calculate maps"
        phaser_mtz = None
        anomap_mtz = None
        for fname in flist:
            if fname.endswith("llgmaps.mtz"):
                anomap_mtz = fname
            elif fname.endswith(".mtz"):
                phaser_mtz = fname

        if phaser_mtz and anomap_mtz:

            output_mtz = self.getMTZOFName()
            self.makeMTZ ( [
                { "path"   : phaser_mtz,
                  "labin"  : ["all"],
                  "labout" : ["all"]
                },{
                  "path"   : anomap_mtz,
                  "labin"  : ["FLLG_AX","PHLLG_AX"],
                  "labout" : ["DELFWT","PHDELWT"]
                }
            ],output_mtz )

            struct = self.registerStructure ( 
                            istruct.getMMCIFFilePath(self.inputDir()),
                            istruct.getPDBFilePath(self.inputDir()),
                            None,
                            output_mtz,
                            libPath    = istruct.getLibFilePath(self.inputDir()),
                            leadKey    = istruct.leadKey,
                            # map_labels = "FWT,PHWT,FLLG_AX,PHLLG_AX",
                            refiner    = istruct.refiner 
                        )

            if struct:
                struct.copy_refkeys_parameters ( istruct )
                struct.copyAssociations ( istruct )
                struct.copySubtype      ( istruct )
                struct.putCootMeta      ( self.job_id )
                struct.makeXYZSubtype   ()
                struct.copyLabels       ( istruct )
                struct.copyLigands      ( istruct )
                # struct.FAN  = "FLLG_AX"
                # struct.PHAN = "PHLLG_AX"

                # create output data widget in the report page
                self.putTitle ( "Output Structure" )
                self.putStructureWidget ( "structure_btn","Output Structure",struct )
                self.putMessage ( "<i style=\"color:darkblue\">" +\
                    "&nbsp;<p>NOTE: for visualisation purposes, anomalous map " +\
                    "is presented as difference map in this task's output. To " +\
                    "use the difference map, branch from task where it was "    +\
                    "calculated.</i>"
                )

                # update structure revision
                revision.setStructureData ( struct   )
                self.registerRevision     ( revision )

                have_results = True
                summary      = "anomalous map calculated" 

        # this will go in the project tree line
        self.generic_parser_summary["anomap"] = {
            "summary_line" : summary
        }

        # close execution logs and quit; "False" because no data passed on follow-up jobs
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = AnoMap ( "",os.path.basename(__file__) )
    drv.start()
