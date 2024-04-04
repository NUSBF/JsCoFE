##!/usr/bin/python

#
# ============================================================================
#
#    06.03.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ UTILITIES EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python gemmi.py jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

#  python native imports
import sys
import os

import gemmi

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
from  pycofe.dtypes import dtype_structure,dtype_revision
from  pycofe.dtypes import dtype_sequence

# ============================================================================
# Make XUZ Utilities driver

class Gemmi(basic.TaskDriver):

    def python_script(self):  return "__python_script.py"

    # ------------------------------------------------------------------------

    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct )

        plines = [
            "#!/usr/bin/python",
            "",
            "import math",
            "import gemmi",
            "",
            "# --------------------------------------------------------------",
            "# Initiation",
            "# --------------------------------------------------------------",
            ""
        ]

        for i in range(len(istruct)):
            istruct[i] = self.makeClass ( self.input_data.data.istruct[i] )
            xyzpath    = None
            st         = istruct[i]
            if st._type=="DataRevision":
                if st.Structure:
                    st.Structure = self.makeClass ( st.Structure )
                    xyzpath = st.Structure.getPDBFilePath ( self.inputDir() )
                elif st.Substructure:
                    st.Substructure = self.makeClass ( st.Substructure )
                    xyzpath = st.Substructure.getSubFilePath ( self.inputDir() )
            else:
                xyzpath = st.getPDBFilePath ( self.inputDir() )
                if not xyzpath and st._type=="DataStructure":
                    xyzpath = st.getSubFilePath ( self.inputDir() )
            if xyzpath:
                plines.append (
                    "st" + str(i+1) + " = gemmi.read_structure ( \"" +\
                    xyzpath + "\" )"
                )

        struct0  = istruct[0]
        outfname = self.getXYZOFName()
        if struct0._type=="DataRevision" and struct0.Substructure:
            outfname = self.getSubOFName()

        plines += [
            "",
            "# --------------------------------------------------------------",
            "# Custom script:",
            "# --------------------------------------------------------------",
            ""
        ]
        script  = self.task.parameters.SCRIPT.value.splitlines()
        removed = []
        for i in range(len(script)):
            words = script[i].split()
            if "import" not in words:
                plines.append ( script[i] )
            else:
                removed.append ( script[i] )

        if len(removed)>0:
            self.stdoutln   ( "Line(s) removed: " )
            self.putMessage ( "<b>Line(s) removed:</b>" )
            self.stdoutln   ( "  " + "\n  ".join(removed) )
            self.putMessage ( "<span style=\"font-family:monospace;\">" +\
                              "&nbsp;&nbsp;" +\
                              "<br>&nbsp;&nbsp;".join(removed) +\
                              "</span>" )

        plines += [
            "",
            "# --------------------------------------------------------------",
            "# Finalising",
            "# --------------------------------------------------------------",
            "",
            "if st1:",
            "    st1.write_pdb ( \"" + outfname + "\" )",
            "",
        ]

        pfile = open ( self.python_script(),"w" )
        pfile.write ( "\n".join(plines) )
        pfile.close()

        self.stdoutln (
            "\nGEMMI SCRIPT:\n" +\
            "=================================================================="
        )
        for i in range(len(plines)):
            self.stdoutln ( plines[i] )

        if sys.platform.startswith("win"):
            self.runApp ( "ccp4-python.bat",[self.python_script()],logType="Main" )
        else:
            self.runApp ( "ccp4-python",[self.python_script()],logType="Main" )

        have_results = False
        if os.path.isfile(outfname):

            self.putTitle ( "Results" )

            if struct0._type=="DataRevision":
                xyzfname = outfname
                subfname = None
                st0 = struct0.Structure
                if not st0:
                    st0 = struct0.Substructure
                    xyzfname = None
                    subfname = outfname
                xyz = self.registerStructure ( 
                            None,
                            xyzfname,
                            subfname,
                            st0.getMTZFilePath(self.inputDir()),
                            libPath    = st0.getLibFilePath(self.inputDir()),
                            mapPath    = st0.getMapFilePath(self.inputDir()),
                            dmapPath   = st0.getDMapFilePath(self.inputDir()),
                            leadKey    = st0.leadKey,copy_files=True,
                            map_labels = st0.mapLabels,
                            refiner    = st0.refiner 
                        )
                if xyz:
                    xyz.copy_refkeys_parameters ( st0 )
                    xyz.copyAssociations   ( st0 )
                    xyz.addDataAssociation ( st0.dataId )  # ???
                    xyz.copySubtype        ( st0 )
                    xyz.copyLigands        ( st0 )
                    if not xyzfname:
                        xyz.removeSubtype ( dtype_template.subtypeXYZ() )
                    self.putStructureWidget ( "structure_btn",
                                              "Structure and electron density",
                                              xyz )
                    # update structure revision
                    revision = self.makeClass ( struct0  )
                    revision.setStructureData ( xyz      )
                    self.registerRevision     ( revision )
                    have_results = True
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>Structure was not formed (error)</h3>",
                                "Structure was not formed" )

            elif struct0._type=="DataStructure":
                xyzfname = None
                subfname = outfname
                if struct0.hasSubtype(dtype_template.subtypeXYZ()):
                    xyzfname = outfname
                    subfname = None
                xyz = self.registerStructure ( 
                            None,
                            xyzfname,
                            subfname,
                            struct0.getMTZFilePath(self.inputDir()),
                            libPath    = struct0.getLibFilePath(self.inputDir()),
                            mapPth     = struct0.getMapFilePath(self.inputDir()),
                            dmapPath   = struct0.getDMapFilePath(self.inputDir()),
                            leadKey    = struct0.leadKey,copy_files=True,
                            map_labels = struct0.mapLabels,
                            refiner    = struct0.refiner 
                        )
                if xyz:
                    xyz.copy_refkeys_parameters ( struct0 )
                    xyz.copyAssociations   ( struct0 )
                    xyz.addDataAssociation ( struct0.dataId )  # ???
                    xyz.copySubtype        ( struct0 )
                    xyz.copyLigands        ( struct0 )
                    if not xyzfname:
                        xyz.removeSubtype ( dtype_template.subtypeXYZ() )
                    self.putStructureWidget ( "structure_btn",
                                              "Structure and electron density",
                                              xyz )
                    have_results = True
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>Structure was not formed (error)</h3>",
                                "Structure was not formed" )

            elif struct0._type=="DataEnsemble":
                seq = None
                if struct0.sequence:
                    seq = self.makeClass ( struct0.sequence )
                ensemble = self.registerEnsemble ( seq,outfname,checkout=True )
                if ensemble:
                    if seq:
                        ensemble.addDataAssociation ( seq.dataId )
                    ensemble.meta  = struct0.meta
                    ensemble.seqId = struct0.seqId
                    ensemble.rmsd  = struct0.rmsd
                    self.putEnsembleWidget ( "ensemble_btn","Coordinates",ensemble )
                    have_results = True
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>Ensemble was not formed (error)</h3>",
                                "Ensemble was not formed" )

            elif struct0._type=="DataModel":
                seq = None
                if struct0.sequence:
                    seq = self.makeClass ( struct0.sequence )
                model = self.registerModel ( seq,outfname,checkout=True )
                if model:
                    if seq:
                        model.addDataAssociation ( seq.dataId )
                    model.meta  = struct0.meta
                    model.seqId = struct0.seqId
                    model.rmsd  = struct0.rmsd
                    #self.putMessage (
                    #    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                    #    xyz.dname )
                    self.putModelWidget ( self.getWidgetId("model_btn"),
                                          "Coordinates:&nbsp;",model )
                    have_results = True
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>Model Data was not formed (error)</h3>",
                                "Model Data was not formed" )

            elif struct0._type=="DataXYZ":
                oxyz = self.registerXYZ ( None,outfname,checkout=True )
                if oxyz:
                    # oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                    self.putMessage (
                        "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                        oxyz.dname )
                    self.putXYZWidget ( self.getWidgetId("xyz_btn"),"Edited coordinates",oxyz )
                    have_results = True
                else:
                    # close execution logs and quit
                    self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                                "XYZ Data was not formed" )


        # this will go in the project tree line
        if have_results:
            self.generic_parser_summary["gemmi"] = {
                "summary_line" : "results saved"
            }

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = Gemmi ( "",os.path.basename(__file__) )
    drv.start()
