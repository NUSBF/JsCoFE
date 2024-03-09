
/*
 *  =================================================================
 *
 *    09.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.xds.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  XDS Run Preparation Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.xia2' );


// ===========================================================================

function TaskXDS()  {

  if (__template)  __template.TaskXia2.call ( this );
             else  TaskXia2.call ( this );

  this._type   = 'TaskXDS';
  this.name    = 'xds';
  this.setOName ( 'xds' );  // default output file name template
  this.title   = 'Image Processing with XDS';

  this.maxNDirs = 1; // maximum number of input directories

  this.parameters = { // input parameters
    sec1  : { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,8],
              contains : {
              }
            }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
      TaskXDS.prototype = Object.create ( __template.TaskXia2.prototype );
else  TaskXDS.prototype = Object.create ( TaskXia2.prototype );
TaskXDS.prototype.constructor = TaskXDS;


// ===========================================================================

TaskXDS.prototype.icon                = function() { return 'task_xds'; }
TaskXDS.prototype.clipboard_name      = function() { return '"XDS"';    }
TaskXDS.prototype.requiredEnvironment = function() { return ['CCP4','XDS_home']; }

// TaskXDS.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskXDS.prototype.currentVersion      = function() {
let version = 0;
  if (__template)
        return  version + __template.TaskXia2.prototype.currentVersion.call ( this );
  else  return  version + TaskXia2.prototype.currentVersion.call ( this );
}

// default post-job cleanup to save disk space
TaskXDS.prototype.cleanJobDir = function ( jobDir )  {}

TaskXDS.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['xds','image','processing'] );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskXDS.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'performs X-ray diffraction data processing';
  };

  TaskXDS.prototype.layDirLine = function ( inputPanel,dirNo,row )  {
    let dir_input = TaskXia2.prototype.layDirLine.call ( this,inputPanel,dirNo,row );
    if ('sectors_inp' in dir_input)
      for (let i=0;i<dir_input.sectors_inp.length;i++)  {
        dir_input.sectors_inp[i].setReadOnly ( true );
        dir_input.sectors_inp[i].setTooltip  ( 'Image range for your information' );
      }
    return dir_input;
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskXDS.prototype.hotButtons = function() {
    return [XDS3HotButton()];
  }

  // reserved function name
  //TaskXDS.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  const path  = require('path');

  const conf  = require('../../js-server/server.configuration');
  const fcl   = require('../../js-server/server.fe.facilities');
  const prj   = require('../../js-server/server.fe.projects');
  const utils = require('../../js-server/server.utils');

  // TaskXDS.prototype.getNCores = function ( ncores_available )  {
  // // This function should return the number of cores, up to ncores_available,
  // // that should be reported to a queuing system like SGE or SLURM, in
  // // case the task spawns threds or processes bypassing the queuing system.
  // // It is expected that the task will not utilise more cores than what is
  // // given on input to this function.
  //   return ncores_available;
  // }

  // TaskXDS.prototype.makeInputData = function ( loginData,jobDir )  {

  //   var imageDirMeta = [];
  //   if (this.file_system=='local')  {

  //     imageDirMeta = this.imageDirMeta;
  //     this.nc_type = 'client';  // job may be run only on client NC

  //   } else  {

  //     var cloudMounts = fcl.getUserCloudMounts ( loginData );
  //     for (var i=0;i<this.imageDirMeta.length;i++)  {
  //       imageDirMeta.push ( this.imageDirMeta[i] );
  //       var lst = imageDirMeta[i].path.split('/');
  //       if (lst.length>2)  {
  //         if (lst[0]=='cloudstorage::')  {
  //           var cm = null;
  //           for (var j=0;(j<cloudMounts.length) && (!cm);j++)
  //             if (cloudMounts[j][0]==lst[1])
  //               cm = cloudMounts[j];
  //           if (cm)
  //             imageDirMeta[i].path = path.join ( cm[1],lst.slice(2).join('/') );
  //         }
  //       }
  //     }
  //     this.nc_type = 'ordinary';  // job may be run on any NC

  //   }

  //   utils.writeObject ( prj.getJobDataPath(loginData,this.project,this.id),this );

  //   utils.writeObject ( path.join(prj.getInputDirPath(jobDir),'__imageDirMeta.json'),
  //                       {'imageDirMeta':imageDirMeta} );

  //   __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  // }


  TaskXDS.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xds', jobManager, jobDir, this.id];
  }

  module.exports.TaskXDS = TaskXDS;

}
