##!/usr/bin/python

#
# ============================================================================
#
#    04.10.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  ALIGNMENT DATA IMPORT FUNCTION
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

#  python native imports
import os
import shutil

#  ccp4-python imports
import pyrvapi

#  application imports
from dtypes import dtype_alignment
from proc   import import_filetype
from varut  import jsonut


# ============================================================================
# Alignment import function

def run ( body,sectionTitle="Alignment data" ):  # body is reference to the main Import class

    algn_imported = []

    files_algn = []
    for f in body.files_all:
        if body.checkFileImport ( f,import_filetype.ftype_Alignment() ):
            files_algn.append ( f )

    if len(files_algn) <= 0:
        return  algn_imported

    files_algn.sort()

    for f in files_algn:
        body.files_all.remove ( f )
    files_algn = body.despaceFileNames ( files_algn,body.importDir() )

    body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
    body.file_stdout.write ( "%%%%%  IMPORT OF ALIGNMENTS\n" )
    body.file_stdout.write ( "%"*80 + "\n" )

    algnSecId = body.getWidgetId ( "algn_sec_" )

    pyrvapi.rvapi_add_section ( algnSecId,sectionTitle,
                                body.report_page_id(),body.rvrow,0,1,1,False )
    k = 0
    for f in files_algn:

        subSecId = algnSecId
        if len(files_algn)>1:
            subSecId = algnSecId + str(k)
            pyrvapi.rvapi_add_section ( subSecId,"Import "+f,algnSecId,
                                        k,0,1,1,False )

        fpath      = os.path.join ( body.importDir(),f )
        align_meta = dtype_alignment.parseHHRFile ( fpath )

        if align_meta["type"]=="hhpred":

            algn = dtype_alignment.DType ( body.job_id )
            algn.setHHRFile ( f )
            body.dataSerialNo += 1
            algn.makeDName  ( body.dataSerialNo )
            shutil.copy ( fpath,body.outputDir() )
            algn.align_meta = align_meta
            algn.hitlist = "1-" + str(min(5,len(align_meta["hits"])))

            body.outputDataBox.add_data ( algn )
            algn_imported.append ( algn )

            algnTableId = body.getWidgetId ( "seq_"+str(k)+"_table" )
            body.putTable     ( algnTableId,"",subSecId,0,mode=0 )
            body.putTableLine ( algnTableId,"File name","Imported file name",f,0 )
            body.putTableLine ( algnTableId,"Assigned name",
                                            "Assigned data name",algn.dname,1 )
            body.putTableLine ( algnTableId,"Type","Alignment type type",algn.alignment_type,2 )
            body.putTableLine ( algnTableId,"N<sub>hits</sub>","Number of hits",
                                            str(len(align_meta["hits"])),3 )

            body.putSummaryLine ( body.get_cloud_import_path(f),"ALIGNMENT",algn.dname )

            body.putMessage1 ( subSecId,"&nbsp;<p><h3>Alignment file content</h3>",1 )

            with (open(fpath,"r")) as f1:
                content = f1.read().strip()
                with (open(os.path.join(body.reportDir(),f),"w")) as f2:
                    f2.write ( "<pre style=\"border:1px solid #488090; padding:12px; " +\
                                        "height: 400px; width: 1000px; overflow: auto; " +\
                                        "font-family : 'Courier'; font-size: 1em; " +\
                                        "box-shadow : 5px 5px 6px #888888;\">" + content +\
                               "</pre>" )

            panelId = body.getWidgetId ( "hhr_panel" )
            body.putPanel1 ( subSecId,panelId,2 )
            body.appendContent ( panelId,f,watch=False )

        else:
            body.putMessage1 ( subSecId,
                "<h3>Alignment file was not parsed successfully</h3>" +\
                "<i>" + align_meta["msg"] + "</i>",0 )
            body.putSummaryLine_red ( body.get_cloud_import_path(f),"ALIGNMENT",
                                      "UNUSABLE: parse errors" )


        """
        seq.makeUniqueFNames ( body.outputDir() )

        lines = filter ( None,
            (line.rstrip() for line in open(seq.getHHRFilePath(body.outputDir()),"r")))

        htmlLine = "<pre>"
        body.file_stdout.write ( "\n" )

        weights = aaWeight
        if annot.type!="protein":
            weights = naWeight

        for i in range(0,len(lines)):
            if i > 0:
                body.file_stdout.write ( "    " )
            #body.file_stdout.write ( lines[i] + "\n" )
            if i > 0:
                htmlLine += "\n"
                line      = lines[i].replace(" ","").strip()
                seq.size += len(line)
                for j in range(len(line)):
                    if line[j] in weights:
                        seq.weight += weights[line[j]]
                    #else:
                    #    body.file_stdout.write ( "  ----- unrecognised sequence char " + str(line[j]) + "\n" )
            htmlLine += lines[i]
        htmlLine += "</pre>"

        if seq.size>0:

            if annot.type=="dna":
                seq.weight += (seq.size-1)*79.0
            elif annot.type=="rna":
                seq.weight += (seq.size-1)*96.0

            body.outputDataBox.add_data ( seq )
            algn_imported.append ( seq )

            algnTableId = body.getWidgetId ( "seq_"+str(k)+"_table" )
            body.putTable     ( algnTableId,"",subSecId,0 )
            body.putTableLine ( algnTableId,"File name","Imported file name",f,0 )
            body.putTableLine ( algnTableId,"Assigned name",
                                           "Assigned data name",seq.dname,1 )
            body.putTableLine ( algnTableId,"Type"    ,"Polymer type",seq.subtype[0],2 )
            body.putTableLine ( algnTableId,"Contents","Data contents"   ,htmlLine,3 )
            body.putTableLine ( algnTableId,"Length  ","Sequence length" ,str(seq.size),4 )
            body.putTableLine ( algnTableId,"Weight  ","Molecular weight",str(seq.weight),5 )

            body.putSummaryLine ( f,"SEQ",seq.dname )

        else:
            body.putMessage1 ( subSecId,
                "<h3>Sequence was not imported due to zero size</h3>" +\
                "This often occurs if sequence file format is not recognised. " +\
                "A valid format should follow the following pattern:<pre>" +\
                "&gt;Sequence name for your reference\n" +\
                "\n" +\
                "EFQSKPLLTKREREVFELLVQDKTTKEIASELFISEKTVRNHISNAMQKLGVKGRSQAVVELLRMGELEL\n" +\
                "RNHISNAMQKLGVKGRSQAVVELLRMGELELEFQSKPLLTKREREVFELLVQDKTTKEIASELFISEKTV\n" +\
                "</pre>Your file reads:" + htmlLine + ""
                ,0 )
            body.putSummaryLine_red ( f,"SEQ","UNUSABLE: no sequence found (file format wrong?)" )
        """

        body.file_stdout.write ( "\n... processed: " + f + "\n    " )
        k += 1

    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return  algn_imported
