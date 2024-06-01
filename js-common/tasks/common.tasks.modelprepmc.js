
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021-2024
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

function TaskModelPrepMC()  {

  if (__template)  __template.TaskModelPrepXYZ.call ( this );
             else  TaskModelPrepXYZ.call ( this );

  this._type   = 'TaskModelPrepMC';
  this.name    = 'prepare multi-chain MR model';
  this.setOName ( '*' );  // default output file name template; '*': hide the field
  this.title   = 'Prepare Multi-Chain MR Model';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz','~mmcif_only'],
                     'DataXYZ'      :['~mmcif_only']},  // data type(s) and subtype(s)
      label       : 'Template structure',   // label for input dialog
      tooltip     : 'Template multi-chain structure.',
      inputId     : 'xyz',           // input Id for referencing input fields
      customInput : 'BF_correction', // lay custom fields next to the selection
      min         : 1,               // minimum acceptable number of data instances
      max         : 1                // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      tooltip     : 'Macromolecular sequence to be associated with the ' +
                    'selected chains.',
      customInput : 'chain-input-list', // lay custom fields next to the selection
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

// TaskModelPrepMC.prototype.cleanJobDir = function ( jobDir )  {}

TaskModelPrepMC.prototype.icon           = function()  { return 'task_modelprepmc';     }
TaskModelPrepMC.prototype.clipboard_name = function()  { return '"MR Model (complex)"'; }

TaskModelPrepMC.prototype.desc_title     = function()  {
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

TaskModelPrepMC.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['model', 'preparation','mr', 'multichain', 'coordinates'] );
}

if (!__template)  {
  // for client side

  TaskModelPrepMC.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (msg.length<=0)  {
      var seq = this.input_data.getData ( 'seq' );
      var xyz = this.input_data.getData ( 'xyz' );
      var msg_list   = [];
      var xyz_chains = xyz[0].xyzmeta.xyz[0].chains;

      var typeMask = 0x00;
      if (xyz[0].subtype.indexOf('protein')>=0)  typeMask |= 0x01;
      if (xyz[0].subtype.indexOf('dna')>=0)      typeMask |= 0x02;
      if (xyz[0].subtype.indexOf('rna')>=0)      typeMask |= 0x04;

      var all_chains = [];
      var nall = 0;
      for (var i=0;i<seq.length;i++)  {
        var stype = '';
        if (seq[i].subtype.indexOf('protein')>=0)  {
          typeMask |= 0x01;
          stype     = 'protein';
        }
        if (seq[i].subtype.indexOf('dna')>=0)  {
          typeMask |= 0x02;
          stype     = 'dna';
        }
        if (seq[i].subtype.indexOf('rna')>=0)  {
          typeMask |= 0x04;
          stype     = 'rna';
        }
        var clist = seq[i].chain_list.trim();
        if (clist)  {
          if (clist=='*')  {
            if ((nall>0) || (seq.length>1))  {
              msg_list.push (
                '<b><i>All chains (*) may be requested only once for a homomeric complex</i></b>'
              );
            } else  {
              nall++;
            }
        } else  {
            var chain_list = clist.split(',').map(function(item){
              return item.trim();
            });
            for (var j=0;j<chain_list.length;j++)  {
              if (all_chains.indexOf(chain_list[j])>=0)
                msg_list.push (
                  '<b><i>Chain ' + chain_list[j] + ' used more than once</i></b>'
                );
              else
                all_chains.push ( chain_list[j] );
              var found = false;
              for (var k=0;(k<xyz_chains.length) && (!found);k++)
                if (chain_list[j]==xyz_chains[k].id)  {
                  found = true;
                  var ctype = xyz_chains[k].type.toLowerCase();
                  if (ctype!=stype)
                    msg_list.push (
                      '<b><i>Chain ' + chain_list[j] + ' type mismatch with sequence ' +
                      seq[i].dataId + ' (' + ctype + ':' + stype + ')</i></b>'
                    );
                }
              if (!found)
                msg_list.push ( '<b><i>Chain ' + chain_list[j] +
                                ' not found in template structure</i></b>' );
            }
          }
        } else
          msg_list.push ( '<b><i>No chain selection found for sequence ' +
                          seq[i].dataId + '</i></b>' );
      }

      var modSel = this.parameters.sec1.contains.MODIFICATION_SEL.value;

      if (typeMask && ((typeMask & 0x01)==0x00) && (['U','D'].indexOf(modSel)<0))
        msg_list.push ( '<b><i>' + this.invalidParamMessage (
                    'incompatible modification protocol',
                    'making nucleic acid MR models is possible only for ' +
                    '"Unmodified" and<br>"PDB Clip" modification protocols</i></b>' ) );

      if (msg_list.length>0)
        msg = msg_list.join('|');

    }

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
