
/*
 *  =================================================================
 *
 *    11.12.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskModelPrepXYZ()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskModelPrepXYZ';
  this.name    = 'prepare MR model(s) from xyz';
  this.setOName ( '*' );  // default output file name template; '*': hide the field
  this.title   = 'Prepare MR Model(s) from Coordinate data';
  //this.helpURL = './html/jscofe_task_modelprepxyz.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      tooltip     : 'Specify macromolecular sequence to be associated with the ' +
                    'resulting models.',
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz'],
                     'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Specify coordinate data set(s) to be prepared as ' +
                    'model(s) for Molecular Replacement. The model(s) ' +
                    'will be named after the corresponding coordinate data ' +
                    'set(s).',
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'chain-sel-poly', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1000         // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    sec1 :  { type     : 'section',
              title    : 'Model modification',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {

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
                        position : [0,0,1,1]
                      },
                LEGEND_SEQ_U : {
                        type     : 'label',  // just a separator
                        label    : '<i>(models are not changed)</i>',
                        position : [0,3,1,1],
                        showon   : { 'MODIFICATION_SEL':['U'] }
                      },
                LEGEND_SEQ_D : {
                        type     : 'label',  // just a separator
                        label    : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position : [0,3,1,1],
                        showon   : { 'MODIFICATION_SEL':['D'] }
                      },
                LEGEND_SEQ_M : {
                        type     : 'label',  // just a separator
                        label    : '<i>(side chain truncation based on Molrep)</i>',
                        position : [0,3,1,1],
                        showon   : { 'MODIFICATION_SEL':['M'] }
                      },
                LEGEND_SEQ_C : {
                        type     : 'label',  // just a separator
                        label    : '<i>(side chain truncation based on Chainsaw)</i>',
                        position : [0,3,1,1],
                        showon   : { 'MODIFICATION_SEL':['C'] }
                      },
                LEGEND_SEQ_S : {
                        type     : 'label',  // just a separator
                        label    : '<i>(side chain truncation based on Phaser.Sculptor)</i>',
                        position : [0,3,1,1],
                        showon   : { 'MODIFICATION_SEL':['S'] }
                      },
                LEGEND_SEQ_P : {
                        type     : 'label',  // just a separator
                        label    : '<i>(removal of all side chains)</i>',
                        position : [0,3,1,1],
                        showon   : { 'MODIFICATION_SEL':['P'] }
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
                        showon   : { 'MODIFICATION_SEL':['S'] },
                        position : [1,0,1,1]
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
                        showon   : { 'MODIFICATION_SEL':['C'] },
                        position : [1,0,1,1]
                      }

              }
            }

  }

}

if (__template)
      TaskModelPrepXYZ.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskModelPrepXYZ.prototype = Object.create ( TaskTemplate.prototype );
TaskModelPrepXYZ.prototype.constructor = TaskModelPrepXYZ;


// ===========================================================================

TaskModelPrepXYZ.prototype.cleanJobDir = function ( jobDir )  {}

TaskModelPrepXYZ.prototype.icon = function()  { return 'task_modelprepxyz'; }

TaskModelPrepXYZ.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'prepare MR search model(s) from atomic coordinates and sequence';
}


TaskModelPrepXYZ.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

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
        if (seq[0].subtype.indexOf('protein')>=0)  typeMask += 0x01;
        if (seq[0].subtype.indexOf('dna')>=0)      typeMask += 0x02;
        if (seq[0].subtype.indexOf('rna')>=0)      typeMask += 0x04;
      }

      var modSel = this.parameters.sec1.contains.MODIFICATION_SEL.value;
      if (((typeMask & 0x01)==0x00) && (['U','D'].indexOf(modSel)<0))
        msg_list.push ( this.invalidParamMessage (
                    'incompatible modification protocol',
                    'making nucleic acid MR models is possible only for ' +
                    '"Unmodified" and<br>"PDB Clip" modification protocols' ) );
      else
        for (var i=0;i<xyz.length;i++)  {
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

      if (msg_list.length>0)
        msg = msg_list.join('|');

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
