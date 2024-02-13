//
//  ==========================================================================
//
//    13.02.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  --------------------------------------------------------------------------
//
//  **** Module  :  jsrview.viewer.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's window module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  ==========================================================================
//

var _jsrview_uri = "";
//var __base_url = 'xxJsCoFExx/' + __login_token + '/rnase/1/';

var __rvapi_local_service = is_rvapi_local_service();

function is_rvapi_local_service()  {
  if (('ls_RVAPIAppButtonClicked' in window.parent) &&
      (window.location.search=='?local_service'))  return 1;
  return 0;
  /*
  var found = 0;
  try {
    if ('__rvapi_local_service' in window.parent)
      found = 1;
  } catch(e)  {
    // this corresponds to the very special case, when rvapi is runnning as
    // a part of local service in CCP4 Cloud, but experiences a cross-origin
    // mismatch with the outer window/frame
    found = 2;
  }
  return found;
  */
}


// ===========================================================================
//  Structure Viewer:  XYZ and Map
// ===========================================================================

/*
function makeUglyMolHtml ( xyz_uri,mtz_uri,map_uri,diffmap_uri )  {
var html =
    '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<base target="_parent">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <meta name="viewport" content="width=device-width, user-scalable=no">\n' +
    '  <meta name="theme-color" content="#333333">\n' +
    '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'uglymol/uglymol.css"/>\n' +
    '  <script src="' + _jsrview_uri + 'uglymol/uglymol.js"><\/script>\n' +
    '</head>\n' +
    '<body style="overflow:hidden;">\n' +
    '  <div id="viewer" style="position:absolute; left:0px; top:0px; ' +
                              'overflow:hidden;"></div>\n' +
    '  <header id="hud" onmousedown="event.stopPropagation();"\n' +
    '                   onmousemove="event.stopPropagation();"\n' +
    '                   ondblclick="event.stopPropagation();">\n' +
    '             This is uglymol not coot.\n' +
    '           <a href="#" onclick="V.toggle_help(); return false;">\n' +
    '             H shows help.\n' +
    '           </a>\n' +
    '  </header>\n' +
    '  <footer id="help"></footer>\n' +
    '  <div id="inset"></div>\n' +
    '  <script>\n' +
    '    V = new UM.Viewer({viewer:"viewer",hud:"hud",help:"help"});\n';

  if (xyz_uri.length>0)
    html += '    V.load_pdb("' + xyz_uri + '");\n';

//alert ( "xyz_uri='" + xyz_uri + "'\n map_uri='"+ map_uri + "'\n diffmap_uri='" + diffmap_uri + "'" );

  var wasm = '';
  if ((map_uri.length>0) && (diffmap_uri.length>0))
    html += '    V.load_ccp4_maps("' + map_uri + '","' + diffmap_uri + '");\n';
  else if (map_uri.length>0)
    html += '    V.load_map("' + map_uri + '",{diff_map: false, format: "ccp4"});\n';
  else if (diffmap_uri.length>0)
    html += '    V.load_map("' + diffmap_uri + '",{diff_map: true, format: "ccp4"});\n';
  else if (mtz_uri.length>0)  {
    html += '    var Module = {\n' +
            '      onRuntimeInitialized: function() {\n' +
            '        UM.load_maps_from_mtz(V, "' + mtz_uri + '");\n' +
            '      }\n' +
            '    };\n';
    wasm  = '  <script src="' + _jsrview_uri + 'uglymol/mtzmap.js"><\/script>\n';
  }

  html += '  </script>\n' + wasm +
          '</body>\n' +
          '</html>\n';

//  alert ( " html=" + html );
//console.log ( ' html=' + html );

  return html;

}
*/


