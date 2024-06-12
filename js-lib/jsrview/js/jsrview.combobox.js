//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.combobox.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's combobox module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function addComboboxGrid ( cbxId,name,options,onChange,size,
                           holderId,row,col,rowSpan,colSpan )  {
// ADD_COMBOBOX_GRID id name options onChange size holderId row col rowSpan colSpan

  if (document.getElementById(cbxId))
    return;

  let cell = getGridCell ( holderId,row,col );

  if (cell)  {

    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;

    let select = document.getElementById(cbxId);
    if (select!=null)  {
      while(select.options.length>0)  {
        select.remove(0);
      }
    } else  {
      select = element ( "select","id",cbxId,"" );
    }
    select.setAttribute ( "name",name );

    if (onChange.length>0)
      select.setAttribute ( "onchange",onChange );
    if (size>0)
      select.setAttribute ( "size",size );

    let opts = options.split("====");
    for (let i=0;i<opts.length;i++)  {
      opts[i] = $.trim(opts[i]);
      let opti = opts[i].split("+++");
      for (let j=0;j<opti.length;j++)
        opti[j] = $.trim(opti[j]);
      let option = new Option ( opti[0],opti[1] );
      select.options.add ( option );
      if (opti[2]=="yes")
        select.selectedIndex = i;
    }

    cell.appendChild ( select );

  }

  return cell;

}
