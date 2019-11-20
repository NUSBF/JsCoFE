//
//  =================================================================
//
//    10.09.17   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.checkbox.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's checkbox module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2017
//
//  =================================================================
//


function addCheckboxGrid ( cbxId,title,name,value,command,data,checked,
                           onChange,holderId,
                           row,col,rowSpan,colSpan )  {

  if (document.getElementById(cbxId))
    return;

  var cell = getGridCell ( holderId,row,col );

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

function checkboxClicked ( checkbox,command,data )  {
// General checkbox click dispatcher

  if (command=="{showline}")  {

    var d = data.split(",");
    var c = 0;
    for (var i=0;i<d.length;i++)  {
      var g = d[i].split("/");
      c += showGraphLine ( $.trim(g[0]),$.trim(g[1]),$.trim(g[2]),$.trim(g[3]),
                           checkbox.checked );
    }

    if ((!checkbox.checked) && (c>0))  {
      // one or more plots ran out of lines, which is disallowed
      checkbox.checked = true;
      for (var i=0;i<d.length;i++)  {
        var g = d[i].split("/");
        showGraphLine ( $.trim(g[0]),$.trim(g[1]),$.trim(g[2]),$.trim(g[3]),
                        checkbox.checked );
      }
    }

  }

}
