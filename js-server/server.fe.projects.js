
/*
 *  =================================================================
 *
 *    08.11.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-server/server.fe.projects.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Front End Server -- Projects Handler Functions
 *       ~~~~~~~~~
 *
 *     function getUserProjectsDirPath  ( loginData )
 *     function getUserProjectListPath  ( loginData )
 *     function getUserDockDataPath     ( loginData )
 *     function getUserProjectSharePath ( loginData )
 *     function getUserKnowledgePath    ( loginData )
 *     function getProjectDirPath       ( loginData,projectName )
 *     function getProjectDataPath      ( loginData,projectName )
 *     function getProjectDescPath      ( loginData,projectName )
 *     function getJobDirPath           ( loginData,projectName,jobId )
 *     function getSiblingJobDirPath    ( jobDir,jobId )
 *     function getJobReportDirPath     ( loginData,projectName,jobId )
 *     function getJobInputDirPath      ( loginData,projectName,jobId )
 *     function getInputDirPath         ( jobDir )
 *     function getInputFilePath        ( jobDir,fileName )
 *     function getJobOutputDirPath     ( loginData,projectName,jobId )
 *     function getOutputDirPath        ( jobDir )
 *     function getOutputFilePath       ( jobDir,fileName )
 *     function getJobDataPath          ( loginData,projectName,jobId )
 *     function writeProjectData        ( loginData,projectData,putTimeStamp )
 *     function checkProjectDescData    ( projectDesc,loginData )
 *     function checkProjectData        ( projectData,loginData )
 *     function readProjectData         ( loginData,projectName )
 *     function readProjectDesc         ( loginData,projectName )
 *     function writeProjectList        ( loginData,projectList )
 *     function readProjectList         ( loginData )
 *     function writeDockData           ( loginData,dockData )
 *     function readDockData            ( loginData )
 *     function makeNewUserProjectsDir  ( loginData )
 *     function getProjectList          ( loginData )
 *     function getDockData             ( loginData )
 *     function _make_unique_list       ( line      )
 *     function readProjectShare        ( loginData )
 *     function writeProjectShare       ( loginData,pShare )
 *     function getSharedPrjList        ( loginData )
 *     function getUserKnowledgeData    ( loginData )
 *     function makeNewProject          ( loginData,projectDesc )
 *     function delete_project          ( loginData,projectName,disk_space,projectDirPath )
 *     function deleteProject           ( loginData,projectName )
 *     function saveProjectList         ( loginData,newProjectList )
 *     function saveDockData            ( loginData,newDockData )
 *     function getJobMetas             ( loginData,projectName )
 *     function prepareProjectExport    ( loginData,projectList )
 *     function checkProjectExport      ( loginData,projectList )
 *     function finishProjectExport     ( loginData,projectList )
 *     function getJobExportNames       ( loginData,task   )
 *     function prepareJobExport        ( loginData,task   )
 *     function checkJobExport          ( loginData,task   )
 *     function finishJobExport         ( loginData,task   )
 *     function getFailedJobExportNames ( fjdata           )
 *     function prepareFailedJobExport  ( loginData,fjdata )
 *     function checkFailedJobExport    ( loginData,fjdata )
 *     function finishFailedJobExport   ( loginData,fjdata )
 *     function getProjectData          ( loginData,data   )
 *     function checkTimestamps         ( loginData,projectDesc     )
 *     function makeNodeName            ( task,title       )
 *     function make_job_directory      ( loginData,projectName,id0 )
 *     function saveProjectData         ( loginData,data   )
 *     function shareProjectConfirm     ( loginData,data   )
 *     function shareProject            ( loginData,data   )
 *     function rename_project_0        ( projectDirPath,new_name,check_running )
 *     function renameProject           ( loginData,data   )
 *     function cloneProject            ( loginData,data   )
 *     function checkCloneProject       ( loginData,projectName )
 *     function _import_project         ( loginData,tempdir,prjDir,chown_key,duplicate_key )
 *     function getProjectTmpDir        ( loginData,make_clean  )
 *     function importProject           ( loginData,upload_meta )
 *     function startDemoImport         ( loginData,meta   )
 *     function startSharedImport       ( loginData,meta   )
 *     function checkProjectImport      ( loginData,data   )
 *     function finishProjectImport     ( loginData,data   )
 *     function saveJobData             ( loginData,data   )
 *     function saveJobFile             ( loginData,data   )
 *     function saveJobFiles            ( loginData,data   )
 *     function getJobFile              ( loginData,data   )
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

//  load application modules
const emailer   = require('./server.emailer');
const conf      = require('./server.configuration');
const anl       = require('./server.fe.analytics');
const utils     = require('./server.utils');
const send_dir  = require('./server.send_dir.js');
const ration    = require('./server.fe.ration');
const storage   = require('./server.fe.storage');
const user      = require('./server.fe.user');
const class_map = require('./server.class_map');
const rj        = require('./server.fe.run_job');
const pd        = require('../js-common/common.data_project');
const ud        = require('../js-common/common.data_user');
const cmd       = require('../js-common/common.commands');
const com_utils = require('../js-common/common.utils');
const task_t    = require('../js-common/tasks/common.tasks.template');

//  prepare log
const log = require('./server.log').newLog(6);

// ===========================================================================

const projectExt         = '.prj';
const userProjectsExt    = '.projects';
const projectListFName   = 'projects.list';
const projectShareFName  = 'projects.share';
const dockDataFName      = 'dock.meta';
const userKnowledgeFName = 'knowledge.meta';
const projectDataFName   = 'project.meta';
const projectDescFName   = 'project.desc';
const jobDirPrefix       = 'job_';
const replayDir          = 'replay';
// const treeNodeFName      = 'tree.node'

// ===========================================================================

function getUserProjectsDirPath ( loginData )  {
// path to directory containing all project directories of user with
// given login data
  return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                     loginData.login + userProjectsExt );
}

function getUserProjectListPath ( loginData )  {
// path to JSON file containing list of all projects (with project
// descriptions, represented as class ProjectList) of user with
// given login data
  return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                     loginData.login + userProjectsExt,projectListFName );
}

function getUserDockDataPath ( loginData )  {
// path to JSON file containing dock content of user with given login data
  return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                     loginData.login + userProjectsExt,dockDataFName );
}

function getUserProjectSharePath ( loginData )  {
// path to JSON file containing list of all projects (with project
// descriptions, represented as class ProjectList) of user with
// given login data
  return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                     loginData.login + userProjectsExt,projectShareFName );
}

function getUserKnowledgePath ( loginData )  {
// path to JSON file containing knowledge data of user with
// given login data
  return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                     loginData.login + userProjectsExt,userKnowledgeFName );
}

function getProjectDirPath ( loginData,projectName )  {
// path to directory containing project 'projectName' of user with
// given login data
  let n = projectName.lastIndexOf(':'+replayDir);
  if (n>0)
    return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                       loginData.login + userProjectsExt,
                       projectName.slice(0,n) + projectExt,
                       replayDir );
  else
    return path.join ( conf.getFEConfig().getVolumeDir(loginData),
                       loginData.login + userProjectsExt,
                       projectName + projectExt );
}

function getProjectDataPath ( loginData,projectName )  {
// path to JSON file containing metadata (see class ProjectData) of
// project 'projectName' of user with given login name
  return path.join ( getProjectDirPath(loginData,projectName),projectDataFName );
}

function getProjectDescPath ( loginData,projectName )  {
// path to JSON file containing metadata (see class ProjectData) of
// project 'projectName' of user with given login name
  return path.join ( getProjectDirPath(loginData,projectName),projectDescFName );
}

function getJobDirPath ( loginData,projectName,jobId )  {
// path to directory containing job identified by 'jobId' in project
// 'projectName' of user with given login data
  return path.join ( getProjectDirPath(loginData,projectName),jobDirPrefix+jobId );
}

function getSiblingJobDirPath ( jobDir,jobId )  {
// path to directory containing job identified by 'jobId' in project and login
// corresponding to the existing 'jobDir' directory
  return path.join ( jobDir,'..',jobDirPrefix + jobId );
}

function getJobReportDirPath ( loginData,projectName,jobId )  {
// path to directory containing report for job identified by 'jobId' in project
// 'projectName' of user with given login data
  return path.join ( getProjectDirPath(loginData,projectName),jobDirPrefix+jobId,
                                       task_t.jobReportDirName );
}

function getJobInputDirPath ( loginData,projectName,jobId )  {
// path to directory used to keep data for sending job, identified by 'jobId'
// in project 'projectName' of user with given login data, to NC
  return path.join ( getProjectDirPath(loginData,projectName),jobDirPrefix+jobId,
                                       task_t.jobInputDirName );
}

function getInputDirPath ( jobDir )  {
// path to directory used to keep data for sending job, identified by 'jobId'
// in project 'projectName' of user with given login name
  return path.join ( jobDir,task_t.jobInputDirName );
}

function getInputFilePath ( jobDir,fileName )  {
// path to input data file in given job directory
  return path.join ( jobDir,task_t.jobInputDirName,fileName );
}

function getJobOutputDirPath ( loginData,projectName,jobId )  {
// path to directory used to keep data generated by job identified by 'jobId'
// in project 'projectName' of user with given login data
  return path.join ( getProjectDirPath(loginData,projectName),jobDirPrefix+jobId,
                                       task_t.jobOutputDirName );
}

function getOutputDirPath ( jobDir )  {
// path to directory used to keep data generated by job identified by 'jobId'
// in project 'projectName' of user with given login name
  return path.join ( jobDir,task_t.jobOutputDirName );
}

function getOutputFilePath ( jobDir,fileName )  {
// path to output data file in given job directory
  return path.join ( jobDir,task_t.jobOutputDirName,fileName );
}

function getJobDataPath ( loginData,projectName,jobId )  {
// path to JSON file containing metadata (see task classes in 'js-common.tasks')
// of job identified by 'jobId' in project 'projectName' of user with given
// login data
  return path.join ( getProjectDirPath(loginData,projectName),jobDirPrefix+jobId,
                                       task_t.jobDataFName );
}


// ===========================================================================

function writeProjectData ( loginData,projectData,putTimeStamp,force_sync=false )  {
  if (!projectData)
    return false;
  if (putTimeStamp)  {
    projectData.desc.timestamp = Date.now();
//    console.log ( ' >>>>> wpd timestamp='+projectData.desc.timestamp);
  }
  projectData.desc.ccp4cloud_version = cmd.appVersion();  // CCP4 Cloud version
  utils.writeObject ( getProjectDescPath(loginData,projectData.desc.name),
                      projectData.desc,force_sync );

// pd.printProjectTree ( ' >>>write_project_data',projectData );

  return utils.writeObject ( getProjectDataPath(loginData,projectData.desc.name),
                             projectData,force_sync );
}

function checkProjectDescData ( projectDesc,loginData )  {

  if (('version' in projectDesc) && (projectDesc.version==1))
    return false;

  projectDesc.version = 1; // with new checks, update here and above simultaneously 

  if ((!('owner' in projectDesc)) || (!projectDesc.owner.login))  {
    // backward compatibility on 11.01.2020
    let uData = user.readUserData ( loginData );
    projectDesc.owner = {
      login  : loginData.login,
      name   : uData.name,
      email  : uData.email,
      labels : {}
    };
    // update = true;  // update project metadata
  }

  if ((!('timestamp' in projectDesc)) || (!projectDesc.timestamp))  {
    projectDesc.timestamp = Date.now();
    // update = true;
  }

  if ((!('share' in projectDesc)) ||
      (Object.prototype.toString.call(projectDesc.share)!=='[object Object]')) {
    projectDesc.share = {};
    if ('share' in projectDesc.owner)  {
      let lst = [];
      if (projectDesc.owner.share.constructor.name=='Array')  {
        for (let i=0;i<projectDesc.owner.share.length;i++)
          lst.push ( projectDesc.owner.share[i].login );
      } else  {
        lst = projectDesc.owner.share.split(',');
      }
      for (let i=0;i<lst.length;i++)
        if (lst[i])
          projectDesc.share[lst[i]] = {
            labels      : {},   // not used at time of writing, safe to be empty
            permissions : pd.share_permissions.run_own // run and delet own jobs by default
          };
      delete projectDesc.owner.share;
    }
    // update = true;
  } else  {
    for (let slogin in projectDesc.share)
      if (projectDesc.share[slogin].permissions=='rw')  {
        projectDesc.share[slogin].permissions = pd.share_permissions.run_own;
        // update = true;
      }
  }
  
  for (let login in projectDesc.share)
    if (projectDesc.share[login].labels.constructor===Array)  {
      projectDesc.share[login].labels = {};
      // update = true;
    }
  
  if ((!('labels' in projectDesc.owner)) ||
      (projectDesc.owner.labels.constructor===Array))  {
    projectDesc.owner.labels = {};  // was not used before writing this, so empty
    // update = true;
  }
  
  if ('labels' in projectDesc)  {
    delete projectDesc.labels;
    // update = true;
  }
  
  if ('keeper' in projectDesc.owner)  {
    delete projectDesc.owner.keeper;
    // update = true;
  }
  
  if ('is_shared' in projectDesc.owner)  {
    delete projectDesc.owner.is_shared;
    // update = true;
  }
  
  if (!('autorun' in projectDesc))  {
    projectDesc.autorun = false;
    // update = true;
  }

  if ((!('ccp4cloud_version' in projectDesc)) || (!projectDesc.ccp4cloud_version))  {
    projectDesc.ccp4cloud_version = cmd.appVersion();
    // update = true;
  }
  
  let f0name = pd.getProjectAuthor ( projectDesc );
  
  if (f0name==pd.folder_type.tutorials)
        f0name += pd.folder_path.tutorials;
  else  f0name += '\'s Projects';
  if ((!('folderPath' in projectDesc)) || (!(projectDesc.folderPath)))  {
    projectDesc.folderPath = f0name;  // virtual project folder path
    // update = true;
  }
  
  if (projectDesc.folderPath.toLowerCase().startsWith('tutorials') &&
      (!projectDesc.folderPath.startsWith(pd.folder_path.tutorials)))  {
    projectDesc.folderPath = pd.folder_path.tutorials;
    // update = true;
  }
  
  if ([pd.folder_path.all_projects,pd.folder_path.shared,pd.folder_path.joined]
          .indexOf(projectDesc.folderPath)>=0)  {
    projectDesc.folderPath = f0name;  // virtual project folder path
    // update = true;
  }
  
  let flist = projectDesc.folderPath.split('/');
  
  if (flist.length<=0)  {
    flist.push ( f0name );
    // update   = true;
  } else if (flist[0]=='My Projects')  {
    flist[0] = f0name;
    // update   = true;
  }

  projectDesc.folderPath = flist.join('/');
  
  // if (!projectDesc.hasOwnProperty('startmode'))
  //   projectDesc.startmode = pd.start_mode.standard; // too petty to save/update
  // if (!projectDesc.hasOwnProperty('tasklistmode'))
  //   projectDesc.tasklistmode = pd.tasklist_mode.full; // too petty to save/update
  if (!projectDesc.hasOwnProperty('metrics'))
    projectDesc.metrics = {};  // too petty to save/update
  
  if (!('archive' in projectDesc))  {
    projectDesc.archive = null;
    // update = true;
  }
  
  // if (update) 
  //   console.log ( ' >>>>>>> update project description after check' )

  return true;  // update project metadata

}


function checkProjectData ( projectData,loginData )  {
// let update = false;

  if (('version' in projectData) && (projectData.version==1))
    return false;

  projectData.version = 1; // with new checks, update here and above simultaneously 

  if ('jobCount' in projectData)  {
    projectData.desc.jobCount = projectData.jobCount;
    delete projectData.jobCount;
    // update = true;
  }

  if ('timestamp' in projectData)  {
    delete projectData.timestamp;
    // update = true;
  }

  if (!projectData.settings)  {
    projectData.settings = {};
    // update = true;
  }

  if (!projectData.settings.hasOwnProperty('prefix_key'))  {
    projectData.settings.prefix_key = 0;   // 0: default; 1: custom
    projectData.settings.prefix     = '';  // custom
    // update = true;
  }

  checkProjectDescData ( projectData.desc,loginData );

  // if (checkProjectDescData(projectData.desc,loginData))
  //   update = true;

  // if (update) 
  //   console.log ( ' >>>>>>> update project data after check' )

  return true;

}


function readProjectData ( loginData,projectName )  {
  let projectDataPath = getProjectDataPath ( loginData,projectName );
  let projectData     = utils.readObject ( projectDataPath );
  if (projectData)  {
    if (checkProjectData(projectData,loginData))
      writeProjectData ( loginData,projectData,true );
// pd.printProjectTree ( ' >>>read_project_data',projectData );
  }
  return projectData;
}


function readProjectDesc ( loginData,projectName )  {
  let projectDescPath = getProjectDescPath ( loginData,projectName );
  let projectDesc     = utils.readObject ( projectDescPath );
  if (!projectDesc)  {
    let projectData = readProjectData ( loginData,projectName );
    if (projectData)  {
      projectDesc = projectData.desc;
      utils.writeObject ( projectDescPath,projectDesc );
    } else  {
      let projectDir = getProjectDirPath ( loginData,projectName );
      if (utils.isSymbolicLink(projectDir))  {
        // dead link after deleting shared project by owner
        utils.removeFile ( projectDir );  // no use anyway
      }
    }
  }
  return projectDesc;  // may be null
}


function writeProjectList ( loginData,projectList,force_sync=false )  {
  let userProjectsListPath = getUserProjectListPath ( loginData );
  let projects = projectList.projects;
  projectList.projects = [];  // make file slimmer
  let rc = utils.writeObject ( userProjectsListPath,projectList,force_sync );
  projectList.projects = projects;
  return rc;
}


function readProjectList ( loginData,mode=0 )  {
// mode = 0 : read, compose and rewrite 
//      = 1 : read and compose, do not rewrite
//      = 2 : read only, do not compose and rewrite
  let t0 = performance.now();
  let userProjectsListPath = getUserProjectListPath ( loginData );
  let pList = utils.readClass ( userProjectsListPath );
  if (pList && (mode<2))  {
    // read all project descriptions anew
    // think how to make this more smart in future
    pList.projects = [];
    // if (!('startmode' in pList))
    //   pList.startmode = pd.start_mode.auto;
    let dirlist = fs.readdirSync ( getUserProjectsDirPath(loginData) );
    for (let i=0;i<dirlist.length;i++)
      if (dirlist[i].endsWith(projectExt))  {
        let pname = path.parse(dirlist[i]).name;
        let pdesc = readProjectDesc ( loginData,pname );
        if (pdesc && checkProjectDescData(pdesc,loginData))  {
          let pData = readProjectData ( loginData,pdesc.name );
          if (pData)  {
            writeProjectData ( loginData,pData,true );
            pdesc = pData.desc;
          } else  {
            log.error ( 70,'project data not found at ' +
                           getProjectDataPath(loginData,pdesc.name) );
            pdesc = null;
          }
        }
        if (pdesc)
          pList.projects.push ( pdesc );
      }
    pList.resetFolders ( loginData.login );
    // if (mode<1)
    //   writeProjectList ( loginData,pList,true );
    anl.logPerformance ( 'Reading Project List, ms/project',performance.now()-t0,
                         pList.projects.length );
  }
  return pList;
}


function writeDockData ( loginData,dockData )  {
  let userDockDataPath = getUserDockDataPath ( loginData );
  return utils.writeObject ( userDockDataPath,dockData );
}


function readDockData ( loginData )  {
  let userDockDataPath = getUserDockDataPath ( loginData );
  let dockData = utils.readObject ( userDockDataPath );
  if (!dockData)  {
    dockData = new pd.DockData();
    dockData.tasks = [
      { task:'TaskRefmac', title:'Refinement with Refmac',   icon:'task_refmac' },
      { task:'TaskCootMB', title:'Model Building with Coot', icon:'task_coot'   }
    ];
    utils.writeObject ( userDockDataPath,dockData );
  }
  return dockData;
}


// ===========================================================================

function makeNewUserProjectsDir ( loginData )  {
let response = null;  // must become a cmd.Response object to return

  log.standard ( 1,'make new user projects directory, login ' + loginData.login );

  // Get users' projects directory name
  let userProjectsDirPath = getUserProjectsDirPath ( loginData );

  if (utils.fileExists(userProjectsDirPath))  {
    // just a message, do not change anything in the existing projects directory
    log.error ( 2,'repeat attempt to create user projects directory, login ' +
                  loginData.login );
    response = new cmd.Response ( cmd.fe_retcode.ok,
                                '[00012] User projects directory exists','' );
  } else if (utils.mkDir(userProjectsDirPath)) {
    if (utils.writeObject(getUserProjectListPath(loginData),new pd.ProjectList(loginData.login))) {
      response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                          '[00013] User Project List cannot be written.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.mkDirError,
          '[00014] Cannot create User Projects Directory',
          emailer.send ( conf.getEmailerConfig().maintainerEmail,
            'CCP4 Create User Projects Dir Fails',
            'Detected mkdir failure at making new user projects directory, ' +
            'please investigate.' )
      );
  }

  return response;

}


// ===========================================================================

function getProjectList ( loginData )  {
let response = null;  // must become a cmd.Response object to return
  log.detailed ( 3,'get project list, login ' + loginData.login );
  let pList = readProjectList ( loginData );
  if (pList)  {
    // ration.calculate_user_disk_space ( loginData,pList );
    // // ration.calculateUserDiskSpace ( loginData );
    response = new cmd.Response ( cmd.fe_retcode.ok,'',pList );
  } else
    response = new cmd.Response ( cmd.fe_retcode.readError,
                                  '[00015] Project list cannot be read.','' );
  return response;
}


// ===========================================================================

function getDockData ( loginData )  {
let response = null;  // must become a cmd.Response object to return
  log.detailed ( 3,'get dock data, login ' + loginData.login );
  let dockData = readDockData ( loginData );
  if (dockData)
        response = new cmd.Response ( cmd.fe_retcode.ok,'',dockData );
  else  response = new cmd.Response ( cmd.fe_retcode.readError,
                                      '[00151] Dock data cannot be read.','' );
  return response;
}


// ===========================================================================

function _make_unique_list ( line )  {
  if (line)
    return line.split(',')
             .map(function(item){ return item.trim(); })
             .filter(function(item,pos,self){ return self.indexOf(item)==pos; });
  return '';
}

function readProjectShare ( loginData )  {
let pShare = utils.readClass ( getUserProjectSharePath ( loginData ) );
  if (!pShare)
    pShare = new pd.ProjectShare();
  return pShare;
}

function writeProjectShare ( loginData,pShare )  {
  return utils.writeObject ( getUserProjectSharePath(loginData),pShare );
}

function getSharedPrjList ( loginData )  {
  return new cmd.Response ( cmd.fe_retcode.ok,'',readProjectShare(loginData) );
}


// ===========================================================================

function getUserKnowledgeData ( loginData )  {
let response  = null;  // must become a cmd.Response object to return
let knowledge = {};

  log.detailed ( 4,'get knowledge data, login ' + loginData.login );

  // Get users' projects list file name
  let userKnowledgePath = getUserKnowledgePath ( loginData );

  if (utils.fileExists(userKnowledgePath))
    knowledge = utils.readObject ( userKnowledgePath );

  response = new cmd.Response ( cmd.fe_retcode.ok,'',knowledge );

  return response;

}


// ===========================================================================

function makeNewProject ( loginData,projectDesc )  {
let response = null;  // must become a cmd.Response object to return

//  console.log ( JSON.stringify(projectDesc) );

  log.standard ( 5,'make new project ' + projectDesc.name +
                   ', login ' + loginData.login );

  // Get users' projects directory name
  let projectDirPath = getProjectDirPath ( loginData,projectDesc.name );

  if (utils.fileExists(projectDirPath))  {
    // just issue a message, do not change anything in the existing
    // projects directory

    log.error ( 6,'repeat attempt to create project directory ' + projectDesc.name +
                  ', login ' + loginData.login );
    response = new cmd.Response ( cmd.fe_retcode.ok,'Project directory exists','' );

  } else if (utils.mkDir(projectDirPath)) {

    let projectData  = new pd.ProjectData();
    projectData.desc = projectDesc;
    if (writeProjectData(loginData,projectData,true,true))  {
      if (utils.mkDir(path.join(projectDirPath,replayDir))) {
        let pname = projectData.desc.name;
        projectData.desc.name = projectData.desc.name + ':' + replayDir;
        if (writeProjectData(loginData,projectData,true,true))
          response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
        projectData.desc.name = pname;
      }
    }
    if (!response)
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                   '[00017] Project data cannot be written.','' );

  } else  {

    response  = new cmd.Response ( cmd.fe_retcode.mkDirError,
            '[00018] Cannot create Project Directory',
            emailer.send ( conf.getEmailerConfig().maintainerEmail,
                  'CCP4 Create Project Dir Fails',
                  'Detected mkdir failure at making new project directory, ' +
                  'please investigate.' )
        );

  }

  return response;

}


// ===========================================================================


function delete_project ( loginData,projectName,disk_space,projectDirPath )  {

  // subtract project disck space from user's ration
  ration.updateProjectStats ( loginData,projectName,0.0,-disk_space,0,true );

  utils.removePathAsync ( projectDirPath );

  ration.maskProject ( loginData,projectName );

  if (utils.fileExists(projectDirPath))
    erc = emailer.send ( conf.getEmailerConfig().maintainerEmail,
              'CCP4 Clooud Remove Project Directory Fails',
              'Detected removePathAsync() failure at deleting project directory, ' +
              'please investigate.' );

  // clearJobs() only to decrease the amount of transmitted data
  return ration.calculateUserDiskSpace(loginData).clearJobs();

}

function unshare_project ( pDesc )  {
let unshared = [];
  for (let shareLogin in pDesc.share)  {
    let uLoginData = user.getUserLoginData ( shareLogin );
    if (uLoginData)  {
      unshared.push ( uLoginData );
      let pShare = readProjectShare ( uLoginData );
      pShare.removeShare ( pDesc );
      writeProjectShare  ( uLoginData,pShare );
    }
  }
  return unshared;
}


function deleteProject ( loginData,projectName )  {
let response       = null;  // must become a cmd.Response object to return
let rdata          = {};    // response data
let erc            = '';
let projectDirPath = getProjectDirPath ( loginData,projectName );
let pData          = readProjectData ( loginData,projectName );

  // maintain share lists
  if (pData && (pData.desc.owner.login==loginData.login))  {
    // project can be deleted only by owner or keeper; shared projects can be only
    // unjoined

    log.standard ( 7,'delete project ' + projectName + ', login ' + loginData.login );

    // remove it from all shares
    unshare_project ( pData.desc.share );
    rdata.ration = delete_project ( loginData,projectName,pData.desc.disk_space,
                                    projectDirPath);

  } else if (pData && (pData.desc.owner.login!=loginData.login))  {

    if (utils.isSymbolicLink(projectDirPath))  {
      log.standard ( 7,'unjoin project ' + projectName + ', login ' + loginData.login );
      // unjoin project
      utils.removePath ( projectDirPath );  // will only unlink as this is a link
      rdata.ration = ration.calculateUserDiskSpace(loginData).clearJobs();  // just in case
    } else  {
      // old shares were copied, this is the case
      log.warning ( 7,'delete project ' + pData.desc.owner.login + ':' +
                      projectName + ', by non-owner ' + loginData.login );
      // _delete_project();
      rdata.ration = delete_project ( loginData,projectName,pData.desc.disk_space,
                                      projectDirPath);
    }

  } else  {

    log.error ( 61,'project ' + loginData.login + ':' + projectName +
                   ' attempted for deletion, but was not found' );
    response = new cmd.Response ( cmd.fe_retcode.noProjectData,
                                  'Project not found',rdata );

  }

  if (!response)
    response = new cmd.Response ( cmd.fe_retcode.ok,erc,rdata );

  return response;

}


// ===========================================================================

function saveProjectList ( loginData,newProjectList )  {
let response = null;  // must become a cmd.Response object to return

  log.detailed ( 8,'save project list, login ' + loginData.login );

  let pList = readProjectList ( loginData,1 );
  if (pList)  {

    // create new projects
    for (let i=0;i<newProjectList.projects.length;i++)  {
      let k = -1;
      let pName = newProjectList.projects[i].name;
      for (let j=0;(j<pList.projects.length) && (k<0);j++)
        if (pName==pList.projects[j].name)
          k = j;
      if ((k<0) && (newProjectList.projects[i].owner.login==''))  {
        let rsp = makeNewProject ( loginData,newProjectList.projects[i] );
        if (rsp.status!=cmd.fe_retcode.ok)
          response = rsp;
      } else if ((k>=0) &&
           ((newProjectList.projects[i].folderPath!=pList.projects[k].folderPath) ||
            (!pd.compareProjectLabels(loginData.login,
                                      newProjectList.projects[i],
                                      pList.projects[k])
            )
           ))  {
        // project folder changed, update project metafile
        let pData  = readProjectData ( loginData,pName );
        pData.desc = newProjectList.projects[i];
        writeProjectData ( loginData,pData,true );
      }
    }

    if (!response)  {
      if (writeProjectList(loginData,newProjectList))  {
        response = new cmd.Response ( cmd.fe_retcode.ok,'',{} );
      } else
        response = new cmd.Response ( cmd.fe_retcode.writeError,
                              '[00020] Project list cannot be written.',{} );
    }

  } else  {
    response = new cmd.Response ( cmd.fe_retcode.readError,
                                 '[00019] Project list cannot be read.',{} );
  }

  return response;

}

// ===========================================================================

function saveDockData ( loginData,newDockData )  {
let response = null;  // must become a cmd.Response object to return

  log.detailed ( 81,'save dock data, login ' + loginData.login );

  if (writeDockData(loginData,newDockData))
        response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
  else  response = new cmd.Response ( cmd.fe_retcode.writeError,
                          '[00201] Dock data cannot be written.','' );

  return response;

}


// ===========================================================================

function getJobMetas ( loginData,projectName )  {
let projectDirPath = getProjectDirPath ( loginData,projectName );
let jmetas = [];
  if (utils.dirExists(projectDirPath))  {
    let files = fs.readdirSync ( projectDirPath );
    for (let i=0;i<files.length;i++)
      if (files[i].startsWith(jobDirPrefix))  {
        let fpath = path.join ( projectDirPath,files[i],task_t.jobDataFName );
        jmetas.push ({
          path : fpath,
          meta : utils.readObject ( fpath )  // can be null
        });
      }
  }
  return jmetas;
}

function prepareProjectExport ( loginData,projectList )  {

  log.standard ( 9,'export project "' + projectList.current +
                   '", login ' + loginData.login );

  let projectDirPath = getProjectDirPath ( loginData,projectList.current );
  let exportFilePath = path.join ( projectDirPath,
                                   projectList.current + cmd.projectFileExt );
  utils.removeFile ( exportFilePath );  // just in case

  // nasty patch, remove coot backups because they use .gz files -- and they
  // make projects not importable on Windows
  utils.cleanDirExt ( projectDirPath,'.gz' );

  // remove all customisation from the project: shares, labels and folder paths

  let projectData = readProjectData ( loginData,projectList.current );
  // let folderPath = projectData.desc.folderPath;
  // let labels     = projectData.desc.owner.labels;
  let share = projectData.desc.share;
  projectData.desc.share = {};
  if (!writeProjectData(loginData,projectData,false))  {
    log.error ( 10,'errors before packing at ' + projectDirPath + ' for export' );
    return new cmd.Response ( cmd.fe_retcode.writeError,
                          '[00034] Project metadata cannot be written.','' );
  }

  let nrunning = 0;
  let jmetas   = getJobMetas ( loginData,projectList.current );
  for (let i=0;i<jmetas.length;i++)
    if (jmetas[i].meta &&
         ((jmetas[i].meta.state==task_t.job_code.running) || 
          (jmetas[i].meta.state==task_t.job_code.exiting)))
      nrunning++;

  // send_dir.packDir ( projectDirPath,'*',null,null,function(code,jobballSize){
  send_dir.packDir ( projectDirPath,null,function(code,jobballPath,jobballSize){
    let pData = readProjectData ( loginData,projectList.current );
    pData.desc.share = share;
    if (!writeProjectData(loginData,pData,true))
      log.error ( 11,'errors after packing at ' + projectDirPath + ' for export' );
    // let jobballPath = send_dir.getJobballPath ( projectDirPath );
    if (code)  {
      log.error ( 12,'errors at packing ' + projectDirPath + ' for export' );
      utils.removeFile ( jobballPath );  // export will never get ready!
    } else  {
      log.standard ( 10,'packed' );
      utils.moveFile   ( jobballPath,exportFilePath );
    }
  });

  return new cmd.Response ( cmd.fe_retcode.ok,'',{ nrunning : nrunning } );

}

function checkProjectExport ( loginData,projectList )  {
  let projectDirPath = getProjectDirPath ( loginData,projectList.current );
  let exportFilePath = path.join ( projectDirPath,
                                   projectList.current + cmd.projectFileExt );
  let rdata = {};
  if (utils.fileExists(exportFilePath))
        rdata.size = utils.fileSize(exportFilePath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}

function finishProjectExport ( loginData,projectList )  {
  let projectDirPath = getProjectDirPath ( loginData,projectList.current );
  let exportFilePath = path.join ( projectDirPath,
                                   projectList.current + cmd.projectFileExt );
  //let tarballPath2   = path.join ( projectDirPath,'__' + projectList.current+'.tar.gz' );
  utils.removeFile ( exportFilePath );
  //utils.removeFile ( tarballPath2 );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================

function getJobExportNames ( loginData,task )  {
  let exportName     = task.project + '-job_' + task.id + '.zip';
  let jobDirPath     = getJobDirPath ( loginData,task.project,task.id );
  let exportFilePath = path.join     ( jobDirPath,exportName );
  return [ exportName,jobDirPath,exportFilePath ];
}

function prepareJobExport ( loginData,task )  {

  log.standard ( 19,'export job "' + task.project + '-job_' + task.id +
                    '", login ' + loginData.login );

  let exp_names      = getJobExportNames ( loginData,task );
  // let exportName  = exp_names[0];
  let jobDirPath     = exp_names[1];
  let exportFilePath = exp_names[2];
  utils.removeFile ( exportFilePath );  // just in case

  // send_dir.packDir ( jobDirPath,'*',null,null,function(code,jobballSize){
  send_dir.packDir ( jobDirPath,null,function(code,jobballPath,jobballSize){
    // let jobballPath = send_dir.getJobballPath ( jobDirPath );
    if (code)  {
      log.error ( 20,'errors at packing ' + jobDirPath + ' for export' );
      utils.removeFile ( jobballPath );  // export will never get ready!
    } else  {
      log.standard ( 20,'packed' );
      utils.moveFile   ( jobballPath,exportFilePath );
    }
  });

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


function checkJobExport ( loginData,task )  {
  let exportFilePath = getJobExportNames(loginData,task)[2];
  let rdata = {};
  if (utils.fileExists(exportFilePath))
        rdata.size = utils.fileSize(exportFilePath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}

function finishJobExport ( loginData,task )  {
  let exportFilePath = getJobExportNames(loginData,task)[2];
  utils.removeFile ( exportFilePath );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================
// Failed Job Export

function getFailedJobExportNames ( fjdata )  {
  //let path_list   = fjdata.path.split('/');
  if ('path' in fjdata)  {
    let path_list   = fjdata.path.split('\\').pop().split('/');
    let exportName  = path_list[path_list.length-1] + '.zip';
    let jobDirPath  = conf.getFEConfig().getJobsSafePath();
    for (let i=1;i<path_list.length;i++)
      jobDirPath  = path.join ( jobDirPath,path_list[i] );
    let exportFilePath = path.join ( conf.getFEConfig().getJobsSafePath(),exportName );
    let url            = cmd.__special_fjsafe_tag + '/' + exportName;
    return [ exportName,jobDirPath,exportFilePath,url ];
  } else
    return [ '','','','' ];
}

function prepareFailedJobExport ( loginData,fjdata )  {

  if ('path' in fjdata)  {

    log.standard ( 19,'export failed job "' + fjdata.path + '", login ' + loginData.login );

    let exp_names   = getFailedJobExportNames ( fjdata );
    // let exportName  = exp_names[0];
    let jobDirPath  = exp_names[1];
    let exportFilePath = exp_names[2];
    utils.removeFile ( exportFilePath );  // just in case

    // send_dir.packDir ( jobDirPath,'*',exportFilePath,null,
    send_dir.packDir ( jobDirPath,null,
      function(code,jobballPath,jobballSize){
        if (code)  {
          log.error ( 20,'errors at packing ' + jobDirPath + ' for export' );
          utils.removeFile ( jobballPath );  // export will never get ready!
        } else
          utils.moveFile   ( jobballPath,exportFilePath );
      });

    return new cmd.Response ( cmd.fe_retcode.ok,'',exp_names[3] );

  } else
    return new cmd.Response ( cmd.fe_retcode.ok,'','no_exp_names' );

}

function checkFailedJobExport ( loginData,fjdata )  {
  let exportFilePath = getFailedJobExportNames(fjdata)[2];
  let rdata = {};
  if (exportFilePath && utils.fileExists(exportFilePath))
        rdata.size = utils.fileSize(exportFilePath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}

function finishFailedJobExport ( loginData,fjdata )  {
  let exportFilePath = getFailedJobExportNames(fjdata)[2];
  if (exportFilePath)
    utils.removeFile ( exportFilePath );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================

function getProjectData ( loginData,data )  {

  let t0 = performance.now();
  let response = null;

  // read project list to get the name of current project
  let userProjectsListPath = getUserProjectListPath ( loginData );
  let projectList = utils.readObject ( userProjectsListPath );

  if (!projectList)  {  // this should never happen, is here only for safety
    response = getProjectList ( loginData );
    if (response.status!=cmd.fe_retcode.ok)
      return response;
    projectList = response.data;
    log.warning ( 11,'get current project data (' + response.data.current +
                     '), login ' + loginData.login );
  }

  let projectName = projectList.current;  // projectID or archiveID

  if (data.mode=='replay')
    projectName += ':' + replayDir;

  // read project data
  let njobs = 0;
  let pData = readProjectData ( loginData,projectName );
  if (pData)  {
    if (!pd.isProjectAccessible(loginData.login,pData.desc))  {  
      response = new cmd.Response ( cmd.fe_retcode.projectAccess,
                                '[00035] Project access denied.',
                                { access_denied : true } );
    } else  {
      let d = {};
      d.meta      = pData;
      d.tasks_add = [];
      d.tasks_del = [];
      let projectDirPath = getProjectDirPath ( loginData,projectName );
      response = new cmd.Response ( cmd.fe_retcode.ok,'',d );
      fs.readdirSync(projectDirPath).sort().forEach(function(file,index){
        if (file.startsWith(jobDirPrefix)) {
          let jobPath = path.join ( projectDirPath,file,task_t.jobDataFName );
          let task    = utils.readObject ( jobPath );
          if (task)  {
            d.tasks_add.push ( task );
          } else  {
            d.message = '[00021] Job metadata cannot be read.';
            utils.removePathAsync ( path.join ( projectDirPath,file ) );
          }
          njobs++;
        }
      });
    }
  } else  {
    let projectDataPath = getProjectDataPath ( loginData,projectName );
    if (utils.fileExists(projectDataPath))  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                            '[00022] Project metadata cannot be read or is corrupt.',
                            '' );
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.ok,'',{ 
          'missing' : 1,
          'project' : projectName 
      });
    }
  }

  t0 = performance.now() - t0;
  console.log ( ' >>>> project read in ' + t0.toFixed(3) + 'ms' );
  if (njobs>0)
    anl.logPerformance ( ' Reading Project Data, ms/job',t0,njobs );

  return response;

}

/*
function getProjectData ( loginData,data )  {

  let t0 = performance.now();
  let response = null;

  // do not write projectList.projects and always compose them at reading
  // below in this function, where projectList.projects are used, just read 
  // pdesc directly from project directory.
  // do not read projectList.projects here -- and this is Ok
  // try tp get rid of projectList here, pass project name in data
  let userProjectsListPath = getUserProjectListPath ( loginData );
  let projectList = utils.readObject ( userProjectsListPath );

  if (!projectList)  {  // this should never happen, is here only for safety
    response = getProjectList ( loginData );
    if (response.status!=cmd.fe_retcode.ok)
      return response;
    projectList = response.data;
    log.warning ( 11,'get current project data (' + response.data.current +
                     '), login ' + loginData.login );
  }

  let projectName    = projectList.current;  // projectID or archiveID
  // read pdesc here and identify archive status from there
  let archive_folder = (projectList.currentFolder.type==pd.folder_type.archived) ||
                       (projectList.currentFolder.type==pd.folder_type.cloud_archive);

  // check that current project exists
  let pdesc = null;
  if (archive_folder)  {
    for (let i=0;(i<projectList.projects.length) && (!pdesc);i++)
      if (projectList.projects[i].archive && 
          (projectList.projects[i].archive.id==projectName))
        pdesc = projectList.projects[i];
  }
  if (!pdesc)  {
    for (let i=0;(i<projectList.projects.length) && (!pdesc);i++)
      if (projectList.projects[i].name==projectName)
        pdesc = projectList.projects[i];
    if (!pdesc)
      return new cmd.Response ( cmd.fe_retcode.ok,'',{ 
          'missing' : 1,
          'project' : projectName 
      });
  }

  if (data.mode=='replay')
    projectName += ':' + replayDir;

  let njobs = 0;
  let pData = readProjectData ( loginData,projectName );
  if (pData)  {
    if (!pd.isProjectAccessible(loginData.login,pData.desc))
      return new cmd.Response ( cmd.fe_retcode.projectAccess,
                                '[00035] Project access denied.',
                                { access_denied : true } );
    let d = {};
    d.meta      = pData;
    d.tasks_add = [];
    d.tasks_del = [];
    let projectDirPath = getProjectDirPath ( loginData,projectName );
    response = new cmd.Response ( cmd.fe_retcode.ok,'',d );
    fs.readdirSync(projectDirPath).sort().forEach(function(file,index){
      if (file.startsWith(jobDirPrefix)) {
        let jobPath = path.join ( projectDirPath,file,task_t.jobDataFName );
        let task    = utils.readObject ( jobPath );
        if (task)  {
          d.tasks_add.push ( task );
        } else  {
          d.message = '[00021] Job metadata cannot be read.';
          utils.removePathAsync ( path.join ( projectDirPath,file ) );
        }
        njobs++;
      }
    });
  } else  {
    let projectDataPath = getProjectDataPath ( loginData,projectName );
    if (utils.fileExists(projectDataPath))  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                 '[00022] Project metadata cannot be read.','' );
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                            '[00023] Project metadata file does not exist.','' );
    }
  }

  t0 = performance.now() - t0;
  console.log ( ' >>>> project read in ' + t0.toFixed(3) + 'ms' );
  if (njobs>0)
    anl.logPerformance ( ' Reading Project Data, ms/job',t0,njobs );

  return response;

}
*/

