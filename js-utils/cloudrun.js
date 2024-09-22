
/*
 *
 *  =================================================================
 *
 *    22.09.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2021-2024
 *
 *  =================================================================
 *
 * Invocation:
 *
 *    node js-utils/cloudrun.js -c command_file
 *
 * where task_file may be also the standard input:
 *
 *    node js-utils/cloudrun.js -i <<eof
 *    ..commands..
 *    eof
 *
 * Generate template command files (prints to console):
 *
 *    node js-utils/cloudrun.js -t task
 *
 * Obtaining help:
 *
 *    node js-utils/cloudrun.js
 *    node js-utils/cloudrun.js -h
 *
 * where task is one of import, auto-af2, auto-mr, auto-ep, hop-on, auto-ref or
 * dimple.
 *
 * Commands (hash # may be used for comments, anything on the right from # is
 * ignored):
 *
 *   URL         https://ccp4cloud.server    # mandatory
 *   USER        user_login                  # mandatory
 *   CLOUDRUN_ID aaaa-bbbb-cccc-dddd         # mandatory
 *   AUTH_FILE   /path/to/auth.dat           # alternative to USER/CLOUDRUN_ID
 *   PROJECT     project_id                  # mandatory
 *   LOAD_PROJECT [yes|no]                   # optional, default "no"
 *   TITLE       Optional Project Title      # used only if project is created
 *   FOLDER      Optional Project Folder     # used only if project is created
 *   TASK        [import|auto-af2|auto-mr|auto-ep|hop-on|auto-ref|dimple]
 *                                           # if TASK is not given, 'import' is assumed
 *   HA_TYPE     Se                          # used only for auto-ep
 *   FILE        /path/to/file.[mtz|pdb|seq|fasta|pir|cif]  # generic import
 *   HKL         /path/to/file.mtz           # the file should be used as hkl in hop-on
 *   PHASES      /path/to/file.mtz           # the file should be used as phases in hop-on
 *   SEQ_PROTEIN /path/to/file.[seq|fasta|pir]
 *   SEQ_DNA     /path/to/file.[seq|fasta|pir]
 *   SEQ_RNA     /path/to/file.[seq|fasta|pir]
 *   XYZ         /path/to/file.pdb
 *   LIGAND      /path/to/file.cif   # ML or ligand library file
 *   SMILES      smiles-string       # ligand smiles string, not enquoted
 *
 *  Note:
 *    - if sequence file is given by the FILE keyword, protein sequence is assumed
 *    - if project does not exist, it will be created
 *    - requested task will be always placed at project root
 *
 */

//  load system modules
const fs      = require("fs-extra");
const request = require('request' );
const path    = require('path');
const zl      = require('zip-lib');

//  load application modules
const send_dir = require('../js-server/server.send_dir');
const utils    = require('../js-server/server.utils');
const cmd      = require('../js-common/common.commands');

const task_t         = require('../js-common/tasks/common.tasks.template'   );
const task_import    = require('../js-common/tasks/common.tasks.import'     );
const task_wflowafmr = require('../js-common/tasks/common.tasks.wflowafmr'  );
const task_wflowamr  = require('../js-common/tasks/common.tasks.wflowamr'   );
const task_wflowaep  = require('../js-common/tasks/common.tasks.wflowaep'   );
const task_wflowdpl  = require('../js-common/tasks/common.tasks.wflowdplmr' );
const task_hopon     = require('../js-common/tasks/common.tasks.migrate'    );

// let conf   = require('../js-server/server.configuration');
// let cmd    = require('../js-common/common.commands');


// ==========================================================================

const cloudrun_code = {
  import   : 'import',
  auto_af2 : 'auto-af2',
  auto_mr  : 'auto-mr',
  auto_ep  : 'auto-ep',
  hop_on   : 'hop-on',
  auto_ref : 'auto-ref',
  dimple   : 'dimple'
}

