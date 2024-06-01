
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.shelxemr.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ShelxE-MR Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict'; // *client*

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskShelxEMR()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskShelxEMR';
  this.name    = 'shelxe';
  this.setOName ( 'shelxe' );  // default output file name template
  this.title   = 'Density Modification and C&alpha;-tracing with ShelxE';

  this.input_dtypes = [{  // input data types
      //data_type   : {'DataRevision':['!protein','!asu',['xyz','substructure']]}, // data type(s) and subtype(s)
      data_type   : {'DataRevision':['!phases','!xyz','~mmcif_only']}, // data type(s) and subtype(s)
      label       : 'Structure revision',         // label for input dialog
      inputId     : 'revision', // input Id for referencing input fields
      customInput : 'shelxe',   // lay custom fields below the dropdown
      version     : 7,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    SEP0_LABEL : {
          type     : 'label',  // just a separator
          label    : '&nbsp;',
          position : [0,0,1,5]
          },
    sec1: { type     : 'section',
            title    : 'Main options',
            open     : true,  // true for the section to be initially open
            position : [1,0,1,5],
            contains : {
              DM_CYCLES      : {
                    type     : 'integer',  // '_' means blank value is allowed
                    keyword  : '-m',       //  parameter keyword
                    label    : 'Number of density modification cycles',
                    align    : 'left',
                    iwidth   : 50,
                    default  : '25',      // to be displayed in grey
                    tooltip  : 'The total number of density modification cycles',
                    range    : [1,'*'],   // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '25',      // value to be paired with the keyword
                    position : [0,0,1,1]  // [row,col,rowSpan,colSpan]
                  },
              SOLVENT_CONTENT: {
                    type     : 'real_', // blank value is allowed
                    keyword  : '-s',    // the real keyword for job input stream
                    label    : 'Effective solvent content',
                    tooltip  : 'Solvent content to be used in calculations (must ' +
                               'be between 0.01 and 0.99). If left blank, ' +
                               'solvent fraction from asymmetric unit definition ' +
                               'will be used.',
                    iwidth   : 80,
                    range    : [0.01,0.99], // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value    : '',          // value to be paired with the keyword
                    default  : 'auto',
                    position : [1,0,1,1],   // [row,col,rowSpan,colSpan]
                    hideon   : {sec1:['shelx-substr']} // from this and input data section
                  },
              AUTOTRACE_CBX  : {
                    type     : 'checkbox',
                    keyword  : 'autotrace',       //  parameter keyword
                    label    : 'Perform mainchain tracing',
                    tooltip  : 'Check to perform the mainchain tracing.',
                    //iwidth    : 150,
                    value    : true,
                    position : [2,0,1,3],
                    emitting : true
                  },
              TRACING_CYCLES : {
                    type     : 'integer',  // '_' means blank value is allowed
                    keyword  : '-a',       //  parameter keyword
                    label    : 'Number of autotracing cycles',
                    align    : 'left',
                    iwidth   : 50,
                    default  : '10',      // to be displayed in grey
                    tooltip  : 'The total number of global autotracing cycles',
                    range    : [0,'*'],  // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '10',      // value to be paired with the keyword
                    position : [3,0,1,1],  // [row,col,rowSpan,colSpan]
                    hideon   : {AUTOTRACE_CBX:[false]}
                  },
              AH_SEARCH_CBX : {
                    type     : 'checkbox',
                    keyword  : '-q',       //  parameter keyword
                    label    : 'Perform Alpha-Helix search',
                    tooltip  : 'Check to perform alpha-helix search.',
                    //iwidth    : 150,
                    value    : true,
                    position : [4,0,1,3],
                    hideon   : {AUTOTRACE_CBX:[false]}
                  },
              NCS_CBX : {
                    type     : 'checkbox',
                    keyword  : '-n',       //  parameter keyword
                    label    : 'Apply NCS in autotracing',
                    tooltip  : 'Check to apply NCS in autotracing.',
                    //iwidth    : 150,
                    value    : true,
                    position : [5,0,1,3],
                    hideon   : {AUTOTRACE_CBX:[false]}
                  },
              OMIT_RES_CBX : {
                    type     : 'checkbox',
                    keyword  : '-o',       //  parameter keyword
                    label    : 'Omit residues from fragment to optimize CC',
                    tooltip  : 'Check to omit residues from fragment to ' +
                               'optimize CC.',
                    //iwidth    : 150,
                    value    : true,
                    position : [6,0,1,3],
                    hideon   : {AUTOTRACE_CBX:[false]}
                  }
            }
          },
    sec2: { type     : 'section',
            title    : 'Extra options',
            open     : false,  // true for the section to be initially open
            position : [2,0,1,5],
            contains : {
              TIME_FACTOR : {
                    type     : 'real',  // '_' means blank value is allowed
                    keyword  : '-t',       //  parameter keyword
                    label    : 'Time factor for peptide searches',
                    align    : 'left',
                    iwidth   : 50,
                    default  : '1',      // to be displayed in grey
                    tooltip  : 'Time factor for peptides searches (increase if ' +
                               'difficult)',
                    range    : [1,'*'],  // may be absent (no limits) or must
                                          // be one of the following:
                                          //   ['*',max]  : limited from top
                                          //   [min,'*']  : limited from bottom
                                          //   [min,max]  : limited from top and bottom
                    value    : '1',      // value to be paired with the keyword
                    position : [2,0,1,1]  // [row,col,rowSpan,colSpan]
                  }
            }
          }
  };

/*
  -a    15  global autotracing cycles
  -b   5.0  extra B for revised heavy atom sites
  -c 0.400  fraction of pixels in crossover region
  -d 0.000  high resolution limit to be applied to input data
  -e unset  fill in missing data up to maximum resolution + 0.2 Ang.
  -f unset  read intensity not F from native .hkl file
  -F 0.800  fractional weight for phases from previous global cycle
  -g 1.100  solvent gamma flipping factor
  -i unset  no structure inversion
  -k   4.5  minimum height/sigma for revised heavy atom sites
  -l     2  space for  2000000 reflections
  -L     6  minimum number of residues per chain (if more than 3 chains)
  -m    20  cycles of density modification
  -G 0.700  FOM threshold for initial tripeptides and chain extension
  -n unset  do not apply NCS in autotracing
  -o        omit residues from fragment to optimize CC
  -q        alpha-helix search
  -r  3.00  map resolution (multiplies maximum indices)
  -s 0.450  solvent fraction
  -t  4.00  time factor for peptide searches (increase if difficult)
  -u   500  MB allocatable memory for fragment optimization
  -U  0.00  abort if less than this % of fragment CA retained within 0.7A
  -v 0.000  density sharpening factor
  -w 0.200  weight for experimental phases after cycle 1
  -x unset  no phase and trace diagnostics
  -y  1.80  highest resolution in Ang. for starting phases from model
  -z unset  do not optimize heavy atoms
*/

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskShelxEMR',TaskShelxEMR,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskShelxEMR',TaskShelxEMR,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskShelxEMR.prototype.icon           = function()  { return 'task_shelxemr'; }
TaskShelxEMR.prototype.clipboard_name = function()  { return '"Shelx-E"';     }

TaskShelxEMR.prototype.requiredEnvironment = function() {
  return ['CCP4',['$CCP4/bin/shelxe','$CCP4/bin/shelxe.exe']];
}

TaskShelxEMR.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function ShelxEMRHotButton()  {
  return {
    'task_name' : 'TaskShelxEMR',
    'tooltip'   : 'Density Modificaton and C&alpha;-tracing with ShelxE'
  };
}

TaskShelxEMR.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['shelx', 'shelxe','density','modification','alpha', 'tracing', 'calpha', 'dm', 'c-alpha'] );
}

