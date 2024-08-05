
/*
 *  =================================================================
 *
 *    05.08.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.configuration.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Configuration Module
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const fs        = require('fs-extra');
const path      = require('path');
const http      = require('http');
const crypto    = require('crypto');
const request   = require('request');
const child     = require('child_process');

//  load application modules
const utils     = require('./server.utils');
const cmd       = require('../js-common/common.commands');
const com_utils = require('../js-common/common.utils');

//  prepare log
const log       = require('./server.log').newLog(3);


// ===========================================================================
//  Configuration data classes

var desktop       = null;   // Configuration for launching single desktop
var work_server   = null;   // current server configuration (FE or NC/CLIENT)
var fe_server     = null;   // FE server configuration
var fe_proxy      = null;   // FE proxy configuration
var nc_servers    = null;   // vector of NC server configurations
var client_server = null;   // Client server configuration
var emailer       = null;   // E-mailer configuration

// ===========================================================================

var windows_drives = [];    // list of Windows drives

function listWindowsDrives ( callback_func )  {
  if (isWindows())  {
    child.exec('wmic logicaldisk get name', (error, stdout) => {
      windows_drives = stdout.split('\r\r\n')
              .filter(value => /[A-Za-z]:/.test(value))
              .map(value => value.trim());
      if (callback_func)
        callback_func();
    });
  }
}


// ===========================================================================
// ServerConfig class template

function ServerConfig ( type )  {
  this.type           = type;
  this.protocol       = 'http';
  this.host           = 'localhost';
  this.isLocalHost    = true;
  this.port           = 'port';
  this.externalURL    = '';
  this.exclude_tasks  = [];   // tasks that should not run on given FE or NC server
  this.licensed_tasks = [];   // tasks for which FE has 3rd party license ("TaskArpWarp")
  this.only_tasks     = [];   // tasks that NC server can only run
  this.storage        = null;
  this.update_rcode   = 0;    // can be be detected by launcher script to do the needful
  this.rejectUnauthorized = true; // should be true by default
  if (type=='FEProxy')
        this.state = 'active';  // server state: 'active', 'inactive'
  else  this.state = 'active';  // server state: 'active', 'inactive'
  this.startDate     = new Date(Date.now()).toUTCString();
  this.logflow       = {};
  this.logflow.chunk_length = 10000; // number of jobs to advance log file counters
  this.logflow.log_file     = '';    // full path less of '.log' and '.err' extensions
  this.allowedPaths  = [];
}

ServerConfig.prototype.url = function()  {
  if (this.port>0)  {
    // this works on FE side
    return this.protocol + '://' + this.host + ':' + this.port;
  } else  {
    // this may be used on NC side if FE uses redirection from
    // its main server, e.g.  http://fe.apache.com/jscofe ->
    // http://localhost:8081 . In this case, set 'host' to
    // 'apache.com' and use port=0
   return this.protocol + '://' + this.host;
  }
}

ServerConfig.prototype.getQueueName = function()  {
  if ('exeType' in this)  {
    if (this.exeType=='SGE')  {
      let n = this.exeData.indexOf('-q');
      if ((n>=0) && (n<this.exeData.length-1))
        return this.exeData[n+1];
    }
  }
  return '-';
}


ServerConfig.prototype.getPIDFilePath = function()  {
let pidfilepath = null;
  if (this.storage)
    pidfilepath = path.join ( this.storage,'pids.dat' );
  else if (fe_server && fe_server.storage)
    pidfilepath = path.join ( fe_server.storage,'pids.dat' );
  return pidfilepath;
}

ServerConfig.prototype.savePID = function()  {
let pidfile = this.getPIDFilePath();
let pids = utils.readObject ( pidfile );
  if (!pids)
    pids = {};
  pids[this.type] = process.pid.toString();
  utils.writeObject ( pidfile,pids );
  //utils.writeString ( this.getPIDFilePath(),process.pid.toString() );
}

ServerConfig.prototype.killPrevious = function()  {
let pidfile = this.getPIDFilePath();
let pids    = utils.readObject ( pidfile );
  if (pids && (this.type in pids) && (pids[this.type]!=process.pid))  {
    utils.killProcess ( pids[this.type] );
    delete pids[this.type];
    utils.writeObject ( pidfile,pids );
  }
/*
let pid     = utils.readString ( pidfile );
  if (pid && (pid!=process.pid))  {
    utils.killProcess ( pid     );
    utils.removeFile  ( pidfile );
  }
*/
}

ServerConfig.prototype.calcCPUCapacity = function()  {

  this.maxNCores = 16;
  if ('cpu_cores' in this)
    this.maxNCores = this.cpu_cores;
  if ('max_ncores' in this)
    this.maxNCores = Math.min(this.maxNCores,this.max_nproc);
  else if (this.exeType!='CLIENT')
    this.maxNCores = Math.floor ( this.maxNCores/4 );
  this.maxNCores = Math.max(1,this.maxNCores);
  
  this.maxNProcesses = this.maxNCores;
  if ('capacity' in this)
    this.maxNProcesses = this.capacity;
  if ('max_nproc' in this)
    this.maxNProcesses = Math.min(this.maxNProcesses,this.max_nproc);
  else if (this.exeType!='CLIENT')
    this.maxNProcesses = Math.floor ( this.maxNProcesses/4 );
  this.maxNProcesses = Math.max(1,this.maxNProcesses);

}


ServerConfig.prototype.getMaxNProcesses = function()  {
// returns the maximal number of process a task is allowed to spawn
  return this.maxNProcesses;
}

ServerConfig.prototype.getMaxNCores = function()  {
// returns the maximal number of cpu cores (on a single node) a task is allowed to use
  return this.maxNCores;
}


function _make_path ( filepath,login )  {
let plist;
  if (filepath.constructor === Array)  {
    // list of paths is used when environmental variables depend on OS
    for (let i=0;i<filepath.length;i++)  {
      // paths in config file always to have '/' separator
      if (login)  plist = filepath[i].replace(/\$LOGIN/g,login).split('/');
            else  plist = filepath[i].split ( '/' );
      let found = false;
      for (let j=0;j<plist.length;j++)  {
        if (plist[j].startsWith('$'))  {
          let env_name = plist[j].slice(1)
          if (process.env.hasOwnProperty(env_name))  {
            plist[j] = process.env[env_name];
            found    = true;
          }
        }
      }
      if (found)
        return  plist.join ( path.sep ); // return path with system's separator
        // return plist.join ( path.sep ); // return path with system's separator
    }
  } else  {
    // paths in config file always to have '/' separator
    if (login)  plist = filepath.replace(/\$LOGIN/g,login).split('/');
          else  plist = filepath.split ( '/' );
    let found = true;
    for (let i=0;i<plist.length;i++)
      if (plist[i].startsWith('$'))  {
        let env_name = plist[i].slice(1)
        if (process.env.hasOwnProperty(env_name))
          plist[i] = process.env[env_name];
        else
          found = false;
      }
    if (found)
      return  plist.join ( path.sep ); // return path with system's separator
      // return plist.join ( path.sep ); // return path with system's separator
  }
  return null;
}


