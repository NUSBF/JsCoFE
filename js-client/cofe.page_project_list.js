
/*
 *  =================================================================
 *
 *    12.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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
  var tablesort_tbl = null;               // project list table
  var open_btn      = null;
  var add_btn       = null;
  var del_btn       = null;
  var export_btn    = null;
  var import_btn    = null;
  var help_btn      = null;
  var panel         = null;
  var welcome_lbl   = null;
  var table_row     = 0;                  // project list position in panel
  var self          = this;               // for reference to Base class

  // function to save Project List
  function saveProjectList ( onDone_func )  {
    if (tablesort_tbl.selectedRow)  {
      projectList.current = tablesort_tbl.selectedRow.child[0].text;
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
    projectList.sortList = tablesort_tbl.getSortList();
    serverRequest ( fe_reqtype.saveProjectList,projectList,'Project List',
      function(data){
        if (onDone_func)
          onDone_func ( data );
        self.updateUserRation ( data );
      },null,'persist' );
  }

  // function to open selected Project
  var openProject = function() {
    saveProjectList ( null );
    makeProjectPage ( sceneId );
  }

  // function to create project list table and fill it with data
  function makeProjectListTable()  {

    if (tablesort_tbl)
      projectList.sortList = tablesort_tbl.getSortList();

    tablesort_tbl = new TableSort();
    tablesort_tbl.setHeaders ([
        'Name','Title',
        '<center>Disk<br>(MBytes)</center>',
        '<center>CPU<br>(hours)</center>',
        '<center>Date<br>Created</center>',
        '<center>Date<br>Last Opened</center>'
    ]);
    tablesort_tbl.setHeaderNoWrap   ( -1      );
    tablesort_tbl.setHeaderColWidth ( 1,'80%' );
    panel.setWidget ( tablesort_tbl,table_row,0,1,6 );
    var message = '&nbsp;<p>&nbsp;<p><h2>' +
                  'Your List of Projects is currently empty.<br>' +
                  'Press "Add" button to create a new Project<br>' +
                  'and then "Open" to open it.<p>' +
                  'You may also import an old project (using<br>' +
                  'the "Import" button) if one was previously<br>' +
                  'exported from ' + appName() + '.</h2>';
    welcome_lbl = panel.setLabel ( message.fontcolor('darkgrey'),
                                   table_row+1,0,1,6 )
                       .setFontItalic ( true )
                       .setNoWrap ( true );
    panel.setHorizontalAlignment ( table_row+1,0,"center" );

    if (projectList.projects.length<=0)  {

      var trow = tablesort_tbl.addRow();
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      trow.addCell ( '' );
      tablesort_tbl.createTable();
      open_btn  .setDisabled ( true  );
      add_btn   .setDisabled ( false );
      del_btn   .setDisabled ( true  );
      export_btn.setDisabled ( true  );
//      unsetDefaultButton   ( open_btn,panel );
//      setDefaultButton     ( add_btn,panel  );

    } else  {

      var selectedRow = null;
      for (var i=0;i<projectList.projects.length;i++)  {
        var trow = tablesort_tbl.addRow();
        var pDesc = projectList.projects[i];
        trow.addCell ( pDesc.name        ).setNoWrap();
        trow.addCell ( pDesc.title       );
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
      tablesort_tbl.createTable();
      if (projectList.sortList)
        tablesort_tbl.applySortList ( projectList.sortList );
      tablesort_tbl.selectRow ( selectedRow );
      open_btn.setDisabled ( false );
      add_btn .setDisabled ( false );
      del_btn .setDisabled ( false );
//      unsetDefaultButton ( add_btn ,panel );
//      setDefaultButton   ( open_btn,panel );
      welcome_lbl.hide();

    }

    tablesort_tbl.setHeaderFontSize ( '100%' );

    tablesort_tbl.addSignalHandler ( 'row_dblclick',function(trow){
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
  // Make Main Menu
  if (!__local_user)  {

    var account_mi = this.headerPanel.menu.addItem('My Account',image_path('settings') );
    var admin_mi   = null;
    if (__admin)
      admin_mi = this.headerPanel.menu.addItem('Admin Page',image_path('admin') );

    account_mi.addOnClickListener ( function(){
      saveProjectList ( function(data){ makeAccountPage(sceneId); } );
    });

    if (admin_mi)
      admin_mi.addOnClickListener ( function(){
        saveProjectList ( function(data){ makeAdminPage(sceneId); } );
      });

    //this.headerPanel.menu.addSeparator ();

  }

  //this.addFullscreenToMenu();
  this.addLogoutToMenu ( function(){
    saveProjectList ( function(data){ logout(sceneId); } );
  });

  // make panel
  panel = new Grid('');
  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( '40pt',''    ,1,0,1,1 );
  this.grid.setWidget   ( panel        ,1,1,1,1 );
  this.grid.setCellSize ( '40pt','100%',1,2,1,1 );

//  panel.setVerticalAlignment ( 1,0,'top' );
  panel.setVerticalAlignment ( 1,1,'middle' );

  this.makeLogoPanel ( 2,0,3 );

  var title_lbl = new Label ( 'My Projects'  );
  title_lbl.setFont         ( 'times','200%',true,true );

  open_btn   = new Button ( 'Open'  ,image_path('go_20x20') );
  add_btn    = new Button ( 'Add'   ,image_path('add_20x20') );
  del_btn    = new Button ( 'Delete',image_path('remove_20x20') );
  export_btn = new Button ( 'Export',image_path('export_20x20') );
  import_btn = new Button ( 'Import',image_path('import_20x20') );
  help_btn   = new Button ( 'Help'  ,image_path('help') ).setTooltip('Documentation' );
  open_btn  .setWidth     ( '80pt' );
  add_btn   .setWidth     ( '80pt' );
  del_btn   .setWidth     ( '80pt' );
  export_btn.setWidth     ( '80pt' );
  import_btn.setWidth     ( '80pt' );
  help_btn  .setWidth     ( '80pt' );

  var row = 0;
  panel.setWidget              ( title_lbl, row,0,1,6 );
  panel.setHorizontalAlignment ( row++ ,0,'center'    );
  panel.setCellSize            ( '','10pt',row++,0    );
  panel.setWidget              ( open_btn  ,row,0,1,1 );
  panel.setWidget              ( add_btn   ,row,1,1,1 );
  panel.setWidget              ( del_btn   ,row,2,1,1 );
  panel.setWidget              ( export_btn,row,3,1,1 );
  panel.setWidget              ( import_btn,row,4,1,1 );
  panel.setWidget              ( help_btn  ,row,5,1,1 );
  panel.setCellSize            ( '2%' ,'',row,0     );
  panel.setCellSize            ( '2%' ,'',row,1     );
  panel.setCellSize            ( '2%' ,'',row,2     );
  panel.setCellSize            ( '2%' ,'',row,3     );
  panel.setCellSize            ( '2%' ,'',row,4     );
  panel.setCellSize            ( '2%' ,'',row,5     );
  panel.setCellSize            ( '88%','',row++,5   );
  open_btn.setDisabled         ( true );
  add_btn .setDisabled         ( true );
  del_btn .setDisabled         ( true );
  table_row = row;  // note the project list table position here

  // add a listener to 'open' button
  open_btn.addOnClickListener ( openProject );

  // add a listener to 'add' button
  add_btn.addOnClickListener ( function(){
    var inputBox  = new InputBox  ( 'Add New Project' );
    var ibx_grid  = new Grid      ( '' );
    var name_inp  = new InputText ( '' );
    var title_inp = new InputText ( '' );
    name_inp. setStyle ( 'text',"^[A-Za-z0-9\\-\\._]+$",'project_001',
                         'Project name should contain only latin ' +
                         'letters, numbers, undescores, dashes ' +
                         'and dots, and must start with a letter' );
    title_inp.setStyle ( 'text','','Example project',
                         'Project title is used to give a short description ' +
                         'to aid identification' );
    name_inp .setFontItalic        ( true    );
    title_inp.setFontItalic        ( true    );
    name_inp .setWidth             ( '400pt' );
    title_inp.setWidth             ( '400pt' );
    ibx_grid .setWidget            ( new Label('Project name:' ),0,0,1,1 );
    ibx_grid .setWidget            ( new Label('Project title:'),1,0,1,1 );
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
        msg += '<b>Project name</b> must be provided.';
      else if (name_inp.element.validity.patternMismatch)
        msg += 'Project name should contain only latin letters, numbers,\n ' +
               'undescores, dashes and dots, and must start with a letter.';

      if (title_inp.getValue().length<=0)
        msg += '<b>Project title</b> must be provided.<p>';

      if (msg)  {
        new MessageBox ( 'Incomplete data',
                 'New project cannot be created due to the following:<p>' +
                  msg + '<p>Please provide all needful data and try again' );
        return false;
      }

      if (projectList.addProject(name_inp.getValue(),
                                 title_inp.getValue(),getDateString()))  {
        projectList.current = name_inp.getValue();
        makeProjectListTable   ();
        saveProjectList        ( null );
        welcome_lbl.setVisible ( (projectList.projects.length<1) );
        return true;  // close dialog
      } else  {
        new MessageBox ( 'Duplicate Name',
            'The Project Name chosen (<b>'+name_inp.getValue()+'</b>)<br>' +
            'is already in the list. Please choose a different name.' );
        return false;  // keep dialog
      }

    });
  });

  // add a listener to 'delete' button
  del_btn.addOnClickListener ( function(){
    var inputBox = new InputBox ( 'Delete Project' );
    var delName  = tablesort_tbl.selectedRow.child[0].text;
    inputBox.setText ( 'Project:<br><b><center>' + delName +
                       '</center></b><p>will be deleted. All project ' +
                       'structure and data will be lost.' +
                       '<br>Please confirm your choice.' );
    inputBox.launch ( 'Delete',function(){
      projectList.deleteProject ( delName );
      makeProjectListTable   ();
      saveProjectList        ( null );
      welcome_lbl.setVisible ( (projectList.projects.length<1) );
      return true;  // close dialog
    });
  });

  // add a listener to 'export' button
  export_btn.addOnClickListener ( function(){
    if (tablesort_tbl.selectedRow)  {
      projectList.current = tablesort_tbl.selectedRow.child[0].text;
      new ExportProjectDialog ( projectList );
    } else
      new MessageBox ( 'No project selected',
                       'No project is currently selected<br>' +
                       '-- nothing to export.' );
  });

  // add a listener to 'import' button
  import_btn.addOnClickListener ( function(){
    new ImportProjectDialog ( loadProjectList1 );
  });

  help_btn.addOnClickListener ( function(){
    new HelpBox ( '','./html/jscofe_myprojects.html',null );
  });

  launchHelpBox ( '','./html/jscofe_myprojects.html',doNotShowAgain,1000 );

  //  Read list of projects from server
  loadProjectList();

}

ProjectListPage.prototype = Object.create ( BasePage.prototype );
ProjectListPage.prototype.constructor = ProjectListPage;

function makeProjectListPage ( sceneId )  {
  makePage ( new ProjectListPage(sceneId) );
}
