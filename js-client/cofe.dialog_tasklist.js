
/*
 *  =================================================================
 *
 *    23.01.20   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_tasklist.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task List Dialog
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
// TaskListDialog class

function TaskListDialog ( dataBox,branch_task_list,onSelect_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Task List' );
  document.body.appendChild ( this.element );

  this.branch_tasks  = [];
  for (var i=0;i<branch_task_list.length;i++)
    /*
    if ((branch_task_list[i].state!=job_code.remark) &&
        (branch_task_list[i].state!=job_code.remdet) &&
        (branch_task_list[i].state!=job_code.remdoc))
    */
    if (!branch_task_list[i].isRemark())
      this.branch_tasks.push ( branch_task_list[i] );

  this.dataBox       = dataBox;
  this.task          = this.branch_tasks[0];
  this.onSelect_func = onSelect_func;
  this.selected_task = null;  // will receive new task template or null if canceled

  this.makeLayout();

  var w = window.innerWidth;
  var w = Math.min ( Math.max(700,4*w/9),6*w/8 );
  var h = 6*window.innerHeight/8;

  $(this.element).dialog({
    resizable : true,
    height    : h,
    width     : w,
    maxHeight : $(window).height()-20,
    modal     : true,
    buttons   : [
      { text  : 'Help',
        click : function() {
          new HelpBox ( '','./html/jscofe_tasklist.html',null );
        }
      },
      { text  : 'Cancel',
        click : function() {
          $( this ).dialog( "close" );
        }
      }
    ]
  });

  (function(self){
    $(self.element).on( "dialogresize", function(event,ui){
      //self.onResize();
      $(self.tabs.element).height ( self.element.innerHeight-16 );
      self.tabs.refresh();
    });
  }(this));

  //$(this.element).css ( 'width:100%' );
  $(this.tabs.element).height ( this.element.innerHeight-16 );
  this.tabs.refresh();

  //launchHelpBox ( '','./html/jscofe_tasklist.html',doNotShowAgain,1000 );

}

TaskListDialog.prototype = Object.create ( Widget.prototype );
TaskListDialog.prototype.constructor = TaskListDialog;

/*
function checkEnvironment ( task_obj,env )  {
  var reqEnv = task_obj.requiredEnvironment();
  var ok = true;
  for (var i=0;(i<reqEnv.length) && ok;i++)
    if (reqEnv[i].constructor === Array)  {
      ok = false;
      for (var j=0;(j<reqEnv[i].length) && (!ok);j++)
        ok = (env.indexOf(reqEnv[i][j])>=0);
    } else
      ok = (env.indexOf(reqEnv[i])>=0);
//console.log ( ' ' + env + ' <-> ' + reqEnv + ' = ' + ok );
  return ok;
}

TaskListDialog.prototype.isTaskAvailable = function ( task_obj )  {

  if (__exclude_tasks.indexOf(task_obj._type)>=0)
    return 'server-excluded';  // task excluded in server configuration

  if ((__exclude_tasks.indexOf('unix-only')>=0) &&
      (task_obj.platforms().indexOf('W')<0))
    return 'windows-excluded';  // task not supported on Windows

  if ((task_obj.nc_type=='client') && (!__local_service))
    return 'client';   // client task while there is no client running

  if ((task_obj.nc_type=='client-storage') &&
      (!__local_service) && (!__cloud_storage))
    return 'client-storage';  // task require either client or cloud storage
                              // but neither is given

  if (startsWith(task_obj.nc_type,'client'))  {
    if (__local_service &&
        (compareVersions(__client_version,task_obj.lowestClientVersion())<0))
      return 'client-version';   // task requires client of higher version
    if (!checkEnvironment(task_obj,__environ_client))
      return 'environment-client';
  } else  {
    var authID = task_obj.authorisationID();
    if (authID && __auth_software && (authID in __auth_software) &&
        ((!(authID in __user_authorisation)) ||
         (!__user_authorisation[authID].auth_date)))
      return 'authorisation';
  }

  if ((task_obj.nc_type!='client') && (!checkEnvironment(task_obj,__environ_server)))
    return 'environment-server';

  //if ((__exclude_tasks.indexOf(task_obj._type)>=0) ||
  //    ((__exclude_tasks.indexOf('unix-only')>=0) &&
  //     (task_obj.platforms().indexOf('W')<0)))
  //  return false;

  return 'ok';

}
*/