ServerConfig.prototype.getCloudMounts = function ( login )  {
let paths = [];
  if ('cloud_mounts' in this)  {
    for (let name in this.cloud_mounts)  {
      let cloud_path = _make_path ( this.cloud_mounts[name],login );
      if (cloud_path)
        paths.push ( [name,cloud_path] );
    }
  }
  return paths;
}


ServerConfig.prototype.getJobsSafePath = function()  {
  if (this.hasOwnProperty('jobs_safe'))
    return this.jobs_safe.path;
  return '';
}


ServerConfig.prototype.getDemoProjectsMount = function()  {
  let mount = null;
  if (this.hasOwnProperty('cloud_mounts'))  {
    for (let name in this.cloud_mounts)  {
      let lname = name.toLowerCase();
      if (lname.indexOf('tutorial')>=0)  {
        mount = name;
        break;
      }
    }
    if (!mount)
      for (let name in this.cloud_mounts)  {
        let lname = name.toLowerCase();
        if ((lname.indexOf('demo')>=0) && (lname.indexOf('projects')>=0))  {
          mount = name;
          break;
        }
      }
    if (mount)  {
      let mpath = _make_path ( this.cloud_mounts[mount],'' );
      if (!utils.dirExists(mpath))
        mount = null;
    }
  }
  return mount;
}


ServerConfig.prototype.getVolumeDir = function ( loginData )  {
  if ((loginData.volume=='*storage*') || (!this.hasOwnProperty('projectsPath')))
        return this.storage;
  else if (this.projectsPath[loginData.volume].type=='home')
        return path.join ( this.projectsPath[loginData.volume].path,
                           loginData.login,
                           this.projectsPath[loginData.volume].dirName );
  else  return this.projectsPath[loginData.volume].path;
}


ServerConfig.prototype.getJobsSafe = function()  {
  if (this.hasOwnProperty('jobs_safe'))
    return this.jobs_safe;
  return {
    'path'     : path.join(this.storage,'jobs_safe'),
    'capacity' : 10
  };
}


ServerConfig.prototype.isFilePathAllowed = function ( fpath )  {
let ok = false;
  try {
    let rpath = fs.realpathSync(fpath);
    for (let i=0;(i<this.allowedPaths.length) && (!ok);i++)
      ok = rpath.startsWith ( this.allowedPaths[i] );
    if (!ok)
      log.error ( 41,'rpath not found: ' + rpath );
  } catch(e) {
    log.error ( 42,'fpath not found: ' + fpath );
  }
  return ok;
}


ServerConfig.prototype.checkNCStatus = function ( callback_func )  {

  if (this.in_use)  {
    request({
      uri     : cmd.nc_command.getNCInfo,
      baseUrl : this.externalURL,
      method  : 'POST',
      body    : '',
      json    : true,
      rejectUnauthorized : this.rejectUnauthorized
    },function(error,response,body){
      callback_func ( error,response,body,this );
    });
  } else  {
    callback_func ( 'not-in-use',null,'',this );
  }

}


ServerConfig.prototype.checkNCCapacity = function ( callback_func )  {

  if (this.in_use)  {
    request({
      uri     : cmd.nc_command.getNCCapacity,
      baseUrl : this.externalURL,
      method  : 'POST',
      body    : '',
      json    : true,
      rejectUnauthorized : this.rejectUnauthorized
    },function(error,response,body){
      callback_func ( error,response,body,this );
    });
  } else  {
    callback_func ( 'not-in-use',null,'',this );
  }

}


ServerConfig.prototype._checkLocalStatus = function()  {

  this.isLocalHost = (this.host.toLowerCase()=='localhost') ||
                     (this.host=='127.0.0.1');

  if (!('localSetup' in this))  {
    if (this.externalURL.length>0)
          this.localSetup = (this.externalURL.indexOf('localhost') >= 0) ||
                            (this.externalURL.indexOf('127.0.0.1') >= 0);
    else  this.localSetup = this.isLocalHost;
  }
}


ServerConfig.prototype.checkLogChunks = function ( nNewJobs,logNo )  {
  if (nNewJobs>this.logflow.chunk_length)  {
    if (this.logflow.log_file)  {
      let logfpath = this.logflow.log_file + '.log';
      if (utils.fileExists(logfpath))  {
        let errfpath = this.logflow.log_file + '.err';
        let mod = '.' + com_utils.padDigits(logNo+1,3)
        utils.moveFile ( logfpath,this.logflow.log_file + mod + '.log' );
        utils.moveFile ( errfpath,this.logflow.log_file + mod + '.err' );
        utils.writeString ( logfpath,'' );
        utils.writeString ( errfpath,'' );
      }
    }
    return true;
  }
  return false;
}


ServerConfig.prototype.isArchive = function()  {
// returns true if CCP4 Cloud Archive is configured
  return ('archivePath' in fe_server) && fe_server.archivePath;
}
  

ServerConfig.prototype.getExchangeDirectory = function()  {
  if ('exchangeDir' in this)
    return this.exchangeDir;
  return null; // not a client server
}


ServerConfig.prototype.hasDataLink = function()  {
  if (this.hasOwnProperty('datalink') && this.datalink.hasOwnProperty('api_url'))
    return true;
  return false;
}


ServerConfig.prototype.getDataLinkUrl = function()  {
  if (this.hasDataLink())
    return this.datalink.api_url;
  return null;
}


ServerConfig.prototype.getDataLinkMountName = function()  {
  if (this.hasDataLink() && this.datalink.hasOwnProperty('mount_name'))
    return this.datalink.mount_name;
  return '';
}


ServerConfig.prototype.getDataLinkVerifyCert = function()  {
  if (this.hasDataLink() && this.datalink.hasOwnProperty('verify_cert'))
    return this.datalink.verify_cert;
  return true;
}

// ===========================================================================
// Config service functions

function getDesktopConfig()  {
  return desktop;
}

function getServerConfig()  {
  return work_server;
}

function getFEConfig()  {
  return fe_server;
}

function getFEProxyConfig()  {
  return fe_proxy;
}

function getNCConfig ( ncNumber )  {
  if ((0<=ncNumber) && (ncNumber<nc_servers.length))
    return nc_servers[ncNumber];
  return null;
}

function getNCConfigs()  {
  return nc_servers;
}

