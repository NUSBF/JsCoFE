##!/usr/bin/python

#
# ============================================================================
#
#   21.06.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PDB DEPOSITION FILES PREPARATION EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.pdbdepfiles jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

#  python native imports
import os
import json

#  application imports
from . import basic
from   pycofe.etc    import citations

# ============================================================================
# Make PDBDepFiles driver

class PDBDepFiles(basic.TaskDriver):

    def dep_grid  (self):  return "dep_grid"

    # redefine name of input script file
    def file_stdin_path(self):  return "deposition.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When deposition
        # succeeds, this file is created.
        if os.path.isfile(self.getCIFOFName()):
            os.remove(self.getCIFOFName())

        # Prepare deposition input
        # fetch input data
        revision = self.makeClass ( self.input_data.data.revision[0] )


        # Put download widgets

        self.putMessage ( "<h3><i>PDB Deposition:</i></h3>" )

        self.putMessage ( "<b>a) Download the following 2 files in mmCIF format:<br><hr/>" )

        grid_id = self.getWidgetId ( self.dep_grid() )
        self.putGrid ( grid_id )
        self.putMessage1 ( grid_id,
            "&nbsp;&nbsp;&nbsp;&nbsp;<i>1. Final atomic coordinates:</i>&nbsp;",0,0 )
        self.putDownloadButton ( revision.deposition_cif,"download",grid_id,0,1,
                                 job_id=revision.valJobId )
        if revision.sfCIF_unm:
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;<i>2. Reflection data</i>" ,1,0 )
            self.putMessage1 ( grid_id,
                '<div style="white-space:nowrap">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +\
                '<b><u>either</u></b> <i>merged and unmerged:</i></div>',2,0 )
            self.putDownloadButton ( revision.sfCIF_unm,"download",grid_id,2,1,
                                     job_id=revision.valJobId )
            self.putMessage1 ( grid_id,
                "<i style=\"font-size:85%\">(recommended)</i>",2,2 )
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "<b><u>or</u></b> <i>merged only:</i>",3,0 )
            self.putDownloadButton ( revision.sfCIF,"download",grid_id,3,1,
                                     job_id=revision.valJobId )
            self.putMessage1 ( grid_id,
                "<i style=\"font-size:85%;white-space:nowrap;\">(only if merged+unmerged causes " +\
                "problems at deposition)</i>",
                3,2 )
        else:
            self.putMessage1 ( grid_id,
                "&nbsp;&nbsp;&nbsp;&nbsp;<i>2. Reflection data:</i>" ,1,0 )
            self.putDownloadButton ( revision.sfCIF,"download",grid_id,1,1,
                                     job_id=revision.valJobId )

        self.putMessage ( "<hr/><br><b>" +\
            "b) Start new deposition session at " +\
            "<a href='https://deposit.wwpdb.org' style='color:blue;' target='_blank'>wwPDB " +\
            "Deposition Site</a></b> <i>(link opens in new tab/window)</i><p><b>" +\
            "c) Follow instructions in the wwPDB deposition site and upload " +\
            "the files downloaded when prompted.</b>"
        )

        if revision.deposition_pdb:
            grid_id1 = self.getWidgetId ( self.dep_grid()+"_1" )
            self.putGrid ( grid_id1 )
            self.putMessage1 ( grid_id1,
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
                0,0 )
            self.putMessage1 ( grid_id1,
                "&nbsp;<hr/><b>Legacy output.</b>" +\
                "<u> Do NOT deposit this file to the PDB, special use only</u><br>&nbsp;",
                0,col=1,rowSpan=1,colSpan=3 )
            self.putMessage1 ( grid_id1,
                "<i>Final atomic coordinates in PDB format:</i>&nbsp;",
                1,1 )
            self.putDownloadButton ( revision.deposition_pdb,"download",grid_id1,1,2,
                                     job_id=revision.valJobId )
            self.putMessage1 ( grid_id1,
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +\
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;",
                1,3 )
            self.putMessage1 ( grid_id1,
                "<hr/>",
                2,col=1,rowSpan=1,colSpan=3 )


        eol_dict  = None
        eol_tasks = []
        try:
            with open(os.path.join(self.inputDir(),"all_tasks.json"),"r") as f:
                eol_dict = json.load(f)
        except:
            pass
        if eol_dict:
            eol_tasks = eol_dict["list"]

        self._add_citations ( citations.citation_list )
        if self.citation_list:
            self.putTitle ( "References" )
            html = citations.makeSummaryCitationsHTML ( self.citation_list,eol_tasks )
            self.putMessage ( html )
        citations.citation_list = []

        # # this will go in the project tree line
        # self.generic_parser_summary["deposition"] = {
        #   "summary_line" : ", ".join(line_summary) + " "
        # }

        # close execution logs and quit
        self.success ( False )
        return


# ============================================================================

if __name__ == "__main__":

    drv = PDBDepFiles ( "",os.path.basename(__file__) )
    drv.start()
