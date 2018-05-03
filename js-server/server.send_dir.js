
/*
 *  =================================================================
 *
 *    22.02.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.send_dir.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Send Directory Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var request       = require('request');
var formidable    = require('formidable');
var child_process = require('child_process');
var path          = require('path');
var fs            = require('fs-extra');
var crypto        = require('crypto');

//  load application modules
var conf  = require('./server.configuration');
var cmd   = require('../js-common/common.commands');
var utils = require('./server.utils');

//  prepare log
var log = require('./server.log').newLog(13);

// ==========================================================================

var tarballName = '__dir.tar.gz';

// ==========================================================================

function packDir ( dirPath, fileSelection, onReady_func )  {
// Pack files, assume tar

  utils.removeFile ( tarballName );

  var tar = child_process.spawn ( '/bin/sh',['-c','tar -czf ' +
                                  tarballName + ' ' + fileSelection],{
    cwd   : dirPath,
    stdio : ['ignore']
  });

  /*
  var tname = tarballName.slice(0,-3);
  var tar = child_process.spawn ( '/bin/sh',['-c','tar -cf ' +
                          tname + ' ' + fileSelection +
                          '; gzip ' + tname],{
    cwd   : dirPath,
    stdio : ['ignore']
  });
  */

  tar.stderr.on ( 'data',function(data){
    log.error ( 10,'tar errors: "' + data + '"; encountered in ' + dirPath );
  });

  tar.on ( 'close', function(code){
    onReady_func(code);
    if (code!=0)  {
      log.error ( 11,'tar packing code: ' + code + ', encountered in ' + dirPath );
      utils.removeFile ( path.join(dirPath,tarballName) );
    }
  });

}


// ==========================================================================

function sendDir ( dirPath, fileSelection, serverURL, command, metaData,
                   onReady_func, onErr_func )  {

  // 1. Pack files, assume tar

  packDir ( dirPath, fileSelection, function(code){

    if (code==0)  {

      // 2. Send tarball to server

      var formData = {};
      formData['sender'] = conf.getServerConfig().externalURL;

      if (metaData)  // pass in form of simple key-value pairs
        for (key in metaData)
          formData[key] = metaData[key];

      var tarballPath  = path.join(dirPath,tarballName);
      formData['file'] = fs.createReadStream ( tarballPath );

      request.post({

        url      : serverURL + '/' + command,
        formData : formData

      }, function(err,httpResponse,response) {

        if (err) {
          if (onErr_func)
            onErr_func ( 2,err );  // '2' means an error from upload stage
          log.error ( 3,'upload failed:', err);
        } else  {
          try {
            var resp = JSON.parse ( response );
            if (resp.status==cmd.fe_retcode.ok)  {
              if (onReady_func)
                onReady_func ( resp.data );
              log.detailed ( 1,'directory ' + dirPath +
                               ' has been received at ' + serverURL );
            } else if (onErr_func)
              onErr_func ( 3,resp );  // '3' means an error from recipient
          } catch(err)  {
            onErr_func ( 4,response );  // '4' means unrecognised response
          }
        }

        //utils.removeFile ( formData['file'] );
        utils.removeFile ( tarballPath );

      });

      log.detailed ( 2,'directory ' + dirPath +
                       ' has been packed and is being sent to ' + serverURL );

    } else if (onErr_func)  {
      onErr_func ( 1,code );  // '1' means an error from packing stage
      log.error ( 4,'errors encontered ("' + code + '") at making jobbal in ' + dirPath );
    }

  });

}


// ==========================================================================

