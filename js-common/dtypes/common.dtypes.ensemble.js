
/*
 *  =================================================================
 *
 *    31.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.dtypes.ensemble.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Common Client/Server Modules -- Ensemble Data Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.dtypes.model' );

// ===========================================================================

// Data classes MUST BE named as 'DataSomething' AND put in file named
// ./js-common/dtypes/common.dtypes.something.js . This convention is used
// for class reconstruction from json strings

function DataEnsemble()  {

  if (__template)  __template.DataModel.call ( this );
             else  DataModel.call ( this );

  this._type = 'DataEnsemble';

}


if (__template)
      DataEnsemble.prototype = Object.create ( __template.DataModel.prototype );
else  DataEnsemble.prototype = Object.create ( DataModel.prototype );
DataEnsemble.prototype.constructor = DataEnsemble;


// ===========================================================================

DataEnsemble.prototype.title = function()  { return 'MR ensemble'; }

// when data class version is changed here, change it also in python
// constructors
DataEnsemble.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.DataModel.prototype.currentVersion.call ( this );
  else  return  version + DataModel.prototype.currentVersion.call ( this );
}

DataEnsemble.prototype.icon = function()  { return 'data'; }


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  DataEnsemble.prototype.extend = function() {
    let ensext = $.extend ( true,{},this );
    if (this.sequence)
      ensext.sequence = this.sequence.extend();
    return ensext;
  }

  // dataDialogHint() may return a hint for TaskDataDialog, which is shown
  // when there is no sufficient data in project to run the task.
  DataEnsemble.prototype.dataDialogHints = function ( subtype_list,n_allowed ) {
  let hints = [ 'An ensemble of MR models is missing. Use a suitable <i>"Ensemble ' +
                'preparation"</i> task to create one.',
                'Have you imported a PDB or mmCIF file with coordinates and ' +
                'wonder why, instead, an <i>"Ensemble"</i> data type is ' +
                'required for a Molecular Replacement task? <a href="javascript:' +
                    'launchHelpBox1(\'XYZ, Models and Ensembles\',' +
                                  '\'' + __user_guide_base_url +
                                    '/jscofe_qna.xyz_model_ensemble.html\',' +
                                  'null,10)"><i>' +
                String('Check here').fontcolor('blue') + '</i></a>.'
              ];
    return hints;  // No help hints by default
  }

} else  {
  //  for server side

  module.exports.DataEnsemble = DataEnsemble;

}
