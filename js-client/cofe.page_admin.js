
/*
 *  =================================================================
 *
 *    27.09.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.page_admin.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Admin page
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


// -------------------------------------------------------------------------
// admin page class

function AdminPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','AdminPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGED IN');
    return;
  }

  this.makeHeader ( 3,null );
  var title_lbl = this.headerPanel.setLabel ( appName() + ' Administration Facility',0,2,1,1 );
  title_lbl.setFont  ( 'times','150%',true,true )
           .setNoWrap()
           .setHorizontalAlignment ( 'left' );
  this.headerPanel.setVerticalAlignment ( 0,2,'middle' );
  this.headerPanel.setCellSize ( '99%','',0,3 );

  var announce_btn = this.headerPanel.setButton ( '',image_path('announce'),0,5,1,1 );
  announce_btn.setSize('30px','30px').setTooltip('Send announcement to all users');
  var refresh_btn = this.headerPanel.setButton ( '',image_path('refresh'),0,6,1,1 );
  refresh_btn.setSize('30px','30px').setTooltip('Refresh');

  // Make Main Menu
  this.addMenuItem ( 'Add New User','user',function(){ makeRegisterPage(sceneId); })
      .addMenuSeparator()
      .addMenuItem ( 'My Account','settings',function(){ makeAccountPage(sceneId); })
      .addMenuItem ( 'My Projects','list',function(){ makeProjectListPage(sceneId); })
      .addLogoutToMenu ( function(){ logout(sceneId,0); });

  // make tabs
  this.tabs = new Tabs();
  this.usersTab = this.tabs.addTab ( 'Users',true  );
  this.nodesTab = this.tabs.addTab ( 'Nodes',false );
  this.usageTab = this.tabs.addTab ( 'Usage',false );
  this.jobsTab  = this.tabs.addTab ( 'Jobs' ,false );

  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( '5pt','auto',1,0,1,1 );
  this.grid.setWidget   ( this.tabs   ,1,1,1,1 );
  this.grid.setCellSize ( '5pt','auto',1,2,1,1 );

  this.makeLogoPanel ( 2,0,3 );

  this.jobsTitle     = this.jobsTab.grid.setLabel   ( '',0,0,1,1 );
  this.jobStats      = this.jobsTab.grid.setLabel   ( '',1,0,1,1 );

  this.usersTitle    = this.usersTab.grid.setLabel  ( '',0,0,1,1 );
  this.userListTable = null;

  this.usageStats    = this.usageTab.grid.setIFrame ( '',0,0,1,1 )
                           .setFramePosition ( '0px','50px','100%','92%' );
  this.usageStats._url    = '';
  this.usageStats._loaded = false;

  this.nodesTitle    = this.nodesTab.grid.setLabel  ( '',0,0,1,1 );
  this.nodeListTable = null;

  this.onResize ( window.innerWidth,window.innerHeight );

  (function(self){

    self.tabs.setTabChangeListener ( function(ui){
      self.loadUsageStats();
    });

    announce_btn.addOnClickListener ( function(){
      new AnnounceDialog();
    });

    refresh_btn.addOnClickListener ( function(){ self.refresh(); } );

  }(this))

  refresh_btn.click();

}

AdminPage.prototype = Object.create ( BasePage.prototype );
AdminPage.prototype.constructor = AdminPage;

/*
AdminPage.prototype.destructor = function ( function_ready )  {
  this.tabs = null;  // in order to stop refreshes on resize
  BasePage.prototype.destructor.call ( this,function0ready );
}
*/

AdminPage.prototype.loadUsageStats = function()  {
  if ((this.tabs.getActiveTabNo()==2) && (!this.usageStats._loaded))  {
    this.usageStats.loadPage ( this.usageStats._url );
    this.usageStats._loaded = true;
  }
}

