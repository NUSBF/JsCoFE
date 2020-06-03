
/*
 *  =================================================================
 *
 *    29.05.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

var fs            = require('fs-extra');
var path          = require('path');
var child_process = require('child_process');

var class_map     = require('./server.class_map');
var task_t        = require('../js-common/tasks/common.tasks.template');
var com_utils     = require('../js-common/common.utils');

//  prepare log
var log = require('./server.log').newLog(14);

var _is_windows = /^win/.test(process.platform);

// ==========================================================================

function fileExists ( path )  {
  try {
    return fs.statSync(path);
  } catch (e)  {
    return null;
  }
}


function dirExists ( path )  {
  try {
    var stat = fs.statSync(path);
    if (stat)
      return stat.isDirectory();
    return null;
  } catch (e)  {
    return null;
  }
}


function fileSize ( path ) {
  try {
    return fs.statSync(path)['size'];
  } catch (e)  {
    return 0;
  }
}


function removeFile ( path ) {
  try {
    fs.unlinkSync ( path );
    return true;
  } catch (e)  {
    return false;
  }
}


function readString ( path )  {
  try {
    return fs.readFileSync(path).toString();
  } catch (e)  {
    return null;
  }
}


function readObject ( path ) {
  try {
    return JSON.parse ( fs.readFileSync(path).toString() );
  } catch (e)  {
    return null;
  }
}


function readClass ( path ) {  // same as object but with class functions
  try {
    return class_map.getClassInstance ( fs.readFileSync(path).toString() );
  } catch (e)  {
    return null;
  }
}

/*
function writeString ( path,data_string )  {

  var backup = null;
  try {
    if (fs.statSync(path))  {
      backup = path + '~';
      fs.renameSync ( path,backup );
    }
  } catch (e) {
    log.error ( 12,'cannot make backup copy at file write at ' + path );
    return false;
  }

  var ok = true;
  try {
    fs.writeFileSync ( path,data_string );
    //return true;
  } catch (e)  {
    log.error ( 1,'cannot write file ' + path );
    ok = false;
    //return false;
  }

  try {
    if (ok && backup)
      fs.unlinkSync ( backup );
    else if (backup)  {  // rollback
      if (fs.statSync(path))
        fs.unlinkSync ( path );
      fs.renameSync ( backup,path );
    }
  } catch (e) {}

  return ok;

}
*/

function writeString ( path,data_string )  {
  try {
    fs.writeFileSync ( path,data_string );
    return true;
  } catch (e)  {
    log.error ( 1,'cannot write file ' + path );
    console.error(e);
    return false;
  }
}


function appendString ( path,data_string )  {
  try {
    fs.appendFileSync ( path,data_string );
    return true;
  } catch (e)  {
    log.error ( 2,'cannot write file ' + path );
    console.error(e);
    return false;
  }
}

/*
function writeObject ( path,dataObject )  {

  var json_str = '';
  try {
    json_str = JSON.stringify ( dataObject,null,2 );
  } catch (e) {
    log.error ( 31,'attempt to write corrupt data object at ' + path );
    return false;
  }

  var backup = null;
  try {
    if (fs.statSync(path))  {
      backup = path + '~';
      fs.renameSync ( path,backup );
    }
  } catch (e) {
    log.error ( 32,'cannot make backup copy at file write at ' + path );
    return false;
  }

  var ok = true;
  try {
    fs.writeFileSync ( path,json_str );
    //return true;
  } catch (e)  {
    log.error ( 3,'cannot write file ' + path );
    ok = false;
    //return false;
  }

  try {
    if (ok && backup)
      fs.unlinkSync ( backup );
    else if (backup)  {  // rollback
      if (fs.statSync(path))
        fs.unlinkSync ( path );
      fs.renameSync ( backup,path );
    }
  } catch (e) {}

  return ok;

}
*/

