
/*
 *  =================================================================
 *
 *    06.11.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

// -------------------------------------------------------------------------
// admin page class

function AdminPage ( sceneId )  {

  // prepare the scene and make top-level grid
  BasePage.call ( this,sceneId,'-full','AdminPage' );

  if (!__login_token)  {
    alert ( ' NOT LOGED IN');
    return;
  }

  this.load_start_time = performance.now();

  this.makeHeader ( 3,null );
  let page_title = appName() + ' Administration Facility';
  if (__local_user)
    page_title = 'System information';
  let title_lbl = this.headerPanel.setLabel ( page_title,0,3,1,1 );
  title_lbl.setFont  ( 'times','150%',true,true )
           .setNoWrap()
           .setHorizontalAlignment ( 'left' );
  this.headerPanel.setVerticalAlignment ( 0,3,'top' );
  this.headerPanel.setCellSize ( '99%','38px',0,4 );

  let col = 5;
  let refresh_btn = this.headerPanel.setButton ( '',image_path('refresh'),0,col,1,1 );
  refresh_btn.setSize('30px','30px').setTooltip('Refresh');

  // Make Main Menu
  let accLbl = 'My Account';
  if (__local_user)
    accLbl = 'Settings';
  this.addMenuItem ( accLbl,'settings',function(){ makeAccountPage(sceneId); })
      .addMenuItem ( 'Back to Projects','list',function(){ makeProjectListPage(sceneId); })
      .addLogoutToMenu ( function(){ logout(sceneId,0); });

  // make tabs
  this.tabs = new Tabs();
  // this.tabs.setVisible ( false );
  this.usersTab  = this.tabs.addTab ( 'Users'  ,true  );
  this.nodesTab  = this.tabs.addTab ( 'Nodes'  ,false );
  this.memoryTab = this.tabs.addTab ( 'Memory' ,false );
  this.anlTab    = null;
  if (__user_role==role_code.admin)
    this.anlTab  = this.tabs.addTab ( 'Monitor',false );
  this.usageTab  = this.tabs.addTab ( 'Usage'  ,false );
  this.jobsTab   = this.tabs.addTab ( 'Jobs'   ,false );
  // this.tabs.setVisible ( true );

  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( '10px','auto',1,0,1,1 );
  this.grid.setWidget   ( this.tabs    ,1,1,1,1 );
  this.grid.setCellSize ( '1px','auto' ,1,2,1,1 );

  this.makeLogoPanel ( 2,0,3 );

  // this.makeAnalyticsTab ( null );

  this.jobsTitle     = this.jobsTab.grid.setLabel  ( '',0,0,1,1 ).setHeight_px ( 32 );
  this.jobStats      = this.jobsTab.grid.setLabel  ( '',1,0,1,1 ).setHeight_px ( 32 );
                                  //      .setFontSize ( '14px' );

  this.usersTitle    = this.usersTab.grid.setLabel ( '',0,0,1,1 ).setHeight_px ( 32 );
  this.userListTable = null;
  this.uaPanel       = new Grid('');
  this.usersTab.grid.setWidget   ( this.uaPanel,0,1,1,1 );
  this.usersTab.grid.setCellSize ( '','32px',0,0 );
  this.usersTab.grid.setCellSize ( '','32px',0,1 );
  this.usersTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.usersTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.uaPanel.setLabel    ( '   ',0,0,1,1 );
  this.uaPanel.setCellSize ( '95%','32px',0,0 );

  let newuser_btn   = null;
  let dormant_btn   = null;
  let announce_btn  = null;
  let sendtoall_btn = null;

  if (__user_role==role_code.admin)  {
    col = 1;
    newuser_btn   = this.uaPanel.setButton ( '',image_path('user'   ),0,col++,1,1 )
                                .setSize('30px','30px')
                                .setTooltip('Make new user');
    dormant_btn   = this.uaPanel.setButton ( '',image_path('dormant'),0,col++,1,1 )
                                .setSize('30px','30px')
                                .setTooltip('Identify and mark dormant users');
    announce_btn  = this.uaPanel.setButton ( '',image_path('announce'),0,col++,1,1 )
                                .setSize('30px','30px')
                                .setTooltip('Post announcement');
    sendtoall_btn = this.uaPanel.setButton ( '',image_path('sendtoall'),0,col++,1,1 )
                                .setSize('30px','30px')
                                .setTooltip('Send e-mail to all users');
    for (let i=1;i<col;i++)
      this.uaPanel.setCellSize ( 'auto','32px',0,i );
  }

  this.usageStats = this.usageTab.grid.setIFrame ( '',0,0,1,1 )
                                      .setFramePosition ( '0px','50px','100%','92%' );
  this.usageStats._url    = '';
  this.usageStats._loaded = false;

  //  nodes tab controls
  this.nodesTitle    = this.nodesTab.grid.setLabel ( '',0,0,1,1 )
                                         .setHeight_px ( 32 );
  this.nodeListTable = null;

  this.naPanel = new Grid('');
  this.nodesTab.grid.setWidget   ( this.naPanel,0,1,1,1 );
  this.nodesTab.grid.setCellSize ( '','32px',0,0 );
  this.nodesTab.grid.setCellSize ( '','32px',0,1 );
  this.nodesTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.nodesTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.naPanel.setLabel    ( '   ',0,0,1,1 );
  this.naPanel.setCellSize ( '95%','32px',0,0 );

  // nodes control toolbar
  col = 1;
  let zombie_btn = this.naPanel.setButton ( '',image_path('ghost'),0,col++,1,1 )
                               .setSize('30px','30px')
                               .setTooltip('Wake up zombies');
  let update_btn = null;
  if (__user_role==role_code.admin)
    update_btn   = this.naPanel.setButton ( '',image_path('update'),0,col++,1,1 )
                               .setSize('30px','30px')
                               .setTooltip('Update and restart');
  for (let i=1;i<col;i++)
    this.naPanel.setCellSize ( 'auto','32px',0,i );

  this.onResize ( window.innerWidth,window.innerHeight );

  let self = this;
  // (function(self){

    zombie_btn.addOnClickListener ( function(){
      // stopSessionChecks();
      serverRequest ( fe_reqtype.wakeZombieJobs,{project:'*'},'Admin Page',
                      function(data){
                        new MessageBox ( 'Wake Zombie jobs',
                             '<h2>Wake Zombie jobs</h2>Total ' + data.nzombies + 
                             ' zombie jobs found and awaken.<p>' +
                             'Reload page after a minute or so.',
                             'msg_information' );
                      },null,function(){
                        new MessageBox ( 'Wake Zombie jobs',
                             '<h2>Communication errors</h2>' +
                             'Communication errors with Number Crunchers.',
                             'msg_error' );
                      }
                    );
    });

    if (__user_role==role_code.admin)  {

      update_btn.addOnClickListener ( function(){

        new QuestionBox ( appName() + ' update',
          '<div style="width:400px"><h2>' + appName() + ' update</h2>' +
          appName() + ' will be shut down, updated and restarted. This is ' +
          'administrative action, which will work only if ' + appName() + 
          ' is appropriately configured. Use this only if you know what you ' +
          'are doing.' +
          '<p>Are you sure?',[
          { name    : 'Yes, update and restart',
            onclick : function(){
                        stopSessionChecks();
                        serverRequest ( fe_reqtype.updateAndRestart,'','Admin Page',
                                        function(data){
                          window.setTimeout ( function(){
                            reloadBrowser();
                            // window.location = window.location; // reload
                          },60000 );
                          logout ( self.element.id,10 );
                        },null,function(){} );
                      }
          },{
            name    : 'No, cancel',
            onclick : function(){}
          }],'msg_confirm' );

      });

      newuser_btn.addOnClickListener ( function(){
        makeRegisterPage ( sceneId );
      });

      dormant_btn.addOnClickListener ( function(){
        new DormantUsersDialog ( function(){ refresh_btn.click(); });
      });

      announce_btn.addOnClickListener ( function(){
        new AnnouncementDialog();
      });

      sendtoall_btn.addOnClickListener ( function(){
        new SendToAllDialog();
      });

    }

  refresh_btn.addOnClickListener ( function(){
    self.refresh();
  });

  self.tabs.setTabChangeListener ( function(ui){
    self.loadUsageStats();
  });

  // }(this))

  refresh_btn.click();

}

registerClass ( 'AdminPage',AdminPage,BasePage.prototype );

/*
AdminPage.prototype.destructor = function ( function_ready )  {
  this.tabs = null;  // in order to stop refreshes on resize
  BasePage.prototype.destructor.call ( this,function0ready );
}
*/

