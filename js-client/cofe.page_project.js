
/*
 *  ==========================================================================
 *
 *    04.01.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  ==========================================================================
 *
 */


// ---------------------------------------------------------------------------
// projects page class

function ProjectPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGGED IN');
    return;
  }

  this.job_tree      = null;  // for external references
  this.dock          = null;  // dock widget

  // ***** development code, dormant
  //this.replay_job_tree = null;  // for external references
  // *******************************

  var title_lbl      = null;
  var jobTree        = null;  // == this.job_tree, for internal references
  var replayJobTree  = null;  // == this.replay_job_tree, for internal references

  this.add_btn       = null;
  var add_rem_btn    = null;
  var thlight_btn    = null;
  //var insert_btn    = null;
  var moveup_btn     = null;
  this.del_btn       = null;
  var archive_btn    = null;
  var open_btn       = null;
  var stop_btn       = null;
  var clone_btn      = null;
  var refresh_btn    = null;
  var help_btn       = null;
  var roadmap_btn    = null;
  var selmode_btn    = null;
  //var dock_btn       = null;

  // ***** development code, dormant
  //var split_btn      = null;
  //var replay_btn     = null;
  //var replay_mode    = false;
  // *******************************

  var self           = this;  // for referencing class's properties

  /*
  function selectRemark()  {
    var node        = jobTree.getSelectedNode();
    var child_nodes = jobTree.getChildNodes ( node );
    if (child_nodes.length==1)  {
      var task = jobTree.getTaskByNodeId ( child_nodes[0].id );
      if (task)  {
        if (task.state==job_code.remark)  {
          if (jobTree.calcSelectedNodeIds().length<=1)
                jobTree.selectSingle   ( child_nodes[0] );
          else  jobTree.selectMultiple ( child_nodes[0] );
        }
      }
    }
  }
  */

  function addJob()  {
    self.selectRemark();
    jobTree.addJob ( false,false,self,
                           function(){ self.del_btn.setDisabled ( false ); } );
  }

  function addJobRepeat()  {
    self.selectRemark();
    jobTree.addJob ( false,true,self,
                           function(){ self.del_btn.setDisabled ( false ); } );
  }

  function insertJob()  {
    self.selectRemark();
    jobTree.addJob ( true,false,self,
                          function(){ self.del_btn.setDisabled ( false ); } );
  }

  function addRemark()  {
    jobTree.addTask ( new TaskRemark(),true,false,self,
                                function(){ self.del_btn.setDisabled ( false ); } );
  }

  function toggleBranchHighlight()  {
    jobTree.toggleBranchHighlight ();
  }

  function moveJobUp()  {
    jobTree.moveJobUp ( true,setButtonState );
  }

  function deleteJob() {
    jobTree.deleteJob ( setButtonState );
  }

  function archiveJobs() {
    var adata = jobTree.selectArchiveJobs();
    var save  = false;
    if (adata[0]==1)  {
      if (adata[1].length<=0)  {
        jobTree.makeFolder1 ( adata[2],'',image_path('folder_jobtree') );
        save = true;
      } else if (adata[2].length<=0)  {
        jobTree.makeFolder1 ( adata[1],'',image_path('folder_jobtree') );
        save = true;
      } else  {
        var qdlg = new Dialog('Archive direction');
        var grid = new Grid('');
        qdlg.addWidget ( grid );
        grid.setLabel ( '<h2>Archive direction</h2>' +
                        'You can choose to archive suitable jobs which are<br>' +
                        '(selected job included):<br>&nbsp;',0,0,1,3 );
        var above_cbx = grid.setCheckbox ( 'above currently selected',false,1,1,1,1 );
        var below_cbx = grid.setCheckbox ( 'below currently selected',true, 2,1,1,1 );
        grid.setLabel ( '&nbsp;<br>Make your choice and click <b><i>Archive</i></b> ' +
                        'button.',3,0,1,3 );
        qdlg._options.buttons = {
          "Archive" : function() {
                        var nodelist = [];
                        if (above_cbx.getValue())
                          nodelist = adata[1];
                        if (below_cbx.getValue())  {
                          nodelist.shift();  // avoid duplicate nodes in the list
                          nodelist = nodelist.concat ( adata[2] );
                        }
                        if (nodelist.length<=0)
                          new MessageBox (
                              'Empty selection',
                              '<h2>Empty selection</h2>' +
                              'At least one checkbox must be checked<br>' +
                              'for acrhiving.'
                          );
                        else  {
                          $( this ).dialog( 'close' );
                          jobTree.makeFolder1 ( nodelist,'',
                                                image_path('folder_jobtree') );
                          jobTree.saveProjectData ( [],[],true, null );
                        }
                      },
          "Cancel"  : function() {
                        $( this ).dialog( "close" );
                      }
        };
        qdlg.launch();
      }
    } else if (adata[0]==2)  {
      jobTree.unfoldFolder();
      save = true;
    }
    if (save)  {
      jobTree.saveProjectData ( [],[],true, null );
      setSelMode ( 1 );
    }
  }

  function openJob() {
    jobTree.openJob ( null,self );
    //setSelMode ( 1 );
  }

  function stopJob() {
    jobTree.stopJob ( '',false,null );  // 'false' means immediate termination
  }

  function cloneJob() {
    jobTree.cloneJob ( self,function(){ self.del_btn.setDisabled ( false ); });
  }

  function setSelMode ( mode )  {
    // mode = 0:  toggle
    //        1:  single
    //        2:  multiple
    if ((mode==0) || ((mode==1) && jobTree.multiple) ||
                     ((mode==2) && (!jobTree.multiple)))
      reloadTree ( false,!jobTree.multiple,null );
  }

  function addToDock() {
    self.dock.addTaskClass ( jobTree.getSelectedTask() );
    self.dock.show();
  }

  function setButtonState() {
    var dsel = false;
    var task = jobTree.getSelectedTask();
    var node = jobTree.getSelectedNode();

    var child_tasks = jobTree.getChildTasks ( node );
    var has_remark  = false;
    if (child_tasks.length==1)
      has_remark = child_tasks[0].state == job_code.remark;

    if (node)
      dsel = (node.parentId!=null);
    open_btn    .setEnabled ( dsel );
    self.del_btn.setEnabled ( dsel );
    archive_btn .setEnabled ( (jobTree.selectArchiveJobs()[0]>0) );

    if (task)  {
      var is_remark   = task.isRemark();
      var add_enabled = is_remark;
      if (is_remark)  {
        var tparent = jobTree.getNonRemarkParent ( task );
        if (tparent)
          add_enabled = (tparent.state==job_code.finished);
      }
      self.add_btn.setEnabled ( (!__dormant) &&
                               ((task.state==job_code.finished)  ||
                               (is_remark && add_enabled)) );
      clone_btn  .setEnabled ( (!__dormant) && dsel && task.canClone(node,jobTree) );
      moveup_btn .setEnabled ( (!__dormant) && task.canMove(node,jobTree) );
      stop_btn   .setEnabled ( dsel && ((task.state==job_code.running) ||
                                        (task.state==job_code.ending)) );
      add_rem_btn.setEnabled ( (!__dormant) && (!has_remark) && (!is_remark) );
      if (is_remark)
            self.del_btn.setTooltip ( 'Delete remark' );
      else  self.del_btn.setTooltip ( 'Delete job' );
    } else  {  // root
      self.add_btn.setEnabled ( !__dormant );
      clone_btn   .setEnabled ( false );  // dsel ???
      moveup_btn  .setEnabled ( false );
      stop_btn    .setEnabled ( false );
      add_rem_btn .setEnabled ( (!__dormant) && (!has_remark) );
    }
    thlight_btn.setEnabled ( true );

    // ***** development code, dormant
    //if (replay_btn)  {
    //  replay_btn.setVisible ( replay_mode );
    //  self.replay_div.setVisible ( replay_mode );
    //}
    // *******************************

  }

  function share_project()  {
    if (jobTree)  {
      shareProject ( jobTree.projectData.desc,function(desc){
        if (desc)  {
          jobTree.projectData.desc = desc;
          jobTree.saveProjectData ( [],[],false,function(rdata){} );
          if (jobTree.projectData.desc.owner.share.length>0)
            jobTree.startTaskLoop();
        }
      });
    } else
      new MessageBox ( 'No Project','No Project loaded' );
  }

  function onTreeContextMenu(node) {
    // The default set of all items
    var items = {};
    var node  = jobTree.getSelectedNode();

    if (!$(self.add_btn.element).button('option','disabled'))  {
      items.addJobItem = { // The "Add job" menu item
        label : "Add new job",
        icon  : image_path('add'),
        action: addJob
      };
      if (node.parentId)
        items.addJobRepeatItem = { // The "Add job" menu item
          label : "Add job with last used parameters",
          icon  : image_path('add_repeat'),
          action: addJobRepeat
        };
    }

    if (!$(moveup_btn.element).button('option','disabled'))  {
      items.moveJobUpItem = { // The "Add job" menu item
        label : "Move job up the tree",
        icon  : image_path('moveup'),
        action: moveJobUp
      };
    }

    if (!$(clone_btn.element).button('option','disabled'))  {
      items.cloneJobItem = { // The "Clone job" menu item
        label : "Clone job",
        icon  : image_path('clonejob'),
        action: cloneJob
      };
    }

    if (!$(self.del_btn.element).button('option','disabled'))  {
      items.delJobItem = { // The "Delete job" menu item
        label : 'Delete job with descendants',
        icon  : image_path('remove'),
        action: deleteJob
      };
      var crTask = jobTree.task_map[node.id];
      if (crTask && (crTask.state==job_code.remark))
        items.delJobItem.label = 'Delete remark';
    }

    if (!$(open_btn.element).button('option','disabled'))  {
      items.runJobItem = { // The "Open job" menu item
        label : "Open job dialog",
        icon  : image_path('openjob'),
        action: openJob
      };
    }

    if (!$(stop_btn.element).button('option','disabled'))  {
      items.stopJobItem = { // The "Stop job" menu item
        label : "Stop job running",
        icon  : image_path('stopjob'),
        action: stopJob
      };
    }

    if (!$(add_rem_btn.element).button('option','disabled'))  {
      items.addRemarkItem = { // The "Add remark" menu item
        label : "Add remark",
        icon  : image_path('task_remark'),
        action: addRemark
      };
    }

    items.addHighlightBranchItem = { // The "highlight" menu item
      label : "Toggle branch highlighting",
      icon  : image_path('highlight_branch'),
      action: toggleBranchHighlight
    };

    var adata = jobTree.selectArchiveJobs();
    if (adata[0]==1)  {
      items.addArchiveItem = {
        label : "Archive jobs",
        icon  : image_path('folder_jobtree'),
        action: archiveJobs
      };
    } else if (adata[0]==2)  {
      items.addUnarchiveItem = {
        label : "Unarchive jobs",
        icon  : image_path('folder_jobtree'),
        action: archiveJobs
      };
    }

    if (node.parentId)
      items.addToDockItem = {
        label : "Add task to dock",
        icon  : image_path('dock_small'),
        action: addToDock
      };


    return items;

  }

  function onTreeLoaded() {

    if ((!jobTree) || (!jobTree.projectData))  {
      makeProjectListPage ( sceneId );
      return false;
    }

    refresh_btn.setDisabled ( false );
    selmode_btn.setDisabled ( false );
    if (jobTree.multiple)
          selmode_btn.setIcon ( image_path('selmode_multi') );
    else  selmode_btn.setIcon ( image_path('selmode_single') );

    // ***** development code, dormant
    //if (split_btn)
    //  split_btn.setEnabled ( true );
    // *******************************

    setButtonState();

    // add button listeners
    self.add_btn.addOnClickListener ( addJob      );
    moveup_btn  .addOnClickListener ( moveJobUp   );
    self.del_btn.addOnClickListener ( deleteJob   );
    archive_btn .addOnClickListener ( archiveJobs );
    open_btn    .addOnClickListener ( openJob     );
    stop_btn    .addOnClickListener ( stopJob     );
    clone_btn   .addOnClickListener ( cloneJob    );
    add_rem_btn .addOnClickListener ( addRemark   );
    thlight_btn .addOnClickListener ( toggleBranchHighlight );
    title_lbl   .setText ( jobTree.projectData.desc.title );

    __current_project = jobTree.projectData.desc.name;

    jobTree.addSignalHandler ( cofe_signals.jobDialogOpened,function(data){
      setSelMode ( 1 );
    });
    jobTree.addSignalHandler ( cofe_signals.jobStarted,function(data){
      setButtonState();
    });
    jobTree.addSignalHandler ( cofe_signals.treeUpdated,function(data){
      self.updateUserRationDisplay ( jobTree.projectData.desc );
      setButtonState();
    });
    jobTree.addSignalHandler ( cofe_signals.reloadTree,function(rdata){
      reloadTree ( false,false,rdata );
    });
    jobTree.addSignalHandler ( cofe_signals.makeProjectList,function(rdata){
      makeProjectListPage ( sceneId );
    });

    if ((jobTree.root_nodes.length==1) &&
        (jobTree.root_nodes[0].children.length<=0))  {
      // enter empty project: first task to run or choose
      switch (jobTree.projectData.desc.startmode)  {
        case start_mode.auto    :
                jobTree.addTask ( new TaskCCP4go(),false,false,self,function(){
                   self.del_btn.setDisabled ( false );
                });
              break;
        case start_mode.migrate :
                jobTree.addTask ( new TaskMigrate(),false,false,self,function(){
                   self.del_btn.setDisabled ( false );
                });
              break;
        case start_mode.expert  :
        default : addJob();
      }
    }

    self.updateUserRationDisplay ( jobTree.projectData.desc );

    return true;

  }

  function onTreeItemSelect()  {
    setButtonState();
  }

  function reloadTree ( blink,multisel,rdata )  {
    // blink==true will force page blinking, for purely aesthatic reasons
    var selTask   = jobTree.getSelectedTask();
    var scrollPos = jobTree.parent.getScrollPosition();
    var job_tree  = jobTree;
    jobTree.stopTaskLoop();
    var dlg_task_parameters = jobTree.getJobDialogTaskParameters();
    jobTree = self.makeJobTree();
    jobTree.multiple = multisel;
    if (blink)  {
      job_tree.closeAllJobDialogs();
      job_tree.delete();
    } else
      jobTree.hide();
    job_tree.parent.addWidget ( jobTree );
    jobTree.readProjectData ( 'Project',function(){
      if (onTreeLoaded())  {
        jobTree.parent.setScrollPosition ( scrollPos );
        if (!blink)  {
          jobTree .relinkJobDialogs ( job_tree.dlg_map,self );
          job_tree.hide  ();
          jobTree .show  ();
          job_tree.delete();
        } else  {
          job_tree.closeAllJobDialogs();
          jobTree .openJobs ( dlg_task_parameters,self );
        }
        jobTree.selectTask ( selTask );
        if (rdata)
          self.updateUserRationDisplay ( rdata );
      }
    },onTreeContextMenu,openJob,onTreeItemSelect );
  }

  function wakeZombiJobs()  {
    var request_data = {};
    request_data.project = jobTree.projectData.desc.name;
    serverRequest ( fe_reqtype.wakeZombiJobs,request_data,'Project Page',
                    function(data){},function(key,data){},function(){} );
    localCommand  ( nc_command.wakeZombiJobs,{job_tokens:['*']},
                    'Wake Zombi Jobs',function(response){ return true; } );
  }

  function onLogout ( logout_func )  {
    jobTree.stopTaskLoop    ();
    jobTree.saveProjectData ( [],[],false, function(rdata){ logout_func(); } );
  }


  this.makeHeader ( 3,onLogout );
  title_lbl = this.headerPanel.setLabel ( '',0,2,1,1 );
  title_lbl.setFont  ( 'times','150%',true,true )
           .setNoWrap()
           .setHorizontalAlignment ( 'left' );
  this.headerPanel.setVerticalAlignment ( 0,2,'middle' );

  this.makeDock();

  // Make Main Menu

  this.addMenuItem ( 'My Projects','list',function(){
    if (jobTree && jobTree.projectData)
      jobTree.saveProjectData ( [],[],false, function(rdata){
        makeProjectListPage ( sceneId );
      });
    else
      makeProjectListPage ( sceneId );
  });

  if (!__local_user)  {
    this.addMenuItem ( 'My Account','settings',function(){
      if (jobTree && jobTree.projectData)
        jobTree.saveProjectData ( [],[],false, function(rdata){
          makeAccountPage ( sceneId );
        });
      else
        makeAccountPage ( sceneId );
    });
    if (__user_role==role_code.admin)
      this.addMenuItem ( 'Admin Page',role_code.admin,function(){
        if (jobTree && jobTree.projectData)
          jobTree.saveProjectData ( [],[],false, function(rdata){
            makeAdminPage ( sceneId );
          });
        else
          makeAdminPage ( sceneId );
      });
  }

  this.addMenuSeparator();

  this.addMenuItem ( 'Project settings','project_settings',function(){
    if (jobTree && jobTree.projectData)
          new ProjectSettingsDialog ( jobTree,function(){
            jobTree.saveProjectData ( [],[],true, null );
          });
    else  new MessageBox ( 'No Project','No Project loaded' );
  });

  //this.addMenuItem ( 'Share Project','share',shareProject );
  this.addMenuItem ( 'Share Project','share',share_project );

  this.addLogoutToMenu ( function(){
    if (jobTree && jobTree.projectData)
      jobTree.saveProjectData ( [],[],false, function(rdata){
        logout ( sceneId,0 );
      });
    else
      logout ( sceneId,0 );
  });


  // make central panel and the toolbar
  this.toolbar_div = new Widget('div');
  this.toolbar_div.element.setAttribute ( 'class','toolbox-content' );
  var toolbar = new Grid('');
  this.toolbar_div.addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, 1,0,1,1 );

  var panel = this.grid.setGrid ( '',1,1,1,1 );
  // center panel horizontally and make left- and right-most columns page margins
  // note that actual panel size is set in function resizeTreePanel() below
  this.grid.setCellSize ( '40px',''    ,1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'top' );
  this.grid.setCellSize ( '','100%' ,1,1,1,1 );
  this.grid.setCellSize ( '40px',''    ,1,2,1,1 );

  // make the toolbar
  var cnt = 0;
  this.add_btn = toolbar.setButton ( '',image_path('add')      ,cnt++,0,1,1 );
  moveup_btn   = toolbar.setButton ( '',image_path('moveup')   ,cnt++,0,1,1 );
  clone_btn    = toolbar.setButton ( '',image_path('clonejob') ,cnt++,0,1,1 );
  this.del_btn = toolbar.setButton ( '',image_path('remove')   ,cnt++,0,1,1 );
  archive_btn  = toolbar.setButton ( '',image_path('folder_jobtree'),cnt++,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       ,cnt++,0,1,1 );
  add_rem_btn  = toolbar.setButton ( '',image_path('task_remark'     ),cnt++,0,1,1 );
  thlight_btn  = toolbar.setButton ( '',image_path('highlight_branch'),cnt++,0,1,1 );
  selmode_btn  = toolbar.setButton ( '',image_path('selmode_single'  ),cnt++,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       ,cnt++,0,1,1 );
  open_btn     = toolbar.setButton ( '',image_path('openjob')  ,cnt++,0,1,1 );
  stop_btn     = toolbar.setButton ( '',image_path('stopjob')  ,cnt++,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       ,cnt++,0,1,1 );
  refresh_btn  = toolbar.setButton ( '',image_path('refresh')  ,cnt++,0,1,1 );
  help_btn     = toolbar.setButton ( '',image_path('help')     ,cnt++,0,1,1 );
  roadmap_btn  = toolbar.setButton ( '',image_path('roadmap')  ,cnt++,0,1,1 );

  // ***** development code, dormant
  //if ((__user_role==role_code.admin) || (__user_role==role_code.developer))  {
  //  toolbar.setLabel ( '<hr style="border:1px dotted;"/>' ,cnt++,0,1,1 );
  //  split_btn = toolbar.setButton ( '',image_path('split_page'),cnt++,0,1,1 );
  //}
  // *******************************

  this.add_btn.setSize('40px','40px').setTooltip('Add job'   ).setDisabled(true);
  moveup_btn  .setSize('40px','40px').setTooltip(
                   'Move job one position up the tree branch').setDisabled(true);
  this.del_btn.setSize('40px','40px').setTooltip('Delete job').setDisabled(true);
  archive_btn .setSize('40px','40px').setTooltip(
                                    'Archive/Unarchive jobs').setDisabled(true);
  open_btn    .setSize('40px','40px').setTooltip('Open job'  ).setDisabled(true);
  stop_btn    .setSize('40px','40px').setTooltip('Stop job'  ).setDisabled(true);
  clone_btn   .setSize('40px','40px').setTooltip('Clone job' ).setDisabled(true);

  add_rem_btn .setSize('40px','40px').setTooltip('Add remark').setDisabled(true);
  thlight_btn .setSize('40px','40px').setTooltip('Toggle branch highlight' )
                                                              .setDisabled(true);
  selmode_btn .setSize('40px','40px').setTooltip('Single/multiple selection mode')
                                                              .setDisabled(true);
  refresh_btn .setSize('40px','40px').setTooltip('Refresh and push stalled jobs');
  help_btn    .setSize('40px','40px').setTooltip('Documentation');
  roadmap_btn .setSize('40px','40px').setTooltip(appName() + ' roadmap');

  for (var i=0;i<cnt;i++)
    toolbar.setCellSize ( '','12px',i,0 );

  // ***** development code, dormant
  //if (split_btn)  {
  //  split_btn.setSize('40px','40px').setTooltip('Show replay project');
  //  split_btn.setDisabled ( true );
  //}
  // *******************************

  this.add_btn.setDisabled ( true );
  moveup_btn  .setDisabled ( true );
  clone_btn   .setDisabled ( true );
  add_rem_btn .setDisabled ( true );
  thlight_btn .setDisabled ( true );
  refresh_btn .setDisabled ( true );

  help_btn.addOnClickListener ( function(){
    new HelpBox ( '',__user_guide_base_url + 'jscofe_project.html',null );
  });

  roadmap_btn.addOnClickListener ( function(){
    window.open ( 'html/tutorials.html' );
  });

  selmode_btn.addOnClickListener ( function(){
    setSelMode ( 0 );  // toggle
  });

  //launchHelpBox ( '','./html/jscofe_project.html',doNotShowAgain,1000 );

  this.tree_div = new Widget ( 'div' );
  this.tree_div.element.setAttribute ( 'class','tree-content' );
  jobTree = this.makeJobTree();
  this.tree_div.addWidget ( jobTree );
  panel.setWidget ( this.tree_div, 0,0,1,1 );

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
  //      replayJobTree.readProjectData ( 'Replay Project',
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

  refresh_btn.addOnClickListener ( function(){
    wakeZombiJobs();  // must go before reloadTree
    reloadTree ( true,false,null );
  });

  this.makeLogoPanel ( 2,0,3 );

  this.onResize ( window.innerWidth,window.innerHeight );

  //  Read project data from server
  jobTree.readProjectData ( 'Project',onTreeLoaded,onTreeContextMenu,
                                      openJob,onTreeItemSelect );

}

