
/*
 *  =================================================================
 *
 *    01.06.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2024
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

  this.theme_no    = 6;

  this.doclink_type = 'none';  // {'none'|url|doi|taskref|userguide|tutorial}
  this.doclink_url  = '';
  this.doclink_doi  = '';
  this.doclink_file = '';  // documentation article file name (.html)

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
  __cmd.registerClass ( 'TaskRemark',TaskRemark,__template.TaskTemplate.prototype );
else    registerClass ( 'TaskRemark',TaskRemark,TaskTemplate.prototype );

// ===========================================================================

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
  ['task_remark_red'     ,'Red'      ],
  ['task_remark_doc'     ,'Document link' ]
];

if (!__template)  {
  // only on client

  TaskRemark.prototype.icon = function()  {
    return __remark_icon[this.theme_no][0];
    // *** sticlky feature
    // if (this.state==job_code.remark)
    //   return __remark_icon[this.theme_no][0] + '_s';
    // return __remark_icon[this.theme_no][0];
  }

  TaskRemark.prototype.clipboard_name = function()  { return '"Remark"'; }

  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskRemark.prototype.customDataClone = function ( cloneMode,task )  {
    this.theme_no = task.theme_no;
    this.state    = task.state;
    if ('doclink_type' in task)  {
      this.doclink_type = task.doclink_type;
      this.doclink_url  = task.doclink_url;
      this.doclink_doi  = task.doclink_doi;
      this.doclink_file = task.doclink_file;  // documentation article file name (.html)
      if (this.theme_no==__remark_icon.length-1)  {
        this.theme_no     = 6;
        this.doclink_type = 'none';  // {'none'|url|doi|taskref|userguide|tutorial}
      }
    }
    return;
  }

  TaskRemark.prototype.isLink = function()  {
    return (('doclink_type' in this) && (this.doclink_type!='none'));
  }

  TaskRemark.prototype.setTheme = function ( themeNo,inputPanel )  {
    this.theme_no = themeNo;
    inputPanel.header.icon_menu.button.setBackground (
      image_path(__remark_icon[this.theme_no][0])
    );
    // *** sticky feature
    // inputPanel.header.icon_menu_s.button.setBackground (
    //     image_path(__remark_icon[this.theme_no][0]+'_s')
    // );
    inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                            job_dialog_reason.set_node_icon );
    if (this.theme_no==__remark_icon.length-1)  {
      var doclink_dlg = new InputBox ( 'Link document' );
      doclink_dlg.setText ( '','task_remark_doc' );
      // var ibx_grid    = new Grid ( '' );
      var ibx_grid = doclink_dlg.grid;
      // var ibx_grid  = new Grid     ( '' );
      // doclink_dlg.addWidget ( ibx_grid );
      ibx_grid.setLabel ( '<h2>Set Document Link</h2>',0,2,2,3 );
      ibx_grid.setLabel ( 'Link type:&nbsp;&nbsp;&nbsp;',2,3,1,1 );
      ibx_grid.setVerticalAlignment ( 2,3,'middle' );
      var dropdown = new Dropdown();
      ibx_grid.addWidget ( dropdown,2,4,1,1 );
      dropdown
        .addItem  ( 'No link'      ,'','none',this.doclink_type=='none' )
        .addItem  ( 'Web page'     ,'','url' ,this.doclink_type=='url'  )
        .addItem  ( 'DOI reference','','doi' ,this.doclink_type=='doi'  )
        .setWidth ( '220px' );
      if ((__user_role==role_code.developer) || (__user_role==role_code.admin))
        dropdown
          .addItem  ( 'Task documentation'  ,'','taskref'  ,this.doclink_type=='taskref'   )
          .addItem  ( 'User guide article'  ,'','userguide',this.doclink_type=='userguide' )
          .addItem  ( 'Tutorial description','','tutorial' ,this.doclink_type=='tutorial'  );
      dropdown.make();
      var doc_label  = ibx_grid.setLabel ( 'URL:&nbsp;&nbsp;&nbsp;',3,3,1,1 );
      ibx_grid.setVerticalAlignment ( 3,3,'middle' );
      var input_text = ibx_grid.setInputText ( '',3,4,1,1).setWidth('500px');
      (function(self){
        function _set_fields ( type )  {
          doc_label .setVisible ( type!='none' );
          input_text.setVisible ( type!='none' );
          var lbl = '';
          var val = '';
          switch (type)  {
            case 'url'      :  lbl = 'URL';  val = self.doclink_url;  break;
            case 'doi'      :  lbl = 'DOI';  val = self.doclink_doi;  break;
            case 'taskref'  :  case 'userguide' :
            case 'tutorial' :  lbl = 'File'; val = self.doclink_file; break;
            default : ;
          }
          doc_label .setText  ( lbl );
          input_text.setValue ( val );
        }
        _set_fields ( self.doclink_type );
        dropdown.addOnChangeListener ( function(text,value){
          _set_fields ( value );
        });
        doclink_dlg.launch ( 'Set link',function(){
          self.doclink_type = dropdown.getValue();  // {'none'|url|doi|taskref|userguide|tutorial}
          var val = input_text.getValue().trim();
          switch (self.doclink_type)  {
            case 'url'      :  self.doclink_url  = val;  break;
            case 'doi'      :  self.doclink_doi  = val;  break;
            case 'taskref'  :  case 'userguide' :
            case 'tutorial' :  self.doclink_file = val;  break;
            default : ;
          }
          if (self.doclink_type!='none')
            window.setTimeout ( function(){
              new MessageBox ( 'Remark is being converted',
              '<div style="width:400px"><h2>The Remark is being converted</h2>' +
              'The Remark will be permanently converted into document link. ' +
              'Make sure that you have chosen a suitable remark title before ' +
              'closing the Remark Dialog.' );
            },0);
          return true;
        });
      }(this))
    }
  }

  TaskRemark.prototype.makeThemeMenu = function ( suffix,inputPanel )  {

    let icon_menu = new Menu ( '', image_path(__remark_icon[this.theme_no][0]+suffix) );

    icon_menu.button.setWidth  ( '80px' );
    icon_menu.button.setHeight ( '80px' );
    icon_menu.setTooltip ( 'Click on icon to change theme' );
    $(icon_menu.button.element).css({
        'background-size'    :'80px',
        'padding'            :'0px',
        'background-position':'0.0em center'
    });

    icon_menu.setOnClickCustomFunction ( function(){
      icon_menu.setMaxHeight ( (inputPanel.height_px()-90) + 'px' );
    });

    for (let i=0;i<__remark_icon.length;i++)
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

    if (startsWith(this.doclink_type,'*'))
      this.doclink_type = this.doclink_type.substring(1);

    // *** sticky feature
    // div.fix_cbx = new Checkbox ( 'Sticky',(this.state==job_code.remark) );
    // div.header.insertWidget ( div.fix_cbx,1,0,1,1 );
    // div.fix_cbx.setWidth_px ( 70 );
    // div.fix_cbx.setTooltip  ( 'If checked, the remark is fixed to the above ' +
    //                           'item of job tree.' );

    div.header.uname_lbl.setText ( 'Remark title:&nbsp;&nbsp;' );

    div.header.icon_menu = this.makeThemeMenu ( '',div );
    div.header.setWidget ( div.header.icon_menu,0,0,3,1 );

    // *** sticky feature
    // div.header.icon_menu.setVisible ( this.state!=job_code.remark );
    // div.header.icon_menu_s = this.makeThemeMenu ( '_s',div );
    // div.header.addWidget ( div.header.icon_menu_s,0,0,3,1 );
    // div.header.icon_menu_s.setVisible ( this.state==job_code.remark );

    div.header.setCellSize  ( '','84px', 0,0 );

    // *** sticky feature
    // (function(self){
    //   div.fix_cbx.addOnClickListener ( function(){
    //     if (self.state==job_code.remark)
    //           self.state = job_code.remdet;
    //     else  self.state = job_code.remark;
    //     div.emitSignal ( cofe_signals.jobDlgSignal,job_dialog_reason.set_node_icon );
    //     div.emitSignal ( cofe_signals.jobDlgSignal,job_dialog_reason.tree_updated  );
    //     //div.header.icon_menu.setMenuIcon ( image_path(self.icon()) );
    //     div.header.icon_menu  .setVisible ( self.state!=job_code.remark );
    //     div.header.icon_menu_s.setVisible ( self.state==job_code.remark );
    //   });
    // }(this))

    div.header.setHLine ( 1, 3,0,1,5 );

    return div;

  }

  TaskRemark.prototype.openWebLink = function()  {
    if ('doclink_type' in this)  {
      var url      = null;
      var title    = 'Document';
      var external = false;
      switch (this.doclink_type)  {
        case 'url'       : url      = this.doclink_url;
                           external = !startsWith(url,__fe_url);
                         break;
        case 'doi'       : url      = 'https://doi.org/' + this.doclink_doi;
                           external = true;
                         break;
        case 'taskref'   : url   = __task_reference_base_url + this.doclink_file;
                           title = '';
                         break;
        case 'userguide' : url   = __user_guide_base_url + this.doclink_file;
                           title = '';
                         break;
        case 'tutorial'  : url   = __tutorials_base_url + this.doclink_file;
                           title = 'Tutorial info'
                         break;
        default          : ;
      }
      if (url)  {
        if (external)  window.open ( url,'_blank' );
                 else  new HelpBox ( title,url,null );
        return true;
      }
    }
    return false;
  }

  TaskRemark.prototype.isWebLink = function()  {
    return  ('doclink_type' in this) && (this.doclink_type!='none');
  }

  TaskRemark.prototype.isDocLink = function()  {
    return  ('doclink_type' in this) &&
            (['taskref','userguide','tutorial'].indexOf(this.doclink_type)>=0);
  }

}

//TaskRemark.prototype.cleanJobDir   = function ( jobDir )  {}
TaskRemark.prototype.runButtonName = function() { return ''; }  // removes Run Button and I/O panel switch
TaskRemark.prototype.canMove       = function ( node,jobTree )  {
  return false;
  // *** sticky feature
  // return (this.state!=job_code.remark);
}

TaskRemark.prototype.currentVersion = function()  {
  var version = 1;
  if (__template)
        return  version + __template.TaskTemplate.prototype.currentVersion.call ( this );
  else  return  version + TaskTemplate.prototype.currentVersion.call ( this );
}

// ===========================================================================
// export such that it could be used in both node and a browser

if (__template)  {
  //  for server side

  // TaskRemark.prototype.icon = function()  {
  //   // *** sticky feature
  //   // if (this.state==__template.job_code.remark)
  //   //   return __remark_icon[this.theme_no][0] + '_s';
  //   return __remark_icon[this.theme_no][0];
  // }

  TaskRemark.prototype.getCommandLine = function ( jobManager,jobDir )  { return null; }

  // -------------------------------------------------------------------------

  module.exports.TaskRemark = TaskRemark;

}
