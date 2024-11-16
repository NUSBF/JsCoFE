
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.migrate.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Migration Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2020-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskMigrate()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.name  = 'hop on ' + __cmd.appName().toLowerCase();
    this.title = 'Hop on ' + __cmd.appName();
    this.inputMode = __template.input_mode.root;  // settings for "on project top only", managed in TaskList
  } else  {
    TaskTemplate.call ( this );
    this.name  = 'hop on ' + appName().toLowerCase();
    this.title = 'Hop on ' + appName();
    this.inputMode = input_mode.root;  // settings for "on project top only", managed in TaskList
  }

  this._type = 'TaskMigrate';
  this.setOName ( 'hop-on' );  // default output file name template
  //this.oname     = '*';   // asterisk here means do not use
  this.fasttrack = true;  // enforces immediate execution

  //this.input_dtypes = [1];  // settings for "on project top only", managed in TaskList

  this.file_system  = 'local';  //  local/cloud
  this.currentCloudPath = '';

  this.file_mod  = {'rename':{},'annotation':[]}; // file modification and annotation

  this.file_hkl  = ''; // name of merged mtz file with reflection dataset
  this.file_mtz  = ''; // name of "refmac" mtz with reflections and density maps
  this.file_xyz  = ''; // name of file with atomic coordinates
  this.file_lib  = ''; // name of file with ligand descriptions

  this.upload_files = [];

}

if (__template)
  __cmd.registerClass ( 'TaskMigrate',TaskMigrate,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskMigrate',TaskMigrate,TaskTemplate.prototype );

// ===========================================================================

TaskMigrate.prototype.icon           = function()  { return 'task_migrate';   }
TaskMigrate.prototype.clipboard_name = function()  { return '"Hop on Cloud"'; }

TaskMigrate.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'import phased structure (HKL, phases and/or XYZ) as Structure Revision';
}

