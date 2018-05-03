##!/usr/bin/python

#
# ============================================================================
#
#    13.02.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ASYMETRIC UNIT INFERENCE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
#
# ============================================================================
#

from ccp4mg import mmdb2
from Bio    import pairwise2


# ============================================================================

resCodes = {
    "ALA":"A",  # Alanine
    "ARG":"R",  # Arginine
    "ASN":"N",  # Asparagine
    "ASP":"D",  # Aspartic acid (Aspartate)
    "CYS":"C",  # Cysteine
    "GLN":"Q",  # Glutamine
    "GLU":"E",  # Glutamic acid (Glutamate)
    "GLY":"G",  # Glycine
    "HIS":"H",  # Histidine
    "ILE":"I",  # Isoleucine
    "LEU":"L",  # Leucine
    "LYS":"K",  # Lysine
    "MET":"M",  # Methionine
    "PHE":"F",  # Phenylalanine
    "PRO":"P",  # Proline
    "SER":"S",  # Serine
    "THR":"T",  # Threonine
    "TRP":"W",  # Tryptophan
    "TYR":"Y",  # Tyrosine
    "VAL":"V",  # Valine
    "ASX":"B",  # Aspartic acid or Asparagine
    "GLX":"Z",  # Glutamine or Glutamic acid.
    #  ???     X       Any amino acid.

    # other

    "1PA":"A",   "1PI":"A",   "2AS":"D",   "2ML":"L",   "2MR":"R",   "3GA":"A",
    "5HP":"E",   "ACB":"D",   "ACL":"R",   "AGM":"R",   "AHB":"D",   "ALM":"A",
    "ALN":"A",   "ALO":"T",   "ALT":"A",   "ALY":"K",   "APH":"A",   "APM":"A",
    "AR2":"R",   "ARM":"R",   "ARO":"R",   "ASA":"D",   "ASB":"D",   "ASI":"D",
    "ASK":"D",   "ASL":"D",   "ASQ":"D",   "AYA":"A",   "B1F":"A",   "B2A":"A",
    "B2F":"A",   "B2I":"I",   "B2V":"V",   "BAL":"A",   "BCS":"C",   "BFD":"D",
    "BHD":"D",   "BLE":"L",   "BLY":"K",   "BNN":"F",   "BNO":"L",   "BTA":"L",
    "BTC":"C",   "BTR":"W",   "BUC":"C",   "BUG":"L",   "C5C":"C",   "C6C":"C",
    "CAF":"C",   "CAS":"C",   "CAY":"C",   "CCS":"C",   "CEA":"C",   "CGU":"E",
    "CHG":"G",   "CHP":"G",   "CLB":"A",   "CLD":"A",   "CLE":"L",   "CME":"C",
    "CMT":"C",   "CSB":"C",   "CSD":"A",   "CSE":"C",   "CSO":"C",   "CSP":"C",
    "CSR":"C",   "CSS":"C",   "CSW":"C",   "CSX":"C",   "CSY":"C",   "CSZ":"C",
    "CTH":"T",   "CXM":"M",   "CY1":"C",   "CYM":"C",   "CZZ":"C",   "DAH":"F",
    "DAL":"A",   "DAM":"A",   "DAR":"R",   "DAS":"D",   "DBY":"Y",   "DCY":"C",
    "DGL":"E",   "DGN":"Q",   "DHI":"H",   "DHN":"V",   "DIL":"I",   "DIV":"V",
    "DLE":"L",   "DLY":"K",   "DNP":"A",   "DOH":"D",   "DPH":"F",   "DPN":"F",
    "DPR":"P",   "DSE":"S",   "DSN":"S",   "DSP":"D",   "DTH":"T",   "DTR":"W",
    "DTY":"Y",   "DVA":"V",   "EFC":"C",   "EHP":"F",   "EYS":"C",   "FLA":"A",
    "FLE":"L",   "FME":"M",   "FTY":"Y",   "GGL":"E",   "GHP":"G",   "GSC":"G",
    "GT9":"C",   "H5M":"P",   "HAC":"A",   "HAR":"R",   "HIC":"H",   "HIP":"H",
    "HMR":"R",   "HPH":"F",   "HPQ":"F",   "HTR":"W",   "HV5":"A",   "HYP":"P",
    "IAS":"N",   "IIL":"I",   "ILG":"Q",   "IML":"I",   "IN2":"K",   "ISO":"A",
    "IVA":"V",   "IYR":"Y",   "KCX":"K",   "KPH":"K",   "LLY":"K",   "LOL":"L",
    "LPL":"L",   "LTR":"W",   "LYM":"K",   "LYZ":"K",   "M3L":"K",   "MAA":"A",
    "MAI":"R",   "MEN":"N",   "MGN":"Q",   "MGY":"G",   "MHL":"L",   "MHO":"M",
    "MHS":"H",   "MIS":"S",   "MLE":"L",   "MLY":"K",   "MLZ":"K",   "MME":"M",
    "MNL":"L",   "MNV":"V",   "MPQ":"G",   "MSE":"M",   "MSO":"M",   "MTY":"Y",
    "MVA":"V",   "NAL":"A",   "NAM":"A",   "NCY":"C",   "NEM":"H",   "NEP":"H",
    "NFA":"F",   "NIT":"A",   "NLE":"L",   "NLN":"L",   "NNH":"R",   "NPH":"C",
    "NVA":"V",   "OAS":"S",   "OCS":"C",   "OCY":"C",   "OMT":"M",   "OPR":"R",
    "PAQ":"F",   "PBB":"C",   "PCA":"E",   "PEC":"C",   "PGY":"G",   "PHA":"F",
    "PHD":"N",   "PHI":"F",   "PHL":"F",   "PHM":"F",   "PLE":"L",   "POM":"P",
    "PPH":"F",   "PPN":"F",   "PR3":"C",   "PRR":"A",   "PRS":"P",   "PTH":"Y",
    "PTR":"Y",   "PYA":"A",   "RON":"V",   "S1H":"S",   "SAC":"S",   "SAH":"C",
    "SAM":"M",   "SBD":"A",   "SBL":"A",   "SCH":"C",   "SCS":"C",   "SCY":"C",
    "SEB":"S",   "SEG":"A",   "SEP":"S",   "SET":"S",   "SHC":"C",   "SHP":"G",
    "SLZ":"K",   "SMC":"C",   "SME":"M",   "SNC":"C",   "SOC":"C",   "STY":"Y",
    "SVA":"S",   "TBG":"G",   "TCR":"W",   "THC":"T",   "THO":"T",   "TIH":"A",
    "TNB":"C",   "TPL":"W",   "TPO":"T",   "TPQ":"F",   "TRF":"W",   "TRG":"K",
    "TRN":"W",   "TRO":"W",   "TYB":"Y",   "TYI":"Y",   "TYN":"Y",   "TYQ":"Y",
    "TYS":"Y",   "TYY":"A",   "VAD":"V",   "VAF":"V",   "YOF":"Y"

}


