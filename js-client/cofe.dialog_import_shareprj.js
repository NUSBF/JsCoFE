
/*
 *  =================================================================
 *
 *    30.03.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Import shared project dialog class

function ImportSharedProjectDialog ( onSuccess_func )  {
// XXX:
  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Import Shared Project' );
  document.body.appendChild ( this.element );

  this.grid = new Grid('');
  this.addWidget ( this.grid );
  this.grid.setLabel ( '<h3>Import Shared Project</h3>',0,0,1,3 );

  (function(dlg){
    serverRequest ( fe_reqtype.getSharedPrjList,null,'Import Shared Project',
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

ImportSharedProjectDialog.prototype = Object.create ( Widget.prototype );
ImportSharedProjectDialog.prototype.constructor = ImportSharedProjectDialog;


ImportSharedProjectDialog.prototype.makeProjectSelectPage = function ( pShare,onSuccess_func ) {

  var shared_projects = pShare.shared_projects;

  if (shared_projects.length<=0)  {

    this.grid.setLabel ( 'You do not have projects shared with ' +
                    'you by other users.', 1,0,1,3 );

  } else  {

    var msg_lbl   = this.grid.setLabel ( 'Select a project to import:',
                                    1,0,1,3 );
    var share_ddn = new Dropdown();
    share_ddn.setTooltip ( 'Choose a project to import' )
             .setWidth ( '500pt' );
    for (var i=0;i<shared_projects.length;i++)  {
      var keeper = '';
      if (('keeper' in shared_projects[i].owner) &&
          (shared_projects[i].owner.login!=shared_projects[i].keeper))
        keeper = shared_projects[i].keeper + ':';
      share_ddn.addItem (
            keeper +
            shared_projects[i].owner.login + ':[' +
            shared_projects[i].name  + '] "' +
            shared_projects[i].title + '"','',i,i==0 );
    }
    share_ddn.make();
    this.grid.setWidget   ( share_ddn,2,0,1,3 );
    this.grid.setLabel    ( '&nbsp;', 3,0,1,3 );
    var import_btn = this.grid.setButton ( 'Import',
          image_path('share'),4,1,1,1 ).setWidth_px ( 120 );
    this.grid.setCellSize ( '45%' ,'',4,0 );
    this.grid.setCellSize ( 'auto','',4,1 );
    this.grid.setCellSize ( '45%' ,'',4,2 );

    (function(dlg){
      import_btn.addOnClickListener ( function(){

        var pDesc = shared_projects[share_ddn.getValue()];
        msg_lbl.setText ( 'The project is being imported, please wait ... ' );
        share_ddn .hide();
        import_btn.hide();
        var progressBar = new ProgressBar ( 0 );
        dlg.grid.setWidget ( progressBar, 3,0,1,3 );

        serverRequest ( fe_reqtype.startSharedImport,pDesc,'Import Shared Project',
          function(data){

            function checkReady() {
              serverRequest ( fe_reqtype.checkPrjImport,0,'Shared Project Import',
                function(data){
                  if (!data.signal)
                    window.setTimeout ( checkReady,1000 );
                  else {
                    progressBar.hide();
                    $( "#cancel_btn" ).button ( "option","label","Close" );
                    if (data.signal=='Success')  {
                      msg_lbl.setText ( 'Shared Project "' + data.name + '" is imported, ' +
                                        'you may close this dialog now.' );
                      if (onSuccess_func)
                        onSuccess_func();
                    } else
                      msg_lbl.setText ( 'Shared Project "' + data.name + '" failed to import, ' +
                                        'the reason being:<p><b><i>' + data.signal +
                                        '</i></b>.' );
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
