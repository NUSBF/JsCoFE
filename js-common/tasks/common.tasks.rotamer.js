/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.rotamer.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ROTAMER Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev, M.Fando  2022-2024
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

function TaskRotamer()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskRotamer';
  this.name    = 'rotamer';
  this.setOName ( 'rotamer' ); // default output file name template
  this.title   = 'Rotamer';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['xyz','~mmcif_only'],
                    'DataEnsemble' : ['~mmcif_only'],
                    'DataModel'    : ['~mmcif_only'],
                    'DataXYZ'      : ['~mmcif_only']
                  },  // data type(s) and subtype(s)
    label       : 'Structure', // label for input dialog
    inputId     : 'ixyz'   ,   // input Id for referencing input fields
    min         : 1,           // minimum acceptable number of data instances
    max         : 1            // maximum acceptable number of data instances
  }];

  this.parameters = { // input parameters
    SEP_LBL : {
              type     : 'label',
              label    : '&nbsp;',
              position : [0,0,1,5]
            },
    sec1 :  { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                DELT : { type     : 'integer',
                            keyword  : 'DELT',
                            label    : 'Delta-Chi threshold',
                            tooltip  : 'threshold from the equivalent one of the nearest rotamer',
                            range    : [1,'*'],
                            value    : 30,
                            iwidth   : 40,
                            position : [0,0,1,1]
                          }
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskRotamer.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskRotamer.prototype = Object.create ( TaskTemplate.prototype );
TaskRotamer.prototype.constructor = TaskRotamer;


// ===========================================================================

TaskRotamer.prototype.icon           = function()  { return 'task_rotamer'; }
TaskRotamer.prototype.clipboard_name = function()  { return '"Rotamer"';    }

TaskRotamer.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskRotamer.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['xyz','analysis','coordinates','toolbox','rotamer'] );
  }

// export such that it could be used in both node and a browser

if (!__template)  {
  //  for client side

  TaskRotamer.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'lists amino acids whose side chain torsion angles deviate from the “Penultimate Rotamer Library”';
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskRotamer.prototype.makeInputData = function ( loginData,jobDir )  {
    var ixyz = this.input_data.data['ixyz'][0];
    if (ixyz._type=='DataRevision')
      this.input_data.data['istruct'] = [ixyz.Structure];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskRotamer.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.rotamer', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskRotamer = TaskRotamer;

}
