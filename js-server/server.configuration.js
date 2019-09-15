
/*
 *  =================================================================
 *
 *    15.09.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


//  load system modules
var path    = require('path');
var http    = require('http');
var crypto  = require('crypto');
var request = require('request');

//  load application modules
var utils   = require('./server.utils');
var cmd     = require('../js-common/common.commands');

//  prepare log
var log    = require('./server.log').newLog(3);


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

var windows_drives = [];   // list of Windows drives

function listWindowsDrives ( callback_func )  {
  if (isWindows())  {
    var child = require('child_process');
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

function ServerConfig()  {
  this.protocol      = 'http';
  this.host          = 'localhost';
  this.port          = 'port';
  this.externalURL   = '';
  this.exclude_tasks = [];   // tasks that should not run on given server
  this.only_tasks    = [];   // tasks that server can only run
  this.startDate     = new Date(Date.now()).toUTCString();
}

ServerConfig.prototype.url = function()  {
  if (this.port>0)  {
    // this works on FE side
    return this.protocol + '://' + this.host + ':' + this.port
  } else  {
    // this may be used on NC side if FE uses redirection from
    // its main server, e.g.  http://fe.apache.com/jscofe ->
    // http://localhost:8081 . In this case, set 'host' to
    // 'apache.com' and use port=0
   return this.protocol + '://' + this.host
  }
}

ServerConfig.prototype.getQueueName = function()  {
  if ('exeType' in this)  {
    if (this.exeType=='SGE')  {
      var n = this.exeData.indexOf('-q');
      if ((n>=0) && (n<this.exeData.length-1))
        return this.exeData[n+1];
    }
  }
  return '-';
}

ServerConfig.prototype.getPIDFilePath = function()  {
var pidfilepath = null;
  if ('storage' in this)
        pidfilepath = path.join ( this.storage,'pid.dat' );
  else  pidfilepath = path.join ( this.projectsPath,'pid.dat' );
  return pidfilepath;
}

ServerConfig.prototype.savePID = function()  {
  utils.writeString ( this.getPIDFilePath(),process.pid.toString() );
}

ServerConfig.prototype.killPrevious = function()  {
var pidfile = this.getPIDFilePath();
var pid     = utils.readString ( pidfile );
  if (pid)  {
    utils.killProcess ( pid     );
    utils.removeFile  ( pidfile );
  }
}

ServerConfig.prototype.getMaxNProc = function()  {
// returns maximal number of process a task is allowed to spawn
var nproc = 1;
  if ('exeType' in this)  {
    if ('capacity' in this)
      nproc = this.capacity;
    if (this.exeType!='CLIENT')
      nproc = Math.floor ( nproc/4 );
    if ('max_nproc' in this)
      nproc = Math.min(nproc,this.max_nproc);
  }
  return Math.max(1,nproc);
}


function _make_path ( filepath,login )  {
var plist;
  if (filepath.constructor === Array)  {
    // list of paths is used when environmental variables depend on OS
    for (var i=0;i<filepath.length;i++)  {
      // paths in config file always to have '/' separator
      if (login)  plist = filepath[i].replace(/\$LOGIN/g,login).split('/');
            else  plist = filepath[i].split ( '/' );
      var found = false;
      for (var j=0;j<plist.length;j++)  {
        if (plist[j].startsWith('$'))  {
          var env_name = plist[j].slice(1)
          if (process.env.hasOwnProperty(env_name))  {
            plist[j] = process.env[env_name];
            found    = true;
          }
        }
      }
      if (found)
        return plist.join ( path.sep ); // return path with system's separator
    }
  } else  {
    // paths in config file always to have '/' separator
    if (login)  plist = filepath.replace(/\$LOGIN/g,login).split('/');
          else  plist = filepath.split ( '/' );
    var found = true;
    for (var i=0;i<plist.length;i++)
      if (plist[i].startsWith('$'))  {
        var env_name = plist[i].slice(1)
        if (process.env.hasOwnProperty(env_name))
          plist[i] = process.env[env_name];
        else
          found = false;
      }
    if (found)
      return plist.join ( path.sep ); // return path with system's separator
  }
  return null;
}


ServerConfig.prototype.getCloudMounts = function ( login )  {
var paths = [];
  if ('cloud_mounts' in this)  {
    for (name in this.cloud_mounts)  {
      var cloud_path = _make_path ( this.cloud_mounts[name],login );
      if (cloud_path)
        paths.push ( [name,cloud_path] );
    }
  }
  return paths;
}

ServerConfig.prototype.getDemoProjectsMount = function()  {
  var mount = null;
  if (this.hasOwnProperty('cloud_mounts'))  {
    for (name in this.cloud_mounts)  {
      var lname = name.toLowerCase();
      if ((lname.indexOf('demo')>=0) && (lname.indexOf('projects')>=0))  {
        mount = name;
        break;
      }
    }
  }
  return mount;
}

ServerConfig.prototype.getJobsSafe = function()  {
  if (this.hasOwnProperty('jobs_safe'))
    return this.jobs_safe;
  return {
    'path'     : path.join(this.storage,'jobs_safe'),
    'capacity' : 10
  };
}

ServerConfig.prototype.checkStatus = function ( callback_func )  {

  request({
    uri     : cmd.nc_command.getNCInfo,
    baseUrl : this.externalURL,
    method  : 'POST',
    body    : '',
    json    : true
  },function(error,response,body){
    callback_func ( error,response,body,this );
  });

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
  return nc_servers[ncNumber];
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
var version = '';
  if (process.env.hasOwnProperty('CCP4'))  {
    var s = utils.readString ( path.join(process.env.CCP4,'lib','ccp4','MAJOR_MINOR') );
    if (s)
      version = s.split(/,?\s+/)[0];
  }
  return version;
}


// ===========================================================================
// Config read function

/*  --------------------------------------------------------------------------

{
  "FrontEnd" : {
    "description"      : {
      "id"   : "ccp4",
      "name" : "CCP4-Harwell",
      "icon" : "images_com/ccp4-harwell.png"
    },
    "protocol"         : "http",
    "host"             : "localhost",
    "port"             : 8081,
    "externalURL"      : "http://localhost:8081",
    "exclusive"        : true,
    "stoppable"        : false,
    "exclude_tasks"    : [],
    "fsmount"          : "/",
    "userDataPath"     : "./cofe-users",
    "projectsPath"     : "./cofe-projects",
    "facilitiesPath"   : "./cofe-facilities",
    "ICAT_wdsl"        : "https://icat02.diamond.ac.uk/ICATService/ICAT?wsdl",
    "ICAT_ids"         : "https://ids01.diamond.ac.uk/ids",
    "bootstrapHTML"    : "jscofe.html",
    "maxRestarts"      : 100,
    "fileCapSize"      : 500000,
    "regMode"          : "admin",
    "sessionCheckPeriod" : 2000,
    "ration"           : {
        "storage"   : 3000,
        "cpu_day"   : 24,
        "cpu_month" : 240
    },
    "cloud_mounts"     : {
      "My Computer"    : "/",
      "Home"           : ["$HOME","$USERPROFILE"],
      "CCP4 examples"  : "$CCP4/share/ccp4i2/demo_data",
      "Demo projects"  : "./demo-projects",
      "My files"       : "./$LOGIN/files"
    }
  },

  "FEProxy" : {
    "protocol"         : "http",
    "host"             : "localhost",
    "port"             : 8082,
    "externalURL"      : "http://localhost:8082",
    "exclusive"        : true,
    "stoppable"        : false
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
      "fsmount"          : "/",
      "capacity"         : 4,
      "max_nproc"        : 3,
      "exclude_tasks"    : [],
      "only_tasks"       : [],
      "fasttrack"        : 1,
      "storage"          : "./cofe-nc-storage",
      "jobs_safe"        : {
          "path"     : "./cofe-nc-storage/jobs_safe",
          "capacity" : 10
      },
      "exeType"          : "SHELL",
      "jobManager"       : "SLURM",
      "exeData"          : "",
      "jobCheckPeriod"   : 2000,
      "sendDataWaitTime" : 1000,
      "maxSendTrials"    : 10,
      "jobRemoveTimeout" : 10000,
      "maxRestarts"      : 100,
      "fileCapSize"      : 500000
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
      "fsmount"          : "/",
      "capacity"         : 4,
      "exclude_tasks"    : [],
      "only_tasks"       : [],
      "fasttrack"        : 1,
      "storage"          : "./cofe-client-storage",
      "exeType"          : "CLIENT",
      "exeData"          : "",
      "jobCheckPeriod"   : 2000,
      "sendDataWaitTime" : 1000,
      "maxSendTrials"    : 10,
      "jobRemoveTimeout" : 10000,
      "maxRestarts"      : 100,
      "fileCapSize"      : 500000
    }
  ],

  "Emailer" : {
    "type"               : "nodemailer",
    "emailFrom"          : "CCP4 on-line <ccp4.cofe@gmail.com>",
    "maintainerEmail"    : "ccp4.cofe@gmail.com",
    "host"               : "smtp.gmail.com",
    "port"               : 465,
    "secure"             : true,
    "auth"               : {
      "user" : "ccp4.cofe@gmail.com",
      "pass" : "ccp4.cofe.2016"
    }
  }

}

--------------------------------------------------------------------------  */


