##!/usr/bin/python

# python-3 ready

#
# ============================================================================
#
#    28.05.21   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  GENERATE STRUCTURE QUALITY REPORT
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020-2021
#
# ============================================================================
#

import os
import sys

#  ccp4-python imports
import pyrvapi

#from   pycofe.etc  import pyrama
from   pycofe.varut  import jsonut

# ============================================================================

def put_bfactors_section ( body,structure ):
    if structure:

        sec_id  = body.getWidgetId ( "bfactors" )
        # grid_id = body.getWidgetId ( "ramagrid" )

        body.putSection ( sec_id,"B-Factors and RMS Analyses",openState_bool=False )
        # body.putGrid1   ( grid_id,sec_id,False,0 )
        # body.putMessage1 ( sec_id,"&nbsp;<p><h3>B-Factors Analysis</h3>",0,col=0 )

        body.open_stdin()
        body.write_stdin ( ["END"] )
        body.close_stdin ()

        # Prepare report parser
        reportPanelId = body.getWidgetId ( "baverage_report" )
        pyrvapi.rvapi_add_panel  ( reportPanelId,sec_id,0,0,1,1 )
        body.setBaverLogParser ( reportPanelId,False,graphTables=False,makePanel=False )
        body.runApp ( "baverage",[
                        "XYZIN" ,structure.getXYZFilePath ( body.outputDir() ),
                        "RMSTAB","_rmstab.tab",
                        "XYZOUT","_baverage.pdb"
                    ],logType="Main" )
        body.unsetLogParser()

    return


def put_edstats_section ( body,revision ):
    if revision.Structure:

        struct = revision.Structure
        sec_id = body.getWidgetId ( "edstats" )
        body.putSection ( sec_id,"Electron Density Fit Analysis",openState_bool=False )

        hkl = body.makeClass ( revision.HKL )
        lowres = hkl.getLowResolution ( raw=True )
        hires  = hkl.getHighResolution( raw=True )
        if not lowres:  lowres = 40.0
        if not hires:   hires  = 1.0

        body.open_stdin()
        body.write_stdin ([
            "TITLE Sigmaa style 2mfo-dfc map calculated with refmac coefficients",
            "LABI  F1=" + struct.FWT + " PHI=" + struct.PHWT,
            "RESO  " + str(hires) + " " + str(lowres),
            "XYZL  ASU",
            "GRID  SAMP 4.5",
            "END"
        ])
        body.close_stdin()

        mtzin  = struct.getMTZFilePath ( body.outputDir() )
        fo_map = "fo_map.map"
        body.runApp ( "fft",[
                "HKLIN" ,mtzin,
                "MAPOUT",fo_map
            ],logType="Service" )

        # calculate mfo-dfc difference map assuming refmac's mtz on input

        body.open_stdin()
        body.write_stdin ([
            "TITLE Sigmaa style mfo-dfc map calculated with refmac coefficients",
            "LABI  F1=" + struct.DELFWT + " PHI=" + struct.PHDELWT,
            "RESO  " + str(hires) + " " + str(lowres),
            "XYZL  ASU",
            "GRID  SAMP 4.5",
            "END"
        ])
        body.close_stdin()

        df_map = "df_map.map"
        body.runApp ( "fft",[
                "HKLIN" ,mtzin,
                "MAPOUT",df_map
            ],logType="Service" )

        #  run edstats

        body.open_stdin()
        body.write_stdin ([
            "resl=" + str(lowres),
            "resh=" + str(hires),
            "main=resi",
            "side=resi"
        ])
        body.close_stdin()

        edstats_out = "edstats.out"
        xyzout      = "edstats.pdb"

        # Prepare report parser
        reportPanelId = body.getWidgetId ( "edstats_report" )
        pyrvapi.rvapi_add_panel  ( reportPanelId,sec_id,0,0,1,1 )
        body.setEdstatsLogParser ( reportPanelId,False,graphTables=False,makePanel=False )
        body.runApp ( "edstats",[
                "XYZIN" ,struct.getXYZFilePath ( body.outputDir() ),
                "MAPIN1",fo_map,
                "MAPIN2",df_map,
                "XYZOUT",xyzout
                # "OUT"   ,edstats_out
            ],logType="Service" )
        body.unsetLogParser()

        os.remove ( fo_map )   #  save space
        os.remove ( df_map )   #  save space

    return


