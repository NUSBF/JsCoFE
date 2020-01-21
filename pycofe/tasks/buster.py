#!/usr/bin/python

#
# ============================================================================
#
#    19.01.20   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
#import shutil

#  application imports
import basic


# ============================================================================
# Make Buster driver

class Buster(basic.TaskDriver):

    # make task-specific definitions
    #def buster_seq (self):  return "buster.seq"

    def buster_dir (self):  return "buster_dir"
    def buster_seq (self):  return "buster.seq"

    # ------------------------------------------------------------------------

    def run(self):

        # check that buster is installed (since it is not part of CCP4 distribution)
        if "BDG_home" not in os.environ:
            self.fail ( "<p>&nbsp; *** BUSTER is not installed, or is not configured",
                       "buster is not found")

        # Prepare buster job

        # fetch input data
        hkl     = self.makeClass ( self.input_data.data.hkl    [0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        cmd     = [ "-m",hkl.getHKLFilePath(self.inputDir()),
                    "-p",istruct.getXYZFilePath(self.inputDir()),
                    "-d",self.buster_dir() ]

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
        self.runApp ( "refine",cmd,logType="Main" )

        # check results and finish report
        mtzout = os.path.join ( self.buster_dir(),"refine.mtz" )
        xyzout = os.path.join ( self.buster_dir(),"refine.pdb" )
        if os.path.isfile(mtzout):

            self.file_stdout.close()

            graphData = [
                { "name"  : "R-factors" , "plots" : [] },
                { "name"  : "LLG scores", "plots" : [] },
                { "name"  : "RMS scores", "plots" : [] }
            ]
            plot_ref = None
            plot_llg = None
            plot_rms = None
            with open(self.file_stdout_path(),"r") as f:
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
                    elif plot_ref and line.strip()=="":
                        graphData[0]["plots"].append ( plot_ref )
                        graphData[1]["plots"].append ( plot_llg )
                        graphData[2]["plots"].append ( plot_rms )
                        plot_ref = None
                        plot_llg = None
                        plot_rms = None
                    elif "best refinement in BUSTER reached for" in line:
                        vals = line.split()[-1].split("/")
                        self.generic_parser_summary["buster"] = {
                            "R_factor" : vals[0],
                            "R_free"   : vals[1]
                        }
                    elif plot_ref:
                        vals = line.split()
                        plot_ref["x"]   ["values"].append ( float(vals[0]) )
                        plot_ref["y"][0]["values"].append ( float(vals[3]) )
                        plot_ref["y"][1]["values"].append ( float(vals[4]) )
                        if vals[0]!="0":
                            plot_llg["x"]   ["values"].append ( float(vals[0]) )
                            plot_llg["y"][0]["values"].append ( float(vals[5]) )
                            plot_llg["y"][1]["values"].append ( float(vals[6]) )
                        plot_rms["x"]   ["values"].append ( float(vals[0]) )
                        plot_rms["y"][0]["values"].append ( float(vals[8]) )
                        plot_rms["y"][1]["values"].append ( float(vals[9]) )

            # continue writing to stdout
            self.file_stdout = open ( self.file_stdout_path(),'a' )

            #self.stdoutln ( str(plots) )

            self.putLogGraphWidget ( self.getWidgetId("graph"),graphData )

            self.putMessage ( "&nbsp;" )

            structure = self.registerStructure ( xyzout,None,mtzout,
                                None,None,None,leadKey=1,
                                map_labels="2FOFCWT,PH2FOFCWT,FOFCWT,PHFOFCWT" )
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
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                self.registerRevision     ( revision  )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = Buster ( "",os.path.basename(__file__) )
    drv.start()
