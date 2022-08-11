##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    11.08.22   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  SLICE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.slice jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2022
#
# ============================================================================
#

#  python native imports
import os
# import sys
# import shutil
#
# #  ccp4-python imports
# import gemmi

#  application imports
from . import basic
# from   pycofe.proc   import seqal
from   pycofe.auto   import auto

# ============================================================================
# Model preparation driver

class Slice(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        xyz     = self.makeClass ( self.input_data.data.xyz[0] )
        sec1    = self.task.parameters.sec1.contains
        nsplits = self.getParameter ( sec1.NSPLITS )

        cmd = [
            "-xyzin"     ,xyz.getXYZFilePath(self.inputDir()),
            "-min_splits",nsplits,
            "-max_splits",nsplits,
            "-xyz_source","alphafold_bfactor"
        ]

        rc = self.runApp ( "slicendice",cmd,logType="Main",quitOnError=False )

        nmodels  = 0
        models = []

        if rc.msg:
            self.putTitle ( "Failure" )
            self.putMessage ( "<i>Program failure, please report</i>" )
        else:
            dirName  = os.path.join ( "slicendice_0","split_"+str(nsplits) )
            outFiles = sorted([f for f in os.listdir(dirName) if f.endswith(".pdb")])
            if len(outFiles)<=0:
                self.putTitle ( "No models generated" )
                self.putMessage ( "<i>No models were generated, although expected</i>" )
            else:
                self.putTitle ( "Results" )
                for fname in outFiles:
                    fpath = os.path.join ( dirName,fname )
                    model = self.registerModel ( xyz.subtype,fpath,checkout=True )
                    if model:
                        nmodels += 1
                        self.putMessage ( "<h3>Model #" + str(nmodels) + ": " +\
                                          model.dname + "</h3>" )
                        # model.addDataAssociation ( seq.dataId )
                        # if not afmodels[i]["seq_ident"]:
                        #     afmodels[i]["seq_ident"] = "0.0"
                        model.meta  = {
                            "rmsd"    : "1.2",
                            "seqId"   : "100.0"
                        }
                        model.seqId = "100.0"
                        model.rmsd  = "1.2"
                        self.add_seqid_remark ( model,["100.0"] )
                        self.putModelWidget ( self.getWidgetId("model_btn"),
                                              "Coordinates",model )
                        have_results = True
                        models.append(model)
                    else:
                        self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                          fname + "</h3>" )

        self.generic_parser_summary["slice"] = {
          "summary_line" : str(nmodels) + " model(s) generated"
        }

        #
        auto.makeNextTask ( self,{
            "models" : models
        })


        self.success ( nmodels>0 )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Slice ( "",os.path.basename(__file__) )
    drv.start()
