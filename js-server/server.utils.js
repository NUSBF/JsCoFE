
/*
 *  =================================================================
 *
 *    23.10.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.utils.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Server-side utility functions
 *       ~~~~~~~~~
 *
 *        function fileExists       ( fpath )
 *        function isSymbolicLink   ( fpath )
 *        function dirExists        ( fpath )
 *        function fileSize         ( fpath )
 *        function removeFile       ( fpath ) 
 *        function readString       ( fpath )  
 *        function makeSymLink      ( pathToTarget,pathToOrigin )  
 *        function readObject       ( fpath )  
 *        function readClass        ( fpath )
 *        function writeString      ( fpath,data_string )  
 *        function appendString     ( fpath,data_string )  
 *        function writeObject      ( fpath,dataObject )  
 *        function copyFile         ( old_path,new_path )  
 *        function moveFile         ( old_path,new_path )  
 *        function copyDirAsync     ( old_path,new_path,overwrite_bool,
 *                                    callback_func )  
 *        function mkDir_check      ( dirPath )  
 *        function mkDir_anchor     ( dirPath )  
 *        function mkPath           ( dirPath )  
 *        function removePathAsync  ( dir_path )  
 *        function removePath       ( dir_path )  
 *        function moveDir          ( old_path,new_path,overwrite_bool )  
 *        function moveDirAsync     ( old_path,new_path,overwrite_bool,
 *                                    callback_func )  
 *        function cleanDir         ( dir_path ) 
 *        function cleanDirExt      ( dir_path,fext )  
 *        function removeSymLinks   ( dir_path )  
 *        function getDirectorySize ( dir_path )  
 *        function searchTree       ( dir_path,filename,matchKey ) 
 *        function removeFiles      ( dir_path,extList ) 
 *        function killProcess      ( pid )  
 *        function writeJobReportMessage ( jobDirPath, message, updating_bool )  
 *        function jobSignalExists  ( jobDir ) 
 *        function removeJobSignal  ( jobDir ) 
 *        function writeJobSignal   ( jobDir,signal_name,signal_message,signal_code )  
 *        function getJobSignalCode ( jobDir )  
 *        function clearRVAPIreport ( jobDirPath,taskFileName )  
 *        function getMIMEType      ( path )  
 *        function capData          ( data,n )  
 *        function send_file        ( fpath,server_response,mimeType,
 *                                    deleteOnDone,capSize,persistance,
 *                                    nofile_callback,onDone_callback=null )  
 *        function spawn            ( exeName,args,options )  
 *        function padDigits        ( number,digits ) 
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

const fs            = require('fs-extra');
const path          = require('path');
const child_process = require('child_process');

const class_map     = require('./server.class_map');
const task_t        = require('../js-common/tasks/common.tasks.template');
// const com_utils     = require('../js-common/common.utils');

//  prepare log
const log = require('./server.log').newLog(14);

const _is_windows = /^win/.test(process.platform);

// ==========================================================================

function fileExists ( fpath )  {
  try {
    return fs.lstatSync(fpath); // || fs.lstatSync(path);
  } catch (e)  {
    return null;
  }
}

function isSymbolicLink ( fpath )  {
  try {
    let stat = fs.lstatSync(fpath); // || fs.lstatSync(path);
    if (stat && stat.isSymbolicLink())
      return stat;
    return null;
  } catch (e)  {
    return null;
  }
}

function dirExists ( fpath )  {
  try {
    let stat = fs.statSync(fpath);
    if (stat)
      return stat.isDirectory();
    return null;
  } catch (e)  {
    return null;
  }
}


function fileSize ( fpath ) {
  try {
    return fs.statSync(fpath)['size'];
  } catch (e)  {
    return 0;
  }
}


function removeFile ( fpath ) {
  try {
    fs.unlinkSync ( fpath );
    return true;
  } catch (e)  {
    return false;
  }
}


function readString ( fpath )  {
  try {
    return fs.readFileSync(fpath).toString();
  } catch (e)  {
    return null;
  }
}


function makeSymLink ( pathToTarget,pathToOrigin )  {
  try {
    if (_is_windows)
          fs.symlinkSync ( pathToOrigin,pathToTarget,'junction' );
    else  fs.symlinkSync ( pathToOrigin,pathToTarget );
  } catch (e)  {
    return null;
  }
  return true;
}


function readObject ( fpath )  {
  try {
    return JSON.parse ( fs.readFileSync(fpath).toString() );
  } catch (e)  {
    if (e.code !== 'ENOENT')
      log.error ( 10, e.message + ' when loading ' + fpath );
    return null;
  }
}


function readClass ( fpath ) {  // same as object but with class functions
  try {
    return class_map.getClassInstance ( fs.readFileSync(fpath).toString() );
  } catch (e)  {
    return null;
  }
}


function writeString ( fpath,data_string )  {
  try {
    fs.writeFileSync ( fpath,data_string );
    return true;
  } catch (e)  {
    log.error ( 20,'cannot write file ' + fpath +
                   ' error: ' + JSON.stringify(e) );
    console.error(e);
    return false;
  }
}


function appendString ( fpath,data_string )  {
  try {
    fs.appendFileSync ( fpath,data_string );
    return true;
  } catch (e)  {
    log.error ( 30,'cannot write file ' + fpath +
                   ' error: ' + JSON.stringify(e) );
    console.error(e);
    return false;
  }
}


function writeObject ( fpath,dataObject )  {

  let json_str = '';
  try {
    // json_str = JSON.stringify ( dataObject );
    json_str = JSON.stringify ( dataObject,null,2 );
  } catch (e) {
    log.error ( 40,'attempt to write corrupt data object at ' + fpath +
                   ' error: ' + JSON.stringify(e) );
    console.error(e);
    return false;
  }

  try {
    fs.writeFileSync ( fpath,json_str );
    return true;
  } catch (e)  {
    log.error ( 41,'cannot write file ' + fpath );
    console.error(e);
    return false;
  }

}

// ----------------------------------------------------------------------------


function copyFile ( old_path,new_path )  {
  try {
    if (_is_windows)
      fs.unlinkSync ( new_path );
  } catch (e) {}
  try {
//    fs.renameSync ( old_path,new_path );
    fs.copySync ( old_path,new_path );
    return true;
  } catch (e)  {
    log.error ( 50,'cannot copy file ' + old_path + ' to ' + new_path );
    console.error(e);
    return false;
  }
}


function moveFile ( old_path,new_path )  {
  // this function should be used in asynchronous code; use in synchronous code
  // must be limited only when source and destination are known to be in
  // the same partition
  try {
    if (_is_windows && fileExists(new_path))
      fs.unlinkSync ( new_path );
  } catch (e) {
    log.error ( 60,'cannot remove file ' + new_path );
    log.error ( 60,'error: ' + JSON.stringify(e) );
    console.error(e);
  }
  try {
    fs.moveSync ( old_path,new_path,{'overwrite':true} );
//    fs.renameSync ( old_path,new_path );
    return true;
  } catch (e)  {
    let old_exist = '(non-existing)';
    let new_exist = '(non-existing)';
    if (fileExists(old_path))  old_exist = '(existing)';
    if (fileExists(new_path))  new_exist = '(existing)';
    log.error ( 61,'cannot move ' + old_exist + ' file ' + old_path +
                   ' to ' + new_exist + ' ' + new_path );
    log.error ( 61,'error: ' + JSON.stringify(e) );
    return false;
  }
}


function copyDirAsync ( old_path,new_path,overwrite_bool,callback_func )  {
// if old_path is a directory, it will copy all its content but not the directory
// itself
  fs.copy ( old_path,new_path,{
    'overwrite'          : overwrite_bool,
    'preserveTimestamps' : true,
    'dereference'        : true
  }, callback_func );
}

function mkDir ( dirPath )  {
  try {
    fs.mkdirSync ( dirPath );
    return true;
  } catch (e)  {
    log.error ( 70,'cannot create directory ' + dirPath + ' error: ' + JSON.stringify(e) );
    return false;
  }
}

function mkDir_check ( dirPath )  {
// attempts to create directory and returns:
//     0 : if directory was created 
//     1 : if directory already existed
//    -1 : in case of error 
  try {
    // this goes first in order to fix the result in concurrent contexts
    fs.mkdirSync ( dirPath );
    return 0;
  } catch (e)  {
    if (dirExists(dirPath))
      return 1;
    log.error ( 80,'cannot create directory ' + dirPath + ' error: ' + JSON.stringify(e) );
    return -1;
  }
}


function mkDir_anchor ( dirPath )  {
  // same as mkDir but with 'anchoring', which is writing a useless file with
  // only purpose to prevent deleting an empty directory when packing with
  // archivers such as zip, and subsequently loosing it during exchange
  // between FE and NCs
  try {
    if (!dirExists(dirPath))
      fs.mkdirSync ( dirPath );
    fs.writeFileSync ( path.join(dirPath,'__anchor__'),'anchor' );
    return true;
  } catch (e)  {
    log.error ( 90,'cannot create directory or write anchor ' + dirPath +
                  ' error: ' + JSON.stringify(e) );
    return false;
  }
}


function mkPath ( dirPath )  {
  try {
    if (!fs.existsSync(dirPath))
      fs.mkdirSync ( dirPath, { recursive: true } );
    return true;
  } catch (e)  {
    log.error ( 100,'cannot create directory or write anchor ' + dirPath +
                    ' error: ' + JSON.stringify(e) );
    return false;
  }
}


function removePathAsync ( dir_path )  {
let rc   = true;
let stat = fileExists(dir_path);

  if (stat)  {
    try {
      if (stat.isSymbolicLink())  {
        fs.unlinkSync ( dir_path );
      } else  {
        let mod  = '_' + performance.now()
        let dir_path_tmp = dir_path + '_' + mod;
        let ntry = 0;
        while (fileExists(dir_path_tmp) && (ntry<100)) {
          ntry++;
          dir_path_tmp = dir_path + '_' + mod + '-' + ntry;
        }
        if (ntry>=100)  {
          log.error ( 110,'cannot remove directory ' + dir_path +
                          ' error: ' + JSON.stringify(e) );
          rc = false;
        } else  {
          fs.renameSync ( dir_path,dir_path_tmp );
          fs.rm ( dir_path_tmp, { recursive: true, force: true }, function(err){
            if (err)
              log.error ( 111,'errors removing directory ' + dir_path +
                              ' error: ' + err.message );
          });
        }
      }
    } catch (e)  {
      log.error ( 113,'cannot remove directory ' + dir_path +
                    ' error: ' + e.message );
      rc = false;
    }
  }

  return rc;  // false if there were errors

}


function removePath ( dir_path )  {
let rc   = true;
let stat = fileExists(dir_path);

  if (stat && stat.isSymbolicLink())  {
    fs.unlinkSync ( dir_path );
  } else if (stat)  {

    if (fs.existsSync(dir_path)) {
      fs.rmSync ( dir_path, { recursive: true, force: true });
    } else {
      log.error ( 9,'cannot remove directory ' + dir_path +
                    ' error: ' + JSON.stringify(e) );
      rc = false;
    }

  //   fs.readdirSync(dir_path).forEach(function(file,index){
  //     let curPath = path.join ( dir_path,file );
  //     let curstat = fileExists ( curPath );
  //     if (!curstat)  {
  //       log.error ( 82,'cannot stat path ' + curPath );
  //       rc = false;
  //     } else if (curstat.isDirectory()) { // recurse
  //       removePath ( curPath );
  //     } else { // delete file
  //       try {
  //         fs.unlinkSync ( curPath );
  //       } catch (e)  {
  //         log.error ( 83,'cannot remove file ' + curPath +
  //                        ' error: ' + JSON.stringify(e) );
  //         rc = false;
  //       }
  //     }
  //   });
  //   try {
  //     fs.rmdirSync ( dir_path );
  //   } catch (e)  {
  //     log.error ( 9,'cannot remove directory ' + dir_path +
  //                   ' error: ' + JSON.stringify(e) );
  //     rc = false;
  //   }
  }

  return rc;  // false if there were errors

}


function moveDir ( old_path,new_path,overwrite_bool )  {
  // uses sync mode, which is Ok for source/destinations being on the same
  // file systems; use not-synced version when moving across devices
  try {
    if (_is_windows && overwrite_bool && fileExists(new_path))
      removePathAsync ( new_path );
  } catch (e) {
    log.error ( 120,'cannot remove directory ' + new_path );
    log.error ( 120,'error: ' + JSON.stringify(e) );
    console.error(e);
  }
  try {
    fs.moveSync ( old_path,new_path,{'overwrite':overwrite_bool} );
    return true;
  } catch (e)  {
    let old_exist = '(non-existing)';
    let new_exist = '(non-existing)';
    if (fileExists(old_path))  old_exist = '(existing)';
    if (fileExists(new_path))  new_exist = '(existing)';
    log.error ( 121,'cannot move ' + old_exist + ' directory ' + old_path +
                   ' to ' + new_exist + ' ' + new_path );
    log.error ( 121,'error: ' + JSON.stringify(e) );
    console.error(e);
    return false;
  }
}

function moveDirAsync ( old_path,new_path,overwrite_bool,callback_func )  {
  try {
    if (_is_windows && overwrite_bool && fileExists(new_path))
      removePathAsync ( new_path );
  } catch (e) {
    log.error ( 130,'cannot remove directory ' + new_path );
    log.error ( 130,'error: ' + JSON.stringify(e) );
    console.error(e);
  }
  fs.move ( old_path,new_path,{'overwrite':overwrite_bool},function(err){
    if (err)  {
      let old_exist = '(non-existing)';
      let new_exist = '(non-existing)';
      if (fileExists(old_path))  old_exist = '(existing)';
      if (fileExists(new_path))  new_exist = '(existing)';
      log.error ( 131,'cannot move ' + old_exist + ' directory ' + old_path +
                     ' to ' + new_exist + ' ' + new_path );
      log.error ( 131,'error: ' + JSON.stringify(err) );
      console.error(err);
    }
    callback_func(err);
  });
}

function cleanDir ( dir_path,exclude=[] ) {
  // removes everything in the directory, but does not remove it
  let rc = true;
  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      if (!exclude.includes(file))  {
        let curPath = path.join ( dir_path,file );
        let curstat = fileExists ( curPath );
        if (!curstat)  {
          log.error ( 140,'cannot stat path ' + curPath );
          rc = false;
        } else if (curstat.isDirectory()) { // recurse
          removePathAsync ( curPath );
        } else { // delete file
          try {
            fs.unlinkSync ( curPath );
          } catch (e)  {
            log.error ( 141,'cannot remove file ' + curPath +
                            ' error: ' + JSON.stringify(e) );
            rc = false;
          }
        }
      }
    });
  }
  return rc;  // false if there were errors
}


function cleanDirExt ( dir_path,fext )  {
  // removes all files with given extension recursively in the directory,
  // but does not remove any directories, even if they are empty
  let rc = true;
  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      let curPath = path.join ( dir_path,file );
      let curstat = fileExists ( curPath );
      if (!curstat)  {
        log.error ( 150,'cannot stat path ' + curPath );
        rc = false;
      } else if (curstat.isDirectory()) { // recurse
        cleanDirExt ( curPath,fext );
      } else if (curPath.endsWith(fext)) { // delete file
        try {
          fs.unlinkSync ( curPath );
        } catch (e)  {
          log.error ( 151,'cannot remove file ' + curPath +
                          ' error: ' + JSON.stringify(e) );
          rc = false;
        }
      }
    });
  }
  return rc;  // false if there were errors
}


function removeSymLinks ( dir_path )  {
// removes all symbolic links recursively in the directory
  let rc = true;
  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      let curPath = path.join ( dir_path,file );
      let curstat = fileExists ( curPath );
      if (!curstat)  {
        log.error ( 160,'cannot stat path ' + curPath );
        rc = false;
      } else if (curstat.isDirectory()) { // recurse
        removeSymLinks ( curPath );
      } else if (curstat.isSymbolicLink())
        try {
          let fpath = fs.readlinkSync( curPath );
          fs.unlinkSync ( curPath );
          if (fs.existsSync(fpath))
            fs.copyFileSync ( fpath, curPath );
        } catch (e)  {
          log.error ( 161,'cannot remove symlink ' + curPath +
                          ' error: ' + JSON.stringify(e) );
          rc = false;
        }
    });
  }
  return rc;  // false if there were errors
}


function getDirectorySize ( dir_path )  {
  try {
    let size = 0.0;
    if (fileExists(dir_path))  {
      fs.readdirSync(dir_path).forEach(function(file,index){
        let curPath = path.join ( dir_path,file );
        let curstat = fileExists ( curPath );
        if (curstat)  {
          if (curstat.isDirectory())  { // recurse
            size += getDirectorySize ( curPath );
          } else if (!curstat.isSymbolicLink())  {
            size += curstat['size'];
          }
        }
      });
    }
    return size;
  } catch (e)  {
    log.error ( 170,'error scanning directory ' + dir_path +
                    ' error: ' + JSON.stringify(e) );
    return 0.0;
  }
}


function searchTree ( dir_path,filename,matchKey ) {
// recursively searches directory and returns list full paths to files with given
// name, if found, or empty list.
//  matchKey = 0 :   exact match
//             1 :   match 'filename' as leading part of file name
  let filepaths = [];
  try {
    if (fileExists(dir_path))  {
      fs.readdirSync(dir_path).forEach(function(file,index){
        let curPath = path.join ( dir_path,file );
        let curstat = fileExists ( curPath );
        if (curstat && curstat.isDirectory()) { // recurse
          filepaths = filepaths.concat ( searchTree(curPath,filename,matchKey) );
        } else if (((matchKey==0) && (file==filename)) ||
                   ((matchKey==1) && (file.startsWith(filename)))) {
          filepaths.push ( curPath );
        }
      });
    }
  } catch (e)  {
    log.error ( 180,'error scanning directory ' + dir_path +
                   ' error: ' + JSON.stringify(e) );
  }
  return filepaths;
}


/*
function walk(dir, callback) {
	fs.readdir(dir, function(err, files) {
		if (err) throw err;
		files.forEach(function(file) {
			let filepath = path.join(dir, file);
			fs.stat(filepath, function(err,stats) {
				if (stats.isDirectory()) {
					walk(filepath, callback);
				} else if (stats.isFile()) {
					callback(filepath, stats);
				}
			});
		});
	});
}
*/


