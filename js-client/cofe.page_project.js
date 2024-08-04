
/*
 *  ==========================================================================
 *
 *    03.08.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ==========================================================================
 *
 */

'use strict';

// ---------------------------------------------------------------------------
// projects page class

function ProjectPage ( sceneId,pspecs=null )  {

// The pspecs parameter works only when project is new and empty. It sets up project
// plan and starts first task from the plan's workflow. The object is created in
// cofe.dialog_add_project.js and has the following structure: 

// pspecs = {
//   id        : project_name,        // e.g. 'mdm2
//   title     : project_title,       // e.g. 'MDM2 Protein bound to Nutlin'
//   plan_code : project_plan_code,   // one from common.data_project.js:project_type
//   plan_task : task_to_run          // e.g. 'TaskWFlowAFMR'
// }

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGGED IN');
    return;
  }

  this.dock           = null;  // dock widget

  // ***** development code, dormant
  //this.replay_job_tree = null;  // for external references
  // *******************************

  this.title_lbl      = null;
  this.jobTree        = null;    // == this.job_tree, for internal references
  this.can_reload     = false;   // tree reload semaphore
  this.pending_act    = '';      // action pending because of reload
  // let replayJobTree  = null;  // == this.replay_job_tree, for internal references
  this.tree_div       = null;

  this.add_btn        = null;
  this.add_rem_btn    = null;
  this.thlight_btn    = null;
  //let this.insert_btn    = null;
  this.moveup_btn     = null;
  this.del_btn        = null;
  this.stack_btn      = null;
  this.open_btn       = null;
  this.stop_btn       = null;
  this.clone_btn      = null;
  this.refresh_btn    = null;
  this.help_btn       = null;
  this.roadmap_btn    = null;
  this.selmode_btn    = null;

  // ***** development code, dormant
  //let split_btn      = null;
  //let replay_btn     = null;
  //let replay_mode    = false;
  // *******************************

  let self            = this;  // for referencing class's properties

  // let setButtonState_timer = null;

  // -------------------------------------------------------------------------
  // Make page header

  this.makeHeader0 ( 3 );
  if (self.logout_btn)
    self.logout_btn.addOnClickListener ( function(){
      self.confirmLeaving ( function(do_leave){
        if (do_leave)  {
          self.jobTree.stopTaskLoop    ();
          self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
            logout ( self.element.id,0 );
          });
        }
      });
    });

  this.title_lbl = this.headerPanel.setLabel ( '',0,3,1,1 );
  this.title_lbl.setFont  ( 'times','150%',true,true )
                .setNoWrap()
                .setHorizontalAlignment ( 'left' );

  // this.headerPanel.setCellSize ( '99%','',0,2 );
  // this.headerPanel.setCellSize ( '0px','',0,12 );

  this.headerPanel.setVerticalAlignment ( 0,3,'middle' );

  this.makeDock();
  this.dock.loadDockData();

  // -------------------------------------------------------------------------
  // Make Main Menu

  // this.setMenuSpacing ( 10 );
  this.addMenuItem ( 'Back to Projects','list',function(){
    self.confirmLeaving ( function(do_leave){
      if (do_leave)  {
        if (self.jobTree && self.jobTree.projectData)
          self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
            makeProjectListPage ( sceneId );
          });
        else
          makeProjectListPage ( sceneId );
      }
    });
  });

  let accLbl = 'My Account';
  if (__local_user)
    accLbl = 'Settings';
  this.addMenuItem ( accLbl,'settings',function(){
    self.confirmLeaving ( function(do_leave){
      if (do_leave)  {
        if (self.jobTree && self.jobTree.projectData)
          self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
            makeAccountPage ( sceneId );
          });
        else
          makeAccountPage ( sceneId );
      }
    });
  });

  if (!__local_user)  {
    if (__user_role==role_code.admin)
      this.addMenuItem ( 'Admin Page',role_code.admin,function(){
        self.confirmLeaving ( function(do_leave){
          if (do_leave)  {
            if (self.jobTree && self.jobTree.projectData)
              self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
                makeAdminPage ( sceneId );
              });
            else
              makeAdminPage ( sceneId );
          }
        });
      });
  }

  this.addMenuSeparator();

  if (!__local_user)  {
    this.addMenuItem ( 'Work team & sharing','workteam',function(){
      if (self.jobTree)
        new WorkTeamDialog ( self.jobTree.projectData.desc,self.jobTree );
      else
        new MessageBox ( 'No project loaded','<h2>No Project Loaded</h2>' +
                          'Please call later','msg_error' );
    });
  }

  this.addMenuItem ( 'Project settings','project_settings',function(){
    if (self.jobTree && self.jobTree.projectData)
          new ProjectSettingsDialog ( self.jobTree,function(){
            self.jobTree.saveProjectData ( [],[],true, null );
          });
    else  new MessageBox ( 'No Project','No Project loaded', 'msg_warning' );
  });

  this.addGlobusLinkToMenu();

  this.addLogoutToMenu ( function(){
    self.confirmLeaving ( function(do_leave){
      if (do_leave)  {
        if (self.jobTree && self.jobTree.projectData)
          self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
            logout ( sceneId,0 );
          });
        else
          logout ( sceneId,0 );
      }
    });
  });

  // -------------------------------------------------------------------------

  // make central panel and the toolbar
  const toolbutton_size = '38px';
  const toolbar_width   = 58;
  this.toolbar_div = new Widget('div');
  this.toolbar_div.element.setAttribute ( 'class','toolbar-content' );
  let toolbar = new Grid('');
  this.toolbar_div.setWidth_px ( toolbar_width ).addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, 1,0,1,1 );

  this.panel = this.grid.setGrid ( '',1,1,1,1 );
  // center panel horizontally and make left- and right-most columns page margins
  // note that actual panel size is set in function resizeTreePanel() below
  this.grid.setCellSize ( '40px',''    ,1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'top' );
  this.grid.setCellSize ( '100%','100%',1,1,1,1 );
  this.grid.setCellSize ( '6px',''     ,1,2,1,1 );

  // make the toolbar
  const horz_line = '<div style="border-top: 1.5px dotted grey; width:' +
                    toolbutton_size + '; margin-top:6px;"></div>';
  let   cnt = 0;
  this.add_btn     = toolbar.setButton ( '',image_path('add'),cnt++,0,1,1 );
  // temporary switch off
  this.moveup_btn  = toolbar.setButton ( '',image_path('moveup')   ,cnt++,0,1,1 );
  this.clone_btn   = toolbar.setButton ( '',image_path('clonejob') ,cnt++,0,1,1 );
  this.del_btn     = toolbar.setButton ( '',image_path('remove')   ,cnt++,0,1,1 );
  this.stack_btn   = toolbar.setButton ( '',image_path('job_stack'),cnt++,0,1,1 );
  // toolbar.setLabel ( '<hr style="border:1px dotted;width:36px;text-align:left;"/>',cnt++,0,1,1 );
  // toolbar.setLabel ( '––––',cnt++,0,1,1 ).setFontColor('grey');
  toolbar.setLabel ( horz_line,cnt++,0,1,1 );
  this.add_rem_btn = toolbar.setButton ( '',image_path('task_remark'     ),cnt++,0,1,1 );
  this.thlight_btn = toolbar.setButton ( '',image_path('highlight_branch'),cnt++,0,1,1 );
  this.selmode_btn = toolbar.setButton ( '',image_path('selmode_single'  ),cnt++,0,1,1 );
  this.selmode_btn.multiple = false;  // custom field
  // toolbar.setLabel ( '<hr style="border:1px dotted;"/>',cnt++,0,1,1 );
  toolbar.setLabel ( horz_line,cnt++,0,1,1 );
  this.open_btn    = toolbar.setButton ( '',image_path('openjob'),cnt++,0,1,1 );
  this.stop_btn    = toolbar.setButton ( '',image_path('stopjob'),cnt++,0,1,1 );
  // toolbar.setLabel ( '<hr style="border:1px dotted;"/>',cnt++,0,1,1 );
  toolbar.setLabel ( horz_line,cnt++,0,1,1 );
  this.refresh_btn = toolbar.setButton ( '',image_path('refresh'),cnt++,0,1,1 );
  this.help_btn    = toolbar.setButton ( '',image_path('help')   ,cnt++,0,1,1 );
  this.roadmap_btn = toolbar.setButton ( '',image_path('roadmap'),cnt++,0,1,1 );

  // ***** development code, dormant
  //if ((__user_role==role_code.admin) || (__user_role==role_code.developer))  {
  //  toolbar.setLabel ( '<hr style="border:1px dotted;"/>' ,cnt++,0,1,1 );
  //  split_btn = toolbar.setButton ( '',image_path('split_page'),cnt++,0,1,1 );
  //}
  // *******************************

  this.add_btn.setSize(toolbutton_size,toolbutton_size).setTooltip('Add job').setDisabled(true);
  this.dock   .setDisabled ( true );
  if (this.moveup_btn)
    this.moveup_btn.setSize(toolbutton_size,toolbutton_size)
                   .setTooltip('Move job one position up the tree branch')
                   .setDisabled(true);
  this.del_btn    .setSize(toolbutton_size,toolbutton_size)
                  .setTooltip('Delete job').setDisabled(true);
  this.stack_btn  .setSize(toolbutton_size,toolbutton_size)
                  .setTooltip('Stack/Unstack jobs').setDisabled(true);
  this.open_btn   .setSize(toolbutton_size,toolbutton_size).setTooltip('Open job'  ).setDisabled(true);
  this.stop_btn   .setSize(toolbutton_size,toolbutton_size).setTooltip('Stop job'  ).setDisabled(true);
  this.clone_btn  .setSize(toolbutton_size,toolbutton_size).setTooltip('Clone job' ).setDisabled(true);
  this.add_rem_btn.setSize(toolbutton_size,toolbutton_size).setTooltip('Add remark').setDisabled(true);
  this.thlight_btn.setSize(toolbutton_size,toolbutton_size)
                  .setTooltip('Toggle branch highlight').setDisabled(true);
  this.selmode_btn.setSize(toolbutton_size,toolbutton_size)
                  .setTooltip('Single/multiple selection mode').setDisabled(true);
  this.refresh_btn.setSize(toolbutton_size,toolbutton_size).setTooltip('Refresh and push stalled jobs');
  this.help_btn   .setSize(toolbutton_size,toolbutton_size).setTooltip('Documentation');
  this.roadmap_btn.setSize(toolbutton_size,toolbutton_size).setTooltip(appName() + ' roadmap');

  for (let i=0;i<cnt;i++)
    toolbar.setCellSize ( '','12px',i,0 );

  // ***** development code, dormant
  //if (split_btn)  {
  //  split_btn.setSize(toolbutton_size,toolbutton_size).setTooltip('Show replay project');
  //  split_btn.setDisabled ( true );
  //}
  // *******************************

  this.help_btn.addOnClickListener ( function(){
    new HelpBox ( '',__user_guide_base_url + 'jscofe_project.html',null );
  });

  this.roadmap_btn.addOnClickListener ( function(){
    window.open ( 'html/roadmap.html' );
  });

  // (function(self){
    self.selmode_btn.addOnClickListener ( function(){
      self.setSelMode ( 0 );  // toggle
    });
    self.refresh_btn.addOnClickListener ( function(){
      self.setDisabled  ( true );
      self.can_reload  = true;  // force in order to avoid locking
      self.pending_act = '';    // drop pending actions
      self.wakeZombieJobs( function(){  // must go before reloadTree
        self.reloadTree   ( true,true,null );  // multiple = false?
      });
    });
  // }(this))

  //launchHelpBox ( '','./html/jscofe_project.html',doNotShowAgain,1000 );

  this.setJobTree ( this.makeJobTree() );

  // ***** development code, dormant
  //this.replay_div = null;
  //if (split_btn)  {
  //
  //  replay_btn = panel.setButton ( '',image_path('run_project'),0,1,1,1 );
  //  replay_btn.setSize(toolbutton_size,toolbutton_size).setTooltip('Replay');
  //  panel.setCellSize ( '' ,'42px',0,1 );
  //
  //  this.replay_div = new Widget ( 'div' );
  //  this.replay_div.element.setAttribute ( 'class','tree-content' );
  //  panel.setWidget ( this.replay_div, 0,2,1,1 );
  //  replay_btn.setVisible ( replay_mode );
  //  this.replay_div.setVisible ( replay_mode );
  //
  //  split_btn.addOnClickListener ( function(){
  //    replay_mode = !replay_mode;
  //    if (replayJobTree)  {
  //      replayJobTree.closeAllJobDialogs();
  //      replayJobTree.stopTaskLoop();
  //      replayJobTree.delete();
  //      replayJobTree = null;
  //    }
  //    setButtonState();
  //    self.onResize ( window.innerWidth,window.innerHeight );
  //    let icon = image_path('split_page');
  //    let ttip = 'Show replay project';
  //    if (replay_mode)  {
  //      icon = image_path('single_page');
  //      ttip = 'Hide replay project';
  //      replayJobTree = self.makeReplayJobTree();
  //      replayJobTree.readProjectData ( 'Replay Project',false,-1,
  //                                      function(){  // onTreeLoaded
  //                                        self.replay_job_tree = replayJobTree;
  //                                      },
  //                                      function(node){},  // onTreeContextMenu
  //                                      function(){},      // openJob,
  //                                      function(){}       // onTreeItemSelect
  //                                    );
  //      self.replay_div.addWidget ( replayJobTree );
  //    }
  //    split_btn.setButton('',icon).setSize(toolbutton_size,toolbutton_size).setTooltip(ttip);
  //  });
  //
  //  replay_btn.addOnClickListener ( function(){
  //    alert ( 'Feature is not functional' );
  //    /*
  //    if (replay_mode && self.replay_job_tree && jobTree)
  //      self.replay_job_tree.replayTree ( jobTree );
  //    */
  //  });
  //
  //}
  // *******************************


  this.makeLogoPanel ( 2,0,3 );

  for (let i=0;i<this.headerPanel.getNCols();i++)
    if (i==3)  this.headerPanel.setCellSize ( '90%' ,'',0,i );
         else  this.headerPanel.setCellSize ( 'auto','',0,i );

  // this.trimPageTitle();
  // this.onResize ( window.innerWidth,window.innerHeight );

  //  Read project data from server first time
  // takes project name from projectList.current
  self.jobTree.readProjectData ( 'Project',true,-1,
    function(){
      if (self.onTreeLoaded(false,self.jobTree,pspecs))  {
        // self.dock.loadDockData();
        // add button listeners
        self.add_btn.addOnClickListener ( function(){ self.addJob(); } );
        if (self.moveup_btn)
          self.moveup_btn.addOnClickListener ( function(){ self.moveJobUp();  } );
        self.del_btn    .addOnClickListener ( function(){ self.deleteJob  (); } );
        self.stack_btn  .addOnClickListener ( function(){ self.stackJobs  (); } );
        self.open_btn   .addOnClickListener ( function(){ self.openJob    (); } );
        self.stop_btn   .addOnClickListener ( function(){ self.stopJob    (); } );
        self.clone_btn  .addOnClickListener ( function(){ self.cloneJob   (); } );
        self.add_rem_btn.addOnClickListener ( function(){ self.addRemark  (); } );
        self.thlight_btn.addOnClickListener ( function(){ self.toggleBranchHighlight(); } );
        self.trimPageTitle();
        self.title_lbl  .setText ( self.jobTree.projectData.desc.title );
        self.can_reload  = true;
        self.pending_act = '';
        if (self.jobTree.hasRunningJobs(0))
          self.wakeZombieJobs(null);
      }
    },function(node){
      return self.onTreeContextMenu();
    },function(){
      self.openJob();
    },function(){
      self.onTreeItemSelect();
    });

}

