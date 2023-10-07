
/*
 *  =================================================================
 *
 *    07.10.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.webcoot.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Web-Coot Model Building Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2023
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskWebCoot()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskWebCoot';
  this.name      = 'webcoot (interactive model building)';
  this.setOName ( 'webcoot' );  // default output file name template
  this.title     = 'Model Building with WebCoot/Moorhen';
  this.nc_type   = 'browser-secure';   // job runs in-browser
  this.fasttrack = true;  // forces immediate execution

  this.input_dtypes = [{        // input data types
      data_type   : {'DataRevision':['!phases']}, // data type(s) and subtype(s)
      label       : 'Structure revision',         // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'coot-mb',  // lay custom fields below the dropdown
      version     : 4,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':[],'DataEnsemble':[],
                     'DataModel':[],'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Additional structures', // label for input dialog
      inputId     : 'aux_struct', // input Id for referencing input fields
      version     : 0,            // minimum data version allowed
      min         : 0,            // minimum acceptable number of data instances
      max         : 20            // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data', // label for input dialog
      inputId     : 'ligand',      // input Id for referencing input fields
      min         : 0,             // minimum acceptable number of data instances
      max         : 1              // maximum acceptable number of data instances
    /*
    },{    // input data for making new ligand names
      data_type   : {'DataLigand':[]}, // this item is only for having list of
                                       // all ligands imported or generated
                                       // (not only those in revision)
      label       : '',        // no label for void data entry
      inputId     : 'void1',   // prefix 'void' will hide entry in import dialog
      version     : 0,         // minimum data version allowed
      force       : 1000,      // "show" all revisions available
      min         : 0,         // minimum acceptable number of data instances
      max         : 1000       // maximum acceptable number of data instances
    */
    }
  ];

  this.parameters = { // input parameters
    NOTE : {  type     : 'label',
              label    : '<center style="white-space:normal;color:grey"><i>&nbsp;<p>' +
                         '<h2>This Task is Experimental</h2>' +
                         'WebCoot/Moorhen is developing fast aiming to deliver ' +
                         'Coot functionality in-browser; many Coot functions are ' +
                         'currently missing.<p>Please try it now and check ' +
                         'regularly in future!<br>Any feedback is highly appreciated.' +
                         '</i></center>',
              lwidth   : 500,
              position : [0,1,1,4]
           }
  };


}


if (__template)
      TaskWebCoot.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWebCoot.prototype = Object.create ( TaskTemplate.prototype );
TaskWebCoot.prototype.constructor = TaskWebCoot;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskWebCoot.prototype.icon           = function()  { return 'task_webcoot'; }
TaskWebCoot.prototype.clipboard_name = function()  { return '"WebCoot"';    }

TaskWebCoot.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return '<b>!!EXPERIMENTAL!!</b> fast-developing version of Coot for browsers';
}

TaskWebCoot.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fit atoms and new ligands in electron density, validate and explore';
}

TaskWebCoot.prototype.cloneItems = function() { return ['backups']; }

//TaskWebCoot.prototype.cleanJobDir = function ( jobDir )  {}

TaskWebCoot.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// function CootMBHotButton()  {
//   return {
//     'task'    : 'TaskWebCoot',
//     'tooltip' : 'Launch Coot for model building'
//   };
// }