AdminPage.prototype.loadUsageStats = function()  {
  let usageTabNo = 4;
  if (!this.anlTab)
    usageTabNo = 3;
  if ((!this.usageStats._loaded) && (this.tabs.getActiveTabNo()==usageTabNo))  {
    this.usageStats.loadPage ( this.usageStats._url );
    this.usageStats._loaded = true;
  }
}

AdminPage.prototype.__load_time = function()  {
  let dt = (performance.now()-this.load_start_time)/1000.0;
  return dt.toFixed(3) + 's';
}

AdminPage.prototype.refresh = function()  {

  this.load_start_time = performance.now();

  if (this.anlTab)
    this.loadAnalytics();

  (function(self){

    serverRequest ( fe_reqtype.getAdminData,0,'Admin Page',function(data){

      if (__user_role==role_code.admin)
        console.log ( '... getAdminData response ' + self.__load_time() );

      if (!data.served)  {

        self.jobsTitle .setText ( data.jobsStat );
        self.usersTitle.setText ( data.jobsStat );
        self.nodesTitle.setText ( data.jobsStat );

      } else  {

        window.setTimeout ( function(){

          self.makeUsersInfoTab ( data.usersInfo,data.nodesInfo.FEconfig );
          
          window.setTimeout ( function(){
          
            self.usageStats._url    = data.usageReportURL;
            self.usageStats._loaded = false;
            self.loadUsageStats();

            window.setTimeout ( function(){
          
              self.jobsTitle .setText ( '<h2>Jobs Log</h2>' );
              let lines = data.jobsStat.split(/\r\n|\r|\n/);
              if ((lines.length>0) && startsWith(lines[0],'--------'))  {
                lines[0] = lines[0].replace ( /-/g,'=' );
                lines[2] = lines[2].replace ( /-/g,'=' );
                if (!lines[lines.length-1])
                  lines.pop();
                lines.push ( lines.shift() );
                lines.push ( lines.shift() );
                lines.push ( lines.shift() );
              }
              let nJobsToday = 0;
              let usersToday = [];
              let today_template = new Date(Date.now()).toUTCString().split(' ');
              today_template = '[' + today_template[0] + ' ' + today_template[1] +
                               ' ' + today_template[2] + ' ' + today_template[3];
              for (let i=lines.length-1;i>=0;i--)
                if (('0'<=lines[i][0]) && (lines[i][0]<='9'))  {
                  if (lines[i].indexOf(today_template)>=0) {
                    nJobsToday++;
                    let user = lines[i].split(' (')[0].split(' ').pop();
                    if (usersToday.indexOf(user)<0)
                      usersToday.push ( user );
                  } else
                    break;
                }
              self.jobStats.setText ( '<pre>Jobs today: total ' + nJobsToday + ' from ' +
                                      usersToday.length + ' users\n' +
                                      lines.reverse().join('\n') + '</pre>' );
              if (__user_role==role_code.admin)
                console.log ( '... Jobs Tab complete in ' + self.__load_time() );
            },10);

          },10);

        },10);

        serverCommand ( fe_command.getFEProxyInfo,{},'FE Proxy Info Request',
          function(rsp){
            if (rsp)  {
              if (rsp.status==nc_retcode.ok)
                data.nodesInfo.FEProxy = rsp.data;
              else
                new MessageBox ( 'Get FE Proxy Info Error',
                  'Unknown error: <b>' + rsp.status + '</b><p>' +
                  'when trying to fetch FE Proxy data.', 'msg_error' );
            }
            if (!__local_service)  {
              window.setTimeout ( function(){
                self.makeNodesInfoTab  ( data.nodesInfo );
                self.makeMemoryInfoTab ( data.memoryReport,data.performance );
                self.onResize ( window.innerWidth,window.innerHeight );
              },10);
            } else  {
              localCommand ( nc_command.getNCInfo,{},'NC Info Request',
                function(response){
                  if (response)  {
                    if (response.status==nc_retcode.ok)
                      data.nodesInfo.ncInfo.push ( response.data );
                    else
                      new MessageBox ( 'Get NC Info Error',
                        'Unknown error: <b>' + response.status + '</b><p>' +
                        'when trying to fetch Client NC data.', 'msg_error' );
                  }
                  window.setTimeout ( function(){
                    self.makeNodesInfoTab  ( data.nodesInfo );
                    self.makeMemoryInfoTab ( data.memoryReport,data.performance );
                    self.onResize ( window.innerWidth,window.innerHeight );
                  },0);
                  return (response!=null);
                });
            }
            // self.tabs.refresh();
            return (rsp!=null);
          });
      }

      // self.tabs.refresh();
    },null,'persist');

  }(this))

}

