
/*
 *  =================================================================
 *
 *    25.02.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.morda.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  CrosSec Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskCrosSec()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type   = 'TaskCrosSec';
  this.name    = 'x-ray cross sections';
  this.oname   = '*';
  this.title   = 'X-ray cross sections and anomalous scattering factors';
  this.helpURL = './html/jscofe_task_crossec.html';

  this.parameters = { // input parameters
    ATOM : {
          type      : 'string',   // empty string not allowed
          keyword   : 'ATOM',
          label     : '<b>For atom type</b>',
          tooltip   : 'Chemical element symbol, e.g., Se',
          default   : 'Se',
          iwidth    : 40,
          value     : 'Se',
          emitting  : true,
          maxlength : 2,       // maximum input length
          position  : [0,0,1,1]
        },
    WLENGTH_N : {
          type      : 'integer',   // empty string not allowed
          label     : '<b>compute</b>',
          align     : 'right',
          tooltip   : 'Number of wavelength points',
          default   : '50',
          iwidth    : 40,
          value     : '50',
          //label2    : 'wavelength points,&nbsp;',
          position  : [1,0,1,1]
        },
    WLENGTH_MIN : {
          type      : 'real',   // empty string not allowed
          label     : '<i>wavelength points</i>,&nbsp;&nbsp;&nbsp;&nbsp;<b>starting from</b>',
          tooltip   : 'Minimal wavelength in angstrom',
          default   : '0.5',
          iwidth    : 40,
          value     : '0.5',
          //label2    : '&Aring;,&nbsp;',
          position  : [1,3,1,1]
        },
    WLENGTH_STEP : {
          type      : 'real',   // empty string not allowed
          label     : '<i>&Aring;</i>,&nbsp;&nbsp;&nbsp;&nbsp;<b>with step</b>',
          tooltip   : 'Wavelength step in angstrom',
          default   : '0.01',
          iwidth    : 40,
          value     : '0.02',
          //label2    : '<i>&Aring;</i>',
          position  : [1,6,1,1]
        },
    _label : {
          type      : 'label',
          label     : '<i>&Aring;</i>',
          position  : [1,9,1,1]
        }
  };

}


if (__template)
      TaskCrosSec.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskCrosSec.prototype = Object.create ( TaskTemplate.prototype );
TaskCrosSec.prototype.constructor = TaskCrosSec;


// ===========================================================================
// export such that it could be used in both node and a browser

TaskCrosSec.prototype.icon = function()  { return 'task_crossec'; }

TaskCrosSec.prototype.currentVersion = function()  {
  var version = 0;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


TaskCrosSec.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

  function makeSuffix ( title,suffix )  {
    return title.split(' (')[0] + ' (' + suffix + ')';
  }

  if (emitterId=='ATOM')  {

    var aname = checkElementSymbol ( emitterValue );
    if (!aname)
      aname = emitterValue;

    this.title = makeSuffix ( this.title,aname );
    this.name  = makeSuffix ( this.name ,aname );

    var inputPanel = inpParamRef.grid.parent.parent;
    inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
    var name = this.name.replace ( /<(?:.|\n)*?>/gm,'' );
    inputPanel.header.uname_inp.setStyle ( 'text','',name );
    inputPanel.job_dialog.changeTitle ( name );
    this.updateInputPanel ( inputPanel );
    inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                            job_dialog_reason.rename_node );

  }

  TaskTemplate.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

}

TaskCrosSec.prototype.updateInputPanel = function ( inputPanel )  {
  if (this.state==job_code.new)  {
    var event = new CustomEvent ( cofe_signals.jobDlgSignal,{
       'detail' : job_dialog_reason.rename_node
    });
    inputPanel.element.dispatchEvent(event);
  }
}

TaskCrosSec.prototype.collectInput = function ( inputPanel )  {

  var input_msg = TaskTemplate.prototype.collectInput.call ( this,inputPanel );
  var sc = checkElementSymbol ( this.parameters.ATOM.value );
  if (!sc)  {
    if (input_msg)
      input_msg += '<br>';
    input_msg += '<b>Invalid atom type ' + this.parameters.ATOM.value + '</b>';
  } else
    this.parameters.ATOM.value = sc;

  return input_msg;

}


if (__template)  {
  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskCrosSec.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.crossec', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskCrosSec = TaskCrosSec;

}
