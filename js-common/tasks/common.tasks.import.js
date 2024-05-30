
/*
 *  ==========================================================================
 *
 *    28.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  --------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.import.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  ==========================================================================
 *
 */
  
'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskImport()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskImport';
  this.name      = 'file import';
  this.oname     = '*';   // asterisk here means do not use
  this.title     = 'File(s) Upload and Import';
  this.fasttrack = true;  // enforces immediate execution

  this.file_mod     = {'rename':{},'annotation':[]}; // file modification and annotation
  this.upload_files = [];

  // declare void input data for passing pre-existing revisions through the task
  this.input_dtypes = [{       // input data types
      data_type   : {'DataRevision':[]}, // any revision will be passed
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 1000,      // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 1000       // maximum acceptable number of data instances
    }
  ];

}

if (__template)
      TaskImport.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskImport.prototype = Object.create ( TaskTemplate.prototype );
TaskImport.prototype.constructor = TaskImport;


// ===========================================================================

TaskImport.prototype.clipboard_name = function()  { return '"Import"'; }

TaskImport.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'upload and import various files from your device into the Project';
}

TaskImport.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['import', 'data'] );
}

TaskImport.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Upload and import various files from your device into the Project';
}

TaskImport.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


function _import_renameFile ( fname,uploaded_files )  {
  let new_fname    = fname;
  let name_counter = 0;

  while (uploaded_files.indexOf(new_fname)>=0)  {
    name_counter++;
    let lst = fname.split('.');
    if (lst.length>1)  {
      lst.push ( lst[lst.length-1] );
      lst[lst.length-2] = 'n' + padDigits ( name_counter,3 );
      new_fname = lst.join('.');
    } else
      new_fname = fname + '.n' + padDigits ( name_counter,3 );
  }

  return new_fname;

}


function _import_renameFile1 ( fname,uploaded_files )  {
  let new_fname    = fname;
  let name_counter = -1;
  let lst = fname.split('.');
  let ext = '';
  if (lst.length>1)
    ext = '.' + lst.pop();

  let m = false;
  do {
    name_counter++;
    new_fname = lst.join('.');
    if (name_counter>0)
      new_fname += '.n' + padDigits ( name_counter,3 );
    m = false;
    for (let i=0;(i<uploaded_files.length) && (!m);i++)
      m = startsWith ( uploaded_files[i],new_fname );
  } while (m);

  if (ext)
    new_fname += ext;

  return new_fname;

}


function _check_sequence ( files,uploaded_files,contents,file_mod,p,onDone_func )  {
  let fname       = files[p].name;
  let new_name    = _import_renameFile1 ( fname,uploaded_files );
  let seq_counter = 1;
  let annotation  = {
    'file'   : fname,
    'rename' : new_name,
    'items'  : []
  }

  // the following makes files without sequence names acceptable
  let lines = contents.split(/\r\n|\r|\n/);
  for (let i=0;i<lines.length;i++)  {
    lines[i] = lines[i].trim();
    if (lines[i]=='>')
      lines[i] = '>no name';
  }
  let contents_list = lines.join('\n').split('>');

  for (let i=0;i<contents_list.length;i++)
    if (contents_list[i].replace(/\s/g,''))  {
      let fname1 = new_name;
      if (contents_list.length>2)  {
        let lst = fname1.split('.');
        lst.push ( lst[lst.length-1] );
        lst[lst.length-2] = 's' + padDigits ( seq_counter++,3 );
        fname1 = lst.join('.');
      }
      annotation.items.push ({
        'rename'   : fname1,
        'contents' : '>' + contents_list[i].trim(),
        'type'     : 'none'
      });
    }

  file_mod.annotation.push ( annotation );
  _import_scanFiles ( files,p+1,file_mod,uploaded_files,onDone_func );

}


