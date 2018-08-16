
/*
 *  =================================================================
 *
 *    31.07.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.phasermr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Import Task Class
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

function TaskImport()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskImport';
  this.name      = 'data import';
  this.oname     = '*';   // asterisk here means do not use
  this.title     = 'Data Import';
  this.helpURL   = './html/jscofe_task_import.html';
  this.fasttrack = true;  // enforces immediate execution

}

if (__template)
      TaskImport.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskImport.prototype = Object.create ( TaskTemplate.prototype );
TaskImport.prototype.constructor = TaskImport;


// ===========================================================================

TaskImport.prototype.icon_small = function()  { return './images/task_import_20x20.svg'; }
TaskImport.prototype.icon_large = function()  { return './images/task_import.svg';       }

TaskImport.prototype.currentVersion = function()  { return 1; }

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // reserved function name
  TaskImport.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();

    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    var msg = '';
    if (__local_service)
          msg = 'Use file selection buttons ';
    else  msg = 'Use the file selection button ';
    div.grid.setLabel ( msg + 'below to select and upload data files ' +
                        'to the Project (use multiple file selections and ' +
                        'repeat uploads if necessary). When done, hit ' +
                        '<b><i>Import</i></b> button to process ' +
                        'files uploaded.<br>&nbsp;',
                        0,0, 1,1 ).setFontSize('80%');
    div.grid.setWidth ( '100%' );

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation
    (function(panel,task){
      panel.upload = new Upload ( panel.customData,'project_data',
        function(e,onReady_func) {
          if (e.target.files.length>0)
            _import_checkFiles ( e.target.files,div.customData.file_mod,
                                 panel.upload.upload_files,onReady_func );
        },
        function(){
          new ImportPDBDialog ( function(pdb_list){
            pdb_spec_list = [];
            for (var i=0;i<pdb_list.length;i++)
              pdb_spec_list.push ( 'PDB::' + pdb_list[i] );
            panel.upload.setUploadedFiles ( pdb_spec_list );
            //alert ( 'action ' + entry_list );
          });
        },
        function(returnCode){
          if (!returnCode)
            task.sendInputStateEvent ( panel );
        });

      panel.upload.addSignalHandler ( cofe_signals.uploadEvent, function(detail){
        task.sendTaskStateSignal ( panel,detail );
      });

    }(div,this));
    div.upload.setUploadedFiles ( this.upload_files );
    if (this.upload_files.length<=0)
      this.sendTaskStateSignal ( div,'hide_run_button' );

    div.grid.setWidget ( div.upload,1,0,1,1 );
    div.panel.setScrollable ( 'hidden','hidden' );

    return div;

  }


  TaskImport.prototype.disableInputWidgets = function ( widget,disable_bool ) {
    TaskTemplate.prototype.disableInputWidgets.call ( this,widget,disable_bool );
    if (widget.hasOwnProperty('upload'))  {
      widget.upload.button.setDisabled ( disable_bool );
      if (widget.upload.link_button)
        widget.upload.link_button.setDisabled ( disable_bool );
      //if (this.upload_files.length<=0)
        //this.sendTaskStateSignal ( widget,'hide_run_button' );
    }
  }


  function _import_renameFile ( fname,uploaded_files )  {
    var new_fname    = fname;
    var name_counter = 0;

    while (uploaded_files.indexOf(new_fname)>=0)  {
      name_counter++;
      var lst = fname.split('.');
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
    var new_fname    = fname;
    var name_counter = -1;
    var lst = fname.split('.');
    var ext = '';
    if (lst.length>1)
      ext = '.' + lst.pop();

    do {
      name_counter++;
      new_fname = lst.join('.');
      if (name_counter>0)
        new_fname += '.n' + padDigits ( name_counter,3 );
      var m = false;
      for (var i=0;(i<uploaded_files.length) && (!m);i++)
//        m = uploaded_files[i].startsWith ( new_fname );
        m = startsWith ( uploaded_files[i],new_fname );
    } while (m);

    if (ext)
      new_fname += ext;

    return new_fname;

  }

  function _import_scanFiles ( files,pos,file_mod,uploaded_files,onDone_func ) {

    if (pos>=files.length)  {

      onDone_func ( file_mod );

    } else  {

      var p         = pos;
      var isSeqFile = false;
      var new_name  = '';

      while ((!isSeqFile) && (p<files.length))  {
        var ns    = files[p].name.split('.');
        isSeqFile = (ns.length>1) &&
                    (['seq','fasta','pir'].indexOf(ns.pop().toLowerCase())>=0);
        if (!isSeqFile)  {
          new_name = _import_renameFile ( files[p].name,uploaded_files );
          if (new_name!=files[p].name)
            file_mod.rename[files[p].name] = new_name;
          p++;
        }
      }

      if (isSeqFile)  {

        var reader = new FileReader();
        reader.onload = function(e) {
          var fname         = files[p].name;
          var new_name      = _import_renameFile1 ( fname,uploaded_files );
          var contents_list = e.target.result.split('>');
          var seq_counter   = 1;
          var annotation    = {
            'file'   : fname,
            'rename' : new_name,
            'items'  : []
          }
          for (var i=0;i<contents_list.length;i++)
            if (contents_list[i].replace(/\s/g,''))  {
              var fname1 = new_name;
              if (contents_list.length>2)  {
                var lst = fname1.split('.');
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
        };
        reader.readAsText ( files[p] );

      } else  {
        onDone_func ( file_mod );
      }

    }

  }


  function _import_checkFiles ( files,file_mod,uploaded_files,onReady_func )  {
    file_mod.rename = {};  // clean up every upload
    _import_scanFiles ( files,0,file_mod,uploaded_files,function(file_mod){
      //alert ( ' annot=' + JSON.stringify(file_mod) );
      var nannot = file_mod.annotation.length;
      if ((nannot>0) && (file_mod.annotation[nannot-1].items[0].type=='none'))
        new ImportAnnotationDialog ( file_mod.annotation,onReady_func );
      else
        onReady_func();
    });
  }


  // reserved function name
  TaskImport.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    this.upload_files = inputPanel.upload.upload_files;
    if (this.upload_files.length>0)
      return '';   // input is Ok
    else
      return 'No file(s) have been uploaded';  // input is not ok
  }

  // reserved function name
  TaskImport.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskImport.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', exeType, jobDir, this.id];
  }

  module.exports.TaskImport = TaskImport;

}
