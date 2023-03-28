##!/usr/bin/python

#
# ============================================================================
#
#    23.03.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Base class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2023
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
#  ///cycles                 3
#  resolution             1.0
#  ncs-mask-filter-radius 6.0



# import sys
import os
import shutil

import pyrvapi

import ccp4build_report


# ============================================================================

class Build(ccp4build_report.Report):

    # ------------------------------------------------------------------------

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

    ref_cycles = [
        { "initial":10, "inter":5,  "final":10 },
        { "initial":20, "inter":7,  "final":15 },
        { "initial":50, "inter":10, "final":20 },
    ]

    def warning_nocoot ( self ):
        self.putMessage (
            "<span style=\"font-size:85%;color:maroon;\"><b>WARNING: " +\
            "<i>Coot is not found, real space refinement and water " +\
            "modelling will not be used</i></b></span>"
        )
        return
    

    def put_webcoot_button ( self ):
        self.putWebCootButton ( self.workdir + "/current.pdb",
                                self.workdir + "/current.mtz",
                                self.workdir + "/legend.html",
                                self.report_page_id,self.rvrow+5,0 )
        return

    
    def ccp4build_mr ( self ):

        refcyc = self.ref_cycles[min(3,max(0,int(self.input_data["ref_level"])-1))]

        meta = self.input_data.copy()
        if not meta["xyzpath"]:
            meta["xyzpath"] = meta["xyzpath_mr"]

        if meta["mtzpath"]:
            shutil.copyfile ( meta["mtzpath"],self.current_mtz )
            self.put_webcoot_button()

        if meta["xyzpath"]:
            shutil.copyfile ( meta["xyzpath"],self.current_pdb )
            self.put_webcoot_button()
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

        self.putMessage ( "<h3>Performing build in Molecular Replacement Phases</h3>" +\
                          "<span style=\"font-size:85%;width:100%;text-align:right\">" +\
                          "<i>CCP4Build v."+self.appVersion+"</i></span>" )


        if not self.is_coot:
            self.warning_nocoot()

        self.printMetrics ( -1,None )
        self.prepareGraph()

        cycles_max = int(self.input_data["cycles_max"])
        cycles_min = int(self.input_data["cycles_min"])
        noimprove_cycles = int(self.input_data["noimprove_cycles"])

        dm_mode    = self.input_data["dm_mode"  ]
        fill_mode  = self.input_data["fill_mode"]
        fit_mode   = self.input_data["fit_mode" ]
        rsr_mode   = self.input_data["rsr_mode" ]

        model_waters = self.input_data["model_waters"] and \
            float(self.input_data["res_high"])<=float(self.input_data["trim_wat_resol"])

        meta["xyzpath_mr"] = self.remove_waters ( meta["xyzpath"] )  #  FIXED
        meta["labin_hl"]   = None  # enforce using PHIFOM for 1st iteration
        meta["labin_fc"]   = None  # not to be used by cbuccaneer at 1st iteration
        meta["xyzpath"]    = None  # start from nil model

        #dm_count = 0

        for i in range(cycles_max):

            meta["iteration"] = i

            self.workflow = ""  # will keep track of workflow for reporting
            prefix = str(i+1).zfill(2) + "_"

            #  remove waters from current model
            meta["xyzpath"] = self.remove_waters ( meta["xyzpath"] )

            #  modify density

            if dm_mode in ["auto","never"]:
                #  first attempt: build without DM
                meta_mb = self.cbuccaneer ( meta,(i<=0),nameout=prefix+"01-1.cbuccaneer" )
                if meta_mb["cbuccaneer"]["n_res_built"]>0:
                    meta_mb1 = self.refmac(meta_mb,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac")
                else:
                    meta_mb1 = meta_mb

            if dm_mode in ["auto","always"]:
                #  second attempt: build after DM
                meta_dm = self.parrot      ( meta,(i<=0),nameout=prefix+"01-2.parrot" )
                meta_mb = self.cbuccaneer  ( meta_dm,(i<=0),nameout=prefix+"01-2.cbuccaneer" )
                if meta_mb["cbuccaneer"]["n_res_built"]>0:
                    meta_mb2 = self.refmac(meta_mb,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac")
                else:
                    meta_mb2 = meta_mb

                if dm_mode=="auto":
                    n1 = meta_mb1["cbuccaneer"]["n_res_built"]
                    n2 = meta_mb2["cbuccaneer"]["n_res_built"]
                    if n1>0 and n2>0:
                        meta_mb = self.choose_solution ( "M",meta_mb1,meta_mb2 )
                    elif n2>0:
                        self.workflow += "M"
                        meta_mb = meta_mb2
                    elif n1>0:
                        self.workflow += "-"
                        meta_mb = meta_mb1
                    else:
                        self.workflow += "*"
                        meta_mb = meta_mb1  # will break later
                else:
                    self.workflow += "M"
                    meta_mb = meta_mb2

                #if meta_mb["xyzpath"]==meta_mb2["xyzpath"]:
                #    dm_count += 1
                #    meta_mb["mode"] = "EP"
                #else:
                #    dm_count = 0
                #    meta_mb["mode"] = "MR"

            else:
                self.workflow += "-"
                meta_mb = meta_mb1

            if meta_mb["cbuccaneer"]["n_res_built"]<=0:
                break

            self.put_webcoot_button()

            if self.input_data["trim_mode"]!="never":
                meta1 = self.refmac ( self.edstats(meta_mb,trim="all",
                                                   nameout=prefix+"04.edstats",
                                                   collectStats=False),
                                      ncycles=refcyc["inter"],nameout=prefix+"05.refmac" )
                meta1["trim"] = meta1["edstats"]
            else:
                meta1 = meta_mb
                meta1["trim"] = { "nmodified" : 0 }

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

            if (len(coot_script)>0) and self.is_coot:
                meta2 = self.coot ( meta1,coot_script,nameout=prefix+"06.coot" )
                if self.is_coot:  # self.is_coot may turn False in the above call
                    meta4 = self.refmac ( meta2,ncycles=refcyc["inter"],
                                                nameout=prefix+"07.refmac" )
                    if fill_mode=="auto" or fit_mode=="auto" or rsr_mode=="auto":
                        meta4 = self.choose_solution ( coot_ind,meta1,meta4 )
                    else:
                        self.workflow += coot_ind
                else:
                    self.workflow += coot_ind
                    meta4 = meta1
                    self.warning_nocoot()
            else:
                self.workflow += coot_ind
                meta4 = meta1

            if model_waters and self.is_coot:
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
                self.log (["\n *** stoppping because of no improvement ...\n"])
                break
            if self.input_data["stop_file"] and os.path.isfile(self.input_data["stop_file"]):
                self.log (["\n *** stoppping gracefully ...\n"])
                break
            if i<cycles_max-1:
                meta = self.refmac ( dict(meta_ed,labin_hl=None),ncycles=refcyc["final"],
                                     nameout=prefix+"15.refmac" )
                meta["xyzpath"] = meta_rf["xyzpath"]  #  for next parrot

            self.flush()

        self.printMetrics ( -2,None )

        return


    def ccp4build_ep ( self ):

        refcyc = self.ref_cycles[min(3,max(0,int(self.input_data["ref_level"])-1))]

        self.putMessage ( "<h3>Performing build in Experimental Phases</h3>" +\
                          "<span style=\"font-size:85%;width:100%;text-align:right\">" +\
                          "<i>CCP4Build v."+self.appVersion+"</i></span>" )

        if not self.is_coot:
            self.warning_nocoot()

        meta = self.input_data.copy()
        meta["labin_fc"] = None

        self.printMetrics ( -1,None )
        self.prepareGraph()

        cycles_max = int(self.input_data["cycles_max"])
        cycles_min = int(self.input_data["cycles_min"])
        noimprove_cycles = int(self.input_data["noimprove_cycles"])

        dm_mode     = self.input_data["dm_mode"  ]
        fill_mode   = self.input_data["fill_mode"]
        fit_mode    = self.input_data["fit_mode" ]
        rsr_mode    = self.input_data["rsr_mode" ]

        model_waters = self.input_data["model_waters"] and float(self.input_data["res_high"])<=float(self.input_data["trim_wat_resol"])

        for i in range(cycles_max):

            meta["iteration"] = i

            self.workflow = ""  # will keep track of workflow for reporting
            prefix = str(i+1).zfill(2) + "_"

            #  remove waters from current model
            meta["xyzpath_mr"] = None
            meta["xyzpath"]    = self.remove_waters ( meta["xyzpath"] )

            #  modify density

            if dm_mode in ["auto","never"]:
                #  first attempt: build without DM
                meta_mb = self.cbuccaneer ( meta,(i<=0),nameout=prefix+"01-1.cbuccaneer" )
                if meta_mb["cbuccaneer"]["n_res_built"]>0:
                    meta_mb1 = self.refmac(meta_mb,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac")
                else:
                    meta_mb1 = meta_mb

            if dm_mode in ["auto","always"]:
                #  second attempt: build after DM
                #  modify density; note that meta contains xyzpath_mr ("MR model")
                #  and xyzpath (fixed model) after previous iteration or if given
                #  on input, and xyzpath_ha (HA substructure) used on 1st
                #  iteration
                meta_dm = self.parrot     ( meta,(i<=0),nameout=prefix+"01-2.parrot" )
                meta_mb = self.cbuccaneer ( meta_dm,True,nameout=prefix+"01-2.cbuccaneer" )
                if meta_mb["cbuccaneer"]["n_res_built"]>0:
                    meta_mb2 = self.refmac(meta_mb,ncycles=refcyc["inter"],nameout=prefix+"03-1.refmac")
                else:
                    meta_mb2 = meta_mb

                if dm_mode=="auto":
                    n1 = meta_mb1["cbuccaneer"]["n_res_built"]
                    n2 = meta_mb2["cbuccaneer"]["n_res_built"]
                    if n1>0 and n2>0:
                        meta_mb = self.choose_solution ( "M",meta_mb1,meta_mb2 )
                    elif n2>0:
                        self.workflow += "M"
                        meta_mb = meta_mb2
                    elif n1>0:
                        self.workflow += "-"
                        meta_mb = meta_mb1
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

            self.put_webcoot_button()

            if self.input_data["trim_mode"]!="never":
                meta1 = self.refmac ( self.edstats(meta_mb,trim="all",
                                                   nameout=prefix+"04.edstats",
                                                   collectStats=False),
                                      ncycles=refcyc["inter"],nameout=prefix+"05.refmac" )
            else:
                meta1 = meta_mb
                meta1["edstats"] = { "nmodified" : 0 }
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

            if (len(coot_script)>0) and self.is_coot:
                meta2 = self.coot ( meta1,coot_script,nameout=prefix+"06.coot" )
                if self.is_coot:
                    meta4 = self.refmac ( meta2,ncycles=refcyc["inter"],
                                                nameout=prefix+"07.refmac" )
                    if fill_mode=="auto" or fit_mode=="auto" or rsr_mode=="auto":
                        meta4 = self.choose_solution ( coot_ind,meta1,meta4 )
                    else:
                        self.workflow += coot_ind
                else:
                    self.workflow += coot_ind
                    meta4 = meta1
                    self.warning_nocoot()
            else:
                self.workflow += coot_ind
                meta4 = meta1

            if model_waters and self.is_coot:
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
                self.log (["\n *** stopping because of no improvement ...\n"])
                break
            if self.input_data["stop_file"] and os.path.isfile(self.input_data["stop_file"]):
                self.log (["\n *** stopping gracefully ...\n"])
                break
            if i<cycles_max-1:
                meta = self.refmac ( dict(self.input_data,xyzpath=meta_ed["xyzpath"]),
                                     ncycles=refcyc["final"],nameout=prefix+"16.refmac" )
                #meta["xyzpath_mr"] = meta   ["xyzpath"]  #  for next buccaneer
                meta["xyzpath"]    = meta_rf["xyzpath"]  #  for next parrot
                #meta["labin_hl"]   = None  # enforce using PHIFOM at all iterations but 1st one

        self.printMetrics ( -2,None )

        return


    def run ( self ):

        self.checkCoot()

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

        self.removeWebCootButton()

        self.writeBestMetrics ( os.path.join (
                self.outputdir,self.input_data["nameout"] + "_metrics.json" ) )

        self.storeReportDocument()

        if os.path.isdir("coot-backup"):
            shutil.rmtree ( "coot-backup" )
        if os.path.isdir("coot-download"):
            shutil.rmtree ( "coot-download" )

        if os.path.isdir(self.workdir):
            shutil.rmtree ( self.workdir )

        return


def run():
    ccp4build = Build()
    ccp4build.run()
    return


# ============================================================================

if __name__ == '__main__':
    run()