function _import_scanFiles ( files,pos,file_mod,uploaded_files,onDone_func ) {

  if (pos>=files.length)  {

    onDone_func ( file_mod );

  } else  {

    // look for sequence files

    let p         = pos;
    let isSeqFile = false;
    let new_name  = '';

    // this loop always goes to files.length, check recursion in _check_sequence
    while ((!isSeqFile) && (p<files.length))  {
      let ns = files[p].name.split('.');
      if (ns[ns.length-1].toLowerCase()=='txt')
        ns.pop();
      let ext = ns.pop().toLowerCase();
      isSeqFile = (ns.length>0) && (['seq','fasta','pir'].indexOf(ext)>=0);
      if (!isSeqFile)  {
        new_name = _import_renameFile ( files[p].name,uploaded_files );
        if (new_name!=files[p].name)
          file_mod.rename[files[p].name] = new_name;
        if (ext=='sca')  {
          // Scalepack file, request wavelength from user
          if (!('scalepack' in file_mod))
            file_mod.scalepack = {};
          file_mod.scalepack[new_name] = { wavelength : '' };
        }
        p++;
      }
    }

    /*
    while ((!isSeqFile) && (p<files.length))  {
      let ns = files[p].name.split('.');
      if (ns[ns.length-1].toLowerCase()=='txt')
        ns.pop();
      isSeqFile = (ns.length>1) &&
                  (['seq','fasta','pir'].indexOf(ns.pop().toLowerCase())>=0);
      if (!isSeqFile)  {
        new_name = _import_renameFile ( files[p].name,uploaded_files );
        if (new_name!=files[p].name)
          file_mod.rename[files[p].name] = new_name;
        p++;
      }
    }
    */

    if (isSeqFile)  {

      if ('_type' in files[p])  {
        _check_sequence ( files,uploaded_files,files[p].contents,
                          file_mod,p,onDone_func );
      } else  {
        let reader = new FileReader();
        reader.onload = function(e) {
          _check_sequence ( files,uploaded_files,e.target.result,
                            file_mod,p,onDone_func );
        };
        reader.readAsText ( files[p] );
      }

    } else  {
      onDone_func ( file_mod );
    }

  }

}


function _import_checkFiles ( files,file_mod,uploaded_files,onReady_func )  {

  let sel_files = [];
  let ignore    = '';
  for (let i=0;i<files.length;i++)  {
    let lcname = files[i].name.toLowerCase();
    if (endsWith(lcname,'.ccp4_demo') ||
        endsWith(lcname,'.ccp4cloud') ||
        endsWith(lcname,'.zip'))
          ignore += '<li><b>' + files[i].name + '</b></li>';
    else  sel_files.push ( files[i] );
  }

  if (ignore.length>0)
    new MessageBox ( 'File(s) not importable',
                     'Archive file(s) <ul>' + ignore + '</ul> cannot be ' +
                     'imported as data files and will be ignored.<p>' +
                     'If you try to import ' + appName() + ' projects, ' +
                     'do this from<br><i>Project List</i> page.' );

  if (sel_files.length>0)  {

    file_mod.rename = {};  // clean up every upload

    let upl_files = [];
    for (let i=0;i<uploaded_files.length;i++)
      upl_files.push ( getBasename(uploaded_files[i]) );

    _import_scanFiles ( sel_files,0,file_mod,upl_files,function(file_mod){
      //alert ( ' annot=' + JSON.stringify(file_mod) );
      let nannot = file_mod.annotation.length;
      if ((('scalepack' in file_mod) && (!jQuery.isEmptyObject(file_mod.scalepack))) ||
          ((nannot>0) && (file_mod.annotation[nannot-1].items[0].type=='none')))
        new ImportAnnotationDialog ( file_mod,onReady_func );
      else
        onReady_func();
    });

  }

}




// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskImport.prototype.hotButtons = function() {
    return [AsuDefHotButton()];
  }

  TaskImport.prototype.customDataClone = function ( cloneMode,task )  {
    this.uname        = '';
    this.file_mod     = {'rename':{},'annotation':[]}; // file modification and annotation
    this.upload_files = [];
    this.autoRunId    = '';     // automatic workflow Id
    this.script       = [];     // workflow script to execute
    this.script_pointer = 0;    // current position in the workflow script script
    return;
  }

  TaskImport.prototype.icon = function()  {
    if (this.state==job_code.remdoc)
          return 'task_remdoc';
    else  return 'task_import';
  }

  TaskImport.prototype.onJobDialogStart = function ( job_dialog )  {
    // if (__user_settings.guided_import)
    //   job_dialog.inputPanel.upload.button.click();
  }
  

  TaskImport.prototype.onJobDialogClose = function ( job_dialog,callback_func )  {
    if ((this.upload_files.length>0) && (this.state==job_code.new))  {
      new QuestionBox ( 'Import not finished',
                        '<h3>Import not finished</h3>' +
                        'You have uploaded data files, however the import<br>' +
                        'is not finished yet: the files need to be processed<br>' +
                        'before they can be used in subsequent tasks.',
                        [
          { name    : 'Finish now',
            onclick : function(){
                        job_dialog.run_btn.click();
                        callback_func ( false );
                      }
          },{
            name    : 'Finish later',
            onclick : function(){
                        callback_func ( true );
                      }
          }
        ],'msg_question');
    } else
      callback_func ( true );
  }

  // reserved function name
  TaskImport.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    let div = this.makeInputLayout();
    this.setInputDataFields ( div.grid,0,dataBox,this );

    // if ((!__user_settings.guided_import) &&
    //     ((this.state==job_code.new) || (this.state==job_code.running)))    {
    //   div.header.setLabel ( ' ',2,0,1,1 );
    //   div.header.setLabel ( ' ',2,1,1,1 );
    // } else
    //   div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    // let msg = '';
    // if (__local_service)
    //       msg = 'Use file selection buttons ';
    // else  msg = 'Use the file selection button ';

    let msg = '';
    if (('void1' in this.input_data.data) && (this.input_data.data['void1'].length>0))
      msg = '<span style="font-size:16px;">' +
            '<b>Are you trying to <u>replace</u> data in current structure?</b> ' +
            'Use <b><i>Import & replace</i></b> task instead or run ' +
            '<b><i>Edit Structure Revision</i></b> task after import. This task only ' +
            'adds data to the Project.</span><br>&nbsp;<br>';

    let grid_row = div.grid.getNRows();
    div.grid.setLabel ( msg + 'Use the file selection button below to choose files ' +
                        'for upload. When done, hit <b><i>Import</i></b> button to ' +
                        'start importing.<br>&nbsp;',
                        grid_row,0, 1,1 ).setFontSize('80%');
    div.grid.setWidth ( '100%' );

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = this.file_mod; // file modification and annotation
    (function(panel,task){
      panel.upload = new Upload ( panel.customData,
        { 'type'   : 'project_data',
          'accept' : '.pdb,.ent,.seq,.fasta,.pir,.mtz,.sca,.cif,.mmcif,.doc,.docx,' +
                     '.pdf,.txt,.jpg,.jpeg,.gif,.png,.html,.htm,.hkl,.hhr,.borges,' +
                     '.lib,.wscript',
          'gzip'   : true
        },
        function(e,onReady_func) {
          if (e.target.files.length>0)
            _import_checkFiles ( e.target.files,div.customData.file_mod,
                                 panel.upload.upload_files,onReady_func );
        },
        null,
        /*  --  commenting this removes the PDB import button
        function(){
          new ImportPDBDialog ( function(pdb_list){
            pdb_spec_list = [];
            for (let i=0;i<pdb_list.length;i++)
              pdb_spec_list.push ( 'PDB::' + pdb_list[i] );
            panel.upload.setUploadedFiles ( pdb_spec_list );
          });
        },
        */
        function(returnCode){
          if (!returnCode)
            task.sendInputStateEvent ( panel );
          if ((panel.upload.new_files.length>0) &&
              (__user_settings.guided_import))  {
            panel.upload.button.setText ( 'Upload more files' );
            let files_ignored = '';
            if (panel.upload.ignored_list.length>0)
              files_ignored = '<h3>Files ignored:</h3><ul><li>' +
                              panel.upload.ignored_list.join('</li><li>') +
                              '</li></ul>';
            new QuestionBox ( 'Files uploaded',
                              '<h3>Files uploaded:</h3><ul><li>' +
                              panel.upload.new_files.join('</li><li>') +
                              '</li></ul>' + files_ignored,[
                { name    : 'Upload more files',
                  onclick : function(){ panel.upload.button.click(); }
                },{
                  name    : 'Finish import',
                  onclick : function(){ panel.job_dialog.run_btn.click(); }
                },{
                  name    : 'Close'
                }
              ],'msg_question');
          }
        });

      panel.upload.addSignalHandler ( cofe_signals.uploadEvent, function(detail){
        task.sendTaskStateSignal ( panel,detail );
      });

    }(div,this));

    div.upload.setUploadedFiles ( this.upload_files );
    if (this.upload_files.length<=0)
      this.sendTaskStateSignal ( div,'hide_run_button' );
    else
      div.upload.button.setText ( 'Upload more files' );

    div.grid.setWidget ( div.upload,grid_row+1,0,1,1 );
    div.panel.setScrollable ( 'hidden','hidden' );

    return div;

  }


  TaskImport.prototype.disableInputWidgets = function ( widget,disable_bool ) {
    TaskTemplate.prototype.disableInputWidgets.call ( this,widget,disable_bool );
    if (widget.hasOwnProperty('upload'))  {
      widget.upload.button.setDisabled ( disable_bool );
      if (widget.upload.link_button)
        widget.upload.link_button.setDisabled ( disable_bool );
      if (widget.upload.pdb_button)
        widget.upload.pdb_button.setDisabled ( disable_bool );
      //if (this.upload_files.length<=0)
        //this.sendTaskStateSignal ( widget,'hide_run_button' );
    }
  }


  // reserved function name
  TaskImport.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    this.upload_files = inputPanel.upload.upload_files;
    this.file_mod     = inputPanel.customData.file_mod;
    if (this.upload_files.length>0)
      return '';   // input is Ok
    else
      return '<b><i>No file(s) have been uploaded</i></b>';  // input is not ok
  }


  // reserved function name
  TaskImport.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  TaskImport.prototype.icon = function()  {
    if (this.state==__template.job_code.remdoc)
          return 'task_remdoc';
    else  return 'task_import';
  }

  let conf = require('../../js-server/server.configuration');

  TaskImport.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', jobManager, jobDir, this.id];
  }

  module.exports.TaskImport = TaskImport;

}
