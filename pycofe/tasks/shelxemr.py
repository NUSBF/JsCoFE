##!/usr/bin/python

#
# ============================================================================
#
#    14.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHELXE-MR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.shelxemr.py jobManager jobDir jobId
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
# import sys
import shutil
import json

#  ccp4-python imports
# import pyrvapi

#  application imports
from . import basic
from   pycofe.dtypes import dtype_template


# ============================================================================
# Make ShelxEMR driver

class ShelxEMR(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path  (self):  return "shelxe.script"

    # make task-specific definitions
    def shelxe_wrk_seq   (self):  return "shelxe_wrk.seq"
    def shelxe_wrk_mtz   (self):  return "shelxe_wrk.mtz"
    def shelxe_wrk_hkl   (self):  return "shelxe_wrk.hkl"
    def shelxe_wrk_pda   (self):  return "shelxe_wrk.pda"
    def shelxe_wrk_pdb   (self):  return "shelxe_wrk.pdb"
    def shelxe_wrk_pdo   (self):  return "shelxe_wrk.pdo"
    def shelxe_wrk_phs   (self):  return "shelxe_wrk.phs"
    def shelxe_wrk_seq   (self):  return "shelxe_wrk.seq"
    def shelxe_tmp_mtz   (self):  return "shelxe_tmp.mtz"
    def shelxe_tmp_mtz1  (self):  return "shelxe_tmp_1.mtz"
    # def shelxe_pdb       (self):  return "shelxe.pdb"
    # def shelxe_mtz       (self):  return "shelxe.mtz"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove molrep output xyz file. When molrep
        # succeeds, this file is created.

        if os.path.isfile(self.shelxe_wrk_phs()):
            os.remove(self.shelxe_wrk_phs())

        # Prepare shelxe input
        # fetch input data

        idata    = self.input_data.data
        revision = self.makeClass ( idata.revision[0] )
        hkl      = self.makeClass ( idata.hkl[0]      )
        istruct  = self.makeClass ( idata.istruct[0]  )
        seq      = idata.seq

        # Prepare set of input files for shelxe
        # copy files according to Shelx notations

        labin = hkl.getMeanF()
        if labin[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        labin[2] = hkl.getFreeRColumn()

        hklin = istruct.getHKLFilePath ( self.inputDir() )
        # shutil.copyfile ( istruct.getHKLFilePath(self.inputDir()),
        #                   self.shelxe_wrk_mtz() )
        if istruct.getPDBFileName():
            shutil.copyfile ( istruct.getPDBFilePath(self.inputDir()),
                              self.shelxe_wrk_pda() )
        else:
            shutil.copyfile ( istruct.getSubFilePath(self.inputDir()),
                              self.shelxe_wrk_pda() )

        # use mtz2various to prepare the reflection file
        self.mtz2hkl ( hklin,labin,self.shelxe_wrk_hkl() )


        # shutil.copyfile ( istruct.getMTZFilePath(self.inputDir()),
        #                   self.shelxe_wrk_mtz() )
        # if istruct.getPDBFileName():
        #     shutil.copyfile ( istruct.getPDBFilePath(self.inputDir()),
        #                       self.shelxe_wrk_pda() )
        # else:
        #     shutil.copyfile ( istruct.getSubFilePath(self.inputDir()),
        #                       self.shelxe_wrk_pda() )
        #
        # # use mtz2various to prepare the reflection file
        # self.mtz2hkl ( self.shelxe_wrk_mtz(),
        #                [istruct.FP,istruct.SigFP,istruct.FreeR_flag],
        #                self.shelxe_wrk_hkl() )


        # """
        # cmd = [ "HKLIN" ,self.shelxe_wrk_mtz(),
        #         "HKLOUT",self.shelxe_wrk_hkl() ]
        #
        # self.open_stdin  ()
        # self.write_stdin (
        #     "LABIN   FP="    + istruct.FP + " SIGFP=" + istruct.SigFP      +\
        #                                     " FREE="  + istruct.FreeR_flag +\
        #     "\nOUTPUT SHELX" +\
        #     #"\nFSQUARED"     +\
        #     "\nEND\n"
        # )
        # self.close_stdin()
        #
        # # run mtz-to-hkl converter
        # self.runApp ( "mtz2various",cmd,logType="Service" )
        # """

        # Prepare command line for shelxe

        sec1 = self.task.parameters.sec1.contains
        sec2 = self.task.parameters.sec2.contains

        solvent_content = self.getParameter ( sec1.SOLVENT_CONTENT )
        if not solvent_content:
            solvent_content = str(revision.ASU.solvent/100.0)

        cmd = [ self.shelxe_wrk_pda(),
                "-m" + self.getParameter(sec1.DM_CYCLES),
                "-t" + self.getParameter(sec2.TIME_FACTOR),
                "-s" + solvent_content
              ]

        # prepare squence file
        if seq and len(seq)>0:
            with open(self.shelxe_wrk_seq(),'w') as newf:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write ( hf.read() )
                    newf.write ( "\n" );
            cmd += ["-O"]

        autotrace = (self.getParameter(sec1.AUTOTRACE_CBX)=="True")

        if autotrace:
            cmd += ["-a" + self.getParameter(sec1.TRACING_CYCLES)]
            if self.getParameter(sec1.AH_SEARCH_CBX)=="True":
                cmd += ["-q"]
            if self.getParameter(sec1.OMIT_RES_CBX)=="True":
                cmd += ["-o"]
            if self.getParameter(sec1.NCS_CBX)=="True":
                cmd += ["-n"]

        cmd += ["-f"]  # read amplitudes not intensities

        gridId = self.putWaitMessageLF ( "Autotracing in progress ...",
                                         message2="&nbsp;&nbsp;&nbsp;" )

        webcoot_options = {
            "project"      : self.task.project,
            "id"           : self.job_id,
            "no_data_msg"  : "<b>Waiting for first trace...</b>",
            "FWT"          : "FWT",
            "PHWT"         : "PHWT", 
            "FP"           : "FP",
            "SigFP"        : "SIGFP",
            "FreeR_flag"   : "FreeR_flag",
            "DELFWT"       : "DELFWT",
            "PHDELWT"      : "PHDELWT"
        }

        self.putWebCootButton (
            self.shelxe_wrk_pdb(),
            "",
            "",  # placeholder for legend file
            "view-update",
            5000,  # milliseconds update interval
            json.dumps(webcoot_options),
            "[" + str(self.job_id).zfill(4) + "] SHELXE current structure",
            "View autotrace in progress",
            gridId,0,3
        )

        self.flush()

        rvrow0 = self.rvrow
        self.runApp ( "shelxe",cmd,logType="Main" )
        self.putMessage1 ( self.report_page_id()," ",rvrow0 )

        # - every cycle
        #CC for partial structure against native data =   7.29 %

        # - in the end
        # Estimated mean FOM = 0.630   Pseudo-free CC = 63.71 %
        # Best trace (cycle   1 with CC  8.39%) was saved as shelxe_wrk.pdb

        have_results = False

        if os.path.isfile(self.shelxe_wrk_phs()):

            # fetch data for displayig in Job Tree and report page

            cycleNo   = []
            CC        = []
            nResBuilt = []
            meanFOM   = 0.0
            pseudoCC  = 0.0
            bestCC    = 0.0

            self.file_stdout.close()
            cNo      = 1.0

            with open(self.file_stdout_path(),"r") as f:
                for line in f:
                    if "CC for partial structure against native data =" in line:
                        CC     .append ( float(line.split()[8]) )
                        cycleNo.append ( cNo )
                        cNo += 1.0
                    elif "Estimated mean FOM = " in line:
                        lst = line.split()
                        meanFOM  = float(lst[4])
                        pseudoCC = float(lst[8])
                    elif "residues left after pruning, divided into chains as follows:" in line:
                        nResBuilt.append ( float(line.split()[0]) )
                    elif "Best trace (cycle" in line:
                        bestCC   = float(line.split()[6][:-2])

            self.generic_parser_summary["shelxemr"] = {
                "meanFOM"  : meanFOM,
                "pseudoCC" : pseudoCC,
                "bestCC"   : bestCC
            }

            tableId = self.getWidgetId("table")
            self.putTable     ( tableId,"",self.report_page_id(),self.rvrow,mode=0 )
            self.putTableLine ( tableId,"Best CC","Best Correlation Coefficient achieved",
                                str(bestCC) + "%",0 )
            self.putTableLine ( tableId,"Mean FOM"  ,"Estimated mean FOM",str(meanFOM) ,1 )
            self.putTableLine ( tableId,"Pseudo-free CC","Pseudo-free CC",str(pseudoCC),2 )
            self.rvrow += 1


            #self.putGraphWidget ( self.getWidgetId("graph"),cycleNo,[CC],
            #     "Cycle No","Correlation Coefficient", width=700,height=400 )
            #self.putMessage ( "&nbsp;" )

            if autotrace:
                self.putLogGraphWidget ( self.getWidgetId("graph"),[
                    { "name"  : "Build statistics",
                      "plots" : [
                        {
                          "name"   : "Correlation Coefficient",
                          "xtitle" : "Cycle No.",
                          "ytitle" : "Correlation Coefficient (%%)",
                          "x"      : {  "name":"Cycle No.", "values": cycleNo },
                          "y"      : [{ "name":"CC"       , "values": CC }]
                        },{
                          "name"   : "Residues Built",
                          "xtitle" : "Cycle No.",
                          "ytitle" : "No. of Resdues Built",
                          "x"      : {  "name":"Cycle No.", "values": cycleNo },
                          "y"      : [{ "name":"Nres"     , "values": nResBuilt }]
                        }
                      ]
                    }
                ])
            self.putMessage ( "&nbsp;" )

            # continue writing to stdout
            self.file_stdout = open ( self.file_stdout_path (),'a' )

            #self.stdoutln ( " ****** " + str(cycleNo) )
            #self.stdoutln ( " ****** " + str(CC) )
            #self.stdoutln ( " ****** " + str(nResBuilt) )

            # Convert output to mtz file
            cryst = istruct.xyzmeta.cryst
            self.open_stdin  ()
            self.write_stdin (
                "TITLE   shelxeOUT" +\
                "\ncell    " + str(cryst.a)     + " " +\
                               str(cryst.b)     + " " +\
                               str(cryst.c)     + " " +\
                               str(cryst.alpha) + " " +\
                               str(cryst.beta)  + " " +\
                               str(cryst.gamma) +\
                "\nsymm    \"" + cryst.spaceGroup + "\"" +\
                "\nlabout  H K L ShelxE.F ShelxE.FOM ShelxE.PHI ShelxE.SIGF" +\
                "\nCTYPOUT H H H F W P Q" +\
                "\npname   shelxeOUT" +\
                "\ndname   shelxeOUT" +\
                "\nEND\n"
            )
            self.close_stdin()

            cmd = [ "hklin" ,self.shelxe_wrk_phs(),
                    "hklout",self.shelxe_tmp_mtz()
                  ]
            self.runApp ( "f2mtz",cmd,logType="Service" )

            labels = istruct.getAllLabels()
            llist  = ""
            n      = 1
            for l in labels:
                if not "ShelxE" in l:
                    llist += " E" + str(n) + "=" + l
                    n     += 1
            self.open_stdin  ()
            self.write_stdin ([
                "LABIN FILE 1 ALLIN",
                "LABIN FILE 2 " + llist,
                "END"
            ])
            self.close_stdin()
            # cmd = [ "hklin1",self.shelxe_tmp_mtz(),
            #         "hklin2",self.shelxe_wrk_mtz(),
            #         "hklout",self.shelxe_tmp_mtz1()
            #       ]
            cmd = [ "hklin1",self.shelxe_tmp_mtz(),
                    "hklin2",hklin,
                    "hklout",self.shelxe_tmp_mtz1()
                  ]
            self.runApp ( "cad",cmd,logType="Service" )

            # Calculate map coefficients
            mtzout = self.makeDataId(1) + "_" + self.getMTZOFName()
            self.open_stdin  ()
            self.write_stdin (
                "mode batch\n" +\
                #"read " + self.shelxe_wrk_mtz() + " mtz\n" +\
                "read " + self.shelxe_tmp_mtz1() + " mtz\n" +\
                "CALC F COL FWT  = COL ShelxE.F COL ShelxE.FOM *\n" +\
                "CALC P COL PHWT = COL ShelxE.PHI 0 +\n" +\
                "write " + mtzout + " mtz\n" +\
                "EXIT\n" +\
                "YES\n"
            )
            self.close_stdin()

            self.runApp ( "sftools",[],logType="Service" )

            #fnames = self.calcCCP4Maps ( mtzout,self.outputFName,"shelxe" )

            structure = None
            if os.path.isfile(self.shelxe_wrk_pdb()):
                # copy pdb
                pdbout = self.getXYZOFName()
                os.rename ( self.shelxe_wrk_pdb(),pdbout )
                structure = self.registerStructure (
                                None,
                                pdbout,
                                None,
                                mtzout,
                                leadKey    = 2,
                                copy_files = True,
                                map_labels = "FWT,PHWT",
                                refiner    = "" 
                            )

            elif istruct.hasXYZSubtype():
                structure = self.registerStructure1 (
                                self.outputFName,
                                None,
                                istruct.getPDBFilePath(self.inputDir()),
                                None,
                                mtzout,
                                leadKey    = 2,
                                map_labels = "FWT,PHWT",
                                refiner    = istruct.refiner 
                            )

            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations ( istruct )
                structure.copyLabels       ( istruct )
                structure.setShelxELabels  ( istruct )
                #structure.copySubtype      ( istruct )
                structure.mergeSubtypes    ( istruct,exclude_types=[
                  dtype_template.subtypeXYZ(),
                  dtype_template.subtypeSubstructure(),
                  dtype_template.subtypeAnomSubstr()
                ])
                self.putStructureWidget   ( "structure_btn",
                                            "Structure and electron density",
                                            structure )
                # update structure revision
                revision.setStructureData ( structure )

            substructure = None
            if istruct.hasSubSubtype():
                substructure = self.registerStructure1 ( ###
                                    self.outputFName,
                                    None,
                                    None,
                                    istruct.getSubFilePath(self.inputDir()),
                                    mtzout,
                                    leadKey    = 2,
                                    map_labels = "FWT,PHWT",
                                    refiner    = istruct.refiner
                                )
                if substructure:
                    substructure.copy_refkeys_parameters ( istruct )
                    substructure.copyAssociations ( istruct )
                    substructure.copyLabels       ( istruct )
                    substructure.setShelxELabels  ( istruct )
                    #substructure.copySubtype      ( istruct )
                    substructure.mergeSubtypes    ( istruct,exclude_types=[
                      dtype_template.subtypeXYZ(),
                      dtype_template.subtypeSubstructure(),
                      dtype_template.subtypeAnomSubstr()
                    ])
                    self.putStructureWidget   ( "substructure_btn",
                                                "Heavy-atom substructure and electron density",
                                                substructure )
                    revision.setStructureData ( substructure )

            if structure or substructure:
                self.registerRevision     ( revision  )
                have_results = True

        else:
            self.putTitle ( "No Solution Found" )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ShelxEMR ( "",os.path.basename(__file__) )
    drv.start()
