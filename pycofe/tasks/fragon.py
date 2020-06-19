##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    12.06.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PARROT EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python fragon.py jobManager jobDir jobId
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

from future import *

#  python native imports
import os
import shutil
import json

#  application imports
from . import basic
from   pycofe.dtypes  import dtype_sequence, dtype_revision
from   pycofe.varut   import rvapi_utils


"""
callisto:fragon eugene$ fragon -h
usage: fragon [-h] [--mtz data.mtz] [--log Fragon_.log] [--i2]
              [--seq protein.seq] [--helix n] [--fragment fragment.pdb]
              [--ensemble ensemble.pdb] [--rescore_strands]
              [--rescore_residues] [--rescore_all] [--rescore_models]
              [--fixed partial_solution.pdb] [--solutions 10] [--test_all]
              [--ACORN_definitive_CC 0.300] [--ACORN_CC_diff 0.15]
              [--ncs_copies 1] [--copies 1] [--test_all_plausible_sg]
              [--test_sg_list P 21 21 21, P 21 21 2] [--name My_Protein]
              [--I I] [--SIGI SIGI] [--FP FP] [--SIGFP SIGFP] [--solvent 0.nn]
              [--search_highres 1.5] [--search_lowres 50]
              [--rotation_peaks 1000] [--rotation_cluster_off]
              [--rotation_sampling 1.5] [--translation_sampling 0.5]
              [--search_down_percent 15] [--purge 100] [--definitive_TFZ 8.0]
              [--RMS 0.2]
              [--results_json /path/to/Fragon_N/name_fragment_results.json]
              [--input_only] [--no_tncs] [--debug] [--nproc 1] [--version]

Places fragments with Phaser followed by density modification with ACORN

optional arguments:
  -h, --help            show this help message and exit

Options:
  --mtz data.mtz        input MTZ file
  --log Fragon_.log     logfile
  --i2                  ccp4i2 mode
  --seq protein.seq     sequence
  --helix n             helix length
  --fragment fragment.pdb
                        input fragment
  --ensemble ensemble.pdb
                        input ensemble
  --rescore_strands     rigid body refine each strand in ensemble separately
  --rescore_residues    rigid body refine half strands in ensemble separately
  --rescore_all         rescore all solutions (not up to number of requested
                        solutions)
  --rescore_models      rescore models in ensemble separately
  --fixed partial_solution.pdb
                        partial solution postion will be fixed
  --solutions 10        The maximum no. of solutions to try and test, default
                        10
  --test_all            test all solutions after ACORN CC indicates success
  --ACORN_definitive_CC 0.300
                        Stop testing solutions when ACORN CC is above this
                        value
  --ACORN_CC_diff 0.15  Stop testing solutions when difference between best
                        and worse ACORN CC is above this value
  --ncs_copies 1        no. of molecules in asymmetric unit, default = 1
  --copies 1            no. of copies of helix to place, default = 1
  --test_all_plausible_sg
                        Test all space groups in same laue group as input data
  --test_sg_list P 21 21 21, P 21 21 2
                        list of space groups_to_test
  --name My_Protein     Name to add to all output files, default = same as mtz
                        file name
  --I I                 I in mtzin
  --SIGI SIGI           SIGI in mtzin
  --FP FP               FP in mtzin
  --SIGFP SIGFP         SIGFP in mtzin
  --solvent 0.nn        solvent content (fraction) to override that calculated
                        from sequence and no. of NCS copies
  --search_highres 1.5  High resolution for MR search, default = high
                        resolution of data
  --search_lowres 50    Low resolution for MR search, default = low resolution
                        of data
  --rotation_peaks 1000
                        Select n peaks from FRF
  --rotation_cluster_off
                        Turn off peak clustering in FRF
  --rotation_sampling 1.5
                        Sampling for FRF, default = decided by Phaser
  --translation_sampling 0.5
                        Sampling for FTF, default = decided by Phaser
  --search_down_percent 15
                        Percentage of extra solutions for deep search
  --purge 100           for multicopy searches purge all but top N solutions
                        after refinement of each component
  --definitive_TFZ 8.0  TFZ indicating solution, default = 8
  --RMS 0.2             RMS error of helix, default = 0.2
  --results_json /path/to/Fragon_N/name_fragment_results.json
                        restart from this file
  --input_only          Do not test both hands of enantiomorphic space groups
                        (to speed up debugging)
  --no_tncs             Turn off tNCS correction
  --debug               turn on debugging messages
  --nproc 1             no. threads
  --version             print version
callisto:fragon eugene$

"""