AdminPage.prototype.onResize = function ( width,height )  {
  this.tabs.setWidth_px  ( width -42  );
  this.tabs.setHeight_px ( height-104 );
  this.usageStats.setFramePosition ( '0px','50px','100%',(height-160)+'px' );
  this.tabs.refresh();
  let inner_height = (height-180)+'px';
  if (this.anlTab)
    $(this.anlTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.usersTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.nodesTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.memoryTab.element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.usageTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.jobsTab  .element).css({'height':inner_height,'overflow-y':'scroll'});
}


AdminPage.prototype.make_analytics_table = function (
      row,col,rowspan,title,nItems,label_empty,header_list,tooltip_list,
      makeRow_func,alignment )  {
let r = row;

  this.anlTab.grid.setLabel(title,r++,col,1,1).setNoWrap();

  if (nItems<=0)  {

    this.anlTab.grid.setLabel ( label_empty,r++,col,rowspan,1 );

  } else  {

    let anlTable = new Table();
    $(anlTable.element).css({'width':'auto'});
    this.anlTab.grid.setWidget ( anlTable,r++,col,rowspan,1 );

    anlTable.setHeaderRow ( header_list,tooltip_list );

    for (let i=0;i<nItems;i++)
      makeRow_func ( anlTable,i );

    anlTable.setAllColumnCSS ({
      'vertical-align' : 'middle',
      'text-align'     : alignment,
      'white-space'    : 'nowrap'
    },1,1 );

  }

  return r;

}


