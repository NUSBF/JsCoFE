##!/usr/bin/python

#
# ============================================================================
#
#    07.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ UTILITIES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python xyzutils.py jobManager jobDir jobId
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

import gemmi

#  application imports
from  pycofe.tasks   import basic
from  pycofe.dtypes  import dtype_xyz,dtype_ensemble,dtype_structure,dtype_revision

# ============================================================================
# Make XUZ Utilities driver

class XyzUtils(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        ixyz    = self.makeClass ( self.input_data.data.ixyz[0] )
        xyzpath = ixyz.getXYZFilePath ( self.inputDir() )
        sec1    = self.task.parameters.sec1.contains

        # --------------------------------------------------------------------

        st = gemmi.read_structure ( xyzpath )

        log = []

        if self.getParameter(sec1.RMLIGANDS_CBX)=="True":
            log.append ( "waters and ligands removed" )
            st.remove_ligands_and_waters()

        elif self.getParameter(sec1.RMSOLVENT_CBX)=="True":
            log.append ( "waters removed" )
            st.remove_waters()

        if self.getParameter(sec1.RMPROTEIN_CBX)=="True":
            clist = []
            for model in st:
                cnames = []
                for ch in model:
                    polymer = ch.get_polymer()
                    t = polymer.check_polymer_type()
                    self.stdoutln ( " >>>> " + str(t) )
                    if t in (gemmi.PolymerType.PeptideL, gemmi.PolymerType.PeptideD):
                        cnames.append ( ch.name )
                    # if ch.get_polymer().check_polymer_type() in\
                    #            (gemmi.PolymerType.PeptideL,gemmi.PolymerType.PeptideD)]
                self.stdoutln ( ">>>>>>>>>> " + str(cnames) )
                for name in [ch.name for ch in model if ch.get_polymer().check_polymer_type() in\
                                (gemmi.PolymerType.PeptideL,gemmi.PolymerType.PeptideD)]:
                    clist.append ( name )
                    model.remove_chain ( name )
            if len(clist)>0:
                log.append ( "protein chain(s) " + ",".join(clist) + " removed" )

        if self.getParameter(sec1.RMDNARNA_CBX)=="True":
            clist = []
            for model in st:
                for name in [ch.name for ch in model if ch.get_polymer().check_polymer_type() in\
                                (gemmi.PolymerType.Dna,gemmi.PolymerType.Rna,
                                 gemmi.PolymerType.DnaRnaHybrid)]:
                    clist.append ( name )
                    model.remove_chain ( name )
            if len(clist)>0:
                log.append ( "dna/rna chain(s) " + ",".join(clist) + " removed" )

        st.remove_empty_chains()

        xyzout = ixyz.lessDataId ( ixyz.getXYZFileName() )
        self.outputFName = os.path.splitext(xyzout)[0]
        if self.getParameter(sec1.SPLITTOCHAINS_CBX)=="True":
            log.append ( "split in chains" )
            self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                              "</i> transformed:</b><ul><li>" +\
                              "</li><li>".join(log) +\
                              "</li></ul>" )
            self.putTitle ( "Results" )
            for model in st:
                for chain in model:
                    st1 = gemmi.Structure()
                    md1 = gemmi.Model ( "1" )
                    md1.add_chain ( chain )
                    st1.add_model ( md1   )
                    if len(st)>1:
                        xyzout = self.getOFName ( "." + model.name + "." + chain.name + ".pdb" )
                    else:
                        xyzout = self.getOFName ( "." + chain.name + ".pdb" )
                    st1.write_pdb ( xyzout )
                    oxyz = self.registerXYZ ( xyzout,checkout=True )
                    if oxyz:
                        oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                        self.putMessage (
                            "&nbsp;<br><b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                            oxyz.dname )
                        if len(st)>1:
                            self.putXYZWidget ( "xyz_btn","Model " + model.name +
                                                          ", chain " + chain.name,oxyz,-1 )
                        else:
                            self.putXYZWidget ( "xyz_btn","Chain " + chain.name,oxyz,-1 )
                    else:
                        # close execution logs and quit
                        self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                                    "XYZ Data was not formed" )

        else:
            st.write_pdb ( xyzout )

            self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                              "</i> transformed:</b><ul><li>" +\
                              "</li><li>".join(log) +\
                              "</li></ul>" )
            self.putTitle ( "Results" )

            if istruct._type==dtype_xyz.dtype():
                oxyz = self.registerXYZ ( xyzout,checkout=True )
                if oxyz:
                    oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                    self.putMessage (
                        "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                        oxyz.dname )
                    self.putXYZWidget ( "xyz_btn","Edited coordinates",oxyz,-1 )
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                                "XYZ Data was not formed" )

            elif istruct._type==dtype_ensemble.dtype():
                oxyz = self.registerEnsemble (
                                        ixyz.getSeqFilePath(self.inputDir()),
                                        xyzout,checkout=True )
                if oxyz:
                    self.putMessage (
                        "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                        oxyz.dname )
                    self.putEnsembleWidget ( "ensemble_btn","Coordinates",oxyz )
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>Ensemble was not formed (error)</h3>",
                                "Ensemble was not formed" )

            elif istruct._type==dtype_revision.dtype():
                oxyz = self.registerStructure ( xyzout,
                                     ixyz.getSubFilePath(self.inputDir()),
                                     ixyz.getMTZFilePath(self.inputDir()),
                                     ixyz.getMapFilePath(self.inputDir()),
                                     ixyz.getDMapFilePath(self.inputDir()),
                                     libPath=ixyz.getLibFilePath(self.inputDir()),
                                     leadKey=ixyz.leadKey,copy_files=False,
                                     map_labels=ixyz.mapLabels )
                if oxyz:
                    oxyz.copyAssociations   ( ixyz )
                    oxyz.addDataAssociation ( ixyz.dataId )  # ???
                    oxyz.copySubtype        ( ixyz )
                    oxyz.copyLigands        ( ixyz )
                    #self.putMessage (
                    #    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                    #    oxyz.dname )
                    self.putStructureWidget ( "structure_btn",
                                              "Structure and electron density",
                                              oxyz )
                    # update structure revision
                    revision = self.makeClass ( istruct  )
                    revision.setStructureData ( oxyz     )
                    self.registerRevision     ( revision )
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>Structure was not formed (error)</h3>",
                                "Structure was not formed" )

        # this will go in the project tree line
        if len(log)>0:
            self.generic_parser_summary["xyzutils"] = {
              "summary_line" : ", ".join(log)
            }

        # close execution logs and quit
        self.success()

        return


# ============================================================================

if __name__ == "__main__":

    drv = XyzUtils ( "",os.path.basename(__file__) )
    drv.start()
