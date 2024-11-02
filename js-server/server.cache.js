
/*
 *  =================================================================
 *
 *    02.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.cache.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  File cache
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

'use strict';

const fs    = require('fs-extra');
const path  = require('path');

// const conf  = require('./server.configuration');
// const utils = require('./server.utils');

// const com_utils = require('../js-common/common.utils');


//  prepare log
const log = require('./server.log').newLog(29);


// ==========================================================================

function Cache ( maxItems=0 )  {
  this.cache = {};
  this.maxItems = maxItems;  // maximum number of items, "0" means unlimited
}

Cache.prototype.reset = function()  {
  this.cache = {};
}

Cache.prototype.setMaxSize = function ( maxItems )  {
  this.maxItems = maxItems;  // maximum number of items, "0" means unlimited
  this.trim();
}

Cache.prototype.size = function()  {
  return Object.keys(this.cache).length;
}

Cache.prototype.trim = function()  {
  if (this.maxItems>0)  {
    let keys = Object.keys(this.cache);
    for (let i=0;i<keys.length-this.maxItems;i++)
      delete this.cache[keys[i]];
  }
}

Cache.prototype.itemExists = function ( key )  {
  if (key in this.cache)
    return 1;
  return 0;
}

Cache.prototype.removeItem = function ( key )  {
  if (key in this.cache)
    delete this.cache[key];
}

Cache.prototype.removeItems = function ( key_prefix )  {
  let keys = Object.keys(this.cache);
  for (let i=0;i<keys.length;i++)
    if (keys[i].startsWith(key_prefix))
      delete this.cache[keys[i]];
}


Cache.prototype.getItem = function ( key )  {
  if (key in this.cache)
    return this.cache[key];
  return null;
}

Cache.prototype.putItem = function ( key,item )  {
  this.cache[key] = item;
  this.trim();
}


/*

Cache.prototype.putItem = function ( key,item )  {
  this.cache[key] = item;
  this.trim();
}

Cache.prototype.getItem = function ( key )  {
  if (key in this.cache)
    return this.cache[key];
  return null;
}

Cache.prototype.putObjectSync = function ( obj,key,file_path )  {
  this.putItem ( key,obj );
  return utils.writeObject ( file_path,obj,false,null );  // asynchronous
}

Cache.prototype.putObjectAsync = function ( obj,key,file_path,callback_func=null )  {
  this.putItem ( key,obj );
  return utils.writeObject ( file_path,obj,true,callback_func );  // asynchronous
}

Cache.prototype.getObject = function ( key,file_path )  {
  if (key in this.cache)
    return this.cache[key];
  return utils.readObject ( file_path );
}
*/

const projectExt      = '.prj';
const userProjectsExt = '.projects';

function getProjectKey ( fpath )  {
  // This key is used for caching project metadata. We check on symbolic link 
  // because of possible shared projects. This is a point of inefficiency
  let index = fpath.lastIndexOf ( projectExt );
  if (index>0)  {
    let dpath = fpath.substring ( 0,index ) + projectExt;
    let stat  = fs.lstatSync ( dpath );
    if (stat)  {
      if (stat.isSymbolicLink())
        dpath = fs.readlinkSync ( dpath )
      let upath = path.dirname  ( dpath );  // user projects
      if (upath.endsWith(userProjectsExt))
        return  path.basename(upath,userProjectsExt) + ':' +
                path.basename(dpath,projectExt);
    }
  }
  return null;
}

function getDirKey ( fpath )  {
  // This key is used at deleting directories. In this case, we do not check on
  // symbolic link because we do not want to flush original items from the cache,
  // even though that would be harmless
  if (fpath.endsWith(userProjectsExt))
    return path.basename ( fpath,userProjectsExt );  // user name
  if (fpath.endsWith(projectExt))  {
    let index = fpath.lastIndexOf ( projectExt );
    let dpath = fpath.substring ( 0,index );
    let upath = path.dirname  ( dpath );
    if (upath.endsWith(userProjectsExt))
      return path.basename(upath,userProjectsExt) + ':' + 
             path.basename(dpath);  // user:project
  }
  return null;
}


// --------------------------------------------------------------------------

// const __userDataExt   = '.user';
// const __rationFileExt = '.ration';

// Assume 50 projects/user on average; this is important only for repeat
// loading of project lists, which is rather rare. At all other times, 
// user works with just a single project
const nprj_per_user = 50;