// ProjectPage.prototype = Object.create ( BasePage.prototype );
// ProjectPage.prototype.constructor = ProjectPage;

registerClass ( 'ProjectPage',ProjectPage,BasePage.prototype );

// --------------------------------------------------------------------------

ProjectPage.prototype.confirmLeaving = function ( callback_func )  {
  if (getNofCommunicatingIFrames()+this.jobTree.getNofJobDialogs(true)>0)  {
    new QuestionBox ( 'Active task dialogs',
                      '<div style="width:360px;"><h2>Active task dialogs</h2>'  +
                      'Some task are open in this Project Page (' +
                      getNofCommunicatingIFrames() + ':' +
                      this.jobTree.getNofJobDialogs(true) +
                      '). Closing them '  +
                      'them automatically may cause losing last changes.<p>'    +
                      'It is recommended that you review and close open tasks ' +
                      'manually before leaving this page.<p>What you would '    +
                      'like to do?</div',
                      [
                        { name    : 'Close them',
                          onclick : function(){ 
                                      removeAllCommunicatingIFrames();
                                      callback_func(true); 
                                    }
                        },{
                          name    : 'I will review and close manually',
                          onclick : function(){ callback_func(false); }
                        }
                      ],'msg_confirm' );
  } else
    callback_func(true);
}

