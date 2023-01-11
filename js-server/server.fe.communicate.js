
/*
 *  ==========================================================================
 *
 *    16.06.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.communicate.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Communication Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  ==========================================================================
 *
 */

'use strict';

//  load system modules
const url     = require('url');
const fs      = require('fs-extra');
const path    = require('path');
const request = require('request');
const tmp     = require('tmp');

//  load application modules
const conf      = require('./server.configuration');
const utils     = require('./server.utils');
const anl       = require('./server.fe.analytics');
const user      = require('./server.fe.user');
const prj       = require('./server.fe.projects');
const rj        = require('./server.fe.run_job');
const ustats    = require('./server.fe.usagestats');
const cmd       = require('../js-common/common.commands');

//  prepare log
const log = require('./server.log').newLog(5);


// ==========================================================================

tmp.setGracefulCleanup();

// ==========================================================================

/*
var __malicious_ext = [
  '.exe', '.php', '.cgi', '.jsp', '.asp', '.pl'
];
*/

/*
var __malicious_ip_register  = {};
var __malicious_attempts_max = 100;

function __count_malicious_ip ( ip,count )  {
  if ((ip in __malicious_ip_register) ||
      (__malicious_ip_register[ip]>-__malicious_attempts_max)) {
    __malicious_ip_register[ip] += count;
    if (__malicious_ip_register[ip]>__malicious_attempts_max)
      log.standard ( 1,'ip address ' + ip + ' is deemed as malicious and will be ignored' );
  } else
    __malicious_ip_register[ip] = count;
}
*/

var __malicious_ip_register = {};

const __ccp4_lib = conf.CCP4DirName() + '/lib/';

