##!/usr/bin/python

#
# ============================================================================
#
#    20.06.19   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2019
#
# ============================================================================
#

#  python native imports
import os
import sys
import uuid
import json
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from   pycofe.dtypes import dtype_template, dtype_revision
import basic


# ============================================================================
# Make CCP4Build driver

class CCP4Build(basic.TaskDriver):

    # redefine name of input script file
    def file_stdin_path(self):  return "ccp4build.script"

    # task-specific definitions
    def workdir        (self):  return "workdir"
    def ccp4build_seq  (self):  return "ccp4build.seq"
    def mtz_cad        (self):  return "__cad.mtz"


    # ----------------------------------------------------------------------

    def mergeMTZ ( self,mtzHKL,lblHKL,mtzPhases,lblPhases,mtzOut ):

        cmd = [ "HKLIN1",mtzHKL,
                "HKLIN2",mtzPhases,
                "HKLOUT",mtzOut ]

        self.open_stdin()
        self.write_stdin ( "LABIN  FILE 1" )
        for i in range(len(lblHKL)):
            self.write_stdin ( " E%d=%s" % (i+1,lblHKL[i]) )
        self.write_stdin ( "\nLABIN  FILE 2" )
        for i in range(len(lblPhases)):
            self.write_stdin ( " E%d=%s" % (i+1,lblPhases[i]) )
        self.write_stdin ( "\n" )
        self.close_stdin()

        self.runApp ( "cad",cmd,logType="Service" )

        return


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
        with open(self.ccp4build_seq(),'wb') as newf:
            if len(seq)>0:
                for s in seq:
                    s1 = self.makeClass ( s )
                    with open(s1.getSeqFilePath(self.inputDir()),'rb') as hf:
                        newf.write(hf.read())
                    newf.write ( '\n' );
            else:
                newf.write ( ">polyUNK\nU\n" );

        #self.open_stdin()
        #self.write_stdin ([
        #    "[input_data]",
        #    "seqpath      " + self.ccp4build_seq()
        #])

        labin_fo = hkl.getMeanF()

        if istruct.HLA and istruct.getSubFileName():
            #  experimental phases

            self.mergeMTZ ( mtzHKL   ,[labin_fo[0],labin_fo[1],hkl.getFreeRColumn()],
                            mtzPhases,[istruct.HLA,istruct.HLB,istruct.HLC,istruct.HLD],
                            self.mtz_cad() )

            self.open_stdin()
            self.write_stdin ([
                "[input_data]",
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
            """
            self.write_stdin ([
                "xyzpath_ha   " + istruct.getSubFilePath(self.inputDir()),
                "mtzpath      " + istruct.getMTZFilePath(self.inputDir()),
                "labin_fo     /*/*/[" + istruct.FP + "," + istruct.SigFP + "]",
                "labin_hl     /*/*/[" + istruct.HLA + "," + istruct.HLB + "," +\
                                        istruct.HLC + "," + istruct.HLD + "]",
                "labin_free   /*/*/[" + istruct.FreeR_flag + "]"
            ])
            """

        else:
            #  molecular replacement phases

            self.mergeMTZ ( mtzHKL   ,[labin_fo[0],labin_fo[1],hkl.getFreeRColumn()],
                            mtzPhases,[istruct.PHI,istruct.FOM],
                            self.mtz_cad() )

            self.open_stdin()
            self.write_stdin ([
                "[input_data]",
                "seqpath      " + self.ccp4build_seq()
            ])

            xyzpath_mr = istruct.getXYZFilePath(self.inputDir())
            if xyzpath_mr:
                self.write_stdin ([
                    "xyzpath_mr   " + xyzpath_mr
                ])
            self.write_stdin ([
                #"mtzpath      " + hkl.getHKLFilePath(self.inputDir()),
                "mtzpath       " + self.mtz_cad(),
                "labin_fo      /*/*/[" + labin_fo[0] + "," + labin_fo[1] + "]",
                "labin_phifom  /*/*/[" + istruct.PHI + "," + istruct.FOM  + "]",
                #"labin_fc      /*/*/[" + istruct.FWT + "," + istruct.PHWT + "]",
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
            "noimprove_cycles " + self.getParameter(sec1.NOIMPROVE_CYCLES)
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
                "trim_waters      1",
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
            "cycles           3",
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
        meta["jobId"]         = self.job_id
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
        else:
            self.runApp ( "ccp4-python",cmd,logType="Main" )
        #pyrvapi.rvapi_keep_polling ( False )
        self.addCitations ( ['ccp4build'] )
        self.rvrow += 100

        meta = None
        meta_str = self.restoreReportDocument()
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

            self.putTitle   ( "Structure Revisions" )
            self.putMessage ( "<b><i>New structure revision name for:<br>&nbsp;</i></b>" )

            gridId = self.getWidgetId ( "revisions" )
            pyrvapi.rvapi_add_grid ( gridId,False,self.report_page_id(),self.rvrow,0,1,1 )
            self.rvrow += 1

            outnames = meta["outnames"]
            titles   = meta["titles"]

            for i in range(len(outnames)):

                fname = outnames[i]
                structure = self.registerStructure1 (
                                os.path.join(self.outputDir(),fname + ".pdb"),
                                None,
                                os.path.join(self.outputDir(),fname + ".mtz"),
                                os.path.join(self.outputDir(),fname + ".map"),
                                os.path.join(self.outputDir(),fname + ".diff.map"),
                                None,
                                self.outputFName,leadKey=istruct.leadKey,
                                copy_files=False )

                if structure:

                    if istruct:
                        structure.copyAssociations ( istruct )
                        structure.copySubtype      ( istruct )
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
                    rev.makeRevDName ( self.job_id,i+1, self.outputFName + " (" + titles[i] + ")" )
                    self.putRevisionWidget ( gridId,i,"<b><i>" + titles[i] + " build:</i></b>",rev )
                    rev.register ( self.outputDataBox )

                else:
                    self.putMessage ( "<i>Cannot make structure for " +\
                            os.path.join(self.outputDir(),fname+".pdb") + "</i>" )

            try:
                # this is only for displayig stats in job tree
                self.generic_parser_summary["refmac"]     = meta["refmac"]
                self.generic_parser_summary["cbuccaneer"] = meta["cbuccaneer"]
            except:
                pass


        shutil.rmtree ( self.workdir() )

        # close execution logs and quit
        self.success()
        return


# ============================================================================

if __name__ == "__main__":

    drv = CCP4Build ( "",os.path.basename(__file__) )
    drv.start()
