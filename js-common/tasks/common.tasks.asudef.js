
/*
 * MAIN ASU TASK
 *
 *  =================================================================
 *
 *    12.01.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.asudef.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ASU Definition Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2025
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

function TaskASUDef()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskASUDef';
  this.name      = 'define asymmetric unit contents';
  this.oname     = '';  //'*';   // asterisk here means do not use
  this.title     = 'Asymmetric Unit Contents';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{   // input data types
      data_type   : {'DataHKL':[]},  // data type(s) and subtype(s)
      label       : 'Reflections',   // label for input dialog
      tooltip     : 'Reflection dataset, which will be used for phasing and ' +
                    'refinement in the follow-up tasks.',
      inputId     : 'hkl',           // input Id for referencing input fields
      min         : 1,               // minimum acceptable number of data instances
      max         : 1                // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':['~unknown']}, // data type(s) and subtype(s)
      label       : 'Sequence',    // label for input dialog
      unchosen_label : 'sequence unknown',
      tooltip     : 'Macromolecular sequence(s) expected in ASU. If unknown, choose ' +
                    '[do not use] and set the estimated molecular size in the ' +
                    'parameters section below in the page.',
      inputId     : 'seq',         // input Id for referencing input fields
      customInput : 'stoichiometry-wauto', // lay custom fields below the dropdown
      version     : 0,             // minimum data version allowed
      force       : 10,            // meaning choose, by default, n<=10 sequences if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 0,             // minimum acceptable number of data instances
      max         : 10             // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    sec0 : {  type      : 'section',
              title     : '',
              open      : true,  // true for the section to be initially open
              position  : [0,0,1,5],
              contains  : {

                TARGET_SEL : {
                  type     : 'combobox',
                  keyword  : 'target_sel',
                  label    : 'Target solvent content',
                  tooltip  : 'Choose whether the target solvent composition should ' +
                             'be predicted (recommended), or set to a known value.',
                  range    : ['P|AI-predicted',
                              'H|hypothesized'
                             ],
                  value    : 'P',
                  iwidth   : 154,
                  position : [0,0,1,1]
                },

                TARGET_SOL : {
                          type      : 'real_', // blank value is not allowed
                          keyword   : 'target', // the real keyword for job input stream
                          label     : '&nbsp;&nbsp;at',
                          tooltip   : 'Target solvent content is typically set at 50%. If ' +
                                      'left blank, the solvent content will be calculated ' +
                                      'based on the provided number of sequence copies (any ' +
                                      'missing values will be optimized).',
                          iwidth    : 40,
                          range     : [1.0,99.0], // may be absent (no limits) or must
                                                  // be one of the following:
                                                  //   ['*',max]  : limited from top
                                                  //   [min,'*']  : limited from bottom
                                                  //   [min,max]  : limited from top and bottom
                          value     : '50.0',     // value to be paired with the keyword
                          label2    : '%',
                          // placeholder : 'given',
                          showon    : {TARGET_SEL:['H']},
                          position  : [0,3,1,1]   // [row,col,rowSpan,colSpan]
                        },

                HATOM : { type      : 'string_',   // empty string allowed
                          keyword   : 'atomtype=',
                          label     : 'Main anomalous scatterer',
                          tooltip   : 'Specify atom type of dominant anomalous scatterer ' +
                                      '(e.g., S, SE etc.), or leave blank if uncertain.',
                          iwidth    : 40,
                          value     : '',
                          emitting  : true,    // will emit 'onchange' signal
                          maxlength : 2,       // maximum input length
                          position  : [1,0,1,1],
                          showon    : {'hkl.subtype:anomalous':[1]}
                        },

                EPLBL : { type      : 'label',
                          label     : '<h3>Reflection data does not contain anomalous differences.</h3>' +
                                      '<font color="maroon"><i>Not suitable for Experimental Phasing.</i></font>',
                          position  : [2,0,1,5],
                          showon    : {'hkl.subtype:anomalous':[0,-1]}
                        },

                NSPL :  { type      : 'label',
                          label     : '&nbsp',
                          position  : [3,0,1,5]
                        }

              }
           },

    sec1 : {  type      : 'section',
              title     : 'ASU Composition',
              open      : true,  // true for the section to be initially open
              position  : [1,0,1,5],
              showon    : {seq:[-1,0]},
              contains  : {

                LEGEND_NOSEQ_1 : {
                  type     : 'label',  // just a separator
                  label    : '<b><i style="font-size:85%">Note: project development is easier '  +
                             'if ASU is defined using expected sequences; this is the ' +
                             'recommended way.<br>&nbsp;</i></b>',
                  position : [0,0,1,5],
                  showon   : { seq:[0] }
                },

                LEGEND_NOSEQ_2 : {
                  type     : 'label',  // just a separator
                  label    : '<b><i style="font-size:85%">Note: project development is easier '  +
                             'if ASU is defined using expected sequences; this is the ' +
                             'recommended way.<br>If you have sequence files, import them before ' +
                             'running this task.<br>&nbsp;</i></b>',
                  position : [0,0,1,5],
                  showon   : { seq:[-1] }
                },

                ESTIMATE_SEL : {
                      type      : 'combobox',  // the real keyword for job input stream
                      keyword   : 'estimate',
                      label     : 'Estimate molecular size using',
                      tooltip   : 'When sequence is not given, choose to estimate ' +
                                  'the molecular size using either the total ' +
                                  'number of residues or total molecular weight. ' +
                                  'In case of several different molecules, give ' +
                                  'the combined size with respect to stoichiometric ' +
                                  'ratios.',
                      //iwidth   : 220,      // width of input field in px
                      range     : ['NR|number of residues',
                                   'MW|molecular weight'
                                  ],
                      value     : 'NR',
                      position  : [1,0,1,1],
                      showon    : {seq:[-1,0]}
                    },
                NRES : {
                      type      : 'integer', // blank value is not allowed
                      keyword   : 'NRES', // the real keyword for job input stream
                      label     : 'number of residues',
                      tooltip   : 'Total number of residues in the molecule. In ' +
                                  'case of several different molecules, give the ' +
                                  'combined number of residues with respect to ' +
                                  'stoichiometric ratios.',
                      iwidth    : 80,
                      range     : [1,'*'],    // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                      value     : '',         // value to be paired with the keyword
                      position  : [1,3,1,1],  // [row,col,rowSpan,colSpan]
                      showon    : {ESTIMATE_SEL:['NR'],seq:[-1,0]}
                    },
                MOLWEIGHT : {
                      type      : 'real', // blank value is not allowed
                      keyword   : 'MOLWEIGHT', // the real keyword for job input stream
                      label     : 'molecular weight (Daltons)',
                      tooltip   : 'Total molecular weight of the molecule. In case ' +
                                  'of several different molecules, give the combined ' +
                                  'weight with respect to stoichiometric ratios.',
                      iwidth    : 80,
                      range     : [1,'*'],    // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                      value     : '',         // value to be paired with the keyword
                      position  : [1,3,1,1],  // [row,col,rowSpan,colSpan]
                      showon    : {ESTIMATE_SEL:['MW'],seq:[-1,0]}
                    },
                COMPOSITION_SEL : {
                      type      : 'combobox',
                      keyword   : 'MODE',
                      label     : 'General crystal composition',
                      tooltip   : 'Give general crystal composition',
                      //iwidth   : 220,      // width of input field in px
                      range     : ['P|protein only',
                                   'C|protein/polynucletide complex',
                                   'D|polynucletide only'
                                  ],
                      value     : 'P',
                      position  : [2,0,1,1],
//                      showon    : {seq:[-1,0]}
                      showon    : {ESTIMATE_SEL:['NR','MW'],seq:[-1,0]}
                    }
                /*
                RESLIMIT : {
                      type      : 'real_', // blank value is allowed
                      keyword   : 'RESO', // the real keyword for job input stream
                      label     : 'High resolution limit',
                      tooltip   : 'If given the high resolution limit will be ' +
                                  'used in Matthews probability scoring.',
                      iwidth    : 80,
                      range     : [0.01,'*'], // may be absent (no limits) or must
                                              // be one of the following:
                                              //   ['*',max]  : limited from top
                                              //   [min,'*']  : limited from bottom
                                              //   [min,max]  : limited from top and bottom
                      value     : '',         // value to be paired with the keyword
                      position  : [2,0,1,1]  // [row,col,rowSpan,colSpan]
                    }
                */
              }
          }
  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskASUDef',TaskASUDef,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskASUDef',TaskASUDef,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskASUDef.prototype.icon           = function()  { return 'task_asudef';    }
