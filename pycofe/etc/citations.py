##!/usr/bin/python

#
# ============================================================================
#
#    09.09.18   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  Citation Framework Functions
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018
#
# ============================================================================
#

#import pyrvapi

# ============================================================================

citations = {

    'default' : { 'name' : 'CCP4 Project',
                  'refs' : [{
                            'authors' : 'Collaborative Computational Project, Number 4',
                            'title'   : 'Overview of the CCP4 suite and current developments',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '235-242'
                  }]
                },

    'ccp4'            : { 'name' : 'CCP4 Project' , 'refs' : [] },  # empty refs means default
    'pdbcur'          : { 'name' : 'PDBCur'       , 'refs' : [] },
    'freerflag'       : { 'name' : 'FreeRFlag'    , 'refs' : [] },
    'ctruncate'       : { 'name' : 'CTruncate'    , 'refs' : [] },
    'mtz2various'     : { 'name' : 'mtz2various'  , 'refs' : [] },
    'matthews_coef'   : { 'name' : 'Matthews_Coef', 'refs' : [] },
    'cad'             : { 'name' : 'CAD'          , 'refs' : [] },

    'ps2pdf'          : { 'name' : '', 'refs' : [] },  # empty name means "Ignore"
    'ccp4-python'     : { 'name' : '', 'refs' : [] },
    'dials.export'    : { 'name' : '', 'refs' : [] },
    'dials.rs_mapper' : { 'name' : '', 'refs' : [] },

    'pointless' : { 'name' : 'Pointless',
                    'refs' : [{
                            'authors' : 'Evans, P.R.',
                            'title'   : 'Scaling and assessment  of data quality',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D62',
                            'year'    : '2006',
                            'pages'   : '72-82'
                        },{
                            'authors' : 'Evans, P.R.',
                            'title'   : 'An introduction to data reduction: space-group determination, scaling and intensity statistics',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '282-292'
                        }]
                  },

    'mosflm' :    { 'name' : 'MOSFLM',
                    'refs' : [{
                            'authors' : 'Battye, T.G.G., Kontogiannis, L., Johnson, O., Powell, H.R., Leslie, A.G.W.',
                            'title'   : 'IMosflm: a new graphical interface for diffraction-image processing with MOSFLM',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '271-281'
                        }]
                  },

    'xds' :       { 'name' : 'XDS, XSCALE',
                    'refs' : [{
                            'authors' : 'Kabsch, W.',
                            'title'   : 'XDS',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '125-132'
                        }]
                  },

    'aimless'   : { 'name' : 'Aimless',
                    'refs' : [{
                            'authors' : 'Evans, P.R., and Murshudov, G.N.',
                            'title'   : 'How good are my data and what is the resolution?',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D69',
                            'year'    : '2013',
                            'pages'   : '1204-1214'
                        }]
                  },

    'molrep'    : { 'name' : 'Molrep',
                    'refs' : [{
                            'authors' : 'Vagin, A., and Teplyakov, A.',
                            'title'   : 'MOLREP: an automated program for molecular replacement',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '30',
                            'year'    : '1997',
                            'pages'   : '1022-1025'
                        }]
                  },

    'refmac5' :   { 'name' : 'Refmac',
                    'refs' : [{
                            'authors' : 'Murshudov, G.N., Skubak, P., Lebedev, A.A., Pannu, N.S., Steiner, R.A., Nicholls, R.A., Winn, M.D., Long, F., and Vagin, A.A.',
                            'title'   : 'REFMAC5 for the refinement of macromolecular crystal structures',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '355-367'
                        }]
                  },

    'mrbump' :    { 'name' : 'MrBUMP',
                    'refs' : [{
                            'authors' : 'Keegan, R.M., Winn, M.D.',
                            'title'   : 'MrBUMP: an automated pipeline for molecular replacement',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D64',
                            'year'    : '2008',
                            'pages'   : '119-124'
                        }]
                  },

    'morda'  :    { 'name' : 'MoRDa',
                    'refs' : [{
                            'authors' : 'Vagin, A., Lebedev, A.',
                            'title'   : 'MoRDa , an automatic molecular replacement pipeline',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A71',
                            'year'    : '2015',
                            'pages'   : 's19',
                            'doi'     : '10.1107/S2053273315099672'
                        }]
                  },

    'balbes'  :   { 'name' : 'BALBES',
                    'refs' : [{
                            'authors' : 'Long, F., Vagin, A.A., Young, P., Murshudov, G.N.',
                            'title'   : 'BALBES: a molecular-replacement pipeline',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D64',
                            'year'    : '2008',
                            'pages'   : '125-132',
                            'doi'     : '10.1107/S0907444907050172'
                        }]
                  },

    'zanuda'  :   { 'name' : 'Zanuda',
                    'refs' : [{
                            'authors' : 'Lebedev, A.A., Isupov, M.N.',
                            'title'   : 'Space-group and origin ambiguity in macromolecular structures with pseudo-symmetry and its treatment with the program Zanuda',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D70',
                            'year'    : '2014',
                            'pages'   : '2430-2443',
                            'doi'     : '10.1107/S1399004714014795'
                        }]
                  },

    'dimple'  :   { 'name' : 'DIMPLE',
                    'refs' : [{
                            'authors' : 'Wojdyr, M., Keegan, R., Winter, G., Ashton, A.',
                            'title'   : 'DIMPLE - a pipeline for the rapid generation of difference maps from protein crystals with putatively bound ligands',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A69',
                            'year'    : '2013',
                            'pages'   : 's299',
                            'doi'     : '10.1107/S0108767313097419'
                        }]
                  },

    'simbad' :    { 'name' : 'SIMBAD',
                    'refs' : [{
                            'authors' : 'Simpkin, A.J., Simkovic, F., Thomas, J.M.H., Savko, M., Lebedev, A., ' +\
                                        'Uski, V., Ballard, C., Wojdyr, M., Wu, R., Sanishvili, R., Xu, Y., ' +\
                                        'Lisa, M.N., Buschiazzo, A., Shepard, W., Rigden, D.J., Keegan, R.M.',
                            'title'   : 'SIMBAD: a sequence-independent molecular-replacement pipeline.',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '595-605',
                            'doi'     : '10.1107/S2059798318005752'
                        }]
                  },

    'ample' :     { 'name' : 'AMPLE',
                    'refs' : [{
                            'authors' : 'Bibby, J., Keegan, R.M., Mayans, O., Winn, M.D. and Rigden, D.J.',
                            'title'   : 'AMPLE: a cluster-and-truncate approach to solve the crystal structures ' +\
                                        'of small proteins using rapidly computed ab initio models',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D68',
                            'year'    : '2012',
                            'pages'   : '1622-1631',
                            'doi'     : '10.1107/S0907444912039194'
                        }]
                  },

    'lorestr' :   { 'name' : 'LoRESTR',
                    'refs' : [{
                            'authors' : 'Kovalevskiy, 0., Nicholls, R.A., Murshudov, G.N.',
                            'title'   : 'Automated refinement of macromolecular structures' +\
                                        'at low resolution using prior information',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D72',
                            'year'    : '2016',
                            'pages'   : '1149-1161',
                            'doi'     : '10.1107/S2059798316014534'
                        }]
                  },


    'prosmart' :  { 'name' : 'PROSMART',
                    'refs' : [{
                            'authors' : 'Nicholls, R.A., Fischer, M., McNicholas, S., Murshudov, G.N.',
                            'title'   : 'Conformation-Independent Structural Comparison of Macromolecules with ProSMART',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D70',
                            'year'    : '2014',
                            'pages'   : '2487-2499'
                        }]
                  },

    'xia2'   :    { 'name' : 'Xia2',
                    'refs' : [{
                            'authors' : 'Winter, G.',
                            'title'   : 'Xia2: an expert system for macromolecular crystallography data reduction',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '43',
                            'year'    : '2010',
                            'pages'   : '186-190',
                            'doi'     : '10.1107/S0021889809045701'
                        }]
                  },

    'dials'  :    { 'name' : 'DIALS',
                    'refs' : [{
                            'authors' : 'Winter, G., Waterman, D.G., Parkhurst, J.M., Brewster, A.S., ' +\
                                        'Gildea, R.J., Gerstel, M., Fuentes-Montero, L., Vollmar, M., ' +\
                                        'Michels-Clark, T., Young, I.D., Sauter, N.K., Evans, G.',
                            'title'   : 'DIALS: implementation and evaluation of a new integration package',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '85-97'
                        }, {
                            'authors' : 'Parkhurst, J.M., Winter, G., Waterman, D.G., Fuentes-Montero, L., ' +\
                                        'Gildea, R.J., Murshudov, G.N., Evans, G.',
                            'title'   : 'DIALS',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '49',
                            'year'    : '2016',
                            'pages'   : '1912-1921'
                        }]
                  },

    'coot'   :    { 'name' : 'COOT',
                    'refs' : [{
                            'authors' : 'Emsley, P., Lohkamp, B., Scott, W.G., Cowtan, K.',
                            'title'   : 'Features and development of Coot',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '486-501'
                        }]
                  },

    'cparrot' :   { 'name' : 'PARROT',
                    'refs' : [{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'Recent developments in classical density modification',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '470-478'
                        }]
                  },

    'buccaneer' : { 'name' : 'Buccaneer',
                    'refs' : [{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'Completion of autobuilt protein models using a database of protein fragments',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D68',
                            'year'    : '2012',
                            'pages'   : '328-335'
                        },{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'The Buccaneer software for automated model building',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D62',
                            'year'    : '2006',
                            'pages'   : '1002-1011'
                        }]
                  },

    'phaser' :    { 'name' : 'Phaser',
                    'refs' : [{
                            'authors' : 'McCoy, A.J., Grosse-Kunstleve, R.W., Adams, P.D., Winn, M.D., Storoni, L.C., Read R.J.',
                            'title'   : 'Phaser Crystallographic Software',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '40',
                            'year'    : '2007',
                            'pages'   : '658-674'
                        }]
                  },

    'fft' :       { 'name' : 'FFT',
                    'refs' : [{
                            'authors' : 'Eyck, L.F.',
                            'title'   : '',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A29',
                            'year'    : '1973',
                            'pages'   : '183'
                        }]
                  },

    'acedrg' :    { 'name' : 'AceDRG',
                    'refs' : [{
                            'authors' : 'Long, F., Nicholls, R.A., Emsley, P., Grazulis, S., Merkys, A., Vaitkusb, A., Murshudov, G.N.',
                            'title'   : 'AceDRG: a stereochemical description generator for ligands',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D73',
                            'year'    : '2017',
                            'pages'   : '112-122'
                        }]
                  },

    'gesamt' :    { 'name' : 'GESAMT',
                    'refs' : [{
                            'authors' : 'Krissinel, E.',
                            'title'   : 'Enhanced fold recognition using efficient short fragment clustering',
                            'journal' : 'J. Mol. Biochem.',
                            'volume'  : '1(2)',
                            'year'    : '2012',
                            'pages'   : '76-85'
                        }]
                  },

    'jspisa'    : { 'name' : 'PISA',
                    'refs' : [{
                            'authors' : 'Krissinel, E., Henrick, K.',
                            'title'   : 'Inference of macromolecular assemblies from crystalline state',
                            'journal' : 'J. Mol. Biol.',
                            'volume'  : '372',
                            'year'    : '2007',
                            'pages'   : '774-797'
                        },{
                            'authors' : 'Krissinel, E.',
                            'title'   : 'Stock-based detection of protein oligomeric states in jsPISA',
                            'journal' : 'Nucl. Acids Res.',
                            'volume'  : '',
                            'year'    : '2015',
                            'pages'   : 'DOI:10.1093/nar/gkv314'
                        }]
                  },

    'crank2'    : { 'name' : 'Crank-2',
                    'refs' : [{
                            'authors' : 'Skubak, P., Arac, D., Bowler, M.W., Correia, A.R., ' +\
                                        'Hoelz, A., Larsen, S., Leonard, G.A., McCarthy, A.A., ' +\
                                        'McSweeney, S., Mueller-Dieckmann, C., Otten, H., ' +\
                                        'Salzman, G., Pannu, N.S.',
                            'title'   : 'A new MR-SAD algorithm for the automatic building ' +\
                                        'of protein models from low-resolution X-ray data ' +\
                                        'and a poor starting model',
                            'journal' : 'IUCrJ',
                            'volume'  : '5',
                            'year'    : '2018',
                            'pages'   : ''
                        },{
                            'authors' : 'Skubak, P., Pannu, N.S.',
                            'title'   : 'Automatic protein structure solution from weak X-ray data',
                            'journal' : 'Nature Comm.',
                            'volume'  : '4',
                            'year'    : '2013',
                            'pages'   : '2777'
                        }]
                  },

    'shelx' :     { 'name' : 'SHELX',
                    'refs' : [{
                            'authors' : 'Sheldrick, G.M.',
                            'title'   : 'A short history of SHELX',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A64',
                            'year'    : '2008',
                            'pages'   : '112-122'
                        }]
                  },

    'shelxc'    : { 'name' : 'SHELXC',
                    'copy' : [['shelx',-1]]  # -1 means copy all
                  },

    'shelxe'    : { 'name' : 'SHELXE',
                    'copy' : [['shelx',-1]]  # -1 means copy all
                  },

    'shelxd' :    { 'name' : 'SHELXD',
                    'refs' : [{
                            'authors' : 'Schneider, T.R., Sheldrick, G.M.',
                            'title'   : 'Substructure solution with SHELXD',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D58',
                            'year'    : '2002',
                            'pages'   : '1772-1779'
                        }]
                  },

    'uglymol' :   { 'name'     : 'UglyMol',
                    'category' : 'viewer',
                    'refs'     : [{
                            'authors' : 'Wojdyr, M.',
                            'title'   : ' UglyMol: a WebGL macromolecular viewer focused on the electron density',
                            'journal' : 'J. Open Source Softw.',
                            'volume'  : '2(18)',
                            'year'    : '2017',
                            'pages'   : '350',
                            'doi'     : '10.21105/joss.00350'
                        }]
                  },

    'ccp4mg'  :   { 'name'     : 'CCP4 MG',
                    'category' : 'viewer',
                    'refs'     : [{
                            'authors' : 'McNicholas, S., Potterton, E., Wilson, K.S., Noble, M.E.M.',
                            'title'   : 'Presenting your structures: the CCP4mg molecular-graphics software',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '386-394'
                        }]
                  },

    'viewhkl' :   { 'name'     : 'ViewHKL',
                    'category' : 'viewer',
                    'refs'     : [{
                            'authors' : 'Evans, P., Krissinel, E.',
                            'title'   : 'ViewHKL: Reflection data viewer',
                            'journal' : 'Unpublished',
                            'volume'  : '',
                            'year'    : '2011',
                            'pages'   : ''
                        }]
                  },

    'jscofe'  : { 'name' : 'CCP4 Cloud',
                  'refs' : [{
                            'authors' : 'Krissinel, E., Uski, V., Lebedev, A., Winn, M., Ballard, C.',
                            'title'   : 'Distributed computing for macromolecular crystallography',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '143-151'
                  }]
                },


    'clustalw2' : { 'name' : 'ClustalW2',
                  'refs' : [{
                            'authors' : 'Larkin, M.A., Blackshields, G., Brown, N.P., ' +\
                                        'Chenna, R., McGettigan, P.A., McWilliam, H., ' +\
                                        'Valentin, F., Wallace, I.M., Wilm, A., Lopez, R., ' +\
                                        'Thompson, J.D., Gibson, T.J., Higgins, D.G.',
                            'title'   : 'Clustal W and Clustal X version 2.0',
                            'journal' : 'Bioinformatics',
                            'volume'  : '23',
                            'year'    : '2007',
                            'pages'   : '2947-2948'
                  }]
                },


}


