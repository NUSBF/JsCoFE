##!/usr/bin/python

#
# ============================================================================
#
#    15.02.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BUCCANEER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python buccaneer.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir      is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
import json

#  application imports
from . import basic
from   pycofe.dtypes  import dtype_template
from   varut          import signal
from   pycofe.proc    import qualrep
from   pycofe.auto    import auto, auto_workflow

# ============================================================================
# Make Buccaneer driver

class Buccaneer(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "buccaneer.script"

    # make task-specific definitions
    def buccaneer_seq   (self):  return "buccaneer.seq"
    def buccaneer_xyz   (self):  return "buccaneer.pdb"
    def buccaneer_mtz   (self):  return "buccaneer.mtz"
    def buccaneer_tmp   (self):  return "buccaneer_pipeline"

    # ------------------------------------------------------------------------

    def addCmdLine ( self,keyword,line ):
        self.write_stdin ( keyword + " " + line + "\n" )
        return

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When buccaneer
        # succeeds, this file is created.
        if os.path.isfile(self.buccaneer_xyz()):
            os.remove(self.buccaneer_xyz())

        if not os.path.exists(self.buccaneer_tmp()):
            os.makedirs(self.buccaneer_tmp())

        # Prepare buccaneer input
        # fetch input data

        idata   = self.input_data.data
        sec1    = self.task.parameters.sec1.contains
        sec2    = self.task.parameters.sec2.contains
        sec3    = self.task.parameters.sec3.contains

        hkl     = self.makeClass ( idata.hkl[0]     )
        istruct = self.makeClass ( idata.istruct[0] )
        seq     = idata.seq
        if hasattr(idata,"ixyz"):
            ixyz = self.makeClass ( idata.ixyz[0] )
        else:
            ixyz = istruct

        # self.stderrln ( istruct.to_JSON() )

        # prepare input MTZ file by putting original reflection data into
        # phases MTZ

        labin_fo    = hkl.getMeanF()
        if labin_fo[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        labin_fo[2] = hkl.getFreeRColumn()
        input_mtz   = "_input.mtz"
        labin_ph    = []
        if istruct.HLA:  #  experimental phases
            labin_ph = [istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD]
        elif istruct.FOM and istruct.PHI:
            labin_ph = [istruct.PHI,istruct.FOM]

        else:  # MR phases
            assert False
        #     labin_ph = [istruct.PHI,istruct.FOM]

        self.makePhasesMTZ (
                hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
                istruct.getMTZFilePath(self.inputDir()),labin_ph,
                input_mtz )

        #self.makeFullASUSequenceFile ( seq,self.buccaneer_seq() )

        with open(self.buccaneer_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );
            else:
                newf.write ( ">polyUNK\nU\n" );

        refname = "reference-" + sec2.REFMDL_SEL.value
        #isCoor  = istruct.hasXYZSubtype()
        isCoor  = ixyz.hasXYZSubtype();

        self.open_stdin()
        reffile = os.path.join(os.environ["CCP4"],"lib","data","reference_structures",refname)
        self.addCmdLine ( "title Job",self.job_id.zfill(4) )
        self.addCmdLine ( "pdbin-ref",reffile + ".pdb" )
        self.addCmdLine ( "mtzin-ref",reffile + ".mtz" )
        self.addCmdLine ( "colin-ref-fo","[/*/*/FP.F_sigF.F,/*/*/FP.F_sigF.sigF]" )
        self.addCmdLine ( "colin-ref-hl","[/*/*/FC.ABCD.A,/*/*/FC.ABCD.B,/*/*/FC.ABCD.C,/*/*/FC.ABCD.D]" )
        self.addCmdLine ( "seqin"     ,self.buccaneer_seq() )
        self.addCmdLine ( "mtzin"     ,input_mtz )
        #self.addCmdLine ( "colin-fo"  ,"[/*/*/" + istruct.FP + ",/*/*/" + istruct.SigFP + "]" )
        #self.addCmdLine ( "colin-free","[/*/*/" + istruct.FreeR_flag + "]" )
        self.addCmdLine ( "colin-fo"  ,"[/*/*/" + labin_fo[0] + ",/*/*/" + labin_fo[1] + "]" )
        self.addCmdLine ( "colin-free","[/*/*/" + labin_fo[2] + "]" )

        if istruct.HLA:
            self.addCmdLine ( "colin-hl","[/*/*/" + istruct.HLA + ",/*/*/" + istruct.HLB +\
                                         ",/*/*/" + istruct.HLC + ",/*/*/" + istruct.HLD + "]" )
        else:
            self.addCmdLine ( "colin-phifom","[/*/*/" + istruct.PHI + ",/*/*/" + istruct.FOM + "]" )

        """
        if isCoor:
            self.addCmdLine ( "colin-phifom","[/*/*/" + istruct.PHI + ",/*/*/" + istruct.FOM + "]" )
        else:
            self.addCmdLine ( "colin-hl","[/*/*/" + istruct.HLA + ",/*/*/" + istruct.HLB +\
                                         ",/*/*/" + istruct.HLC + ",/*/*/" + istruct.HLD + "]" )
        """

        # Fixed model to be preserved by Buccaneer

        xmodel = None
        smodel = None
        if hasattr(idata,"xmodel"):
            xmodel = self.makeClass(idata.xmodel[0])
            self.addCmdLine ( "pdbin",xmodel.getXYZFilePath(self.inputDir()) )

        if hasattr(idata,"smodel"):
            smodel = self.makeClass(idata.smodel[0])
            self.addCmdLine ( "pdbin-sequence-prior",
                              smodel.getXYZFilePath(self.inputDir()) )

        self.addCmdLine ( "pdbout",self.buccaneer_xyz()  )

        self.write_stdin (
            self.putKWParameter ( sec1.NCYCLES          ) + \
            self.putKWParameter ( sec2.FIX_POSITION_CBX ) + \
            self.putKWParameter ( sec1.ANISO_CBX        ) + \
            self.putKWParameter ( sec1.SELEN_CBX        ) + \
            self.putKWParameter ( sec1.FASTEST_CBX      ) + \
            self.putKWParameter ( sec2.NICYCLES1        ) + \
            self.putKWParameter ( sec2.SEQASGN1_SEL     ) + \
            self.putKWParameter ( sec2.CORRTF1_CBX      ) + \
            self.putKWParameter ( sec2.NICYCLES2        ) + \
            self.putKWParameter ( sec2.SEQASGN2_SEL     ) + \
            self.putKWParameter ( sec2.CORRTF2_CBX      ) + \
            self.putKWParameter ( sec2.RESMIN           ) + \
            self.putKWParameter ( sec2.UNKRESN          )
            #self.putKWParameter ( sec2.FILTERBF     ) + \
            #self.putKWParameter ( sec2.FILTERBFMR   )
        )

        if xmodel:
            self.addCmdLine ( "buccaneer-keyword model-filter-sigma",str(xmodel.BFthresh) )

        if isCoor:
            self.addCmdLine ( "buccaneer-keyword mr-model-filter-sigma",str(ixyz.BFthresh) )

        #if sec2.KEEPATMCID.visible:
        #    self.write_stdin ( "buccaneer-keyword known-structure " + \
        #                       sec2.KEEPATMCID.value + ":" + \
        #                       str(sec2.KEEPATMRAD.value) + "\n" )

        if hasattr(sec1,"NCPUS"):
            self.write_stdin ( self.putKWParameter ( sec1.NCPUS ) )
        else:
            self.write_stdin ( "jobs 2\n" )

        self.write_stdin ( self.putKWParameter ( sec3.USEPHI_CBX ) )

        if isCoor:
            self.addCmdLine ( "pdbin-mr",ixyz.getXYZFilePath(self.inputDir()) )
            if istruct.useModelSel!="N":
                self.addCmdLine ( "buccaneer-keyword",ixyz.useModelSel )
            #self.write_stdin ( self.putKWParameter ( sec1.USEMR_SEL ) )

        self.write_stdin ( self.putKWParameter ( sec3.REFTWIN_CBX ) )

        if self.getParameter(sec3.AUTOWEIGH_CBX)=="False":
            self.addCmdLine ( "refmac-weight",self.getParameter(sec3.WEIGHTVAL) )

        self.addCmdLine ( "prefix","./" + self.buccaneer_tmp() + "/" )

        self.close_stdin()
                
        webcoot_options = {
            "project"      : self.task.project,
            "id"           : self.job_id,
            "no_data_msg"  : "<b>Waiting for first build...</b>",
            "FWT"          : "FWT",
            "PHWT"         : "PHWT", 
            "FP"           : "FP",
            "SigFP"        : "SIGFP",
            "FreeR_flag"   : "FreeR_flag",
            "DELFWT"       : "DELFWT",
            "PHDELWT"      : "PHDELWT"
        }

        wcrvrow = self.rvrow + 110
        self.putWebCootButton (
            self.buccaneer_tmp() + "/refine.mmcif",
            self.buccaneer_tmp() + "/refine.mtz",
            "",  # placeholder for legend file
            "view-update",
            5000,  # milliseconds update interval
            json.dumps(webcoot_options),
            "[" + str(self.job_id).zfill(4) + "] Buccaneer current structure",
            "Build in progress",
            self.report_page_id(),wcrvrow,0
        )

        # make command-line parameters
        cmd = [ "-u",
                os.path.join(os.environ["CCP4"],"bin","buccaneer_pipeline"),
                "-stdin"
              ]

        # prepare report parser
        self.setGenericLogParser ( "buccaneer_report",True )

        # start buccaneer
        if sys.platform.startswith("win"):
            rc = self.runApp ( "ccp4-python.bat",cmd,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "ccp4-python",cmd,logType="Main",quitOnError=False )

        self.addCitations ( ['buccaneer','refmac5'] )

        self.putMessage1 ( self.report_page_id(),"",wcrvrow )

        have_results = False

        if rc.msg:
            self.flush()
            self.file_stdout.close()
            nobuild = False
            with (open(self.file_stdout_path(),'r')) as fstd:
                for line in fstd:
                    if "0 residues were built in   0 fragments, the longest having    0 residues." in line:
                        nobuild = True
                        break
            self.file_stdout  = open ( self.file_stdout_path(),'a' )
            self.putTitle ( "Results" )
            if nobuild:
                self.putMessage ( "<h3>Failed to build structure</h3>" )
            else:
                self.putMessage ( "<h3>Buccaneer failure</h3>" )
                # raise signal.JobFailure ( rc.msg )

        # check solution and register data
        elif os.path.isfile(self.buccaneer_xyz()):

            shutil.copyfile ( os.path.join(self.buccaneer_tmp(),"refine.mtz"),
                                           self.buccaneer_mtz() )

            self.putTitle ( "Built Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure" ) )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.buccaneer_mtz(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure (
                            None,
                            self.buccaneer_xyz(),
                            None,
                            self.buccaneer_mtz(),
                            leadKey = 1,
                            refiner = "refmac" 
                        )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations ( istruct )
                structure.addSubtypes      ( istruct.subtype )
                structure.removeSubtype    ( dtype_template.subtypeSubstructure() )
                structure.setXYZSubtype    ()
                structure.copyLabels       ( istruct )
                structure.setRefmacLabels  ( None    )
                structure.copyLigands      ( istruct )
                #structure.FP         = istruct.FP
                #structure.SigFP      = istruct.SigFP
                #structure.FreeR_flag = istruct.FreeR_flag
                structure.FP         = labin_fo[0]
                structure.SigFP      = labin_fo[1]
                structure.FreeR_flag = labin_fo[2]
                self.putStructureWidget    ( "structure_btn",
                                             "Structure and electron density",
                                             structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setStructureData  ( structure )
                #revision.removeSubtype     ( dtype_template.subtypeSubstructure() )
                self.registerRevision      ( revision  )
                have_results = True

                #self.copyTaskMetrics ( "refmac","R_factor","rfactor" )
                #self.copyTaskMetrics ( "refmac","R_free"  ,"rfree"   )
                #self.copyTaskMetrics ( "cbuccaneer","percentage","model_completeness" )

                rvrow0 = self.rvrow
                try:
                    qualrep.quality_report ( self,revision )
                except:
                    self.stderr ( " *** molprobity failure" )
                    self.rvrow = rvrow0

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision" : [revision]
                            },
                            "scores" :  {
                                "Compl"   : float(self.generic_parser_summary["cbuccaneer"]["percentage"]),
                                "Rfactor" : float(self.generic_parser_summary["refmac"]["R_factor"]),
                                "Rfree"   : float(self.generic_parser_summary["refmac"]["R_free"])
                            }
                    })
                    # self.putMessage ( "<h3>Workflow started</hr>" )

                else:
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                        "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                    })

        else:
            self.putTitle ( "No Output Generated" )

        if not have_results:
            if self.task.autoRunName.startswith("@"):
                # scripted workflow framework
                auto_workflow.nextTask ( self,{
                        "scores" :  {
                            "Compl" : 0.0
                        }
                })

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Buccaneer ( "",os.path.basename(__file__) )
    drv.start()
