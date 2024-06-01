// *** TO BE RETIRED (19.10.19)

/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.asudef.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ASU Definition (from Structure) Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
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

function TaskASUDefStruct()  {

  if (__template)  __template.TaskASUDef.call ( this );
             else  TaskASUDef.call ( this );

  this._type     = 'TaskASUDefStruct';
  this.name      = 'asymmetric unit content';
  this.setOName ( 'asudef' );  // default output file name template
  this.title     = 'Asymmetric Unit Content from Structure';
  //this.helpURL   = './html/jscofe_task_asudef_struct.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{   // input data types
      data_type   : {'DataStructure':['xyz']},  // data type(s) and subtype(s)
      label       : 'Structure',   // label for input dialog
      tooltip     : 'Structure object with phasing results.',
      inputId     : 'istruct',       // input Id for referencing input fields
      min         : 1,               // minimum acceptable number of data instances
      max         : 1                // maximum acceptable number of data instances
    },{
      // enforce having at least 1 DataHKL in the branch, and also get access to them
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : '',         // label for input dialog
      inputId     : 'void1',    // void input Id for not showing the item
      min         : 1,          // minimum acceptable number of data instances
      max         : 100000      // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':['~unknown']}, // data type(s) and subtype(s)
      label       : 'Sequence',    // label for input dialog
      tooltip     : 'Macromolecular sequence(s) expected in ASU. If unknown, choose ' +
                    '[do not use] and set the estimated molecular size in the ' +
                    'parameters section below in the page.',
      inputId     : 'seq',         // input Id for referencing input fields
      customInput : 'stoichiometry-wauto', // lay custom fields below the dropdown
      version     : 0,             // minimum data version allowed
      force       : 1,             // meaning choose, by default, 1 sequence if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 0,             // minimum acceptable number of data instances
      max         : 10             // maximum acceptable number of data instances
    }
  ];

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskASUDefStruct.prototype = Object.create ( __template.TaskASUDef.prototype );
else  TaskASUDefStruct.prototype = Object.create ( TaskASUDef.prototype );
TaskASUDefStruct.prototype.constructor = TaskASUDefStruct;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskASUDefStruct.prototype.icon           = function()  { return 'task_asudef';    }
TaskASUDefStruct.prototype.clipboard_name = function()  { return '"ASU Contents"'; }

TaskASUDefStruct.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskASUDef.prototype.currentVersion.call ( this );
  else  return  version + TaskASUDef.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskASUDefStruct.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl in input databox for copying their files in
    // job's 'input' directory

    var assoc = this.input_data.data['istruct'][0].associated;
    var hkl = this.input_data.data['void1'];
    var hkl_sel = [];
    for (var i=0;i<hkl.length;i++)
      if (assoc.indexOf(hkl[i].dataId)>=0)
        hkl_sel.push ( hkl[i] );
    this.input_data.data['hkl'] = hkl_sel;

    __template.TaskASUDef.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  TaskASUDefStruct.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.asudef', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskASUDefStruct = TaskASUDefStruct;

}
