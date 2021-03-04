
/*
 *  =================================================================
 *
 *    26.02.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */

//  load system modules
var fs       = require('fs-extra');
var path     = require('path');
//var child_process = require('child_process');
//var archiver      = require('archiver');

//  load application modules
var emailer   = require('./server.emailer');
var conf      = require('./server.configuration');
var utils     = require('./server.utils');
var send_dir  = require('./server.send_dir');
var ration    = require('./server.fe.ration');
var fcl       = require('./server.fe.facilities');
var user      = require('./server.fe.user');
var class_map = require('./server.class_map');
var pd        = require('../js-common/common.data_project');
var cmd       = require('../js-common/common.commands');
var task_t    = require('../js-common/tasks/common.tasks.template');

//  prepare log
var log = require('./server.log').newLog(6);

// ===========================================================================

var projectExt         = '.prj';
var userProjectsExt    = '.projects';
var projectListFName   = 'projects.list';
var projectShareFName  = 'projects.share';
var dockDataFName      = 'dock.meta';
var userKnowledgeFName = 'knowledge.meta';
var projectDataFName   = 'project.meta';
var projectDescFName   = 'project.desc';
var jobDirPrefix       = 'job_';
var replayDir          = 'replay';

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
  var n = projectName.lastIndexOf(':'+replayDir);
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

function writeProjectData ( loginData,projectData,putTimeStamp )  {
  if (putTimeStamp)
    projectData.desc.timestamp = Date.now();
  utils.writeObject ( getProjectDescPath(loginData,projectData.desc.name),
                      projectData.desc );
  return utils.writeObject ( getProjectDataPath(loginData,projectData.desc.name),
                             projectData );
}

function checkProjectDescData ( projectDesc,loginData )  {
  var update = false;
  if ((!('owner' in projectDesc)) || (!projectDesc.owner.login))  {
    // backward compatibility on 11.01.2020
    var uData = user.readUserData ( loginData );
    projectDesc.owner = {
      login : loginData.login,
      name  : uData.name,
      email : uData.email,
      share : []
    };
    update = true;  // update project metadata
  }
  if ((!('timestamp' in projectDesc)) || (!projectDesc.timestamp))  {
    projectDesc.timestamp = Date.now();
    update = true;
  }
  if (!('share' in projectDesc.owner))  {
    projectDesc.owner.share = [];
    update = true;
  } else if (projectDesc.owner.share.constructor.name!='Array')  {
    var lst = projectDesc.owner.share.split(',');
    projectDesc.owner.share = [];
    for (var i=0;i<lst.length;i++)
      if (lst[i])
        projectDesc.owner.share.push ({
          'login'       : lst[i],
          'permissions' : 'rw'  // not used, reserved for future
        });
    update = true;
  } else if ((projectDesc.owner.share.length==1) &&
             (projectDesc.owner.share[0].login==''))  {
    // introduced only because of dev error, may be removed painlessly
    projectDesc.owner.share = [];
    update = true;
  }
  if ('keeper' in projectDesc.owner)  {
    delete projectDesc.owner.keeper;
    update = true;
  }
  if ('is_shared' in projectDesc.owner)  {
    delete projectDesc.owner.is_shared;
    update = true;
  }
  if (!projectDesc.hasOwnProperty('startmode'))
    projectDesc.startmode = pd.start_mode.expert; // too petty to save/update
  if (!projectDesc.hasOwnProperty('tasklistmode'))
    projectDesc.tasklistmode = pd.tasklist_mode.full; // too petty to save/update
  if (!projectDesc.hasOwnProperty('metrics'))
    projectDesc.metrics = {};  // too petty to save/update
  return update;  // no changes
}


function checkProjectData ( projectData,loginData )  {
  var update = false;
  if ('jobCount' in projectData)  {
    projectData.desc.jobCount = projectData.jobCount;
    delete projectData.jobCount;
    update = true;
  }
  if ('timestamp' in projectData)  {
    delete projectData.timestamp;
    update = true;
  }
  if (!projectData.settings)  {
    projectData.settings = {};
    update = true;
  }
  if (!projectData.settings.hasOwnProperty('prefix_key'))  {
    projectData.settings.prefix_key = 0;   // 0: default; 1: custom
    projectData.settings.prefix     = '';  // custom
    update = true;
  }
  if (checkProjectDescData(projectData.desc,loginData))
    update = true;
  return update;  // no changes
}


function readProjectData ( loginData,projectName )  {
  var projectDataPath = getProjectDataPath ( loginData,projectName );
  var projectData     = utils.readObject ( projectDataPath );
  if (projectData)  {
    if (checkProjectData(projectData,loginData))
      writeProjectData ( loginData,projectData,true );
  }
  return projectData;
}

function readProjectDesc ( loginData,projectName )  {
  var projectDescPath = getProjectDescPath ( loginData,projectName );
  var projectDesc     = utils.readObject ( projectDescPath );
  if (!projectDesc)  {
    var projectData = readProjectData ( loginData,projectName );
    if (projectData)  {
      projectDesc = projectData.desc;
      utils.writeObject ( projectDescPath,projectDesc );
    }
  }
  return projectDesc;  // may be null
}


function writeProjectList ( loginData,projectList )  {
  var userProjectsListPath = getUserProjectListPath ( loginData );
  return utils.writeObject ( userProjectsListPath,projectList );
}

