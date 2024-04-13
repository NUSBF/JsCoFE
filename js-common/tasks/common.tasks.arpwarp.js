
/*
 *  =================================================================
 *
 *    13.04.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.arpwarp.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ArpWarp Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskArpWarp()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskArpWarp';
  this.name    = 'arpwarp';
  this.setOName ( 'arpwarp' );  // default output file name template
  this.title   = 'Automatic Model Building with Arp/wArp';
  if ((!__template) && (__licensed_tasks.indexOf(this._type)<0))
    this.nc_type = 'client';  // job may be run only on client NC with licensed Afrp/wArp

  this.input_dtypes = [{      // input data types
      data_type   : {'DataRevision':['!protein','!phases','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',        // label for input dialog
      inputId     : 'revision',      // input Id for referencing input fields
      version     : 7,          // minimum data version allowed
      customInput : 'arpwarp',  // lay custom fields below the dropdown
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1 : { type     : 'section',
             title    : 'Arp/wArp Flow Parameters',
             open     : false,  // true for the section to be initially open
             position : [0,0,1,5],
             contains : {
                AWA_BIG_CYCLES : {
                        type      : 'integer',
                        keyword   : 'AWA_BIG_CYCLES',
                        label     : 'Number of macrocylces to do:',
                        tooltip   : 'Number of macrocycles',
                        range     : [1,1000],
                        value     : '10',
                        iwidth    : 60,
                        position  : [0,0,1,1]
                      },
                AWA_SMALL_CYCLES : {
                        type      : 'integer',
                        keyword   : 'AWA_SMALL_CYCLES',
                        label     : 'each including',
                        align     : 'right',
                        tooltip   : 'Number of ARP-REFMAC cycles in each big cycle',
                        range     : [1,1000],
                        value     : '5',
                        iwidth    : 40,
                        label2    : 'ARP-REFMAC cycles',
                        position  : [0,4,1,1]
                      },
                AWA_USE_COND_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_USE_COND',
                        label     : 'Use Conditional Restraints for free atoms',
                        tooltip   : 'Check to use conditional restraints for free atoms',
                        value     : true,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [1,0,1,7]
                      },
                AWA_FORCECOND_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_FORCE_COND',
                        label     : 'Force Conditional Restraints for very large structures',
                        tooltip   : 'Force using conditional restraints for very large ' +
                                    'structures (time consuming)',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [2,0,1,7]
                      },
                AWA_FAKE_DATA_CBX : {
                        type     : 'checkbox',
                        keyword  : 'AWA_FAKE_DATA',
                        label    : 'Use Fake Data',
                        tooltip  : 'Check to use fake data',
                        value    : false,
                        position : [3,0,1,7]
                      },
                AWA_NCS_RESTRAINTS_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_NCS_RESTRAINTS',
                        label     : 'Use Non-Crystallographic Symmetry Restraints',
                        tooltip   : 'Check to use NCS restraints',
                        value     : true,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [4,0,1,7]
                      },
                AWA_NCS_EXTENSION_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_NCS_EXTENSION',
                        label     : 'Use Non-Crystallographic Symmetry for extending chains',
                        tooltip   : 'Check to use NCS for extending chains',
                        value     : true,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [5,0,1,7]
                      },
                AWA_LOOPS_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_LOOPS',
                        label     : 'Use Loopy to build loops between chain fragments',
                        tooltip   : 'Check to use Loopy for building loops between ' +
                                    'structure fragments',
                        value     : true,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [6,0,1,7]
                      },
                AWA_BUILD_SIDE_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_BUILD_SIDE',
                        label     : 'Start docking chains to sequence',
                        tooltip   : 'Check to start docking the autotraced chains ' +
                                    'to sequence after given number of building cycles',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [7,0,1,3]
                      },
                AWA_SIDE_AFTER : {
                        type     : 'integer',
                        keyword  : 'AWA_SIDE_AFTER',
                        label    : 'after',
                        align    : 'right',
                        reportas : 'Number of cycles to skip before docking chains',
                        align    : 'right',
                        tooltip  : 'Number of first cycles to skip for chain tracing',
                        range    : [0,1000],
                        value    : '0',
                        iwidth   : 40,
                        label2   : 'building cycles',
                        position : [7,2,1,1],
                        showon   : {AWA_BUILD_SIDE_CBX:[true]}
                      },
                AWA_ALBE_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_ALBE',
                        label     : 'Search for helices and strands before each building cycle',
                        tooltip   : 'Check to search for helices and strands ' +
                                    'before each building cycle',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [8,0,1,7]
                      },
                      /*
                AWA_SKIP_BUILD_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_SKIP_BUILD',
                        label     : 'Skip chain tracing',
                        tooltip   : 'Check to skip chain tracing for the specified ' +
                                    'number of first building cycles',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [8,0,1,3]
                      },
                      */
                AWA_SKIP_CYCLES : {
                        type     : 'integer',
                        keyword  : 'AWA_SKIP_CYCLES',
                        label    : 'Skip chain tracing in first',
                        //reportas : 'Number of first cycles to skip',
                        //align    : 'right',
                        tooltip  : 'Number of first cycles to skip for chain tracing',
                        range    : [0,1000],
                        value    : '0',
                        iwidth   : 60,
                        label2   : 'building cycles',
                        position : [9,0,1,1]
                        //showon   : {AWA_SKIP_BUILD_CBX:[true]}
                      },
                AWA_FREEBUILD_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_FREEBUILD',
                        label     : 'Construct new free atoms model before autobuilding',
                        tooltip   : 'Check to construct new free atoms model ' +
                                    'before autobuilding',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [10,0,1,7]
                      },
                AWA_FLATTEN_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_FLATTEN',
                        label     : 'Perform density modification before autobuilding',
                        tooltip   : 'Check to perform density modification ' +
                                    'before autobuilding',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [11,0,1,7]
                      },
                AWA_FREELOOPS_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_FREELOOPS',
                        label     : 'Perform sequence-less loop building',
                        tooltip   : 'Check to perform sequence-less loop building',
                        value     : false,
                        // translate : ['0','1'],  // for "false", "true"
                        position  : [12,0,1,7]
                      },
                AWA_HOMOLOGY_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_HOMOLOGY',
                        label     : 'Perform homology based loop building',
                        tooltip   : 'Check to perform homology-based loop building',
                        value     : false,
                        // translate : ['0','1'],  // for "false", "true"
                        position  : [13,0,1,7]
                      },
                AWA_MULTITRACE : {
                        type     : 'integer',
                        keyword  : 'AWA_MULTITRACE',
                        label    : 'Iterate autotracing up to',
                        tooltip  : 'Number of maximum iterations of autotracing',
                        range    : [1,1000],
                        value    : '5',
                        iwidth   : 60,
                        label2   : 'times',
                        position : [14,0,1,1]
                      },
                AWA_ADDATOM_SIGMA : {
                        type     : 'real',
                        keyword  : 'AWA_ADDATOM_SIGMA',
                        label    : 'Add atoms in density above',
                        tooltip  : 'Minimal electron density sigma for adding atoms',
                        range    : [0.0,10.0],
                        value    : '3.2',
                        iwidth   : 60,
                        label2   : 'sigma',
                        position : [15,0,1,1]
                      },
                AWA_REMATOM_SIGMA : {
                        type     : 'real',
                        keyword  : 'AWA_REMATOM_SIGMA',
                        label    : 'Remove atoms in density below',
                        tooltip  : 'Maximal electron density sigma for removing atoms',
                        range    : [0.0,10.0],
                        value    : '1.0',
                        iwidth   : 60,
                        label2   : 'sigma',
                        position : [16,0,1,1]
                      },
                AWA_UP_UPDATE : {
                        type     : 'integer',
                        keyword  : 'AWA_UP_UPDATE',
                        label    : 'Add and remove ',
                        tooltip  : '',
                        range    : [1,10],
                        value    : '1',
                        iwidth   : 60,
                        position : [17,0,1,1]
                      },
                AWA_UP_UPDATE_LBL : {
                        type     : 'label',
                        label    : 'times atoms than calculated automatically',
                        position : [17,4,1,7]
                      }
             }
           },
    sec2 : { type     : 'section',
             title    : 'Refinement Parameters',
             open     : false,  // true for the section to be initially open
             position : [1,0,1,5],
             contains : {
               /*
                AWA_TWIN_CBX : {
                        type     : 'checkbox',
                        keyword  : 'AWA_TWIN',
                        label    : 'Detwin data collected from a twinned crystal',
                        tooltip  : 'Check to detwin data collected from a twinned crystal',
                        value    : true,
                        position : [0,0,1,3]
                      },
                */
                AWA_NCYCLES : {
                        type     : 'integer',
                        keyword  : 'AWA_NCYCLES',
                        label    : 'Number of refinement cycles',
                        tooltip  : 'Number of refinement cycles per every ARP-REFMAC cycle',
                        range    : [1,10],
                        value    : '1',
                        position : [1,0,1,1]
                      },
                AWA_NCYCLES_LBL : {
                        type     : 'label',
                        label    : '(per every ARP-REFMAC cycle)',
                        position : [1,3,1,4]
                      },
                AWA_WEIGHT_MATRIX_SEL : {
                        type     : 'combobox',
                        keyword  : 'AWA_WEIGHT_MATRIX',
                        label    : 'Matrix weighting for X-ray/Geometry',
                        tooltip  : 'Matrix weighting mode for X-ray/Geometry',
                        range    : ['AUTO|Automatic',
                                    'MANUAL|Manual'
                                   ],
                        value    : 'A',
                        iwidth   : 130,
                        position : [2,0,1,1]
                      },
                AWA_WMAT : {
                        type     : 'real',
                        keyword  : 'AWA_WMAT',
                        label    : 'with matrix weight',
                        reportas : 'Matrix weight',
                        tooltip  : 'matrix weight for X-ray/Geometry',
                        range    : [0.0,10.0],
                        value    : '0.5',
                        position : [2,3,1,1],
                        showon   : {AWA_WEIGHT_MATRIX_SEL:['MANUAL']}
                      },
                AWA_RIDGE_RESTRAINTS_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_RIDGE_RESTRAINTS',
                        label     : 'Use Jelly-Body restraints',
                        tooltip   : 'Check to use jelly-body restraints in refinement',
                        value     : false,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [3,0,1,1]
                      },
                AWA_SCA_SEL : {
                        type     : 'combobox',
                        keyword  : 'AWA_SCA',
                        label    : 'Scaling model',
                        tooltip  : 'Scaling model to use',
                        range    : ['SIMPLE|Simple',
                                    'BULK|Bulk'
                                   ],
                        value    : 'SIMPLE',
                        iwidth   : 130,
                        position : [4,0,1,1]
                      },
                AWA_SCANIS_SEL : {
                        type     : 'combobox',
                        keyword  : 'AWA_SCANIS',
                        label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;with',
                        align    : 'right',
                        reportas : 'Scaling B-factor model',
                        tooltip  : 'Scaling B-factor model to use',
                        range    : ['ANIS|anisotropic',
                                    'ISO|isotropic'
                                   ],
                        value    : 'ANIS',
                        iwidth   : 140,
                        label2   : 'scaling B-factor',
                        position : [4,3,1,1]
                      },
                AWA_REFMAC_REF_SEL : {
                        type     : 'combobox',
                        keyword  : 'AWA_REFMAC_REF',
                        label    : 'Do scaling and &sigma;<sub>A</sub> calculations with',
                        tooltip  : 'Reflection set to use for scaling and ' +
                                   '&sigma;<sub>A</sub> calculations',
                        range    : ['W|Working',
                                    'F|Free'
                                   ],
                        value    : 'W',
                        iwidth   : 130,
                        position : [5,0,1,1]
                      },
                AWA_REFMAC_REF_LBL : {
                        type     : 'label',
                        label    : 'set of reflections',
                        position : [5,3,1,4]
                      },
                AWA_SOLVENT_CBX : {
                        type      : 'checkbox',
                        keyword   : 'AWA_SOLVENT',
                        label     : 'Use Solvent Mask correction',
                        tooltip   : 'Check to use the Solvent Mask correction',
                        value     : true,
                        translate : ['0','1'],  // for "false", "true"
                        position  : [6,0,1,1]
                      }
             }
           }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskArpWarp.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskArpWarp.prototype = Object.create ( TaskTemplate.prototype );
