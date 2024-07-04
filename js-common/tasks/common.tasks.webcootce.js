
/*
 *  =================================================================
 *
 *    14.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.webcootce.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Web-Coot Coordinate Editor Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2024
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.webcoot' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskWebCootCE()  {

  if (__template)  __template.TaskWebCoot.call ( this );
             else  TaskWebCoot.call ( this );

  this._type     = 'TaskWebCootCE';
  this.name      = 'webcoot (edit coordinates)';
  this.setOName ( 'webcootce' );  // default output file name template
  this.title     = 'Edit Coordinates with WebCoot/Moorhen';
  this.nc_type   = 'browser-secure';   // job runs in-browser
  this.fasttrack = true;  // forces immediate execution

  this.input_dtypes = [{        // input data types
      data_type   : {'DataStructure':['xyz'],
                     'DataXYZ'      :[],
                     'DataEnsemble' :[],
                     'DataModel'    :[]
                    }, // data type(s) and subtype(s)
      label       : 'Structure to edit', // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      version     : 0,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

}

if (__template)
  __cmd.registerClass ( 'TaskWebCootCE',TaskWebCootCE,__template.TaskWebCoot.prototype );
else    registerClass ( 'TaskWebCootCE',TaskWebCootCE,TaskWebCoot.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskWebCootCE.prototype.icon           = function()  { return 'task_webcootce'; }
TaskWebCootCE.prototype.clipboard_name = function()  { return '"WebCootCE"';    }

TaskWebCootCE.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'use for editing structure models without electron density with WebCoot/Moorhen';
}

TaskWebCootCE.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fit atoms and new ligands in electron density, validate and explore';
}

TaskWebCootCE.prototype.cloneItems = function() { return ['backups']; }

TaskWebCootCE.prototype.cleanJobDir = function ( jobDir )  {}

TaskWebCootCE.prototype.currentVersion = function()  {
let version = 0;
  if (__template)
        return  version + __template.TaskWebCoot.prototype.currentVersion.call ( this );
  else  return  version + TaskWebCoot.prototype.currentVersion.call ( this );
}

// function CootMBHotButton()  {
//   return {
//     'task'    : 'TaskWebCoot',
//     'tooltip' : 'Launch Coot for model building'
//   };
// }

TaskWebCootCE.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
    'webcoot','moorhen','coot','model','coordinate','editor'
  ]);
}

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskWebCootCE.prototype.hotButtons = function()  {
    return [];
    // return [RefmacHotButton()];
  }

  /*
  TaskWebCoot.prototype.launchWebApp = function ( callback_func,
                                                  mode='model-building',
                                                  update_interval=3000 )  {
    // new MessageBox('Web-app', '<h1>Web application</h1>');

    if (!checkBrowserForWebCoot())  {
      callback_func ( false,'Moorhen' );
      return;
    }

    let title = '[' + padDigits(this.id,4) + '] ';
    if (this.uname.length>0)  title += this.uname;
                        else  title += this.name;
    let wab = new WebAppBox ( title );
    wab.setOnCloseFunction ( function(){
      callback_func ( getCommunicationFrameData(wab.fid,'was_output'),'Moorhen' ); 
    });
    wab.setOnToolbarCloseFunction ( function(){
      __comm_iframes[wab.fid].iframe.getWindow().postMessage ({
        command: 'call_exit'
      });
      return true;
    });
    wab.launch();
    // setCommunicationFrameData ( wab.fid,'was_output',false );

    let istruct    = this.input_data.data['revision'][0];
    let isubstruct = null;
    if (istruct._type=='DataRevision')  {
      istruct    = this.input_data.data['revision'][0].Structure;
      isubstruct = this.input_data.data['revision'][0].Substructure;
    }

    let viewSettings = null;

    let inputFiles = [];
    
    if ('ligand' in this.input_data.data)  {
      let ligands = this.input_data.data['ligand'];
      for (let i=0;i<ligands.length;i++)
        if (file_key.lib in ligands[i].files)  {
          let ligURL = this.getURL ( 'input/' + ligands[i].files[file_key.lib] );
          inputFiles.push ({
            type : 'ligand',
            // args : [ ligURL ]
            args : [ ligURL,[ligands[i].code] ]
          });
        }
    }

    if (istruct)  {
      let refkeys = getRefKeys ( istruct,this._type );
      if (refkeys)
        viewSettings = refkeys.keywords;
      if (file_key.lib in istruct.files)  {
        let libURL = this.getURL ( 'input/' + istruct.files[file_key.lib] );
        inputFiles.push ({
          type : 'ligand',
          args : [ libURL,[] ]
        });
      }
      if ((file_key.xyz in istruct.files) || (file_key.mmcif in istruct.files))  {
        let xyzURL = 'input/';
        if (file_key.mmcif in istruct.files)
              xyzURL = this.getURL ( xyzURL + istruct.files[file_key.mmcif] );
        else  xyzURL = this.getURL ( xyzURL + istruct.files[file_key.xyz]   );
        inputFiles.push ({
          type : 'pdb',
          args : [ xyzURL,'molecule' ]
        });
      }
      if (file_key.mtz in istruct.files)  {
        let mtzURL = this.getURL ( 'input/' + istruct.files[file_key.mtz] );
        if (istruct.FWT)
          inputFiles.push ({
            type : 'mtz',
            args : [ mtzURL,'map',{
                        F              : istruct.FWT,
                        PHI            : istruct.PHWT,
                        Fobs           : istruct.FP,
                        SigFobs        : istruct.SigFP,
                        FreeR          : istruct.FreeR_flag,
                        isDifference   : false,
                        useWeight      : false,
                        calcStructFact : istruct.FP && istruct.SigFP && 
                                         istruct.FreeR_flag
                      }]
          });
        if (istruct.DELFWT)
          inputFiles.push ({
            type : 'mtz',
            args : [ mtzURL,'diff-map',{
                        F              : istruct.DELFWT,
                        PHI            : istruct.PHDELWT,
                        isDifference   : true,
                        useWeight      : false,
                        calcStructFact : false
                      }]
          });
        if (istruct.FAN)
          inputFiles.push ({
            type : 'mtz',
            args : [ mtzURL,'anom-map',{
                        F              : istruct.FAN,
                        PHI            : istruct.PHAN,
                        isDifference   : false,
                        useWeight      : false,
                        calcStructFact : false
                      }, {
                        mapColour: { r: 0.733, g: 0.2, b: 1.0 }
                      }]
          });
        if (istruct.DELFAN)
          inputFiles.push ({
            type : 'mtz',
            args : [ mtzURL,'anom-diff-map',{
                        F              : istruct.DELFAN,
                        PHI            : istruct.PHDELAN,
                        isDifference   : true,
                        useWeight      : false,
                        calcStructFact : false
                      }, {
                        positiveDiffColour: { r: 0.055, g: 0.4, b: 0.333 },
                        negativeDiffColour: { r: 0.98 , g: 0.5, b: 0.45  }
                      }]
          });
      }
    }

    if (isubstruct)  {
      if (!viewSettings)  {
        let refkeys = getRefKeys ( isubstruct,this._type );
        if (refkeys)
          viewSettings = refkeys.keywords;
      }
      if (file_key.mtz in isubstruct.files)  {
        let mtzURL = this.getURL ( 'input/' + isubstruct.files[file_key.mtz] );
        if (isubstruct.FAN)
          inputFiles.push ({
            type : 'mtz',
            args : [ mtzURL,'anom-substr-map',{
                        F              : isubstruct.FAN,
                        PHI            : isubstruct.PHAN,
                        // Fobs           : isubstruct.FP,
                        // SigFobs        : isubstruct.SigFP,
                        // FreeR          : isubstruct.FreeR_flag,
                        isDifference   : false,
                        useWeight      : false,
                        calcStructFact : false
                      }, {
                        mapColour: { r: 0.686, g: 0.376, b: 0.102 }
                      }]
          });
      }
    }

    if ('aux_struct' in this.input_data.data)  {
      let aux_struct = this.input_data.data['aux_struct'];
      for (let i=0;i<aux_struct.length;i++)
        if (file_key.xyz in aux_struct[i].files)  {
          if (!viewSettings)  {
            let refkeys = getRefKeys ( aux_struct[i],this._type );
            if (refkeys)
              viewSettings = refkeys.keywords;
          }
          let structURL = this.getURL ( 'input/' + aux_struct[i].files[file_key.xyz] );
          inputFiles.push ({
            type : 'pdb',
            args : [ structURL,'molecule_' + (i+1) ]
          });
        }
    }

    let params = {
      mode         : mode,
      inputFiles   : inputFiles,
      interval     : update_interval,
      no_data_msg  : '<h2>Data not found</h2>',
      preferences  : __user_settings.webcoot_pref,
      viewSettings : viewSettings,
      sf_meta      : { project : this.project,
                       id      : this.id,
                       fid     : wab.fid
                     },
      wdirURL      : this.getURL('')
    };

    // console.log ( JSON.stringify(inputFiles) );

    // console.log (  JSON.stringify(inputFiles) );

    fetchFile ( 'js-lib/webCoot/webcoot.html',
      function(text){
        let dark_mode_html = '';
        if (('__active_color_mode' in window) && (window.__active_color_mode=='dark'))  {
          let dark_mode  = window.parent.__user_settings.color_modes.dark_mode;
          let dinvert    = 2.0 - dark_mode.invert;
          let dhue       = -dark_mode.hue;
          dark_mode_html = '  let scene = document.getElementById("root");\n' +
                           '  scene.style.setProperty("filter","invert(' + dinvert + 
                           ') hue-rotate(' + dhue + 'deg) ' + 
                           '");\n';
        }
        wab.iframe.setHTML (
          // text.replace ( '[[baseurl]]',
          //                window.location + 'js-lib/webCoot/webcoot.html' )
          text.replaceAll ( '[[prefix]]','js-lib/webCoot' )
              .replace ( '</body>',
                         '  <script type="text/javascript"  defer="defer">\n'  + 
                         '   runWebCoot ( ' + JSON.stringify(params) + ' );\n' +
                         dark_mode_html  +
                         '  </script>\n' +
                         '</body>'
                       )
        );
      },
      null,
      function(errcode){
        new MessageBox ( 'File not found',
            'file not found','msg_error' );
      });

  }
  */

} else  {
  //  for server side
  /*
  const path  = require('path');
  const conf  = require('../../js-server/server.configuration');
  const prj   = require('../../js-server/server.fe.projects');
  const utils = require('../../js-server/server.utils');
  // let dtemp = require('../../js-common/dtypes/common.dtypes.template');

  TaskWebCoot.prototype.makeInputData = function ( loginData,jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    let revision = null;
    let istruct  = this.input_data.data['revision'][0];
    let istruct2 = null;
    if (istruct._type=='DataRevision')  {
      revision = this.input_data.data['revision'][0];
      if (revision.Options.leading_structure=='substructure')  {
        istruct  = revision.Substructure;
        istruct2 = revision.Structure;
      } else  {
        istruct  = revision.Structure;
        istruct2 = revision.Substructure;
      }
      if (istruct2 && ('load_all' in revision.Options) && revision.Options.load_all)
        this.input_data.data['istruct2'] = [istruct2];
    }
    this.input_data.data['istruct'] = [istruct];

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

    if (istruct && ('coot_meta' in istruct) && istruct.coot_meta)  {
      let coot_meta = istruct.coot_meta;
      let srcJobDir = prj.getSiblingJobDirPath ( jobDir,coot_meta.jobId );
      for (let i=0;i<coot_meta.files.length;i++)
        utils.copyFile ( path.join(srcJobDir,coot_meta.files[i]),
                         path.join(jobDir,coot_meta.files[i]) );
    }

    // initialise backup directory
    let backupsDirPath = path.join ( jobDir,'backups' );
    utils.mkDir_check ( backupsDirPath );
    let backupsListFPath = path.join ( backupsDirPath,'backups.json' );
    if (!utils.fileExists(backupsListFPath))
      utils.writeString ( backupsListFPath,'[]' );

  }

  TaskWebCoot.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.webcoot', jobManager, jobDir,this.id ];
  }

  // -------------------------------------------------------------------------
  */

  module.exports.TaskWebCootCE = TaskWebCootCE;

}