AdminPage.prototype.loadAnalytics = function()  {

  this.anlTab.grid.setLabel ( 'Site Monitor',0,0,1,1 )
                  .setHeight_px ( 32      )
                  .setFontSize  ( '1.5em' )
                  .setFontBold  ( true    );

  (function(self){

    serverRequest ( fe_reqtype.getAnalytics,0,'Admin Page',function(anldata){

      if (__user_role==role_code.admin)
        console.log ( '... loadAnalytics response ' + self.__load_time() );

      // let row = 1;

      // 1. Currently active users

      let row = self.make_analytics_table (
        1,0,1,
        '<h3><i>Now on site</i></h3>',
        anldata.users_current.length,
        '<i>Nobody</i>',
        [ '##',
          'Login',
          'Country',
          'Domain'
        ],[
          'Ordinal number',
          'User login name',
          'Country by registration',
          'Internet domain'
        ],
        function(anlTable,i){
          anlTable.setRow ( '' + (i+1),'',[
            anldata.users_current[i].login,
            anldata.users_current[i].country,
            anldata.users_current[i].domain
          ],i+1,(i & 1)==1 );
        },
        'left'
      );

      // 2. Recent geography

      row = self.make_analytics_table (
        row,0,1,
        '&nbsp;<br><h3><i>Recent users geography</i></h3>',
        anldata.geography_recent.length,
        '<i>No users were present recently</i>',
        [ '##',
          'Country',
          'Users',
          'Domains'
        ],[
          'Ordinal number',
          'Country by registration',
          'Total number of recent users',
          'Internet domains'
        ],
        function(anlTable,i){
          let domains = [];
          for (let j=0;j<anldata.geography_recent[i].domains.length;j++)
            domains.push ( anldata.geography_recent[i].domains[j].domain + ' (' +
                           anldata.geography_recent[i].domains[j].count + ')' );
          anlTable.setRow ( '' + (i+1),'',[
              anldata.geography_recent[i].country,
              anldata.geography_recent[i].ucount,
              domains.join('<br>')
            ],i+1,(i & 1)==1 );
        },
        'left'
      );

      // 3. Page views

      row = self.make_analytics_table (
        row,0,1,
        '&nbsp;<br><h3><i>Page views</i></h3>',
        anldata.doc_stats.length,
        '<i>No views detected</i>',
        [ '##',
          'Page',
          'Views'
        ],[
          'Ordinal number',
          'Page file name',
          'Total number of views'
        ],
        function(anlTable,i){
          anlTable.setRow ( ''  + (i+1),'',[
              '<a href="javascript:launchHelpBox1(\'Documentation\',' +
                '\'' +
                  anldata.doc_stats[i].name.replaceAll('\\','/') +
                '\',null,10)">' +
                  anldata.doc_stats[i].name.replace(/^.*[\\\/]/, '') +
              '</a>',
              anldata.doc_stats[i].count   + ' (' +
                    round(anldata.doc_stats[i].percent,1) + '%)'
            ],i+1,(i & 1)==1 );
        },
        'left'
      );

      // 4. Cumulative unique users per week

      self.anlTab.grid.setLabel ( '&nbsp;',1,1,1,1 )
                      .setWidth_px(40).setNoWrap();

      self.make_analytics_table (
        1,2,row,
        '<h3><i>Unique users by week</i></h3>',
        anldata.users_per_week.length,
        '<i>No data collected yet</i>',
        [ 'Week',
          'Users'
        ],[
          'Week number from today',
          'Number of unique users detected last time'
        ],
        // function(anlTable,i){
        //   let j = anldata.users_per_week.length - i;
        //   anlTable.setRow ( j.toString(),'',[
        //       anldata.users_per_week[j-1]
        //     ],i+1,(i & 1)==1 );
        // },
        function(anlTable,i){
          let j = anldata.users_per_week.length - i;
          anlTable.setRow ( j.toString(),'',[
              anldata.users_per_week[i]
            ],i+1,(i & 1)==1 );
          if (j==1)  {
            let total = 0;
            for (let k=0;k<anldata.users_per_week.length;k++)
              total += anldata.users_per_week[k];
            anlTable.setRow ( 'Total:','Total number of active unique users',
                              [total],i+2,(i & 1)!=1 );
          }
        },
        'right'
      );

      // 5. Years geography

      self.anlTab.grid.setLabel ( '&nbsp;',1,3,1,1 )
                      .setWidth_px(40).setNoWrap();
      self.make_analytics_table (
        1,4,row,
        '<h3><i>Year\'s geography</i></h3>',
        anldata.geography_year.length,
        '<i>No users were present yet</i>',
        [ '##',
          'Country',
          'Users',
          'Domains'
        ],[
          'Ordinal number',
          'Country by registration',
          'Total number of recent users',
          'Internet domains'
        ],
        function(anlTable,i){
          let domains = [];
          for (let j=0;j<anldata.geography_year[i].domains.length;j++)
            domains.push ( anldata.geography_year[i].domains[j].domain + ' (' +
                           anldata.geography_year[i].domains[j].count + ')' );
          anlTable.setRow ( '' + (i+1),'',[
              anldata.geography_year[i].country,
              anldata.geography_year[i].ucount,
              domains.join('<br>')
            ],i+1,(i & 1)==1 );
        },
        'left'
      );

      self.anlTab.grid.setCellSize ( '50%','',1,5 );

    },null,'persist');

  }(this))

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

  // let loggedUsers;
  // if ('loggedUsers' in udata)  loggedUsers = udata.loggedUsers;
  //                        else  loggedUsers = udata.loginHash.loggedUsers;
  let loggedUsers = udata.loginHash.loggedUsers;
  for (let i=0;i<udata.userList.length;i++)  {
    let trow  = this.userListTable.addRow();
    let uDesc = udata.userList[i];
    trow.addCell ( i+1         ).setNoWrap().setHorizontalAlignment('right');
    trow.addCell ( uDesc.name  ).setNoWrap();
    trow.addCell ( uDesc.login ).setNoWrap();
    let online = '&nbsp;';
    for (let token in loggedUsers)
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
    let lastSeen = '';
    if ('lastSeen' in uDesc)  {
      if (uDesc.lastSeen)
        lastSeen = new Date(uDesc.lastSeen).toISOString().slice(0,10);
    }
    trow.addCell ( lastSeen ).setNoWrap().setHorizontalAlignment('right');
    trow.uDesc = uDesc;
  }

  if (__user_role==role_code.admin)  {
    (function(self){
      self.userListTable.addSignalHandler ( 'row_dblclick',function(trow){
        //alert ( 'trow='+JSON.stringify(trow.uDesc) );
        new ManageUserDialog ( trow.uDesc,FEconfig,function(){ self.refresh(); } );
      });
    }(this))
  }

  this.userListTable.createTable ( null );

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

//  $(this.userListTable.element).css({'overflow-y':'hidden'});

//  this.usersTab.grid.setWidget ( this.userListTable,1,0,1,2 );

  if (__user_role==role_code.admin)
    console.log ( '... Users Tab complete in ' + this.__load_time() );

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
      'Current number of stalled or zombie jobs on the node. Square brackets, ' +
      'if shown, indicate number of jobs awaiting pull request from FE'
    ]
  );

  function small_font ( S )  {
    return '<font style="font-size:80%">' + S + '</font>';
  }

  let row = 1;

  let FEname;
  if (__setup_desc)        FEname = __setup_desc.name;
  else if (__local_setup)  FEname = 'Home setup';
                     else  FEname = 'Unnamed setup';


  let fe_url;
  if (('FEProxy' in ndata) && ndata.FEProxy.fe_config)
        fe_url = ndata.FEProxy.fe_config.externalURL;
  else  fe_url = document.location.protocol + '//' +
                 document.location.host +
                 document.location.pathname;
  if (ndata.FEconfig.externalURL!=fe_url)
    fe_url += '<br><i>[' + ndata.FEconfig.externalURL + ']</i>';

  let app_version = 'unspecified';
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

  let ncn = 1;
  for (let i=0;i<ndata.ncInfo.length;i++)  {
    let nci = ndata.ncInfo[i];
//    if (nci.config.name!='client')  {
    if (nci)  {
      let fasttrack = '&check;';
      if (!nci.config.fasttrack)
        fasttrack = '-';
      let njobs     = 0;
      let nzombies  = 0;
      let npulls    = 0;
      let njdone    = 0;
      let state     = 'running';
      let startDate = 'N/A';
      if (!nci.config.in_use)
        state = 'not in use';
      else if (nci.jobRegister)  {
        njdone  = nci.jobRegister.launch_count;
        for (let item in nci.jobRegister.job_map)
          if (nci.jobRegister.job_map[item].endTime)  {
            if (nci.jobRegister.job_map[item].push_back=='YES')  nzombies++;
                                                           else  npulls++;
          } else
            njobs++;
        startDate = small_font(nci.config.startDate);
      } else  {
        state = 'dead';
      }
      let nc_name = 'NC-' + nci.config.exeType;
      if (nci.config.jobManager!=nci.config.exeType)
        nc_name += '(' + nci.config.jobManager + ')';
      if ('jscofe_version' in nci)  app_version = nci.jscofe_version;
                              else  app_version = 'unspecified';
      let nzp = '' + nzombies;
      if (npulls>0)
        nzp = nzombies + '[' + npulls + ']';
      this.nodeListTable.setRow ( 'NC-' + ncn,'Number Cruncher #' + ncn,
        [nci.config.name,nci.config.externalURL,nc_name,
         startDate,nci.ccp4_version,app_version,fasttrack,state,
         njdone,nci.config.capacity,njobs,nzp],row,(row & 1)==1 );
      row++;
      ncn++;
    }
  }

  this.nodeListTable.setAllColumnCSS ({
    'vertical-align' : 'middle',
    'white-space'    : 'nowrap'
  },1,1 );

  if (__user_role==role_code.admin)
    console.log ( '... Nodes Tab complete in ' + this.__load_time() );

