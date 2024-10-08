##!/usr/bin/python

#
# ============================================================================
#
#    28.03.24   <--  Date of Last Modification.
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
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2024
#
# ============================================================================
#

#  python native imports
import os
import json

import gemmi

#  application imports
from  pycofe.tasks  import basic
from  pycofe.dtypes import dtype_template,dtype_xyz,dtype_ensemble,dtype_model
from  pycofe.dtypes import dtype_sequence, dtype_revision
from  pycofe.proc   import import_sequence,import_filetype
from  pycofe.auto   import auto, auto_workflow
from  pycofe.varut  import mmcif_utils


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


    def makeXYZOutput ( self,istruct,ixyz,mmcifout,pdbout ):

        results = False

        if istruct._type==dtype_xyz.dtype():
            self.putTitle ( "Modified coordinate data" )
            oxyz = self.registerXYZ ( mmcifout,None,checkout=True )
            if oxyz:
                # oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
                self.putMessage (
                    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                    oxyz.dname )
                self.putXYZWidget ( self.getWidgetId("xyz_btn"),
                                    "Edited coordinates",oxyz )
                results = True
            else:
                # close execution logs and quit
                self.fail ( "<h3>XYZ Data was not formed (error)</h3>",
                            "XYZ Data was not formed" )

        elif istruct._type==dtype_model.dtype():
            self.putTitle ( "Modified MR model" )
            seq  = None
            if ixyz.sequence:
                seq = self.makeClass ( ixyz.sequence )
            oxyz = self.registerModel ( seq,pdbout,checkout=True )
            if oxyz:
                self.putModelWidget ( self.getWidgetId("model_btn"),"Coordinates:&nbsp;",oxyz )
                results = True
            else:
                # close execution logs and quit
                self.fail ( "<h3>MR Model was not formed (error)</h3>",
                            "MR Model was not formed" )

        elif istruct._type==dtype_ensemble.dtype():
            self.putTitle ( "Modified MR ensemble" )
            seq  = None
            if ixyz.sequence:
                seq = self.makeClass ( ixyz.sequence )
            oxyz = self.registerEnsemble ( seq,pdbout,checkout=True )
            if oxyz:
                self.putEnsembleWidget ( self.getWidgetId("ensemble_btn"),"Coordinates:&nbsp;",oxyz )
                results = True
            else:
                # close execution logs and quit
                self.fail ( "<h3>MR Ensemble was not formed (error)</h3>",
                            "MR Ensemble was not formed" )

        elif istruct._type==dtype_revision.dtype():
            self.putTitle ( "Modified Structure" )
            oxyz = self.registerStructure ( 
                        mmcifout,
                        pdbout,
                        ixyz.getSubFilePath(self.inputDir()),
                        ixyz.getMTZFilePath(self.inputDir()),
                        libPath    = ixyz.getLibFilePath(self.inputDir()),
                        mapPath    = ixyz.getMapFilePath(self.inputDir()),
                        dmapPath   = ixyz.getDMapFilePath(self.inputDir()),
                        leadKey    = ixyz.leadKey,
                        copy_files = False,
                        map_labels = ixyz.mapLabels,
                        refiner    = ixyz.refiner 
                    )
            if oxyz:
                oxyz.copy_refkeys_parameters ( ixyz )
                oxyz.copyAssociations   ( ixyz )
                oxyz.addDataAssociation ( ixyz.dataId )  # ???
                oxyz.copySubtype        ( ixyz )
                oxyz.copyLigands        ( ixyz )
                oxyz.copyLabels         ( ixyz )
                if not pdbout and (not mmcifout):
                    oxyz.removeSubtype ( dtype_template.subtypeXYZ() )
                #self.putMessage (
                #    "<b>Assigned name&nbsp;&nbsp;&nbsp;:</b>&nbsp;&nbsp;&nbsp;" +
                #    oxyz.dname )
                self.putStructureWidget ( self.getWidgetId("structure_btn"),
                                            "Structure and electron density",
                                            oxyz )
                # update structure revision
                revision = self.makeClass ( istruct  )
                revision.setStructureData ( oxyz     )
                self.registerRevision     ( revision )
                results = True


                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision"  : [revision]
                            }
                    })
                        # self.putMessage ( "<h3>Workflow started</hr>" )
                else:  # pre-coded workflow framework
                    auto.makeNextTask(self, {
                            "revision": revision 
                        }, log=self.file_stderr)

            else:
                # close execution logs and quit
                self.fail ( "<h3>Structure was not formed (error)</h3>",
                            "Structure was not formed" )

        return results


    def run(self):

        # fetch input data
        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        ixyz    = self.makeClass ( self.input_data.data.ixyz[0] )
        mmcifin = ixyz.getMMCIFFilePath ( self.inputDir() )
        pdbin   = ixyz.getPDBFilePath   ( self.inputDir() )
        sec1    = self.task.parameters.sec1.contains

        #self.stdoutln ( ixyz.to_JSON() )
        
        if not mmcifin and pdbin:
            mmcifin = mmcif_utils.convert_to_mmcif ( pdbin )
        elif not pdbin and mmcifin:
            pdbin, pdb_nogood = mmcif_utils.convert_to_pdb ( mmcifin )
            if not pdbin:
                self.stdoutln ( " +++++ XYZ file cannot be converted to PDB format.\n" +\
                                "       Reason: " + pdb_nogood )
                self.putMessage ( "<b><i>FYI: XYZ input cannot be converted to PDB format.<b>" +\
                                  "Reason: " + pdb_nogood + "</i></b>" )

        # --------------------------------------------------------------------

        log = []

        mmcifout = ixyz.lessDataId ( ixyz.getMMCIFFileName() )
        self.outputFName = os.path.splitext(mmcifout)[0]

        pdbout = ixyz.lessDataId ( ixyz.getPDBFileName() )  # may be None

        action_sel = self.getParameter ( sec1.ACTION_SEL )

        if action_sel=="P":
            # run PDBSET

            mmcifout = None

            log.append ( "PDBSET" )

            self.open_stdin()
            self.write_stdin ( self.getParameter(sec1.PDBSET_INPUT) )
            self.close_stdin()

            # Run PDBSET
            self.runApp (
                "pdbset",["XYZIN",pdbin,"XYZOUT",pdbout],
                # "pdbset",["XYZIN",mmcifin,"XYZOUT",mmcifout],
                logType="Main"
            )

        elif action_sel=="R":

            commands = self.getParameter(sec1.RENAME_INPUT).splitlines()
            chains   = {}
            check    = {}
            summary  = []
            opkey    = 0
            errors   = False
            for c in commands:
                summary.append ( c )
                words = c.split("#")[0].split()
                if len(words)==3 and words[0].upper()=="CHAIN":
                    if opkey==1:
                        summary.append ( " >>> a mix of CHAIN and PDB keys not allowed" )
                        errors = True
                    elif words[1] in chains:
                        summary.append ( " >>> repeat use of chain name " + words[1] )
                        errors = True
                    elif words[2] in check:
                        summary.append ( " >>> repeat use of chain name " + words[2] )
                        errors = True
                    else:
                        chains[words[1]] = [words[2],False]
                        check[words[2]]  = 1
                        opkey = -1
                elif len(words)==1 and words[0].upper()=="PDB":
                    if opkey==-1:
                        summary.append ( " >>> a mix of CHAIN and PDB keys not allowed" )
                        errors = True
                    else:
                        opkey = 1
                elif len(words)>0:
                    summary.append ( " >>> statement not understood" )
                    errors = True

            if errors:
                self.putMessage ( "<b>Input summary:</b><br><pre>" +\
                                  "\n".join(summary) + "</pre>" )
                self.putMessage ( "<p><b>Input errors, stop.</b>" )

            elif opkey==0:
                self.putMessage ( "<b>Input summary:</b><br><pre>" +\
                                  "\n".join(summary) + "</pre>" )
                self.putMessage ( "<p><b>No instructions given, stop.</b>" )
                errors = True
            
            else:
            
                st = gemmi.read_structure ( mmcifin )
                st.setup_entities()

                if opkey==1:
                    log.append ( "truncate chain names" )
                    if not mmcif_utils.translate_to_pdb(st):
                        self.putMessage ( "<b>XYZ data cannot be made PDB-compatible</b>" )
                        errors = True
                else:
                    log.append ( "rename chains" )
                    for model in st:
                        for chain in model:
                            if chain.name in chains:
                                chains[chain.name][1] = True
                                chain.name = chains[chain.name][0]
                    summary = []
                    for name in chains:
                        if not chains[name][1]:
                            summary.append ( name )
                    if len(summary)>0:
                        self.putMessage ( "<b>Chains " + ",".join(summary) +\
                                          " not found, stop</b>")
                        errors = True

            if not errors:
                st.setup_entities()
                st.make_mmcif_document().write_file ( mmcifout )
                pdbout = None

        else:
            # make model transformations

            if action_sel=="B":
                ixyz.BF_correction = "none"  # hard ball
                bfactor_sel = self.getParameter ( sec1.BFACTORS_SEL )
                ixyz.fixBFactors ( self.inputDir(),bfactor_sel )
                log.append ( "B-factors recalculated assuming " +\
                             bfactor_sel.capitalize() + " model" )

            st = gemmi.read_structure ( mmcifin )
            st.setup_entities()

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
                        # if len(st)>1:
                        #     pdbout = self.getOFName ( "." + model.name + "." + chain.name + ".pdb" )
                        # else:
                        #     pdbout = self.getOFName ( "." + chain.name + ".pdb" )
                        # st1.write_pdb ( pdbout )
                        # oxyz = self.registerXYZ ( None,pdbout,checkout=True )
                        if len(st)>1:
                            mmcifout = self.getOFName ( "." + model.name + "." + chain.name + ".mmcif" )
                        else:
                            mmcifout = self.getOFName ( "." + chain.name + ".mmcif" )
                        st1.make_mmcif_document().write_file ( mmcifout )
                        oxyz = self.registerXYZ ( mmcifout,None,checkout=True )
                        if oxyz:
                            # oxyz.putXYZMeta  ( self.outputDir(),self.file_stdout,self.file_stderr,None )
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

        elif action_sel=="T" or action_sel=="B":

            if len(log)>0:

                # st.write_pdb ( pdbout )
                st.make_mmcif_document().write_file ( mmcifout )
                pdbout = None

                self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                                  "</i> transformed:</b><ul><li>" +\
                                  "</li><li>".join(log) +\
                                  "</li></ul>" )

                if nchains<=0 and istruct._type!=dtype_revision.dtype():

                    self.putMessage ( "<b>All data removed -- no output produced</b>" )
                    log = ["all coordinates removed"]

                else:

                    if istruct._type==dtype_revision.dtype() and nchains<=0:
                        pdbout = None
                        log    = ["all coordinates removed"]

                    have_results = self.makeXYZOutput ( istruct,ixyz,mmcifout,pdbout )

            else:
                self.putMessage ( "&nbsp;<br><b>Data object <i>" + ixyz.dname +\
                                  "</i> was not modified -- no output produced</b>" )

        elif action_sel=="P":
            self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                              "</i> transformed with PDBSET</b><p>PDBSET script:<pre>" +\
                              self.getParameter(sec1.PDBSET_INPUT) + "</pre>" )
            have_results = self.makeXYZOutput ( istruct,ixyz,mmcifout,pdbout )
        elif action_sel=="R":
            if os.path.isfile(mmcifout):
                self.putMessage ( "<b>Data object <i>" + ixyz.dname +\
                                  "</i> transformed as:<pre>" +\
                                  self.getParameter(sec1.RENAME_INPUT) + "</pre>" )
                pdbout = None
                have_results = self.makeXYZOutput ( istruct,ixyz,mmcifout,pdbout )

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
