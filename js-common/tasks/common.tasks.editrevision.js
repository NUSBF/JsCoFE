
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/common.tasks.editrevision.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ASU Definition Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2019-2024
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

function TaskEditRevision()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskEditRevision';
  this.name      = 'edit structure revision';
  this.setOName ( 'editrevision' );  // default output file name template
  this.title     = 'Edit Structure Revision';
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
    },{
      data_type   : { 'DataStructure' : ['xyz','substructure'],
                      'DataXYZ'       : [],  // data type(s) and subtype(s)
                      'DataRemove'    : []   // just the menu item
                    },
      label       : 'Macromolecular model<br>or substructure', // label for input dialog
      cast        : 'xyz',
      unchosen_label : '[do not change]',
      tooltip     : 'Atomic model of macromolecule(s) or heavy-atom substructure. ' +
                    'If no changes are required, choose [do not change].',
      inputId     : 'xyz',          // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      version     : 0,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : { 'DataStructure' : ['!phases','substructure'], // data type(s) and subtype(s)
                      'DataRemove'    : []           // just the menu item
                    },
      label       : 'Phases',       // label for input dialog
      cast        : 'phases',
      unchosen_label : '[do not change]',
      tooltip     : 'Phases to replace in current model or substructure (whichever ' +
                    'is leading). If no changes are required, choose [do not change].',
      inputId     : 'phases',       // input Id for referencing input fields
      customInput : 'cell-info',    // lay custom fields next to the selection
      version     : 0,              // minimum data version allowed
      min         : 0,              // minimum acceptable number of data instances
      max         : 1               // maximum acceptable number of data instances
    },{
      data_type   : {'DataLigand':[],'DataLibrary':[]},  // data type(s) and subtype(s)
      label       : 'Ligand data',  // label for input dialog
      unchosen_label : '[do not change]',
      tooltip     : 'Ligand(s). If no changes are required, choose [do not change]. ' +
                    'Note that if ligand structures are given, they will replace ' +
                    'any pre-existing ligands in structure revision.',
      inputId     : 'ligands',      // input Id for referencing input fields
      min         : 0,              // minimum acceptable number of data instances
      max         : 20              // maximum acceptable number of data instances
    }
  ];

}


if (__template)
      TaskEditRevision.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEditRevision.prototype = Object.create ( TaskTemplate.prototype );
TaskEditRevision.prototype.constructor = TaskEditRevision;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskEditRevision.prototype.icon           = function()  { return 'task_editrevision'; }
TaskEditRevision.prototype.clipboard_name = function()  { return '"Edit Revision"';   }

TaskEditRevision.prototype.currentVersion = function()  {
  var version = 3;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskEditRevision.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
    return this.__check_keywords ( keywords,['edit','structure', 'revision'] );
  }


if (!__template)  {
  //  for client side

  TaskEditRevision.prototype.desc_title = function()  {
  // this appears under task title in the task list
    return 'replace reflection data, sequences, atomic model, phases or ligand descriptions';
  }

  // TaskEditRevision.prototype.taskDescription = function()  {
  // // this appears under task title in the Task Dialog
  //   return 'Replaces reflection data, sequences, model, phases or ligand descriptions';
  // }

  TaskEditRevision.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    if (['revision','hkl','seq','xyz','phases','ligands'].indexOf(emitterId)>=0)  {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var hkl0  = inpDataRef.input[0].dt[inpDataRef.input[0].dropdown[0].getValue()].HKL;
      var spg0  = hkl0.getSpaceGroup();
      var cell0 = hkl0.getCellParameters();

      function compare_objects ( n,ddn )  {
        var ddnNo = ddn.getValue();
        if (ddnNo>=0)  {
          var obj = inpDataRef.input[n].dt[ddnNo];
          if (!obj.hasSubtype('proxy'))  {
            var spg = obj.getSpaceGroup();
            if (spg=='Unspecified')  return 'No space group';
            var s_spg  = spg .replace(/\s/g, '');
            var s_spg0 = spg0.replace(/\s/g, '');
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

      //  check symmetry compatibility
      // console.log ( ' 1. input_ready=' + input_ready)
      check_object ( 'hkl'    );
      check_object ( 'xyz'    );
      check_object ( 'phases' );
      // console.log ( ' 2. input_ready=' + input_ready)

      if (!input_ready)
            this.sendTaskStateSignal ( inpParamRef.grid.inputPanel,'hide_run_button' );
      else  this.sendTaskStateSignal ( inpParamRef.grid.inputPanel,'show_run_button' );

    }

  }


  /*
  TaskEditRevision.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var hkl    = this.input_data.getData ( 'hkl' );
    var seq    = this.input_data.getData ( 'seq' );
    var xyz    = this.input_data.getData ( 'xyz' );
    var phases = this.input_data.getData ( 'phases' );

    if ((hkl.length<=0) && (seq.length<=0) && (xyz.length<=0) && (phases.length<=0))
      input_msg = '<b><i>No changes requested -- nothing to do.</i></b>';

    return input_msg;

  }
  */

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEditRevision.prototype.doNotPackSuffixes = function()  { return []; }

  TaskEditRevision.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and sequence data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      var revision = this.input_data.data['revision'][0];
      this.input_data.data['hkl0'] = [revision.HKL];
      this.input_data.data['seq0'] = revision.ASU.seq;
      if (revision.Options.leading_structure=='substructure')
        this.input_data.data['struct0'] = [revision.Substructure];
      else if (revision.Options.leading_structure=='structure')
        this.input_data.data['struct0'] = [revision.Structure];
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  TaskEditRevision.prototype.makeOutputData = function ( jobDir )  {
  // We modify this function such that this.input_data contains template data
  // instances for substructure and phases data when [remove] and [do not change]
  // are chosen. This will keep the corresponding controls in input panel after
  // job completion.

    __template.TaskTemplate.prototype.makeOutputData.call ( this,jobDir );

    if (('revision' in this.input_data.data) && (this.input_data.data['revision']>0))  {
      var revision = this.input_data.data['revision'][0];

      this.input_data.addData ( revision.HKL );
      if (revision.ASU.seq.length>0)
        this.input_data.addData ( revision.ASU.seq[0] );
      if (revision.Structure)
        this.input_data.addData ( revision.Structure );
      if (revision.Substructure)
        this.input_data.addData ( revision.Substructure );

    } else
      console.log ( ' **** ' + this._type + ': no revision in input data -- fatal' );

  }


  TaskEditRevision.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.editrevision', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEditRevision = TaskEditRevision;

}
