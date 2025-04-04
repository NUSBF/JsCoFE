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


def results2string(results_dict, decorate=False):
    """
        gchojnowski@04.04.2025
        this is an exact copy of a module from checkMySequence generating sto
        summary from output dict (json). I will expose it in checkMySequence
        code with the next update (>1.5.3) and remove from here
    """

    output = []
    if decorate:
        output.append("")
        output.append('*'*80)
        output.append('*'*33 + '  SUMMARY  ' + '*'*36)
        output.append('*'*80)
        output.append("")

    # 1 UNIDENTIFIED_CHAINS
    if results_dict['unidentified_chains']:
        output.append("")
        output.append(" ==> Unidentified chains; check input sequences and model-to-map fit\n")
        for chtype in ['protein', 'na']:
            for error in results_dict['unidentified_chains'].get(chtype, []):
                output.append( "\t%s/%s:%s"%(error['chain_id_reference'], error['resid_start_reference'], error['resid_end_reference']))

    # 2 SEQUENCE_MISMATCHES
    if results_dict['sequence_mismatches']:
        output.append("")
        output.append(" ==> Chains with sequence mismatches; you will have to fix them first!\n")
        for chtype in ['protein', 'na']:
            for ch in results_dict['sequence_mismatches'].get(chtype, []):
                output.append( " - %s chain %s/%s:%s  - sequence identity to reference %.2f%% [E-value=%.2e]"%
                                                                                        ("Protein" if chtype=='protein' else "Nucleic-acid",
                                                                                        ch['chain_id_reference'],
                                                                                        ch['resid_start_reference'],
                                                                                        ch['resid_end_reference'],
                                                                                        ch['seq2ref_si'],
                                                                                        ch['evalue']))
                output.append(ch['alignment'])

    # 3 INDEXING_ISSUES
    if results_dict['indexing_issues']:
        output.append("")
        output.append(" ==> Sequence assignment issues\n")
        for chtype in ['protein', 'na']:
            for res in results_dict['indexing_issues'].get(chtype, []):
                output.append(" - %s chain fragment %s/%i-%i has a chain break at %s/%i and no residue indexing gap, check!" %
                                    ("Protein" if chtype=='protein' else "Nucleic-acid",
                                    res['chain_id_reference'],
                                    res['resid_start_reference'],
                                    res['resid_end_reference'],
                                    res['chain_id_reference'],
                                    res['break_idx']))

                if len(res['align_sto'])<500: output.append(res['align_sto'])

    # 4 TRACING_ISSUES
    if results_dict['tracing_issues']:
        output.append("")
        output.append(" ==> Possible tracing issues (inconsistent shifts)\n")
        for chtype in ['protein', 'na']:
            for res in results_dict['tracing_issues'].get(chtype, []):

                output.append(" - %s chain fragment %s/%i-%i may be mistraced, check!" % ("Protein" if chtype=='protein' else "Nucleic-acid",
                                                                                    res['chain_id_reference'],
                                                                                    res['resid_start_reference'],
                                                                                    res['resid_end_reference']))
    # 5 REGISTER_SHIFTS
    if results_dict['register_shifts']:
        output.append("")
        output.append(" ==> Sequence register shifts\n")
        for chtype in ['protein', 'na']:
            for res in results_dict['register_shifts'].get(chtype, []):

                output.append(" - %s chain fragment %s/%i-%i may be shifted by %i residue%s [p-value=%.2e]" % 
                                                                                        ("protein" if chtype=='protein' else "nucleic-acid",
                                                                                        res['chain_id_reference'],
                                                                                        res['resid_start_reference'],
                                                                                        res['resid_end_reference'],
                                                                                        -res['shift'],
                                                                                        's' if abs(res['shift'])>1 else '',
                                                                                        10**-res['mlogpv']))
                # do not show sequences for long shifts - they look ugly anyway
                if abs(res['shift'])>10: continue


                output.append( "   model seq %i-%i"%(res['resid_start_reference'], res['resid_end_reference']) )
                output.append(f"      {res['model_seq']}")

                output.append( "     new seq %i-%i"%(res['resid_start_reference']+res['shift'], res['resid_end_reference']+res['shift']) )
                output.append(f"      {res['new_seq']}")
                output.append( "\n")

    if results_dict['clean_report']:
        output.append("")
        output.append("    No issues detected, congratulations!")
        output.append('\n\n')
        return "\n".join(output), True

    return "\n".join(output), False

