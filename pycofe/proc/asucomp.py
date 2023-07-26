##!/usr/bin/python

#
# ============================================================================
#
#    02.02.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ASYMETRIC UNIT INFERENCE
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

import math

import gemmi

#from ccp4mg import  mmdb2
from Bio    import  pairwise2
from .      import  datred_utils


# ============================================================================

#C     PROTDEN protein density
#C     DNADEN dna density
#C     PDDEN protein/dna complex density
#C     PROTSOL protein solvent content
#C     DNASOL dna solvent content
#C     PDSOL protein/dna complex solvent content
#      REAL PROTDEN, DNADEN, PDDEN, PROTSOL, DNASOL, PDSOL
#      PARAMETER (PROTDEN=1.0/0.74)
#      PARAMETER (DNADEN=1.0/0.50)
#      PARAMETER (PROTSOL=0.47)
#      PARAMETER (DNASOL=0.64)
#      PARAMETER (PDDEN=PROTDEN*0.75+DNADEN*0.25)
#      PARAMETER (PDSOL=0.60)
#
#
#        IF(LDNA) THEN
#c use average weight of C G A T residue (NOT base pair)
#         WEIGHT = 325.96*NRES
#         write(6,*)' Molecular weight of DNA estimated from NRES is ',
#     +         WEIGHT
#        ELSEIF (LCOMP) THEN
#c assume 25%/75% DNA/protein, as in Kantardjieff
#         WEIGHT =  12.0*5 + 14.0*1.35 + 16.0*1.5 +1.0*8 +32.0*0.05
#         WEIGHT = (WEIGHT*0.75+325.96*0.25)*NRES
#         write(6,*) ' Molecular weight of DNA/protein complex',
#     +       ' estimated from NRES is ',WEIGHT
#        ELSE
#         WEIGHT =  12.0*5 + 14.0*1.35 + 16.0*1.5 +1.0*8 +32.0*0.05
#                    60       18.9        24        8      1.6
#         WEIGHT = WEIGHT*NRES
#         write(6,*)' Molecular weight estimated from NRES is ',WEIGHT
#
#
#
#      CELL(4)=CELL(4)*PI/180.0
#      CELL(5)=CELL(5)*PI/180.0
#      CELL(6)=CELL(6)*PI/180.0
#      ULT = 1.0 + 2.0*COS(CELL(4))*COS(CELL(5))*COS(CELL(6)) -
#     +      COS(CELL(4))**2 - COS(CELL(5))**2 - COS(CELL(6))**2
#      IF (ULT .LE. 0.0) CALL CCPERR(1,
#     +' *** The cell volume cannot be calculated; check CELL card ***')
#      VOLUME=CELL(1)*CELL(2)*CELL(3)*SQRT(ULT)
#
#
#      DENSITY = PROTDEN, DNADEN, PDDEN
#      FRACSOL = PROTSOL, DNASOL, PDSOL
#
#        FRAC2 = FRACSOL
#        RO = (1-FRAC2)*DENSITY
#        WEIGHT =RO*(0.602*VOLUME)/(NMOL*NSYM)
#
#
#     +    '(density of solvent = 1.0, density of dna = 2.0)',
#     +'(density of solvent = 1.0, density of protein/dna = 1.35/2.0',
#     +    '(density of solvent = 1.0, density of protein = 1.35)',
#

def suggestASUComp1 ( hkl,seqFilePath,stoichiometry=False ):
# version with all template sequences taken from file
    asu = []
    if seqFilePath:
        with open(seqFilePath,'r') as f:
            content = f.read()
        clist = [_f for _f in content.split('>') if _f]
        for i in range(len(clist)):
            seqdata = clist[i].splitlines()
            seq = ""
            for j in range(1,len(seqdata)):
                seq += seqdata[j].strip()
            if stoichiometry:
                asu.append ( [seq,0.0,"protein",1] )  # only protein seq for now -- to be changed
            else:
                asu.append ( [seq,0.0,"protein",0] )  # only protein seq for now -- to be changed
    return suggestASUComp ( hkl,asu )


