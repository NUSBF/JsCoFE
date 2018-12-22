
/*
 *  =================================================================
 *
 *    12.12.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.asudef.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ASU Definition (from Structure) Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */


var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.asudef' );

// ===========================================================================

function TaskASUDefStruct()  {

  if (__template)  __template.TaskASUDef.call ( this );
             else  TaskASUDef.call ( this );

  this._type     = 'TaskASUDefStruct';
  this.name      = 'asymmetric unit content';
  this.oname     = 'asu definition';  //'*';   // asterisk here means do not use
  this.title     = 'Asymmetric Unit Content from Structure';
  this.helpURL   = './html/jscofe_task_asudef_struct.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{   // input data types
      data_type   : {'DataStructure':['xyz']},  // data type(s) and subtype(s)
      label       : 'Structure',   // label for input dialog
      tooltip     : 'Structure object with phasing results.',
      inputId     : 'istruct',       // input Id for referencing input fields
      min         : 1,               // minimum acceptable number of data instances
      max         : 1                // maximum acceptable number of data instances
    },{
      // enforce having at least 1 DataHKL in the branch, and also get access to them
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : '',         // label for input dialog
      inputId     : 'void1',    // void input Id for not showing the item
      min         : 1,          // minimum acceptable number of data instances
      max         : 100000      // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':['~unknown']}, // data type(s) and subtype(s)
      label       : 'Sequence',    // label for input dialog
      tooltip     : 'Macromolecular sequence(s) expected in ASU. If unknown, choose ' +
                    '[do not use] and set the estimated molecular size in the ' +
                    'parameters section below in the page.',
      inputId     : 'seq',         // input Id for referencing input fields
      customInput : 'stoichiometry-wauto', // lay custom fields below the dropdown
      version     : 0,             // minimum data version allowed
      force       : 1,             // meaning choose, by default, 1 sequence if
                                   // available; otherwise, 0 (== do not use) will
                                   // be selected
      min         : 0,             // minimum acceptable number of data instances
      max         : 10             // maximum acceptable number of data instances
    }
  ];

  /*
  this.parameters = { // input parameters
    sec1 : {  type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
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
                      position  : [0,0,1,1],
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
                      position  : [0,3,1,1],  // [row,col,rowSpan,colSpan]
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
                      position  : [0,3,1,1],  // [row,col,rowSpan,colSpan]
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
                      position  : [1,0,1,1],
                      showon    : {seq:[-1,0]}
                    },
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
              }
    }
  };
  */

}


if (__template)
      TaskASUDefStruct.prototype = Object.create ( __template.TaskASUDef.prototype );
else  TaskASUDefStruct.prototype = Object.create ( TaskASUDef.prototype );
TaskASUDefStruct.prototype.constructor = TaskASUDefStruct;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskASUDefStruct.prototype.icon_small = function()  { return 'task_asudef_20x20'; }
TaskASUDefStruct.prototype.icon_large = function()  { return 'task_asudef';       }

TaskASUDefStruct.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskASUDef.prototype.currentVersion.call ( this );
  else  return  version + TaskASUDef.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskASUDefStruct.prototype.makeInputData = function ( login,jobDir )  {

    // put hkl in input databox for copying their files in
    // job's 'input' directory

    var assoc = this.input_data.data['istruct'][0].associated;
    var hkl = this.input_data.data['void1'];
    var hkl_sel = [];
    for (var i=0;i<hkl.length;i++)
      if (assoc.indexOf(hkl[i].dataId)>=0)
        hkl_sel.push ( hkl[i] );
    this.input_data.data['hkl'] = hkl_sel;

    __template.TaskASUDef.prototype.makeInputData.call ( this,login,jobDir );

  }


  TaskASUDefStruct.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.asudef', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskASUDefStruct = TaskASUDefStruct;

}