ProjectPage.prototype = Object.create ( BasePage.prototype );
ProjectPage.prototype.constructor = ProjectPage;


// --------------------------------------------------------------------------

ProjectPage.prototype.destructor = function ( function_ready )  {
  if (this.job_tree)  {
    this.job_tree.stopTaskLoop();
    this.job_tree.closeAllJobDialogs();
  }
  // ***** development code, dormant
  //if (this.replay_job_tree)  {
  //  this.replay_job_tree.stopTaskLoop();
  //  this.replay_job_tree.closeAllJobDialogs();
  //}
  // *******************************
  BasePage.prototype.destructor.call ( this,function_ready );
}


ProjectPage.prototype.makeJobTree = function()  {
// set the job tree
  var jobTree = new JobTree ();
  jobTree.element.style.paddingTop    = '0px';
  jobTree.element.style.paddingBottom = '25px';
  jobTree.element.style.paddingRight  = '40px';
  this.job_tree = jobTree;  // for external references
  (function(self){
    jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
      //alert ( 'ration updated ' + JSON.stringify(data));
      self.updateUserRationDisplay ( data );
      //self.getUserRation();
    });
  }(this))
  return jobTree;
}


ProjectPage.prototype.makeReplayJobTree = function()  {
// set the job tree
  var jobTree = new JobTree();
  jobTree.setReplayMode();
  jobTree.element.style.paddingTop    = '0px';
  jobTree.element.style.paddingBottom = '25px';
  jobTree.element.style.paddingRight  = '40px';
  // ***** development code, dormant
  //this.replay_job_tree = null;  // for internal and external references,
                                  // lock before tree is loaded
  // *******************************
  (function(self){
    jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
      self.updateUserRationDisplay ( data );
    });
  }(this))
  return jobTree;
}

