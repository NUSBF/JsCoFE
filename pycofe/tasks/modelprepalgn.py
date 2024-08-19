##!/usr/bin/python

# not python-3 ready

#
# ============================================================================
#
#    09.10.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MODELPREPALGN EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.modelprepalgn jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2023
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
# import gemmi

#  application imports
from . import modelprepxyz
from   pycofe.dtypes import dtype_xyz, dtype_alignment
from   pycofe.proc   import import_pdb

# ============================================================================
# Make Ensemble preparation driver

class ModelPrepAlgn(modelprepxyz.ModelPrepXYZ):

    # ------------------------------------------------------------------------

    def get_pdb_entries ( self,alignment ):

        align_meta = dtype_alignment.parseHHRFile (
            alignment.getHHRFilePath(self.inputDir()),parse_alignments=True )

        xyz  = []
        for i in range(len(alignment.align_meta.hits)):

            if alignment.isHitSelected(i+1):

                ucode = alignment.align_meta.hits[i][0][0]
                chId  = alignment.align_meta.hits[i][0][1]

                fpath_align = "__align_hit_" + str(i+1) + ".fasta"
                file = open ( fpath_align,"w" )
                file.write ( "\n>Hit " + str(i+1) + " target sequence\n" )
                aline = align_meta["alignments"][i]["Q"]
                file.write ( "\n".join([aline[0+k:70+k] for k in range(0,len(aline),70)]) + "\n" )
                file.write ( "\n>Hit " + str(i+1) + " " + ucode + " " + chId + "\n" )
                aline = align_meta["alignments"][i]["T"]
                file.write ( "\n".join([aline[0+k:70+k] for k in range(0,len(aline),70)]) + "\n" )
                file.close()

                ftmp = "__tmp.pdb"
                rc = import_pdb.download_file (
                                    import_pdb.get_pdb_file_url(ucode),ftmp )
                if rc:
                    ftmp = "__tmp.cif"
                    rc = import_pdb.download_file (
                                    import_pdb.get_cif_file_url(ucode),ftmp )
                if not rc:
                    fpath  = self.fetch_chain ( chId,ftmp,
                                                alignment.align_meta.hits[i][7] )
                    fpath1 = ucode + "_" + chId + ".pdb"
                    os.rename ( fpath,os.path.join(self.inputDir(),fpath1) )
                    xyzi = dtype_xyz.DType ( self.job_id )
                    xyzi.setXYZFile        ( fpath1 )
                    xyzi.chainSel = chId
                    xyzi.putXYZMeta ( self.inputDir(),self.file_stdout1,
                                      self.file_stderr,log_parser=None )
                    xyzi.makeDName  ( i+1 )
                    xyzi.fpath_algn = fpath_align
                    xyzi.seqid_algn = align_meta["alignments"][i]["seqid"]
                    xyz.append ( self.makeClass(xyzi) ) # use makeClass for xyzmeta
                else:
                    self.putMessage ( "<b>Could not download PDB entry " +\
                                      ucode + " (rc=" + str(rc) + ")</b>" )

        return xyz


    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        alignment = self.makeClass ( self.input_data.data.alignment[0] )
        sec1      = self.task.parameters.sec1.contains

        seq     = None
        sclpSel = None
        csMode  = None
        if hasattr(self.input_data.data,"seq"):  # optional data parameter
            seq     = self.makeClass    ( self.input_data.data.seq[0] )
            modSel  = self.getParameter ( sec1.MODIFICATION_SEL )
            sclpSel = self.getParameter ( sec1.SCULPTOR_PROTOCOL_SEL )
            csMode  = self.getParameter ( sec1.CHAINSAW_MODE_SEL     )
        else:
            modSel  = self.getParameter ( sec1.MODNOSEQ_SEL )

        xyz    = self.get_pdb_entries ( alignment )
        models = self.make_models     ( seq,xyz,modSel,sclpSel,csMode )

        # this will go in the project tree job's line
        nModels = len(models)
        if nModels>0:
            self.generic_parser_summary["modelprepalgn"] = {
              "summary_line" : str(nModels) + " model(s) generated"
            }

        self.success ( (nModels>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ModelPrepAlgn ( "",os.path.basename(__file__) )
    drv.start()
