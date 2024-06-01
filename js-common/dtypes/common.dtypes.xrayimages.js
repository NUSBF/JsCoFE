
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.xrayimages.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- X-ray Images Data Class
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

function DataXRayImages()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type = 'DataXRayImages';

}

// if (__template_d)
//       DataXRayImages.prototype = Object.create ( __template_d.DataTemplate.prototype );
// else  DataXRayImages.prototype = Object.create ( DataTemplate.prototype );
// DataXRayImages.prototype.constructor = DataXRayImages;

if (__template_d)
  __cmd.registerClass1 ( 'DataXRayImages',DataXRayImages,__template_d.DataTemplate.prototype );
else    registerClass1 ( 'DataXRayImages',DataXRayImages,DataTemplate.prototype );

// ===========================================================================

DataXRayImages.prototype.title = function()  { return 'X-Ray Diffraction Images'; }
DataXRayImages.prototype.icon  = function()  { return 'data_xrayimages';          }

// when data class version is changed here, change it also in python
// constructors
DataXRayImages.prototype.currentVersion = function()  {
  let version = 0;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template_d)  {
  // for client side

  DataXRayImages.prototype.inspectData = function ( task ) {
    new MessageBox ( "Not implemented","XRayImages Data Viewer not Implemented." );
  }

} else  {
  //  for server side

  module.exports.DataXRayImages = DataXRayImages;

}
