
/*
 *  =================================================================
 *
 *    26.03.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.remark.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Remark Task Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 */

var __template = null;

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  __template = require ( './common.tasks.template' );

// ===========================================================================

function TaskRemark()  {

  if (__template)  __template.TaskTemplate.call ( this );
             else  TaskTemplate.call ( this );

  this._type       = 'TaskRemark';
  this.name        = 'remark';
  this.oname       = '*';   // asterisk here means do not use
  this.title       = 'Custom remark';
  if (__template)
        this.state = __template.job_code.remark;
  else  this.state = job_code.remark;
  //this.helpURL     = './html/jscofe_task_remark.html';

  this.theme_no    = 6;

  this.input_dtypes = [];

  this.parameters = {
    TITLE : {
        type     : 'label',
        keyword  : 'none',
        label    : '<h3>Detail description</h3>',
        position : [0,0,1,1]
    },
    DESCRIPTION : {
        type        : 'textarea_',  // can be also 'textarea'
        keyword     : 'none',       // optional
        tooltip     : '',           // mandatory
        placeholder : 'Optional detail description may be placed here', // optional
        nrows       : 14,           // optional
        ncols       : 90,           // optional
        iwidth      : 750,          // optional
        value       : '',           // mandatory
        position    : [1,0,1,1]     // mandatory
    }
  };

}


if (__template)
      TaskRemark.prototype = Object.create ( __template.TaskTemplate.prototype );
else  TaskRemark.prototype = Object.create ( TaskTemplate.prototype );
TaskRemark.prototype.constructor = TaskRemark;


// ===========================================================================
// export such that it could be used in both node and a browser

var __remark_icon = [
  ['task_remark_black'   ,'Black'    ],
  ['task_remark_darkblue','Midnight' ],
  ['task_remark_navy'    ,'Navy'     ],
  ['task_remark_blue'    ,'Blue'     ],
  ['task_remark_green'   ,'Green'    ],
  ['task_remark_cyan'    ,'Cyan'     ],
  ['task_remark'         ,'Lemon'    ],
  ['task_remark_yellow'  ,'Gold'     ],
  ['task_remark_pink'    ,'Pink'     ],
  ['task_remark_red'     ,'Red'      ]
];

if (!__template)  {
  // only on client

  TaskRemark.prototype.icon = function()  {
    if (this.state==job_code.remark)
      return __remark_icon[this.theme_no][0] + '_s';
    return __remark_icon[this.theme_no][0];
  }

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskRemark.prototype.customDataClone = function ( task )  {
    this.theme_no = task.theme_no;
    this.state    = task.state;
    return;
  }

  TaskRemark.prototype.setTheme = function ( themeNo,inputPanel )  {
    this.theme_no = themeNo;
    inputPanel.header.icon_menu.button.setBackground (
        image_path(__remark_icon[this.theme_no][0])
    );
    inputPanel.header.icon_menu_s.button.setBackground (
        image_path(__remark_icon[this.theme_no][0]+'_s')
    );
    inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                            job_dialog_reason.set_node_icon );
  }

  TaskRemark.prototype.makeThemeMenu = function ( suffix,inputPanel )  {

    var icon_menu = new Menu ( '', image_path(__remark_icon[this.theme_no][0]+suffix) );

    icon_menu.button.setWidth  ( '80px' );
    icon_menu.button.setHeight ( '80px' );
    icon_menu.setTooltip ( 'Click on icon to change theme' );
    $(icon_menu.button.element).css({
        'background-size'    :'80px',
        'padding'            :'0px',
        'background-position':'0.0em center'
    });

    for (var i=0;i<__remark_icon.length;i++)
      (function(themeNo,task){
        icon_menu.addItem ( __remark_icon[themeNo][1],
                            image_path(__remark_icon[themeNo][0]+suffix) )
                 .addOnClickListener ( function(){
          task.setTheme ( themeNo,inputPanel );
        });
      }(i,this))

    return icon_menu;

  }

  // reserved function name
  TaskRemark.prototype.makeInputPanel = function ( dataBox )  {

    var div = TaskTemplate.prototype.makeInputPanel.call ( this,dataBox );

    div.fix_cbx = new Checkbox ( 'Sticky',(this.state==job_code.remark) );
    div.header.insertWidget ( div.fix_cbx,1,0,1,1 );
    div.fix_cbx.setWidth_px ( 70 );
    div.fix_cbx.setTooltip  ( 'If checked, the remark is fixed to the above ' +
                              'item of job tree.' );

    div.header.uname_lbl.setText ( 'Remark title:&nbsp;&nbsp;' );

    div.header.icon_menu = this.makeThemeMenu ( '',div );
    div.header.setWidget ( div.header.icon_menu,0,0,3,1 );
    div.header.icon_menu.setVisible ( this.state!=job_code.remark );
    div.header.icon_menu_s = this.makeThemeMenu ( '_s',div );
    div.header.addWidget ( div.header.icon_menu_s,0,0,3,1 );
    div.header.icon_menu_s.setVisible ( this.state==job_code.remark );
    div.header.setCellSize  ( '','84px', 0,0 );

    (function(self){
      div.fix_cbx.addOnClickListener ( function(){
        if (self.state==job_code.remark)
              self.state = job_code.remdet;
        else  self.state = job_code.remark;
        div.emitSignal ( cofe_signals.jobDlgSignal,job_dialog_reason.set_node_icon );
        div.emitSignal ( cofe_signals.jobDlgSignal,job_dialog_reason.tree_updated  );
        //div.header.icon_menu.setMenuIcon ( image_path(self.icon()) );
        div.header.icon_menu  .setVisible ( self.state!=job_code.remark );
        div.header.icon_menu_s.setVisible ( self.state==job_code.remark );
      });
    }(this))

    div.header.setHLine ( 1, 3,0,1,5 );

    return div;

  }

}

TaskRemark.prototype.cleanJobDir   = function ( jobDir )  {}
TaskRemark.prototype.runButtonName = function() { return ''; }  // removes Run Button and I/O panel switch
TaskRemark.prototype.canMove       = function ( node,jobTree )  {
  return (this.state!=job_code.remark);
}

TaskRemark.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}


if (__template)  {
  //  for server side

  TaskRemark.prototype.icon = function()  {
    if (this.state==__template.job_code.remark)
      return __remark_icon[this.theme_no][0] + '_s';
    return __remark_icon[this.theme_no][0];
  }

  TaskRemark.prototype.getCommandLine = function ( jobManager,jobDir )  { return null; }

  // -------------------------------------------------------------------------

  module.exports.TaskRemark = TaskRemark;

}