function readConfiguration ( confFilePath,serverType )  {

  var confObj = utils.readObject ( confFilePath );

  if (!confObj)
    return 'configuration file ' + confFilePath + ' not found';

  if (confObj.hasOwnProperty('Desktop'))
    desktop = confObj.Desktop;

  if (confObj.hasOwnProperty('FrontEnd')) {
    fe_server  = new ServerConfig();
    for (var key in confObj.FrontEnd)
      fe_server[key] = confObj.FrontEnd[key];
    if (!fe_server.externalURL)
      fe_server.externalURL = fe_server.url();
    fe_server.userDataPath = _make_path ( fe_server.userDataPath,null );
    fe_server.projectsPath = _make_path ( fe_server.projectsPath,null );
    if (!fe_server.hasOwnProperty('sessionCheckPeriod'))
      fe_server.sessionCheckPeriod = 2000;  // ms
    if (isWindows())
      listWindowsDrives ( function(){
        if (fe_server.hasOwnProperty('cloud_mounts'))  {
          if (fe_server.cloud_mounts.hasOwnProperty('My Computer'))  {
            var cmounts = {};
            for (var i=0;i<windows_drives.length;i++)
              cmounts['My Computer ' + windows_drives[i]] = windows_drives[i] + '/';
            for (var mount in fe_server.cloud_mounts)
              if (mount!='My Computer')
               cmounts[mount] = fe_server.cloud_mounts[mount];
            fe_server.cloud_mounts = cmounts;
          }
        }
      });
    /*
    if (!fe_server.hasOwnProperty("description"))
      fe_server.description = {
        "id"   : "ccp4",
        "name" : "CCP4-Harwell",
        "icon" : "images_com/ccp4-harwell.png"
      };
    */
  } else if ((serverType=='FE') || (serverType=='FE-PROXY'))
    return 'front-end configuration is missing in file ' + confFilePath;

  if (confObj.hasOwnProperty('FEProxy')) {
    fe_proxy = new ServerConfig();
    for (var key in confObj.FEProxy)
      fe_proxy[key] = confObj.FEProxy[key];
    if (!fe_proxy.externalURL)
      fe_proxy.externalURL = fe_proxy.url();
  } else if (serverType=='FE-PROXY')
    return 'front-end proxy configuration is missing in file ' + confFilePath;

  if (confObj.hasOwnProperty('NumberCrunchers')) {
    client_server = null;
    nc_servers    = [];
    for (var i=0;i<confObj.NumberCrunchers.length;i++)  {
      var nc_server = new ServerConfig();
      for (var key in confObj.NumberCrunchers[i])
        nc_server[key] = confObj.NumberCrunchers[i][key];
      nc_server.current_capacity = nc_server.capacity;
      if (!nc_server.externalURL)
        nc_server.externalURL = nc_server.url();
      nc_server.storage = _make_path ( nc_server.storage,null );
      nc_servers.push ( nc_server );
      if (nc_server.exeType=='CLIENT')
        client_server = nc_server;
      if (!nc_server.hasOwnProperty('jobManager'))
        nc_server.jobManager = nc_server.exeType;
    }
  } else
    return 'number cruncher(s) configuration is missing in file ' + confFilePath;

  if (confObj.hasOwnProperty('Emailer')) {
    emailer = confObj.Emailer;
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

  var servers = [];

  function set_server ( config,callback )  {
    var server  = http.createServer();
    servers.push ( server );
    var port    = config.port;
    config.port = 0;
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

      case 0: if (fe_server.port>0)
                    set_server ( fe_server,function(){ setServer(1,0); } );
              else  setServer(1,0);
            break;

      case 1: if (!fe_proxy)
                    setServer(2,0);
              else if (fe_proxy.port>0)
                    set_server ( fe_proxy,function(){ setServer(2,0); } );
              else  setServer(2,0);
            break;

      case 2: if (n<nc_servers.length)  {
                if (nc_servers[n].port>0)
                      set_server ( nc_servers[n],function(){ setServer(2,n+1); } );
                else  setServer(2,n+1);
              } else
                setServer ( 3,0 );
            break;

      case 3: if ((fe_server.host=='localhost') && (fe_server.port<=0))
                    set_server ( fe_server,function(){ setServer(4,0); } );
              else  setServer(4,0);
            break;

      case 4: if (!fe_proxy)
                    setServer(5,0);
              else if ((fe_proxy.host=='localhost') && (fe_proxy.port<=0))
                    set_server ( fe_proxy,function(){ setServer(5,0); } );
              else  setServer(5,0);
            break;

      case 5: if (n<nc_servers.length)  {
                if ((nc_servers[n].host=='localhost') && (nc_servers[n].port<=0))
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
    var b = (fe_server.host!='localhost') || (fe_server.port>0);
    nc_servers.forEach ( function(config){
      b = b && ((config.host!='localhost') || (config.port>0));
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
    for (var i=0;i<nc_servers.length;i++)
      log.standard ( 2,'NC['    + i + ']: name=' + nc_servers[i].name +
                       ' type=' + nc_servers[i].exeType +
                       ' url='  + nc_servers[i].url() );

    var nServers = servers.length;
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
var response = null;  // must become a cmd.Response object to return
  if (fe_server)  {
    var rData = {};
    if (client_server) rData.local_service = client_server.url();
                  else rData.local_service = null;
    response = new cmd.Response ( cmd.fe_retcode.ok,'',rData );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.unconfigured,'','' );
  }
  callback_func ( response );
}


// ==========================================================================
// write configuration function

function writeConfiguration ( fpath )  {

  var confObj = {};
  if (desktop)    confObj['Desktop']         = desktop;
  if (fe_server)  confObj['FrontEnd']        = fe_server;
  if (nc_servers) confObj['NumberCrunchers'] = nc_servers;
  if (emailer)    confObj['Emailer']         = emailer;

  if (utils.writeObject(fpath,confObj))
        log.standard ( 3,'configuration written to ' + fpath );
  else  log.error ( 4,'error writing to ' + fpath );

}


var _python_name = 'ccp4-python';
function pythonName()  {
  return _python_name;
}


function isSharedFileSystem()  {
// Returns true in case of shared file system setup, i.e. when access to data
// on client and at least one NC is possible via the file system mount.
var isFSClient = false;
var isFSNC     = false;
var isClient   = false;

  for (var i=0;i<nc_servers.length;i++)
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
/*
var isLocal = (fe_server.host == 'localhost');

  for (var i=0;(i<nc_servers.length) && isLocal;i++)
    isLocal = (nc_servers[i].host == 'localhost');
*/
var isLocal = true;

  if (fe_server.externalURL.length>0)
        isLocal = (fe_server.externalURL.indexOf('localhost') >= 0);
  else  isLocal = (fe_server.host == 'localhost');

  for (var i=0;(i<nc_servers.length) && isLocal;i++)
    if (nc_servers[i].externalURL.length>0)
          isLocal = (nc_servers[i].externalURL.indexOf('localhost') >= 0);
    else  isLocal = (nc_servers[i].host == 'localhost');

  return isLocal;

}

function getRegMode()  {
  var mode = 'email';
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
  if (fe_server.externalURL.length>0)
    return (fe_server.externalURL.indexOf('localhost') >= 0);
  return (fe_server.host == 'localhost');
}


function getFETmpDir()  {
  return path.join ( getFEConfig().projectsPath,'tmp' );
}

function getSetupID()  {
  if (fe_server.hasOwnProperty('description'))
    return fe_server.description.id;
  return '';
}

function getNCTmpDir()  {
  return path.join ( getServerConfig().storage,'tmp' );
}

function getTmpDir()  {
  if ('storage' in work_server)  return getNCTmpDir();
                           else  return getFETmpDir();
}

function getTmpFile()  {
  var tmpDir = getTmpDir();
  if (!utils.fileExists(tmpDir))  {
    if (!utils.mkDir(tmpDir))  {
      log.error ( 5,'temporary directory ' + tmpDir + ' cannot be created' );
      return null;
    }
  }
  var fname  = '';
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
var excluded = [];

  for (var i=0;i<nc_servers.length;i++)
    if (nc_servers[i].in_use)  {
      var excl = nc_servers[i].exclude_tasks;
      for (var j=0;j<excl.length;j++)
        if (excluded.indexOf(excl[j])<0)
          excluded.push ( excl[j] );
    }

  for (var i=0;i<nc_servers.length;i++)
    if (nc_servers[i].in_use)  {
      var excl = nc_servers[i].exclude_tasks;
      for (var j=excluded.length-1;j>=0;j--)
        if (excl.indexOf(excluded[j])<0)
          excluded.splice ( j,1 );
    }

  return excluded.concat ( fe_server.exclude_tasks );

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
module.exports.isSharedFileSystem = isSharedFileSystem;
module.exports.isLocalSetup       = isLocalSetup;
module.exports.getClientInfo      = getClientInfo;
module.exports.getRegMode         = getRegMode;
module.exports.isLocalFE          = isLocalFE;
module.exports.getSetupID         = getSetupID;
module.exports.getFETmpDir        = getFETmpDir;
module.exports.getNCTmpDir        = getNCTmpDir;
module.exports.getTmpDir          = getTmpDir;
module.exports.getTmpFile         = getTmpFile;
module.exports.CCP4Version        = CCP4Version;
module.exports.isWindows          = isWindows;
module.exports.windows_drives     = windows_drives;
module.exports.getExcludedTasks   = getExcludedTasks;
