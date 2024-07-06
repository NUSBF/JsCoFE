/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.sc.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XYZ Utilities Task Class
 *       ~~~~~~~~~
 *
 *  (C) M. Fando, E. Krissinel, A. Lebedev 2023-2024
 *
 *  =================================================================
 *
 */


var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================
// task constructor

function TaskSC() { // must start with Task...

  // invoke the template class constructor:
  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );
	
  this._type   = 'TaskSC';  // must give name of the class
  this.name    = 'SC';      // default name to be shown in Job Tree
  this.title   = 'SC'; // title for job dialog
	
  // define fields important for jsCoFE framework
  this.input_dtypes = [{      // input data types
    data_type   : {'DataStructure':['protein','~mmcif_only'],
                   'DataEnsemble' :['protein','~mmcif_only'],
                   'DataModel'    :['protein','~mmcif_only'],
                   'DataXYZ'      :['protein','~mmcif_only']
                  },  // data type(s) and subtype(s)
    label       : 'Structure',    // label for input dialog
    inputId     : 'xyz',          // input Id for referencing input fields
    customInput : 'chain-sel-poly-2', // lay custom fields next to the selection
    //  force       : 2,           // meaning choose, by default, 1 xyz sets if
    //                             // available; otherwise, the minimum (1) will
    //                             // be selected
    min         : 1,           // minimum acceptable number of data instances
    max         : 1           // maximum acceptable number of data instances
  }];

	// this.parameters = { // no input parameters
	// 	SC_LBL: {
	// 		type: 'label',
	// 		keyword: 'none',
	// 		lwidth: 800,
	// 		label: '&nbsp;<br><div style="font-size:14px;">' +
	// 			'Set SC keywords and values ' +
	// 			'in the input field below (consult ' +
	// 			'<a href="https://www.ccp4.ac.uk/html/sc.html" ' +
	// 			'target="_blank"><i>SC reference</i></a> for more details).' +
	// 			'<sub>&nbsp;</sub></div>',
	// 		position: [0, 0, 1, 5]
	// 	},
	// 	SC_INPUT: {
	// 		type: 'aceditor_', // can be also 'textarea'
	// 		keyword: 'none', // optional
	// 		tooltip: '', // mandatory
	// 		iwidth: 800, // optional
	// 		iheight: 320, // optional
	// 		placeholder: '# For example:\n' +
	// 			'MOLECULE 1\n' +
	// 			'CHAIN A\n' +
	// 			'MOLECULE 2\n' +
	// 			'CHAIN B\n',
	// 		value: '', // mandatory
	// 		position: [1, 0, 1, 5] // mandatory
	// 	}
	// };

}

// finish constructor definition

if (__template)
  __cmd.registerClass ( 'TaskSC',TaskSC,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskSC',TaskSC,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

// task icons. 
TaskSC.prototype.icon           = function()  { return 'task_SC'; }
TaskSC.prototype.clipboard_name = function()  { return '"SC"';    }

//  Define task version. Whenever task changes (e.g. receives new input
//    parameters or data), the version number must be advanced. jsCoFE framework
//    forbids cloning jobs with version numbers lower than specified here.

TaskSC.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskSC.prototype.checkKeywords = function(keywords) {
  // keywords supposed to be in low register
  return this.__check_keywords(keywords, ['xyz', 'analysis', 'coordinates', 'toolbox', 'sc']);
}

if (!__template) {
// client side

  TaskSC.prototype.desc_title = function() {
	// this appears under task title in the task list
	return 'determines Sc shape complementarity of two interacting molecular surfaces';
  }

  TaskSC.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    var xyz = this.input_data.getData ( 'xyz' )[0];

    if (!xyz.chainSel2)
      input_msg = '<b><i>Usuitable coordinate data.</i></b>';

    return input_msg;

  }

} else {  // server side

  var conf = require('../../js-server/server.configuration');

//   TaskSC.prototype.makeInputData = function(loginData, jobDir) {
//     var xyz = this.input_data.data['xyz'][0];
//     // if (xyz._type == 'DataRevision')
// 	// 	this.input_data.data['istruct'] = [xyz.Structure];
//     __template.TaskTemplate.prototype.makeInputData.call(this, loginData, jobDir);
//   }

  // form command line for server's node js to start task's python driver;
  // note that last 3 parameters are optional and task driver will not use
  // them in most cases.

  TaskSC.prototype.getCommandLine = function(jobManager, jobDir) {
  return [conf.pythonName(), '-m', 'pycofe.tasks.sc', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  // export such that it could be used in server's node js
  module.exports.TaskSC = TaskSC;

}
