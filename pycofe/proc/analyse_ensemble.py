##!/usr/bin/python

#
# ============================================================================
#
#    09.08.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  COORINATE ENSEMBLE ANALYSIS
#
#  Makes structural alignment of an ensemble with Gesamt, reports all
#  Gesamt's scores etc. and puts export data widget
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2018
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

def run ( body, panelId, ensemble ):  # body is reference to the main Import class

    ensemble.nModels = len(ensemble.xyzmeta["xyz"])

    if ensemble.nModels > 1:
        # make command-line parameters for Gesamt

        ensFileName = ensemble.getXYZFilePath ( body.outputDir() )
        cmd = []
        for model in ensemble.xyzmeta["xyz"]:
            cmd += [ ensFileName, "-s", "/" + str(model["model"]) ]

        cmd += [ "-o",gesamt_xyz(),"-o-cs", "-csv","gesamt.csv" ]

        if ensemble.nModels==2:
            cmd += ["-domains"]

        body.storeReportDocument ( panelId )
        cmd += [ "--rvapi-rdoc",body.reportDocumentName() ]

        # run gesamt
        body.runApp ( "gesamt",cmd )

        meta = body.restoreReportDocument()
        body.file_stdout.write ( " ******* " + str(meta) + "\n" )
        try:
            ensemble.meta = eval(meta)
            ensemble.rmsd = ensemble.meta["rmsd"]
        except:
            ensemble.meta = None

    else:
        body.putMessage1 ( panelId,"Single-chain ensemble, " + \
                           str(ensemble.xyzmeta["xyz"][0]["chains"][0]["size"]) +\
                           " residues",0 )

    return
