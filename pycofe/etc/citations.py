##!/usr/bin/python

#
# ============================================================================
#
#    08.02.25   <--  Date of Last Modification.
#                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
# ----------------------------------------------------------------------------
#
#  Citation Framework Functions
#
#  Copyright (C) Eugene Krissinel, Andrey Lebedev 2018-2025
#
# ============================================================================
#

import os

#import pyrvapi

# ============================================================================

citations = {

    'default' : { 'name'     : 'CCP4 Project',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Collaborative Computational Project, Number 4',
                            'title'   : 'Overview of the CCP4 suite and current developments',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '235-242',
                            'doi'     : '10.1107/S0907444910045749'
                  }]
                },

    'ccp4'            : { 'name' : 'CCP4 Project' , 'category' : 'primary', 'refs' : [] },  # empty refs means default
    'pdbcur'          : { 'name' : 'PDBCur'       , 'category' : 'service', 'refs' : [] },
    'freerflag'       : { 'name' : 'FreeRFlag'    , 'category' : 'primary', 'refs' : [] },
    'freerflag-srv'   : { 'name' : 'FreeRFlag'    , 'category' : 'service', 'refs' : [] },
    'ctruncate'       : { 'name' : 'CTruncate'    , 'category' : 'service', 'refs' : [] },
    'mtz2various'     : { 'name' : 'mtz2various'  , 'category' : 'service', 'refs' : [] },
    'matthews_coef'   : { 'name' : 'Matthews_Coef', 'category' : 'primary', 'refs' : [] },
    'reindex'         : { 'name' : 'Reindex'      , 'category' : 'primary', 'refs' : [] },
    'cad-primary'     : { 'name' : 'CAD'          , 'category' : 'primary', 'refs' : [] },
    'cad'             : { 'name' : 'CAD'          , 'category' : 'service', 'refs' : [] },
    'cfft'            : { 'name' : 'CFFT'         , 'category' : 'service', 'refs' : [] },
    'unique'          : { 'name' : 'Unique'       , 'category' : 'service', 'refs' : [] },
    'ecalc'           : { 'name' : 'ECalc'        , 'category' : 'service', 'refs' : [] },
    'sftools'         : { 'name' : 'SFTools'      , 'category' : 'service', 'refs' : [] },
    'mtzfix'          : { 'name' : 'MTZFix'       , 'category' : 'service', 'refs' : [] },
    'cif2mtz'         : { 'name' : 'cif2mtz'      , 'category' : 'service', 'refs' : [] },
    'rwcontents'      : { 'name' : 'RWContents'   , 'category' : 'service', 'refs' : [] },
    'csymmatch'       : { 'name' : 'CSymMatch'    , 'category' : 'primary', 'refs' : [] },
    'chltofom'        : { 'name' : 'CHLtoFOM'     , 'category' : 'service', 'refs' : [] },
    'ccp4go'          : { 'name' : 'CCP4go'       , 'category' : 'primary', 'refs' : [] },
    'ccp4build'       : { 'name' : 'CCP4Build'    , 'category' : 'primary', 'refs' : [] },
    'scalepack2mtz'   : { 'name' : 'Scalepack2MTZ', 'category' : 'service', 'refs' : [] },
    'sfall'           : { 'name' : 'SFAll'        , 'category' : 'service', 'refs' : [] },
    'baverage'        : { 'name' : 'BAverage'     , 'category' : 'primary', 'refs' : [] },
    'pdbset'          : { 'name' : 'PDBSET'       , 'category' : 'primary', 'refs' : [] },
    'contact'         : { 'name' : 'CONTACT'      , 'category' : 'primary', 'refs' : [] },
    'rotamer'         : { 'name' : 'ROTAMER'      , 'category' : 'primary', 'refs' : [] },
    'areaimol'        : { 'name' : 'AREAIMOL'     , 'category' : 'primary', 'refs' : [] },

    'ps2pdf'          : { 'name' : '', 'category' : 'system' , 'refs' : [] },  # empty name means "Ignore"
    'ccp4-python'     : { 'name' : '', 'category' : 'system' , 'refs' : [] },
    'dials.export'    : { 'name' : '', 'category' : 'service', 'refs' : [] },
    'dials.rs_mapper' : { 'name' : '', 'category' : 'service', 'refs' : [] },
    'mapro'           : { 'name' : '', 'category' : 'primary', 'refs' : [] },
    'find-blobs'      : { 'name' : '', 'category' : 'service', 'refs' : [] },
    'f2mtz'           : { 'name' : '', 'category' : 'service', 'refs' : [] },
    'auto_tracing'    : { 'name' : '', 'category' : 'service', 'refs' : [] },
    'diff_fourier'    : { 'name' : '', 'category' : 'service', 'refs' : [] },
    'mrparse'         : { 'name' : '', 'category' : 'primary', 'refs' : [] },
    'env'             : { 'name' : '', 'category' : 'primary', 'refs' : [] },

    'pointless' : { 'name'     : 'Pointless',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Evans, P.R.',
                            'title'   : 'Scaling and assessment  of data quality',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D62',
                            'year'    : '2006',
                            'pages'   : '72-82',
                            'doi'     : '10.1107/S0907444905036693'
                        },{
                            'authors' : 'Evans, P.R.',
                            'title'   : 'An introduction to data reduction: space-group determination, scaling and intensity statistics',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '282-292',
                            'doi'     : '10.1107/S090744491003982X'
                        }]
                  },

    'mtz2sca' :   { 'name'     : 'mtz2sca',
                    'category' : 'service',
                    'refs'     : [{
                            'authors' : 'Grune, T.',
                            'title'   : 'mtz2sca and mtz2hkl: facilitated transition from CCP4 to the SHELX program suite',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '41',
                            'year'    : '2008',
                            'pages'   : '217-218',
                            'doi'     : '10.1107/S0021889807050054'
                        }]
                  },

    'mosflm' :    { 'name'     : 'MOSFLM',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Battye, T.G.G., Kontogiannis, L., Johnson, O., Powell, H.R., Leslie, A.G.W.',
                            'title'   : 'IMosflm: a new graphical interface for diffraction-image processing with MOSFLM',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '271-281',
                            'doi'     : '10.1107/S0907444910048675'
                        }]
                  },

    'xds' :       { 'name'     : 'XDS, XSCALE',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Kabsch, W.',
                            'title'   : 'XDS',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '125-132',
                            'doi'     : '10.1107/S0907444909047337'
                        }]
                  },

    'chainsaw' :  { 'name'     : 'Chainsaw',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Stein, N.',
                            'title'   : 'CHAINSAW: a program for mutating pdb files used as templates in molecular replacement',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '41',
                            'year'    : '2008',
                            'pages'   : '641-643',
                            'doi'     : '10.1107/S0021889808006985'
                        }]
                  },

    'aimless'   : { 'name'     : 'Aimless',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Evans, P.R., and Murshudov, G.N.',
                            'title'   : 'How good are my data and what is the resolution?',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D69',
                            'year'    : '2013',
                            'pages'   : '1204-1214',
                            'doi'     : '10.1107/S0907444913000061'
                        }]
                  },

    'molrep'    : { 'name'     : 'Molrep',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Vagin, A., and Teplyakov, A.',
                            'title'   : 'MOLREP: an automated program for molecular replacement',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '30',
                            'year'    : '1997',
                            'pages'   : '1022-1025',
                            'doi'     : '10.1107/S0021889897006766'
                        },{
                            'authors' : 'Vagin, A., and Teplyakov, A.',
                            'title'   : 'Molecular replacement with MOLREP',
                            'journal' : 'Acta Cryst. D',
                            'volume'  : '66',
                            'year'    : '2010',
                            'pages'   : '22-25',
                            'doi'     : '10.1107/S0907444909042589'
                        }]
                  },

    'molrep-srf' : { 'name'    : 'Molrep-SRF',
                    'category' : 'service',
                    'copy'     : [['molrep',-1]]
                  },

    'refmac5' :   { 'name'     : 'Refmac',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Murshudov, G.N., Skubak, P., Lebedev, A.A., Pannu, N.S., Steiner, R.A., Nicholls, R.A., Winn, M.D., Long, F., and Vagin, A.A.',
                            'title'   : 'REFMAC5 for the refinement of macromolecular crystal structures',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '355-367',
                            'doi'     : '10.1107/S0907444911001314'
                        }]
                  },

     'refmacat' :   { 'name'     : 'Refmacat',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Yamashita, K., Wojdyr, M., Long, F., Nicholls, R. A. & Murshudov, G. N.',
                            'title'   : 'GEMMI and Servalcat restrain REFMAC5',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D79',
                            'year'    : '2023',
                            'pages'   : '368-373',
                            'doi'     : '10.1107/S2059798323002413'
                        },
                        {   
                            'authors' : 'Murshudov, G.N., Skubak, P., Lebedev, A.A., Pannu, N.S., Steiner, R.A., Nicholls, R.A., Winn, M.D., Long, F., and Vagin, A.A.',
                            'title'   : 'REFMAC5 for the refinement of macromolecular crystal structures',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '355-367',
                            'doi'     : '10.1107/S0907444911001314'
                        }],
                    
                  },
                  

    'refmac' :    { 'name'     : 'Refmac',
                    'category' : 'primary',
                    'copy'     : [['refmacat',-1]],
                    'copy'     : [['refmac5',-1]]
                  },


    'refmac5-srv' : { 'name'   : 'Refmac',
                    'category' : 'service',
                    'copy'     : [['refmacat',-1]]
                  },

    'mrbump' :    { 'name'     : 'MrBUMP',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Keegan, R.M., McNicholas, S.J., Thomas, J.M.H., Simpkin, A.J., Simkovic, F., Uski, V., Ballard, C.C., Winn, M.D., Wilson, K.S., Rigden, D.J.',
                            'title'   : 'Recent developments in MrBUMP: better search-model preparation, graphical interaction with search models, and solution improvement and assessment',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '167-182',
                            'doi'     : '10.1107/S2059798318003455'
                        }]

    #                'refs'     : [{
    #                        'authors' : 'Keegan, R.M., Winn, M.D.',
    #                        'title'   : 'MrBUMP: an automated pipeline for molecular replacement',
    #                        'journal' : 'Acta Cryst.',
    #                        'volume'  : 'D64',
    #                        'year'    : '2008',
    #                        'pages'   : '119-124',
    #                        'doi'     : '10.1107/S0907444907037195'
    #                    }]
                  },

    'alphafold' : { 'name'     : 'AlphaFold',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Jumper, J., Evans, R., Pritzel, A. et al.',
                            'title'   : 'Highly accurate protein structure prediction with AlphaFold',
                            'journal' : 'Nature',
                            'volume'  : '596',
                            'year'    : '2021',
                            'pages'   : '583-589',
                            'doi'     : '10.1038/s41586-021-03819-2'
                        }]
                  },

    'colabfold' : { 'name'     : 'ColabFold',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Mirdita M., Schütz K., Moriwaki Y., Heo L., Ovchinnikov S., and Steinegger M.',
                            'title'   : 'ColabFold: Making protein folding accessible to all',
                            'journal' : 'Nature Methods',
                            'volume'  : '19',
                            'year'    : '2022',
                            'pages'   : '679–682',
                            'doi'     : '10.1038/s41592-022-01488-1'
                        }]
                  },

    'openfold'  : { 'name'     : 'OpenFold',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Ahdritz G., Bouatta N., Kadyan S., Xia Q., Gerecke W., and AlQuraishi M.',
                            'title'   : 'OpenFold Software',
                            'journal' : 'https://github.com/aqlaboratory/openfold',
                            'volume'  : '',
                            'year'    : '2021',
                            'pages'   : '',
                            'doi'     : '10.5281/zenodo.5709539'
                        }]
                  },

    'phmmer' :    { 'name'     : 'PHMMER',
                    'category' : 'service',
                    'refs'     : [{
                            'authors' : 'Durbin, R., Eddy, S. R., Krogh, A., and Mitchison, G. J.',
                            'title'   : 'Biological Sequence Analysis: Probabilistic Models of Proteins and Nucleic Acids',
                            'journal' : 'Cambridge University Press',
                            'volume'  : '',
                            'year'    : '1998',
                            'pages'   : '',
                            'doi'     : '10.1017/CBO9780511790492'
                        }]

                  },

    'morda'  :    { 'name'     : 'MoRDa',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Vagin, A., Lebedev, A.',
                            'title'   : 'MoRDa , an automatic molecular replacement pipeline',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A71',
                            'year'    : '2015',
                            'pages'   : 's19',
                            'doi'     : '10.1107/S2053273315099672'
                        }]
                  },

    'balbes'  :   { 'name'     : 'BALBES',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Long, F., Vagin, A.A., Young, P., Murshudov, G.N.',
                            'title'   : 'BALBES: a molecular-replacement pipeline',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D64',
                            'year'    : '2008',
                            'pages'   : '125-132',
                            'doi'     : '10.1107/S0907444907050172'
                        }]
                  },

    'zanuda'  :   { 'name'     : 'Zanuda',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Lebedev, A.A., Isupov, M.N.',
                            'title'   : 'Space-group and origin ambiguity in macromolecular structures with pseudo-symmetry and its treatment with the program Zanuda',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D70',
                            'year'    : '2014',
                            'pages'   : '2430-2443',
                            'doi'     : '10.1107/S1399004714014795'
                        }]
                  },

    'dimple'  :   { 'name'     : 'DIMPLE',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Wojdyr, M., Keegan, R., Winter, G., Ashton, A.',
                            'title'   : 'DIMPLE - a pipeline for the rapid generation of difference maps from protein crystals with putatively bound ligands',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A69',
                            'year'    : '2013',
                            'pages'   : 's299',
                            'doi'     : '10.1107/S0108767313097419'
                        }]
                  },

    'simbad' :    { 'name'     : 'SIMBAD',
                    'category' : 'primary',
                    'refs'     : [{
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

    'simbad-lattice'    : { 'name'     : 'SIMBAD',
                            'category' : 'primary',
                            'copy'     : [['simbad',-1]]  # -1 means copy all
                          },

    'simbad-contaminant' : { 'name'     : 'SIMBAD',
                             'category' : 'primary',
                             'copy'     : [['simbad',-1]]  # -1 means copy all
                           },

    'simbad-morda'       : { 'name'     : 'SIMBAD',
                             'category' : 'primary',
                             'copy'     : [['simbad',-1]]  # -1 means copy all
                           },

    'simbad-full'        : { 'name'     : 'SIMBAD',
                             'category' : 'primary',
                             'copy'     : [['simbad',-1]]  # -1 means copy all
                           },

    'slicendice' :    { 'name'     : "Slice’N’Dice",
                        'category' : 'primary',
                        'refs'     : [{
                                'authors' : 'Simpkin, A.J., Elliot, L.G., Stevenson, K., Krissinel, E., Rigden, D.J., and Keegan, R.M.',
                                'title'   : "Slice’N’Dice: Maximising the value of predicted models for structural biologists",
                                'journal' : 'bioRxiv',
                                'volume'  : '2022.06.30.497974',
                                'year'    : '2022',
                                'pages'   : '',
                                'doi'     : '10.1101/2022.06.30.497974'
                            }]
                      },

    'ample' :     { 'name'     : 'AMPLE',
                    'category' : 'primary',
                    'refs'     : [{
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

    'lorestr' :   { 'name'     : 'LoRESTR',
                    'category' : 'primary',
                    'refs'     : [{
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


    'prosmart' :  { 'name'     : 'PROSMART',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Nicholls, R.A., Fischer, M., McNicholas, S., Murshudov, G.N.',
                            'title'   : 'Conformation-Independent Structural Comparison of Macromolecules with ProSMART',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D70',
                            'year'    : '2014',
                            'pages'   : '2487-2499',
                            'doi'     : '10.1107/S1399004714016241'
                        }]
                  },

    'xia2'   :    { 'name'     : 'Xia2',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Winter, G.',
                            'title'   : 'Xia2: an expert system for macromolecular crystallography data reduction',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '43',
                            'year'    : '2010',
                            'pages'   : '186-190',
                            'doi'     : '10.1107/S0021889809045701'
                        }]
                  },

    'dials'  :    { 'name'     : 'DIALS',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Winter, G., Waterman, D.G., Parkhurst, J.M., Brewster, A.S., ' +\
                                        'Gildea, R.J., Gerstel, M., Fuentes-Montero, L., Vollmar, M., ' +\
                                        'Michels-Clark, T., Young, I.D., Sauter, N.K., Evans, G.',
                            'title'   : 'DIALS: implementation and evaluation of a new integration package',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '85-97',
                            'doi'     : '10.1107/S2059798317017235'
                        }, {
                            'authors' : 'Parkhurst, J.M., Winter, G., Waterman, D.G., Fuentes-Montero, L., ' +\
                                        'Gildea, R.J., Murshudov, G.N., Evans, G.',
                            'title'   : 'Robust background modelling in DIALS',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '49',
                            'year'    : '2016',
                            'pages'   : '1912-1921',
                            'doi'     : '10.1107/S1600576716013595'
                        }]
                  },

    'coot'   :    { 'name'     : 'COOT',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Emsley, P., Lohkamp, B., Scott, W.G., Cowtan, K.',
                            'title'   : 'Features and development of Coot',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '486-501',
                            'doi'     : '10.1107/S0907444910007493'
                        }]
                  },

    'findligand-bin' : { 'name'     : 'COOT-findligand',
                         'category' : 'primary',
                         'copy'     : [['coot',-1]]  # -1 means copy all
                       },
    'findligand'     : { 'name'     : 'COOT-findligand',
                         'category' : 'primary',
                         'copy'     : [['coot',-1]]  # -1 means copy all
                       },

    'findwaters-bin' : { 'name'     : 'COOT-findwaters',
                         'category' : 'primary',
                         'copy'     : [['coot',-1]]  # -1 means copy all
                       },
    'findwaters'     : { 'name'     : 'COOT-findwaters',
                         'category' : 'primary',
                         'copy'     : [['coot',-1]]  # -1 means copy all
                       },

    'cparrot' :   { 'name'     : 'PARROT',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'Recent developments in classical density modification',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '470-478',
                            'doi'     : '10.1107/S090744490903947X'
                        }]
                  },

    'buccaneer' : { 'name'     : 'Buccaneer',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'Completion of autobuilt protein models using a database of protein fragments',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D68',
                            'year'    : '2012',
                            'pages'   : '328-335',
                            'doi'     : '10.1107/S0907444911039655'
                        },{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'The Buccaneer software for automated model building',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D62',
                            'year'    : '2006',
                            'pages'   : '1002-1011',
                            'doi'     : '10.1107/S0907444906022116'
                        }]
                  },

    'cbuccaneer': { 'name'     : 'Buccaneer',
                    'category' : 'primary',
                    'copy'     : [['buccaneer',-1]]  # -1 means copy all
                  },

    'nautilus' :  { 'name'     : 'Nautilus',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Cowtan, K.',
                            'title'   : 'Automated nucleic acid chain tracing in real time',
                            'journal' : 'IUCrJ',
                            'volume'  : '1(Pt 6)',
                            'year'    : '2014',
                            'pages'   : '387-392',
                            'doi'     : '10.1107/S2052252514019290'
                        }]
                  },

    'modelcraft': { 'name'     : 'Modelcraft',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Bond, P. S., Cowtan, K. D.',
                            'title'   : 'ModelCraft: an advanced automated model-building pipeline using Buccaneer',
                            'journal' : 'Acta Cryst. D',
                            'volume'  : '78',
                            'year'    : '2022',
                            'pages'   : '1090–1098',
                            'doi'     : 'https://doi.org/10.1107/S2059798322007732'
                          
                        }]
                  },

    'privateer' : { 'name'     : 'Privateer',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Agirre J., Fernandez-Iglesias J., Rovira C., Davies G.J., Wilson K.S. and Cowtan K.D.',
                            'title'   : 'Privateer: software for the conformational validation of carbohydrate structures',
                            'journal' : 'Nature Structural & Molecular Biology',
                            'volume'  : '22(11)',
                            'year'    : '2015',
                            'pages'   : '833-834',
                            'doi'     : '10.1038/nsmb.3115'
                        },{
                            'authors' : 'Agirre J., Davies G.J., Wilson K.S. and Cowtan K.D.',
                            'title'   : 'Carbohydrate anomalies in the PDB',
                            'journal' : 'Nature Chemical Biology',
                            'volume'  : '11(5)',
                            'year'    : '2015',
                            'pages'   : '303',
                            'doi'     : '10.1038/nchembio.1798'
                        }]
                  },


    #'solomon' :   { 'name'     : 'SOLOMON',
    #                'category' : 'primary',
    #                'refs'     : [{
    #                        'authors' : 'Abrahams, J.P., Leslie, A.G.W.',
    #                        'title'   : 'Methods used in the structure determination of bovine mitochondrial F1 ATPase',
    #                        'journal' : 'Acta Cryst.',
    #                        'volume'  : 'D52',
    #                        'year'    : '1996',
    #                        'pages'   : '30-42',
    #                        'doi'     : '10.1107/S0907444995008754'
    #                    }]
    #              },

    'solomon' :   { 'name'     : 'SOLOMON',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Abrahams, J.P.',
                            'title'   : 'Bias reduction in phase refinement by modified interference functions: introducing the gamma correction',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D53',
                            'year'    : '1997',
                            'pages'   : '371-376',
                            'doi'     : '10.1107/S0907444996015272'
                        }]
                  },

    'peakmax' :   { 'name'     : 'PeakMax',
                    'category' : 'primary',
                    'copy'     : [['default',-1]]  # -1 means copy all
                  },


    'multicomb' : { 'name'     : 'Multicomb',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Skubak, P., Waterreus, W.J., Pannu, N.S.',
                            'title'   : 'Multivariate phase combination improves automated crystallographic model building',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D66',
                            'year'    : '2010',
                            'pages'   : '783-788',
                            'doi'     : '10.1107/S0907444910014642'
                        }]
                  },

    'afro' :      { 'name'     : 'Afro',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Pannu, N.S., Waterreus, W.J., Skubak, P., Sikharulidze, I., Abrahams, J.P., de Graaff, R.A.G.',
                            'title'   : 'Recent advances in the CRANK software suite for experimental phasing.',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '331-337',
                            'doi'     : '10.1107/S0907444910052224'
                        }]
                  },

    'arpwarp' :   { 'name'     : 'Arp/wArp',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Perrakis, A., Morris, R., Lamzin, V.S.',
                            'title'   : 'Automated protein model building combined with iterative structure refinement.',
                            'journal' : 'Nature Struct. Biol.',
                            'volume'  : '6',
                            'year'    : '1999',
                            'pages'   : '458-463',
                            'doi'     : '10.1038/8263'
                        },{
                            'authors' : 'Perrakis, A., Harkiolaki, M., Wilson, K.S., Lamzin, V.S.',
                            'title'   : 'ARP/wARP and molecular replacement.',
                            'journal' : 'Acta Cryst.',
                            'volume'  : '57',
                            'year'    : '2001',
                            'pages'   : '1445-1450',
                            'doi'     : '10.1107/S0907444901014007'
                        },{
                            'authors' : 'Langer G., Cohen S.X., Lamzin V.S., Perrakis A.',
                            'title'   : 'Automated macromolecular model building for x-ray crystallography using ARP/wARP version 7.',
                            'journal' : 'Nat. Protoc.',
                            'volume'  : '3',
                            'year'    : '2008',
                            'pages'   : '1171-1179',
                            'doi'     : '10.1038/nprot.2008.91'
                        }]
                  },

    'auto_nuce' : { 'name'     : 'NUCE',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Hattne J., Lamzin V.S.',
                            'title'   : 'Pattern recognition-based detection of planar objects in 3D electron density maps',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D64',
                            'year'    : '2008',
                            'pages'   : '834-842',
                            'doi'     : '10.1107/S0907444908014327'
                        }]
                  },

    'bp3' :       { 'name'     : 'BP3',
                    'category' : 'primary',
                    'copy'     : [['afro',-1]]  # -1 means copy all
                  },

    'prasa' :     { 'name'     : 'PRASA',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Skubak, P.',
                            'title'   : 'Substructure determination using phase-retrieval techniques',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '117-124',
                            'doi'     : '10.1107/S2059798317014462'
                        }]
                  },


    'phaser' :    { 'name'     : 'Phaser',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'McCoy, A.J., Grosse-Kunstleve, R.W., Adams, P.D., Winn, M.D., Storoni, L.C., Read R.J.',
                            'title'   : 'Phaser Crystallographic Software',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '40',
                            'year'    : '2007',
                            'pages'   : '658-674',
                            'doi'     : '10.1107/S0021889807021206'
                        }]
                  },


    'refine' :    { 'name'     : 'BUSTER',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Bricogne G., Blanc E., Brandl M., Flensburg C., Keller P., Paciorek W., Roversi P, Sharff A., Smart O.S., Vonrhein C., Womack T.O.',
                            'title'   : 'BUSTER Version 2.10.3',
                            'journal' : 'Cambridge, United Kingdom: Global Phasing Ltd.',
                            'volume'  : '',
                            'year'    : '2018',
                            'pages'   : '',
                            'doi'     : ''
                        }]
                  },


    'sculptor' :  { 'name'     : 'Sculptor',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Bunkoczi, G., and Read, R.J.',
                            'title'   : 'Improvement of molecular-replacement models with Sculptor',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '303-312',
                            'doi'     : '10.1107/S0907444910051218'
                        }]
                  },

    'fft' :       { 'name'     : 'FFT',
                    'category' : 'service',
                    'refs'     : [{
                            'authors' : 'Eyck, L.F.',
                            'title'   : 'Crystallographic fast Fourier transforms',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A29',
                            'year'    : '1973',
                            'pages'   : '183',
                            'doi'     : '10.1107/S0567739473000458'
                        }]
                  },

    'acedrg' :    { 'name'     : 'AceDRG',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Long, F., Nicholls, R.A., Emsley, P., Grazulis, S., Merkys, A., Vaitkusb, A., Murshudov, G.N.',
                            'title'   : 'AceDRG: a stereochemical description generator for ligands',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D73',
                            'year'    : '2017',
                            'pages'   : '112-122',
                            'doi'     : '10.1107/S2059798317000067'
                        }]
                  },

    'ARCIMBOLDO_LITE' : {
                    'name'     : 'Arcimboldo-Lite',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Sammito, M., Millan, C.,Frieske, D., Rodriguez-Freire, E., Borges, R. J., Uson, I.',
                            'title'   : 'ARCIMBOLDO-LITE: single-workstation implementation and use',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D71',
                            'year'    : '2015',
                            'pages'   : '1921-1939',
                            'doi'     : '10.1107/S1399004715010846'
                        }]
                  },

    'gesamt' :    { 'name'     : 'GESAMT',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Krissinel, E.',
                            'title'   : 'Enhanced fold recognition using efficient short fragment clustering',
                            'journal' : 'J. Mol. Biochem.',
                            'volume'  : '1(2)',
                            'year'    : '2012',
                            'pages'   : '76-85; <i>PMCID: <a href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5117261/" target="_blank">PMC5117261</a></i>',
                            'doi'     : ''
                        }]
                  },

    'jspisa'    : { 'name'     : 'PISA',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Krissinel, E., Henrick, K.',
                            'title'   : 'Inference of macromolecular assemblies from crystalline state',
                            'journal' : 'J. Mol. Biol.',
                            'volume'  : '372',
                            'year'    : '2007',
                            'pages'   : '774-797',
                            'doi'     : '10.1016/j.jmb.2007.05.022'
                        },{
                            'authors' : 'Krissinel, E.',
                            'title'   : 'Stock-based detection of protein oligomeric states in jsPISA',
                            'journal' : 'Nucl. Acids Res.',
                            'volume'  : '43(W1)',
                            'year'    : '2015',
                            'pages'   : 'W314-9',
                            'doi'     : '10.1093/nar/gkv314'
                        }]
                  },

    'crank2'    : { 'name'     : 'Crank-2',
                    'category' : 'primary',
                    'refs'     : [{
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
                            'pages'   : '166-171',
                            'doi'     : '10.1107/S2052252517017961'
                        },{
                            'authors' : 'Skubak, P., Pannu, N.S.',
                            'title'   : 'Automatic protein structure solution from weak X-ray data',
                            'journal' : 'Nature Comm.',
                            'volume'  : '4',
                            'year'    : '2013',
                            'pages'   : '2777',
                            'doi'     : '10.1038/ncomms3777'
                        }]
                  },

    'sc' :        { 'name'     : 'SC',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Lawrence, M.C., Colman, P.M.',
                            'title'   : 'Shape complementarity at protein/protein interfaces',
                            'journal' : 'J. Mol. Biol.',
                            'volume'  : '234(4)',
                            'year'    : '1993',
                            'pages'   : '946-950',
                            'doi'     : '10.1006/jmbi.1993.1648'
                        }]
                  },

    'shelx' :     { 'name'     : 'SHELX',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Sheldrick, G.M.',
                            'title'   : 'A short history of SHELX',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A64',
                            'year'    : '2008',
                            'pages'   : '112-122',
                            'doi'     : '10.1107/S0108767307043930'
                        }]
                  },

    'shelxc'    : { 'name'     : 'SHELXC',
                    'category' : 'primary',
                    'copy'     : [['shelx',-1]]  # -1 means copy all
                  },

    'shelxe'    : { 'name'     : 'SHELXE',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Uson, I., Sheldrick, G.M.',
                            'title'   : 'An introduction to experimental phasing of macromolecules illustrated by SHELX; new autotracing features',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '106-116',
                            'doi'     : '10.1107/S2059798317015121'
                        }]
                  },

    'shelxd' :    { 'name'     : 'SHELXD',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Schneider, T.R., Sheldrick, G.M.',
                            'title'   : 'Substructure solution with SHELXD',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D58',
                            'year'    : '2002',
                            'pages'   : '1772-1779',
                            'doi'     : '10.1107/S0907444902011678'
                        }]
                  },

    'uglymol' :   { 'name'     : 'UglyMol',
                    'desc'     : 'javascript molecular graphics',
                    'category' : 'viewer',
                    'refs'     : [{
                            'authors' : 'Wojdyr, M.',
                            'title'   : 'UglyMol: a WebGL macromolecular viewer focused on the electron density',
                            'journal' : 'J. Open Source Softw.',
                            'volume'  : '2(18)',
                            'year'    : '2017',
                            'pages'   : '350',
                            'doi'     : '10.21105/joss.00350'
                        }]
                  },

    'gemmi'   :   { 'name'     : 'GEMMI',
                    'desc'     : 'library for structural biology',
                    'category' : 'primary',
                    'refs' : [{
                          'authors' : 'Wojdyr, M.',
                          'title'   : 'GEMMI: A library for structural biology',
                          'journal' : 'J. Open Source Softw.',
                          'volume'  : '7(73)',
                          'year'    : '2022',
                          'pages'   : '4200',
                          'doi'     : '10.21105/joss.04200'
                        }]
                  },


    'ccp4mg'  :   { 'name'     : 'CCP4 MG',
                    'desc'     : 'CCP4 molecular graphics',
                    'category' : 'viewer',
                    'refs'     : [{
                            'authors' : 'McNicholas, S., Potterton, E., Wilson, K.S., Noble, M.E.M.',
                            'title'   : 'Presenting your structures: the CCP4mg molecular-graphics software',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '386-394',
                            'doi'     : '10.1107/S0907444911007281'
                        }]
                  },

    'ccp4mg-primary'  :  { 'name'     : 'CCP4 MG',
                    'desc'     : 'CCP4 molecular graphics',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'McNicholas, S., Potterton, E., Wilson, K.S., Noble, M.E.M.',
                            'title'   : 'Presenting your structures: the CCP4mg molecular-graphics software',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '386-394',
                            'doi'     : '10.1107/S0907444911007281'
                        }]
                  },

    'viewhkl' :   { 'name'     : 'ViewHKL',
                    'desc'     : 'reflection data viewer',
                    'category' : 'viewer',
                    'refs'     : [{
                            'authors' : 'Evans, P., Krissinel, E.',
                            'title'   : 'ViewHKL: Reflection data viewer',
                            'journal' : 'Unpublished',
                            'volume'  : '',
                            'year'    : '2011',
                            'pages'   : '',
                            'doi'     : ''
                        }]
                  },

    'jscofe'  : { 'name'     : 'CCP4 Cloud',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Krissinel, E., Uski, V., Lebedev, A., Winn, M., Ballard, C.',
                            'title'   : 'Distributed computing for macromolecular crystallography',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '143-151',
                            'doi'     : '10.1107/S2059798317014565'
                  }]
                },

    'ccp4cloud'  : { 'name'     : 'CCP4 Cloud',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Krissinel, E., Lebedev, A.A., Uski, V., Ballard, C.B., Keegan, R.M., Kovalevskiy, O., Nicholls, R.A., Pannu, N.S., Skubak, P., Berrisford, J., Fando, M., Lohkamp, B., Wojdyr, M., Simpkin, A.J., Thomas, J.M.H., Oliver, C., Vonrhein, C., Chojnowski, G., Basle, A., Purkiss, A., Isupov, M.N., McNicholas, S., Lowe, E., Trivino, J., Cowtan, K., Agirre, J., Rigden, D.J., Uson, I., Lamzin, V., Tews, I., Bricogne, G., Leslie, A.G.W. & Brown, D.G.',
                            'title'   : 'CCP4 Cloud for structure determination and project management in macromolecular crystallography',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D78',
                            'year'    : '2022',
                            'pages'   : '1079-1089',
                            'doi'     : '10.1107/S2059798322007987'
                  }]
                },

    'clustalw2' : { 'name'   : 'ClustalW2',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Larkin, M.A., Blackshields, G., Brown, N.P., ' +\
                                        'Chenna, R., McGettigan, P.A., McWilliam, H., ' +\
                                        'Valentin, F., Wallace, I.M., Wilm, A., Lopez, R., ' +\
                                        'Thompson, J.D., Gibson, T.J., Higgins, D.G.',
                            'title'   : 'Clustal W and Clustal X version 2.0',
                            'journal' : 'Bioinformatics',
                            'volume'  : '23',
                            'year'    : '2007',
                            'pages'   : '2947-2948',
                            'doi'     : '10.1093/bioinformatics/btm404'
                  }]
                },

    'acorn' :   { 'name'   : 'ACORN',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Yao, J.X., Woolfson, M.M., Wilson, K.S., and Dodson E.J.',
                            'title'   : 'A modified ACORN to solve protein structures at resolutions of 1.7 A or better',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D61',
                            'year'    : '2005',
                            'pages'   : '1465-1475',
                            'doi'     : '10.1107/S090744490502576X'
                          },{
                            'authors' : 'Yao, J.X., Dodson, E.J., Wilson, K.S., Woolfson, M.M.',
                            'title'   : 'ACORN: a review',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D62',
                            'year'    : '2006',
                            'pages'   : '901-908',
                            'doi'     : '10.1107/S0907444906008122'
                  }]
                },

    'crossec' : { 'name'     : 'CROSSEC',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Cromer, D.T.',
                            'title'   : 'Calculation of anomalous scattering factors at arbitrary wavelengths',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '16',
                            'year'    : '1983',
                            'pages'   : '437',
                            'doi'     : '10.1107/S0021889883010791'
                  }]
                },

    'edstats' : { 'name'     : 'EDStats',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Tickle, I.J., Laskowski, R.A. and Moss, D.S.',
                            'title'   : 'Error Estimates of Protein Structure Coordinates and Deviations from Standard Geometry by Full-Matrix Refinement of &gamma;B- and &beta;B2-Crystallin',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D54',
                            'year'    : '1998',
                            'pages'   : '243-252',
                            'doi'     : '10.1107/S090744499701041X'
                  }]
                },

    'dui'     : { 'name'     : 'DUI',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Fuentes-Montero, L., Parkhurst, J., Gerstel, M., Gildea, R., Winter, G., Vollmar, M., Waterman, D. and Evans, G.',
                            'title'   : 'Introducing DUI, a graphical interface for DIALS',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A72',
                            'year'    : '2016',
                            'pages'   : 's189-s189',
                            'doi'     : '10.1107/S2053273316097199'
                  }]
                },

    'imosflm' : { 'name'     : 'iMosflm',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Leslie, A. G. W.',
                            'title'   : 'The integration of macromolecular diffraction data',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D62',
                            'year'    : '2006',
                            'pages'   : '48-57',
                            'doi'     : '10.1107/S0907444905039107'
                        },{
                            'authors' : 'Battye, T. G. G., Kontogiannis, L., Johnson, O., Powell, H. R. & Leslie, A. G. W.',
                            'title'   : 'iMOSFLM: a new graphical interface for diffraction-image processing with MOSFLM',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D67',
                            'year'    : '2011',
                            'pages'   : '271-281',
                            'doi'     : '10.1107/S0907444910048675'
                  }]
                },

    'molprobity' : { 'name'  : 'MolProbity',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Williams C. J., Hintze B. J., Headd J. J., Moriarty N. W., Chen V. B., Jain S., ' +
                                        'Prisant M. G., Lewis S. M., Videau L. L. , Keedy D. A., Deis L. N., ' +
                                        'Arendall W. B. III, Verma V., Snoeyink J. S., Adams P. D., Lovell S. C., ' +
                                        'Richardson J. S., Richardson D. C.',
                            'title'   : 'MolProbity: More and better reference data for improved all-atom structure validation',
                            'journal' : 'Protein Science',
                            'volume'  : '27',
                            'year'    : '2018',
                            'pages'   : '293-315',
                            'doi'     : '10.1002/pro.3330'
                        },{
                            'authors' : 'Grosse-Kunstleve R. W., Sauter N. K., Moriarty N. W., Adams P. D.',
                            'title'   : 'The Computational Crystallography Toolbox: crystallographic algorithms in ' +
                                        'a reusable software framework',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '35',
                            'year'    : '2002',
                            'pages'   : '126-136',
                            'doi'     : '10.1107/S0021889801017824'
                  }]
                },

    'molprobity.molprobity'  : { 'name'     : 'MolProbity',
                  'category' : 'primary',
                  'copy'     : [['molprobity',-1]]  # -1 means copy all
                },

    'molprobity.clashscore'  : { 'name'     : 'MolProbity',
                  'category' : 'primary',
                  'copy'     : [['molprobity',-1]]  # -1 means copy all
                },

    'lsqkab'  : { 'name'     : 'LSQKAB',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Kabsch, W.',
                            'title'   : 'A solution for the best rotation to relate two sets of vectors',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'A32',
                            'year'    : '1976',
                            'pages'   : '922-923',
                            'doi'     : '10.1107/S0567739476001873'
                  }]
                },

    'fragon'  : { 'name'     : 'Fragon',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Jenkins, H.T.',
                            'title'   : 'Fragon: rapid high-resolution structure determination from ideal protein fragments',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D74',
                            'year'    : '2018',
                            'pages'   : '205-214',
                            'doi'     : '10.1107/S2059798318002292'
                  }]
                },

    'auspex'  : { 'name'     : 'Auspex',
                  'category' : 'primary',
                  'refs'     : [{
                            'authors' : 'Thorn, A., Parkhurst, J., Emsley, P., Nicholls, R. A., Vollmar, M., Evans, G. & Murshudov, G. N.',
                            'title'   : 'AUSPEX: a graphical tool for X-ray diffraction data analysis',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D73',
                            'year'    : '2017',
                            'pages'   : '729-737',
                            'doi'     : '10.1107/S205979831700969X'
                  }]
                },

    'pdbredo' :   { 'name'     : 'PDB-REDO',
                    'category' : 'primary',
                    'refs'     : [{
                            'authors' : 'Robbie P. Joosten, Fei Long, Garib N. Murshudov and Anastassis Perrakis',
                            'title'   : 'The PDB_REDO server for macromolecular structure model optimization',
                            'journal' : 'IUCrJ',
                            'volume'  : '1',
                            'year'    : '2014',
                            'pages'   : '213-220',
                            'doi'     : 'https://doi.org/10.1107/S2052252514009324'
                         }]
                  },

    'findmysequence' : { 'name'     : 'findMySequence',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Chojnowski, G., Simpkin, A. J., Leonardo, D. A., Seifert-Davila, W., Vivas-Ruiz, D. E., Keegan, R. M. & Rigden, D. J.',
                            'title'   : 'findMySequence: a neural-network-based approach for identification of unknown proteins in X-ray crystallography and cryo-EM',
                            'journal' : 'IUCrJ',
                            'volume'  : '9',
                            'year'    : '2022',
                            'pages'   : '86-97',
                            'doi'     : '10.1107/S2052252521011088'
                         }]
                  },
    'checkmysequence' : { 'name'     : 'checkMySequence',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Chojnowski, G.',
                            'title'   : 'Sequence-assignment validation in protein crystal structure models with checkMySequence',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D79',
                            'year'    : '2023',
                            'pages'   : '559-568',
                            'doi'     : '10.1107/S2059798323003765'
                         }]
                  },


    'omit'           : { 'name'     : 'Omit',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Vellieux, F.M.D., and Dijkstra, B.W.',
                            'title'   : "Computation of Bhat's OMIT maps with different coefficients",
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '30',
                            'year'    : '1997',
                            'pages'   : '396-399',
                            'doi'     : '10.1107/S0021889896012551'
                         }]
                  },

    'pairef'         : { 'name'     : 'PAIREF',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Maly, M., Diederichs, K., Dohnalek, J. & Kolenko, P.',
                            'title'   : 'Paired refinement under the control of PAIREF',
                            'journal' : 'IUCrJ',
                            'volume'  : '7',
                            'year'    : '2020',
                            'pages'   : '681-692',
                            'doi'     : '10.1107/S2052252520005916'
                         }]
                  },

    'pdbval'         : { 'name'     : 'PDB Validation Report',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Read, R.J., Adams, P.D., Arendall, W.B. 3rd, Brunger, A.T., Emsley, P., Joosten, R.P., Kleywegt, G.J., Krissinel, E.B., Lütteke, T., Otwinowski, Z., Perrakis, A., Richardson, J.S., Sheffler, W.H., Smith, J.L., Tickle, I.J., Vriend, G., and Zwart, P.H.',
                            'title'   : 'A new generation of crystallographic validation tools for the protein data bank',
                            'journal' : 'Structure',
                            'volume'  : '19(10)',
                            'year'    : '2011',
                            'pages'   : '1395-412',
                            'doi'     : '10.1016/j.str.2011.08.006'
                          }]  
                  },

    'rapper'         : { 'name'     : 'Rapper',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Nicholas Furnham, Paul de Bakker, Mark DePristo, Reshma Shetty, Swanand Gore and Tom Blundell',
                            'title'   : 'RAPPER Program',
                            'journal' : 'CCP4 Software Suite',
                            'volume'  : '',
                            'year'    : '',
                            'pages'   : '',
                            'doi'     : ''
                          },{
                            'authors' : 'Lovell, S.C., Davis, I.W., Arendall III, W.B., de Bakker, P.I.W., Word, J.M., Prisant, M.G., Richardson, J.S., and Richardson, D.C.',
                            'title'   : 'Structure validation by Calpha geometry: phi,psi and Cbeta deviation',
                            'journal' : 'Proteins: Struct. Funct. Genet.',
                            'volume'  : '50',
                            'year'    : '2003',
                            'pages'   : '437-450',
                            'doi'     : '10.1002/prot.10286'
                        }]
                  },
    'rabdam'         : { 'name'     : 'RABDAM',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Shelley, K. L., Dixon, T. P. E., Brooks-Bartlett, J. C. & Garman, E. F. ',
                            'title'   : 'RABDAM',
                            'journal' : 'J. Appl. Cryst.',
                            'volume'  : '51',
                            'year'    : '2018',
                            'pages'   : '522-559',
                            'doi'     : 'https://doi.org/10.1107/S1600576718002509'
                          },{
                            'authors' : 'Gerstel, M., Deane, C. M. & Garman, E. F.',
                            'title'   : 'Identifying and quantifying radiation damage at the atomic level',
                            'journal' : 'J. Synchrotron Radiat ',
                            'volume'  : '22',
                            'year'    : '2015',
                            'pages'   : '201-212',
                            'doi'     : 'https://doi.org/10.1107/S1600577515002131'
                        },{
                            'authors' : 'Shelley, K.L., Garman, E.F',
                            'title'   : 'Quantifying and comparing radiation damage in the Protein Data Bank',
                            'journal' : 'Nat Commun',
                            'volume'  : '13',
                            'year'    : '2022',
                            'pages'   : '1314',
                            'doi'     : 'https://doi.org/10.1038/s41467-022-28934-0'
                        }]
                  },

    'jligand'        : { 'name'     : 'JLigand',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Long, F., Nicholls, R.A., Emsley, P., Grazulis, S., Merkys, A., Vaitkusb, A., Murshudov, G.N.',
                            'title'   : 'AceDRG: a stereochemical description generator for ligands',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D73',
                            'year'    : '2017',
                            'pages'   : '112-122',
                            'doi'     : '10.1107/S2059798317000067'
                         },{
                            'authors' : 'Lebedev, A. A., Young, P., Isupov, M. N., Moroz, O. V., Vagin, A. A. and Murshudov, G. N.',
                            'title'   : 'JLigand: a graphical tool for the CCP4 template-restraint library',
                            'journal' : 'Acta Cryst.',
                            'volume'  : 'D68', 
                            'year'    : '2012',
                            'pages'   : '431-440',
                            'doi'     : '10.1107/S090744491200251X'
                         }]
                  },

    'import_serial'  : { 'name'     : 'Import Serial',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Martin Maly, University of Southampton, UK',
                            'title'   : 'Import Serial',
                            'journal' : '',
                            'volume'  : '',
                            'year'    : '2024',
                            'pages'   : '',
                            'doi'     : ''
                         }]
                  },

    'iris'           : { 'name'     : 'Iris',
                         'category' : 'primary',
                         'refs'     : [{
                            'authors' : 'Rochira, W. and Agirre, J.',
                            'title'   : 'Iris: Interactive all-in-one graphical validation of 3D protein model iterations',
                            'journal' : 'Protein Sci.',
                            'volume'  : '30(1)',
                            'year'    : '2021',
                            'pages'   : '93-107',
                            'doi'     : '10.1002/pro.3955',
                            'pmid'    : '32964594',
                            'pmcid'   : 'PMC7737763'
                         }]
                  }

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


