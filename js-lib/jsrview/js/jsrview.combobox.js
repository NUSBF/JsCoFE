//
//  =================================================================
//
//    10.09.17   <--  Date of Last Modification.
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
//  (C) E. Krissinel 2013-2017
//
//  =================================================================
//


function addComboboxGrid ( cbxId,name,options,onChange,size,
                           holderId,row,col,rowSpan,colSpan )  {
// ADD_COMBOBOX_GRID id name options onChange size holderId row col rowSpan colSpan

  if (document.getElementById(cbxId))
    return;

  var cell = getGridCell ( holderId,row,col );

  if (cell)  {

    cell.rowSpan = rowSpan;
    cell.colSpan = colSpan;

    var select = document.getElementById(cbxId);
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
