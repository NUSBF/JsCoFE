//
//  =================================================================
//
//    07.12.19   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.buttons.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's button module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2019
//
//  =================================================================
//


function addSubmitButton ( inpId,title,formAction,formId,
                           row,col,rowSpan,colSpan )  {
// ADD_SUBMIT_BUTTON inpId title formAction formId row col rowSpan colSpan

  if (document.getElementById(inpId))
    return;

  if (!document.getElementById(formId+"-grid"))
    return;

  var input = element ( "input","id",inpId,"" );
  input.setAttribute ( "type" ,"submit" );
  input.setAttribute ( "value",title    );

  if (formAction[0]!='*')
    input.setAttribute ( "formaction",formAction );

  addGridItem ( formId,input,row,col,rowSpan,colSpan );

}

function addButtonGrid ( btnId,title,command,data,rvOnly,holderId,
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
    var cell = getGridCell ( holderId,row,col );
    if (cell)  {
      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      var btn = document.getElementById ( btnId );
      if (!btn)  {
        if (command=="{function}")  {
          $("<input id=\""+btnId+"\" type=\"button\" onclick=\"" + data +
            "\" class=\"button-common\" value=\"" + title + "\"/>")
           .appendTo(cell);
        } else  {
          $("<input id=\""+btnId+"\" type=\"button\"  onclick=\"buttonClicked('" + command +
            "','" + data + "');\" class=\"button-common\" value=\"" + title + "\"/>")
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


function addButton ( btnId,title,command,data,rvOnly,holderId )  {

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
      $("<button id=\""+btnId+"\" onclick=\"" + data +
        "\" class='button-common'>" + title + "</button>")
       .appendTo ( $("#"+holderId) );
    } else  {
      $("<button id=\""+btnId+"\" onclick=\"buttonClicked('" + command +
        "','" + data + "')\" class='button-common'>" + title + "</button>")
       .appendTo ( $("#"+holderId) );
    }
  }

}


function addIconButtonGrid ( btnId,button_class,tooltip,command,data,
                             rvOnly,holderId,row,col,rowSpan,colSpan )  {

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
    var cell = getGridCell ( holderId,row,col );
    if (cell)  {
      cell.rowSpan = rowSpan;
      cell.colSpan = colSpan;
      if (command=="{function}")  {
        $("<div id=\""+btnId+"\" title=\"" + tooltip +
            "\" onclick=\"" + data + "\" class='"  + button_class +
            "'></div>")
        .appendTo(cell);
      } else  {
        $("<div id=\""+btnId+"\" title=\"" + tooltip +
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


function addIconButton ( btnId,button_class,tooltip,command,data,rvOnly,
                         holderId )  {

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
      $("<div id=\""+btnId+"\" title=\"" + tooltip +
          "\" onclick=\"" + data + "\" class='"  + button_class +
          "'></div>")
       .appendTo ( $("#"+holderId) );
    } else  {
      $("<div id=\""+btnId+"\" title=\"" + tooltip +
          "\" onclick=\"buttonClicked('" + command +
          "','" + data + "')\" class='"  + button_class +
          "'></div>")
       .appendTo ( $("#"+holderId) );
    }
  }

}


function addRadioButtonGrid ( rbtnId,title,name,value,checked,onChange,
                              holderId,row,col,rowSpan,colSpan )  {

  if (document.getElementById(rbtnId))
    return;

  var cell = getGridCell ( holderId,row,col );

  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    var check,change;
    if (checked)  check = " checked";
            else  check = " ";
    if (onChange.length>0)  change = " onChange=\""+onChange+"\" ";
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

function makeRadioButtonsAction ( rbName,actionId,actionName )  {
var test = document.getElementsByName(rbName);
  for (var i=0;i<test.length;i++)
    if (test[i].checked)
      setValue ( actionId,actionName,test[i].value );
}


function buttonClicked ( command,data )  {
// General button click dispatcher

  var l1 = data.split ( '{{meta ' );
  var data_item = data;
  var meta_item = null;
  if (l1.length>1)  {
    var l2 = l1[1].split('}}');
    meta_item = l2[0];
    data_item = l1[0] + l2[1];
  }
  if (command=="{export}")  {
    if (window.rvGate)
          window.rvGate.buttonClicked ( command,data_item );
    else  downloadUri ( data_item );
  } else if (command=="{uglymol}")  {
    _startUglyMol ( data_item,meta_item );
  } else if (command=="{display}")  {
    displayData ( data_item );
  } else if (command=="{popup}")  {
    popupWindow ( data_item );
  } else if (command=="{print-gwd}")  {
    printPlot ( data_item );
  } else if (command!="{void}")  {
    if (window.rvGate)
      window.rvGate.buttonClicked ( command,data_item );
    else if (window.parent.__local_service)  {
      var base_url = window.location.href;
      window.parent.ls_RVAPIAppButtonClicked (
                base_url.substring(0,base_url.lastIndexOf('/')),command,
                data_item )  ;
    } else if (command=="{viewhkl}")  {
      startViewHKL ( "",data_item );
    }
  }

}
