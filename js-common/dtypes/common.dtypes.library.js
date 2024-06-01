
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template_d = null;
var __cmd        = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template_d = require ( './common.dtypes.template' );
  __cmd        = require ( '../common.commands' );
}

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataLibrary()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type = 'DataLibrary';
  this.codes = [];  // contains ligand codes

}

// if (__template_d)
//       DataLibrary.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataLibrary.prototype = Object.create ( DataTemplate.prototype );
// DataLibrary.prototype.constructor = DataLibrary;

if (__template_d)
  __cmd.registerClass1 ( 'DataLibrary',DataLibrary,__template_d.DataTemplate.prototype );
else    registerClass1 ( 'DataLibrary',DataLibrary,DataTemplate.prototype );


// ===========================================================================

DataLibrary.prototype.title = function()  { return 'Ligand Library'; }
DataLibrary.prototype.icon  = function()  { return 'data';           }

// when data class version is changed here, change it also in python
// constructors
DataLibrary.prototype.currentVersion = function()  {
  let version = 0;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template_d)  {
  // for client side

  DataLibrary.prototype.makeDataSummaryPage = function ( task )  {
    let dsp = new DataSummaryPage ( this );
    dsp.makeRow ( 'File name',this.files[file_key.lib],'Imported or generated file name' );
    return dsp;
  }

} else  {
  //  for server side
  module.exports.DataLibrary = DataLibrary;

}
