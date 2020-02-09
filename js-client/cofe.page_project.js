
/*
 *  ==========================================================================
 *
 *    27.01.20   <--  Date of Last Modification.
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
      if (task)  {
        if (task.state==job_code.remark)  {
          if (jobTree.calcSelectedNodeId().length<=1)
                jobTree.selectSingle   ( child_nodes[0] );
          else  jobTree.selectMultiple ( child_nodes[0] );
        }
      }
    }
  }

  function addJob()  {
    selectRemark();
    jobTree.addJob ( false,false,self, function(){ del_btn.setDisabled ( false ); } );
  }

  function addJobRepeat()  {
    selectRemark();
    jobTree.addJob ( false,true,self, function(){ del_btn.setDisabled ( false ); } );
  }

  function insertJob()  {
    selectRemark();
    jobTree.addJob ( true,false,self, function(){ del_btn.setDisabled ( false ); } );
  }

  function addRemark()  {
    jobTree.addTask ( new TaskRemark(),true,self,
                                function(){ del_btn.setDisabled ( false ); } );
  }

  function moveJobUp()  {
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
      var is_remark   = task.isRemark();
      var add_enabled = is_remark;
      if (is_remark)  {
        var tparent = jobTree.getNonRemarkParent ( task );
        if (tparent)
          add_enabled = (tparent.state==job_code.finished);
          /*
          add_enabled = ((tparent.state==job_code.finished)  ||
                         (tparent.state==job_code.noresults) ||
                         (tparent.state==job_code.failed)    ||
                         (tparent.state==job_code.stopped));
          */
      }
      add_btn.setEnabled ( (!__dormant) &&
                           ((task.state==job_code.finished)  ||
                            //(task.state==job_code.noresults) ||
                            //(task.state==job_code.failed)    ||
                            //(task.state==job_code.stopped)   ||
                            (is_remark && add_enabled)) );
      //insert_btn.setEnabled ( add_btn.isEnabled() );
      //clone_btn  .setEnabled ( dsel && (task.state!=job_code.remark) );
      clone_btn  .setEnabled ( (!__dormant) && dsel && task.canClone(node,jobTree) );
      moveup_btn .setEnabled ( (!__dormant) && task.canMove(node,jobTree) );
      stop_btn   .setEnabled ( dsel && (task.state==job_code.running) );
      add_rem_btn.setEnabled ( (!__dormant) && (!has_remark) && (!is_remark) );
      if (is_remark)
            del_btn.setTooltip ( 'Delete remark' );
      else  del_btn.setTooltip ( 'Delete job' );
    } else  {  // root
      add_btn   .setEnabled ( !__dormant );
      //insert_btn.setEnabled ( true  );
      clone_btn .setEnabled ( false );  // dsel ???
      moveup_btn.setEnabled ( false );
      stop_btn  .setEnabled ( false );
      add_rem_btn.setEnabled ( (!__dormant) && (!has_remark) );
    }

    if (replay_btn)  {
      replay_btn.setVisible ( replay_mode );
      self.replay_div.setVisible ( replay_mode );
    }

  }

  function shareProject()  {
    if (jobTree)  {
      var inputBox  = new InputBox ( 'Share Project [' +
                                     jobTree.projectData.desc.name + ']' );
      var ibx_grid  = new Grid     ( '' );
      ibx_grid.setLabel ( '<h2>Share Project</h2>',0,0,1,1 );
      ibx_grid.setLabel ( 'The following users:<br>&nbsp;',1,0,1,1 );
      var share_inp = new InputText ( jobTree.projectData.desc.owner.share );
      share_inp.setStyle   ( 'text','','login1,login2,...',
                             'Give a comma-separated list of login names of ' +
                             'users who will be allowed to copy this project ' +
                             'in their accounts.'
                            );
      share_inp.setFontItalic ( true    );
      ibx_grid .setWidget     ( share_inp,2,0,1,1 );
      share_inp.setWidth      ( '300pt' );
      ibx_grid.setLabel       ( '&nbsp;<br>can copy this project in their accounts.',
                                3,0,1,1  );
      inputBox .addWidget     ( ibx_grid );
      inputBox.launch ( 'Apply',function(){
        var logins = share_inp.getValue();
        //alert ( logins );
        //a.split(",").map(function(item){ return item.trim(); });
        var share0 = jobTree.projectData.desc.owner.share;
        jobTree.projectData.desc.owner.share = logins;
        serverRequest ( fe_reqtype.shareProject,{
                          desc   : jobTree.projectData.desc,
                          share0 : share0
                        },'Share Project',function(data){
                          jobTree.projectData.desc = data.desc;
                          jobTree.saveProjectData ( [],[],null );
                          var msg = '<h2>Project\'s Share Status</h2>' +
                                    '<b>Shared with:</b>&nbsp;<i>';
                          if (data.desc.owner.share.length<=0)
                                msg += 'nobody';
                          else  msg += data.desc.owner.share +
                                '<br><font size="-1">(these users can import ' +
                                'the project in their accounts)</font>';
                          msg += '</i>';
                          if (data.unshared.length>0)
                            msg += '<p><b>Unshared with:</b>&nbsp;<i>' +
                                   data.unshared.join(',') + '</i>';
                          if (data.unknown.length>0)
                            msg += '<p><b>Unknown users:</b>&nbsp;<i>' +
                                   data.unknown.join(',') +
                                   '<br><font size="-1">(sharing request was not ' +
                                   'fulfilled for these users)</font></i>';
                          new MessageBox ( 'Share Project [' + data.desc.name + ']',msg );
                        },null,null );
        return true;
      });
    } else
      new MessageBox ( 'No Project','No Project loaded' );
  }

  function onTreeContextMenu(node) {
    // The default set of all items

    var items  = {};

    if (!$(add_btn.element).button('option','disabled'))  {
      items.addJobItem = { // The "Add job" menu item
        label : "Add new job",
        icon  : image_path('add'),
        action: addJob
      };
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

    if (!$(del_btn.element).button('option','disabled'))  {
      items.delJobItem = { // The "Delete job" menu item
        label : 'Delete job with ancestors',
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

    return items;

  }

  function onTreeLoaded() {

//alert ( 'on tree');

    /*
    add_btn    .setDisabled ( __dormant );
    //insert_btn .setDisabled ( false );
    moveup_btn .setDisabled ( __dormant );
    clone_btn  .setDisabled ( __dormant );
    add_rem_btn.setDisabled ( __dormant );
    */
    refresh_btn.setDisabled ( false );

    if (split_btn)
      split_btn.setEnabled ( true );

    setButtonState();

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

//    window.setTimeout ( function(){ alert('p1'); setButtonState(); },1000 );

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

  this.addMenuItem ( 'My Projects','list',function(){
    jobTree.saveProjectData ( [],[],function(){ makeProjectListPage(sceneId); });
  });

  if (!__local_user)  {
    this.addMenuItem ( 'My Account','settings',function(){
      jobTree.saveProjectData ( [],[],function(){ makeAccountPage(sceneId); });
    });
//    if (__admin)
    if (__user_role==role_code.admin)
      this.addMenuItem ( 'Admin Page',role_code.admin,function(){
        jobTree.saveProjectData ( [],[],function(){ makeAdminPage(sceneId); } );
      });
  }

  this.addMenuSeparator();

  this.addMenuItem ( 'Project settings','project_settings',function(){
    if (jobTree)
          new ProjectSettingsDialog ( jobTree,function(){
            jobTree.saveProjectData ( [],[],null );
          });
    else  new MessageBox ( 'No Project','No Project loaded' );
  });

  this.addMenuItem ( 'Share Project','share',shareProject );

  this.addLogoutToMenu ( function(){
    jobTree.saveProjectData ( [],[],function(){ logout(sceneId,0); } );
  });


  // make central panel and the toolbar
  this.toolbar_div = new Widget('div');
  this.toolbar_div.element.setAttribute ( 'class','toolbox-content' );
  var toolbar = new Grid('');
  this.toolbar_div.addWidget ( toolbar );
  this.grid.setWidget ( this.toolbar_div, 1,0,1,1 );

  //var toolbar = this.grid.setGrid ( '',1,0,1,1 );
  var panel = this.grid.setGrid ( '',1,1,1,1 );
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

//  if (__admin || (__login_user=='Developer'))  {
  if ((__user_role==role_code.admin) || (__user_role==role_code.developer))  {
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
  clone_btn  .setDisabled ( true );
  add_rem_btn.setDisabled ( true );
  refresh_btn.setDisabled ( true );

  help_btn.addOnClickListener ( function(){
    new HelpBox ( '','./html/jscofe_project.html',null );
  });
  //launchHelpBox ( '','./html/jscofe_project.html',doNotShowAgain,1000 );

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
      alert ( 'Feature is not functional' );
      /*
      if (replay_mode && self.replay_job_tree && jobTree)
        self.replay_job_tree.replayTree ( jobTree );
      */
    });

  }

  (function(tree){
    refresh_btn.addOnClickListener ( function(){
      var scrollPos = jobTree.parent.getScrollPosition();
      jobTree.closeAllJobDialogs();
      jobTree.stopTaskLoop();
      jobTree.delete();
      jobTree = tree.makeJobTree();
      jobTree.readProjectData ( 'Project',function(){
         onTreeLoaded();
         jobTree.parent.setScrollPosition ( scrollPos );
         //tree.tree_div.setScrollPosition ( scrollPos );
       },onTreeContextMenu,openJob,onTreeItemSelect );
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
  var w = (width  - 110) + 'px';
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
  setHistoryState ( 'ProjectPage' );
  //__current_project
}