function getNumberOfNCs()  {
  if (nc_servers)
    return nc_servers.length;
  return 0;
}

function getClientNCConfig()  {
  return client_server;
}

function getEmailerConfig()  {
  return emailer;
}

function CCP4Version()  {
let version = '';
  if (process.env.hasOwnProperty('CCP4'))  {
    // if ('CCP4' in process.env)  {
      let s = utils.readString ( path.join(process.env.CCP4,'lib','ccp4','MAJOR_MINOR') );
      if (s)
        version = s.split(/,?\s+/)[0];
    // }
  }
  return version;
}

function CCP4DirName()  {
  if (process.env.hasOwnProperty('CCP4'))
    return path.basename ( process.env.CCP4 );
  return '';
}


// ===========================================================================
// Config read function (leading underscores are equivalent to comments)

/*  --------------------------------------------------------------------------


"Desktop"  : {
  "clientApp"  : "/bin/bash",
  "titlePage"  : true,  // optional, only in local/desktop mode
  "args"       : ["-c","cd cofe-browser; npm start url=$feURL$clientURL"],
  "_args"       : ["-c","ccp4-python pycofe/apps/browser/browser.py -u $feURL$clientURL"],
  "__args"       : ["-c","open -a Opera $feURL$clientURL"],
  "___args"       : ["-c","open $feURL$clientURL"],
  "____args"       : ["-c","open -a 'Google Chrome' $feURL$clientURL"],
  "_____args"       : ["-c","open -a Firefox $feURL$clientURL"]
},

{
  "FrontEnd" : {
    "description"      : {
      "id"   : "ccp4",  // must be unique for each setup with external access;
                        // "ccp4" is reserved for central setup at CCP4;
                        // the id is also used for making CCP4 Archive IDs of
                        // form CCP4-XXX.YYYY (if id=="ccp4", upper case forced),
                        // so that archive request can be associated with 
                        // CCP4 Cloud instance
      "name" : "CCP4-Harwell",
      "icon" : "images_com/setup-harwell.png",
      "partners" : [  // custom logos only
        { "iris"        : "IRIS",
          "logo"        : "./images_png/logo-iris.png",
          "description" : "Digital Research Infrastructure STFC UK",
          "thanks"      : "Computing infrastructure",
          "url"         : "https://www.iris.ac.uk"
        }
      ]
    },
    "protocol"         : "http",
    "host"             : "localhost",
    "port"             : 8081,
    "externalURL"      : "http://localhost:8081",
    "reportURL"        : "https://cloud.ccp4.ac.uk",  // used only for reporting
    "exclusive"        : true,
    "stoppable"        : false,
    "rejectUnauthorized" : true, // optional; use only for debugging, see docs
    "exclude_tasks"    : [],
    "licensed_tasks"   : [],   // ["TaskArpWarp"] if arpwarp installed on server
    "treat_private"    : ["none","seq","xyz","lig","hkl","all"],  // data not to be sent out
    "job_despatch"     : "opt_comm", // "opt_load" optimise communication or NC load
    "fsmount"          : "/",
    "localSetup"       : true,  // optional, overrides automatic definition
    "update_rcode"     : 212, // optional
    "update_notifications" : false,  // optional notification on CCP4 updates
    "userDataPath"     : "./cofe-users",
    "storage"          : "./cofe-projects",  // for logs, stats, pids, tmp etc.
    "projectsPath"     : "./cofe-projects",  // old version; in this case, "storage" may be
                                             // omitted. Although functional, do not use
                                             // this in new setups
    "projectsPath"     : {   // new version; in this case, "storage" must be given
        "***"   : { "path" : "./cofe-projects", // "***" is special name for working with
                                                // projects created with the old, single-path,
                                                // version. The path for "***" should be set
                                                // equal to former "projectPath"
                    "type" : "volume",          //    given by single string
                        // type "volume"  : an ordinary file system for users projects;
                        //                  can be as many volumes as necessary, at
                        //                  least one must be given
                        // type "home"    : same as "volume" but places user projects in
                        //                  path/login/[dirName]
                        //                  if path/login already exists and is writable
                    "diskReserve" : 10000,  // new user will not be registered if disk
                                            // has space less than 'diskReserve' (in MB)
                                            // less of already committed space for user
                                            // accounts
                    "dirName" : "ccp4cloud_projects"  // used only for "home" volumes
                  },
        "nameN" : { "path" : "pathN",   // any number of any names and any paths
                    "type" : "typeN",
                    "diskReserve" : 10000
                  }
    },
    "jobs_safe" : {  // should point on jobs_safe directory as in NCs
        "path"     : "./cofe-nc-storage/jobs_safe",
        "capacity" : 10
    },
    "archivePath" : {  // optional CCP4 Cloud Archive storage configuration;
                       // can be absent or set null if no Archive is used;
                       // otherwise must not be empty
        "aname1" : { "path" : "./cofe-archive-1",  // any disk name and path name
                     "type" : "prime-volume",      // one volume must be prime
                     "diskReserve" : 10000  // spare capacity, in MBytes, to accomodate
                                            // project versions
                   },
        "anameN" : { "path" : "pathN",      // any number of any disk and path names
                     "type" : "volume",     // must be just "volumes"
                     "diskReserve" : 10000
                   }
    },
    // REDUNDANT, NOT USED:
    // "facilitiesPath"   : "./cofe-facilities",
    // "ICAT_wdsl"        : "https://icat02.diamond.ac.uk/ICATService/ICAT?wsdl",
    // "ICAT_ids"         : "https://ids01.diamond.ac.uk/ids",
    "auth_software"    : {  // optional item, may be null or missing
      "arpwarp" : {
        "desc_software" : "Arp/wArp Model Building Software from EMBL-Hamburg",
        "icon_software" : "task_arpwarp",
        "desc_provider" : "EMBL Outstation in Hamburg",
        "icon_provider" : "org_emblhamburg",
        "auth_url"      : "https://arpwarp.embl-hamburg.de/api/maketoken/?reqid=$reqid&addr=1.2.3.4&cburl=$cburl",
      },
      "gphl-buster"  : {
        "desc_software" : "Global Phasing Limited Software Suite",
        "icon_software" : "task_buster",
        "desc_provider" : "Global Phasing Limited",
        "icon_provider" : "org_gphl",
        "auth_url"      : "https://arpwarp.embl-hamburg.de/api/maketoken/?reqid=$reqid&addr=1.2.3.4&cburl=$cburl",
      }
    },
    "datalink" : {
      "api_url"     : "https://data.cloud.ccp4.ac.uk/api",
      "mount_name"  : "x",
      "verify_cert" : true
    },
    "bootstrapHTML"    : "jscofe.html",
    "maxRestarts"      : 100,
    "fileCapSize"      : 500000,
    "regMode"          : "admin",  // if 'email':  registration by user;
                                   // 'admin': all users are registration by admin
    "dormancy_control" : {
        "strict" : false,   // strict dormant accounts are actually frozen
        "after"  : 180      // accounts become dormant automatically after 180 days
                      // of inactivity; 0 means no auto-dormancy
    },
    "cache_max_age"    : 31536000,  // (optional) 1 year in ms; max age for caching icons on clients  
    "sessionCheckPeriod" : 2000,
    "ration"           : {
        "storage"      : 5000,     // currently comitted storage
        "storage_max"  : 20000,    // maximum possible allocation
        "storage_step" : 5000,     // storage allocation step for auto top-up
        "cpu_day"      : 24,
        "cpu_month"    : 240,
        "cloudrun_day" : 100,      // number of cloudruns/day, 0 for unlimited
        "archive_year" ; 2         // number of archivings/year, 0 for unlimited
    },
    "cloud_mounts"     : {  // optional item
      "My Computer"    : "/",
      "Home"           : ["$HOME","$USERPROFILE"],
      "CCP4 examples"  : "$CCP4/share/ccp4i2/demo_data",
      "Demo projects"  : "./demo-projects",
      "Tutorials"      : "./demo-projects",
      "My files"       : "./$LOGIN/files"
    },
    "logflow" : {   // optional item
      "chunk_length" : 10000,     // number of jobs to advance log file counters
      "log_file" : "/path/to/node_fe"    // full path less of '.log' and '.err' extensions
    }
  },

  "FEProxy" : {  // optional proxy configuration
    "protocol"         : "http",
    "host"             : "localhost",
    "port"             : 8082,
    "externalURL"      : "http://localhost:8082",
    "exclusive"        : true,
    "stoppable"        : false,
    "rejectUnauthorized" : true, // optional; use only for debugging, see docs
    "localisation"     : 1  // 0: all files are taken from remote server
                            // 1: images are taken from local setup
                            // 2: images and js libraries are taken from local setup
                            // 3: images and all js codes are taken from local setup
  },

  "NumberCrunchers" : [
    {
      "serNo"            : 0,
      "name"             : "local-nc",
      "in_use"           : true,
      "protocol"         : "http",
      "host"             : "localhost",
      "port"             : 8082,
      "externalURL"      : "http://localhost:8082",
      "exclusive"        : true,
      "stoppable"        : false,
      "rejectUnauthorized" : true, // [optional] use only for debugging, see docs
      "fsmount"          : "/",
      "localSetup"       : true,  // [optional] overrides automatic definition
      "capacity"         : 4,     // number of tasks/jobs a queue can run a time
      "max_nproc"        : 3,     // [optional] maximal number of jobs a task can spawn simultaneously
      "cpu_cores"        : 16,    // [optional] number of cores per compute node
      "max_ncores"       : 4,     // [optional] maximal number of cores a task can use
      "exclude_tasks"    : [],
      "only_tasks"       : [],
      "fasttrack"        : 1,
      "storage"          : "./cofe-nc-storage",
      "jobs_safe"        : {
          "path"     : "./cofe-nc-storage/jobs_safe",
          "capacity" : 10
      },
      "exeType"            : "SHELL",  // SHELL, SGE, SLURM, SCRIPT
      "jobManager"         : "SLURM",  // used if SCRIPT is provided
      "exeData"            : "",       // mandatory
      "exeData_GPU"        : "",       // optional queue for GPU-based tasks
      "jobCheckPeriod"     : 2000,
      "sendDataWaitTime"   : 1000,
      "maxSendTrials"      : 10,
      "jobRemoveTimeout"   : 10000,  // milliseconds
      "jobFalseStart"      : 1,      // days
      "jobTimeout"         : 30,     // days
      "zombieLifeTime"     : 30,     // days
      "pulseLifeTime"      : 1,      // days
      "maxRestarts"        : 100,
      "fileCapSize"        : 500000,
      "logflow" : {   // optional item
        "chunk_length" : 10000,     // number of jobs to advance log file counters
        "log_file" : "/path/to/node_fe"    // full path less of '.log' and '.err' extensions
      }
    },
    {
      "serNo"            : 1,
      "name"             : "client",
      "in_use"           : true,
      "protocol"         : "http",
      "host"             : "localhost",
      "port"             : 8083,
      "externalURL"      : "http://localhost:8083",
      "useRootCA"        : 1,
      "exclusive"        : true,
      "stoppable"        : false,
      "rejectUnauthorized" : true, // optional; use only for debugging, see docs
      "fsmount"          : "/",
      "capacity"         : 4,
      "exclude_tasks"    : [],
      "only_tasks"       : [],
      "fasttrack"        : 1,
      "storage"          : "./cofe-client-storage",
      "exchangeDir"      : "$HOME/.ccp4cloud_exchange",
      "exeType"          : "CLIENT",
      "exeData"          : "",       // mandatory
      "exeData_GPU"      : "",       // optional queue for GPU-based tasks
      "jobCheckPeriod"   : 2000,
      "sendDataWaitTime" : 1000,
      "maxSendTrials"    : 10,
      "jobRemoveTimeout" : 10000,
      "jobFalseStart"    : 1,      // days
      "jobTimeout"       : 30,     // days
      "zombieLifeTime"   : 30,     // days
      "pulseLifeTime"    : 1,      // days
      "maxRestarts"      : 100,
      "fileCapSize"      : 500000,
      "logflow" : {   // optional item
        "chunk_length" : 10000,     // number of jobs to advance log file counters
        "log_file" : "/path/to/node_fe"    // full path less of '.log' and '.err' extensions
      }
    }
  ],

  "Emailer" : {
    "type"               : "nodemailer",  // nodemailer, telnet, sendmail
    "emailFrom"          : "CCP4 Cloud <ccp4.cofe@gmail.com>",
    "maintainerEmail"    : "ccp4.cofe@gmail.com",
    "host"               : "smtp.gmail.com",
    "port"               : 465,
    "secure"             : true,
    "auth"               : {
      "user" : "ccp4.cofe@gmail.com",  // either "user"&"pass" or "file"
      "pass" : "ccp4.cofe.2016"        //    should be given
      "file" : "path-to-file-with-userId-and-password"  // UserId and PWD space-separated
    }
  }

}

--------------------------------------------------------------------------  */

