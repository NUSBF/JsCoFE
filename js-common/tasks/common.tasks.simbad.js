
/*
 *  =================================================================
 *
 *    07.02.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.simbad.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  SIMBAD Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, Oleg Kovalevskyi, M. Fando 2016-2025
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

function TaskSimbad()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSimbad';
  this.name    = 'simbad';
  this.setOName ( 'simbad' );  // default output file name template
  this.title   = 'Lattice and Contaminants Search with Simbad'; // changes on input
  //this.helpURL = './html/jscofe_task_simbad.html';

  this.input_dtypes = [{    // input data types
     data_type   : {'DataRevision'  : ['!asu','~xyz'],
                    'DataHKL'       : [],
                    'DataStructure' : ['~mmcif_only'],
                    'DataXYZ'       : ['~mmcif_only']
                   },  // data type(s) and subtype(s)
     label       : 'ASU, reflection data or<br>symmetry reference', // label for input dialog
     inputId     : 'idata',   // input Id for referencing input fields
     customInput : 'simbad',
     // customInput : 'cell-info',
     force       : 1,         // force selection in combobox
     min         : 0,         // minimum acceptable number of data instances
     max         : 1          // maximum acceptable number of data instances
   }
  ];

  this.parameters = { // input parameters

    /*
    SEP0_LABEL : {
              type     : 'label',  // just a separator
              label    : '&nbsp;',
              position : [0,0,1,5]
           },
    */

    sec0 : {  type     : 'section',
              title    : '',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
              showon   : { 'idata' : [0,-1] },
              contains : {
                SPGROUP : {
                          type      : 'string',   // empty string not allowed
                          keyword   : 'none',
                          label     : '<b><i>Space group</i></b>',
                          reportas  : 'Space group',
                          tooltip   : 'Space group',
                          iwidth    : 200,
                          value     : '',
                          placeholder : 'e.g. P 21 21 21',
                          maxlength : 20,
                          position  : [0,0,1,7]
                       },

                CELL_A  : { type     : 'real',
                            keyword  : 'none',
                            label    : '<b><i>Cell (a,b,c&nbsp;-&nbsp;&alpha;,&beta;,&gamma;):</i></b>',
                            reportas : 'Cell parameter "a"',
                            tooltip  : 'Cell parameters to search for.',
                            range    : [0.001,10000.0],
                            value    : '',
                            iwidth   : 60,
                            //default  : '70',
                            position : [1,0,1,1],
                       },
                CELL_B  : { type     : 'real',
                            keyword  : 'none',
                            label    : '',
                            tooltip  : 'Cell parameters to search for.',
                            reportas : 'Cell parameter "b"',
                            range    : [0.001,10000.0],
                            value    : '',
                            iwidth   : 60,
                            //default  : '70',
                            position : [1,2,1,1]
                       },
                CELL_C  : { type     : 'real',
                            keyword  : 'none',
                            label    : '',
                            reportas : 'Cell parameter "c"',
                            tooltip  : 'Cell parameters to search for.',
                            range    : [0.001,10000.0],
                            value    : '',
                            iwidth   : 60,
                            //default  : '70',
                            position : [1,4,1,1]
                       },
                CELL_ALPHA : { type     : 'real',
                            keyword  : 'none',
                            label    : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>&mdash;</b>&nbsp;',
                            reportas : 'Cell parameter "&alpha;"',
                            tooltip  : 'Cell parameters to search for.',
                            range    : [0.001,10000.0],
                            value    : '',
                            iwidth   : 60,
                            //default  : '70',
                            position : [1,7,1,1]
                       },
                CELL_BETA : { type     : 'real',
                            keyword  : 'none',
                            label    : '',
                            reportas : 'Cell parameter "&beta;"',
                            tooltip  : 'Cell parameters to search for.',
                            range    : [0.001,10000.0],
                            value    : '',
                            iwidth   : 60,
                            //default  : '70',
                            position : [1,9,1,1]
                        },
                CELL_GAMMA : { type     : 'real',
                            keyword  : 'none',
                            label    : '',
                            reportas : 'Cell parameter "&gamma;"',
                            tooltip  : 'Cell parameters to search for.',
                            range    : [0.001,10000.0],
                            value    : '',
                            iwidth   : 60,
                            //default  : '70',
                            position : [1,11,1,1]
                        },
              }
            },

    sec1 : {  type     : 'section',
              title    : 'Search level',
              open     : true,  // true for the section to be initially open
              position : [2,0,1,5],
              contains : {
                SEARCH_SEL : {
                      type      : 'combobox',  // the real keyword for job input stream
                      keyword   : 'search',
                      label     : 'Search level',
                      tooltip   : 'Choose the desirable search level. Lattice search ' +
                                  'is very quick; contaminants search may take up to ' +
                                  'an hour; structural search is comprehensive and ' +
                                  'long',
                      //iwidth   : 220,      // width of input field in px
                      range     : ['L|Lattice',
                                   'C|Contaminants',
                                   'S|Structural database',
                                   'LC|Lattice and contaminants',
                                   'LCS|Lattice, contaminants and structural database'
                                  ],
                      value     : 'LC',
                      emitting  : true,    // allow to emit signals on change
                      position  : [0,0,1,1],
                      showon    : { _:'||',
                                   'idata.type:DataHKL':[1],
                                   'idata.type:DataRevision':[1]
                                  }   // from input data section
                    },
                WARNING_LBL : {
                      type      : 'label',
                      label     : '<i><b>Note:</b> this search level takes ' +
                                  'significant computational resources and may ' +
                                  'have adverse effect on your monthly quota.</i>',
                      position  : [1,2,1,5],
                      showon    : { SEARCH_SEL : ['S','LCS'] }
                    },
                // SGALL : {
                //       type      : 'combobox',  // the real keyword for job input stream
                //       keyword   : 'sga',
                //       label     : 'Try space group(s)',
                //       tooltip   : 'Search all space groups or enantiomorphs only ',
                //       range     : ['N|None',
                //                    'A|All',
                //                    'E|Enantiomorphs'
                //                   ],
                //       value     : 'N',
                //       emitting  : false,    // allow to emit signals on change
                //       position  : [2,0,1,1],
                //     },
                MAXNLATTICES  : {
                      type     : 'integer_',
                      keyword  : 'none',
                      label    : 'Maximum number of candidates',
                      tooltip  : 'Maximum number of candidate lattices to select ' +
                                 'and explore. The higher the number, the slower the ' +
                                 'search.',
                      range    : [1,100],
                      value    : '',
                      default  : '5',
                      position : [2,0,1,1],
                      showon   : { _:'||',
                                   'SEARCH_SEL':['L','LC'],
                                   'idata':[0,-1],
                                   'idata.type:DataXYZ':[1]
                                 }
                    },
                MAXPENALTY : {
                      type     : 'integer_',
                      keyword  : 'none',
                      label    : 'Maximum penalty score',
                      tooltip  : 'Maximum penalty score for selected candidate ' +
                                 'lattices. The higher the score, the slower the ' +
                                 'search.',
                      range    : [0,12],
                      value    : '',
                      default  : '4',
                      position : [3,0,1,1],
                      showon   : { _:'||',
                                   'SEARCH_SEL':['L','LC'],
                                   'idata':[0,-1],
                                   'idata.type:DataXYZ':[1]
                                 }
                    }
              }
            }

    // sec2 : {  type     : 'section',
    //           title    : 'Advanced parameters',
    //           open     : false,  // true for the section to be initially open
    //           position : [3,0,1,5],
    //           showon   : { SEARCH_SEL : ['S','LCS'] },
    //           contains : {
    //             RFPROGRAM_SEL : {
    //                   type      : 'combobox',  // the real keyword for job input stream
    //                   keyword   : 'rfprogram',
    //                   label     : 'Perform RF calculations with',
    //                   tooltip   : 'Program to use for Rotation Function calculations. ' +
    //                               'AMoRE is faster and may be preferential for searching ' +
    //                               'structure database. Phaser may find more hits in ' +
    //                               'border cases.',
    //                   //iwidth   : 220,      // width of input field in px
    //                   range     : ['amore|AMoRE',
    //                                'phaser|Phaser'
    //                               ],
    //                   value     : 'amore',
    //                   position  : [0,0,1,1]
    //                 }
    //           }
    //         }

  };

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskSimbad',TaskSimbad,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskSimbad',TaskSimbad,TaskTemplate.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskSimbad.prototype.icon           = function()  { return 'task_simbad'; }
TaskSimbad.prototype.clipboard_name = function()  { return '"Simbad"';    }
TaskSimbad.prototype.canRunRemotely = function()  { return true;          }

