
/*
 *  =================================================================
 *
 *    25.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.storage.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Projects Handler Functions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

//  load system modules
const fs      = require('fs-extra');
const path    = require('path');

//  load application modules
const conf    = require('./server.configuration');
const prj     = require('./server.fe.projects');
const utils   = require('./server.utils');
const cmd     = require('../js-common/common.commands');
const storage = require('../js-common/common.data_storage');

//  prepare log
const log     = require('./server.log').newLog(18);

// ===========================================================================

const cloudFileListFName = 'cloudfiles.list';
const cloudDirMetaFName  = '__jscofe__.meta';

// ===========================================================================

function getUserCloudMounts ( loginData )  {
//
//  Reads cloud storage configuration file, which is placed by admin in
//  users' project directory. The file has the following format:
//  --------------------------------------------------------------------------
//  name1  :  path1
//  name2  :  path2
//  ...............
//  nameN  :  pathN
//  --------------------------------------------------------------------------
//  where "nameX" is symbolic name that identifies path "pathX" for user.
//
//  Returns null if file is not found or is empty, and array
//  [[name1,path1],[name2,path2],...[nameN,pathN]] otherwise.
//

let fileListPath = path.join ( prj.getUserProjectsDirPath(loginData),cloudFileListFName );
let paths = conf.getFEConfig().getCloudMounts ( loginData.login );
let text  = utils.readString ( fileListPath );

  if (text) {
    let regex_path = /^\s*([^\s#].+?)\s*:\s*(.+?)\s*$/gm;
    let match;
    while ((match = regex_path.exec(text)) !== null) {
      paths.push ( [match[1], match[2]] );
    }
  } else
    utils.writeString ( fileListPath,
      '# Cloud storage configuration file. Duplicate, edit and uncomment\n' +
      '# template configuration line ("mount : path") below:\n' +
      '# -----------------------------------------------------------------\n' +
      '#  mount_name  :  /path/to/directory/shared/by/all/servers\n'
    );

  return paths;

}


function getJobSafeMount()  {
  return [ ['Failed Jobs Safe',conf.getFEConfig().getJobsSafePath()] ];
}


function dirpath2sectors(dirpath, sectors, file_list) {
  //
  // indices for:
  // c = block of didgits within a filename
  // q = template with all didgits replaced with \0
  // i = filenames belonging to a given q
  // p = subtemplate with didgits replaced with \0
  //     within the most diverse block of didgits
  // j = filenames belonging to a given p
  // o = output file list with ranges merged
  // values:
  // f = filename (also used as a mapping key)
  // l = left token (text)
  // r = right token (didgits)
  // k = kind of file (dir, seq, dat, unk) or
  //     the last file of the range
  //
  let fk_o    = file_list;
  let rec_dat = /.+\.(?:pdb|mtz|cif)$/i;
  let rec_seq = /.+\.(?:seq|fasta|pir)$/i;
  let rec_img = /((?!$)[^0-9]*)([0-9]+|$)/g;
  let t_q = [];
  let l_cq = [];
  let r_ciq = [];
  for (let f of fs.readdirSync(dirpath).sort())
    if (f!=cloudDirMetaFName)  {
      let fpath = path.join(dirpath, f);
      if (fs.existsSync(fpath) && fs.statSync(fpath).isDirectory()) {
        fk_o.push([f, 'dir']);
      }
      else if (rec_seq.test(f)) {
        fk_o.push([f, 'seq']);
      }
      else if (rec_dat.test(f)) {
        fk_o.push([f, 'dat']);
      }
      else {
        let l_c = [], r_c = [];
        let match;
        while ((match = rec_img.exec(f)) !== null) {
          l_c.push(match[1]);
          r_c.push(match[2]);
        }
        if (!r_c[0]) {
          fk_o.push([f, 'unk']);
        }
        else {
          let t = f.replace(/[0-9]/g, '\0')
          let q = t_q.length;
          while (--q >= 0 && t_q[q] != t) {}
          if (q >= 0) {
            r_ciq[q].push(r_c);
          }
          else {
            t_q.push(t);
            l_cq.push(l_c);
            r_ciq.push([r_c]);
          }
        }
      }
    }

  let f_p = [];
  let t_f = {};
  let rr_jf = {};
  for (let q in t_q) {
    let l_c = l_cq[q];
    let r_ci = r_ciq[q];
    let u_max = 0;
    let c_max;
    for (let c in l_c) {
      let u = 0;
      let r = null;
      for (let r_c of r_ci) {
        if (r != r_c[c]) {
          r = r_c[c];
          u++;
        }
      }
      if (u_max <= u) {
        u_max = u;
        c_max = c;
      }
    }
    let l_max = l_c[c_max];
    let t_prev = null;
    let rr, rr_j;
    for (let r_c of r_ci) {
      let r_max = r_c[c_max]
      let f = '';
      for (let c in r_c) f += l_c[c] + r_c[c];
      r_c[c_max] = '\0';
      let t = '';
      for (let c in r_c) t += l_c[c] + r_c[c];
      r_c[c_max] = r_max;
      if (t != t_prev) {
        f_p.push(f);
        t_prev = t;
        t_f[f] = t;
        rr = [r_max, r_max];
        rr_j = [rr];
        rr_jf[f] = rr_j;
      }
      else if (parseInt(r_max) != parseInt(rr[1]) + 1) {
        rr = [r_max, r_max];
        rr_j.push(rr);
      }
      else {
        rr[1] = r_max;
      }
    }
  }
  f_p.sort()
  for (let f of f_p) {
    let t = t_f[f];
    let rr_j = [];
    let nn_j = [];
    for (let [r0, r1] of rr_jf[f]) {
      let f0 = t.replace('\0', r0);
      if (r1 == r0) {
        fk_o.push([f0, 'unk']);
      }
      else {
        let i0 = parseInt(r0);
        let i1 = parseInt(r1);
        rr_j.push([r0, r1]);
        nn_j.push([i0, i1]);
        let f1 = t.replace('\0', r1);
        if (i1 == i0 + 1) {
          fk_o.push([f0, 'unk']);
          fk_o.push([f1, 'unk']);
        }
        else {
          fk_o.push([f0, f1]);
        }
      }
    }
    if (rr_j.length) {
      t = t.replace('\0', '#'.repeat(rr_j[0][0].length));
      sectors.push({'name': f, 'ranges': nn_j, 'template': t});
    }
    rr_jf[f] = rr_j
  }

  fk_o.sort()

  return fk_o;

}


function readDirMeta ( dirpath,StorageDir )  {
//  Directory meta-file format:
//  -------------------------------------------------------------------------
//  Short description of directory content (will be used as tooltip)
//  [[[]]]
//  Full description of directory content (will be displayed in browser)
//  -------------------------------------------------------------------------
//
  let jscofe_meta = utils.readString ( path.join(dirpath,StorageDir.name,cloudDirMetaFName) );
  if (jscofe_meta)  {
    let jsmeta = jscofe_meta.split ( '[[[]]]' );
    if (jsmeta.length>1)  {
      StorageDir.shortDesc = jsmeta[0].trim();
      StorageDir.fullDesc  = jsmeta[1].trim();
    }
  }
  return StorageDir;
}


function _storage_mounts_listing ( cloudMounts )  {
let slist = new storage.StorageList()
  slist.path = '';
  slist.name  = 'Cloud File Storage';
  if (cloudMounts)  {
    for (let i=0;i<cloudMounts.length;i++)  {
      let sdir  = new storage.StorageDir();
      sdir.name = cloudMounts[i][0];
      sdir      = readDirMeta ( cloudMounts[i][1],sdir );
      slist.dirs.push ( sdir );
    }
  }
  return slist;
}


function getDirListing ( spath,sroot )  {
let slist = new storage.StorageList()

  function add_file ( filename,size )  {
    let sfile  = new storage.StorageFile();
    sfile.name = filename;
    sfile.size = size;
    slist.files.push ( sfile );
    return sfile;
  }

  slist.path = spath;
  let rpath = null;
  let rroot = null
  try {
    rpath = fs.realpathSync(spath);
    rroot = fs.realpathSync(sroot);
  } catch (e)  {
    log.error ( 5,'error in taking absolute paths of "' + spath + 
                  '" and/or "' + sroot + '"' );
    return slist;
  }
  if (utils.dirExists(rpath))  {
    let sdir  = null;
    sdir      = new storage.StorageDir();
    sdir      = readDirMeta ( rpath,sdir );
    if (rpath!=rroot)  sdir.name = '..';
                 else  sdir.name = '**top**';
    slist.dirs.push ( sdir );
    slist.sectors = [];
    let file_list = dirpath2sectors ( rpath,slist.sectors,[] );
    for (let file_tuple of file_list) {
      let fstr0 = file_tuple[0];
      let fstr1 = file_tuple[1];
      let fpath = path.join ( rpath,fstr0 );
      let stat  = utils.fileStat(fpath);
      if (stat) {
        if (fstr1 == 'dir') {
          sdir      = new storage.StorageDir();
          sdir.name = fstr0;
          sdir      = readDirMeta ( rpath,sdir );
          slist.dirs.push(sdir);
        } else  {
          let sfile = add_file(fstr0, stat.size);
          if (fstr1 == 'seq') {
            sfile.contents = utils.readString(fpath);
          }
        }
      }
    }
  }
  return slist;
}


function getCloudDirListing ( cloudMounts,spath )  {
let slist = null;

  if (spath.length==0)  {
    // empty storage path: return the list of storage mounts
    slist = _storage_mounts_listing ( cloudMounts );

    // slist.name  = 'Cloud File Storage';
    //
    // for (let i=0;i<cloudMounts.length;i++)  {
    //   let sdir  = new storage.StorageDir();
    //   sdir.name = cloudMounts[i][0];
    //   sdir      = readDirMeta ( cloudMounts[i][1],sdir );
    //   slist.dirs.push ( sdir );
    // }

  } else  {
    // storage path is given; return actual directory listing for spath

    slist = new storage.StorageList()
    slist.path = spath;

    if (!cloudMounts)  {
      slist.message = 'cloud storage is not configured';
      slist.code    = 'unconfigured';
      log.error ( 22,'cloud storage is not configured' );
      return slist;
    }

    slist.name  = spath;

    function add_file ( filename,size )  {
      let sfile  = new storage.StorageFile();
      sfile.name = filename;
      sfile.size = size;
      slist.files.push ( sfile );
      return sfile;
    }

    let lst     = spath.split('/');
    let dirpath = null;
    //console.log ( spath );
    //console.log ( lst );
    //console.log ( cloudMounts );
    for (let i=0;(i<cloudMounts.length) && (!dirpath);i++)
      if (cloudMounts[i][0]==lst[0])  {
        if (lst.length<2)
              dirpath = cloudMounts[i][1];
        else  dirpath = path.join ( cloudMounts[i][1],lst.slice(1).join('/') );
      }

  /*
  { "path"    : "/Users/eugene/Projects/jsCoFE/data/hg/images1",
    "sectors" : [{"ranges":[[1,29]],"template":"hg-###.mar1600"},
                 {"ranges":[[1,29],[31,84]],"template":"hg_###.mar1600"}]
  }
  */

    if (dirpath)  {
      if (utils.dirExists(dirpath))  {
        let sdir  = new storage.StorageDir();
        sdir      = readDirMeta ( dirpath,sdir );
        sdir.name = '..';
        slist.dirs.push ( sdir );
        slist.sectors = [];
        let file_list = dirpath2sectors ( dirpath,slist.sectors,[] );
        for (let file_tuple of file_list) {
          let fstr0 = file_tuple[0];
          let fstr1 = file_tuple[1];
          let fpath = path.join ( dirpath,fstr0 );
          let stat  = utils.fileStat(fpath);
          if (stat) {
            if (fstr1 == 'dir') {
              sdir      = new storage.StorageDir();
              sdir.name = fstr0;
              sdir      = readDirMeta ( dirpath,sdir );
              slist.dirs.push(sdir);
            }
            else if (['seq', 'dat', 'unk'].indexOf(fstr1) >= 0) {
              let sfile = add_file(fstr0, stat.size);
              if (fstr1 == 'seq') {
                sfile.contents = utils.readString(fpath);
              }
            } 
            else {
              if (fstr0.split('.').pop().toLowerCase() == 'h5') {
                add_file(fstr0, 0).h5 = 1;
                add_file('......', 0).h5 = 0;
                add_file(fstr1, 0).h5 = 2;
              }
              else {
                add_file(fstr0, 0).image = 1;
                add_file('......', 0).image = 0;
                add_file(fstr1, 0).image = 2;
              }
            }
          }
        }
      } else {
        slist         = _storage_mounts_listing ( cloudMounts );
        slist.message = 'directory ' + spath + ' does not exist';
        slist.code    = 'no_directory';
        log.warning ( 20,'could not find cloud storage directory ' + dirpath );
      }
    } else {
      slist         = _storage_mounts_listing ( cloudMounts );
      slist.message = 'mount ' + lst[0] + ' not found';
      slist.code    = 'no_mount';
      log.warning ( 21,'cloud storage mount "' + lst[0] + '" not found' );
    }
  }