function removeFiles ( dir_path,extList ) {
let rc = true;

  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      let dlt = false;
      let fl  = file.toLowerCase();
      for (let i=0;(i<extList.length) && (!dlt);i++)
        dlt = fl.endsWith(extList[i]);
      if (dlt)  {
        let curPath = path.join ( dir_path,file );
        let curstat = fileExists ( curPath );
        if (!curstat)  {
          log.error ( 190,'cannot stat path ' + curPath );
          rc = false;
        } else if (!curstat.isDirectory())  {
          // delete file
          try {
            fs.unlinkSync ( curPath );
          } catch (e)  {
            log.error ( 191,'cannot remove file ' + curPath +
                            ' error: ' + JSON.stringify(e) );
            rc = false;
          }
        }
      }
    });
  }

  return rc;  // false if there were errors

}


// ===========================================================================

// synchronous version, to be used only to kill previous node instances at
// startup
function killProcess ( pid )  {
  if (pid)  {
    try {
      if (_is_windows)  {
        child_process.execSync ( 'taskkill /PID ' + pid + ' /T /F' );
      } else  {
        child_process.execSync ( 'kill -9 ' + pid );
      }
    } catch (e)  {
      log.warning ( 1,'cannot kill process pid='+pid );
    }
  }
}

// ===========================================================================