def put_ramaplot_section ( body,structure ):

    sec_id  = body.getWidgetId ( "ramasec"  )
    grid_id = body.getWidgetId ( "ramagrid" )
    body.putSection ( sec_id,"Ramachandran Plot",openState_bool=False )
    body.putGrid1   ( grid_id,sec_id,False,0 )

    rama_outf   = body.getWidgetId ( "rama_data" )
    pyrama_path = os.path.join ( sys.argv[0][0:sys.argv[0].rfind("pycofe")+6],
                                 "etc","pyrama.py" )

    rama_outpath = os.path.join(body.reportDir(),rama_outf)
    cmd = [
        pyrama_path,
        structure.getXYZFilePath(body.outputDir()),
        "Ramachandran Plot",
        rama_outpath
    ]

    if sys.platform.startswith("win"):
        body.runApp ( "ccp4-python.bat",cmd,logType="Main" )
    else:
        body.runApp ( "ccp4-python",cmd,logType="Main" )

    body.putMessage1 ( grid_id,"<img src=\"" + rama_outf +\
                ".png\" height=\"480pt\" style=\"vertical-align: middle;\"/>",
                0,col=0,rowSpan=2 )

    reslist = jsonut.readjObject ( rama_outpath + "_reslist.json" )
    if reslist and len(reslist.outliers)>0:
        tableId = body.getWidgetId ( "outliers" )
        body.putMessage1 ( grid_id,"&nbsp;",0,col=1 )
        body.putTable    ( tableId,"Outliers",grid_id,1,col=1,mode=100 )
        body.setTableHorzHeaders ( tableId,["Res.Id","Phi","Psi"],
                                           ["Res.Id","Phi","Psi"] )
        for i in range(len(reslist.outliers)):
            body.setTableVertHeader ( tableId,i,str(i+1),"" )
            litem = reslist.outliers[i]
            resid = "/" + "/".join(litem[0:3]) + "(" + litem[3] + ")"
            if litem[4].strip():
                resid += "." + litem[4]
            body.putTableString ( tableId,resid,"",i,0 )
            body.putTableString ( tableId,str(round(litem[5],1)),"",i,1 )
            body.putTableString ( tableId,str(round(litem[6],1)),"",i,2 )

    return