#  Analysis tasks may be used in the project, but their citations may not
# propagate down to the PDB Deposition task, where all citations are summed up
# because not all of them produce a revision (like PISA) or may be left in an
# unsuccessful bransh but nevertheless essential for decision making (like
# Zanuda). In such cases, all project is hovered and if use of such tasks
# is detected, they are offered to user for discreational citation.

analysis_tasks = {
   'TaskZanuda'   : { 'name' : 'Zanuda',
                      'desc' : 'Space group validation',
                      'copy' : [['zanuda',-1]]
                    },
   'TaskPISA'     : { 'name' : 'PISA',
                      'desc' : 'Assembly and interface analysis',
                      'copy' : [['jspisa',-1]]
                    },
   'TaskGesamt'   : { 'name' : 'GESAMT',
                      'desc' : 'Structural alignment in 3D',
                      'copy' : [['gesamt',-1]]
                    },
   'TaskSeqAlign' : { 'name' : 'ClustalW2',
                      'desc' : 'Sequence alignment',
                      'copy' : [['clustalw2',-1]]
                    },
   'TaskCrosSec' :  { 'name' : 'CROSSEC',
                      'desc' : 'Anomalous scattering factors calculations',
                      'copy' : [['crossec',-1]]
                    },
}


# citation array for current process
citation_list = []


