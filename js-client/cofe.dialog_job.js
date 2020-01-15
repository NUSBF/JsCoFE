
/*
 *  =================================================================
 *
 *    15.01.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// JobDialog class

var job_dialog_reason = {
  rename_node   : 'rename_node',    // rename job node
  set_node_icon : 'set_node_icon',  // set    job node icon
  reset_node    : 'reset_node',     // reset  job node label
  select_node   : 'select_node',    // select job node
  stop_job      : 'stop_job',       // stop job
  tree_updated  : 'tree_updated'    // job tree should be updated
}

function JobDialog ( params,          // data and task projections up the tree branch
                     parent_page,     // current page (parent_page.ration is used)
                     onRun_func,      // function(taskId) called when 'run' is pressed
                     onClose_func,    // function(taskId) called upon close event
                     onDlgSignal_func // function(taskId,reason) called on custom events
                   ) {

  this.task        = params.ancestors[0];
  this.dataBox     = params.dataBox;
  this.ancestors   = params.ancestors;
  this.parent_page = parent_page;

  Widget.call ( this,'div' );

  var title = '[' + padDigits(this.task.id,4) + '] '
  if (this.task.uname.length>0)  title += this.task.uname;
                           else  title += this.task.name;
  this.element.setAttribute ( 'title',strip_html_tags(title) );

  $(this.element).css({'box-shadow':'8px 8px 16px 16px rgba(0,0,0,0.2)',
                       'overflow':'hidden'});
  document.body.appendChild ( this.element );

  this.inputPanel  = null;
  this.outputPanel = null;
  this.run_btn     = null;
  this.run_image   = null;
  this.ind_timer   = null;

  /*
  var w0 = $(window).width ();
  var h0 = $(window).height();

  var w = 2*w0;
  if (this.task.job_dialog_data.width>0)
    w = this.task.job_dialog_data.width;

  this.initialHeight = 2*h0;
  if (this.task.job_dialog_data.height>0)
    this.initialHeight = this.task.job_dialog_data.height;

  if ((w>=w0) || (this.initialHeight>=h0))  {
    w = 3*w0/4;
    this.initialHeight = 3*h0/4;
    this.task.job_dialog_data.position = { my : 'center top',   // job dialog position reference
                                           at : 'center top+5%' }; // job dialog offset in the screen
    this.task.job_dialog_data.width  = 0;
    this.task.job_dialog_data.height = 0;
  }
  w += 'px';
  */

  var size = calcDialogSize ( 0.75,0.75, 1,1, this.task.job_dialog_data );
  this.initialWidth  = size[0];
  this.initialHeight = size[1];

  var taskId = this.task.id;
  this.dialog_options = {
      resizable : true,
      //height    : 'auto',
      //width     : w,
      width     : size[0],
      height    : size[1],
      buttons   : {},
      open      : function(event, ui) {
        if (__any_mobile_device)
          $(this).siblings('.ui-dialog-titlebar').remove();
      },
      focus     : function() {
                    if (onDlgSignal_func)
                      onDlgSignal_func ( taskId,job_dialog_reason.select_node );
                  }
  };

  if (__any_mobile_device)
    this.dialog_options.position =  { my : 'left top',   // job dialog position reference
                                      at : 'left top' }; // job dialog offset in the screen
  else
    this.dialog_options.position = this.task.job_dialog_data.position;

  this.makeLayout ( onRun_func );

  var dialog = $(this.element).dialog ( this.dialog_options );
  //if (__any_mobile_device)
  //  dialog.siblings('.ui-dialog-titlebar').remove();

  this.setDlgState();
  this.setDlgSize ();

  (function(dlg){
    $(dlg.element).on( "dialogclose",function(event,ui){
      if (dlg.close_btn && (!dlg.task.job_dialog_data.viewed))
        dlg.close_btn.click();
      else  {
        dlg.outputPanel.clear();
        //onClose_func(dlg.task.id);
        window.setTimeout ( function(){
          $(dlg.element).dialog( "destroy" );
          dlg.delete();
        },10 );
      }
      onClose_func ( dlg.task.id );
    });
  }(this))

  // Listen for input event, emitted when input data changes
  if ((this.task.state!=job_code.running) && this.inputPanel)  {
    this.inputPanel.element.addEventListener(cofe_signals.jobDlgSignal,function(e){
      onDlgSignal_func ( taskId,e.detail );
    },false );
  }

  this.onDlgSignal_func = onDlgSignal_func;

  this.task.updateInputPanel ( this.inputPanel );

}


JobDialog.prototype = Object.create ( Widget.prototype );
JobDialog.prototype.constructor = JobDialog;


