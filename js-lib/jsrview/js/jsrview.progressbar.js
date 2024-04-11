//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.progressbar.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's progress bar module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function addProgressBar ( progBarId,range,width,holderId,
                          row,col,rowSpan,colSpan )  {

  if (document.getElementById(progBarId))
    return;

  let cell = getGridCell ( holderId,row,col );

  if (cell)  {
    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;
    $("<div style='position:relative;' id='"+progBarId+"'><div id='"+progBarId+"_lbl' class=\"progress-label\"></div></div>").appendTo(cell);
    let pbr = document.getElementById ( progBarId );
    let plb = $( "#" + progBarId + "_lbl" );
    if (width>0)
      pbr.style.width = width + "px";
    let pbar = $(pbr).progressbar ( {max:range,
      change: function() {
                let rmax = pbar.progressbar('option','max');
                plb.text( (100*pbar.progressbar("value"))/rmax + "%" );
              },
      complete: function() {
                plb.text( "" + range );
              }} );
    return cell;
  }
  return null;
}

function setProgressBarRange ( progBarId,value )  {
  $("#"+progBarId).progressbar ( "option","max",eval(value) );
}

function setProgressBarValue ( progBarId,value )  {
  $("#"+progBarId).progressbar ( "option","value",eval(value) );
}

function enableProgressBar ( progBarId )  {
  $("#"+progBarId).progressbar ( "enable" );
}

function disableProgressBar ( progBarId )  {
  $("#"+progBarId).progressbar ( "disable" );
}

function showProgressBar ( progBarId,visible )  {
let pbr = document.getElementById ( progBarId );
  if (pbr)  {
    if (visible)  pbr.style.display = "block";
            else  pbr.style.display = "none";
  }
}
