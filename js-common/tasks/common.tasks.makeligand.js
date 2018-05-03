
/*
 *  =================================================================
 *
 *    06.11.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.morda.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MoRDa Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskMakeLigand()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMakeLigand';
  this.name    = 'make ligand';
  this.oname   = '';  // output file name template (this or ligand name if empty)
  this.title   = 'Make Ligand with Acedrg';
  this.helpURL = './html/jscofe_task_makeligand.html';

  this.parameters = { // input parameters
    SOURCE_SEL : {
            type     : 'combobox',
            label    : '<b>Use</b>',
            tooltip  : 'Source of data for making a ligand',
            range    : ['S|SMILES string',
                        'M|Monomer library'
                       ],
            value    : 'S',
            position : [0,0,1,5]
          },
    SMILES : {
          type      : 'string',   // empty string not allowed
          keyword   : 'smiles',
          label     : '<i>SMILES string</i>',
          tooltip   : 'SMILES string to define ligand structure',
          iwidth    : 680,
          value     : '',
          position  : [1,2,1,3],
          showon    : {SOURCE_SEL:['S']}
        },
    CODE : {
          type      : 'string',   // empty string not allowed
          keyword   : 'code',
          label     : '<i>Ligand Code</i>',
          tooltip   : '3-letter ligand code for identification',
          default   : 'DRG',
          iwidth    : 40,
          value     : 'DRG',
          maxlength : 3,       // maximum input length
          position  : [2,2,1,3],
          showon    : {SOURCE_SEL:['S']}
        },
    CODE3 : {
          type      : 'string',   // empty string not allowed
          label     : '<i>3-letter Code</i>',
          tooltip   : '3-letter ligand code',
          default   : '',
          iwidth    : 40,
          value     : '',
          maxlength : 3,       // maximum input length
          position  : [3,2,1,1],
          showon    : {SOURCE_SEL:['M']}
        }
  };

}


if (__template)
      TaskMakeLigand.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMakeLigand.prototype = Object.create ( TaskTemplate.prototype );
TaskMakeLigand.prototype.constructor = TaskMakeLigand;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskMakeLigand.prototype.icon_small = function()  { return './images/task_makeligand_20x20.svg'; }
TaskMakeLigand.prototype.icon_large = function()  { return './images/task_makeligand.svg';       }

TaskMakeLigand.prototype.currentVersion = function()  { return 0; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskMakeLigand.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.makeligand', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMakeLigand = TaskMakeLigand;

}
