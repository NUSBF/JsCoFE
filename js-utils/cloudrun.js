
/*
 *
 *     UNDER DEVELOPMENT, DO NOT USE!
 *
 *  =================================================================
 *
 *    14.04.21   <--  Date of Last Modification.
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
var send_dir = require('../js-server/server.send_dir');
var utils    = require('../js-server/server.utils');
var cmd      = require('../js-common/common.commands');

var task_t        = require('../js-common/tasks/common.tasks.template');
var task_import   = require('../js-common/tasks/common.tasks.import');
var task_wflowamr = require('../js-common/tasks/common.tasks.wflowamr');
var task_wflowaep = require('../js-common/tasks/common.tasks.wflowaep');

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

function pickFile ( fnames,extList )  {
  for (var i=0;i<fnames.length;i++)  {
    var fext = path.parse(fnames[i]).ext.toLowerCase();
    if (extList.indexOf(fext)>=0)
      return [fnames[i]];
  }
  return [];
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

  // console.log ( post_options );
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

var annotation = {
  rename     : {},
  annotation : []
//  scalepack  : []
};

// {
//   "rename": {},
//   "annotation": [
//     {
//       "file": "seq.fasta",
//       "rename": "seq.fasta",
//       "items": [
//         {
//           "rename": "seq.fasta",
//           "contents": ">p9\nLVLKWVMSTKYVEAGELKEGSYVVIDGEPCRVVEIEKSKTGKHGSAKARIVAVGVFDGGKRTLSLPVDAQVEVPIIEKFT\nAQILSVSGDVIQLMDMRDYKTIEVPMKYVEEEAKGRLAPGAEVEVWQILDRYKIIRVKG",
//           "type": "protein"
//         }
//       ]
//     }
//   ],
//   "scalepack": {
//     "p9.sca": {
//       "wavelength": "0.98"
//     }
//   }
// }

var commands = input.trim().split('\n');
var ok       = true;
var fnames   = [];
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
        var fext  = path.parse(val).ext;
        var fname = path.parse(val).name;
        if (['.seq','.fasta','.pir'].indexOf(fext.toLowerCase())>=0)  {
          var annot = {
            file   : fname + fext,
            rename : fname + fext,
            items  : []
          };
          var content = utils.readString ( val.trim() ).split('>')
                             .filter(function(k){return k});
          for (var j=0;j<content.length;j++)  {
            content[j] = content[j].trim();
            if (content[j])  {
              var sfname = fname + fext;
              if (content.length>1)
                sfname = fname + '_' + (j+1) + fext;
              if (key.toLowerCase()=='file')
                    stype = 'protein';
              else  stype = key.toLowerCase().split('_').pop();
              annot.items.push ({
                rename   : sfname,
                contents : '>' + content[j],
                type     : stype
              });
            }
          }
          annotation.annotation.push ( annot );
        }
        fnames.push ( fname + fext );
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

if (['import','auto-mr','auto-ep','hop-on'].indexOf(meta.task)<0)  {
  ok = false;
  console.log ( ' *** task key ' + meta.task + ' is not valid' );
}

if (fnames.length<=0)
  console.log ( ' *** no files given for upload' );


if (files.hkl.length<=0)
  files.hkl = pickFile ( files.file,['.mtz'] );

if (files.seq_protein.length>0)
  files.seq = files.seq_protein;
else if (files.seq_dna.length>0)
  files.seq = files.seq_dna;
else if (files.seq_rna.length>0)
  files.seq = files.seq_rna;
else
  files.seq = pickFile ( files.file,['.seq','.fasta','.pir'] );

if (meta.task!='import')  {
  if (files.hkl.length<=0)  {
    ok = false;
    console.log ( ' *** reflection data is not provided' );
  }
  if ((meta.task!='hop-on') && (files.seq.length<=0))  {
    ok = false;
    console.log ( ' *** sequence data is not provided' );
  }
}


if ((!ok) ||(fnames.length<=0))  {
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

utils.writeObject ( path.join(dirPath,'annotation.json'),annotation );

console.log ( ' ... files copied to temporary location' );

// --------------------------------------------------------------------------
// Make task object

var task = null;

switch (meta.task)  {
  default :
  case 'import'  : task = new task_import.TaskImport  ();
                   task.upload_files = fnames;
                 break;
  case 'auto-mr' : task = new task_wflowamr.TaskWFlowAMR();
                   task.inputMode = task_t.input_mode.root;
                   task.file_select[0].path = path.parse(files.hkl[0]).base;
                   task.file_select[1].path = path.parse(files.seq[0]).base;
                 break;
  case 'auto-ep' : task = new task_wflowaep.TaskWFlowAEP();
                   task.inputMode = task_t.input_mode.root;
                   task.file_select[0].path = path.parse(files.hkl[0]).base;
                   task.file_select[1].path = path.parse(files.seq[0]).base;
                 break;
  case 'hop-on'  : task = new task_import.TaskImport  ();
                 break;
}

task.file_mod   = annotation; // file modification and annotation
task.project    = meta.project;
task.treeItemId = 'treeItemId';  // should not be empty

utils.writeObject ( path.join(dirPath,task_t.jobDataFName),task );


// --------------------------------------------------------------------------
// Make archive for upload

var archivePath = path.resolve ( send_dir.jobballName );
utils.removeFile ( archivePath );  // just in case

zl.archiveFolder ( dirPath,archivePath,{ followSymlinks : true } )
  .then(function() {
    console.log ( ' ... archived' );
    sendData ( archivePath,meta );
  }, function(err) {
    console.log ( ' *** zip packing error: ' + err );
    utils.removeFile ( archivePath );
  });
