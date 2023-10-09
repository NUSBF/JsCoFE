#!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    25.07.23   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi
from gemmi import cif

#  application imports
from  pycofe.tasks  import basic
from  pycofe.varut  import signal
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
        flock    = None
        istruct  = None
        lib_list = []
        if 'revision' in vars(self.input_data.data):
            revision = self.makeClass ( self.input_data.data.revision[0] )
            if revision.Structure:
                istruct = self.makeClass ( revision.Structure )
                libin   = istruct.getLibFilePath ( self.inputDir() )
                if libin and os.path.isfile(libin):
                    lib_list.append(libin)
                    # count ligands and links in lib and coords for revision inspector
                    flock = "lig_content.txt"
                    self.countLigandsAndLinks(istruct, flock)
                    if not os.path.isfile(flock):
                        flock = None

        if 'ligand' in vars(self.input_data.data):
            for l in self.input_data.data.ligand:
                if 'files' in vars(l) and 'lib' in vars(l.files):
                    fname = os.path.join(self.inputDir(), l.files.lib)
                    if os.path.isfile(fname):
                        lib_list.append(fname)

        cifout = self.getCIFOFName()

        # make command line arguments
        args = ["-out",cifout]
        if flock:
            args += ["-lock", flock]
        if lib_list:
            args += lib_list

        rc = self.runApp ( "jligand",args,logType="Main",quitOnError=False )

        summary_line = " no output"
        have_results = False

        if os.path.isfile(cifout):
 
            comp_id = link_id = None
            if os.path.isfile(cifout):
                doc = cif.read(cifout)
                comp_id = []
                if "comp_list" in doc:
                    vv = doc["comp_list"].find_values("_chem_comp.id")
                    if vv:
                        for v in vv:
                            if "comp_" + v in doc:
                                comp_id.append(str(v))
                            else:
                                comp_id = None
                                break
                link_id = []
                if "link_list" in doc:
                    vv = doc["link_list"].find_values("_chem_link.id")
                    if vv:
                        for v in vv:
                            if "link_" + v in doc:
                                link_id.append(str(v))
                            else:
                                link_id = None
                                break
            if comp_id is None or link_id is None or not (comp_id or link_id):
                self.stdout ( "No valid output" )

            elif not istruct and len(comp_id)==1 and len(link_id)==0:
                pdbout = os.path.splitext(cifout)[0] + ".pdb"
                code = comp_id[0]
                args = ["convert", "--from=mmcif", cifout, pdbout]
                self.runApp("gemmi", args, logType="Main", quitOnError=True)
                ligand = self.finaliseLigand ( code,pdbout,cifout )
                if ligand:
                    have_results = True
                    summary_line = "library with ligand " + code

            else:
                library = self.registerLibrary ( cifout,copy_files=False )
                if library:
                    ins = " Revision" if istruct else ""
                    self.putTitle ( "Output" + ins + " Library" )
                    library.codes = comp_id
                    links = link_id

                    have_results = True
                    summary_line = ("revision " if istruct else "") + "library with "
                    ncomp = len(comp_id)
                    if ncomp:
                        summary_line += str(ncomp) + " ligand"
                        if ncomp > 1:
                            summary_line += "s"
                        if link_id:
                            summary_line += " and "
                    nlink = len(link_id)
                    if nlink:
                        summary_line += str(nlink) + " link"
                        if nlink > 1:
                            summary_line += "s"

                    vspace = "<font size='+2'><sub>&nbsp;</sub></font>"
                    self.putMessage1(
                        self.report_page_id(),
                        "<b>Assigned name:</b>&nbsp;" +
                            library.dname + vspace,
                        self.rvrow)
                    self.rvrow += 1

                    if comp_id:
                        ending = "s" if len(comp_id) > 1 else ""
                        self.putMessage1(
                            self.report_page_id(),
                            "<b>Ligand" + ending + ":</b>&nbsp;" +
                                ", ".join(comp_id) + vspace,
                            self.rvrow)
                        self.rvrow += 1

                    if link_id:
                        ending = "s" if len(link_id) > 1 else ""
                        self.putMessage1(
                            self.report_page_id(),
                            "<b>Link" + ending + ":</b>&nbsp;" +
                                ", ".join(link_id) + vspace,
                            self.rvrow)
                        self.rvrow += 1

                    cifreg = '/'.join([self.outputDir(), library.getLibFileName()])
                    pdbreg = os.path.splitext(cifreg)[0] + ".pdb"
                    args = ["convert", "--from=mmcif", cifreg, pdbreg]
                    self.runApp("gemmi", args, logType="Main", quitOnError=True)

                    colSpan = 1
                    openState = -1
                    pyrvapi.rvapi_add_data(
                        "_lib_wgt_",
                        "",
                        "/".join(["..", pdbreg]),
                        "xyz",
                        self.report_page_id(),
                        self.rvrow, 0, 1, colSpan, openState)
                    pyrvapi.rvapi_append_to_data(
                        "_lib_wgt_",
                        "/".join(["..", cifreg]),
                        "LIB")
                    self.rvrow += 1

            struct = None
            if istruct:
                struct = self.registerStructure (
                            istruct.getXYZFilePath(self.inputDir()),
                            istruct.getSubFilePath(self.inputDir()),
                            istruct.getMTZFilePath(self.inputDir()),
                            None,None,libPath=cifout,leadKey=istruct.leadKey,
                            refiner=istruct.refiner )

            if struct:
                struct.copy_refkeys_parameters ( istruct )
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

                # count ligands and links in lib and coords for revision inspector
                self.countLigandsAndLinks(struct)

                have_results = True

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

