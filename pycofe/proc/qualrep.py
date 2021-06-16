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
import sys, copy
import xml.etree.ElementTree as ET
import traceback

#  ccp4-python imports
import pyrvapi

#from   pycofe.etc  import pyrama
from   pycofe.varut  import jsonut
from   pycofe.varut  import rvapi_utils

# ============================================================================

def put_bfactors_section ( body,structure ):
    if structure:

        sec_id  = body.getWidgetId ( "bfactors" )
        # grid_id = body.getWidgetId ( "ramagrid" )

        body.putSection ( sec_id,"B-Factors Analysis",openState_bool=False )
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
    flg = ''
    with (open(molprobity_log,"r")) as fstd:
        for line in fstd:
            body.file_stdout.write ( line )
            if "============ Geometry restraints =============" in line:
                key = 0
            elif key==1:
                try:
                    lst = line.split()
                    if len(lst)>2:
                        if lst[0]=="Number":
                            if flg == 'overall':
                                meta["natoms_overall"] = int(lst[4])
                            if flg == 'macro':
                                meta["natoms_macro"] = int(lst[4])
                            if flg == 'ligand':
                                meta["natoms_ligand"] = int(lst[4])
                            if flg == 'water':
                                meta["natoms_water"] = int(lst[4])
                        elif 'B_' in lst[0]:
                            if flg == 'overall':
                                meta["bfac_overall"] = float(lst[3])
                            if flg == 'macro':
                                meta["bfac_macro"] = float(lst[3])
                            if flg == 'ligand':
                                meta["bfac_ligand"] = float(lst[3])
                            if flg == 'water':
                                meta["bfac_water"] = float(lst[3])
                    else:
                        if "Overall" in line:
                            flg = 'overall'
                        elif 'Macromolecules' in line:
                            flg = 'macro'
                        elif 'Ligands' in line:
                            flg = 'ligand'
                        elif 'Waters' in line:
                            flg = 'water'
                except:
                    pass

            elif key==2:
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
            elif "============ Model properties ================" in line:
                key = 1
            elif "================ Summary =====================" in line:
                key = 2



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


