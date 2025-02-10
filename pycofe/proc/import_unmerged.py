##!/usr/bin/python

#
# ============================================================================
#
#    12.08.23   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  UNMERGED DATA IMPORT CLASS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2023
#
# ============================================================================
#

#  python native imports
import os
import sys
import traceback
import subprocess
import time

#  ccp4-python imports
import pyrvapi
# import pyrvapi_ext.parsers

#  application imports
from   pycofe.varut  import command
from   pycofe.dtypes import dtype_unmerged
from   pycofe.proc   import import_filetype, mtz, datred_utils


# ============================================================================
# Unmerged data import functions

def makeUnmergedTable ( body,tableId,holderId,data,row ):

    pyrvapi.rvapi_add_table ( tableId,"<h2>Summary</h2>",
                                      holderId,row,0,1,1, 0 )
    pyrvapi.rvapi_set_table_style ( tableId,"table-blue","text-align:left;" )
    r = body.putTableLine ( tableId,"File name",
                       "Imported file name",data.getUnmergedFileName(),0 )
    r = body.putTableLine ( tableId,"Assigned name",
                       "Assigned data name",data.dname,r )
    r = body.putTableLine ( tableId,"Dataset name",
                       "Original data name",data.dataset.name,r )
    r = body.putTableLine ( tableId,"Resolution (&Aring;)",
                       "Dataset resolution in angstroms",data.dataset.reso,r )
    r = body.putTableLine ( tableId,"Wavelength (&Aring;)",
                       "Beam wavelength in angstroms",data.dataset.wlen,r )

    if data.HM:
        r = body.putTableLine ( tableId,"Space group","Space group",data.HM,r )
    else:
        r = body.putTableLine ( tableId,"Space group","Space group","unspecified",r )

    cell_spec = "not specified"
    """
    if data.CELL:
        cell_spec = str(data.CELL[0]) + " " + \
                    str(data.CELL[1]) + " " + \
                    str(data.CELL[2]) + " " + \
                    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + \
                    str(data.CELL[3]) + " " + \
                    str(data.CELL[4]) + " " + \
                    str(data.CELL[5])
    """

    cell_spec = data.dataset.cell[0] + "&nbsp;" + \
                data.dataset.cell[1] + "&nbsp;" + \
                data.dataset.cell[2] + "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + \
                data.dataset.cell[3] + "&nbsp;" + \
                data.dataset.cell[4] + "&nbsp;" + \
                data.dataset.cell[5]

    r = body.putTableLine ( tableId,"Cell","Cell parameters",
                            cell_spec,r )

    """
    range = "not found"
    if data.BRNG:
        range = str(data.BRNG)
    r = body.putTableLine ( tableId,"Batches","Batch range(s)",range,r );
    """
    range = []
    for run in data.dataset.runs:
        range += [ ( int(run[1]),int(run[2]) ) ]
    r = body.putTableLine ( tableId,"Ranges","Image range(s)",str(range),r );

    pyrvapi.rvapi_flush()

    return


# ============================================================================
# import unmerged mtz files

def pointless_xml   () : return "pointless.xml"
def pointless_script() : return "pointless.script"
def symm_det        () : return "symm_det_table"

