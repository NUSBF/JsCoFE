
/*
 *  ==========================================================================
 *
 *    09.10.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  ==========================================================================
 *
 */

//  load system modules
var url     = require('url');
var fs      = require('fs-extra');
var path    = require('path');
var request = require('request');
var tmp     = require('tmp');

//  load application modules
//var class_map = require('./server.class_map');
var conf      = require('./server.configuration');
var utils     = require('./server.utils');
var user      = require('./server.fe.user');
var prj       = require('./server.fe.projects');
var rj        = require('./server.fe.run_job');
var ustats    = require('./server.fe.usagestats');
var cmd       = require('../js-common/common.commands');

//  prepare log
var log = require('./server.log').newLog(5);


// ==========================================================================

tmp.setGracefulCleanup();


// ==========================================================================

function Communicate ( server_request )  {

  // Parse the server request command
  var url_parse = url.parse(server_request.url);
  var url_path  = url_parse.pathname.substr(1);
  this.command  = url_path.toLowerCase();
  this.search   = url_parse.search;
  this.ncURL    = '';
//console.log ( "requested " + server_request.url );
//console.log ( "parsed    " + JSON.stringify(url_parse) );

  if ((this.command=='') || (this.command==cmd.fe_command.cofe))
        this.filePath = conf.getFEConfig().bootstrapHTML;
  else  this.filePath = url_path;
//console.log ( "filePath " + this.filePath );

  if (this.command.startsWith(cmd.fe_command.jobFinished))  {
    this.job_token = this.command.substr(cmd.fe_command.jobFinished.length);
    this.command   = cmd.fe_command.jobFinished;
  } else
    this.job_token = '';

  log.debug2 ( 1,"requested path " + this.filePath );
//console.log ( "requested path " + this.filePath );
  var ix = this.filePath.indexOf('jsrview');
  if (ix<0)
    ix = this.filePath.indexOf('ccp4i2_support');
  if (ix>=0)  {  // request for jsrview library file, load it from js-lib
                 // REGARDLESS the actual path requested
    this.filePath = path.join ( 'js-lib',this.filePath.substr(ix) );
    log.debug2 ( 2,"calculated path " + this.filePath);
  }
  if (ix<0) {
    var rtag = cmd.special_url_tag + '-fe/';
    ix = this.filePath.lastIndexOf(rtag);
//console.log ( 'rtag=' + rtag + ',  file=' + this.filePath + ', ix=' + ix );
    if (ix>=0)  {
      this.filePath = this.filePath.substr(ix+rtag.length);
      log.debug2 ( 4,"calculated path " + this.filePath);
    }
  }
  if (ix<0) {
    var utag = cmd.special_url_tag + '/' + ustats.statsDirName + '/';
    ix = this.filePath.lastIndexOf(utag);
    if (ix>=0)  {
      this.filePath = ustats.getUsageReportFilePath ( this.filePath.substr(ix+utag.length) );
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

    //if (this.filePath.startsWith(cmd.special_url_tag))  { // special access to files not
    //                                             // supposed to be on http path

    var sindex = this.filePath.lastIndexOf ( cmd.special_url_tag );
    if (sindex>=0)  {

      var flist     = this.filePath.slice(sindex).split('/');
      var loginData = user.getLoginData ( flist[1] );

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
        //console.log ( ' fp='+this.filePath );

        // now check whether the job is currently running, in which case the
        // requested file should be fetched from the respective number cruncher
        var jobEntry = rj.getEFJobEntry ( loginData,flist[2],flist[3] );
//      if (jobEntry && ((jobEntry.nc_type=='ordinary') ||
//                       (conf.isLocalFE() &&
//                        (!localPath.endsWith('__dir.tar.gz')))))  {  // yes the job is running
        if (jobEntry && (jobEntry.nc_type=='ordinary'))  {  // yes the job is running
          // form a URL request to forward
          this.ncURL = conf.getNCConfig(jobEntry.nc_number).url() + '/' +
                                        cmd.special_url_tag + '/' +
                                        jobEntry.job_token + '/' +
                                        localPath;
          if (this.search)
            this.ncURL += this.search;
        }

      }

      log.debug2 ( 3,"File " + this.filePath);

    } else  {
      ix = this.filePath.indexOf('manual');
      if (ix>=0)  {  // request for jsrview library file, load it from js-lib
                     // REGARDLESS the actual path requested
        this.filePath = this.filePath.substr(ix);
        log.debug2 ( 2,"calculated path " + this.filePath);
      }
    }

  }

  this.mimeType = utils.getMIMEType ( this.filePath );

  // Print the name of the file for which server_request is made.
  log.debug2 ( 4,"Command " + this.command );

}


Communicate.prototype.sendFile = function ( server_response )  {

  var mtype = this.mimeType;

  log.debug2 ( 5,'send file = ' + this.filePath );

//console.log ( 'send file = ' + this.filePath + ',  mtype=' + mtype );

  if (this.ncURL.length>0)  {
    // the file is on an NC, fetch it from there through a temporary file on FE

    (function(ncURL){
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
              utils.send_file ( fpath,server_response,mtype,false,0,null );
            });
        }
      });
    }(this.ncURL));

  } else  {

    var fpath = this.filePath;
    if (fpath=='favicon.ico')  {
      if (conf.isLocalSetup())  fpath = './images_com/favicon-desktop.ico';
                          else  fpath = './images_com/favicon-remote.ico';
    }

    if (!this.search)
      utils.send_file ( fpath,server_response,mtype,false,0,null );
    else if (this.search.indexOf('?capsize')>=0)
      utils.send_file ( fpath,server_response,mtype,false,
                        conf.getFEConfig().fileCapSize,null );
    else
      utils.send_file ( fpath,server_response,mtype,false,0,null );

  }

}


// ==========================================================================
// export for use in node
module.exports.Communicate = Communicate;