//console.log ( JSON.stringify(slist) );
/* Example of output:
  { "_type":"StorageList",
    "path":"Demo projects",
    "name":"Demo projects",
    "size":0,
    "dirs":[
      {"_type":"StorageDir",
       "name":"..",
       "size":"",
       "dirs":[],"files":[]
      },{
       "_type":"StorageDir",
       "name":"howtos",
       "size":"",
       "dirs":[],"files":[]}
     ],
     "files":[
      {"_type":"StorageFile",
       "id":"",
       "name":"beta-blip phaser example.ccp4_demo",
       "size":67394556,
       "date":""
      },{
       "_type":"StorageFile",
       "id":"",
       "name":"beta-blip.ccp4_demo",
       "size":67394556,
       "date":""
      },{
       "_type":"StorageFile",
       "id":"",
       "name":"beta-blip.zip",
       "size":67394556,
       "date":""}
     ],
     "sectors":[]
   }
*/

  return slist;

}


// ===========================================================================

function getCloudFileTree ( loginData,data,callback_func )  {
  if (data['type']=='files')  {
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',
                        getCloudDirListing (
                               getUserCloudMounts(loginData),data['path']
                                             ) ) );
  } else if (data['type']=='jobs_safe')  {
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',
                        getCloudDirListing ( getJobSafeMount(),data['path']
                                             ) ) );
  } else if (data['type']=='abspath')  {
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',
                              getDirListing(data['path'],data['root']) ) );
  }
  return null;
}


// ==========================================================================
// export for use in node

module.exports.getCloudFileTree    = getCloudFileTree;
module.exports.getUserCloudMounts  = getUserCloudMounts;
