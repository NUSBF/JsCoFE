
/*
 *  =================================================================
 *
 *    27.08.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.ensembleprepxyz.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Ensemble Preparation from Coordinates Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 */

//
//  10.05.2020
//
//  THE POSSIBILITY OF CREATING ENESEMBLE WITHOUT SEQUENCE IS ELIMINATED.
//  IF SUCH POSSIBILITY IS NOT REQUESTED, REMOVE EXTRA '_NOSEQ_' ITEMS IN
//  THE PARAMETER SECTION, AND MAKE CORRESPONDING CHANGES IN THE REST OF THIS
//  FILE AND IN THE CORRESPONDING PYTHIN DRIVER.
//
//  WHEN SEQUENCE IS "UNKNOWN", A SUITABLE ONE MAY BE SUGGESTED BY THE
//  COORDINATE DATA USED IN THIS TASK. ** ADD SEQUENCE-FETCHING FUNCTION IN
//  COORDINATE UTILITIES TASK FOR THIS **



var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskEnsemblePrepXYZ()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskEnsemblePrepXYZ';
  this.name    = 'ensemble preparation (xyz)';
  this.setOName ( 'ensemble' );  // default output file name template
  this.title   = 'Prepare MR Ensemble from Coordinate Data';
  //this.helpURL = './html/jscofe_task_ensembleprepxyz.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':['protein']}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      /*
      tooltip     : 'Specify optional sequence to associate the resulting ' +
                    'model with. If no sequence is given, a void one will be ' +
                    'created for reference using the name of leading coordinate ' +
                    'set.',
      */
      tooltip     : 'Specify macromolecular sequence to be associated with the ' +
                    'resulting ensemble.',
      inputId     : 'seq',      // input Id for referencing input fields
      force       : 1,          // show no sequence by default if zero
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure','~substructure-am','!xyz'],
                     'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Specify coordinate sets to be merged in an ensamble for ' +
                    'further use in Molecular Replacement. Usually you will ' +
                    'choose homologous single chains of approximately equal ' +
                    'length. The resulting ensemble will be named after the ' +
                    'leading coordinat set.',
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'chain-sel-protein', // lay custom fields next to the selection
                                 // enforce protein chains because of using MrBump
                                 // for this task
      min         : 2,           // minimum acceptable number of data instances
      max         : 1000         // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    sec1 :  { type     : 'section',
              title    : 'Model modification',
              open     : true,  // true for the section to be initially open
              position : [0,0,1,5],
              contains : {

                MODIFICATION_SEQ_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Modification protocol:',
                        tooltip  : 'Choose trim option',
                        range    : [ 'U|Unmodified',
                                     'D|PDB Clip',
                                     'M|Molrep',
                                     'C|Chainsaw',
                                     'S|Sculptor',
                                     'P|Polyalanine'
                                   ],
                        value    : 'M',
                        showon   : { _:'&&', 'seq':[1], 'xyz':[1] },
                        position : [0,0,1,1]
                      },
                LEGEND_SEQ_U : {
                        type      : 'label',  // just a separator
                        label     : '<i>(models are not changed)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['U'] }
                      },
                LEGEND_SEQ_D : {
                        type      : 'label',  // just a separator
                        label     : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['D'] }
                      },
                LEGEND_SEQ_M : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Molrep)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['M'] }
                      },
                LEGEND_SEQ_C : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Chainsaw)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['C'] }
                      },
                LEGEND_SEQ_S : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Sculptor)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['S'] }
                      },
                LEGEND_SEQ_P : {
                        type      : 'label',  // just a separator
                        label     : '<i>(removal of all side chains)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'xyz':[1],'MODIFICATION_SEQ_SEL':['P'] }
                      },

                MODIFICATION_SEQ_MXYZ_SEL : {
                        type      : 'combobox',
                        keyword   : 'none',
                        label     : 'Modification protocol:',
                        tooltip   : 'Choose trim option',
                        range     : [ 'U|Unmodified',
                                      'D|PDB Clip',
                                      'M|Molrep',
                                      'P|Polyalanine'
                                    ],
                        value     : 'M',
                        showon    : { _:'&&', 'seq':[1] },
                        hideon    : { 'xyz':[1] },
                        position  : [0,0,1,1]
                      },
                LEGEND_SEQ_MXYZ_U : {
                        type      : 'label',  // just a separator
                        label     : '<i>(models are not changed)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_MXYZ_SEL':['U'] },
                        hideon    : { 'xyz':[1] }
                      },
                LEGEND_SEQ_MXYZ_D : {
                        type      : 'label',  // just a separator
                        label     : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_MXYZ_SEL':['D'] },
                        hideon    : { 'xyz':[1] }
                      },
                LEGEND_SEQ_MXYZ_M : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Molrep)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_MXYZ_SEL':['M'] },
                        hideon    : { 'xyz':[1] }
                      },
                LEGEND_SEQ_MXYZ_P : {
                        type      : 'label',  // just a separator
                        label     : '<i>(removal of all side chains)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_MXYZ_SEL':['P'] },
                        hideon    : { 'xyz':[1] }
                      },

                MODIFICATION_NOSEQ_SEL : {
                        type     : 'combobox',
                        keyword  : 'none',
                        label    : 'Modification protocol:',
                        tooltip  : 'Choose trim option',
                        range    : [ 'U|Unmodified',
                                     'D|PDB Clip',
                                     'P|Polyalanine'
                                   ],
                        value    : 'D',
                        hideon   : { 'seq':[1] },
                        position : [0,0,1,1]
                      },
                LEGEND_NOSEQ_U : {
                        type      : 'label',  // just a separator
                        label     : '<i>(models are not changed)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[0,-1],'MODIFICATION_NOSEQ_SEL':['U'] }
                      },
                LEGEND_NOSEQ_D : {
                        type      : 'label',  // just a separator
                        label     : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[0,-1],'MODIFICATION_NOSEQ_SEL':['D'] }
                      },
                LEGEND_NOSEQ_P : {
                        type      : 'label',  // just a separator
                        label     : '<i>(removal of all side chains)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[0,-1],'MODIFICATION_NOSEQ_SEL':['P'] }
                      }
              }
            }

  };

}