// --------------------------------------------------------------------------

var _python_name = 'ccp4-python';
var _python_ver  = '0.0.0';

function pythonName()  {
  return path.join ( process.env.CCP4,'bin',_python_name );
}

function pythonVersion()  {
  return _python_ver;
}

function setPythonVersion ( version )  {
  _python_ver = version;
}

function checkPythonVersion()  {
  child.exec ( pythonName() + ' -V',function(err, stdout, stderr) {
    if (stdout)
      _python_ver = stdout.trim().split(' ').slice(-1)[0].trim();
    else if (stderr)  {  // this works weirdly for Mac OSX
      if (stderr.startsWith('Python'))
            _python_ver = stderr.trim().split(' ').slice(-1)[0].trim();
      else  _python_ver = pythonName() + ' not found (' + stderr + ')';
    }
    log.standard ( 5,'python version: ' + pythonVersion() );
  });
}

function set_python_check ( check_bool )  {
  if (check_bool)  _python_ver = '0.0.0';
             else  _python_ver = 'x.x.x';
}

//checkPythonVersion();


// --------------------------------------------------------------------------


function readConfiguration ( confFilePath,serverType )  {

  if (_python_ver=='0.0.0')
    checkPythonVersion();

  let confObj = utils.readObject ( confFilePath );

  if (!confObj)
    return 'cannot load configuration file ' + confFilePath + ' (missing/invalid?)';

  if (confObj.hasOwnProperty('Desktop'))
    desktop = confObj.Desktop;

  if (confObj.hasOwnProperty('FrontEnd')) {

    fe_server = new ServerConfig('FE');

    // assign default values
    fe_server.job_despatch           = "opt_comm";  // "opt_comm" or "opt_load" to 
                                                    // optimise communication or NC load
    fe_server.sessionCheckPeriod     = 2000;  // ms
    fe_server.auth_software          = null;
    fe_server.malicious_attempts_max = -1;    // around 100; <0 means do not use
    fe_server.update_notifications   = false; // optional notification on CCP4 updates
    fe_server.archivePath            = null;  // no archive by default
    fe_server.archivePrimePath       = null;  // one archive volume must be prime
    fe_server.treat_private          = ['none'];  // ['none','seq','xyz','lig','hkl','all']
    fe_server.dormancy_control = {
      strict : false,   // strict dormant accounts are actually frozen
      after  : 180      // accounts become dormant automatically after 180 days
                        // of inactivity; 0 means no auto-dormancy
    };
    fe_server.cache_max_age  = 31536000;  // 1 year in ms; max age for caching icons on clients  
    fe_server.capacity_check_interval = 10*60*1000; // check NC capacity once in 10 minutes


    // read configuration file
    for (let key in confObj.FrontEnd)
      fe_server[key] = confObj.FrontEnd[key];

    // complete configuration

    if (!fe_server.hasOwnProperty('description'))
      fe_server.description = {
        id   : '',  // this is not a typo
        name : 'CCP4-Harwell',
        icon : 'images_com/setup-harwell.png'
      };

    if (!fe_server.description.hasOwnProperty('id'))
      fe_server.description.id = '';  // this is not a typo

    if (!fe_server.description.hasOwnProperty('partners'))
      fe_server.description.partners = [];

    fe_server.description.partners.unshift (
      { "name"        : "CCP4",
        "logo"        : "images_png/logo-ccp4.png",
        "description" : "Collaborative Computational Project Number 4 (CCP4) UK",
        "thanks"      : "Funding and computing",
        "url"         : "https://www.ccp4.ac.uk"
      },{
        "name"        : "UKRI",
        "logo"        : "images_png/logo-ukri.png",
        "description" : "UK Research and Innovations",
        "thanks"      : "Funding and hosting",
        "url"         : "https://www.ukri.org"
      }
    );

    if (!fe_server.externalURL)
      fe_server.externalURL = fe_server.url();
    fe_server.userDataPath = _make_path ( fe_server.userDataPath,null );

    if (!('reportURL' in fe_server))
      fe_server.reportURL = fe_server.externalURL;

    if (Object.prototype.toString.call(fe_server.projectsPath) === '[object String]')  {
      // old config file is used; convert to new style automatically
      fe_server.projectsPath = {
        '***' : { 'path'        : fe_server.projectsPath,
                  'type'        : 'volume',
                  'diskReserve' : 10000 // MBytes
                }
      };
    }

    // check disk volumes configuration

    let storagePath = '';

    for (let fsname in fe_server.projectsPath)  {
      fe_server.projectsPath[fsname].path =
                        _make_path ( fe_server.projectsPath[fsname].path,null );
      if ((!storagePath) || (fsname=='***'))
        storagePath = fe_server.projectsPath[fsname].path;
      if (!('diskReserve' in fe_server.projectsPath[fsname]))
        fe_server.projectsPath[fsname].diskReserve = 10000;  // 10GBytes
      if (!('dirName' in fe_server.projectsPath[fsname]))
        fe_server.dirName = 'ccp4cloud_projects';  // for "home" volumes
    }

    if (fe_server.storage)
          fe_server.storage = _make_path ( fe_server.storage,null );
    else  fe_server.storage = storagePath;

    if (fe_server.isArchive())  {
      for (let fsname in fe_server.archivePath)
        if (fe_server.archivePath[fsname].type=='prime-volume')
        fe_server.archivePrimePath = fe_server.archivePath[fsname].path;
      if (!fe_server.archivePrimePath)  {
        // log.error ( 40,'prime volume for CCP4 Cloud Archive not specified -- stop' );
        return 'prime volume for CCP4 Cloud Archive not specified';
      }
      log.standard ( 41,'CCP4 Cloud Archive configured' );
    } else
      log.standard ( 42,'CCP4 Cloud Archive not configured' );

    if (!('ration' in fe_server))
      fe_server.ration = {  // 0: unlimited
        'storage'      : 0.0,
        'storage_max'  : 0.0,
        'storage_step' : 5000.0,
        'cpu_day'      : 0.0,
        'cpu_month'    : 0.0,
        'cloudrun_day' : 100,
        'archive_year' : 2
      };
    if (!('archive_year' in fe_server.ration))
      fe_server.ration.archive_year = 2;
    if (!('cloudrun_day' in fe_server.ration))
      fe_server.ration.cloudrun_day = 100;
    if (!('storage_max' in fe_server.ration))  {
      fe_server.ration.storage_max = 0.0;
      if (fe_server.ration.storage>0.0)
        fe_server.ration.storage_max = Math.max(15000.0,fe_server.ration.storage);
      fe_server.ration.storage_step = 5000.0;
    }

    if (isWindows())
      listWindowsDrives ( function(){
        if (fe_server.hasOwnProperty('cloud_mounts'))  {
          if (fe_server.cloud_mounts.hasOwnProperty('My Computer'))  {
            let cmounts = {};
            for (let i=0;i<windows_drives.length;i++)
              cmounts['My Computer ' + windows_drives[i]] = windows_drives[i] + '/';
            for (let mount in fe_server.cloud_mounts)
              if (mount!='My Computer')
               cmounts[mount] = fe_server.cloud_mounts[mount];
            fe_server.cloud_mounts = cmounts;
          }
        }
      });

    fe_server._checkLocalStatus();

  } else if ((serverType=='FE') || (serverType=='FE-PROXY'))
    return 'front-end configuration is missing in file ' + confFilePath;

  if (confObj.hasOwnProperty('FEProxy')) {
    fe_proxy = new ServerConfig('FEProxy');
    fe_proxy.localisation = 1;  // default
    for (let key in confObj.FEProxy)
      fe_proxy[key] = confObj.FEProxy[key];
    if (!fe_proxy.externalURL)
      fe_proxy.externalURL = fe_proxy.url();
    fe_proxy._checkLocalStatus();
  } else if (serverType=='FE-PROXY')
    return 'front-end proxy configuration is missing in file ' + confFilePath;

  if (confObj.hasOwnProperty('NumberCrunchers')) {
    
    client_server = null;
    nc_servers    = [];
    
    for (let i=0;i<confObj.NumberCrunchers.length;i++)  {
    
      let nc_server = new ServerConfig('NC'+i);
    
      for (let key in confObj.NumberCrunchers[i])
        nc_server[key] = confObj.NumberCrunchers[i][key];
      nc_server.current_capacity = nc_server.capacity;  // initially, assume full capacity
      if (!nc_server.externalURL)
        nc_server.externalURL = nc_server.url();
      if (!fe_server)
        nc_server.storage = _make_path ( nc_server.storage,null );
      nc_server._checkLocalStatus();
      if (nc_server.exeType=='CLIENT')  {
        client_server = nc_server;
        client_server.state = 'active';  // server state: 'active', 'inactive'
        if (!("exchangeDir" in client_server))
          client_server.exchangeDir = '$HOME/.ccp4cloud_exchange';
        if (client_server.exchangeDir.startsWith('$HOME'))
          client_server.exchangeDir = client_server.exchangeDir.replace (
             '$HOME',process.env.HOME
          );
        if (fe_proxy && (!fe_proxy.storage))
          fe_proxy.storage = client_server.storage;
      }
      nc_server.allowedPaths.push ( fs.realpathSync('js-lib')     );
      nc_server.allowedPaths.push ( fs.realpathSync('images_png') );
      try {
        nc_server.allowedPaths.push ( fs.realpathSync(nc_server.storage) );
        if (nc_server.hasOwnProperty('jobs_safe'))
          nc_server.allowedPaths.push ( fs.realpathSync(nc_server.jobs_safe.path) );
      } catch(err)  {
        nc_server.allowedPaths.push ( nc_server.storage );
        if (nc_server.hasOwnProperty('jobs_safe'))
          nc_server.allowedPaths.push ( nc_server.jobs_safe.path );
      }
      if (!nc_server.hasOwnProperty('jobCheckPeriod'))
        nc_server.jobCheckPeriod = 2000;
      if (!nc_server.hasOwnProperty('jobManager'))
        nc_server.jobManager = nc_server.exeType;
      if (!nc_server.hasOwnProperty('zombieLifeTime'))
        nc_server.zombieLifeTime = 30;  // days
      if (!nc_server.hasOwnProperty('pulseLifeTime'))
        nc_server.pulseLifeTime = 1;  // days
      if (!nc_server.hasOwnProperty('jobTimeout'))
        nc_server.jobTimeout = 30;  // days
      if (!nc_server.hasOwnProperty('jobFalseStart'))
        nc_server.jobFalseStart = 1;  // days

      nc_server.calcCPUCapacity();
      nc_servers.push ( nc_server );

    }

  } else
    return 'number cruncher(s) configuration is missing in file ' + confFilePath;

  if (confObj.hasOwnProperty('Emailer')) {
    emailer = confObj.Emailer;
    if (!emailer.hasOwnProperty('maintainerEmail'))
      emailer.maintainerEmail = 'ccp4@ccp4.ac.uk';
    if (emailer.hasOwnProperty('auth'))  {
      if (emailer.auth.hasOwnProperty('file'))  {
        let auth = utils.readString ( emailer.auth.file );
        if (auth)  {
          let up = auth.split(/\r?\n/)[0].split(' ').filter(function(i){return i});
          emailer.auth.user = up[0].trim();
          emailer.auth.pass = up[1].trim();
          //console.log ( '"' + emailer.auth.user + '"' );
          //console.log ( '"' + emailer.auth.pass + '"' );
        } else  {
          emailer.auth.user = 'xxx';  // will fail
          emailer.auth.pass = 'xxx';  // will fail
          let msg = 'cannot read e-mail account data file ' + emailer.auth.file;
          log.standard ( 4,msg );
          log.error    ( 4,msg );
          log.standard ( 4,'e-mailer will not work' );
          log.error    ( 4,'e-mailer will not work' );
        }
      }
    }
  } else
    return 'emailer configuration is missing in file ' + confFilePath;

  return '';  // empty return is Ok

}

