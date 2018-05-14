//
//  ===========================================================================
//
//    24.04.18   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  ---------------------------------------------------------------------------
//
//  **** Module  :  jsrview.base.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  Report base class
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2018
//
//  ===========================================================================
//


$(function() {
  $( document ).tooltip();
});


//  ===========================================================================
//  REPORT BASE CONSTRUCTOR
//  ===========================================================================

function RVAPIReportBase ( sceneId )  {

  this.winref = null;  // used only for popups, probably obsolete
  this.TRange = null;  // used only in findString, probably obsolete

  this.mainToolBarId  = sceneId + "_mainToolBar";
  this.mainTabBarId   = sceneId + "_mainTabBar";
  this.pageTopId      = sceneId + "_pageTop";
  this.pageHeaderId   = sceneId + "_pageHeader";
  this.pageFooterId   = sceneId + "_pageFooter";
  this.helpTabId      = sceneId + "_helpTab";
  this._helpInTab     = false;
  this.noTabGridId    = "body";

  this.printBtnId     = sceneId + "_printBtn";
  this.sep1BtnId      = sceneId + "_sep1Btn";
  this.refreshBtnId   = sceneId + "_refreshBtn";
  this.sep2BtnId      = sceneId + "_sep2Btn";
  this.helpPgmBtnId   = sceneId + "_helpPgmBtn";
  this.helpCCP4BtnId  = sceneId + "_helpCCP4Btn";
  this.sep3BtnId      = sceneId + "_sep3Btn";
  this.goBackBtnId    = sceneId + "_goBackBtn";
  this.goForwardBtnId = sceneId + "_goForwardBtn";
  this.findBtnId      = sceneId + "_findBtn";
  this.sep4BtnId      = sceneId + "_sep4Btn";
  this.progressBarId  = sceneId + "_progressBar";
  this.configureBtnId = sceneId + "_configureBtn";
  this.exitBtnId      = sceneId + "_exitBtn";

  this.watchedContent = [];

  this.docURI         = "";
  this.helpBtnName    = "Help";
  //var programDocFile = "refmac5.html";
  this.programDocFile = "INDEX.html";
  //var ccp4DocFile    = "INDEX.html"

  // HTML element to hold all document set in InitPage
  this._document_body = document.getElementById ( sceneId );

}


RVAPIReportBase.prototype.processFile = function ( uri,method,asynchronous,
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


RVAPIReportBase.prototype.element = function ( type,attr,attrval,text )  {
var elem = document.createElement ( type );
  if (attr.length>0)
    elem.setAttribute ( attr,attrval );
  if (text.length>0)
    elem.appendChild  ( document.createTextNode(text) );
  return elem;
}

RVAPIReportBase.prototype.removeElement = function ( elemId )  {
var elem = document.getElementById ( elemId );
  if (elem)
    elem.parentNode.removeChild ( elem );
}

RVAPIReportBase.prototype.disableForm = function ( formID,disable )  {

  if (!document.getElementById(formID))
    return;

  if (disable)  {
    $('#'+formID).find(':input:not(:disabled)').prop('disabled',true);
  } else  {
    $('#'+formID).find(':input:disabled').prop('disabled',false);
  }

}

RVAPIReportBase.prototype.disableElement = function ( elemId,disable )  {
var elem = document.getElementById ( elemId );
  if (elem)
    elem.disabled = disable;
}


RVAPIReportBase.prototype.setValue = function ( elemId,attrName,value )  {
var elem = document.getElementById ( elemId );
  if (elem)
    elem.setAttribute ( attrName,value );
}

RVAPIReportBase.prototype.getNColumns = function ( tableId ) {
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

RVAPIReportBase.prototype.endsWith = function ( str,suffix ) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

RVAPIReportBase.prototype.findString = function (str) {
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

    if (this.TRange!=null) {
      this.TRange.collapse(false)
      strFound=this.TRange.findText(str)
      if (strFound) this.TRange.select()
    }
    if (this.TRange==null || strFound==0) {
     this.TRange = self.document.body.createTextRange()
     strFound    = this.TRange.findText(str)
     if (strFound) this.TRange.select()
    }

  }

  if (!strFound) alert ("String '"+str+"' not found!")

}


RVAPIReportBase.prototype.downloadUri = function ( uri )  {
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


RVAPIReportBase.prototype.popupWindow = function ( uri )  {
  this.winref = window.open ( uri,"",toolbar=0,directories=0,status=0,menubar=0,resizable=1 );
}

RVAPIReportBase.prototype.close_window = function()  {
  if (window.rvGate)   // running in jsrview browser
    window.rvGate.closeWindow();
  else  {  // running in a normal browser
    // working trick, without which window.close() does not work
    // when invoked after multiple reloads
    window.open('', '_self', '');
    window.close();
  }
  return false;
}

RVAPIReportBase.prototype.print_window = function()  {
  if (window.rvGate)  window.rvGate.printWindow();
                else  window.print();
}

RVAPIReportBase.prototype.pref_dialog = function()  {
  if (window.rvGate)
    window.rvGate.prefDialog();
}


RVAPIReportBase.prototype.setWaitDialog = function ( title,message,delay )  {
  this._waitDialogTitle     = title;
  this._waitDialogMessage   = message;
  this._waitDialogCountdown = delay;
}


RVAPIReportBase.prototype.setHtml = function ( cntId,htmlString )  {
  $("#"+cntId).html ( htmlString );
}


RVAPIReportBase.prototype.addHtml = function ( cntId,htmlString )  {
  $("#"+cntId).html ( $("#"+cntId).html() + htmlString );
}


RVAPIReportBase.prototype.loadFrame = function ( cntId,uri )  {
var frame = document.getElementById ( cntId+"-frame" );
  if (!frame)
    $("<iframe id=\""+cntId+"-frame\" class=\"frame-seamless\" " +
      "src=\"" + uri + "\" />").appendTo($("#"+cntId));
  else
    frame.src = uri;
}


RVAPIReportBase.prototype.escapeRegExp = function ( str )  {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

RVAPIReportBase.prototype.replaceAll = function ( str,find,rep )  {
  return str.replace(new RegExp(this.escapeRegExp(find),'g'),rep);
}
