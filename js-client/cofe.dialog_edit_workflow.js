
/*
 *  =================================================================
 *
 *    30.12.23   <--  Date of Last Modification.
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

  let name_tooltip = 'Workflow ID should contain only latin letters, '  +
                     'numbers, underscores, dashes and dots, and must ' +
                     'start with a letter. The name will be used for '  +
                     'workflow identification and must be unique';

  this.grid.setLabel    ( '<i>Workflow ID</i>:&nbsp;&nbsp;',2,2,1,1 )
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
  this.editor.init ([
      '',
      '# * THIS IS A WORKFLOW SCRIPT TEMPLATE',
      '# * DO NOT ASSUME THAT IT IS FUNCTIONAL WITHOUT EDITING',
      '# * CONSULT DOCUMENTATION',
      '',
      '# -----------------------------------------------------',
      '# Give Workflow Title here',
      '# -----------------------------------------------------',
      '# ' + new Date().toDateString(),
      '#',
      '',
      'VERSION  1.0    # script version for backward compatibility',
      'DEBUG    OFF    # ON/OFF',
      'COMMENTS ON     # ON/OFF',
      'WID      d-imp  # (optional) workflow ID for import mode',
      '',
      '# ==========================================================================',
      '# Workflow header -- EDIT AS NECESSARY',
      '',
      '# General workflow descriptors',
      'NAME     my workflow             # to show in Job Tree',
      'ONAME    my_wflow                # to use for naming output files',
      'TITLE    My Workflow Title       # to display in Task List',
      'DESC     my workflow description # to display in Task List', 
      'ICON     Maraschino              # (optional) workflow icon colour',
      'KEYWORDS my own workflow         # for using in A-Z keyword search',
      '',
      'ALLOW_UPLOAD       # create file upload widgets if started from project root',
      '',
      '# ==========================================================================',
      '# Input data section. List all data required, "!" specifies mandatory items.',
      '# Edit template statements below as necessary:',
      '',
      '# !DATA HKL UNMERGED TYPES anomalous',
      '# !DATA XYZ          TYPES protein dna rna',
      '# DATA LIBRARY',
      '# DATA SEQ           TYPES protein dna rna',
      '# DATA LIGAND\n'  +
      '',
      '# ==========================================================================',
      '# Workflow parameters section. List all parameters required, "!" specifies',
      '# mandatory items. Edit template statements below as necessary:',
      '',
      '# !PAR_INTEGER nCycles  # variable name to be used in workflow\'s expressions',
      '#    LABEL     Number of cycles',
      '#    TOOLTIP   Number of refiniement cycles',
      '#    IWIDTH    40        # (optional) input field width is set to 40 pixels',
      '#    RANGE     0 50      # (optional) allowed min/max values',
      '#    DEFAULT   10        # (optional) default integer value',
      '',
      '# PAR_REAL     resHigh   # variable name to be used in workflow\'s expressions',
      '#    LABEL     High resolution cut-off (&Aring;)',
      '#    TOOLTIP   High resolution cut-off, angstrom',
      '#    IWIDTH    40        # input field width is set to 40 pixels',
      '#    RANGE     0.1 5.0   # allowed min/max values',
      '#    DEFAULT   1.5       # default real value',
      '',
      '# !PAR_STRING  atomType  # variable name to be used in workflow\'s expressions',
      '#    LABEL     Anomalous scatterer',
      '#    TOOLTIP   Expected main anomalous scatterer',
      '#    IWIDTH    20        # input field width is set to 20 pixels',
      '#    MAXLENGTH 2         # (optional) maximum 2 characters',
      '#    DEFAULT   Se        # (optional) default string value "Se"',
      '',    
      '# PAR_CHECK    reqValReport # variable name to be used in workflow\'s expressions',
      '#    LABEL     Request PDB Validation Report',
      '#    TOOLTIP   Check if deposition files should be prepared and PDB validation report obtained',
      '#    DEFAULT   Unchecked',
      '',    
      '# !PAR_COMBO   useBFactors # variable name to be used in workflow\'s expressions',
      '#    LABEL     Use isotropic B-factors',
      '#    TOOLTIP   B-factor mode for refinement',
      '#    IWIDTH    60        # input field width is set to 60 pixels',
      '#    OPTION    none  Select from list  # value "none" text "Select from list" ',
      '#    OPTION    yes   Yes               # value "yes"  text "Yes"',
      '#    OPTION    no    No                # value "no"  text  "No"',
      '#    DEFAULT   none                    # default string value "none"',
      '',
      '# ==========================================================================',
      '# Workflow run body',
      ''
    ].join('\n'),
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
    create    : function (e, ui) {
                  let pane = $(this).dialog("widget")
                                    .find(".ui-dialog-buttonpane");
                  let span = new Widget ( 'span' );
                  $(span.element).prependTo(pane);
                  let library_btn = new Button ( 'Library',image_path('folder') );
                  span.addWidget ( library_btn );
                  $(span.element).css({
                    'position' : 'relative',
                    'left'     : '10px',
                    'top'      : '0px'
                  });
                  library_btn.addOnClickListener ( function(){
                    new CloudFileBrowser ( null,self,0,['wscript'],function(items){
                      // console.log ( ' >>>>>>>here ' + JSON.stringify(items) );
                      // items[0].name
                      fetchFile ( self.rootCloudPath + '/' + items[0].name,
                        function(text){
                          self.editor.setText ( text );
                          self.setIcon ( -1 );
                        },
                        null,
                        function(errcode){
                          new MessageBox ( 'File not found',
                                            'file not found','msg_error' );
                        });
                      return 1;  // do close browser window
                    },null );  
                  });         
                  let add_btn = new Button ( 'Add task',image_path('add') );
                  span.addWidget ( add_btn );
                  $(add_btn.element).css({
                    'position' : 'relative',
                    'left'     : '0px',
                    'top'      : '0px'
                  });
                  add_btn.addOnClickListener ( function(){
                    self.addTask();
                  });
                },
    buttons   : {
      // "Library" : function(){
      //   new CloudFileBrowser ( null,self,0,['wscript'],function(items){
      //     // console.log ( ' >>>>>>>here ' + JSON.stringify(items) );
      //     // items[0].name
      //     fetchFile ( self.rootCloudPath + '/' + items[0].name,
      //       function(text){
      //         self.editor.setText ( text );
      //         self.setIcon ( -1 );
      //       },
      //       null,
      //       function(errcode){
      //         new MessageBox ( 'File not found',
      //                          'file not found','msg_error' );
      //       });
      //     return 1;  // do close browser window
      //   },null );
      // },
      "Save": function() {
        let workflow_id     = wid_inp.getValue().trim();
        let workflow_script = self.editor.getText().trim();
        let msg = '';

        if (workflow_id.length<=0)
          msg += '<li><b>Unique Workflow ID</b> must be provided.</li>';
        else if (wid_inp.element.validity.patternMismatch)
          msg += '<li><b>Workflow ID</b> can contain only latin letters, ' +
                  'numbers, underscores, dashes and dots, and must start' +
                  'with a letter.</li>';
        if (workflow_script.length<=0)
          msg += '<li><b>Workflow script</b> must be provided.</li>';
        
        if (msg)  {
          new MessageBox ( 'Invalid input',
                '<div style="width:400px"><h2>Invalid input</h2>' +
                'Please correct the following:<ul>' + msg + '</ul>', 
                'msg_stop' );
        } else  {
        
          let n = -1;
          for (let i=0;(i<__my_workflows.length) && (n<0);i++)
            if (__my_workflows[i].id==workflow_id)
              n = i;

          if ((n>=0) && (!workflowDesc.id))  {
            new MessageBox ( 'Duplicate workflow name',
                  '<div style="width:400px"><h2>Duplicate workflow name</h2>' +
                  'Workflow named "<i>' + workflow_id + '</i>" already exists ' +
                  'in your account. Please choose a different name.', 
                  'msg_stop' );
          } else  {
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


EditWorkflowDialog.prototype.addTask = function()  {

  const task_list = [
    [ 'Select task'          ,'none'             ],
    [ 'Aimless'              ,'TaskAimless'      ],
    // [ 'ASU Definition'       ,'TaskASUDef'       ],
    [ 'Buccaneer'            ,'TaskBuccaneer'    ],
    [ 'Change Resolution'    ,'TaskChangeReso'   ],
    [ 'Dimple MR'            ,'TaskDimpleMR'     ],
    [ 'Fit Ligand'           ,'TaskFitLigand'    ],
    [ 'Fit Waters'           ,'TaskFitWaters'    ],
    [ 'Make Ligand'          ,'TaskMakeLigand'   ],
    [ 'Modelcraft'           ,'TaskModelCraft'   ],
    [ 'Model Preparation XYZ','TaskModelPrepXYZ' ],
    [ 'MrBump'               ,'TaskMrBump'       ],
    [ 'Parrot'               ,'TaskParrot'       ],
    [ 'Phaser EP'            ,'TaskPhaserEP'     ],
    [ 'Phaser MR'            ,'TaskPhaserMR'     ],
    [ 'Refmac'               ,'TaskRefmac'       ],
    [ 'SHELX C/D'            ,'TaskShelxCD'      ],
    [ 'XYZ Utils'            ,'TaskXYZUtils'     ]
  ];
  
  let dlg = new Dialog ( 'Add new task code' );

  let dlg_size = calcDialogSize (
    __user_settings.jobdlg_size[0],__user_settings.jobdlg_size[1],
    1,1, null
  );

  dlg._options.width   = dlg_size[0];
  dlg._options.height  = dlg_size[1];

  let grid = new Grid('-compact');
  dlg.addWidget ( grid );

  grid.setLabel    ( ' ',0,0,1,1 );
  grid.setCellSize ( '64px','6px', 0,0 );
  let dlg_icon = grid.setImage ( image_path('openjob'),'64px','64px', 1,0,2,1 );
  grid.setLabel    ( ' ',1,1,2,1 );
  grid.setCellSize ( '12px','', 0,0 );
  grid.setLabel    ( 'Add new Task Code',1,2,1,2 ).setFontBold(true).setFontSize('125%');
  grid.setLabel    ( 'Add task:&nbsp;&nbsp;',2,0,1,1 ).setNoWrap().setFontItalic(true);

  let list_cbox = grid.setCombobox ( 2,1,1,1 );
  for (let i=0;i<task_list.length;i++)
    list_cbox.addItem ( task_list[i][0],task_list[i][1],i==0 );
  window.setTimeout ( function(){
    list_cbox.make();
  },0);
  list_cbox.setWidth ( '200px' );
  grid.setLabel    ( ' ',2,2,1,1 );
  grid.setCellSize ( '90%','',2,2 );

  grid.setVerticalAlignment ( 1,0,'middle' );
  grid.setVerticalAlignment ( 2,0,'middle' );

  grid.setHLine    ( 1, 3,0,1,5    );
  grid.setCellSize ( '100%','',3,0 );
  let panel_head = grid.setLabel ( 'Select task to be added to workflow',4,0,1,5 )
                       .setFontItalic(true).setFontSize('87%');
  grid.setCellSize ( '100%','', 4,0 );

  let stask      = null;
  let inputPanel = null;
  let add_btn_id = 'add_btn_' + __id_cnt++;
  let self       = this;

  list_cbox.addOnChangeListener ( function(value,text){
    inputPanel = grid.setPanel ( 5,0,1,5    );
    inputPanel.panel = new Widget  ( 'div'      );
    inputPanel.addWidget           ( inputPanel.panel  );
    inputPanel.panel.setSize_px    ( dlg_size[0]-40,dlg_size[1]-252 );
    if (value=='none')  {
      stask = null;
      dlg_icon.setImage  ( image_path('openjob')   );
      panel_head.setText ( 'Select task to be added to workflow' );
      $('#' + add_btn_id ).button('disable');
    } else  {
      stask = eval   ( 'new ' + value + '()'    );
      dlg_icon.setImage  ( image_path(stask.icon()) );
      panel_head.setText ( 'Choose task parameters and click "Add to workflow" button' );
      // div.grid  = new Grid    ( '-compact' );
      inputPanel.grid  = new Grid    ( '' );
      inputPanel.panel.addWidget     ( inputPanel.grid   );
      inputPanel.panel.setScrollable ( 'auto','auto' );
      inputPanel.grid.inputPanel     = inputPanel;
      inputPanel.fullVersionMismatch = false;  // important for data versioining
      stask.layParameters ( inputPanel.grid,0,0 );
      $('#' + add_btn_id ).button('enable');
    }
  });

  dlg._options.buttons = [
    {
      id    : add_btn_id,
      text  : 'Add to workflow',
      click : function() {
                let input_msg = stask.collectInput ( inputPanel );
                if (input_msg)  {
                  if (input_msg[0]=='#')  {
                    new MessageBox ( 'Input errors','<div style="width:450px;">' +
                                     input_msg.substring(1) + '</div>', 'msg_error' );
                  } else  {
                    // alert ( input_msg );
                    let errlst  = input_msg.split('|');
                    let errlst1 = [];
                    for (let i=0;i<errlst.length;i++)  {
                      let s = errlst[i].trim();
                      if (s)
                        errlst1.push(s);
                    }
                    if (errlst1.length>0)
                      new MessageBox ( 'Input errors',
                        '<div style="width:550px;"><h2>Input errors</h2>' +
                        'The following errors occurred while processing task input:' +
                        '<p><ul><li>' + errlst1.join('</li><li>') +
                        '</li></ul><p>Please correct the task input as appropriate.</h2>',
                        'msg_error' );
                  }                
                } else  {
                  let workflow_script = self.editor.getText();
                  let serialNo    = workflow_script.split(
                                      '@'+stask._type.slice(4).toUpperCase()).length-1;
                  let task_script = stask.getWorkflowScript ( serialNo );
                  self.editor.setText ( workflow_script + task_script.join('\n') +
                                        '\n\n#\n\n' );
                  $(this).dialog ( 'close' );
                }
              }
    }, {
      id    : 'cancel_btn_' + __id_cnt++,
      text  : 'Cancel',
      click : function() {
                $(this).dialog ( 'close' );
              }
    }
  ];

  dlg._options.create = function(){
    $('#' + add_btn_id ).button('disable');
  }

  dlg.launch();

}