function makeUglyMolHtml ( xyz_uri,mtz_uri,map_uri,diffmap_uri,mapLabels )  {
let html =
    '<!doctype html>\n' +
    '<html lang="en">\n' +
    '<base target="_parent">\n' +
    '<head>\n' +
    '  <meta charset="utf-8">\n' +
    '  <meta name="viewport" content="width=device-width, user-scalable=no">\n' +
    // '  <meta name="theme-color" content="#333333">\n' +
    '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'uglymol/uglymol.css"/>\n' +
    '  <script src="' + _jsrview_uri + 'uglymol/uglymol.js"><\/script>\n' +
    '  <script src="' + _jsrview_uri + 'uglymol/mtz.js"><\/script>\n' +
    '</head>\n' +
    '<body class="uglymol-page">\n' +
    '  <div id="viewer"></div>\n' +
    '  <header id="hud" onmousedown="event.stopPropagation();"\n' +
    '                   onmousemove="event.stopPropagation();"\n' +
    '                   ondblclick="event.stopPropagation();">\n' +
    '             This is uglymol not coot.\n' +
    '           <a href="#" onclick="V.toggle_help(); return false;">\n' +
    '             H shows help.\n' +
    '           </a>\n' +
    '  </header>\n' +
    '  <footer id="help"></footer>\n' +
    '  <div id="inset"></div>\n' +
    '  <script>\n' +
    '    let V = new UM.Viewer({viewer:"viewer",hud:"hud",help:"help"});\n';
    // '    let drawMolecule = function(){\n';

  if (xyz_uri.length>0)
    html += '    V.load_pdb("' + xyz_uri + '");\n';

//alert ( "xyz_uri='" + xyz_uri + "'\n map_uri='"+ map_uri + "'\n diffmap_uri='" + diffmap_uri + "'" );

  if ((map_uri.length>0) && (diffmap_uri.length>0))
    html += '    V.load_ccp4_maps("' + map_uri + '","' + diffmap_uri + '");\n';
  else if (map_uri.length>0)
    html += '    V.load_map("' + map_uri + '",{diff_map: false, format: "ccp4"});\n';
  else if (diffmap_uri.length>0)
    html += '    V.load_map("' + diffmap_uri + '",{diff_map: true, format: "ccp4"});\n';
  else if (mtz_uri.length>0)  {
    let mlline = '"';
    if (mapLabels)  {
      let mllist = mapLabels.split(',');
      mlline = '", [';
      for (let i=0;i<mllist.length;i++)
        mlline += '"' + mllist[i] + '",';
      mlline = mlline.slice(0,-1) + ']';
    }
    html += '    GemmiMtz().then(function(Module) {\n' +
            '      UM.load_maps_from_mtz ( Module, V, "' + mtz_uri + mlline + ' );\n' +
            '    });\n';
  }

  // html += '  };\n' +
  //         // 'drawMolecule();\n' +
  //         'let iterateDraw = function(){ drawMolecule(); window.setTimeout(iterateDraw,3000) };\n' +
  //         'iterateDraw();\n' +

  if (('__active_color_mode' in window.parent) && (window.parent.__active_color_mode=='dark'))
    html += '  let scene = document.getElementById("viewer");\n' +
            '  scene.style.setProperty("filter","invert(1.0)");\n';
  html += '</script>\n' +
          '</body>\n' +
          '</html>\n';

//  alert ( " html=" + html );
//console.log ( ' html=' + html );

  return html;

}


function calcViewerSize ( widthF,heightF )  {
  //var jq = window.parent.$;
  //var w  = jq(window.parent).width () - 40;
  //var h  = jq(window.parent).height() - 64;

  var w0 = window.parent.innerWidth;
  var h0 = window.parent.innerHeight;
  var w  = w0 - 40;
  var h  = h0 - 56;

  if (!window.parent.__any_mobile_device)  {
    h -= 8;
    if ((typeof window.parent.__touch_device === 'undefined') ||
        (!window.parent.__touch_device))  {
      if (widthF>0.0)  w = widthF*Math.min(w0,h);
      if (heightF>0.0) h = heightF*Math.min(w0,h);
    }
  }

  return [w,h];

}


