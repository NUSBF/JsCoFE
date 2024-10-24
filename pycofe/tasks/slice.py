##!/usr/bin/python

#
# ============================================================================
#
#    10.08.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2022-2024
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
from   pycofe.auto   import auto, auto_workflow

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
        plddt_threshold = self.getParameter ( sec1.PLDDT_THRESHOLD)


        self.fixBFactors ( [xyz] )

        cmd = [
            "--xyzin"     ,xyz.getPDBFilePath(self.inputDir()),
            "--min_splits",nsplits,
            "--max_splits",nsplits,
        ]

        if xyz.BF_correction=="alphafold-suggested":
            cmd += ['--bfactor_column', 'plddt']
        elif xyz.BF_correction=="rosetta-suggested":
            cmd += ['--bfactor_column', 'rms']
        elif xyz.BF_correction=="alphafold":
           cmd += ['--bfactor_column', 'predicted_bfactor']

        if int(plddt_threshold)!=0:
            cmd += ["--plddt_threshold",plddt_threshold]

        rc = self.runApp ( "slicendice",cmd,logType="Main",quitOnError=False )

        nmodels = 0
        models  = []

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
                            "rmsd"    : "1",
                            "seqId"   : "100.0"
                        }
                        model.seqId = "100.0"
                        model.rmsd  = "1"
                        self.add_seqid_remark ( model,["100.0"] )
                        self.putModelWidget ( self.getWidgetId("model_btn"),
                                              "Coordinates:&nbsp;",model )
                        models.append(model)
                    else:
                        self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                          fname + "</h3>" )

        if nmodels==1:
            self.generic_parser_summary["slice"] = {
                "summary_line" : " 1 model generated"
            }
        else:
            self.generic_parser_summary["slice"] = {
                "summary_line" : str(nmodels) + " models generated"
            }

        #
        if self.task.autoRunName.startswith("@"):
            # scripted workflow framework
            auto_workflow.nextTask ( self,{
                "data" : {
                    "models" : models
                }
            })
        else:
            auto.makeNextTask ( self,{
                "models" : models
            })


        self.success ( nmodels>0 )
        return



# ============================================================================

if __name__ == "__main__":

    drv = Slice ( "",os.path.basename(__file__) )
    drv.start()
