##!/usr/bin/python

#
# ============================================================================
#
#    05.06.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SEQUENCE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import dtype_template

# ============================================================================

def dtype(): return "DataAlignment"  # must coincide with data definitions in JS

def parseHHRFile ( fpath,parse_alignments=False ):
    align_meta = { "type" : "unknown", "msg" : "Not parsed", "hits" : [] }

    if not os.path.isfile(fpath):
        align_meta["msg"] = "File does not exist"
        return align_meta

    # read non-empty lines
    with open(fpath,"r") as file:
        lines = [_f for _f in (line.rstrip() for line in file) if _f]

    if len(lines)<10:
        align_meta["msg"] = "File does not have content"
        return align_meta

    # check header
    hws = ["Query","Match_columns","No_of_seqs","Neff","Searched_HMMs","Date","Command"]
    ok  = True
    for i in range(7):
        if lines[i].split(" ")[0]!=hws[i]:
            ok = False
            break
    if lines[6][14:22]!="hhsearch":
        ok = False
    if not ok:
        align_meta["msg"] = "File format is not recognised"
        return align_meta

    queryName = lines[0].split()[1]

    align_meta["type"] = "hhpred"

    hits = []
    i0   = 0
    for i in range(8,len(lines)):
        if lines[i].startswith("No "):
            i0 = i
            break
        pdbcode     = lines[i][4:11].strip().split("_")
        title       = lines[i][11:34]
        prob        = lines[i][35:40].strip()
        evalue      = lines[i][41:48].strip()
        pvalue      = lines[i][49:56].strip()
        score       = lines[i][56:63].strip()
        query_range = lines[i][74:84].split("-")
        temp_range  = lines[i][85:94].split("-")
        query_range[0] = int(query_range[0])
        query_range[1] = int(query_range[1])
        temp_range [0] = int(temp_range [0])
        temp_range [1] = int(temp_range [1])
        hits.append ( [pdbcode,title,prob,evalue,pvalue,score,query_range,temp_range] )
    align_meta["hits"] = hits

    if parse_alignments:
        alignments = []
        i = i0
        while i<len(lines):
            if lines[i].startswith(">"):
                targetName = lines[i][1:].split()[0]
                alignment = { "seqid" : 0, "Q" : "", "T" : "" }
                lst = lines[i+1].split(" ")
                for j in range(len(lst)):
                    if lst[j].startswith("Identities="): # "Identities=98%"
                        alignment["seqid"] = int(lst[j].split("=")[1][:-1])
                i += 2
                while i<len(lines):
                    if lines[i].startswith(">"):
                        break
                    if lines[i].startswith("Q " + queryName):
                        alignment["Q"] += lines[i][22:].split(" ")[0]
                    elif lines[i].startswith("T " + targetName):
                        alignment["T"] += lines[i][22:].split(" ")[0]
                    i += 1
                alignments.append(alignment)
            else:
                i += 1

        align_meta["alignments"] = alignments

    return align_meta


class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "alignment"
            self.version += 0    # versioning increments from parent to children
            self.alignment_type = ""   # currently only "hhpred"
            self.align_meta = {
                "type" : "unknown",
                "msg"  : "Not parsed",
                "hits" : []
            }
            self.hitlist = ""  # list of hits selected
        return

    def isHitSelected ( self,hitNo ):
        if not self.hitlist:
            return True
        lst = self.hitlist.split(",")
        for i in range(len(lst)):
            rng = lst[i].split("-")
            if len(rng)==1:
                if int(rng[0])==hitNo:
                    return True
            else:
                rng1 = int(rng[0])
                rng2 = int(rng[1])
                if min(rng1,rng2)<=hitNo and hitNo<=max(rng1,rng2):
                    return True
        return False

    def setHHRFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["hhr"] )
        self.alignment_type = "hhpred"   # currently only "hhpred"
        return

    def getHHRFileName ( self ):
        return self.getFileName ( dtype_template.file_key["hhr"] )

    def getHHRFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["hhr"] )
