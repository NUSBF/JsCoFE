
/*
 *  =================================================================
 *
 *    23.05.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.shelxauto.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  SHELX-CD Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev, M. Fando 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );


// ===========================================================================

function TaskShelxCD()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskShelxCD';
  this.name    = 'shelx-cd substructure search';
  this.setOName ( 'shelx-cd' );  // default output file name template
  this.title   = 'Substructure Search with SHELX-C/D';
  //this.helpURL = './html/jscofe_task_shelxcd.html';

  this.input_dtypes = [{    // input data types
      data_type   : {'DataRevision':['!anomalous','!asu','~xyz','~phases','~substructure']}, // data type(s) and subtype(s)
      label       : 'Structure revision',     // label for input dialog
      inputId     : 'revision',      // input Id for referencing input fields
      customInput : 'shelx-substr',  // lay custom fields next to the selection
                                // dropdown for 'native' dataset
      version     : 5,          // minimum data version allowed
      min         : 1,          // minimum acceptable number of data instances
      max         : 1           // maximum acceptable number of data instances
    },{
      data_type   : {'DataHKL':['anomalous']}, // data type(s) and subtype(s)
      label       : 'Anomalous reflection<br>data',             // label for input dialog
      inputId     : 'hkl',       // input Id for referencing input fields
      customInput : 'shelx-substr',  // lay custom fields next to the selection
                                 // dropdown for anomalous data
      tooltip     : 'Only anomalous reflection datasets from all imported ' +
                    'may be chosen here. Note that neither of reflection '  +
                    'datasets may coincide with the native dataset, if one is ' +
                    'specified above.',
      min         : 0,           // minimum acceptable number of data instances
      max         : 3            // maximum acceptable number of data instances
    },{
      data_type   : {'DataHKL':[]},   // data type(s) and subtype(s)
      desc        : 'native dataset',
      label       : 'Native dataset', // label for input dialog
      inputId     : 'native',     // input Id for referencing input fields
      //customInput : 'native',     // lay custom fields next to the selection
      //                            // dropdown for 'native' dataset
      tooltip     : 'Native dataset is optional and may be chosen from both ' +
                    'non-anomalous (typical case) and anomalous diffraction ' +
                    'datasets. Native dataset must not coincide with any of ' +
                    'the reflection datasets chosen above.',
      min         : 0,            // minimum acceptable number of data instances
      max         : 1             // maximum acceptable number of data instances
    }
  ];

  this.parameters = { // input parameters
    sec1: { type     : 'section',
            title    : 'Search Parameters',
            open     : true,  // true for the section to be initially open
            position : [0,0,1,5],
            contains : {
              FIND : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'FIND',  // the real keyword for job input stream
                    label     : 'Try to find a substructure of',
                    tooltip   : 'Expected number of atoms in substructure.',
                    range     : [1,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    label2    : 'atoms',
                    placeholder : 'auto',
                    position  : [0,0,1,1]   // [row,col,rowSpan,colSpan]
                  },
              /*
              SFAC : {
                    type      : 'string',   // empty string not allowed
                    keyword   : 'SFAC',
                    label     : 'atoms of type',
                    align     : 'center',
                    tooltip   : 'Atom type (chemical element) to look for.',
                    //iwidth    : '80',
                    value     : 'SE',
                    emitting  : true,    // will emit 'onchange' signal
                    maxlength : 2,       // maximum input length
                    position  : [0,3,1,1]
                  },
              */
              DSUL : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'DSUL',  // the real keyword for job input stream
                    label     : 'Number of disulfides',
                    tooltip   : 'Expected number of disulfides in substructure.',
                    range     : [0,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    placeholder : 'auto',
                    position  : [1,0,1,1],  // [row,col,rowSpan,colSpan]
                    showon    : {SFAC:['S']}
                  },
              NTRY : {
                    type      : 'integer_', // blank value is allowed
                    keyword   : 'NTRY',  // the real keyword for job input stream
                    label     : 'Number of trials',
                    tooltip   : 'Number of global trials.',
                    range     : [1,'*'],    // may be absent (no limits) or must
                                            // be one of the following:
                                            //   ['*',max]  : limited from top
                                            //   [min,'*']  : limited from bottom
                                            //   [min,max]  : limited from top and bottom
                    value     : '',         // value to be paired with the keyword
                    placeholder : '1000',
                    position  : [2,0,1,1]   // [row,col,rowSpan,colSpan]
                  },
              HIGHRES : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'HIGHRES', // the real keyword for job input stream
                    label     : 'Resolution range: from (&Aring;)',
                    tooltip   : 'High resolution limit, leave blank for automatic choice.',
                    //iwidth    : 80,
                    range     : [0.0,10.0], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : 'auto',
                    position  : [3,0,1,1]    // [row,col,rowSpan,colSpan]
                  },
              LOWRES : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'LOWRES', // the real keyword for job input stream
                    label     : 'to (&Aring;)',
                    align     : 'center',
                    tooltip   : 'Lower resolution limit, leave blank for automatic choice.',
                    //iwidth    : 80,
                    range     : [0.0,10.0], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : 'auto',
                    position  : [3,3,1,1]    // [row,col,rowSpan,colSpan]
                  },
              MINDIST : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'MINDIST', // the real keyword for job input stream
                    label     : 'Minimal distance between atoms',
                    tooltip   : 'The shortest distance allowed between atoms.',
                    //iwidth    : 80,
                    range     : [0.0,10.0], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : 'auto',
                    position  : [4,0,1,1]    // [row,col,rowSpan,colSpan]
                  },
              SPECIAL_POSITIONS_CBX : {
                    type      : 'checkbox',
                    label     : 'Allow for heavy atoms lying in special positions',
                    tooltip   : 'Check to allow for heavy atoms to lie in special ' +
                                'crystallohraphic positions.',
                    //iwidth    : 400,
                    value     : false,
                    position  : [5,0,1,3]
                  },
              MINDEQ : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'MINDEQ', // the real keyword for job input stream
                    label     : 'Minimal distance between symmetry mates',
                    tooltip   : 'The shortest distance allowed between atoms in ' +
                                'symmetry equivalent positions.',
                    //iwidth    : 80,
                    range     : [0.0,10.0], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : 'auto',
                    position  : [6,0,1,1],   // [row,col,rowSpan,colSpan]
                    showon    : {SPECIAL_POSITIONS_CBX:[false]}
                  },
              DSCA : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'DSCA', // the real keyword for job input stream
                    label     : 'Scaling factor for native data',
                    tooltip   : 'The factor (default 0.98) by which to multiply ' +
                                'the native data for SIRAS after the data have ' +
                                'been put onto a common scale (this allows for ' +
                                'the extra scattering power of the heavy atoms etc.)',
                    //iwidth    : 80,
                    range     : [0.0,10.0], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : '0.98',
                    position  : [7,0,1,1],   // [row,col,rowSpan,colSpan]
                    showon    : { _:'&&', hkl:[1], native:[1] }
                  },
              ASCA : {
                    type      : 'real_', // blank value is allowed
                    keyword   : 'ASCA', // the real keyword for job input stream
                    label     : 'Scaling factor for anomalous signal',
                    tooltip   : 'A scale factor (default 1.0) that is applied to ' +
                                'the anomalous signal in a MAD experiment; to ' +
                                'apply MAD to a small molecule, the factor should ' +
                                'be between 0 and 1, the best values have to be ' +
                                'found by trial and error.',
                    //iwidth    : 80,
                    range     : [0.0,10.0], // may be absent (no limits) or must
                                             // be one of the following:
                                             //   ['*',max]  : limited from top
                                             //   [min,'*']  : limited from bottom
                                             //   [min,max]  : limited from top and bottom
                    value     : '',          // value to be paired with the keyword
                    placeholder : '1.0',
                    position  : [8,0,1,1],   // [row,col,rowSpan,colSpan]
                    showon    : { hkl:[2,3,4] }
                  },
              SMAD : {
                    type     : 'checkbox',
                    label    : 'Null dispersive term',
                    tooltip  : 'Check to set the dispersive term to zero in a ' +
                               'MAD experiment. This is equivalent to SAD using ' +
                               'weighted mean anomalous differences from all ' +
                               'the MAD datasets. This can be useful when MAD ' +
                               'appears to fail (especially if the wavelengths ' +
                               'were labeled wrongly).',
                    value    : false,
                    position : [9,0,1,1],
                    showon   : { hkl:[2,3,4] }
                  }
            }
          }
  }

