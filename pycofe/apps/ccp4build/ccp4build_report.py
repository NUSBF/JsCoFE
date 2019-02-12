##!/usr/bin/python

#
# ============================================================================
#
#    05.02.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4build Report class
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


import os
import sys
import shutil

import pyrvapi

import ccp4build_edstats
import edmap


# ============================================================================

class Report(ccp4build_edstats.EDStats):

    # ------------------------------------------------------------------------

    graphId = None
    tableId = None

    graph_min_cycles = 0
    graph_max_values = {}

    # ------------------------------------------------------------------------

    def preparePlot ( self,plotId,plotName,intX,intY,ymax0,lines ):

        pyrvapi.rvapi_add_graph_plot ( plotId,self.graphId,plotName,
                                       "Cycle No.",plotName )
        pyrvapi.rvapi_set_plot_int   ( plotId,self.graphId,intX,intY )

        for line in lines:
            pyrvapi.rvapi_add_graph_dataset ( line[0],"data_id",self.graphId,
                                              line[1],line[1] )
            pyrvapi.rvapi_add_plot_line ( plotId,"data_id",self.graphId,
                                            "ncycles_id",line[0] )

        self.graph_min_cycles = self.input_data["outer_cycles_min"] + 0.5
        pyrvapi.rvapi_set_plot_xrange ( plotId,self.graphId,0.5,
                                        self.graph_min_cycles )
        pyrvapi.rvapi_set_plot_yrange ( plotId,self.graphId,0.0,ymax0 )

        self.graph_max_values[plotId] = ymax0

        return


    def prepareGraph ( self ):

        if not self.graphId:
            self.graphId = self.getWidgetId ( "graph" )

        pyrvapi.rvapi_add_loggraph  ( self.graphId,self.report_page_id,self.rvrow,0,1,1 )
        self.rvrow += 1

        pyrvapi.rvapi_add_graph_data ( "data_id",self.graphId,"Build statistics" );

        pyrvapi.rvapi_add_graph_dataset ( "ncycles_id","data_id",self.graphId,
                                          "Ncycles","N of cycles" )

        self.preparePlot (
            "rfactors_plot_id","R-factors",True,False,0.25,[
                ["rfactor_id","R-factor"],
                ["rfree_id"  ,"R-free"  ]
            ]
        )

        self.preparePlot (
            "residues_plot_id","Residues built",True,True,10,[
                ["resbuilt_id","Residues built"    ],
                ["resseq_id"  ,"Residues sequenced"],
                ["resalloc_id","Residues allocated"],
                ["maxfragm_id","Longest fragment"  ]
            ]
        )

        self.preparePlot (
            "fragments_plot_id","Fragments and chains",True,True,5,[
                ["nfragments_id","N of fragments" ],
                ["nchains_id"   ,"N of chains"    ]
            ]
        )

        self.preparePlot (
            "completeness_plot_id","Completeness %%",True,False,100.0,[
                ["rescompl_id","Residue completeness" ],
                ["chncompl_id","Chain completeness"   ]
            ]
        )

        pyrvapi.rvapi_flush()

        return


    def drawPlot ( self,plotId,nx,pdata ):

        maxVal = 0.0
        for d in pdata:
            pyrvapi.rvapi_add_graph_real ( d[0],"data_id",self.graphId,
                                           d[1],"%g" )
            maxVal = max ( maxVal,d[1] )

        pyrvapi.rvapi_set_plot_xrange ( plotId,self.graphId,0.5,nx )

        if maxVal>self.graph_max_values[plotId]:
            self.graph_max_values[plotId] = maxVal
            pyrvapi.rvapi_set_plot_yrange ( plotId,self.graphId,0.0,maxVal )

        return


    def drawGraph ( self ):

        n = len(self.build_meta) - 1
        pyrvapi.rvapi_add_graph_int  ( "ncycles_id","data_id",self.graphId,n+1 )

        nx    = max(self.graph_min_cycles,n+1.5)
        rmeta = self.build_meta[n]["refmac"]
        bmeta = self.build_meta[n]["cbuccaneer"]

        self.drawPlot ( "rfactors_plot_id",nx,[
            [ "rfactor_id",rmeta["rfactor"][1] ],
            [ "rfree_id"  ,rmeta["rfree"  ][1] ]
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

        pyrvapi.rvapi_flush()

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


    def makeResultTable ( self ):

        if not self.tableId:
            self.tableId = self.getWidgetId ( "restable" )
            pyrvapi.rvapi_add_table ( self.tableId,"Best solution",
                                      self.report_page_id,
                                      self.rvrow,0,1,1, 0 )
            self.putHorzHeaders ( self.tableId,[
                [ "##"                ,"Solution No."             ],
                [ "N<sub>built</sub>" ,"Residues built"           ],
                [ "N<sub>seq</sub>"   ,"Residues sequenced"       ],
                [ "N<sub>alloc</sub>" ,"Residues allocated"       ],
                [ "N<sub>frag</sub>"  ,"Number of fragments"      ],
                [ "N<sub>chains</sub>","Number of chains"         ],
                [ "C<sub>res</sub>"   ,"Completeness by residues" ],
                [ "C<sub>chain</sub>" ,"Completeness by chains"   ],
                [ "R<sub>factor</sub>","R-factor"                 ],
                [ "R<sub>free</sub>"  ,"R-free"                   ]
            ])
            self.rvrow += 1

            self.putMessage ( "&nbsp;" )

            map_path = os.path.join ( os.path.relpath(self.outputdir,self.reportdir),
                                      self.input_data["nameout"] )
            self.putStructureWidget ( "Structure and density map",[
                                        map_path + ".pdb",
                                        map_path + ".mtz",
                                        map_path + edmap.file_map(),
                                        map_path + edmap.file_dmap()
                                      ],-1 )

        bmeta = self.build_meta[self.best_build_no]["cbuccaneer"]
        rmeta = self.build_meta[self.best_build_no]["refmac"]

        self.putTableValues ( self.tableId,[
            str(self.best_build_no+1),
            str(bmeta["n_res_built"]),
            str(bmeta["n_res_sequenced"]),
            str(bmeta["n_res_alloc"]),
            str(bmeta["n_fragments"]),
            str(bmeta["n_chains_alloc"]),
            "{0:5.1f}%".format(bmeta["res_complete"]),
            "{0:5.1f}%".format(bmeta["chain_complete"]),
            "{0:7.3f}" .format(rmeta["rfactor"][1]),
            "{0:7.4f}" .format(rmeta["rfree"][1])
        ])

        pyrvapi.rvapi_flush()

        return


    # ----------------------------------------------------------------------

    def stock_result ( self,meta ):

        self.build_meta.append ( meta )

        # look for lowest Rfree for simplicity -- to be revised later
        rfree0 = 10.0
        bb_no  = self.best_build_no
        for i in range(len(self.build_meta)):
            if self.build_meta[i]["refmac"]["rfree"][1]<rfree0:
                self.best_build_no = i
                rfree0 = self.build_meta[i]["refmac"]["rfree"][1]

        if self.best_build_no!=bb_no:
            #  copy best results
            meta0 = self.build_meta[self.best_build_no]
            shutil.copy2 ( meta0["xyzpath"],self.xyzout_path )
            shutil.copy2 ( meta0["mtzpath"],self.mtzout_path )

            #  calculate maps for viewer
            fstdout = open ( os.path.join(self.workdir,"stdout_map.log"),'w' )
            fstderr = open ( os.path.join(self.workdir,"stderr_map.log"),'w' )
            edmap.calcCCP4Maps ( self.mtzout_path,
                                 os.path.join(self.outputdir,self.input_data["nameout"]),
                                 self.workdir,fstdout,fstderr,"refmac",None )
            fstdout.close()
            fstderr.close()

        return


    def printMetrics ( self,i,j,meta ):

        if i<0 or not meta:
            self.log ([
                " ",
                "---------------------------------------------------------------------------",
                "  I   J   Nblt  Nseq  Nalloc Nfragm Nchains  CRes  CChain   Rfactor  Rfree ",
                "---------------------------------------------------------------------------"
            ])
            return

        bmeta = meta["cbuccaneer"]
        rmeta = meta["refmac"]
        jstr  = "{0:3d}".format(j)

        if j<0:
            self.log ([
                "---------------------------------------------------------------------------"
            ])
            jstr = "   "

        self.log ( "{0:3d} {1:3s} {2:6d} {3:5d}  {4:5d} {5:5d}  {6:5d}    {7:5.1f}% {8:5.1f}%  {9:7.3f} {10:7.3f}\n".format(
            i,jstr,
            bmeta["n_res_built" ],bmeta["n_res_sequenced"],bmeta["n_res_alloc"],
            bmeta["n_fragments" ],bmeta["n_chains_alloc"],
            bmeta["res_complete"],bmeta["chain_complete"],
            rmeta["rfactor"][1]  ,rmeta["rfree"][1]
        ))

        if j<0:
            self.log ([
                "---------------------------------------------------------------------------"
            ])
        return