def addCitation ( appName ):
    global citation_list
    appRef = os.path.splitext ( os.path.basename(appName) )[0]
    #if appName.endswith(".bat"):
    #    appRef = appName[:len(appName)-4]
    if appRef not in citation_list:
        citation_list.append ( appRef )
    return

def addCitations ( appName_list ):
    for appName in appName_list:
        addCitation ( appName )
    return

def removeCitation ( appName ):
    global citation_list
    appRef = os.path.splitext ( os.path.basename(appName) )[0]
    while appRef in citation_list:
        citation_list.remove ( appRef )
    return

def clearCitations():
    global citation_list
    citation_list = []
    return


def makeCitation ( reference ):
    year = ","
    if reference["year"]:
        year = " (" + reference["year"] + ")"
    refhtml = reference["authors"] + year  + " <i>" +\
              reference["title"] + ".</i> " + reference["journal"] + " <b>" +\
              reference["volume"] + "</b>"
    if reference['pages']:
        refhtml += ": " + reference["pages"]
    if reference['doi']:
        refhtml += "; <a href='https://doi.org/" + reference["doi"] +\
                   "' target='_blank'><i>doi:" + reference["doi"] + "</i></a>"
    if 'url' in reference:
        refhtml += "; <a href='" + reference["url"] +\
                   "' target='_blank'><i>URL</i></a>"
    return refhtml


