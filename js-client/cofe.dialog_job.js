
/*
 *  =================================================================
 *
 *    10.03.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_job.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Job Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// JobDialog class

var job_dialog_reason = {
  rename_node     : 'rename_node',     // rename job node
  set_node_icon   : 'set_node_icon',   // set    job node icon
  reset_node      : 'reset_node',      // reset  job node label
  select_node     : 'select_node',     // select job node
  stop_job        : 'stop_job',        // stop job
  end_job         : 'end_job',         // end job gracefully
  webapp_finish   : 'webapp_finish',   // finish webapp job
  tree_updated    : 'tree_updated',    // job tree should be updated
  add_job         : 'add_job',         // add job from task list
  clone_job       : 'clone_job',       // clone job
  run_job         : 'run_job'          // run job
}

function JobDialog ( params,          // data and task projections up the tree branch
                     parent_page,     // current page (parent_page.ration is used)
                     onRun_func,      // function(taskId) called when 'run' is pressed
                     onClose_func,    // function(taskId) called upon close event
                     onDlgSignal_func // function(taskId,reason) called on custom events
                   ) {

  this.tree         = params.tree;
  this.nodeId       = params.nodeId;
  this.task         = params.ancestors[0];
  this.dataBox      = params.dataBox;
  this.ancestors    = params.ancestors;
  this.parent_page  = parent_page;
  this.job_edited   = false;
  this.onClose_func = onClose_func;
  this.nc_browser   = this.task.nc_type.startsWith('browser')

  this._created     = false;

  this.dlg_active   = (!__dormant) && (!this.tree.view_only) && 
                      (!('archive_version' in this.task));

  if ((this.task.state==job_code.remark) && (this.task.openWebLink()))  {
    onClose_func ( this );
    return;
  }

  Widget.call ( this,'div' );

  let title = '[' + padDigits(this.task.id,4) + '] ';
  if (this.task.uname.length>0)  title += this.task.uname;
                           else  title += this.task.name;
  title += this.statusLine();
  this.element.setAttribute ( 'title',strip_html_tags(title) );

  $(this.element).css({'box-shadow':'8px 8px 16px 16px rgba(0,0,0,0.2)',
                       'overflow':'hidden'});
  document.body.appendChild ( this.element );
  //document.body.style.fontSize = '16px';

  this.inputPanel  = null;
  this.outputPanel = null;
  this.run_btn     = null;
  this.autorun_cbx = null;
  this.run_image   = null;
  this.ind_timer   = null;
  this.hot_btn     = [];

  let size = calcDialogSize (
    __user_settings.jobdlg_size[0],__user_settings.jobdlg_size[1],
    1,1, this.task.job_dialog_data
  );
  this.initialWidth  = size[0];
  this.initialHeight = size[1];

  // let taskId = this.task.id;
  let dlg = this;
  dlg.dialog_options = {
    resizable : true,
    //height    : 'auto',
    //width     : w,
    width     : size[0],
    height    : size[1],
    buttons   : {},
    // beforeClose : function(event, ui)  {
    //   if (dlg.nc_browser && 
    //       ((dlg.task.state==job_code.running) || 
    //        (dlg.task.state==job_code.ending)))  {
    //     new MessageBox ( 'WebCoot running',
    //       '<div style="width:400px"><h2>WebCoot is running</h2>' +
    //       'This Job Dialog cannot be closed while <i>WebCoot</i> instance, ' +
    //       'launched from it, is active. Please close <i>WebCoot</i> first.' +
    //       '</div>','msg_stop' );
    //     return false;
    //   } else
    //     return true;
    // },
    open      : function(event, ui)  {
      if (__any_mobile_device)
        $(this).siblings('.ui-dialog-titlebar').remove();
      if (dlg.task.state==job_code.new)  {
        window.setTimeout ( function(){
          dlg.task.onJobDialogStart ( dlg );
          dlg._created = true;
          dlg.setDlgSize();  
        },100);
      } else  {
        dlg._created = true;
        dlg.setDlgSize();  
      }
      // window.setTimeout ( function(){
      //   dlg.setDlgSize();  
      //   // dlg.task.inputPanelResize ( dlg.inputPanel,size[0]-30,size[1]-190 );
      // },100);
    },
    focus     : function() {
                  if (onDlgSignal_func)
                    onDlgSignal_func ( dlg,job_dialog_reason.select_node,null );
                    //onDlgSignal_func ( taskId,job_dialog_reason.select_node,null );
                }
  };

  if (__any_mobile_device)
    this.dialog_options.position =  { my : 'left top',   // job dialog position reference
                                      at : 'left top' }; // job dialog offset in the screen
  else
    this.dialog_options.position = this.task.job_dialog_data.position;

  this.makeLayout ( onRun_func );

  $(this.element).dialog ( this.dialog_options );

  extendToolbar ( this,{
    "maximize" : function(evt,d){ dlg.onWindowResize(); },
    // "minimize" : function(evt, dlg){ resize_func(); },
    "restore"  : function(evt,d){ dlg.onWindowResize(); }
  });

  //if (__any_mobile_device)
  //  dialog.siblings('.ui-dialog-titlebar').remove();

  this.setDlgState();
  // this.setDlgSize ();

  $(dlg.element).on( "dialogclose",function(event,ui){
    dlg.saveJobData();
    dlg.delete();
  });

  // Listen for input event, emitted when input data changes
  if ((dlg.task.state!=job_code.running) && dlg.inputPanel && 
      (!dlg.tree.view_only))  {
    dlg.inputPanel.element.addEventListener(cofe_signals.jobDlgSignal,function(e){
      onDlgSignal_func ( dlg,e.detail,null );
    },false );
  }

  this.onDlgSignal_func = onDlgSignal_func;

  this.task.updateInputPanel ( this.inputPanel );

}


JobDialog.prototype = Object.create ( Widget.prototype );
JobDialog.prototype.constructor = JobDialog;


JobDialog.prototype.delete = function()  {

  if (this.inputPanel)  {
    this.inputPanel.delete();
    this.inputPanel = null;
  }

  if (this.outputPanel)  {
    this.outputPanel.delete();
    this.outputPanel = null;
  }

  if (this._created)
    this._created = false;

  if (this.onClose_func)
    this.onClose_func ( this );

  if (this.nc_browser && (this.task.state==job_code.running))
    this.requestServer ( fe_reqtype.webappEndJob,function(rdata){});

  Widget.prototype.delete.call ( this );

}


JobDialog.prototype.changeTitle = function ( new_title )  {
  let title = '[' + padDigits(this.task.id,4) + '] ' + new_title +
              this.statusLine();
  $(this.element).dialog({ title : strip_html_tags(title) });
}

JobDialog.prototype.statusLine = function()  {
  switch (this.task.state)  {
    case job_code.new           :  return ' (new)';
    case job_code.running       :  return ' -- running';
    case job_code.finished      :  return ' -- completed';
    case job_code.hiddenresults :
    case job_code.noresults     :  return ' -- finished';
    case job_code.failed        :  return ' -- failed';
    case job_code.stopped       :  return ' -- terminated by user';
    default : ;
  }
  return '';
}

JobDialog.prototype.displayInputErrors = function ( input_msg )  {
//  if (input_msg.startsWith('#'))  {
  if (input_msg[0]=='#')  {
    new MessageBox ( 'Input errors','<div style="width:450px;">' +
                     input_msg.substring(1) + '</div>', 'msg_error' );
  } else  {
    // alert ( input_msg );
    let errlst  = input_msg.split('|');
    let errlst1 = [];
    for (let i=0;i<errlst.length;i++)  {
      let s = errlst[i].trim();
      if (s)
        errlst1.push(s);
    }
    if (errlst1.length>0)
      new MessageBox ( 'Input errors',
        '<div style="width:550px;"><h2>Input errors</h2>' +
        'The following errors occurred while processing task input:' +
        '<p><ul><li>' + errlst1.join('</li><li>') +
        '</li></ul><p>Please correct the task input as appropriate.</h2>',
        'msg_error' );
  }
}


JobDialog.prototype.setDlgState = function()  {

  if ((this.task.state==job_code.remdoc) && this.toolBar)  {
    this.toolBar   .setVisible ( false );
    this.toolBarSep.setVisible ( false );
    this.toolBar = null;
    this.outputPanel.setFramePosition ( '16px','8px','100%','100%' );
    this.onDlgResize();
  }

  let isNew     = (this.task.state==job_code.new)    ||
                  (this.task.state==job_code.remark) ||
                  (this.task.state==job_code.remdet);
  let isRunning = (this.task.state==job_code.running) ||
                  (this.task.state==job_code.ending);

  if (this.inputPanel)  {
    this.inputPanel.setDisabledAll ( !isNew );
    if (!this.tree.view_only)
      this.task.disableInputWidgets ( this.inputPanel,!isNew );
  }
  if (this.radioSet)
    this.radioSet.setDisabled ( isNew  );
  if (this.run_btn)  {
    this.run_btn.setVisible  ( isNew     );
    this.run_btn.setDisabled ( !this.dlg_active );
  }
  if (this.autorun_cbx)  {
    this.autorun_cbx.setVisible  ( isNew     );
    this.autorun_cbx.setDisabled ( !this.dlg_active );
  }

  if (this.ind_timer)
    window.clearTimeout ( this.ind_timer );

  if (isRunning && (!this.stop_btn.isVisible()))  {
    // (function(dlg){
    let dlg = this;
      dlg.ind_timer = window.setTimeout ( function(){
        if (dlg.run_image) dlg.run_image.setVisible ( true );
        if (dlg.stop_btn)  dlg.stop_btn .setVisible ( !dlg.nc_browser );
        if (dlg.end_btn)   dlg.end_btn  .setVisible ( !dlg.nc_browser );
      },1000 );
    // }(this));
  } else  {
    if (this.run_image) this.run_image.setVisible ( isRunning );
    if (this.stop_btn)  this.stop_btn .setVisible ( isRunning && (!this.nc_browser) );
    if (this.end_btn)   this.end_btn  .setVisible ( isRunning && (!this.nc_browser) );
  }

  let title = '';
  if (this.task.uname.length>0)  title += this.task.uname;
                           else  title += this.task.name;
  this.changeTitle ( title );

  let show_hot_buttons = this.dlg_active && this.task.isComplete();
  // let enable_hot_buttons = (!__dormant) && (this.task.state==job_code.finished);
  //this.done_sign .setVisible ( (this.task.state==job_code.finished)  );
  //this.nores_sign.setVisible ( (this.task.state==job_code.noresults) );
  for (let i=0;i<this.hot_btn.length;i++)  {
    this.hot_btn[i].setVisible ( show_hot_buttons );
    this.hot_btn[i].setEnabled ( this.dlg_active && 
                                 (this.task.state==job_code.finished) ||
                                 (this.task.state==job_code.hiddenresults) );
  }

  if (this.addjob_btn)  {
    this.addjob_btn.setVisible ( show_hot_buttons );
    this.addjob_btn.setEnabled ( this.dlg_active && (
                                    (this.task.state==job_code.finished) ||
                                    this.task.isRemark()
                                  )
                               );
  }

  if (this.clone_btn)
    this.clone_btn.setVisible ( this.dlg_active && this.task.canClone(null,this.tree) && 
                                (this.task.state!=job_code.new) && (!isRunning) );

  if (this.export_btn)
    this.export_btn.setVisible ( !this.task.isRemark() );

  if (isNew)  { // enforce!
    this.outputPanel.setVisible ( false );
    this.inputPanel .setVisible ( true  );
    this.task.job_dialog_data.panel = 'input';
  } else if ((!isRunning) && __local_service &&
             startsWith(this.outputPanel.getURL(),__local_service))
    this.loadReport();

}

JobDialog.prototype.getDlgSize = function ()  {
  if (!__any_mobile_device)  {
    this.task.job_dialog_data.width  = this.width_px ();
    this.task.job_dialog_data.height = this.height_px();
    let p = $(this.element).dialog ( "option", "position" );
    this.task.job_dialog_data.position.my = p.my;
    this.task.job_dialog_data.position.at = p.at;
  }
}


JobDialog.prototype.onDlgResize = function ()  {

  //if (__any_mobile_device)
  //  return;

  let panelHeight;
  let panelWidth;
  if (this.toolBar)  {
    if (__any_mobile_device)  {
      panelHeight = this.initialHeight - 36 -
                    this.child[0].height_px() - this.child[1].height_px();
    } else  {
      panelHeight = this.task.job_dialog_data.height - 36 -
                    this.child[0].height_px() - this.child[1].height_px();
    }
    panelWidth = this.child[1].width_px();
  } else  {
    if (__any_mobile_device)
          panelHeight = this.initialHeight - 24;
    else  panelHeight = this.task.job_dialog_data.height - 24;
    panelWidth = this.task.job_dialog_data.width - 30;
  }

  if (this.inputPanel)  {
    this.inputPanel.setSize_px ( panelWidth,panelHeight );
    if (this.inputPanel.hasOwnProperty('panel'))  {
      if (this.inputPanel.hasOwnProperty('header'))
        panelHeight -= this.inputPanel.header.height_px();
      this.inputPanel.panel.setSize_px ( panelWidth,panelHeight );
    }
    this.task.inputPanelResize ( this.inputPanel,panelWidth,panelHeight );
  }

  if (this.outputPanel)
    this.outputPanel.setSize_px ( panelWidth,panelHeight );

}


JobDialog.prototype.setDlgSize = function()  {
  if (__any_mobile_device)  {
    this.setSize_px ( this.initialWidth,this.initialHeight );
  } else  {
    if (this.task.job_dialog_data.height<=0)  {
      this.task.job_dialog_data.width  = this.width_px();
      this.task.job_dialog_data.height = this.initialHeight;
    }
    this.setSize_px ( this.task.job_dialog_data.width,this.task.job_dialog_data.height );
  }
  this.onDlgResize();
}

JobDialog.prototype.close = function()  {
  this.delete();
  // if (this._created)  {
  //   // $(this.element).dialog ( 'close' );
  //   $(this.element).dialog( 'destroy' );
  //   this._created = false;
  // }
}


JobDialog.prototype.hide = function()  {
  $(this.element).parent().hide();
}

JobDialog.prototype.show = function()  {
  $(this.element).parent().show();
}


JobDialog.prototype.loadReport = function()  {
  if (this.outputPanel)  {  // check because the function may be called from outside
    let reportURL;
    if ((this.task.nc_type=='client') && (this.task.state==job_code.running) &&
        __local_service && this.task.job_dialog_data.job_token)  {
      reportURL = __special_url_tag + '/' +
                  this.task.job_dialog_data.job_token + '/' +
                  this.task.getLocalReportPath();
      reportURL = __local_service + '/' + reportURL;
      //reportURL = __special_client_tag + '/' + reportURL;
    } else
      reportURL = this.task.getReportURL();
    if (__local_service)
      reportURL += '?local_service';
    this.outputPanel.loadPage ( reportURL );
  }
}

JobDialog.prototype.reloadReport = function()  {
  if (this.outputPanel)  // check because the function may be called from outside
    this.outputPanel.reload();
}

JobDialog.prototype.collectTaskData = function ( ignore_bool )  {
  this.getDlgSize ();
  let input_msg = '';
  if ((this.task.state==job_code.new) || (this.task.state==job_code.remark) ||
      (this.task.state==job_code.remdet))  {
    input_msg = this.task.collectInput ( this.inputPanel );
    if (ignore_bool)
      input_msg = '';
    else if (input_msg.length>0)
      this.displayInputErrors ( input_msg );
    if ((this.task.state==job_code.new) && (input_msg.length>0))
      this.job_edited = true;
  }
  if (this.autorun_cbx)  {
    if (this.autorun_cbx.getValue())
          this.task.autoRunId = this.task.autoRunId0;
    else  this.task.autoRunId = '';
  }
  return (input_msg.length<=0);
}


JobDialog.prototype.requestServer = function ( request,callback_ok )  {
  let data  = {};
  data.meta = this.task;
  data.ancestors = [];
  if (this.tree.projectData)  data.is_shared = this.tree.isShared();
                        else  data.is_shared = false;
  for (let i=1;i<this.ancestors.length;i++)
    data.ancestors.push ( this.ancestors[i]._type );
  if (!this.task.job_dialog_data.viewed)  {
    this.onDlgSignal_func ( this,job_dialog_reason.reset_node,null );
    this.task.job_dialog_data.viewed = true;
    this.job_edited = true;
  }
  data.update_tree = this.job_edited && data.is_shared;
  serverRequest ( request,data,this.task.title,callback_ok,null,null );
}


JobDialog.prototype.saveJobData = function()  {
  let dlg = this;
  this.requestServer   ( fe_reqtype.saveJobData,function(rdata){
    if (rdata.project_missing)  {
      new MessageBoxF ( 'Project not found',
          '<h3>Project "' + dlg.tree.projectData.desc.name +
            '" is not found on server</h3>' +
          'Project "' + dlg.tree.projectData.desc.name +
            '" was shared with you, please check<br>' +
          'whether it was deleted by project owner.',
          'Ok',function(){
              dlg.tree.emitSignal ( cofe_signals.makeProjectList,rdata );
          },false,'msg_error'
      );
    }
  });
}


//window.document.__base_url_cache = {};

JobDialog.prototype.addToolBarButton = function ( gap,icon,tooltip )  {
//  if (gap)
//    this.toolBar.setLabel ( '', 0,this.col++, 1,1 ).setWidth_px ( 1 );
let btn = this.toolBar.setButton ( '',image_path(icon), 0,this.col++, 1,1 )
                      .setSize('40px','34px').setTooltip(tooltip);
  if (gap)
    btn.setMargins ( '4px','','','' );
  return btn;
}

JobDialog.prototype.makeToolBar = function()  {

  this.toolBar = new Grid('');

  this.col = 2;

  let dlg = this;

  if (this.task.runButtonName())  {
    this.radioSet = this.toolBar.setRadioSet(0,0,1,1)
            .addButton('Input' ,'input' ,'',this.task.job_dialog_data.panel=='input' )
            .addButton('Output','output','',this.task.job_dialog_data.panel=='output');
    // (function(dlg){
      $(dlg.outputPanel.element).on ( 'load',function(){
        dlg.onDlgResize();
        //dlg.outputPanel.getDocument().__url_path_prefix = dlg.task.getURL('');
      });
      dlg.radioSet.make ( function(btnId){
        dlg.inputPanel.setVisible ( (btnId=='input' ) );
        dlg.outputPanel.setVisible ( (btnId=='output') );
        dlg.task.job_dialog_data.panel = btnId;
        dlg.onDlgResize();  // this is needed for getting all elements in
                            // inputPanel available by scrolling, in case
                            // when dialog first opens for 'output'
        // if dialog was created in input mode, check whether report
        // page should be loaded at first switch to output mode
        if (dlg.outputPanel.element.src.length<=0)
          dlg.loadReport();
      });
    // }(this));
    this.radioSet.setSize ( '220px','' );

    if (!this.inputPanel.fullVersionMismatch)  {
      this.run_btn  = this.toolBar.setButton ( this.task.runButtonName(),
                                               image_path('runjob'), 0,this.col++, 1,1 )
                                  .setTooltip  ( 'Start job' )
                                  .setDisabled ( !this.dlg_active );
      // if (this.task.canRunInAutoMode())
      if (('autoRunId0' in this.task) && (this.task.autoRunId0.length>0))  {
        this.autorun_cbx = this.toolBar.setCheckbox ( 'Keep auto',
                                    (this.task.autoRunId.length>0),0,this.col++, 1,1 )
                               .setTooltip  ( 'Check to start an automatic workflow' )
                               .setDisabled ( !this.dlg_active );
        // (function(dlg){
          dlg.autorun_cbx.addOnClickListener ( function(){
            if (dlg.autorun_cbx.getValue())
                  dlg.task.autoRunId = dlg.task.autoRunId0;
            else  dlg.task.autoRunId = '';
            dlg.inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                        job_dialog_reason.rename_node );
          });
        // }(this));
      }
    }

  }

  this.toolBar.setCellSize ( '35%','',0,1 );

  this.run_image = this.toolBar.setImage  ( activityIcon(),'36px','36px',
                                            0,this.col++, 1,1 );
  if (this.task.canEndGracefully())
    this.end_btn = this.toolBar.setButton ( 'End',image_path('endjob'),
                                           0,this.col++, 1,1 )
                               .setTooltip('End the job gracefully. This may take ' +
                                           'a while, but already obtaned results '  +
                                           'will be made available for subsequent ' +
                                           'jobs. Once ended, a job cannot ' +
                                           'be resumed' );
  else
    this.end_btn = null;
  this.stop_btn = this.toolBar.setButton ( 'Stop',image_path('stopjob'),
                                           0,this.col++, 1,1 )
                              .setTooltip('Stop the job immediately. Obtained '  +
                                          'results will be kept for inspection ' +
                                          'but unavailable for subsequent jobs.');

  // (function(dlg){
    let hot_list = dlg.task.hotButtons();
    let gap      = false;
    let dBox     = null;
//    let branch_task_list = self.tree.getAllAncestors ( tree.getSelectedTask() );
    for (let i=0;i<hot_list.length;i++)  {
      let task_obj  = eval ( 'new ' + hot_list[i].task_name + '()' );
      let avail_key = task_obj.isTaskAvailable();
      if (avail_key[0]=='ok')  {
        if (!dBox)
          dBox = dlg.tree.harvestTaskData ( 1,[] );
        if (dBox.getDataSummary(task_obj).status>0)  {
          task_obj.hot_launch = true;  // signal that the task is launched from hpt button
          (function(task){
            let hbtn = dlg.addToolBarButton ( gap,task_obj.icon(),hot_list[i].tooltip )
                          .addOnClickListener ( function(){
                            dlg.onDlgSignal_func ( dlg,job_dialog_reason.run_job,
                                                   task );
                          });
            hbtn.task_name = hot_list[i].task_name;
            hbtn.task      = task;
            gap = true;
            dlg.hot_btn.push ( hbtn );
          }(task_obj))
        }
      }
    }
    dlg.addjob_btn = dlg.addToolBarButton ( gap,'add_repeat','Add next job with last used parameters' )
                        .addOnClickListener ( function(){
                          dlg.onDlgSignal_func ( dlg,job_dialog_reason.add_job,
                                                 null );
                        });
    gap = true;
    dlg.clone_btn  = dlg.addToolBarButton ( gap,'clonejob','Clone this job' )
                        .addOnClickListener ( function(){
                          dlg.onDlgSignal_func ( dlg,job_dialog_reason.clone_job,
                                                 null );
                          return false;  // preent default
                        });
  // }(this))

  if (this.task.getHelpURL())
    this.ref_btn = this.addToolBarButton  ( true,'reference','Task Documentation'   );

  this.toolBar.setLabel  ( '&nbsp;&nbsp;', 0,this.col, 1,1 ).setNoWrap();
  this.toolBar.setCellSize ( '45%','',0,this.col++ );

  this.newtab_btn = this.addToolBarButton  ( false,'new_tab' ,'Open in new tab or window' );
  this.export_btn = this.addToolBarButton  ( false,'export'  ,'Download job data' );
  this.help_btn   = this.addToolBarButton  ( true,'help'     ,'Dialog Help'          );
  this.close_btn  = this.toolBar.setButton ( 'Close',image_path('close'), 0,this.col, 1,1 )
                                .setMargins ( '4px','','','' )
                                .setTooltip('Close Job Dialog' );

}

JobDialog.prototype.runHotButtonJob = function ( task_name,options )  {
  let n = -1;
  for (let i=0;(i<this.hot_btn.length) && (n<0);i++)
    if (this.hot_btn[i].task_name==task_name)
      n = i;
  if (n>=0)  {
    if (options && options.prevent_autostart)
      this.hot_btn[n].task.prevent_autostart = options.prevent_autostart;
    this.hot_btn[n].click();
  } else
    new MessageBox ( 
      'Error',
      '<div style="width:300px"><h2>Error</h2>' +
      '<i>Cannot find task to run. ' +
      'This is a bug, please report</div>',
      'msg_error' 
    );
}

JobDialog.prototype.enableCloseButton = function ( do_close )  {
  let dlg = this;
  window.setTimeout ( function(){
    if (dlg.parent_page.can_reload)  {
      dlg.close_btn.setDisabled ( false );
      if (do_close && dlg.task.autoRunId)
        dlg.close_btn.click();
    } else
      dlg.enableCloseButton();
  },2000);
}

JobDialog.prototype.onWindowResize = function()  {
  this.task.job_dialog_data.width  = this.width_px();
  if (!__any_mobile_device)  {
    this.task.job_dialog_data.height = this.height_px();
    this.onDlgResize();
  }
}

JobDialog.prototype.makeLayout = function ( onRun_func )  {

  let dlg = this;

  this.outputPanel = new IFrame ( '' );  // always initially empty
  //this.outputPanel.setWidth ( '100%' );
  //$(this.outputPanel.element).css({'overflow':'hidden'});
//  "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:92%;\"></iframe>",

  if (this.task.state!=job_code.remdoc)  {
    this.outputPanel.setFramePosition ( '16px','58px','100%','100%' );

    this.inputPanel = this.task.makeInputPanel ( this.dataBox );
    this.inputPanel.job_dialog = this;

    this.makeToolBar();

    this.addWidget ( this.toolBar );
    this.toolBarSep = new HLine('2px');
    this.addWidget ( this.toolBarSep  );
    this.addWidget ( this.inputPanel  );
    this.addWidget ( this.outputPanel );

  } else  {
    this.outputPanel.setFramePosition ( '16px','8px','100%','100%' );

    this.inputPanel  = null;
    this.toolBar     = null;
    this.toolBarSep  = null;
    this.radioSet    = null;
    this.run_btn     = null;
    this.autorun_cbx = null;
    this.run_image   = null;
    this.addjob_btn  = null;
    this.clone_btn   = null;
    this.stop_btn    = null;
    this.end_btn     = null;
    this.newtab_btn  = null;
    this.export_btn  = null;
    this.ref_btn     = null;
    this.help_btn    = null;
    this.close_btn   = null;

    this.addWidget ( this.outputPanel );
    // (function(dlg){
      $(dlg.outputPanel.element).on ( 'load',function(){
        dlg.onDlgResize();
      });
    // }(this));

  }

  if ((this.task.state!='new') && (this.task.job_dialog_data.panel=='output') &&
      (this.outputPanel.getURL().length<=0))
    this.loadReport();

  if (this.inputPanel)
    this.inputPanel.setVisible ( this.task.job_dialog_data.panel=='input' );
  this.outputPanel.setVisible ( this.task.job_dialog_data.panel=='output' );

  // (function(dlg){

    // Listen for input event, emitted when input data changes
    if (dlg.run_btn && dlg.inputPanel)
      dlg.inputPanel.element.addEventListener(cofe_signals.taskReady,function(e){
        //alert ( ' run_btn=' + e.detail + ' l=' + e.detail.length );
// console.log ( ' run_btn=' + e.detail + ' l=' + e.detail.length );
          
        if (!dlg.dlg_active)  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        } else if (e.detail.length<=0)  {
          dlg.run_btn.setEnabled ( dlg.dlg_active );
          if (dlg.autorun_cbx)
            dlg.autorun_cbx.setEnabled ( dlg.dlg_active );
          dlg.close_btn.setEnabled ( true );
        } else if (e.detail=='hide_run_button')  {
          dlg.run_btn.setEnabled ( false );
          if (dlg.autorun_cbx)
            dlg.autorun_cbx.setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        } else if (e.detail=='show_run_button')  {
          dlg.run_btn.setEnabled ( true );
          if (dlg.autorun_cbx)
            dlg.autorun_cbx.setEnabled ( true );
          dlg.close_btn.setEnabled ( true  );
        } else if (e.detail=='upload_started')  {
          dlg.run_btn.setEnabled ( false );
          if (dlg.autorun_cbx)
            dlg.autorun_cbx.setEnabled ( false );
          dlg.close_btn.setEnabled ( false );
        } else if (e.detail=='upload_finished')  {
          dlg.run_btn.setEnabled ( dlg.dlg_active );
          if (dlg.autorun_cbx)
            dlg.autorun_cbx.setEnabled ( dlg.dlg_active );
          dlg.close_btn.setEnabled ( true );
        } else  {
          dlg.run_btn.setEnabled ( false );
          if (dlg.autorun_cbx)
            dlg.autorun_cbx.setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        }
      },false );

    $(dlg.element).on ( 'dialogresize', function(event,ui){
      dlg.onWindowResize();
      // dlg.task.job_dialog_data.width  = dlg.width_px();
      // if (!__any_mobile_device)  {
      //   dlg.task.job_dialog_data.height = dlg.height_px();
      //   dlg.onDlgResize();
      // }
    });

    if (dlg.run_btn)  {

      dlg.run_btn.addOnClickListener ( function(){

        let avail_key = dlg.task.isTaskAvailable();
        if (avail_key[0]!='ok')  {

          new MessageBox ( 'The task cannot be run',avail_key[2], 'msg_warning' );

        } else  {

          dlg.close_btn.setDisabled ( true );
          serverRequest ( fe_reqtype.getUserRation,{ topup : true },'User Ration',
            function(rdata){   // on success

              let pdesc  = dlg.parent_page.ration.pdesc;
              let ration = rdata.ration;
              dlg.parent_page.ration = ration;
              dlg.parent_page.displayUserRation ( pdesc );
              // console.log ( ration.storage );

              // dlg.parent_page.ration = ration;
              // dlg.parent_page.displayUserRation ( dlg.tree.projectData.desc );

              let tiplink = ' <a href="javascript:launchHelpBox1(\'Project storage\',' +
                            '\'' + __user_guide_base_url + 
                            'jscofe_tips.store_completed_projects.html\',null,10)">' +
                            '<span style="color:blue">here</span>.';

              if (ration && (!__local_setup))  {
                if ((ration.storage>0.0) && (ration.storage_used>=ration.storage))  {
                  new MessageBox ( 'Disk Quota Exceeded',
                      '<div style="width:520px;"><h2>Disk Quota Exceeded</h2>' +
                      'The job cannot be run because disk quota is up and cannot ' +
                      'be automatically increased. Your account currently uses<p>' +
                      '<b style="font-size:120%;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                      '&nbsp;&nbsp;&nbsp;&nbsp;' + round(ration.storage_used,1) + 
                      ' MBytes at ' + round(ration.storage,1) + ' MBytes allocated.</b><p>' +
                      '<i><b>Hint 1:</b></i> deleting jobs and projects will free up disk space.<p>' +
                      '<i><b>Hint 2:</b></i> resource usage can be monitored using disk and ' +
                      'CPU widgets in the top-right corner of the screen.<p>' +
                      '<i><b>Recommended action:</b></i> export an old project and then ' +
                      'delete it from the list. You will be able to re-import that ' +
                      'project later using the file exported.' +
                      '<p><i>Read about disk space and project management in ' +
                      appName() + tiplink + '</i></div>', 'msg_excl' );
                  dlg.enableCloseButton ( false );
                  return;
                }
                if ((ration.cpu_day>0.0) && (ration.cpu_day_used>=ration.cpu_day))  {
                  new MessageBox ( '24-hour CPU Quota Exceeded',
                      '<div style="width:520px;"><h2>24-hour CPU Quota Exceeded</h2>' +
                      'The job cannot be run because your 24-hour CPU quota is up. ' +
                      'In last 24 hours, you have used<p>' +
                      '<b style="font-size:120%;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                      round(ration.cpu_day_used,3) + ' CPU hours at ' + 
                      round(ration.cpu_day,3) + ' CPU hours allocated.</b><p>' +
                      '<i><b>Hint:</b></i> resource usage can be monitored using ' +
                      'disk and CPU widgets in the top-right corner of the screen. ' +
                      'You may need to push the <i>"Reload"</i> button in the ' +
                      'toolbar after periods of inactivity to get updated readings.<p>' +
                      '<i><b>Recommended action:</b></i> run the job later or ask ' +
                      appName() + ' maintainer to increase your 24-hour CPU quota.', 
                      'msg_excl' );
                  dlg.enableCloseButton ( false );
                  return;
                }
                if ((ration.cpu_month>0.0) && (ration.cpu_month_used>=ration.cpu_month))  {
                  new MessageBox ( '30-day CPU Quota Exceeded',
                      '<div style="width:520px;"><h2>30-day CPU Quota Exceeded</h2>' +
                      'The job cannot be run because your 30-day CPU quota is up. ' +
                      'In last 30 days, you have used<p>' +
                      '<b style="font-size:120%;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                      round(ration.cpu_month_used,3) + ' CPU hours at ' + 
                      round(ration.cpu_month,3) + ' CPU hours allocated.</b><p>' +
                      '<i><b>Hint:</b></i> resource usage can be monitored using ' +
                      'disk and CPU widgets in the top-right corner of the screen. ' +
                      'You may need to push the <i>"Reload"</i> button in the ' +
                      'toolbar after periods of inactivity to get updated readings.<p>' +
                      '<i><b>Recommended action:</b></i> run the job later or ask ' +
                      appName() + ' maintainer to increase your 30-day CPU quota.', 
                      'msg_excl');
                  dlg.enableCloseButton ( false );
                  return;
                }
              }

              if (rdata.code=='topup')  {
                dlg.parent_page.ration = ration;
                dlg.parent_page.makeUserRationIndicator();        
                window.setTimeout ( function(){
                  new MessageBox ( 'Disk Quota Increased',
                      '<div style="width:400px;"><h2>Disk quota increased</h2>' +
                      'Your disk quota was automatically increased to<p>' +
                      '<b style="font-size:120%;">&nbsp;&nbsp;&nbsp;&nbsp;' +
                      '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                      '&nbsp;&nbsp;&nbsp;' + round(ration.storage,1) +
                      ' MBytes</b><p>Enjoy! Just push "Ok" to proceed.' + 
                      '<p><i><b>Important:</b> cleaning your ' + appName() + 
                      ' disk space will be necessary at some point. Read about ' +
                      'disk space and project management' + tiplink + '</i></div>',
                      'msg_information' );  
                },500);
              }

              if (dlg.collectTaskData(false))  {

                if (dlg.task.autoRunId)
                  dlg.tree.projectData.desc.autorun = true;
                  // dlg.parent_page.job_tree.projectData.desc.autorun = true;

                // dlg.close_btn.setDisabled ( false );
                dlg.task.doRun ( dlg.inputPanel,function(){

                  // dlg.close_btn.setDisabled ( true );
                  dlg.task.job_dialog_data.panel = 'output';
                  dlg.task.state = job_code.running;
                  dlg.outputPanel.clear();
                  dlg.setDlgState();

                  dlg.requestServer ( fe_reqtype.runJob,function(rdata){

                    addWfKnowledge ( dlg.task,dlg.ancestors.slice(1) );
                    dlg.tree.projectData.desc.timestamp = rdata.timestamp;

                    if (dlg.task.nc_type=='client')  {

                      dlg.task.job_dialog_data.job_token = rdata.job_token;
                      let data_obj       = {};
                      data_obj.job_token = rdata.job_token;
                      data_obj.feURL     = getFEURL();
                      data_obj.dnlURL    = dlg.task.getURL ( rdata.jobballName );
                      localCommand ( nc_command.runClientJob,data_obj,'Run Client Job',
                        function(response){
                          dlg.task.postSubmit();
                          if (!response)  {
                            dlg.close_btn.setDisabled ( false );
                            return false;  // issue standard AJAX failure message
                          }
                          if (response.status!=nc_retcode.ok)  {
                            new MessageBox ( 'Run Client Job',
                              '<p>Launching local application ' + dlg.task.name +
                              ' failed due to:<p><i>' + response.message +
                              ' (code="' + response.status + '")</i><p>' +
                              'Please report this as possible bug to <a href="mailto:' +
                              __maintainerEmail + '">' + __maintainerEmail + '</a>' );
                          } else  {
                            dlg.loadReport();
                            dlg.radioSet.selectButton ( 'output' );
                            onRun_func ( dlg );
                            dlg.enableCloseButton ( true );
                          }
                          return true;
                        });

                    } else if (dlg.nc_browser)  {

                      dlg.task.job_dialog_data.job_token = rdata.job_token;

                      // dlg.enableCloseButton ( false );
                      dlg.close_btn.setDisabled ( true );

                      dlg.task.launchWebApp ( function(was_output,jobName){
                        if (was_output)  {
                          dlg.requestServer ( fe_reqtype.webappEndJob,function(rdata){
                            dlg.show();
                            // dlg.setVisible ( true );
                            // dlg.task.postSubmit();
                            // dlg.loadReport();
                            // dlg.radioSet.selectButton ( 'output' );
                            // onRun_func ( dlg );
                            dlg.enableCloseButton ( true );    
                          });
                        } else  {
                          dlg.task.state = job_code.finished;
                          dlg.tree.selectSingle ( dlg.tree.node_map[dlg.nodeId] );
                          dlg.tree.deleteJob    ( true,function(){
                            new MessageBox ( 'Job deleted',
                              '<div style="350px"><h2>Job deleted</h2>' +
                              jobName + ' produced no results, job deleted automatically',
                              'msg_ok'
                            );
                          });
                        }
                      });

                      dlg.loadReport();
                      dlg.radioSet.selectButton ( 'output' );
                      onRun_func ( dlg );
                      if (dlg.stop_btn)
                        dlg.stop_btn.setVisible ( false );
                      // dlg.setVisible ( false );
                      dlg.hide();

                    } else  {
                      dlg.task.postSubmit();
                      dlg.loadReport();
                      dlg.radioSet.selectButton ( 'output' );
                      onRun_func ( dlg );
                      dlg.enableCloseButton ( true );
                    }

                  });

                });

              } else  // collectTaskData() did not succeed, data is not complete/ready
                dlg.close_btn.setDisabled ( false );

            },
            null,    // always (nothing)
            function(){   // on failure/errors
              dlg.close_btn.setDisabled ( false );
            });

        }

      });

    }

    if (dlg.stop_btn)
      dlg.stop_btn.addOnClickListener ( function(){
        dlg.onDlgSignal_func ( dlg,job_dialog_reason.stop_job,null );
      });

    if (dlg.end_btn)
      dlg.end_btn.addOnClickListener ( function(){
        dlg.onDlgSignal_func ( dlg,job_dialog_reason.end_job,null );
      });

    if (dlg.newtab_btn)
      dlg.newtab_btn.addOnClickListener ( function(){
        //if (dlg.outputPanel)
        //  window.open ( dlg.outputPanel.getURL(),'_blank',
        //                'location=no,menubar=no,titlebar=no,toolbar=no' );
        if (dlg.outputPanel)  {
          let iframe =
            '<!DOCTYPE html>\n<html><head>' +
            '<style>body, html {' +
                   'width: 100%; height: 100%; margin: 0; padding: 0}' +
            '</style>' +
            '<title>'  + dlg.task.project + ':[' + padDigits(dlg.task.id,4) +
                         '] ' + dlg.task.title +
            '</title>' +
            '<script>let __user_settings=' + JSON.stringify(__user_settings) +
            ';</script>' +
            '</head><body>' +
            '<iframe src="' + dlg.outputPanel.getURL() +
                '" style="height:calc(100% - 4px);width:calc(100% - 4px)">' +
            '</iframe></body></html>';
          let win = window.open ( "",'' );
//                            "toolbar=no,menubar=no,resizable=yes,location=no" );
          win.document.write ( iframe );
        }
      });

    if (dlg.export_btn)
      dlg.export_btn.addOnClickListener ( function(){
        new ExportJobDialog ( dlg.task );
      });

    if (dlg.task.getHelpURL() && dlg.ref_btn)
      dlg.ref_btn.addOnClickListener ( function(){
        new HelpBox ( '',dlg.task.getHelpURL(),null );
      });

    if (dlg.help_btn)
      dlg.help_btn.addOnClickListener ( function(){
        new HelpBox ( '',__user_guide_base_url + 'jscofe_jobdialog.html',null );
      });

    if (dlg.close_btn)
      dlg.close_btn.addOnClickListener ( function(){
        if ((dlg.task.state!=job_code.running) &&
            (dlg.task.state!=job_code.ending)  &&
            (dlg.task.state!=job_code.exiting) &&
            (!dlg.tree.view_only))  {
          dlg.collectTaskData ( true );
          dlg.saveJobData();
          // dlg.requestServer   ( fe_reqtype.saveJobData,function(rdata){
          //   if (rdata.project_missing)  {
          //     new MessageBoxF ( 'Project not found',
          //         '<h3>Project "' + dlg.tree.projectData.desc.name +
          //            '" is not found on server</h3>' +
          //         'Project "' + dlg.tree.projectData.desc.name +
          //            '" was shared with you, please check<br>' +
          //         'whether it was deleted by project owner.',
          //         'Ok',function(){
          //             dlg.tree.emitSignal ( cofe_signals.makeProjectList,rdata );
          //         },false,'msg_error'
          //     );
          //   }
          // });
        }
        dlg.task.onJobDialogClose(dlg,function(close_bool){
          if (close_bool)
            dlg.close();
            // $(dlg.element).dialog ( "close" );
        });
      });

  // }(this));

}