function printInstructions()  {
  let msg = [
    '',
    '========',
    'CloudRun',
    '========',
    'CCP4 Cloud v.' + cmd.appVersion(),
    '',
    'CCP4 Cloud project initiation, data upload and running task from command prompt.',
    '',
    'Usage:',
    '~~~~~~',
    '',
    '    node js-utils/cloudrun.js -c command_file',
    '',
    'where "command_file" is path to file with keyworded instructions. Alternatively,',
    'instructions can be read from standard input:',
    '',
    '    node js-utils/cloudrun.js -i <<eof',
    '    ..commands..',
    '    eof',
    '',
    'Template command files can be generated as follows:',
    '',
    '    node js-utils/cloudrun.js -t task',
    '',
    'where "task" is one of import, auto-af2, auto-mr, auto-ep, hop-on, auto-ref,',
    'or dimple.',
    '',
    '    node js-utils/cloudrun.js -h',
    '',
    'prints these instructions.',
    '',
    '________________________________________________________',
    'Authors: E. Krissinel, A. Lebedev, O. Kovalevskyi (2021)',
    'Contact: ccp4_cloud@listserv.stfc.ac.uk',
    ''
  ];
  console.log ( msg.join('\n') );
}


function printTemplate ( task )  {

  let task_name = task + '                    # mandatory';
  let msg = [
    '#',
    '# Note: a) hash indicates a comment',
    '#       b) line order is insignificant',
    '#       c) CloudRun tasks are added at Project\'s root.',
    '#',
    '#  Edit instructions below this line as necessary:',
    '# _____________________________________________________________________________',
    '#',
    'URL         https://ccp4cloud.server    # mandatory',
    '#',
    '# User authentication: either in-line specification',
    '#',
    'USER        user_login                  # mandatory',
    'CLOUDRUN_ID aaaa-bbbb-cccc-dddd         # mandatory, found in "My Account"',
    '#',
    '# or reading user_login and aaaa-bbbb-cccc-dddd (in that order)',
    '# from a file:',
    '#',
    '# AUTH_FILE   /path/to/auth.dat         # mandatory',
    '#',
    'PROJECT     project_id                  # mandatory',
    'TITLE       Optional Project Title      # used only if project is created',
    'FOLDER      Optional Project Folder     # used only if project is created',
    'TASK        ' + task_name,
    'TASK_NAME   Optional Task Name          # if not given, default name is used',
    '#'
  ];

  switch (task)  {

    default :
        msg = [
          'Task code "' + task + '" cannot be used in cloudrun. Acceptable tasks include:',
          '   "' + cloudrun_code.import   + '"  : generic data import',
          '   "' + cloudrun_code.auto_af2 + '"  : auto-AF2 workflow (uses AlphaFold-2 for model generation)',
          '   "' + cloudrun_code.auto_mr  + '"  : auto-MR workflow (uses PDB and AFDB as source of models)',
          '   "' + cloudrun_code.auto_ep  + '"  : auto-EP workflow',
          '   "' + cloudrun_code.hop_on   + '"  : project initiation from phased structure',
          '   "' + cloudrun_code.auto_ref + '"  : auto_REL workflow (from phased structure)',
          '   "' + cloudrun_code.dimple   + '"  : fast phasing with 100% homolog for ligand blob identification'
        ];
        console.log (
          msg.join('\n')
        );
        process.exit(1);
      break;

    case cloudrun_code.import :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already) and runs the "File Import" task.'
        ].concat(msg);
        msg = msg.concat([
          'FILE  /path/to/file.[ext]  # generic file import',
          '#',
          '# Provide as many "FILE" lines as necessary. Acceptable file extensions',
          '# include .pdb, .ent, .seq, .fasta, .pir, .mtz, .sca, .cif, .mmcif, .doc,',
          '# .docx, .pdf, .txt, .jpg, .jpeg, .gif, .png, .html, .htm, .hkl, .hhr.',
          '#',
          '# Note that sequences will be automatically annotated as protein chains.',
          '# You may override this annotation by using the following statements:',
          '#',
          'SEQ_PROTEIN /path/to/file.[seq|fasta|pir]  # import protein sequence',
          'SEQ_DNA     /path/to/file.[seq|fasta|pir]  # import dna sequence',
          'SEQ_RNA     /path/to/file.[seq|fasta|pir]  # import rna sequence'
        ]);
      break;

    case cloudrun_code.auto_af2 :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already) and starts the "Auto-AFMR" workflow (this',
          '# requires an AlphaFold (or OpenFold or ColabFold) to be installed ',
          '# in CCP4 Cloud).'
        ].concat(msg);
        msg = msg.concat([
          'HKL         /path/to/hkl.mtz               # reflection data (mandatory)',
          'SEQ_PROTEIN /path/to/file.[seq|fasta|pir]  # protein sequence (mandatory)',
          '#',
          '# Either SMILES or LIG_CODE should be used for optional ligand description,',
          '# but not both.',
          '#',
          'SMILES      smiles-string  # ligand smiles string, not enquoted',
          'LIG_CODE    ATP            # 3-letter ligand code, e.g., ATP'
        ]);
      break;

    case cloudrun_code.auto_mr :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already) and starts the "Auto-MR" workflow.'
        ].concat(msg);
        msg = msg.concat([
          'HKL         /path/to/hkl.mtz               # reflection data (mandatory)',
          'SEQ_PROTEIN /path/to/file.[seq|fasta|pir]  # protein sequence (mandatory)',
          '#',
          '# Either SMILES or LIG_CODE should be used for optional ligand description,',
          '# but not both.',
          '#',
          'SMILES      smiles-string  # ligand smiles string, not enquoted',
          'LIG_CODE    ATP            # 3-letter ligand code, e.g., ATP'
        ]);
      break;

    case cloudrun_code.auto_ep :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already) and starts the "Auto-EP" workflow.'
        ].concat(msg);
        msg = msg.concat([
          'HA_TYPE     Se                # atom type of main anomalous scatterer',
          'HKL         /path/to/hkl.mtz               # reflection data',
          'SEQ_PROTEIN /path/to/file.[seq|fasta|pir]  # protein sequence'
        ]);
      break;

    case cloudrun_code.hop_on :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already) and runs the "Hop-On Import" task (project',
          '# initiation from phased structure).'
        ].concat(msg);
        msg = msg.concat([
          'HKL         /path/to/hkl.mtz         # reflection data (mandatory)',
          'PHASES      /path/to/phases.mtz      # phases',
          'XYZ         /path/to/model.pdb       # model',
          'LIGAND      /path/to/file.[cif|lib]  # ligand(s) (if present in model)',
          '#',
          '# Note: HKL and PHASES may be presented with the same file (e.g. one',
          '#       produced by Refmac); either XYZ or PHASES, or both, must be',
          '#       given.'
        ]);
      break;

    case cloudrun_code.auto_ref :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already), runs the "Hop-On Import" task (project',
          '# initiation from phased structure) followed by the Auto-REL automatic',
          'refinement workflow.'
        ].concat(msg);
        msg = msg.concat([
          'HKL         /path/to/hkl.mtz         # reflection data (mandatory)',
          'XYZ         /path/to/model.pdb       # model (mandatory)',
          'LIGAND      /path/to/file.[cif|lib]  # ligand(s) (if present in model)',
          '#'
        ]);
      break;

    case cloudrun_code.dimple :
        msg = [
          '# The task uploads files specified, creates CCP4 Cloud Project (if it',
          '# does not exist already) and runs "Dimple" workflow (fast MR with',
          '# 100% homologue for ligand blob identification and fitting).'
        ].concat(msg);
        msg = msg.concat([
          'HKL         /path/to/hkl.mtz      # reflection data (mandatory)',
          'XYZ         /path/to/apo.pdb      # model',
          'LIGAND      /path/to/file.cif     # ligand (optional)',
          '#',
          '# providing sequence is optional and may be used if a close, but',
          '# not 100% structure homologue is used, in which case the resulting',
          '# structure will be rebuilt. Use one or more of the following',
          '# sequence upload statements asappropriate',
          '#',
          'SEQ_PROTEIN /path/to/file.[seq|fasta|pir]  # protein sequence'
          // '#SEQ_DNA     /path/to/file.[seq|fasta|pir]  # import dna sequence',
          // '#SEQ_RNA     /path/to/file.[seq|fasta|pir]  # import rna sequence'
        ]);
      break;


  }

  console.log (
    '#\n' +
    '# =================================================\n' +
    '# CloudRun template command file for ' + task + ' task.\n' +
    '# =================================================\n' +
    '# CCP4 Cloud v.' + appVersion() + '\n' +
    '#\n' +
    msg.join('\n')
  );
  process.exit(0);

}