# ============================================================================
# Make Molrep driver

class Fragon(basic.TaskDriver):

    # redefine name of input script file
    #def file_stdin_path (self):  return "fragon.script"

    # make task-specific definitions
    def fragon_seq(self):  return "fragon.seq"
    #def fragon_log(self):  return "fragon.log"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When fragon
        # succeeds, this file is created.
        #if os.path.isfile(self.fragon_xyz()):
        #    os.remove(self.fragon_xyz())

        # Prepare fragon input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        fragment = None
        if hasattr(self.input_data.data,"fragment"):
            fragment = self.makeClass ( self.input_data.data.fragment[0] )

        hkl = self.makeClass ( revision.HKL )
        seq = self.input_data.data.seq

        fragments_sec = self.task.parameters.fragments_sec.contains
        sec1          = self.task.parameters.sec1.contains
        sec2          = self.task.parameters.sec2.contains

        self.makeFullASUSequenceFile ( seq,"prepared_for_fragon",self.fragon_seq() )

        cmd = [
            "--name"   , "fragon",
            "--mtz"    , hkl.getHKLFilePath(self.inputDir()),
            #"--seq"    , self.fragon_seq(),
            "--solvent", str(revision.ASU.solvent/100.0)
            #"--log", self.fragon_log()
        ]

        """
        cols = hkl.getMeanColumns()
        if cols[2]=="I":
            cmd += [ "--I",cols[0],"--SIGI",cols[1] ]  # apparently does not work
        else:
            cmd += [ "--FP",cols[0],"--SIGFP",cols[1] ]
        """

        #  Rely on automatic identification :(
        #colf = hkl.getMeanF()
        #cmd += [ "--FP",colf[0],"--SIGFP",colf[1] ]

        """
        This also does not work
        coli = hkl.getMeanI()
        if coli[2]=="I":
            cmd += [ "--I",coli[0],"--SIGI",coli[1] ]
        """

        if fragment:
            # custom fragment is given
            cmd += [ "--fragment",fragment.getXYZFilePath(self.inputDir()) ]
        else:
            # use predefined fragments
            fragments_type = self.getParameter ( self.task.parameters.FRAGMENTS_SEL )
            if fragments_type=="helix":
                cmd += [
                    "--helix" , self.getParameter ( fragments_sec.HELIX_LEN    ),
                    "--copies", self.getParameter ( fragments_sec.HELIX_COPIES )
                ]
            else:
                ensemble = None
                if fragments_type=="ensemble-s3":
                    ensemble = "strands-3.pdb"
                elif fragments_type=="ensemble-s4":
                    ensemble = "strands-4.pdb"
                elif fragments_type=="ensemble-s5":
                    ensemble = "strands-5.pdb"
                else:
                    tilt = self.getParameter ( fragments_sec.STRAND_TILT )
                    if fragments_type=="ensemble-anti5":
                        ensemble = "anti_" + str(tilt) + "-strands-5.pdb"
                    elif fragments_type=="ensemble-para5":
                        ensemble = "para_" + str(tilt) + "-strands-5.pdb"
                cmd += [
                    "--ensemble", os.path.join ( os.environ["CCP4"],"share",
                                                 "fragon","include","fragments",
                                                 ensemble ),
                    "--copies"  , self.getParameter ( fragments_sec.STRAND_COPIES )
                ]


        if self.getParameter(sec1.TESTALL_CBX)=="True":
            cmd += [ "--test_all" ]

        cmd += [
            "--solutions"          , self.getParameter(sec1.NSOLUTIONS),
            "--ACORN_definitive_CC", self.getParameter(sec1.ACORN_CC),
            "--ACORN_CC_diff"      , self.getParameter(sec1.ACORN_DCC)
        ]

        if self.getParameter(sec2.TNCS_CBX)=="True":
            cmd += [ "--no_tncs" ]

