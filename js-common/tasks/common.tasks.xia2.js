
/*
 *  =================================================================
 *
 *    12.07.22   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.xia2.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Xia-2 Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2022
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskXia2()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskXia2';
  this.name    = 'xia2';
  this.setOName ( 'xia2' );  // default output file name template
  this.title   = 'Automatic Image Processing with Xia-2';
  this.nc_type = 'client-storage';  // job may be run only on either client NC or
                                    // ordinary NC if cloud storage is there

  this.imageDirMeta = [];       // paths, ranges and sectors
  this.hdf5_range   = '';       // for processing HDF5 files in blocks
  this.datatype     = 'images'; //  images/hdf5
  this.file_system  = 'local';  //  local/cloud

  // fields needed for CloudBrowser
  this.currentCloudPath = '';

  this.input_dtypes = [];  // no input data types for this task

  this.parameters = { // input parameters
    sec1  : { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,8],
              contains : {
                PROJECT : {
                      type      : 'string_',   // empty string allowed
                      keyword   : 'project',
                      label     : 'Project name',
                      tooltip   : 'Project name for dataset identification ' +
                                  '(must start with a letter, no spaces)',
                      iwidth    : 120,
                      value     : '',
                      default   : 'AUTOMATIC',
                      position  : [0,0,1,3]
                    },
                CRYSTAL : {
                      type      : 'string_',   // empty string not allowed
                      keyword   : 'crystal',
                      label     : 'Crystal name',
                      tooltip   : 'Crystal name for dataset identification',
                      iwidth    : 120,
                      value     : '',
                      default   : 'DEFAULT',
                      position  : [1,0,1,3]
                    },
                HATOM : {
                      type      : 'string_',   // empty string allowed
                      keyword   : 'atom',
                      label     : 'Heavy atom type',
                      tooltip   : 'Heavy atom giving anomalous scattering',
                      iwidth    : 40,
                      value     : '',
                      maxlength : 2,       // maximum input length
                      position  : [2,0,1,1]
                    },
                HATOM_LBL : {
                      type      : 'label',  // just a separator
                      label     : '<span style="color:maroon;"><i>(must be ' +
                                  'specified for generating anomalous data)' +
                                  '</i></span>',
                      position  : [2,3,1,2]
                    }
              }
            },
    sec2  : { type     : 'section',
              title    : 'Advanced options',
              open     : false,  // true for the section to be initially open
              position : [1,0,1,8],
              contains : {
                PIPELINE : {
                        type      : 'combobox',
                        keyword   : 'pipeline',
                        label     : 'Processing pipeline',
                        tooltip   : 'Choose the image processing pipeline',
                        range     : ['2d|MOSFLM & Aimless (2d)',
                                     '3d|XDS & XSCALE (3d)',
                                     '3dii|XDS & XSCALE (3d) with indexing using peaks found from all images',
                                     'dials|DIALS & Aimless (3d)'
                                    ],
                        value     : 'dials',
                        position  : [0,0,1,5]
                      },
                PLUGIN : {
                        type      : 'combobox',
                        keyword   : 'plugin',
                        label     : 'Custom plugin',
                        tooltip   : 'Choose the custom Xia-2 plugin to use',
                        range     : ['none|None',
                                     'durin|Durin'
                                    ],
                        value     : 'none',
                        position  : [1,0,1,5]
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

  if (!__template)  {
    //console.log ( __environ_server );
    if (__environ_server.indexOf('Xia2_durin')<0)
      delete this.parameters.sec2.contains.PLUGIN;
  }

}

if (__template)
      TaskXia2.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskXia2.prototype = Object.create ( TaskTemplate.prototype );
TaskXia2.prototype.constructor = TaskXia2;


// ===========================================================================

TaskXia2.prototype.icon = function()  { return 'task_xia2'; }

TaskXia2.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

TaskXia2.prototype.currentVersion = function()  {
  var version = 2;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// default post-job cleanup to save disk space
//TaskXia2.prototype.cleanJobDir = function ( jobDir )  {}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskXia2.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'performs X-ray diffraction data processing';
    };
  

  TaskXia2.prototype.disableDirectoryInput = function ( inputPanel,disable_bool ) {
    for (var i=0;i<inputPanel.dir_input.length;i++)
      inputPanel.dir_input[i].browse_btn.setDisabled ( disable_bool );
    if (inputPanel.source_select_ddn)
      inputPanel.source_select_ddn.setDisabled ( disable_bool );
    if (inputPanel.datatype_ddn)
      inputPanel.datatype_ddn.setDisabled ( disable_bool );
  }

  TaskXia2.prototype.collectRangesInput = function ( inputPanel ) {
    for (var i=0;i<inputPanel.dir_input.length;i++)
      if (inputPanel.dir_input[i].dir_path.getValue()!='')  {
        var sectors_inp = inputPanel.dir_input[i].sectors_inp;
        var sectors     = inputPanel.imageDirMeta[i].sectors;
        for (var j=0;j<sectors_inp.length;j++)
          sectors[j].ranges_inp = sectors_inp[j].getValue();
      }
  }

  TaskXia2.prototype.layDirLine = function ( inputPanel,dirNo,row )  {
    var dir_input = {};
    var dirpath   = '';

    if (dirNo<inputPanel.imageDirMeta.length)
      dirpath = inputPanel.imageDirMeta[dirNo].path;

    if (!dirpath)
      this.hdf5_range = '';

    if (inputPanel.datatype=='images')  {
      var dlabel = 'directory';
      if (dirNo>0)
        dlabel = 'directory #' + (dirNo+1);
      dir_input.label = inputPanel.grid1.setLabel (
            'Image '+dlabel+':&nbsp;&nbsp;',row,0,1,1 )
                .setTooltip('Path to '+dlabel+' containing diffraction images')
                .setFontItalic(true).setFontBold(true).setNoWrap();
    } else  {
      dir_input.label = inputPanel.grid1.setLabel (
            'Master HDF5 file:&nbsp;&nbsp;',row,0,1,1 )
                .setTooltip('Path to master file of HDF5 set of diffraction images')
                .setFontItalic(true).setFontBold(true).setNoWrap();
      if (dirpath)  {
        inputPanel.grid1.setLabel (
            'Image range and block size:',row+1,0,1,2 )
                  .setTooltip('Optional specification of image range and block size')
                  .setFontItalic(true).setFontBold(true).setNoWrap();
        dir_input.hdf5_range = inputPanel.grid1.setInputText ( this.hdf5_range,row+1,1,1,1 )
                 .setStyle ( 'text','','e.g., 1:9600:1200 or leave blank',
                             'Use processing in blocks if the dataset is ' +
                             'excessively large. Format:  start:end:block' )
                 .setWidth('400px').setNoWrap();
      }
    }

    dir_input.browse_btn = inputPanel.grid1.setButton (
                                'Browse',image_path('open_file'), row,1,1,1 )
                                          .setWidth ( '120px' );
    dir_input.dir_path = inputPanel.grid1.setInputText ( dirpath,row,2,1,1 )
                            .setWidth('100%').setReadOnly(true).setNoWrap();

    if ((dirNo>0) && (dirNo>=inputPanel.imageDirMeta.length))
      dir_input.dir_path.setStyle ( '','','not used',
                  'Use "Browse" button to choose directory with image files, ' +
                  'or leave empty' );
    else
      dir_input.dir_path.setTooltip ( 'Use "Browse" button to choose ' +
                                      'directory with image files' );

    dir_input.remove_btn = inputPanel.grid1.setImageButton (
                            image_path('close'), '18px','18px', row,3, 1,1 );

    dir_input.sectors_inp = [];
    if (dirNo<inputPanel.imageDirMeta.length)  {
      var sectors = inputPanel.imageDirMeta[dirNo].sectors;
      if (sectors.length>0)  {
        dir_input.sectors_grid = inputPanel.grid1.setGrid ( '',row+1,2,1,1 );
        for (var i=0;i<sectors.length;i++)  {
          dir_input.sectors_grid.setLabel ( sectors[i].template,i,0,1,1 )
                                .setFontItalic(true)
                                .setTooltip ( 'Image files template' )
                                .setNoWrap();
          var ranges = '';
          for (var j=0;j<sectors[i].ranges.length;j++)  {
            if (ranges!='')  ranges += ',';
            ranges += sectors[i].ranges[j][0] + '-' + sectors[i].ranges[j][1];
          }
          if (!('ranges_inp' in sectors[i]))
            sectors[i].ranges_inp = ranges;
          dir_input.sectors_inp.push (
            dir_input.sectors_grid.setInputText ( sectors[i].ranges_inp,i,1,1,1 )
                                  .setWidth('99%').setNoWrap()
          );
          dir_input.sectors_inp[i].setStyle ( '','',
                'not used; available range(s) ' + ranges,
                'Give a comma-separated list of desirable image ranges (e.g., ' +
                '"1-10,20-30"), or leave empty if the corresponding file ' +
                'template should not be used. Available range(s) include"' +
                ranges + '"' );
          dir_input.sectors_grid.setVerticalAlignment ( i,0,'middle' );
          dir_input.sectors_grid.setVerticalAlignment ( i,1,'middle' );
          dir_input.sectors_grid.setCellSize ( '3%'  ,'', i,0 );
          dir_input.sectors_grid.setCellSize ( 'auto','', i,1 );
        }
        dir_input.sectors_grid.setLabel ( '&nbsp;',sectors.length,0,1,1 );
      }
    }

    inputPanel.grid1.setVerticalAlignment ( row,0,'middle' );
    inputPanel.grid1.setVerticalAlignment ( row,1,'middle' );
    inputPanel.grid1.setVerticalAlignment ( row,2,'middle' );
    //inputPanel.grid1.setVerticalAlignment ( row,3,'middle' );
    inputPanel.grid1.setCellSize ( 'auto','', row,0 );
    inputPanel.grid1.setCellSize ( 'auto','', row,1 );
    inputPanel.grid1.setCellSize ( '95%' ,'', row,2 );
    //inputPanel.grid1.setCellSize ( 'auto','', row,3 );

    var ndirs = inputPanel.imageDirMeta.length;
    if ((ndirs<=1) || ((dirNo==ndirs) && (dirpath=='')))
      dir_input.remove_btn.setVisible ( false );

    return dir_input;

  }


  TaskXia2.prototype.layDirectoryInput = function ( inputPanel )  {

    var row   = inputPanel.drow;
    var row0  = row + inputPanel.dir_input.length;
    var ndirs = inputPanel.imageDirMeta.length;
    if ((ndirs>0) && (inputPanel.datatype=='images'))  {
      if (inputPanel.imageDirMeta[ndirs-1].path!='')
        ndirs++;
    } else {
      ndirs = 1;
    }

    inputPanel.grid1.truncateRows ( row );

    inputPanel.dir_input = [];
    var task = this;

    for (var i=0;i<ndirs;i++)  {

      inputPanel.dir_input.push ( this.layDirLine(inputPanel,i,row) );

      (function(dirNo){

        var dinput = inputPanel.dir_input[dirNo];

        dinput.remove_btn.addOnClickListener ( function(){
          task.collectRangesInput ( inputPanel );
          inputPanel.imageDirMeta.splice ( dirNo,1 );
          window.setTimeout ( function(){
            task.layDirectoryInput ( inputPanel );
          },0);
        });

        dinput.browse_btn.addOnClickListener ( function(){

          task.disableDirectoryInput ( inputPanel,true );

          if (inputPanel.file_system=='local')  {

            if (inputPanel.datatype=='images')  {
              localCommand ( nc_command.selectImageDir,{
                  'dataType' : 'X-ray',
                  'title'    : 'Select Directory with X-ray Diffraction Images'
                },'Select Directory',function(response){
                  if (!response)
                    return false;  // issue standard AJAX failure message
                  if (response.status==nc_retcode.ok)  {
                    if (response.data.path!='')  {
                      //alert ( JSON.stringify(response.data) );
                      task.collectRangesInput ( inputPanel );
                      if (dirNo<inputPanel.imageDirMeta.length)
                            inputPanel.imageDirMeta[dirNo] = response.data;
                      else  inputPanel.imageDirMeta.push ( response.data );
                      window.setTimeout ( function(){
                        task.layDirectoryInput ( inputPanel );
                      },0);
                    }
                  } else  {
                    new MessageBox ( 'Select Directory Error',
                      'Directory selection failed:<p>' +
                      '<b>stdout</b>:&nbsp;&nbsp;' + response.data.stdout + '<br>' +
                      '<b>stderr</b>:&nbsp;&nbsp;' + response.data.stderr );
                  }
                  task.disableDirectoryInput ( inputPanel,false );
                  return true;
                });
            } else  {  //  datatype=='hdf5'
              localCommand ( nc_command.selectFile,{
                  'dataType' : 'HDF5',
                  'filters'  : 'HDF5 files (*.h5);All files (*)',
                  'title'    : 'Select Master HDF5 file'
                },'Select Master HDF5 file',function(response){
                  if (!response)
                    return false;  // issue standard AJAX failure message
                  if (response.status==nc_retcode.ok)  {
                    if (response.data.file!='')  {
                      inputPanel.imageDirMeta = [{
                        'path'    : response.data.file,
                        'sectors' : []
                      }]
                      window.setTimeout ( function(){
                        task.layDirectoryInput ( inputPanel );
                      },0);
                    }
                  } else  {
                    new MessageBox ( 'Select File Error',
                      'File selection failed:<p>' +
                      '<b>stdout</b>:&nbsp;&nbsp;' + response.data.stdout + '<br>' +
                      '<b>stderr</b>:&nbsp;&nbsp;' + response.data.stderr );
                  }
                  task.disableDirectoryInput ( inputPanel,false );
                  return true;
                });
            }

          } else if (inputPanel.datatype=='images')  {

            new CloudFileBrowser ( inputPanel,task,2,[],
              function(dirmeta){
                //alert ( JSON.stringify(dirmeta) );
                task.collectRangesInput ( inputPanel );
                dirmeta.path = 'cloudstorage::/' + dirmeta.path;
                if (dirNo<inputPanel.imageDirMeta.length)
                      inputPanel.imageDirMeta[dirNo] = dirmeta;
                else  inputPanel.imageDirMeta.push ( dirmeta );
                window.setTimeout ( function(){
                  task.layDirectoryInput ( inputPanel );
                },0);
                return 0;  // do not close the browser
              },
              function(){
                task.disableDirectoryInput ( inputPanel,false );
              });

          } else  {

            new CloudFileBrowser ( inputPanel,task,0,[],
              function(file_items){
                //alert ( JSON.stringify(file_items) );
                if (file_items.length>0)  {
                  var cfpath = 'cloudstorage::/' + task.currentCloudPath + '/' + file_items[0].name;
                  inputPanel.imageDirMeta = [{
                    'path'    : cfpath,
                    'sectors' : []
                  }]
                  window.setTimeout ( function(){
                    task.layDirectoryInput ( inputPanel );
                  },0);
                }
                return 1;  // close the browser
              },
              function(){
                task.disableDirectoryInput ( inputPanel,false );
              });
          }

        });

      }(i))

      row += 2;

    }

  }


  // reserved function name
  TaskXia2.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();
    div.grid.setWidth ( '100%' );
    div.task = this;

    div.imageDirMeta = this.imageDirMeta;  // paths displayed in task dialog
    div.file_system  = this.file_system;   //  local/cloud
    div.datatype     = this.datatype;      //  images/hdf5
//    alert ( div.datatype );

    this.setInputDataFields ( div.grid,0,dataBox,this );

    if ((!__local_service) && (!__cloud_storage))  {
      div.grid.setLabel (
          '<h2>Neither local service nor cloud storage are available</h2>' +
          'This task requires either local service running or cloud storage ' +
          'available to user, but neither are detected.' ,0,0,1,4 );
      return div;
    }

    /*
    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );
    */
    if ((this.state!=job_code.new) && (this.state!=job_code.running))
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    div.grid.setLabel ( '<h2>Input Data</h2>',0,0,1,4 ).setFontItalic(true).setNoWrap();
    div.grid1 = div.grid.setGrid ( '',1,0,1,4 );
    div.grid.setLabel ( '&nbsp;',2,0,1,4 );

    var row = 0;
    div.grid2 = div.grid1.setGrid ( '-compact',row,0,1,4 );

    div.grid2.setLabel ( 'Look for&nbsp;&nbsp;',0,0,1,1 )
             .setTooltip('Choose "X-ray images" if your experimental data is ' +
                         'presented in form of directories with image files, ' +
                         'and "HDF5 datasets" if images are packed in .h5 ' +
                         'containers.' )
             .setFontItalic(true).setFontBold(true).setNoWrap();
    div.datatype_ddn = new Dropdown();
    div.grid2.addWidget ( div.datatype_ddn,0,1,1,1 );
    div.datatype_ddn.addItem ( 'X-ray images' ,'','images',div.datatype=='images' );
    div.datatype_ddn.addItem ( 'HDF5 datasets','','hdf5'  ,div.datatype=='hdf5'     );
    div.datatype_ddn.make();
    div.grid2.setVerticalAlignment ( 0,0,'middle' );
    div.grid2.setVerticalAlignment ( 0,1,'middle' );
    div.datatype_ddn.addOnChangeListener ( function(text,value){
      div.imageDirMeta = [];    // paths displayed in task dialog
      div.dir_path     = [];
      div.datatype     = value;
      div.task.layDirectoryInput ( div );
    });
    div.datatype_ddn.setWidth ( '180px' );

    if (__local_service && __cloud_storage)  {

      div.grid2.setLabel ( 'in&nbsp;&nbsp;',0,2,1,1 )
               .setTooltip('Choose "local" if diffraction images are found in ' +
                           'your computer, and choose "cloud" if images are ' +
                           'stored in cloud.' )
               .setFontItalic(true).setFontBold(true).setNoWrap();
      div.source_select_ddn = new Dropdown();
      div.grid2.addWidget ( div.source_select_ddn,0,3,1,1 );
      div.source_select_ddn.addItem ( 'local file system','','local',div.file_system=='local' );
      div.source_select_ddn.addItem ( 'cloud storage'    ,'','cloud',div.file_system=='cloud' );
      div.source_select_ddn.make();
      div.source_select_ddn.addOnChangeListener ( function(text,value){
        div.imageDirMeta = [];    // paths displayed in task dialog
        div.dir_path     = [];
        div.file_system  = value;
        div.task.layDirectoryInput ( div );
      });
      div.source_select_ddn.setWidth ( '180px' );

      div.grid2.setVerticalAlignment ( 0,2,'middle' );
      div.grid2.setVerticalAlignment ( 0,3,'middle' );

    } else  {
      div.source_select_ddn = null;
      if (__local_service)  div.file_system = 'local';
                      else  div.file_system = 'cloud';
      this.file_system = div.file_system;
      if (this.file_system=='local')  this.nc_type = 'client';
                                else  this.nc_type = 'ordinary';
    }

    div.grid1.setLabel ( '&nbsp;',row+1,0,1,1 )

    div.drow      = row+2;
    div.dir_input = [];
    this.layDirectoryInput ( div );

    var defprj = this.project.replace(/[^a-zA-Z0-9]/g, '_');
    if (('0'<=defprj[0]) && (defprj[0]<='9'))
      defprj = 'P' + defprj;
    this.parameters.sec1.contains.PROJECT.default = defprj;

    this.layParameters ( div.grid,div.grid.getNRows()+1,0 );

    return div;

  }


  // reserved function name
  TaskXia2.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    var msg = '';  // Ok if stays empty

    if (__local_service || __cloud_storage)  {

      this.datatype    = inputPanel.datatype;
      this.file_system = inputPanel.file_system;
      if (this.file_system=='local')  this.nc_type = 'client';
                                else  this.nc_type = 'ordinary';

      this.collectRangesInput ( inputPanel );
      this.imageDirMeta = [];

      if (this.datatype=='images')  {

        var empty = true;
        for (var i=0;i<inputPanel.dir_input.length;i++)
          if (inputPanel.dir_input[i].dir_path.getValue()!='')  {
            var sectors = inputPanel.imageDirMeta[i].sectors;
            for (var j=0;j<sectors.length;j++)  {
              var ranges = sectors[j].ranges;
              sectors[j].ranges_sel = [];
              if (sectors[j].ranges_inp!='')  {
                var lst = sectors[j].ranges_inp.split(',');
                for (var k=0;k<lst.length;k++)  {
                  var plst = lst[k].split('-');
                  var err  = (plst.length!=2);
                  if (!err)  {
                    err = isNaN(plst[0]) || isNaN(plst[1]);
                    if (!err)  {
                      var n1 = parseInt ( plst[0] );
                      var n2 = parseInt ( plst[1] );
                      var rc = 0;
                      for (var l=0;(l<ranges.length) && (!rc);l++)
                        if ((ranges[l][0]<=n1) && (n1<=ranges[l][1]))  {
                          if ((ranges[l][0]<=n2) && (n2<=ranges[l][1]))  rc =  1;
                                                                   else  rc = -1;
                        }
                      if (rc>0)  {
                        sectors[j].ranges_sel.push ( [Math.min(n1,n2),Math.max(n1,n2)] );
                        empty = false;
                      } else if (rc<=0)
                        msg += '|<b><i>Range "' +lst[k]+ '" of "' +sectors[j].ranges_inp +
                               ' is not within available options"</i></b>';
                    } else
                      msg += '|<b><i>Numeric format error in "' + lst[k] + '" of "' +
                             sectors[j].ranges_inp + '"</i></b>';
                  } else
                    msg += '|<b><i>Range specification error in "' + lst[k] + '" of "' +
                           sectors[j].ranges_inp + '"</i></b>';
                }
              }
            }
            this.imageDirMeta.push ( inputPanel.imageDirMeta[i] );
          }

      } else if (inputPanel.imageDirMeta.length>0)  {
        //  HDF5 master
        this.imageDirMeta = [ inputPanel.imageDirMeta[0] ];
        this.hdf5_range   = inputPanel.dir_input[0].hdf5_range.getValue();
        if (this.hdf5_range)  {
          var lst = this.hdf5_range.split(':');
          if ((lst.length!=3) ||
              (!isInteger(lst[0])) || (!isInteger(lst[1])) || (!isInteger(lst[2])))
            msg += '|<b><i>Image range and block size specification misformatted</i></b>';
        }
      }

      if (this.imageDirMeta.length<=0)
        msg += '|<b><i>No directory with X-ray images is specified</i></b>';
      else if (empty)
        msg += '|<b><i>No images selected</i></b>';

    }

    msg += TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var pname = this.parameters.sec1.contains.PROJECT.value;
    if (pname && (!(/^[A-Za-z]([A-Za-z0-9\\-\\._-]{0,})$/.test(pname))))