AdminPage.prototype.refresh = function()  {
  (function(self){
    serverRequest ( fe_reqtype.getAdminData,0,'Admin Page',function(data){
      if (!data.served)  {
        self.jobsTitle .setText  ( data.jobsStat );
        self.usersTitle.setText  ( data.jobsStat );
        self.nodesTitle.setText  ( data.jobsStat );
      } else  {
        self.jobsTitle .setText  ( '<h2>Jobs Log</h2>' );
        self.jobStats  .setText  ( '<pre>' + data.jobsStat + '</pre>' );
        self.usageStats._url    = data.usageReportURL;
        self.usageStats._loaded = false;
        self.loadUsageStats();
        self.makeUsersInfoTab ( data.usersInfo );
        if (!__local_service)
          self.makeNodesInfoTab ( data.nodesInfo );
        else  {
          localCommand ( nc_command.getNCInfo,{},'NC Info Request',
            function(response){
              if (response)  {
                if (response.status==nc_retcode.ok)
                  data.nodesInfo.ncInfo.push ( response.data );
                else
                  new MessageBox ( 'Get NC Info Error',
                    'Unknown error: <b>' + response.status + '</b><p>' +
                    'when trying to fetch Client NC data.' );
              }
              self.makeNodesInfoTab ( data.nodesInfo );
              return (response!=null);
            });
        }
      }
      self.tabs.refresh();
    },null,'persist');
  }(this))
}

AdminPage.prototype.onResize = function ( width,height )  {
  this.tabs.setWidth_px  ( width -50  );
  this.tabs.setHeight_px ( height-100 );
  this.usageStats.setFramePosition ( '0px','50px','100%',(height-148)+'px' );
  this.tabs.refresh();
}


AdminPage.prototype.makeUsersInfoTab = function ( udata )  {
  // function to create user info tables and fill them with data

  this.usersTitle.setText ( '<h2>Users</h2>' );

  this.userListTable = new TableSort();
  this.usersTab.grid.setWidget ( this.userListTable,1,0,1,1 );

  this.userListTable.setHeaders ( ['##','Name','Login','Online','Role','E-mail',
                                   'Licence','N<sub>jobs</sub>',
                                   'Space<br>(MBytes)','CPU<br>(hours)',
                                   'Known<br>since','Last<br>seen'] );
  this.userListTable.setHeaderNoWrap   ( -1       );
  this.userListTable.setHeaderColWidth ( 0 ,'3%'   );  // Number
  this.userListTable.setHeaderColWidth ( 1 ,'auto' );  // Name
  this.userListTable.setHeaderColWidth ( 2 ,'5%'   );  // Login
  this.userListTable.setHeaderColWidth ( 3 ,'5%'   );  // Online
  this.userListTable.setHeaderColWidth ( 4 ,'5%'   );  // Role
  this.userListTable.setHeaderColWidth ( 5 ,'auto' );  // E-mail
  this.userListTable.setHeaderColWidth ( 6 ,'5%'   );  // Licence
  this.userListTable.setHeaderColWidth ( 7 ,'5%'   );  // Jobs run
  this.userListTable.setHeaderColWidth ( 8 ,'5%'   );  // Space used
  this.userListTable.setHeaderColWidth ( 9 ,'5%'   );  // CPU used
  this.userListTable.setHeaderColWidth ( 10,'5%'   );  // Known since
  this.userListTable.setHeaderColWidth ( 11,'5%'   );  // Last seen

  for (var i=0;i<udata.userList.length;i++)  {
    var trow  = this.userListTable.addRow();
    var uDesc = udata.userList[i];
    trow.addCell ( i+1         ).setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( uDesc.name  ).setNoWrap();
    trow.addCell ( uDesc.login ).setNoWrap();
    var online = '';
    for (var token in udata.loggedUsers)
      if (udata.loggedUsers[token]==uDesc.login)  {
        online = '&check;';
        break;
      }
    trow.addCell ( online ).setNoWrap().setHorizontalAlignment('center');
    var role = 'user';
    if (uDesc.login=='devel')  role = 'developer';
    else if (uDesc.admin)      role = 'admin';
    trow.addCell ( role            ).setNoWrap();
    trow.addCell ( uDesc.email     ).setNoWrap();
    trow.addCell ( uDesc.licence   ).setNoWrap();
    /*
    trow.addCell ( uDesc.nJobs     ).setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( uDesc.usedSpace ).setNoWrap().setHorizontalAlignment('right');
    */
    trow.addCell ( uDesc.ration.jobs_total  ).setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( round(uDesc.ration.storage_used,1) )
                                    .setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( round(uDesc.ration.cpu_total_used,2) )
                                    .setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( new Date(uDesc.knownSince).toISOString().slice(0,10) )
                                    .setNoWrap().setHorizontalAlignment('right');
    var lastSeen = '';
    if ('lastSeen' in uDesc)  {
      if (uDesc.lastSeen)
        lastSeen = new Date(uDesc.lastSeen).toISOString().slice(0,10);
    }
    trow.addCell ( lastSeen ).setNoWrap().setHorizontalAlignment('right');
    trow.uDesc = uDesc;
    //this.userListTable.addRow ( trow );
  }

  (function(self){
    self.userListTable.addSignalHandler ( 'row_dblclick',function(trow){
      //alert ( 'trow='+JSON.stringify(trow.uDesc) );
      new ManageUserDialog ( trow.uDesc,function(){ self.refresh(); } );
    });
  }(this))

  this.userListTable.setHeaderFontSize ( '100%' );
  this.userListTable.createTable();

}


