
/*
 *  =================================================================
 *
 *    13.05.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_export_job.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Export Job Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2022
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

function shareProject ( projectDesc,callback_func )  {

  var author = projectDesc.owner.login;
  if (('author' in projectDesc.owner) && projectDesc.owner.author)
    author = projectDesc.owner.author;
  if (author!=__login_id)  {
    new MessageBox ( 'Share Project',
                     'Only Project owner (<b>' + author +
                     '</b>) can share this Project.',
                     'msg_information');
    callback_func ( null );
    return;
  }

  var inputBox = new InputBox ( 'Share Project' );
  inputBox.setText ( '<h2>Share Project "' + projectDesc.name + '"</h2>','share' );
  // var ibx_grid  = new Grid     ( '' );
  var ibx_grid = inputBox.grid;
  // ibx_grid.setLabel ( '<h2>Share Project "' + projectDesc.name + '"</h2>',0,2,2,1 );
  ibx_grid.setLabel ( 'The following users:<br>&nbsp;',2,2,1,1 );
  var share_list = '';
  if (projectDesc.owner.share.length>0)  {
    share_list = projectDesc.owner.share[0].login;
    for (var i=1;i<projectDesc.owner.share.length;i++)
      share_list += ',' + projectDesc.owner.share[i].login;
  }
  var share_inp = new InputText ( share_list );
  share_inp.setStyle ( 'text','','login1,login2,...','' );
                     //   'Give a comma-separated list of login names of ' +
                     //   'users who will be allowed to access and modify ' +
                     //   'this project.'
                     // );
  share_inp.setFontItalic ( true    );
  ibx_grid .setWidget     ( share_inp,3,2,1,1 );
  share_inp.setWidth      ( '300pt' );
  ibx_grid .setLabel      ( '&nbsp;<br>can join this project and work on ' +
                            'it simultaneously.', 4,2,1,1  );
  ibx_grid .setLabel      ( '&nbsp;<br>* Full (comma-separated) list of users ' +
                            'with access to the project<br>must be given. In ' +
                            'order to unshare project with a user, remove<br>' +
                            'their login name from the list.',
                            5,2,1,1  )
           .setFontItalic ( true  )
           .setFontSize   ( '85%' );
  // inputBox .addWidget     ( ibx_grid );
  inputBox .launch ( 'Apply',function(){
    var logins     = share_inp.getValue();
    var share0     = projectDesc.owner.share;
    var logins_lst = logins.split(',')
                           .map(function(item){
                             return item.trim();
                           })
                           .filter(function(item,pos,self){
                             return self.indexOf(item)==pos;
                           });
    projectDesc.owner.share = [];
    for (var i=0;i<logins_lst.length;i++)
      if (logins_lst[i]!=projectDesc.owner.login)  {
        projectDesc.owner.share.push({
          'login'       : logins_lst[i],
          'permissions' : 'rw'
        });
      }
    serverRequest ( fe_reqtype.shareProject,{
                      desc   : projectDesc,
                      share0 : share0
                    },'Share Project',function(data){
                      if (data.desc)  {
                        var msg = '<h2>Project "' + data.desc.name +
                                  '" Share Status</h2><b>Shared with:</b>&nbsp;<i>';
                        if (data.desc.owner.share.length<=0)
                          msg += 'nobody';
                        else  {
                          msg += data.desc.owner.share[0].login;
                          for (var i=1;i<data.desc.owner.share.length;i++)
                            msg += ', ' + data.desc.owner.share[i].login;
                          msg += '<br><font size="-1">(these users can join ' +
                                 'this project and work on it simultaneously ' +
                                 'with you)</font>';
                        }
                        msg += '</i>';
                        if (data.unshared.length>0)  {
                          msg += '<p><b>Unshared with:</b>&nbsp;<i>' +
                                 data.unshared[0].login;
                          for (var i=1;i<data.unshared.length;i++)
                            msg += ', ' + data.unshared[i].login;
                          msg += '</i>';
                        }
                        if (data.unknown.length>0)  {
                          msg += '<p><b>Unknown users:</b>&nbsp;<i>' +
                                 data.unknown[0].login;
                          for (var i=1;i<data.unknown.length;i++)
                            msg += ', ' + data.unknown[i].login;
                          msg += '<br><font size="-1">(sharing request was not ' +
                                 'fulfilled for these users)</font></i>';
                        }
                        new MessageBox ( 'Share Project',msg,'share' );
                        callback_func ( data.desc );
                      } else  {
                        new MessageBox ( 'Share Project',
                              '<h2>Sharing request denied</h2>' +
                              '<i>Only project owner can change sharing.</i>',
                              'msg_excl' );
                        callback_func ( null );
                      }
                    },null,null );
    return true;
  });
}