ProjectPage.prototype.destructor = function ( function_ready )  {
  if (this.jobTree)  {
    this.jobTree.stopTaskLoop();
    this.jobTree.closeAllJobDialogs();
    this.jobTree.delete();
  }
  // ***** development code, dormant
  //if (this.replay_job_tree)  {
  //  this.replay_job_tree.stopTaskLoop();
  //  this.replay_job_tree.closeAllJobDialogs();
  //}
  // *******************************
  BasePage.prototype.destructor.call ( this,function_ready );
}


ProjectPage.prototype.setJobTree = function ( jobTree )  {
  if (this.jobTree)  {
    this.jobTree.stopTaskLoop();
    this.jobTree.delete();
  }
  if (this.tree_div)
    this.tree_div.delete();
  this.tree_div = new Widget ( 'div' );
  this.tree_div.element.setAttribute ( 'class','tree-content' );
  this.jobTree  = jobTree;
  this.tree_div.addWidget ( this.jobTree );
  this.panel.setWidget ( this.tree_div, 0,0,1,1 );
  this.onResize ( window.innerWidth,window.innerHeight );
}


ProjectPage.prototype.setDisabled = function ( disabled_bool )  {
  if (this.add_btn)  {
    this.add_btn     .setDisabled ( disabled_bool );
    this.add_rem_btn .setDisabled ( disabled_bool );
    this.thlight_btn .setDisabled ( disabled_bool );
    //let this.insert_btn    = null;
    if (this.moveup_btn)
      this.moveup_btn.setDisabled ( disabled_bool );
    this.del_btn    .setDisabled ( disabled_bool );
    this.stack_btn  .setDisabled ( disabled_bool );
    this.open_btn   .setDisabled ( disabled_bool );
    this.stop_btn   .setDisabled ( disabled_bool );
    this.clone_btn  .setDisabled ( disabled_bool );
    // this.refresh_btn .setDisabled ( disabled_bool );  // active if reload fails
    // this.help_btn    .setDisabled ( disabled_bool );
    // this.roadmap_btn .setDisabled ( disabled_bool );
    this.selmode_btn.setDisabled ( disabled_bool );
  }
}

ProjectPage.prototype.start_action = function ( action_key )  {
  if (this.can_reload)  {
    this.can_reload = false;  // block concurrent reloads
    this.pending_act = '';    // clear pending actions
    this.jobTree.stopTaskLoop();
    return true;
  } else if (!this.pending_act)
    this.pending_act = action_key;
  else if (this.pending_act!=action_key)  {
    new MessageBox ( 'Communication delays',
                     'Communication delays, please wait a moment.<br>' +
                     'If this message persists, reload Project using<br>' +
                     '<i>Refresh</i> button in the vertical toolbar.',
                     'msg_system' );
    console.log ( ' >>>> action requested: ' + action_key + ', pending: ' + this.pending_act );
  }
  return false;
}

ProjectPage.prototype.end_action = function()  {
  this.jobTree.startTaskLoop();
  this.can_reload  = true;  // block concurrent reloads
  this.pending_act = '';    // clear pending actions
}

ProjectPage.prototype.addJob = function()  {
  // this.addJobRepeat();
  this.selectRemark();
  let self = this;
  if (this.start_action('add_job'))
    self.jobTree.addJob ( false,false,self,function(key){
      // self.del_btn.setDisabled ( false );
      self._set_del_button_state();
      self.end_action();
    });
}

ProjectPage.prototype.addJobRepeat = function()  {
  this.selectRemark();
  let self = this;
  if (this.start_action('add_job_repeat'))
    // (function(self){
      self.jobTree.addJob ( false,true,self,function(key){
        // self.del_btn.setDisabled ( false );
        self._set_del_button_state();
        self.end_action();
      });
    // }(this))
}

ProjectPage.prototype.insertJob = function()  {
  this.selectRemark();
  let self = this;
  if (this.start_action('insert_job'))
    // (function(self){
      self.jobTree.addJob ( true,false,self,function(key){
        // self.del_btn.setDisabled ( false );
        if (key!=1) // job was added or failed
          self._set_del_button_state();
        self.end_action();
        if (key==1)  // job was inserted
          self.reloadTree ( false,true,null );
      });
    // }(this))
}

