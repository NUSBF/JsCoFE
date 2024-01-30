
/*
 *  =================================================================
 *
 *    29.01.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2020-2024
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

  this._type  = 'TaskXyzUtils';
  this.name   = 'xyz utils';
  this.oname  = '*'; // asterisk means do not use (XYZ name will be used)
  this.title  = 'Coordinate Utilities';

  this.input_dtypes = [{      // input data types
    data_type   : { 'DataRevision' : ['xyz'],
                    'DataEnsemble' : ['~mmcif_only'],
                    'DataModel'    : ['~mmcif_only'],
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
                                    'E|Extract sequences',
                                    'P|Run PDBSET',
                                    'B|Recalculate B-factors',
                                    'R|Rename chains'
                                   ],
                        value    : 'T',
                        iwidth   : 260,
                        position : [0,0,1,1]
                      },
                SPACER_LBL : {
                        type     : 'label',
                        keyword  : 'none',
                        lwidth   : '80%',
                        label    : ' ',
                        position : [5,6,1,2]
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
                        position : [1,0,1,1],
                        hideon   : {ACTION_SEL:['P']}
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
                        position : [2,0,1,1],
                        hideon   : {ACTION_SEL:['P']}
                      },
                CHAIN_LIST : {
                        type      : 'string',
                        label     : 'chains:',
                        tooltip   : 'Comma-separated list of chains to remove',
                        iwidth    : '200',
                        value     : '',
                        placeholder : 'A,B,...',
                        position  : [2,4,1,1],
                        showon    : {_:'&&',CHAINS_SEL:['S'],ACTION_SEL:['T','S','E','B']}
                      },
                PDBSET_LBL : {
                        type     : 'label',
                        keyword  : 'none',
                        lwidth   : 800,
                        label    : '<div style="font-size:14px;">' +
                                    'Set PDBSET keywords and values ' +
                                    'in the input field below (consult ' +
                                    '<a href="https://www.ccp4.ac.uk/html/pdbset.html" ' +
                                    'target="_blank"><i>PDBSET reference</i></a> for more details).' +
                                    '<sub>&nbsp;</sub></div>',
                        position : [3,0,1,5],
                        showon   : {ACTION_SEL:['P']}
                      },
                PDBSET_INPUT : {
                        type     : 'aceditor_',  // can be also 'textarea'
                        keyword  : 'none',       // optional
                        tooltip  : '',           // mandatory
                        iwidth   : 800,          // optional
                        iheight  : 320,          // optional
                        placeholder : '# For example:\n' + 
                                      'SYMGEN -X,Y,-Z\n' +
                                      'SYMGEN 1/2+X,1/2+Y,Z',
                        value    : '',           // mandatory
                        position : [4,0,1,5],    // mandatory
                        showon   : {ACTION_SEL:['P']}
                      },
                BFACTORS_SEL : {
                        type     : 'combobox',
                        label    : 'B-factor model:',
                        tooltip  : '',
                        range    : ['alphafold|Alphafold',
                                    'rosetta|Rosetta'
                                   ],
                        value    : 'alphafold',
                        iwidth   : 260,
                        position : [0,4,1,1],
                        showon   : {ACTION_SEL:['B']}
                      },
                RENAME_LBL : {
                        type     : 'label',
                        keyword  : 'none',
                        lwidth   : 800,
                        label    : '<div style="font-size:14px;">' +
                                    'Set renaming instructions in the input field below.' +
                                    '<sub>&nbsp;</sub></div>',
                        position : [5,0,1,5],
                        showon   : {ACTION_SEL:['R']}
                      },
                RENAME_INPUT : {
                        type     : 'aceditor_',  // can be also 'textarea'
                        keyword  : 'none',       // optional
                        tooltip  : '',           // mandatory
                        iwidth   : 800,          // optional
                        iheight  : 320,          // optional
                        placeholder : '# Rename chains like:\n' + 
                                      'CHAIN A A1 # rename A into A1\n' +
                                      'CHAIN B A2 # etc etc\n' +
                                      '# or\n' +
                                      '# PDB  # make chain names PDB-compliant\n',
                        value    : '',           // mandatory
                        position : [6,0,1,5],    // mandatory
                        showon   : {ACTION_SEL:['R']}
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

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskXyzUtils.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskXyzUtils.prototype = Object.create ( TaskTemplate.prototype );
TaskXyzUtils.prototype.constructor = TaskXyzUtils;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskXyzUtils.prototype.icon           = function()  { return 'task_xyzutils'; }
TaskXyzUtils.prototype.clipboard_name = function()  { return '"XYZ Utils"';   }

TaskXyzUtils.prototype.currentVersion = function()  {
let version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskXyzUtils.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['xyz','utilities','coordinate','tool', 'toolbox', 'pdbset'] );
}

TaskXyzUtils.prototype.getWorkflowScript = function ( serialNo )  {
let wscript = [];
  if (__template)
        wscript = __template.TaskTemplate.prototype.getWorkflowScript.call ( this,serialNo );
  else  wscript = TaskTemplate.prototype.getWorkflowScript.call ( this,serialNo );
  wscript.splice ( 1,0,'    ALIAS     revision   istruct' );
  return wscript;
}

if (!__template)  {
  // client side

  TaskXyzUtils.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'various coordinate transformations, including PDBSET functions';
  }

  TaskXyzUtils.prototype.collectInput = function ( inputPanel )  {

    let msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if ((this.parameters.sec1.contains.SOLLIG_SEL.value=='U') &&
        (this.parameters.sec1.contains.CHAINS_SEL.value=='U') &&
        (this.parameters.sec1.contains.ACTION_SEL.value=='T'))
      msg += '|<b><i>at least one transformation must be specified</i></b>';
    else if (this.parameters.sec1.contains.ACTION_SEL.value=='P')  {
        if (!this.parameters.sec1.contains.PDBSET_INPUT.value.trim())
          msg += '|<b><i>no PDBSET instructions -- nothing to do</i></b>';
        let xyz = this.input_data.getData ( 'istruct' );
        if (xyz[0].subtype.indexOf('mmcif_only')>=0)
          msg += '|<b><i>PDBSET can work only with PDB-compatible data</i></b>';
    }
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

    let ixyz = [];
    let istruct = this.input_data.data['istruct'];
    for (let i=0;i<istruct.length;i++)
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
