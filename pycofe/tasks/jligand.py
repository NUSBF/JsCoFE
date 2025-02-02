#!/usr/bin/python

#
# ============================================================================
#
#    02.02.25   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
#
# ============================================================================
#

#  python native imports
import os
import sys
import shutil

#  ccp4-python imports
import pyrvapi

import gemmi

#  application imports
from  pycofe.tasks  import basic
from  pycofe.varut  import signal
from  pycofe.proc   import covlinks
try:
    from pycofe.varut import messagebox
except:
    messagebox = None

# ============================================================================


class JLigand(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):
        lockfl_1 = "_str_ligands.txt"
        lockfl = None
        xyzfl_2 = "jligand2.mmcif"
        xyzfl = None
        libin = None
        istruct = None
        if 'revision' in vars(self.input_data.data):
            revision = self.makeClass ( self.input_data.data.revision[0] )
            if revision.Structure:
                istruct = self.makeClass ( revision.Structure )
                libin = istruct.getLibFilePath ( self.inputDir() )
                xyzfl = istruct.getMMCIFFilePath ( self.inputDir() )
                if not (libin and os.path.isfile(libin)):
                    libin = None
                if not (xyzfl and os.path.isfile(xyzfl)):
                    xyzfl = None
                if libin and xyzfl:
                    cl = covlinks.CovLinks(libin, xyzfl)
                    cl.prep_lists()
                    cl.usage(lockfl_1)
                    if os.path.isfile(lockfl_1):
                        lockfl = lockfl_1

        lib_list = []
        if 'ligand' in vars(self.input_data.data):
            for l in self.input_data.data.ligand:
                if 'files' in vars(l) and 'lib' in vars(l.files):
                    fname = os.path.join(self.inputDir(), l.files.lib)
                    if os.path.isfile(fname):
                        lib_list.append(fname)

        cifout = self.getCIFOFName()

        # make command line arguments
        args = ["-out", cifout]
#       args += ["-v_print"]
        if lockfl:
            args += ["-lock", lockfl]
        if libin and os.path.isfile(libin):
            args += [libin]
#       elif lib_list:
        else:
            args += ["-"]
        if lib_list:
            args += lib_list

        """
        if libin and lib_list:
            self.putMessage(
                '''<p>The library from the input rvision will appear in Tab 1.\n
                and the finalised ligands and links from Tab 1 will be saved in
                the library of the output revision. The contents of other tabs
                and the drafts from Tab 1 will not be saved.</p>''')
        elif libin:
            self.putMessage(
                '''<p>The library from the input rvision will appear in Tab 1.\n
                and the finalised ligands and links from Tab 1 will be saved in
                the library of the output revision. The contents of other tabs
                and the drafts from Tab 1 will not be saved.</p>''')
        elif lib_list:
            self.putMessage(
                '''<p>The library from the input rvision will appear in Tab 1.\n
                and the finalised ligands and links from Tab 1 will be saved in
                the library of the output revision. The contents of other tabs
                and the drafts from Tab 1 will not be saved.</p>''')
        else:
            self.putMessage(
                '''<p>The library from the input rvision will appear in Tab 1.\n
                and the finalised ligands and links from Tab 1 will be saved in
                the library of the output revision. The contents of other tabs
                and the drafts from Tab 1 will not be saved.</p>''')
        self.flush
        """

        self.file_stdin = None
        jligand_cmd = "jligand.bat" if sys.platform == 'win32' else "jligand"
        rc = self.runApp ( jligand_cmd,args,logType="Main",quitOnError=False )

        summary_line = " no output"
        have_results = False

        if os.path.isfile(cifout):
 
            comp_id = link_id = None
            if os.path.isfile(cifout):
                doc = gemmi.cif.read(cifout)
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

            struct = None
            cifreg = None
            have_results = False

            colSpan = 1
