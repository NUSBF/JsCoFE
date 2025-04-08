##!/usr/bin/python

#
# ============================================================================
#
#    06.04.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  FITLIGAND EXECUTABLE MODULE
#
#  Command-line:
#     ccp4-python -m pycofe.tasks.fitligand jobManager jobDir jobId
#
#  where:
#    jobManager  is either SHELL or SGE
#    jobDir   is path to job directory, having:
#      jobDir/output  : directory receiving output files with metadata of
#                       all successful imports
#      jobDir/report  : directory receiving HTML report
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2025
#
# ============================================================================
#

#  python native imports
import os
import sys

# import gemmi
# from   gemmi        import  cif
import chapi

#  application imports
from . import basic
from   pycofe.proc  import coor
from   pycofe.auto  import auto, auto_workflow
from   pycofe.varut import mmcif_utils

# ============================================================================
# Make Refmac driver

class FitLigand(basic.TaskDriver):

    # ------------------------------------------------------------------------

    def run(self):

        # Prepare makeligand input
        # fetch input data

        istruct = self.makeClass ( self.input_data.data.istruct[0] )
        ligand  = self.makeClass ( self.input_data.data.ligand [0] )
        sec1    = self.task.parameters.sec1.contains

        # make command-line parameters
        xyzin   = istruct.getXYZFilePath ( self.inputDir() )
        mtzin   = istruct.getMTZFilePath ( self.inputDir() )
        libin   = ligand .getLibFilePath ( self.inputDir() )

        mc          = chapi.molecules_container_t ( False )
        imol_enc    = mc.get_imol_enc_any()
        imol        = mc.read_coordinates ( xyzin )
        mc.import_cif_dictionary ( libin,imol_enc )
        imol_ligand = mc.get_monomer ( ligand.code )

        # rn = mc.get_residue_name(imol, 'A', 401, "")
        # print("residue name", rn)
        # mc.delete_residue(imol, 'A', 401, "")

        F   = istruct.FWT
        PHI = istruct.PHI
        if istruct.mapSel=="diffmap":
            F   = istruct.DELFWT
            PHI = istruct.PHDELWT

        self.stdoutln ( " >>>> 1 " + str(mtzin) + " " + str(F) + " " + str(PHI) )

        imol_map = mc.read_mtz ( mtzin,F,PHI, "", False, False )

        results = mc.fit_ligand ( imol, imol_map, imol_ligand, 1.0, True, 200)

        self.stdoutln ( " >>>>> " + str(results))
        self.stdoutln ( " >>>>> " + str(dir(results[0])) )

        fs0 = -1.0
        r0  = None
        for i in range(len(results)):
            fscore = results[i].get_fitting_score()
            if fscore>fs0:
                s0 = fscore
                r0 = results[i]

        self.stdoutln ( " >>>>> s0=" + str(s0))

        have_results = False
        nligs = 0

        if r0:

            xyzout = self.getCIFOFName()

            imol_copy = mc.copy_molecule ( imol )
            mc.merge_molecules   ( imol_copy, str(r0.imol) )
            mc.write_coordinates ( imol_copy,"__merged.cif" )

            mmcif_utils.clean_mmcif ( "__merged.cif",xyzout )

            self.stdoutln ( " >>>>> istruct.ligands=" + str(istruct.ligands))
            self.stdoutln ( " >>>>> ligand.code=" + str(ligand.code))

            # prepare dictionary file for structure
            libadd = libin
            libstr = istruct.getLibFilePath ( self.inputDir() )
            self.stdoutln ( " >>>>> libstr=" + str(libstr))
            if libstr and not ligand.code in istruct.ligands:
                # this is not the first ligand in structure, append it to
                # the previous one(s) with libcheck

                libadd = self.outputFName + ".dict.cif"

                self.open_stdin()
                self.write_stdin (
                    "_Y"          +\
                    "\n_FILE_L  " + libstr +\
                    "\n_FILE_L2 " + libin  +\
                    "\n_FILE_O  " + libadd +\
                    "\n_END\n" )
                self.close_stdin()

                self.runApp ( "libcheck",[],logType="Service" )

                libadd += ".lib"

            nligs  = 1
            structure = self.registerStructure ( 
                            xyzout,
                            None,
                            None,
                            mtzin,
                            libPath  = libadd,
                            mapPath  = istruct.getMapFilePath (self.inputDir()),
                            dmapPath = istruct.getDMapFilePath(self.inputDir()),
                            leadKey  = istruct.leadKey,
                            refiner  = istruct.refiner 
                        )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.addLigand        ( ligand.code )
                self.putTitle   ( "Results" )
                self.putMessage ( "<b>Total " + str(nligs) + " '" + ligand.code +\
                                  "' ligands were fitted</b><br>&nbsp;" )
                self.putStructureWidget ( "structure_btn_",
                                          "Structure and electron density",
                                          structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                revision.addLigandData    ( ligand    )
                self.registerRevision     ( revision  )

                have_results = True

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision"  : [revision]
                            }
                    })
                        # self.putMessage ( "<h3>Workflow started</hr>" )

                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "nfitted"  : str(nligs)
                    })

        else:
            self.putTitle ( "Ligand " + ligand.code + " could not be fit in density" )

        # this will go in the project tree job's line
        self.generic_parser_summary["fitligand"] = {
          "summary_line" : "N<sub>fitted</sub>=" + str(nligs)
        }

        # for i,r in enumerate(results):
        #     self.stdoutln ( " >>>> [" + str(i) + "] " + str(r.get_fitting_score()) + " " + str(r.ligand_idx) + str(r.imol) )
        #     imol_copy = mc.copy_molecule ( imol )
        #     mc.merge_molecules ( imol_copy, str(r.imol) )
        #     fn = "complex-" + str(i) + "-pre-ref.cif"
        #     mc.write_coordinates ( imol_copy, fn )
        #     # look at the label for the comp_id and the label residue number
        #     # they could be more useful. Can you fix it?
        #     mc.refine_residues_using_atom_cid (imol_copy, "//A/765", "SPHERE", 2000)
        #     fn = "complex-" + str(i) + "-post-ref.cif"
        #     mc.write_coordinates(imol_copy, fn)

        # close execution logs and quit
        self.success ( have_results )
        return

        """
        cmd = [ "--pdbin"       ,pdbin,
                "--hklin"       ,mtzin,
                "--dictionary"  ,libin,
                "--clusters"    ,self.getParameter(sec1.NCLUST),
                "--fit-fraction",self.getParameter(sec1.FIT_FRACTION)
              ]

        if istruct.mapSel=="diffmap":
            cmd += [
                "--f"     ,istruct.DELFWT,
                "--phi"   ,istruct.PHDELWT,
            ]
        else:
            cmd += [
                "--f"     ,istruct.FWT,
                "--phi"   ,istruct.PHI,
            ]

        if self.getParameter(sec1.LEVEL_SEL)=="sigma":
            cmd +=["--sigma",self.getParameter(sec1.SIGMA)]
        else:
            cmd +=["--absolute",self.getParameter(sec1.ABSOLUTE)]

        if self.getParameter(sec1.FLEXIBLE_CBX)=="True":
            cmd +=["--flexible","--samples",self.getParameter(sec1.SAMPLES)]

        # mmCIF version of atomic coordinates file
        # fin = ligand.getLibFilePath ( self.inputDir() )
        # doc = cif.Document()
        # doc.source = fin
        # doc.parse_file ( fin )
        # doc.check_for_missing_values()

        # block = doc["comp_"+ligand.code]
        # st = gemmi.make_structure_from_chemcomp_block ( block )
        # st[0][0][0].seqid = gemmi.SeqId('1')
        # # st.write_pdb ( fileXYZ )
        # mmCIFin = ligand.code + '.mmcif'
        # st.make_mmcif_document().write_file ( mmCIFin )
        # cmd += [mmCIFin]

        # PDBIN version
        cmd += [ligand.getPDBFilePath(self.inputDir())]

        # mmCIF version works but does not provide for long ligand codes,
        # which is fitligand's feature; therefore, currently not used
        # cmd += [ligand.getMMCIFFilePath(self.inputDir())]

        # --pdbin pdb-in-filename --hklin mtz-filename
        # --f f_col_label --phi phi_col_label
        # --clusters nclust
        # --sigma sigma-level
        # --absolute level
        # --fit-fraction frac
        # --flexible
        # --samples nsamples
        # --sampling-rate map-sampling-rate
        # --dictionary cif-dictionary-name

        # Start findligand
        if sys.platform.startswith("win"):
            self.runApp ( "findligand.bat",cmd,logType="Main" )
        else:
            self.runApp ( "findligand",cmd,logType="Main" )


        nligs   = 0
        ligands = [fn for fn in os.listdir("./") if fn.endswith(".pdb")]
        have_results = False
        if len(ligands)>=0:

            # prepare dictionary file for structure
            libadd = libin
            libstr = istruct.getLibFilePath ( self.inputDir() )
            if libstr and not ligand.code in istruct.ligands:
                # this is not the first ligand in structure, append it to
                # the previous one(s) with libcheck

                libadd = self.outputFName + ".dict.cif"

                self.open_stdin()
                self.write_stdin (
                    "_Y"          +\
                    "\n_FILE_L  " + libstr +\
                    "\n_FILE_L2 " + libin  +\
                    "\n_FILE_O  " + libadd +\
                    "\n_END\n" )
                self.close_stdin()

                self.runApp ( "libcheck",[],logType="Service" )

                libadd += ".lib"

            pdbout = self.outputFName + ".pdb"
            #self.stdoutln ( "pdbin="+str(pdbin) )
            #self.stdoutln ( "ligands="+str(ligands) )
            #import shutil
            #shutil.copyfile ( pdbin,"pdbin.xxx" )
            #shutil.copyfile ( ligands[0],"ligandin.yyy" )
            nligs  = coor.mergeLigands ( pdbin,ligands,"X",pdbout )
            structure = self.registerStructure ( 
                                None,
                                pdbout,
                                None,
                                mtzin,
                                libPath  = libadd,
                                mapPath  = istruct.getMapFilePath (self.inputDir()),
                                dmapPath = istruct.getDMapFilePath(self.inputDir()),
                                leadKey  = istruct.leadKey,
                                refiner  = istruct.refiner 
                            )
            if structure:
                structure.copy_refkeys_parameters ( istruct )
                structure.copyAssociations ( istruct )
                structure.copySubtype      ( istruct )
                structure.copyLabels       ( istruct )
                structure.copyLigands      ( istruct )
                structure.addLigand        ( ligand.code )
                self.putTitle ( "Results" )
                self.putMessage ( "<b>Total " + str(nligs) + " '" + ligand.code +\
                                  "' ligands were fitted</b><br>&nbsp;" )
                self.putStructureWidget ( "structure_btn_",
                                          "Structure and electron density",
                                          structure )
                # update structure revision
                revision = self.makeClass ( self.input_data.data.revision[0] )
                revision.setStructureData ( structure )
                revision.addLigandData    ( ligand    )
                self.registerRevision     ( revision  )

                have_results = True

                if self.task.autoRunName.startswith("@"):
                    # scripted workflow framework
                    auto_workflow.nextTask ( self,{
                            "data" : {
                                "revision"  : [revision]
                            }
                    })
                        # self.putMessage ( "<h3>Workflow started</hr>" )

                else:  # pre-coded workflow framework
                    auto.makeNextTask ( self,{
                        "revision" : revision,
                        "nfitted"  : str(nligs)
                    })

        else:
            self.putTitle ( "Ligand " + ligand.code + " could not be fit in density" )


        # this will go in the project tree job's line
        self.generic_parser_summary["fitligand"] = {
          "summary_line" : "N<sub>fitted</sub>=" + str(nligs)
        }

        # close execution logs and quit
        self.success ( have_results )
        return
        """


# ============================================================================

if __name__ == "__main__":

    drv = FitLigand ( "",os.path.basename(__file__) )
    drv.start()
