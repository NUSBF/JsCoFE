
/*
 *  =================================================================
 *
 *    11.10.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.xia2.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CCP4go Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskXia2()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskXia2';
  this.name    = 'xia2';
  this.oname   = 'xia2';  // default output file name template
  this.title   = 'Automatic Image Processing with Xia-2';
  this.helpURL = './html/jscofe_task_xia2.html';
  this.nc_type = 'client-cloud';  // job may be run only on either client NC or
                                  // odinary NC if cloud storage is there

  this.imageDirPath   = '';       // path displayed in task dialog
  this.image_dir_path = '';       // translated path
  this.file_system    = 'local';  //  local/cloud

  // fields needed for CloudBrowser
  this.currentCloudPath = '';

  this.input_dtypes = [];  // no input data types for this task

  this.parameters = { // input parameters
    sec1  : { type     : 'section',
              title    : 'Parameters',
              open     : false,  // true for the section to be initially open
              position : [0,0,1,8],
              contains : {
                PROJECT : {
                      type      : 'string_',   // empty string not allowed
                      keyword   : 'project',
                      label     : 'Project name',
                      tooltip   : 'Project name for dataset identification',
                      iwidth    : 120,
                      value     : '',
                      default   : 'AUTOMATIC',
                      position  : [0,0,1,1]
                    },
                CRYSTAL : {
                      type      : 'string_',   // empty string not allowed
                      keyword   : 'crystal',
                      label     : 'Crystal name',
                      tooltip   : 'Crystal name for dataset identification',
                      iwidth    : 120,
                      value     : '',
                      default   : 'DEFAULT',
                      position  : [1,0,1,1]
                    }
              }
            },
    sec2  : { type     : 'section',
              title    : 'Advanced options',
              open     : false,  // true for the section to be initially open
              position : [1,0,1,8],
              contains : {
                PIPELINE : {
                        type     : 'combobox',
                        keyword  : 'pipeline',
                        label    : 'Processing pipeline',
                        tooltip  : 'Choose the image processing pipeline',
                        range    : ['2d|MOSFLM & Aimless (2d)',
                                    '3d|XDS & XSCALE (3d)',
                                    '3dii|XDS & XSCALE (3d) with indexing using peaks found from all images',
                                    'dials|DIALS & Aimless (3d)'
                                   ],
                        value    : 'dials',
                        position : [0,0,1,5]
                      },
                HATOM : {
                        type      : 'string_',   // empty string allowed
                        keyword   : 'atom',
                        label     : 'Heavy atom type',
                        tooltip   : 'Heavy atom giving anomalous scattering',
                        iwidth    : 30,
                        value     : '',
                        maxlength : 2,       // maximum input length
                        position  : [1,0,1,1]
                      },
                SMALL_MOLECULE : {
                        type      : 'checkbox',
                        label     : 'Small molecule',
                        tooltip   : 'If checked, makes processing in manner more ' +
                                    'suited to small molecule data.',
                        //iwidth    : 400,
                        value     : false,
                        position  : [2,0,1,3]
                      },
                SPACE_GROUP : {
                        type      : 'string_',   // empty string allowed
                        keyword   : 'space_group',
                        label     : 'Space group',
                        tooltip   : 'Custom space group, e.g. P21',
                        iwidth    : 80,
                        value     : '',
                        maxlength : 7,       // maximum input length
                        position  : [3,0,1,1]
                      },
                UNIT_CELL : {
                        type      : 'string_',   // empty string allowed
                        keyword   : 'unit_cell',
                        label     : '&nbsp;Unit cell:',
                        tooltip   : 'Comma-separated list of custom unit cell ' +
                                    'parameters given as a,b,c,&alpha;,&beta;,&gamma;',
                        iwidth    : 400,
                        value     : '',
                        position  : [3,4,1,1]
                      },
                TITLE1 : {
                        type      : 'label',  // just a separator
                        label     : '<h3>Resolution limits</h3>',
                        position  : [4,0,1,4]
                      },
                D_MIN : {
                      type      : 'real_', // blank value is allowed
                      keyword   : 'd_min',  // the real keyword for job input stream
                      label     : 'High resolution cut-off (&Aring;)',
                      tooltip   : 'High resolution cut-off for scaling and merging',
                      range     : [0.001,'*'], // may be absent (no limits) or must
                                               // be one of the following:
                                               //   ['*',max]  : limited from top
                                               //   [min,'*']  : limited from bottom
                                               //   [min,max]  : limited from top and bottom
                      value     : '',          // value to be paired with the keyword
                      position  : [5,0,1,1]    // [row,col,rowSpan,colSpan]
                    },
                CC_HALF : {
                      type      : 'real_', // blank value is allowed
                      keyword   : 'cc_half',  // the real keyword for job input stream
                      label     : 'Minimum <i>CC<sub>1/2</sub></i>',
                      tooltip   : 'If given, the resolution cut-off will be ' +
                                  'chosen such as to keep <i>CC<sub>1/2</sub></i> ' +
                                  'above the specified value',
                      range     : [0.001,'*'], // may be absent (no limits) or must
                                               // be one of the following:
                                               //   ['*',max]  : limited from top
                                               //   [min,'*']  : limited from bottom
                                               //   [min,max]  : limited from top and bottom
                      value     : '',          // value to be paired with the keyword
                      //default   : 0.5,
                      position  : [6,0,1,1]    // [row,col,rowSpan,colSpan]
                    },
                MISIGMA : {
                      type      : 'real_', // blank value is allowed
                      keyword   : 'misigma',  // the real keyword for job input stream
                      label     : 'Minimum merged <i>I/&sigma;<sub>I</sub></i>',
                      tooltip   : 'If given, the resolution cut-off will be ' +
                                  'chosen such as to keep merged ' +
                                  '<i>I/&sigma;<sub>I</sub></i> above the ' +
                                  'specified value',
                      range     : [0.001,'*'], // may be absent (no limits) or must
                                               // be one of the following:
                                               //   ['*',max]  : limited from top
                                               //   [min,'*']  : limited from bottom
                                               //   [min,max]  : limited from top and bottom
                      value     : '',          // value to be paired with the keyword
                      //default   : 1.0,
                      position  : [7,0,1,1]    // [row,col,rowSpan,colSpan]
                    },
                ISIGMA : {
                      type      : 'real_', // blank value is allowed
                      keyword   : 'isigma',  // the real keyword for job input stream
                      label     : 'Minimum unmerged <i>I/&sigma;<sub>I</sub></i>',
                      tooltip   : 'If given, the resolution cut-off will be ' +
                                  'chosen such as to keep unmerged ' +
                                  '<i>I/&sigma;<sub>I</sub></i> above the ' +
                                  'specified value',
                      range     : [0.001,'*'], // may be absent (no limits) or must
                                               // be one of the following:
                                               //   ['*',max]  : limited from top
                                               //   [min,'*']  : limited from bottom
                                               //   [min,max]  : limited from top and bottom
                      value     : '',          // value to be paired with the keyword
                      //default   : 0.25,
                      position  : [8,0,1,1]    // [row,col,rowSpan,colSpan]
                    }
              }
            }
  };

}

if (__template)
      TaskXia2.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskXia2.prototype = Object.create ( TaskTemplate.prototype );
TaskXia2.prototype.constructor = TaskXia2;


// ===========================================================================

TaskXia2.prototype.icon_small = function()  { return './images/task_xia2_20x20.svg'; }
TaskXia2.prototype.icon_large = function()  { return './images/task_xia2.svg';       }

TaskXia2.prototype.currentVersion = function()  { return 1; }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // reserved function name
  TaskXia2.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();
    div.grid.setWidth ( '100%' );
    div.task = this;

    this.setInputDataFields ( div.grid,0,dataBox,this );

    if ((!__local_service) && (!__cloud_storage))  {
      div.grid.setLabel (
          '<h2>Neither local service nor cloud storage are available</h2>' +
          'This task requires either local service running or cloud storage ' +
          'available to user, but neither are detected.' ,0,0,1,4 );
      return div;
    }

    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    div.grid.setLabel ( '<h2>Input Data</h2>',0,0,1,4 ).setFontItalic(true).setNoWrap();
    var row = 1;

    div.grid.setLabel ( 'Image directory:&nbsp;&nbsp;',row,0,1,1 )
            .setTooltip('Path to directory containing diffraction images')
            .setFontItalic(true).setFontBold(true).setNoWrap();

    div.image_select_btn  = div.grid.addButton ( 'Browse','./images/open_file.svg',row,1,1,1 );

    div.file_system = this.file_system;
    if (__local_service && __cloud_storage)  {
      div.source_select_ddn = new Dropdown();
      div.grid.addWidget ( div.source_select_ddn,row,2,1,1 );
      div.source_select_ddn.addItem ( 'local','','local',div.file_system=='local' );
      div.source_select_ddn.addItem ( 'cloud','','cloud',div.file_system=='cloud' );
      div.source_select_ddn.make();
      div.source_select_ddn.addOnChangeListener ( function(text,value){
        div.dirpath_txt.setValue ( '' );
        div.file_system = value;
      });
    } else  {
      div.source_select_ddn = null;
      if (__local_service)  div.file_system = 'local';
                      else  div.file_system = 'cloud';
      this.file_system = div.file_system;
      if (this.file_system=='local')  this.nc_type = 'client';
                                else  this.nc_type = 'ordinary';
    }

    var dirpath = this.imageDirPath;
    if (this.state==job_code.new)
      dirpath = '';
    div.dirpath_txt = div.grid.setInputText ( dirpath,row,3,1,6 )
                        .setWidth('99%').setReadOnly(true).setNoWrap(true);

    div.grid.setVerticalAlignment ( row,0,'middle' );
    div.grid.setVerticalAlignment ( row,1,'middle' );
    div.grid.setVerticalAlignment ( row,2,'middle' );
    div.grid.setVerticalAlignment ( row,3,'middle' );
    div.grid.setCellSize ( 'auto','', 0,0 );
    div.grid.setCellSize ( 'auto','', 0,1 );
    div.grid.setCellSize ( 'auto','', 0,2 );
    div.grid.setCellSize ( '95%' ,'', 0,3 );

    div.image_select_btn.addOnClickListener ( function(){
      div.image_select_btn.setDisabled ( true );
      if (div.source_select_ddn)
        div.source_select_ddn.setDisabled ( true );
      if (div.file_system=='local')  {
        localCommand ( nc_command.selectImageDir,{
            'dataType' : 'X-ray',
            'title'    : 'Select Directory with X-ray Diffraction Images'
          },'Select Directory',function(response){
            if (!response)
              return false;  // issue standard AJAX failure message
            if (response.status==nc_retcode.ok)  {
              if (response.data.directory!='')  {
                div.dirpath_txt.setValue ( response.data.directory );
              }
            } else  {
              new MessageBox ( 'Select Directory Error',
                'Directory selection failed:<p>' +
                '<b>stdout</b>:&nbsp;&nbsp;' + response.data.stdout + '<br>' +
                '<b>stderr</b>:&nbsp;&nbsp;' + response.data.stderr );
            }
            div.image_select_btn.setEnabled ( true );
            if (div.source_select_ddn)
              div.source_select_ddn.setEnabled ( true );
            return true;
          });
      } else  {
        new CloudFileBrowser ( div,div.task,2, function(){
          div.image_select_btn.setEnabled ( true );
          if (div.source_select_ddn)
            div.source_select_ddn.setEnabled ( true );
        });
      }
    });

    div.grid.setLabel ( '&nbsp;',row+1,0,1,1 );

    this.parameters.sec1.contains.PROJECT.default = this.project;

    this.layParameters ( div.grid,div.grid.getNRows()+1,0 );

    return div;

  }

  /*
  TaskXia2.prototype.disableInputWidgets = function ( widget,disable_bool ) {
    TaskTemplate.prototype.disableInputWidgets.call ( this,widget,disable_bool );
    if (widget.hasOwnProperty('upload'))  {
      widget.upload.button.setDisabled ( disable_bool );
      if (widget.upload.link_button)
        widget.upload.link_button.setDisabled ( disable_bool );
    }
  }
  */


  TaskXia2.prototype.setSelectedCloudFiles = function ( inputPanel,file_items )  {
    if (file_items.length>0)  {
      var selPath = 'cloudstorage::/' + this.currentCloudPath;
      if ((file_items[0].name!='..') && (file_items[0]._type!='FacilityFile'))
        selPath += '/' + file_items[0].name;
      inputPanel.dirpath_txt.setValue ( selPath );
    }
  }


  // reserved function name
  TaskXia2.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    var msg   = '';  // Ok if stays empty

    if (__local_service || __cloud_storage)  {
      this.file_system = inputPanel.file_system;
      if (this.file_system=='local')  this.nc_type = 'client';
                                else  this.nc_type = 'ordinary';
      this.imageDirPath   = inputPanel.dirpath_txt.getValue();
      //if (this.imageDirPath.endsWith)
      //this.image_dir_path = this.imageDirPath;
      if (this.imageDirPath.length<=0)
        msg = '<b><i>Path to directory with X-ray images is not specified</i></b>';
    }

    msg += TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    return  msg;

  }

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskXia2.prototype.customDataClone = function ( task )  {
    this.uname = '';
  }

  // reserved function name
  //TaskXia2.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var path  = require('path');

  var conf  = require('../../js-server/server.configuration');
  var fcl   = require('../../js-server/server.fe.facilities');
  var prj   = require('../../js-server/server.fe.projects');
  var utils = require('../../js-server/server.utils');

  TaskXia2.prototype.makeInputData = function ( login,jobDir )  {

    if (this.file_system=='local')  {

      this.image_dir_path = this.imageDirPath;
      this.nc_type = 'client';  // job may be run only on client NC

    } else  {

      this.image_dir_path = '';
      var lst = this.imageDirPath.split('/');
      if (lst.length>2)  {
        if (lst[0]=='cloudstorage::')  {
          var cloudMounts = fcl.getUserCloudMounts ( login );
          var cm = null;
          for (var i=0;(i<cloudMounts.length) && (!cm);i++)
            if (cloudMounts[i][0]==lst[1])
              cm = cloudMounts[i][0];
          if (cm)
            this.image_dir_path = path.join ( cloudMounts[i][1],lst.slice(2).join('/') );
        }
      }
      this.nc_type = 'ordinary';  // job may be run on any NC

    }

    var jobDataPath = prj.getJobDataPath ( login,this.project,this.id );
    utils.writeObject ( jobDataPath,this );

    __template.TaskTemplate.prototype.makeInputData.call ( this,login,jobDir );

  }


  TaskXia2.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xia2', exeType, jobDir, this.id];
  }

  module.exports.TaskXia2 = TaskXia2;

}