ProjectPage.prototype.addRemark = function()  {
  if (this.start_action('add_remark'))  {
    let self = this;
    // (function(self){
      self.can_reload = true;
      self.jobTree.addTask ( new TaskRemark(),true,false,self,function(key){
        if (key!=1)  // remark was added or failed
          self._set_del_button_state();
        self.end_action();
        if (key==1)  // remark was inserted
          self.reloadTree ( false,true,null );
      });
    // }(this))
  }
}

/*
ProjectPage.prototype.addRevisionRemark = function ( callback_func )  {
  if (this.start_action('add_remark'))
    (function(self){
      self.can_reload = true;
      self.jobTree.addTask ( new TaskRemark(),true,false,self,function(key){
        if (key!=1)  // remark was added or failed
          self._set_del_button_state();
        self.end_action();
        if (key==1)  // remark was inserted
          self.reloadTree ( false,true,null );
      });
    }(this))
}
*/

ProjectPage.prototype.cloneJob = function() {
  if (this.start_action('clone_job'))  {
    let self = this;
    // (function(self){
      self.jobTree.cloneJob ( 'clone',self,function(){
        self._set_del_button_state();
        self.end_action();
      });
    // }(this))
  }
}

ProjectPage.prototype.copyJobToClipboard = function()  {
  this.jobTree.copyJobToClipboard();
}

ProjectPage.prototype.pasteJobFromClipboard = function() {
  let self = this;
  this.jobTree.pasteJobFromClipboard ( function(task){
    self.addTaskToSelected ( task,image_path(task.icon()),task.title );
  });
}

ProjectPage.prototype.deleteJob = function() {
  if (this.start_action('delete_job'))  {
    let self = this;
    // (function(self){
      self.jobTree.deleteJob ( false,function(was_deleted_bool){
        self.end_action();
        self._set_button_state();
        // self.setButtonState();
      });
    // }(this))
  }
}

ProjectPage.prototype.moveJobUp = function()  {
  if (this.start_action('move_job_up'))  {
    let self = this;
    // (function(self){
      self.jobTree.moveJobUp ( function(){
        self.end_action();
        self._set_button_state();
        // self.setButtonState();
      });
    // }(this))
  }
}

ProjectPage.prototype.toggleBranchHighlight = function()  {
  this.jobTree.toggleBranchHighlight();
}

ProjectPage.prototype.stackJobs = function() {
  if (this.start_action('stack_jobs'))  {
    let adata = this.jobTree.selectStackJobs();
    let save  = false;
    let self  = this;
    if (adata[0]==1)  {
      if (adata[1].length<=0)  {
        this.jobTree.makeStack1 ( adata[2],'',image_path('job_stack') );
        save = true;
      } else if (adata[2].length<=0)  {
        this.jobTree.makeStack1 ( adata[1],'',image_path('job_stack') );
        save = true;
      } else  {
        let qdlg = new Dialog('Stacking direction');
        let grid = new Grid('');
        qdlg.addWidget ( grid );
        grid.setLabel ( '<h2>Stacking direction</h2>' +
                        'You can choose to stack suitable jobs which are<br>' +
                        '(the selected job is included):<br>&nbsp;',0,0,1,3 );
        let above_cbx = grid.setCheckbox ( 'above the currently selected job',false,1,1,1,1 );
        let below_cbx = grid.setCheckbox ( 'below the currently selected job',true, 2,1,1,1 );
        grid.setLabel ( '&nbsp;<br>Make your choice and click <b><i>Stack</i></b> ' +
                        'button.',3,0,1,3 );
        // (function(self){
          qdlg._options.buttons = {
            "Stack"   : function() {
                          let nodelist = [];
                          if (above_cbx.getValue())
                            nodelist = adata[1];
                          if (below_cbx.getValue())  {
                            nodelist.shift();  // avoid duplicate nodes in the list
                            nodelist = nodelist.concat ( adata[2] );
                          }
                          if (nodelist.length<=0)  {
                            new MessageBox (
                                'Empty selection',
                                '<h2>Empty selection</h2>' +
                                'At least one checkbox must be checked<br>' +
                                'for acrhiving.', 'msg_warning'
                            );
                            self.end_action();
                          } else  {
                            $( this ).dialog( 'close' );
                            self.jobTree.makeStack1 ( nodelist,'',
                                                  image_path('job_stack') );
                            self.jobTree.saveProjectData ( [],[],true, function(tree,rdata){
                              self.setSelMode ( 1 );
                              self.end_action();
                              if (rdata.reload>0)  {
                                new MessageBox (
                                  'Project updating',
                                  '<h3>Project updating</h3>Project update in progress, please ' +
                                  'repeat archiving operation later.', 'msg_system'
                                );
                              } else  {
                                // self._set_button_state();
                                self.reloadTree ( false,true,rdata );
                              }
                            });
                            // self._set_button_state();
                          }
                        },
            "Cancel"  : function() {
                          $( this ).dialog( "close" );
                          self.end_action();
                        }
          };
        // }(this))
        qdlg.launch();
      }
    } else if (adata[0]==2)  {
      this.jobTree.unfoldFolder();
      save = true;
    }
    if (save)  {
      // (function(self){
        self.jobTree.saveProjectData ( [],[],true, function(tree,rdata){
          self.setSelMode ( 1 );
          self.end_action();
          if (rdata.reload>0)  {
            new MessageBox (
              'Project updating',
              '<h3>Project updating</h3>Project update in progress, please ' +
              'repeat archiving operation later.', 'msg_system'
            );
          } else  {
            // self._set_button_state();
            self.reloadTree ( false,true,rdata );
          }
        });
      // }(this))
    }
  }
}

ProjectPage.prototype.setButtonState = function() {
  if (this.start_action('set_button_state'))  {
    let self = this;
    // (function(self){
      self._set_button_state();
      self.end_action();
    // }(this))
  }
}

ProjectPage.prototype.openJob = function() {
  this.jobTree.openJob ( null,this );
}

