##!/usr/bin/python

#
# ============================================================================
#
#    05.01.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SHELX-SUBSTRUCTURE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python python.tasks.shelxsubstr.py exeType jobDir jobId
#
#  where:
#    exeType  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi
#import pyrvapi_ext.parsers
import gemmi

#  application imports
from pycofe.dtypes import dtype_template, dtype_revision
from pycofe.tasks  import basic


# ============================================================================
# Make ShelxCD driver

class ShelxCD(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def writeParam ( self,key,param ):
        if param:
            self.write_stdin ( [key + " " + param] )
        return

    def writeHKLIN ( self,key,hkl ):
        if hkl.cols[-1]=="F":
            self.write_stdin ( [key + " -f " + hkl.basename + ".hkl"] )
        else:
            self.write_stdin ( [key + " " + hkl.basename + ".hkl"] )
        return


    def run(self):

        # --------------------------------------------------------------------
        # Prepare crank2 input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )
        hkl      = self.input_data.data.hklrev
        native   = None

        if hasattr(self.input_data.data,"hkl"):  # optional data parameter?
            hkl += self.input_data.data.hkl

        sec1 = self.task.parameters.sec1.contains

        # convert dictionaries into real classes; this is necessary because we want
        # to use class's functions and not just access class's data fields;
        # simultaneously, prepare hkl files for shelxc
        hkl0     = None
        dmin     = 10000000.0
        dmax     = -dmin
        for i in range(len(hkl)):
            hkl[i] = self.makeClass ( hkl[i] )
            hkl[i].cols = hkl[i].getAnomalousColumns()
            self.open_stdin()
            if hkl[i].cols[4]!="X":
                dmin = min ( dmin,hkl[i].getHighResolution(True) )
                dmax = max ( dmax,hkl[i].getLowResolution(True) )
                if hkl[i].wtype=="peak" or (hkl[i].wtype=="inflection" and not hkl0):
                    hkl0 = hkl[i]
                if hkl[i].cols[4]=="F":
                    self.write_stdin ([
                        "OUTP shelx",
                        "LABI F(+)=" + hkl[i].cols[0] + " SIGF(+)=" + hkl[i].cols[1] +\
                            " F(-)=" + hkl[i].cols[2] + " SIGF(-)=" + hkl[i].cols[3]
                    ])
                elif hkl[i].cols[4]=="I":
                    self.write_stdin ([
                        "OUTP shelx",
                        "LABI I(+)=" + hkl[i].cols[0] + " SIGI(+)=" + hkl[i].cols[1] +\
                            " I(-)=" + hkl[i].cols[2] + " SIGI(-)=" + hkl[i].cols[3]
                    ])
                self.close_stdin()
                hkl[i].basename = os.path.splitext(hkl[i].getHKLFileName())[0]
                self.runApp ( "mtz2various",[
                    "HKLIN" ,hkl[i].getHKLFilePath(self.inputDir()),
                    "HKLOUT",hkl[i].basename + ".hkl"
                ],logType="Service")

        if hasattr(self.input_data.data,"native"):  # optional data parameter
            native = self.makeClass ( self.input_data.data.native[0] )
            hkl0   = native
            self.open_stdin()
            native.cols = native.getMeanColumns()
            if native.cols[2]!="X":
                if native.cols[2]=="F":
                    self.write_stdin ([
                        "OUTP shelx",
                        "LABI FP=" + native.cols[0] + " SIGFP=" + native.cols[1]
                    ])
                elif native.cols[2]=="I":
                    self.write_stdin ([
                        "OUTP shelx",
                        "LABI I=" + native.cols[0] + " SIGI=" + native.cols[1]
                    ])
                self.close_stdin()
                native.basename = os.path.splitext(native.getHKLFileName())[0]
                self.runApp ( "mtz2various",[
                    "HKLIN" ,native.getHKLFilePath(self.inputDir()),
                    "HKLOUT",native.basename + ".hkl"
                ],logType="Service" )

        if not hkl0:
            hkl0 = hkl[0]

        # Identify the type of experiment

        expType = "SAD"
        if len(hkl) > 1:
            expType = "MAD"
        elif native != None:
            if native.useForPhasing:
                expType = "SIRAS"

        # Prepare data for shelxc and run it

        atomType = self.getParameter ( sec1.SFAC )

        self.open_stdin()
        self.write_stdin ([
            "CELL " + hkl0.getCellParameters_str(),
            "SPAG " + hkl0.getSpaceGroup()
        ])
        if expType=="SIRAS":
            self.writeParam ( "DSCA",self.getParameter(sec1.DSCA) )
        if expType=="MAD":
            self.writeParam ( "ASCA",self.getParameter(sec1.ASCA) )
            if self.getParameter(sec1.SMAD)=="True":
                self.write_stdin ( ["SMAD"] )
        self.writeParam ( "NTRY",self.getParameter(sec1.NTRY) )
        self.writeParam ( "FIND",self.getParameter(sec1.FIND) )
        self.writeParam ( "SFAC",atomType )
        self.writeParam ( "DSUL",self.getParameter(sec1.DSUL) )

        highres = self.getParameter(sec1.HIGHRES)
        lowres  = self.getParameter(sec1.LOWRES)
        if not highres:
            highres = dmin
        if not lowres:
            lowres = dmax
        self.write_stdin ( ["SHEL " + str(highres) + ", " + str(lowres)] )

        mindist = self.getParameter(sec1.MINDIST)
        if not mindist:
            mindist = "1.0"
        mindeq = "-0.1"
        if self.getParameter(sec1.SPECIAL_POSITIONS_CBX)=="True":
            mindeq = self.getParameter(sec1.MINDEQ)
        self.write_stdin ( ["MIND " + mindist + ", " + mindeq] )

        if expType=="SAD":
            self.writeHKLIN ( "SAD",hkl[0] )
        elif expType=="MAD":
            for i in range(len(hkl)):
                if hkl[i].wtype=="peak":
                    self.writeHKLIN ( "PEAK",hkl[i] )
                elif hkl[i].wtype=="inflection":
                    self.writeHKLIN ( "INFL",hkl[i] )
                elif hkl[i].wtype=="low-rempte":
                    self.writeHKLIN ( "LREM",hkl[i] )
                elif hkl[i].wtype=="high-remote":
                    self.writeHKLIN ( "HREM",hkl[i] )
        elif expType=="SIRAS":
            self.writeHKLIN ( "SIRAS",hkl[0] )

        if native:
            self.writeHKLIN ( "NAT",native )

        self.close_stdin()

        stemname = "shelx"
        pdbfile  = stemname + "_fa.pdb"

        self.runApp ( "shelxc",[stemname],logType="Main" )
        self.runApp ( "shelxd",[stemname+"_fa"],logType="Main" )

        # check results
        if os.path.isfile(pdbfile):
            st = gemmi.read_structure(pdbfile)
            for model in st:
                for chain in model:
                    for residue in chain:
                        residue.name = atomType
                        for atom in residue:
                            atom.name    = atomType
                            atom.element = gemmi.Element(atomType)
            st.write_pdb ( pdbfile )

            rvrow0 = self.rvrow
            self.putTitle ( "Substructure Found" )
            structure = self.finaliseStructure ( pdbfile,self.outputFName,
                                                 hkl0,None,[],1,
                                                 leadKey=1,
                                                 openState_bool=False,
                                                 title="" )
            if structure:

                self.putMessage ( "&nbsp;" )

                anom_structure = self.finaliseAnomSubstructure ( pdbfile,
                                            "anom_substructure",hkl0,[],"",False )
                if anom_structure:
                    anom_structure.setAnomSubstrSubtype() # substructure
                    #anom_structure.setHLLabels()
                else:
                    self.putMessage ( "Anomalous substructure calculations failed." )

                # finalise output revision(s)
                # remove Refmac results from structure:
                """
                shutil.copy2 ( hkl0.getHKLFilePath(self.inputDir()),self.outputDir() )
                xyz_file = structure.getSubFileName()
                structure.removeFiles()
                structure.setSubFile ( xyz_file )
                structure.setMTZFile ( hkls.getHKLFileName() )
                structure.removeSubtype ( dtype_template.subtypePhases() )
                super ( ShelxSubstr,self ).finalise ( structure )
                """

                #  Make output revisions

                #  make a list of all used datasets, each one will be used
                #  for making an individual revision; sort the list such that
                #  the most probable revision for taking downstream is on
                #  top of the list
                hkl_all_0  = []
                hkl_all_0 += hkl
                sort_order = ["peak","inflection","native","low-remote","high-remote"]
                if native:
                    native.wtype = "native"
                    hkl_all_0.append ( native )
                    if native.useForPhasing:
                        sort_order = ["native","peak","inflection","low-remote","high-remote"]
                hkl_all = []
                for wtype in sort_order:
                    for i in range(len(hkl_all_0)):
                        if hkl_all_0[i].wtype==wtype:
                            hkl_all.append ( hkl_all_0[i] )
                            break

                if len(hkl_all)==1:
                    self.putTitle ( "Structure Revision" )
                else:
                    self.putTitle ( "Structure Revisions" )

                self.putMessage ( "&nbsp;" )
                if len(hkl_all)>1:
                    self.putMessage (
                        "<b><i>New structure revision name for:<br>&nbsp;</i></b>" )

                gridId = self.getWidgetId ( "revision" )
                pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),
                                         self.rvrow,0,1,1 )
                self.rvrow += 1

                for i in range(len(hkl_all)):

                    # make structure revision
                    ri = dtype_revision.DType ( -1 )
                    ri.copy ( revision )
                    ri.setReflectionData ( hkl_all[i]     )
                    ri.setStructureData  ( structure )

                    if len(hkl_all)==1:
                        ri.makeRevDName  ( self.job_id,i+1,self.outputFName )
                        self.putRevisionWidget ( gridId,i,
                            "<b><i>New structure revision name:</i></b>",ri )
                    else:
                        ri.makeRevDName ( self.job_id,i+1,
                            self.outputFName + " (" + hkl_all[i].wtype + ")" )
                        self.putRevisionWidget ( gridId,i,"<b><i>" +\
                            hkl_all[i].wtype + " dataset:</i></b>",ri )

                    ri.register ( self.outputDataBox )

            else:
                self.rvrow = rvrow0
                self.putTitle ( "Failed to form results" )

        else:
            self.putTitle ( "No Substructure Found" )

        self.flush()

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = ShelxCD ( "",os.path.basename(__file__) )
    drv.start()
