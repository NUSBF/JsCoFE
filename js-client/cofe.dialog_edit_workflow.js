
/*
 *  =================================================================
 *
 *    18.11.23   <--  Date of Last Modification.
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
  this.setIconMenu      ();

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
  if (workflowDesc)  {
    this.setIcon ( workflowDesc.script );
    this.editor.setText ( workflowDesc.script );
  }

  this.setIcon ( -1 );

  this.currentCloudPath = 'workflow_scripts';
  this.rootCloudPath    = 'workflow_scripts';
  this.tree_type        = 'abspath';

  var self = this;

  $(this.element).dialog({
    resizable : true,
    height    : 'auto',
    width     : '800px',
    modal     : true,
    buttons   : {
      "Library" : function(){
        new CloudFileBrowser ( null,self,0,['wscript'],function(items){
          console.log ( ' >>>>>>>here' );
          return 1;  // do close browser window
        },null );
      },
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
              'id'      : workflow_id,
              'version' : jsCoFE_version,
              'script'  : workflow_script
            });
          } else  {
            __my_workflows[n].version = jsCoFE_version;
            __my_workflows[n].script  = workflow_script;
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

  // this.icon_btn.addOnClickListener ( function(){

  // });

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


const __workflow_icon = [
  'Aqua','Asparagus','Black','Gold','Grape','Lavender','Maraschino','Maroon',
  'Mocha','Pink','Salmon','Spring','Tangerine','Teal','Tin'
];

EditWorkflowDialog.prototype.onWindowResize = function()  {
  this.editor.setSize_px ( this.width_px()-40,this.height_px()-162 );
}

EditWorkflowDialog.prototype.getIconPath = function ( iconNo )  {
  return  image_path ( 'workflow_' + __workflow_icon[iconNo].toLowerCase() );
}

EditWorkflowDialog.prototype.setIconMenu = function()  {

  this.icon_no  = 0;
  // this.icon_btn = this.grid.setImageButton ( image_path('workflow_aqua'),
  //                                            '80px','80px', 1,0,2,1 );
  this.icon_menu = new Menu ( '', this.getIconPath(this.icon_no) );
  this.grid.setWidget ( this.icon_menu,1,0,2,1 );

  this.icon_menu.button.setWidth  ( '80px' );
  this.icon_menu.button.setHeight ( '80px' );
  this.icon_menu.setTooltip ( 'Click on icon to change theme' );
  $(this.icon_menu.button.element).css({
      'background-size'    :'80px',
      'padding'            :'0px',
      'background-position':'0.0em center'
  });

  // let self = this;
  // this.icon_menu.setOnClickCustomFunction ( function(){
  //   icon_menu.setMaxHeight ( (inputPanel.height_px()-90) + 'px' );
  // });

  for (let i=0;i<__workflow_icon.length;i++)
    (function(themeNo,task){
      task.icon_menu.addItem ( __workflow_icon[themeNo],task.getIconPath(i) )
          .addOnClickListener ( function(){
        task.setIcon ( themeNo );
      });
    }(i,this))

}


EditWorkflowDialog.prototype.setIcon = function ( iconNo )  {
let script = this.editor.getText().trim();
let lines  = script.split(/\r?\n/);

  let lno    = -1;
  let l0     = 0;
  let iname  = 'Aqua';
  let iname0 = null;
  for (let i=0;(i<lines.length) && (lno<0);i++)  {
    let words = lines[i].split(' ').filter(Boolean);
    if (words.length>1)  {
      let w0  = words[0].toUpperCase();
      if (['NAME','ONAME','VERSION','TITLE','DESC','KEYWORDS'].indexOf(w0)>=0)
        l0 = i;
      else if (w0=='ICON')  {
        lno    = i;
        iname0 = words[1];
        iname  = words[1].charAt(0).toUpperCase() + words[1].slice(1).toLowerCase();
      }
    }
  }

  this.icon_no = -1;
  if (iconNo>=0)  {
    this.icon_no = iconNo;
  } else if (lno>=0)  {
    // icon statement find, verify icon name
    for (let i=0;(i<__workflow_icon.length) && (this.icon_no <0);i++)
      if (iname==__workflow_icon[i])
        this.icon_no = i;
  }
  if (this.icon_no<0)
    this.icon_no = 0;

  this.icon_menu.button.setBackground ( this.getIconPath(this.icon_no) );

  if (iconNo>=0)  {
    // set icon in the script
    if (lno>=0)
      lines[lno] = lines[lno].replace ( iname0,__workflow_icon[this.icon_no] );
    else
      lines.splice ( l0,0,'ICON ' + __workflow_icon[this.icon_no] +
                          '  # added automatically' );
    this.editor.setText ( lines.join('\n') );
  }

}