ProjectPage.prototype.sendJobResults = function() {

  // dlg.requestServer   ( fe_reqtype.saveJobData,function(rdata){
  //   if (rdata.project_missing)  {
  //     new MessageBoxF ( 'Project not found',
  //         '<h3>Project "' + dlg.tree.projectData.desc.name +
  //            '" is not found on server</h3>' +
  //         'Project "' + dlg.tree.projectData.desc.name +
  //            '" was shared with you, please check<br>' +
  //         'whether it was deleted by project owner.',
  //         'Ok',function(){
  //             dlg.tree.emitSignal ( cofe_signals.makeProjectList,rdata );
  //         },false,'msg_error'
  //     );
  //   }
  // });

  __close_all_menus();

  let node   = this.jobTree.getSelectedNode();
  let crTask = this.jobTree.getTaskByNodeId ( node.id );

  if (!crTask)  {
    new MessageBox ( 'Task not found',
      '<div style="width:300px"><h2>Task not found</h2>' +
      '<i>This is a bug, please report</i></div>',
      'msg_error' );
      return;
  }

  let data  = {
    meta     : crTask,
    base_url : window.location.href + '/' + getJobFileURL ( crTask.id,'' )
  };

  localCommand ( nc_command.sendJobResults,data,'Send job results',
    function(response){
      if ((!response) || (response.status!=nc_retcode.ok))  {
        new MessageBox ( 'Communication failure',
          '<div style="width:380px"><h2>Communication failure</h2>' +
          '<i>Expected answer was not received; possible problems with ' +
          appName() + 'server.</i></div>',
          'msg_error' );
        return false;  // issue standard AJAX failure message
      }
      if (response.data.code==1)
        new MessageBox ( 'Send job results',
          '<div style="width:380px"><h2>No data to send</h2>' +
          '<i>No sendable data is found in job results.</i></div>',
          'msg_stop' );
      else
        new MessageBox ( 'Send job results',
          '<h2>Job results sent for exchange</h2>' +
          'Job results have been sent for exchange through directory<p><i>' +
          response.data.message + '</i><p>on your machine.',
          'msg_ok' );
      return true;
    }
  );

/*


  let self = this;

  let data  = {
    meta : crTask
  };
  // data.meta = this.task;
  // data.ancestors = [];
  // if (this.tree.projectData)  data.is_shared = this.tree.isShared();
  //                       else  data.is_shared = false;
  // for (let i=1;i<this.ancestors.length;i++)
  //   data.ancestors.push ( this.ancestors[i]._type );
  // if (!this.task.job_dialog_data.viewed)  {
  //   this.onDlgSignal_func ( this,job_dialog_reason.reset_node,null );
  //   this.task.job_dialog_data.viewed = true;
  //   this.job_edited = true;
  // }
  // data.update_tree = this.job_edited && data.is_shared;
  serverRequest ( fe_reqtype.sendJobResults,data,crTask.title,function(rdata){

  },null,null );
*/

}

ProjectPage.prototype.stopJob = function() {
  this.jobTree.stopJob ( '',false,null );  // 'false' means immediate termination
}

ProjectPage.prototype.setSelMode = function ( mode )  {
  // mode = 0:  toggle
  //        1:  single
  //        2:  multiple
  if ((mode==0) || ((mode==1) && this.jobTree.multiple) ||
                   ((mode==2) && (!this.jobTree.multiple)))  {
    this.jobTree.multiple = !this.jobTree.multiple;
    this.setDisabled ( true );
    this.reloadTree  ( false,true,null );
  }
}

ProjectPage.prototype.addToDock = function() {
  this.dock.addTaskClass ( this.jobTree.getSelectedTask() );
  this.dock.show();
}

ProjectPage.prototype._set_del_button_state = function() {
  let dsel = false;
  let node = this.jobTree.getSelectedNode();
  if (node)  {
    dsel = (node.parentId!=null) && (this.jobTree.permissions!=share_permissions.view_only);
    let task = null;
    if (dsel && this.jobTree.projectData.desc.archive)  {
      // let task = this.jobTree.getTaskByNodeId ( node.id );
      task = this.jobTree.getSelectedTask();
      if (task)
        dsel = !('archive_version' in task);
    }
    if (dsel && (this.jobTree.permissions==share_permissions.run_own))  {
      if (!task)
        task = this.jobTree.getSelectedTask();
      dsel = (task && ('submitter' in task) && task.submitter &&
              (task.submitter==__login_id));
    }
  }
  this.del_btn.setEnabled ( dsel );
}

ProjectPage.prototype._set_button_state = function() {
let dsel          = false;
let task          = this.jobTree.getSelectedTask();
let node          = this.jobTree.getSelectedNode();
let not_view_only = (!this.jobTree.view_only);
let child_tasks   = this.jobTree.getChildTasks ( node );
let has_remark    = false;

  if (child_tasks.length==1)
    has_remark = (child_tasks[0].state==job_code.remark);

  if (node)
    dsel = (node.parentId!=null) && (this.jobTree.permissions!=share_permissions.view_only);
  this.open_btn .setEnabled ( dsel );
  this.stack_btn.setEnabled ( (this.jobTree.selectStackJobs()[0]>0)  );

  if (task)  {

    let is_remark   = task.isRemark();
    let add_enabled = is_remark;
    if (is_remark)  {
      let tparent = this.jobTree.getNonRemarkParent ( task );
      if (tparent)
        add_enabled = (tparent.state==job_code.finished);
    }

    let can_add = (!__dormant) && not_view_only &&
                  ((task.state==job_code.finished) || (is_remark && add_enabled));

    let dsel1 = (this.jobTree.permissions==share_permissions.full) || 
                (('submitter' in task) && task.submitter && 
                 (task.submitter==__login_id));

    this.add_btn  .setEnabled ( can_add );
    this.del_btn  .setEnabled ( (!__dormant) && dsel && dsel1 && (!('archive_version' in task)) );
    this.dock     .setEnabled ( can_add );
    this.clone_btn.setEnabled ( (!__dormant) && dsel &&
                                task.canClone(node,this.jobTree) );
    if (this.moveup_btn)
      this.moveup_btn.setEnabled ( (!__dormant) && task.canMove(node,this.jobTree) );
    this.stop_btn .setEnabled ( dsel && ((task.state==job_code.running) ||
                                         (task.state==job_code.ending)) );
    this.add_rem_btn.setEnabled ( (!__dormant) && (!has_remark) && (!is_remark) &&
                                  not_view_only );
    if (is_remark)
          this.del_btn.setTooltip ( 'Delete remark' );
    else  this.del_btn.setTooltip ( 'Delete job' );

  } else  {  // root
    
    this.add_btn  .setEnabled ( (!__dormant) && not_view_only );
    this.del_btn  .setEnabled ( (!__dormant) && not_view_only && dsel );
    this.dock     .setEnabled ( (!__dormant) && not_view_only );
    this.clone_btn.setEnabled ( false );  // dsel ???
    if (this.moveup_btn)
      this.moveup_btn.setEnabled ( false );
    this.stop_btn    .setEnabled ( false );
    this.add_rem_btn .setEnabled ( (!__dormant) && (!has_remark) && not_view_only );

  }

  this.thlight_btn.setEnabled ( true );

  // ***** development code, dormant
  //if (replay_btn)  {
  //  replay_btn.setVisible ( replay_mode );
  //  self.replay_div.setVisible ( replay_mode );
  //}
  // *******************************

}

// ProjectPage.prototype.setButtonState = function() {
//   if (this.setButtonState_timer)
//     window.clearTimeout ( this.setButtonState_timer );
//   (function(self){
//     self.setButtonState_timer = window.setTimeout ( function(){
//       self.setButtonState_timer = null;
//       self._set_button_state();
//     },10 );
//   }(this))
// }

ProjectPage.prototype.share_project = function()  {
  if (this.jobTree)  {
    let self = this;
    // (function(self){
      shareProject ( self.jobTree.projectData.desc,function(desc){
        if (desc)  {
          self.jobTree.projectData.desc = desc;
          self.jobTree.saveProjectData ( [],[],true,function(tree,rdata){
            if (tree.isShared())
              tree.startTaskLoop();
          });
          // if (self.jobTree.isShared())
          //   self.jobTree.startTaskLoop();
        }
      });
    // }(this))
  } else
    new MessageBox ( 'No Project','No Project loaded', 'msg_warning' );
}


