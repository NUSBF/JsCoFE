
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.lsqkab.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  LSQKAB Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.template' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskLsqKab()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskLsqKab';
  this.name    = 'lsqkab';
  this.setOName ( 'lsqkab' );  // default output file name template
  this.title   = 'Structure Superposition with LSQKab';
  //this.helpURL = './html/jscofe_task_lsqkab.html';

  this.maxFitParamRows = 10;

  this.input_dtypes = [{  // input data types
      data_type : {'DataStructure':['~mmcif_only'],
                   'DataXYZ'      :['~mmcif_only'] }, // data type(s) and subtype(s)
      label     : 'Moving structure', // label for input dialog
      inputId   : 'moving_xyz',        // input Id for referencing input fields
      min       : 1,           // minimum acceptable number of data instances
      max       : 1            // maximum acceptable number of data instances
   },{
      data_type : {'DataStructure':['~mmcif_only'],
                   'DataXYZ'      :['~mmcif_only'] }, // data type(s) and subtype(s)
      label     : 'Fixed structure',  // label for input dialog
      inputId   : 'fixed_xyz',        // input Id for referencing input fields
      min       : 1,           // minimum acceptable number of data instances
      max       : 1            // maximum acceptable number of data instances
   }
  ];

  this.parameters = { // input parameters
    sec1 :  { type     : 'section',
              title    : 'Parameters',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {
                SELECT_LBL : {
                      type     : 'label',
                      label    : '<b><i>Atom selection</i></b>',
                      align    : 'center',
                      position : [0,2,1,1]
                    },
                FROM_LBL : {
                      type     : 'label',
                      label    : '<b><i>from</i></b>',
                      align    : 'center',
                      position : [0,5,1,1]
                    },
                TO_LBL : {
                      type     : 'label',
                      label    : '<b><i>to</i></b>',
                      align    : 'center',
                      position : [0,6,1,1]
                    },
                CHAIN_LBL : {
                      type     : 'label',
                      label    : '<b><i>Chain</i></b>',
                      align    : 'center',
                      position : [0,7,1,1]
                    }
              }
            }
  };

  for (var i=0;i<this.maxFitParamRows;i++)
    this.makeFitParamRow ( i );

  this.parameters.sec1.contains['SPHERE_SEC'] = {
    type     : 'section',
    title    : '',
    open     : true,
    position : [1+2*this.maxFitParamRows,0,1,15]
  };

  this.parameters.sec1.contains['SPHERE_SEC'].contains = {
    SPHERE_CBX : {
          type     : 'checkbox',
          label    : 'Only fit in sphere',
          tooltip  : 'Restrict fitted atoms by sphere',
          iwidth   : 200,
          value    : false,
          position : [0,0,1,3]
        },
    RADIUS : {
          type     : 'real',
          keyword  : 'RADIUS',
          label    : 'of radius',
          reportas : 'sphere radius',
          align    : 'right',
          tooltip  : 'Sphere radius, &Aring;',
          range    : [0.0,'*'],
          iwidth   : 60,
          value    : '',
          position : [1,0,1,1],
          showon   : {SPHERE_CBX:[true]}
        },
    CENTER_SEL : {
          type     : 'combobox',  // the real keyword for job input stream
          keyword  : 'CENTER',
          label    : 'centered on',
          tooltip  : 'Sphere center reference',
          iwidth   : 250,      // width of input field in px
          range    : [ 'F|centre of fixed molecule',
                       'C|coordinates'
                     ],
          value    : 'F',
          position : [2,0,1,1],
          showon   : {SPHERE_CBX:[true]}
        },
    CENTER_X : {
          type     : 'real',
          keyword  : 'CENTER_X',
          label    : '&nbsp;&nbsp;x:',
          align    : 'right',
          reportas : 'sphere center - x',
          tooltip  : 'Sphere x-center, &Aring;',
          range    : ['*','*'],
          iwidth   : 60,
          value    : '',
          position : [2,4,1,1],
          showon   : {'_':'&&',SPHERE_CBX:[true],CENTER_SEL:['C']}
        },
    CENTER_Y : {
          type     : 'real',
          keyword  : 'CENTER_Y',
          label    : '&nbsp;&nbsp;y:',
          align    : 'right',
          reportas : 'sphere center - y',
          tooltip  : 'Sphere y-center, &Aring;',
          range    : ['*','*'],
          iwidth   : 60,
          value    : '',
          position : [2,7,1,1],
          showon   : {'_':'&&',SPHERE_CBX:[true],CENTER_SEL:['C']}
        },
    CENTER_Z : {
          type     : 'real',
          keyword  : 'CENTER_Z',
          label    : '&nbsp;&nbsp;z:',
          align    : 'right',
          reportas : 'sphere center - z',
          tooltip  : 'Sphere x-center, &Aring;',
          range    : ['*','*'],
          iwidth   : 60,
          value    : '',
          position : [2,10,1,1],
          showon   : {'_':'&&',SPHERE_CBX:[true],CENTER_SEL:['C']}
        }
  };

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskLsqKab.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskLsqKab.prototype = Object.create ( TaskTemplate.prototype );
TaskLsqKab.prototype.constructor = TaskLsqKab;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskLsqKab.prototype.icon           = function()  { return 'task_lsqkab'; }
TaskLsqKab.prototype.clipboard_name = function()  { return '"LSQKab"';    }

