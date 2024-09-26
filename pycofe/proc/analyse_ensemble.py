##!/usr/bin/python

#
# ============================================================================
#
#    26.09.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COORINATE ENSEMBLE ANALYSIS
#
#  Makes structural alignment of an ensemble with Gesamt, reports all
#  Gesamt's scores etc. and puts export data widget
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

#  python native imports
import os
import sys
import random
import string

#  ccp4-python imports
import pyrvapi
import gemmi

#  application imports
from  pycofe.dtypes  import dtype_sequence
from  pycofe.varut   import command


# ============================================================================
# import coordinate files function

def gesamt_xyz() :  return "gesamt.pdb"
def gesamt_csv() :  return "gesamt.csv"
def gesamt_log() :  return "gesamt.log"

def run ( body, panelId, ensemble ):  # body is reference to the main Import class

    ensemble.nModels = len(ensemble.xyzmeta["xyz"])

    if ensemble.nModels > 1:
        # make command-line parameters for Gesamt

        ensFileName = ensemble.getPDBFilePath ( body.outputDir() )
        cmd = []
        for model in ensemble.xyzmeta["xyz"]:
            cmd += [ ensFileName, "-s", "/" + str(model["model"]) ]

        cmd += [ "-o",gesamt_xyz(),"-o-cs", "-csv",gesamt_csv() ]

        if ensemble.nModels==2:
            cmd += ["-domains"]

        body.storeReportDocument ( panelId )
        cmd += [ "--rvapi-rdoc",body.reportDocumentName() ]

        # run gesamt

        file_stdout1      = body.file_stdout1
        body.file_stdout1 = open ( gesamt_log(),'w' )

        body.runApp ( "gesamt",cmd,logType="Service",quitOnError=False )

        body.file_stdout1.close()
        body.file_stdout1 = file_stdout1

        body.restoreReportDocument()

        body.file_stdout1.flush()

        meta = { "eLLG" : "" }
        with open(gesamt_log()) as f:
            for line in f:
                body.file_stdout1.write ( line )
                if line.startswith(" Q-score          |"):
                    meta["qscore"] = line.split('|')[1].strip()
                elif "RMSD" in line:
                    meta["rmsd"] = float(line.split()[-1])
                    ensemble.rmsd = meta["rmsd"]
                elif "Aligned residues" in line:
                    meta["nalign"] = float(line.split()[-1])
                    ensemble.nalign = meta["nalign"]
                elif "Sequence Id" in line:
                    meta["seqId"] = float(line.split()[-1])
                    ensemble.seqId = meta["seqId"]
                elif "quality Q" in line:
                    meta["qscore"] = line[14:].split()[0]
                elif line.startswith("     r.m.s.d:"):
                    try:
                        meta["rmsd"] = line[14:].split()[0]
                    except:
                        meta["rmsd"] = "0.5"
                    ensemble.rmsd = str(2.0*float(meta["rmsd"]))
                elif line.startswith("      Nalign:"):
                    meta["nalign"] = line[14:].split()[0]

        if meta:
            ensemble.meta = meta
            return True
        else:
            ensemble.meta = None
            return False

    else:
        body.putMessage1 ( panelId,"Single-chain ensemble, " + \
                           str(ensemble.xyzmeta["xyz"][0]["chains"][0]["size"]) +\
                           " residues",0 )
        return True


def align_seq_xyz ( body,seqPath,xyzPath,seqtype="protein" ):

    if not seqPath:
        return {"status":"undefined"}

    seqlist = [dtype_sequence.readSeqFile(seqPath,delete_reduntant_bool=True)[0][1]]
    name    = ["REFERENCE"]
    ncopies = [1]

    st  = gemmi.read_structure ( xyzPath )
    st.setup_entities()
    st.assign_subchains()  # internally marks polymer, ligand and waters
    cnt = 1
    for model in st:
        chains = []
        for chain in model:
            polymer = chain.get_polymer()
            if polymer:
                seqlist.append ( str(polymer.make_one_letter_sequence()) )
                name   .append ( "TARGET_" + str(cnt) )
                ncopies.append ( 1 )
                cnt += 1

    #body.stdoutln ( str(seqlist) )

    baseName   = "__ens_tmp_" + ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(20))
    seqFName   = baseName + ".seq"
    statsFName = baseName + ".stats"

    if os.path.exists(seqFName):   os.remove(seqFName)
    if os.path.exists(statsFName): os.remove(statsFName)

    dtype_sequence.writeMultiSeqFile ( seqFName,name,seqlist,ncopies )

    cmd = [seqFName,"-type="+seqtype,"-stats="+statsFName]

    # Start clustalw2
    body.runApp ( os.path.join(os.environ["CCP4"],"libexec","clustalw2"),
                  cmd,logType="Service" )

    # check solution file and fetch results
    meta = {"status":"fail"}
    if os.path.isfile(statsFName):

        meta = {"status":"ok"}

        meta["len_max"] = "0"
        meta["len_min"] = "0"
        meta["len_avg"] = "0"
        meta["len_dev"] = "0"
        meta["len_med"] = "0"
        meta["id_max"]  = "0"
        meta["id_min"]  = "0"
        meta["id_avg"]  = "0"
        meta["id_dev"]  = "0"
        meta["id_med"]  = "0"
        lines = [line.rstrip('\n') for line in open(statsFName,'r')]
        for l in lines:
            w = l.split(" ")
            if w[0]=="seqlen":
                if w[1]=="longest:" : meta["len_max"] = w[2]
                if w[1]=="shortest:": meta["len_min"] = w[2]
                if w[1]=="avg:"     : meta["len_avg"] = w[2]
                if w[1]=="std-dev:" : meta["len_dev"] = w[2]
                if w[1]=="median:"  : meta["len_med"] = w[2]
            if w[0]=="aln":
                if w[1]=="pw-id":
                    if w[2]=="highest:": meta["id_max"] = w[3]
                    if w[2]=="lowest:" : meta["id_min"] = w[3]
                    if w[2]=="avg:"    : meta["id_avg"] = w[3]
                    if w[2]=="std-dev:": meta["id_dev"] = w[3]
                    if w[2]=="median:" : meta["id_med"] = w[3]

    return meta
