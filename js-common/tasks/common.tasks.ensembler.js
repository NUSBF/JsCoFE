
/*
 *  =================================================================
 *
 *    27.08.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.ensembler.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Models Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2021
 *
 *  =================================================================
 *
 */

/*
 * jsCoFE: Javascript-powered Cloud Front End
 *
 *  Client and Server-side code:  Ensemble from Models Interface.
 *
 *  Copyright (C)  Eugene Krissinel 2017
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskEnsembler()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskEnsembler';
  this.name    = 'ensemble preparation (models)';
  this.setOName ( 'ensemble' );  // default output file name template
  this.title   = 'Prepare MR Ensemble from Models';
  //this.helpURL = './html/jscofe_task_ensembler.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataModel':[]}, // data type(s) and subtype(s)
      label       : 'Models',          // label for input dialog
      tooltip     : 'Specify models to be assembled in ensemble.',
      inputId     : 'models',     // input Id for referencing input fields
      force       : 2,          // show no sequence by default if zero
      min         : 2,          // minimum acceptable number of data instances
      max         : 1000        // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Parameters',
             open     : true,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
               TRIM_LEVELS : {
                        type      : 'string_',   // empty string allowed
                        keyword   : 'trimlevels',
                        label     : '<b><i>Trim levels</i></b>',
                        tooltip   : 'Comma-separated list of trim levels. For '  +
                                    'example, "100,80,60,40" (default) will '    +
                                    'generate untrimmed ensemble and ensembles ' +
                                    'with 100%, 80%, 60% and 40% best matching ' +
                                    'residues aligned. Only values higher than ' +
                                    '10% are allowed.',
                         iwidth   : 400,
                         value    : '',
                         placeholder : '100,80,60,40',
                         position : [0,0,1,1]
                       }
             }
           }
  };

}

if (__template)
      TaskEnsembler.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEnsembler.prototype = Object.create ( TaskTemplate.prototype );
TaskEnsembler.prototype.constructor = TaskEnsembler;


// ===========================================================================

TaskEnsembler.prototype.icon = function()  { return 'task_ensembler'; }

TaskEnsembler.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'make MR ensembles from MR search models';
}

TaskEnsembler.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {

  TaskEnsembler.prototype.collectInput = function ( inputPanel )  {

    var msg    = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    var models = this.input_data.getData ( 'models' );
    var sname0 = models[0].sequence.dname;
    var ok     = true;

    for (var i=1;(i<models.length) && ok;i++)
      ok = (models[i].sequence.dname==sname0);
    if (!ok)  {
      if (msg.length>0)
        msg += '<br>';
      msg += '<b>All models must be associated with the same sequence, ' +
             'but they are not.</b>';
    }

    if (this.parameters.sec1.contains.TRIM_LEVELS.value.length>0)  {
      var lst = this.parameters.sec1.contains.TRIM_LEVELS.value.split(',');
      ok      = true;
      for (var i=0;(i<lst.length) && ok;i++)  {
        ok = isInteger ( lst[i] );
        if (ok)  {
          var p = parseInt ( lst[i] );
          ok = (10<=p) && (p<=100);
        }
      }
      if (!ok)  {
        if (msg.length>0)
          msg += '<br>';
        msg += '<b>Errors in trim levels list (must contain comma-separated ' +
               'integers between 10 and 100)</b>';
      }
    }

    return msg;

  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEnsembler.prototype.makeInputData = function ( loginData,jobDir )  {
  // add sequence to input data
    var model0 = this.input_data.data['models'][0];
    this.input_data.data['seq'] = [model0.sequence];
    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );
  }

  TaskEnsembler.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ensembler', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEnsembler = TaskEnsembler;

}
