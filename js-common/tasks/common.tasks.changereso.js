
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.changereso.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Change Space Group Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2024
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

function TaskChangeReso()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskChangeReso';
  this.name      = 'change dataset resolution';  // short name for job tree
  this.setOName ( 'ChangeRes' );  // default output file name template
  this.title     = 'Change Dataset Resolution';  // full title
  this.fasttrack = true;  // enforces immediate execution

  /* ===== left here for showing how an 'ASU' version of the task can be done
  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['hkl'],
                     'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision or<br>Reflection data', // label for input dialog
      inputId     : 'idata',      // input Id for referencing input fields
      customInput : 'changereso', // lay custom fields next to the selection
                                  // dropdown for anomalous data
      version     : 0,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];
  */

  this.input_dtypes = [{    // input data types
      data_type   : {'DataHKL':[]},    // data type(s) and subtype(s)
      label       : 'Reflection data', // label for input dialog
      inputId     : 'hkl',        // input Id for referencing input fields
      customInput : 'changereso', // lay custom fields next to the selection
                                  // dropdown for anomalous data
      version     : 0,            // minimum data version allowed
      min         : 1,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    },{
      data_type   : {'DataRevision':[]}, // data type(s) and subtype(s)
      label       : 'Structure revision', // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 0,          // minimum acceptable number of data instances
      max         : 0           // maximum acceptable number of data instances
    }
  ];

  this.parameters = {}; // input parameters

}


if (__template)
      TaskChangeReso.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskChangeReso.prototype = Object.create ( TaskTemplate.prototype );
TaskChangeReso.prototype.constructor = TaskChangeReso;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskChangeReso.prototype.icon           = function()  { return 'task_changereso';     }
TaskChangeReso.prototype.clipboard_name = function()  { return '"Change Resolution"'; }

TaskChangeReso.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskChangeReso.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['change','resolution'] );
}

TaskChangeReso.prototype.makeSample = function()  {
  this.input_dtypes = [this.input_dtypes[0]];
  return this;
}


if (!__template)  {
  //  for client side

  TaskChangeReso.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'allows defining the resolution range of the dataset ';
    };

  TaskChangeReso.prototype.addDataDialogHints = function ( inp_item,summary )  {
    // This function may be used for adding or modifying hints in summary.hints
    // when they are dependent on task rather than, or in addition to, daat type.
    // 'inp_item' corresponds to an item in this.input_data.
    summary.hints.push (
      'Why <i>"Structure Revision"</i> is not allowed? This means that the ' +
      'task can be used only before a <i>"Structure Revision"</i> ' +
      'is created. If you are past this point in your Project, you may have ' +
      'to start, with this task, a new branch in your Project after data ' +
      'import or data processing.'
    );
    /*
    summary.hints.push (
      'Is it possible to change Space Group in <i>"Structure Revision"</i>? ' +
      'The answer is "in general, no", because such change would be incompatible ' +
      'with results of phasing and refinement. However, you can choose an ' +
      'alternative (compatible) space group in an empty ASU, before any phasing ' +
      'is done, with <i>"Change ASU Space Group"</i> task. This may require ' +
      'starting a new branch in your Project.'
    );
    */
    return summary;
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  /* ===== left here for showing how an 'ASU' version of the task can be done
  TaskChangeReso.prototype.makeInputData = function ( loginData,jobDir )  {
    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if (('idata' in this.input_data.data) &&
        (this.input_data.data['idata'][0]._type=='DataRevision') )
      this.input_data.data['hkl'] = [this.input_data.data['idata'][0].HKL];

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }
  */

  // changereso.py can handle both 'hkl' and 'asu' versions
  TaskChangeReso.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.changereso', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskChangeReso = TaskChangeReso;

}
