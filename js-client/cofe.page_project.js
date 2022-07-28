
/*
 *  ==========================================================================
 *
 *    28.07.22   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  ==========================================================================
 *
 */

'use strict';

// ---------------------------------------------------------------------------
// projects page class

function ProjectPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGGED IN');
    return;
  }

  this.dock          = null;  // dock widget

  // ***** development code, dormant
  //this.replay_job_tree = null;  // for external references
  // *******************************

  var title_lbl       = null;
  this.jobTree        = null;    // == this.job_tree, for internal references
  this.can_reload     = false;   // tree reload semaphore
  this.pending_act    = '';      // action pending because of reload
  // var replayJobTree  = null;  // == this.replay_job_tree, for internal references
  this.tree_div       = null;

  this.add_btn        = null;
  this.add_rem_btn    = null;
  this.thlight_btn    = null;
  //var this.insert_btn    = null;
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
  //var split_btn      = null;
  //var replay_btn     = null;
  //var replay_mode    = false;
  // *******************************

  // var self           = this;  // for referencing class's properties

  // var setButtonState_timer = null;

  // -------------------------------------------------------------------------

  this.makeHeader0 ( 3 );
  (function(self){
    self.logout_btn.addOnClickListener ( function(){
      self.jobTree.stopTaskLoop    ();
      self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
        logout ( self.element.id,0 );
      });
    });
  }(this));

  title_lbl = this.headerPanel.setLabel ( '',0,2,1,1 );
  title_lbl.setFont  ( 'times','150%',true,true )
           .setNoWrap()
           .setHorizontalAlignment ( 'left' );
  this.headerPanel.setVerticalAlignment ( 0,2,'middle' );

  this.makeDock();

  // Make Main Menu

  (function(self){

    self.addMenuItem ( 'Project folder','list',function(){
      if (self.jobTree && self.jobTree.projectData)
        self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
          makeProjectListPage ( sceneId );
        });
      else
        makeProjectListPage ( sceneId );
    });

    if (!__local_user)  {
      self.addMenuItem ( 'My Account','settings',function(){
        if (self.jobTree && self.jobTree.projectData)
          self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
            makeAccountPage ( sceneId );
          });
        else
          makeAccountPage ( sceneId );
      });
      if (__user_role==role_code.admin)
        self.addMenuItem ( 'Admin Page',role_code.admin,function(){
          if (self.jobTree && self.jobTree.projectData)
            self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
              makeAdminPage ( sceneId );
            });
          else
            makeAdminPage ( sceneId );
        });
    }

    self.addMenuSeparator();

    self.addMenuItem ( 'Project settings','project_settings',function(){
      if (self.jobTree && self.jobTree.projectData)
            new ProjectSettingsDialog ( self.jobTree,function(){
              self.jobTree.saveProjectData ( [],[],true, null );
            });
      else  new MessageBox ( 'No Project','No Project loaded', 'msg_warning' );
    });

    self.addMenuItem ( 'Share Project','share',function(){
      self.share_project();
    });

    self.addLogoutToMenu ( function(){
      if (self.jobTree && self.jobTree.projectData)
        self.jobTree.saveProjectData ( [],[],false, function(tree,rdata){
          logout ( sceneId,0 );
        });
      else
        logout ( sceneId,0 );
    });

  }(this))

  // make central panel and the toolbar
  this.toolbar_div = new Widget('div');
  this.toolbar_div.element.setAttribute ( 'class','toolbox-content' );
  var toolbar = new Grid('');
  this.toolbar_div.addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, 1,0,1,1 );

  this.panel = this.grid.setGrid ( '',1,1,1,1 );
  // center panel horizontally and make left- and right-most columns page margins
  // note that actual panel size is set in function resizeTreePanel() below
  this.grid.setCellSize ( '40px',''    ,1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'top' );
  this.grid.setCellSize ( '','100%' ,1,1,1,1 );
  this.grid.setCellSize ( '40px',''    ,1,2,1,1 );

  // make the toolbar
  var cnt = 0;
  this.add_btn     = toolbar.setButton ( '',image_path('add')     ,cnt++,0,1,1 );
  // temporary switch off
  //this.moveup_btn   = toolbar.setButton ( '',image_path('moveup')   ,cnt++,0,1,1 );
  this.clone_btn   = toolbar.setButton ( '',image_path('clonejob'),cnt++,0,1,1 );
  this.del_btn     = toolbar.setButton ( '',image_path('remove')  ,cnt++,0,1,1 );
  this.stack_btn   = toolbar.setButton ( '',image_path('job_stack')   ,cnt++,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>',cnt++,0,1,1 );
  this.add_rem_btn = toolbar.setButton ( '',image_path('task_remark'     ),cnt++,0,1,1 );
  this.thlight_btn = toolbar.setButton ( '',image_path('highlight_branch'),cnt++,0,1,1 );
  this.selmode_btn = toolbar.setButton ( '',image_path('selmode_single'  ),cnt++,0,1,1 );
  this.selmode_btn.multiple = false;  // custom field
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>',cnt++,0,1,1 );
  this.open_btn    = toolbar.setButton ( '',image_path('openjob'),cnt++,0,1,1 );
  this.stop_btn    = toolbar.setButton ( '',image_path('stopjob'),cnt++,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>',cnt++,0,1,1 );
  this.refresh_btn = toolbar.setButton ( '',image_path('refresh'),cnt++,0,1,1 );
  this.help_btn    = toolbar.setButton ( '',image_path('help')   ,cnt++,0,1,1 );
  this.roadmap_btn = toolbar.setButton ( '',image_path('roadmap'),cnt++,0,1,1 );

  // ***** development code, dormant
  //if ((__user_role==role_code.admin) || (__user_role==role_code.developer))  {
  //  toolbar.setLabel ( '<hr style="border:1px dotted;"/>' ,cnt++,0,1,1 );
  //  split_btn = toolbar.setButton ( '',image_path('split_page'),cnt++,0,1,1 );
  //}
  // *******************************

  this.add_btn.setSize('40px','40px').setTooltip('Add job'   ).setDisabled(true);
  this.dock   .setDisabled ( true );
  if (this.moveup_btn)
    this.moveup_btn.setSize('40px','40px').setTooltip(
                   'Move job one position up the tree branch').setDisabled(true);
  this.del_btn    .setSize('40px','40px').setTooltip('Delete job').setDisabled(true);
  this.stack_btn  .setSize('40px','40px').setTooltip(
                                             'Stack/Unstack jobs').setDisabled(true);
  this.open_btn   .setSize('40px','40px').setTooltip('Open job'  ).setDisabled(true);
  this.stop_btn   .setSize('40px','40px').setTooltip('Stop job'  ).setDisabled(true);
  this.clone_btn  .setSize('40px','40px').setTooltip('Clone job' ).setDisabled(true);
  this.add_rem_btn.setSize('40px','40px').setTooltip('Add remark').setDisabled(true);
  this.thlight_btn.setSize('40px','40px').setTooltip('Toggle branch highlight' )
                                                                  .setDisabled(true);
  this.selmode_btn.setSize('40px','40px').setTooltip('Single/multiple selection mode')
                                                                  .setDisabled(true);
  this.refresh_btn.setSize('40px','40px').setTooltip('Refresh and push stalled jobs');
  this.help_btn   .setSize('40px','40px').setTooltip('Documentation');
  this.roadmap_btn.setSize('40px','40px').setTooltip(appName() + ' roadmap');

  for (var i=0;i<cnt;i++)
    toolbar.setCellSize ( '','12px',i,0 );

  // ***** development code, dormant
  //if (split_btn)  {
  //  split_btn.setSize('40px','40px').setTooltip('Show replay project');
  //  split_btn.setDisabled ( true );
  //}
  // *******************************

  this.help_btn.addOnClickListener ( function(){
    new HelpBox ( '',__user_guide_base_url + 'jscofe_project.html',null );
  });

  this.roadmap_btn.addOnClickListener ( function(){
    window.open ( 'html/tutorials.html' );
  });

  (function(self){
    self.selmode_btn.addOnClickListener ( function(){
      self.setSelMode ( 0 );  // toggle
    });
    self.refresh_btn.addOnClickListener ( function(){
      self.setDisabled  ( true );
      self.can_reload  = true;  // force in order to avoid locking
      self.pending_act = '';    // drop pending actions
      self.wakeZombiJobs();     // must go before reloadTree
      self.reloadTree   ( true,true,null );  // multiple = false?
    });
  }(this))

  //launchHelpBox ( '','./html/jscofe_project.html',doNotShowAgain,1000 );

  this.setJobTree ( this.makeJobTree() );

  // ***** development code, dormant
  //this.replay_div = null;
  //if (split_btn)  {
  //
  //  replay_btn = panel.setButton ( '',image_path('run_project'),0,1,1,1 );
  //  replay_btn.setSize('40px','40px').setTooltip('Replay');
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
  //    var icon = image_path('split_page');
  //    var ttip = 'Show replay project';
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
  //    split_btn.setButton('',icon).setSize('40px','40px').setTooltip(ttip);
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

  // this.onResize ( window.innerWidth,window.innerHeight );

  //  Read project data from server
  (function(self){
    self.jobTree.readProjectData ( 'Project',true,-1,
      function(){
        if (self.onTreeLoaded(false,self.jobTree))  {
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
          title_lbl       .setText ( self.jobTree.projectData.desc.title );
          self.can_reload  = true;
          self.pending_act = '';
        }
      },function(node){
        return self.onTreeContextMenu();
      },function(){
        self.openJob();
      },function(){
        self.onTreeItemSelect();
      });
  }(this))

}

ProjectPage.prototype = Object.create ( BasePage.prototype );
ProjectPage.prototype.constructor = ProjectPage;


// --------------------------------------------------------------------------

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
    //var this.insert_btn    = null;
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
  this.selectRemark();
  if (this.start_action('add_job'))
    (function(self){
      self.jobTree.addJob ( false,false,self,function(key){
        // self.del_btn.setDisabled ( false );
        self._set_del_button_state();
        self.end_action();
      });
    }(this))
}

