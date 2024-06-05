
/*
 *  =================================================================
 *
 *    05.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_export_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Export Project Dialog
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
// Export project dialog class

function ExportProjectDialog ( projectList )  {

  this.startExport ( projectList );

}

ExportProjectDialog.prototype = Object.create ( InputBox.prototype );
ExportProjectDialog.prototype.constructor = ExportProjectDialog;


ExportProjectDialog.prototype.startExport = function ( projectList )  {

  (function(dlg){

    serverRequest ( fe_reqtype.preparePrjExport,projectList,
                    'Prepare Project Export',function(rdata){  // on success

      InputBox.call ( dlg,'Export Project' );

      dlg.setText ( '','export' );
      let grid = dlg.grid;
      grid.setLabel ( '<h2>Export Project "' + projectList.current + '"</h2>',0,2,2,3 );

      let msg = 'Project <b>"' + projectList.current + 
                '"</b> is being prepared for download';
      if (rdata.nrunning==1)
        msg += '.<p><i style="font-size:85%">There is an unfinished job in '   +
               'the project; it will be shown<br>as "abandoned" when project ' +
               'is re-imported.</i></p>';
      else if (rdata.nrunning>1)
        msg += '.<p><i style="font-size:85%">There are ' + rdata.nrunning   + 
               ' unfinished jobs in the project; they will be shown<br>as ' +
               '"abandoned" when project is re-imported.</i></p>';
      else
        msg += ' ....';
      let msgLabel = new Label ( msg );
      grid.setWidget ( msgLabel, 2,2,1,3 );

      let progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 3,2,1,3 );

      grid.setLabel ( '<i style="font-size:90%;">' +
                      '(!) closing this dialog will terminate the export, ' +
                      'please wait ....</i>',4,2,1,3 );
      grid.setHorizontalAlignment ( 4,2,"right" );

      dlg.projectSize = -2;

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
              url = __special_url_tag + '/' + token + '/' + projectList.current +
                                        '/' + projectList.current + projectFileExt;
              $('#download_btn').hide();
              $('#cancel_btn'  ).button ( "option","label","Close" );
              downloadFile ( url );
            }
          },
          {
            id    : "cancel_btn",
            text  : "Close",
            click : function() {
              $(this).dialog("close");
            }
          }
        ]
      });

      window.setTimeout ( function(){ $('#download_btn').hide(); },0 );

      function checkReady() {
        serverRequest ( fe_reqtype.checkPrjExport,projectList,
                        'Prepare Project Export',function(data){
          if ((data.size<=0) && (dlg.projectSize<-1))
            window.setTimeout ( checkReady,1000 );
          else {
            dlg.projectSize = data.size;
            progressBar.hide();
            msgLabel.setText ( 'Project <b>"' + projectList.current + '"</b> is prepared ' +
                               'for download. The total download<br>size is ' +
                               round(data.size/1000000,3) + ' MB. Push the ' +
                               '<i>Download</i> button to start<br>exporting. ' +
                               '<p><b><i>Do not close this dialog until the ' +
                               'download has finished.</i></b>' );
            grid.hideRow ( 4 )
            $('#download_btn').show();
          }
        },null,function(){ // depress error messages in this case!
          window.setTimeout ( checkReady,1000 );
        });
      }

      window.setTimeout ( checkReady,2000 );

      $(dlg.element).on( "dialogclose",function(event,ui){
        //alert ( 'projectSize = ' + dlg.projectSize );
        serverRequest ( fe_reqtype.finishPrjExport,projectList,
                        'Finish Project Export',null,function(){
          window.setTimeout ( function(){
            $(dlg.element).dialog( "destroy" );
            dlg.delete();
          },10 );
        },function(){} );  // depress error messages
      });

    },null,null );

  }(this))

}
