##!/usr/bin/python

#
# ============================================================================
#
#    25.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  CCP4BUILD EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.ccp4build_task jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019-2025
#
# ============================================================================
#

#  python native imports
import os
import sys
# import uuid
import json
# import shutil
import time

#  ccp4-python imports
import pyrvapi

#  application imports
from . import basic
from   pycofe.dtypes   import dtype_template, dtype_revision
from   pycofe.proc     import qualrep
from   pycofe.verdicts import verdict_ccp4build
from   pycofe.auto     import auto


# ============================================================================
# Make CCP4Build driver

class CCP4Build(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "ccp4build.script"

    # task-specific definitions
    def workdir        (self):  return "workdir"
    def ccp4build_seq  (self):  return "ccp4build.seq"
    def mtz_cad        (self):  return "__cad.mtz"

    # ------------------------------------------------------------------------

    def run(self):

        # Just in case (of repeated run) remove the output xyz file. When ccp4build
        # succeeds, this file is created.
        if os.path.isfile(self.getXYZOFName()):
            os.remove(self.getXYZOFName())

        # Get references to input data
        idata    = self.input_data.data
        revision = self.makeClass ( idata.revision[0] )
        hkl      = self.makeClass ( idata.hkl[0] )
        istruct  = self.makeClass ( idata.istruct[0]  )
        seq      = idata.seq
        sec1     = self.task.parameters.sec1.contains
        sec2     = self.task.parameters.sec2.contains
        sec3     = self.task.parameters.sec3.contains

        mtzHKL    = hkl    .getHKLFilePath ( self.inputDir() )
        mtzPhases = istruct.getMTZFilePath ( self.inputDir() )

        # Prepare combined sequence file for cbuccaneer
        with open(self.ccp4build_seq(),'w') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'r') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );
            else:
                newf.write ( ">polyUNK\nU\n" );

        #self.open_stdin()
        #self.write_stdin ([
        #    "[input_data]",
        #    "seqpath      " + self.ccp4build_seq()
        #])

        labin_fo     = hkl.getMeanF()
        labin_phases = ""
        if istruct.HLA:
            self.makePhasesMTZ (
                    mtzHKL   ,[labin_fo[0],labin_fo[1],hkl.getFreeRColumn()],
                    mtzPhases,[istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD],
                    self.mtz_cad() )
            labin_phases = "labin_hl     /*/*/[" +\
                           istruct.HLA + "," + istruct.HLB + "," +\
                           istruct.HLC + "," + istruct.HLD + "]"
        else:
            self.makePhasesMTZ (
                    mtzHKL   ,[labin_fo[0],labin_fo[1],hkl.getFreeRColumn()],
                    mtzPhases,[istruct.PHI,istruct.FOM],
                    self.mtz_cad() )
            labin_phases = "labin_phifom  /*/*/[" +\
                           istruct.PHI + "," + istruct.FOM  + "]"


        if istruct.leadKey==2:
            #  experimental phases

            self.open_stdin()
            self.write_stdin ([
                "[input_data]",
                "mode         EP",
                "seqpath      " + self.ccp4build_seq(),
                "mtzpath      " + istruct.getMTZFilePath(self.inputDir()),
                "labin_fo     /*/*/[" + labin_fo[0] + "," + labin_fo[1] + "]",
                "labin_free   /*/*/[" + hkl.getFreeRColumn() + "]",
                "labin_fc     /*/*/[" + istruct.FWT + "," + istruct.PHWT + "]",
                labin_phases
            ])

            if istruct.getSubFileName():
                self.write_stdin ([
                    "xyzpath_ha   " + istruct.getSubFilePath(self.inputDir())
                ])
            elif istruct.getPDBFileName():
                self.write_stdin ([
                    "xyzpath_mr   " + istruct.getPDBFilePath(self.inputDir())
                ])

            """
            if istruct.HLA and istruct.getSubFileName():
                #  experimental phases

                self.makePhasesMTZ (
                        mtzHKL   ,[labin_fo[0],labin_fo[1],hkl.getFreeRColumn()],
                        mtzPhases,[istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD],
                        self.mtz_cad() )

                self.open_stdin()
                self.write_stdin ([
                    "[input_data]",
                    "mode         EP",
                    "seqpath      " + self.ccp4build_seq()
                ])
                self.write_stdin ([
                    "xyzpath_ha   " + istruct.getSubFilePath(self.inputDir()),
                    "mtzpath      " + istruct.getMTZFilePath(self.inputDir()),
                    "labin_fo     /*/*/[" + labin_fo[0] + "," + labin_fo[1] + "]",
                    "labin_hl     /*/*/[" + istruct.HLA + "," + istruct.HLB + "," +\
                                            istruct.HLC + "," + istruct.HLD + "]",
                    "labin_free   /*/*/[" + hkl.getFreeRColumn() + "]"
                ])

                #self.write_stdin ([
                #    "xyzpath_ha   " + istruct.getSubFilePath(self.inputDir()),
                #    "mtzpath      " + istruct.getMTZFilePath(self.inputDir()),
                #    "labin_fo     /*/*/[" + istruct.FP + "," + istruct.SigFP + "]",
                #    "labin_hl     /*/*/[" + istruct.HLA + "," + istruct.HLB + "," +\
                #                            istruct.HLC + "," + istruct.HLD + "]",
                #    "labin_free   /*/*/[" + istruct.FreeR_flag + "]"
                #])
            """

        else:
            #  molecular replacement phases

            self.makePhasesMTZ (
                    mtzHKL   ,[labin_fo[0],labin_fo[1],hkl.getFreeRColumn()],
                    mtzPhases,[istruct.PHI,istruct.FOM],
                    self.mtz_cad() )

            self.open_stdin()
            self.write_stdin ([
                "[input_data]",
                "mode         MR",
                "seqpath      " + self.ccp4build_seq()
            ])

            xyzpath_mr = istruct.getPDBFilePath(self.inputDir())
            if xyzpath_mr:
                self.write_stdin ([
                    "xyzpath_mr   " + xyzpath_mr
                ])
            self.write_stdin ([
                #"mtzpath      " + hkl.getHKLFilePath(self.inputDir()),
                "mtzpath       " + self.mtz_cad(),
                "labin_fo      /*/*/[" + labin_fo[0] + "," + labin_fo[1] + "]",
                "labin_phifom  /*/*/[" + istruct.PHI + "," + istruct.FOM  + "]",
                "labin_fc      /*/*/[" + istruct.FWT + "," + istruct.PHWT + "]",
                "labin_free    /*/*/[" + hkl.getFreeRColumn() + "]"
            ])

        solcont = float( revision.ASU.solvent )
        if solcont > 1.0:
            solcont /= 100.0

        semet = self.getParameter(sec1.SELEN_CBX)
        aniso = self.getParameter(sec1.ANISO_CBX)

        self.write_stdin ([
            "cycles_min       " + self.getParameter(sec1.NCYCLES_MIN),
            "cycles_max       " + self.getParameter(sec1.NCYCLES_MAX),
            "noimprove_cycles " + self.getParameter(sec1.NOIMPROVE_CYCLES),
            "stop_file        " + self.jobEndFName
        ])

        trim_mode = self.getParameter(sec2.TRIMMODE_SEL)
        self.write_stdin ([
            "ref_level        " + self.getParameter(sec2.REFLEVEL_SEL),
            "dm_mode          " + self.getParameter(sec2.DMMODE_SEL),
            "fill_mode        " + self.getParameter(sec2.FILLMODE_SEL),
            "fit_mode         " + self.getParameter(sec2.FITMODE_SEL),
            "rsr_mode         " + self.getParameter(sec2.RSRMODE_SEL),
            "trim_mode        " + trim_mode
        ])

        if trim_mode=="restricted":
            self.write_stdin ([
                "trimmin_zdm      " + self.getParameter(sec2.TRIMMIN_ZDM),
                "trimmax_zdm      " + self.getParameter(sec2.TRIMMAX_ZDM),
                "trimmin_zds      " + self.getParameter(sec2.TRIMMIN_ZDS),
                "trimmax_zds      " + self.getParameter(sec2.TRIMMAX_ZDS)
            ])
        elif trim_mode=="fixed":
            self.write_stdin ([
                "trim_zdm         " + self.getParameter(sec2.TRIM_ZDM),
                "trim_zds         " + self.getParameter(sec2.TRIM_ZDS)
            ])

        if self.getParameter(sec1.WATER_CBX)=="True":
            self.write_stdin ([
                "model_waters     1",
                "trim_wat_rfree   " + self.getParameter(sec1.TRIM_WAT_RFREE),
            ])
            trim_mode = self.getParameter(sec2.TRIMMODE_W_SEL)
            if trim_mode=="auto":
                self.write_stdin ([
                    "trim_mode_w      auto"
                ])
            elif trim_mode=="restricted":
                self.write_stdin ([
                    "trim_mode_w      restricted",
                    "trimmin_zdw      " + self.getParameter(sec2.TRIMMIN_ZDW),
                    "trimmax_zdw      " + self.getParameter(sec2.TRIMMAX_ZDW)
                ])
            else:
                self.write_stdin ([
                    "trim_mode_w      fixed",
                    "trim_zdw         " + self.getParameter(sec2.TRIM_ZDW)
                ])
        res_low  = str(hkl.res_low ).strip()
        res_high = str(hkl.res_high).strip()
        if res_low:
            self.write_stdin ([
                "res_low          " + res_low
            ])
        if res_high:
            self.write_stdin ([
                "res_high         " + res_high
            ])

        experiment_type = self.getParameter(sec3.EXPERIMENT)
        if experiment_type == "electron":
            form_factor = self.getParameter(sec3.FORM_FACTOR)
        else:
            form_factor = "default"

        self.write_stdin ([
            "experiment_type  " + experiment_type,
            "form_factor      " + form_factor
        ])

        self.write_stdin ([
            " ",
            "[parrot]",
            "anisotropy-correction " + aniso,
            "solvent-content  "      + str(solcont),
            #"cycles           3",
            " ",
            "[cbuccaneer]",
            "anisotropy-correction " + aniso,
            "build-semet      "      + semet
        ])

        self.close_stdin()

        # Create working directory for easy job clean-up
        if not os.path.exists(self.workdir()):
            os.makedirs ( self.workdir() )

        # Compose command line
        ccp4build_path = os.path.normpath ( os.path.join (
                                os.path.dirname(os.path.abspath(__file__)),
                                "../apps/ccp4build/ccp4build.py" ) )
        meta = {}
        meta["page_id"]       = self.report_page_id()
        meta["rvrow"]         = self.rvrow
        meta["jobId"]         = self.job_id
        meta["project"]       = self.task.project
        meta["nameout" ]      = self.outputFName
        meta["prefix_rfree" ] = dtype_template.makeDataId ( self.job_id,1 )
        meta["prefix_edcc"  ] = dtype_template.makeDataId ( self.job_id,2 )
        meta["prefix_nbuilt"] = dtype_template.makeDataId ( self.job_id,3 )
        meta["prefix_nfrag" ] = dtype_template.makeDataId ( self.job_id,4 )

        self.storeReportDocument ( json.dumps(meta) )

        cmd = [
            ccp4build_path    ,
            "--rdir"          , self.reportDir(),
            "--wkdir"         , self.workdir  (),
            "--outdir"        , self.outputDir(),
            "--srvlog"        , self.file_stdout1_path(),
            "--rvapi-document", self.reportDocumentName()
        ]

        # Start CCP4Build
        #pyrvapi.rvapi_keep_polling ( True )
        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",cmd,logType="Main" )
            time.sleep ( 2 )  # suspect problems with files on windows
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )
        #pyrvapi.rvapi_keep_polling ( False )
        self.addCitations ( ['ccp4build'] )
        self.rvrow += 100

        have_results = False

        meta     = None
        meta_str = self.restoreReportDocument()
        # self.putMessage1 ( self.report_page_id(),"",rvrow0 )

        if not meta_str:
            self.file_stderr.write ( "\n\n ***** ccp4build returned no meta\n\n" )
        else:
            try:
                meta = json.loads ( meta_str )
                if "programs_used" in meta:
                    self.addCitations ( meta["programs_used"] )
                else:
                    self.putMessage ( "<b>Program error:</b> <i>no program list in meta</i>" +
                                  "<p>'" + meta_str + "'" )
            except:
                self.putMessage ( "<b>Program error:</b> <i>unparseable metadata from CCP4Build</i>" +
                                  "<p>'" + meta_str + "'" )

        if meta:

            self.stderrln ( str(meta) )

            self.putMessage1 ( self.report_page_id(),"&nbsp;" ,meta["page"][4] )

            outnames = meta["outnames"]
            titles   = meta["titles"  ]
            build_no = meta["build_no"]

            # mark redundant solutions
            tnames  = [
                "the lowest R<sub>free</sub>",
                "the highest EDCC",
                "the highest N<sub>res</sub>",
                "the lowest N<sub>frag</sub>"
            ]
            revname = []
            secname = None
            for i in range(len(build_no)):
                r = titles[i]
                if build_no[i]>=0:
                    if not secname:
                        self.putTitle1 ( self.report_page_id(),"Results",meta["page"][4]+1 )
                    secname = tnames[i]
                    for j in range(i+1,len(build_no)):
                        if build_no[j]==build_no[i]:
                            build_no[j] = -(i+1)
                            secname += ", " + tnames[j]
                            r       += ", " + titles[j]
                            for k in range(7):
                                self.putSpacer1 ( self.report_page_id(),1,meta["page"][j]+k )
                    secname = "Build with " + " and".join( secname.rsplit(",",1) )
                    self.putMessage1 ( self.report_page_id(),
                            "<h3>" + secname + "</h3>",meta["page"][i] )
                elif build_no[i-1]>=0:
                    self.rvrow = meta["page"][i]
                revname.append ( r )

            self.flush()            

            if secname:

                rfree_min  = 2.0
                rev0       = None    

                structures = []
                revisions  = []
                for i in range(len(outnames)):

                    fname = outnames[i]
                    rev   = None
                    if build_no[i]>=0:
                        structure = self.registerStructure1 (  ###
                                        self.outputFName,
                                        None,
                                        os.path.join(self.outputDir(),fname + ".pdb"),
                                        None,
                                        os.path.join(self.outputDir(),fname + ".mtz"),
                                        leadKey    = istruct.leadKey,
                                        copy_files = False,
                                        refiner    = "refmac" 
                                    )

                        if structure:

                            if istruct:
                                structure.copy_refkeys_parameters ( istruct )
                                structure.copyAssociations ( istruct )
                                #structure.copySubtype      ( istruct )
                                structure.addSubtypes      ( istruct.subtype )
                                structure.copyLabels       ( istruct )
                                structure.copyLigands      ( istruct )
                            structure.removeSubtype   ( dtype_template.subtypeSubstructure() )
                            structure.setXYZSubtype   ()
                            structure.setRefmacLabels ( None )
                            structure.FP         = istruct.FP
                            structure.SigFP      = istruct.SigFP
                            structure.FreeR_flag = istruct.FreeR_flag

                            # make structure revision
                            rev = dtype_revision.DType ( -1 )
                            rev.copy ( revision )
                            rev.removeSubtype     ( dtype_template.subtypeSubstructure() )
                            rev.setReflectionData ( hkl )
                            rev.setStructureData  ( structure )
                            #rev.makeRevDName ( self.job_id,i+1, self.outputFName + " (" + titles[i] + ")" )
                            #self.putRevisionWidget ( gridId,i,"<b><i>" + titles[i] + " build:</i></b>",rev )
                            #rev.register ( self.outputDataBox )
                            #revisions.append ( rev )
                            have_results = True

                            if meta["metrics"][i]["R_free"]<rfree_min:
                                rfree_min = meta["metrics"][i]["R_free"]
                                rev0 = rev

                            # rvrow0 = self.rvrow
                            try:
                                self.rvrow = meta["page"][i] + 2
                                self.putSpacer ( 8 )
                                # qrmeta = qualrep.quality_report ( self,rev,None,title=None )
                                self.putMessage ( "<b>Assigned structure" +\
                                    self.hotHelpLink("Structure","jscofe_qna.structure") +\
                                    " name:</b>&nbsp;" + structure.dname +\
                                    "<font size='+2'><sub>&nbsp;</sub></font>" )
                                #self.putSpacer ( 3 )
                                # meta["metrics"][i]["clashscore"] = qrmeta["clashscore"]
                            except:
                                qrmeta = None
                                self.stderr ( " *** validation tools failure" )
                            # self.rvrow = rvrow0 + 6

                        else:
                            self.putMessage ( "<i>Cannot make structure for " +\
                                    os.path.join(self.outputDir(),fname+".pdb") + "</i>" )
                            #revisions.append ( None )
                        self.flush()

                    else:
                        structure = structures[-(build_no[i]+1)]

                    structures.append ( structure )
                    revisions .append ( rev )

                self.flush()
                self.rvrow += 7

                verdict_ccp4build.putVerdictWidget ( self,meta )

                # put revision widgets in report
                index = [i for i in range(len(meta["scores"]))]

                for i in range(len(meta["scores"])):
                    for j in range(i+1,len(meta["scores"])):
                        if meta["scores"][index[j]]>meta["scores"][index[i]]:
                            x = index[i]
                            index[i] = index[j]
                            index[j] = x

                self.putTitle ( "Structure Revisions" +\
                            self.hotHelpLink ( "Structure Revision",
                                               "jscofe_qna.structure_revision") )
                #self.putMessage  ( "<b><i>New structure revision name for:<br>&nbsp;</i></b>" )
                gridId = self.getWidgetId ( "revisions" )
                pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),self.rvrow,0,1,1 )
                self.rvrow += 1

                self.stderrln ( str(build_no) )

                serNo = 0
                for i in range(len(outnames)):
                    ii = index[i]
                    if build_no[ii]>=0 and revisions[ii]:
                        revisions[ii].makeRevDName ( self.job_id,serNo+1,
                                        self.outputFName + " (" + revname[ii] + ")" )
                        self.putRevisionWidget ( gridId,serNo,
                                    "build with " + revname[ii] + " :",
                                    revisions[ii] )
                        revisions[ii].register ( self.outputDataBox )
                        serNo += 1

                self.flush()

                rvrow0 = self.rvrow
                for i in range(40):
                    self.putMessage ( "&nbsp;" )
                self.rvrow = rvrow0

                self.flush()

                try:
                    qrmeta = qualrep.quality_report ( self,rev0,None )
                    meta["metrics"][index[1]]["clashscore"] = qrmeta["clashscore"]
                except:
                    qrmeta = None
                    self.stderr ( " *** validation tools failure" )

                self.flush()

                try:
                    # this is only for displayig stats in job tree
                    m0 = meta["metrics"][index[1]]  #  0: edcc  1: rfree
                    self.generic_parser_summary["ccp4build"] = {
                      "summary_line" : "Compl=" + str(m0["res_compl"]) + "% ",
                      "R_factor"     : str(m0["R_factor"]),
                      "R_free"       : str(m0["R_free"])
                    }
                    if not "refmac" in self.generic_parser_summary:
                        self.generic_parser_summary["refmac"] = {}
                    self.generic_parser_summary["refmac"]["R_factor"] = str(m0["R_factor"])
                    self.generic_parser_summary["refmac"]["R_free"]   = str(m0["R_free"])
                    #self.generic_parser_summary["refmac"]     = meta["refmac"]
                    #self.generic_parser_summary["cbuccaneer"] = meta["cbuccaneer"]
                    auto.makeNextTask ( self,{
                        "revision" : revisions[0],
                        "Rfactor"  : str(m0["R_factor"]),
                        "Rfree"    : str(m0["R_free"])
                    })

                except:
                    pass

            else:
                self.putTitle1 ( self.report_page_id(),"Structure was not built",
                                 meta["page"][4]+1 )

        #shutil.rmtree ( self.workdir() )

        rvrow0 = self.rvrow
        for i in range(20):
            self.putMessage ( " " )
        self.rvrow = rvrow0

        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = CCP4Build ( "",os.path.basename(__file__) )
    drv.start()