AdminPage.prototype.makeNodesInfoTab = function ( ndata )  {
  // function to create user info tables and fill them with data

//console.log ( JSON.stringify(ndata) );

  this.nodesTitle.setText ( '<h2>Nodes</h2>' );

  this.nodeListTable = new Table();
  this.nodesTab.grid.setWidget ( this.nodeListTable,1,0,1,1 );

  this.nodeListTable.setHeaderRow (
    [ 'Node',
      'Name',
      'URL',
      'Type',
      'Time started',
      'CCP4<br>version',
      'Fast<br>track',
      'State',
      'Jobs<br>done',
      'Job<br>capacity',
      'Jobs<br>running'
    ],[
      'Server node',
      'Node name',
      'Node URL',
      'Node type',
      'Node start time',
      'Version of CCP4 running on the node',
      'Yes if accepts fast track jobs',
      'Current node state',
      'Total number of jobs executed on the node',
      'Estimated job capacity of the node',
      'Current number of jobs running on the node'
    ]
  );

  var row = 1;

  var FEname = appName();
  if (__setup_desc)        FEname += ' (' + __setup_desc.name + ')';
  else if (__local_setup)  FEname += ' (Home setup)';
                     else  FEname += ' (Unnamed setup)';

  this.nodeListTable.setRow ( 'Front End','Front End Server',
    [ FEname,ndata.FEconfig.externalURL,'FE',ndata.FEconfig.startDate,
      ndata.ccp4_version,'N/A','running','N/A','N/A','N/A' ],
    row,(row & 1)==1 );
  row++;

  var ncn = 1;
  for (var i=0;i<ndata.ncInfo.length;i++)  {
    var nci = ndata.ncInfo[i];
//    if (nci.config.name!='client')  {
    if (nci)  {
      var fasttrack = '&check;';
      if (!nci.config.fasttrack)
        fasttrack = '-';
      var state = 'running';
      if (!nci.config.in_use)
        state = 'not in use';
      var njobs  = 0;
      var njdone = 0;
      if (nci.jobRegister)  {
        njdone = nci.jobRegister.launch_count;
        for (var item in nci.jobRegister.job_map)
          njobs++;
      } else {
        state = 'dead';
      }
      var nc_name = 'NC-' + nci.config.exeType;
      if (nci.config.jobManager!=nci.config.exeType)
        nc_name += '(' + nci.config.jobManager + ')';
      this.nodeListTable.setRow ( 'NC-' + ncn,'Number Cruncher #' + ncn,
        [nci.config.name,nci.config.externalURL,nc_name,
         nci.config.startDate,nci.ccp4_version,fasttrack,state,
         njdone,nci.config.capacity,njobs],row,(row & 1)==1 );
      row++;
      ncn++;
    }
  }

  this.nodeListTable.setAllColumnCSS (
    {'vertical-align':'middle','white-space':'nowrap' },1,1 );

}


// -------------------------------------------------------------------------

function makeAdminPage ( sceneId )  {
  makePage ( new AdminPage(sceneId) );
  setHistoryState ( 'AdminPage' );
}
