
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.areaimol.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Utilities Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev 2022-2024
 *
 *  =================================================================
 *
 */


var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================
function TaskAreaimol()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskAreaimol';
  this.name   = 'areaimol';
  this.oname  = '*'; // asterisk means do not use (XYZ name will be used)
  this.title  = 'Areaimol';

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
    AREAIMOL_LBL : {
            type     : 'label',
            keyword  : 'none',
            lwidth   : 800,
            label    : '&nbsp;<br><div style="font-size:14px;">' +
                        'Set AREAIMOL keywords and values ' +
                        'in the input field below (consult ' +
                        '<a href="https://www.ccp4.ac.uk/html/areaimol.html" ' +
                        'target="_blank"><i>AREAIMOL reference</i></a> for more details).' +
                        '<sub>&nbsp;</sub></div>',
            position : [0,0,1,5]
          },
    AREAIMOL_INPUT : {
            type     : 'aceditor_',  // can be also 'textarea'
            keyword  : 'none',       // optional
            tooltip  : '',           // mandatory
            iwidth   : 800,          // optional
            iheight  : 320,          // optional
            placeholder : '# For example:\n' + 
                          'SMODE IMOL\n' +
                          'SYMMETRY 19\n' +
                          'TRANS\n' +
                          'PROBE 1.6\n',
            value    : '',           // mandatory
            position : [1,0,1,5]     // mandatory
          }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskAreaimol.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskAreaimol.prototype = Object.create ( TaskTemplate.prototype );
TaskAreaimol.prototype.constructor = TaskAreaimol;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskAreaimol.prototype.icon           = function()  { return 'task_areaimol'; }
TaskAreaimol.prototype.clipboard_name = function()  { return '"Areaimol"';    }

TaskAreaimol.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskAreaimol.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['xyz','analysis','coordinates','toolbox','areaimol'] );
}

if (!__template)  {
  // client side

  TaskAreaimol.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'calculates the solvent accessible surface area';
  }

  // TaskAreaimol.prototype.collectInput = function ( inputPanel )  {

  //   var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

  //   if (!this.parameters.AREAIMOL_INPUT.value.trim())
  //     msg += '|<b><i>no AREAIMOL instructions -- nothing to do</i></b>';

  //   return msg;

  // }

} else  {
  // server side

  var conf = require('../../js-server/server.configuration');

  TaskAreaimol.prototype.makeInputData = function ( loginData,jobDir )  {
    var ixyz = this.input_data.data['ixyz'][0];
    if (ixyz._type=='DataRevision')
      this.input_data.data['istruct'] = [ixyz.Structure];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskAreaimol.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.areaimol', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskAreaimol = TaskAreaimol;

}
