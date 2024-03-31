
/*
 *  =================================================================
 *
 *    31.03.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.xyz' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

const structure_subtype = {
  XYZ          : 'xyz',
  SUBSTRUCTURE : 'substructure',
  PHASES       : 'phases'
}

function DataStructure()  {

  if (__template)  __template.DataXYZ.call ( this );
             else  DataXYZ.call ( this );

  this._type      = 'DataStructure';

  //  Refmac labels
  this.FP         = '';  // used in Buccaneer-MR and Parrot-MR
  this.FC         = '';  // used in Omit map
  this.SigFP      = '';  // used in Buccaneer-MR and Parrot-MR
  this.PHI        = '';
  this.FOM        = '';
  this.FWT        = '';
  this.PHWT       = '';
  this.DELFWT     = '';
  this.PHDELWT    = '';
  this.FAN        = '';
  this.PHAN       = '';
  this.DELFAN     = '';
  this.PHDELAN    = '';

  // Hendrickson-Lattman Coefficients
  this.HLA        = '';
  this.HLB        = '';
  this.HLC        = '';
  this.HLD        = '';

  // Free R-flag
  this.FreeR_flag = '';

  this.leadKey    = 0;   // data lead key: 0: undefined, 1: coordinates, 2: phases

  // Fields used in interfaces

  this.useCoordinates = true;  // flag for using in Phaser-EP
  this.rmsd           = 0.3;   // used in Phaser-EP

  this.removeNonAnom  = false; // for use in Crank-2

  this.useModelSel    = 'N';   // for use in Buccaneer and Nautilus
  this.initPhaseSel   = structure_subtype.XYZ;  // for use in Acorn and ArpWarp
  this.BFthresh       = 3.0;
  this.phaseBlur      = 1.0;   // used in arpwarp
  this.mapSel         = 'diffmap'; // map selection ('diffmap','directmap') for coot tasks

  this.ligands        = [];    // list of ligand codes fitted
  this.refmacLinks    = [];    // list of LINKR records
  this.links          = [];    // list of LINK records

  this.mapLabels      = null;  // used in UglyMol widgets

  this.refiner        = '';    // refinement program used

}

if (__template)
      DataStructure.prototype = Object.create ( __template.DataXYZ.prototype );
else  DataStructure.prototype = Object.create ( DataXYZ.prototype );
DataStructure.prototype.constructor = DataStructure;


// ===========================================================================

DataStructure.prototype.title = function()  { return 'Structure Data'; }
DataStructure.prototype.icon  = function()  { return 'data';           }

// when data class version is changed here, change it also in python
// constructors
DataStructure.prototype.currentVersion = function()  {
  let version = 3;  // advanced on FitWaters/FitLigands
  if (__template)
        return  version + __template.DataXYZ.prototype.currentVersion.call ( this );
  else  return  version + DataXYZ.prototype.currentVersion.call ( this );
}


DataStructure.prototype.isSubstructure = function()  {
  return (this.subtype.indexOf(structure_subtype.SUBSTRUCTURE)>=0);
}

DataStructure.prototype.hasPhases = function()  {
  return (this.subtype.indexOf(structure_subtype.PHASES)>=0);
}

DataStructure.prototype.hasXYZ = function()  {
  return (this.subtype.indexOf(structure_subtype.XYZ)>=0);
}

DataStructure.prototype.phaseType = function()  {
  switch (this.leadKey)  {
    case 1 : if (this.isSubstructure())
                  return 'Calculated from substructure coordinates'
             else return 'Calculated from macromolecular model';
    case 2 : return 'Calculated via Experimental Phasing';
    default : ;
  }
  return 'Not phased';
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataStructure.prototype.getCellParameters = function() {
    return DataXYZ.prototype.getCellParameters.call ( this );
  }

  DataStructure.prototype.getSpaceGroup = function() {
    return DataXYZ.prototype.getSpaceGroup.call ( this );
  }

  DataStructure.prototype.makeDataSummaryPage = function ( task )  {

    let dsp = DataXYZ.prototype.makeDataSummaryPage.call ( this,task );

    if (this.files.hasOwnProperty(file_key.sol))
      dsp.makeRow ( 'Phaser\'s SOL file',this.files[file_key.sol],'SOL file with phaser\'s output metadata' );
    if (this.files.hasOwnProperty(file_key.coot))
      dsp.makeRow ( 'Molprobity\'s script',this.files[file_key.coot],'Coot script with molprobity data' );
    if (this.files.hasOwnProperty(file_key.molp))
      dsp.makeRow ( 'MolProbity probe',this.files[file_key.molp],'MolProbity "probe" file' );
    if (this.files.hasOwnProperty(file_key.mtz))
      dsp.makeRow ( 'MTZ file',this.files[file_key.mtz],'Associated MTZ file name' );
    if (this.files.hasOwnProperty(file_key.map))
      dsp.makeRow ( 'Map file',this.files[file_key.map],'Name of file with electron density map' );
    if (this.files.hasOwnProperty(file_key.dmap))
      dsp.makeRow ( 'Difference map file',this.files[file_key.dmap],'Name of file with difference map' );
    if (this.files.hasOwnProperty(file_key.lib))
      dsp.makeRow ( 'Restraints file',this.files[file_key.lib],'Name of file with crystallogtaphic restraints' );
    if (this.ligands.length>0)
      dsp.makeRow ( 'Ligand descriptions',this.ligands.join(', '),'Codes of ligands found in ligand library' );
    if (this.refmacLinks.length>0)
      dsp.makeRow ( 'Links with description',this.refmacLinks.join(', '),
        'Formulas (Residue1.Atom1-Atom2.Residue2) for covalent links with descripton (LINKR)' );
    if (this.links.length>0)
      dsp.makeRow ( 'Links without description',this.links.join(', '),
        'Formulas (Residue1.Atom1-Atom2.Residue2) for covalent links without descripton (LINK)' );
    if (this.hasPhases())
      dsp.makeRow ( 'Phases\' type',this.phaseType(),'Type of phasing method used to calculate phases' );

    dsp.addViewHKLButton ( task );

    return dsp;

  }


  DataStructure.prototype.layCustomDropdownInput = function ( dropdown ) {

    let customGrid = dropdown.customGrid;
    let row = customGrid.getNRows();

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

    if (startsWith(dropdown.layCustom,'phaser-ep'))  {

      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {

        /*
        if (dropdown.in_revision)  {
          customGrid.setLabel ( '<b>Current structure model will be used for the ' +
                                'calculation of initial phases (MR-SAD)</b>',
                                row++,0,1,6 ).setFontBold(true).setFontItalic(true)
                                             .setNoWrap();
          setLabel ( 'Assumed r.m.s.d. from target:',row,0 );
        } else
          setLabel ( 'Calculate from coordinates; assumed r.m.s.d. from target',row,0 );
        */

        setLabel ( 'Assumed r.m.s.d. from target:',row,0 );

        customGrid.rmsd = customGrid.setInputText ( this.rmsd,row,1,1,1 )
            .setStyle     ( 'text','real','0.3','Estimated difference between ' +
                            'given model and target structure, in &Aring;.' )
            .setWidth_px  ( 60 );
        customGrid.setVerticalAlignment ( row,1,'middle' );

        //if (!dropdown.in_revision)
        //  customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );

      }

    } else if (dropdown.layCustom=='buccaneer-ws')  {

      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
        // macromolecular coordinates are present in the input structures

        setLabel ( 'Use model to place and name chains, and&nbsp;',row,0 );
        customGrid.useModelSel = new Dropdown();
        customGrid.useModelSel.setWidth ( '120%' );
        customGrid.useModelSel.addItem ( 'nothing else','','N',
                                         (!this.useModelSel) || 
                                         this.useModelSel=='mr-model-fixed' ||
                                         this.useModelSel=='N' );
        customGrid.useModelSel.addItem ( 'seed chain growing','','mr-model-seed',
                                          this.useModelSel=='mr-model-seed' );
        customGrid.useModelSel.addItem ( 'provide initial model','','mr-model-filter',
                                          this.useModelSel=='mr-model-filter' );
        customGrid.setWidget   ( customGrid.useModelSel, row,1,1,2 );
        customGrid.useModelSel.make();

        setBFthresh ( ++row,0,this.BFthresh );

        customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );

      }

    } else if (dropdown.layCustom=='buccaneer-xm')  {

      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
        // macromolecular coordinates are present in the input structures
        setBFthresh ( row,0,this.BFthresh );
      }

    } else if (dropdown.layCustom=='nautilus')  {

      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
        // macromolecular coordinates are present in the input structures
        setLabel ( 'Current model:',row,0 );
        customGrid.useModelSel = new Dropdown();
        customGrid.useModelSel.setWidth ( '120%' );
        customGrid.useModelSel.addItem ( 'ignore','','N',this.useModelSel=='N' );
        customGrid.useModelSel.addItem ( 'consider fixed','','mr-model-fixed',
                 (this.useModelSel!='N') || this.useModelSel=='mr-model-fixed' );
        customGrid.setWidget ( customGrid.useModelSel, row,1,1,2 );
        customGrid.useModelSel.make();
      }

    } else if (['acorn','arpwarp'].indexOf(dropdown.layCustom)>=0)  {

      let ddn_list = [];
      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)
        ddn_list.push ( ['model coordinates',structure_subtype.XYZ] );
      if (this.subtype.indexOf(structure_subtype.PHASES)>=0)
        ddn_list.push ( ['phases',structure_subtype.PHASES] );
      if ((dropdown.layCustom=='acorn') &&
          (this.subtype.indexOf(structure_subtype.SUBSTRUCTURE)>=0))
        ddn_list.push ( ['substructure coordinates',structure_subtype.SUBSTRUCTURE] );

      if (ddn_list.length>1)  {
        setLabel ( 'Obtain density from',row,0 );
        customGrid.initPhaseSel = new Dropdown();
        //customGrid.initPhaseSel.setWidth ( '120%' );
        customGrid.initPhaseSel.setWidth ( '240px' );
        for (let i=0;i<ddn_list.length;i++)
          customGrid.initPhaseSel.addItem ( ddn_list[i][0],'',ddn_list[i][1],
                                           this.initPhaseSel==ddn_list[i][1] );
        customGrid.setWidget ( customGrid.initPhaseSel, row,1,1,4 );
        customGrid.initPhaseSel.make();
      } else
        customGrid.initPhaseSel = null;

      if (dropdown.layCustom=='acorn')
        customGrid.setLabel ( ' ',++row,0,1,2 ).setHeight_px ( 8 );

    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {

      DataXYZ.prototype.layCustomDropdownInput.call ( this,dropdown );

    } else if (startsWith(dropdown.layCustom,'cell-info'))  {

      DataXYZ.prototype.layCustomDropdownInput.call ( this,dropdown );

    } else if (startsWith(dropdown.layCustom,'map-sel'))  {
      if (!(this.hasOwnProperty('mapSel')))
        this.mapSel = 'diffmap';
      setLabel ( 'Use map:',row,0 );
      customGrid.mapSel = new Dropdown();
      //customGrid.mapSel.setWidth ( '240px' );
      if (((!this.DELFWT) || (!this.PHDELWT)) && (this.leadKey==2))
        customGrid.mapSel.addItem ( "experimental",'',"directmap",true );
      else  {
        if (this.FWT && this.PHI)
          customGrid.mapSel.addItem ( "2Fo-Fc",'',"directmap",this.mapSel=='directmap' );
        if (this.DELFWT && this.PHDELWT)
          customGrid.mapSel.addItem ( "Fo-Fc",'',"diffmap",this.mapSel=='diffmap' );
      }
      customGrid.setWidget ( customGrid.mapSel,row,1,1,4 );
      customGrid.mapSel.make();
    }

  }


  DataStructure.prototype.collectCustomDropdownInput = function ( dropdown ) {

    let msg = '';   // Ok by default
    let customGrid = dropdown.customGrid;

    if (startsWith(dropdown.layCustom,'phaser-ep'))  {
      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)
        this.rmsd = customGrid.rmsd.getValue();
    } else if (dropdown.layCustom=='buccaneer-ws')  {
      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
        this.useModelSel = customGrid.useModelSel.getValue();
        this.BFthresh    = customGrid.BFthresh   .getValue();
      }
    } else if (dropdown.layCustom=='buccaneer-xm')  {
      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)  {
        this.BFthresh = customGrid.BFthresh.getValue();
      }
    } else if (dropdown.layCustom=='nautilus')  {
      if (this.subtype.indexOf(structure_subtype.XYZ)>=0)
        this.useModelSel = customGrid.useModelSel.getValue();
    } else if (['acorn','arpwarp'].indexOf(dropdown.layCustom)>=0)  {
      if (customGrid.initPhaseSel)
        this.initPhaseSel = customGrid.initPhaseSel.getValue();
      else if (this.subtype.indexOf(structure_subtype.XYZ)>=0)
        this.initPhaseSel = structure_subtype.XYZ;
      else if (dropdown.layCustom=='arpwarp')
        this.initPhaseSel = structure_subtype.PHASES;
      else if (this.subtype.indexOf(structure_subtype.SUBSTRUCTURE)>=0)
        this.initPhaseSel = structure_subtype.SUBSTRUCTURE;
      else if (this.subtype.indexOf(structure_subtype.PHASES)>=0)
        this.initPhaseSel = structure_subtype.PHASES;
      else
        this.initPhaseSel = '';
    } else if (startsWith(dropdown.layCustom,'chain-sel'))  {
      DataXYZ.prototype.collectCustomDropdownInput.call ( this,dropdown );
    } else if (startsWith(dropdown.layCustom,'map-sel'))  {
      this.mapSel = customGrid.mapSel.getValue();
    }

    return msg;

  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataStructure.prototype.dataDialogHints = function ( subtype_list,n_allowed ) {
  let hints = [ 'Have imported a PDB or mmCIF file with coordinates and ' +
                'wonder why <i>"Structure"</i> data type is not available to ' +
                'the task? <a href="javascript:' +
                    'launchHelpBox1(\'Structure and XYZ\',' +
                                  '\'./html/jscofe_faq_structure_xyz.html\',' +
                                  'null,10)"><i>' +
                String('Check here').fontcolor('blue') + '</i></a>.'
              ];

    if (subtype_list.length>0)
      hints.push ( 'If you are certain that you have <i>"Structure"</i> data produced ' +
                   'in one of jobs up the current branch of the job tree, make ' +
                   'sure that it has a suitable subtype as shown in brackets : (' +
                   subtype_list.join(',') + '). For example, subtype "protein" ' +
                   'means that the structure must contain aminoacid chain(s).'
                 );
    return hints;  // No help hints by default
  }


} else  {
  //  for server side

  module.exports.DataStructure     = DataStructure;
  module.exports.structure_subtype = structure_subtype;

}
