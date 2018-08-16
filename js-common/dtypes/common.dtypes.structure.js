
/*
 *  =================================================================
 *
 *    09.08.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.structure.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Structure Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.xyz' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

var structure_subtype = {
  MR  : 'MR',
  EP  : 'EP',
  XYZ : 'xyz'
}

function DataStructure()  {

  if (__template)  __template.DataXYZ.call ( this );
             else  DataXYZ.call ( this );

  this._type      = 'DataStructure';

  //  Refmac labels
  this.FP         = '';  // used in Buccaneer-MR and Parrot-MR
  this.SigFP      = '';  // used in Buccaneer-MR and Parrot-MR
  this.PHI        = '';
  this.FOM        = '';
  this.FWT        = '';
  this.PHWT       = '';
  this.DELFWT     = '';
  this.PHDELWT    = '';

  // Hendrickson-Lattman Coefficients
  this.HLA        = '';
  this.HLB        = '';
  this.HLC        = '';
  this.HLD        = '';

  // Free R-flag
  this.FreeR_flag = '';

  this.useCoordinates = true;  // flag for using in Phaser-EP
  this.rmsd           = 0.3;   // used in Phaser-EP

  //this.useForNCS      = true;  // for use in Parrot

  this.useModelSel    = 'N';   // for use in Buccaneer
  this.BFthresh       = 3.0;

  this.ligands        = [];    // list of ligands fitted

}

if (__template)
      DataStructure.prototype = Object.create ( __template.DataXYZ.prototype );
else  DataStructure.prototype = Object.create ( DataXYZ.prototype );
DataStructure.prototype.constructor = DataStructure;


// ===========================================================================

DataStructure.prototype.title      = function()  { return 'Structure Data';          }
DataStructure.prototype.icon_small = function()  { return './images/data_20x20.svg'; }
DataStructure.prototype.icon_large = function()  { return './images/data.svg';       }

// when data class version is changed here, change it also in python
// constructors
DataStructure.prototype.currentVersion = function()  { return 1; } // from 09.08.2018

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataStructure.prototype.makeDataSummaryPage = function ( task )  {

    var dsp = DataXYZ.prototype.makeDataSummaryPage.call ( this,task );

    if (this.files.hasOwnProperty(file_key.sub))
      dsp.makeRow ( 'HA-XYZ file',this.files[file_key.sub],'Heavy atom (substructure) file name' );
    if (this.files.hasOwnProperty(file_key.mtz))
      dsp.makeRow ( 'MTZ file',this.files[file_key.mtz],'Associated MTZ file name' );
    if (this.files.hasOwnProperty(file_key.map))
      dsp.makeRow ( 'Map file',this.files[file_key.map],'Name of file with electron density map' );
    if (this.files.hasOwnProperty(file_key.dmap))
      dsp.makeRow ( 'Difference map file',this.files[file_key.dmap],'Name of file with difference map' );
    if (this.files.hasOwnProperty(file_key.lib))
      dsp.makeRow ( 'Restraints file',this.files[file_key.lib],'Name of file with crystallogtaphic restraints' );
    if (this.ligands.length>0)
      dsp.makeRow ( 'Ligands fitted',this.ligands.join(', '),'Codes for fitted ligands' );

    dsp.addViewHKLButton ( task );

    return dsp;

  }


  DataStructure.prototype.layCustomDropdownInput = function ( dropdown ) {

    var customGrid = dropdown.customGrid;
    var row = 0;

    function setLabel ( title,row,col )  {
      customGrid.setLabel ( title,row,col,1,1 ).setFontItalic(true).setNoWrap();
      customGrid.setVerticalAlignment ( row,col,'middle' );
    }

    function setBFthresh ( row,col,value )  {
      setLabel ( 'Eliminate residues with B-factors higher than ',row,col );
      customGrid.BFthresh = customGrid.setInputText ( value,row,col+1,1,1 )
        .setStyle    ( 'text','real','3.0','Threshold value for acceptable ' +
                       'B-factors' )
        .setWidth_px ( 30 );
      setLabel ( '&sigma; above the mean',row,col+2 )
    }

//    if (dropdown.layCustom.startsWith('phaser-ep'))  {
    if (startsWith(dropdown.layCustom,'phaser-ep'))  {

      if (this.subtype.indexOf('substructure')<0)
            setLabel ( 'Calculate from coordinates; assumed r.m.s.d. from target',row,0 );
      else  setLabel ( 'Assumed r.m.s.d. from target',row,0 );

      customGrid.rmsd = customGrid.setInputText ( this.rmsd,row,1,1,1 )
          .setStyle     ( 'text','real','0.3','Estimated difference between ' +
                          'given model and target structure, in &Aring;.' )
          .setWidth_px  ( 60 );
      customGrid.setVerticalAlignment ( row,1,'middle' );

      customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );

//    } else if (startsWith(dropdown.layCustom,'parrot'))  {
//      customGrid.useForNCS = customGrid.setCheckbox ( 'Use for NCS detection',
//                    this.useForNCS, row,0, 1,1 );
//      customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );

    } else if (dropdown.layCustom=='buccaneer-ws')  {

      if (this.subtype.indexOf('xyz')>=0)  {
        // macromolecular coordinates are present in the input structures

        setLabel ( 'Use model to place and name chains, and&nbsp;',row,0 );
        customGrid.useModelSel = new Dropdown();
        customGrid.useModelSel.setWidth ( '120%' );
        customGrid.useModelSel.addItem ( 'nothing else','','N',this.useModelSel=='N' );
        customGrid.useModelSel.addItem ( 'seed chain growing','','mr-model-seed',
                                          this.useModelSel=='mr-model-seed' );
        customGrid.useModelSel.addItem ( 'provide initial model','','mr-model-filter',
                                          this.useModelSel=='mr-model-filter' );
        customGrid.setWidget   ( customGrid.useModelSel, 0,1,1,2 );
        //customGrid.setCellSize ( '160px','',0,1 );
        customGrid.useModelSel.make();

//        customGrid.filterByBF = customGrid.setCheckbox ( 'Filter by B-factor',
//                                                this.filterByBF, ++row,0, 1,1 );

        setBFthresh ( ++row,0,this.BFthresh );

        customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );

        /*
        customGrid.useForSeeding = customGrid.setCheckbox ( 'Use for seed chain growing',
                      this.useForSeeding, row,0, 1,1 );
        customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );
        */

      }

    } else if (dropdown.layCustom=='buccaneer-xm')  {

      if (this.subtype.indexOf('xyz')>=0)  {
        // macromolecular coordinates are present in the input structures
        setBFthresh ( row,0,this.BFthresh );
      }

//    } else if (dropdown.layCustom.startsWith('chain-sel'))  {
    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {
      DataXYZ.prototype.layCustomDropdownInput.call ( this,dropdown );
    }

  }


  DataStructure.prototype.collectCustomDropdownInput = function ( dropdown ) {

    var msg = '';   // Ok by default
    var customGrid = dropdown.customGrid;

    if (startsWith(dropdown.layCustom,'phaser-ep'))  {
      this.rmsd = customGrid.rmsd.getValue();
    //} else if (startsWith(dropdown.layCustom,'parrot'))  {
    //  this.useForNCS = customGrid.useForNCS.getValue();
    } else if (dropdown.layCustom=='buccaneer-ws')  {
      if (this.subtype.indexOf('xyz')>=0)  {
        this.useModelSel = customGrid.useModelSel.getValue();
        this.BFthresh    = customGrid.BFthresh   .getValue();
      }
    } else if (dropdown.layCustom=='buccaneer-xm')  {
      if (this.subtype.indexOf('xyz')>=0)  {
        this.BFthresh = customGrid.BFthresh.getValue();
      }
    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {
      DataXYZ.prototype.collectCustomDropdownInput.call ( this,dropdown );
    }

    return msg;

  }


  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataStructure.prototype.dataDialogHints = function ( subtype_list ) {
  var hints = [ 'Have imported a PDB or mmCIF file with coordinates and ' +
                'wonder why <i>"Structure"</i> data type is not available to ' +
                'the task? <a href="javascript:' +
                    'launchHelpBox(\'Structure and XYZ\',' +
                                  '\'./html/jscofe_faq_structure_xyz.html\',' +
                                  'null,10)"><i>' +
                String('Check here').fontcolor('blue') + '</i></a>.'
              ];

    if (subtype_list.length>0)
      hints.push ( 'If you are certain that you have <i>"Structure"</i> data produced ' +
                   'in one of jobs up the current branch of the job tree, make ' +
                   'sure that it has a suitable subtype as shown in brackets : (' +
                   subtype_list.join(',') + '). For example, subtype "MR" or ' +
                   '"EP" mean that the structure must have been obtained via ' +
                   'Molecular Replacement or Experimental Phasing, respectively.'
                 );
    return hints;  // No help hints by default
  }


} else  {
  //  for server side

  module.exports.DataStructure = DataStructure;

}
