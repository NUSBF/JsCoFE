
/*
 *
 *  =================================================================
 *
 *    21.12.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-utils/cloudfetch.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Fetching job directores from command line
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel 2024
 *
 *  =================================================================
 *
 * Invocation:
 *
 *    node js-utils/cloudfetch.js [-d output_dir] -c command_file
 *
 * where command_file may be also provided via the standard input:
 *
 *    node js-utils/cloudfetch.js [-d output_dir] -i <<eof
 *    ..commands..
 *    eof
 *
 * Generate template command files (prints to console):
 *
 *    node js-utils/cloudfetch.js -t
 *
 * Obtaining help:
 *
 *    node js-utils/cloudfetch.js
 *    node js-utils/cloudfetch.js -h
 *
 * Commands (hash # may be used for comments, anything on the right from # is
 * ignored):
 *
 *   URL         https://ccp4cloud.server    # mandatory
 *   USER        user_login                  # mandatory
 *   CLOUDRUN_ID aaaa-bbbb-cccc-dddd         # mandatory
 *   AUTH_FILE   /path/to/auth.dat           # alternative to USER/CLOUDRUN_ID
 *   PROJECT     project_id                  # mandatory
 *   JOB         job-specification           # mandatory
 * 
 * where job-specification can be:
 *    - job number       # fetches job with given job number (id)
 *    - last             # fetches last job in the project
 *    - last   job_type  # fetches last job of given type (e.g. Refmacat) 
 *    - title  job_title # fetches job with given title
 *    - remark title     # fetches parent of remark with given title
 *    - rfree            # fetches job with lowest Rfree achieved
 * 
 * Examples:
 *   JOB  112
 *   JOB  last
 *   JOB  last    Refmacat      s# Note: job type is case-sensitive
 *   JOB  title   Last job in project
 *   JOB  remark  The end
 *   JOB  rfree
 *
 * Jobs are fetched zipped directory 'cloud_fetch', which can contain one or
 * more job directories satisfying job specifications. Job types are the same 
 * as in custom workflows.
 * 
 */

//  load system modules
const fs       = require("fs-extra");
const request  = require('request' );
const path     = require('path');

//  load application modules
const send_dir = require('../js-server/server.send_dir');
const utils    = require('../js-server/server.utils');
const cmd      = require('../js-common/common.commands');
const comut    = require("../js-common/common.utils");

// ==========================================================================

const cloudfetch_code = {
  job_id : 'job_id',
  last   : 'last',
  title  : 'title',
  remark : 'remark',
  rfree  : 'rfree'
}

function printInstructions()  {
  let msg = [
    '',
    '==========',
    'CloudFetch',
    '==========',
    'CCP4 Cloud v.' + cmd.appVersion(),
    '',
    'Fetches job directorie(s) from CCP4 Cloud projects, typically after',
    'CloudRun execution.',
    '',
    'Usage:',
    '~~~~~~',
    '',
    '    node js-utils/cloudfetch.js [-d output_dir] -c command_file',
    '',
    'where "command_file" is path to file with keyworded instructions.',
    ' Alternatively, instructions can be read from standard input:',
    '',
    '    node js-utils/cloudfetch.js [-d output_dir] -i <<eof',
    '    ..commands..',
    '    eof',
    '',
    'Template command files can be generated as follows:',
    '',
    '    node js-utils/cloudfetch.js -t',
    '',
    '(prints to console).',
    '',
    '    node js-utils/cloudfetch.js -h',
    '',
    'prints these instructions.',
    '',
    '________________________________________________________',
    'Author: E. Krissinel (2024)',
    'Contact: ccp4_cloud@listserv.stfc.ac.uk',
    ''
  ];
  console.log ( msg.join('\n') );
}


function printTemplate()  {

  let msg = [
    '#',
    '# Note: a) hash indicates a comment',
    '#       b) line order is insignificant',
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
    '# AUTH_FILE   /path/to/auth.dat           # mandatory',
    '#',
    'PROJECT     project_id                  # mandatory',
    '#',
    '# Uncomment one of the following statements as suitable:',
    '#',
    '# JOB         job_id                      # use only if job Id is known',
    '# JOB         last                        # for fetching the last job',
    '# JOB         last  job_type              # the last job of specific type',
    '# JOB         title Job title of nterest  # for job with given title',
    '# JOB         remark Remark of reference  # for parent of referenced remark',
    '# JOB         rfree                       # for job with the lowest rfree',
    '#'
  ];

  console.log (
    '#\n' +
    '# =================================================\n' +
    '# CloudFetch template command file.\n' +
    '# =================================================\n' +
    '# CCP4 Cloud v.' + cmd.appVersion() + '\n' +
    '#\n' +
    msg.join('\n')
  );

  process.exit(0);

}


