
/*
 *  =================================================================
 *
 *    16.06.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.upload_handler.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Uploads Handler
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 */

'use strict';

const path          = require('path');
const formidable    = require('formidable');
const child_process = require('child_process');
const crypto        = require('crypto');
const fs            = require('fs-extra');

const conf     = require('./server.configuration');
const cmd      = require('../js-common/common.commands');
const user     = require('./server.fe.user');
const prj      = require('./server.fe.projects');
const send_dir = require('./server.send_dir.js');
const utils    = require('./server.utils');

//  prepare log
const log = require('./server.log').newLog(9);

// ==========================================================================

function uploadDir()  { return 'uploads'; }

// ==========================================================================

function handleUpload ( server_request,server_response )  {
var errs        = '';    // error log
var upload_meta = {};

  upload_meta.files = {};

  // create an incoming form object
  var form = new formidable.IncomingForm();
  form.maxFileSize = 100 * 1024 * 1024 * 1024;  // 100 Gb

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  var tmpDir = conf.getFETmpDir();

  if (!utils.fileExists(tmpDir))  {
    if (!utils.mkDir(tmpDir))  {
      cmd.sendResponse ( server_response, cmd.fe_retcode.mkDirError,
                         'Cannot make temporary directory for upload','' );
      return;
    }
  }

  form.uploadDir = tmpDir;

  form.on ( 'field', function(name, value) {
    upload_meta[name] = value;
  });

  // every time a file has been uploaded successfully, retain mapping of
  // its temporary path and original name
  form.on ( 'file', function(field, file) {
    upload_meta.files[file.path] = file.name;
  });

  // log any errors that occur
  form.on ( 'error', function(err) {
    log.error ( 1,'upload error: \n' + err);
    errs += err + '\n<br>';
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {

    if (errs=='')  {

      if ('login_token' in upload_meta)  {

        var loginData = user.getLoginEntry ( upload_meta.login_token );
        if (loginData.login)  {

          if (('project' in upload_meta) && ('job_id' in upload_meta))  {
            // upload from import job

            var jobDir = prj.getJobDirPath ( loginData,upload_meta.project,
                                             upload_meta.job_id );
            if (utils.fileExists(jobDir))  {

              var uplDir = path.join ( jobDir,uploadDir() );
              if (!utils.fileExists(uplDir))  {
                if (!utils.mkDir(uplDir))
                  uplDir = '';
              }

              if (uplDir.length>0)  {

                var fdata       = {};
                var file_mod    = null;
                var file_rename = {};
                var redundant_files = [];
                fdata.files     = [];

                if ('file_mod' in upload_meta)  {
                  file_mod    = JSON.parse ( upload_meta.file_mod );
                  file_rename = file_mod.rename;
                  if (!utils.writeObject(path.join(jobDir,'annotation.json'),
                                         file_mod))
                    errs = 'error writing annotation.json';
                  for (var i=0;i<file_mod.annotation.length;i++)  {
                    redundant_files.push ( file_mod.annotation[i].file );
                    for (var j=0;j<file_mod.annotation[i].items.length;j++)  {
                      var fname = file_mod.annotation[i].items[j].rename;
                      utils.writeString ( path.join(uplDir,fname),
                                          file_mod.annotation[i].items[j].contents );
                      fdata.files.push ( fname );
                    }
                  }
                }

                for (var key in upload_meta.files)  {
                  var fname = upload_meta.files[key];
                  if (redundant_files.indexOf(fname)>=0)  {
                    utils.removeFile ( key );
                  } else  {
                    if (fname in file_rename)
                      fname = file_rename[fname];
                    if (!utils.moveFile(key,path.join(uplDir,fname)))
                      errs = 'error';
                    fdata.files.push ( fname );
                  }
                }

                if ('link_directory' in upload_meta)  {
                  var ldir = path.basename(upload_meta.link_directory);
                  var ext  = '';
                  if (upload_meta.link_data_type=='X-ray')  {
                    ext = '.xray.link';
                    fdata.files.push  ( ldir + ' [x-ray images,link]' );
                  } else  {
                    ext = '.em.link';
                    fdata.files.push  ( ldir + ' [EM micrograms,link]' );
                  }
                  utils.writeString ( path.join(uplDir,ldir + ext),
                                      upload_meta.link_directory );
                }

                if (errs=='')
                      cmd.sendResponse ( server_response, cmd.fe_retcode.ok,
                                         'success',fdata );
                else  cmd.sendResponse ( server_response, cmd.fe_retcode.writeError,
                                         'Cannot store upload data in job directory',
                                         fdata );
              } else
                cmd.sendResponse ( server_response, cmd.fe_retcode.noUploadDir,
                                   'Upload directory cannot be created','' );

            } else
              cmd.sendResponse ( server_response, cmd.fe_retcode.noJobDir,
                                 'Job directory not found','' );

          } else  {  // upload from project import

            var response = prj.importProject ( loginData,upload_meta );
            response.send ( server_response );

          }

        } else
          cmd.sendResponse ( server_response, cmd.fe_retcode.notLoggedIn,
                             'User is not logged in','' );

      } else
        cmd.sendResponse ( server_response, cmd.fe_retcode.notLoggedIn,
                           'Login credentials are not recognised','' );
    } else
      cmd.sendResponse ( server_response, cmd.fe_retcode.uploadErrors,errs,'' );

  });

  // parse the incoming request containing the form data
  try {
    form.parse(server_request);
  } catch(err) {
    errs += 'error: ' + err.name + '\nmessage: ' + err.message + '\n';
  }

  return;

}


// ==========================================================================
// export for use in node
module.exports.uploadDir    = uploadDir;
module.exports.handleUpload = handleUpload;
