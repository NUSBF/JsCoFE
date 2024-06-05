
/*
 *  =================================================================
 *
 *    05.06.24  <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Export job dialog class

function ExportJobDialog ( task )  {

  (function(dlg){

    serverRequest ( fe_reqtype.prepareJobExport,task,
                    'Prepare Job Export',function(){  // on success

      let exportName  = task.project + '-job_' + task.id;
      InputBox.call ( dlg,'Export Job ' + exportName );

      dlg.setText ( '','export' );
      let grid = dlg.grid;
      grid.setLabel ( '<h2>Export Job "' + exportName + '"</h2>',0,2,2,3 );

      let msgLabel = new Label ( 'Job <b>"' + exportName + '"</b> is being ' +
                                 'prepared for download ....' );
      grid.setWidget ( msgLabel, 2,2,1,3 );

      let progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 3,2,1,3 );

      dlg.jobSize = -2;

    //  w = 3*$(window).width()/5 + 'px';

      $(dlg.element).dialog({
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
            id    : "download_btn",
            text  : "Download",
            click : function() {
              let token;
              let url;
              if (__login_token)
                    token = __login_token;
              else  token = '404';
              url = __special_url_tag + '/' + token   + '/' + task.project +
                                      '/' + task.id + '/' + exportName   +
                                      '.zip';
              $('#download_btn').hide();
              $('#cancel_btn'  ).button ( "option","label","Close" );
              downloadFile ( url );
            }
          },
          {
            id    : "cancel_btn",
            text  : "Cancel",
            click : function() {
              $(this).dialog("close");
            }
          }
        ]
      });

      window.setTimeout ( function(){ $('#download_btn').hide(); },0 );

      function checkReady() {
        serverRequest ( fe_reqtype.checkJobExport,task,
                        'Prepare Job Export',function(data){
          if ((data.size<=0) && (dlg.jobSize<-1))
            window.setTimeout ( checkReady,1000 );
          else {
            dlg.jobSize = data.size;
            progressBar.hide();
            msgLabel.setText ( 'Job <b>"' + exportName + '"</b> is prepared ' +
                               'for download. The total download<br>size is ' +
                               round(data.size/1000000,3) + ' MB. Push the ' +
                               '<i>Download</i> button to begin<br>the job ' +
                               'export. ' +
                               '<p><b><i>Do not close this dialog until the ' +
                               'download has finished.</i></b>' );
            $('#download_btn').show();
          }
        },null,function(){ // depress error messages in this case!
          window.setTimeout ( checkReady,1000 );
        });
      }

      window.setTimeout ( checkReady,2000 );

      $(dlg.element).on( "dialogclose",function(event,ui){
        //alert ( 'jobSize = ' + dlg.jobSize );
        serverRequest ( fe_reqtype.finishJobExport,task,
                        'Finish Job Export',null,function(){
          window.setTimeout ( function(){
            $(dlg.element).dialog( "destroy" );
            dlg.delete();
          },10 );
        },function(){} );  // depress error messages
      });

    },null,null );

  }(this))

}

ExportJobDialog.prototype = Object.create ( InputBox.prototype );
ExportJobDialog.prototype.constructor = ExportJobDialog;