function readProjectList ( loginData )  {
  var userProjectsListPath = getUserProjectListPath ( loginData );
  var pList = utils.readObject ( userProjectsListPath );
  if (pList)  {
    var pdescs = pList.projects;
    pList.projects = [];
    if (!('startmode' in pList))
      pList.startmode = pd.start_mode.auto;
    for (var i=0;i<pdescs.length;i++)  {
      var pdesc = pdescs[i];
      if (checkProjectDescData(pdesc,loginData))  {
        var pData = readProjectData ( loginData,pdesc.name );
        writeProjectData ( loginData,pData,true );
      }
      //if (pdesc.owner.share.length>0)  // the project could have been changed
      pdesc = readProjectDesc ( loginData,pdescs[i].name );
      if (pdesc && (pdesc.owner.login!=loginData.login) &&
                   (!pd.isProjectAccessible(loginData.login,pdesc)))
        pdesc = null;
      if (pdesc)
        pList.projects.push ( pdesc );
    }
    writeProjectList ( loginData,pList );
  }
  return pList;
}


function writeDockData ( loginData,dockData )  {
  var userDockDataPath = getUserDockDataPath ( loginData );
  return utils.writeObject ( userDockDataPath,dockData );
}


function readDockData ( loginData )  {
  var userDockDataPath = getUserDockDataPath ( loginData );
  var dockData = utils.readObject ( userDockDataPath );
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
var response = null;  // must become a cmd.Response object to return

  log.standard ( 1,'make new user projects directory, login ' + loginData.login );

  // Get users' projects directory name
  var userProjectsDirPath = getUserProjectsDirPath ( loginData );

  if (utils.fileExists(userProjectsDirPath))  {
    // just a message, do not change anything in the existing projects directory
    log.error ( 2,'repeat attempt to create user projects directory, login ' +
                  loginData.login );
    response = new cmd.Response ( cmd.fe_retcode.ok,
                                '[00012] User projects directory exists','' );
  } else if (utils.mkDir(userProjectsDirPath)) {
    if (utils.writeObject(getUserProjectListPath(loginData),new pd.ProjectList())) {
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
var response = null;  // must become a cmd.Response object to return
  log.detailed ( 3,'get project list, login ' + loginData.login );
  var pList = readProjectList ( loginData );
  if (pList)
        response = new cmd.Response ( cmd.fe_retcode.ok,'',pList );
  else  response = new cmd.Response ( cmd.fe_retcode.readError,
                                      '[00015] Project list cannot be read.','' );
  return response;
}


// ===========================================================================

function getDockData ( loginData )  {
var response = null;  // must become a cmd.Response object to return
  log.detailed ( 3,'get dock data, login ' + loginData.login );
  var dockData = readDockData ( loginData );
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
var pShare = utils.readClass ( getUserProjectSharePath ( loginData ) );
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
var response  = null;  // must become a cmd.Response object to return
var knowledge = {};

  log.detailed ( 4,'get knowledge data, login ' + loginData.login );

  // Get users' projects list file name
  var userKnowledgePath = getUserKnowledgePath ( loginData );

  if (utils.fileExists(userKnowledgePath))
    knowledge = utils.readObject ( userKnowledgePath );

  response = new cmd.Response ( cmd.fe_retcode.ok,'',knowledge );

  return response;

}


// ===========================================================================

function makeNewProject ( loginData,projectDesc )  {
var response = null;  // must become a cmd.Response object to return

//  console.log ( JSON.stringify(projectDesc) );

  log.standard ( 5,'make new project ' + projectDesc.name +
                   ', login ' + loginData.login );

  // Get users' projects directory name
  var projectDirPath = getProjectDirPath ( loginData,projectDesc.name );

  if (utils.fileExists(projectDirPath))  {
    // just issue a message, do not change anything in the existing
    // projects directory

    log.error ( 6,'repeat attempt to create project directory ' + projectDesc.name +
                  ', login ' + loginData.login );
    response = new cmd.Response ( cmd.fe_retcode.ok,'Project directory exists','' );

  } else if (utils.mkDir(projectDirPath)) {

    var projectData  = new pd.ProjectData();
    projectData.desc = projectDesc;
    if (writeProjectData(loginData,projectData,true))  {
      if (utils.mkDir(path.join(projectDirPath,replayDir))) {
        var pname = projectData.desc.name;
        projectData.desc.name = projectData.desc.name + ':' + replayDir;
        if (writeProjectData(loginData,projectData,true))
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

function deleteProject ( loginData,projectName )  {
var response = null;  // must become a cmd.Response object to return
var erc = '';

  log.standard ( 7,'delete project ' + projectName + ', login ' + loginData.login );

  // maintain share lists
  var pData = readProjectData ( loginData,projectName );
  if (pData && (pData.desc.owner.login==loginData.login))  {
    // project can be deleted only by owner or keeper; shared projects can be only
    // unjoined

    // remove it from all shares
    var share = pData.desc.owner.share;
    for (var i=0;i<share.length;i++)  {
      var uLoginData = user.getUserLoginData ( share[i].login );
      if (uLoginData)  {
        var pShare = readProjectShare ( uLoginData );
        pShare.removeShare ( pData.desc );
        writeProjectShare  ( uLoginData,pShare );
      }
    }

    // subtract project disck space from user's ration
    ration.updateProjectStats ( loginData,projectName,0.0,
                                -pData.desc.disk_space,0,true );

    // Get users' projects directory name
    var projectDirPath = getProjectDirPath ( loginData,projectName );

    utils.removePath ( projectDirPath );

    ration.maskProject ( loginData,projectName );

    if (utils.fileExists(projectDirPath))
      erc = emailer.send ( conf.getEmailerConfig().maintainerEmail,
                'CCP4 Remove Project Directory Fails',
                'Detected removePath failure at deleting project directory, ' +
                'please investigate.' );

  } else if (pData && (pData.desc.owner.login!=loginData.login))  {
    log.error ( 60,'attempt to delete project ' + pData.desc.owner.login +
                   ':' + projectName + ' by non-owner ' + loginData.login );
    response = new cmd.Response ( cmd.fe_retcode.projectAccess,
                        'Attempt to delete project without ownership',erc );
  } else  {
    log.error ( 61,'project ' + loginData.login + ':' + projectName +
                   ' attempted for deletion, but was not found' );
    response = new cmd.Response ( cmd.fe_retcode.noProjectData,
                                  'Project not found',erc );
  }

  if (!response)
    response = new cmd.Response ( cmd.fe_retcode.ok,'',erc );

  return response;

}


// ===========================================================================

function saveProjectList ( loginData,newProjectList )  {
var response = null;  // must become a cmd.Response object to return

  log.detailed ( 8,'save project list, login ' + loginData.login );

  // Get users' projects list file name
  //var userProjectsListPath = getUserProjectListPath ( loginData );

//  if (utils.fileExists(userProjectsListPath))  {
//    var pList = utils.readObject ( userProjectsListPath );

  var pList = readProjectList ( loginData );
  if (pList)  {

    // delete missing projects
    var disk_space_change = 0.0;
    var del_lst = [];
    for (var i=0;i<pList.projects.length;i++)  {
      var pDesc  = pList.projects[i];
      var pName  = pDesc.name;
      var jfound = -1;
      for (var j=0;(j<newProjectList.projects.length) && (jfound<0);j++)
        if (pName==newProjectList.projects[j].name)
          jfound = j;
      if (jfound<0)
        del_lst.push ( [pName,pDesc] );
      else  {
        if (pDesc.owner.login==loginData.login)
          pDesc.title = newProjectList.projects[jfound].title; // if it was renamed
        newProjectList.projects[jfound] = pDesc;
      }
    }

    /*
    for (var i=0;i<del_lst.length;i++)  {
      var pName = del_lst[i][0];
      var pDesc = del_lst[i][1];
      var rsp   = deleteProject ( loginData,pName );
      if (rsp.status!=cmd.fe_retcode.ok)
        response = rsp;
      else if (('owner' in pDesc) && (pDesc.owner.login==loginData.login))  {
        // monitor disk space only if own projects are deleted; deleting
        // a shared project is a logical, rather than physical, operation,
        // which does not release disk space
        if ('disk_space' in pList.projects[i])  // backward compatibility 05.06.2018
          disk_space_change -= pList.projects[i].disk_space;
      }
    }
    */

    for (var i=0;i<del_lst.length;i++)  {
      var pName = del_lst[i][0];
      var pDesc = del_lst[i][1];
      if (('owner' in pDesc) && (pDesc.owner.login!=loginData.login))  {
        // monitor disk space only if own projects are deleted; deleting
        // a shared project is a logical, rather than physical, operation,
        // which does not release disk space
        if ('disk_space' in pList.projects[i])  // backward compatibility 05.06.2018
          disk_space_change -= pList.projects[i].disk_space;
      } else  {
        var rsp = deleteProject ( loginData,pName );
        if (rsp.status!=cmd.fe_retcode.ok)
          response = rsp;
      }
    }

    // create new projects
    for (var i=0;i<newProjectList.projects.length;i++)
      if (newProjectList.projects[i].owner.login=='')  {
        var found = false;
        var pName = newProjectList.projects[i].name;
        for (var j=0;(j<pList.projects.length) && (!found);j++)
          found = (pName==pList.projects[j].name);
        if (!found)  {
          var rsp = makeNewProject ( loginData,newProjectList.projects[i] );
          if (rsp.status!=cmd.fe_retcode.ok)
            response = rsp;
        }
      }

    if (!response)  {
      //var userProjectsListPath = getUserProjectListPath ( loginData );
      //if (utils.writeObject ( userProjectsListPath,newProjectList ))  {
      if (writeProjectList(loginData,newProjectList))  {
        var rdata = {};
        if (disk_space_change!=0.0)  {
          // save on reading files if ration does not change; see related
          // comments above
          rdata.ration = ration.calculateUserDiskSpace(loginData).clearJobs();
          // clearJobs() only to decrease the amount of transmitted data
          //rdata.ration = ration.getUserRation(loginData).clearJobs();
        }
        response = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
      } else
        response = new cmd.Response ( cmd.fe_retcode.writeError,
                              '[00020] Project list cannot be written.','' );
    }

  } else  {
    response = new cmd.Response ( cmd.fe_retcode.readError,
                                 '[00019] Project list cannot be read.','' );
  }

  /*
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.readError,
                                   '[00020] Project list does not exist.','' );
  }
  */

  return response;

}

// ===========================================================================

function saveDockData ( loginData,newDockData )  {
var response = null;  // must become a cmd.Response object to return

  log.detailed ( 81,'save dock data, login ' + loginData.login );

  if (writeDockData(loginData,newDockData))
        response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
  else  response = new cmd.Response ( cmd.fe_retcode.writeError,
                          '[00201] Dock data cannot be written.','' );

  return response;

}


// ===========================================================================

function prepareProjectExport ( loginData,projectList )  {

  log.standard ( 9,'export project "' + projectList.current +
                   '", login ' + loginData.login );

  var projectDirPath = getProjectDirPath ( loginData,projectList.current );
  var archivePath    = path.join ( projectDirPath,
                                   projectList.current + cmd.projectFileExt );
  utils.removeFile ( archivePath );  // just in case

  // nasty patch, remove coot backups because they use .gz files -- and they
  // make projects not importable on Windows
  utils.cleanDirExt ( projectDirPath,'.gz' );

  send_dir.packDir ( projectDirPath,'*',null,function(code,jobballSize){
    var jobballPath = send_dir.getJobballPath ( projectDirPath );
    if (code)  {
      log.error ( 10,'errors at packing ' + projectDirPath + ' for export' );
      utils.removeFile ( jobballPath );  // export will never get ready!
    } else  {
      log.standard ( 10,'packed' );
      utils.moveFile   ( jobballPath,archivePath );
    }
  });

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}

function checkProjectExport ( loginData,projectList )  {
  var projectDirPath = getProjectDirPath ( loginData,projectList.current );
  var archivePath    = path.join ( projectDirPath,
                                   projectList.current + cmd.projectFileExt );
  rdata = {};
  if (utils.fileExists(archivePath))
        rdata.size = utils.fileSize(archivePath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}

function finishProjectExport ( loginData,projectList )  {
  var projectDirPath = getProjectDirPath ( loginData,projectList.current );
  var archivePath    = path.join ( projectDirPath,
                                   projectList.current + cmd.projectFileExt );
  //var tarballPath2   = path.join ( projectDirPath,'__' + projectList.current+'.tar.gz' );
  utils.removeFile ( archivePath );
  //utils.removeFile ( tarballPath2 );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================

function getJobExportNames ( loginData,task )  {
  var exportName  = task.project + '-job_' + task.id + '.zip';
  var jobDirPath  = getJobDirPath ( loginData,task.project,task.id );
  var archivePath = path.join     ( jobDirPath,exportName );
  return [ exportName,jobDirPath,archivePath ];
}

function prepareJobExport ( loginData,task )  {

  log.standard ( 19,'export job "' + task.project + '-job_' + task.id +
                    '", login ' + loginData.login );

  var exp_names   = getJobExportNames ( loginData,task );
  var exportName  = exp_names[0];
  var jobDirPath  = exp_names[1];
  var archivePath = exp_names[2];
  utils.removeFile ( archivePath );  // just in case

  send_dir.packDir ( jobDirPath,'*',null,function(code,jobballSize){
    var jobballPath = send_dir.getJobballPath ( jobDirPath );
    if (code)  {
      log.error ( 20,'errors at packing ' + jobDirPath + ' for export' );
      utils.removeFile ( jobballPath );  // export will never get ready!
    } else  {
      log.standard ( 20,'packed' );
      utils.moveFile   ( jobballPath,archivePath );
    }
  });

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


function checkJobExport ( loginData,task )  {
  var archivePath = getJobExportNames(loginData,task)[2];
  rdata = {};
  if (utils.fileExists(archivePath))
        rdata.size = utils.fileSize(archivePath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}

function finishJobExport ( loginData,task )  {
  var archivePath = getJobExportNames(loginData,task)[2];
  utils.removeFile ( archivePath );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================
// Failed Job Export

function getFailedJobExportNames ( fjdata )  {
  //var path_list   = fjdata.path.split('/');
  if ('path' in fjdata)  {
    var path_list   = fjdata.path.split('\\').pop().split('/');
    var exportName  = path_list[path_list.length-1] + '.zip';
    var jobDirPath  = conf.getFEConfig().getJobsSafePath();
    for (var i=1;i<path_list.length;i++)
      jobDirPath  = path.join ( jobDirPath,path_list[i] );
    var archivePath = path.join ( conf.getFEConfig().getJobsSafePath(),exportName );
    var url         = cmd.__special_fjsafe_tag + '/' + exportName;
    return [ exportName,jobDirPath,archivePath,url ];
  } else
    return [ '','','','' ];
}

function prepareFailedJobExport ( loginData,fjdata )  {

  if ('path' in fjdata)  {

    log.standard ( 19,'export failed job "' + fjdata.path + '", login ' + loginData.login );

    var exp_names   = getFailedJobExportNames ( fjdata );
    var exportName  = exp_names[0];
    var jobDirPath  = exp_names[1];
    var archivePath = exp_names[2];
    utils.removeFile ( archivePath );  // just in case

    send_dir.packDir ( jobDirPath,'*',archivePath,function(code,jobballSize){
      if (code)  {
        log.error ( 20,'errors at packing ' + jobDirPath + ' for export' );
        utils.removeFile ( archivePath );  // export will never get ready!
      }
    });

    return new cmd.Response ( cmd.fe_retcode.ok,'',exp_names[3] );

  } else
    return new cmd.Response ( cmd.fe_retcode.ok,'','no_exp_names' );

}

function checkFailedJobExport ( loginData,fjdata )  {
  var archivePath = getFailedJobExportNames(fjdata)[2];
  rdata = {};
  if (archivePath && utils.fileExists(archivePath))
        rdata.size = utils.fileSize(archivePath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}

function finishFailedJobExport ( loginData,fjdata )  {
  var archivePath = getFailedJobExportNames(fjdata)[2];
  if (archivePath)
    utils.removeFile ( archivePath );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================

function getProjectData ( loginData,data )  {

  var response = getProjectList ( loginData );
  if (response.status!=cmd.fe_retcode.ok)
    return response;

  log.detailed ( 11,'get current project data (' + response.data.current +
                    '), login ' + loginData.login );

  // Get users' projects list file name
  var projectList = response.data;
  var projectName = projectList.current;

  // check that current project exists
  var pdesc = null;
  for (var i=0;(i<projectList.projects.length) && (!pdesc);i++)
    if (projectList.projects[i].name==projectName)
      pdesc = projectList.projects[i];
  if (!pdesc)
    return new cmd.Response ( cmd.fe_retcode.ok,'','missing' );

  if (data.mode=='replay')
    projectName += ':' + replayDir;

  var pData = readProjectData ( loginData,projectName );
  if (pData)  {
    if (!pd.isProjectAccessible(loginData.login,pData.desc))
      return new cmd.Response ( cmd.fe_retcode.projectAccess,
                                 '[00033] Project access denied.','' );
    var d = {};
    d.meta      = pData;
    d.tasks_add = [];
    d.tasks_del = [];
    var projectDirPath = getProjectDirPath ( loginData,projectName );
    response = new cmd.Response ( cmd.fe_retcode.ok,'',d );
    fs.readdirSync(projectDirPath).forEach(function(file,index){
      if (file.startsWith(jobDirPrefix)) {
        var jobPath = path.join ( projectDirPath,file,task_t.jobDataFName );
        var task    = utils.readObject ( jobPath );
        if (task)  {
          d.tasks_add.push ( task );
        } else  {
          d.message = '[00021] Job metadata cannot be read.';
          utils.removePath ( path.join ( projectDirPath,file ) );
        }
      }
    });
  } else  {
    var projectDataPath = getProjectDataPath ( loginData,projectName );
    if (utils.fileExists(projectDataPath))  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                 '[00022] Project metadata cannot be read.','' );
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                            '[00023] Project metadata file does not exist.','' );
    }
  }

  return response;

}


// ===========================================================================

function checkTimestamps ( loginData,projectDesc )  {
// 'projectDesc' comes from the client. Client does not change timestamps,
// therefore, timestamp on server side may be either equal or ahead of
// timestamp in 'projectDesc'.
  var rdata    = {};  // response data object
  rdata.pdesc  = projectDesc;
  rdata.reload = 0;  // project reload codes for client:
                     //  0: no reload is needed
                     //  1: reload is needed but current operation may continue
                     //  2: reload is mandatory, current operation must terminate
  rdata.pdesc  = null;
  if (projectDesc.owner.share.length>0)  {  // the project is shared
    rdata.pdesc = readProjectDesc ( loginData,projectDesc.name );
    if (rdata.pdesc)  {
      if (rdata.pdesc.timestamp>projectDesc.timestamp)  {
        // client timestamp is behind server project timestamp; request
        // update on client side
        if (rdata.pdesc.project_version>projectDesc.project_version)
              rdata.reload = 2;  // project changed considerably, reload client
        else  rdata.reload = 1;  // on-client data should be safe
      }
    }
  }
  return rdata;
}


function advanceJobCounter ( loginData,data )  {
  //var response    = null;
  var projectDesc = data.meta;
  var rdata       = checkTimestamps ( loginData,projectDesc );
  rdata.project_missing = false;
  if (!rdata.reload)  {
    var projectData = readProjectData ( loginData,projectDesc.name );
    if (projectData)  {
      projectData.desc.jobCount++;
      writeProjectData ( loginData,projectData,false );  // do not change the timestamp
      rdata.pdesc = projectData.desc;
    } else if (projectDesc.owner.share.length>0)
      rdata.project_missing = true;
  }
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}


function saveProjectData ( loginData,data )  {
  var response    = null;
  var projectData = data.meta;
  var projectDesc = projectData.desc;
  var projectName = projectDesc.name;
//  console.log ( ' >>>>>>>>>> write current project data (' + projectName +
//                '), login ' + loginData.login + ' timestamp ' + projectData.desc.timestamp );

  // Check timestamps for shared projects
  var rdata = checkTimestamps ( loginData,projectData.desc );

  if (rdata.reload>0)
    return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

  // Get users' projects list file name
  var projectDataPath = getProjectDataPath ( loginData,projectName );

  if (utils.fileExists(projectDataPath))  {

    var disk_space_change = 0.0;
    if ('disk_space' in projectDesc)  {  // backward compatibility on 05.06.2018
      for (var i=0;i<data.tasks_del.length;i++)
        disk_space_change -= data.tasks_del[i][1]
      projectDesc.disk_space += disk_space_change;
      projectDesc.disk_space  = Math.max ( 0,projectDesc.disk_space );
    } else  {
      projectDesc.disk_space  = 0.0;   // should be eventually removed
      projectDesc.cpu_time    = 0.0;   // should be eventually removed
    }

    checkProjectData ( projectData,loginData );

    if (disk_space_change!=0.0)  {
      // disk space change is booked to project owner inside this function
      //ration.changeProjectDiskSpace ( loginData,projectName,disk_space_change,false );
      var ownerLoginData = loginData;
      if (loginData.login!=projectDesc.owner.login)
        ownerLoginData = user.getUserLoginData ( projectDesc.owner.login );
      ration.updateProjectStats ( ownerLoginData,projectName,
                                  0.0,disk_space_change,0,true );
    }

    var update_time_stamp = data.update || (data.tasks_del.length>0) ||
                                           (data.tasks_add.length>0);

//console.log ( ' >>>> update_time_stamp='+ update_time_stamp );

    if (writeProjectData(loginData,projectData,update_time_stamp))  {

//console.log ( ' >>>> timestamp='+ projectData.desc.timestamp );

      if (data.tasks_del.length>0)  // save on reading files ration does not change
        rdata.ration = ration.getUserRation(loginData).clearJobs();
      rdata.pdesc = projectData.desc;

      response = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

      // remove job directories from the 'delete' list
      var ndel_own = 0;
      for (var i=0;i<data.tasks_del.length;i++)
        utils.removePath ( getJobDirPath(loginData,projectName,data.tasks_del[i][0]) );

      // add job directories from the 'add' list
      for (var i=0;i<data.tasks_add.length;i++)  {

        var jobDirPath = getJobDirPath ( loginData,projectName,data.tasks_add[i].id );

        if (utils.mkDir(jobDirPath)) {

          var jobDataPath = getJobDataPath(loginData,projectName,data.tasks_add[i].id );
          if (!utils.writeObject(jobDataPath,data.tasks_add[i])) {
            response = new cmd.Response ( cmd.fe_retcode.writeError,
                                '[00024] Job metadata cannot be written.','' );
          }

          if (('cloned_id' in data.tasks_add[i]) && data.tasks_add[i].cloned_id)  {
            var taski      = class_map.makeClass ( data.tasks_add[i] );
            var cloneItems = taski.cloneItems();
            if (cloneItems.length>0)  {
              // We copy items into cloned directory asynchronously without
              // making sure that copy completes before response is sent back
              // to client. This is a potential trouble, however, we assume
              // no massive copying here, so that it should work.
              var jobDirPath0 = getJobDirPath ( loginData,projectName,taski.cloned_id );
              for (var j=0;j<cloneItems.length;j++)  {
                var item_src  = path.join ( jobDirPath0,cloneItems[j] );
                var item_dest = path.join ( jobDirPath ,cloneItems[j] );
                fs.copy ( item_src,item_dest,function(err)  {
                  if (err)  {
                    log.error ( 30,'error copying item ' + item_src  );
                    log.error ( 30,'                to ' + item_dest );
                    log.error ( 30,'error: ' + err );
                  }
                  //log.standard ( 31,'copied item ' + item_src  );
                  //log.standard ( 31,'         to ' + item_dest );
                });
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

        } else  {
          response = new cmd.Response ( cmd.fe_retcode.mkDirError,
                  '[00025] Cannot create Job Directory',
                  emailer.send ( conf.getEmailerConfig().maintainerEmail,
                      'CCP4 Create Job Dir Fails',
                      'Detected mkdir failure at making new job directory, ' +
                      'please investigate.' )
              );
        }

      }

    } else  {
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                            '[00026] Project metadata cannot be written.','' );
    }

  } else if (projectData.desc.owner.share.length>0)  {
    rdata.reload = -11111;
    response = new cmd.Response ( cmd.fe_retcode.ok,
                               '[00027] Project metadata does not exist.',rdata );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.noProjectData,
                               '[00027] Project metadata does not exist.','' );
  }

  return response;

}


// ===========================================================================

function shareProject ( loginData,data )  {  // data must contain new title
var pDesc    = data.desc;
var share    = pDesc.owner.share;
var share0   = data.share0;
var shared   = [];
var unshared = [];
var unknown  = [];

  if (loginData.login!=pDesc.owner.login)
    return new cmd.Response ( cmd.fe_retcode.ok,'',{
      desc     : null,      // signal that only owner can change sharing
      unshared : unshared,
      unknown  : unknown
    });

  // unshare by comparison of share0 and share
  for (var i=0;i<share0.length;i++)
    if (share0[i].login)  {
      var found = false;
      for (var j=0;(j<share.length) && (!found);j++)
        found = (share0[i].login==share[j].login);
      if (!found)  {
        var uLoginData = user.getUserLoginData ( share0[i].login );
        if (uLoginData)  {
          var pShare = readProjectShare ( uLoginData );
          pShare.removeShare ( pDesc );
          writeProjectShare  ( uLoginData,pShare );
        }
        unshared.push ( share0[i] );
      }
    }

  // share with users given by share
  for (var i=0;i<share.length;i++)
    if (share[i].login)  {
      var uLoginData = user.getUserLoginData ( share[i].login );
      if (uLoginData)  {
        var pShare = readProjectShare ( uLoginData );
        pShare.addShare ( pDesc );
        writeProjectShare ( uLoginData,pShare );
        shared.push  ( share[i] );
      } else
        unknown.push ( share[i] );
    }

  pDesc.owner.share = shared;
  var pData = readProjectData ( loginData,pDesc.name );
  if (pData)  {
    pData.desc.owner.share = pDesc.owner.share;
    writeProjectData ( loginData,pData,true );
  }

  // modify project entry in project list
  var pList = readProjectList ( loginData );
  if (pList)  {
    var pno = -1;
    for (var i=0;(i<pList.projects.length) && (pno<0);i++)
      if (pList.projects[i].name==pDesc.name)
        pno = i;
    if (pno>=0)  {
      pList.projects[pno] = pDesc;
      writeProjectList ( loginData,pList );
    }
  }

  return new cmd.Response ( cmd.fe_retcode.ok,'',{
    desc     : pDesc,
    unshared : unshared,
    unknown  : unknown
  });

}

// ===========================================================================

function renameProject ( loginData,data )  {  // data must contain new title
var response = null;
var pData    = readProjectData ( loginData,data.name );

  if (pData)  {
    pData.desc.title = data.title;
    if (!writeProjectData(loginData,pData,true))  {
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                               '[00030] Project metadata cannot be written.','' );
    } else  {
      var rdata  = {};
      rdata.meta = pData;
      response   = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
    }
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.readError,
                             '[00031] Project metadata cannot be read.','' );
  }

  return response;

}


// ===========================================================================

function _import_project ( loginData,tempdir,prjDir )  {
// 'tempdir' may contain unpacked project directory, in which case 'prjDir'
// shuld be null. Alternatively, 'prjDir' gives project directory to be
// symlinked, in which case 'tempdir' should be supplied as well

  // read project meta to make sure it was a project tarball
  var prj_meta_path = '';
  if (prjDir)  prj_meta_path = path.join ( prjDir ,projectDataFName );
         else  prj_meta_path = path.join ( tempdir,projectDataFName );
  var prj_meta = utils.readObject ( prj_meta_path );

  // validate metadata and read project name
  var projectDesc = new pd.ProjectDesc();
  try {
    if (prj_meta._type=='ProjectData')  {
      projectDesc.name         = prj_meta.desc.name;
      projectDesc.title        = prj_meta.desc.title;
      projectDesc.disk_space   = prj_meta.desc.disk_space;
      projectDesc.cpu_time     = prj_meta.desc.cpu_time;
      projectDesc.njobs        = prj_meta.desc.njobs;
      projectDesc.dateCreated  = prj_meta.desc.dateCreated;
      projectDesc.dateLastUsed = prj_meta.desc.dateLastUsed;
      if ('owner' in prj_meta.desc)  {
        projectDesc.owner        = prj_meta.desc.owner;
        if (!prjDir)  {  // this means that the project is imported, not shared
          projectDesc.owner.author = prj_meta.desc.owner.login;
          projectDesc.owner.login  = loginData.login;
          projectDesc.owner.share  = [];
        }
      }
      if (!projectDesc.owner.login)
        projectDesc.owner.login = loginData.login;
      prj_meta.desc.owner = projectDesc.owner;
      utils.writeObject ( prj_meta_path,prj_meta );
    } else
      prj_meta = null;
  } catch(err) {
    prj_meta = null;
  }

  var signal_path = path.join ( tempdir,'signal' );

  if (!prj_meta)  {

    utils.writeString ( signal_path,'Invalid or corrupt project data\n' +
                                    projectDesc.name );

  } else  {

    var projectDir = getProjectDirPath ( loginData,projectDesc.name );

    if (utils.fileExists(projectDir) && (!utils.isSymbolicLink(projectDir)))  {

      utils.writeString ( signal_path,'Project "' + projectDesc.name +
                                      '" already exists.\n' +
                                      projectDesc.name );

    //} else if (utils.moveFile(tempdir,projectDir))  {
      // the above relies on tmp and project directories to be
      // on the same file system

    } else  {

      var placed = true;
      if (prjDir)  {
        utils.removeFile ( projectDir );  // in case it exists
        placed = utils.makeSymLink ( projectDir,path.resolve(prjDir) );
      } else if (utils.moveDir(tempdir,projectDir,true))  {
        utils.mkDir ( tempdir );  // because it was moved
      } else {
        utils.writeString ( signal_path,'Cannot copy to project ' +
                                        'directory (disk full?)\n' +
                                        projectDesc.name );
        placed = false;
      }

      if (placed)  {
        // the project's content was moved to user's area, now
        // make the corresponding entry in project list

        // Get users' projects list file name
        /*
        var userProjectsListPath = getUserProjectListPath ( loginData );
        var pList = null;
        if (utils.fileExists(userProjectsListPath))
              pList = utils.readObject ( userProjectsListPath );
        else  pList = new pd.ProjectList();
        */

        var pList = readProjectList ( loginData );
        if (!pList)
          pList = new pd.ProjectList();  // *** should throw error instead

        var projects = pList.projects;
        pList.projects = [projectDesc];
        for (var i=0;i<projects.length;i++)
          if (projects[i].name!=projectDesc.name)
            pList.projects.push ( projects[i] );

        //pList.projects.unshift ( projectDesc );  // put it first
        pList.current = projectDesc.name;        // make it current
        //if (utils.writeObject(userProjectsListPath,pList))
        if (writeProjectList(loginData,pList))
              utils.writeString ( signal_path,'Success\n' + projectDesc.name );
        else  utils.writeString ( signal_path,'Cannot write project list\n' +
                                              projectDesc.name );

        //if (loginData.login==projectDesc.owner.login)
        //  ration.changeUserDiskSpace ( loginData,projectDesc.disk_space );
        ration.calculateUserDiskSpace ( loginData );

      } else  {

        utils.writeString ( signal_path,'Project "' + projectDesc.name +
                                        '" cannot be allocated (disk full?)\n' +
                                        projectDesc.name );

      }

    }

  }

}


function getProjectTmpDir ( loginData,make_clean )  {
  var tempdir = conf.getFETmpDir1(loginData);

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
    utils.removePath ( tempdir );  // just in case
    if (!utils.mkDir(tempdir))  {
      log.error ( 41,'cannot create temporary directory at ' + tempdir );
      tempdir = null;
    }
  }

  return tempdir;

}


function importProject ( loginData,upload_meta )  {

  // create temporary directory, where all project tarball will unpack;
  // directory name is derived from user login in order to check on
  // import outcome in subsequent 'checkPrjImport' requests

  var tempdir = getProjectTmpDir ( loginData,true );
  if (tempdir)  {

    var errs = '';

    // we run this loop although expect only one file on upload
    for (key in upload_meta.files)  {

      // rename file with '__' prefix in order to use the standard
      // unpack directory function
      //if (utils.moveFile(key,path.join(tempdir,'__dir.tar.gz')))  {
      if (utils.moveFile(key,path.join(tempdir,send_dir.jobballName)))  {

        // unpack project tarball
        send_dir.unpackDir ( tempdir,null,function(code,jobballSize){
          if (code)
            log.error ( 50,'unpack errors, code=' + code + ', filesize=' + jobballSize );
          _import_project ( loginData,tempdir,null );
        });

      } else  {
        errs = 'file move error';
      }

      break;  // only one file to be processed

    }

    var fdata = {};
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
  var rc      = cmd.fe_retcode.ok;
  var rc_msg  = 'success';
  var tempdir = getProjectTmpDir ( loginData,true );

  if (tempdir)  {

    var cloudMounts = fcl.getUserCloudMounts ( loginData );
    var demoProjectPath = null;
    var lst = meta.cloudpath.split('/');

    for (var j=0;(j<cloudMounts.length) && (!demoProjectPath);j++)
      if (cloudMounts[j][0]==lst[0])
        demoProjectPath = path.join ( cloudMounts[j][1],lst.slice(1).join('/'),
                                      meta.demoprj.name );

    if (demoProjectPath)  {
      if (utils.fileExists(demoProjectPath))  {
        send_dir.unpackDir1 ( tempdir,demoProjectPath,null,false,
          function(code,jobballSize){
            if (code)
              log.error ( 55,'unpack errors, code=' + code + ', filesize=' + jobballSize );
            _import_project ( loginData,tempdir,null );
          });
      } else  {
        rc     = cmd.fe_retcode.fileNotFound;
        rc_msg = 'Demo project ' + meta.demoprj.name + ' does not exist';
      }
    } else  {
      rc     = cmd.fe_retcode.fileNotFound;
      rc_msg = 'Cannot calculate path for demo project ' + meta.demoprj.name;
    }

  } else {
    rc     = cmd.fe_retcode.mkDirError;
    rc_msg = 'Cannot make project directory for demo import';
  }

  return new cmd.Response ( rc,rc_msg,{} );

}


function startSharedImport ( loginData,meta )  {
  var rc      = cmd.fe_retcode.ok;
  var rc_msg  = 'success';
  var tempdir = getProjectTmpDir ( loginData,true );

  var import_as_link = true;  // development switch

  if (tempdir)  {

//    var project_keeper = meta.owner.login;
//    if (('keeper' in meta.owner) && meta.owner.keeper)
//      project_keeper = meta.owner.keeper;
//    var uLoginData = user.getUserLoginData ( project_keeper );
    var uLoginData = user.getUserLoginData ( meta.owner.login );
    if (uLoginData)  {
      var sProjectDirPath = getProjectDirPath ( uLoginData,meta.name );
      if (utils.fileExists(sProjectDirPath))  {
        if (import_as_link)  {
          _import_project ( loginData,tempdir,sProjectDirPath );
        } else  {
          fs.copy ( sProjectDirPath,tempdir,function(err){
            if (err)
              utils.writeString ( path.join(tempdir,'signal'),
                                  'Errors during data copy\n' +
                                  projectDesc.name );
            else
              _import_project ( loginData,tempdir,null );
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
  var signal_path = path.join ( getProjectTmpDir(loginData,false),'signal' );
  var rdata  = {};
  var signal = utils.readString ( signal_path );
  if (signal)  {
    var msg = signal.split('\n');
    rdata.signal = msg[0];
    rdata.name   = msg[1];
  } else  {
    rdata.signal = null;
    rdata.name   = '???';
  }
  return new cmd.Response ( cmd.fe_retcode.ok,'success',rdata );
}


function finishProjectImport ( loginData,data )  {
  var tempdir = getProjectTmpDir(loginData,false);
  utils.removePath ( tempdir );
  return new cmd.Response ( cmd.fe_retcode.ok,'success','' );
}


// ===========================================================================

function saveJobData ( loginData,data )  {
  var response    = null;
  var projectName = data.meta.project;
  var jobId       = data.meta.id;

  if (data.update_tree)  {
    var pData = readProjectData ( loginData,projectName );
    if (pData)
      writeProjectData ( loginData,pData,true );
  }

  var jobDataPath = getJobDataPath ( loginData,projectName,jobId );

  if (utils.fileExists(jobDataPath) && utils.writeObject(jobDataPath,data.meta))  {
    response = new cmd.Response ( cmd.fe_retcode.ok,'',{ 'project_missing':false } );
  } else  {
    if (data.is_shared &&
        (!utils.fileExists(getProjectDataPath(loginData,projectName))))
      response = new cmd.Response ( cmd.fe_retcode.ok,'project_missing',
                                    { 'project_missing':true } );
    if (!response)
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                    '[00028] Job metadata cannot be written.',
                                    { 'project_missing':null } );
  }

  return response;

}


// ===========================================================================

function getJobFile ( loginData,data )  {
  var response = null;

  var projectName = data.meta.project;
  var jobId       = data.meta.id;

  var jobDirPath  = getJobDirPath ( loginData,projectName,jobId );
  var pfile       = data.meta.file.split('/');

  var fpath = getJobDirPath ( loginData,projectName,jobId );
  for (var i=0;i<pfile.length;i++)
    fpath = path.join ( fpath,pfile[i] );

  var data = utils.readString ( fpath );
  if (data)  {
    response = new cmd.Response ( cmd.fe_retcode.ok,'',data );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.writeError,
                               '[00029] Requested file not found.','' );
  }

  return response;

}


// ==========================================================================
// export for use in node
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
module.exports.advanceJobCounter      = advanceJobCounter;
module.exports.saveProjectData        = saveProjectData;
module.exports.shareProject           = shareProject;
module.exports.renameProject          = renameProject;
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
module.exports.getJobFile             = getJobFile;
