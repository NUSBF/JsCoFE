##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    18.06.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  PRIVATEER EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.privateer jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from . import basic
# from   pycofe.proc    import qualrep
from   pycofe.varut   import rvapi_utils
# from   pycofe.dtypes    import dtype_structure
# from   pycofe.verdicts  import verdict_refmac
# from   pycofe.auto      import auto


# ============================================================================
# Make Privateer driver


class Privateer(basic.TaskDriver):

    #  redefine name of input script file
    # def file_stdin_path(self):  return "privateer.script"

    def value ( self,words,key,pos ):
        try:
            nkey = words.index(key)
            return words[nkey+pos]
        except:
            return "x"

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare privateer input -- script file

        revision = self.makeClass ( self.input_data.data.revision[0] )
        istruct  = self.makeClass ( self.input_data.data.istruct [0] )
        hkl      = self.makeClass ( revision.HKL )   # note that 'hkl' was added
                                  # to input databox by TaskPrivateer.makeInputData(),
                                  # therefore, hkl=self.input_data.data.hkl[0]
                                  # would also work

        cols = hkl.getMeanF()
        if cols[2]=="X":
            self.putTitle   ( "Unsuitable Data" )
            self.putMessage ( "No mean amplitudes found in the reflection dataset." )
            # this will go in the project tree line
            self.generic_parser_summary["privateer"] = {
              "summary_line" : "no mean amplitude data, therefore stop"
            }
            # close execution logs and quit
            self.success ( False )
            return

        reflections_mtz = "__reflections.mtz"
        FreeRColumn = hkl.getFreeRColumn()
        hklin = hkl.getHKLFilePath(self.inputDir())
        colin = [cols[0],cols[1],FreeRColumn]
        self.sliceMTZ ( hklin,colin,reflections_mtz,
                        ["F","SIGF",FreeRColumn] )

        # make command-line parameters for privateer
        xyzin = istruct.getXYZFilePath ( self.inputDir() )
        cmd = [
            "-pdbin",xyzin,
            "-mtzin",reflections_mtz,
            "-mode" ,"ccp4i2"
        ]

        # run privateer
        if sys.platform.startswith("win"):
            self.runApp ( "privateer.bat",cmd,logType="Main" )
        else:
            self.runApp ( "privateer",cmd,logType="Main" )

        have_results = False

        fphiout_mtz     = "FPHIOUT.mtz"
        omitfphiout_mtz = "OMITFPHIOUT.mtz"

        if os.path.isfile(fphiout_mtz) and os.path.isfile(omitfphiout_mtz):


            self.flush()
            self.file_stdout.close()

            # SUMMARY:
            #
            #    Wrong anomer: 1
            #    Wrong configuration: 0
            #    Unphysical puckering amplitude: 0
            #    In higher-energy conformations: 1
            #
            #    Privateer has identified 2 issues, with 1 of 2 sugars affected.

            words = []
            with (open(self.file_stdout_path(),'r')) as fstd:
                words = fstd.read().split(" ")
            self.file_stdout = open ( self.file_stdout_path(),'a' )

            tdict = {
                "title": "Summary",
                "state": 0, "class": "table-blue", "css": "text-align:right;",
                "horzHeaders" :  [],
                "rows" : [
                  { "header": { "label": "Total sugars", "tooltip": "" },
                    "data"  : [ self.value(words,"sugars",-1) ]
                  },
                  { "header": { "label": "Total issues", "tooltip": "" },
                    "data"  : [ self.value(words,"sugars",-6) ]
                  },
                  { "header": { "label": "Total affected", "tooltip": "" },
                    "data"  : [ self.value(words,"sugars",-3) ]
                  },
                  { "header": { "label": "Wrong anomer", "tooltip": "" },
                    "data"  : [ self.value(words,"anomer:",1) ]
                  },
                  { "header": { "label": "Wrong configuration", "tooltip": "" },
                    "data"  : [ self.value(words,"configuration:",1) ]
                  },
                  { "header": { "label": "Unphysical puckering amplitude", "tooltip": "" },
                    "data"  : [ self.value(words,"amplitude:",1) ]
                  },
                  { "header": { "label": "In higher-energy conformations", "tooltip": "" },
                    "data"  : [ self.value(words,"conformations:",1) ]
                  },
                ]
            }

            rvapi_utils.makeTable ( tdict,self.getWidgetId("score_table"),
                                    self.report_page_id(),
                                    self.rvrow,0,1,1 )
            self.rvrow = self.rvrow + 1

            mtzout = "_out.mtz"
            self.makeMTZ ([
              { "path"   : hklin,
                "labin"  : colin,
                "labout" : colin
              },{
                "path"   : fphiout_mtz,
                "labin"  : ["F"  ,"PHI" ],
                "labout" : ["FWT","PHWT"]
              },{
                "path"   : omitfphiout_mtz,
                "labin"  : ["F"     ,"PHI"    ],
                "labout" : ["DELFWT","PHDELWT"]
              }
            ],mtzout )

            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            structure = self.registerStructure (
                                    xyzin,
                                    istruct.getSubFilePath(self.inputDir()),
                                    mtzout,None,None,
                                    istruct.getLibFilePath(self.inputDir()),
                                    leadKey=istruct.leadKey,
                                    map_labels="FWT,PHWT,DELFWT,PHDELWT",
                                    copy_files=True,
                                    refiner=istruct.refiner )

            if structure:
                structure.copyAssociations ( istruct )
                structure.addSubtypes      ( istruct.subtype )
                # structure.removeSubtype    ( dtype_template.subtypeSubstructure() )
                # structure.setXYZSubtype    ()
                structure.copyLabels       ( istruct )
                structure.setRefmacLabels  ( None    )
                structure.copyLigands      ( istruct )
                structure.FP         = colin[0]
                structure.SigFP      = colin[1]
                structure.FreeR_flag = colin[2]
                self.putStructureWidget    ( "structure_btn",
                                             "Structure and electron density",
                                             structure )
                # update structure revision
                revision = self.makeClass  ( self.input_data.data.revision[0] )
                revision.setStructureData  ( structure )
                #revision.removeSubtype     ( dtype_template.subtypeSubstructure() )
                self.registerRevision      ( revision  )
                have_results = True

                # rvrow0 = self.rvrow
                # try:
                #     qualrep.quality_report ( self,revision )
                # except:
                #     self.stderr ( " *** molprobity failure" )
                #     self.rvrow = rvrow0

                # auto.makeNextTask ( self,{
                #     "revision" : revision,
                #     "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                #     "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                # })

        else:
            self.putTitle ( "No Output Generated" )


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = Privateer ( "Validation of carbohydrate structures with Privateer",
                      os.path.basename(__file__) )
    drv.start()
