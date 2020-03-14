
/*
 *  =================================================================
 *
 *    12.03.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.modelprepxyz.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Coordinates Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

/*
 * jsCoFE: Javascript-powered Cloud Front End
 *
 *  Client and Server-side code:  MR Model from Coordinates Interface.
 *
 *  Copyright (C)  Eugene Krissinel 2017
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskModelPrepXYZ()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskModelPrepXYZ';
  this.name    = 'prepare MR model(s) from xyz';
  this.setOName ( '*' );  // default output file name template; '*': hide the field
  this.title   = 'Prepare MR Model(s) from Coordinate data';
  this.helpURL = './html/jscofe_task_modelprepxyz.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      tooltip     : 'Specify macromolecular sequence to be associated with the ' +
                    'resulting ensembles.',
      inputId     : 'seq',      // input Id for referencing input fields
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz'],
                     'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Specify coordinate data set(s) to be prepared as ' +
                    'ensemble(s) for Molecular Replacement. The ensemble(s) ' +
                    'will be named after the corresponding coordinate data ' +
                    'set(s).',
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'chain-sel', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1000         // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    sec1 :  { type     : 'section',
              title    : 'Model modification',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {

                MODIFICATION_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Modification protocol:',
                        tooltip  : 'Choose trim option',
                        range    : [ 'U|Unmodified',
                                     'D|PDB Clip',
                                     'M|Molrep',
                                     //'C|Chainsaw',
                                     //'S|Sculptor',
                                     'P|Polyalanine'
                                   ],
                        value    : 'M',
                        //showon   : { _:'&&', 'seq':[1], 'xyz':[1] },
                        position : [0,0,1,1]
                      },
                LEGEND_SEQ_U : {
                        type      : 'label',  // just a separator
                        label     : '<i>(models are not changed)</i>',
                        position  : [0,3,1,1],
                        showon    : { 'MODIFICATION_SEL':['U'] }
                        //showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['U'] }
                      },
                LEGEND_SEQ_D : {
                        type      : 'label',  // just a separator
                        label     : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position  : [0,3,1,1],
                        showon    : { 'MODIFICATION_SEL':['D'] }
                        //showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['D'] }
                      },
                LEGEND_SEQ_M : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Molrep)</i>',
                        position  : [0,3,1,1],
                        showon    : { 'MODIFICATION_SEL':['M'] }
                        //showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['M'] }
                      },
                LEGEND_SEQ_C : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Chainsaw)</i>',
                        position  : [0,3,1,1],
                        showon    : { 'MODIFICATION_SEL':['C'] }
                        //showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['C'] }
                      },
                LEGEND_SEQ_S : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Sculptor)</i>',
                        position  : [0,3,1,1],
                        showon    : { 'MODIFICATION_SEL':['S'] }
                        //showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['S'] }
                      },
                LEGEND_SEQ_P : {
                        type      : 'label',  // just a separator
                        label     : '<i>(removal of all side chains)</i>',
                        position  : [0,3,1,1],
                        showon    : { 'MODIFICATION_SEL':['P'] }
                        //showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['P'] }
                      }
              }
            }

  }

}

if (__template)
      TaskModelPrepXYZ.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskModelPrepXYZ.prototype = Object.create ( TaskTemplate.prototype );
TaskModelPrepXYZ.prototype.constructor = TaskModelPrepXYZ;


// ===========================================================================

TaskModelPrepXYZ.prototype.icon = function()  { return 'task_modelprepxyz'; }

TaskModelPrepXYZ.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {
  // for client side

  TaskModelPrepXYZ.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (msg.length<=0)  {
      var seq       = this.input_data.getData ( 'seq' );
      var xyz       = this.input_data.getData ( 'xyz' );
      var nProteins = 0;
      var nDNAs     = 0;
      var nRNAs     = 0;
      var nLigs     = 0;
      var isProtein = false;
      var isDNA     = false;
      var isRNA     = false;

      if (seq && (seq.length>0))  {
        isProtein = (seq[0].subtype.indexOf('protein')>=0);
        isDNA     = (seq[0].subtype.indexOf('dna')>=0);
        isRNA     = (seq[0].subtype.indexOf('rna')>=0);
      }

      for (var i=0;i<xyz.length;i++)  {
        if (xyz[i].chainSelType=='protein')  nProteins++;
        else if (xyz[i].chainSelType=='dna') nDNAs++;
        else if (xyz[i].chainSelType=='rna') nRNAs++;
        else if (xyz[i].chainSelType=='lig') nLigs++;
        else  {
          if (xyz[i].subtype.indexOf('protein')>=0)  nProteins++;
          if (xyz[i].subtype.indexOf('dna')>=0)      nDNAs++;
          if (xyz[i].subtype.indexOf('rna')>=0)      nRNAs++;
        }
      }

      if (nLigs>0) {
        msg = '<b>Component type LIG (ligands) cannot be used for making an ensemble.</b><p>' +
              'Make sure that all components of ensemble have the same polymeric type.';
      } else if ((isProtein && (nDNAs+nRNAs>0)) ||
                 (isDNA && (nProteins+nRNAs>0)) ||
                 (isRNA && (nDNAs+nProteins>0))) {
        msg = '<b>Component types (protein,dna,rna) are not compatible.</b><p>' +
              'Make sure that all components of ensemble have the same type.';
      } else if ((nDNAs>1) || (nRNAs>1))
        msg = '<b>Nucleic acid ensembles with more than one molecule are not ' +
              'supported.</b><p> Please leave only one nucleic acid polymer in ' +
              'the list.';

    }

    return msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskModelPrepXYZ.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.modelprepxyz', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskModelPrepXYZ = TaskModelPrepXYZ;

}
