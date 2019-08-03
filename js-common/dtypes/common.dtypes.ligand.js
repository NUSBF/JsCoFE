
/*
 *  =================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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

function DataLigand()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type      = 'DataLigand';
  //this.title      = 'Ligand Structure';
  this.code       = 'DRG';

}

if (__template)
      DataLigand.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataLigand.prototype = Object.create ( DataTemplate.prototype );
DataLigand.prototype.constructor = DataLigand;


// ===========================================================================

DataLigand.prototype.title = function()  { return 'Ligand Structure'; }
DataLigand.prototype.icon  = function()  { return 'data';             }

// when data class version is changed here, change it also in python
// constructors
DataLigand.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataLigand.prototype.makeDataSummaryPage = function ( task )  {
    var dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name',this.files[file_key.xyz],'Imported or generated file name' );

    return dsp;

  }

} else  {
  //  for server side
  module.exports.DataLigand = DataLigand;

}
