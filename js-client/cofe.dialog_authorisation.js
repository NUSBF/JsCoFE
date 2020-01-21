
/*
 *  =================================================================
 *
 *    21.01.20   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2020
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


// -------------------------------------------------------------------------
// Export project dialog class

function AuthorisationDialog ( callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Software Authorisations' );
  document.body.appendChild ( this.element );

  this.auth_dic = {};  // will need to be obtained by request
  this.timer    = null;

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

  // fetch user data from server
  (function(self){
    serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){

        if (data.hasOwnProperty('authorisation'))
          self.auth_dic = data.authorisation;

        self.layAuthorisationEntries();

        w = 3*$(window).width()/5 + 'px';

        $(self.element).dialog({
          resizable : false,
          height    : 'auto',
          maxHeight : 500,
          width     : w,
          modal     : true,
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

        $(self.element).on( "dialogclose",function(event,ui){
          self.stopTimer();
          if (callback_func)
            callback_func ( self );
        });

    },null,'persist');

  }(this))

}


AuthorisationDialog.prototype = Object.create ( Widget.prototype );
AuthorisationDialog.prototype.constructor = AuthorisationDialog;

AuthorisationDialog.prototype.startTimer = function()  {
  (function(self){
    if (!self.timer)
      self.timer = window.setTimeout ( function(){ self.updateOnTimer(); },1500 );
  }(this))
}

AuthorisationDialog.prototype.updateOnTimer = function()  {
  (function(self){
    if (self.timerCount>0)  {
      serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){
        if (data.hasOwnProperty('authorisation'))  {
          for (var key in self.auth_dic)  {
            if (data.authorisation.hasOwnProperty(key)) {
              var adate = data.authorisation[key].auth_date;
              var token = data.authorisation[key].token;
              if ((self.auth_dic[key].auth_date0!=adate) ||
                  (self.auth_dic[key].token0!=token)) {
                self.timerCount--;
                self.auth_dic[key].auth_date0 = adate;
                self.auth_dic[key].token0     = token;
                self.auth_dic[key].auth_date  = adate;
                self.auth_dic[key].token      = token;
                __user_authorisation[key]     = data.authorisation[key];
                var auth_msg   = '';
                var auth_color = '';
                if (adate.length<=0)  {
                  auth_msg   = '<b><i>not authorised</i></b>';
                  auth_color = 'darkred';
                } else  {
                  auth_msg   = '<b><i>authorised since ' + adate + '</i></b>';
                  auth_color = 'green';
                }
                self.auth_dic[key].auth_lbl.setText(auth_msg)
                                           .setFontColor(auth_color).setNoWrap();
              }
            }
          }
        }
        if (self.timerCount>0)
          self.timer = window.setTimeout ( function(){ self.updateOnTimer(); },1500 );
        else
          self.stopTimer();
      });
    }
  }(this))
}


/*
AuthorisationDialog.prototype.updateOnTimer = function()  {
  (function(self){
    if (self.timerCount>0)  {
      serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){
//console.log ( ' 0 '  + self.timerCount );
        if (data.hasOwnProperty('authorisation'))  {
          self.auth_dic = data.authorisation;
          for (var i=0;i<self.auth_list.length;i++)  {
            if (self.auth_dic.hasOwnProperty(self.auth_list[i].key)) {
              var adate = self.auth_dic[self.auth_list[i].key].auth_date;
              var token = self.auth_dic[self.auth_list[i].key].token;
//console.log ( ' 1  ' + adate );
//console.log ( ' 1t ' + token );
//console.log ( ' 2  ' + self.auth_list[i].auth_date0 );
//console.log ( ' 2t ' + self.auth_list[i].token0 );
              if ((self.auth_list[i].auth_date0!=adate) ||
                  (self.auth_list[i].token0!=token)) {
//console.log ( ' 3 '  + self.timerCount );
                self.timerCount--;
                self.auth_list[i].auth_date0 = adate;
                self.auth_list[i].token0     = token;
                self.auth_list[i].auth_date  = adate;
                self.auth_list[i].token      = token;
                var auth_msg   = '';
                var auth_color = '';
                if (adate.length<=0)  {
                  auth_msg   = '<b><i>not authorised</i></b>';
                  auth_color = 'darkred';
                } else  {
                  auth_msg   = '<b><i>authorised since ' + adate + '</i></b>';
                  auth_color = 'green';
                }
//console.log ( ' 4 '  + auth_color );
                self.auth_list[i].auth_lbl.setText(auth_msg)
                                          .setFontColor(auth_color).setNoWrap();
              }
            }
          }
        }
        if (self.timerCount>0)
          self.timer = window.setTimeout ( function(){ self.updateOnTimer(); },1500 );
        else
          self.stopTimer();
      });
    }
  }(this))
}
*/

