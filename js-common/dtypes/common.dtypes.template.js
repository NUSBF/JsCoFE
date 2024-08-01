
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.template.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Base Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __cmd  = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __cmd  = require ( '../common.commands' );

// ===========================================================================

const file_key = {
  'xyz'    : 'xyz',     // atomic coordinates
  'mmcif'  : 'mmcif',   // atomic coordinates in mmCIF format
  'sol'    : 'sol',     // phaser's sol file
  'sub'    : 'sub',     // heavy atom (substructure) coordinates
  'seq'    : 'seq',     // sequence file
  'mtz'    : 'mtz',     // .mtz file with hkl and/or phases
  'map'    : 'map',     // map file
  'dmap'   : 'dmap',    // difference map file
  'lib'    : 'lib',     // ligand dictionary
  'coot'   : 'coot',    // Coot python script
  'molp'   : 'molp',    // molprobity_probe.txt file
  'hhr'    : 'hhr',     // hhpred alignment file
  'borges' : 'borges'   // borges library file
};

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataTemplate()  {
  this._type      = 'DataTemplate';        // defines data type
  this.version    = this.currentVersion(); // version of data class
  this.subtype    = [];                    // default 'basic' subtype
  this.jobId      = '';                    // Id of producing job
  this.dataId     = '';                    // (unique) data Id
  this.dname      = 'template';            // data name for displaying
  this.files      = {};                    // list of files, uses file_key (above)
  this.associated = [];                    // list of associated data Ids
  this.backtrace  = true;                  // collect all data up the tree branch
  this.citations  = [];                    // list of program citations
  // this.refkeys    = {};                    // reference keyworded parameters;
                                              // this line should stay comented.
                                              // Look using refkeys in 
                                              // DataTemplate.store_refkeys_parameters() and
                                              // TaskTemplate.set_refkeys_parameters()
                                              // in python and js layers, respectively.
}

if (__cmd)
  __cmd.registerClass ( 'DataTemplate',DataTemplate,null );
else    registerClass ( 'DataTemplate',DataTemplate,null );

// ===========================================================================

DataTemplate.prototype.title = function()  { return 'Template Data'; }
DataTemplate.prototype.icon  = function()  { return 'data';          }

DataTemplate.prototype.currentVersion = function()  { return 2; } // from 25.08.2018

