
/*
 *  =================================================================
 *
 *    08.07.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.facilities.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Projects Handler Functions
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

//  load system modules
var fs    = require('fs-extra');
var path  = require('path');

//  load application modules
//var emailer  = require('./server.emailer');
var conf  = require('./server.configuration');
var prj   = require('./server.fe.projects');
var utils = require('./server.utils');
var uh    = require('./server.fe.upload_handler');
var cmd   = require('../js-common/common.commands');
var fcl   = require('../js-common/common.data_facility');

//  prepare log
var log   = require('./server.log').newLog(18);

// ===========================================================================

var facilityListFName  = 'facilities.list';
var cloudFileListFName = 'cloudfiles.list';
var ICATDirName        = 'ICAT_facility';
var cloudDirMetaFName  = '__jscofe__.meta';

// ===========================================================================


function getFacilityPath ( name_str )  {
  if (name_str=='icat')  // path to directory containing all ICAT facility data
    return path.join ( conf.getFEConfig().facilitiesPath,ICATDirName );
  return '';
}

function getUserFacilityListPath ( login )  {
// path to JSON file containing list of all projects (with project
// descriptions, represented as class ProjectList) of user with
// given login name
  return path.join ( prj.getUserProjectsDirPath(login),facilityListFName );
}


function getUserCloudMounts ( login )  {
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

var fileListPath = path.join ( prj.getUserProjectsDirPath(login),cloudFileListFName );
var paths = conf.getFEConfig().getCloudMounts ( login );
var text  = utils.readString ( fileListPath );

  if (text) {
    let regex_path = /^\s*([^\s#].+?)\s*:\s*(.+?)\s*$/gm;
    let match;
    while ((match = regex_path.exec(text)) !== null) {
      paths.push([match[1], match[2]] );
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


function readDirMeta ( dirpath,facilityDir )  {
//  Directory meta-file format:
//  -------------------------------------------------------------------------
//  Short description of directory content (will be used as tooltip)
//  [[[]]]
//  Full description of dircetory content (will be displayed in browser)
//  -------------------------------------------------------------------------
//
  var jscofe_meta = utils.readString ( path.join(dirpath,facilityDir.name,cloudDirMetaFName) );
  if (jscofe_meta)  {
    var jsmeta = jscofe_meta.split ( '[[[]]]' );
    if (jsmeta.length>1)  {
      facilityDir.shortDesc = jsmeta[0].trim();
      facilityDir.fullDesc  = jsmeta[1].trim();
    }
  }
  return facilityDir;
}


function getCloudDirListing ( cloudMounts,spath )  {
var slist = new fcl.StorageList()

  slist.path = spath;

  if (!cloudMounts)
    return slist;

  if (spath.length==0)  {
    // empty storage path: return the list of storage mounts

    slist.name  = 'Cloud File Storage';

    for (var i=0;i<cloudMounts.length;i++)  {
      var sdir  = new fcl.FacilityDir();
      sdir.name = cloudMounts[i][0];
      sdir      = readDirMeta ( cloudMounts[i][1],sdir );
      slist.dirs.push ( sdir );
    }

  } else  {
    // storage path is given; return actual directory listing for spath

    slist.name  = spath;

    function add_file ( filename,size )  {
      var sfile  = new fcl.FacilityFile();
      sfile.name = filename;
      sfile.size = size;
      slist.files.push ( sfile );
      return sfile;
    }

    var lst     = spath.split('/');
    var dirpath = null;
    //console.log ( spath );
    //console.log ( lst );
    //console.log ( cloudMounts );
    for (var i=0;(i<cloudMounts.length) && (!dirpath);i++)
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
        var sdir  = new fcl.FacilityDir();
        sdir      = readDirMeta ( dirpath,sdir );
        sdir.name = '..';
        slist.dirs.push ( sdir );
        slist.sectors = [];
        var file_list = dirpath2sectors ( dirpath,slist.sectors,[] );
        for (let file_tuple of file_list) {
          let fstr0 = file_tuple[0];
          let fstr1 = file_tuple[1];
          let fpath = path.join ( dirpath,fstr0 );
          let stat  = utils.fileExists(fpath);
          if (stat) {
            if (fstr1 == 'dir') {
              sdir      = new fcl.FacilityDir();
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
      }
      else {
        slist.message = 'directory ' + spath + ' does not exist';
        log.error    ( 20,'could not find cloud storage directory ' + dirpath );
        log.standard ( 20,'could not find cloud storage directory ' + dirpath );
      }
    }
    else {
      slist.message = 'mount ' + lst[0] + ' not found';
      log.error    ( 21,'cloud storage mount ' + lst[0] + ' not found' );
      log.standard ( 21,'cloud storage mount ' + lst[0] + ' not found' );
    }
  }

//  console.log ( JSON.stringify(slist) );

  return slist;

}


// ===========================================================================


function initFacilities ( facilityListPath )  {

  var success = false;

  var fclList = new fcl.FacilityList();
  fclList.addFacility ( fcl.facility_names.icat,'iCAT (Diamond Ltd.)' );

  var fclListPath = facilityListPath;
  if (!fclListPath)
    fclListPath = getFacilityListPath();

  if (utils.writeObject(fclListPath,fclList))  {

    var icat_path = getFacilityPath ( fcl.facility_names.icat );
    if (utils.fileExists(icat_path))  {
      log.standard ( 1,'facilities initialised at ' + fclListPath );
      success = true;
    } else if (utils.mkDir(icat_path))  {
      log.standard ( 2,'initialised facilities at ' + fclListPath );
      success = true;
    } else  {
      log.error ( 1,'fail to initialise facilities at ' + fclListPath );
    }

  } else  {
    log.error ( 2,'fail to initialise facility list at ' + fclListPath );
  }

  return success;

}


// ===========================================================================

function getUserFacilityList ( login,data,callback_func )  {
  if (data['type']=='files')  {
    callback_func ( new cmd.Response ( cmd.fe_retcode.ok,'',
                        getCloudDirListing (
                               getUserCloudMounts(login),data['path']
                                             ) ) );
  } else  {
    get_user_facility_list ( login,callback_func );
  }
}


function get_user_facility_list ( login,callback_func )  {
var response = null;  // must become a cmd.Response object to return

  log.detailed ( 4,'get facilities list, login ' + login );

  // Get users' projects list file name
  var userFacilityListPath = getUserFacilityListPath ( login );

  if (!utils.fileExists(userFacilityListPath))  {
    if (!initFacilities(userFacilityListPath))  {
      log.error ( 3,'cannot create list of facilities at ' + userFacilityListPath );
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                            '[00150] Facilities list cannot be created.','' );
    } else  {
      log.standard ( 3,'list of facilities created at ' + userFacilityListPath );
    }
  }

  if (!response)  {
    var fList = utils.readObject ( userFacilityListPath );
    if (fList)  {
      response = new cmd.Response ( cmd.fe_retcode.ok,'',fList );
    } else  {
      log.error ( 4,'cannot read list of facilities at ' + userFacilityListPath );
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                '[00151] Facilities list cannot be read.','' );
    }
  }

  callback_func ( response );

}


// ===========================================================================

var updateResultFName = 'update_result.json';
var updateInputFName  = 'update_input.json';

// ---------------------------------------------------------------------------

function updateFacility ( login,data )  {

  log.standard ( 4,'updating facility "' + data.facility.name + '", login ' + login );

  var response_data = {};
  response_data.status = cmd.fe_retcode.ok;

  var jobDir = prj.getJobDirPath ( login,data.project,data.tid );

  var pwd  = data.pwd;
  data.pwd = '';  // do not write password on disk

  // identify processing script for the facility
  var processor = '';
  var fcl_name  = data.facility.name;
  switch (fcl_name)  {
    case 'icat'  : processor = 'pycofe.proc.icat';  break;
    default      : response_data.status = 'unknown facility "' + data.item.name + '"';
  }

  if (response_data.status==cmd.fe_retcode.ok)  {

    // clear result file
    var resultFile = path.join(jobDir,updateResultFName);
    utils.removeFile ( resultFile );

    // write out data for the script
    var updateFile = path.join(jobDir,updateInputFName);
    utils.writeObject ( updateFile,data );

    // launch update
    // we use "python" instead of ccp4-python because of difficulties in getting
    // suds (and possible requests) module(s) to work across all platforms.
    var pythonName = 'python';
    if (conf.isWindows())
      pythonName = conf.pythonName();
    var fcl_update = utils.spawn ( pythonName, // conf.pythonName(),
                     ['-m',processor,jobDir,updateFile,resultFile,
                      conf.getFEConfig().ICAT_wdsl,conf.getFEConfig().ICAT_ids,
                      uh.uploadDir(),conf.getFEConfig().facilitiesPath],{} )
    fcl_update.stdin.setEncoding('utf-8');
    //fcl_update.stdout.pipe(process.stdout);
    fcl_update.stdin.write ( pwd + '\n' );
    fcl_update.stdin.end(); /// this call seems necessary, at least with plain node.js executable

    /*
    var wereErrors = false;
    fcl_update.stderr.on ( 'data',function(data){
      log.error ( 10,fcl_name + ' update errors in "' + jobDir + '"' );
      wereErrors = true;
    });
    */

    fcl_update.on ( 'close', function(code){
      if (!utils.fileExists(resultFile))  {
        var result = {};
        result['status'] = 'Unknown errors';
        utils.writeObject ( resultFile,result );
      }
    });

  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',response_data );

}


