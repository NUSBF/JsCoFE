
/*
 *  =================================================================
 *
 *    09.06.18   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2018
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
  rename_node : 'rename_node', // rename job node
  reset_node  : 'reset_node',  // reset  job node label
  select_node : 'select_node', // select job node
  stop_job    : 'stop_job'     // stop job
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

  var w0 = $(window).width ();
  var h0 = $(window).height();

  var w = 2*w0;
  if (this.task.job_dialog_data.width>0)
    w = this.task.job_dialog_data.width;
  if (w>=w0)
    w = 3*w0/4;
  w += 'px';

  this.initialHeight = 2*h0;
  if (this.task.job_dialog_data.height>0)
    this.initialHeight = this.task.job_dialog_data.height;
  if (this.initialHeight>=h0)
    this.initialHeight = 3*h0/4;

  var taskId = this.task.id;
  this.dialog_options = {
      resizable : true,
      height    : 'auto',
      width     : w,
      buttons   : {},
      focus     : function() {
                    if (onDlgSignal_func)
                      onDlgSignal_func ( taskId,job_dialog_reason.select_node );
                  }
  };

  this.dialog_options.position = this.task.job_dialog_data.position;

  this.makeLayout ( onRun_func );

  $(this.element).dialog ( this.dialog_options );

  this.setDlgState();
  this.setDlgSize ();

  (function(dlg){
    $(dlg.element).on( "dialogclose",function(event,ui){
      if (!dlg.task.job_dialog_data.viewed)
        dlg.close_btn.click();
      else  {
        dlg.outputPanel.clear();
        onClose_func(dlg.task.id);
        window.setTimeout ( function(){
          $(dlg.element).dialog( "destroy" );
          dlg.delete();
        },10 );
      }
    });
  }(this))

  // Listen for input event, emitted when input data changes
  if (this.task.state!=job_code.running)  {
    this.inputPanel.element.addEventListener(cofe_signals.jobDlgSignal,function(e){
      onDlgSignal_func ( taskId,e.detail );
    },false );
  }

  this.onDlgSignal_func = onDlgSignal_func;

  this.task.updateInputPanel ( this.inputPanel );

}


JobDialog.prototype = Object.create ( Widget.prototype );
JobDialog.prototype.constructor = JobDialog;


JobDialog.prototype.displayInputErrors = function ( input_msg )  {
  if (input_msg.startsWith('#'))  {
    new MessageBox ( 'Input errors',input_msg.substring(1) );
  } else  {
    new MessageBox ( 'Input errors',
      'The following errors have been encountered at processing input parameters:' +
      '<p><ul>' + input_msg.split('<b>').join('<li><b>') +
      '</ul><p>Please adjust input parameters as appropriate.' );
  }
}


JobDialog.prototype.setDlgState = function()  {

  var isNew     = (this.task.state==job_code.new);
  var isRunning = (this.task.state==job_code.running);

  this.inputPanel.setDisabledAll ( !isNew );
  this.task.disableInputWidgets  ( this.inputPanel,!isNew );
  this.radioSet.setDisabled ( isNew  );
  if (this.run_btn)
    this.run_btn.setVisible ( isNew  );

  if (this.ind_timer)
    window.clearTimeout ( this.ind_timer );

  if (isRunning && (!this.stop_btn.isVisible()))  {
    (function(dlg){
      dlg.ind_timer = window.setTimeout ( function(){
        dlg.run_image.setVisible ( true );
        dlg.stop_btn .setVisible ( true );
      },1000 );
    }(this));
  } else  {
    this.run_image.setVisible    ( isRunning );
    this.stop_btn .setVisible    ( isRunning );
  }

  this.status_lbl.setVisible     ( (!isNew) && (!isRunning) );

  var msg = '';
  switch (this.task.state)  {
    case job_code.finished :  msg = 'Job completed';          break;
    case job_code.failed   :  msg = 'Job failed';             break;
    case job_code.stopped  :  msg = 'Job terminated by user'; break;
    default : ;
  }

  if (msg)
    this.status_lbl.setText ( '<b><i>' + msg + '</i></b>' );

  if (isNew)  { // enforce!
    this.outputPanel.setVisible ( false );
    this.inputPanel .setVisible ( true  );
    this.task.job_dialog_data.panel = 'input';
  } else if ((!isRunning) && __local_service &&
             (this.outputPanel.getURL().startsWith(__local_service)))
    this.loadReport();

}

JobDialog.prototype.getDlgSize = function ()  {
  this.task.job_dialog_data.width  = this.width_px ();
  this.task.job_dialog_data.height = this.height_px();
  var p = $(this.element).dialog ( "option", "position" );
  this.task.job_dialog_data.position.my = p.my;
  this.task.job_dialog_data.position.at = p.at;
}


JobDialog.prototype.onDlgResize = function ()  {

  var panelHeight = this.task.job_dialog_data.height - 36 -
                    this.child[0].height_px() - this.child[1].height_px();
  var panelWidth  = this.child[1].width_px();

  this.inputPanel .setSize_px ( panelWidth,panelHeight );
  this.outputPanel.setSize_px ( panelWidth,panelHeight );

  if (this.inputPanel.hasOwnProperty('panel'))  {
    if (this.inputPanel.hasOwnProperty('header'))
      panelHeight -= this.inputPanel.header.height_px();
    this.inputPanel.panel.setSize_px ( panelWidth,panelHeight );
  }

}

JobDialog.prototype.setDlgSize = function ()  {
  if (this.task.job_dialog_data.height<=0)  {
    this.task.job_dialog_data.width  = this.width_px();
    this.task.job_dialog_data.height = this.initialHeight;
//    this.task.job_dialog_data.height = (2*this.task.job_dialog_data.width)/3;
  }
  this.setSize_px ( this.task.job_dialog_data.width,this.task.job_dialog_data.height );
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
        //reportURL = __local_service + '/' + replaceAll(reportURL,'/','@');
        reportURL = __local_service + '/' + reportURL;
  } else
    reportURL = this.task.getReportURL();
  this.outputPanel.loadPage ( reportURL );
}


JobDialog.prototype.collectTaskData = function ( ignore_bool )  {
  this.getDlgSize ();
  var input_msg = '';
  if (this.task.state==job_code.new)  {
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


JobDialog.prototype.makeLayout = function ( onRun_func )  {

  this.inputPanel  = this.task.makeInputPanel ( this.dataBox );
  this.outputPanel = new IFrame ( '' );  // always initially empty
  //$(this.outputPanel.element).css({'overflow':'hidden'});

  var toolBar = new Grid('');
  this.addWidget ( toolBar );
  this.addWidget ( new HLine('2px') );
  this.addWidget ( this.inputPanel  );
  this.addWidget ( this.outputPanel );

  this.radioSet = toolBar.setRadioSet(0,0,1,1)
          .addButton('Input' ,'input' ,'',this.task.job_dialog_data.panel=='input' )
          .addButton('Output','output','',this.task.job_dialog_data.panel=='output');
  (function(dlg){
    $(dlg.outputPanel.element).load(function() {
      dlg.onDlgResize();
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

  toolBar.setCellSize ( '30%','',0,1 );
  if (!this.inputPanel.fullVersionMismatch)
    this.run_btn  = toolBar.setButton ( this.task.runButtonName(),
                                       './images/runjob.svg', 0,2, 1,1 )
                                       .setTooltip('Start job' );
//  this.run_image  = toolBar.setImage  ( './images/brass_gears.gif','56px','36px',
//                                        0,3, 1,1 );
  this.run_image  = toolBar.setImage  ( './images/activity.gif','36px','36px',
                                        0,3, 1,1 );
  this.stop_btn   = toolBar.setButton ( 'Stop','./images/stopjob.svg', 0,4, 1,1 )
                                        .setTooltip('Stop job' );
  this.status_lbl = toolBar.setLabel  ( '', 0,5, 1,1 ).setNoWrap();
  if (this.task.helpURL)
    this.ref_btn  = toolBar.setButton ( 'Ref.','./images/reference.svg', 0,7, 1,1 )
                                        .setTooltip('Task Documentation' );
  this.help_btn   = toolBar.setButton ( 'Help','./images/help.svg', 0,8, 1,1 )
                                        .setTooltip('Dialog Help' );
  this.close_btn  = toolBar.setButton ( 'Close','./images/close.svg', 0,9, 1,1 )
                                        .setTooltip('Close Job Dialog' );
  toolBar.setVerticalAlignment ( 0,5,'middle' );
  toolBar.setCellSize ( '40%','',0,6 );

  if ((this.task.state!='new') && (this.task.job_dialog_data.panel=='output') &&
      (this.outputPanel.getURL().length<=0))
    this.loadReport();

  this.inputPanel .setVisible ( this.task.job_dialog_data.panel=='input'  );
  this.outputPanel.setVisible ( this.task.job_dialog_data.panel=='output' );

  (function(dlg){

    // Listen for input event, emitted when input data changes
    if (dlg.run_btn)
      dlg.inputPanel.element.addEventListener(cofe_signals.taskReady,function(e){
        //alert ( ' run_btn=' + e.detail + ' l=' + e.detail.length );
        if (e.detail.length<=0)  {
          dlg.run_btn  .setEnabled ( true );
          dlg.close_btn.setEnabled ( true );
        } else if (e.detail=='hide_run_button')  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        } else if (e.detail=='upload_started')  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( false );
        } else if (e.detail=='upload_finished')  {
          dlg.run_btn  .setEnabled ( true );
          dlg.close_btn.setEnabled ( true );
        } else  {
          dlg.run_btn  .setEnabled ( false );
          dlg.close_btn.setEnabled ( true  );
        }
      },false );

    $(dlg.element).on ( 'dialogresize', function(event,ui){
      dlg.task.job_dialog_data.width  = dlg.width_px();
      dlg.task.job_dialog_data.height = dlg.height_px();
      dlg.onDlgResize();
    });

    if (dlg.run_btn)  {

      dlg.run_btn.addOnClickListener ( function(){

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
                    '<i><b>Hint 2:</b></i> resource usage can be monitired using disk and<br>' +
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
                    '<i><b>Hint:</b></i> resource usage can be monitired using disk and<br>' +
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
                    '<i><b>Hint:</b></i> resource usage can be monitired using disk and<br>' +
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
                dlg.task.state = 'running';
                dlg.outputPanel.clear();
                dlg.setDlgState();

                dlg.requestServer ( fe_reqtype.runJob,function(rdata){

                  addWfKnowledge ( dlg.task,dlg.ancestors.slice(1) );

                  if (dlg.task.nc_type=='client')  {

                    dlg.task.job_dialog_data.job_token = rdata.job_token;
                    var data_obj       = {};
                    data_obj.job_token = rdata.job_token;
                    data_obj.feURL     = getFEURL();
                    data_obj.dnlURL    = dlg.task.getURL ( rdata.tarballName );
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

      });

    }

    dlg.stop_btn.addOnClickListener ( function(){
      dlg.onDlgSignal_func ( dlg.task.id,job_dialog_reason.stop_job );
    });

    if (dlg.task.helpURL)
      dlg.ref_btn.addOnClickListener ( function(){
        new HelpBox ( '',dlg.task.helpURL,null );
      });

    dlg.help_btn.addOnClickListener ( function(){
      new HelpBox ( '','./html/jscofe_jobdialog.html',null );
    });

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
