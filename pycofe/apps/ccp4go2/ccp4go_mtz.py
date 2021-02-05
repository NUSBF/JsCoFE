##!/usr/bin/python

#
# ============================================================================
#
#    02.02.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4go Combined Auto-Solver Prepare MTZ class
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev, Oleg Kovalevskiy 2017-2021
#
# ============================================================================
#

import os

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers
#from   ccp4mg import mmdb2
import gemmi
import sys

import mtz
import datred_utils

import ccp4go_base

# ============================================================================

class PrepareMTZ(ccp4go_base.Base):

    def symm_det     (self):  return "symm_det_table"

    def set_parent_branch_id(self, parent_branch_id):
        self.parent_branch_id = parent_branch_id

    # ----------------------------------------------------------------------

    def prepare_mtz ( self ):
        # key result - initialise these variables
        # self.currentData.hkl - mtz.mtz_dataset object with loads of useful info on MTZ from self.mtzpath
        # self.currentData.mtzpath - path to the merged MTZ file

        self.branch_data = None

        # create work directory for data reduction stage; even if data reduction
        # is not required, this directory may be used for reindexing reflection
        # data in other parts of CCP4go.
        #sdir = os.path.join ( self.currentData.startingParameters.workdir,self.datared_dir() )
        if not os.path.isdir(self.datared_dir()):
            os.mkdir ( self.datared_dir() )

        mtzFile = mtz.mtz_file ( self.currentData.startingParameters.hklpath, None ) # reading MTZ for analysis
        if len(mtzFile) <= 0:
            self.stderr ( " *** MTZ file is empty -- stop.\n" )
            self.output_meta["error"] = "[02-003] MTZ file empty"
            self.write_meta()
            return

        self.input_hkl = mtzFile[0]
        self.stdout("\nAnalysing input MTZ file... ")
        if mtzFile.is_merged():
            # key result:
            self.currentData.hkl     = self.input_hkl # mtz.mtz_dataset object with loads of useful info on MTZ from self.mtzpath
            self.currentData.mtzpath = self.currentData.startingParameters.hklpath # path to the merged MTZ file
            self.stdout ( " reflections are merged; nothing to do\n\n" )
            self.flush()
            return

        # reflections should be merged
        self.stdout(" unmerged data\n\n")
        self.flush()

        self.putWaitMessageLF ( "<b>" + str(self.stage_no+1) +
                                ". Scaling and Merging (Pointless, Aimless)</b>" )
        self.page_cursor[1] -= 1

        # starting new branch to run processing pipelines
        self.branch_data = self.start_branch ( "Scaling and Merging",
                                "CCP4go Automated Structure Solver: Scaling and Merging",
                                self.datared_dir(), self.parent_branch_id )

        self.stdout("Running scaling and merging... ", mainLog=True)
        self.flush()
        mergedMTZFileName = self.mergeMTZ(self.currentData.startingParameters.hklpath, mtzFile)
        if not os.path.isfile(mergedMTZFileName):
            self.stderr('\n\nMerging failed; terminating\n\n', mainLog=True)
            self.write_meta()
            return
        else:
            self.stdout("merged succesfully\n", mainLog=True)

        self.stdout("Generating Rfree... ", mainLog=True)
        self.flush()
        rFreeMTZFileName = self.addRfree(mergedMTZFileName)
        if not os.path.isfile(rFreeMTZFileName):
            self.stderr('\n\nAddition of Rfree failed; terminating\n\n', mainLog=True)
            self.write_meta()
            return
        else:
            self.stdout("generated succesfully\n", mainLog=True)

        self.putMessage ( "<h3>5. Data analysis</h3>" )
        self.stdout("Truncating merged file... ", mainLog=True)
        self.flush()
        merged_mtz = self.ctruncate(rFreeMTZFileName)
        if not os.path.isfile(merged_mtz):
            self.stderr('\n\nRunning ctruncate failed; terminating\n\n', mainLog=True)
            self.write_meta()
            return
        else:
            self.stdout("finished succesfully\n", mainLog=True)
            self.flush()

        # get merged file metadata
        mtzFile = mtz.mtz_file (merged_mtz, None)
        if len(mtzFile)<=0:
            self.stderr ( " *** merged reflection file is empty -- stop.\n", mainLog=True)
            self.output_meta["error"] = "[02-008] truncated hkl file empty"
            self.write_meta()
            self.end_branch ( self.branch_data,self.datared_dir(),
                              "Data Scaling and Merging failed",
                              "empty merged file" )
            return

        # Key result:
        self.currentData.hkl = mtzFile[0] # mtz.mtz_dataset object with loads of useful info on MTZ from self.mtzpath
        self.currentData.mtzpath = merged_mtz # path to the merged MTZ file

        self.stdout ("\nMerged MTZ file created\n\n", mainLog=True)
        self.putMessage ( "<h3>Success</h3>" )
        self.flush()

        pyrvapi.rvapi_add_data ( "merged_data_widget_id","Merged reflections",
                                 # always relative to job_dir from job_dir/html
                                 "/".join(["..",self.currentData.mtzpath]),"hkl:hkl",
                                 self.page_cursor[0],self.page_cursor[1],
                                 0,1,1,-1 )
        self.addCitation ( 'viewhkl' )

        meta = {}
        meta["nResults"] = 1
        meta["mtz"]      = self.currentData.mtzpath
        meta["merged"]   = True
        meta["spg"]      = self.currentData.hkl.HM
        self.output_meta["results"][self.datared_dir()] = meta

        self.quit_branch ( self.branch_data, self.datared_dir(),
                           "Refection data scaled and merged (Pointless, " +
                           "Aimless), <i>SpG=" + meta["spg"] + "</i>" )

        #return  self.branch_data["pageId"]
        return


    # ----------------------------------------------------------------------


    def mergeMTZ(self, unmergedMTZfileName, mtzFile):
        # mtzFile is mtz.mtz_file
        joined_mtz = os.path.join(self.datared_dir(), "joined_tmp.mtz")
        junk_mtz = os.path.join(self.datared_dir(), "junk.mtz")
        pointless_mtz = os.path.join(self.datared_dir(), "pointless.mtz")
        junk_xml = os.path.join(self.datared_dir(), "junk.xml")
        pointless_xml = os.path.join(self.datared_dir(), "pointless.xml")
        aimless_mtz = os.path.join(self.datared_dir(), "aimless.mtz")
        aimless_xml = os.path.join(self.datared_dir(), "aimless.xml")

        # Pointless runs
        self.putMessage ( "<h3>1. Extracting images</h3>" )
        self.open_script  ( "pointless1" )
        #self.write_script ( "NAME PROJECT " + self.input_hkl.PROJECT +\
        #                    " CRYSTAL " + self.input_hkl.CRYSTAL +\
        #                    " DATASET 1\n"  )
        self.write_script ( "NAME PROJECT x CRYSTAL y DATASET z\n"  )
        self.write_script ( "HKLIN " + unmergedMTZfileName + "\n" )
        for i in range(len(mtzFile.BRNG)):
            self.write_script ( "RUN 1 FILE 1 BATCH " + str(mtzFile.BRNG[i][0]) +
                                " to " + str(mtzFile.BRNG[i][1]-1) + "\n" )
        self.write_script ( "LAUEGROUP HKLIN\n"
                            "SPACEGROUP HKLIN\n"
                            "HKLOUT " + joined_mtz + "\n" )
        self.close_script ()
        self.setGenericLogParser ( True )
        self.runApp ( "pointless",[] )

        self.putMessage   ( "<h3>2. Symmetry assignment</h3>" )
        self.open_script  ( "pointless2" )
        self.write_script ( "HKLIN  " + joined_mtz    + "\n"
                            "HKLOUT " + pointless_mtz + "\n"
                            "XMLOUT " + junk_xml      + "\n" )
        self.close_script ()
        self.setGenericLogParser ( True )
        self.runApp ( "pointless",[] )

        self.putMessage   ( "<h3>3. Generating symmetry tables</h3>" )
        self.open_script  ( "pointless3" )
        self.write_script ( "HKLIN  " + pointless_mtz + "\n"
                            "HKLOUT " + junk_mtz      + "\n"
                            "XMLOUT " + pointless_xml + "\n" )
        self.close_script ()
        panel_id = self.setGenericLogParser ( True )
        self.runApp ( "pointless",[] )

        cursor = self.setOutputPage ( [panel_id,3] )
        self.putSection ( self.symm_det(),"Symmetry determination tables",False )
        try:
            table_list = datred_utils.parse_xmlout (pointless_xml)
        except:
            self.stderr(
                "\n\n *** Failed parsing pointless xmlout: possible pointless failure\n\n")
            self.output_meta["error"] = "[02-004] pointless failure"
            self.write_meta()
            self.end_branch ( self.branch_data,self.datared_dir(),
                              "Data Scaling and Merging failed",
                              "pointless failure" )
            return ''

        datred_utils.report ( table_list,self.symm_det() )
        self.setOutputPage ( cursor )

        self.putMessage   ( "<h3>4. Scaling and merging</h3>" )

        self.open_script  ( "aimless" )
        self.write_script ( "XMLOUT " + aimless_xml + "\n"
                            "END\n" )
        self.close_script ()

        self.setGenericLogParser ( True )
        self.runApp ( "aimless",[ "HKLIN" , pointless_mtz,
                                  "HKLOUT", aimless_mtz ] )
        self.unsetLogParser()

        #  checking merged file
        if not os.path.isfile(aimless_mtz):
            self.stderr ( " *** reflection file does not exist -- stop.\n" )
            self.output_meta["error"] = "[02-005] aimless failure"
            self.write_meta()
            self.end_branch ( self.branch_data,self.datared_dir(),
                              "Data Scaling and Merging failed",
                              "aimless failure" )
            return '' # failed

        return aimless_mtz # finished succesfully


    def addRfree(self, aimless_mtz):
        # add free R-flag
        rFreeMTZFileName = os.path.join(self.datared_dir(), "freer.mtz")

        self.open_script  ( "freerflag" )
        self.write_script ( "UNIQUE\n" )
        self.close_script ()
        self.runApp ( "freerflag",[ "HKLIN" , aimless_mtz,
                                    "HKLOUT", rFreeMTZFileName ] )

        #  checking output file
        if not os.path.isfile(rFreeMTZFileName):
            self.stderr ( " *** reflection file does not exist -- stop.\n" )
            self.output_meta["error"] = "[02-006] failed to add free R-flag to merged hkl"
            self.write_meta()
            self.end_branch ( self.branch_data,self.datared_dir(),
                              "Data Scaling and Merging failed",
                              "freerflag failure" )
            return '' # failed

        return rFreeMTZFileName # finished succesfully


    def ctruncate(self, freer_mtz):
        merged_mtz = os.path.join(self.datared_dir(), "merged.mtz")
        ctruncate_xml = os.path.join(self.datared_dir(), "ctruncate.xml")

        # truncate merged file
        mtzFile = mtz.mtz_file(freer_mtz, None)

        cmd = [ "-hklin" , freer_mtz,
                "-hklout", merged_mtz,
                "-colin" ,"/*/*/[IMEAN,SIGIMEAN]" ]
        try:
            Ipm = mtzFile[0].Ipm
            if Ipm:
                cmd += [ "-colano", "/*/*/[" + Ipm.plus.value  + "," +
                                               Ipm.plus.sigma  + "," +
                                               Ipm.minus.value + "," +
                                               Ipm.minus.sigma + "]" ]
        except:
            pass

        cmd += [ "-xmlout", ctruncate_xml, "-freein" ]

        self.setGenericLogParser ( True )
        self.runApp ( "ctruncate", cmd)

        #  checking output file
        if not os.path.isfile(merged_mtz):
            self.stderr ( " *** reflection file does not exist -- stop.\n" )
            self.output_meta["error"] = "[02-007] failed to truncate hkl"
            self.write_meta()
            self.end_branch ( self.branch_data,self.datared_dir(),
                              "Data Scaling and Merging failed",
                              "ctruncate failure" )
            return '' # failed

        return merged_mtz # finished succesfully