function Communicate ( server_request )  {

  this.ncURL     = '';
  this.filePath  = '';
  this.fe_server = conf.getFEConfig();

  this.requester_ip =
        (server_request.headers['x-forwarded-for'] || '').split(',').pop() ||
        server_request.connection.remoteAddress ||
        server_request.socket.remoteAddress     ||
        server_request.connection.socket.remoteAddress;

  if ((this.fe_server.malicious_attempts_max>0) &&
      (this.requester_ip in __malicious_ip_register) &&
      (__malicious_ip_register[this.requester_ip] >
        this.fe_server.malicious_attempts_max)) {
    this.command = cmd.ignore;
    return;
  }

/*
  var ext = server_request.url.slice ( server_request.url.lastIndexOf('.') );
  if (__malicious_ext.indexOf(ext)>=0)  {
    this.command = cmd.ignore;
    return;
  }
*/

  // Parse the server request command
  var url_parse  = url.parse(server_request.url);
  var url_path   = url_parse.pathname.substr(1);
  this.command   = url_path.toLowerCase();
  this.search    = url_parse.search;
// console.log ( "requested " + server_request.url );
// console.log ( "parsed    " + JSON.stringify(url_parse) );

  if ((this.command=='') || (this.command==cmd.fe_command.cofe))  {
    this.filePath = this.fe_server.bootstrapHTML;
  } else  {
    try {
      this.filePath = decodeURI(url_path);
    } catch(e)  {
      this.filePath = '';
      log.error ( 20,'URI decoding error, URI path "' + url_path + '"' );
    }
  }

// if (server_request.url.indexOf('demo=')>=0)  {
//   console.log ( "params " + server_request.url );
//   // Output:
//   // params /?demo=a
//   // params /?demo=a
//   // params /?demo=/a/b/c/demo.ccp4cloud
// }
// console.log ( "filePath " + this.filePath );

  if (this.command.startsWith(cmd.fe_command.jobFinished))  {
    this.job_token = this.command.substr(cmd.fe_command.jobFinished.length);
    this.command   = cmd.fe_command.jobFinished;
  } else
    this.job_token = '';

  log.debug2 ( 1,"requested path " + this.filePath );
//console.log ( "requested path " + this.filePath );
  var ix = this.filePath.indexOf('jsrview');
  //if (ix<0)
  //  ix = this.filePath.indexOf('ccp4i2_support');
  if (ix>=0)  {  // request for jsrview library file, load it from js-lib
                 // REGARDLESS the actual path requested
    this.filePath = path.join ( 'js-lib',this.filePath.substr(ix) );
    log.debug2 ( 2,"calculated path " + this.filePath);
  }
  if (ix<0) {
    var rtag = cmd.__special_url_tag + '-fe/';
    ix = this.filePath.lastIndexOf(rtag);
// console.log ( 'rtag=' + rtag + ',  file=' + this.filePath + ', ix=' + ix );
    if (ix>=0)  {
      this.filePath = this.filePath.substr(ix+rtag.length);
      log.debug2 ( 4,"calculated path " + this.filePath);
    }
  }
  if (ix<0) {
    var utag = cmd.__special_url_tag + '/' + ustats.statsDirName + '/';
    ix = this.filePath.lastIndexOf(utag);
    if (ix>=0)  {
      this.filePath = ustats.getUsageReportFilePath ( this.filePath.substr(ix+utag.length) );
      log.debug2 ( 3,"calculated path " + this.filePath);
    }
  }
  if (ix<0) {
    ix = this.filePath.lastIndexOf(cmd.__special_fjsafe_tag);
    if (ix>=0)  {
      this.filePath = this.fe_server.getJobsSafePath() + '/' +
                      this.filePath.substr(ix+cmd.__special_fjsafe_tag.length);
      //console.log ( ' fpath=' + this.filePath );
      log.debug2 ( 3,"calculated path " + this.filePath);
    }
  }
  if (ix<0) {
    ix = this.filePath.lastIndexOf('__CCP4__');
    if (ix>=0)  {
      this.filePath = process.env.CCP4 + this.filePath.substr(ix+8);
      // console.log ( ' fpath=' + this.filePath );
      log.debug2 ( 3,"calculated path " + this.filePath);
    }
  }
  if (ix<0) {
    ix = this.filePath.lastIndexOf(__ccp4_lib);
    if (ix>=0)  {
      this.filePath = process.env.CCP4 + '/lib/' +
                      this.filePath.substr(ix+__ccp4_lib.length);
      // console.log ( ' fpath=' + this.filePath );
      log.debug2 ( 3,"calculated path " + this.filePath);
    }
  }
  if (ix<0) {
    ix = server_request.url.lastIndexOf('reqid=authorisation-');
    if (ix>=0)  {
      this.command = cmd.fe_command.authResponse;
    }
  }
  if (ix<0) {

    //if (this.filePath.startsWith(cmd.__special_url_tag))  { // special access to files not
    //                                             // supposed to be on http path

    var ix = this.filePath.lastIndexOf ( cmd.__special_url_tag );
    if (ix>=0)  {

      var flist     = this.filePath.slice(ix).split('/');
      var loginData = user.getLoginEntry ( flist[1] );

      if (loginData.login.length>0)  {  // login is valid

        // calculate path within job directory
        var localPath = '';
        for (var i=4;i<flist.length;i++)
          localPath = path.join ( localPath,flist[i] );

        // make full path for local (FE-based) file
        if (localPath.length>0)  // file in a job directory
          this.filePath = path.join ( prj.getJobDirPath(loginData,flist[2],flist[3]),
                                      localPath );
        else // file in a project directory
          this.filePath = path.join ( prj.getProjectDirPath(loginData,flist[2]),
                                      flist[3] );
        // console.log ( ' fp='+this.filePath );

        // now check whether the job is currently running, in which case the
        // requested file should be fetched from the respective number cruncher
        var jobEntry = rj.getEFJobEntry ( loginData,flist[2],flist[3] );
//      if (jobEntry && ((jobEntry.nc_type=='ordinary') ||
//                       (conf.isLocalFE() &&
//                        (!localPath.endsWith('__dir.tar.gz')))))  {  // yes the job is running
        if (jobEntry && (jobEntry.nc_type=='ordinary'))  {  // yes the job is running
          // form a URL request to forward
          this.ncURL = conf.getNCConfig(jobEntry.nc_number).url() + '/' +
                                        cmd.__special_url_tag + '/' +
                                        jobEntry.job_token + '/' +
                                        localPath;
          if (this.search)
            this.ncURL += this.search;
        }

      }

      log.debug2 ( 3,"File " + this.filePath);

    }

  }
  if (ix<0) {
    ix = this.filePath.indexOf('manual');
    if (ix>=0)  {  // request for documentation file
      /*
      console.log ( ' ---- ' + this.filePath );
      var flst = this.filePath.substr(ix).split('?');
      if (!utils.fileExists(flst[0]))
            this.filePath = flst[0];
      else  this.filePath = flst[flst.length-1];
      console.log ( ' === ' + this.filePath );
      */
      this.filePath = this.filePath.substr(ix);
      // if (this.filePath.endsWith('.html'))
      //   anl.getFEAnalytics().logDocument ( this.filePath );
      // console.log ( "requested manual " + this.filePath);
      log.debug2 ( 2,"calculated path " + this.filePath);
    }
  }
  // if (ix<0)  {
  //   if (this.filePath.startsWith('archive'))  {
  //     this.filePath = 'archive.html';
  //     ix = 0;
  //   }
  // }
  // console.log ( "calculated path " + this.filePath);

  this.mimeType = utils.getMIMEType ( this.filePath );

  // Print the name of the file for which server_request is made.
  log.debug2 ( 4,"Command " + this.command );

  return;

}