// ===========================================================================

function checkTimestamps ( loginData,projectDesc )  {
// 'projectDesc' comes from the client. Client does not change timestamps,
// therefore, timestamp on server side may be either equal or ahead of
// timestamp in 'projectDesc'.
  let rdata    = {};  // response data object
//  rdata.pdesc  = projectDesc;
  rdata.reload = 0;  // project reload codes for client:
                     //  0: no reload is needed
                     //  1: reload is needed but current operation may continue
                     //  2: reload is mandatory, current operation must terminate
  rdata.pdesc  = null;
  if ((Object.keys(projectDesc.share).length>0) || projectDesc.autorun)  {  // the project is shared
    rdata.pdesc = readProjectDesc ( loginData,projectDesc.name );
    if (rdata.pdesc)  {
      if (rdata.pdesc.timestamp>projectDesc.timestamp)  {
        // client timestamp is behind server project timestamp; request
        // update on client side
        rdata.reload = 2;  // project changed considerably, reload client
        // if (rdata.pdesc.project_version>projectDesc.project_version)
        //       rdata.reload = 2;  // project changed considerably, reload client
        // else  rdata.reload = 1;  // on-client data should be safe
      }
    }
  }
  return rdata;
}


// function checkSharedProject ( loginData,projectData )  {
// // 'projectData' comes from the client. Client does not change timestamps,
// // therefore, timestamp on server side may be either equal or ahead of
// // timestamp in 'projectData.desc'.
//   let checkData   = {};
//   checkData.pdata = projectData;  // synced Project Data
//   checkData.rdata = {};           // response data object
//   checkData.rdata.reload = 0;  // project reload codes for client:
//                      //  0: no reload is needed
//                      //  1: reload is needed but current operation may continue
//                      //  2: reload is mandatory, current operation must terminate
//   checkData.rdata.pdesc = null;
//   let pdesc = projectData.desc;
//   if ((pdesc.owner.share.length>0) || pdesc.autorun)  {  // the project is shared
//     let pData = readProjectData ( loginData,pdesc.name );
//     if (pData)  {
//       checkData.rdata.pdesc = pData.desc;
//       if (pData.desc.timestamp>pdesc.timestamp)  {
//         // client timestamp is behind on-server project's timestamp; try to merge
//         // projects
//         // request update on client side
//         if (rdata.pdesc.project_version>projectDesc.project_version)
//               rdata.reload = 2;  // project changed considerably, reload client
//         else  rdata.reload = 1;  // on-client data should be safe
//       }
//     }
//   }
//   return checkData;
// }


