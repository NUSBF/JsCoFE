##!/usr/bin/python

#
# ============================================================================
#
#    02.05.19   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MERGED MTZ DATA IMPORT FUNCTIONS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2019
#
# ============================================================================
#

#  python native imports
import os
import subprocess

#  ccp4-python imports
import pyrvapi
import pyrvapi_ext.parsers

#  application imports
from   pycofe.varut   import command
from   pycofe.dtypes  import dtype_hkl
from   pycofe.proc    import import_filetype, mtz, srf


# ============================================================================
# Merged MTZ import functions

def freerflag_script(): return "freerflag.script"
def cad_script():       return "cad.script"

def makeHKLTable ( body,tableId,holderId,original_data,new_data,
                        truncation,trunc_msg,row ):
    pyrvapi.rvapi_add_table ( tableId,"<h2>Summary</h2>",
                              holderId,row,0,1,1, 0 )
    pyrvapi.rvapi_set_table_style ( tableId,
                               "table-blue","text-align:left;" )
    r = body.putTableLine ( tableId,"File name",
                       "Imported file name",new_data.getHKLFileName(),0 )
    r = body.putTableLine ( tableId,"Dataset name",
                       "Original dataset name",
                       new_data.getDataSetName(),r )
    r = body.putTableLine ( tableId,"Assigned name",
                       "Assigned dataset name",new_data.dname,r )
    r = body.putTableLine ( tableId,"Wavelength","Wavelength",
                       str(new_data.getMeta("DWAVEL","unspecified")),r )
    r = body.putTableLine ( tableId,"Space group","Space group",
                       new_data.getMeta("HM","unspecified"),r )

    dcell = new_data.getMeta ( "DCELL","*" )
    if dcell == "*":
        cell_spec = "not specified"
    else:
        cell_spec = str(dcell[0]) + " " + \
                    str(dcell[1]) + " " + \
                    str(dcell[2]) + " " + \
                    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + \
                    str(dcell[3]) + " " + \
                    str(dcell[4]) + " " + \
                    str(dcell[5])

    r = body.putTableLine ( tableId,"Cell","Cell parameters",cell_spec,r )

    r = body.putTableLine ( tableId,"Resolution low","Low resolution limit",
                                    new_data.getLowResolution(),r )

    r = body.putTableLine ( tableId,"Resolution high","High resolution limit",
                                    new_data.getHighResolution(),r )

    if dtype_hkl.subtypeAnomalous() in new_data.subtype:
        anom = "Present"
    else:
        anom = "Not present"
    r = body.putTableLine ( tableId,"Anomalous scattering",
                       "Presence of anomalous data",anom,r )

    # print new_data.getColumnNames()

    if trunc_msg:
        r = body.putTableLine ( tableId,"Original columns",
            "Original data columns",
            original_data.getColumnNames(),r )
        r = body.putTableLine ( tableId,"Truncation",
            "Truncation result","Failed: " + trunc_msg + \
            "<br>The dataset cannot be used",r )
    elif truncation == 0:
        r = body.putTableLine ( tableId,"Original columns",
            "Original data columns",
            original_data.getColumnNames(),r )
        r = body.putTableLine ( tableId,"Truncation",
            "Truncation result",
            "Was not performed due to the absence of " + \
            "intensity data.<br>" + \
            "The dataset will be used untruncated",r )
    else:
        r = body.putTableLine ( tableId,"Original columns",
            "Original data columns",
            original_data.getColumnNames(),r )
        r = body.putTableLine ( tableId,"Truncation",
            "Truncation result",
            "Truncated dataset will be used instead of " + \
            "the original one.",r )
        r = body.putTableLine ( tableId,"Columns to be used",
            "Data columns which will be used further on",
            new_data.getColumnNames(),r )

    pyrvapi.rvapi_flush()

    return


# ============================================================================
# import merged mtz files