function writeJobReportMessage ( jobDirPath, message, updating_bool )  {
let fpath = path.join ( jobDirPath,task_t.jobReportDirName,
                                   task_t.jobReportHTMLName );
let html  = '<!DOCTYPE html>\n<html><link rel="stylesheet" type="text/css" ' +
                        'href="jsrview/css/jsrview.css">';

  if (updating_bool)
    html += '<script>setTimeout(function(){window.location=window.location;},1000);' +
            '</script>';

  writeString ( fpath,html + '<body class="main-page">' + message + '</body></html>' );

}


// ===========================================================================

const signal_file_name = 'signal';  // signal file of job termination status

function jobSignalExists ( jobDir ) {
  return fileExists ( path.join(jobDir,signal_file_name) );
}

function removeJobSignal ( jobDir ) {
  removeFile ( path.join(jobDir,signal_file_name) );
}

function writeJobSignal ( jobDir,signal_name,signal_message,signal_code )  {
  let line = signal_name;
  if (signal_message.length>0)
    line += ' ' + signal_message;
  writeString ( path.join(jobDir,signal_file_name),line + '\n' + signal_code );
}

function getJobSignalCode ( jobDir )  {
let code   = 0;
let signal = readString ( path.join(jobDir,signal_file_name) );
  if (signal)  {
    let sigl = signal.split('\n');
    if (sigl.length>1)  code = parseInt(sigl[sigl.length-1]);
                  else  code = 300;
  } else
    code = 301;
  return code;
}


