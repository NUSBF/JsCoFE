
/*
 *  ==========================================================================
 *
 *    29.06.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.mergedata.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Coot Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2018-2021
 *
 *  ==========================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskMergeData()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskMergeData';
  this.name    = 'merge data';
  this.oname   = '*';   // asterisk here means do not use
  this.title   = 'Merge Data from Different Branches';
  //this.helpURL = './html/jscofe_task_mergedata.html';

  this.input_dtypes = []; // no input data

}


if (__template)
      TaskMergeData.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMergeData.prototype = Object.create ( TaskTemplate.prototype );
TaskMergeData.prototype.constructor = TaskMergeData;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskMergeData.prototype.icon = function()  { return 'task_merge'; }

TaskMergeData.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // reserved function name
  TaskMergeData.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();
    div.header.uname_lbl.setText ( 'description:&nbsp;' );
    div.grid.setLabel ( 'All downstream jobs will see data available for ' +
                        'all upstream jobs in the current branch of the job ' +
                        'tree, and, in addition, from the following jobs:',
                        0,0,1,5 )
            .setFontBold(true);

    var tree_div = new Widget ( 'div' );
    tree_div.element.setAttribute ( 'class','tree-content' );
    var jobTree = new JobTree ();
    jobTree.element.style.paddingTop    = '0px';
    jobTree.element.style.paddingBottom = '25px';
    jobTree.element.style.paddingRight  = '40px';
    tree_div.addWidget ( jobTree );
    div.grid.setWidget ( tree_div, 1,0,1,1 );

    //  Read project data from server
    jobTree.readProjectData ( 'Project',true,
          function(){  // on tree loaded
          },
          function(node){},  // onTreeContextMenu
          function(){
            jobTree.openJob ( null,tree_div );
          },      // openJob,
          function(){}       // onTreeItemSelect
    );

    return div;

  }


  /*
  TaskMergeData.prototype.disableInputWidgets = function ( widget,disable_bool ) {
    TaskTemplate.prototype.disableInputWidgets.call ( this,widget,disable_bool );
    if (widget.hasOwnProperty('upload'))  {
      widget.upload.button.setDisabled ( disable_bool );
      if (widget.upload.link_button)
        widget.upload.link_button.setDisabled ( disable_bool );
    }
  }
  */

  // reserved function name
  TaskMergeData.prototype.collectInput = function ( inputPanel )  {
    return '';  // input is Ok
  }

  // reserved function name
  TaskMergeData.prototype.runButtonName = function()  {
    return null;  // do not make the run button
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskMergeData.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mergedata', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMergeData = TaskMergeData;

}
