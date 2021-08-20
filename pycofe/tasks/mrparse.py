##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    20.08.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MRPARSE EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.mrparse jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2021
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
# Make MrParse driver


class MrParse(basic.TaskDriver):

    #  redefine name of input script file
    # def file_stdin_path(self):  return "mrparse.script"

    """
    def make_models ( self,seq,xyz_paths ):

        fpath_seq = seq.getSeqFilePath ( self.inputDir() )
        # ensNo     = 0
        ensOk     = False
        models    = []

        for i in range(len(xyz_paths)):

            chainSel = xyz[i].chainSel
            if not chainSel:
                chains = xyz[i].xyzmeta.xyz[0].chains
                for j in range(len(chains)):
                    if len(chains[j].seq)>0:
                        chainSel = chains[j].id
                        xyz[i].chainSel = chainSel
                        break

            if chainSel.startswith("/"):
                chainSel = chainSel[1:].replace("/","_")  # split("/")[-1]
            fpath_in = self.fetch_chain ( xyz[i].chainSel, # this is correct
                                          xyz[i].getXYZFilePath(self.inputDir()) )

            if hasattr(xyz[i],"fpath_algn"):
                fpath_algn = xyz[i].fpath_algn
                sid        = str(xyz[i].seqid_algn)
            else:
                fpath_algn = "__align_" + str(i) + ".fasta"
                rc         = seqal.run ( self,[seq,xyz[i]],fpath_algn )
                self.stdoutln ( str(rc) )
                if rc["code"]==0:
                    sid = str(round(100.0*rc["stat"]["seq_id"],1))
                else:
                    sid = "0"

            fpath_out = xyz[i].getXYZFileName()
            if xyz[i].chainSel!="(all)":  # this is correct
                fname, fext = os.path.splitext(fpath_out)
                if not fname.endswith("_"+chainSel):
                    fpath_out   = fname + "_" + chainSel + fext
            #elif modSel=="S":
            #    fpath_tmp = "__input_sculptor_clipped.pdb"
            #    self.prepare_clip ( fpath_in,fpath_tmp )
            #    fpath_in  = fpath_tmp

            if modSel=="U":
                shutil.copyfile ( fpath_in,fpath_out )
            else:
                fname, fext = os.path.splitext(fpath_out)
                if modSel=="D":
                    fpath_out = fname + ".clip" + fext
                    self.prepare_clip ( fpath_in,fpath_out )
                elif modSel=="M":
                    fpath_out = fname + ".mrep" + fext
                    self.prepare_molrep ( fpath_in,fpath_seq,fpath_out )
                elif modSel=="S":
                    fpath_out = fname + ".sclp" + fext
                    self.prepare_sculptor ( sclpSel,fpath_in,fpath_algn,fpath_out )
                elif modSel=="C":
                    fpath_out = fname + ".chnw" + fext
                    self.prepare_chainsaw ( csMode,fpath_in,fpath_algn,fpath_out )
                elif modSel=="P":
                    fpath_out = fname + ".pala" + fext
                    self.prepare_polyalanine ( fpath_in,fpath_out )

            if os.stat(fpath_out).st_size<100:
                if ensOk:
                    self.putMessage ( "&nbsp;" )
                self.putMessage ( "<h3>*** Failed to prepare model for " +\
                                  xyz[i].dname + " (empty output)</h3>" )
                ensOk = False
            else:
                model = self.registerModel ( seq,fpath_out,checkout=True )
                if model:
                    #if ensNo<1:
                    if len(models)<1:
                        self.putMessage ( "<i><b>Prepared models are associated " +\
                                          "with sequence:&nbsp;" + seq.dname + "</b></i>" )
                        self.putTitle ( "Results" )
                    else:
                        self.putMessage ( "&nbsp;" )
                    #ensNo += 1
                    ensOk  = True
                    self.putMessage ( "<h3>Model #" + str(len(models)+1) + ": " + model.dname + "</h3>" )
                    model.addDataAssociation ( seq.dataId )
                    model.meta  = { "rmsd" : "", "seqId" : sid }
                    model.seqId = model.meta["seqId"]
                    model.rmsd  = model.meta["rmsd" ]

                    if modSel!="S":
                        self.add_seqid_remark ( model,[sid] )

                    self.putModelWidget ( self.getWidgetId("model_btn"),
                                          "Coordinates",model )
                    models.append ( model )

                else:
                    if ensOk:
                        self.putMessage ( "&nbsp;" )
                    self.putMessage ( "<h3>*** Failed to form Model object for " +\
                                      xyz[i].dname + "</h3>" )
                    ensOk = False

        return models
    """



    # ------------------------------------------------------------------------

    def run(self):

        # Prepare mrparse input -- script file

        seq = self.makeClass ( self.input_data.data.seq[0] )
        hkl = None
        if hasattr(self.input_data.data,"hkl"):
            hkl  = self.makeClass ( self.input_data.data.hkl[0] )
            cols = hkl.getMeanF()
            if cols[2]=="X":
                self.putTitle   ( "Unsuitable Data" )
                self.putMessage ( "No mean amplitudes found in the reflection dataset." )
                # this will go in the project tree line
                self.generic_parser_summary["mrparse"] = {
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

        # make command-line parameters for mrparse

        cmd = [ "--seqin",seq.getSeqFilePath(self.inputDir()) ]
        if hkl:
            cmd += [ "--hklin",reflections_mtz ]
        cmd += [ "--do_classify" ]

        # run mrparse
        if sys.platform.startswith("win"):
            self.runApp ( "mrparse.bat",cmd,logType="Main" )
        else:
            self.runApp ( "mrparse",cmd,logType="Main" )

        have_results = False

        mrparse_dir = "mrparse_0"

        html_report = os.path.join ( mrparse_dir,"mrparse.html" )
        if os.path.exists(html_report):
            f = open ( html_report,"r" )
            report = f.read()
            f.close()
            f = open ( html_report,"w" )
            f.write ( report.replace (
                "<script type=\"text/javascript\" src=\"pfam/static/javascripts/canvas.text.js?dontUseMoz=true&amp;reimplement=true\"></script>",
                "" )
            )
            f.close()
            self.insertTab   ( "mrparse_report","MrParse Report",None,True )
            self.putMessage1 (
                "mrparse_report",
                "<iframe src=\"../" + mrparse_dir + "/mrparse.html\" " +\
                "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:90%;\"></iframe>",
                0 )

            self.insertTab ( "mrparse_log","MrParse Log",
                             os.path.join("..",mrparse_dir,"mrparse.log"),False )

            self.flush()

            mrparse_pdbdir = os.path.join ( mrparse_dir,"pdb_files" )
            pdbmodel_xyz  = []
            if os.path.isdir(mrparse_pdbdir):
                pdbmodel_xyz = [fn for fn in os.listdir(mrparse_pdbdir)
                                   if any(fn.endswith(ext) for ext in [".pdb"])]

            if len(pdbmodel_xyz)>0:
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : str(len(pdbmodel_xyz)) + " MR model(s) prepared"
                }
            else:
                self.generic_parser_summary["mrparse"] = {
                  "summary_line" : " no suitable homologues found"
                }


        # close execution logs and quit
        self.success ( have_results )
        return


# ============================================================================

if __name__ == "__main__":

    drv = MrParse ( "",os.path.basename(__file__),options = {
                    "report_page" : { "show" : True, "name" : "Summary" }
                  })

    drv.start()