TaskSimbad.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'finds structural homologs by matching the dataset properties and performs MR';
}

TaskSimbad.prototype.currentVersion = function()  {
  let version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskSimbad.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,[
                'simbad', 'lattice', 'molecular','replacement','mr','auto','auto-mr',
                'model','contaminant','search'
              ] );
}

if (!__template)  {
//  for client side

  TaskSimbad.prototype.changeTitle = function ( newTitle,inpParamRef )  {
    if (newTitle!=this.title)  {
      this.title = newTitle;
      let inputPanel = inpParamRef.grid.parent.parent;
      inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
      this.updateInputPanel ( inputPanel );
    }
  }

  TaskSimbad.prototype.searchSelTitle = function ( selValue,inpParamRef )  {
    switch (selValue)  {
      case 'C'   : this.changeTitle ( 'Contaminants Search with Simbad',inpParamRef );
                break;
      case 'S'   : this.changeTitle ( 'Structure Search with Simbad',inpParamRef );
                break;
      case 'LC'  : this.changeTitle ( 'Lattice and Contaminants Search with Simbad',inpParamRef );
                break;
      case 'LC'  : this.changeTitle ( 'Lattice, Contaminants and Structure Search with Simbad',
                                       inpParamRef );
                break;
      case 'L'   :
      default    : this.changeTitle ( 'Lattice Search with Simbad',inpParamRef );
    }
  }

  TaskSimbad.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    if (emitterId=='idata')  {

      let inpDataRef = inpParamRef.grid.inpDataRef;
      let hkl        = this.getInputData ( inpDataRef,'idata' );
      if (hkl && (hkl.length>0))  {
        if (hkl[0]._type=='DataHKL')
          this.searchSelTitle ( inpParamRef.parameters['SEARCH_SEL'].input.getValue(),
                                inpParamRef );
        else
          this.changeTitle ( 'Lattice Search with Simbad',inpParamRef );
      } else
        this.changeTitle ( 'Lattice Search with Simbad',inpParamRef );

    } else if (emitterId=='SEARCH_SEL')
      this.searchSelTitle ( emitterValue,inpParamRef );

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }


  TaskSimbad.prototype.collectInput = function ( inputPanel )  {

    let msg   = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
    let idata = this.input_data.getData ( 'idata' );
    if (idata.length>0)  {
      msg = '';  // manual input of cell parameters is not used
      let hkl = idata[0];
      if (idata[0]._type=='DataRevision')
        hkl = idata[0].HKL;
      if (hkl._type!='DataHKL')  {
        if (hkl.getSpaceGroup()=='Unspecified')
          msg += '|<b><i>Space group undefined</i></b>';
        if (hkl.getCellParametersHTML()=='Unspecified')
          msg += '|<b><i>Cell parameters undefined</i></b>';
      }
    }

    return msg;

  }

  TaskSimbad.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      let event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }


} else  {
  //  for server side

  const path  = require('path');
  const fs    = require('fs-extra');
  const conf  = require('../../js-server/server.configuration');
  const utils = require('../../js-server/server.utils');

  TaskSimbad.prototype.getNCores = function ( ncores_available )  {
  // This function should return the number of cores, up to ncores_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns threds or processes bypassing the queuing system.
  // It is expected that the task will not utilise more cores than what is
  // given on input to this function.
    return ncores_available;
  }


  TaskSimbad.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl data in input databox for copying their files in
    // job's 'input' directory

    if (('idata' in this.input_data.data) &&
        (this.input_data.data['idata'][0]._type=='DataRevision'))  {
      // let revision = this.input_data.data['idata'][0];
      this.input_data.data['hkl'] = [this.input_data.data['idata'][0].HKL];
      // this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }


  TaskSimbad.prototype.cleanJobDir = function ( jobDir )  {

    __template.TaskTemplate.prototype.cleanJobDir.call ( this,jobDir );

    if ((this.state==__template.job_code.stopped) ||
        (this.state==__template.job_code.failed))  {

      fs.readdirSync(jobDir).forEach(function(file,index){
        if (([ __template.jobDataFName,    __template.jobReportDirName,
               __template.jobInputDirName, __template.jobOutputDirName,
               'output_files', 'signal', 'rvapi_document',
               'references.bib', '_job.stde', '_job.stdo' ].indexOf(file)<0) &&
            (!file.endsWith('.log')) && (!file.endsWith('.meta')) &&
            (!file.endsWith('.script')))  {
          let curPath = path.join ( jobDir,file );
          if (fs.lstatSync(curPath).isDirectory()) {
            utils.removePathAsync ( curPath,path.join(jobDir,'..') );
          } else { // delete file
            try {
              fs.unlinkSync ( curPath );
            } catch (e)  {
              console.log ( ' +++ cannot remove file ' + curPath +
                            ' from failed or terminated Simbad directory' );
            }
          }
        }
      });

    }

  }


  TaskSimbad.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.simbad', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSimbad = TaskSimbad;

}
