
/*
 *  =================================================================
 *
 *    05.12.17   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.fitwaters.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Find Ligand Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2017
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskFitWaters()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskFitWaters';
  this.name    = 'fit waters';
  this.oname   = 'fit_waters';  // default output file name template
  this.title   = 'Find and Fit Waters with Coot';
  this.helpURL = './html/jscofe_task_fitwaters.html';

  this.input_dtypes = [{  // input data types
      data_type : {'DataRevision':['phases']}, // data type(s) and subtype(s)
      label     : 'Structure revision',     // label for input dialog
      inputId   : 'revision', // input Id for referencing input fields
      version   : 0,          // minimum data version allowed
      min       : 1,          // minimum acceptable number of data instances
      max       : 1           // maximum acceptable number of data instances
    }
  ];

/*
  Usage: /Applications/ccp4-7.0/libexec/findwaters-bin
   --pdbin pdb-in-filename
   --hklin mtz-filename
   --f f_col_label --phi phi_col_label
   --pdbout waters-filename
   --sigma sigma-level
   --min-dist min-dist-to-protein
   --max-dist min-dist-to-protein
   --flood
   --flood-atom-radius
   --chop
   --mapin ccp4-map-name can be used instead of --hklin --f --phi

   where pdbin is the protein (typically)
   and pdbout is file for the waters.
   The default sigma level is 2.0
   Use --chop to remove waters below given sigma-level
              In this case, pdbout is the modified input coordinates
   Use --flood to fill everything with waters (not just water peaks)
   and --flood-atom-radius to adjust contact distance
             (default 1.4A).
*/

  this.parameters = { // input parameters
    sec1  : { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                SIGMA : {
                        type      : 'real',
                        keyword   : '--sigma',
                        label     : 'Map level, &sigma;',
                        tooltip   : 'Specify map level for water search',
                        range     : [0.0,10.0],
                        value     : '2.0',
                        default   : '2.0',
                        position  : [0,0,1,1]
                      },
                FLOOD_CBX : {
                        type      : 'checkbox',
                        keyword   : '--flood',
                        label     : 'Flood',
                        tooltip   : 'Check in order to fill everything (not ' +
                                    'just the density peaks) with water',
                        iwidth    : 140,
                        value     : false,
                        position  : [1,0,1,1]
                      },
                FLOOD_RADIUS : {
                        type      : 'real',
                        keyword   : '--flood-atom-radius',
                        label     : 'Water molecule radius [&Aring;]',
                        tooltip   : 'Needs adjustment only if solvent is ' +
                                    'something else but water.',
                        range     : [0.1,'*'],
                        value     : '1.4',
                        default   : '1.4',
                        position  : [1,2,1,1],
                        showon    : {FLOOD_CBX:[true]}
                      },
                MIN_DIST : {
                        type      : 'real',
                        keyword   : '--min-dist',
                        label     : 'Minimum distance to macromolecule [&Aring;]',
                        tooltip   : 'The minimum distance to macromolecular ' +
                                    'surface water molecules should be found at.',
                        range     : [0.0,'*'],
                        value     : '0.0',
                        default   : '0.0',
                        position  : [2,0,1,1],
                        showon    : {FLOOD_CBX:[false]}
                      },
                MAX_DIST : {
                        type      : 'real',
                        keyword   : '--max-dist',
                        label     : 'Maximum distance to macromolecule [&Aring;]',
                        tooltip   : 'The maximum distance to macromolecular ' +
                                    'surface water molecules should be found at.',
                        range     : [0.0,'*'],
                        value     : '50.0',
                        default   : '50.0',
                        position  : [3,0,1,1],
                        showon    : {FLOOD_CBX:[false]}
                      }
              }
            }
  };

}


if (__template)
      TaskFitWaters.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskFitWaters.prototype = Object.create ( TaskTemplate.prototype );
TaskFitWaters.prototype.constructor = TaskFitWaters;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskFitWaters.prototype.icon_small = function()  { return './images/task_fitwaters_20x20.svg'; }
TaskFitWaters.prototype.icon_large = function()  { return './images/task_fitwaters.svg';       }

TaskFitWaters.prototype.currentVersion = function()  { return 1; }

if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskFitWaters.prototype.makeInputData = function ( jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      //this.input_data.data['hkl']     = [revision.HKL];
      this.input_data.data['istruct'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,jobDir );

  }

  TaskFitWaters.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.fitwaters', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskFitWaters = TaskFitWaters;

}
