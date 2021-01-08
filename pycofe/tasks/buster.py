#!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    08.01.21   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2021
#
# ============================================================================
#

#  python native imports
import os
#import shutil

import gemmi

#  application imports
from . import basic
from   pycofe.proc   import qualrep


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

    def merge_sites ( self,xyzpath,hapath,hatype,outpath ):
        ha_type = hatype.upper()
        st_xyz  = gemmi.read_structure ( xyzpath )
        st_ha   = gemmi.read_structure ( hapath  )
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
        irevision = self.makeClass ( self.input_data.data.revision[0] )
        hkl       = self.makeClass ( self.input_data.data.hkl     [0] )
        istruct   = self.makeClass ( self.input_data.data.istruct [0] )

        cmd     = [ "-m",hkl.getHKLFilePath(self.inputDir()),
                    "-p",istruct.getXYZFilePath(self.inputDir()),
                    "-d",self.buster_dir() ]

        libin = istruct.getLibFilePath ( self.inputDir() )
        if libin:
            cmd += ["-l",libin]

        sec1 = self.task.parameters.sec1.contains

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

        # run buster
        os.environ["autoBUSTER_HIGHLIGHT"] = "no"
        os.environ["UseDictionaryCommonCompoundsOwn"] =\
                    os.path.join ( os.environ["CCP4"],"lib","data","monomers" )
        self.runApp ( "refine",cmd,logType="Main" )

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
                if "Ncyc       Total        Grms       Rfact       Rfree         LLG     LLGfree  Geom_Funct     rmsBOND    rmsANGLE" in line:
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
                        "y"      : [{ "name":"LLG"     , "values": [] },
                                    { "name":"LLG-free", "values": [] }]
                    }
                    plot_rms = {
                        "name"   : iter + "LLG scores",
                        "xtitle" : "Cycle No.",
                        "ytitle" : "RMS scores",
                        "x"      : {  "name":"Cycle No.", "values": [] },
                        "y"      : [{ "name":"rmsBOND" , "values": [] },
                                    { "name":"rmsANGLE", "values": [] }]
                    }
                elif plot_ref:
                    vals = line.split()
                    if len(vals)<10:
                        graphData[0]["plots"].append ( plot_ref )
                        graphData[1]["plots"].append ( plot_llg )
                        graphData[2]["plots"].append ( plot_rms )
                        plot_ref = None
                        plot_llg = None
                        plot_rms = None
                    else:
                        vref = self.get_floats ( vals[0],vals[3],vals[4] )
                        vllg = self.get_floats ( vals[0],vals[5],vals[6] )
                        vrms = self.get_floats ( vals[0],vals[8],vals[9] )
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

                        """
                        x = float ( vals[0] )
                        plot_ref["x"]   ["values"].append ( x )
                        plot_ref["y"][0]["values"].append ( self.get_float(vals[3]) )
                        plot_ref["y"][1]["values"].append ( self.get_float(vals[4]) )
                        if vals[0]!="0":
                            plot_llg["x"]   ["values"].append ( x )
                            plot_llg["y"][0]["values"].append ( self.get_float(vals[5]) )
                            plot_llg["y"][1]["values"].append ( self.get_float(vals[6]) )
                        plot_rms["x"]   ["values"].append ( x )
                        plot_rms["y"][0]["values"].append ( self.get_float(vals[8]) )
                        plot_rms["y"][1]["values"].append ( self.get_float(vals[9]) )
                        """
                elif "best refinement in BUSTER reached for" in line:
                    vals = line.split()[-1].split("/")
                    self.generic_parser_summary["buster"] = {
                        "R_factor" : vals[0],
                        "R_free"   : vals[1]
                    }
            f.close()

            # continue writing to stdout
            self.file_stdout = open ( self.file_stdout_path(),"a" )

            #self.stdoutln ( str(plots) )

            self.putLogGraphWidget ( self.getWidgetId("graph"),graphData )

            self.putMessage ( "&nbsp;" )

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            structure = self.registerStructure ( xyzout,None,mtzout,
                                None,None,libin,leadKey=1,
                                map_labels="2FOFCWT,PH2FOFCWT,FOFCWT,PHFOFCWT",
                                copy_files=True )

            if structure:
                structure.copyAssociations   ( istruct )
                structure.addDataAssociation ( hkl.dataId     )
                structure.addDataAssociation ( istruct.dataId )  # ???
                structure.setBusterLabels    ( hkl )
                structure.copySubtype        ( istruct )
                structure.copyLigands        ( istruct )
                structure.addPhasesSubtype   ()

                self.putStructureWidget      ( "structure_btn",
                                               "Structure and electron density",
                                               structure )

                # make anomolous ED map widget
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
                    if os.path.exists(mapfile):
                        anomtz = "anomtz.mtz"
                        self.open_stdin()
                        self.write_stdin ([
                            "mode sfcalc mapin",
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
                        hatype     = irevision.ASU.ha_type
                        if not hatype:
                            hatype = "AX"
                        self.merge_sites (
                            xyzout, os.path.join(anodir,"ano.ANO.pdb"),hatype,
                            xyz_merged )

                        self.putMessage ( "<h3>Structure with anomolous maps</h3>")
                        struct_ano = self.registerStructure ( xyz_merged,None,anomtz,
                                    None,None,libin,leadKey=1,
                                    map_labels="FAN,PHAN",
                                    copy_files=False )
                        if struct_ano:
                            struct_ano.copyAssociations   ( istruct )
                            struct_ano.addDataAssociation ( hkl.dataId     )
                            struct_ano.addDataAssociation ( istruct.dataId )  # ???
                            struct_ano.setBusterLabels    ( hkl )
                            struct_ano.copySubtype        ( istruct )
                            struct_ano.copyLigands        ( istruct )
                            struct_ano.addPhasesSubtype   ()

                            nlst = struct_ano.dname.split ( " /" )
                            nlst[0] += " (anom maps)"
                            struct_ano.dname = " /".join(nlst)
                            self.putStructureWidget ( "struct_ano_btn",
                                        "Structure and anomalous maps",struct_ano )

                        else:
                            self.putMessage ( "<i>Structure with anomalous map " +\
                                              "could not be formed (possible bug)</i>" )
                    else:
                        self.putMessage ( "<i>Anomalous map was not calculated " +\
                                          "could not be formed (possible bug)</i>" )

                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )
                have_results = True

                rvrow0 = self.rvrow
                try:
                    qualrep.quality_report ( self,revision )
                except:
                    self.stderr ( " *** molprobity failure" )
                    self.rvrow = rvrow0

        # remove this because it contains soft links not good for copying
        #shutil.rmtree ( self.buster_dir() )
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
