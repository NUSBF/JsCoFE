// LEGACY CODE, ONLY USED IN OLD PROJECTS   05.09.20  v.1.4.014

/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.editrevisionasu.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ASU Modification Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019-2024
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

function TaskEditRevisionASU()  {

  if (__template)  {
    __template.TaskTemplate.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskTemplate.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type     = 'TaskEditRevisionASU';
  this.name      = 'edit revision asu';
  this.setOName ( 'edit_revision_asu' );  // default output file name template
  this.title     = 'Edit Revision: Asymmetric Unit';
  //this.helpURL   = './html/jscofe_task_editrevision_asu.html';
  this.fasttrack = true;  // enforces immediate execution

  this.input_dtypes = [{   // input data types
      data_type   : {'DataRevision':[]},   // data type(s) and subtype(s)
      label       : 'Structure revision',  // label for input dialog
      tooltip     : 'Structure revision, in which the ASU contents needs to be '+
                    'modified',
      inputId     : 'revision',     // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      //customInput : 'asumod',     // lay custom fields next to the selection
      version     : 5,              // minimum data version allowed
      min         : 1,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
   },{
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflections',  // label for input dialog
      unchosen_label : '[do not change]',
      tooltip     : 'Reflection dataset to be used for phasing and refinement ' +
                    'in further tasks. If no changes are required, choose ' +
                    '[do not change].',
      inputId     : 'hkl',          // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataSequence':['~unknown']}, // data type(s) and subtype(s)
      label       : 'Sequence',     // label for input dialog
      unchosen_label : '[do not change]',
      tooltip     : 'Macromolecular sequence(s) expected in ASU. If no ' +
                    'changes in ASU compositon are required, choose ' +
                    '[do not change].',
      inputId     : 'seq',          // input Id for referencing input fields
      customInput : 'stoichiometry-wauto', // lay custom fields below the dropdown
      version     : 0,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 10              // maximum acceptable number of data instances
    }
  ];

}

if (__template)
  __cmd.registerClass ( 'TaskEditRevisionASU',TaskEditRevisionASU,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskEditRevisionASU',TaskEditRevisionASU,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskEditRevisionASU.prototype.icon           = function()  { return 'task_editrevision_asu'; }
TaskEditRevisionASU.prototype.clipboard_name = function()  { return '"Edit Revision"';       }

TaskEditRevisionASU.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (!__template)  {
  //  for client side

  TaskEditRevisionASU.prototype.checkObjects = function (
                                                  inpParamRef,emitterId,
                                                  emitters_list,object_list )  {

    if (emitters_list.indexOf(emitterId)>=0)  {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var hkl0  = inpDataRef.input[0].dt[inpDataRef.input[0].dropdown[0].getValue()].HKL;
      var spg0  = hkl0.getSpaceGroup();
      var cell0 = hkl0.getCellParameters();

      function compare_objects ( n,ddn )  {
        var ddnNo = ddn.getValue();
        if (ddnNo>=0)  {
          var obj = inpDataRef.input[n].dt[ddnNo];
          var spg = obj.getSpaceGroup();
          if (spg=='Unspecified')  return 'No space group';
          s_spg = spg.replace(/\s/g, '');
          s_spg0 = spg0.replace(/\s/g, '');
          if (s_spg!=s_spg0)    return 'Unmatched space group';
          var cell = obj.getCellParameters();
          if (cell[0]<2.0)  return 'No cell parameters';
          var ok = true;
          for (var i=0;(i<3) && ok;i++)
            if ((Math.abs(cell[i]-cell0[i])/(cell[i]+cell0[i])>0.005) ||
                (Math.abs(cell[i+3]-cell0[i+3])>2.0))
              ok = false;
          if (!ok)  return 'Too distant cell parameters';
        }
        return '';
      }

      var input_ready = false;
      for (var i=1;(i<inpDataRef.input.length) && (!input_ready);i++)  {
        var inpi = inpDataRef.input[i];
        for (var j=0;(j<inpi.dropdown.length) && (!input_ready);j++)
          input_ready = (inpi.dropdown[j].getValue()>=0);
      }

      function check_object ( input_id )  {
        var n = -1;
        for (var i=0;(i<inpDataRef.input.length) && (n<0);i++)
          if (inpDataRef.input[i].inputId==input_id)
            n = i;
        if (n>=0)  {
          var ddn = inpDataRef.input[n].dropdown[0];
          var msg = compare_objects ( n,ddn );
          ddn.customGrid.setLabel ( msg.fontcolor('red'),0,2,1,1 )
                        .setFontItalic(true).setNoWrap();
          if (msg.length>0)
            input_ready = false;
        }
      }

      for (var k=0;k<object_list.length;k++)
        check_object ( object_list[k] );

      return input_ready;

    }

  }

  TaskEditRevisionASU.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {
    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );
    var signal = '';
    if (!this.checkObjects(inpParamRef,emitterId,['revision','hkl','seq'],['hkl']))
      signal = 'hide_run_button';
    this.sendTaskStateSignal ( inpParamRef.grid.inputPanel,signal );
  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEditRevisionASU.prototype.doNotPackSuffixes = function()  { return []; }

  TaskEditRevisionASU.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and sequence data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl0'] = [revision.HKL];
      this.input_data.data['seq0'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskEditRevisionASU.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.editrevision_asu', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEditRevisionASU = TaskEditRevisionASU;

}
