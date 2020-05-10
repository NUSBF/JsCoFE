#!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    09.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ACORN EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python acorn.py jobManager jobDir jobId [queueName [nSubJobs]]
#
#  where:
#    jobManager    is either SHELL or SGE
#    jobDir     is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    jobId      is job id assigned by jsCoFE (normally an integer but should
#               be treated as a string with no assumptions)
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil
#import json

#  ccp4-python imports
#import pyrvapi

#  application imports
from . import basic
#from   pycofe.proc  import xyzmeta


# ============================================================================
# Make Acorn driver

class Acorn(basic.TaskDriver):

    def acorn_report(self):  return "acorn_report"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare acorn job

        # fetch input data
        idata   = self.input_data.data
        sec1    = self.task.parameters.sec1.contains
        sec2    = self.task.parameters.sec2.contains
        sec3    = self.task.parameters.sec3.contains
        sec4    = self.task.parameters.sec4.contains

        hkl     = self.makeClass ( idata.hkl[0]     )
        istruct = self.makeClass ( idata.istruct[0] )

        cols    = hkl.getMeanF()
        if cols[2]!="F":
            self.fail ( "<h3>No amplitude data.</h3>" +\
                    "This task requires F/sigF columns in reflection data, " +\
                    "which were not found.",
                    "No amplitude data." )
            return

        self.addCitations ( ["acorn"] )  # to make acorn first in the list

        resol = hkl.getHighResolution()
        if self.getParameter(sec1.EXTEND_RESOLUTION_CBX)=="True":
            resol = self.getParameter ( sec1.EXTRES )

        self.open_stdin()
        self.write_stdin ([
            "cell "       + hkl.getCellParameters_str(),
            "symmetry \"" + hkl.getSpaceGroup() + "\"",
            "resolution " + resol,
            "labout F=F_unique SIGF=SIGF_unique"
        ])
        self.close_stdin()
        self.runApp ( "unique",["HKLOUT","__tmp1.mtz"],logType="Service" )

        self.open_stdin()
        self.write_stdin ([
            "LABIN  FILE 1 E1=F_unique E2=SIGF_unique",
            "LABIN  FILE 2 E1=" + cols[0] + " E2=" + cols[1] + " E3=" + hkl.getFreeRColumn()
        ])
        cmd = [ "HKLIN1","__tmp1.mtz",
                "HKLIN2",hkl.getHKLFilePath(self.inputDir()),
                "HKLOUT","__tmp2.mtz"]
        if istruct.initPhaseSel=="phases":
            self.write_stdin ([
                "LABIN  FILE 3 E1=" + istruct.PHI + " E2=" + istruct.FOM,
                "LABOUT FILE 3 E1=PHIN E2=FOMIN"
            ])
            cmd += ["HKLIN3",istruct.getMTZFilePath(self.inputDir())]
        self.close_stdin()
        self.runApp ( "cad",cmd,logType="Service" )

        self.open_stdin()
        labin = "LABIN  FILE 1 E1=" + cols[0] + " E2=" + cols[1] + " E3=" + hkl.getFreeRColumn()
        if istruct.initPhaseSel=="phases":
            labin += " E4=PHIN E5=FOMIN"
        self.write_stdin ([labin])
        self.close_stdin()
        self.runApp ( "cad",["HKLIN1","__tmp2.mtz","HKLOUT","__tmp3.mtz"],logType="Service" )

        labf = [cols[0],cols[1]]
        labe = ["E","SIGE"]
        ecalc_hkl = "__tmp3.mtz"
        if self.getParameter(sec1.ANISOTROPY_CORRECTION_CBX)=="True":
            self.open_stdin()
            self.write_stdin ([
                "MODE  MR_ANO",
                "HKLIN __tmp3.mtz",
                "LABIN FP=" + cols[0] + " SIGFP=" + cols[1],
                "ROOT  __tmp4"
            ])
            self.close_stdin()
            self.runApp ( "phaser",[],logType="Service" )
            labf = [cols[0]+"_ISO",cols[1]+"_ISO"]
            labe = ["E_ISO","SIGE_ISO"]
            ecalc_hkl = "__tmp4.mtz"


        # Prepare report parser
        self.setGenericLogParser ( self.acorn_report(),True )

        self.open_stdin()
        self.write_stdin ([
            "labin  FP=" + labf[0] + " SIGFP=" + labf[1],
            "labout FECALC=F_ECALC E=" + labe[0] + " SIGE=" + labe[1]
        ])
        self.close_stdin()
        self.runApp ( "ecalc",["HKLIN" ,ecalc_hkl,
                               "HKLOUT","__tmp5.mtz"],logType="Service" )

        #  prepare Acorn run

        labin = "labin  FP=" + labf[0] + " SIGFP=" + labf[1] + " E=" + labe[0]
        posi  = ""
        cmd   = ["HKLIN" ,"__tmp5.mtz","HKLOUT","__tmp6.mtz"]
        if istruct.initPhaseSel=="phases":
            labin += " PHIN=PHIN WTIN=FOMIN"
        else:
            posi = "POSI 1"
            if istruct.initPhaseSel=="xyz":
                cmd += ["XYZIN",istruct.getXYZFilePath(self.inputDir())]
            else:
                cmd += ["XYZIN",istruct.getSubFilePath(self.inputDir())]

        keylist = [
            labin,
            "labout PHIOUT=acorn.PHI WTOUT=acorn.FOM",
            posi
        ]

        # parameters from sec1

        if self.getParameter(sec1.EXTEND_RESOLUTION_CBX)=="True":
            keylist += ["EXTEND"]

        # parameters from sec2

        if self.getParameter(sec2.TRIALS_SEL)=="P":
            keylist += ["NTRY " + self.getParameter(sec2.NTRIALS)]
        else:
            ntrials = 11
            for i in range(2,11):
                if self.getParameter(getattr(sec2,"DDMTRIAL" + str(i) + "_CBX"))=="False":
                    ntrials = i
                    break
            keylist += ["NTRY " + str(ntrials-1)]
            ncddm    = "NCDDM "
            ddmk     = "DDMK  "
            enhhs    = "ENHS  "
            ncser    = "NCSER "
            for i in range(1,ntrials):
                ncddm += " " + str(self.getParameter(getattr(sec2,"NCYCLES" + str(i))))
                ddmk  += " " + str(self.getParameter(getattr(sec2,"DDMTYPE" + str(i) + "_SEL")))
                enh = str(self.getParameter(getattr(sec2,"ENHREF" + str(i) + "_SEL")))
                if enh=="N":
                    enhhs += " 0"
                    ncser += " 0"
                elif enh=="E":
                    enhhs += " 1"
                    ncser += " 0"
                else:
                    enhhs += " 0"
                    ncser += " 2"
            keylist += [ncddm,enhhs,ncser]
            if self.getParameter(sec2.TRIALS_SEL)=="D":
                keylist += [ddmk]

        keylist += ["PSFIN " + self.getParameter(sec2.MINPHASESHIFT),
                    "CCFIN " + self.getParameter(sec2.MAXCORR)]

        # parameters from sec3

        if self.getParameter(sec3.RESOLUTION_RANGE_CBX)=="True":
            keylist += ["RESO " + self.getParameter(sec3.RESMIN) + " " + self.getParameter(sec3.RESMAX)]

        if self.getParameter(sec3.EXCLUDE_LOW_SIGFP_CBX)=="True":
            keylist += ["EXCL " + self.getParameter(sec3.MINSIGFP)]

        if self.getParameter(sec3.EXCLUDE_HIGH_EVALUE_CBX)=="True":
            keylist += ["ECUT " + self.getParameter(sec3.MAXEVALUE)]

        # parameters from sec4

        if self.getParameter(sec4.PATTERSON_SUP_FINCTION_CBX)=="True":
            keylist += ["SUPP 1"]
        else:
            keylist += ["SUPP 0"]

        keylist += ["CUTDDM " + self.getParameter(sec4.DDM_DENSITY_LIMIT)]

        if self.getParameter(sec4.CUSTOM_GRID_SIZE_CBX)=="True":
            keylist += ["GRID " + self.getParameter(sec4.GRIDSIZE)]


        # write the keyword file
        self.open_stdin()
        self.write_stdin ( keylist )
        self.write_stdin ( "END\n" )
        self.close_stdin()

        # run acorn
        self.runApp ( "acorn",cmd,logType="Main" )
        # close report parser
        self.unsetLogParser()

        # check solution and register data

        have_results = False

        if os.path.isfile("__tmp6.mtz"):

            # calculate maps for UglyMol using final mtz from temporary location

            if self.getParameter(sec1.EXTEND_RESOLUTION_CBX)=="True":

                self.putTitle ( "Sharpened Map" )

                # Calculate extended map coefficients
                acorn_map = self.getOFName ( ".map.mtz" )
                self.open_stdin  ()
                self.write_stdin (
                    "mode batch\n" +\
                    "read __tmp6.mtz mtz\n" +\
                    "CALC F COL acorn.EO.FWT = COL EOEXT COL acorn.FOM *\n" +\
                    "CALC F COL acorn.EC.FWT = COL ECOUT COL acorn.FOM *\n" +\
                    "write " + acorn_map + " mtz\n" +\
                    "EXIT\n" +\
                    "YES\n"
                )
                self.close_stdin()
                self.runApp ( "sftools",[],logType="Service" )

                #fnames = self.calcCCP4Maps ( acorn_map,self.outputFName+".map","acorn-map" )

                # register output data from temporary location (files will be moved
                # to output directory by the registration procedure)

                acorn_xyz = None
                acorn_sub = None
                if istruct.getXYZFileName():
                    acorn_xyz = self.getXYZOFName()
                    shutil.copyfile ( istruct.getXYZFilePath(self.inputDir()),acorn_xyz )
                if istruct.getSubFileName():
                    acorn_sub = self.getOFName ( ".ha.pdb" )
                    shutil.copyfile ( istruct.getSubFilePath(self.inputDir()),acorn_sub )

                #structure = self.registerStructure (
                #        acorn_xyz,acorn_sub,acorn_map,fnames[0],fnames[1],None,
                #        leadKey=2,copy_files=True )

                structure = self.registerStructure (
                        acorn_xyz,acorn_sub,acorn_map,None,None,None,
                        leadKey=2,copy_files=True,
                        map_labels="acorn.EO.FWT,acorn.PHI,acorn.EC.FWT,acorn.PHI" )

                #    def registerStructure ( self,xyzPath,subPath,mtzPath,mapPath,dmapPath,
                #                            libPath=None,leadKey=1,copy_files=False,map_labels=None ):


                self.putStructureWidget ( "sharpened_map","Sharpened Map",structure )


            self.putTitle ( "Modified Density Map" )

            # Calculate output map coefficients
            output_file = self.getMTZOFName()
            self.open_stdin  ()
            self.write_stdin (
                "mode batch\n" +\
                "read __tmp6.mtz mtz\n" +\
                "SELECT resol > " + hkl.getHighResolution() + "\n" +\
                "CALC F COL acorn.FWT = COL F COL acorn.FOM *\n" +\
                "write " + output_file + " mtz\n" +\
                "EXIT\n" +\
                "YES\n"
            )
            self.close_stdin()
            self.runApp ( "sftools",[],logType="Service" )

            #fnames = self.calcCCP4Maps ( output_file,self.outputFName,
            #                             "acorn:" + cols[0] )

            #structure = self.registerStructure (
            #        acorn_xyz,acorn_sub,output_file,fnames[0],None,None,
            #        leadKey=2 )

            structure = self.registerStructure (
                    acorn_xyz,acorn_sub,output_file,None,None,None,
                    leadKey=2,map_labels=cols[0] + ",acorn.PHI" )


            if structure:
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.setAcornLabels   ()
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


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Acorn ( "",os.path.basename(__file__) )
    drv.start()
