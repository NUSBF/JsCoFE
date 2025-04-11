
/*
 *  =================================================================
 *
 *    03.05.23   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2023
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


function ImportDemoProjectDialog ( onSuccess_func )  {

  InputBox.call ( this,'Import Demo Project' );
  this.setText ( '','demoprj' );
  let grid = this.grid;
  grid.setLabel ( '<h2>Import Demo Project</h2>',0,2,2,3 );

  let msgLabel = grid.setLabel ( 'The project is being imported, please wait ... ',
                                 2,2,1,3 );
  var progressBar = grid.setProgressBar ( 0, 4,2,1,3 );

  // let add_btn_id = 'add_btn_' + __id_cnt++;

  var self = this;

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

  function checkReady() {
    serverRequest ( fe_reqtype.checkPrjImport,0,'Demo Project Import',function(data){
      if (!data.signal)
        window.setTimeout ( checkReady,1000 );
      else {
        progressBar.hide();
        $( "#cancel_btn" ).button ( "option","label","Close" );
        if (data.signal=='Success')  {
          if (__current_folder.type==folder_type.all_projects)
            msgLabel.setText (
                  '<div style="width:400px">Demo Project <i>"' + data.name + 
                  '"</i> is imported, you may close this dialog now.</div>' );
          else
            msgLabel.setText (
                  '<div style="width:400px">Demo Project <i>"' + data.name + 
                  '"</i> is imported.' +
                  '<p><b>Note that you are now in the Tutorials project\'s '+
                  'folder. To navigate back to your folder(s), click on the ' +
                  'page title or use Main Menu.</b>' +
                  '<p>You may close this dialog now.</div>' );
          if (onSuccess_func)
            onSuccess_func();

        // if (data.signal=='Success')  {
        //   msgLabel.setText ( 'Demo Project "' + data.name + '" is imported, ' +
        //                      'you may close this dialog now.' );
        //   if (onSuccess_func)
        //     onSuccess_func();

        } else  {
          self.setIcon ( 'msg_error' );
          msgLabel.setText ( '<div style="width:400px">Demo Project <i>"' + 
                             data.name + '"</i> failed to import, ' +
                             'the reason being:<p><b><i>' + data.signal +
                             '</i></b>.</div>' );
        }
      }
    },null,function(){
      window.setTimeout ( checkReady,1000 );  // depress error messages
    });
  }

  window.setTimeout ( checkReady,2000 );

}

ImportDemoProjectDialog.prototype = Object.create ( InputBox.prototype );
ImportDemoProjectDialog.prototype.constructor = ImportDemoProjectDialog;

