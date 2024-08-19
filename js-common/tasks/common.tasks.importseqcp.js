
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev, M, Fando 2020-2024
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

function TaskImportSeqCP()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type     = 'TaskImportSeqCP';
  this.name      = 'import sequence';
  this.oname     = 'sequence';
  this.title     = 'Import Sequence(s) by Copy-Paste';
  this.fasttrack = true;  // enforces immediate execution

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

    // SEQUENCE_TA: {
    //       type        : 'textarea_',
    //       //keyword     : 'keyword',
    //       tooltip     : '',
    //       reportas    : 'Sequence(s)',
    //       placeholder : 'Copy-paste your sequence(s) here, including title line(s).\n\n' +
    //                     'More than one sequences of the same type (protein/dna/na)\n' +
    //                     'can be given one after another. Example:\n\n' +
    //                     '>rnase_A\n' +
    //                     'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGE\n' +
    //                     'ATQEDYYTGDHYATFSLIDQTC\n\n' +
    //                     '>1dtx_A\n' +
    //                     'QPRRKLCILHRNPGRCYDKIPAFYYNQKKKQCERFDWSGCGGNSNRFKTIEECRRTCIG',
    //       nrows       : 15,
    //       ncols       : 160,
    //       iwidth      : 800,
    //       value       : '',
    //       position    : [1,0,1,6]
    //     },

    SEQUENCE_TA: {
          type        : 'aceditor_',
          tooltip     : '',
          reportas    : 'Sequence(s)',
          value       : '',
          placeholder : '# Copy-paste your sequence(s) here, including title line(s).\n\n' +
                        '# Several sequences of the same type (protein/dna/na) can be\n' +
                        '# given one after another. Example:\n\n' +
                        '>rnase_A\n' +
                        'DVSGTVCLSALPPEATDTLNLIASDGPFPYSQDGVVFQNRESVLPTQSYGYYHEYTVITPGARTRGTRRIICGE\n' +
                        'ATQEDYYTGDHYATFSLIDQTC\n\n' +
                        '>1dtx_A\n' +
                        'QPRRKLCILHRNPGRCYDKIPAFYYNQKKKQCERFDWSGCGGNSNRFKTIEECRRTCIG',
          iwidth      : 700,
          iheight     : 240,
          position    : [1,0,1,6]
        }  

  };

}

if (__template)
  __cmd.registerClass ( 'TaskImportSeqCP',TaskImportSeqCP,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskImportSeqCP',TaskImportSeqCP,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskImportSeqCP.prototype.icon           = function()  { return 'task_importseqcp';  }
TaskImportSeqCP.prototype.clipboard_name = function()  { return '"Import Sequence"'; }

TaskImportSeqCP.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskImportSeqCP.prototype.checkKeywords = function ( keywords )  {
  // keywords supposed to be in low register
  return this.__check_keywords ( keywords,['import', 'sequence','copy', 'paste','copypaste','copy-paste'] );
}


if (!__template)  {

  //  for client side

  TaskImportSeqCP.prototype.desc_title = function()  {
    // this appears under task title in the task list
      return 'imports sequence copy-pasted from other web pages';
    };

  TaskImportSeqCP.prototype.customDataClone = function ( cloneMode,task )  {
    this.uname = '';
    return;
  }

  TaskImportSeqCP.prototype.collectInput = function ( inputPanel )  {

    var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    var msg = [];
    if (this.parameters.SEQTYPE_SEL.value=='none')
      msg.push ( 'Sequence type must be chosen' );

    var s = this.parameters.SEQUENCE_TA.value.trim();
    var slst = s.split(/\r?\n/);
    s = '';
    for (var i=0;i<slst.length;i++)  {
      var p = slst[i].indexOf('#');
      if (p>=0)  s += slst[i].substring(0,p);
           else  s += '\n' + slst[i];
    }
    s = s.trim();

    if (!s)
      msg.push ( 'Sequence data is not given' );
    else if (!startsWith(s,'>'))
      msg.push ( 'Sequence data format is not valid' );

    if (msg.length>0)  {
      input_msg += '|<b>' + msg.join('</b><br><b>') + '</b>';
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
