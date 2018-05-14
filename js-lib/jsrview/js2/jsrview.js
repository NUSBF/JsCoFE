//
//  ===========================================================================
//
//    21.04.18   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  ---------------------------------------------------------------------------
//
//  **** Module  :  jsrview.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's head module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2018
//
//  ===========================================================================
//
//
//  Report structure:
//
//  RVAPIReportBase
//    RVAPIReportGrid
//      RVAPIReportGraph
//        RVAPIReportWidgets

$(function() {
  $( document ).tooltip();
});


//  ===========================================================================
//  REPORT ENGINE
//  ===========================================================================

function RVAPIReport ( sceneId )  {

  RVAPIReportBase.call ( this,sceneId );

  this.__stop_poll   = false;
  this.__timestamp1  = "";
  this.__timestamp2  = "";

  this.timeQuant     = 1000;        // timer interval, milliseconds
  this._commandNo    = 0;           // command number
  this.taskFile      = "task.tsk";  // task file name

  this._taskData            = "{*}";
  this._taskTimer           = 0;
  this._taskTimerInterval   = 500; // msec
  this._formSubmittedID     = "";
  this._waitDialogTitle     = "";
  this._waitDialogMessage   = "";
  this._waitDialogId        = sceneId + "_wait_dialog";
  this._waitDialogCountdown = -1;

}

RVAPIReport.prototype = Object.create ( RVAPIReportBase.prototype );
RVAPIReport.prototype.constructor = RVAPIReport;