def _get_references ( citation,appName,lists ):
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
                        lists['nocopy'].append ( "index:" + appName + "/" + aname )
                else:
                    lists['nocopy'].append ( "refs:" + appName + "/" + aname )
            else:
                lists['nocopy'].append ( "citation:" + appName + "/" + aname )
    if 'refs' in citation:
        refs += citation['refs']
    return refs


def get_citation_html_list ( citation,appName,desc_bool,lists ):

    rlst = []

    if citation['name']:

        refs = _get_references ( citation,appName,lists )
        lst  = []

        if len(refs)<=0:
            if appName not in lists['deflist']:
                cit = makeCitation ( citations['default']['refs'][0] )
                if cit not in lists['flist']:
                    lists['flist'].append ( cit )
                if citation['category']=='primary':
                    lists['deflist'].append ( appName )
                else:
                    lst.append ( "<li>" + cit + "</li>" )
        else:
            for reference in refs:
                cit  = makeCitation ( reference )
                if cit not in lists['flist']:
                    lists['flist'].append ( cit )
                    lst.append ( "<li>" + cit + "</li>" )
                elif desc_bool:
                    lst.append ( "<li>" + cit + "</li>" )

        if desc_bool and len(lst)>0:
            html_str = "<li><b><font style='font-size:110%'><i>" +\
                           citation['name'] + "</i></font>:</b>"
            if 'desc' in citation:
                html_str += " <i>(" + citation['desc'] + ")</i>"
            rlst.append ( html_str + "<ul>" + "".join(lst) + "</ul></li>" )
        else:
            rlst += lst

    return rlst