// function advanceJobCounter ( loginData,data )  {
//   //let response    = null;
//   let projectDesc = data.meta;
//   let rdata       = checkTimestamps ( loginData,projectDesc );
//   rdata.project_missing = false;
//   if (!rdata.reload)  {
//     let projectData = readProjectData ( loginData,projectDesc.name );
//     if (projectData)  {
//       projectData.desc.jobCount++;
//       writeProjectData ( loginData,projectData,false );  // do not change the timestamp
//       rdata.pdesc = projectData.desc;
//     } else if (projectDesc.owner.share.length>0)
//       rdata.project_missing = true;
//   }
//   return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
// }

// function getTreeNodeByTaskId ( projectTree,taskId )  {
//   let node = null;
//   for (let i=0;(i<projectTree.length) && (!node);i++)
//     if (projectTree[i].dataId==taskId)
//       node = projectTree[i];
//     else if (projectTree[i].children.length>0)
//       node = getTreeNodeByTaskId ( projectTree[i].children,taskId );
//   return node;
// }

function makeNodeName ( task,title )  {
let text = '[';
  if (task.autoRunId)
    text = '<b>' + task.autoRunId + ':</b>[';
  text += com_utils.padDigits(task.id,4) + '] ' + title;
  return text;
}


function make_job_directory ( loginData,projectName,id0 )  {
let id    = id0-1;
let rc    = 1;
let dpath = null;
  while (rc>0)  {
    id++;
    dpath = getJobDirPath ( loginData,projectName,id );
    rc    = utils.mkDir_check ( dpath );
  }
  return [rc,dpath,id];
}


