
/*
 *  =================================================================
 *
 *    28.08.19   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_authorisation.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Software Authorisation Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2019
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Export project dialog class

function AuthorisationDialog ( login,authorisation_dic )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Software Authorisations' );
  document.body.appendChild ( this.element );

  this.auth_dic = authorisation_dic;

  this.grid = new Grid('-compact');
  this.addWidget ( this.grid );
  this.grid.setLabel ( '<h3>Software Authorisations</h3>',0,0,1,4 );

  this.grid.setLabel ( appName() + ' provides access to 3rd party software, not ' +
                  'covered by CCP4 license. In order to use this software, ' +
                  'a user needs to be authorised by the corresponding software ' +
                  'provider. This page gives a summary of your authorisations ' +
                  'and allows you to send authorisation requests. Note that '  +
                  'authorisation request will redirect you to the provider\'s ' +
                  'web-site. Any data requested by software provider will be ' +
                  'processed at provider\'s end and will not be stored in ' +
                  appName() + '.',1,0,1,5 ).setFontSize('80%');
  this.grid.setHLine ( 1, 2,0,1,5 );

  this.layAuthorisationEntries ( login );

  w = 3*$(window).width()/5 + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : w,
    modal     : true,
    //open      : function(event, ui) {
    //  entry_list.addOnInputListener  ( enableImportButton );
    //},
    buttons   : [
      {
        id    : "close_btn",
        text  : "Close",
        click : function() {
          $(this).dialog("close");
        }
      }
    ]
  });

}


AuthorisationDialog.prototype = Object.create ( Widget.prototype );
AuthorisationDialog.prototype.constructor = AuthorisationDialog;

/*
AuthorisationDialog.prototype.authoriseArpWarp = function ( login )  {
var arpwarp_url = 'https://arpwarp.embl-hamburg.de';


var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       // Typical action to be performed when the document is ready:
       document.getElementById("demo").innerHTML = xhttp.responseText;
    }
};
xhttp.open("GET", 'https://arpwarp.embl-hamburg.de/api/realip/', true);
xhttp.send();

return;

//https://arpwarp.embl-hamburg.de/api/realip/
//https://arpwarp.embl-hamburg.de/api/realip/

  $.ajax ({
    url      : arpwarp_url + '/api/realip/',
    //url      : 'https://arpwarp.embl-hamburg.de/api/realip/',
    //url      : 'https://www.google.com',
    async    : true,
    type     : 'POST',
    cache       : false,   // added on 27.03.2019
    processData : false,
    contentType : false
//    crossDomain : true
    //data     : '',
    //dataType : 'json'
    //dataType : 'text'
  })
  .done ( function(rdata) {
    alert ( ' done rdata=' + rdata );
  })
  .always ( function(){} )
  .fail   ( function(xhr,err){
    alert ( err );
    new MessageBox ( 'Communication error',
      'Cannot reach Arp/wArp authorisation server.<p>Sorry and please come back later!' );
  });

}
*/

/*
AuthorisationDialog.prototype.authoriseArpWarp = function ( login )  {

  hamburg_frame = new BrowserFrame ( 'Arp/wArp Authorisation',
    'https://www.google.com' );
    //'https://arpwarp.embl-hamburg.de/api/maketoken/?reqid=abcd&addr=1.2.3.4&cburl=https://www.google.com' );
  hamburg_frame.launch();

}


AuthorisationDialog.prototype.despatchRequest = function ( key,login )  {
  if (key=='arpwarp')
    this.authoriseArpWarp ( login );
}
*/

AuthorisationDialog.prototype.layAuthorisationEntries = function ( login )  {

  var auth_list = [
    { 'key'           : 'arpwarp',
      'desc_software' : 'Arp/wArp Model Building Software from EMBL-Hamburg',
      'icon_software' : 'task_arpwarp',
      'desc_provider' : 'EMBL Outstation in Hamburg',
      'icon_provider' : 'org_emblhamburg',
      'auth_url'      : 'https://arpwarp.embl-hamburg.de/api/maketoken/?reqid=abcd&addr=1.2.3.4&cburl=',
    }
  ];

  var row = 3;
  for (var i=0;i<auth_list.length;i++)  {

    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('9pt').setBackgroundColor('lightblue');
    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('6pt');

    if (!this.auth_dic.hasOwnProperty(auth_list[i].key))  {
      this.auth_dic[auth_list[i].key] = {};
      this.auth_dic[auth_list[i].key].auth_date = '';
    }
    auth_list[i].auth_date = this.auth_dic[auth_list[i].key].auth_date;

    row1 = row+1;
    row2 = row+2;
    this.grid.setLabel ( '<b><i>Software:</i></b>',row,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(auth_list[i].icon_software) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         auth_list[i].desc_software,row,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Provider:</i></b>',row1,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(auth_list[i].icon_provider) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         auth_list[i].desc_provider,row1,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Authorisation:&nbsp;&nbsp;</i></b>',row2,0,1,1 );

    var auth_msg   = '';
    var auth_color = '';
    if (auth_list[i].auth_date.length<=0)  {
      auth_msg   = '<b><i>not authorised</i></b>';
      auth_color = 'darkred';
    } else if (auth_list[i].auth_date=='requested')  {
      auth_msg   = '<b><i>requested</i></b>';
      auth_color = '#FFBF00';
    } else  {
      auth_msg   = '<b><i>authorised since</i></b> ' + auth_list[i].auth_date;
      auth_color = 'green';
    }
    var auth_lbl    = this.grid.setLabel ( auth_msg + '&nbsp;&nbsp;&nbsp;',row2,1,1,1 )
                               .setFontColor(auth_color).setNoWrap();
    var request_btn = this.grid.setButton ( 'request authorisation',image_path('authorisation'),
                                            row2,2,1,1 ).setNoWrap();
    (function(self,req_btn,key,auth_url,auth_label){
      req_btn.addOnClickListener ( function(){
        alert ( window.location );
        window.open ( auth_url + window.location );
        //  strip '?...' from window.location
        //  'arpwarp_' + __login_token as reqid in callback
        //  requested /?token=WyIxLjIuMy40Iiw1MTM1XQ%3A1i412y%3A16YMt11WH05LLVMbs9qSdqbEFKc&code=ok&reqid=abcd
        self.auth_dic[key].auth_date = 'requested';
        auth_label.setText ( '<b><i>requested</i></b>' + '&nbsp;&nbsp;&nbsp;' )
                  .setFontColor('#FFBF00');
        //  start timer to update on authorisation status, receive and update self.auth_dic
      });
    }(this,request_btn,auth_list[i].key,auth_list[i].auth_url,auth_lbl))

    for (var j=0;j<2;j++)  {
      this.grid.setVerticalAlignment ( row ,j,'middle' );
      this.grid.setVerticalAlignment ( row1,j,'middle' );
      this.grid.setVerticalAlignment ( row2,j,'middle' );
    }
    this.grid.setCellSize  ( '5%'  ,'',row2,0 );
    this.grid.setCellSize  ( 'auto','',row2,1 );
    this.grid.setCellSize  ( 'auto','',row2,2 );
    this.grid.setCellSize  ( '25%' ,'',row2,3 );
    this.grid.setCellSize  ( '60%' ,'',row2,4 );

    row += 3;

  }

}