function _start_viewer ( title,html_str )  {

  //console.log ( 'xyz_uri=' + xyz_uri );
  //console.log ( 'map_uri=' + map_uri );
  //console.log ( 'diffmap_uri=' + diffmap_uri );

  if (is_rvapi_local_service()==2)  {
    new MessageBox ( 'Operation cannot be performed',
                     'Structure visualisation cannot be started<br>at this moment',
                     'msg_stop' );
    return;
  }

  var doc = window.parent.document;
  var jq  = window.parent.$;

  if (!jq)  {
    doc = window.document;
    jq  = window.$;
  }

  var dialog = doc.createElement ( 'div' );
  jq(dialog).css({
    'box-shadow' : '8px 8px 16px 16px rgba(0,0,0,0.2)',
    'overflow'   : 'hidden'
  });
  doc.body.appendChild ( dialog );

  var iframe = doc.createElement ( 'iframe' );
  jq(iframe).css({
    'border'   : 'none',
    'overflow' : 'hidden'
  });

  var size;
  if (window.parent.__any_mobile_device)
        size = calcViewerSize ( 1.0,1.0    );
  else if (window.parent.__user_settings && window.parent.__user_settings.viewers_size)
        size = calcViewerSize ( window.parent.__user_settings.viewers_size[0],
                                window.parent.__user_settings.viewers_size[1] );
  else  size = calcViewerSize ( 1.25,0.85 );

  jq(iframe).width  ( size[0] );
  jq(iframe).height ( size[1] );
  dialog.appendChild ( iframe );
  //dialog.style.fontSize = '16px';

  var dialog_options = {
    resizable  : true,
    height     : 'auto',
    width      : 'auto',
    modal      : false,
    title      : title,
    effect     : 'fade',
    headerVisible: false,
    create     : function() { iframe.contentWindow.focus(); },
    focus      : function() { iframe.contentWindow.focus(); },
    open       : function() { iframe.contentWindow.focus(); },
    dragStop   : function() { iframe.contentWindow.focus(); },
    resizeStop : function() { iframe.contentWindow.focus(); },
    buttons: {}
  };

  if (window.parent.__any_mobile_device)  {
    dialog_options.position  =  { my : 'left top',   // job dialog position reference
                                  at : 'left top' }; // job dialog offset in the screen
    dialog_options.resizable = false;
    //dialog_options.height     : 'auto',
    //dialog_options.width      : 'auto',
    dialog_options.modal     = true;
  }

  var resize_func = function()  {
    var w = jq(dialog).width ();
    var h = jq(dialog).height();
    jq(iframe).width  ( w );
    jq(iframe).height ( h );
  }

  var dlg = jq(dialog).dialog ( dialog_options );

  if ('extendToolbar_rvapi' in window)  {
    extendToolbar_rvapi ( dlg,{
      "maximize" : function(evt,d){ resize_func(); },
      // "minimize" : function(evt, dlg){ resize_func(); },
      "restore"  : function(evt,d){ resize_func(); }
    });
  } else  {
    extendToolbar ( {element:dialog},{
      "maximize" : function(evt,d){ resize_func(); },
      // "minimize" : function(evt, dlg){ resize_func(); },
      "restore"  : function(evt,d){ resize_func(); }
    });
  }

  //if (window.parent.__mobile_device)
  //  dlg.siblings('.ui-dialog-titlebar').remove();

  // var html = makeUglyMolHtml ( encode_uri(xyz_uri),encode_uri(mtz_uri),
  //                              encode_uri(map_uri),encode_uri(diffmap_uri),
  //                              mapLabels );
  // let iframeDocument = iframe.contentWindow.document || iframe.contentDocument;
  // iframeDocument.write(html);
  // iframeDocument.close();
  iframe.contentWindow.document.write(html_str);
  iframe.contentWindow.document.close();

  jq(dialog).on ( 'dialogresize', function(event,ui){
    resize_func();
    // var w = jq(dialog).width ();
    // var h = jq(dialog).height();
    // jq(iframe).width  ( w );
    // jq(iframe).height ( h );
  });

  jq(dialog).on( "dialogclose",function(event,ui){
    window.setTimeout ( function(){
      jq(dialog).dialog( "destroy" );
      if (dialog.parentNode)
        dialog.parentNode.removeChild ( dialog );
    },10 );
  });

  jq(dialog).click ( function() {
    iframe.contentWindow.focus();
  });

}

function startUglyMol ( title,xyz_uri,mtz_uri,map_uri,diffmap_uri,mapLabels )  {
  function encode_uri ( uri )  {
    if (uri)  return encodeURI ( uri );
    return uri;
  }
  _start_viewer ( title,
      makeUglyMolHtml ( encode_uri(xyz_uri),encode_uri(mtz_uri),
                        encode_uri(map_uri),encode_uri(diffmap_uri),
                        mapLabels )
  );
}


