
/*
 *  =================================================================
 *
 *    20.12.20   <--  Date of Last Modification.
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
          new HelpBox ( '',__user_guide_base_url + 'jscofe_tasklist.html',null );
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

TaskListDialog.prototype.setTask = function ( task_obj,grid,row,setall )  {

  //if ((!__local_service) && (task_obj.nc_type=='client'))
  //  return null;

  if (task_obj.state==job_code.retired)
    return null;

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
  if (avail_key[0]!='ok')
    title += '<br><i><span style="font-size:14px;">** ' + avail_key[1] + '</i></span>';
    //title += '<br><i><font size="-1">** ' + avail_key[1] + '</font></i>';
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
  if (this.dataBox.isEmpty())
    ccp4go_task.input_dtypes = [1]; // force 'at root mode' for the task
  if (ccp4go_task.isTaskAvailable()[0]=='ok')
    this.makeSection ( 'Combined Automated Solver <i>"CCP4 Go"</i>',[
      'Recommended as first attempt or in easy cases',
      ccp4go_task
    ]);
  var section1 = section0;

  if (__user_role==role_code.developer)
    this.makeSection ( 'Tasks in Development',[
      new TaskDocDev       (),
      //new TaskSheetbend    (),  // excluded also from the bootstrap html
      new TaskJLigand      (),
      new TaskFragon       (),
      new TaskMergeData    (),
      new TaskHelloWorld   ()
    ]);

  var data_import_tasks = [
    new TaskImport        (),
    new TaskImportSeqCP   (),
    new TaskImportPDB     (),
    new TaskMigrate       ()
    //new TaskFacilityImport()
  ];

  if (__cloud_storage)
    data_import_tasks.splice ( 3,0,new TaskCloudImport() );

  /*
  if (__cloud_storage)
    var data_import_tasks = [
      new TaskImport        (),
      new TaskImportSeqCP   (),
      new TaskImportPDB     (),
      new TaskCloudImport   (),
      new TaskFacilityImport()
    ];
  } else  {
    var data_import_tasks = [
      new TaskImport        (),
      new TaskImportSeqCP   (),
      new TaskImportPDB     (),
      new TaskFacilityImport()
    ];
  }
  */

  this.makeSection ( 'Data Import',data_import_tasks );
  /*
  this.makeSection ( 'Data Import',data_import_tasks.concat([
    'Utilities',
    new TaskXyz2Revision()
  ]));
  */

  this.makeSection ( 'Data Processing',[
    new TaskXia2        (),
    new TaskXDSGUI      (),
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
    new TaskEditRevision      (),
    //new TaskEditRevisionASU   (),
    //new TaskEditRevisionStruct(),
    //new TaskEditRevisionSubstr()
  ]);

  this.makeSection ( 'Automated Molecular Replacement',[
    'Conventional Auto-MR',
    new TaskMorda (),
    new TaskMrBump(),
    new TaskBalbes(),
    'No-sequence methods',
    new TaskSimbad(),
    'No-model methods',
    new TaskAmple ()
  ]);

  this.makeSection ( 'Molecular Replacement',[
    'MR model preparation',
    new TaskModelPrepXYZ   (),
    new TaskModelPrepAlgn  (),
    new TaskEnsembler      (),
    new TaskEnsemblePrepSeq(),
    new TaskEnsemblePrepXYZ(),
    new TaskEnsemblePrepMG (),
    'Fundamental MR',
    new TaskPhaserMR(),
    new TaskMolrep  ()
  ]);

  this.makeSection ( 'Experimental Phasing',[
    'Automated EP',
    new TaskCrank2     (),
    new TaskShelxAuto  (),
    'Fundamental EP',
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
    new TaskBuster   (),
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
    new TaskXyzUtils(),
    new TaskCootCE  (),
    new TaskGemmi   (),
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
