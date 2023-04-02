
/*
 *  =================================================================
 *
 *    02.04.23   <--  Date of Last Modification.
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

  this._type   = 'TaskWebCoot';
  this.name    = 'webcoot (model building)';
  this.setOName ( 'webcoot' );  // default output file name template
  this.title   = 'Model Building with WebCoot/Moorhen';
  this.nc_type = 'browser';     // job runs in-browser

  this.input_dtypes = [{        // input data types
      data_type   : {'DataRevision':['!phases']}, // data type(s) and subtype(s)
      label       : 'Structure revision',         // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'coot-mb',  // lay custom fields below the dropdown
      version     : 4,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    /*
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

}


if (__template)
      TaskWebCoot.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWebCoot.prototype = Object.create ( TaskTemplate.prototype );
TaskWebCoot.prototype.constructor = TaskWebCoot;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskWebCoot.prototype.icon = function()  { return 'task_webcoot'; }

TaskWebCoot.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'fit atoms and new ligands in electron density, validate and explore';
}

TaskWebCoot.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fit atoms and new ligands in electron density, validate and explore';
}

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

  // TaskWebCoot.prototype.makeHtml = function()  {
  //   var html = [
  //     '<!doctype html>',
  //     '<html lang="en" class="scroller">',
  //     '<head>',
  //       '<title>Moorhen</title>',
  //       '<meta charset="utf-8"/>',
  //       '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
  //       '<meta name="theme-color" content="#000000"/>',
  //       '<meta name="description" content="Web site created using create-react-app"/>',
  //       '<link rel="icon" href="./favicon.ico"/>',
  //       '<link rel="apple-touch-icon" href="./public/logo192.png"/>',
  //       '<link rel="manifest" href="./manifest.json"/>',
  //       '<link rel="icon" href="./favicon.ico">',
  //       '<link href="./maindd0ddc75c24601355a61.css" rel="stylesheet">',
  //       '<script>// See https://github.com/facebook/react/issues/20829#issuecomment-802088260',
  //         'if (!crossOriginIsolated) SharedArrayBuffer = ArrayBuffer;',
  //         'window.onload = () => {',
  //           'createCCP4Module({',
  //             'print(t) { console.log(["output", t]) },',
  //             'printErr(t) { console.log(["output", t]); }',
  //           '})',
  //           '.then(function (CCP4Mod) {',
  //             'window.CCP4Module = CCP4Mod;',
  //           '})',
  //           '.catch((e) => {',
  //             'console.log("CCP4 problem :(");',
  //             'console.log(e);',
  //           '});',
  //         '}',
  //       '</script>',
  //       '<script src="./baby-gru/wasm/web_example.js"></script>',
  //       '<script>',
  //         'window.moorhenInput = {',
  //           'rootId: "root",',
  //           'urlPrefix: ".",',
  //           'inputFiles: [',
  //             '{type: "pdb", args: ["./baby-gru/tutorials/moorhen-tutorial-structure-number-1.pdb", "molecule"]},',
  //             '{type: "mtz", args: [',
  //               '"./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "map",', 
  //               '{F: "FWT", PHI: "PHWT", Fobs: "F", SigFobs: "SIGF", FreeR: "FREER", isDifference: false, useWeight: false, calcStructFact: true}',
  //             ']},',
  //             '{type: "mtz", args: [',
  //               '"./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "diff-map",',
  //               '{F: "DELFWT", PHI: "PHDELWT", isDifference: true, useWeight: false, calcStructFact: false}',
  //             ']}',
  //           ']',
  //         '}',
  //       '</script>',
  //       '<script defer="defer" src="./main.js"></script>',
  //     '</head>',
  //     '<body>',
  //       '<noscript>You need to enable JavaScript to run this app.</noscript>',
  //       '<div id="root"></div>',
  //     '</body>',
  //     '</html>'
  //   ];

  // }


  TaskWebCoot.prototype.launchWebApp = function ( callback_func,
                                                  mode='model-building',
                                                  update_interval=3000 )  {
    // new MessageBox('Web-app', '<h1>Web application</h1>');

    if (!checkBrowserForWebCoot())  {
      callback_func();
      return;
    }

    var wab = new WebAppBox ( 'Web-Coot' );
    wab.setOnCloseFunction ( function(){ callback_func(); } );
    wab.launch();

    var self = this;

    fetchFile ( 'js-lib/webCoot/webcoot.html',
      function(text){

        var html = text.replace ( '[[baseurl]]',
                                   window.location + 'js-lib/webCoot/webcoot.html' )
                       .replace ( '[[mode]]',mode )
                       .replace ( '[[interval]]',update_interval.toString() )
                       .replace ( '[[no_data_msg]]','<h2>Data not found</h2>')
                       .replace ( '[[preferences]]',JSON.stringify(__user_settings.webcoot_pref) );

        var istruct = self.input_data.data['revision'][0].Structure;

        var inputFiles = [];
        if (istruct)  {
          if (file_key.xyz in istruct.files)  {
            var pdbURL = self.getURL ( 'input/' + istruct.files[file_key.xyz] );
            inputFiles.push ({
              type : 'pdb',
              args : [ pdbURL,'molecule' ]
            });
          }
          if (file_key.mtz in istruct.files)  {
            var mtzURL = self.getURL ( 'input/' + istruct.files[file_key.mtz] );
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
                           calcStructFact : true
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
          }
        }

    //   { type: "mtz", 
    //     args: [ "./baby-gru/tutorials/moorhen-tutorial-map-number-1.mtz", "diff-map",
    //             { F              : "DELFWT",
    //               PHI            : "PHDELWT", 
    //               isDifference   : true, 
    //               useWeight      : false, 
    //               calcStructFact : false
    //             }
    //           ]



        html = html.replace ( '[[meta]]',JSON.stringify({'project':self.project,'id':self.id}) )
                   .replace ( '[[inputFiles]]',JSON.stringify(inputFiles) );

        wab.iframe.setHTML ( html );

      },
      null,
      function(errcode){
        new MessageBox ( 'File not found',
            'file not found','msg_error' );
      });

  }

} else  {
  //  for server side

  var path  = require('path');
  var conf  = require('../../js-server/server.configuration');
  var prj   = require('../../js-server/server.fe.projects');
  var utils = require('../../js-server/server.utils');
  var dtemp = require('../../js-common/dtypes/common.dtypes.template');

  TaskWebCoot.prototype.makeInputData = function ( loginData,jobDir )  {

    // put structure data in input databox for copying their files in
    // job's 'input' directory

    var istruct  = null;
    var istruct2 = null;
    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
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
      var coot_meta = istruct.coot_meta;
      var srcJobDir = prj.getSiblingJobDirPath ( jobDir,coot_meta.jobId );
      for (var i=0;i<coot_meta.files.length;i++)
        utils.copyFile ( path.join(srcJobDir,coot_meta.files[i]),
                         path.join(jobDir,coot_meta.files[i]) );
    }

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
