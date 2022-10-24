
/*
 *  =================================================================
 *
 *    24.10.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.rotamer.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Utilities Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev 2022
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================
function TaskRotamer()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskRotamer';
  this.name   = 'rotamer';
  this.oname  = '*'; // asterisk means do not use (XYZ name will be used)
  this.title  = 'Rotamer';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['xyz'],
                    'DataEnsemble' : [],
                    'DataModel'    : [],
                    'DataXYZ'      : []
                  },  // data type(s) and subtype(s)
    label       : 'Structure', // label for input dialog
    inputId     : 'ixyz'   ,   // input Id for referencing input fields
    min         : 1,           // minimum acceptable number of data instances
    max         : 1            // maximum acceptable number of data instances
  }];

  this.parameters = { // no input parameters
    ROTAMER_LBL : {
            type     : 'label',
            keyword  : 'none',
            lwidth   : 800,
            label    : '&nbsp;<br><div style="font-size:14px;">' +
                        'Set ROTAMER keywords and values ' +
                        'in the input field below (consult ' +
                        '<a href="https://www.ccp4.ac.uk/html/rotamer.html" ' +
                        'target="_blank"><i>ROTAMER reference</i></a> for more details).' +
                        '<sub>&nbsp;</sub></div>',
            position : [0,0,1,5]
          },
    ROTAMER_INPUT : {
            type     : 'aceditor_',  // can be also 'textarea'
            keyword  : 'none',       // optional
            tooltip  : '',           // mandatory
            iwidth   : 800,          // optional
            iheight  : 320,          // optional
            placeholder : '# For example:\n' + 
                          'delt 40\n',
            value    : '',           // mandatory
            position : [1,0,1,5]     // mandatory
          }
  };

}


if (__template)
      TaskRotamer.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskRotamer.prototype = Object.create ( TaskTemplate.prototype );
TaskRotamer.prototype.constructor = TaskRotamer;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskRotamer.prototype.icon = function()  { return 'task_rotamer'; }

TaskRotamer.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskRotamer.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['xyz','analysis','coordinates','toolbox','rotamer'] );
}

if (!__template)  {
  // client side

  TaskRotamer.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'lists amino acids whose side chain torsion angles deviate from the “Penultimate Rotamer Library”';
  }

  TaskRotamer.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (!this.parameters.ROTAMER_INPUT.value.trim())
      msg += '|<b><i>no ROTAMER instructions -- nothing to do</i></b>';

    return msg;

  }

} else  {
  // server side

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
