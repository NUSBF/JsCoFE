
/*
 *  =================================================================
 *
 *    28.08.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/gui/gui.dialogs.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-powered Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Various dialog templates
 *       ~~~~~~~~~
 *
 *           function extendToolbar ( dialog,options={} )
 *           function Dialog        ( title )
 *           function MessageBox    ( title,message )
 *           function MessageBoxW   ( title,message,width_ratio )
 *           function MessageBoxF   ( title,message,btn_name,onClick_func,
 *                                          uncloseable_bool )
 *           function HelpBox       ( title,helpURL,onDoNotShowAgain_func )
 *           function launchHelpBox ( title,helpURL,onDoNotShowAgain_func,
 *                                          delay_msec )
 *           function WaitDialog    ( title,message,process_wait )
 *           function QuestionBox   ( title,message,btn1_name,onButton1_func,
 *                                          btn2_name,onButton2_func )
 *           function InputBox      ( title )
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict'; // *client*


// -------------------------------------------------------------------------
// Puts extended controls in Dialog's toolbar

function extendToolbar ( dialog,options={} )  {

  if (!__any_mobile_device)  {

    let opt = {
      "closable"         : true,
      "maximizable"      : true,
      "minimizable"      : true,
      "collapsable"      : true,
      "dblclick"         : "maximize", // 'collapse', 'maximize', 'minimize', ''
      // "titlebar"         : "",         // 'transparent', 'none', ''
      "minimizeLocation" : "left"      // 'left' or 'right'
      // "icons" : {
      //   "close"    : "ui-icon-circle-close",
      //   "maximize" : "ui-icon-circle-plus",
      //   "minimize" : "ui-icon-circle-minus",
      //   "collapse" : "ui-icon-triangle-1-s",
      //   "restore"  : "ui-icon-bullet"
      // }
      // "load"           : function(evt, dlg){ alert(evt.type); },
      // "beforeCollapse" : function(evt, dlg){ alert(evt.type); },
      // "beforeMaximize" : function(evt, dlg){ alert(evt.type); },
      // "beforeMinimize" : function(evt, dlg){ alert(evt.type); },
      // "beforeRestore"  : function(evt, dlg){ alert(evt.type); },
      // "collapse"       : function(evt, dlg){ alert(evt.type); },
      // "maximize"       : function(evt, dlg){ alert(evt.type); },
      // "minimize"       : function(evt, dlg){ alert(evt.type); },
      // "restore"        : function(evt, dlg){ alert(evt.type); }
    };

    for (let key in options)
      if ((key in opt) && (!options[key]))  delete opt[key];
                                      else  opt[key] = options[key];

    $(dialog.element).dialogExtend(opt);

  }

  return dialog;

}

// -------------------------------------------------------------------------
// MessageBox class

function Dialog ( title )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  this._options = {
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {
      'Ok' : function() {
               $(this).dialog ( 'close' );
             }
    }
  }

}

Dialog.prototype = Object.create ( Widget.prototype );
Dialog.prototype.constructor = Dialog;

Dialog.prototype.launch = function()  {
  $(this.element).dialog ( this._options );
}


// -------------------------------------------

function MessageBox ( title,message,icon_name='',modal=true )  {
// message box with icon

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  if (icon_name)  {
    let grid = new Grid ( '' );
    this.addWidget   ( grid );
    grid.setLabel    ( ' ',0,0,1,1 );
    grid.setCellSize ( '','6px', 0,0 );
    grid.setImage    ( image_path(icon_name),'48px','48px', 1,0,1,1 );
    grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );
    grid.setLabel    ( message,0,2,2,1 );
    grid.setVerticalAlignment ( 0,2,'middle' );
  } else
    this.element.innerHTML = message;

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : modal,
    buttons   : [{
      id    : 'ok_btn_' + __id_cnt++,
      text  : 'Ok',
      click : function() {
                $(this).dialog ( 'close' );
              }
    }]
  });

}

MessageBox.prototype = Object.create ( Widget.prototype );
MessageBox.prototype.constructor = MessageBox;


// -------------------------------------------

function MessageBoxW ( title,message,width_ratio,icon_name='' )  {
// message box with fixed width

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  if (icon_name)  {
    let grid = new Grid ( '' );
    this.addWidget   ( grid );
    grid.setLabel    ( ' ',0,0,1,1 );
    grid.setCellSize ( '','6px', 0,0 );
    grid.setImage    ( image_path(icon_name),'48px','48px', 1,0,1,1 );
    grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );
    grid.setLabel    ( message,0,2,2,1 );
    grid.setVerticalAlignment ( 0,2,'middle' );
  } else
    this.element.innerHTML = message;

  let w = Math.round(width_ratio*$(window).width()) + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : w,
    modal     : true,
    buttons   : {
      'Ok' : function() {
               $(this).dialog ( 'close' );
             }
    }
  });

}

MessageBoxW.prototype = Object.create ( Widget.prototype );
MessageBoxW.prototype.constructor = MessageBoxW;


// -------------------------------------------

function MessageBoxF ( title,message,btn_name,onClick_func,uncloseable_bool,
                       icon_name='' )  {

  Dialog.call ( this,title );

  if (icon_name)  {
    let grid = new Grid ( '' );
    this.addWidget   ( grid );
    grid.setLabel    ( ' ',0,0,1,1 );
    grid.setCellSize ( '','6px', 0,0 );
    grid.setImage    ( image_path(icon_name),'48px','48px', 1,0,1,1 );
    grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );
    grid.setLabel    ( message,0,2,2,1 );
    grid.setVerticalAlignment ( 0,2,'middle' );
  } else
    this.element.innerHTML = message;

  this._options = {
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {}
  }

  this._options.buttons[btn_name] = function() {
    $(this).dialog ( 'close' );
    if (onClick_func)
      window.setTimeout ( onClick_func,0 );
  }

  if (uncloseable_bool)  {
    this._options.closeOnEscape = false;
    this._options.open = function(event,ui) {
      //hide close button.
      $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
    }
  }

  this.launch();

}

MessageBoxF.prototype = Object.create ( Dialog.prototype );
MessageBoxF.prototype.constructor = MessageBoxF;


// -------------------------------------------------------------------------
// HelpBox class

function HelpBox ( title,helpURL,onDoNotShowAgain_func,params=null )  {
// params = {  // all optional
//   width      : width,
//   height     : height,
//   navigation : true
// }

  if (onDoNotShowAgain_func)  {
    if (!onDoNotShowAgain_func(0,helpURL))
      return;
  }

  Widget.call ( this,'div' );
  if (title.length>0)
        this.element.setAttribute ( 'title',title );
//        this.element.setAttribute ( 'title','Online Help -- ' + title );
  else  this.element.setAttribute ( 'title','Online Help' );
  this.display = new IFrame ( '' );  // always initially empty
  let loading_msg = '<!DOCTYPE html>\n<html><body><h2>Loading ...</h2></body></html>';
  this.display.setText ( loading_msg );

  $(this.display.element).css({'overflow':'hidden'});
  this.addWidget ( this.display );
  $(this.element).css({'overflow':'hidden'});

  this.history_length   = -1;
  this.history_position = -1;
  this.history_control  = 0;

  document.body.appendChild ( this.element );
//  document.body.style.fontSize = '16px';

  let w0 = 1000;
  let h0 = Math.min ( $(window).height()-180,600 );
  if (params)  {
    if ('width'  in params)  w0 = params.width;
    if ('height' in params)  h0 = params.height;
    w0 = Math.min ( w0, $(window).width ()-24  );
    h0 = Math.min ( h0, $(window).height()-158 );
  } else if (__any_mobile_device)  {
    w0 = $(window).width () - 24;
    h0 = $(window).height() - 158;
    if (__mobile_device)
      h0 += 24;
  }

  this.resizeDisplay = function ( w,h )  {
    w0 = w;
    h0 = h;
    this.display.setSize_px ( w-16,h-4 );
  }

  let tstamp = Date.now();
  this.options = {
    width   : w0,
    height  : h0,
    modal   : false
  };

  this.navigation = true;
  if (params && ('navigation' in params))
    this.navigation = params.navigation;

  if (this.navigation)  {
    this.options.buttons = [
      { text : 'Back',
        id   : 'back_' + tstamp
        //icons: { primary: 'ui-icon-home' },
      },
      { text : 'Forward',
        id   : 'forward_' + tstamp
        //icons: { primary: 'ui-icon-home' },
      },
      { text : 'Return',
        id   : 'return_' + tstamp,
        // icons: { primary: 'ui-icon-home' },
      },
      { text : 'Detach',
        id   : 'detach_' + tstamp
        //icons: { primary: 'ui-icon-home' },
      }
    ];
  } else
    this.options.buttons = [];

  this.options.resizable = !__any_mobile_device;

  if (onDoNotShowAgain_func)  {
    this.options.buttons = this.options.buttons.concat ([
      { text  : 'Do not show again',
        click : function() {
          $(this).dialog ( 'close' );
          onDoNotShowAgain_func ( 1,helpURL );
        }
      },
      { text : "Close",
        // icons: { primary: 'ui-icon-closethick' },
        click: function() {
          $(this).dialog ( 'close' );
          onDoNotShowAgain_func ( 2,helpURL );
        }
      }
    ]);
  } else  {
    this.options.buttons = this.options.buttons.concat ([
      { text : 'Close',
        //icon : image_path('close'),
        // icons: { primary: 'ui-icon-closethick' },
        click: function() {
          $(this).dialog ( 'close' );
        }
      }
    ]);
  }

  let body = this.display.element.contentWindow.document.querySelector('body');
  body.style.fontSize = '16px';

  if (!__any_mobile_device)  {
    this.options.width  = w0;
    this.options.height = h0 + 116;
  }

  let dlg = this;

  // (function(dlg){

    if (dlg.navigation)  {

        dlg.options.buttons[0].click = function() {  //  "Back" in history
        // var history = dlg.display.getDocument().history;
        // alert ( ' >>> ' + history.length );
        // if (history.length>0)
        //   history.back();
        if (dlg.history_position>0)  {
          dlg.history_position--;
          dlg.history_control = -1;
          try {
            dlg.display.getDocument().history.back();
          } catch(e) {
            dlg.history_length   = -1;
            dlg.history_position = -1;
            dlg.display.loadPage ( helpURL );
            // dlg.history_position++;
            // $('#' + dlg.options.buttons[0].id).button ( 'disable' );
            // $('#' + dlg.options.buttons[1].id).button ( 'disable' );
          }
          // window.setTimeout ( function(){
          //   dlg.display.loadPage ( dlg.history[dlg.history_position] );
          // },100 );
        }
      };

      dlg.options.buttons[1].click = function() {  //  "Forward" in history
        if (dlg.history_position<dlg.history_length)  {
          dlg.history_position++;
          dlg.history_control = 1;
          try {
            dlg.display.getDocument().history.forward();
          } catch(e) {
            dlg.history_length   = -1;
            dlg.history_position = -1;
            dlg.display.loadPage ( helpURL );
            // dlg.history_position--;
            // $('#' + dlg.options.buttons[0].id).button ( 'disable' );
            // $('#' + dlg.options.buttons[1].id).button ( 'disable' );
          }
          // dlg.display.loadPage ( dlg.history[dlg.history_position-1] );
        }
      };

      dlg.options.buttons[2].click = function() {  //  "Return" in history
        dlg.history_length   = -1;
        dlg.history_position = -1;
        dlg.display.loadPage ( helpURL );
      };

      dlg.options.buttons[3].click = function() {  //  "Detach"
        let url = helpURL;
        try {
          url = dlg.display.getDocument().location.href;
        } catch(e) {}
        $(this).dialog ( 'close' );
        window.setTimeout ( function(){
          window.open ( url );
        },0 );
      };

    }

    dlg.options.create = function(event,ui)  {
      // dlg.display.setText ( loading_msg );
      dlg.resizeDisplay ( w0,h0 );
      dlg.history_length   = -2;
      dlg.history_position = -2;
    }

  // }(this))

    let resize_func = function()  {
      dlg.resizeDisplay ( dlg.width_px(),dlg.height_px() );
    }

    let dialog = $(this.element).dialog ( this.options );
    if (__any_mobile_device)
          dialog.siblings('.ui-dialog-titlebar').remove();
    else  extendToolbar ( this,{
            "maximize" : function(evt,d){ resize_func(); },
            // "minimize" : function(evt, dlg){ resize_func(); },
            "restore"  : function(evt,d){ resize_func(); }
          });

  // (function(dlg){

    $(dlg.element).on ( 'dialogresize', function(event,ui){
      resize_func();
      // dlg.resizeDisplay ( dlg.width_px(),dlg.height_px() );
    });

    $(dlg.display.element).on('load',function(){

      if (!dlg.history_control)  {
        dlg.history_position++;
        dlg.history_length = dlg.history_position;
        // dlg.history.push ( dlg.display.getDocument().location.href );
        // dlg.history.push ( 'xx' );
      }
      dlg.history_control = 0;

      if (dlg.navigation)  {

        if (dlg.history_position>0)  {
          $('#' + dlg.options.buttons[0].id).button ( 'enable'  );
          $('#' + dlg.options.buttons[2].id).button ( 'enable'  );
        } else  {
          $('#' + dlg.options.buttons[0].id).button ( 'disable' );
          $('#' + dlg.options.buttons[2].id).button ( 'disable' );
        }

        if (dlg.history_position<dlg.history_length)
              $('#' + dlg.options.buttons[1].id).button ( 'enable'  );
        else  $('#' + dlg.options.buttons[1].id).button ( 'disable' );

      }

      dlg.resizeDisplay ( w0,h0 );

    });

    $(dlg.element).on ( 'dialogclose',function(event,ui){
      // $(dlg.element).dialog( "destroy" );
      dlg.delete();
    });

    // window.setTimeout ( function(){
    //   dlg.display.loadPage ( helpURL );
    // },100);

  // }(this))

  this.display.loadPage ( helpURL );

}

HelpBox.prototype = Object.create ( Widget.prototype );
HelpBox.prototype.constructor = HelpBox;

function launchHelpBox ( title,helpURL,onDoNotShowAgain_func,delay_msec,params=null )  {
  return window.setTimeout ( function(){
    new HelpBox ( title,helpURL,onDoNotShowAgain_func,params );
  },delay_msec);
}

function launchHelpBox1 ( title,helpURL,onDoNotShowAgain_func,delay_msec,params=null )  {
// need this function in onCLick responses because of bugs in Firefox
  launchHelpBox ( title,helpURL,onDoNotShowAgain_func,delay_msec,params=null );
}

// -------------------------------------------------------------------------
// WaitDialog class

function WaitDialog ( title,message,process_wait )  {
//  process_wait ( callback_when_ready_to_close() )

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  this.element.innerHTML = message;
  document.body.appendChild ( this.element );

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true
  });

  (function(dlg){
    process_wait ( dlg,function(){
      $(dlg.element).dialog ( 'close' );
    });
  }(this));

}

WaitDialog.prototype = Object.create ( Widget.prototype );
WaitDialog.prototype.constructor = WaitDialog;


// -------------------------------------------------------------------------
// QuestionBox class

function QuestionBox ( title,message,buttons,icon_name='',autoLaunch=true,modal=true )  {
// buttons = [{
//   name    : button_name,
//   onclick : button_function(){}
// },{
//   name    : button_name,
//   onclick : button_function(){}
// }]

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );

  this.grid = null;

  if (icon_name)  {
    this.grid = new Grid  ( '' );
    this.addWidget        ( this.grid );
    this.grid.setLabel    ( ' ',0,0,1,1 );
    this.grid.setCellSize ( '','6px', 0,0 );
    this.grid.setImage    ( image_path(icon_name),'48px','48px', 1,0,1,1 );
    this.grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );
    this.grid.setLabel    ( message,0,2,2,1 );
    this.grid.setVerticalAlignment ( 0,2,'middle' );
  } else if (message)
    this.element.innerHTML = message;

  let self = this;
  this.initiated = false;

  this.options = {
    resizable     : false,
    height        : 'auto',
    width         : 'auto',
    modal         : modal,
    closeOnEscape : false,
    open          : function(event, ui) {
                      self.initiated = true;
                      //hide close button.
                      $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
                    },
    buttons       : {}
  };

  for (let i=0;i<buttons.length;i++)
    (function(self,btn){
      self.options.buttons[btn.name] = function() {
        $(this).dialog ( 'close' );
        if (('onclick' in btn) && btn.onclick)
          window.setTimeout ( btn.onclick,0 );
      }
    }(this,buttons[i]))

  if (autoLaunch)
    $(this.element).dialog ( this.options );

}

QuestionBox.prototype = Object.create ( Widget.prototype );
QuestionBox.prototype.constructor = QuestionBox;

QuestionBox.prototype.launch = function()  {
// for use if autoLaunch=false in constructor
  $(this.element).dialog ( this.options );
}

QuestionBox.prototype.close = function()  {
  if (this.initiated)
    $(this.element).dialog ( 'close' );
}


// -------------------------------------------------------------------------
// InputBox class

function InputBox ( title )  {
  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  this.grid = null;
  document.body.appendChild ( this.element );
}

InputBox.prototype = Object.create ( Widget.prototype );
InputBox.prototype.constructor = InputBox;

InputBox.prototype.setText = function ( text,icon_name='' )  {

  if (icon_name)  {
    this.grid = new Grid ( '' );
    this.addWidget        ( this.grid );
    this.grid.setLabel    ( ' ',0,0,1,1 );
    this.grid.setCellSize ( '','6px', 0,0 );
    // this.grid.setImage    ( image_path(icon_name),'48px','48px', 1,0,1,1 );
    this.setIcon          ( icon_name );
    this.grid.setLabel    ( '&nbsp;&nbsp;&nbsp;',0,1,2,1 );
    this.grid.setLabel    ( text,0,2,2,1 );
    this.grid.setVerticalAlignment ( 0,2,'middle' );
  } else
    this.element.innerHTML = message;

}

InputBox.prototype.setIcon = function ( icon_name )  {
  if (this.grid)
    this.grid.setImage ( image_path(icon_name),'48px','48px', 1,0,1,1 );
}

InputBox.prototype.launch = function ( name_btn,add_func )  {

  this.options = {
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {}
  };

  this.options.buttons[name_btn] = function() {
    if (add_func())
      $(this).dialog ( 'close' );
  }

  this.options.buttons['Cancel'] = function() {
    $(this).dialog ( 'close' );
  }

  $(this.element).dialog ( this.options );

}


// -------------------------------------------------------------------------
// WebAppBox class


function _calc_viewer_size ( widthF,heightF )  {
  //var jq = window.parent.$;
  //var w  = jq(window.parent).width () - 40;
  //var h  = jq(window.parent).height() - 64;

  let w0 = window.parent.innerWidth;
  let h0 = window.parent.innerHeight;
  let w = w0 - 40;
  let h = h0 - 56;

  if (!window.parent.__any_mobile_device) {
    h -= 8;
    if ((typeof window.parent.__touch_device === 'undefined') ||
      (!window.parent.__touch_device)) {
      if (widthF > 0.0) w = widthF * Math.min(w0, h);
      if (heightF > 0.0) h = heightF * Math.min(w0, h);
    }
  }

  return [w, h];

}


function WebAppBox ( title )  {

  // var doc = window.parent.document;
  // $ = window.parent.$;

  // if (!$) {
  //   // doc = window.document;
  //   $ = window.$;
  // }

  this.onClose_func        = null;
  this.onToolbarClose_func = null;

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element  );

  // $(this.element).css({
  //   'box-shadow': '8px 8px 16px 16px rgba(0,0,0,0.2)',
  //   'overflow'  : 'hidden'
  // });

  this.setScrollable ( 'hidden','hidden' );
  this.setShade      ( '8px 8px 16px 8px rgba(212,212,212,1.0)',
                       'none',
                       __active_color_mode );

  this.iframe = new IFrame ( '' );
  $(this.iframe.element).css({
    'border'  : 'none',
    'overflow': 'hidden'
  });

  this.addWidget ( this.iframe );
  this.fid = setCommunicatingIFrame ( this,this.iframe );

  let size;
  if (window.parent.__any_mobile_device)
       size = _calc_viewer_size ( 1.0, 1.0 );
  else if (window.parent.__user_settings && window.parent.__user_settings.viewers_size)
       size = _calc_viewer_size ( window.parent.__user_settings.viewers_size[0],
                                  window.parent.__user_settings.viewers_size[1] );
  else size = _calc_viewer_size ( 1.25, 0.85 );

  $(this.iframe.element).width  ( size[0] );
  $(this.iframe.element).height ( size[1] );

  this.iframe.setSize_px ( size[0],size[1] );

  //dialog.style.fontSize = '16px';

  let self = this;

  this.options = {
    resizable     : true,
    height        : 'auto',
    width         : 'auto',
    modal         : false,
    title         : title,
    effect        : 'fade',
    headerVisible : false,
    create        : function() { 
                      self.iframe.getDocument().focus(); 
                      // $(this).closest('div.ui-dialog')
                      //        .find('.ui-dialog-titlebar-close')
                      //        .click(function(e) {
                      //          alert('hi');
                      //          e.preventDefault();
                      //          return true;
                      //        });
                    },
    focus         : function() { self.iframe.getDocument().focus(); },
    open          : function() { self.iframe.getDocument().focus(); },
    dragStop      : function() { self.iframe.getDocument().focus(); },
    resizeStop    : function() { self.iframe.getDocument().focus(); },
    beforeClose   : function (e, ui)  {
      if ($(e.currentTarget).hasClass('ui-dialog-titlebar-close'))  {
        if (self.onToolbarClose_func && self.onToolbarClose_func())  {
          // alert ( ' prevented' );
          e.preventDefault();
        }
      }
    },
    buttons       : {}
  };

  if (window.parent.__any_mobile_device) {
    this.options.position = {
      my: 'left top',   // job dialog position reference
      at: 'left top'
    }; // job dialog offset in the screen
    this.options.resizable = false;
    this.options.modal     = true;
  }

  // var dlg = jq(dialog).dialog(this.options);
  // //if (window.parent.__mobile_device)
  // //  dlg.siblings('.ui-dialog-titlebar').remove();

  // function encode_uri(uri) {
  //   if (uri) return encodeURI(uri);
  //   return uri;
  // }

  // var html = makeUglyMolHtml(encode_uri(xyz_uri), encode_uri(mtz_uri),
  //   encode_uri(map_uri), encode_uri(diffmap_uri),
  //   mapLabels);
  // iframe.contentWindow.document.write(html);
  // iframe.contentWindow.document.close();


}

WebAppBox.prototype = Object.create(Widget.prototype);
WebAppBox.prototype.constructor = WebAppBox;

WebAppBox.prototype.setOnCloseFunction = function ( onClose_func )  {
  this.onClose_func = onClose_func;
}

WebAppBox.prototype.setOnToolbarCloseFunction = function ( onToolbarClose_func )  {
  this.onToolbarClose_func = onToolbarClose_func;
}

WebAppBox.prototype.launch = function() {

  $(this.element).dialog ( this.options );

  let self = this;

  let resize_func = function()  {
    let w = $(self.element).width ();
    let h = $(self.element).height();
    self.iframe.setSize_px ( w,h );
  }

  extendToolbar ( this,{
    "maximize" : function(evt, dlg){ resize_func(); },
    // "minimize" : function(evt, dlg){ resize_func(); },
    "restore"  : function(evt, dlg){ resize_func(); }
  });

  $(this.element).on('dialogresize', function(event,ui){
    resize_func();
    // var w = $(self.element).width();
    // var h = $(self.element).height();
    // self.iframe.setSize_px ( w,h );
  });

  $(this.element).on("dialogclose", function(event,ui){
    window.setTimeout ( function(){
      if (self.onClose_func)
        self.onClose_func();
      $(self.element).dialog("destroy");
      if (self.element.parentNode)
        self.element.parentNode.removeChild ( self.element );
      removeCommunicatingIFrame ( self.fid );
    },10);
  });

  $(this.element).click ( function(){
    self.iframe.getDocument().focus();
  });

}

WebAppBox.prototype.close = function()  {
  $(this.element).dialog ( 'close' );
}