function setServerConfig ( server_config )  {
  work_server = server_config;
}


// ===========================================================================
// Assign ports function: assign available port numbers where they were set
// zero for localhosts

function assignPorts ( assigned_callback )  {

  let servers = [];

  function set_server ( config,callback )  {
    let server  = http.createServer();
    servers.push ( server );
    let port    = config.port;
    config.port = 0;
    server.on('error',function(e){
      if (e.code=='EADDRINUSE') {
        log.standard ( 6,'port ' + port + ' is busy; another port will be used' );
        callback();
      }
    });
    server.listen({
      host      : config.host,
      port      : port,
      exclusive : config.exclusive
    },function(){
      config.port = server.address().port;
      callback();
    });
  }

  function setServer ( key,n )  {

    switch (key)  {

      case 0: if (fe_server.isLocalHost && (fe_server.port>0))
                    set_server ( fe_server,function(){ setServer(1,0); } );
              else  setServer(1,0);
            break;

      case 1: if (!fe_proxy)
                    setServer(2,0);
              else if (fe_proxy.isLocalHost && (fe_proxy.port>0))
                    set_server ( fe_proxy,function(){ setServer(2,0); } );
              else  setServer(2,0);
            break;

      case 2: if (n<nc_servers.length)  {
                if (nc_servers[n].isLocalHost && (nc_servers[n].port>0))
                      set_server ( nc_servers[n],function(){ setServer(2,n+1); } );
                else  setServer(2,n+1);
              } else
                setServer ( 3,0 );
            break;

      case 3: if (fe_server.isLocalHost && (fe_server.port<=0))
                    set_server ( fe_server,function(){ setServer(4,0); } );
              else  setServer(4,0);
            break;

      case 4: if (!fe_proxy)
                    setServer(5,0);
              else if (fe_proxy.isLocalHost && (fe_proxy.port<=0))
                    set_server ( fe_proxy,function(){ setServer(5,0); } );
              else  setServer(5,0);
            break;

      case 5: if (n<nc_servers.length)  {
                if (nc_servers[n].isLocalHost && (nc_servers[n].port<=0))
                      set_server ( nc_servers[n],function(){ setServer(5,n+1); } );
                else  setServer(5,n+1);
              } else
                setServer ( 6,0 );
            break;

      case 6: default:
            break;

    }

  }

  setServer ( 0,0 );

  // ===========================================================================

  function checkServers ( callback )  {
    let b = (!fe_server.isLocalHost) || (fe_server.port>0);
    if (fe_proxy)
      b = b && ((!fe_proxy.isLocalHost) || (fe_proxy.port>0));
    nc_servers.forEach ( function(config){
      b = b && ((!config.isLocalHost) || (config.port>0));
    });
    if (b)
      callback();
    else
      setTimeout ( function(){checkServers(callback)},50 );
  }

  checkServers ( function(){

    log.standard ( 1,'FE: url=' + fe_server.url() );
    if (fe_proxy)
      log.standard ( 1,'FE-Proxy: url=' + fe_proxy.url() );
    for (let i=0;i<nc_servers.length;i++)
      log.standard ( 2,'NC['    + i + ']: name=' + nc_servers[i].name +
                       ' type=' + nc_servers[i].exeType +
                       ' url='  + nc_servers[i].url() );

    let nServers = servers.length;
    function oneDown()  {
      nServers--;
      if ((nServers<=0) && (assigned_callback))
        assigned_callback();
    }

    servers.forEach ( function(server){
      server.close ( oneDown );
    });

  });

}