JobDialog.prototype.changeTitle = function ( new_title )  {
  var title = '[' + padDigits(this.task.id,4) + '] ' + new_title;
  $(this.element).dialog({ title: title });
}

JobDialog.prototype.displayInputErrors = function ( input_msg )  {
//  if (input_msg.startsWith('#'))  {
  if (input_msg[0]=='#')  {
    new MessageBox ( 'Input errors',input_msg.substring(1) );
  } else  {
    new MessageBox ( 'Input errors',
      'The following errors have been encountered at processing input parameters:' +
      '<p><ul>' + input_msg.split('<b>').join('<li><b>') +
      '</ul><p>Please adjust input parameters as appropriate.' );
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

  var isNew     = (this.task.state==job_code.new)    ||
                  (this.task.state==job_code.remark) ||
                  (this.task.state==job_code.remdet);
  var isRunning = (this.task.state==job_code.running);

  if (this.inputPanel)  {
    this.inputPanel.setDisabledAll ( !isNew );
    this.task.disableInputWidgets  ( this.inputPanel,!isNew );
  }
  if (this.radioSet)
    this.radioSet.setDisabled ( isNew  );
  if (this.run_btn)  {
    this.run_btn.setVisible  ( isNew     );
    this.run_btn.setDisabled ( __dormant );
  }

  if (this.ind_timer)
    window.clearTimeout ( this.ind_timer );

  if (isRunning && (!this.stop_btn.isVisible()))  {
    (function(dlg){
      dlg.ind_timer = window.setTimeout ( function(){
        if (dlg.run_image) dlg.run_image.setVisible ( true );
        if (dlg.stop_btn)  dlg.stop_btn .setVisible ( true );
      },1000 );
    }(this));
  } else  {
    if (this.run_image) this.run_image.setVisible ( isRunning );
    if (this.stop_btn)  this.stop_btn .setVisible ( isRunning );
  }

  if (this.status_lbl)
    this.status_lbl.setVisible  ( (!isNew) && (!isRunning) );

  var msg = '';
  switch (this.task.state)  {
    case job_code.finished :  msg = 'Job completed';          break;
    case job_code.failed   :  msg = 'Job failed';             break;
    case job_code.stopped  :  msg = 'Job terminated by user'; break;
    /*
    case job_code.remdoc   :  this.toolBar   .setVisible ( false );
                              this.toolBarSep.setVisible ( false );
                          break;
    */
    default : ;
  }

  if (msg && this.status_lbl)
    this.status_lbl.setText ( '<b><i>' + msg + '</i></b>' );
  if (this.export_btn)
    this.export_btn.setVisible ( msg!='' );

  if (isNew)  { // enforce!
    this.outputPanel.setVisible ( false );
    this.inputPanel .setVisible ( true  );
    this.task.job_dialog_data.panel = 'input';
  } else if ((!isRunning) && __local_service &&
             startsWith(this.outputPanel.getURL(),__local_service))
//             (this.outputPanel.getURL().startsWith(__local_service)))
    this.loadReport();

}

JobDialog.prototype.getDlgSize = function ()  {
  if (!__any_mobile_device)  {
    this.task.job_dialog_data.width  = this.width_px ();
    this.task.job_dialog_data.height = this.height_px();
    var p = $(this.element).dialog ( "option", "position" );
    this.task.job_dialog_data.position.my = p.my;
    this.task.job_dialog_data.position.at = p.at;
  }
}


JobDialog.prototype.onDlgResize = function ()  {

  //if (__any_mobile_device)
  //  return;

  var panelHeight;
  var panelWidth;
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
    this.inputPanel .setSize_px ( panelWidth,panelHeight );
    if (this.inputPanel.hasOwnProperty('panel'))  {
      if (this.inputPanel.hasOwnProperty('header'))
        panelHeight -= this.inputPanel.header.height_px();
      this.inputPanel.panel.setSize_px ( panelWidth,panelHeight );
    }
  }

  this.outputPanel.setSize_px ( panelWidth,panelHeight );
  //this.outputPanel.setSize ( panelWidth+'px',panelHeight+'px' );

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
  $(this.element).dialog ( 'close' );
}

JobDialog.prototype.loadReport = function()  {
  var reportURL;
  if ((this.task.nc_type=='client') && (this.task.state==job_code.running) &&
      __local_service && this.task.job_dialog_data.job_token)  {
        reportURL = special_url_tag + '/' +
                    this.task.job_dialog_data.job_token + '/' +
                    this.task.getLocalReportPath();
        reportURL = __local_service + '/' + reportURL;
  } else
    reportURL = this.task.getReportURL();
  this.outputPanel.loadPage ( reportURL );
}


