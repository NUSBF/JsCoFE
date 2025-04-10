
/*
 *  =================================================================
 *
 *    01.04.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2025
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

  this.dlg_width  = window.innerWidth;
  this.dlg_width  = Math.min ( Math.max(840,4*this.dlg_width/9),6*this.dlg_width/8 );
  this.dlg_height = 6*window.innerHeight/8;

  this.listAtoZ   = [];
  this.tabs_basic = null;
  this.tabs_full  = null;
  let help_link   = __user_guide_base_url + 'jscofe_tasklist.html';
  this.makeLayout ( 10 );

  let self = this;

  $(self.element).dialog({

    resizable : true,
    height    : self.dlg_height,
    width     : self.dlg_width,
    maxHeight : $(window).height()-20,
    modal     : true,

    beforeClose : function(event, ui) {
                  self.saveDialogState();
                  self.onSelect_func ( self.selected_task );
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
    let height = self.element.innerHeight - 16;
    if (self.tabs_full)  {
      $(self.tabs_full.element).height ( height );
      self.tabs_full.refresh();
    }
  });

  $(this.element).css ( 'width:100%' );

  if (this.tabs_full)  {
    $(this.tabs_full.element).height ( this.element.innerHeight-16 );
    this.tabs_full.refresh();
  }

}

TaskListDialog.prototype = Object.create ( Widget.prototype );
TaskListDialog.prototype.constructor = TaskListDialog;


// ===========================================================================

TaskListDialog.prototype.setDockMenu = function ( task_obj,grid,row,setall,idlen )  {
let self    = this;
let in_dock = __current_page.dock.inDock ( task_obj );
let icon    = 'dock_';
let iwidth  = '0px';
let remote  = 0;

  if (__remoteJobServer.status=='FE')  {
    iwidth = '14px';
    icon  += 'remote_';
    if (!task_obj.canRunRemotely())            remote = 0;
    else if (//(task_obj._type in __remote_tasks) &&
             (__remote_environ_server.length>0) && 
              __remote_tasks[task_obj._type])  remote = 2;
                                        else   remote = 1;
    icon += remote
  }
  if (in_dock)  icon += '2';
          else  icon += '1';

  let dockMenu = new Menu ( '',image_path(icon),false,8,iwidth );

  if (in_dock)  {
    dockMenu.addItem('Remove task from dock',image_path('remove'))
            .addOnClickListener(function(){
      let rect = dockMenu.button.getBoundingClientRect();
      __current_page.dock.removeTask ( task_obj._type );
      __current_page.dock.show();
      // dockMenu.setMenuIcon ( image_path(icon.slice(0,-1)+'1') );
      self.saveDialogState();
      self.setDockMenu ( task_obj,grid,row,setall,idlen );
      self.makeLists   ( 1 );
      showFlashMessage ( 'Removed from Task Dock',rect,self );
    });
  } else  {
    dockMenu.addItem('Add task to dock',image_path('add'))
            .addOnClickListener(function(){
      let rect = dockMenu.button.getBoundingClientRect();
      __current_page.dock.addTaskClass ( task_obj );
      __current_page.dock.show();
      // dockMenu.setMenuIcon ( image_path(icon.slice(0,-1)+'2') );
      self.saveDialogState();
      self.setDockMenu ( task_obj,grid,row,setall,idlen );
      self.makeLists   ( 1 );
      showFlashMessage ( 'Task can be used from Task Dock now',rect,self );
    });
  }

  if (remote==1)  {
    dockMenu.addItem('Run task remotely',image_path('remote_on'))
            .addOnClickListener(function(){
      let msg = getRemoteFEStatusMessage();
      if (!msg)  {
        let rect = dockMenu.button.getBoundingClientRect();
        self.saveDialogState();
        __remote_tasks[task_obj._type] = true;
        if (self.tabs_full.getActiveTabNo()==0)
          self.makeLists ( 0 );
        else  {
          // dockMenu.setMenuIcon ( image_path(icon.slice(0,-2)+'2'+icon.slice(-1)) );
          // self.setDockMenu ( task_obj,grid,row,setall,idlen );
          self.setTask     ( task_obj,grid,row,setall,idlen );
          self.makeLists   ( 1 );
        }
        saveUserData     ( 'Remote tasks list' );
        showFlashMessage ( 'Task will run on server',rect,self );
      } else
        new MessageBox ( 'Cannot run remote jobs',
            '<div style="width:420px;"><h2>Cannot run jobs remotely</h2>' +
            msg + '</div>','msg_stop' );
    });
  } else if (remote==2)  {
    dockMenu.addItem('Run task locally',image_path('remote_off'))
            .addOnClickListener(function(){
      let rect = dockMenu.button.getBoundingClientRect();
      self.saveDialogState();
      if (task_obj._type in __remote_tasks)
        delete __remote_tasks[task_obj._type];
      if (self.tabs_full.getActiveTabNo()==0)
        self.makeLists ( 0 );
      else  {
        // dockMenu.setMenuIcon ( image_path(icon.slice(0,-2)+'1'+icon.slice(-1)) );
        // self.setDockMenu ( task_obj,grid,row,setall,idlen );
        self.setTask     ( task_obj,grid,row,setall,idlen );
        self.makeLists   ( 1 );
      }
      saveUserData     ( 'Remote tasks list' );
      showFlashMessage ( 'Task will run on your computer',rect,self );
    });
  }

  dockMenu.addItem('Task reference',image_path('reference'))
          .addOnClickListener(function(){
    new HelpBox ( '',task_obj.getHelpURL(),null );
  });

  grid.setWidget ( dockMenu,row,0,1,1 );

}

// function __show_task_help ( help_url )  {
//   new HelpBox ( '',help_url,null );
// }

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

  this.setDockMenu ( task_obj,grid,row,setall,idlen );

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

  // title += '&nbsp;&nbsp;<img src="' + image_path('reference_inline') + 
  //          '" onclick="javascript:__show_task_help(\'' +
  //          task_obj.getHelpURL() + '\');" height="12px" ' +
  //          'style="position:relative;top:1px;cursor:pointer;"/>';

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
  // grid.setCursor            ( 'pointer' );

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

  // (function(dlg,ibtn){
  let dlg = this;

  function taskClicked() {
    if (btn.dataSummary.status>0)  {
      dlg.selected_task = task_obj;
      $(dlg.element).dialog ( 'close' );
    // } else if (avail_key[0]=='private')  {
    //   new MessageBox ( 'Confidentiality conflict',avail_key[2],'msg_stop' );
    } else if (avail_key[0]!='ok')  {
      new MessageBox ( 'Task is not available',avail_key[2],'msg_stop' );
    } else  {
      // insufficient data
      new TaskDataDialog ( btn.dataSummary,task_obj,avail_key );
    }
  }

  btn.addOnClickListener ( taskClicked );

  // ibtn.addOnRightClickListener ( function(){ alert ('right click'); });

  lbl.addOnClickListener ( taskClicked );
  lbl.setCursor          ( 'pointer'   );

  // let contextMenu = new Menu('',image_path('dock'),true);
  // grid.setWidget   ( contextMenu,row,1,1,1 )

  // let contextMenu = new ContextMenu ( ibtn,null );
  // contextMenu.setZIndex ( 600 );
  // contextMenu.addItem('Add task to dock',image_path('add'))
  //            .addOnClickListener(function(){
  //             console.log ( 'add' );
  //   // alert('add')
  // });

  // }(this,btn));

  return btn;

}

TaskListDialog.prototype.makeLists = function ( key )  {

  let activeTabNo = this.tabs_full.getActiveTabNo();

  if ((!key) || (this.tabs_full.getTabNo(this.tabf_suggested)!=activeTabNo))
    this.makeSuggestedList ( this.tabf_suggested.grid );

  if ((!key) || (this.tabs_full.getTabNo(this.tabf_fulllist)!=activeTabNo))
    this.makeFullList      ( this.tabf_fulllist.grid  );

  if ((!key) || (this.tabs_full.getTabNo(this.tabf_workflows)!=activeTabNo))
    this.makeWorkflowsList ( this.tabf_workflows.grid );

  if ((!key) || (this.tabs_full.getTabNo(this.tabf_AtoZ)!=activeTabNo))
    this.makeAtoZList      ( this.tabf_AtoZ.grid      );

}


TaskListDialog.prototype.makeLayout = function ( key )  {

  this.tabs_full = new Tabs();
  this.addWidget ( this.tabs_full );

  let active_tab = 'Suggested tasks';
  if (__user_settings.tasklist_state && 
      ('active_tab' in __task_dialog_state.tabs.full))
    active_tab = __task_dialog_state.tabs.full.active_tab;

  this.tabf_suggested = this.tabs_full.addTab ( 'Suggested tasks',
                                                      'Suggested tasks'==active_tab );
  this.tabf_fulllist  = this.tabs_full.addTab ( 'All tasks','All tasks'==active_tab );
  this.tabf_workflows = this.tabs_full.addTab ( 'Workflows','Workflows'==active_tab );
  this.tabf_AtoZ      = this.tabs_full.addTab ( 'A-Z'      ,'A-Z'      ==active_tab );
  this._setting_wf    = false;
  this.makeLists ( 0 );

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

    window.setTimeout ( function(){
      if (self.tabs_full)
        self.scrollActiveTab ( self.tabs_full,__task_dialog_state.tabs.full );
    },1);

  }

}


TaskListDialog.prototype.scrollActiveTab = function ( tabs,tabsData )  {
let tabName = tabs.getActiveTab().name;
  if (tabName in tabsData)
    tabs.tabs[tabName].setScrollPosition ( tabsData[tabName] );
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

  grid.clear();

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

  let task_list = [
    "Workflows for starting a Project",
    new TaskWFlowAMR  (),
    new TaskWFlowAFMR (),
    new TaskWFlowSMR  (),
    new TaskWFlowDPLMR(),
    new TaskWFlowAEP  (),
    "Workflows for using within a Project",
    new TaskWFlowDPL  (),
    new TaskWFlowREL  ()
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

  grid.clear();

  for (let i=0;i<counts.length;i++)  {
    for (let j=i+1;j<counts.length;j++)
      if (counts[j]>counts[i])  {
        let t = tasks [i];  tasks [i] = tasks [j];  tasks [j] = t;
        let c = counts[i];  counts[i] = counts[j];  counts[j] = c;
      }
    ctotal += counts[i];
  }

  let cthresh = ctotal*__suggested_task_prob;

  for (let i=0;i<tasks.length;i++)
    if ((i<__suggested_task_nmin) || (ctotal>=cthresh))  {
      //console.log ( 'task=' + tasks[i] + ',  ctotal=' + ctotal );
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

  grid.clear();

  let section1 = this.section0;

  if (__user_role==role_code.developer)  {

    this.makeSection ( grid,'Documentation tools',[
      new TaskDocDev()
    ],false);

    this.makeSection ( grid,'Tasks in Development',[
      // new TaskCootUtils    (),
      // new TaskWFlowAFMR    (),
      // new TaskRabdam       (),
      // new TaskXDS         (),
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
    new TaskMigrate       (),
    new TaskImportSerial(),
    'Upload to Cloud Storage',
    new TaskFetchData     (),
    new TaskPushToCloud   ()
  ];

  if (__cloud_storage)
    data_import_tasks.splice ( 3,0,new TaskCloudImport() );

  this.makeSection ( grid,'Data Import',data_import_tasks,true );

  this.makeSection ( grid,'Structure Prediction',[
    new TaskStructurePrediction()
  ],true);

  this.makeSection ( grid,'Data Processing',[
    new TaskXia2        (),
    new TaskXDS         (),
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
    new TaskRampage   (),
    new TaskCheckMySequence ()
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

  grid.clear();

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