// ---------------------------------------------------------------------------

function checkFacilityUpdate ( login,data )  {

  var response_data = {};
  response_data.status = cmd.fe_retcode.inProgress;

  var jobDir = prj.getJobDirPath ( login,data.project,data.tid );

  // check result file
  var resultFilePath = path.join(jobDir,updateResultFName);
  if (utils.fileExists(resultFilePath))  {
    var result = utils.readObject ( resultFilePath );
    if (result)  {
      if (result.status==cmd.fe_retcode.ok)  {
        var updateFilePath = path.join(jobDir,updateInputFName);
        var update_data = utils.readObject ( updateFilePath );
        if (update_data)  {
          var userFacilityListPath = getUserFacilityListPath ( login );
          var userFacilityList = new fcl.FacilityList();
          if (utils.fileExists(userFacilityListPath))
            userFacilityList.from_JSON ( utils.readString(userFacilityListPath) );
          switch (update_data.item._type)  {
            case 'Facility'      :
            case 'FacilityUser'  : userFacilityList.addVisits (
                                        update_data.facility.name,
                                        update_data.uid,result.vname,result.vid,
                                        result.vdate );
                                break;
            case 'FacilityVisit' : userFacilityList.addDatasets (
                                        update_data.facility.name,
                                        update_data.uid,update_data.visit.id,
                                        result.datasets );
                                break;
            default : ;
          }
          utils.writeObject ( userFacilityListPath,userFacilityList );
          response_data = result;
        } else
          response_data.status = cmd.fe_retcode.fileNotFound;
      } else
        response_data.status = result.status;
      //} else if (result.status==cmd.fe_retcode.askPassword)  {
      //  response_data.status = result.status;
      //} else
      //  response_data.status = cmd.fe_retcode.fileNotFound;
    } else
      response_data.status = cmd.fe_retcode.readError;
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',response_data );

}


// ==========================================================================
// export for use in node
//module.exports.checkFacilities     = checkFacilities;
module.exports.initFacilities      = initFacilities;
module.exports.getUserFacilityList = getUserFacilityList;
module.exports.updateFacility      = updateFacility;
module.exports.checkFacilityUpdate = checkFacilityUpdate;
module.exports.getUserCloudMounts  = getUserCloudMounts;