TaskArpWarp.prototype.constructor = TaskArpWarp;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskArpWarp.prototype.icon           = function()  { return 'task_arpwarp'; }
TaskArpWarp.prototype.clipboard_name = function()  { return '"Arp/wArp"';   }

TaskArpWarp.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskArpWarp.prototype.platforms           = function() { return 'LMU'; }  // UNIX only
TaskArpWarp.prototype.requiredEnvironment = function() { return ['CCP4','warpbin']; }

TaskArpWarp.prototype.authorisationID = function() {
  if (this.nc_type=='client')  return 'arpwarp';  // check Arp/wArp authorisation
  return '';
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function ArpWarpHotButton()  {
  return {
    'task_name' : 'TaskArpWarp',
    'tooltip'   : 'Automatic model building with Arp/wArp'
  };
}

TaskArpWarp.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['arpwarp','model', 'building', 'auto-mb'] );
}

if (!__template)  {
  //  for client side

  TaskArpWarp.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'automatic model building of polypeptides using original Arp/wArp algorithm';
  };

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskArpWarp.prototype.hotButtons = function() {
    return [CootMBHotButton()];
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskArpWarp.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Options.leading_structure=='substructure')
            this.input_data.data['istruct'] = [revision.Substructure];
      else  this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskArpWarp.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.arpwarp', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskArpWarp = TaskArpWarp;

}
