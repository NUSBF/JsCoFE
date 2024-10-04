
/*
 *  =================================================================
 *
 *    03.05.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_manage_user.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Manage User Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Manage User dialog class

function ManageUserDialog ( userData,FEconfig,onExit_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Manage User ' + userData.login );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget ( this.grid );
  this.userData = userData;

  this.diskNames = [];
  if (isObject(FEconfig.projectsPath))
    for (let diskName in FEconfig.projectsPath)
      this.diskNames.push ( diskName );
  if (this.diskNames.indexOf(userData.volume)<0)
    this.diskNames.push ( userData.volume );

  this.makeLayout();

  //w = 3*$(window).width()/5 + 'px';

  (function(dlg){

    $(dlg.element).dialog({
      resizable : false,
      height    : 'auto',
      maxHeight : 600,
      width     : 'auto',
      modal     : true,
      buttons: [
        {
          id   : "update_btn",
          text : "Update",
          click: function() {

            dlg.userData.role    = [role_code.user,role_code.admin,
                                    role_code.developer][dlg.profile.getValue()];
            dlg.userData.licence = ['academic','commercial'][dlg.licence.getValue()];
            if (dlg.status.getValue()==1)  {
              if (!dlg.userData.dormant)
                dlg.userData.dormant = Date.now();
            } else
              dlg.userData.dormant = 0;
            let volume = dlg.diskNames[dlg.volume.getValue()];
            dlg.userData.ration.storage      = dlg.storage     .getValue();
            dlg.userData.ration.storage_max  = dlg.storage_max .getValue();
            dlg.userData.ration.cpu_day      = dlg.cpu_day     .getValue();
            dlg.userData.ration.cpu_month    = dlg.cpu_month   .getValue();
            dlg.userData.ration.cloudrun_day = dlg.cloudrun_day.getValue();
            dlg.userData.ration.archive_year = dlg.archive_year.getValue();

            let msgv = '';
            if (volume!=dlg.userData.volume)
              msgv =
                '<p><b>NOTE:</b> storage disk for user\'s projects ' +
                'will be changed. This is a potentially dangerous ' +
                'procedure, which, if unsuccessful, can result in ' +
                'loss of some or all user data. Therefore, consider ' +
                'preliminary backup or export of user\'s projects.<p>' +
                '<i><u>Please make sure that:</u></i><ul>' +
                '<li>the destination volume has enough of space to ' +
                'accept user\'s data</li>' +
                '<li>no user\'s jobs are running or are queuing on any ' +
                'number cruncher during the change</li>' +
                '<li>that the system is not shut down or restarted before ' +
                'the change is complete</li>' +
                '</li></ul>' +
                'The user will be forcibly logged out and their account ' +
                'suspended until the change is complete. After that, the ' +
                'account will be released automatically.<p>' +
                '<i><u>This operation can take considerable time</u></i>.';

            new QuestionBox ( 'Modify User Account',
                '<div style="width:600px;"><h2>Modify User Account</h2>' +
                'Current account settings of user "<i>' + dlg.userData.name +
                '</i>" will be replaced with ones shown in the dialog, ' +
                'and the user will be informed of the change via e-mail. ' +
                msgv + '<p>Please confirm this action.</div>',[
                { name    : 'Yes, modify',
                  onclick : function(){
                              dlg.userData.volume = volume;
                              serverRequest ( fe_reqtype.updateUData_admin,dlg.userData,
                                              'Manage User Data', function(response){
                                if (response)
                                  new MessageBoxW ( 'Manage User Data',response,0.5 );
                                else
                                  new MessageBox ( 'Manage User Data',
                                    'Account of <i>' + dlg.userData.name +
                                    '</i> has been successfully updated, and ' +
                                    'notification<br>sent to e-mail address:<p><b><i>' +
                                    dlg.userData.email + '</i></b>.', 'msg_confirm' );
                                onExit_func();
                                $(dlg.element).dialog("close");
                              },null,'persist' );
                            }
                },{
                  name    : 'Cancel',
                  onclick : function(){}
                }],'msg_confirm' );

          }

        }, {
          id   : "resetpwd_btn",
          text : "Reset password",
          click: function() {
            new QuestionBox ( 'Reset User Password',
                '<h2>Reset User Password</h2>' +
                'Password of <i>' + dlg.userData.name +
                '</i> will be replaced with a randomly<br>generated one, ' +
                'and sent to the user via e-mail.' +
                '<p>Are you sure?',[
                { name    : 'Yes, reset',
                  onclick : function(){
                              serverRequest ( fe_reqtype.resetUser_admin,dlg.userData,
                                              'Reset User Password', function(response){
                                if (response)
                                  new MessageBoxW ( 'Reset User Password',response,0.5 );
                                else
                                  new MessageBox ( 'Reset User Password',
                                    'Password of <i>' + dlg.userData.name +
                                    '</i> has been successfully reset, and ' +
                                    'notification<br>sent to e-mail address:<p><b><i>' +
                                    dlg.userData.email + '</i></b>.', 'msg_ok' );
                                onExit_func();
                                $(dlg.element).dialog("close");
                              },null,'persist' );
                            }
                },{
                  name    : 'Cancel',
                  onclick : function(){}
                }], 'msg_confirm' );
          }

        }, {
          id   : "delete_btn",
          text : "Delete User",
          click: function() {
            new QuestionBox ( 'Delete User Account',
                '<div style="width:450px;"><h2>Delete User Account "' +
                dlg.userData.login + '"</h2>Account "<i>' + dlg.userData.login +
                '</i>" will be deleted.<p>Once deleted, all user data, ' +
                'including registration details, imported files, projects ' +
                'and results will be removed from the server irrevocably.' +
                '<p>Are you sure?</div>',[
                { name    : 'Yes, delete',
                  onclick : function(){
                              serverRequest ( fe_reqtype.deleteUser_admin,dlg.userData,
                                              'Delete User', function(response){
                                if (response)
                                  new MessageBoxW ( 'Delete User',response,0.5 );
                                else
                                  new MessageBox ( 'Delete User',
                                    'Account of <i>' + dlg.userData.name +
                                    '</i> has been successfully deleted, and ' +
                                    'notification<br>sent to e-mail address:<p><b><i>' +
                                    dlg.userData.email + '</i></b>.' );
                                onExit_func();
                                $(dlg.element).dialog("close");
                              },null,'persist' );
                            }
                },{
                  name    : 'Cancel',
                  onclick : function(){}
                }],'msg_question' );

          }

        }, {
          id   : "retire_btn",
          text : "Retire User",
          click: function() {

            let inputBox = new InputBox ( 'Retire user' );
            inputBox.setText ( '','user_leaving' );
            let ibx_grid = inputBox.grid;
            ibx_grid.setLabel    ( '<div style="width:350px"><h2>Retire user "' +
                                   dlg.userData.login +
                                   '"</h2>User\'s projects will be moved to the ' +
                                   'Successor.' +
                                   '<p><span style="font-size:85%"><i>User and ' +
                                   'Successor will be logged out and their ' +
                                   'accounts suspended until the move is complete.' +
                                   '</i></span></div>',
                                   0,2,2,3 );
            ibx_grid.setLabel    ( 'Successor:&nbsp;',2,2,1,1 );
            let name_inp  = ibx_grid.setInputText ( '',2,3,1,1 )
                  .setStyle      ( 'text',__regexp_login, //'^[A-Za-z][A-Za-z0-9\\-\\._-]+$',
                                   'login name of successor','' )
                  .setFontItalic ( true )
                  .setWidth      ( '250px' );
            ibx_grid.setNoWrap   ( 2,2 );
            ibx_grid.setVerticalAlignment ( 2,3,'middle' );
            inputBox.addWidget   ( ibx_grid );
            inputBox.launch ( 'Retire now',function(){
              let succName = name_inp.getValue();
              if (succName.length<=0)  {
                new MessageBox ( 'No login name',
                         '<h2>Successor login name not given</h2>' +
                         'Successor login name must be specified.',
                         'msg_stop' );
                return false;
              } else if (name_inp.element.validity.patternMismatch)  {
                new MessageBox ( 'Invalid login name',
                      '<h2>Invalid login name</h2>Provide a valid login name.',
                      'msg_stop' );
                return false;
              }
              // alert ( 'Not implemented' );
              // return true;
              serverRequest ( fe_reqtype.retireUser_admin,{
                                userData  : dlg.userData,
                                successor : succName
                              },'Retire User', function(response){
                let stop_reason = '';
                switch (response.code)  {
                  case 'duplicate_users': stop_reason = 'Unsuitable successor name';
                                          break;
                  case 'no_privileges'  : stop_reason = 'No privileges';
                                          break;
                  case 'duplicate_ids'  : stop_reason = 'Duplicate project IDs';
                                          break;
                  case 'started'        : break;
                  default : alert ( 'Unknown stop code.\nresponse=' +
                                    JSON.stringify(response) );
                }
                if (stop_reason)  {
                  new MessageBox ( stop_reason,'<div style="width:400px"><h2>' +
                                      stop_reason + '</h2>' + response.message +
                                      '.</div>','msg_stop' );
                } else  {
                  onExit_func();
                  $(dlg.element).dialog("close");
                }
              },null,'persist' );
              return true;
            });

          }

        }, {

          id   : "cancel_btn",
          text : "Close",
          click: function() {
            $(dlg.element).dialog("close");
          }

        }
      ]
    });

  }(this))

}

ManageUserDialog.prototype = Object.create ( Widget.prototype );
ManageUserDialog.prototype.constructor = ManageUserDialog;


/*
{ "_type"     : "UserData",
  "name"      : "Developer",
  "email"     : "ccp4.cofe@gmail.com",
  "login"     : "devel",
  "licence"   : "academic",
  "pwd"       : "daf98543c487af6ceb230cae002c92fd",
  "nJobs"     : 2108,
  "usedSpace" : 0,
  "helpTopics": ["jscofe_myprojects","jscofe_tasklist","jscofe_project"],
  "knownSince": 1504224000000,
  "lastSeen"  : 1544654575967,
  "ration"    : { "_type"          : "UserRation",
                  "storage"        : 30000,
                  "storage_max"    : 60000,
                  "cpu_day"        : 24,
                  "cpu_month"      : 240,
                  "cloudrun_day"   : 100,
                  "archive_year"   : 2,
                  "jobs"           : [],
                  "archives"       : [],
                  "storage_used"   : 7194.2757387161255,
                  "cpu_day_used"   : 2.9339583080555554,
                  "cpu_month_used" : 27.34012433444445,
                  "cpu_total_used" : 75.92459110972308,
                  "cloudrun_day_used" : 0
                  "jobs_total"     : 2264
                }
  }
*/

