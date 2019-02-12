##!/usr/bin/python

#
# ============================================================================
#
#    05.02.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#
#
#  Invocation:
#     ccp4-python ccp4build.py
#                 [--rvapi-prefix   jsrview]             \
#                 [--rdir           reportdir]           \
#                 [--rvapi-document rvapi_document]      \
#                 [--wkdir          workdir]             \
#                 [--outdir         outputdir]
#
#
#  Keyword file with default values for keywords:
#
#  [input_data]
#  mtzpath                  /path/to/mtzfile.mtz
#  xyzpath_ha               /path/to/hat-coorfile.pdb
#  xyzpath_mr               /path/to/xyz-coorfile.pdb
#  seqpath                  /path/to/seqfile{.seq|.fasta|.pir}
#
#  [parrot]
#  ncs-average            True
#  solvent-content        0.5
#  solvent-flatten        True
#  histogram-match        True
#  anisotropy-correction  True
#  cycles                 3
#  resolution             1.0
#  ncs-mask-filter-radius 6.0



import sys

import pyrvapi

import ccp4build_report


# ============================================================================

class Build(ccp4build_report.Report):

    # ----------------------------------------------------------------------

    def ccp4build_mr ( self ):

        meta = self.input_data.copy()
        if not meta["xyzpath"]:
            meta["xyzpath"] = meta["xyzpath_mr"]

        self.log ( "\nInitial refinement:\n" )
        self.setGenericLogParser ( True )
        meta  = self.refmac ( meta,mode="jelly",ncycles=50,nameout="refmac_init" )
        self.unsetLogParser()
        rmeta = meta["refmac"]
        self.log ([
            "R-factor: {0:7.3} -> {1:7.3}".format(rmeta["rfactor"][0],rmeta["rfactor"][1]),
            "R-free:   {0:7.3} -> {1:7.3}".format(rmeta["rfree"][0],rmeta["rfree"][1])
        ])

        self.putMessage ( "<h3>Performing build in Molecular Replacement Phases</h3>" )

        self.printMetrics ( -1,-1,None )
        self.prepareGraph()

        outer_cycles_max = self.input_data["outer_cycles_max"]
        outer_cycles_min = self.input_data["outer_cycles_min"]
        inner_cycles     = self.input_data["inner_cycles"]
        noimprove_cycles = self.input_data["noimprove_cycles"]*inner_cycles

        for i in range(outer_cycles_max):

            #  modify density

            meta["labin_hl"] = None
            #meta["xyzpath_mr"] = meta["xyzpath"]

            meta_dm = self.parrot ( meta,nameout=str(i)+"-parrot" )

            #  and start from empty list
            meta = dict ( meta_dm,xyzpath=None,labin_fc=None )

            for j in range(inner_cycles):

                prefix = str(i) + "_" + str(j) + "_"

                meta_mb = self.cbuccaneer ( meta,j,nameout=prefix+"cbuccaneer" )

                #  refine and adjust
                meta = self.refmac  ( dict(meta_dm,xyzpath=meta_mb["xyzpath"]),
                                      ncycles=10,nameout=prefix+"1.refmac" )
                meta = self.coot    ( meta,script="fill_partial_residues",
                                      nameout=prefix+"2.coot_fill" )
                meta = self.refmac  ( meta,ncycles=10,nameout=prefix+"3.refmac" )
                meta = self.coot    ( meta,script="fit_protein",
                                      nameout=prefix+"4.coot_fit" )
                meta = self.refmac  ( meta,ncycles=10,nameout=prefix+"5.refmac" )
                meta = self.coot    ( meta,script="stepped_refine_protein",
                                      nameout=prefix+"6.coot_refine" )
                meta = self.refmac  ( meta,ncycles=10,nameout=prefix+"7.refmac" )
                meta = self.edstats ( meta,nameout=prefix+"8.edstats" )

                meta["cbuccaneer"] = meta_mb["cbuccaneer"]
                self.stock_result ( meta )
                self.printMetrics ( i,j,meta )
                self.drawGraph()
                self.makeResultTable()

            if len(self.build_meta)-self.best_build_no>noimprove_cycles:
                break;

        return


    def ccp4build_ep ( self ):

        self.putMessage ( "<h3>Performing build in Experimental Phases</h3>" )

        meta = self.input_data.copy()
        #meta["xyzpath_ha"] = meta["xyzpath"]
        #meta["xyzpath"   ] = None

        self.printMetrics ( -1,-1,None )
        self.prepareGraph()

        outer_cycles_max = self.input_data["outer_cycles_max"]
        outer_cycles_min = self.input_data["outer_cycles_min"]
        inner_cycles     = self.input_data["inner_cycles"]
        noimprove_cycles = self.input_data["noimprove_cycles"]*inner_cycles

        for i in range(outer_cycles_max):

            #  modify density; note that meta contains xyzpath after previous
            #  iteration, or initial one if given on input
            meta_dm = self.parrot ( meta,nameout=str(i)+"-parrot" )

            #  and start building loop from empty structure
            meta = dict ( meta_dm,xyzpath=None,labin_fc=None )

            for j in range(inner_cycles):

                prefix = str(i) + "_" + str(j) + "_"

                meta_mb = self.cbuccaneer ( meta,j,nameout=prefix+"cbuccaneer" )

                #  refine and adjust
                meta = self.refmac  ( meta_mb,
                                      ncycles=10,nameout=prefix+"1.refmac" )
                meta = self.coot    ( meta,
                                      script="fill_partial_residues",
                                      nameout=prefix+"2.coot_fill" )
                meta = self.refmac  ( dict(meta_mb,xyzpath=meta["xyzpath"]),
                                      ncycles=10,nameout=prefix+"3.refmac" )
                meta = self.coot    ( meta,
                                      script="fit_protein",
                                      nameout=prefix+"4.coot_fit" )
                meta = self.refmac  ( dict(meta_mb,xyzpath=meta["xyzpath"]),
                                      ncycles=10,nameout=prefix+"5.refmac" )
                meta = self.coot    ( meta,
                                      script="stepped_refine_protein",
                                      nameout=prefix+"6.coot_refine" )
                meta = self.refmac  ( dict(self.input_data,xyzpath=meta["xyzpath"]),
                                      ncycles=20,nameout=prefix+"7.refmac" )
                meta = self.edstats ( meta,nameout=prefix+"8.edstats" )

                meta["cbuccaneer"] = meta_mb["cbuccaneer"]
                self.stock_result ( meta )
                self.printMetrics ( i,j,meta )
                self.drawGraph()
                self.makeResultTable()

            if len(self.build_meta)-self.best_build_no > noimprove_cycles:
                break;

        return


    def run ( self ):

        self.log ([
            " ",
            " INPUT DATA:",
            "---------------------------------------------------------------------------"
        ])
        self.readInputData        ()
        self.readParrotOptions    ()
        self.readCBuccaneerOptions()
        self.readRefmacOptions    ()
        self.log ([
            "---------------------------------------------------------------------------"
        ])

        if self.input_data["mode"]=="MR":
            self.ccp4build_mr()
        else:
            self.ccp4build_ep()

        return



def run():
    ccp4build = Build()
    ccp4build.run()
    return


# ============================================================================

if __name__ == '__main__':
    run()