const cache_list = {
  '.user'        : new Cache(0),
  '.ration'      : new Cache(0),
  'project.desc' : new Cache(2500),
  'project.meta' : new Cache(2500)
};

var cache_enabled = false;

function configureCache ( ncache )  {
  // ncache is estimated number of users working simultaneously in the system
  cache_enabled = (ncache>0);
  if (cache_enabled)  {
    log.standard ( 1,'metadata cache is turned on' );
    cache_list['project.desc'].setMaxSize ( nprj_per_user*ncache );
    cache_list['project.meta'].setMaxSize ( nprj_per_user*ncache );
  } else
    log.standard ( 2,'metadata cache is turned off' );
}

function isCacheEnabled()  {
  return cache_enabled;
}

function selectCache ( fpath )  {
  let r = {
    cache : null,
    key   : ''
  };
  let ext = path.extname ( fpath );
  if (ext in cache_list)  {
    r.key = path.basename ( fpath,ext );
    r.cache = cache_list[ext];
  } else  {
    let fname = path.basename ( fpath );
    if (fname in cache_list)  {
      r.key = getProjectKey ( fpath );
      if (r.key)
        r.cache = cache_list[fname];
    }
  }
  // console.log ( ' ..... cache: ' + cache_list['.user'].size()   + ' ' +
  //                                  cache_list['.ration'].size() + ' ' +
  //                                  cache_list['project.desc'].size() + ' ' +
  //                                  cache_list['project.meta'].size() );
  return r;
}


function itemExists ( fpath )  {
  let r = selectCache ( fpath );
  if (r.cache)
    return r.cache.itemExists ( r.key );
  return -1; // file operation is required
}

function removeItem ( fpath )  {
  let r = selectCache ( fpath );
  if (r.cache)
    r.cache.removeItem ( r.key );
}

function removeItems ( dirpath )  {
  // to be used when a directory is removed
  let key_prefix = getDirKey ( dirpath );
  if (key_prefix)
    for (let c in cache_list)
      cache_list[c].removeItems ( key_prefix );
}


function getItem ( fpath )  {
  let r = selectCache ( fpath );
  if (r.cache)
    return r.cache.getItem ( r.key );
  return null; // file operation is required
}

function putItem ( fpath,item )  {
  let r = selectCache ( fpath );
  if (r.cache)  {
    r.cache.putItem ( r.key,item );
    return true;
  }
  return false;
}


// --------------------------------------------------------------------------
/*
function UserCache ( maxItems=0 )  {
  Cache.call ( this,maxItems );
  this.userDirPath    = conf.getFEConfig().userDataPath;
  this.userDataExt    = '.user';
  this.suspend_prefix = '**suspended**';
}

UserCache.prototype = Object.create ( Cache.prototype );
UserCache.prototype.constructor = UserCache;

UserCache.prototype.userDataPath = function ( login_name )  {
  return path.join ( this.userDirPath,login_name + this.userDataExt ); 
}

UserCache.prototype.userExists = function ( login_name )  {
  return this.itemExists ( login_name,this.userDataPath(login_name) );
}

UserCache.prototype.suspendUser = function ( userData )  {
  let ulogin     = userData.login;
  userData.login = this.suspend_prefix + userData.login;  // suspend
  this.updateUserDataSync ( userData );                // commit
  userData.login = ulogin;
}

UserCache.prototype.updateUserDataSync = function ( userData )  {
  return this.putObjectSync ( userData,userData.login,this.userDataPath(login_name) );
}

UserCache.prototype.updateUserDataAsync = function ( userData )  {
  return this.putObjectAsync ( userData,userData.login,this.userDataPath(login_name) );
}

UserCache.prototype.getUserData = function ( userFilePath )  {
  return this.getObject ( path.basename(userFilePath,path.extname(userFilePath)),
                                         userFilePath );
}

UserCache.prototype.getUserDataByLogin = function ( login_name )  {
  return this.getObject ( login_name,this.userDataPath(login_name) );
}

UserCache.prototype.deleteUserData = function ( login_name )  {
  if (login_name in this.cache)
    delete this.cache[login_name];
  return utils.removeFile ( this.userDataPath(login_name) );
}
*/

// ==========================================================================
// export for use in node

module.exports.isCacheEnabled = isCacheEnabled;
module.exports.configureCache = configureCache;
module.exports.itemExists     = itemExists;
module.exports.removeItem     = removeItem;
module.exports.removeItems    = removeItems;
module.exports.getItem        = getItem;
module.exports.putItem        = putItem;
