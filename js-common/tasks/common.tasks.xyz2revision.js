
//  LEGACY CODE, ONLY BE USED FOR COMPLIANCY WITH OLD PROJECTS
//  RETIRED ON 26.03.21

/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.xyz2revision.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Convert XYZ-to-Revision Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 */

'use strict';

var __template = null;
var __cmd      = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')  {
  __template = require ( './common.tasks.dimple' );
  __cmd      = require ( '../common.commands' );
}

// ===========================================================================

function TaskXyz2Revision()  {

  if (__template)  {
    __template.TaskDimple.call ( this );
    this.state = __template.job_code.retired;  // do not include in task lists
  } else  {
    TaskDimple.call ( this );
    this.state = job_code.retired;  // do not include in task lists
  }

  this._type   = 'TaskXyz2Revision';
  this.name    = 'link xyz and hkl';
  this.oname   = '*'; // asterisk means do not use (XYZ name will be used)
  this.title   = 'Link Coordinates and Reflections';

  this.input_dtypes = [{  // input data types
      data_type   : {'DataHKL':[]}, // data type(s) and subtype(s)
      label       : 'Reflections',  // label for input dialog
      inputId     : 'hkl',       // input Id for referencing input fields
      customInput : 'cell-info', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    },{
      data_type   : {'DataXYZ':[]}, // data type(s) and subtype(s)
      label       : 'Coordinates',  // label for input dialog
      inputId     : 'xyz',       // input Id for referencing input fields
      customInput : 'cell-info', // lay custom fields next to the selection
      min         : 1,           // minimum acceptable number of data instances
      max         : 1            // maximum acceptable number of data instances
    }
  ];

  for (var option in this.parameters.sec1.contains)  {
    this.parameters.sec1.contains[option].position[0]++;
    this.parameters.sec1.contains[option].showon = {'USEDIMPLE_CBX':[true]}
  }

  this.parameters.sec1.open = true;

  this.parameters.sec1.contains.USEDIMPLE_CBX = {
    type     : 'checkbox',
    label    : 'Run Dimple',
    tooltip  : 'Check to run Dimple for optional molecular replacement and refinement',
    iwidth   : 280,
    value    : false,
    position : [0,0,1,4]
  };

  this.forceDimple = false;

  this.saveDefaultValues ( this.parameters );

}

if (__template)
  __cmd.registerClass ( 'TaskXyz2Revision',TaskXyz2Revision,__template.TaskDimple.prototype );
else    registerClass ( 'TaskXyz2Revision',TaskXyz2Revision,TaskDimple.prototype );

// ===========================================================================
// export such that it could be used in both node and a browser

TaskXyz2Revision.prototype.icon           = function()  { return 'task_formstructure'; }
TaskXyz2Revision.prototype.clipboard_name = function()  { return '"Link XYZ & HKL"';   }

TaskXyz2Revision.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskDimple.prototype.currentVersion.call ( this );
  else  return  version + TaskDimple.prototype.currentVersion.call ( this );
}


if (!__template)  {
  // for client side

  TaskXyz2Revision.prototype.inputChanged = function ( inpParamRef,emitterId,emitterValue )  {

    TaskDimple.prototype.inputChanged.call ( this,inpParamRef,emitterId,emitterValue );

    var dimple_cbx = inpParamRef.parameters['USEDIMPLE_CBX'].input;

    if ((emitterId=='hkl') || (emitterId=='xyz'))  {
      var inpDataRef = inpParamRef.grid.inpDataRef;

      var hkl_ddn = inpDataRef.input[0].dropdown[0];
      var hkl     = inpDataRef.input[0].dt[hkl_ddn.getValue()];
      var xyz_ddn = inpDataRef.input[1].dropdown[0];
      var xyz     = inpDataRef.input[1].dt[xyz_ddn.getValue()];

      var message = '';
      if (xyz.getSpaceGroup()=='Unspecified') {
        message = 'No space group -- Dimple will be forced';
      } else if (xyz.getSpaceGroup()!=hkl.getSpaceGroup())  {
        message = 'Unmatched space group -- Dimple will be forced';
      } else  {
        hklp = hkl.getCellParameters();
        xyzp = xyz.getCellParameters();
        if (xyzp[0]<2.0)  {
          message = 'No cell parameters -- Dimple will be forced';
        } else if ((Math.abs(hklp[3]-xyzp[3])>2.0) ||
                   (Math.abs(hklp[4]-xyzp[4])>2.0) ||
                   (Math.abs(hklp[5]-xyzp[5])>2.0))  {
          message = 'Too distant cell parameters -- Dimple will be forced';
        } else  {
          var ok = true;
          for (var i=0;i<3;i++)
            if (Math.abs(hklp[i]-xyzp[i])/hklp[i]>0.01)
              ok = false;
          if (!ok)
            message = 'Too distant cell parameters -- Dimple will be forced';
        }
      }

      dimple_cbx.setDisabled ( false );
      if (message)  {
        this.forceDimple = true;
        xyz_ddn.customGrid.setLabel ( message.fontcolor('red'),0,2,1,1 )
                          .setFontItalic(true).setNoWrap();
        if (!dimple_cbx.getValue())
          dimple_cbx.click();
      } else  {
        this.forceDimple = false;
        if (dimple_cbx.getValue())
          dimple_cbx.click();
      }
      dimple_cbx.setDisabled ( this.forceDimple );

      // commented on 22.12.2018 <-- remove when verified
      // Use postponed emit here, which will work at Job Dialog creation,
      // when inputPanel with possibly unsuitable input is created
      // first, and signal slot is activated later. Zero delay means simply
      // that the signal will be emitted in first available thread.
      //inpParamRef.grid.inputPanel.postSignal ( cofe_signals.taskReady,message,0 );

    } else if (emitterId=='USEDIMPLE_CBX')  {

      if (dimple_cbx.getValue())  {
//        if (!this.title.endsWith(' + Dimple'))  this.title += ' + Dimple';
//        if (!this.name.endsWith(' + dimple'))   this.name  += ' + dimple';
        if (!endsWith(this.title,' + Dimple'))  this.title += ' + Dimple';
        if (!endsWith(this.name,' + dimple'))   this.name  += ' + dimple';
      } else  {
//        if (this.title.endsWith(' + Dimple'))
        if (endsWith(this.title,' + Dimple'))
          this.title = this.title.substr(0,this.title.length-9);
//        if (this.name.endsWith(' + dimple'))
        if (endsWith(this.name,' + dimple'))
          this.name = this.name.substr(0,this.name.length-9);
      }
      var inputPanel = inpParamRef.grid.parent.parent;
      inputPanel.header.title.setText ( '<b>' + this.title + '</b>' );
      inputPanel.header.uname_inp.setStyle ( 'text','',
                            this.name.replace(/<(?:.|\n)*?>/gm, '') );
      this.updateInputPanel ( inputPanel );
      inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                              job_dialog_reason.rename_node );

    }

  }

  TaskXyz2Revision.prototype.collectInput = function ( inputPanel )  {
    if (this.forceDimple)
          return TaskDimple.prototype.collectInput.call ( this,inputPanel );
    else  return TaskTemplate.prototype.collectInput.call ( this,inputPanel );
  }

} else  {  //  for server side

  var conf = require('../../js-server/server.configuration');

  TaskXyz2Revision.prototype.getCommandLine = function ( jobManager,jobDir )  {
    return [conf.pythonName(), '-m', 'pycofe.tasks.xyz2revision', jobManager, jobDir, this.id];
  }

  // -------------------------------------------------------------------------

  module.exports.TaskXyz2Revision = TaskXyz2Revision;

}
