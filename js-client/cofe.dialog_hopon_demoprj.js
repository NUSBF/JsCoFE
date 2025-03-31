
/*
 *  =================================================================
 *
 *    18.02.23   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_hopon_project.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Hop-on Demo Project Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2023
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// Import project dialog class

function HopOnDemoProjectDialog ( onSuccess_func )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Proceed to Demo Project' );
  document.body.appendChild ( this.element );

  let grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Proceed to Demo Project</h3>',0,0,1,1 );

  let msgLabel = new Label ( 'Project "' + __url_parameters.project +
                             '" is being prepared, please wait ...' );
  grid.setWidget ( msgLabel, 1,0,1,1 );


//  w = 3*$(window).width()/5 + 'px';

  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : 'auto',
    modal     : true,
    open      : function(event, ui) {
      $(this).closest('.ui-dialog').find('.ui-dialog-titlebar-close').hide();
    },
    buttons   : [
      {
        id    : "cancel_btn",
        text  : "Cancel",
        click : function() {
          $(this).dialog("close");
        }
      }
    ]
  });

  let dlg = this;
  $(dlg.element).on( "dialogclose",function(event,ui){
    serverRequest ( fe_reqtype.finishPrjImport,0,'Finish Project Import',
                    null,function(){
      window.setTimeout ( function(){
        $(dlg.element).dialog( "destroy" );
        dlg.delete();
      },10 );
    },function(){} );  // depress error messages
  });

  serverRequest ( fe_reqtype.startDemoImport,{
                      'cloudmount' : __url_parameters.cmount,
                      'demoprj'    : { 'name' : __url_parameters.project },
                      'duplicate'  : true
                  },'Demo Project Loading',function(rdata){  // ok

    let progressBar = new ProgressBar ( 0 );
    grid.setWidget ( progressBar, 2,0,1,1 );

    function checkReady() {
      serverRequest ( fe_reqtype.checkPrjImport,0,'Demo Project Import',function(data){
        if (!data.signal)
          window.setTimeout ( checkReady,1000 );
        else {
          progressBar.hide();
          $( "#cancel_btn" ).button ( "option","label","Close" );
          if (data.signal=='Success')  {
            msgLabel.setText ( 'Demo Project "' + data.name + '" is prepared, ' +
                               'you may close this dialog now.' );
            if (onSuccess_func)
              onSuccess_func();
          } else
            msgLabel.setText ( 'Demo Project "' + data.name + '" failed to import, ' +
                               'the reason being:<p><b><i>' + data.signal +
                               '</i></b>.' );
        }
      },null,function(){
        window.setTimeout ( checkReady,1000 );  // depress error messages
      });
    }

    window.setTimeout ( checkReady,2000 );

  },
  function ( key,rdata){  // always
    if (rdata.status!='ok')
      $(dlg.element).dialog("close");
  },
  function(xhr,err){  // fail
  });

  __url_parameters = null;

}


HopOnDemoProjectDialog.prototype = Object.create ( Widget.prototype );
HopOnDemoProjectDialog.prototype.constructor = HopOnDemoProjectDialog;