function _startUglyMol ( data,mapLabels )  {
//  data is a string made of title and 3 file uri:
//  title>>>xyz_uri*map_uri*diffmap_uri

  var base_url = window.location.pathname.substring ( 0,
                                  window.location.pathname.lastIndexOf('/')+1 );

  function _make_path ( path )  {
    //console.log ( 'base_url=' + base_url );
    //console.log ( 'path=' + path );
    if (path.length<=0)             return '';
    if (path.endsWith('/'))         return '';
    if (path.startsWith(base_url))  return path;
    return normalize_path ( base_url+path );
  }

  var title     = '';
  var xyz_path  = '';
  var mtz_path  = '';
  var map_path  = '';
  var dmap_path = '';

  var tlist = data.split('>>>');
  var dlist = [];
  if (tlist.length<=1)  {
    dlist = data.split('*');
    if (dlist.length>0)  {
      // take structure file basename as title
      title = dlist[0].split(/[\\/]/).pop();
    } else {
      title = "No title";
    }
  } else  {
    title = tlist[0];
    dlist = tlist[1].split('*');
  }

//console.log ( 'dlist=' + JSON.stringify(dlist) );

  //if (dlist.length>0)  {
  //  xyz_path = _make_path ( base_url+dlist[0] );
  //  if (dlist.length>1)
  //    mtz_path = _make_path ( base_url+dlist[1] );
  //}

  if (dlist.length>0)  {
    xyz_path = _make_path ( base_url+dlist[0] );
    if (dlist.length>1)  {
      map_path = _make_path ( base_url+dlist[1] );
      if (map_path.toLowerCase().endsWith('.mtz'))  {
        mtz_path = map_path;
        map_path = '';
        if (dlist.length>2)  {
          map_path = _make_path ( base_url+dlist[2] );
          if (dlist.length>3)
            dmap_path = _make_path ( base_url+dlist[3] );
        }
      } else if (dlist.length>2)
        dmap_path = _make_path ( base_url+dlist[2] );
    }
  }

//  if (map_path.toLowerCase().endsWith('.mtz'))  {
//    mtz_path = map_path;
//    map_path = '';
//  }

//console.log ( 'xyzpath='  + xyz_path );
//console.log ( 'mtzpath='  + mtz_path );
//console.log ( 'mappath='  + map_path );
//console.log ( 'dmappath=' + dmap_path );

  startUglyMol ( title,xyz_path,mtz_path,map_path,dmap_path,mapLabels );

}


// ===========================================================================
//  HKL Viewer (ViewHKL)
// ===========================================================================


function makeViewHKLHtml ( title,mtz_uri )  {
var html   =
    '<!DOCTYPE html>\n' +
    '<html>\n' +
    '  <head>\n' +
    '    <meta http-equiv="content-type" content="text/html; charset=UTF-8">\n' +
    '    <meta charset="utf-8">\n' +
    '    <meta name="viewport" content="width=device-width, user-scalable=no">\n' +
    '    <meta name="theme-color" content="#333333">\n' +
    '    <meta http-equiv="pragma"  content="no-cache">\n' +
    '    <meta http-equiv="expires" content="0">\n' +
    '    <title>ViewHKL ' + title + '</title>\n' +
    '  </head>\n' +
    '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'jquery-ui/css/jquery-ui.css"/>\n' +
    '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'viewhkl/css/gui/gui.widgets.css"/>\n' +
    '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'viewhkl/css/gui/gui.tables.css"/>\n' +
    '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'viewhkl/css/gui/gui.tabs.css"/>\n' +
    '  <script src="' + _jsrview_uri + 'jquery-ui/js/jquery.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'jquery-ui/js/jquery-ui.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/gui/gui.widgets.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/gui/gui.tables.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/gui/gui.tabs.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/gui/gui.menu.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/gui/gui.canvas.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/mtz.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/viewhkl.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/viewhkl_tab1.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/viewhkl_tab2.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/viewhkl_tab3.js"></script>\n' +
    '  <script src="' + _jsrview_uri + 'viewhkl/viewhkl_tab4.js"></script>\n' +
    '<body style="font-size:16px;">\n' +
    '  <div id="scene"></div>\n' +
    '   <script>\n' +
    '      $(document).ready(function()  {\n' +
    '          $(function() {\n' +
    '            $( document ).tooltip();\n' +
    '          });\n' +
    '          var viewhkl = new ViewHKL ( "scene",true );\n' +
    '          viewhkl.Load ( "' + mtz_uri + '" );\n' +
    '        });\n' +
    '      </script>\n' +
    '</body>\n' +
    '</html>';

  return html;

}


