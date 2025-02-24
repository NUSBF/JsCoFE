#!/usr/bin/python

#
# ============================================================================
#
#    25.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  BUSTER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python buster.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2025
#
# ============================================================================
#

#  python native imports
import os
import shutil

import gemmi

#  application imports
from . import basic
from   pycofe.proc   import qualrep
from   pycofe.auto   import auto,auto_workflow


# ============================================================================
# Make Buster driver

class Buster(basic.TaskDriver):

    # make task-specific definitions
    #def buster_seq (self):  return "buster.seq"

    def buster_dir (self):  return "buster_dir"
    def buster_seq (self):  return "buster.seq"

    # ------------------------------------------------------------------------

    def get_floats ( self,s1,s2,s3 ):
        try:
            return [float(s1),float(s2),float(s3)]
        except:
            return None

    def indexof ( self,vlist,value ):
        try:
            return vlist.index(value)
        except ValueError:
            return -1

    def check_substructure ( self,hapath ):
        if os.path.exists(hapath):
            st_ha = gemmi.read_structure ( hapath )
            st_ha.setup_entities()
            if len(st_ha)>0:
                for chain in st_ha[0]:
                    if len(chain)>0:
                        return True
        return False


    def merge_sites ( self,xyzpath,hapath,hatype,outpath ):
        ha_type = hatype.upper()
        st_xyz  = gemmi.read_structure ( xyzpath )
        st_xyz.setup_entities()
        if os.path.exists(hapath):
            st_ha = gemmi.read_structure ( hapath  )
            st_ha.setup_entities()
            if len(st_ha)>0:
                for chain in st_ha[0]:
                    chain.name = "Z"
                    for res in chain:
                        #res.name     = ha_type
                        res.het_flag = "H"
                        for atom in res:
                            atom.name    = ha_type
                            atom.element = gemmi.Element ( ha_type )
                    st_xyz[0].add_chain ( chain )
        st_xyz.write_pdb ( outpath )
        return

    # ------------------------------------------------------------------------

    def run(self):

        # check that buster is installed (since it is not part of CCP4 distribution)
        if "BDG_home" not in os.environ:
            self.fail ( "<p>&nbsp; *** BUSTER is not installed, or is not configured",
                       "buster is not found")

        # Prepare buster job

        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        libin    = istruct.getLibFilePath ( self.inputDir() )
        xyzin    = istruct.getPDBFilePath ( self.inputDir() )
        if istruct.refiner not in ["refmac","buster"]:
            self.stdoutln (
                "=========================================\n" +\
                "## Using Refmac to prepare input PDB file\n"
                "=========================================\n"
            )
            fnames = self.calcEDMap ( xyzin,hkl,libin,"_xyzin_corrected",self.inputDir() )
            xyzin  = fnames[0]

        cmd = [ "-m",hkl.getHKLFilePath(self.inputDir()),
                "-p",xyzin,
                "-d",self.buster_dir()
                # 'PdbChk_ChecksNotToDo="PdbChk_MoleculeTooFarFromOrigin"'
              ]

        if libin:
            cmd += ["-l",libin]

        sec1 = self.task.parameters.sec1.contains
        sec2 = None
        if hasattr(self.task.parameters,"sec2"):
            sec2 = self.task.parameters.sec2.contains

        if hkl.res_high or hkl.res_high:
            cmd.append ( "-R" )
            if hkl.res_low:
                cmd.append ( str(hkl.res_low) )
            else:
                cmd.append ( str(hkl.getLowResolution(raw=True)) )
            if hkl.res_high:
                cmd.append ( str(hkl.res_high) )
            else:
                cmd.append ( str(hkl.getHighResolution(raw=True)) )

        nbig = self.getParameter ( sec1.NBIGCYC )
        if nbig:
            cmd += ["-nbig",nbig]
        nsmall = self.getParameter ( sec1.NSMALLCYC )
        if nsmall:
            cmd += ["-nsmall",nsmall]

        solvent_mode = self.getParameter ( sec1.SOLVENT_SEL )
        if solvent_mode=="All":
            cmd.append ( "-WAT" )
        elif solvent_mode=="None":
            cmd.append ( "-noWAT" )
        elif solvent_mode=="Custom":
            cmd += ["-WAT",self.getParameter(sec1.NWAT) ]

        if self.getParameter(sec1.AUTOTLS_CBX)=="True":
            cmd.append ( "-TLS" )
        if self.getParameter(sec1.AUTORB_CBX)=="True":
            cmd.append ( "-RB" )
        if self.getParameter(sec1.LIGANDED_CBX)=="True":
            cmd.append ( "-L" )

        if self.getParameter(sec1.AUTONCS_CBX)=="True":
            cmd.append ( "-autoncs" )
            if self.getParameter(sec1.NCSPRUNE_CBX)=="False":
                cmd.append ( "-autoncs_noprune" )
            ncs_mode = self.getParameter ( sec1.NCSIMPROVE_SEL )
            if ncs_mode=="Group1":
                cmd.append ( "-sim_swap_equiv" )
            if ncs_mode=="Group2":
                cmd.append ( "-sim_swap_equiv_plus" )

        #cmd.append ( "UsePdbchk=no" )

        if sec2:
            gelly = self.getParameter(sec2.GELLY).strip();
            if gelly:
                gelly_fname = "_buster.gelly"
                with open(gelly_fname,"w") as f:
                    f.write ( gelly +'\n' )
                
                cmd += ["-Gelly",gelly_fname]

        """
        -R <reslow> <reshigh>         : low- and high-resolution limits for refinement (default is all data)
        -nbig <no. of BIG cycles>     : how many BIG cycles, i.e. refinement/water building (default 5)
        -nsmall <no. of SMALL cycles> : how many SMALL cycles of refinement during each BIG cycle (default 100)

        -WAT [<ncyc>]                 : switches on water updating (from big cycle <ncyc> onwards; default is to
                                        switch it on from the start).
        -noWAT [<ncyc>]               : switches off water updating (only for the first <ncyc> cycles; default is
                                        to switch it off for all cycles).
        -TLS [<tls.dat>]              : Carry out TLS refinement. The (optional) definition of TLS-groups is in
                                        the specified file.
        -RB [<rigid.dat>]             : do initial rigid-body refinement. If no (optional) rigid-body definition
                                        file is given, one rigid-body per chain is used.
        -L                            : attempts to enhance difference density to aid in identification of
                                        potential ligand sites with unknown location (also turns on water updating)
        -autoncs                      : automatically detect NCS and impose LSSR restraints
        -autoncs_noprune              : switch off automatic pruning of NCS outliers
        -target <file>                : impose target LSSR restraints to this external PDB file
        -sim_swap_equiv               : improve NCS relation of symmetrical side-chains Asp, Glu, Tyr, Phe and Arg
                                        by swapping equivalent atoms
        -sim_swap_equiv_plus          : same as -sim_swap_equiv but also considering Asn, Gln and His
        """

        self.putWaitMessageLF ( "Refinement in progress ..." )

        # run buster
        os.environ["autoBUSTER_HIGHLIGHT"] = "no"
        os.environ["UseDictionaryCommonCompoundsOwn"] =\
                    os.path.join ( os.environ["CCP4"],"lib","data","monomers" )
        self.runApp ( "refine",cmd,logType="Main" )
        self.putMessage ( "&nbsp;" )  # take the spinner off

        # check results and finish report
        have_results = False
        mtzout = os.path.join ( self.buster_dir(),"refine.mtz" )
        xyzout = os.path.join ( self.buster_dir(),"refine.pdb" )
        if os.path.isfile(mtzout):

            graphData = [
                { "name"  : "R-factors" , "plots" : [] },
                { "name"  : "LLG scores", "plots" : [] },
                { "name"  : "RMS scores", "plots" : [] }
            ]
            plot_ref = None
            plot_llg = None
            plot_rms = None

            self.flush()
            self.file_stdout.close()
            f = open ( self.file_stdout_path(),"r" )
            #f = open ( "/Users/eugene/Downloads/job_1598535717656/_stdout.log","r" )
            for line in f:
                vals = line.split()
                pCyc = self.indexof ( vals,"Ncyc" )
                if pCyc>=0:
                    pRfact = self.indexof ( vals,"Rfact" )
                    pRfree = self.indexof ( vals,"Rfree" )
                    # pRfact   = self.indexof ( vals,"Rxpctfact" )
                    # pRfree   = self.indexof ( vals,"Rxpctfree" )
                    # if pRfact<0:
                    #     pRfact = self.indexof ( vals,"Rfact" )
                    #     pRfree = self.indexof ( vals,"Rfree" )
                    pLLG     = self.indexof ( vals,"LLG"      )
                    pLLGfree = self.indexof ( vals,"LLGfree"  )
                    pBOND    = self.indexof ( vals,"rmsBOND"  )
                    pANGLE   = self.indexof ( vals,"rmsANGLE" )
                else:
                    pRfact   = -1
                    pRfree   = -1
                    pLLG     = -1
                    pLLGfree = -1
                    pBOND    = -1
                    pANGLE   = -1
                if pRfact>=0 and pRfree>=0 and pLLG>=0 and pLLGfree>=0 and pBOND>=0 and pANGLE>=0:
                    iter = "Iteration #" + str(len(graphData[0]["plots"])+1) + ": "
                    plot_ref = {
                        "name"   : iter + "R-factors",
                        "xtitle" : "Cycle No.",
                        "ytitle" : "R-factors",
                        "x"      : {  "name":"Cycle No.", "values": [] },
                        "y"      : [{ "name":"R-factor" , "values": [] },
                                    { "name":"R-free"   , "values": [] }]
                    }
                    plot_llg = {
                        "name"   : iter + "LLG scores",
                        "xtitle" : "Cycle No.",
                        "ytitle" : "LLG scores",
                        "x"      : {  "name":"Cycle No.", "values": [] },
                        "y"      : [{ "name":"LLG"      , "values": [] },
                                    { "name":"LLG-free" , "values": [] }]
                    }
                    plot_rms = {
                        "name"   : iter + "RMS scores",
                        "xtitle" : "Cycle No.",
                        "ytitle" : "RMS scores",
                        "x"      : {  "name":"Cycle No.", "values": [] },
                        "y"      : [{ "name":"rmsBOND"  , "values": [] },
                                    { "name":"rmsANGLE" , "values": [] }]
                    }
                    iCyc     = pCyc
                    iRfact   = pRfact
                    iRfree   = pRfree
                    iLLG     = pLLG
                    iLLGfree = pLLGfree
                    iBOND    = pBOND
                    iANGLE   = pANGLE

                elif plot_ref:
                    if len(vals)<10:
                        graphData[0]["plots"].append ( plot_ref )
                        graphData[1]["plots"].append ( plot_llg )
                        graphData[2]["plots"].append ( plot_rms )
                        plot_ref = None
                        plot_llg = None
                        plot_rms = None
                    else:
                        vref = self.get_floats ( vals[iCyc],vals[iRfact],vals[iRfree]   )
                        vllg = self.get_floats ( vals[iCyc],vals[iLLG]  ,vals[iLLGfree] )
                        vrms = self.get_floats ( vals[iCyc],vals[iBOND] ,vals[iANGLE]   )
                        if vref:
                            plot_ref["x"]   ["values"].append ( vref[0] )
                            plot_ref["y"][0]["values"].append ( vref[1] )
                            plot_ref["y"][1]["values"].append ( vref[2] )
                        if vllg:
                            plot_llg["x"]   ["values"].append ( vllg[0] )
                            plot_llg["y"][0]["values"].append ( vllg[1] )
                            plot_llg["y"][1]["values"].append ( vllg[2] )
                        if vrms:
                            plot_rms["x"]   ["values"].append ( vrms[0] )
                            plot_rms["y"][0]["values"].append ( vrms[1] )
                            plot_rms["y"][1]["values"].append ( vrms[2] )

                elif "best refinement in BUSTER reached for" in line:
                    vals = line.split()[-1].split("/")
                    self.generic_parser_summary["buster"] = {
                        "R_factor" : vals[0],
                        "R_free"   : vals[1]
                    }
                    #self.putTaskMetrics ( "rfactor",vals[0] )
                    #self.putTaskMetrics ( "rfree"  ,vals[1] )

            f.close()

            # continue writing to stdout
            self.file_stdout = open ( self.file_stdout_path(),"a" )

            #self.stderrln ( str(graphData) )

            self.putLogGraphWidget ( self.getWidgetId("graph"),graphData )

            self.putMessage ( "&nbsp;" )

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            structure = self.registerStructure ( 
                            None,
                            xyzout,
                            None,
                            mtzout,
                            libPath    = libin,
                            leadKey    = 1,
                            map_labels = "2FOFCWT,PH2FOFCWT,FOFCWT,PHFOFCWT",
                            copy_files = True,
                            refiner    = "buster" 
                        )

            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setBusterLabels    ( hkl )
                # structure.refiner = "buster"
                bustercif = os.path.join ( self.buster_dir(),"BUSTER_model.cif" )
                if os.path.isfile(bustercif):
                    mmcifout = self.getMMCIFOFName()
                    if libin:
                        with open(mmcifout,"w") as outfile:
                            with open(bustercif,"r") as infile:
                                wrt = True
                                for line in infile:
                                    if wrt and line.startswith("data_comp_list"):
                                        wrt = False
                                    elif not wrt and line.startswith("data_"):
                                        wrt = True
                                    if wrt:
                                        outfile.write ( line )
                    else:
                        os.rename ( bustercif,mmcifout )
                    #os.rename ( bustercif,mmcifout )
                    structure.add_file ( mmcifout,self.outputDir(),"mmcif",copy_bool=False )
                bust_rcif = os.path.join ( self.buster_dir(),"BUSTER_refln.cif" )
                if os.path.isfile(bust_rcif):
                    rmmcifout = self.getReflMMCIFOFName()
                    os.rename ( bust_rcif,rmmcifout )
                    structure.add_file ( rmmcifout,self.outputDir(),"refl-mmcif",copy_bool=False )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                structure.addPhasesSubtype   ()

                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )

                # make anomolous ED map widget
                substructure = None
                if hkl.isAnomalous():

                    anodir = "anofft"
                    if not os.path.isdir(anodir):
                        os.mkdir ( anodir )
                    self.runApp ( "diff_fourier",[
                        "-m"  ,mtzout,
                        "-p"  ,mtzout,
                        "-P"  ,"PH2FOFCWT","FOM",
                        "-o"  ,os.path.join(anodir,"ano"),
                        "-pdb",xyzout,
                        "-keepmap"
                    ],logType="Service" )

                    mapfile = os.path.join ( anodir,"ano.ANO.map" )
                    subfile = os.path.join ( anodir,"ano.ANO.pdb" )
                    if os.path.exists(mapfile) and self.check_substructure(subfile):

                        struct_ano = None
                        try:
                            anomtz = "anomtz.mtz"
                            self.open_stdin()
                            self.write_stdin ([
                                "mode sfcalc mapin",
                                "symm '" + hkl.getSpaceGroup() + "'",
                                "labout FC=FAN PHIC=PHAN",
                                "end"
                            ])
                            self.close_stdin()
                            self.runApp ( "sfall",[
                                "mapin" ,mapfile,
                                "hklout",anomtz
                            ],logType="Service" )
                            os.remove ( mapfile )

                            xyz_merged = "refine_merged.pdb"
                            hatype     = revision.ASU.ha_type.upper()
                            if not hatype:
                                hatype = "AX"
                            self.merge_sites ( xyzout,subfile,hatype,xyz_merged )

                            self.putTitle ( "Structure, substructure and anomolous maps")
                            struct_ano = self.registerStructure ( 
                                                None,
                                                xyz_merged,
                                                None,
                                                anomtz,
                                                libPath    = libin,
                                                leadKey    = 1,
                                                map_labels = "FAN,PHAN",
                                                copy_files = True,
                                                refiner    = "buster" 
                                            )
                        except:
                            pass

                        if struct_ano:
                            struct_ano.copyAssociations   ( istruct )
                            struct_ano.addDataAssociation ( hkl.dataId     )
                            struct_ano.addDataAssociation ( istruct.dataId )  # ???
                            #struct_ano.setBusterLabels    ( hkl )
                            struct_ano.copyLigands        ( istruct )
                            struct_ano.addPhasesSubtype   ()
                            structure .setAnomMapLabels ( "F_ano","PHI_ano" )
                            struct_ano.setAnomMapLabels ( "F_ano","PHI_ano" )

                            # struct_ano.refiner = "buster"

                            nlst = struct_ano.dname.split ( " /" )
                            nlst[0] += " (anom maps)"
                            struct_ano.dname = " /".join(nlst)
                            self.putStructureWidget ( "struct_ano_btn",
                                        "Structure, substructure and anomalous maps",struct_ano )

                            substructure = self.registerStructure (
                                                None,
                                                None,
                                                subfile,
                                                structure.getMTZFilePath(self.outputDir()),
                                                leadKey    = 2,
                                                copy_files = False,
                                                map_labels = "2FOFCWT,PH2FOFCWT,FOFCWT,PHFOFCWT",
                                                refiner    = "buster" 
                                            )

                            if substructure:
                                substructure.copyAssociations   ( istruct )
                                substructure.addDataAssociation ( hkl.dataId     )
                                substructure.addDataAssociation ( istruct.dataId )  # ???
                                substructure.setBusterLabels    ( hkl )
                                substructure.setAnomMapLabels ( "F_ano","PHI_ano" )
                                substructure.addPhasesSubtype()
                                # substructure.refiner = "buster"
                            else:
                                self.putMessage ( "<i>Substructure could not be " +\
                                                  "formed (possible bug)</i>" )

                        else:
                            self.putMessage ( "<i>Structure with anomalous map " +\
                                              "could not be formed (possible bug)</i>" )

                    else:
                        self.putMessage ( "<i>Anomalous map was not calculated " +\
                                          "could not be formed (possible bug)</i>" )

                # update structure revision
                revision.setStructureData ( substructure )
                revision.setStructureData ( structure    )
                self.registerRevision     ( revision     )
                have_results = True

                rvrow0 = self.rvrow
                try:
                    qualrep.quality_report ( self,revision,xyzin )
                except:
                    self.stderr ( " *** validation tools failure" )
                    self.rvrow = rvrow0 + 6

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision" : [revision]
                            },
                            "scores" :  {
                                "Rfactor"  : float(self.generic_parser_summary["buster"]["R_factor"]),
                                "Rfree"    : float(self.generic_parser_summary["buster"]["R_free"])
                            }
                    })

                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "Rfactor"  : self.generic_parser_summary["buster"]["R_factor"],
                        "Rfree"    : self.generic_parser_summary["buster"]["R_free"]
                    }, log=self.file_stderr)


        # remove this because it contains soft links not good for copying

        #shutil.copy2 ( os.path.join(self.buster_dir(),"BUSTER_model.cif"),"BUSTER_model.cif" )
        #shutil.copy2 ( os.path.join(self.buster_dir(),"BUSTER_refln.cif"),"BUSTER_refln.cif" )

        shutil.rmtree ( self.buster_dir() )

        for root, dirs, files in os.walk(self.buster_dir()):
            for name in files:
                fpath = os.path.join ( root,name )
                if os.path.islink(fpath):
                    os.unlink ( fpath )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Buster ( "",os.path.basename(__file__) )
    drv.start()
