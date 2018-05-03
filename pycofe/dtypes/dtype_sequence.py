##!/usr/bin/python

#
# ============================================================================
#
#    01.12.17   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SEQUENCE DATA TYPE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017
#
# ============================================================================
#

#  python native imports
import os

#  application imports
import dtype_template

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


class DType(dtype_template.DType):

    def __init__(self,job_id,json_str=""):
        super(DType,self).__init__(job_id,json_str)
        if not json_str:
            self._type   = dtype()
            self.dname   = "sequence"
            self.version = 1    # from 01.12.2017
            self.size    = 0
            self.weight  = 0.0
            self.ncopies = 1    # expected number of copies in ASU
            self.nfind   = 1    # copies to find
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


    def getSequence(self,dirPath):
        # returns bare sequence from the associated file
        sequence = ""
        if len(self.files)>0:
            f     = open(os.path.join(dirPath,self.files[0]),'r')
            lines = f.readlines()
            f.close()
            i = 0
            while (i<len(lines)):
                if lines[i].strip().startswith(">"):
                    break
                else:
                    i += 1
            if (i<len(lines)-1) and self.files[0].lower().endswith('.pir'):
                i += 1
            i += 1
            while (i<len(lines)):
                sequence += lines[i].strip()
                i += 1
        return sequence.replace ( " ","" )

    def convert2Seq(self,inputDir,outputDir):
        # convert to *.seq if necessary
        if len(self.files)>0:
            if self.files[0].lower().endswith('.pir'):
                self.files   += [self.files[0]]
                self.files[0] = os.path.splitext(self.files[0])[0] + "_pir.seq"
                f     = open(os.path.join(inputDir,self.files[1]),'r')
                lines = f.readlines()
                f.close()
                f     = open(os.path.join(outputDir,self.files[0]),'w')
                i     = 0
                while (i<len(lines)):
                    if lines[i].strip().startswith(">"):
                        break
                    else:
                        i += 1
                if i<len(lines):
                    f.write ( lines[i].strip() + "\n" )
                    i += 2
                while (i<len(lines)):
                    f.write ( lines[i].strip().upper().replace ( " ","" ) + "\n" )
                    i += 1
        return
