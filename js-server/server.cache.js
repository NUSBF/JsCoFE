
/*
 *  =================================================================
 *
 *    25.10.24   <--  Date of Last Modification.
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

// const fs    = require('fs-extra');
const path  = require('path');

// const conf  = require('./server.configuration');
// const utils = require('./server.utils');

// const com_utils = require('../js-common/common.utils');


//  prepare log
// const log = require('./server.log').newLog(29);


// ==========================================================================

// const __userDataExt = '.user';

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

// --------------------------------------------------------------------------

var userCache = new Cache();

const __userDataExt = '.user';

function itemExists ( fpath )  {
  if (fpath.endsWith(__userDataExt))
    return userCache.itemExists ( path.basename(fpath,__userDataExt) );
  return -1; // file operation is required
}

function removeItem ( fpath )  {
  if (fpath.endsWith(__userDataExt))
    return userCache.removeItem ( path.basename(fpath,__userDataExt) );
}

function getItem ( fpath )  {
  if (fpath.endsWith(__userDataExt))
    return userCache.getItem ( path.basename(fpath,__userDataExt) );
  return null; // file operation is required
}

function putItem ( fpath,item )  {
  if (fpath.endsWith(__userDataExt))  {
    userCache.putItem ( path.basename(fpath,__userDataExt),item );
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
// module.exports.Cache      = Cache;
module.exports.itemExists = itemExists;
module.exports.removeItem = removeItem;
module.exports.getItem    = getItem;
module.exports.putItem    = putItem;