JobDialog.prototype.collectTaskData = function ( ignore_bool )  {
  this.getDlgSize ();
  var input_msg = '';
  if ((this.task.state==job_code.new) || (this.task.state==job_code.remark) ||
      (this.task.state==job_code.remdet))  {
    input_msg = this.task.collectInput ( this.inputPanel );
    if (ignore_bool)
      input_msg = '';
    else if (input_msg.length>0)
      this.displayInputErrors ( input_msg );
  }
  return (input_msg.length<=0);
}


JobDialog.prototype.requestServer = function ( request,callback_ok )  {
  var data  = {};
  data.meta = this.task;
  data.ancestors = [];
  for (var i=1;i<this.ancestors.length;i++)
    data.ancestors.push ( this.ancestors[i]._type );
  if (!this.task.job_dialog_data.viewed)  {
    this.onDlgSignal_func ( this.task.id,job_dialog_reason.reset_node );
    this.task.job_dialog_data.viewed = true;
  }
  serverRequest ( request,data,this.task.title,callback_ok,null,null );
}

window.document.__base_url_cache = {};

JobDialog.prototype.makeLayout = function ( onRun_func )  {

  this.outputPanel = new IFrame ( '' );  // always initially empty
  //this.outputPanel.setWidth ( '100%' );
  //$(this.outputPanel.element).css({'overflow':'hidden'});
//  "style=\"border:none;position:absolute;top:50px;left:0;width:100%;height:92%;\"></iframe>",

  if (this.task.state!=job_code.remdoc)  {
    this.outputPanel.setFramePosition ( '16px','58px','100%','100%' );

    this.inputPanel = this.task.makeInputPanel ( this.dataBox );
    this.inputPanel.job_dialog = this;

    this.toolBar = new Grid('');
    this.addWidget ( this.toolBar );
    this.toolBarSep = new HLine('2px');
    this.addWidget ( this.toolBarSep  );
    this.addWidget ( this.inputPanel  );
    this.addWidget ( this.outputPanel );

    if (this.task.runButtonName())  {
      this.radioSet = this.toolBar.setRadioSet(0,0,1,1)
              .addButton('Input' ,'input' ,'',this.task.job_dialog_data.panel=='input' )
              .addButton('Output','output','',this.task.job_dialog_data.panel=='output');
      (function(dlg){
        $(dlg.outputPanel.element).on ( 'load',function(){
          dlg.onDlgResize();
          //dlg.outputPanel.getDocument().__url_path_prefix = dlg.task.getURL('');
        });
        dlg.radioSet.make ( function(btnId){
          dlg.inputPanel .setVisible ( (btnId=='input' ) );
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
      }(this));
      this.radioSet.setSize ( '220px','' );

      if (!this.inputPanel.fullVersionMismatch)
        this.run_btn  = this.toolBar.setButton ( this.task.runButtonName(),
                                                 image_path('runjob'), 0,2, 1,1 )
                                    .setTooltip  ( 'Start job' )
                                    .setDisabled ( __dormant   );
    }
    this.toolBar.setCellSize ( '40%','',0,1 );

    this.run_image  = this.toolBar.setImage  ( './images_com/activity.gif',
                                               '36px','36px', 0,3, 1,1 );
    this.stop_btn   = this.toolBar.setButton ( 'Stop',image_path('stopjob'), 0,4, 1,1 )
                                  .setTooltip('Stop job' );
    this.status_lbl = this.toolBar.setLabel  ( '', 0,5, 1,1 ).setNoWrap();

    this.export_btn = this.toolBar.setButton ( 'Export',image_path('export'), 0,7, 1,1 )
                                  .setTooltip('Export job directory' );

    if (this.task.helpURL)
      this.ref_btn  = this.toolBar.setButton ( 'Ref.',image_path('reference'), 0,8, 1,1 )
                                  .setTooltip('Task Documentation' );
    this.help_btn   = this.toolBar.setButton ( 'Help',image_path('help'), 0,9, 1,1 )
                                  .setTooltip('Dialog Help' );
    this.close_btn  = this.toolBar.setButton ( 'Close',image_path('close'), 0,10, 1,1 )
                                  .setTooltip('Close Job Dialog' );
    this.toolBar.setVerticalAlignment ( 0,5,'middle' );
    this.toolBar.setCellSize ( '40%','',0,6 );

  } else  {
    this.outputPanel.setFramePosition ( '16px','8px','100%','100%' );

    this.inputPanel = null;
    this.toolBar    = null;
    this.toolBarSep = null;
    this.radioSet   = null;
    this.run_btn    = null;
    this.run_image  = null;
    this.stop_btn   = null;
    this.status_lbl = null;
    this.export_btn = null;
    this.ref_btn    = null;
    this.help_btn   = null;
    this.close_btn  = null;

    this.addWidget ( this.outputPanel );
    (function(dlg){
      $(dlg.outputPanel.element).on ( 'load',function(){
        dlg.onDlgResize();
      });
    }(this));

  }

  if ((this.task.state!='new') && (this.task.job_dialog_data.panel=='output') &&
      (this.outputPanel.getURL().length<=0))
    this.loadReport();

  if (this.inputPanel)
    this.inputPanel.setVisible ( this.task.job_dialog_data.panel=='input' );
  this.outputPanel.setVisible ( this.task.job_dialog_data.panel=='output' );

  (function(dlg){

    // Listen for input event, emitted when input data changes
    if (dlg.run_btn && dlg.inputPanel)
      dlg.inputPanel.element.addEventListener(cofe_signals.taskReady,function(e){
        //alert ( ' run_btn=' + e.detail + ' l=' + e.detail.length );
        if (e.detail.length<=0)  {
          dlg.run_btn  .setEnabled ( !__dormant );
          dlg.close_btn.setEnabled ( true );
        } else if (e.detail=='hide_run_button')  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        } else if (e.detail=='upload_started')  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( false );
        } else if (e.detail=='upload_finished')  {
          dlg.run_btn  .setEnabled ( !__dormant );
          dlg.close_btn.setEnabled ( true );
        } else  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        }
      },false );

    $(dlg.element).on ( 'dialogresize', function(event,ui){
      dlg.task.job_dialog_data.width  = dlg.width_px();
      if (!__any_mobile_device)  {
        dlg.task.job_dialog_data.height = dlg.height_px();
        dlg.onDlgResize();
      }
    });

    if (dlg.run_btn)  {

      dlg.run_btn.addOnClickListener ( function(){

        var stopmsg = null;
        if (dlg.task.nc_type=='client')  {
          if (!__local_service)  {
            stopmsg = ['CCP4 Cloud Client not found',
                       '<h3>CCP4 Cloud Client is required</h3>'];
            if (__any_mobile_device)
              stopmsg[1] += 'This task cannot be run when working with ' + appName() +
                            ' from mobile devices.<br>In order to use the task, ' +
                            'access ' + appName() + ' via the CCP4 Cloud Client,<br>' +
                            'found in CCP4 Software Suite.';
            else
              stopmsg[1] += 'This task can be run only if ' + appName() +
                            ' was accessed via the CCP4 Cloud Client,<br>found in ' +
                            'CCP4 Software Suite.';
          } else if (compareVersions(__client_version,dlg.task.lowestClientVersion())<0){
            stopmsg = ['CCP4 Cloud Client needs updating',
                       '<h3>Too low version of CCP4 Cloud Client</h3>' +
                       'This task requires a higher version of the CCP4 Cloud Client' +
                       '<br>(update CCP4 Software Suite on your device).'];
          }
        }

        if (stopmsg)  {

          new MessageBox ( stopmsg[0],stopmsg[1] );

        } else  {

          serverRequest ( fe_reqtype.getUserRation,{},'User Ration',
            function(ration){

              var pdesc = dlg.parent_page.ration.pdesc;
              dlg.parent_page.ration = ration;
              dlg.parent_page.displayUserRation ( pdesc );

              if (ration)  {
                if ((ration.storage>0.0) && (ration.storage_used>=ration.storage))  {
                  new MessageBox ( 'Disk Quota Exceeded',
                      'The job cannot be run because disk quota is up. ' +
                      'Your<br>account currently uses <b>' + round(ration.storage_used,1) +
                      '</b> MBytes at <b>' + round(ration.storage,1) +
                      '</b> MBytes<br>allocated.<p>' +
                      '<i><b>Hint 1:</b></i> deleting jobs and projects will free up disk space.<p>' +
                      '<i><b>Hint 2:</b></i> resource usage can be monitored using disk and<br>' +
                      'CPU widgets in the top-right corner of the screen.<p>' +
                      '<i><b>Recommended action:</b></i> export an old project and then<br>' +
                      'delete it from the list. You will be able to re-import that<br>' +
                      'project later using the file exported.' );
                  return;
                }
                if ((ration.cpu_day>0.0) && (ration.cpu_day_used>=ration.cpu_day))  {
                  new MessageBox ( '24-hour CPU Quota Exceeded',
                      'The job cannot be run because the 24-hour CPU quota<br>' +
                      'is up. In last 24 hours, you have used <b>' + round(ration.cpu_day_used,3) +
                      '</b> CPU hours<br>at <b>' + round(ration.cpu_day,3) +
                      '</b> CPU hours allocated.<p>' +
                      '<i><b>Hint:</b></i> resource usage can be monitored using disk and<br>' +
                      'CPU widgets in the top-right corner of the screen. You<br>' +
                      'may need to push "Reload" button in the toolbar after<br>' +
                      'periods of inactivity to get updated readings.<p>' +
                      '<i><b>Recommended action:</b></i> run the job later.' );
                  return;
                }
                if ((ration.cpu_month>0.0) && (ration.cpu_month_used>=ration.cpu_month))  {
                  new MessageBox ( '30-day CPU Quota Exceeded',
                      'The job cannot be run because the 30-day CPU quota<br>' +
                      'is up. In last 30 days, you have used <b>' + round(ration.cpu_month_used,3) +
                      '</b> CPU hours<br>at <b>' + round(ration.cpu_month,3) +
                      '</b> CPU hours allocated.<p>' +
                      '<i><b>Hint:</b></i> resource usage can be monitored using disk and<br>' +
                      'CPU widgets in the top-right corner of the screen. You<br>' +
                      'may need to push "Reload" button in the toolbar after<br>' +
                      'periods of inactivity to get updated readings.<p>' +
                      '<i><b>Recommended action:</b></i> run the job later.' );
                  return;
                }
              }

              if (dlg.collectTaskData(false))  {

                dlg.task.doRun ( dlg.inputPanel,function(){

                  dlg.task.job_dialog_data.panel = 'output';
                  dlg.task.state = job_code.running;
                  dlg.outputPanel.clear();
                  dlg.setDlgState();

                  dlg.requestServer ( fe_reqtype.runJob,function(rdata){

                    addWfKnowledge ( dlg.task,dlg.ancestors.slice(1) );

                    if (dlg.task.nc_type=='client')  {

                      dlg.task.job_dialog_data.job_token = rdata.job_token;
                      var data_obj       = {};
                      data_obj.job_token = rdata.job_token;
                      data_obj.feURL     = getFEURL();
                      data_obj.dnlURL    = dlg.task.getURL ( rdata.jobballName );
                      localCommand ( nc_command.runClientJob,data_obj,'Run Client Job',
                        function(response){
                          if (!response)
                            return false;  // issue standard AJAX failure message
                          if (response.status!=nc_retcode.ok)  {
                            new MessageBox ( 'Run Client Job',
                              '<p>Launching local application ' + dlg.task.name +
                              ' failed due to:<p><i>' + response.message + '</i><p>' +
                              'Please report this as possible bug to <a href="mailto:' +
                              maintainerEmail + '">' + maintainerEmail + '</a>' );
                          } else  {
                            dlg.loadReport();
                            dlg.radioSet.selectButton ( 'output' );
                          }
                          return true;
                        });

                    } else  {
                      dlg.loadReport();
                      dlg.radioSet.selectButton ( 'output' );
                    }

                    onRun_func ( dlg.task.id );

                  });

                });

              }

            },null,'persist');

        }

      });

    }

    if (dlg.stop_btn)
      dlg.stop_btn.addOnClickListener ( function(){
        dlg.onDlgSignal_func ( dlg.task.id,job_dialog_reason.stop_job );
      });

    if (dlg.export_btn)
      dlg.export_btn.addOnClickListener ( function(){
        new ExportJobDialog ( dlg.task );
      });

    if (dlg.task.helpURL && dlg.ref_btn)
      dlg.ref_btn.addOnClickListener ( function(){
        new HelpBox ( '',dlg.task.helpURL,null );
      });

    if (dlg.help_btn)
      dlg.help_btn.addOnClickListener ( function(){
        new HelpBox ( '','./html/jscofe_jobdialog.html',null );
      });

    if (dlg.close_btn)
      dlg.close_btn.addOnClickListener ( function(){
        if ((dlg.task.state!=job_code.running) &&
            (dlg.task.state!=job_code.exiting))  {
          dlg.collectTaskData ( true );
          dlg.requestServer   ( fe_reqtype.saveJobData,null );
        }
        $(dlg.element).dialog ( "close" );
        /*  strict version with input validation ( does not close if error)
        if (dlg.task.state!=job_code.exiting)  {
          if (dlg.collectTaskData(false))  {
            requestServer ( fe_reqtype.saveJobData,null );
            $(dlg.element).dialog ( "close" );
          }
        } else
          $(dlg.element).dialog ( "close" );
        */
      });

  }(this));

}
