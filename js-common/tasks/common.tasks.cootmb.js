
/*
 *  =================================================================
 *
 *    10.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.cootmb.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Coot Model Building Task Class (for local server)
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskCootMB()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCootMB';
  this.name    = 'coot (model building)';
  this.setOName ( 'coot-mb' );  // default output file name template
  this.title   = 'Model Building with Coot';
  this.nc_type = 'client';      // job may be run only on client NC

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
    }
  ];

}


if (__template)
      TaskCootMB.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCootMB.prototype = Object.create ( TaskTemplate.prototype );
TaskCootMB.prototype.constructor = TaskCootMB;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCootMB.prototype.icon           = function()  { return 'task_cootmb';           }
TaskCootMB.prototype.clipboard_name = function()  { return '"Coot Model Building"'; }

TaskCootMB.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'fit atoms and new ligands in electron density, validate and explore';
}

TaskCootMB.prototype.taskDescription = function()  {
// this appears under task title in the Task Dialog
  return 'Fit atoms and new ligands in electron density, validate and explore';
}

TaskCootMB.prototype.lowestClientVersion = function() { return '1.6.001 [01.01.2019]'; }

//TaskCootMB.prototype.cleanJobDir = function ( jobDir )  {}

TaskCootMB.prototype.currentVersion = function()  {
let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

function CootMBHotButton()  {
  return {
    'task_name' : 'TaskCootMB',
    'tooltip'   : 'Launch Coot for model building'
  };
}

TaskCootMB.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['coot','model', 'building', 'manual-mb', 'mb', 
                                           'coordinate', 'editor'] );
}

if (!__template)  {
  //  for client side

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskCootMB.prototype.hotButtons = function() {
    return [RefmacHotButton()];
  }

} else  {
  //  for server side

  var path  = require('path');

  var conf  = require('../../js-server/server.configuration');
  var prj   = require('../../js-server/server.fe.projects');
  var utils = require('../../js-server/server.utils');

  TaskCootMB.prototype.makeInputData = function ( loginData,jobDir )  {

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
      /*
      for (var fname of coot_meta.files)
        utils.copyFile ( path.join(srcJobDir,fname),
                         path.join(jobDir,fname) );
      */
      for (let i=0;i<coot_meta.files.length;i++)
        utils.copyFile ( path.join(srcJobDir,coot_meta.files[i]),
                         path.join(jobDir,coot_meta.files[i]) );
      //  This is commented out because Coot creates platform-incompatible file
      //  names in backup directory
      //if (coot_meta.backup_dir)
      //  utils.copyFile ( path.join(srcJobDir,coot_meta.backup_dir),
      //                   path.join(jobDir,coot_meta.backup_dir) );
    }

  }

  TaskCootMB.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.coot_mb', jobManager, jobDir,
            this.id, 'expire='+conf.getClientNCConfig().zombieLifeTime ];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCootMB = TaskCootMB;

}