/*
function startViewHKL ( title,mtz_uri,window_instance )  {

  // take structure file basename as title
  var dlg_title = title;
  if (!dlg_title)
    dlg_title = mtz_uri.split(/[\\/]/).pop();

  //var doc = window.parent.document;
  //var jq  = window.parent.$;
  //var doc = window_instance.document;
  //var jq  = window_instance.$;

  var doc = window.parent.document;
  var jq  = window.parent.$;

  if (!jq)  {
    doc = window.document;
    jq  = window.$;
  }

  var dialog = doc.createElement ( 'div' );
  $(dialog).css({
    'box-shadow' : '8px 8px 16px 16px rgba(0,0,0,0.2)',
    'overflow'   : 'hidden'
  });
  doc.body.appendChild ( dialog );
  //doc.body.style.fontSize = '16px';

  var iframe = doc.createElement ( 'iframe' );
  jq(iframe).css ({
    'border'   : 'none',
    'overflow' : 'hidden'
  });

  var size;
  if (window.parent.__any_mobile_device)
        size = calcViewerSize ( 1.0,1.0    );
  else if (window.parent.__user_settings && window.parent.__user_settings.viewers_size)
        size = calcViewerSize ( window.parent.__user_settings.viewers_size[0],
                                window.parent.__user_settings.viewers_size[1] );
  else  size = calcViewerSize ( 1.25,0.85 );

  jq(iframe).width  ( size[0] );
  jq(iframe).height ( size[1] );
  dialog.appendChild ( iframe );
  //dialog.style.fontSize = '16px';

  jq(dialog).dialog({
      resizable  : true,
      height     : 'auto',
      width      : 'auto',
      modal      : false,
      title      : 'ViewHKL [' + dlg_title + ']',
      effect     : 'fade',
      create     : function() { iframe.contentWindow.focus(); },
      focus      : function() { iframe.contentWindow.focus(); },
      open       : function() { iframe.contentWindow.focus(); },
      dragStop   : function() { iframe.contentWindow.focus(); },
      resizeStop : function() { iframe.contentWindow.focus(); },
      buttons: {}
  });

  var html = makeViewHKLHtml ( dlg_title,mtz_uri );
  iframe.contentWindow.document.write(html);
  iframe.contentWindow.document.close();

  jq(dialog).on ( 'dialogresize', function(event,ui){
    var w = jq(dialog).width ();
    var h = jq(dialog).height();
    jq(iframe).width  ( w );
    jq(iframe).height ( h );
  });

  jq(dialog).on( "dialogclose",function(event,ui){
    window.setTimeout ( function(){
      jq(dialog).dialog( "destroy" );
      if (dialog.parentNode)
        dialog.parentNode.removeChild ( dialog );
    },10 );
  });

  jq(dialog).click ( function() {
    iframe.contentWindow.focus();
  });

}
*/

function startViewHKL ( title,mtz_uri,window_instance )  {
  // take structure file basename as title
  var dlg_title = title;
  if (!dlg_title)
    dlg_title = mtz_uri.split(/[\\/]/).pop();
  _start_viewer ( title,makeViewHKLHtml(dlg_title,mtz_uri) );
}


// ===========================================================================
//  Reciprocal Space Viewer
// ===========================================================================


