
/*
 *  ==========================================================================
 *
 *    14.12.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -------------------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.template.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task Template Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  ==========================================================================
 *
 */

'use strict'; // *client*

var __cmd  = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __cmd  = require ( '../common.commands' );

// ===========================================================================
// Task classes MUST BE named as 'TaskSomething' AND put in file named
// ./js-common/tasks/common.tasks.something.js . This convention is used
// for class reconstruction from json strings

const job_code = {
  new           : 'new',           // new job_code
  running       : 'running',       // job is running
  ending        : 'ending',        // job is in gracefull ending phase
  exiting       : 'exiting',       // job is in post-run processing
  finished      : 'finished',      // job finished normally (nothing to do with the results)
  noresults     : 'noresults',     // job finished normally but no results produced
  hiddenresults : 'hiddenresults', // job finished normally but results are hidden
  failed        : 'failed',        // job failed
  stopped       : 'stopped',       // job stopped (terminated by user)
  remark        : 'remark',        // remark node
  remdet        : 'remdet',        // detached remark node
  remdoc        : 'remdoc',        // remark node converted from documentation import
  retired       : 'retired',       // indicates that the task should not appear in task list
  remove        : 'remove'         // special code for removing job from registry on REMOTE NCs
};

const input_mode = {
  standard  : 'standard',  // standard input panel mode
  root      : 'root'       // root input panel mode
};


// ---------------------------------------------------------------------------
// variables to be exported

const jobDataFName      = 'job.meta';
const jobReportDirName  = 'report';
const jobInputDirName   = 'input';
const jobOutputDirName  = 'output';
const jobReportHTMLName = 'index.html';
const jobReportTaskName = 'task.tsk';

const keyEnvironment = ['CCP4','BALBES_ROOT','ROSETTA_DIR','warpbin','BDG_home',
                        'XDS_home','XDSGUI_home','DOCREPO','ALPHAFOLD_CFG',
                        '$CCP4/bin/shelxe','$CCP4/bin/shelxe.exe','PDB_DIR',
                        '$CCP4/share/mrd_data/VERSION','$CCP4/lib/py2/morda/LINKED',
                        'Xia2_durin','$CCP4_MASTER/BORGES_LIBS'
                       ];

var dbx   = null;
var comut = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  dbx   = require('../dtypes/common.dtypes.box');
  comut = require('../common.utils');
}


// ===========================================================================

function TaskTemplate()  {

  this._type        = 'TaskTemplate';        // must be class name
  this.version      = this.currentVersion(); // actual version of task class
  // this.archive_version = 0;  // appears only on archiving, hence commented out;
                                // see function isArchived()

  this.project      = '';   // project name (stable)
  this.id           = 0;    // job Id (stable)
  this.parentId     = 0;    // parent job Id (stable)
  this.treeItemId   = '';   // id of associated job tree item (unstable)
  this.name         = 'template';
  this.uname        = '';   // name given by user, overrides 'name' if not empty
  this.title        = 'Template';
  this.setOName ( 'template' );  // default output file name template
  this.uoname       = '';        // output file name template given by user
  this.state        = job_code.new;  // 'new', 'running', 'finished'
  this.nc_type      = 'ordinary'; // required Number Cruncher type
  this.fasttrack    = false;  // no fasttrack requirements
  this.inputMode    = input_mode.standard;  // 'standard', 'root'
  this.autoRunName  = '';     // job id in automatic workflow
  this.autoRunId    = '';     // automatic workflow Id
  this.script       = [];     // workflow script to execute
  this.script_pointer = 0;    // current position in the workflow script script
  this.informFE     = true;   // end of job and results are sent back to FE

  this.upload_files = [];   // list of uploaded files
  this.input_dtypes = [];   // input data type definitions; []: any input data is allowed;
                            // [1]: no data is required but the task is allowed only
                            // on the topmost level of job tree

  this.file_select   = [];  // list of file select widgets
  this.input_ligands = [];  // list of ligand description widgets
  // this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'', 'file' : 'fileInpId' }];

  if (dbx)  {
    this.input_data  = new dbx.DataBox(); // actual input data, represented by DataBox
    this.output_data = new dbx.DataBox(); // actual output data, represented by DataBox
  } else  {
    this.input_data  = new DataBox();  // actual input data, represented by DataBox
    this.output_data = new DataBox();  // actual output data, represented by DataBox
  }

  this.parameters      = {};  // input parameters

  this.layCustom       = {};  // parameters for custom layout

  this.job_dialog_data = {  // used for per-task positioning of job dialog
    position  : { my : 'center top',   // job dialog position reference
                  at : 'center top+5%' }, // job dialog offset in the screen
    width     : 0,       // job dialog panel width
    height    : 0,       // job dialog panel height
    panel     : 'input', // currently selected panel
    job_token : 0,       // job token for client job when running
    viewed    : true     // set false after finishing, true after Job Dialog
  }

  this.associated       = [];  // used in the data provenance framework
  this.harvestedTaskIds = [];  // ids of tasks chosen by direct multiple selection
                               // as data suppliers for this one; used in job
                               // dialogs
  //this.harvestLinks     = [];  // ids of tasks linked to this one through direct
                                 // multiple selections in job tree; used for the
                                 // identification of job chains at job deletion

  this.disk_space = 0.0;  // in MBs; calculated after job is done
  this.cpu_time   = 0.0;  // in hours; calculated after job is done

//  this.doNotPackSuffixes = ['.map'];
//  this.doPackSuffixes    = [''];      // prevails

}

if (__cmd)
  __cmd.registerClass ( 'TaskTemplate',TaskTemplate,null );
else    registerClass ( 'TaskTemplate',TaskTemplate,null );

// ===========================================================================

TaskTemplate.prototype.icon = function()  { return 'process'; }
TaskTemplate.prototype.desc_title = function()  {
  return '';  //'this appears under task title in the task list';
}
TaskTemplate.prototype.taskDescription = function()  {
  return ''; //'this appears under task title in the Task Dialog';
  // return 'Task description in small font which will appear under the task title in Task Dialog';
}
TaskTemplate.prototype.clipboard_name = function()  {
  return 'task';
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskTemplate.prototype.platforms           = function() { return 'WLMU';   }

TaskTemplate.prototype.lowestClientVersion = function() { return '0.0.0 [0.0.0]'; }
TaskTemplate.prototype.authorisationID     = function() { return '';       }
TaskTemplate.prototype.requiredEnvironment = function() { return ['CCP4']; }

TaskTemplate.prototype.doNotPackSuffixes   = function() { return ['.map']; }
TaskTemplate.prototype.doPackSuffixes      = function() { return [''];     }

TaskTemplate.prototype.canEndGracefully    = function() { return false;    }
// TaskTemplate.prototype.canRunInAutoMode    = function() { return false;    }

TaskTemplate.prototype.sendsOut = function()  {
// Lists data which tasks may send to external web-servers, such as PDB, AFDB, PDB-REDO
// and others. Example:
//       return ['seq','xyz','lig','hkl']; 
  return [];
}

TaskTemplate.prototype.canSendJobResults = function()  {
  return this.isSuccessful() &&
         (('DataRevision'  in this.output_data.data) ||
          ('DataStructure' in this.output_data.data) ||
          ('DataModel'     in this.output_data.data) ||
          ('DataXYZ'       in this.output_data.data) ||
          ('DataLigand'    in this.output_data.data) ||
          ('DataLibrary'   in this.output_data.data) ||
          ('DataSequence'  in this.output_data.data) ||
          ('DataHKL'       in this.output_data.data) ||
          ('DataUnmerged'  in this.output_data.data)
         );
}

TaskTemplate.prototype.usesGPU = function() {
// This function is used if "exeData_GPU" is specified in NC configuration file.
// Then, for GPU-based tasks, queue parameters from "exeData_GPU" will be used.
// If "exeData_GPU" is not used in configuration, a separate NC must be set for
// working with GPU farm, and "exclude_tasks" and "only_tasks" lists must be used
// in NC configurations such that only GPU-dedicated NC receives such tasks. Note 
// that exclusion task list must be used on NCs not connected to GPU farm so that
// GPU-based tasks are not dispatched to such NCs. As on 20.07.2024, only 
// TaskStructurePrediction may require access to GPU, depending on the backend 
// used to run the task.
  return false;
}


TaskTemplate.prototype.makeSample = function()  {
  return this;
}


TaskTemplate.prototype.getHelpURL = function()  {
  return __task_reference_base_url + 'doc.task.' + this._type.substr(4) + '.html';
}

TaskTemplate.prototype.getInputMode = function()  {
  if ('inputMode' in this)
    return this.inputMode;
  if ((this.input_dtypes.length==1) && (this.input_dtypes[0]==1))
        this.inputMode = input_mode.root;
  else  this.inputMode = input_mode.standard;
  return this.inputMode;
}

// cloneItems return list of files and directories in job directory which need
// to be cloned when task is cloned
TaskTemplate.prototype.cloneItems = function() { return []; }

// hotButtons return list of buttons added in JobDialog's toolBar.
// Description template:
//  { 'task'    : 'TaskCootMB',
//    'tooltip' : 'Model building with Coot' }
TaskTemplate.prototype.hotButtons = function() { return []; }

// when data class version is changed here, change it also in python
// constructors
TaskTemplate.prototype.currentVersion = function()  { return 1; }

TaskTemplate.prototype.isRemark = function()  {
  return  (this.state==job_code.remark) ||
          (this.state==job_code.remdet) ||
          (this.state==job_code.remdoc);
}

TaskTemplate.prototype.isLink = function()  { return false; }

TaskTemplate.prototype.isRunning = function()  {
  return ((this.state==job_code.running) || (this.state==job_code.exiting));
}

TaskTemplate.prototype.isComplete = function()  {
  return ((this.state!=job_code.new)    && (this.state!=job_code.running) &&
          (this.state!=job_code.ending) && (this.state!=job_code.exiting));
}

TaskTemplate.prototype.isSuccessful = function()  {
// true if can attach next job
  return ((this.state!=job_code.new)    && (this.state!=job_code.running) &&
          (this.state!=job_code.ending) && (this.state!=job_code.exiting) &&
          (this.state!=job_code.failed) && (this.state!=job_code.stopped) &&
          (this.state!=job_code.retired)
         );
}

TaskTemplate.prototype.__check_keywords = function ( keywords,reflist )  {
// keywords and reflist are supposed to be in low register
let matches = (!keywords) || (keywords.length==0);
  for (let i=0;(i<reflist.length) && (!matches);i++)
    for (let j=0;(j<keywords.length) && (!matches);j++)
      matches = reflist[i].startsWith(keywords[j]);
  return matches;
}

TaskTemplate.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['template'] );
}

// estimated cpu cost of the job, in hours
TaskTemplate.prototype.cpu_credit = function()  {
  return 0.02;
}


// optional; sets task parameters from given standard input file, 
// represented as refkeys = { id: id, keywords: keywords } where keywords
// is list of lines in task's stdin
TaskTemplate.prototype.set_refkeys_parameters = function ( refkeys )  {
// refkeys is supposed to be a list of strings representig standard input file;
// any representation of parameters is possible, but it should match input to
// DataTemplate.store_parameters() function in python layer 
}
  

// stores default parameters in copies at class initialisation
TaskTemplate.prototype.saveDefaultValues = function ( parameters )  {
  for (let item in parameters)
    if (parameters[item].hasOwnProperty('value'))  {
      parameters[item].default_value = parameters[item].value;
      if ((parameters[item].value=='') && 
           parameters[item].hasOwnProperty('default'))
        parameters[item].default_value = parameters[item].default;
    } else if (comut)  {
      if (comut.isObject(parameters[item]))
        this.saveDefaultValues ( parameters[item] );
    } else if (isObject(parameters[item]))
      this.saveDefaultValues ( parameters[item] );
}

TaskTemplate.prototype.getWorkflowScript = function ( serialNo )  {
let wrun_name = this._type.slice(4);
let wscript   = ['@' + wrun_name.toUpperCase()];

  if (serialNo)
    wscript[0] += '-' + serialNo;

   let walkParameters = function ( obj ) {
    for (let item in obj)
      if (obj[item].hasOwnProperty('value')         && 
          obj[item].hasOwnProperty('default_value') &&
          obj[item].visible &&
          obj[item].default_value!=obj[item].value)  {
        let value = obj[item].value;
        if (['string','string_','combobox'].indexOf(obj[item].type)>=0)
          value = '"' + value + '"';
        else if (obj[item].type=='checkbox')  {
          if (value)  value = 1;
                else  value = 0;
        }
        wscript.push ( '    PARAMETER ' + item + ' ' + value + '  # ' + 
                       obj[item].label.split(':')[0] );
      } else if (comut)  {
        if (comut.isObject(obj[item]))
          walkParameters ( obj[item] );
      } else if (isObject(obj[item]))
        walkParameters ( obj[item] );
  }

  walkParameters ( this.parameters );

  wscript.push ( '    RUN ' + wrun_name );

  return wscript;

}



// highlight changed parameters
// TaskTemplate.prototype._highlight_changed_parameters = function ( parameters )  {
//   for (let item in parameters)
//     if ('value' in parameters[item])  {
//       if (parameters[item].value!=parameters[item].default_value)  {
//         if ('label' in parameters[item])
//           parameters[item].label = '<font style=\'color:darkblue\'><i>' +
//                                   parameters[item].label + '</i></font>';
//         if ('label2' in parameters[item])
//           parameters[item].label2 = '<font style=\'color:darkblue\'><i>' +
//                                     parameters[item].label2 + '</i></font>';
//       }
//     } else if (comut)  {
//       if (comut.isObject(parameters[item]))
//         this._highlight_changed_parameters ( parameters[item] );
//     } else if (isObject(parameters[item]))
//       this._highlight_changed_parameters ( parameters[item] );
// }


// recursion for substituting suggested parameters in depth
TaskTemplate.prototype._clone_suggested = function ( parameters,suggestedParameters )  {
  for (let item in parameters)
    if (item in suggestedParameters)  {
      if (parameters[item].value!=suggestedParameters[item])  {
        parameters[item].value = suggestedParameters[item];
        if ('label' in parameters[item])
          parameters[item].label = '<font style=\'color:darkblue\'><i>' +
                                  parameters[item].label + '</i></font>';
        if ('label2' in parameters[item])
          parameters[item].label2 = '<font style=\'color:darkblue\'><i>' +
                                    parameters[item].label2 + '</i></font>';
      }
    } else if (comut)  {
      if (comut.isObject(parameters[item]))
        this._clone_suggested ( parameters[item],suggestedParameters );
    } else if (isObject(parameters[item]))
      this._clone_suggested ( parameters[item],suggestedParameters );
}


function update_project_metrics ( task,metrics )  {
  /* add: MR/EP, Space group, solvent, residues in ASU, residues in model */
  if (task)  {
    if (!('R_free' in metrics))  {
      metrics.R_free   = 2.0;
      metrics.R_factor = 2.0;
    }
    let r = null;  // revision
    if (('output_data' in task) && ('DataRevision' in task.output_data.data))
      r = task.output_data.data.DataRevision[0];
    if ('scores' in task)
      for (let key in task.scores)  {
        let d = task.scores[key];
        if ('R_free' in d)  {
          let rfree = parseFloat(d.R_free);
          if (d.R_free<metrics.R_free)  {
            metrics.R_free   = rfree;
            metrics.R_factor = parseFloat(d.R_factor);
            metrics.jobId    = task.id;
            if (r)  {
              metrics.SG        = r.HKL.dataset.HM;
              metrics.res_high  = r.HKL.dataset.RESO[1];
              metrics.res_low   = r.HKL.dataset.RESO[0];
              metrics.Solvent   = r.ASU.solvent;
              metrics.MolWeight = r.ASU.molWeight;
              metrics.nRes_ASU  = r.ASU.nRes;
              if ('ha_type' in r.ASU)  metrics.ha_type = r.ASU.ha_type;
                                 else  metrics.ha_type = '';
              let nunits = 0;
              for (let i=0;i<r.ASU.seq.length;i++)
                nunits += r.ASU.seq[i].ncopies;
              metrics.nUnits_ASU  = nunits;
              if (('Structure' in r) && (r.Structure))  {
                let nr     = 0;
                let models = r.Structure.xyzmeta.xyz;
                if (models.length>0)
                  for (let i=0;i<models[0].chains.length;i++)
                    nr += models[0].chains[i].size;
                metrics.nRes_Model   = nr;
                metrics.nUnits_Model = models[0].chains.length;
              } else  {
                metrics.nRes_Model   = 0;
                metrics.nUnits_Model = 0;
              }
            }
          }
        }
      }
  }
}


