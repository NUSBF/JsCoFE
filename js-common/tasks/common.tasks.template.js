
/*
 *  =================================================================
 *
 *    19.07.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-common/cofe.tasks.template.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Task Template Class
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2019
 *
 *  =================================================================
 *
 */


// ===========================================================================
// Task classes MUST BE named as 'TaskSomething' AND put in file named
// ./js-common/tasks/common.tasks.something.js . This convention is used
// for class reconstruction from json strings

var job_code = {
  new      : 'new',      // new job_code
  running  : 'running',  // job is running
  exiting  : 'exiting',  // job is in post-run processing
  finished : 'finished', // job finished normally (nothing to do with the results)
  failed   : 'failed',   // job failed
  stopped  : 'stopped',  // job stopped (terminated by user)
  remark   : 'remark',   // remark node
  remdet   : 'remdet',   // detached remark node
  remdoc   : 'remdoc'    // remark node converted from documentation import
}

// ---------------------------------------------------------------------------
// variables to be exported

var jobDataFName      = 'job.meta';
var jobReportDirName  = 'report';
var jobInputDirName   = 'input';
var jobOutputDirName  = 'output';
var jobReportHTMLName = 'index.html';
var jobReportTaskName = 'task.tsk';

var dbx = null;
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
  dbx = require('../dtypes/common.dtypes.box');


// ===========================================================================

function TaskTemplate()  {

  this._type        = 'TaskTemplate';        // must be class name
  this.version      = this.currentVersion(); // actual version of task class

  this.project      = '';   // project name (stable)
  this.id           = 0;    // job Id (stable)
  this.treeItemId   = '';   // id of associated job tree item (unstable)
  this.name         = 'template';
  this.uname        = '';   // name given by user, overrides 'name' if not empty
  this.title        = 'Template';
  this.oname        = 'template'; // default output file name template
  this.uoname       = '';         // output file name template given by user
  this.state        = job_code.new;  // 'new', 'running', 'finished'
  this.helpURL      = null;   // (relative) url to help file, null will hide the help button
  this.nc_type      = 'ordinary'; // required Number Cruncher type
  this.fasttrack    = false;  // no fasttrack requirements
  this.informFE     = true;   // end of job and results are sent back to FE

  this.upload_files = [];   // list of uploaded files
  this.input_dtypes = [];   // input data type definitions; []: any input data is allowed;
                            // [1]: no data is required but the task is allowed only
                            // on the topmost level of job tree
  if (dbx)  {
    this.input_data  = new dbx.DataBox(); // actual input data, represented by DataBox
    this.output_data = new dbx.DataBox(); // actual output data, represented by DataBox
  } else  {
    this.input_data  = new DataBox(); // actual input data, represented by DataBox
    this.output_data = new DataBox(); // actual output data, represented by DataBox
  }

  this.parameters      = {};  // input parameters

  this.layCustom       = {};  // parameters for custom layout

  this.job_dialog_data = {  // used for per-task positioning of job dialog
    position  : { my : 'center top',   // job dialog position reference
                  at : 'center top+5%' }, // job dialog offset in the screen
    width     : 0,       // job dialog panel width
    height    : 0,       // job dialog panel height
    panel     : 'input', // currently selected panel
    job_token : 0,       // job token for client job when running
    viewed    : true     // set false after finishing, true after Job Dialog
  }

  this.associated       = [];  // used in the data provenance framework
  this.harvestedTaskIds = [];  // ids of tasks chosen by direct multiple selection
                               // as data suppliers for this one; used in job
                               // dialogs
  //this.harvestLinks     = [];  // ids of tasks linked to this one through direct
                                 // multiple selections in job tree; used for the
                                 // identification of job chains at job deletion

  this.disk_space = 0.0;  // in MBs; calculated after job is done
  this.cpu_time   = 0.0;  // in hours; calculated after job is done

//  this.doNotPackSuffixes = ['.map'];
//  this.doPackSuffixes    = [''];      // prevails

}


// ===========================================================================

TaskTemplate.prototype.icon = function()  { return 'process'; }

// task.platforms() identifies suitable platforms:
//   'W"  : Windows
//   'L'  : Linux
//   'M'  : Mac
//   'U'  : Unix ( = Linux + Mac)
TaskTemplate.prototype.platforms = function()  { return 'WLMU'; }

TaskTemplate.prototype.doNotPackSuffixes = function()  { return ['.map']; }
TaskTemplate.prototype.doPackSuffixes    = function()  { return ['']; }

// when data class version is changed here, change it also in python
// constructors
TaskTemplate.prototype.currentVersion = function()  { return 1; }

TaskTemplate.prototype.isRemark = function()  {
  return  (this.state==job_code.remark) ||
          (this.state==job_code.remdet) ||
          (this.state==job_code.remdoc);
}

TaskTemplate.prototype.isRunning = function()  {
  return ((this.state==job_code.running) || (this.state==job_code.exiting));
}

TaskTemplate.prototype.isComplete = function()  {
  return ((this.state!=job_code.new) && (this.state!=job_code.running) &&
          (this.state!=job_code.exiting));
}

// estimated cpu cost of the job, in hours
TaskTemplate.prototype.cpu_credit = function()  {
  return 0.02;
}


