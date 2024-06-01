
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.contact.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Utilities Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2022-2024
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

function TaskContact()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskContact';
  this.name   = 'contact';
  this.oname  = '*'; // asterisk means do not use (XYZ name will be used)
  this.title  = 'Contact';

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

  this.parameters = { // no input parameters
    CONTACT_LBL : {
            type     : 'label',
            keyword  : 'none',
            lwidth   : 800,
            label    : '&nbsp;<br><div style="font-size:14px;">' +
                        'Set CONTACT keywords and values ' +
                        'in the input field below (consult ' +
                        '<a href="https://www.ccp4.ac.uk/html/contact.html" ' +
                        'target="_blank"><i>CONTACT reference</i></a> for more details).' +
                        '<sub>&nbsp;</sub></div>',
            position : [0,0,1,5]
          },
    CONTACT_INPUT : {
            type     : 'aceditor_',  // can be also 'textarea'
            keyword  : 'none',       // optional
            tooltip  : '',           // mandatory
            iwidth   : 800,          // optional
            iheight  : 320,          // optional
            placeholder : '# For example:\n' + 
                          'mode    ALL\n' +
                          'limits  0.0  1.9\n' +
                          'SOURCE  336\n' +
                          'TARGET  336\n',
            value    : '',           // mandatory
            position : [1,0,1,5]     // mandatory
          }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskContact.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskContact.prototype = Object.create ( TaskTemplate.prototype );
TaskContact.prototype.constructor = TaskContact;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskContact.prototype.icon           = function()  { return 'task_contact'; }
TaskContact.prototype.clipboard_name = function()  { return '"Contact"';    }

TaskContact.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskContact.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['xyz','analysis','coordinates','toolbox','contact'] );
}

if (!__template)  {
  // client side

  TaskContact.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'computes various types of contacts in protein structures';
  }

  // TaskContact.prototype.collectInput = function ( inputPanel )  {

  //   var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

  //   if (!this.parameters.CONTACT_INPUT.value.trim())
  //     msg += '|<b><i>no CONTACT instructions -- nothing to do</i></b>';

  //   return msg;

  // }

} else  {
  // server side

  var conf = require('../../js-server/server.configuration');

  TaskContact.prototype.makeInputData = function ( loginData,jobDir )  {
    var ixyz = this.input_data.data['ixyz'][0];
    if (ixyz._type=='DataRevision')
      this.input_data.data['istruct'] = [ixyz.Structure];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskContact.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.contact', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskContact = TaskContact;

}
