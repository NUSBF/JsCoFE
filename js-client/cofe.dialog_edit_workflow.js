
/*
 *  =================================================================
 *
 *    29.10.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_edit_workflow.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Edit Workflow Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// EditWorkflowDialog class

function EditWorkflowDialog ( workflowDesc,callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Workflow creator' );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget ( this.grid );

  this.grid.setLabel    ( ' ',0,0,1,1 );
  this.grid.setCellSize ( '','6px', 0,0 );
  this.grid.setImage    ( image_path('workflow'),'80px','80px', 1,0,2,1 );
  this.grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );
  this.grid.setLabel    ( 'Workflow Creator',1,2,1,2 )
           .setFontBold ( true  )
           .setFontSize ( '140%');

  let name_tooltip = 'Workflow name should contain only latin ' +
                     'letters, numbers, underscores, dashes '   +
                     'and dots, and must start with a letter. ' +
                     'The name will be used for workflow identification ' +
                     'and must be unique';

  this.grid.setLabel    ( '<i>Workflow name</i>:&nbsp;&nbsp;',2,2,1,1 )
           .setTooltip  ( name_tooltip )
           .setNoWrap   ();

  let wid_inp = this.grid.setInputText ( '', 2,3,1,1 );
  wid_inp.setStyle      ( 'text',"^[A-Za-z0-9\\-\\._]+$",'',name_tooltip )
         .setFontItalic ( true    )
         .setWidth      ( '100pt' );
  if (workflowDesc)  {
    wid_inp.setValue    ( workflowDesc.id );
    wid_inp.setReadOnly ( true );
  }

  this.grid.setVerticalAlignment ( 2,2,'middle' );
  this.grid.setVerticalAlignment ( 2,3,'middle' );

  this.grid.setLabel    ( ' ',2,4,1,1 );
  this.grid.setCellSize ( '90%','', 2,4 );

  this.grid.setHLine    ( 2,3,0,1,6 );
  this.grid.setLabel    ( '<b>Workflow script</b> <span style="font-size:14px;"> (see ' +
                          '<a href="https://gemmi.readthedocs.io/en/latest/" target="_blank">' +
                          '<i>reference</i></a> for details; opens in new window)</span> ',
                          4,0,1,6 )
           .setNoWrap   ();

  this.editor = new ACEditor ( 760,400,{
       'border'     : '1px solid black',
       'box-shadow' : '6px 6px lightgray',
       'font-size'  : '14px',
       'theme'      : 'chrome',
       'mode'       : 'python'
  });
  this.grid.setWidget ( this.editor,5,0,1,6 );
  this.editor.init  ( '',
    '# Put workflow script here'
  );
  if (workflowDesc)
    this.editor.setText ( workflowDesc.script );

  var self = this;

  $(this.element).dialog({
    resizable : true,
    height    : 'auto',
    width     : '800px',
    modal     : true,
    buttons   : {
      "Save": function() {
        let workflow_id     = wid_inp.getValue().trim();
        let workflow_script = self.editor.getText().trim();
        let msg = '';
        if (workflow_id.length<=0)
          msg += '<li><b>Workflow name</b> must be provided.</li>';
        else if (wid_inp.element.validity.patternMismatch)
          msg += '<li><b>Workflow name</b> can contain only latin letters, ' +
                  'numbers, underscores, dashes and dots, and must start' +
                  'with a letter.</li>';
        if (workflow_script.length<=0)
          msg += '<li><b>Workflow script</b> must be provided.</li>';
        if (msg)
          new MessageBox ( 'Invalid input',
                '<div style="width:400px"><h2>Invalid input</h2>' +
                'Please correct the following:<ul>' + msg + '</ul>', 
                'msg_stop' );
        else  {
          let n = -1;
          for (let i=0;(i<__my_workflows.length) && (n<0);i++)
            if (__my_workflows[i].id==workflow_id)
              n = i;
          if (n<0)  {
            __my_workflows.push({
              'id'     : workflow_id,
              'script' : workflow_script
            });
          } else  {
            __my_workflows[n].script = workflow_script;
          }
          saveMyWorkflows();
          callback_func();
          $( this ).dialog( "close" );
        }
      },
      "Cancel": function() {
        $( this ).dialog( "close" );
      }
    }
  });

  extendToolbar ( this,{
    "maximize" : function(evt,d){ self.onWindowResize(); },
    "restore"  : function(evt,d){ self.onWindowResize(); }
  });

  $(this.element).on ( 'dialogresize', function(event,ui){
      self.onWindowResize();
      // dlg.task.job_dialog_data.width  = dlg.width_px();
      // if (!__any_mobile_device)  {
      //   dlg.task.job_dialog_data.height = dlg.height_px();
      //   dlg.onDlgResize();
      // }
  });


}

EditWorkflowDialog.prototype = Object.create ( Widget.prototype );
EditWorkflowDialog.prototype.constructor = EditWorkflowDialog;


EditWorkflowDialog.prototype.onWindowResize = function()  {
  this.editor.setSize_px ( this.width_px()-40,this.height_px()-162 );
}
