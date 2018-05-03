
/*
 *  =================================================================
 *
 *    27.03.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.communicate.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Communication Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var url     = require('url');
var fs      = require('fs-extra');
var path    = require('path');
var request = require('request');
var tmp     = require('tmp');

//  load application modules
var class_map = require('./server.class_map');
var conf      = require('./server.configuration');
var utils     = require('./server.utils');
var user      = require('./server.fe.user');
var prj       = require('./server.fe.projects');
var rj        = require('./server.fe.run_job');
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

  if ((this.command=='') || (this.command==cmd.fe_command.cofe))
        this.filePath = conf.getFEConfig().bootstrapHTML;
  else  this.filePath = url_path;

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

  } else if (this.filePath.startsWith('@/'))  {  // special access to files not
                                                 // supposed to be on http path

    var flist = this.filePath.split('/');
    var login = user.getLoginFromHash ( flist[1] );

    if (login.length>0)  {  // login is valid

      // calculate path within job directory
      var localPath = '';
      for (var i=4;i<flist.length;i++)
        localPath = path.join ( localPath,flist[i] );

      // make full path for local (FE-based) file
      if (localPath.length>0)  // file in a job directory
        this.filePath = path.join ( prj.getJobDirPath(login,flist[2],flist[3]),
                                    localPath );
      else // file in a project directory
        this.filePath = path.join ( prj.getProjectDirPath(login,flist[2]),
                                    flist[3] );
      //console.log ( ' fp='+this.filePath );


      // now check whether the job is currently running, in which case the
      // requested file should be fetched from the respective number cruncher
      var jobEntry = rj.getEFJobEntry ( login,flist[2],flist[3] );
      if (jobEntry && (jobEntry.nc_type=='ordinary'))  {  // yes the job is running
        // form a URL request to forward
        this.ncURL = conf.getNCConfig(jobEntry.nc_number).url() + '/@/' +
                                      jobEntry.job_token + '/'  + localPath;
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


  this.mimeType = utils.getMIMEType ( this.filePath );

  // Print the name of the file for which server_request is made.
  log.debug2 ( 4,"Command " + this.command );

}


Communicate.prototype.sendFile = function ( server_response )  {

  var mtype = this.mimeType;

  log.debug2 ( 5,'send file = ' + this.filePath );

  /*
  function send_file ( fpath,deleteOnDone,cap )  {
    // Read the requested file content from file system
    fs.readFile ( fpath, function(err,data) {
      if (err)  {
        log.error ( 6,'Read file errors, file = ' + fpath );
        log.error ( 6,'Error: ' + err );
        server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
        server_response.end ( '<p><b>FILE NOT FOUND</b></p>' );
      } else  {
        server_response.writeHead ( 200, {'Content-Type': mtype} );
        if (cap)
              server_response.end ( utils.capData(data,conf.getFEConfig().fileCapSize) );
        else  server_response.end ( data );
        if (deleteOnDone)
          utils.removeFile ( fpath );
      }
    });
  }
  */

  function send_file ( fpath,deleteOnDone,cap )  {
    // Read the requested file content from file system
    fs.stat ( fpath,function(err,stats){
      if (err)  {
        log.error ( 6,'Read file errors, file = ' + fpath );
        log.error ( 6,'Error: ' + err );
        server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
        server_response.end ( '<p><b>FILE NOT FOUND</b></p>' );
      } else if ((!cap) || (stats.size<=conf.getFEConfig().fileCapSize))  {
        server_response.writeHeader ( 200, {
           'Content-Type'   : mtype,
           'Content-Length' : stats.size
        });
        var fReadStream = fs.createReadStream ( fpath );
        fReadStream.on ( 'data',function(chunk){
          if (!server_response.write(chunk))
            fReadStream.pause();
        });
        fReadStream.on ( 'end',function(){
          server_response.end();
          if (deleteOnDone)
            utils.removeFile ( fpath );
        });
        server_response.on('drain',function(){
          fReadStream.resume();
        });
      } else  {
        fs.readFile ( fpath, function(err,data) {
          if (err)  {
            log.error ( 6,'Read file errors, file = ' + fpath );
            log.error ( 6,'Error: ' + err );
            server_response.writeHead ( 404, {'Content-Type':'text/html;charset=UTF-8'} );
            server_response.end ( '<p><b>FILE NOT FOUND</b></p>' );
          } else  {
            server_response.writeHeader ( 200, {'Content-Type':mtype} );
            server_response.end ( utils.capData(data,conf.getFEConfig().fileCapSize) );
            if (deleteOnDone)
              utils.removeFile ( fpath );
          }
        });
      }
    });
  }

  if (this.ncURL.length>0)  {
    // the file is on an NC, fetch it from there through a temporary file on FE

    (function(ncURL){
      tmp.tmpName(function(err,fpath) {
        if (err) {
          log.error ( 7,'cannot create temporary storage for file ' +
                        'request redirection' );
        } else  {
          log.debug2 ( 8,'tmp file ' + fpath );
          request
            .get ( ncURL )
            .on('error', function(err) {
              log.error ( 9,'Download errors from ' + ncURL );
              log.error ( 9,'Error: ' + err );
              utils.removeFile ( fpath );
            })
            .pipe(fs.createWriteStream(fpath))
            .on('close',function(){   // finish,end,
              send_file ( fpath,true,false );
            });
        }
      });
    }(this.ncURL));

  } else if (!this.search)
        send_file ( this.filePath,false,false );
  else  send_file ( this.filePath,false,(this.search.indexOf('?capsize')>=0) );

}


// ==========================================================================
// export for use in node
module.exports.Communicate = Communicate;
