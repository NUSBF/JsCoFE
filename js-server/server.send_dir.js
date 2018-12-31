
/*
 *  =================================================================
 *
 *    29.07.18   <--  Date of Last Modification.
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
var request       = require('request'   );
var formidable    = require('formidable');
//var child_process = require('child_process');
//var archiver      = require('archiver'  );
//var unzipper      = require('unzipper'  );
var path          = require('path'      );
var fs            = require('fs-extra'  );
var crypto        = require('crypto'    );

//  load application modules
var conf  = require('./server.configuration'      );
var cmd   = require('../js-common/common.commands');
var utils = require('./server.utils'              );

//  prepare log
var log = require('./server.log').newLog(13);

// ==========================================================================

//var jobballName = '__dir.tar.gz';
var jobballName = '__dir.zip';

// ==========================================================================

/*  --- old tar version 23.07.2018
function packDir ( dirPath, fileSelection, onReady_func )  {
// Pack files, assume tar

  utils.removeFile ( jobballName );

  var tar = child_process.spawn ( '/bin/sh',['-c','tar -czf ' +
                                  jobballName + ' ' + fileSelection],{
    cwd   : dirPath,
    stdio : ['ignore']
  });

  tar.stderr.on ( 'data',function(data){
    log.error ( 10,'tar errors: "' + data + '"; encountered in ' + dirPath );
  });

  tar.on ( 'close', function(code){
    onReady_func(code);
    if (code!=0)  {
      log.error ( 11,'tar packing code: ' + code + ', encountered in ' + dirPath );
      utils.removeFile ( path.join(dirPath,jobballName) );
    }
  });

}
*/

/*  ---  node-based zip version (inefficient) 25.07.2018
function packDir ( dirPath, fileSelection, onReady_func )  {
// Pack files, use zip

  //utils.removeFile ( jobballName );

  var jobballPath = path.join ( dirPath,jobballName );
  utils.removeFile ( jobballPath );

  var output  = fs.createWriteStream ( jobballPath );
  var archive = archiver ( 'zip', {
    zlib: { level: 3 }  // Sets the compression level.
  });

  // listen for all archive data to be written
  errors = "";

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  //output.on ( 'end',function(){
  //  console.log('Data has been drained');
  //});

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on ( 'warning',function(err){
    if (err.code === 'ENOENT') {
      //console.log ( 'ENOENT error' );
      errors += 'ENOENT packing error ';
      // log warning
    } else {
      errors += 'packing warnings ';
      //console.log ( 'errors 1' );
      // throw error
      //throw err;
    }
    log.error ( 10,'zip warnings encountered in ' + dirPath );
  });

  // good practice to catch this error explicitly
  archive.on ( 'error', function(err) {
    errors += 'packing errors ';
    log.error ( 10,'zip errors encountered in ' + dirPath );
    //console.log ( 'errors 2' );
    //throw err;
  });

  // pipe archive data to the file
  archive.pipe ( output );

  // append files from a sub-directory, putting its contents at the root of archive
  archive.directory ( dirPath,false );
  //archive.glob ( path.join(dirPath,fileSelection) );

  // 'close' event is fired only when a file descriptor is involved
  output.on ( 'close',function(){
    if (errors)  {
      onReady_func(-1);
      log.error ( 11,'zip errors: ' + errors + ', encountered in ' + dirPath );
      utils.removeFile ( jobballPath );
    } else
      onReady_func(0);
  });

  // finalize the archive (ie we are done appending files but streams have to finish yet)
  // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
  archive.finalize();

}
*/

function getJobballPath ( dirPath )  {
  return path.join ( dirPath,jobballName );
}

function packDir ( dirPath, fileSelection, onReady_func )  {
// Pack files, assume zip

  var tmpFile = conf.getTmpFile();
  if (!tmpFile)  {
    log.error ( 11,'temporary directory not found, encountered at zipping ' + dirPath );
    onReady_func ( -2 );
    return;
  }

  tmpFile = path.resolve ( tmpFile + '.zip' );

  var zip = utils.spawn ( conf.pythonName(),['-m','zip_file','-c',tmpFile,'.'],{
    cwd   : dirPath,
    stdio : ['ignore']
  });

  zip.stderr.on ( 'data',function(data){
    log.error ( 10,'zip errors: "' + data + '"; encountered in ' + dirPath );
  });

  zip.on ( 'close', function(code){
    if (code!=0)  {
      log.error ( 11,'zip packing code: ' + code + ', encountered in ' + dirPath );
      utils.removeFile ( tmpFile );
    } else {
      utils.moveFile ( tmpFile,getJobballPath(dirPath) );
    }
    onReady_func(code);
  });

}


// ==========================================================================

