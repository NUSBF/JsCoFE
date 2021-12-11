
/*
 *  =================================================================
 *
 *   11.12.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.alignment.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Borges Library Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021
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

function DataBorges()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type = 'DataBorges';

}

if (__template)
      DataBorges.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataBorges.prototype = Object.create ( DataTemplate.prototype );
DataBorges.prototype.constructor = DataBorges;


// ===========================================================================

DataBorges.prototype.title = function()  { return 'Borges library'; }
DataBorges.prototype.icon  = function()  { return 'data';           }

// when data class version is changed here, change it also in python
// constructors
DataBorges.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  DataBorges.prototype.makeDataSummaryPage = function ( task )  {
    var dsp = new DataSummaryPage ( this );

    dsp.makeRow ( 'File name',this.files[file_key.borges],'Imported file name' );

    return dsp;

  }

} else  {
  //  for server side

  module.exports.DataBorges = DataBorges;

}
