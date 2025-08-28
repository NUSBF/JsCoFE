
/*
 *  ========================================================================
 *
 *    15.03.25   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  ========================================================================
 *
 */

'use strict';

// fe_reqtype is globally available in the browser environment
// No need to import cmd module


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
  this.userTable = null;
  
  // Get the last active tab from localStorage
  let activeTabName = localStorage.getItem('adminActiveTab') || 'Users';
  
  // Create all tabs, setting the active one based on stored preference
  this.usersTab  = this.tabs.addTab ( 'Users'      , activeTabName === 'Users'       );
  this.groupsTab = this.tabs.addTab ( 'Groups'     , activeTabName === 'Groups'      );
  this.nodesTab  = this.tabs.addTab ( 'Nodes'      , activeTabName === 'Nodes'       );
  this.memoryTab = this.tabs.addTab ( 'Performance', activeTabName === 'Performance' );
  this.anlTab    = null;
  if (__user_role==role_code.admin)
    this.anlTab  = this.tabs.addTab ( 'Monitor'    , activeTabName === 'Monitor'     );
  this.usageTab  = this.tabs.addTab ( 'Usage'      , activeTabName === 'Usage'       );
  this.jobsTab   = this.tabs.addTab ( 'Jobs'       , activeTabName === 'Jobs'        );
  
  // Set up tab change listener to save the active tab and load tab content if needed
  this.tabs.setTabChangeListener((ui) => {
    const tabName = $(ui.newTab).text().trim();
    localStorage.setItem('adminActiveTab', tabName);
    
    // Load tab content if needed when tab is selected
    if (tabName === 'Groups' && (!this.groupListTable || !this.groupsData)) {
      console.log('Loading Groups tab content on tab activation');
      this.loadGroupsData({
        columns: [
          // Minimal column definition to be replaced by the full definition in loadGroupsData
          { header: 'Group Name', style: { 'text-align': 'left' } }
        ],
        rows: []
      });
    }
  });
  // this.tabs.setVisible ( true );

  // center panel horizontally and make left- and right-most columns page margins
  this.grid.setCellSize ( '10px','auto',1,0,1,1 );
  this.grid.setWidget   ( this.tabs    ,1,1,1,1 );
  this.grid.setCellSize ( '1px','auto' ,1,2,1,1 );

  // this.makeLogoPanel ( 2,0,3 );

  // this.makeAnalyticsTab ( null );

  this.jobsTitle     = this.jobsTab.grid.setLabel  ( '',0,0,1,1 ).setHeight_px ( 32 );
  this.jobStats      = this.jobsTab.grid.setLabel  ( '',1,0,1,1 ).setHeight_px ( 32 );
                                  //      .setFontSize ( '14px' );

  this.usersTitle    = this.usersTab.grid.setLabel ( '',0,0,1,1 ).setHeight_px ( 32 );
  this.adminData     = null;
  this.userListTable = null;
  this.searchFilters = null;
  this.uaPanel       = new Grid('');
  this.usersTab.grid.setWidget   ( this.uaPanel,0,1,1,1 );
  this.usersTab.grid.setCellSize ( '','32px',0,0 );
  this.usersTab.grid.setCellSize ( '','32px',0,1 );
  this.usersTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.usersTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.uaPanel.setLabel    ( '   ',0,0,1,1 );
  this.uaPanel.setCellSize ( '95%','32px',0,0 );

  // Groups tab controls
  this.groupsTitle    = this.groupsTab.grid.setLabel ( '',0,0,1,1 ).setHeight_px ( 32 );
  this.groupListTable = null;
  this.groupsData     = null;
  this.gaPanel        = new Grid('');
  this.groupsTab.grid.setWidget   ( this.gaPanel,0,1,1,1 );
  this.groupsTab.grid.setCellSize ( '','32px',0,0 );
  this.groupsTab.grid.setCellSize ( '','32px',0,1 );
  this.groupsTab.grid.setVerticalAlignment ( 0,0,'middle' );
  this.groupsTab.grid.setVerticalAlignment ( 0,1,'middle' );

  this.gaPanel.setLabel    ( '   ',0,0,1,1 );
  this.gaPanel.setCellSize ( '95%','32px',0,0 );

  let search_btn    = null;
  let newuser_btn   = null;
  let dormant_btn   = null;
  let announce_btn  = null;
  let sendtoall_btn = null;

  this.search_dlg   = null;

  // Groups tab buttons
  let newgroup_btn     = null;
  let searchgroup_btn  = null;
  let managegroup_btn  = null;
  let deletegroup_btn  = null;

  if (__user_role==role_code.admin)  {
    col = 1;
    search_btn    = this.uaPanel.setButton ( '',image_path('search' ),0,col++,1,1 )
                                .setSize('30px','30px');
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

    // Groups tab controls
    col = 1;
    searchgroup_btn  = this.gaPanel.setButton ( '',image_path('search' ),0,col++,1,1 )
                                   .setSize('30px','30px')
                                   .setTooltip('Find groups');
    newgroup_btn     = this.gaPanel.setButton ( '',image_path('user'   ),0,col++,1,1 )
                                   .setSize('30px','30px')
                                   .setTooltip('Create new group');
    deletegroup_btn  = this.gaPanel.setButton ( '',image_path('delete'),0,col++,1,1 )
                                   .setSize('30px','30px')
                                   .setTooltip('Delete selected group');
          managegroup_btn  = this.gaPanel.setButton ( '',image_path('settings'),0,col++,1,1 )
                                   .setSize('30px','30px')
                                   .setTooltip('Manage group memberships');
          for (let i=1;i<col;i++)
      this.gaPanel.setCellSize ( 'auto','32px',0,i );
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

      search_btn.setTooltip ( 'Find users using a search template' );
    
      search_btn.addOnClickListener ( function(){
        self.search_dlg = new TableSearchDialog ( 'Find User',self.userTable,500,60,
          function(){ // on dialog close
            self.search_dlg = null;
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

      // Groups tab event listeners
      if (newgroup_btn) {
        newgroup_btn.addOnClickListener ( function(){
          self.showCreateGroupDialog();
        });
      }

      if (deletegroup_btn) {
        deletegroup_btn.addOnClickListener ( function(){
          self.showDeleteGroupDialog();
        });
      }

      if (searchgroup_btn) {
        searchgroup_btn.addOnClickListener ( function(){
          self.showGroupSearchDialog();
        });
      }

      if (managegroup_btn) {
        managegroup_btn.addOnClickListener ( function(){
          self.showManageGroupsDialog();
        });
      }

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
  document.body.style.cursor = 'wait';
  
  serverRequest ( fe_reqtype.getAdminData,0,'Admin Page',function(data){
    
    document.body.style.cursor = 'auto';

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
        self.makeGroupsInfoTab ( data.groupsInfo );
        
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
                },10);
                return (response!=null);
              });
          }
          return (rsp!=null);
        });
    }

  },null,'persist');

}

