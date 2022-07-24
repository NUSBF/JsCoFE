##!/usr/bin/python

#
# ============================================================================
#
#    24.07.22   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2022
#
# ============================================================================
#

#  python native imports
import os
import json

import gemmi

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble
from  pycofe.dtypes import dtype_structure,dtype_revision
from  pycofe.dtypes import dtype_sequence
from  pycofe.proc   import import_sequence,import_filetype
from  pycofe.auto   import auto


# ============================================================================
# Make XUZ Utilities driver

class XyzUtils(basic.TaskDriver):

    def importDir(self): return "." # in current directory ( job_dir )

    # ------------------------------------------------------------------------

    def chainType ( self,xyz,model,chain ):
        meta  = xyz.xyzmeta.xyz
        type  = ""
        cdesc = None
        for i in range(len(meta)):
            if str(meta[i].model)==model.name:
                cdesc = meta[i].chains
                for j in range(len(cdesc)):
                    if cdesc[j].id==chain.name:
                        type = cdesc[j].type
                        break
                break
        return type


    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        ixyz    = self.makeClass ( self.input_data.data.ixyz[0] )
        xyzpath = ixyz.getXYZFilePath ( self.inputDir() )
        sec1    = self.task.parameters.sec1.contains

        #self.stdoutln ( ixyz.to_JSON() )

        # --------------------------------------------------------------------

        st = gemmi.read_structure ( xyzpath )

        log = []
        action_sel = self.getParameter ( sec1.ACTION_SEL )
        sollig_sel = self.getParameter ( sec1.SOLLIG_SEL )
        chains_sel = self.getParameter ( sec1.CHAINS_SEL )

        if sollig_sel=="W":
            log.append ( "waters removed" )
            st.remove_waters()

        elif sollig_sel=="WL":
            log.append ( "waters and ligands removed" )
            st.remove_ligands_and_waters()

        if chains_sel=="P":
            clist = []
            for model in st:
                cnames = []
                for chain in model:
                    if self.chainType(ixyz,model,chain)=="Protein":
                        cnames.append ( chain.name )
                for name in cnames:
                    if name not in clist:
                        clist.append ( name )
                    model.remove_chain ( name )
            if len(clist)>0:
                log.append ( "protein chain(s) " + ",".join(clist) + " removed" )
            else:
                self.putMessage ( "** protein chains not found" )

        elif chains_sel=="D":
            clist = []
            for model in st:
                cnames = []
                for chain in model:
                    if self.chainType(ixyz,model,chain) in ["DNA","RNA"]:
                        cnames.append ( chain.name )
                for name in cnames:
                    if name not in clist:
                        clist.append ( name )
                    model.remove_chain ( name )
            if len(clist)>0:
                log.append ( "dna/rna chain(s) " + ",".join(clist) + " removed" )
            else:
                self.putMessage ( "** dna/rna chains not found" )

        elif chains_sel=="S":
            slist = [x.strip() for x in self.getParameter(sec1.CHAIN_LIST).split(",")]
            clist = []
            for model in st:
                chain_list = [ch.name for ch in model if ch.name in slist]
                for name in slist:
                    if name in chain_list:
                        if name not in clist:
                            clist.append ( name )
                        model.remove_chain ( name )
            if len(clist)<len(slist):
                self.putMessage ( "** chain(s) " +\
                                  ",".join([x for x in slist if x not in clist]) +\
                                  " not found" )
            if len(clist)>0:
                log.append ( "chain(s) " + ",".join(clist) + " removed" )

        if action_sel=="E":
            st.remove_ligands_and_waters()
        st.remove_empty_chains()

        nchains = 0
        for model in st:
            nchains += len(model)

        have_results = False

        xyzout = ixyz.lessDataId ( ixyz.getXYZFileName() )
        self.outputFName = os.path.splitext(xyzout)[0]

        #if self.getParameter(sec1.SPLITTOCHAINS_CBX)=="True":
        if action_sel=="S":
            log.append ( "split in chains" )
            self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                              "</i> transformed:</b><ul><li>" +\
                              "</li><li>".join(log) +\
                              "</li></ul>" )
            if nchains<=0 and istruct._type!=dtype_revision.dtype():
                self.putMessage ( "<b>All data removed -- no output produced</b>" )
                log = ["all coordinates removed"]
            else:
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
                                "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                                oxyz.dname )
                            if len(st)>1:
                                self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                                    "Model "   + model.name +\
                                                    ", chain " + chain.name,oxyz )
                            else:
                                self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                                    "Chain " + chain.name,oxyz )
                            have_results = True
                            self.putMessage ( "&nbsp;" )
                        else:
                            # close execution logs and quit
                            self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                                        "XYZ Data was not formed" )

        if action_sel=="E":
            log.append ( "extract sequences" )
            self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                              "</i> transformed:</b><ul><li>" +\
                              "</li><li>".join(log) +\
                              "</li></ul>" )
            if nchains<=0 and istruct._type!=dtype_revision.dtype():
                self.putMessage ( "<b>All data removed -- no output produced</b>" )
                log = ["all coordinates removed"]
            else:
                self.putTitle ( "Results" )
                annotation = { "rename":{}, "annotation":[] }
                st.setup_entities()
                for model in st:
                    for chain in model:
                        polymer = chain.get_polymer()
                        t       = polymer.check_polymer_type()
                        seqline = str(polymer.make_one_letter_sequence())
                        stype   = None
                        if t in (gemmi.PolymerType.PeptideL, gemmi.PolymerType.PeptideD):
                            stype = "protein"
                        elif t==gemmi.PolymerType.Dna:
                            stype = "dna"
                        elif t==gemmi.PolymerType.Rna:
                            stype = "rna"
                        elif t==gemmi.PolymerType.DnaRnaHybrid:
                            stype = "na"
                        # disqualify too short protein and na chains
                        if ((stype=="protein") and (len(polymer)<=20)) or (len(polymer)<=6):
                            stype = None

                        if stype:
                            if len(st)>1:
                                seqname = self.getOFName ( "_" + model.name + "." + chain.name )
                            else:
                                seqname = self.getOFName ( "_" + chain.name )
                            seqout  = seqname + ".fasta"
                            dtype_sequence.writeSeqFile ( os.path.join(self.importDir(),seqout),
                                                          seqname,seqline )
                            self.addFileImport ( seqout,import_filetype.ftype_Sequence() )
                            annotation["annotation"].append ({
                                "file"   : seqout,
                                "rename" : seqout,
                                "items"  : [
                                    { "rename"   : seqout,
                                      "contents" : seqname + "\n" + seqline,
                                      "type"     : stype
                                    }
                                ]
                            })
                            have_results = True

                f = open ( "annotation.json","w" )
                f.write ( json.dumps(annotation) )
                f.close ()

                self.stdoutln ( " annotation=" + str(annotation) )

                import_sequence.run ( self )
                self.addCitation ( "default" )

        elif action_sel=="T":

            if len(log)>0:

                st.write_pdb ( xyzout )

                self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                                  "</i> transformed:</b><ul><li>" +\
                                  "</li><li>".join(log) +\
                                  "</li></ul>" )

                if nchains<=0 and istruct._type!=dtype_revision.dtype():

                    self.putMessage ( "<b>All data removed -- no output produced</b>" )
                    log = ["all coordinates removed"]

                else:

                    self.putTitle ( "Results" )

                    if istruct._type==dtype_xyz.dtype():
                        oxyz = self.registerXYZ ( xyzout,checkout=True )
                        if oxyz:
                            oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                            self.putMessage (
                                "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                                oxyz.dname )
                            self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                                "Edited coordinates",oxyz )
                            have_results = True
                        else:
                            # close execution logs and quit
                            self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                                        "XYZ Data was not formed" )

                    elif istruct._type==dtype_ensemble.dtype():
                        seq  = None
                        if ixyz.sequence:
                            seq = self.makeClass ( ixyz.sequence )
                        oxyz = self.registerEnsemble ( seq,xyzout,checkout=True )
                        if oxyz:
                            self.putEnsembleWidget ( "ensemble_btn","Coordinates",oxyz )
                            have_results = True
                        else:
                            # close execution logs and quit
                            self.fail ( "<h3>Ensemble was not formed (error)</h3>",
                                        "Ensemble was not formed" )

                    elif istruct._type==dtype_revision.dtype():
                        if nchains<=0:
                            xyzout = None
                            log    = ["all coordinates removed"]
                        oxyz = self.registerStructure ( xyzout,
                                             ixyz.getSubFilePath(self.inputDir()),
                                             ixyz.getMTZFilePath(self.inputDir()),
                                             ixyz.getMapFilePath(self.inputDir()),
                                             ixyz.getDMapFilePath(self.inputDir()),
                                             libPath=ixyz.getLibFilePath(self.inputDir()),
                                             leadKey=ixyz.leadKey,copy_files=False,
                                             map_labels=ixyz.mapLabels,
                                             refiner=ixyz.refiner )
                        if oxyz:
                            oxyz.copyAssociations   ( ixyz )
                            oxyz.addDataAssociation ( ixyz.dataId )  # ???
                            oxyz.copySubtype        ( ixyz )
                            oxyz.copyLigands        ( ixyz )
                            if not xyzout:
                                oxyz.removeSubtype ( dtype_template.subtypeXYZ() )
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
                            have_results = True

                            auto.makeNextTask(self, {
                                "revision": revision }, log=self.file_stderr)

                        else:
                            # close execution logs and quit
                            self.fail ( "<h3>Structure was not formed (error)</h3>",
                                        "Structure was not formed" )

            else:
                self.putMessage ( "&nbsp;<br><b>Data object <i>" + ixyz.dname +\
                                  "</i> was not modified -- no output produced</b>" )

        # this will go in the project tree line
        if len(log)>0:
            self.generic_parser_summary["xyzutils"] = {
              "summary_line" : ", ".join(log)
            }

        # close execution logs and quit
        self.success ( have_results )

        return


# ============================================================================

if __name__ == "__main__":

    drv = XyzUtils ( "",os.path.basename(__file__) )
    drv.start()
