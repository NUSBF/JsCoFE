
/*
 *  =================================================================
 *
 *    14.02.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019
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
                     '</b>) can share this Project.' );
    callback_func ( null );
    return;
  }

  var inputBox  = new InputBox ( 'Share Project [' + projectDesc.name + ']' );
  var ibx_grid  = new Grid     ( '' );
  ibx_grid.setLabel ( '<h2>Share Project</h2>',0,0,1,1 );
  ibx_grid.setLabel ( 'The following users:<br>&nbsp;',1,0,1,1 );
  var share_list = '';
  if (projectDesc.owner.share.length>0)  {
    share_list = projectDesc.owner.share[0].login;
    for (var i=1;i<projectDesc.owner.share.length;i++)
      share_list += ',' + projectDesc.owner.share[i].login;
  }
  var share_inp = new InputText ( share_list );
  share_inp.setStyle ( 'text','','login1,login2,...',
                       'Give a comma-separated list of login names of ' +
                       'users who will be allowed to copy this project ' +
                       'in their accounts.'
                     );
  share_inp.setFontItalic ( true    );
  ibx_grid .setWidget     ( share_inp,2,0,1,1 );
  share_inp.setWidth      ( '300pt' );
  ibx_grid .setLabel      ( '&nbsp;<br>can join this project and work on ' +
                            'it simultaneously with you.', 3,0,1,1  );
  inputBox .addWidget     ( ibx_grid );
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
                        //jobTree.saveProjectData ( [],[],false,function(rdata){
                        var msg = '<h2>Project\'s Share Status</h2>' +
                                  '<b>Shared with:</b>&nbsp;<i>';
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
                          new MessageBox ( 'Share Project [' + data.desc.name + ']',msg );
                        //});
                        callback_func ( data.desc );
                      } else  {
                        new MessageBox ( 'Share Project [' + data.desc.name + ']',
                              '<h2>Sharing request denied</h2>' +
                              '<i>Only project owner can change sharing.</i>' );
                        callback_func ( null );
                      }
                    },null,null );
    return true;
  });
}
