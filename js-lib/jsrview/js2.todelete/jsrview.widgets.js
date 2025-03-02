//
//  ===========================================================================
//
//    09.12.23   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  ---------------------------------------------------------------------------
//
//  **** Module  :  jsrview.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  Report widgets
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2023
//
//  ===========================================================================
//

//  ===========================================================================
//  REPORT WIDGETS
//  ===========================================================================


function RVAPIReportWidgets ( sceneId )  {
  RVAPIReportGraphs.call ( this,sceneId );
}

RVAPIReportWidgets.prototype = Object.create ( RVAPIReportGraphs.prototype );
RVAPIReportWidgets.prototype.constructor = RVAPIReportWidgets;


// ----------------------------------------------------------------------------
// BUTTONS
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.addSubmitButton = function ( inpId,title,formAction,
                                            formId, row,col,rowSpan,colSpan )  {
// ADD_SUBMIT_BUTTON inpId title formAction formId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(formId+"-grid"))
    return;

  var input = this.element ( "input","id",inpId,"" );
  input.setAttribute ( "type" ,"submit" );
  input.setAttribute ( "value",title    );

  if (formAction[0]!='*')
    input.setAttribute ( "formaction",formAction );

  this.addGridItem ( formId,input,row,col,rowSpan,colSpan );

}

RVAPIReportWidgets.prototype.addButtonGrid = function ( btnId,title,command,data,
                                                     rvOnly,holderId,
                                                     row,col,rowSpan,colSpan ) {

  /*
  if (command=='{coot}')  {
    if (typeof window.parent.__rvapi_config_coot_btn !== 'undefined')  {
      if (!window.parent.__rvapi_config_coot_btn)
        return;
    }
  }
  */
  if (command=='{coot}')
    return;

  if (document.getElementById(btnId))
    return;

  if (window.rvGate && (command=="{uglymol}"))
    return;

  if ((window.rvGate || window.parent.__local_service || (!rvOnly)) &&
      document.getElementById(holderId+"-grid"))  {
    var cell = this.getGridCell ( holderId,row,col );
    if (cell)  {
      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      var btn = document.getElementById ( btnId );
      if (!btn)  {
        if (command=="{function}")  {
          $("<input id=\"" + btnId + "\" type=\"button\" onclick=\"" + data +
            "\" class=\"button-common\" value=\"" + title + "\"/>")
           .appendTo(cell);
        } else  {
          $("<input id=\"" + btnId + "\" type=\"button\"  onclick=\"buttonClicked('" +
            command + "','" + data + "');\" class=\"button-common\" value=\"" +
            title + "\"/>")
           .appendTo(cell);
        }
      } else if (command=="{function}")  {
        btn.setAttribute ( "onclick",data );
      } else  {
        btn.setAttribute ( "onclick","buttonClicked('" + command +
                                                 "','" + data + "')" );
      }
    }
    return cell;
  }
  return null;
}


RVAPIReportWidgets.prototype.addButton = function ( btnId,title,command,data,
                                                    rvOnly,holderId )  {

  /*
  if (command=='{coot}')  {
    if (typeof window.parent.__rvapi_config_coot_btn !== 'undefined')  {
      if (!window.parent.__rvapi_config_coot_btn)
        return;
    }
  }
  */
  if (command=='{coot}')
    return;

  if (document.getElementById(btnId))
    return;

  if (window.rvGate && (command=="{uglymol}"))
    return;

  if ((window.rvGate || window.parent.__local_service || (!rvOnly)) &&
      document.getElementById(holderId))  {
    if (command=="{function}")  {
      $("<button id=\"" + btnId + "\" onclick=\"" + data +
        "\" class='button-common'>" + title + "</button>")
       .appendTo ( $("#"+holderId) );
    } else  {
      $("<button id=\"" + btnId + "\" onclick=\"buttonClicked('" + command +
        "','" + data + "')\" class='button-common'>" + title + "</button>")
       .appendTo ( $("#"+holderId) );
    }
  }

}


