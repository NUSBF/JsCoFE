
/*
 *  =================================================================
 *
 *    11.04.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_export_from_safe.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Expot from Failed Jobs Safe Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2025
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Export from Failed Jobs Safe dialog class

function ExportFromSafeDialog ( onSuccess_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Export Job from Safe' );
  document.body.appendChild ( this.element );

  var grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Export Job from Failed Jobs Safe</h3>',0,0,1,1 );

  var msgLabel = new Label ( 'Use "<i>Select failed job directory</i>" button to ' +
                             'navigate<br>to a demo project.<p>' +
                             'The export will commence automatically once a '  +
                             'directory<br>is chosen -- <b><i>do not close ' +
                             'this dialog until the export<br>is complete.</i></b>' +
                             '<hr/>' );
  grid.setWidget ( msgLabel, 1,0,1,1 );

  var select_btn = grid.setButton ( 'Select failed job directory',
                                    image_path('open_file'),2,0,1,1 )
                                    .setNoWrap();
  grid.setHorizontalAlignment ( 2,0,'center' );

  this.currentCloudPath = 'Failed Jobs Safe';  // a pre-defined mount (see getJobSafeMount())
  this.tree_type        = 'jobs_safe';  // will use special cloud storage mount
  (function(task){
    select_btn.addOnClickListener ( function(){
      new CloudFileBrowser ( null,task,3,[],function(items){
        //alert ( JSON.stringify(items) );
        new ExportFailedJobDialog ( items.path );
        //var exportDirPath = items.path;
        return 1;  // do close browser window
      },null );
    });
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

}


ExportFromSafeDialog.prototype = Object.create ( Widget.prototype );
ExportFromSafeDialog.prototype.constructor = ExportFromSafeDialog;


// -------------------------------------------------------------------------
// Export failed job dialog class

function ExportFailedJobDialog ( safeDirPath )  {

  (function(dlg){

    let fjdata = { 'path' : safeDirPath };
    serverRequest ( fe_reqtype.prepareFJobExport,fjdata,
                    'Prepare Failed Job Export',function(fjurl){  // on success

      Widget.call ( dlg,'div' );

      let exportName = safeDirPath.split('/').pop();
      dlg.element.setAttribute ( 'title','Export Failed Job ' + exportName );
      document.body.appendChild ( dlg.element );

      let grid = new Grid('');
      dlg.addWidget ( grid );

      grid.setLabel ( '<h3>Exporting Failed Job "' + exportName + '"</h3>',0,0,1,3 );

      let msgLabel = new Label ( 'Failed Job <b>"' + exportName + '"</b> is being ' +
                                 'prepared for download ....' );
      grid.setWidget ( msgLabel, 1,0,1,3 );

      let progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 2,0,1,3 );

      dlg.jobSize = -2;

    //  w = 3*$(window).width()/5 + 'px';

      let cancel_btn_id   = 'cancel_btn_'   + __id_cnt++;
      let download_btn_id = 'download_btn_' + __id_cnt++;

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
            id    : download_btn_id,
            text  : 'Download',
            click : function() {
                downloadFile ( fjurl );
                $( '#' + cancel_btn_id ).text('Close');
              }
          },
          {
            id    : cancel_btn_id,
            text  : 'Cancel',
            click : function() {
              $(this).dialog('close');
            }
          }
        ]
      });

      window.setTimeout ( function(){ $('#'+download_btn_id).hide(); },0 );

      function checkReady() {
        serverRequest ( fe_reqtype.checkFJobExport,fjdata,
                        'Prepare Job Export',function(data){
          if ((data.size<=0) && (dlg.jobSize<-1))
            window.setTimeout ( checkReady,1000 );
          else {
            dlg.jobSize = data.size;
            progressBar.hide();
            msgLabel.setText ( 'Failed Job <b>"' + exportName + '"</b> is prepared ' +
                               'for download. The total download<br>size is ' +
                               round(data.size/1000000,3) + ' MB. Push the ' +
                               '<i>Download</i> button to export the job.' +
                               '<p><b><i>Do not close this dialog until the ' +
                               'download has finished.</i></b>' );
            $('#'+download_btn_id).show();
          }
        },null,function(){ // depress error messages in this case!
          window.setTimeout ( checkReady,1000 );
        });
      }

      window.setTimeout ( checkReady,2000 );

      $(dlg.element).on( "dialogclose",function(event,ui){
        //alert ( 'jobSize = ' + dlg.jobSize );
        serverRequest ( fe_reqtype.finishFJobExport,fjdata,
                        'Finish Failed Job Export',null,function(){
          window.setTimeout ( function(){
            $(dlg.element).dialog( "destroy" );
            dlg.delete();
          },10 );
        },function(){} );  // depress error messages
      });

    },null,null );

  }(this))

}

ExportFailedJobDialog.prototype = Object.create ( Widget.prototype );
ExportFailedJobDialog.prototype.constructor = ExportFailedJobDialog;