// export such that it could be used in both node and a browser
if (!dbx)  {
  // for client side

  TaskTemplate.prototype.canMove = function ( node,jobTree )  {
  var parent_task = jobTree.getTaskByNodeId(node.parentId);
  var can_move    = false;

    //if (parent_task && (this.state!=job_code.new) &&
    if ((this.state!=job_code.new) &&
        (this.state!=job_code.running) && (this.state!=job_code.exiting))  {

      var p = jobTree.getNodePosition(node);
      var pos   = p[0];  // sibling position (<=0 means "leading sibling")
      var pnode = p[1];
      var pid   = p[2];
      var clen  = p[3];  // number of siblings

      can_move = true;
      //if (pnode && pid && (pos<=0) && (clen<2))  {
      if ((pos<=0) && (clen<2))  {
        // no siblings -- check input data
      //if (pnode && pid && ((pos<=0) || (clen<2)))  {
        // no siblings or seniour sibling -- check input data
        if (parent_task)  {
          for (var dtype in this.input_data.data)  {
            var d = this.input_data.data[dtype];
            for (var j=0;(j<d.length) && can_move;j++)
              if (d[j].jobId==parent_task.id)
                can_move = false;
            if (!can_move)
              break;
          }
        } else
          can_move = false;
      }

    }

    return can_move;

  }


  TaskTemplate.prototype.getProjectURL = function ( jobId,filePath )  {
  // forms pseudo-URL for accesing file with 'filePath' relative to job
  // directory of given (NOT THIS) job in same project as 'this' one
  var token;
    //if (__login_token)  token = __login_token.getValue();
    if (__login_token)  token = __login_token;
                  else  token = '404';
    var url = special_url_tag + '/' + token + '/' + this.project + '/' +
              jobId + '/' + filePath;
    //return replaceAll ( url,'/','@' );
    return url;
  }


  TaskTemplate.prototype.getURL = function ( filePath )  {
  // forms pseudo-URL for accesing file with 'filePath' relative to job
  // directory
  var token;
    //if (__login_token)  token = __login_token.getValue();
    if (__login_token)  token = __login_token;
                  else  token = '404';
    var url = special_url_tag + '/' + token + '/' + this.project + '/' +
              this.id + '/' + filePath;
    //return replaceAll ( url,'/','@' );
    return url;
  }

  TaskTemplate.prototype.getLocalReportPath = function()  {
    return 'report/index.html';
  }

  TaskTemplate.prototype.getReportURL = function()  {
  // forms pseudo-URL for accessing files in job's report directory
  var token;
    //if (__login_token)  token = __login_token.getValue();
    if (__login_token)  token = __login_token;
                  else  token = '404';
    // 'report/index.html' is hard-wired here and is used by cofe server,
    // which sends cofe-specific jsrview bootrstrap html file back.
    var url = special_url_tag + '/' + token + '/' + this.project + '/' +
              this.id + '/' + this.getLocalReportPath();
    //return replaceAll ( url,'/','@' );
    return url;
  }

/*
  TaskTemplate.prototype.addHarvestLink = function ( taskId )  {
    if (this.harvestLinks.indexOf(taskId)<0)
      this.harvestLinks.push ( taskId );
  }
*/

  TaskTemplate.prototype.makeInputPanelHeader = function()  {
  // header for inputPanel, displayed in JobDialog

    function putLabel ( text,row,col )  {
      var lbl = header.setLabel ( text,row,col,1,1 )
                      .setFontItalic(true).setNoWrap().setHeight('1em');
      header.setVerticalAlignment ( row,col,'middle' );
      header.setCellSize ( '2%' ,'', row,col );
      return lbl;
    }

    function putInput ( text,prompt,row,col )  {
      //var txt = text.replace ( /<(?:.|\n)*?>/gm, '' );
      var n = text.indexOf('<b>');
      if (n<0)
        n = text.indexOf ( ' -- ' );
      if (n<0)
        n = text.length;
      var inp = header.setInputText ( text.substring(0,n).trim(),row,col,1,1 )
                      .setStyle     ( 'text','',prompt.replace(/<(?:.|\n)*?>/gm, '') );
                      //.setHeight    ( '1em' );
      header.setVerticalAlignment ( row,col,'middle' );
      header.setCellSize ( '98%','', row,col );
      return inp;
    }

    var header = new Grid ( '' );
    header.task_icon = header.setImage ( image_path(this.icon()),'','80px', 0,0, 3,1 );
    header.setLabel ( ' ', 0,1, 3,1 ).setWidth_px(20).setHeight ( '0.5em' );
    var row = 0;
    var t   = this.title;
    if (this.oname=='*')
      t += '<sup>&nbsp;</sup>'
    header.title = header.setLabel ( '<b>' + t + '</b>',row++,2, 1,2 )
                         .setFontSize ( '150%' ).setNoWrap();

    header.uname_lbl = putLabel ( 'job description:&nbsp;',row,0 );
    header.setVerticalAlignment ( row,0,'middle' );
    header.uname_inp = putInput ( this.uname.trim(),this.name,row++,1 )
                                .setWidth ( '90%' ); //.setHeight_px ( 18 );

    if (this.oname!='*')  {
      header.uoname_lbl = putLabel ( 'output id:&nbsp;',row,0 );
      header.setVerticalAlignment  ( row,0,'middle' );
      header.uoname_inp = putInput ( this.uoname.trim(),this.oname,row,1 )
                                   .setWidth_px(200);//.setHeight_px ( 18 );
    }

    header.setHLine ( 1, 3,0,1,4 );

    return header;

  }

  // reserved function name
  TaskTemplate.prototype.makeInputLayout = function()  {
  // This function may be reimplemented in task dialogs. It must return
  // a div widget, which is filled up in makeInputPanel() and then gets
  // inserted in Job Dialog. For proper sizing in JobDialog, the div should
  // have two parts: div.header and div.panel. JobDialog always keeps
  // div.header on top, while div.panel may be resized and scrolled as
  // necessary. All job input data and parameters are placed in div.grid,
  // which is actually embedded in div.panel.

    // make panel with a standard header
    var div    = new Widget ( 'div' );
    div.header = this.makeInputPanelHeader();
    div.addWidget     ( div.header );
    div.setScrollable ( 'hidden','hidden' );

    // make panel with grid for data files and input parameters
    div.panel = new Widget  ( 'div'      );
    div.addWidget           ( div.panel  );
    div.grid  = new Grid    ( '-compact' );
    div.panel.addWidget     ( div.grid   );
    div.panel.setScrollable ( 'auto','auto' );
    div.grid.inputPanel     = div;
    div.fullVersionMismatch = false;  // important for data versioining

    if ('uname_inp' in div.header)  {
      (function(task){
        div.header.uname_inp.element.oninput = function(){
          task.uname = div.header.uname_inp.getValue().trim();
          div.emitSignal ( cofe_signals.jobDlgSignal,
                           job_dialog_reason.rename_node );
        }
        div.header.uname_inp.element.onpropertychange =
                                 div.header.uname_inp.element.oninput; // for IE8
      }(this))
    }

    return div;

  }


  // reserved function name
  TaskTemplate.prototype.makeInputPanel = function ( dataBox )  {
  // returns widget (e.g. div) with input data and parameters, which
  // is inserted in Job Dialog

    var div = this.makeInputLayout();

    // will lay widget on invisible grid in order to avoid transient visual
    // effects; the grid will be made visible in this.layParameters()
    div.grid.setVisible ( false );

    this.setInputDataFields ( div.grid,0,dataBox,this );
    this.layParameters      ( div.grid,div.grid.getNRows()+1,0 );

    return div;

  }


  // update() may provide an action to update input panel after it is placed
  // in Job Dialog.
  TaskTemplate.prototype.updateInputPanel = function ( inputPanel ) {}


  // reserved function name
  TaskTemplate.prototype.collectInput = function ( inputPanel )  {
  // Collects data from input widgets, created in makeInputPanel() and
  // stores it in internal fields. Returns empty string if input is
  // validated, and an error message otherwise

  var msg = '';  // The output. If everything's Ok, 'msg' remains empty,
                 // otherwise, it ocntains a concatenation of errors found.

    if (inputPanel.hasOwnProperty('header'))  {
      if (inputPanel.header.hasOwnProperty('uname_inp'))  {
        this.uname = inputPanel.header.uname_inp.getValue().trim();
        inputPanel.emitSignal ( cofe_signals.jobDlgSignal,
                                job_dialog_reason.rename_node );
      }
      if (inputPanel.header.hasOwnProperty('uoname_inp'))
        this.uoname = inputPanel.header.uoname_inp.getValue();
    }

    msg = this.collectInputData ( inputPanel );
    if (msg.length>0)
      msg += '<br>';
    msg += this.collectParameterValues ( inputPanel );
    return msg;

  }


  TaskTemplate.prototype.sendInputStateEvent = function ( inputPanel )  {
  // collects data from input widgets, created in makeInputPanel() and
  // stores it in internal fields
    inputPanel.emitSignal ( cofe_signals.taskReady,this.collectInput(inputPanel) );
  }


  TaskTemplate.prototype.sendTaskStateSignal = function ( inputPanel,state_str )  {
    inputPanel.emitSignal ( cofe_signals.taskReady,state_str );
  }


  // reserved function name, may be ovewritten in task classes
  TaskTemplate.prototype.runButtonName = function()  {
    // return text for 'Run' button in Job Dialog
    return 'Run';
  }

  /*
  function _fill_dropdown ( ddn )  {
    for (var j=0;j<ddn.ddndata.length;j++)
      if (ddn.ddndata[j][0])  {
        ddn.addItem ( ddn.ddndata[j][0],'',ddn.ddndata[j][1],ddn.ddndata[j][2] );
        if (ddn.ddndata[j][3])
          ddn.disableItem ( k,true );
      }
    return;
  }
  */


  TaskTemplate.prototype.setInputDataFields = function ( grid,row,dataBox ) {
  // Sets dropdown controls for input data from 'dataBox' in grid 'grid'
  // starting from row 'row'

    /*
    function _fill_dropdowns ( dropdowns )  {
      for (var n=0;n<dropdowns.length;n++)  {
        var ddn = dropdowns[n];
        for (var j=0;j<ddn.ddndata.length;j++)
          if (ddn.ddndata[j][0])  {
            ddn.addItem ( ddn.ddndata[j][0],'',ddn.ddndata[j][1],ddn.ddndata[j][2] );
            if (ddn.ddndata[j][3])
              ddn.disableItem ( k,true );
          }
      }
      return;
    }
    */

    function _fill_dropdown ( ddn )  {
      var ddndata = ddn.ddndata;
      for (var j=0;j<ddndata.length;j++)
        if (ddndata[j][0])  {
          ddn.addItem ( ddndata[j][0],'',ddndata[j][1],ddndata[j][2] );
          if (ddn.ddndata[j][3])
            ddn.disableItem ( ddndata[j][1],true );
        }
      return;
    }

    function _select_item ( ddn,itemId )  {
      for (var j=0;j<ddn.ddndata.length;j++)
        if (ddn.ddndata[j][0])
          ddn.ddndata[j][2] = (ddn.ddndata[j][1]==itemId);
      return;
    }

    function _fill_optimized ( ddn,selItemId )  {
      var ddndata = ddn.ddndata;

      for (var j=0;j<ddndata.length;j++)
        if (ddndata[j][0])
          ddndata[j][2] = (ddndata[j][1]==selItemId);

      for (var j=0;j<ddndata.length-1;j++)
        if (ddndata[j][0])
          for (var k=j+1;k<ddndata.length;k++)
            if (ddndata[k][0] && (ddndata[k][0]==ddndata[j][0]))  {
              if (ddndata[k][2])
                ddndata[j] = ddndata[k];
              ddndata[k] = [null];
            }

      for (var j=0;j<ddndata.length;j++)
        if (ddndata[j][0])  {
          ddn.addItem ( ddndata[j][0],'',ddndata[j][1],ddndata[j][2] );
          if (ddndata[j][3])
            ddn.disableItem ( ddndata[j][1],true );
        }

      return;

    }

    // do  nothing if input data fields section is not required
    if ((this.input_dtypes.length==1) && (this.input_dtypes[0]==1))
      return;

    dataBox.extendData();

    // this is necessary for proper stacking of dropdown controls:
    $(grid.element).css('position','relative');

    // inpDataRef will be used in getInputData(..) (below) to set current
    // contents of dropdown controls in this.input_data
    grid.inpDataRef = { row   : row,
                        grid  : grid,
                        input : [] };

    // generate vectors of suitable (subject to subtypes) datasets; for
    // simplicity, keep just the dataset serial numbers
    var dsn = [];  // dsn[i][j] gives serial number of jth dataset
                   // suitable for ith input data parameter
    var ddt = [];  // ddt[i][j] gives dataset with serial number j of data type
                   // compatible with ith input parameter
    var ddf = [];  // ddf[i] is true if any data, suitable for ith input
                   // parameter, was generated in the previous job

    // allocate dropdown widgets
    var dropdown = [];  // dropdown[i][j] gives jth dropdown widget for ith
                        // input data parameter

    grid.void_data = {};  // collectes data from 'void' data entries

    for (var i=0;i<this.input_dtypes.length;i++)  {
      // loop over input data structures in 'this' task

      var inp_item = this.input_dtypes[i];
      var dn       = [];
      var dt       = [];
      var df       = false;

      if (!startsWith(inp_item.inputId,'void'))  {

        var k = 0;
        for (var dtype in inp_item.data_type)
          if (dtype in dataBox.data)  {  // given data type is found in the data box

            if (dtype in dataBox.data_n0)
              df = true;

            var dt1 = dataBox.data[dtype];

            if (('castTo' in inp_item) && (inp_item.castTo!=dtype))  {
              for (var j=0;j<dt1.length;j++)
                dt.push ( dt1[j].cast(inp_item.castTo) );
            } else
              dt = dt.concat ( dt1 );

            if (inp_item.data_type[dtype].length<=0)  {
              for (var j=0;j<dt1.length;j++)
                dn.push ( k++ );
            } else  {
              for (var j=0;j<dt1.length;j++)  {
                if (dataBox.compareSubtypes(inp_item.data_type[dtype],dt1[j].subtype))
                  dn.push ( k );
                k++;
              }
            }

          }

        // acquire currently selected data, corresponding to current data id,
        // from the task; this list is empty (zero-length) at first creation
        // of the interface
        var inp_data = this.input_data.getData ( inp_item.inputId );

        var j = -1;
        for (var n=0;n<inp_data.length;n++)  {
          j++;
          while ((j<dt.length) && (dt[j].dataId!=inp_data[n].dataId))
            j++;
          if (j<dt.length)
            dt[j] = inp_data[n].extend();
        }

      } else  {

        var void_data = [];
        for (var dtype in inp_item.data_type)
          if (dtype in dataBox.data)  // given data type is found in the data box
            void_data = void_data.concat ( dataBox.data[dtype] );

        grid.void_data[inp_item.inputId] = void_data;

      }

      dsn.push ( dn );
      ddt.push ( dt );
      ddf.push ( df );
      dropdown.push ( [] );

    }

    // 1. Fill all dropdowns with data and lay them out with all other widgets

    var versionMatch = true;
    grid.inputPanel.fullVersionMismatch = false;

    var r = row;
    for (var i=0;i<this.input_dtypes.length;i++)  {
      // loop over input data structures in 'this' task

      var dt = ddt[i];
      var dn = dsn[i];

      // check if given data type is present in the data box
      if (dn.length>0)  {

        var inp_item = this.input_dtypes[i];

        // acquire currently selected data, corresponding to current data id,
        // from the task; this list is empty (zero-length) at first creation
        // of the interface
        var inp_data = this.input_data.getData ( inp_item.inputId );

        var layCustom = '';
        if (inp_item.hasOwnProperty('customInput'))
          layCustom = inp_item.customInput;

        var inp_item_version = 0;
        if (inp_item.hasOwnProperty('version'))
          inp_item_version = inp_item.version;

        var nmax = Math.min ( dn.length,inp_item.max );  // maximum number of
                                                         // datasets to display

        // force>0 will force choosing N=force data items (if available)
        // at first data load
        var ndset = inp_item.min;
        if (inp_item.hasOwnProperty('force'))
          ndset = Math.max ( ndset,inp_item.force );

        for (var n=0;n<nmax;n++)  {

          dropdown[i].push ( new Dropdown() );
          var ddn     = dropdown[i][n];
          ddn.dataBox = dataBox;
          ddn.row     = r;
          ddn.task    = this;
          ddn.grid    = grid;

          // put label widget in the Grid
          var label_text = inp_item.label;
          if (nmax>1)
            label_text = label_text + ' (' + (n+1) + ')';
          var label = grid.setLabel ( label_text, r,0, 1,1 ).setFontItalic(true)
                                          .setFontBold(true).setNoWrap();
          grid.setCellSize          ( '5%','',r,0  );
          grid.setVerticalAlignment ( r,0,'middle' );

          if (inp_item.hasOwnProperty('tooltip'))
            label.setTooltip ( inp_item.tooltip );

          grid.setLabel    ( '&nbsp;', r,1, 1,1 );
          grid.setCellSize ( '1%','' , r,1 );
          ddn.inspect_btn = grid.setButton  ( '',image_path('inspect'),r,2,1,1 )
                                .setTooltip ( 'Inspect details' )
                                .setSize    ( '32px','32px' )
                                .setVisible ( false );
          grid.setCellSize ( '1%','' , r,2 );

          (function(d,t,task){;
            d.inspect_btn.addOnClickListener ( function(){
              t[d.getValue()].inspectData ( task );
            });
          }(ddn,dt,this));

          var sel = true;
          if (n>=inp_item.min)  {
            if (inp_item.hasOwnProperty('unchosen_label') && (n==0))  {
              ddn.addItem ( inp_item.unchosen_label,'',-1,(n>=ndset) );
              //ddn.addItem ( 'something else','',-2,(n>=ndset+1) );
            } else
              ddn.addItem ( '[do not use]','',-1,(n>=ndset) );
            sel = (n<inp_item.min);
          }
          /*
          if (n>=ndset)  {
            ddn.addItem ( '[do not use]','',-1,sel );
            sel = false;
          }
          */

          // fill up the combobox with data names from the box, using positive
          // itemIds and making selections as appropriate
          /*
          var ndisabled = 0;
          for (var j=0;j<dn.length;j++)  {
            var k = dn[j];
            var data_title = dt[k].dname;
            if ('cast' in inp_item)  {
              var cast1  = '/' + inp_item.cast + '/';
              var p = data_title.indexOf ( '/xyz/' );
              if (p<0)  p = data_title.indexOf ( '/hkl/' );
              if (p<0)  p = data_title.indexOf ( '/unmerged/'  );
              if (p<0)  p = data_title.indexOf ( '/seqeunce/'  );
              if (p<0)  p = data_title.indexOf ( '/ensemble/'  );
              if (p<0)  p = data_title.indexOf ( '/structure/' );
              if (p<0)  p = data_title.indexOf ( '/substructure/' );
              if (p>0)  data_title = data_title.substr(0,p) + cast1;
                  else  data_title += ' ' + cast1;

              //data_title = data_title.replace ( '/xyz/'     ,cast1 );
              //data_title = data_title.replace ( '/hkl/'     ,cast1 );
              //data_title = data_title.replace ( '/unmerged/',cast1 );
              //data_title = data_title.replace ( '/sequence/',cast1 );
              //data_title = data_title.replace ( '/ensemble/',cast1 );

            }
            ddn.addItem ( data_title,'',k,sel && (j==n) );
            if (dt[k].version<inp_item_version)  {
              ddn.disableItem ( k,true );
              ndisabled++;
            }
          }
          */

          var ndisabled = 0;
          var ddndata   = [];
          for (var j=0;j<dn.length;j++)  {
            var k = dn[j];
            var data_title = dt[k].dname;
            if ('cast' in inp_item)  {
              var cast1  = '/' + inp_item.cast + '/';
              var p = data_title.indexOf ( '/xyz/' );
              if (p<0)  p = data_title.indexOf ( '/hkl/' );
              if (p<0)  p = data_title.indexOf ( '/unmerged/'  );
              if (p<0)  p = data_title.indexOf ( '/seqeunce/'  );
              if (p<0)  p = data_title.indexOf ( '/ensemble/'  );
              if (p<0)  p = data_title.indexOf ( '/structure/' );
              if (p<0)  p = data_title.indexOf ( '/substructure/' );
              if (p>0)  data_title = data_title.substr(0,p) + cast1;
                  else  data_title += ' ' + cast1;

              //data_title = data_title.replace ( '/xyz/'     ,cast1 );
              //data_title = data_title.replace ( '/hkl/'     ,cast1 );
              //data_title = data_title.replace ( '/unmerged/',cast1 );
              //data_title = data_title.replace ( '/sequence/',cast1 );
              //data_title = data_title.replace ( '/ensemble/',cast1 );

            }
            ddndata.push ( [data_title,k,(sel && (j==n)),(dt[k].version<inp_item_version)] )
            if (dt[k].version<inp_item_version)
              ndisabled++;
          }

          ddn.ddndata = ddndata;

          /*
          console.log ( ' -------------------------------------------------------------------')
          if (!this.input_data.isEmpty())
            for (var j=0;j<ddndata.length-1;j++)
              if (ddndata[j][0])  {
                console.log ( '1  '+j+'  ' + ddndata[j] );
                for (var k=j+1;k<ddndata.length;k++)
                  if (ddndata[k][0] && (ddndata[k][0]==ddndata[j][0]))  {
                    console.log ( '2  '+k+'  ' + ddndata[k] );
                    if (ddndata[k][2])
                      ddndata[j] = ddndata[k];
                    ddndata[k] = [null];
                  }
              }

          var ndisabled = 0;
          for (var j=0;j<ddndata.length;j++)
            if (ddndata[j][0])  {
              ddn.addItem ( ddndata[j][0],'',ddndata[j][1],ddndata[j][2] );
              if (ddndata[j][3])  {
                ddn.disableItem ( k,true );
                ndisabled++;
              }
            }
          */

          if (ndisabled>0)  versionMatch = false;
          if ((n<inp_item.min) && (ndisabled==dn.length) && (ndisabled>0))
                                    grid.inputPanel.fullVersionMismatch = true;

          // put the combobox in the Grid
          grid.setWidget   ( ddn,r,3, 1,1 );
          grid.setHorizontalAlignment ( r,3,'left' );
          grid.setCellSize ( '10%','',r,3 );
          grid.setLabel    ( ' ',r,4, 1,1 );
          grid.setCellSize ( '84%','',r,4 );
//          ddn.setZIndex    ( 400-r );  // prevent widget overlap
          ddn.make();

          r++;
          ddn.layCustom = layCustom;
          ddn.serialNo  = n;
          if (layCustom)  {
            ddn.customGrid = grid.setGrid ( '-compact',r++,3,1,1 );
            dt[dn[n]].layCustomDropdownInput ( ddn );
//            ddn.customGrid.setVisible ( (n<inp_item.min) );
            ddn.customGrid.setVisible ( (n<ndset) );
          }
          ddn.dt   = dt;
          //ddn.dt = [];
          //for (var j=0;j<dt.length;j++)
          //  ddn.dt.push ( dt[j] );
          (function(dd,m){
            dd[m].addSignalHandler ( 'state_changed',function(data){
              dd[m].inspect_btn.setVisible ( data.item!=-1 );
              if (dd[m].layCustom)  {
                for (var j=0;j<dd.length;j++)
                  if ((j!=m) && (dd[j].getValue()>=0))
                    dd[j].dt[dd[j].getValue()].collectCustomDropdownInput ( dd[j] );
                if ((data.prev_item!==undefined) && (data.prev_item>=0))  {
                  dd[m].dt[data.prev_item].collectCustomDropdownInput ( dd[m] );
                }
                if (data.item>=0)  {
                  dd[m].customGrid.clear();
                  dd[m].dt[data.item].layCustomDropdownInput ( dd[m] );
                }
                dd[m].customGrid.setVisible ( data.item!=-1 );
              }
            });
          }(dropdown[i],n));

        }

        // make a reference to the combobox in the inpDataRef structure for
        // further reading in 'collectInputData()'
        grid.inpDataRef.input.push ( { inputId  : inp_item.inputId,
                                       dt       : dt,
                                       dropdown : dropdown[i] } );

      }

    }

    // 2. Select datasets in dropdowns

    if (this.input_data.isEmpty())  {

      // 2a. The interface is being created for the first time, need to choose
      //     initial datasets. Firstly, use (compatible) datasets generated by
      //     the previous job. These datasets are marked in dataBox.data_n0.

      // initiate collection of associated datasets
      var associated_data = [];

      // loop over input data structures in 'this' task
      for (var i=0;i<this.input_dtypes.length;i++)
        if ((dropdown[i].length>0) && ddf[i])  {

          var dt = ddt[i];
          var dn = dsn[i];

          // check if given data type is present in the data box
          if (dn.length>0)  {

            var inp_item = this.input_dtypes[i];

            // force>0 will force choosing N=force data items (if available)
            // at first data load
            var force = 0;
            if (inp_item.hasOwnProperty('force'))
              force = inp_item.force;

            // maximum number of datasets to display
            var nmax = Math.min ( dn.length,Math.max(inp_item.min,force) );

            for (var n=0;n<nmax;n++)  {
              if (dn[n]>=0)
                associated_data = associated_data.concat ( dt[dn[n]].associated );
              //dropdown[i][n].selectItem ( dn[n] );
              _select_item ( dropdown[i][n],dn[n] );
              dropdown[i][n].inspect_btn.setVisible ( true );
            }

          }

          for (var n=0;n<dropdown[i].length;n++)
            _fill_dropdown ( dropdown[i][n] );

        }

      // set remaining datasets by associations

      // loop over input data structures in 'this' task
      for (var i=0;i<this.input_dtypes.length;i++)
        if ((dropdown[i].length>0) && (!ddf[i]))  {

          var dt = ddt[i];
          var dn = dsn[i];

          // check if given data type is present in the data box
          if (dn.length>0)  {

            var inp_item  = this.input_dtypes[i];
            var inp_assoc = [];
            for (var dtype in inp_item.data_type)
              if (dtype in dataBox.inp_assoc)
                inp_assoc = inp_assoc.concat ( dataBox.inp_assoc[dtype] );

            // force>0 will force choosing N=force data items (if available)
            // at first data load
            var force = 0;
            if (inp_item.hasOwnProperty('force'))
              force = inp_item.force;
            else  {  // try to load all relevant associated data
              for (var j=0;j<dn.length;j++)
                if (associated_data.indexOf(dt[dn[j]].dataId)>=0)
                  force++;
            }

            // maximum number of datasets to display
            var nmax = Math.min ( dn.length,Math.max(inp_item.min,force) );

            var k = 0;
            var a = true;
            for (var n=0;n<nmax;n++)  {
              if (a)  {
                while (k<dn.length)
                  if (associated_data.indexOf(dt[dn[k]].dataId)>=0)  break;
                                                               else  k++;
                if (k>=dn.length)  {
                  a = false;
                  k = 0;
                }
              }
              if (!a)  {
                while (k<dn.length)
                  if (inp_assoc.indexOf(dt[dn[k]].dataId)>=0)  break;
                                                         else  k++;
                if (k>=dn.length)  {
                  k = 0;
                } else
                  a = true;
              }
              if (!a)  {
                while (k<dn.length)
                  if (associated_data.indexOf(dt[dn[k]].dataId)<0)  break;
                                                              else  k++;
                if (k>=dn.length)
                  k = n;
              }
              if (dn[k]>=0)
                associated_data = associated_data.concat ( dt[dn[k]].associated );
              var layCustom = dropdown[i][n].layCustom;
              dropdown[i][n].layCustom = '';
              //dropdown[i][n].selectItem ( dn[k] );
              _select_item ( dropdown[i][n],dn[n] );
              dropdown[i][n].inspect_btn.setVisible ( true );
              if (layCustom)  {
                dropdown[i][n].layCustom = layCustom;
                dropdown[i][n].customGrid.clear();
                dt[dn[k]].layCustomDropdownInput ( dropdown[i][n] );
                dropdown[i][n].customGrid.setVisible ( true );
              }
              k++;
            }

          }

          for (var n=0;n<dropdown[i].length;n++)
            _fill_dropdown ( dropdown[i][n] );

        }

    } else  {
      // 2b. Repeat invokation of the interface -- simply put data stored
      //     in the task

      // loop over input data structures in 'this' task
      for (var i=0;i<this.input_dtypes.length;i++)
        if (dropdown[i].length>0)  {
          var dt = ddt[i];
          var dn = dsn[i];

          // check if given data type is present in the data box
          if (dn.length>0)  {

            var inp_item = this.input_dtypes[i];

            // acquire currently selected data, corresponding to current data id,
            // from the task; this list is empty (zero-length) at first creation
            // of the interface
            var inp_data = this.input_data.getData ( inp_item.inputId );

            var j = -1;
            for (var n=0;n<inp_data.length;n++)  {
              j++;
              while ((j<dn.length) && (dt[dn[j]].dataId!=inp_data[n].dataId))
                j++;
              if (j<dn.length)  {
                var layCustom = dropdown[i][n].layCustom;
                dropdown[i][n].layCustom = '';
                //dropdown[i][n].selectItem ( dn[j] );
                _fill_optimized ( dropdown[i][n],dn[j] );
                dropdown[i][n].inspect_btn.setVisible ( true );
                if (layCustom)  {
                  dropdown[i][n].layCustom = layCustom;
                  dropdown[i][n].customGrid.clear();
                  dt[dn[j]].layCustomDropdownInput ( dropdown[i][n] );
                  dropdown[i][n].customGrid.setVisible ( true );
                }
                //console.log ( dropdown[i][n].getContent() );
              } else
                _fill_dropdown ( dropdown[i][n] );

            }

            for (var n=inp_data.length;n<dropdown[i].length;n++)
              _fill_dropdown ( dropdown[i][n] );

          }

        }

    }

    grid.inpDataRef.row = r;  // can be used for setting other widgets in the grid
    grid.dataBox        = dataBox;

    if ((this.state==job_code.new) && (!versionMatch))  {
      // postpone messages in order to put the message on top of the dialog
      if (grid.inputPanel.fullVersionMismatch)  {
        window.setTimeout ( function(){
          new MessageBox ( 'Out-versioned data',
            '<h3>Out-versioned data encountered</h3>' +
            'Some data items, collected for this task, were created with a lower ' +
            'version of ' + appName() + ',<br>where forward compatibility could not be ' +
            'provided for technical reasons. Such items<br>are disabled in comboboxes ' +
            'and cannot be selected. <b>For at least one data type,<br>all available ' +
            'data items are incompatible with the current version of the task. As a<br>' +
            'result, the task cannot be formed and the "<i>Run</i>" button is ' +
            'removed from<br>the toolbar.</b>' +
            '<p>In order to form the task, missing data must be re-generated or ' +
            're-imported by<br>repeating all the relevant tasks. You may find ' +
            'that some old tasks cannot be cloned,<br>too, in which case they ' +
            'should be created anew.' +
            '<p>Apologies for the inconvenience caused, which is due to the ' +
            'routine development and<br>update of ' + appName() + '.'
          );
        },0 );
      } else  {
        window.setTimeout ( function(){
          new MessageBox ( 'Out-versioned data',
            '<h3>Out-versioned data encountered</h3>' +
            'Some data items, collected for this task, were created with a lower ' +
            'version of ' + appName() + ',<br>where forward compatibility could not be ' +
            'provided for technical reasons. <b>Such items<br>are disabled in comboboxes ' +
            'and cannot be selected.</b>' +
            '<p>If outdated data items are required, they must be re-generated or ' +
            're-imported by<br>repeating all the relevant tasks. You may find ' +
            'that some old tasks cannot be cloned,<br>too, in which case they ' +
            'should be formed anew.' +
            '<p>Apologies for the inconvenience caused, which is due to the ' +
            'routine development and<br>update of ' + appName() + '.'
          );
        },0 );
      }
    }

  }


  TaskTemplate.prototype.trimDropdowns = function ( inpParamRef ) {
    // hide trailing "not used" dropdowns

    if ('inpDataRef' in inpParamRef.grid) {

      var input = inpParamRef.grid.inpDataRef.input;

      for (var i=0;i<input.length;i++)  {
        dropdown = input[i].dropdown;
        if (dropdown.length>1)  {
          var n0 = -1;
          for (var n=0;n<dropdown.length;n++)
            if (dropdown[n].getValue()>=0)
              n0 = -1;
            else {
              if (dropdown[n].hasOwnProperty('customGrid'))
                dropdown[n].customGrid.setVisible ( false );
              if (n0<0)
                n0 = n;
            }
          if (n0>=0)  {
            for (var n=0;n<input[i].dropdown.length;n++)
              inpParamRef.grid.setRowVisible ( dropdown[n].row,(n<=n0) );
          }
        }
      }

    }

  }


  TaskTemplate.prototype.collectInputData = function ( inputPanel ) {
  // This function collects input data (that is, secification of input files),
  // from input panel. The data populates this.input_data structure.

    var msg = '';  // The output. If everything's Ok, 'msg' remains empty,
                   // otherwise, it ocntains a concatenation of errors found.

    var inp_data = new DataBox();

    function collectData ( widget ) { // made recursive due to unspecified
                                      // enclosure of widgets in input panel

      if (('inpDataRef' in widget) && ('dataBox' in widget))  {
        var input = widget.inpDataRef.input;

        for (var i=0;i<input.length;i++)  {
          var dt       = input[i].dt;
          var dropdown = input[i].dropdown;
          for (var j=0;j<dropdown.length;j++)  {
            var index = dropdown[j].getValue();
            if (index>=0)  { // this skips non-mandatory items selected as
                             // 'do not use'
              // clone data object, otherwise input from customGrid will be
              // stored in original metadata, which is not good
              //$$$$ does not clone!
              dtj = jQuery.extend ( true,{},dt[index] );
              //dtj = deepClone ( dt[index] );
              if (dropdown[j].hasOwnProperty('customGrid'))  {
                var msg_j = dtj.collectCustomDropdownInput ( dropdown[j] );
                if (msg_j.length>0)  {
                  if (msg.length>0)
                    msg += '<br>';
                  msg += msg_j;
                }
              }
              dtj.visible = dropdown[j].isVisible();
              inp_data.addCustomData ( input[i].inputId,dtj );
            }
          }
        }

      }

      if ('void_data' in widget)
        for (var inputId in widget.void_data)
          for (var j=0;j<widget.void_data[inputId].length;j++)
            inp_data.addCustomData ( inputId,widget.void_data[inputId][j] );

      for (var i=0;i<widget.child.length;i++)
        collectData ( widget.child[i] );

    }

    collectData ( inputPanel );

    this.input_data = inp_data;
    this.input_data.markNotEmpty();

    return msg;

  }


  TaskTemplate.prototype.evaluateCondition = function ( condition,parameters,
                                                        dataState )  {
  //
  //   Returns True or False depending on logical expression given in
  // dictionary 'condition'. The dictionary is made of nested logical
  // expressions, e.g. the following condition:
  //
  //  { _:'&&',  // apply logical 'and' to all items on this level
  //    DATA1 : [v1,v2],  // True if parameter DATA1 has value of 'v1' or 'v2'
  //    CONDITION1 : {    // next level (brackets), any key is allowed
  //      _:'||',   // apply logical 'or' to all items on this level
  //      DATA2 : [v3]  ,   // True if parameter DATA2 has value 'v3'
  //      DATA3 : [v4,v5]
  //    }
  //  }
  //
  //  is equivalent to
  //        ((DATA1==v1) || (DATA1==v2)) &&
  //        ((DATA2==v3) || (DATA3==v4) || (DATA3==v5))
  //
  //  ASSUMPTIONS:
  //   (o) if operation specificator '_' is absent, logical 'and' is assumed.
  //   (o) missing 'DATAX'is equivalent to 'false'
  //   (o) special values '__is_visible__' and '__not_visible__' refer to
  //       the visibility of data widget
  //

    var op = '&&';  // logical 'and'
//    try {
    if ('_' in condition)
      op = condition['_'];
//    } catch(err)  {
//      alert ( 'condition=' + condition );
//    }

    var result = (op=='&&');

    for (var c in condition)
      if (c!='_')  {
        var value = false;
        if (condition[c].constructor===Array)  {
          if (c in parameters)  {
            var v = null;
            if (parameters[c].hasOwnProperty('input'))
              v = parameters[c].input.getValue();
            else if (parameters[c].ref.hasOwnProperty('value'))
              v = parameters[c].ref.value;
            value = (condition[c].indexOf(v)>=0);
            if (!value)  {
              if (condition[c].indexOf('__is_visible__')>=0)
                value = parameters[c].ref.visible;
              else if (condition[c].indexOf('__not_visible__')>=0)
                value = !parameters[c].ref.visible;
            }
          } else if (c in dataState)  {
            value = (condition[c].indexOf(dataState[c])>=0);
          } else {
            value = (condition[c].indexOf(-1)>=0);
          }
        } else  {
          value = this.evaluateCondition ( condition[c],parameters,dataState );
        }
        if (op=='&&')  {
          result = value;
          if (!result)  break;
        } else  {
          result = value;
          if (result)  break;
        }
      }

    return result;

  }

  TaskTemplate.prototype.addCustomDataState = function ( inpDataRef,dataState ) {}

  TaskTemplate.prototype.getDataState = function ( inpDataRef )  {
  var grid      = inpDataRef.grid;
  var dataState = {};

    for (var i=0;i<this.input_dtypes.length;i++)  {
      var inputId = this.input_dtypes[i].inputId;
      var item    = this.getInputItem ( inpDataRef,inputId );
      if (item)  {
        var dropdown = item.dropdown;
        var dt       = item.dt;
        dataState[inputId] = 0;
        for (var j=0;j<dropdown.length;j++)  {
          var index = dropdown[j].getValue();
          if ((!grid.wasRowHidden(dropdown[j].row)) && (index>=0))  {
            dataState[inputId]++;
            var ids = inputId + '.type:' + dt[index]._type;
            if (!dataState.hasOwnProperty(ids))
                  dataState[ids] = 1;
            else  dataState[ids]++;
            var subtype = dt[index].subtype;
            for (var k=0;k<subtype.length;k++)  {
              ids = inputId + '.subtype:' + subtype[k];
              if (!dataState.hasOwnProperty(ids))
                    dataState[ids] = 1;
              else  dataState[ids]++;
            }
          }
        }
      }
    }

    this.addCustomDataState ( inpDataRef,dataState );

    return dataState;

  }

  TaskTemplate.prototype.inputChanged = function ( inpParamRef,emitterId,
                                                   emitterValue )  {
  //var inpDataRef = inpParamRef.grid.inpDataRef;
  var parameters = inpParamRef.parameters;
  //var input      = inpDataRef.input;
  //var dataState  = this.getDataState ( inpDataRef );
  var dataState  = null;

    if ('inpDataRef' in inpParamRef.grid)
          dataState = this.getDataState ( inpParamRef.grid.inpDataRef );
    else  dataState = {};

    for (var key in parameters)  {
      parameters[key].ref.visible = true;
      if (key in inpParamRef.showon)
        parameters[key].ref.visible = this.evaluateCondition (
                               inpParamRef.showon[key],parameters,dataState );
      if (parameters[key].ref.visible && (key in inpParamRef.hideon))
        parameters[key].ref.visible = !this.evaluateCondition (
                               inpParamRef.hideon[key],parameters,dataState );
    }

    for (var key in parameters)  {
      var show = parameters[key].ref.visible;
      if (parameters[key].ref._visible!=show)  {
        for (var elem in parameters[key])
          if ('setVisible' in parameters[key][elem])
            parameters[key][elem].setVisible ( show );
        parameters[key].ref._visible = show;
      }
    }

    this.trimDropdowns ( inpParamRef );

  }


  function _make_label ( inpParamRef,key,item,grid,row,col,rowSpan )  {
  // made as a global function in order to optimise recursive _lay_parameters

    inpParamRef.parameters[key]     = {};
    inpParamRef.parameters[key].ref = item;
    inpParamRef.parameters[key].ref.visible  = true;
    inpParamRef.parameters[key].ref._visible = true;

    if (item.hasOwnProperty('lwidth'))  {
      if (item.lwidth==0)
        return col;
    }

    inpParamRef.parameters[key].label =
                           grid.addLabel ( item.label,row,col,rowSpan,1 )
                               .setNoWrap();
    if (item.hasOwnProperty('tooltip'))
      inpParamRef.parameters[key].label.setTooltip ( item.tooltip );
    if (item.hasOwnProperty('lwidth'))  {
//      if (!item.lwidth.toString().endsWith('%'))  {
      if (!endsWith(item.lwidth.toString(),'%'))  {
        inpParamRef.parameters[key].label.setWidth_px ( item.lwidth );
        grid.setCellSize ( item.lwidth + 'px','',row,col );
      } else  {
        inpParamRef.parameters[key].label.setWidth ( item.lwidth );
        grid.setCellSize ( item.lwidth,'',row,col );
      }
    }
    grid.setVerticalAlignment ( row,col,'middle' );
    if (item.hasOwnProperty('align'))  {
      inpParamRef.parameters[key].label.setHorizontalAlignment ( item.align );
      grid.setHorizontalAlignment ( row,col,item.align );
    }
    if (item.type!='label')  {
      inpParamRef.parameters[key].sep = grid.addLabel ( '',row,col+1,1,1 )
                                            .setWidth_px(1);
      grid.setCellSize ( '1px','',row,col+1 );
    }
    if (item.hasOwnProperty('label2'))  {
      if (item.type!='label')  {
        inpParamRef.parameters[key].sep2 = grid.addLabel ( '',row,col+3,1,1 )
                                               .setWidth_px(4);
        grid.setCellSize ( '4px','',row,col+3 );
      }
      inpParamRef.parameters[key].label2 =
                             grid.addLabel ( item.label2,row,col+4,rowSpan,1 )
                                 .setNoWrap();
      if (item.hasOwnProperty('tooltip2'))
        inpParamRef.parameters[key].label.setTooltip ( item.tooltip2 );
      if (item.hasOwnProperty('lwidth2'))  {
        //if (!item.lwidth2.toString().endsWith('%'))
        //  inpParamRef.parameters[key].label2.setWidth_px ( item.lwidth2 );
        //grid.setCellSize ( item.lwidth2,'',row,col+4 );

//        if (!item.lwidth2.toString().endsWith('%'))  {
        if (!endsWith(item.lwidth2.toString(),'%'))  {
          inpParamRef.parameters[key].label2.setWidth_px ( item.lwidth2 );
          grid.setCellSize ( item.lwidth2 + 'px','',row,col+4 );
        } else  {
          inpParamRef.parameters[key].label2.setWidth ( item.lwidth2 );
          grid.setCellSize ( item.lwidth2,'',row,col+4 );
        }

      }
      grid.setVerticalAlignment ( row,col+4,'middle' );
      if (item.hasOwnProperty('align2'))  {
        inpParamRef.parameters[key].label2.setHorizontalAlignment ( item.align2 );
        grid.setHorizontalAlignment ( row,col,item.align2 );
      }
    }

    return col+2;

  }


  TaskTemplate.prototype._make_show_links = function ( inpParamRef )  {

    var par = inpParamRef.parameters;

    for (var key in par)  {
      var item = par[key].ref;

      // make show/hide references
      if (item.hasOwnProperty('showon'))
        inpParamRef.showon[key] = item.showon;
      if (item.hasOwnProperty('hideon'))
        inpParamRef.hideon[key] = item.hideon;

      var emId = [];
      // set element's initial state
      if (item.hasOwnProperty('showon'))
        for (var emitterId in item.showon)  {
          if (par.hasOwnProperty(emitterId))
                this.inputChanged ( inpParamRef,emitterId,par[emitterId].ref.value );
          else  this.inputChanged ( inpParamRef,emitterId,-1 );  // input data missing or "[do not use]"
          emId.push ( emitterId );
        }
      if (item.hasOwnProperty('hideon'))
        for (var emitterId in item.hideon)
          if (emId.indexOf(emitterId)<0)  {
            if (par.hasOwnProperty(emitterId))
                  this.inputChanged ( inpParamRef,emitterId,par[emitterId].ref.value );
            else  this.inputChanged ( inpParamRef,emitterId,-1 );  // input data missing or "[do not use]"
            emId.push ( emitterId );
          }
    }

  }

  TaskTemplate.prototype._set_item_emitting = function ( inpParamRef,key,item )  {

    if (item.hasOwnProperty('emitting'))  {
      if (item.emitting)
        (function(paramRef,Id,task){
          var input = paramRef.parameters[Id].input;
          input.change_counter = 0;
          input.addOnInputListener ( function(){
            input.change_counter++;
            window.setTimeout ( function(){
              input.change_counter--;
              if (input.change_counter<=0)
                task.inputChanged ( paramRef,Id,input.getValue() );
            },750 );
          });
        }(inpParamRef,key,this));
    }

  }


  TaskTemplate.prototype._lay_parameters = function ( grid,row,col,params,inpParamRef ) {
  // internal recursive function, do not overwrite
  var iwidth,defval,tooltip;

    for (var key in params) {

      if (params.hasOwnProperty(key))  {
        var item = params[key];

        if (item.hasOwnProperty('type'))  {
          var r  = row + item.position[0];
          var c  = col + item.position[1];
          var rs = item.position[2];
          var cs = item.position[3];
          item.visible = true;
          if ('default' in item)           defval  = item.default;
          else if ('placeholder' in item)  defval  = item.placeholder;
                                     else  defval  = '';
          if ('tooltip' in item)  tooltip = item.tooltip;
                            else  tooltip = '';

          switch (item.type)  {

            case 'section'  : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              if (item.title.length>0)  {
                                var sec = grid.setSection ( item.title,item.open,
                                                            r,c,rs,cs );
                                inpParamRef.parameters[key].sec = sec;
                                inpParamRef.parameters[key].ref.visible  = true;
                                inpParamRef.parameters[key].ref._visible = true;
                                sec.grid.setStyle    ( '-compact' );
                                this._lay_parameters ( sec.grid,0,0,item.contains,
                                                       inpParamRef );
                              } else  {
                                var sec = grid.setGrid ( '-compact',r,c,rs,cs );
                                inpParamRef.parameters[key].sec = sec;
                                inpParamRef.parameters[key].ref.visible  = true;
                                inpParamRef.parameters[key].ref._visible = true;
                                this._lay_parameters ( sec,0,0,item.contains,
                                                       inpParamRef );
                              }
                          break;

            case 'label'    : _make_label  ( inpParamRef,key,item,grid,r,c,rs );
                              grid.setSpan ( r,c,rs,cs );
                          break;

            case 'integer'  :
            case 'integer_' : c = _make_label ( inpParamRef,key,item,grid,r,c,rs );
                              if (item.hasOwnProperty('iwidth'))
                                    iwidth = item.iwidth;
                              else  iwidth = 80;
                              inpParamRef.parameters[key].input =
                                 grid.addInputText ( item.value,r,c,rs,cs )
                                     .setStyle ( 'text','integer',defval,tooltip )
                                     .setWidth_px ( iwidth );
                              this._set_item_emitting   ( inpParamRef,key,item );
                              grid.setVerticalAlignment ( r,c,'middle' );
                          break;

            case 'real'     :
            case 'real_'    : c = _make_label ( inpParamRef,key,item,grid,r,c,rs );
                              if (item.hasOwnProperty('iwidth'))
                                    iwidth = item.iwidth;
                              else  iwidth = 80;
                              inpParamRef.parameters[key].input =
                                 grid.addInputText ( item.value,r,c,rs,cs )
                                     .setStyle ( 'text','real',defval,tooltip )
                                     .setWidth_px ( iwidth );
                              this._set_item_emitting   ( inpParamRef,key,item );
                              grid.setVerticalAlignment ( r,c,'middle' );
                          break;

            case 'string'   :
            case 'string_'  : c = _make_label ( inpParamRef,key,item,grid,r,c,rs );
                              if (item.hasOwnProperty('iwidth'))
                                    iwidth = item.iwidth;
                              else  iwidth = 80;
                              inpParamRef.parameters[key].input =
                                 grid.addInputText ( item.value,r,c,rs,cs )
                                     .setStyle ( 'text','',defval,tooltip )
                                     .setWidth_px ( iwidth );
                              if (item.hasOwnProperty('maxlength'))
                                inpParamRef.parameters[key].input
                                           .setMaxInputLength ( item.maxlength );
                              this._set_item_emitting   ( inpParamRef,key,item );
                              grid.setVerticalAlignment ( r,c,'middle' );
                          break;

            case 'combobox' : c = _make_label ( inpParamRef,key,item,grid,r,c,rs );
                              var dropdown = new Dropdown();
                              for (var i=0;i<item.range.length;i++)  {
                                var choice = item.range[i].split('|');
                                if (choice.length<2)
                                  choice = [i.toString(),item.range[i]];
                                dropdown.addItem ( choice[1],'',choice[0],
                                                   choice[0]==item.value );
                              }
                              grid.addWidget   ( dropdown, r,c,rs,cs );
                              if (item.hasOwnProperty('iwidth'))
                                dropdown.setWidth ( item.iwidth );
                              //dropdown.setTooltip ( item.tooltip );
                              dropdown.make();
                              dropdown.setZIndex ( 200-r );  // prevent widget overlap
                              inpParamRef.parameters[key].input = dropdown;
                              // Listen for input event, in case it needs to
                              // control other elements
                              (function(paramRef,Id,task){
                                dropdown.element.addEventListener('state_changed',
                                  function(e){
                                    task.inputChanged ( paramRef,Id,e.detail.item );
                                  },false );
                                window.setTimeout ( function(){
                                  task.inputChanged ( paramRef,Id,item.value );
                                },0);
                              }(inpParamRef,key,this));
                          break;

            case 'checkbox' : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              inpParamRef.parameters[key].ref.visible  = true;
                              inpParamRef.parameters[key].ref._visible = true;
                              var checkbox = grid.addCheckbox ( item.label,
                                                         item.value,r,c,rs,cs );
                              checkbox.setTooltip ( item.tooltip );
                              if (item.hasOwnProperty('iwidth'))  {
//                                if (item.iwidth.toString().endsWith('%'))
                                if (endsWith(item.iwidth.toString(),'%'))
                                      checkbox.setWidth    ( item.iwidth );
                                else  checkbox.setWidth_px ( item.iwidth );
                              } else  checkbox.setWidth    ( '100%' );
                              inpParamRef.parameters[key].input = checkbox;
                              (function(paramRef,Id,cbx,task){
                                $(cbx.checkbox).on('click', function(){
                                  task.inputChanged ( paramRef,Id,cbx.getValue() );
                                });
                              }(inpParamRef,key,checkbox,this));
                          break;

            case 'textarea_':
            case 'textarea' : inpParamRef.parameters[key]     = {};
                              inpParamRef.parameters[key].ref = item;
                              inpParamRef.parameters[key].ref.visible  = true;
                              inpParamRef.parameters[key].ref._visible = true;
                              var placeholder = '';
                              var nrows       = 5;
                              var ncols       = 80;
                              if (item.hasOwnProperty('placeholder'))
                                placeholder = item.placeholder;
                              if (item.hasOwnProperty('nrows'))
                                nrows = item.nrows;
                              if (item.hasOwnProperty('ncols'))
                                ncols = item.ncols;
                              var textarea = grid.setTextArea ( item.value,
                                        placeholder, nrows,ncols, r,c, rs,cs );
                              textarea.setTooltip ( item.tooltip );
                              $(textarea.element).css ( {'resize':'none'} );
                              if (item.hasOwnProperty('iwidth'))  {
//                                if (item.iwidth.toString().endsWith('%'))
                                if (endsWith(item.iwidth.toString(),'%'))
                                      textarea.setWidth    ( item.iwidth );
                                else  textarea.setWidth_px ( item.iwidth );
                              } else  textarea.setWidth    ( '100%' );
                              inpParamRef.parameters[key].input = textarea;
                              (function(paramRef,Id,txa,task){
                                txa.addOnInputListener(function() {
                                  task.inputChanged ( paramRef,Id,txa.getValue() );
                                });
                              }(inpParamRef,key,textarea,this));
                          break;

            default : break;

          }

        }

      }

    }

  }


  TaskTemplate.prototype.countInputData = function ( inpDataRef,inputId,subtype ) {
  // counts the current number of datasets belonging to given 'inputId' and
  // 'subtype'. Empty subtype ('') will return the total number for all
  // subtypes.
  var n = 0;
  var item = this.getInputItem ( inpDataRef,inputId );
  var grid = inpDataRef.grid;

    if (item)  {
      var dropdown = item.dropdown;
      if (!subtype)  {
        for (var j=0;j<dropdown.length;j++)
          if ((!grid.wasRowHidden(dropdown[j].row)) && (dropdown[j].getValue()>=0))
            n++;
      } else  {
        var dt = item.dt;
        for (var j=0;j<dropdown.length;j++)  {
          var index = dropdown[j].getValue();
          if ((!grid.wasRowHidden(dropdown[j].row)) && (index>=0) &&
              (dt[index].subtypes.indexOf(subtype)>=0))
            n++;
        }
      }
    }

    return n;

  }

/*
    TaskTemplate.prototype.countInputData = function ( inpDataRef,inputId ) {
    // counts the current number of datasets belonging to given 'inputId'.
    var n = 0;
    var input = inpDataRef.input;
    var grid  = inpDataRef.grid;

      for (var i=0;i<input.length;i++)
        if (input[i].inputId==inputId)  {
          var dropdown = input[i].dropdown;
          for (var j=0;j<dropdown.length;j++)
            if ((!grid.wasRowHidden(dropdown[j].row)) && (dropdown[j].getValue()>=0))
              n++;
          break;
        }

      return n;

    }
*/

  TaskTemplate.prototype.getInputItem = function ( inpDataRef,inputId ) {
  // returns input item corresponding to given 'inputId'.
  var item  = null;
  var input = inpDataRef.input;
    for (var i=0;(i<input.length) && (!item);i++)
      if (input[i].inputId==inputId)
        item = input[i];
    return item;
  }



  TaskTemplate.prototype.getInputData = function ( inpDataRef,inputId ) {
  // returns input item corresponding to given 'inputId'.
  var item = this.getInputItem ( inpDataRef,inputId );
  var data = [];

    if (item)  {
      var dt       = item.dt;
      var dropdown = item.dropdown;
      for (var i=0;i<dropdown.length;i++)  {
        var index = dropdown[i].getValue();
        if (index>=0)  { // this skips non-mandatory items selected as
                         // 'do not use'
          // clone data object, otherwise input from customGrid will be
          // stored in original metadata, which is not good
          dti = jQuery.extend ( true,{},dt[index] );
          if (dropdown[i].hasOwnProperty('customGrid'))
            dti.collectCustomDropdownInput ( dropdown[i] );
          dti.visible = dropdown[i].isVisible();
          data.push ( dti );
        }
      }
    }

    return data;

  }


  TaskTemplate.prototype.getInputItemNo = function ( inpDataRef,inputId ) {
  // returns input item corresponding to given 'inputId'.
  var itemNo = -1;
  var input  = inpDataRef.input;
    for (var i=0;(i<input.length) && (itemNo<0);i++)
      if (input[i].inputId==inputId)
        itemNo = i;
    return itemNo;
  }


  TaskTemplate.prototype._make_data_signals = function ( grid ) {
  // makes input data fields to broadcast on-change signals

    if (grid.hasOwnProperty('inpParamRef') && grid.hasOwnProperty('inpDataRef')) {

      // set listeners on all input data fields and connect them to
      // the general visibility controller (function _input_changed())
      var input = grid.inpDataRef.input;
      for (var i=0;i<input.length;i++)  {
        var dropdown = input[i].dropdown;
        for (var j=0;j<dropdown.length;j++)
          (function(dropdownRef,paramRef,Id,task){
            dropdown[j].element.addEventListener('state_changed',
              function(e){
                var n=0;  // signal value is the number of non-void selections
                for (var k=0;k<dropdownRef.length;k++)
                  if ((!grid.wasRowHidden(dropdownRef[k].row)) &&
                      (dropdownRef[k].getValue()>=0))
                    n++;
                task.inputChanged ( paramRef,Id,n );
              },false );
          }(dropdown,grid.inpParamRef,input[i].inputId,this));
        // simulate dropdown click in order to set initial state of dependent
        // parameters
        dropdown[0].click();
      }

    }

  }


  TaskTemplate.prototype.layParameters = function ( grid,row,col )  {
  // Lays task parameters, described in 'this.parameters' json, on the grid
  // given, starting from given row and offset by given column. Along with
  // laying parameters, it also created 'grid.inpParamRef' structure with
  // references to input widgets, used later for collecting values of the
  // corresponding parameters.

    grid.inpParamRef = { row        : row,
                         grid       : grid,
                         parameters : {},
                         showon     : {},
                         hideon     : {}
                       };

    this._lay_parameters ( grid,row,col,this.parameters,grid.inpParamRef );
    (function(task,grd){
      window.setTimeout ( function(){
        task._make_show_links   ( grd.inpParamRef );
        task._make_data_signals ( grd );
        // now show all widgets at once
        window.setTimeout ( function(){
          grd.setVisible ( true );
        },10 );
      },0 );
    }(this,grid))

  }


  TaskTemplate.prototype.collectParameterValues = function ( widget ) {

    var msg = '';  // The output. If everything's Ok, 'msg' remains empty,
                   // otherwise, it ocntains a concatenation of errors found.

    function addMessage ( item,key,message )  {
      if (item.visible)  {
        if (msg.length>0)
          msg += '<br>';
        var id = key;
        if ('reportas' in item)     id = item.reportas;
        else if ('label' in item)   id = item.label;
        else if ('keyword' in item) id = item.keyword;
        msg += '<b>' + id + ':</b> ' + message;
      }
    }

    function checkRange ( value,item,key )  {
      if ('range' in item)  {
        if (item.range[0]=='*')  {
          if (value>item.range[1])
            addMessage ( item,key,
                'value should be less or equal to ' + item.range[1] );
          else
            item.value = value;
        } else if (item.range[1]=='*')  {
          if (value<item.range[0])
            addMessage ( item,key,
                'value should be greater or equal to ' + item.range[0] );
          else
            item.value = value;
        } else if ((value<item.range[0]) || (value>item.range[1]))
          addMessage ( item,key,
              'value should be between ' + item.range[0] +
              ' and ' + item.range[1] );
        else
          item.value = value;
      } else
        item.value = value;
    }

    function collectValues ( widget ) {
    // this function is made recursive, because no anticipations on widget
    // enclosures in job's input panel is made.

      if ('inpParamRef' in widget)  {

        for (var key in widget.inpParamRef.parameters)  {

          param = widget.inpParamRef.parameters[key];
          item  = param.ref;

          switch (item.type)  {

            case 'integer_' :
            case 'integer'  : var text = param.input.getValue().trim();
                              if (text.length<=0)  {
                                if (item.type=='integer_')  {
                                  if (isNaN(item.default))
                                        item.value = '';
                                  else  item.value = item.default;
                                } else
                                  addMessage ( item,key,'no value given' );
                              } else if (isInteger(text))  {
                                var value = parseInt ( text );
                                checkRange ( value,item,key );
                              } else
                                addMessage ( item,key,'wrong integer format' );
                          break;

            case 'real_'    :
            case 'real'     : var text = param.input.getValue().trim();
                              if (text.length<=0)  {
                                if (item.type=='real_')  {
                                  if (isNaN(item.default))
                                        item.value = '';
                                  else  item.value = item.default;
                                } else
                                  addMessage ( item,key,'no value given' );
                              } else if (isFloat(text))  {
                                var value = parseFloat ( text );
                                checkRange ( value,item,key );
                              } else
                                addMessage ( item,key,'wrong real format' );
                          break;

            case 'string_'  :
            case 'string'   : var text = param.input.getValue().trim();
                              if (text.length<=0)  {
                                if (item.type=='string_')  {
                                  if ('default' in item)
                                        item.value = item.default;
                                  else  item.value = '';
                                } else
                                  addMessage ( item,key,'no value given' );
                              } else
                                item.value = text;
                          break;

            case 'checkbox' :
            case 'combobox' : item.value = param.input.getValue();
                          break;

            case 'textarea_':
            case 'textarea' : var text = param.input.getValue();
                              if (text.length<=0)  {
                                if (item.type=='textarea_')  {
                                  if ('default' in item)
                                        item.value = item.default;
                                  else  item.value = '';
                                } else
                                  addMessage ( item,key,'no value given' );
                              } else
                                item.value = text;
                          break;

            default : ;

          }

        }

      }

      for (var i=0;i<widget.child.length;i++)
        collectValues ( widget.child[i] );

    }

    collectValues ( widget );

    return msg;

  }


  TaskTemplate.prototype.disableInputWidgets = function ( inputPanel,disable_bool )  {
  // This function corrects action of global widget.setDisabledAll(), which
  // should be called prior using this function.

    /*
    // do recursive search for widgets to disable
    widget.setDisabled ( disable_bool );
    for (var i=0;i<widget.child.length;i++)
      this.disableInputWidgets ( widget.child[i],disable_bool );
    */

    window.setTimeout ( function(){
      if ('grid' in inputPanel)  {
        if ('inpDataRef' in inputPanel.grid)  {
          var input = inputPanel.grid.inpDataRef.input;
          for (var i=0;i<input.length;i++)
            for (var j=0;j<input[i].dropdown.length;j++)  {
              if (disable_bool)
                input[i].dropdown[j].inspect_btn.setEnabled ( true );
            }
        }
      }
    },0);

    if (inputPanel.hasOwnProperty('header') && (this.state!=job_code.running) &&
                                               (this.state!=job_code.exiting)) {
      if (inputPanel.header.hasOwnProperty('uname_inp'))
        window.setTimeout ( function(){
          inputPanel.header.uname_inp.setEnabled ( true );
        },0);
    }

  }


  //  This function is called just before the task is finally sent to FE to run.
  // It should execute function given as argument, or issue an error message if
  // run should not be done.
  TaskTemplate.prototype.doRun = function ( inputPanel,run_func )  {
    run_func();
  }


  // This function is called at cloning jobs and should do copying of all
  // custom class fields not found in the Template class
  TaskTemplate.prototype.customDataClone = function ( task )  {
    return;
  }

  TaskTemplate.prototype.score_string = function() {
  var S = '';
    if ('scores' in this)  {
      S = '';
      for (var key in this.scores)  {
        d = this.scores[key];
        switch (key)  {
          case 'aimless' : S += 'Compl='                 + d.Completeness + '%' +
                                ' CC<sub>1/2</sub>='     + d.Half_set_CC  +
                                ' R<sub>meas_all</sub>=' + d.R_meas_all   +
                                ' R<sub>meas_ano</sub>=' + d.R_meas_ano   +
                                ' SpG=' + d.Space_group  + ' ';
                      break;
          case 'phaser'   : S += 'N<sub>sol</sub>=' + d.count +
                                 ' LLG=' + d.llg + ' TFZ=' + d.tfz + ' ';
                      break;
          case 'cbuccaneer' : S += 'Compl=' + d.percentage + '% ';
                      break;
          case 'refmac'   : S += 'R=' + d.R_factor + ' R<sub>free</sub>=' +
                                        d.R_free   + ' ';
                      break;
          case 'z01'      : S += '<u>SpG=' + d.SpaceGroup  + '</u> ';
                      break;
          case 'z02'      : S += 'Solv=' + d.SolventPercent + '% ';
                      break;
          case 'shelxemr' : S += 'CC=' + d.bestCC + '% FOM=' + d.meanFOM;
                      break;
          default : ;
        }
      }
      if (S!='')
        S = '-- <font style="font-size:80%">' + S + '</font>';
    }
    return S;
  }


} else  {
  //  for server side

  var fs    = require('fs-extra');
  var path  = require('path');

  var utils = require('../../js-server/server.utils');
  var prj   = require('../../js-server/server.fe.projects');
  var conf  = require('../../js-server/server.configuration');

  TaskTemplate.prototype.getNCores = function ( ncores_available )  {
  // This function should return the number of cores, up to ncores_available,
  // that should be reported to a queuing system like SGE or SLURM, in
  // case the task spawns threds or processes bypassing the queuing system.
  // It is expected that the task will not utilise more cores than what is
  // given on input to this function.
    return 1;
  }

  TaskTemplate.prototype.getCommandLine = function ( jobManager,jobDir )  {
    // just the template, no real execution body is assumed
    return [conf.pythonName(), '-m', 'pycofe.tasks.template', jobManager, jobDir];
  }


  TaskTemplate.prototype.addInputFile = function ( jobId,fileName,jobDir )  {
  // Adds (custom) file 'fileName' from 'outputDir()' of job with id 'jobId',
  // into 'inputDir()' directory of job directory 'jobDir'
    var srcJobDir = prj.getSiblingJobDirPath ( jobDir,jobId );
    var src_file  = prj.getOutputFilePath ( srcJobDir,fileName );
    var dest_file = prj.getInputFilePath  ( jobDir   ,fileName );
    try {
      fs.copySync ( src_file,dest_file );
    } catch (err) {
      console.log ( ' *** cannot copy file ' + src_file + ' to ' + dest_file );
      console.log ( '     error: ' + err) ;
    }
  }


  TaskTemplate.prototype.makeInputData = function ( login,jobDir )  {
  // Collects all input files, listed in this.input_data, from other job
  // directories and places them in jobDir/input. Simultaneously, creates
  // the correspondong dataBox structure with input metadata, and writes
  // it in jobDir/input/databox.meta. This is done on FE just before
  // sending the jobboll to NC. On NC, the dataBox is read in python
  // wrappers, an the metadata from it is used to specify input data (files)
  // for the actual job.
    for (var dtype in this.input_data.data)  {
      var td = this.input_data.data[dtype];
      for (var i=0;i<td.length;i++)
        if (td[i])  {
          var srcJobDir = prj.getSiblingJobDirPath ( jobDir,td[i].jobId );
          for (var fileKey in td[i].files) {
            if (td[i].files.hasOwnProperty(fileKey)) {
              var fname = td[i].files[fileKey];
              if (fname)  {
                var pack = true;
                var doNotPackSuffixes = this.doNotPackSuffixes();
                for (var k=0;(k<doNotPackSuffixes.length) && pack;k++)
                  pack = (!fname.endsWith(doNotPackSuffixes[k]));
                var doPackSuffixes = this.doPackSuffixes();
                for (var k=0;(k<doPackSuffixes.length) && (!pack);k++)
                  pack = fname.endsWith(doPackSuffixes[k]);
                if (pack)  {
                  var src_file  = prj.getOutputFilePath ( srcJobDir,fname );
                  var dest_file = prj.getInputFilePath  ( jobDir   ,fname );
                  try {
                    fs.copySync ( src_file,dest_file );
                  } catch (err) {
                    console.log ( ' *** cannot copy file ' + src_file +
                                '\n                   to ' + dest_file +
                                '\n           for object ' + td[i]._type + ' : ' + td[i].dname );
                    console.log ( '     error: ' + err) ;
                  }
                }
              }
            }
          }
        } else {
          console.log ( ' *** empty data object in TaskTemplate.makeInputData ,dtype=' + dtype );
        }
    }
    var dboxPath = path.join ( jobDir,'input','databox.meta' );
    utils.writeObject ( dboxPath,this.input_data );
  }


  TaskTemplate.prototype.makeOutputData = function ( jobDir )  {
  // This function is run after job completion with the purpose of
  // analysing job's output files and registering them with the system.
  // This function may be overwritten in individual tasks, although
  // doing so should be viewed as an exception practice.
  //
  // By default, assume that job process has created the 'datalist.meta'
  // file in 'output' directory, then simply read it. This file may be
  // easily created in python layer, using python definitions of data
  // classes in python/dtypes and then adding them to datalist class
  // implemented in python/dtypes/datalist.py

    var dboxPath = path.join ( jobDir,'output','databox.meta' );
    var dbox     = utils.readClass ( dboxPath );
    if (dbox)  this.output_data = dbox;
         else  this.output_data = new dbx.DataBox();

  }


  // default post-job cleanup to save disk space
  TaskTemplate.prototype.cleanJobDir = function ( jobDir )  {
    // leave input metadata just in case
    var inputDir = path.join ( jobDir  ,'input'        );
    var dboxPath = path.join ( inputDir,'databox.meta' );
    var dbox     = utils.readString ( dboxPath );
    utils.removePath   ( inputDir );
    utils.mkDir_anchor ( inputDir );
    utils.writeString  ( dboxPath,dbox );
    utils.removeFiles  ( jobDir,['.mtz','.map','.pdb','.seq','.fasta','.pir',
                                 '.seq.txt','.fasta.txt','.pir.txt',
                                 '.cif','.mmcif','.ent','.pdbx'] );
  }


  // -------------------------------------------------------------------------

  module.exports.job_code          = job_code;
  module.exports.jobDataFName      = jobDataFName;
  module.exports.jobReportDirName  = jobReportDirName;
  module.exports.jobInputDirName   = jobInputDirName;
  module.exports.jobOutputDirName  = jobOutputDirName;
  module.exports.jobReportHTMLName = jobReportHTMLName;
  module.exports.jobReportTaskName = jobReportTaskName;
  module.exports.TaskTemplate      = TaskTemplate;

}