TaskListDialog.prototype.setTask = function ( task_obj,grid,row,setall )  {

  //if ((!__local_service) && (task_obj.nc_type=='client'))
  //  return null;

  var avail_key = task_obj.isTaskAvailable();

  /*   example just in case:
  if (['ok','client','server-excluded','windows-excluded','client-storage']
      .indexOf(avail_key)<0)
    return null;
  */

  var dataSummary = this.dataBox.getDataSummary ( task_obj );
  if (avail_key[0]!='ok')
    dataSummary.status = -1;

  if ((!setall) && (dataSummary.status<=0))
    return null;

  var btn = grid.setButton  ( '',image_path(task_obj.icon()),row,0,1,1 )
                .setSize_px ( 54,40 );
  grid.setLabel             ( ' ', row,1,1,1 );
  var title = task_obj.title;
  if (avail_key[0]!='ok')  {
    title += '<br><i><font size="-1">** ' + avail_key[1] + '</font></i>';
    /*
    switch (avail_key)  {
      case 'client' :
            if (__any_mobile_device)
                  title += '** task is not available on mobile devices';
            else  title += '** task is available only if started via CCP4 Cloud Client';
          break;
      case 'client-storage' :
            title += '** task is available only if started via CCP4 Cloud Client ' +
                     'or if Cloud Storage is configured';
          break;
      case 'client-version' :
            title += '** task requires a higher version of CCP4 Cloud Client ' +
                     '(update CCP4 on your device)';
          break;
      case 'authorisation'   :
            title += '** task requires authorisation from ' +
                     __auth_software[task_obj.authorisationID()].desc_provider +
                     ' (available in "My Account")';
          break;
      case 'server-excluded' :
            title += '** task is not available on ' + appName() + ' server';
          break;
      case 'windows-excluded' :
            title += '** task is not available on MS Windows systems';
          break;
      case 'environment-client' :
            title += '** task software is not installed on your device';
          break;
      case 'environment-server' :
            title += '** task software is not installed on ' + appName() + ' server';
          break;
      default : ;
    }
    title += '</font></i>';
    */
  }
  var lbl = grid.setLabel   ( title,row,2,1,1 );
  grid.setNoWrap            ( row,2 );
  grid.setVerticalAlignment ( row,2,'middle' );
  grid.setCellSize          ( '99%','',row,2 );

  btn.dataSummary = dataSummary;

  switch (btn.dataSummary.status)  {
    default :
    case 0 : $(btn.element).css({'border':'2px solid #FF1C00'});        // maroon
             lbl.setFontColor('#888888').setFontItalic(true);    break;
    case 1 : $(btn.element).css({'border':'2px solid #FFBF00'}); break; // amber
    case 2 : $(btn.element).css({'border':'2px solid #03C03C'}); break; // green
  }

  (function(dlg){

    function taskClicked() {
      if (btn.dataSummary.status>0)  {
        dlg.selected_task = task_obj;
        dlg.onSelect_func ( task_obj );
        $(dlg.element).dialog ( 'close' );
      } else  {
        // insufficient data
        new TaskDataDialog ( btn.dataSummary,task_obj,avail_key );
      }
    }

    btn.addOnClickListener ( taskClicked );
    lbl.addOnClickListener ( taskClicked );

  }(this));

  return btn;

}


TaskListDialog.prototype.makeLayout = function()  {

  this.tabs = new Tabs();
  this.addWidget ( this.tabs );

  var tab_suggested = this.tabs.addTab ( 'Suggested',true  );
  var tab_fulllist  = this.tabs.addTab ( 'Full list',false );
  this.makeSuggestedList ( tab_suggested.grid );
  this.makeFullList      ( tab_fulllist .grid );

}


