
/*
 *  =================================================================
 *
 *    05.10.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_licence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Export Project Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Export project dialog class

function ExportProjectDialog ( projectList )  {

  (function(dlg){

    serverRequest ( fe_reqtype.preparePrjExport,projectList,
                    'Prepare Project Export',function(){  // on success

      Widget.call ( dlg,'div' );
      dlg.element.setAttribute ( 'title','Export Project' );
      document.body.appendChild ( dlg.element );

      var grid = new Grid('');
      dlg.addWidget ( grid );

      grid.setLabel ( '<h3>Export Project "' + projectList.current + '"</h3>',0,0,1,3 );

      var msgLabel = new Label ( 'Project "' + projectList.current + '" is being ' +
                                 'prepared for download ....' );
      grid.setWidget ( msgLabel, 1,0,1,3 );

      var progressBar = new ProgressBar ( 0 );
      grid.setWidget ( progressBar, 2,0,1,3 );

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
              var token;
              var url;
              //                if (__login_token)  token = __login_token.getValue();
                if (__login_token)
                      token = __login_token;
                else  token = '404';
                url = special_url_tag + '/' + token + '/' + projectList.current +
                                        '/' + projectList.current + '.tar.gz';
                downloadFile ( replaceAll(url,'/','@') );
                $( "#cancel_btn" ).button ( "option","label","Close" );
                //$(dlg).dialog("close");
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
        serverRequest ( fe_reqtype.checkPrjExport,projectList,
                        'Prepare Project Export',function(data){
          if ((data.size<=0) && (dlg.projectSize<-1))
            window.setTimeout ( checkReady,1000 );
          else {
            dlg.projectSize = data.size;
            progressBar.hide();
            msgLabel.setText ( 'Project "' + projectList.current + '" is prepared ' +
                               'for download. The total download<br>size is ' +
                               round(data.size/1000000,3) + ' MB. Push the ' +
                               '<i>Download</i> button to begin<br>the project ' +
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

ExportProjectDialog.prototype = Object.create ( Widget.prototype );
ExportProjectDialog.prototype.constructor = ExportProjectDialog;
