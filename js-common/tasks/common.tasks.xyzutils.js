
/*
 *  =================================================================
 *
 *    11.12.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2020-2021
 *
 *  =================================================================
 *
 */

'use strict';

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
  this.title   = 'Coordinate Utilities';
  //this.helpURL = './html/jscofe_task_xyzutils.html';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['xyz'],
                    'DataEnsemble' : [],
                    'DataModel'    : [],
                    'DataXYZ'      : []
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
                ACTION_SEL : {
                        type     : 'combobox',
                        label    : 'Perform operation:',
                        tooltip  : '',
                        range    : ['T|Transform structure',
                                    'S|Split structure in chains',
                                    'E|Extract sequences'
                                   ],
                        value    : 'T',
                        iwidth   : 260,
                        position : [0,0,1,1]
                      },

                SOLLIG_SEL : {
                        type     : 'combobox',
                        label    : 'Solvent and ligands:',
                        tooltip  : '',
                        range    : ['U|Leave as is',
                                    'W|Remove waters',
                                    'WL|Remove waters and ligands'
                                   ],
                        value    : 'U',
                        iwidth   : 260,
                        position : [1,0,1,1]
                      },
                CHAINS_SEL : {
                        type     : 'combobox',
                        label    : 'Polymeric chains:',
                        tooltip  : '',
                        range    : ['U|Leave as is',
                                    'P|Remove protein chains',
                                    'D|Remove dna/rna chains',
                                    'S|Remove selected chains',
                                   ],
                        value    : 'U',
                        iwidth   : 260,
                        position : [2,0,1,1]
                      },
                CHAIN_LIST : {
                        type      : 'string',
                        label     : 'chains:',
                        tooltip   : 'Comma-separated list of chains to remove',
                        iwidth    : '200',
                        value     : '',
                        placeholder : 'A,B,...',
                        position  : [2,4,1,1],
                        showon    : {CHAINS_SEL:['S']}
                      },
                /*
                SEP_LBL : {
                        type      : 'label',  // just a separator
                        label     : '&nbsp;',
                        position  : [3,0,1,4]
                      },
                SPLITTOCHAINS_CBX : {
                        type     : 'checkbox',
                        keyword  : 'splittochains',
                        label    : 'Split to chains',
                        tooltip  : 'Check in order to split structure into ' +
                                   'separate chains',
                        iwidth   : 180,
                        value    : false,
                        position : [4,0,1,4]
                      }
                */
                /*
                EXTRACTSEQ_CBX : {
                        type     : 'checkbox',
                        keyword  : 'extractsequences',
                        label    : 'Extract sequences',
                        tooltip  : 'Check in order to extract sequences from ' +
                                   'atomic coordinates',
                        iwidth   : 180,
                        value    : false,
                        position : [4,0,1,4]
                      }
                */
                /*
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
                */
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

  TaskXyzUtils.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'allows selecting a limited set of atoms in a coordinate file and saving them to new files';
    };

  TaskXyzUtils.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if ((this.parameters.sec1.contains.SOLLIG_SEL.value=='U') &&
        (this.parameters.sec1.contains.CHAINS_SEL.value=='U') &&
        (this.parameters.sec1.contains.ACTION_SEL.value=='T'))
      msg += '|<b><i>at least one transformation must be specified</i></b>';

    return msg;

  }


/*
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
*/

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
