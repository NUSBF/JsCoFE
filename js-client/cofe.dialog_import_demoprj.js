
/*
 *  =================================================================
 *
 *    24.04.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_import_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Demo Project Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Import project dialog class

function ImportDemoProjectDialog ( onSuccess_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Import Demo Project' );
  document.body.appendChild ( this.element );

  var grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Import Demo Project</h3>',0,0,1,1 );

  var msgLabel = new Label ( 'Use "<i>Select demo project</i>" button to navigate ' +
                             'to a demo<br>project.<p>' +
                             'The import will commence automatically once a '  +
                             'project<br>is chosen -- <b><i>do not close ' +
                             'this dialog until the import<br>is complete.</i></b>' +
                             '<hr/>' );
  grid.setWidget ( msgLabel, 1,0,1,1 );

  var select_btn = grid.setButton ( 'Select demo project',
                                    image_path('open_file'),2,0,1,1 )
                                    .setNoWrap();
  grid.setHorizontalAlignment ( 2,0,'center' );

  this.currentCloudPath = __demo_projects;
  (function(task){
    select_btn.addOnClickListener ( function(){
      new CloudFileBrowser ( null,task,0,function(items){
        //alert ( JSON.stringify(items) );
        serverRequest ( fe_reqtype.startDemoImport,{
                            'cloudpath' : task.currentCloudPath,
                            'demoprj'   : items[0]
                        },'Demo Project Import',function(data){

          //alert ( JSON.stringify(data));

          select_btn.hide();
          msgLabel.setText ( 'The project is being imported, please wait ... ' );
          var progressBar = new ProgressBar ( 0 );
          grid.setWidget ( progressBar, 3,0,1,1 );

          function checkReady() {
            serverRequest ( fe_reqtype.checkPrjImport,0,'Demo Project Import',function(data){
              if (!data.signal)
                window.setTimeout ( checkReady,1000 );
              else {
                progressBar.hide();
                $( "#cancel_btn" ).button ( "option","label","Close" );
                if (data.signal=='Success')  {
                  msgLabel.setText ( 'Demo Project "' + data.name + '" is imported, ' +
                                     'you may close this dialog now.' );
                  if (onSuccess_func)
                    onSuccess_func();
                } else
                  msgLabel.setText ( 'Demo Project "' + data.name + '" failed to import, ' +
                                     'the reason being:<p><b><i>' + data.signal +
                                     '</i></b>.' );
              }
            },null,function(){
              window.setTimeout ( checkReady,1000 );  // depress error messages
            });
          }

          window.setTimeout ( checkReady,2000 );

        });

        return 1;  // do close browser window

      },null );
    });
  }(this))

  /*
  var customData = {};
  //  customData.login_token = __login_token.getValue();
  customData.login_token = __login_token;

  var upload = new Upload ( customData,'project',null,null,function(returnCode){

    if (!returnCode)  {

      upload.hide();
      msgLabel.setText ( 'The project is being imported, please wait ... ' );
      var progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 3,0,1,3 );

      function checkReady() {
        serverRequest ( fe_reqtype.checkPrjImport,0,'Project Import',function(data){
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
          window.setTimeout ( checkReady,1000 );  // depress error messages
        });
      }

      window.setTimeout ( checkReady,2000 );

    }

  });

  grid.setWidget ( upload,2,0,1,3 );

  */

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
        window.setTimeout ( function(){
          $(dlg.element).dialog( "destroy" );
          dlg.delete();
        },10 );
      },function(){} );  // depress error messages
    });

  }(this))

}


ImportDemoProjectDialog.prototype = Object.create ( Widget.prototype );
ImportDemoProjectDialog.prototype.constructor = ImportDemoProjectDialog;
