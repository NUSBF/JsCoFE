##!/usr/bin/python

#
# ============================================================================
#
#    15.03.20   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import gemmi

#  application imports
import modelprepxyz
from   pycofe.dtypes import dtype_xyz
from   pycofe.proc   import import_pdb

# ============================================================================
# Make Ensemble preparation driver

class ModelPrepAlgn(modelprepxyz.ModelPrepXYZ):

    # ------------------------------------------------------------------------

    def get_pdb_entries ( self,alignment ):

        ftmp = "__tmp.pdb"
        xyz  = []
        for i in range(len(alignment.align_meta.hits)):
            if alignment.isHitSelected(i+1):
                ucode = alignment.align_meta.hits[i][0][0]
                chId  = alignment.align_meta.hits[i][0][1]
                rc    = import_pdb.download_file (
                                    import_pdb.get_pdb_file_url(ucode),ftmp )
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
                    xyz.append ( xyzi )
                else:
                    self.putMessage ( "<b>Could not download PDB entry " +\
                                      ucode + " (rc=" + str(rc) + ")</b>" )

        return xyz

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare task input
        # fetch input data

        seq       = self.makeClass ( self.input_data.data.seq[0]       )
        alignment = self.makeClass ( self.input_data.data.alignment[0] )
        sec1      = self.task.parameters.sec1.contains
        modSel    = self.getParameter ( sec1.MODIFICATION_SEL )

        sclpSel   = self.getParameter ( sec1.SCULPTOR_PROTOCOL_SEL )
        csMode    = self.getParameter ( sec1.CHAINSAW_MODE_SEL     )

        xyz       = self.get_pdb_entries ( alignment )
        ensNo     = self.make_models  ( seq,xyz,modSel,sclpSel,csMode )

        # this will go in the project tree job's line
        if ensNo>0:
            self.generic_parser_summary["modelprepxyz"] = {
              "summary_line" : str(ensNo) + " model(s) generated"
            }

        self.success ( (ensNo>0) )
        return


# ============================================================================

if __name__ == "__main__":

    drv = ModelPrepAlgn ( "",os.path.basename(__file__) )
    drv.start()