RVAPIReportWidgets.prototype.addIconButtonGrid = function ( btnId,button_class,tooltip,
                                                     command,data,rvOnly,holderId,
                                                     row,col,rowSpan,colSpan )  {

  /*
  if (command=='{coot}')  {
    if (typeof window.parent.__rvapi_config_coot_btn !== 'undefined')  {
      if (!window.parent.__rvapi_config_coot_btn)
        return;
    }
  }
  */
  if (command=='{coot}')
    return;

  if (document.getElementById(btnId))
    return;

  if (window.rvGate && (command=="{uglymol}"))
    return;

  if ((window.rvGate || window.parent.__local_service || (!rvOnly)) &&
      document.getElementById(holderId+"-grid"))  {
    var cell = this.getGridCell ( holderId,row,col );
    if (cell)  {
      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      if (command=="{function}")  {
        $("<div id=\"" + btnId + "\" title=\"" + tooltip +
            "\" onclick=\"" + data + "\" class='"  + button_class +
            "'></div>")
        .appendTo(cell);
      } else  {
        $("<div id=\"" + btnId + "\" title=\"" + tooltip +
            "\" onclick=\"buttonClicked('" + command +
            "','" + data + "')\" class='"  + button_class +
            "'></div>")
         .appendTo(cell);
      }
    }
    return cell;
  }
  return null;
}


RVAPIReportWidgets.prototype.addIconButton = function ( btnId,button_class,tooltip,
                                                        command,data,rvOnly,holderId )  {

  /*
  if (command=='{coot}')  {
    if (typeof window.parent.__rvapi_config_coot_btn !== 'undefined')  {
      if (!window.parent.__rvapi_config_coot_btn)
        return;
    }
  }
  */
  if (command=='{coot}')
    return;

  if (document.getElementById(btnId))
    return;

  if (window.rvGate && (command=="{uglymol}"))
    return;

  if ((window.rvGate || window.parent.__local_service || (!rvOnly)) &&
      document.getElementById(holderId))  {
    if (command=="{function}")  {
      $("<div id=\"" + btnId + "\" title=\"" + tooltip +
          "\" onclick=\"" + data + "\" class='"  + button_class +
          "'></div>")
       .appendTo ( $("#"+holderId) );
    } else  {
      $("<div id=\"" + btnId + "\" title=\"" + tooltip +
          "\" onclick=\"buttonClicked('" + command +
          "','" + data + "')\" class='"  + button_class +
          "'></div>")
       .appendTo ( $("#"+holderId) );
    }
  }

}


RVAPIReportWidgets.prototype.addRadioButtonGrid = function ( rbtnId,title,name,value,
                                                      checked,onChange,holderId,
                                                      row,col,rowSpan,colSpan ) {

  if (document.getElementById(rbtnId))
    return;

  var cell = this.getGridCell ( holderId,row,col );

  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    var check,change;
    if (checked)  check = " checked";
            else  check = " ";
    if (onChange.length>0)  change = " onChange=\"" + onChange + "\" ";
                      else  change = "";
    $("<label id=\""+rbtnId+"-label"+"\" for=\"" + rbtnId +
                                 "\" style=\"white-space:nowrap\">" +
        "<input id=\""+rbtnId+"\" type='radio' name='" + name +
         "' value='" + value + "'" + check + change + "/>" +
        title + "</label>")
     .appendTo(cell);
  }

  return cell;

}

RVAPIReportWidgets.prototype.makeRadioButtonsAction = function ( rbName,actionId,
                                                                 actionName )  {
var test = document.getElementsByName(rbName);
  for (var i=0;i<test.length;i++)
    if (test[i].checked)
      this.setValue ( actionId,actionName,test[i].value );
}


RVAPIReportWidgets.prototype.buttonClicked = function ( command,data )  {
// General button click dispatcher

  if (command=="{export}")  {
    if (window.rvGate)
          window.rvGate.buttonClicked ( command,data );
    else  this.downloadUri ( data );
  } else if (command=="{uglymol}")  {
    this._startUglyMol ( data,'' );  //### not in the scope
  } else if (command=="{display}")  {
    this.displayData ( data );    //### not in the scope
  } else if (command=="{popup}")  {
    this.popupWindow ( data );
  } else if (command=="{print-gwd}")  {
    this.printPlot ( data );      //### not in the scope
  } else if (command!="{void}")  {
    if (window.rvGate)
      window.rvGate.buttonClicked ( command,data );
    else if (window.parent.__local_service)  {
      let base_url = window.location.href;
      window.parent.ls_RVAPIAppButtonClicked (
                base_url.substring(0,base_url.lastIndexOf('/')),command,data )  ;
    } else if (command=="{viewhkl}")  {
      this.startViewHKL ( "",data,window );  //### not in the scope
    }
  }

}


