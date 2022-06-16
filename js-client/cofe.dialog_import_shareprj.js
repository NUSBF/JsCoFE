
/*
 *  =================================================================
 *
 *    22.04.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_import_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Shared Project Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Import shared project dialog class

function ImportSharedProjectDialog ( onSuccess_func )  {

  InputBox.call ( this,'Join Shared Project' );

  this.setText ( '','join' );
  this.grid.setLabel ( '<h2>Join Shared Project</h2>',0,2,2,3 );

  (function(dlg){
    serverRequest ( fe_reqtype.getSharedPrjList,null,'Join Shared Project',
      function(data){ dlg.makeProjectSelectPage ( data,onSuccess_func ); },
      null,'persist' );
  }(this))

//  w = 3*$(window).width()/5 + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 'auto',
    modal     : true,
    open      : function(event, ui) {
      $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
      $("#import_btn").hide();
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
      serverRequest ( fe_reqtype.finishPrjImport,0,'Finish Joining Project',
                      null,function(){
        window.setTimeout ( function(){
          $(dlg.element).dialog( "destroy" );
          dlg.delete();
        },10 );
      },function(){} );  // depress error messages
    });

  }(this))

}

ImportSharedProjectDialog.prototype = Object.create ( InputBox.prototype );
ImportSharedProjectDialog.prototype.constructor = ImportSharedProjectDialog;


ImportSharedProjectDialog.prototype.makeProjectSelectPage = function (
                                                      pShare,onSuccess_func ) {

  var shared_projects = pShare.shared_projects;

  if (shared_projects.length<=0)  {

    this.grid.setLabel ( 'You do not have projects shared with ' +
                         'you by other users.', 2,2,1,1 );

  } else  {

    var msg_lbl   = this.grid.setLabel ( 'Select a project to join:', 2,2,1,1 );
    var share_ddn = new Dropdown();
    share_ddn.setTooltip ( 'Choose a project to join' )
             .setWidth ( '600px' );
    for (var i=0;i<shared_projects.length;i++)
      share_ddn.addItem (
           shared_projects[i].owner.login + ':[' +
           shared_projects[i].name  + '] "' +
           shared_projects[i].title + '"','',i,i==0 );

    share_ddn.make();
    this.grid.setWidget   ( share_ddn,3,2,1,1 );
    this.grid.setLabel    ( '&nbsp;', 4,2,1,1 );
    var import_btn = this.grid.setButton ( 'Join',
          image_path('share'),5,2,1,1 ).setWidth_px ( 120 );
    this.grid.setHorizontalAlignment ( 5,2,'center' );

    (function(dlg){
      import_btn.addOnClickListener ( function(){

        var pDesc = shared_projects[share_ddn.getValue()];
        msg_lbl.setText ( 'The project is being joined, please wait ... ' );
        share_ddn .hide();
        import_btn.hide();
        var progressBar = new ProgressBar ( 0 );
        dlg.grid.setWidget ( progressBar, 4,2,1,1 );

        serverRequest ( fe_reqtype.startSharedImport,pDesc,'Join Shared Project',
          function(data){

            function checkReady() {
              serverRequest ( fe_reqtype.checkPrjImport,0,'Join Shared Project',
                function(data){
                  if (!data.signal)
                    window.setTimeout ( checkReady,1000 );
                  else {
                    progressBar.hide();
                    $( "#cancel_btn" ).button ( "option","label","Close" );
                    if (data.signal=='Success')  {
                      dlg.grid.setLabel ( '<h2>Project Joined Successfully</h2>',0,2,2,3 );
                      msg_lbl.setText ( '<div style="width:400px">' +
                                        'Project "' + data.name + '" is now joined, ' +
                                        'and you may work on it simultaneously with ' +
                                        'the project owner and other users, with whom the ' +
                                        'project may have been also shared.' +
                                        '<p>You may close this dialog now.</div>' );
                      if (onSuccess_func)
                        onSuccess_func();
                    } else  {
                      dlg.grid.setLabel ( '<h2>Join Shared Project Failed</h2>',0,2,2,3 );
                      msg_lbl.setText ( 'Project "' + data.name + '" was not joined, ' +
                                        'the reason being:<p><b>*** <i>' + data.signal +
                                        '</i></b>' );
                    }
                  }
                },null,function(){
                  window.setTimeout ( checkReady,1000 );  // depress error messages
                });
              }

              window.setTimeout ( checkReady,2000 );

            },null,'persist' );

      });
    }(this))

  }

}
