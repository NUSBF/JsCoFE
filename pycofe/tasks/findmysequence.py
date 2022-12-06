##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    23.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LORESTR EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.lorestr jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Oleg Kovalevskiy, Andrey Lebedev 2017-2021
#
# ============================================================================
#

#  python native imports
import os
import sys
import json
import html

#  application imports
from . import basic
from   pycofe.proc   import qualrep
from   varut          import signal
from   pycofe.verdicts  import verdict_lorestr
from   pycofe.auto   import auto

import requests
from proc import import_seqcp


def download_proteome_from_unbiprot(uid="UP000005206", datadir='input'):

    ofile = os.path.join(datadir, f"{uid}.fasta.gz")
    url = f"https://rest.uniprot.org/uniprotkb/stream?format=fasta&query=%28%28proteome%3A{uid}%29%29"
    url = f"https://rest.uniprot.org/uniprotkb/stream?compressed=true&format=fasta&query=%28%28proteome%3A{uid}%29%29"
    request = requests.get(url, stream=True)# as request:
    request.raise_for_status()
    with open(ofile, 'wb') as f:
        for chunk in request.iter_content(chunk_size=1024):
            f.write(chunk)
    return ofile


# ============================================================================
# Make FindMySequence driver

class FindMySequence(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "findmysequence.script"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When lorestr
        # succeeds, this file is created.
        # if os.path.isfile(self.getXYZOFName()):
        #     os.remove(self.getXYZOFName())

        # Prepare lorestr input
        # fetch input data
        # hkl     = self.makeClass ( self.input_data.data.hkl[0] )
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        # Prepare report parser
        #self.setGenericLogParser ( self.lorestr_report(),False )

        mtzin = istruct.getMTZFilePath ( self.inputDir() )
        modelin = istruct.getMMCIFFilePath ( self.inputDir() )
        uid = self.getParameter(self.task.parameters.sec1.contains.UPID)
        tophits = self.getParameter(self.task.parameters.sec1.contains.TOPHITS)
        selstr = self.getParameter(self.task.parameters.sec1.contains.SELSTR)

        labin_ph = [istruct.PHI,istruct.FOM,istruct.FWT,istruct.PHWT]

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

        have_results = False

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>findMySequence failure</h3>" )
            raise signal.JobFailure ( rc.msg )

        # fetch sequence as a string

        with open(jsonout, 'r') as ifile:
            results=json.loads(ifile.read())

        if results:
            for k,v in results.items():
                self.putMessage ( f"<b>#{k}</b> E-value={v['evalue']}</br>>{v['sequence_id']}</br>{v['sequence']}<\br>" )
        else:
            self.putMessage ( "<h3> No plausible sequence matches found </h3>" )

        # sequence = myfunction() 

        # self.stdoutln ( "\n Found sequence = " + sequence )

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = FindMySequence ( "",os.path.basename(__file__) )
    drv.start()