#
#  possible description with reference:
#
#    'dials.export'    : { 'name' : 'DIALS.export',
#                          'copy' : [['dials',-1]]  # -1 means copy all
#                        },
#    'dials.rs_mapper' : { 'name' : 'DIALS.rs_mapper',
#                          'copy' : [['dials',-1]]
#                        },


# citation array for current process
citation_list = []


def addCitation ( appName ):
    appRef = appName
    if appName.endswith(".bat"):
        appRef = appName[:len(appName)-4]
    if appRef not in citation_list:
        citation_list.append ( appRef )
    return

def addCitations ( appName_list ):
    for appName in appName_list:
        addCitation ( appName )
    return


def makeCitation ( reference ):
    refhtml = reference["authors"] + " (" + reference["year"] + ") <i>" +\
              reference["title"] + ".</i> " + reference["journal"] + " <b>" +\
              reference["volume"] + "</b>"
    if reference['pages']:
        refhtml += ": " + reference["pages"]
    return refhtml


def _get_references ( citation ):
    refs     = []
    if 'copy' in citation:
        copy = citation['copy']
        for c in copy:
            aname = c[0]
            if aname in citations:
                cit = citations[aname]
                if 'refs' in cit:
                    index = c[1]
                    if index<0:
                        refs += cit['refs']  # copy all references
                    elif index<len(cit['refs']):
                        refs.append ( cit['refs'][index] )
                    else:
                        nocopy.append ( "index:" + appName + "/" + aname )
                else:
                    nocopy.append ( "refs:" + appName + "/" + aname )
            else:
                nocopy.append ( "citation:" + appName + "/" + aname )
    if 'refs' in citation:
        refs += citation['refs']
    return refs


