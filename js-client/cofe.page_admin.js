
/*
 *  =================================================================
 *
 *    02.03.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
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

  var col = 4;
  var refresh_btn = this.headerPanel.setButton ( '',image_path('refresh'),0,col,1,1 );
  refresh_btn.setSize('30px','30px').setTooltip('Refresh');

  // Make Main Menu
  /*
  this.addMenuItem ( 'Add New User'     ,'user'    ,function(){ makeRegisterPage(sceneId); })
      .addMenuItem ( 'Dormant accounts' ,'dormant' ,function(){ new DormantUsersDialog();  })
      .addMenuItem ( 'Make announcement','announce',function(){ new AnnounceDialog();      })
      .addMenuSeparator()
      .addMenuItem ( 'My Account','settings',function(){ makeAccountPage(sceneId); })
      .addMenuItem ( 'My Projects','list',function(){ makeProjectListPage(sceneId); })
      .addLogoutToMenu ( function(){ logout(sceneId,0); });
  */
  this.addMenuItem ( 'My Account','settings',function(){ makeAccountPage(sceneId); })
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

  this.jobsTitle     = this.jobsTab.grid.setLabel  ( '',0,0,1,1 );
  this.jobStats      = this.jobsTab.grid.setLabel  ( '',1,0,1,1 );
                                  //      .setFontSize ( '14px' );

  this.usersTitle    = this.usersTab.grid.setLabel ( '',0,0,1,1 )
                                         .setHeight_px ( 32 );
  this.userListTable = null;
  this.uaPanel       = new Grid('');
  this.usersTab.grid.setWidget   ( this.uaPanel,0,1,1,1 );
  this.usersTab.grid.setCellSize ( '','32px',0,0 );
  this.usersTab.grid.setCellSize ( '','32px',0,1 );
  this.usersTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.usersTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.uaPanel.setLabel    ( '   ',0,0,1,1 );
  this.uaPanel.setCellSize ( '95%','32px',0,0 );
  col = 1;
  var newuser_btn  = this.uaPanel.setButton ( '',image_path('user'   ),0,col++,1,1 )
                                 .setSize('30px','30px')
                                 .setTooltip('Make new user');
  var dormant_btn  = this.uaPanel.setButton ( '',image_path('dormant'),0,col++,1,1 )
                                 .setSize('30px','30px')
                                 .setTooltip('Identify and mark dormant users');
  var announce_btn = this.uaPanel.setButton ( '',image_path('announce'),0,col++,1,1 )
                                 .setSize('30px','30px')
                                 .setTooltip('Send announcement to all users');
  for (var i=1;i<col;i++)
    this.uaPanel.setCellSize ( 'auto','32px',0,i );

  this.usageStats = this.usageTab.grid.setIFrame ( '',0,0,1,1 )
                                      .setFramePosition ( '0px','50px','100%','92%' );
  this.usageStats._url    = '';
  this.usageStats._loaded = false;

  //  nodes tab controls
  this.nodesTitle    = this.nodesTab.grid.setLabel ( '',0,0,1,1 )
                                         .setHeight_px ( 32 );
  this.nodeListTable = null;

  this.naPanel       = new Grid('');
  this.nodesTab.grid.setWidget   ( this.naPanel,0,1,1,1 );
  this.nodesTab.grid.setCellSize ( '','32px',0,0 );
  this.nodesTab.grid.setCellSize ( '','32px',0,1 );
  this.nodesTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.nodesTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.naPanel.setLabel    ( '   ',0,0,1,1 );
  this.naPanel.setCellSize ( '95%','32px',0,0 );

  col = 1;
  var update_btn = this.naPanel.setButton ( '',image_path('update'),0,col++,1,1 )
                               .setSize('30px','30px')
                               .setTooltip('Update and restart');
  for (var i=1;i<col;i++)
    this.naPanel.setCellSize ( 'auto','32px',0,i );

  this.onResize ( window.innerWidth,window.innerHeight );

  (function(self){

    self.tabs.setTabChangeListener ( function(ui){
      self.loadUsageStats();
    });

    newuser_btn.addOnClickListener ( function(){
      makeRegisterPage ( sceneId );
    });

    dormant_btn.addOnClickListener ( function(){
      new DormantUsersDialog ( function(){ refresh_btn.click(); });
    });

    update_btn.addOnClickListener ( function(){
      stopSessionChecks();
      serverRequest ( fe_reqtype.updateAndRestart,'','Admin Page',
                      function(data){
        window.setTimeout ( function(){
          window.location = window.location; // reload
        },60000 );
        logout ( self.element.id,10 );
      },null,function(){} );
    });

    announce_btn.addOnClickListener ( function(){
      new AnnounceDialog();
    });

    refresh_btn.addOnClickListener ( function(){
      self.refresh();
    });

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
        self.jobsTitle .setText ( data.jobsStat );
        self.usersTitle.setText ( data.jobsStat );
        self.nodesTitle.setText ( data.jobsStat );
      } else  {
        self.jobsTitle .setText ( '<h2>Jobs Log</h2>' );
        var lines = data.jobsStat.split(/\r\n|\r|\n/);
        if ((lines.length>0) && startsWith(lines[0],'--------'))  {
          lines[0] = lines[0].replace ( /-/g,'=' );
          lines[2] = lines[2].replace ( /-/g,'=' );
          if (!lines[lines.length-1])
            lines.pop();
          lines.push ( lines.shift() );
          lines.push ( lines.shift() );
          lines.push ( lines.shift() );
        }
        var nJobsToday = 0;
        var today_template = new Date(Date.now()).toUTCString().split(' ');
        today_template = '[' + today_template[0] + ' ' + today_template[1] +
                         ' ' + today_template[2] + ' ' + today_template[3];
        for (var i=lines.length-1;i>=0;i--)
          if (('0'<=lines[i][0]) && (lines[i][0]<='9'))  {
            if (lines[i].indexOf(today_template)>=0) nJobsToday++;
                                                else break;
          }
        self.jobStats.setText ( '<pre>Jobs today: ' + nJobsToday + ' ' + '\n' +
                                lines.reverse().join('\n') + '</pre>' );
        /*
        window.setTimeout ( function(){
          $(self.jobsTab.element).scrollTop($(self.jobsTab.element).height()
        },3000);
        */
        self.usageStats._url    = data.usageReportURL;
        self.usageStats._loaded = false;
        self.loadUsageStats();
        self.makeUsersInfoTab ( data.usersInfo,data.nodesInfo.FEconfig );
        serverCommand ( fe_command.getFEProxyInfo,{},'FE Proxy Info Request',
          function(rsp){
            if (rsp)  {
              if (rsp.status==nc_retcode.ok)
                data.nodesInfo.FEProxy = rsp.data;
              else
                new MessageBox ( 'Get FE Proxy Info Error',
                  'Unknown error: <b>' + rsp.status + '</b><p>' +
                  'when trying to fetch FE Proxy data.' );
            }
            if (!__local_service)  {
              self.makeNodesInfoTab ( data.nodesInfo );
            } else  {
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
            return (rsp!=null);
          });
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


AdminPage.prototype.makeUsersInfoTab = function ( udata,FEconfig )  {
  // function to create user info tables and fill them with data

  this.usersTitle.setText('Users').setFontSize('1.5em').setFontBold(true);

  this.userListTable = new TableSort();
  this.usersTab.grid.setWidget ( this.userListTable,1,0,1,2 );

  this.userListTable.setHeaders ( ['##','Name','Login','Online','Profile',
                                   'Dormant<br>since' ,'E-mail',
                                   'Licence','N<sub>jobs</sub>',
                                   'Space<br>(MB)','CPU<br>(hours)',
                                   'Known<br>since','Last<br>seen'] );

  var loggedUsers;
  if ('loggedUsers' in udata)  loggedUsers = udata.loggedUsers;
                         else  loggedUsers = udata.loginHash.loggedUsers;
  for (var i=0;i<udata.userList.length;i++)  {
    var trow  = this.userListTable.addRow();
    var uDesc = udata.userList[i];
    trow.addCell ( i+1         ).setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( uDesc.name  ).setNoWrap();
    trow.addCell ( uDesc.login ).setNoWrap();
    var online = '';
    for (var token in loggedUsers)
      if (loggedUsers[token].login==uDesc.login)  {
        online = '&check;';
        break;
      }
    trow.addCell ( online ).setNoWrap().setHorizontalAlignment('center');
    trow.addCell ( uDesc.role ).setNoWrap();
    if (uDesc.dormant)
          trow.addCell ( new Date(uDesc.dormant).toISOString().slice(0,10) ).setNoWrap();
    else  trow.addCell ( 'active' ).setNoWrap();
    trow.addCell ( uDesc.email     ).setNoWrap();
    trow.addCell ( uDesc.licence   ).setNoWrap();
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
  }

  (function(self){
    self.userListTable.addSignalHandler ( 'row_dblclick',function(trow){
      //alert ( 'trow='+JSON.stringify(trow.uDesc) );
      new ManageUserDialog ( trow.uDesc,FEconfig,function(){ self.refresh(); } );
    });
  }(this))

  this.userListTable.createTable();

  this.userListTable.setHeaderNoWrap   ( -1       );
  this.userListTable.setHeaderColWidth ( 0 ,'3%'   );  // Number
  this.userListTable.setHeaderColWidth ( 1 ,'auto' );  // Name
  this.userListTable.setHeaderColWidth ( 2 ,'4%'   );  // Login
  this.userListTable.setHeaderColWidth ( 3 ,'3%'   );  // Online
  this.userListTable.setHeaderColWidth ( 4 ,'3%'   );  // Profile
  this.userListTable.setHeaderColWidth ( 5 ,'4%'   );  // Dormancy date
  this.userListTable.setHeaderColWidth ( 6 ,'auto' );  // E-mail
  this.userListTable.setHeaderColWidth ( 7 ,'4%'   );  // Licence
  this.userListTable.setHeaderColWidth ( 8 ,'3%'   );  // Jobs run
  this.userListTable.setHeaderColWidth ( 9 ,'3%'   );  // Space used
  this.userListTable.setHeaderColWidth ( 10,'3%'   );  // CPU used
  this.userListTable.setHeaderColWidth ( 11,'4%'   );  // Known since
  this.userListTable.setHeaderColWidth ( 12,'4%'   );  // Last seen

  this.userListTable.setHeaderFontSize ( '100%' );

}


AdminPage.prototype.makeNodesInfoTab = function ( ndata )  {
  // function to create user info tables and fill them with data

//console.log ( JSON.stringify(ndata) );

  //this.nodesTitle.setText ( '<h2>Nodes</h2>' );
  this.nodesTitle.setText('Nodes').setFontSize('1.5em').setFontBold(true);

  this.nodeListTable = new Table();
  this.nodesTab.grid.setWidget ( this.nodeListTable,1,0,1,2 );

  this.nodeListTable.setHeaderRow (
    [ 'Node',
      'Name',
      'URL',
      'Type',
      'Time started',
      'CCP4<br>version',
      appName() + ' version',
      'Fast<br>track',
      'State',
      'Jobs<br>done',
      'Job<br>capacity',
      'Jobs<br>running',
      'Zombie<br>jobs',
    ],[
      'Server node',
      'Node name',
      'Node URL',
      'Node type',
      'Node start time',
      'Version of CCP4 running on the node',
      'Version of ' + appName() + ' running on the node',
      'Yes if accepts fast track jobs',
      'Current node state',
      'Total number of jobs executed on the node',
      'Estimated job capacity of the node',
      'Current number of jobs running on the node',
      'Current number of stalled or zombie jobs on the node'
    ]
  );

  function small_font ( S )  {
    return '<font style="font-size:80%">' + S + '</font>';
  }

  var row = 1;

  var FEname;
  if (__setup_desc)        FEname = __setup_desc.name;
  else if (__local_setup)  FEname = 'Home setup';
                     else  FEname = 'Unnamed setup';


  var fe_url;
  if (('FEProxy' in ndata) && ndata.FEProxy.fe_config)
        fe_url = ndata.FEProxy.fe_config.externalURL;
  else  fe_url = document.location.protocol + '//' +
                 document.location.host +
                 document.location.pathname;
  if (ndata.FEconfig.externalURL!=fe_url)
    fe_url += '<br><i>[' + ndata.FEconfig.externalURL + ']</i>';

  var app_version = 'unspecified';
  if ('jscofe_version' in ndata)
    app_version = ndata.jscofe_version;
  this.nodeListTable.setRow ( 'Front End','Front End Server',
    [ FEname,fe_url,'FE',small_font(ndata.FEconfig.startDate),
      ndata.ccp4_version,app_version,'N/A','running','N/A','N/A','N/A','N/A' ],
    row,(row & 1)==1 );
  row++;

  if (('FEProxy' in ndata) && ndata.FEProxy.proxy_config)  {
    if ('jscofe_version' in ndata.FEProxy)  app_version = ndata.FEProxy.jscofe_version;
                                      else  app_version = 'unspecified';
    this.nodeListTable.setRow ( 'FE Proxy','Front End Proxy Server',
      [ 'Local proxy',ndata.FEProxy.proxy_config.externalURL,'FE-PROXY',
        small_font(ndata.FEProxy.proxy_config.startDate),
        ndata.FEProxy.ccp4_version,app_version,
        'N/A','running','N/A','N/A','N/A','N/A'
      ], row,(row & 1)==1 );
    row++;
  }

  var ncn = 1;
  for (var i=0;i<ndata.ncInfo.length;i++)  {
    var nci = ndata.ncInfo[i];
//    if (nci.config.name!='client')  {
    if (nci)  {
      var fasttrack = '&check;';
      if (!nci.config.fasttrack)
        fasttrack = '-';
      var njobs     = 0;
      var nzombies  = 0;
      var njdone    = 0;
      var state     = 'running';
      var startDate = 'N/A';
      if (!nci.config.in_use)
        state = 'not in use';
      else if (nci.jobRegister)  {
        njdone  = nci.jobRegister.launch_count;
        for (var item in nci.jobRegister.job_map)
          if (nci.jobRegister.job_map[item].endTime)  nzombies++;
                                                else  njobs++;
        startDate = small_font(nci.config.startDate);
      } else  {
        state = 'dead';
      }
      var nc_name = 'NC-' + nci.config.exeType;
      if (nci.config.jobManager!=nci.config.exeType)
        nc_name += '(' + nci.config.jobManager + ')';
      if ('jscofe_version' in nci)  app_version = nci.jscofe_version;
                              else  app_version = 'unspecified';
      this.nodeListTable.setRow ( 'NC-' + ncn,'Number Cruncher #' + ncn,
        [nci.config.name,nci.config.externalURL,nc_name,
         startDate,nci.ccp4_version,app_version,fasttrack,state,
         njdone,nci.config.capacity,njobs,nzombies],row,(row & 1)==1 );
      row++;
      ncn++;
    }
  }

  this.nodeListTable.setAllColumnCSS ({
    'vertical-align' : 'middle',
    'white-space'    : 'nowrap'
  },1,1 );

}


// -------------------------------------------------------------------------

function makeAdminPage ( sceneId )  {
  makePage ( new AdminPage(sceneId) );
  setHistoryState ( 'AdminPage' );
}
