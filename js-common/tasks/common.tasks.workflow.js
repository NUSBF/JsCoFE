
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.workflow.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Generic Workflow Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2023-2024
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

function TaskWorkflow()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type  = 'TaskWorkflow';
  this.name   = 'Workflow';
  this.setOName ( 'workflow' );  // default output file name template
  this.title  = 'Workflow';

  this.icon_name       = 'workflow_aqua';
  this.task_desc       = 'custom workflow';
  this.search_keywords = ['workflow'];

  this.script          = [];  // script to execute
  this.script_pointer  = 0;   // current script line

  this.input_ligands   = [{ 'source':'none', 'smiles':'', 'code':'' }];

  // this.parseWorkflowScript ( workflowDesc.script );

}

if (__template)
      TaskWorkflow.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskWorkflow.prototype = Object.create ( TaskTemplate.prototype );
TaskWorkflow.prototype.constructor = TaskWorkflow;


// ===========================================================================

TaskWorkflow.prototype.setWorkflow = function ( workflowDesc )  {
//
//  workflowDesc = { id: workflow_id, script: workflow_script }
//

  this.autoRunId = workflowDesc.id;
  this.script    = workflowDesc.script.trim().split ( /\r?\n/ );

  this.file_select   = [];
  this.input_ligands = [];
  this.input_dtypes  = [];
  this.parameters    = {};

  let version = '1.0';

  let allow_upload = (workflowDesc.script.toUpperCase().indexOf('ALLOW_UPLOAD')>=0);

  let prow  = 0;
  let pitem = null;
  this.addParameter = function ( name,type )  {
    if (!pitem)  {
      this.parameters = { // input parameters
        sec1  : { type     : 'section',
                  title    : 'Parameters',
                  open     : true,  // true for the section to be initially open
                  position : [0,0,1,8],
                  contains : {}
                }
      };
    }
    pitem = {
      type      : type,
      label     : '',
      tooltip   : '',
      value     : '',
      position  : [prow++,0,1,1]
    };
    this.parameters.sec1.contains[name] = pitem;
  }

  let done  = false;
  for (let i=0;(i<this.script.length) && (!done);i++)  {
    
    let line  = this.script[i].trim();
    this.script[i] = line;
    let ihash = line.indexOf('#');
    if (ihash>=0)  // remove comment
      line = line.slice ( 0,ihash );
    line = line.trim();

    if (line.length>0)  {
      
      let words = line.split(' ').filter(Boolean);
      let word0 = words[0].toUpperCase();
      switch (word0)  {
        
        case 'VERSION'  : if (words.length>1)
                            version = words[1];
                        break;

        case 'NAME'     : this.name      = words.slice(1).join(' ');  break;
        case 'ONAME'    : this.setOName  ( words[1] );                break;
        case 'TITLE'    : this.title     = words.slice(1).join(' ');  break;
        case 'DESC'     : this.task_desc = words.slice(1).join(' ');  break;
        case 'KEYWORDS' : this.search_keywords = words.slice(1);      break;
        case 'ICON'     : this.icon_name = 'workflow_' + words[1].toLowerCase();
                        break;

        case '!DATA'    : // means the data is mandatory
        case 'DATA'     : let dtype = {        // input data type
                            data_type   : {},  // data type(s) and subtype(s)
                            label       : '',  // label for input dialog
                            inputId     : '',  // input Id for referencing input fields
                            version     : 0,   // minimum data version allowed
                            min         : 0,   // minimum acceptable number of data instances
                            max         : 1    // maximum acceptable number of data instances
                          };
                          if (word0=='!DATA')  // mandatory data item
                            dtype.min = 1;
                          let sec  = words.slice(1).join(' ').toUpperCase().split('TYPES');
                          let dsec = sec[0].split(' ').filter(Boolean);
                          let tsec = [];
                          if (sec.length>1)
                            tsec = sec[1].toLowerCase().split(' ').filter(Boolean);
                          for (let j=0;j<dsec.length;j++)  {
                            dtype.inputId = dsec[j].toLowerCase();
                            switch (dsec[j])  {
                              case 'HKL'      : dtype.data_type.DataHKL = tsec;
                                                dtype.label   = 'Reflection data';
                                            break;
                              case 'UNMERGED' : dtype.data_type.DataUnmerged = [];
                                                dtype.label   = 'Reflection data';
                                                dtype.inputId = 'hkl';  // special case
                                            break;
                              case 'XYZ'      : dtype.data_type.DataXYZ = tsec;
                                                dtype.label   = 'Template structure';
                                            break;
                              case 'SEQ'      : dtype.data_type.DataSequence = tsec;
                                                dtype.label   = 'Sequence';
                                                dtype.tooltip = 'Macromolecular ' +
                                                        'sequence expected in ASU.';
                                            break;
                              case 'LIBRARY'  : dtype.data_type.DataLibrary = [];
                                                dtype.label   = 'Ligand library';
                                                dtype.tooltip = 'Library of ligands '+
                                                        'found in template structure.';
                                                dtype.max     = 1; // this.input_ligands.length;
                                            break;
                              case 'LIGAND'   : dtype.data_type.DataLigand = [];
                                                dtype.label   = 'Ligand description';
                                                dtype.tooltip = 'Specify ligand to '+
                                                        'be fit in electron density.';
                                                dtype.max     = 1; // this.input_ligands.length;
                                            break;
                              default : ;
                            }
                          }
                          // console.log ( " >>>> " + JSON.stringify(dtype) );
                          this.input_dtypes.push ( dtype );
                          if (allow_upload)  {
                            let fdesc = {
                              file_types  : '',  // data type(s) and subtype(s)
                              label       : dtype.label, // label for input dialog
                              tooltip     : '',
                              inputId     : 'f' + dtype.inputId, // input Id for referencing input fields
                              path        : '',
                              min         : dtype.min  // minimum acceptable number of data instances
                            };
                            switch (dtype.inputId)  {
                              case 'hkl' :
                                  fdesc.file_types  = '.mtz,.sca';
                                  fdesc.tooltip     = 'Provide path to MTZ file ' +
                                          'with merged or unmerged reflections.';
                                  fdesc.annotate    = false;
                                break;
                              case 'xyz' : 
                                  fdesc.file_types  = '.pdb,.mmcif';
                                  fdesc.tooltip     = 'Provide path to PDB/mmCIF '+
                                          'file with a template structure';
                                break;
                              case 'seq' : 
                                  fdesc.file_types  = '.pir,.seq,.fasta';
                                  fdesc.tooltip     = 'Provide path to sequence ' +
                                          'file in .fasta or .pir format. For importing ' +
                                          'several sequences put them all in a ' +
                                          'single file.';
                                break;
                              case 'library' : 
                                  fdesc.file_types  = '.lib,.cif';
                                  fdesc.tooltip     = 'Provide path to CIF or LIB file ' +
                                          'with definition of ligand found in the ' +
                                          'template structure.';
                                break;
                              case 'ligand' : 
                                  this.input_ligands = [{ 'source':'none', 'smiles':'', 'code':'' }];
                                break;
                              default : ;
                            }
                            if (fdesc.file_types)
                              this.file_select.push ( fdesc );
                          }
                        break;

        case '!PAR_INTEGER' :
        case 'PAR_INTEGER' : if (words.length>1)  {
                            this.addParameter ( words[1],'integer_' );
                            pitem.range = ['*','*'];
                            if (word0.startsWith('!'))
                              pitem.type = 'integer';
                          }
                        break;
                  
        case '!PAR_REAL' :
        case 'PAR_REAL' : if (words.length>1)  {
                            this.addParameter ( words[1],'real_' );
                            pitem.range = ['*','*'];
                            if (word0.startsWith('!'))
                              pitem.type = 'real';
                          }
                        break;

        case '!PAR_STRING' :
        case 'PAR_STRING' : if (words.length>1)  {
                              this.addParameter ( words[1],'string_' );
                              if (word0.startsWith('!'))
                                pitem.type = 'string';
                            }
                        break;

        case 'PAR_CHECK' :  if (words.length>1)  {
                              this.addParameter ( words[1],'checkbox' );
                              pitem.position[3] = 5;
                            }
                        break;

        case 'PAR_COMBO' :  if (words.length>1)  {
                              this.addParameter ( words[1],'combobox' );
                              pitem.range = [];
                            }
                        break;

        case 'LABEL'   :  if (pitem)
                            pitem.label   = words.slice(1).join(' ');
                        break;
        case 'TOOLTIP' :  if (pitem)
                            pitem.tooltip = words.slice(1).join(' ');
                        break;
        case 'OPTION'  :  if ((pitem.type=='combobox') && (words.length>2))
                            pitem.range.push ( words[1] + '|' + words.slice(2).join(' ') )
                        break;
        case 'MAXLENGTH': if (pitem)
                            pitem.maxlength = words[1];
                        break;
        case 'IWIDTH'  :  if (pitem)
                            pitem.iwidth = words[1];
                        break;
        case 'RANGE'   :  if (pitem && (words.length>2))  {
                            if (words[1]=='*')
                              pitem.range = ['*'];
                            else if (pitem.type.startsWith('real'))
                              pitem.range = [parseFloat(words[1])];
                            if (words[2]=='*')
                              pitem.range.push ( '*' );
                            else if (pitem.type.startsWith('real'))
                              pitem.range.push ( parseFloat(words[2]) );
                          }
                        break;
        case 'DEFAULT' :  if (pitem && (words.length>1))  {
                            if (pitem.type.startsWith('real'))  {
                              pitem.default = parseFloat(words[1])
                              if (pitem.type=='real')
                                pitem.value = pitem.default;
                            } else if (pitem.type=='checkbox')  {
                              pitem.value = (words[1].toUpperCase()=='CHECKED');
                            } else if (pitem.type=='combobox')  {
                              pitem.value = words[1];
                            }
                          }
                        break;

        case 'PRINT_VAR':
        case 'LET'      : done = true;  
                        break;
      
        default         : done = word0.startsWith('@');
      
      }
    
    }
  
  }

}

TaskWorkflow.prototype.icon           = function()  { return this.icon_name;   }
TaskWorkflow.prototype.clipboard_name = function()  { return this.autoRunId;   }

TaskWorkflow.prototype.desc_title     = function()  { return this.task_desc;   }

//TaskWorkflow.prototype.canRunInAutoMode = function() { return true; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
//TaskWorkflow.prototype.platforms = function()  { return 'LMU'; }  // UNIX only

TaskWorkflow.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskWorkflow.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,this.search_keywords );
}

// export such that it could be used in both node and a browser
if (!__template)  {
  // for client side

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskWorkflow.prototype.customDataClone = function ( cloneMode,task )  {
    this.autoRunId0 = '';   // for Job Dialog
    this.setWorkflow ({
      id     : task.autoRunId,
      script : task.script.join('\n')
    });
  }

  // reserved function name
  //TaskWorkflow.prototype.runButtonName = function()  { return 'Import'; }

} else  {
  // for server side

  var conf = require('../../js-server/server.configuration');

  TaskWorkflow.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.workflow', jobManager, jobDir, this.id];
  }

  module.exports.TaskWorkflow = TaskWorkflow;

}