function saveProjectData ( loginData,data )  {
let response    = null;
let projectData = data.meta;          // client project data
let projectDesc = projectData.desc;
let projectName = projectDesc.name;

  let rdata    = {}; // response data object
  rdata.reload = 0;  // project reload codes for client:
                     //  0: no reload is needed
                     //  1: reload is needed but current operation may continue
                     //  2: reload is mandatory, current operation must terminate
  rdata.pdesc  = null;
  rdata.jobIds = [];
  let jobDirs  = [];

  for (let i=0;i<data.tasks_add.length;i++)  {
    rdata.jobIds.push ( data.tasks_add[i].id );  // this will be returned to
                                                 // client modified or not
    jobDirs.push ( [ null,null ] );  //  [dirpath,jobId]
  }

  rdata.pdesc = readProjectDesc ( loginData,projectName );
  if (rdata.pdesc)  {
  
    if (rdata.pdesc.timestamp>projectDesc.timestamp)  {
      // client timestamp is behind server project timestamp;
      rdata.reload = 1;  // client should reload the project anyway
// console.log ( ' >>>>> timestamps='+rdata.pdesc.timestamp+':'+projectDesc.timestamp );
    }

    let pData = readProjectData ( loginData,projectName );  // server project data

// console.log ( ' >>>>>>> nadd=' + data.tasks_add.length );

    if (data.tasks_add.length>0)  {
      // there are new tasks -- check that trees are compatible
  
      for (let i=0;(i<data.tasks_add.length) && (rdata.reload<=1);i++)  {
        // simply check that all needful jobs are retained in the actual project
        // check that all harvested tasks are there in pData
        let hids = data.tasks_add[i].harvestedTaskIds;
        for (let j=0;(j<hids.length) && (rdata.reload==1);j++)
          if (!pd.getProjectNode(pData,hids[j]))  {
            rdata.reload = 2;
          }

// console.log ( ' >>>>>>> task_id=' + data.tasks_add[i].id );
// console.log ( ' >>>>>>> reload=' + rdata.reload );

        if (rdata.reload<=1)  {

          // Check that suggested new task id does not clash with what is
          // already there in the project. Simply try to create job directory and
          // see if it already exists.
          
          let mjd = make_job_directory ( loginData,projectName,data.tasks_add[i].id );
          
          if (mjd[0]<0)  {
          
            log.error ( 30,'cannot create job directory at ' + mjd[1] );
            data.reload = 2;
            response    = new cmd.Response ( cmd.fe_retcode.mkDirError,
                                    '[00026] Cannot create Job Directory',rdata );
            emailer.send ( conf.getEmailerConfig().maintainerEmail,
                'CCP4 Cloud Create Job Dir Fails',
                '[00026] Detected mkdir failure at making new job directory at<p>' +
                mjd[1] + '<p>please investigate.' );
          
          } else  {
            // job directory was created, log name and id

            jobDirs[i] = [ mjd[1],mjd[2] ];
            // rdata.reload = 1;
            
            if (mjd[2]!=data.tasks_add[i].id)  {
              // there was a clash, job id was changed, update metadata and tree node
              let node = pd.getProjectNode ( projectData,data.tasks_add[i].id );
              if (node)  { // must be always so, but put "if" for server stability
                pData.desc.jobCount  = Math.max ( pData.desc.jobCount,mjd[2] );
                rdata.jobIds[i]      = mjd[2];
                data.tasks_add[i].id = mjd[2];
                node.dataId = data.tasks_add[i].id;
                node.text   = makeNodeName (
                                data.tasks_add[i],
                                node.text.substr(Math.max(0,node.text.indexOf(']')))
                              );
                node.text0  = node.text;
              } else
                log.error ( 31,'no tree node found ' + loginData.login + ':' +
                              projectName + ':' + data.tasks_add[i].id );
            }

          }

          if (rdata.reload==1)  { // Given tree is behind the actual project state.

// console.log ( ' >>>>>>> task_id=' + data.tasks_add[i].id );

            // Check that the parent node for added task is there in pData;
            // if found than projects can be merged without general reload of
            // the client.
            // Find the whole branch in the submitted project
            let node_lst = pd.getProjectNodeBranch ( projectData,data.tasks_add[i].id );

            // and find parent task id (skip remarks and folders)
            let pDataId = '';
            for (let j=1;(j<node_lst.length) && (!pDataId);j++)
              pDataId = node_lst[j].dataId;  // empty for remarks

// console.log ( ' >>>>>>> pDataId=' + pDataId );

            if (pDataId)  {
              // find parent node for to-be-added job in server-side copy of project
              let pnode = pd.getProjectNode ( pData,pDataId );
              if (pnode)  {  // node found, copy the to-be-added node over.
                // Before copying, remove branches, coming with the added node,
                // from the destination (works if node was inserted rather than added)
                let childIds = [];
                for (let j=0;j<node_lst[0].children.length;j++)
                  childIds.push ( node_lst[0].children[j].dataId );
                if (childIds.length>0)  {
                  let pchildren  = pnode.children;
                  pnode.children = [];
                  for (let j=0;j<pchildren.length;j++)
                    if (childIds.indexOf(pchildren[j].dataId)<0)
                      pnode.children.push ( pchildren[j] );
                }
                pnode.children.push ( node_lst[0] );
// console.log ( ' >>>>> added ' + node_lst[0].dataId + ' to ' + pnode.dataId );
              } else  {
                // server-side tree differs significantly from the client-side tree
                // so that adding new task is not possible; request hard reload
                // in browser
                rdata.reload = 2;
              }
            } else if ((pData.tree.length>0) && (node_lst.length>1))  {
              // task to be added at root, always allow, may be a problem with remarks
              pData.tree[0].children.push ( node_lst[0] );
            } else   {  // have to update, something's wrong -- should never be here
              log.error ( 13,'unexpected reload request in saveProjectData()' );
              rdata.reload = 2;
            }
          }

        }

      }

    }

    if (rdata.reload>1)  {  // no way, client must update the project
      for (let i=0;i<jobDirs.length;i++)
        if (jobDirs[i][0])
          utils.removePathAsync ( jobDirs[i][0] );
      if (response)
        return response;
      return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
    }

    if (rdata.pdesc.timestamp>projectDesc.timestamp)  {
      // further on, will work on the actual Project, but mind that the tree
      // may return deleted nodes, see below
      // pd.printProjectTree ( 'Client tree',projectData );
      // pd.printProjectTree ( 'Server tree',pData );
      projectData = pData;
      projectDesc = projectData.desc;
    }

  } else  {

    let ownerLoginData = user.getUserLoginData ( projectDesc.owner.login );
    if (ownerLoginData)  {
      if (!utils.dirExists(getProjectDirPath(ownerLoginData,projectName)))  {
        rdata.reload  = -11111;
        rdata.deleted = true;
        return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
      }
    } else if (pd.isProjectShared('',projectDesc))  {
      rdata.reload  = -11112;
      rdata.noowner = true;
      return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
    }

    log.error ( 32,'cannot read project description ' + loginData.login + ':' +
                   projectName  );
    emailer.send ( conf.getEmailerConfig().maintainerEmail,
        'CCP4 Cloud Read Project Description Fails',
        '[00027] Detected project description read failure for <b>' + 
        loginData.login + ':' + projectName + '</b><p>Please investigate.' );
    rdata.reload = 2;
    return  new cmd.Response ( cmd.fe_retcode.readError,
                               '[00027] Cannot read projecty description',rdata );
  }

  // Get users' projects list file name
  let projectDataPath = getProjectDataPath ( loginData,projectName );

  if (utils.fileExists(projectDataPath))  {

    let disk_space_change = 0.0;
    if ('disk_space' in projectDesc)  {  // backward compatibility on 05.06.2018
      for (let i=0;i<data.tasks_del.length;i++)
        disk_space_change -= data.tasks_del[i][1]
      projectDesc.disk_space += disk_space_change;
      projectDesc.disk_space  = Math.max ( 0,projectDesc.disk_space );
    } else  {
      projectDesc.disk_space  = 0.0;   // should be eventually removed
      projectDesc.cpu_time    = 0.0;   // should be eventually removed
    }

    if (disk_space_change!=0.0)  {
      // disk space change is booked to project owner inside this function
      //ration.changeProjectDiskSpace ( loginData,projectName,disk_space_change,false );
      let ownerLoginData = loginData;
      if (loginData.login!=projectDesc.owner.login)
        ownerLoginData = user.getUserLoginData ( projectDesc.owner.login );
      ration.updateProjectStats ( ownerLoginData,projectName,
                                  0.0,disk_space_change,0,true );
    }

    for (let i=0;i<data.tasks_add.length;i++)
      projectDesc.jobCount = Math.max ( projectDesc.jobCount,data.tasks_add[i].id );

    if (data.tasks_del.length>0)  // save on reading files ration does not change
      rdata.ration = ration.getUserRation(loginData).clearJobs();
    rdata.pdesc = projectData.desc;

    // this loop is here in order to minimise time for writing project tree in file
    if (rdata.reload>0) // in case reload==1, project tree contains non-deleted nodes
      for (let i=0;i<data.tasks_del.length;i++)
        pd.deleteProjectNode ( projectData,data.tasks_del[i][0] );

    let update_time_stamp = data.update || (rdata.reload>0) ||
                                           (data.tasks_del.length>0) ||
                                           (data.tasks_add.length>0);

    if (writeProjectData(loginData,projectData,update_time_stamp))  {

      rdata.pdesc = projectData.desc;

      // remove job directories from the 'delete' list
      for (let i=0;i<data.tasks_del.length;i++)  {
        rj.killJob ( loginData,projectName,data.tasks_del[i][0] );
        utils.removePathAsync ( getJobDirPath(loginData,projectName,data.tasks_del[i][0]) );
      }

      response = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

      // add job directories from the 'add' list
      for (let i=0;i<data.tasks_add.length;i++)
        if (jobDirs[i][0])  {

          let jobDirPath  = jobDirs[i][0];
          let jobDataPath = getJobDataPath ( loginData,projectName,data.tasks_add[i].id );

          if (!utils.writeObject(jobDataPath,data.tasks_add[i])) {
            log.error ( 32,'cannot write job meta at ' + jobDataPath );
            response = new cmd.Response ( cmd.fe_retcode.writeError,
                                '[00025] Job metadata cannot be written.','' );
          }

          if (('cloned_id' in data.tasks_add[i]) && data.tasks_add[i].cloned_id)  {
            let taski      = class_map.makeClass ( data.tasks_add[i] );
            let cloneItems = taski.cloneItems();
            cloneItems.push ( 'auto.context' );
            cloneItems.push ( 'auto.meta'    );
            if (cloneItems.length>0)  {
              // We copy items into cloned directory asynchronously without
              // making sure that copy completes before response is sent back
              // to client. This is a potential trouble, however, we assume
              // no massive copying here, so that it should work.
              let jobDirPath0 = getJobDirPath ( loginData,projectName,taski.cloned_id );
              for (let j=0;j<cloneItems.length;j++)  {
                let item_src  = path.join ( jobDirPath0,cloneItems[j] );
                if (utils.fileExists(item_src))  {
                  let item_dest = path.join ( jobDirPath ,cloneItems[j] );
                  if (cloneItems[j]=='auto.context')  {
                    let context = utils.readObject ( item_src );
                    if (context)  {
                      for (let key in context.job_register)
                        if (context.job_register[key]==data.tasks_add[i].cloned_id)
                          context.job_register[key] = taski.id;
                      utils.writeObject ( item_dest,context );
                    }
                  } else  {
                    fs.copy ( item_src,item_dest,function(err)  {
                      if (err)  {
                        log.error ( 33,'error copying item ' + item_src  );
                        log.error ( 33,'                to ' + item_dest );
                        log.error ( 33,'error: ' + err );
                      }
                    });
                  }
                }
              }
            }
          }

          // create report directory
          utils.mkDir_anchor ( getJobReportDirPath(loginData,projectName,data.tasks_add[i].id) );

          // create input directory (used only for sending data to NC)
          utils.mkDir_anchor ( getJobInputDirPath(loginData,projectName,data.tasks_add[i].id) );

          // create output directory (used for hosting output data)
          utils.mkDir_anchor ( getJobOutputDirPath(loginData,projectName,data.tasks_add[i].id) );

          // write out the self-updating html starting page, which will last
          // only until it gets replaced by real report's bootstrap
          utils.writeJobReportMessage ( jobDirPath,'<h1>Idle</h1>',true );

        }
// pd.printProjectTree ( ' >>>saveProjectData--addJob',projectData );

    } else  {
      log.error ( 35,'project metadata cannot be written at ' + projectDataPath );
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                            '[00028] Project metadata cannot be written.','' );
    }

  } else if ((Object.keys(projectDesc.share).length>0) || projectDesc.autorun)  {
    log.error ( 36,'shared project metadata does not exist at ' + projectDataPath );
    rdata.reload = -11111;
    response = new cmd.Response ( cmd.fe_retcode.ok,
                               '[00029] Project metadata does not exist.',rdata );
  } else  {
    log.error ( 37,'project metadata does not exist at ' + projectDataPath );
    response = new cmd.Response ( cmd.fe_retcode.noProjectData,
                               '[00030] Project metadata does not exist.','' );
  }

  return response;

}


