
/*
 *  =================================================================
 *
 *    27.07.18   <--  Date of Last Modification.
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
//var fs            = require('fs-extra');
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

var facilityListFName = 'facilities.list';
var ICATDirName       = 'ICAT_facility';

// ===========================================================================

//function getFacilityListPath()  {
//  return path.join ( conf.getFEConfig().facilitiesPath,facilityListFName );
//}

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

/*
function checkFacilities ( facilityListPath )  {
  var fclListPath = facilityListPath;
  if (!fclListPath)
    fclListPath = getFacilityListPath();
  return utils.fileExists(fclListPath);
}
*/

// ===========================================================================

function getUserFacilityList ( login )  {
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

  return response;

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
    var fcl_update = utils.spawn ( "python", // conf.pythonName(),
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