ManageUserDialog.prototype.putLine = function ( label,value,maxvalue,row,key )  {

  if (key==7)
        this.grid.setLabel ( label,row,0,1,3 ).setWidth_px(300).setFontBold(true).setNoWrap();
  else  this.grid.setLabel ( label,row,0,1,1 ).setWidth_px(200).setFontBold(true).setNoWrap();
  let w  = null;
  let lw = '&nbsp;allocated';

  switch (key)  {

    //case 0 :  w = this.grid.setInputText(value,row,1,1,5).setWidth('100%').setReadOnly(true);
    case 0 :  w = this.grid.setLabel(value,row,1,1,5).setWidth('100%').setFontItalic(true).setNoWrap();
            break;

    case 1 :  w = this.grid.setInputText(value,row,1,1,5).setWidth('100%');
            break;

    case 2 :  w = new Dropdown();
              this.grid.setWidget ( w,row,1,1,4 );
              for (let i=0;i<value.length-1;i++)
                w.addItem ( value[i],'',i,(value[i]==value[value.length-1]) );
              w.make();
            break;

    case 3 :  w = this.grid.setLabel ( new Date(value).toISOString().slice(0,10),
                                       row,1,1,1 ).setFontItalic(true).setNoWrap();
            break;

    case 6 :  lw = '&nbsp;committed';
    case 4 :  this.grid.setLabel ( ''+value,row,1,1,1 ).setFontItalic(true).setWidth_px(80);
              this.grid.setLabel ( '&nbsp;of&nbsp;',row,2,1,1 ).setWidth_px(30);
              w = this.grid.setInputText(maxvalue,row,3,1,1).setWidth_px(80);
              this.grid.setLabel ( lw,row,4,1,1 ).setWidth_px(60);
              this.grid.setLabel ( '',row,5,1,1 );
              this.grid.setVerticalAlignment ( row,2,'middle' );
              this.grid.setVerticalAlignment ( row,3,'middle' );
              this.grid.setVerticalAlignment ( row,4,'middle' );
              this.grid.setCellSize ( '80px' ,'',row,1 );
              this.grid.setCellSize ( '30px' ,'',row,2 );
              this.grid.setCellSize ( '80px' ,'',row,3 );
              this.grid.setCellSize ( '60px' ,'',row,4 );
              this.grid.setCellSize ( 'auto' ,'',row,5 );
              //this.grid.setCellSize ( '20%'  ,'',9,6 );
            break;

    case 5 :  w = this.grid.setLabel ( value,row,1,1,1 ).setFontItalic(true);
            break;

    case 7 :  w = this.grid.setInputText(maxvalue,row,1,1,1).setWidth_px(80);
              // this.grid.setLabel ( '',row,2,1,1 ).setWidth_px(60);
              // this.grid.setLabel ( '',row,3,1,1 );
              this.grid.setVerticalAlignment ( row,0,'middle' );
              this.grid.setVerticalAlignment ( row,1,'middle' );
              // this.grid.setVerticalAlignment ( row,2,'middle' );
            //   this.grid.setCellSize ( '80px' ,'',row,1 );
            // this.grid.setCellSize ( '30px' ,'',row,2 );
            // this.grid.setCellSize ( '80px' ,'',row,3 );
            // this.grid.setCellSize ( '60px' ,'',row,4 );
            // this.grid.setCellSize ( 'auto' ,'',row,5 );
            //this.grid.setCellSize ( '20%'  ,'',9,6 );
            break;

    default : ;

  }

  this.grid.setVerticalAlignment ( row,0,'middle' );
  this.grid.setVerticalAlignment ( row,1,'middle' );
  this.grid.setCellSize ( '200px','1.75em',row,0 );

  return w;

}

