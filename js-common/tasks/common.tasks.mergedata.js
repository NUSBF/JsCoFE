
/*
 *  ==========================================================================
 *
 *    11.08.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2018
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
  this.helpURL = './html/jscofe_task_mergedata.html';

  this.input_dtypes = []; // no input data

}


if (__template)
      TaskMergeData.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMergeData.prototype = Object.create ( TaskTemplate.prototype );
TaskMergeData.prototype.constructor = TaskMergeData;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskMergeData.prototype.icon_small = function()  { return './images/task_merge_20x20.svg'; }
TaskMergeData.prototype.icon_large = function()  { return './images/task_merge.svg';       }

TaskMergeData.prototype.currentVersion = function()  { return 0; }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // reserved function name
  TaskMergeData.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();
    div.header.uname_lbl.setText ( 'description:&nbsp;' );
    div.grid.setLabel ( 'All following jobs will see data available for ' +
                        'all previous jobs in the current branch of the job ' +
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
    jobTree.readProjectData ( 'Project',
          function(){  // on tree loaded
          },
          function(node){},  // onTreeContextMenu
          function(){
            jobTree.openJob ( null,tree_div );
          },      // openJob,
          function(){}       // onTreeItemSelect
    );

/*
    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    var msg = '';
    if (__local_service)
          msg = 'Use file selection buttons ';
    else  msg = 'Use the file selection button ';
    div.grid.setLabel ( msg + 'below to select and upload data files ' +
                        'to the Project (use multiple file selections and ' +
                        'repeat uploads if necessary). When done, hit ' +
                        '<b><i>Import</i></b> button to process ' +
                        'files uploaded.<br>&nbsp;',
                        0,0, 1,1 ).setFontSize('80%');
    div.grid.setWidth ( '100%' );

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation
    (function(panel,task){
      panel.upload = new Upload ( panel.customData,'project_data',
        function(e,onReady_func) {
          if (e.target.files.length>0)
            _import_checkFiles ( e.target.files,div.customData.file_mod,
                                 panel.upload.upload_files,onReady_func );
        },
        function(){
          new ImportPDBDialog ( function(pdb_list){
            pdb_spec_list = [];
            for (var i=0;i<pdb_list.length;i++)
              pdb_spec_list.push ( 'PDB::' + pdb_list[i] );
            panel.upload.setUploadedFiles ( pdb_spec_list );
            //alert ( 'action ' + entry_list );
          });
        },
        function(returnCode){
          if (!returnCode)
            task.sendInputStateEvent ( panel );
        });

      panel.upload.addSignalHandler ( cofe_signals.uploadEvent, function(detail){
        task.sendTaskStateSignal ( panel,detail );
      });

    }(div,this));
    div.upload.setUploadedFiles ( this.upload_files );
    if (this.upload_files.length<=0)
      this.sendTaskStateSignal ( div,'hide_run_button' );

    div.grid.setWidget ( div.upload,1,0,1,1 );
    div.panel.setScrollable ( 'hidden','hidden' );
*/

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

  TaskMergeData.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.mergedata', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskMergeData = TaskMergeData;

}