TaskTemplate.prototype.compareEnvironment = function ( reqEnv,env )  {
  let ok = true;
  for (let i=0;(i<reqEnv.length) && ok;i++)
    if (reqEnv[i].constructor === Array)  {
      ok = false;
      for (let j=0;(j<reqEnv[i].length) && (!ok);j++)
        ok = (env.indexOf(reqEnv[i][j])>=0);
    } else
      ok = (env.indexOf(reqEnv[i])>=0);
  return ok;
}


TaskTemplate.prototype.checkEnvironment = function ( env )  {
  return this.compareEnvironment ( this.requiredEnvironment(),env );
}


TaskTemplate.prototype._is_task_available = function ( app_name,
            exclude_tasks,local_service,any_mobile_device,cloud_storage,
            treat_private,protected_connection,maintainerEmail,client_version,
            environ_client,local_user,user_authorisation,auth_software,
            user_guide_base_url,local_setup,environ_server )  {

  // let fe_server            = conf.getFEConfig();
  // let app_name             = cmd.appName();
  // let exclude_tasks        = conf.getExcludedTasks();
  // let local_service        = conf.getClientNCConfig();
  // let any_mobile_device    = false;
  // let cloud_storage        = (storage.getUserCloudMounts(uData).length>0);
  // let treat_private        = fe_server.treat_private;
  // // let protected_connection = isProtectedConnection();
  // let protected_connection = false;
  // let maintainerEmail      = conf.getEmailerConfig().maintainerEmail;
  // let client_version       = '100.100.100';
  // let environ_client       = this.requiredEnvironment();
  // let local_user           = fe_server.localuser;
  // let user_authorisation   = uData.authorisation;
  // let auth_software        = fe_server.auth_software;
  // let user_guide_base_url  = './manuals/html-userguide/';
  // let local_setup          = conf.isLocalSetup();
  // let environ_server       = this.requiredEnvironment();


  if ((this.nc_type!='client') && (exclude_tasks.indexOf(this._type)>=0))  {
    // task excluded in server configuration
    return ['server-excluded',
            'task is not available on ' + app_name + ' server',
            '<h3>Task is not available on server</h3>' +
            'The task is excluded from configuration on ' + app_name +
            ' server which you use.<br>This may be due to the ' +
            'unavailability of software or resources, which are ' +
            '<br>required for the task.'];
  }

  if ((exclude_tasks.indexOf('unix-only')>=0) &&
      (this.platforms().indexOf('W')<0))  {
    // task not supported on Windows
    return ['windows-excluded',
            'task is not available on MS Windows systems',
            '<h3>Task is not available on MS Windows systems</h3>' +
            'The task is based on program components that are not ' +
            'suitable for MS Windows,<br>and, therefore, cannot be run.'];

  }

  if ((this.nc_type=='client') && (!local_service))  {
    // client task while there is no client running
    if (any_mobile_device)  {
      return ['client',
              'task is not available on mobile devices',
              '<h3>Local CCP4 setup is required</h3>'+
              'This task cannot be used when working with ' + app_name +
              ' from mobile devices.<br>In order to use the task, ' +
              'access ' + app_name + ' via launch icon,<br>' +
              'found in CCP4 setup on your PC.'];
    } else  {
      return ['client',
              'task is available only if started from ' + app_name + 
              ' icon in local CCP4 setup',
              '<h3>Local CCP4 setup is required</h3>' +
              'This task can be used only if ' + app_name +
              ' was accessed via launch icon,<br>found in ' +
              'CCP4 setup on your PC.'];
    }
  }

  if ((this.nc_type=='client-storage') &&
      (!local_service) && (!cloud_storage))  {
    // task require either client or cloud storage but neither is given
    return ['client-storage',
            'task is available only if started from ' + app_name + 
            ' icon in CCP4 setup or if Cloud Storage is configured',
            '<h3>Local CCP4 setup is required</h3>' +
            'This task can be used only if ' + app_name +
            ' was accessed via ' + app_name + ' icon,<br>found in ' +
            'CCP4 setup on your PC, or if user has access to ' +
            'Cloud Storage.'];
  }

  if (treat_private.length>0)  {
    let sends_out = this.sendsOut();
    if (sends_out.length>0)  {
      if ((treat_private.indexOf('all')>=0) || (sends_out.indexOf('all')>=0))
        return ['private',
                'task can transmit data to external servers, which ' +
                'is not allowed by ' + app_name + ' configuration',
                '<div style="width:350px;"><h3>Data confidentiality conflict</h3>' +
                'This task can transmit data to external servers, which ' +
                'is blocked in the configuration of ' + app_name + 
                ' server you are currently using.</div>'];
      let breachlist = [];
      for (let i=0;i<sends_out.length;i++)
        if ((sends_out[i]!='none') && (sends_out[i]!='all') && 
            (treat_private.indexOf(sends_out[i])>=0))  {
          switch (sends_out[i])  {
            case 'seq' : breachlist.push ( 'sequence(s)' );         break;
            case 'xyz' : breachlist.push ( 'structure model(s)' );  break;
            case 'lig' : breachlist.push ( 'ligand structure(s)' ); break;
            case 'hkl' : breachlist.push ( 'reflections' );         break;
            default    : breachlist.push ( 'unspecified' );
          }
        }
      if (breachlist.length>0)  {
        let blist = breachlist.join ( ', ' );
        return ['private',
                'task can transmit ' + blist + ' to external servers, which ' +
                'is not allowed by ' + app_name + ' configuration',
                '<div style="width:350px;"><h3>Data confidentiality conflict</h3>' +
                'This task can transmit ' + blist + ' to external servers, which ' +
                'is blocked in the configuration of ' + app_name + 
                ' server you are currently using.</div>'];
      }
    }
  }

  if ((this.nc_type=='browser-secure') && (!protected_connection))  {
    return ['browser-secure',
            'task requires secure internet connection',
            '<h3>Task requires secure internet connection</h3>' +
            'This task requires secure internet connection (https or<br>' +
            'localhost-based setup).<p>Contact your ' + app_name +
            ' maintainer at<br>' +
                '<a href="mailto:' + maintainerEmail +
                  '?Subject=' + 
                    encodeURIComponent(app_name+' Secure connection') +
                  '">' + maintainerEmail +
                '</a>.'];
  }

  if (this.nc_type.startsWith('client'))  {

    if (local_service &&
        (compareVersions(client_version,this.lowestClientVersion())<0))  {
      // task requires client of higher version
      return ['client-version',
              'task requires a higher version of CCP4 Cloud Client ' +
              '(update CCP4 setup on your device)',
              '<h3>Too low version of CCP4 Cloud Client</h3>' +
              'This task requires a higher version of CCP4 Cloud ' +
              'Client.<br>Please update CCP4 setup on ' +
              'your device.'];
    }

    if (((this.nc_type=='client') || (!cloud_storage)) &&
        (!this.checkEnvironment(environ_client)))
      return ['environment-client',
              'task software is not installed on your device',
              '<h3>Task software is not installed on your device</h3>' +
              'The task is to run on your device, but needful software is ' +
              'not installed on it.<br>Consult software documentation ' +
              'for further details.'];

  } else  {

    let authID = this.authorisationID();
    if (authID && //__auth_software && (authID in __auth_software) &&
        (!local_user) && ((!(authID in user_authorisation)) ||
                            (!user_authorisation[authID].auth_date)))  {
      if (auth_software && (authID in auth_software))  {
        return ['authorisation',
                'task requi=res authorisation from ' +
                auth_software[this.authorisationID()].desc_provider +
                ' (available in "My Account")',
                '<h3>Authorisation is required</h3>' +
                'This task requires authorisation from ' +
                auth_software[this.authorisationID()].desc_provider +
                ',<br>which may be obtained in "My Account" page.</br><br>' +
                '<a href="javascript:launchHelpBox1(\'Authorisation instructions\',' +
                '\'' + user_guide_base_url + auth_software[this.authorisationID()].help_page +
                '.html\',null,10)"><span style="color:blue">Authorisation instructions</span></a></br>'];
      } else  {
        return ['authorisation',
                'task requires authorisation, which is not configured',
                '<h3>Authorisation is required</h3>' +
                'This task requires authorisation, which is not available ' +
                ',<br>due to server misconfiguration.'];
      }
    }

  }

  if ((this.nc_type!='client') && (!this.checkEnvironment(environ_server)))  {
    if (local_setup>0)
      return ['environment-server',
              'task software is not installed',
              '<h3>Task software is not installed</h3>' +
              'Software, needed to run the task, is not installed on ' +
              'your machine.'];
    else
      return ['environment-server',
              'task software is not installed on ' + app_name + ' server',
              '<h3>Task software is not installed on server</h3>' +
              'Software, needed for the task, is not installed on ' +
              app_name + ' server.<br>Contact server ' +
              'maintainer for further details.'];
  }

  return ['ok','',''];

}


