
/*
 *  =================================================================
 *
 *    05.07.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
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
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// projects page class

function ProjectPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGGED IN');
    return;
  }

  this.job_tree  = null;  // for external references

  var title_lbl   = null;
  var jobTree     = null;  // == this.job_tree, for internal references
  var add_btn     = null;
  //var insert_btn  = null;
  var moveup_btn  = null;
  var del_btn     = null;
  var open_btn    = null;
  var stop_btn    = null;
  var clone_btn   = null;
  var refresh_btn = null;
  var help_btn    = null;
  var split_btn   = null;
  var self        = this;  // for referencing class's properties

  function addJob ()  {
    jobTree.addJob ( false,self, function() { del_btn.setDisabled ( false ); } );
  }

  function insertJob ()  {
    jobTree.addJob ( true,self, function() { del_btn.setDisabled ( false ); } );
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

    if (node)
      dsel = (node.parentId!=null);
    open_btn .setEnabled ( dsel );
    del_btn  .setEnabled ( dsel );
    clone_btn.setEnabled ( dsel );

    if (task)  {
      add_btn.setEnabled ( (task.state==job_code.finished) ||
                           (task.state==job_code.failed)   ||
                           (task.state==job_code.stopped) );
      //insert_btn.setEnabled ( add_btn.isEnabled() );
      moveup_btn.setEnabled ( task.canMove(node,jobTree) );
      stop_btn  .setEnabled ( dsel && (task.state==job_code.running) );
    } else  {  // root
      add_btn   .setEnabled ( true  );
      //insert_btn.setEnabled ( true  );
      moveup_btn.setEnabled ( false );
      stop_btn  .setEnabled ( false );
    }

  }


  function onTreeContextMenu(node) {
    // The default set of all items

    var items = {};

    if (!$(add_btn.element).button('option','disabled'))  {
      items.addJobItem = { // The "Add job" menu item
        label : "Add job",
        icon  : './images/add_20x20.svg',
        action: addJob
      };
    }

    /*
    if (!$(insert_btn.element).button('option','disabled'))  {
      items.insertJobItem = { // The "Add job" menu item
        label : "Insert job",
        icon  : './images/insert_20x20.png',
        action: insertJob
      };
    }
    */

    if (!$(moveup_btn.element).button('option','disabled'))  {
      items.moveJobUpItem = { // The "Add job" menu item
        label : "Move up",
        icon  : './images/moveup_20x20.svg',
        action: moveJobUp
      };
    }

    if (!$(clone_btn.element).button('option','disabled'))  {
      items.cloneJobItem = { // The "Clone job" menu item
        label : "Clone job",
        icon  : './images/clonejob_20x20.svg',
        action: cloneJob
      };
    }

    if (!$(del_btn.element).button('option','disabled'))  {
      items.delJobItem = { // The "Delete job" menu item
        label : "Delete job",
        icon  : './images/remove_20x20.svg',
        action: deleteJob
      };
    }

    if (!$(open_btn.element).button('option','disabled'))  {
      items.runJobItem = { // The "Open job" menu item
        label : "Open job",
        icon  : './images/openjob_20x20.svg',
        action: openJob
      };
    }

    if (!$(stop_btn.element).button('option','disabled'))  {
      items.stopJobItem = { // The "Stop job" menu item
        label : "Stop job",
        icon  : './images/stopjob_20x20.svg',
        action: stopJob
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
    add_btn   .addOnClickListener ( addJob    );
    //insert_btn.addOnClickListener ( insertJob );
    moveup_btn.addOnClickListener ( moveJobUp );
    del_btn   .addOnClickListener ( deleteJob );
    open_btn  .addOnClickListener ( openJob   );
    stop_btn  .addOnClickListener ( stopJob   );
    clone_btn .addOnClickListener ( cloneJob  );
    title_lbl .setText ( jobTree.projectData.desc.title );

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
  var prjlist_mi = this.headerPanel.menu.addItem('My Projects','./images/list.svg');

  // set menu listeners
  prjlist_mi.addOnClickListener ( function(){
    jobTree.saveProjectData ( [],[],null );
    makeProjectListPage   ( sceneId );
  });

  if (!__local_user)  {

    var account_mi = this.headerPanel.menu.addItem('My Account' ,'./images/settings.svg');
    var admin_mi   = null;
    if (__admin)
      admin_mi   = this.headerPanel.menu.addItem('Admin Page','./images/admin.png');

    account_mi.addOnClickListener ( function(){
      jobTree.saveProjectData ( [],[],null );
      makeAccountPage       ( sceneId );
    });

    if (admin_mi)
      admin_mi.addOnClickListener ( function(){
        jobTree.saveProjectData ( [],[],function(){ makeAdminPage(sceneId); } );
      });
  }

  this.headerPanel.menu.addSeparator ();
  var logout_mi  = this.headerPanel.menu.addItem('Log out'    ,'./images/logout.svg');

  logout_mi.addOnClickListener ( function(){
    jobTree.saveProjectData ( [],[],function(){ logout(sceneId); } );
  });


  // make central panel and the toolbar
  var toolbar = this.grid.setGrid ( '',1,0,1,1 );
  var panel   = this.grid.setGrid ( '',1,1,1,1 );
  // center panel horizontally and make left- and right-most columns page margins
  // note that actual panel size is set in function resizeTreePanel() below
  this.grid.setCellSize ( '40px',''    ,1,0,1,1 );
  this.grid.setVerticalAlignment ( 1,1,'top' );
  this.grid.setCellSize ( '','100%' ,1,1,1,1 );
  this.grid.setCellSize ( '0px',''    ,1,2,1,1 );

  // make the toolbar
  add_btn     = toolbar.setButton ( '','./images/add.svg'     , 1,0,1,1 );
  //insert_btn  = toolbar.setButton ( '','./images/insert.png'   2,0,1,1 );
  moveup_btn  = toolbar.setButton ( '','./images/moveup.svg'  , 2,0,1,1 );
  clone_btn   = toolbar.setButton ( '','./images/clonejob.svg', 3,0,1,1 );
  del_btn     = toolbar.setButton ( '','./images/remove.svg'  , 4,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       , 5,0,1,1 );
  open_btn    = toolbar.setButton ( '','./images/openjob.svg' , 6,0,1,1 );
  stop_btn    = toolbar.setButton ( '','./images/stopjob.svg' , 7,0,1,1 );
  toolbar.setLabel ( '<hr style="border:1px dotted;"/>'       , 8,0,1,1 );
  refresh_btn = toolbar.setButton ( '','./images/refresh.svg' , 9,0,1,1 );
  help_btn    = toolbar.setButton ( '','./images/help.svg'    ,10,0,1,1 );

  if (__admin || __login_user)  {
    toolbar.setLabel ( '<hr style="border:1px dotted;"/>' ,11,0,1,1 );
    split_btn = toolbar.setButton ( '','./images/split_page.svg',12,0,1,1 );
  }


  add_btn   .setSize('40px','40px').setTooltip('Add job'   ).setDisabled(true);
  //insert_btn.setSize('40px','40px').setTooltip('Insert job after selected')
  //                                                          .setDisabled(true);
  moveup_btn .setSize('40px','40px').setTooltip(
                  'Move job one position up the tree branch').setDisabled(true);
  del_btn    .setSize('40px','40px').setTooltip('Delete job').setDisabled(true);
  open_btn   .setSize('40px','40px').setTooltip('Open job'  ).setDisabled(true);
  stop_btn   .setSize('40px','40px').setTooltip('Stop job'  ).setDisabled(true);
  clone_btn  .setSize('40px','40px').setTooltip('Clone job' ).setDisabled(true);
  refresh_btn.setSize('40px','40px').setTooltip('Refresh');
  help_btn   .setSize('40px','40px').setTooltip('Documentation');

  toolbar.setCellSize ( '' ,'42px',1 ,0 );
  //toolbar.setCellSize ( '' ,'42px',2 ,0 );
  toolbar.setCellSize ( '' ,'42px',2 ,0 );
  toolbar.setCellSize ( '' ,'42px',3 ,0 );
  toolbar.setCellSize ( '' ,'42px',4 ,0 );
  toolbar.setCellSize ( '' ,'42px',6 ,0 );
  toolbar.setCellSize ( '' ,'42px',7 ,0 );
  toolbar.setCellSize ( '' ,'42px',9 ,0 );
  toolbar.setCellSize ( '' ,'42px',10,0 );
  if (split_btn)  {
    toolbar.setCellSize   ( '' ,'42px',12,0 );
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

  // set the job tree
  this._makeJobTree = function()  {
    jobTree = new JobTree ();
    jobTree.element.style.paddingTop    = '0px';
    jobTree.element.style.paddingBottom = '25px';
    jobTree.element.style.paddingRight  = '40px';
    this.job_tree = jobTree;  // for external references
    //(function(self){
      jobTree.addSignalHandler ( cofe_signals.rationUpdated,function(data){
//        console.log ( data );
        self.updateUserRation ( data );
      });
    //}(this));
  }

  this.div  = new Widget ( 'div' );
  this.div.element.setAttribute ( 'class','tree-content' );
  this._makeJobTree();
  this.div.addWidget ( jobTree );

  panel.setWidget ( this.div, 0,0,1,1 );

  (function(tree){
    refresh_btn.addOnClickListener ( function(){
      jobTree.closeAllJobDialogs();
      jobTree.stopTaskLoop();
      //tree.div.removeChild ( jobTree );
      jobTree.delete();
      tree._makeJobTree();
      jobTree.readProjectData ( 'Project',onTreeLoaded,onTreeContextMenu,
                                          openJob,onTreeItemSelect );
      tree.div.addWidget ( jobTree );
    });
  }(this))

  this.makeLogoPanel ( 2,0,3 );

  this.onResize ( window.innerWidth,window.innerHeight );

  /*
  // make tree panel resizeable
  function resizeTreePanel() {
    // this resizes the tab bar when window is resized by user
    var h = $(window).innerHeight() - 104;
    var w = $(window).innerWidth () - 110;
      div.element.style.height = h + 'px';
      div.element.style.width  = w + 'px';
  }

  // size tree panel initially
  resizeTreePanel();

  // set tree panel resizer
  $(window).resize ( resizeTreePanel );
  */

  //  Read project data from server
  jobTree.readProjectData ( 'Project',onTreeLoaded,onTreeContextMenu,
                                      openJob,onTreeItemSelect );

}

ProjectPage.prototype = Object.create ( BasePage.prototype );
ProjectPage.prototype.constructor = ProjectPage;


ProjectPage.prototype.destructor = function ( function_ready )  {
  this.getJobTree().stopTaskLoop();
  this.getJobTree().closeAllJobDialogs();
  BasePage.prototype.destructor.call ( this,function_ready );
}

ProjectPage.prototype.onResize = function ( width,height )  {
  this.div.element.style.height = (height - 104) + 'px';
  this.div.element.style.width  = (width  - 110) + 'px';
}

ProjectPage.prototype.getJobTree = function()  {
  return this.job_tree;
}

function makeProjectPage ( sceneId )  {
  makePage ( new ProjectPage(sceneId) );
}