#           openState = -1
#           openState = 0
            openState = 1

            if comp_id is None or link_id is None or not (comp_id or link_id):
                self.stdout ( "No valid output" )
                istruct = None

            elif len(comp_id)==1 and len(link_id)==0 and not istruct:
                pdbout = os.path.splitext(cifout)[0] + ".pdb"
                code = comp_id[0]
                args = ["convert", "--from=mmcif", cifout, pdbout]
                self.runApp("gemmi", args, logType="Main", quitOnError=True)
                ligand = self.finaliseLigand ( code,pdbout,None,cifout )
                del pdbout
                if ligand:
                    cifreg = os.path.join(self.outputDir(), ligand.getLibFileName())
                    have_results = True

                    summary_line = "library with ligand " + code

            else:
                library = self.registerLibrary ( cifout,copy_files=False )
                if library:
                    cifreg = os.path.join(self.outputDir(), library.getLibFileName())
                    have_results = True

                    library.codes = comp_id

                    self.putTitle ( "Output Library" )

                    summary_line = ("revision " if struct else "") + "library with "
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
                        "<b>Assigned name:</b>&nbsp;" + library.dname + vspace,
                        self.rvrow)
                    self.rvrow += 1

                    pyrvapi.rvapi_add_data(
                        "_lib_wgt_",
                        "Library of Ligands and Links",
                        os.path.join("..", cifreg),
                        "LIB",
                        self.report_page_id(),
                        self.rvrow, 0, 1, colSpan, openState)
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

            if istruct and have_results and cifreg:
                cl = None
                msg_llist = None
                if xyzfl:
                    cl = covlinks.CovLinks(cifreg, xyzfl)
                    msg_llist = cl.suggest_changes()
                    cl.update(mode = 1, xyzout = xyzfl_2)
                    if os.path.isfile(xyzfl_2):
                        xyzfl = xyzfl_2

                struct = self.registerStructure ( xyzfl,None,
                            istruct.getSubFilePath(self.inputDir()),
                            istruct.getMTZFilePath(self.inputDir()),
                            libPath=cifreg,
                            leadKey=istruct.leadKey,
                            refiner=istruct.refiner )

                if struct:
                    assert cifreg == struct.getLibFilePath(self.outputDir())

                    struct.copy_refkeys_parameters ( istruct )
                    struct.copyAssociations ( istruct )
                    struct.copySubtype      ( istruct )
                    struct.copyLabels       ( istruct )
                    if cl:
                        cl.prep_lists()
                        counts = dict(cl.counts(self.file_stdout))
                        struct.ligands     = counts['comps_usr']
                        struct.refmacLinks = counts['links_usr']
                        struct.links       = counts['links_std'] + counts['links_unk']

                    msg_list = cl.ambiguous_links()
                    if msg_list:
                        self.putMessage1(
                            self.report_page_id(), "",
                            self.rvrow)
                        self.rvrow += 1
                        self.putMessage1(
                            self.report_page_id(), "",
                            self.rvrow)
                        self.rvrow += 1
                        msg_list.insert(0,
                            "<b>WARNING: multiple definitions:</b>")
                        self.putMessage1(
                            self.report_page_id(),
                            '<br>'.join(msg_list) + vspace,
                            self.rvrow)
                        self.rvrow += 1

                    if msg_llist:
                        msg_list = msg_llist[0] + msg_llist[1]
                    if msg_list:
                        self.putMessage1(
                            self.report_page_id(), "",
                            self.rvrow)
                        self.rvrow += 1
                        self.putMessage1(
                            self.report_page_id(), "",
                            self.rvrow)
                        self.rvrow += 1
                        ending = "s" if len(msg_list) > 1 else ""
                        msg_list.insert(0,
                            "<b>Added LINKR record" +
                            ending + ":</b>")
                        self.putMessage1(
                            self.report_page_id(),
                            '<br>'.join(msg_list) + vspace,
                            self.rvrow)
                        self.rvrow += 1

                    self.putMessage1(
                        self.report_page_id(),
                        '''<i><b>N.B.</b></i>This library is a part of the revision corresponding to
                        the current job. The revision will be selected automatically in the subsequent
                        Coot job, while this library will not be exposed explicitly in any of the input
                        menus. After <i><b>Coot</b></i> starts, ligands will be available through
                        <i><b>File &gt; Get Monomer</b></i>. To apply links: <i><b>Refmac</b></i> with
                        <i><b>Restraints &gt; Covalent/metal link identification = Yes</b></i>. To see
                        the library contents in subsequent jobs: button <i><b>Inspect</b></i> > tab
                        <i><b>Structure</b></i>.''',
                        self.rvrow)
                    self.rvrow += 1

                    show_struct = True # duplicates download of library button
                    if show_struct:
                        # create output data widget in the report page
                        self.putTitle ( "Output Structure" )
                        self.putStructureWidget ( "structure_btn","Output Structure",struct )

                    # update structure revision
                    revision.setStructureData ( struct )
                    self.registerRevision ( revision )

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

