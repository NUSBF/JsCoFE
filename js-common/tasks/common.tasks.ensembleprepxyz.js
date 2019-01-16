
/*
 *  =================================================================
 *
 *    13.01.19   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */

/*
 * jsCoFE: Javascript-powered Cloud Front End
 *
 *  Client and Server-side code:  Ensemble from Coordinates Interface.
 *
 *  Copyright (C)  Eugene Krissinel 2017
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskEnsemblePrepXYZ()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskEnsemblePrepXYZ';
  this.name    = 'ensemble preparation (xyz)';
  this.oname   = '';  // default output file name template
  this.title   = 'Ensemble Preparation for MR from Coordinates';
  this.helpURL = './html/jscofe_task_ensembleprepxyz.html';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataSequence':[]}, // data type(s) and subtype(s)
      label       : 'Sequence',          // label for input dialog
      tooltip     : 'Specify optional sequence to associate the resulting ' +
                    'model with. If no sequence is given, a void one will be ' +
                    'created for reference using the name of leading coordinate ' +
                    'set.',
      inputId     : 'seq',      // input Id for referencing input fields
      force       : 1,          // show no sequence by default if zero
      min         : 0,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataStructure':['~substructure','~substructure-am'],
                     'DataXYZ':[]},  // data type(s) and subtype(s)
      label       : 'Coordinates',   // label for input dialog
      tooltip     : 'Specify coordinate sets to be merged in an ensamble for ' +
                    'further use in Molecular Replacement. Usually you will ' +
                    'choose homologous single chains of approximately equal ' +
                    'length. The resulting ensemble will be named after the ' +
                    'leading coordinat set.',
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'chain-sel', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1000         // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters

    sec1 :  {  type     : 'section',
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
                        showon   : { 'seq':[1] },
                        position : [0,0,1,1]
                      },
                LEGEND_SEQ_U : {
                        type      : 'label',  // just a separator
                        label     : '<i>(models are not changed)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_SEL':['U'] }
                      },
                LEGEND_SEQ_D : {
                        type      : 'label',  // just a separator
                        label     : '<i>(remove solvent, hydrogens, and select most probable conformations)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_SEL':['D'] }
                      },
                LEGEND_SEQ_M : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Molrep)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_SEL':['M'] }
                      },
                LEGEND_SEQ_C : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Chainsaw)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_SEL':['C'] }
                      },
                LEGEND_SEQ_S : {
                        type      : 'label',  // just a separator
                        label     : '<i>(side chain truncation based on Sculptor)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_SEL':['S'] }
                      },
                LEGEND_SEQ_P : {
                        type      : 'label',  // just a separator
                        label     : '<i>(removal of all side chains)</i>',
                        position  : [0,3,1,1],
                        showon    : { _:'&&','seq':[1],'MODIFICATION_SEQ_SEL':['P'] }
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
            },

    sec2 :  { type     : 'section',
              title    : 'Ensembler parameters',
              open     : false,  // true for the section to be initially open
              position : [1,0,1,5],
              hideon   : {'xyz':[-1,0,1]},
              contains : {
                SUPERPOSITION_SEL : {
                        type     : 'combobox',
                        keyword  : 'SUPERPOSITION',
                        label    : 'Superposition method',
                        tooltip  : 'Choose superposition method',
                        range    : ['gapless|gapless','gapped|gapped'],
                        value    : 'gapless',
                        position : [0,0,1,1]
                      },
                MAPPING_SEL : {
                        type     : 'combobox',
                        keyword  : 'MAPPING',
                        label    : 'Mapping method',
                        tooltip  : 'Choose mapping method',
                        range    : ['ssm|SSM',
                                    //'alignments|alignments',
                                    'resid|residue Id'
                                    //'multiple_alignment|multiple alignment'
                                  ],
                        value    : 'ssm',
                        position : [1,0,1,1]
                      },
                WEIGHTING_SEL : {
                        type     : 'combobox',
                        keyword  : 'WEIGHTING',
                        label    : 'Weighting scheme',
                        tooltip  : 'Choose weighting scheme',
                        range    : ['unit|unit','robust_resistant|robust resistant'],
                        value    : 'robust_resistant',
                        position : [2,0,1,1]
                      },
                RRCRITICAL : {
                        type     : 'real',
                        keyword  : 'RRCRITICAL',
                        label    : 'critical value',
                        reportas : 'robust-resistant critical value', // to use in error reports
                                                                      // instead of 'label'
                        tooltip  : 'Choose a value between 0 and 50',
                        range    : [0,50],
                        value    : 9,
                        position : [2,3,1,1],
                        align    : 'right',
                        showon   : {'WEIGHTING_SEL':['robust_resistant']}
                      },
                TRIM_SEL : {
                        type     : 'combobox',
                        keyword  : 'TRIM',
                        label    : 'Trim ensemble',
                        tooltip  : 'Choose trim option',
                        range    : ['1|yes','0|no'],
                        value    : '1',
                        position : [3,0,1,1]
                      },
                TTHRESH : {
                        type     : 'real',
                        keyword  : 'TTHRESH',
                        label    : 'threshold',
                        tooltip  : 'Choose a value between 0 and 10',
                        range    : [0,10],
                        value    : 3,
                        position : [3,3,1,1],
                        align    : 'right',
                        showon   : {'TRIM_SEL':['1']}
                      }
              }
            },

    sec3 :  { type     : 'section',
              title    : 'Ensembler Configuration',
              open     : false,  // true for the section to be initially open
              position : [2,0,1,5],
              hideon   : {'xyz':[-1,0,1]},
              contains : {
                SUPCONV : {
                       type     : 'real',
                       keyword  : 'SUPCONV',
                       label    : 'Superposition convergence',
                       tooltip  : 'Choose a value between 1.0e-6 and 0.1',
                       range    : [0.000001,0.1],
                       value    : 0.0001,
                       position : [1,0,1,1]
                     },
                WEIGHTCONV : {
                       type     : 'real',
                       keyword  : 'WEIGHTCONV',
                       label    : 'Superposition convergence',
                       tooltip  : 'Choose a value between 1.0e-5 and 0.1',
                       range    : [0.00001,0.1],
                       value    : 0.001,
                       position : [2,0,1,1]
                     },
                WEIGHTDFACTOR : {
                       type     : 'real',
                       keyword  : 'WEIGHTDFACTOR',
                       label    : 'Weighting incremental damping factor',
                       tooltip  : 'Choose a value between 1 and 10',
                       range    : [1,10],
                       value    : 1.5,
                       position : [3,0,1,1]
                     },
                WEIGHTMAXDFACTOR : {
                       type     : 'real',
                       keyword  : 'WEIGHTMAXDFACTOR',
                       label    : 'Weighting maximal damping factor',
                       tooltip  : 'Choose a value between 1 and 10',
                       range    : [1,10],
                       value    : 3.34,
                       position : [4,0,1,1]
                     },
                CLUSTDIST : {
                       type     : 'real',
                       keyword  : 'CLUSTDIST',
                       label    : 'Clustering distance',
                       tooltip  : 'Choose a value between 0 and 5',
                       range    : [0,5],
                       value    : 0.5,
                       position : [5,0,1,1]
                     },
                ATOMNAMES : {
                       type      : 'string',   // empty string not allowed
                       keyword   : 'ATOMNAMES',
                       label     : 'Atom name(s)',
                       tooltip   : 'Comma-separated list of atom names',
                       value     : 'CA',
                       iwidth    : 150,
                       maxlength : 200,       // maximum input length
                       position  : [6,0,1,1]
                     }

              }
            }

  }

}

if (__template)
      TaskEnsemblePrepXYZ.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskEnsemblePrepXYZ.prototype = Object.create ( TaskTemplate.prototype );
TaskEnsemblePrepXYZ.prototype.constructor = TaskEnsemblePrepXYZ;


// ===========================================================================

TaskEnsemblePrepXYZ.prototype.icon = function()  { return 'task_ensembleprepxyz'; }

//TaskEnsemblePrepXYZ.prototype.icon_small = function()  { return 'task_ensembleprepxyz_20x20'; }
//TaskEnsemblePrepXYZ.prototype.icon_large = function()  { return 'task_ensembleprepxyz';       }

TaskEnsemblePrepXYZ.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// export such that it could be used in both node and a browser

if (!__template)  {

  /*
  TaskEnsemblePrepXYZ.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    if ((emitterId=='hkl') && (this.state==job_code.new))  {

      var name = this.name;
      if (emitterValue<=0)  {
        this.name  = 'mrbump-search';
        this.title = 'Search for MR Models with MrBump';
      } else  {
        this.name  = 'mrbump';
        this.title = 'MrBump Automated Molecular Replacement';
      }

      if (this.name!=name)  {
        var inputPanel = inpParamRef.grid.parent.parent;
        inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
        this.updateInputPanel ( inputPanel );
      }

    }

  }

  TaskEnsemblePrepXYZ.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }
  */

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

      if (seq && (seq.length>0))  {
        isProtein = (seq[0].subtype.indexOf('protein')>=0);
        isDNA     = (seq[0].subtype.indexOf('dna')>=0);
        isRNA     = (seq[0].subtype.indexOf('rna')>=0);
      }

      for (var i=0;i<xyz.length;i++)  {
        if (xyz[i].subtype.indexOf('protein')>=0)  nProteins++;
        if (xyz[i].subtype.indexOf('dna')>=0)      nDNAs++;
        if (xyz[i].subtype.indexOf('rna')>=0)      nRNAs++;
      }

      if ((isProtein && (nDNAs+nRNAs>0)) ||
          (isDNA && (nProteins+nRNAs>0)) ||
          (isRNA && (nDNAs+nProteins>0)))
        msg = '<b>Component types (protein,dna,rna) are not compatible.</b><p>' +
              'Make sure that all components of ensemble have the same type.';
      else if ((nDNAs>1) || (nRNAs>1))
        msg = '<b>Nucleic acid ensembles with more than one molecule are not ' +
              'supported.</b><p> Please leave only one nucleic acid polymer in ' +
              'the list.';

    }

    return msg;

  }


} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskEnsemblePrepXYZ.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.ensembleprepxyz', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskEnsemblePrepXYZ = TaskEnsemblePrepXYZ;

}
