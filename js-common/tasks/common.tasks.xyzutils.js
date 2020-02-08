
/*
 *  =================================================================
 *
 *    07.02.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.xyzutils.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Utilities Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskXyzUtils()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskXyzUtils';
  this.name    = 'xyz utils';
  this.oname   = '*'; // asterisk means do not use (XYZ name will be used)
  this.title   = 'XYZ Utilities';
  this.helpURL = './html/jscofe_task_xyzutils.html';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision'  : ['xyz'],
                    'DataEnsemble'  : [],
                    'DataXYZ'       : []
                  },  // data type(s) and subtype(s)
    label       : 'Structure', // label for input dialog
    inputId     : 'istruct',   // input Id for referencing input fields
    min         : 1,           // minimum acceptable number of data instances
    max         : 1            // maximum acceptable number of data instances
  }];

  this.parameters = { // input parameters
    sec1  : { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                RMSOLVENT_CBX : {
                        type      : 'checkbox',
                        keyword   : 'rmsolvent',
                        label     : 'Remove solvent',
                        tooltip   : 'Check in order to remove solvent molecules ' +
                                    'from output structure(s)',
//                        iwidth    : 140,
                        value     : false,
                        position  : [0,0,1,1]
                      },
                RMLIGANDS_CBX : {
                        type      : 'checkbox',
                        keyword   : 'rmligands',
                        label     : 'Remove solvent and ligands',
                        tooltip   : 'Check in order to remove solvent and ligand ' +
                                    'molecules from output structure(s)',
//                        iwidth    : 140,
                        value     : false,
                        position  : [1,0,1,1]
                      },
                RMPROTEIN_CBX : {
                        type      : 'checkbox',
                        keyword   : 'rmprotein',
                        label     : 'Remove protein',
                        tooltip   : 'Check in order to remove protein chains ' +
                                    'from output structure(s)',
//                        iwidth    : 140,
                        value     : false,
                        position  : [2,0,1,1]
                      },
                RMDNARNA_CBX : {
                        type      : 'checkbox',
                        keyword   : 'rmdnarna',
                        label     : 'Remove DNA/RNA',
                        tooltip   : 'Check in order to remove nucleic acid chains ' +
                                    'from output structure(s)',
//                        iwidth    : 140,
                        value     : false,
                        position  : [3,0,1,1]
                      },
                SPLITTOCHAINS_CBX : {
                        type      : 'checkbox',
                        keyword   : 'splittochains',
                        label     : 'Split to chains',
                        tooltip   : 'Check in order to split structure into ' +
                                    'separate chains',
//                        iwidth    : 140,
                        value     : false,
                        position  : [4,0,1,1]
                      }
              }
            }
  };

}


if (__template)
      TaskXyzUtils.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskXyzUtils.prototype = Object.create ( TaskTemplate.prototype );
TaskXyzUtils.prototype.constructor = TaskXyzUtils;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskXyzUtils.prototype.icon = function()  { return 'task_xyzutils'; }

TaskXyzUtils.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  // client side

  TaskXyzUtils.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if ((!this.parameters.sec1.contains.RMSOLVENT_CBX.value) &&
        (!this.parameters.sec1.contains.RMLIGANDS_CBX.value) &&
        (!this.parameters.sec1.contains.RMPROTEIN_CBX.value) &&
        (!this.parameters.sec1.contains.RMDNARNA_CBX.value) &&
        (!this.parameters.sec1.contains.SPLITTOCHAINS_CBX.value)
       )
      msg += '<b>at least one action must be specified</b>';

    if (this.parameters.sec1.contains.RMSOLVENT_CBX.value &&
        this.parameters.sec1.contains.RMLIGANDS_CBX.value &&
        this.parameters.sec1.contains.RMPROTEIN_CBX.value &&
        this.parameters.sec1.contains.RMDNARNA_CBX.value
       )
      msg += '<b>all structure cannot be removed</b>';

    return msg;

  }

} else  {
  // server side

  var conf = require('../../js-server/server.configuration');

  TaskXyzUtils.prototype.makeInputData = function ( loginData,jobDir )  {

    var ixyz = [];
    var istruct = this.input_data.data['istruct'];
    for (var i=0;i<istruct.length;i++)
      if (istruct[i]._type=='DataRevision')
            ixyz.push ( istruct[i].Structure );
      else  ixyz.push ( istruct[i] );
    this.input_data.data['ixyz'] = ixyz;

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskXyzUtils.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xyzutils', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskXyzUtils = TaskXyzUtils;

}