// ===========================================================================


function clearRVAPIreport ( jobDirPath,taskFileName )  {
let fpath = path.join ( jobDirPath,task_t.jobReportDirName,taskFileName );
  writeString ( fpath,'TASK_STAMP:::1:::1:::RELOAD;;;\n' );
}


function getMIMEType ( path )  {
let mimeType = '';

  // mime types from
  //    https://www.sitepoint.com/web-foundations/mime-types-complete-list/
  switch (path.split('.').pop().toLowerCase())  {
    case 'html'  : mimeType = 'text/html;charset=UTF-8';         break;
    case 'js'    : mimeType = 'application/javascript';          break;
    case 'css'   : mimeType = 'text/css';                        break;
    case 'jpg'   :
    case 'jpeg'  : mimeType = 'image/jpeg';                      break;
    case 'png'   : mimeType = 'image/png';                       break;
    case 'svg'   : mimeType = 'image/svg+xml';                   break;
    case 'json'  : mimeType = 'application/json;charset=UTF-8';  break;
    case 'pdb'   :
    case 'map'   :
    case 'ccp4'  : //mimeType = 'application/x-binary';     break;
    case 'mtz'   : mimeType = 'application/octet-stream';        break;
    case 'pdf'   : mimeType = 'application/pdf';                 break;
    case 'table' :
    case 'loggraph_data' :
    case 'graph_data'    :
    case 'txt'   :
    case 'tsk'   : mimeType = 'text/plain;charset=UTF-8';        break;
    case 'wasm'  : mimeType = 'application/wasm';                break;
    default      : mimeType = 'application/octet-stream';
  }

  return mimeType;

}


