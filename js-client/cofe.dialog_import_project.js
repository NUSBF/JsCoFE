
/*
 *  =================================================================
 *
 *    03.04.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Import project dialog class

function ImportProjectDialog ( onSuccess_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Import Project' );
  document.body.appendChild ( this.element );

  grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Import Project</h3>',0,0,1,3 );

  var msgLabel = new Label ( 'Use "<i>Select ...</i>" button to select archive file ' +
                             '(project_name' + projectFileExt +
                             ')<br>with previously exported project. ' +
                             'The import will commence<br>automatically once '  +
                             'the upload is completed -- <b><i>do not close<br>' +
                             'this dialog until then</i></b>.<br>&nbsp;' );
  grid.setWidget ( msgLabel, 1,0,1,3 );

  var customData = {};
  //  customData.login_token = __login_token.getValue();
  customData.login_token = __login_token;

  var upload = new Upload ( customData,{
      'type'   : 'project',
      'accept' : projectFileExt,
      'gzip'   : false
  }, null,null,function(returnCode){

    if (!returnCode)  {

      upload.hide();
      msgLabel.setText ( 'The project is being imported, please wait ... ' );
      var progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 3,0,1,3 );

      upload.__keep_polling = true;

      function checkReady() {
console.log ( ' >>>>>> checkReady' );
        if (!upload.__keep_polling)
          return;
        serverRequest ( fe_reqtype.checkPrjImport,0,'Project Import',function(data){
console.log ( ' >>>>>> data.signal=' + data.signal );
          if (!data.signal)
            window.setTimeout ( checkReady,1000 );
          else {
            progressBar.hide();
            $( "#cancel_btn" ).button ( "option","label","Close" );
            if (data.signal=='Success')  {
              msgLabel.setText ( 'Project "' + data.name + '" is imported, ' +
                                 'you may close this dialog now.' );
              if (onSuccess_func)
                onSuccess_func();
            } else
              msgLabel.setText ( 'Project "' + data.name + '" failed to import, ' +
                                 'the reason being:<p><b><i>' + data.signal +
                                 '</i></b>.' );
          }
        },null,function(){
console.log ( ' >>>>>> err' );
          window.setTimeout ( checkReady,1000 );  // depress error messages
        });
      }

      window.setTimeout ( checkReady,2000 );

    }

  });

  grid.setWidget ( upload,2,0,1,3 );

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


ImportProjectDialog.prototype = Object.create ( Widget.prototype );
ImportProjectDialog.prototype.constructor = ImportProjectDialog;