DataTemplate.prototype.makeSample = function()  {
// this function created a fake data object for use in Workflow Creator
  return this;
}

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  // server side

  module.exports.DataTemplate = DataTemplate;
  module.exports.file_key     = file_key;

} else  {
  // client (browser) side

  // extend() should extend (deep-copy) all data classes referenced in
  // given data type body
  DataTemplate.prototype.extend = function() {
    return $.extend ( true,{},this );
  }

  DataTemplate.prototype.hasSubtype = function ( stype ) {
    return (this.subtype.indexOf(stype)>=0);
  }

  DataTemplate.prototype.setSubtype = function ( stype ) {
    this.subtype = [stype];
  }

  DataTemplate.prototype.addSubtype = function ( stype ) {
    if (this.subtype.indexOf(stype)<0)
      this.subtype.push ( stype );
  }

  // cast() should extend (deep-copy) all data classes referenced in
  // given data type body and cast the whole type to the new one given
  DataTemplate.prototype.cast = function ( newTypeName ) {
    let ext_class = this.extend();
//    if (newTypeName.startsWith('Data') && (newTypeName!=this._type))  {
    if (startsWith(newTypeName,'Data') && (newTypeName!=this._type))  {
      let new_class   = makeNewInstance ( newTypeName );      // new default class
      let cst_class   = $.extend ( true,new_class,ext_class ); // extend with this
      cst_class._type = new_class._type;   // cast to new class name
      return cst_class;
    } else
      return ext_class;
  }


  // layCustomDropdownInput() is just the placeholder for function that can be
  // redefined in other data classes, derived from DataTemplate.
  //
  // Arguments:
  //  'task'       reference to class instance
  //  'dropdown'   is the dropdown widget, for which the custom input should
  //               be formed. The input must be placed in grid given by
  //               dropdown.customGrid provided, which is placed under the
  //               corresponding dropdown selector. In addition, 'dropdown'
  //               contains:
  //                 dropdown.layCustom  the value of 'layCustom' field from
  //                                     the task's definition of input data
  //                                     (see task definition for Crank2)
  //                 dropdown.serialNo   the serial number of the dataset
  //                                     in the input data part of task
  //                                     interface
  //  'tdata'       vector of data classes, whose descriptors are loaded in
  //                'dropdown'. The currently selected data is found as
  //                tdata[dropdown.getValue()].
  //
  // The function can put input widgets, specific to thr dataset,
  // in this grid, as opposite to placing them in the general parameters
  // section. For example, placing scattering coefficients and wavelength
  // type for inidvidual datasets in MAD/MIRAS task interfaces immediately
  // after the corresponding dataset is a better solution than putting them
  // into the common parameters section.
  //
  DataTemplate.prototype.layCustomDropdownInput = function ( dropdown ) {}

  DataTemplate.prototype.makeDataSummaryPage = function ( task ) {
    return new DataSummaryPage ( this );
  }

  DataTemplate.prototype.inspectData = function ( task ) {
    let dlg = new DataInspectDialog ( this.makeDataSummaryPage(task),
                                      this.dname,'800px','700px' );
    dlg.launch();
    //new MessageBox ( "Not implemented","Data Viewer not Implemented.");
  }

  // collectCustomDropdownInput() must accompany layCustomData(). This function
  // reads input fields in 'dropdown.customGrid' and puts their values into the
  // corresponding fields of the data class. In case of errors (such as
  // wrong numeric formats), the function must return an error message;
  // otherwise, return empty string. The 'dropdown' parameter has the same
  // propertoies as in layCustomDropdownInput().
  DataTemplate.prototype.collectCustomDropdownInput = function ( dropdown ) {
    return '';  // Ok by default
  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataTemplate.prototype.dataDialogHints = function ( subtype_list,n_allowed ) {
    return [];  // No help hints by default
  }

  // subtypeDescription() should return detail description of given subtype
  // in context of specific data object. This description is used in
  // TaskDataDialog. Empty return will suppress description output in
  // task data dialog.
  DataTemplate.prototype.subtypeDescription = function ( subtype )  {
    switch (subtype)  {
      case 'anomalous'    : return 'anomalous signal';
      case 'protein'      : return 'protein sequence(s)';
      case 'unknown'      : return 'unknown';
      case 'rna'          : return 'RNA sequence(s)';
      case 'dna'          : return 'DNA sequence(s)';
      case 'xyz'          : return 'macromolecular model(s)';
      case 'seq'          : return 'macromolecular sequence(s)';
      case 'substructure' : return 'heavy atom substructure';
      case 'phases'       : return 'phases';
      case 'mmcif_only'   : return 'items incompatible with PDB format, such ' + 
                                   'as<br>long ligand names, multi-character ' +
                                   'chain IDs and<br>more than 62 chains';
      default : ;
    }
    return '';
  }

  // See use of this function in cofe.dialog_taskdata.js
  DataTemplate.prototype.ddesc_bridge_word = function()  {
    return ', containing ';
  }

  // getSubtypeDescription() should return detail description of given subtype
  // in context of specific data object. This description is used in
  // TaskDataDialog. Empty return will suppress description output in
  // task data dialog.
  DataTemplate.prototype.getSubtypeDescription = function ( stype )  {
  let with_items    = [];
  let without_items = [];

    this.get_item = function ( subtype )  {
      if (['!','~'].indexOf(subtype[0])>=0)  {
        let s = this.subtypeDescription ( subtype.substring(1) );
        if (s)  {
          if (subtype[0]=='!')  with_items   .push ( s );
                          else  without_items.push ( s );
        }
      } else  {
        let s = this.subtypeDescription ( subtype );
        if (s)
          with_items.push ( ' ' + s );
      }
    }

    if (stype.constructor==Array)  {
      for (let j=0;j<stype.length;j++)
        this.get_item ( stype[j] );
    } else
      this.get_item ( stype );

    let sdesc = '';
    let n     = with_items.length + without_items.length;
    if (n==1)  {
      if (with_items.length==1)  sdesc = with_items[0];
                           else  sdesc = 'no ' + without_items[0];
    } else if (n>1)  {
      sdesc = 'at least one of<ul style="margin:0;">';
      for (let i=0;i<with_items.length;i++)
        sdesc += '<li>' + with_items[i].trim() + '</li>';
      for (let i=0;i<without_items.length;i++)
        sdesc += '<li>no ' + without_items[i] + '</li>';
      sdesc += '</ul>';
    }

    return sdesc;

    /*
    let subtype = stype;
    let mod     = '';
    if (stype[0]=='!')  {
      mod     = '!';
      subtype = stype.substring(1);
    } else if (stype[0]=='~')  {
      mod     = '~';
      subtype = stype.substring(1);
    }
    return this.subtypeDescription ( subtype,mod );
    */
  }

  /*
  // See use of addCustomDataState in crank2 interface
  DataTemplate.prototype.addCustomDataState = function ( task,inpDataRef,dataState )  {
    return;
  }
  */

}

function getRefKeys ( data_obj,taskType )  {
  if (('refkeys' in data_obj) && (taskType in data_obj.refkeys))
    return data_obj.refkeys[taskType];
  return null;
}

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  module.exports.file_key = file_key;
}