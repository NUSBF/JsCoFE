
/*
 *  =================================================================
 *
 *    25.06.18   <--  Date of Last Modification.
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
  this.nc_type = 'client';  // job may be run only on client NC

  this.imageDirPath = '';

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

TaskXia2.prototype.currentVersion = function()  { return 0; }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // reserved function name
  TaskXia2.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();
    div.grid.setWidth ( '100%' );

    this.setInputDataFields ( div.grid,0,dataBox,this );

    if (!__local_service)  {
      div.grid.setLabel ( '<h2>Local service not running</h2>' +
          'This task can be used only via local service.' ,0,0,1,4 );
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
    div.grid.setVerticalAlignment ( row,0,'middle' );

    div.image_select_btn = div.grid.addButton ( 'Browse','./images/open_file.svg',row,1,1,1 );
    var dirpath = this.imageDirPath;
    if (this.state==job_code.new)
      dirpath = '';
    div.dirpath_txt = div.grid.setInputText ( dirpath,row,2,1,6 )
                        .setWidth('99%').setReadOnly(true).setNoWrap(true);
    div.grid.setVerticalAlignment ( row,1,'middle' );
    div.grid.setVerticalAlignment ( row,2,'middle' );
    div.grid.setCellSize ( 'auto','', 0,0 );
    div.grid.setCellSize ( 'auto','', 0,1 );
    div.grid.setCellSize ( '95%' ,'', 0,2 );

    div.image_select_btn.addOnClickListener ( function(){
      div.image_select_btn.setDisabled ( true );
      localCommand ( nc_command.selectDir,{
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
          return true;
        });
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

  // reserved function name
  TaskXia2.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    var msg   = '';  // Ok if stays empty
    if (__local_service)  {
      this.imageDirPath = inputPanel.dirpath_txt.getValue();
      if (this.imageDirPath.length<=0)
        msg = '<b><i>Path to directory with X-ray images is not specified</i></b>';
    }

    msg += TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    return  msg;

  }

  /*
  //  This function is called when task is finally sent to FE to run. Should
  // execute function given as argument, or issue an error message if run
  // should not be done.
  TaskXia2.prototype.doRun = function ( inputPanel,run_func )  {
  var files  = [inputPanel.mtz_select  ['fsel'].getFiles()];
  var sfiles = inputPanel.seq_select[0]['fsel'].getFiles();
  var cfiles = inputPanel.coor_select  ['fsel'].getFiles();

    this.files = ['','',''];
    if (files.length>0)
      this.files[0] = files[0][0].name;
    if (sfiles.length>0)  {
      files.push ( sfiles );
      this.files[1] = sfiles[0].name;
    }
    if (cfiles.length>0)  {
      files.push ( cfiles );
      this.files[2] = cfiles[0].name;
    }

    if (files[0].length<0)  {
      new MessageBox ( 'Stop run','Task cannot be run as no reflection<br>' +
                                  'data are given' );
    } else  {
      new UploadDialog ( 'Upload data',files,inputPanel.customData,true,
                          function(returnCode){
        if (!returnCode)
          run_func();
        else
          new MessageBox ( 'Stop run','Task cannot be run due to upload ' +
                                'errors:<p><b><i>' + returnCode + '</i></b>' );
      });
    }

  }
  */


  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskXia2.prototype.customDataClone = function ( task )  {
    this.uname = '';
  }

  // reserved function name
  //TaskXia2.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskXia2.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xia2', exeType, jobDir, this.id];
  }

  module.exports.TaskXia2 = TaskXia2;

}
