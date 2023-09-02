
/*
 *  =================================================================
 *
 *    02.09.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_export_job.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Share Project Function
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';


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

/*
function share_project ( projectDesc,share0,callback_func )  {
  serverRequest ( 
    fe_reqtype.shareProject,{
      desc   : projectDesc,
      share0 : share0  // previous share state
    },'Share Project',function(data){
// console.log ( ' >>>>>>> ' + JSON.stringify(data) );
      if (data.desc)  {
        projectDesc.share = data.desc.share;
        var msg = '<h2>Project "' + data.desc.name +
                  '" Share Status</h2><b>Shared with:</b>&nbsp;<i>';
        var logins_lst = Object.keys(data.desc.share);
        if (logins_lst.length<=0)
          msg += 'nobody';
        else  {
          msg += logins_lst.join(', ');
          // msg += data.desc.owner.share[0].login;
          // for (var i=1;i<data.desc.owner.share.length;i++)
          //   msg += ', ' + data.desc.owner.share[i].login;
          msg += '<br><font size="-1">(these users can join ' +
                  'this project and work on it simultaneously ' +
                  'with you)</font>';
        }
        msg += '</i>';
        if (data.unshared.length>0)  {
          msg += '<p><b>Unshared with:</b>&nbsp;<i>' +
                  data.unshared[0];
          for (var i=1;i<data.unshared.length;i++)
            msg += ', ' + data.unshared[i];
          msg += '</i>';
        }
        if (data.unknown.length>0)  {
          msg += '<p><b>Unknown users:</b>&nbsp;<i>' +
                  data.unknown[0];
          for (var i=1;i<data.unknown.length;i++)
            msg += ', ' + data.unknown[i];
          msg += '<br><font size="-1">(sharing request was not ' +
                  'fulfilled for these users)</font></i>';
        }
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
*/

function share_project ( projectDesc,share0,callback_func )  {
  serverRequest ( 
    fe_reqtype.shareProject,{
      desc   : projectDesc,
      share0 : share0  // previous share state
    },'Share Project',function(data){
// console.log ( ' >>>>>>> ' + JSON.stringify(data) );
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

  // var author = projectDesc.owner.login;
  // if (('author' in projectDesc.owner) && projectDesc.owner.author)
  //   author = projectDesc.owner.author;

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
                     //   'Give a comma-separated list of login names of ' +
                     //   'users who will be allowed to access and modify ' +
                     //   'this project.'
                     // );
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



    // if (data.unknown.length>0)  {
    //   new MessageBox ( 'Unknown user(s)',
    //       '<div style="width:400px">' +
    //       '<h2>Unknown user(s)</h2>The following login names are not ' +
    //       'recognised:<p><i>' + data.unknown.join(', ') +
    //       '</i><p>Please verify user login name(s) and repeat your request.' +
    //       '</div>',
    //       'unknown_user' );      
    // } else  {
    //   let shared = data.oldShared.concat ( data.newShared );
    //   // let title  = 'Project "' + projectDesc.name + '" Share Status Change';
    //   let msg    = '<h2>Change share state</h2><b>Project "' + projectDesc.name + 
    //               '" will be ';
    //   if (data.unshared.length>0)
    //     msg += ' unshared with:</b><sub>&nbsp;</sub><br>' + 
    //           ulist ( data.unshared ) + 
    //           '<p><b>and ';
    //   msg += 'shared with:</b><br><font size="-1">(these users will be able to join ' +
    //         'this project and work on it simultaneously with you)</font><br>' +
    //         ulist ( shared ) +
    //         '</p><p><b>Please confirm.</b></p>';
    //   new MessageBox ( 'Share state for project ' + projectDesc.name,msg,'workteam' );
  //   }
  // },null,null );

}