def make_html_list ( clist,category,desc_bool,lists ):
    rlist = []
    for appName in clist:
        if appName in citations:
            citation = citations[appName]
            if citation['category']==category:
                rlist += get_citation_html_list ( citation,appName,desc_bool,lists )
        elif appName not in lists['noref']:
            lists['noref'].append ( appName )
    return rlist


def makeCitationsHTML ( body,width="" ):
    # makes list of references after a job

    if not citation_list:
        return None

    else:

        lists = { 'noref'   : [], # not referenced
                  'deflist' : [], # default reference
                  'nocopy'  : [], # citation index errors
                  'flist'   : []  # all citations
                }

        html  = ""

        plist = make_html_list ( citation_list,'primary',True,lists )  # primary tasks citations
        #lists['deflist'].append ( 'ccp4' )
        ccp4ref = lists['deflist']

        if len(plist)+len(ccp4ref)>0:
            html = "<b>The following programs were used:</b><ul>" + "".join(plist)
            if len(ccp4ref)>0:
                html += "<li><b><font style='font-size:110%'><i>" + citations[ccp4ref[0]]['name']
                for i in range(1,len(ccp4ref)):
                    html += ", " + citations[ccp4ref[i]]['name']
                html += "</i></font>:</b><ul><li>" + makeCitation(citations['default']['refs'][0]) + "</ul></li>"
            html += "</ul>"

        slist = make_html_list ( citation_list,'service',True,lists )  # viewer category citations
        vlist = make_html_list ( citation_list,'viewer' ,True,lists )  # viewer category citations

        if len(slist)>0:
            html += "<b>The following programs were used in various service operations and/or " +\
                    "visual data preparation:</b><ul>" +\
                    "".join(slist) + "</ul>"

        if len(vlist)>0:
            html += "<b>You may have used the following graphical viewers:</b><ul>" +\
                    "".join(vlist) + "</ul>"

        html += "<b>Results were delivered to you by " + body.appName() + ":</b><ul><li>" +\
                makeCitation(citations['ccp4cloud']['refs'][0]) + "</li></ul>"

        html += "&nbsp;<p><hr/><i>Please note: full set of references related to your " +\
                "final results will be generated by the PDB Deposition task</i>"

        if len(lists['noref'])>0:
            html += "<p><font style='font-size:85%'><i>Developer: no references for " +\
                    str(lists['noref']) + ", please provide</i></font>"
        if len(lists['nocopy'])>0:
            html += "<p><font style='font-size:85%'><i>Developer: citation index errors: " +\
                    str(lists['nocopy']) + ", please correct</i></font>"

        # html    = "<b>The following programs were used:</b><ul>"
        # noref   = []
        # nocopy  = []
        # ccp4ref = []
        # viewers = []
        # service = []
        # for appName in citation_list:
        #     if appName in citations:
        #         citation = citations[appName]
        #         refs     = _get_references ( citation )
        #         if citation['category']=='viewer':
        #             viewers += refs
        #         elif len(refs)>0:
        #             html += "<li><b><font style='font-size:110%'><i>" + citation['name'] +\
        #                     "</i></font>:</b><ul>"
        #             for reference in refs:
        #                 html += "<li>" + makeCitation(reference) + "</li>"
        #             html += "</ul>&nbsp;<br></li>"
        #         elif citation['name']:
        #             ccp4ref.append ( appName )
        #     else:
        #         noref.append ( appName )

        # html = "<b>The following programs were used:</b><ul>"


        # ccp4ref.append ( 'ccp4' )
        # html += "<li><b><font style='font-size:110%'><i>" + citations[ccp4ref[0]]['name']
        # for i in range(1,len(ccp4ref)):
        #     html += ", " + citations[ccp4ref[i]]['name']
        # html += "</i></font>:</b><ul><li>" + makeCitation(citations['default']['refs'][0]) + "</ul></li>"

        # html += "</ul><b>Results were delivered to you by " + body.appName() + ":</b><ul><li>" +\
        #         makeCitation(citations['jscofe']['refs'][0]) + "</li></ul>"
        # if len(viewers)>0:
        #     html += "<b>You may have used the following graphical viewers:</b><ul>"
        #     for reference in viewers:
        #         html += "<li>" + makeCitation(reference) + "</li>"
        #     html += "</ul>"

        # html += "&nbsp;<p><hr/><i>Please note: full set of references related to your " +\
        #         "final results will be generated by the PDB Deposition task</i>"

        # if len(noref)>0:
        #     html += "<p><font style='font-size:85%'><i>Developer: no references for " +\
        #             str(noref) + ", please provide</i></font>"
        # if len(nocopy)>0:
        #     html += "<p><font style='font-size:85%'><i>Developer: citation index errors: " +\
        #             str(nocopy) + ", please correct</i></font>"

    if width:
        html = "<div style=\"width:" + width + "\">" + html + "</div>"
    return html


