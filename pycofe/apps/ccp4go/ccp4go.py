##!/usr/bin/python

#
# ============================================================================
#
#    09.03.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4EZ Combined Auto-Solver
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#
#
#  Invocation:
#     ccp4-python ccp4go.py
#                 [--rvapi-prefix   jsrview]             \
#                 [--rdir           reportdir]           \
#                 [--rvapi-document rvapi_document]      \
#                 [--wkdir          workdir]             \
#                 [--outdir         outputdir]           \
#                 [--jobid          id]                  \
#                 [--sge]                                \
#                 [--qname          name]                \
#                 [--njobs          N]                   \
#                 [--no-simbad12]                        \
#                 [--no-morda]                           \
#                 [--no-crank2]                          \
#                 [--no-fitligands]
#
#  Input file:
#
#  HKLIN  mtzpath
#  SEQIN  seqpath
#  XYZIN  xyzpath
#  HATOMS type [number]
#
#  Metadata in rvapi document (will be overwritten by equivalent command-line
#  parameters if they are given):
#
#  { "jobId"         : jobId,         // used for naming output files
#    "stageNo"       : stageNo,       // starting stage number for report sections
#    "sge_q"         : queueName,     // used in MoRDa
#    "sge_tc"        : nSubJobs,      // used in MoRDa
#    "summaryTabId"  : summaryTabId,  // if tab created by calling process
#    "summaryTabRow" : summaryTabRow, // if tab created by calling process
#    "navTreeId"     : navTreeId,     // navigation tree id
#    "outputDir"     : outputDir,     // path for placing final output files
#    "outputName"    : outputName     // name template (no extension) for final
#                                     // output files
#  }
#

import ccp4go_fitligands

# ============================================================================

class CCP4go(ccp4go_fitligands.FitLigands):

    # ----------------------------------------------------------------------

    def getBestResults(self):
        dirname = ""
        rfree   = 2.0
        results = self.output_meta["results"]
        for d in results:
            if results[d]["nResults"]>0 and "rfree" in results[d]:
                if results[d]["rfree"]<rfree:
                    rfree   = results[d]["rfree"]
                    dirname = d
        return [dirname,rfree]

    # ----------------------------------------------------------------------

    def checkResult ( self,resdir,defdir,rfree ):
        results = self.output_meta["results"]
        d       = defdir
        r       = rfree
        if r<0.0:
            r = results["defdir"]
        if resdir in results:
            if results[resdir]["nResults"]>0:
                if results[resdir]["rfree"]<r:
                    d = resdir
        return d

    # ----------------------------------------------------------------------

    def run(self):

        branch_id = self.prepare_mtz ( "" )

        if not self.output_meta["retcode"]:
            self.dimple ( None,"dimple_mr","mr","" )

        if self.output_meta["retcode"] != "solved":
            self.simbad12 ( "" )
            if self.output_meta["retcode"] == "sequence problem":
                self.putMessage ( "<h3><i>---- Sequence data does not match " +
                        "solution (too many sequences given). Stop.</i></h3>" )
                self.write_meta()
                return
            elif self.output_meta["retcode"] == "sequence mismatch":
                self.putMessage ( "<h3><i>---- Sequence data does not match " +
                        "solution (too low homology). Stop.</i></h3>" )
                self.write_meta()
                return

        if self.output_meta["retcode"] != "solved":
            self.morda ( "" )

        if self.output_meta["retcode"] != "solved":
            self.crank2 ( "" )

        res   = self.getBestResults()
        d     = res[0]  # directory with lowest-rfree solution
        rfree = res[1]  # lowest rfree achieved

        if d and rfree <= 0.45:
            self.buccaneer  ( d,"buccaneer","" )
            d = self.checkResult ( "buccaneer",d,1.0 )
            self.acedrg     ( "acedrg","" )
            if "acedrg" in self.output_meta["results"]:
                if self.output_meta["results"]["acedrg"]["nResults"] > 0:
                    self.dimple  ( d,"dimple_refine","refine","" )
                    d = self.checkResult ( "dimple_refine",d,1.0 )
                    self.fitLigands ( d,"fitligands","" )
                #d1 = self.checkResult ( "fitligands",d,1.0 )
                #if d1!=d:
                #    self.lorestr ( "fitligands","" )
            if not "fitligands" in self.output_meta["results"]:
                self.dimple ( d,"dimple_refine","refine","" )
                #self.lorestr ( d,"lorestr","" )

        self.putMessage ( "<h3><i>---- Structure solution workflow " +
                          "completed.</i></h3>" )

        self.write_meta()
        return


# ============================================================================

if __name__ == '__main__':

    ccp4go = CCP4go()
    ccp4go.run()