// export such that it could be used in both node and a browser
if (!dbx)  {
  // for client side

  TaskTemplate.prototype.onJobDialogStart = function ( job_dialog )  {}
  TaskTemplate.prototype.onJobDialogClose = function ( job_dialog,callback_func ) {
    callback_func ( true );
  }

  TaskTemplate.prototype.interface_ready  = function()  { 
    // use this function when task should launch automatically but preparation
    // of task interface in browser takes time
    return true; 
  }


  TaskTemplate.prototype.setOName = function ( base_name )  {
  // sets default oname (output file name template) according to account and
  // current project settings
    if (base_name && (base_name!='*'))  {
      this.oname = '';
      if (__current_page && (__current_page._type=='ProjectPage'))  {
        // let pData = __current_page.job_tree.projectData;
        let pData = __current_page.jobTree.projectData;
//        checkProjectData ( pData );
        if (pData)  {
          if (__user_settings.hasOwnProperty('project_prefix') &&
              __user_settings.project_prefix && (pData.settings.prefix_key==0))
                this.oname = pData.desc.name;
          else  this.oname = pData.settings.prefix;
        }
      }
      if (this.oname)
        this.oname += '_';
      this.oname += base_name;
    } else
      this.oname = base_name;
  }


  TaskTemplate.prototype.isTaskAvailable = function()  {
    return this._is_task_available ( appName(),
      __exclude_tasks,__local_service,__any_mobile_device,__cloud_storage,
      __treat_private,isProtectedConnection(),__maintainerEmail,__client_version,
      __environ_client,__local_user,__user_authorisation,__auth_software,
      __user_guide_base_url,__local_setup,__environ_server );
  }


  TaskTemplate.prototype.canClone = function ( node,jobTree )  {
    return (this.isTaskAvailable()[0]=='ok') && jobTree && 
           (!jobTree.view_only);
    /*
    if ((this.nc_type=='client') && (!__local_service))
      return false;
    return true;
    */
  }


  TaskTemplate.prototype.isArchived = function()  {
    return ('archive_version' in this) && (this.archive_version>0);
  }


  TaskTemplate.prototype.canMove = function ( node,jobTree )  {
  // Version for moving only sibling jobs
  // let parent_task = jobTree.getTaskByNodeId(node.parentId);
    if (this.isArchived())  return false;
    if ((this.state!=job_code.new) &&
        (this.state!=job_code.running) && (this.state!=job_code.exiting))  {
      let p = jobTree.getNodePosition(node);
      // p[0] is sibling position (<=0 means "leading sibling")
      return (p[0]>0); 
      // let pos   = p[0];  // sibling position (<=0 means "leading sibling")
      // let pnode = p[1];
      // let pid   = p[2];
      // let clen  = p[3];  // number of siblings
    }
    return false;
  }


  /* =================== Version based on the data flow logics

  TaskTemplate.prototype.canMove = function ( node,jobTree )  {
  let parent_task = jobTree.getTaskByNodeId(node.parentId);
  let can_move    = false;

    if (this.isArchived())  return false;

    //if (parent_task && (this.state!=job_code.new) &&
    if ((this.state!=job_code.new) &&
        (this.state!=job_code.running) && (this.state!=job_code.exiting))  {

      let p = jobTree.getNodePosition(node);
      let pos   = p[0];  // sibling position (<=0 means "leading sibling")
      let pnode = p[1];
      let pid   = p[2];
      let clen  = p[3];  // number of siblings

      can_move = true;
      //if (pnode && pid && (pos<=0) && (clen<2))  {
      if ((pos<=0) && (clen<2))  {
        // no siblings -- check input data
      //if (pnode && pid && ((pos<=0) || (clen<2)))  {
        // no siblings or seniour sibling -- check input data
        if (parent_task)  {
          for (let dtype in this.input_data.data)  {
            let d = this.input_data.data[dtype];
            for (let j=0;(j<d.length) && can_move;j++)
              if (d[j].jobId==parent_task.id)
                can_move = false;
            if (!can_move)
              break;
          }
        } else
          can_move = false;
      }

    }

    return can_move;

  }

  =========================================== */


  TaskTemplate.prototype.addDataDialogHints = function ( inp_item,summary )  {
    // This function may be used for adding or modifying hints in summary.hints
    // when they are dependent on task rather than, or in addition to, daat type.
    // 'inp_item' corresponds to an item in this.input_data.
    return summary;
  }


  TaskTemplate.prototype.getProjectURL = function ( jobId,filePath )  {
  // forms pseudo-URL for accesing file with 'filePath' relative to job
  // directory of given (NOT THIS) job in same project as 'this' one
  let token;
    //if (__login_token)  token = __login_token.getValue();
    if (__login_token)  token = __login_token;
                  else  token = '404';
    let url = __special_url_tag + '/' + token + '/' + this.project + '/' +
              jobId + '/' + filePath;
    return url;
  }


  TaskTemplate.prototype.getURL = function ( filePath )  {
  // forms pseudo-URL for accesing file with 'filePath' relative to job
  // directory
  let token;
    //if (__login_token)  token = __login_token.getValue();
    if (__login_token)  token = __login_token;
                  else  token = '404';
    let url = __special_url_tag + '/' + token + '/' + this.project + '/' +
              this.id + '/' + filePath;
    return url;
  }

  TaskTemplate.prototype.getLocalReportPath = function()  {
    return 'report/index.html';
  }

  TaskTemplate.prototype.getReportURL = function()  {
  // forms pseudo-URL for accessing files in job's report directory
  let token;
    //if (__login_token)  token = __login_token.getValue();
    if (__login_token)  token = __login_token;
                  else  token = '404';
    // 'report/index.html' is hard-wired here and is used by cofe server,
    // which sends cofe-specific jsrview bootrstrap html file back.
    let url = __special_url_tag + '/' + token + '/' + this.project + '/' +
              this.id + '/' + this.getLocalReportPath();
    return url;
  }

/*
  TaskTemplate.prototype.addHarvestLink = function ( taskId )  {
    if (this.harvestLinks.indexOf(taskId)<0)
      this.harvestLinks.push ( taskId );
  }
*/

  TaskTemplate.prototype.makeInputPanelHeader = function()  {
  // header for inputPanel, displayed in JobDialog

    function putLabel ( text,row,col )  {
      let lbl = header.setLabel ( text,row,col,1,1 )
                      .setFontItalic(true).setNoWrap().setHeight('1em');
      header.setVerticalAlignment ( row,col,'middle' );
      header.setCellSize ( '2%' ,'', row,col );
      return lbl;
    }

    function putInput ( text,prompt,row,col )  {
      //let txt = text.replace ( /<(?:.|\n)*?>/gm, '' );
      let n = text.indexOf('<b>');
      if (n<0)
        n = text.indexOf ( ' -- ' );
      if (n<0)
        n = text.length;
      let inp = header.setInputText ( text.substring(0,n).trim(),row,col,1,1 )
                      .setStyle     ( 'text','',prompt.replace(/<(?:.|\n)*?>/gm, '') );
                      //.setHeight    ( '1em' );
      header.setVerticalAlignment ( row,col,'middle' );
      header.setCellSize ( '98%','', row,col );
      return inp;
    }

    let taskDesc = this.taskDescription();
    let iconRows = 3;
    let iconSize = '80px';
    if (taskDesc)  {
      iconRows = 4;
      iconSize = '100px';
    }
    let header = new Grid ( '' );
    header.task_icon = header.setImage ( image_path(this.icon()),'',
                                         iconSize, 0,0, iconRows,1 );
    header.setLabel ( ' ', 0,1, iconRows,1 ).setWidth_px(20).setHeight ( '0.5em' );
    let row = 0;
    let t   = this.title;
    if (this.oname=='*')
      t += '<sup>&nbsp;</sup>'
    header.title = header.setLabel ( '<b>' + t + '</b>',row++,2, 1,2 )
                         .setFontSize ( '150%' ).setNoWrap();
    if (taskDesc)
      header.desc_lbl = header.setLabel ( taskDesc,row++,0, 1,2 )
                              .setFontSize('85%').setFontItalic(true).setNoWrap();

    header.uname_lbl = putLabel ( 'job description:&nbsp;',row,0 );
    header.setVerticalAlignment ( row,0,'middle' );
    header.uname_inp = putInput ( this.uname.trim(),this.name,row++,1 )
                                .setWidth ( '90%' ) //.setHeight_px ( 18 );
                                .setTooltip ( 'A single-line description of the ' +
                                   'job, which will appear in the Project Tree. ' +
                                   'The description can be changed before or '    +
                                   'after running the job.' );

    if (this.oname!='*')  {
      header.uoname_lbl = putLabel ( 'output id:&nbsp;',row,0 );
      header.setVerticalAlignment  ( row,0,'middle' );
      header.uoname_inp = putInput ( this.uoname.trim(),this.oname,row,1 )
                                   .setWidth_px(200) //.setHeight_px ( 18 );
                                   .setTooltip ( 'Base name for output files, ' +
                                      'produced by the job. Custom names may '  +
                                      'help data identification in subsequent ' +
                                      'tasks' );
    }

    header.setHLine ( 1, iconRows,0,1,4 );
    // header.setLabel ( 'Task sillabus in small font Task sillabus in small font Task sillabus in small font Task sillabus in small font',4,0,1,4 )
    //       .setFontItalic(true).setFontSize('85%');
    // header.setHLine ( 1, 5,0,1,4 );

    return header;

  }

  // reserved function name
  TaskTemplate.prototype.makeInputLayout = function()  {
  // This function may be reimplemented in task dialogs. It must return
  // a div widget, which is filled up in makeInputPanel() and then gets
  // inserted in Job Dialog. For proper sizing in JobDialog, the div should
  // have two parts: div.header and div.panel. JobDialog always keeps
  // div.header on top, while div.panel may be resized and scrolled as
  // necessary. All job input data and parameters are placed in div.grid,
  // which is actually embedded in div.panel.

    // make panel with a standard header
    let div    = new Widget ( 'div' );
    div.header = this.makeInputPanelHeader();
    div.addWidget     ( div.header );
    div.setScrollable ( 'hidden','hidden' );

    // make panel with grid for data files and input parameters
    div.panel = new Widget  ( 'div'      );
    div.addWidget           ( div.panel  );
    div.grid  = new Grid    ( '-compact' );
    div.panel.addWidget     ( div.grid   );
    div.panel.setScrollable ( 'auto','auto' );
    div.grid.inputPanel     = div;
    div.fullVersionMismatch = false;  // important for data versioining

    if ('uname_inp' in div.header)  {
      (function(task){
        div.header.uname_inp.element.oninput = function(){
          task.uname = div.header.uname_inp.getValue().trim();
          div.emitSignal ( cofe_signals.jobDlgSignal,
                           job_dialog_reason.rename_node );
        }
        div.header.uname_inp.element.onpropertychange =
                                 div.header.uname_inp.element.oninput; // for IE8
      }(this))
    }

    return div;

  }


  // reserved function name
  TaskTemplate.prototype.makeInputPanel = function ( dataBox )  {
  // returns widget (e.g. div) with input data and parameters, which
  // is inserted in Job Dialog

    dataBox.data['DataRemove'] = [new DataRemove()];

    let div = this.makeInputLayout();

    // will lay widget on invisible grid in order to avoid transient visual
    // effects; the grid will be made visible in this.layParameters()
    div.grid.setVisible ( false );

    if (this.inputMode==input_mode.root)  {
      if (this.file_select.length>0)
        this.makeFileSelectLayout ( div );
      if (this.input_ligands.length>0)
        this.makeLigandsLayout ( div );
    } else
      this.setInputDataFields ( div.grid,0,dataBox,this );
    this.layParameters ( div.grid,div.grid.getNRows()+1,0 );

    return div;

  }


  // update() may provide an action to update input panel after it is placed
  // in Job Dialog.
  TaskTemplate.prototype.updateInputPanel = function ( inputPanel ) {}


  // reserved function name
  TaskTemplate.prototype.collectInput = function ( inputPanel,ignore_keys=null )  {
  // Collects data from input widgets, created in makeInputPanel() and
  // stores it in internal fields. Returns empty string if input is
  // validated, and an error message otherwise

  let msg = '';  // The output. If everything's Ok, 'msg' remains empty,
                 // otherwise, it ocntains a concatenation of errors found.

    if (inputPanel.hasOwnProperty('header'))  {
      if (inputPanel.header.hasOwnProperty('uname_inp'))  {
        this.uname = inputPanel.header.uname_inp.getValue().trim();
        inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                job_dialog_reason.rename_node );
      }
      if (inputPanel.header.hasOwnProperty('uoname_inp'))
        this.uoname = inputPanel.header.uoname_inp.getValue();
    }

    if (this.inputMode==input_mode.root)  {
      if (this.file_select.length>0)
        msg = this.collectFileSelects ( inputPanel );
      if (this.input_ligands.length>0)
        msg += this.collectInputLigands ( inputPanel );
    } else
        msg = this.collectInputData ( inputPanel );

    if (msg)
      msg += '|';
    msg += this.collectParameterValues ( inputPanel,ignore_keys );

    return msg;

  }


  TaskTemplate.prototype.sendInputStateEvent = function ( inputPanel )  {
  // collects data from input widgets, created in makeInputPanel() and
  // stores it in internal fields
    inputPanel.emitSignal ( cofe_signals.taskReady,this.collectInput(inputPanel) );
  }


  TaskTemplate.prototype.sendTaskStateSignal = function ( inputPanel,state_str )  {
    inputPanel.emitSignal ( cofe_signals.taskReady,state_str );
  }


  // reserved function name, may be ovewritten in task classes
  TaskTemplate.prototype.runButtonName = function()  {
    // return text for 'Run' button in Job Dialog
    return 'Run';
  }

  /*
  function _fill_dropdown ( ddn )  {
    for (let j=0;j<ddn.ddndata.length;j++)
      if (ddn.ddndata[j][0])  {
        ddn.addItem ( ddn.ddndata[j][0],'',ddn.ddndata[j][1],ddn.ddndata[j][2] );
        if (ddn.ddndata[j][3])
          ddn.disableItem ( k,true );
      }
    return;
  }
  */


  TaskTemplate.prototype.__set_selected_files = function ( files,t,div,fdesc )  {
    if (files.length>0)  {
      // The next line is necessary for annotating just this upload.
      // If sequences also need to be uploaded. file_mod should be cleared
      // the 'annotation' field when seq file is being uploaded
      let file_mod = {'rename':{},'annotation':[]}; // file modification and annotation
      let fname = files[0].name;
      if (div.file_system=='cloud')  //  local/cloud for file upload
        fname = 'cloudstorage::/' + this.currentCloudPath + '/' + fname;
      let fext = fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 1)
                      .toLowerCase();
      if (['.sca','.seq','.pir','.fasta'].indexOf(fext)>=0)  {
        _import_checkFiles ( files,file_mod,div.upload_files,function(){
          if ('scalepack' in file_mod)
            div.customData.file_mod.scalepack  = file_mod.scalepack;
          else  {
            div.customData.file_mod.rename     = file_mod.rename;
            div.customData.file_mod.annotation = file_mod.annotation;
          }
          t.setValue ( fname );
        });
      } else
        t.setValue ( fname );
      // this.inputChanged ( div.grid.inpParamRef,fdesc.inputId,fname );
    }
  }


  TaskTemplate.prototype.makeFileSelectLayout = function ( div )  {

    div.customData = {};
    div.customData.login_token = __login_token;
    div.customData.project     = this.project;
    div.customData.job_id      = this.id;

    if (!('file_system' in this))  {
      this.file_system      = 'local';  //  local/cloud for file upload
      this.currentCloudPath = '';
    }
    div.file_system = this.file_system;   //  local/cloud
    if ('file_mod' in this)  // file modification and annotation
          div.customData.file_mod = this.file_mod;
    else  div.customData.file_mod = {'rename':{},'annotation':[]};
    div.upload_files = [];

    let row = div.grid.getNRows();

    div.grid.setLabel ( 'Import data from',row,0,1,1 )
            .setTooltip ( 'Specify data location' )
            .setFontItalic(true).setFontBold(true).setNoWrap();
    div.itext = [];
    div.source_select_ddn = new Dropdown();
    div.grid.addWidget ( div.source_select_ddn,row,2,1,2 );
    div.source_select_ddn.addItem ( 'local file system','','local',div.file_system=='local' );
    div.source_select_ddn.addItem ( 'cloud storage'    ,'','cloud',div.file_system=='cloud' );
    div.source_select_ddn.make();
    div.source_select_ddn.addOnChangeListener ( function(text,value){
      div.file_system = value;
      for (let i=0;i<div.itext.length;i++)
        div.itext[i].setValue ( '' );
    });
    div.source_select_ddn.setWidth ( '180px' );

    div.grid.setVerticalAlignment ( row++,0,'middle' );
    div.grid.setLabel ( '&nbsp;',row++,0,1,1 ).setHeight_px(8);

    div.file_select_rows = {};

    for (let i=0;i<this.file_select.length;i++)  {

      div.file_select_rows[this.file_select[i].inputId] = row;

      let fsdesc = this.file_select[i];

      div.grid.setLabel ( fsdesc.label,row,0,1,1 )
              .setTooltip ( fsdesc.tooltip )
              .setFontItalic(true).setFontBold(true).setNoWrap();

      div.grid.setVerticalAlignment ( row,0,'middle' );

      let fsel = div.grid.setSelectFile ( false,fsdesc.file_types,row,2,1,1 );
      fsel.hide();
      let btn  = div.grid.addButton ( 'Browse',image_path('open_file'),row,2,1,1 );
      let filename = fsdesc.path;
      if ((this.state==job_code.new) && (this.file_system!='cloud'))
        filename = '';
      let itext = div.grid.setInputText ( filename,row,3,1,2 )
                          .setWidth_px(500).setReadOnly(true).setNoWrap();
      div.itext.push ( itext );
      div.grid.setVerticalAlignment ( row,2,'middle' );
      div.grid.setVerticalAlignment ( row,3,'middle' );
      (function(b,f,fd,t,self){
        b.addOnClickListener ( function(){
          if (div.file_system=='local')
            f.click();
          else  {
            // new CloudFileBrowser ( div,div.task,4,fd.file_types.split(','),function(items){
            new CloudFileBrowser ( div,self,4,fd.file_types.split(','),function(items){
              self.__set_selected_files ( items,t,div,fd );
              return 1;  // close browser window
            },null );
          }
        });
        f.addOnChangeListener ( function(){
          let files = f.getFiles();
          self.__set_selected_files ( files,t,div,fd );
        });
      }(btn,fsel,fsdesc,itext,this))
      div[fsdesc.inputId] = fsel;

      row++;

    }

    div.grid.setLabel ( '&nbsp;',row++,0,1,1 ).setHeight_px(8);

  }


  TaskTemplate.prototype.makeLigandsLayout = function ( div )  {

    let row  = div.grid.getNRows();
    
    let row0 = row + 10000;
    for (let i=0;i<this.input_ligands.length;i++)
      if ('file' in this.input_ligands[i])
        row0 = Math.min ( row0,div.file_select_rows[this.input_ligands[i].file] );
    
    if (row0<=row)  {
      let drow = this.input_ligands.length + 2;
      div.grid.insertRows ( row0,drow );
      for (let i=0;i<this.input_ligands.length;i++)
        if ('file' in this.input_ligands[i])
          div.file_select_rows[this.input_ligands[i].file] += drow;
      row   = row0;
      row0 += drow;
    } else
      row0 = row;

    div.code_lbl   = div.grid.setLabel ( '<b><i>Code</i></b>',row,3,1,1 )
                        .setTooltip ( '3-letter code to identify the ligand. ' +
                          'If no SMILES string is given, the code must match ' +
                          'one from RCSB Compound dictionary. However, if ' +
                          'SMILES string is provided, the code must not match ' +
                          'any of known ligands, e.g., "DRG".' );
    div.smiles_lbl = div.grid.setLabel ( '<b><i>SMILES String</i></b>',row++,4,1,1 )
                        .setTooltip ( 'SMILES string describing ligands ' +
                          'structure.' );

    // list of ligands (self-expanding)
    div.ligands = [];

    function showLigands()  {
      let n = -1;
      for (let i=0;i<div.ligands.length;i++)
        if (div.ligands[i].selection.getValue()!='none')
          n = i;
      let code   = false;
      let smiles = false;
      for (let i=0;i<div.ligands.length;i++)  {
        let visible = (i<=n+1);
        let source  = div.ligands[i].selection.getValue();
        div.ligands[i].label    .setVisible ( visible );
        div.ligands[i].selection.setVisible ( visible );
        div.ligands[i].smiles   .setVisible ( visible && (source=='S') );
        div.ligands[i].code     .setVisible ( visible && (source=='S' || source=='M') );
        if (source=='S')  smiles = true;
        if (source=='S' || source=='M') code   = true;
      }
      // if (code)    div.code_lbl  .setText ( '<b><i>Code</i></b>' );
      //      else    div.code_lbl  .setText ( '&nbsp;' );
      // if (smiles)  div.smiles_lbl.setText ( '<b><i>SMILES String</i></b>' );
      //        else  div.smiles_lbl.setText ( '&nbsp;' );
      div.code_lbl  .setVisible ( code   );
      div.smiles_lbl.setVisible ( smiles );
      div.lig_lbl   .setVisible ( code || smiles );
    }

    let tooltip = '[Optional] Provide description of ligand to fit in electron ' +
                  'density, using either a SMILES string or 3-letter code. ' +
                  'It is advised not to specify the 3-letter code when SMILES ' +
                  'string is used; if left empty, a vacant code will be chosen ' +
                  'automatically.';
    if (this.input_ligands.length>1)
      tooltip += ' Up to ' + this.input_ligands.length + ' ligands may be specified.'

    for (let i=0;i<this.input_ligands.length;i++)  {

      let label = 'Ligand to fit';
      if (i>0)
        label += ' #' + (i+1);
      let lbl = div.grid.setLabel ( label,row,0,1,1 )
                        .setTooltip ( tooltip )
                        .setFontItalic(true).setFontBold(true).setNoWrap();
      div.grid.setVerticalAlignment ( row,0,'middle' );

      let sel = new Dropdown();
      sel.setWidth ( '120px' ); //.setTooltip ( tooltip );
      div.grid.setWidget ( sel,row,2,1,1 );
      sel.addItem ( 'None'  ,'','none',this.input_ligands[i].source=='none' );
      sel.addItem ( 'SMILES','','S'   ,this.input_ligands[i].source=='S'    );
      sel.addItem ( 'Code'  ,'','M'   ,this.input_ligands[i].source=='M'    );
      if ('file' in this.input_ligands[i])  {
        sel.fid = this.input_ligands[i].file;
        sel.addItem ( 'File','',sel.fid,this.input_ligands[i].source==sel.fid );
        div.grid.setRowVisible ( div.file_select_rows[sel.fid],
                                 this.input_ligands[i].source==sel.fid );
      } else
        sel.fid = null;
      sel.make();
      let code   = div.grid.setInputText ( this.input_ligands[i].code,row,3,1,1 )
                           .setWidth_px(50).setNoWrap().setMaxInputLength(3)
                           .setTooltip ( tooltip )
                           .setVisible(this.input_ligands[i].source=='M');
      let smiles = div.grid.setInputText ( this.input_ligands[i].smiles,row,4,1,1 )
                           .setWidth_px(500).setNoWrap()
                           .setTooltip ( tooltip )
                           .setVisible(this.input_ligands[i].source=='S');
      div.grid.setVerticalAlignment ( row,2,'middle' );
      div.grid.setVerticalAlignment ( row,3,'middle' );
      div.grid.setVerticalAlignment ( row,4,'middle' );
      div.ligands.push ( {'label':lbl, 'selection':sel, 'smiles':smiles, 'code':code} );
      sel.sno = i;
      sel.addOnChangeListener ( function(text,value){
        div.ligands[this.sno].code  .setVisible ( value=='S' || value=='M' );
        div.ligands[this.sno].smiles.setVisible ( value=='S' );
        if (this.fid)
          div.grid.setRowVisible ( div.file_select_rows[this.fid],value==this.fid );
        showLigands();
      });
      row++;
    }

    if (this.input_ligands.length>0)
      div.lig_lbl = div.grid.setLabel (
          '&nbsp;<br><i>Codes ' + __coot_reserved_codes.join(', ') +
          ' are reserved by Coot and cannot be used here. If no code ' +
          'is given (recommended), a suitable new one will be autogenerated</i>',
        row++,3,1,2 ).setFontColor('maroon').setVisible(false);

    div.grid.setLabel ( '&nbsp;',row++,0,1,1 ).setHeight_px(8);

    showLigands();

    // let ncols = div.grid.getNCols();
    // for (let i=1;i<ncols;i++)  {
    //   div.grid.setLabel    ( ' ',row0,i,1,1   ).setHeight_px(8);
    //   div.grid.setCellSize ( 'auto','',row0,i );
    // }
    // div.grid.setLabel    ( ' ',row0,ncols,1,1  ).setHeight_px(8);
    // div.grid.setCellSize ( '95%','',row0,ncols );

  }


  TaskTemplate.prototype.setInputDataFields = function ( grid,row,dataBox ) {
  // Sets dropdown controls for input data from 'dataBox' in grid 'grid'
  // starting from row 'row'

    function _fill_dropdown ( ddn )  {
      let ddndata = ddn.ddndata;
      for (let j=0;j<ddndata.length;j++)
        if (ddndata[j][0])  {
          ddn.addItem ( ddndata[j][0],'',ddndata[j][1],ddndata[j][2] );
          if (ddndata[j][3])
            ddn.disableItem ( ddndata[j][1],true );
        }
      return;
    }

    function _select_item ( ddn,itemId )  {
      for (let j=0;j<ddn.ddndata.length;j++)
        if (ddn.ddndata[j][0])
          ddn.ddndata[j][2] = (ddn.ddndata[j][1]==itemId);
      return;
    }

    function _fill_optimized ( ddn,selItemId )  {
      let ddndata = ddn.ddndata;

      for (let j=0;j<ddndata.length;j++)
        if (ddndata[j][0])
          ddndata[j][2] = (ddndata[j][1]==selItemId);

      for (let j=0;j<ddndata.length-1;j++)
        if (ddndata[j][0])
          for (let k=j+1;k<ddndata.length;k++)
            if (ddndata[k][0] && (ddndata[k][0]==ddndata[j][0]))  {
              if (ddndata[k][2])
                ddndata[j] = ddndata[k];
              ddndata[k] = [null];
            }

      for (let j=0;j<ddndata.length;j++)
        if (ddndata[j][0])  {
          ddn.addItem ( ddndata[j][0],'',ddndata[j][1],ddndata[j][2] );
          if (ddndata[j][3])
            ddn.disableItem ( ddndata[j][1],true );
        }

      return;

    }

    // do  nothing if input data fields section is not required
    //if ((this.input_dtypes.length==1) && (this.input_dtypes[0]==1))
    if (this.getInputMode()==input_mode.root)
      return;

    dataBox.extendData();

    // this is necessary for proper stacking of dropdown controls:
    $(grid.element).css('position','relative');

    // inpDataRef will be used in getInputData(..) (below) to set current
    // contents of dropdown controls in this.input_data
    grid.inpDataRef = { row   : row,
                        grid  : grid,
                        input : [] };

    // generate vectors of suitable (subject to subtypes) datasets; for
    // simplicity, keep just the dataset serial numbers
    let dsn = [];  // dsn[i][j] gives serial number of jth dataset
                   // suitable for ith input data parameter
    let ddt = [];  // ddt[i][j] gives dataset with serial number j of data type
                   // compatible with ith input parameter
    let ddf = [];  // ddf[i] is true if any data, suitable for ith input
                   // parameter, was generated in the previous job

    // allocate dropdown widgets
    let dropdown = [];  // dropdown[i][j] gives jth dropdown widget for ith
                        // input data parameter

    grid.void_data = {};  // collectes data from 'void' data entries

    for (let i=0;i<this.input_dtypes.length;i++)  {
      // loop over input data structures in 'this' task

      let inp_item = this.input_dtypes[i];
      let dn       = [];
      let dt       = [];
      let df       = false;

      if (!startsWith(inp_item.inputId,'void'))  {

        let k = 0;
        for (let dtype in inp_item.data_type)
          if (dtype in dataBox.data)  {  // given data type is found in the data box

            if (dtype in dataBox.data_n0)
              df = true;

            let dt1 = dataBox.data[dtype];

            if (('castTo' in inp_item) && (inp_item.castTo!=dtype))  {
              for (let j=0;j<dt1.length;j++)
                dt.push ( dt1[j].cast(inp_item.castTo) );
            } else
              dt = dt.concat ( dt1 );

            if (inp_item.data_type[dtype].length<=0)  {
              for (let j=0;j<dt1.length;j++)
                dn.push ( k++ );
            } else  {
              for (let j=0;j<dt1.length;j++)  {
                // if (dataBox.compareSubtypes(inp_item.data_type[dtype],dt1[j].subtype))
                if (dataBox.compareSubtypes(inp_item.data_type[dtype],dt1[j]))
                  dn.push ( k );
                k++;
              }
            }

          }

        // acquire currently selected data, corresponding to current data id,
        // from the task; this list is empty (zero-length) at first creation
        // of the interface
        let inp_data = this.input_data.getData ( inp_item.inputId );

        let j = -1;
        for (let n=0;n<inp_data.length;n++)  {
          j++;
          while ((j<dt.length) && (dt[j].dataId!=inp_data[n].dataId))
            j++;
          if (j<dt.length)
            dt[j] = inp_data[n].extend();
        }

      } else  {

        let void_data = [];
        for (let dtype in inp_item.data_type)
          if (dtype in dataBox.data)  // given data type is found in the data box
            void_data = void_data.concat ( dataBox.data[dtype] );

        grid.void_data[inp_item.inputId] = void_data;

      }

      dsn.push ( dn );
      ddt.push ( dt );
      ddf.push ( df );
      dropdown.push ( [] );

    }

    // 1. Fill all dropdowns with data and lay them out with all other widgets

    let versionMatch = true;
    grid.inputPanel.fullVersionMismatch = false;

    let r = row;
    for (let i=0;i<this.input_dtypes.length;i++)  {
      // loop over input data structures in 'this' task

      let dt = ddt[i];
      let dn = dsn[i];

      // check if given data type is present in the data box
      if (dn.length>0)  {

        let inp_item = this.input_dtypes[i];

        // acquire currently selected data, corresponding to current data id,
        // from the task; this list is empty (zero-length) at first creation
        // of the interface
        // let inp_data = this.input_data.getData ( inp_item.inputId );

        let layCustom = '';
        if (inp_item.hasOwnProperty('customInput'))
          layCustom = inp_item.customInput;

        let inp_item_version = 0;
        if (inp_item.hasOwnProperty('version'))
          inp_item_version = inp_item.version;

        let nmax = Math.min ( dn.length,inp_item.max );  // maximum number of
                                                         // datasets to display

        // force>0 will force choosing N=force data items (if available)
        // at first data load
        let ndset = inp_item.min;
        if (inp_item.hasOwnProperty('force'))
          ndset = Math.max ( ndset,inp_item.force );

        for (let n=0;n<nmax;n++)  {

          dropdown[i].push ( new Dropdown() );
          let ddn     = dropdown[i][n];
          ddn.dataBox = dataBox;
          ddn.row     = r;
          ddn.task    = this;
          ddn.grid    = grid;

          // put label widget in the Grid
          let label_text = inp_item.label;
          if (nmax>1)
            label_text = label_text + ' (' + (n+1) + ')';
          let label = grid.setLabel ( label_text, r,0, 1,1 ).setFontItalic(true)
                                          .setFontBold(true).setNoWrap();
          grid.setCellSize          ( '5%','',r,0  );
          grid.setVerticalAlignment ( r,0,'middle' );

          if (inp_item.hasOwnProperty('tooltip'))
            label.setTooltip ( inp_item.tooltip );

          grid.setLabel    ( '&nbsp;', r,1, 1,1 );
          grid.setCellSize ( '1%','' , r,1 );
          ddn.inspect_btn = grid.setButton  ( '',image_path('inspect'),r,2,1,1 )
                                .setTooltip ( 'Inspect details' )
                                .setSize    ( '32px','32px' )
                                .setVisible ( false );
          grid.setCellSize ( '1%','' , r,2 );

          (function(d,t,task){;
            d.inspect_btn.addOnClickListener ( function(){
              t[d.getValue()].inspectData ( task );
            });
          }(ddn,dt,this));

          let sel = true;
          if (n>=inp_item.min)  {
            if (inp_item.hasOwnProperty('unchosen_label') && (n==0))  {
              ddn.addItem ( inp_item.unchosen_label,'',-1,(n>=ndset) );
              //ddn.addItem ( 'something else','',-2,(n>=ndset+1) );
            } else
              ddn.addItem ( '[do not use]','',-1,(n>=ndset) );
            sel = (n<inp_item.min);
          }

          // fill up the combobox with data names from the box, using positive
          // itemIds and making selections as appropriate

          let ndisabled = 0;
          let ddndata   = [];
          for (let j=0;j<dn.length;j++)  {
            let k = dn[j];
            let data_title = dt[k].dname;
            if (('cast' in inp_item) && (!dt[k].hasSubtype('proxy')))  {
              let cast1  = '/' + inp_item.cast + '/';
              let p = data_title.indexOf ( '/xyz/' );
              if (p<0)  p = data_title.indexOf ( '/hkl/' );
              if (p<0)  p = data_title.indexOf ( '/unmerged/'  );
              if (p<0)  p = data_title.indexOf ( '/seqeunce/'  );
              if (p<0)  p = data_title.indexOf ( '/ensemble/'  );
              if (p<0)  p = data_title.indexOf ( '/structure/' );
              if (p<0)  p = data_title.indexOf ( '/substructure/' );
              if (p<0)  p = data_title.indexOf ( '/ligand/' );
              if (p>0)  data_title  = data_title.substr(0,p) + cast1;
                  else  data_title += ' ' + cast1;
            }
            ddndata.push ( [data_title,k,(sel && (j==n)),(dt[k].version<inp_item_version)] )
            if (dt[k].version<inp_item_version)
              ndisabled++;
          }

          // sort by decreasing data Id and increasing serial nubers
          for (let j=0;j<ddndata.length;j++)  {
            for (let k=j+1;k<ddndata.length;k++)  {
              // names start with data id like [0002-03]
              let namej = ddndata[j][0].split('-');
              let namek = ddndata[k][0].split('-');
              // if (ddndata[j][0]<ddndata[k][0])  {
              if ((namej[0]<namek[0]) || 
                  ((namej[0]==namek[0]) && (namej[1]>namek[1]))) {
                let item   = ddndata[j];
                ddndata[j] = ddndata[k];
                ddndata[k] = item;
                let ino    = dn[j];
                dn[j]      = dn[k];
                dn[k]      = ino;
              }
            }
            ddndata[j][1] = dn[j];
            ddndata[j][2] = sel && (j==n);
          }

          ddn.ddndata = ddndata;

          if (ndisabled>0)  versionMatch = false;
          if ((n<inp_item.min) && (ndisabled==dn.length) && (ndisabled>0))
                                    grid.inputPanel.fullVersionMismatch = true;

          // put the combobox in the Grid
          grid.setWidget   ( ddn,r,3, 1,1 );
          grid.setHorizontalAlignment ( r,3,'left' );
          grid.setCellSize ( '10%','',r,3 );
          grid.setLabel    ( ' ',r,4, 1,1 );
          grid.setCellSize ( '84%','',r,4 );
          ddn.make();

          r++;
          ddn.layCustom = layCustom;
          ddn.serialNo  = n;
          if (layCustom)  {
            ddn.customGrid = grid.setGrid ( '-compact',r++,3,1,1 );
            dt[dn[n]].layCustomDropdownInput ( ddn );
            ddn.grid.setRowVisible ( ddn.row+1,(n<ndset) );
            ddn.customGrid.setVisible ( (n<ndset) );
          }
          ddn.dt = dt;
          (function(dd,m){
            dd[m].addSignalHandler ( 'state_changed',function(data){
              let visible = (data.item>=0) && (!dd[m].dt[data.item].hasSubtype('proxy'));
              dd[m].inspect_btn.setVisible ( visible );
              if (dd[m].layCustom)  {
                for (let j=0;j<dd.length;j++)
                  if ((j!=m) && (dd[j].getValue()>=0))
                    dd[j].dt[dd[j].getValue()].collectCustomDropdownInput ( dd[j] );
                if ((data.prev_item!==undefined) && (data.prev_item>=0))  {
                  dd[m].dt[data.prev_item].collectCustomDropdownInput ( dd[m] );
                }
                if (data.item>=0)  {
                  dd[m].customGrid.clear();
                  dd[m].dt[data.item].layCustomDropdownInput ( dd[m] );
                }
                dd[m].grid.setRowVisible ( dd[m].row+1,visible );
                dd[m].customGrid.setVisible ( visible );
              }
            });
          }(dropdown[i],n));

        }

        // make a reference to the combobox in the inpDataRef structure for
        // further reading in 'collectInputData()'
        grid.inpDataRef.input.push ( { inputId  : inp_item.inputId,
                                       dt       : dt,
                                       dropdown : dropdown[i] } );

      }

    }

    // 2. Select datasets in dropdowns

    if (this.input_data.isEmpty())  {

      // 2a. The interface is being created for the first time, need to choose
      //     initial datasets. Firstly, use (compatible) datasets generated by
      //     the previous job. These datasets are marked in dataBox.data_n0.

      // initiate collection of associated datasets
      let associated_data = [];

      // loop over input data structures in 'this' task
      for (let i=0;i<this.input_dtypes.length;i++)
        if ((dropdown[i].length>0) && ddf[i])  {

          let dt = ddt[i];
          let dn = dsn[i];

          // check if given data type is present in the data box
          if (dn.length>0)  {

            let inp_item = this.input_dtypes[i];

            // force>0 will force choosing N=force data items (if available)
            // at first data load
            let force = 0;
            if (inp_item.hasOwnProperty('force'))
              force = inp_item.force;

            // maximum number of datasets to display
            let nmax = Math.min ( dn.length,Math.max(inp_item.min,force) );

            for (let n=0;n<nmax;n++)  {
              if (dn[n]>=0)
                associated_data = associated_data.concat ( dt[dn[n]].associated );
              //dropdown[i][n].selectItem ( dn[n] );
              if (n<dropdown[i].length)  {
                _select_item ( dropdown[i][n],dn[n] );
                dropdown[i][n].inspect_btn.setVisible ( true );
              }
            }

          }

          for (let n=0;n<dropdown[i].length;n++)
            _fill_dropdown ( dropdown[i][n] );

        }

      // set remaining datasets by associations

      // loop over input data structures in 'this' task
      for (let i=0;i<this.input_dtypes.length;i++)
        if ((dropdown[i].length>0) && (!ddf[i]))  {

          let dt = ddt[i];
          let dn = dsn[i];

          // check if given data type is present in the data box
          if (dn.length>0)  {

            let inp_item  = this.input_dtypes[i];
            let inp_assoc = [];
            for (let dtype in inp_item.data_type)
              if (dtype in dataBox.inp_assoc)
                inp_assoc = inp_assoc.concat ( dataBox.inp_assoc[dtype] );

            // force>0 will force choosing N=force data items (if available)
            // at first data load
            let force = 0;
            if (inp_item.hasOwnProperty('force'))
              force = inp_item.force;
            else  {  // try to load all relevant associated data
              for (let j=0;j<dn.length;j++)
                if (associated_data.indexOf(dt[dn[j]].dataId)>=0)
                  force++;
            }

            // maximum number of datasets to display
            let nmax = Math.min ( dn.length,Math.max(inp_item.min,force) );

            let k = 0;
            let a = true;
            for (let n=0;n<nmax;n++)  {
              if (a)  {
                while (k<dn.length)
                  if (associated_data.indexOf(dt[dn[k]].dataId)>=0)  break;
                                                               else  k++;
                if (k>=dn.length)  {
                  a = false;
                  k = 0;
                }
              }
              if (!a)  {
                while (k<dn.length)
                  if (inp_assoc.indexOf(dt[dn[k]].dataId)>=0)  break;
                                                         else  k++;
                if (k>=dn.length)  {
                  k = 0;
                } else
                  a = true;
              }
              if (!a)  {
                while (k<dn.length)
                  if (associated_data.indexOf(dt[dn[k]].dataId)<0)  break;
                                                              else  k++;
                if (k>=dn.length)
                  k = n;
              }
              if (dn[k]>=0)
                associated_data = associated_data.concat ( dt[dn[k]].associated );
              if (n<dropdown[i].length)  {
                let layCustom = dropdown[i][n].layCustom;
                dropdown[i][n].layCustom = '';
                //dropdown[i][n].selectItem ( dn[k] );
                _select_item ( dropdown[i][n],dn[n] );
                dropdown[i][n].inspect_btn.setVisible ( true );
                if (layCustom)  {
                  dropdown[i][n].layCustom = layCustom;
                  dropdown[i][n].customGrid.clear();
                  dt[dn[k]].layCustomDropdownInput ( dropdown[i][n] );
                  dropdown[i][n].grid.setRowVisible ( dropdown[i][n].row+1,true );
                  dropdown[i][n].customGrid.setVisible ( true );
                }
                k++;
              }
            }

          }

          for (let n=0;n<dropdown[i].length;n++)
            _fill_dropdown ( dropdown[i][n] );

        }

    } else  {
      // 2b. Repeat invokation of the interface -- simply put data stored
      //     in the task

      // loop over input data structures in 'this' task
      for (let i=0;i<this.input_dtypes.length;i++)
        if (dropdown[i].length>0)  {
          // fill data menu for ith input data type

          let dt = ddt[i];
          let dn = dsn[i];

          // check if given data type is present in the data box
          if (dn.length>0)  {

            let inp_item = this.input_dtypes[i];

            // acquire currently selected data, corresponding to current data id,
            // from the task; this list is empty (zero-length) at first creation
            // of the interface
            let inp_data = this.input_data.getData ( inp_item.inputId );

            // ***before 09.03.2023 let j = -1;
            for (let n=0;n<inp_data.length;n++)  {
              let j = 0;
              while ((j<dn.length) && (dt[dn[j]].dataId!=inp_data[n].dataId))
                j++;
              if (n<dropdown[i].length)  {
                if (j<dn.length)  {
                  let layCustom = dropdown[i][n].layCustom;
                  dropdown[i][n].layCustom = '';
                  // dropdown[i][n].selectItem ( dn[j] );
                  _fill_optimized ( dropdown[i][n],dn[j] );
                  dropdown[i][n].inspect_btn.setVisible ( true );
                  if (layCustom)  {
                    dropdown[i][n].layCustom = layCustom;
                    dropdown[i][n].customGrid.clear();
                    dt[dn[j]].layCustomDropdownInput ( dropdown[i][n] );
                    dropdown[i][n].grid.setRowVisible ( dropdown[i][n].row+1,true );
                    dropdown[i][n].customGrid.setVisible ( true );
                  }
                  //console.log ( dropdown[i][n].getContent() );
                } else
                  _fill_dropdown ( dropdown[i][n] );
              }
            }

            // fill remaining menus (up to specified max value), which remain 
            // hidden; unclear whether this is so necessary in 2b case, but
            // no harm
            for (let n=inp_data.length;n<dropdown[i].length;n++)
              _fill_dropdown ( dropdown[i][n] );

          }

        }

    }

    grid.inpDataRef.row = r;  // can be used for setting other widgets in the grid
    grid.dataBox        = dataBox;

    if ((this.state==job_code.new) && (!versionMatch))  {
      // postpone messages in order to put the message on top of the dialog
      if (grid.inputPanel.fullVersionMismatch)  {
        window.setTimeout ( function(){
          new MessageBox ( 'Out-versioned data',
            '<h3>Out-versioned data encountered</h3>' +
            'Some data items, collected for this task, were created with a lower ' +
            'version of ' + appName() + ',<br>where forward compatibility could not be ' +
            'provided for technical reasons. Such items<br>are disabled in comboboxes ' +
            'and cannot be selected. <b>For at least one data type,<br>all available ' +
            'data items are incompatible with the current version of the task. As a<br>' +
            'result, the task cannot be formed and the "<i>Run</i>" button is ' +
            'removed from<br>the toolbar.</b>' +
            '<p>In order to form the task, missing data must be re-generated or ' +
            're-imported by<br>repeating all the relevant tasks. You may find ' +
            'that some old tasks cannot be cloned,<br>too, in which case they ' +
            'should be created anew.' +
            '<p>Apologies for the inconvenience caused, which is due to the ' +
            'routine development and<br>update of ' + appName() + '.'
          );
        },0 );
      } else  {
        window.setTimeout ( function(){
          new MessageBox ( 'Out-versioned data',
            '<h3>Out-versioned data encountered</h3>' +
            'Some data items, collected for this task, were created with a lower ' +
            'version of ' + appName() + ',<br>where forward compatibility could not be ' +
            'provided for technical reasons. <b>Such items<br>are disabled in comboboxes ' +
            'and cannot be selected.</b>' +
            '<p>If outdated data items are required, they must be re-generated or ' +
            're-imported by<br>repeating all the relevant tasks. You may find ' +
            'that some old tasks cannot be cloned,<br>too, in which case they ' +
            'should be formed anew.' +
            '<p>Apologies for the inconvenience caused, which is due to the ' +
            'routine development and<br>update of ' + appName() + '.'
          );
        },0 );
      }
    }

  }


  TaskTemplate.prototype.trimDropdowns = function ( inpParamRef ) {
    // hide trailing "not used" dropdowns

    if ('inpDataRef' in inpParamRef.grid) {

      let input = inpParamRef.grid.inpDataRef.input;

      for (let i=0;i<input.length;i++)  {
        let dropdown = input[i].dropdown;
        if (dropdown.length>1)  {
          let n0 = -1;
          for (let n=0;n<dropdown.length;n++)
            if (dropdown[n].getValue()>=0)
              n0 = -1;
            else {
              if (dropdown[n].hasOwnProperty('customGrid'))  {
                dropdown[n].grid.setRowVisible ( dropdown[n].row+1,false );
                dropdown[n].customGrid.setVisible ( false );
              }
              if (n0<0)
                n0 = n;
            }
          if (n0>=0)  {
            for (let n=0;n<input[i].dropdown.length;n++)
              inpParamRef.grid.setRowVisible ( dropdown[n].row,(n<=n0) );
          }
        }
      }

    }

  }


  TaskTemplate.prototype.collectFileSelects = function ( inputPanel )  {
  let msg = '';  // Ok if stays empty

    for (let i=0;i<this.file_select.length;i++)  {
      this.file_select[i].path = '';
      if (inputPanel.file_system=='local')  {
        let files = inputPanel[this.file_select[i].inputId].getFiles();
        if (files.length>0)
          this.file_select[i].path = files[0].name;
      } else
        this.file_select[i].path = inputPanel.itext[i].getValue();
      if ((this.file_select[i].path.length<=0) && (this.file_select[i].min>0))
        msg += '|<b><i>' + this.file_select[i].label + ' file is not specified</i></b>';
    }

    this.file_system = inputPanel.file_system;
    this.file_mod    = inputPanel.customData.file_mod;

    return  msg;

  }


  TaskTemplate.prototype.collectInputLigands = function ( inputPanel )  {
    let msg = '';  // Ok if stays empty

    if ('ligands' in inputPanel)  {

      for (let i=0;i<this.input_ligands.length;i++)  {
        this.input_ligands[i].source = inputPanel.ligands[i].selection.getValue();
        this.input_ligands[i].smiles = inputPanel.ligands[i].smiles.getValue();
        this.input_ligands[i].code   = inputPanel.ligands[i].code.getValue();
        if (this.input_ligands[i].source!='none')  {
          if ((this.input_ligands[i].source=='M') && (!this.input_ligands[i].code))
            msg += '|<b><i>Code for ligand #' + (i+1) + ' is not given</i></b>';
          if ((this.input_ligands[i].source=='S') && (!this.input_ligands[i].smiles))
            msg += '|<b><i>SMILES string for ligand #' + (i+1) + ' is not given</i></b>';
        }
      }

      let unique = true;
      for (let i=0;(i<this.input_ligands.length) && unique;i++)
        if ((this.input_ligands[i].source!='none') && (this.input_ligands[i].code))  {
          for (let j=i+1;(j<this.input_ligands.length) && unique;j++)
            if ((this.input_ligands[j].source!='none') &&
                (this.input_ligands[i].code==this.input_ligands[j].code))  {
              unique = false;
              msg += '|<b><i>Repeat use of ligand code ' + this.input_ligands[i].code +
                    '</i></b>';
            }
        }

    }

    return  msg;

  }


  TaskTemplate.prototype.collectInputData = function ( inputPanel ) {
  // This function collects input data (that is, secification of input files),
  // from input panel. The data populates this.input_data structure.

    let msg = '';  // The output. If everything's Ok, 'msg' remains empty,
                   // otherwise, it ocntains a concatenation of errors found.

    let inp_data = new DataBox();

    function collectData ( widget ) { // made recursive due to unspecified
                                      // enclosure of widgets in input panel

      if (('inpDataRef' in widget) && ('dataBox' in widget))  {
        let input = widget.inpDataRef.input;

        for (let i=0;i<input.length;i++)  {
          let dt       = input[i].dt;
          let dropdown = input[i].dropdown;
          for (let j=0;j<dropdown.length;j++)  {
            let index = dropdown[j].getValue();
            if (index>=0)  { // this skips non-mandatory items selected as
                             // 'do not use'
              // clone data object, otherwise input from customGrid will be
              // stored in original metadata, which is not good
              //$$$$ does not clone!
              let dtj = jQuery.extend ( true,{},dt[index] );
              //let dtj = deepClone ( dt[index] );
              if (dropdown[j].hasOwnProperty('customGrid'))  {
                let msg_j = dtj.collectCustomDropdownInput ( dropdown[j] );
                if (msg_j.length>0)
                  msg += '|' + msg_j;
              }
              dtj.visible = dropdown[j].isVisible();
              inp_data.addCustomData ( input[i].inputId,dtj );
            }
          }
        }

      }

      if ('void_data' in widget)
        for (let inputId in widget.void_data)
          for (let j=0;j<widget.void_data[inputId].length;j++)
            inp_data.addCustomData ( inputId,widget.void_data[inputId][j] );

      for (let i=0;i<widget.child.length;i++)
        collectData ( widget.child[i] );

    }

    collectData ( inputPanel );

    this.input_data = inp_data;
    this.input_data.markNotEmpty();

    return msg;

  }


  TaskTemplate.prototype.evaluateCondition = function ( condition,parameters,
                                                        dataState )  {
  //
  //   Returns True or False depending on logical expression given in
  // dictionary 'condition'. The dictionary is made of nested logical
  // expressions, e.g. the following condition:
  //
  //  { _:'&&',  // apply logical 'and' to all items on this level
  //    DATA1 : [v1,v2],  // True if parameter DATA1 has value of 'v1' or 'v2'
  //    CONDITION1 : {    // next level (brackets), any key is allowed
  //      _:'||',   // apply logical 'or' to all items on this level
  //      DATA2 : [v3]  ,   // True if parameter DATA2 has value 'v3'
  //      DATA3 : [v4,v5]
  //    }
  //  }
  //
  //  is equivalent to
  //        ((DATA1==v1) || (DATA1==v2)) &&
  //        ((DATA2==v3) || (DATA3==v4) || (DATA3==v5))
  //
  //  ASSUMPTIONS:
  //   (o) if operation specificator '_' is absent, logical 'and' is assumed.
  //   (o) missing 'DATAX'is equivalent to 'false'
  //   (o) special values '__is_visible__' and '__not_visible__' refer to
  //       the visibility of data widget
  //

    let op = '&&';  // logical 'and'
//    try {
    if ('_' in condition)
      op = condition['_'];
//    } catch(err)  {
//      alert ( 'condition=' + condition );
//    }

    let result = (op=='&&');

    for (let c in condition)
      if (c!='_')  {
        let value = false;
        if (condition[c].constructor===Array)  {
          if (c in parameters)  {
            let v = null;
            if (parameters[c].hasOwnProperty('input'))
              v = parameters[c].input.getValue();
            else if (parameters[c].ref.hasOwnProperty('value'))
              v = parameters[c].ref.value;
            value = (condition[c].indexOf(v)>=0);
            if (!value)  {
              if (condition[c].indexOf('__is_visible__')>=0)
                value = parameters[c].ref.visible;
              else if (condition[c].indexOf('__not_visible__')>=0)
                value = !parameters[c].ref.visible;
            }
          } else if (c in dataState)  {
            value = (condition[c].indexOf(dataState[c])>=0);
          } else {
            value = (condition[c].indexOf(-1)>=0);
          }
        } else  {
          value = this.evaluateCondition ( condition[c],parameters,dataState );
        }
        if (op=='&&')  {
          result = value;
          if (!result)  break;
        } else  {
          result = value;
          if (result)  break;
        }
      }

    return result;

  }

  TaskTemplate.prototype.addCustomDataState = function ( inpDataRef,dataState ) {}

  TaskTemplate.prototype.getDataState = function ( inpDataRef )  {
  let grid      = inpDataRef.grid;
  let dataState = {};

    for (let i=0;i<this.input_dtypes.length;i++)  {
      let inputId = this.input_dtypes[i].inputId;
      let item    = this.getInputItem ( inpDataRef,inputId );
      if (item)  {
        let dropdown = item.dropdown;
        let dt       = item.dt;
        dataState[inputId] = 0;
        for (let j=0;j<dropdown.length;j++)  {
          let index = dropdown[j].getValue();
          if ((!grid.wasRowHidden(dropdown[j].row)) && (index>=0))  {
            dataState[inputId]++;
            let ids = inputId + '.type:' + dt[index]._type;
            if (!dataState.hasOwnProperty(ids))
                  dataState[ids] = 1;
            else  dataState[ids]++;
            let subtype = dt[index].subtype;
            for (let k=0;k<subtype.length;k++)  {
              ids = inputId + '.subtype:' + subtype[k];
              if (!dataState.hasOwnProperty(ids))
                    dataState[ids] = 1;
              else  dataState[ids]++;
            }
          }
        }
      }
    }

    this.addCustomDataState ( inpDataRef,dataState );

    return dataState;

  }

  TaskTemplate.prototype.inputChanged = function ( inpParamRef,emitterId,
                                                   emitterValue )  {
  //let inpDataRef = inpParamRef.grid.inpDataRef;
  let parameters = inpParamRef.parameters;
  //let input      = inpDataRef.input;
  //let dataState  = this.getDataState ( inpDataRef );
  let dataState  = null;

    if ('inpDataRef' in inpParamRef.grid)
          dataState = this.getDataState ( inpParamRef.grid.inpDataRef );
    else  dataState = {};

    for (let key in parameters)  {
      parameters[key].ref.visible = true;
      if (key in inpParamRef.showon)
        parameters[key].ref.visible = this.evaluateCondition (
                               inpParamRef.showon[key],parameters,dataState );
      if (parameters[key].ref.visible && (key in inpParamRef.hideon))
        parameters[key].ref.visible = !this.evaluateCondition (
                               inpParamRef.hideon[key],parameters,dataState );
    }

    for (let key in parameters)  {
      let show = parameters[key].ref.visible;
      if (parameters[key].ref._visible!=show)  {
        for (let elem in parameters[key])
          if ('setVisible' in parameters[key][elem])
            parameters[key][elem].setVisible ( show );
        parameters[key].ref._visible = show;
      }
    }

    this.trimDropdowns ( inpParamRef );

  }


  function _make_label ( inpParamRef,key,item,grid,row,col,rowSpan,colSpan )  {
  // made as a global function in order to optimise recursive _lay_parameters

    inpParamRef.parameters[key]     = {};
    inpParamRef.parameters[key].ref = item;
    inpParamRef.parameters[key].ref.visible  = true;
    inpParamRef.parameters[key].ref._visible = true;

    if (item.hasOwnProperty('lwidth'))  {
      if (item.lwidth==0)
        return col;
    }

    let item_label  = '';
    let item_label2 = '';
    if (item.hasOwnProperty('label'))
      item_label  = item.label;
    if (item.hasOwnProperty('label2'))
      item_label2 = item.label2;
    if (item.hasOwnProperty('default_value') && (item.value!=item.default_value) &&
        ((!item.hasOwnProperty('default')) || 
         ((item.default_value=='') && (item.value!=item.default))))  {
      item_label  = '<font style=\'color:darkblue\'><i>' + item_label  + '</i></font>';
      item_label2 = '<font style=\'color:darkblue\'><i>' + item_label2 + '</i></font>';
    }

    inpParamRef.parameters[key].label =
                           grid.addLabel ( item_label,row,col,rowSpan,colSpan )
                               .setNoWrap();
    if (item.hasOwnProperty('tooltip'))
      inpParamRef.parameters[key].label.setTooltip ( item.tooltip );
    if (item.hasOwnProperty('lwidth'))  {
      if (!endsWith(item.lwidth.toString(),'%'))  {
        inpParamRef.parameters[key].label.setWidth_px ( item.lwidth );
        grid.setCellSize ( item.lwidth + 'px','',row,col );
      } else  {
        inpParamRef.parameters[key].label.setWidth ( item.lwidth );
        grid.setCellSize ( item.lwidth,'',row,col );
      }
    }
    grid.setVerticalAlignment ( row,col,'middle' );
    if (item.hasOwnProperty('align'))  {
      inpParamRef.parameters[key].label.setHorizontalAlignment ( item.align );
      grid.setHorizontalAlignment ( row,col,item.align );
    }
    if (item.type!='label')  {
      inpParamRef.parameters[key].sep = grid.addLabel ( '',row,col+1,1,1 )
                                            .setWidth_px(1);
      grid.setCellSize ( '1px','',row,col+1 );
    }
    if (item.hasOwnProperty('label2'))  {
      if (item.type!='label')  {
        inpParamRef.parameters[key].sep2 = grid.addLabel ( '',row,col+3,1,1 )
                                               .setWidth_px(1);
        grid.setCellSize ( '1px','',row,col+3 );
      }
      inpParamRef.parameters[key].label2 =
                             grid.addLabel ( item_label2,row,col+4,rowSpan,1 )
                                 .setNoWrap();
      if (item.hasOwnProperty('tooltip2'))
        inpParamRef.parameters[key].label.setTooltip ( item.tooltip2 );
      if (item.hasOwnProperty('lwidth2'))  {
        if (!endsWith(item.lwidth2.toString(),'%'))  {
          inpParamRef.parameters[key].label2.setWidth_px ( item.lwidth2 );
          grid.setCellSize ( item.lwidth2 + 'px','',row,col+4 );
        } else  {
          inpParamRef.parameters[key].label2.setWidth ( item.lwidth2 );
          grid.setCellSize ( item.lwidth2,'',row,col+4 );
        }
      }
      grid.setVerticalAlignment ( row,col+4,'middle' );
      if (item.hasOwnProperty('align2'))  {
        inpParamRef.parameters[key].label2.setHorizontalAlignment ( item.align2 );
        grid.setHorizontalAlignment ( row,col,item.align2 );
      }
    }

    return col+2;

  }


  TaskTemplate.prototype._make_show_links = function ( inpParamRef )  {

    let par = inpParamRef.parameters;

    for (let key in par)  {
      let item = par[key].ref;

      // make show/hide references
      if (item.hasOwnProperty('showon'))
        inpParamRef.showon[key] = item.showon;
      if (item.hasOwnProperty('hideon'))
        inpParamRef.hideon[key] = item.hideon;

      let emId = [];
      // set element's initial state
      if (item.hasOwnProperty('showon'))
        for (let emitterId in item.showon)  {
          if (par.hasOwnProperty(emitterId))
                this.inputChanged ( inpParamRef,emitterId,par[emitterId].ref.value );
          else  this.inputChanged ( inpParamRef,emitterId,-1 );  // input data missing or "[do not use]"
          emId.push ( emitterId );
        }
      if (item.hasOwnProperty('hideon'))
        for (let emitterId in item.hideon)
          if (emId.indexOf(emitterId)<0)  {
            if (par.hasOwnProperty(emitterId))
                  this.inputChanged ( inpParamRef,emitterId,par[emitterId].ref.value );
            else  this.inputChanged ( inpParamRef,emitterId,-1 );  // input data missing or "[do not use]"
            emId.push ( emitterId );
          }
    }

  }

  TaskTemplate.prototype._set_item_emitting = function ( inpParamRef,key,item )  {

    if (item.hasOwnProperty('emitting'))  {
      if (item.emitting)
        (function(paramRef,Id,task){
          let input = paramRef.parameters[Id].input;
          input.change_counter = 0;
          input.addOnInputListener ( function(){
            input.change_counter++;
            window.setTimeout ( function(){
              input.change_counter--;
              if (input.change_counter<=0)
                task.inputChanged ( paramRef,Id,input.getValue() );
            },750 );
          });
        }(inpParamRef,key,this));
    }

  }


  TaskTemplate.prototype._lay_parameters = function ( grid,row,col,params,inpParamRef ) {
  // internal recursive function, do not overwrite
  let iwidth,iheight,defval,tooltip;

    for (let key in params) {

      if (params.hasOwnProperty(key))  {
        let item = params[key];

        if (item.hasOwnProperty('type'))  {

          let r  = row + item.position[0];
          let c  = col + item.position[1];
          let rs = item.position[2];
          let cs = item.position[3];

          item.visible = true;
          
          if ('default' in item)           defval  = item.default;
          else if ('placeholder' in item)  defval  = item.placeholder;
                                     else  defval  = '';
          if ('tooltip' in item)  tooltip = item.tooltip;
                            else  tooltip = '';

          switch (item.type)  {

            case 'section'  : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              if (item.title.length>0)  {
                                let sec = grid.setSection ( item.title,item.open,
                                                            r,c,rs,cs );
                                inpParamRef.parameters[key].sec = sec;
                                inpParamRef.parameters[key].ref.visible  = true;
                                inpParamRef.parameters[key].ref._visible = true;
                                sec.grid.setStyle    ( '-compact' );
                                this._lay_parameters ( sec.grid,0,0,item.contains,
                                                       inpParamRef );
                              } else  {
                                let sec = grid.setGrid ( '-compact',r,c,rs,cs );
                                inpParamRef.parameters[key].sec = sec;
                                inpParamRef.parameters[key].ref.visible  = true;
                                inpParamRef.parameters[key].ref._visible = true;
                                this._lay_parameters ( sec,0,0,item.contains,
                                                       inpParamRef );
                              }
                          break;

            case 'label'    : _make_label  ( inpParamRef,key,item,grid,r,c,rs,cs );
                              if (item.hasOwnProperty('lwidth'))
                                grid.setCellSize ( item.lwidth+'px','',r,c );
                              //grid.setSpan ( r,c,rs,cs );
                          break;

            case 'integer'  :
            case 'integer_' : c = _make_label ( inpParamRef,key,item,grid,r,c,rs,1 );
                              if (item.hasOwnProperty('iwidth'))
                                    iwidth = item.iwidth;
                              else  iwidth = 80;
                              inpParamRef.parameters[key].input =
                                 grid.addInputText ( item.value,r,c,rs,cs )
                                     .setStyle ( 'text','integer',defval,tooltip )
                                     .setWidth_px ( iwidth );
                              grid.setCellSize ( iwidth+'px','',r,c );
                              this._set_item_emitting   ( inpParamRef,key,item );
                              if (item.hasOwnProperty('readonly'))
                                inpParamRef.parameters[key].input
                                           .setReadOnly ( item.readonly );
                              grid.setVerticalAlignment ( r,c,'middle' );
                          break;

            case 'real'     :
            case 'real_'    : c = _make_label ( inpParamRef,key,item,grid,r,c,rs,1 );
                              if (item.hasOwnProperty('iwidth'))
                                    iwidth = item.iwidth;
                              else  iwidth = 80;
                              inpParamRef.parameters[key].input =
                                 grid.addInputText ( item.value,r,c,rs,cs )
                                     .setStyle ( 'text','real',defval,tooltip )
                                     .setWidth_px ( iwidth );
                              grid.setCellSize ( iwidth+'px','',r,c );
                              this._set_item_emitting   ( inpParamRef,key,item );
                              if (item.hasOwnProperty('readonly'))
                                inpParamRef.parameters[key].input
                                           .setReadOnly ( item.readonly );
                              grid.setVerticalAlignment ( r,c,'middle' );
                          break;

            case 'string'   :
            case 'string_'  : c = _make_label ( inpParamRef,key,item,grid,r,c,rs,1 );
                              if (item.hasOwnProperty('iwidth'))
                                    iwidth = item.iwidth;
                              else  iwidth = 80;
                              inpParamRef.parameters[key].input =
                                 grid.addInputText ( item.value,r,c,rs,cs )
                                     .setStyle ( 'text','',defval,tooltip )
                                     .setWidth_px ( iwidth );
                              if (item.hasOwnProperty('maxlength'))
                                inpParamRef.parameters[key].input
                                           .setMaxInputLength ( item.maxlength );
                              this._set_item_emitting   ( inpParamRef,key,item );
                              if (item.hasOwnProperty('readonly'))
                                inpParamRef.parameters[key].input
                                           .setReadOnly ( item.readonly );
                              grid.setVerticalAlignment ( r,c,'middle' );
                          break;

            case 'combobox' : c = _make_label ( inpParamRef,key,item,grid,r,c,rs,1 );
                              let dropdown = new Dropdown();
                              for (let i=0;i<item.range.length;i++)  {
                                let choice = item.range[i].split('|');
                                if (choice.length<2)
                                  choice = [i.toString(),item.range[i]];
                                dropdown.addItem ( choice[1],'',choice[0],
                                                   choice[0]==item.value );
                              }
                              grid.addWidget   ( dropdown, r,c,rs,cs );
                              if (item.hasOwnProperty('iwidth'))
                                dropdown.setWidth ( item.iwidth );
                              //dropdown.setTooltip ( item.tooltip );
                              dropdown.make();
                              dropdown.setZIndex ( 200-r );  // prevent widget overlap
                              inpParamRef.parameters[key].input = dropdown;
                              // Listen for input event, in case it needs to
                              // control other elements
                              (function(paramRef,Id,task){
                                dropdown.element.addEventListener('state_changed',
                                  function(e){
                                    task.inputChanged ( paramRef,Id,e.detail.item );
                                  },false );
                                window.setTimeout ( function(){
                                  task.inputChanged ( paramRef,Id,item.value );
                                },0);
                              }(inpParamRef,key,this));
                          break;

            case 'checkbox' : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              inpParamRef.parameters[key].ref.visible  = true;
                              inpParamRef.parameters[key].ref._visible = true;
                              let checkbox = grid.addCheckbox ( item.label,
                                                         item.value,r,c,rs,cs );
                              checkbox.setTooltip ( item.tooltip );
                              if (item.hasOwnProperty('iwidth'))  {
//                                if (item.iwidth.toString().endsWith('%'))
                                if (endsWith(item.iwidth.toString(),'%'))
                                      checkbox.setWidth    ( item.iwidth );
                                else  checkbox.setWidth_px ( item.iwidth );
                              } else  checkbox.setWidth    ( '100%' );
                              inpParamRef.parameters[key].input = checkbox;
                              (function(paramRef,Id,cbx,task){
                                $(cbx.checkbox).on('click', function(){
                                  task.inputChanged ( paramRef,Id,cbx.getValue() );
                                });
                              }(inpParamRef,key,checkbox,this));
                          break;

            case 'textarea_':
            case 'textarea' : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              inpParamRef.parameters[key].ref.visible  = true;
                              inpParamRef.parameters[key].ref._visible = true;
                              let placeholder = '';
                              let nrows       = 5;
                              let ncols       = 80;
                              if (item.hasOwnProperty('placeholder'))
                                placeholder = item.placeholder;
                              if (item.hasOwnProperty('nrows'))
                                nrows = item.nrows;
                              if (item.hasOwnProperty('ncols'))
                                ncols = item.ncols;
                              let textarea = grid.setTextArea ( item.value,
                                        placeholder, nrows,ncols, r,c, rs,cs );
                              textarea.setTooltip ( item.tooltip );
                              $(textarea.element).css ({
                                // 'box-shadow'  : '6px 6px lightgray',
                                'resize'      : 'none',
                                'font-family' : 'monospace'
                              });
                              textarea.setShade ( '6px 6px lightgray','none',
                                                  __active_color_mode );
                              if (item.hasOwnProperty('iwidth'))  {
//                                if (item.iwidth.toString().endsWith('%'))
                                if (endsWith(item.iwidth.toString(),'%'))
                                      textarea.setWidth    ( item.iwidth );
                                else  textarea.setWidth_px ( item.iwidth );
                              } else  textarea.setWidth    ( '100%' );
                              inpParamRef.parameters[key].input = textarea;
                              (function(paramRef,Id,txa,task){
                                txa.addOnInputListener(function() {
                                  task.inputChanged ( paramRef,Id,txa.getValue() );
                                });
                              }(inpParamRef,key,textarea,this));
                          break;

            case 'aceditor_':
            case 'aceditor' : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              inpParamRef.parameters[key].ref.visible  = true;
                              inpParamRef.parameters[key].ref._visible = true;
                              iwidth  = 800;
                              iheight = 320;
                              if (item.hasOwnProperty('iwidth'))
                                iwidth = item.iwidth;
                              if (item.hasOwnProperty('iheight'))
                                iheight = item.iheight;
                              let pholder = '';
                              if (item.hasOwnProperty('placeholder'))
                                pholder = item.placeholder;
                              let aceditor = new ACEditor ( iwidth,iheight,{
                                'box-shadow'  : '6px 6px lightgray',
                                'theme'       : 'chrome',
                                'mode'        : 'python'
                              });
                              grid.setWidget ( aceditor,r,c,rs,cs );
                              aceditor.setTooltip ( item.tooltip );
                              //$(aceditor.element).css ( {'resize':'none'} );
                              inpParamRef.parameters[key].input = aceditor;
                              (function(acedt,text,placeholder){
                                window.setTimeout ( function(){
                                  acedt.init ( text,placeholder );
                                },0);
                              }(aceditor,item.value,pholder));
                          break;


            default : break;

          }

        }

      }

    }

  }


  TaskTemplate.prototype.countInputData = function ( inpDataRef,inputId,subtype ) {
  // counts the current number of datasets belonging to given 'inputId' and
  // 'subtype'. Empty subtype ('') will return the total number for all
  // subtypes.
  let n = 0;
  let item = this.getInputItem ( inpDataRef,inputId );
  let grid = inpDataRef.grid;

    if (item)  {
      let dropdown = item.dropdown;
      if (!subtype)  {
        for (let j=0;j<dropdown.length;j++)
          if ((!grid.wasRowHidden(dropdown[j].row)) && (dropdown[j].getValue()>=0))
            n++;
      } else  {
        let dt = item.dt;
        for (let j=0;j<dropdown.length;j++)  {
          let index = dropdown[j].getValue();
          if ((!grid.wasRowHidden(dropdown[j].row)) && (index>=0) &&
              (dt[index].subtypes.indexOf(subtype)>=0))
            n++;
        }
      }
    }

    return n;

  }

