
/*
 *  =================================================================
 *
 *    05.10.24   <--  Date of Last Modification.
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
 *     function getJobballPath ( dirPath )
 *     function zipfile    ()
 *     function packDir    ( dirPath, fileSelection, dest_path, 
 *                           onReady_func )
 *     function sendDir    ( dirPath, fileSelection, serverURL, server_fsmount,
                             command, metaData, onReady_func, onErr_func )
 *     function unpackDir  ( dirPath,cleanTmpDir, onReady_func )
 *     function receiveDir ( jobDir,tmpDir,server_request,onFinish_func )
 * 
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules

const request    = require('request'   );
const formidable = require('formidable');
const path       = require('path'      );
const fs         = require('fs-extra'  );
const crypto     = require('crypto'    );
const archiver   = require('archiver'  );
const unzipper   = require('unzipper'  );

//  load application modules
const conf  = require('./server.configuration'      );
const cmd   = require('../js-common/common.commands');
const utils = require('./server.utils'              );

//  prepare log
const log = require('./server.log').newLog(13);

// ==========================================================================

//const jobballName = '__dir.tar.gz';
const jobballName = '__dir.zip';

// ==========================================================================

function getJobballPath ( dirPath )  {
  return path.join ( dirPath,jobballName );
}

function zipfile()  {
  if (conf.pythonVersion().startsWith('3.'))
    return 'zipfile';
  return 'pycofe.varut.zipfile';
}

// -------------------------------------------------------------------------

// Function to add directories and follow symlinks
function __add_dir ( archive, dirPath, baseDir = '' )  {
  const files = fs.readdirSync(dirPath);
  files.forEach ( (file) => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.lstatSync ( fullPath ); // lstat to check for symbolic links
    if (stat.isSymbolicLink()) {
      const realPath = fs.readlinkSync(fullPath); // Follow symbolic link
      archive.file ( realPath, { name: path.join(baseDir, file) });
    } else if (stat.isDirectory()) {
      __add_dir ( archive, fullPath, path.join(baseDir, file) ); // Recurse into directories
    } else {
      archive.file ( fullPath, { name: path.join(baseDir, file) }); // Regular file
    }
  });
}

function packDir ( dirPath, fileSelection, dest_path, options, onReady_func )  {
// Pack files, assume zip

  let tmpFile = conf.getTmpFile();
  if (!tmpFile)  {
    log.error ( 1,'temporary directory not found, encountered at zipping ' + dirPath );
    onReady_func ( -2,-1 );
    return;
  }

  tmpFile = path.resolve ( tmpFile + '.zip' );
  let jobballPath = getJobballPath ( dirPath );

  // zl.archiveFolder ( dirPath,tmpFile,{ followSymlinks : true } )
  //   .then(function() {
  //     if (dest_path)
  //           utils.moveFile ( tmpFile,dest_path   );
  //     else  utils.moveFile ( tmpFile,jobballPath );
  //     onReady_func ( 0,utils.fileSize(jobballPath) );
  //   }, function(err) {
  //     log.error ( 2,'zip packing error: ' + err + ', encountered in ' + dirPath );
  //     utils.removeFile ( tmpFile );
  //     onReady_func ( err,0 );
  //   });

  let compression = conf.getServerConfig().compression;
  if (options && ('compression' in options))
    compression = options.compression;

  const output  = fs.createWriteStream ( tmpFile ); // Create output file stream
  const archive = archiver ( 'zip', {
     zlib : { 
      level : compression
     } 
  });

  let errors    = 0;
  let warnings  = 0;

  // Listen for the 'close' event, which tells when the archive is complete
  output.on('close', () => {
    // console.log(`${archive.pointer()} total bytes`);
    // console.log('Archiving has been finalized and the output file descriptor has closed.');
    if (errors+warnings>0)  {
      let err = errors + ' errors, ' + warnings + ' warnings at packing ' + dirPath;
      log.error ( 2,err );
      utils.removeFile ( tmpFile );
      onReady_func ( err,0 );
    } else  {
      if (dest_path)
            utils.moveFile ( tmpFile,dest_path   );
      else  utils.moveFile ( tmpFile,jobballPath );
      onReady_func ( 0,utils.fileSize(jobballPath) );
    }
  });

  // Handle warnings (e.g., if there are stat failures)
  archive.on ( 'warning', (err) => {
    warnings++;
    // if (err.code === 'ENOENT') {
    //   console.warn('File not found:', err.message);
    // } else {
    //   throw err;
    // }
  });

  // Handle errors
  archive.on ( 'error', (err) => {
    errors++;
    // throw err;
  });

  // Pipe archive data to the output file
  archive.pipe ( output );

  // Append the entire directory to the archive
  archive.directory ( dirPath,false );
  // __add_dir ( archive, dirPath );

  // Finalize the archive (tell it you are done appending)
  archive.finalize();

}


// ==========================================================================

function sendDir ( dirPath, fileSelection, serverURL, server_fsmount, command,
                   metaData, options, onReady_func, onErr_func )  {
  let sender_cfg = conf.getServerConfig();
  let stats = {
    zip_time  : 0,  // packing time, s
    send_time : 0,  // send time, s
    size      : 0   // jobball size, MB
  };

  function pushToServer ( formData,jobballPath )  {

    let post_options = {
      url      : serverURL + '/' + command,
      formData : formData,
      rejectUnauthorized : sender_cfg.rejectUnauthorized
    };

    stats.send_time = performance.now();

    request.post ( post_options,function(err,httpResponse,response) {

      stats.send_time = (performance.now()-stats.send_time)/1000.0

      if (jobballPath)  {
        if (!utils.removeFile(jobballPath))
          log.error ( 3,'cannot remove jobball at ' + jobballPath );
      }

      if (err) {
        if (onErr_func)
          onErr_func ( 2,err );  // '2' means an error from upload stage
        log.error ( 4,'upload failed: ' + err );
      } else  {
        try {
          let resp = JSON.parse ( response );
          if (resp.status==cmd.fe_retcode.ok)  {
            if (onReady_func)
              onReady_func ( resp.data,stats );
            log.detailed ( 1,'directory ' + dirPath +
                             ' has been received at ' + serverURL );
          } else  {
            log.error ( 5,'send directory bad response: ' + resp.status );
            if (onErr_func)
              onErr_func ( 3,resp,stats );  // '3' means an error from recipient
          }
        } catch(error)  {
          log.error ( 6,'send directory errors: ' + error );
          if (onErr_func)
            onErr_func ( 4,response,stats );  // '4' means unrecognised response
        }
      }

    });

  }

  if (sender_cfg.fsmount && server_fsmount)  {

    let formData = {};
    formData['sender' ] = sender_cfg.externalURL;
    formData['fsmount'] = sender_cfg.fsmount;
    formData['dirpath'] = path.resolve ( dirPath );  // convert to absolute path
    if (metaData)  // pass in form of simple key-value pairs
      for (let key in metaData)
        formData[key] = metaData[key];

    pushToServer ( formData,null );

  } else  {

    // 1. Pack files, assume tar

    stats.zip_time = performance.now();
    packDir ( dirPath, fileSelection, null,options, function(code,jobballSize){

      stats.zip_time = (performance.now()-stats.zip_time)/1000.0;
      stats.size     = jobballSize/1024.0/1024.0;

      if (!code)  {

        // 2. Send jobball to server

        let formData = {};
        formData['sender'] = conf.getServerConfig().externalURL;

        if (metaData)  // pass in form of simple key-value pairs
          for (let key in metaData)
            formData[key] = metaData[key];

        let jobballPath  = path.join(dirPath,jobballName);
        formData['file'] = fs.createReadStream ( jobballPath );

        pushToServer ( formData,jobballPath );

        log.detailed ( 2,'directory ' + dirPath +
                         ' has been packed and is being sent to ' + serverURL );

      } else if (onErr_func)  {
        log.error ( 7,'errors encountered ("' + code + '") at making jobbal in ' +
                      dirPath );
        onErr_func ( 1,'zip_packing_error' );  // '1' means an error from packing stage
      }

    });

  }

}


// ==========================================================================

function __after_unzip ( unpack_dir,dirPath,tmpDir,jobballPath,
                         cleanTmpDir,remove_jobball_bool,callback_func )  {
  if (remove_jobball_bool)
    utils.removeFile ( jobballPath )
  if (cleanTmpDir)  {
    // replace destination with temporary directory used for unpacking;
    // as all directories are on the same device (see above), the
    // replace should be done within this thread and, therefore, safe
    // for concurrent access from client
    if (utils.fileExists(dirPath))  {
      utils.moveDirAsync ( unpack_dir,dirPath,true,callback_func );
      utils.removePath   ( tmpDir );
    } else  {
      log.error ( 8,'expected directory "' + dirPath + '" not found' );
      callback_func ( 1111 );
    }
  } else
    callback_func ( 2222 );
}

function unpackDir1 ( dirPath,jobballPath,cleanTmpDir,remove_jobball_bool,onReady_func )  {
// unpack all service jobballs (their names start with double underscore)
// and clean them out if remove_jobball_bool is true

  let unpack_dir = dirPath;
  let tmpDir     = '';
  if (cleanTmpDir)  {
    do {
      unpack_dir = path.join ( cleanTmpDir,'tmp_'+crypto.randomBytes(20).toString('hex') );
    } while (utils.fileExists(unpack_dir));
    utils.mkDir ( unpack_dir );
    tmpDir = unpack_dir + '_JOBDIRCOPY';
  }

  let jobballSize = utils.fileSize ( jobballPath );

  // zl.extract ( jobballPath,unpack_dir )
  //   .then(function() {
  //     setTimeout ( function(){  // dedicated thread required on Windows
  //       __after_unzip ( unpack_dir,dirPath,tmpDir,jobballPath,
  //                       cleanTmpDir,remove_jobball_bool,function(e){
  //         onReady_func ( 0,jobballSize );
  //       });
  //     },0 );
  //   }, function (err) {
  //     setTimeout ( function(){  // dedicated thread required on Windows
  //       __after_unzip ( unpack_dir,dirPath,tmpDir,jobballPath,
  //                       cleanTmpDir,remove_jobball_bool,function(e){
  //         onReady_func ( err,jobballSize );
  //       });
  //     },0 );
  //   });

  const unzipStream = fs.createReadStream(jobballPath)
                        .pipe(unzipper.Extract({ path: unpack_dir }));

  let errors = 0;

  unzipStream.on('close', () => {
    if (errors>0)  {
      setTimeout ( function(){  // dedicated thread required on Windows
        __after_unzip ( unpack_dir,dirPath,tmpDir,jobballPath,
                        cleanTmpDir,remove_jobball_bool,function(e){
          onReady_func ( 'unpack errors',jobballSize );
        });
      },0 );
    } else  {
      // console.log('Extraction complete');
      // callback(null); // No error, successful extraction
      setTimeout ( function(){  // dedicated thread required on Windows
        __after_unzip ( unpack_dir,dirPath,tmpDir,jobballPath,
                        cleanTmpDir,remove_jobball_bool,function(e){
          onReady_func ( 0,jobballSize );
        });
      },0 );
    }
  });

  unzipStream.on('error', (err) => {
    errors++;
    // console.error('Error during extraction', err);
    // callback(err); // Pass error to callback
  });

}


function unpackDir ( dirPath,cleanTmpDir, onReady_func )  {
// unpack all service jobballs (their names start with double underscore)
// and clean them out
  let jobballPath = getJobballPath ( dirPath );
  unpackDir1 ( dirPath,jobballPath,cleanTmpDir,true,onReady_func );
}


// ==========================================================================

function receiveDir ( jobDir,tmpDir,server_request,onFinish_func )  {

  // make structure to keep download metadata
  let upload_meta   = {};
  upload_meta.files = {};

  // create an incoming form object
  let form = new formidable.IncomingForm();
  form.maxFileSize = 100 * 1024 * 1024 * 1024;  // 100 Gb

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  if (!utils.fileExists(tmpDir))  {
    if (!utils.mkDir(tmpDir))  {
      if (onFinish_func)
        onFinish_func ( 'err_dirnotexist','err_makedir',upload_meta );  // file renaming errors
      log.error ( 9,'upload directory ' + tmpDir + ' cannot be created' );
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
  let errs = '';
  form.on('error', function(err) {
    log.error ( 10,'receive directory error:' );
    log.error ( 10,err );
    log.error ( 10,'in ' + jobDir );
    errs += err + '\n<br>';
  });

  form.on ( 'end', function(){

    if (errs=='')  {

      if (utils.dirExists(jobDir))  {

        if (upload_meta.hasOwnProperty('dirpath'))  {

          fs.copy ( upload_meta.dirpath,jobDir,function(err){
            if (onFinish_func)
              onFinish_func ( 0,errs,upload_meta );  //  integer code : unpacking was run
            if (!err)
              log.detailed ( 7,'directory contents has been received in ' + jobDir );
            else  {
              log.standard (  1,'directory contents has been received in ' + jobDir + ' with errors: ' + err );
              log.error    ( 11,'directory contents has been received in ' + jobDir + ' with errors: ' + err );
              if (utils.dirExists(upload_meta.dirpath))
                    log.error ( 12,'source directory ' + upload_meta.dirpath + ' exists' );
              else  log.error ( 13,'source directory ' + upload_meta.dirpath + ' does not exist' );
              if (utils.dirExists(jobDir))
                    log.error ( 14,'destination directory ' + jobDir + ' exists' );
              else  log.error ( 15,'destination directory ' + jobDir + ' does not exist' );
            }
          });

        } else  {

          // restore original file names
          for (let key in upload_meta.files)
            if (!utils.moveFile(key,path.join(jobDir,upload_meta.files[key])))
              errs = 'file move error';

          if (errs=='')  {

            // unpack all service jobballs (their names start with double underscore)
            // and clean them out

            unpackDir ( jobDir,tmpDir, function(code,jobballSize){
              if (onFinish_func)
                onFinish_func ( code,errs,upload_meta );  //  integer code : unpacking was run
              if (!code)
                log.detailed (  6,'directory contents has been received in ' + jobDir );
              else  {
                log.standard (  2,'directory contents has been received in ' + jobDir +
                                  ' with errors: ' + code +
                                  ', filesize=' + jobballSize );
                log.error    ( 16,'directory contents has been received in ' + jobDir +
                                  ' with errors: ' + code +
                                  ', filesize=' + jobballSize );
              }
            });

          } else if (onFinish_func)
            onFinish_func ( 'err_rename',errs,upload_meta );  // file renaming errors

        }

      } else  {
        if (onFinish_func)
          onFinish_func ( 'err_dirnotexist',errs,upload_meta );  // file renaming errors
        log.error ( 17,'target directory ' + jobDir + ' does not exist' );
      }

    } else if (onFinish_func)
      onFinish_func ( 'err_transmission',errs,upload_meta );  // data transmission errors

  });

  // parse the incoming request containing the form data
  try {
    form.parse ( server_request );
  } catch(err) {
    errs += 'error: ' + err.name + '\nmessage: ' + err.message + '\n';
    log.error ( 18,'receive directory parse errors: ' + err );
    if (onFinish_func)
      onFinish_func ( 'err_parsing',errs,upload_meta );  // file renaming errors
  }

}


// ==========================================================================

// function returnDir ( jobDir,uniqueName,server_response,onFinish_func )  {
// // onFinish_func must take care of finalising response to the server
  
//   // Set response headers
//   server_response.setHeader('Content-Type', 'application/zip');
//   server_response.setHeader('Content-Disposition', 'attachment; filename=' + uniqueName + '.zip');

//   // Create a zip instance
//   const zip = new zl.Zip();

//   // Add folder to the zip archive
//   zip.addFolder(jobDir)
//     .then(() => {
//       // Pipe the zip stream directly to the response
//       const zipStream = zip.archive();
//       zipStream.pipe(server_response);
//       zipStream.on('end', () => {
//         server_response.end();
//         onFinish_func ( 0,'' );
//       });
//     })
//     .catch((err) => {
//       server_response.status(500).send({ error : err.message });
//       // onFinish_func ( err.message );
//       let errs = 'error: ' + err.name + '\nmessage: ' + err.message + '\n';
//       log.error ( 20,'return directory errors: ' + err );
//       onFinish_func ( 'err_returning',errs );  // file send errors
//     });

// }

// ==========================================================================
// export for use in node
module.exports.jobballName    = jobballName;
module.exports.packDir        = packDir;
module.exports.unpackDir1     = unpackDir1;
module.exports.unpackDir      = unpackDir;
module.exports.getJobballPath = getJobballPath;
module.exports.sendDir        = sendDir;
module.exports.receiveDir     = receiveDir;
// module.exports.returnDir      = returnDir;