function pickFile ( fnames,extList )  {
  for (let i=0;i<fnames.length;i++)  {
    let fext = path.parse(fnames[i]).ext.toLowerCase();
    if (extList.indexOf(fext)>=0)
      return [fnames[i]];
  }
  return [];
}


function sendData ( filePath,metaData )  {

  let formData = {};
  for (let key in metaData)
    formData[key] = metaData[key];

  formData['file'] = fs.createReadStream ( filePath );

  let post_options = {
    url      : meta.url + '/' + cmd.fe_command.cloudRun,
    formData : formData,
    rejectUnauthorized : false
  };

  // console.log ( post_options );
  console.log ( ' ... sending' );

  request.post ( post_options, function(err,httpResponse,response){
    if (err) {
      console.log ( ' *** send failed: ' + err );
      process.exitCode = 1;
    } else  {
      try {
        let resp = JSON.parse ( response );
        if (resp.status==cmd.fe_retcode.ok)  {
          console.log ( ' ... server replied: ' + resp.message + '\n' );
          console.log ( 'Note: list of projects and/or project will not update automatically\n' +
                        '      in your browser, reload/refresh them manually if required.' );
        } else if (resp.message.indexOf('quota')>=0)  {
          console.log ( ' *** ' + resp.message );
          process.exitCode = 1;
        } else  {
          console.log ( ' *** cloud run initiation failed, rc=' + resp.status +
                        '\n *** ' + resp.message );
          process.exitCode = 1;
        }
      } catch(err)  {
        console.log ( ' *** unparseable server reply: ' + response );
        process.exitCode = 1;
      }
    }
    utils.removeFile ( filePath );
  });

}


