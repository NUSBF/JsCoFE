##!/usr/bin/python

#
# ============================================================================
#
#    19.05.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Report class
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


import os
import sys
import shutil
import json

import pyrvapi

import ccp4build_edstats
import edmap


# ============================================================================

class Report(ccp4build_edstats.EDStats):

    # ------------------------------------------------------------------------

    graphId = None
    tableId = None

    graph_min_cycles = 0
    graph_min_values = {}
    graph_max_values = {}

    # ------------------------------------------------------------------------

    def preparePlot ( self,plotId,plotName,intX,intY,ymin0,ymax0,lines ):

        pyrvapi.rvapi_add_graph_plot ( plotId,self.graphId,plotName,
                                       "Cycle No.",plotName )
        pyrvapi.rvapi_set_plot_int   ( plotId,self.graphId,intX,intY )

        for line in lines:
            pyrvapi.rvapi_add_graph_dataset ( line[0],"data_id",self.graphId,
                                              line[1],line[1] )
            pyrvapi.rvapi_add_plot_line ( plotId,"data_id",self.graphId,
                                            "ncycles_id",line[0] )

        self.graph_min_cycles = int(self.input_data["cycles_min"]) + 0.5
        pyrvapi.rvapi_set_plot_xrange ( plotId,self.graphId,0.5,
                                        self.graph_min_cycles )
        pyrvapi.rvapi_set_plot_yrange ( plotId,self.graphId,ymin0,ymax0 )

        self.graph_min_values[plotId] = ymin0
        self.graph_max_values[plotId] = ymax0

        return


    def prepareGraph ( self ):

        if not self.graphId:
            self.graphId = self.getWidgetId ( "graph" )

        pyrvapi.rvapi_add_loggraph   ( self.graphId,self.report_page_id,self.rvrow,0,1,1 )

        self.rvrow += 1

        pyrvapi.rvapi_add_graph_data ( "data_id"   ,self.graphId,"Build statistics" );
        pyrvapi.rvapi_add_graph_data ( "edstats_id",self.graphId,"EDStats" );

        pyrvapi.rvapi_add_graph_dataset ( "ncycles_id","data_id",self.graphId,
                                          "Ncycles","N of cycles" )

        self.preparePlot (
            "rfactors_plot_id","R-factors",True,False,0.25,0.30,[
                ["rfactor_id","R-factor"],
                ["rfree_id"  ,"R-free"  ]
            ]
        )

        self.preparePlot (
            "edcc_plot_id","ED Correlation",True,False,0.85,0.9,[
                ["edcc_id","ED Correlation"],
                ["zd_id","ZD/10"]
            ]
        )

        self.preparePlot (
            "residues_plot_id","Residues built",True,True,0,10,[
                ["resbuilt_id","Residues built"    ],
                ["resseq_id"  ,"Residues sequenced"],
                ["resalloc_id","Residues allocated"],
                ["maxfragm_id","Longest fragment"  ]
            ]
        )

        self.preparePlot (
            "fragments_plot_id","Fragments and chains",True,True,0,5,[
                ["nfragments_id","N of fragments" ],
                ["nchains_id"   ,"N of chains"    ]
            ]
        )

        self.preparePlot (
            "completeness_plot_id","Completeness %%",True,False,90.0,100.0,[
                ["rescompl_id","Residue completeness" ],
                ["chncompl_id","Chain completeness"   ]
            ]
        )

        pyrvapi.rvapi_flush()

        return


    def drawPlot ( self,plotId,nx,pdata ):

        minVal = 10000.0
        maxVal = 0.0
        for d in pdata:
            pyrvapi.rvapi_add_graph_real ( d[0],"data_id",self.graphId,
                                           d[1],"%g" )
            minVal = min ( minVal,d[1] )
            maxVal = max ( maxVal,d[1] )

        pyrvapi.rvapi_set_plot_xrange ( plotId,self.graphId,0.5,nx )

        if minVal<self.graph_min_values[plotId] or maxVal>self.graph_max_values[plotId]:
            if minVal<self.graph_min_values[plotId]:
                self.graph_min_values[plotId] = minVal
            if maxVal>self.graph_max_values[plotId]:
                self.graph_max_values[plotId] = maxVal
            pyrvapi.rvapi_set_plot_yrange ( plotId,self.graphId,
                                            self.graph_min_values[plotId],
                                            self.graph_max_values[plotId] )

        return


    def drawEDStats ( self,reslist,iter_no ):

        mclist   = reslist["mainchain"]
        sclist   = reslist["sidechain"]
        wclist   = reslist["solvent"  ]
        zedcc0_m = reslist["zd_cutoff_m"][2]
        zedcc0_s = reslist["zd_cutoff_s"][2]
        zedcc0_w = reslist["zd_cutoff_w"][2]

        plot_id   = "edstats_" + str(iter_no)
        plot_name = "ZEDCC profiles iter=" + str(iter_no)

        pyrvapi.rvapi_add_graph_plot ( plot_id,self.graphId,plot_name,
                                       "Residue No.",plot_name )
        pyrvapi.rvapi_set_plot_int   ( plot_id,self.graphId,True,False )

        nres_id  = "nres_id_" + str(iter_no)
        pyrvapi.rvapi_add_graph_dataset ( nres_id,"edstats_id",self.graphId,
                                          "Residue No.","Residue No." )
        ninfl_id = "ninfl_id_" + str(iter_no)
        pyrvapi.rvapi_add_graph_dataset ( ninfl_id,"edstats_id",self.graphId,
                                          "Residue No.","Residue No." )

        zedccm_id = "zedccm_id_" + str(iter_no)
        pyrvapi.rvapi_add_graph_dataset ( zedccm_id,"edstats_id",self.graphId,
                                              "ZEDCC mainchain","ZEDCC mainchain" )
        zedccs_id = "zedccs_id_" + str(iter_no)
        pyrvapi.rvapi_add_graph_dataset ( zedccs_id,"edstats_id",self.graphId,
                                              "ZEDCC sidechain","ZEDCC sidechain" )

        zedccm0_id = "zedccm0_id_" + str(iter_no)
        pyrvapi.rvapi_add_graph_dataset ( zedccm0_id,"edstats_id",self.graphId,
                                              "ZEDCC mainchain cut-off",
                                              "ZEDCC mainchain cut-off" )
        zedccs0_id = "zedccs0_id_" + str(iter_no)
        pyrvapi.rvapi_add_graph_dataset ( zedccs0_id,"edstats_id",self.graphId,
                                              "ZEDCC sidechain cut-off",
                                              "ZEDCC sidechain cut-off" )

        pyrvapi.rvapi_add_plot_line ( plot_id,"edstats_id",self.graphId,
                                             nres_id,zedccm_id )
        pyrvapi.rvapi_add_plot_line ( plot_id,"edstats_id",self.graphId,
                                             nres_id,zedccs_id )
        pyrvapi.rvapi_add_plot_line ( plot_id,"edstats_id",self.graphId,
                                             ninfl_id,zedccm0_id )
        pyrvapi.rvapi_add_plot_line ( plot_id,"edstats_id",self.graphId,
                                             ninfl_id,zedccs0_id )


        pyrvapi.rvapi_set_line_options ( zedccm_id,plot_id,"edstats_id",
                                         self.graphId,"darkcyan","solid","filledCircle",
                                         1.5,True )
        pyrvapi.rvapi_set_line_options ( zedccm0_id,plot_id,"edstats_id",
                                         self.graphId,"darkcyan","solid","off",
                                         0.75,True )

        pyrvapi.rvapi_set_line_options ( zedccs_id,plot_id,"edstats_id",
                                         self.graphId,"salmon","solid","filledCircle",
                                         1.5,True )

        pyrvapi.rvapi_set_line_options ( zedccs0_id,plot_id,"edstats_id",
                                         self.graphId,"salmon","solid","off",
                                         0.75,True )

        ninfl = [1,2]
        if len(mclist)>2:
            ninfl.append(len(mclist))
        if len(sclist)>0 and len(sclist) not in ninfl:
            ninfl.append(len(sclist))
        if len(wclist)>0:
            if len(wclist) not in ninfl:
                ninfl.append ( len(wclist) )
            zedccw_id  = "zedccw_id_"  + str(iter_no)
            zedccw0_id = "zedccw0_id_" + str(iter_no)
            pyrvapi.rvapi_add_graph_dataset ( zedccw_id,"edstats_id",self.graphId,
                                              "ZEDCC solvent","ZEDCC solvent" )
            pyrvapi.rvapi_add_graph_dataset ( zedccw0_id,"edstats_id",self.graphId,
                                              "ZEDCC solvent cut-off",
                                              "ZEDCC solvent cut-off" )
            pyrvapi.rvapi_add_plot_line     ( plot_id,"edstats_id",self.graphId,
                                              nres_id,zedccw_id )
            pyrvapi.rvapi_add_plot_line     ( plot_id,"edstats_id",self.graphId,
                                              ninfl_id,zedccw0_id )
            pyrvapi.rvapi_set_line_options  ( zedccw_id,plot_id,"edstats_id",
                                              self.graphId,"blue","solid","filledCircle",
                                              1.5,True )
            pyrvapi.rvapi_set_line_options  ( zedccw0_id,plot_id,"edstats_id",
                                              self.graphId,"blue","solid","off",
                                              0.75,True )

        for i in range(len(ninfl)):
            for j in range(i+1,len(ninfl)):
                if ninfl[j]<ninfl[i]:
                    k = ninfl[i]
                    ninfl[i] = ninfl[j]
                    ninfl[j] = k

        for i in range(ninfl[-1]):
            pyrvapi.rvapi_add_graph_int  ( nres_id,"edstats_id",self.graphId,i+1 )
            if i<len(mclist):
                pyrvapi.rvapi_add_graph_real ( zedccm_id,"edstats_id",self.graphId,
                                               mclist[i][0],"%g" )
            if i<len(sclist):
                pyrvapi.rvapi_add_graph_real ( zedccs_id,"edstats_id",self.graphId,
                                               sclist[i][0],"%g" )
            if i<len(wclist):
                pyrvapi.rvapi_add_graph_real ( zedccw_id,"edstats_id",self.graphId,
                                               wclist[i][0],"%g" )

        for i in range(len(ninfl)):
            pyrvapi.rvapi_add_graph_int  ( ninfl_id,"edstats_id",self.graphId,ninfl[i] )
            if ninfl[i]<=len(mclist):
                pyrvapi.rvapi_add_graph_real ( zedccm0_id,"edstats_id",self.graphId,zedcc0_m,"%g" )
            if ninfl[i]<=len(sclist):
                pyrvapi.rvapi_add_graph_real ( zedccs0_id,"edstats_id",self.graphId,zedcc0_s,"%g" )
            if ninfl[i]<=len(wclist):
                pyrvapi.rvapi_add_graph_real ( zedccw0_id,"edstats_id",self.graphId,zedcc0_w,"%g" )

        return


    def rvapiDrawGraph ( self ):

        n = len(self.build_meta) - 1
        pyrvapi.rvapi_add_graph_int  ( "ncycles_id","data_id",self.graphId,n+1 )

        nx    = max(self.graph_min_cycles,n+1.5)
        rmeta = self.build_meta[n]["refmac"]
        bmeta = self.build_meta[n]["cbuccaneer"]
        emeta = self.build_meta[n]["edstats"]

        self.drawPlot ( "rfactors_plot_id",nx,[
            [ "rfactor_id",rmeta["rfactor"][1] ],
            [ "rfree_id"  ,rmeta["rfree"  ][1] ]
        ])

        self.drawPlot ( "edcc_plot_id",nx,[
            [ "edcc_id",emeta["EDCC"] ],
            [ "zd_id",emeta["ZEDCC"]/10.0 ]
        ])

        self.drawPlot ( "residues_plot_id",nx,[
            [ "resbuilt_id",bmeta["n_res_built"     ] ],
            [ "resseq_id"  ,bmeta["n_res_sequenced" ] ],
            [ "resalloc_id",bmeta["n_res_alloc"     ] ],
            [ "maxfragm_id",bmeta["longest_fragment"] ]
        ])

        self.drawPlot ( "fragments_plot_id",nx,[
            [ "nfragments_id",bmeta["n_fragments"   ] ],
            [ "nchains_id"   ,bmeta["n_chains_alloc"] ]
        ])

        self.drawPlot ( "completeness_plot_id",nx,[
            [ "rescompl_id",bmeta["res_complete"  ] ],
            [ "chncompl_id",bmeta["chain_complete"] ]
        ])

        #pyrvapi.rvapi_flush()

        return


    # ----------------------------------------------------------------------

    def putHorzHeaders ( self,tableId,header_list ):
        for i in range(len(header_list)):
            pyrvapi.rvapi_put_horz_theader ( tableId,header_list[i][0],header_list[i][1],i )
        return

    def putTableValues ( self,tableId,value_list ):
        for i in range(len(value_list)):
            pyrvapi.rvapi_put_table_string ( tableId,value_list[i],0,i )
        return


    def rvapiMakeResultTable ( self,tableId,title,output_name,build_no ):

        if output_name not in self.resTableId:

            if    "rfree" in tableId :  self.rvrow_rfree  = self.rvrow
            elif   "edcc" in tableId :  self.rvrow_edcc   = self.rvrow
            elif "nbuilt" in tableId :  self.rvrow_nbuilt = self.rvrow
            elif  "nfrag" in tableId :  self.rvrow_nfrag  = self.rvrow

            #self.putMessage ( "&nbsp;" )
            self.putMessage ( "<h3>" + title + "</h3>" )
            self.resTableId[output_name] = self.getWidgetId ( tableId )
            pyrvapi.rvapi_add_table ( self.resTableId[output_name],"",
                                      self.report_page_id,
                                      self.rvrow,0,1,1, 0 )
            self.putHorzHeaders ( self.resTableId[output_name],[
                [ "##"                ,"Solution No."               ],
                [ "N<sub>built</sub>" ,"Residues built"             ],
                [ "N<sub>seq</sub>"   ,"Residues sequenced"         ],
                [ "N<sub>alloc</sub>" ,"Residues allocated"         ],
                [ "N<sub>frag</sub>"  ,"Number of fragments"        ],
                [ "N<sub>chains</sub>","Number of chains"           ],
                [ "C<sub>res</sub>"   ,"Completeness by residues"   ],
                [ "C<sub>chain</sub>" ,"Completeness by chains"     ],
                [ "R<sub>factor</sub>","R-factor"                   ],
                [ "R<sub>free</sub>"  ,"R-free"                     ],
                [ "EDCC"              ,"ED Correlation Coefficient" ]
            ])
            self.rvrow += 5

            #self.putMessage ( "&nbsp;" )

            map_path = os.path.join ( os.path.relpath(self.outputdir,self.reportdir),
                                      output_name ).replace("\\","/")
            self.putStructureWidget ( "Built model and density map",[
                                        map_path + ".pdb",
                                        map_path + ".mtz",
                                        None,None
                                        #map_path + edmap.file_map(),
                                        #map_path + edmap.file_dmap()
                                      ],-1 )

        bmeta = self.build_meta[build_no]["cbuccaneer"]
        rmeta = self.build_meta[build_no]["refmac"]
        emeta = self.build_meta[build_no]["edstats"]

        self.putTableValues ( self.resTableId[output_name],[
            str(build_no+1),
            str(bmeta["n_res_built"]),
            str(bmeta["n_res_sequenced"]),
            str(bmeta["n_res_alloc"]),
            str(bmeta["n_fragments"]),
            str(bmeta["n_chains_alloc"]),
            "{0:5.1f}%".format(bmeta["res_complete"]),
            "{0:5.1f}%".format(bmeta["chain_complete"]),
            "{0:7.3f}" .format(rmeta["rfactor"][1]),
            "{0:7.3f}" .format(rmeta["rfree"][1]),
            "{0:7.3f}" .format(emeta["EDCC"])
        ])

        #pyrvapi.rvapi_flush()

        return


    # ----------------------------------------------------------------------

    def get_rfree ( self,result_no ):
        if result_no>=0 and result_no<len(self.build_meta):
            return float ( "{0:7.3f}".format(self.build_meta[result_no]["refmac"]["rfree"][1]) )
        else:
            return 10.0

    def get_edcc ( self,result_no ):
        if result_no>=0 and result_no<len(self.build_meta):
            return self.build_meta[result_no]["edstats"]["EDCC"]
        else:
            return -10.0

    def get_nbuilt ( self,result_no ):
        if result_no>=0 and result_no<len(self.build_meta):
            return self.build_meta[result_no]["cbuccaneer"]["n_res_built"]
        else:
            return -1

    def get_nfrag ( self,result_no ):
        if result_no>=0 and result_no<len(self.build_meta):
            return abs ( self.build_meta[result_no]["cbuccaneer"]["n_fragments"] -\
                         self.build_meta[result_no]["cbuccaneer"]["n_chains_alloc"] )
        else:
            return 1000000

    def stock_result ( self,meta ):

        self.build_meta.append ( meta )

        rfree_no  = self.best_rfree_build_no
        edcc_no   = self.best_edcc_build_no
        nbuilt_no = self.best_nbuilt_build_no
        nfrag_no  = self.best_nfrag_build_no

        rfree0    = self.get_rfree  ( rfree_no  )
        edcc0     = self.get_edcc   ( edcc_no   )
        nbuilt0   = self.get_nbuilt ( nbuilt_no )
        nfrag0    = self.get_nfrag  ( nfrag_no  )

        for i in range(len(self.build_meta)):

            rfree  = self.get_rfree  ( i )
            edcc   = self.get_edcc   ( i )
            nbuilt = self.get_nbuilt ( i )
            nfrag  = self.get_nfrag  ( i )

            edcc1   = self.get_edcc   ( rfree_no )
            nbuilt1 = self.get_nbuilt ( rfree_no )
            nfrag1  = self.get_nfrag  ( rfree_no )
            if rfree<rfree0 or (rfree==rfree0 and (edcc>edcc1 or (edcc==edcc1 and (nbuilt>nbuilt1 or nfrag<nfrag1)))):
                rfree_no = i
                rfree0   = rfree

            rfree1  = self.get_rfree  ( edcc_no )
            nbuilt1 = self.get_nbuilt ( edcc_no )
            nfrag1  = self.get_nfrag  ( edcc_no )
            if edcc>edcc0 or (edcc==edcc0 and (rfree<rfree1 or (rfree==rfree1 and (nbuilt>nbuilt1 or (nbuilt==nbuilt1 and nfrag<nfrag1))))):
                edcc_no = i
                edcc0   = edcc

            rfree1 = self.get_rfree  ( nbuilt_no )
            edcc1  = self.get_edcc   ( nbuilt_no )
            nfrag1  = self.get_nfrag ( nbuilt_no )
            if nbuilt>nbuilt0 or (nbuilt==nbuilt0 and (rfree<rfree1 or (rfree==rfree1 and (edcc>edcc1 or (edcc==edcc1 and nfrag<nfrag1))))):
                nbuilt_no = i
                nbuilt0   = nbuilt

            rfree1  = self.get_rfree  ( nfrag_no )
            edcc1   = self.get_edcc   ( nfrag_no )
            nbuilt1 = self.get_nbuilt ( nfrag_no )
            if nfrag<nfrag0 or (nfrag==nfrag0 and (rfree<rfree1 or (rfree==rfree1 and (edcc>edcc1 or (edcc==edcc1 and nbuilt>nbuilt1))))):
                nfrag_no = i
                nfrag0   = nfrag


        fstdout = open ( os.path.join(self.workdir,"stdout_map.log"),'a' )
        fstderr = open ( os.path.join(self.workdir,"stderr_map.log"),'a' )

        if self.best_rfree_build_no!=rfree_no:
            #  copy best results
            self.best_rfree_build_no = rfree_no
            meta0 = self.build_meta[rfree_no]
            output_path = os.path.join ( self.outputdir,self.output_name_rfree )
            shutil.copy2 ( meta0["xyzpath"],output_path + ".pdb" )
            shutil.copy2 ( meta0["mtzpath"],output_path + ".mtz" )
            #  calculate maps for viewer
            #edmap.calcCCP4Maps ( output_path + ".mtz",output_path,
            #                     #os.path.join(self.outputdir,self.input_data["nameout"]+"_rfree"),
            #                     self.workdir,fstdout,fstderr,"refmac",None )

        if self.best_edcc_build_no!=edcc_no:
            #  copy best results
            self.best_edcc_build_no = edcc_no
            meta0 = self.build_meta[edcc_no]
            output_path = os.path.join ( self.outputdir,self.output_name_edcc )
            shutil.copy2 ( meta0["xyzpath"],output_path + ".pdb" )
            shutil.copy2 ( meta0["mtzpath"],output_path + ".mtz" )
            #  calculate maps for viewer
            #edmap.calcCCP4Maps ( output_path + ".mtz",output_path,
            #                     #os.path.join(self.outputdir,self.input_data["nameout"]+"_edcc"),
            #                     self.workdir,fstdout,fstderr,"refmac",None )

        if self.best_nbuilt_build_no!=nbuilt_no:
            #  copy best results
            self.best_nbuilt_build_no = nbuilt_no
            meta0 = self.build_meta[nbuilt_no]
            output_path = os.path.join ( self.outputdir,self.output_name_nbuilt )
            shutil.copy2 ( meta0["xyzpath"],output_path + ".pdb" )
            shutil.copy2 ( meta0["mtzpath"],output_path + ".mtz" )
            #  calculate maps for viewer
            #edmap.calcCCP4Maps ( output_path + ".mtz",output_path,
            #                     #os.path.join(self.outputdir,self.input_data["nameout"]+"_nbuilt"),
            #                     self.workdir,fstdout,fstderr,"refmac",None )

        if self.best_nfrag_build_no!=nfrag_no:
            #  copy best results
            self.best_nfrag_build_no = nfrag_no
            meta0 = self.build_meta[nfrag_no]
            output_path = os.path.join ( self.outputdir,self.output_name_nfrag )
            shutil.copy2 ( meta0["xyzpath"],output_path + ".pdb" )
            shutil.copy2 ( meta0["mtzpath"],output_path + ".mtz" )
            #  calculate maps for viewer
            #edmap.calcCCP4Maps ( output_path + ".mtz",output_path,
            #                     #os.path.join(self.outputdir,self.input_data["nameout"]+"_nfrag"),
            #                     self.workdir,fstdout,fstderr,"refmac",None )

        fstdout.close()
        fstderr.close()

        return


    def printMetrics ( self,i,meta ):

        if i==-1:
            self.log ([
                " ",
                "--------------------------------------------------------------------------------------------------------",
                "  I   WKF  Nblt  Nseq  Nalloc Nfragm Nchains  CRes  CChain   Rfactor  Rfree   EDCC  ZEDCC  Ncorr  Ntrim",
                "--------------------------------------------------------------------------------------------------------"
            ])
            return


        if i==-2:
            self.log ([
                "--------------------------------------------------------------------------------------------------------"
            ])
            return

        bmeta = meta["cbuccaneer"]
        tmeta = meta["trim"]
        rmeta = meta["refmac"]
        emeta = meta["edstats"]

        self.log ( "{0:3d}  {1} {2:5d} {3:5d}  {4:5d} {5:5d}  {6:5d}    {7:5.1f}% {8:5.1f}%  {9:7.3f} {10:7.3f} {11:7.3f} {12:5.1f} {13:5d} {14:5d}\n".format(
            i+1,self.workflow,
            bmeta["n_res_built" ], bmeta["n_res_sequenced"], bmeta["n_res_alloc"],
            bmeta["n_fragments" ], bmeta["n_chains_alloc"] ,
            bmeta["res_complete"], bmeta["chain_complete"] ,
            rmeta["rfactor"][1]  , rmeta["rfree"][1]       ,
            emeta["EDCC"]        , emeta["ZEDCC"]          ,
            tmeta["nmodified"]   , emeta["nmodified"]
        ))

        return


    def writeBestMetrics ( self,filePath ):
        with open(filePath,"w") as file:
            if len(self.build_meta)>0:
                d = { "rfree" :  { "serNo" : self.best_rfree_build_no,
                                   "meta"  : self.build_meta[self.best_rfree_build_no]
                                 },
                      "edcc" :   { "serNo" : self.best_edcc_build_no,
                                   "meta"  : self.build_meta[self.best_edcc_build_no]
                                 },
                      "nbuilt" : { "serNo" : self.best_nbuilt_build_no,
                                   "meta"  : self.build_meta[self.best_nbuilt_build_no]
                                 },
                      "nfrag" :  { "serNo" : self.best_nfrag_build_no,
                                   "meta"  : self.build_meta[self.best_nfrag_build_no]
                                 }
                    }
            else:
                d = { "rfree" :  { "serNo" : -1,
                                   "meta"  : None
                                 },
                      "edcc" :   { "serNo" : -1,
                                   "meta"  : None
                                 },
                      "nbuilt" : { "serNo" : -1,
                                   "meta"  : None
                                 },
                      "nfrag" :  { "serNo" : -1,
                                   "meta"  : None
                                 }
                    }
            file.write ( json.dumps(d,indent=4,sort_keys=True) )
        return
