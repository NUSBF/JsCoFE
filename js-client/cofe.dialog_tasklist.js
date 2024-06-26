
/*
 *  =================================================================
 *
 *    26.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_tasklist.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task List Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// TaskListDialog class

var __task_dialog_state = {
  sections : {},
  tabs     : {
    full  : {},
    basic : {}
  }
};

function TaskListDialog ( dataBox,branch_task_list,tree,onSelect_func ) {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Task List' );
  document.body.appendChild ( this.element );

  let projectDesc = tree.projectData.desc;
  // console.log ( ' ntasks=' + tree.countTasks() );

  this.branch_tasks = [];
  for (let i=0;i<branch_task_list.length;i++)
    if (!branch_task_list[i].isRemark())
      this.branch_tasks.push ( branch_task_list[i] );

  this.dataBox       = dataBox;
  this.task          = this.branch_tasks[0];
  this.onSelect_func = onSelect_func;
  this.selected_task = null;  // will receive new task template or null if canceled

  // console.log ( ' jobs=' + projectData.tree[0].children.length );

  // if (dataBox.isEmpty())
  //   console.log ( 'empty' );
  // else {
  //   console.log ( 'not empty');
  // }
  // console.log ( '  l=' + branch_task_list.length );

  this.dlg_width  = window.innerWidth;
  this.dlg_width  = Math.min ( Math.max(840,4*this.dlg_width/9),6*this.dlg_width/8 );
  this.dlg_height = 6*window.innerHeight/8;

  this.listAtoZ     = [];
  this.tabs_basic   = null;
  this.tabs_full    = null;
  // this.combobox     = null;
  // this.combobox_lbl = null;
  this.checkbox     = null;
  let help_link     = __user_guide_base_url + 'jscofe_tasklist.html';
  if (projectDesc.startmode==start_mode.migrate)  {
    this.makeLayout ( 30 );
    this.checkbox = new Checkbox ( 'Full list',projectDesc.tasklistmode==tasklist_mode.full );
    this.checkbox .setWidth ( '100px' );
    // this.combobox = new Combobox();
    // this.combobox
    //     .addItem  ( 'Basic task list','basic',projectDesc.tasklistmode==tasklist_mode.basic )
    //     .addItem  ( 'Full task list' ,'full' ,projectDesc.tasklistmode==tasklist_mode.full  )
    //     .setWidth ( '180px' );
  } else if (projectDesc.startmode==start_mode.auto)  {
    if (tree.countTasks()>0)  {
      if (branch_task_list.length<1)
            this.makeLayout ( 21 );
      else  this.makeLayout ( 22 );
      this.checkbox = new Checkbox ( 'Full list',projectDesc.tasklistmode==tasklist_mode.full );
      this.checkbox .setWidth ( '100px' );
      // this.combobox = new Combobox();
      // this.combobox
      //     .addItem  ( 'Basic task list','basic',projectDesc.tasklistmode==tasklist_mode.basic )
      //     .addItem  ( 'Full task list' ,'full' ,projectDesc.tasklistmode==tasklist_mode.full  )
      //     .setWidth ( '180px' );
    } else  {
      this.makeLayout ( 20 );
      help_link = __user_guide_base_url + 'jscofe_workflows.html';
    }
  } else
    this.makeLayout ( 10 );

  // if (this.combobox)  {
  //   this.combobox_lbl = new Label ( 'Switch to full list<br>for more tasks' );
  //   this.combobox_lbl.setFontSize('80%').setFontItalic(true).setWidth('150px');
  // }

  if (this.tabs_basic)  {
    this.tabs_basic  .setVisible ( projectDesc.tasklistmode==tasklist_mode.basic );
    this.tabs_full   .setVisible ( projectDesc.tasklistmode==tasklist_mode.full  );
    // this.combobox_lbl.setVisible ( projectDesc.tasklistmode==tasklist_mode.basic );
  }

  let self = this;

  $(self.element).dialog({

    resizable : true,
    height    : self.dlg_height,
    width     : self.dlg_width,
    maxHeight : $(window).height()-20,
    modal     : true,

    create    : function (e, ui) {
                  // if (self.combobox)  {
                  //   var pane = $(this).dialog("widget")
                  //                     .find(".ui-dialog-buttonpane");
                  //   var span = new Widget ( 'span' );
                  //   $(span.element).prependTo(pane);
                  //   span.addWidget ( self.combobox );
                  //   self.combobox.make ();
                  //   $(span.element).css({
                  //     'position' : 'relative',
                  //     'left'     : '10px',
                  //     'top'      : '8px'
                  //   });
                  //   span.addWidget ( self.combobox_lbl );
                  //   $(self.combobox_lbl.element).css({
                  //     'position' : 'relative',
                  //     'left'     : '200px',
                  //     'top'      : '32px',
                  //     'margin-top' : '-64px'
                  //   });
                  // }
                  if (self.checkbox)  {
                    let pane = $(this).dialog("widget")
                                      .find(".ui-dialog-buttonpane");
                    let span = new Widget ( 'span' );
                    $(span.element).prependTo(pane);
                    span.addWidget ( self.checkbox );
                    $(span.element).css({
                      'position' : 'relative',
                      'left'     : '10px',
                      'top'      : '8px'
                    });            
                  }
                },

    beforeClose : function(event, ui) {
                  self.saveDialogState();
                  if (self.checkbox)
                        self.onSelect_func ( self.selected_task,self.getListSwitchValue() );
                  else  self.onSelect_func ( self.selected_task,null );
                },

    buttons   : [
      { text  : 'Help',
        click : function() {
          new HelpBox ( '',help_link,null );
        }
      },
      { text  : 'Close',
        click : function() {
          $( this ).dialog( "close" );
        }
      }
    ]
  });

  $(self.element).on( "dialogresize", function(event,ui){
    //self.onResize();
    let height = self.element.innerHeight - 16;
    if (self.tabs_basic)  {
      $(self.tabs_basic.element).height ( height );
      self.tabs_basic.refresh();
    }
    if (self.tabs_full)  {
      $(self.tabs_full.element).height ( height );
      self.tabs_full.refresh();
    }
  });

  // $(self.element).on( "dialogclose",function(event,ui){
  //   alert ( 'exit');
  //   // self.saveDialogState();
  // });

  // if (self.combobox)  {
  //   self.combobox.addOnChangeListener ( function(value,text){
  //     self.tabs_basic  .setVisible ( value==tasklist_mode.basic );
  //     self.tabs_full   .setVisible ( value==tasklist_mode.full  );
  //     self.combobox_lbl.setVisible ( value==tasklist_mode.basic );
  //     projectDesc.tasklistmode = value;
  //     if (value==tasklist_mode.full)  self.tabs_full.refresh();
  //                               else  self.tabs_basic.refresh();
  //   });
  // }

  if (self.checkbox)  {
    self.checkbox.addOnClickListener ( function(){
      let value = self.getListSwitchValue();
      self.tabs_basic.setVisible ( value==tasklist_mode.basic );
      self.tabs_full .setVisible ( value==tasklist_mode.full  );
      projectDesc.tasklistmode = value;
      if (value==tasklist_mode.full)  self.tabs_full .refresh();
                                else  self.tabs_basic.refresh();
    });
  }

  $(this.element).css ( 'width:100%' );

  // if (this.combobox)  {
  //   $(this.tabs_basic.element).height ( this.element.innerHeight-16 );
  //   this.tabs_basic.refresh();
  // }

  if (this.checkbox)  {
    $(this.tabs_basic.element).height ( this.element.innerHeight-16 );
    this.tabs_basic.refresh();
  }

  if (this.tabs_full)  {
    $(this.tabs_full.element).height ( this.element.innerHeight-16 );
    this.tabs_full.refresh();
  }

  //launchHelpBox ( '','./html/jscofe_tasklist.html',doNotShowAgain,1000 );

}

TaskListDialog.prototype = Object.create ( Widget.prototype );
TaskListDialog.prototype.constructor = TaskListDialog;


// ===========================================================================

TaskListDialog.prototype.getListSwitchValue = function()  {
  if (this.checkbox.getValue())  return tasklist_mode.full;
  return tasklist_mode.basic;
}

TaskListDialog.prototype.setDockMenu = function ( task_obj,grid,row )  {
let self    = this;
let in_dock = __current_page.dock.inDock ( task_obj );
let dockMenu;
  if (in_dock)  {
    dockMenu = new Menu('',image_path('dock_ind_sel'));
    dockMenu.addItem('Remove task from dock',image_path('remove'))
            .addOnClickListener(function(){
      __current_page.dock.removeTask ( task_obj._type );
      __current_page.dock.show();
      dockMenu.setMenuIcon ( image_path('dock_ind') );
      self.setDockMenu ( task_obj,grid,row );
    });
  } else  {
    dockMenu = new Menu('',image_path('dock_ind'));
    dockMenu.addItem('Add task to dock',image_path('add'))
            .addOnClickListener(function(){
      __current_page.dock.addTaskClass ( task_obj );
      __current_page.dock.show();
      dockMenu.setMenuIcon ( image_path('dock_ind_sel') );
      self.setDockMenu ( task_obj,grid,row );
    });
  }
  grid.setWidget ( dockMenu,row,0,1,1 )
}


TaskListDialog.prototype.setTask = function ( task_obj,grid,row,setall,idlen )  {

  //if ((!__local_service) && (task_obj.nc_type=='client'))
  //  return null;

  if ((!task_obj) || (task_obj.state==job_code.retired))
    return null;

  let avail_key = task_obj.isTaskAvailable();

  /*   example just in case:
  if (['ok','client','server-excluded','windows-excluded','client-storage']
      .indexOf(avail_key)<0)
    return null;
  */

  let dataSummary = this.dataBox.getDataSummary ( task_obj );
  if (avail_key[0]!='ok')
    dataSummary.status = -1;

  if ((!setall) && (dataSummary.status<=0))
    return null;

  // let dock_btn = grid.setIconLabel ( '',image_path('dock_small'),row,0,1,1 )
  //               .setSize_px ( 54,40 );

  this.setDockMenu ( task_obj,grid,row );

  let btn = grid.setButton  ( '',image_path(task_obj.icon()),row,1,1,1 )
                .setSize_px ( 54,40 );
  grid.setLabel             ( '&nbsp;&nbsp;',row,2,1,1 );
  let title = task_obj.title;
  if (this._setting_wf)
    title = title.replace ( 'Workflow: ','' );

  let desc_indent = '&nbsp;&nbsp;';
  if (idlen>0)  {
    let autoRunId = '[' + task_obj.autoRunId + ']';
    let dn = idlen - autoRunId.length + 2;
    for (let i=0;i<dn;i++)
      autoRunId += '&nbsp;';
    title = '<span style="white-space:pre"><b>' + autoRunId + 
            '</b>&#9;</span>' + title;
    /* doubtful alignment, just in case
    for (let i=0;i<1.75*idlen;i++)
      desc_indent += '&nbsp;';
    desc_indent = '<span style="white-space:pre"><b>' + desc_indent +
                  '</b>&#9;</span>';
    */
  }

  if (avail_key[0]!='ok')  {
    title = '<span style="line-height:16px;">' + title  +
            '<br>' + desc_indent + '<span style="font-size:13px;"><i>** ' + 
            avail_key[1] + '</i></span></span>';
  } else  {
    let desc_title = task_obj.desc_title();
    if (desc_title)
      title = '<span style="line-height:16px;padding-top:4px;">' + title  +
              '<br>' + desc_indent + 
              '<span style="font-size:13px;color:gray;"><i>-- ' + desc_title + 
              '</i></span></span>';
  }
  let lbl = grid.setLabel   ( title,row,3,1,1 );
  grid.setNoWrap            ( row,3 );
  grid.setVerticalAlignment ( row,3,'middle'  );
  grid.setCellSize          ( 'auto','',row,0 );
  grid.setCellSize          ( 'auto','',row,1 );
  grid.setCellSize          ( 'auto','',row,2 );
  grid.setCellSize          ( '99%' ,'',row,3 );
  grid.setCursor            ( 'pointer' );

  btn.dataSummary = dataSummary;

  switch (btn.dataSummary.status)  {
    default :
    case 0  : $(btn.element).css({'border':'2px solid #FF1C00'});        // maroon
              btn.setIndicator ( image_path('nogo'),1 );  // top-right corner indicator
              lbl.setFontColor('#888888').setFontItalic(true);
          break;
    case 1  : $(btn.element).css({'border':'2px solid #FFBF00'}); break; // amber
    case 2  : $(btn.element).css({'border':'2px solid #03C03C'}); break; // green
  }

  (function(dlg,ibtn){

    function taskClicked() {
      if (ibtn.dataSummary.status>0)  {
        dlg.selected_task = task_obj;
        // if (dlg.combobox)
        //       dlg.onSelect_func ( task_obj,dlg.combobox.getValue() );
        // else  dlg.onSelect_func ( task_obj,null );
        // if (dlg.checkbox)
        //       dlg.onSelect_func ( task_obj,dlg.getListSwitchValue() );
        // else  dlg.onSelect_func ( task_obj,null );
        // dlg.saveDialogState();
        $(dlg.element).dialog ( 'close' );
      // } else if (avail_key[0]=='private')  {
      //   new MessageBox ( 'Confidentiality conflict',avail_key[2],'msg_stop' );
      } else if (avail_key[0]!='ok')  {
        new MessageBox ( 'Task is not available',avail_key[2],'msg_stop' );
      } else  {
        // insufficient data
        new TaskDataDialog ( ibtn.dataSummary,task_obj,avail_key );
      }
    }

    ibtn.addOnClickListener ( taskClicked );

    // ibtn.addOnRightClickListener ( function(){ alert ('right click'); });

    lbl.addOnClickListener ( taskClicked );

    // var contextMenu = new Menu('',image_path('dock'),true);
    // grid.setWidget   ( contextMenu,row,1,1,1 )

    // var contextMenu = new ContextMenu ( ibtn,null );
    // contextMenu.setZIndex ( 600 );
    // contextMenu.addItem('Add task to dock',image_path('add'))
    //            .addOnClickListener(function(){
    //             console.log ( 'add' );
    //   // alert('add')
    // });

  }(this,btn));

  return btn;

}


