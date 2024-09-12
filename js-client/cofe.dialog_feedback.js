
/*
 *  =================================================================
 *
 *    06.09.24   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_feedback.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Feedback Agreement Dialog
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
// Feedback dialog class


function FeedbackDialog ( current_agreement,onclose_fnc )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Feedback Agreement' );
  document.body.appendChild ( this.element );

  let grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Feedback Agreement</h3>',0,0,1,3 );

  grid.setLabel ( 'We all know that software bugs are common, but may be ' +
                  'difficult to discover. CCP4 is a community-driven project, ' +
                  'which relies on users like yourself for continuing development ' +
                  'and improvement, and here we ask you for help. ' +
                  'Please indicate your agreement to provide CCP4 with a ' +
                  'feedback on software performance, including data that may ' +
                  'be useful for finding bugs and rectifying faults. ' +
                  'Please read through the following options and choose one ' +
                  'that is suitable for you.<p>' +
                  'Note: <i>You may change your mind at any time. Just go to ' +
                  'your personal settings (page "My Account"), and give your ' +
                  'preference for the Feedback Agreement. The change will have ' +
                  'immediate effect for all new jobs</i>.' +
                  '<p>Should you have any questions, please contact CCP4 at ' +
                  '<a href="mailto:' + __maintainerEmail +
                       '?Subject=Feedback%20enquiry">' + __maintainerEmail +
                  '</a>.<br>&nbsp;',1,0,1,3 );

  let agree1_btn  = new RadioButton ( 'Agreement (1)',false );
  let agree2_btn  = new RadioButton ( 'Agreement (2)',false );
  let decline_btn = new RadioButton ( 'Decline'      ,false );

  grid.setWidget ( agree1_btn ,2,0,1,1 );
  grid.setWidget ( agree2_btn ,3,0,1,1 );
  grid.setWidget ( decline_btn,4,0,1,1 );

  grid.setLabel ( '&nbsp;',2,1,1,1 ).setWidth_px ( 10 );

  grid.setLabel (
    'You may want to choose this agreement if (a) your data <i>may be</i> ' +
    'offered for fault investigation by CCP4 developers and (b) you wish to ' +
    'help CCP4 to improve the software you use. If you choose this option, ' +
    'all data related to fault events, arising in your jobs, will be retained ' +
    'in a special safe area of ' + appName() + ', such that thus noted faults ' +
    'can be reproduced and investigated by CCP4 developers. Please note that ' +
    'failed jobs will be retained in the safe <i>automatically, silently and ' +
    'regardlessly of whether they are deleted in your Project or not</i>. ' +
    'The safe area cannot be accessed by general public, and shall be available ' +
    'only to CCP4 developers with the sole purpose of fault investigation, ' +
    'tests and software improvement.<br>&nbsp;',
    2,2,1,1 );

  grid.setLabel (
    'You may choose this agreement if, in addition to all terms listed for ' +
    '<i>Agreement (1)</i>, you also agree that CCP4 developers may contact ' +
    'you. In most cases, they may be interested in the origin of data that ' +
    'caused a particular effect, but sometimes they may wish to inform you of ' +
    'possible workarounds or simply let you know that the problem is fixed.' +
    '<br>&nbsp;',
    3,2,1,1 );

  grid.setLabel (
    'You should choose this option if your data <i>may not be</i> ' +
    'offered for fault investigation, or if you do not agree with terms of ' +
    'any of above agreements. If you choose this option, only fault ' +
    'events, arised in your jobs, will be noted in ' + appName() + ' log files.' +
    'These fault records will contain no reference to fault circumstances ' +
    'and can be used only for general summary compilations. No data from your ' +
    'jobs, whether failed or not, will be made available to anybody for any ' +
    'purposes.<br>&nbsp;',
    4,2,1,1 );

  grid.setCellSize ( '100%','',2,2 );

  let w = 3*$(window).width()/5 + 'px';
  let choose_id = 'choose_btn_' + __id_cnt++;


  $(this.element).dialog({
    resizable : false,
    height    : 'auto',
    maxHeight : 500,
    width     : w,
    modal     : true,
    create    : function (e, ui) {
      if (current_agreement==feedback_code.agree1)
        agree1_btn.setValue ( true );
      else if (current_agreement==feedback_code.agree2)
        agree2_btn.setValue ( true );
      else if (current_agreement==feedback_code.decline)
        decline_btn.setValue ( true );
      else
        $('#'+choose_id).button ( 'disable' );
    },
    buttons: [
      {
        id   : choose_id,
        text : 'Choose',
        click: function() {
          if (agree1_btn.getValue())
                onclose_fnc ( feedback_code.agree1  );
          else if (agree2_btn.getValue())
                onclose_fnc ( feedback_code.agree2  );
          else  onclose_fnc ( feedback_code.decline );
          $(this).dialog("close");
        }
      },
      {
        id   : "cancel_btn",
        text : "Cancel",
        click: function() {
          onclose_fnc ( current_agreement );
          $(this).dialog("close");
        }
      }
    ]
  });

  agree1_btn .setWidth_px ( $(agree2_btn.element).width() );
  decline_btn.setWidth_px ( $(agree2_btn.element).width() );

  $(agree1_btn.element).click ( function(){
    $('#'+choose_id).button ( 'enable' );
    agree2_btn .setValue ( false );
    decline_btn.setValue ( false );
  });

  $(agree2_btn.element).click ( function(){
    $('#'+choose_id).button ( 'enable' );
    agree1_btn .setValue ( false );
    decline_btn.setValue ( false );
  });

  $(decline_btn.element).click ( function(){
    $('#'+choose_id).button ( 'enable' );
    agree1_btn .setValue ( false );
    agree2_btn .setValue ( false );
  });

}

FeedbackDialog.prototype = Object.create ( Widget.prototype );
FeedbackDialog.prototype.constructor = FeedbackDialog;
