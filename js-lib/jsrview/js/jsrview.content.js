//
//  =================================================================
//
//    06.04.24   <--  Date of Last Modification.
//                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//  -----------------------------------------------------------------
//
//  **** Module  :  jsrview.content.js  <interface>
//       ~~~~~~~~~
//  **** Project :  HTML5-based presentation system
//       ~~~~~~~~~
//  **** Content :  RVAPI javascript layer's html content module
//       ~~~~~~~~~
//
//  (C) E. Krissinel 2013-2024
//
//  =================================================================
//

'use strict';

function loadContent ( cntId,uri,watch,taskUri )  {

  if (watch)  {
    let watched = false;
    for (let i=0;(i<watchedContent.length) && (!watched);i++)
      watched = watchedContent[i][0]==cntId;
    if (!watched)  {
      let holder = document.getElementById ( cntId );
      if (holder!=null)
        watchedContent.push ( [cntId,uri] );
    }
    if (__stop_poll)
      updateWatchedContent ( true );
  } else if (taskUri.length>0)  {
    processFile ( uri,"post",true,
      function(data)  {
        $("#"+cntId).html ( data );
        processFile ( taskUri,"post",true,
          function(tdata)  {
            let cmdNo = 0;
            processCommands ( tdata,cmdNo );
          },
          function(){},
          function(){}
        );
      },
      function(){},
      function(){}
    );

  } else  {

    processFile ( uri,"post",true,
      function(data)  {
        $("#"+cntId).html ( data );
      },
      function(){},
      function(){}
    );

  }

}


function loadContentTablesort ( uri,paging,tableId,holderId )  {

    processFile ( uri,"post",true,
      function(data)  {
        $("#"+holderId).html ( data );
        $("#"+tableId).tablesorter({
           theme: 'blue', widgets: ['zebra']
        });
      },
      function(){},
      function(){}
    );

}

/*   -- old version with possible memory leaks
function updateWatchedContent()  {

  for (let i=0;i<watchedContent.length;i++)  {
    (function(hId,uri) {
      processFile ( uri,"post",true,function(data){
          let preId = hId + "-pre";
          removeElement ( preId );
          let pre = element ( "pre","id",preId,"" );
          pre.setAttribute ( "class","display-text" );
          document.getElementById ( hId ).appendChild ( pre );
          pre.appendChild ( document.createTextNode(data) );
        },
        function() {},
        function() {
    //        alert ( "Data transmission error in updateWatchedContent" );
        });
    }(watchedContent[i][0],watchedContent[i][1]));
  }

}
*/

function updateWatchedContent ( updateHidden_bool )  {

//$(this.element).is(':visible');

  for (let i=0;i<watchedContent.length;i++)  {
    (function(hId,uri) {
      if (updateHidden_bool || $('#'+hId).is(':visible'))
        processFile ( uri,"post",true,function(data){

          let n = 0;
          if (data.lastIndexOf('[[[[]]]]',0) === 0)  {  // for old JS engines (jsrview)
//          if (data.startsWith('[[[[]]]]'))  {  // for modern JS engines
            // Capped file (e.g. a long log file); put a message and a
            // download button on the top of the page
            let divId = hId + '-div';
            let div   = document.getElementById ( divId );
            if (!div)  {
              div = element ( 'div','id',divId,'' );
              let holder = document.getElementById ( hId );
              if (holder)
                holder.appendChild ( div );
              $( '<div class="cap-div"><b><i>File is too large and shown ' +
                 'without middle part.</i></b><br>Click <a href="' +
                 uri.substring(0,uri.indexOf('?capsize')) +
                 '"><i>here</i></a> to download full version to your device.</div>' )
                .appendTo ( $(div) );
            }
            n = 8;
          }

          let preId = hId + "-pre";
          let pre = document.getElementById ( preId );
          if (!pre)  {
            pre = element ( "pre","id",preId,"" );
            let holder = document.getElementById ( hId );
            if (holder)
              holder.appendChild ( pre );
          } else {
            while (pre.hasChildNodes())
              pre.removeChild ( pre.lastChild );
          }
          if (n)  pre.appendChild ( document.createTextNode(data.substr(n)) );
            else  pre.appendChild ( document.createTextNode(data) );
          pre.setAttribute ( "class","display-text" );
          pre.style.fontSize = '15px';
          //pre.classList.add ( "display-text" );

        },
        function() {},
        function() {
          // alert ( "Data transmission error in updateWatchedContent" );
        });
    }(watchedContent[i][0],watchedContent[i][1]));
  }

}


function setHtml ( cntId,htmlString )  {
  $("#"+cntId).html ( htmlString );
}


function addHtml ( cntId,htmlString )  {
  $("#"+cntId).html ( $("#"+cntId).html() + htmlString );
}


function loadFrame ( cntId,uri )  {
let frame = document.getElementById ( cntId+"-frame" );
  if (!frame)
    $("<iframe id=\""+cntId+"-frame\" class=\"frame-seamless\" " +
      "src=\"" + uri + "\" />").appendTo($("#"+cntId));
  else
    frame.src = uri;
}
