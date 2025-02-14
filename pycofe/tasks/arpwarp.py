#!/usr/bin/python

#
# ============================================================================
#
#    14.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ACORN EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python arpwarp.py jobManager jobDir jobId [queueName [nSubJobs]]
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2025
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
#import json

#  ccp4-python imports
#import pyrvapi

#  application imports
from . import basic
from   pycofe.dtypes  import dtype_template
from   pycofe.proc    import qualrep
from   pycofe.auto    import auto


# ============================================================================
# Make ArpWarp driver

class ArpWarp(basic.TaskDriver):

    def arpwarp_report(self):  return "arpwarp_report"

    # make task-specific definitions
    def arpwarp_mtz   (self):  return "__tmp_arpwarp.mtz"
    def arpwarp_seq   (self):  return "__tmp_arpwarp.seq"


    # ------------------------------------------------------------------------

    # arpwarp_wrk/PSP/temp_tracing/arp_out.pdb

    def run(self):

        # checks for case when Arp/wArp is run as a client job
        if sys.platform.startswith("win"):
            self.fail ( "<h3>Arp/wArp is not available on MS Windows systems.</h3>" +\
                        "Arp/wArp can be run only on UNIX systems.",
                        "Not available on MS Windows." )

        if not "warpbin" in os.environ:
            self.fail ( "<h3>Arp/wArp is not installed.</h3>" +\
                        "Arp/wArp not found on the device.",
                        "Arp/wArp is not installed." )

        # Prepare arpwarp job

        # fetch input data
        idata   = self.input_data.data
        sec1    = self.task.parameters.sec1.contains
        sec2    = self.task.parameters.sec2.contains

        hkl     = self.makeClass ( idata.hkl[0]     )
        istruct = self.makeClass ( idata.istruct[0] )
        seq     = idata.seq

        """
        cols    = []
        if istruct.initPhaseSel=="phases":
            # run cad here
            cols = istruct.getMeanF()
            cols.append ( istruct.FreeR_flag )
        else:
            cols = hkl.getMeanF()
            cols.append ( hkl.getFreeRColumn() )
        if cols[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        #  prepare input mtz with cad
        cmd = [ "HKLIN1",hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT",self.arpwarp_mtz() ]

        self.open_stdin()
        self.write_stdin ([
            "LABIN  FILE 1 E1=" + cols[0] + " E2=" + cols[1] + " E3=" + hkl.getFreeRColumn()
        ])
        labin = ""
        cn    = 1
        if istruct.PHI:
            labin = "E1=" + istruct.PHI + " E2=" + istruct.FOM
            cn    = 3
        if istruct.HLA:
            labin += " E%d=%s E%d=%s E%d=%s E%d=%s" %\
                     (cn,istruct.HLA,cn+1,istruct.HLB,cn+2,istruct.HLC,cn+3,istruct.HLD)
        if labin:
            self.write_stdin ([ "LABIN  FILE 2 " + labin ])
            cmd += [ "HKLIN2",istruct.getMTZFilePath(self.inputDir()) ]

        self.close_stdin()
        self.runApp ( "cad",cmd,logType="Service" )
        """

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
        if istruct.PHI:
            labin_ph += [istruct.PHI,istruct.FOM]
        if istruct.HLA:  #  experimental phases
            labin_ph += [istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD]

        self.makePhasesMTZ (
                hkl.getHKLFilePath(self.inputDir())    ,labin_fo,
                istruct.getMTZFilePath(self.inputDir()),labin_ph,
                self.arpwarp_mtz() )

        # prepare keyword file for arpwarp

        workdir = "arpwarp_wrk"
        pspdir  = os.path.join ( workdir,"PSP" )
        if not os.path.isdir(workdir):
            os.makedirs ( pspdir )
        reportdir = "arpwarp_report"
        if not os.path.isdir(reportdir):
            os.mkdir ( reportdir )
        resfile = "./wa.res"

        # prepare sequence file
        #  how to prepare for hererogenic multimeric ASU?
        nres = 0
        with open(self.arpwarp_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        nres += s1.size
                        newf.write(hf.read())
                    newf.write ( '\n' );
            else:
                newf.write ( ">polyUNK\nU\n" );

        twin = 0
        if hkl.useHKLSet in ["TI","TF"]:
            twin = 1

        cmdopt = ["datafile",self.arpwarp_mtz()]

        if hkl.useHKLSet=="PF":
            cmdopt += [ "phaselabin","PHIB=" + istruct.PHI + " FOM=" + istruct.FOM,
                        "phaseref","PHAS SCBL " + str(istruct.phaseBlur) ]

        elif hkl.useHKLSet=="HL":
            cmdopt += [ "phaselabin","HLA=" + istruct.HLA + " HLB=" + istruct.HLB +\
                                    " HLC=" + istruct.HLC + " HLD=" + istruct.HLD,
                        "phaseref","PHAS SCBL " + str(istruct.phaseBlur) ]

        if hasattr(istruct, 'initPhaseSel'):
            if istruct.initPhaseSel=="phases":
                cmdopt += [ "phibest" ,istruct.PHI,
                            "fom"     ,istruct.FOM ]
        else:
            if istruct.hasSubSubtype():
                cmdopt += [ "modelin",istruct.getSubFilePath(self.inputDir()) ]
            else:
                cmdopt += [ "modelin",istruct.getPDBFilePath(self.inputDir()) ]
            cmdopt += [ "freebuild",self.getCheckbox(sec1.AWA_FREEBUILD_CBX),
                        "flatten"  ,self.getCheckbox(sec1.AWA_FLATTEN_CBX) ]

        restraints = 0
        if self.getCheckbox(sec1.AWA_USE_COND_CBX):
            if self.getCheckbox(sec1.AWA_FORCECOND_CBX):
                restraints = 2
            else:
                restraints = 1

        side = -1
        if self.getCheckbox(sec1.AWA_BUILD_SIDE_CBX)==1:
            side = self.getParameter(sec1.AWA_SIDE_AFTER)

        buildingcycles = int(self.getParameter(sec1.AWA_BIG_CYCLES))
        restrref = int(self.getParameter(sec1.AWA_SMALL_CYCLES))
        cycskip  = int(self.getParameter(sec1.AWA_SKIP_CYCLES)) * restrref
        rrcyc    = buildingcycles * restrref

        scaleopt = self.getParameter ( sec2.AWA_SCA_SEL )
        if self.getParameter(sec2.AWA_SCANIS_SEL)=="ANIS":
            scaleopt += " LSSC ANIS"
        scalml = "SCAL MLSC"
        if self.getParameter(sec2.AWA_REFMAC_REF_SEL)=="F":
            scalml += " FREE"

        cmdopt += [
            # "sidemethod"      , "SNOW",
            #"fp"              , cols[0],
            #"sigfp"           , cols[1],
            #"freelabin"       , cols[3],
            "fp"              , labin_fo[0],
            "sigfp"           , labin_fo[1],
            "freelabin"       , labin_fo[2],
            "seqin"           , self.arpwarp_seq(),
            "residues"        , str(nres),
            "cgr"             , "1", # ask Grzhegosh
            "buildingcycles"  , str(buildingcycles),
            "restrref"        , str(restrref),
            "restraints"      , str(restraints),
            "ncsrestraints"   , self.getCheckbox (sec1.AWA_NCS_RESTRAINTS_CBX),
            "ncsextension"    , self.getCheckbox (sec1.AWA_NCS_EXTENSION_CBX),
            "loops"           , self.getCheckbox (sec1.AWA_LOOPS_CBX),
            "side"            , str(side),
            "albe"            , self.getCheckbox (sec1.AWA_ALBE_CBX),
            "cycskip"         , str(cycskip),
            "multit"          , self.getParameter(sec1.AWA_MULTITRACE),
            "fsig"            , self.getParameter(sec1.AWA_ADDATOM_SIGMA),
            "rsig"            , self.getParameter(sec1.AWA_REMATOM_SIGMA),
            "upmore"          , self.getParameter(sec1.AWA_UP_UPDATE),
            "twin"            , str(twin),
            "rrcyc"           , str(rrcyc),
            "wmat"            , self.getParameter(sec2.AWA_WEIGHT_MATRIX_SEL),
            "ridgerestraints" , self.getCheckbox (sec2.AWA_RIDGE_RESTRAINTS_CBX),
            "scaleopt"        , scaleopt,
            "scalml"          , scalml,
            "solvent"         , self.getCheckbox (sec2.AWA_SOLVENT_CBX),
            "workdir"         , os.path.join(os.getcwd(),workdir),
            "jobId"           , "PSP"
        ]

        #self.write_stdin ( arpwarp_params )

        if self.getParameter(sec2.AWA_WEIGHT_MATRIX_SEL)==1:
            #self.write_stdin ( ["weightv " + self.getParameter(sec2.AWA_WMAT)] )
            cmdopt += [ "weightv", self.getParameter(sec2.AWA_WMAT) ]

        #self.close_stdin()

        # run arpwarp

        arpwarp_params_dict = {}
        #for p in arpwarp_params:
        #    key,sep,value = p.partition(" ")
        #    arpwarp_params_dict[key] = value
        for i in range(0,len(cmdopt),2):
            arpwarp_params_dict[cmdopt[i]] = cmdopt[i+1]

        if self.getCheckbox(sec1.AWA_FREELOOPS_CBX):
            cmdopt += ["freeloops","1"]

        if self.getCheckbox(sec1.AWA_HOMOLOGY_CBX):
            cmdopt += ["homology","1"]

        self.setArpWarpLogParser ( self.getWidgetId(self.arpwarp_report()),
                                   arpwarp_params_dict,os.path.join(os.getcwd(),resfile) )

        #cmd = [ "-m", "pyrvapi_ext.parsers.arpwarp" ]
        #if sys.platform.startswith("win"):
        #    self.runApp ( "ccp4-python.bat",cmd )
        #else:
        #    self.runApp ( "ccp4-python",cmd )

        self.runApp ( "auto_tracing.sh",cmdopt,logType="Main" )

        self.unsetLogParser()

        self.addCitations ( ['arpwarp','refmac5'] )

        # check results
        outfiles = os.listdir ( pspdir )
        pdbouts = [f for f in outfiles if any(f.endswith(ext) for ext in ["trace.pdb"])]
        mtzouts = [f for f in outfiles if any(f.endswith(ext) for ext in ["trace.mtz"])]

        have_results = False

        if len(pdbouts)>0 and len(mtzouts)>0:

            pdbout = self.getXYZOFName()
            mtzout = self.getMTZOFName()

            shutil.copyfile ( os.path.join(pspdir,pdbouts[0]),pdbout )
            shutil.copyfile ( os.path.join(pspdir,mtzouts[0]),mtzout )

            self.putTitle ( "Arp/wArp Output" )

            with open(resfile) as f:
                lines   = f.read().splitlines()
                tableId = self.getWidgetId ( "rfactors_table" )
                rfactor = float(lines[2])
                rfree   = float(lines[1])
                if rfree>0.0 and rfactor>0.0:
                    self.generic_parser_summary["refmac"] = {
                        "R_factor" : rfactor,
                        "R_free"   : rfree
                    }


            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( mtzout,self.outputFName )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            structure = self.registerStructure (
                            None,
                            pdbout,
                            None,
                            mtzout,
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
                structure.copyLigands      ( istruct )
                self.putStructureWidget    ( "structure_btn",
                                             "Structure and electron density",
                                             structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.removeSubtype     ( dtype_template.subtypeSubstructure() )
                revision.setStructureData  ( structure )
                self.registerRevision      ( revision  )
                have_results = True

                rvrow0 = self.rvrow
                try:
                    qualrep.quality_report ( self,revision )
                    # meta = qualrep.quality_report ( self,revision )
                    # if "molp_score" in meta:
                    #     self.generic_parser_summary["refmac"]["molp_score"] = meta["molp_score"]
                except:
                    self.stderr ( " *** validation tools failure" )
                    self.rvrow = rvrow0 + 6

                auto.makeNextTask ( self,{
                    "revision" : revision,
                    "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                    "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                })

        else:
            self.putTitle ( "No Output Generated" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ArpWarp ( "",os.path.basename(__file__) )
    drv.start()
