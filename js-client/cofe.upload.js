
/*
 *  =================================================================
 *
 *    24.07.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.upload.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  File upload class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *              server.upload.js
 *
 */


// -------------------------------------------------------------------------
// Upload class

function Upload ( customData,upl_data,onSelect_func,onSelectPDB_func,onReady_func )  {
// Custom data is an optional object of the following form:
//  { 'param1':'value1', 'param2':'value2' ... }
// When given, parameters and values from customData are appended to FormData
// sent off to server, before files to be uploaded. Put 'null' if no custom data
// should be used.
// 'upl_data' may be 'project' for upload of project tarballs, or 'project_data'
// for uploading project data, or a LIST of 'files' objects from FileReader API.

  var given_files = (!(typeof upl_data === 'string' || upl_data instanceof String));

  Widget.call ( this,'div' );

  this.setHorizontalAlignment ( 'center' );
  this.progressBar = new ProgressBar ( 100 );
  this.progressBar.setSize ( '99%','20px' );
  $(this.progressBar.element).css({'margin-bottom' : '10px',
                                   'position'      : 'relative'});
  this.addWidget ( this.progressBar );

  this.indicator = new Label ( '' );
  this.progressBar.addWidget ( this.indicator );
  $(this.indicator.element).css({'position'    : 'absolute',
                                 'center'      : '50%',
                                 'top'         : '0px',
                                 'font-weight' : 'bold',
                                 'font-style'  : 'italic',
                                 'text-shadow' : '1px 1px 0 #fff'});
  this.indicator.setHorizontalAlignment ( 'center' );
  this.indicator.setFontSize  ( '90%'  );
  this.indicator.setWidth     ( '100%' );

  var grid = new Grid('');
  var col  = 0;
  grid.setCellSize ( '50%','',0,col++ );
  this.addWidget ( grid );

  this.returnCode = 'in progress';

  this.upload_files = [];  // list of uploaded files
  this.linkDataType = null;
  this.link_button  = null;
  this.button       = null;
  this.pdb_button   = null;

  if (!given_files)  {

    if (upl_data=='project')  {
      this.button = grid.setButton ( 'Select project archive(s)',
                                     './images/open_file.svg',0,col++,1,1 )
                        .setNoWrap();
      /*
      this.button = grid.setButton ( 'Select project tarball(s)',
                                     './images/open_file.svg',0,col++,1,1 )
                        .setNoWrap();
      */

    /*
    } else if (__local_service)  {
      if (getClientCode()==client_code.ccp4)  {
        this.linkDataType = 'X-ray';
        this.link_button  = grid.setButton ( 'X-ray images','./images/xray_image.png',
                                             0,col++,1,1 ).setNoWrap();
      } else  {
        this.linkDataType = 'EM';
        this.link_button  = grid.setButton ( 'EM micrographs','./images/em_image.svg',
                                             0,col++,1,1 ).setNoWrap();
      }
      grid.setCellSize ( '12px','',0,col++ );
      this.button = grid.setButton ( 'Other data','images/open_file.svg',0,col++,1,1 )
                        .setNoWrap();
    */
    } else {
      this.button = grid.setButton ( 'Select file(s)','images/open_file.svg',0,col++,1,1 )
                        .setNoWrap();
      if (onSelectPDB_func)  {
        this.pdb_button = grid.setButton ( 'Select from PDB','images/open_file.svg',0,col++,1,1 )
                              .setNoWrap();
        this.pdb_button.addOnClickListener ( onSelectPDB_func );
      }
    }
    grid.setCellSize ( '50%','',0,col );

    this.fileListTitle = new Label ( '<b><i>Uploaded</i></b>' );
    this.fileListTitle.setHorizontalAlignment('left').setSize('100%','26px');
    this.addWidget ( this.fileListTitle );

    this.fileListPanel = new Label ( '' );
    this.fileListPanel.element.setAttribute ( 'class','upload-filelist' );
    this.addWidget ( this.fileListPanel );
    if (upl_data=='project')
      this.fileListPanel.setHeight_px ( 40 );
    this.setScrollable ( 'hidden','hidden' );

    if (upl_data=='project')  {
      this.fileListTitle.hide();
      this.fileListPanel.hide();
    }

    if (upl_data=='project')
          this.selFile = new SelectFile ( false,'.zip' );
          //this.selFile = new SelectFile ( false,'.gz' );
    else  this.selFile = new SelectFile ( true,'' );
    this.selFile.hide();
    this.addWidget ( this.selFile );

  }

  //if (onSelect_func)
  //  this.selFile.element.addEventListener ( 'change',onSelect_func,false );

  this.link_directory = null;

  (function(upl){

    upl.upload_data = function ( ext_files )  {

      var files = ext_files;
      if (!ext_files)  {

        upl.button.setDisabled ( true );
        if (upl.link_button)
          upl.link_button.setDisabled ( true );

        files = upl.selFile.element.files;

      }

      if ((files.length>0) || upl.link_directory) {

        upl.indicator.setText ( 'upload in progress ...' );

        // create a FormData object which will be sent as the data payload in the
        // AJAX request
        var formData = new FormData();

        if (customData!=null)
          for (key in customData)
            if ((customData[key]!==null) && (typeof customData[key] === 'object'))
                  formData.append ( key,JSON.stringify(customData[key]) );
            else  formData.append ( key,customData[key] );

        if (upl.link_directory)  {
          formData.append ( 'link_directory',upl.link_directory );
          formData.append ( 'link_data_type',upl.linkDataType   );
        }

        // loop through all the selected files and add them to the formData object
        var targz = true;
        if (!ext_files)  {
          for (var i = 0; i < files.length; i++) {
            var file = files[i];
//            if (!file.name.endsWith('.tar.gz'))
            if (!file.name.endsWith('.zip'))
              targz = false;
            // add the files to formData object for the data payload
            formData.append ( 'uploads[]', file, file.name);
          }
        } else  {
          for (var i = 0; i < ext_files.length; i++) {
            var files_i = ext_files[i];
            for (var j=0;j<files_i.length;j++)  {
              var file = files_i[j];
              formData.append ( 'uploads[]', file, file.name);
            }
          }
        }

        if ((upl_data=='project') && (!targz))  {

          new MessageBox ( 'Not a project archive',
              'Selected file is not a project archive. Please<br>' +
              'select project archive previously exported<br>' +
              'from jsCoFE.');

          /*
          new MessageBox ( 'Not a project tarball',
              'Selected file is not a project tarball. Please<br>' +
              'select project tarball previously exported<br>' +
              'from jsCoFE.');
          */

          upl.button   .setDisabled ( false );
          upl.indicator.setText     ( ''    );

        } else  {

          upl.emitSignal ( cofe_signals.uploadEvent,'upload_started' );

          $.ajax({
            url         : fe_command.upload,
            type        : 'POST',
            data        : formData,
            processData : false,
            contentType : false,
            success     : function(data){
              var response = jQuery.extend ( true, new Response(),
                                             jQuery.parseJSON(data) );
              if (response.status!=fe_retcode.ok)  {
                makeCommErrorMessage  ( 'Upload',response );
                upl.indicator.setText ( 'upload failed'   );
                upl.returnCode = 'failed';
              } else  {
                upl.progressBar.setValue ( 100 );
                upl.indicator  .setText  ( 'Done.' );
                upl.setUploadedFiles ( response.data.files );
                upl.returnCode = '';  // Ok
              }
              onReady_func ( upl.returnCode );
              if ('button' in upl)  {
                upl.button.setEnabled ( true );
                if (upl.link_button)
                  upl.link_button.setEnabled ( true );
              }
              upl.emitSignal ( cofe_signals.uploadEvent,'upload_finished' );
            },
            xhr: function() {

              // create an XMLHttpRequest
              var xhr = new XMLHttpRequest();

              // listen to the 'progress' event
              xhr.upload.addEventListener('progress', function(evt) {

                if (evt.lengthComputable) {
                  // calculate the percentage of upload completed
                  var percentComplete = evt.loaded / evt.total;
                  percentComplete = parseInt(percentComplete * 100);

                  // update the progress bar with the new percentage
                  upl.progressBar.setValue ( percentComplete );
                  upl.indicator  .setText  ( percentComplete + '%' );

                  // once the upload reaches 100%, set the progress bar text to done
    //                if (percentComplete === 100) {
    //                  $('.progress-bar').html('Done');
    //                }

                }

              }, false);

              return xhr;

            }

          });

        }

      }

    }

    if (given_files)  {

      upl.upload_data ( upl_data );

    } else  {

      upl.button.addOnClickListener ( function(){
        $(upl.selFile.element).click();
        upl.indicator.setText    ( '' );
        upl.progressBar.setValue ( 0  );
      });

      $(upl.selFile.element).on ( 'change', function(e){
        if (onSelect_func)
          onSelect_func ( e,function(){
            upl.upload_data ( null );
          });
        else
          upl.upload_data ( null );
      });

      if (upl.link_button)  {
        var title = 'Select Directory';
        if (upl.linkDataType=='X-ray')
              title = 'Select Directory with X-ray images';
        else  title = 'Select Directory with EM micrographs';
        upl.link_button.addOnClickListener ( function(){
          upl.link_button.setDisabled ( true );
          localCommand ( nc_command.selectDir,{
              'dataType' : upl.linkDataType,
              'title'    : title
            },'Select Directory',function(response){
              if (!response)
                return false;  // issue standard AJAX failure message
              if (response.status==nc_retcode.ok)  {
                if (response.data.directory!='')  {
                  upl.link_directory = response.data.directory;
                  upl.upload_data ( null );
                }
              } else  {
                new MessageBox ( 'Select Directory Error',
                  'Directory selection failed:<p>' +
                  '<b>stdout</b>:&nbsp;&nbsp;' + response.data.stdout + '<br>' +
                  '<b>stderr</b>:&nbsp;&nbsp;' + response.data.stderr );
              }
              upl.link_button.setEnabled ( true );
              return true;
            });
        });
      }

    }

  }(this));

}

