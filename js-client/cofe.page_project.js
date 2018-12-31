
/*
 *  ==========================================================================
 *
 *    27.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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

  this.job_tree        = null;  // for external references
  this.replay_job_tree = null;  // for external references

  var title_lbl      = null;
  var jobTree        = null;  // == this.job_tree, for internal references
  var replayJobTree  = null;  // == this.replay_job_tree, for internal references
  var add_btn        = null;
  var add_rem_btn    = null;
  //var insert_btn    = null;
  var moveup_btn     = null;
  var del_btn        = null;
  var open_btn       = null;
  var stop_btn       = null;
  var clone_btn      = null;
  var refresh_btn    = null;
  var help_btn       = null;
  var split_btn      = null;
  var replay_btn     = null;
  var replay_mode    = false;
  var self           = this;  // for referencing class's properties


  function selectRemark()  {
    var node        = jobTree.getSelectedNode();
    var child_nodes = jobTree.getChildNodes ( node );
    if (child_nodes.length==1)  {
      var task = jobTree.getTaskByNodeId ( child_nodes[0].id );
      if (task.state==job_code.remark)  {
        if (jobTree.calcSelectedNodeId().length<=1)
              jobTree.selectSingle   ( child_nodes[0] );
        else  jobTree.selectMultiple ( child_nodes[0] );
      }
    }
  }

  function addJob()  {
    selectRemark();
    jobTree.addJob ( false,self, function(){ del_btn.setDisabled ( false ); } );
  }

  function insertJob ()  {
    selectRemark();
    jobTree.addJob ( true,self, function(){ del_btn.setDisabled ( false ); } );
  }

  function addRemark ()  {
    jobTree.addTask ( new TaskRemark(),true,self,
                                function(){ del_btn.setDisabled ( false ); } );
  }

  function moveJobUp ()  {
    jobTree.moveJobUp ( true,setButtonState );
  }

  function deleteJob() {
    jobTree.deleteJob ( setButtonState );
  }

  function openJob() {
    jobTree.openJob ( null,self );
  }

  function stopJob() {
    jobTree.stopJob ( '' );
  }

  function cloneJob() {
    jobTree.cloneJob ( self,function(){ del_btn.setDisabled ( false ); });
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
    open_btn .setEnabled ( dsel );
    del_btn  .setEnabled ( dsel );

    if (task)  {
      var is_remark = (task.state==job_code.remark);
      add_btn.setEnabled ( (task.state==job_code.finished) ||
                           (task.state==job_code.failed)   ||
                           (task.state==job_code.stopped)  ||
                           is_remark );
      //insert_btn.setEnabled ( add_btn.isEnabled() );
      clone_btn  .setEnabled ( dsel && (!is_remark) );
      moveup_btn .setEnabled ( task.canMove(node,jobTree) );
      stop_btn   .setEnabled ( dsel && (task.state==job_code.running) );
      add_rem_btn.setEnabled ( (!has_remark) && (!is_remark) );
      if (is_remark)
            del_btn.setTooltip ( 'Delete remark' );
      else  del_btn.setTooltip ( 'Delete job' );
    } else  {  // root
      add_btn   .setEnabled ( true  );
      //insert_btn.setEnabled ( true  );
      clone_btn .setEnabled ( dsel  );
      moveup_btn.setEnabled ( false );
      stop_btn  .setEnabled ( false );
      add_rem_btn.setEnabled ( (!has_remark) );
    }


    if (replay_btn)  {
      replay_btn.setVisible ( replay_mode );
      self.replay_div.setVisible ( replay_mode );
    }

  }


  function onTreeContextMenu(node) {
    // The default set of all items

    var items  = {};

    if (!$(add_btn.element).button('option','disabled'))  {
      items.addJobItem = { // The "Add job" menu item
        label : "Add job",
        icon  : image_path('add'),
        action: addJob
      };
    }

    if (!$(moveup_btn.element).button('option','disabled'))  {
      items.moveJobUpItem = { // The "Add job" menu item
        label : "Move up",
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

    if (!$(del_btn.element).button('option','disabled'))  {
      items.delJobItem = { // The "Delete job" menu item
        label : 'Delete job',
        icon  : image_path('remove'),
        action: deleteJob
      };
      var crTask = jobTree.task_map[node.id];
      if (crTask && (crTask.state==job_code.remark))
        items.delJobItem.label = 'Delete remark';
    }

    if (!$(open_btn.element).button('option','disabled'))  {
      items.runJobItem = { // The "Open job" menu item
        label : "Open job",
        icon  : image_path('openjob'),
        action: openJob
      };
    }

    if (!$(stop_btn.element).button('option','disabled'))  {
      items.stopJobItem = { // The "Stop job" menu item
        label : "Stop job",
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

    return items;

  }

  function onTreeLoaded() {

//alert ( 'on tree');

    add_btn    .setDisabled ( false );
    //insert_btn .setDisabled ( false );
    moveup_btn .setDisabled ( false );
    refresh_btn.setDisabled ( false );

    setButtonState();

    if (split_btn)
      split_btn.setEnabled ( true );

    // add button listeners
    add_btn    .addOnClickListener ( addJob    );
    //insert_btn.addOnClickListener ( insertJob );
    moveup_btn .addOnClickListener ( moveJobUp );
    del_btn    .addOnClickListener ( deleteJob );
    open_btn   .addOnClickListener ( openJob   );
    stop_btn   .addOnClickListener ( stopJob   );
    clone_btn  .addOnClickListener ( cloneJob  );
    add_rem_btn.addOnClickListener ( addRemark );
    title_lbl  .setText ( jobTree.projectData.desc.title );

    __current_project = jobTree.projectData.desc.name;

    jobTree.addSignalHandler ( cofe_signals.jobStarted,function(data){
      setButtonState();
    });
    jobTree.addSignalHandler ( cofe_signals.treeUpdated,function(data){
      setButtonState();
    });

    if ((jobTree.root_nodes.length==1) &&
        (jobTree.root_nodes[0].children.length<=0))
      addJob();

  }

  function onTreeItemSelect()  {
    setButtonState();
  }

  function onLogout ( logout_func )  {
    jobTree.stopTaskLoop    ();
    jobTree.saveProjectData ( [],[], function(data){ logout_func(); } );
  }

  this.makeHeader ( 3,onLogout );
  title_lbl = this.headerPanel.setLabel ( '',0,2,1,1 );
  title_lbl.setFont  ( 'times','150%',true,true )
           .setNoWrap()
           .setHorizontalAlignment ( 'left' );
  this.headerPanel.setVerticalAlignment ( 0,2,'middle' );

  // Make Main Menu
  var prjlist_mi = this.headerPanel.menu.addItem('My Projects',image_path('list'));

  // set menu listeners
  prjlist_mi.addOnClickListener ( function(){
    jobTree.saveProjectData ( [],[],null );
    makeProjectListPage   ( sceneId );
  });

  if (!__local_user)  {

    var account_mi = this.headerPanel.menu.addItem('My Account',image_path('settings'));
    var admin_mi   = null;
    if (__admin)
      admin_mi = this.headerPanel.menu.addItem('Admin Page',image_path('admin'));

    account_mi.addOnClickListener ( function(){
      jobTree.saveProjectData ( [],[],null );
      makeAccountPage       ( sceneId );
    });

    if (admin_mi)
      admin_mi.addOnClickListener ( function(){
        jobTree.saveProjectData ( [],[],function(){ makeAdminPage(sceneId); } );
      });
  }

  this.addLogoutToMenu ( function(){
    jobTree.saveProjectData ( [],[],function(){ logout(sceneId); } );
  });


  // make central panel and the toolbar
  this.toolbar_div = new Widget('div');
  this.toolbar_div.element.setAttribute ( 'class','toolbox-content' );
  var toolbar = new Grid('');
  this.toolbar_div.addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, 1,0,1,1 );

  //var toolbar = this.grid.setGrid ( '',1,0,1,1 );
  var panel   = this.grid.setGrid ( '',1,1,1,1 );
  // center panel horizontally and make left- and right-most columns page margins
  // note that actual panel size is set in function resizeTreePanel() below
  this.grid.setCellSize ( '40px',''    ,1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'top' );
  this.grid.setCellSize ( '','100%' ,1,1,1,1 );
  this.grid.setCellSize ( '40px',''    ,1,2,1,1 );

  // make the toolbar
  add_btn     = toolbar.setButton ( '',image_path('add')     , 1,0,1,1 );
  moveup_btn  = toolbar.setButton ( '',image_path('moveup')  , 2,0,1,1 );
  clone_btn   = toolbar.setButton ( '',image_path('clonejob'), 3,0,1,1 );
  del_btn     = toolbar.setButton ( '',image_path('remove')  , 4,0,1,1 );
  add_rem_btn = toolbar.setButton ( '',image_path('task_remark'), 5,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       , 6,0,1,1 );
  open_btn    = toolbar.setButton ( '',image_path('openjob')  , 7,0,1,1 );
  stop_btn    = toolbar.setButton ( '',image_path('stopjob')  , 8,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       , 9,0,1,1 );
  refresh_btn = toolbar.setButton ( '',image_path('refresh')  ,10,0,1,1 );
  help_btn    = toolbar.setButton ( '',image_path('help')     ,11,0,1,1 );

  if (__admin || (__login_user=='Developer'))  {
    toolbar.setLabel ( '<hr style="border:1px dotted;"/>' ,12,0,1,1 );
    split_btn = toolbar.setButton ( '',image_path('split_page'),13,0,1,1 );
  }

  add_btn    .setSize('40px','40px').setTooltip('Add job'   ).setDisabled(true);
  //insert_btn.setSize('40px','40px').setTooltip('Insert job after selected')
  //                                                          .setDisabled(true);
  moveup_btn .setSize('40px','40px').setTooltip(
                  'Move job one position up the tree branch').setDisabled(true);
  del_btn    .setSize('40px','40px').setTooltip('Delete job').setDisabled(true);
  open_btn   .setSize('40px','40px').setTooltip('Open job'  ).setDisabled(true);
  stop_btn   .setSize('40px','40px').setTooltip('Stop job'  ).setDisabled(true);
  clone_btn  .setSize('40px','40px').setTooltip('Clone job' ).setDisabled(true);
  add_rem_btn.setSize('40px','40px').setTooltip('Add remark' ).setDisabled(true);
  refresh_btn.setSize('40px','40px').setTooltip('Refresh');
  help_btn   .setSize('40px','40px').setTooltip('Documentation');

  toolbar.setCellSize ( '' ,'42px',1 ,0 );
  toolbar.setCellSize ( '' ,'42px',2 ,0 );
  toolbar.setCellSize ( '' ,'42px',3 ,0 );
  toolbar.setCellSize ( '' ,'42px',4 ,0 );
  toolbar.setCellSize ( '' ,'42px',5 ,0 );
  toolbar.setCellSize ( '' ,'12px',6 ,0 );
  toolbar.setCellSize ( '' ,'42px',7 ,0 );
  toolbar.setCellSize ( '' ,'42px',8 ,0 );
  toolbar.setCellSize ( '' ,'12px',9 ,0 );
  toolbar.setCellSize ( '' ,'42px',10,0 );
  toolbar.setCellSize ( '' ,'42px',11,0 );
  if (split_btn)  {
    toolbar.setCellSize ( '' ,'12px',12,0 );
    toolbar.setCellSize ( '' ,'42px',13,0 );
    split_btn.setSize('40px','40px').setTooltip('Show replay project');
    split_btn.setDisabled ( true );
  }

  add_btn    .setDisabled ( true );
  //insert_btn .setDisabled ( true );
  moveup_btn .setDisabled ( true );
  refresh_btn.setDisabled ( true );

  help_btn.addOnClickListener ( function(){
    new HelpBox ( '','./html/jscofe_project.html',null );
  });
  launchHelpBox ( '','./html/jscofe_project.html',doNotShowAgain,1000 );

  this.tree_div = new Widget ( 'div' );
  this.tree_div.element.setAttribute ( 'class','tree-content' );
  jobTree = this.makeJobTree();
  this.tree_div.addWidget ( jobTree );
  panel.setWidget ( this.tree_div, 0,0,1,1 );

  this.replay_div = null;
  if (split_btn)  {

    replay_btn = panel.setButton ( '',image_path('run_project'),0,1,1,1 );
    replay_btn.setSize('40px','40px').setTooltip('Replay');
    panel.setCellSize ( '' ,'42px',0,1 );

    this.replay_div = new Widget ( 'div' );
    this.replay_div.element.setAttribute ( 'class','tree-content' );
    panel.setWidget ( this.replay_div, 0,2,1,1 );
    replay_btn.setVisible ( replay_mode );
    this.replay_div.setVisible ( replay_mode );

    split_btn.addOnClickListener ( function(){
      replay_mode = !replay_mode;
      if (replayJobTree)  {
        replayJobTree.closeAllJobDialogs();
        replayJobTree.stopTaskLoop();
        replayJobTree.delete();
        replayJobTree = null;
      }
      setButtonState();
      self.onResize ( window.innerWidth,window.innerHeight );
      var icon = image_path('split_page');
      var ttip = 'Show replay project';
      if (replay_mode)  {
        icon = image_path('single_page');
        ttip = 'Hide replay project';
        replayJobTree = self.makeReplayJobTree();
        replayJobTree.readProjectData ( 'Replay Project',
                                        function(){  // onTreeLoaded
                                          self.replay_job_tree = replayJobTree;
                                        },
                                        function(node){},  // onTreeContextMenu
                                        function(){},      // openJob,
                                        function(){}       // onTreeItemSelect
                                      );
        self.replay_div.addWidget ( replayJobTree );
      }
      split_btn.setButton('',icon).setSize('40px','40px').setTooltip(ttip);
    });

    replay_btn.addOnClickListener ( function(){
      if (replay_mode && self.replay_job_tree && jobTree)
        self.replay_job_tree.replayTree ( jobTree );
    });

  }

  (function(tree){
    refresh_btn.addOnClickListener ( function(){
      jobTree.closeAllJobDialogs();
      jobTree.stopTaskLoop();
      jobTree.delete();
      jobTree = tree.makeJobTree();
      jobTree.readProjectData ( 'Project',onTreeLoaded,onTreeContextMenu,
                                          openJob,onTreeItemSelect );
      tree.tree_div.addWidget ( jobTree );
    });
  }(this))

  this.makeLogoPanel ( 2,0,3 );

  this.onResize ( window.innerWidth,window.innerHeight );

  //  Read project data from server
  jobTree.readProjectData ( 'Project',onTreeLoaded,onTreeContextMenu,
                                      openJob,onTreeItemSelect );

}

ProjectPage.prototype = Object.create ( BasePage.prototype );
ProjectPage.prototype.constructor = ProjectPage;


ProjectPage.prototype.destructor = function ( function_ready )  {
  if (this.job_tree)  {
    this.job_tree.stopTaskLoop();
    this.job_tree.closeAllJobDialogs();
  }
  if (this.replay_job_tree)  {
    this.replay_job_tree.stopTaskLoop();
    this.replay_job_tree.closeAllJobDialogs();
  }
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
      self.updateUserRation ( data );
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
  this.replay_job_tree = null;  // for internal and external references,
                                // lock before tree is loaded
  (function(self){
    jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
      self.updateUserRation ( data );
    });
  }(this))
  return jobTree;
}


ProjectPage.prototype.onResize = function ( width,height )  {
  var h = (height - 104) + 'px';
  var w = (width-110) + 'px';
  this.toolbar_div.element.style.height = h;
  this.tree_div.element.style.height    = h;
  if (this.replay_div)  {
    if (this.replay_div.isVisible())  {
      var hw = (round(width/2,0)-75) + 'px';
      this.tree_div  .element.style.width = hw;
      this.replay_div.element.style.width = hw;
    } else
      this.tree_div.element.style.width = w;
  } else
    this.tree_div.element.style.width = w;
}

ProjectPage.prototype.getJobTree = function()  {
  return this.job_tree;
}

function makeProjectPage ( sceneId )  {
  makePage ( new ProjectPage(sceneId) );
}
