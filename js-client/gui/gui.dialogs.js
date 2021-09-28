
/*
 *  =================================================================
 *
 *    28.09.21   <--  Date of Last Modification.
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
 *  (C) E. Krissinel, A. Lebedev 2016-2021
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */


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
      "Ok": function() {
        $( this ).dialog( "close" );
      }
    }
  }

}

Dialog.prototype = Object.create ( Widget.prototype );
Dialog.prototype.constructor = Dialog;

Dialog.prototype.launch = function()  {
  $(this.element).dialog ( this._options );
}


// -------------------------------------------------------------------------
// MessageBox class

function MessageBox ( title,message )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  this.element.innerHTML = message;
  document.body.appendChild ( this.element );

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {
      "Ok": function() {
        $( this ).dialog( "close" );
      }
    }
  });

}

MessageBox.prototype = Object.create ( Widget.prototype );
MessageBox.prototype.constructor = MessageBox;



function MessageBoxW ( title,message,width_ratio )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  this.element.innerHTML = message;
  document.body.appendChild ( this.element );

  var w = Math.round(width_ratio*$(window).width()) + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    width     : w,
    modal     : true,
    buttons: {
      "Ok": function() {
        $( this ).dialog( "close" );
      }
    }
  });

}

MessageBoxW.prototype = Object.create ( Widget.prototype );
MessageBoxW.prototype.constructor = MessageBoxW;



