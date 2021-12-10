
/*
 *  =================================================================
 *
 *    09.12.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// TaskListDialog class

function TaskListDialog ( dataBox,branch_task_list,tree,onSelect_func ) {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Task List' );
  document.body.appendChild ( this.element );

  var projectDesc = tree.projectData.desc;
  // console.log ( ' ntasks=' + tree.countTasks() );

  this.branch_tasks = [];
  for (var i=0;i<branch_task_list.length;i++)
    if (!branch_task_list[i].isRemark())
      this.branch_tasks.push ( branch_task_list[i] );

  this.dataBox       = dataBox;
  this.task          = this.branch_tasks[0];
  this.onSelect_func = onSelect_func;
  this.selected_task = null;  // will receive new task template or null if canceled

  // console.log ( ' jobs=' + projectData.tree[0].children.length );

  // if (dataBox.isEmpty())
  //   console.log ( 'empty' );
  // else {
  //   console.log ( 'not empty');
  // }
  // console.log ( '  l=' + branch_task_list.length );

  this.dlg_width  = window.innerWidth;
  this.dlg_width  = Math.min ( Math.max(700,4*this.dlg_width/9),6*this.dlg_width/8 );
  this.dlg_height = 6*window.innerHeight/8;

  this.tabs       = null;
  this.tabs_basic = null;
  this.tabs_full  = null;
  this.combobox   = null;
  var help_link   = __user_guide_base_url + 'jscofe_tasklist.html';
  if (projectDesc.startmode==start_mode.migrate)  {
    this.makeLayout ( 30 );
    this.combobox = new Combobox();
    this.combobox
        .addItem  ( 'Hop-on mode'  ,'basic',projectDesc.tasklistmode==tasklist_mode.basic )
        .addItem  ( 'Standard mode','full',projectDesc.tasklistmode==tasklist_mode.full  )
        .setWidth ( '180px' );
  } else if (projectDesc.startmode==start_mode.auto)  {
    if (tree.countTasks()>0)  {
      if (branch_task_list.length<1)
            this.makeLayout ( 21 );
      else  this.makeLayout ( 22 );
      this.combobox = new Combobox();
      this.combobox
          .addItem  ( 'Autostart mode','basic',projectDesc.tasklistmode==tasklist_mode.basic )
          .addItem  ( 'Standard mode' ,'full',projectDesc.tasklistmode==tasklist_mode.full  )
          .setWidth ( '180px' );
    } else  {
      this.makeLayout ( 20 );
      var help_link = __user_guide_base_url + 'jscofe_workflows.html';
    }
  } else
    this.makeLayout ( 10 );

  if (this.tabs_basic)  {
    this.tabs_basic.setVisible ( projectDesc.tasklistmode==tasklist_mode.basic );
    this.tabs_full .setVisible ( projectDesc.tasklistmode==tasklist_mode.full );
  }

  (function(self){

    $(self.element).dialog({
      resizable : true,
      height    : self.dlg_height,
      width     : self.dlg_width,
      maxHeight : $(window).height()-20,
      modal     : true,
      create    : function (e, ui) {
                    if (self.combobox)  {
                      var pane = $(this).dialog("widget")
                                        .find(".ui-dialog-buttonpane");
                      var span = new Widget ( 'span' );
                      $(span.element).prependTo(pane);
                      span.addWidget ( self.combobox );
                      self.combobox.make ();
                      $(span.element).css({
                        'position' : 'relative',
                        'left'     : '10px',
                        'top'      : '8px'
                      });
                    }
                  },
      buttons   : [
        { text  : 'Help',
          click : function() {
            new HelpBox ( '',help_link,null );
          }
        },
        { text  : 'Cancel',
          click : function() {
            if (self.combobox)
                  self.onSelect_func ( null,self.combobox.getValue() );
            else  self.onSelect_func ( null,null );
            $( this ).dialog( "close" );
          }
        }
      ]
    });


    if (self.tabs)  {
      $(self.element).on( "dialogresize", function(event,ui){
        //self.onResize();
        $(self.tabs.element).height ( self.element.innerHeight-16 );
        self.tabs.refresh();
      });
    }

    if (self.combobox)  {
      self.combobox.addOnChangeListener ( function(value,text){
        self.tabs_basic.setVisible ( value==tasklist_mode.basic );
        self.tabs_full.setVisible ( value==tasklist_mode.full );
        if (value=='full')  self.tabs_full.refresh();
                      else  self.tabs_basic.refresh();
      });
    }

  }(this));

  $(this.element).css ( 'width:100%' );

  if (this.combobox)  {
    $(this.tabs_basic.element).height ( this.element.innerHeight-16 );
    this.tabs_basic.refresh();
  }

  if (this.tabs_full)  {
    $(this.tabs_full.element).height ( this.element.innerHeight-16 );
    this.tabs_full.refresh();
  }

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
  var title = task_obj.title.replace ( 'Workflow: ','' );
  if (avail_key[0]!='ok')  {
    // title += '<br><span style="font-size:14px;"><i>** ' + avail_key[1] + '</i></span>';
    // title += '<br><i><font size="-1">** ' + avail_key[1] + '</font></i>';
    title = '<div style="line-height:16px;">' + title  +
            '<br><span style="font-size:13px;"><i>** ' + avail_key[1] +
            '</i></span></div>';
  } else  {
    var desc_title = task_obj.desc_title();
    if (desc_title)
      title = '<div style="line-height:16px;padding-top:4px;">' + title  +
              '<br><span style="font-size:13px;color:gray;">&nbsp;&nbsp;<i>-- ' + desc_title +
              '</i></span></div>';
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
        if (dlg.combobox)
              dlg.onSelect_func ( task_obj,dlg.combobox.getValue() );
        else  dlg.onSelect_func ( task_obj,null );
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


TaskListDialog.prototype.makeLayout = function ( key )  {

  if (key==20)  {
    // initial choice for autostart
    this.element.setAttribute ( 'title','Autostart' );
    var grid = new Grid ( '-compact' );
    this.addWidget ( grid );
    this.makeAutostartList ( grid );
    this.dlg_height = 'auto';
    return;
  }

  if (key>10)  {
    this.tabs_basic = new Tabs();
    this.addWidget ( this.tabs_basic );
    var tabb_workflows = null;
    var tabb_shortlist = null;
    if (key==21)  {
      tabb_workflows = this.tabs_basic.addTab ( 'Workflows',true );
      tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',false );
    } else if (key=22)  {
      tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',true );
      tabb_workflows = this.tabs_basic.addTab ( 'Workflows',false );
    } else
      tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',true );

    this.makeBasicList ( tabb_shortlist.grid,key );
    if (tabb_workflows)
      this.makeWorkflowsList ( tabb_workflows.grid );

    // if (key<30)  {
    //   var tabb_workflows = this.tabs_basic.addTab ( 'Workflows',true );
    //   this.makeWorkflowsList ( tabb_workflows.grid );
    // }
    // var tabb_shortlist = this.tabs_basic.addTab ( 'Essential tasks',(key==30) );
    // this.makeBasicList ( tabb_shortlist.grid,key );

  }

  this.tabs_full = new Tabs();
  this.addWidget ( this.tabs_full );
  var tabf_suggested = this.tabs_full.addTab ( 'Suggested tasks',true  );
  var tabf_fulllist  = this.tabs_full.addTab ( 'All tasks',false );
  var tabf_workflows = this.tabs_full.addTab ( 'Workflows',false );
  this.makeSuggestedList ( tabf_suggested.grid );
  this.makeFullList      ( tabf_fulllist .grid );
  this.makeWorkflowsList ( tabf_workflows.grid );

}


TaskListDialog.prototype.makeBasicList = function ( grid,key )  {
var r = 0;  // grid row

  //grid.setLabel ( '<h2>Basic tasks</h2>',r++,0,1,3 );
  //grid.setLabel ( 'Switch to full set for more tasks',r++,0,1,3 )
  //    .setFontItalic(true).setFontSize('85%');


  grid.setLabel ( 'Essential Tasks',r++,0,1,3 )
      .setFontSize('140%').setFontBold(true);
  grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');
  var infotip = '<i>This list contains ' + appName() +
                ' tasks commonly used for structure completion after running ' +
                'structure solution workflows. For full set of tasks, switch ' +
                'to </i>"Standard set"<i> below.</i>';
  if (key==30)
    infotip = '<i>This list contains ' + appName() +
              ' tasks commonly used for structure completion after importing ' +
              'partially solved structures. For full set of tasks, switch to ' +
              '</i>"Standard set"<i> below.</i>';
  grid.setLabel ( infotip,r++,0,1,3 ).setFontSize('90%');
  grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('20%');

  var task_list = [

    "Refinement",
    new TaskRefmac (),
    new TaskBuster (),
    new TaskCootMB (),
    new TaskLorestr(),

    "Ligands",
    new TaskMakeLigand(),
    new TaskFitLigand (),
    new TaskFitWaters (),

    "Import Additional Data",
    new TaskImportReplace (),
  ];

  if (key==30)
    task_list.push ( new TaskMigrate() );

  task_list = task_list.concat ([
    //new TaskImport     (),
    //new TaskImportSeqCP(),

    "Model Building",
    new TaskParrot   (),
    new TaskCCP4Build(),
    new TaskBuccaneer(),
    new TaskArpWarp  (),
    new TaskNautilus (),

    "Deposition",
    new TaskDeposition()

  ]);

  for (var i=0;i<task_list.length;i++)
    if (typeof task_list[i] === 'string' || task_list[i] instanceof String) {
      grid.setLabel ( '&nbsp;',r++,0,1,3 ).setHeight_px(4);
      grid.setLabel ( '<hr/>',r,0,1,1 );
      var grid1 = grid.setGrid ( '',r++,1,1,2 );
      grid1.setLabel ( '&nbsp;' + task_list[i] + '&nbsp;',0,0,1,1 )
           .setFontItalic(true).setFontBold(true).setNoWrap();
      grid1.setLabel ( '<hr/>',0,1,1,1 );
      grid1.setCellSize ( '10%','8px',0,0 );
      grid1.setCellSize ( '90%','8px',0,1 );
    } else if (this.setTask(task_list[i],grid,r,true))
      r++;

  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeAutostartList = function ( grid )  {
var r = 0;  // grid row

  // grid.setLabel ( 'Autostart Project',r++,0,1,3 )
  //     .setFontSize('140%').setFontBold(true);
  // grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');
  // grid.setLabel ( 'Choose starting workflow that matches your project best, ' +
  //                 'see details ' +
  //                 '<a href="javascript:launchHelpBox(\'Automatic Workflows\',' +
  //                 '\'' + __user_guide_base_url +
  //                 'jscofe_workflows.html\',null,10)">here</a>.',r++,0,1,3 )
  //     .setFontSize('90%').setFontItalic(true);
  // grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');

  grid.setLabel ( '<h3>Choose project template from options below that matches ' +
                  'your data best:</h3>',r++,0,1,4 );

  var task_list = [
    new TaskWFlowAMR(),
    new TaskWFlowSMR(),
    new TaskWFlowAEP(),
    new TaskWFlowDPL(),
  ];

  for (var i=0;i<task_list.length;i++)  {
    if (task_list[i].file_select.length>0)
      task_list[i].inputMode = 'root'; // force 'at root mode' for the task
    if (this.setTask(task_list[i],grid,r,true))
    r++;
  }

  grid.setLabel ( '&nbsp;<br><hr/>After data upload and starting, the project ' +
                  'tree unfolds automatically. More jobs from Task List can be ' +
                  'added to the project tree at any time, using the green plus ' +
                  'button.',r++,0,1,3 )
      .setFontSize('90%').setFontItalic(true);



  return r;  // indicates whether the tab is empty or not

}


TaskListDialog.prototype.makeWorkflowsList = function ( grid )  {
var r = 0;  // grid row

  grid.setLabel ( 'Automatic Workflows',r++,0,1,3 )
      .setFontSize('140%').setFontBold(true);
  grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');
  grid.setLabel ( 'Each workflow will run a series of tasks, see details ' +
                  '<a href="javascript:launchHelpBox(\'Automatic Workflows\',' +
                  '\'' + __user_guide_base_url +
                  'jscofe_workflows.html\',null,10)">here</a>.',r++,0,1,3 )
      .setFontSize('90%').setFontItalic(true);
  grid.setLabel ( '&nbsp;',r++,0,1,3 ).setFontSize('40%');


//'manuals/html-userguide/jscofe_workflows.html'

  // var ccp4go_autoMR = new TaskWFlowAMR();
  // if (this.dataBox.isEmpty())
  //   ccp4go_autoMR.inputMode = 'root'; // force 'at root mode' for the task

  var task_list = [
    "Workflows for starting a Project",
    new TaskWFlowAMR(),
    new TaskWFlowSMR(),
    new TaskWFlowAEP(),
    new TaskWFlowDPL(),
    "Workflows for using within a Project",
    new TaskWFlowREL()
  ];

  for (var i=0;i<task_list.length;i++)  {
    if (typeof task_list[i] === 'string' || task_list[i] instanceof String) {
      grid.setLabel ( '&nbsp;',r++,0,1,3 ).setHeight_px(4);
      grid.setLabel ( '<hr/>',r,0,1,1 );
      var grid1 = grid.setGrid ( '',r++,1,1,2 );
      grid1.setLabel ( '&nbsp;' + task_list[i] + '&nbsp;',0,0,1,1 )
           .setFontItalic(true).setFontBold(true).setNoWrap();
      grid1.setLabel ( '<hr/>',0,1,1,1 );
      grid1.setCellSize ( '10%','8px',0,0 );
      grid1.setCellSize ( '90%','8px',0,1 );
    } else {
      if (this.dataBox.isEmpty() && (task_list[i].file_select.length>0))
        task_list[i].inputMode = 'root'; // force 'at root mode' for the task
      if (this.setTask(task_list[i],grid,r,true))
      r++;
    }
  }

  return r;  // indicates whether the tab is empty or not

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

//   var ccp4go_task = new TaskCCP4go();
//   if (this.dataBox.isEmpty())
//     ccp4go_task.inputMode = input_mode.root; // force 'at root mode' for the task
// //    ccp4go_task.input_dtypes = [1]; // force 'at root mode' for the task
//   if (ccp4go_task.isTaskAvailable()[0]=='ok')
//     this.makeSection ( 'Combined Automated Solver <i>"CCP4 Go"</i>',[
//       'Recommended as first attempt or in easy cases',
//       ccp4go_task
//     ]);
  var section1 = section0;

  if (__user_role==role_code.developer)  {

    this.makeSection ( 'Documentation tools',[
      new TaskDocDev()
    ]);

    // var ccp4go2_task = new TaskCCP4go2();
    // if (this.dataBox.isEmpty())
    //   ccp4go2_task.inputMode = input_mode.root; // force 'at root mode' for the task
    // //  ccp4go2_task.input_dtypes = [1]; // force 'at root mode' for the task
    // /*
    // if (ccp4go2_task.isTaskAvailable()[0]=='ok')
    //   this.makeSection ( 'Combined Automated Solver <i>"CCP4 Go-2"</i>',[
    //     'Recommended as first attempt or in easy cases',
    //     ccp4go2_task
    //   ]);
    // */

    this.makeSection ( 'Tasks in Development',[
      // new TaskCootUtils    (),
      // ccp4go2_task,
      new TaskModelPrepMC  (),
      new TaskModelCraft   (),  // excluded also from the bootstrap html
      new TaskSheetbend    (),  // excluded also from the bootstrap html
      new TaskJLigand      (),
      new TaskFragon       (),
      new TaskMergeData    (),
      new TaskHelloWorld   ()
    ]);

  }

  var data_import_tasks = [
    new TaskImport        (),
    new TaskImportSeqCP   (),
    new TaskImportPDB     (),
    new TaskImportReplace (),
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
    new TaskSimbad() //,
    // 'No-model methods',
    // new TaskAmple ()
  ]);

  this.makeSection ( 'Molecular Replacement',[
    'MR model preparation',
    new TaskMrParse        (),
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

  this.makeSection ( 'Fragment-Based Molecular Replacement',[
    new TaskArcimboldoLite(),
    new TaskArcimboldoBorges(),
    new TaskArcimboldoShredder()
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
    //new TaskCootMB   (),
    new TaskCombStructure()
  ]);


  this.makeSection ( 'Coot',[
    new TaskCootMB(),
    new TaskCootCE(),
  ]);

  this.makeSection ( 'Ligands',[
    new TaskMakeLigand(),
    new TaskFitLigand (),
    new TaskFitWaters ()
  ]);

  this.makeSection ( 'Validation, Analysis and Deposition',[
    new TaskZanuda    (),
    new TaskPrivateer (),
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
