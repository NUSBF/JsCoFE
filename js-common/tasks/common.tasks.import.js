
/*
 *  ==========================================================================
 *
 *    08.12.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  ==========================================================================
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

  // declare void input data for passing pre-existing revisions through the task
  this.input_dtypes = [{       // input data types
      data_type   : {'DataRevision':[]}, // any revision will be passed
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 100000000, // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 100000000  // maximum acceptable number of data instances
    }
  ];

}

if (__template)
      TaskImport.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskImport.prototype = Object.create ( TaskTemplate.prototype );
TaskImport.prototype.constructor = TaskImport;


// ===========================================================================

TaskImport.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  TaskImport.prototype.customDataClone = function ( task )  {
    this.uname = '';
    return;
  }

  TaskImport.prototype.icon = function()  {
    if (this.state==job_code.remdoc)
          return 'task_remdoc';
    else  return 'task_import';
  }

  // reserved function name
  TaskImport.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project

    var div = this.makeInputLayout();
    this.setInputDataFields ( div.grid,0,dataBox,this );

    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    var msg = '';
    if (__local_service)
          msg = 'Use file selection buttons ';
    else  msg = 'Use the file selection button ';

    var grid_row = div.grid.getNRows();
    div.grid.setLabel ( msg + 'below to select and upload data files ' +
                        'to the Project (use multiple file selections and ' +
                        'repeat uploads if necessary). When done, hit ' +
                        '<b><i>Import</i></b> button to process ' +
                        'files uploaded.<br>&nbsp;',
                        grid_row,0, 1,1 ).setFontSize('80%');
    div.grid.setWidth ( '100%' );

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation
    (function(panel,task){
      panel.upload = new Upload ( panel.customData,
        { 'type'   : 'project_data',
          'accept' : '.pdb,.ent,.seq,.fasta,.pir,.mtz,.cif,.mmcif,.doc,.docx,.pdf,.txt,.jpg,.jpeg,.gif,.png,.html,.htm,.hkl' },
        function(e,onReady_func) {
          if (e.target.files.length>0)
            _import_checkFiles ( e.target.files,div.customData.file_mod,
                                 panel.upload.upload_files,onReady_func );
        },
        null,
        /*  --  commenting this removes PDB import button
        function(){
          new ImportPDBDialog ( function(pdb_list){
            pdb_spec_list = [];
            for (var i=0;i<pdb_list.length;i++)
              pdb_spec_list.push ( 'PDB::' + pdb_list[i] );
            panel.upload.setUploadedFiles ( pdb_spec_list );
          });
        },
        */
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
        m = startsWith ( uploaded_files[i],new_fname );
    } while (m);

    if (ext)
      new_fname += ext;

    return new_fname;

  }


  function _check_sequence ( files,uploaded_files,contents,file_mod,p,onDone_func )  {
    var fname       = files[p].name;
    var new_name    = _import_renameFile1 ( fname,uploaded_files );
    var seq_counter = 1;
    var annotation  = {
      'file'   : fname,
      'rename' : new_name,
      'items'  : []
    }

    // the following makes files without sequence names acceptable
    var lines = contents.split(/\r\n|\r|\n/);
    for (var i=0;i<lines.length;i++)  {
      lines[i] = lines[i].trim();
      if (lines[i]=='>')
        lines[i] = '>no name';
    }
    var contents_list = lines.join('\n').split('>');

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
          //'contents' : '>' + contents_list[i],
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

      var p         = pos;
      var isSeqFile = false;
      var new_name  = '';

      while ((!isSeqFile) && (p<files.length))  {
        var ns    = files[p].name.split('.');
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

      if (isSeqFile)  {

        if ('_type' in files[p])  {
          _check_sequence ( files,uploaded_files,files[p].contents,
                            file_mod,p,onDone_func );
        } else  {
          var reader = new FileReader();
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

    var sel_files = [];
    var ignore    = '';
    for (var i=0;i<files.length;i++)  {
      var lcname = files[i].name.toLowerCase();
      if (endsWith(lcname,'.ccp4_demo') || endsWith(lcname,'.zip'))
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

      var upl_files = [];
      for (var i=0;i<uploaded_files.length;i++)
        upl_files.push ( getBasename(uploaded_files[i]) );

      _import_scanFiles ( sel_files,0,file_mod,upl_files,function(file_mod){
        //alert ( ' annot=' + JSON.stringify(file_mod) );
        var nannot = file_mod.annotation.length;
        if ((nannot>0) && (file_mod.annotation[nannot-1].items[0].type=='none'))
          new ImportAnnotationDialog ( file_mod.annotation,onReady_func );
        else
          onReady_func();
      });

    }

  }


  // reserved function name
  TaskImport.prototype.collectInput = function ( inputPanel )  {
    // collects data from input widgets, created in makeInputPanel() and
    // stores it in internal fields
    TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    this.upload_files = inputPanel.upload.upload_files;
    if (this.upload_files.length>0)
      return '';   // input is Ok
    else
      return 'No file(s) have been selected';  // input is not ok
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

  var conf = require('../../js-server/server.configuration');

  TaskImport.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', jobManager, jobDir, this.id];
  }

  module.exports.TaskImport = TaskImport;

}
