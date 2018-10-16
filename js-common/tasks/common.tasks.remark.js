
/*
 *  =================================================================
 *
 *    15.10.18   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/tasks/common.tasks.remark.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  RefMac Task Class
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
  this.helpURL     = './html/jscofe_task_remark.html';

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
        tooltip     : '',  // mandatory
        placeholder : 'Optional detail description may be placed here', // optional
        nrows       : 14,         // optional
        ncols       : 90,        // optional
        iwidth      : 750,       // optional
        value       : '',        // mandatory
        position    : [1,0,1,1]  // mandatory
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
  ['./images/task_remark_black.svg'   ,'./images/task_remark_black_20x20.svg'   ,'Black'    ],
  ['./images/task_remark_darkblue.svg','./images/task_remark_darkblue_20x20.svg','Midnight' ],
  ['./images/task_remark_navy.svg'    ,'./images/task_remark_navy_20x20.svg'    ,'Navy'     ],
  ['./images/task_remark_blue.svg'    ,'./images/task_remark_blue_20x20.svg'    ,'Blue'     ],
  ['./images/task_remark_green.svg'   ,'./images/task_remark_green_20x20.svg'   ,'Green'    ],
  ['./images/task_remark_cyan.svg'    ,'./images/task_remark_cyan_20x20.svg'    ,'Cyan'     ],
  ['./images/task_remark.svg'         ,'./images/task_remark_20x20.svg'         ,'Lemon'    ],
  ['./images/task_remark_yellow.svg'  ,'./images/task_remark_yellow_20x20.svg'  ,'Gold'     ],
  ['./images/task_remark_pink.svg'    ,'./images/task_remark_pink_20x20.svg'    ,'Pink'     ],
  ['./images/task_remark_red.svg'     ,'./images/task_remark_red_20x20.svg'     ,'Red'      ]
];


//TaskRemark.prototype.icon_small = function()  { return './images/task_remark_20x20.svg'; }
//TaskRemark.prototype.icon_large = function()  { return './images/task_remark.svg';       }

TaskRemark.prototype.icon_small = function()  { return __remark_icon[this.theme_no][1]; }
TaskRemark.prototype.icon_large = function()  { return __remark_icon[this.theme_no][0]; }

TaskRemark.prototype.cleanJobDir    = function ( jobDir )  {}
TaskRemark.prototype.currentVersion = function() { return 0; }
TaskRemark.prototype.runButtonName  = function() { return ''; }  // removes Run Button and I/O panel switch
TaskRemark.prototype.canMove        = function ( node,jobTree )  { return false; }

TaskRemark.prototype.setTheme = function ( themeNo,inputPanel )  {
  this.theme_no = themeNo;
  inputPanel.header.icon_menu.button.setBackground ( this.icon_large() );
  inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                          job_dialog_reason.set_node_icon );
}


// reserved function name
TaskRemark.prototype.makeInputPanel = function ( dataBox )  {

  var div = TaskTemplate.prototype.makeInputPanel.call ( this,dataBox );
  div.header.uname_lbl.setText ( 'Remark title:&nbsp;&nbsp;' );
  div.header.title.setTooltip ( 'Click on icon to change theme' );
  //div.header.setLabel ( 'XXXX',2,0,1,1 ).setTooltip ( 'Click on icon to change theme' );
  //                .setFontItalic(true).setNoWrap().setHeight('1em');

  div.header.icon_menu = new Menu ( '',this.icon_large() );
  div.header.setWidget ( div.header.icon_menu,0,0,3,1 );
  div.header.icon_menu.button.setWidth  ( '80px' );
  div.header.icon_menu.button.setHeight ( '80px' );
  $(div.header.icon_menu.button.element).css({
      'background-size'    :'80px',
      'padding'            :'0px',
      'background-position':'0.0em center'
  });

  for (var i=0;i<__remark_icon.length;i++)
    (function(themeNo,task){
      div.header.icon_menu.addItem ( __remark_icon[themeNo][2],
                                     __remark_icon[themeNo][0] )
                          .addOnClickListener ( function(){
        task.setTheme ( themeNo,div );
      });
    }(i,this))

  return div;

}



if (__template)  {
  //  for server side

  TaskRemark.prototype.getCommandLine = function ( exeType,jobDir )  { return null; }

  // -------------------------------------------------------------------------

  module.exports.TaskRemark = TaskRemark;

}