// ----------------------------------------------------------------------------
// CHECKBOXES
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.addCheckboxGrid = function ( cbxId,title,name,value,
                                                    command,data, checked,
                                                    onChange,holderId,
                                                    row,col,rowSpan,colSpan )  {

  if (document.getElementById(cbxId))
    return;

  var cell = this.getGridCell ( holderId,row,col );

  if (cell)  {

    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;

    var options = "";
    if (name.length>0)
      options = options + " name=\"" + name + "\"";
    if (value.length>0)
      options = options + " value=\"" + value + "\"";
    if (checked)
      options = options + " checked";
    if (command.length>0)
      options = options + " onclick=\"checkboxClicked(this,'" +
                                      command + "','" + data + "');\"";
    if (onChange.length>0)
      options = options + " onChange=\""+onChange+"\" ";

    $("<label id=\""+cbxId+"-label"+"\" for=\"" + cbxId +
                                  "\" style=\"white-space:nowrap\">" +
        "<input id=\""+cbxId+"\" type=\"checkbox\"" + options + "/>" +
        title + "</label>")
     .appendTo(cell);

  }

  return cell;

}


//### move this to graphs
RVAPIReportWidgets.prototype.checkboxClicked = function ( checkbox,command,data )  {
// General checkbox click dispatcher

  if (command=="{showline}")  {

    var d = data.split(",");
    var c = 0;
    for (var i=0;i<d.length;i++)  {
      var g = d[i].split("/");
      c += this.showGraphLine ( $.trim(g[0]),$.trim(g[1]),$.trim(g[2]),$.trim(g[3]),
                                checkbox.checked );
    }

    if ((!checkbox.checked) && (c>0))  {
      // one or more plots ran out of lines, which is disallowed
      checkbox.checked = true;
      for (var i=0;i<d.length;i++)  {
        var g = d[i].split("/");
        this.showGraphLine ( $.trim(g[0]),$.trim(g[1]),$.trim(g[2]),$.trim(g[3]),
                             checkbox.checked );
      }
    }

  }

}


// ----------------------------------------------------------------------------
// COMBOBOXES
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.addComboboxGrid = function ( cbxId,name,options,
                            onChange,size,holderId,row,col,rowSpan,colSpan )  {
// ADD_COMBOBOX_GRID id name options onChange size holderId row col rowSpan colSpan

  if (document.getElementById(cbxId))
    return;

  var cell = this.getGridCell ( holderId,row,col );

  if (cell)  {

    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;

    var select = document.getElementById(cbxId);
    if (select!=null)  {
      while(select.options.length>0)  {
        select.remove(0);
      }
    } else  {
      select = this.element ( "select","id",cbxId,"" );
    }
    select.setAttribute ( "name",name );

    if (onChange.length>0)
      select.setAttribute ( "onchange",onChange );
    if (size>0)
      select.setAttribute ( "size",size );

    var opts = options.split("====");
    for (var i=0;i<opts.length;i++)  {
      opts[i] = $.trim(opts[i]);
      var opti = opts[i].split("+++");
      for (var j=0;j<opti.length;j++)
        opti[j] = $.trim(opti[j]);
      var option = new Option ( opti[0],opti[1] );
      select.options.add ( option );
      if (opti[2]=="yes")
        select.selectedIndex = i;
    }

    cell.appendChild ( select );

  }

  return cell;

}


// ----------------------------------------------------------------------------
// DROPDOWNS
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.toggleDropDown = function ( ddnId )  {
var btn    = document.getElementById ( ddnId+"-btn" );
var ddbody = document.getElementById ( ddnId );
  if (ddbody.style.display!="block")  {
    btn.setAttribute ( "class","icon_item_collapsed" );
    ddbody.style.display = "block";
  } else  {
    btn.setAttribute ( "class","icon_item_expanded" );
    ddbody.style.display = "none";
  }
}