# ============================================================================

def getASUComp ( coorFilePath,sequenceList,clustThresh=0.9 ):

    #  1. Get all sequences from coordinate file

    mm  = mmdb2.Manager()
    mm.ReadCoorFile ( str(coorFilePath) )
    model   = mm.GetFirstDefinedModel()
    nchains = model.GetNumberOfChains()
    seqlist = []
    for i in range(nchains):
        chain = model.GetChain ( i )
        seq   = ""
        nres  = chain.GetNumberOfResidues()
        nAA   = 0
        nNA   = 0
        for j in range(nres):
            res = chain.GetResidue(j)
            if res.isAminoacid() or res.isNucleotide():
                if res.isAminoacid():
                    nAA += 1
                else:
                    nNA += 1
                if res.name in resCodes:
                    seq += resCodes[res.name]
        if nAA >= nNA:
            if len(seq) <= 20:  # threshold for protein chains
                seq = None
        elif len(seq) <= 6:  # threshold for DNA/RNA chains
            seq = None
        if seq:
            seqlist.append ( seq )


    # 2. Cluster chains and match them onto template ones

    asuComp = []
    for i in range(len(seqlist)):
        if seqlist[i]:
            asuentry = { "seq":seqlist[i], "n":1 }
            for j in range(i+1,len(seqlist)):
                if seqlist[j]:
                    align = pairwise2.align.globalxx ( seqlist[i],seqlist[j] )
                    seqid = 2.0*align[0][2]/(len(seqlist[i])+len(seqlist[j]))
                    if seqid>=clustThresh:
                        asuentry["n"] += 1
                        seqlist[j] = ""  # exclude from further processing
            asuComp.append ( asuentry )


    # 3. Infer on the correspondence of template and from-coordinates sequences

    nmatches = 0
    seqid0   = 0.0
    seqid1   = 0.0
    if sequenceList:
        matches = []
        for i in range(len(asuComp)):
            seq = asuComp[i]["seq"]
            for j in range(len(sequenceList)):
                align = pairwise2.align.globalxx ( seq,sequenceList[j] )
                seqid = align[0][2]/len(seq)
                matchentry = { "seqid":seqid, "coorseq":i, "givenseq":j }
                matches.append ( matchentry )
        #  assign by best seqid, therefore sort all matches first
        msorted = sorted ( matches,key=lambda match: match["seqid"], reverse=True )
        #print str(msorted)
        gmatched = []
        for i in range(len(msorted)):
            coorseq  = msorted[i]["coorseq"]
            givenseq = msorted[i]["givenseq"]
            if i==0:
                seqid0 = msorted[i]["seqid"]
            if not "match" in asuComp[coorseq] and not givenseq in gmatched:
                asuComp[coorseq]["match"] = givenseq
                asuComp[coorseq]["seqid"] = msorted[i]["seqid"]
                nmatches += 1
                gmatched.append ( givenseq )
                seqid1 = msorted[i]["seqid"]
                if nmatches>=len(asuComp):
                    break

    result = {}
    result["asucomp"]  = asuComp
    result["maxseqid"] = seqid0
    result["minseqid"] = seqid1
    if nmatches<len(asuComp):
        result["retcode"] = 1
        result["message"] = "More sequences found than given"
    elif len(gmatched)<len(sequenceList):
        result["retcode"] = 2
        result["message"] = "More sequences given than found"
    else:
        result["retcode"] = 0
        result["message"] = "Ok"

    return result


