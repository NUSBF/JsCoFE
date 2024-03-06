#!/usr/bin/python

#
# ============================================================================
#
#    06.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SIMBAD EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.simbad.py jobManager jobDir jobId [queueName [nSubJobs]]
#
#  where:
#    jobManager    is either SHELL or SGE
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskyi 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import json
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from   pycofe.tasks    import asudef
from   pycofe.dtypes   import dtype_revision
from   pycofe.verdicts import verdict_simbad
from   pycofe.auto     import auto
from   pycofe.proc     import xyzmeta


# ============================================================================
# Make Simbad driver

class Simbad(asudef.ASUDef):

    # ------------------------------------------------------------------------

    # the following will provide for import of generated sequences
    def importDir        (self):  return "./"   # import from working directory
    def import_summary_id(self):  return None   # don't make import summary table

    # ------------------------------------------------------------------------

    def run(self):

        qtype = []
        if self.jobManager in ["SGE","SLURM"]:
            nSubJobs = self.getCommandLineParameter ( "nproc" )
            if not nSubJobs:
                nSubJobs = "0"
            #if len(sys.argv)>5:
            #    nSubJobs = sys.argv[5]
            #qtype = ["-submit_qtype",self.jobManager.lower()]
        else:
            nSubJobs = "4"

        # fetch input data
        idata = None
        hkl   = None
        if hasattr(self.input_data.data,"idata"):  # optional data parameter?
            idata = self.makeClass ( self.input_data.data.idata[0] )
            if idata._type=="DataRevision":
                hkl   = self.makeClass ( self.input_data.data.hkl[0] )
            elif idata._type=="DataHKL":
                hkl   = idata
                idata = None
            else:
                SpGroup = idata.getSpaceGroup().replace(" ","")
                cell_p  = idata.getCellParameters()
                cell_geometry = str(cell_p[0]) + "," + str(cell_p[1]) + "," +\
                                str(cell_p[2]) + "," + str(cell_p[3]) + "," +\
                                str(cell_p[4]) + "," + str(cell_p[5])
        else:
            sec0    = self.task.parameters.sec0.contains
            SpGroup = self.getParameter(sec0.SPGROUP).replace(" ","")
            cell_geometry = self.getParameter(sec0.CELL_A)     + "," +\
                            self.getParameter(sec0.CELL_B)     + "," +\
                            self.getParameter(sec0.CELL_C)     + "," +\
                            self.getParameter(sec0.CELL_ALPHA) + "," +\
                            self.getParameter(sec0.CELL_BETA)  + "," +\
                            self.getParameter(sec0.CELL_GAMMA)

        sec1       = self.task.parameters.sec1.contains
        maxnlatt   = self.getParameter(sec1.MAXNLATTICES)
        maxpenalty = self.getParameter(sec1.MAXPENALTY)
        if not maxnlatt:    maxnlatt   = "5"
        if not maxpenalty:  maxpenalty = "4"
        sgall = "all"

        if hkl:
            level = self.getParameter ( sec1.SEARCH_SEL )
            if hkl.spg_alt=="ALL":
                sgall = "all"
            else:
                splist = hkl.spg_alt.split ( ";" )
                if (len(splist)>1) and (not splist[0].startswith("I")):
                    sgall = "enant"
                else:
                    sgall = ""

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

            cmd = [ "-nproc"              ,nSubJobs,
                    "-F"                  ,hkl.dataset.Fmean.value,
                    "-SIGF"               ,hkl.dataset.Fmean.sigma,
                    "-FREE"               ,hkl.dataset.FREE,
                    "--cleanup"           ,
                    "--display_gui"       ,
                    "-webserver_uri"      ,"jsrview",
                    "-work_dir"           ,"./",
                    "-rvapi_document"     ,self.reportDocumentName()
                  ]

        else:

            level = 'L'
            app   = "simbad-lattice"

            cmd = [ "-nproc"              ,nSubJobs,
                    "-uc"                 ,cell_geometry,
                    "-sg"                 ,SpGroup,
                    "--cleanup"           ,
                    "--display_gui"       ,
                    "-webserver_uri"      ,"jsrview",
                    "-work_dir"           ,"./",
                    "-rvapi_document"     ,self.reportDocumentName()
                  ]

        if level in ["S","LCS"]:
            morda_default = os.path.join ( os.environ["CCP4"],"share","simbad","static","morda" )
            morda_path    = os.environ["SIMBAD_DB"]
            if not os.path.exists(morda_path):
                morda_path = morda_default
            if not os.path.exists(morda_path):
                self.fail ( "<h3>No SIMBAD database.</h3>" +\
                    "Structural searches with SIMBAD require SIMBAD database, " +\
                    "which is not installed.",
                    "No SIMBAD database" )
                return
            # sec2 = self.task.parameters.sec2.contains
            # cmd += [ "-rot_program",self.getParameter(sec2.RFPROGRAM_SEL) ]

            if morda_path != morda_default:
                cmd += [ "-morda_db",morda_path ]

        if len(qtype)>0:
            cmd += qtype

        if sys.platform.startswith("win"):
            app += ".bat"

        if level in ['L','LC']:
            cmd += [ "-max_penalty_score"  ,maxpenalty,
                     "-max_lattice_results",maxnlatt ]

        if "PDB_DIR" in os.environ:
            cmd += [ "-pdb_db",os.environ["PDB_DIR"] ]

        if len(sgall) > 0:
            cmd += ["-sga", sgall]

        # else:
        #     # check that simbad database is installed
        #     if "SIMBAD_DB" not in os.environ:
        #         self.fail (
        #             "<p>&nbsp; *** SIMBAD database is not installed, or is not configured",
        #             "simbad database is not found" )
        #         return
        #     #else:
        #     #    cmd += [ "-morda_db",os.environ["SIMBAD_DB"] ]

        if "TMPDIR" in os.environ:
            cmd += [ "-tmp_dir",os.environ["TMPDIR"] ]

        if hkl:
            cmd += [ hkl.getHKLFilePath(self.inputDir()) ]

        self.flush()
        self.storeReportDocument ( self.log_page_id() )

        # run simbad
        self.runApp ( app,cmd,logType="Main",quitOnError=False )
        self.restoreReportDocument()

        #f = open ( 'xxx.json','w' )
        #f.write ( pyrvapi.rvapi_get_meta() )
        #f.close()

        # { "nResults": 1,
        #   "results": [
        #     { "mtz": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refinement_output.mtz",
        #       "source": "latt",
        #       "dmap": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refmac_fofcwt.map",
        #       "best": true,
        #       "map": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refmac_2fofcwt.map",
        #       "pdb": "../latt/mr_lattice/1DTX/mr/molrep/refine/1DTX_refinement_output.pdb",
        #       "rank": 1,
        #       "name": "1DTX"
        #      }
        #   ]
        # }

        rvapi_meta  = pyrvapi.rvapi_get_meta()
        simbad_meta = None
        if rvapi_meta:
            try:
                simbad_meta = json.loads ( rvapi_meta )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from Simbad</i>" )
                self.stderrln   ( "\n ***** unparseable metadata from Simbad:\n\n   '" +\
                                  str(rvapi_meta) + "'\n\n" )
                simbad_meta = None

        if not simbad_meta:
            self.putMessage ( "<b>Program error:</b> <i>no metadata from Simbad</i>" )
            simbad_meta = {}
            simbad_meta["nResults"] = 0
        elif not "nResults" in simbad_meta:
            self.putMessage ( "<b>Program error:</b> <i>corrupt metadata from Simbad</i>" )
            simbad_meta = {}
            simbad_meta["nResults"] = 0

        have_results = False
        revision     = None

        if simbad_meta["nResults"]>0:

            result0 = simbad_meta["results"][0]

            # self.stdoutln ( " >>>>> " + str(result0) )

            self.flush()
            self.file_stdout.close()
            f = open ( self.file_stdout_path(),"r" )
            key     = -1
            LLG     = ""
            TFZ     = ""
            Rfactor = ""
            Rfree   = ""
            for line in f:
                if key==0:
                    words = line.split()
                    if len(words)>5 and words[0]==result0["name"]:
                        TFZ     = words[1]
                        LLG     = words[2]
                        Rfactor = words[4]
                        Rfree   = words[5]
                        break
                elif "phaser_tfz" in line:
                    key = 1
                else:
                    key -= 1
            f.close()
            # continue writing to stdout
            self.file_stdout = open ( self.file_stdout_path(),"a" )

            if not LLG.replace(".","",1).isdigit():  LLG = ""
            if not TFZ.replace(".","",1).isdigit():  TFZ = ""

            self.putMessage ( "<h3>Best model found: " + result0["name"] + "</h3>" )

            pdbfile = self.getXYZOFName()
            shutil.copy2 ( os.path.join(self.reportDir(),result0["pdb"]),pdbfile )

            if result0["mtz"]:
                mtzfile = self.getMTZOFName()
                shutil.copy2 ( os.path.join(self.reportDir(),result0["mtz"]),mtzfile )

                sol_hkl = hkl
                meta    = xyzmeta.getXYZMeta ( pdbfile,self.file_stdout,self.file_stderr )
                if "cryst" in meta:
                    sol_spg    = meta["cryst"]["spaceGroup"]
                    spg_change = self.checkSpaceGroupChanged ( sol_spg,hkl,mtzfile )
                    if spg_change:
                        mtzfile = spg_change[0]
                        sol_hkl = spg_change[1]

                # register structure data
                structure = self.registerStructure (
                                None,
                                pdbfile,
                                None,
                                mtzfile,
                                leadKey    = 1,
                                copy_files = True,
                                refiner    = "refmac" 
                            )

                if structure:
                    structure.addDataAssociation ( sol_hkl.dataId )
                    structure.setRefmacLabels ( sol_hkl )
                    structure.setXYZSubtype   ()
                    structure.addPhasesSubtype()

                    self.putStructureWidget ( "structure_btn_",
                            result0["name"] + " structure and electron density",
                            structure )

                    verdict_row = self.rvrow
                    self.rvrow += 5

                    make_asu = False  # hardcoded switch
                    if not idata and make_asu:
                        # Import sequences from the structure and create an
                        # ASU-containing structure revision.
                        #    secId="0" activates drawing of the GaugeWidget on the
                        #    activation of 0th (the leftmost) tab
                        revision = asudef.revisionFromStructure ( self,sol_hkl,structure,
                                                                  result0["name"],secId="0",
                                                                  make_verdict=False )
                    else:

                        if idata:
                            # update structure revision given on input, keep any ASU
                            # that may have been in there
                            revision = idata
                        else:
                            # create structure revision with empty asymmetric unit
                            revision = dtype_revision.DType ( -1 )

                        # set revision data and register
                        revision.setStructureData  ( structure )
                        revision.setReflectionData ( sol_hkl )
                        self.registerRevision      ( revision  )

                        if not idata:  # make a warning of empty ASU
                            self.putMessage (
                                "&nbsp;<br><span style='color:maroon'>" +\
                                "<b>Note:</b> Structure Revision has empty ASU, not suitable " +\
                                "for model building. Use SIMBAD after <i>ASU definition</i> " +\
                                "task, or run <i>Edit Structure Revision</i> to get ASU " +\
                                "complete.</span>" )

                    have_results = True  # may be continued manually

                    # Verdict section

                    if LLG and TFZ:
                        verdict_meta = {
                            "sol"        : revision.ASU.solvent,
                            "resolution" : revision.HKL.getHighResolution(raw=True),
                            "nasu"       : revision.getNofASUMonomers(),
                            "fllg"       : float ( LLG   ),
                            "ftfz"       : float ( TFZ   ),
                            "rfree"      : float ( Rfree )
                        }
                        verdict_simbad.putVerdictWidget ( self,verdict_meta,verdict_row,secId="0" )

                        if Rfree:
                            self.generic_parser_summary["simbad"] = {
                                "summary_line" : "best model: " + result0["name"] +\
                                                 ", LLG=" + LLG + " TFZ=" + TFZ +\
                                                 " R="  + Rfactor +\
                                                 " R<sub>free</sub>=" + Rfree,
                                "R_factor"     : Rfactor,
                                "R_free"       : Rfree
                            }

                        auto.makeNextTask ( self,{
                            "revision" : revision,
                            "Rfactor"  : Rfactor,
                            "Rfree"    : Rfree,
                            "LLG"      : LLG,
                            "TFZ"      : TFZ
                        })

                    else:  # cannot be continued in a workflow
                        self.generic_parser_summary["simbad"] = {
                            "summary_line" : "solution not found"
                        }
                        # auto.makeNextTask ( self,{
                        #     "revision" : None,
                        #     "Rfactor"  : "1",
                        #     "Rfree"    : "1",
                        #     "LLG"      : "0",
                        #     "TFZ"      : "0"
                        # })

                    # else:
                    #     self.putMessage ( "Structure Revision cannot be formed (probably a bug)" )

                else:
                    self.putMessage ( "Structure Data cannot be formed (probably a bug)" )

            else:  # only PDB file delivered
                oxyz = self.registerXYZ ( None,pdbfile,checkout=True )
                if oxyz:
                    # oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                    self.putMessage (
                        "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                        oxyz.dname )
                    self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                        "Atomic coordinates",oxyz )
                    have_results = True
                    self.generic_parser_summary["simbad"] = {
                        "summary_line" : "best model: " + result0["name"]
                    }
                    # self.putMessage ( "&nbsp;" )
                else:
                    # close execution logs and quit
                    self.generic_parser_summary["simbad"] = {
                        "summary_line" : "errors"
                    }
                    self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                                "XYZ Data was not formed" )

        # elif hkl:
        else:
            self.putTitle ( "No Suitable Models Found" )

        if os.path.exists("morda"):
            shutil.rmtree ( "morda",ignore_errors=True )

        if not have_results or not revision:
            auto.makeNextTask ( self,{
                "revision" : None,
                "Rfactor"  : "1",
                "Rfree"    : "1",
                "LLG"      : "0",
                "TFZ"      : "0"
            })

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Simbad ( "",os.path.basename(__file__),{} )
    drv.start()