// ===========================================================================

function shareProjectConfirm ( loginData,data )  {
// will only return user names for confirmation in project share dialog on client
let pDesc     = data.desc;
let share     = pDesc.share;  // requested share state
let share0    = data.share0;  // old share state
let unshared  = [];
let unknown   = [];
let newShared = [];
let oldShared = [];

  for (let shareLogin in share)
    if (shareLogin)  {
      let uLoginData = user.getUserLoginData ( shareLogin );
      if (uLoginData)  {
        let userData = user.readUserData ( uLoginData );
        if (shareLogin in share0)
              oldShared.push ( [shareLogin,userData.name,userData.email,share[shareLogin]] );
        else  newShared.push ( [shareLogin,userData.name,userData.email,share[shareLogin]] );
      } else
        unknown.push ( shareLogin );
    }

  for (let shareLogin in share0)  
    if (shareLogin && (!(shareLogin in share)))  {  // not found in the requested -- unshare
      let uLoginData = user.getUserLoginData ( shareLogin );
      if (uLoginData)  {
        let userData = user.readUserData ( uLoginData );
        unshared.push ( [shareLogin,userData.name,userData.email,share[shareLogin]] );
      }  // do not put into unknown as it is going to be unshared anyway
    }

  let rcdata = {
    unshared  : unshared,
    unknown   : unknown,
    newShared : newShared,
    oldShared : oldShared
  };

  if (('author' in data) && data.author)  {
    let uLoginData = user.getUserLoginData ( data.author );
    if (uLoginData)  {
      let userData = user.readUserData ( uLoginData );
      rcdata.author = [data.author,userData.name,userData.email];
    } else 
      rcdata.author = ['unspecified','',''];
  }

  if (('owner' in data) && data.owner)  {
    let uLoginData = user.getUserLoginData ( data.owner );
    if (uLoginData)  {
      let userData = user.readUserData ( uLoginData );
      rcdata.owner = [data.owner,userData.name,userData.email];
    } else
      rcdata.owner = ['unspecified','',''];
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',rcdata );

}

function shareProject ( loginData,data )  {  // data must contain new title
let pDesc     = data.desc;
let share     = pDesc.share;  // requested share state
let share0    = data.share0;  // old share state
let shared    = {};  // index of new shared logins
let unshared  = [];  // return list of unshared logins
let unknown   = [];
let newShared = [];
let oldShared = [];
let n_email   = 0;
let t_email   = 1000; //msec

  if (loginData.login!=pDesc.owner.login)
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      desc     : null,      // signal that only owner can change sharing
      unshared : unshared,
      unknown  : unknown
    });

  let pData = readProjectData ( loginData,pDesc.name );
  if (pData)  {

    let userData0  = user.readUserData ( loginData );
    let msg_params = {
      'uname'          : userData0.name,
      'ulogin'         : userData0.login,
      'project_id'     : pDesc.name,
      'project_title'  : pDesc.title
    };

    // unshare by comparison of share0 and share

    let uData_unshared = [];
    for (let shareLogin in share0)  // loop on the existing share state
      if (shareLogin && (!(shareLogin in share)))  {  // not found in the requested -- unshare
        let uLoginData    = user.getUserLoginData ( shareLogin );
        let unshared_user = [ shareLogin,'Unknown','Unknown' ];
        if (uLoginData)  {
          let pShare = readProjectShare ( uLoginData );
          pShare.removeShare ( pDesc );
          writeProjectShare  ( uLoginData,pShare );
          let userData = user.readUserData ( uLoginData );
          if (userData)  {
            uData_unshared.push ( '<b>' + userData.login + '</b> (' +
                                          userData.name  + '  <i>'  +
                                          userData.email + '</i>)' );
            unshared_user = [ shareLogin,userData.name,userData.email,
                              share0[shareLogin] ];
            (function(udata,mparams,delay){
              setTimeout ( function(){
                emailer.sendTemplateMessage ( udata,
                           cmd.appName() + ': A project was unshared with you',
                           'project_unshared',mparams );
              },delay);
            }(userData,msg_params,n_email*t_email))
            n_email++;
          }
        }
        unshared.push ( unshared_user );
      }

    // share with users given by share

    let share1 = pData.desc.share;
    let uData_newShared = [];
    let uData_oldShared = [];
    for (let shareLogin in share)
      if (shareLogin)  {
        let uLoginData = user.getUserLoginData ( shareLogin );
        if (uLoginData)  {
          let userData = user.readUserData ( uLoginData );
          if (userData)  {
            let pShare = readProjectShare ( uLoginData );
            pShare.addShare ( pDesc );
            writeProjectShare ( uLoginData,pShare );
            shared[shareLogin] = share[shareLogin];
            if (!(shareLogin in share1))  {
              newShared.push ([ shareLogin,userData.name,userData.email,
                                share[shareLogin] ]);
              uData_newShared.push ( '<b>' + userData.login + '</b> (' +
                                             userData.name  + '  <i>'  +
                                             userData.email + '</i>)' );
              (function(udata,mparams,delay ){
                setTimeout ( function(){
                  emailer.sendTemplateMessage ( udata,
                            cmd.appName() + ': A project was shared with you',
                            'project_shared',mparams );
                },delay);
              }(userData,msg_params,n_email*t_email))
              n_email++;
            } else  {
              if (share[shareLogin].permissions!=share1[shareLogin].permissions)  {
                (function(udata,mparams,new_permissions,old_permissions,delay ){
                  setTimeout ( function(){
                    let mpars = mparams;
                    mpars.old_permissions = pd.share_permissions_desc ( old_permissions );
                    mpars.new_permissions = pd.share_permissions_desc ( new_permissions );
                    emailer.sendTemplateMessage ( udata,
                              cmd.appName() + ': Project access changed',
                              'project_access_changed',mpars );
                  },delay);
                }(userData,msg_params,share1[shareLogin].permissions,
                  share[shareLogin].permissions,n_email*t_email))
                n_email++;
              }
              oldShared.push ([ shareLogin,userData.name,userData.email,
                                share[shareLogin] ]);
              uData_oldShared.push ( '<b>' + userData.login + '</b> (' +
                                             userData.name  + '  <i>'  +
                                             userData.email + '</i>)' );
            }
          } else
            unknown.push ( shareLogin );
        } else
          unknown.push ( shareLogin );
      }

    pDesc.share = shared;
    pData.desc.share = pDesc.share;
    writeProjectData ( loginData,pData,true );

    // modify project entry in project list
    let pList = readProjectList ( loginData,1 );
    if (pList)  {
      let pno = -1;
      for (let i=0;(i<pList.projects.length) && (pno<0);i++)
        if (pList.projects[i].name==pDesc.name)
          pno = i;
      if (pno>=0)  {
        pList.projects[pno] = pDesc;
        writeProjectList ( loginData,pList );
      }
    }

    msg_params.msg = '';
    if (uData_newShared.length>0)
      msg_params.msg = 'You shared the project with<p>' + uData_newShared.join('<br>') + '<p>';
    if (uData_unshared.length>0)  {
      msg_params.msg += 'You unshared the project with<p>' + uData_unshared.join('<br>') + '<p>';
      if ((uData_oldShared.length<=0) && (uData_newShared.length<=0))
        msg_params.msg += '<p>The project is now shared with nobody.<p>';
    }
    if (uData_oldShared.length>0)
      msg_params.msg += 'The project remains shared with<p>' + uData_oldShared.join('<br>') + '<p>';

    if (!msg_params.msg)
      msg_params.msg = 'The project is shared with nobody.<p>';

    setTimeout ( function(){
      emailer.sendTemplateMessage ( userData0,
                    cmd.appName() + ': You changed the shared state of a project',
                    'project_sharing',msg_params );
    },n_email*t_email);

  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    desc      : pDesc,
    unshared  : unshared,
    unknown   : unknown,
    newShared : newShared,
    oldShared : oldShared
  });

}