/*
  hideon    : { _:'||',     // apply logical 'or' to all items
                native:[1],
                hkl   :[2,3,4]
              }
*/

  this.saveDefaultValues ( this.parameters );

}


if (__template)
      TaskShelxCD.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskShelxCD.prototype = Object.create ( TaskTemplate.prototype );
TaskShelxCD.prototype.constructor = TaskShelxCD;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskShelxCD.prototype.icon           = function()  { return 'task_shelx_substr'; }
TaskShelxCD.prototype.clipboard_name = function()  { return '"Shelx-C/D"';       }

TaskShelxCD.prototype.desc_title     = function()  {
// this appears under task title in the task list
  return 'find heavy-atom substructure for use in Phaser-EP';
}

TaskShelxCD.prototype.requiredEnvironment = function() {
  return ['CCP4',['$CCP4/bin/shelxe','$CCP4/bin/shelxe.exe']];
}

TaskShelxCD.prototype.cleanJobDir = function ( jobDir ) {}

TaskShelxCD.prototype.currentVersion = function()  {
  let version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

TaskShelxCD.prototype.checkKeywords = function ( keywords )  {
// keywords supposed to be in low register
  return this.__check_keywords ( keywords,['shelx', 'shelxcd','shelx-cd','shelxc','shelxd','experimental', 'phasing', 'auto-ep', 'ep', 'substructure', 'search'] );
}

if (!__template)  {
  // for client side

  TaskShelxCD.prototype.getHelpURL = function()  {
    return __task_reference_base_url + 'doc.task.SHELX.html';
  }

  // hotButtons return list of buttons added in JobDialog's toolBar.
  TaskShelxCD.prototype.hotButtons = function() {
    return [PhaserEPHotButton()];
  }

  TaskShelxCD.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    if ((emitterId=='hkl') || (emitterId=='native')) {
      let inpDataRef = inpParamRef.grid.inpDataRef;
      let dataState  = this.getDataState ( inpDataRef );
      let nHKL       = dataState['hkl'];
      let nNative    = dataState['native'];
      let IR         = false;

      if (nNative>0)  {
        let native = this.getInputItem ( inpDataRef,'native' );
        if (native)  {
          if (native.dropdown[0].hasOwnProperty('customGrid'))  {
            let customGrid    = native.dropdown[0].customGrid;
            let showUFP_cbx   = (nNative>0) && (nHKL<=0);
            useForPhasing_cbx = customGrid.useForPhasing;
            IR                = useForPhasing_cbx.getValue();
            useForPhasing_cbx.setVisible ( showUFP_cbx );
            customGrid       .setVisible ( showUFP_cbx );
          }
        }
      }

      if (this.state==job_code.new)  {

        let revision = this.getInputItem ( inpDataRef,'revision' );
        if (revision)  {
          if (revision.dropdown[0].hasOwnProperty('customGrid'))  {
            let customGrid = revision.dropdown[0].customGrid;
            if (customGrid.hasOwnProperty('wtype'))  {
              customGrid.wtype_lbl.setVisible ( (nHKL>0) );
              customGrid.wtype    .setVisible ( (nHKL>0) );
            }
          }
        }

        let name = this.name;
        if (nHKL<=0)  {
          if (nNative<=0)  {
            this.title = makeSuffix ( this.title,'SAD' );
            this.name  = makeSuffix ( this.name ,'SAD' );
          } else if (IR)  {
            this.title = makeSuffix ( this.title,'SIRAS' );
            this.name  = makeSuffix ( this.name ,'SIRAS' );
          } else  {
            this.title = makeSuffix ( this.title,'SAD + Native' );
            this.name  = makeSuffix ( this.name ,'SAD + Native' );
          }
        } else  {
          if (nNative<=0)  {
            this.title = makeSuffix ( this.title,'MAD' );
            this.name  = makeSuffix ( this.name ,'MAD' );
          } else  {
            this.title = makeSuffix ( this.title,'MAD + Native' );
            this.name  = makeSuffix ( this.name ,'MAD + Native' );
          }
        }

        if (this.name!=name)  {
          let inputPanel = inpParamRef.grid.parent.parent;
          inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
          inputPanel.header.uname_inp.setStyle ( 'text','',
                                this.name.replace(/<(?:.|\n)*?>/gm, '') );
          this.updateInputPanel ( inputPanel );
          inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                  job_dialog_reason.rename_node );
        }

      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }


  TaskShelxCD.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      let event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }

  TaskShelxCD.prototype.collectInput = function ( inputPanel )  {

    let input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );

    function addMessage ( label,message )  {
      input_msg += '|<b>' + label + ':</b> ' + message;
    }

    let hkl    = this.input_data.getData ( 'hkl'    );
    let native = this.input_data.getData ( 'native' );

    for (let i=0;i<hkl.length;i++)  {
      for (let j=i+1;j<hkl.length;j++)
        if (hkl[i].dataId==hkl[j].dataId)
          addMessage ( 'Reflection data','dataset ' + hkl[i].dname +
                       ' is used in more than one input positions, which is not ' +
                       'allowed' );
      if (native.length>0)  {
        if (hkl[i].dataId==native[0].dataId)
          addMessage ( 'Native dataset','dataset ' + hkl[i].dname + ' is used ' +
                       'as both anomalous data and native dataset, which is ' +
                       'not allowed.' );
      }
    }

    return input_msg;

  }


} else  {
  //  for server side

  let conf = require('../../js-server/server.configuration');

  TaskShelxCD.prototype.makeInputData = function ( loginData,jobDir )  {

    // put hkl and structure data in input databox for copying their files in
    // job's 'input' directory

    if ('revision' in this.input_data.data)  {
      let revision = this.input_data.data['revision'][0];
      this.input_data.data['hklrev'] = [revision.HKL];
      //if (revision.HKL.nativeKey!='unused')
      //  this.input_data.data['native'] = [revision.HKL];
      //if (revision.Structure)
      //  this.input_data.data['pmodel'] = [revision.Structure];
      //this.input_data.data['seq'] = revision.ASU.seq;
    }

    __template.TaskTemplate.prototype.makeInputData.call ( this,loginData,jobDir );

  }

  TaskShelxCD.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.shelxcd', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskShelxCD = TaskShelxCD;

}