Upload.prototype = Object.create ( Widget.prototype );
Upload.prototype.constructor = Upload;

Upload.prototype.setUploadedFiles = function ( file_list )  {
  for (var i=0;i<file_list.length;i++)
    if (this.upload_files.indexOf(file_list[i])<0)
      this.upload_files.push ( file_list[i] );
  if ('fileListPanel' in this)  {
    if (this.upload_files.length>0)  {
      this.fileListTitle.show();
      var txt = this.upload_files[0];
      for (var i=1;i<this.upload_files.length;i++)
        txt += '<br>' + this.upload_files[i];
      this.fileListPanel.setText(txt).show();
    }
  }
}


// ===========================================================================

function UploadDialog ( title,files,customData,autoClose_bool,onReady_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  var grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>' + title + '</h3>',0,0,1,3 );

  customData.login_token = __login_token;

  (function(self){

    var w = 2*$(window).width()/7 + 'px';

    $(self.element).dialog({
        resizable : false,
        height    : 'auto',
        maxHeight : 500,
        width     : w,
        modal     : true,
        open      : function(event, ui) {
          $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
          self.upload = new Upload ( customData,files,null,function(returnCode){
            $('#cancel_btn').button('option', 'label', 'Close');
            onReady_func(returnCode);
            if ((!returnCode) && autoClose_bool)
              $(self.element).dialog("close");
          });
          grid.setWidget ( self.upload,2,0,1,3 );
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

  }(this))

}

UploadDialog.prototype = Object.create ( Widget.prototype );
UploadDialog.prototype.constructor = UploadDialog;
