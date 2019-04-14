
/*
 *  =================================================================
 *
 *    25.02.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.utils.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  X-Utils
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

_chem_elements = [
  'H' ,'He','Li','Be','B' ,'C' ,'N' ,'O' ,'F' ,'Ne','Na','Mg','Al','Si','P' ,
  'S' ,'Cl','Ar','K' ,'Ca','Sc','Ti','V' ,'Cr','Mn','Fe','Co','Ni','Cu','Zn',
  'Ga','Ge','As','Se','Br','Kr','Rb','Sr','Y' ,'Zr','Nb','Mo','Tc','Ru','Rh',
  'Pd','Ag','Cd','In','Sn','Sb','Te','I' ,'Xe','Cs','Ba','La','Ce','Pr','Nd',
  'Pm','Sm','Eu','Gd','Tb','Dy','Ho','Er','Tm','Yb','Lu','Hf','Ta','W' ,'Re',
  'Os','Ir','Pt','Au','Hg','Tl','Pb','Bi','Po','At','Rn','Fr','Ra','Ac','Th',
  'Pa','U' ,'Np','Pu','Am','Cm','Bk','Cf','Es','Fm','Md','No','Lr','Rf','Db',
  'Sg','Bh','Hs','Mt','Ds','Rg','Cn','Nh','Fl','Mc','Lv','Ts','Og'
];

function checkElementSymbol ( symbol )  {
  var su = symbol.toUpperCase();
  var sc = null;
  for (var i=0;(i<_chem_elements.length) && (!sc);i++)
    if (_chem_elements[i].toUpperCase()==su)
      sc = _chem_elements[i];
  return sc;
}

_sg_class_list = [
   ['P 4 3 2', 'P 41 3 2', 'P 42 3 2', 'P 43 3 2'],
   ['I 4 3 2', 'I 41 3 2'],
   ['F 4 3 2', 'F 41 3 2'],
   ['P 2 3'  , 'P 21 3'  ],
   ['I 2 3'  , 'I 21 3'  ],
   ['F 2 3' ],
   ['P 4 2 2', 'P 4 21 2', 'P 41 2 2', 'P 41 21 2', 'P 42 2 2', 'P 42 21 2', 'P 43 2 2', 'P 43 21 2'],
   ['P 4'    , 'P 41'    , 'P 42'    , 'P 43'    ],
   ['I 4 2 2', 'I 41 2 2'],
   ['I 4'    , 'I 41'    ],
   ['P 6 2 2', 'P 61 2 2', 'P 62 2 2', 'P 63 2 2', 'P 64 2 2', 'P 65 2 2'],
   ['P 6'    , 'P 61'    , 'P 62'    , 'P 63'    , 'P 64'    , 'P 65'    ],
   ['P 3 2 1', 'P 31 2 1', 'P 32 2 1'],
   ['P 3 1 2', 'P 31 1 2', 'P 32 1 2'],
   ['P 3'    , 'P 31'    , 'P 32'],
   ['H 3 2' ],
   ['H 3'   ],
   ['P 2 2 2', 'P 21 2 2', 'P 2 21 2', 'P 2 2 21', 'P 2 21 21', 'P 21 2 21', 'P 21 21 2', 'P 21 21 21'],
   ['C 2 2 2', 'C 2 2 21'  ],
   ['I 2 2 2', 'I 21 21 21'],
   ['F 2 2 2'],
   ['P 1 2 1', 'P 1 21 1'],
   ['C 1 2 1'],
   ['I 1 2 1'],
   ['P 1'    ]
];

_sg_enantimorph_list = [
   ['P 41 3 2' , 'P 43 3 2' ],
   ['P 41 2 2' , 'P 43 2 2' ],
   ['P 41 21 2', 'P 43 21 2'],
   ['P 41'     , 'P 43'     ],
   ['P 61 2 2' , 'P 65 2 2' ],
   ['P 62 2 2' , 'P 64 2 2' ],
   ['P 61'     , 'P 65'     ],
   ['P 62'     , 'P 64'     ],
   ['P 31 2 1' , 'P 32 2 1' ],
   ['P 31 1 2' , 'P 32 1 2' ],
   ['P 31'     , 'P 32'     ]
];

_sg_indistinguishable_list = [
   ['I 2 3'  , 'I 21 3'    ],
   ['I 2 2 2', 'I 21 21 21']
];


function getAllPointSpG ( sg )  {
var sg_list = [];

  for (var j=0;j<_sg_class_list.length;j++)  {
    var n = _sg_class_list[j].indexOf(sg);
    if (n>=0)  {
      sg_list = _sg_class_list[j];
      break;
    }
  }

  return sg_list;

}


function getEnantiomorphSpG ( sg )  {
var sg_enantiomorph = null;

  for (var j=0;j<_sg_enantimorph_list.length;j++)  {
    var n = _sg_enantimorph_list[j].indexOf(sg);
    if (n>=0)  {
      sg_enantiomorph = _sg_enantimorph_list[j][(n+1)%2];
      break;
    }
  }

  return sg_enantiomorph;

}


function getIndistinguishableSpG  ( sg )  {
var sg_indistinguishable = null;

  for (var j=0;j<_sg_indistinguishable_list.length;j++)  {
    var n = _sg_indistinguishable_list[j].indexOf(sg);
    if (n>=0)  {
      sg_indistinguishable = _sg_indistinguishable_list[j][(n+1)%2];
      break;
    }
  }

  return sg_indistinguishable;

}

function get_cons_sg_list ( sg )  {

  var sg_out_list = [];
  for (var i=0;i<_sg_class_list.length;i++)  {

    var k = _sg_class_list[i].indexOf(sg);
    if (k>=0)  {

      sg_out_list = _sg_class_list[i].slice(0);
      sg_out_list.splice(k,1);

      for (var j=0;j<_sg_enantimorph_list.length;j++)  {
        var n = _sg_enantimorph_list[j].indexOf(sg);
        if (n>=0)  {
          var m = sg_out_list.indexOf ( _sg_enantimorph_list[j][(n+1)%2] );
          var sg0 = sg_out_list[0];
          sg_out_list[0] = sg_out_list[m] + ' (enantiomorph)';
          if (m>0)
            sg_out_list[m] = sg0;
          break;
        }
      }

      for (var j=0;j<_sg_indistinguishable_list.length;j++)  {
        var n = _sg_indistinguishable_list[j].indexOf(sg);
        if (n>=0)  {
          var m = sg_out_list.indexOf ( _sg_indistinguishable_list[j][(n+1)%2] );
          var sg0 = sg_out_list[0];
          sg_out_list[0] = sg_out_list[m] + ' (indistinguishable)';
          if (m>0)
            sg_out_list[m] = sg0;
          break;
        }
      }

      break;

    }

  }

  return sg_out_list;

}
