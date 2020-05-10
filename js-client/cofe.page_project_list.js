
/*
 *  =================================================================
 *
 *    13.04.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_project_list.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Project list page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */


/*
http://tablesorter.com/docs/#Introduction
https://mottie.github.io/tablesorter/docs/example-widget-filter-custom.html

https://mottie.github.io/tablesorter/docs/example-css-highlighting.html

*/

// -------------------------------------------------------------------------
// projects page class

function ProjectListPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','ProjectListPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGED IN');
    return;
  }

  var projectList   = new ProjectList();  // project list data
  this.tablesort_tbl = null;               // project list table
  var open_btn      = null;
  var add_btn       = null;
  var rename_btn    = null;
  var del_btn       = null;
  var export_btn    = null;
  var import_btn    = null;
  var demoprj_btn   = null;
  var impshare_btn  = null;
  var help_btn      = null;
  var panel         = null;
  var welcome_lbl   = null;
  var nCols         = 0;                  // column span of project table
  var table_row     = 0;                  // project list position in panel
  var self          = this;               // for reference to Base class

  function currentProjectName()  {
    return self.tablesort_tbl.selectedRow.child[0].text.split(']:').pop();
  }

  // function to save Project List
  function saveProjectList ( onDone_func )  {
    if (self.tablesort_tbl.selectedRow)  {
      projectList.current = currentProjectName();
      for (var i=0;i<projectList.projects.length;i++)  {
        var pDesc = projectList.projects[i];
        if (pDesc.name==projectList.current)  {
          pDesc.dateLastUsed = getDateString();
          break;
        }
      }
    } else  {
      projectList.current = '';
    }
    projectList.sortList = self.tablesort_tbl.getSortList();
    serverRequest ( fe_reqtype.saveProjectList,projectList,'Project List',
      function(data){
        if (onDone_func)
          onDone_func ( data );
        self.updateUserRation ( data );
      },null,'persist' );
  }

  // function to open selected Project
  var openProject = function() {
    saveProjectList ( function(data){ makeProjectPage(sceneId); });
  }

  var addProject = function() {
    var inputBox  = new InputBox  ( 'Add New Project' );
    var ibx_grid  = new Grid      ( '' );
    var name_inp  = new InputText ( '' );
    var title_inp = new InputText ( '' );
    name_inp. setStyle ( 'text',"^[A-Za-z0-9\\-\\._]+$",'project_001',
                         'Project ID should contain only latin ' +
                         'letters, numbers, undescores, dashes ' +
                         'and dots, and must start with a letter' );
    title_inp.setStyle ( 'text','','Example project',
                         'Project Name is used to give a short description ' +
                         'to aid identification of the project' );
    name_inp .setFontItalic        ( true    );
    title_inp.setFontItalic        ( true    );
    name_inp .setWidth             ( '400pt' );
    title_inp.setWidth             ( '400pt' );
    ibx_grid .setWidget            ( new Label('Project ID:'  ),0,0,1,1 );
    ibx_grid .setWidget            ( new Label('Project Name:'),1,0,1,1 );
    ibx_grid .setNoWrap            ( 0,0 );
    ibx_grid .setNoWrap            ( 1,0 );
    ibx_grid .setWidget            ( name_inp ,0,1,1,1 );
    ibx_grid .setWidget            ( title_inp,1,1,1,1 );
    inputBox .addWidget            ( ibx_grid     );
    ibx_grid .setVerticalAlignment ( 0,0,'middle' );
    ibx_grid .setVerticalAlignment ( 1,0,'middle' );

    inputBox.launch ( 'Add',function(){
      var msg = '';

      if (name_inp.getValue().length<=0)
        msg += '<b>Project ID</b> must be provided.';
      else if (name_inp.element.validity.patternMismatch)
        msg += 'Project ID should contain only latin letters, numbers,\n ' +
               'undescores, dashes and dots, and must start with a letter.';

      if (title_inp.getValue().length<=0)
        msg += '<b>Project Name</b> must be provided.<p>';

      if (msg)  {
        new MessageBox ( 'Incomplete data',
                 'New project cannot be created due to the following:<p>' +
                  msg + '<p>Please provide all needful data and try again' );
        return false;
      }

      if (projectList.addProject(name_inp.getValue(),
                                 title_inp.getValue(),getDateString()))  {
        projectList.current = name_inp.getValue();
        saveProjectList ( function(data){
          projectList.current = name_inp.getValue();
          makeProjectListTable   ();
          welcome_lbl.setVisible ( (projectList.projects.length<1) );
        });
        return true;  // close dialog
      } else  {
        new MessageBox ( 'Duplicate Project ID',
            'The Project ID chosen (<b>'+name_inp.getValue()+'</b>)<br>' +
            'is already in the list. Please choose a different Project ID.' );
        return false;  // keep dialog
      }

    });
  }

  // function to rename selected Project
  var renameProject = function() {
    var inputBox  = new InputBox ( 'Rename Project' );
    var prjName   = currentProjectName();
    var ibx_grid  = new Grid      ( '' );
    var title_inp = new InputText ( self.tablesort_tbl.selectedRow.child[1].text );
    title_inp.setStyle   ( 'text','','Example project',
                           'Project title is used to give a short description ' +
                           'to aid identification' );
    title_inp.setFontItalic        ( true    );
    title_inp.setWidth             ( '400pt' );
    ibx_grid .setLabel             ( 'Project ID:'  ,0,0,1,1 );
    ibx_grid .setLabel             ( prjName        ,0,1,1,1 ).setFontItalic(true);
    ibx_grid .setLabel             ( 'Project Name:',1,0,1,1 );
    ibx_grid .setNoWrap            ( 0,0 );
    ibx_grid .setNoWrap            ( 1,0 );
    ibx_grid .setWidget            ( title_inp,1,1,1,1 );
    inputBox .addWidget            ( ibx_grid     );
    ibx_grid .setVerticalAlignment ( 0,0,'middle' );
    ibx_grid .setVerticalAlignment ( 1,0,'middle' );

    inputBox.launch ( 'Rename',function(){
      if (title_inp.getValue().length<=0)  {
        new MessageBox ( 'No Project Name',
                 '<b>Project Name is not given</b>.<p>' +
                 'Project cannot be renamed with empty name.' );
        return false;
      }
      var pDesc = projectList.renameProject ( prjName,title_inp.getValue(),getDateString() );
      if (pDesc)  {
        projectList.current = prjName;
        serverRequest ( fe_reqtype.renameProject,pDesc,'Rename Project',
          function(data){
            saveProjectList ( function(data){ makeProjectListTable(); });
          },null,'persist' );
        return true;  // close dialog
      } else  {
        new MessageBox ( 'Project ID not found',
            'The Project ID <b>'+prjName+'</b> is not found in the list.<p>' +
            'This is program error, please report as a bug.' );
        return false;
      }
    });

  }

  var deleteProject = function() {
    var inputBox = new InputBox ( 'Delete Project' );
    var delName  = currentProjectName();
    inputBox.setText ( 'Project:<br><b><center>' + delName +
                       '</center></b><p>will be deleted. All project ' +
                       'structure and data will be lost.' +
                       '<br>Please confirm your choice.' );
    inputBox.launch ( 'Delete',function(){
      projectList.deleteProject ( delName );
      saveProjectList ( function(data){
        makeProjectListTable   ();
        welcome_lbl.setVisible ( (projectList.projects.length<1) );
      });
      return true;  // close dialog
    });
  }

  var exportProject = function() {
    if (self.tablesort_tbl.selectedRow)  {
      projectList.current = currentProjectName();
      new ExportProjectDialog ( projectList );
    } else
      new MessageBox ( 'No project selected',
                       'No project is currently selected<br>' +
                       '-- nothing to export.' );
  }

  // function to create project list table and fill it with data
  function makeProjectListTable()  {

    if (self.tablesort_tbl)
          projectList.sortList = self.tablesort_tbl.getSortList();
    else  projectList.sortList = [[5,1]];

    self.tablesort_tbl = new TableSort();
    self.tablesort_tbl.setHeaders ([
        'ID','Name',
        '<center>Disk<br>(MBytes)</center>',
        '<center>CPU<br>(hours)</center>',
        '<center>Date<br>Created</center>',
        '<center>Last<br>Opened</center>'
    ]);
    self.tablesort_tbl.setHeaderNoWrap   ( -1      );
    self.tablesort_tbl.setHeaderColWidth ( 0,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 1,'75%' );
    self.tablesort_tbl.setHeaderColWidth ( 2,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 3,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 4,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 5,'5%'  );

    panel.setWidget ( self.tablesort_tbl,table_row,0,1,nCols );
    var message = '&nbsp;<p>&nbsp;<p><h2>' +
                  'Your List of Projects is currently empty.<br>' +
                  'Press "Add" button to create a new Project<br>' +
                  'and then "Open" to open it.<p>' +
                  'You may also import an old project (using<br>' +
                  'the "Import" button) if one was previously<br>' +
                  'exported from ' + appName() + '.</h2>';
    welcome_lbl = panel.setLabel ( message.fontcolor('darkgrey'),
                                   table_row+1,0,1,nCols )
                       .setFontItalic ( true )
                       .setNoWrap();
    panel.setHorizontalAlignment ( table_row+1,0,"center" );

    if (projectList.projects.length<=0)  {

      __current_project = null;

      var trow = self.tablesort_tbl.addRow();
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      self.tablesort_tbl.createTable();
      open_btn    .setDisabled ( true  );
      add_btn     .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      rename_btn  .setDisabled ( true  );
      del_btn     .setDisabled ( true  );
      import_btn  .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      export_btn  .setDisabled ( true  );
      impshare_btn.setDisabled ( (__dormant!=0) );

    } else  {

      var selectedRow = null;
      for (var i=0;i<projectList.projects.length;i++)  {
        var trow = self.tablesort_tbl.addRow();

        var contextMenu = new ContextMenu ( trow );
        contextMenu.addItem('Open'  ,image_path('go')    ).addOnClickListener(openProject  );
        contextMenu.addItem('Rename',image_path('rename')).addOnClickListener(renameProject);
        contextMenu.addItem('Delete',image_path('remove')).addOnClickListener(deleteProject);
        contextMenu.addItem('Export',image_path('export')).addOnClickListener(exportProject);

        //contextMenu.setWidth ( '10px' );
        //contextMenu.setHeight_px ( 400 );
        //contextMenu.setZIndex ( 101 );

        var pDesc = projectList.projects[i];
        var pName = pDesc.name;
        if (('owner' in pDesc) && pDesc.owner.is_shared)
          pName = '[<b><i>' + pDesc.owner.login + '</i></b>]:' + pName;
        trow.addCell ( pName  ).setNoWrap();
        trow.addCell ( pDesc.title ).insertWidget ( contextMenu,0 );
        if (pDesc.hasOwnProperty('disk_space'))
              trow.addCell ( round(pDesc.disk_space,1) ).setNoWrap();
        else  trow.addCell ( '-:-' ).setNoWrap();
        if (pDesc.hasOwnProperty('cpu_time'))
              trow.addCell ( round(pDesc.cpu_time,4) ).setNoWrap();
        else  trow.addCell ( '-:-' ).setNoWrap();
        trow.addCell ( pDesc.dateCreated ).setNoWrap().setHorizontalAlignment('center');
        trow.addCell ( pDesc.dateLastUsed).setNoWrap().setHorizontalAlignment('center');
        //tablesort_tbl.addRow ( trow );
        if ((i==0) || (pDesc.name==projectList.current))
          selectedRow = trow;

      }

      self.tablesort_tbl.createTable();
      if (projectList.sortList)
        window.setTimeout ( function(){
          self.tablesort_tbl.applySortList ( projectList.sortList );
        },10 );
      self.tablesort_tbl.selectRow ( selectedRow );
      open_btn    .setDisabled ( false );
      add_btn     .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      rename_btn  .setDisabled ( false );
      del_btn     .setDisabled ( false );
      import_btn  .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      export_btn  .setDisabled ( false );
      impshare_btn.setDisabled ( (__dormant!=0) );

      welcome_lbl.hide();

    }

    self.tablesort_tbl.setHeaderFontSize ( '100%' );
    self.onResize ( window.innerWidth,window.innerHeight );

    self.tablesort_tbl.addSignalHandler ( 'row_dblclick',function(trow){
      openProject();
    });

  }

  function loadProjectList()  {
    //  Read list of projects from server
    serverRequest ( fe_reqtype.getProjectList,0,'Project List',function(data){
      projectList = jQuery.extend ( true, new ProjectList(),data );
      makeProjectListTable();
    },null,'persist');
  }

  function loadProjectList1()  {
    loadProjectList();
    self.getUserRation();
  }


  this.makeHeader ( 3,null );

  this.headerPanel.setCellSize ( '30%','',0,2 );
  this.headerPanel.setLabel ( 'My Projects',0,3,1,1 )
                  .setFont  ( 'times','200%',true,true )
                  .setNoWrap()
                  .setHorizontalAlignment ( 'center' );
  this.headerPanel.setCellSize ( '60%','',0,3 );
  this.headerPanel.setVerticalAlignment ( 0,3,'middle' );
  this.headerPanel.setHorizontalAlignment ( 0,3,'center' );

  // Make Main Menu
  if (!__local_user)
    this.addMenuItem ( 'My Account','settings',function(){
      saveProjectList ( function(data){ makeAccountPage(sceneId); } );
    });

  if (__user_role==role_code.admin)
    this.addMenuItem ( 'Admin Page',role_code.admin,function(){
      saveProjectList ( function(data){ makeAdminPage(sceneId); } );
    });

  if ((__user_role==role_code.developer) || (__user_role==role_code.admin))  {
    this.addMenuSeparator();
    if (__jobs_safe)
      this.addMenuItem ( 'Failed Tasks Safe','development',function(){
        new ExportFromSafeDialog ( function(){} );
      });
    this.addMenuItem ( 'Developer\'s Documentation','development',function(){
      new HelpBox ( '','./manuals/html-dev/index.html',null )
    });
  }

  this.addLogoutToMenu ( function(){
    saveProjectList ( function(data){ logout(sceneId,0); } );
  });

  var btn_width    = '30pt';
  var btn_height   = '26pt';
  var left_margin  = '18pt';
  var right_margin = '28pt';

  alert ( window.screen.width );

  if (window.screen.width<720/3*4)  {  // 720 pt to px
    // tight screen (smartphone)

    left_margin  = '2pt';
    right_margin = '22pt';

    open_btn     = new Button ( '',image_path('go')     );
    add_btn      = new Button ( '',image_path('add')    );
    rename_btn   = new Button ( '',image_path('rename') );
    del_btn      = new Button ( '',image_path('remove') );
    export_btn   = new Button ( '',image_path('export') );
    import_btn   = new Button ( '',image_path('import') );
    impshare_btn = new Button ( '',image_path('share')  );
    if (__demo_projects)  {
      demoprj_btn = new Button ( '',image_path('demoprj') );
      demoprj_btn .setWidth ( btn_width ).setHeight ( btn_height );
    }
    help_btn     = new Button ( '',image_path('help') ); //.setTooltip('Documentation' );

  } else  {

    open_btn     = new Button ( 'Open'  ,image_path('go') );
    add_btn      = new Button ( 'Add'   ,image_path('add') );
    rename_btn   = new Button ( 'Rename',image_path('rename') );
    del_btn      = new Button ( 'Delete',image_path('remove') );
    export_btn   = new Button ( 'Export',image_path('export') );
    import_btn   = new Button ( 'Import',image_path('import') );
    impshare_btn = new Button ( 'Shared',image_path('share') );
    if (__demo_projects)  {
      demoprj_btn = new Button ( 'Demo projects',image_path('demoprj') );
      demoprj_btn.setWidth ('115pt').setHeight(btn_height).setNoWrap();
    }
    help_btn   = new Button ( 'Help',image_path('help') ); //.setTooltip('Documentation' );

    btn_width = '80pt';
    /*
    open_btn    .setWidth ( '80pt' );
    add_btn     .setWidth ( '80pt' );
    rename_btn  .setWidth ( '80pt' );
    del_btn     .setWidth ( '80pt' );
    export_btn  .setWidth ( '80pt' );
    import_btn  .setWidth ( '80pt' );
    impshare_btn.setWidth ( '80pt' );
    help_btn    .setWidth ( '60pt' );
    */

  }

  open_btn    .setWidth ( btn_width ).setHeight ( btn_height );
  add_btn     .setWidth ( btn_width ).setHeight ( btn_height );
  rename_btn  .setWidth ( btn_width ).setHeight ( btn_height );
  del_btn     .setWidth ( btn_width ).setHeight ( btn_height );
  export_btn  .setWidth ( btn_width ).setHeight ( btn_height );
  import_btn  .setWidth ( btn_width ).setHeight ( btn_height );
  impshare_btn.setWidth ( btn_width ).setHeight ( btn_height );
  help_btn    .setWidth ( btn_width ).setHeight ( btn_height );

  // make panel
  panel = new Grid('');
  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( left_margin ,''    ,1,0,1,1 );
  this.grid.setWidget   ( panel              ,1,1,1,1 );
  this.grid.setCellSize ( right_margin,'100%',1,2,1,1 );

