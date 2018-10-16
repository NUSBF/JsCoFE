
/*
 *  =================================================================
 *
 *    05.10.18   <--  Date of Last Modification.
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

  if (text)  text = text.trim();

  if (text)  {
    var lines = text.split('\n');
    for (var i=0;i<lines.length;i++)  {
      var p = lines[i].split(':');
      if (p.length==2)
        paths.push ( [p[0].trim(),p[1].trim()] );
    }
  }

  return paths;

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
      sfile.size = stat.size;
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

    if (dirpath)  {
      if (utils.dirExists(dirpath))  {
        var sdir  = new fcl.FacilityDir();
        sdir.name = '..';
        slist.dirs.push ( sdir );
        var dirlist = fs.readdirSync(dirpath).sort();  // sort() maybe unnecessary
        var i = 0;
        while (i<dirlist.length)  {
          var fpath = path.join ( dirpath,dirlist[i] );
          var stat  = utils.fileExists ( fpath );
          if (stat)  {
            if (stat.isDirectory())  {
              sdir  = new fcl.FacilityDir();
              sdir.name = dirlist[i];
              slist.dirs.push ( sdir );
            } else  {
              var lname = dirlist[i].split('.');
              var ext   = lname.pop().toLowerCase();
              isSeqFile = (['seq','fasta','pir'].indexOf(ext)>=0);
              if (isSeqFile || (['pdb','mtz','cif'].indexOf(ext)>=0))  {
                var sfile = add_file ( dirlist[i],stat.size );
                if (isSeqFile)
                  sfile.contents = utils.readString ( fpath );
              } else  {
                // check for likely image files, looking for pattern
                // [((a).)](a)(d).[((a).)].ext (a: letter, d: digit,
                // []: optional, (): repeats)
                var k = -1;
                for (var j=lname.length-1;(j>=0) && (k<0);j--)  {
                  var c = lname[j][lname[j].length-1];
                  if (('0'<=c) && (c<='9'))
                    k = j;
                }
                if (k>=0)  {
                  var n0      = 0;
                  for (var j=lname[k].length-1;j>=0;j--)  {
                    var c = lname[k][j];
                    if (('0'<=c) && (c<='9'))  n0 = j;
                                         else  break;
                  }
                  var ndigits = lname[k].length - n0;
                  var prefix = '';
                  if (k>0)
                      prefix = lname.slice(0,k).join('.') + '.';
                  prefix    += lname[k].substring(0,n0);
                  var nimage = parseInt ( lname[k].substr(n0) );
                  var suffix = '';
                  if (k<lname.length-1)
                      suffix = '.' + lname.slice(k+1).join('.');
                  suffix += '.' + ext;
                  var j = i;
                  do {
                    nimage++;
                    j++;
                  } while (prefix+utils.padDigits ( nimage,ndigits )+suffix == dirlist[j]);
                  j--;
                  if (j>i)  {
                    add_file ( dirlist[i],0 ).image = 1;
                    if (j>i+1)
                      add_file ( '......',0 ).image = 0;
                    add_file ( dirlist[j],0 ).image = 2;
                    i = j;
                  }
                }
              }
            }
          }
          i++;
        }
      } else
        slist.message = 'directory ' + spath + ' does not exist';

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