def put_Tab1_section ( body, revision, meta, refmacResults ):
    if revision:

        hkl = body.makeClass(revision.HKL)
        wavelength = 0.0
        table1 = {}

        if hasattr(hkl,"dataStats") and hkl.dataStats:
            if type(hkl.dataStats) is dict:
                table1 = hkl.dataStats
            else:
                table1 = hkl.dataStats.__dict__

        try:
            wavelength = float(hkl.wavelength)
        except:
            try:
                wavelength = float(table1['wavelength'])
            except:
                pass

        sec_id  = body.getWidgetId ( "tableOne_widget" )
        body.putSection ( sec_id,"Table 1 - crystallographic statistics for publication",openState_bool=False )

        reportPanelId = body.getWidgetId ( "tableOne_report" )
        pyrvapi.rvapi_add_panel  ( reportPanelId,sec_id,0,0,1,1 )
        table_id = body.getWidgetId ( "tableOne_table" )

        tableDict =  { 'title': "Table 1",        # empty string by default
            'state': 0,                    # -1,0,1, -100,100
            'class': "table-blue",         # "table-blue" by default
            'css'  : "text-align:left;",  # "text-align:rigt;" by default
            'horzHeaders' :  [],
            'rows' : []
        }
        tableDict['rows'].append({'header':{'label': 'Wavelength', 'tooltip': ''},
                                  'data': ['%0.3f' % wavelength]})

        # try:
        tableDict['rows'].append({'header': {'label': 'Space group', 'tooltip': ''},
                              'data': [str(hkl.dataset.HM)]})
        if len(hkl.dataset.DCELL) >= 6:
            unitcell = 'a=%0.2f, b=%0.2f, c=%0.2f, <br>alpha=%0.2f, beta=%0.2f, gamma=%0.2f' % \
            (hkl.dataset.DCELL[0], hkl.dataset.DCELL[1], hkl.dataset.DCELL[2],
             hkl.dataset.DCELL[3], hkl.dataset.DCELL[4], hkl.dataset.DCELL[5])
        else:
            unitcell = ''
        tableDict['rows'].append({'header': {'label': 'Unit cell', 'tooltip': ''},
                              'data': [unitcell]})
        # except Exception as inst:
        #     body.stderrln (str(type(inst))+ '\n')  # the exception instance
        #     body.stderrln (str(inst.args)+ '\n')  # arguments stored in .args
        #     body.stderrln (str(inst)+ '\n')  # __str__ allows args to be printed directly,
        #     tb = traceback.format_exc()
        #     body.stderrln( tb + '\n\n')


        if "ResolutionLow" in table1.keys() and "ResolutionHigh" in table1.keys():
            if "ResolutionLowO" in table1.keys() and "ResolutionHighO" in table1.keys():
                tableDict['rows'].append({'header': {'label': 'Resolution range', 'tooltip': ''},
                                      'data': ['%0.2f - %0.2f (%0.2f-%0.2f)' %
                                               (table1['ResolutionLow'], table1['ResolutionHigh'],
                                                table1['ResolutionLowO'], table1['ResolutionHighO'])]})
            else:
                tableDict['rows'].append({'header': {'label': 'Resolution range', 'tooltip': ''},
                                      'data': ['%0.2f - %0.2f' %
                                               (table1['ResolutionLow'], table1['ResolutionHigh'])]})

        if "TotalReflections" in table1.keys():
            if "TotalReflectionsO" in table1.keys():
                tableDict['rows'].append({'header': {'label': 'Total reflections', 'tooltip': ''},
                                      'data': ['%d (%d)' % (table1['TotalReflections'], table1['TotalReflectionsO'])]})
            else:
                tableDict['rows'].append({'header': {'label': 'Total reflections', 'tooltip': ''},
                                      'data': ['%d' % (table1['TotalReflections'])]})

        if "UniqueReflections" in table1.keys():
            if "UniqueReflectionsO" in table1.keys():
                tableDict['rows'].append({'header': {'label': 'Unique reflections', 'tooltip': ''},
                                      'data': ['%d (%d)' % (table1['UniqueReflections'], table1['UniqueReflectionsO'])]})
            else:
                tableDict['rows'].append({'header': {'label': 'Unique reflections', 'tooltip': ''},
                                      'data': ['%d' % (table1['UniqueReflections'])]})

        if "Multiplicity" in table1.keys() and "MultiplicityO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'Multiplicity', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['Multiplicity'], table1['MultiplicityO'])]})

        if "Completeness" in table1.keys() and "CompletenessO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'Completeness', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['Completeness'], table1['CompletenessO'])]})

        if "meanIsigI" in table1.keys() and "meanIsigIO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'mean(I) / sig(I)', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['meanIsigI'], table1['meanIsigIO'])]})

        if "WilsonB" in table1.keys() in table1.keys():
            tableDict['rows'].append({'header': {'label': 'Wilson B-factor', 'tooltip': ''},
                                      'data': ['%0.2f' % (table1['WilsonB'])]})

        if "Rmerge" in table1.keys() and "RmergeO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'Rmerge', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['Rmerge'], table1['RmergeO'])]})

        if "Rmeas" in table1.keys() and "RmeasO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'Rmeas', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['Rmeas'], table1['RmeasO'])]})

        if "Rpim" in table1.keys() and "RpimO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'Rpim', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['Rpim'], table1['RpimO'])]})

        if "CChalf" in table1.keys() and "CChalfO" in table1.keys():
            tableDict['rows'].append({'header': {'label': 'CChalf', 'tooltip': ''},
                                      'data': ['%0.2f (%0.2f)' % (table1['CChalf'], table1['CChalfO'])]})

        if (refmacResults):
            tableDict['rows'].append({'header': {'label': 'Reflections in refinement', 'tooltip': ''},
                                      'data': ['%d' % refmacResults.nrefAll]})
            tableDict['rows'].append({'header': {'label': 'Reflections in free set', 'tooltip': ''},
                                      'data': ['%d' % refmacResults.nrefFree]})
            tableDict['rows'].append({'header': {'label': 'Rwork', 'tooltip': ''},
                                      'data': ['%0.4f' % refmacResults.getFinalRfact()]})
            tableDict['rows'].append({'header': {'label': 'Rfree', 'tooltip': ''},
                                      'data': ['%0.4f' % refmacResults.getFinalRfree()]})
            tableDict['rows'].append({'header': {'label': 'FSC average', 'tooltip': ''},
                                      'data': ['%0.4f' % refmacResults.getFinalFSCaver()]})
            tableDict['rows'].append({'header': {'label': 'RMSD bonds', 'tooltip': ''},
                                      'data': ['%0.4f' % refmacResults.getFinalrmsBOND()]})
            tableDict['rows'].append({'header': {'label': 'RMSD angles', 'tooltip': ''},
                                      'data': ['%0.4f' % refmacResults.getFinalrmsANGL()]})

        if ('rama_favored' in meta.keys()) and ('rama_outliers' in meta.keys()):
            tableDict['rows'].append({'header': {'label': 'Ramachandran favoured (%)', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['rama_favored']]})
            try:
                allowed = 100.0 - (float(meta['rama_favored']) +  meta['rama_outliers'])
            except:
                allowed = 0.0
            tableDict['rows'].append({'header': {'label': 'Ramachandran allowed (%)', 'tooltip': ''},
                                      'data': ['%0.1f' % allowed]})
            tableDict['rows'].append({'header': {'label': 'Ramachandran outliers (%)', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['rama_outliers']]})

        if ('rota_outliers' in meta.keys()):
            tableDict['rows'].append({'header': {'label': 'Rotamer outliers', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['rota_outliers']]})

        if ('clashscore' in meta.keys()):
            tableDict['rows'].append({'header': {'label': 'Clash score', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['clashscore']]})

        if ('natoms_overall' in meta.keys()):
            tableDict['rows'].append({'header': {'label': 'Overall number of atoms (non-H)', 'tooltip': ''},
                                      'data': ['%d' % meta['natoms_overall']]})

        if ('natoms_macro' in meta.keys()):
            tableDict['rows'].append({'header': {'label': '   in macromolecules', 'tooltip': ''},
                                      'data': ['%d' % meta['natoms_macro']]})

        if ('natoms_ligand' in meta.keys()):
            tableDict['rows'].append({'header': {'label': '   in ligands', 'tooltip': ''},
                                      'data': ['%d' % meta['natoms_ligand']]})

        if ('natoms_water' in meta.keys()):
            tableDict['rows'].append({'header': {'label': '   in solvent', 'tooltip': ''},
                                      'data': ['%d' % meta['natoms_water']]})

        if ('bfac_overall' in meta.keys()):
            tableDict['rows'].append({'header': {'label': 'Average B-factor', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['bfac_overall']]})

        if ('bfac_macro' in meta.keys()):
            tableDict['rows'].append({'header': {'label': '   for macromolecules', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['bfac_macro']]})

        if ('bfac_ligand' in meta.keys()):
            tableDict['rows'].append({'header': {'label': '   for ligands', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['bfac_ligand']]})

        if ('bfac_water' in meta.keys()):
            tableDict['rows'].append({'header': {'label': '   for solvent', 'tooltip': ''},
                                      'data': ['%0.1f' % meta['bfac_water']]})


        rvapi_utils.makeTable(tableDict, table_id, reportPanelId, 0, 0, 1, 1)
        body.putMessage1 ( reportPanelId,"&nbsp;<p>Statistics for the last shell is given in parentheses</p>",1,col=0 )




    return



