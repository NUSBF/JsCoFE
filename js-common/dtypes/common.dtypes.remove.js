
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.xyz.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Proxy class for making [remove] items in data comboboxes
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2024
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

function DataRemove()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type   = 'DataRemove';
  this.subtype = ['proxy'];      // special non-functional subtype
  this.dname   = '[remove]';     // data name for displaying

}

// if (__template_d)
//       DataRemove.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataRemove.prototype = Object.create ( DataTemplate.prototype );
// DataRemove.prototype.constructor = DataRemove;

if (__template_d)
  __cmd.registerClass ( 'DataRemove',DataRemove,__template_d.DataTemplate.prototype );
else    registerClass ( 'DataRemove',DataRemove,DataTemplate.prototype );

// ===========================================================================

// export such that it could be used in both node and a browser
if (__template_d)  {
  //  for server side
  module.exports.DataRemove = DataRemove;

}