function sendFetchQuery ( metaData,outDir )  {

  let formData = {};
  for (let key in metaData)
    formData[key] = metaData[key];

  let post_options = {
    url      : meta.url + '/' + cmd.fe_command.cloudFetch,
    formData : formData,
    rejectUnauthorized : false
  };

  // console.log ( post_options );
  console.log ( ' ... sending fetch query' );

  let fetch_file = 'cloudfetch.zip';

  request.post ( post_options, function(err,httpResponse,response){
    if (err) {
      console.log ( ' *** send failed: ' + err );
      process.exitCode = 1;
    // } else  {
    //   try {
    //     let resp = JSON.parse ( response );
    //     if (resp.status==cmd.fe_retcode.ok)  {
    //       console.log ( ' ... server replied: ' + resp.message + '\n' );
    //       console.log ( 'Note: list of projects and/or project will not update automatically\n' +
    //                     '      in your browser, reload/refresh them manually if required.' );
    //     } else if (resp.message.indexOf('quota')>=0)  {
    //       console.log ( ' *** ' + resp.message );
    //       process.exitCode = 1;
    //     } else  {
    //       console.log ( ' *** cloud fetch failed, rc=' + resp.status +
    //                     '\n *** ' + resp.message );
    //       process.exitCode = 1;
    //     }
    //   } catch(err)  {
    //     console.log ( ' *** unparseable server reply: ' + response );
    //     process.exitCode = 1;
    //   }
    }
  })
  .pipe ( fs.createWriteStream(fetch_file) )
  .on   ( 'finish', () => {
    console.log ( ' ... File received and saved' );
    send_dir.unpackDir ( 'cloudfetch.zip',outDir,false,
      function(err,packSize){
        if (err)  {
          console.log ( ' *** unpack errors: ' + err );
        } else  {
          let fetch_dir = path.join ( outDir,'cloudfetch' );
          let report = utils.readString ( path.join(fetch_dir,'delivery.log') );
          if (!report)
            report = 'REPORT NOT AVAILABLE';
          else
            console.log ( ' ... Fetch completed -- success' );
          console.log ( ' ... Find results in "' + fetch_dir + '"' );
          console.log ( ' ... Delivery report:' );
          console.log ( report );
        }
      });
  })
  .on   ( 'error', (err) => {
    console.log ( 'Failed to receive and send file: ' + err.message );
  });

}

// --------------------------------------------------------------------------
// Parse command file

let input  = '';
let outDir = './';

let i = 2;
while (i<process.argv.length)  {
  switch (process.argv[i])  {
    case '-t':  printTemplate();  
              break;
    case '-d':  if (i<process.argv.length-1)  {
                  outDir = process.argv[++i];
                } else  {
                  input = '';
                }
              break;
    case '-c':  if (i<process.argv.length-1)  {
                  input = utils.readString(process.argv[++i]);
                } else  {
                  input = '';
                }
               break;
    case '-i':  input = utils.readString(0); // fs.readFileSync(0); // STDIN_FILENO = 0
               break;
    default  :  input = '';  // indicate command line error
                i = process.argv.length;
  }
  i++;
}

if (!input)  {
  printInstructions();
  process.exit(1);
}

let meta = {
  url          : '',
  user         : '',
  cloudrun_id  : '',
  project      : ''
};

let commands  = input.trim().split('\n');
let ok        = true;
let auth_file = '';

console.log (
  '\n' +
  '==========\n' +
  'CloudFetch\n' +
  '==========\n' +
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
      if (key in meta)  {
        meta[key] = val;
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
      } else if (key=='job')  {
        lst = val.split(' ');
        if (lst.length>0)  {
          if (comut.isInteger(val))
            meta.job_id = parseInt(val);
          else  
            meta['job_'+lst[0]] = lst.length>1 ? lst.slice(1).join(' ').trim() : '*';
        } else
          ok = false;
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

if (auth_file)
  console.log ( ' ... login name and cloudrun_id were read from file ' + auth_file );


// --------------------------------------------------------------------------
// Check that input is sufficient

let nj = 0;
for (let key in meta)  {
  // console.log ( ' >>>>> ' + key);
  if (key.startsWith('job'))
    nj++;
  if (!meta[key])  {
    ok = false;
    console.log ( ' *** ' + key.toUpperCase() + ' not specified' );
  }
}

if (nj!=1)  {
  ok = false;
  console.log ( '\n **** one and only one job statement must be given ' + nj );
}

if (!Object.values(cloudfetch_code).includes(meta.task)<0)  {
  ok = false;
  console.log ( ' *** task key ' + meta.task + ' is not valid' );
}

if ((!meta.project) || (!/^[A-Za-z][A-Za-z0-9-._]+$/.test(meta.project)))  {
  ok = false;
  console.log ( ' *** PROJECT name should contain only latin letters, '  +
                'numbers, underscores,\n     dashes and dots, and must ' +
                'start with a letter (\"' + meta.project + '\" given).' );
}


if (!ok)  {
  console.log ( '\n **** ERRORS IN COMMANDS -- STOP\n\n' );
  printInstructions();
  process.exit(1);
}

// --------------------------------------------------------------------------
// Fetch job

// console.log ( ' >>>>> \n' + JSON.stringify(meta) );

sendFetchQuery ( meta,outDir );

