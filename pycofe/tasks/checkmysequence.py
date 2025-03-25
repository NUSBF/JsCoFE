##!/usr/bin/python

#
# ============================================================================
#
#    25.03.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FINDMYSEQUENCE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.checkmysequence jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Grzegorz Chojnowski, Eugene Krissinel, Andrey Lebedev 2025
#
# ============================================================================
#

#  python native imports
import os,re
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



# ============================================================================
# Make CheckMySequence driver

class CheckMySequence(basic.TaskDriver):

    # redefine name of input script file
    # def file_stdin_path(self):  return "checkmysequence.script"

    def importDir(self): return "." # in current directory ( job_dir )
    def seqin(self):  return "checkmysequence.fasta"
    def jsonout(self): return os.path.join(self.outputDir(), 'results.json')

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        mtzin   = istruct.getMTZFilePath   ( self.inputDir() )
        modelin = istruct.getMMCIFFilePath ( self.inputDir() )
        if not modelin:
            modelin = istruct.getPDBFilePath ( self.inputDir() )

        seq = self.input_data.data.seq

        if len(seq)>0:
            with open(self.seqin(),'w') as newf:
                for i in range(len(seq)):
                    seq[i] = self.makeClass ( seq[i] )
                    with open(seq[i].getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );

        jsonout = os.path.join(self.outputDir(), 'results.json')

        cmd=[ "--mtzin"  , mtzin, 
              "--labin"  , f"{istruct.FWT},{istruct.PHWT}",
              "--modelin", modelin,
              "--jsonout", self.jsonout(),
              "--seqin",   self.seqin(),
              "--debug"
            ]

        #self.flush()

        rc = self.runApp ( "checkmysequence",cmd,logType="Main" )

        self.addCitations ( ['checkmysequence'] )

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>checkMySequence failure</h3>" )
            raise signal.JobFailure ( rc.msg )

        # fetch sequence as a string

        with open(self.jsonout(), 'r') as ifile:
            results = json.loads(ifile.read())

        nseq = 0

        if results:
            self.putTitle ( "checkMySequence validation report" )

            self.putMessage ( f"<b>results</b> {results}<i>This is likely to be a program bug, please report.</i>" )

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

        if int(nseq) == 1:
            self.generic_parser_summary["pisa"] = {
                "summary_line" : str(nseq) + " sequence found"
            }
        else:
            self.generic_parser_summary["pisa"] = {
                "summary_line" : str(nseq) + " sequences found"
            }

        # close execution logs and quit
        self.success ( (nseq>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = CheckMySequence ( "",os.path.basename(__file__) )
    drv.start()
