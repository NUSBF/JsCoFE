
/*
 *  =================================================================
 *
 *    26.05.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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


// ==========================================================================

function fileExists ( path ) {
  try {
    return fs.statSync(path);
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


function readString ( path ) {
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


function writeString ( path,data_string )  {
  try {
    fs.writeFileSync ( path,data_string );
    return true;
  } catch (e)  {
    log.error ( 1,'cannot write file ' + path );
    return false;
  }
}


function appendString ( path,data_string )  {
  try {
    fs.appendFileSync ( path,data_string );
    return true;
  } catch (e)  {
    log.error ( 2,'cannot write file ' + path );
    return false;
  }
}


function writeObject ( path,dataObject )  {
  try {
    fs.writeFileSync ( path,JSON.stringify(dataObject) );
    return true;
  } catch (e)  {
    log.error ( 3,'cannot write file ' + path );
    return false;
  }
}


function moveFile ( old_path,new_path )  {
  try {
    fs.renameSync ( old_path,new_path );
    return true;
  } catch (e)  {
    log.error ( 4,'cannot move file ' + old_path + ' to ' + new_path );
    return false;
  }
}


function moveDir ( old_path,new_path,overwrite_bool )  {
  // uses sync mode, which is Ok for source/destinations being on the same
  // file systems; use not-synced version when moving across devices
  try {
    fs.moveSync  ( old_path,new_path,{'overwrite':overwrite_bool} );
    return true;
  } catch (e)  {
    log.error ( 5,'cannot move directory ' + old_path + ' to ' + new_path +
                  ' ' + JSON.stringify(e) );
    return false;
  }
}


function mkDir ( path )  {
  try {
    fs.mkdirSync ( path );
    return true;
  } catch (e)  {
    log.error ( 6,'cannot create directory ' + path );
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
          log.error ( 7,'cannot remove file ' + curPath );
          rc = false;
        }
      }
    });
    try {
      fs.rmdirSync ( dir_path );
    } catch (e)  {
      log.error ( 8,'cannot remove directory ' + dir_path );
      rc = false;
    }
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
    log.error ( 9,'error scanning directory ' + dir_path );
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
            log.error ( 10,'cannot remove file ' + curPath );
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
      if (/^win/.test(process.platform))  {
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
  if (updating_bool)  {
    writeString ( fpath,'<html><script>' +
      '  setTimeout(function(){window.location=window.location;},1000);' +
      '</script><body>' + message + '</body></html>' );
  } else  {
    writeString ( fpath,'<html><body>' + message + '</body></html>' );
  }
  /*
  fpath = path.join ( jobDirPath,task_t.jobReportDirName,
                                     task_t.jobReportTaskName );
  appendString ( fpath,'RELOAD;;;\n' );
  */

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
    case 'html'  : mimeType = 'text/html;charset=UTF-8';  break;
    case 'js'    : mimeType = 'application/javascript';   break;
    case 'css'   : mimeType = 'text/css';                 break;
    case 'jpg'   :
    case 'jpeg'  : mimeType = 'image/jpeg';               break;
    case 'png'   : mimeType = 'image/png';                break;
    case 'svg'   : mimeType = 'image/svg+xml';            break;
    case 'pdb'   :
    case 'map'   :
    case 'ccp4'  : //mimeType = 'application/x-binary';     break;
    case 'mtz'   : mimeType = 'application/octet-stream'; break;
    case 'pdf'   : mimeType = 'application/pdf';          break;
    case 'table' :
    case 'loggraph_data' :
    case 'graph_data'    :
    case 'txt'   :
    case 'tsk'   : mimeType = 'text/plain;charset=UTF-8'; break;
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


// ==========================================================================
// export for use in node
module.exports.fileExists            = fileExists;
module.exports.fileSize              = fileSize;
module.exports.removeFile            = removeFile;
module.exports.readString            = readString;
module.exports.readObject            = readObject;
module.exports.readClass             = readClass;
module.exports.writeString           = writeString;
module.exports.appendString          = appendString;
module.exports.writeObject           = writeObject;
module.exports.moveFile              = moveFile;
module.exports.moveDir               = moveDir;
module.exports.mkDir                 = mkDir;
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
module.exports.killProcess           = killProcess;
