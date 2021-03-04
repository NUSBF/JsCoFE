
/*
 *  =================================================================
 *
 *    03.03.21   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.importseqcp.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  ImportSeqCP Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2020-2021
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskImportSeqCP()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type = 'TaskImportSeqCP';
  this.name  = 'import sequence';
  this.oname = 'sequence';
  this.title = 'Import Sequence(s) by Copy-Paste';

  this.parameters = { // input parameters

    SEQTYPE_SEL : {
          type     : 'combobox',
          //keyword  : 'TYPE',
          label    : '<b>Sequence type:</b>',
          tooltip  : 'Choose sequnce type',
          range    : ['none|[must be chosen]',
                      'protein|Protein',
                      'dna|DNA',
                      'rna|RNA'
                     ],
          value    : 'none',
          label2   : ' ',
          lwidth2  : 700,
          position : [0,0,1,1]
        },

    SEQUENCE_TA: {
          type        : 'textarea_',
          //keyword     : 'keyword',
          tooltip     : '',
          reportas    : 'Sequence(s)',
          placeholder : 'Copy-paste your sequence(s) here, including title line(s).\n\n' +
                        'More than one sequences of the same type (protein/dna/na)\n' +
                        'can be given one after another. Example:\n\n' +
                        '>rnase_A\n' +
                        'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGE\n' +
                        'ATQEDYYTGDHYATFSLIDQTC\n\n' +
                        '>1dtx_A\n' +
                        'QPRRKLCILHRNPGRCYDKIPAFYYNQKKKQCERFDWSGCGGNSNRFKTIEECRRTCIG',
          nrows       : 15,
          ncols       : 160,
          iwidth      : 800,
          value       : '',
          position    : [1,0,1,6]
        }

  };

}


if (__template)
      TaskImportSeqCP.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskImportSeqCP.prototype = Object.create ( TaskTemplate.prototype );
TaskImportSeqCP.prototype.constructor = TaskImportSeqCP;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskImportSeqCP.prototype.icon = function()  { return 'task_importseqcp'; }

TaskImportSeqCP.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

if (!__template)  {

  //  for client side

  TaskImportSeqCP.prototype.customDataClone = function ( cloneMode,task )  {
    this.uname = '';
    return;
  }

  TaskImportSeqCP.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var msg = []
    if (this.parameters.SEQTYPE_SEL.value=='none')
      msg.push ( 'Sequence type must be chosen' );

    var s = this.parameters.SEQUENCE_TA.value.trim()
    if (!s)
      msg.push ( 'Sequence data is not given' );
    else if (!startsWith(s,'>'))
      msg.push ( 'Sequence data is not valid' );

    if (msg.length>0)  {
      if (input_msg)
        input_msg += '<br>';
      input_msg += '<b>' + msg.join('</b><br><b>') + '</b>';
    }

    return input_msg;

  }

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskImportSeqCP.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.import_task', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskImportSeqCP = TaskImportSeqCP;

}
