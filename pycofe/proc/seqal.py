##!/usr/bin/python

#
# ============================================================================
#
#    11.10.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SEQAL (SEQUENCE ALIGNMENT) MODULE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2023
#
# ============================================================================
#

#  python native imports
import os
import sys

# ============================================================================
#

def file_seq_path (): return "__seq.sss"   # name of input sequence file
def file_aln_path (): return "__seq.aln"   # name of alignment file
def file_stat_path(): return "__seq.stat"  # name of alignment stat file

def run ( body,seqdata,fpath_align ):
#
#  seqdata    : list of classes: DataSequence, DataXYZ, DataEnsemble, DataStructure
#  fpath_align: path to file to receive alignment in fasta format, or None
#

    rc      = { "code" : -1,
                "msg"  : "Not calculated" }
    seqfile = open ( file_seq_path(),'w' ) # receives all sequences to align
    nseq    = 0   # number of sequences
    smap    = {}  # map of sequence names
    seqtype = ""  # for checking sequence types

    for s in seqdata:
        if s._type=='DataSequence':
            nseq    += 1
            seqname  = "s" + str(nseq).zfill(3)
            smap[seqname] = {}
            smap[seqname]["name" ] = s.dname
            smap[seqname]["align"] = ""
            seqfile.write ( "\n>" + seqname  +
                            "\n"  + s.getSequence(body.inputDir()) + "\n" )
            stype = s.getType()
            # body.stdoutln ( " stype=" + str(stype) + ",  seqtype=" + str(seqtype) )
            if not seqtype:
                seqtype = stype
            #elif seqtype!=stype:
            elif (seqtype!=stype) and \
                  ((stype   not in ["na","dna","rna"]) or \
                   (seqtype not in ["na","dna","rna"])):
                seqtype = "x"
        else:
            nmodels = len(s.xyzmeta.xyz)
            for i in range(nmodels):
                chains = s.xyzmeta.xyz[i].chains
                for c in chains:
                    if s.chainSel.startswith("/"):
                        cid = "/" + str(s.xyzmeta.xyz[i].model) + "/" + c.id
                    else:
                        cid = c.id
                    if s.chainSel=="(all)" or s.chainSel==cid or not s.chainSel:
                        nseq   += 1
                        seqname = "s" + str(nseq).zfill(3)
                        smap[seqname] = {}
                        smap[seqname]["name"] = s.dname + ":"
                        if s._type=='DataEnsemble':
                            smap[seqname]["name"] += str(s.xyzmeta.xyz[i].model) + ':'
                        smap[seqname]["name"] += c.id
                        smap[seqname]["align"] = ""
                        seqfile.write ( "\n>" + seqname +\
                                        "\n"  + c.seq   + "\n" )
                        stype = c.type.lower()
                        # body.stdoutln ( " 2. stype=" + str(stype) + ",  seqtype=" + str(seqtype) )
                        if not seqtype:
                            seqtype = stype
                        elif (seqtype!=stype) and \
                              ((stype   not in ["na","dna","rna"]) or \
                               (seqtype not in ["na","dna","rna"])):
                            seqtype = "x"
    seqfile.close()

    if nseq<2:
        rc["code"] = -2
        rc["msg"]  = "Number of sequences is less than 2"
    elif seqtype=="" or seqtype=="x":
        rc["code"] = -3
        rc["msg"]  = "Inconsistent sequence types (mixed protein, dna and rna)"
    else:

        if seqtype!="protein":
            seqtype = "dna"
        cmd = [file_seq_path(),"-type="+seqtype,"-stats="+file_stat_path()]

        # Start clustalw2
        body.runApp ( os.path.join(os.environ["CCP4"],"libexec","clustalw2"),
                      cmd,logType="Main" )

        # check solution file and display results
        if os.path.isfile(file_aln_path()) and os.path.isfile(file_stat_path()):

            rc["stat"] = { "len_max" : "0",
                           "len_min" : "0",
                           "len_avg" : "0",
                           "len_dev" : "0",
                           "len_med" : "0",
                           "id_max"  : "0",
                           "id_min"  : "0",
                           "id_avg"  : "0",
                           "id_dev"  : "0",
                           "id_med"  : "0",
                           "seq_id"  : "0"
                         }

            lines   = [line.rstrip('\n') for line in open(file_stat_path(),'r')]
            for l in lines:
                w = l.split(" ")
                if w[0]=="seqlen":
                    if w[1]=="longest:" : rc["stat"]["len_max"] = w[2]
                    if w[1]=="shortest:": rc["stat"]["len_min"] = w[2]
                    if w[1]=="avg:"     : rc["stat"]["len_avg"] = w[2]
                    if w[1]=="std-dev:" : rc["stat"]["len_dev"] = w[2]
                    if w[1]=="median:"  : rc["stat"]["len_med"] = w[2]
                if w[0]=="aln":
                    if w[1]=="pw-id":
                        if w[2]=="highest:": rc["stat"]["id_max"] = w[3]
                        if w[2]=="lowest:" : rc["stat"]["id_min"] = w[3]
                        if w[2]=="avg:"    : rc["stat"]["id_avg"] = w[3]
                        if w[2]=="std-dev:": rc["stat"]["id_dev"] = w[3]
                        if w[2]=="median:" : rc["stat"]["id_med"] = w[3]

            lines = [line.rstrip('\n') for line in open(file_aln_path(),'r')]
            smap["align"] = ""
            i = 0
            while i < len(lines):
                if lines[i].startswith("s"):
                    for j in range(nseq):
                        smap[lines[i][:4]]["align"] += lines[i][16:]
                        i += 1
                    smap["align"] += lines[i][16:]
                i += 1

            len_cmb = len(smap["align"])
            id_cmb  = 0
            for c in smap["align"]:
                if c=="*":
                    id_cmb += 1
            if float(rc["stat"]["len_avg"])>0:
                id_cmb = id_cmb/float(rc["stat"]["len_avg"])
            rc["stat"]["seq_id"] = id_cmb

            rc["smap"] = smap

            if fpath_align:
                file = open ( fpath_align,"w" )
                for r in range(nseq):
                    sname = "s" + str(r+1).zfill(3)
                    file.write ( "\n>" + smap[sname]["name"] + "\n" )
                    aline = smap[sname]["align"]
                    file.write ( "\n".join([aline[0+i:70+i] for i in range(0,len(aline),70)]) + "\n" )
                file.close()

            rc["code"] = 0
            rc["msg"]  = "Ok"

        else:
            rc["code"] = -4
            rc["msg"]  = "Alignment was not generated"

    return rc
