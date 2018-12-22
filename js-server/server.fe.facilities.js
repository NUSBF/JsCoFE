
/*
 *  =================================================================
 *
 *    15.12.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var fs            = require('fs-extra');
var path          = require('path');
//var child_process = require('child_process');

//  load application modules
//var emailer  = require('./server.emailer');
var conf  = require('./server.configuration');
var prj   = require('./server.fe.projects');
var utils = require('./server.utils');
var uh    = require('./server.fe.upload_handler');
var cmd   = require('../js-common/common.commands');
var fcl   = require('../js-common/common.data_facility');

//  prepare log
var log = require('./server.log').newLog(18);

// ===========================================================================

var facilityListFName  = 'facilities.list';
var cloudFileListFName = 'cloudfiles.list';
var ICATDirName        = 'ICAT_facility';

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
var paths = [];
var text  = utils.readString ( fileListPath );

  if (text)  {
    text = text.trim();
    if (text)  {
      var lines = text.split('\n');
      for (var i=0;i<lines.length;i++)  {
        var p = lines[i].split(':');
        if ((p.length==2) && (!p[0].startsWith('#')))
          paths.push ( [p[0].trim(),p[1].trim()] );
      }
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

function dpath2sectors(dirlist, sectors, file_list) {
    var rec_img = new RegExp('(.*[^0-9])([0-9]{2,})(.*)$');
    var sector_dict = {};
    var sector_lst1 = [];
    for (ind in dirlist) {
        var fname = dirlist[ind];
        var match_obj = fname.match(rec_img);
        if (match_obj) {
            var prefix = match_obj[1];
            var cou_str = match_obj[2];
            var suffix = match_obj[3];
            var cou = parseInt(cou_str);
            var ndigits = cou_str.length;
            var template = prefix + '#'.repeat(ndigits) + suffix;
            var range_lst1 = sector_dict[template];
            if (range_lst1) {
                var range = range_lst1[range_lst1.length - 1];
                if (range[1][0] + 1 == cou) {
                    range[1][0] = cou;
                    range[1][1] = fname;
                } else {
                    range = [[cou, fname], [cou, fname]];
                    range_lst1.push(range);
                }
            } else {
                range_lst1 = [[[cou, fname], [cou, fname]]];
                sector_dict[template] = range_lst1;
                sector_lst1.push([template, range_lst1]);
            }
        } else {
            sector_lst1.push([fname, null])
        }
    }
    var sector_lst2 = [];
    for (sector_ind in sector_lst1) {
        var sector_meta = sector_lst1[sector_ind];
        var range_lst1 = sector_meta[1];
        var range_lst2 = [];
        if (range_lst1) {
            for (ind in range_lst1) {
                range = range_lst1[ind];
                if (range[1][0] > range[0][0]) {
                    range_lst2.push(range);
                }
            }
            if (range_lst2.length > 0) {
                sector_lst2.push([sector_meta[0], range_lst2]);
            }
        }
    }
    var sector_lst3 = sectors;
    for (sector_ind in sector_lst2) {
        sector_meta = sector_lst2[sector_ind];
        var range_lst2 = sector_meta[1];
        var range_lst3 = [];
        for (ind in range_lst2) {
            range = range_lst2[ind];
            range_lst3.push([range[0][0], range[1][0]]);
        }
        sector_lst3.push({
            'template': sector_meta[0],
            'name': range_lst2[0][0][1],
            'ranges': range_lst3
        });
    }
    for (sector_ind in sector_lst1) {
        sector_meta = sector_lst1[sector_ind];
        var range_lst1 = sector_meta[1];
        if (range_lst1) {
            for (range_ind in range_lst1) {
                range = range_lst1[range_ind];
                cou = range[1][0] - range[0][0] + 1
                file_list.push([range[0][1], range[1][1], cou]);
            }
        } else {
            file_list.push([sector_meta[0], sector_meta[0], 1]);
        }
    }
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
        sdir.name = '..';
        slist.dirs.push ( sdir );
        slist.sectors = [];
        var file_list = [];
        var dirlist = fs.readdirSync(dirpath).sort();
        dpath2sectors(dirlist, slist.sectors, file_list);
        for (file_ind in file_list) {
          file_meta = file_list[file_ind];
          var cou = file_meta[2];
          if (cou > 1) {
            add_file(file_meta[0], 0).image = 1;
            if (cou > 2) {
              add_file('......', 0).image = 0;
            }
            add_file(file_meta[1], 0).image = 2;
          } else {
            var fname = file_meta[0];
            var fpath = path.join ( dirpath,fname );
            var stat  = utils.fileExists ( fpath );
            if (stat)  {
              if (stat.isDirectory())  {
                sdir  = new fcl.FacilityDir();
                sdir.name = fname;
                slist.dirs.push ( sdir );
              } else  {
                var lname = fname.split('.');
                var ext   = lname.pop().toLowerCase();
                isSeqFile = (['seq','fasta','pir'].indexOf(ext)>=0);
                if (isSeqFile || (['pdb','mtz','cif'].indexOf(ext)>=0))  {
                  var sfile = add_file ( fname,stat.size );
                  if (isSeqFile)
                    sfile.contents = utils.readString ( fpath );
                }
              }
            }
          }
        }
      } else {
        slist.message = 'directory ' + spath + ' does not exist';
      }
    } else {
      slist.message = 'mount ' + lst[0] + ' not found';
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