RVAPIReportWidgets.prototype.addDropDown = function ( ddnId,ddnTitle,holderId,
                                           row,col,rowSpan,colSpan, foldState ) {

  if (document.getElementById(ddnId))
    return;

  if (!document.getElementById(holderId+"-grid"))  {
//    alert ( "  no holder for dropdown id=" + ddnId + ", holderId=" + holderId + "!" );
    return;
  }

  var table = document.getElementById ( ddnId+"_dd-grid" );

  if (table)  {
    this.removeElement ( table );
    table = false;
  }

  if (!table)  {
    table = element ( "table","id",ddnId+"_dd-grid","" );
    if (foldState.indexOf("wide")>0)
         table.setAttribute ( "class","dropdown-layout" );
    else table.setAttribute ( "class","dropdown-layout-compact" );
    if (foldState.indexOf("none")>=0)  {
      if ((ddnTitle!=" ") && (ddnTitle!=""))  {
        $("<tr>" +
            "<td class='dropdown-header'>"+ddnTitle+"</td>" +
            "<td width='99%'><div id='"+ddnId+"-ext'></div></td>" +
          "</tr><tr>"+
            "<td colspan='2'><div id='"+ddnId+"'></div></td>" +
          "</tr>"
         ).appendTo(table);
      } else  {
        $("<tr>" +
            "<td colspan='2'><div id='"+ddnId+"'></div></td>" +
          "</tr>"
         ).appendTo(table);
      }
      this.addGridItem ( holderId,table,row,col,rowSpan,colSpan );
    } else  {
      $("<tr>" +
          "<td><button id='"+ddnId+"-btn' " +
                "class=\"icon_item_collapsed\" " +
                "onclick=\"toggleDropDown('"+ddnId+"')\">&nbsp;</button>"+
          "</td>" +
          "<td class='dropdown-header' onclick=\"toggleDropDown('"+ddnId+"')\">"+
                                   ddnTitle+"</td>" +
          "<td width='99%'><div id='"+ddnId+"-ext'></div></td>" +
        "</tr><tr>"+
          "<td height='0px'></td>" +
          "<td colspan='2'><div id='"+ddnId+"'></div></td>" +
        "</tr>"
       ).appendTo(table);
      this.addGridItem ( holderId,table,row,col,rowSpan,colSpan );
      var btn    = document.getElementById ( ddnId+"-btn" );
      var ddbody = document.getElementById ( ddnId );
      if (foldState.indexOf("_folded")>=0)  {
        btn.setAttribute ( "class","icon_item_expanded" );
        ddbody.style.display = "none";
      } else  {
        btn.setAttribute ( "class","icon_item_collapsed" );
        ddbody.style.display = "block";
      }
    }
  }
}