def suggestASUComp ( hkl,asu ):
    #   hkl : reflection dataset metadata
    #   asu = [[seq1,weight1,type1,nocc1,name1],[seq2,weight2,type2,nocc2,name2],....],  where
    #        seqN    : Nth sequence -- must be given if weightN<=0.0
    #        weightN : weight of Nth sequence -- must be given if seqN==""
    #        typeN   : Nth sequence type: "protein" or 'dna'
    #        noccN   : on input: <= 0 choose automatically
    #                  on output: the number of Nth sequence in ASU (on return)
    #        nameN   : sequence name for identification

    nprot  = 0
    ndna   = 0
    nseq   = len(asu)
    for i in range(nseq):
        if asu[i][2]=="protein":
            if asu[i][1]<=0.0:
                asu[i][1] = 112.5*len(asu[i][0])
            nprot += 1
        else:
            if asu[i][1]<=0.0:
                asu[i][1] = 325.96*len(asu[i][0])
            ndna += 1

    density = 1.35
    solvent = 0.47
    asutype = "P"
    if nprot==0:
        density = 2.0
        solvent = 0.64
        asutype = "D"
    elif nprot!=0 and ndna!=0:
        density = 1.5
        solvent = 0.6
        asutype = "C"

    nsym = datred_utils.getNSym ( hkl.HM )
    if nsym<=0:
        return {"rc":-1,"msg":"Error in space symmetry group identification"}

    calpha = math.cos ( hkl.DCELL[3]*math.pi/180.0 )
    cbeta  = math.cos ( hkl.DCELL[4]*math.pi/180.0 )
    cgamma = math.cos ( hkl.DCELL[5]*math.pi/180.0 )
    ult = 1.0 + 2.0*calpha*cbeta*cgamma - calpha*calpha - cbeta*cbeta - cgamma*cgamma
    if ult <= 0.0:
        return {"rc":-2,"msg":"Impossible cell parameters"}
    volume = hkl.DCELL[0]*hkl.DCELL[1]*hkl.DCELL[2]*math.sqrt(ult)/nsym

    auto = []   # True if ith composition value may be adjusted
    comp = []   # will be used as composition variable
    for i in range(nseq):
        auto.append ( (asu[i][3]<=0)   )
        comp.append ( max(1,asu[i][3]) )

    params = {
      "asu"       : asu,
      "nseq"      : nseq,
      "maxWeight" : 0.602*density*volume,  # for zero solvent contents
      "auto"      : auto,
      "comp"      : comp,
      "solvent"   : solvent, # target solvent percent
      "weight0"   : 0.0,     # weight of chosen composition
      "nres0"     : 0,       # total number of residues in chosen composition
      "nmol0"     : 0,       # total number of molecules in chosen composition
      "sol0"      : -1.0,    # will be final solvent fraction
      "dsol0"     : 10.0     # will be minimum solvent distance
    }

    def calcFracSol ( n,p ):

        if p["auto"][n]:
            p["comp"][n] = 1

        sol = 10.0

        if n<p["nseq"]-1:
            if p["auto"][n]:
                while calcFracSol(n+1,p)>0.0:
                    p["comp"][n] += 1
                sol = -1.0
            else:
                sol = calcFracSol ( n+1,p )
        else:
            while sol>0.0:
                w0 = 0.0
                for i in range(p["nseq"]):
                    w0 += p["asu"][i][1]*p["comp"][i]
                sol = 1.0 - w0/p["maxWeight"]
                if sol>0.0:
                    # denominator makes a trend to wetter crystals
                    dsol = math.fabs(sol-p["solvent"])/(sol+p["solvent"])
                    if dsol<p["dsol0"]:
                        p["dsol0"]   = dsol
                        p["sol0"]    = sol
                        p["weight0"] = w0
                        nres = 0
                        nmol = 0
                        for i in range(p["nseq"]):
                            p["asu"][i][3] = p["comp"][i]
                            nres += p["comp"][i]*len(p["asu"][i][0])
                            nmol += p["comp"][i]
                        p["nres0"] = nres
                        p["nmol0"] = nmol
                if p["auto"][n]:
                    p["comp"][n] += 1
                else:
                    break;

        return sol

    calcFracSol ( 0,params )

    rc = {
        "rc"        : 0,
        "asu"       : params["asu"],
        "solvent"   : params["sol0"],
        "weight"    : params["weight0"],
        "nres"      : params["nres0"],
        "nmol"      : params["nmol0"],
        "asuType"   : asutype
    }


    if params["sol0"]<=0.0:
        rc["rc"]  = -3
        rc["msg"] = "Given sequence(s) cannot be fit in ASU"

    return rc