function capData ( data,n )  {
  if (data.length>n)  {
    let dstr  = data.toString();
    let sdata = '[[[[]]]]\n' +
                dstr.substring(0,dstr.indexOf('\n',n/2))  +
  '\n\n' +
  ' ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n' +
  ' ************************************************************************\n' +
  '            C  O  N  T  E  N  T       R  E  M  O  V  E  D \n' +
  ' ************************************************************************\n' +
  ' ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n' +
  '\n' +
                dstr.substr(dstr.indexOf('\n',dstr.length-n/2));
    return sdata;
  } else {
    return data;
  }
}


function send_file ( fpath,server_response,mimeType,deleteOnDone,capSize,
                     persistance,nofile_callback,onDone_callback=null )  {

  fs.stat ( fpath,function(err,stats){

    if (stats && stats.isFile())  {
      if (err)  {

        if (persistance>0)  {
          setTimeout ( function(){
            send_file ( fpath,server_response,mimeType,deleteOnDone,capSize,
                        persistance-1,nofile_callback,onDone_callback );
          },50 );
        } else  {
          let rc = true;
          if (nofile_callback)
            rc = nofile_callback ( fpath,mimeType,deleteOnDone,capSize );
          else if (deleteOnDone)
            removeFile ( fpath );
          if (onDone_callback)
            onDone_callback ( rc );
          if (rc)  {
            log.error ( 200,'Read file errors, file = ' + fpath );
            log.error ( 200,'Error: ' + err );
            server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
            server_response.end ( '<p><b>[05-0006] FILE READ ERRORS [' + fpath + ']</b></p>' );
          }
        }

      } else  {

        server_response.writeHeader ( 200, {
            'Content-Type'      : mimeType,
            //'Content-Length'    : stats.size
            //'Transfer-Encoding' : 'chunked'
            //'Content-Encoding' : 'gzip'
            //'Vary'           : 'Accept-Encoding'
            //'Content-Disposition' : 'inline'
        });

        let fReadStream = fs.createReadStream ( fpath );
        fReadStream.on ( 'end',function(){
          server_response.end();
          if (deleteOnDone)
            removeFile ( fpath );
          if (onDone_callback)
            onDone_callback(false);
        });

        fReadStream.on ( 'error',function(e){
          log.error ( 201,'Read file errors, file = ' + fpath );
          console.error ( e.stack || e );
          // causes errors of repeat send of the header, so commented out
          // server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
          server_response.end ( '<p><b>[05-0007] FILE READ ERRORS</b></p>' );
          if (deleteOnDone)
            removeFile ( fpath );
          if (onDone_callback)
            onDone_callback(true);
        });

        if ((capSize<=0) || (stats.size<=capSize))  {  // send whole file

          fReadStream.pipe ( server_response );

        } else  {  // send capped file

          server_response.write ( '[[[[]]]]\n' );

          let inlet =
            '\n\n' +
            ' ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n' +
            ' ************************************************************************\n' +
            '            C  O  N  T  E  N  T       R  E  M  O  V  E  D \n' +
            ' ************************************************************************\n' +
            ' ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n' +
            '\n';

          let ncut1 = (capSize - inlet.length)/2;
          let ncut2 = stats.size - ncut1;
          let nsent = 0;
          fReadStream.on ( 'data',function(chunk){
            let key = 0;  // do not write by default
            let ns  = nsent + chunk.length;
            let s;
            if (nsent<ncut1)  {
              if (ns<ncut1)
                key = 1;  // write the whole chunk
              else if (ns>ncut1)  {
                key = 2;  // write modified data from s
                let cstr = chunk.toString();
                s   = cstr.substring(0,cstr.indexOf('\n',cstr.length-(ns-ncut1))) + inlet;
                if (ns>ncut2)  {
                  cstr = cstr.slice ( ncut2-ns );
                  s   += cstr.substr(cstr.indexOf('\n'));
                }
              }
            } else if (nsent>=ncut1)  {
              if (ns>ncut2)  {
                key = 2;
                let cstr = chunk.toString().slice(ncut2-ns);
                s   = cstr.substr(cstr.indexOf('\n'));
              }
            } else  {
              key = 1;
            }

            if (key==1)  {
              if (!server_response.write(chunk))
                fReadStream.pause();
            } else if (key==2)  {
              if (!server_response.write(s))
                fReadStream.pause();
            }
            nsent = ns;

          });

          server_response.on('drain',function(){
            fReadStream.resume();
          });

        }

      }

    } else  {
      // no file
      server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
      server_response.end ( '<p><b>[05-0008] FILE NOT FOUND</b></p>' );
    }

  });

}

