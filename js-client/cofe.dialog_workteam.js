
/*
 *  =================================================================
 *
 *    15.11.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_workteam.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Work Team Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';


function WorkTeamDialog ( projectDesc,jobTree=null )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Work Team' );
  document.body.appendChild ( this.element );

  this.grid = new Grid  ( '' );
  this.addWidget        ( this.grid );
  this.grid.setLabel    ( ' ',0,0,1,1 );
  this.grid.setCellSize ( '','6px', 0,0 );
  this.grid.setImage    ( image_path('workteam'),'48px','48px', 1,0,1,1 );
  this.grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );

  this.archived    = projectDesc.archive && projectDesc.archive.in_archive;
  this.joined      = isProjectJoined(__login_id,projectDesc);
  this.can_share   = (!this.archived) && (!this.joined) && (!__local_user);
  this.projectDesc = projectDesc;
  this.jobTree     = jobTree;

  var self = this;
  this.makeLayout ( function(){
    if (self.can_share)  {
      $(self.element).dialog({
        resizable : false,
        height    : 'auto',
        maxHeight : 600,
        width     : 'auto',
        modal     : true,
        buttons   : [{
          id    : 'share_btn_' + __id_cnt++,
          text  : 'Add team member',
          click : function() {
                    self.addUser();
                  }
        },{
          id    : 'ok_btn_' + __id_cnt++,
          text  : 'Ok',
          click : function() {
                    $(this).dialog ( 'close' );
                  }
        }]
      });
    } else  {
      $(self.element).dialog({
        resizable : false,
        height    : 'auto',
        maxHeight : 600,
        width     : 'auto',
        modal     : true,
        buttons   : [{
          id    : 'ok_btn_' + __id_cnt++,
          text  : 'Ok',
          click : function() {
                    $(this).dialog ( 'close' );
                  }
        }]
      });
    }
  });

}

WorkTeamDialog.prototype = Object.create ( Widget.prototype );
WorkTeamDialog.prototype.constructor = WorkTeamDialog;


// ============================================================================

WorkTeamDialog.prototype.access_desc = function ( permissions )  {
  switch (permissions)  {
    case share_permissions.view_only : return 'view only';  
    case share_permissions.run_own   : return 'run and delete own jobs';
    case share_permissions.full      : return 'full';
    default : ;
  }
  return '';
}


WorkTeamDialog.prototype.makeLayout = function ( callback_func )  {

  var self   = this;

  var author = getProjectAuthor ( this.projectDesc );
  var owner  = getProjectOwner  ( this.projectDesc );

  serverRequest ( fe_reqtype.shareProjectConfirm,{
    desc   : this.projectDesc,
    share0 : this.projectDesc.share,
    author : author,
    owner  : owner
  },'Share Project Confirm',
    function(data){
      let info  = 
        '<h2>Project "' + self.projectDesc.name + '" Work Team</h2>' +
        '<div style="max-height:200px;overflow-y:auto">' +
        '<table>';
      if (data.author[0]==data.owner[0])  {
        info += '<tr><td><b><i>Author & Owner</i> :</b></td><td>' + data.author[1] +
              '</td><td>&nbsp;<b>[' + data.author[0] + ']</b>&nbsp;</td></tr>';
      } else  {
        info += '<tr><td><b><i>Author</i> :</b></td><td>' + data.author[1] +
              '</td><td>&nbsp;<b>[' + data.author[0] + ']</b>&nbsp;</td></tr>' +
            '<tr><td><b><i>Owner</i> :&nbsp;</b></td><td>' + data.owner[1] +
              '</td><td>&nbsp;<b>[' + data.owner[0] + ']</b>&nbsp;</td></tr>';
      }
      info += '<tr><td colspan=3 height="6px"> </td></tr>';
      if (data.oldShared.length<=0)  {
        info += '<tr><td colSpan=2><b><i>Team members</i>:&nbsp;</b>' +
                '<i>None</i></td></tr>';
        self.grid.setLabel ( info,0,2,2,1 );
      } else  {

        info += '<tr><td colSpan=2><b><i>Team members:</i></b>';
        if (self.archived)
          info += '&nbsp;<span style="font-size:80%">(cannot be managed for archived projects)</span>';
        else if (__local_user)
          info += '&nbsp;<span style="font-size:80%">(cannot be managed in Local Mode)</span>';
        else if (self.joined)
          info += '&nbsp;<span style="font-size:80%">(can be managed only by Owner)</span>';
        info += '</td></tr>';
        self.grid.setLabel ( info,0,2,2,1 );

        let table = new Table();
        self.grid.setWidget ( table,2,2,1,1 );

        table.setHeaderRow ( 
          ['##','Name','Login','Access level'],
          ['','','','']
        );

        let row = 0;
        let alt = false;

        if (self.can_share)  {
          
          for (let i=0;i<data.oldShared.length;i++)  {
            row++;
            let uname  = data.oldShared[i][1];
            let slogin = data.oldShared[i][0];
            table.setRow ( '' + row,'',[
              uname,
              '<b>[' + slogin + ']</b>'
            ],row,alt );
            let permissions = data.oldShared[i][3].permissions;
            let roleCombo   = new Dropdown();
            table.setWidget    ( roleCombo,row,3,alt );
            roleCombo.setWidth ( '230px' );
            roleCombo.addItem  ( 'view only','',share_permissions.view_only,
                                 permissions==share_permissions.view_only );
            roleCombo.addItem  ( 'run and delete own jobs','',share_permissions.run_own,
                                 permissions==share_permissions.run_own );
            roleCombo.addItem  ( 'full','',share_permissions.full,
                                 permissions==share_permissions.full );
            roleCombo.addItem  ( 'unshare','','unshare',false );
            roleCombo.make();
            roleCombo.addOnChangeListener ( function(text,value){
              if (value=='unshare')
                self.unshareUser ( slogin,uname );
              else if (value!=permissions)
                self.changePermissions ( slogin,uname,permissions,value );
            });
            alt = !alt;
          }
          
          for (let i=0;i<data.unknown.length;i++)  {
            row++;
            let slogin = data.unknown[i];
            table.setRow ( '' + row,'',[
              '<i>Unknown</i>',
              '<b>[' + slogin + ']</b>'
            ],row,alt );
            let unk_btn = new Button  ( 'unshare',image_path('unknown_user') );
            table.setWidget  ( unk_btn,row,3,alt )
            unk_btn.setWidth ( '230px' );
            unk_btn.addOnClickListener ( function(){
              self.unshareUser ( slogin,'Unknown' );
            });
            alt = !alt;
          }

        } else  {
          
          for (let i=0;i<data.oldShared.length;i++)  {
            row++;
            table.setRow ( '' + row,'',[
              data.oldShared[i][1],
              '<b>[' + data.oldShared[i][0] + ']</b>',
              self.access_desc ( data.oldShared[i][3].permissions )
            ],row,alt );
            alt = !alt;
          }

          for (let i=0;i<data.unknown.length;i++)  {
            row++;
            let slogin = data.unknown[i];
            table.setRow ( '' + row,'',[
              '<i>Unknown</i>',
              '<b>[' + slogin + ']</b>',
              ''
            ],row,alt );
            alt = !alt;
          }

        }

        table.setAllColumnCSS ({
          'vertical-align' : 'middle',
          'text-align'     : 'left',
          'white-space'    : 'nowrap',
          'font-family'    : 'arial'
        },1,1 );

      }

      if (callback_func)
        callback_func();

    },null,null );

}


WorkTeamDialog.prototype.addUser = function()  {

  var self = this;

  var inputBox = new InputBox ( 'Add team member' );
  inputBox.setText ( '','share' );
  var ibx_grid = inputBox.grid;
  ibx_grid.setLabel ( '<h2>Share Project "' + this.projectDesc.name + '"</h2>',0,2,2,3 );
  ibx_grid.setLabel ( 'Share the Project with&nbsp;',2,2,1,1 );
  ibx_grid.setVerticalAlignment ( 2,2,'middle' );

  var share_inp  = new InputText ( '' );
  share_inp.setStyle      ( 'text',__regexp_login, //'^[A-Za-z][A-Za-z0-9\\-\\._-]+$',
                            appName() + ' user login','' );
  share_inp.setFontItalic ( true    );
  ibx_grid .setWidget     ( share_inp,2,3,1,1 );
  share_inp.setWidth      ( '200px' );
  ibx_grid .setLabel      ( 'and allow them&nbsp;',3,2,1,1 ).setHorizontalAlignment('right');
  ibx_grid .setVerticalAlignment ( 3,2,'middle' );
  var roleCombo   = new Dropdown();
  ibx_grid .addWidget     ( roleCombo,3,3,1,1 );
  roleCombo.setWidth      ( '230px' );
  roleCombo.addItem       ( 'only view the project'  ,'',share_permissions.view_only,false );
  roleCombo.addItem       ( 'run and delete own jobs','',share_permissions.run_own,true );
  roleCombo.addItem       ( 'full access'            ,'',share_permissions.full,false );
  roleCombo.make();

  ibx_grid.setLabel       ( '&nbsp;<br>The user will be notified about this action ' +
                            'by e-mail.<br>Please confirm.',4,2,1,3 );

  inputBox.launch ( 'Yes, share',function(){

    if (share_inp.element.validity.patternMismatch)  {

      new MessageBox ( 'Invalid login name',
                       '<div style="width:350px"><h2>Invalid login name</h2>' +
                       'Login name can contain only latin letters, numbers, ' +
                       'underscores, dashes and dots, and must start with a ' +
                       'letter.</div>','msg_excl' );
      return false;

    } else  {

      let slogin      = share_inp.getValue();
      let permissions = roleCombo.getValue();
      
      if (slogin in self.projectDesc.share)  {
        new MessageBox ( 'Already in the team',
                         '<div style="width:350px"><h2>User already in the team</h2>' +
                         'User <b>' + slogin + '</b> is already in project\'s ' +
                         'work team.</div>','msg_excl' );
        return false;
      }

      let share = {};
      share[slogin] = {
        labels      : {},
        permissions : permissions
      };

      serverRequest ( 
        fe_reqtype.shareProjectConfirm,{
          desc   : { share : share },
          share0 : {}
        },'Share Project',function(data){
          let uspec = null;
          for (let i=0;(i<data.newShared.length) && (!uspec);i++)
            if (data.newShared[i][0]==slogin)
              uspec = data.newShared[i];
          if (uspec)  {
            new QuestionBox ( 'Confirm sharing project',
                '<h2>Share project "' + self.projectDesc.name + 
                '"</h2>You are about to share the project '  +
                'with the following user:<p><table><tr><td><i>Login name:</i></td><td><b>' +
                uspec[0] + '</b></td></tr><tr><td><i>User name:</i></td><td><b>'     + 
                uspec[1] + '</b></td></tr><tr><td><i>to be allowed:&nbsp;</i></td><td><b>' +
                roleCombo.getText() + '</b></td></tr></table><p>' +
                'The user will be notified about this action by e-mail.<br>' +
                'Please confirm.',[{  
                    name    : 'Please share',
                    onclick : function(){ 
                                self.share_request ( slogin,permissions );
                              }
                  },{
                    name    : 'Cancel',
                    onclick : function(){}
                  }],'share' );
          } else  {
            new MessageBox ( 'Unrecognised login name',
                '<h2>User not found</h2>User <b>' + slogin + '</b> not found.',
                'msg_excl' );
          }
        },null,null
      );

      return true;

    }
  });

}


WorkTeamDialog.prototype.unshareUser = function ( slogin,uname )  {

  var self = this;
  new QuestionBox ( 'Unshare project',
      '<div style="width:380px">' +
      '<h2>Unshare project <i>"' + this.projectDesc.name + '"</i></h2>' +
      'Project ' + this.projectDesc.name + ' will be unshared with user <b>' +
      slogin + '</b> (<i>' + uname + '</i>). The user will lose access to ' +
      'the project, including their data, jobs and results.' + 
      '<p>The user will be notified about this action by e-mail. Please ' +
      'confirm.',
      [{
        name    : 'Yes, unshare',
        onclick : function(){
                    self.share_request ( slogin,null );
                  }
       },{
        name    : 'Cancel',
        onclick : function(){
                    self.makeLayout ( null );
                  }
       }],
       'share' );

}


WorkTeamDialog.prototype.changePermissions = function ( slogin,uname,
                                            old_permissions,new_permissions )  {

  var self = this;

  new QuestionBox ( 'Change access permissions',
      '<div style="width:400px">' +
      '<h2>Change access permissions</h2>'  +
      'Access permissions for user <b>'     + slogin + '</b> (<i>' + uname + 
      '</i>) will change<p>&nbsp;&nbsp;&nbsp;&nbsp;from&nbsp;&nbsp;<b>"' + 
      this.access_desc(old_permissions)     +
      '"</b>&nbsp;&nbsp;to&nbsp;&nbsp;<b>"' + 
      this.access_desc(new_permissions)     + '".</b>'  +
      '<p>The user will be notified about this action by e-mail. Please ' +
      'confirm.',
      [{
        name    : 'Yes, change',
        onclick : function(){ 
                    self.share_request ( slogin,new_permissions );
                  }
       },{
        name    : 'Cancel',
        onclick : function(){
                    self.makeLayout ( null );
                  }
       }],
       'share' );

}

WorkTeamDialog.prototype.share_request = function ( slogin,permissions )  {
// null permissions mean that 'slogin' should be unshared

  var share0 = {};
  for (let ulogin in this.projectDesc.share)
    share0[ulogin] = this.projectDesc.share[ulogin];

  if (permissions)  {
    this.projectDesc.share[slogin] = {
      labels      : {},
      permissions : permissions
    }
  } else  {
    delete this.projectDesc.share[slogin];
  }

  var self = this;
  serverRequest ( 
    fe_reqtype.shareProject,{
      desc   : this.projectDesc,
      share0 : share0  // previous share state
    },'Share Project',function(data){
      if (data.desc)  {
        self.projectDesc.share = data.desc.share;
      } else  {
        self.projectDesc.share = share0;
        new MessageBox ( 'Share request denied',
              '<h2>Sharing request denied</h2>' +
              '<i>This may be indicative of a bug or service failure.</i>',
              'msg_excl' );
      }
      self.makeLayout ( null );
      if (self.jobTree)  {
        self.jobTree.stopTaskLoop ();
        self.jobTree.startTaskLoop();
      }
    },null,null
  );
}



/*
function ulist ( user_lst )  {
  var s = '<table>';
  if (user_lst.length<=0)
    s += '<tr><td>&bull;&nbsp;&nbsp;<b><i>Nobody</i></b></td></tr>';
  else  {
    for (let i=0;i<user_lst.length;i++)
      s += '<tr><td>&bull;&nbsp;&nbsp;'    + user_lst[i][1] + 
           '</td><td>&nbsp;<b>['     + user_lst[i][0] + 
           ']</b>&nbsp;</td><td><i>' + user_lst[i][2] + 
           '</i></td></tr>';
  }
  return s + '</table>';
}


function share_project ( projectDesc,share0,callback_func )  {
  serverRequest ( 
    fe_reqtype.shareProject,{
      desc   : projectDesc,
      share0 : share0  // previous share state
    },'Share Project',function(data){
      if (data.desc)  {
        
        projectDesc.share = data.desc.share;

        var msg = '<h2>Project "' + data.desc.name + '" Share Status</h2>' +
                  '<div style="max-height:200px;overflow-y:auto">' +
                  '<b>The Project is shared with:</b>&nbsp;';
        let shared = data.oldShared.concat ( data.newShared );
        if (shared.length<=0)
          msg += '<i>Nobody</i>';
        else
          msg += '<br><font size="-1">(these users can join this ' +
                 'project and work on it simultaneously with you)</font><p>' +
                 ulist ( shared ) + 
                 '</p>';
            
        if (data.unshared.length>0)
          msg += '<p><b>Unshared with:</b><p>' + 
                 ulist ( data.unshared ) + 
                 '</p>';
        
        if (data.unknown.length>0)  {
          msg += '<p><b>Unknown login names:</b>&nbsp;<i>' +
                 data.unknown[0];
          for (var i=1;i<data.unknown.length;i++)
            msg += ', ' + data.unknown[i];
          msg += '<sub>&nbsp;</sub><br><font size="-1">(sharing request was not ' +
                  'fulfilled for these users)</font></i></p>';
        }
        msg += '</div>';
        new MessageBox ( 'Share Project',msg,'share' );
        callback_func ( data.desc );
      } else  {
        projectDesc.share = share0;
        new MessageBox ( 'Share Project',
              '<h2>Sharing request denied</h2>' +
              '<i>Only Project owner can change sharing.</i>',
              'msg_excl' );
        callback_func ( null );
      }
    },null,null
  );
}


function shareProject ( projectDesc,callback_func )  {

  if (__local_user)  {
    new MessageBox ( 'No project sharing',
                     '<div style="width:350px">' +
                     '<h2>No Project Sharing in Desktop Mode</h2>' +
                     'Project sharing is not possible in Desktop mode because ' +
                     'only one user is present in the system.</div>',
                     'msg_stop');
    callback_func ( null );
    return;
  }

  var author = getProjectAuthor ( projectDesc );
  var owner  = getProjectOwner  ( projectDesc );

  if ((owner!=__login_id) && (author.toLowerCase()!=folder_type.tutorials))  {
    new MessageBox ( 'Share Project',
                     'Only Project owner (<b>' + owner +
                     '</b>) can share this Project.',
                     'msg_information');
    callback_func ( null );
    return;
  }


  if (projectDesc.archive && projectDesc.archive.in_archive)  {
    new MessageBox ( 'Archived Project',
      '<div style="width:450px"><h2>Archived Project</h2>Projects in ' + 
      appName() + ' Archive cannot be shared. Instead, your collaborators ' +
      'can access this project directly from Archive by project\'s ' +
      'Archive ID.<p>' +
      'If you intend to develop this project further, clone it and work on ' +
      'the clone, which may be also shared with others. Note that you won\'t ' +
      'be able to update project in ' + appName() + ' Archive from that clone ' +
      'unless you are the original depositor.', 'msg_stop' );
    callback_func ( null );
    return;
  }

  var inputBox = new InputBox ( 'Share Project' );
  inputBox.setText ( '<h2>Share Project "' + projectDesc.name + '"</h2>','share' );
  var ibx_grid = inputBox.grid;
  ibx_grid.setLabel ( 'Share the Project with the following users:',2,2,1,1 );
  ibx_grid.setLabel ( '&nbsp;',3,2,1,1).setHeight_px(6);
  var share_list = Object.keys(projectDesc.share).join(',');
  var share_inp  = new InputText ( share_list );
  share_inp.setStyle ( 'text','','login1,login2,...','' );
  share_inp.setFontItalic ( true    );
  ibx_grid .setWidget     ( share_inp,4,2,1,1 );
  share_inp.setWidth      ( '440px' );
  ibx_grid .setLabel      ( '&nbsp;',5,2,1,1).setHeight_px(6);
  ibx_grid .setLabel      ( 'so that they can join this project and work on ' +
                            'it simultaneously<br>with you.', 6,2,1,1  );
  ibx_grid .setLabel      ( '<div style="width:440px">' +
                            '&nbsp;<br>* Full comma-separated list of users must ' +
                            'be given, to whom the access to the project should ' +
                            'be granted. In order to unshare project with a user, ' +
                            'remove their login name from the list.</div>',
                            7,2,1,1 )
           .setFontItalic ( true  )
           .setFontSize   ( '85%' );
  inputBox .launch ( 'Apply',function(){
    var logins     = share_inp.getValue();
    var share0     = projectDesc.share;
    var logins_lst = logins.split(',')
                           .map(function(item){
                             return item.trim();
                           })
                           .filter(function(item,pos,self){
                             return self.indexOf(item)==pos;
                           });
    projectDesc.share = {};
    for (var i=0;i<logins_lst.length;i++)
      if (logins_lst[i]!=owner)  {
        if (logins_lst[i] in share0)
          projectDesc.share[logins_lst[i]] = share0[logins_lst[i]];
        else
          projectDesc.share[logins_lst[i]] = {
            labels      : {},
            permissions : 'rw'
          };
      }

    serverRequest ( fe_reqtype.shareProjectConfirm,{
      desc   : projectDesc,
      share0 : share0  // previous share state
    },'Share Project Confirm',
    function(data){
      if (data.unknown.length>0)  {
        projectDesc.share = share0;
        new MessageBox ( 'Unknown user(s)',
             '<div style="width:400px">' +
             '<h2>Unknown user(s)</h2>The following login names are not ' +
             'recognised:<p><i>' + data.unknown.join(', ') +
             '</i><p>Please verify user login name(s) and repeat your request.' +
             '</div>',
             'unknown_user' );      
      } else  {
        let shared = data.oldShared.concat ( data.newShared );
        let msg    = '<h2>Change share state</h2>' + 
                     '<div style="max-height:200px;overflow-y:auto;padding-right:12px;">' +
                     '<b>Project "' + projectDesc.name + '" will be ';
        if (data.unshared.length>0)
          msg += ' unshared with:</b><sub>&nbsp;</sub><p>' + 
                 ulist ( data.unshared ) + 
                 '</p><p><b>and ';
        msg += 'shared with:</b><br><font size="-1">(these users will be able to join ' +
               'this project and work on it simultaneously with you)</font><p>' +
               ulist ( shared ) +
               '</p><p><b>Please confirm.</b></p></div>';
        new QuestionBox ( 'Share state for project ' + projectDesc.name,msg,[{
              name    : 'Confirm',
              onclick : function(){ 
                          share_project ( projectDesc,share0,callback_func );
                        }
            },{
              name    : 'Cancel',
              onclick : function(){ projectDesc.share = share0; }
            }],'share' );
      }
    },null,null );

    return true;
  
  });

}


function showWorkTeam ( projectDesc )  {

  var author = getProjectAuthor ( projectDesc );
  var owner  = getProjectOwner  ( projectDesc );

  serverRequest ( fe_reqtype.shareProjectConfirm,{
    desc   : projectDesc,
    share0 : projectDesc.share,
    author : author,
    owner  : owner
  },'Share Project Confirm',
    function(data){
      let msg = 
        '<h2>Project "' + projectDesc.name + '" Work Team</h2>' +
        '<div style="max-height:200px;overflow-y:auto">' +
        '<table>' +
          '<tr><td><b><i>Author</i>:</b></td><td>' + data.author[1] +
              '</td><td>&nbsp;<b>[' + data.author[0] + ']</b>&nbsp;</td><td><i>' +
              data.author[2] + '</i></td></tr>' +
          '<tr><td><b><i>Owner (keeper)</i>:&nbsp;</b></td><td>' + data.owner[1] +
              '</td><td>&nbsp;<b>[' + data.owner[0] + ']</b>&nbsp;</td><td><i>' +
              data.owner[2] + '</i></td></tr>' +
          '<tr><td colspan=4 height="6px"> </td></tr>';
      if (data.oldShared.length<=0)
        msg += '<tr><td><b><i>Co-workers (shared)</i>:&nbsp;</b></td>' +
               '<td><i>None</i></td><td></td><td></td></tr>';
      else  {
        msg += '<tr><td><b><i>Co-workers (shared)</i>:&nbsp;</b></td><td>' + 
                data.oldShared[0][1] + '</td><td>&nbsp;<b>[' + 
                data.oldShared[0][0] + ']</b>&nbsp;</td><td><i>' +
                data.oldShared[0][2] + '</i></td></tr>';
        for (let i=1;i<data.oldShared.length;i++)
          msg += '<tr><td></td><td>' + 
                data.oldShared[i][1] + '</td><td>&nbsp;<b>[' + 
                data.oldShared[i][0] + ']</b>&nbsp;</td><td><i>' +
                data.oldShared[i][2] + '</i></td></tr>';
      }
      if (data.unknown.length>0)  {
        msg += '<tr><td colspan=3 height="6px"> </td></tr>' +
               '<tr><td><b><i>Unknown</i>:&nbsp;</b></td><td colspan=3><b>[' + 
               data.unknown[0] + ']</b></td></tr>';
        for (let i=1;i<data.unknown.length;i++)
          msg += '<tr><td></td><td colspan=3><b>[' + 
                data.unknown[i] + ']</b></td></tr>';
      }
      msg += '</table></div>';
      new MessageBox ( 'Project work team',msg,'workteam' );
    },null,null );

}
*/