def getASUComp ( coorFilePath,sequenceList,clustThresh=0.9,body=None ):
    #  sequenceList has the following format:
    #    [[name1,seq1],[name2,seq2]...[nameN,seqN]]
    #   nameX : sequence name for identification
    #   seqX  : sequence

    #  1. Get all sequences from coordinate file

    seqlist = []  # [[coordinate sequence,sequence type,chainId]]
    st      = gemmi.read_structure(coorFilePath)
    st.setup_entities()
    if len(st)>0:
        model  = st[0]
        chains = []
        for chain in model:
            polymer = chain.get_polymer()
            t       = polymer.check_polymer_type()
            stype   = None
            if t in (gemmi.PolymerType.PeptideL, gemmi.PolymerType.PeptideD):
                stype = "protein"
            elif t==gemmi.PolymerType.Dna:
                stype = "dna"
            elif t==gemmi.PolymerType.Rna:
                stype = "rna"
            elif t==gemmi.PolymerType.DnaRnaHybrid:
                stype = "na"
            # disqualify too short protein and na chains
            if ((stype=="protein") and (len(polymer)<=20)) or (len(polymer)<=6):
                stype = None
            if stype:
                seqlist.append ([
                    str(polymer.make_one_letter_sequence()),
                    stype,
                    chain.name
                ])

    # 2. Cluster chains and match them to the template ones

    asuComp = []
    for i in range(len(seqlist)):
        if seqlist[i][0]:
            asuentry = { "seq":seqlist[i][0], "n":1, "type":seqlist[i][1],
                         "chain_id":seqlist[i][2], "name":str(i) }
            for j in range(i+1,len(seqlist)):
                if seqlist[j][0]:
                    align = pairwise2.align.globalxx ( seqlist[i][0],seqlist[j][0] )
                    seqid = 2.0*align[0][2]/(len(seqlist[i][0])+len(seqlist[j][0]))
                    if seqid>=clustThresh:
                        asuentry["n"] += 1
                        seqlist[j][0]  = None  # exclude from further processing
            asuComp.append ( asuentry )

    # 3. Infer on the correspondence between template and from-coordinates sequences

    nmatches = 0
    seqid0   = 0.0
    seqid1   = 0.0
    if sequenceList:
        matches = []
        for i in range(len(asuComp)):
            seq = asuComp[i]["seq"]
            for j in range(len(sequenceList)):
                if body:
                    body.stdoutln ( " .... seq=" + str(seq) )
                align = pairwise2.align.globalxx ( seq,sequenceList[j][1] )
                if body:
                    body.stdoutln ( " .... align=" + str(align) )
                seqid = align[0][2]/len(seq)
                matchentry = { "seqid":seqid, "coorseq":i, "givenseq":j }
                matches.append ( matchentry )
        #  assign by best seqid, therefore sort all matches first
        msorted = sorted ( matches,key=lambda match: match["seqid"], reverse=True )
        #print str(msorted)
        gmatched = []
        for i in range(len(msorted)):
            coorseq  = msorted[i]["coorseq" ]
            givenseq = msorted[i]["givenseq"]
            if i==0:
                seqid0 = msorted[i]["seqid"]
            if not "match" in asuComp[coorseq] and not givenseq in gmatched:
                asuComp[coorseq]["match"] = givenseq
                asuComp[coorseq]["seqid"] = msorted[i]["seqid"]
                asuComp[coorseq]["name" ] = sequenceList[givenseq][0]
                nmatches += 1
                gmatched.append ( givenseq )
                seqid1 = msorted[i]["seqid"]
                if nmatches>=len(asuComp):
                    break

    result = {}
    result["asucomp" ] = asuComp
    result["seqlist" ] = sequenceList
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