function sendDir ( dirPath, fileSelection, serverURL, command, metaData,
                   onReady_func, onErr_func )  {

  // 1. Pack files, assume tar

  packDir ( dirPath, fileSelection, function(code){

    if (code==0)  {

      // 2. Send jobball to server

      var formData = {};
      formData['sender'] = conf.getServerConfig().externalURL;

      if (metaData)  // pass in form of simple key-value pairs
        for (key in metaData)
          formData[key] = metaData[key];

      var jobballPath  = path.join(dirPath,jobballName);
      formData['file'] = fs.createReadStream ( jobballPath );

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
        utils.removeFile ( jobballPath );

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

/*  --- old tar code  23.07.2018
function unpackDir ( dirPath,cleanTmpDir, onReady_func )  {
// unpack all service jobballs (their names start with double underscore)
// and clean them out

  var jobballPath = path.join ( dirPath,'__*.tar' );

  // however silly, we separate ungzipping and untaring because using '-xzf'
  // has given troubles on one system
  var unpack_com = 'gzip -d '   + path.join(dirPath,'__*.tar.gz') +
                   '&& tar -xf ' + jobballPath;

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
    //unpack_com += ' -C '       + tmpDir1  +
    //              '&& rm -rf ' + path.join(dirPath,'*') +
    //              '&& mv '     + path.join(tmpDir1 ,'*') + ' ' + dirPath +
    //              '&& rm -rf ' + tmpDir1;
  } else {
    unpack_com += ' -C ' + dirPath + '; rm ' + jobballPath;
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
*/

/*  -- node-based zip version (inefficient)  25.07.2018
function unpackDir ( dirPath,cleanTmpDir, onReady_func )  {
// unpack all service jobballs (their names start with double underscore)
// and clean them out

  var jobballPath = path.join ( dirPath,jobballName );
  var errors = "";

  if (cleanTmpDir)  {
    var unpackDir = '';
    do {
      unpackDir = path.join ( cleanTmpDir,crypto.randomBytes(20).toString('hex') );
    } while (utils.fileExists(unpackDir));
    utils.mkDir ( unpackDir );
    tmpDir = unpackDir + '_JOBDIRCOPY'
  } else {
    unpackDir = dirPath;
  }

  fs.createReadStream(jobballPath)
    .pipe(unzipper.Extract({ path: unpackDir })
      .on('error',function(){
        log.error ( 15,'zip/unpackDir errors encountered in ' + dirPath );
        errors = "errors";
      })
     .on('close', function(){
       utils.removeFile ( jobballPath )
       if (!errors)  {
          if (cleanTmpDir)  {
            // replace destination with temporary directory used for unpacking;
            // as all directories are on the same device (see above), the
            // replace should be done within this thread and, therefore, safe
            // for concurrent access from client
            utils.moveFile ( dirPath  ,tmpDir  );
            utils.moveFile ( unpackDir,dirPath );
            setTimeout ( function(){  // postpone for speed
              utils.removePath ( tmpDir );
            },0 );
          }
          onReady_func(0);
       } else {
         onReady_func(-1);
       }
     }));

}
*/

function unpackDir ( dirPath,cleanTmpDir, onReady_func )  {
// unpack all service jobballs (their names start with double underscore)
// and clean them out

  var jobballPath = getJobballPath ( dirPath );
  //var errors = "";

  if (cleanTmpDir)  {
    var unpack_dir = '';
    do {
      unpack_dir = path.join ( cleanTmpDir,'tmp_'+crypto.randomBytes(20).toString('hex') );
    } while (utils.fileExists(unpack_dir));
    utils.mkDir ( unpack_dir );
    tmpDir = unpack_dir + '_JOBDIRCOPY';
  } else {
    unpack_dir = dirPath;
  }

  var zip = utils.spawn ( conf.pythonName(),['-m','zip_file','-e',jobballPath,unpack_dir],{
    stdio : ['ignore']
  });

  zip.stderr.on ( 'data',function(data){
    log.error ( 15,'zip/unpackDir errors: "' + data + '"; encountered in ' + dirPath );
  });

  zip.on('close', function(code){
    utils.removeFile ( jobballPath )
    if (cleanTmpDir)  {
       // replace destination with temporary directory used for unpacking;
       // as all directories are on the same device (see above), the
       // replace should be done within this thread and, therefore, safe
       // for concurrent access from client
       utils.moveFile ( dirPath   ,tmpDir  );
       utils.moveFile ( unpack_dir,dirPath );
       setTimeout ( function(){  // postpone for speed
         utils.removePath ( tmpDir );
       },0 );
    }
    onReady_func ( code );
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

          // unpack all service jobballs (their names start with double underscore)
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
module.exports.jobballName    = jobballName;
module.exports.packDir        = packDir;
module.exports.unpackDir      = unpackDir;
module.exports.getJobballPath = getJobballPath;
module.exports.sendDir        = sendDir;
module.exports.receiveDir     = receiveDir;
