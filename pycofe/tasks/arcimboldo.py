#!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    16.02.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ARCIMBOLDO EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python arcimboldo.py jobManager jobDir jobId [queueName [nSubJobs]]
#
#  where:
#    jobManager    is either SHELL or SGE
#    jobDir     is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    jobId      is job id assigned by jsCoFE (normally an integer but should
#               be treated as a string with no assumptions)
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
import json

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.proc  import xyzmeta


# ============================================================================
# Make Arcimboldo driver

class Arcimboldo(basic.TaskDriver):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated mtzs
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare arcimboldo job

        #if "ROSETTA_DIR" not in os.environ:
        #    pyrvapi.rvapi_set_text (
        #        "<b>Error: " + self.appName() + " is not configured to work " +\
        #        "with ARCIMBOLDO.</b><p>Please look for support.",
        #        self.report_page_id(),self.rvrow,0,1,1 )
        #
        #    self.fail ( "<p>&nbsp; *** Error: " + self.appName() + " is not " +\
        #                "configured to work with ARCIMBOLDO.\n" + \
        #                "     Please look for support\n",
        #                "ARCIMBOLDO is not configured" )

        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )
        seq = self.makeClass ( self.input_data.data.seq[0] )

        # make command line parameters
        cmd = [ "-mtz"  ,hkl.getHKLFilePath(self.inputDir()),
                "-fasta",seq.getSeqFilePath(self.inputDir()),
                "-rosetta_dir", os.environ["ROSETTA_DIR"],
                "-rvapi_document",self.reportDocumentName() ]

        self.putMessage (
            "<h3>The job is likely to take very long time</h3>" +\
            "<i>You may close this window and check later. Logout and " +\
            "subsequent login will not affect the job running." )
        self.rvrow -= 1

        # pass rvapi document with metadata
        """
        self.storeReportDocument(
            '{ "jobId"       : "' + str(self.job_id).zfill(4) + '",' +
            '  "reportTabId" : "' + self.report_page_id() + '",'
            '  "logTabId"    : "' + self.log_page_id()    + '"'
            '}'
        )
        """
        self.storeReportDocument ( self.log_page_id() )

        #test_arcimboldo_path = os.path.join ( os.environ["CCP4"],"bin","arcimboldo_mock.py" )

        # run arcimboldo
        self.runApp ( "arcimboldo",cmd,logType="Main" )
        #self.runApp ( "/opt/xtal/repos/arcimboldo/bin/arcimboldo-mock",cmd,logType="Main" )

        self.restoreReportDocument()

        f = open ( 'xxx.json','w' )
        f.write ( pyrvapi.rvapi_get_meta() )
        f.close()

        """
        {"results": [
          {"info": "SHELXE trace of MR result",
             "mtz": "../../../../../../opt/arcimboldo.git/arcimboldo_testing/from_existing_models/MRBUMP/search_c1_t100_r3_polyAla_mrbump/data/loc0_ALL_c1_t100_r3_polyAla/unmod/mr/phaser/build/shelxe/shelxe_phaser_loc0_ALL_c1_t100_r3_polyAla_UNMOD.mtz",
             "type": "SHELXE",
             "name": "c1_t100_r3_polyAla",
             "pdb": "../../../../../../opt/arcimboldo.git/arcimboldo_testing/from_existing_models/MRBUMP/search_c1_t100_r3_polyAla_mrbump/data/loc0_ALL_c1_t100_r3_polyAla/unmod/mr/phaser/build/shelxe/shelxe_phaser_loc0_ALL_c1_t100_r3_polyAla_UNMOD.pdb"
           },
           {"info": "SHELXE trace of MR result",
             "mtz": "../../../../../../opt/arcimboldo.git/arcimboldo_testing/from_existing_models/MRBUMP/search_c1_t49_r1_polyAla_mrbump/data/loc0_ALL_c1_t49_r1_polyAla/unmod/mr/phaser/build/shelxe/shelxe_phaser_loc0_ALL_c1_t49_r1_polyAla_UNMOD.mtz",
             "type": "SHELXE",
             "name": "c1_t49_r1_polyAla",
             "pdb": "../../../../../../opt/arcimboldo.git/arcimboldo_testing/from_existing_models/MRBUMP/search_c1_t49_r1_polyAla_mrbump/data/loc0_ALL_c1_t49_r1_polyAla/unmod/mr/phaser/build/shelxe/shelxe_phaser_loc0_ALL_c1_t49_r1_polyAla_UNMOD.pdb"
            },
            {"info": "SHELXE trace of MR result",
             "mtz": "../../../../../../opt/arcimboldo.git/arcimboldo_testing/from_existing_models/MRBUMP/search_c1_t49_r3_polyAla_mrbump/data/loc0_ALL_c1_t49_r3_polyAla/unmod/mr/phaser/build/shelxe/shelxe_phaser_loc0_ALL_c1_t49_r3_polyAla_UNMOD.mtz",
             "type": "SHELXE",
             "name": "c1_t49_r3_polyAla",
             "pdb": "../../../../../../opt/arcimboldo.git/arcimboldo_testing/from_existing_models/MRBUMP/search_c1_t49_r3_polyAla_mrbump/data/loc0_ALL_c1_t49_r3_polyAla/unmod/mr/phaser/build/shelxe/shelxe_phaser_loc0_ALL_c1_t49_r3_polyAla_UNMOD.pdb"
            }
          ]
        }
        """

        have_results = False

        rvapi_meta = pyrvapi.rvapi_get_meta()
        if rvapi_meta:
            try:
                arcimboldo_meta = json.loads ( rvapi_meta )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from Arcimboldo</i>" +
                                  "<p>'" + rvapi_meta + "'" )
        else:
            self.putMessage ( "<b>Program error:</b> <i>no metadata from Arcimboldo</i>" )
            arcimboldo_meta = {}
            arcimboldo_meta["results"] = []

        results = arcimboldo_meta["results"]
        if len(results)<=0:
            self.putTitle ( "Solution Not Found" )
        else:

            generic_parser_summary = None
            for i in range(len(results)):
                result = results[i]
                self.putTitle ( "Solution " + result["name"] )

                mtzfile   = os.path.join ( self.reportDir(),result["mtz"] )
                final_pdb = os.path.join ( self.reportDir(),result["pdb"] )
                sol_hkl   = hkl

                meta = xyzmeta.getXYZMeta ( final_pdb,self.file_stdout,
                                            self.file_stderr )
                if "cryst" in meta:
                    sol_spg    = meta["cryst"]["spaceGroup"]
                    spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                    if spg_change:
                        mtzfile = spg_change[0]
                        sol_hkl = spg_change[1]

                # ================================================================
                # make output structure and register it

                structure = self.finaliseStructure ( final_pdb,self.outputFName,
                                                     sol_hkl,None,[seq],0,
                                                     leadKey=1,openState_bool=False,
                                                     title="" )

                if structure:
                    # update structure revision
                    revision = self.makeClass  ( self.input_data.data.revision[0] )
                    revision.setReflectionData ( sol_hkl   )
                    revision.setStructureData  ( structure )
                    self.registerRevision      ( revision,i+1,"" )
                    if not generic_parser_summary:
                        generic_parser_summary = self.generic_parser_summary.copy()
                    have_results = True

                else:
                    self.putMessage ( "Structure Data cannot be formed (probably a bug)" )

            if generic_parser_summary:
                self.generic_parser_summary = generic_parser_summary.copy()

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

#    drv = Arcimboldo ( "Ab-initio Molecular Replacement with ARCIMBOLDO",os.path.basename(__file__),
#                  { "report_page" : { "show" : False } }  )

    drv = Arcimboldo ( "",os.path.basename(__file__) )

    drv.start()