TaskListDialog.prototype.makeSuggestedList = function ( grid )  {
var knowledge = getWfKnowledge ( this.branch_tasks[2],this.branch_tasks[1],
                                 this.branch_tasks[0] );
var tasks     = knowledge.tasks;
var counts    = knowledge.counts;
var ctotal    = 0;
var r         = 0;  // grid row

//console.log ( knowledge );

  for (var i=0;i<counts.length;i++)  {
    for (var j=i+1;j<counts.length;j++)
      if (counts[j]>counts[i])  {
        var t = tasks [i];  tasks [i] = tasks [j];  tasks [j] = t;
        var c = counts[i];  counts[i] = counts[j];  counts[j] = c;
      }
    ctotal += counts[i];
  }

  var cthresh = ctotal*__suggested_task_prob;
// console.log ( 'ctotal='+ctotal + ',  cthresh='+cthresh );

  for (var i=0;i<tasks.length;i++)
    if ((i<__suggested_task_nmin) || (ctotal>=cthresh))  {
      //console.log ( 'task=' + tasks[i] + ',  ctotal=' + ctotal );
      var task = eval ( 'new ' + tasks[i] + '()' );
      if (this.setTask(task,grid,r,false))
        r++;
      ctotal -= counts[i];
    }

  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeFullList = function ( grid )  {
var section0 = null;
var navail   = 0;
var row      = 0;

  this.makeSection = function ( title,task_list )  {
    var section = grid.setSection ( title,false, row++,0,1,3 );
    var cnt = 0;
    var r   = 0;
    for (n=0;n<task_list.length;n++)
      if (typeof task_list[n] === 'string' || task_list[n] instanceof String) {
        section.grid.setLabel ( '&nbsp;',r++,0,1,3 ).setHeight_px(4);
        section.grid.setLabel ( '<hr/>',r,0,1,1 );
        var grid1 = section.grid.setGrid ( '',r++,1,1,2 );
        grid1.setLabel ( '&nbsp;' + task_list[n] + '&nbsp;',0,0,1,1 )
             .setFontItalic(true).setFontBold(true).setNoWrap();
        grid1.setLabel ( '<hr/>',0,1,1,1 );
        grid1.setCellSize ( '10%','8px',0,0 );
        grid1.setCellSize ( '90%','8px',0,1 );
      } else  {
        var task = this.setTask ( task_list[n],section.grid,r++,true );
        if (task)  {
          if (task.dataSummary.status>0)
            cnt++;
        }
      }
    section.setTitle ( title + ' <b>(' + cnt + ')</b>' );
    if (cnt>0)  {
      navail++;
      section0 = section;
    }
  }


  var ccp4go_task = new TaskCCP4go();
  if (ccp4go_task.isTaskAvailable()[0]=='ok')
    this.makeSection ( 'Combined Automated Solver <i>"CCP4 Go"</i>',[
      'Recommended as first attempt or in easy cases',
      ccp4go_task
    ]);
  var section1 = section0;


  if (__login_user=='Developer')
    this.makeSection ( 'Tasks in Development',[
      new TaskBuster       (),
      new TaskMergeData    (),
      new TaskHelloWorld   ()
    ]);

  if (__cloud_storage)  {
    var data_import_tasks = [
      new TaskImport        (),
      new TaskImportPDB     (),
      new TaskCloudImport   (),
      new TaskFacilityImport()
    ];
  } else  {
    var data_import_tasks = [
      new TaskImport        (),
      new TaskImportPDB     (),
      new TaskFacilityImport()
    ];
  }

  this.makeSection ( 'Data Import',data_import_tasks );
  /*
  this.makeSection ( 'Data Import',data_import_tasks.concat([
    'Utilities',
    new TaskXyz2Revision()
  ]));
  */

  this.makeSection ( 'Data Processing',[
    new TaskXia2        (),
    new TaskDUI         (),
    new TaskIMosflm     (),
    new TaskAimless     (),
//    new TaskChangeSpG (),
    new TaskChangeSpGHKL(),
    new TaskChangeReso  (),
    new TaskFreeRFlag   ()
  ]);

  this.makeSection ( 'Asymmetric Unit and Structure Revision',[
    new TaskASUDef            (),
    new TaskChangeSpGASU      (),
    //new TaskASUDefStruct(),
    //new TaskASUMod      ()
    new TaskEditRevisionASU   (),
    new TaskEditRevisionStruct(),
    new TaskEditRevisionSubstr()
  ]);

  this.makeSection ( 'Molecular Replacement',[
    'No-sequence methods',
    new TaskSimbad(),
    'No-model methods',
    new TaskAmple (),
    'Automated MR',
    new TaskBalbes(),
    new TaskMorda (),
    new TaskMrBump(),
    'Elementary MR',
    new TaskEnsemblePrepMG (),
    new TaskEnsemblePrepSeq(),
    new TaskEnsemblePrepXYZ(),
    new TaskMolrep  (),
    new TaskPhaserMR()
  ]);

  this.makeSection ( 'Experimental Phasing',[
    'Automated EP',
    new TaskCrank2     (),
    new TaskShelxAuto  (),
    'Elementary EP',
    new TaskShelxSubstr(),
    new TaskShelxCD    (),
    new TaskPhaserEP   ()
  ]);

  this.makeSection ( 'Density Modification',[
    new TaskParrot  (),
    new TaskAcorn   (),
    new TaskShelxEMR()
  ]);

  this.makeSection ( 'Refinement and Model Building',[
    new TaskRefmac   (),
    new TaskLorestr  (),
    new TaskCCP4Build(),
    new TaskBuccaneer(),
    new TaskArpWarp  (),
    new TaskNautilus (),
    new TaskDimple   (),
    new TaskCootMB   (),
    new TaskCombStructure()
  ]);

  this.makeSection ( 'Ligands',[
    new TaskMakeLigand(),
    new TaskFitLigand (),
    new TaskFitWaters ()
  ]);

  this.makeSection ( 'Validation, Analysis and Deposition',[
    new TaskZanuda    (),
    new TaskPISA      (),
    new TaskDeposition()
  ]);

  this.makeSection ( 'Toolbox',[
    'Reflection data tools',
    new TaskAuspex  (),
    new TaskSRF     (),
    new TaskCrosSec (),
    'Coordinate data tools',
    new TaskCootCE  (),
    'Alignment and comparison tools',
    new TaskGesamt  (),
    new TaskLsqKab  (),
    new TaskSeqAlign(),
    new TaskSymMatch()
  ]);

  if (navail==1)
    section0.open();
  else if (section1)
    section1.open();

}


TaskListDialog.prototype.getSelectedTask = function()  {
  return this.selected_task;
}