function getClientInfo ( inData,callback_func )  {
let response = null;  // must become a cmd.Response object to return
  if (fe_server)  {
    let rData = {};
    if (client_server) rData.local_service = client_server.url();
                  else rData.local_service = null;
    if (fe_server && (inData==null))  rData.fe_url = fe_server.url();
                                else  rData.fe_url = null;
    rData.via_proxy = false;  // will be changed by porxy if necessary
    response = new cmd.Response ( cmd.fe_retcode.ok,'',rData );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.unconfigured,'','' );
  }
  callback_func ( response );
}


function getFEProxyInfo ( inData,callback_func )  {
let response = null;  // must become a cmd.Response object to return
  if (fe_server)  {
    let rData = {};
    rData.proxy_config   = fe_proxy;
    rData.fe_config      = fe_server;
    rData.ccp4_version   = CCP4Version();
    rData.jscofe_version = cmd.appVersion();
    rData.via_proxy      = false;  // will be changed by porxy if necessary
    response = new cmd.Response ( cmd.fe_retcode.ok,'',rData );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.unconfigured,'','' );
  }
  callback_func ( response );
}


function getAppStatus ( callback_func )  {
let status  = [];
let msg     = cmd.appName() + ' status: HEALTHY\n';
let nNCs    = 0;
let nNCDead = 0;

  function __trim_name ( name )  {
    if (name)  {
      let nm = com_utils.padStringRight ( name,' ',15 );
      if (nm.length>15) 
        nm = nm.slice(0,15);
      return nm;
    } else
      return com_utils.padStringRight ( ' ',' ',15 );
  }

  function __check_nc_server ( server_no )  {
    if (server_no>=nc_servers.length)  {
      if (nNCDead>0)
        status.push ( 'NCDEAD');
      if (status.length>0)
        msg = msg.replace ( 'HEALTHY',status.join(',') );
      callback_func ( msg );
    } else if (nc_servers[server_no] && nc_servers[server_no].in_use)  {
      nNCs++;
      nc_servers[server_no].checkNCStatus ( function(error,response,body,config){
        let servName = '\nNC' + com_utils.padStringLeft ( '' + server_no,'0',2 ) +
            ' ' + __trim_name(nc_servers[server_no].name);
        if ((error=='not-in-use') && (nc_counter>0))  {
          nNCDead++;
          msg += servName + '    misconfigured/not-in-use';
        } else if ((!error) && (response.statusCode==200))  {

          let codeVersion = response.body.version;
          let startDate   = response.body.data.config.startDate;
          let ccp4Version = response.body.data.ccp4_version;
  
          msg += servName + '    active   \"' + codeVersion + '\"   ' + ccp4Version + 
                 '      \"' + startDate + '\"';
          // msg += '\n\n' + JSON.stringify(response,null,2);
        } else  {
          nNCDead++;
          msg += servName + '    dead';
        }
        __check_nc_server ( server_no+1 );
      }); 
    } else  {
      __check_nc_server ( server_no+1 );
    }
  }

  msg += '\nSERVER                  STATUS      CODE VERSION         CCP4 VERS.            START DATE' +
         '\n------------------------------------------------------------------------------------------------------';

  if (!fe_server)  {
    status.push ( 'FEUNCONF' );
    msg += '\nFE       unconfigured';
  } else  {
    msg += '\nFE   ' + __trim_name(fe_server.description.name) + '    ' + fe_server.state +
           '   \"' + cmd.appVersion() + '\"   ' + CCP4Version() + '      \"' + 
           fe_server.startDate + '\"';
    if (fe_server.state!='active')
      status.push ( 'FEINACT' );
  }

  if (!nc_servers)  {

    status.push ( 'NCUNCONF' );
    msg += '\n\n +++ NC servers:   unconfigured';
    callback_func ( msg.replace ( 'HEALTHY',status.join(',') ) );

  } else  {

    // 'NC server #00:    active  "1.7.010 [03.02.2023]"     8.0.009      Sun, 05 Feb 2023 05:01:13 GMT'
    __check_nc_server ( 0 );

  }

}