TaskASUDef.prototype.clipboard_name = function()  { return '"ASU Contents"'; }

TaskASUDef.prototype.currentVersion = function()  {
  let version = 3;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// hotButtons return list of buttons added in JobDialog's toolBar.
function AsuDefHotButton()  {
  return {
    'task_name' : 'TaskASUDef',
    'tooltip'   : 'Define Asymmetric Unit'
  };
}

TaskASUDef.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['asu','asymmetric', 'unit', 'content', 'definition'] );
  }

if (!__template)  {
  //  for client side

  TaskASUDef.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'to define Asymmetric Unit Contents';
    };

  TaskASUDef.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'specify the expected ASU composition and form the initial Structure Revision';
  }

  // TaskASUDef.prototype.taskDescription = function()  {
  // // this appears under task title in the Task Dialog
  //   return 'Sets anticipated number of chains in ASU and forms initial Structure Revision';
  // }

  TaskASUDef.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    if (emitterId=='hkl')  {
      let inpDataRef = inpParamRef.grid.inpDataRef;
      let item       = this.getInputItem ( inpDataRef,'hkl' ).dropdown[0];
      let hkl        = item.dt[item.getValue()];
      if (hkl.subtype.indexOf(hkl_subtype.anomalous)>=0)  {
        let hatom = inpParamRef.parameters['HATOM'].input;
        if (hkl.hasOwnProperty('ha_type') && hkl.ha_type)
          hatom.setValue ( hkl.ha_type );
      }
    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }

} else  {
  //  for server side

  const conf = require('../../js-server/server.configuration');

  TaskASUDef.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.asudef', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskASUDef = TaskASUDef;

}