# ============================================================================

def getASUComp1 ( coorFilePath,seqFilePath,clustThresh=0.9 ):
# version with all template sequences taken from file
    seqlist = []
    if seqFilePath:
        with open(seqFilePath,'r') as f:
            content = f.read()
        clist = filter ( None,content.split('>') )
        for i in range(len(clist)):
            seqdata = clist[i].splitlines()
            seq = ""
            for j in range(1,len(seqdata)):
                seq += seqdata[j].strip()
            seqlist.append ( seq )
    return getASUComp ( coorFilePath,seqlist,clustThresh )


def main():

    import json

    result = getASUComp ( "1e94.pdb",[] )
    print json.dumps(result,indent=2)

    print " ================================================================\n"

    result = getASUComp ( "1e94.pdb",[
      "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARR" +
      "LAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPP" +
      "AKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQD" +
      "AIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQI" +
      "AKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQ" +
      "VNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL",
      "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGH" +
      "LVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENT" +
      "ELSAREIAEKALDIAGDICIYTNHFHTIEELSYK"
    ])
    print json.dumps(result,indent=2)

    print " ================================================================\n"

    result = getASUComp ( "1e94.pdb",[
      "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGH" +
      "LVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENT" +
      "ELSAREIAEKALDIAGDICIYTNHFHTIEELSYK",
      "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARR" +
      "LAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPP" +
      "AKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQD" +
      "AIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQI" +
      "AKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQ" +
      "VNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL"
    ])
    print json.dumps(result,indent=2)

    print " ================================================================"
    print " SEQUENCE TAKEN FROM FILE:\n"
    result = getASUComp1 ( "1e94.pdb","1e94.fasta" )
    print json.dumps(result,indent=2)

    return

"""
Expected output:

{
  "maxseqid": 0.0,
  "minseqid": 0.0,
  "asucomp": [
    {
      "seq": "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGHLVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENTELSAREIAEKALDIAGDICIYTNHFHTIEELSYK",
      "n": 4
    },
    {
      "seq": "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARRLAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPPAKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQDAIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQIAKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQVNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL",
      "n": 2
    }
  ],
  "message": "More sequences found than given",
  "retcode": 1
}
 ================================================================

{
  "maxseqid": 1.0,
  "minseqid": 1.0,
  "asucomp": [
    {
      "seqid": 1.0,
      "match": 1,
      "seq": "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGHLVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENTELSAREIAEKALDIAGDICIYTNHFHTIEELSYK",
      "n": 4
    },
    {
      "seqid": 1.0,
      "match": 0,
      "seq": "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARRLAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPPAKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQDAIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQIAKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQVNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL",
      "n": 2
    }
  ],
  "message": "Ok",
  "retcode": 0
}
 ================================================================

{
  "maxseqid": 1.0,
  "minseqid": 1.0,
  "asucomp": [
    {
      "seqid": 1.0,
      "match": 0,
      "seq": "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGHLVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENTELSAREIAEKALDIAGDICIYTNHFHTIEELSYK",
      "n": 4
    },
    {
      "seqid": 1.0,
      "match": 1,
      "seq": "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARRLAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPPAKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQDAIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQIAKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQVNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL",
      "n": 2
    }
  ],
  "message": "Ok",
  "retcode": 0
}

"""

if __name__ == '__main__':
    main()