// ----------------------------------------------------------------------------
//  FORMS
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.addForm = function ( formId,action,method,holderId,
                                                  row,col,rowSpan,colSpan )  {
// Puts a form into the specified grid position, and adds a grid to it

  if (document.getElementById(formId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  var form = this.element ( "form","id",formId,"" );
  form.setAttribute ( "action" ,action );
  form.setAttribute ( "method" ,method );
  form.setAttribute ( "enctype","multipart/form-data" );

  this.addGridItem    ( holderId,form,row,col,rowSpan,colSpan );
  this.addGridCompact ( formId );

}

RVAPIReportWidgets.prototype.addFileUpload = function ( inpId,name,value,length,
                                                    required,onChange,holderId,
                                                    row,col,rowSpan,colSpan )  {
// ADD_FILE_UPLOAD inpId name value length holderId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  var input = this.element ( "input","id",inpId,"" );
  input.setAttribute ( "type","file" );
  if (name.length>0)     input.setAttribute ( "name"    ,name     );
  if (value.length>0)    input.setAttribute ( "value"   ,value    );
  if (length>0)          input.setAttribute ( "size"    ,length   );
  if (required)          input.setAttribute ( "required","yes"    );
  if (onChange.length>0) input.setAttribute ( "onchange",onChange );

  this.addGridItem ( holderId,input,row,col,rowSpan,colSpan );

}

RVAPIReportWidgets.prototype.addLineEdit = function ( inpId,name,text,size,
                                        holderId, row,col,rowSpan,colSpan )  {
// ADD_LINE_EDIT inpId name value size formId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  var input = this.element ( "input","id",inpId,"" );
  input.setAttribute ( "type","text" );
  if (name.length>0) input.setAttribute ( "name"     ,name );
  if (text.length>0) input.setAttribute ( "value"    ,text );
  if (size>0)        input.setAttribute ( "maxlength",size );

  this.addGridItem ( holderId,input,row,col,rowSpan,colSpan );

  if (size>0)
    input.style.width = input.offsetHeight*size/1.75 + "px";

}

RVAPIReportWidgets.prototype.addHiddenText = function ( inpId,name,text,
                                          holderId, row,col,rowSpan,colSpan )  {
// ADD_HIDDEN_TEXT inpId name value formId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(holderId+"-grid"))
    return;

  var input = this.element ( "input","id",inpId,"" );
  input.setAttribute ( "type" ,"hidden" );
  input.setAttribute ( "name" ,name     );
  input.setAttribute ( "value",text     );

  this.addGridItem ( holderId,input,row,col,rowSpan,colSpan );

}


// ----------------------------------------------------------------------------
//  PROGRESSBAR
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.addProgressBar = function ( progBarId,range,width,
                                          holderId, row,col,rowSpan,colSpan )  {

  if (document.getElementById(progBarId))
    return;

  var cell = this.getGridCell ( holderId,row,col );

  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    $("<div style='position:relative;' id='" + progBarId + "'><div id='" +
      progBarId + "_lbl' class=\"progress-label\"></div></div>"
     ).appendTo(cell);
    var pbr = document.getElementById ( progBarId );
    var plb = $( "#" + progBarId + "_lbl" );
    if (width>0)
      pbr.style.width = width + "px";
    var pbar = $(pbr).progressbar ( {max:range,
      change: function() {
                var rmax = pbar.progressbar('option','max');
                plb.text( (100*pbar.progressbar("value"))/rmax + "%" );
              },
      complete: function() {
                plb.text( "" + range );
              }} );
    return cell;
  }
  return null;
}

RVAPIReportWidgets.prototype.setProgressBarRange = function ( progBarId,value )  {
  $("#"+progBarId).progressbar ( "option","max",eval(value) );
}

RVAPIReportWidgets.prototype.setProgressBarValue = function ( progBarId,value )  {
  $("#"+progBarId).progressbar ( "option","value",eval(value) );
}

RVAPIReportWidgets.prototype.enableProgressBar = function ( progBarId )  {
  $("#"+progBarId).progressbar ( "enable" );
}

RVAPIReportWidgets.prototype.disableProgressBar = function ( progBarId )  {
  $("#"+progBarId).progressbar ( "disable" );
}

RVAPIReportWidgets.prototype.showProgressBar = function ( progBarId,visible )  {
var pbr = document.getElementById ( progBarId );
  if (pbr)  {
    if (visible)  pbr.style.display = "block";
            else  pbr.style.display = "none";
  }
}


// ----------------------------------------------------------------------------
//  SECTION
// ----------------------------------------------------------------------------

RVAPIReportWidgets.prototype.addSection = function ( secId,secTitle,holderId,
                                                     row,col,rowSpan,colSpan, isOpen )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  if (document.getElementById(secId+"-accordion"))
    return;

  var div = this.element ( "div","id",secId+"-accordion","" );

  $("<h1><a>"+secTitle+"</a></h1><div id='"+secId+"'></div>").appendTo(div);
  this.addGridItem ( holderId,div,row,col,rowSpan,colSpan );
  this.addGrid ( secId );
  (function(report){
    if (isOpen)
      $("#"+secId+"-accordion").accordion({
        collapsible : true,
        heightStyle : "content",
        activate    : function (event,ui)  {
          report.drawHiddenGraphs ( ui.newPanel );
        }
      });
    else
      $("#"+secId+"-accordion").accordion({
        active      : false,
        collapsible : true,
        heightStyle : "content",
        activate    : function (event,ui)  {
          report.drawHiddenGraphs ( ui.newPanel );
        }
      });
  }(this))

}


RVAPIReportWidgets.prototype.setSectionState = function ( secId,isOpen )  {
  if (isOpen)
    $("#"+secId+"-accordion").accordion ( "option","active",true );
  else
    $("#"+secId+"-accordion").accordion ( "option","active",false );
}
