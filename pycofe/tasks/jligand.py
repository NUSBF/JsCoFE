#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    07.11.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  JLIGAND EXECUTABLE MODULE (CLIENT-SIDE TASK)
#
#  Command-line:
#     ccp4-python python.tasks.jligand.py jobManager jobDir jobId expire=timeout_in_days
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir      is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#    expire      is timeout for removing coot backup directories
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  application imports
import basic
from   pycofe.varut   import  signal
try:
    from pycofe.varut import messagebox
except:
    messagebox = None

#from pycofe.proc.coot_link import LinkLists

# ============================================================================
# Make Coot driver

class JLigand(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare coot job

        #self.putMessage ( "<h3><i>Make sure that you save your work from Coot " +\
        #                  "<u>without changing directory and file name offered</u></i></h3>" )
        #self.flush

        # fetch input data
        libin    = None
        istruct  = None
        revision = self.makeClass ( self.input_data.data.revision[0] )
        if revision.Structure:
            istruct = self.makeClass ( revision.Structure )
            libin   = istruct.getLibFilePath ( self.inputDir() )

        cifout = self.getCIFOFName()

        # make command line arguments
        args = ["-out",cifout]
        if libin:
            args.append ( libin )

        rc = self.runApp ( "jligand",args,logType="Main",quitOnError=False )

        summary_line = " this goes on task line in project tree"
        have_results = False

        if os.path.isfile(cifout):

            if istruct:
                struct = self.registerStructure (
                            istruct.getXYZFilePath(self.inputDir()),
                            istruct.getSubFilePath(self.inputDir()),
                            istruct.getMTZFilePath(self.inputDir()),
                            None,None,libPath=cifout,leadKey=istruct.leadKey,
                            refiner=istruct.refiner )

            if struct:
                struct.copyAssociations ( istruct )
                struct.copySubtype      ( istruct )
                struct.copyLabels       ( istruct )
                #struct.copyLigands      ( istruct )
                #struct.setLigands       ( ligList )

                # create output data widget in the report page
                self.putTitle ( "Output Structure" )
                self.putStructureWidget ( "structure_btn","Output Structure",struct )

                # update structure revision
                revision.setStructureData ( struct )
                #if ligand:
                #    revision.addLigandData ( ligand      )
                #if ligand_coot:
                #    revision.addLigandData ( ligand_coot )
                self.registerRevision ( revision )
                have_results = True
                summary_line = "ligands generated"

        self.generic_parser_summary["jligand"] = {
            "summary_line" : summary_line
        }

        if rc.msg == "":
            self.success ( have_results )
        else:
            self.file_stdout.close()
            self.file_stderr.close()
            if messagebox:
                messagebox.displayMessage ( "Failed to launch",
                    "<b>Failed to launch jLigand: <i>" + rc.msg + "</i></b>"
                    "<p>This may indicate a problem with software setup." )

            raise signal.JobFailure ( rc.msg )

        return


# ============================================================================

if __name__ == "__main__":

    drv = JLigand ( "",os.path.basename(__file__) )
    drv.start()
