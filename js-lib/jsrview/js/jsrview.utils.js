//
//  =================================================================
//
//    10.05.16   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.utils.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's general utils
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2016
//
//  =================================================================
//


function element ( type,attr,attrval,text )  {
var elem = document.createElement ( type );
  if (attr.length>0)
    elem.setAttribute ( attr,attrval );
  if (text.length>0)
    elem.appendChild  ( document.createTextNode(text) );
  return elem;
}

function removeElement ( elemId )  {
var elem = document.getElementById ( elemId );

  if (elem)
    elem.parentNode.removeChild ( elem );

}

function disableForm ( formID,disable )  {

  if (!document.getElementById(formID))
    return;

  if (disable)  {
    $('#'+formID).find(':input:not(:disabled)').prop('disabled',true);
  } else  {
    $('#'+formID).find(':input:disabled').prop('disabled',false);
  }

}

function disableElement ( elemId,disable )  {
var elem = document.getElementById ( elemId );
  if (elem)
    elem.disabled = disable;
}


function setValue ( elemId,attrName,value )  {
var elem = document.getElementById ( elemId );
  if (elem)
    elem.setAttribute ( attrName,value );
}

function getNColumns ( tableId ) {
var cols  = $("#"+tableId).find("tr:first td");
var count = 0;
  for (var i=0;i<cols.length;i++)  {
    var colspan = cols.eq(i).attr("colspan");
    if (colspan && colspan > 1) {
     count += colspan;
    } else
     count++;
  }
  return count;
}

function endsWith ( str,suffix ) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

var TRange=null

function findString (str) {
// finds string in the document

  if (parseInt(navigator.appVersion)<4) return;

  var strFound;
  if (navigator.appName=="Netscape")  {

    // NAVIGATOR-SPECIFIC CODE

    strFound = self.find(str);
    if (!strFound) {
      strFound=self.find(str,0,1)
      while (self.find(str,0,1)) continue
    }
  }

  if (navigator.appName.indexOf("Microsoft")!=-1) {

    // EXPLORER-SPECIFIC CODE

    if (TRange!=null) {
      TRange.collapse(false)
      strFound=TRange.findText(str)
      if (strFound) TRange.select()
    }
    if (TRange==null || strFound==0) {
     TRange   = self.document.body.createTextRange()
     strFound = TRange.findText(str)
     if (strFound) TRange.select()
    }

  }

  if (!strFound) alert ("String '"+str+"' not found!")

}

/*
function downloadUri ( uri )  {
var hiddenIFrameID = 'hiddenDownloader';
var iframe = document.getElementById(hiddenIFrameID);
  if (!iframe)  {
    iframe    = document.createElement('iframe');
    iframe.id = hiddenIFrameID;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
  iframe.src = uri;
}
*/

function downloadUri ( uri )  {
var hiddenALinkID = 'hiddenDownloader';
var alink = document.getElementById(hiddenALinkID);
  if (!alink)  {
    alink    = document.createElement('a');
    alink.id = hiddenALinkID;
    alink.style.display = 'none';
    alink.type          = 'application/octet-stream';
    document.body.appendChild(alink);
  }
  alink.download = uri.split('/').pop();
  alink.href     = uri;
  alink.click();
}
