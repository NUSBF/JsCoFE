##!/usr/bin/python

#
# ============================================================================
#
#    11.06.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LIGAND DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2020
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

    for f in files_lig:
        body.files_all.remove ( f )
    files_xyz = body.despaceFileNames ( files_lig,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF LIGAND COORDINATES AND RESTRAINTS\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    ligSecId = None
    libSecId = None
    ligrow   = 0
    librow   = 0
    k        = 0
    for f in files_lig:

        fin       = os.path.join ( body.importDir(),f )
        doc       = cif.read ( fin )
        comp_list = doc["comp_list"]
        comp_id   = None
        if comp_list:
            comp_id = comp_list.find_values ( "_chem_comp.id" )
        if not comp_id or len(doc)<len(comp_id)+1:
            body.putSummaryLine_red ( f,"UNKNOWN","Not a ligand library file" )
            body.stdout ( "\n ***** file " + f +\
                " does not contain _chem_comp loop or data_comp_list data block or both.\n\n"  )

        elif len(comp_id)==1:
            # single ligand entry, import as a ligand object

            block = doc["comp_"+comp_id[0]]
            col   = None
            if block:
                col = block.find_values("_chem_comp_atom.comp_id")

            if col:
                code    = col[0]
                fout    = code
                fileXYZ = fout + ".pdb"
                fileCIF = fout + ".cif"

                if block.find_values('_chem_comp_atom.x'):
                    # then simply write out the block and coordinates
                    shutil.copyfile ( fin,fileCIF )
                    st = gemmi.make_structure_from_chemcomp_block ( block )
                    st.write_pdb    ( fileXYZ )
                else:
                    # generate coordinates with AceDrg
                    # firstly write out temporary document
                    # fetch the block in a temporary document
                    ftmp    = "__ligand_tmp.cif"
                    doc_tmp = cif.Document()
                    doc_tmp.add_copied_block ( block )
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

                        subSecId = ligSecId
                        if ligrow:
                            body.putHR1 ( subSecId,ligrow )
                            ligrow += 1
                        body.putLigandWidget1 ( subSecId,"ligand_btn_","Ligand structure",
                                                ligand,-1,ligrow,1 )
                        body.putSummaryLine ( f,"LIGAND",ligand.dname )
                        ligrow += 2

                    else:
                        body.putSummaryLine_red ( f,"UNKNOWN","Failed to form ligand data" )

            else:
                body.putSummaryLine_red ( f,"UNKNOWN","Failed to recognise data content" )

        else:
            #  multi-entry file, import as a library object
            library = body.registerLibrary ( fin,copy_files=False )
            if library:
                library.codes = []
                for i in range(len(comp)):
                    library.codes.append ( comp[i] )
                if not libSecId:
                    libSecId = body.getWidgetId ( "_lib_sec_" )
                    pyrvapi.rvapi_add_section ( libSecId,"Libraries",body.report_page_id(),
                                                body.rvrow,0,1,1,False )
                subSecId = libSecId
                if librow:
                    body.putHR1 ( subSecId,librow )
                    librow += 1
                body.putLibraryWidget1 ( subSecId,"Ligand library",library,librow,1 )
                body.putSummaryLine ( f,"LIBRARY",library.dname )
                librow += 2
            else:
                body.putSummaryLine_red ( f,"UNKNOWN","Failed to form library data" )


        body.file_stdout.write ( "... processed: " + f + "\n" )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return
