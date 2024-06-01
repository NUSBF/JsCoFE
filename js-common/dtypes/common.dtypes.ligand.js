
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.ligand.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ligand Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
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

function DataLigand()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type      = 'DataLigand';
  //this.title      = 'Ligand Library';
  this.code       = 'DRG';

}

// if (__template_d)
//       DataLigand.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataLigand.prototype = Object.create ( DataTemplate.prototype );
// DataLigand.prototype.constructor = DataLigand;

if (__template_d)
  __cmd.registerClass ( 'DataLigand',DataLigand,__template_d.DataTemplate.prototype );
else    registerClass ( 'DataLigand',DataLigand,DataTemplate.prototype );

// ===========================================================================

DataLigand.prototype.title = function()  { return 'Ligand Structure'; }
DataLigand.prototype.icon  = function()  { return 'data';             }

// when data class version is changed here, change it also in python
// constructors
DataLigand.prototype.currentVersion = function()  {
  let version = 0;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template_d)  {
  // for client side

  DataLigand.prototype.makeDataSummaryPage = function ( task )  {
    let dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name',this.files[file_key.xyz],'Imported or generated file name' );

    return dsp;

  }

} else  {
  //  for server side
  module.exports.DataLigand = DataLigand;

}