TaskMigrate.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Import phased structure as Structure Revision';
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskMigrate.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskMigrate.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskMigrate.prototype.hotButtons = function() {
    return [CootMBHotButton(),RefmacHotButton()];
  }


  TaskMigrate.prototype.customDataClone = function ( cloneMode,task )  {

    this.uname       = '';
    this.file_system = task.file_system;
    this.currentCloudPath = task.currentCloudPath;
    this.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation
    if ('scalepack' in task.file_mod)
      this.file_mod.scalepack = task.file_mod.scalepack;

    if (this.file_system=='cloud')  {
      this.file_hkl = task.file_hkl; // name of merged mtz file with reflection dataset
      this.file_mtz = task.file_mtz; // name of "refmac" mtz with reflections and density maps
      this.file_xyz = task.file_xyz; // name of file with atomic coordinates
      this.file_lib = task.file_lib; // name of file with ligand descriptions
    }

    this.upload_files = [];

    return;

  }


  TaskMigrate.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project
  let nSeqInputs = 1;
  let self = this;

    let div = this.makeInputLayout();

    this.setInputDataFields ( div.grid,0,dataBox,this );

    if ((this.state!=job_code.new) && (this.state!=job_code.running))
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation

    div.task         = this;
    div.file_system  = this.file_system;   //  local/cloud
    div.upload_files = [];

    let row   = div.grid.getNRows();
    let title = '';
    if (row==0)  title = '<h2>Input Data</h2>';
           else  title = '&nbsp;<br><h3>Data to import and replace in revision</h3>';
    div.grid.setLabel ( title,row++,0,1,5 ).setFontItalic(true).setNoWrap();

    div.grid1 = div.grid.setGrid ( '',row,0,1,5 );
    row = 0;

    function setLabel ( rowNo,text,tooltip )  {
      let lbl = div.grid1.setLabel ( text,rowNo,0,1,1 ).setTooltip(tooltip)
                         .setFontItalic(true).setFontBold(true).setNoWrap();
      div.grid1.setVerticalAlignment ( rowNo,0,'middle' );
      return lbl;
    }

    function setFileSelect ( rowNo,label,tooltip,accept_str,fname )  {
      let lbl  = setLabel ( rowNo,label,tooltip );
      let fsel = div.grid1.setSelectFile ( false,accept_str,rowNo,2,1,1 );
      fsel.hide();
      let btn  = div.grid1.addButton ( 'Browse',image_path('open_file'),rowNo,2,1,1 );
//                          .setWidth_px ( 86 );
      let filename = fname;
      if ((self.state==job_code.new) && (div.file_system=='local'))
        filename = '';

      div.grid1.setLabel ( '&nbsp;',rowNo,1,1,1 ).setNoWrap();
      let itext = div.grid1.setInputText ( filename,rowNo,3,1,2 )
                           .setWidth_px(400).setReadOnly(true).setNoWrap();
      div.grid1.setVerticalAlignment ( rowNo,2,'middle' );
      div.grid1.setVerticalAlignment ( rowNo,3,'middle' );
      div.grid1.setLabel ( '&nbsp;',rowNo,4,1,1 ).setNoWrap();
      btn.addOnClickListener ( function(){
        if (div.file_system=='local')
          fsel.click();
        else  {
          new CloudFileBrowser ( div,div.task,4,accept_str.split(','),function(items){
            if (items.length>0)  {
              // The next line is necessary for annotating just this upload.
              // If sequences also need to be uploaded. file_mod should be cleared
              // the 'annotation' field when seq file is being uploaded
              let file_mod = {'rename':{},'annotation':[]}; // file modification and annotation
              let fname = 'cloudstorage::/' + div.task.currentCloudPath + '/' + items[0].name;
              if (fname.toLowerCase().endsWith('.sca'))  {
                _import_checkFiles ( items,file_mod,div.upload_files,function(){
                  if ('scalepack' in file_mod)
                    div.customData.file_mod.scalepack = file_mod.scalepack;
                  itext.setValue ( fname );
                });
              } else
                itext.setValue ( fname );
            }
            return 1;  // close browser window
          },null );
        }
      });
      fsel.addOnChangeListener ( function(){
        let files = fsel.getFiles();
        if (files.length>0)  {
          // The next line is necessary for annotating just this upload.
          // If sequences also need to be uploaded. file_mod should be cleared
          // the 'annotation' field when seq file is being uploaded
          let file_mod = {'rename':{},'annotation':[]}; // file modification and annotation
          if (files[0].name.toLowerCase().endsWith('.sca'))  {
            _import_checkFiles ( files,file_mod,div.upload_files,function(){
              if ('scalepack' in file_mod)
                div.customData.file_mod.scalepack = file_mod.scalepack;
              itext.setValue ( files[0].name );
                    //wset['itext'].setValue ( files[0].name );
                    //setSeqControls();
            });
          } else
            itext.setValue ( files[0].name );
        }
      });
      return { 'label':lbl, 'fsel':fsel, 'browse':btn, 'itext':itext };
    }

    setLabel ( row,'Import data from','Specify data location' );
    div.source_select_ddn = new Dropdown();
    div.grid1.addWidget ( div.source_select_ddn,row,2,1,2 );
    div.source_select_ddn.addItem ( 'local file system','','local',div.file_system=='local' );
    div.source_select_ddn.addItem ( 'cloud storage'    ,'','cloud',div.file_system=='cloud' );
    div.source_select_ddn.make();
    div.source_select_ddn.addOnChangeListener ( function(text,value){
      div.file_system = value;
      div.select_hkl.itext.setValue ( '' );
      div.select_mtz.itext.setValue ( '' );
      div.select_xyz.itext.setValue ( '' );
      div.select_lib.itext.setValue ( '' );
    });
    div.source_select_ddn.setWidth ( '180px' );

    div.grid1.setVerticalAlignment ( row++,2,'middle' );
    div.grid1.setLabel ( '',row++,0,1,1 ).setHeight_px(8);

    div.select_hkl = setFileSelect ( row++,
      'Reflection data',
      'Navigate to MTZ file with merged reflections',
      '.mtz,.sca',
      this.file_hkl
    );

    div.select_mtz = setFileSelect ( row++,
      'Phases',
      'Navigate to MTZ file with electron density maps',
      '.mtz',
      this.file_mtz
    );

    div.select_xyz = setFileSelect ( row++,
      'Atomic coordinates',
      'Navigate to PDB or mmCIF file with atomic coordinates',
      '.pdb,.mmcif',
      this.file_xyz
    );

    div.select_lib = setFileSelect ( row++,
      'Ligand descriptions',
      'Navigate to CIF file with ligand descriptions',
      '.cif,.lib',
      this.file_lib
    );

    this.layParameters ( div.grid,div.grid.getNRows()+1,0 );

    let ncols = div.grid1.getNCols();
    for (let i=1;i<ncols;i++)  {
      div.grid1.setLabel    ( ' ',row,i,1,1   ).setHeight_px(8);
      div.grid1.setCellSize ( 'auto','',row,i );
    }
    div.grid1.setLabel    ( ' ',row,ncols,1,1  ).setHeight_px(8);
    div.grid1.setCellSize ( '95%','',row,ncols );

    return div;

  }

  /*
  TaskMigrate.prototype.disableInputWidgets = function ( widget,disable_bool ) {
    TaskTemplate.prototype.disableInputWidgets.call ( this,widget,disable_bool );
    if (widget.hasOwnProperty('upload'))  {
      widget.upload.button.setDisabled ( disable_bool );
      if (widget.upload.link_button)
        widget.upload.link_button.setDisabled ( disable_bool );
    }
  }
  */

  // reserved function name
  TaskMigrate.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    let msg = '';  // Ok if stays empty

    this.file_hkl = '';
    this.file_mtz = '';
    this.file_xyz = '';
    this.file_lib = '';

    if (inputPanel.file_system=='local')  {
      let file_hkl = inputPanel.select_hkl['fsel'].getFiles();
      let file_mtz = inputPanel.select_mtz['fsel'].getFiles();
      let file_xyz = inputPanel.select_xyz['fsel'].getFiles();
      let file_lib = inputPanel.select_lib['fsel'].getFiles();
      if (file_hkl.length>0)  this.file_hkl = file_hkl[0].name;
      if (file_mtz.length>0)  this.file_mtz = file_mtz[0].name;
      if (file_xyz.length>0)  this.file_xyz = file_xyz[0].name;
      if (file_lib.length>0)  this.file_lib = file_lib[0].name;
    } else  {
      this.file_hkl = inputPanel.select_hkl['itext'].getValue();
      this.file_mtz = inputPanel.select_mtz['itext'].getValue();
      this.file_xyz = inputPanel.select_xyz['itext'].getValue();
      this.file_lib = inputPanel.select_lib['itext'].getValue();
                                // name of file with ligand descriptions
    }

    if (this.file_hkl.length<=0)
      msg += '|<b><i>Reflection data must be given</i></b>';
    if ((this.file_mtz.length<=0) && (this.file_xyz.length<=0))
      msg += '|<b><i>Either phases or atomic coordinates, or both, must be given</i></b>';

    this.file_system = inputPanel.file_system;
    this.file_mod    = inputPanel.file_mod;

    TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    return  msg;

  }

  //  This function is called when task is finally sent to FE to run. Should
  // execute function given as argument, or issue an error message if run
  // should not be done.
  TaskMigrate.prototype.doRun = function ( inputPanel,run_func )  {
  let file_hkl = '';
  let file_mtz = '';
  let file_xyz = '';
  let file_lib = '';

    this.file_system = inputPanel.file_system;
    this.file_mod    = inputPanel.file_mod;

    if (inputPanel.file_system=='local')  {
      file_hkl = inputPanel.select_hkl['fsel'].getFiles();
      file_mtz = inputPanel.select_mtz['fsel'].getFiles();
      file_xyz = inputPanel.select_xyz['fsel'].getFiles();
      file_lib = inputPanel.select_lib['fsel'].getFiles();
      if (file_hkl.length>0)  this.file_hkl = file_hkl[0].name;
      if (file_mtz.length>0)  this.file_mtz = file_mtz[0].name;
      if (file_xyz.length>0)  this.file_xyz = file_xyz[0].name;
      if (file_lib.length>0)  this.file_lib = file_lib[0].name;
    } else  {
      this.file_hkl = inputPanel.select_hkl['itext'].getValue();
      this.file_mtz = inputPanel.select_mtz['itext'].getValue();
      this.file_xyz = inputPanel.select_xyz['itext'].getValue();
      this.file_lib = inputPanel.select_lib['itext'].getValue();
    }

    if (this.file_hkl.length + this.file_mtz.length +
        this.file_xyz.length + this.file_lib.length <= 0)  {
      new MessageBox ( 'Stop run','Task cannot be run as no data are<br>' +
                                  'given for upload' );
    } else if (inputPanel.file_system=='local')  {
      let files = [];
      if (file_hkl.length>0)  files.push ( file_hkl );
      if (file_mtz.length>0)  files.push ( file_mtz );
      if (file_xyz.length>0)  files.push ( file_xyz );
      if (file_lib.length>0)  files.push ( file_lib );
      new UploadDialog ( 'Upload data',files,inputPanel.customData,true,
                          function(returnCode){
        if (!returnCode)
          run_func();
        else
          new MessageBox ( 'Stop run','Task cannot be run due to upload ' +
                                'errors:<p><b><i>' + returnCode + '</i></b>',
                                msg_error );
      });
    } else
      run_func();

  }

  // reserved function name
  TaskMigrate.prototype.runButtonName = function()  { return 'Start'; }
  TaskMigrate.prototype.checkKeywords = function ( keywords )  {
    // keywords supposed to be in low register
      return this.__check_keywords ( keywords,['hopon', 'hop-on','hop', 'on', 'migrate', 'import'] );
  }

} else  {
  // for server side

  const fs      = require('fs-extra');
  const path    = require('path');

  const conf    = require('../../js-server/server.configuration');
  const utils   = require('../../js-server/server.utils');
  const uh      = require('../../js-server/server.fe.upload_handler');
  const storage = require('../../js-server/server.fe.storage');

  TaskMigrate.prototype.prepare_file = function ( fpath,cloudMounts,uploads_dir )  {
    if (fpath.length>0)  {
      let lst = fpath.split('/');
      if (lst.length>2)  {
        if (lst[0]=='cloudstorage::')  {
          let cfpath = null;
          for (let j=0;(j<cloudMounts.length) && (!cfpath);j++)
            if (cloudMounts[j][0]==lst[1])
              cfpath = path.join ( cloudMounts[j][1],lst.slice(2).join('/') );
          if (cfpath)  {
            let dest_file = path.join ( uploads_dir,lst[lst.length-1] );
            try {
              fs.copySync ( cfpath,dest_file );
            } catch (err) {
              console.log ( ' ***** cannot copy file ' + cfpath +
                            '\n                   to ' + dest_file );
              console.log ( '       error: ' + err) ;
            }
          } else {
            console.log ( ' ***** path ' + fpath + ' not found' );
          }
        }
      }
    }
  }

  TaskMigrate.prototype.makeInputData = function ( loginData,jobDir )  {
    let uploads_dir = path.join ( jobDir,uh.uploadDir() );

    if (!utils.writeObject(path.join(jobDir,'annotation.json'),this.file_mod))
      console.log ( ' ***** cannot write "annotation.json" in ' + uploads_dir );

    if (!utils.fileExists(uploads_dir))  {
      if (!utils.mkDir( uploads_dir))
        console.log ( ' ***** cannot create directory ' + uploads_dir );
    }

    let cloudMounts = storage.getUserCloudMounts ( loginData );

    this.prepare_file ( this.file_hkl,cloudMounts,uploads_dir );
    this.prepare_file ( this.file_mtz,cloudMounts,uploads_dir );
    this.prepare_file ( this.file_xyz,cloudMounts,uploads_dir );
    this.prepare_file ( this.file_lib,cloudMounts,uploads_dir );

    for (let i=0;i<this.file_mod.annotation.length;i++)  {
      utils.removeFile ( path.join(uploads_dir,this.file_mod.annotation[i].file) );
      //redundant_files.push ( file_mod.annotation[i].file );
      for (let j=0;j<this.file_mod.annotation[i].items.length;j++)  {
        let fname = this.file_mod.annotation[i].items[j].rename;
        utils.writeString ( path.join(uploads_dir,fname),
                            this.file_mod.annotation[i].items[j].contents );
        //fdata.files.push ( fname );
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskMigrate.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.migrate', jobManager, jobDir, this.id];
  }

  

  module.exports.TaskMigrate = TaskMigrate;

}