ManageUserDialog.prototype.makeLayout = function()  {

  this.grid.setLabel ( '<h2>User Data</h2>',0,0,1,4 );

  let row = 1;
  this.putLine ( 'Name:'  ,this.userData.name ,0,row++,0 );
  this.putLine ( 'Login:' ,this.userData.login,0,row++,0 );
  this.putLine ( 'E-mail:',this.userData.email,0,row++,0 );
  this.profile = this.putLine ( 'Profile:',[
                                  role_code.user,role_code.admin,
                                  role_code.developer,this.userData.role
                                ], 0,row++,2 );
  this.licence = this.putLine ( 'Licence:',[
                                  'academic','commercial',this.userData.licence
                                ], 0,row++,2 );
  let dormant_lbl = 'dormant';
  let dormant_sel = 'active';
  if (this.userData.dormant)  {
    dormant_lbl += ' since ' + new Date(this.userData.dormant).toISOString().slice(0,10);
    dormant_sel  = dormant_lbl;
  }
  this.status  = this.putLine ( 'Status:',['active',dormant_lbl,dormant_sel],
                                0,row++,2 );
  if (this.userData.hasOwnProperty('feedback'))  {
    if (this.userData.feedback.length>0)
      this.putLine ( 'Feedback agreement:',this.userData.feedback,0,row++,0 );
    else
      this.putLine ( 'Feedback agreement:','not chosen',0,row++,0 );
  } else
    this.putLine ( 'Feedback agreement:','undefined',0,row++,0 );
  this.putLine ( 'Known since:' ,this.userData.knownSince,0,row++,3 );
  if ('lastSeen' in this.userData)
        this.putLine ( 'Last seen:',this.userData.lastSeen,0,row++,3 );
  else  this.putLine ( 'Last seen:','unknown',0,row++,0 );

  //this.putLine ( 'Storage disk:',this.userData.volume,0,row++,0 );
  this.volume = this.putLine ( 'Storage disk:',
                               this.diskNames.concat(this.userData.volume),
                               0,row++,2 );

  this.storage      = this.putLine ( 'Storage used (MBytes):',
                                     round(this.userData.ration.storage_used,1),
                                     this.userData.ration.storage,row++,6 );
  this.storage_max  = this.putLine ( 'Maximum storage allocation (MBytes):',0,
                                     round(this.userData.ration.storage_max,1),
                                     row++,7 );
  this.cpu_day      = this.putLine ( 'CPU-hours used (day):',
                                     round(this.userData.ration.cpu_day_used,2),
                                     this.userData.ration.cpu_day,row++,4 );
  this.cpu_month    = this.putLine ( 'CPU-hours used (month):',
                                     round(this.userData.ration.cpu_month_used,2),
                                     this.userData.ration.cpu_month,row++,4 );
  this.cloudrun_day = this.putLine ( 'CloudRun tasks (day):',
                                     this.userData.ration.cloudrun_day_used,
                                     this.userData.ration.cloudrun_day,row++,4 );
  this.archive_year = this.putLine ( 'Archived projects (year):',
                                     this.userData.ration.archives.length,
                                     this.userData.ration.archive_year,row++,4 );
  this.putLine ( 'Total jobs run:'      ,this.userData.ration.jobs_total,0,row++,5 );
  this.putLine ( 'Total CPU-hours used:',round(this.userData.ration.cpu_total_used,2),
                                         0,row,5 );

}
