
/*
 *  =================================================================
 *
 *    16.11.24   <--  Date of Last Modification.
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

const os    = require('os');
const fs    = require('fs-extra');
const path  = require('path');

//  prepare log
const log = require('./server.log').newLog(29);

// ==========================================================================

// these constants duplicate definitions in other files -- keep in sync

const __userDataExt    = '.user';
const __rationFileExt  = '.ration';
const projectDataFName = 'project.meta';
const projectDescFName = 'project.desc';
const projectListFName = 'projects.list';
const jobDataFName     = 'job.meta';
const jobDirPrefix     = 'job_';

const projectExt       = '.prj';
const userProjectsExt  = '.projects';

var cache_enabled      = false;
var force_write_sync   = true;  // needs to be true, a race between JS and Python
                                // processes detected in local mode

// --------------------------------------------------------------------------

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
  // console.log ( ' >>>>>> remove key ' + key );
  if (key in this.cache)
    delete this.cache[key];
}

Cache.prototype.removeItems = function ( key_prefix )  {
  let keys = Object.keys(this.cache);
  for (let i=0;i<keys.length;i++)
    if (keys[i].startsWith(key_prefix))
      delete this.cache[keys[i]];
}

Cache.prototype.readCache = function ( key,fpath )  {
  
  if (key in this.cache)
    return this.cache[key].data;

  if (fpath)  {
    try {
      // console.log ( ' >>>> cread-1 ' + fpath )
      let data_str = fs.readFileSync(fpath).toString();
      this.cache[key] = {
        data : data_str,
        sync : true
      };
      this.trim();
      return data_str;
    } catch (e)  {
      if (e.code !== 'ENOENT')  {
        log.error ( 1, e.message + ' when reading ' + fpath );
        console.error ( e );
      }
    }
  }

  return null;

}


function write_async ( fpath,item )  {
  item.sync = true;
  fs.writeFile ( fpath,item.data,function(err){
    if (err)  {
      log.error ( 2,'cannot write file ' + fpath );
      console.error(err);
      item.sync = false;  // however we do not attempt another write here
    } else if (!item.sync)  {
      // 'sync' field was reset during flush - another write is required
      // report this as this should not be regularly happening
      log.warning ( 1,'asynchronous write race, path=' + fpath );
      // setTimeout ( function(){
        write_async ( fpath,item );
      // },0);
    }
  });
}

Cache.prototype.writeCache = function ( key,data_str,fpath,force_sync )  {

  let sync = false;
  
  if (cache_enabled)  {
    if (key in this.cache)  {
      // necessary doing it this way for concurrent async requests not to clash
      sync = this.cache[key].sync;
      this.cache[key].data = data_str;
      this.cache[key].sync = false;
    } else  {
      this.cache[key] = {
        data : data_str,
        sync : false
      }
      this.trim();
    }
  }
  
  if (fpath)  {
    if (force_sync || (!cache_enabled) || force_write_sync)  {
      try {
        fs.writeFileSync ( fpath,data_str );
        return true;
      } catch (e)  {
        log.error ( 3,'cannot write file ' + fpath );
        console.error(e);
        return false;
      }
    } else if (!sync)  {
      write_async ( fpath,this.cache[key] );
    }
  }

  return true;

}

Cache.prototype.usedMemory = function()  {
  let used_memory = 0;
  for (let key in this.cache)
    used_memory += JSON.stringify(this.cache[key].data).length + key.length + 4;
  return used_memory;
}


// --------------------------------------------------------------------------


// Assume 50 projects/user on average; this is important only for repeat
// loading of project lists, which is rather rare. At all other times, 
// user works with just a single project
const nprj_per_user = 50;

// Assume 400 jobs per project on average; only one project is open for every 
// user at a time
const njobs_per_prj = 1000;

const path_cache = new Cache(2500);

const cache_list = {
  [__userDataExt]    : new Cache(0),
  [__rationFileExt]  : new Cache(0),
  [projectListFName] : new Cache(50),
  [projectDescFName] : new Cache(2500),
  [projectDataFName] : new Cache(2500),
  [jobDataFName]     : new Cache(20000)
};


function configureCache ( ncache )  {
  // ncache is an estimated number of users working simultaneously in the system
  cache_enabled = (ncache>0);
  if (cache_enabled)  {
    log.standard ( 1,'metadata cache is turned on' );
    cache_list[projectDescFName].setMaxSize ( nprj_per_user*ncache );
    cache_list[projectDataFName].setMaxSize ( nprj_per_user*ncache );
    cache_list[jobDataFName]    .setMaxSize ( njobs_per_prj*ncache );
    path_cache.setMaxSize ( nprj_per_user*ncache );
  } else
    log.standard ( 2,'metadata cache is turned off' );
}


function isCacheEnabled()  {
  return cache_enabled;
}


function getFileKey ( fpath )  {
  // This key is used for caching project or job metadata. We check on symbolic
  // link because of possible shared projects. This is a point of inefficiency
  if (fpath.endsWith(projectListFName))
    return path.parse ( path.dirname(fpath) ).name;
  let job_spec = '';
  if (fpath.endsWith(jobDataFName))  {
    let jdname = path.basename ( path.dirname(fpath) );
    if (jdname.startsWith(jobDirPrefix))
      job_spec = ':' + jdname.substring ( jobDirPrefix.length );
  }
  let index = fpath.lastIndexOf ( projectExt );
  if (index>0)  {
    let dpath  = fpath.substring ( 0,index ) + projectExt;
    let dpath1 = path_cache.readCache ( dpath,null );
    if (!dpath1)  {
      let stat  = fs.lstatSync ( dpath );
      if (stat)  {
        if (stat.isSymbolicLink())
              dpath1 = fs.readlinkSync ( dpath )
        else  dpath1 = dpath;
        path_cache.writeCache ( dpath,dpath1,null );
      }
    }
    if (dpath1)  {    
      let upath = path.dirname ( dpath1 );  // user projects
      if (upath.endsWith(userProjectsExt))
        return  path.basename(upath,userProjectsExt) + ':' +
                path.basename(dpath1,projectExt) + job_spec;
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
      r.key = getFileKey ( fpath );
      if (r.key)
        r.cache = cache_list[fname];
    }
  }
  // console.log ( ' ..... cache: ' + cache_list['.user'].size()   + ' ' +
  //                                  cache_list['.ration'].size() + ' ' +
  //                                  cache_list[projectDescFName'].size() + ' ' +
  //                                  cache_list[projectDataFName].size() );
  return r;
}


function itemExists ( fpath )  {
// console.log ( ' >>> cexists ' + fpath );

  if (cache_enabled)  {
    let r = selectCache ( fpath );
    if (r.cache && (r.cache.itemExists(r.key)>0))
      return true;
  }
  try {
    return fs.lstatSync(fpath); // || fs.lstatSync(path);
  } catch (e)  {
    return null;
  }
  // return -1; // file operation is required
}


function itemCached ( fpath )  {
  if (cache_enabled)  {
    let r = selectCache ( fpath );
    if (r.cache && (r.cache.itemExists(r.key)>0))
      return true;
  }
  return false;
}


function removePathItem ( fpath )  {
  if (cache_enabled && fpath.endsWith(projectExt))  {
// console.log ( ' >>> crpath' + fpath );
    let bname = path.basename ( fpath );
    let keys = Object.keys(path_cache.cache);
    for (let i=0;i<keys.length;i++)
      if (path.basename(keys[i])==bname)
        delete path_cache.cache[keys[i]];
  }
}


function removeItem ( fpath )  {
// console.log ( ' >>> cremove ' + fpath );
  if (cache_enabled)  {
    let r = selectCache ( fpath );
    if (r.cache)
      r.cache.removeItem ( r.key );
    removePathItem ( fpath );
  }
}


function removeDirItems ( dirpath )  {
// console.log ( ' >>> crmdir ' + dirpath );
  // to be used when a directory is removed
  if (cache_enabled)  {
    let key_prefix = getDirKey ( dirpath );
    if (key_prefix)
      for (let c in cache_list)
        cache_list[c].removeItems ( key_prefix );
    removePathItem ( dirpath );
  }
}


function readCache ( fpath )  {

// console.log ( ' >>> cread ' + fpath );

  if (cache_enabled)  {
    let r = selectCache ( fpath );
    if (r.cache)
      return r.cache.readCache ( r.key,fpath );
  }

  try {
// console.log ( ' >>> cread-0 ' + fpath );
    return fs.readFileSync(fpath).toString();
  } catch (e)  {
    if (e.code !== 'ENOENT')  {
      log.error ( 4, e.message + ' when reading ' + fpath );
      console.error ( e );
    }
  }

  return null;

}


function writeCache ( fpath,data_string,force_sync )  {

// console.log ( ' >>> cwrite ' + fpath );

  if (cache_enabled)  {
    let r = selectCache ( fpath );
    if (r.cache)
      return r.cache.writeCache ( r.key,data_string,fpath,force_sync );
  }

  try {
    fs.writeFileSync ( fpath,data_string );
    return true;
  } catch (e)  {
    log.error ( 5,'cannot write file ' + fpath +
                  ' error: ' + JSON.stringify(e) );
    console.error(e);
    return false;
  }

}


function memoryReport()  {

  const memoryUsage = process.memoryUsage();
  const mbyte = 1024*1024;

  return {

    cache_enabled      : cache_enabled,
    force_write_sync   : force_write_sync,

    usedRAM            : memoryUsage.heapUsed  / mbyte,  // MB
    totalHeap          : memoryUsage.heapTotal / mbyte,  // MB
    externalRAM        : memoryUsage.external  / mbyte,  // MB
    totalRAM           : os.totalmem()         / mbyte,  // MB
    freeRAM            : os.freemem()          / mbyte,  // MB

    user_cache         : [cache_list[__userDataExt].size(),
                          cache_list[__userDataExt].maxItems,
                          cache_list[__userDataExt].usedMemory()/mbyte],
    user_ration_cache  : [cache_list[__rationFileExt].size(),
                          cache_list[__rationFileExt].maxItems,
                          cache_list[__rationFileExt].usedMemory()/mbyte],
    project_list_cache : [cache_list[projectListFName].size(),
                          cache_list[projectListFName].maxItems,
                          cache_list[projectListFName].usedMemory()/mbyte],
    project_desc_cache : [cache_list[projectDescFName].size(),
                          cache_list[projectDescFName].maxItems,
                          cache_list[projectDescFName].usedMemory()/mbyte],
    project_meta_cache : [cache_list[projectDataFName].size(),
                          cache_list[projectDataFName].maxItems,
                          cache_list[projectDataFName].usedMemory()/mbyte],
    job_meta_cache     : [cache_list[jobDataFName].size(),
                          cache_list[jobDataFName].maxItems,
                          cache_list[jobDataFName].usedMemory()/mbyte],
    file_path_cache    : [path_cache.size(),path_cache.maxItems,
                          path_cache.usedMemory()/mbyte]
  
  };

}


function printMemoryReport()  {
  let mr = memoryReport();
  log.standard ( 3,'memory usage:' );
  if (mr.cache_enabled)
        console.log ( ' --- Metadata cache: ON'  );
  else  console.log ( ' --- Metadata cache: OFF' );
  if (mr.force_write_sync)
        console.log ( ' --- Metadata write mode: SYNC'  );
  else  console.log ( ' --- Metadata write mode: ASYNC' );
  console.log ( ' --- RAM:' );
  console.log ( '          used : ' + mr.usedRAM.toFixed(1)     + ' MB' );
  console.log ( '         total : ' + mr.totalRAM.toFixed(1)    + ' MB' );
  console.log ( '          free : ' + mr.freeRAM.toFixed(1)     + ' MB' );
  console.log ( ' --- Heap:' );
  console.log ( '         total : ' + mr.totalHeap.toFixed(1)   + ' MB' );
  console.log ( '      external : ' + mr.externalRAM.toFixed(1) + ' MB' );
  console.log ( ' --- Cache:' );
  console.log ( '          user : ' + mr.user_cache[0]         + '/' + mr.user_cache[1]         );
  console.log ( '        ration : ' + mr.user_ration_cache[0]  + '/' + mr.user_ration_cache[1]  );
  console.log ( '  project list : ' + mr.project_list_cache[0] + '/' + mr.project_list_cache[1] );
  console.log ( '  project desc : ' + mr.project_desc_cache[0] + '/' + mr.project_desc_cache[1] );
  console.log ( '  project meta : ' + mr.project_meta_cache[0] + '/' + mr.project_meta_cache[1] );
  console.log ( '      job meta : ' + mr.job_meta_cache[0]     + '/' + mr.job_meta_cache[1]     );
  console.log ( '     file path : ' + mr.file_path_cache[0]    + '/' + mr.file_path_cache[1]    );
}


// ==========================================================================
// export for use in node

module.exports.isCacheEnabled    = isCacheEnabled;
module.exports.configureCache    = configureCache;
module.exports.itemExists        = itemExists;
module.exports.itemCached        = itemCached;
module.exports.removePathItem    = removePathItem;
module.exports.removeItem        = removeItem;
module.exports.removeDirItems    = removeDirItems;
module.exports.readCache         = readCache;
module.exports.writeCache        = writeCache;
module.exports.memoryReport      = memoryReport;
module.exports.printMemoryReport = printMemoryReport;