def run ( body,   # body is reference to the main Import class
          sectionTitle="Reflection datasets created",
          sectionOpen=False,  # to keep result section closed if several datasets
          freeRflag=True      # will be run if necessary
        ):

    hkl_imported = []

    files_mtz = []
    for f_orig in body.files_all:
        #f_base, f_ext = os.path.splitext(f_orig)
        #if f_ext.lower() in ('.hkl', '.mtz'):
        #body.file_stdout.write ( " mtz=" + f_orig + "\n" )
        if body.checkFileImport ( f_orig,import_filetype.ftype_MTZMerged() ):
            files_mtz.append((f_orig,import_filetype.ftype_MTZMerged()))
        elif body.checkFileImport ( f_orig,import_filetype.ftype_XDSMerged() ):
            files_mtz.append((f_orig,import_filetype.ftype_XDSMerged()))
        elif body.checkFileImport ( f_orig,import_filetype.ftype_CIFMerged() ):
            files_mtz.append((f_orig,import_filetype.ftype_CIFMerged()))

            #p_orig = os.path.join(body.importDir(), f_orig)
            #body.file_stdout.write ( " pmtz=" + p_orig + "\n" )
            #f_fmt = mtz.hkl_format(p_orig, body.file_stdout)
            #if f_fmt in ('xds_merged', 'mtz_merged'):
            #    files_mtz.append((f_orig, f_fmt))

    if not files_mtz:
        return hkl_imported

    mtzSecId = body.getWidgetId ( "mtz_sec" )

    k = 0
    for f_orig, f_fmt in files_mtz:

        body.files_all.remove ( f_orig )

        p_orig  = os.path.join(body.importDir(), f_orig)
        p_mtzin = p_orig

        if f_fmt==import_filetype.ftype_CIFMerged():
            p_mtzin = os.path.splitext(f_orig)[0] + '.mtz'
            body.open_stdin()
            body.write_stdin ( "END\n" )
            body.close_stdin()
            rc = body.runApp ( "cif2mtz",["HKLIN",p_orig,"HKLOUT",p_mtzin],
                               quitOnError=False )
            if rc.msg or not os.path.isfile(p_mtzin):
                body.putSummaryLine_red ( f_orig,"CIF","Failed to convert, ignored" )
                p_mtzin = None
            body.unsetLogParser()

        #if not f_fmt.startswith('mtz_'):
        elif f_fmt==import_filetype.ftype_XDSMerged():
            p_mtzin = os.path.splitext(f_orig)[0] + '.mtz'
            sp = subprocess.Popen ( 'pointless', stdin=subprocess.PIPE,
                stdout=body.file_stdout, stderr=body.file_stderr )
            sp.stdin.write('XDSIN ' + p_orig + '\nHKLOUT ' + p_mtzin + '\nCOPY\n')
            sp.stdin.close()
            if sp.wait():
                body.putSummaryLine_red ( f_orig,"XDS","Failed to convert, ignored" )
                p_mtzin = None

        if p_mtzin:

            p_mtzin1 = p_mtzin
            rc = command.comrc()

            p_mtzout = os.path.splitext ( os.path.join(body.outputDir(),
                                          os.path.basename(f_orig)) )[0] + ".mtz"

            if freeRflag:

                #if k==0 or True:  <-- to be deleted later  02.05.2019
                scr_file = open ( freerflag_script(),"w" )
                mf = mtz.mtz_file ( p_mtzin )
                if mf.FREE:
                    scr_file.write ( "COMPLETE FREE=" + mf.FREE + "\n" )
                scr_file.close ()

                # run freerflag: generate FreeRFlag if it is absent, and expand
                # all reflections

                p_mtzin1 = "temp.mtz"
                try:
                    os.remove ( p_mtzin1 )
                except OSError:
                    pass
                rc = command.call ( "freerflag",
                                    ["HKLIN",p_mtzin,
                                     "HKLOUT",p_mtzin1],"./",
                                    freerflag_script(),body.file_stdout1,
                                    body.file_stderr,log_parser=None,
                                    citation_ref="freerflag-srv",
                                    file_stdout_alt=body.file_stdout )

            #  get rid of redundant reflections with cad

            scr_file = open ( cad_script(),"w" )
            scr_file.write ( "LABIN FILE 1 ALLIN\nEND\n" )
            scr_file.close ()

            rc = command.call ( "cad",
                                ["HKLIN1",p_mtzin1,
                                 "HKLOUT",p_mtzout],"./",
                                cad_script(),body.file_stdout1,
                                body.file_stderr,log_parser=None,
                                citation_ref="freerflag-srv",
                                file_stdout_alt=body.file_stdout )

            if rc.msg:
                msg = "\n\n Freerflag failed with message:\n\n" + \
                      rc.msg + \
                      "\n\n File " + f_orig + \
                      " cannot be processed.\n\n"
                body.file_stdout.write ( msg )
                body.file_stderr.write ( msg )
                body.putSummaryLine_red ( f_orig,"MTZ","Failed to process/import, ignored" )

            else:

                mf = mtz.mtz_file ( p_mtzout )
                body.summary_row_0 = -1 # to signal the beginning of summary row

                for ds in mf:

                    if k==0:
                        body.file_stdout.write ( "\n" + "%"*80 + "\n"  )
                        body.file_stdout.write ( "%%%%%  IMPORT REFLECTION DATA\n" )
                        body.file_stdout.write ( "%"*80 + "\n" )

                    # make HKL dataset annotation
                    hkl = dtype_hkl.DType ( body.job_id )
                    hkl.importMTZDataset ( ds )
                    body.dataSerialNo += 1
                    hkl.makeDName ( body.dataSerialNo )
                    datasetName = ""

                    if k==0:
                        if sectionTitle:
                            pyrvapi.rvapi_add_section ( mtzSecId,sectionTitle,
                                                body.report_page_id(),body.rvrow,
                                                0,1,1,sectionOpen )
                        else:
                            pyrvapi.rvapi_add_section ( mtzSecId,
                                    "Reflection dataset created: " + hkl.dname,
                                    body.report_page_id(),body.rvrow,
                                    0,1,1,sectionOpen )

                    subSecId = mtzSecId
                    if len(files_mtz)>1 or len(mf)>1:
                        subSecId = body.getWidgetId ( "mtz_subsec" )
                        pyrvapi.rvapi_add_section ( subSecId,hkl.dname,
                                                    mtzSecId,k,0,1,1,False )
                        #pyrvapi.rvapi_add_section ( subSecId,
                        #            f_orig + " / " + hkl.getDataSetName(),
                        #            mtzSecId,k,0,1,1,False )

                    # run crtruncate
                    outFileName = os.path.join(body.outputDir(),hkl.dataId+".mtz")
                    outXmlName  = os.path.join("ctruncate"+hkl.dataId+".xml")
                    cmd = ["-hklin",p_mtzout,"-hklout",outFileName]
                    amplitudes = ""

                    meanCols = hkl.getMeanColumns()
                    if meanCols[2] != "X":
                        cols = "/*/*/["
                        if meanCols[1] != None:
                            cols = cols + meanCols[0] + "," + meanCols[1]
                        else:
                            cols = cols + meanCols[0]
                        if meanCols[2] == "F":
                            amplitudes = "-amplitudes"
                        cmd += ["-colin",cols+"]"]

                    anomCols  = hkl.getAnomalousColumns()
                    anomalous = False
                    if anomCols[4] != "X":
                        anomalous = True
                        cols = "/*/*/["
                        for i in range(0,4):
                            if anomCols[i] != None:
                                if i > 0:
                                    cols = cols + ","
                                cols = cols + anomCols[i]
                        if anomCols[4] == "F":
                            amplitudes = "-amplitudes"
                        cmd += ["-colano",cols+"]"]

                    if amplitudes:
                        cmd += [amplitudes]

                    cmd += ["-xmlout", outXmlName]
                    cmd += ["-freein", "/*/*/[" + mf.FREE + "]" ]

                    pyrvapi.rvapi_set_text ( "&nbsp;<p><h2>Data analysis (CTruncate)</h2>",
                                             subSecId,1,0,1,1 )
                    reportPanelId = body.getWidgetId ( "log_panel" )
                    pyrvapi.rvapi_add_panel ( reportPanelId,subSecId,2,0,1,1 )

                    body.file_stdin = None  # not clear why this is not None at
                                            # this point and needs to be forced,
                                            # or else runApp looks for input script
                    body.setGenericLogParser ( reportPanelId,False,False,False )
                    body.runApp ( "ctruncate",cmd )

                    body.file_stdout.flush()

                    mtzTableId = body.getWidgetId ( "mtz_table" )

                    if rc.msg:
                        msg = "\n\n CTruncate failed with message:\n\n" + \
                              rc.msg + \
                              "\n\n Dataset " + hkl.dname + \
                              " cannot be used.\n\n"
                        body.file_stdout.write ( msg )
                        body.file_stderr.write ( msg )
                        makeHKLTable ( body,mtzTableId,subSecId,hkl,hkl,-1,msg,0 )
                        datasetName = hkl.dname

                    elif not os.path.exists(outFileName):
                        body.file_stdout.write ( "\n\n +++ Dataset " + hkl.dname + \
                            "\n was not truncated and will be used as is\n\n" )
                        hkl.makeUniqueFNames ( body.outputDir() )
                        body.outputDataBox.add_data ( hkl )
                        hkl_imported.append ( hkl )
                        makeHKLTable ( body,mtzTableId,subSecId,hkl,hkl,0,"",0 )
                        datasetName = hkl.dname

                        srf.putSRFDiagram ( body,hkl,body.outputDir(),
                                            body.reportDir(),subSecId,
                                            3,0,1,1, body.file_stdout,
                                            body.file_stderr, None )

                        pyrvapi.rvapi_set_text (
                                "&nbsp;<br><hr/><h3>Created Reflection Data Set (merged)</h3>" + \
                                "<b>Assigned name:</b>&nbsp;&nbsp;" + datasetName + "<br>&nbsp;",
                                subSecId,4,0,1,1 )
                        pyrvapi.rvapi_add_data ( body.getWidgetId("hkl_data_"+str(body.dataSerialNo)),
                                 "Merged reflections",
                                 # always relative to job_dir from job_dir/html
                                 "/".join([ "..",body.outputDir(),hkl.getHKLFileName()]),
                                 "hkl:hkl",subSecId,5,0,1,1,-1 )
                        body.addCitation ( 'viewhkl' )

                    else:
                        body.file_stdout.write ( "\n\n ... Dataset " + hkl.dname + \
                            "\n was truncated and will substitute the " + \
                            "original one\n\n" )
                        mtzf = mtz.mtz_file ( outFileName )
                        # ctruncate should create a single dataset here
                        for dset in mtzf:
                            dset.MTZ = os.path.basename(outFileName)
                            hkl_data = dtype_hkl.DType ( body.job_id )
                            hkl_data.importMTZDataset ( dset )
                            hkl_data.dname  = hkl.dname
                            hkl_data.dataId = hkl.dataId
                            hkl_data.makeUniqueFNames ( body.outputDir() )
                            body.outputDataBox.add_data ( hkl_data )
                            hkl_imported.append ( hkl_data )
                            makeHKLTable ( body,mtzTableId,subSecId,hkl,hkl_data,1,"",0 )
                            datasetName = hkl_data.dname

                            srf.putSRFDiagram ( body,hkl_data,body.outputDir(),
                                                body.reportDir(),subSecId,
                                                3,0,1,1, body.file_stdout,
                                                body.file_stderr, None )

                            pyrvapi.rvapi_set_text (
                                "&nbsp;<br><hr/><h3>Created Reflection Data Set (merged)</h3>" + \
                                "<b>Assigned name:</b>&nbsp;&nbsp;" + datasetName + "<br>&nbsp;",
                                subSecId,4,0,1,1 )
                            pyrvapi.rvapi_add_data ( body.getWidgetId("hkl_data_"+str(body.dataSerialNo)),
                                 "Merged reflections",
                                 # always relative to job_dir from job_dir/html
                                 "/".join([ "..",body.outputDir(),hkl_data.getHKLFileName()]),
                                 "hkl:hkl",subSecId,5,0,1,1,-1 )
                            body.addCitation ( 'viewhkl' )

                    if body.summary_row_0<0:
                        body.putSummaryLine ( f_orig,"HKL",datasetName )
                    else:
                        body.addSummaryLine ( "HKL",datasetName )
                    k += 1
                    pyrvapi.rvapi_flush()

                if len(mf)<=0:
                    body.putSummaryLine_red ( f_orig,"UNKNOWN","-- ignored" )

            body.file_stdout.write ( "... processed: " + f_orig + "\n    " )


    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return hkl_imported
