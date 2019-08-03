
/*
 *  =================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
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

function DataXRayImages()  {

  if (__template)  __template.DataTemplate.call ( this );
             else  DataTemplate.call ( this );

  this._type = 'DataXRayImages';

}

if (__template)
      DataXRayImages.prototype = Object.create ( __template.DataTemplate.prototype );
else  DataXRayImages.prototype = Object.create ( DataTemplate.prototype );
DataXRayImages.prototype.constructor = DataXRayImages;


// ===========================================================================

DataXRayImages.prototype.title = function()  { return 'X-Ray Diffraction Images'; }
DataXRayImages.prototype.icon  = function()  { return 'data_xrayimages';          }

// when data class version is changed here, change it also in python
// constructors
DataXRayImages.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  DataXRayImages.prototype.inspectData = function ( task ) {
    new MessageBox ( "Not implemented","XRayImages Data Viewer not Implemented." );
  }

} else  {
  //  for server side

  module.exports.DataXRayImages = DataXRayImages;

}