TaskLsqKab.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'structure superposition with manual specification of matching atoms';
}

TaskLsqKab.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// TaskLsqKab.prototype.cleanJobDir = function ( jobDir )  {}

TaskLsqKab.prototype.makeFitParamRow = function ( rowNo )  {

  var rno = 1 + 2*rowNo;

  var fitKey = 'FIT_' + rowNo + '_SEL';
  if (rowNo<=0)
    this.parameters.sec1.contains[fitKey] = {
      type     : 'combobox',  // the real keyword for job input stream
      keyword  : 'fit'+rowNo,
      label    : '<b>Fit</b>',
      tooltip  : 'Selection type',
      iwidth   : 440,      // width of input field in px
      range    : [ 'CA|C-alpha atoms of moving structure in residue range',
                   'MAIN|mainchain atoms of moving structure in residue range',
                   'SIDE|sidechain atoms of moving structure in residue range',
                   'ALL|all atoms of moving structure in residue range',
                   'AA|atoms of moving structure in serial number range'
                ],
      value    : 'CA',
      position : [rno,0,1,1]
    };
  else
    this.parameters.sec1.contains[fitKey] = {
      type     : 'combobox',  // the real keyword for job input stream
      keyword  : 'fit'+rowNo,
      label    : '<b>and</b>',
      tooltip  : 'Selection type',
      iwidth   : 440,      // width of input field in px
      range    : [ 'NO|no other atoms',
                   'CA|C-alpha atoms of moving structure in residue range',
                   'MAIN|mainchain atoms of moving structure in residue range',
                   'SIDE|sidechain atoms of moving structure in residue range',
                   'ALL|all atoms of moving structure in residue range',
                   'AA|atoms of moving structure in serial number range'
                ],
      value    : 'NO',
      position : [rno,0,1,1]
    };

  var hide_on = {};
  hide_on[fitKey] = ['NO'];
  if (rowNo>1)  {
    hide_on['_'] = '||';
    var refHide  = 'FIT_' + (rowNo-1) + '_SEL';
    hide_on[refHide] = ['NO'];
    this.parameters.sec1.contains[fitKey].hideon = {};
    this.parameters.sec1.contains[fitKey].hideon[refHide] = ['NO'];
  }

  this.parameters.sec1.contains['FITFROM'+rowNo] = {
    type     : 'integer',
    keyword  : 'from'+rowNo,
    label    : '',
    reportas : 'fit range #'+(rowNo+1) + ' \"from\"',
    tooltip  : 'First number in the range',
    range    : ['*','*'],
    iwidth   : 60,
    value    : '',
    position : [rno,3,1,1],
    hideon   : hide_on
  };

  this.parameters.sec1.contains['FITTO'+rowNo] = {
    type     : 'integer',
    keyword  : 'to'+rowNo,
    label    : '',
    lwidth   : 0,
    reportas : 'fit range #'+(rowNo+1) + ' \"to\"',
    tooltip  : 'Last number in the range',
    range    : ['*','*'],
    iwidth   : 60,
    value    : '',
    position : [rno,6,1,1],
    hideon   : hide_on
  };

  this.parameters.sec1.contains['FITCHAIN'+rowNo+'_SEL'] = {
    type     : 'combobox',  // the real keyword for job input stream
    keyword  : 'chain'+rowNo,
    label    : '',
    lwidth   : 0,
    tooltip  : 'Chain selection',
    //iwidth   : 220,      // width of input field in px
    range    : [ 'A|A' ],
    value    : 'A',
    position : [rno,7,1,1],
    hideon   : hide_on
  };

  rno++;

  this.parameters.sec1.contains['MOVING'+rowNo+'_LBL'] = {
    type     : 'label',
    label    : '',
    align    : 'right',
    position : [rno,0,1,3],
    hideon   : hide_on
  };

  this.parameters.sec1.contains['FROM'+rowNo] = {
    type     : 'integer',
    keyword  : 'from'+rowNo,
    label    : '',
    reportas : 'match range #'+(rowNo+1) + ' \"from\"',
    tooltip  : 'First number in the range',
    range    : ['*','*'],
    iwidth   : 60,
    value    : '',
    position : [rno,1,1,1],
    hideon   : hide_on
  };

  this.parameters.sec1.contains['TO'+rowNo] = {
    type     : 'integer',
    keyword  : 'to'+rowNo,
    label    : '',
    lwidth   : 0,
    reportas : 'match range #'+(rowNo+1) + ' \"to\"',
    tooltip  : 'Last number in the range',
    range    : ['*','*'],
    iwidth   : 60,
    value    : '',
    position : [rno,4,1,1],
    hideon   : hide_on
  };

  this.parameters.sec1.contains['CHAIN'+rowNo+'_SEL'] = {
    type     : 'combobox',  // the real keyword for job input stream
    keyword  : 'chain'+rowNo,
    label    : '',
    lwidth   : 0,
    tooltip  : 'Chain selection',
    //iwidth   : 220,      // width of input field in px
    range    : [ 'A|A' ],
    value    : 'A',
    position : [rno,5,1,1],
    hideon   : hide_on
  };

}

