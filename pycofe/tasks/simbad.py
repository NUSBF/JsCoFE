#!/usr/bin/python

#
# ============================================================================
#
#    20.06.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SIMBAD EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.simbad.py exeType jobDir jobId
#
#  where:
#    exeType    is either SHELL or SGE
#    jobDir     is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    jobId      is job id assigned by jsCoFE (normally an integer but should
#               be treated as a string with no assumptions)
#    queueName  optional parameter giving queue name for SGE. This parameter
#               may be missing even if job is run by SGE, so it should be
#               checked upon using command line length. queueName=='-' means
#               the same as "no name", but should be given if nSubJobs need
#               to be specified.
#    nSubJobs   optional parameter giving the maximum number of subjobs that
#               can be launched by the task. This parameter may be missing
#               even if job is run by SGE, so it should be checked upon using
#               comman line length
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

#  python native imports
import os
import sys
import json

#  ccp4-python imports
import pyrvapi

#  application imports
from   pycofe.tasks  import asudef
from   pycofe.dtypes import dtype_revision, dtype_sequence
from   pycofe.proc   import import_sequence


# ============================================================================
# Make Simbad driver

class Simbad(asudef.ASUDef):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated sequences
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        if self.exeType == "SGE":
            nSubJobs = "0";
            if len(sys.argv)>5:
                nSubJobs = sys.argv[5]
        else:
            nSubJobs = "4";


        # fetch input data
        hkl = self.makeClass ( self.input_data.data.hkl[0] )

        sec1       = self.task.parameters.sec1.contains
        level      = self.getParameter(sec1.SEARCH_SEL)
        maxnlatt   = self.getParameter(sec1.MAXNLATTICES)
        maxpenalty = self.getParameter(sec1.MAXPENALTY)
        if not maxpenalty:
            maxpenalty = "12"

        app = ""
        if level == 'L':
            app = "simbad-lattice"
        elif level == 'C':
            app = "simbad-contaminant"
        elif level == 'S':
            app = "simbad-morda"
        elif level == 'LC':
            app = "simbad"
        elif level == 'LCS':
            app = "simbad-full"

        # Prepare simbad input -- script file

        cmd = []
        if "TMPDIR" in os.environ:
            cmd  = [ "-tmp_dir",os.environ["TMPDIR"] ]
        if "PDB_DIR" in os.environ:
            cmd += [ "-pdb_db",os.environ["PDB_DIR"] ]

        cmd += [ "-nproc"              ,nSubJobs,
                 "-max_lattice_results",maxnlatt,
                 "-max_penalty_score"  ,maxpenalty,
                 "-F"                  ,hkl.dataset.Fmean.value,
                 "-SIGF"               ,hkl.dataset.Fmean.sigma,
                 "-FREE"               ,hkl.dataset.FREE,
                 "--cleanup"           ,
                 "--display_gui"       ,
                 "-webserver_uri"      ,"jsrview",
                 "-work_dir"           ,"./",
                 "-rvapi_document"     ,self.reportDocumentName(),
                 os.path.join(self.inputDir(),hkl.files[0])
               ]

        self.flush()
        self.storeReportDocument ( self.log_page_id() )

        # run simbad
        self.runApp ( app,cmd )
        self.restoreReportDocument()

        #f = open ( 'xxx.json','w' )
        #f.write ( pyrvapi.rvapi_get_meta() )
        #f.close()

        """
        { "nResults": 1,
          "results": [
            { "mtz": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refinement_output.mtz",
              "source": "latt",
              "dmap": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refmac_fofcwt.map",
              "best": true,
              "map": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refmac_2fofcwt.map",
              "pdb": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refinement_output.pdb",
              "rank": 1,
              "name": "1DTX"
             }
          ]
        }
        """

        rvapi_meta  = pyrvapi.rvapi_get_meta()
        simbad_meta = None
        if rvapi_meta:
            try:
                simbad_meta = json.loads ( rvapi_meta )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from Simbad</i>" +
                                  "<p>'" + rvapi_meta + "'" )
                simbad_meta = None

        if not simbad_meta:
            self.putMessage ( "<b>Program error:</b> <i>no metadata from Simbad</i>" )
            simbad_meta = {}
            simbad_meta["nResults"] = 0
        elif not "nResults" in simbad_meta:
            self.putMessage ( "<b>Program error:</b> <i>corrupt metadata from Simbad</i>" )
            simbad_meta = {}
            simbad_meta["nResults"] = 0

        if simbad_meta["nResults"]>0:

            result0 = simbad_meta["results"][0]

            self.putMessage ( "<h3>Best model found: " + result0["name"] + "</h3>" )

            # register structure data
            structure = self.registerStructure (
                            os.path.join(self.reportDir(),result0["pdb"]),
                            os.path.join(self.reportDir(),result0["mtz"]),
                            os.path.join(self.reportDir(),result0["map"]),
                            os.path.join(self.reportDir(),result0["dmap"]),
                            None,True )

            if structure:

                structure.addDataAssociation ( hkl.dataId )
                structure.setRefmacLabels ( hkl )
                structure.addMRSubtype ()
                structure.addXYZSubtype()

                self.putStructureWidget ( "structure_btn_",
                          result0["name"] + " structure and electron density",
                          structure )

                asudef.revisionFromStructure ( self,hkl,structure,result0["name"] )

            else:
                self.putMessage ( "Structure Data cannot be formed (probably a bug)" )

        else:
            self.putTitle ( "No Suitable Models Found" )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Simbad ( "",os.path.basename(__file__),{} )
    drv.start()