AdminPage.prototype.calcUserPageSize = function ( height )  {
  let rowHeight = 29.1953;
  if (this.userTable)
    rowHeight = this.userTable.getRowHeight();
  return  Math.floor ( (height-318*rowHeight/29.1953)/rowHeight );
}

AdminPage.prototype.onResize = function ( width,height )  {

  // *MOBILE*
  let w = __mobile_device ? __mobile_width-200 : width;  

  this.tabs.setWidth_px  ( w - 42 );
  this.tabs.setHeight_px ( height-104 );

  this.usageStats.setFramePosition ( '0px','50px','100%',(height-160)+'px' );

  this.tabs.refresh();

  let inner_height = (height-180)+'px';
  if (this.anlTab)
    $(this.anlTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.usersTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.groupsTab.element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.nodesTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.memoryTab.element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.usageTab .element).css({'height':inner_height,'overflow-y':'scroll'});
  $(this.jobsTab  .element).css({'height':inner_height,'overflow-y':'scroll'});

  if (this.userTable)
    this.userTable.setPageSize ( this.calcUserPageSize(height) );

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
      // Create group information display
      let groupInfo = 'None';
      let groupRole = 'None';
      if (uDesc.group_count && uDesc.group_count > 0) {
        // Show count with tooltip that will display group details
        let groupTooltip = '';
        if (uDesc.groups && uDesc.groups.length > 0) {
          // Create tooltip content with group details
          uDesc.groups.forEach(function(group, index) {
            if (index > 0) groupTooltip += '<br>';
            groupTooltip += group.name + ' (' + group.role + ')';
          });

          // Display count with leadership info if applicable
          if (uDesc.leadership_count > 0) {
            groupInfo = '<span title="' + groupTooltip + '">' + 
                        uDesc.group_count + ' (' + uDesc.leadership_count + ' led)</span>';
          } else {
            groupInfo = '<span title="' + groupTooltip + '">' + uDesc.group_count + '</span>';
          }

          // Set the highest role from all groups
          groupRole = uDesc.groupRole || 'Member';
        } else {
          groupInfo = uDesc.group_count.toString();
        }
      } else if (uDesc.groups && uDesc.groups.length > 0) {
        // Handle case where groups exist but count is missing
        let groupNames = uDesc.groups.map(function(group) {
          return group.name + ' (' + group.role + ')';
        });
        groupInfo = '<span title="' + groupNames.join('<br>') + '">' + uDesc.groups.length + '</span>';
        groupRole = uDesc.groupRole || 'Member';
      } else if (uDesc.groupRole && uDesc.groupRole !== 'None') {
        // Handle case where user has a group role but no groups listed
        groupInfo = '1';
        groupRole = uDesc.groupRole;
      }
      
      tdesc.rows.push ([
        uDesc.name,
        uDesc.login,
        online,
        uDesc.role,
        dormant,
        uDesc.email,
        groupInfo,
        uDesc.groupRole || 'None',
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
  // function to create user info table and fill it with data

  this.usersTitle.setText('Users').setFontSize('1.5em').setFontBold(true);

  let tstate     = null;
  let page_size  = this.calcUserPageSize ( window.innerHeight );
  let start_page = 1;
  let sortCol    = 12;
  if (this.userTable)  {
    tstate     = this.userTable.getTableState();
    page_size  = tstate.pageSize;
    start_page = tstate.crPage;
    sortCol    = tstate.sortCol;
  }

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
      { header  : 'Groups',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Number of groups user belongs to',
        style   : { 'text-align' : 'center', 'width' : '60px' },
        sort    : true
      },
      { header  : 'Role',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'User\'s highest role across all groups',
        style   : { 'text-align' : 'center', 'width' : '60px' },
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
    sortCol     : sortCol,
    mouse_hover : true,
    page_size   : page_size,  // 0 for no pages
    start_page  : start_page,
    ondblclick  : function ( dataRow,callback_func){
      new ManageUserDialog ( dataRow[dataRow.length-1], FEconfig, self.adminData.groupsInfo,
                             function(code){ 
                               callback_func();  // deselect row
                               if (code>0) {
                                 // Force a complete refresh to update group information
                                 setTimeout(function() {
                                   self.refresh();
                                 }, 100);
                               }
                             });
    }
  };

  if (tstate)
    for (let i=0;i<tdesc.columns.length;i++)
      tdesc.columns[i].sort = tstate.sort_list[i];

  this.loggedUsers = udata.loginHash.loggedUsers;

  this.makeUserList ( udata,tdesc );

  this.userTable = new TablePages();
  this.usersTab.grid.setWidget ( this.userTable,1,0,1,2 );

  this.userTable.makeTable ( tdesc );

  if (this.search_dlg)  {
    this.search_dlg.setTable ( this.userTable );
    this.search_dlg.applyFilter();
  }

  if (__user_role==role_code.admin)
    console.log ( '... Users Tab complete in ' + this.__load_time() );

}


AdminPage.prototype.makeNodesInfoTab = function ( ndata )  {
  // function to create user info tables and fill them with data

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
  
  if (__user_role==role_code.admin)
    this.nodeListTable.addOnDblClickListener ( 1,function(){
      new LogViewerDialog ( 0,'Front-End (' + FEname + ') Log Files' );
    });

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
    (function(self,trow){
      self.nodeListTable.addOnDblClickListener ( trow,function(){
        new MessageBox ( 'Log file is not available',
            '<div style="width:360px;"><h2>Log file is not available</h2>' +
            'Log file is not available for the Front-End Proxy.</div>',
            'msg_information');
      });
    }(this,row))
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
      } else if (nci.config.exeType=='REMOTE')  {
        state = 'disconnected';
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
      let ncID = 'NC-' + ncn;
      this.nodeListTable.setRow ( ncID,'Number Cruncher #' + ncn,
        [nci.config.name,nci.config.externalURL,nc_name,
         startDate,nci.ccp4_version,app_version,fasttrack,state,
         njdone,nci.config.capacity,njobs,nzp],row,(row & 1)==1 );

      if (__user_role==role_code.admin)
        (function(self,trow,in_use,nc_name,ncNo){
          self.nodeListTable.addOnDblClickListener ( trow,function(){
            if (!in_use)  {
              new MessageBox ( 'NC not in use',
                  '<div style="width:360px;"><h2>Number Cruncher is not in use</h2>' +
                  'Log files are not available as the Number Cruncher is not in use.' +
                  '</div>','msg_information');
              } else  {
                new LogViewerDialog ( ncNo,nc_name + ' Log Files' );
              }
          });
        }(this,row,nci.config.in_use,ncID + ' (' + nci.config.name + ')',
          nci.config.exeType.toUpperCase()=='CLIENT' ? -1 : i+1))

      row++;
      ncn++;

    }

  }

  this.nodeListTable.setAllColumnCSS ({
    'vertical-align' : 'middle',
    'white-space'    : 'nowrap'
  },1,1 );

  this.nodeListTable.setMouseHoverHighlighting ( 1,1 );

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
    grid.setLabel ( 
      '<table>' +
        '<tr><td>Metadata Cache Status&nbsp;</td><td>:&nbsp;ON</td></tr>' + 
        '<tr><td>On-login preload</td><td>:&nbsp;' +
          (mdata.forceCacheFill ? 'FORCED' : 'NOT FORCED') + '</td></tr>' +
        '<tr><td>Metadata Write Mode</td><td>:&nbsp;' +
          (mdata.force_write_sync ? 'SYNC' : 'ASYNC') + '</td></tr></table>',
          grow++,0,1,1 )
        .setFontSize('1em').setFontBold(true);
    grid.setLabel ( '&nbsp;',grow++,0,1,1 );

    // let wmode = 'ASYNC'
    // if (mdata.force_write_sync)
    //   wmode = 'SYNC';
    // grid.setLabel ( 'Metadata Write Mode: ' + wmode,grow++,0,1,1 )
    //     .setFontSize('1.2em').setFontBold(true);
    // grid.setLabel ( '&nbsp;',grow++,0,1,1 );

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

  mem_table.setRow ( 'Used RAM (MB)'    ,'',[mdata.usedRAM.toFixed(2)] ,0,false );
  mem_table.setRow ( 'Total RAM (MB)'   ,'',[mdata.totalRAM.toFixed(2)],1,true  );
  mem_table.setRow ( 'Free RAM (MB)'    ,'',[mdata.freeRAM.toFixed(2)] ,2,false );
  mem_table.setRow ( 'External RAM (MB)','',[mdata.usedRAM.toFixed(2)] ,3,true  );
  mem_table.setRow ( 'Total Heap (MB)'  ,'',['<b>' + mdata.totalHeap.toFixed(2) + 
                                                                '</b>'],4,false );

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
    if (pdata[title].time_min && pdata[title].time_max)  {
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

}

AdminPage.prototype.makeGroupsInfoTab = function ( gdata )  {
  // function to create groups info table and fill it with data
  let self = this;

  this.groupsTitle.setText('Groups').setFontSize('1.5em').setFontBold(true);

  let tdesc = {
    columns : [   
      { header  : '##',
        hstyle  : { 'text-align' : 'right' },
        tooltip : 'Row number',
        style   : { 'text-align' : 'right', 'width' : '30px' },
        sort    : true
      },
      { header  : 'Group Name',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'Group name',
        style   : { 'text-align' : 'left', 'width' : '120px' },
        sort    : true
      },
      { header  : 'Description',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'Group description',
        style   : { 'text-align' : 'left', 'width' : 'auto' },
        sort    : true
      },
      { header  : 'Created by',
        hstyle  : { 'text-align' : 'left' },
        tooltip : 'User who created the group',
        style   : { 'text-align' : 'left', 'width' : '80px' },
        sort    : true
      },
      { header  : 'Members',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Number of group members',
        style   : { 'text-align' : 'right', 'width' : '60px' },
        sort    : false
      },
      { header  : 'Leaders',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Number of group leaders',
        style   : { 'text-align' : 'right', 'width' : '60px' },
        sort    : false
      },
      { header  : 'Status',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Group status',
        style   : { 'text-align' : 'center', 'width' : '70px' },
        sort    : true
      },
      { header  : 'Created',
        hstyle  : { 'text-align' : 'center' },
        tooltip : 'Date when group was created',
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
    sortCol     : 1,
    mouse_hover : true,
    page_size   : 15,
    start_page  : 1,
    row_select  : 'single', // Enable row selection
    ondblclick  : function ( dataRow,callback_func){
      self.showGroupDetailsDialog ( dataRow[dataRow.length-1],
                                   function(){ 
                                     callback_func();  // deselect row
                                     self.refresh();
                                   });
    }
  };

  // If we have groups data from the initial admin data load, use it
  if (gdata && gdata.groups) {
    this.populateGroupsTable(tdesc, gdata);
  } else {
    // Otherwise, load groups data from server
    this.loadGroupsData(tdesc);
  }

  if (__user_role==role_code.admin)
    console.log ( '... Groups Tab complete in ' + this.__load_time() );
}

AdminPage.prototype.populateGroupsTable = function(tdesc, groupsData) {
  let self = this;
  
  console.log('Populating groups table with data:', groupsData);
  
  if (groupsData && groupsData.groups) {
    let rowNum = 1;
    let groupCount = Object.keys(groupsData.groups).length;
    
    console.log(`Found ${groupCount} groups to display`);
    
    if (groupCount === 0) {
      // No groups to display, add a message to the table
      tdesc.rows.push([
        '<i>No groups available</i>',
        'You are not a member of any groups. Create a new group to get started.',
        '',
        0,
        0,
        'N/A',
        '',
        null
      ]);
    } else {
      // Add each group to the table
      for (let groupId in groupsData.groups) {
        try {
          let group = groupsData.groups[groupId];
          if (!group) continue;
          
          let memberCount = Object.keys(group.members || {}).length;
          let leaderCount = 0;
          for (let member in group.members) {
            if (group.members[member].role === 'leader') {
              leaderCount++;
            }
          }
          
          let createdDate = '';
          try {
            createdDate = new Date(group.created_date).toISOString().slice(0,10);
          } catch (e) {
            console.warn('Invalid date format for group:', group.name);
          }

          tdesc.rows.push([
            group.name,
            group.description || '',
            group.created_by,
            memberCount,
            leaderCount,
            group.status || 'Active',
            createdDate,
            group  // full group data for dialog
          ]);
          rowNum++;
        } catch (error) {
          console.error('Error processing group:', error);
        }
      }
    }
  } else {
    console.warn('No groups data available or invalid format');
    // Add a message when no data is available
    tdesc.rows.push([
      '<i>No data available</i>',
      'Could not retrieve group data. Please try refreshing the page.',
      '',
      0,
      0,
      'N/A',
      '',
      null
    ]);
  }

  self.groupListTable = new TablePages();
  self.groupsTab.grid.setWidget(self.groupListTable, 1, 0, 1, 2);
  self.groupListTable.makeTable(tdesc);
}

AdminPage.prototype.loadGroupsData = function(tdesc) {
  let self = this;

  // Add detailed debug logging
  console.log('[' + getCurrentTimeString() + '] Groups Tab: Requesting groups data from server...');
  console.log('[' + getCurrentTimeString() + '] Groups Tab: Current tab descriptor:', tdesc);
  
  // Create an empty table first in case of errors
  if (!self.groupListTable) {
    console.log('[' + getCurrentTimeString() + '] Groups Tab: Creating new table instance');
    self.groupListTable = new TablePages();
    self.groupsTab.grid.setWidget(self.groupListTable, 1, 0, 1, 2);
  } else {
    console.log('[' + getCurrentTimeString() + '] Groups Tab: Using existing table instance');
  }
  
  // Try with a specific request format
  let requestData = { requestType: 'getAllGroups' };
  
  // Show loading indicator
  self.groupsTitle.setText('Groups (Loading...)').setFontSize('1.5em').setFontBold(true);
  
  console.log('[' + getCurrentTimeString() + '] Groups Tab: Sending server request for groups data');
  serverRequest(fe_reqtype.getAllGroups, requestData, 'Load Groups', function(response) {
    console.log('[' + getCurrentTimeString() + '] Groups Tab: Response received:', response);
    
    // Reset title
    self.groupsTitle.setText('Groups').setFontSize('1.5em').setFontBold(true);
    
    if (response && response.status === 'ok' && response.data) {
      console.log('[' + getCurrentTimeString() + '] Groups Tab: Successfully received groups data');
      
      // Store the groups data for future reference
      self.groupsData = response.data;
      
      // Check if the response has the expected format with a groups property
      if (response.data.groups) {
        console.log('[' + getCurrentTimeString() + '] Groups Tab: Found groups data in response');
        self.populateGroupsTable(tdesc, response.data);
      } else {
        console.warn('[' + getCurrentTimeString() + '] Groups Tab: Response missing groups property');
        // Create a compatible format for the populateGroupsTable function
        let compatibleData = { groups: {} };
        self.populateGroupsTable(tdesc, compatibleData);
      }
    } else if (response && response.status !== 'ok') {
      console.warn('[' + getCurrentTimeString() + '] Groups Tab: Failed to load groups:', response.message || 'Unknown error');
      // Show error message to user
      new MessageBox('Error Loading Groups', 
        '<h2>Failed to load groups</h2>' +
        '<p>Error: ' + (response.message || 'Unknown error') + '</p>' +
        '<p>Please try refreshing the page or contact support.</p>' +
        '<p><small>Time: ' + getCurrentTimeString() + '</small></p>',
        'msg_error');
      // Still create the table but empty
      self.groupListTable.makeTable(tdesc);
    } else {
      console.warn('[' + getCurrentTimeString() + '] Groups Tab: Received unexpected response format');
      // Show error message for unexpected response format
      new MessageBox('Error Loading Groups', 
        '<h2>Unexpected response format</h2>' +
        '<p>The server returned an unexpected response format.</p>' +
        '<p>Please try refreshing the page or contact support.</p>' +
        '<p><small>Time: ' + getCurrentTimeString() + '</small></p>',
        'msg_error');
      // Still create the table but empty
      self.groupListTable.makeTable(tdesc);
    }
  }, null, function(error) {
    // Reset title
    self.groupsTitle.setText('Groups').setFontSize('1.5em').setFontBold(true);
    
    // On error, create empty table and log error
    console.error('[' + getCurrentTimeString() + '] Groups Tab: Error loading groups:', error);
    // Show error message to user
    new MessageBox('Communication Error', 
      '<h2>Failed to communicate with server</h2>' +
      '<p>Could not load group data. Please check your connection and try again.</p>' +
      '<p><small>Time: ' + getCurrentTimeString() + '</small></p>',
      'msg_error');
    // Still create the table but empty
    self.groupListTable.makeTable(tdesc);
  });
}

AdminPage.prototype.showCreateGroupDialog = function() {
  let self = this;

  new FormDialog ( 'Create New Group', 550, 400, [
    { name: 'Group Name', 
      type: 'text', 
      id: 'group_name',
      required: true,
      placeholder: 'Enter group name' 
    },
    { name: 'Description', 
      type: 'textarea', 
      id: 'group_description',
      placeholder: 'Enter group description (optional)' 
    },
    { name: 'Max Members', 
      type: 'number', 
      id: 'max_members',
      value: '50',
      min: '1',
      max: '1000'
    }
  ], [
    { name: 'Create Group',
      onclick: function(formData) {
        if (!formData.group_name || formData.group_name.trim() === '') {
          new MessageBox('Error', 'Group name is required', 'msg_error');
          return;
        }

        let groupData = {
          name: formData.group_name.trim(),
          description: formData.group_description ? formData.group_description.trim() : '',
          max_members: parseInt(formData.max_members) || 50
        };

        self.createNewGroup(groupData);
        return true; // Close dialog
      }
    },
    { name: 'Cancel',
      onclick: function() {
        return true; // Close dialog
      }
    }
  ], 'msg_question' );
}

AdminPage.prototype.createNewGroup = function(groupData) {
  let self = this;

  document.body.style.cursor = 'wait';
  
  let requestData = groupData;

  console.log('[DEBUG] Client - createNewGroup - Starting group creation process');
  console.log('[DEBUG] Client - createNewGroup - Request data:', JSON.stringify(requestData));

  serverRequest ( fe_reqtype.createGroup, requestData, 'Create Group', function(response) {
    console.log('[DEBUG] Client - createNewGroup - Received response:', JSON.stringify(response));

    document.body.style.cursor = 'auto';

    // Handle both standard Response format and direct data format
    let isSuccess = false;
    let groupId = null;

    if (response) {
      // Check for standard Response format: {status: 'ok', data: {group_id, group}}
      if (response.status === 'ok') {
        isSuccess = true;
        groupId = response.data && response.data.group_id;
        console.log('[DEBUG] Client - createNewGroup - Standard response format detected');
      }
      // Check for direct data format: {group_id, group}
      else if (response.group_id && response.group) {
        isSuccess = true;
        groupId = response.group_id;
        console.log('[DEBUG] Client - createNewGroup - Direct data format detected');
      }
    }

    if (isSuccess) {
      console.log('[DEBUG] Client - createNewGroup - Group created successfully');
      if (groupId) {
        console.log('[DEBUG] Client - createNewGroup - Group ID:', groupId);
      }
      
      new MessageBox ( 'Success', 
        '<h2>Group Created Successfully</h2>' +
        '<p>Group "' + groupData.name + '" has been created.</p>' +
        '<p>You are now the group leader.</p>',
        'msg_information' );
      
      self.refresh(); // Refresh the admin page to show new group
      
    } else if (response && response.status && response.status !== 'ok') {
      // Handle explicit error responses
      let errorMessage = response.message || 'Unknown error occurred';
      
      console.log('[DEBUG] Client - createNewGroup - Server returned error:', errorMessage);
      new MessageBox ( 'Error', 
        '<h2>Failed to Create Group</h2>' +
        '<p>' + errorMessage + '</p>',
        'msg_error' );
        
    } else {
      // Handle unexpected response format
      console.log('[DEBUG] Client - createNewGroup - Unexpected response format');
      new MessageBox ( 'Warning', 
        '<h2>Unexpected Response</h2>' +
        '<p>The server response was not in the expected format.</p>' +
        '<p>Please refresh the page to check if the group was created.</p>',
        'msg_warning' );
      self.refresh();
    }

  }, null, function() {
    document.body.style.cursor = 'auto';
    new MessageBox ( 'Error', 
      '<h2>Communication Error</h2>' +
      '<p>Failed to communicate with server. Please try again.</p>',
      'msg_error' );
  });
}

AdminPage.prototype.showGroupSearchDialog = function() {
  new MessageBox ( 'Search Groups',
    '<div style="width:400px;"><h2>Search Groups</h2>' +
    'Group search functionality will be implemented here.<p>' +
    'This will allow filtering groups by name, creator, or status.</div>',
    'msg_information' );
}

AdminPage.prototype.showManageGroupsDialog = function() {
  new MessageBox ( 'Manage Groups',
    '<div style="width:400px;"><h2>Manage Group Memberships</h2>' +
    'Group management functionality will be implemented here.<p>' +
    'This will allow adding/removing members and changing roles.</div>',
    'msg_information' );
}

AdminPage.prototype.showDeleteGroupDialog = function() {
  let self = this;

  if (!this.groupListTable) {
    new MessageBox('Error', 'No groups table available', 'msg_error');
    return;
  }

  // Get the selected row index from the table
  let selectedRowIndex = this.groupListTable.table.selectedRow;
  if (selectedRowIndex < 0) {
    new MessageBox('Select Group', 
      '<h2>No Group Selected</h2>' +
      '<p>Please select a group from the table to delete.</p>',
      'msg_information');
    return;
  }

  // Calculate the index in the tdata array (adjust for header row)
  let dataIndex = selectedRowIndex - this.groupListTable.startRow;
  if (dataIndex < 0 || dataIndex >= this.groupListTable.tdata.length) {
    console.error('[DEBUG] Client - showDeleteGroupDialog - Error: Invalid row index:', dataIndex);
    new MessageBox('Error', 
      '<h2>Selection Error</h2>' +
      '<p>Could not retrieve the selected group data. Please try again.</p>',
      'msg_error');
    return;
  }

  // Get the original row data from tdata
  let rowData = this.groupListTable.tdata[dataIndex];
  if (!rowData || !Array.isArray(rowData)) {
    console.error('[DEBUG] Client - showDeleteGroupDialog - Error: Invalid row data:', rowData);
    new MessageBox('Error', 
      '<h2>Data Error</h2>' +
      '<p>Could not retrieve the selected group data. Please try again.</p>',
      'msg_error');
    return;
  }
  
  // Get the group object from the last element of the row data
  let groupData = rowData[rowData.length - 1];
  
  console.log('[DEBUG] Client - showDeleteGroupDialog - Selected row index:', selectedRowIndex);
  console.log('[DEBUG] Client - showDeleteGroupDialog - Data index:', dataIndex);
  console.log('[DEBUG] Client - showDeleteGroupDialog - Row data length:', rowData.length);
  console.log('[DEBUG] Client - showDeleteGroupDialog - Selected group data type:', typeof groupData);
  console.log('[DEBUG] Client - showDeleteGroupDialog - Selected group data:', groupData ? JSON.stringify(groupData) : 'undefined');
  console.log('[DEBUG] Client - showDeleteGroupDialog - Group ID:', groupData && groupData.id ? groupData.id : 'undefined');
  
  // Ensure groupData has the expected structure
  if (!groupData || typeof groupData !== 'object' || !groupData.id) {
    console.error('[DEBUG] Client - showDeleteGroupDialog - Error: Invalid group data structure');
    new MessageBox('Error', 
      '<h2>Invalid Group Data</h2>' +
      '<p>The selected group data is invalid or missing the group ID.</p>' +
      '<p>Please try selecting the group again or refresh the page.</p>',
      'msg_error');
    return;
  }
  
  let memberCount = Object.keys(groupData.members || {}).length;

  new QuestionBox ( 'Delete Group',
    '<div style="width:450px;"><h2>Delete Group: ' + groupData.name + '</h2>' +
    '<p><b>Warning:</b> This action cannot be undone!</p>' +
    '<p>The group "' + groupData.name + '" will be permanently deleted.</p>' +
    '<p><b>Members affected:</b> ' + memberCount + ' users will be removed from this group.</p>' +
    '<p>Are you sure you want to proceed?</p></div>',
    [
      { name: 'Yes, Delete Group',
        onclick: function() {
          console.log('[DEBUG] Client - deleteGroupButton - Clicked with group ID:', groupData.id);
          if (!groupData.id) {
            console.error('[DEBUG] Client - deleteGroupButton - Error: groupData.id is undefined');
            new MessageBox('Error', 
              '<h2>Failed to Delete Group</h2>' +
              '<p>Group ID is missing. Cannot proceed with deletion.</p>',
              'msg_error');
            return;
          }
          self.deleteGroup(groupData.id);
        }
      },
      { name: 'Cancel',
        onclick: function() {
          console.log('[DEBUG] Client - deleteGroupButton - Cancel clicked');
        }
      }
    ], 'msg_confirm' );
}

AdminPage.prototype.deleteGroup = function(groupId) {
  let self = this;

  // Validate groupId
  if (!groupId) {
    console.error('[DEBUG] Client - deleteGroup - Error: groupId is undefined or empty');
    new MessageBox('Error', 
      '<h2>Failed to Delete Group</h2>' +
      '<p>Group ID is missing. Please select a valid group.</p>',
      'msg_error');
    return;
  }

  document.body.style.cursor = 'wait';

  // Format the request data properly
  let requestData = { groupId: groupId };
  
  console.log('[DEBUG] Client - deleteGroup - Starting group deletion process');
  console.log('[DEBUG] Client - deleteGroup - Group ID:', groupId);
  console.log('[DEBUG] Client - deleteGroup - Request data:', JSON.stringify(requestData));
  
  serverRequest ( fe_reqtype.deleteGroup, requestData, 'Delete Group', function(response) {
    console.log('[DEBUG] Client - deleteGroup - Received response:', JSON.stringify(response));

    document.body.style.cursor = 'auto';

    if (response.status === 'ok') {
      console.log('[DEBUG] Client - deleteGroup - Group deleted successfully');
      new MessageBox ( 'Success', 
        '<h2>Group Deleted Successfully</h2>' +
        '<p>The group has been deleted and all members have been removed.</p>',
        'msg_information' );
      self.refresh(); // Refresh the admin page
    } else {
      console.error('[DEBUG] Client - deleteGroup - Failed to delete group:', response.message || 'Unknown error');
      new MessageBox ( 'Error', 
        '<h2>Failed to Delete Group</h2>' +
        '<p>' + (response.message || 'Unknown error occurred') + '</p>',
        'msg_error' );
    }

  }, null, function() {
    document.body.style.cursor = 'auto';
    new MessageBox ( 'Error', 
      '<h2>Communication Error</h2>' +
      '<p>Failed to communicate with server. Please try again.</p>',
      'msg_error' );
  });
}

AdminPage.prototype.showGroupDetailsDialog = function(groupData, callback_func) {
  let memberCount = Object.keys(groupData.members || {}).length;
  let membersList = [];

  for (let memberLogin in groupData.members) {
    let member = groupData.members[memberLogin];
    membersList.push(memberLogin + ' (' + member.role + ')');
  }

  new MessageBox ( 'Group Details',
    '<div style="width:500px;"><h2>Group: ' + groupData.name + '</h2>' +
    '<p><b>Description:</b> ' + (groupData.description || 'No description') + '</p>' +
    '<p><b>Created by:</b> ' + groupData.created_by + '</p>' +
    '<p><b>Status:</b> ' + groupData.status + '</p>' +
    '<p><b>Members:</b> ' + memberCount + '</p>' +
    '<p><b>Created:</b> ' + new Date(groupData.created_date).toLocaleDateString() + '</p>' +
    (membersList.length > 0 ? 
      '<p><b>Member List:</b><br>' + membersList.join('<br>') + '</p>' : 
      '<p><i>No members in this group</i></p>') +
    '</div>',
    'msg_information' );
  if (callback_func) callback_func();
}

// -------------------------------------------------------------------------

function makeAdminPage ( sceneId )  {
  makePage ( function(){ new AdminPage(sceneId); } );
  setHistoryState ( 'AdminPage' );
}
