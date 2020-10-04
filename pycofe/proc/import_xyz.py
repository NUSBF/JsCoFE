##!/usr/bin/python

#
# ============================================================================
#
#    04.10.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  XYZ DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2020
#
# ============================================================================
#

#  python native imports
import os

#  ccp4-python imports
import pyrvapi

#  application imports
from   pycofe.dtypes import dtype_xyz
from   pycofe.varut  import command
from   pycofe.proc   import import_filetype, xyzmeta, coor


# ============================================================================
# import coordinate files function

def getCrystData ( xyzMeta ):
    spg  = "not specified"
    cell = "not specified"
    if "cryst" in xyzMeta:
        cryst = xyzMeta["cryst"]
        if "spaceGroup" in cryst:
            spg = cryst["spaceGroup"]
        if "a" in cryst:
            cell = str(cryst["a"])     + '&nbsp;&nbsp;' +\
                   str(cryst["b"])     + '&nbsp;&nbsp;' +\
                   str(cryst["c"])     + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +\
                   str(cryst["alpha"]) + '&nbsp;&nbsp;' +\
                   str(cryst["beta"])  + '&nbsp;&nbsp;' +\
                   str(cryst["gamma"]);
    return [spg,cell]


def run ( body ):  # body is reference to the main Import class

    xyz_imported = []

    files_xyz = []
    for f in body.files_all:
        #if f.lower().endswith(('.pdb', '.cif', '.mmcif', '.ent')):
        if body.checkFileImport ( f,import_filetype.ftype_XYZ() ):
            files_xyz.append ( f )

    if len(files_xyz) <= 0:
        return  xyz_imported

    for f in files_xyz:
        body.files_all.remove ( f )
    files_xyz = body.despaceFileNames ( files_xyz,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF XYZ COORDINATES\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    xyzSecId = body.getWidgetId ( "_xyz_sec_" )
    #xyzSecId = "xyz_sec_" + str(body.widget_no)
    #body.widget_no += 1

    pyrvapi.rvapi_add_section ( xyzSecId,"XYZ Coordinates",body.report_page_id(),
                                body.rvrow,0,1,1,False )
    k = 0
    for f in files_xyz:

        fpath = os.path.join ( body.importDir(),f )
        #coor.stripLigWat ( fpath,fpath )  #  strip ligands and waters

        xyzMeta = xyzmeta.getXYZMeta ( fpath,body.file_stdout,body.file_stderr )

        if len(xyzMeta["xyz"])<=0:

            body.putSummaryLine_red ( body.get_cloud_path(f),"XYZ","Empty file -- ignored" )

        else:

            subSecId = xyzSecId
            if len(files_xyz)>1:
                #subSecId = xyzSecId + str(k)
                subSecId = body.getWidgetId ( "xyz_file_" )
                pyrvapi.rvapi_add_section ( subSecId,"Import "+f,xyzSecId,
                                            k,0,1,1,False )

            xyz = dtype_xyz.DType ( body.job_id )
            xyz.setXYZFile       ( f )
            dtype_xyz.setXYZMeta ( xyz,xyzMeta )
            body.dataSerialNo += 1
            xyz.makeDName  ( body.dataSerialNo )

            os.rename ( fpath,os.path.join(body.outputDir(),f) )
            xyz.makeUniqueFNames ( body.outputDir() )

            body.outputDataBox.add_data ( xyz )
            xyz_imported.append ( xyz )

            xyzTableId = body.getWidgetId ( "xyz_table_" )
            body.putTable ( xyzTableId,"",subSecId,0 )
            jrow = 0;
            if len(files_xyz)<=1:
                body.putTableLine ( xyzTableId,"File name",
                                    "Imported file name",f,jrow )
                jrow += 1
            body.putTableLine ( xyzTableId,"Assigned name",
                                "Assigned data name",xyz.dname,jrow )
            crystData = getCrystData ( xyzMeta )
            body.putTableLine ( xyzTableId,"Space group",
                                "Space group",crystData[0],jrow+1 )
            body.putTableLine ( xyzTableId,"Cell parameters",
                                "Cell parameters (a,b,c, &alpha;,&beta;,&gamma;)",
                                crystData[1],jrow+2 )
            contents = ""
            nChains  = 0
            for model in xyzMeta["xyz"]:
                for chain in model["chains"]:
                    if chain["type"] != "UNK":
                        nChains += 1
                        if len(contents)>0:
                            contents += "<br>"
                        contents += "Model " + str(model['model']) + ", chain " + \
                                    chain['id'] + ": " + str(chain['size']) + \
                                    " residues, type: " + chain['type']
            if len(xyzMeta["ligands"])>0:
                if len(contents)>0:
                    contents += "<br>"
                contents += "Ligands:"
                for name in xyzMeta["ligands"]:
                    contents += "&nbsp;&nbsp;" + name
            body.putTableLine ( xyzTableId,"Contents","File contents",contents,jrow+3 )
            pyrvapi.rvapi_add_data ( xyzTableId + "_structure_btn",
                                     xyz.dname  + "&nbsp;&nbsp;&nbsp;&nbsp;",
                                     # always relative to job_dir from job_dir/html
                                     "/".join(["..",body.outputDir(),xyz.getXYZFileName()]),
                                     "xyz",subSecId,1,0,1,1,-1 )
            body.addCitations ( ['uglymol','ccp4mg'] )

            body.putSummaryLine ( body.get_cloud_path(f),"XYZ",xyz.dname )


        """
        # split input file to chains
        scr_file = open ( "pdbcur.script","w" )
        #scr_file.write  ( "SPLITTOCHAINS\nEND\n" )
        scr_file.write  ( "PDB_META\nEND\n" )
        scr_file.close  ()

        # Start pdbcur
        rc = command.call ( "pdbcur",['XYZIN',fpath],"./",
                            "pdbcur.script",body.file_stdout1,body.file_stderr )

        # read pdbcur's json
        fnamesplit = os.path.splitext ( f )
        fpathsplit = os.path.join ( body.importDir(),fnamesplit[0] ) + ".json"

        if not os.path.isfile(fpathsplit):

            body.putSummaryLine_red ( f,"UNKNOWN","Failed to recognise, ignored" )

        else:

            with open(fpathsplit,'r') as json_file:
                json_str = json_file.read()
            json_file.close()

            #xyzmeta = eval(json_str)
            xyzMeta = xyzmeta.XYZMeta ( json_str )

            if len(xyzMeta["xyz"])<=0:

                body.putSummaryLine_red ( f,"XYZ","Empty file -- ignored" )

            else:

                subSecId = xyzSecId
                if len(files_xyz)>1:
                    #subSecId = xyzSecId + str(k)
                    subSecId = body.getWidgetId ( "xyz_file_" )
                    pyrvapi.rvapi_add_section ( subSecId,"Import "+f,xyzSecId,
                                                k,0,1,1,False )

                xyz = dtype_xyz.DType ( body.job_id )
                xyz.setXYZFile       ( f )
                dtype_xyz.setXYZMeta ( xyz,xyzMeta )
                body.dataSerialNo += 1
                xyz.makeDName  ( body.dataSerialNo )

                os.rename ( fpath,os.path.join(body.outputDir(),f) )
                xyz.makeUniqueFNames ( body.outputDir() )

                body.outputDataBox.add_data ( xyz )
                xyz_imported.append ( xyz )

                xyzTableId = body.getWidgetId ( "xyz_table_" )
                body.putTable ( xyzTableId,"",subSecId,0 )
                jrow = 0;
                if len(files_xyz)<=1:
                    body.putTableLine ( xyzTableId,"File name",
                                        "Imported file name",f,jrow )
                    jrow += 1
                body.putTableLine ( xyzTableId,"Assigned name",
                                    "Assigned data name",xyz.dname,jrow )
                crystData = getCrystData ( xyzMeta )
                body.putTableLine ( xyzTableId,"Space group",
                                    "Space group",crystData[0],jrow+1 )
                body.putTableLine ( xyzTableId,"Cell parameters",
                                    "Cell parameters (a,b,c, &alpha;,&beta;,&gamma;)",
                                    crystData[1],jrow+2 )
                contents = ""
                nChains  = 0
                for model in xyzMeta["xyz"]:
                    for chain in model["chains"]:
                        if chain["type"] != "UNK":
                            nChains += 1
                            if len(contents)>0:
                                contents += "<br>"
                            contents += "Model " + str(model['model']) + ", chain " + \
                                        chain['id'] + ": " + str(chain['size']) + \
                                        " residues, type: " + chain['type']
                if len(xyzMeta["ligands"])>0:
                    if len(contents)>0:
                        contents += "<br>"
                    contents += "Ligands:"
                    for name in xyzMeta["ligands"]:
                        contents += "&nbsp;&nbsp;" + name
                body.putTableLine ( xyzTableId,"Contents","File contents",contents,jrow+3 )
                pyrvapi.rvapi_add_data ( xyzTableId + "_structure_btn",
                                         xyz.dname  + "&nbsp;&nbsp;&nbsp;&nbsp;",
                                         # always relative to job_dir from job_dir/html
                                         "/".join(["..",body.outputDir(),xyz.getXYZFileName()]),
                                         "xyz",subSecId,1,0,1,1,-1 )
                body.addCitations ( ['uglymol','ccp4mg'] )

                body.putSummaryLine ( f,"XYZ",xyz.dname )

        """

        body.file_stdout.write ( "... processed: " + body.get_cloud_path(f) + "\n" )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return  xyz_imported