/* ===  alternative data transmission code

let axios    = require('axios')
let FormData = require('form-data')

function sendData ( filePath,metaData )  {

  let formData = new FormData();
  for (key in metaData)
    formData.append ( key,metaData[key] );

  formData.append ( 'file',fs.createReadStream(filePath) );

  let formHeaders = formData.getHeaders();

  axios.post ( meta.url + '/' + cmd.fe_command.cloudRun, formData, {
    headers: {
        ...formHeaders,
    },
    rejectUnauthorized : false
  }).then ( response => {
    try {
      let resp = JSON.parse ( response.data );
      if (resp.status==cmd.fe_retcode.ok)  {
        console.log ( ' ... server replied: ' + resp.message + '\n' );
        console.log ( 'Note: list of projects and/or project will not update automatically\n' +
                      '      in your browser, reload/refresh them manually if required.' );
      } else if (resp.message.indexOf('quota')>=0)  {
        console.log ( ' *** ' + resp.message );
      } else  {
        console.log ( ' *** cloud run initiation failed, rc=' + resp.status +
                      '\n *** ' + resp.message );
      }
    } catch(err)  {
      console.log ( ' *** unparseable server reply: ' + response.data );
    }
    utils.removeFile ( filePath );
  }).catch(err => {
    console.log ( err );
    console.log ( ' *** send failed: ' + err );
    utils.removeFile ( filePath );
  })

}
*/


