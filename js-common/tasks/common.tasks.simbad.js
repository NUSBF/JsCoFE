
/*
 *  =================================================================
 *
 *    10.03.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskSimbad()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskSimbad';
  this.name    = 'simbad';
  this.oname   = 'simbad';  // default output file name template
  this.title   = 'Lattice, Contaminant and Database Searches with Simbad';
  this.helpURL = './html/jscofe_task_simbad.html';

  this.input_dtypes = [{    // input data types
     data_type : {'DataHKL':[]},  // data type(s) and subtype(s)
     label     : 'Reflections',   // label for input dialog
     inputId   : 'hkl',      // input Id for referencing input fields
     min       : 1,          // minimum acceptable number of data instances
     max       : 1           // maximum acceptable number of data instances
   }
  ];

  this.parameters = { // input parameters
    SEP0_LABEL : {
              type     : 'label',  // just a separator
              label    : '&nbsp;',
              position : [0,0,1,5]
           },
    sec1 : {  type     : 'section',
              title    : 'Search level',
              open     : true,  // true for the section to be initially open
              position : [1,0,1,5],
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
                      position  : [0,0,1,1]
                    },
                MAXNLATTICES  : {
                      type     : 'integer_',
                      keyword  : 'none',
                      label    : 'Maximum number of candidates',
                      tooltip  : 'Maximum number of candidate lattices to select ' +
                                 'and explore. The higher the number, the slower the ' +
                                 'search.',
                      range    : [1,100],
                      value    : '',
                      default  : '50',
                      position : [1,0,1,1]
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
                      default  : '12',
                      showon   : {'SEARCH_SEL':['L','LC','LCS']},
                      position : [2,0,1,1]
                    }
              }
    }
  };

}


if (__template)
      TaskSimbad.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskSimbad.prototype = Object.create ( TaskTemplate.prototype );
TaskSimbad.prototype.constructor = TaskSimbad;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskSimbad.prototype.icon_small = function()  { return './images/task_simbad_20x20.svg'; }
TaskSimbad.prototype.icon_large = function()  { return './images/task_simbad.svg';       }

TaskSimbad.prototype.currentVersion = function()  { return 0; }

if (!__template)  {
//  for client side

/*
  TaskSimbad.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    function makeSuffix ( title,suffix )  {
      return title.split(' (')[0] + ' (' + suffix + ')';
    }

    if (emitterId=='hkl') || (emitterId=='native') || (emitterId=='pmodel')) {
      var inpDataRef = inpParamRef.grid.inpDataRef;
      var dataState  = this.getDataState ( inpDataRef );
      var nHKL       = dataState['hkl'];
      var nNative    = dataState['native'];
      var nPModel    = dataState['pmodel'];

      //var nHKL    = this.countInputData ( inpDataRef,'hkl'   ,'' );
      //var nNative = this.countInputData ( inpDataRef,'native','' );

      //var IR       = (nNative==2);
      //var isPModel = (nHKL==1) && (!IR) && (nPModel>0);
      var IR = false;
      if (nNative>0)  {
        var native = this.getInputItem ( inpDataRef,'native' );
        if (native)  {
          if (native.dropdown[0].hasOwnProperty('customGrid'))  {
            var customGrid    = native.dropdown[0].customGrid;
            var showUFP_cbx   = (nNative>0) && (nHKL<=1);
            useForPhasing_cbx = customGrid.useForPhasing;
            IR                = useForPhasing_cbx.getValue();
            useForPhasing_cbx.setVisible ( showUFP_cbx );
            customGrid       .setVisible ( showUFP_cbx );
          }
        }
      }

      var pmodel   = this.getInputItem ( inpDataRef,'pmodel' );
      var isPModel = false;
      if (pmodel)  {
        inpParamRef.grid.setRowVisible ( pmodel.dropdown[0].row,
                                         (nHKL==1) && (!IR) );
        isPModel = (nHKL==1) && (!IR) && (pmodel.dropdown[0].getValue()>=0);
      }

      if (this.state==job_code.new)  {

        var name = this.name;
        if (nHKL<=1)  {
          if (nNative<=0)  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD' );
              this.name  = makeSuffix ( this.name ,'MR-SAD' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD' );
              this.name  = makeSuffix ( this.name ,'SAD' );
            }
          } else if (IR)  {
            this.title = makeSuffix ( this.title,'SIRAS' );
            this.name  = makeSuffix ( this.name ,'SIRAS' );
          } else  {
            if (isPModel)  {
              this.title = makeSuffix ( this.title,'MR-SAD + Native' );
              this.name  = makeSuffix ( this.name ,'MR-SAD + Native' );
            } else  {
              this.title = makeSuffix ( this.title,'SAD + Native' );
              this.name  = makeSuffix ( this.name ,'SAD + Native' );
            }
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
          var inputPanel = inpParamRef.grid.parent.parent;
          inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
          inputPanel.header.uname_inp.setStyle ( 'text','',
                                this.name.replace(/<(?:.|\n)*?>/gm, '') );
          this.updateInputPanel ( inputPanel );
        }

      }

    }

    TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

  }


  TaskCrank2.prototype.updateInputPanel = function ( inputPanel )  {
    if (this.state==job_code.new)  {
      var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
         'detail' : job_dialog_reason.rename_node
      });
      inputPanel.element.dispatchEvent(event);
    }
  }

*/

} else  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskSimbad.prototype.getCommandLine = function ( exeType,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.simbad', exeType, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskSimbad = TaskSimbad;

}
