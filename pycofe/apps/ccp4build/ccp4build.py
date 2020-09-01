##!/usr/bin/python

#
# ============================================================================
#
#    31.08.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2020
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
import os
import shutil

import pyrvapi

import ccp4build_report


# ============================================================================

class Build(ccp4build_report.Report):

    # ------------------------------------------------------------------------

    """
    def _choose_build ( self,meta1,meta2,item_name ):
        n1 = meta1["cbuccaneer"][item_name]
        n2 = meta2["cbuccaneer"][item_name]
        if n1>n2:
            return 1
        elif n1<n2:
            return 2
        return 0

    def chooseBuild ( self,meta1,meta2 ):
        n = self._choose_build ( meta1,meta2,"n_res_built" )
        if n==0:  n = self._choose_build ( meta1,meta2,"n_res_sequenced" )
        if n==0:  n = self._choose_build ( meta1,meta2,"n_res_alloc" )
        if n==0:  n = self._choose_build ( meta2,meta1,"unklist_len" )
        if n==0:  n = 1
        return n
    """

    def choose_solution ( self,workflow_ind,meta1,meta2 ):
        #  meta1 : check-point
        #  meta2 : trial
        rfree1 = meta1["refmac"]["rfree"][1]
        rfree2 = meta2["refmac"]["rfree"][1]
        if rfree1<rfree2-self.input_data["rfree_threshold"]:
            #  roll back to check point
            self.workflow += "-" * len(workflow_ind)
            return meta1
        elif rfree1<=rfree2+self.input_data["rfree_threshold"]:
            rfactor1 = meta1["refmac"]["rfactor"][1]
            rfactor2 = meta2["refmac"]["rfactor"][1]
            #if rfactor1<rfactor2:
            if abs(rfree1-rfactor1)<abs(rfree2-rfactor2):
                #  roll back to check point
                self.workflow += "-" * len(workflow_ind)
                return meta1
        #  in case of no roll-back, accept trial
        self.workflow += workflow_ind
        return meta2

    """
    def choose_solution ( self,workflow_ind,meta1,meta2 ):
        rfactor1 = meta1["refmac"]["rfactor"][1]
        rfactor2 = meta2["refmac"]["rfactor"][1]
        if rfactor1<rfactor2:
            self.workflow += "-"
            return meta1
        elif rfactor1==rfactor2:
            rfree1 = meta1["refmac"]["rfree"][1]
            rfree2 = meta2["refmac"]["rfree"][1]
            if rfree1<rfree2:
                self.workflow += "-"
                return meta1
        self.workflow += workflow_ind
        return meta2
    """

    """
    def choose_build ( self,workflow_ind,meta1,meta2 ):
        zedcc1 = meta1["edstats"]["ZEDCC"]
        zedcc2 = meta2["edstats"]["ZEDCC"]
        if zedcc1>zedcc2:
            self.workflow += "-"
            return meta1
        elif zedcc1==zedcc2:
            edcc1 = meta1["edstats"]["EDCC"]
            edcc2 = meta2["edstats"]["EDCC"]
            if edcc1>edcc2:
                self.workflow += "-"
                return meta1
            elif edcc1==edcc2:
                return self.choose_solution ( workflow_ind,meta1,meta2 )
        self.workflow += workflow_ind
        return meta2
    """

    ref_cycles = [
        { "initial":10, "inter":5,  "final":10 },
        { "initial":20, "inter":7,  "final":15 },
        { "initial":50, "inter":10, "final":20 },
    ]


    def ccp4build_mr ( self ):

        refcyc = self.ref_cycles[min(3,max(0,int(self.input_data["ref_level"])-1))]

        meta = self.input_data.copy()
        if not meta["xyzpath"]:
            meta["xyzpath"] = meta["xyzpath_mr"]

        if meta["xyzpath"]:
            meta["labin_phifom"] = None
            meta["labin_fc"]     = None
            self.log ( "\nInitial refinement:\n" )
            self.setRefmacLogParser ( True )
            #self.setGenericLogParser ( True )
            meta  = self.refmac ( meta,mode="jelly",ncycles=refcyc["initial"],nameout="00-1.refmac" )
            self.unsetLogParser()
            rmeta = meta["refmac"]
            self.log ([
                "R-factor: {0:7.3} -> {1:5.3}".format(rmeta["rfactor"][0],rmeta["rfactor"][1]),
                "R-free:   {0:7.3} -> {1:5.3}".format(rmeta["rfree"][0],rmeta["rfree"][1])
            ])

        #self.putMessage ( "<h3>Performing build in Molecular Replacement Phases</h3>" )
        self.putMessage ( "<table style=\"width:100%;   \"><tr><td>" +\
                          "<h3>Performing build in Molecular Replacement Phases</h3></td>" +\
                          "<td><div style=\"font-size:85%;width:100%;text-align:right\">" +\
                          "<i>CCP4Build v."+self.appVersion+"</i></div></td></tr></table>" )

        self.printMetrics ( -1,None )
        self.prepareGraph()

        cycles_max = int(self.input_data["cycles_max"])
        cycles_min = int(self.input_data["cycles_min"])
        noimprove_cycles = int(self.input_data["noimprove_cycles"])

        dm_mode     = self.input_data["dm_mode"  ]
        fill_mode   = self.input_data["fill_mode"]
        fit_mode    = self.input_data["fit_mode" ]
        rsr_mode    = self.input_data["rsr_mode" ]

        trim_waters = self.input_data["trim_waters"] and \
            float(self.input_data["res_high"])<=float(self.input_data["trim_wat_resol"])

        meta["xyzpath_mr"] = meta["xyzpath"]  #  to be used in first buccaneer

        for i in range(cycles_max):

            #meta0 = meta

            self.workflow = ""  # will keep track of workflow for reporting
            prefix = str(i+1).zfill(2) + "_"

            #self.input_data["mode"] = "MR"  # resume "MR" mode

            #  remove waters from current model
            meta["xyzpath_mr"] = self.remove_waters ( meta["xyzpath_mr"] )
            meta["xyzpath"]    = self.remove_waters ( meta["xyzpath"]    )

            #meta["labin_hl"]   = None  # enforce using PHIFOM at all times

            #  modify density

            if dm_mode in ["auto","never"]:
                #  first attempt: build without DM
                meta_mb1 = self.cbuccaneer ( dict(meta,xyzpath=None,labin_fc=None),
                                             nameout=prefix+"01-1.cbuccaneer" )

            if dm_mode in ["auto","always"]:
                #  second attempt: build after DM
                meta_dm  = self.parrot      ( meta,nameout=prefix+"01-2.parrot" )
                meta_mb2 = self.cbuccaneer  ( dict(meta_dm,xyzpath=None,labin_fc=None),
                                              nameout=prefix+"01-2.cbuccaneer" )

                if dm_mode=="auto":
                    n1 = meta_mb1["cbuccaneer"]["n_res_built"]
                    n2 = meta_mb2["cbuccaneer"]["n_res_built"]
                    if n1>0 and n2>0:
                        meta_mb = self.choose_solution ( "M",
                                self.refmac(meta_mb1,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac"),
                                self.refmac(meta_mb2,ncycles=refcyc["inter"],nameout=prefix+"03-2.refmac")
                        )
                    elif n2>0:
                        self.workflow += "M"
                        #self.input_data["mode"] = "EP"  # switch to EP mode until next iteration
                        meta_mb = self.refmac(meta_mb2,ncycles=refcyc["inter"],nameout=prefix+"03-2.refmac")
                    elif n1>0:
                        self.workflow += "-"
                        meta_mb = self.refmac(meta_mb1,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac")
                    else:
                        self.workflow += "*"
                        meta_mb = meta_mb1  # will break later
                else:
                    self.workflow += "M"
                    meta_mb = meta_mb2
            else:
                self.workflow += "-"
                meta_mb = meta_mb1

            if meta_mb["cbuccaneer"]["n_res_built"]<=0:
                break

            meta1 = self.refmac ( self.edstats(meta_mb,trim="all",
                                               nameout=prefix+"04.edstats",
                                               collectStats=False),
                                  ncycles=refcyc["inter"],nameout=prefix+"05.refmac" )
            meta1["trim"] = meta1["edstats"]

            coot_script   = []
            coot_workflow = ["-","-","-"]
            if fill_mode in ["auto","always"]:
                coot_script.append ( "fill_partial_residues" )
                coot_workflow[0] = "E"
            if fit_mode in ["auto","always"]:
                coot_script.append ( "fit_protein" )
                coot_workflow[1] = "F"
            if rsr_mode in ["auto","always"]:
                coot_script.append ( "stepped_refine_protein" )
                coot_workflow[2] = "R"
            coot_ind = "".join(coot_workflow)

            if len(coot_script)>0:
                meta4 = self.refmac ( self.coot(meta1,coot_script,
                                                nameout=prefix+"06.coot" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"07.refmac" )
                if fill_mode=="auto" or fit_mode=="auto" or rsr_mode=="auto":
                    meta4 = self.choose_solution ( coot_ind,meta1,meta4 )
                else:
                    self.workflow += coot_ind
            else:
                self.workflow += coot_ind
                meta4 = meta1


            """
            if fill_mode in ["auto","always"]:
                meta2 = self.refmac ( self.coot(meta1,["fill_partial_residues"],
                                                nameout=prefix+"06.coot_fill" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"07.refmac" )
                if fill_mode=="auto":
                    meta2 = self.choose_solution ( "E",meta1,meta2 )
                else:
                    self.workflow += "E"
            else:
                self.workflow += "-"
                meta2 = meta1

            if fit_mode in ["auto","always"]:
                meta3 = self.refmac ( self.coot(meta2,["fit_protein"],
                                                nameout=prefix+"08.coot_fit" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"09.refmac" )
                if fit_mode=="auto":
                    meta3 = self.choose_solution ( "F",meta2,meta3 )
                else:
                    self.workflow += "F"
            else:
                self.workflow += "-"
                meta3 = meta2

            if rsr_mode in ["auto","always"]:
                meta4 = self.refmac ( self.coot(meta3,["stepped_refine_protein"],
                                                nameout=prefix+"10.coot_refine" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"11.refmac" )
                if rsr_mode=="auto":
                    meta4 = self.choose_solution ( "R",meta3,meta4 )
                else:
                    self.workflow += "R"
            else:
                self.workflow += "-"
                meta4 = meta3
            """

            if trim_waters:
                if meta4["refmac"]["rfree"][1]<=float(self.input_data["trim_wat_rfree"]):
                    meta_rf = self.choose_solution ( "W",meta4,
                                self.refmac (
                                    self.findwaters(meta4,
                                              nameout=prefix+"12.findwaters" ),
                                    ncycles=refcyc["inter"],nameout=prefix+"13.refmac" ) )
                else:
                    self.workflow += "-"
                    meta_rf = meta4
            else:
                self.workflow += "-"
                meta_rf = meta4

            meta_ed = self.edstats ( dict(meta_rf,cbuccaneer=meta_mb["cbuccaneer"]),
                                     nameout=prefix+"14.edstats",collectStats=True )

            meta_rf["edstats"] = meta_ed["edstats"]
            self.stock_result  ( meta_rf )
            self.printMetrics  ( i,meta_rf )
            self.rvapiDrawGraph()
            self.drawEDStats   ( meta_ed["edstats"]["reslist"],i+1 )

            if self.rvrow_results<=0:
                self.putMessage ( "&nbsp;" )
                self.rvrow_results = self.rvrow
                self.rvrow += 4

            self.rvapiMakeResultTable ( "res_rfree","Build with the lowest R<sub>free</sub>",
                                        self.output_name_rfree,self.best_rfree_build_no )
            self.rvapiMakeResultTable ( "res_edcc","&nbsp;<br>Build with the highest ED Correlation",
                                        self.output_name_edcc,self.best_edcc_build_no )
            self.rvapiMakeResultTable ( "res_nbuilt","&nbsp;<br>Build with the highest number of residues built",
                                        self.output_name_nbuilt,self.best_nbuilt_build_no )
            self.rvapiMakeResultTable ( "res_nfrag" ,"&nbsp;<br>Build with the least number of fragments",
                                        self.output_name_nfrag,self.best_nfrag_build_no )

            last_best = max ( self.best_rfree_build_no,
                              max ( self.best_edcc_build_no,
                                    self.best_nbuilt_build_no ) )
            if len(self.build_meta)-last_best > noimprove_cycles:
                break
            #elif i>2:
            #    meta = meta0  # revert
            elif i<cycles_max-1:
                meta = self.refmac ( dict(meta_ed,labin_hl=None),ncycles=refcyc["final"],
                                     nameout=prefix+"15.refmac" )
                meta["xyzpath_mr"] = meta   ["xyzpath"]  #  for next buccaneer
                meta["xyzpath"]    = meta_rf["xyzpath"]  #  for next parrot

            self.flush()

        self.printMetrics ( -2,None )

        return


    def ccp4build_ep ( self ):

        refcyc = self.ref_cycles[min(3,max(0,int(self.input_data["ref_level"])-1))]

        #self.putMessage ( "<h3>Performing build in Experimental Phases</h3>" )

        #self.putMessage ( "<div style=\"font-size:85%;width:100%;text-align:right\">CCP4Build v." +\
        #                  self.appVersion + "</div>" );
        self.putMessage ( "<table style=\"width:100%;   \"><tr><td>" +\
                          "<h3>Performing build in Experimental Phases</h3></td>" +\
                          "<td><div style=\"font-size:85%;width:100%;text-align:right\">" +\
                          "<i>CCP4Build v."+self.appVersion+"</i></div></td></tr></table>" )


        meta = self.input_data.copy()
        #meta["xyzpath_ha"] = meta["xyzpath"]
        #meta["xyzpath"   ] = None

        self.printMetrics ( -1,None )
        self.prepareGraph()

        cycles_max = int(self.input_data["cycles_max"])
        cycles_min = int(self.input_data["cycles_min"])
        noimprove_cycles = int(self.input_data["noimprove_cycles"])

        dm_mode     = self.input_data["dm_mode"  ]
        fill_mode   = self.input_data["fill_mode"]
        fit_mode    = self.input_data["fit_mode" ]
        rsr_mode    = self.input_data["rsr_mode" ]

        trim_waters = self.input_data["trim_waters"] and float(self.input_data["res_high"])<=float(self.input_data["trim_wat_resol"])

        for i in range(cycles_max):

            self.workflow = ""  # will keep track of workflow for reporting
            prefix = str(i+1).zfill(2) + "_"

            #  remove waters from current model
            meta["xyzpath_mr"] = self.remove_waters ( meta["xyzpath_mr"] )
            meta["xyzpath"]    = self.remove_waters ( meta["xyzpath"]    )

            #  modify density

            if dm_mode in ["auto","never"]:
                #  first attempt: build without DM
                meta_mb1 = self.cbuccaneer ( dict(meta,labin_fc=None),
                                             nameout=prefix+"01-1.cbuccaneer" )

            if dm_mode in ["auto","always"]:
                #  second attempt: build after DM
                #  modify density; note that meta contains xyzpath_mr ("MR model")
                #  and xyzpath (fixed model) after previous iteration or if given
                #  on input, and xyzpath_ha (HA substructure) used on 1st
                #  iteration
                meta_dm  = self.parrot     ( meta,nameout=prefix+"01-2.parrot" )
                meta_mb2 = self.cbuccaneer ( dict(meta_dm,labin_fc=None),
                                             nameout=prefix+"01-2.cbuccaneer" )

                if dm_mode=="auto":
                    n1 = meta_mb1["cbuccaneer"]["n_res_built"]
                    n2 = meta_mb2["cbuccaneer"]["n_res_built"]
                    if n1>0 and n2>0:
                        meta_mb = self.choose_solution ( "M",
                                self.refmac(meta_mb1,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac"),
                                self.refmac(meta_mb2,ncycles=refcyc["inter"],nameout=prefix+"03-2.refmac")
                        )
                    elif n2>0:
                        self.workflow += "M"
                        meta_mb = self.refmac(meta_mb2,ncycles=refcyc["inter"],nameout=prefix+"03-2.refmac")
                    elif n1>0:
                        self.workflow += "-"
                        meta_mb = self.refmac(meta_mb1,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac")
                    else:
                        self.workflow += "*"
                        meta_mb = meta_mb1  # will break later
                else:
                    self.workflow += "M"
                    meta_mb = meta_mb2
            else:
                self.workflow += "-"
                meta_mb = meta_mb1

            if meta_mb["cbuccaneer"]["n_res_built"]<=0:
                break


            meta1 = self.refmac ( self.edstats(meta_mb,trim="all",
                                               nameout=prefix+"04.edstats",
                                               collectStats=False),
                                  ncycles=refcyc["inter"],nameout=prefix+"05.refmac" )
            #meta1["trim"] = meta1["edstats"]

            coot_script   = []
            coot_workflow = ["-","-","-"]
            if fill_mode in ["auto","always"]:
                coot_script.append ( "fill_partial_residues" )
                coot_workflow[0] = "E"
            if fit_mode in ["auto","always"]:
                coot_script.append ( "fit_protein" )
                coot_workflow[1] = "F"
            if rsr_mode in ["auto","always"]:
                coot_script.append ( "stepped_refine_protein" )
                coot_workflow[2] = "R"
            coot_ind = "".join(coot_workflow)

            if len(coot_script)>0:
                meta4 = self.refmac ( self.coot(meta1,coot_script,
                                                nameout=prefix+"06.coot" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"07.refmac" )
                if fill_mode=="auto" or fit_mode=="auto" or rsr_mode=="auto":
                    meta4 = self.choose_solution ( coot_ind,meta1,meta4 )
                else:
                    self.workflow += coot_ind
            else:
                self.workflow += coot_ind
                meta4 = meta1

            """
            if fill_mode in ["auto","always"]:
                meta2 = self.refmac ( self.coot(meta1,["fill_partial_residues"],
                                                nameout=prefix+"06.coot_fill" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"07.refmac" )
                if fill_mode=="auto":
                    meta2 = self.choose_solution ( "E",meta1,meta2 )
                else:
                    self.workflow += "E"
            else:
                self.workflow += "-"
                meta2 = meta1

            if fit_mode in ["auto","always"]:
                meta3 = self.refmac ( self.coot(meta2,["fit_protein"],
                                                nameout=prefix+"08.coot_fit" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"09.refmac" )
                if fit_mode=="auto":
                    meta3 = self.choose_solution ( "F",meta2,meta3 )
                else:
                    self.workflow += "F"
            else:
                self.workflow += "-"
                meta3 = meta2

            if rsr_mode in ["auto","always"]:
                meta4 = self.refmac ( self.coot(meta3,["stepped_refine_protein"],
                                                nameout=prefix+"10.coot_refine" ),
                                      ncycles=refcyc["inter"],nameout=prefix+"11.refmac" )
                if rsr_mode=="auto":
                    meta4 = self.choose_solution ( "R",meta3,meta4 )
                else:
                    self.workflow += "R"
            else:
                self.workflow += "-"
                meta4 = meta3
            """

            if trim_waters:
                if meta4["refmac"]["rfree"][1]<=float(self.input_data["trim_wat_rfree"]):
                    meta5 = self.choose_solution ( "W",meta4,
                                self.refmac (
                                    self.findwaters(meta4,
                                              nameout=prefix+"12.findwaters" ),
                                    ncycles=refcyc["inter"],nameout=prefix+"13.refmac" ) )
                else:
                    self.workflow += "-"
                    meta5 = meta4
            else:
                meta5 = meta4

            meta_rf = self.refmac  ( dict(self.input_data,xyzpath=meta5["xyzpath"],
                                          cbuccaneer=meta_mb["cbuccaneer"]),
                                     ncycles=refcyc["inter"],nameout=prefix+"14.refmac" )
            meta_ed = self.edstats ( meta_rf,nameout=prefix+"15.edstats",collectStats=True )

            #meta_rf["cbuccaneer"] = meta_mb["cbuccaneer"]
            meta_rf["edstats"] = meta_ed["edstats"]
            meta_rf["trim"]    = meta1  ["edstats"]
            self.stock_result  ( meta_rf   )
            self.printMetrics  ( i,meta_rf )
            self.rvapiDrawGraph()
            self.drawEDStats   ( meta_ed["edstats"]["reslist"],i+1 )

            if self.rvrow_results<=0:
                self.putMessage ( "&nbsp;" )
                self.rvrow_results = self.rvrow
                self.rvrow += 4

            self.rvapiMakeResultTable ( "res_rfree","Build with the lowest R<sub>free</sub>",
                                        self.output_name_rfree,self.best_rfree_build_no )
            self.rvapiMakeResultTable ( "res_edcc","&nbsp;<br>Build with the highest ED Correlation",
                                        self.output_name_edcc,self.best_edcc_build_no )
            self.rvapiMakeResultTable ( "res_nbuilt","&nbsp;<br>Build with the highest number of residues built",
                                        self.output_name_nbuilt,self.best_nbuilt_build_no )
            self.rvapiMakeResultTable ( "res_nfrag" ,"&nbsp;<br>Build with the least number of fragments",
                                        self.output_name_nfrag,self.best_nfrag_build_no )
            self.flush()

            last_best = max ( self.best_rfree_build_no,
                              max ( self.best_edcc_build_no,
                                    self.best_nbuilt_build_no ) )
            if len(self.build_meta)-last_best > noimprove_cycles:
                break;
            elif i<cycles_max-1:
                meta = self.refmac ( dict(self.input_data,xyzpath=meta_ed["xyzpath"]),
                                     ncycles=refcyc["final"],nameout=prefix+"16.refmac" )
                meta["xyzpath_mr"] = meta   ["xyzpath"]  #  for next buccaneer
                meta["xyzpath"]    = meta_rf["xyzpath"]  #  for next parrot
                #meta["labin_hl"]   = None  # enforce using PHIFOM at all iterations but 1st one

        self.printMetrics ( -2,None )

        return


    def run ( self ):

        self.log ([
            " ",
            " CCP4Build v." + self.appVersion,
            " ",
            " INPUT DATA:",
            "---------------------------------------------------------------------------"
        ])
        self.readInputData        ()
        self.readParrotOptions    ()
        self.readCBuccaneerOptions()
        self.readRefmacOptions    ()
        self.readFindWatersOptions()
        self.log ([
            " ",
            "---------------------------------------------------------------------------"
        ])

        #self.putMessage ( "<div style=\"font-size:85%;width:100%;text-align:right\">CCP4Build v." +\
        #                  self.appVersion + "</div>" );

        if self.input_data["mode"]=="MR":
            self.ccp4build_mr()
        else:
            self.ccp4build_ep()

        self.writeBestMetrics ( os.path.join (
                self.outputdir,self.input_data["nameout"] + "_metrics.json" ) )

        self.storeReportDocument()

        if os.path.isdir("coot-backup"):
            shutil.rmtree ( "coot-backup" )
        if os.path.isdir("coot-download"):
            shutil.rmtree ( "coot-download" )

        return


def run():
    ccp4build = Build()
    ccp4build.run()
    return


# ============================================================================

if __name__ == '__main__':
    run()
