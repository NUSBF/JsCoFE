##!/usr/bin/python

#
# ============================================================================
#
#    02.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  LIGAND DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2025
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
# from   pycofe.dtypes import dtype_ligand
from   pycofe.varut  import command
from   pycofe.proc   import import_filetype


# ============================================================================
# import coordinate files function

def run ( body,ligand_libraries=[] ):  # body is reference to the main Import class

    files_lig = []
    for f in body.files_all:
        if body.checkFileImport ( f,import_filetype.ftype_Ligand() ):
            files_lig.append ( f )

    if len(files_lig) <= 0:
        return

    for f in files_lig:
        body.files_all.remove ( f )
    body.despaceFileNames ( files_lig,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF LIGAND COORDINATES AND RESTRAINTS\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    lib_imported = []
    ligSecId = None
    libSecId = None
    ligrow   = 0
    librow   = 0
    k        = 0
    for f in files_lig:

        fin = os.path.join ( body.importDir(),f )
        #doc = cif.read ( fin )
        doc = cif.Document()
        doc.source = fin
        doc.parse_file ( fin )
        doc.check_for_missing_values()
        #doc.check_for_duplicates()  <-- DO NOT CHECK HERE
        comp_id = []
        if "comp_list" in doc:
            vv = doc["comp_list"].find_values("_chem_comp.id")
            if vv:
                for v in vv:
                    if "comp_" + v in doc:
                        comp_id.append(str(v))
                    else:
                        comp_id = None
                        break
        link_id = []
        if "link_list" in doc:
            vv = doc["link_list"].find_values("_chem_link.id")
            if vv:
                for v in vv:
                    if "link_" + v in doc:
                        link_id.append(str(v))
                    else:
                        link_id = None
                        break
        if comp_id is None or link_id is None or not (comp_id or link_id):
            body.putSummaryLine_red ( body.get_cloud_import_path(f),"UNKNOWN",
                                      "Not a ligand library file" )
            body.stdout ( "\n ***** file " + f +\
                " misses both data_comp_list and data_link_list or is misformatted.\n\n"  )

        elif len(comp_id)==1 and len(link_id)==0 and f not in ligand_libraries:
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
                    st[0][0][0].seqid = gemmi.SeqId('1')
                    st.write_pdb ( fileXYZ )
                    # st.make_mmcif_document().write_file ( fileMMCIF )
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
                    body.putSummaryLine_red ( body.get_cloud_import_path(f),"UNKNOWN",
                                              "Failed to recognise, ignored" )
                else:
                    # Register output data. This moves needful files into output directory
                    # and puts the corresponding metadata into output databox

                    ligand = body.registerLigand ( fileXYZ,None,fileCIF )

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
                                                ligand,0,ligrow,1 )
                        body.putSummaryLine ( body.get_cloud_import_path(f),"LIGAND",ligand.dname )
                        lib_imported.append ( ligand )
                        ligrow += 2

                    else:
                        body.putSummaryLine_red ( body.get_cloud_import_path(f),"UNKNOWN",
                                                  "Failed to form ligand data" )

            else:
                body.putSummaryLine_red ( body.get_cloud_import_path(f),"UNKNOWN",
                                          "Failed to recognise data content" )

        else:
            #  multi-entry file, import as a library object
            library = body.registerLibrary ( fin,copy_files=False )
            if library:
                library.codes = []
                for i in range(len(comp_id)):
                    library.codes.append ( comp_id[i] )
                links = []
                for i in range(len(link_id)):
                    links.append ( link_id[i] )
                if not libSecId:
                    libSecId = body.getWidgetId ( "_lib_sec_" )
                    pyrvapi.rvapi_add_section ( libSecId,"Libraries",body.report_page_id(),
                                                body.rvrow,0,1,1,False )
                subSecId = libSecId
                if librow:
                    body.putHR1 ( subSecId,librow )
                    librow += 1
                body.putLibraryWidget1 ( subSecId,"Ligand library",library,links,librow,1 )
                body.putSummaryLine ( body.get_cloud_import_path(f),"LIBRARY",library.dname )
                lib_imported.append ( library )
                librow += 2
            else:
                body.putSummaryLine_red ( body.get_cloud_import_path(f),"UNKNOWN",
                                          "Failed to form library data" )


        body.file_stdout.write ( "... processed: " + body.get_cloud_import_path(f) + "\n" )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return lib_imported
