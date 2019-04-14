##!/usr/bin/python

#
# ============================================================================
#
#    08.04.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LIGAND DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-19
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  ccp4-python imports
import pyrvapi
import gemmi
from   gemmi         import  cif

#  application imports
from   pycofe.dtypes import dtype_ligand
from   pycofe.varut  import command
from   pycofe.proc   import import_filetype


# ============================================================================
# import coordinate files function

def run ( body ):  # body is reference to the main Import class

    files_lig = []
    for f in body.files_all:
        if body.checkFileImport ( f,import_filetype.ftype_Ligand() ):
            files_lig.append ( f )

    if len(files_lig) <= 0:
        return

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF LIGAND COORDINATES AND RESTRAINTS\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    ligSecId = None
    k        = 0
    for f in files_lig:

        body.files_all.remove ( f )

        fin  = os.path.join ( body.importDir(),f )
        doc  = cif.read ( fin )
        ftmp = "__ligand_tmp.cif"
        wrow = 0
        subSecId = None
        for block in doc:

            col = block.find_values("_chem_comp_atom.comp_id")

            if col:
                code    = col[0]
                fout    = code
                fileXYZ = fout + ".pdb"
                fileCIF = fout + ".cif"

                # fetch the block in a temporary document
                doc_tmp = cif.Document()
                doc_tmp.add_copied_block(block)

                # check whether the block has coordinates
                if block.find_values('_chem_comp_atom.x'):
                    # then simply write out the block and coordinates
                    doc_tmp.write_file ( fileCIF )
                    st = gemmi.make_structure_from_chemcomp_block(block)
                    st.write_pdb ( fileXYZ )
                else:
                    # generate coordinates with AceDrg
                    # firstly write out temporary document
                    doc_tmp.write_file ( ftmp )

                    # Start acedrg (only to calculate coordinates for ligand visualisation)
                    rc = command.call ( "acedrg",["-c",ftmp,"-r",code,"-o",fout],"./",
                                        None,body.file_stdout,body.file_stderr )

                    shutil.copyfile ( ftmp,fileCIF )  # use ORIGINAL restraints

                if not os.path.isfile(fileXYZ) or not os.path.isfile(fileCIF):

                    body.putSummaryLine_red ( f,"UNKNOWN","Failed to recognise, ignored" )

                else:

                    # Register output data. This moves needful files into output directory
                    # and puts the corresponding metadata into output databox

                    ligand = body.registerLigand ( fileXYZ,fileCIF )

                    if ligand:

                        ligand.code = code

                        if not ligSecId:
                            ligSecId = body.getWidgetId ( "_lig_sec_" )
                            pyrvapi.rvapi_add_section ( ligSecId,"Ligands",body.report_page_id(),
                                                        body.rvrow,0,1,1,False )

                        if len(files_lig)>1:
                            if not subSecId:
                                subSecId = ligSecId + str(k)
                                pyrvapi.rvapi_add_section ( subSecId,"Import "+f,ligSecId,
                                                                             k,0,1,1,False )
                        else:
                            subSecId = ligSecId

                        if wrow:
                            body.putHR1 ( subSecId,wrow )
                            wrow += 1
                        body.putLigandWidget1 ( subSecId,"ligand_btn_","Ligand structure",
                                                ligand,-1,wrow,1 )
                        body.putSummaryLine ( f,"LIGAND",ligand.dname )
                        wrow += 2

                    else:
                        body.putSummaryLine_red ( f,"UNKNOWN","Failed to form ligand data" )


        body.file_stdout.write ( "... processed: " + f + "\n" )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return