//  this.nodesTab.grid.setWidget ( this.nodeListTable,1,0,1,2 );

}

AdminPage.prototype.makeMemoryInfoTab = function ( mdata,pdata )  {
  
  let grid = this.memoryTab.grid;

  grid.setLabel ( 'Memory Report',0,0,1,1 )
                     .setFontSize('1.5em').setFontBold(true);

  grid.setLabel ( '&nbsp;',grid.getNRows(),0,1,1 );

  if (mdata.cache_enabled)  {
    grid.setLabel ( 'Metadata Cache Status: ON',grid.getNRows(),0,1,1 )
        .setFontSize('1.2em').setFontBold(true);
    grid.setLabel ( '&nbsp;',grid.getNRows(),0,1,1 );

    grid.setLabel ( 'Cache state',grid.getNRows(),0,1,1 )
        .setFontItalic(true).setFontBold(true);
    let cache_table = new Table();
    grid.setWidget ( cache_table,grid.getNRows(),0,1,1 );
    cache_table.setWidth_px ( 400 );
    cache_table.setHeaderRow ( 
      ['Cache','Cached items','Cache capacity','Used memory (MB)'],
      ['Cache type','','','']
    );

    const cdesc = [
      ['User records'        ,'user_cache'        ],
      ['User rations'        ,'user_ration_cache' ],
      ['Project lists'       ,'project_list_cache'],
      ['Project descriptions','project_desc_cache'],
      ['Project metadata'    ,'project_meta_cache'],
      ['Job metadata'        ,'job_meta_cache'    ],
      ['File paths'          ,'file_path_cache'   ]
    ]
    let alt       = false;
    let nc_total  = 0;
    let mem_total = 0;
    for (let i=0;i<cdesc.length;i++)  {
      let used     = mdata[cdesc[i][1]][0];
      let capacity = mdata[cdesc[i][1]][1];
      if (!capacity)
        capacity = 'not limited';
      let used_memory = mdata[cdesc[i][1]][2].toFixed(3);
      cache_table.setRow ( cdesc[i][0],'',[used,capacity,used_memory],
                           i+1,alt );
      nc_total  += mdata[cdesc[i][1]][0];
      mem_total += mdata[cdesc[i][1]][2];
      alt = !alt;
    }
    cache_table.setRow ( 'Total','',[
                           '<b><i>' + nc_total + '</i></b>','',
                           '<b><i>' + mem_total.toFixed(3) + '</i></b>'
                         ],cdesc.length+1,alt );

  } else
    grid.setLabel ( 'Metadata Cache Status: OFF',grid.getNRows(),0,1,1 )
        .setFontSize('1.2em').setFontBold(true);

  grid.setLabel ( '&nbsp;',grid.getNRows(),0,1,1 );
  grid.setLabel ( 'Front-End Memory usage',grid.getNRows(),0,1,1 )
      .setFontItalic(true).setFontBold(true);
  let mem_table = new Table();
  grid.setWidget ( mem_table,grid.getNRows(),0,1,1 );
  mem_table.setWidth_px ( 300 );

  mem_table.setRow ( 'Used RAM (MB)'    ,'',[mdata.usedRAM.toFixed(2)]  ,0,false );
  mem_table.setRow ( 'Total RAM (MB)'   ,'',[mdata.totalRAM.toFixed(2)] ,1,true  );
  mem_table.setRow ( 'Free RAM (MB)'    ,'',[mdata.freeRAM.toFixed(2)]  ,2,false );
  mem_table.setRow ( 'External RAM (MB)','',[mdata.usedRAM.toFixed(2)]  ,3,true  );
  mem_table.setRow ( 'Total Heap (MB)'  ,'',[mdata.totalHeap.toFixed(2)],4,false );

  grid.setLabel ( '&nbsp;',grid.getNRows(),0,1,1 );
  grid.setLabel ( 'Front-End performance stats',grid.getNRows(),0,1,1 )
      .setFontItalic(true).setFontBold(true);
  let perf_table = new Table();
  grid.setWidget ( perf_table,grid.getNRows(),0,1,1 );
  perf_table.setWidth_px ( 300 );

  let alt = false;
  let n   = 0;
  for (let title in pdata)  {
    let t = pdata[title].time/pdata[title].weight;
    perf_table.setRow ( title,'',[t.toFixed(2)],n++,alt );
    alt = !alt;
  }

}

// -------------------------------------------------------------------------

function makeAdminPage ( sceneId )  {
  makePage ( function(){ new AdminPage(sceneId); } );
  setHistoryState ( 'AdminPage' );
}