ProjectPage.prototype.addJobRepeat = function()  {
  this.selectRemark();
  if (this.start_action('add_job_repeat'))
    (function(self){
      self.jobTree.addJob ( false,true,self,function(key){
        // self.del_btn.setDisabled ( false );
        self._set_del_button_state();
        self.end_action();
      });
    }(this))
}

ProjectPage.prototype.insertJob = function()  {
  this.selectRemark();
  if (this.start_action('insert_job'))
    (function(self){
      self.jobTree.addJob ( true,false,self,function(key){
        // self.del_btn.setDisabled ( false );
        if (key!=1) // job was added or failed
          self._set_del_button_state();
        self.end_action();
        if (key==1)  // job was inserted
          self.reloadTree ( false,true,null );
      });
    }(this))
}

ProjectPage.prototype.addRemark = function()  {
  if (this.start_action('add_remark'))
    (function(self){
      self.can_reload = true;
      self.jobTree.addTask ( new TaskRemark(),true,false,self,function(key){
        // self.del_btn.setDisabled ( false );
        // self._set_del_button_state();
        // self.end_action();
        if (key!=1)  // remark was added or failed
          self._set_del_button_state();
        self.end_action();
        if (key==1)  // remark was inserted
          self.reloadTree ( false,true,null );
      });
    }(this))
}

