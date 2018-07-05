
/*
 *  =================================================================
 *
 *    05.07.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

//  load system modules
var fs            = require('fs-extra');
var path          = require('path');
var child_process = require('child_process');

//  load application modules
var emailer  = require('./server.emailer');
var conf     = require('./server.configuration');
var utils    = require('./server.utils');
var send_dir = require('./server.send_dir');
var ration   = require('./server.fe.ration');
var pd       = require('../js-common/common.data_project');
var cmd      = require('../js-common/common.commands');
var task_t   = require('../js-common/tasks/common.tasks.template');

//  prepare log
var log = require('./server.log').newLog(6);

// ===========================================================================

var projectExt         = '.prj';
var userProjectsExt    = '.projects';
var projectListFName   = 'projects.list';
var userKnowledgeFName = 'knowledge.meta';
var projectDataFName   = 'project.meta';
var jobDirPrefix       = 'job_';
var replayDir          = 'replay';

// ===========================================================================

function getUserProjectsDirPath ( login )  {
// path to directory containing all project directories of user with
// given login name
  return path.join ( conf.getFEConfig().projectsPath,login + userProjectsExt );
}

function getUserProjectListPath ( login )  {
// path to JSON file containing list of all projects (with project
// descriptions, represented as class ProjectList) of user with
// given login name
  return path.join ( conf.getFEConfig().projectsPath,login + userProjectsExt,
                                           projectListFName );
}

function getUserKnowledgePath ( login )  {
// path to JSON file containing knowledge data of user with
// given login name
  return path.join ( conf.getFEConfig().projectsPath,login + userProjectsExt,
                                           userKnowledgeFName );
}

function getProjectDirPath ( login,projectName )  {
// path to directory containing project 'projectName' of user with
// given login name
  var n = projectName.lastIndexOf(':'+replayDir);
  if (n>0)
    return path.join ( conf.getFEConfig().projectsPath,
                       login + userProjectsExt,
                       projectName.slice(0,n) + projectExt,
                       replayDir );
  else
    return path.join ( conf.getFEConfig().projectsPath,
                       login + userProjectsExt,
                       projectName + projectExt );
}

function getProjectDataPath ( login,projectName )  {
// path to JSON file containing metadata (see class ProjectData) of
// project 'peojectName' of user with given login name
  return path.join ( getProjectDirPath(login,projectName),projectDataFName );
}

function getJobDirPath ( login,projectName,jobId )  {
// path to directory containing job identified by 'jobId' in project
// 'projectName' of user with given login name
  return path.join ( conf.getFEConfig().projectsPath,login  + userProjectsExt,
                                               projectName  + projectExt,
                                               jobDirPrefix + jobId );
}

function getSiblingJobDirPath ( jobDir,jobId )  {
// path to directory containing job identified by 'jobId' in project and login
// corresponding to the existing 'jobDir' directory
  return path.join ( jobDir,'..',jobDirPrefix + jobId );
}

function getJobReportDirPath ( login,projectName,jobId )  {
// path to directory containing report for job identified by 'jobId' in project
// 'projectName' of user with given login name
  return path.join ( conf.getFEConfig().projectsPath,login  + userProjectsExt,
                                           projectName  + projectExt,
                                           jobDirPrefix + jobId,
                                           task_t.jobReportDirName );
}

function getJobInputDirPath ( login,projectName,jobId )  {
// path to directory used to keep data for sending job, identified by 'jobId'
// in project 'projectName' of user with given login name, to NC
  return path.join ( conf.getFEConfig().projectsPath,login  + userProjectsExt,
                                           projectName  + projectExt,
                                           jobDirPrefix + jobId,
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

function getJobOutputDirPath ( login,projectName,jobId )  {
// path to directory used to keep data generated by job identified by 'jobId'
// in project 'projectName' of user with given login name
  return path.join ( conf.getFEConfig().projectsPath,login  + userProjectsExt,
                                           projectName  + projectExt,
                                           jobDirPrefix + jobId,
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

function getJobDataPath ( login,projectName,jobId )  {
// path to JSON file containing metadata (see task classes in 'js-common.tasks')
// of job identified by 'jobId' in project 'projectName' of user with given
// login name
  return path.join ( conf.getFEConfig().projectsPath,login  + userProjectsExt,
                                           projectName  + projectExt,
                                           jobDirPrefix + jobId,
                                           task_t.jobDataFName );
}


// ===========================================================================

function makeNewUserProjectsDir ( login )  {
var response = null;  // must become a cmd.Response object to return

  log.standard ( 1,'make new user projects directory, login ' + login );

  // Get users' projects directory name
  var userProjectsDirPath = getUserProjectsDirPath ( login );

  if (utils.fileExists(userProjectsDirPath))  {
    // just a message, do not change anything in the existing projects directory
    log.error ( 2,'repeat attempt to create user projects directory, login ' + login );
    response = new cmd.Response ( cmd.fe_retcode.ok,
                                '[00012] User projects directory exists','' );
  } else if (utils.mkDir(userProjectsDirPath)) {
    if (utils.writeObject(getUserProjectListPath(login),new pd.ProjectList())) {
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

function getProjectList ( login )  {
var response = 0;  // must become a cmd.Response object to return

  log.detailed ( 3,'get project list, login ' + login );

  // Get users' projects list file name
  var userProjectsListPath = getUserProjectListPath ( login );

  if (utils.fileExists(userProjectsListPath))  {
    var pList = utils.readObject ( userProjectsListPath );
    if (pList)  {
      response = new cmd.Response ( cmd.fe_retcode.ok,'',pList );
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                    '[00015] Project list cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.readError,
                                   '[00016] Project list does not exist.','' );
  }

  return response;

}


// ===========================================================================

function getUserKnowledgeData ( login )  {
var response  = 0;  // must become a cmd.Response object to return
var knowledge = {};

  log.detailed ( 4,'get knowledge data, login ' + login );

  // Get users' projects list file name
  var userKnowledgePath = getUserKnowledgePath ( login );

  if (utils.fileExists(userKnowledgePath))
    knowledge = utils.readObject ( userKnowledgePath );

  response  = new cmd.Response ( cmd.fe_retcode.ok,'',knowledge );

  return response;

}


// ===========================================================================

function makeNewProject ( login,projectDesc )  {
var response = null;  // must become a cmd.Response object to return

//  console.log ( JSON.stringify(projectDesc) );

  log.standard ( 5,'make new project ' + projectDesc.name + ', login ' + login );

  // Get users' projects directory name
  var projectDirPath = getProjectDirPath ( login,projectDesc.name );

  if (utils.fileExists(projectDirPath))  {
    // just issue a message, do not change anything in the existing
    // projects directory

    log.error ( 6,'repeat attempt to create project directory ' + projectDesc.name +
                  ', login ' + login );
    response = new cmd.Response ( cmd.fe_retcode.ok,'Project directory exists','' );

  } else if (utils.mkDir(projectDirPath)) {

    var projectData  = new pd.ProjectData();
    projectData.desc = projectDesc;
    /*
    if (utils.writeObject(getProjectDataPath(login,projectDesc.name),
                                             projectData)) {
      response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.writeError,
                                '[00017] Project data cannot be written.','' );
    }
    */
    if (utils.writeObject(getProjectDataPath(login,projectDesc.name),
                                             projectData)) {
      if (utils.mkDir(path.join(projectDirPath,replayDir))) {
        var pname = projectData.desc.name;
        projectData.desc.name = projectData.desc.name + ':' + replayDir;
        if (utils.writeObject(getProjectDataPath(login,projectDesc.name),
                                                 projectData)) {
          response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
        }
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

function deleteProject ( login,projectName )  {
var response = 0;  // must become a cmd.Response object to return

  log.standard ( 7,'delete project ' + projectName + ', login ' + login );

  // Get users' projects directory name
  var projectDirPath = getProjectDirPath ( login,projectName );

  utils.removePath ( projectDirPath );

  ration.maskProject ( login,projectName );

  var erc = '';
  if (utils.fileExists(projectDirPath))
    erc = emailer.send ( conf.getEmailerConfig().maintainerEmail,
              'CCP4 Remove Project Directory Fails',
              'Detected removePath failure at deleting project directory, ' +
              'please investigate.' );

  response = new cmd.Response ( cmd.fe_retcode.ok,'',erc );
  return response;

}


// ===========================================================================

function saveProjectList ( login,newProjectList )  {
var response = null;  // must become a cmd.Response object to return

  log.detailed ( 8,'save project list, login ' + login );

  // Get users' projects list file name
  var userProjectsListPath = getUserProjectListPath ( login );

  if (utils.fileExists(userProjectsListPath))  {
    var pList = utils.readObject ( userProjectsListPath );
    if (pList)  {

      // delete missed projects
      var disk_space_change = 0.0;
      for (var i=0;i<pList.projects.length;i++)  {
        var found = false;
        var pName = pList.projects[i].name;
        for (var j=0;(j<newProjectList.projects.length) && (!found);j++)
          found = (pName==newProjectList.projects[j].name);
        if (!found)  {
          var rsp = deleteProject ( login,pName );
          if (rsp.status!=cmd.fe_retcode.ok)
            response = rsp;
          else  {
            if ('disk_space' in pList.projects[i])  // backward compatibility 05.06.2018
              disk_space_change -= pList.projects[i].disk_space;
          }
        }
      }

      if (disk_space_change!=0.0)
        ration.changeProjectDiskSpace ( login,null,disk_space_change,false );

      // create new projects
      for (var i=0;i<newProjectList.projects.length;i++)  {
        var found = false;
        var pName = newProjectList.projects[i].name;
        for (var j=0;(j<pList.projects.length) && (!found);j++)
          found = (pName==pList.projects[j].name);
        if (!found)  {
          var rsp = makeNewProject ( login,newProjectList.projects[i] );
          if (rsp.status!=cmd.fe_retcode.ok)
            response = rsp;
        }
      }

      if (!response)  {
        if (utils.writeObject ( userProjectsListPath,newProjectList ))  {
          var rdata = {};
          if (disk_space_change!=0.0)  {  // save on reading files ration does not change
            rdata.ration = ration.getUserRation(login).clearJobs();
          }
          response = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
        } else
          response = new cmd.Response ( cmd.fe_retcode.writeError,
                                '[00019] Project list cannot be written.','' );
      }

    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                                   '[00019] Project list cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.readError,
                                   '[00020] Project list does not exist.','' );
  }

  return response;

}



// ===========================================================================

function prepareProjectExport ( login,projectList )  {

  log.standard ( 9,'export project "'+projectList.current+'", login '+login );

  var projectDirPath = getProjectDirPath ( login,projectList.current );
  var tarballPath1   = path.join ( projectDirPath,projectList.current+'.tar.gz' );
  utils.removeFile ( tarballPath1 );  // just in case

  var tarballName    = '__' + projectList.current + '.tar.gz';

  // Pack files, assume tar
  var tar = child_process.spawn ( '/bin/sh',
                                  ['-c','tar -czf ' + tarballName + ' *'],{
    cwd   : projectDirPath,
    stdio : ['ignore']
  });

  tar.on ( 'close', function(code){
    log.standard ( 10,'packed' );
    var tarballPath = path.join ( projectDirPath,tarballName );
    if (code!=0)
      utils.removeFile ( path.join(dirPath,tarballPath) );
    utils.moveFile ( tarballPath,tarballPath1 );
  });

  return new cmd.Response ( cmd.fe_retcode.ok,'','' );

}


function checkProjectExport ( login,projectList )  {
  var projectDirPath = getProjectDirPath ( login,projectList.current );
  var tarballPath    = path.join ( projectDirPath,projectList.current+'.tar.gz' );
  rdata = {};
  if (utils.fileExists(tarballPath))
        rdata.size = utils.fileSize(tarballPath);
  else  rdata.size = -1;
  return new cmd.Response ( cmd.fe_retcode.ok,'',rdata );
}


function finishProjectExport ( login,projectList )  {
  var projectDirPath = getProjectDirPath ( login,projectList.current );
  var tarballPath1   = path.join ( projectDirPath,projectList.current+'.tar.gz' );
  var tarballPath2   = path.join ( projectDirPath,'__' + projectList.current+'.tar.gz' );
  utils.removeFile ( tarballPath1 );
  utils.removeFile ( tarballPath2 );
  return new cmd.Response ( cmd.fe_retcode.ok,'','' );
}


// ===========================================================================

function getProjectData ( login )  {

  var response = getProjectList ( login );
  if (response.status!=cmd.fe_retcode.ok)
    return response;

  log.detailed ( 11,'get current project data (' + response.data.current +
                         '), login ' + login );

  // Get users' projects list file name
  var projectDataPath = getProjectDataPath ( login,response.data.current );

  if (utils.fileExists(projectDataPath))  {
    var pData = utils.readObject ( projectDataPath );
    if (pData)  {
      var d = {};
      d.meta      = pData;
      d.tasks_add = [];
      d.tasks_del = [];
      var projectDirPath = getProjectDirPath ( login,response.data.current );
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
//            response = new cmd.Response ( cmd.fe_retcode.readError,
//                                  '[00021] Job metadata cannot be read.',d );
          }
        }
      });
    } else  {
      response = new cmd.Response ( cmd.fe_retcode.readError,
                               '[00022] Project metadata cannot be read.','' );
    }
  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.readError,
                               '[00023] Project metadata does not exist.','' );
  }

  return response;

}