if (__template)
      TaskEnsemblePrepXYZ.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEnsemblePrepXYZ.prototype = Object.create ( TaskTemplate.prototype );
TaskEnsemblePrepXYZ.prototype.constructor = TaskEnsemblePrepXYZ;


// ===========================================================================

TaskEnsemblePrepXYZ.prototype.icon = function()  { return 'task_ensembleprepxyz'; }

TaskEnsemblePrepXYZ.prototype.desc_title = function()  {
// this appears under task title in the task list
  return 'make MR ensembles from atomic coordinates and sequence';
}

TaskEnsemblePrepXYZ.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {

  TaskEnsemblePrepXYZ.prototype.collectInput = function ( inputPanel )  {

    var msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    if (msg.length<=0)  {
      var seq       = this.input_data.getData ( 'seq' );
      var xyz       = this.input_data.getData ( 'xyz' );
      var nProteins = 0;
      var nDNAs     = 0;
      var nRNAs     = 0;
      var isProtein = false;
      var isDNA     = false;
      var isRNA     = false;
      var modSel = null;

      if (seq && (seq.length>0))  {
        isProtein = (seq[0].subtype.indexOf('protein')>=0);
        isDNA     = (seq[0].subtype.indexOf('dna')>=0);
        isRNA     = (seq[0].subtype.indexOf('rna')>=0);
        modSel = this.parameters.sec1.contains.MODIFICATION_SEQ_SEL.value;
      } else
        modSel = this.parameters.sec1.contains.MODIFICATION_NOSEQ_SEL.value;

      for (var i=0;i<xyz.length;i++)  {
        if (xyz[i].subtype.indexOf('protein')>=0)  nProteins++;
        if (xyz[i].subtype.indexOf('dna')>=0)      nDNAs++;
        if (xyz[i].subtype.indexOf('rna')>=0)      nRNAs++;
      }

      msg_list = [];

      if ((['U','D'].indexOf(modSel)<0) && ((nDNAs+nRNAs>0) || isDNA || isRNA))
        msg_list.push ( this.invalidParamMessage (
                  'incompatible modification protocol',
                  'making nucleic acid MR ensembles is possible only for ' +
                  '"Unmodified" and<br>"PDB Clip" modification protocols' ) );

      if ((isProtein && (nDNAs+nRNAs>0)) ||
          (isDNA && (nProteins+nRNAs>0)) ||
          (isRNA && (nDNAs+nProteins>0)) ||
          ((!isProtein) && (!isDNA) && (!isRNA) &&
           ((nProteins*nRNAs>0) || (nProteins*nDNAs>0) || (nDNAs*nRNAs>0)))
         )
        //msg = '<b>Component types (protein,dna,rna) are not compatible.</b><p>' +
        //      'Make sure that all components of ensemble have the same type.';
        msg_list.push ( this.invalidParamMessage (
            'component types (protein,dna,rna) are not compatible.',
            'Make sure that all components of ensemble have the same type.' ) );
      else if ((nDNAs>1) || (nRNAs>1))
        //msg = '<b>Nucleic acid ensembles with more than one molecule are not ' +
        //      'supported.</b><p> Please leave only one nucleic acid polymer in ' +
        //      'the list.';
        msg_list.push ( this.invalidParamMessage (
           'nucleic acid ensembles with more than one molecule are not supported.',
           'Please leave only one nucleic acid polymer in the list.' ) );

      if (msg_list.length>0)
        msg = msg_list.join('<br>');

    }

    return msg;

  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEnsemblePrepXYZ.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ensembleprepxyz', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEnsemblePrepXYZ = TaskEnsemblePrepXYZ;

}