def run ( body,        # body is reference to the main Import class
          sectionTitle="Unmerged datasets",
          sectionOpen=False  # to keep result section closed if several datasets
        ):

    files_mtz = []
    for f_orig in body.files_all:
        if body.checkFileImport ( f_orig,import_filetype.ftype_MTZIntegrated() ):
            files_mtz.append ( [f_orig,import_filetype.ftype_MTZIntegrated()] )
        elif body.checkFileImport ( f_orig,import_filetype.ftype_XDSIntegrated() ):
            files_mtz.append ( [f_orig,import_filetype.ftype_XDSIntegrated()] )
        elif body.checkFileImport ( f_orig,import_filetype.ftype_XDSScaled() ):
            files_mtz.append ( [f_orig,import_filetype.ftype_XDSScaled()] )

    if not files_mtz:
        return

    flist = []
    for i in range(len(files_mtz)):
        body.files_all.remove ( files_mtz[i][0] )
        flist.append ( files_mtz[i][0] )
    flist = body.despaceFileNames ( flist,body.importDir() )
    for i in range(len(files_mtz)):
        files_mtz[i][0] = flist[i]

    unmergedSecId = body.getWidgetId ( "unmerged_mtz_sec" )
    imported_data = []

    k = 0
    for f_orig, f_fmt in files_mtz:
      try:
        p_orig = os.path.join(body.importDir(), f_orig)
        p_mtzin = p_orig
        if not f_fmt.startswith('mtz_'):
            p_mtzin = os.path.splitext(f_orig)[0] + '.mtz'
            sp = subprocess.Popen ( 'pointless', stdin=subprocess.PIPE,
                                    stdout=body.file_stdout,
                                    stderr=body.file_stderr )
            sp.stdin.write(('XDSIN ' + p_orig + '\nHKLOUT ' + p_mtzin + '\nCOPY\n').encode())
            sp.stdin.close()
            if sp.wait():
                p_mtzin = None

        if p_mtzin:
            if k==0:
                body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
                body.file_stdout.write ( "%%%%%  UNMERGED DATA IMPORT\n" )
                body.file_stdout.write ( "%"*80 + "\n" )

                pyrvapi.rvapi_add_section ( unmergedSecId,sectionTitle,
                                            body.report_page_id(),body.rvrow,
                                            0,1,1,sectionOpen )
                body.rvrow += 1
                urow = 0

            fileSecId = unmergedSecId
            frow      = 0
            if len(files_mtz)>1:
                fileSecId = body.getWidgetId ( "file_seq" )
                pyrvapi.rvapi_add_section ( fileSecId,"File " + f_orig,
                                            unmergedSecId,urow,0,1,1,False )
                urow += 1
                pyrvapi.rvapi_set_text ( "<h2>Data analysis (Pointless)</h2>",
                                         fileSecId,frow,0,1,1 )
            else:
                pyrvapi.rvapi_set_text ( "<h2>Data analysis (Pointless)</h2>" + \
                                         "<h3>File: " + f_orig + "</h3>",
                                         fileSecId,frow,0,1,1 )
            reportPanelId = body.getWidgetId ( "file_seq_report" )
            pyrvapi.rvapi_add_panel ( reportPanelId,fileSecId,frow+1,0,1,1 )

            frow += 2

            #log_parser = pyrvapi_ext.parsers.generic_parser ( reportPanelId,False )
            log_parser = body.setGenericLogParser ( reportPanelId,False,
                                            graphTables=False,makePanel=True )

            body.file_stdin = open ( pointless_script(),'w' )
            body.file_stdin.write (
                "HKLIN "  + p_mtzin + "\n" + \
                "XMLOUT " + pointless_xml() + "\n"
            )
            body.file_stdin.close()

            try:
                os.remove ( pointless_xml() )  #  needed for Windows
            except OSError:
                pass
            rc = command.call ( "pointless",[],"./",pointless_script(),
                                body.file_stdout,body.file_stderr,log_parser )
            body.unsetLogParser()
            time.sleep(1)

            if rc.msg:
                msg = "\n\n Pointless failed with message:\n\n" + \
                      rc.msg + \
                      "\n\n File " + f_orig + \
                      " cannot be processed.\n\n"
                body.file_stdout.write ( msg )
                body.file_stderr.write ( msg )
                body.putSummaryLine_red ( body.get_cloud_import_path(f_orig),"UNMERGED",
                                          "Failed to process/import, ignored" )

            else:

                symmTablesId = body.getWidgetId ( "file_seq_" + symm_det() )
                pyrvapi.rvapi_add_section ( symmTablesId,"Symmetry determination tables",
                                            fileSecId,frow,0,1,1,True )
                pyrvapi.rvapi_set_text ( "&nbsp;",fileSecId,frow+1,0,1,1 )
                frow += 2

                #body.putSection ( symmTablesId,"Symmetry determination tables",True )
                table_list = datred_utils.parse_xmlout(pointless_xml())
                datred_utils.report ( table_list,symmTablesId )

                # dump_keyargs = dict(sort_keys=True, indent=4, separators=(',', ': '))
                # print json.dumps(datred_utils.tabs_as_dict(tab_list), **dump_keyargs)

                mf = mtz.mtz_file ( p_mtzin )

                dset_list = datred_utils.point_symm_datasets ( pointless_xml(), f_fmt )
                body.summary_row_0 = -1 # to signal the beginning of summary row

                for dataset in dset_list:

                    # make HKL dataset annotation
                    unmerged = dtype_unmerged.DType ( body.job_id )
                    dataset["symm_summary"] = table_list
                    unmerged.importUnmergedData ( mf,dataset )
                    body.dataSerialNo += 1
                    unmerged.makeDName ( body.dataSerialNo )

                    outFileName = unmerged.dataId + ".mtz"
                    body.file_stdin = open ( pointless_script(),'w' )
                    body.file_stdin.write (
                        "NAME PROJECT x CRYSTAL y DATASET z\n" + \
                        "HKLIN "  + p_mtzin       + "\n" + \
                        "HKLOUT " + os.path.join(body.outputDir(),outFileName) + "\n" + \
                        "COPY\n"  + \
                        "ORIGINALLATTICE\n"
                    )

                    for offset,first,last in unmerged.dataset.runs:
                        body.file_stdin.write ( "RUN 1 FILE 1 BATCH " + str(first) + " to " + str(last) + "\n" )
                    body.file_stdin.write ( "END\n" )
                    body.file_stdin.close()

                    try:
                        os.remove ( pointless_xml() )  #  needed for Windows
                    except OSError:
                        pass

                    rc = command.call ( "pointless",[],"./",pointless_script(),
                                        body.file_stdout,body.file_stderr,None )

                    if rc.msg:
                        msg = "\n\n Pointless failed with message:\n\n" + \
                              rc.msg + \
                              "\n\n File " + outFileName + \
                              " cannot be processed.\n\n"
                        body.file_stdout.write ( msg )
                        body.file_stderr.write ( msg )
                        body.putSummaryLine_red ( body.get_cloud_import_path(outFileName),
                                "UNMERGED","Failed to process/import, ignored" )

                    else:
                        unmerged.setUnmergedFileName ( outFileName )

                        subSecId = fileSecId
                        if len(dset_list)>1:
                            subSecId = body.getWidgetId ( "file_seq_" + str(k) )
                            pyrvapi.rvapi_add_section ( subSecId,
                                            "Import " + unmerged.dataset.name,
                                            fileSecId,frow,0,1,1,False )
                            frow += 1

                        mtzTableId = body.getWidgetId ( "unmerged_mtz_table_"+str(k) )

                        unmerged.makeUniqueFNames ( body.outputDir() )

                        body.outputDataBox.add_data ( unmerged )
                        makeUnmergedTable ( body,mtzTableId,subSecId,unmerged,0 )

                        pyrvapi.rvapi_set_text (
                            "&nbsp;<br><hr/><h3>Created Reflection Data Set (unmerged)</h3>" + \
                            "<b>Assigned name:</b>&nbsp;&nbsp;" + unmerged.dname + \
                            "<br>&nbsp;",subSecId,frow,0,1,1 )
                        pyrvapi.rvapi_add_data ( body.getWidgetId("hkl_data_"+str(body.dataSerialNo)),
                                     "Unmerged reflections",
                                     # always relative to job_dir from job_dir/html
                                     "/".join([ "..",body.outputDir(),
                                                unmerged.getUnmergedFileName()]),
                                     "hkl:hkl",subSecId,frow+1,0,1,1,-1 )
                        body.addCitation ( 'viewhkl' )
                        frow += 2

                        if body.summary_row_0<0:
                            body.putSummaryLine ( body.get_cloud_import_path(f_orig),
                                                  "UNMERGED",unmerged.dname )
                        else:
                            body.addSummaryLine ( "UNMERGED",unmerged.dname )
                        k += 1

                        imported_data.append ( unmerged )

            pyrvapi.rvapi_flush()

            # move imported file into output directory
            os.rename ( p_mtzin, os.path.join(body.outputDir(), os.path.basename(p_mtzin)) )

            body.file_stdout.write ( "... processed: " + f_orig + "\n    " )


        trace = ''

      except:
        trace = ''.join(traceback.format_exception(*sys.exc_info()))
        body.file_stdout.write ( trace )

      if trace:
        body.fail(trace, 'import failed')


    pyrvapi.rvapi_flush()

    return imported_data