RVAPIReport.prototype.processCommands = function ( commands,command_no )  {
var last_cmd_no,i,j;
var statement = commands.replace(/\\/g,"\\\\")
                        .replace(/\r\n|\n\r|\n|\r/g,"\n")
                        .split(";;;\n");
var cmd_no    = command_no;

  if (statement.length<=0)
    return 0;

  if (this.__timestamp1!="")  {
    var p0 = statement[0].split(":::");
    if ((p0[0]=="TASK_STAMP") &&
        (p0.length==4)        &&  // to be removed later
        ((p0[1]!=this.__timestamp1) || (p0[2]!=this.__timestamp2)) &&
        (p0[3]=="RELOAD"))  {
      this.__timestamp1 = "";
      this.__timestamp2 = "";
      last_cmd_no       = 0;
      this._commandNo   = 0;   // global variable
      this._taskData    = "";

      /* commenting out the following 2 lines eliminates blinking
         at limiting the task file size, but  may have adverse
         effect on jsPISA -- check it */
      //refreshPage();
      //return last_cmd_no;

      cmd_no = 0;
    }
    if (p0[3]=="RESET")  {
      /* commenting out the following line eliminates blinking
         at limiting the task file size */
      //document.body.innerHTML = "";
      cmd_no = 0;
    }
  }

  if (cmd_no>statement.length)
    cmd_no = 0;

  // This assures that no extra widget manipulations are performed
  // between flushes or at page refreshes

  for (i=statement.length-1;i>=cmd_no;i--)  {
    for (j=i-1;j>=cmd_no;j--)
      if (statement[j]==statement[i])
        statement[j] = "DUMMY:::";
  }

  last_cmd_no = cmd_no - 1;

  while (cmd_no<statement.length)  {

    var p = statement[cmd_no].split(":::");

    if ((p.length>0) && (p[0]!="DUMMY"))  {

      for (var i=0;i<p.length;i++)
        p[i] = $.trim(p[i]);

      var last_cmd_no_save = last_cmd_no;
      last_cmd_no = cmd_no;

      switch (p[0])  {

        case 'ADD_TAB' : // ADD_TAB id name open
                this.addTab ( this.mainTabBarId,p[1],p[2],p[3]=="true",false );
              break;

        case 'INSERT_TAB' :  // INSERT_TAB before_id id name open
                this.insertTab ( this.mainTabBarId,p[1],p[2],p[3],p[4]=="true",false );
              break;

        case 'REMOVE_TAB' : // REMOVE_TAB id
                this.removeTab ( this.mainTabBarId,p[1] );
              break;

        case 'ADD_SECTION' : // ADD_SECTION id title holderId row col rowSpan colSpan open
                this.addSection ( p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8]=="true" );
              break;

        case 'SET_SECTION_STATE' : // SET_SECTION_STATE id open
                this.setSectionState ( p[1],p[2]=="true" );
              break;

        case 'OPEN_TAB' : // OPEN_TAB id
                $( '#'+this.mainTabBarId ).tabs ( 'option', 'active',
                                          getTabNo ( this.mainTabBarId,p[1]) );
              break;

        case 'SET_HEADER' : // SET_HEADER html-string
                this.setPageHeader ( p[1] );
              break;

        case 'ADD_GRID' : // ADD_GRID holderId
                this.addGrid ( p[1] );
              break;

        case 'ADD_GRID_COMPACT' : // ADD_GRID_COMPACT holderId
                this.addGridCompact ( p[1] );
              break;

        case 'NEST_GRID' : // NEST_GRID gridId holderId row col rowSpan colSpan
                this.nestGrid ( p[1],p[2],p[3],p[4],p[5],p[6] );
              break;

        case 'NEST_GRID_COMPACT' : // NEST_GRID_COMPACT gridId holderId row col rowSpan colSpan
                this.nestGridCompact ( p[1],p[2],p[3],p[4],p[5],p[6] );
              break;

        case 'SET_TEXT_GRID' : // ADD_TEXT textString holderId row col rowSpan colSpan
                this.setGridItem ( p[2],document.createTextNode(p[1]),
                                   p[3],p[4],p[5],p[6] );
              break;

        case 'SET_HTML_GRID' : // SET_HTML_GRID htmlString holderId row col rowSpan colSpan
                this.setHtmlGrid ( p[2],p[1],p[3],p[4],p[5],p[6] );
              break;

        case 'SET_IFRAME_GRID' : // SET_IFRAME_GRID uri width height holderId row col rowSpan colSpan
                //setGridItem ( p[2],document.createTextNode(p[1]),
                //              p[3],p[4],p[5],p[6] );
              break;

        case 'ADD_HTML_GRID' : // SET_HTML_GRID htmlString holderId row col rowSpan colSpan
                this.addHtmlGrid ( p[2],p[1],p[3],p[4],p[5],p[6] );
              break;

        case 'SET_HTML' : // SET_HTML id htmlString
                this.setHtml ( p[1],p[2] );
              break;

        case 'SET_HTML_TABLESORT' : // SET_HTML_TABLESORT id htmlString
                this.setHtml ( p[1],p[2] );
              break;

        case 'ADD_HTML' : // ADD_HTML id htmlString
                this.addHtml ( p[1],p[2] );
              break;

        case 'ADD_PANEL' : // ADD_PANEL panelId holderId row col rowSpan colSpan
                this.addPanel ( p[1],p[2],p[3],p[4],p[5],p[6] );
              break;

        case 'ADD_FIELDSET' : // ADD_FIELDSET fsetId title holderId row col rowSpan colSpan
                this.addFieldset ( p[1],p[2],p[3],p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_FORM' :
                // ADD_FORM formId action method holderId row col rowSpan colSpan
                this.addForm ( p[1],p[2],p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_FILE_UPLOAD' :
                // ADD_FILE_UPLOAD inpId name value length required onChange formId row col rowSpan colSpan
                this.addFileUpload ( p[1],p[2],p[3],p[4], p[5]=='true',p[6],
                                     p[7], p[8],p[9],p[10],p[11] );
              break;

        case 'ADD_SUBMIT_BUTTON' :
                // ADD_SUBMIT_BUTTON inpId title formAction formId row col rowSpan colSpan
                this.addSubmitButton ( p[1],p[2],p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_LINE_EDIT' :
                // ADD_LINE_EDIT inpId name value size formId row col rowSpan colSpan
                this.addLineEdit ( p[1],p[2],p[3],p[4], p[5], p[6],p[7],p[8],p[9] );
              break;

        case 'ADD_HIDDEN_TEXT' :
                // ADD_HIDDEN_TEXT inpId name value formId row col rowSpan colSpan
                this.addHiddenText ( p[1],p[2],p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'SET_CELL_STRETCH' : // SET_CELL_STRETCH gridId width height row col
                this.setCellStretch ( p[1], p[2],p[3], p[4],p[5] );
              break;

        case 'LOAD_CONTENT_GRID' :
                // LOAD_CONTENT_GRID uri watch subtaskUri holderId row col rowSpan colSpan
                this.loadGridContent ( p[1],p[2]=='true',p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'LOAD_CONTENT' : // LOAD_CONTENT holderId uri watch subtaskUri
                this.loadContent ( p[1],p[2], p[3]=='true',p[4] );
              break;

        case 'LOAD_CONTENT_TABLESORT' :
                // LOAD_CONTENT_TABLESORT uri paging tableId holderId
                this.loadContentTablesort ( p[1],p[2]=='true',p[3],p[4] );
              break;

        case 'ADD_DROPDOWN' :
                // ADD_DROPDOWN id title holderId row col rowSpan colSpan foldState
                this.addDropDown ( p[1],p[2],p[3], p[4],p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_BUTTON_GRID' :
                // ADD_BUTTON_GRID id title command data rvOnly holderId row col rowSpan colSpan
                this.addButtonGrid ( p[1],p[2],p[3],p[4], p[5]=='true',
                                     p[6],p[7],p[8],p[9],p[10] );
              break;

        case 'ADD_CHECKBOX_GRID' :
                // ADD_CHECKBOX_GRID id title name value command data checked onChange holderId row col rowSpan colSpan
                this.addCheckboxGrid ( p[1],p[2],p[3],p[4],p[5],p[6], p[7]=='true',
                                       p[8], p[9], p[10],p[11],p[12],p[13] );
              break;

        case 'ADD_COMBOBOX_GRID' :
                // ADD_COMBOBOX_GRID id name options onChange size holderId row col rowSpan colSpan
                this.addComboboxGrid ( p[1],p[2],p[3],p[4],p[5],
                                       p[6], p[7],p[8],p[9],p[10] );
              break;

        case 'ADD_BUTTON' :
                // ADD_BUTTON id title command data rvOnly holderId
                this.addButton ( p[1],p[2],p[3],p[4], p[5]=='true', p[6] );
              break;

        case 'ADD_RADIO_BUTTON' :
                // ADD_RADIO_BUTTON id title name value checked onChange holderId row col rowSpan colSpan
                this.addRadioButtonGrid ( p[1],p[2],p[3],p[4], p[5]=='true', p[6],
                                          p[7], p[8],p[9],p[10],p[11] );
              break;

        case 'ADD_TEXTBOX_GRID' :
                // ADD_TEXTBOX_GRID id text holderId row col rowSpan colSpan
                this.addTextBoxGrid ( p[1],p[2],p[3], p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_LOG_GRAPH' :
                // ADD_LOG_GRAPH id holderId treeData row col rowSpan colSpan
                this.addLogGraph ( p[1],p[2], p[3], p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_GRAPH' :
                // ADD_GRAPH id holderId graphData row col rowSpan colSpan
                this.addGraph ( p[1],p[2], p[3], p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_RADAR' :
                // ADD_RADAR data options holderId row col rowSpan colSpan
                this.addRadarWidget ( p[1],p[2], p[3] );
              break;

        case 'ADD_TREE_WIDGET' :
                // ADD_TREE_WIDGET id title holderId treeData row col rowSpan colSpan
                this.addTreeWidget ( p[1],p[2], p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_PROGRESS_BAR' :
                // ADD_PROGRESS_BAR id range width holderId row col rowSpan colSpan
                this.addProgressBar ( p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8] );
              break;

        case 'SET_PROGRESS_BAR' : // SET_PROGRESS_BAR id key value
                if (p[2]=='HIDE')  {
                  if (p[1]==progressBarId)  this.showToolBarProgress ( false );
                                      else  this.showProgressBar ( p[1],false );
                } else if (p[2]=='SHOW')  {
                  if (p[1]==progressBarId)  this.showToolBarProgress ( true );
                                      else  this.showProgressBar ( p[1],true );
                } else if (p[2]=='RANGE')
                  this.setProgressBarRange ( p[1],p[3] );
                else if (p[2]=='VALUE')
                  this.setProgressBarValue ( p[1],p[3] );
              break;

        case 'DISABLE_ELEMENT' : // DISABLE_ELEMENT id disable
                this.disableElement ( p[1],p[2] == 'true' );
              break;

        case 'DISABLE_FORM' : // DISABLE_FORM id disable
                this.disableForm ( p[1],p[2] == 'true' );
              break;

        case 'REMOVE_WIDGET' : // REMOVE_WIDGET id
                this.removeElement ( p[1] );
              break;

        case 'SET_TIME_QUANT' : // SET_TIME_QUANT milliseconds
                this.timeQuant = p[1];
              break;

        case 'TASK_STAMP' : // TASK_STAMP time clock
                // used only for making task files uniquely stamped
                this.__timestamp1 = p[1];
                this.__timestamp2 = p[2];
              break;

        case 'STOP_POLL' : // STOP_POLL
                // stops checking for new tasks if this is last command
                // in the file
                this.__stop_poll = (cmd_no>=statement.length-2);
              break;

        default : ;  last_cmd_no = last_cmd_no_save;

      }

    }

    cmd_no++;

  }

  return last_cmd_no;

}


RVAPIReport.prototype.readTask = function()  {

  (function(report){
    if (report._taskTimer==0)  {
      report.processFile ( report.taskFile,"post",true,
        function(data)  { // on success
          report._taskData  = new String(data);
          report._commandNo = processCommands ( data,report._commandNo ) + 1;
        },
        function()  {  // always
          updateWatchedContent ( report.__stop_poll );
          if (!report.__stop_poll)
            setTimeout ( report.readTask,report.timeQuant );
  //        report.__stop_poll = false;
        },
        function() {
        }  // on fail
      );
    }
  }(this))

}


RVAPIReport.prototype.readTaskTimed = function()  {

  if ((this._waitDialogMessage.length>1) && (this._waitDialogCountdown>=0))  {
    this._waitDialogCountdown = this._waitDialogCountdown - this._taskTimerInterval;
    if (this._waitDialogCountdown<=0)  {
      var dialog = this.element ( "div","id",this._waitDialogId,"" );
      dialog.setAttribute ( "title",this._waitDialogTitle );
      dialog.innerHTML = this._waitDialogMessage;
      _document_body.appendChild ( dialog );
      $( "#"+this._waitDialogId).dialog({
        dialogClass: "no-close"
      });
      this._waitDialogCountdown = -1;
    }
  }

  (function(report){

    report.processFile ( report.taskFile,"post",true,

      function(data)  {  // on success
        if (data.length>0)  {

          var change = 1;
          if (data.length == report._taskData.length)  {
            if (data == report._taskData)  change = 0;
          }

          if (change!=0)  {

            clearInterval ( report._taskTimer );

            if (report._formSubmittedID.length>1)  {
              disableForm ( report._formSubmittedID,false );
              report._formSubmittedID = "";
            }

            var dialog = document.getElementById ( report._waitDialogId );
            if (dialog)  {
              $( "#"+report._waitDialogId).dialog("destroy");
              _document_body.removeChild ( dialog );
            }

            report._waitDialogMessage   = "";
            report._waitDialogCountdown = -1;
            report._taskData  = new String(data);
  //        report._commandNo  = 0;
            report._commandNo  = report.processCommands ( data,report._commandNo ) + 1;

          }
        }
      },

      function()  { // always
        updateWatchedContent ( report.__stop_poll );
        report._taskTimer = 0;
        if (!report.__stop_poll)
          setTimeout ( report.readTask,report.timeQuant );
  //      report.__stop_poll = false;
      },

      function() {}  // on fail

    );

  }(this))

}


RVAPIReport.prototype.startTaskTimed = function()  {
  if (this._taskTimer!=0)
    clearInterval ( this._taskTimer );
  this._taskTimer = setInterval ( this.readTaskTimed,this._taskTimerInterval );
}


RVAPIReport.prototype.updateWatchedContent = function ( updateHidden_bool )  {

  for (var i=0;i<this.watchedContent.length;i++)  {
    (function(report,hId,uri) {
      if (updateHidden_bool || $('#'+hId).is(':visible'))
        report.processFile ( uri,"post",true,function(data){

          var n = 0;
          if (data.lastIndexOf('[[[[]]]]',0) === 0)  {  // for old JS engines (jsrview)
//          if (data.startsWith('[[[[]]]]'))  {  // for modern JS engines
            // Capped file (e.g. a long log file); put a message and a
            // download button on the top of the page
            var divId = hId + '-div';
            var div   = document.getElementById ( divId );
            if (!div)  {
              div = report.element ( 'div','id',divId,'' );
              var holder = document.getElementById ( hId );
              if (holder)
                holder.appendChild ( div );
              $( '<div class="cap-div"><b><i>File is too large and shown ' +
                 'without middle part.</i></b><br>Click <a href="' +
                 uri.substring(0,uri.indexOf('?capsize')) +
                 '"><i>here</i></a> to download full version to your device.</div>' )
                .appendTo ( $(div) );
            }
            n = 8;
          }

          var preId = hId + "-pre";
          var pre = document.getElementById ( preId );
          if (!pre)  {
            pre = report.element ( "pre","id",preId,"" );
            pre.setAttribute ( "class","display-text" );
            var holder = document.getElementById ( hId );
            if (holder)
              holder.appendChild ( pre );
          } else {
            while (pre.hasChildNodes())
              pre.removeChild ( pre.lastChild );
          }
          if (n)  pre.appendChild ( document.createTextNode(data.substr(n)) );
            else  pre.appendChild ( document.createTextNode(data) );

        },
        function() {},
        function() {
          // alert ( "Data transmission error in updateWatchedContent" );
        });
    }(this,this.watchedContent[i][0],this.watchedContent[i][1]));
  }

}


RVAPIReport.prototype.loadContent = function ( cntId,uri,watch,taskUri )  {

  if (watch)  {
    var watched = false;
    for (var i=0;(i<this.watchedContent.length) && (!watched);i++)
      watched = this.watchedContent[i][0]==cntId;
    if (!watched)  {
      var holder = document.getElementById ( cntId );
      if (holder!=null)
        this.watchedContent.push ( [cntId,uri] );
    }
    if (this.__stop_poll)
      this.updateWatchedContent ( true );
  } else if (taskUri.length>0)  {
    (function(report){
      report.processFile ( uri,"post",true,
        function(data)  {
          $("#"+cntId).html ( data );
          report.processFile ( taskUri,"post",true,
            function(tdata)  {
              var cmdNo = 0;
              report.processCommands ( tdata,cmdNo );
            },
            function(){},
            function(){}
          );
        },
        function(){},
        function(){}
      );
    }(this))

  } else  {

    this.processFile ( uri,"post",true,
      function(data)  {
        $("#"+cntId).html ( data );
      },
      function(){},
      function(){}
    );

  }

}


RVAPIReport.prototype.loadContentTablesort = function ( uri,paging,tableId,holderId )  {

  this.processFile ( uri,"post",true,
    function(data)  {
        $("#"+holderId).html ( data );
        $("#"+tableId).tablesorter({
           theme: 'blue', widgets: ['zebra']
        });
    },
    function(){},
    function(){}
  );

}


RVAPIReport.prototype.submitForm = function ( form )  {
  this._formSubmittedID = form.id;
  form.submit();
  this.disableForm ( _formSubmittedID,true );
  this.startTaskTimed();
}
