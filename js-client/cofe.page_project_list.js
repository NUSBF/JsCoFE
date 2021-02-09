
/*
 *  =================================================================
 *
 *    06.02.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
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

  var projectList = new ProjectList();  // project list data
  this.tablesort_tbl = null;            // project list table
  var open_btn    = null;
  var add_btn     = null;
  var rename_btn  = null;
  var del_btn     = null;
  var export_btn  = null;
  var import_btn  = null;
  var demoprj_btn = null;
  var join_btn    = null;
  var help_btn    = null;
  var panel       = null;
  var welcome_lbl = null;
  var nCols       = 0;                  // column span of project table
  var table_row   = 0;                  // project list position in panel
  var self        = this;               // for reference to Base class

  function currentProjectName()  {
    return self.tablesort_tbl.selectedRow.child[0].text.split(':</b>').pop();
  }

  function getCurrentProjectDesc()  {
    var pname = currentProjectName();
    var pdesc = null;
    for (var i=0;(i<projectList.projects.length) && (!pdesc);i++)
      if (projectList.projects[i].name==pname)
        pdesc = projectList.projects[i];
    return pdesc;
  }

  function getCurrentProjectNo()  {
    var pname = currentProjectName();
    var pno = -1;
    for (var i=0;(i<projectList.projects.length) && (pno<0);i++)
      if (projectList.projects[i].name==pname)
        pno = i;
    return pno;
  }

  function isCurrentProjectShared()  {
    var pdesc = getCurrentProjectDesc();
    if (pdesc)
      return (pdesc.owner.share.length>0);
    return false;
//    return (self.tablesort_tbl.selectedRow.child[0].text.indexOf(']:</b>')>=0);
  }

  function isCurrentProjectOwned ( check_author )  {
    var pdesc = getCurrentProjectDesc();
    if (pdesc)  {
      var owner = pdesc.owner.login;
      if (check_author && ('author' in pdesc.owner))
        owner = pdesc.owner.author;
      return (owner==__login_id);
    }
    return false;
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
        self.updateUserRationDisplay ( data );
      },null,'persist' );
  }

  // function to open selected Project
  var openProject = function() {
    saveProjectList ( function(data){ makeProjectPage(sceneId); });
  }

  var addProject = function() {
    new AddProjectDialog ( projectList,function(pspecs){
      if (pspecs)  {
        if (projectList.addProject(pspecs.id,pspecs.title,
                                   pspecs.startmode,getDateString()))  {
          projectList.current   = pspecs.id;
          projectList.startmode = pspecs.startmode;
          makeProjectListTable();
          openProject();
          /* -- this part for not opening the project automatically
          saveProjectList ( function(data){
            projectList.current = pspecs.id;
            makeProjectListTable   ();
            welcome_lbl.setVisible ( (projectList.projects.length<1) );
          });
          */
          return true;  // close dialog
        } else  {
          new MessageBox ( 'Duplicate Project ID',
              'The Project ID chosen (<b>' + pspecs.id + '</b>)<br>' +
              'is already in the list. Please choose a different Project ID.' );
          return false;  // keep dialog
        }
      }
    });
  }

  /*
  var addProject = function() {
    var inputBox  = new InputBox  ( 'Add New Project' );
    var ibx_grid  = new Grid      ( '' );
    var name_inp  = new InputText ( '' );
    var title_inp = new InputText ( '' );
    //name_inp. setStyle ( 'text',"^[A-Za-z0-9\\-\\._]+$",'project_001',
    //                     'Project ID should contain only latin ' +
    //                     'letters, numbers, undescores, dashes ' +
    //                     'and dots, and must start with a letter' );
    //title_inp.setStyle ( 'text','','Example project',
    //                     'Project Name is used to give a short description ' +
    //                     'to aid identification of the project' );
    name_inp. setStyle ( 'text',"^[A-Za-z0-9\\-\\._]+$",'e.g., project_001','' );
    title_inp.setStyle ( 'text','','Put a descriptive title here','' );
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
      var msg = [];

      if (name_inp.getValue().length<=0)
        msg.push ( '<b>Project ID</b> must be provided.' );
      else if (name_inp.element.validity.patternMismatch)
        msg.push ( '<b>Project ID</b> should contain only latin letters, ' +
                   'numbers, undescores,<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                   '&nbsp;&nbsp;&nbsp;&nbsp;dashes and dots, and must start ' +
                   'with a letter.' );

      if (title_inp.getValue().length<=0)
        msg.push ( '<b>Project Name</b> must be provided.<p>' );

      if (msg.length>0)  {
        new MessageBox ( 'Incomplete data',
                 'New project cannot be created due to the following:<p>' +
                  msg.join('<br>') +
                  '<p>Please provide all needful data in correct format<br>' +
                  'and try again' );
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
  */

  // function to rename selected Project
  var renameProject = function() {
    panel.click();  // get rid of context menu

    if (isCurrentProjectShared())  {

      if (isCurrentProjectOwned(true))  {
        new MessageBox ( 'Rename Project',
            '<h2>Rename Project</h2>' +
            'You cannot rename this project because it was shared with other ' +
            'users.'
        );
      } else  {
        new MessageBox ( 'Insufficient privileges',
            '<h2>Insufficient privileges</h2>' +
            'You cannot rename this project because it was shared with you.' +
            '<p>Projects can be renamed only by their owners.'
        );
      }

    } else  {

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

  }

  var deleteProject = function()  {
    panel.click();  // get rid of context menu
    var delName    = currentProjectName();
    var delMessage = '';
    var btnName    = 'Delete';
    var dlgTitle   = 'Delete Project';
    if (isCurrentProjectOwned(false))  {
      delMessage = '<h2>Delete Project</h2>' +
                   'Project: <b>' + delName +
                   '</b><p>will be deleted. All project ' +
                   'structure and data will be lost.' +
                   '<p>Please confirm your choice.';
    } else  {
      delMessage = '<h2>Unjoin Project</h2>' +
                   'Project, shared with you: <b>' + delName +
                   '</b><p>will be unjoined, and you will be no ' +
                   'longer able to access it<br>until joined again.' +
                   '<p>Please confirm your choice.';
      btnName    = 'Unjoin';
      dlgTitle   = 'Unjoin Project';
    }
    /*
    if (isCurrentProjectShared())  {
      delMessage = '<h2>Unjoin Project</h2>' +
                   'Project, shared with you: <b>' + delName +
                   '</b><p>will be unjoined, and you will be no ' +
                   'longer able to access it<br>until joined again.' +
                   '<p>Please confirm your choice.';
      btnName    = 'Unjoin';
      dlgTitle   = 'Unjoin Project';
    } else  {
      delMessage = '<h2>Delete Project</h2>' +
                   'Project: <b>' + delName +
                   '</b><p>will be deleted. All project ' +
                   'structure and data will be lost.' +
                   '<p>Please confirm your choice.';
    }
    */
    var inputBox   = new InputBox ( dlgTitle );
    inputBox.setText ( delMessage );
    inputBox.launch ( btnName,function(){
      projectList.deleteProject ( delName );
      saveProjectList ( function(data){
        makeProjectListTable   ();
        welcome_lbl.setVisible ( (projectList.projects.length<1) );
        self.getUserRation();
      });
      return true;  // close dialog
    });
  }

  var exportProject = function() {
    panel.click();  // get rid of context menu
    if (self.tablesort_tbl.selectedRow)  {
      projectList.current = currentProjectName();
      new ExportProjectDialog ( projectList );
    } else
      new MessageBox ( 'No project selected',
                       'No project is currently selected<br>' +
                       '-- nothing to export.' );
  }

  var sharePrj = function() {
    panel.click();  // get rid of context menu
    var pno = getCurrentProjectNo();
    if (pno>=0)  {
      shareProject ( projectList.projects[pno],function(desc){
        if (desc)  {
          projectList.projects[pno] = desc;
          saveProjectList ( function(data){} );
        }
      });
    } else
      new MessageBox ( 'No Project','No Project selected' );
  }

  // function to create project list table and fill it with data
  function makeProjectListTable()  {

    if (self.tablesort_tbl)
          projectList.sortList = self.tablesort_tbl.getSortList();
    else  projectList.sortList = [[5,1]];

    self.tablesort_tbl = new TableSort();
    self.tablesort_tbl.setHeaders ([
        'ID','Name',
        '<center>R<sub>free</sub></center>',
        '<center>Disk<br>(MBytes)</center>',
        '<center>CPU<br>(hours)</center>',
        '<center>Date<br>Created</center>',
        '<center>Last<br>Opened</center>'
    ]);
    /*
    self.tablesort_tbl.setHeaderNoWrap   ( -1      );
    self.tablesort_tbl.setHeaderColWidth ( 0,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 1,'75%' );
    self.tablesort_tbl.setHeaderColWidth ( 2,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 3,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 4,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 5,'5%'  );
    */

    panel.setWidget ( self.tablesort_tbl,table_row,0,1,nCols );
    var message = '&nbsp;<p>&nbsp;<p><h2>' +
                  'Your List of Projects is currently empty.<br>'  +
                  'Press "Add" button to create a new Project<br>' +
                  'and then "Open" to open it.<p>' +
                  'You may also import an old project (using<br>'  +
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
      trow.addCell ( '' );
      self.tablesort_tbl.createTable();
      open_btn  .setDisabled ( true  );
      add_btn   .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      rename_btn.setDisabled ( true  );
      del_btn   .setDisabled ( true  );
      import_btn.setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      export_btn.setDisabled ( true  );
      join_btn  .setDisabled ( (__dormant!=0) );

    } else  {

      var selectedRow = null;
      for (var i=0;i<projectList.projects.length;i++)  {
        var trow = self.tablesort_tbl.addRow();

        var contextMenu = new ContextMenu ( trow );
        contextMenu.addItem('Open'  ,image_path('go')    ).addOnClickListener(openProject  );
        contextMenu.addItem('Rename',image_path('rename')).addOnClickListener(renameProject);
        contextMenu.addItem('Delete',image_path('remove')).addOnClickListener(deleteProject);
        contextMenu.addItem('Export',image_path('export')).addOnClickListener(exportProject);
        contextMenu.addItem('Share' ,image_path('share') ).addOnClickListener(sharePrj     );

        //contextMenu.setWidth ( '10px' );
        //contextMenu.setHeight_px ( 400 );
        //contextMenu.setZIndex ( 101 );

        var pDesc = projectList.projects[i];
        var pName = pDesc.name;

        // when list of projects is served from FE, shared record is removed
        // in case of owner's login
        var joined = ['','',''];
        if ('owner' in pDesc)  {
          if (pDesc.owner.share.length>0)  {
            if (pDesc.owner.login!=__login_id)  {
              joined = ['<i>','</i>',"is not included in user\'s quota"];
              pName  = '<b>[<i>' + pDesc.owner.login  + '</i>]:</b>' + pName;
            }
          } else if (('author' in pDesc.owner) &&
                     (pDesc.owner.author!=pDesc.owner.login) &&
                     (pDesc.owner.author!=__login_id))
            pName  = '<b>(<i>' + pDesc.owner.author + '</i>):</b>' + pName;
        }
        trow.addCell ( pName  ).setNoWrap();
        trow.addCell ( pDesc.title ).insertWidget ( contextMenu,0 );
        if (('metrics' in pDesc) && ('R_free' in pDesc.metrics)
                                 && (pDesc.metrics.R_free<'1.0'))  {
          var info = '<table class="table-rations">' +
                     '<tr><td colspan="2"><b><i>Best scores (job ' +
                     padDigits(pDesc.metrics.jobId,4) + ')</i></b></td></tr>' +
                     '<tr><td colspan="2"><hr/></td></tr>';
          function add_info ( title,value )  {
            info += '<tr><td>' + title + '</td><td>' + value + '</td></tr>';
          }
          add_info ( 'R-free/R-factor','<b>' + round(pDesc.metrics.R_free,4) +
                     '</b> / ' + round(pDesc.metrics.R_factor,4) );
          add_info ( 'Residues/Units modelled&nbsp;&nbsp;&nbsp;',
                     '<b>' + pDesc.metrics.nRes_Model   + '</b> / ' +
                     '<b>' + pDesc.metrics.nUnits_Model + '</b>' );
          //add_info ( 'R-free'  ,round(pDesc.metrics.R_free,4)   );
          //add_info ( 'R-factor',round(pDesc.metrics.R_factor,4) );
          //add_info ( 'Residues modelled',pDesc.metrics.nRes_Model );
          info += '</table><table class="table-rations">' +
                     '<tr><td colspan="2">&nbsp;<br><b><i>Project data</i></b></td></tr>' +
                     '<tr><td colspan="2"><hr/></td></tr>';
          add_info ( 'Space group',pDesc.metrics.SG       );
          add_info ( 'High resolution&nbsp;&nbsp;&nbsp;',
                     round(pDesc.metrics.res_high,2) + ' &Aring;' );
          if (pDesc.metrics.Solvent>0.0)
            add_info ( 'Solvent content&nbsp;&nbsp;&nbsp;',
                       round(pDesc.metrics.Solvent,1) + '%' );
          if (pDesc.metrics.MolWeight>0.0)
            add_info ( 'ASU Molecular weight',round(pDesc.metrics.MolWeight,1) );
          if (pDesc.metrics.nRes_ASU>0)
            add_info ( 'Residues/Units expected&nbsp;&nbsp;&nbsp;',
                       '<b>' + pDesc.metrics.nRes_ASU   + '</b> / ' +
                       '<b>' + pDesc.metrics.nUnits_ASU + '</b>' );
          if (('ha_type' in pDesc.metrics) && (pDesc.metrics.ha_type.length>0))
            add_info ( 'HA type',pDesc.metrics.ha_type );
          trow.addCell ( pDesc.metrics.R_free ).setNoWrap()
              .setTooltip1(info + '</table>','show',false,20000);
        } else
          trow.addCell ( '' );
        if (pDesc.hasOwnProperty('disk_space'))
              trow.addCell ( joined[0]+round(pDesc.disk_space,1)+joined[1] )
                  .setNoWrap().setTooltip(joined[2]);
        else  trow.addCell ( joined[0]+'-:-'+joined[1] )
                  .setNoWrap().setTooltip(joined[2]);
        if (pDesc.hasOwnProperty('cpu_time'))
              trow.addCell ( joined[0]+round(pDesc.cpu_time,4)+joined[1] )
                  .setNoWrap().setTooltip(joined[2]);
        else  trow.addCell ( joined[0]+'-:-'+joined[1] )
                  .setNoWrap().setTooltip(joined[2]);
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
      open_btn  .setDisabled ( false );
      add_btn   .setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      rename_btn.setDisabled ( false );
      del_btn   .setDisabled ( false );
      import_btn.setDisabled ( (__dormant!=0) ); // for strange reason Firefox wants this!
      export_btn.setDisabled ( false );
      join_btn  .setDisabled ( (__dormant!=0) );

      welcome_lbl.hide();

    }

    self.tablesort_tbl.setHeaderNoWrap   ( -1      );
    self.tablesort_tbl.setHeaderColWidth ( 0,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 1,'70%' );
    self.tablesort_tbl.setHeaderColWidth ( 2,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 3,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 4,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 5,'5%'  );
    self.tablesort_tbl.setHeaderColWidth ( 6,'5%'  );

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
      new HelpBox ( '',__dev_reference_base_url + 'index.html',null )
    });
  }

  this.addLogoutToMenu ( function(){
    saveProjectList ( function(data){ logout(sceneId,0); } );
  });

  var btn_width    = '30pt';
  var btn_height   = '26pt';
  var left_margin  = '18pt';
  var right_margin = '28pt';

  //alert ( window.screen.width + '  ' + window.devicePixelRatio );

  if (Math.max(window.screen.width,window.screen.height)<720*4/3)  {  // 720 pt to px
    // tight screen (smartphone)

    left_margin  = '2pt';
    right_margin = '22pt';

    open_btn   = new Button ( '',image_path('go')     );
    add_btn    = new Button ( '',image_path('add')    );
    rename_btn = new Button ( '',image_path('rename') );
    del_btn    = new Button ( '',image_path('remove') );
    export_btn = new Button ( '',image_path('export') );
    import_btn = new Button ( '',image_path('import') );
    join_btn   = new Button ( '',image_path('join')  );
    if (__demo_projects)  {
      demoprj_btn = new Button ( '',image_path('demoprj') );
      demoprj_btn .setWidth ( btn_width ).setHeight ( btn_height );
    }
    help_btn     = new Button ( '',image_path('help') ); //.setTooltip('Documentation' );

  } else  {

    open_btn   = new Button ( 'Open'  ,image_path('go') );
    add_btn    = new Button ( 'Add'   ,image_path('add') );
    rename_btn = new Button ( 'Rename',image_path('rename') );
    del_btn    = new Button ( 'Delete',image_path('remove') );
    export_btn = new Button ( 'Export',image_path('export') );
    import_btn = new Button ( 'Import',image_path('import') );
    join_btn   = new Button ( 'Join'  ,image_path('join') );
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
    join_btn.setWidth ( '80pt' );
    help_btn    .setWidth ( '60pt' );
    */

  }

  open_btn  .setWidth ( btn_width ).setHeight ( btn_height );
  add_btn   .setWidth ( btn_width ).setHeight ( btn_height );
  rename_btn.setWidth ( btn_width ).setHeight ( btn_height );
  del_btn   .setWidth ( btn_width ).setHeight ( btn_height );
  export_btn.setWidth ( btn_width ).setHeight ( btn_height );
  import_btn.setWidth ( btn_width ).setHeight ( btn_height );
  join_btn  .setWidth ( btn_width ).setHeight ( btn_height );
  help_btn  .setWidth ( btn_width ).setHeight ( btn_height );

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
  panel.setCellSize            ( '','10pt' ,row++,0    );
  nCols = 0;
  panel.setWidget              ( open_btn  ,row,nCols++,1,1 );
  panel.setWidget              ( add_btn   ,row,nCols++,1,1 );
  panel.setWidget              ( rename_btn,row,nCols++,1,1 );
  panel.setWidget              ( del_btn   ,row,nCols++,1,1 );
  panel.setWidget              ( export_btn,row,nCols++,1,1 );
  panel.setWidget              ( import_btn,row,nCols++,1,1 );
  panel.setWidget              ( join_btn  ,row,nCols++,1,1 );
  if (demoprj_btn)
    panel.setWidget            ( demoprj_btn,row,nCols++,1,1 );
  panel.setWidget              ( help_btn  ,row,nCols++,1,1  );
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
  open_btn  .addOnClickListener ( openProject   );
  add_btn   .addOnClickListener ( addProject    );
  rename_btn.addOnClickListener ( renameProject );
  del_btn   .addOnClickListener ( deleteProject );
  export_btn.addOnClickListener ( exportProject );
  //join_btn.addOnClickListener ( importSharedProject  );

  // add a listener to 'import' button
  import_btn.addOnClickListener ( function(){
    new ImportProjectDialog ( loadProjectList1 );
  });

  // add a listener to 'import' button
  join_btn.addOnClickListener ( function(){
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
  if (this.tablesort_tbl)  {
    this.tablesort_tbl.fixHeader();
    this.tablesort_tbl.setTableHeight ( height-84 );
  }
}


function makeProjectListPage ( sceneId )  {
  makePage ( new ProjectListPage(sceneId) );
  setHistoryState ( 'ProjectListPage' );
}
