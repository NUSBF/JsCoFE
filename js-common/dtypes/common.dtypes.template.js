
/*
 *  =================================================================
 *
 *    11.03.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */


 // ===========================================================================

  var file_key = {
    'xyz'   : 'xyz',     // atomic coordinates
    'mmcif' : 'mmcif',   // atomic coordinates in mmCIF format
    'sol'   : 'sol',     // phaser's sol file
    'sub'   : 'sub',     // heavy atom (substructure) coordinates
    'seq'   : 'seq',     // sequence file
    'mtz'   : 'mtz',     // .mtz file with hkl and/or phases
    'map'   : 'map',     // map file
    'dmap'  : 'dmap',    // difference map file
    'lib'   : 'lib',     // ligand dictionary
    'coot'  : 'coot',    // Coot python script
    'molp'  : 'molp',    // molprobity_probe.txt file
    'hhr'   : 'hhr'      // hhpred alignment file
 }

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
}


// ===========================================================================

DataTemplate.prototype.title = function()  { return 'Template Data'; }
DataTemplate.prototype.icon  = function()  { return 'data';          }

DataTemplate.prototype.currentVersion = function()  { return 2; } // from 25.08.2018

// export such that it could be used in both node and a browser
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  // server side

  module.exports.DataTemplate = DataTemplate;

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
    var ext_class = this.extend();
//    if (newTypeName.startsWith('Data') && (newTypeName!=this._type))  {
    if (startsWith(newTypeName,'Data') && (newTypeName!=this._type))  {
      var new_class   = eval ( 'new '+newTypeName+'()' );      // new default class
      var cst_class   = $.extend ( true,new_class,ext_class ); // extend with this
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
    var dlg = new DataInspectDialog ( this.makeDataSummaryPage(task),
                                      this.dname,800,700 );
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
      case 'substructure' : return 'heavy atom substructure';
      case 'phases'       : return 'phases';
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
  var with_items    = [];
  var without_items = [];

    this.get_item = function ( subtype )  {
      if (['!','~'].indexOf(subtype[0])>=0)  {
        var s = this.subtypeDescription ( subtype.substring(1) );
        if (s)  {
          if (subtype[0]=='!')  with_items   .push ( s );
                          else  without_items.push ( s );
        }
      } else  {
        var s = this.subtypeDescription ( subtype );
        if (s)
          with_items.push ( ' ' + s );
      }
    }

    if (stype.constructor==Array)  {
      for (var j=0;j<stype.length;j++)
        this.get_item ( stype[j] );
    } else
      this.get_item ( stype );

    var sdesc = '';
    var n     = with_items.length + without_items.length;
    if (n==1)  {
      if (with_items.length==1)  sdesc = with_items[0];
                           else  sdesc = 'no ' + without_items[0];
    } else if (n>1)  {
      sdesc = 'at least one of<ul style="margin:0;">';
      for (var i=0;i<with_items.length;i++)
        sdesc += '<li>' + with_items[i].trim() + '</li>';
      for (var i=0;i<without_items.length;i++)
        sdesc += '<li>no ' + without_items[i] + '</li>';
      sdesc += '</ul>';
    }

    return sdesc;

    /*
    var subtype = stype;
    var mod     = '';
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