def put_checkMySequence_section ( body,revision ):

    # return None

    edmeta = None

    if revision.Structure:

        struct = revision.Structure
        sec_id = body.getWidgetId ( "edstats" )
        body.putSection ( sec_id,"Sequence assignment analysis",openState_bool=False )

        mtzin  = struct.getMTZFilePath ( body.outputDir() )



class CheckMySequence(basic.TaskDriver):

    # redefine name of input script file
    # def file_stdin_path(self):  return "checkmysequence.script"

    def importDir(self): return "." # in current directory ( job_dir )
    def seqin(self):  return "checkmysequence.fasta"
    def jsonout(self): return os.path.join(self.outputDir(), 'results.json')
    def checkmysequence_out(self): return "checkmysequence.out"

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct[0] )

        mtzin   = istruct.getMTZFilePath   ( self.inputDir() )
        modelin = istruct.getMMCIFFilePath ( self.inputDir() )
        if not modelin:
            modelin = istruct.getPDBFilePath ( self.inputDir() )

        data_seq = self.input_data.data.seq


        self.putMessage ( "&nbsp;<p><h3>Target sequences</h3>")
        with open(self.seqin(),'w') as newf:
            for i,seq in enumerate(data_seq):
                seqclass     = self.makeClass ( seq )
                seqstr = seqclass.getSequence(self.inputDir())
                seqstr=seqstr.replace("-","")
                self.putMessage( f">{i}|len={len(seqstr)}")
                self.putMessage( f"{seqstr[:50]}...\n" )
                newf.write(f">{i}\n{seqstr}\n")


        cmd=[ "--mtzin"  , mtzin, 
              "--labin"  , f"{istruct.FWT},{istruct.PHWT}",
              "--modelin", modelin,
              "--jsonout", self.jsonout(),
              "--seqin",   self.seqin(),
              "--debug"
            ]

        self.flush()
        have_results = False
        rc = self.runApp ( "checkmysequence",cmd,logType="Main" )

        self.addCitations ( ['checkmysequence'] )

        if rc.msg:
            self.putTitle ( "Results" )
            self.putMessage ( "<h3>checkMySequence failure</h3>" )
            raise signal.JobFailure ( rc.msg )

        # fetch json with validation results
        with open(self.jsonout(), 'r') as ifile:
            results = json.loads(ifile.read())

        grid_row = 0
        grid_id  = 0

        if not results:
            self.putMessage1 ( grid_id,"&nbsp;<p><i>checkMySequence output file was not produced</i>",
                               grid_row,col=0 )
            grid_row += 1
        else:

            content,ok = results2string(results)

            self.putMessage ( f"&nbsp;<p><h3>checkMySequence validation report: {'ok' if ok else 'errors'}</h3>")

            with (open(os.path.join(self.reportDir(),self.checkmysequence_out()),"w")) as f2:
                f2.write ( "<pre style=\"border:1px solid #488090; padding:12px; " +\
                           "height: 400px; width: 100%; overflow: auto; " +\
                           "font-family : 'Courier'; font-size: 1em; " +\
                           "box-shadow : 5px 5px 6px #888888;\">" + content +\
                           "</pre>" )
            panelId = self.getWidgetId ( "cmspanel" )
            self.putPanel ( panelId )

            self.appendContent ( panelId,self.checkmysequence_out(),watch=False )
            
            self.success ( have_results )


        return


# ============================================================================

if __name__ == "__main__":

    drv = CheckMySequence ( "",os.path.basename(__file__) )
    drv.start()
