
function makeHeader ( links )  {

  document.write (
    "<div style='position:fixed;top:0;left:0;width:99%;height:50px;background:white'>" +
    "<div class='navbar'><table style='width:100%;'><tr><td style='width:60%;'>&nbsp;&nbsp;" +
    "<img src='./images/help.png' style='width:24px;height:24px;vertical-align:middle;'/>" +
    "&nbsp;&nbsp;"
  );

  for (var i=0;i<links.length;i++)  {
    if (i>0)
      document.write ( "<font size='+1' color='red'>&nbsp;&bull;&nbsp;</font>" );
    if (links[i][1].length>0)
          document.write ( "<a href='" + links[i][1] + "' style='vertical-align:middle;'>" + links[i][0] + "</a>" );
    else  document.write ( links[i][0] );
  }

  document.write ( "</td><td style='width:20%;'>&nbsp;</td>" );
  document.write ( "<td style='text-align:right;width:20%;'>" +
      "<a href='javascript:history.back();'>" +
      "<img src='./images/back.png' style='height:24px;vertical-align:middle;'/></a>" +
      "<a href='javascript:history.forward();'>" +
      "<img src='./images/forward.png' style='height:24px;vertical-align:middle;'/></a>" +
      "&nbsp;&nbsp;&nbsp;</td></tr></table>" );

  document.write ( "</div></div><div style='width:100%;height:40px;'>&nbsp;</div>" );

}


function makeTitle ( icon_uri,title,purpose )  {
  document.write (
    '<table><tr>' +
      '<td><img src="../images/' + icon_uri + '" width="80px" height="80px"/></td>' +
      '<td>&nbsp;&nbsp;</td>' +
      '<td><h2><i>' + title + '</i></h2></td>' +
    '</tr><tr>' +
      '<td><b><i>Purpose:</i></b></td>' +
      '<td>&nbsp;&nbsp;</td>' +
      '<td>' + purpose + '</td>' +
    '</tr></table>'
  );
}


function makeTaskTitle ( icon_uri,title,purpose,schematic )  {
  document.write (
    '<table><tr>' +
      '<td><img src="../images/' + icon_uri + '" width="80px" height="80px"/></td>' +
      '<td>&nbsp;&nbsp;</td>' +
      '<td><h1><i>' + title + '</i></h1></td>' +
    '</tr><tr>' +
      '<td><font size="+1"><b><i><u>Purpose:</u></i></b></font></td>' +
      '<td>&nbsp;&nbsp;</td>' +
      '<td>' + purpose + '</td>' +
    '</tr></table>' +
    '<h3><i><u>Schematic:</u></i></h3>' +
    '<img src="images/tasks/' + schematic + '" width="750px"/>' +
    '<h3><i><u>Description</u></i></h3>'
  );
}


function replaceDocumentText(selector, text, newText, flags) {
  var matcher = new RegExp(text, flags);
  var elems = document.querySelectorAll(selector);

  for (var i = 0; i < elems.length; i++)
    //if (!elems[i].childNodes.length)
    elems[i].innerHTML = elems[i].innerHTML.replace(matcher, newText);
}

function setAppName()  {
//  replaceDocumentText ( 'body,div,h1,h2,h3,p,a,i,b,font','{jsCoFE}','CCP4 Cloud','g' );
  replaceDocumentText ( '*','{jsCoFE}','CCP4 Cloud','g' );
}

window.onload = setAppName;