#        does not work
#        if self.getParameter(sec2.LIMITRF_CBX)=="True":
#            cmd += [ "--rotation_peaks", self.getParameter(sec2.MAXNRF) ]

#        cmd += [ "--rotation_peaks","1000" ]

        refine_mode = self.getParameter ( sec2.RBREFINE_SEL )
        if refine_mode=="T":
            cmd += [ "--rescore_models" ]
        elif refine_mode=="S":
            cmd += [ "--rescore_strands" ]
        elif refine_mode=="H":
            cmd += [ "--rescore_residues" ]

        #self.getParameter ( sec1.SOLVENT_CONTENT )

        # prepare report parser
        self.setGenericLogParser ( "fragon_report",True )

        # start fragon
        self.runApp ( "fragon",cmd,logType="Main" )

        # close report parser
        self.unsetLogParser()
        self.addCitations ( ['phaser','acorn'] )

        have_results = False

        result_dir = "Fragon_1"
        logs = [f for f in os.listdir(result_dir) if f.endswith("scored_solutions.json")]

        if len(logs)==1:

            sol_meta = None
            with open(os.path.join(result_dir,logs[0]),"r") as lfile:
                sol_meta = json.load(lfile)
            if sol_meta and len(sol_meta["solutions"])>0:

                self.putTitle ( "Results" )

                solutions = sol_meta["solutions"]
                for i in range(len(solutions)):

                    if len(solutions)>1:
                        if i==0:
                            self.putMessage ( "<h3>Solution #" + str(i+1) + "</h3>")
                        else:
                            self.putMessage ( "&nbsp;<p><h3>Solution #" + str(i+1) + "</h3>")

                    solution = solutions[i]
                    tdict = {
                        "title": "Scores",
                        "state": 0, "class": "table-blue", "css": "text-align:right;",
                        "horzHeaders" :  [
                            { "label": "Phaser-LLG" , "tooltip": "Log-Likelihood Gain" },
                            { "label": "Phaser-TFZ" , "tooltip": "Translation Function Z-score" },
                            { "label": "Acorn-CC"   , "tooltip": "Acorn\'s Correlation Coefficient" },
                            { "label": "Space Group", "tooltip": "Space Group" }
                        ],
                        "rows" : [{"data":[
                            str(round(solution["llg"],2)),
                            str(round(solution["tfz"],2)),
                            str(round(solution["acornCC"],4)),
                            str(solution["sg"]),
                        ]}]
                    }

                    rvapi_utils.makeTable ( tdict,self.getWidgetId("score_table"),
                                            self.report_page_id(),
                                            self.rvrow,0,1,1 )
                    self.rvrow += 1

                    fragon_xyz = os.path.join(result_dir,solution["id"]+".pdb")
                    fragon_mtz = os.path.join(result_dir,solution["id"]+".mtz")

                    sol_hkl = hkl
                    spg_change = self.checkSpaceGroupChanged ( solution["sg"],hkl,fragon_mtz )
                    if spg_change:
                        fragon_mtz = spg_change[0]
                        sol_hkl    = spg_change[1]

                    # add freerflag
                    self.open_stdin()
                    self.write_stdin ([
                        "LABIN  FILE 1 ALLIN",
                        "LABIN  FILE 2 E1=" + hkl.getFreeRColumn()
                    ])
                    tmp_mtz = "__tmp.mtz"
                    #os.rename ( self.hklout_fpath,tmp_mtz )
                    cmd = [ "HKLIN1",fragon_mtz,
                            "HKLIN2",hkl.getHKLFilePath(self.inputDir()),
                            "HKLOUT",tmp_mtz ]
                    self.close_stdin()
                    self.runApp ( "cad",cmd,logType="Service" )

                    structure = self.registerStructure (
                        fragon_xyz,None,tmp_mtz,None,None,None,
                        leadKey=2 ) # ,map_labels=cols[0] + ",acorn.PHI" )

                    if structure:
                        #structure.copyAssociations ( istruct )
                        #structure.copySubtype      ( istruct )
                        #structure.copyLabels       ( istruct )
                        #structure.copyLigands      ( istruct )
                        structure.setFragonLabels  ()
                        structure.addPhasesSubtype ()
                        self.putStructureWidget    ( "structure_btn",
                                                     "Structure and electron density",
                                                     structure,
                                                     legend="Assigned structure name" )
                        # make structure revision
                        rev = dtype_revision.DType ( -1 )
                        rev.copy ( revision )
                        rev.setReflectionData ( sol_hkl   )
                        rev.setStructureData  ( structure )
                        self.registerRevision ( rev,i+1,title="",
                           message="<b><i>New structure revision name:</i></b>",
                           gridId = "", revisionName=None )
                        have_results = True

                    """
                    ofname = self.getOFName ( "",i+1 )
                    structure = self.finaliseStructure ( fragon_xyz,
                                    ofname,sol_hkl,None,seq,0,
                                    leadKey=1,openState_bool=False,
                                    title=None,reserveRows=0 )
                    if structure:
                        rev = dtype_revision.DType ( -1 )
                        rev.copy ( revision )
                        rev.setReflectionData ( sol_hkl   )
                        rev.setStructureData  ( structure )

                        #rev.makeRevDName  ( self.job_id,i+1,self.outputFName )
                        #self.putRevisionWidget ( gridId,i,
                        #    "New structure revision name:",rev )

                        #rev.register ( self.outputDataBox )

                        self.registerRevision ( rev,i+1,title="",
                           message="<b><i>New structure revision name:</i></b>",
                           gridId = "", revisionName=None )
                        have_results = True
                    """



        """
                "file_f " + hkl.getHKLFilePath(self.inputDir()) + "\n" + \
                "labin F=" + hkl.dataset.Fmean.value + " SIGF=" + hkl.dataset.Fmean.sigma + "\n"


        istruct  = self.makeClass ( self.input_data.data.istruct [0] )

        sec1     = self.task.parameters.sec1.contains

        seq = None
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq = self.input_data.data.seq
            self.makeFullASUSequenceFile ( seq,"prepared_for_fragon",self.fragon_seq() )
            #combseq = ""
            #for s in seq:
            #    seqstring = self.makeClass(s).getSequence ( self.inputDir() )
            #    for i in range(s.ncopies):
            #        combseq += seqstring
            #dtype_sequence.writeSeqFile ( self.fragon_seq(),"prepared_for_fragon",
            #                              combseq )

        ncs_struct = None
        if hasattr(self.input_data.data,"ncs_struct"):  # optional data parameter
            ncs_struct = self.makeClass ( self.input_data.data.ncs_struct[0] )

        refname = os.path.join ( os.environ["CCP4"],"lib","data",
            "reference_structures",
            "reference-" + sec1.REFMDL_SEL.value )

        self.open_stdin()
        self.write_stdin (
            "title Job "   + self.job_id.zfill(4) + \
            "\npdbin-ref " + refname + ".pdb" + \
            "\nmtzin-ref " + refname + ".mtz" + \
            "\ncolin-ref-fo FP.F_sigF.F,FP.F_sigF.sigF" + \
            "\ncolin-ref-hl FC.ABCD.A,FC.ABCD.B,FC.ABCD.C,FC.ABCD.D"
        )

        if seq:
            self.write_stdin ( "\nseqin-wrk " + self.fragon_seq() )

        self.write_stdin (
            "\nmtzin-wrk " + istruct.getMTZFilePath(self.inputDir()) + \
            "\ncolin-wrk-fo /*/*/["     + istruct.FP  + "," + istruct.SigFP + "]"
        )

        if istruct.HLA!="":
            self.write_stdin (
                "\ncolin-wrk-hl /*/*/[" + istruct.HLA + "," + istruct.HLB + \
                                    "," + istruct.HLC + "," + istruct.HLD + "]" +\
                "\ncolin-wrk-fc /*/*/["     + istruct.FWT + "," + istruct.PHWT + "]"
            )
        else:
            self.write_stdin (
                "\ncolin-wrk-phifom /*/*/[" + istruct.PHI + "," + istruct.FOM  + "]" + \
                "\ncolin-wrk-fc /*/*/["     + istruct.FWT + "," + istruct.PHWT + "]"
            )

        if istruct.FreeR_flag!="":
            self.write_stdin (
                "\ncolin-wrk-free /*/*/["   + istruct.FreeR_flag + "]"
            )

        ncs_xyz = None
        ncs_kwd = None
        ncycles = "3"
        if ncs_struct:
            if ncs_struct.hasSubSubtype():
                ncs_xyz = ncs_struct.getSubFilePath ( self.inputDir() )
                ncs_kwd = "pdbin-wrk-ha"
            elif ncs_struct.hasXYZSubtype():
                ncs_xyz = ncs_struct.getXYZFilePath ( self.inputDir() )
                ncs_kwd = "pdbin-wrk-mr"
            ncycles = "10"
        if ncs_kwd:
            self.write_stdin( "\n" + ncs_kwd + " " + ncs_xyz )
        if sec1.NCYCLES.value:
            ncycles = str(sec1.NCYCLES.value)

        solcont = float( revision.ASU.solvent )
        if solcont > 1.0:
            solcont /= 100.0

        output_file = self.getMTZOFName()
        self.write_stdin (
            "\nmtzout " + output_file + \
            "\ncolout fragon"  +\
            "\nncs-average"  +\
            "\nsolvent-content " + str( solcont ) + "\n"  +\
            "\ncycles " + ncycles + "\n" +
            self.putKWParameter ( sec1.SOLVENT_CBX   ) + \
            self.putKWParameter ( sec1.HISTOGRAM_CBX ) + \
            #self.putKWParameter ( sec1.NCSAVER_CBX   ) + \
            self.putKWParameter ( sec1.ANISO_CBX     ) + \
            #self.putKWParameter ( sec1.NCYCLES       ) + \
            self.putKWParameter ( sec1.RESMIN        ) + \
            self.putKWParameter ( sec1.NCSRAD        )
            #self.putKWParameter ( sec1.contains.SOLVCONT      )
        )

        self.close_stdin()
        """

        """
        # check solution and register data
        have_results = False
        if os.path.isfile(output_file):

            self.runApp ( "chltofom",[
                "-mtzin" ,output_file,
                "-mtzout","__tmp.mtz",
                "-colin-hl","/*/*/[fragon.ABCD.A,fragon.ABCD.B,fragon.ABCD.C,fragon.ABCD.D]",
                "-colout"  ,"fragon"
            ],logType="Service" )

            os.rename ( "__tmp.mtz",output_file )

            self.putTitle ( "Results" )

            # calculate maps for UglyMol using final mtz from temporary location
            #fnames = self.calcCCP4Maps ( output_file,self.outputFName,"fragon" )

            # register output data from temporary location (files will be moved
            # to output directory by the registration procedure)

            fragon_xyz = None
            fragon_sub = None
            if istruct.getXYZFileName():
                fragon_xyz = self.getXYZOFName()
                shutil.copyfile ( istruct.getXYZFilePath(self.inputDir()),fragon_xyz )
            if istruct.getSubFileName():
                fragon_sub = self.getOFName ( ".ha.pdb" )
                shutil.copyfile ( istruct.getSubFilePath(self.inputDir()),fragon_sub )
            #if istruct.getDMapFileName():
            #    shutil.copyfile ( istruct.getDMapFilePath(self.inputDir()),
            #                      fnames[1] )

            structure = self.registerStructure (
                    #fragon_xyz,fragon_sub,output_file,fnames[0],None,None,leadKey=2,
                    fragon_xyz,fragon_sub,output_file,None,None,None,leadKey=2,
                    map_labels="fragon.F_phi.F,fragon.F_phi.phi" )

            if structure:
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.setFragonLabels  ()
                self.putStructureWidget    ( "structure_btn",
                                             "Structure and electron density",
                                             structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setStructureData  ( structure )
                self.registerRevision      ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Output Generated" )
        """

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Fragon ( "",os.path.basename(__file__) )
    drv.start()
