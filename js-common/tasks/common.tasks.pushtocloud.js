
/*
 *  =================================================================
 *
 *    08.07.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.xds.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Push Data to Cloud Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, J. Wills 2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.xia2' );
  __cmd      = require ( '../common.commands' );
}


// ===========================================================================

function TaskPushToCloud()  {

  if (__template)  __template.TaskXia2.call ( this );
             else  TaskXia2.call ( this );

  this._type       = 'TaskPushToCloud';
  this.name        = 'push data to cloud';
  this.setOName ( '*' );        // default output file name template
  this.title       = 'Push Data to Cloud';
  this.autoRunId   = '';
  this.nc_type     = 'client';  // job may be run only on client NC

  this.maxNDirs    = 10;        // maximum number of input directories
  this.hdf5_range  = '';        // for processing HDF5 files in blocks
  this.datatype    = 'images';  //  images/hdf5
  this.file_system = 'local';   //  local/cloud

  this.parameters  = {  // input parameters
    sec1: { type     : 'section',
            title    : '',    // if empty then the section is not foldable
            open     : true,  // true for the section to be initially open
            position : [1,0,1,5],
            contains : {
              FOLDER : {
                    type      : 'string_',   // empty string allowed
                    keyword   : 'folder',
                    label     : 'Destination folder name',
                    tooltip   : 'Folder name to accept data. If necessary, the folder '   +
                                'will be created. New files will replace existing files ' +
                                'with same name if found in the destination folder',
                    iwidth    : 120,
                    value     : '',
                    default   : '',
                    position  : [0,0,1,1]
                  }
              }
    }
  };

  this.saveDefaultValues ( this.parameters );

}

// if (__template)
//       TaskPushToCloud.prototype = Object.create ( __template.TaskXia2.prototype );
// else  TaskPushToCloud.prototype = Object.create ( TaskXia2.prototype );
// TaskPushToCloud.prototype.constructor = TaskPushToCloud;

if (__template)
  __cmd.registerClass ( 'TaskPushToCloud',TaskPushToCloud,__template.TaskXia2.prototype );
else    registerClass ( 'TaskPushToCloud',TaskPushToCloud,TaskXia2.prototype );


// ===========================================================================

TaskPushToCloud.prototype.icon                = function() { return 'task_pushtocloud'; }
TaskPushToCloud.prototype.clipboard_name      = function() { return '"PushToCloud"';    }
// TaskPushToCloud.prototype.requiredEnvironment = function() { return ['CCP4','XDS_home']; }

// TaskPushToCloud.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskPushToCloud.prototype.currentVersion      = function() {
let version = 0;
  if (__template)
        return  version + __template.TaskXia2.prototype.currentVersion.call ( this );
  else  return  version + TaskXia2.prototype.currentVersion.call ( this );
}

// default post-job cleanup to save disk space
TaskPushToCloud.prototype.cleanJobDir = function ( jobDir )  {}

TaskPushToCloud.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['push','data','cloud'] );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskPushToCloud.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'pushes data to Cloud storage';
  };

  TaskPushToCloud.prototype.makeInputPanel = function ( dataBox )  {
    let div = TaskXia2.prototype.makeInputPanel.call ( this,dataBox );
    div.input_title_lbl.setText ( '<h2>Data to push</h2' );
    div.grid1.hideRow(0);
    div.grid1.hideRow(1);
    // div.grid1.deleteRow(1);
    // div.grid1.deleteRow(0);
    // delete div.grid2;
    return div;
  }


  TaskPushToCloud.prototype.layParameters = function ( grid,row,col )  {
    this.parameters.sec1.contains.FOLDER.default = this.project + '_' + 
                                                   padDigits(this.id,4);
    TaskXia2.prototype.layParameters.call ( this,grid,row,col );
  }

  TaskPushToCloud.prototype.layDirLine = function ( inputPanel,dirNo,row )  {
    let dir_input = TaskXia2.prototype.layDirLine.call ( this,inputPanel,dirNo,row );
    dir_input.label.setText ( dir_input.label.getText().replace('Image','Data') );
    if (inputPanel.datatype=='images')  {
      if ('sectors_inp' in dir_input)
        for (let i=0;i<dir_input.sectors_inp.length;i++)  {
          dir_input.sectors_inp[i].setReadOnly ( true );
          dir_input.sectors_inp[i].setTooltip  ( 'Image range for your information' );
        }
    } else  {
      dir_input.label.setVisible ( false );
      if (('hdf5_range' in dir_input) && dir_input.hdf5_range)
        dir_input.hdf5_range.setVisible ( false );
    }
    return dir_input;
  }

  // TaskPushToCloud.prototype.customDataClone = function ( cloneMode,task )  {
  //   TaskXia2.prototype.customDataClone.call ( this,cloneMode,task );
  //   this.autoRunId  = '';
  //   this.autoRunId0 = '';
  //   return;
  // }


  // hotButtons return list of buttons added in JobDialog's toolBar.
  // TaskPushToCloud.prototype.hotButtons = function() {
  //   return [CloudImportHotButton()];
  // }

  TaskPushToCloud.prototype.collectInput = function ( inputPanel )  {
    let input_msg = TaskXia2.prototype.collectInput.call ( this,inputPanel );
    let regex     = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(this.parameters.sec1.contains.FOLDER.value))
      input_msg += '|<b><i>Folder name must obey Unix specifications</i></b>';
    return input_msg;
  }

  // reserved function name
  //TaskPushToCloud.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  const path  = require('path');
  const conf  = require('../../js-server/server.configuration');
  const user  = require('../../js-server/server.fe.user');
  const utils = require('../../js-server/server.utils');

  TaskPushToCloud.prototype.makeInputData = function ( loginData,jobDir )  {
  // this function prepares fetch metadata for NC
    
    let fetch_meta = {
      login       : loginData.login,
      cloudrun_id : '',
      api_url     : '',
      mount_name  : ''
    };
    
    let uData = user.readUserData ( loginData );
    if (uData && ('cloudrun_id' in uData))
        fetch_meta.cloudrun_id = uData.cloudrun_id;

    let fe_config = conf.getFEConfig();
    fetch_meta.api_url = fe_config.getDataLinkUrl();
    fetch_meta.mount_name = fe_config.getDataLinkMountName();
    
    // write fetch_meta in jobd directory on FE; it will travel to NC along
    // with all other data
    utils.writeObject ( path.join(jobDir,'__fetch_meta.json'),fetch_meta );

    // do not forget to call the original function
    __template.TaskXia2.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskPushToCloud.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.pushtocloud', jobManager, jobDir, this.id];
  }

  module.exports.TaskPushToCloud = TaskPushToCloud;

}
