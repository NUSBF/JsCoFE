
/*
 *  =================================================================
 *
 *    12.03.25   <--  Date of Last Modification.
 *                   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  -----------------------------------------------------------------
 *
 *  **** Module  :  js-client/cofe.dialog_licence.js
 *       ~~~~~~~~~
 *  **** Project :  jsCoFE - javascript-based Cloud Front End
 *       ~~~~~~~~~
 *  **** Content :  Licence Dialog
 *       ~~~~~~~~~
 *
 *  (C) E. Krissinel, A. Lebedev 2016-2025
 *
 *  =================================================================
 *
 *  Requires: 	jquery.js
 *              gui.widgets.js
 *
 */

'use strict';

// -------------------------------------------------------------------------
// License dialog class

function LicenceDialog ( current_licence,onclose_fnc )  {

  Widget.call ( this,'div' );
  this.element.setAttribute ( 'title','Licence' );
  document.body.appendChild ( this.element );

  let grid = new Grid('');
  this.addWidget ( grid );
  grid.setLabel ( '<h3>Choose your licence type</h3>',0,0,1,3 );

  grid.setLabel ( 'Using CCP4 Software is subject to appropriate licencing. ' +
                  'Please choose licence, applicable to your situation, from ' +
                  'choices below. In case of doubts, please contact CCP4 at ' +
                  '<a href="mailto:' + __maintainerEmail +
                    '?Subject=License%20enquiry">' + __maintainerEmail +
                  '</a>.<br>&nbsp;',1,0,1,3 );

  let academic_btn   = new RadioButton ( 'Academic'  ,false );
  let commercial_btn = new RadioButton ( 'Commercial',false );

//  academic_btn  .setWidth ( '100%' );
//  commercial_btn.setWidth ( '90%' );

  grid.setWidget ( academic_btn  ,2,0,1,1 );
  grid.setWidget ( commercial_btn,3,0,1,1 );

  grid.setLabel ( '&nbsp;',2,1,1,1 ).setWidth_px ( 10 );

  grid.setLabel (
    'You may choose this license if you are employed by a publicly-funded or ' +
    'educational research organisation, such as an University, National '+
    'Laboratory, Research Council or similar, and all results of your research ' +
    'may be published in open journals. This excludes working on industrial ' +
    'contracts, if all or some of the results become a private property of ' +
    'funders or may not be published. Academic licences are free of charge ' +
    'but require a formal registration with CCP4. By choosing Academic Licence ' +
    'you hereby give your permission to retain your registration data by CCP4. ' +
    'Your data will be used only for verification of you as a user and for ' +
    'anonymous statistics.<br>&nbsp;',2,2,1,1 );

  grid.setLabel ( 'You should choose this licence if you are employed by any ' +
    'commercial (for-profit) organisation, such as a pharmaceutical company, ' +
    'or if any part of your work is funded by such an organisation, leading to ' +
    'a restricted public access to your results or impossibility to publish ' +
    'them freely. This applies to otherwise academic groups working on ' +
    'industrial contracts, where final results or part of them become a private ' +
    'property of funders. Commercial licences are subject to paying a licence ' +
    'fee. Please contact CCP4 at <a ' +
    'href="mailto:' + __maintainerEmail + '?Subject=License%20enquiry">' +
    __maintainerEmail + '</a> ' +
    'in order to obtain licence terms and quote. You should not use CCP4 Software ' +
    'if you qualify for Commercial Licence but have not acquired one yet. Note ' +
    'that CCP4 Licences are issued on per-organisation basis, therefore, you may ' +
    'wish to check whether you are already covered by your Employer.<br>&nbsp;',
    3,2,1,1 );

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
      if (current_licence==licence_code.academic)
        academic_btn.setValue ( true );
      else if (current_licence==licence_code.commercial)
        commercial_btn.setValue ( true );
      else
        $('#'+choose_id).button ( 'disable' );
    },
    buttons: [
      {
        id   : choose_id,
        text : 'Choose',
        click: function() {
          if (academic_btn.getValue())
                onclose_fnc ( licence_code.academic   );
          else  onclose_fnc ( licence_code.commercial );
          $(this).dialog('close');
        }
      },
      {
        id   : 'cancel_btn_' + __id_cnt++,
        text : 'Cancel',
        click: function() {
          onclose_fnc ( current_licence );
          $(this).dialog('close');
        }
      }
    ]
  });

  academic_btn.setWidth_px ( $(commercial_btn.element).width() );

  $(academic_btn.element).click ( function(){
    $('#'+choose_id).button ( 'enable' );
    commercial_btn.setValue ( false );
  });

  $(commercial_btn.element).click ( function(){
    $('#'+choose_id).button ( 'enable' );
    academic_btn.setValue ( false );
  });

}

LicenceDialog.prototype = Object.create ( Widget.prototype );
LicenceDialog.prototype.constructor = LicenceDialog;
