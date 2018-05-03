//
//  =================================================================
//
//    13.01.18   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
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
//  =================================================================
//


$(function() {
  $( document ).tooltip();
});


var __stop_poll  = false;
var __timestamp1 = "";
var __timestamp2 = "";


function processCommands ( commands,command_no )  {
var last_cmd_no,i,j;
var statement = commands.replace(/\\/g,"\\\\")
                        .replace(/\r\n|\n\r|\n|\r/g,"\n")
                        .split(";;;\n");
var cmd_no = command_no;

  if (statement.length<=0)
    return 0;

  if (__timestamp1!="")  {
    var p0 = statement[0].split(":::");
    if ((p0[0]=="TASK_STAMP") &&
        (p0.length==4)        &&  // to be removed later
        ((p0[1]!=__timestamp1) || (p0[2]!=__timestamp2)) &&
        (p0[3]=="RELOAD"))  {
      __timestamp1 = "";
      __timestamp2 = "";
      last_cmd_no  = 0;
      _commandNo   = 0;   // global variable
      _taskData    = "";

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
                addTab ( mainTabBarId,p[1],p[2],p[3]=="true",false );
              break;

        case 'INSERT_TAB' :  // INSERT_TAB before_id id name open
                insertTab ( mainTabBarId,p[1],p[2],p[3],p[4]=="true",false );
              break;

        case 'REMOVE_TAB' : // REMOVE_TAB id
                removeTab ( mainTabBarId,p[1] );
              break;

        case 'ADD_SECTION' : // ADD_SECTION id title holderId row col rowSpan colSpan open
                addSection ( p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8]=="true" );
              break;

        case 'SET_SECTION_STATE' : // SET_SECTION_STATE id open
                setSectionState ( p[1],p[2]=="true" );
              break;

        case 'OPEN_TAB' : // OPEN_TAB id
                $( '#'+mainTabBarId ).tabs ( 'option', 'active',
                                      getTabNo(mainTabBarId,p[1]) );
              break;

        case 'SET_HEADER' : // SET_HEADER html-string
                setPageHeader ( p[1] );
              break;

        case 'ADD_GRID' : // ADD_GRID holderId
                addGrid ( p[1] );
              break;

        case 'ADD_GRID_COMPACT' : // ADD_GRID_COMPACT holderId
                addGridCompact ( p[1] );
              break;

        case 'NEST_GRID' : // NEST_GRID gridId holderId row col rowSpan colSpan
                nestGrid ( p[1],p[2],p[3],p[4],p[5],p[6] );
              break;

        case 'NEST_GRID_COMPACT' : // NEST_GRID_COMPACT gridId holderId row col rowSpan colSpan
                nestGridCompact ( p[1],p[2],p[3],p[4],p[5],p[6] );
              break;

        case 'SET_TEXT_GRID' : // ADD_TEXT textString holderId row col rowSpan colSpan
                setGridItem ( p[2],document.createTextNode(p[1]),
                              p[3],p[4],p[5],p[6] );
              break;

        case 'SET_HTML_GRID' : // SET_HTML_GRID htmlString holderId row col rowSpan colSpan
                setHtmlGrid ( p[2],p[1],p[3],p[4],p[5],p[6] );
              break;

        case 'SET_IFRAME_GRID' : // SET_IFRAME_GRID uri width height holderId row col rowSpan colSpan
                //setGridItem ( p[2],document.createTextNode(p[1]),
                //              p[3],p[4],p[5],p[6] );
              break;

        case 'ADD_HTML_GRID' : // SET_HTML_GRID htmlString holderId row col rowSpan colSpan
                addHtmlGrid ( p[2],p[1],p[3],p[4],p[5],p[6] );
              break;

        case 'SET_HTML' : // SET_HTML id htmlString
                setHtml ( p[1],p[2] );
              break;

        case 'SET_HTML_TABLESORT' : // SET_HTML_TABLESORT id htmlString
                setHtml ( p[1],p[2] );
              break;

        case 'ADD_HTML' : // ADD_HTML id htmlString
                addHtml ( p[1],p[2] );
              break;

        case 'ADD_PANEL' : // ADD_PANEL panelId holderId row col rowSpan colSpan
                addPanel ( p[1],p[2],p[3],p[4],p[5],p[6] );
              break;

        case 'ADD_FIELDSET' : // ADD_FIELDSET fsetId title holderId row col rowSpan colSpan
                addFieldset ( p[1],p[2],p[3],p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_FORM' :
                // ADD_FORM formId action method holderId row col rowSpan colSpan
                addForm ( p[1],p[2],p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_FILE_UPLOAD' :
                // ADD_FILE_UPLOAD inpId name value length required onChange formId row col rowSpan colSpan
                addFileUpload ( p[1],p[2],p[3],p[4], p[5]=='true',p[6],
                                p[7], p[8],p[9],p[10],p[11] );
              break;

        case 'ADD_SUBMIT_BUTTON' :
                // ADD_SUBMIT_BUTTON inpId title formAction formId row col rowSpan colSpan
                addSubmitButton ( p[1],p[2],p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_LINE_EDIT' :
                // ADD_LINE_EDIT inpId name value size formId row col rowSpan colSpan
                addLineEdit ( p[1],p[2],p[3],p[4], p[5], p[6],p[7],p[8],p[9] );
              break;

        case 'ADD_HIDDEN_TEXT' :
                // ADD_HIDDEN_TEXT inpId name value formId row col rowSpan colSpan
                addHiddenText ( p[1],p[2],p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'SET_CELL_STRETCH' : // SET_CELL_STRETCH gridId width height row col
                setCellStretch ( p[1], p[2],p[3], p[4],p[5] );
              break;

        case 'LOAD_CONTENT_GRID' :
                // LOAD_CONTENT_GRID uri watch subtaskUri holderId row col rowSpan colSpan
                loadGridContent ( p[1],p[2]=='true',p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'LOAD_CONTENT' : // LOAD_CONTENT holderId uri watch subtaskUri
                loadContent ( p[1],p[2], p[3]=='true',p[4] );
              break;

        case 'LOAD_CONTENT_TABLESORT' :
                // LOAD_CONTENT_TABLESORT uri paging tableId holderId
                loadContentTablesort ( p[1],p[2]=='true',p[3],p[4] );
              break;

        case 'ADD_DROPDOWN' :
                // ADD_DROPDOWN id title holderId row col rowSpan colSpan foldState
                addDropDown ( p[1],p[2],p[3], p[4],p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_BUTTON_GRID' :
                // ADD_BUTTON_GRID id title command data rvOnly holderId row col rowSpan colSpan
                addButtonGrid ( p[1],p[2],p[3],p[4], p[5]=='true',
                                p[6],p[7],p[8],p[9],p[10] );
              break;

        case 'ADD_CHECKBOX_GRID' :
                // ADD_CHECKBOX_GRID id title name value command data checked onChange holderId row col rowSpan colSpan
                addCheckboxGrid ( p[1],p[2],p[3],p[4],p[5],p[6], p[7]=='true',
                                  p[8], p[9], p[10],p[11],p[12],p[13] );
              break;

        case 'ADD_COMBOBOX_GRID' :
                // ADD_COMBOBOX_GRID id name options onChange size holderId row col rowSpan colSpan
                addComboboxGrid ( p[1],p[2],p[3],p[4],p[5],
                                  p[6], p[7],p[8],p[9],p[10] );
              break;

        case 'ADD_BUTTON' :
                // ADD_BUTTON id title command data rvOnly holderId
                addButton ( p[1],p[2],p[3],p[4], p[5]=='true', p[6] );
              break;

        case 'ADD_RADIO_BUTTON' :
                // ADD_RADIO_BUTTON id title name value checked onChange holderId row col rowSpan colSpan
                addRadioButtonGrid ( p[1],p[2],p[3],p[4], p[5]=='true', p[6],
                                     p[7], p[8],p[9],p[10],p[11] );
              break;

        case 'ADD_TEXTBOX_GRID' :
                // ADD_TEXTBOX_GRID id text holderId row col rowSpan colSpan
                addTextBoxGrid ( p[1],p[2],p[3], p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_LOG_GRAPH' :
                // ADD_LOG_GRAPH id holderId treeData row col rowSpan colSpan
                addLogGraph ( p[1],p[2], p[3], p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_GRAPH' :
                // ADD_GRAPH id holderId graphData row col rowSpan colSpan
                addGraph ( p[1],p[2], p[3], p[4],p[5],p[6],p[7] );
              break;

        case 'ADD_RADAR' :
                // ADD_RADAR data options holderId row col rowSpan colSpan
                addRadarWidget ( p[1],p[2], p[3] );
              break;

        case 'ADD_TREE_WIDGET' :
                // ADD_TREE_WIDGET id title holderId treeData row col rowSpan colSpan
                addTreeWidget ( p[1],p[2], p[3], p[4], p[5],p[6],p[7],p[8] );
              break;

        case 'ADD_PROGRESS_BAR' :
                // ADD_PROGRESS_BAR id range width holderId row col rowSpan colSpan
                addProgressBar ( p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8] );
              break;

        case 'SET_PROGRESS_BAR' : // SET_PROGRESS_BAR id key value
                if (p[2]=='HIDE')  {
                  if (p[1]==progressBarId)  showToolBarProgress ( false );
                                      else  showProgressBar ( p[1],false );
                } else if (p[2]=='SHOW')  {
                  if (p[1]==progressBarId)  showToolBarProgress ( true );
                                      else  showProgressBar ( p[1],true );
                } else if (p[2]=='RANGE')
                  setProgressBarRange ( p[1],p[3] );
                else if (p[2]=='VALUE')
                  setProgressBarValue ( p[1],p[3] );
              break;

        case 'DISABLE_ELEMENT' : // DISABLE_ELEMENT id disable
                disableElement ( p[1],p[2] == 'true' );
              break;

        case 'DISABLE_FORM' : // DISABLE_FORM id disable
                disableForm ( p[1],p[2] == 'true' );
              break;

        case 'REMOVE_WIDGET' : // REMOVE_WIDGET id
                removeElement ( p[1] );
              break;

        case 'SET_TIME_QUANT' : // SET_TIME_QUANT milliseconds
                timeQuant = p[1];
              break;

        case 'TASK_STAMP' : // TASK_STAMP time clock
                // used only for making task files uniquely stamped
                __timestamp1 = p[1];
                __timestamp2 = p[2];
              break;

        case 'STOP_POLL' : // STOP_POLL
                // stops checking for new tasks if this is last command
                // in the file
                __stop_poll = (cmd_no>=statement.length-2);
              break;

        default : ;  last_cmd_no = last_cmd_no_save;

      }

    }

    cmd_no++;

  }

  return last_cmd_no;

}


function processFile ( uri,method,asynchronous,
                       functionSuccess,
                       functionAlways,
                       functionFail )  {

  if (window.rvGate)  {

    if ((window.location.protocol!="http:") &&
        (window.location.protocol!="https:"))  {
      if (asynchronous)  {
        var tdata = window.rvGate.readFile(uri);
        (function(data){
          window.setTimeout ( function(){
            if (window.rvGate.ioresult==0)  {
              functionSuccess(data);
            } else  {
              functionFail();
            }
            functionAlways();
          },0);
        }(tdata))
      } else  {
        var tdata = window.rvGate.readFile(uri);
        if (window.rvGate.ioresult==0)  {
          functionSuccess(tdata);
        } else  {
          functionFail();
        }
        functionAlways();
      }
      return;
    }

  }

  var prefix = "";
  if (uri.length>2)  {
    // check for absolute paths on Windows
    if ((uri.charAt(1)==':') &&
        ((uri.charAt(2)=='\\') || (uri.charAt(2)=='/')))
      prefix = "file:///";
  }

  /*
  $.ajax ({
    url     : prefix+uri,
    async   : asynchronous,
    type    : method,
    dataType: 'text'
  })
  .done   ( functionSuccess )
  .always ( functionAlways  )
  .fail   ( functionFail    );
  */

  var oReq = new XMLHttpRequest();
  var moduri = prefix + uri;
  if (uri.indexOf('?')>=0)  moduri += ';'
                      else  moduri += '?';
  oReq.open ( method, moduri+'nocache='+new Date().getTime(), asynchronous );
  oReq.responseType = "text";
  oReq.timeout      = 9999999;

  oReq.onload = function(oEvent) {
    var tdata = oReq.responseText; // Note: not oReq.responseText
    if (tdata)
      functionSuccess ( tdata );
    functionAlways();
  }

  oReq.onerror = function()  {
    functionFail  ();
    functionAlways();
  }

  oReq.ontimeout = function()  {
    functionFail  ();
    functionAlways();
  }

  oReq.send(null);

}


function readTask()  {

  if (_taskTimer==0)  {
    processFile ( taskFile,"post",true,
      function(data)  { // on success
        _taskData  = new String(data);
        _commandNo = processCommands ( data,_commandNo ) + 1;
      },
      function()  {  // always
        updateWatchedContent ( __stop_poll );
        if (!__stop_poll)
          setTimeout ( readTask,timeQuant );
//        __stop_poll = false;
      },
      function() {

      }  // on fail
    );
  }

}


function readTaskTimed()  {

  if ((_waitDialogMessage.length>1) && (_waitDialogCountdown>=0))  {
    _waitDialogCountdown = _waitDialogCountdown - _taskTimerInterval;
    if (_waitDialogCountdown<=0)  {
      var dialog = element ( "div","id",_waitDialogId,"" );
      dialog.setAttribute ( "title",_waitDialogTitle );
      dialog.innerHTML = _waitDialogMessage;
      _document_body.appendChild ( dialog );
      $( "#"+_waitDialogId).dialog({
        dialogClass: "no-close"
      });
      _waitDialogCountdown = -1;
    }
  }

  processFile ( taskFile,"post",true,

    function(data)  {  // on success
      if (data.length>0)  {

        var change = 1;
        if (data.length == _taskData.length)  {
          if (data == _taskData)  change = 0;
        }

        if (change!=0)  {

          clearInterval ( _taskTimer );

          if (_formSubmittedID.length>1)  {
            disableForm ( _formSubmittedID,false );
            _formSubmittedID = "";
          }

          var dialog = document.getElementById ( _waitDialogId );
          if (dialog)  {
            $( "#"+_waitDialogId).dialog("destroy");
            _document_body.removeChild ( dialog );
          }

          _waitDialogMessage   = "";
          _waitDialogCountdown = -1;
          _taskData  = new String(data);
//        _commandNo  = 0;
          _commandNo  = processCommands ( data,_commandNo ) + 1;
        }
      }
    },

    function()  { // always
      updateWatchedContent ( __stop_poll );
      _taskTimer = 0;
      if (!__stop_poll)
        setTimeout ( readTask,timeQuant );
//      __stop_poll = false;
    },

    function() {}  // on fail

  );

}


function startTaskTimed()  {
  if (_taskTimer!=0)
    clearInterval ( _taskTimer );
  _taskTimer = setInterval ( readTaskTimed,_taskTimerInterval );
}