TaskWebCoot.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,[
      'webcoot','moorhen','coot','model','building','manual-mb','mb','coordinate','editor'
    ]);
  }

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskWebCoot.prototype.hotButtons = function()  {
    return [RefmacHotButton()];
  }

  TaskWebCoot.prototype.launchWebApp = function ( callback_func,
                                                  mode='model-building',
                                                  update_interval=3000 )  {
    // new MessageBox('Web-app', '<h1>Web application</h1>');

    if (!checkBrowserForWebCoot())  {
      callback_func ( false,'Moorhen' );
      return;
    }

    var title = '[' + padDigits(this.id,4) + '] ';
    if (this.uname.length>0)  title += this.uname;
                        else  title += this.name;
    var wab = new WebAppBox ( title );
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

    var istruct    = this.input_data.data['revision'][0].Structure;
    var isubstruct = this.input_data.data['revision'][0].Substructure;

    var viewSettings = null;

    var inputFiles = [];
    
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
        var libURL = this.getURL ( 'input/' + istruct.files[file_key.lib] );
        inputFiles.push ({
          type : 'ligand',
          args : [ libURL,[] ]
        });
      }
      if (file_key.xyz in istruct.files)  {
        var pdbURL = this.getURL ( 'input/' + istruct.files[file_key.xyz] );
        inputFiles.push ({
          type : 'pdb',
          args : [ pdbURL,'molecule' ]
        });
      }
      if (file_key.mtz in istruct.files)  {
        var mtzURL = this.getURL ( 'input/' + istruct.files[file_key.mtz] );
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
        var mtzURL = this.getURL ( 'input/' + isubstruct.files[file_key.mtz] );
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

    var params = {
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

    // console.log (  JSON.stringify(inputFiles) );

    fetchFile ( 'js-lib/webCoot/webcoot.html',
      function(text){
        wab.iframe.setHTML (
          // text.replace ( '[[baseurl]]',
          //                window.location + 'js-lib/webCoot/webcoot.html' )
          text.replaceAll ( '[[prefix]]','js-lib/webCoot' )
              .replace ( '</body>',
                         '  <script type="text/javascript"  defer="defer">\n' + 
                         '   runWebCoot ( ' + JSON.stringify(params) + ' );\n' +
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

} else  {
  //  for server side

  const path  = require('path');
  const conf  = require('../../js-server/server.configuration');
  const prj   = require('../../js-server/server.fe.projects');
  const utils = require('../../js-server/server.utils');
  // var dtemp = require('../../js-common/dtypes/common.dtypes.template');

  TaskWebCoot.prototype.makeInputData = function ( loginData,jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    let istruct  = null;
    let istruct2 = null;
    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      if (revision.Options.leading_structure=='substructure')  {
        istruct  = revision.Substructure;
        istruct2 = revision.Structure;
      } else  {
        istruct  = revision.Structure;
        istruct2 = revision.Substructure;
      }
      this.input_data.data['istruct'] = [istruct];
      if (istruct2 && ('load_all' in revision.Options) && revision.Options.load_all)
        this.input_data.data['istruct2'] = [istruct2];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

    if (istruct && ('coot_meta' in istruct) && istruct.coot_meta)  {
      let coot_meta = istruct.coot_meta;
      let srcJobDir = prj.getSiblingJobDirPath ( jobDir,coot_meta.jobId );
      for (var i=0;i<coot_meta.files.length;i++)
        utils.copyFile ( path.join(srcJobDir,coot_meta.files[i]),
                         path.join(jobDir,coot_meta.files[i]) );
    }

    // initialise backup directory
    let backupsDirPath = path.join ( jobDir,'backups' );
    utils.mkDir_check ( backupsDirPath );
    let backupsListFPath = path.join ( backupsDirPath,'backups.json' );
    if (!utils.fileExists(backupsListFPath))
      utils.writeString ( backupsListFPath,'[]' );

    // var cfg = conf.getFEProxyConfig();
    // if (!cfg)
    //   cfg = conf.conf.getFEConfig();

    // var html = utils.readString ( path.join(process.cwd(),'js-lib','webCoot','webcoot.html') );

    // html = html.replace ( '[[baseurl]]',cfg.externalURL + '/js-lib/webCoot/webcoot.html' );

    // inputFiles = [];
    // if (istruct)  {
    //   inputFiles.push ({
    //     'type' : 'pdb',
    //     'args' : [this.getURL('input/'),'molecule']
    //   });
    // }

    // var inputFiles = [
    //   '[',
    //     '{type: "pdb", args: ["./baby-gru/tutorials/moorhen-tutorial-structure-number-1.pdb", "molecule"]},',
    //     '{type: "mtz", args: ["./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "map",',
    //       '{F: "FWT", PHI: "PHWT", Fobs: "F", SigFobs: "SIGF", FreeR: "FREER", isDifference: false, useWeight: false, calcStructFact: true}',
    //     ']},',
    //     '{type: "mtz", args: ["./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "diff-map",',
    //       '{F: "DELFWT", PHI: "PHDELWT", isDifference: true, useWeight: false, calcStructFact: false}',
    //     ']}',
    //   ']'
    // ];

    // var inputFiles = [];
    // if (istruct)  {
    //   if (dtemp.file_key.xyz in istruct.files)  {
    //     var pdbURL = this.getURL ( 'input/' + istruct.files[dtemp.file_key.xyz] );
    //     inputFiles.push ({
    //       type : 'pdb',
    //       args : [ pdbURL,'molecule' ]
    //     });
    //   }
    //   if (dtemp.file_key.mtz in istruct.files)  {
    //     var mtzURL = this.URL ( 'input/' + istruct.files[dtemp.file_key.mtz] );
    //     if (istruct.FWT)
    //       inputFiles.push ({
    //         type : 'mtz',
    //         args : [ mtzURL,'map',{
    //                   F              : istruct.FWT,
    //                   PHI            : istruct.PHWT,
    //                   Fobs           : istruct.FP,
    //                   SigFobs        : istruct.SigFP,
    //                   FreeR          : istruct.FreeR_flag,
    //                   isDifference   : false,
    //                   useWeight      : false,
    //                   calcStructFact : true
    //                 }]
    //       });
    //   }
    // }


    // var inputFiles = [
    //   { type: "pdb", 
    //     args: ["./baby-gru/tutorials/moorhen-tutorial-structure-number-1.pdb", "molecule" ]
    //   },
    //   { type: "mtz", 
    //     args: [ "./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "map",
    //             { F              : "FWT",
    //               PHI            : "PHWT",
    //               Fobs           : "F",
    //               SigFobs        : "SIGF",
    //               FreeR          : "FREER",
    //               isDifference   : false,
    //               useWeight      : false,
    //               calcStructFact : true
    //             }
    //           ]
    //   },
    //   { type: "mtz", 
    //     args: [ "./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "diff-map",
    //             { F              : "DELFWT",
    //               PHI            : "PHDELWT", 
    //               isDifference   : true, 
    //               useWeight      : false, 
    //               calcStructFact : false
    //             }
    //           ]
    //   }
    // ];

    // html = html.replace ( '[[inputFiles]]',JSON.stringify(inputFiles,null,2) );
    // html = html.replace ( '[[inputFiles]]',inputFiles.join('\n') )

    // utils.writeString ( path.join(jobDir,'webcoot.html'),html );

    // utils.copyFile ( path.join(process.cwd(),'js-lib','webCoot','webcoot.html'),
    //                  path.join(jobDir,'webcoot.html') );


    // inputFiles: [
    //   {type: 'pdb', args: ["./baby-gru/tutorials/moorhen-tutorial-structure-number-1.pdb", "molecule"]},
    //   {type: 'mtz', args: [
    //     "./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "map", 
    //     {F: "FWT", PHI: "PHWT", Fobs: 'F', SigFobs: 'SIGF', FreeR: 'FREER', isDifference: false, useWeight: false, calcStructFact: true}
    //   ]},
    //   {type: 'mtz', args: [
    //     "./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", 'diff-map',
    //     {F: "DELFWT", PHI: "PHDELWT", isDifference: true, useWeight: false, calcStructFact: false}
    //   ]}
    // ]

  }

  TaskWebCoot.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.webcoot', jobManager, jobDir,this.id ];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskWebCoot = TaskWebCoot;

}