TaskListDialog.prototype.makeLayout = function ( key )  {

  if (key==20)  {
    // initial choice for autostart
    this.element.setAttribute ( 'title','Autostart' );
    let grid = new Grid ( '-compact' );
    this.addWidget ( grid );
    this.makeAutostartList ( grid );
    this.dlg_height = 'auto';
    return;
  }

  if (key>10)  {

    this.tabs_basic = new Tabs();
    this.addWidget ( this.tabs_basic );
    
    let tabb_workflows = null;
    let tabb_shortlist = null;

    let active_tab = '';
    if (__user_settings.tasklist_state && 
        ('active_tab' in __task_dialog_state.tabs.basic))
      active_tab = __task_dialog_state.tabs.basic.active_tab;

    if (key==21)  {
      if (!active_tab)
        active_tab = 'Workflows';
      tabb_workflows = this.tabs_basic.addTab ( 'Workflows',
                                                'Workflows'==active_tab );
      tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',
                                                'Essential tasks'==active_tab );
    } else if (key=22)  {
      if (!active_tab)
        active_tab = 'Essential tasks';
      tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',
                                                'Essential tasks'==active_tab );
      tabb_workflows = this.tabs_basic.addTab ( 'Workflows',
                                                'Workflows'==active_tab );
    } else
      tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',true );

    this.makeBasicList ( tabb_shortlist.grid,key );
  
    if (tabb_workflows)
      this.makeWorkflowsList ( tabb_workflows.grid );
  
  }

  this.tabs_full = new Tabs();
  this.addWidget ( this.tabs_full );
  // this.tabs_AtoZ = new Tabs();
  // this.addWidget ( this.tabs_AtoZ );

  let active_tab = 'Suggested tasks';
  if (__user_settings.tasklist_state && 
      ('active_tab' in __task_dialog_state.tabs.full))
    active_tab = __task_dialog_state.tabs.full.active_tab;

  let tabf_suggested = this.tabs_full.addTab ( 'Suggested tasks',
                                                     'Suggested tasks'==active_tab );
  let tabf_fulllist  = this.tabs_full.addTab ( 'All tasks','All tasks'==active_tab );
  let tabf_workflows = this.tabs_full.addTab ( 'Workflows','Workflows'==active_tab );
  this.tabf_AtoZ     = this.tabs_full.addTab ( 'A-Z'      ,'A-Z'      ==active_tab );
  this._setting_wf = false;
  this.makeSuggestedList ( tabf_suggested.grid );
  this.makeFullList      ( tabf_fulllist .grid );
  this.makeWorkflowsList ( tabf_workflows.grid );
  this.makeAtoZList      ( this.tabf_AtoZ.grid );

  if (__user_settings.tasklist_state)  {
    // Wire up tab scrolling: trace and restore

    let self = this;

    if (this.tabs_full)  {
      let tabs = this.tabs_full.tabs;
      for (let tabName in tabs)
        tabs[tabName].setScrollListener ( function(pos){
          __task_dialog_state.tabs.full[tabName] = pos;
        });
      this.tabs_full.setTabChangeListener ( function(ui){
        self.scrollActiveTab ( self.tabs_full,__task_dialog_state.tabs.full );
      });
    }

    if (this.tabs_basic)  {
      let tabs = this.tabs_basic.tabs;
      for (let tabName in tabs)
        tabs[tabName].setScrollListener ( function(pos){
          __task_dialog_state.tabs.basic[tabName] = pos;
        });
      this.tabs_basic.setTabChangeListener ( function(ui){
        self.scrollActiveTab ( self.tabs_basic,__task_dialog_state.tabs.basic );
      });
    }

    window.setTimeout ( function(){
      if (self.tabs_full)
        self.scrollActiveTab ( self.tabs_full,__task_dialog_state.tabs.full );
      if (self.tabs_basic)
        self.scrollActiveTab ( self.tabs_basic,__task_dialog_state.tabs.basic );
    },1);

  }

}


