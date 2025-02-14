##!/usr/bin/python

#
# ============================================================================
#
#    14.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FITWATERS EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.fitwaters jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid

import pyrvapi
# import gemmi

#  application imports
from . import basic
from   pycofe.proc   import coor
from   pycofe.proc   import qualrep
from   pycofe.auto   import auto,auto_workflow

# ============================================================================
# Make Refmac driver

class FitWaters(basic.TaskDriver):

    # ------------------------------------------------------------------------

    watout     = "_waters.pdb"
    xyz_wat    = "_xyz_wat.pdb"
    xyzout     = "_xyzout.pdb"
    mtzout     = "_mtzout.pdb"
    refmac_log = "_refmac_log"
    fndwat_cmd = []
    refmac_cmd = []
    report_row = 0
    graphId    = None
    sigma_min  = 1.0
    sigma_max  = 5.0
    graph_min_sigma  = 5.25
    graph_min_values = {}
    graph_max_values = {}

    
    def file_stdin_path(self): return "_stdin.script"


    def preparePlot ( self,plotId,plotName,intX,intY,ymin0,ymax0,lines ):

        pyrvapi.rvapi_add_graph_plot ( plotId,self.graphId,plotName,
                                       "Map level, sigma",plotName )
        pyrvapi.rvapi_set_plot_int   ( plotId,self.graphId,intX,intY )

        for line in lines:
            pyrvapi.rvapi_add_graph_dataset ( line[0],"data_id",self.graphId,
                                              line[1],line[1] )
            pyrvapi.rvapi_add_plot_line     ( plotId,"data_id",self.graphId,
                                              "sigma_id",line[0] )

        self.graph_min_sigma = self.sigma_max + 0.25
        pyrvapi.rvapi_set_plot_xrange ( plotId,self.graphId,0.5,5.5 )
        pyrvapi.rvapi_set_plot_yrange ( plotId,self.graphId,ymin0,ymax0 )

        self.graph_min_values[plotId] = ymin0
        self.graph_max_values[plotId] = ymax0

        return


    def prepareGraph ( self ):

        if not self.graphId:
            self.graphId = self.getWidgetId ( "wfit_graph" )

        pyrvapi.rvapi_add_loggraph ( self.graphId,self.report_page_id(),
                                     self.report_row+1,0,1,1 )
        self.rvrow += 1

        pyrvapi.rvapi_add_graph_data ( "data_id"   ,self.graphId,"Fit statistics" )
        pyrvapi.rvapi_add_graph_dataset ( "sigma_id","data_id",self.graphId,
                                          "Sigma","Map level" )

        self.preparePlot (
            "rfactors_plot_id","R-factors",False,False,0.2,0.25,[
                ["rfactor_id","R-factor"],
                ["rfree_id"  ,"R-free"  ]
            ]
        )

        self.preparePlot (
            "residues_plot_id","Water molecules fitted",False,True,0,10,[
                ["watbuilt_id","Water molecules fitted"]
            ]
        )

        pyrvapi.rvapi_flush()

        return


    def drawPlot ( self,plotId,sigRange,pdata ):

        minVal = 10000.0
        maxVal = 0.0
        for d in pdata:
            pyrvapi.rvapi_add_graph_real ( d[0],"data_id",self.graphId,d[1],"%g" )
            minVal = min ( minVal,d[1] )
            maxVal = max ( maxVal,d[1] )

        pyrvapi.rvapi_set_plot_xrange ( plotId,self.graphId,self.sigma_min-0.25,
                                        sigRange )

        if minVal<self.graph_min_values[plotId] or maxVal>self.graph_max_values[plotId]:
            if minVal<self.graph_min_values[plotId]:
                self.graph_min_values[plotId] = minVal
            if maxVal>self.graph_max_values[plotId]:
                self.graph_max_values[plotId] = maxVal
            pyrvapi.rvapi_set_plot_yrange ( plotId,self.graphId,
                                            self.graph_min_values[plotId],
                                            self.graph_max_values[plotId] )

        return



    def drawProgressGraph ( self,sig,nwat,rfact,rfree ):

        pyrvapi.rvapi_add_graph_real ( "sigma_id","data_id",self.graphId,sig,"%g" )

        sigRange = max(self.graph_min_sigma,sig+0.25)

        self.drawPlot ( "rfactors_plot_id",sigRange,[
            [ "rfactor_id",rfact ],
            [ "rfree_id"  ,rfree ]
        ])

        self.drawPlot ( "residues_plot_id",sigRange,[
            [ "watbuilt_id",nwat ]
        ])

        #pyrvapi.rvapi_flush()

        return

    # def removeCloseContacts ( self ):
    #     st       = gemmi.read_structure ( self.xyz_wat )
    #     st.setup_entities()
    #     model    = st[0]
    #     cdist    = float(self.mindist)
    #     ns       = gemmi.NeighborSearch ( model,st.cell,max(cdist,5.0) ).populate()
    #     cs       = gemmi.ContactSearch  ( cdist )
    #     results  = cs.find_contacts ( ns )
    #     nremoved = 0
    #     for r in results:
    #         if r.partner1.residue.is_water() and (not r.partner2.residue.is_water()):
    #             # r.partner2.residue.entity_type == gemmi.EntityType.Polymer):
    #             # print('removing %s %s in distance %g from %s %s' %
    #             #         (r.partner1.chain.name, r.partner1.residue, r.dist,
    #             #          r.partner2.chain.name, r.partner2.residue))
    #             del r.partner1.residue[:]
    #             nremoved += 1
    #         elif r.partner2.residue.is_water() and (not r.partner1.residue.is_water()):
    #             # r.partner1.residue.entity_type == gemmi.EntityType.Polymer):
    #             # print('removing %s %s in distance %g from %s %s' %
    #             #         (r.partner2.chain.name, r.partner2.residue, r.dist,
    #             #          r.partner1.chain.name, r.partner1.residue))
    #             del r.partner2.residue[:]
    #             nremoved += 1
    #     self.stdoutln ( "... total " + str(nremoved) + " close contacts removed" )
    #     if nremoved>0:
    #         st.write_pdb ( self.xyz_wat )
    #     return



    def findWaters ( self,sigma,log_type ):

        # Start findwaters
        cmd = self.fndwat_cmd + ["--sigma",str(sigma)]
        if sys.platform.startswith("win"):
            self.runApp ( "findwaters.bat",cmd,logType=log_type )
        else:
            self.runApp ( "findwaters",cmd,logType=log_type )

        nwaters = coor.mergeLigands ( self.pdbin,[self.watout],"W",self.xyz_wat )
        # if self.mindist:
        #     self.removeCloseContacts()

        self.rvrow = self.report_row

        # Re-refine result
        self.file_stdin  = True    # reuse refmac script
        main_logfile     = self.file_stdout
        self.file_stdout = open ( self.refmac_log,"w" )
        # Prepare report parser
        if log_type=="Main":
            self.putMessage ( "<b>Total " + str(nwaters) +\
                              " water molecules were fitted (&sigma;=" +\
                              str(sigma) + ")</b>" )
            self.putMessage ( "<h2>Refinement statistics</h2>" )
            panel_id = self.getWidgetId ( "refmac_report" )
            self.setRefmacLogParser ( panel_id,False,
                                    graphTables=False,makePanel=True )
        self.runApp ( "refmac5",self.refmac_cmd,logType="Main" )
        self.unsetLogParser()
        self.file_stdout.close()
        self.file_stdout = main_logfile
        rfactor = 1.0
        rfree   = 1.0
        with open(self.refmac_log,"r") as rf:
            for line in rf:
                if line.startswith("Overall R factor"):
                    rfactor = line.split("=")[1].strip()
                elif line.startswith("Free R factor"):
                    rfree   = line.split("=")[1].strip()
                self.file_stdout1.write ( line )

        return (nwaters,rfactor,rfree)


    def try_sigma ( self,sigma ):
        nwaters,rfactor,rfree = self.findWaters ( sigma,"Service" )
        fname   = "sigma_" + str(sigma)
        rc = {
            "sigma"   : sigma,
            "nwaters" : nwaters,
            "rfactor" : float(rfactor),
            "rfree"   : float(rfree),
            # "rfactor" : float(self.generic_parser_summary["refmac"]["R_factor"]),
            # "rfree"   : float(self.generic_parser_summary["refmac"]["R_free"]),
            "logfile" : fname + ".log",
            "mtzout"  : fname + ".mtz",
            "xyzout"  : fname + ".pdb"
        }
        os.rename ( self.refmac_log,rc["logfile"] )
        os.rename ( self.mtzout    ,rc["mtzout"]  )
        os.rename ( self.xyzout    ,rc["xyzout"]  )
        return rc


    def optimise_sigma ( self ):
        
        self.rvrow = self.report_row
        self.prepareGraph()

        step  = 0.25
        sigma = self.sigma_min
        ninc  = 0
        rc0   = None
        while (sigma<self.sigma_max+step/2) and (ninc<6):
            rc = self.try_sigma(sigma)
            # if not rc0 or (rc["rfactor"]<rc0["rfactor"]):
            if not rc0 or (rc["rfree"]<rc0["rfree"]):
                rc0  = rc
                ninc = 0
            elif rc0:
                ninc += 1
            self.drawProgressGraph ( sigma,int(rc["nwaters"]),float(rc["rfactor"]),
                                     float(rc["rfree"]) )
            sigma += step

        os.rename ( rc0["logfile"],self.refmac_log )
        os.rename ( rc0["mtzout"] ,self.mtzout     )
        os.rename ( rc0["xyzout"] ,self.xyzout     )

        self.rvrow = self.report_row
        self.putMessage ( "<b>Total " + str(rc0["nwaters"]) +\
                          " water molecules were fitted (&sigma;=" +\
                          str(rc0["sigma"]) + ")</b>" )

        self.rvrow += 2
        self.putMessage ( "<h2>Refinement statistics</h2>" )
        panel_id = self.getWidgetId ( "refmac_report" )
        self.setRefmacLogParser ( panel_id,False,
                                  graphTables=False,makePanel=True )
        file_refmaclog = open ( self.refmac_log,"r" )
        self.log_parser.parse_stream ( file_refmaclog )
        file_refmaclog.close()
        self.unsetLogParser()

        return rc0["nwaters"]


    def run(self):

        # Prepare findwaters input
        # fetch input data

        hkl     = self.makeClass ( self.input_data.data.hkl[0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        sec1    = self.task.parameters.sec1.contains

        # make command-line parameters
        self.pdbin      = istruct.getPDBFilePath ( self.inputDir() )
        mtzin           = istruct.getMTZFilePath ( self.inputDir() )
        self.fndwat_cmd = [ 
                "--pdbin" ,self.pdbin,
                "--hklin" ,mtzin,
                "--pdbout",self.watout
                # "--sigma" ,self.getParameter(sec1.SIGMA)
            ]

        if istruct.mapSel=="diffmap":
            self.fndwat_cmd += [
                "--f"     ,istruct.DELFWT,
                "--phi"   ,istruct.PHDELWT,
            ]
        else:
            self.fndwat_cmd += [
                "--f"     ,istruct.FWT,
                "--phi"   ,istruct.PHI,
            ]

        #    self.PHI      = ""
        #    self.FOM      = ""

        self.mindist = None
        self.maxdist = None
        if self.getParameter(sec1.FLOOD_CBX)=="True":
            self.fndwat_cmd += [ "--flood","--flood-atom-radius",
                                 self.getParameter(sec1.FLOOD_RADIUS) ]
        else:
            self.mindist = self.getParameter ( sec1.MIN_DIST )
            self.maxdist = self.getParameter ( sec1.MAX_DIST )
            if self.mindist:
                self.fndwat_cmd += [ "--min-dist",self.mindist ]
            if self.maxdist:
                self.fndwat_cmd += [ "--max-dist",self.maxdist ]

        # make command-line parameters for refmac
        self.refmac_cmd = [ 
            "hklin" ,hkl.getHKLFilePath(self.inputDir()),
            "xyzin" ,self.xyz_wat,
            "hklout",self.mtzout,
            "xyzout",self.xyzout,
            "tmpdir",os.path.join(os.environ["CCP4_SCR"],uuid.uuid4().hex) 
        ]

        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            self.refmac_cmd  += ["libin",libin]

        # prepare refmac script
        self.open_stdin()
        ref_params = []
        refkeys = istruct.get_refkeys_parameters ( "TaskRefmac" )
        if refkeys:
            self.putMessage ( "<i>Using refinement parameters from job " +\
                              str(refkeys.id) + "</i><br>&nbsp;" )
            ref_params = refkeys.keywords
        else:
            ref_params = "LABIN FP="   + hkl.dataset.Fmean.value +\
                             " SIGFP=" + hkl.dataset.Fmean.sigma +\
                             " FREE="  + hkl.dataset.FREE +\
                         "\nNCYC 10"             +\
                         "\nWEIGHT AUTO"         +\
                         "\nMAKE HYDR ALL"       +\
                         "\nMAKE LINK NO"        +\
                         "\nREFI BREF ISOT"      +\
                         "\nSCALE TYPE SIMPLE"   +\
                         "\nSOLVENT YES"         +\
                         "\nNCSR LOCAL"          +\
                         "\nMAKE NEWLIGAND EXIT" +\
                         "\nPdbout keep true"    +\
                         "\nEND"
        self.write_stdin ( ref_params )
        self.close_stdin()

        self.report_row = self.rvrow

        sigma = self.getParameter ( sec1.SIGMA )
        if sigma:
            nwaters = self.findWaters ( self.getParameter(sec1.SIGMA),"Main" )[0]
        else:
            nwaters = self.optimise_sigma()

        have_results = False
        if nwaters>0:
            pdbout = self.outputFName + ".pdb"
            os.rename ( self.xyzout,pdbout )
            mtzout = self.outputFName + ".mtz"
            os.rename ( self.mtzout,mtzout )
            structure = self.registerStructure (
                            None,
                            pdbout,
                            None,
                            mtzout,
                            libPath  = libin,
                            mapPath  = istruct.getMapFilePath (self.inputDir()),
                            dmapPath = istruct.getDMapFilePath(self.inputDir()),
                            leadKey  = istruct.leadKey,
                            refiner  = istruct.refiner 
                        )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations     ( istruct    )
                structure.copySubtype          ( istruct    )
                structure.copyLabels           ( istruct    )
                structure.copyLigands          ( istruct    )
                structure.addWaterSubtype  ()
                self.putTitle   ( "Results" )
                self.putStructureWidget   ( "structure_btn_",
                                            "Structure and electron density",
                                            structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True

                rvrow0 = self.rvrow
                # meta = qualrep.quality_report ( self,revision )
                try:
                    meta = qualrep.quality_report ( self,revision )
                    # self.stderr ( " META=" + str(meta) )
                    if "molp_score" in meta:
                        self.generic_parser_summary["refmac"]["molp_score"] = meta["molp_score"]

                except:
                    meta = None
                    self.stderr ( " *** validation tools or validation tools failure" )
                    self.rvrow = rvrow0 + 6

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision"  : [revision]
                            },
                            "scores" :  {
                                "Rfactor"  : float(self.generic_parser_summary["refmac"]["R_factor"]),
                                "Rfree"    : float(self.generic_parser_summary["refmac"]["R_free"]),
                                "Nwaters"  : nwaters
                            }
                    })
                    # self.putMessage ( "<h3>Workflow started</hr>" )

                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "nwaters"  : str(nwaters)
                    })

        else:
            self.putTitle ( "No water molecules were found and fitted." )

        # this will go in the project tree job's line
        self.generic_parser_summary["fitwaters"] = {
            "summary_line" : "N<sub>waters</sub>=" + str(nwaters)
        }

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = FitWaters ( "",os.path.basename(__file__) )
    drv.start()
