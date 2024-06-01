
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.modelprepxyz.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Coordinates Task Class
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

function TaskModelPrepXYZ()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskModelPrepXYZ';
  this.name    = 'prepare single-chain MR model(s) from xyz';
  this.setOName ( '*' );  // default output file name template; '*': hide the field
  this.title   = 'Prepare Single-Chain MR Model(s) from Coordinate data';
  //this.helpURL = './html/jscofe_task_modelprepxyz.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz','~mmcif_only'],
                     'DataXYZ'      :['~mmcif_only']},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Specify coordinate data set(s) to be prepared as ' +
                    'model(s) for Molecular Replacement. The model(s) ' +
                    'will be named after the corresponding coordinate data ' +
                    'set(s).',
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'chain-sel-MR', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1000         // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      tooltip     : 'Specify macromolecular sequence to be associated with the ' +
                    'resulting models.',
      unchosen_label : 'sequence unknown',
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 0,          // minimum acceptable number of data instances
      force       : 1,          // show sequence wherever possible
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    SPACER_LBL : {
              type     : 'label',  // just a separator
              label    : '&nbsp;',
              position : [0,0,1,5]
            },

    sec1 :  { type     : 'section',
              title    : 'Model modification',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {

                LEGEND_NOSEQ : {
                        type     : 'label',  // just a separator
                        label    : '<b><i style="font-size:85%">Note: modification protocols are limited because sequence is not provided<br>&nbsp;</i></b>',
                        position : [0,0,1,5],
                        showon   : { seq:[-1,0] }
                      },

                MODIFICATION_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Modification protocol:',
                        tooltip  : 'Choose trim option',
                        range    : [ 'U|Unmodified',
                                     'D|PDB Clip',
                                     'M|Molrep',
                                     'S|Sculptor',
                                     'C|Chainsaw',
                                     'P|Polyalanine'
                                   ],
                        value    : 'M',
                        hideon   : { seq:[-1,0] },
                        position : [1,0,1,1]
                      },
                MODNOSEQ_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Modification protocol:',
                        tooltip  : 'Choose trim option',
                        range    : [ 'U|Unmodified',
                                     'D|PDB Clip',
                                     'P|Polyalanine'
                                   ],
                        value    : 'D',
                        showon   : { seq:[-1,0] },
                        position : [1,0,1,1]
                      },

                LEGEND_SEQ_U : {
                        type     : 'label',  // just a separator
                        label    : '<i>(models are not changed)</i>',
                        position : [1,3,1,1],
                        showon   : {_:'||',
                                      C1:{_:'&&',seq:[1],'MODIFICATION_SEL':['U'] },
                                      C2:{_:'&&',seq:[-1,0],'MODNOSEQ_SEL':['U'] }
                                   }
                      },
                LEGEND_SEQ_D : {
                        type     : 'label',  // just a separator
                        label    : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position : [1,3,1,1],
                        showon   : {_:'||',
                                      C1:{_:'&&',seq:[1],'MODIFICATION_SEL':['D'] },
                                      C2:{_:'&&',seq:[-1,0],'MODNOSEQ_SEL':['D'] }
                                   }
                        // showon   : { 'MODIFICATION_SEL':['D'] }
                      },
                LEGEND_SEQ_M : {
                        type     : 'label',  // just a separator
                        label    : '<i>(side chain truncation based on Molrep)</i>',
                        position : [1,3,1,1],
                        showon   : {_:'&&',seq:[1],'MODIFICATION_SEL':['M'] }
                        // showon   : { 'MODIFICATION_SEL':['M'] }
                      },
                LEGEND_SEQ_C : {
                        type     : 'label',  // just a separator
                        label    : '<i>(side chain truncation based on Chainsaw)</i>',
                        position : [1,3,1,1],
                        showon   : {_:'&&',seq:[1],'MODIFICATION_SEL':['C'] }
                        // showon   : { 'MODIFICATION_SEL':['C'] }
                      },
                LEGEND_SEQ_S : {
                        type     : 'label',  // just a separator
                        label    : '<i>(side chain truncation based on Phaser.Sculptor)</i>',
                        position : [1,3,1,1],
                        showon   : {_:'&&',seq:[1],'MODIFICATION_SEL':['S'] }
                        // showon   : { 'MODIFICATION_SEL':['S'] }
                      },
                LEGEND_SEQ_P : {
                        type     : 'label',  // just a separator
                        label    : '<i>(removal of all side chains)</i>',
                        position : [1,3,1,1],
                        showon   : {_:'||',
                                      C1:{_:'&&',seq:[1],'MODIFICATION_SEL':['P'] },
                                      C2:{_:'&&',seq:[-1,0],'MODNOSEQ_SEL':['P'] }
                                   }
                        // showon   : { 'MODIFICATION_SEL':['P'] }
                      },

                SCULPTOR_PROTOCOL_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Sculptor protocol:',
                        tooltip  : 'Choose Sculptor processing protocol',
                        range    : [ '1|#1',
                                     '2|#2',
                                     '3|#3',
                                     '4|#4',
                                     '5|#5',
                                     '6|#6',
                                     '7|#7',
                                     '8|#8',
                                     '9|#9',
                                     '10|#10',
                                     '11|#11',
                                     '12|#12',
                                     '13|#13'
                                   ],
                        value    : '1',
                        showon   : { _:'&&',seq:[1],'MODIFICATION_SEL':['S'] },
                        position : [2,0,1,1]
                      },

                CHAINSAW_MODE_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Chainsaw protocol:',
                        tooltip  : 'Choose Chainsaw processing protocol',
                        range    : [ 'MIXS|gamma atom',
                                     'MIXA|beta atom',
                                     'MAXI|last common atom'
                                   ],
                        value    : 'MIXS',
                        showon   : { _:'&&',seq:[1],'MODIFICATION_SEL':['C'] },
                        position : [2,0,1,1]
                      }

              }
            }

  };

  this.saveDefaultValues ( this.parameters );

}