// ==========================================================================
// write configuration function

function writeConfiguration ( fpath )  {

  let confObj = {};
  if (desktop)    confObj['Desktop']         = desktop;
  if (fe_server)  confObj['FrontEnd']        = fe_server;
  if (fe_proxy)   confObj['FEProxy']         = fe_proxy;
  if (nc_servers) confObj['NumberCrunchers'] = nc_servers;
  if (emailer)    confObj['Emailer']         = emailer;

  if (utils.writeObject(fpath,confObj))
        log.standard ( 3,'configuration written to ' + fpath );
  else  log.error    ( 3,'error writing to ' + fpath );

}


function isSharedFileSystem()  {
// Returns true in case of shared file system setup, i.e. when access to data
// on client and at least one NC is possible via the file system mount.
let isFSClient = false;
let isFSNC     = false;
let isClient   = false;

  for (let i=0;i<nc_servers.length;i++)
    if (nc_servers[i].in_use)  {
      if (nc_servers[i].exeType=='CLIENT')  {
        isClient   = true;
        isFSClient = (nc_servers[i].fsmount != null);
      } else if (nc_servers[i].fsmount != null)
        isFSNC = true;
    }

  return isClient && isFSClient && isFSNC;

}


function isLocalSetup()  {
// Returns true if all servers are running on localhost.
let isLocal = fe_server.localSetup;
  for (let i=0;(i<nc_servers.length) && isLocal;i++)
    isLocal = nc_servers[i].localSetup;
  return isLocal;
}