// ===========================================================================

function rename_project_0 ( projectDirPath,new_name,check_running )  {
let jmeta = [];    
let rcode = 'ok';

  if (!utils.dirExists(projectDirPath))  {

    rcode = 'Project directory does not exist -- possible data corruption.';
  
  } else  {

    utils.flushDirCache ( projectDirPath );

    let files = fs.readdirSync ( projectDirPath );
    for (let i=0;(i<files.length) && (rcode=='ok');i++)
      if (files[i].startsWith(jobDirPrefix))  {
        let jmpath = path.join ( projectDirPath,files[i],task_t.jobDataFName );
        let jm     = utils.readObject ( jmpath );
        if (jm)  {
          if (check_running &&
              ((jm.state==task_t.job_code.running) || (jm.state==task_t.job_code.exiting)))
                rcode = 'Jobs are running -- not possible to change Project ID before they finish.';
          else  jmeta.push ( [jmpath,jm] );
        }
      }

  }

  if (rcode=='ok')  {
    // change code id in all files and rename project directory
    for (let i=0;i<jmeta.length;i++)  {
      jmeta[i][1].project = new_name;
      if (!utils.writeObject(jmeta[i][0],jmeta[i][1]))
        rcode = 'Error writing job metadata';
    }
  }

  return rcode;

}

function renameProject ( loginData,data )  {  // data must contain new title
let response = null;
let pData    = readProjectData ( loginData,data.name );

  if (pData)  {
    let rdata = { 'code' : 'ok' };
    pData.desc.title = data.title;
    if (('new_name' in data) && (data.new_name!=pData.desc.name))  {
      // project ID to be changed: serious
      // make sure that the project is not shared and that no jobs are running
      if (Object.keys(pData.desc.share).length>0)  {
        rdata.code = 'Not possible to change ID of a shared project';
      } else  {
        // Get users' projects directory name
        let projectDirPath = getProjectDirPath ( loginData,pData.desc.name );
        let newPrjDirPath  = getProjectDirPath ( loginData,data.new_name );
        if (utils.fileExists(newPrjDirPath))  {
          rdata.code = 'Project with requested ID (' + data.new_name +
                       ') already exists (check all folders)';
        } else  {
          rdata.code = rename_project_0 ( projectDirPath,data.new_name,true );
          if (rdata.code=='ok')  {
            pData.desc.name = data.new_name;
            utils.moveDir ( projectDirPath,newPrjDirPath,false );
            if (!writeProjectData(loginData,pData,true))  {
              utils.moveDir ( newPrjDirPath,projectDirPath,false );
              response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    '[00032] Project metadata cannot be written (1).','' );
            } else  {
              rdata.meta = pData;
              response   = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
            }
          }
        }
      }

      if (!response)
        response = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

    } else  {
      if (!writeProjectData(loginData,pData,true))  {
        response = new cmd.Response ( cmd.fe_retcode.writeError,
                             '[00032] Project metadata cannot be written (2).','' );
      } else  {
        rdata.meta = pData;
        response   = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
      }
    }

  } else  {
    response = new cmd.Response ( cmd.fe_retcode.readError,
                             '[00033] Project metadata cannot be read.','' );
  }

  return response;

}


// ===========================================================================

function cloneProject ( loginData,data )  {
let response = null;
let pData    = readProjectData ( loginData,data.name );

  if (pData)  {

    let rdata = { 'code' : 'ok' };
    let projectDirPath = getProjectDirPath ( loginData,pData.desc.name );
    let newPrjDirPath  = getProjectDirPath ( loginData,data.new_name );
    if (utils.fileExists(newPrjDirPath))  {
      rdata.code = 'Project with requested ID (' + data.new_name +
                   ') already exists (check all folders)';
    } else  {
      let jmeta = [];
      if (utils.dirExists(projectDirPath))  {
        let files = fs.readdirSync ( projectDirPath );
        for (let i=0;(i<files.length) && (rdata.code=='ok');i++)
          if (files[i].startsWith(jobDirPrefix))  {
            let jm = utils.readObject ( path.join(projectDirPath,files[i],task_t.jobDataFName) );
            if (jm)  {
              if ((jm.state==task_t.job_code.running) ||
                  (jm.state==task_t.job_code.exiting))
                rdata.code = 'Jobs are running -- not possible to change Project ID before they finish.';
              else
                jmeta.push ( [path.join(newPrjDirPath,files[i],task_t.jobDataFName),jm] );
            }
          }
      }
      if (rdata.code=='ok')  {
        writeProjectData ( loginData,pData,true );
        utils.copyDirAsync ( projectDirPath,newPrjDirPath,true,function(err){
          if (err)  {
            log.error ( 96,'clone project failed:' );
            log.error ( 96,'  from: ' + projectDirPath );
            log.error ( 96,'    to: ' + newPrjDirPath );
            console.error ( err );
            utils.removePathAsync ( newPrjDirPath );
          } else  {
            // change code id in all files and rename project directory
            for (let i=0;i<jmeta.length;i++)  {
              jmeta[i][1].project = data.new_name;
              utils.writeObject ( jmeta[i][0],jmeta[i][1] );
            }
            pData = readProjectData ( loginData,data.name );
            let pDesc = pData.desc;
            pDesc.name  = data.new_name;
            pDesc.title = data.new_title;
            pDesc.share = {};  // no initial sharing on the cloned project
            if ((!('author' in pDesc.owner)) || 
                (pDesc.owner.author==ud.__local_user_id))
              pDesc.owner.author = pDesc.owner.login;
            let rootFPath = loginData.login + '\'s Projects';
            if (!pDesc.folderPath.startsWith(rootFPath))
              pDesc.folderPath = rootFPath;
            pDesc.owner.login = loginData.login;
            if (pDesc.archive && pDesc.archive.in_archive) 
              pDesc.archive.in_archive = false;
            writeProjectData ( loginData,pData,true );
            let pList = readProjectList ( loginData,1 );
            if (pList)  {
              pList.resetFolders ( loginData.login );
              pList.current = data.new_name;
              pList.setCurrentFolder ( pList.findFolder(pDesc.folderPath) );
              writeProjectList ( loginData,pList );
            }
          }
        });
      }
    }

    response  = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

  } else  {
    response = new cmd.Response ( cmd.fe_retcode.readError,
                             '[00036] Project metadata cannot be read.','' );
  }

  return response;

}


function checkCloneProject ( loginData,projectName )  {
let rdata = {};
let newPrjDirPath = getProjectDirPath ( loginData,projectName );
  if (utils.dirExists(newPrjDirPath))  {
    let pData = readProjectData ( loginData,projectName );
    if (pData && (pData.desc.name==projectName))  {
      rdata.code   ='done';
      rdata.ration = ration.calculateUserDiskSpace(loginData).clearJobs();
    } else
      rdata.code = 'in_progress';
  } else
    rdata.code = 'fail';
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}


// ===========================================================================