function writeObject ( path,dataObject )  {

  var json_str = '';
  try {
    json_str = JSON.stringify ( dataObject,null,2 );
  } catch (e) {
    log.error ( 31,'attempt to write corrupt data object at ' + path );
    console.error(e);
    return false;
  }

  try {
    fs.writeFileSync ( path,json_str );
    return true;
  } catch (e)  {
    log.error ( 3,'cannot write file ' + path );
    console.error(e);
    return false;
  }

}


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
    log.error ( 4,'cannot copy file ' + old_path + ' to ' + new_path );
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
    log.error ( 40,'cannot remove file ' + new_path );
    log.error ( 40,'error: ' + JSON.stringify(e) );
    console.error(e);
  }
  try {
    fs.moveSync ( old_path,new_path,{'overwrite':true} );
//    fs.renameSync ( old_path,new_path );
    return true;
  } catch (e)  {
    var old_exist = '(non-existing)';
    var new_exist = '(non-existing)';
    if (fileExists(old_path))  old_exist = '(existing)';
    if (fileExists(new_path))  new_exist = '(existing)';
    log.error ( 41,'cannot move ' + old_exist + ' file ' + old_path +
                   ' to ' + new_exist + ' ' + new_path );
    log.error ( 41,'error: ' + JSON.stringify(e) );
    return false;
  }
}


function moveDir ( old_path,new_path,overwrite_bool )  {
  // uses sync mode, which is Ok for source/destinations being on the same
  // file systems; use not-synced version when moving across devices
  try {
    if (_is_windows && overwrite_bool && fileExists(new_path))
      fs.removePath ( new_path );
  } catch (e) {
    log.error ( 50,'cannot remove directory ' + new_path );
    log.error ( 50,'error: ' + JSON.stringify(e) );
    console.error(e);
  }
  try {
    fs.moveSync ( old_path,new_path,{'overwrite':overwrite_bool} );
    return true;
  } catch (e)  {
    var old_exist = '(non-existing)';
    var new_exist = '(non-existing)';
    if (fileExists(old_path))  old_exist = '(existing)';
    if (fileExists(new_path))  new_exist = '(existing)';
    log.error ( 51,'cannot move ' + old_exist + ' directory ' + old_path +
                   ' to ' + new_exist + ' ' + new_path );
    log.error ( 51,'error: ' + JSON.stringify(e) );
    console.error(e);
    return false;
  }
}


function mkDir ( dirPath )  {
  try {
    fs.mkdirSync ( dirPath );
    return true;
  } catch (e)  {
    log.error ( 6,'cannot create directory ' + dirPath );
    return false;
  }
}


function mkDir_anchor ( dirPath )  {
  // same as mkDir but with 'anchoring', which is writing a useless file with
  // only purpose to prevent deleting an empty directory when packing with
  // archivers such as zip, and subsequently loosing it during exchange
  // between FE and NCs
  try {
    fs.mkdirSync     ( dirPath );
    fs.writeFileSync ( path.join(dirPath,'__anchor__'),'anchor' );
    return true;
  } catch (e)  {
    log.error ( 7,'cannot create directory ' + dirPath );
    return false;
  }
}


function removePath ( dir_path ) {
  var rc = true;

  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      var curPath = path.join ( dir_path,file );
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        removePath ( curPath );
      } else { // delete file
        try {
          fs.unlinkSync ( curPath );
        } catch (e)  {
          log.error ( 82,'cannot remove file ' + curPath );
          rc = false;
        }
      }
    });
    try {
      fs.rmdirSync ( dir_path );
    } catch (e)  {
      log.error ( 9,'cannot remove directory ' + dir_path );
      rc = false;
    }
  }

  return rc;  // false if there were errors

}


function cleanDir ( dir_path ) {
  // removes everything in the directory, but doe not remove it
  var rc = true;
  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      var curPath = path.join ( dir_path,file );
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        removePath ( curPath );
      } else { // delete file
        try {
          fs.unlinkSync ( curPath );
        } catch (e)  {
          log.error ( 81,'cannot remove file ' + curPath );
          rc = false;
        }
      }
    });
  }
  return rc;  // false if there were errors
}