TaskLsqKab.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['lsqkab', 'structure','superposition', 'alignment', 'comparison'] );
}


if (!__template)  {
  //  for client side

  TaskLsqKab.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    if (this.state==job_code.new)  {
      if ((emitterId=='moving_xyz') || (emitterId=='fixed_xyz'))  {
        var inpDataRef = inpParamRef.grid.inpDataRef;
        var item       = this.getInputItem ( inpDataRef,emitterId ).dropdown[0];
        var xyz        = item.dt[item.getValue()];
        var chains     = xyz.getChainList();
        var chsel = 'FITCHAIN';
        if (emitterId=='fixed_xyz')
          chsel = 'CHAIN';
        for (var i=0;i<this.maxFitParamRows;i++)  {
          var item_id   = chsel + i + '_SEL';
          var chain_sel = inpParamRef.parameters[item_id].input;
          var crvalue   = inpParamRef.parameters[item_id].ref.value;
          chain_sel.reset();
          for (var j=0;j<chains.length;j++)
            chain_sel.addItem ( chains[j].label,'',chains[j].id,
                                chains[j].id==crvalue );
          chain_sel.make();
        }
      } else  {
        var lst = emitterId.split('_');
        if ((lst[0]=='FIT') || (lst[0]=='RTYPE'))  {
          inpParamRef.parameters['MOVING'+lst[1]+'_LBL'].label.setText(
            'to ' + inpParamRef.parameters['FIT_'+lst[1]+'_SEL'].input.getText().replace('moving','fixed') );
            // +
            //inpParamRef.parameters['RTYPE_'+lst[1]+'_SEL'].input.getText() );
        }

      }
    }

  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskLsqKab.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.lsqkab', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskLsqKab = TaskLsqKab;

}