ProjectPage.prototype.cloneJob = function() {
  if (this.start_action('clone_job'))
    (function(self){
      self.jobTree.cloneJob ( 'clone',self,function(){
        // self.del_btn.setDisabled ( false );
        self._set_del_button_state();
        self.end_action();
      });
    }(this))
}

ProjectPage.prototype.deleteJob = function() {
  if (this.start_action('delete_job'))
    (function(self){
      self.jobTree.deleteJob ( false,function(was_deleted_bool){
        self.end_action();
        self._set_button_state();
        // self.setButtonState();
      });
    }(this))
}

ProjectPage.prototype.moveJobUp = function()  {
  if (this.start_action('move_job_up'))
    (function(self){
      self.jobTree.moveJobUp ( true,function(){
        self.end_action();
        self._set_button_state();
        // self.setButtonState();
      });
    }(this))
}

ProjectPage.prototype.toggleBranchHighlight = function()  {
  this.jobTree.toggleBranchHighlight();
}

ProjectPage.prototype.stackJobs = function() {
  if (this.start_action('stack_jobs'))  {
    var adata = this.jobTree.selectStackJobs();
    var save  = false;
    if (adata[0]==1)  {
      if (adata[1].length<=0)  {
        this.jobTree.makeStack1 ( adata[2],'',image_path('job_stack') );
        save = true;
      } else if (adata[2].length<=0)  {
        this.jobTree.makeStack1 ( adata[1],'',image_path('job_stack') );
        save = true;
      } else  {
        var qdlg = new Dialog('Stacking direction');
        var grid = new Grid('');
        qdlg.addWidget ( grid );
        grid.setLabel ( '<h2>Stacking direction</h2>' +
                        'You can choose to stack suitable jobs which are<br>' +
                        '(the selected job is included):<br>&nbsp;',0,0,1,3 );
        var above_cbx = grid.setCheckbox ( 'above the currently selected job',false,1,1,1,1 );
        var below_cbx = grid.setCheckbox ( 'below the currently selected job',true, 2,1,1,1 );
        grid.setLabel ( '&nbsp;<br>Make your choice and click <b><i>Stack</i></b> ' +
                        'button.',3,0,1,3 );
        (function(self){
          qdlg._options.buttons = {
            "Stack"   : function() {
                          var nodelist = [];
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
        }(this))
        qdlg.launch();
      }
    } else if (adata[0]==2)  {
      this.jobTree.unfoldFolder();
      save = true;
    }
    if (save)  {
      (function(self){
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
      }(this))
    }
  }
}

ProjectPage.prototype.setButtonState = function() {
  if (this.start_action('set_button_state'))
    (function(self){
      self._set_button_state();
      self.end_action();
    }(this))
}

ProjectPage.prototype.openJob = function() {
  this.jobTree.openJob ( null,this );
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
  var dsel = false;
  var node = this.jobTree.getSelectedNode();
  if (node)
    dsel = (node.parentId!=null);
  this.del_btn.setEnabled ( dsel );
}

ProjectPage.prototype._set_button_state = function() {
  var dsel = false;
  var task = this.jobTree.getSelectedTask();
  var node = this.jobTree.getSelectedNode();

  var child_tasks = this.jobTree.getChildTasks ( node );
  var has_remark  = false;
  if (child_tasks.length==1)
    has_remark = (child_tasks[0].state==job_code.remark);

  if (node)
    dsel = (node.parentId!=null);
  this.open_btn   .setEnabled ( dsel );
  this.del_btn    .setEnabled ( dsel );
  this.stack_btn  .setEnabled ( (this.jobTree.selectStackJobs()[0]>0) );

  if (task)  {
    var is_remark   = task.isRemark();
    var add_enabled = is_remark;
    if (is_remark)  {
      var tparent = this.jobTree.getNonRemarkParent ( task );
      if (tparent)
        add_enabled = (tparent.state==job_code.finished);
    }
    var can_add = (!__dormant) && ((task.state==job_code.finished)  ||
                                   (is_remark && add_enabled));
    this.add_btn  .setEnabled ( can_add );
    this.dock     .setEnabled ( can_add );
    this.clone_btn.setEnabled ( (!__dormant) && dsel &&
                                task.canClone(node,this.jobTree) );
    if (this.moveup_btn)
      this.moveup_btn.setEnabled ( (!__dormant) && task.canMove(node,this.jobTree) );
    this.stop_btn .setEnabled ( dsel && ((task.state==job_code.running) ||
                                         (task.state==job_code.ending)) );
    this.add_rem_btn.setEnabled ( (!__dormant) && (!has_remark) && (!is_remark) );
    if (is_remark)
          this.del_btn.setTooltip ( 'Delete remark' );
    else  this.del_btn.setTooltip ( 'Delete job' );
  } else  {  // root
    this.add_btn  .setEnabled ( !__dormant );
    this.dock     .setEnabled ( !__dormant );
    this.clone_btn.setEnabled ( false );  // dsel ???
    if (this.moveup_btn)
      this.moveup_btn.setEnabled ( false );
    this.stop_btn    .setEnabled ( false );
    this.add_rem_btn .setEnabled ( (!__dormant) && (!has_remark) );
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
    (function(self){
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
    }(this))
  } else
    new MessageBox ( 'No Project','No Project loaded', 'msg_warning' );
}


ProjectPage.prototype.onTreeContextMenu = function() {
  // The default set of all items
  var items  = {};
  var node   = this.jobTree.getSelectedNode();

  __close_all_menus();

  (function(self){

    var crTask = self.jobTree.task_map[node.id];

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

    if (!$(self.open_btn.element).button('option','disabled'))  {
      if (crTask && (crTask.state==job_code.remark) && (crTask.isWebLink()))  {
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

    var adata = self.jobTree.selectStackJobs();
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

    if (node.parentId)  {
      var crTask = self.jobTree.task_map[node.id];
      if (crTask && (crTask.state!=job_code.remark))
        items.addToDockItem = {
          label : "Add task to dock",
          icon  : image_path('dock_small'),
          action: function(){ self.addToDock(); }
        };
    }

  }(this))

  return items;

}


ProjectPage.prototype.onTreeLoaded = function ( stayInProject,job_tree )  {

  // these go first in all cases
  this.refresh_btn.setDisabled ( false );
  this.selmode_btn.setDisabled ( false );

  if ((!job_tree) || (!job_tree.projectData))  {
    if (stayInProject)  {
      new MessageBox ( 'Connection problems',
          '<div style="width:400px;">' +
          '<h2>Intermittent Connection Problems</h2>' +
          'Try to reload the Project by pushing refresh button ' +
          'in the toolbar. If problem persists, check your ' +
          'Internet connection.', 'msg_system' );
    } else
      makeProjectListPage ( sceneId );
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

  (function(self){
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
      makeProjectListPage ( sceneId );
    });

    if ((job_tree.root_nodes.length==1) &&
        (job_tree.root_nodes[0].children.length<=0))  {
      self.can_reload = true;   // tree reload semaphore
      // enter empty project: first task to run or choose
      switch (job_tree.projectData.desc.startmode)  {
        case start_mode.auto    :
                self.addJob();
              break;
        case start_mode.migrate :
                job_tree.addTask ( new TaskMigrate(),false,false,self,
                  function(key){
                    self._set_del_button_state();
                    //self.del_btn.setDisabled ( false );
                  });
              break;
        case start_mode.standard :
        case start_mode.expert   :  // legacy
        default : self.addJob();
      }
    }

  }(this))

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
    var dlg_task_parameters = this.jobTree.getJobDialogTaskParameters();
    var scrollPos = this.jobTree.parent.getScrollPosition();
    var jobTree1  = this.makeJobTree();
    var timestamp = this.jobTree.projectData.desc.timestamp;
    if (blink)  {
      this.jobTree.closeAllJobDialogs();
      this.jobTree.hide();
      timestamp = -1; // force reload
    } else  {
      jobTree1.hide();
      if (force)
        timestamp = -1; // force reload
    }

    (function(self,job_tree_1){

      job_tree_1.multiple = self.jobTree.multiple;  // needed for tree creation
      job_tree_1.readProjectData ( 'Project',false,timestamp,
        function(){
          if (job_tree_1.projectData)  {
            job_tree_1.multiple = self.jobTree.multiple;
            if (self.onTreeLoaded(true,job_tree_1))  {
              var selTasks = self.jobTree.getSelectedTasks();
              var dlg_map  = self.jobTree.dlg_map;
              self.jobTree.delete();
              self.setJobTree ( job_tree_1 );
              self.jobTree.selectTasks ( selTasks );
              self.jobTree.show  ();
              self.jobTree.parent.setScrollPosition ( scrollPos );
              if (!blink)  {
                self.jobTree.relinkJobDialogs ( dlg_map,self );
                // self.jobTree.relinkJobDialogs ( dlg_map,__current_page );
              } else  {
                // self.jobTree.parent.setScrollPosition ( scrollPos );
                self.jobTree.openJobs ( dlg_task_parameters,self );
                // self.jobTree.openJobs ( dlg_task_parameters,__current_page );
              }
              if (rdata)  {
                self.updateUserRationDisplay ( rdata );
                if ('completed_map' in rdata)
                  for (var key in rdata.completed_map)  {
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
            case 'stack_jobs'     : self.stackJobs ();  break;
            case 'set_button_state' :
            default:  self.jobTree.startTaskLoop();
          }
          self._set_button_state();
        },function(node){
          return self.onTreeContextMenu();
        },function(){
          self.openJob();
        },function(){
          self.onTreeItemSelect();
        });
    }(this,jobTree1))
  }
}

ProjectPage.prototype.wakeZombiJobs = function()  {
  if (this.jobTree.projectData)  {
    var request_data = {};
    request_data.project = this.jobTree.projectData.desc.name;
    serverRequest ( fe_reqtype.wakeZombiJobs,request_data,'Project Page',
                    function(data){},function(key,data){},function(){} );
    localCommand  ( nc_command.wakeZombiJobs,{job_tokens:['*']},
                    'Wake Zombi Jobs',function(response){ return true; } );
  }
}


ProjectPage.prototype.makeJobTree = function()  {
// set the job tree
  var jobTree = new JobTree ();
  jobTree.element.style.paddingTop    = '0px';
  jobTree.element.style.paddingBottom = '25px';
  jobTree.element.style.paddingRight  = '40px';
  // this.job_tree = jobTree;  // for external references
  (function(self){
    jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
      //alert ( 'ration updated ' + JSON.stringify(data));
      self.updateUserRationDisplay ( data );
      //self.getUserRation();
    });
  }(this))
  return jobTree;
}


// ***** development code, dormant
// ProjectPage.prototype.makeReplayJobTree = function()  {
// // set the job tree
//   var jobTree = new JobTree();
//   jobTree.setReplayMode();
//   jobTree.element.style.paddingTop    = '0px';
//   jobTree.element.style.paddingBottom = '25px';
//   jobTree.element.style.paddingRight  = '40px';
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
  var node        = this.jobTree.getSelectedNode();
  var child_nodes = this.jobTree.getChildNodes ( node );
  if (child_nodes.length==1)  {
    var task = this.jobTree.getTaskByNodeId ( child_nodes[0].id );
    if (task)  {
      if (task.state==job_code.remark)  {
        if (this.jobTree.calcSelectedNodeIds().length<=1)
              this.jobTree.selectSingle   ( child_nodes[0] );
        else  this.jobTree.selectMultiple ( child_nodes[0] );
      }
    }
  }
}


ProjectPage.prototype.makeDock = function()  {

  var dock_btn = this.toolPanel
                     .setImageButton ( image_path('dock'),'20px','20px',0,0,1,1 )
                     .setTooltip1    ( 'Toggle task dock','show',true,1000 )
                     .setFontSize    ( '90%' )
                     .setVerticalAlignment ( 'middle' );

  (function(self){

    self.dock = new Dock ( self,

      function(taskType,title,icon_uri){  // left click: add task to tree

        if (!$(self.add_btn.element).button('option','disabled'))  {

          var task = eval ( 'new ' + taskType + '()' );
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

            self.selectRemark();

            var rc = self.jobTree.addTask ( task,false,false,self,
                              function(){
                                self._set_del_button_state();
                                // self.del_btn.setDisabled ( false );
                              });
            var avail_key   = rc[0];
            var dataSummary = rc[1];

            if (dataSummary.status<=0)
              new TaskDataDialog ( dataSummary,task,avail_key );

          }

        }

      },

      function(taskType,title,icon_uri){  // right click: delete icon
        // new QuestionBox ( 'Remove dock item',
        //   '<div style="min-width:400px"><h2>Remove dock item</h2>Remove<p>' +
        //   '<div style="text-align:center"><img style="vertical-align:middle" src="' +
        //   icon_uri +
        //   '" width="26" height="24"><span style="vertical-align:middle">&nbsp;&nbsp;<b>' +
        //   title + '</b></span></div><p>from the dock?</div>',
        //   'Yes, remove',function(){
        //     self.dock.removeTask ( taskType );
        //   },
        //   'Cancel',function(){},'msg_confirm' );

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

  }(this))

}


ProjectPage.prototype.onResize = function ( width,height )  {
  var h = (height - 108) + 'px';
  var w = (width  - 110) + 'px';
  this.toolbar_div.element.style.height = h;
  this.tree_div.element.style.height    = h;
  // ***** development code, dormant
  //if (this.replay_div)  {
  //  if (this.replay_div.isVisible())  {
  //    var hw = (round(width/2,0)-75) + 'px';
  //    this.tree_div  .element.style.width = hw;
  //    this.replay_div.element.style.width = hw;
  //  } else
  //    this.tree_div.element.style.width = w;
  //} else
  //  this.tree_div.element.style.width = w;
  // *******************************
  this.tree_div.element.style.width = w;
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
  (function(self){
    self.jobTree.cloneJob ( 'copy_suggested',self,function(){
      // self.del_btn.setDisabled ( false );
      self._set_del_button_state();
      if (jobId in self.jobTree.dlg_map)
        self.jobTree.dlg_map[jobId].close();
    });
  }(this))
}


function rvapi_cloneJob ( jobId )  {

  if (!__current_page)  {
    new MessageBox ( 'Page not found','Project Page not found. This is a bug, ' +
                     'please contact ' + appName() + ' developer.', 'msg_error' );
  } else if (__current_page._type!='ProjectPage')  {
    new MessageBox ( 'Wrong page type','Wrong Project Page type encountered. ' +
                     'This is a bug, please contact ' + appName() + ' developer.',
                     'msg_error' );
  } else  {
    __current_page.cloneJobWithSuggestedParameters ( jobId );
  }

}


// =========================================================================

function makeProjectPage ( sceneId )  {
  makePage ( new ProjectPage(sceneId) );
  setHistoryState ( 'ProjectPage' );
}
