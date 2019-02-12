##!/usr/bin/python

#
# ============================================================================
#
#    31.01.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build CBuccaneer class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#
#

import sys
import os

import ccp4build_parrot

# ============================================================================

class CBuccaneer(ccp4build_parrot.Parrot):

    # parrot options
    cbuccaneer_options_1 = {
        "cycles"                : 3,
        "anisotropy-correction" : True,
        "build-semet"           : False,
        "fast"                  : True,
        "resolution"            : 2.0,
        "correlation-mode"      : False,
        "new-residue-name"      : "ALA",
        #"sequence-reliability"  : 0.95,  #  0.99, 0.95, 0.80
        "model-filter"          : True,
        "model-filter-sigma"    : 1.0,
        "mr-model-filter-sigma" : 3.0,
        "mr-model-seed"         : True,
        "mr-model-filter"       : True,
        "jobs"                  : 2
    }

    cbuccaneer_options_n = {
        "cycles"                : 2,
        "anisotropy-correction" : True,
        "build-semet"           : False,
        "fast"                  : True,
        "resolution"            : 2.0,
        "new-residue-name"      : "ALA",
        "model-filter"          : True,
        "model-filter-sigma"    : 1.0,
        "correlation-mode"      : False,
        #"sequence-reliability"  : 0.95,  #  0.99, 0.95, 0.80
        "mr-model-filter-sigma" : 3.0,
        "mr-model-seed"         : True,
        "mr-model-filter"       : True,
        "jobs"                  : 2
    }

    """
    mtzin 	/Users/eugene/CCP4I2_PROJECTS/4gos/CCP4_JOBS/job_9/job_4/hklin.mtz
    colin-fo 	F_SIGF_F,F_SIGF_SIGF
    colin-hl 	ABCD_HLA,ABCD_HLB,ABCD_HLC,ABCD_HLD
    colin-free 	FREERFLAG_FREER
    seqin 	/Users/eugene/CCP4I2_PROJECTS/4gos/CCP4_JOBS/job_9/job_4/seqin.fasta
    pdbin 	/Users/eugene/CCP4I2_PROJECTS/4gos/CCP4_JOBS/job_9/job_3/XYZOUT.pdb
    colin-fc 	FWT_PHWT_IN_F,FWT_PHWT_IN_PHI
    pdbout 	/Users/eugene/CCP4I2_PROJECTS/4gos/CCP4_JOBS/job_9/job_4/XYZOUT.pdb
    xmlout 	/Users/eugene/CCP4I2_PROJECTS/4gos/CCP4_JOBS/job_9/job_4/program.xml
    cycles 	2
    anisotropy-correction
    fast
    resolution 	2.0
    new-residue-name 	UNK
    model-filter
    model-filter-sigma 	1.0
    pdbin-mr 	/Users/eugene/CCP4I2_PROJECTS/4gos/CCP4_JOBS/job_9/job_1/XYZOUT.pdb
    mr-model-filter-sigma 	2.0
    mr-model-seed
    mr-model-filter
    """

    # ----------------------------------------------------------------------

    def readCBuccaneerOptions ( self ):
        self.cbuccaneer_options = self.readPGMOptions ( "cbuccaneer_1",self.cbuccaneer_options_1 )
        self.cbuccaneer_options = self.readPGMOptions ( "cbuccaneer_n",self.cbuccaneer_options_n )
        return

    # ----------------------------------------------------------------------

    def cbuccaneer (  self,
                      meta,      # meta dictionary
                      iter_cnt,  # iteration count:  0,1,...,N
                      nameout = "cbuccaneer"
                ):

        self.open_script ( "cbuccaneer" )

        cbuccaneer_pdbout = os.path.join ( self.workdir,nameout+".pdb" )

        self.write_script ([
            "title "      + self.job_title + "_cbuccaneer"
        ])

        """
        if meta["mode"]=="EP":
            self.write_script ([
                "pdbin-ref "  + self.getRefPDB(),
                "mtzin-ref "  + self.getRefMTZ(),
                "colin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF",
                "colin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D",
            ])
        """

        self.write_script ([
            "seqin "      + self.input_data["seqpath"],
            "mtzin "      + meta["mtzpath"],
            "colin-fo "   + meta["labin_fo"],
            "colin-hl "   + meta["labin_hl"],
            "colin-free " + meta["labin_free"],
            #"prefix "     + self.workdir,
            "pdbout "     + cbuccaneer_pdbout
        ])

        if meta["labin_fc"]:
            self.write_script ([ "colin-fc " + meta["labin_fc"] ])

        if meta["mode"]=="MR":
            self.write_script ([ "pdbin-mr " + meta["xyzpath_mr"] ])

        if meta["xyzpath"]:
            self.write_script ([ "pdbin " + meta["xyzpath"] ])

        options = self.cbuccaneer_options_1
        if iter_cnt>0:
            options = self.cbuccaneer_options_n

        for opt in options:
            value = str(options[opt])
            if value=="True":
                value = ""
            if value!="False":
                self.write_script ( opt + " " + value + "\n" )

        self.close_script()

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        self.runApp ( "cbuccaneer",['-stdin'],
                      fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        out_meta = meta.copy()
        out_meta["xyzpath"   ] = cbuccaneer_pdbout  # output coordinates
        out_meta["cbuccaneer"] = self.getCBuccaneerMetrics ( stdout_fpath )

        return  out_meta


    def getCBuccaneerMetrics ( self,stdout_fpath ):
        meta = {}
        with open(stdout_fpath,"r") as f:
            key = 0
            for line in f:
                if key>0:
                    lst = line.split()
                    if "residues were built" in line:
                        meta["n_res_built"]      = int(lst[0])
                        meta["n_fragments"]      = int(lst[5])
                        meta["longest_fragment"] = int(lst[10])
                    elif "residues were sequenced," in line:
                        meta["n_res_sequenced"]  = int(lst[0])
                    elif "residues were uniquely" in line:
                        meta["n_res_alloc"]      = int(lst[0])
                        meta["n_chains_alloc"]   = int(lst[6])
                    elif "Completeness by residues" in line:
                        meta["res_complete"]     = float(lst[4].replace("%",""))
                    elif "Completeness of chains" in line:
                        meta["chain_complete"]   = float(lst[4].replace("%",""))
                        break;
                elif "$TEXT:Result: $$ $$" in line:
                    key = 1
        return meta