def makeSummaryCitationsHTML ( clist,eol_tasks ):
    # makes final list of references

    if not clist:
        return ""

    else:

        lists = { 'noref'   : [], # not referenced
                  'deflist' : [], # default reference
                  'nocopy'  : [], # citation index errors
                  'flist'   : []  # all citations
                }

        plist = make_html_list ( clist,'primary',False,lists )  # primary tasks citations
        vlist = make_html_list ( clist,'viewer' ,True ,lists )  # viewer category citations

        alist = []
        if eol_tasks:
            for i in range(len(eol_tasks)):
                if eol_tasks[i] in analysis_tasks:
                    alist += get_citation_html_list ( analysis_tasks[eol_tasks[i]],"",True,lists )

        rstr  = "<li>" + makeCitation(citations['default']['refs'][0]) + "</li>"
        if rstr not in plist:
            plist.append ( rstr )

        rstr  = "<li>" + makeCitation(citations['jscofe']['refs'][0]) + "</li>"
        if rstr not in plist:
            plist.append ( rstr )

        html  = "<b>Your structure was solved using developments from publications " +\
                "listed below. Please cite them when publishing:</b><ul>" +\
                "".join(plist) + "</ul>"

        if len(alist)>0:
            html += "<b>The following programs were used in the Project, however, " +\
                    "they may not have direct relation to structure solution. " +\
                    "Please cite them as you find appropriate:</b><ul>" +\
                    "".join(alist) + "</ul>"

        if len(vlist)>0:
            html += "<b>Throughout the Project, you may have used the following " +\
                    "graphical viewers, please cite them at your discretion:</b><ul>" +\
                    "".join(vlist) + "</ul>"

        if len(lists['noref'])>0:
            html += "<p><font style='font-size:85%'><i>Developer: no references for " +\
                    str(lists['noref']) + ", please provide</i></font>"
        if len(lists['nocopy'])>0:
            html += "<p><font style='font-size:85%'><i>Developer: citation index errors: " +\
                    str(lists['nocopy']) + ", please correct</i></font>"

    return html
