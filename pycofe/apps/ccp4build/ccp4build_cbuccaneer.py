##!/usr/bin/python

#
# ============================================================================
#
#    31.03.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build CBuccaneer class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2025
#
# ============================================================================
#
#

# import sys
import os
import shutil

import gemmi

import ccp4build_parrot

# ============================================================================

class CBuccaneer(ccp4build_parrot.Parrot):

    # parrot options
    cbuccaneer_options = {
        #"cycles"                : 3,
        "anisotropy-correction" : True,
        "build-semet"           : False,
        "fast"                  : True,
        "resolution"            : 2.0,
        "correlation-mode"      : False,
        "new-residue-name"      : "UNK",
        "sequence-reliability"  : 0.95,  #  0.99, 0.95, 0.80
        #"model-filter"          : True,
        #"model-filter-sigma"    : 1.0,
        #"mr-model-filter-sigma" : 3.0,
        #"mr-model-seed"         : True,
        #"mr-model-filter"       : True,
        "jobs"                  : 2
    }

    # ----------------------------------------------------------------------

    def readCBuccaneerOptions ( self ):
        self.cbuccaneer_options = self.readPGMOptions ( "cbuccaneer",self.cbuccaneer_options )
        return

    # ----------------------------------------------------------------------

    def remove_waters ( self,xyzpath ):
        if xyzpath:
            xyzout = os.path.splitext(xyzpath)[0] + "_no_waters.pdb"
            st = gemmi.read_structure ( xyzpath )
            st.setup_entities()
            st.remove_waters()
            st.write_pdb ( xyzout )
            return xyzout
        return xyzpath


    # ----------------------------------------------------------------------

    def cbuccaneer (  self,
                      meta,      # meta dictionary
                      firstrun,  # True or False
                      nameout = "cbuccaneer"
                   ):

        self.open_script ( "cbuccaneer" )

        cbuccaneer_pdbout = os.path.join ( self.workdir,nameout+".pdb" )

        self.write_script ([
            "title "      + self.job_title + "_cbuccaneer",
            "pdbin-ref "  + self.getRefPDB(),
            "mtzin-ref "  + self.getRefMTZ(),
            "colin-ref-fo 	[/*/*/FP.F_sigF.F,/*/*/FP.F_sigF.sigF]",
            "colin-ref-hl 	[/*/*/FC.ABCD.A,/*/*/FC.ABCD.B,/*/*/FC.ABCD.C,/*/*/FC.ABCD.D]"
            #"colin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF",
            #"colin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D",
        ])

        #if meta["mode"]=="EP":
        #    self.write_script ([
        #        "pdbin-ref "  + self.getRefPDB(),
        #        "mtzin-ref "  + self.getRefMTZ(),
        #        "colin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF",
        #        "colin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D",
        #    ])

        self.write_script ([
            "seqin "      + self.input_data["seqpath"],
            "mtzin "      + meta["mtzpath"],
            "colin-fo "   + meta["labin_fo"],
            "colin-free " + meta["labin_free"],
            #"prefix "     + self.workdir,
            "pdbout "     + cbuccaneer_pdbout
        ])

        if meta["labin_hl"]:
            self.write_script ([
                "colin-hl "   + meta["labin_hl"]
            ])
        else:
            self.write_script ([
                "colin-phifom "   + meta["labin_phifom"]
            ])

        #if meta["labin_fc"]:
        #    self.write_script ([ "colin-fc " + meta["labin_fc"] ])

        if meta["xyzpath_mr"]:
            self.write_script ([ "pdbin-mr " + meta["xyzpath_mr"] ])

        if meta["xyzpath"]:
            self.write_script ([ "pdbin " + meta["xyzpath"] ])

        if firstrun:
            self.write_script ([ "cycles 3" ])
        else:
            if meta["labin_fc"]:
                self.write_script ([ "colin-fc " + meta["labin_fc"] ])
            self.write_script ([ "cycles 2" ])
            if meta["mode"]=="MR":
                self.write_script ([ "correlation-mode" ])

        #if meta["iteration"]>0:
        #    self.write_script ([
        #        "cycles 2",
        #        "correlation-mode"
        #    ])
        #else:
        #    self.write_script ([ "cycles 3" ])

        if meta["mode"]=="MR":
            self.write_script ([
                "mr-model-filter",
                "mr-model-filter-sigma  3",
                "mr-model-seed"
            ])
        else:
            self.write_script ([
                "model-filter",
                "model-filter-sigma  1"
            ])

        for opt in self.cbuccaneer_options:
            value = str(self.cbuccaneer_options[opt])
            if value=="True":
                value = ""
            if value!="False":
                self.write_script ( opt + " " + value + "\n" )

        self.close_script()

        stdout_fpath = self.getStdOutPath ( nameout )
        stderr_fpath = self.getStdErrPath ( nameout )
        self.runApp ( "cbuccaneer",['-stdin'],
                      fpath_stdout=stdout_fpath,fpath_stderr=stderr_fpath )

        unklist = []
        badlist = []

        if os.path.exists(cbuccaneer_pdbout):

            st = gemmi.read_structure(cbuccaneer_pdbout)
            st.setup_entities()
            # remove residues with insertion code and ones before them
            for model in st:
                for chain in model:
                    for res in chain:
                        if not str(res.seqid)[-1].isdigit():
                            badlist.append ( [model,chain.name,str(res.seqid),res.name ] )
                            prev_res = chain.previous_residue ( res )
                            if prev_res:
                                if str(prev_res.seqid)[-1].isdigit():
                                    badlist.append ( [model,chain.name,str(prev_res.seqid),prev_res.name ] )

            if len(badlist)>0:
                f = open ( stdout_fpath,"a" )
                f.write (
                    "\n\n ===================================================\n" +\
                    " Residues removed from built model\n\n" )
                for i in range(len(badlist)):
                    item  = badlist[i]
                    chain = item[0][item[1]]
                    res   = chain[item[2]][item[3]]
                    f.write ( " {0:3d}  ".format(i+1) + item[1] +\
                                        "/" + str(item[2]) + "(" + item[3] + ")\n" )
                    del res
                f.close()

            # rename UNKs to ALAs but keep them on the list
            for model in st:
                for chain in model:
                    for residue in chain:
                        if residue.name=="UNK":
                            residue.name = "ALA"
                            unklist.append ( [str(model.num),chain.name,str(residue.seqid),residue.name] )
            st.remove_empty_chains()
            st.write_pdb ( cbuccaneer_pdbout )

            shutil.copyfile ( cbuccaneer_pdbout,self.current_pdb )

        else:
            cbuccaneer_pdbout = None  # to indicate that results were not produced

        out_meta = meta.copy()
        out_meta["xyzpath"   ] = cbuccaneer_pdbout  # output coordinates
        out_meta["cbuccaneer"] = self.getCBuccaneerMetrics ( stdout_fpath,len(badlist) )
        out_meta["cbuccaneer"]["unklist"]     = unklist
        out_meta["cbuccaneer"]["unklist_len"] = len(unklist)
        self.writeWebCootLegend ( out_meta )

        return  out_meta


    def getCBuccaneerMeta0 ( self,meta0=None ):
        meta = {}
        meta["n_res_built"]      = 0
        meta["n_fragments"]      = 0
        meta["longest_fragment"] = 0
        meta["n_res_sequenced"]  = 0
        meta["n_res_alloc"]      = 0
        meta["n_chains_alloc"]   = 0
        meta["res_complete"]     = 0.0
        meta["chain_complete"]   = 0.0
        meta["unklist"]          = []
        meta["unklist_len"]      = 0
        if meta0:
            st = gemmi.read_structure ( meta0["xyzpath"] )
            st.setup_entities()
            for model in st:
                meta["n_chains_alloc"] = len(model)
                meta["n_res_built"] = 0
                for chain in model:
                    meta["n_res_built"] += len(chain)
            meta["n_fragments"] = meta["n_chains_alloc"]

        return meta


    def getCBuccaneerMetrics ( self,stdout_fpath,nbad ):

        meta = self.getCBuccaneerMeta0()
        #n_res_built = meta["n_res_built"]

        """
        meta["n_res_built"]      = 0
        meta["n_fragments"]      = 0
        meta["longest_fragment"] = 0
        meta["n_res_sequenced"]  = 0
        meta["n_res_alloc"]      = 0
        meta["n_chains_alloc"]   = 0
        meta["res_complete"]     = 0.0
        meta["chain_complete"]   = 0.0
        meta["cbuccaneer"]["unklist"]     = []
        meta["cbuccaneer"]["unklist_len"] = 0
        """

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

        #meta["n_res_built"] = max ( n_res_built,meta["n_res_built"] )

        if nbad>0:
            meta["n_res_built"]     -= nbad
            meta["n_res_sequenced"]  = min(meta["n_res_built"],meta["n_res_sequenced"])
            meta["n_res_alloc"]      = min(meta["n_res_built"],meta["n_res_alloc"])

        return meta