def quality_report ( body,revision,title="Quality Assessment",refmacXML=None ):

    meta = None
    refmacResults = None

    if revision.Structure and revision.Structure.hasXYZSubtype():
        if title:
            body.putTitle ( title )

        put_bfactors_section ( body,revision.Structure )
        put_edstats_section  ( body,revision )
        meta = put_molprobity_section ( body,revision  )
        put_ramaplot_section ( body,revision.Structure )

        if refmacXML:
            if os.path.exists(refmacXML):
                refmacResults = RefmacXMLLog(refmacXML)
        put_Tab1_section(body, revision, meta, refmacResults)

    return meta


# REFMAC XML log parser
class RefmacXMLLog:
  def __init__(self, fileName):
    self.successfullyLoaded = False
    self.ncyc = 0
    self.successfullyRefined = False
    self.twin = False
    self.cycles = []
    self.nrefAll = 0
    self.nrefFree = 0

    try:
      xmlRoot = ET.parse(fileName).getroot()

      if int(xmlRoot.find('twin_info').find('ntwin_domain').text.strip()) > 1:
        self.twin = True

      try:
        self.nrefAll = int(xmlRoot.find('Overall_stats').find('n_reflections_all').text.strip())
        self.nrefFree = int(xmlRoot.find('Overall_stats').find('n_reflections_free').text.strip())
      except:
        pass


      for cycles in xmlRoot.find('Overall_stats').find('stats_vs_cycle'):
        cycle = {
          'Ncyc': int(cycles.find('cycle').text.strip()),
          'Rfact': float(cycles.find('r_factor').text.strip()),
          'Rfree': float(cycles.find('r_free').text.strip())
          }

        if cycles.find('rmsBOND').text.strip()[0] != '*':
          cycle['rmsBOND'] = float(cycles.find('rmsBOND').text.strip())
        else:
          cycle['rmsBOND'] = 0
        cycle['rmsANGL'] = float(cycles.find('rmsANGLE').text.strip())
        cycle['rmsCHIRAL'] = float(cycles.find('rmsCHIRAL').text.strip())
        if cycle['Rfree'] <= 0.0 or cycle['Rfree'] >= 0.9: # Rfree flag is missing; using Rwork instead
          cycle['Rfree'] = cycle['Rfact']
        # FSC Average may not be present in the older REFMAC versions
        try:
          cycle['fscAver'] = float(cycles.find('fscAver').text.strip())
        except:
          cycle['fscAver'] = 0.0

        self.cycles.append(copy.deepcopy(cycle))

    except:
      return

    self.ncyc = int(len(self.cycles) - 1)
    self.successfullyLoaded = True
    if self.cycles[0]['Rfree'] > self.cycles[self.ncyc]['Rfree']:
      self.successfullyRefined = True
    else:
      self.successfullyRefined = False

    return

  def getAllRfree(self):
    rfrees = []
    for cycle in self.cycles:
      rfrees.append(cycle['Rfree'])
    return rfrees

  def getStartRfact(self):
    return self.cycles[0]['Rfact']

  def getStartRfree(self):
    return self.cycles[0]['Rfree']

  def getStartFSCaver(self):
    return self.cycles[0]['fscAver']

  def getStartrmsBOND(self):
    return self.cycles[0]['rmsBOND']

  def getStartrmsANGL(self):
    return self.cycles[0]['rmsANGL']

  def getStartrmsCHIRAL(self):
    return self.cycles[0]['rmsCHIRAL']

  def getFinalRfact(self):
    return self.cycles[self.ncyc]['Rfact']

  def getFinalRfree(self):
    return self.cycles[self.ncyc]['Rfree']

  def getFinalFSCaver(self):
    return self.cycles[self.ncyc]['fscAver']

  def getFinalrmsBOND(self):
    return self.cycles[self.ncyc]['rmsBOND']

  def getFinalrmsANGL(self):
    return self.cycles[self.ncyc]['rmsANGL']

  def getFinalrmsCHIRAL(self):
    return self.cycles[self.ncyc]['rmsCHIRAL']

  def getRefinementRfactChange(self):
    return self.cycles[self.ncyc]['Rfact'] - self.cycles[0]['Rfact']

  def getRefinementRfreeChange(self):
    return self.cycles[self.ncyc]['Rfree'] - self.cycles[0]['Rfree']

  def getRefinementrmsBONDChange(self):
    return self.cycles[self.ncyc]['rmsBOND'] - self.cycles[0]['rmsBOND']

  def getRefinementrmsANGLChange(self):
    return self.cycles[self.ncyc]['rmsANGL'] - self.cycles[0]['rmsANGL']

  def getRefinementrmsCHIRALChange(self):
    return self.cycles[self.ncyc]['rmsCHIRAL'] - self.cycles[0]['rmsCHIRAL']

  def getStartingRefinementStatistics(self):
    return self.cycles[0]

  def getFinalRefinementStatistics(self):
    return self.cycles[self.ncyc]