//  panel.setVerticalAlignment ( 1,0,'top' );
  panel.setVerticalAlignment ( 1,1,'middle' );

  this.makeLogoPanel ( 2,0,3 );

  //var title_lbl = new Label ( 'My Projects'  );
  //title_lbl.setFont         ( 'times','200%',true,true );

  var row = 0;
  panel.setHorizontalAlignment ( row,0,'center'    );
  panel.setCellSize            ( '','10pt',row++,0    );
  nCols = 0;
  panel.setWidget              ( open_btn    ,row,nCols++,1,1 );
  panel.setWidget              ( add_btn     ,row,nCols++,1,1 );
  panel.setWidget              ( rename_btn  ,row,nCols++,1,1 );
  panel.setWidget              ( del_btn     ,row,nCols++,1,1 );
  panel.setWidget              ( export_btn  ,row,nCols++,1,1 );
  panel.setWidget              ( import_btn  ,row,nCols++,1,1 );
  panel.setWidget              ( impshare_btn,row,nCols++,1,1 );
  if (demoprj_btn)
    panel.setWidget            ( demoprj_btn ,row,nCols++,1,1 );
  panel.setWidget              ( help_btn    ,row,nCols++,1,1  );
  //panel.setWidget              ( title_lbl, row-2,0,1,nCols  );

  for (var i=0;i<nCols-1;i++)
    panel.setCellSize ( btn_width,'',row,i );
    //panel.setCellSize ( '2%' ,'',row,i );
  panel.setCellSize            ( 'auto','',row++,nCols-1 );
  /*
  panel.setCellSize            ( '2%' ,'',row,0     );
  panel.setCellSize            ( '2%' ,'',row,1     );
  panel.setCellSize            ( '2%' ,'',row,2     );
  panel.setCellSize            ( '2%' ,'',row,3     );
  panel.setCellSize            ( '2%' ,'',row,4     );
  panel.setCellSize            ( '2%' ,'',row,5     );
  panel.setCellSize            ( '88%','',row++,5   );
  */
  open_btn  .setDisabled       ( true );
  add_btn   .setDisabled       ( true );
  rename_btn.setDisabled       ( true );
  del_btn   .setDisabled       ( true );
  import_btn.setDisabled       ( true );
  table_row = row;  // note the project list table position here

  // add a listeners to toolbar buttons
  open_btn    .addOnClickListener ( openProject   );
  add_btn     .addOnClickListener ( addProject    );
  rename_btn  .addOnClickListener ( renameProject );
  del_btn     .addOnClickListener ( deleteProject );
  export_btn  .addOnClickListener ( exportProject );
  //impshare_btn.addOnClickListener ( importSharedProject  );

  // add a listener to 'import' button
  import_btn.addOnClickListener ( function(){
    new ImportProjectDialog ( loadProjectList1 );
  });

  // add a listener to 'import' button
  impshare_btn.addOnClickListener ( function(){
    new ImportSharedProjectDialog ( loadProjectList1 );
  });

  // add a listener to 'demo project' button
  if (demoprj_btn)
    demoprj_btn.addOnClickListener ( function(){
      new ImportDemoProjectDialog ( loadProjectList1 );
    });

  help_btn.addOnClickListener ( function(){
    //new HelpBox ( '','./html/jscofe_myprojects.html',null );
    new HelpBox ( '',__user_guide_base_url + 'jscofe_myprojects.html',null );
  });

  //launchHelpBox ( '','./html/jscofe_myprojects.html',doNotShowAgain,1000 );

  //  Read list of projects from server
  loadProjectList();

}

ProjectListPage.prototype = Object.create ( BasePage.prototype );
ProjectListPage.prototype.constructor = ProjectListPage;

ProjectListPage.prototype.onResize = function ( width,height )  {
//  var h = (height - 164) + 'px';
//  this.tablesort_tbl.table_div.element.style.height = h;
  this.tablesort_tbl.fixHeader();
  this.tablesort_tbl.setTableHeight ( height-84 );
}


function makeProjectListPage ( sceneId )  {
  makePage ( new ProjectListPage(sceneId) );
  setHistoryState ( 'ProjectListPage' );
}
