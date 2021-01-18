
/*
 *  =================================================================
 *
 *    16.01.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2020-2021
 *
 *  =================================================================
 *
 */


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
    this.name  = 'hop in ' + __cmd.appName().toLowerCase();
    this.title = 'Hop in ' + __cmd.appName();
  } else  {
    TaskTemplate.call ( this );
    this.name  = 'hop in ' + appName().toLowerCase();
    this.title = 'Hop in ' + appName();
  }

  this._type = 'TaskMigrate';
  //this.setOName ( 'migrated' );  // default output file name template
  this.oname     = '*';   // asterisk here means do not use
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [1];  // settings for "on project top only", managed in TaskList

  this.file_hkl  = ''; // name of merged mtz file with reflection dataset
  this.file_mtz  = ''; // name of "refmac" mtz with reflections and density maps
  this.file_xyz  = ''; // name of file with atomic coordinates
  this.file_lib  = ''; // name of file with ligand descriptions

  this.upload_files = [];

}

if (__template)
      TaskMigrate.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskMigrate.prototype = Object.create ( TaskTemplate.prototype );
TaskMigrate.prototype.constructor = TaskMigrate;


// ===========================================================================

TaskMigrate.prototype.icon = function()  { return 'task_migrate'; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskMigrate.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskMigrate.prototype.currentVersion = function()  {
  var version = 0;
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


  TaskMigrate.prototype.makeInputPanel = function ( dataBox )  {
  // makes input panel for Import task; dataBox is not used as import task
  // does not have any input data from the project
  var nSeqInputs = 1;

    var div = this.makeInputLayout();

    this.setInputDataFields ( div.grid,0,dataBox,this );

    /*
    if ((this.state==job_code.new) || (this.state==job_code.running)) {
      div.header.setLabel ( ' ',2,0,1,1 );
      div.header.setLabel ( ' ',2,1,1,1 );
    } else
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );
    */
    if ((this.state!=job_code.new) && (this.state!=job_code.running))
      div.header.uname_inp.setValue ( this.uname.replace(/<(?:.|\n)*?>/gm, '') );

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;
    div.customData.file_mod    = {'rename':{},'annotation':[]}; // file modification and annotation

    div.upload_files = [];

    var row   = div.grid.getNRows();
    var title = '';
    if (row==0)  title = '<h2>Input Data</h2>';
           else  title = '&nbsp;<br><h3>Data to import and replace in revision</h3>';
    div.grid.setLabel ( title,row++,0,1,5 ).setFontItalic(true).setNoWrap();

    div.grid1 = div.grid.setGrid ( '',row,0,1,5 );
    row = 0;

    function setLabel ( rowNo,text,tooltip )  {
      var lbl = div.grid1.setLabel ( text,rowNo,0,1,1 ).setTooltip(tooltip)
                         .setFontItalic(true).setFontBold(true).setNoWrap();
      div.grid1.setVerticalAlignment ( rowNo,0,'middle' );
      return lbl;
    }

    function setFileSelect ( rowNo,label,tooltip,accept_str,fname )  {
      var lbl  = setLabel ( rowNo,label,tooltip );
      var fsel = div.grid1.setSelectFile ( false,accept_str,rowNo,2,1,1 );
      fsel.hide();
      var btn  = div.grid1.addButton ( 'Browse',image_path('open_file'),rowNo,2,1,1 );
//                          .setWidth_px ( 86 );
      var filename = fname;
      if (this.state==job_code.new)
        filename = '';

      div.grid1.setLabel ( '&nbsp;',rowNo,1,1,1 ).setNoWrap();
      var itext = div.grid1.setInputText ( filename,rowNo,3,1,2 )
                           .setWidth_px(400).setReadOnly(true).setNoWrap();
      div.grid1.setVerticalAlignment ( rowNo,2,'middle' );
      div.grid1.setVerticalAlignment ( rowNo,3,'middle' );
      div.grid1.setLabel ( '&nbsp;',rowNo,4,1,1 ).setNoWrap();
      btn.addOnClickListener ( function(){
        fsel.click();
      });
      fsel.addOnChangeListener ( function(){
        var files = fsel.getFiles();
        if (files.length>0)
          itext.setValue ( files[0].name );
      });
      return { 'label':lbl, 'fsel':fsel, 'browse':btn, 'itext':itext };
    }

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

    var ncols = div.grid1.getNCols();
    for (var i=1;i<ncols;i++)  {
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
    var msg = '';  // Ok if stays empty
    var file_hkl = inputPanel.select_hkl['fsel'].getFiles();
    var file_mtz = inputPanel.select_mtz['fsel'].getFiles();
    var file_xyz = inputPanel.select_xyz['fsel'].getFiles();

    if (file_hkl.length<=0)
      msg += '<b><i>Reflection data must be given</i></b>';
    if ((file_mtz.length<=0) && (file_xyz.length<=0))
      msg += '<b><i>Either phases or atomic coordinates, or both, must be given</i></b>';

    /*
    if ((file_hkl.length<=0) && (file_mtz.length<=0))
      msg += '<b><i>Either reflection data or density maps, or both, must be given</i></b>';
    if ((file_mtz.length<=0) && (file_xyz.length<=0))
      msg += '<b><i>Either density maps or atomic coordinates, or both, must be given</i></b>';
    */

    TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    return  msg;

  }

  //  This function is called when task is finally sent to FE to run. Should
  // execute function given as argument, or issue an error message if run
  // should not be done.
  TaskMigrate.prototype.doRun = function ( inputPanel,run_func )  {
  var files = [];
  var file_hkl = inputPanel.select_hkl['fsel'].getFiles();
  var file_mtz = inputPanel.select_mtz['fsel'].getFiles();
  var file_xyz = inputPanel.select_xyz['fsel'].getFiles();
  var file_lib = inputPanel.select_lib['fsel'].getFiles();

    if (file_hkl.length>0)  {
      files.push ( file_hkl );
      this.file_hkl = file_hkl[0].name;
    }
    if (file_mtz.length>0)  {
      files.push ( file_mtz );
      this.file_mtz = file_mtz[0].name;
    }
    if (file_xyz.length>0)  {
      files.push ( file_xyz );
      this.file_xyz = file_xyz[0].name;
    }
    if (file_lib.length>0)  {
      files.push ( file_lib );
      this.file_lib = file_lib[0].name;
    }

    if (files.length<0)  {
      new MessageBox ( 'Stop run','Task cannot be run as no data are<br>' +
                                  'given for upload' );
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

  /*
  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskMigrate.prototype.customDataClone = function ( task )  {
    //this.ha_type = task.ha_type;
    this.ligands = [];
    for (var i=0;i<task.ligands.length;i++)
      this.ligands.push ( { 'source' : task.ligands[i].source,
                            'smiles' : task.ligands[i].smiles,
                            'code'   : task.ligands[i].code } );
  }
  */

  // reserved function name
  TaskMigrate.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskMigrate.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.migrate', jobManager, jobDir, this.id];
  }

  module.exports.TaskMigrate = TaskMigrate;

}