def put_molprobity_section ( body,revision ):

    sec_id  = body.getWidgetId ( "molsec"  )
    grid_id = body.getWidgetId ( "molgrid" )
    body.putSection ( sec_id,"Molprobity Analysis",openState_bool=False )
    body.putGrid1   ( grid_id,sec_id,False,0 )

    xyzpath = revision.Structure.getXYZFilePath ( body.outputDir() )

    body.flush()

    fstdout  = body.file_stdout
    fstdout1 = body.file_stdout1

    molprobity_log = "_molprobity.log"
    clashscore_log = "_clashscore.log"
    body.file_stdout  = open ( molprobity_log,"w" )
    body.file_stdout1 = open ( clashscore_log,"w" )

    cmd_molp = [xyzpath,"percentile=True","allow_polymer_cross_special_position=True"]
    if sys.platform.startswith("win"):
        body.runApp ( "molprobity.molprobity.bat",cmd_molp,logType="Main"    )
        body.runApp ( "molprobity.clashscore.bat",[xyzpath],logType="Service" )
    else:
        body.runApp ( "molprobity.molprobity",cmd_molp,logType="Main"    )
        body.runApp ( "molprobity.clashscore",[xyzpath],logType="Service" )

    body.file_stdout .close()
    body.file_stdout1.close()

    body.file_stdout  = fstdout
    body.file_stdout1 = fstdout1

    key  = 0
    meta = {
        "rama_outliers"    : 0.0,
        "rama_favored"     : 0.0,
        "rota_outliers"    : 0.0,
        "cbeta_deviations" : 0.0,
        "clashscore"       : 0.0,
        "rms_bonds"        : 0.0,
        "rms_angles"       : 0.0,
        "molp_score"       : 0.0
    }
    with (open(molprobity_log,"r")) as fstd:
        for line in fstd:
            body.file_stdout.write ( line )
            if key==1:
                lst = line.split()
                if len(lst)>2:
                    if lst[0]=="Ramachandran":
                        meta["rama_outliers"] = float(lst[-2])
                    elif lst[0]=="favored":
                        meta["rama_favored"] = float(lst[-2])
                    elif lst[0]=="Rotamer":
                        meta["rota_outliers"] = float(lst[-2])
                    elif lst[0]=="C-beta":
                        meta["cbeta_deviations"] = float(lst[-1])
                    elif lst[0]=="Clashscore":
                        meta["clashscore"] = float(lst[2])
                    elif lst[0]=="RMS(bonds)":
                        meta["rms_bonds"] = float(lst[-1])
                    elif lst[0]=="RMS(angles)":
                        meta["rms_angles"] = float(lst[-1])
                    elif lst[0]=="MolProbity":
                        meta["molp_score"] = float(lst[3])
            elif "================ Summary =====================" in line:
                key = 1

    #body.flush()
    #body.file_stdout1.close()

    grid_row = 0
    tableId  = None
    nclash   = 0

    with (open(clashscore_log,"r")) as fstd:
        for line in fstd:
            body.file_stdout1.write ( line )
            if "Bad Clashes" in line:
                tableId = body.getWidgetId ( "clashes" )
                body.putTable ( tableId,"Bad Clashes",grid_id,grid_row,col=0,mode=0 )
                grid_row += 1
                body.setTableHorzHeaders ( tableId,["Atom #1","Atom #2","Distance"],
                                           ["Atom ID of 1st clashing atom",
                                            "Atom ID of 1st clashing atom",
                                            "Interatomic distance in &Aring;"] )
            elif "clashscore = " in line:
                tableId = None
                break
            elif tableId:
                body.setTableVertHeader ( tableId,nclash,str(nclash+1),"" )
                lsplit = line.split(":")
                aid1   = lsplit[0][:18]
                aid2   = lsplit[0][18:]
                body.putTableString ( tableId,aid1,"",nclash,0 )
                body.putTableString ( tableId,aid2,"",nclash,1 )
                body.putTableString ( tableId,lsplit[1],"",nclash,2 )
                nclash += 1

    #body.file_stdout1 = open ( body.file_stdout1_path(),'a' )

    body.putMessage1 ( grid_id,"&nbsp;<p><h3>Molprobity report</h3>",grid_row,col=0 )
    grid_row += 1

    molprob_out = "molprobity.out"
    with (open(molprob_out,"r")) as f1:
        content = f1.read().strip()
        with (open(os.path.join(body.reportDir(),molprob_out),"w")) as f2:
            f2.write ( "<pre style=\"border:1px solid #488090; padding:12px; " +\
                                "height: 400px; width: 100%; overflow: auto; " +\
                                "font-family : 'Courier'; font-size: 1em; " +\
                                "box-shadow : 5px 5px 6px #888888;\">" + content +\
                       "</pre>" )

    panelId = body.getWidgetId ( "molpanel" )
    body.putPanel1 ( grid_id,panelId,grid_row )
    body.appendContent ( panelId,molprob_out,watch=False )

    coot_script = "molprobity_coot.py"
    if os.path.isfile(coot_script):
        coot_spath = body.stampFileName ( body.dataSerialNo+1,body.getOFName(".coot.py") )
        body.dataSerialNo += 2
        molp_spath = body.stampFileName ( body.dataSerialNo,body.getOFName(".probe.txt") )
        os.rename ( coot_script,os.path.join(body.outputDir(),coot_spath) )
        os.rename ( "molprobity_probe.txt",os.path.join(body.outputDir(),molp_spath) )
        revision.Structure.setMolProbityFile ( molp_spath )
        revision.Structure.setCootFile ( coot_spath )

    return meta


def quality_report ( body,revision,title="Quality Assessment" ):

    meta = None
    if revision.Structure and revision.Structure.hasXYZSubtype():

        if title:
            body.putTitle ( title )

        put_bfactors_section ( body,revision.Structure )
        put_edstats_section  ( body,revision )
        meta = put_molprobity_section ( body,revision  )
        put_ramaplot_section ( body,revision.Structure )

    return meta