function MessageBoxF ( title,message,btn_name,onClick_func,uncloseable_bool )  {

  Dialog.call ( this,title );
  this.element.innerHTML = message;

  this._options = {
    resizable : false,
    height    : 'auto',
    width     : 'auto',
    modal     : true,
    buttons   : {}
  }

  this._options.buttons[btn_name] = function() {
    $( this ).dialog( "close" );
    if (onClick_func)
      window.setTimeout ( onClick_func,0 );
  }

  if (uncloseable_bool)  {
    this._options.closeOnEscape = false;
    this._options.open = function(event, ui) {
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

function HelpBox ( title,helpURL,onDoNotShowAgain_func )  {

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
  $(this.display.element).css({'overflow':'hidden'});
  this.addWidget ( this.display );
  $(this.element).css({'overflow':'hidden'});

  this.history_length   = -1;
  this.history_position = -1;
  this.history_control  = 0;

  document.body.appendChild ( this.element );
//  document.body.style.fontSize = '16px';

  var w0 = 1000;
  var h0 = 600;
  if (__any_mobile_device)  {
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

  var tstamp = Date.now();
  this.options = {
    width   : w0,
    height  : h0,
    modal   : false,
    buttons : [
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
    ]
  };

  this.options.resizable = !__any_mobile_device;

  if (onDoNotShowAgain_func)  {
    this.options.buttons = this.options.buttons.concat ([
      { text : "Do not show again",
        click: function() {
          $( this ).dialog( "close" );
          onDoNotShowAgain_func ( 1,helpURL );
        }
      },
      { text : "Close",
        // icons: { primary: 'ui-icon-closethick' },
        click: function() {
          $( this ).dialog( "close" );
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
          $( this ).dialog( "close" );
        }
      }
    ]);
  }

  var body = this.display.element.contentWindow.document.querySelector('body');
  body.style.fontSize = '16px';

  if (!__any_mobile_device)  {
    this.options.width  = w0;
    this.options.height = h0 + 116;
  }

  var loading_msg = '<html><body><h2>Loading ...</h2></body></html>';

  (function(dlg){

    dlg.options.buttons[0].click = function() {
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

    dlg.options.buttons[1].click = function() {
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

    dlg.options.buttons[2].click = function() {
      dlg.history_length   = -1;
      dlg.history_position = -1;
      dlg.display.loadPage ( helpURL );
    };

    dlg.options.buttons[3].click = function() {
      var url = helpURL;
      try {
        url = dlg.display.getDocument().location.href;
      } catch(e) {}
      $( this ).dialog( "close" );
      window.setTimeout ( function(){
        window.open ( url );
      },0 );
    };

    dlg.options.create = function(event,ui) {
      dlg.display.setHTML ( loading_msg );
      dlg.resizeDisplay ( w0,h0 );
      dlg.history_length   = -2;
      dlg.history_position = -2;
    }

  }(this))

  var dialog = $(this.element).dialog ( this.options );
  if (__any_mobile_device)
    dialog.siblings('.ui-dialog-titlebar').remove();

  (function(dlg){

    $(dlg.element).on ( 'dialogresize', function(event,ui){
      dlg.resizeDisplay ( dlg.width_px(),dlg.height_px() );
    });

    $(dlg.display.element).on('load',function(){

      // var body = dlg.display.element.contentWindow.document.querySelector('body');
      // body.style.fontSize = '16px';
      //
      // if (!__any_mobile_device)  {
      //   dlg.options.width  = w0;
      //   dlg.options.height = h0 + 116;
      // }
      //
      // var dialog = $(dlg.element).dialog ( dlg.options );
      // if (__any_mobile_device)
      //   dialog.siblings('.ui-dialog-titlebar').remove();

      // alert ( ' >>> ' + dlg.display.getDocument().location );

      if (!dlg.history_control)  {
        dlg.history_position++;
        dlg.history_length = dlg.history_position;
        // dlg.history.push ( dlg.display.getDocument().location.href );
        // dlg.history.push ( 'xx' );
      }
      dlg.history_control = 0;

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

      dlg.resizeDisplay ( w0,h0 );

    });

    $(dlg.element).on( "dialogclose",function(event,ui){
      $(dlg.element).dialog( "destroy" );
      dlg.delete();
    });

    window.setTimeout ( function(){
      dlg.display.loadPage ( helpURL );
    },10);

  }(this))

  // this.display.loadPage ( helpURL );

}

HelpBox.prototype = Object.create ( Widget.prototype );
HelpBox.prototype.constructor = HelpBox;

function launchHelpBox ( title,helpURL,onDoNotShowAgain_func,delay_msec )  {
  window.setTimeout ( function(){
    new HelpBox ( title,helpURL,onDoNotShowAgain_func );
  },delay_msec);
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
    process_wait ( function(){
      $(dlg).dialog('close');
    });
  }(this.element));

}

WaitDialog.prototype = Object.create ( Widget.prototype );
WaitDialog.prototype.constructor = WaitDialog;


// -------------------------------------------------------------------------
// QuestionBox class

function QuestionBox ( title,message,btn1_name,onButton1_func,
                                     btn2_name,onButton2_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  this.element.innerHTML = message;
  document.body.appendChild ( this.element );

  this.options = {
    resizable     : false,
    height        : 'auto',
    width         : 'auto',
    modal         : true,
    closeOnEscape : false,
    open          : function(event, ui) {
                      //hide close button.
                      $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
                    },
    buttons       : {}
  };

  this.options.buttons[btn1_name] = function() {
    $( this ).dialog( "close" );
    if (onButton1_func)
      window.setTimeout ( onButton1_func,0);
  }

  if (btn2_name)
    this.options.buttons[btn2_name] = function() {
      $( this ).dialog( "close" );
      if (onButton2_func)
        window.setTimeout ( onButton2_func,0);
    }

  $(this.element).dialog ( this.options );

}

QuestionBox.prototype = Object.create ( Widget.prototype );
QuestionBox.prototype.constructor = QuestionBox;

QuestionBox.prototype.close = function()  {
  $(this.element).dialog( "close" );
}


// -------------------------------------------------------------------------
// InputBox class

function InputBox ( title )  {
  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title',title );
  document.body.appendChild ( this.element );
}

InputBox.prototype = Object.create ( Widget.prototype );
InputBox.prototype.constructor = InputBox;

InputBox.prototype.setText = function ( text )  {
  this.element.innerHTML = text;
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
      $(this).dialog( "close" );
  }

  this.options.buttons['Cancel'] = function() {
    $(this).dialog( "close" );
  }

  $(this.element).dialog ( this.options );

}
