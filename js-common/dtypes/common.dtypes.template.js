
/*
 *  =================================================================
 *
 *    06.12.17   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */


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
  this.files      = [];                    // list of files
  this.associated = [];                    // list of associated data Ids
  this.backtrace  = true;                  // collect all data up the tree branch
}


// ===========================================================================

DataTemplate.prototype.title      = function()  { return 'Template Data';           }
DataTemplate.prototype.icon_small = function()  { return './images/data_20x20.svg'; }
DataTemplate.prototype.icon_large = function()  { return './images/data.svg';       }

DataTemplate.prototype.currentVersion = function()  { return 0; }

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

  // cast() should extend (deep-copy) all data classes referenced in
  // given data type body and cast the whole type to the new one given
  DataTemplate.prototype.cast = function ( newTypeName ) {
    var ext_class = this.extend();
    if (newTypeName.startsWith('Data') && (newTypeName!=this._type))  {
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
  DataTemplate.prototype.dataDialogHints = function ( subtype_list ) {
    return [];  // No help hints by default
  }

  /*
  // See use of addCustomDataState in crank2 interface
  DataTemplate.prototype.addCustomDataState = function ( task,inpDataRef,dataState )  {
    return;
  }
  */

}