ProjectPage.prototype.onTreeContextMenu = function() {
  // The default set of all items
  let items  = {};
  let node   = this.jobTree.getSelectedNode();

  __close_all_menus();

  let self = this;

  // (function(self){

    let crTask = self.jobTree.task_map[node.id];

    if (!$(self.add_btn.element).button('option','disabled'))  {
      items.addJobItem = { // The "Add job" menu item
        label : "Add new job",
        icon  : image_path('add'),
        action: function(){ self.addJob(); }
      };
      if (node.parentId)
        items.addJobRepeatItem = { // The "Add job" menu item
          label : "Add job with last used parameters",
          icon  : image_path('add_repeat'),
          action: function(){ self.addJobRepeat(); }
        };
    }

    if (self.moveup_btn && (!$(self.moveup_btn.element).button('option','disabled')))  {
      items.moveJobUpItem = { // The "Add job" menu item
        label : "Move job up the tree",
        icon  : image_path('moveup'),
        action: function(){ self.moveJobUp(); }
      };
    }

    if (!$(self.clone_btn.element).button('option','disabled'))  {
      items.cloneJobItem = { // The "Clone job" menu item
        label : "Clone job",
        icon  : image_path('clonejob'),
        action: function(){ self.cloneJob(); }
      };
    }

    if (!$(self.del_btn.element).button('option','disabled'))  {
      items.delJobItem = { // The "Delete job" menu item
        label : 'Delete job with descendants',
        icon  : image_path('remove'),
        action: function(){ self.deleteJob(); }
      };
      if (crTask && (crTask.state==job_code.remark))
        items.delJobItem.label = 'Delete remark';
    }

    if (crTask)  {
      let clipboard_name = crTask.clipboard_name();
      if (clipboard_name)
        items.copyJobToClipboard = { // The "Clone job" menu item
          label : 'Copy ' + clipboard_name + ' to clipboard',
          icon  : image_path('copy'),
          action: function(){ self.copyJobToClipboard(); }
        };
    }

    if (__clipboard.task && crTask.isSuccessful())  {
      items.pasteJobFromClipboard = { // The "Clone job" menu item
        label : 'Paste ' + __clipboard.task.clipboard_name() + ' from clipboard',
        icon  : image_path('paste'),
        action: function(){ self.pasteJobFromClipboard(); }
      };
    }

    if (!$(self.open_btn.element).button('option','disabled'))  {
      if (__local_service && crTask && crTask.canSendJobResults())  {
        if ((__user_role==role_code.developer) || (__user_role==role_code.admin))  {
          items.senfJobDataItem = { // The "Open job" menu item
            label : "Send job results to exchange buffer",
            icon  : image_path('send_data'),
            action: function(){ self.sendJobResults(); }
          };
        }
      }
      if (crTask && (crTask.state==job_code.remark) && crTask.isWebLink())  {
        items.openJobItem = { // The "Open job" menu item
          label : "Open link",
          icon  : image_path('openjob'),
          action: function(){ self.openJob(); }
        };
        if ((__user_role==role_code.developer) || (__user_role==role_code.admin) ||
            (!crTask.isDocLink()))  {
          items.editLinkItem = { // The "Edit job" menu item
            label : "Edit link",
            icon  : image_path('editlink'),
            action: function(){
              crTask.doclink_type = '*' + crTask.doclink_type;
              self.openJob();
            }
          };
        }
      } else  {
        items.openJobItem = { // The "Open job" menu item
          label : "Open job dialog",
          icon  : image_path('openjob'),
          action: function(){ self.openJob(); }
        };
      }
    }

    if (!$(self.stop_btn.element).button('option','disabled'))  {
      items.stopJobItem = { // The "Stop job" menu item
        label : "Stop job running",
        icon  : image_path('stopjob'),
        action: function(){ self.stopJob(); }
      };
    }

    if (!$(self.add_rem_btn.element).button('option','disabled'))  {
      items.addRemarkItem = { // The "Add remark" menu item
        label : "Add remark",
        icon  : image_path('task_remark'),
        action: function(){ self.addRemark(); }
      };
    }

    items.addHighlightBranchItem = { // The "highlight" menu item
      label : "Toggle branch highlighting",
      icon  : image_path('highlight_branch'),
      action: function(){ self.toggleBranchHighlight(); }
    };

    let adata = self.jobTree.selectStackJobs();
    if (adata[0]==1)  {
      items.addStackItem = {
        label : "Stack jobs",
        icon  : image_path('job_stack'),
        action: function(){ self.stackJobs(); }
      };
    } else if (adata[0]==2)  {
      items.addUnstackItem = {
        label : "Unstack jobs",
        icon  : image_path('job_stack'),
        action: function(){ self.stackJobs(); }
      };
    }

    if (node.parentId && (!self.jobTree.view_only) && crTask 
                      && (crTask.state!=job_code.remark))  {
      let clipboard_name = crTask.clipboard_name();
      if (clipboard_name)
        items.addToDockItem = {
          label : 'Add ' + clipboard_name + ' to dock',
          icon  : image_path('dock_small'),
          action: function(){ self.addToDock(); }
        };
    }

  // }(this))

  return items;

}


ProjectPage.prototype.onTreeLoaded = function ( stayInProject,job_tree,pspecs )  {

  // these go first in all cases
  this.refresh_btn.setDisabled ( false );
  this.selmode_btn.setDisabled ( job_tree.view_only );

  if ((!job_tree) || (!job_tree.projectData))  {
    if (stayInProject)  {
      new MessageBox ( 'Connection problems',
          '<div style="width:400px;">' +
          '<h2>Intermittent Connection Problems</h2>' +
          'Try to reload the Project by pushing refresh button ' +
          'in the toolbar. If problem persists, check your ' +
          'Internet connection.', 'msg_system' );
    } else
      makeProjectListPage ( __current_page.sceneId );
    return false;
  }

  if (job_tree.multiple)
        this.selmode_btn.setIcon ( image_path('selmode_multi') );
  else  this.selmode_btn.setIcon ( image_path('selmode_single') );
  this.selmode_btn.multiple = job_tree.multiple;

  // ***** development code, dormant
  //if (split_btn)
  //  split_btn.setEnabled ( true );
  // *******************************

  // this.setButtonState();
  this._set_button_state();

  __current_project = job_tree.projectData.desc.name;
  // __current_folder  = findFolder ( job_tree.projectData.desc.folderPath );

  let self = this;

  job_tree.addSignalHandler ( cofe_signals.jobDialogOpened,function(data){
    self.setSelMode ( 1 );
  });
  job_tree.addSignalHandler ( cofe_signals.jobStarted,function(data){
    self.setButtonState();
  });
  job_tree.addSignalHandler ( cofe_signals.treeUpdated,function(data){
    self.updateUserRationDisplay ( job_tree.projectData.desc );
    self.setButtonState();
  });
  job_tree.addSignalHandler ( cofe_signals.reloadTree,function(rdata){
    if ('force_reload' in rdata)
      self.can_reload = true;
    self.reloadTree ( false,false,rdata );  // multiple = false?
  });
  job_tree.addSignalHandler ( cofe_signals.makeProjectList,function(rdata){
    makeProjectListPage ( __current_page.sceneId );
  });

  if ((job_tree.root_nodes.length==1) &&
      (job_tree.root_nodes[0].children.length<=0))  {
    __current_page = this;
    self.can_reload = true;   // tree reload semaphore
    // enter empty project: first task to run or choose
    if (pspecs && (pspecs.plan_code!=plan_type.no_plan))  {
      if (self.start_action('add_job'))  {
        self.can_reload = true;
        let task = makeNewInstance ( pspecs.plan_task );
        task.inputMode = input_mode.root;
        self.jobTree.addTask ( task,false,false,self,
          function(key,avail_key,dataSummary){
            self._set_del_button_state();
            self.end_action();
          });
      }
    } else  {
      self.addJob();
    }
    /*
    switch (job_tree.projectData.desc.startmode)  {
      case start_mode.auto    :
              self.addJob();
            break;
      case start_mode.migrate :
              if (self.start_action('add_job'))  {
                self.can_reload = true;
                self.jobTree.addTask ( new TaskMigrate(),false,false,self,
                  function(key){
                    self._set_del_button_state();
                    self.end_action();
                });
              }
            break;
      case start_mode.standard :
      case start_mode.expert   :  // legacy
      default :  self.addJob();
    }
    */
    // self.addJob();
  }
  
  this.updateUserRationDisplay ( job_tree.projectData.desc );

  return true;

}