//        (!(/^[a-z_]([a-z0-9_-]{0,31}|[a-z0-9_-]{0,30}\$)$/.test(this.parameters.sec1.contains.PROJECT.value))))
//        (!(/^[A-Za-z][A-Za-z0-9\\-\\._-]+$/.test(this.parameters.sec1.contains.PROJECT.value))))
      msg += '|<b><i>Parameters/Project name should contain only latin letters, numbers, ' +
             'undescores,<br>dashes and dots, and must start with a letter</i></b>';


    if (startsWith(this.parameters.sec2.contains.PIPELINE.value,'3d'))  {
      // check XDS availability
      var env = __environ_server;
      if (this.file_system=='local')
        env = __environ_client;
//      if (!this.compareEnvironment(['CCP4','XDS_home','XDSGUI_home'],env))
      if (!this.compareEnvironment(['CCP4','XDS_home'],env))
        msg += '|<b><i>Chosen pipeline protocol requires XDS Software,<br>' +
               'however, it was not found installed</i></b>';
    }

    return  msg;

  }

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskXia2.prototype.customDataClone = function ( cloneMode,task )  {
    this.currentCloudPath = task.currentCloudPath;
    this.imageDirMeta     = [];       // paths, ranges and sectors
    for (var i=0;i<task.imageDirMeta.length;i++)
      this.imageDirMeta.push ( $.extend(true,{},task.imageDirMeta[i]) );
    this.file_system  = task.file_system;  //  local/cloud
    this.datatype     = task.datatype;     //  local/cloud
    this.hdf5_range   = task.hdf5_range;
    this.uname = '';
    return;
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

  TaskXia2.prototype.getNCores = function ( ncores_available )  {
  // This function should return the number of cores, up to ncores_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns threds or processes bypassing the queuing system.
  // It is expected that the task will not utilise more cores than what is
  // given on input to this function.
    return ncores_available;
  }

  TaskXia2.prototype.makeInputData = function ( loginData,jobDir )  {

    var imageDirMeta = [];
    if (this.file_system=='local')  {

      imageDirMeta = this.imageDirMeta;
      this.nc_type = 'client';  // job may be run only on client NC

    } else  {

      var cloudMounts = fcl.getUserCloudMounts ( loginData );
      for (var i=0;i<this.imageDirMeta.length;i++)  {
        imageDirMeta.push ( this.imageDirMeta[i] );
        var lst = imageDirMeta[i].path.split('/');
        if (lst.length>2)  {
          if (lst[0]=='cloudstorage::')  {
            var cm = null;
            for (var j=0;(j<cloudMounts.length) && (!cm);j++)
              if (cloudMounts[j][0]==lst[1])
                cm = cloudMounts[j];
            if (cm)
              imageDirMeta[i].path = path.join ( cm[1],lst.slice(2).join('/') );
          }
        }
      }
      this.nc_type = 'ordinary';  // job may be run on any NC

    }

    utils.writeObject ( prj.getJobDataPath(loginData,this.project,this.id),this );

    utils.writeObject ( path.join(prj.getInputDirPath(jobDir),'__imageDirMeta.json'),
                        {'imageDirMeta':imageDirMeta} );

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  TaskXia2.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xia2', jobManager, jobDir, this.id];
  }

  module.exports.TaskXia2 = TaskXia2;

}
