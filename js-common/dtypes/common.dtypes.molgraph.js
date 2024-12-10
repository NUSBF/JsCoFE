
/*
 *  =================================================================
 *
 *    15.10.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/dtypes/common.dtypes.molgraph.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MolGraph Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M Fando 2024
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

function MolGraph()  {

  if (__template_d)  __template_d.DataTemplate.call ( this );
               else  DataTemplate.call ( this );

  this._type = 'MolGraph';
  this.code  = '';

}

if (__template_d)
  __cmd.registerClass ( 'MolGraph',MolGraph,__template_d.DataTemplate.prototype );
else    registerClass ( 'MolGraph',MolGraph,DataTemplate.prototype );

// ===========================================================================

MolGraph.prototype.title = function()  { return 'Molecular Graph'; }
MolGraph.prototype.icon  = function()  { return 'data';            }

// when data class version is changed here, change it also in python
// constructors
MolGraph.prototype.currentVersion = function()  {
  let version = 0;
  if (__template_d)
        return  version + __template_d.DataTemplate.prototype.currentVersion.call ( this );
  else  return  version + DataTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template_d)  {
  // for client side

  MolGraph.prototype.makeDataSummaryPage = function ( task )  {
    let dsp = new DataSummaryPage ( this );

    if (file_key.sdf in this.files)
      dsp.makeRow ( 'SDF file',this.files[file_key.sdf],'Imported file name' );
    else if (file_key.mol2 in this.files)
      dsp.makeRow ( 'MOL2 file',this.files[file_key.mol2],'Imported file name' );
    else if (file_key.sml in this.files)
      dsp.makeRow ( 'SML file',this.files[file_key.sml],'Imported file name' );

    return dsp;

  }

} else  {
  //  for server side
  module.exports.MolGraph = MolGraph;

}