def getASUComp1 ( coorFilePath,seqFilePath,clustThresh=0.9,body=None ):
# version with all template sequences taken from file
    seqlist = []
    if seqFilePath:
        with open(seqFilePath,'r') as f:
            content = f.read()
        if body:
            body.stdout ( "content = \n" + str(content) + "\n-------------\n" )
        clist = [_f for _f in content.split('>') if _f]
        for i in range(len(clist)):  # loop over all sequences in the file
            seqdata = clist[i].splitlines()
            seq     = ""
            for j in range(1,len(seqdata)):
                seq += seqdata[j].strip()
            seqlist.append ( [seqdata[0],seq] ) # [title,sequence]
    if body:
        body.stdout ( "seqlist = \n" + str(seqlist) + "\n-------------\n" )
    return getASUComp ( coorFilePath,seqlist,clustThresh=clustThresh,body=body )


def main():

    import json

    result = getASUComp ( "1e94.pdb",[] )
    print(json.dumps(result,indent=2))

    print(" ================================================================\n")

    result = getASUComp ( "1e94.pdb",[
      [ "seq1",
        "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARR" +
        "LAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPP" +
        "AKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQD" +
        "AIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQI" +
        "AKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQ" +
        "VNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL"
      ],[
        "seq2",
        "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGH" +
        "LVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENT" +
        "ELSAREIAEKALDIAGDICIYTNHFHTIEELSYK"
      ]
    ])
    print(json.dumps(result,indent=2))

    print(" ================================================================\n")

    result = getASUComp ( "1e94.pdb",[
      [ "seq2",
        "TTIVSVRRNGHVVIAGDGQATLGNTVMKGNVKKVRRLYNDKVIAGFAGGTADAFTLFELFERKLEMHQGH" +
        "LVKAAVELAKDWRTDRMLRKLEALLAVADETASLIITGNGDVVQPENDLIAIGSGGPYAQAAARALLENT" +
        "ELSAREIAEKALDIAGDICIYTNHFHTIEELSYK",
      ],[
        "seq1",
        "HSEMTPREIVSELDKHIIGQDNAKRSVAIALRNRWRRMQLNEELRHEVTPKNILMIGPTGVGKTEIARR" +
        "LAKLANAPFIKVEATKFTEVGYVGKEVDSIIRDLTDAAVKMVRVQAIEKNRYRAEELAEERILDVLIPP" +
        "AKNNWGQTEQQQEPSAARQAFRKKLREGQLDDKEIEKQKARKLKIKDAMKLLIEEEAAKLVNPEELKQD" +
        "AIDAVEQHGIVFIDEIDKICKRGESSGPDVSREGVQRDLLPLVEGCTVSTKHGMVKTDHILFIASGAFQI" +
        "AKPSDLIPELQGRLPIRVELQALTTSDFERILTEPNASITVQYKALMATEGVNIEFTDSGIKRIAEAAWQ" +
        "VNESTENIGARRLHTVLERLMEEISYDASDLSGQNITIDADYVSKHLDALVADEDLSRFIL"
      ]
    ])
    print(json.dumps(result,indent=2))

    print(" ================================================================")
    print(" SEQUENCE TAKEN FROM FILE:\n")
    result = getASUComp1 ( "1e94.pdb","1e94.fasta" )
    print(json.dumps(result,indent=2))

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
