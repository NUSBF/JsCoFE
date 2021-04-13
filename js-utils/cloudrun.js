
/*
 *
 *     UNDER DEVELOPMENT, DO NOT USE!
 *
 *  =================================================================
 *
 *    01.02.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/cloudrun.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Initiation of Cloud projects from command line
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2021
 *
 *  =================================================================
 *
 * Invocation:
 *
 *    node js-utils/cloudrun.js task_file
 *
 * where task_file may be also the standard input:
 *
 *    node js-utils/cloudrun.js <<eof
 *    ..commands..
 *    eof
 *
 * Commands:
 *
 *   URL         https://ccp4cloud.server    (mandatory)
 *   USER        user_login                  (mandatory)
 *   PROJECT     project_id                  (mandatory)
 *   TITLE       Optional Project Title
 *   TASK        [import|auto-mr|auto-ep|hop-on]  (import if not given)
 *   FILE        /path/to/file.[mtz|pdb|seq|fasta|pir|cif]
 *   HKL         /path/to/file.mtz
 *   PHASES      /path/to/file.mtz
 *   SEQ_PROTEIN /path/to/file.[seq|fasta|pir]
 *   SEQ_DNA     /path/to/file.[seq|fasta|pir]
 *   SEQ_RNA     /path/to/file.[seq|fasta|pir]
 *   XYZ         /path/to/file.pdb
 *   LIGAND      /path/to/file.cif
 *
 *  Notes:
 *    - if project does not exist, it will be created
 *    - requested task will be always placed at project root
 *
 */

//  load system modules
var fs      = require("fs-extra");
var request = require('request' );
var path    = require('path');
var zl      = require('zip-lib');

//  load application modules
var utils   = require('../js-server/server.utils');
var cmd     = require('../js-common/common.commands');

// var conf   = require('../js-server/server.configuration');
// var cmd    = require('../js-common/common.commands');


// ==========================================================================

function printInstructions()  {
  console.log (
    '\nUsage:\n'   +
    '~~~~~~\n\n' +
    '(1) node js-utils/cloudrun.js command_file\n\n' +
    'where "command_file" is path to file with run instructions. If this file is\n' +
    'omitted, then instructions are read from standard input:\n\n' +
    '(2) node js-utils/cloudrun.js <<eof\n' +
    '    ..commands..\n' +
    '    eof\n\n'
  );
  process.exit();
}

function sendData ( filePath,metaData )  {

  var formData = {};
  for (key in metaData)
    formData[key] = metaData[key];

  formData['file'] = fs.createReadStream ( filePath );

  var post_options = {
    url      : meta.url + '/' + cmd.fe_command.cloudRun,
    formData : formData
  };

  console.log ( post_options );
  console.log ( ' ... sending' );

  request.post ( post_options, function(err,httpResponse,response){
    if (err) {
      console.log ( ' *** send failed: ' + err );
    } else  {
      try {
        var resp = JSON.parse ( response );
        if (resp.status==cmd.fe_retcode.ok)  {
          console.log ( ' ... received safely' );
        } else  {
          console.log ( ' *** cloud run initiation failed, rc=' + resp.status +
                        '\n *** ' + resp.message );
        }
      } catch(err)  {
        console.log ( ' *** unparseable server reply: ' + response );
      }
    }
    utils.removeFile ( filePath );
  });

}

// --------------------------------------------------------------------------
// Parse command file

var input = '';

if (process.argv.length==3)  {
  // command file given
  input = utils.readString(process.argv[2]);
} else if (process.argv.length==2)  {
  // read from standard input
  input = utils.readString(0);  // fs.readFileSync(0); // STDIN_FILENO = 0
}

if (!input)
  printInstructions();

var meta = {
  url     : '',
  user    : '',
  project : '',
  title   : '*',
  task    : 'import'
};

var files = {
  file        : [],
  hkl         : [],
  phases      : [],
  seq_protein : [],
  seq_dna     : [],
  seq_rna     : [],
  xyz         : [],
  ligand      : []
};


var commands = input.trim().split('\n');
var ok       = true;
var nfiles   = 0;
console.log ( ' ========== COMMANDS:' );
for (var i=0;i<commands.length;i++)  {
  commands[i] = commands[i].trim();
  console.log ( ' \$ ' + commands[i] );
  if (commands[i] && (!commands[i].startsWith('#')))  {
    var lst = commands[i].split(' ');
    if (lst.length>1)  {
      var key = lst[0].toLowerCase();
      var val = lst.slice(1).join(' ').trim();
      if (key in meta)
        meta[key] = val;
      else if (key in files)  {
        files[key].push ( val );
        nfiles++;
      } else  {
        console.log ( '   ^^^^ unknown key' );
        ok = false;
      }
    } else  {
      console.log ( '   ^^^^ misformatted line' );
      ok = false;
    }
  }
}
console.log ( ' ============================================================' );

if (!ok)  {
  console.log ( '\n **** ERRORS IN COMMANDS -- STOP\n\n' );
  printInstructions();
}


// --------------------------------------------------------------------------
// Check that input is sufficient

for (var key in meta)
  if (!meta[key])  {
    ok = false;
    console.log ( ' *** ' + key.toUpperCase() + ' not specified' );
  }

if (nfiles<=0)
  console.log ( ' *** no files given for upload' );

if ((!ok) ||(nfiles<=0))  {
  console.log ( '\n  *** STOP DUE TO INSUFFICIENT INPUT' );
  process.exit();
}

if (meta.title=='*')
  meta.title = meta.project + ' initiated by script';


// --------------------------------------------------------------------------
// Make template directory for upload

var dirPath    = 'import_dir';
var uploadsDir = path.join ( dirPath,'uploads' );

utils.removePath ( dirPath );   // just in case
utils.mkDir ( dirPath    );
utils.mkDir ( uploadsDir );

for (var key in files)  {
  for (var i=0;i<files[key].length;i++)  {
    var fpath = files[key][i];
    utils.copyFile ( fpath,path.join(uploadsDir,path.basename(fpath)) );
  }
}

console.log ( ' ... files copied to temporary location' );


// --------------------------------------------------------------------------
// Make archive for upload

var archivePath = path.resolve ( '__dir.zip' );
utils.removeFile ( archivePath );  // just in case

zl.archiveFolder ( dirPath,archivePath,{ followSymlinks : true } )
  .then(function() {
    console.log ( ' ... archived' );
    sendData ( archivePath,meta );
  }, function(err) {
    console.log ( ' *** zip packing error: ' + err );
    utils.removeFile ( archivePath );
  });