function unpackDir ( dirPath,cleanTmpDir, onReady_func )  {
// unpack all service tarballs (their names start with double underscore)
// and clean them out

  var tarballPath = path.join ( dirPath,'__*.tar' );

  // however silly, we separate ungzipping and untaring because using '-xzf'
  // has given troubles on one system
  var unpack_com = 'gzip -d '   + path.join(dirPath,'__*.tar.gz') +
                   '&& tar -xf ' + tarballPath;

  if (cleanTmpDir)  {
    var tmpDir1 = '';
    do {
      tmpDir1 = path.join ( cleanTmpDir,crypto.randomBytes(20).toString('hex') );
    } while (utils.fileExists(tmpDir1));
    utils.mkDir ( tmpDir1 );
    tmpDir2 = tmpDir1 + '_JOBDIRCOPY'
    unpack_com += ' -C '       + tmpDir1 +
                  '&& mv '     + dirPath + ' ' + tmpDir2 +
                  '&& mv '     + tmpDir1 + ' ' + dirPath +
                  '&& rm -rf ' + tmpDir2;
    /*
    unpack_com += ' -C '       + tmpDir1  +
                  '&& rm -rf ' + path.join(dirPath,'*') +
                  '&& mv '     + path.join(tmpDir1 ,'*') + ' ' + dirPath +
                  '&& rm -rf ' + tmpDir1;
    */
  } else {
    unpack_com += ' -C ' + dirPath + '; rm ' + tarballPath;
  }

  var tar = child_process.spawn ( '/bin/sh',['-c',unpack_com],{
    stdio : ['ignore']
  });

  tar.stderr.on ( 'data',function(data){
    log.error ( 15,'tar/unpackDir errors: "' + data + '"; encountered in ' + dirPath );
  });

  tar.on('close', function(code){
    onReady_func(code);
  });

}


// ==========================================================================

function receiveDir ( jobDir,tmpDir,server_request,onFinish_func )  {

  // make structure to keep download metadata
  var upload_meta   = {};
  upload_meta.files = {};

  // create an incoming form object
  var form = new formidable.IncomingForm();
  form.maxFileSize = 100 * 1024 * 1024 * 1024;  // 100 Gb

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  //var tmpDir = path.join ( conf.getFEConfig().projectsPath,'tmp' );

  if (!utils.fileExists(tmpDir))  {
    if (!utils.mkDir(tmpDir))  {
      if (onFinish_func)
        onFinish_func ( 'err_dirnoexist',errs,upload_meta );  // file renaming errors
      log.error ( 8,'upload directory ' + tmpDir + ' cannot be created' );
      return;
    }
  }

  // store all uploads in job directory

  form.uploadDir = tmpDir;

  form.on('field', function(name,value) {
    log.debug2 ( 100,'name=' + name + ',  value=' + value );
    upload_meta[name] = value;
  });

  // every time a file has been uploaded successfully, retain mapping of
  // it's temporary path and original name
  form.on('file', function(field,file) {
    upload_meta.files[file.path] = file.name;
  });

  // log any errors that occur
  var errs = '';
  form.on('error', function(err) {
    log.error ( 5,'receive directory error:' );
    log.error ( 5,err );
    log.error ( 5,'in ' + jobDir );
    errs += err + '\n<br>';
  });

  form.on ( 'end', function(){

    if (errs=='')  {

      if (utils.fileExists(jobDir))  {

        // restore original file names
        for (key in upload_meta.files)
          if (!utils.moveFile(key,path.join(jobDir,upload_meta.files[key])))
            errs = 'file move error';

        if (errs=='')  {

          // unpack all service tarballs (their names start with double underscore)
          // and clean them out

          unpackDir ( jobDir,tmpDir, function(code){
            if (onFinish_func)
              onFinish_func ( code,errs,upload_meta );  //  integer code : unpacking was run
            log.detailed ( 6,'directory contents has been received in ' + jobDir );
          });

        } else if (onFinish_func)
          onFinish_func ( 'err_rename',errs,upload_meta );  // file renaming errors

      } else  {
        if (onFinish_func)
          onFinish_func ( 'err_dirnoexist',errs,upload_meta );  // file renaming errors
        log.error ( 7,'target directory ' + jobDir + ' does not exist' );
      }

    } else if (onFinish_func)
      onFinish_func ( 'err_transmission',errs,upload_meta );  // data transmission errors

  });

  // parse the incoming request containing the form data
  try {
    form.parse ( server_request );
  } catch(err) {
    errs += 'error: ' + err.name + '\nmessage: ' + err.message + '\n';
  }

}

// ==========================================================================
// export for use in node
module.exports.tarballName = tarballName;
module.exports.packDir     = packDir;
module.exports.unpackDir   = unpackDir;
module.exports.sendDir     = sendDir;
module.exports.receiveDir  = receiveDir;