/*
    TaskTemplate.prototype.countInputData = function ( inpDataRef,inputId ) {
    // counts the current number of datasets belonging to given 'inputId'.
    let n = 0;
    let input = inpDataRef.input;
    let grid  = inpDataRef.grid;

      for (let i=0;i<input.length;i++)
        if (input[i].inputId==inputId)  {
          let dropdown = input[i].dropdown;
          for (let j=0;j<dropdown.length;j++)
            if ((!grid.wasRowHidden(dropdown[j].row)) && (dropdown[j].getValue()>=0))
              n++;
          break;
        }

      return n;

    }
*/

  TaskTemplate.prototype.getInputItem = function ( inpDataRef,inputId ) {
  // returns input item corresponding to given 'inputId'.
  let item  = null;
  let input = inpDataRef.input;
    for (let i=0;(i<input.length) && (!item);i++)
      if (input[i].inputId==inputId)
        item = input[i];
    return item;
  }



  TaskTemplate.prototype.getInputData = function ( inpDataRef,inputId ) {
  // returns input item corresponding to given 'inputId'.
  let item = this.getInputItem ( inpDataRef,inputId );
  let data = [];

    if (item)  {
      let dt       = item.dt;
      let dropdown = item.dropdown;
      for (let i=0;i<dropdown.length;i++)  {
        let index = dropdown[i].getValue();
        if (index>=0)  { // this skips non-mandatory items selected as
                         // 'do not use'
          // clone data object, otherwise input from customGrid will be
          // stored in original metadata, which is not good
          let dti = jQuery.extend ( true,{},dt[index] );
          if (dropdown[i].hasOwnProperty('customGrid'))
            dti.collectCustomDropdownInput ( dropdown[i] );
          dti.visible = dropdown[i].isVisible();
          data.push ( dti );
        }
      }
    }

    return data;

  }


  TaskTemplate.prototype.getInputItemNo = function ( inpDataRef,inputId ) {
  // returns input item corresponding to given 'inputId'.
  let itemNo = -1;
  let input  = inpDataRef.input;
    for (let i=0;(i<input.length) && (itemNo<0);i++)
      if (input[i].inputId==inputId)
        itemNo = i;
    return itemNo;
  }


  TaskTemplate.prototype._make_data_signals = function ( grid ) {
  // makes input data fields to broadcast on-change signals

    if (grid.hasOwnProperty('inpParamRef') && grid.hasOwnProperty('inpDataRef')) {

      // set listeners on all input data fields and connect them to
      // the general visibility controller (function _input_changed())
      let input = grid.inpDataRef.input;
      for (let i=0;i<input.length;i++)  {
        let dropdown = input[i].dropdown;
        for (let j=0;j<dropdown.length;j++)
          (function(dropdownRef,paramRef,Id,task){
            dropdown[j].element.addEventListener('state_changed',
              function(e){
                let n=0;  // signal value is the number of non-void selections
                for (let k=0;k<dropdownRef.length;k++)
                  if ((!grid.wasRowHidden(dropdownRef[k].row)) &&
                      (dropdownRef[k].getValue()>=0))
                    n++;
                task.inputChanged ( paramRef,Id,n );
              },false );
          }(dropdown,grid.inpParamRef,input[i].inputId,this));
        // simulate dropdown click in order to set initial state of dependent
        // parameters
        dropdown[0].click();
      }

    }

  }


  TaskTemplate.prototype.layParameters = function ( grid,row,col )  {
  // Lays task parameters, described in 'this.parameters' json, on the grid
  // given, starting from given row and offset by given column. Along with
  // laying parameters, it also created 'grid.inpParamRef' structure with
  // references to input widgets, used later for collecting values of the
  // corresponding parameters.

    // grid.setButton ( 'Reset parameters to default values',
    //                  image_path('reset'), row,0,1,5 );
    // row++;

    grid.inpParamRef = { row        : row,
                         grid       : grid,
                         parameters : {},
                         showon     : {},
                         hideon     : {}
                       };

    this._lay_parameters ( grid,row,col,this.parameters,grid.inpParamRef );
    (function(task,grd){
      window.setTimeout ( function(){
        task._make_show_links   ( grd.inpParamRef );
        task._make_data_signals ( grd );
        // now show all widgets at once
        window.setTimeout ( function(){
          grd.setVisible ( true );
        },10 );
      },0 );
    }(this,grid))

  }


  TaskTemplate.prototype.invalidParamMessage = function ( message,explanation ) {
    return '<b>' + message + '</b><br><i style="font-size:14px;">' +
                   explanation + '</i>';
  }

  TaskTemplate.prototype.collectParameterValues = function ( widget,ignore_keys=null ) {
  // 'ignore' can give a list of data keys, errors for which will be ignored
  // (but data is collected). This is used in Workflow Creator.

    let msg = '';  // The output. If everything's Ok, 'msg' remains empty,
                   // otherwise, it ocntains a concatenation of errors found.

    function addMessage ( item,key,message )  {
      if (item.visible)  {
        let id = key;
        if ('reportas' in item)     id = item.reportas;
        else if ('label' in item)   id = item.label;
        else if ('keyword' in item) id = item.keyword;
        if (startsWith(id,'<b>'))
          id = id.replace('<b>','').replace('</b>','');
        msg += '|<b>' + id + ':</b> ' + message;
      }
    }

    function checkRange ( value,item,key )  {
      if ('range' in item)  {
        if (item.range[0]=='*')  {
          if (value>item.range[1])
            addMessage ( item,key,
                'value should be less or equal to ' + item.range[1] );
          else
            item.value = value;
        } else if (item.range[1]=='*')  {
          if (value<item.range[0])
            addMessage ( item,key,
                'value should be greater or equal to ' + item.range[0] );
          else
            item.value = value;
        } else if ((value<item.range[0]) || (value>item.range[1]))
          addMessage ( item,key,
              'value should be between ' + item.range[0] +
              ' and ' + item.range[1] );
        else
          item.value = value;
      } else
        item.value = value;
    }

    function collectValues ( widget ) {
    // this function is made recursive, because no anticipations on widget
    // enclosures in job's input panel is made.

      if ('inpParamRef' in widget)  {

        for (let key in widget.inpParamRef.parameters)  {

          let ignore = ignore_keys && (ignore_keys.indexOf(key)>=0);
          let param  = widget.inpParamRef.parameters[key];
          let item   = param.ref;

          switch (item.type)  {

            case 'integer_' :
            case 'integer'  : let texti = param.input.getValue().trim();
                              if (texti.length<=0)  {
                                if (item.type=='integer_')  {
                                  if (isNaN(item.default))
                                        item.value = '';
                                  else  item.value = item.default;
                                } else if (!ignore)
                                  addMessage ( item,key,'no value given' );
                              } else if (isInteger(texti))  {
                                let value = parseInt ( texti );
                                checkRange ( value,item,key );
                              } else if (!ignore)
                                addMessage ( item,key,'wrong integer format' );
                          break;

            case 'real_'    :
            case 'real'     : let textr = param.input.getValue().trim();
                              if (textr.length<=0)  {
                                if (item.type=='real_')  {
                                  if (isNaN(item.default))
                                        item.value = '';
                                  else  item.value = item.default;
                                } else if (!ignore)
                                  addMessage ( item,key,'no value given' );
                              } else if (isFloat(textr))  {
                                let value = parseFloat ( textr );
                                checkRange ( value,item,key );
                              } else if (!ignore)
                                addMessage ( item,key,'wrong real format' );
                          break;

            case 'string_'  :
            case 'string'   : let texts = param.input.getValue().trim();
                              if (texts.length<=0)  {
                                if (item.type=='string_')  {
                                  if ('default' in item)
                                        item.value = item.default;
                                  else  item.value = '';
                                } else if (!ignore)
                                  addMessage ( item,key,'no value given' );
                              } else
                                item.value = texts;
                          break;

            case 'checkbox' :
            case 'combobox' : item.value = param.input.getValue();
                          break;

            case 'textarea_':
            case 'textarea' : let texta = param.input.getValue();
                              if (texta.length<=0)  {
                                if (item.type=='textarea_')  {
                                  if ('default' in item)
                                        item.value = item.default;
                                  else  item.value = '';
                                } else if (!ignore)
                                  addMessage ( item,key,'no value given' );
                              } else
                                item.value = texta;
                          break;

            case 'aceditor_':
            case 'aceditor' : let texte = param.input.getText();
                              if (texte.length<=0)  {
                                if (item.type=='aceditor_')  {
                                  if ('default' in item)
                                        item.value = item.default;
                                  else  item.value = '';
                                } else if (!ignore)
                                  addMessage ( item,key,'no value given' );
                              } else
                                item.value = texte;
                          break;

            default : ;

          }

        }

      }

      for (let i=0;i<widget.child.length;i++)
        collectValues ( widget.child[i] );

    }

    collectValues ( widget );

    return msg;

  }


  TaskTemplate.prototype.disableInputWidgets = function ( inputPanel,disable_bool )  {
  // This function corrects action of global widget.setDisabledAll(), which
  // should be called prior using this function.

    /*
    // do recursive search for widgets to disable
    widget.setDisabled ( disable_bool );
    for (let i=0;i<widget.child.length;i++)
      this.disableInputWidgets ( widget.child[i],disable_bool );
    */

    window.setTimeout ( function(){
      if ('grid' in inputPanel)  {
        if ('inpDataRef' in inputPanel.grid)  {
          let input = inputPanel.grid.inpDataRef.input;
          for (let i=0;i<input.length;i++)
            for (let j=0;j<input[i].dropdown.length;j++)  {
              if (disable_bool)
                input[i].dropdown[j].inspect_btn.setEnabled ( true );
            }
        }
      }
    },0);

    if (inputPanel.hasOwnProperty('header') && (this.state!=job_code.running) &&
                                               (this.state!=job_code.exiting)) {
      if (inputPanel.header.hasOwnProperty('uname_inp'))
        window.setTimeout ( function(){
          inputPanel.header.uname_inp.setEnabled ( true );
        },0);
    }

  }

  // This function is called when Job Dialog is resized
  TaskTemplate.prototype.inputPanelResize = function ( inputPanel,panelWidth,panelHeight )  {}

  //  This function is called just before the task is finally sent to FE to run.
  // It should execute function given as argument, or issue an error message if
  // run should not be done.
  TaskTemplate.prototype.doRun = function ( inputPanel,run_func )  {

    if ((this.inputMode==input_mode.root) && (this.file_select.length>0))  {
      let files = [];

      for (let i=0;i<this.file_select.length;i++)
        files.push ( inputPanel[this.file_select[i].inputId].getFiles() );

      new UploadDialog ( 'Upload data',files,inputPanel.customData,true,
                          function(returnCode){
        if (!returnCode)
          run_func();
        else
          new MessageBox ( 'Stop run','Task cannot be run due to upload ' +
                                'errors:<p><b><i>' + returnCode + '</i></b>' );
      });

    } else
      run_func();

  }

  // This function is called just after the task was submitted to FE to run,
  // in response to the submission request.
  TaskTemplate.prototype.postSubmit = function() {}

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskTemplate.prototype.customDataClone = function ( cloneMode,task )  {
    if ((cloneMode=='copy_suggested') && ('suggestedParameters' in task))
      this._clone_suggested ( this.parameters,task.suggestedParameters );
    return;
  }

  // This function is called at creating nw classes that inherit parameters 
  // from upstream jobs ( tree._copy_task_parameters() )
  // TaskTemplate.prototype.copyParameters = function ( task )  {
  //   this.parameters = jQuery.extend ( true,{},task.parameters );
  //   return;
  // }


  TaskTemplate.prototype.score_string = function() {
  let S = '';
    if ('scores' in this)  {
      S = '';
      for (let key in this.scores)  {
        let d = this.scores[key];
        if (d.hasOwnProperty('summary_line'))
          S += d.summary_line + ' ';
        else
          switch (key)  {
            case 'aimless' : S += 'Compl='                 + d.Completeness + '%' +
                                  ' CC<sub>1/2</sub>='     + d.Half_set_CC  +
                                  ' R<sub>meas_all</sub>=' + d.R_meas_all   +
                                  ' R<sub>meas_ano</sub>=' + d.R_meas_ano   +
                                  ' SpG=' + d.Space_group  + ' ';
                        break;
            case 'phaser'   : if ('count' in d)
                                S += 'N<sub>sol</sub>=' + d.count;
                              S += ' LLG=' + d.llg + ' TFZ=' + d.tfz + ' ';
                        break;
            case 'cbuccaneer' : S += 'Compl=' + d.percentage + '% ';
                        break;
            case 'buster'   :
            case 'lorestr'  :
            case 'refmac'   : S += 'R=' + d.R_factor + ' R<sub>free</sub>=' +
                                          d.R_free   + ' ';
                              if ('molp_score' in d)
                                S += 'MolProbity=' + d.molp_score + ' ';
                        break;
            case 'z01'      : S += '<u>SpG=' + d.SpaceGroup  + '</u> ';
                        break;
            case 'z011'     : S += '<u>HKL reindexed</u> ';
                        break;
            case 'z02'      : if ('Ncopies' in d)  {
                                if ((S.length>0) && (!S.endsWith(': ')))
                                  S  = S.trim() + ', ';
                                if (d.Ncopies==1)
                                  S += '1 molecule in ASU, ';
                                else if (d.Ncopies>1)
                                  S += d.Ncopies + ' molecules in ASU, ';
                              }
                              S += 'Solv=' + d.SolventPercent + '% ';
                        break;
            case 'shelxemr' : if ((d.bestCC==0.0) && (d.pseudoCC>0.0))
                                    S += 'pseudo-CC=' + d.pseudoCC;
                              else  S += 'CC=' + d.bestCC;
                              S += '% FOM=' + d.meanFOM;
                        break;
            default : ;
          }
      }
//      if (S.trim()!='')
//        S = '-- <font style="font-size:80%">' + S + '</font>';
    }
    return S.trim();
  }

  TaskTemplate.prototype.result_indicator = function() {
    let resind = '';

    switch (this.state)  {

      case job_code.exiting   : resind = 'exiting';
                                break;

      case job_code.finished  : resind = this.score_string();
                                if (resind=='')  resind = 'completed.';
                                break;

      case job_code.hiddenresults :
      case job_code.noresults : resind = this.score_string();
                                if (resind=='')  resind = 'finished.';
                                break;

      case job_code.failed    : resind = this.score_string();
                                if (resind=='')  resind  = 'failed.';
                                           else  resind += ' (failed).';
                                break;

      case job_code.stopped   : resind = this.score_string();
                                if (resind=='')  resind = 'terminated.';
                                break;

      default: ;

    }

    return resind;

  }


} else  {
  //  for server side

  const os      = require('os');
  const fs      = require('fs-extra');
  const path    = require('path');

  const utils   = require('../../js-server/server.utils');
  const prj     = require('../../js-server/server.fe.projects');
  const conf    = require('../../js-server/server.configuration');
  const uh      = require('../../js-server/server.fe.upload_handler');
  const storage = require('../../js-server/server.fe.storage');
  const cmd     = require('../../js-common/common.commands');


  // this function only to be used on FE
  TaskTemplate.prototype.canRunInWorkflow = function ( uData )  {

    let fe_server            = conf.getFEConfig();
    let app_name             = cmd.appName();
    let exclude_tasks        = conf.getExcludedTasks();
    let local_service        = conf.getClientNCConfig();
    let any_mobile_device    = false;
    let cloud_storage        = (storage.getUserCloudMounts(uData).length>0);
    let treat_private        = fe_server.treat_private;
    let protected_connection = false;
    let maintainerEmail      = conf.getEmailerConfig().maintainerEmail;
    let client_version       = '100.100.100';
    let environ_client       = this.requiredEnvironment();
    let local_user           = fe_server.localuser;
    let user_authorisation   = uData.authorisation;
    let auth_software        = fe_server.auth_software;
    let user_guide_base_url  = './manuals/html-userguide/';
    let local_setup          = conf.isLocalSetup();
    
    return this._is_task_available ( app_name,
      exclude_tasks,local_service,any_mobile_device,cloud_storage,
      treat_private,protected_connection,maintainerEmail,client_version,
      environ_client,local_user,user_authorisation,auth_software,
      user_guide_base_url,local_setup,conf.environ_server );
  
  }


  // TaskTemplate.prototype.canRunInWorkflow = function ( uData )  {

  //   let fe_server            = conf.getFEConfig();
  //   let app_name             = cmd.appName();
  //   let exclude_tasks        = conf.getExcludedTasks();
  //   let local_service        = conf.getClientNCConfig();
  //   let any_mobile_device    = false;
  //   let cloud_storage        = (storage.getUserCloudMounts(uData).length>0);
  //   let treat_private        = fe_server.treat_private;
  //   // let protected_connection = isProtectedConnection();
  //   let protected_connection = false;
  //   let maintainerEmail      = conf.getEmailerConfig().maintainerEmail;
  //   let client_version       = '100.100.100';
  //   let environ_client       = this.requiredEnvironment();
  //   let local_user           = fe_server.localuser;
  //   let user_authorisation   = uData.authorisation;
  //   let auth_software        = fe_server.auth_software;
  //   let user_guide_base_url  = './manuals/html-userguide/';
  //   let local_setup          = conf.isLocalSetup();
  //   let environ_server       = this.requiredEnvironment();


  //   if ((this.nc_type!='client') && (exclude_tasks.indexOf(this._type)>=0))  {
  //     // task excluded in server configuration
  //     return ['server-excluded',
  //             'task is not available on ' + app_name + ' server',
  //             '<h3>Task is not available on server</h3>' +
  //             'The task is excluded from configuration on ' + app_name +
  //             ' server which you use.<br>This may be due to the ' +
  //             'unavailability of software or resources, which are ' +
  //             '<br>required for the task.'];
  //   }

  //   if ((exclude_tasks.indexOf('unix-only')>=0) &&
  //       (this.platforms().indexOf('W')<0))  {
  //     // task not supported on Windows
  //     return ['windows-excluded',
  //             'task is not available on MS Windows systems',
  //             '<h3>Task is not available on MS Windows systems</h3>' +
  //             'The task is based on program components that are not ' +
  //             'suitable for MS Windows,<br>and, therefore, cannot be run.'];

  //   }

  //   if ((this.nc_type=='client') && (!local_service))  {
  //     // client task while there is no client running
  //     if (any_mobile_device)  {
  //       return ['client',
  //               'task is not available on mobile devices',
  //               '<h3>CCP4 Cloud Client is required</h3>'+
  //               'This task cannot be used when working with ' + app_name +
  //               ' from mobile devices.<br>In order to use the task, ' +
  //               'access ' + app_name + ' via CCP4 Cloud Client,<br>' +
  //               'found in CCP4 Software Suite.'];
  //     } else  {
  //       return ['client',
  //               'task is available only if started via CCP4 Cloud Client',
  //               '<h3>CCP4 Cloud Client is required</h3>' +
  //               'This task can be used only if ' + app_name +
  //               ' was accessed via CCP4 Cloud Client,<br>found in ' +
  //               'CCP4 Software Suite.'];
  //     }
  //   }

  //   if ((this.nc_type=='client-storage') &&
  //       (!local_service) && (!cloud_storage))  {
  //     // task require either client or cloud storage but neither is given
  //     return ['client-storage',
  //             'task is available only if started via CCP4 Cloud Client ' +
  //             'or if Cloud Storage is configured',
  //             '<h3>CCP4 Cloud Client is required</h3>' +
  //             'This task can be used only if ' + app_name +
  //             ' was accessed via ' + app_name + ' Client,<br>found in ' +
  //             'CCP4 Software Suite, or if user has access to ' +
  //             'Cloud Storage.'];
  //   }

  //   if (treat_private.length>0)  {
  //     let sends_out = this.sendsOut();
  //     if (sends_out.length>0)  {
  //       if ((treat_private.indexOf('all')>=0) || (sends_out.indexOf('all')>=0))
  //         return ['private',
  //                 'task can transmit data to external servers, which ' +
  //                 'is not allowed by ' + app_name + ' configuration',
  //                 '<div style="width:350px;"><h3>Data confidentiality conflict</h3>' +
  //                 'This task can transmit data to external servers, which ' +
  //                 'is blocked in the configuration of ' + app_name + 
  //                 ' server you are currently using.</div>'];
  //       let breachlist = [];
  //       for (let i=0;i<sends_out.length;i++)
  //         if ((sends_out[i]!='none') && (sends_out[i]!='all') && 
  //             (treat_private.indexOf(sends_out[i])>=0))  {
  //           switch (sends_out[i])  {
  //             case 'seq' : breachlist.push ( 'sequence(s)' );         break;
  //             case 'xyz' : breachlist.push ( 'structure model(s)' );  break;
  //             case 'lig' : breachlist.push ( 'ligand structure(s)' ); break;
  //             case 'hkl' : breachlist.push ( 'reflections' );         break;
  //             default    : breachlist.push ( 'unspecified' );
  //           }
  //         }
  //       if (breachlist.length>0)  {
  //         let blist = breachlist.join ( ', ' );
  //         return ['private',
  //                 'task can transmit ' + blist + ' to external servers, which ' +
  //                 'is not allowed by ' + app_name + ' configuration',
  //                 '<div style="width:350px;"><h3>Data confidentiality conflict</h3>' +
  //                 'This task can transmit ' + blist + ' to external servers, which ' +
  //                 'is blocked in the configuration of ' + app_name + 
  //                 ' server you are currently using.</div>'];
  //       }
  //     }
  //   }

  //   if ((this.nc_type=='browser-secure') && (!protected_connection))  {
  //     return ['browser-secure',
  //             'task requires secure internet connection',
  //             '<h3>Task requires secure internet connection</h3>' +
  //             'This task requires secure internet connection (https or<br>' +
  //             'localhost-based setup).<p>Contact your ' + app_name +
  //             ' maintainer at<br>' +
  //                 '<a href="mailto:' + maintainerEmail +
  //                   '?Subject=' + encodeURI(cmd.appName()) + '%20Secure%20connection">' + 
  //                   maintainerEmail +
  //                 '</a>.'];
  //   }

  //   if (startsWith(this.nc_type,'client'))  {

  //     if (local_service &&
  //         (compareVersions(client_version,this.lowestClientVersion())<0))  {
  //       // task requires client of higher version
  //       return ['client-version',
  //               'task requires a higher version of CCP4 Cloud Client ' +
  //               '(update CCP4 on your device)',
  //               '<h3>Too low version of CCP4 Cloud Client</h3>' +
  //               'This task requires a higher version of CCP4 Cloud ' +
  //               'Client.<br>Please update CCP4 Software Suite on ' +
  //               'your device.'];
  //     }

  //     if (((this.nc_type=='client') || (!cloud_storage)) &&
  //         (!this.checkEnvironment(environ_client)))
  //       return ['environment-client',
  //               'task software is not installed on your device',
  //               '<h3>Task software is not installed on your device</h3>' +
  //               'The task is to run on your device, but needful software is ' +
  //               'not installed on it.<br>Consult software documentation ' +
  //               'for further details.'];

  //   } else  {

  //     let authID = this.authorisationID();
  //     if (authID && //__auth_software && (authID in __auth_software) &&
  //         (!local_user) && ((!(authID in user_authorisation)) ||
  //                             (!user_authorisation[authID].auth_date)))  {
  //       if (auth_software && (authID in auth_software))  {
  //         return ['authorisation',
  //                 'task requi=res authorisation from ' +
  //                 auth_software[this.authorisationID()].desc_provider +
  //                 ' (available in "My Account")',
  //                 '<h3>Authorisation is required</h3>' +
  //                 'This task requires authorisation from ' +
  //                 auth_software[this.authorisationID()].desc_provider +
  //                 ',<br>which may be obtained in "My Account" page.</br><br>' +
  //                 '<a href="javascript:launchHelpBox1(\'Authorisation instructions\',' +
  //                 '\'' + user_guide_base_url + auth_software[this.authorisationID()].help_page +
  //                 '.html\',null,10)"><span style="color:blue">Authorisation instructions</span></a></br>'];
  //       } else  {
  //         return ['authorisation',
  //                 'task requires authorisation, which is not configured',
  //                 '<h3>Authorisation is required</h3>' +
  //                 'This task requires authorisation, which is not available ' +
  //                 ',<br>due to server misconfiguration.'];
  //       }
  //     }

  //   }

  //   if ((this.nc_type!='client') && (!this.checkEnvironment(environ_server)))  {
  //     if (local_setup)
  //       return ['environment-server',
  //               'task software is not installed',
  //               '<h3>Task software is not installed</h3>' +
  //               'Software, needed to run the task, is not installed on ' +
  //               'your machine.'];
  //     else
  //       return ['environment-server',
  //               'task software is not installed on ' + app_name + ' server',
  //               '<h3>Task software is not installed on server</h3>' +
  //               'Software, needed for the task, is not installed on ' +
  //               app_name + ' server.<br>Contact server ' +
  //               'maintainer for further details.'];
  //   }

  //   return ['ok','',''];

  // }


  TaskTemplate.prototype.setOName = function ( base_name )  {
    this.oname = base_name;
  }

  TaskTemplate.prototype.getNCores = function ( ncores_available )  {
  // This function should return the number of cores, up to ncores_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns multiple threads or processing bypassing the
  // queuing system, or is known to use multiple cores for other reasons.
  // It is expected that the task will not utilise more cores than what is
  // given on input to this function; not doing so may cause cluttering 
  // of the CPU cluster with processes that queuing system is not aware of
  // and, as a result, unbalanced and inefficient use of compute nodes.

    // if (conf.getServerConfig().localSetup)
    //   return os.cpus().length;
    
    return 1;

  }

  TaskTemplate.prototype.getNProcesses = function ( nproc_available )  {
  // This function should return the number of processes, up to nproc_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns multiple parallel threds or processes
  // through the queueing system.
  // The task may spawn more processes than this function returns, however,
  // they will not be reserved by the queuing system and, therefore, their
  // execution may be postponed. It is therefore recommended that, if task
  // submits additional processes in the queue with master process acting as a
  // watcher/dispatcher, this function returns at least 2 processes to be 
  // reserved by the queue. Most tasks should not reimplement this function.

    // if (conf.getServerConfig().localSetup)
    //   return os.cpus().length;
 
    return 1;
  
  }

  TaskTemplate.prototype.getCommandLine = function ( jobManager,jobDir )  {
    // just the template, no real execution body is assumed
    return [conf.pythonName(), '-m', 'pycofe.tasks.template', jobManager, jobDir];
  }


  TaskTemplate.prototype.addInputFile = function ( jobId,fileName,jobDir )  {
  // Adds (custom) file 'fileName' from 'outputDir()' of job with id 'jobId',
  // into 'inputDir()' directory of job directory 'jobDir'
    let srcJobDir = prj.getSiblingJobDirPath ( jobDir,jobId );
    let src_file  = prj.getOutputFilePath ( srcJobDir,fileName );
    let dest_file = prj.getInputFilePath  ( jobDir   ,fileName );
    try {
      fs.copySync ( src_file,dest_file );
    } catch (err) {
      console.log ( ' *** cannot copy file ' + src_file + ' to ' + dest_file );
      console.log ( '     error: ' + err) ;
    }
  }


  TaskTemplate.prototype.__prepare_file = function ( fpath,cloudMounts,uploads_dir )  {
    if (fpath.length>0)  {
      let lst = fpath.split('/');
      if (lst.length>2)  {
        if (lst[0]=='cloudstorage::')  {
          let cfpath = null;
          for (let j=0;(j<cloudMounts.length) && (!cfpath);j++)
            if (cloudMounts[j][0]==lst[1])
              cfpath = path.join ( cloudMounts[j][1],lst.slice(2).join('/') );
          if (cfpath)  {
            let dest_file = path.join ( uploads_dir,lst[lst.length-1] );
            try {
              fs.copySync ( cfpath,dest_file );
            } catch (err) {
              console.log ( ' ***** cannot copy file ' + cfpath +
                            '\n                   to ' + dest_file );
              console.log ( '       error: ' + err) ;
            }
          } else {
            console.log ( ' ***** path ' + fpath + ' not found' );
          }
        }
      }
    }
  }


  TaskTemplate.prototype.__make_input_data_root = function ( loginData,jobDir )  {

    if (this.file_system=='cloud')  {

      let uploads_dir = path.join ( jobDir,uh.uploadDir() );

      if (!utils.writeObject(path.join(jobDir,'annotation.json'),this.file_mod))
        console.log ( ' ***** cannot write "annotation.json" in ' + uploads_dir );

      if (!utils.fileExists(uploads_dir))  {
        if (!utils.mkDir( uploads_dir))
          console.log ( ' ***** cannot create directory ' + uploads_dir );
      }

      let cloudMounts = storage.getUserCloudMounts ( loginData );

      for (let i=0;i<this.file_select.length;i++)
          this.__prepare_file ( this.file_select[i].path,cloudMounts,uploads_dir );

      for (let i=0;i<this.file_mod.annotation.length;i++)  {
        utils.removeFile ( path.join(uploads_dir,this.file_mod.annotation[i].file) );
        //redundant_files.push ( file_mod.annotation[i].file );
        for (let j=0;j<this.file_mod.annotation[i].items.length;j++)  {
          let fname = this.file_mod.annotation[i].items[j].rename;
          utils.writeString ( path.join(uploads_dir,fname),
                              this.file_mod.annotation[i].items[j].contents );
          //fdata.files.push ( fname );
        }
      }

    }

  }


  TaskTemplate.prototype.__make_input_data_standard = function ( loginData,jobDir )  {
  // Collects all input files, listed in this.input_data, from other job
  // directories and places them in jobDir/input. Simultaneously, creates
  // the correspondong dataBox structure with input metadata, and writes
  // it in jobDir/input/databox.meta. This is done on FE just before
  // sending the jobboll to NC. On NC, the dataBox is read in python
  // wrappers, an the metadata from it is used to specify input data (files)
  // for the actual job.
    for (let dtype in this.input_data.data)  {
      let td = this.input_data.data[dtype];
      for (let i=0;i<td.length;i++)
        if (td[i])  {
          let srcJobDir = prj.getSiblingJobDirPath ( jobDir,td[i].jobId );
          for (let fileKey in td[i].files) {
            if (td[i].files.hasOwnProperty(fileKey)) {
              let fname = td[i].files[fileKey];
              if (fname)  {
                let pack = true;
                let doNotPackSuffixes = this.doNotPackSuffixes();
                for (let k=0;(k<doNotPackSuffixes.length) && pack;k++)
                  pack = (!fname.endsWith(doNotPackSuffixes[k]));
                let doPackSuffixes = this.doPackSuffixes();
                for (let k=0;(k<doPackSuffixes.length) && (!pack);k++)
                  pack = fname.endsWith(doPackSuffixes[k]);
                if (pack)  {
                  let src_file  = prj.getOutputFilePath ( srcJobDir,fname );
                  let dest_file = prj.getInputFilePath  ( jobDir   ,fname );
                  try {
                    fs.copySync ( src_file,dest_file );
                  } catch (err) {
                    console.log ( ' *** cannot copy file ' + src_file +
                                '\n                   to ' + dest_file +
                                '\n           for object ' + td[i]._type + ' : ' + td[i].dname );
                    console.log ( '     error: ' + err) ;
                  }
                }
              }
            }
          }
        } else {
          console.log ( ' *** empty data object in ' + this._type + '.makeInputData,dtype=' + dtype );
        }
    }
    // let dboxPath = path.join ( jobDir,'input','databox.meta' );
    // utils.writeObject ( dboxPath,this.input_data );
  }

  TaskTemplate.prototype.makeInputData = function ( loginData,jobDir )  {
    if (this.inputMode==input_mode.root)
          this.__make_input_data_root     ( loginData,jobDir );
    else  this.__make_input_data_standard ( loginData,jobDir );
    let dboxPath = path.join ( jobDir,'input','databox.meta' );
    utils.writeObject ( dboxPath,this.input_data );
  }

  TaskTemplate.prototype.makeOutputData = function ( jobDir )  {
  // This function is run after job completion with the purpose of
  // analysing job's output files and registering them with the system.
  // This function may be overwritten in individual tasks, although
  // doing so should be viewed as an exception practice.
  //
  // By default, assume that job process has created the 'datalist.meta'
  // file in 'output' directory, then simply read it. This file may be
  // easily created in python layer, using python definitions of data
  // classes in python/dtypes and then adding them to datalist class
  // implemented in python/dtypes/datalist.py

    let dboxPath = path.join ( jobDir,'output','databox.meta' );
    let dbox     = utils.readClass ( dboxPath );
    if (dbox)  this.output_data = dbox;
         else  this.output_data = new dbx.DataBox();

  }


  // default post-job cleanup to save disk space
  TaskTemplate.prototype.cleanJobDir = function ( jobDir )  {
    // leave input metadata just in case
    // let inputDir = path.join ( jobDir  ,'input'        );
    // let dboxPath = path.join ( inputDir,'databox.meta' );
    // let dbox     = utils.readString ( dboxPath );
    // utils.removePath   ( inputDir );
    // utils.mkDir_anchor ( inputDir );
    // utils.writeString  ( dboxPath,dbox );
    utils.cleanDir    ( path.join(jobDir,'input'),['databox.meta','__anchor__'] );
    utils.removeFiles ( jobDir,['.mtz','.map','.pdb','.seq','.fasta','.pir',
                                '.seq.txt','.fasta.txt','.pir.txt',
                                '.cif','.mmcif','.ent','.pdbx',
                                'rvapi_document'] );
    // specify separate temporary directory to avoid interference between 
    // asynchronous deletion and sending back to FE
    let dir_tmp = path.join ( jobDir,'..' );
    utils.removePathAsync ( path.join(jobDir,'search_a')     ,dir_tmp );  // old MrBump's sins
    utils.removePathAsync ( path.join(jobDir,'coot-backup')  ,dir_tmp );  // old Coot's sins
    utils.removePathAsync ( path.join(jobDir,'coot-download'),dir_tmp );  // old Coot's sins
  }

  // -------------------------------------------------------------------------

  module.exports.job_code          = job_code;
  module.exports.input_mode        = input_mode;
  module.exports.jobDataFName      = jobDataFName;
  module.exports.jobReportDirName  = jobReportDirName;
  module.exports.jobInputDirName   = jobInputDirName;
  module.exports.jobOutputDirName  = jobOutputDirName;
  module.exports.jobReportHTMLName = jobReportHTMLName;
  module.exports.jobReportTaskName = jobReportTaskName;
  module.exports.keyEnvironment    = keyEnvironment;
  module.exports.TaskTemplate      = TaskTemplate;

}
