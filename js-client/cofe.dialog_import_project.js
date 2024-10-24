
/*
 *  =================================================================
 *
 *    08.10.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_import_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Project Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Import project dialog class

function ImportProjectDialog ( onSuccess_func )  {

  InputBox.call ( this,'Import Project' );
  this.setText ( '','import' );
  let grid = this.grid;
  grid.setLabel ( '<h2>Import Project</h2>',0,2,2,3 );

  let msgLabel = new Label ( '<div style="width:420px">Use "<i>Select ...</i>" ' +
                             'button to select file <i>(*' + projectFileExt +
                             ')</i> with previously exported ' + appName() + 
                             ' project. ' +
                             'The import will commence automatically once '  +
                             'the upload is completed<p style="text-align:right">' +
                             '-- <b><i>do not close this dialog until then.' +
                             '</i></b>.</p></div>' );
  grid.setWidget ( msgLabel, 2,2,1,3 );

  let customData = {};
  //  customData.login_token = __login_token.getValue();
  customData.login_token = __login_token;

  let upload = new Upload ( customData,{
      'type'   : 'project',
      'accept' : projectFileExt,
      'gzip'   : false
  }, null,null,function(returnCode){

    if (!returnCode)  {

      upload.hide();
      msgLabel.setText ( 'The project is being imported, please wait ... ' );
      let progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 4,2,1,3 );

      upload.__keep_polling = true;

      function checkReady() {
        if (!upload.__keep_polling)
          return;
        serverRequest ( fe_reqtype.checkPrjImport,0,'Project Import',function(data){
          if (!data.signal)
            window.setTimeout ( checkReady,1000 );
          else {
            progressBar.hide();
            $( "#cancel_btn" ).button ( "option","label","Close" );
            if (data.signal=='Success')  {
              let pnames    = data.name.split(' ');
              let vers_text = '';
              if ('ccp4cloud_version' in data)  {
                let v0 = appVersion().split(' ')[0];
                let v1 = data.ccp4cloud_version.split(' ')[0];
                if (v0<v1)
                  vers_text = '<p><b>Note:</b> The project was made with a newer '   +
                              'version (' + v1 + ') of ' + appName() + ' than what ' +
                              'you are using (' + v0 + '). If you cannot open the '  +
                              'project, update your CCP4 setup to the latest version.';
              }
              let msg_text = '<div style="width:450px;">Project "<i>';
              if (pnames.length<2)  msg_text += pnames[0];
                              else  msg_text += pnames[1];
              msg_text += '</i>" is imported';
              if (__current_folder.type==folder_type.all_projects)  {
                if (pnames.length<2)  {
                  msg_text += '. ' + vers_text + 'You may close this dialog now.';
                } else  {
                  msg_text += ', but it was renamed to "<i>' + pnames[0] + 
                    '</i>" because another project with same name exists in ' +
                    'your account. You can rename either project to your liking.' +
                    vers_text + 
                    '<p>You may close this dialog now.</p>';
                }
              } else  {
                if (pnames.length<2)  {
                  msg_text += '.' + vers_text + 
                    '<p><b>Note that you are now in the original ' +
                    'project\'s folder. To navigate back to your folder(s), ' +
                    'click on the page title or use Main Menu.</b>' +
                    '<p>You may close this dialog now.';
                } else  {
                  msg_text += ', but it was renamed to "<i>' + pnames[0] + 
                    '</i>" because another project with same name exists in ' +
                    'your account. You can rename either project to your liking.' +
                    vers_text +
                    '<p><b>Note that you are now in the original project\'s '+
                    'folder.<br>To navigate back to your folder(s), click on the ' +
                    '<br>page title or use Main Menu.</b>' +
                    '<p>You may close this dialog now.';
                }
              }
              msgLabel.setText ( msg_text + '</div>' );
              if (onSuccess_func)
                onSuccess_func();
            } else
              msgLabel.setText ( 'Project "<i>' + data.name + '</i>" failed to import, ' +
                                 'the reason being:<p><b><i>' + data.signal +
                                 '</i></b>.' );
          }
        },null,function(){
          window.setTimeout ( checkReady,1000 );  // depress error messages
        });
      }

      window.setTimeout ( checkReady,2000 );

    }

  });

  grid.setWidget ( upload,3,2,1,3 );

//  w = 3*$(window).width()/5 + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 'auto',
    modal     : true,
    open      : function(event, ui) {
      $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
    },
    buttons   : [
      {
        id    : "cancel_btn",
        text  : "Cancel",
        click : function() {
          $(this).dialog("close");
        }
      }
    ]
  });

  (function(dlg){

    $(dlg.element).on( "dialogclose",function(event,ui){
      serverRequest ( fe_reqtype.finishPrjImport,0,'Finish Project Import',
                      null,function(){
        upload.__keep_polling = false;
        window.setTimeout ( function(){
          $(dlg.element).dialog( "destroy" );
          dlg.delete();
        },10 );
      },function(){} );  // depress error messages
    });

  }(this))

}


ImportProjectDialog.prototype = Object.create ( InputBox.prototype );
ImportProjectDialog.prototype.constructor = ImportProjectDialog;
