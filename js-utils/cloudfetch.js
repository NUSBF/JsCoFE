
/*
 *
 *  =================================================================
 *
 *    22.12.24   <--  Date of Last Modification.
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
 * Jobs are fetched as a zipped directory 'cloud_fetch', which can contain one
 * or more job directories satisfying job specifications. Job types are the same 
 * as in custom workflows.
 * 
 */

//  load system modules
const fs        = require("fs-extra");
const request   = require('request' );
const path      = require('path');

//  load application modules
const class_map = require('../js-server/server.class_map');
const send_dir  = require('../js-server/server.send_dir');
const utils     = require('../js-server/server.utils');
const cmd       = require('../js-common/common.commands');
const comut     = require("../js-common/common.utils");

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
    '# JOB         jobId1 jobId2 jobId3 ...    # use only if job Ids are known',
    '# JOB         last                        # for fetching the last job',
    '# JOB         last  job_type              # the last job of specific type',
    '# JOB         title Job title of interest # for job with given title',
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


function sendFetchQuery ( title,metaData,outDir,callback_func )  {

  let formData = {};
  for (let key in metaData)
    formData[key] = metaData[key];

  let post_options = {
    url      : meta.url + '/' + cmd.fe_command.cloudFetch,
    formData : formData,
    rejectUnauthorized : false
  };

  utils.removePath ( path.join(outDir,'cloudfetch') );

  console.log ( ' ... ' + title );

  let fetch_file = 'cloudfetch.zip';

  request.post ( post_options, function(err,httpResponse,response){
    if (err) {
      console.log ( ' *** send failed: ' + err );
      process.exitCode = 1;
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
          callback_func();
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
  project      : '',
  jobs         : []
};

let job_specification = {
  key   : 'job_id',
  value : null
}

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
        let words = lst.filter(word => word.trim() !== '');
        if (words.length>0)  {
          if (comut.isInteger(words[0]))  {
            job_specification.key   = cloudfetch_code.job_id;
            job_specification.value = [parseInt(words[0])];
            for (let j=1;j<words.length;j++)
              if (comut.isInteger(words[0]))  {
                job_specification.value.push ( parseInt(words[j]) );
              } else  {
                console.log ( '   ^^^^ not an integer: ' + words[j] );
                ok = false;
              }
          } else  {  
            job_specification.key   = lst[0];
            job_specification.value = lst.length>1 ? 
                                            lst.slice(1).join(' ').trim() : '*';
          }
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

for (let key in meta)
  if (!meta[key])  {
    ok = false;
    console.log ( ' *** ' + key.toUpperCase() + ' not specified' );
  }

if (!job_specification.value)  {
  ok = false;
  console.log ( '\n **** one and only one job statement must be given ' + nj );
}

if (!Object.values(cloudfetch_code).includes(job_specification.key)<0)  {
  ok = false;
  console.log ( ' *** specification key ' + job_specification.key + ' is not valid' );
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

meta.jobs = JSON.stringify([]);  // obtain job index first

let fetch_dir = path.join ( outDir,'cloudfetch' );

sendFetchQuery ( 'getting job index',meta,outDir,function(){

  let index = utils.readObject ( path.join(fetch_dir,'index.json') );

  if (!index)  {
    console.log ( ' *** job index not found -- stop' );
  } else  {
    // SELECT JOBS FOR FETCH
    // meta.jobs = [191,19];

    meta.jobs = [];

    for (let i=0;i<index.length;i++)
      index[i] = class_map.makeClass ( index[i] );

    if (job_specification.key==cloudfetch_code.job_id)  {

      for (let i=0;i<index.length;i++)
        if (job_specification.value.indexOf(index[i].id)>=0)  {
          if (index[i].isComplete())
            meta.jobs.push ( index[i].id );
          else
            console.log ( ' *** selected job ' + index[i].id +
                          ' is not completed - ignored' );
        }
    
    } else if (job_specification.key==cloudfetch_code.last)  {

      let id0 = -1;
      for (let i=0;i<index.length;i++)
        if ((index[i].id>id0) && index[i].isSuccessful() &&
            ((job_specification.value=='*') ||
             (index[i]._type=='Task'+job_specification.value)))
           id0 = index[i].id;
      if (id0>=0)
        meta.jobs = [id0];

    } else if (job_specification.key==cloudfetch_code.title)  {

      for (let i=0;i<index.length;i++)
        if (((index[i].name==job_specification.value) ||
             (index[i].name==job_specification.value)) && 
            index[i].isSuccessful())
          meta.jobs.push ( index[i].id );

    } else if (job_specification.key==cloudfetch_code.remark)  {

      for (let i=0;i<index.length;i++)
        if ((index[i]._type=='TaskRemark') && 
            ((index[i].uname==job_specification.value) ||
             (index[i].name==job_specification.value)))
          meta.jobs.push ( index[i].parentId );

    } else if (job_specification.key==cloudfetch_code.rfree)  {

      let rfree0 = 2.0;
      let id0    = -1;
      for (let i=0;i<index.length;i++)
        if (('scores' in index[i]) && index[i].isSuccessful())  {
          for (let t in index[i].scores)
            if ('R_free' in index[i].scores[t])  {
              let rfree = parseFloat(index[i].scores[t].R_free);
              if (rfree<rfree0)  {
                rfree0 = rfree;
                id0    = index[i].id;
              }
            }
        }
      if (id0>=0)
        meta.jobs = [id0];

    }

    if (meta.jobs.length<=0)  {
      console.log ( ' *** no jobs satisfy selection criteria -- stop' );
    } else  {
      meta.jobs = JSON.stringify(meta.jobs);
      sendFetchQuery ( 'fetching job(s)',meta,outDir,function(){
        let report = utils.readString ( path.join(fetch_dir,'delivery.log') );
        if (!report)
          report = 'REPORT NOT AVAILABLE ';
        else
          console.log ( ' ... Fetch completed -- success' );
        console.log ( ' ... Find results in "' + fetch_dir + '"' );
        console.log ( ' ... Delivery report:' );
        console.log ( report );
      });
    }

  }

});



