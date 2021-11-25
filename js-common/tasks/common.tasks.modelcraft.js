
/*
 *  ==========================================================================
 *
 *    23.11.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  ==========================================================================
 *
 */


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
  //this.helpURL = './html/jscofe_task_modelcraft.html';

  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':['!protein','!seq','!phases']}, // data type(s) and subtype(s)
      label       : 'Structure revision',   // label for input dialog
      inputId     : 'revision',   // input Id for referencing input fields
      // customInput : 'modelcraft',  // lay custom fields below the dropdown
      version     : 7,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}


if (__template)
      TaskModelCraft.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskModelCraft.prototype = Object.create ( TaskTemplate.prototype );
TaskModelCraft.prototype.constructor = TaskModelCraft;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskModelCraft.prototype.icon = function() { return 'task_modelcraft'; }

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


if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  function ModelCraftHotButton()  {
    return {
      'task'    : 'TaskModelCraft',
      'tooltip' : 'Automated model building with ModelCraft'
    };
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskModelCraft.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

  // TaskModelCraft.prototype.collectInput = function ( inputPanel )  {
  //
  //   function addMessage ( label,message )  {
  //     if (input_msg.length>0)
  //       input_msg += '<br>';
  //     input_msg += '<b>' + label + ':</b> ' + message;
  //   }
  //
  //   var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
  //
  //   if (this.parameters.sec1.contains.NCYCLES_MAX.value <
  //       this.parameters.sec1.contains.NCYCLES_MIN.value)
  //     addMessage ( "Maximum number of cycles",
  //                  "cannot be less than the minimum number of cycles" );
  //
  //   if (this.parameters.sec2.contains.TRIMMODE_SEL.value=='restricted')  {
  //     if (this.parameters.sec2.contains.TRIMMAX_ZDM.value <
  //         this.parameters.sec2.contains.TRIMMIN_ZDM.value)
  //       addMessage ( "Trim restrictions for mainchains",
  //                    "maximum ZEDCC is less than minimum ZEDCC" );
  //     if (this.parameters.sec2.contains.TRIMMAX_ZDS.value <
  //         this.parameters.sec2.contains.TRIMMIN_ZDS.value)
  //       addMessage ( "Trim restrictions for sidechains",
  //                    "maximum ZEDCC is less than minimum ZEDCC" );
  //   }
  //
  //   return input_msg;
  //
  // }

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
      else  this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskModelCraft.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.modelcraft', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskModelCraft = TaskModelCraft;

}