function makeRSViewerHtml ( json_uri,map_uri )  {
var html   =
  '<!doctype html>\n' +
  '<html lang="en">\n' +
  '<head>\n' +
  '  <meta charset="utf-8">\n' +
  '  <meta name="viewport" content="width=device-width, user-scalable=no">\n' +
  '  <meta name="theme-color" content="#333333">\n' +
  '  <link rel="stylesheet" type="text/css" href="' + _jsrview_uri + 'uglymol/uglymol.css"/>\n' +
  '  <script src="' + _jsrview_uri + 'uglymol/uglymol.js"><\/script>\n' +
  '</head>\n' +
  '<body style="background-color:black;font-size:16px;">\n' +
  '  <div id="viewer"></div>\n' +
  '  <header id="hud" onmousedown="event.stopPropagation();"\n' +
  '                   ondblclick="event.stopPropagation();"\n' +
  '             >This is reciprocal UM. <a href="#"\n' +
  '                         onclick="V.toggle_help(); return false;"\n' +
  '                         >H shows help.</a></header>\n' +
  '  <footer id="help"></footer>\n' +
  '  <div id="inset"></div>\n' +
  '  <script>\n' +
  '    V = new UM.ReciprocalViewer({viewer: "viewer", hud: "hud", help: "help"});\n' +
  '    V.load_data ( "' + json_uri + '",{\n' +
  '      callback : function(){\n' +
  '        var oReq = new XMLHttpRequest();\n' +
  '        oReq.open ( "POST", "' + map_uri + '", true );\n' +
  '        oReq.responseType = "arraybuffer";\n' +
  '        oReq.timeout      = 9999999;\n' +
  '        oReq.onreadystatechange = function(oEvent) {\n' +
  '          if (oReq.readyState === 4) {\n' +
  '            // chrome --allow-file-access-from-files gives status 0\n' +
  '            if (oReq.status === 200 || (oReq.status   === 0 &&\n' +
  '                                        oReq.response !== null &&\n' +
  '                                        oReq.response !== "")) {\n' +
  '              try {\n' +
  '                var arrayBuffer = oReq.response;\n' +
  '                if (arrayBuffer) {\n' +
  '                  V.load_map_from_ab ( arrayBuffer )\n' +
  '                } else {\n' +
  '                  alert ( "null buffer received as map file" );\n' +
  '                }\n' +
  '              } catch (e) {\n' +
  '                alert ( "Error: " + e.message + "\\nin ' + map_uri + '", "ERR");\n' +
  '              }\n' +
  '            } else {\n' +
  '              alert ( "Failed to fetch ' + map_uri + '", "ERR");\n' +
  '            }\n' +
  '          }\n' +
  '        }\n' +
  '        oReq.onerror = function()  {\n' +
  '          alert ( "errors at loading map file" );\n' +
  '        }\n' +
  '        oReq.send(null);\n' +
  '      }\n' +
  '    });\n' +
  '  </script>\n' +
  '</body>\n' +
  '</html>\n';

  return html;

}


function startRSViewer ( title,json_uri,map_uri )  {

  if (is_rvapi_local_service()==2)  {
    new MessageBox ( 'Operation cannot be performed',
                     'Reciprocal Space Viewer cannot be launched<br>at this moment' );
    return;
  }

  var doc = window.parent.document;
  var jq  = window.parent.$;

  var dialog = doc.createElement ( 'div' );
  jq(dialog).css({'box-shadow' : '8px 8px 16px 16px rgba(0,0,0,0.2)',
                  'overflow'   : 'hidden'
  });
  doc.body.appendChild ( dialog );
  //doc.body.style.fontSize = '16px';

  var iframe = doc.createElement ( 'iframe' );
  jq(iframe).css ( {'border'   : 'none',
                    'overflow' : 'hidden'
  });

  var size;
  if (window.parent.__any_mobile_device)
        size = calcViewerSize ( 1.0,1.0    );
  else if (window.parent.__user_settings && window.parent.__user_settings.viewers_size)
        size = calcViewerSize ( window.parent.__user_settings.viewers_size[0],
                                window.parent.__user_settings.viewers_size[1] );
  else  size = calcViewerSize ( 1.25,0.85 );

  jq(iframe).width  ( size[0] );
  jq(iframe).height ( size[1] );
  dialog.appendChild ( iframe );
  //dialog.style.fontSize = '16px';

  var resize_func = function()  {
    var w = jq(dialog).width ();
    var h = jq(dialog).height();
    jq(iframe).width  ( w );
    jq(iframe).height ( h );
  }

  var dlg = jq(dialog).dialog({
      resizable  : true,
      height     : 'auto',
      width      : 'auto',
      modal      : false,
      title      : title,
      effect     : 'fade',
      create     : function() { iframe.contentWindow.focus(); },
      focus      : function() { iframe.contentWindow.focus(); },
      open       : function() { iframe.contentWindow.focus(); },
      dragStop   : function() { iframe.contentWindow.focus(); },
      resizeStop : function() { iframe.contentWindow.focus(); },
      buttons: {}
  });

  extendToolbar ( {element:dialog},{
    "maximize" : function(evt,d){ resize_func(); },
    // "minimize" : function(evt, dlg){ resize_func(); },
    "restore"  : function(evt,d){ resize_func(); }
  });

  var html = makeRSViewerHtml ( json_uri,map_uri );
  iframe.contentWindow.document.write(html);
  iframe.contentWindow.document.close();

  jq(dialog).on ( 'dialogresize', function(event,ui){
    resize_func();
    // var w = jq(dialog).width ();
    // var h = jq(dialog).height();
    // jq(iframe).width  ( w );
    // jq(iframe).height ( h );
  });

  jq(dialog).on( "dialogclose",function(event,ui){
    window.setTimeout ( function(){
      jq(dialog).dialog( "destroy" );
      if (dialog.parentNode)
        dialog.parentNode.removeChild ( dialog );
    },10 );
  });

  jq(dialog).click ( function() {
    iframe.contentWindow.focus();
  });

}


