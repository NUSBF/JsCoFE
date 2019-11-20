//
//  =================================================================
//
//    10.05.16   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.section.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's section module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2016
//
//  =================================================================
//

function addSection ( secId,secTitle,holderId,row,col,rowSpan,colSpan,
                      isOpen )  {

  if (!document.getElementById(holderId+"-grid"))
    return;

  if (document.getElementById(secId+"-accordion"))
    return;

  var div = element ( "div","id",secId+"-accordion","" );

  $("<h1><a>"+secTitle+"</a></h1><div id='"+secId+"'></div>").appendTo(div);
  addGridItem ( holderId,div,row,col,rowSpan,colSpan );
  addGrid ( secId );
  if (isOpen)
    $("#"+secId+"-accordion").accordion({
      collapsible : true,
      heightStyle : "content",
      activate    : function (event,ui)  {
        drawHiddenGraphs ( ui.newPanel );
      }
    });
  else
    $("#"+secId+"-accordion").accordion({
      active      : false,
      collapsible : true,
      heightStyle : "content",
      activate    : function (event,ui)  {
        drawHiddenGraphs ( ui.newPanel );
      }
    });

}


function setSectionState ( secId,isOpen )  {
  if (isOpen)
    $("#"+secId+"-accordion").accordion ( "option","active",true );
  else
    $("#"+secId+"-accordion").accordion ( "option","active",false );
}