function _import_project ( loginData,tempdir,prjDir,chown_key,duplicate_key )  {
// 'tempdir' may contain unpacked project directory, in which case 'prjDir'
// should be null. Alternatively, 'prjDir' gives project directory to be
// symlinked, in which case 'tempdir' should be supplied as well
//    duplicate_key = 0 : stop on duplicate project name (Id)
//                  = 1 : ignore duplicate project name (shared projects special)
//                  = 2 : rename project if duplicate name

  // read project meta to make sure it was a project tarball
  let prj_meta_path = '';
  let prj_desc_path = '';
  if (prjDir)  {
    prj_meta_path = path.join ( prjDir ,projectDataFName );
    prj_desc_path = path.join ( prjDir ,projectDescFName );
  } else  {
    prj_meta_path = path.join ( tempdir,projectDataFName );
    prj_desc_path = path.join ( tempdir,projectDescFName );
  }
  let prj_meta = utils.readObject ( prj_meta_path );

  // Get users' projects list here for finding the current folder
  let pList = readProjectList ( loginData );
  if (!pList)
    pList = new pd.ProjectList(loginData.login);  // *** should throw error instead

  // validate metadata and read project name
  let projectDesc = new pd.ProjectDesc();
  try {
    if (prj_meta._type=='ProjectData')  {

      checkProjectData ( prj_meta,loginData );  // could be an old prpoject

      projectDesc.name         = prj_meta.desc.name;
      projectDesc.title        = prj_meta.desc.title;
      projectDesc.disk_space   = prj_meta.desc.disk_space;
      projectDesc.cpu_time     = prj_meta.desc.cpu_time;
      projectDesc.njobs        = prj_meta.desc.njobs;
      projectDesc.dateCreated  = prj_meta.desc.dateCreated;
      projectDesc.dateLastUsed = prj_meta.desc.dateLastUsed;
      projectDesc.folderPath   = prj_meta.desc.folderPath;
      projectDesc.share        = prj_meta.desc.share;
      if ('ccp4cloud_version' in prj_meta.desc)
        projectDesc.ccp4cloud_version = prj_meta.desc.ccp4cloud_version;

      if ('owner' in prj_meta.desc)  {
        projectDesc.owner = prj_meta.desc.owner;
        if (!prjDir)  {  // this means that the project is imported, not shared
          switch (chown_key)  {
            case 'user'     : if (!projectDesc.owner.author)
                                projectDesc.owner.author = loginData.login;
                          break;
            case '*'        : projectDesc.owner.author   = '';
                          break;
            case 'tutorial' : projectDesc.owner.author   = pd.folder_type.tutorials;
                              projectDesc.folderPath     = pd.folder_path.tutorials;
                              prj_meta.desc.owner.author = pd.folder_type.tutorials;
                              prj_meta.desc.folderPath   = pd.folder_path.tutorials;
                          break;
            default         : if (!projectDesc.owner.author)
                                projectDesc.owner.author = prj_meta.desc.owner.login;
          }
          projectDesc.owner.login = loginData.login;
          projectDesc.share = {};  // no initial sharing on imported project
        }
      }

      if (!projectDesc.owner.login)
        projectDesc.owner.login = loginData.login;
      if (projectDesc.owner.author==ud.__local_user_id)
        projectDesc.owner.author = loginData.login;
      prj_meta.desc.owner = projectDesc.owner;
      prj_meta.desc.share = projectDesc.share;
      utils.writeObject ( prj_meta_path,prj_meta    );
      utils.writeObject ( prj_desc_path,projectDesc );

    } else
      prj_meta = null;
  } catch(err) {
    prj_meta = null;
  }

  let signal_path = path.join ( tempdir,'signal' );

  if (!prj_meta)  {

    utils.writeString ( signal_path,'Invalid or corrupt project data\n' +
                                    projectDesc.name +'\n' +
                                    projectDesc.ccp4cloud_version );

  } else  {

    let projectDir = getProjectDirPath ( loginData,projectDesc.name );

    if (utils.isSymbolicLink(projectDir))  {
      // check that the link is not dead (owner deleted project)
      if (!utils.fileExists(getProjectDataPath(loginData,projectDesc.name)))
        utils.removeFile ( projectDir );  // the link was dead
    }

    // if (utils.fileExists(projectDir) && (!utils.isSymbolicLink(projectDir)))  {
    if (utils.fileExists(projectDir) && (duplicate_key<2))  {

      // if (duplicate_bool)  {
      if (duplicate_key==1)  {

        // re-read project list because a new project was added
        let pList = readProjectList ( loginData,1 );
        if (!pList)
          pList = new pd.ProjectList(loginData.login);  // *** should throw error instead
        pList.current = projectDesc.name;        // make it current
        if (pList.currentFolder.path!=pd.folder_type.all_projects)
          pList.setCurrentFolder ( pList.findFolder(projectDesc.folderPath) );
        if (writeProjectList(loginData,pList))
              utils.writeString ( signal_path,'Success\n' + 
                                              projectDesc.name + '\n' +
                                              projectDesc.ccp4cloud_version );
        else  utils.writeString ( signal_path,'Cannot write project list\n' +
                                              projectDesc.name + '\n' +
                                              projectDesc.ccp4cloud_version );

      } else  {
      // } else if (duplicate==0)  {

        utils.writeString ( signal_path,'Project "' + projectDesc.name +
                                        '" already exists (check all folders)\n' +
                                        projectDesc.name + '\n' + 
                                        projectDesc.ccp4cloud_version );
      }

    } else  {

      let placed   = true;
      let old_name = projectDesc.name;
      let new_name = '';
      let mod      = 0;

      if (prjDir)  {
        utils.removeFile ( projectDir );  // in case it exists
        placed = utils.makeSymLink ( projectDir,path.resolve(prjDir) );
      } else  {
        if (duplicate_key>=2)  {
          // rename project by indexing
          while (utils.fileExists(projectDir))  {
            new_name   = projectDesc.name + '_(' + (++mod) + ')';
            projectDir = getProjectDirPath ( loginData,new_name );
          }
          if (mod)  {
            rename_project_0 ( tempdir,new_name,false );
            utils.writeString ( signal_path,'Renamed "' + new_name + '"\n' +
                                projectDesc.name + '\n' +
                                projectDesc.ccp4cloud_version );
          }
        }
        if (utils.moveDir(tempdir,projectDir,true))  {
          utils.mkDir ( tempdir );  // because it was moved
          if (mod)  {
            projectDesc.name = new_name;
            let pData = readProjectData ( loginData,new_name );
            if (!pData)  {
              utils.writeString ( signal_path,'Cannot read copied project ' +
                                              '(bug or file errors?)\n' +
                                              projectDesc.name + '\n' +
                                              projectDesc.ccp4cloud_version );
              placed = false;
            } else  {
              pData.desc.name = new_name;
              if (!writeProjectData(loginData,pData,true))  {
                utils.writeString ( signal_path,'Cannot write renamed project ' +
                                                '(bug or file errors?)\n' +
                                                projectDesc.name + '\n' +
                                                projectDesc.ccp4cloud_version );
                placed = false;
              }
            }
          }

          if (placed)  {
            let jmetas = getJobMetas ( loginData,projectDesc.name );
            for (let i=0;i<jmetas.length;i++)
              if (jmetas[i].meta &&
                  ((jmetas[i].meta.state==task_t.job_code.running) || 
                  (jmetas[i].meta.state==task_t.job_code.exiting)))  {
                jmetas[i].meta.state  = task_t.job_code.stopped;
                jmetas[i].meta.scores = {
                  [jmetas[i].meta._type.slice(4).toLowerCase()] : {
                    'summary_line' : 'abandoned (project exported before task finished)'
                  }
                };
                utils.writeObject ( jmetas[i].path,jmetas[i].meta );
                utils.writeJobReportMessage ( 
                  path.dirname(jmetas[i].path),
                  '<h2>Task abandoned</h2>The task was abandoned because the project ' +
                  'was exported before it finished. For task results, look ' +
                  'into original project. Alternatively, clone this task and run ' +
                  'again.', 
                  false 
                );
              }
          }

        } else {
          utils.writeString ( signal_path,'Cannot copy to project ' +
                                          'directory (disk full?)\n' +
                                          projectDesc.name + '\n' +
                                          projectDesc.ccp4cloud_version );
          placed = false;
        }
      }

      if (placed)  {
        // the project's content was moved to user's area, now
        // make the corresponding entry in project list

        // re-read project list because a new project was added
        let pList = readProjectList ( loginData,1 );
        if (!pList)
          pList = new pd.ProjectList(loginData.login);  // *** should throw error instead

        pList.current = projectDesc.name;        // make it current
        if (((!prjDir) || (pList.currentFolder.type!=pd.folder_type.joined)) &&
            (pList.currentFolder.type!=pd.folder_type.all_projects))  {
          pList.resetFolders ( loginData.login );  // in case joined folder was not there
          pList.setCurrentFolder ( pList.findFolder(projectDesc.folderPath) );
        }
        if (writeProjectList(loginData,pList))  {
          if (!mod)
                utils.writeString ( signal_path,'Success\n' + projectDesc.name +
                                          '\n' + projectDesc.ccp4cloud_version );
          else  utils.writeString ( signal_path,'Success\n' + projectDesc.name +
                                                        ' ' + old_name +
                                          '\n' + projectDesc.ccp4cloud_version );
        } else  {
          utils.writeString ( signal_path,'Cannot write project list\n' +
                                          projectDesc.name + '\n' +
                                          projectDesc.ccp4cloud_version );
        }

        //if (loginData.login==projectDesc.owner.login)
        //  ration.changeUserDiskSpace ( loginData,projectDesc.disk_space );
        ration.calculateUserDiskSpace ( loginData );

      } else  {

        utils.writeString ( signal_path,'Project "' + projectDesc.name +
                                        '" cannot be allocated (disk full?)\n' +
                                        projectDesc.name + '\n' +
                                        projectDesc.ccp4cloud_version );

      }

    }

  }

}


function getProjectTmpDir ( loginData,make_clean )  {
  let tempdir = conf.getFETmpDir1(loginData);

  if (make_clean)  {
    if (!utils.fileExists(tempdir))  {
      if (!utils.mkDir(tempdir))  {
        log.error ( 40,'cannot create temporary directory at ' + tempdir );
        return null;
      }
    }
  }

  tempdir = path.join ( tempdir,loginData.login+'_project_import' );
  if (make_clean)  {
    utils.removePathAsync ( tempdir );  // just in case
    if (!utils.mkDir(tempdir))  {
      log.error ( 41,'cannot create temporary directory at ' + tempdir );
      tempdir = null;
    }
  }

  return tempdir;

}


function importProject ( loginData,upload_meta )  {

  // create temporary directory, where project tarball will unpack;
  // directory name is derived from user login in order to check on
  // import outcome in subsequent 'checkPrjImport' requests

  let tempdir = getProjectTmpDir ( loginData,true );
  if (tempdir)  {

    let errs = '';

    // we run this loop although expect only one file on upload
    for (let key in upload_meta.files)  {

      // send_dir.unpackDir ( tempdir,null,function(code,jobballSize){
      send_dir.unpackDir ( key,tempdir,true,function(code,jobballSize){
        if (code)
          log.error ( 50,'unpack errors, code=' + code + ', filesize=' + jobballSize );
        // _import_project ( loginData,tempdir,null,'',false );
        _import_project ( loginData,tempdir,null,'',2 );  // '2' means 'rename if needed'
      });

      // rename file with '__' prefix in order to use the standard
      // unpack directory function
      //if (utils.moveFile(key,path.join(tempdir,'__dir.tar.gz')))  {
      /*
      if (utils.moveFile(key,path.join(tempdir,send_dir.jobballName)))  {
        // unpack project tarball
        send_dir.unpackDir ( tempdir,null,function(code,jobballSize){
          if (code)
            log.error ( 50,'unpack errors, code=' + code + ', filesize=' + jobballSize );
          // _import_project ( loginData,tempdir,null,'',false );
          _import_project ( loginData,tempdir,null,'',2 );  // '2' means 'rename if needed'
        });
      } else  {
        errs = 'file move error';
      }
      */

      break;  // only one file to be processed

    }

    let fdata = {};
    fdata.files = [];

    if (errs=='')
          return new cmd.Response ( cmd.fe_retcode.ok,'success',fdata );
    else  return new cmd.Response ( server_response, cmd.fe_retcode.writeError,
                       'Cannot move uploaded data to temporary directory',
                       fdata );
  } else
    return new cmd.Response ( cmd.fe_retcode.noTempDir,
                             'Temporary directory cannot be created',
                             fdata );

}