/*
var __malicious_ext = [
  '.exe', '.php', '.cgi', '.jsp', '.asp', '.pl'
];
*/


Communicate.prototype.__count_malicious_ip = function ( ip,count )  {
  if (this.fe_server.malicious_attempts_max>0)  {
    if ((ip in __malicious_ip_register) ||
        (__malicious_ip_register[ip]>-this.fe_server.malicious_attempts_max)) {
      __malicious_ip_register[ip] += count;
      if (__malicious_ip_register[ip]>this.fe_server.malicious_attempts_max)
        log.standard ( 1,'ip address ' + ip + ' is deemed as malicious and will be ignored' );
    } else
      __malicious_ip_register[ip] = count;
  }
}


Communicate.prototype.sendFile = function ( server_response )  {

  //var mtype = this.mimeType;

  log.debug2 ( 5,'send file = ' + this.filePath );

//console.log ( 'send file = ' + this.filePath + ',  mtype=' + mtype );

  if (this.ncURL.length>0)  {
    // the file is on an NC, fetch it from there through a temporary file on FE

    (function(ncURL,mimeType){
      tmp.tmpName(function(err,fpath) {
        if (err) {
          log.error ( 10,'cannot create temporary storage for file ' +
                        'request redirection' );
        } else  {
          log.debug2 ( 11,'tmp file ' + fpath );
          request
            .get ( ncURL )
            .on('error', function(err) {
              log.error ( 12,'Download errors from ' + ncURL );
              log.error ( 12,'Error: ' + err );
              utils.removeFile ( fpath );
            })
            .pipe(fs.createWriteStream(fpath))
            .on('error', function(err) {
              log.error ( 13,'Download errors or stream read errors from ' + ncURL );
              log.error ( 13,'Error: ' + err );
              utils.removeFile ( fpath );
            })
            .on('close',function(){   // finish,end,
              utils.send_file ( fpath,server_response,mimeType,true,0,0,null );
            });
        }
      });
    }(this.ncURL,this.mimeType));

  } else if (this.filePath)  {

    var fpath = this.filePath;
    if (fpath.endsWith('favicon.ico'))  {
      if (conf.isLocalSetup())  fpath = 'favicon-desktop.ico';
                          else  fpath = 'favicon-remote.ico';
      fpath = path.join ( 'images_com',fpath );
    }

    this.__count_malicious_ip ( this.requester_ip,-1 );

    if (this.filePath.endsWith('.html') && (
          this.filePath.startsWith('manual') || this.filePath.startsWith('html')
        ))
      anl.getFEAnalytics().logDocument ( this.filePath );

    (function(self){
      if (!self.search)
        utils.send_file ( fpath,server_response,self.mimeType,false,0,0,
                          function(){
                            self.__count_malicious_ip ( self.requester_ip,2 );
                            return true;
                          });
      else if (self.search.indexOf('?capsize')>=0)
        utils.send_file ( fpath,server_response,self.mimeType,false,
                          conf.getFEConfig().fileCapSize,0,function(){
                            self.__count_malicious_ip ( self.requester_ip,2 );
                            return true;
                          });
      else
        utils.send_file ( fpath,server_response,self.mimeType,false,0,0,function(){
                            self.__count_malicious_ip ( self.requester_ip,2 );
                            return true;
                          });
    }(this))

  }

}


// ==========================================================================
// export for use in node
module.exports.Communicate = Communicate;