ProjectPage.prototype.onTreeItemSelect = function()  {
  this.setButtonState();
}

ProjectPage.prototype.reloadTree = function ( blink,force,rdata )  {
  // blink==true will force page blinking, for purely aesthatic reasons

  if (this.jobTree && this.jobTree.parent && this.can_reload)  {

    this.can_reload = false;  // block concurrent reloads
    this.jobTree.stopTaskLoop();
    this.jobTree.checkTimeout = -1;  // prevents task loop from starting again
    let dlg_task_parameters = this.jobTree.getJobDialogTaskParameters();
    let scrollPos = this.jobTree.parent.getScrollPosition();
    let jobTree1  = this.makeJobTree();
    let timestamp = this.jobTree.projectData.desc.timestamp;
    if (blink)  {
      this.jobTree.closeAllJobDialogs();
      this.jobTree.hide();
      timestamp = -1; // force reload
    } else  {
      jobTree1.hide();
      if (force)
        timestamp = -1; // force reload
    }

    // (function(self,job_tree_1){

      let self = this;
      let job_tree_1 = jobTree1;

      job_tree_1.multiple = self.jobTree.multiple;  // needed for tree creation
      job_tree_1.readProjectData ( 'Project',false,timestamp,
        function(){
          if ('no_access' in job_tree_1)  {
            makeProjectListPage ( __current_page.sceneId );
            return;
          }
          if (job_tree_1.projectData)  {
            job_tree_1.multiple = self.jobTree.multiple;
            if (self.onTreeLoaded(true,job_tree_1,null))  {
              let selTasks = self.jobTree.getSelectedTasks();
              let dlg_map  = self.jobTree.dlg_map;
              self.jobTree.delete();
              self.setJobTree ( job_tree_1 );  // -> self.jobTree
              self.jobTree.selectTasks ( selTasks );
              self.jobTree.show ();
              self.jobTree.parent.setScrollPosition ( scrollPos );
              if (!blink)  {
                self.jobTree.relinkJobDialogs ( dlg_map,self );
              } else  {
                self.jobTree.openJobs ( dlg_task_parameters,self );
              }
              if (rdata)  {
                self.updateUserRationDisplay ( rdata );
                if ('completed_map' in rdata)
                  for (let key in rdata.completed_map)  {
                    self.jobTree.startChainTask ( rdata.completed_map[key],null );
                    update_project_metrics ( rdata.completed_map[key],
                                             self.jobTree.projectData.desc.metrics );
                  }
              }
            } else  {
              job_tree_1.delete();
              self.jobTree.show();
              self.jobTree.openJobs ( dlg_task_parameters,self );
            }
          } else  {
            job_tree_1.delete();
            self.jobTree.show();
            self.jobTree.openJobs ( dlg_task_parameters,self );
          }
          self.jobTree.checkTimeout = null;  // allows task loop to start
          self.can_reload = true;  // release reloads
          switch (self.pending_act)  {
            case 'add_job'          : self.addJob      ();  break;
            case 'add_job_repeat'   : self.addJobRepeat();  break;
            case 'insert_job'       : self.insertJob   ();  break;
            case 'add_remark'       : self.addRemark   ();  break;
            case 'clone_job'        : self.cloneJob    ();  break;
            case 'delete_job'       : self.deleteJob   ();  break;
            case 'move_job_up'      : self.moveJobUp   ();  break;
            case 'stack_jobs'       : self.stackJobs   ();  break;
            case 'set_button_state' :
            default                 : self.jobTree.startTaskLoop();
          }
          self._set_button_state();
        },function(node){
          return self.onTreeContextMenu();
        },function(){
          self.openJob();
        },function(){
          self.onTreeItemSelect();
        });
    // }(this,jobTree1))
  }
}

ProjectPage.prototype.wakeZombieJobs = function ( callback_func )  {
  if (this.jobTree.projectData)  {
    let request_data = {};
    request_data.project = this.jobTree.projectData.desc.name;
    serverRequest ( fe_reqtype.wakeZombieJobs,request_data,'Project Page',
      function(data){},
      function(key,data){
        if (__local_service)  {
          localCommand  ( nc_command.wakeZombieJobs,{job_tokens:['*']},
                          'Wake Zombi Jobs',function(response){
            if (callback_func)
              callback_func();
            return true; 
          });
        } else if (callback_func)
          callback_func();
      },
      function(){});
  } else if (callback_func)
    callback_func();
}


ProjectPage.prototype.makeJobTree = function()  {
// set the job tree
  let jobTree = new JobTree ();
  jobTree.element.style.paddingTop    = '0px';
  jobTree.element.style.paddingBottom = '25px';
  jobTree.element.style.paddingRight  = '6px';
  jobTree.element.style.paddingLeft   = '0px';
  // this.job_tree = jobTree;  // for external references
  let self = this;
  // (function(self){
    jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
      //alert ( 'ration updated ' + JSON.stringify(data));
      self.updateUserRationDisplay ( data );
      //self.getUserRation();
    });
  // }(this))
  return jobTree;
}


// ***** development code, dormant
// ProjectPage.prototype.makeReplayJobTree = function()  {
// // set the job tree
//   let jobTree = new JobTree();
//   jobTree.setReplayMode();
//   jobTree.element.style.paddingTop    = '0px';
//   jobTree.element.style.paddingBottom = '25px';
//   jobTree.element.style.paddingRight  = '6px';
//   // ***** development code, dormant
//   //this.replay_job_tree = null;  // for internal and external references,
//                                   // lock before tree is loaded
//   // *******************************
//   (function(self){
//     jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
//       self.updateUserRationDisplay ( data );
//     });
//   }(this))
//   return jobTree;
// }
// *******************************