TaskListDialog.prototype.scrollActiveTab = function ( tabs,tabsData )  {
let tabName = tabs.getActiveTab().name;
  if (tabName in tabsData)
    tabs.tabs[tabName].setScrollPosition ( tabsData[tabName] );
}


TaskListDialog.prototype.makeBasicList = function ( grid,key )  {
let r = 0;  // grid row

  //grid.setLabel ( '<h2>Basic tasks</h2>',r++,0,1,3 );
  //grid.setLabel ( 'Switch to full set for more tasks',r++,0,1,3 )
  //    .setFontItalic(true).setFontSize('85%');

  grid.setLabel ( 'Essential Tasks',r++,0,1,4 )
      .setFontSize('140%').setFontBold(true);
  grid.setLabel ( '&nbsp;',r++,0,1,4 ).setFontSize('40%');
  let infotip = '<i>This list contains ' + appName() +
                ' tasks commonly used for structure completion after running ' +
                'structure solution workflows. For full set of tasks, switch ' +
                'to </i>"Full task list"<i> below.</i>';
  if (key==30)
    infotip = '<i>This list contains ' + appName() +
              ' tasks commonly used for structure completion after importing ' +
              'partially solved structures. For full set of tasks, switch to ' +
              '</i>"Full task list"<i> below.</i>';
  grid.setLabel ( infotip ,r++,0,1,4 ).setFontSize('90%');
  grid.setLabel ( '&nbsp;',r++,0,1,4 ).setFontSize('20%');

  let task_list = [
    
    "Refinement and Interactive Model Building",
    new TaskRefmac        (),
    new TaskCootMB        (),
    new TaskWebCoot       (),
    new TaskBuster        (),
    new TaskLorestr       (),
    new TaskDimple        (),
    new TaskPhaserRB      (),
    new TaskPDBREDO       (),

    "Ligands",
    new TaskMakeLigand    (),
    new TaskFitLigand     (),
    new TaskFitWaters     (),

    "Import Additional Data",
    new TaskImport        (),
    new TaskImportReplace (),
    new TaskImportSeqCP   (),
  
  ];

  if (key==30)
    task_list.push ( new TaskMigrate() );

  task_list = task_list.concat ([

    "Automatic Model Building and Density Modification",
    new TaskModelCraft(),
    new TaskCCP4Build (),
    new TaskArpWarp   (),
    new TaskParrot    (),

    "Validation and Deposition",
    new TaskPDBVal    (),
    new TaskPISA      (),
    new TaskPrivateer (),

    // new TaskDeposition()
    "Toolbox"

  ]);

  // if (!isSafari())
  task_list.push ( new TaskWebCoot()   );
  task_list.push ( new TaskWebCootCE() );

  task_list = task_list.concat ([

    new TaskXyzUtils  (),
    new TaskGesamt    (),
    new TaskLsqKab    (),
    new TaskSeqAlign  (),
    new TaskSymMatch  ()

  ]);


  for (var i=0;i<task_list.length;i++)
    if (typeof task_list[i] === 'string' || task_list[i] instanceof String) {
      grid.setLabel ( '&nbsp;',r++,0,1,4 ).setHeight_px(4);
      grid.setLabel ( '<hr/>',r,0,1,2 );
      var grid1 = grid.setGrid ( '',r++,1,1,2 );
      grid1.setLabel ( '&nbsp;' + task_list[i] + '&nbsp;',0,0,1,1 )
           .setFontItalic(true).setFontBold(true).setNoWrap();
      grid1.setLabel ( '<hr/>',0,1,1,1 );
      grid1.setCellSize ( '10%','8px',0,0 );
      grid1.setCellSize ( '90%','8px',0,1 );
    } else if (this.setTask(task_list[i],grid,r,true,0))
      r++;

  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeAutostartList = function ( grid )  {
let r = 0;  // grid row

  // grid.setLabel ( 'Autostart Project',r++,0,1,3 )
  //     .setFontSize('140%').setFontBold(true);
  // grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');
  // grid.setLabel ( 'Choose starting workflow that matches your project best, ' +
  //                 'see details ' +
  //                 '<a href="javascript:launchHelpBox1(\'Automatic Workflows\',' +
  //                 '\'' + __user_guide_base_url +
  //                 'jscofe_workflows.html\',null,10)">here</a>.',r++,0,1,3 )
  //     .setFontSize('90%').setFontItalic(true);
  // grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');

  grid.setLabel ( '<h3>Choose project template from options below that matches ' +
                  'your data best:</h3>',r++,0,1,4 );

  let task_list = [
    new TaskWFlowAMR (),
    new TaskWFlowAFMR(),
    new TaskWFlowSMR (),
    new TaskWFlowDPLMR(),
    new TaskWFlowAEP ()
  ];

  for (let i=0;i<task_list.length;i++)  {
    if (task_list[i].file_select.length>0)
      task_list[i].inputMode = 'root'; // force 'at root mode' for the task
    if (this.setTask(task_list[i],grid,r,true,0))
    r++;
  }

  grid.setLabel ( '&nbsp;<br><hr/>After data upload and starting, the project ' +
                  'tree unfolds automatically. More jobs from Task List can be ' +
                  'added to the project tree at any time then, using the green ' +
                  'plus button.',r++,0,1,5 )
      .setFontSize('90%').setFontItalic(true);



  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeMyWorkflowsList = function ( grid0,r0 )  {

  if (__my_workflows.length<=0)
    return new Label ( 'None defined' ).setFontItalic(true);

  let self = this;

  let grid = new Grid ( '' );

  let idlen = 0;
  let tasks = [];
  for (let i=0;i<__my_workflows.length;i++)  {
    let task = new TaskWorkflow();
    task.setWorkflow ( __my_workflows[i] );
    if (this.dataBox.isEmpty() && (task.file_select.length>0))
      task.inputMode = 'root'; // force 'at root mode' for the task
    idlen = Math.max ( idlen,task.autoRunId.length );
    tasks.push ( task );
  }

  for (let i=0;i<__my_workflows.length;i++)  {
    // let task = new TaskWorkflow();
    // task.setWorkflow ( __my_workflows[i] );
    // if (this.dataBox.isEmpty() && (task.file_select.length>0))
    //   task.inputMode = 'root'; // force 'at root mode' for the task
    if (this.setTask(tasks[i],grid,i,true,idlen))  {
      (function(wDesc){
        grid.setButton  ( '',image_path('edit'),i,4, 1,1 )
            .setSize    ( '32px','32px'   )
            .setTooltip ( 'Edit workflow' )
            .setVerticalAlignment ( 'middle' )
            .addOnClickListener ( function(){
              new EditWorkflowDialog ( wDesc,function(){
                grid0.setWidget   ( self.makeMyWorkflowsList(grid0,r0),r0,0,1,4 );
                self.makeAtoZList ( self.tabf_AtoZ.grid );
              });
            });
        grid.setButton  ( '',image_path('delete'),i,5, 1,1 )
            .setSize    ( '32px','32px'     )
            .setTooltip ( 'Delete workflow' )
            .setVerticalAlignment ( 'middle' )
            .addOnClickListener ( function(){
              removeMyWorkflow ( wDesc.id );
              saveMyWorkflows();
              grid0.setWidget   ( self.makeMyWorkflowsList(grid0,r0),r0,0,1,4 );
              self.makeAtoZList ( self.tabf_AtoZ.grid );
            });
      }(__my_workflows[i]))
      grid.setCellSize ( '99%' ,'',i,3 );
      grid.setCellSize ( 'auto','',i,4 );
      grid.setCellSize ( 'auto','',i,5 );
      let n = -1;
      for (let j=0;(j<this.listAtoZ.length) && (n<0);j++)
        if (this.listAtoZ[i].autoRunId==__my_workflows[i].id)
          n = i;
      if (n>=0)  this.listAtoZ[n] = tasks[i];
           else  this.listAtoZ.push ( tasks[i] );
    }
  }

  return grid;

}


TaskListDialog.prototype.makeWorkflowsList = function ( grid )  {
let r = 0;  // grid row

  this._setting_wf = true;

  grid.setLabel ( 'Automatic Workflows',r++,0,1,4 )
      .setFontSize('140%').setFontBold(true);
  grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');
  grid.setLabel ( 'Each workflow will run a series of tasks, see details ' +
                  '<a href="javascript:launchHelpBox1(\'Automatic Workflows\',' +
                  '\'' + __user_guide_base_url +
                  'jscofe_workflows.html\',null,10)">here</a>.',r++,0,1,4 )
      .setFontSize('90%').setFontItalic(true);
  grid.setLabel ( '&nbsp;',r++,0,1,4 ).setFontSize('40%');


//'manuals/html-userguide/jscofe_workflows.html'

  // var ccp4go_autoMR = new TaskWFlowAMR();
  // if (this.dataBox.isEmpty())
  //   ccp4go_autoMR.inputMode = 'root'; // force 'at root mode' for the task

  let task_list = [
    "Workflows for starting a Project",
    new TaskWFlowAMR (),
    new TaskWFlowAFMR(),
    new TaskWFlowSMR (),
    new TaskWFlowDPLMR(),
    new TaskWFlowAEP (),
    "Workflows for using within a Project",
    new TaskWFlowDPL (),
    new TaskWFlowREL()
  ];

  for (let i=0;i<task_list.length;i++)  {
    if (typeof task_list[i] === 'string' || task_list[i] instanceof String) {
      grid.setLabel ( '&nbsp;',r++,0,1,3 ).setHeight_px(4);
      grid.setLabel ( '<hr/>',r,0,1,2 );
      let grid1 = grid.setGrid ( '',r++,1,1,2 );
      grid1.setLabel ( '&nbsp;' + task_list[i] + '&nbsp;',0,0,1,1 )
           .setFontItalic(true).setFontBold(true).setNoWrap();
      grid1.setLabel ( '<hr/>',0,1,1,1 );
      grid1.setCellSize ( '10%','8px',0,0 );
      grid1.setCellSize ( '90%','8px',0,1 );
    } else {
      if (this.dataBox.isEmpty() && (task_list[i].file_select.length>0))
        task_list[i].inputMode = 'root'; // force 'at root mode' for the task
      if (this.setTask(task_list[i],grid,r,true,0))  {
        r++;
        this.listAtoZ.push ( task_list[i] );
      }
    }
  }

  // if (__user_role==role_code.developer)  {

    grid.setLabel ( '&nbsp;',r++,0,1,4 );
    grid.setHLine ( 2, r++,0,1,4 );
    grid.setLabel ( 'My Workflows',r++,0,1,4 ).setFontSize('140%').setFontBold(true);
    grid.setLabel ( '&nbsp;',r++,0,1,4 ).setFontSize('40%');

    let r0 = r;
    grid.setWidget ( this.makeMyWorkflowsList(grid,r0),r++,0,1,4 );

    grid.setLabel  ( '&nbsp;',r++,0,1,4 ).setFontSize('40%');
    let self  = this;
    let grid2 = grid.setGrid ( '-compact',r++,0,1,4 );
    grid2.setButton ( 'Add workflow',image_path('add'), 0,0,1,1 )
        .setWidth_px ( 120 )
        .setTooltip  ( 'Add new custom workflow' )
        .addOnClickListener ( function(){
          new EditWorkflowDialog ( null,function(){
            grid.setWidget ( self.makeMyWorkflowsList(grid,r0),r0,0,1,4 );
          });
        })
    grid2.addButton ( '',image_path('reference'), 0,1,1,1 )
        .setSize    ( '40px','34px' )
        .setTooltip ( 'Read how to write your own workflows' )
        .addOnClickListener ( function(){
          new HelpBox ( '',__user_guide_base_url + 'jscofe_custom_workflows.html',
                        null );
        })

    // grid.setButton ( 'Add workflow',image_path('add'), r++,0,1,4 )
    //     .setWidth_px ( 120 )
    //     .addOnClickListener ( function(){
    //       new EditWorkflowDialog ( null,function(){
    //         grid.setWidget ( self.makeMyWorkflowsList(grid,r0),r0,0,1,4 );
    //       });
    //     })
    
  // }

  this._setting_wf = false;

  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeSuggestedList = function ( grid )  {
let knowledge = getWfKnowledge ( this.branch_tasks[2],this.branch_tasks[1],
                                 this.branch_tasks[0] );
let tasks     = knowledge.tasks;
let counts    = knowledge.counts;
let ctotal    = 0;
let r         = 0;  // grid row

//console.log ( knowledge );

  for (let i=0;i<counts.length;i++)  {
    for (let j=i+1;j<counts.length;j++)
      if (counts[j]>counts[i])  {
        let t = tasks [i];  tasks [i] = tasks [j];  tasks [j] = t;
        let c = counts[i];  counts[i] = counts[j];  counts[j] = c;
      }
    ctotal += counts[i];
  }

  let cthresh = ctotal*__suggested_task_prob;
// console.log ( 'ctotal='+ctotal + ',  cthresh='+cthresh );

  for (let i=0;i<tasks.length;i++)
    if ((i<__suggested_task_nmin) || (ctotal>=cthresh))  {
      //console.log ( 'task=' + tasks[i] + ',  ctotal=' + ctotal );
      // let task = eval ( 'new ' + tasks[i] + '()' );
      let task = makeNewInstance ( tasks[i] );
      if (this.setTask(task,grid,r,false,0))
        r++;
      ctotal -= counts[i];
    }

  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeSection = function ( grid,title,task_list,addToAtoZ )  {
let row     = grid.getNRows();
let section = grid.setSection ( title,false, row,0,1,3 );
let r       = 0;

  this.task_cnt = 0;

//  section.tasks = {};  <-- for section optimisation
  if (!('sections' in grid))
    grid.sections = [];
  grid.sections.push ( section );

  for (let n=0;n<task_list.length;n++)
    if (task_list[n])  {
      if (typeof task_list[n] === 'string' || task_list[n] instanceof String) {
        section.grid.setLabel ( '&nbsp;',r++,0,1,3 ).setHeight_px(4);
        section.grid.setLabel ( '<hr/>',r,0,1,2 );
        let grid1 = section.grid.setGrid ( '',r++,1,1,2 );
        grid1.setLabel ( '&nbsp;' + task_list[n] + '&nbsp;',0,0,1,1 )
             .setFontItalic(true).setFontBold(true).setNoWrap();
        grid1.setLabel ( '<hr/>',0,1,1,1 );
        grid1.setCellSize ( '10%','8px',0,0 );
        grid1.setCellSize ( '90%','8px',0,1 );
      } else  {
        let btn = this.setTask ( task_list[n],section.grid,r++,true );
        if (btn)  {
          if (btn.dataSummary.status>0)
            this.task_cnt++;
          if (addToAtoZ)
            this.listAtoZ.push ( task_list[n] );
//          section.tasks[task_list[n]._type] = 1;  <-- for section optimisation
        }
      }
    }

  section.setTitle ( title + ' <b>(' + this.task_cnt + ')</b>' );
  if (this.task_cnt>0)  {
    this.navail++;
    this.section0 = section;
  }
  
  if (__user_settings.tasklist_state)  {
    let secId = section.title.split('(')[0];
    if (secId in __task_dialog_state.sections)  {
      __task_dialog_state.sections[secId].section = section;
      section.setOpenState ( __task_dialog_state.sections[secId].openState )
    } else  {
      __task_dialog_state.sections[secId] = {
        section   : section,
        openState : section.isOpen()
      };
    }
  }

  section.setBeforeActivateListener ( function(){
    // on section open
    for (let i=0;i<grid.sections.length;i++)
      if (grid.sections[i].id!=section.id)
        grid.sections[i].close();
  },function(){});

  return section;

}


TaskListDialog.prototype.saveDialogState = function()  {

  /*  ====  version with automatic closure of sections that do not
            contain the selected job
  if (!this.selected_task)  {
    // leave all opened sections unfolded
    for (let secId in __task_dialog_state.sections)
      __task_dialog_state.sections[secId].openState = 
                          __task_dialog_state.sections[secId].section.isOpen();
  } else  {
    // leave unfolded only section from which the task was selected
    let stask = this.selected_task._type;
    for (let secId in __task_dialog_state.sections)  {
      let section = __task_dialog_state.sections[secId].section;
      __task_dialog_state.sections[secId].openState = 
                          section.isOpen() && (stask in section.tasks);
    }
  }
  =====  */

  for (let secId in __task_dialog_state.sections)
  __task_dialog_state.sections[secId].openState = 
                            __task_dialog_state.sections[secId].section.isOpen();


  if (this.tabs_full)
    __task_dialog_state.tabs.full.active_tab = this.tabs_full.getActiveTab().name;

  if (this.tabs_basic)
    __task_dialog_state.tabs.basic.active_tab = this.tabs_basic.getActiveTab().name;

}


TaskListDialog.prototype.makeFullList = function ( grid )  {
  this.section0 = null;
  this.navail   = 0;
  this.task_cnt = 0;
// var row      = 0;

  // this.makeSection = function ( grid,title,task_list,addToAtoZ )  {
  //   let row     = grid.getNRows();
  //   let section = grid.setSection ( title,false, row,0,1,3 );
  //   let cnt = 0;
  //   let r   = 0;
  //   for (var n=0;n<task_list.length;n++)
  //     if (task_list[n])  {
  //       if (typeof task_list[n] === 'string' || task_list[n] instanceof String) {
  //         section.grid.setLabel ( '&nbsp;',r++,0,1,3 ).setHeight_px(4);
  //         section.grid.setLabel ( '<hr/>',r,0,1,1 );
  //         var grid1 = section.grid.setGrid ( '',r++,1,1,2 );
  //         grid1.setLabel ( '&nbsp;' + task_list[n] + '&nbsp;',0,0,1,1 )
  //             .setFontItalic(true).setFontBold(true).setNoWrap();
  //         grid1.setLabel ( '<hr/>',0,1,1,1 );
  //         grid1.setCellSize ( '10%','8px',0,0 );
  //         grid1.setCellSize ( '90%','8px',0,1 );
  //       } else  {
  //         var btn = this.setTask ( task_list[n],section.grid,r++,true,0 );
  //         if (btn)  {
  //           if (btn.dataSummary.status>0)
  //             cnt++;
  //           if (addToAtoZ)
  //             this.listAtoZ.push ( task_list[n] );
  //         }
  //       }
  //     }
  //   section.setTitle ( title + ' <b>(' + cnt + ')</b>' );
  //   if (cnt>0)  {
  //     navail++;
  //     section0 = section;
  //   }
  //   return section;
  // }

//   var ccp4go_task = new TaskCCP4go();
//   if (this.dataBox.isEmpty())
//     ccp4go_task.inputMode = input_mode.root; // force 'at root mode' for the task
// //    ccp4go_task.input_dtypes = [1]; // force 'at root mode' for the task
//   if (ccp4go_task.isTaskAvailable()[0]=='ok')
//     this.makeSection ( 'Combined Automated Solver <i>"CCP4 Go"</i>',[
//       'Recommended as first attempt or in easy cases',
//       ccp4go_task
//     ],true);
  let section1 = this.section0;

  if (__user_role==role_code.developer)  {

    this.makeSection ( grid,'Documentation tools',[
      new TaskDocDev()
    ],false);

    // var ccp4go2_task = new TaskCCP4go2();
    // if (this.dataBox.isEmpty())
    //   ccp4go2_task.inputMode = input_mode.root; // force 'at root mode' for the task
    // //  ccp4go2_task.input_dtypes = [1]; // force 'at root mode' for the task
    // /*
    // if (ccp4go2_task.isTaskAvailable()[0]=='ok')
    //   this.makeSection ( 'Combined Automated Solver <i>"CCP4 Go-2"</i>',[
    //     'Recommended as first attempt or in easy cases',
    //     ccp4go2_task
    //   ],true);
    // */

    this.makeSection ( grid,'Tasks in Development',[
      // new TaskCootUtils    (),
      // new TaskWFlowAFMR    (),
      // new TaskRabdam       (),
      new TaskXDS         (),
      new TaskFetchData    (),
      new TaskFragon       (),
      new TaskMergeData    (),
      new TaskHelloWorld   ()
    ],false);

  }

  let data_import_tasks = [
    new TaskImport        (),
    new TaskImportSeqCP   (),
    new TaskImportPDB     (),
    new TaskImportReplace (),
    new TaskMigrate       ()
  ];

  if (__cloud_storage)
    data_import_tasks.splice ( 3,0,new TaskCloudImport() );

  this.makeSection ( grid,'Data Import',data_import_tasks,true );

  this.makeSection ( grid,'Structure Prediction',[
    new TaskStructurePrediction()
  ],true);

  this.makeSection ( grid,'Data Processing',[
    new TaskXia2        (),
    // new TaskXDS         (),
    new TaskXDSGUI      (),
    new TaskDUI         (),
    new TaskIMosflm     (),
    new TaskAimless     (),
//    new TaskChangeSpG (),
    new TaskChangeSpGHKL(),
    new TaskChangeReso  (),
    new TaskFreeRFlag   ()
  ],true);

  this.makeSection ( grid,'Asymmetric Unit and Structure Revision',[
    new TaskASUDef            (),
    new TaskChangeSpGASU      (),
    //new TaskASUDefStruct(),
    //new TaskASUMod      ()
    new TaskEditRevision      (),
    new TaskOptimiseASU       ()
    //new TaskEditRevisionASU   (),
    //new TaskEditRevisionStruct(),
    //new TaskEditRevisionSubstr()
  ],true);

  let secMR     = this.makeSection ( grid,'Molecular Replacement',[],false );
  let secMR_cnt = 0;

  this.makeSection ( secMR.grid,'Automated Molecular Replacement',[
    'High homology MR for ligand screening',
    new TaskDimpleMR  (),
    'No-sequence methods',
    new TaskSimbad    (),
    'Conventional Auto-MR',
    new TaskMorda     (),
    new TaskMrBump    (),
    new TaskBalbes    (),
    new TaskSliceNDice(),
    'Fragment-Based Molecular Replacement',
    new TaskArcimboldoLite(),
    new TaskArcimboldoBorges(),
    new TaskArcimboldoShredder(),
    // 'No-model methods',
    // new TaskAmple ()
    'Sequence reconstruction',
    new TaskFindMySequence (),
  ],true);
  secMR_cnt += this.task_cnt;

  this.makeSection ( secMR.grid,'MR Model Preparation',[
    new TaskMrParse        (),
    new TaskModelPrepXYZ   (),
    new TaskModelPrepMC    (),
    new TaskSlice          (),
    new TaskModelPrepAlgn  ()
  ],true );
  secMR_cnt += this.task_cnt;

  this.makeSection ( secMR.grid,'MR Ensemble Preparation',[
    'MR ensemble preparation',
    new TaskEnsembler      (),
    new TaskEnsemblePrepSeq(),
    new TaskEnsemblePrepXYZ(),
    new TaskEnsemblePrepMG ()
  ],true );
  secMR_cnt += this.task_cnt;

  this.makeSection ( secMR.grid,'MR Solvers',[
    new TaskPhaserMR       (),
    new TaskMolrep         ()
  ],true);
  secMR_cnt += this.task_cnt;

  // this.makeSection ( grid,'Molecular Replacement',[
  //   'MR model preparation',
  //   new TaskMrParse        (),
  //   new TaskModelPrepXYZ   (),
  //   new TaskModelPrepMC    (),
  //   new TaskSlice          (),
  //   new TaskModelPrepAlgn  (),
  //   'MR ensemble preparation',
  //   new TaskEnsembler      (),
  //   new TaskEnsemblePrepSeq(),
  //   new TaskEnsemblePrepXYZ(),
  //   new TaskEnsemblePrepMG (),
  //   'Fundamental MR',
  //   new TaskPhaserMR       (),
  //   new TaskMolrep         ()
  // ],true);

  // this.makeSection ( secMR.grid,'Fragment-Based Molecular Replacement',[
  //   new TaskArcimboldoLite(),
  //   new TaskArcimboldoBorges(),
  //   new TaskArcimboldoShredder()
  // ],true);
  // secMR_cnt += this.task_cnt;

  secMR.setTitle ( 'Molecular Replacement <b>(' + secMR_cnt + ')</b>' );

  this.makeSection ( grid,'Experimental Phasing',[
    'Automated EP',
    new TaskCrank2      (),
    new TaskShelxAuto   (),
    'Fundamental EP',
    new TaskShelxSubstr (),
    new TaskShelxCD     (),
    new TaskPhaserEP    ()
  ],true);

  this.makeSection ( grid,'Density Modification',[
    new TaskParrot       (),
    new TaskAcorn        (),
    new TaskShelxEMR     ()
  ],true);

  this.makeSection ( grid,'Automatic Model Building',[
    new TaskModelCraft   (),
    new TaskCCP4Build    (),
    new TaskArpWarp      (),
    new TaskAWNuce       (),
  ],true);

  this.makeSection ( grid,'Refinement',[
    new TaskRefmac       (),
    new TaskBuster       (),
    new TaskLorestr      (),
    new TaskDimple       (),
    new TaskCombStructure(),
    new TaskSheetbend    (),  
    new TaskPhaserRB     (),
    new TaskPDBREDO      (),
    new TaskPaiRef       (),
  ],true);

  this.makeSection ( grid,'Coot (Interactive Model Building)',[
    new TaskCootMB   (),
    new TaskCootCE   (),
    new TaskWebCoot  (),
    new TaskWebCootCE()
  ],true );

  this.makeSection ( grid,'Ligands',[
    new TaskJLigand   (),
    new TaskMakeLigand(),
    new TaskFitLigand (),
    new TaskFitWaters ()
  ],true);

  this.makeSection ( grid,'Validation, Analysis and Deposition',[
    new TaskZanuda    (),
    new TaskPrivateer (),
    new TaskPISA      (),
    new TaskSC        (),
    new TaskPDBVal    (),
    // new TaskDeposition(),
    new TaskContact   (),
    new TaskRotamer   (),
    new TaskAreaimol  (),
    new TaskRampage   ()
  ],true);

  let gemmi_task = null;
  if (__local_setup)
    gemmi_task = new TaskGemmi();

  this.makeSection ( grid,'Toolbox',[
    'Reflection data tools',
    new TaskAuspex    (),
    new TaskSRF       (),
    new TaskCrosSec   (),
    new TaskReindexHKL(),
    'Map tools',
    new TaskOmitMap   (),
    new TaskAnoMap    (),
    new TaskExportMaps(),
    'Coordinate data tools',
    new TaskXyzUtils  (),
    gemmi_task,
    new TaskTextEditor(),
    'Alignment and comparison tools',
    new TaskGesamt    (),
    new TaskLsqKab    (),
    new TaskSeqAlign  (),
    new TaskSymMatch  ()
  ],true);
  
  if (this.navail==1)
    this.section0.open();
  else if (section1)
    section1.open();

}


TaskListDialog.prototype.makeAtoZList = function ( grid )  {
let r = 0;  // grid row

  grid.setLabel ( '<b>Filter by keyword(s):&nbsp;</b>',0,0,1,1 )
      .setNoWrap().setWidth('20%');
  let kwd_inp = grid.setInputText ( '',0,1,1,1 ).setWidth('350px');
  grid.setLabel ( ' ',0,2,1,1 );
  grid.setHLine ( 2,1,0,1,3 );
  grid.setCellSize ( '10%','',0,0 );
  grid.setCellSize ( '30%','',0,1 );
  grid.setCellSize ( '60%','',0,2 );

  let panel = grid.setGrid ( '',2,0,1,3 );

  for (let i=0;i<this.listAtoZ.length;i++)  {
    for (let j=i+1;j<this.listAtoZ.length;j++)
      if (this.listAtoZ[j].title<this.listAtoZ[i].title)  {
        let task = this.listAtoZ[i];
        this.listAtoZ[i] = this.listAtoZ[j];
        this.listAtoZ[j] = task;
      }
  }

  for (let i=0;i<this.listAtoZ.length;i++)
    if (this.setTask(this.listAtoZ[i],panel,r,true,0))
      r++;

  // console.log ( ' >>>> Ntasks=' + this.listAtoZ.length );

  (function(self){
    kwd_inp.addOnInputListener ( function(){
      // console.log ( kwd_inp.getValue() );
      let keywords = kwd_inp.getValue().toLowerCase().replace(/,/g,' ').match(/[^ ]+/g);
      for (let i=0;i<self.listAtoZ.length;i++)
        panel.setRowVisible ( i,self.listAtoZ[i].checkKeywords(keywords) );
    });
  }(this))

  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.getSelectedTask = function()  {
  return this.selected_task;
}
