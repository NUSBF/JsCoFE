##!/usr/bin/python

#
# ============================================================================
#
#    07.12.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FINDMYSEQUENCE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.findmysequence jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Grzegorz Chojnowski, Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os
# import sys
import json
# import html
import requests

#  application imports
from .     import basic
from varut import signal
from proc  import import_seqcp

# from   pycofe.proc   import qualrep
# from   pycofe.verdicts  import verdict_lorestr
# from   pycofe.auto   import auto



def download_proteome_from_unbiprot(uid="UP000005206", datadir='input'):

    ofile = os.path.join(datadir, f"{uid}.fasta.gz")
    url = f"https://rest.uniprot.org/uniprotkb/stream?compressed=true&format=fasta&query=%28%28proteome%3A{uid}%29%29"
    request = requests.get(url, stream=True)
    request.raise_for_status()
    with open(ofile, 'wb') as f:
        for chunk in request.iter_content(chunk_size=1024):
            f.write(chunk)
    return ofile


# ============================================================================
# Make FindMySequence driver

class FindMySequence(basic.TaskDriver):

    # redefine name of input script file
    # def file_stdin_path(self):  return "findmysequence.script"

    def importDir(self): return "." # in current directory ( job_dir )

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        mtzin   = istruct.getMTZFilePath   ( self.inputDir() )
        modelin = istruct.getMMCIFFilePath ( self.inputDir() )
        if not modelin:
            modelin = istruct.getXYZFilePath ( self.inputDir() )
        uid     = self.getParameter(self.task.parameters.sec1.contains.UPID)
        tophits = self.getParameter(self.task.parameters.sec1.contains.TOPHITS)
        selstr  = self.getParameter(self.task.parameters.sec1.contains.SELSTR)

        jsonout = os.path.join(self.outputDir(), 'results.json')

        cmd=["--mtzin", mtzin, "--labin", f"{istruct.FWT},{istruct.PHWT}",
                "--modelin", modelin, '--jsonout', jsonout, '--tophits', tophits, "--select", selstr]

        if uid:
            self.putMessage ( f"<h3> Downloading protoeomic sequences for {uid} </h3>" )
            self.flush()
            fasta_file = download_proteome_from_unbiprot(uid=uid, datadir=self.outputDir())
            cmd.extend(['--db', fasta_file])


        self.putMessage ( "<h3> Querying sequence database </h3>" )
        self.flush()

        rc = self.runApp ( "findmysequence",cmd,logType="Main" )

        self.addCitations ( ['findmysequence'] )

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>findMySequence failure</h3>" )
            raise signal.JobFailure ( rc.msg )

        # fetch sequence as a string

        with open(jsonout, 'r') as ifile:
            results = json.loads(ifile.read())

        nseq = 0

        if results:
            self.putTitle ( "Found sequence matches" )

            seqdata = ""
            for k,v in results.items():
                seqdata += ">" + v['sequence_id'] + "|E-value=" + str(v["evalue"]) +\
                           "\n" + v["sequence"] + "\n"
            if seqdata:
                nseq = import_seqcp.run ( self,"protein",self.outputFName,seqdata )
            else:
                self.putMessage ( "<b>No results found.</b> <i>This is likely to be a program bug, please report.</i>" )

            # for k,v in results.items():
            #     import_seqcp.run ( self,
            #         "protein",
            #         self.outputFName,
            #         ">" + v['sequence_id'] + "|E-value=" + v["evalue"] + "\n" +  v["sequence"] 
            #     )

            # for k,v in results.items():
            #     self.putMessage ( f"<b>#{k}</b> E-value={v['evalue']}</br>>{v['sequence_id']}</br>{v['sequence']}<\br>" )
        else:
            self.putTitle ( "No plausible sequence matches found" )


        self.generic_parser_summary["pisa"] = {
            "summary_line" : str(nseq) + " sequences found"
        }

        # close execution logs and quit
        self.success ( (nseq>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = FindMySequence ( "",os.path.basename(__file__) )
    drv.start()