ProjectPage.prototype.selectRemark = function()  {
  let node        = this.jobTree.getSelectedNode();
  let child_nodes = this.jobTree.getChildNodes ( node );
  if (child_nodes.length==1)  {
    let task = this.jobTree.getTaskByNodeId ( child_nodes[0].id );
    if (task)  {
      if (task.state==job_code.remark)  {
        if (this.jobTree.calcSelectedNodeIds().length<=1)
              this.jobTree.selectSingle   ( child_nodes[0] );
        else  this.jobTree.selectMultiple ( child_nodes[0] );
      }
    }
  }
}


ProjectPage.prototype.addTaskToSelected = function ( task,icon_uri,title )  {

  if (task.state==job_code.retired)  {

    new MessageBox ( 'Task retired',
        '<div style="min-width:400px"><h2>Task retired</h2>Task<p>' +
        '<div style="text-align:center"><img style="vertical-align:middle" src="' +
        icon_uri +
        '" width="26" height="24"><span style="vertical-align:middle">&nbsp;&nbsp;<b>' +
        title + '</b></span></div><p>has been retired and cannot be added ' +
        'to the Project. You may remove this task from the dock.</div>',
        'msg_warning' );

  } else  {

    this.selectRemark();
    if (this.start_action('add_job'))  {
      this.can_reload = true;
      let self = this;
      this.jobTree.addTask ( task,false,false,this,
        function(key,avail_key,dataSummary){
          // if (key!=1)  // task was added or failed
          self._set_del_button_state();
          self.end_action();
          if (avail_key[0]!='ok')  {
            new MessageBox ( 'Task is not available',avail_key[2],'msg_stop' );
          } else if (dataSummary.status<=0)  {
            new TaskDataDialog ( dataSummary,task,avail_key );
          }
        });
    }

  }

}


ProjectPage.prototype.makeDock = function()  {

  let dock_btn = this.toolPanel
                     .setImageButton ( image_path('dock'),'20px','20px',0,0,1,1 )
                     .setTooltip1    ( 'Toggle task dock','show',true,1000 )
                     .setFontSize    ( '90%' )
                     .setVerticalAlignment ( 'middle' );

  let self = this;

  this.dock = new Dock ( this,

    function(taskType,title,icon_uri){  // left click: add task to tree
      if (!$(self.add_btn.element).button('option','disabled'))  {
        let task = makeNewInstance ( taskType );
        self.addTaskToSelected ( task,icon_uri,title );
      }
    },

    function(taskType,title,icon_uri){  // right click: delete icon
      new QuestionBox ( 'Remove dock item',
        '<div style="min-width:400px"><h2>Remove dock item</h2>Remove<p>' +
        '<div style="text-align:center"><img style="vertical-align:middle" src="' +
        icon_uri +
        '" width="26" height="24"><span style="vertical-align:middle">&nbsp;&nbsp;<b>' +
        title + '</b></span></div><p>from the dock?</div>',[
        { name    : 'Yes, remove',
          onclick : function(){
                      self.dock.removeTask ( taskType );
                    }
        },{
          name    : 'Cancel',
          onclick : function(){}
        }],'msg_confirm' );

      return 0;
    },

    function(){
      //return { task:'TaskRefmac', title:'Refmac', icon:'task_refmac'};
      return null;  // do not add task
    }

  );

  dock_btn.addOnClickListener ( function(){
    self.dock.toggle();
  });

}


ProjectPage.prototype.trimPageTitle = function()  {
  let wt = window.innerWidth - 60;
  for (let i=0;i<this.headerPanel.getNCols();i++)
    if (i!=3)
      wt -= this.headerPanel.getCellSize(0,i)[0];
  wt = Math.max(100,wt);
  $(this.title_lbl.element).css({
    'width'         : wt + 'px',
    'overflow'      : 'hidden',
    'text-overflow' : 'ellipsis' 
  });
}

ProjectPage.prototype.onResize = function ( width,height )  {
  let h = (height - 88) + 'px';    // THESE NUMBERS DEFINE WIDTH AND HEIGHT
  let w = (width  - 80) + 'px';    // OF THE JOB TREE 
  this.toolbar_div.element.style.height = h;
  this.tree_div.element.style.height    = h;
  // ***** development code, dormant
  //if (this.replay_div)  {
  //  if (this.replay_div.isVisible())  {
  //    let hw = (round(width/2,0)-75) + 'px';
  //    this.tree_div  .element.style.width = hw;
  //    this.replay_div.element.style.width = hw;
  //  } else
  //    this.tree_div.element.style.width = w;
  //} else
  //  this.tree_div.element.style.width = w;
  // *******************************
  this.tree_div.element.style.width = w;
  this.trimPageTitle();
}

ProjectPage.prototype.getJobTree = function()  {
  return this.jobTree;
}

ProjectPage.prototype.getProjectName = function()  {
  if (this.jobTree && this.jobTree.projectData)
    return this.jobTree.projectData.desc.name;
  return '';
}

ProjectPage.prototype.reloadProject = function()  {
  this.refresh_btn.click();
}

ProjectPage.prototype.cloneJobWithSuggestedParameters = function ( jobId ) {
  let self = this;
  this.jobTree.cloneJob ( 'copy_suggested',self,function(){
    // self.del_btn.setDisabled ( false );
    self._set_del_button_state();
    if (jobId in self.jobTree.dlg_map)
      self.jobTree.dlg_map[jobId].close();
  });
}

ProjectPage.prototype.runHotButtonJob = function ( jobId,task_name,options )  {
  if (jobId in this.jobTree.dlg_map)
    this.jobTree.dlg_map[jobId].runHotButtonJob ( task_name,options );
  else
    new MessageBox ( 
        'Error',
        '<div style="width:300px"><h2>Error</h2>' +
        '<i>Cannot find dialog to run the task from. ' +
        'This is a bug, please report</div>',
        'msg_error' 
    );
}


function rvapi_canRunJob()  {
let canrun = false;
  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.', 'msg_error' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.',
                     'msg_error' );
  } else
    canrun = true;
  return canrun;
}

function rvapi_cloneJob ( jobId )  {
  // if (!__current_page)  {
  //   new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
  //                    'please contact ' + appName() + ' developer.', 'msg_error' );
  // } else if (__current_page._type!='ProjectPage')  {
  //   new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
  //                    'This is a bug, please contact ' + appName() + ' developer.',
  //                    'msg_error' );
  // } else  {
  //   __current_page.cloneJobWithSuggestedParameters ( jobId );
  // }
  if (rvapi_canRunJob())
    __current_page.cloneJobWithSuggestedParameters ( jobId );
}

function rvapi_runHotButtonJob ( jobId,task_name,options )  {
  if (rvapi_canRunJob())
    __current_page.runHotButtonJob ( jobId,task_name,options );
}


// =========================================================================

function makeProjectPage ( sceneId,pspecs=null )  {
  makePage ( function(){ new ProjectPage(sceneId,pspecs); } );
  setHistoryState ( 'ProjectPage' );
}
