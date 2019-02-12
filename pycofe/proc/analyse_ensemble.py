##!/usr/bin/python

#
# ============================================================================
#
#    17.01.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COORINATE ENSEMBLE ANALYSIS
#
#  Makes structural alignment of an ensemble with Gesamt, reports all
#  Gesamt's scores etc. and puts export data widget
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

#  python native imports
import os
import sys

#  ccp4-python imports
import pyrvapi

#  application imports
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

        ensFileName = ensemble.getXYZFilePath ( body.outputDir() )
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

        body.runApp ( "gesamt",cmd,logType="Service" )

        body.file_stdout1.close()
        body.file_stdout1 = file_stdout1

        body.restoreReportDocument()

        body.file_stdout1.flush()

        meta = {}
        with open(gesamt_log()) as f:
            for line in f:
                body.file_stdout1.write ( line )
                if line.startswith(" Q-score          |"):
                    meta["qscore"] = line.split('|')[1].strip()
                elif line.startswith(" RMSD             |"):
                    meta["rmsd"]  = line.split('|')[1].strip()
                    ensemble.rmsd = meta["rmsd"]
                elif line.startswith(" Aligned residues |"):
                    meta["nalign"] = line.split('|')[1].strip()
                elif line.startswith(" Sequence Id      |"):
                    meta["seqId"] = line.split(' ')[1].strip()
                elif line.startswith("   quality Q:"):
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
        else:
            ensemble.meta = None

    else:
        body.putMessage1 ( panelId,"Single-chain ensemble, " + \
                           str(ensemble.xyzmeta["xyz"][0]["chains"][0]["size"]) +\
                           " residues",0 )

    return
