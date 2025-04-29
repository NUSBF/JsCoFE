##!/usr/bin/python

#
# ============================================================================
#
#    29.04.25   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021-2024
#
# ============================================================================
#

#  python native imports
import os
import sys

#  application imports
from . import basic
from   pycofe.varut   import rvapi_utils
import xml.etree.ElementTree as ET


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
        xyzin = istruct.getPDBFilePath ( self.inputDir() )
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

            nSugars = self.value ( words,"sugars",-1 )
            nIssues = self.value ( words,"sugars",-6 )

            tdict = {
                "title": "Summary",
                "state": 0, "class": "table-blue", "css": "text-align:right;",
                "horzHeaders" :  [],
                "rows" : [
                  { "header": { "label": "Total sugars", "tooltip": "" },
                    "data"  : [ nSugars ]
                  },
                  { "header": { "label": "Total issues", "tooltip": "" },
                    "data"  : [ nIssues ]
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

            libpath = "privateer-lib.cif"
            if not os.path.isfile(libpath):
                libpath = istruct.getLibFilePath ( self.inputDir() )
            else:
                self.putMessage (
                    "&nbsp;<br><i><b>New ligand dictionary was generated and " +\
                    "replaced in Structure Revision. It will be used in " +\
                    "subsequent refinement(s).</b></i>"
                )

            keywords = ""
            keywords_file = "keywords_refmac5.txt"
            if os.path.isfile(keywords_file):
                with open(keywords_file,"r") as kf:
                    keywords = kf.read().strip();
            if keywords:
                self.putMessage (
                    "&nbsp;<br><i><b>Use the following custom Refmac keywords " +\
                    "in subsequent refinement(s):</b><br>" +\
                    "<span style=\"font-size:85%\">(copy-paste them in the " +\
                                  "\"Advanced\" section of the Refmac task)" +\
                    "</span></i><p>" +\
                    "<div style=\"border:1px solid gray;font-family:monospace;" +\
                                 "width:500px;white-space:nowrap;padding:12px;" +\
                                 "background:khaki;box-shadow:5px 5px 6px #888888;\">" +\
                    keywords + "</div>"
                )

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
            # Convert program.xml to report.html
            
            tree = ET.parse('program.xml')
            root = tree.getroot()

            # Find all Pyranose 
            pyranoses = root.findall('.//Pyranose')
            glycans = root.findall('.//Glycan')

            # Build HTML
            html_content = """<!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <title>Privateer Report</title>
            <style>
              table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
              th, td { border: 1px solid #999; padding: 8px; text-align: center; }
              th { background-color: #f2f2f2; }
              .glycan-svg { text-align: left; }
            </style>
            </head>
            <body>
            <h1>Privateer Validation Report</h1>
            <h2>Pyranose Data</h2>
            <table>
            <thead>
            <tr>
            <th>Sugar Name</th><th>Seq Num</th><th>Chain</th><th>Q</th><th>Phi</th><th>Theta</th>
            <th>Anomer</th><th>Hand</th><th>Conformation</th><th>Bond RMSD</th>
            <th>Angle RMSD</th><th>B-Factor</th><th>RSCC</th><th>Diagnostic</th><th>Context</th>
            </tr>
            </thead>
            <tbody>
            """

            for p in pyranoses:
              html_content += "<tr>"
              fields = [
                'SugarName', 'SugarSeqNum', 'SugarChain', 'SugarQ', 'SugarPhi', 'SugarTheta',
                'SugarAnomer', 'SugarHand', 'SugarConformation', 'SugarBondRMSD',
                'SugarAngleRMSD', 'SugarBFactor', 'SugarRSCC', 'SugarDiagnostic', 'SugarContext'
              ]
              for field in fields:
                text = p.find(field).text if p.find(field) is not None else ''
                html_content += f"<td style='text-align: center; border: 1px solid #999;'>{text}</td>"
              html_content += "</tr>\n"

            html_content += """
            </tbody>
            </table>
            <h2>Glycan Data</h2>
            <table>
            <thead>
            <tr>
            <th>Type</th><th>Root</th><th>Chain</th><th>IUPAC</th><th>SNFG</th><th>WURCS</th>
            </tr>
            </thead>
            <tbody>
            """

            for g in glycans:
              html_content += "<tr>"
              fields = [
                 'GlycanType', 'GlycanRoot', 'GlycanChain', 'GlycanText', 'GlycanSVG', 'GlycanWURCS'
              ]
              for field in fields:
                text = g.find(field).text if g.find(field) is not None else ''
                if field == 'GlycanSVG':
                  html_content += f"<td style='border: 1px solid #999;' class='glycan-svg'><img src='../{text}' alt='Glycan SVG' width='300'></td>"
                else:
                  html_content += f"<td style='text-align: center; border: 1px solid #999;'>{text}</td>"
              html_content += "</tr>\n"

            html_content += """
            </tbody>
            </table>
            </body>
            </html>
            """

            # Write html
            with open('report.html', 'w', encoding='utf-8') as f:
              f.write(html_content)

            with open('report.html', 'r', encoding='utf-8') as report_file:
              report_content = report_file.read()
            self.putMessage(
              f"<div style='width:100%; height:100%; text-align: center;'>{report_content}</div>"
            )


            self.putTitle ( "Output Structure" +\
                        self.hotHelpLink ( "Structure","jscofe_qna.structure") )

            structure = self.registerStructure (
                              None,
                              xyzin,
                              istruct.getSubFilePath(self.inputDir()),
                              mtzout,
                              libPath    = libpath,
                              leadKey    = istruct.leadKey,
                              map_labels = "FWT,PHWT,DELFWT,PHDELWT",
                              copy_files = True,
                              refiner    = istruct.refiner 
                          )

            if structure:
                structure.copy_refkeys_parameters ( istruct )
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
                #     qualrep.quality_report ( self,revision,
                #                   istruct.getXYZFilePath ( self.inputDir() ) )
                # except:
                #     self.stderr ( " *** validation tools failure" )
                #     self.rvrow = rvrow0 + 6

                # auto.makeNextTask ( self,{
                #     "revision" : revision,
                #     "Rfactor"  : self.generic_parser_summary["refmac"]["R_factor"],
                #     "Rfree"    : self.generic_parser_summary["refmac"]["R_free"]
                # })

                # this will go in the project tree line
                self.generic_parser_summary["privateer"] = {
                  "summary_line" : nSugars + " sugars, " + nIssues + " issues found"
                }

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
