
/*
 *  =================================================================
 *
 *    04.04.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Manage User dialog class

function ManageUserDialog ( userData,onExit_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Manage User ' + userData.login );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget  ( this.grid );
  this.userData = userData;
  this.makeLayout ();

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
            dlg.userData.ration.storage   = dlg.storage.getValue();
            dlg.userData.ration.cpu_day   = dlg.cpu_day.getValue();
            dlg.userData.ration.cpu_month = dlg.cpu_month.getValue();

            serverRequest ( fe_reqtype.updateUData_admin,dlg.userData,
                            'Manage User Data', function(response){
              if (response)
                new MessageBoxW ( 'Manage User Data',response,0.5 );
              else
                new MessageBox ( 'Manage User Data',
                  'Account of <i>' + dlg.userData.name +
                  '</i> has been successfully updated, and ' +
                  'notification<br>sent to e-mail address:<p><b><i>' +
                  dlg.userData.email + '</i></b>.' );
              onExit_func();
              $(dlg.element).dialog("close");
            },null,'persist' );

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
                '<p>Are you sure?',
                'Yes, reset',function(){
                  serverRequest ( fe_reqtype.resetUser_admin,dlg.userData,
                                  'Reset User Password', function(response){
                    if (response)
                      new MessageBoxW ( 'Reset User Password',response,0.5 );
                    else
                      new MessageBox ( 'Rest User Password',
                        'Password of <i>' + dlg.userData.name +
                        '</i> has been successfully reset, and ' +
                        'notification<br>sent to e-mail address:<p><b><i>' +
                        dlg.userData.email + '</i></b>.' );
                    onExit_func();
                    $(dlg.element).dialog("close");
                  },null,'persist' );
                },
                'Cancel',function(){});

          }

        }, {
          id   : "delete_btn",
          text : "Delete User",
          click: function() {

            new QuestionBox ( 'Delete User Account',
                '<h2>Delete User Account</h2>' +
                'Account of <i>' + dlg.userData.name + '</i> will be deleted.<p>' +
                'Once deleted, all user data, including registration details,<br>' +
                'imported files, projects and results will be removed from<br>' +
                'the server irrevocably.<p>' +
                'Are you sure?',
                'Yes, delete',function(){
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
                },
                'Cancel',function(){});

          }

        }, {

          id   : "cancel_btn",
          text : "Cancel",
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
                  "cpu_day"        : 24,
                  "cpu_month"      : 240,
                  "jobs"           : [],
                  "storage_used"   : 7194.2757387161255,
                  "cpu_day_used"   : 2.9339583080555554,
                  "cpu_month_used" : 27.34012433444445,
                  "cpu_total_used" : 75.92459110972308,
                  "jobs_total"     : 2264
                }
  }
*/

ManageUserDialog.prototype.putLine = function ( label,value,maxvalue,row,key )  {

  this.grid.setLabel ( label,row,0,1,1 ).setWidth_px(200).setFontBold(true).setNoWrap();
  var w = null;

  switch (key)  {

    //case 0 :  w = this.grid.setInputText(value,row,1,1,5).setWidth('100%').setReadOnly(true);
    case 0 :  w = this.grid.setLabel(value,row,1,1,5).setWidth('100%').setFontItalic(true).setNoWrap();
            break;

    case 1 :  w = this.grid.setInputText(value,row,1,1,5).setWidth('100%');
            break;

    case 2 :  w = new Dropdown();
              this.grid.setWidget ( w,row,1,1,4 );
              for (var i=0;i<value.length-1;i++)
                w.addItem ( value[i],'',i,(value[i]==value[value.length-1]) );
              w.make();
            break;

    case 3 :  w = this.grid.setLabel ( new Date(value).toISOString().slice(0,10),
                                       row,1,1,1 ).setFontItalic(true).setNoWrap();
            break;

    //case 4 :  this.grid.setInputText(value,row,1,1,1).setReadOnly(true).setWidth_px(80);
    case 4 :  this.grid.setLabel ( value,row,1,1,1 ).setFontItalic(true).setWidth_px(80);
              this.grid.setLabel ( '&nbsp;of&nbsp;',row,2,1,1 ).setWidth_px(30);
              w = this.grid.setInputText(maxvalue,row,3,1,1).setWidth_px(80);
              this.grid.setLabel ( '&nbsp;allocated',row,4,1,1 ).setWidth_px(60);
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

    default : ;

  }

  this.grid.setVerticalAlignment ( row,0,'middle' );
  this.grid.setVerticalAlignment ( row,1,'middle' );
  this.grid.setCellSize ( '200px','1.75em',row,0 );

  return w;

}

ManageUserDialog.prototype.makeLayout = function()  {

  this.grid.setLabel ( '<h2>User Data</h2>',0,0,1,4 );

  var row = 1;
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
  var dormant_lbl = 'dormant';
  var dormant_sel = 'active';
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

  this.putLine ( 'Storage disk:',this.userData.volume,0,row++,0 );
  this.storage = this.putLine ( 'Storage used (MB):',
                                round(this.userData.ration.storage_used,1),
                                this.userData.ration.storage,row++,4 );
  this.cpu_day = this.putLine ( 'CPU-hours used (day):',
                                round(this.userData.ration.cpu_day_used,2),
                                this.userData.ration.cpu_day,row++,4 );
  this.cpu_month = this.putLine ( 'CPU-hours used (month):',
                                  round(this.userData.ration.cpu_month_used,2),
                                  this.userData.ration.cpu_month,row++,4 );
  this.putLine ( 'Total jobs run:'      ,this.userData.ration.jobs_total,0,row++,5 );
  this.putLine ( 'Total CPU-hours used:',round(this.userData.ration.cpu_total_used,2),
                                         0,row,5 );

}