function getRegMode()  {
  let mode = 'email';
  if ('regMode' in fe_server)
    mode = fe_server.regMode;
  if (mode=='email')  {
    if (emailer)  {
      if (emailer.type=='desktop')
        mode = 'admin';
    } else
      mode = 'admin';
  }
  return mode;
}

function isLocalFE()  {
// returns true if FE is on local machine
  return fe_server.localSetup;
}

function isArchive()  {
// returns true if CCP4 Cloud Archive is configured
  return fe_server.isArchive();
}
  
function getFETmpDir()  {
  return path.join ( getFEConfig().storage,'tmp' );
}

function cleanFETmpDir()  {
  utils.cleanDir ( getFETmpDir() );
}

function getFETmpDir1 ( loginData )  {
  return path.join ( getFEConfig().getVolumeDir(loginData),'tmp' );
}

function cleanFETmpDir1 ( loginData )  {
  utils.cleanDir ( getFETmpDir1(loginData) );
}

function getSetupID()  {
  if ((fe_server.hasOwnProperty('description')) && fe_server.description.id)
    return fe_server.description.id;
  if (isLocalFE())
    return '<client-side setup>';
  return '<unnamed setup>';
}

function getNCTmpDir()  {
  return path.join ( getServerConfig().storage,'tmp' );
}

function cleanNCTmpDir()  {
  utils.cleanDir ( getNCTmpDir() );
}

function getTmpDir()  {
  if ('storage' in work_server)  return getNCTmpDir();
                           else  return getFETmpDir();
}

function getTmpFile()  {
  let tmpDir = getTmpDir();
  if (!utils.fileExists(tmpDir))  {
    if (!utils.mkDir(tmpDir))  {
      log.error ( 5,'temporary directory ' + tmpDir + ' cannot be created' );
      return null;
    }
  }
  let fname  = '';
  do {
    fname = path.join ( tmpDir,'tmp_'+crypto.randomBytes(20).toString('hex') );
  } while (utils.fileExists(fname));
  return fname;
}


function isWindows()  {
  return /^win/.test(process.platform);
}


function getExcludedTasks()  {
// Returns list of tasks excluded on all number crunchers.
// NB: does not take into account servers with 'only_tasks' lists.
let excluded = [];

  for (let i=0;i<nc_servers.length;i++)
    if (nc_servers[i].in_use)  {
      let excl = nc_servers[i].exclude_tasks;
      for (let j=0;j<excl.length;j++)
        if (excluded.indexOf(excl[j])<0)
          excluded.push ( excl[j] );
    }

  for (let i=0;i<nc_servers.length;i++)
    if (nc_servers[i].in_use)  {
      let excl = nc_servers[i].exclude_tasks;
      for (let j=excluded.length-1;j>=0;j--)
        if (excl.indexOf(excluded[j])<0)
          excluded.splice ( j,1 );
    }

  return excluded.concat ( fe_server.exclude_tasks );

}

function checkOnUpdate ( callback_func )  {
  try {
    if ('CCP4' in process.env)  {
      let ccp4um = path.join ( process.env.CCP4,'libexec','ccp4um-bin' );
      if (utils.fileExists(ccp4um))  {
        let job = utils.spawn ( ccp4um,['-check-silent'],{} );
        job.on ( 'close',function(code){
          callback_func ( code );  // <254:  number of updates available
                                   //  254:  CCP4 release
                                   //  255:  no connection
          // console.log ( ' >>>> code=' + code );
        });
      } else  {
        setTimeout ( function(){
          callback_func ( 255 );  // <254:  number of updates available
                                   //  254:  CCP4 release
                                   //  255:  no connection
        },10);
      }
    }
  } catch(e)  {
    setTimeout ( function(){
      callback_func ( 255 );  // <254:  number of updates available
                               //  254:  CCP4 release
                               //  255:  no connection
    },10);
  }
}


// ==========================================================================
// export for use in node
module.exports.getDesktopConfig   = getDesktopConfig;
module.exports.getServerConfig    = getServerConfig;
module.exports.getFEConfig        = getFEConfig;
module.exports.getFEProxyConfig   = getFEProxyConfig;
module.exports.getNCConfig        = getNCConfig;
module.exports.getNCConfigs       = getNCConfigs;
module.exports.getNumberOfNCs     = getNumberOfNCs;
module.exports.getClientNCConfig  = getClientNCConfig;
module.exports.getEmailerConfig   = getEmailerConfig;
module.exports.readConfiguration  = readConfiguration;
module.exports.setServerConfig    = setServerConfig;
module.exports.assignPorts        = assignPorts;
module.exports.writeConfiguration = writeConfiguration;
module.exports.pythonName         = pythonName;
module.exports.pythonVersion      = pythonVersion;
module.exports.setPythonVersion   = setPythonVersion;
module.exports.isSharedFileSystem = isSharedFileSystem;
module.exports.isLocalSetup       = isLocalSetup;
module.exports.isArchive          = isArchive;
module.exports.getClientInfo      = getClientInfo;
module.exports.getFEProxyInfo     = getFEProxyInfo;
module.exports.getAppStatus       = getAppStatus;
module.exports.getRegMode         = getRegMode;
module.exports.isLocalFE          = isLocalFE;
module.exports.getSetupID         = getSetupID;
module.exports.getFETmpDir        = getFETmpDir;
module.exports.getFETmpDir1       = getFETmpDir1;
module.exports.getNCTmpDir        = getNCTmpDir;
module.exports.getTmpDir          = getTmpDir;
module.exports.getTmpFile         = getTmpFile;
module.exports.cleanFETmpDir      = cleanFETmpDir;
module.exports.cleanFETmpDir1     = cleanFETmpDir1;
module.exports.cleanNCTmpDir      = cleanNCTmpDir;
module.exports.CCP4Version        = CCP4Version;
module.exports.CCP4DirName        = CCP4DirName;
module.exports.isWindows          = isWindows;
module.exports.windows_drives     = windows_drives;
module.exports.set_python_check   = set_python_check;
module.exports.getExcludedTasks   = getExcludedTasks;
module.exports.checkOnUpdate      = checkOnUpdate;
