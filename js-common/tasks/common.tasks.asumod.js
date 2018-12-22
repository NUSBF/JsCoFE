
/*
 *  =================================================================
 *
 *    12.12.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.asumod.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ASU Definition Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.asudef' );

// ===========================================================================

function TaskASUMod()  {

  if (__template)  __template.TaskASUDef.call ( this );
             else  TaskASUDef.call ( this );

  this._type     = 'TaskASUMod';
  this.name      = 'asymmetric unit correction';
  this.oname     = 'asu correction';  //'*';   // asterisk here means do not use
  this.title     = 'Asymmetric Unit Correction';
  this.helpURL   = './html/jscofe_task_asumod.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes.unshift({   // input data types
    data_type   : {'DataRevision':[]},   // data type(s) and subtype(s)
    label       : 'Structure revision',  // label for input dialog
    tooltip     : 'Structure revision, in which the ASU contents needs to be '+
                  'modified',
    inputId     : 'revision', // input Id for referencing input fields
    version     : 0,          // minimum data version allowed
    min         : 1,          // minimum acceptable number of data instances
    max         : 1           // maximum acceptable number of data instances
  });

  this.input_dtypes[1].min = 0;
  this.input_dtypes[1].tooltip = 'Reflection dataset to be used for phasing ' +
            'and refinement in further tasks. If change of the reflection ' +
            'dataset is not required, choose [do not use].';

  this.input_dtypes[2].min     = 0;
  this.input_dtypes[2].tooltip = 'Macromolecular sequence(s) expected in ASU. ' +
            'If no change required, choose [do not use]. If change is required ' +
            'but the sequence(s) are unknown, choose [do not use] and give an ' +
            'estimate of the ASU molecular size in the parameters section ' +
            'below in  the page.';

  this.input_dtypes[2].force = 1;


  this.parameters.sec1.contains.ESTIMATE_SEL.range = [
    'KE|do not estimate, leave as is',
    'NR|number of residues',
    'MW|molecular weight'
  ];
  this.parameters.sec1.contains.ESTIMATE_SEL.value = 'KE';

}


if (__template)
      TaskASUMod.prototype = Object.create ( __template.TaskASUDef.prototype );
else  TaskASUMod.prototype = Object.create ( TaskASUDef.prototype );
TaskASUMod.prototype.constructor = TaskASUMod;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskASUMod.prototype.icon_small = function()  { return 'task_asumod_20x20'; }
TaskASUMod.prototype.icon_large = function()  { return 'task_asumod';       }

TaskASUMod.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskASUDef.prototype.currentVersion.call ( this );
  else  return  version + TaskASUDef.prototype.currentVersion.call ( this );
}

if (!__template)  {
  //  for client side


  TaskASUMod.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskASUDef.prototype.collectInput.call ( this,inputPanel );

    var hkl = this.input_data.getData ( 'hkl' );
    var seq = this.input_data.getData ( 'seq' );

    if ((hkl.length<=0) && (seq.length<=0) &&
        (this.parameters.sec1.contains.ESTIMATE_SEL.value=='KE'))
      input_msg = '<b><i>No ASU changes requested -- nothing to do.</i></b>';

    return input_msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskASUMod.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl and sequence data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl0'] = [revision.HKL];
      this.input_data.data['seq0'] = revision.ASU.seq;
      if (revision.Structure)
        this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskASUDef.prototype.makeInputData.call ( this,login,jobDir );

  }

  TaskASUMod.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.asumod', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskASUMod = TaskASUMod;

}