// ===========================================================================
//  WebCoot Viewer
// ===========================================================================


function startWebCoot ( title,xyz_uri,mtz_uri,legend_uri,mode,update_interval,options )  {

  // options = {
  //   project      : 'project name',
  //   id           : 'task id',
  //   no_data_msg  : 'wait',
  //   FWT          : 'FWT, may be empty string',
  //   PHWT         : 'PHWT, must-be if FWT is not empty', 
  //   FP           : 'FP, must-be if FWT is not empty',
  //   SigFP        : 'SigFP, must-be if FWT is not empty',
  //   FreeR_flag   : 'FreeR_flag, must-be if FWT is not empty',
  //   DELFWT       : 'DELFWT, may be empty',
  //   PHDELWT      : 'PHDELWT, must-be if DELFWT is not empty'
  // }

  let inputFiles = [];

  if (xyz_uri)
    inputFiles.push ({
      type : 'pdb',
      args : [ xyz_uri,'molecule' ]
    });

  if (mtz_uri)  {
    if (options.FWT)
      inputFiles.push ({
        type : 'mtz',
        args : [ mtz_uri,'map',{
                  F              : options.FWT,
                  PHI            : options.PHWT,
                  Fobs           : options.FP,
                  SigFobs        : options.SigFP,
                  FreeR          : options.FreeR_flag,
                  isDifference   : false,
                  useWeight      : false,
                  calcStructFact : true
                }]
      });
    if (options.DELFWT)
      inputFiles.push ({
        type : 'mtz',
        args : [ mtz_uri,'diff-map',{
                  F              : options.DELFWT,
                  PHI            : options.PHDELWT,
                  isDifference   : true,
                  useWeight      : false,
                  calcStructFact : false
                }]
      });
  }

  // else  alert ( 'no mtz' );

  if (legend_uri)
    inputFiles.push ({
      type : 'legend',
      args : [ legend_uri ]
    });

  // alert ( JSON.stringify(inputFiles) );


  let no_data_msg = '';
  if (options.no_data_msg)
    no_data_msg = options.no_data_msg;

  let params = {
    mode         : mode,
    inputFiles   : inputFiles,
    interval     : update_interval,
    no_data_msg  : no_data_msg,
    preferences  : __user_settings.webcoot_pref,
    viewSettings : null,
    sf_meta      : { project : options.project,
                     id      : options.id
                   },
    wdirURL      : ''
  };


  fetchFile ( 'js-lib/webCoot/webcoot.html',
    function(text){
      _start_viewer ( 
        title,
        // text.replace ( '[[baseurl]]',
        //                window.location + 'js-lib/webCoot/webcoot.html' )
        text.replaceAll ( '[[prefix]]','js-lib/webCoot' )
            .replace    ( '</body>',
                          '  <script type="text/javascript"  defer="defer">\n' + 
                          '   runWebCoot ( ' + JSON.stringify(params) + ' );\n' +
                          '  </script>\n' +
                          '</body>'
                        )
       );
    },
    null,
    function(errcode){
      new MessageBox ( 'File not found',
          'WebCoot launch file not found (1)','msg_error' );
    });

}
