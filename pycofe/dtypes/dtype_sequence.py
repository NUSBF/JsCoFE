##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    14.01.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SEQUENCE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os

#  application imports
from . import dtype_template

# ============================================================================

def dtype(): return "DataSequence"  # must coincide with data definitions in JS


def writeSeqFile ( filePath,name,sequence ):
    # creates a single-sequence file
    f = open ( filePath,'w' )
    f.write ( ">" + name + "\n" )
    slist = [sequence[i:i+60] for i in range(0,len(sequence), 60)]
    for i in range(len(slist)):
        f.write ( slist[i] + "\n" )
    f.close()
    return


def writeMultiSeqFile ( filePath,name,sequence,ncopies ):
    # creates a multi-sequence file; all input lists (name, sequence, ncopies)
    # ought to have the same length
    f = open ( filePath,'w' )
    for i in range(len(name)):
        for j in range(ncopies[i]):
            f.write ( ">" + name[i] + "_" + str(j+1) + "\n" )
            seq = sequence[i]
            slist = [seq[k:k+60] for k in range(0,len(seq), 60)]
            for k in range(len(slist)):
                f.write ( slist[k] + "\n" )
            f.write ( "\n" )
    f.close()
    return


def writeMultiSeqFile1 ( filePath,seq_list,dirPath ):
    # same as writeMultiSeqFile(..), but takes list of sequence classes instead
    # of sequence strings. dirPath must point on directory containing the
    # sequences
    names      = []
    sequences  = []
    ncopies    = []
    for s in seq_list:
        names    .append ( s.dname )
        sequences.append ( s.getSequence(dirPath) )
        ncopies  .append ( 1 )
    writeMultiSeqFile ( filePath,names,sequences,ncopies )
    return


def readSeqFile ( filePath,delete_reduntant_bool=False ):
    # reads a single- or multi- sequence file;
    # returns [[name,sequence,nocc]]
    seq_list = []
    with open(filePath,'r') as f:
        line = f.readline()
        while line:
            while line and not line.startswith(">"):
                line = f.readline()
            if line:
                name = line.strip()[1:]
                seq  = ""
                line = f.readline()
                while line and not line.startswith(">"):
                    seq += line.strip()
                    line = f.readline()
                seq_list.append ( [name,seq.replace(" ", ""),1] )
    if delete_reduntant_bool:
        seq_list_unique = []
        for i in range(len(seq_list)):
            if seq_list[i][2]>0:
                for j in range(i+1,len(seq_list)):
                    if seq_list[j][2]>0 and seq_list[j][1]==seq_list[i][1]:
                        seq_list[i][2] += 1
                        seq_list[j][2]  = 0
                seq_list_unique.append ( seq_list[i] )
        seq_list = seq_list_unique
    return seq_list


class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type    = dtype()
            self.dname    = "sequence"
            self.version += 0    # versioning increments from parent to children
            self.size     = 0
            self.weight   = 0.0
            self.ncopies  = 1    # expected number of copies in ASU
            self.nfind    = 1    # copies to find
            self.ncopies_auto = True   # flag to find ncopies automatically
            self.npred    = 1    # number of copies in complex for structure prediction
        return

    def isProtein(self):
        return dtype_template.subtypeProtein() in self.subtype

    def isDNA(self):
        return dtype_template.subtypeDNA() in self.subtype

    def isRNA(self):
        return dtype_template.subtypeRNA() in self.subtype

    def isNucleotide(self):
        return self.isDNA() or self.isRNA()

    def getType(self):
        if self.isProtein():  return dtype_template.subtypeProtein()
        if self.isDNA():      return dtype_template.subtypeDNA    ()
        if self.isRNA():      return dtype_template.subtypeRNA    ()
        return ""

    def setSeqFile ( self,fname ):
        self.setFile ( fname,dtype_template.file_key["seq"] )
        return

    def getSeqFileName ( self ):
        return self.getFileName ( dtype_template.file_key["seq"] )

    def getSeqFilePath ( self,dirPath ):
        return self.getFilePath ( dirPath,dtype_template.file_key["seq"] )


    def getSequence(self,dirPath):
        # returns bare sequence from the associated file
        sequence = ""
        fpath    = self.getSeqFilePath ( dirPath )
        if fpath:
            f     = open(fpath,'r')
            lines = f.readlines()
            f.close()
            i = 0
            while (i<len(lines)):
                if lines[i].strip().startswith(">"):
                    break
                else:
                    i += 1
            if (i<len(lines)-1) and fpath.lower().endswith('.pir'):
                i += 1
            i += 1
            while (i<len(lines)):
                sequence += lines[i].strip()
                i += 1
        return sequence.replace ( " ","" )


    def convert2Seq(self,inputDir,outputDir):
        # convert to *.seq if necessary and enforce capital letters in sequence
        if dtype_template.file_key["seq"] in self.files:
            fname = self.files[dtype_template.file_key["seq"]]
            fname_seq = fname
            if fname.lower().endswith('.pir'):
                fname_seq = os.path.splitext(fname)[0] + "_pir.seq"
                self.files[dtype_template.file_key["seq"]] = fname_seq
            f     = open(os.path.join(inputDir,fname),'r')
            lines = f.readlines()
            f.close()
            f     = open(os.path.join(outputDir,fname_seq),'w')
            i     = 0
            while (i<len(lines)):
                if lines[i].strip().startswith(">"):
                    f.write ( lines[i].strip() + "\n" )
                    i += 1
                    break
                else:
                    i += 1
            while (i<len(lines)):
                f.write ( lines[i].strip().upper().replace ( " ","" ) + "\n" )
                i += 1
            f.close()
        return
