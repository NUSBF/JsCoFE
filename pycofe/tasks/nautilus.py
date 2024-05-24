##!/usr/bin/python

#
#  TASK RETIRED 24.05.2024
#

#
# ============================================================================
#
#    13.01.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BUCCANEER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python nautilus.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir      is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2024
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
from . import basic
from   pycofe.dtypes  import dtype_template
from   varut          import signal


# ============================================================================
# Make Nautilus driver

class Nautilus(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path (self):  return "nautilus.script"

    # make task-specific definitions
    def nautilus_seq   (self):  return "nautilus.seq"
    def nautilus_xyz   (self):  return "nautilus.pdb"
    def nautilus_mtz   (self):  return "nautilus.mtz"
    def nautilus_tmp   (self):  return "nautilus_pipeline"

    # ------------------------------------------------------------------------

    def addCmdLine ( self,keyword,line ):
        self.write_stdin ( keyword + " " + line + "\n" )
        return

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When nautilus
        # succeeds, this file is created.
        if os.path.isfile(self.nautilus_xyz()):
            os.remove(self.nautilus_xyz())

        if not os.path.exists(self.nautilus_tmp()):
            os.makedirs(self.nautilus_tmp())

        # Prepare nautilus input
        # fetch input data

        idata   = self.input_data.data
        sec1    = self.task.parameters.sec1.contains

        hkl     = self.makeClass ( idata.hkl[0]     )
        istruct = self.makeClass ( idata.istruct[0] )
        seq     = idata.seq
        if hasattr(idata,"ixyz"):
            ixyz = self.makeClass ( idata.ixyz[0] )
        else:
            ixyz = istruct

        # prepare input MTZ file by putting original reflection data into
        # phases MTZ

        labin_fo = hkl.getMeanF()
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
        else:  # MR phases
            labin_ph = [istruct.PHI,istruct.FOM]

        self.makePhasesMTZ (
                hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
                istruct.getMTZFilePath(self.inputDir()),labin_ph,
                input_mtz )

        with open(self.nautilus_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );
            else:
                newf.write ( ">polyUNK\nU\n" );

        #refname = "reference-" + sec2.REFMDL_SEL.value
        isCoor  = ixyz.hasXYZSubtype();

        self.open_stdin()
        #reffile = os.path.join(os.environ["CCP4"],"lib","data","reference_structures",refname)
        self.addCmdLine ( "title Job" ,self.job_id.zfill(4) )
        self.addCmdLine ( "seqin"     ,self.nautilus_seq() )
        self.addCmdLine ( "mtzin"     ,input_mtz )
        self.addCmdLine ( "colin-fo"  ,"[/*/*/" + labin_fo[0] + ",/*/*/" + labin_fo[1] + "]" )
        self.addCmdLine ( "colin-free","[/*/*/" + labin_fo[2] + "]" )
        if istruct.HLA:
            self.addCmdLine ( "colin-hl","[/*/*/" + istruct.HLA + ",/*/*/" + istruct.HLB +\
                                         ",/*/*/" + istruct.HLC + ",/*/*/" + istruct.HLD + "]" )
        else:
            self.addCmdLine ( "colin-phifom","[/*/*/" + istruct.PHI + ",/*/*/" + istruct.FOM + "]" )
        self.addCmdLine ( "pdbout",self.nautilus_xyz()  )

        if isCoor and istruct.useModelSel!="N":
            self.addCmdLine ( "pdbin",ixyz.getPDBFilePath(self.inputDir()) )

        #self.addCmdLine ( "pdbin-ref",reffile + ".pdb" )
        #self.addCmdLine ( "mtzin-ref",reffile + ".mtz" )
        #self.addCmdLine ( "colin-ref-fo","[/*/*/FP.F_sigF.F,/*/*/FP.F_sigF.sigF]" )
        #self.addCmdLine ( "colin-ref-hl","[/*/*/FC.ABCD.A,/*/*/FC.ABCD.B,/*/*/FC.ABCD.C,/*/*/FC.ABCD.D]" )
        #self.addCmdLine ( "colin-fo"  ,"[/*/*/" + istruct.FP + ",/*/*/" + istruct.SigFP + "]" )
        #self.addCmdLine ( "colin-free","[/*/*/" + istruct.FreeR_flag + "]" )

        self.write_stdin (
            self.putKWParameter ( sec1.NCYCLES       ) + \
            self.putKWParameter ( sec1.ANISO_CBX     )
        #    self.putKWParameter ( sec1.REFPHASES_CBX ) + \
        #    self.putKWParameter ( sec1.REFTWIN_CBX   )
        )

        #self.addCmdLine ( "refmac-mlhl",self.getParameter(sec1.REFPHASES_CBX) )
        #self.addCmdLine ( "refmac-twin",self.getParameter(sec1.REFTWIN_CBX)   )

        self.writeKWParameter ( sec1.REFPHASES_CBX )
        self.writeKWParameter ( sec1.REFTWIN_CBX   )

        if self.getParameter(sec1.AUTOWEIGH_CBX)=="False":
            self.addCmdLine ( "refmac-weight",self.getParameter(sec1.WEIGHTVAL) )

        if hkl.res_high:
            self.addCmdLine ( "nautilus-resolution",hkl.res_high )


        # Fixed model to be preserved by Nautilus

        """
        xmodel = None
        smodel = None
        if hasattr(idata,"xmodel"):
            xmodel = self.makeClass(idata.xmodel[0])
            self.addCmdLine ( "pdbin",xmodel.getPDBFilePath(self.inputDir()) )

        if hasattr(idata,"smodel"):
            smodel = self.makeClass(idata.smodel[0])
            self.addCmdLine ( "pdbin-sequence-prior",
                              smodel.getPDBFilePath(self.inputDir()) )

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
            self.addCmdLine ( "nautilus-keyword model-filter-sigma",str(xmodel.BFthresh) )

        if isCoor:
            self.addCmdLine ( "nautilus-keyword mr-model-filter-sigma",str(ixyz.BFthresh) )

        if isCoor:
            self.addCmdLine ( "pdbin-mr",ixyz.getPDBFilePath(self.inputDir()) )
            if istruct.useModelSel!="N":
                self.addCmdLine ( "nautilus-keyword",ixyz.useModelSel )

        self.write_stdin ( self.putKWParameter ( sec3.REFTWIN_CBX ) )

        """

        self.addCmdLine ( "prefix","./" + self.nautilus_tmp() + "/" )

        self.close_stdin()

        # make command-line parameters
        cmd = [ "-u",
                os.path.join(os.environ["CCP4"],"bin","nautilus_pipeline"),
                "-stdin"
              ]

        # prepare report parser
        self.setGenericLogParser ( "nautilus_report",True )

        # start nautilus
        if sys.platform.startswith("win"):
            rc = self.runApp ( "ccp4-python.bat",cmd,logType="Main",quitOnError=False )
        else:
            rc = self.runApp ( "ccp4-python",cmd,logType="Main",quitOnError=False )

        self.addCitations ( ['nautilus','refmac5'] )

        have_results = False

        if rc.msg:
            nobuild = False
            self.flush()
            self.file_stdout.close()

            #$TEXT:Result: $$ $$
            #     25 sugar-phosphate residues built in   2 chains, the longest having   15 residues.
            #     15 nucleic acids were sequenced.

            with (open(self.file_stdout_path(),'r')) as fstd:
                for line in fstd:
                    if "0 sugar-phosphate residues built in   0 chains, the longest having    0 residues" in line:
                        nobuild = True
                        break
            self.file_stdout = open ( self.file_stdout_path(),'a' )
            self.putTitle ( "Results" )
            if nobuild:
                self.putMessage ( "<h3>Failed to build structure</h3>" )
            else:
                self.putMessage ( "<h3>Nautilus failure</h3>" )
                raise signal.JobFailure ( rc.msg )

        # check solution and register data
        elif os.path.isfile(self.nautilus_xyz()):

            shutil.copyfile ( os.path.join(self.nautilus_tmp(),"refine.mtz"),
                                           self.nautilus_mtz() )

            self.putTitle ( "Nautilus Output" )
            self.unsetLogParser()

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( self.nautilus_mtz(),self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure (
                                None,
                                self.nautilus_xyz(),
                                None,
                                self.nautilus_mtz(),
                                leadKey = 1,
                                refiner = "refmac" 
                            )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
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
                revision.removeSubtype     ( dtype_template.subtypeSubstructure() )
                revision.setStructureData  ( structure )
                self.registerRevision      ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Nautilus ( "",os.path.basename(__file__) )
    drv.start()