function startDemoImport ( loginData,meta )  {
let rc        = cmd.fe_retcode.ok;
let rc_msg    = 'success';
let rdata     = { 'status' : 'ok' };
let tempdir   = getProjectTmpDir ( loginData,true );
// let duplicate = false;
let duplicate = 0;

  if (tempdir)  {

    let cloudMounts = storage.getUserCloudMounts ( loginData );
    let demoProjectPath = null;

    if ('cloudpath' in meta)  {
      let lst = meta.cloudpath.split('/');
      for (let j=0;(j<cloudMounts.length) && (!demoProjectPath);j++)
        if (cloudMounts[j][0]==lst[0])
          demoProjectPath = path.join ( cloudMounts[j][1],lst.slice(1).join('/'),
                                        meta.demoprj.name );
    } else if ('cloudmount' in meta)  {
      let basepath = null;
      for (let j=0;(j<cloudMounts.length) && (!basepath);j++)
        if (cloudMounts[j][0]==meta.cloudmount)
          basepath = cloudMounts[j][1];
      if (basepath)  {
        let flist = utils.searchTree ( basepath,meta.demoprj.name,1 );
        if (flist.length>0)
          demoProjectPath = flist[0];
      }
      // duplicate = meta.duplicate;
      if (meta.duplicate)
        duplicate = 1;  // can duplicate project
    }

    if (demoProjectPath)  {
      if (utils.fileExists(demoProjectPath))  {
        // send_dir.unpackDir1 ( tempdir,demoProjectPath,null,false,
        send_dir.unpackDir ( demoProjectPath,tempdir,false,
          function(code,jobballSize){
            if (code)
              log.error ( 55,'unpack errors, code=' + code + ', filesize=' + jobballSize );
            _import_project ( loginData,tempdir,null,'tutorial',duplicate );
          });
      } else  {
        rc     = cmd.fe_retcode.fileNotFound;
        rc_msg = 'Demo project<h3>' + meta.demoprj.name + '</h3>does not exist';
        rdata.status = 'no_project';
      }
    } else  {
      rc     = cmd.fe_retcode.fileNotFound;
      rc_msg = 'Cannot calculate path for demo Project<h3>' + meta.demoprj.name + '</h3>';
      rdata.status = 'no_path';
    }

  } else {
    rc     = cmd.fe_retcode.mkDirError;
    rc_msg = 'Cannot make project directory for demo import';
  }

  return new cmd.Response ( rc,rc_msg,rdata );

}


function startSharedImport ( loginData,meta )  {
  let rc      = cmd.fe_retcode.ok;
  let rc_msg  = 'success';
  let tempdir = getProjectTmpDir ( loginData,true );

  let import_as_link = true;  // development switch, should be true in production

  if (tempdir)  {

//    let project_keeper = meta.owner.login;
//    if (('keeper' in meta.owner) && meta.owner.keeper)
//      project_keeper = meta.owner.keeper;
//    let uLoginData = user.getUserLoginData ( project_keeper );
    let uLoginData = user.getUserLoginData ( meta.owner.login );
    if (uLoginData)  {
      let sProjectDirPath = getProjectDirPath ( uLoginData,meta.name );
      if (utils.fileExists(sProjectDirPath))  {
        if (import_as_link)  {
          // _import_project ( loginData,tempdir,sProjectDirPath,'',false );
          _import_project ( loginData,tempdir,sProjectDirPath,'',0 );  // '0' means 'do not duplicate'
        } else  {
          fs.copy ( sProjectDirPath,tempdir,function(err){
            if (err)
              utils.writeString ( path.join(tempdir,'signal'),
                                  'Errors during data copy\n' +
                                  projectDesc.name );
            else  {
              // _import_project ( loginData,tempdir,null,'',false );
              _import_project ( loginData,tempdir,null,'',0 );  // '0' means 'do not duplicate'
            }
          });
        }
      } else  {
        rc     = cmd.fe_retcode.fileNotFound;
        rc_msg = 'Shared project ' + meta.name + ' does not exist';
      }
    } else  {
      rc     = cmd.fe_retcode.fileNotFound;
//      rc_msg = 'User data for ' + project_keeper + ' not found';
      rc_msg = 'User data for ' + meta.owner.login + ' not found';
    }

  } else {
    rc     = cmd.fe_retcode.mkDirError;
    rc_msg = 'Cannot make project directory for shared import';
  }

  return new cmd.Response ( rc,rc_msg,{} );

}


function checkProjectImport ( loginData,data )  {
  let signal_path = path.join ( getProjectTmpDir(loginData,false),'signal' );
  let rdata  = {};
  let signal = utils.readString ( signal_path );
  if (signal)  {
    let msg = signal.split('\n');
    rdata.signal = msg[0];
    rdata.name   = msg[1];
    rdata.ccp4cloud_version = msg[2];
  } else  {
    rdata.signal = null;
    rdata.name   = '???';
    rdata.ccp4cloud_version = cmd.appVersion();
  }
  return new cmd.Response ( cmd.fe_retcode.ok,'success',rdata );
}


function finishProjectImport ( loginData,data )  {
  let tempdir = getProjectTmpDir(loginData,false);
  utils.removePathAsync ( tempdir );
  return new cmd.Response ( cmd.fe_retcode.ok,'success','' );
}


// ===========================================================================

function saveJobData ( loginData,data )  {
let response    = null;
let projectName = data.meta.project;
let jobId       = data.meta.id;

  if (data.update_tree)  {
    let pData = readProjectData ( loginData,projectName );
    if (pData)
      writeProjectData ( loginData,pData,true );
  }

  let jobDataPath = getJobDataPath ( loginData,projectName,jobId );

  if (utils.fileExists(jobDataPath) && utils.writeObject(jobDataPath,data.meta))  {
    response = new cmd.Response ( cmd.fe_retcode.ok,'',{ 'project_missing':false } );
  } else  {
    if (data.is_shared &&
        (!utils.fileExists(getProjectDataPath(loginData,projectName))))
      response = new cmd.Response ( cmd.fe_retcode.ok,'project_missing',
                                    { 'project_missing':true } );
    if (!response)
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    '[00031] Job metadata cannot be written.',
                                    { 'project_missing':null } );
  }

  return response;

}


// ===========================================================================

function saveJobFile ( loginData,data )  {
//
//   data : {
//     meta  : task_obj, // only 'project' and 'id' fields are used
//     fpath : file_path_in_task_directory
//     data  : file_content
//   }
//
let response    = null;
let projectName = data.meta.project;
let jobId       = data.meta.id;

  let jobDirPath = getJobDirPath ( loginData,projectName,jobId );

  if (utils.fileExists(jobDirPath))  {
    let fpath = path.join ( jobDirPath,data.fpath );
    if (utils.writeString(fpath,data.data))  {
      response = new cmd.Response ( cmd.fe_retcode.ok,'',
                                    { 'project_missing':false } );
    } else  {
      let fdir = path.dirname ( fpath );
      if (fdir!=jobDirPath)  {
        utils.mkPath ( fdir );
        if (utils.writeString(fpath,data.data))
          response = new cmd.Response ( cmd.fe_retcode.ok,'',
                                        { 'project_missing':false } );
      }
      if (!response)
        response = new cmd.Response ( cmd.fe_retcode.writeError,
                                      '[00038] Job file cannot be written.',
                                      { 'project_missing':false } );
    }
  } else  {
    if (data.is_shared &&
        (!utils.fileExists(getProjectDataPath(loginData,projectName))))
      response = new cmd.Response ( cmd.fe_retcode.ok,'project_missing',
                                    { 'project_missing':true } );
    if (!response)
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    '[00039] Job metadata cannot be written.',
                                    { 'project_missing':null } );
  }

  return response;

}


function saveJobFiles ( loginData,data )  {
//
//   data : {
//     meta  : task_obj, // only 'project' and 'id' fields are used
//     files : [
//       { fpath : file_path_in_task_directory
//         data  : file_content
//       },
//        ...
//     ]
//   }
//
let response    = null;
let projectName = data.meta.project;
let jobId       = data.meta.id;

  let jobDirPath = getJobDirPath ( loginData,projectName,jobId );

  if (utils.fileExists(jobDirPath))  {
    for (let i=0;(i<data.files.length) && (!response);i++)  {
      let fpath = path.join ( jobDirPath,data.files[i].fpath );
      if (!utils.writeString(fpath,data.files[i].data))  {
        let fdir = path.dirname ( fpath );
        if (fdir!=jobDirPath)  {
          utils.mkPath ( fdir );
          if (!utils.writeString(fpath,data.files[i].data))  {
            log.error ( 81,'file "' + fpath + '" cannot be written (1)' );
            response = new cmd.Response ( cmd.fe_retcode.writeError,
                                          '[00040] Job file cannot be written.',
                                          { 'project_missing':false } );
          }
        } else  {
          log.error ( 82,'file "' + fpath + '" cannot be written (2)' );
          response = new cmd.Response ( cmd.fe_retcode.writeError,
                                        '[00041] Job file cannot be written.',
                                        { 'project_missing':false } );
        }
      }
      if (('isMRSearchModel' in data.files[i]) &&
          data.files[i].isMRSearchModel)
        utils.writeString ( fpath+'.MRSearchModel','true' );
    }
    if (!response)
      response = new cmd.Response ( cmd.fe_retcode.ok,'',
                                        { 'project_missing':false } );
  } else  {
    if (data.is_shared &&
        (!utils.fileExists(getProjectDataPath(loginData,projectName))))
      response = new cmd.Response ( cmd.fe_retcode.ok,'project_missing',
                                    { 'project_missing':true } );
    if (!response)
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    '[00042] Job metadata cannot be written.',
                                    { 'project_missing':null } );
  }

  return response;

}

  
// ===========================================================================

function getJobFile ( loginData,data )  {
let response    = null;
let projectName = data.meta.project;
let jobId       = data.meta.id;
let pfile       = data.meta.file.split('/');

  let fpath = getJobDirPath ( loginData,projectName,jobId );
  for (let i=0;i<pfile.length;i++)
    fpath = path.join ( fpath,pfile[i] );

  let jdata = utils.readString ( fpath );
  if (data)  {
    response = new cmd.Response ( cmd.fe_retcode.ok,'',jdata );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.writeError,
                                  '[00033] Requested file not found.','' );
  }

  return response;

}


// ==========================================================================
// export for use in node

module.exports.projectDataFName       = projectDataFName;
module.exports.projectDescFName       = projectDescFName;
module.exports.jobDirPrefix           = jobDirPrefix;
module.exports.makeNewUserProjectsDir = makeNewUserProjectsDir;
module.exports.getProjectList         = getProjectList;
module.exports.getDockData            = getDockData;
module.exports.getSharedPrjList       = getSharedPrjList;
module.exports.getProjectDataPath     = getProjectDataPath;
module.exports.getProjectDescPath     = getProjectDescPath;
module.exports.getUserKnowledgePath   = getUserKnowledgePath;
module.exports.getUserKnowledgeData   = getUserKnowledgeData;
module.exports.readProjectData        = readProjectData;
module.exports.writeProjectData       = writeProjectData;
module.exports.readProjectDesc        = readProjectDesc;
module.exports.readProjectList        = readProjectList;
module.exports.writeProjectList       = writeProjectList;
module.exports.saveProjectList        = saveProjectList;
module.exports.delete_project         = delete_project;
module.exports.unshare_project        = unshare_project;
module.exports.deleteProject          = deleteProject;
module.exports.saveDockData           = saveDockData;
module.exports.prepareProjectExport   = prepareProjectExport;
module.exports.checkProjectExport     = checkProjectExport;
module.exports.finishProjectExport    = finishProjectExport;
module.exports.checkProjectImport     = checkProjectImport;
module.exports.finishProjectImport    = finishProjectImport;
module.exports.prepareJobExport       = prepareJobExport;
module.exports.checkJobExport         = checkJobExport;
module.exports.finishJobExport        = finishJobExport;
module.exports.prepareFailedJobExport = prepareFailedJobExport;
module.exports.checkFailedJobExport   = checkFailedJobExport;
module.exports.finishFailedJobExport  = finishFailedJobExport;
module.exports.getProjectData         = getProjectData;
// module.exports.advanceJobCounter      = advanceJobCounter;
module.exports.makeNewProject         = makeNewProject;
module.exports.makeNodeName           = makeNodeName;
module.exports.make_job_directory     = make_job_directory;
module.exports.saveProjectData        = saveProjectData;
module.exports.shareProject           = shareProject;
module.exports.shareProjectConfirm    = shareProjectConfirm;
module.exports.renameProject          = renameProject;
module.exports.cloneProject           = cloneProject;
module.exports.checkCloneProject      = checkCloneProject;
module.exports.importProject          = importProject;
module.exports.startDemoImport        = startDemoImport;
module.exports.startSharedImport      = startSharedImport;
module.exports.getProjectDirPath      = getProjectDirPath;
module.exports.getUserProjectsDirPath = getUserProjectsDirPath;
module.exports.getUserProjectListPath = getUserProjectListPath;
module.exports.getJobDirPath          = getJobDirPath;
module.exports.getSiblingJobDirPath   = getSiblingJobDirPath;
module.exports.getJobDataPath         = getJobDataPath;
module.exports.getJobReportDirPath    = getJobReportDirPath;
module.exports.getJobInputDirPath     = getJobInputDirPath;
module.exports.getJobOutputDirPath    = getJobOutputDirPath;
module.exports.getInputDirPath        = getInputDirPath;
module.exports.getOutputDirPath       = getOutputDirPath;
module.exports.getInputFilePath       = getInputFilePath;
module.exports.getOutputFilePath      = getOutputFilePath;
module.exports.saveJobData            = saveJobData;
module.exports.saveJobFile            = saveJobFile;
module.exports.saveJobFiles           = saveJobFiles;
module.exports.getJobFile             = getJobFile;
