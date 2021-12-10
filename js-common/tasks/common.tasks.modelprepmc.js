
/*
 *  =================================================================
 *
 *    09.12.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.modelprepmc.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  MultiChain Model Preparation from Coordinates Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.modelprepxyz' );


// ===========================================================================

function TaskModelPrepMC()  {

  if (__template)  __template.TaskModelPrepXYZ.call ( this );
             else  TaskModelPrepXYZ.call ( this );

  this._type   = 'TaskModelPrepMC';
  this.name    = 'prepare multi-chain MR model';
  this.setOName ( '*' );  // default output file name template; '*': hide the field
  this.title   = 'Prepare Multi-Chain MR Model';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz'],
                     'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Template multi-chain structure.',
      inputId     : 'xyz',       // input Id for referencing input fields
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      tooltip     : 'Macromolecular sequence to be associated with the ' +
                    'selected chains.',
      customInput : 'chain-list', // lay custom fields next to the selection
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 1,          // minimum acceptable number of data instances
      max         : 1000        // maximum acceptable number of data instances
    }
  ];

}

if (__template)
      TaskModelPrepMC.prototype = Object.create ( __template.TaskModelPrepXYZ.prototype );
else  TaskModelPrepMC.prototype = Object.create ( TaskModelPrepXYZ.prototype );
TaskModelPrepMC.prototype.constructor = TaskModelPrepMC;


// ===========================================================================

TaskModelPrepMC.prototype.cleanJobDir = function ( jobDir )  {}

TaskModelPrepMC.prototype.icon = function()  { return 'task_modelprepmc'; }

TaskModelPrepMC.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'prepare multi-chain MR search model from template complex structure';
}


TaskModelPrepMC.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskModelPrepXYZ.prototype.currentVersion.call ( this );
  else  return  version + TaskModelPrepXYZ.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  TaskModelPrepMC.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskModelPrepXYZ.prototype.collectInput.call ( this,inputPanel );

    /*
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
        msg = msg_list.join('<br>');

    }
    */

    return msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskModelPrepMC.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.modelprepmc', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskModelPrepMC = TaskModelPrepMC;

}