function getDirectorySize ( dir_path )  {
  var size = 0.0;
  try {
    if (fileExists(dir_path))  {
      fs.readdirSync(dir_path).forEach(function(file,index){
        var curPath = path.join ( dir_path,file );
        var lstat   = fs.lstatSync(curPath);
        if (lstat.isDirectory()) { // recurse
          size += getDirectorySize ( curPath );
        } else {
          size += lstat['size'];
        }
      });
    }
  } catch (e)  {
    log.error ( 10,'error scanning directory ' + dir_path );
  }
  return size;
}


function removeFiles ( dir_path,extList ) {
  var rc = true;

  if (fileExists(dir_path))  {
    fs.readdirSync(dir_path).forEach(function(file,index){
      var dlt = false;
      var fl  = file.toLowerCase();
      for (var i=0;(i<extList.length) && (!dlt);i++)
        dlt = fl.endsWith(extList[i]);
      if (dlt)  {
        var curPath = path.join ( dir_path,file );
        if (!fs.lstatSync(curPath).isDirectory())  {
          // delete file
          try {
            fs.unlinkSync ( curPath );
          } catch (e)  {
            log.error ( 11,'cannot remove file ' + curPath );
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
var fpath = path.join ( jobDirPath,task_t.jobReportDirName,
                                   task_t.jobReportHTMLName );
var html  = '<html><link rel="stylesheet" type="text/css" ' +
                        'href="jsrview/css/jsrview.css">';

  if (updating_bool)
    html += '<script>setTimeout(function(){window.location=window.location;},1000);' +
            '</script>';

  writeString ( fpath,html + '<body class="main-page">' + message + '</body></html>' );

}


// ===========================================================================

var signal_file_name = 'signal';  // signal file of job termination status

function jobSignalExists ( jobDir ) {
  return fileExists ( path.join(jobDir,signal_file_name) );
}

function removeJobSignal ( jobDir ) {
  removeFile ( path.join(jobDir,signal_file_name) );
}

function writeJobSignal ( jobDir,signal_name,signal_message,signal_code )  {
  var line = signal_name;
  if (signal_message.length>0)
    line += ' ' + signal_message;
  writeString ( path.join(jobDir,signal_file_name),line + '\n' + signal_code );
}

function getJobSignalCode ( jobDir )  {
var code   = 0;
var signal = readString ( path.join(jobDir,signal_file_name) );
  if (signal)  {
    var sigl = signal.split('\n');
    if (sigl.length>1)  code = parseInt(sigl[1]);
                  else  code = 300;
  } else
    code = 301;
  return code;
}


// ===========================================================================


function clearRVAPIreport ( jobDirPath,taskFileName )  {
var fpath = path.join ( jobDirPath,task_t.jobReportDirName,taskFileName );
  writeString ( fpath,'TASK_STAMP:::1:::1:::RELOAD;;;\n' );
}


function getMIMEType ( path )  {
var mimeType = '';

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
    var dstr  = data.toString();
    var sdata = '[[[[]]]]\n' +
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
                     persistance,nofile_callback )  {

  fs.stat ( fpath,function(err,stats){

    if (err)  {

      if (persistance>0)  {
        setTimeout ( function(){
          send_file ( fpath,server_response,mimeType,deleteOnDone,capSize,
                      persistance-1,nofile_callback );
        },50 );
      } else  {
        var rc = true;
        if (nofile_callback)
          rc = nofile_callback ( fpath,mimeType,deleteOnDone,capSize );
        if (rc)  {
          log.error ( 12,'Read file errors, file = ' + fpath );
          log.error ( 12,'Error: ' + err );
          server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
          server_response.end ( '<p><b>[05-0006] FILE NOT FOUND [' + fpath + ']</b></p>' );
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

      var fReadStream = fs.createReadStream ( fpath );
      fReadStream.on ( 'end',function(){
        server_response.end();
        if (deleteOnDone)
          removeFile ( fpath );
      });

      if ((capSize<=0) || (stats.size<=capSize))  {  // send whole file

        fReadStream.on ( 'error',function(e){
          log.error ( 13,'Read file errors, file = ' + fpath );
          console.error ( e.stack || e );
          server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
          server_response.end ( '<p><b>[05-0007] FILE READ ERRORS</b></p>' );
        });
        fReadStream.pipe ( server_response );

      } else  {  // send capped file

        server_response.write ( '[[[[]]]]\n' );

        var inlet =
          '\n\n' +
          ' ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n' +
          ' ************************************************************************\n' +
          '            C  O  N  T  E  N  T       R  E  M  O  V  E  D \n' +
          ' ************************************************************************\n' +
          ' ||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||\n' +
          '\n';

        var ncut1 = (capSize - inlet.length)/2;
        var ncut2 = stats.size - ncut1;
        var nsent = 0;
        fReadStream.on ( 'data',function(chunk){
          var key = 0;  // do not write by default
          var ns  = nsent + chunk.length;
          var s;
          if (nsent<ncut1)  {
            if (ns<ncut1)
              key = 1;  // write the whole chunk
            else if (ns>ncut1)  {
              key = 2;  // write modified data from s
              var cstr = chunk.toString();
              s   = cstr.substring(0,cstr.indexOf('\n',cstr.length-(ns-ncut1))) + inlet;
              if (ns>ncut2)  {
                cstr = cstr.slice ( ncut2-ns );
                s   += cstr.substr(cstr.indexOf('\n'));
              }
            }
          } else if (nsent>=ncut1)  {
            if (ns>ncut2)  {
              key = 2;
              var cstr = chunk.toString().slice(ncut2-ns);
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

              /*
            } else  {
              fs.readFile ( fpath, function(err,data) {
                if (err)  {
                  log.error ( 8,'Read file errors, file = ' + fpath );
                  log.error ( 8,'Error: ' + err );
                  server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
                  server_response.end ( '<p><b>[05-0008] FILE NOT FOUND OR FILE READ ERRORS</b></p>' );
                } else  {
      //console.log ( "one-off " + stats.size + ' : ' + data.length );
                  server_response.writeHeader ( 200, {'Content-Type':mtype,'Content-Length':stats.size} );
                  server_response.end ( data );
                  if (deleteOnDone)
                    removeFile ( fpath );
                }
              });
            }

      /*
      fs.readFile ( fpath, function(err,data) {
        if (err)  {
          log.error ( 9,'Read file errors, file = ' + fpath );
          log.error ( 9,'Error: ' + err );
          server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
          server_response.end ( '<p><b>[05-0008] FILE NOT FOUND OR FILE READ ERRORS</b></p>' );
        } else  {
          server_response.writeHeader ( 200, {'Content-Type' : mimeType });
          server_response.end ( capData(data,capSize) );
          if (deleteOnDone)
            removeFile ( fpath );
        }
      });
      */

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

function spawn ( exeName,arguments,options )  {
  if (_is_windows)  {  // MS Windows
    return  child_process.spawn ( 'cmd',['/s','/c',exeName].concat(arguments),
                                  options );
  } else  { // Mac, Linux
    return  child_process.spawn ( exeName,arguments,options );
  }
}


function padDigits ( number,digits ) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}


// ==========================================================================
// export for use in node
module.exports.fileExists            = fileExists;
module.exports.dirExists             = dirExists;
module.exports.fileSize              = fileSize;
module.exports.removeFile            = removeFile;
module.exports.readString            = readString;
module.exports.readObject            = readObject;
module.exports.readClass             = readClass;
module.exports.writeString           = writeString;
module.exports.appendString          = appendString;
module.exports.writeObject           = writeObject;
module.exports.copyFile              = copyFile;
module.exports.moveFile              = moveFile;
module.exports.moveDir               = moveDir;
module.exports.mkDir                 = mkDir;
module.exports.mkDir_anchor          = mkDir_anchor;
module.exports.cleanDir              = cleanDir;
module.exports.removePath            = removePath;
module.exports.getDirectorySize      = getDirectorySize;
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