def makeCitationsHTML ( body ):

    if not citation_list:
        return None

    else:
        html    = "<b>The following programs were used:</b><ul>"
        noref   = []
        nocopy  = []
        ccp4ref = []
        viewers = []
        for appName in citation_list:
            if appName in citations:
                citation = citations[appName]
                refs     = _get_references ( citation )
                if 'category' in citation and citation['category']=='viewer':
                    viewers += refs
                elif len(refs)>0:
                    html += "<li><b><font style='font-size:110%'><i>" + citation['name'] +\
                            "</i></font>:</b><ul>"
                    for reference in refs:
                        html += "<li>" + makeCitation(reference) + "</li>"
                    html += "</ul>&nbsp;<br></li>"
                elif citation['name']:
                    ccp4ref.append ( appName )
            else:
                noref.append ( appName )

        ccp4ref.append ( 'ccp4' )
        html += "<li><b><font style='font-size:110%'><i>" + citations[ccp4ref[0]]['name']
        for i in range(1,len(ccp4ref)):
            html += ", " + citations[ccp4ref[i]]['name']
        html += "</i></font>:</b><ul><li>" + makeCitation(citations['default']['refs'][0]) + "</ul></li>"

        html += "</ul><b>Results were delivered to you by " + body.appName() + ":</b><ul><li>" +\
                makeCitation(citations['jscofe']['refs'][0]) + "</li></ul>"
        if len(viewers)>0:
            html += "<b>You may have used the following graphical viewers:</b><ul>"
            for reference in viewers:
                html += "<li>" + makeCitation(reference) + "</li>"
            html += "</ul>"

        html += "&nbsp;<p><hr/><i>Please note: full set of references related to your " +\
                "final results will be generated by the PDB Deposition task</i>"

        if len(noref)>0:
            html += "<p><font style='font-size:85%'><i>Developer: no references for " +\
                    str(noref) + ", please provide</i></font>"
        if len(nocopy)>0:
            html += "<p><font style='font-size:85%'><i>Developer: citation index errors: " +\
                    str(nocopy) + ", please correct</i></font>"

    return html


def makeSummaryCitationsHTML ( clist ):

    if not clist:
        return None

    else:
        noref = []
        hlist = []
        for appName in clist:
            if appName in citations:
                citation = citations[appName]
                refs     = _get_references ( citation )
                for reference in refs:
                    rstr  = "<li>" + makeCitation ( reference ) + "</li>"
                    if rstr not in hlist:
                        hlist.append ( rstr )
            else:
                noref.append ( appName )

        rstr  = "<li>" + makeCitation(citations['default']['refs'][0]) + "</li>"
        if rstr not in hlist:
            hlist.append ( rstr )

        rstr  = "<li>" + makeCitation(citations['jscofe']['refs'][0]) + "</li>"
        if rstr not in hlist:
            hlist.append ( rstr )

        html  = "<b>Your results were obtained using developments from publications " +\
                "listed below. Please cite them when publishing:</b><ul>"
        for li in hlist:
            html += li
        html += "</ul>"

        if len(noref)>0:
            html += "<p><font style='font-size:85%'><i>Developer: no references for " +\
                    str(noref) + ", please provide</i></font>"

    return html
