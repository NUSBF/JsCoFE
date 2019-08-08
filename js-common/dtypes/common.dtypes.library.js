
/*
 *  =================================================================
 *
 *    08.08.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.library.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Library Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.template' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataLibrary()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type = 'DataLibrary';
  this.codes = [];  // contains ligand codes

}

if (__template)
      DataLibrary.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataLibrary.prototype = Object.create ( DataTemplate.prototype );
DataLibrary.prototype.constructor = DataLibrary;


// ===========================================================================

DataLibrary.prototype.title = function()  { return 'Ligand Library'; }
DataLibrary.prototype.icon  = function()  { return 'data';           }

// when data class version is changed here, change it also in python
// constructors
DataLibrary.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataLibrary.prototype.makeDataSummaryPage = function ( task )  {
    var dsp = new DataSummaryPage ( this );
    dsp.makeRow ( 'File name',this.files[file_key.lib],'Imported or generated file name' );
    return dsp;
  }

} else  {
  //  for server side
  module.exports.DataLibrary = DataLibrary;

}
