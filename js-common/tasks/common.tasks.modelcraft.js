
/*
 *  ==========================================================================
 *
 *    05.01.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.modelcraftmr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ModelCraft Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2022-2023
 *
 *  ==========================================================================
 *
 */

'use strict'; // *client*

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskModelCraft()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskModelCraft';
  this.name    = 'modelcraft';
  this.setOName ( 'modelcraft' );  // default output file name template
  this.title   = 'Automatic Model Building with ModelCraft';
``
  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':['!protein','!seq',['phases','xyz']]}, // data type(s) and subtype(s)
      label       : 'Structure revision',   // label for input dialog
      inputId     : 'revision',   // input Id for referencing input fields
      customInput : 'modelcraft', // lay custom fields below the dropdown
      version     : 7,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    SEP_LBL : {
              type     : 'label',
              label    : '&nbsp;',
              position : [0,0,1,5]
            },
    sec1 :  { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              contains : {
                MODE_SEL : {
                        type     : 'combobox',
                        keyword  : '--basic',
                        label    : 'Build mode',
                        tooltip  : 'Basic mode will use only Buccaneer, '     +
                                   'Nautilus and Refmac. Parrot density '     +
                                   'modification is still used on the first ' +
                                   'cycle and starting models are still '     +
                                   'refined using Sheetbend and Refmac.',
                        range    : ['full|Full', 'basic|Basic'],
                        value    : 'full',
                        iwidth   : 100,
                        position : [0,0,1,3]
                      },
                NCYCLES_MAX : {
                      type     : 'integer',
                      keyword  : '--cycles',
                      label    : 'Maximum number of build cycles',
                      tooltip  : 'Choose a value between 1 and 100 (default 25).',
                      range    : [1,100],
                      value    : '25',
                      iwidth   : 40,
                      position : [1,0,1,1]
                    },
                NOIMPROVE_CYCLES : {
                      type     : 'integer',
                      keyword  : '--auto-stop-cycles',
                      label    : 'Stop if results do not improve during',
                      tooltip  : 'Choose a value between 0 and 100 (default 4). '   +
                                 'Improvement is measured by R-free. A cycle must ' +
                                 'improve on the previous best value to be marked ' +
                                 'as an improvement. Setting this value to less than 1 ' +
                                 'makes the program run to the maximum number of cycles.',
                      range    : [0,100],
                      value    : '4',
                      iwidth   : 40,
                      label2   : 'consequitive cycles',
                      position : [2,0,1,1]
                    }
              }
            }
  };



  // --cycles X            The maximum number of cycles. (default: 25)
  // --auto-stop-cycles X  The number of cycles without improvement before the
  //                       program stops automatically. Improvement is measured
  //                       by R-free in X-ray mode and FSC in EM mode. A cycle
  //                       must improve on the previous best value to be marked
  //                       as an improvement. Setting this value to less than 1
  //                       makes the program run to the maximum number of cycles.
  //                       (default: 4)
  //
  // --phases X            Comma-separated column labels for the starting phases
  //                       as either a phase and figure of merit (e.g. PHIB,FOM)
  //                       or Hendrickson-Lattman coefficients (e.g.
  //                       HLA,HLB,HLC,HLD). This is not required if the MTZ only
  //                       contains one set of phases, unless a model is also
  //                       provided and the starting phases should not come from
  //                       refinement of that model. Parrot will be used for
  //                       density modification before the phases are used for
  //                       model building. (default: None)
  //
  //
  // --twinned             Turn on twinned refinement. Only use this option if
  //                       you are sure your crystal is twinned. (default: False)


}


if (__template)
      TaskModelCraft.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskModelCraft.prototype = Object.create ( TaskTemplate.prototype );
TaskModelCraft.prototype.constructor = TaskModelCraft;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskModelCraft.prototype.icon = function() { return 'task_modelcraft'; }

TaskModelCraft.prototype.desc_title = function()  {
  return 'performs automatic model building after MR or Experimental Phasing';
}

// TaskModelCraft.prototype.cleanJobDir = function ( jobDir )  {}

// TaskModelCraft.prototype.canEndGracefully = function() { return false; }

TaskModelCraft.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskModelCraft.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

// hotButtons return list of buttons added in JobDialog's toolBar.
function ModelCraftHotButton()  {
  return {
    'task'    : 'TaskModelCraft',
    'tooltip' : 'Automated model building with ModelCraft'
  };
}

TaskModelCraft.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['modelcraft', 'model','building', 'mb', 'auto-mb'] );
}

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskModelCraft.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskModelCraft.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Options.leading_structure=='substructure')
        this.input_data.data['istruct'] = [revision.Substructure];
      else  {
        this.input_data.data['istruct'] = [revision.Structure];
        if (revision.Substructure)
          this.input_data.data['isubstruct'] = [revision.Substructure];
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskModelCraft.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.modelcraft', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskModelCraft = TaskModelCraft;

}