ProjectPage.prototype.selectRemark = function()  {
  var node        = this.job_tree.getSelectedNode();
  var child_nodes = this.job_tree.getChildNodes ( node );
  if (child_nodes.length==1)  {
    var task = this.job_tree.getTaskByNodeId ( child_nodes[0].id );
    if (task)  {
      if (task.state==job_code.remark)  {
        if (this.job_tree.calcSelectedNodeIds().length<=1)
              this.job_tree.selectSingle   ( child_nodes[0] );
        else  this.job_tree.selectMultiple ( child_nodes[0] );
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
                'to the Project. You may remove this task from the dock.</div>' );

          } else  {

            self.selectRemark();

            var rc = self.job_tree.addTask ( task,false,false,self,
                              function(){ self.del_btn.setDisabled ( false ); } );
            var avail_key   = rc[0];
            var dataSummary = rc[1];

            if (dataSummary.status<=0)
              new TaskDataDialog ( dataSummary,task,avail_key );

          }

        }

      },

      function(taskType,title,icon_uri){  // right click: delete icon
        new QuestionBox ( 'Remove dock item',
          '<div style="min-width:400px"><h2>Remove dock item</h2>Remove<p>' +
          '<div style="text-align:center"><img style="vertical-align:middle" src="' +
          icon_uri +
          '" width="26" height="24"><span style="vertical-align:middle">&nbsp;&nbsp;<b>' +
          title + '</b></span></div><p>from the dock?</div>',
          'Yes, remove',function(){
            self.dock.removeTask ( taskType );
          },
          'Cancel',function(){} );
        return 0;
      },

      function(){
        //return { task:'TaskRefmac', title:'Refmac', icon:'task_refmac'};
        return null;  // do not add task
      }

    );

    //self.dock.toggle();  // hide

    dock_btn.addOnClickListener ( function(){
      self.dock.toggle();
    });

  }(this))

}


ProjectPage.prototype.onResize = function ( width,height )  {
  var h = (height - 104) + 'px';
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
  return this.job_tree;
}


// =========================================================================

function makeProjectPage ( sceneId )  {
  makePage ( new ProjectPage(sceneId) );
  setHistoryState ( 'ProjectPage' );
}
