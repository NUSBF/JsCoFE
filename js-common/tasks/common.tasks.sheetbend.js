
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.sheetbend.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Sheetbend Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2024
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskSheetbend()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSheetbend';
  this.name    = 'sheetbend';
  this.setOName ( 'sheetbend' );  // default output file name template
  this.title   = 'Post-MR model correction with Sheetbend';

  this.input_dtypes = [  // input data types
    {
      data_type   : {'DataRevision':['!xyz','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',        // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      //customInput : 'parrot',   // lay custom fields below the dropdown
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                NCYCLES : {
                        type        : 'integer',
                        keyword     : 'cycles',
                        label       : 'Number of cycles',
                        tooltip     : 'Choose a value between 1 and 50',
                        range       : [1,50],
                        value       : '10',
                        position    : [0,0,1,1]
                      }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskSheetbend.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskSheetbend.prototype = Object.create ( TaskTemplate.prototype );
TaskSheetbend.prototype.constructor = TaskSheetbend;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskSheetbend.prototype.icon           = function()  { return 'task_sheetbend'; }
TaskSheetbend.prototype.clipboard_name = function()  { return '"Sheetbend"';    }

TaskSheetbend.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function SheetbendHotButton()  {
  return {
    'task_name' : 'TaskSheetbend',
    'tooltip'   : 'Post-MR model correction with Sheetbend'
  };
}

if (!__template)  {
  //  for client side

  TaskSheetbend.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return '';
    };
  

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskSheetbend.prototype.hotButtons = function() {
    return [ModelCraftHotButton(),BuccaneerHotButton(),ArpWarpHotButton()];
  }

/*
  TaskSheetbend.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    if (emitterId=='istruct')  {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var istruct    = this.getInputData ( inpDataRef,'istruct'    );
      var ncs_struct = this.getInputItem ( inpDataRef,'ncs_struct' );
      var ncs_substr = this.getInputItem ( inpDataRef,'ncs_substr' );

      if (istruct.length>0)  {
        isMMol = (istruct[0].subtype.indexOf('MR')>=0) ||
                 (istruct[0].subtype.indexOf('EP')>=0);
        inpParamRef.grid.setRowVisible ( ncs_struct.dropdown[0].row,!isMMol );
        inpParamRef.grid.setRowVisible ( ncs_substr.dropdown[0].row,isMMol  );
      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }
*/

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskSheetbend.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskSheetbend.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.sheetbend', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSheetbend = TaskSheetbend;

}