/*
function checkInternet ( url,callback_func ) {
  dns.lookup ( url,function(err) {
    callback_func ( !(err && (err.code=='ENOTFOUND')) );
  });
}
*/

function spawn ( exeName,args,options )  {
  if (_is_windows)  {  // MS Windows
    return  child_process.spawn ( 'cmd',['/s','/c',exeName].concat(args),
                                  options );
  } else  { // Mac, Linux
    return  child_process.spawn ( exeName,args,options );
  }
}


function padDigits ( number,digits ) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}


// ==========================================================================
// export for use in node
module.exports.fileExists            = fileExists;
module.exports.isSymbolicLink        = isSymbolicLink;
module.exports.dirExists             = dirExists;
module.exports.fileSize              = fileSize;
module.exports.removeFile            = removeFile;
module.exports.makeSymLink           = makeSymLink;
module.exports.readString            = readString;
module.exports.readObject            = readObject;
module.exports.readClass             = readClass;
module.exports.writeString           = writeString;
module.exports.appendString          = appendString;
module.exports.writeObject           = writeObject;
module.exports.copyFile              = copyFile;
module.exports.moveFile              = moveFile;
module.exports.moveDir               = moveDir;
module.exports.moveDirAsync          = moveDirAsync;
module.exports.copyDirAsync          = copyDirAsync;
module.exports.mkDir                 = mkDir;
module.exports.mkDir_check           = mkDir_check;
module.exports.mkDir_anchor          = mkDir_anchor;
module.exports.mkPath                = mkPath;
module.exports.cleanDir              = cleanDir;
module.exports.cleanDirExt           = cleanDirExt;
module.exports.removeSymLinks        = removeSymLinks;
module.exports.removePathAsync       = removePathAsync;
module.exports.removePath            = removePath;
module.exports.getDirectorySize      = getDirectorySize;
module.exports.searchTree            = searchTree;
module.exports.removeFiles           = removeFiles;
module.exports.writeJobReportMessage = writeJobReportMessage;
module.exports.jobSignalExists       = jobSignalExists;
module.exports.removeJobSignal       = removeJobSignal;
module.exports.writeJobSignal        = writeJobSignal;
module.exports.getJobSignalCode      = getJobSignalCode;
module.exports.clearRVAPIreport      = clearRVAPIreport;
module.exports.getMIMEType           = getMIMEType;
module.exports.capData               = capData;
module.exports.send_file             = send_file;
module.exports.killProcess           = killProcess;
module.exports.spawn                 = spawn;
module.exports.padDigits             = padDigits;