if (__template)
      TaskModelPrepXYZ.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskModelPrepXYZ.prototype = Object.create ( TaskTemplate.prototype );
TaskModelPrepXYZ.prototype.constructor = TaskModelPrepXYZ;


// ===========================================================================

// TaskModelPrepXYZ.prototype.cleanJobDir = function ( jobDir )  {}

TaskModelPrepXYZ.prototype.icon           = function()  { return 'task_modelprepxyz'; }
TaskModelPrepXYZ.prototype.clipboard_name = function()  { return '"MR Model (xyz)"';  }

TaskModelPrepXYZ.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'prepare single-chain MR search model(s) from atomic coordinates and sequence';
}


TaskModelPrepXYZ.prototype.currentVersion = function()  {
  var version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

TaskModelPrepXYZ.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['prepare', 'single-chain', 'mr', 'model(s)', 'from', 'coordinate', 'data','model','models', 'preparation', 'prepare single-chain mr model(s) from coordinate data', 'prepare  single-chain mr model from coordinate data'] );
}

if (!__template)  {
  // for client side

  TaskModelPrepXYZ.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (msg.length<=0)  {
      var seq = this.input_data.getData ( 'seq' );
      var xyz = this.input_data.getData ( 'xyz' );
      var msg_list = [];

      var typeMask  = 0x00;
      if (seq && (seq.length>0))  {
        typeMask = 0x08;
        if (seq[0].subtype.indexOf('protein')>=0)  typeMask += 0x01;
        if (seq[0].subtype.indexOf('dna')>=0)      typeMask += 0x02;
        if (seq[0].subtype.indexOf('rna')>=0)      typeMask += 0x04;
      }

      if (typeMask)  {

        var modSel = this.parameters.sec1.contains.MODIFICATION_SEL.value;
        if (((typeMask & 0x01)==0x00) && (['U','D'].indexOf(modSel)<0))  {
          msg_list.push ( this.invalidParamMessage (
                      'incompatible modification protocol',
                      'making nucleic acid MR models is possible only for ' +
                      '"Unmodified" and<br>"PDB Clip" modification protocols' ) );
        } else  {
          for (let i=0;i<xyz.length;i++)  {
            var tMask  = 0x00;
            if (xyz[i].chainSel=='(none)')  {
              msg_list.push ( this.invalidParamMessage (
                      'no suitable chain selected in ' + xyz[i].dname,
                      'no chains suitable for making MR model with chosen ' +
                      'target sequence<br>are found in coordinate data' ) );
            } else if (xyz[i].chainSel=='(all)')  {
              if (['U','D'].indexOf(modSel)>=0)  {
                // just check that there are no incompatible chains
                if (xyz[i].subtype.indexOf('protein')>=0)  tMask += 0x01;
                if (xyz[i].subtype.indexOf('dna')>=0)      tMask += 0x02;
                if (xyz[i].subtype.indexOf('rna')>=0)      tMask += 0x04;
              } else
                msg_list.push ( this.invalidParamMessage (
                      'chain is not selected in ' + xyz[i].dname,
                      'selecting all chains is possible only for "Unmodified" ' +
                      'and "PDB Clip"<br>modification protocols' ) );
            } else  {
              // check chain type for the selected chain
              if (xyz[i].chainSelType=='protein')  tMask = 0x01;
              else if (xyz[i].chainSelType=='dna') tMask = 0x02;
              else if (xyz[i].chainSelType=='rna') tMask = 0x04;
              else if (xyz[i].chainSelType=='na')  tMask = 0x06;
              else if (xyz[i].chainSelType=='lig')
                msg_list.push ( this.invalidParamMessage (
                      'not allowed chain type in ' + xyz[i].dname,
                      'ligands cannot be used as MR search models' ) );
            }
            if ((tMask & typeMask)==0x00)
              msg_list.push ( this.invalidParamMessage (
                      'incompatible chain type in ' + xyz[i].dname,
                      'the type of MR model chain must coincide with ' +
                      'the type of target sequence' ) );
          }

        }

        if (msg_list.length>0)
          msg = msg_list.join('|');

      }

    }

    return msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskModelPrepXYZ.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.modelprepxyz', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskModelPrepXYZ = TaskModelPrepXYZ;

}