// ===========================================================================

function saveProjectData ( login,data )  {

  var projectName = data.meta.desc.name;
//  console.log ( ' ... write current project data (' + projectName +
//                '), login ' + login );

  // Get users' projects list file name
  var projectDataPath = getProjectDataPath ( login,projectName );

  if (utils.fileExists(projectDataPath))  {

    var disk_space_change = 0.0;
    if ('disk_space' in data.meta.desc)  {  // backward compatibility on 05.06.2018
      for (var i=0;i<data.tasks_del.length;i++)
        disk_space_change -= data.tasks_del[i][1]
      data.meta.desc.disk_space += disk_space_change;
      data.meta.desc.disk_space  = Math.max ( 0,data.meta.desc.disk_space );
    } else  {
      data.meta.desc.disk_space  = 0.0;   // should be eventually removed
      data.meta.desc.cpu_time    = 0.0;   // should be eventually removed
    }

    ration.changeProjectDiskSpace ( login,projectName,disk_space_change,false );

    if (utils.writeObject(projectDataPath,data.meta))  {

      var rdata = {};
      if (data.tasks_del.length>0)  {  // save on reading files ration does not change
        rdata.ration = ration.getUserRation(login).clearJobs();
        rdata.pdesc  = data.meta.desc;
      }

      response = new cmd.Response ( cmd.fe_retcode.ok,'',rdata );

      // remove job directories from the 'delete' list
      for (var i=0;i<data.tasks_del.length;i++)
        utils.removePath ( getJobDirPath(login,projectName,data.tasks_del[i][0]) );

      // add job directories from the 'add' list
      for (var i=0;i<data.tasks_add.length;i++)  {

        var jobDirPath = getJobDirPath ( login,projectName,data.tasks_add[i].id );

        if (utils.mkDir(jobDirPath)) {

          var jobDataPath = getJobDataPath(login,projectName,data.tasks_add[i].id );
          if (!utils.writeObject(jobDataPath,data.tasks_add[i])) {
            response = new cmd.Response ( cmd.fe_retcode.writeError,
                                '[00024] Job metadata cannot be written.','' );
          }

          // create report directory
          utils.mkDir ( getJobReportDirPath(login,projectName,data.tasks_add[i].id) );

          // create input directory (used only for sending data to NC)
          utils.mkDir ( getJobInputDirPath(login,projectName,data.tasks_add[i].id) );

          // create output directory (used for hosting output data)
          utils.mkDir ( getJobOutputDirPath(login,projectName,data.tasks_add[i].id) );

          // write out the self-uptdating html starting page, which will last
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

  } else  {
    response  = new cmd.Response ( cmd.fe_retcode.writeError,
                               '[00027] Project metadata does not exist.','' );
  }

  return response;

}


// ===========================================================================

function importProject ( login,upload_meta,tmpDir )  {

  // create temporary directory, where all project tarball will unpack;
  // directory name is derived from user login in order to check on
  // import outcome in subsequent 'checkPrjImport' requests

  var tempdir = path.join ( tmpDir,login+'_project_import' );
  utils.removePath ( tempdir );  // just in case

  if (utils.mkDir(tempdir))  {

    var errs = '';

    // we run this loop although expect only one file on upload
    for (key in upload_meta.files)  {

      // rename file with '__' prefix in order to use the standard
      // unpack directory function
      if (utils.moveFile(key,path.join(tempdir,'__dir.tar.gz')))  {

        // unpack project tarball
        send_dir.unpackDir ( tempdir,false,function(){

          // read project meta to make sure it was a project tarball
          var prj_meta = utils.readObject ( path.join(tempdir,projectDataFName) );

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
            } else
              prj_meta = null;
          } catch(err) {
            prj_meta = null;
          }

          var signal_path = path.join ( tempdir,'signal' );

          if (!prj_meta)  {

            utils.writeString ( signal_path,'Invalid or corrupt project data\n',
                                            projectDesc.name );

          } else  {

            var projectDir = getProjectDirPath ( login,projectDesc.name );
            if (utils.fileExists(projectDir))  {

              utils.writeString ( signal_path,'Project "' + projectDesc.name +
                                              '" already exists.\n' +
                                              projectDesc.name );

            } else if (utils.moveFile(tempdir,projectDir))  {
              // the above relies on tmp and project directories to be
              // on the same file system

              utils.mkDir ( tempdir );  // because it was moved

              // the project's content was moved to user's area, now
              // make the corresponding entry in project list

              // Get users' projects list file name
              var userProjectsListPath = getUserProjectListPath ( login );
              var pList = null;
              if (utils.fileExists(userProjectsListPath))
                    pList = utils.readObject ( userProjectsListPath );
              else  pList = new pd.ProjectList();

              pList.projects.unshift ( projectDesc );  // put it first
              pList.current = projectDesc.name;        // make it current
              if (utils.writeObject(userProjectsListPath,pList))
                    utils.writeString ( signal_path,'Success\n' + projectDesc.name );
              else  utils.writeString ( signal_path,'Cannot write project list\n' +
                                                    projectDesc.name );

              ration.changeUserDiskSpace ( login,projectDesc.disk_space );

            } else {

              utils.writeString ( signal_path,'Cannot copy to project ' +
                                              'directory (disk full?)\n' +
                                              projectDesc.name );

            }

          }

        });

      } else
        errs = 'file move error';

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


function checkProjectImport ( login,data )  {
  var signal_path = path.join ( conf.getFETmpDir(),login+'_project_import','signal' );
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


function finishProjectImport ( login,data )  {
  var tempdir = path.join ( conf.getFETmpDir(),login+'_project_import' );
  utils.removePath ( tempdir );
  return new cmd.Response ( cmd.fe_retcode.ok,'success','' );
}


// ===========================================================================

function saveJobData ( login,data )  {

  var projectName = data.meta.project;
  var jobId       = data.meta.id;

  var jobDataPath = getJobDataPath ( login,projectName,jobId );

  if (utils.writeObject(jobDataPath,data.meta))  {
    response = new cmd.Response ( cmd.fe_retcode.ok,'','' );
  } else  {
    response = new cmd.Response ( cmd.fe_retcode.writeError,
                               '[00028] Job metadata cannot be written.','' );
  }

  return response;

}


// ===========================================================================

function getJobFile ( login,data )  {

  var projectName = data.meta.project;
  var jobId       = data.meta.id;

  var jobDirPath  = getJobDirPath ( login,projectName,jobId );
  var pfile       = data.meta.file.split('/');

  var fpath = getJobDirPath ( login,projectName,jobId );
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
module.exports.makeNewUserProjectsDir = makeNewUserProjectsDir;
module.exports.getProjectList         = getProjectList;
module.exports.getProjectDataPath     = getProjectDataPath;
module.exports.getUserKnowledgePath   = getUserKnowledgePath;
module.exports.getUserKnowledgeData   = getUserKnowledgeData;
module.exports.saveProjectList        = saveProjectList;
module.exports.prepareProjectExport   = prepareProjectExport;
module.exports.checkProjectExport     = checkProjectExport;
module.exports.finishProjectExport    = finishProjectExport;
module.exports.checkProjectImport     = checkProjectImport;
module.exports.finishProjectImport    = finishProjectImport;
module.exports.getProjectData         = getProjectData;
module.exports.saveProjectData        = saveProjectData;
module.exports.importProject          = importProject;
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
