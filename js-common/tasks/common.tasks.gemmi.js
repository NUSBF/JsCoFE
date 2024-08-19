
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.gemmi.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Gemmi Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
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

function TaskGemmi()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskGemmi';
  this.name    = 'gemmi tools';
  this.oname   = 'gemmi';   // asterisk here means do not use
  this.title   = 'Gemmi terminal';
  this.nc_type = 'client';    // job may be run only on client NC

  this.input_dtypes = [{  // input data types
      data_type   : {'DataRevision'  : ['xyz','substructure'],
                     'DataStructure' : ['xyz','substructure'],
                     'DataEnsemble'  : [],
                     'DataModel'     : [],
                     'DataXYZ'       : []
                    }, // data type(s) and subtype(s)
      label       : 'Structure data',     // label for input dialog
      inputId     : 'istruct', // input Id for referencing input fields
      version     : 1,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 20          // maximum acceptable number of data instances
    }
  ];

  this.parameters = {
    TITLE : {
        type     : 'label',
        keyword  : 'none',
        label    : '<hr><b style="font-size:1.125em;">Gemmi script</b>',
        position : [0,0,1,3]
    },
    MANUAL : {
      type     : 'label',
      keyword  : 'none',
//      align    : 'right',
//      lwidth   : 500,
      label    : '&nbsp;<br><div style="font-size:14px;">' +
                 '<a href="https://gemmi.readthedocs.io/en/latest/" target="_blank">' +
                 '<i>gemmi reference</i></a> (opens in new window)</div>',
      position : [0,1,1,1]
    },
    SCRIPT : {
        type        : 'aceditor_',  // can be also 'textarea'
        keyword     : 'none',       // optional
        tooltip     : '',           // mandatory
        iwidth      : 800,          // optional
        iheight     : 320,          // optional
        value       :  // mandatory
          '"""\n' +
          ' Place a python script here, assuming that:\n' +
          '  - modules gemmi and math are imported\n' +
          '  - structure data number N is read in gemmi documents "stN"\n' +
          '  - document "st1" will be saved automatically as the corresponding input\n' +
          '    data object (structure revision, structure, ensemble, model or xyz)\n\n' +
          ' For example, removal of all ligands, waters and empty chains requires just\n' +
          ' the following 2 lines:\n\n' +
          'st1.remove_ligands_and_waters()\n' +
          'st1.remove_empty_chains()\n' +
          '"""\n',
        position    : [1,0,1,5]     // mandatory
    }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskGemmi',TaskGemmi,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskGemmi',TaskGemmi,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskGemmi.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskGemmi.prototype.icon           = function()  { return 'task_gemmi'; }
TaskGemmi.prototype.clipboard_name = function()  { return '"Gemmi"';    }

TaskGemmi.prototype.desc_title     = function()  {
  // this appears under task title in the task list
    return 'exposes python terminal to user for performing very custom operations on coordinate data';
  };

TaskGemmi.prototype.checkKeywords = function ( keywords )  {
    // keywords supposed to be in low register
      return this.__check_keywords ( keywords,['gemmi', 'command','line', 'tool','tools', 'utilities'] );
  }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskGemmi.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    var istruct = this.input_data.data['istruct'];
    this.input_data.data['hkl'] = [];
    this.input_data.data['ist']  = [];
    for (var i=0;i<istruct.length;i++)
      if (istruct[i]._type=='DataRevision')  {
        this.input_data.data['hkl'].push ( istruct[i].HKL );
        if (istruct[i].Structure)
          this.input_data.data['ist'].push ( istruct[i].Structure );
        if (istruct[i].Substructure)
          this.input_data.data['ist'].push ( istruct[i].Substructure );
      }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskGemmi.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.gemmi_task', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskGemmi = TaskGemmi;

}
