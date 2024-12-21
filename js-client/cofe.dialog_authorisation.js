
/*
 *  =================================================================
 *
 *    18.12.24   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2019-2024
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Export project dialog class

function AuthorisationDialog ( callback_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Software Authorisations' );
  document.body.appendChild ( this.element );

  this.auth_dic = {};  // will need to be obtained by request
  this.auth_lbl = {};
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
  let self      = this;
  this.userData = null;
  serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){

    self.userData = data;

    if (data.hasOwnProperty('authorisation'))
      self.auth_dic = data.authorisation;

    self.layAuthorisationEntries();

    let w = 3*$(window).width()/5 + 'px';

    $(self.element).dialog({
      resizable : true,
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
  // (function(self){
    if (this.timerCount>0)  {
      let self = this;
      serverRequest ( fe_reqtype.getUserData,0,'My Account',function(data){
        if (data.hasOwnProperty('authorisation'))  {
          for (let key in self.auth_dic)  {
            if (data.authorisation.hasOwnProperty(key)) {
              let adate = data.authorisation[key].auth_date;
              let token = data.authorisation[key].token;
              if ((self.auth_dic[key].auth_date0!=adate) ||
                  (self.auth_dic[key].token0!=token)) {
                self.timerCount--;
                self.auth_dic[key].auth_date0 = adate;
                self.auth_dic[key].token0     = token;
                self.auth_dic[key].auth_date  = adate;
                self.auth_dic[key].token      = token;
                __user_authorisation[key]     = data.authorisation[key];
                let auth_msg   = '';
                let auth_color = '';
                if (adate.length<=0)  {
                  auth_msg   = '<b><i>not authorised</i></b>';
                  auth_color = 'darkred';
                } else  {
                  auth_msg   = '<b><i>authorised since ' + adate + '</i></b>';
                  auth_color = 'green';
                }
                // self.auth_dic[key].auth_lbl.setText(auth_msg)
                //                            .setFontColor(auth_color).setNoWrap();
                self.auth_lbl[key].setText(auth_msg)
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
  // }(this))
}

AuthorisationDialog.prototype.stopTimer = function()  {
  if (this.timer)  {
    window.clearTimeout ( this.timer );
    this.timer = null;
  }
  this.timerCount = 0;
}

AuthorisationDialog.prototype.layAuthorisationEntries = function()  {

  this.timerCount = 0;

  let row = 3;

//console.log ( JSON.stringify(__auth_software) );

  for (let key in __auth_software)  {

    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('9pt').setBackgroundColor('lightblue');
    this.grid.setLabel ( '&nbsp;',row++,0,1,5 ).setHeight('6pt');

    if (!this.auth_dic.hasOwnProperty(key))
      this.auth_dic[key] = { 'auth_date' : '', 'token' : '' };

    let row1 = row+1;
    let row2 = row+2;
    this.grid.setLabel ( '<b><i>Software:</i></b>',row,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(__auth_software[key].icon_software) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         __auth_software[key].desc_software,row,1,1,3 ).setNoWrap();
    this.grid.setLabel ( '<b><i>Provider:</i></b>',row1,0,1,1 );
    this.grid.setLabel ( '<img src="' + image_path(__auth_software[key].icon_provider) +
                         '" height="36pt" style="vertical-align: middle;"/>&nbsp;&nbsp;&nbsp;' +
                         __auth_software[key].desc_provider,row1,1,1,3 ).setNoWrap();

    let auth_inp = null;
    if ('auth_data' in __auth_software[key])  {
      this.grid.setLabel ( '&nbsp;',row2++,0,1,1 );
      if ('help_page' in __auth_software[key])
        this.grid.setLabel ( 
            '<a href="javascript:launchHelpBox1(\'Authorisation instructions\',' +
                '\'' + __user_guide_base_url + __auth_software[key].help_page +
                '.html\',null,0)"><span style="color:black">Authorisation instructions</span></a>' +
                '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
                '<a target="_blank" href="https://pdb-redo.eu/token">' +
                '<span style="color:blue">PDB-REDO token page</span></a></br>&nbsp;',
          row2++,1,1,2 );
      auth_inp = {};
      for (let auth_item in __auth_software[key].auth_data)  {
        this.grid.setLabel ( '<i>' + __auth_software[key].auth_data[auth_item].label + ':</i>&nbsp;',
                             row2,0,1,1 ).setHorizontalAlignment('right');
        let val0 = '';
        if (auth_item in this.auth_dic[key])
          val0 = this.auth_dic[key][auth_item];
        auth_inp[auth_item] = this.grid.setInputText ( val0,row2,1,1,1 )
                                       .setWidth_px(350);
        this.grid.setVerticalAlignment ( row2,0,'middle' );
        row2++;
      }
      this.grid.setLabel ( '&nbsp;',row2++,0,1,1 );
    }

    this.grid.setLabel ( '<b><i>Authorisation:&nbsp;&nbsp;</i></b>',row2,0,1,1 );

    let auth_msg   = '';
    let auth_color = '';
    this.auth_dic[key].auth_date0 = this.auth_dic[key].auth_date;
    this.auth_dic[key].token0     = this.auth_dic[key].token;
    if (this.auth_dic[key].auth_date.length<=0)  {
      auth_msg   = '<b><i>not authorised</i></b>';
      auth_color = 'darkred';
    } else if (this.auth_dic[key].auth_date=='requested')  {
      auth_msg   = '<b><i>requested</i></b>';
      auth_color = '#FFBF00';
    } else  {
      if ('expiry_date' in this.auth_dic[key])  {
        let d1 = new Date(this.auth_dic[key].expiry_date);
        if (d1!='Invalid Date')  {
          let d2 = new Date(this.auth_dic[key].auth_date);
          if (d1.getTime()<d2.getTime())  {
            auth_msg   = '<b><i>authorisation expired on ' + 
                         this.auth_dic[key].expiry_date + '</i></b>';
            auth_color = 'darkred';
          }
        }
      }
      if (!auth_msg)  {
        auth_msg   = '<b><i>authorised since ' + this.auth_dic[key].auth_date + 
                     '</i></b>';
        auth_color = 'green';
      }
    }
//console.log ( ' ---------- ' + key );
    // this.auth_dic[key].auth_lbl =
    this.auth_lbl[key] = this.grid.setLabel ( auth_msg + '&nbsp;&nbsp;&nbsp;',row2,1,1,1 )
                                  .setFontColor(auth_color).setNoWrap();

    let request_btn = this.grid.setButton ( 'request authorisation',
                                            image_path('authorisation'),
                                            row2,2,1,1 ).setNoWrap();

    if (auth_inp)  {

      (function(self,auth_input){
        request_btn.addOnClickListener ( function(){
          let provided = true;
          let vallog   = '';
          for (let item in auth_input)  {
            let v = auth_input[item].getValue().trim();
            self.auth_dic[key][item] = v;
            if (v)
              switch (__auth_software[key].auth_data[item].type)  {
                case 'integer' :  if (!isInteger(v))  {
                                    v = '';
                                    vallog += '<li>' + 
                                      __auth_software[key].auth_data[item].label +
                                      ' must be a valid integer</li>';
                                  }
                                break;
                case 'date'    :  let d = new Date(v);
                                  if (d=='Invalid Date')  {
                                    v = '';
                                    vallog += '<li>' + 
                                      __auth_software[key].auth_data[item].label +
                                      ' must be a valid date</li>';
                                  } else if (d.getTime()<Date.now())  {
                                    v = '';
                                    vallog += '<li>' + 
                                      __auth_software[key].auth_data[item].label +
                                      ' must be a date in future</li>';

                                  }
                                break; 
                case 'string'  :
                default : ;
              } 
            if (!v)  {
              provided = false;
              self.auth_dic[key].auth_date = '';
              self.userData.authorisation  = self.auth_dic;
              self.userData.pwd = '';  // can save only some records without password
              serverRequest ( fe_reqtype.updateUserData,self.userData,
                              'Authorisation data update',
                              function(response){
                self.timerCount++;
                self.startTimer();
              });
            }
          }
          if (vallog)
            new MessageBox ( 'Misformatted input',
                '<div style="width:400px"><h2>Misformatted input</h2>' +
                'The following items are given wrong values:<ul>' + vallog +
                '</ul>Please provide data in correct format.</div>',
                'msg_error' );
          else if (!provided)
            new MessageBox ( 'Insufficient data',
                '<h2>Insufficient data</h2>Please provide all requested data.',
                'msg_excl_yellow' );
          else  {
            self.auth_dic[key].auth_date = new Date().toUTCString();
            self.userData.authorisation  = self.auth_dic;
            self.userData.pwd = '';  // can save only some records without password
            serverRequest ( fe_reqtype.updateUserData,self.userData,
                            'Authorisation data update',
                            function(response){
              self.timerCount++;
              self.startTimer();
              new MessageBox ( 'Authorisation',
                  '<div style="width:400px"><h2>Conditonal authorisation</h2>' +
                  'Your data was accepted but is not verified at this point. ' +
                  'You can now start tasks from this software provider, which ' +
                  'will run if authorisation data is correct. If tasks are ' +
                  'rejected, assume typo and repeat authorisation.</div>',
                  'msg_information' );
            });
          }
        });
      }(this,auth_inp))

    } else if ('auth_url' in __auth_software[key])  {
      (function(self,akey){
        request_btn.addOnClickListener ( function(){
          let ownURL = window.location.protocol + '//' + window.location.host +
                       window.location.pathname;
          if (ownURL.endsWith('/'))
            ownURL = ownURL.slice(0,-1);
          let reqURL = __auth_software[akey].auth_url.replace ( '$reqid',
                'authorisation-' + akey + '-' + __login_token )
                .replace ( '$cburl',ownURL );
          window.open ( reqURL );
          //self.auth_dic[akey].auth_date0 = self.auth_dic[akey].auth_date;
          //self.auth_dic[akey].token0     = self.auth_dic[akey].token;
          self.auth_lbl[akey].setText ( '<b><i>requested</i></b>&nbsp;&nbsp;&nbsp;' )
                             .setFontColor('#FFBF00');
          self.timerCount++;
          self.startTimer();
        });
      }(this,key))
    }

    for (let j=0;j<2;j++)  {
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