if (!__template)  {
  //  for client side

  TaskShelxEMR.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'performs iterative density modification by the inclusion of automated protein main-chain tracing';
    };

  TaskShelxEMR.prototype.getHelpURL = function()  {
    return __task_reference_base_url + 'doc.task.SHELX.html#id1';
  }

  TaskShelxEMR.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    if (emitterId=='AUTOTRACE_CBX')  {

      if (emitterValue)  {
        this.title = 'Density Modificaton and C&alpha;-tracing with ShelxE';
        this.name  = 'shelxe DM and autotrace';
      } else  {
        this.title = 'Density Modificaton with ShelxE';
        this.name  = 'shelxe DM';
      }

      var inputPanel = inpParamRef.grid.parent.parent;
      inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
      var name = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
      inputPanel.header.uname_inp.setStyle ( 'text','',name );
      inputPanel.job_dialog.changeTitle ( name );
      this.updateInputPanel ( inputPanel );
      inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                              job_dialog_reason.rename_node );

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }

  TaskShelxEMR.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskShelxEMR.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl'] = [revision.HKL];
      this.input_data.data['seq'] = revision.ASU.seq;
      if (revision.Structure || revision.Substructure)  {
        if (revision.Options.leading_structure=='substructure')
              this.input_data.data['istruct'] = [revision.Substructure];
        else  this.input_data.data['istruct'] = [revision.Structure];
      }
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskShelxEMR.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.shelxemr', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskShelxEMR = TaskShelxEMR;

}
