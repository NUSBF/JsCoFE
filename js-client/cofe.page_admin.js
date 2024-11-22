
/*
 *  ========================================================================
 *
 *    22.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  ------------------------------------------------------------------------
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
 *  ========================================================================
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
  this.usersTab  = this.tabs.addTab ( 'Users'      ,true  );
  this.nodesTab  = this.tabs.addTab ( 'Nodes'      ,false );
  this.memoryTab = this.tabs.addTab ( 'Performance',false );
  this.anlTab    = null;
  if (__user_role==role_code.admin)
    this.anlTab  = this.tabs.addTab ( 'Monitor'    ,false );
  this.usageTab  = this.tabs.addTab ( 'Usage'      ,false );
  this.jobsTab   = this.tabs.addTab ( 'Jobs'       ,false );
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
  this.adminData     = null;
  this.userListTable = null;
  this.searchFilters   = null;
  this.uaPanel       = new Grid('');
  this.usersTab.grid.setWidget   ( this.uaPanel,0,1,1,1 );
  this.usersTab.grid.setCellSize ( '','32px',0,0 );
  this.usersTab.grid.setCellSize ( '','32px',0,1 );
  this.usersTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.usersTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.uaPanel.setLabel    ( '   ',0,0,1,1 );
  this.uaPanel.setCellSize ( '95%','32px',0,0 );

  let search_btn    = null;
  let newuser_btn   = null;
  let dormant_btn   = null;
  let announce_btn  = null;
  let sendtoall_btn = null;

  if (__user_role==role_code.admin)  {
    col = 1;
    search_btn    = this.uaPanel.setButton ( '',image_path('search' ),0,col++,1,1 )
                                .setSize('30px','30px')
                                .setTooltip('Find user records');
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

      search_btn.addOnClickListener ( function(){
        new FindUserDialog ( function(filters){ 
               self.searchFilters = filters;
               if (self.adminData)
                 self.makeUsersInfoTab ( self.adminData.usersInfo,
                                         self.adminData.nodesInfo.FEconfig );
             });
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

  this.searchFilters = null;

  self = this;
  // (function(self){

    serverRequest ( fe_reqtype.getAdminData,0,'Admin Page',function(data){

      self.adminData = data;

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

  // }(this))

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


// AdminPage.prototype.makeUserList = function ( udata )  {
//   this.userList = [];
//   for (let i=0;i<udata.userList.length;i++)  {
//     let uDesc = udata.userList[i];
//     let includeUser = (!__local_user) || (uDesc.login==__local_user_id);
//     if (includeUser && this.searchFilters)  {
//       includeUser = (
//                      (!this.searchFilters.logname) || 
//                      (uDesc.login==this.searchFilters.logname)
//                     ) && (
//                      (!this.searchFilters.email) || 
//                      (uDesc.email==this.searchFilters.email)
//                     );
//       if (includeUser && this.searchFilters.uname)  {
//         includeUser = false;
//         let words   = this.searchFilters.uname.toUpperCase().split(' ')
//                                               .filter(w => w !== '');
//         let uname   = uDesc.name.toUpperCase();
//         for (let i=0;(i<words.length) && (!includeUser);i++)
//           includeUser = (uname.indexOf(words[i])>=0);
//       }
//     }
//     if (includeUser)  {
//       let online = '&nbsp;';
//       for (let token in this.loggedUsers)
//         if (this.loggedUsers[token].login==uDesc.login)  {
//           online = '&check;';
//           break;
//         }
//       let dormant = 'active';
//       if (uDesc.dormant)
//           dormant = new Date(uDesc.dormant).toISOString().slice(0,10);
//       let lastSeen = '';
//       if ('lastSeen' in uDesc)  {
//         if (uDesc.lastSeen)
//           lastSeen = new Date(uDesc.lastSeen).toISOString().slice(0,10);
//       }
//       let urec = {
//         name       : uDesc.name,
//         login      : uDesc.login,
//         online     : online,
//         role       : uDesc.role,
//         dormant    : dormant,
//         email      : uDesc.email,
//         licence    : uDesc.licence,
//         njobs      : uDesc.ration.jobs_total,
//         storage    : round(uDesc.ration.storage_used,1),
//         cpu        : round(uDesc.ration.cpu_total_used,2),
//         knownAfter : new Date(uDesc.knownSince).toISOString().slice(0,10),
//         lastSeen   : lastSeen,
//         uDesc      : uDesc
//       };
//       this.userList.push ( urec );
//     }
//   }
// }

// var __slist = [
//   ['name'      ,true],
//   ['login'     ,true],
//   ['online'    ,true],
//   ['role'      ,true],
//   ['dormant'   ,true],
//   ['email'     ,true],
//   ['licence'   ,true],
//   ['njobs'     ,false],
//   ['storage'   ,false],
//   ['cpu'       ,false],
//   ['knownAfter',false],
//   ['lastSeen'  ,false]
// ];

// AdminPage.prototype.sortUserList = function()  {
//   if (this.sortCol>0)
//     this.userList = sortObjects ( this.userList,__slist[this.sortCol-1][0],
//                                                 __slist[this.sortCol-1][1] );
// }

// AdminPage.prototype.makeUserTable = function ( startNo,pageLen,FEconfig )  {
//   // function to create user info tables and fill them with data

//   let userTable = new Table();
//   this.usersTab.grid.setWidget ( userTable,1,0,1,2 );

//   let headers = [[
//       '##','Name','Login','Online','Profile','Dormant<br>since','E-mail',
//       'Licence','N<sub>jobs</sub>','Space<br>(MB)','CPU<br>(hours)',
//       'Known<br>since','Last seen'
//     ],[
//       'Row number','User name','User login name',
//       'Ticked if user is currently logged in','User profile',
//       'Date when user was deemed as dormant','User contact e-mail address',
//       'Type of user\'s licence','Total number of jobs run by user',
//       'Total disk space currently occupied by user\'s projects',
//       'Total CPU time consumed by user','Date when user account was created',
//       'Date when user was seen last time'
//     ],[
//       ['right' ,'30px' ],
//       ['left'  ,'100px'],
//       ['left'  ,'40px' ],
//       ['center','50px' ],
//       ['left'  ,'70px' ],
//       ['center','80px' ],
//       ['left'  ,'auto' ],
//       ['center','60px' ],
//       ['right' ,'50px' ],
//       ['right' ,'70px' ],
//       ['right' ,'60px' ],
//       ['center','80px' ],
//       ['center','80px' ]
//     ]];

//   let sh = headers[0][this.sortCol].split('<br>');
//   if (__slist[this.sortCol-1][1])
//         sh[0] += '&nbsp;&darr;';
//   else  sh[0] += '&nbsp;&uarr;';
//   headers[0][this.sortCol] = sh.join('<br>');

//   userTable.setHeaderRow ( headers[0],headers[1] );

//   let row     = 0;
//   // let udindex = [];
//   let endNo   = Math.min ( this.userList.length,startNo+pageLen );
//   for (let i=startNo;i<endNo;i++)  {
//     row++;
//     let urec = this.userList[i];
//     // udindex.push ( i );
//     userTable.setRow ( ''+(i+1),'',[
//         urec.name,
//         urec.login,
//         urec.online,
//         urec.role,
//         urec.dormant,
//         urec.email,
//         urec.licence,
//         urec.njobs,
//         urec.storage,
//         urec.cpu,
//         urec.knownAfter,
//         urec.lastSeen
//       ],row,row % 2 );
//   }

//   if (__user_role==role_code.admin)  {
//     let self = this;
//     userTable.addSignalHandler ( 'dblclick',function(target){
//       // Ensure the click happened inside a table row (skip headers)
//       if (target.tagName === "TD") {
//         const row    = target.parentElement; // The <tr> containing the clicked <td>
//         const uindex = startNo + row.rowIndex; // Get the row index (1-based for <tbody>)
//         userTable.selectRow ( row.rowIndex,1 );
//         new ManageUserDialog ( self.userList[uindex-1].uDesc,FEconfig,
//                                function(code){ 
//                                  userTable.selectRow ( -1,1 );  // deselect
//                                  if (code>0)
//                                    self.refresh();
//                                });
//       }
//     });
//     userTable.addSignalHandler ( 'click',function(target){
//       if (target.tagName === "TH") {
//         let colNo = 0;
//         for (let i=0;(i<headers[0].length) && (!colNo);i++)  {
//           let prefix = headers[0][i].split('<')[0].split('&')[0];
//           if (target.innerHTML.startsWith(prefix))
//             colNo = i;
//         }
//         if (colNo>0)  {
//           if (colNo==self.sortCol)
//             __slist[colNo-1][1] = !__slist[colNo-1][1];
//           self.sortCol = colNo;
//           self.sortUserList  ();
//           self.makeUserTable ( startNo,pageLen,FEconfig );
//         }
//       }
//     });
//   }

//   userTable.setCellCSS ({'color':'yellow'},0,this.sortCol );

//   for (let i=0;i<headers[2].length;i++)
//     userTable.setColumnCSS ( { 'text-align' : headers[2][i][0],
//                                'width'      : headers[2][i][1]  
//                              } ,i,1 );

//   userTable.setAllColumnCSS ({'cursor'      : 'pointer',
//                               'white-space' : 'nowrap',
//                               'font-family' : 'Arial, Helvetica, sans-serif'
//                              },0,1 );

//   userTable.setMouseHoverHighlighting(1,1);

// }


// AdminPage.prototype.makeUsersInfoTab = function ( udata,FEconfig )  {
//   // function to create user info tables and fill them with data

//   this.usersTitle.setText('Users').setFontSize('1.5em').setFontBold(true);

//   let pageLen      = 20;
//   this.sortCol     = 12;
//   this.loggedUsers = udata.loginHash.loggedUsers;

//   this.makeUserList ( udata );
//   this.sortUserList ();

//   if (this.userList.length<pageLen)  {
//     this.makeUserTable ( 0,pageLen,FEconfig );
//     this.usersTab.grid.setLabel ( '&nbsp;',2,0,1,2 );
//   } else  {
//     let self = this;
//     this.usersTabPaginator = new Paginator ( this.userList.length,pageLen,7,
//       function(pageNo){
//         self.makeUserTable ( pageLen*(pageNo-1),pageLen,FEconfig );
//       });
//     this.usersTab.grid.setWidget ( this.usersTabPaginator,2,0,1,2 );
//   }

//   if (__user_role==role_code.admin)
//     console.log ( '... Users Tab complete in ' + this.__load_time() );

// }

AdminPage.prototype.makeUserList = function ( udata,tdesc )  {
  // this.userList = [];
  for (let i=0;i<udata.userList.length;i++)  {
    let uDesc = udata.userList[i];
    let includeUser = (!__local_user) || (uDesc.login==__local_user_id);
    if (includeUser && this.searchFilters)  {
      includeUser = (
                     (!this.searchFilters.logname) || 
                     (uDesc.login==this.searchFilters.logname)
                    ) && (
                     (!this.searchFilters.email) || 
                     (uDesc.email==this.searchFilters.email)
                    );
      if (includeUser && this.searchFilters.uname)  {
        includeUser = false;
        let words   = this.searchFilters.uname.toUpperCase().split(' ')
                                              .filter(w => w !== '');
        let uname   = uDesc.name.toUpperCase();
        for (let i=0;(i<words.length) && (!includeUser);i++)
          includeUser = (uname.indexOf(words[i])>=0);
      }
    }
    if (includeUser)  {
      let online = '&nbsp;';
      for (let token in this.loggedUsers)
        if (this.loggedUsers[token].login==uDesc.login)  {
          online = '&check;';
          break;
        }
      let dormant = 'active';
      if (uDesc.dormant)
          dormant = new Date(uDesc.dormant).toISOString().slice(0,10);
      let lastSeen = '';
      if ('lastSeen' in uDesc)  {
        if (uDesc.lastSeen)
          lastSeen = new Date(uDesc.lastSeen).toISOString().slice(0,10);
      }
      tdesc.rows.push ([
        uDesc.name,
        uDesc.login,
        online,
        uDesc.role,
        dormant,
        uDesc.email,
        uDesc.licence,
        uDesc.ration.jobs_total,
        round(uDesc.ration.storage_used,1),
        round(uDesc.ration.cpu_total_used,2),
        new Date(uDesc.knownSince).toISOString().slice(0,10),
        lastSeen,
        uDesc
      ]);
    }
  }
}


AdminPage.prototype.makeUsersInfoTab = function ( udata,FEconfig )  {
  // function to create user info tables and fill them with data

  this.usersTitle.setText('Users').setFontSize('1.5em').setFontBold(true);

  let tdesc = {
    columns : [   
      { header  : '##',
        hstyle  : { 'text-align' : 'right' },
        tooltip : 'Row number',
        style   : { 'text-align' : 'right', 'width' : '30px' },
        sort    : true
      },
      { header  : 'Name',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'User name',
        style   : { 'text-align' : 'left', 'width' : '100px' },
        sort    : true
      },
      { header  : 'Login',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'User login name',
        style   : { 'text-align' : 'left', 'width' : '40px' },
        sort    : true
      },
      { header  : 'Online',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Ticked if user is currently logged in',
        style   : { 'text-align' : 'center', 'width' : '50px' },
        sort    : true
      },
      { header  : 'Profile',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'User profile',
        style   : { 'text-align' : 'left', 'width' : '70px' },
        sort    : true
      },
      { header  : 'Dormant<br>since',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Date when user was deemed as dormant',
        style   : { 'text-align' : 'center', 'width' : '80px' },
        sort    : true
      },
      { header  : 'E-mail',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'User contact e-mail address',
        style   : { 'text-align' : 'left', 'width' : 'auto' },
        sort    : true
      },
      { header  : 'Licence',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Type of user\'s licence',
        style   : { 'text-align' : 'center', 'width' : '60px' },
        sort    : true
      },
      { header  : 'N<sub>jobs</sub>',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Total number of jobs run by user',
        style   : { 'text-align' : 'right', 'width' : '50px' },
        sort    : false
      },
      { header  : 'Space<br>(MB)',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Total disk space currently occupied by user\'s projects',
        style   : { 'text-align' : 'right', 'width' : '70px' },
        sort    : false
      },
      { header  : 'CPU<br>(hours)',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Total CPU time consumed by user',
        style   : { 'text-align' : 'right', 'width' : '60px' },
        sort    : false
      },
      { header  : 'Known<br>since',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Date when user account was created',
        style   : { 'text-align' : 'center', 'width' : '80px' },
        sort    : false
      },
      { header  : 'Last seen',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Date when user was seen last time',
        style   : { 'text-align' : 'center', 'width' : '80px' },
        sort    : false
      }
    ],
    rows        : [],
    vheaders    : 'row',
    style       : { 'cursor'      : 'pointer',
                    'white-space' : 'nowrap',
                    'font-family' : 'Arial, Helvetica, sans-serif'
                  }, 
    sortCol     : 12,
    mouse_hover : true,
    page_size   : 20,  // 0 for no pages
    ondblclick  : function ( dataRow,callback_func){
      new ManageUserDialog ( dataRow[dataRow.length-1],FEconfig,
                             function(code){ 
                               callback_func();  // deselect row
                               if (code>0)
                                 self.refresh();
                             });
    }
  };

  this.loggedUsers = udata.loginHash.loggedUsers;

  this.makeUserList ( udata,tdesc );

  let userTable = new TablePages();
  this.usersTab.grid.setWidget ( userTable,1,0,1,2 );

  userTable.makeTable ( tdesc );

  if (__user_role==role_code.admin)
    console.log ( '... Users Tab complete in ' + this.__load_time() );

}




/*
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
    let uDesc = udata.userList[i];
    if ((!__local_user) || (uDesc.login==__local_user_id))  {
      let trow  = this.userListTable.addRow();
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

  this.usersTabPaginator = new Paginator ( udata.userList.length+200,20,7,
      function(){} );

  this.usersTab.grid.setWidget ( this.usersTabPaginator,2,0,1,2 );

  if (__user_role==role_code.admin)
    console.log ( '... Users Tab complete in ' + this.__load_time() );

}
*/


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
  let grow = 0;

  grid.setLabel ( 'Memory Report',0,0,1,1 )
      .setFontSize('1.5em').setFontBold(true);

  grid.setLabel ( '&nbsp;',grow++,0,1,1 );

  if (mdata.cache_enabled)  {
    grid.setLabel ( 'Metadata Cache Status: ON',grow++,0,1,1 )
        .setFontSize('1.2em').setFontBold(true);
    grid.setLabel ( '&nbsp;',grow++,0,1,1 );

    let wmode = 'ASYNC'
    if (mdata.force_write_sync)
      wmode = 'SYNC';
    grid.setLabel ( 'Metadata Write Mode: ' + wmode,grow++,0,1,1 )
        .setFontSize('1.2em').setFontBold(true);
    grid.setLabel ( '&nbsp;',grow++,0,1,1 );

    grid.setLabel ( 'Cache state',grow++,0,1,1 )
        .setFontItalic(true).setFontBold(true);
    let cache_table = new Table();
    grid.setWidget ( cache_table,grow++,0,1,1 );
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

  } else  {
    grid.setLabel ( 'Metadata Cache Status: OFF',grow++,0,1,1 )
        .setFontSize('1.2em').setFontBold(true);
    grid.setLabel ( '&nbsp;',grow++,0,1,1 );
    grid.setLabel ( 'Metadata Write Mode: SYNC' ,grow++,0,1,1 )
        .setFontSize('1.2em').setFontBold(true);
  }

  grid.setLabel ( '&nbsp;',grow++,0,1,1 );
  grid.setLabel ( 'Front-End Memory usage',grow++,0,1,1 )
      .setFontItalic(true).setFontBold(true);
  let mem_table = new Table();
  grid.setWidget ( mem_table,grow++,0,1,1 );
  mem_table.setWidth_px ( 300 );

  mem_table.setRow ( 'Used RAM (MB)'    ,'',[mdata.usedRAM.toFixed(2)]  ,0,false );
  mem_table.setRow ( 'Total RAM (MB)'   ,'',[mdata.totalRAM.toFixed(2)] ,1,true  );
  mem_table.setRow ( 'Free RAM (MB)'    ,'',[mdata.freeRAM.toFixed(2)]  ,2,false );
  mem_table.setRow ( 'External RAM (MB)','',[mdata.usedRAM.toFixed(2)]  ,3,true  );
  mem_table.setRow ( 'Total Heap (MB)'  ,'',[mdata.totalHeap.toFixed(2)],4,false );

  grid.setLabel ( '&nbsp;',grow++,0,1,1 );
  grid.setLabel ( 'Front-End performance stats',grow++,0,1,1 )
      .setFontItalic(true).setFontBold(true);
  let perf_table = new Table();
  grid.setWidget ( perf_table,grow++,0,1,1 );
  perf_table.setWidth_px ( 300 );
  perf_table.setHeaderRow ( 
    [' ','Min','Average','Max'],
    ['','','','']
  );

  let alt = false;
  let n   = 0;
  for (let title in pdata)  {
    let t = pdata[title].time/pdata[title].weight;
    perf_table.setRow ( title,'',[
        pdata[title].time_min.toFixed(2),
        t.toFixed(2),
        pdata[title].time_max.toFixed(2)
      ],++n,alt );
    alt = !alt;
    if (title.startsWith('Server'))  {
      perf_table.setRow ( 'Server request time, ms',
          'Time between sending request and receiving a response in browser',[
          __request_timing.time_min.toFixed(2),
          (__request_timing.time_sum/__request_timing.n_sum).toFixed(2),
          __request_timing.time_max.toFixed(2)
        ],++n,alt );
      alt = !alt;
    }
  }

}

// -------------------------------------------------------------------------

function makeAdminPage ( sceneId )  {
  makePage ( function(){ new AdminPage(sceneId); } );
  setHistoryState ( 'AdminPage' );
}
