##!/usr/bin/python

#
# ============================================================================
#
#    18.02.20   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  GENERATE USAGE STATS REPORT
#
#  Command line:
#
#  ccp4-python -m pycofe.proc.usagestats projectDataPath userDataPath statsFile.json reportDir
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2020
#
# ============================================================================
#

import os
import sys

#from   pycofe.etc  import pyrama
from   pycofe.varut  import jsonut

# ============================================================================

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

    if sys.platform.startswith("win"):
        body.runApp ( "molprobity.molprobity.bat",[xyzpath],logType="Main"    )
        body.runApp ( "molprobity.clashscore.bat",[xyzpath],logType="Service" )
    else:
        body.runApp ( "molprobity.molprobity",[xyzpath],logType="Main"    )
        body.runApp ( "molprobity.clashscore",[xyzpath],logType="Service" )

    body.flush()
    body.file_stdout1.close()

    grid_row = 0
    tableId  = None
    nclash   = 0
    with (open(body.file_stdout1_path(),'r')) as fstd:
        for line in fstd:
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
                body.stdoutln ( "line=" + line )
                lsplit = line.split(":")
                body.stdoutln ( "lsplit=" + str(lsplit) )
                aid1   = lsplit[0][:18]
                aid2   = lsplit[0][18:]
                body.putTableString ( tableId,aid1,"",nclash,0 )
                body.putTableString ( tableId,aid2,"",nclash,1 )
                body.putTableString ( tableId,lsplit[1],"",nclash,2 )
                nclash += 1

    body.file_stdout1 = open ( body.file_stdout1_path(),'a' )

    body.putMessage1 ( grid_id,"&nbsp;<p><h3>Molprobity report</h3>",grid_row,col=0 )
    grid_row += 1

    molprob_out = "molprobity.out"
    with (open(molprob_out,"r")) as f1:
        content = f1.read().strip()
        with (open(os.path.join(body.reportDir(),molprob_out),"w")) as f2:
            f2.write ( "<pre style=\"border:1px solid #488090; padding:12px; " +\
                                "height: 400px; width: 100%; overflow: auto; " +\
                                "font-family : 'Courier'; font-size: 1em; box-shadow : 5px 5px 6px #888888;\">" + content +\
                       "</pre>" )

    panelId = body.getWidgetId ( "molpanel" )
    body.putPanel1 ( grid_id,panelId,grid_row )
    body.appendContent ( panelId,molprob_out,watch=False )

    coot_script = "molprobity_coot.py"
    if os.path.isfile(coot_script):
        coot_spath = body.stampFileName ( body.dataSerialNo,body.getOFName(".coot.py") )
        os.rename ( coot_script,os.path.join(body.outputDir(),coot_spath) )
        revision.Structure.setCootFile ( coot_spath )

    return


def quality_report ( body,revision ):

    if revision.Structure and revision.Structure.hasXYZSubtype():

        body.putTitle ( "Quality Assessment" )

        put_molprobity_section ( body,revision )
        put_ramaplot_section   ( body,revision.Structure )

    return
