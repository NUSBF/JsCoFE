##!/usr/bin/python

#
# ============================================================================
#
#    16.07.24   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  MERGED MTZ DATA IMPORT FUNCTIONS
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2017-2024
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
from   pycofe.proc    import import_filetype, mtz, patterson
#from   pycofe.proc    import srf


# ============================================================================
# Merged MTZ import functions

def freerflag_script():  return "freerflag.script"
def cad_script      ():  return "cad.script"
def mtzutils_script ():  return "mtzutils.script"

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
          sectionOpen =False,       # to keep result section closed if several datasets
          importPhases="phases-ds", # "","phases-ds","phases-split" all optional;
                                    # "phases-ds only" "phases-split only"
                                    # will ignore HKL
          freeRflag   =True         # will be run if necessary
        ):

    hkl_imported = []

    files_mtz = []
    for f_orig in body.files_all:
        if body.checkFileImport ( f_orig,import_filetype.ftype_MTZMerged() ):
            files_mtz.append ( [f_orig,import_filetype.ftype_MTZMerged()] )
        elif body.checkFileImport ( f_orig,import_filetype.ftype_XDSMerged() ):
            files_mtz.append ( [f_orig,import_filetype.ftype_XDSMerged()] )
        elif body.checkFileImport ( f_orig,import_filetype.ftype_CIFMerged() ):
            files_mtz.append ( [f_orig,import_filetype.ftype_CIFMerged()] )

    if not files_mtz:
        return hkl_imported

    flist = []
    for i in range(len(files_mtz)):
        body.files_all.remove ( files_mtz[i][0] )
        flist.append ( files_mtz[i][0] )
    flist = body.despaceFileNames ( flist,body.importDir() )
    for i in range(len(files_mtz)):
        files_mtz[i][0] = flist[i]

    mtzSecId = body.getWidgetId ( "mtz_sec" )

    k = 0
    for f_orig, f_fmt in files_mtz:

        p_orig  = os.path.join ( body.importDir(),f_orig )
        p_mtzin = p_orig

        if f_fmt==import_filetype.ftype_CIFMerged():
            # p_mtzin = os.path.splitext(f_orig)[0] + '.mtz'
            # body.open_stdin()
            # body.write_stdin ( "END\n" )
            # body.close_stdin()
            # rc = body.runApp ( "cif2mtz",["HKLIN",p_orig,"HKLOUT",p_mtzin],
            #                    quitOnError=False )

            #### Copied from below:
            body.file_stdin = None  # not clear why this is not None at
                                    # this point and needs to be forced,
                                    # or else runApp looks for input script
            #### There could be more places like this, check all gemmi calls?

            rc = body.runApp ( "gemmi",["cif2mtz",p_orig,p_mtzin],
                               quitOnError=False )
            if rc.msg or not os.path.isfile(p_mtzin):
                body.putSummaryLine_red ( body.get_cloud_import_path(f_orig),"CIF",
                                          "Failed to convert, ignored" )
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
                body.putSummaryLine_red ( body.get_cloud_import_path(f_orig),"XDS",
                                          "Failed to convert, ignored" )
                p_mtzin = None

        if p_mtzin:

            p_mtzin1 = p_mtzin
            rc = command.comrc()

            p_mtzout = os.path.splitext ( os.path.join(body.outputDir(),
                                          os.path.basename(f_orig)) )[0] + ".mtz"

            if freeRflag:

                #if k==0 or True:  <-- to be deleted later  02.05.2019
                rc = command.comrc()

                p_mtzin1 = "temp.mtz"
                p_mtzin2 = "temp2.mtz"
                try:
                    os.remove ( p_mtzin1 )
                    os.remove ( p_mtzin2 )
                except OSError:
                    pass

                """
                mf = mtz.mtz_file ( p_mtzin )
                attrs = vars(mf)
                body.stdoutln ( " ############################################" )
                body.stdoutln ( ', '.join("%s: %s" % item for item in attrs.items()) )
                body.stdoutln ( " ############################################" )
                """
                mf = mtz.mtz_file(p_mtzin)
                if f_fmt==import_filetype.ftype_CIFMerged():
                    rc.msg = "recalculate"
                else:
                    scr_file = open ( freerflag_script(),"w" )
                    if mf.FREE:
                        scr_file.write ( "COMPLETE FREE=" + mf.FREE + "\n" )
                    scr_file.write ( "END\n" )
                    scr_file.close ()

                    # run freerflag: generate FreeRFlag if it is absent, and expand
                    # all reflections
                    rc = command.call ( "freerflag",
                                        ["HKLIN",p_mtzin,
                                         "HKLOUT",p_mtzin1],"./",
                                        freerflag_script(),body.file_stdout1,
                                        body.file_stderr,log_parser=None,
                                        citation_ref="freerflag-srv",
                                        file_stdout_alt=body.file_stdout )
                if rc.msg:
                    scr_file = open ( mtzutils_script(),"w" )
                    scr_file.write ( "EXCLUDE " + mf.FREE + " \nEND\n" )
                    scr_file.close ()
                    rc = command.call ( "mtzutils",
                                        ["HKLIN",p_mtzin,
                                         "HKLOUT",p_mtzin2],"./",
                                        mtzutils_script(),body.file_stdout1,
                                        body.file_stderr,log_parser=None,
                                        citation_ref="freerflag-srv",
                                        file_stdout_alt=body.file_stdout )

                    scr_file = open ( freerflag_script(),"w" )
                    scr_file.write ( "FREERFRAC  0.05\nEND\n" )
                    scr_file.close ()
                    rc = command.call ( "freerflag",
                                        ["HKLIN",p_mtzin2,
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
                body.putSummaryLine_red ( body.get_cloud_import_path(f_orig),"MTZ",
                                          "Failed to process/import, ignored" )

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

                    subSecId = mtzSecId
                    if not importPhases.endswith("only"):
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

                        #subSecId = mtzSecId
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
                        renameColumns = False
                        if meanCols[2] != "X":
                            cols = "/*/*/["
                            if meanCols[1] != None:
                                cols = cols + meanCols[0] + "," + meanCols[1]
                                renameColumns = meanCols[0]!="F" or meanCols[1]!="SigF"
                            else:
                                cols = cols + meanCols[0]
                                renameColumns = meanCols[0]!="F"
                            if meanCols[2] == "F":
                                amplitudes = "-amplitudes"
                            else:
                                renameColumns = False
                            cmd += ["-colin",cols+"]"]

                        anomCols  = hkl.getAnomalousColumns()
                        # anomalous = False
                        if anomCols[4] != "X":
                            # anomalous = True
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
                        try:
                            body.runApp ( "ctruncate",cmd )
                            if renameColumns:                             
                                body.open_stdin()
                                if anomCols[4] != "X":
                                    body.write_stdin ([
                                        "LABIN  FILE 1 E1=F E2=SIGF"       +\
                                                     " E3=F(+) E4=SIGF(+)" +\
                                                     " E5=F(-) E6=SIGF(-)" +\
                                                     " E7=" + mf.FREE,
                                        "LABOUT FILE 1 E1=" + meanCols[0]  +\
                                                     " E2=" + meanCols[1]  +\
                                                     " E3=" + anomCols[0]  +\
                                                     " E4=" + anomCols[1]  +\
                                                     " E5=" + anomCols[2]  +\
                                                     " E6=" + anomCols[3]  +\
                                                     " E7=" + mf.FREE
                                    ])
                                else:
                                    body.write_stdin ([
                                        "LABIN  FILE 1 E1=F E2=SIGF E3="  + mf.FREE,
                                        "LABOUT FILE 1 E1=" + meanCols[0] +\
                                                    " E2="  + meanCols[1] +\
                                                    " E3="  + mf.FREE
                                    ])
                                cmd = ["HKLIN1",outFileName,"HKLOUT",outFileName]
                                body.close_stdin()
                                body.runApp ( "cad",cmd,logType="Service" )
                        except:
                            pass

                        body.file_stdout.flush()

                        mtzTableId = body.getWidgetId ( "mtz_table" )

                        last_imported = None
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
                            if os.path.exists(outXmlName):
                                hkl.readCtruncateDataStats(outXmlName)
                            hkl_imported.append ( hkl )
                            last_imported = hkl
                            makeHKLTable ( body,mtzTableId,subSecId,hkl,hkl,0,"",0 )
                            datasetName = hkl.dname

                            row = 3
                            #srf.putSRFDiagram ( body,hkl,body.outputDir(),
                            #                    body.reportDir(),subSecId,
                            #                    3,0,1,1, body.file_stdout,
                            #                    body.file_stderr, None )
                            #  row += 1
                            patterson.putPattersonMap (
                                                body,hkl,body.outputDir(),
                                                body.reportDir(),subSecId,
                                                row,0,1,1, body.file_stdout,
                                                body.file_stderr, None )

                            pyrvapi.rvapi_set_text (
                                    "&nbsp;<br><hr/><h3>Created Reflection Data Set (merged)</h3>" + \
                                    "<b>Assigned name:</b>&nbsp;&nbsp;" + datasetName + "<br>&nbsp;",
                                    subSecId,row+1,0,1,1 )
                            pyrvapi.rvapi_add_data ( body.getWidgetId("hkl_data_"+str(body.dataSerialNo)),
                                     "Merged reflections",
                                     # always relative to job_dir from job_dir/html
                                     "/".join([ "..",body.outputDir(),hkl.getHKLFileName()]),
                                     "hkl:hkl",subSecId,row+2,0,1,1,-1 )
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
                                if os.path.exists(outXmlName):
                                    hkl_data.readCtruncateDataStats(outXmlName)
                                hkl_imported.append ( hkl_data )
                                last_imported = hkl_data
                                makeHKLTable ( body,mtzTableId,subSecId,hkl,hkl_data,1,"",0 )
                                datasetName = hkl_data.dname

                                row = 3
                                #srf.putSRFDiagram ( body,hkl_data,body.outputDir(),
                                #                    body.reportDir(),subSecId,
                                #                    3,0,1,1, body.file_stdout,
                                #                    body.file_stderr, None )
                                # row += 1
                                patterson.putPattersonMap (
                                                    body,hkl_data,body.outputDir(),
                                                    body.reportDir(),subSecId,
                                                    row,0,1,1, body.file_stdout,
                                                    body.file_stderr, None )

                                pyrvapi.rvapi_set_text (
                                    "&nbsp;<br><hr/><h3>Created Reflection Data Set (merged)</h3>" + \
                                    "<b>Assigned name:</b>&nbsp;&nbsp;" + datasetName + "<br>&nbsp;",
                                    subSecId,row+1,0,1,1 )
                                pyrvapi.rvapi_add_data ( body.getWidgetId("hkl_data_"+str(body.dataSerialNo)),
                                     "Merged reflections",
                                     # always relative to job_dir from job_dir/html
                                     "/".join([ "..",body.outputDir(),hkl_data.getHKLFileName()]),
                                     "hkl:hkl",subSecId,row+2,0,1,1,-1 )
                                body.addCitation ( 'viewhkl' )

                        if body.summary_row_0<0:
                            body.putSummaryLine ( body.get_cloud_import_path(f_orig),"HKL",datasetName )
                        else:
                            body.addSummaryLine ( "HKL",datasetName )
                        k += 1
                        pyrvapi.rvapi_flush()

                    else:
                        last_imported = hkl

                    if importPhases and last_imported and (ds.PhiFOM or ds.ABCD or ds.FwPhi):
                        cou0   = 7
                        dset   = last_imported.dataset
                        mtzin  = os.path.join(body.outputDir(),dset.MTZ)
                        try:
                            f_sigf = dset.Fmean.value, dset.Fmean.sigma
                        except:
                            f_sigf = None
                        phaseBlocks = []
                        cou = cou0
                        if importPhases.startswith("phases-ds"):
                            # simply make structure with all relevant labels
                            body.stdoutln ( " *** ABCD   " + str(ds.ABCD)   )
                            body.stdoutln ( " *** PhiFOM " + str(ds.PhiFOM) )
                            body.stdoutln ( " *** FwPhi  " + str(ds.FwPhi)  )
                            leadKey = 2
                            if ds.FwPhi and (("FWT","PHWT") in ds.FwPhi):
                                leadKey = 1
                            structure = body.registerStructure1 ( 
                                            os.path.splitext(f_orig)[0] + "-maps",
                                            None,
                                            None,
                                            None,  ###
                                            p_mtzout,
                                            leadKey = leadKey,
                                            refiner = "" 
                                        )
                            if structure:
                                structure.addPhasesSubtype ()
                                structure.addDataAssociation ( last_imported.dataId )
                                #body.stderrln ( " >>>>> " + str(ds.PhiFOM) )
                                #body.stderrln ( " >>>>> " + str(ds.FwPhi) )
                                structure.setImportMergedData ( ds )
                                pyrvapi.rvapi_set_text (
                                    "<h2>Associated ED Maps</h2>",
                                    subSecId,cou,0,1,1 )
                                cou += 2
                                body.putStructureWidget1 ( subSecId,
                                    body.getWidgetId("ph_data_"+str(body.dataSerialNo)),
                                    "Electron density", structure,
                                    0, cou, 1 )
                                if body.summary_row_0<0:
                                    body.putSummaryLine ( body.get_cloud_import_path(f_orig),
                                                          "PHASES",structure.dname )
                                else:
                                    body.addSummaryLine ( "PHASES",structure.dname )
                        elif importPhases.startswith("phases-split"):
                            if ds.PhiFOM:
                                phaseBlocks.extend(ds.PhiFOM)
                            if ds.ABCD:
                                phaseBlocks.extend(ds.ABCD)
                            if ds.FwPhi:
                                phaseBlocks.extend(ds.FwPhi)

                        for phBlock in phaseBlocks:
                            body.stdoutln ( "  phase block " + str(phBlock) )
                            assert len(phBlock) in (2,4)
                            blockname = os.path.splitext(f_orig)[0] + '-' + mtz.block_name(phBlock)
                            mtztmp = blockname + '_tmp.mtz'
                            args  = []
                            args += ["HKLIN1",mtzin   ]
                            args += ["HKLIN2",p_mtzout]
                            args += ["HKLOUT",mtztmp  ]
                            body.open_stdin()
                            body.write_stdin ( "LABIN FILE 1 E1=%s E2=%s\n" %f_sigf )
                            body.write_stdin ( "LABIN FILE 2" )
                            ind = 0
                            for label in phBlock:
                                ind += 1
                                body.write_stdin ( " E" + str(ind) + "=" + label )
                            body.write_stdin ( "\nEND\n" )
                            body.close_stdin()
                            rc = body.runApp ( "cad",args,logType="Service",quitOnError=False )
                            if rc.msg:
                                body.file_stdout1.write ( "Error calling cad: " + rc.msg + "\n" )
                                body.file_stderr.write ( "Error calling cad: " + rc.msg + "\n" )
                            body.file_stdout.flush()

                            mtzout = os.path.join(body.outputDir(),blockname + '.mtz')
                            rc = command.call (
                                "chltofom",
                                [
                                    "-mtzin", mtztmp,
                                    "-colin-fo", "/*/*/[%s,%s]" %f_sigf,
                                    "-colin-" + ("hl" if len(phBlock) == 4 else "phifom"),
                                    "/*/*/[" + ",".join(phBlock) + "]",
                                    "-mtzout", mtzout
                                ],
                                body.outputDir(),
                                None,
                                body.file_stdout1,
                                body.file_stderr,
                                log_parser=None,
                                file_stdout_alt=body.file_stdout
                            )
                            if rc.msg:
                                body.file_stdout1.write ( "Error calling chltofom: " + rc.msg + "\n" )
                                body.file_stderr.write ( "Error calling chltofom: " + rc.msg + "\n" )

                            phlist = mtz.mtz_file ( mtzout )
                            assert len(phlist) == 1
                            phset = phlist[0]
#                           assert len(phset.ABCD) == 1 and len(phset.PhiFOM) == 1 and len(phset.FwPhi) == 1
                            if len(phBlock) == 4:
                                phset.PhiFOM = None
                            elif len(phBlock) == 2:
                                phset.ABCD = None

                            mapout = os.path.join(body.outputDir(),blockname + ".map")
                            assert len(phBlock) in (2,4)
                            rc = command.call (
                                "cfft",
                                [
                                    "-mtzin", mtzout,
                                    "-colin-fc", "/*/*/[%s,%s]" %phset.FwPhi[0],
                                    "-mapout", mapout
                                ],
                                body.outputDir(),
                                None,
                                body.file_stdout1,
                                body.file_stderr,
                                log_parser=None,
                                file_stdout_alt=body.file_stdout
                            )
                            if rc.msg:
                                body.file_stdout1.write ( "Error calling cfft: " + rc.msg + "\n" )
                                body.file_stderr.write ( "Error calling cfft: " + rc.msg + "\n" )

                            structure = body.registerStructure1 (  ###
                                                blockname,
                                                None,
                                                None,
                                                None,
                                                mtzout,
                                                mapPath = mapout,
                                                refiner = "" 
                                            )
                            if structure:
                                structure.addPhasesSubtype ()
                                structure.addDataAssociation( last_imported.dataId )
                                structure.setImportMergedData ( phset )

                                if cou == cou0:
                                    pyrvapi.rvapi_set_text (
                                        "<h3>Imported Associated Sets of Phases</h3>",
                                        subSecId,cou,0,1,1 )

                                cou += 2
                                body.putStructureWidget1 (
                                    subSecId, body.getWidgetId("ph_data_"+str(body.dataSerialNo)),
                                    "Electron density", structure,
                                    0, cou, 1 )

                            pyrvapi.rvapi_flush()

                if len(mf)<=0:
                    body.putSummaryLine_red ( body.get_cloud_import_path(f_orig),"UNKNOWN",
                                              "-- ignored" )

            body.file_stdout.write ( "... processed: " + f_orig + "\n    " )


    body.rvrow += 1
    pyrvapi.rvapi_flush()

    return hkl_imported
