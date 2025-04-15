/*
 *  =================================================================
 *
 *    15.04.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.rabdam.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ROTAMER Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando  2022-2025
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskRabdam()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskRabdam';
  this.name    = 'rabdam';
  this.setOName ( 'rabdam' ); // default output file name template
  this.title   = 'Rabdam';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['xyz'],
      'DataModel'    : [],
      'DataXYZ'      : []
    },  // data type(s) and subtype(s)
    label       : 'Structure', // label for input dialog
    inputId     : 'ixyz'   ,   // input Id for referencing input fields
    min         : 1,           // minimum acceptable number of data instances
    max         : 1            // maximum acceptable number of data instances
  }];


}

if (__template)
  __cmd.registerClass ( 'TaskRabdam',TaskRabdam,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskRabdam',TaskRabdam,TaskTemplate.prototype );

// ===========================================================================

TaskRabdam.prototype.icon           = function()  { return 'task_rabdam'; }
TaskRabdam.prototype.clipboard_name = function()  { return '"Rabdam"';    }

TaskRabdam.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['rabdam','radiation','damage','analysis'] );
}

TaskRabdam.prototype.currentVersion = function()  {
  let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
        
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskRabdam.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'estimates the extent of specific radiation damage';
  }


  TaskRabdam.prototype.collectInput = function ( inputPanel )  {

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    let ixyz  = this.input_data.getData ( 'ixyz' )[0];
    let ixyz0 = ixyz._type=='DataRevision' ? ixyz.Structure : ixyz;

    let msg = [];
    if ((ixyz0.BF_correction!='none') && (ixyz0.BF_correction!='pdb'))
      msg.push ( 'likely a predicted model (no radiation damage)' );
    if (ixyz0.xyzmeta.xyz.length>1)
      msg.push ( 'several models found - likely an NMR structure (no radiation damage)' );
    
    if (msg.length>0)
      input_msg = '#Unsuitable input data#<h2>Unsuitable input data</h2>' +
                  'Selected data is unsuitable for Rabdam analysis because:' +
                  '<ul><li><b>' + msg.join('</b></li><li><b>') +
                  '</b></li></ul>Please select the model derived from the X-ray ' +
                  'diffraction data.#msg_error';

    return input_msg;

  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskRabdam.prototype.makeInputData = function ( loginData,jobDir )  {
    let ixyz  = this.input_data.data['ixyz'][0];
    if (ixyz._type=='DataRevision')
      this.input_data.data['istruct'] = [ixyz.Structure];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskRabdam.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.rabdam', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskRabdam = TaskRabdam;

}