AuthorisationDialog.prototype.stopTimer = function()  {
  if (this.timer)  {
    window.clearTimeout ( this.timer );
    this.timer = null;
  }
  this.timerCount = 0;
}

AuthorisationDialog.prototype.layAuthorisationEntries = function()  {

  this.timerCount = 0;
  /*
  this.auth_list = [
    { 'key'           : 'arpwarp',
      'desc_software' : 'Arp/wArp Model Building Software from EMBL-Hamburg',
      'icon_software' : 'task_arpwarp',
      'desc_provider' : 'EMBL Outstation in Hamburg',
      'icon_provider' : 'org_emblhamburg',
      'auth_url'      : 'https://arpwarp.embl-hamburg.de/api/maketoken/?reqid=$reqid&addr=1.2.3.4&cburl=$cburl',
    },
    { 'key'           : 'gphl',
      'desc_software' : 'Global Phasing Limited Software Suite',
      'icon_software' : 'task_buster',
      'desc_provider' : 'Global Phasing Limited',
      'icon_provider' : 'task_buster',
      'auth_url'      : 'https://arpwarp.embl-hamburg.de/api/maketoken/?reqid=$reqid&addr=1.2.3.4&cburl=$cburl',
    }
  ];
  */

  var row = 3;

  for (var key in __auth_software)  {

    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('9pt').setBackgroundColor('lightblue');
    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('6pt');

    if (!this.auth_dic.hasOwnProperty(key))
      this.auth_dic[key] = { 'auth_date' : '', 'token' : '' };

    row1 = row+1;
    row2 = row+2;
    this.grid.setLabel ( '<b><i>Software:</i></b>',row,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(__auth_software[key].icon_software) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         __auth_software[key].desc_software,row,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Provider:</i></b>',row1,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(__auth_software[key].icon_provider) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         __auth_software[key].desc_provider,row1,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Authorisation:&nbsp;&nbsp;</i></b>',row2,0,1,1 );

    var auth_msg   = '';
    var auth_color = '';
    this.auth_dic[key].auth_date0 = this.auth_dic[key].auth_date;
    this.auth_dic[key].token0     = this.auth_dic[key].token;
    if (this.auth_dic[key].auth_date.length<=0)  {
      auth_msg   = '<b><i>not authorised</i></b>';
      auth_color = 'darkred';
    } else if (this.auth_dic[key].auth_date=='requested')  {
      auth_msg   = '<b><i>requested</i></b>';
      auth_color = '#FFBF00';
    } else  {
      auth_msg   = '<b><i>authorised since ' + this.auth_dic[key].auth_date + '</i></b>';
      auth_color = 'green';
    }
    this.auth_dic[key].auth_lbl   =
                      this.grid.setLabel ( auth_msg + '&nbsp;&nbsp;&nbsp;',row2,1,1,1 )
                               .setFontColor(auth_color).setNoWrap();
    var request_btn = this.grid.setButton ( 'request authorisation',
                                            image_path('authorisation'),
                                            row2,2,1,1 ).setNoWrap();
    (function(self,akey){
      request_btn.addOnClickListener ( function(){
        var ownURL = window.location.protocol + '//' + window.location.host +
                     window.location.pathname;
        var reqURL = __auth_software[akey].auth_url.replace ( '$reqid',
              'authorisation-' + akey + '-' + __login_token )
              .replace ( '$cburl',ownURL );
        window.open ( reqURL );
        //self.auth_dic[akey].auth_date0 = self.auth_dic[akey].auth_date;
        //self.auth_dic[akey].token0     = self.auth_dic[akey].token;
        self.auth_dic[akey].auth_lbl.setText ( '<b><i>requested</i></b>' +
                                               '&nbsp;&nbsp;&nbsp;' )
                                    .setFontColor('#FFBF00');
        self.timerCount++;
        self.startTimer();
      });
    }(this,key))

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

  /*
  for (var i=0;i<this.auth_list.length;i++)  {

    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('9pt').setBackgroundColor('lightblue');
    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('6pt');

    if (!this.auth_dic.hasOwnProperty(this.auth_list[i].key))  {
      this.auth_dic[this.auth_list[i].key] = {};
      this.auth_dic[this.auth_list[i].key].auth_date = '';
      this.auth_dic[this.auth_list[i].key].token     = '';
    }
    this.auth_list[i].auth_date = this.auth_dic[this.auth_list[i].key].auth_date;
    this.auth_list[i].token     = this.auth_dic[this.auth_list[i].key].token;

    row1 = row+1;
    row2 = row+2;
    this.grid.setLabel ( '<b><i>Software:</i></b>',row,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(this.auth_list[i].icon_software) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         this.auth_list[i].desc_software,row,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Provider:</i></b>',row1,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(this.auth_list[i].icon_provider) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         this.auth_list[i].desc_provider,row1,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Authorisation:&nbsp;&nbsp;</i></b>',row2,0,1,1 );

    var auth_msg   = '';
    var auth_color = '';
    this.auth_list[i].auth_date0 = this.auth_list[i].auth_date;
    this.auth_list[i].token0     = this.auth_list[i].token;
    if (this.auth_list[i].auth_date.length<=0)  {
      auth_msg   = '<b><i>not authorised</i></b>';
      auth_color = 'darkred';
    } else if (this.auth_list[i].auth_date=='requested')  {
      auth_msg   = '<b><i>requested</i></b>';
      auth_color = '#FFBF00';
    } else  {
      auth_msg   = '<b><i>authorised since ' + this.auth_list[i].auth_date + '</i></b>';
      auth_color = 'green';
    }
    this.auth_list[i].auth_lbl   =
                      this.grid.setLabel ( auth_msg + '&nbsp;&nbsp;&nbsp;',row2,1,1,1 )
                               .setFontColor(auth_color).setNoWrap();
    var request_btn = this.grid.setButton ( 'request authorisation',
                                            image_path('authorisation'),
                                            row2,2,1,1 ).setNoWrap();
    (function(self,lno){
      request_btn.addOnClickListener ( function(){
        var ownURL = window.location.protocol + '//' + window.location.host +
                     window.location.pathname;
        var reqURL = self.auth_list[lno].auth_url.replace ( '$reqid',
              'authorisation-' + self.auth_list[lno].key + '-' + __login_token )
              .replace ( '$cburl',ownURL );
//console.log ( ' >>>>>>>> 3 ' + reqURL );
        window.open ( reqURL );
        self.auth_list[lno].auth_date0 = self.auth_list[lno].auth_date;
        self.auth_list[lno].token0     = self.auth_list[lno].token;
//console.log ( ' 22  ' + self.auth_list[lno].auth_date0 );
//console.log ( ' 22t ' + self.auth_list[lno].token0 );
        self.auth_list[lno].auth_lbl.setText ( '<b><i>requested</i></b>' +
                                               '&nbsp;&nbsp;&nbsp;' )
                                    .setFontColor('#FFBF00');
        self.timerCount++;
        self.startTimer();
      });
    }(this,i))

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
  */

}