// --------------------------------------------------------------------------
// Parse command file

let input = '';

if (process.argv.length==4)  {

  if (process.argv[2].toLowerCase()=='-c')   // command file given
    input = utils.readString(process.argv[3]);
  else if (process.argv[2].toLowerCase()=='-t')  // print command file template
    printTemplate ( process.argv[3].toLowerCase() );

} else if (process.argv.length==3)  {
  // read from standard input
  if (process.argv[2].toLowerCase()=='-i')
    input = utils.readString(0);  // fs.readFileSync(0); // STDIN_FILENO = 0
}

if (!input)  {
  printInstructions();
  process.exit(1);
}

let meta = {
  url          : '',
  user         : '',
  cloudrun_id  : '',
  project      : '',
  load_project : 'no',
  title        : '*',
  folder       : '/',
  task         : 'import',
  task_name    : '*'
};

let options = {
  ha_type     : '',
  smiles      : '',
  lig_code    : ''
};

let files = {
  file        : [],
  hkl         : [],
  phases      : [],
  seq_protein : [],
  seq_dna     : [],
  seq_rna     : [],
  xyz         : [],
  ligand      : []
};

let annotation = {
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

let commands  = input.trim().split('\n');
let ok        = true;
let fnames    = [];
let auth_file = '';

console.log (
  '\n' +
  '========\n' +
  'CloudRun\n' +
  '========\n' +
  'CCP4 Cloud v.' + cmd.appVersion() + '\n \n' +
  '------------- COMMANDS:'
);

for (let i=0;i<commands.length;i++)  {
  console.log ( ' \$ ' + commands[i] );
  let command = commands[i].split('#')[0].trim();
  if (command)  {
    let lst = command.split(' ');
    if (lst.length>1)  {
      let key = lst[0].toLowerCase();
      let val = lst.slice(1).join(' ').trim();
      if (key in meta)
        meta[key] = val;
      else if (key in options)
        options[key] = val;
      else if (key in files)  {
        if (utils.fileExists(val))  {
          files[key].push ( val );
          let fext  = path.parse(val).ext;
          let fname = path.parse(val).name;
          fnames.push ( fname + fext );
          if (['.seq','.fasta','.pir'].indexOf(fext.toLowerCase())>=0)  {
            let fdata = utils.readString ( val );
            if (fdata)  {
              let annot = {
                file   : fname + fext,
                rename : fname + fext,
                items  : []
              };
              let content = fdata.split('>').filter(function(k){return k});
              for (let j=0;j<content.length;j++)  {
                content[j] = content[j].trim();
                if (content[j])  {
                  let sfname = fname + fext;
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
            } else  {
              console.log ( '   ^^^^ file read errors' );
              ok = false;
            }
          }
        } else  {
          console.log ( '   ^^^^ file not found (' + val + ')' );
          ok = false;
        }
      } else if (key=='auth_file')  {
        let auth_line = utils.readString ( val );
        if (!auth_line)  {
          console.log ( '\n  *** STOP: AUTH_FILE is absent or corrupt' );
          process.exit(1);
        }
        auth = auth_line.match ( /\S+/g );
        if (auth.length!=2)  {
          console.log ( '\n  *** STOP: AUTH_FILE must contain only login name and CloudRun Id' );
          process.exit(1);
        }
        meta.user        = auth[0]
        meta.cloudrun_id = auth[1];
        auth_file        = val;
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
  process.exit(1);
}

if (auth_file)
  console.log ( ' ... login name and cloudrun_id were read from file ' + auth_file );


// --------------------------------------------------------------------------
// Check that input is sufficient

for (let key in meta)
  if (!meta[key])  {
    ok = false;
    console.log ( ' *** ' + key.toUpperCase() + ' not specified' );
  }

if (!Object.values(cloudrun_code).includes(meta.task)<0)  {
  ok = false;
  console.log ( ' *** task key ' + meta.task + ' is not valid' );
}

if ((!meta.project) || (!/^[A-Za-z][A-Za-z0-9-._]+$/.test(meta.project)))  {
  ok = false;
  console.log ( ' *** PROJECT name should contain only latin letters, '  +
                'numbers, underscores,\n     dashes and dots, and must ' +
                'start with a letter (\"' + meta.project + '\" given).' );
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

if (meta.task=='hop-on')  {

  if ((files.phases.length<=0) && (files.hkl.length<=0))  {
    ok = false;
    console.log ( ' *** no reflection data provided' );
  }
  if ((files.phases.length<=0) && (files.xyz.length<=0))  {
    ok = false;
    console.log ( ' *** no phase data or atomic model provided' );
  }

} else if (meta.task=='auto-ref')  {

  if ((files.phases.length<=0) && (files.hkl.length<=0))  {
    ok = false;
    console.log ( ' *** no reflection data provided' );
  }
  if (files.xyz.length<=0)  {
    ok = false;
    console.log ( ' *** no atomic model provided' );
  }

} else if (meta.task=='dimple')  {

  if (files.hkl.length<=0)  {
    ok = false;
    console.log ( ' *** no reflection data provided' );
  } else if (files.hkl.length>1)  {
    ok = false;
    console.log ( ' *** multiple reflection datasets not aceptable for dimple workflow' );
  }
  if (files.xyz.length<=0)  {
    ok = false;
    console.log ( ' *** no structure homologue provided' );
  } else if (files.xyz.length>1)  {
    ok = false;
    console.log ( ' *** multiple structure homologues not aceptable for dimple workflow' );
  }

} else if (meta.task!='import')  {

  if (files.hkl.length<=0)  {
    ok = false;
    console.log ( ' *** reflection data is not provided' );
  }
  if ((meta.task=='auto-ep') && (!options.ha_type))  {
    ok = false;
    console.log ( ' *** main anomalous scaterrer is not specified' );
  }
  if (files.seq.length<=0)  {
    ok = false;
    console.log ( ' *** sequence data is not provided' );
  }

}

if ((!ok) || (fnames.length<=0))  {
  console.log ( '\n *** STOP DUE TO INSUFFICIENT INPUT' );
  process.exit(1);
}

if (meta.title=='*')
  meta.title = meta.project + ' initiated by script';


// --------------------------------------------------------------------------
// Make template directory for upload

const dirPath    = 'import_dir';
const uploadsDir = path.join ( dirPath,'uploads' );

utils.removePath ( dirPath );   // just in case
utils.mkDir ( dirPath    );
utils.mkDir ( uploadsDir );

for (let key in files)  {
  for (let i=0;i<files[key].length;i++)  {
    let fpath = files[key][i];
    utils.copyFile ( fpath,path.join(uploadsDir,path.basename(fpath)) );
  }
}

utils.writeObject ( path.join(dirPath,'annotation.json'),annotation );

console.log ( ' ... files copied to temporary location' );

// --------------------------------------------------------------------------
// Make task object

let task = null;

switch (meta.task)  {

  default : 
  case cloudrun_code.import :
                    task = new task_import.TaskImport  ();
                    task.upload_files = fnames;
                  break;

  case cloudrun_code.auto_af2 :
                    task = new task_wflowafmr.TaskWFlowAFMR();
                    task.inputMode = task_t.input_mode.root;
                    task.file_select[0].path = path.parse(files.hkl[0]).base;
                    task.file_select[1].path = path.parse(files.seq[0]).base;
                    // if (options.smiles)
                    //   task.input_ligands = [{
                    //     source : 'S',
                    //     smiles : options.smiles,
                    //     code   : ''
                    //   }];
                    // else if (options.lig_code)
                    //   task.input_ligands = [{
                    //     source : 'M',
                    //     smiles : '',
                    //     code   : options.lig_code
                    //   }];
                  break;

  case cloudrun_code.auto_mr :
                    task = new task_wflowamr.TaskWFlowAMR();
                    task.inputMode = task_t.input_mode.root;
                    task.file_select[0].path = path.parse(files.hkl[0]).base;
                    task.file_select[1].path = path.parse(files.seq[0]).base;
                    // if (options.smiles)
                    //   task.input_ligands = [{
                    //     source : 'S',
                    //     smiles : options.smiles,
                    //     code   : ''
                    //   }];
                    // else if (options.lig_code)
                    //   task.input_ligands = [{
                    //     source : 'M',
                    //     smiles : '',
                    //     code   : options.lig_code
                    //   }];
                  break;

  case cloudrun_code.auto_ep :
                    task = new task_wflowaep.TaskWFlowAEP();
                    task.inputMode = task_t.input_mode.root;
                    task.file_select[0].path = path.parse(files.hkl[0]).base;
                    task.file_select[1].path = path.parse(files.seq[0]).base;
                    task.parameters.HATOM.value = options.ha_type;
                  break;

  case cloudrun_code.hop_on :
                    task = new task_hopon.TaskMigrate();
                    task.inputMode    = task_t.input_mode.root;
                    task.upload_files = fnames;
                    if (files.hkl.length>0)
                      task.file_hkl = path.parse(files.hkl[0]).base;
                    if (files.phases.length>0)
                      task.file_mtz = path.parse(files.phases[0]).base;
                    if (files.xyz.length>0)
                      task.file_xyz = path.parse(files.xyz[0]).base;
                    if (files.ligand.length>0)
                      task.file_lib = path.parse(files.ligand[0]).base;
                  break;

  case cloudrun_code.auto_ref :
                    task = new task_hopon.TaskMigrate();
                    task.inputMode    = task_t.input_mode.root;
                    task.upload_files = fnames;
                    task.autoRunId    = 'auto-REL';
                    if (files.hkl.length>0)
                      task.file_hkl = path.parse(files.hkl[0]).base;
                    if (files.phases.length>0)
                      task.file_mtz = path.parse(files.phases[0]).base;
                    if (files.xyz.length>0)
                      task.file_xyz = path.parse(files.xyz[0]).base;
                    if (files.ligand.length>0)
                      task.file_lib = path.parse(files.ligand[0]).base;
                  break;

  case cloudrun_code.dimple :
                    task = new task_wflowdpl.TaskWFlowDPLMR();
                    task.inputMode = task_t.input_mode.root;
                    task.file_select[0].path = path.parse(files.hkl[0]).base;
                    task.file_select[1].path = path.parse(files.xyz[0]).base;
                    if (files.ligand.length>0)
                      task.file_select[2].path = path.parse(files.ligand[0]).base;
                    if (files.seq.length>0)
                      task.file_select[3].path = path.parse(files.seq[0]).base;
                  break;

}

if (options.smiles)
  task.input_ligands = [{
    source : 'S',
    smiles : options.smiles,
    code   : ''
  }];
else if (options.lig_code)
  task.input_ligands = [{
    source : 'M',
    smiles : '',
    code   : options.lig_code
  }];

task.file_mod   = annotation; // file modification and annotation
task.project    = meta.project;
task.treeItemId = 'treeItemId';  // should not be empty

if (meta.task_name!='*')
  task.uname = meta.task_name;

utils.writeObject ( path.join(dirPath,task_t.jobDataFName),task );


// --------------------------------------------------------------------------
// Make archive for upload

let archivePath = path.resolve ( send_dir.jobballName );
utils.removeFile ( archivePath );  // just in case

zl.archiveFolder ( dirPath,archivePath,{ followSymlinks : true } )
  .then(function() {
    console.log ( ' ... archived' );
    sendData ( archivePath,meta );
  }, function(err) {
    console.log ( ' *** zip packing error: ' + err );
    utils.removeFile ( archivePath );
    process.exitCode = 1;
  });
